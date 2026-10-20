using System.ComponentModel.DataAnnotations;

namespace Avemel.API.Models
{
    public class TruckInspectionPhoto
    {
        public int Id { get; set; }

        public int TruckInspectionId { get; set; }

        public TruckInspection TruckInspection { get; set; } = null!;

        [Required]
        [MaxLength(20)]
        public string Angle { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string StorageKey { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string ContentType { get; set; } = string.Empty;

        public long FileSizeBytes { get; set; }

        public int UploadedByUserId { get; set; }

        public AppUser UploadedByUser { get; set; } = null!;

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    }
}