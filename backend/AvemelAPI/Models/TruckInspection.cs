using System.ComponentModel.DataAnnotations;

namespace Avemel.API.Models
{
    public class TruckInspection
    {
        public int Id { get; set; }

        public int TruckAssignmentId { get; set; }

        public TruckAssignment TruckAssignment { get; set; } = null!;

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "Draft";
        [MaxLength(1000)]
        public string? AdditionalComments { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? SubmittedAt { get; set; }
    }
}