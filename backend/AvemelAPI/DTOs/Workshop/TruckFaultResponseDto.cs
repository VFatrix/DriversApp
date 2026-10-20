namespace Avemel.API.DTOs.Workshop
{
    public class TruckFaultResponseDto
    {
        public int Id { get; set; }

        public int TruckId { get; set; }

        public string Reg { get; set; } = string.Empty;

        public string? Make { get; set; }

        public int? TruckInspectionAnswerId { get; set; }

        public string? CheckCode { get; set; }

        public string? CheckLabel { get; set; }

        public string Description { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public int ReportedByUserId { get; set; }

        public DateTime ReportedAt { get; set; }

        public int? ClearedByUserId { get; set; }

        public int? InspectionId { get; set; }

        public DateTime? ClearedAt { get; set; }

        public string? ResolutionNotes { get; set; }
    }
}