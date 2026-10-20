namespace Avemel.API.DTOs.Inspections
{
    public class TruckInspectionPhotoResponseDto
    {
        public int Id { get; set; }

        public string Angle { get; set; } = string.Empty;

        public string ContentType { get; set; } = string.Empty;

        public string Url { get; set; } = string.Empty;

        public long FileSizeBytes { get; set; }

        public DateTime UploadedAt { get; set; }
    }
}