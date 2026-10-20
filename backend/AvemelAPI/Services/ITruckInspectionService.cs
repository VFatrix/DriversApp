using Avemel.API.DTOs.Inspections;

namespace Avemel.API.Services
{
    public interface ITruckInspectionService
    {
        Task<TruckInspectionResponseDto> CreateAsync(
            int driverId,
            CreateTruckInspectionRequestDto request,
            CancellationToken cancellationToken = default);

        Task<TruckInspectionResponseDto?> GetForWorkshopAsync(
         int inspectionId,
        CancellationToken cancellationToken = default);

        Task<TruckInspectionResponseDto?> GetMyLatestAsync(
         int driverId,
    CancellationToken cancellationToken = default);

        Task<TruckInspectionResponseDto?> GetByIdAsync(
            int inspectionId,
            int driverId,
            CancellationToken cancellationToken = default);

        Task<TruckInspectionResponseDto?> GetMyDraftAsync(
           int driverId,
           CancellationToken cancellationToken = default);

        Task<TruckInspectionAnswerResponseDto> UpdateAnswerAsync(
            int inspectionId,
            int answerId,
            int driverId,
            UpdateTruckInspectionAnswerRequestDto request,
            CancellationToken cancellationToken = default);

        Task<TruckInspectionResponseDto> SubmitAsync(
         int inspectionId,
         int driverId,
         CancellationToken cancellationToken = default);

        Task<TruckInspectionResponseDto> UpdateCommentsAsync(
           int inspectionId,
            int driverId,
              UpdateTruckInspectionCommentsRequestDto request,
             CancellationToken cancellationToken = default);

        Task<TruckInspectionResponseDto> SaveAsync(
    int inspectionId,
    int driverId,
    SaveTruckInspectionRequestDto request,
    CancellationToken cancellationToken = default);
    }
}