namespace Avemel.API.Constants
{
    public static class UserRoles
    {
        public const string Driver = "Driver";
        public const string Operations = "Operations";
        public const string HRPayroll = "HRPayroll";
        public const string Workshop = "Workshop";
        public const string Admin = "Admin";

        public static bool IsValid(string role)
        {
            return role is Driver
                or Operations
                or HRPayroll
                or Workshop
                or Admin;
        }
    }
}