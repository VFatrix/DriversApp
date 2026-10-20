using System.ComponentModel.DataAnnotations;

namespace Avemel.API.DTOs.TruckReplacements
{
    public class ReviewTruckReplacementRequestDto
    {
        [Required]
        public bool? Approve { get; set; }

        [Required]
        [MaxLength(500)]
        public string ReviewNotes { get; set; } = string.Empty;
    }
}