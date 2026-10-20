using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace Avemel.API.DTOs.Inspections
{
    public class UploadTruckInspectionPhotoRequestDto
    {
        [Required]
        [RegularExpression(
            "^(front|left|right|rear)$",
            ErrorMessage = "Angle must be front, left, right or rear.")]
        public string Angle { get; set; } = string.Empty;

        [Required]
        public IFormFile File { get; set; } = null!;
    }
}