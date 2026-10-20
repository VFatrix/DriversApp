using System.ComponentModel.DataAnnotations;

namespace Avemel.API.DTOs.Inspections
{
    public class UpdateTruckInspectionCommentsRequestDto
    {
        [MaxLength(1000)]
        public string? AdditionalComments { get; set; }
    }
}