using System.ComponentModel.DataAnnotations;
using System.Data;
using Avemel.API.Constants;
using Avemel.API.Data;
using Avemel.API.DTOs.Workshop;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Avemel.API.Services
{
    public class TruckFaultService : ITruckFaultService
    {
        private readonly AppDbContext _db;

        public TruckFaultService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<List<TruckFaultResponseDto>> GetUnclearedAsync(
            CancellationToken cancellationToken = default)
        {
            return await FaultQuery()
                .Where(x => x.Status != "Cleared")
                .OrderBy(x => x.ReportedAt)
                .ThenBy(x => x.Id)
                .ToListAsync(cancellationToken);
        }


        public async Task<List<TruckFaultResponseDto>> GetMyTruckFaultsAsync(
          int driverId,
          CancellationToken cancellationToken = default)
        {
            var truckId = await _db.TruckAssignments
                .AsNoTracking()
                .Where(x => x.DriverId == driverId
                            && x.ReleasedAt == null)
                .Select(x => (int?)x.TruckId)
                .SingleOrDefaultAsync(cancellationToken);

            if (truckId is null)
            {
                return new List<TruckFaultResponseDto>();
            }

            return await FaultQuery()
                .Where(x => x.TruckId == truckId.Value
                            && x.Status != "Cleared")
                .OrderBy(x => x.ReportedAt)
                .ThenBy(x => x.Id)
                .ToListAsync(cancellationToken);
        }
        public async Task<TruckFaultResponseDto?> GetByIdAsync(
            int faultId,
            CancellationToken cancellationToken = default)
        {
            return await FaultQuery()
                .SingleOrDefaultAsync(
                    x => x.Id == faultId,
                    cancellationToken);
        }

        public async Task<TruckFaultResponseDto> ClearAsync(
            int faultId,
            int clearedByUserId,
            ClearTruckFaultRequestDto request,
            CancellationToken cancellationToken = default)
        {
            Validator.ValidateObject(
                request,
                new ValidationContext(request),
                validateAllProperties: true);

            if (string.IsNullOrWhiteSpace(request.ResolutionNotes))
            {
                throw new ValidationException(
                    "Describe how the defect was resolved.");
            }

            await using var transaction =
                await _db.Database.BeginTransactionAsync(
                    IsolationLevel.Serializable,
                    cancellationToken);

            try
            {
                var canClearFaults = await _db.Users.AnyAsync(
                    x => x.Id == clearedByUserId
                         && x.IsActive
                         && (
                             x.Role == UserRoles.Workshop
                             || x.Role == UserRoles.Admin
                         ),
                    cancellationToken);

                if (!canClearFaults)
                {
                    throw new UnauthorizedAccessException(
                        "An active Workshop or Admin account is required.");
                }

                var fault = await _db.TruckFaults
                    .SingleOrDefaultAsync(
                        x => x.Id == faultId,
                        cancellationToken);

                if (fault is null)
                {
                    throw new KeyNotFoundException(
                        "Fault not found.");
                }

                if (fault.Status == "Cleared")
                {
                    throw new InvalidOperationException(
                        "This fault has already been cleared.");
                }

                fault.Status = "Cleared";
                fault.ResolutionNotes = request.ResolutionNotes.Trim();
                fault.ClearedByUserId = clearedByUserId;
                fault.ClearedAt = DateTime.UtcNow;

                await _db.SaveChangesAsync(cancellationToken);

                var response = await FaultQuery()
                    .SingleAsync(
                        x => x.Id == faultId,
                        cancellationToken);

                await transaction.CommitAsync(cancellationToken);

                return response;
            }
            catch (Exception exception)
                when (IsConcurrentChange(exception))
            {
                throw new InvalidOperationException(
                    "The fault changed while being cleared. Refresh and try again.",
                    exception);
            }
        }

        private IQueryable<TruckFaultResponseDto> FaultQuery()
        {
            return _db.TruckFaults
                .AsNoTracking()
                .Select(x => new TruckFaultResponseDto
                {
                    Id = x.Id,
                    TruckId = x.TruckId,
                    Reg = x.Truck.RegistrationNumber,
                    Make = x.Truck.MakeModel,
                    TruckInspectionAnswerId = x.TruckInspectionAnswerId,
                    InspectionId = x.TruckInspectionAnswer != null
                     ? (int?)x.TruckInspectionAnswer.TruckInspectionId
                        : null,

                    CheckCode = x.TruckInspectionAnswer != null
                        ? x.TruckInspectionAnswer.CheckCode
                        : null,

                    CheckLabel = x.TruckInspectionAnswer != null
                        ? x.TruckInspectionAnswer.CheckLabel
                        : null,

                    Description = x.Description,
                    Status = x.Status,
                    ReportedByUserId = x.ReportedByUserId,
                    ReportedAt = x.ReportedAt,
                    ClearedByUserId = x.ClearedByUserId,
                    ClearedAt = x.ClearedAt,
                    ResolutionNotes = x.ResolutionNotes
                });
        }

        private static bool IsConcurrentChange(Exception exception)
        {
            var postgresException = exception as PostgresException
                ?? exception.InnerException as PostgresException;

            return postgresException is not null
                   && (
                       postgresException.SqlState
                           == PostgresErrorCodes.SerializationFailure
                       || postgresException.SqlState
                           == PostgresErrorCodes.DeadlockDetected
                   );
        }
    }
}