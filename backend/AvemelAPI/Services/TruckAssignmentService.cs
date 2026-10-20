using System.ComponentModel.DataAnnotations;
using System.Data;
using Avemel.API.Constants;
using Avemel.API.Data;
using Avemel.API.DTOs.TruckAssignments;
using Avemel.API.Models;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Avemel.API.Services
{
    public class TruckAssignmentService : ITruckAssignmentService
    {
        private readonly AppDbContext _db;

        public TruckAssignmentService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<TruckAssignmentResponseDto> CreateAsync(
            int driverId,
            CreateTruckAssignmentRequestDto request,
            CancellationToken cancellationToken = default)
        {
            Validator.ValidateObject(
                request,
                new ValidationContext(request),
                validateAllProperties: true);

            await using var transaction =
                await _db.Database.BeginTransactionAsync(
                    IsolationLevel.Serializable,
                    cancellationToken);

            try
            {
                var validDriver = await _db.Users.AnyAsync(
                    user => user.Id == driverId &&
                            user.IsActive &&
                            user.Role == UserRoles.Driver,
                    cancellationToken);

                if (!validDriver)
                {
                    throw new UnauthorizedAccessException(
                        "An active driver account is required.");
                }

                var hasActiveAssignment =
                    await _db.TruckAssignments.AnyAsync(
                        assignment => assignment.DriverId == driverId &&
                                      assignment.ReleasedAt == null,
                        cancellationToken);

                if (hasActiveAssignment)
                {
                    throw new InvalidOperationException(
                        "You already have an active truck assignment.");
                }

                var truck = await _db.Trucks
                    .AsNoTracking()
                    .SingleOrDefaultAsync(
                        truck => truck.Id == request.TruckId,
                        cancellationToken);

                if (truck == null)
                {
                    throw new KeyNotFoundException("Truck not found.");
                }

                if (!truck.IsActive)
                {
                    throw new InvalidOperationException(
                        "This truck is inactive.");
                }

                var truckIsAssigned =
                    await _db.TruckAssignments.AnyAsync(
                        assignment => assignment.TruckId == truck.Id &&
                                      assignment.ReleasedAt == null,
                        cancellationToken);

                if (truckIsAssigned)
                {
                    throw new InvalidOperationException(
                        "This truck is already assigned to another driver.");
                }

                var hasUnclearedFaults =
                    await _db.TruckFaults.AnyAsync(
                        fault => fault.TruckId == truck.Id &&
                                 fault.Status != "Cleared",
                        cancellationToken);

                if (hasUnclearedFaults)
                {
                    throw new InvalidOperationException(
                        "This truck has uncleared faults.");
                }

                var assignment = new TruckAssignment
                {
                    TruckId = truck.Id,
                    DriverId = driverId,
                    AssignedAt = DateTime.UtcNow
                };

                _db.TruckAssignments.Add(assignment);

                await _db.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                return new TruckAssignmentResponseDto
                {
                    Id = assignment.Id,
                    TruckId = truck.Id,
                    RegistrationNumber = truck.RegistrationNumber,
                    MakeModel = truck.MakeModel,
                    DriverId = assignment.DriverId,
                    AssignedAt = assignment.AssignedAt,
                    ReleasedAt = null,
                    IsActive = true
                };
            }
            catch (DbUpdateException ex) when (
                ex.InnerException is PostgresException postgres &&
                postgres.SqlState == PostgresErrorCodes.UniqueViolation &&
                (postgres.ConstraintName ==
                    "IX_TruckAssignments_TruckId" ||
                 postgres.ConstraintName ==
                    "IX_TruckAssignments_DriverId"))
            {
                throw new InvalidOperationException(
                    "The truck or driver already has an active assignment. Refresh and try again.",
                    ex);
            }
            catch (DbUpdateException ex) when (
                ex.InnerException is PostgresException postgres &&
                postgres.SqlState ==
                    PostgresErrorCodes.SerializationFailure)
            {
                throw new InvalidOperationException(
                    "Availability changed during selection. Refresh and try again.",
                    ex);
            }
            catch (PostgresException ex) when (
                ex.SqlState == PostgresErrorCodes.SerializationFailure)
            {
                throw new InvalidOperationException(
                    "Availability changed during selection. Refresh and try again.",
                    ex);
            }
        }

        public async Task<TruckAssignmentResponseDto?> GetMyActiveAsync(
            int driverId,
            CancellationToken cancellationToken = default)
        {
            return await GetAssignmentQuery()
                .SingleOrDefaultAsync(
                    assignment => assignment.DriverId == driverId &&
                                  assignment.ReleasedAt == null,
                    cancellationToken);
        }

        public async Task<TruckAssignmentResponseDto?> GetByIdAsync(
            int assignmentId,
            int driverId,
            CancellationToken cancellationToken = default)
        {
            return await GetAssignmentQuery()
                .SingleOrDefaultAsync(
                    assignment => assignment.Id == assignmentId &&
                                  assignment.DriverId == driverId,
                    cancellationToken);
        }

        private IQueryable<TruckAssignmentResponseDto> GetAssignmentQuery()
        {
            return _db.TruckAssignments
                .AsNoTracking()
                .Select(assignment => new TruckAssignmentResponseDto
                {
                    Id = assignment.Id,
                    TruckId = assignment.TruckId,
                    RegistrationNumber =
                        assignment.Truck.RegistrationNumber,
                    MakeModel = assignment.Truck.MakeModel,
                    DriverId = assignment.DriverId,
                    AssignedAt = assignment.AssignedAt,
                    ReleasedAt = assignment.ReleasedAt,
                    IsActive = assignment.ReleasedAt == null
                });
        }
    }
}