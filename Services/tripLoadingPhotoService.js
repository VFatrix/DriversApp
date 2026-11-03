import { apiRequest } from "./api";

const tripLoadingPhotoService = {
  getForTrip: (tripId) =>
    apiRequest(`/api/trips/${tripId}/loading-photos`),

  upload: (tripId, angle, file) => {
    const body = new FormData();

    body.append("Angle", angle);
    body.append("File", file);

    return apiRequest(`/api/trips/${tripId}/loading-photos`, {
      method: "POST",
      body
    });
  },

  getPhoto: (photoId) =>
    apiRequest(`/api/loading-photos/${photoId}`, {
      responseType: "blob"
    })
};

export default tripLoadingPhotoService;