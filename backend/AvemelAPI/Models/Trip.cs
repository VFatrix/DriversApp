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

        // Trip instructions entered by Admin.
        [MaxLength(50)]
        public string? InstructionReference { get; set; }

        [MaxLength(200)]
        public string? CustomerName { get; set; }

        [MaxLength(100)]
        public string? BookingNumber { get; set; }

        public DateTime? BookingAt { get; set; }

        [MaxLength(500)]
        public string? CollectionAddress { get; set; }

        [MaxLength(200)]
        public string? CollectionContact { get; set; }

        [MaxLength(1000)]
        public string? CargoDescription { get; set; }

        public DateTime? PlannedLoadingAt { get; set; }

        [MaxLength(2000)]
        public string? LoadingInstructions { get; set; }

        [MaxLength(500)]
        public string? DeliveryAddress { get; set; }

        [MaxLength(200)]
        public string? DeliveryContact { get; set; }

        [MaxLength(2000)]
        public string? DeliveryInstructions { get; set; }

        public DateTime? InstructionsIssuedAt { get; set; }

        public int? InstructionsIssuedByUserId { get; set; }

        public AppUser? InstructionsIssuedByUser { get; set; }

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