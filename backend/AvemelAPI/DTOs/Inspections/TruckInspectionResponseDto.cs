namespace Avemel.API.DTOs.Inspections
{
    public class TruckInspectionResponseDto
    {
        public int Id { get; set; }

        public int AssignmentId { get; set; }

        public string? AdditionalComments { get; set; }

        public string Status { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }

        public DateTime? SubmittedAt { get; set; }

        public List<TruckInspectionAnswerResponseDto> Answers { get; set; }
            = new();

        public List<TruckInspectionPhotoResponseDto> Photos { get; set; }
            = new();
    }
}