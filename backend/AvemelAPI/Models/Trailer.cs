using System.ComponentModel.DataAnnotations;

namespace Avemel.API.Models
{
    public class Trailer
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(30)]
        public string RegistrationNumber { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}