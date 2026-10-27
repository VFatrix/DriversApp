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
    [Authorize(Roles = UserRoles.Admin)]
    public class TrailersController : ControllerBase
    {
        private readonly ITrailerService _trailerService;

        public TrailersController(ITrailerService trailerService)
        {
            _trailerService = trailerService;
        }

        [HttpPost]
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

        [HttpGet]
        public async Task<ActionResult<List<TrailerResponseDto>>> GetAll(
            CancellationToken cancellationToken)
        {
            var trailers = await _trailerService.GetAllAsync(
                cancellationToken);

            return Ok(trailers);
        }

        [HttpGet("{id:int:min(1)}")]
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
        }

        [HttpPut("{id:int:min(1)}/restore")]
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