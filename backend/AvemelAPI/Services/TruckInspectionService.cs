using System.ComponentModel.DataAnnotations;
using System.Data;
using Avemel.API.Constants;
using Avemel.API.Data;
using Avemel.API.DTOs.Inspections;
using Avemel.API.Models;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Avemel.API.Services
{
    public class TruckInspectionService : ITruckInspectionService
    {
        private readonly AppDbContext _db;

        public TruckInspectionService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<TruckInspectionResponseDto> CreateAsync(
            int driverId,
            CreateTruckInspectionRequestDto request,
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
                await EnsureActiveDriverAsync(driverId, cancellationToken);

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

                if (assignment.ReleasedAt is not null)
                {
                    throw new InvalidOperationException(
                        "This truck assignment has been released.");
                }

                var draftExists = await _db.TruckInspections.AnyAsync(
                    x => x.TruckAssignmentId == assignment.Id
                         && x.Status == "Draft",
                    cancellationToken);

                if (draftExists)
                {
                    throw new InvalidOperationException(
                        "This assignment already has a draft inspection.");
                }

                var inspection = new TruckInspection
                {
                    TruckAssignmentId = assignment.Id,
                    Status = "Draft",
                    CreatedAt = DateTime.UtcNow
                };

                _db.TruckInspections.Add(inspection);

                foreach (var item in TruckInspectionChecklist.Items)
                {
                    _db.TruckInspectionAnswers.Add(
                        new TruckInspectionAnswer
                        {
                            TruckInspection = inspection,
                            CheckCode = item.Code,
                            CheckLabel = item.Label,
                            HasDefect = null,
                            Notes = null
                        });
                }

                // Inspection and its answers are saved together.
                await _db.SaveChangesAsync(cancellationToken);

                var response = await BuildResponseAsync(
                    inspection,
                    cancellationToken);

                await transaction.CommitAsync(cancellationToken);

                return response;
            }
            catch (Exception exception)
                when (IsConcurrentChange(exception))
            {
                throw new InvalidOperationException(
                    "The assignment or inspection changed. Refresh and try again.",
                    exception);
            }
        }

        public async Task<TruckInspectionResponseDto?> GetByIdAsync(
            int inspectionId,
            int driverId,
            CancellationToken cancellationToken = default)
        {
            var inspection = await _db.TruckInspections
                .AsNoTracking()
                .SingleOrDefaultAsync(
                    x => x.Id == inspectionId
                         && x.TruckAssignment.DriverId == driverId,
                    cancellationToken);

            if (inspection is null)
            {
                return null;
            }

            return await BuildResponseAsync(
                inspection,
                cancellationToken);
        }

        public async Task<TruckInspectionAnswerResponseDto> UpdateAnswerAsync(
            int inspectionId,
            int answerId,
            int driverId,
            UpdateTruckInspectionAnswerRequestDto request,
            CancellationToken cancellationToken = default)
        {
            Validator.ValidateObject(
                request,
                new ValidationContext(request),
                validateAllProperties: true);

           

            var notes = string.IsNullOrWhiteSpace(request.Notes)
                ? null
                : request.Notes.Trim();

           

            await using var transaction =
                await _db.Database.BeginTransactionAsync(
                    IsolationLevel.Serializable,
                    cancellationToken);

            try
            {
                await EnsureActiveDriverAsync(driverId, cancellationToken);

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

                var answer = await _db.TruckInspectionAnswers
                    .SingleOrDefaultAsync(
                        x => x.Id == answerId
                             && x.TruckInspectionId == inspectionId,
                        cancellationToken);

                if (answer is null)
                {
                    throw new KeyNotFoundException(
                        "Inspection answer not found.");
                }

                answer.HasDefect = request.HasDefect;
                answer.Notes = notes;

                await _db.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                return MapAnswer(answer);
            }
            catch (Exception exception)
                when (IsConcurrentChange(exception))
            {
                throw new InvalidOperationException(
                    "The assignment or inspection changed. Refresh and try again.",
                    exception);
            }
        }
        public async Task<TruckInspectionResponseDto> SubmitAsync(
     int inspectionId,
     int driverId,
     CancellationToken cancellationToken = default)
        {
            await using var transaction =
                await _db.Database.BeginTransactionAsync(
                    IsolationLevel.Serializable,
                    cancellationToken);

            try
            {
                await EnsureActiveDriverAsync(driverId, cancellationToken);

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
                        "Only draft inspections can be submitted.");
                }

                var answers = await _db.TruckInspectionAnswers
                    .Where(x => x.TruckInspectionId == inspectionId)
                    .ToListAsync(cancellationToken);

                var requiredCodes = TruckInspectionChecklist.Items
                    .Select(x => x.Code)
                    .ToHashSet(StringComparer.Ordinal);

                var actualCodes = answers
                    .Select(x => x.CheckCode)
                    .ToHashSet(StringComparer.Ordinal);

                if (answers.Count != requiredCodes.Count
                    || !requiredCodes.SetEquals(actualCodes))
                {
                    throw new ValidationException(
                        "The inspection checklist is incomplete.");
                }

                if (answers.Any(x => x.HasDefect is null))
                {
                    throw new ValidationException(
                        "Answer every checklist item before submitting.");
                }

                var defects = answers
                    .Where(x => x.HasDefect == true)
                    .ToList();

               

                var photoAngles = await _db.TruckInspectionPhotos
                    .Where(x => x.TruckInspectionId == inspectionId)
                    .Select(x => x.Angle)
                    .ToListAsync(cancellationToken);

                var missingAngles = TruckInspectionChecklist.RequiredPhotoAngles
                    .Except(photoAngles, StringComparer.Ordinal)
                    .ToList();

                if (missingAngles.Count > 0)
                {
                    throw new ValidationException(
                        $"Upload the required photos: {string.Join(", ", missingAngles)}.");
                }

                var submittedAt = DateTime.UtcNow;

                foreach (var answer in defects)
                {
                    _db.TruckFaults.Add(new TruckFault
                    {
                        TruckId = inspection.TruckAssignment.TruckId,
                        TruckInspectionId = inspection.Id,
                        TruckInspectionAnswerId = answer.Id,
                       
                        // The linked answer retains the checklist code and label.
                        Description = string.IsNullOrWhiteSpace(answer.Notes)
                          ? $"Defect reported for checklist item: {answer.CheckCode}."
                               : answer.Notes.Trim(),

                        Status = "Open",
                        ReportedByUserId = driverId,
                        ReportedAt = submittedAt
                    });
                }

                // Send additional issues/comments to Workshop for review.
                if (!string.IsNullOrWhiteSpace(inspection.AdditionalComments))
                {
                    _db.TruckFaults.Add(new TruckFault
                    {
                        TruckId = inspection.TruckAssignment.TruckId,
                        TruckInspectionId = inspection.Id,
                        TruckInspectionAnswerId = null,
                        Description = inspection.AdditionalComments.Trim(),
                        Status = "Open",
                        ReportedByUserId = driverId,
                        ReportedAt = submittedAt
                    });
                }

                inspection.Status = "Submitted";
                inspection.SubmittedAt = submittedAt;

                // Save submission and Workshop faults together.
                await _db.SaveChangesAsync(cancellationToken);

                var response = await BuildResponseAsync(
                    inspection,
                    cancellationToken);

                await transaction.CommitAsync(cancellationToken);

                return response;
            }
            catch (Exception exception)
                when (IsConcurrentChange(exception))
            {
                throw new InvalidOperationException(
                    "The assignment or inspection changed. Refresh and try again.",
                    exception);
            }
        }


        public async Task<TruckInspectionResponseDto?> GetMyDraftAsync(
    int driverId,
    CancellationToken cancellationToken = default)
        {
            var inspection = await _db.TruckInspections
                .AsNoTracking()
                .SingleOrDefaultAsync(
                    x => x.TruckAssignment.DriverId == driverId
                         && x.TruckAssignment.ReleasedAt == null
                         && x.Status == "Draft",
                    cancellationToken);

            if (inspection is null)
            {
                return null;
            }

            return await BuildResponseAsync(
                inspection,
                cancellationToken);
        }

        public async Task<TruckInspectionResponseDto?> GetForWorkshopAsync(
    int inspectionId,
    CancellationToken cancellationToken = default)
        {
            var inspection = await _db.TruckInspections
                .AsNoTracking()
                .SingleOrDefaultAsync(
                    x => x.Id == inspectionId
                         && x.Status == "Submitted",
                    cancellationToken);

            if (inspection is null)
            {
                return null;
            }

            return await BuildResponseAsync(
                inspection,
                cancellationToken);
        }

        public async Task<TruckInspectionResponseDto?> GetMyLatestAsync(
    int driverId,
    CancellationToken cancellationToken = default)
        {
            var inspection = await _db.TruckInspections
                .AsNoTracking()
                .Where(x => x.TruckAssignment.DriverId == driverId
                            && x.TruckAssignment.ReleasedAt == null)
                .OrderByDescending(x => x.CreatedAt)
                .ThenByDescending(x => x.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (inspection is null)
            {
                return null;
            }

            return await BuildResponseAsync(
                inspection,
                cancellationToken);
        }

        public async Task<TruckInspectionResponseDto> SaveAsync(
    int inspectionId,
    int driverId,
    SaveTruckInspectionRequestDto request,
    CancellationToken cancellationToken = default)

        {
            ArgumentNullException.ThrowIfNull(request);

            Validator.ValidateObject(
                request,
                new ValidationContext(request),
                validateAllProperties: true);

            foreach (var item in request.Answers)
            {
                if (item is null)
                {
                    throw new ValidationException(
                        "An inspection answer is missing.");
                }

                Validator.ValidateObject(
                    item,
                    new ValidationContext(item),
                    validateAllProperties: true);
            }

            var requestedIds = request.Answers
                .Select(item => item.AnswerId)
                .ToHashSet();

            if (requestedIds.Count != request.Answers.Count)
            {
                throw new ValidationException(
                    "Each inspection answer must appear only once.");
            }

            await using var transaction =
                await _db.Database.BeginTransactionAsync(
                    IsolationLevel.Serializable,
                    cancellationToken);

            try
            {
                await EnsureActiveDriverAsync(
                    driverId,
                    cancellationToken);

                var inspection = await _db.TruckInspections
                    .Include(item => item.TruckAssignment)
                    .SingleOrDefaultAsync(
                        item => item.Id == inspectionId
                                && item.TruckAssignment.DriverId == driverId,
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

                var answers = await _db.TruckInspectionAnswers
                    .Where(item => item.TruckInspectionId == inspectionId)
                    .ToListAsync(cancellationToken);

                var requiredCodes = TruckInspectionChecklist.Items
                    .Select(item => item.Code)
                    .ToHashSet(StringComparer.Ordinal);

                var actualCodes = answers
                    .Select(item => item.CheckCode)
                    .ToHashSet(StringComparer.Ordinal);

                if (answers.Count != requiredCodes.Count ||
                    !requiredCodes.SetEquals(actualCodes))
                {
                    throw new ValidationException(
                        "The inspection checklist is incomplete.");
                }

                var actualIds = answers
                    .Select(item => item.Id)
                    .ToHashSet();

                if (!actualIds.SetEquals(requestedIds))
                {
                    throw new ValidationException(
                        "Send every answer belonging to this inspection.");
                }

                var selections = request.Answers.ToDictionary(
                    item => item.AnswerId,
                    item => item.HasDefect);

                foreach (var answer in answers)
                {
                    answer.HasDefect = selections[answer.Id];
                }

                inspection.AdditionalComments =
                    string.IsNullOrWhiteSpace(request.AdditionalComments)
                        ? null
                        : request.AdditionalComments.Trim();

                // Save all selections and comments together.
                // The inspection remains Draft; photos can still be uploaded.
                await _db.SaveChangesAsync(cancellationToken);

                var response = await BuildResponseAsync(
                    inspection,
                    cancellationToken);

                await transaction.CommitAsync(cancellationToken);

                return response;
            }
            catch (Exception exception)
                when (IsConcurrentChange(exception))
            {
                throw new InvalidOperationException(
                    "The assignment or inspection changed. Refresh and try again.",
                    exception);
            }
        }




        private async Task EnsureActiveDriverAsync(
            int driverId,
            CancellationToken cancellationToken)
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
        }

        public async Task<TruckInspectionResponseDto> UpdateCommentsAsync(
    int inspectionId,
    int driverId,
    UpdateTruckInspectionCommentsRequestDto request,
    CancellationToken cancellationToken = default)
        {
            Validator.ValidateObject(
                request,
                new ValidationContext(request),
                validateAllProperties: true);

            await using var transaction =
                await _db.Database.BeginTransactionAsync(
                    System.Data.IsolationLevel.Serializable,
                    cancellationToken);

            var isActiveDriver = await _db.Users.AnyAsync(
                user => user.Id == driverId
                        && user.IsActive
                        && user.Role == "Driver",
                cancellationToken);

            if (!isActiveDriver)
            {
                throw new UnauthorizedAccessException();
            }

            var inspection = await _db.TruckInspections
                .Include(item => item.TruckAssignment)
                .SingleOrDefaultAsync(
                    item => item.Id == inspectionId
                            && item.TruckAssignment.DriverId == driverId,
                    cancellationToken);

            if (inspection is null)
            {
                throw new KeyNotFoundException("Inspection not found.");
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

            inspection.AdditionalComments =
                string.IsNullOrWhiteSpace(request.AdditionalComments)
                    ? null
                    : request.AdditionalComments.Trim();

            await _db.SaveChangesAsync(cancellationToken);

            var response = await BuildResponseAsync(
                inspection,
                cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            return response;
        }

        public async Task<List<PendingInspectionResponseDto>>
    GetPendingApprovalAsync(
        CancellationToken cancellationToken = default)
        {
            var pending = await _db.TruckInspections
                .AsNoTracking()
                .Where(inspection =>
                    inspection.Status == "Submitted" &&
                    inspection.ApprovedAt == null &&
                    inspection.TruckAssignment.ReleasedAt == null)
                .Where(inspection =>
                    !_db.TruckInspections.Any(other =>
                        other.TruckAssignmentId ==
                            inspection.TruckAssignmentId &&
                        (other.CreatedAt > inspection.CreatedAt ||
                         (other.CreatedAt == inspection.CreatedAt &&
                          other.Id > inspection.Id))))
                .OrderBy(inspection => inspection.SubmittedAt)
                .ThenBy(inspection => inspection.Id)
                .Select(inspection => new
                {
                    inspection.Id,
                    AssignmentId = inspection.TruckAssignmentId,
                    inspection.TruckAssignment.TruckId,
                    RegistrationNumber =
                        inspection.TruckAssignment.Truck.RegistrationNumber,
                    DriverName =
                        inspection.TruckAssignment.Driver.FullName,
                    inspection.SubmittedAt,

                    TruckIsActive =
                        inspection.TruckAssignment.Truck.IsActive,

                    DriverIsActive =
                        inspection.TruckAssignment.Driver.IsActive &&
                        inspection.TruckAssignment.Driver.Role ==
                            UserRoles.Driver,

                    UnclearedFaultCount = _db.TruckFaults.Count(fault =>
                        fault.TruckId ==
                            inspection.TruckAssignment.TruckId &&
                        fault.Status != "Cleared")
                })
                .ToListAsync(cancellationToken);

            return pending.Select(inspection =>
                new PendingInspectionResponseDto
                {
                    Id = inspection.Id,
                    AssignmentId = inspection.AssignmentId,
                    TruckId = inspection.TruckId,
                    RegistrationNumber = inspection.RegistrationNumber,
                    DriverName = inspection.DriverName,
                    SubmittedAt = inspection.SubmittedAt,
                    UnclearedFaultCount = inspection.UnclearedFaultCount,

                    CanApprove =
                        inspection.TruckIsActive &&
                        inspection.DriverIsActive &&
                        inspection.UnclearedFaultCount == 0
                })
                .ToList();
        }

        public async Task<TruckInspectionResponseDto> ApproveAsync(
    int inspectionId,
    int adminId,
    CancellationToken cancellationToken = default)
        {
            await using var transaction =
                await _db.Database.BeginTransactionAsync(
                    IsolationLevel.Serializable,
                    cancellationToken);

            try
            {
                var validAdmin = await _db.Users.AnyAsync(
                    user => user.Id == adminId &&
                            user.IsActive &&
                            user.Role == UserRoles.Admin,
                    cancellationToken);

                if (!validAdmin)
                {
                    throw new UnauthorizedAccessException(
                        "An active admin account is required.");
                }

                var inspection = await _db.TruckInspections
                    .Include(x => x.TruckAssignment)
                        .ThenInclude(x => x.Truck)
                    .Include(x => x.TruckAssignment)
                        .ThenInclude(x => x.Driver)
                    .SingleOrDefaultAsync(
                        x => x.Id == inspectionId,
                        cancellationToken);

                if (inspection is null)
                {
                    throw new KeyNotFoundException(
                        "Inspection not found.");
                }

                var assignment = inspection.TruckAssignment;

                if (assignment.ReleasedAt is not null)
                {
                    throw new InvalidOperationException(
                        "This truck assignment has been released.");
                }

                if (!assignment.Truck.IsActive ||
                    !assignment.Driver.IsActive ||
                    assignment.Driver.Role != UserRoles.Driver)
                {
                    throw new InvalidOperationException(
                        "The truck and driver must both be active.");
                }

                if (inspection.Status != "Submitted")
                {
                    throw new InvalidOperationException(
                        "Only submitted inspections can be approved.");
                }

                var hasNewerInspection = await _db.TruckInspections.AnyAsync(
                    x => x.TruckAssignmentId == inspection.TruckAssignmentId &&
                         (x.CreatedAt > inspection.CreatedAt ||
                          (x.CreatedAt == inspection.CreatedAt &&
                           x.Id > inspection.Id)),
                    cancellationToken);

                if (hasNewerInspection)
                {
                    throw new InvalidOperationException(
                        "A newer inspection exists. Review the latest inspection.");
                }

                if (inspection.ApprovedAt is not null)
                {
                    throw new InvalidOperationException(
                        "This inspection has already been approved.");
                }

                var hasUnclearedFaults = await _db.TruckFaults.AnyAsync(
                    fault => fault.TruckId == assignment.TruckId &&
                             fault.Status != "Cleared",
                    cancellationToken);

                if (hasUnclearedFaults)
                {
                    throw new InvalidOperationException(
                        "Workshop must clear all truck faults before approval.");
                }

                inspection.ApprovedAt = DateTime.UtcNow;
                inspection.ApprovedByUserId = adminId;

                await _db.SaveChangesAsync(cancellationToken);

                var response = await BuildResponseAsync(
                    inspection,
                    cancellationToken);

                await transaction.CommitAsync(cancellationToken);

                return response;
            }
            catch (Exception exception)
                when (IsConcurrentChange(exception))
            {
                throw new InvalidOperationException(
                    "The assignment or inspection changed. Refresh and try again.",
                    exception);
            }
        }
        private async Task<TruckInspectionResponseDto> BuildResponseAsync(
            TruckInspection inspection,
            CancellationToken cancellationToken)
        {

            var answers = await _db.TruckInspectionAnswers
                .AsNoTracking()
                .Where(x => x.TruckInspectionId == inspection.Id)
                .OrderBy(x => x.Id)
                .ToListAsync(cancellationToken);

            var photos = await _db.TruckInspectionPhotos
                .AsNoTracking()
                .Where(x => x.TruckInspectionId == inspection.Id)
                .OrderBy(x => x.Angle)
                .Select(x => new TruckInspectionPhotoResponseDto
                {
                    Id = x.Id,  
                    Url = "/api/inspection-photos/" + x.Id,
                    Angle = x.Angle,                  
                    ContentType = x.ContentType,
                    FileSizeBytes = x.FileSizeBytes,
                    UploadedAt = x.UploadedAt
                   
                })
                .ToListAsync(cancellationToken);

            return new TruckInspectionResponseDto
            {
                Id = inspection.Id,
                AssignmentId = inspection.TruckAssignmentId,
                Status = inspection.Status,
                AdditionalComments = inspection.AdditionalComments,
                CreatedAt = inspection.CreatedAt,
                SubmittedAt = inspection.SubmittedAt,
                ApprovedAt = inspection.ApprovedAt,
                ApprovedByUserId = inspection.ApprovedByUserId,
                Answers = answers.Select(MapAnswer).ToList(),
                Photos = photos
            };
        }

        private static TruckInspectionAnswerResponseDto MapAnswer(
            TruckInspectionAnswer answer)
        {
            return new TruckInspectionAnswerResponseDto
            {
                Id = answer.Id,
                CheckCode = answer.CheckCode,
                CheckLabel = answer.CheckLabel,
                HasDefect = answer.HasDefect,
                Notes = answer.Notes
            };
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
                           == "IX_TruckInspections_TruckAssignmentId"
                   );
        }
    }
}