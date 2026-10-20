import { apiRequest } from "./api";

const workshopService = {
  getUnclearedFaults: () => {
    return apiRequest("/api/workshop/faults/uncleared");
  },

  getFaultById: (faultId) => {
    return apiRequest(`/api/workshop/faults/${faultId}`);
  },

  clearFault: (faultId, resolutionNotes) => {
    return apiRequest(`/api/workshop/faults/${faultId}/clear`, {
      method: "POST",
      body: {
        resolutionNotes
      }
    });
  },

  getInspection: (inspectionId) => {
    return apiRequest(`/api/workshop/inspections/${inspectionId}`);
  },

  getMyTruckFaults: () => {
    return apiRequest("/api/driver/truck-faults");
  }
};

export default workshopService;