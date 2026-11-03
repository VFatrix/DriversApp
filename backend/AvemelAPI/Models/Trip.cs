using System.ComponentModel.DataAnnotations;

namespace Avemel.API.Models
{
    public class Trip
    {
        public int Id { get; set; }

        public int TruckAssignmentId { get; set; }

        public TruckAssignment TruckAssignment { get; set; } = null!;

        public int TruckInspectionId { get; set; }

        public TruckInspection TruckInspection { get; set; } = null!;

        // Container or Breakbulk.
        [Required]
        [MaxLength(30)]
        public string LoadType { get; set; } = string.Empty;

        // Up or Down. Each leg is recorded as a separate trip.
        [Required]
        [MaxLength(10)]
        public string Direction { get; set; } = string.Empty;

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "Loading";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Driver has finished loading and requested permission to depart.
        public DateTime? DepartureRequestedAt { get; set; }

        // Operations has reviewed the loading evidence.
        public DateTime? DepartureApprovedAt { get; set; }

        public int? DepartureApprovedByUserId { get; set; }

        public AppUser? DepartureApprovedByUser { get; set; }

        public DateTime? StartedAt { get; set; }

        public DateTime? DeliveredAt { get; set; }

        // Set only after Operations validates the POD and signature.
        public DateTime? CompletedAt { get; set; }

        public int? CompletedByUserId { get; set; }

        public AppUser? CompletedByUser { get; set; }
    }
}