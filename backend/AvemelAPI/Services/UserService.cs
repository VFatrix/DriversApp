using System.ComponentModel.DataAnnotations;
using Avemel.API.Data;
using Avemel.API.DTOs.Users;
using Avemel.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Avemel.API.Services
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _db;
        private readonly IPasswordHasher<AppUser> _passwordHasher;

        public UserService(
            AppDbContext db,
            IPasswordHasher<AppUser> passwordHasher)
        {
            _db = db;
            _passwordHasher = passwordHasher;
        }

        public async Task<UserResponseDto> CreateAsync(
            CreateUserRequestDto request,
            CancellationToken cancellationToken = default)
        {
            Validator.ValidateObject(
                request,
                new ValidationContext(request),
                validateAllProperties: true);

            if (string.IsNullOrWhiteSpace(request.FullName) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                throw new ValidationException(
                    "Full name and password cannot be blank.");
            }

            var username = request.Username.Trim().ToLowerInvariant();

            if (await _db.Users.AnyAsync(
                u => u.Username == username,
                cancellationToken))
            {
                throw new InvalidOperationException(
                    "This username is already in use.");
            }

            var user = new AppUser
            {
                FullName = request.FullName.Trim(),
                Username = username,
                Role = request.Role,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            user.PasswordHash = _passwordHasher.HashPassword(
                user,
                request.Password);

            _db.Users.Add(user);

            try
            {
                await _db.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException ex)
                when (ex.InnerException is PostgresException postgres &&
                      postgres.SqlState == PostgresErrorCodes.UniqueViolation &&
                      postgres.ConstraintName == "IX_Users_Username")
            {
                // Handles simultaneous requests for the same username.
                _db.Entry(user).State = EntityState.Detached;

                throw new InvalidOperationException(
                    "This username is already in use.",
                    ex);
            }

            return ToResponse(user);
        }


        public async Task<List<UserResponseDto>> GetAllAsync(
    CancellationToken cancellationToken = default)
        {
            var users = await _db.Users
                .AsNoTracking()
                .OrderBy(user => user.FullName)
                .ThenBy(user => user.Id)
                .ToListAsync(cancellationToken);

            return users.Select(ToResponse).ToList();
        }

        public async Task<UserResponseDto?> GetByIdAsync(
            int id,
            CancellationToken cancellationToken = default)
        {
            var user = await _db.Users
                .AsNoTracking()
                .SingleOrDefaultAsync(
                    u => u.Id == id,
                    cancellationToken);

            return user == null ? null : ToResponse(user);
        }


        public async Task ResetPasswordAsync(
    int userId,
    ResetUserPasswordRequestDto request,
    CancellationToken cancellationToken = default)
        {
            Validator.ValidateObject(
                request,
                new ValidationContext(request),
                validateAllProperties: true);

            if (string.IsNullOrWhiteSpace(request.NewPassword))
            {
                throw new ValidationException(
                    "The new password cannot be blank.");
            }

            var user = await _db.Users.SingleOrDefaultAsync(
                u => u.Id == userId,
                cancellationToken);

            if (user is null)
            {
                throw new KeyNotFoundException("User not found.");
            }

            user.PasswordHash = _passwordHasher.HashPassword(
                user,
                request.NewPassword);

            await _db.SaveChangesAsync(cancellationToken);
        }

        public async Task ArchiveDriverAsync(
    int id,
    CancellationToken cancellationToken = default)
        {
            var user = await _db.Users.SingleOrDefaultAsync(
                u => u.Id == id,
                cancellationToken);

            if (user is null || user.Role != "Driver")
            {
                throw new KeyNotFoundException("Driver not found.");
            }

            if (!user.IsActive)
            {
                return;
            }

            var hasActiveAssignment = await _db.TruckAssignments.AnyAsync(
                assignment =>
                    assignment.DriverId == id &&
                    assignment.ReleasedAt == null,
                cancellationToken);

            if (hasActiveAssignment)
            {
                throw new InvalidOperationException(
                    "Release the driver's active truck assignment before archiving.");
            }

            user.IsActive = false;

            await _db.SaveChangesAsync(cancellationToken);
        }

        private static UserResponseDto ToResponse(AppUser user)
        {
            return new UserResponseDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Username = user.Username,
                Role = user.Role,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt
            };
        }
    }
}