using Avemel.API.DTOs.Inspections;

namespace Avemel.API.Services
{
    public interface ITruckInspectionPhotoService
    {
        Task<TruckInspectionPhotoResponseDto> UploadAsync(
            int inspectionId,
            int driverId,
            UploadTruckInspectionPhotoRequestDto request,
            CancellationToken cancellationToken = default);
    }
}