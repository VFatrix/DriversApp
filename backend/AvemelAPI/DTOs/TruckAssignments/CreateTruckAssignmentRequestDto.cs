using System.ComponentModel.DataAnnotations;

namespace Avemel.API.DTOs.TruckAssignments
{
    public class CreateTruckAssignmentRequestDto
    {
        [Range(1, int.MaxValue,
            ErrorMessage = "Select a valid truck.")]
        public int TruckId { get; set; }
    }
}