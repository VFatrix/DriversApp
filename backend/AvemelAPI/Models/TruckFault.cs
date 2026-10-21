using System.ComponentModel.DataAnnotations;

namespace Avemel.API.Models
{
    public class TruckFault
    {
        public int Id { get; set; }

        public int TruckId { get; set; }

        public Truck Truck { get; set; } = null!;

        // Optional: links an inspection-reported fault to its evidence.
        // Faults reported directly by Workshop can leave this empty.
        public int? TruckInspectionId { get; set; }

        public TruckInspection? TruckInspection { get; set; }

        // Optional so Workshop can also report faults directly.
        public int? TruckInspectionAnswerId { get; set; }

        public TruckInspectionAnswer? TruckInspectionAnswer { get; set; }

        [Required]
        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Open";

        public int ReportedByUserId { get; set; }

        public AppUser ReportedByUser { get; set; } = null!;

        public DateTime ReportedAt { get; set; } = DateTime.UtcNow;

        public int? ClearedByUserId { get; set; }

        public AppUser? ClearedByUser { get; set; }

        public DateTime? ClearedAt { get; set; }

        [MaxLength(1000)]
        public string? ResolutionNotes { get; set; }
    }
}