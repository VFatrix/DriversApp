using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Avemel.API.Constants;
using Avemel.API.DTOs.Trips;
using Avemel.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Avemel.API.Controllers
{
    [ApiController]
    [Route("api/admin/trips")]
    [Authorize(Roles = UserRoles.Admin)]
    public class AdminTripInstructionsController : ControllerBase
    {
        private readonly ITripService _service;

        public AdminTripInstructionsController(ITripService service)
        {
            _service = service;
        }

        // POST /api/admin/trips/1/instructions
        [HttpPost("{tripId:int:min(1)}/instructions")]
        public async Task<ActionResult<TripResponseDto>> IssueInstructions(
            int tripId,
            [FromBody] IssueTripInstructionsRequestDto request,
            CancellationToken cancellationToken)
        {
            var claim = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            if (!int.TryParse(claim, out var adminId) || adminId <= 0)
            {
                return Unauthorized();
            }

            try
            {
                var trip = await _service.IssueInstructionsAsync(
                    tripId,
                    adminId,
                    request,
                    cancellationToken);

                return Ok(trip);
            }
            catch (ValidationException exception)
            {
                return BadRequest(new
                {
                    message = exception.Message
                });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (KeyNotFoundException exception)
            {
                return NotFound(new
                {
                    message = exception.Message
                });
            }
            catch (InvalidOperationException exception)
                when (IsExpectedConflict(exception.Message))
            {
                return Conflict(new
                {
                    message = exception.Message
                });
            }
        }

        private static bool IsExpectedConflict(string message)
        {
            return message is
                "This truck assignment has been released."
                or "This truck is inactive."
                or "An active driver account is required for this trip."
                or "Instructions have already been issued for this trip."
                or "Instructions must be issued before departure is requested."
                or "Trip availability changed. Refresh and try again.";
        }
    }
}