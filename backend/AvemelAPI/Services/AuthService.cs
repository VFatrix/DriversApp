using Avemel.API.Constants;
using Avemel.API.Data;
using Avemel.API.DTOs.Auth;
using Avemel.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Avemel.API.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _db;
        private readonly IPasswordHasher<AppUser> _passwordHasher;
        private readonly IJwtTokenService _tokenService;

        public AuthService(
            AppDbContext db,
            IPasswordHasher<AppUser> passwordHasher,
            IJwtTokenService tokenService)
        {
            _db = db;
            _passwordHasher = passwordHasher;
            _tokenService = tokenService;
        }

        public async Task<LoginResponseDto?> LoginAsync(
            LoginRequestDto request,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(request.Username) ||
                string.IsNullOrEmpty(request.Password))
            {
                return null;
            }

            // Store usernames in this same format when creating accounts.
            var username = request.Username.Trim().ToLowerInvariant();

            var user = await _db.Users.SingleOrDefaultAsync(
                u => u.Username == username,
                cancellationToken);

            if (user == null ||
                !user.IsActive ||
                !UserRoles.IsValid(user.Role) ||
                string.IsNullOrWhiteSpace(user.PasswordHash))
            {
                return null;
            }

            var result = _passwordHasher.VerifyHashedPassword(
                user,
                user.PasswordHash,
                request.Password);

            if (result == PasswordVerificationResult.Failed)
            {
                return null;
            }

            // Update older hashes after a successful password check.
            if (result == PasswordVerificationResult.SuccessRehashNeeded)
            {
                user.PasswordHash = _passwordHasher.HashPassword(
                    user,
                    request.Password);

                await _db.SaveChangesAsync(cancellationToken);
            }

            return _tokenService.CreateToken(user);
        }
    }
}