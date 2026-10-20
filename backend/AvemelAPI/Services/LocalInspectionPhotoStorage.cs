namespace Avemel.API.Services
{
    public class LocalInspectionPhotoStorage : IInspectionPhotoStorage
    {
        private readonly string _storageFolder;

        public LocalInspectionPhotoStorage(IWebHostEnvironment environment)
        {
            _storageFolder = Path.Combine(
                environment.ContentRootPath,
                "App_Data",
                "InspectionPhotos");

            Directory.CreateDirectory(_storageFolder);
        }

        public async Task<string> SaveAsync(
            Stream content,
            string extension,
            CancellationToken cancellationToken = default)
        {
            extension = extension.ToLowerInvariant();

            if (extension is not ".jpg" and not ".png")
            {
                throw new ArgumentException(
                    "Only .jpg and .png storage extensions are supported.",
                    nameof(extension));
            }

            var storageKey = $"{Guid.NewGuid():N}{extension}";
            var fullPath = GetFilePath(storageKey);

            // CreateNew prevents overwriting an existing file.
            await using var output = new FileStream(
                fullPath,
                FileMode.CreateNew,
                FileAccess.Write,
                FileShare.None,
                bufferSize: 81920,
                useAsync: true);

            try
            {
                await content.CopyToAsync(output, cancellationToken);
                await output.FlushAsync(cancellationToken);
            }
            catch
            {
                await output.DisposeAsync();

                // Remove an incomplete upload.
                File.Delete(fullPath);
                throw;
            }

            return storageKey;
        }

        public Task DeleteAsync(
            string storageKey,
            CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();

            File.Delete(GetFilePath(storageKey));

            return Task.CompletedTask;
        }
        public Task<Stream> OpenReadAsync(
    string storageKey,
    CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();

            Stream stream = new FileStream(
                GetFilePath(storageKey),
                FileMode.Open,
                FileAccess.Read,
                FileShare.Read,
                bufferSize: 81920,
                useAsync: true);

            return Task.FromResult(stream);
        }

        private string GetFilePath(string storageKey)
        {
            var extension = Path.GetExtension(storageKey);

            if (extension is not ".jpg" and not ".png"
                || !Guid.TryParseExact(
                    Path.GetFileNameWithoutExtension(storageKey),
                    "N",
                    out _)
                || storageKey != Path.GetFileName(storageKey)
                || storageKey.Contains('/')
                || storageKey.Contains('\\'))
            {
                throw new ArgumentException(
                    "Invalid photo storage key.",
                    nameof(storageKey));
            }

            return Path.Combine(_storageFolder, storageKey);
        }
    }
}