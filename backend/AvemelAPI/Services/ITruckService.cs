using Avemel.API.DTOs.Trucks;

namespace Avemel.API.Services
{
    public interface ITruckService
    {
        Task<TruckResponseDto> CreateAsync(
            CreateTruckRequestDto request,
            CancellationToken cancellationToken = default);

        Task<TruckResponseDto?> GetByIdAsync(
            int id,
            CancellationToken cancellationToken = default);

        Task<List<TruckResponseDto>> GetAllAsync(
            CancellationToken cancellationToken = default);

        Task<List<TruckResponseDto>> GetAvailableAsync(
            CancellationToken cancellationToken = default);

        Task ArchiveAsync(
          int id,
              CancellationToken cancellationToken = default);

        Task RestoreAsync(
            int id,
            CancellationToken cancellationToken = default);
    }
}