using Avemel.API.DTOs.Workshop;

namespace Avemel.API.Services
{
    public interface ITruckFaultService
    {
        Task<List<TruckFaultResponseDto>> GetUnclearedAsync(
            CancellationToken cancellationToken = default);

        Task<TruckFaultResponseDto?> GetByIdAsync(
            int faultId,
            CancellationToken cancellationToken = default);


        Task<List<TruckFaultResponseDto>> GetMyTruckFaultsAsync(
             int driverId,
              CancellationToken cancellationToken = default);

        Task<TruckFaultResponseDto> ClearAsync(
            int faultId,
            int clearedByUserId,
            ClearTruckFaultRequestDto request,
            CancellationToken cancellationToken = default);
    }
}