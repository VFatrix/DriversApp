namespace Avemel.API.DTOs.Trips
{
    public class TripResponseDto
    {
        public int Id { get; set; }

        public int AssignmentId { get; set; }

        public int InspectionId { get; set; }

        public int TruckId { get; set; }

        public string RegistrationNumber { get; set; } = string.Empty;

        public int DriverId { get; set; }

        public string LoadType { get; set; } = string.Empty;

        public string Direction { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }

        public string? InstructionReference { get; set; }

        public string? CustomerName { get; set; }

        public string? BookingNumber { get; set; }

        public DateTime? BookingAt { get; set; }

        public string? CollectionAddress { get; set; }

        public string? CollectionContact { get; set; }

        public string? CargoDescription { get; set; }

        public DateTime? PlannedLoadingAt { get; set; }

        public string? LoadingInstructions { get; set; }

        public string? DeliveryAddress { get; set; }

        public string? DeliveryContact { get; set; }

        public string? DeliveryInstructions { get; set; }

        public DateTime? InstructionsIssuedAt { get; set; }

        public int? InstructionsIssuedByUserId { get; set; }

        public DateTime? DepartureRequestedAt { get; set; }

        public DateTime? DepartureApprovedAt { get; set; }

        public int? DepartureApprovedByUserId { get; set; }

        public DateTime? StartedAt { get; set; }

        public DateTime? DeliveredAt { get; set; }

        public DateTime? CompletedAt { get; set; }

        public int? CompletedByUserId { get; set; }
    }
}