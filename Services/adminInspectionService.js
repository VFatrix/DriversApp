import { apiRequest } from "./api";

const adminInspectionService = {
  getPending: () =>
    apiRequest("/api/admin/inspections/pending"),

  approve: (inspectionId) =>
    apiRequest(
      `/api/admin/inspections/${inspectionId}/approve`,
      {
        method: "POST"
      }
    )
};

export default adminInspectionService;