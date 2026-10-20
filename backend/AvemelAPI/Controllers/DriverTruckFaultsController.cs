using System.Security.Claims;
using Avemel.API.Constants;
using Avemel.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Avemel.API.Controllers
{
    [ApiController]
    [Route("api/driver/truck-faults")]
    [Authorize(Roles = UserRoles.Driver)]
    public class DriverTruckFaultsController : ControllerBase
    {
        private readonly ITruckFaultService _service;

        public DriverTruckFaultsController(ITruckFaultService service)
        {
            _service = service;
        }

        // GET /api/driver/truck-faults
        [HttpGet]
        public async Task<IActionResult> GetMyTruckFaults(
            CancellationToken cancellationToken)
        {
            var claim = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            if (!int.TryParse(claim, out var driverId) || driverId <= 0)
            {
                return Unauthorized();
            }

            var faults = await _service.GetMyTruckFaultsAsync(
                driverId,
                cancellationToken);

            return Ok(faults);
        }
    }
}