import { apiRequest } from "./api";

const trailerService = {
  getAll: () => apiRequest("/api/trailers"),

  getById: (trailerId) =>
    apiRequest(`/api/trailers/${trailerId}`),

  createTrailer: (registrationNumber) =>
    apiRequest("/api/trailers", {
      method: "POST",
      body: {
        reg: registrationNumber.trim().toUpperCase()
      }
    }),

  archiveTrailer: (trailerId) =>
    apiRequest(`/api/trailers/${trailerId}/archive`, {
      method: "PUT"
    }),

  restoreTrailer: (trailerId) =>
    apiRequest(`/api/trailers/${trailerId}/restore`, {
      method: "PUT"
    })
};

export default trailerService;