import { useEffect, useState } from "react";
import tripService from "../Services/tripService";
import inspectionService from "../Services/inspectionService";
import tripLoadingPhotoService from "../Services/tripLoadingPhotoService";
import TripLoadingPhoto from "./TripLoadingPhoto";

export default function DriverLoadingPanel({ assignmentId }) {
  const [trip, setTrip] = useState(null);
  const [inspection, setInspection] = useState(null);
  const [loadType, setLoadType] = useState("");
  const [direction, setDirection] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requestingDeparture, setRequestingDeparture] = useState(false);
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photosError, setPhotosError] = useState("");
  const [photoRefreshKey, setPhotoRefreshKey] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      setTrip(null);
      setInspection(null);

      try {
        const activeTrip = await tripService.getMyActive();

        if (cancelled) return;

        if (activeTrip) {
          setTrip(activeTrip);
          return;
        }

        const latest = await inspectionService.getMyLatest();

        if (!cancelled) {
          setInspection(latest);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load trip information.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [assignmentId, refreshKey]);

   useEffect(() => {
  let cancelled = false;

  setPhotos([]);
  setPhotosError("");

  if (!trip || trip.loadType === "Empty") {
    setPhotosLoading(false);
    return;
  }

  const loadPhotos = async () => {
    setPhotosLoading(true);

    try {
      const saved = await tripLoadingPhotoService.getForTrip(trip.id);

      if (!cancelled) {
        setPhotos(saved);
      }
    } catch (err) {
      if (!cancelled) {
        setPhotosError(
          err.message || "Unable to load the trip's photos."
        );
      }
    } finally {
      if (!cancelled) {
        setPhotosLoading(false);
      }
    }
  };

  loadPhotos();

  return () => {
    cancelled = true;
  };
}, [trip?.id, trip?.loadType, photoRefreshKey]);

const photoUploaded = (savedPhoto) => {
  setPhotos((current) => [
    ...current.filter((photo) => photo.angle !== savedPhoto.angle),
    savedPhoto
  ]);
};

const requiredViews =
  trip?.loadType === "Container"
    ? [
        ["left", "Left side"],
        ["right", "Right side"],
        ["rear", "Rear"],
        ["seal", "Container seal"]
      ]
    : trip?.loadType === "Breakbulk"
    ? [
        ["left", "Left side"],
        ["right", "Right side"],
        ["front", "Front"],
        ["rear", "Rear"]
      ]
    : [];

const canUploadPhotos =
  trip?.assignmentId === assignmentId &&
  trip?.status === "Loading" &&
  !trip?.departureRequestedAt &&
  !trip?.departureApprovedAt &&
  !trip?.startedAt &&
  !trip?.completedAt;

  const approved =
    inspection?.assignmentId === assignmentId &&
    inspection?.status === "Submitted" &&
    Boolean(inspection?.approvedAt);

  const busy = loading || saving || requestingDeparture;

  const beginLoading = async (event) => {
    event.preventDefault();

    if (busy || trip || !approved || !loadType || !direction) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const created = await tripService.create(
        assignmentId,
        loadType,
        direction
      );

      setTrip(created);
    } catch (err) {
      if (err.status === 409) {
        try {
          const activeTrip = await tripService.getMyActive();

          if (activeTrip) {
            setTrip(activeTrip);
            return;
          }
        } catch {
          // Keep the original creation error visible.
        }

        // Require a fresh approval check before another attempt.
        setInspection(null);
      }

      setError(err.message || "Unable to begin loading.");
    } finally {
      setSaving(false);
    }
  };

  const canRequestDeparture =
  trip?.assignmentId === assignmentId &&
  ["Loading", "Preparing"].includes(trip?.status) &&
  !trip?.departureRequestedAt &&
  !trip?.departureApprovedAt &&
  !trip?.startedAt &&
  !trip?.completedAt &&
  (
    trip?.loadType === "Empty" ||
    (
      requiredViews.length === 4 &&
      !photosLoading &&
      !photosError &&
      requiredViews.every(([angle]) =>
        photos.some((photo) => photo.angle === angle)
      )
    )
  );

