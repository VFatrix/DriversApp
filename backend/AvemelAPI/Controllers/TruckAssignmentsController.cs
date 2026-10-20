using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Avemel.API.Constants;
using Avemel.API.DTOs.TruckAssignments;
using Avemel.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Avemel.API.Controllers
{
    [ApiController]
    [Route("api/truck-assignments")]
    [Authorize(Roles = UserRoles.Driver)]
    public class TruckAssignmentsController : ControllerBase
    {
        private readonly ITruckAssignmentService _assignmentService;

        public TruckAssignmentsController(
            ITruckAssignmentService assignmentService)
        {
            _assignmentService = assignmentService;
        }

        [HttpPost]
        public async Task<ActionResult<TruckAssignmentResponseDto>> Create(
            [FromBody] CreateTruckAssignmentRequestDto request,
            CancellationToken cancellationToken)
        {
            if (!TryGetDriverId(out var driverId))
            {
                return Unauthorized();
            }

            try
            {
                var assignment = await _assignmentService.CreateAsync(
                    driverId,
                    request,
                    cancellationToken);

                return CreatedAtAction(
                    nameof(GetById),
                    new { id = assignment.Id },
                    assignment);
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex) when (
                IsAssignmentConflict(ex.Message))
            {
                return Conflict(new { message = ex.Message });
            }
        }

        [HttpGet("my-active")]
        public async Task<ActionResult<TruckAssignmentResponseDto>>
            GetMyActive(CancellationToken cancellationToken)
        {
            if (!TryGetDriverId(out var driverId))
            {
                return Unauthorized();
            }

            var assignment = await _assignmentService.GetMyActiveAsync(
                driverId,
                cancellationToken);

            if (assignment == null)
            {
                return NotFound(new
                {
                    message = "You have no active truck assignment."
                });
            }

            return Ok(assignment);
        }

        [HttpGet("{id:int:min(1)}")]
        public async Task<ActionResult<TruckAssignmentResponseDto>> GetById(
            int id,
            CancellationToken cancellationToken)
        {
            if (!TryGetDriverId(out var driverId))
            {
                return Unauthorized();
            }

            var assignment = await _assignmentService.GetByIdAsync(
                id,
                driverId,
                cancellationToken);

            if (assignment == null)
            {
                return NotFound(new
                {
                    message = "Assignment not found."
                });
            }

            return Ok(assignment);
        }

        private bool TryGetDriverId(out int driverId)
        {
            return int.TryParse(
                User.FindFirstValue(ClaimTypes.NameIdentifier),
                out driverId) && driverId > 0;
        }

        private static bool IsAssignmentConflict(string message)
        {
            return message is
                "You already have an active truck assignment." or
                "This truck is inactive." or
                "This truck is already assigned to another driver." or
                "This truck has uncleared faults." or
                "The truck or driver already has an active assignment. Refresh and try again." or
                "Availability changed during selection. Refresh and try again.";
        }
    }
}