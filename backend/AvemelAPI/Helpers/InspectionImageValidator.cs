using System.ComponentModel.DataAnnotations;
using SkiaSharp;

namespace Avemel.API.Helpers
{
    public static class InspectionImageValidator
    {
        public const long MaxFileSizeBytes = 5 * 1024 * 1024;

        private const long MaxPixelCount = 20_000_000;

        public sealed record ValidatedImage(
            byte[] Content,
            string Extension,
            string ContentType);

        public static async Task<ValidatedImage> ValidateAsync(
            IFormFile file,
            CancellationToken cancellationToken = default)
        {
            if (file is null || file.Length == 0)
            {
                throw new ValidationException(
                    "Select an image to upload.");
            }

            if (file.Length > MaxFileSizeBytes)
            {
                throw new ValidationException(
                    "The image must be 5 MB or smaller.");
            }

            // Read with a limit rather than trusting the reported length.
            using var buffer = new MemoryStream();
            await using var input = file.OpenReadStream();

            var chunk = new byte[81920];
            int bytesRead;

            while ((bytesRead = await input.ReadAsync(
                chunk.AsMemory(),
                cancellationToken)) > 0)
            {
                if (buffer.Length + bytesRead > MaxFileSizeBytes)
                {
                    throw new ValidationException(
                        "The image must be 5 MB or smaller.");
                }

                await buffer.WriteAsync(
                    chunk.AsMemory(0, bytesRead),
                    cancellationToken);
            }

            if (buffer.Length == 0)
            {
                throw new ValidationException(
                    "Select an image to upload.");
            }

            var content = buffer.ToArray();


         

            using var data = SKData.CreateCopy(content);
            using var codec = SKCodec.Create(data);

            if (codec is null)
            {
                throw new ValidationException(
                    "The file is not a readable image.");
            }

            string extension;
            string contentType;

            switch (codec.EncodedFormat)
            {
                case SKEncodedImageFormat.Jpeg:
                    extension = ".jpg";
                    contentType = "image/jpeg";
                    break;

                case SKEncodedImageFormat.Png:
                    extension = ".png";
                    contentType = "image/png";
                    break;

                default:
                    throw new ValidationException(
                        "Only JPEG and PNG images are supported.");
            }

            var width = codec.Info.Width;
            var height = codec.Info.Height;

            if (width <= 0 || height <= 0
                || (long)width * height > MaxPixelCount)
            {
                throw new ValidationException(
                    "The image must contain no more than 20 million pixels.");
            }

            cancellationToken.ThrowIfCancellationRequested();

            // Decode all pixels to reject incomplete or damaged images.
            var info = new SKImageInfo(
                width,
                height,
                SKColorType.Rgba8888,
                SKAlphaType.Premul);

            using var bitmap = new SKBitmap(info);

            var pixels = bitmap.GetPixels();

            if (pixels == IntPtr.Zero)
            {
                throw new InvalidOperationException(
                    "Unable to allocate memory for image validation.");
            }

            var result = codec.GetPixels(info, pixels);

            if (result != SKCodecResult.Success)
            {
                throw new ValidationException(
                    "The image is damaged or incomplete. Capture it again.");
            }

            cancellationToken.ThrowIfCancellationRequested();

            return new ValidatedImage(
                content,
                extension,
                contentType);
        }
    }
}