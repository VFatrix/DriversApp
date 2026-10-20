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