using Avemel.API.DTOs.TrailerAssignments;
using Avemel.API.DTOs.Trailers;

namespace Avemel.API.Services
{
    public interface ITrailerAssignmentService
    {
        Task<List<TrailerAssignmentResponseDto>> GetActiveAsync(
            int truckAssignmentId,
            int driverId,
            CancellationToken cancellationToken = default);

        Task<List<TrailerResponseDto>> GetAvailableAsync(
            int truckAssignmentId,
            int driverId,
            CancellationToken cancellationToken = default);

        Task<List<TrailerAssignmentResponseDto>> SaveAsync(
            int truckAssignmentId,
            int driverId,
            SaveTrailerAssignmentsRequestDto request,
            CancellationToken cancellationToken = default);
    }
}