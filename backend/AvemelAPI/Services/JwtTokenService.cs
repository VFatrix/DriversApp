using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Avemel.API.Configuration;
using Avemel.API.Constants;
using Avemel.API.DTOs.Auth;
using Avemel.API.Models;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Avemel.API.Services
{
    public class JwtTokenService : IJwtTokenService
    {
        private readonly JwtSettings _settings;

        public JwtTokenService(IOptions<JwtSettings> options)
        {
            _settings = options.Value;
        }

        public LoginResponseDto CreateToken(AppUser user)
        {
            if (!user.IsActive || !UserRoles.IsValid(user.Role))
            {
                throw new InvalidOperationException(
                    "Cannot create a token for an inactive user or invalid role.");
            }

            if (string.IsNullOrWhiteSpace(_settings.Issuer) ||
                string.IsNullOrWhiteSpace(_settings.Audience) ||
                _settings.ExpiryMinutes <= 0)
            {
                throw new InvalidOperationException(
                    "JWT settings are missing or invalid.");
            }

            byte[] keyBytes;

            try
            {
                keyBytes = Convert.FromBase64String(_settings.SecretKey);
            }
            catch (FormatException)
            {
                throw new InvalidOperationException(
                    "Jwt:SecretKey must be a valid Base64 key.");
            }

            if (keyBytes.Length < 32)
            {
                throw new InvalidOperationException(
                    "Jwt:SecretKey must contain at least 32 random bytes.");
            }

            var now = DateTime.UtcNow;
            var expiresAt = now.AddMinutes(_settings.ExpiryMinutes);

            var claims = new List<Claim>
            {
                new Claim(
                    JwtRegisteredClaimNames.Sub,
                    user.Id.ToString(CultureInfo.InvariantCulture)),

                new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),

                new Claim(ClaimTypes.Role, user.Role),

                new Claim(
                    JwtRegisteredClaimNames.Jti,
                    Guid.NewGuid().ToString())
            };

            var signingKey = new SymmetricSecurityKey(keyBytes);

            var credentials = new SigningCredentials(
                signingKey,
                SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _settings.Issuer,
                audience: _settings.Audience,
                claims: claims,
                notBefore: now,
                expires: expiresAt,
                signingCredentials: credentials);

            return new LoginResponseDto
            {
                Token = new JwtSecurityTokenHandler().WriteToken(token),
                ExpiresAtUtc = expiresAt,
                UserId = user.Id,
                FullName = user.FullName,
                Username = user.Username,
                Role = user.Role
            };
        }
    }
}