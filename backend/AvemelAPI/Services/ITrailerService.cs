using Avemel.API.DTOs.Trailers;

namespace Avemel.API.Services
{
    public interface ITrailerService
    {
        Task<TrailerResponseDto> CreateAsync(
            CreateTrailerRequestDto request,
            CancellationToken cancellationToken = default);

        Task<TrailerResponseDto?> GetByIdAsync(
            int id,
            CancellationToken cancellationToken = default);

        Task<List<TrailerResponseDto>> GetAllAsync(
            CancellationToken cancellationToken = default);

        Task<List<TrailerResponseDto>> GetActiveAsync(
    CancellationToken cancellationToken = default);

        Task ArchiveAsync(
            int id,
            CancellationToken cancellationToken = default);

        Task RestoreAsync(
            int id,
            CancellationToken cancellationToken = default);
    }
}