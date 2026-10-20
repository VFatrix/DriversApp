using System.ComponentModel.DataAnnotations;

namespace Avemel.API.DTOs.Inspections
{
    public class UpdateTruckInspectionAnswerRequestDto
    {
        [Required(ErrorMessage = "Indicate whether this item has a defect.")]
        public bool? HasDefect { get; set; }

        [MaxLength(1000)]
        public string? Notes { get; set; }
    }
}