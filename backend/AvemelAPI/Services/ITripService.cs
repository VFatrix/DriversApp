using Avemel.API.DTOs.Trips;

namespace Avemel.API.Services
{
    public interface ITripService
    {
        Task<TripResponseDto> CreateAsync(
            int driverId,
            CreateTripRequestDto request,
            CancellationToken cancellationToken = default);

        Task<TripResponseDto?> GetMyActiveAsync(
            int driverId,
            CancellationToken cancellationToken = default);

        Task<TripResponseDto?> GetByIdAsync(
            int tripId,
            int driverId,
            CancellationToken cancellationToken = default);
    }
}