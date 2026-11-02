using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AvemelAPI.Migrations
{
    /// <inheritdoc />
    public partial class CompleteInspectionAdminApproval : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovedAt",
                table: "TruckInspections",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ApprovedByUserId",
                table: "TruckInspections",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TruckInspections_ApprovedByUserId",
                table: "TruckInspections",
                column: "ApprovedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_TruckInspections_Users_ApprovedByUserId",
                table: "TruckInspections",
                column: "ApprovedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TruckInspections_Users_ApprovedByUserId",
                table: "TruckInspections");

            migrationBuilder.DropIndex(
                name: "IX_TruckInspections_ApprovedByUserId",
                table: "TruckInspections");

            migrationBuilder.DropColumn(
                name: "ApprovedAt",
                table: "TruckInspections");

            migrationBuilder.DropColumn(
                name: "ApprovedByUserId",
                table: "TruckInspections");
        }
    }
}
