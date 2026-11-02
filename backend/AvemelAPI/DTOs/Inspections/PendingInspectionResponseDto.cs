namespace Avemel.API.DTOs.Inspections
{
    public class PendingInspectionResponseDto
    {
        public int Id { get; set; }

        public int AssignmentId { get; set; }

        public int TruckId { get; set; }

        public string RegistrationNumber { get; set; } = string.Empty;

        public string DriverName { get; set; } = string.Empty;

        public DateTime? SubmittedAt { get; set; }

        public int UnclearedFaultCount { get; set; }

        public bool CanApprove { get; set; }
    }
}