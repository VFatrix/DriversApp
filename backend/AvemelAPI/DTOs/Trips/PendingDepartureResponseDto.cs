namespace Avemel.API.DTOs.Trips
{
    public class PendingDepartureResponseDto
    {
        public int Id { get; set; }

        public int AssignmentId { get; set; }

        public int InspectionId { get; set; }

        public string RegistrationNumber { get; set; } = string.Empty;

        public string DriverName { get; set; } = string.Empty;

        public string LoadType { get; set; } = string.Empty;

        public string Direction { get; set; } = string.Empty;

        public DateTime? DepartureRequestedAt { get; set; }

        public int UnclearedFaultCount { get; set; }

        public bool CanApprove { get; set; }

        public string? ApprovalBlockedReason { get; set; }

        public List<TripLoadingPhotoResponseDto> Photos { get; set; }
            = new();
    }
}