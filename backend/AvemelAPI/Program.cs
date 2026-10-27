using Avemel.API.Data;
using System.Security.Claims;
using Avemel.API.Configuration;
using Avemel.API.Models;
using Microsoft.AspNetCore.Identity;
using Avemel.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

//-------------------------------------------------------
// PostgreSQL Database
//-------------------------------------------------------

var connectionString = builder.Configuration
    .GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "The DefaultConnection connection string is missing.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Load JWT settings from configuration / User Secrets
var jwtSection = builder.Configuration.GetSection(JwtSettings.SectionName);

var jwtSettings = jwtSection.Get<JwtSettings>()
    ?? throw new InvalidOperationException("JWT settings are missing.");

if (string.IsNullOrWhiteSpace(jwtSettings.Issuer) ||
    string.IsNullOrWhiteSpace(jwtSettings.Audience) ||
    jwtSettings.ExpiryMinutes <= 0)
{
    throw new InvalidOperationException("JWT settings are invalid.");
}

byte[] jwtKeyBytes;

try
{
    jwtKeyBytes = Convert.FromBase64String(jwtSettings.SecretKey);
}
catch (FormatException)
{
    throw new InvalidOperationException(
        "Jwt:SecretKey must be a valid Base64 key.");
}

if (jwtKeyBytes.Length < 32)
{
    throw new InvalidOperationException(
        "Jwt:SecretKey must contain at least 32 random bytes.");
}

// Register our settings and token service
builder.Services.Configure<JwtSettings>(jwtSection);
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();

// Configure token validation
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = true;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            RequireSignedTokens = true,
            RequireExpirationTime = true,

            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(jwtKeyBytes),

            ValidAlgorithms = new[] { SecurityAlgorithms.HmacSha256 },

            NameClaimType = ClaimTypes.Name,
            RoleClaimType = ClaimTypes.Role,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddScoped<IPasswordHasher<AppUser>, PasswordHasher<AppUser>>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ITruckService, TruckService>();
builder.Services.AddScoped<ITrailerService, TrailerService>();
builder.Services.AddScoped<ITruckAssignmentService, TruckAssignmentService>();
builder.Services.AddScoped<ITruckInspectionService, TruckInspectionService>();
builder.Services.AddScoped<IInspectionPhotoStorage, LocalInspectionPhotoStorage>();
builder.Services.AddScoped<ITruckInspectionPhotoService, TruckInspectionPhotoService>();
builder.Services.AddScoped<ITruckFaultService, TruckFaultService>();
builder.Services.AddScoped<ITruckReplacementService, TruckReplacementService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Create the first Admin account during local development.
if (app.Environment.IsDevelopment() &&
    app.Configuration.GetValue<bool>("BootstrapAdmin:Enabled"))
{
    await using var scope = app.Services.CreateAsyncScope();

    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    // Bootstrap only when the Users table is empty.
    if (!await db.Users.AnyAsync())
    {
        var fullName = app.Configuration["BootstrapAdmin:FullName"]?.Trim();
        var username = app.Configuration["BootstrapAdmin:Username"]?
            .Trim()
            .ToLowerInvariant();
        var password = app.Configuration["BootstrapAdmin:Password"];

        if (string.IsNullOrWhiteSpace(fullName) ||
            fullName.Length > 150 ||
            string.IsNullOrWhiteSpace(username) ||
            username.Length > 100 ||
            string.IsNullOrWhiteSpace(password) ||
            password.Length < 12 ||
            password.Length > 256 ||
            password == "REPLACE_WITH_YOUR_OWN_PASSWORD")
        {
            throw new InvalidOperationException(
                "Set valid BootstrapAdmin credentials in User Secrets. " +
                "The password must be between 12 and 256 characters.");
        }

        var passwordHasher = scope.ServiceProvider
            .GetRequiredService<IPasswordHasher<AppUser>>();

        var admin = new AppUser
        {
            FullName = fullName,
            Username = username,
            Role = Avemel.API.Constants.UserRoles.Admin,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        admin.PasswordHash = passwordHasher.HashPassword(admin, password);

        db.Users.Add(admin);
        await db.SaveChangesAsync();

        app.Logger.LogInformation("First Admin account created.");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("ReactFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

//-------------------------------------------------------
// Database Connection Test — Development Only
//-------------------------------------------------------

if (app.Environment.IsDevelopment())
{
    app.MapGet("/api/database/test", async (AppDbContext db) =>
    {
        var connected = await db.Database.CanConnectAsync();

        return connected
            ? Results.Ok(new { message = "PostgreSQL connection successful." })
            : Results.Problem("Could not connect to PostgreSQL.");
    });
}

app.Run();
