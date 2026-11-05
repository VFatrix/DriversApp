using System.ComponentModel.DataAnnotations;

namespace Avemel.API.DTOs.Trips
{
    public class IssueTripInstructionsRequestDto
    {
        [Required]
        [MaxLength(200)]
        public string CustomerName { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? BookingNumber { get; set; }

        public DateTimeOffset? BookingAt { get; set; }

        [Required]
        [MaxLength(500)]
        public string CollectionAddress { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? CollectionContact { get; set; }

        [MaxLength(1000)]
        public string? CargoDescription { get; set; }

        public DateTimeOffset? PlannedLoadingAt { get; set; }

        [MaxLength(2000)]
        public string? LoadingInstructions { get; set; }

        [Required]
        [MaxLength(500)]
        public string DeliveryAddress { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? DeliveryContact { get; set; }

        [MaxLength(2000)]
        public string? DeliveryInstructions { get; set; }
    }
}