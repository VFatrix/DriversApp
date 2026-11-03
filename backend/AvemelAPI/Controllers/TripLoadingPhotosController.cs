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
    [Route("api/trips/{tripId:int:min(1)}/loading-photos")]
    [Authorize(Roles = UserRoles.Driver)]
    public class TripLoadingPhotosController : ControllerBase
    {
        private readonly ITripLoadingPhotoService _service;

        public TripLoadingPhotosController(
            ITripLoadingPhotoService service)
        {
            _service = service;
        }

        // POST /api/trips/1/loading-photos
        [HttpPost]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(6 * 1024 * 1024)]
        [RequestFormLimits(MultipartBodyLengthLimit = 6 * 1024 * 1024)]
        public async Task<ActionResult<TripLoadingPhotoResponseDto>>
            Upload(
                int tripId,
                [FromForm] UploadTripLoadingPhotoRequestDto request,
                CancellationToken cancellationToken)
        {
            if (!TryGetDriverId(out var driverId))
            {
                return Unauthorized();
            }

            try
            {
                var photo = await _service.UploadAsync(
                    tripId,
                    driverId,
                    request,
                    cancellationToken);

                return StatusCode(StatusCodes.Status201Created, photo);
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

        // GET /api/trips/1/loading-photos
        [HttpGet]
        public async Task<ActionResult<List<TripLoadingPhotoResponseDto>>>
            GetForDriver(
                int tripId,
                CancellationToken cancellationToken)
        {
            if (!TryGetDriverId(out var driverId))
            {
                return Unauthorized();
            }

            try
            {
                var photos = await _service.GetForDriverAsync(
                    tripId,
                    driverId,
                    cancellationToken);

                return Ok(photos);
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
                or "Loading photos can only be uploaded before requesting departure."
                or "The trip's inspection is no longer the latest approved inspection."
                or "Workshop must clear all truck faults before loading."
                or "A loading photo already exists for this angle."
                or "The trip or its photos changed. Refresh and try again.";
        }
    }
}