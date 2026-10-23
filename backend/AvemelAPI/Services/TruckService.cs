using System.ComponentModel.DataAnnotations;
using Avemel.API.Data;
using Avemel.API.DTOs.Trucks;
using Avemel.API.Models;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Avemel.API.Services
{
    public class TruckService : ITruckService
    {
        private readonly AppDbContext _db;

        public TruckService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<TruckResponseDto> CreateAsync(
            CreateTruckRequestDto request,
            CancellationToken cancellationToken = default)
        {
            Validator.ValidateObject(
                request,
                new ValidationContext(request),
                validateAllProperties: true);

            if (string.IsNullOrWhiteSpace(request.RegistrationNumber))
            {
                throw new ValidationException(
                    "Registration number cannot be blank.");
            }

            var registrationNumber =
                request.RegistrationNumber.Trim().ToUpperInvariant();

            var alreadyExists = await _db.Trucks.AnyAsync(
                truck => truck.RegistrationNumber == registrationNumber,
                cancellationToken);

            if (alreadyExists)
            {
                throw new InvalidOperationException(
                    "This registration number is already in use.");
            }

            var truck = new Truck
            {
                RegistrationNumber = registrationNumber,
                MakeModel = string.IsNullOrWhiteSpace(request.MakeModel)
                    ? null
                    : request.MakeModel.Trim(),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _db.Trucks.Add(truck);

            try
            {
                await _db.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException ex) when (
                ex.InnerException is PostgresException postgres &&
                postgres.SqlState == PostgresErrorCodes.UniqueViolation &&
                postgres.ConstraintName == "IX_Trucks_RegistrationNumber")
            {
                _db.Entry(truck).State = EntityState.Detached;

                throw new InvalidOperationException(
                    "This registration number is already in use.",
                    ex);
            }

            return new TruckResponseDto
            {
                Id = truck.Id,
                RegistrationNumber = truck.RegistrationNumber,
                MakeModel = truck.MakeModel,
                IsActive = truck.IsActive,
                IsAvailable = true,
                CreatedAt = truck.CreatedAt
            };
        }

        public async Task<TruckResponseDto?> GetByIdAsync(
            int id,
            CancellationToken cancellationToken = default)
        {
            return await GetTruckQuery()
                .SingleOrDefaultAsync(
                    truck => truck.Id == id,
                    cancellationToken);
        }

        public async Task<List<TruckResponseDto>> GetAllAsync(
            CancellationToken cancellationToken = default)
        {
            return await GetTruckQuery()
                .OrderBy(truck => truck.RegistrationNumber)
                .ToListAsync(cancellationToken);
        }

        public async Task<List<TruckResponseDto>> GetAvailableAsync(
            CancellationToken cancellationToken = default)
        {
            return await GetTruckQuery()
                .Where(truck => truck.IsAvailable)
                .OrderBy(truck => truck.RegistrationNumber)
                .ToListAsync(cancellationToken);
        }

        public async Task ArchiveAsync(
    int id,
    CancellationToken cancellationToken = default)
        {
            await using var transaction =
                await _db.Database.BeginTransactionAsync(
                    System.Data.IsolationLevel.Serializable,
                    cancellationToken);

            try
            {
                var truck = await _db.Trucks.SingleOrDefaultAsync(
                    t => t.Id == id,
                    cancellationToken);

                if (truck is null)
                {
                    throw new KeyNotFoundException("Truck not found.");
                }

                var hasActiveAssignment = await _db.TruckAssignments.AnyAsync(
                    assignment =>
                        assignment.TruckId == id &&
                        assignment.ReleasedAt == null,
                    cancellationToken);

                if (hasActiveAssignment)
                {
                    throw new InvalidOperationException(
                        "Release the truck's active assignment before archiving.");
                }

                truck.IsActive = false;

                await _db.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
            }
            catch (Exception exception) when (
                exception is PostgresException
                {
                    SqlState: PostgresErrorCodes.SerializationFailure
                } ||
                exception is DbUpdateException
                {
                    InnerException: PostgresException
                    {
                        SqlState: PostgresErrorCodes.SerializationFailure
                    }
                })
            {
                throw new InvalidOperationException(
                    "Truck availability changed. Refresh and try again.",
                    exception);
            }
        }

        public async Task RestoreAsync(
            int id,
            CancellationToken cancellationToken = default)
        {
            var truck = await _db.Trucks.SingleOrDefaultAsync(
                t => t.Id == id,
                cancellationToken);

            if (truck is null)
            {
                throw new KeyNotFoundException("Truck not found.");
            }

            truck.IsActive = true;

            await _db.SaveChangesAsync(cancellationToken);
        }

        private IQueryable<TruckResponseDto> GetTruckQuery()
        {
            return _db.Trucks
                .AsNoTracking()
                .Select(truck => new TruckResponseDto
                {
                    Id = truck.Id,
                    RegistrationNumber = truck.RegistrationNumber,
                    MakeModel = truck.MakeModel,
                    IsActive = truck.IsActive,
                    CreatedAt = truck.CreatedAt,

                    IsAvailable =
                        truck.IsActive &&
                        !_db.TruckAssignments.Any(assignment =>
                            assignment.TruckId == truck.Id &&
                            assignment.ReleasedAt == null) &&
                        !_db.TruckFaults.Any(fault =>
                            fault.TruckId == truck.Id &&
                            fault.Status != "Cleared")
                });
        }
    }
}