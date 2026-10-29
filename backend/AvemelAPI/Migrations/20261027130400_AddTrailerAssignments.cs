using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AvemelAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddTrailerAssignments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TrailerAssignments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TruckAssignmentId = table.Column<int>(type: "integer", nullable: false),
                    TrailerId = table.Column<int>(type: "integer", nullable: false),
                    Position = table.Column<int>(type: "integer", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ReleasedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReleasedByUserId = table.Column<int>(type: "integer", nullable: true),
                    ReleaseReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrailerAssignments", x => x.Id);
                    table.CheckConstraint("CK_TrailerAssignments_Position", "\"Position\" IN (1, 2)");
                    table.CheckConstraint("CK_TrailerAssignments_ReleaseDate", "\"ReleasedAt\" IS NULL OR \"ReleasedAt\" >= \"AssignedAt\"");
                    table.ForeignKey(
                        name: "FK_TrailerAssignments_Trailers_TrailerId",
                        column: x => x.TrailerId,
                        principalTable: "Trailers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TrailerAssignments_TruckAssignments_TruckAssignmentId",
                        column: x => x.TruckAssignmentId,
                        principalTable: "TruckAssignments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TrailerAssignments_Users_ReleasedByUserId",
                        column: x => x.ReleasedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TrailerAssignments_ReleasedByUserId",
                table: "TrailerAssignments",
                column: "ReleasedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_TrailerAssignments_TrailerId",
                table: "TrailerAssignments",
                column: "TrailerId",
                unique: true,
                filter: "\"ReleasedAt\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_TrailerAssignments_TruckAssignmentId_Position",
                table: "TrailerAssignments",
                columns: new[] { "TruckAssignmentId", "Position" },
                unique: true,
                filter: "\"ReleasedAt\" IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TrailerAssignments");
        }
    }
}
