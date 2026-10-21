using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AvemelAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddFaultInspectionLink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TruckInspectionId",
                table: "TruckFaults",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TruckFaults_TruckInspectionId",
                table: "TruckFaults",
                column: "TruckInspectionId");

            migrationBuilder.AddForeignKey(
                name: "FK_TruckFaults_TruckInspections_TruckInspectionId",
                table: "TruckFaults",
                column: "TruckInspectionId",
                principalTable: "TruckInspections",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TruckFaults_TruckInspections_TruckInspectionId",
                table: "TruckFaults");

            migrationBuilder.DropIndex(
                name: "IX_TruckFaults_TruckInspectionId",
                table: "TruckFaults");

            migrationBuilder.DropColumn(
                name: "TruckInspectionId",
                table: "TruckFaults");
        }
    }
}
