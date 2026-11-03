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
    [Route("api/trips")]
    [Authorize(Roles = UserRoles.Driver)]
    public class TripsController : ControllerBase
    {
        private readonly ITripService _service;

        public TripsController(ITripService service)
        {
            _service = service;
        }

        // POST /api/trips
        [HttpPost]
        public async Task<ActionResult<TripResponseDto>> Create(
            [FromBody] CreateTripRequestDto request,
            CancellationToken cancellationToken)
        {
            if (!TryGetDriverId(out var driverId))
            {
                return Unauthorized();
            }

            try
            {
                var trip = await _service.CreateAsync(
                    driverId,
                    request,
                    cancellationToken);

                return CreatedAtAction(
                    nameof(GetById),
                    new { tripId = trip.Id },
                    trip);
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

        // GET /api/trips/my-active
        [HttpGet("my-active")]
        public async Task<ActionResult<TripResponseDto>> GetMyActive(
            CancellationToken cancellationToken)
        {
            if (!TryGetDriverId(out var driverId))
            {
                return Unauthorized();
            }

            try
            {
                var trip = await _service.GetMyActiveAsync(
                    driverId,
                    cancellationToken);

                if (trip is null)
                {
                    return NotFound(new
                    {
                        message = "You have no unfinished trip."
                    });
                }

                return Ok(trip);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        // GET /api/trips/1
        [HttpGet("{tripId:int:min(1)}")]
        public async Task<ActionResult<TripResponseDto>> GetById(
            int tripId,
            CancellationToken cancellationToken)
        {
            if (!TryGetDriverId(out var driverId))
            {
                return Unauthorized();
            }

            try
            {
                var trip = await _service.GetByIdAsync(
                    tripId,
                    driverId,
                    cancellationToken);

                if (trip is null)
                {
                    return NotFound(new
                    {
                        message = "Trip not found."
                    });
                }

                return Ok(trip);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        private bool TryGetDriverId(out int driverId)
        {
            return int.TryParse(
                User.FindFirstValue(ClaimTypes.NameIdentifier),
                out driverId) && driverId > 0;
        }

        private static bool IsExpectedConflict(string message)
        {
            return message is
                "This truck assignment has been released."
                or "This truck is inactive."
                or "The driver or truck already has an unfinished trip."
                or "Workshop must clear all truck faults before loading."
                or "The latest inspection must be approved by Admin before loading."
                or "Trip availability changed. Refresh and try again.";
        }
    }
}