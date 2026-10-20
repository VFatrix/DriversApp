using System.ComponentModel.DataAnnotations;

namespace Avemel.API.DTOs.Inspections
{
    public class SaveTruckInspectionRequestDto
    {
        [Required]
        [MinLength(21)]
        [MaxLength(21)]
        public List<SaveTruckInspectionAnswerDto> Answers { get; set; }
            = new();

        [MaxLength(1000)]
        public string? AdditionalComments { get; set; }
    }

    public class SaveTruckInspectionAnswerDto
    {
        [Range(1, int.MaxValue)]
        public int AnswerId { get; set; }

        [Required]
        public bool? HasDefect { get; set; }
    }
}