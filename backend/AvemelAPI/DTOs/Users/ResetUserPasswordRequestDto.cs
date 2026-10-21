using System.ComponentModel.DataAnnotations;

namespace Avemel.API.DTOs.Users
{
    public class ResetUserPasswordRequestDto
    {
        [Required]
        [MinLength(12)]
        public string NewPassword { get; set; } = string.Empty;
    }
}