const requestDeparture = async () => {
  if (busy || !canRequestDeparture) return;

  setRequestingDeparture(true);
  setError("");

  try {
    const updated = await tripService.requestDeparture(trip.id);
    setTrip(updated);
  } catch (err) {
    setError(
      err.message || "Unable to request departure authorization."
    );
  } finally {
    setRequestingDeparture(false);
  }
};

  return (
    <section className="mt-4 border rounded-xl p-4 bg-white">
      <h3 className="font-bold text-lg mb-3">Loading</h3>

      {error && (
        <p role="alert" className="text-sm text-red-700 mb-3">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">
          Loading trip information…
        </p>
      ) : trip ? (
        <div>
          {trip.assignmentId !== assignmentId && (
            <p role="alert" className="text-sm text-red-700 mb-3">
              You have an unfinished trip on another assignment.
              Contact Admin before continuing.
            </p>
          )}

          <p className="font-semibold">
            Trip #{trip.id} — {trip.registrationNumber}
          </p>

          <p className="text-sm mt-1">
            Load type: {trip.loadType}
          </p>

          <p className="text-sm mt-1">
            Direction: {trip.direction}
          </p>

          <p className="text-sm mt-1">
            Status: {trip.status}
          </p>

          {["Loading", "Preparing"].includes(trip.status) && (
  <div className="mt-4">
    <button
      type="button"
      onClick={requestDeparture}
      disabled={busy || !canRequestDeparture}
      className="w-full bg-red-700 text-white rounded-lg px-4 py-3 font-bold disabled:opacity-40"
    >
      {requestingDeparture
        ? "Sending request…"
        : "Request departure authorization"}
    </button>

    {trip.loadType !== "Empty" && (
      <p className="text-xs text-gray-500 mt-2">
        Save all four loading photos before requesting authorization.
      </p>
    )}
  </div>
)}

{trip.status === "AwaitingDepartureApproval" && (
  <div
    role="status"
    className="mt-4 border border-amber-300 rounded-lg p-3 bg-amber-50"
  >
    <p className="font-semibold text-amber-900">
      Awaiting Admin approval
    </p>
    <p className="text-sm text-amber-800 mt-1">
      Your departure request has been saved. Do not depart until
      Admin authorizes the trip.
    </p>
  </div>
)}

          {requiredViews.length > 0 && (
  <div className="mt-4">
    <h4 className="font-bold mb-2">Required loading photos</h4>

    {photosLoading ? (
      <p className="text-sm text-gray-500">
        Loading saved photos…
      </p>
    ) : photosError ? (
      <div>
        <p role="alert" className="text-sm text-red-700">
          {photosError}
        </p>

        <button
          type="button"
          onClick={() =>
            setPhotoRefreshKey((current) => current + 1)
          }
          className="text-sm underline mt-2"
        >
          Retry loading photos
        </button>
      </div>
    ) : (
      <>
        <p className="text-sm text-gray-600 mb-3">
          {
            requiredViews.filter(([angle]) =>
              photos.some((photo) => photo.angle === angle)
            ).length
          }{" "}
          of {requiredViews.length} required photos saved.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {requiredViews.map(([angle, label]) => (
            <TripLoadingPhoto
              key={`${trip.id}-${angle}`}
              tripId={trip.id}
              angle={angle}
              label={label}
              photo={photos.find((photo) => photo.angle === angle)}
              onUploaded={photoUploaded}
              readOnly={!canUploadPhotos}
            />
          ))}
        </div>
      </>
    )}
  </div>
)}

          {["Loading", "Preparing"].includes(trip.status) && (
  <p className="text-sm text-amber-800 mt-3">
    {trip.loadType === "Empty"
      ? "This is an empty trip. No loading photos are required. Admin must authorize departure before you may leave."
      : "Upload all four required loading photos. Admin must review them and authorize departure before you may leave."}
  </p>
)}
        </div>
      ) : (
        <>
          {!approved && (
            <p className="text-sm text-amber-800 mb-3">
              Your latest inspection must be approved by Admin
              before loading. After approval, press Refresh loading.
            </p>
          )}

          <form onSubmit={beginLoading}>
            <fieldset
              disabled={busy || !approved || Boolean(error)}
              className="space-y-3 disabled:opacity-50"
            >
              <label className="block text-sm font-semibold">
                Load type
                <select
                  value={loadType}
                  onChange={(event) => setLoadType(event.target.value)}
                  required
                  className="block w-full border rounded-lg p-3 mt-1"
                >
                  <option value="">Choose load type</option>
                  <option value="Container">Container</option>
                  <option value="Breakbulk">Break-bulk</option>
                  <option value="Empty">Empty / no load</option>
                </select>
              </label>

              <label className="block text-sm font-semibold">
                Trip direction
                <select
                  value={direction}
                  onChange={(event) => setDirection(event.target.value)}
                  required
                  className="block w-full border rounded-lg p-3 mt-1"
                >
                  <option value="">Choose direction</option>
                  <option value="Up">Up</option>
                  <option value="Down">Down</option>
                </select>
              </label>

              <button
                type="submit"
                disabled={!loadType || !direction}
                className="w-full bg-red-700 text-white rounded-lg px-4 py-3 font-bold disabled:opacity-40"
              >
                {saving
                         ? "Saving…"
                         : loadType === "Empty"
                         ? "Create empty trip"
                        : "Begin loading"}
              </button>
            </fieldset>
          </form>
        </>
      )}

      <button
        type="button"
        onClick={() => setRefreshKey((current) => current + 1)}
        disabled={busy}
        className="text-sm underline mt-3 disabled:opacity-40"
      >
        Refresh loading
      </button>
    </section>
  );
}