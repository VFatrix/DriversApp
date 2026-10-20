using System.ComponentModel.DataAnnotations;

namespace Avemel.API.DTOs.TruckReplacements
{
    public class ChooseReplacementTruckRequestDto
    {
        [Range(
            1,
            int.MaxValue,
            ErrorMessage = "Select a valid replacement truck.")]
        public int TruckId { get; set; }
    }
}