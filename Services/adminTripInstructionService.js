import { apiRequest } from "./api";

const adminTripInstructionService = {
  getAwaitingInstructions: () =>
    apiRequest("/api/admin/trips/awaiting-instructions"),

  issueInstructions: (tripId, instructions) =>
    apiRequest(`/api/admin/trips/${tripId}/instructions`, {
      method: "POST",
      body: instructions
    })
};

export default adminTripInstructionService;