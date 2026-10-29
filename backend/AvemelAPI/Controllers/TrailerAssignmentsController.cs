using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Avemel.API.Constants;
using Avemel.API.DTOs.TrailerAssignments;
using Avemel.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Avemel.API.Controllers
{
    [ApiController]
    [Route("api/truck-assignments/{assignmentId:int:min(1)}/trailers")]
    [Authorize(Roles = UserRoles.Driver)]
    public class TrailerAssignmentsController : ControllerBase
    {
        private readonly ITrailerAssignmentService _service;

        public TrailerAssignmentsController(
            ITrailerAssignmentService service)
        {
            _service = service;
        }

        // GET /api/truck-assignments/1/trailers
        [HttpGet]
        public Task<IActionResult> GetActive(
            int assignmentId,
            CancellationToken cancellationToken)
        {
            return ExecuteAsync(async driverId =>
            {
                var result = await _service.GetActiveAsync(
                    assignmentId,
                    driverId,
                    cancellationToken);

                return Ok(result);
            });
        }

        // GET /api/truck-assignments/1/trailers/available
        [HttpGet("available")]
        public Task<IActionResult> GetAvailable(
            int assignmentId,
            CancellationToken cancellationToken)
        {
            return ExecuteAsync(async driverId =>
            {
                var result = await _service.GetAvailableAsync(
                    assignmentId,
                    driverId,
                    cancellationToken);

                return Ok(result);
            });
        }

        // PUT /api/truck-assignments/1/trailers
        [HttpPut]
        public Task<IActionResult> Save(
            int assignmentId,
            [FromBody] SaveTrailerAssignmentsRequestDto request,
            CancellationToken cancellationToken)
        {
            return ExecuteAsync(async driverId =>
            {
                var result = await _service.SaveAsync(
                    assignmentId,
                    driverId,
                    request,
                    cancellationToken);

                return Ok(result);
            });
        }

        private async Task<IActionResult> ExecuteAsync(
            Func<int, Task<IActionResult>> action)
        {
            var claim = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            if (!int.TryParse(claim, out var driverId) || driverId <= 0)
            {
                return Unauthorized();
            }

            try
            {
                return await action(driverId);
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
                or "Trailer selection cannot change after an inspection has started."
                or "One or more selected trailers are archived."
                or "One or more selected trailers are already assigned."
                or "Trailer availability changed. Refresh and try again.";
        }
    }
}