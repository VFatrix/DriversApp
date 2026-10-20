using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Avemel.API.DTOs.Trucks
{
    public class CreateTruckRequestDto
    {
        [Required]
        [MaxLength(30)]
        [JsonPropertyName("reg")]
        [RegularExpression(
            @"^[a-zA-Z0-9 -]+$",
            ErrorMessage =
                "Registration number can contain only letters, numbers, spaces and hyphens.")]
        public string RegistrationNumber { get; set; } = string.Empty;

        [MaxLength(100)]
        [JsonPropertyName("make")]
        public string? MakeModel { get; set; }
    }
}