using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AvemelAPI.Migrations
{
    /// <inheritdoc />
    public partial class CreateInspectionsAndFaults : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TruckInspections",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TruckAssignmentId = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TruckInspections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TruckInspections_TruckAssignments_TruckAssignmentId",
                        column: x => x.TruckAssignmentId,
                        principalTable: "TruckAssignments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TruckInspectionAnswers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TruckInspectionId = table.Column<int>(type: "integer", nullable: false),
                    CheckCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CheckLabel = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    HasDefect = table.Column<bool>(type: "boolean", nullable: true),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TruckInspectionAnswers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TruckInspectionAnswers_TruckInspections_TruckInspectionId",
                        column: x => x.TruckInspectionId,
                        principalTable: "TruckInspections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TruckInspectionPhotos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TruckInspectionId = table.Column<int>(type: "integer", nullable: false),
                    Angle = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    StorageKey = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    UploadedByUserId = table.Column<int>(type: "integer", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TruckInspectionPhotos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TruckInspectionPhotos_TruckInspections_TruckInspectionId",
                        column: x => x.TruckInspectionId,
                        principalTable: "TruckInspections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TruckInspectionPhotos_Users_UploadedByUserId",
                        column: x => x.UploadedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TruckFaults",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TruckId = table.Column<int>(type: "integer", nullable: false),
                    TruckInspectionAnswerId = table.Column<int>(type: "integer", nullable: true),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ReportedByUserId = table.Column<int>(type: "integer", nullable: false),
                    ReportedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ClearedByUserId = table.Column<int>(type: "integer", nullable: true),
                    ClearedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ResolutionNotes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TruckFaults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TruckFaults_TruckInspectionAnswers_TruckInspectionAnswerId",
                        column: x => x.TruckInspectionAnswerId,
                        principalTable: "TruckInspectionAnswers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TruckFaults_Trucks_TruckId",
                        column: x => x.TruckId,
                        principalTable: "Trucks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TruckFaults_Users_ClearedByUserId",
                        column: x => x.ClearedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TruckFaults_Users_ReportedByUserId",
                        column: x => x.ReportedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TruckFaults_ClearedByUserId",
                table: "TruckFaults",
                column: "ClearedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_TruckFaults_ReportedByUserId",
                table: "TruckFaults",
                column: "ReportedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_TruckFaults_TruckId_Status",
                table: "TruckFaults",
                columns: new[] { "TruckId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_TruckFaults_TruckInspectionAnswerId",
                table: "TruckFaults",
                column: "TruckInspectionAnswerId",
                unique: true,
                filter: "\"TruckInspectionAnswerId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_TruckInspectionAnswers_TruckInspectionId_CheckCode",
                table: "TruckInspectionAnswers",
                columns: new[] { "TruckInspectionId", "CheckCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TruckInspectionPhotos_TruckInspectionId_Angle",
                table: "TruckInspectionPhotos",
                columns: new[] { "TruckInspectionId", "Angle" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TruckInspectionPhotos_UploadedByUserId",
                table: "TruckInspectionPhotos",
                column: "UploadedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_TruckInspections_TruckAssignmentId",
                table: "TruckInspections",
                column: "TruckAssignmentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TruckFaults");

            migrationBuilder.DropTable(
                name: "TruckInspectionPhotos");

            migrationBuilder.DropTable(
                name: "TruckInspectionAnswers");

            migrationBuilder.DropTable(
                name: "TruckInspections");
        }
    }
}
