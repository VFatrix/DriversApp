using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Avemel.API.Constants;
using Avemel.API.DTOs.TruckReplacements;
using Avemel.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Avemel.API.Controllers
{
    [ApiController]
    [Route("api/truck-replacements")]
    [Authorize]
    public class TruckReplacementsController : ControllerBase
    {
        private readonly ITruckReplacementService _service;

        public TruckReplacementsController(
            ITruckReplacementService service)
        {
            _service = service;
        }

        // POST /api/truck-replacements
        [HttpPost]
        [Authorize(Roles = UserRoles.Driver)]
        public Task<IActionResult> Create(
            [FromBody] CreateTruckReplacementRequestDto request,
            CancellationToken cancellationToken)
        {
            return ExecuteAsync(async userId =>
            {
                var response = await _service.CreateAsync(
                    userId,
                    request,
                    cancellationToken);

                return CreatedAtAction(
                    nameof(GetMyRequest),
                    new { requestId = response.Id },
                    response);
            });
        }

        // GET /api/truck-replacements/1
        [HttpGet("{requestId:int:min(1)}")]
        [Authorize(Roles = UserRoles.Driver)]
        public Task<IActionResult> GetMyRequest(
            int requestId,
            CancellationToken cancellationToken)
        {
            return ExecuteAsync(async userId =>
            {
                var response = await _service.GetMyRequestAsync(
                    requestId,
                    userId,
                    cancellationToken);

                if (response is null)
                {
                    return NotFound(new
                    {
                        message = "Replacement request not found."
                    });
                }

                return Ok(response);
            });
        }




        // GET /api/truck-replacements/my-active
        [HttpGet("my-active")]
        [Authorize(Roles = UserRoles.Driver)]
        public Task<IActionResult> GetMyActive(
            CancellationToken cancellationToken)
        {
            return ExecuteAsync(async userId =>
            {
                var response = await _service.GetMyActiveAsync(
                    userId,
                    cancellationToken);

                if (response is null)
                {
                    return NotFound(new
                    {
                        message = "No active replacement request found."
                    });
                }

                return Ok(response);
            });
        }

        // GET /api/truck-replacements/pending
        [HttpGet("pending")]
        [Authorize(Roles = UserRoles.Workshop + "," + UserRoles.Admin)]
        public Task<IActionResult> GetPending(
            CancellationToken cancellationToken)
        {
            return ExecuteAsync(async _ =>
            {
                var response = await _service.GetPendingAsync(
                    cancellationToken);

                return Ok(response);
            });
        }

        // POST /api/truck-replacements/1/review
        [HttpPost("{requestId:int:min(1)}/review")]
        [Authorize(Roles = UserRoles.Workshop + "," + UserRoles.Admin)]
        public Task<IActionResult> Review(
            int requestId,
            [FromBody] ReviewTruckReplacementRequestDto request,
            CancellationToken cancellationToken)
        {
            return ExecuteAsync(async userId =>
            {
                var response = await _service.ReviewAsync(
                    requestId,
                    userId,
                    request,
                    cancellationToken);

                return Ok(response);
            });
        }

        // POST /api/truck-replacements/1/choose-truck
        [HttpPost("{requestId:int:min(1)}/choose-truck")]
        [Authorize(Roles = UserRoles.Driver)]
        public Task<IActionResult> ChooseTruck(
            int requestId,
            [FromBody] ChooseReplacementTruckRequestDto request,
            CancellationToken cancellationToken)
        {
            return ExecuteAsync(async userId =>
            {
                var response = await _service.ChooseTruckAsync(
                    requestId,
                    userId,
                    request,
                    cancellationToken);

                return Ok(response);
            });
        }

        private async Task<IActionResult> ExecuteAsync(
            Func<int, Task<IActionResult>> action)
        {
            var claim = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            if (!int.TryParse(claim, out var userId) || userId <= 0)
            {
                return Unauthorized();
            }

            try
            {
                return await action(userId);
            }
            catch (ValidationException exception)
            {
                return BadRequest(new { message = exception.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (KeyNotFoundException exception)
            {
                return NotFound(new { message = exception.Message });
            }
            catch (InvalidOperationException exception)
                when (IsExpectedConflict(exception.Message))
            {
                return Conflict(new { message = exception.Message });
            }
        }

        private static bool IsExpectedConflict(string message)
        {
            return message is
                "This truck assignment has been released."
                or "The assigned truck has no uncleared faults."
                or "An active replacement request already exists."
                or "Only pending requests can be reviewed."
                or "The replacement request must be approved first."
                or "The replacement truck is not available."
                or "The request or truck availability changed. Refresh and try again.";
        }
    }
}