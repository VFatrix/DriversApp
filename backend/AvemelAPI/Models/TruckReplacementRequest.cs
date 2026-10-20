using System.ComponentModel.DataAnnotations;

namespace Avemel.API.Models
{
    public class TruckReplacementRequest
    {
        public int Id { get; set; }

        public int TruckAssignmentId { get; set; }

        public TruckAssignment TruckAssignment { get; set; } = null!;

        [Required]
        [MaxLength(500)]
        public string Reason { get; set; } = string.Empty;

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "Pending";

        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

        public int? ReviewedByUserId { get; set; }

        public AppUser? ReviewedByUser { get; set; }

        public DateTime? ReviewedAt { get; set; }

        [MaxLength(500)]
        public string? ReviewNotes { get; set; }

        public int? ReplacementTruckAssignmentId { get; set; }

        public TruckAssignment? ReplacementTruckAssignment { get; set; }

        public DateTime? CompletedAt { get; set; }
    }
}