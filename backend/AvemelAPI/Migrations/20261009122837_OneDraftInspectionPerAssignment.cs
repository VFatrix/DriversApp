using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AvemelAPI.Migrations
{
    /// <inheritdoc />
    public partial class OneDraftInspectionPerAssignment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TruckInspections_TruckAssignmentId",
                table: "TruckInspections");

            migrationBuilder.CreateIndex(
                name: "IX_TruckInspections_TruckAssignmentId",
                table: "TruckInspections",
                column: "TruckAssignmentId",
                unique: true,
                filter: "\"Status\" = 'Draft'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TruckInspections_TruckAssignmentId",
                table: "TruckInspections");

            migrationBuilder.CreateIndex(
                name: "IX_TruckInspections_TruckAssignmentId",
                table: "TruckInspections",
                column: "TruckAssignmentId");
        }
    }
}
