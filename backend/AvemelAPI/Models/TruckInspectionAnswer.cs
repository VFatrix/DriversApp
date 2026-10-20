using System.ComponentModel.DataAnnotations;

namespace Avemel.API.Models
{
    public class TruckInspectionAnswer
    {
        public int Id { get; set; }

        public int TruckInspectionId { get; set; }

        public TruckInspection TruckInspection { get; set; } = null!;

        [Required]
        [MaxLength(100)]
        public string CheckCode { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string CheckLabel { get; set; } = string.Empty;

        // Null means the driver has not answered yet.
        public bool? HasDefect { get; set; }

        [MaxLength(1000)]
        public string? Notes { get; set; }
    }
}