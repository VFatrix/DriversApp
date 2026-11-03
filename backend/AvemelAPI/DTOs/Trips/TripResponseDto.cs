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

        public DateTime? DepartureRequestedAt { get; set; }

        public DateTime? DepartureApprovedAt { get; set; }

        public int? DepartureApprovedByUserId { get; set; }

        public DateTime? StartedAt { get; set; }

        public DateTime? DeliveredAt { get; set; }

        public DateTime? CompletedAt { get; set; }

        public int? CompletedByUserId { get; set; }
    }
}