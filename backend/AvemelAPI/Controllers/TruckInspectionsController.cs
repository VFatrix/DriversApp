using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Avemel.API.Constants;
using Avemel.API.DTOs.Inspections;
using Avemel.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Avemel.API.Controllers
{
    [ApiController]
    [Route("api/truck-inspections")]
    [Authorize(Roles = UserRoles.Driver)]
    public class TruckInspectionsController : ControllerBase
    {
        private readonly ITruckInspectionService _service;
        private readonly ITruckInspectionPhotoService _photoService;

        public TruckInspectionsController(
            ITruckInspectionService service,
            ITruckInspectionPhotoService photoService)
        {
            _service = service;
            _photoService = photoService;
        }

        // POST /api/truck-inspections
        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] CreateTruckInspectionRequestDto request,
            CancellationToken cancellationToken)
        {
            if (!TryGetDriverId(out var driverId))
            {
                return Unauthorized();
            }

            try
            {
                var inspection = await _service.CreateAsync(
                    driverId,
                    request,
                    cancellationToken);

                return CreatedAtAction(
                    nameof(GetById),
                    new { inspectionId = inspection.Id },
                    inspection);
            }
            catch (ValidationException exception)
            {
                return BadRequest(new { message = exception.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (KeyNotFoundException exception)
            {
                return NotFound(new { message = exception.Message });
            }
            catch (InvalidOperationException exception)
                when (IsExpectedConflict(exception.Message))
            {
                return Conflict(new { message = exception.Message });
            }
        }

        // GET /api/truck-inspections/1
        [HttpGet("{inspectionId:int:min(1)}")]
        public async Task<IActionResult> GetById(
            int inspectionId,
            CancellationToken cancellationToken)
        {
            if (!TryGetDriverId(out var driverId))
            {
                return Unauthorized();
            }

            var inspection = await _service.GetByIdAsync(
                inspectionId,
                driverId,
                cancellationToken);

            if (inspection is null)
            {
                return NotFound(new
                {
                    message = "Inspection not found."
                });
            }

            return Ok(inspection);
        }

        // PUT /api/truck-inspections/1/answers/1
        [HttpPut("{inspectionId:int:min(1)}/answers/{answerId:int:min(1)}")]
        public async Task<IActionResult> UpdateAnswer(
            int inspectionId,
            int answerId,
            [FromBody] UpdateTruckInspectionAnswerRequestDto request,
            CancellationToken cancellationToken)
        {
            if (!TryGetDriverId(out var driverId))
            {
                return Unauthorized();
            }

            try
            {
                var answer = await _service.UpdateAnswerAsync(
                    inspectionId,
                    answerId,
                    driverId,
                    request,
                    cancellationToken);

                return Ok(answer);
            }
            catch (ValidationException exception)
            {
                return BadRequest(new { message = exception.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (KeyNotFoundException exception)
            {
                return NotFound(new { message = exception.Message });
            }
            catch (InvalidOperationException exception)
                when (IsExpectedConflict(exception.Message))
            {
                return Conflict(new { message = exception.Message });
            }
        }

        // POST /api/truck-inspections/1/photos
        [HttpPost("{inspectionId:int:min(1)}/photos")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(6 * 1024 * 1024)]
        [RequestFormLimits(MultipartBodyLengthLimit = 6 * 1024 * 1024)]
        public async Task<IActionResult> UploadPhoto(
            int inspectionId,
            [FromForm] UploadTruckInspectionPhotoRequestDto request,
            CancellationToken cancellationToken)
        {
            if (!TryGetDriverId(out var driverId))
            {
                return Unauthorized();
            }

            try
            {
                var photo = await _photoService.UploadAsync(
                    inspectionId,
                    driverId,
                    request,
                    cancellationToken);

                return StatusCode(StatusCodes.Status201Created, photo);
            }
            catch (ValidationException exception)
            {
                return BadRequest(new { message = exception.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (KeyNotFoundException exception)
            {
                return NotFound(new { message = exception.Message });
            }
            catch (InvalidOperationException exception)
                when (IsExpectedConflict(exception.Message))
            {
                return Conflict(new { message = exception.Message });
            }
        }

        // POST /api/truck-inspections/1/submit
        [HttpPost("{inspectionId:int:min(1)}/submit")]
        public async Task<IActionResult> Submit(
            int inspectionId,
            CancellationToken cancellationToken)
        {
            if (!TryGetDriverId(out var driverId))
            {
                return Unauthorized();
            }

            try
            {
                var inspection = await _service.SubmitAsync(
                    inspectionId,
                    driverId,
                    cancellationToken);

                return Ok(inspection);
            }
            catch (ValidationException exception)
            {
                return BadRequest(new { message = exception.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (KeyNotFoundException exception)
            {
                return NotFound(new { message = exception.Message });
            }
            catch (InvalidOperationException exception)
                when (IsExpectedConflict(exception.Message))
            {
                return Conflict(new { message = exception.Message });
            }
        }

        // GET /api/truck-inspections/my-draft
        [HttpGet("my-draft")]
        public async Task<IActionResult> GetMyDraft(
            CancellationToken cancellationToken)
        {
            if (!TryGetDriverId(out var driverId))
            {
                return Unauthorized();
            }

            var inspection = await _service.GetMyDraftAsync(
                driverId,
                cancellationToken);

            if (inspection is null)
            {
                return NotFound(new
                {
                    message = "No active draft inspection found."
                });
            }

            return Ok(inspection);
        }


        // GET /api/truck-inspections/my-latest
        [HttpGet("my-latest")]
        public async Task<IActionResult> GetMyLatest(
            CancellationToken cancellationToken)
        {
            if (!TryGetDriverId(out var driverId))
            {
                return Unauthorized();
            }

            var inspection = await _service.GetMyLatestAsync(
                driverId,
                cancellationToken);

            if (inspection is null)
            {
                return NotFound(new
                {
                    message = "No inspection found for your active assignment."
                });
            }

            return Ok(inspection);
        }

        // PUT /api/truck-inspections/1/comments
        [HttpPut("{inspectionId:int:min(1)}/comments")]
        public async Task<IActionResult> UpdateComments(
            int inspectionId,
            [FromBody] UpdateTruckInspectionCommentsRequestDto request,
            CancellationToken cancellationToken)
        {
            if (!TryGetDriverId(out var driverId))
            {
                return Unauthorized();
            }

            try
            {
                var inspection = await _service.UpdateCommentsAsync(
                    inspectionId,
                    driverId,
                    request,
                    cancellationToken);

                return Ok(inspection);
            }
            catch (ValidationException exception)
            {
                return BadRequest(new { message = exception.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (KeyNotFoundException exception)
            {
                return NotFound(new { message = exception.Message });
            }
            catch (InvalidOperationException exception)
                when (IsExpectedConflict(exception.Message))
            {
                return Conflict(new { message = exception.Message });
            }
        }

        // PUT /api/truck-inspections/1/save
        [HttpPut("{inspectionId:int:min(1)}/save")]
        public async Task<IActionResult> Save(
            int inspectionId,
            [FromBody] SaveTruckInspectionRequestDto request,
            CancellationToken cancellationToken)
        {
            if (!TryGetDriverId(out var driverId))
            {
                return Unauthorized();
            }

            try
            {
                var inspection = await _service.SaveAsync(
                    inspectionId,
                    driverId,
                    request,
                    cancellationToken);

                return Ok(inspection);
            }
            catch (ValidationException exception)
            {
                return BadRequest(new { message = exception.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (KeyNotFoundException exception)
            {
                return NotFound(new { message = exception.Message });
            }
            catch (InvalidOperationException exception)
                when (IsExpectedConflict(exception.Message))
            {
                return Conflict(new { message = exception.Message });
            }
        }

        private bool TryGetDriverId(out int driverId)
        {
            var value = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            return int.TryParse(value, out driverId)
                   && driverId > 0;
        }

        private static bool IsExpectedConflict(string message)
        {
            return message is
                "This truck assignment has been released."
                or "This assignment already has a draft inspection."
                or "Only draft inspections can be edited."
                or "Only draft inspections can be submitted."
                or "The assignment or inspection changed. Refresh and try again."
                or "A photo already exists for this angle."
                or "The inspection or its photos changed. Refresh and try again.";
        }




    }
}