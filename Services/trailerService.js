import { apiRequest } from "./api";

const trailerService = {
  getAll: () => apiRequest("/api/trailers"),

  getActive: () => apiRequest("/api/trailers/active"),

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
    }),

  getAssigned: (assignmentId) =>
    apiRequest(`/api/truck-assignments/${assignmentId}/trailers`),

  getAvailableForAssignment: (assignmentId) =>
    apiRequest(
      `/api/truck-assignments/${assignmentId}/trailers/available`
    ),

  saveAssignments: (assignmentId, trailerIds) =>
    apiRequest(`/api/truck-assignments/${assignmentId}/trailers`, {
      method: "PUT",
      body: { trailerIds }
    })
};

export default trailerService;