using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AvemelAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddTripInstructions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "BookingAt",
                table: "Trips",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BookingNumber",
                table: "Trips",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CargoDescription",
                table: "Trips",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CollectionAddress",
                table: "Trips",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CollectionContact",
                table: "Trips",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CustomerName",
                table: "Trips",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeliveryAddress",
                table: "Trips",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeliveryContact",
                table: "Trips",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeliveryInstructions",
                table: "Trips",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InstructionReference",
                table: "Trips",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "InstructionsIssuedAt",
                table: "Trips",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "InstructionsIssuedByUserId",
                table: "Trips",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LoadingInstructions",
                table: "Trips",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PlannedLoadingAt",
                table: "Trips",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Trips_InstructionsIssuedByUserId",
                table: "Trips",
                column: "InstructionsIssuedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Trips_Users_InstructionsIssuedByUserId",
                table: "Trips",
                column: "InstructionsIssuedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Trips_Users_InstructionsIssuedByUserId",
                table: "Trips");

            migrationBuilder.DropIndex(
                name: "IX_Trips_InstructionsIssuedByUserId",
                table: "Trips");

            migrationBuilder.DropColumn(
                name: "BookingAt",
                table: "Trips");

            migrationBuilder.DropColumn(
                name: "BookingNumber",
                table: "Trips");

            migrationBuilder.DropColumn(
                name: "CargoDescription",
                table: "Trips");

            migrationBuilder.DropColumn(
                name: "CollectionAddress",
                table: "Trips");

            migrationBuilder.DropColumn(
                name: "CollectionContact",
                table: "Trips");

            migrationBuilder.DropColumn(
                name: "CustomerName",
                table: "Trips");

            migrationBuilder.DropColumn(
                name: "DeliveryAddress",
                table: "Trips");

            migrationBuilder.DropColumn(
                name: "DeliveryContact",
                table: "Trips");

            migrationBuilder.DropColumn(
                name: "DeliveryInstructions",
                table: "Trips");

            migrationBuilder.DropColumn(
                name: "InstructionReference",
                table: "Trips");

            migrationBuilder.DropColumn(
                name: "InstructionsIssuedAt",
                table: "Trips");

            migrationBuilder.DropColumn(
                name: "InstructionsIssuedByUserId",
                table: "Trips");

            migrationBuilder.DropColumn(
                name: "LoadingInstructions",
                table: "Trips");

            migrationBuilder.DropColumn(
                name: "PlannedLoadingAt",
                table: "Trips");
        }
    }
}
