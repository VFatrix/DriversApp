import { apiRequest } from "./api";

const replacementService = {
  create: (assignmentId, reason) => {
    return apiRequest("/api/truck-replacements", {
      method: "POST",
      body: {
        assignmentId,
        reason
      }
    });
  },

  getById: (requestId) => {
    return apiRequest(`/api/truck-replacements/${requestId}`);
  },

  getMyActive: async () => {
    try {
      return await apiRequest("/api/truck-replacements/my-active");
    } catch (error) {
      if (error.status === 404) {
        return null;
      }

      throw error;
    }
  },

  getPending: () => {
    return apiRequest("/api/truck-replacements/pending");
  },

  review: (requestId, approve, reviewNotes) => {
    return apiRequest(
      `/api/truck-replacements/${requestId}/review`,
      {
        method: "POST",
        body: {
          approve,
          reviewNotes
        }
      }
    );
  },

  chooseTruck: (requestId, truckId) => {
    return apiRequest(
      `/api/truck-replacements/${requestId}/choose-truck`,
      {
        method: "POST",
        body: {
          truckId
        }
      }
    );
  }
};

export default replacementService;