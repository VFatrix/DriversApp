namespace Avemel.API.DTOs.Inspections
{
    public class TruckInspectionAnswerResponseDto
    {
        public int Id { get; set; }

        public string CheckCode { get; set; } = string.Empty;

        public string CheckLabel { get; set; } = string.Empty;

        public bool? HasDefect { get; set; }

        public string? Notes { get; set; }
    }
}