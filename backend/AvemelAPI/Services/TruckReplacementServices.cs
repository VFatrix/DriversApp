using System.ComponentModel.DataAnnotations;
using System.Data;
using Avemel.API.Constants;
using Avemel.API.Data;
using Avemel.API.DTOs.TruckReplacements;
using Avemel.API.Models;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Avemel.API.Services
{
    public class TruckReplacementService : ITruckReplacementService
    {
        private readonly AppDbContext _db;

        public TruckReplacementService(AppDbContext db)
        {
            _db = db;
        }

        public Task<TruckReplacementResponseDto> CreateAsync(
            int driverId,
            CreateTruckReplacementRequestDto request,
            CancellationToken cancellationToken = default)
        {
            Validate(request);

            if (string.IsNullOrWhiteSpace(request.Reason))
            {
                throw new ValidationException(
                    "Explain why a replacement truck is required.");
            }

            return InTransactionAsync(async () =>
            {
                await EnsureDriverAsync(driverId, cancellationToken);

                var assignment = await _db.TruckAssignments
                    .SingleOrDefaultAsync(
                        x => x.Id == request.AssignmentId
                             && x.DriverId == driverId,
                        cancellationToken);

                if (assignment is null)
                {
                    throw new KeyNotFoundException(
                        "Truck assignment not found.");
                }

                EnsureActiveAssignment(assignment);

                var hasFaults = await _db.TruckFaults.AnyAsync(
                    x => x.TruckId == assignment.TruckId
                         && x.Status != "Cleared",
                    cancellationToken);

                if (!hasFaults)
                {
                    throw new InvalidOperationException(
                        "The assigned truck has no uncleared faults.");
                }

                var requestExists =
                    await _db.TruckReplacementRequests.AnyAsync(
                        x => x.TruckAssignmentId == assignment.Id
                             && (
                                 x.Status == "Pending"
                                 || x.Status == "Approved"
                             ),
                        cancellationToken);

                if (requestExists)
                {
                    throw new InvalidOperationException(
                        "An active replacement request already exists.");
                }

                var replacement = new TruckReplacementRequest
                {
                    TruckAssignmentId = assignment.Id,
                    Reason = request.Reason.Trim(),
                    Status = "Pending",
                    RequestedAt = DateTime.UtcNow
                };

                _db.TruckReplacementRequests.Add(replacement);
                await _db.SaveChangesAsync(cancellationToken);

                return await GetResponseAsync(
                    replacement.Id,
                    cancellationToken);
            }, cancellationToken);
        }

        public Task<TruckReplacementResponseDto?> GetMyRequestAsync(
            int requestId,
            int driverId,
            CancellationToken cancellationToken = default)
        {
            return ResponseQuery()
                .SingleOrDefaultAsync(
                    x => x.Id == requestId && x.DriverId == driverId,
                    cancellationToken);
        }

        public Task<TruckReplacementResponseDto?> GetMyActiveAsync(
            int driverId,
             CancellationToken cancellationToken = default)
         {
            return ResponseQuery()
                .Where(x => x.DriverId == driverId
                            && (
                                x.Status == "Pending"
                                || x.Status == "Approved"
                            ))
                .OrderByDescending(x => x.RequestedAt)
                .ThenByDescending(x => x.Id)
                .FirstOrDefaultAsync(cancellationToken);
        }

        public Task<List<TruckReplacementResponseDto>> GetPendingAsync(
            CancellationToken cancellationToken = default)
        {
            return ResponseQuery()
                .Where(x => x.Status == "Pending")
                .OrderBy(x => x.RequestedAt)
                .ThenBy(x => x.Id)
                .ToListAsync(cancellationToken);
        }

        public Task<TruckReplacementResponseDto> ReviewAsync(
            int requestId,
            int reviewerId,
            ReviewTruckReplacementRequestDto request,
            CancellationToken cancellationToken = default)
        {
            Validate(request);

            if (request.Approve is null)
            {
                throw new ValidationException(
                    "Choose whether to approve the request.");
            }

            if (string.IsNullOrWhiteSpace(request.ReviewNotes))
            {
                throw new ValidationException(
                    "Explain the review decision.");
            }

            return InTransactionAsync(async () =>
            {
                var canReview = await _db.Users.AnyAsync(
                    x => x.Id == reviewerId
                         && x.IsActive
                         && (
                             x.Role == UserRoles.Workshop
                             || x.Role == UserRoles.Admin
                         ),
                    cancellationToken);

                if (!canReview)
                {
                    throw new UnauthorizedAccessException(
                        "An active Workshop or Admin account is required.");
                }

                var replacement = await _db.TruckReplacementRequests
                    .Include(x => x.TruckAssignment)
                    .SingleOrDefaultAsync(
                        x => x.Id == requestId,
                        cancellationToken);

                if (replacement is null)
                {
                    throw new KeyNotFoundException(
                        "Replacement request not found.");
                }

                if (replacement.Status != "Pending")
                {
                    throw new InvalidOperationException(
                        "Only pending requests can be reviewed.");
                }

                EnsureActiveAssignment(replacement.TruckAssignment);

                if (request.Approve == true)
                {
                    var hasFaults = await _db.TruckFaults.AnyAsync(
                        x => x.TruckId
                                 == replacement.TruckAssignment.TruckId
                             && x.Status != "Cleared",
                        cancellationToken);

                    if (!hasFaults)
                    {
                        throw new InvalidOperationException(
                            "The assigned truck has no uncleared faults.");
                    }
                }

                replacement.Status = request.Approve == true
                    ? "Approved"
                    : "Rejected";

                replacement.ReviewedByUserId = reviewerId;
                replacement.ReviewedAt = DateTime.UtcNow;
                replacement.ReviewNotes = request.ReviewNotes.Trim();

                await _db.SaveChangesAsync(cancellationToken);

                return await GetResponseAsync(
                    replacement.Id,
                    cancellationToken);
            }, cancellationToken);
        }

        public Task<TruckReplacementResponseDto> ChooseTruckAsync(
            int requestId,
            int driverId,
            ChooseReplacementTruckRequestDto request,
            CancellationToken cancellationToken = default)
        {
            Validate(request);

            return InTransactionAsync(async () =>
            {
                await EnsureDriverAsync(driverId, cancellationToken);

                var replacement = await _db.TruckReplacementRequests
                    .Include(x => x.TruckAssignment)
                    .SingleOrDefaultAsync(
                        x => x.Id == requestId
                             && x.TruckAssignment.DriverId == driverId,
                        cancellationToken);

                if (replacement is null)
                {
                    throw new KeyNotFoundException(
                        "Replacement request not found.");
                }

                if (replacement.Status != "Approved")
                {
                    throw new InvalidOperationException(
                        "The replacement request must be approved first.");
                }

                var original = replacement.TruckAssignment;
                EnsureActiveAssignment(original);

                if (request.TruckId == original.TruckId)
                {
                    throw new ValidationException(
                        "Select a different truck.");
                }

                var truck = await _db.Trucks
                    .SingleOrDefaultAsync(
                        x => x.Id == request.TruckId,
                        cancellationToken);

                if (truck is null)
                {
                    throw new KeyNotFoundException(
                        "Replacement truck not found.");
                }

                var isAssigned = await _db.TruckAssignments.AnyAsync(
                    x => x.TruckId == truck.Id
                         && x.ReleasedAt == null,
                    cancellationToken);

                var hasFaults = await _db.TruckFaults.AnyAsync(
                    x => x.TruckId == truck.Id
                         && x.Status != "Cleared",
                    cancellationToken);

                if (!truck.IsActive || isAssigned || hasFaults)
                {
                    throw new InvalidOperationException(
                        "The replacement truck is not available.");
                }

                var switchedAt = DateTime.UtcNow;

                original.ReleasedAt = switchedAt;
                original.ReleasedByUserId = driverId;
                original.ReleaseReason =
                    $"Approved truck replacement request #{replacement.Id}.";

                // Release trailers linked to the original truck assignment.
                // Keep the records for assignment history.
                var assignedTrailers = await _db.TrailerAssignments
                    .Where(x =>
                        x.TruckAssignmentId == original.Id &&
                        x.ReleasedAt == null)
                    .ToListAsync(cancellationToken);

                foreach (var trailerAssignment in assignedTrailers)
                {
                    trailerAssignment.ReleasedAt = switchedAt;
                    trailerAssignment.ReleasedByUserId = driverId;
                    trailerAssignment.ReleaseReason =
                        $"Truck replaced through approved request #{replacement.Id}.";
                }

                // Release first so the driver's unique active-assignment
                // index allows the new assignment.
                // Both saves remain inside the same transaction.
                await _db.SaveChangesAsync(cancellationToken);

                var newAssignment = new TruckAssignment
                {
                    TruckId = truck.Id,
                    DriverId = driverId,
                    AssignedAt = switchedAt
                };

                _db.TruckAssignments.Add(newAssignment);

                replacement.ReplacementTruckAssignment = newAssignment;
                replacement.Status = "Completed";
                replacement.CompletedAt = switchedAt;

                await _db.SaveChangesAsync(cancellationToken);

                return await GetResponseAsync(
                    replacement.Id,
                    cancellationToken);
            }, cancellationToken);
        }

        private async Task EnsureDriverAsync(
            int driverId,
            CancellationToken cancellationToken)
        {
            var isDriver = await _db.Users.AnyAsync(
                x => x.Id == driverId
                     && x.IsActive
                     && x.Role == UserRoles.Driver,
                cancellationToken);

            if (!isDriver)
            {
                throw new UnauthorizedAccessException(
                    "An active driver account is required.");
            }
        }

        private static void EnsureActiveAssignment(
            TruckAssignment assignment)
        {
            if (assignment.ReleasedAt is not null)
            {
                throw new InvalidOperationException(
                    "This truck assignment has been released.");
            }
        }

        private static void Validate(object request)
        {
            Validator.ValidateObject(
                request,
                new ValidationContext(request),
                validateAllProperties: true);
        }

        private async Task<TruckReplacementResponseDto> GetResponseAsync(
            int requestId,
            CancellationToken cancellationToken)
        {
            return await ResponseQuery()
                .SingleAsync(
                    x => x.Id == requestId,
                    cancellationToken);
        }

        private IQueryable<TruckReplacementResponseDto> ResponseQuery()
        {
            return _db.TruckReplacementRequests
                .AsNoTracking()
                .Select(x => new TruckReplacementResponseDto
                {
                    Id = x.Id,
                    AssignmentId = x.TruckAssignmentId,
                    DriverId = x.TruckAssignment.DriverId,
                    TruckId = x.TruckAssignment.TruckId,
                    Reg = x.TruckAssignment.Truck.RegistrationNumber,
                    Reason = x.Reason,
                    Status = x.Status,
                    RequestedAt = x.RequestedAt,
                    ReviewedByUserId = x.ReviewedByUserId,
                    ReviewedAt = x.ReviewedAt,
                    ReviewNotes = x.ReviewNotes,
                    ReplacementTruckAssignmentId =
                        x.ReplacementTruckAssignmentId,

                    ReplacementTruckId =
                        x.ReplacementTruckAssignment != null
                            ? (int?)x.ReplacementTruckAssignment.TruckId
                            : null,

                    ReplacementReg =
                        x.ReplacementTruckAssignment != null
                            ? x.ReplacementTruckAssignment.Truck
                                .RegistrationNumber
                            : null,

                    CompletedAt = x.CompletedAt
                });
        }

        private async Task<TruckReplacementResponseDto> InTransactionAsync(
            Func<Task<TruckReplacementResponseDto>> action,
            CancellationToken cancellationToken)
        {
            await using var transaction =
                await _db.Database.BeginTransactionAsync(
                    IsolationLevel.Serializable,
                    cancellationToken);

            try
            {
                var response = await action();

                await transaction.CommitAsync(cancellationToken);

                return response;
            }
            catch (Exception exception)
                when (IsConcurrentChange(exception))
            {
                throw new InvalidOperationException(
                    "The request or truck availability changed. Refresh and try again.",
                    exception);
            }
        }

        private static bool IsConcurrentChange(Exception exception)
        {
            var postgresException = exception as PostgresException
                ?? exception.InnerException as PostgresException;

            if (postgresException is null)
            {
                return false;
            }

            return postgresException.SqlState
                       == PostgresErrorCodes.SerializationFailure
                   || postgresException.SqlState
                       == PostgresErrorCodes.DeadlockDetected
                   || (
                       postgresException.SqlState
                           == PostgresErrorCodes.UniqueViolation
                       && postgresException.ConstraintName is
                           "IX_TruckAssignments_TruckId"
                           or "IX_TruckAssignments_DriverId"
                           or "IX_TruckReplacementRequests_TruckAssignmentId"
                   );
        }
    }
}