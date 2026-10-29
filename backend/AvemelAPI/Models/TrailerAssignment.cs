using System.ComponentModel.DataAnnotations;

namespace Avemel.API.Models
{
    public class TrailerAssignment
    {
        public int Id { get; set; }

        public int TruckAssignmentId { get; set; }

        public TruckAssignment TruckAssignment { get; set; } = null!;

        public int TrailerId { get; set; }

        public Trailer Trailer { get; set; } = null!;

        // Position 1 or 2 in the truck's trailer combination.
        [Range(1, 2)]
        public int Position { get; set; }

        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

        // Null means the trailer assignment is still active.
        public DateTime? ReleasedAt { get; set; }

        public int? ReleasedByUserId { get; set; }

        public AppUser? ReleasedByUser { get; set; }

        [MaxLength(500)]
        public string? ReleaseReason { get; set; }
    }
}