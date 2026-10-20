using System.ComponentModel.DataAnnotations;

namespace Avemel.API.DTOs.Auth
{
    public class LoginRequestDto
    {
        [Required]
        [MaxLength(100)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [MaxLength(256)]
        public string Password { get; set; } = string.Empty;
    }
} 