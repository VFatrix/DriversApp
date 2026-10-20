using System.ComponentModel.DataAnnotations;

namespace Avemel.API.DTOs.Inspections
{
    public class CreateTruckInspectionRequestDto
    {
        [Range(1, int.MaxValue,
            ErrorMessage = "Select a valid truck assignment.")]
        public int AssignmentId { get; set; }
    }
}