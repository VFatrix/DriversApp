using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AvemelAPI.Migrations
{
    /// <inheritdoc />
    public partial class OneActiveTruckPerDriver : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TruckAssignments_DriverId",
                table: "TruckAssignments");

            migrationBuilder.CreateIndex(
                name: "IX_TruckAssignments_DriverId",
                table: "TruckAssignments",
                column: "DriverId",
                unique: true,
                filter: "\"ReleasedAt\" IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TruckAssignments_DriverId",
                table: "TruckAssignments");

            migrationBuilder.CreateIndex(
                name: "IX_TruckAssignments_DriverId",
                table: "TruckAssignments",
                column: "DriverId");
        }
    }
}
