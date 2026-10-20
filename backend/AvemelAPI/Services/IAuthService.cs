using Avemel.API.DTOs.Auth;

namespace Avemel.API.Services
{
    public interface IAuthService
    {
        Task<LoginResponseDto?> LoginAsync(
            LoginRequestDto request,
            CancellationToken cancellationToken = default);
    }
}