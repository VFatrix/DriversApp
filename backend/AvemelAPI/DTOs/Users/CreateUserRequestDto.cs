using System.ComponentModel.DataAnnotations;

namespace Avemel.API.DTOs.Users
{
    public class CreateUserRequestDto
    {
        [Required]
        [MaxLength(150)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        [RegularExpression(
            @"^[a-zA-Z0-9._-]+$",
            ErrorMessage =
                "Username can contain only letters, numbers, dots, underscores and hyphens.")]
        public string Username { get; set; } = string.Empty;

        [Required]
        [MinLength(12)]
        [MaxLength(256)]
        public string Password { get; set; } = string.Empty;

        [Required]
        [RegularExpression(
            @"^(Driver|Operations|HRPayroll|Workshop|Admin)$",
            ErrorMessage = "Select a valid user role.")]
        public string Role { get; set; } = string.Empty;
    }
}