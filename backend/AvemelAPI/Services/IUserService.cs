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

        Task ResetPasswordAsync(
        int userId,
          ResetUserPasswordRequestDto request,
          CancellationToken cancellationToken = default);

        Task<List<UserResponseDto>> GetAllAsync(
          CancellationToken cancellationToken = default);
        Task ArchiveDriverAsync(
          int id,
         CancellationToken cancellationToken = default);

        Task RestoreDriverAsync(
         int id,
         CancellationToken cancellationToken = default);
    }
}