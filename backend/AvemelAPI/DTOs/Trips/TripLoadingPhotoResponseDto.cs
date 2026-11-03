namespace Avemel.API.DTOs.Trips
{
    public class TripLoadingPhotoResponseDto
    {
        public int Id { get; set; }

        public int TripId { get; set; }

        public string Angle { get; set; } = string.Empty;

        public string ContentType { get; set; } = string.Empty;

        public long FileSizeBytes { get; set; }

        public DateTime UploadedAt { get; set; }
    }
}