using Avemel.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Avemel.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<AppUser> Users => 
            Set<AppUser>();

        public DbSet<Truck> Trucks =>
            Set<Truck>();

        public DbSet<TruckAssignment> TruckAssignments =>
            Set<TruckAssignment>();

        public DbSet<TruckInspection> TruckInspections =>
           Set<TruckInspection>();

        public DbSet<TruckInspectionAnswer> TruckInspectionAnswers =>
            Set<TruckInspectionAnswer>();

        public DbSet<TruckInspectionPhoto> TruckInspectionPhotos =>
            Set<TruckInspectionPhoto>();

        public DbSet<TruckFault> TruckFaults =>
            Set<TruckFault>();

        public DbSet<TruckReplacementRequest> TruckReplacementRequests =>
           Set<TruckReplacementRequest>();

        public DbSet<Trailer> Trailers => Set<Trailer>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Trailer>(entity =>
            {
                entity.HasKey(trailer => trailer.Id);

                entity.HasIndex(trailer => trailer.RegistrationNumber)
                    .IsUnique();
            });

            modelBuilder.Entity<AppUser>(entity =>
            {
                entity.HasKey(user => user.Id);

                entity.HasIndex(user => user.Username)
                    .IsUnique();
            });

            modelBuilder.Entity<Truck>(entity =>
            {
                entity.HasKey(truck => truck.Id);

                entity.HasIndex(truck => truck.RegistrationNumber)
                    .IsUnique();
            });

            modelBuilder.Entity<TruckAssignment>(entity =>
            {
                entity.HasKey(assignment => assignment.Id);

                // Only one active assignment is allowed for each truck.
                entity.HasIndex(assignment => assignment.TruckId)
                    .IsUnique()
                    .HasFilter("\"ReleasedAt\" IS NULL");

                entity.HasIndex(assignment => assignment.DriverId)
                       .IsUnique()
                       .HasFilter("\"ReleasedAt\" IS NULL");

                entity.HasOne(assignment => assignment.Truck)
                    .WithMany()
                    .HasForeignKey(assignment => assignment.TruckId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(assignment => assignment.Driver)
                    .WithMany()
                    .HasForeignKey(assignment => assignment.DriverId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(assignment => assignment.ReleasedByUser)
                    .WithMany()
                    .HasForeignKey(assignment => assignment.ReleasedByUserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            //-------------------------------------------------------
            // Inspections
            //-------------------------------------------------------

            modelBuilder.Entity<TruckInspection>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.HasOne(x => x.TruckAssignment)
                    .WithMany()
                    .HasForeignKey(x => x.TruckAssignmentId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<TruckInspection>()
                   .HasIndex(inspection => inspection.TruckAssignmentId)
                  .IsUnique()
                  .HasFilter("\"Status\" = 'Draft'");

            //-------------------------------------------------------
            // Checklist Answers
            //-------------------------------------------------------

            modelBuilder.Entity<TruckInspectionAnswer>(entity =>
            {
                entity.HasKey(x => x.Id);

                // Each checklist item can appear only once per inspection.
                entity.HasIndex(x => new { x.TruckInspectionId, x.CheckCode })
                    .IsUnique();

                entity.HasOne(x => x.TruckInspection)
                    .WithMany()
                    .HasForeignKey(x => x.TruckInspectionId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            //-------------------------------------------------------
            // Inspection Photos
            //-------------------------------------------------------

            modelBuilder.Entity<TruckInspectionPhoto>(entity =>
            {
                entity.HasKey(x => x.Id);

                // One current photo per angle per inspection.
                entity.HasIndex(x => new { x.TruckInspectionId, x.Angle })
                    .IsUnique();

                entity.HasOne(x => x.TruckInspection)
                    .WithMany()
                    .HasForeignKey(x => x.TruckInspectionId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(x => x.UploadedByUser)
                    .WithMany()
                    .HasForeignKey(x => x.UploadedByUserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            //-------------------------------------------------------
            // Workshop Faults
            //-------------------------------------------------------

            modelBuilder.Entity<TruckFault>(entity =>
            {
                entity.HasKey(x => x.Id);
                entity.HasOne(x => x.TruckInspection)
               .WithMany()
               .HasForeignKey(x => x.TruckInspectionId)
               .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(x => new { x.TruckId, x.Status });

                // Prevent duplicate faults for the same inspection answer.
                entity.HasIndex(x => x.TruckInspectionAnswerId)
                    .IsUnique()
                    .HasFilter("\"TruckInspectionAnswerId\" IS NOT NULL");

                entity.HasOne(x => x.Truck)
                    .WithMany()
                    .HasForeignKey(x => x.TruckId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(x => x.TruckInspectionAnswer)
                    .WithMany()
                    .HasForeignKey(x => x.TruckInspectionAnswerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(x => x.ReportedByUser)
                    .WithMany()
                    .HasForeignKey(x => x.ReportedByUserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(x => x.ClearedByUser)
                    .WithMany()
                    .HasForeignKey(x => x.ClearedByUserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            //-------------------------------------------------------
            // Truck Replacement Requests
            //-------------------------------------------------------

            modelBuilder.Entity<TruckReplacementRequest>(entity =>
            {
                entity.HasKey(x => x.Id);

                // Only one pending or approved request per assignment.
                entity.HasIndex(x => x.TruckAssignmentId)
                    .IsUnique()
                    .HasFilter("\"Status\" IN ('Pending', 'Approved')");

                entity.HasOne(x => x.TruckAssignment)
                    .WithMany()
                    .HasForeignKey(x => x.TruckAssignmentId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(x => x.ReviewedByUser)
                    .WithMany()
                    .HasForeignKey(x => x.ReviewedByUserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(x => x.ReplacementTruckAssignment)
                    .WithMany()
                    .HasForeignKey(x => x.ReplacementTruckAssignmentId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}