import { apiRequest } from "./api";

const tripService = {
  create: (assignmentId, loadType, direction) =>
    apiRequest("/api/trips", {
      method: "POST",
      body: {
        assignmentId,
        loadType,
        direction
      }
    }),

  getMyActive: async () => {
    try {
      return await apiRequest("/api/trips/my-active");
    } catch (error) {
      if (
        error.status === 404 &&
        error.message === "You have no unfinished trip."
      ) {
        return null;
      }

      throw error;
    }
  },

  getById: (tripId) =>
    apiRequest(`/api/trips/${tripId}`)
};

export default tripService;