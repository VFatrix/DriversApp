using System.ComponentModel.DataAnnotations;

namespace Avemel.API.Models
{
    public class TripLoadingPhoto
    {
        public int Id { get; set; }

        public int TripId { get; set; }

        public Trip Trip { get; set; } = null!;

        [Required]
        [MaxLength(30)]
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