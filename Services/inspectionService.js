import { apiRequest } from "./api";

const inspectionService = {
  create: (assignmentId) => {
    return apiRequest("/api/truck-inspections", {
      method: "POST",
      body: { assignmentId }
    });
  },

  getById: (inspectionId) => {
    return apiRequest(`/api/truck-inspections/${inspectionId}`);
  },

  getMyDraft: async () => {
    try {
      return await apiRequest("/api/truck-inspections/my-draft");
    } catch (error) {
      if (error.status === 404) {
        return null;
      }

      throw error;
    }
  },

  getMyLatest: async () => {
  try {
    return await apiRequest("/api/truck-inspections/my-latest");
  } catch (error) {
    if (error.status === 404) {
      return null;
    }

    throw error;
  }
},

 updateAnswer: (inspectionId, answerId, { hasDefect, notes }) => {
  return apiRequest(
    `/api/truck-inspections/${inspectionId}/answers/${answerId}`,
    {
      method: "PUT",
      body: {
        hasDefect,
        notes: notes?.trim() || null
      }
    }
  );
},

  uploadPhoto: (inspectionId, angle, file) => {
    const body = new FormData();

    body.append("Angle", angle);
    body.append("File", file);

    return apiRequest(
      `/api/truck-inspections/${inspectionId}/photos`,
      {
        method: "POST",
        body
      }
    );
  },

  getPhoto: (photoId) => {
    return apiRequest(`/api/inspection-photos/${photoId}`, {
      responseType: "blob"
    });
  },

      
  updateComments: async (inspectionId, additionalComments) => {
  return apiRequest(
    `/api/truck-inspections/${inspectionId}/comments`,
    {
      method: "PUT",
      body: {
        additionalComments: additionalComments?.trim() || null
      }
    }
  );
},  


save: (inspectionId, answers, additionalComments) => {
  return apiRequest(
    `/api/truck-inspections/${inspectionId}/save`,
    {
      method: "PUT",
      body: {
        answers: answers.map((answer) => ({
          answerId: answer.id,
          hasDefect: answer.hasDefect
        })),
        additionalComments: additionalComments?.trim() || null
      }
    }
  );
},



  submit: (inspectionId) => {
    return apiRequest(
      `/api/truck-inspections/${inspectionId}/submit`,
      {
        method: "POST"
      }
    );
  }
};

export default inspectionService;