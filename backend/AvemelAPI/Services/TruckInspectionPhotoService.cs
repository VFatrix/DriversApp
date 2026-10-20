using System.ComponentModel.DataAnnotations;
using System.Data;
using Avemel.API.Constants;
using Avemel.API.Data;
using Avemel.API.DTOs.Inspections;
using Avemel.API.Helpers;
using Avemel.API.Models;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Avemel.API.Services
{
    public class TruckInspectionPhotoService
        : ITruckInspectionPhotoService
    {
        private readonly AppDbContext _db;
        private readonly IInspectionPhotoStorage _storage;
        private readonly ILogger<TruckInspectionPhotoService> _logger;

        public TruckInspectionPhotoService(
            AppDbContext db,
            IInspectionPhotoStorage storage,
            ILogger<TruckInspectionPhotoService> logger)
        {
            _db = db;
            _storage = storage;
            _logger = logger;
        }

        public async Task<TruckInspectionPhotoResponseDto> UploadAsync(
            int inspectionId,
            int driverId,
            UploadTruckInspectionPhotoRequestDto request,
            CancellationToken cancellationToken = default)
        {
            Validator.ValidateObject(
                request,
                new ValidationContext(request),
                validateAllProperties: true);

            // Check access before decoding the image.
            var ownsInspection = await _db.TruckInspections.AnyAsync(
                x => x.Id == inspectionId
                     && x.TruckAssignment.DriverId == driverId,
                cancellationToken);

            if (!ownsInspection)
            {
                throw new KeyNotFoundException(
                    "Inspection not found.");
            }

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
                var isActiveDriver = await _db.Users.AnyAsync(
                    x => x.Id == driverId
                         && x.IsActive
                         && x.Role == UserRoles.Driver,
                    cancellationToken);

                if (!isActiveDriver)
                {
                    throw new UnauthorizedAccessException(
                        "An active driver account is required.");
                }

                var inspection = await _db.TruckInspections
                    .Include(x => x.TruckAssignment)
                    .SingleOrDefaultAsync(
                        x => x.Id == inspectionId
                             && x.TruckAssignment.DriverId == driverId,
                        cancellationToken);

                if (inspection is null)
                {
                    throw new KeyNotFoundException(
                        "Inspection not found.");
                }

                if (inspection.TruckAssignment.ReleasedAt is not null)
                {
                    throw new InvalidOperationException(
                        "This truck assignment has been released.");
                }

                if (inspection.Status != "Draft")
                {
                    throw new InvalidOperationException(
                        "Only draft inspections can be edited.");
                }

                var angleExists =
                    await _db.TruckInspectionPhotos.AnyAsync(
                        x => x.TruckInspectionId == inspectionId
                             && x.Angle == request.Angle,
                        cancellationToken);

                if (angleExists)
                {
                    throw new InvalidOperationException(
                        "A photo already exists for this angle.");
                }

                using var content = new MemoryStream(
                    image.Content,
                    writable: false);

                storageKey = await _storage.SaveAsync(
                    content,
                    image.Extension,
                    cancellationToken);

                var photo = new TruckInspectionPhoto
                {
                    TruckInspectionId = inspectionId,
                    Angle = request.Angle,
                    StorageKey = storageKey,
                    ContentType = image.ContentType,
                    FileSizeBytes = image.Content.LongLength,
                    UploadedByUserId = driverId,
                    UploadedAt = DateTime.UtcNow
                };

                _db.TruckInspectionPhotos.Add(photo);

                await _db.SaveChangesAsync(cancellationToken);

                commitAttempted = true;
                await transaction.CommitAsync(cancellationToken);

                return new TruckInspectionPhotoResponseDto
                {
                    Id = photo.Id,
                    Url = "/api/inspection-photos/" + photo.Id,
                    Angle = photo.Angle,
                    ContentType = photo.ContentType,
                    FileSizeBytes = photo.FileSizeBytes,
                    UploadedAt = photo.UploadedAt
                };
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
                        "Could not confirm rollback for inspection {InspectionId}.",
                        inspectionId);
                }

                // If commit failed, its outcome could be uncertain.
                // Preserve the file rather than risk deleting saved evidence.
                if (storageKey is not null
                    && !commitAttempted
                    && rollbackConfirmed)
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
                            "Could not remove unused photo {StorageKey}.",
                            storageKey);
                    }
                }
                else if (storageKey is not null)
                {
                    _logger.LogWarning(
                        "Preserved photo {StorageKey} after an uncertain upload outcome.",
                        storageKey);
                }

                if (IsConcurrentChange(exception))
                {
                    throw new InvalidOperationException(
                        "The inspection or its photos changed. Refresh and try again.",
                        exception);
                }

                throw;
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
                       && postgresException.ConstraintName
                           == "IX_TruckInspectionPhotos_TruckInspectionId_Angle"
                   );
        }
    }
}