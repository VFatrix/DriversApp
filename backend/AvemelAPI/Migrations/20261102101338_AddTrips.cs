using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AvemelAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddTrips : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Trips",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TruckAssignmentId = table.Column<int>(type: "integer", nullable: false),
                    TruckInspectionId = table.Column<int>(type: "integer", nullable: false),
                    LoadType = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Direction = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DepartureRequestedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DepartureApprovedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DepartureApprovedByUserId = table.Column<int>(type: "integer", nullable: true),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeliveredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedByUserId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Trips", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Trips_TruckAssignments_TruckAssignmentId",
                        column: x => x.TruckAssignmentId,
                        principalTable: "TruckAssignments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Trips_TruckInspections_TruckInspectionId",
                        column: x => x.TruckInspectionId,
                        principalTable: "TruckInspections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Trips_Users_CompletedByUserId",
                        column: x => x.CompletedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Trips_Users_DepartureApprovedByUserId",
                        column: x => x.DepartureApprovedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Trips_CompletedByUserId",
                table: "Trips",
                column: "CompletedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Trips_DepartureApprovedByUserId",
                table: "Trips",
                column: "DepartureApprovedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Trips_TruckAssignmentId",
                table: "Trips",
                column: "TruckAssignmentId",
                unique: true,
                filter: "\"CompletedAt\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Trips_TruckInspectionId",
                table: "Trips",
                column: "TruckInspectionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Trips");
        }
    }
}
