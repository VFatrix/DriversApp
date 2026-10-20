using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Avemel.API.Constants;
using Avemel.API.DTOs.Workshop;
using Avemel.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Avemel.API.Controllers
{
    [ApiController]
    [Route("api/workshop/faults")]
    [Authorize(Roles = UserRoles.Workshop + "," + UserRoles.Admin)]
    public class TruckFaultsController : ControllerBase
    {
        private readonly ITruckFaultService _service;

        public TruckFaultsController(ITruckFaultService service)
        {
            _service = service;
        }

        // GET /api/workshop/faults/uncleared
        [HttpGet("uncleared")]
        public async Task<IActionResult> GetUncleared(
            CancellationToken cancellationToken)
        {
            var faults = await _service.GetUnclearedAsync(
                cancellationToken);

            return Ok(faults);
        }

        // GET /api/workshop/faults/1
        [Authorize(Roles = UserRoles.Workshop)]
        [HttpGet("{faultId:int:min(1)}")]
        public async Task<IActionResult> GetById(
            int faultId,
            CancellationToken cancellationToken)
        {
            var fault = await _service.GetByIdAsync(
                faultId,
                cancellationToken);

            if (fault is null)
            {
                return NotFound(new
                {
                    message = "Fault not found."
                });
            }

            return Ok(fault);
        }

        // POST /api/workshop/faults/1/clear
        [HttpPost("{faultId:int:min(1)}/clear")]
        public async Task<IActionResult> Clear(
            int faultId,
            [FromBody] ClearTruckFaultRequestDto request,
            CancellationToken cancellationToken)
        {
            var claim = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            if (!int.TryParse(claim, out var userId) || userId <= 0)
            {
                return Unauthorized();
            }

            try
            {
                var fault = await _service.ClearAsync(
                    faultId,
                    userId,
                    request,
                    cancellationToken);

                return Ok(fault);
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
                when (exception.Message is
                    "This fault has already been cleared."
                    or "The fault changed while being cleared. Refresh and try again.")
            {
                return Conflict(new
                {
                    message = exception.Message
                });
            }
        }
    }
}