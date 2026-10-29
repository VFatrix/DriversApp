using System.ComponentModel.DataAnnotations;
using System.Data;
using Avemel.API.Constants;
using Avemel.API.Data;
using Avemel.API.DTOs.TrailerAssignments;
using Avemel.API.DTOs.Trailers;
using Avemel.API.Models;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Avemel.API.Services
{
    public class TrailerAssignmentService : ITrailerAssignmentService
    {
        private readonly AppDbContext _db;

        public TrailerAssignmentService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<List<TrailerAssignmentResponseDto>>
            GetActiveAsync(
                int truckAssignmentId,
                int driverId,
                CancellationToken cancellationToken = default)
        {
            await EnsureAssignmentAsync(
                truckAssignmentId, driverId, cancellationToken);

            return await ResponseQuery(truckAssignmentId)
                .ToListAsync(cancellationToken);
        }

        public async Task<List<TrailerResponseDto>> GetAvailableAsync(
            int truckAssignmentId,
            int driverId,
            CancellationToken cancellationToken = default)
        {
            await EnsureAssignmentAsync(
                truckAssignmentId, driverId, cancellationToken);

            return await _db.Trailers
                .AsNoTracking()
                .Where(trailer =>
                    trailer.IsActive &&
                    !_db.TrailerAssignments.Any(assignment =>
                        assignment.TrailerId == trailer.Id &&
                        assignment.ReleasedAt == null &&
                        assignment.TruckAssignmentId != truckAssignmentId))
                .OrderBy(trailer => trailer.RegistrationNumber)
                .Select(trailer => new TrailerResponseDto
                {
                    Id = trailer.Id,
                    RegistrationNumber = trailer.RegistrationNumber,
                    IsActive = trailer.IsActive,
                    CreatedAt = trailer.CreatedAt
                })
                .ToListAsync(cancellationToken);
        }

        public async Task<List<TrailerAssignmentResponseDto>> SaveAsync(
            int truckAssignmentId,
            int driverId,
            SaveTrailerAssignmentsRequestDto request,
            CancellationToken cancellationToken = default)
        {
            Validator.ValidateObject(
                request,
                new ValidationContext(request),
                validateAllProperties: true);

            var ids = request.TrailerIds;

            if (ids is null ||
                ids.Count > 2 ||
                ids.Any(id => id <= 0) ||
                ids.Distinct().Count() != ids.Count)
            {
                throw new ValidationException(
                    "Select up to two different, valid trailers.");
            }

            await using var transaction =
                await _db.Database.BeginTransactionAsync(
                    IsolationLevel.Serializable,
                    cancellationToken);

            try
            {
                await EnsureAssignmentAsync(
                    truckAssignmentId, driverId, cancellationToken);

                var current = await _db.TrailerAssignments
                    .Where(x =>
                        x.TruckAssignmentId == truckAssignmentId &&
                        x.ReleasedAt == null)
                    .OrderBy(x => x.Position)
                    .ToListAsync(cancellationToken);

                // Repeated saves of the same combination change nothing.
                if (current.Select(x => x.TrailerId).SequenceEqual(ids))
                {
                    var unchanged = await ResponseQuery(truckAssignmentId)
                        .ToListAsync(cancellationToken);

                    await transaction.CommitAsync(cancellationToken);
                    return unchanged;
                }

                // Keep the combination fixed once inspection has begun.
                var hasInspection = await _db.TruckInspections.AnyAsync(
                    x => x.TruckAssignmentId == truckAssignmentId,
                    cancellationToken);

                if (hasInspection)
                {
                    throw new InvalidOperationException(
                        "Trailer selection cannot change after an inspection has started.");
                }

                var selected = await _db.Trailers
                    .Where(x => ids.Contains(x.Id))
                    .ToListAsync(cancellationToken);

                if (selected.Count != ids.Count)
                {
                    throw new KeyNotFoundException(
                        "One or more selected trailers were not found.");
                }

                if (selected.Any(x => !x.IsActive))
                {
                    throw new InvalidOperationException(
                        "One or more selected trailers are archived.");
                }

                var alreadyAssigned =
                    await _db.TrailerAssignments.AnyAsync(
                        x => ids.Contains(x.TrailerId) &&
                             x.ReleasedAt == null &&
                             x.TruckAssignmentId != truckAssignmentId,
                        cancellationToken);

                if (alreadyAssigned)
                {
                    throw new InvalidOperationException(
                        "One or more selected trailers are already assigned.");
                }

                var changedAt = DateTime.UtcNow;

                // Close old records instead of deleting history.
                foreach (var assignment in current)
                {
                    assignment.ReleasedAt = changedAt;
                    assignment.ReleasedByUserId = driverId;
                    assignment.ReleaseReason =
                        "Driver changed the trailer combination before inspection.";
                }

                // Free the unique trailer/position indexes first.
                // Both saves remain in the same transaction.
                await _db.SaveChangesAsync(cancellationToken);

                for (var index = 0; index < ids.Count; index++)
                {
                    _db.TrailerAssignments.Add(new TrailerAssignment
                    {
                        TruckAssignmentId = truckAssignmentId,
                        TrailerId = ids[index],
                        Position = index + 1,
                        AssignedAt = changedAt
                    });
                }

                await _db.SaveChangesAsync(cancellationToken);

                var response = await ResponseQuery(truckAssignmentId)
                    .ToListAsync(cancellationToken);

                await transaction.CommitAsync(cancellationToken);
                return response;
            }
            catch (Exception exception)
                when (IsConcurrentChange(exception))
            {
                throw new InvalidOperationException(
                    "Trailer availability changed. Refresh and try again.",
                    exception);
            }
        }

        private async Task EnsureAssignmentAsync(
            int truckAssignmentId,
            int driverId,
            CancellationToken cancellationToken)
        {
            var validDriver = await _db.Users.AnyAsync(
                x => x.Id == driverId &&
                     x.IsActive &&
                     x.Role == UserRoles.Driver,
                cancellationToken);

            if (!validDriver)
            {
                throw new UnauthorizedAccessException(
                    "An active driver account is required.");
            }

            var assignment = await _db.TruckAssignments
                .AsNoTracking()
                .SingleOrDefaultAsync(
                    x => x.Id == truckAssignmentId &&
                         x.DriverId == driverId,
                    cancellationToken);

            if (assignment is null)
            {
                throw new KeyNotFoundException(
                    "Truck assignment not found.");
            }

            if (assignment.ReleasedAt is not null)
            {
                throw new InvalidOperationException(
                    "This truck assignment has been released.");
            }
        }

        private IQueryable<TrailerAssignmentResponseDto> ResponseQuery(
            int truckAssignmentId)
        {
            return _db.TrailerAssignments
                .AsNoTracking()
                .Where(x =>
                    x.TruckAssignmentId == truckAssignmentId &&
                    x.ReleasedAt == null)
                .OrderBy(x => x.Position)
                .Select(x => new TrailerAssignmentResponseDto
                {
                    Id = x.Id,
                    TruckAssignmentId = x.TruckAssignmentId,
                    TrailerId = x.TrailerId,
                    Reg = x.Trailer.RegistrationNumber,
                    Position = x.Position,
                    AssignedAt = x.AssignedAt,
                    ReleasedAt = x.ReleasedAt
                });
        }

        private static bool IsConcurrentChange(Exception exception)
        {
            var postgres = exception as PostgresException
                ?? exception.InnerException as PostgresException;

            if (postgres is null)
            {
                return false;
            }

            return postgres.SqlState ==
                       PostgresErrorCodes.SerializationFailure
                || postgres.SqlState ==
                       PostgresErrorCodes.DeadlockDetected
                || (
                    postgres.SqlState ==
                        PostgresErrorCodes.UniqueViolation &&
                    postgres.ConstraintName is
                        "IX_TrailerAssignments_TrailerId"
                        or "IX_TrailerAssignments_TruckAssignmentId_Position"
                );
        }
    }
}