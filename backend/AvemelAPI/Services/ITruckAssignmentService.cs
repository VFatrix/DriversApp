using Avemel.API.DTOs.TruckAssignments;

namespace Avemel.API.Services
{
    public interface ITruckAssignmentService
    {
        Task<TruckAssignmentResponseDto> CreateAsync(
            int driverId,
            CreateTruckAssignmentRequestDto request,
            CancellationToken cancellationToken = default);

        Task<TruckAssignmentResponseDto?> GetMyActiveAsync(
            int driverId,
            CancellationToken cancellationToken = default);

        Task<TruckAssignmentResponseDto?> GetByIdAsync(
            int assignmentId,
            int driverId,
            CancellationToken cancellationToken = default);
    }
}