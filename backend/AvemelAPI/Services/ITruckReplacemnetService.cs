using Avemel.API.DTOs.TruckReplacements;

namespace Avemel.API.Services
{
    public interface ITruckReplacementService
    {
        Task<TruckReplacementResponseDto> CreateAsync(
            int driverId,
            CreateTruckReplacementRequestDto request,
            CancellationToken cancellationToken = default);

        Task<TruckReplacementResponseDto?> GetMyRequestAsync(
            int requestId,
            int driverId,
            CancellationToken cancellationToken = default);

        Task<List<TruckReplacementResponseDto>> GetPendingAsync(
            CancellationToken cancellationToken = default);

        Task<TruckReplacementResponseDto> ReviewAsync(
            int requestId,
            int reviewerId,
            ReviewTruckReplacementRequestDto request,
            CancellationToken cancellationToken = default);


        Task<TruckReplacementResponseDto?> GetMyActiveAsync(
    int driverId,
    CancellationToken cancellationToken = default);
        Task<TruckReplacementResponseDto> ChooseTruckAsync(
            int requestId,
            int driverId,
            ChooseReplacementTruckRequestDto request,
            CancellationToken cancellationToken = default);
    }
}