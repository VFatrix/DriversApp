using System.ComponentModel.DataAnnotations;

namespace Avemel.API.DTOs.TruckReplacements
{
    public class CreateTruckReplacementRequestDto
    {
        [Range(1, int.MaxValue)]
        public int AssignmentId { get; set; }

        [Required]
        [MaxLength(500)]
        public string Reason { get; set; } = string.Empty;
    }
}