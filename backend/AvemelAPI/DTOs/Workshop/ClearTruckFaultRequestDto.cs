using System.ComponentModel.DataAnnotations;

namespace Avemel.API.DTOs.Workshop
{
    public class ClearTruckFaultRequestDto
    {
        [Required]
        [MaxLength(1000)]
        public string ResolutionNotes { get; set; } = string.Empty;
    }
} // The workshop must describe how the defects were handled and stuff , also I added reject emoty requests