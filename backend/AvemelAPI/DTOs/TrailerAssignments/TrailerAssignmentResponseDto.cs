namespace Avemel.API.DTOs.TrailerAssignments
{
    public class TrailerAssignmentResponseDto
    {
        public int Id { get; set; }

        public int TruckAssignmentId { get; set; }

        public int TrailerId { get; set; }

        public string Reg { get; set; } = string.Empty;

        public int Position { get; set; }

        public DateTime AssignedAt { get; set; }

        public DateTime? ReleasedAt { get; set; }
    }
}