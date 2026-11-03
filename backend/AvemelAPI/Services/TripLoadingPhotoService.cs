using System.ComponentModel.DataAnnotations;
using System.Data;
using Avemel.API.Constants;
using Avemel.API.Data;
using Avemel.API.DTOs.Trips;
using Avemel.API.Helpers;
using Avemel.API.Models;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Avemel.API.Services
{
    public class TripLoadingPhotoService : ITripLoadingPhotoService
    {
        private readonly AppDbContext _db;
        private readonly IInspectionPhotoStorage _storage;
        private readonly ILogger<TripLoadingPhotoService> _logger;

        public TripLoadingPhotoService(
            AppDbContext db,
            IInspectionPhotoStorage storage,
            ILogger<TripLoadingPhotoService> logger)
        {
            _db = db;
            _storage = storage;
            _logger = logger;
        }

        public async Task<TripLoadingPhotoResponseDto> UploadAsync(
            int tripId,
            int driverId,
            UploadTripLoadingPhotoRequestDto request,
            CancellationToken cancellationToken = default)
        {
            Validator.ValidateObject(
                request,
                new ValidationContext(request),
                validateAllProperties: true);

            await EnsureActiveDriverAsync(driverId, cancellationToken);

            // Check ownership before decoding the image.
            var ownsTrip = await _db.Trips.AnyAsync(
                x => x.Id == tripId &&
                     x.TruckAssignment.DriverId == driverId,
                cancellationToken);

            if (!ownsTrip)
            {
                throw new KeyNotFoundException("Trip not found.");
            }

            var angle = request.Angle.Trim().ToLowerInvariant();

            var image = await InspectionImageValidator.ValidateAsync(
                request.File,
                cancellationToken);

            await using var transaction =
                await _db.Database.BeginTransactionAsync(
                    IsolationLevel.Serializable,
                    cancellationToken);

            string? storageKey = null;
            var commitAttempted = false;

            try
            {
                // Recheck inside the transaction.
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

                if (trip.LoadType == "Empty")
                {
                    throw new ValidationException(
                        "Empty trips do not require loading photos.");
                }

                if (trip.Status != "Loading" ||
                    trip.DepartureRequestedAt is not null ||
                    trip.DepartureApprovedAt is not null ||
                    trip.StartedAt is not null ||
                    trip.CompletedAt is not null)
                {
                    throw new InvalidOperationException(
                        "Loading photos can only be uploaded before requesting departure.");
                }

                var requiredAngles =
                    TripLoadingRules.GetRequiredAngles(trip.LoadType);

                if (!requiredAngles.Contains(angle))
                {
                    throw new ValidationException(
                        $"Photo angle must be: {string.Join(", ", requiredAngles)}.");
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

                var hasFaults = await _db.TruckFaults.AnyAsync(
                    x => x.TruckId == trip.TruckAssignment.TruckId &&
                         x.Status != "Cleared",
                    cancellationToken);

                if (hasFaults)
                {
                    throw new InvalidOperationException(
                        "Workshop must clear all truck faults before loading.");
                }

                var angleExists = await _db.TripLoadingPhotos.AnyAsync(
                    x => x.TripId == tripId && x.Angle == angle,
                    cancellationToken);

                if (angleExists)
                {
                    throw new InvalidOperationException(
                        "A loading photo already exists for this angle.");
                }

                using var content = new MemoryStream(
                    image.Content,
                    writable: false);

                storageKey = await _storage.SaveAsync(
                    content,
                    image.Extension,
                    cancellationToken);

                var photo = new TripLoadingPhoto
                {
                    TripId = tripId,
                    Angle = angle,
                    StorageKey = storageKey,
                    ContentType = image.ContentType,
                    FileSizeBytes = image.Content.LongLength,
                    UploadedByUserId = driverId,
                    UploadedAt = DateTime.UtcNow
                };

                _db.TripLoadingPhotos.Add(photo);

                await _db.SaveChangesAsync(cancellationToken);

                commitAttempted = true;
                await transaction.CommitAsync(cancellationToken);

                return ToResponse(photo);
            }
            catch (Exception exception)
            {
                var rollbackConfirmed = false;

                try
                {
                    await transaction.RollbackAsync(
                        CancellationToken.None);

                    rollbackConfirmed = true;
                }
                catch (Exception rollbackException)
                {
                    _logger.LogError(
                        rollbackException,
                        "Could not confirm rollback for trip {TripId}.",
                        tripId);
                }

                // Preserve evidence if the commit outcome is uncertain.
                if (storageKey is not null &&
                    !commitAttempted &&
                    rollbackConfirmed)
                {
                    try
                    {
                        await _storage.DeleteAsync(
                            storageKey,
                            CancellationToken.None);
                    }
                    catch (Exception cleanupException)
                    {
                        _logger.LogError(
                            cleanupException,
                            "Could not remove unused loading photo {StorageKey}.",
                            storageKey);
                    }
                }
                else if (storageKey is not null)
                {
                    _logger.LogWarning(
                        "Preserved loading photo {StorageKey} after an uncertain upload outcome.",
                        storageKey);
                }

                if (IsConcurrentChange(exception))
                {
                    throw new InvalidOperationException(
                        "The trip or its photos changed. Refresh and try again.",
                        exception);
                }

                throw;
            }
        }

        public async Task<List<TripLoadingPhotoResponseDto>>
            GetForDriverAsync(
                int tripId,
                int driverId,
                CancellationToken cancellationToken = default)
        {
            await EnsureActiveDriverAsync(driverId, cancellationToken);

            var ownsTrip = await _db.Trips.AnyAsync(
                x => x.Id == tripId &&
                     x.TruckAssignment.DriverId == driverId,
                cancellationToken);

            if (!ownsTrip)
            {
                throw new KeyNotFoundException("Trip not found.");
            }

            return await _db.TripLoadingPhotos
                .AsNoTracking()
                .Where(x => x.TripId == tripId)
                .OrderBy(x => x.Angle)
                .Select(x => new TripLoadingPhotoResponseDto
                {
                    Id = x.Id,
                    TripId = x.TripId,
                    Angle = x.Angle,
                    ContentType = x.ContentType,
                    FileSizeBytes = x.FileSizeBytes,
                    UploadedAt = x.UploadedAt
                })
                .ToListAsync(cancellationToken);
        }

        private async Task EnsureActiveDriverAsync(
            int driverId,
            CancellationToken cancellationToken)
        {
            var isActiveDriver = await _db.Users.AnyAsync(
                x => x.Id == driverId &&
                     x.IsActive &&
                     x.Role == UserRoles.Driver,
                cancellationToken);

            if (!isActiveDriver)
            {
                throw new UnauthorizedAccessException(
                    "An active driver account is required.");
            }
        }

        private static TripLoadingPhotoResponseDto ToResponse(
            TripLoadingPhoto photo)
        {
            return new TripLoadingPhotoResponseDto
            {
                Id = photo.Id,
                TripId = photo.TripId,
                Angle = photo.Angle,
                ContentType = photo.ContentType,
                FileSizeBytes = photo.FileSizeBytes,
                UploadedAt = photo.UploadedAt
            };
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
                           PostgresErrorCodes.UniqueViolation
                       && postgres.ConstraintName ==
                           "IX_TripLoadingPhotos_TripId_Angle"
                   );
        }
    }
}