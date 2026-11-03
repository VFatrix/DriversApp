using System.Security.Claims;
using Avemel.API.Constants;
using Avemel.API.Data;
using Avemel.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Avemel.API.Controllers
{
    [ApiController]
    [Route("api/loading-photos")]
    [Authorize(Roles =
        UserRoles.Driver + "," +
        UserRoles.Operations + "," +
        UserRoles.Admin)]
    public class LoadingPhotosController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IInspectionPhotoStorage _storage;

        public LoadingPhotosController(
            AppDbContext db,
            IInspectionPhotoStorage storage)
        {
            _db = db;
            _storage = storage;
        }

        // GET /api/loading-photos/1
        [HttpGet("{photoId:int:min(1)}")]
        public async Task<IActionResult> GetPhoto(
            int photoId,
            CancellationToken cancellationToken)
        {
            var claim = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            if (!int.TryParse(claim, out var userId) || userId <= 0)
            {
                return Unauthorized();
            }

            var account = await _db.Users
                .AsNoTracking()
                .Where(x => x.Id == userId && x.IsActive)
                .Select(x => new { x.Role })
                .SingleOrDefaultAsync(cancellationToken);

            if (account is null)
            {
                return Forbid();
            }

            var canViewAll =
                account.Role == UserRoles.Operations ||
                account.Role == UserRoles.Admin;

            if (!canViewAll && account.Role != UserRoles.Driver)
            {
                return Forbid();
            }

            var photo = await _db.TripLoadingPhotos
                .AsNoTracking()
                .Where(x =>
                    x.Id == photoId &&
                    (
                        canViewAll ||
                        x.Trip.TruckAssignment.DriverId == userId
                    ))
                .Select(x => new
                {
                    x.StorageKey,
                    x.ContentType
                })
                .SingleOrDefaultAsync(cancellationToken);

            if (photo is null)
            {
                return NotFound(new
                {
                    message = "Loading photo not found."
                });
            }

            if (photo.ContentType is not "image/jpeg" and not "image/png")
            {
                return Problem(
                    statusCode: 500,
                    detail: "The stored photo has an unsupported content type.");
            }

            Stream stream;

            try
            {
                stream = await _storage.OpenReadAsync(
                    photo.StorageKey,
                    cancellationToken);
            }
            catch (FileNotFoundException)
            {
                return NotFound(new
                {
                    message = "The loading photo file could not be found."
                });
            }
            catch (DirectoryNotFoundException)
            {
                return NotFound(new
                {
                    message = "The loading photo file could not be found."
                });
            }

            Response.Headers["Cache-Control"] = "no-store";
            Response.Headers["X-Content-Type-Options"] = "nosniff";

            return File(stream, photo.ContentType);
        }
    }
}