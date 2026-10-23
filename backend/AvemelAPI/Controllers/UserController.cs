using System.ComponentModel.DataAnnotations;
using Avemel.API.Constants;
using Avemel.API.DTOs.Users;
using Avemel.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Avemel.API.Controllers
{
    [ApiController]
    [Route("api/users")]
    [Authorize(Roles = UserRoles.Admin)]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        // POST: api/users
        [HttpPost]
        public async Task<ActionResult<UserResponseDto>> Create(
            [FromBody] CreateUserRequestDto request,
            CancellationToken cancellationToken)
        {
            try
            {
                var user = await _userService.CreateAsync(
                    request,
                    cancellationToken);

                return CreatedAtAction(
                    nameof(GetById),
                    new { id = user.Id },
                    user);
            }
            catch (ValidationException ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
            catch (InvalidOperationException ex)
                when (ex.Message == "This username is already in use.")
            {
                return Conflict(new
                {
                    message = ex.Message
                });
            }
        }

        // PUT: api/users/5/password
        [HttpPut("{id:int:min(1)}/password")]
        public async Task<IActionResult> ResetPassword(
            int id,
            [FromBody] ResetUserPasswordRequestDto request,
            CancellationToken cancellationToken)
        {
            try
            {
                await _userService.ResetPasswordAsync(
                    id,
                    request,
                    cancellationToken);

                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        // GET: api/users
        [HttpGet]
        public async Task<ActionResult<List<UserResponseDto>>> GetAll(
            CancellationToken cancellationToken)
        {
            var users = await _userService.GetAllAsync(
                cancellationToken);

            return Ok(users);
        }

        // PUT: api/users/5/archive
        [HttpPut("{id:int:min(1)}/archive")]
        public async Task<IActionResult> ArchiveDriver(
            int id,
            CancellationToken cancellationToken)
        {
            try
            {
                await _userService.ArchiveDriverAsync(
                    id,
                    cancellationToken);

                return NoContent();
            }
            catch (KeyNotFoundException exception)
            {
                return NotFound(new
                {
                    message = exception.Message
                });
            }
            catch (InvalidOperationException exception)
                when (exception.Message ==
                    "Release the driver's active truck assignment before archiving.")
            {
                return Conflict(new
                {
                    message = exception.Message
                });
            }
        }

        // PUT: api/users/5/restore
        [HttpPut("{id:int:min(1)}/restore")]
        public async Task<IActionResult> RestoreDriver(
            int id,
            CancellationToken cancellationToken)
        {
            try
            {
                await _userService.RestoreDriverAsync(
                    id,
                    cancellationToken);

                return NoContent();
            }
            catch (KeyNotFoundException exception)
            {
                return NotFound(new
                {
                    message = exception.Message
                });
            }
        }

        // GET: api/users/5
        [HttpGet("{id:int:min(1)}")]
        public async Task<ActionResult<UserResponseDto>> GetById(
            int id,
            CancellationToken cancellationToken)
        {
            var user = await _userService.GetByIdAsync(
                id,
                cancellationToken);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            return Ok(user);
        }
    }
}