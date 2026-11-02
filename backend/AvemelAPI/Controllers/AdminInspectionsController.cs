using System.Security.Claims;
using Avemel.API.Constants;
using Avemel.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Avemel.API.Controllers
{
    [ApiController]
    [Route("api/admin/inspections")]
    [Authorize(Roles = UserRoles.Admin)]
    public class AdminInspectionsController : ControllerBase
    {
        private readonly ITruckInspectionService _inspectionService;

        public AdminInspectionsController(
            ITruckInspectionService inspectionService)
        {
            _inspectionService = inspectionService;
        }

        // GET /api/admin/inspections/pending
        [HttpGet("pending")]
        public async Task<IActionResult> GetPending(
            CancellationToken cancellationToken)
        {
            var inspections =
                await _inspectionService.GetPendingApprovalAsync(
                    cancellationToken);

            return Ok(inspections);
        }

        // POST /api/admin/inspections/1/approve
        [HttpPost("{inspectionId:int:min(1)}/approve")]
        public async Task<IActionResult> Approve(
            int inspectionId,
            CancellationToken cancellationToken)
        {
            if (!int.TryParse(
                    User.FindFirstValue(ClaimTypes.NameIdentifier),
                    out var adminId) ||
                adminId <= 0)
            {
                return Unauthorized();
            }

            try
            {
                var inspection = await _inspectionService.ApproveAsync(
                    inspectionId,
                    adminId,
                    cancellationToken);

                return Ok(inspection);
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
                    "This truck assignment has been released."
                    or "The truck and driver must both be active."
                    or "Only submitted inspections can be approved."
                    or "A newer inspection exists. Review the latest inspection."
                    or "This inspection has already been approved."
                    or "Workshop must clear all truck faults before approval."
                    or "The assignment or inspection changed. Refresh and try again.")
            {
                return Conflict(new
                {
                    message = exception.Message
                });
            }
        }
    }
}