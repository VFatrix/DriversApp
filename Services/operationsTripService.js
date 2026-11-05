import { apiRequest } from "./api";

const operationsTripService = {
  getPendingDepartures: () =>
    apiRequest("/api/operations/trips/pending-departures"),

  approveDeparture: (tripId) =>
    apiRequest(
      `/api/operations/trips/${tripId}/approve-departure`,
      {
        method: "POST"
      }
    )
};

export default operationsTripService;