using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace Avemel.API.DTOs.Trips
{
    public class UploadTripLoadingPhotoRequestDto
    {
        [Required]
        [MaxLength(30)]
        public string Angle { get; set; } = string.Empty;

        [Required]
        public IFormFile File { get; set; } = null!;
    }
}