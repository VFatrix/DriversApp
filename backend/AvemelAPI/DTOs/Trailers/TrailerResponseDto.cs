using System.Text.Json.Serialization;

namespace Avemel.API.DTOs.Trailers
{
    public class TrailerResponseDto
    {
        public int Id { get; set; }

        [JsonPropertyName("reg")]
        public string RegistrationNumber { get; set; } = string.Empty;

        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}