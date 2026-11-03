using System.ComponentModel.DataAnnotations;

namespace Avemel.API.DTOs.Trips
{
    public class CreateTripRequestDto
    {
        [Range(1, int.MaxValue,
            ErrorMessage = "Select a valid truck assignment.")]
        public int AssignmentId { get; set; }
        [Required]
        [RegularExpression("^(Container|Breakbulk|Empty)$",
            ErrorMessage =
                "Load type must be Container, Breakbulk or Empty.")]
        public string LoadType { get; set; } = string.Empty;

        [Required]
        [RegularExpression("^(Up|Down)$",
            ErrorMessage = "Direction must be Up or Down.")]
        public string Direction { get; set; } = string.Empty;
    }
}