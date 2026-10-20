using System.Text.Json.Serialization;

namespace Avemel.API.DTOs.TruckAssignments
{
    public class TruckAssignmentResponseDto
    {
        public int Id { get; set; }

        public int TruckId { get; set; }

        [JsonPropertyName("reg")]
        public string RegistrationNumber { get; set; } = string.Empty;

        [JsonPropertyName("make")]
        public string? MakeModel { get; set; }

        public int DriverId { get; set; }

        public DateTime AssignedAt { get; set; }

        public DateTime? ReleasedAt { get; set; }

        public bool IsActive { get; set; }
    }
}