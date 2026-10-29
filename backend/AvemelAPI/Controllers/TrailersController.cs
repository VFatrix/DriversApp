using System.ComponentModel.DataAnnotations;
using Avemel.API.Constants;
using Avemel.API.DTOs.Trailers;
using Avemel.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Avemel.API.Controllers
{
    [ApiController]
    [Route("api/trailers")]
    [Authorize]
    public class TrailersController : ControllerBase
    {
        private readonly ITrailerService _trailerService;

        public TrailersController(ITrailerService trailerService)
        {
            _trailerService = trailerService;
        }

        [HttpPost]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<ActionResult<TrailerResponseDto>> Create(
            [FromBody] CreateTrailerRequestDto request,
            CancellationToken cancellationToken)
        {
            try
            {
                var trailer = await _trailerService.CreateAsync(
                    request,
                    cancellationToken);

                return CreatedAtAction(
                    nameof(GetById),
                    new { id = trailer.Id },
                    trailer);
            }
            catch (ValidationException exception)
            {
                return BadRequest(new { message = exception.Message });
            }
            catch (InvalidOperationException exception) when (
                exception.Message ==
                "This trailer registration number is already in use.")
            {
                return Conflict(new { message = exception.Message });
            }
        }
        // GET /api/trailers/active
        [HttpGet("active")]
        [Authorize(Roles = UserRoles.Admin + "," + UserRoles.Driver)]
        public async Task<ActionResult<List<TrailerResponseDto>>> GetActive(
            CancellationToken cancellationToken)
        {
            var trailers = await _trailerService.GetActiveAsync(
                cancellationToken);

            return Ok(trailers);
        }

        [HttpGet]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<ActionResult<List<TrailerResponseDto>>> GetAll(
            CancellationToken cancellationToken)
        {
            var trailers = await _trailerService.GetAllAsync(
                cancellationToken);

            return Ok(trailers);
        }

        [HttpGet("{id:int:min(1)}")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<ActionResult<TrailerResponseDto>> GetById(
            int id,
            CancellationToken cancellationToken)
        {
            var trailer = await _trailerService.GetByIdAsync(
                id,
                cancellationToken);

            if (trailer is null)
            {
                return NotFound(new { message = "Trailer not found." });
            }

            return Ok(trailer);
        }

        [HttpPut("{id:int:min(1)}/archive")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<IActionResult> Archive(
            int id,
            CancellationToken cancellationToken)
        {
            try
            {
                await _trailerService.ArchiveAsync(
                    id,
                    cancellationToken);

                return NoContent();
            }
            catch (KeyNotFoundException exception)
            {
                return NotFound(new { message = exception.Message });
            }
            catch (InvalidOperationException exception) when (
    exception.Message is
        "Release the trailer's active assignment before archiving."
        or "Trailer availability changed. Refresh and try again.")
            {
                return Conflict(new { message = exception.Message });
            }
        }

        [HttpPut("{id:int:min(1)}/restore")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<IActionResult> Restore(
            int id,
            CancellationToken cancellationToken)
        {
            try
            {
                await _trailerService.RestoreAsync(
                    id,
                    cancellationToken);

                return NoContent();
            }
            catch (KeyNotFoundException exception)
            {
                return NotFound(new { message = exception.Message });
            }
        }
    }
}