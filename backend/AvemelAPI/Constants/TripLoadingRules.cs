using System.ComponentModel.DataAnnotations;

namespace Avemel.API.Constants
{
    public static class TripLoadingRules
    {
        public static IReadOnlyList<string> GetRequiredAngles(
            string loadType)
        {
            return loadType switch
            {
                "Container" => new[]
                {
                    "left", "right", "rear", "seal"
                },

                "Breakbulk" => new[]
                {
                    "left", "right", "front", "rear"
                },

                "Empty" => Array.Empty<string>(),

                _ => throw new ValidationException(
                    "Load type must be Container, Breakbulk or Empty.")
            };
        }
    }
}