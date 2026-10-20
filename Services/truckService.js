import { apiRequest } from "./api";

const truckService = {
  getAvailable: () => {
    return apiRequest("/api/trucks/available");
  },

  getMyActiveAssignment: async () => {
    try {
      return await apiRequest("/api/truck-assignments/my-active");
    } catch (error) {
      if (error.status === 404) {
        return null;
      }

      throw error;
    }
  },

  selectTruck: (truckId) => {
    return apiRequest("/api/truck-assignments", {
      method: "POST",
      body: {
        truckId
      }
    });
  }
};

export default truckService;