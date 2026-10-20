namespace Avemel.API.Constants
{
    public static class TruckInspectionChecklist
    {
        public sealed record ChecklistItem(
            string Code,
            string Label,
            bool IsCritical);

        public static IReadOnlyList<ChecklistItem> Items { get; } =
            Array.AsReadOnly(new ChecklistItem[]
            {
                // Tyres & Wheels
                new("tyre_pressure",
                    "All tyres at ≥ 650 kPa (6.5 bar)", true),

                new("tyre_tread",
                    "Tread depth ≥ 4 mm on all tyres", true),

                new("wheel_nuts",
                    "Wheel nuts & rims secure, none missing", true),

                // Coupling & Trailer
                new("fifth_wheel",
                    "Fifth wheel / kingpin locked & secured", true),

                new("safety_catch",
                    "Trailer locking pin / safety catch engaged", true),

                new("airlines",
                    "Air (suzie) & electrical lines connected", true),

                new("landing_legs",
                    "Landing legs fully raised", false),

                // Lights & Plates
                new("lights",
                    "Head, tail, brake, indicators & hazards working", true),

                new("plates",
                    "Number plates present & correct (truck & trailer)", false),

                // Brakes & Engine
                new("brakes",
                    "Service & park brakes work, no air leaks", true),

                new("fluids",
                    "Oil, coolant & water levels OK", false),

                new("leaks",
                    "No visible oil / fuel / coolant leaks", false),

                new("fuel",
                    "Fuel level adequate for trip", false),

                // Safety & Compliance
                new("cameras",
                    "Camera(s) working", false),

                new("extinguisher",
                    "Fire extinguisher present & charged", false),

                new("triangles",
                    "Triangles & reflective vest on board", false),

                new("firstaid",
                    "First aid kit present", false),

                // Documents
                new("licence_disc",
                    "Vehicle licence disc valid", false),

                new("cof",
                    "Roadworthy / COF valid", true),

                new("driver_licence",
                    "Driver's licence & PrDP valid", true),

                new("load_docs",
                    "Load documents / waybill on board", false)
            });

        public static IReadOnlyList<string> RequiredPhotoAngles { get; } =
            Array.AsReadOnly(new[]
            {
                "front",
                "left",
                "right",
                "rear"
            });
    }
}