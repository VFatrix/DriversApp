using System.ComponentModel.DataAnnotations;
using Avemel.API.Data;
using Avemel.API.DTOs.Trailers;
using Avemel.API.Models;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Avemel.API.Services
{
    public class TrailerService : ITrailerService
    {
        private readonly AppDbContext _db;

        public TrailerService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<TrailerResponseDto> CreateAsync(
            CreateTrailerRequestDto request,
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

            var registration = request.RegistrationNumber
                .Trim()
                .ToUpperInvariant();

            if (await _db.Trailers.AnyAsync(
                trailer => trailer.RegistrationNumber == registration,
                cancellationToken))
            {
                throw new InvalidOperationException(
                    "This trailer registration number is already in use.");
            }

            var trailer = new Trailer
            {
                RegistrationNumber = registration,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _db.Trailers.Add(trailer);

            try
            {
                await _db.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException exception) when (
                exception.InnerException is PostgresException postgres &&
                postgres.SqlState == PostgresErrorCodes.UniqueViolation &&
                postgres.ConstraintName == "IX_Trailers_RegistrationNumber")
            {
                _db.Entry(trailer).State = EntityState.Detached;

                throw new InvalidOperationException(
                    "This trailer registration number is already in use.",
                    exception);
            }

            return ToResponse(trailer);
        }

        public async Task<TrailerResponseDto?> GetByIdAsync(
            int id,
            CancellationToken cancellationToken = default)
        {
            var trailer = await _db.Trailers
                .AsNoTracking()
                .SingleOrDefaultAsync(
                    trailer => trailer.Id == id,
                    cancellationToken);

            return trailer is null ? null : ToResponse(trailer);
        }

        public async Task<List<TrailerResponseDto>> GetAllAsync(
            CancellationToken cancellationToken = default)
        {
            return await _db.Trailers
                .AsNoTracking()
                .OrderBy(trailer => trailer.RegistrationNumber)
                .Select(trailer => new TrailerResponseDto
                {
                    Id = trailer.Id,
                    RegistrationNumber = trailer.RegistrationNumber,
                    IsActive = trailer.IsActive,
                    CreatedAt = trailer.CreatedAt
                })
                .ToListAsync(cancellationToken);
        }

        public async Task ArchiveAsync(
            int id,
            CancellationToken cancellationToken = default)
        {
            var trailer = await _db.Trailers.SingleOrDefaultAsync(
                trailer => trailer.Id == id,
                cancellationToken);

            if (trailer is null)
            {
                throw new KeyNotFoundException("Trailer not found.");
            }

            trailer.IsActive = false;

            await _db.SaveChangesAsync(cancellationToken);
        }

        public async Task RestoreAsync(
            int id,
            CancellationToken cancellationToken = default)
        {
            var trailer = await _db.Trailers.SingleOrDefaultAsync(
                trailer => trailer.Id == id,
                cancellationToken);

            if (trailer is null)
            {
                throw new KeyNotFoundException("Trailer not found.");
            }

            trailer.IsActive = true;

            await _db.SaveChangesAsync(cancellationToken);
        }

        private static TrailerResponseDto ToResponse(Trailer trailer)
        {
            return new TrailerResponseDto
            {
                Id = trailer.Id,
                RegistrationNumber = trailer.RegistrationNumber,
                IsActive = trailer.IsActive,
                CreatedAt = trailer.CreatedAt
            };
        }
    }
}