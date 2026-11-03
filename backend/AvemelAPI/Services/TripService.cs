using System.ComponentModel.DataAnnotations;
using System.Data;
using Avemel.API.Constants;
using Avemel.API.Data;
using Avemel.API.DTOs.Trips;
using Avemel.API.Models;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Avemel.API.Services
{
    public class TripService : ITripService
    {
        private readonly AppDbContext _db;

        public TripService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<TripResponseDto> CreateAsync(
            int driverId,
            CreateTripRequestDto request,
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
                await EnsureActiveDriverAsync(
                    driverId,
                    cancellationToken);

                var assignment = await _db.TruckAssignments
                    .Include(x => x.Truck)
                    .SingleOrDefaultAsync(
                        x => x.Id == request.AssignmentId &&
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

                if (!assignment.Truck.IsActive)
                {
                    throw new InvalidOperationException(
                        "This truck is inactive.");
                }

                // Also catches unfinished trips on an older assignment.
                var hasUnfinishedTrip = await _db.Trips.AnyAsync(
                    x => x.CompletedAt == null &&
                         (x.TruckAssignment.DriverId == driverId ||
                          x.TruckAssignment.TruckId == assignment.TruckId),
                    cancellationToken);

                if (hasUnfinishedTrip)
                {
                    throw new InvalidOperationException(
                        "The driver or truck already has an unfinished trip.");
                }

                var hasUnclearedFaults =
                    await _db.TruckFaults.AnyAsync(
                        x => x.TruckId == assignment.TruckId &&
                             x.Status != "Cleared",
                        cancellationToken);

                if (hasUnclearedFaults)
                {
                    throw new InvalidOperationException(
                        "Workshop must clear all truck faults before loading.");
                }

                // Do not use an older approval if a newer inspection exists.
                var inspection = await _db.TruckInspections
                    .Where(x => x.TruckAssignmentId == assignment.Id)
                    .OrderByDescending(x => x.CreatedAt)
                    .ThenByDescending(x => x.Id)
                    .FirstOrDefaultAsync(cancellationToken);

                if (inspection is null ||
                    inspection.Status != "Submitted" ||
                    inspection.ApprovedAt is null ||
                    inspection.ApprovedByUserId is null)
                {
                    throw new InvalidOperationException(
                        "The latest inspection must be approved by Admin before loading.");
                }

                var trip = new Trip
                {
                    TruckAssignmentId = assignment.Id,
                    TruckInspectionId = inspection.Id,
                    LoadType = request.LoadType,
                    Direction = request.Direction,
                    Status = request.LoadType == "Empty"
                               ? "Preparing"
                                : "Loading",
                    CreatedAt = DateTime.UtcNow
                };

                _db.Trips.Add(trip);

                await _db.SaveChangesAsync(cancellationToken);

                var response = await GetTripQuery()
                    .SingleAsync(
                        x => x.Id == trip.Id,
                        cancellationToken);

                await transaction.CommitAsync(cancellationToken);

                return response;
            }
            catch (Exception exception)
                when (IsTripConcurrencyConflict(exception))
            {
                throw new InvalidOperationException(
                    "Trip availability changed. Refresh and try again.",
                    exception);
            }
        }

        public async Task<TripResponseDto?> GetMyActiveAsync(
            int driverId,
            CancellationToken cancellationToken = default)
        {
            await EnsureActiveDriverAsync(
                driverId,
                cancellationToken);

            return await GetTripQuery()
                .SingleOrDefaultAsync(
                    x => x.DriverId == driverId &&
                         x.CompletedAt == null,
                    cancellationToken);
        }

        public async Task<TripResponseDto?> GetByIdAsync(
            int tripId,
            int driverId,
            CancellationToken cancellationToken = default)
        {
            await EnsureActiveDriverAsync(
                driverId,
                cancellationToken);

            return await GetTripQuery()
                .SingleOrDefaultAsync(
                    x => x.Id == tripId &&
                         x.DriverId == driverId,
                    cancellationToken);
        }

        private async Task EnsureActiveDriverAsync(
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
        }

        private IQueryable<TripResponseDto> GetTripQuery()
        {
            return _db.Trips
                .AsNoTracking()
                .Select(trip => new TripResponseDto
                {
                    Id = trip.Id,
                    AssignmentId = trip.TruckAssignmentId,
                    InspectionId = trip.TruckInspectionId,
                    TruckId = trip.TruckAssignment.TruckId,
                    RegistrationNumber =
                        trip.TruckAssignment.Truck.RegistrationNumber,
                    DriverId = trip.TruckAssignment.DriverId,
                    LoadType = trip.LoadType,
                    Direction = trip.Direction,
                    Status = trip.Status,
                    CreatedAt = trip.CreatedAt,
                    DepartureRequestedAt = trip.DepartureRequestedAt,
                    DepartureApprovedAt = trip.DepartureApprovedAt,
                    DepartureApprovedByUserId =
                        trip.DepartureApprovedByUserId,
                    StartedAt = trip.StartedAt,
                    DeliveredAt = trip.DeliveredAt,
                    CompletedAt = trip.CompletedAt,
                    CompletedByUserId = trip.CompletedByUserId
                });
        }

        private static bool IsTripConcurrencyConflict(
            Exception exception)
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
                           PostgresErrorCodes.UniqueViolation
                       && postgres.ConstraintName ==
                           "IX_Trips_TruckAssignmentId"
                   );
        }
    }
}