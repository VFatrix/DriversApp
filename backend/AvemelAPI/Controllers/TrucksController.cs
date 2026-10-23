using System.ComponentModel.DataAnnotations;
using Avemel.API.Constants;
using Avemel.API.DTOs.Trucks;
using Avemel.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Avemel.API.Controllers
{
    [ApiController]
    [Route("api/trucks")]
    [Authorize]
    public class TrucksController : ControllerBase
    {
        private readonly ITruckService _truckService;

        public TrucksController(ITruckService truckService)
        {
            _truckService = truckService;
        }

        [HttpPost]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<ActionResult<TruckResponseDto>> Create(
            [FromBody] CreateTruckRequestDto request,
            CancellationToken cancellationToken)
        {
            try
            {
                var truck = await _truckService.CreateAsync(
                    request,
                    cancellationToken);

                return CreatedAtAction(
                    nameof(GetById),
                    new { id = truck.Id },
                    truck);
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex) when (
                ex.Message ==
                "This registration number is already in use.")
            {
                return Conflict(new { message = ex.Message });
            }
        }

        [HttpGet]
        [Authorize(Roles =
            UserRoles.Admin + "," +
            UserRoles.Operations + "," +
            UserRoles.Workshop)]
        public async Task<ActionResult<List<TruckResponseDto>>> GetAll(
            CancellationToken cancellationToken)
        {
            var trucks = await _truckService.GetAllAsync(
                cancellationToken);

            return Ok(trucks);
        }

        [HttpGet("{id:int:min(1)}")]
        [Authorize(Roles =
            UserRoles.Admin + "," +
            UserRoles.Operations + "," +
            UserRoles.Workshop + "," +
            UserRoles.Driver)]
        public async Task<ActionResult<TruckResponseDto>> GetById(
            int id,
            CancellationToken cancellationToken)
        {
            var truck = await _truckService.GetByIdAsync(
                id,
                cancellationToken);

            if (truck == null)
            {
                return NotFound(new { message = "Truck not found." });
            }

            return Ok(truck);
        }

        [HttpGet("available")]
        [Authorize(Roles =
            UserRoles.Admin + "," +
            UserRoles.Operations + "," +
            UserRoles.Driver)]

        // PUT: api/trucks/5/archive
        [HttpPut("{id:int:min(1)}/archive")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<IActionResult> Archive(
    int id,
    CancellationToken cancellationToken)
        {
            try
            {
                await _truckService.ArchiveAsync(id, cancellationToken);
                return NoContent();
            }
            catch (KeyNotFoundException exception)
            {
                return NotFound(new { message = exception.Message });
            }
            catch (InvalidOperationException exception)
                when (exception.Message is
                    "Release the truck's active assignment before archiving."
                    or "Truck availability changed. Refresh and try again.")
            {
                return Conflict(new { message = exception.Message });
            }
        }

        // PUT: api/trucks/5/restore
        [HttpPut("{id:int:min(1)}/restore")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<IActionResult> Restore(
            int id,
            CancellationToken cancellationToken)
        {
            try
            {
                await _truckService.RestoreAsync(id, cancellationToken);
                return NoContent();
            }
            catch (KeyNotFoundException exception)
            {
                return NotFound(new { message = exception.Message });
            }
        }

        public async Task<ActionResult<List<TruckResponseDto>>> GetAvailable(
            CancellationToken cancellationToken)
        {
            var trucks = await _truckService.GetAvailableAsync(
                cancellationToken);

            return Ok(trucks);
        }
    }
}