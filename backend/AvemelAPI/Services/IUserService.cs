using Avemel.API.DTOs.Users;

namespace Avemel.API.Services
{
    public interface IUserService
    {
        Task<UserResponseDto> CreateAsync(
            CreateUserRequestDto request,
            CancellationToken cancellationToken = default);

        Task<UserResponseDto?> GetByIdAsync(
            int id,
            CancellationToken cancellationToken = default);
    }
}