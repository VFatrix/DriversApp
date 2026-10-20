using System.ComponentModel.DataAnnotations;

namespace Avemel.API.Models
{
    public class TruckAssignment
    {
        public int Id { get; set; }

        public int TruckId { get; set; }

        public Truck Truck { get; set; } = null!;

        public int DriverId { get; set; }

        public AppUser Driver { get; set; } = null!;

        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

        // Null means the assignment is still active.
        public DateTime? ReleasedAt { get; set; }

        public int? ReleasedByUserId { get; set; }

        public AppUser? ReleasedByUser { get; set; }

        [MaxLength(500)]
        public string? ReleaseReason { get; set; }
    }
}