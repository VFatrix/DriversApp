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

        public async Task<TripResponseDto> RequestDepartureAsync(
           int tripId,
           int driverId,
        CancellationToken cancellationToken = default)
        {
            await using var transaction =
                await _db.Database.BeginTransactionAsync(
                    IsolationLevel.Serializable,
                    cancellationToken);

            try
            {
                await EnsureActiveDriverAsync(
                    driverId,
                    cancellationToken);

                var trip = await _db.Trips
                    .Include(x => x.TruckAssignment)
                        .ThenInclude(x => x.Truck)
                    .SingleOrDefaultAsync(
                        x => x.Id == tripId &&
                             x.TruckAssignment.DriverId == driverId,
                        cancellationToken);

                if (trip is null)
                {
                    throw new KeyNotFoundException("Trip not found.");
                }

                if (trip.TruckAssignment.ReleasedAt is not null)
                {
                    throw new InvalidOperationException(
                        "This truck assignment has been released.");
                }

                if (!trip.TruckAssignment.Truck.IsActive)
                {
                    throw new InvalidOperationException(
                        "This truck is inactive.");
                }

                if (trip.DepartureRequestedAt is not null ||
                    trip.DepartureApprovedAt is not null ||
                    trip.StartedAt is not null ||
                    trip.DeliveredAt is not null ||
                    trip.CompletedAt is not null)
                {
                    throw new InvalidOperationException(
                        "Departure has already been requested or the trip has progressed.");
                }

                // Accept older empty trips that were created with Loading status.
                var validStatus = trip.LoadType == "Empty"
                    ? trip.Status is "Preparing" or "Loading"
                    : trip.Status == "Loading";

                if (!validStatus)
                {
                    throw new InvalidOperationException(
                        "This trip is not ready to request departure.");
                }

                var latestInspection = await _db.TruckInspections
                    .Where(x =>
                        x.TruckAssignmentId == trip.TruckAssignmentId)
                    .OrderByDescending(x => x.CreatedAt)
                    .ThenByDescending(x => x.Id)
                    .FirstOrDefaultAsync(cancellationToken);

                if (latestInspection is null ||
                    latestInspection.Id != trip.TruckInspectionId ||
                    latestInspection.Status != "Submitted" ||
                    latestInspection.ApprovedAt is null ||
                    latestInspection.ApprovedByUserId is null)
                {
                    throw new InvalidOperationException(
                        "The trip's inspection is no longer the latest approved inspection.");
                }

                var hasUnclearedFaults = await _db.TruckFaults.AnyAsync(
                    x => x.TruckId == trip.TruckAssignment.TruckId &&
                         x.Status != "Cleared",
                    cancellationToken);

                if (hasUnclearedFaults)
                {
                    throw new InvalidOperationException(
                        "Workshop must clear all truck faults before departure.");
                }

                var requiredAngles =
                    TripLoadingRules.GetRequiredAngles(trip.LoadType);

                var savedAngles = await _db.TripLoadingPhotos
                    .Where(x => x.TripId == tripId)
                    .Select(x => x.Angle)
                    .ToListAsync(cancellationToken);

                var missingAngles = requiredAngles
                    .Except(savedAngles, StringComparer.Ordinal)
                    .ToList();

                if (missingAngles.Count > 0)
                {
                    throw new ValidationException(
                        $"Upload the required loading photos: {string.Join(", ", missingAngles)}.");
                }

                trip.DepartureRequestedAt = DateTime.UtcNow;
                trip.Status = "AwaitingDepartureApproval";

                await _db.SaveChangesAsync(cancellationToken);

                var response = await GetTripQuery()
                    .SingleAsync(
                        x => x.Id == tripId,
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



        public async Task<List<PendingDepartureResponseDto>>
      GetPendingDeparturesAsync(
        int operationsUserId,
        CancellationToken cancellationToken = default)
        {
            await EnsureActiveOperationsAsync(
                operationsUserId,
                cancellationToken);

            var requests = await _db.Trips
                .AsNoTracking()
                .Where(trip =>
                    trip.Status == "AwaitingDepartureApproval" &&
                    trip.DepartureRequestedAt != null &&
                    trip.DepartureApprovedAt == null &&
                    trip.StartedAt == null &&
                    trip.DeliveredAt == null &&
                    trip.CompletedAt == null)
                .OrderBy(trip => trip.DepartureRequestedAt)
                .ThenBy(trip => trip.Id)
                .Select(trip => new
                {
                    trip.Id,
                    trip.TruckAssignmentId,
                    trip.TruckInspectionId,
                    trip.LoadType,
                    trip.Direction,
                    trip.DepartureRequestedAt,

                    RegistrationNumber =
                        trip.TruckAssignment.Truck.RegistrationNumber,

                    DriverName = trip.TruckAssignment.Driver.FullName,

                    AssignmentReleased =
                        trip.TruckAssignment.ReleasedAt != null,

                    TruckActive = trip.TruckAssignment.Truck.IsActive,

                    DriverActive =
                        trip.TruckAssignment.Driver.IsActive &&
                        trip.TruckAssignment.Driver.Role == UserRoles.Driver,

                    InspectionApproved =
                        trip.TruckInspection.TruckAssignmentId ==
                            trip.TruckAssignmentId &&
                        trip.TruckInspection.Status == "Submitted" &&
                        trip.TruckInspection.ApprovedAt != null &&
                        trip.TruckInspection.ApprovedByUserId != null,

                    LatestInspectionId = _db.TruckInspections
                        .Where(x =>
                            x.TruckAssignmentId == trip.TruckAssignmentId)
                        .OrderByDescending(x => x.CreatedAt)
                        .ThenByDescending(x => x.Id)
                        .Select(x => (int?)x.Id)
                        .FirstOrDefault(),

                    UnclearedFaultCount = _db.TruckFaults.Count(
                        fault =>
                            fault.TruckId == trip.TruckAssignment.TruckId &&
                            fault.Status != "Cleared"),

                    Photos = _db.TripLoadingPhotos
                        .Where(photo => photo.TripId == trip.Id)
                        .OrderBy(photo => photo.Angle)
                        .Select(photo => new TripLoadingPhotoResponseDto
                        {
                            Id = photo.Id,
                            TripId = photo.TripId,
                            Angle = photo.Angle,
                            ContentType = photo.ContentType,
                            FileSizeBytes = photo.FileSizeBytes,
                            UploadedAt = photo.UploadedAt
                        })
                        .ToList()
                })
                .ToListAsync(cancellationToken);

            var result = new List<PendingDepartureResponseDto>();

            foreach (var request in requests)
            {
                string? blockedReason = null;

                if (request.AssignmentReleased)
                {
                    blockedReason = "The truck assignment has been released.";
                }
                else if (!request.TruckActive)
                {
                    blockedReason = "The truck is inactive.";
                }
                else if (!request.DriverActive)
                {
                    blockedReason = "The driver account is inactive or no longer a driver.";
                }
                else if (!request.InspectionApproved ||
                         request.LatestInspectionId != request.TruckInspectionId)
                {
                    blockedReason =
                        "The trip must reference the latest admin-approved inspection.";
                }
                else if (request.UnclearedFaultCount > 0)
                {
                    blockedReason =
                        "Workshop must clear all outstanding truck faults.";
                }
                else
                {
                    try
                    {
                        var requiredAngles =
                            TripLoadingRules.GetRequiredAngles(request.LoadType);

                        var missingAngles = requiredAngles
                            .Except(
                                request.Photos.Select(photo => photo.Angle),
                                StringComparer.Ordinal)
                            .ToList();

                        if (missingAngles.Count > 0)
                        {
                            blockedReason =
                                $"Missing loading photos: {string.Join(", ", missingAngles)}.";
                        }
                    }
                    catch (ValidationException)
                    {
                        blockedReason = "The trip has an invalid load type.";
                    }
                }

                result.Add(new PendingDepartureResponseDto
                {
                    Id = request.Id,
                    AssignmentId = request.TruckAssignmentId,
                    InspectionId = request.TruckInspectionId,
                    RegistrationNumber = request.RegistrationNumber,
                    DriverName = request.DriverName,
                    LoadType = request.LoadType,
                    Direction = request.Direction,
                    DepartureRequestedAt = request.DepartureRequestedAt,
                    UnclearedFaultCount = request.UnclearedFaultCount,
                    CanApprove = blockedReason is null,
                    ApprovalBlockedReason = blockedReason,
                    Photos = request.Photos
                });
            }

            return result;
        }

        public async Task<TripResponseDto> ApproveDepartureAsync(
    int tripId,
    int operationsUserId,
    CancellationToken cancellationToken = default)
        {
            await using var transaction =
                await _db.Database.BeginTransactionAsync(
                    IsolationLevel.Serializable,
                    cancellationToken);

            try
            {
                await EnsureActiveOperationsAsync(
                    operationsUserId,
                    cancellationToken);

                var trip = await _db.Trips
                    .Include(x => x.TruckAssignment)
                        .ThenInclude(x => x.Truck)
                    .Include(x => x.TruckAssignment)
                        .ThenInclude(x => x.Driver)
                    .SingleOrDefaultAsync(
                        x => x.Id == tripId,
                        cancellationToken);

                if (trip is null)
                {
                    throw new KeyNotFoundException("Trip not found.");
                }

                if (trip.Status != "AwaitingDepartureApproval" ||
                    trip.DepartureRequestedAt is null ||
                    trip.DepartureApprovedAt is not null ||
                    trip.DepartureApprovedByUserId is not null ||
                    trip.StartedAt is not null ||
                    trip.DeliveredAt is not null ||
                    trip.CompletedAt is not null)
                {
                    throw new InvalidOperationException(
                        "This trip is no longer awaiting departure approval.");
                }

                if (trip.TruckAssignment.ReleasedAt is not null)
                {
                    throw new InvalidOperationException(
                        "This truck assignment has been released.");
                }

                if (!trip.TruckAssignment.Truck.IsActive)
                {
                    throw new InvalidOperationException(
                        "This truck is inactive.");
                }

                if (!trip.TruckAssignment.Driver.IsActive ||
                    trip.TruckAssignment.Driver.Role != UserRoles.Driver)
                {
                    throw new InvalidOperationException(
                        "An active driver account is required for this trip.");
                }

                var latestInspection = await _db.TruckInspections
                    .Where(x =>
                        x.TruckAssignmentId == trip.TruckAssignmentId)
                    .OrderByDescending(x => x.CreatedAt)
                    .ThenByDescending(x => x.Id)
                    .FirstOrDefaultAsync(cancellationToken);

                if (latestInspection is null ||
                    latestInspection.Id != trip.TruckInspectionId ||
                    latestInspection.Status != "Submitted" ||
                    latestInspection.ApprovedAt is null ||
                    latestInspection.ApprovedByUserId is null)
                {
                    throw new InvalidOperationException(
                        "The trip's inspection is no longer the latest approved inspection.");
                }

                var hasUnclearedFaults = await _db.TruckFaults.AnyAsync(
                    x => x.TruckId == trip.TruckAssignment.TruckId &&
                         x.Status != "Cleared",
                    cancellationToken);

                if (hasUnclearedFaults)
                {
                    throw new InvalidOperationException(
                        "Workshop must clear all truck faults before departure.");
                }

                var requiredAngles =
                    TripLoadingRules.GetRequiredAngles(trip.LoadType);

                var savedAngles = await _db.TripLoadingPhotos
                    .Where(x => x.TripId == tripId)
                    .Select(x => x.Angle)
                    .ToListAsync(cancellationToken);

                var missingAngles = requiredAngles
                    .Except(savedAngles, StringComparer.Ordinal)
                    .ToList();

                if (missingAngles.Count > 0)
                {
                    throw new ValidationException(
                        $"Missing loading photos: {string.Join(", ", missingAngles)}.");
                }

                trip.DepartureApprovedAt = DateTime.UtcNow;
                trip.DepartureApprovedByUserId = operationsUserId;
                trip.Status = "DepartureApproved";

                await _db.SaveChangesAsync(cancellationToken);

                var response = await GetTripQuery()
                    .SingleAsync(
                        x => x.Id == tripId,
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
        public async Task<TripResponseDto> IssueInstructionsAsync(
    int tripId,
    int adminId,
    IssueTripInstructionsRequestDto request,
    CancellationToken cancellationToken = default)
        {
            Validator.ValidateObject(
                request,
                new ValidationContext(request),
                validateAllProperties: true);

            if (string.IsNullOrWhiteSpace(request.CustomerName) ||
                string.IsNullOrWhiteSpace(request.CollectionAddress) ||
                string.IsNullOrWhiteSpace(request.DeliveryAddress))
            {
                throw new ValidationException(
                    "Customer name, collection address and delivery address are required.");
            }

            await using var transaction =
                await _db.Database.BeginTransactionAsync(
                    IsolationLevel.Serializable,
                    cancellationToken);

            try
            {
                var isActiveAdmin = await _db.Users.AnyAsync(
                    user => user.Id == adminId &&
                            user.IsActive &&
                            user.Role == UserRoles.Admin,
                    cancellationToken);

                if (!isActiveAdmin)
                {
                    throw new UnauthorizedAccessException(
                        "An active Admin account is required.");
                }

                var trip = await _db.Trips
                    .Include(x => x.TruckAssignment)
                        .ThenInclude(x => x.Truck)
                    .Include(x => x.TruckAssignment)
                        .ThenInclude(x => x.Driver)
                    .SingleOrDefaultAsync(
                        x => x.Id == tripId,
                        cancellationToken);

                if (trip is null)
                {
                    throw new KeyNotFoundException("Trip not found.");
                }

                if (trip.TruckAssignment.ReleasedAt is not null)
                {
                    throw new InvalidOperationException(
                        "This truck assignment has been released.");
                }

                if (!trip.TruckAssignment.Truck.IsActive)
                {
                    throw new InvalidOperationException(
                        "This truck is inactive.");
                }

                if (!trip.TruckAssignment.Driver.IsActive ||
                    trip.TruckAssignment.Driver.Role != UserRoles.Driver)
                {
                    throw new InvalidOperationException(
                        "An active driver account is required for this trip.");
                }

                if (trip.InstructionsIssuedAt is not null ||
                    trip.InstructionsIssuedByUserId is not null ||
                    !string.IsNullOrWhiteSpace(trip.InstructionReference))
                {
                    throw new InvalidOperationException(
                        "Instructions have already been issued for this trip.");
                }

                if ((trip.Status != "Loading" &&
                     trip.Status != "Preparing") ||
                    trip.DepartureRequestedAt is not null ||
                    trip.DepartureApprovedAt is not null ||
                    trip.StartedAt is not null ||
                    trip.DeliveredAt is not null ||
                    trip.CompletedAt is not null)
                {
                    throw new InvalidOperationException(
                        "Instructions must be issued before departure is requested.");
                }

                var issuedAt = DateTime.UtcNow;

                trip.InstructionReference =
                    $"AVE-{issuedAt:yyyyMMdd}-{trip.Id:D6}";

                trip.CustomerName = request.CustomerName.Trim();

                trip.BookingNumber =
                    string.IsNullOrWhiteSpace(request.BookingNumber)
                        ? null
                        : request.BookingNumber.Trim();

                trip.BookingAt = request.BookingAt?.UtcDateTime;

                trip.CollectionAddress = request.CollectionAddress.Trim();

                trip.CollectionContact =
                    string.IsNullOrWhiteSpace(request.CollectionContact)
                        ? null
                        : request.CollectionContact.Trim();

                trip.CargoDescription =
                    string.IsNullOrWhiteSpace(request.CargoDescription)
                        ? null
                        : request.CargoDescription.Trim();

                trip.PlannedLoadingAt =
                    request.PlannedLoadingAt?.UtcDateTime;

                trip.LoadingInstructions =
                    string.IsNullOrWhiteSpace(request.LoadingInstructions)
                        ? null
                        : request.LoadingInstructions.Trim();

                trip.DeliveryAddress = request.DeliveryAddress.Trim();

                trip.DeliveryContact =
                    string.IsNullOrWhiteSpace(request.DeliveryContact)
                        ? null
                        : request.DeliveryContact.Trim();

                trip.DeliveryInstructions =
                    string.IsNullOrWhiteSpace(request.DeliveryInstructions)
                        ? null
                        : request.DeliveryInstructions.Trim();

                trip.InstructionsIssuedAt = issuedAt;
                trip.InstructionsIssuedByUserId = adminId;

                await _db.SaveChangesAsync(cancellationToken);

                var response = await GetTripQuery()
                    .SingleAsync(
                        x => x.Id == tripId,
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

        private async Task EnsureActiveOperationsAsync(
    int operationsUserId,
    CancellationToken cancellationToken)
        {
            var validAccount = await _db.Users.AnyAsync(
                user =>
                    user.Id == operationsUserId &&
                    user.IsActive &&
                    user.Role == UserRoles.Admin,
                cancellationToken);

            if (!validAccount)
            {
                throw new UnauthorizedAccessException(
                    "An active Admin account is required.");
            }
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
                    InstructionReference = trip.InstructionReference,
                    CustomerName = trip.CustomerName,
                    BookingNumber = trip.BookingNumber,
                    BookingAt = trip.BookingAt,
                    CollectionAddress = trip.CollectionAddress,
                    CollectionContact = trip.CollectionContact,
                    CargoDescription = trip.CargoDescription,
                    PlannedLoadingAt = trip.PlannedLoadingAt,
                    LoadingInstructions = trip.LoadingInstructions,
                    DeliveryAddress = trip.DeliveryAddress,
                    DeliveryContact = trip.DeliveryContact,
                    DeliveryInstructions = trip.DeliveryInstructions,
                    InstructionsIssuedAt = trip.InstructionsIssuedAt,
                    InstructionsIssuedByUserId = trip.InstructionsIssuedByUserId,
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