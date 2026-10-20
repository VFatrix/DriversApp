namespace Avemel.API.Services
{
    public interface IInspectionPhotoStorage
    {

        Task<Stream> OpenReadAsync(
    string storageKey,
    CancellationToken cancellationToken = default);
        Task<string> SaveAsync(
            Stream content,
            string extension,
            CancellationToken cancellationToken = default);

        Task DeleteAsync(
            string storageKey,
            CancellationToken cancellationToken = default);
    }
}