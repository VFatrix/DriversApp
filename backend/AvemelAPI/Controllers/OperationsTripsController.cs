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
    [Route("api/operations/trips")]
    [Authorize(Roles = UserRoles.Admin)]
    public class OperationsTripsController : ControllerBase
    {
        private readonly ITripService _service;

        public OperationsTripsController(ITripService service)
        {
            _service = service;
        }

        // GET /api/operations/trips/pending-departures
        [HttpGet("pending-departures")]
        public async Task<ActionResult<List<PendingDepartureResponseDto>>>
            GetPendingDepartures(CancellationToken cancellationToken)
        {
            if (!TryGetUserId(out var userId))
            {
                return Unauthorized();
            }

            try
            {
                var requests = await _service.GetPendingDeparturesAsync(
                    userId,
                    cancellationToken);

                return Ok(requests);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        // POST /api/operations/trips/1/approve-departure
        [HttpPost("{tripId:int:min(1)}/approve-departure")]
        public async Task<ActionResult<TripResponseDto>> ApproveDeparture(
            int tripId,
            CancellationToken cancellationToken)
        {
            if (!TryGetUserId(out var userId))
            {
                return Unauthorized();
            }

            try
            {
                var trip = await _service.ApproveDepartureAsync(
                    tripId,
                    userId,
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

        private bool TryGetUserId(out int userId)
        {
            return int.TryParse(
                User.FindFirstValue(ClaimTypes.NameIdentifier),
                out userId) && userId > 0;
        }

        private static bool IsExpectedConflict(string message)
        {
            return message is
                "This trip is no longer awaiting departure approval."
                or "This truck assignment has been released."
                or "This truck is inactive."
                or "An active driver account is required for this trip."
                or "The trip's inspection is no longer the latest approved inspection."
                or "Workshop must clear all truck faults before departure."
                or "Trip availability changed. Refresh and try again." 
                or "Admin must issue complete trip instructions before departure.";
        }
    }
}