using Avemel.API.DTOs.Trips;

namespace Avemel.API.Services
{
    public interface ITripLoadingPhotoService
    {
        Task<TripLoadingPhotoResponseDto> UploadAsync(
            int tripId,
            int driverId,
            UploadTripLoadingPhotoRequestDto request,
            CancellationToken cancellationToken = default);

        Task<List<TripLoadingPhotoResponseDto>> GetForDriverAsync(
            int tripId,
            int driverId,
            CancellationToken cancellationToken = default);
    }
}