using Avemel.API.Constants;
using Avemel.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Avemel.API.Controllers
{
    [ApiController]
    [Route("api/workshop/inspections")]
    [Authorize(Roles = UserRoles.Workshop + "," + UserRoles.Admin)]
    public class WorkshopInspectionsController : ControllerBase
    {
        private readonly ITruckInspectionService _service;

        public WorkshopInspectionsController(
            ITruckInspectionService service)
        {
            _service = service;
        }

        // GET /api/workshop/inspections/1
        [HttpGet("{inspectionId:int:min(1)}")]
        public async Task<IActionResult> GetById(
            int inspectionId,
            CancellationToken cancellationToken)
        {
            var inspection = await _service.GetForWorkshopAsync(
                inspectionId,
                cancellationToken);

            if (inspection is null)
            {
                return NotFound(new
                {
                    message = "Submitted inspection not found."
                });
            }

            return Ok(inspection);
        }
    }
}