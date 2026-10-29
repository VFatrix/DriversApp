using System.ComponentModel.DataAnnotations;

namespace Avemel.API.DTOs.TrailerAssignments
{
    public class SaveTrailerAssignmentsRequestDto
    {
        [Required]
        [MaxLength(2, ErrorMessage = "Select no more than two trailers.")]
        public List<int> TrailerIds { get; set; } = new();
    }
}