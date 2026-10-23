import { apiRequest } from "./api";

const truckService = {
  getAll: () => apiRequest("/api/trucks"),
  createTruck: (registrationNumber, makeModel) =>
  apiRequest("/api/trucks", {
    method: "POST",
    body: {
      reg: registrationNumber.trim().toUpperCase(),
      make: makeModel.trim()
    }
  }),
  archiveTruck: (truckId) =>
  apiRequest(`/api/trucks/${truckId}/archive`, {
    method: "PUT"
  }),

restoreTruck: (truckId) =>
  apiRequest(`/api/trucks/${truckId}/restore`, {
    method: "PUT"
  }),
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