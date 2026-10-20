namespace Avemel.API.DTOs.TruckReplacements
{
    public class TruckReplacementResponseDto
    {
        public int Id { get; set; }

        public int AssignmentId { get; set; }

        public int DriverId { get; set; }

        public int TruckId { get; set; }

        public string Reg { get; set; } = string.Empty;

        public string Reason { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public DateTime RequestedAt { get; set; }

        public int? ReviewedByUserId { get; set; }

        public DateTime? ReviewedAt { get; set; }

        public string? ReviewNotes { get; set; }

        public int? ReplacementTruckAssignmentId { get; set; }

        public int? ReplacementTruckId { get; set; }

        public string? ReplacementReg { get; set; }

        public DateTime? CompletedAt { get; set; }
    }
}