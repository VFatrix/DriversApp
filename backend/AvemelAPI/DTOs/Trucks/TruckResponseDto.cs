using System.Text.Json.Serialization;

namespace Avemel.API.DTOs.Trucks
{
    public class TruckResponseDto
    {
        public int Id { get; set; }

        [JsonPropertyName("reg")]
        public string RegistrationNumber { get; set; } = string.Empty;

        [JsonPropertyName("make")]
        public string? MakeModel { get; set; }

        public bool IsActive { get; set; }

        public bool IsAvailable { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}