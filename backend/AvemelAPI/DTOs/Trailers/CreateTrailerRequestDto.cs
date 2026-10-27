using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Avemel.API.DTOs.Trailers
{
    public class CreateTrailerRequestDto
    {
        [Required]
        [MaxLength(30)]
        [JsonPropertyName("reg")]
        public string RegistrationNumber { get; set; } = string.Empty;
    }
}