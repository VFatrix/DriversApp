using Avemel.API.DTOs.Auth;
using Avemel.API.Models;

namespace Avemel.API.Services
{
    public interface IJwtTokenService
    {
        LoginResponseDto CreateToken(AppUser user);
    }
}