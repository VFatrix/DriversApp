import { useEffect, useState } from "react";
import operationsTripService from "../Services/operationsTripService";
import tripLoadingPhotoService from "../Services/tripLoadingPhotoService";

const VIEWS = {
  Container: [
    ["left", "Left side"],
    ["right", "Right side"],
    ["rear", "Rear"],
    ["seal", "Container seal"]
  ],
  Breakbulk: [
    ["left", "Left side"],
    ["right", "Right side"],
    ["front", "Front"],
    ["rear", "Rear"]
  ],
  Empty: []
};

function DepartureRequestCard({ request, onApproved }) {
  const [expanded, setExpanded] = useState(false);
  const [images, setImages] = useState({});
  const [decoded, setDecoded] = useState({});
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const views = VIEWS[request.loadType];
  const validLoadType = Boolean(views);

  useEffect(() => {
    let cancelled = false;
    const objectUrls = [];

    setImages({});
    setDecoded({});
    setPhotoError("");
    setReviewed(false);
    setLoadingPhotos(false);

    if (!expanded || !views || views.length === 0) {
      return;
    }

    const load = async () => {
      setLoadingPhotos(true);

      try {
        const loaded = {};

        for (const [angle] of views) {
          const photo = request.photos.find(
            (item) => item.angle === angle
          );

          if (!photo) {
            throw new Error(`Missing loading photo: ${angle}.`);
          }

          const blob =
            await tripLoadingPhotoService.getPhoto(photo.id);

          if (cancelled) return;

          const url = URL.createObjectURL(blob);
          objectUrls.push(url);
          loaded[angle] = url;
        }

        if (!cancelled) {
          setImages(loaded);
        }
      } catch (err) {
        if (!cancelled) {
          setPhotoError(
            err.message || "Unable to load the photos."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingPhotos(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [expanded, request.photos, views, retryKey]);

  const photosReady =
    validLoadType &&
    !loadingPhotos &&
    !photoError &&
    views.every(([angle]) => decoded[angle] === true);

  const canApprove =
    expanded &&
    request.canApprove &&
    !blocked &&
    photosReady &&
    reviewed &&
    !approving;

  const approve = async () => {
    if (!canApprove) return;

    setApproving(true);
    setError("");

    try {
      await operationsTripService.approveDeparture(request.id);
      onApproved(request);
    } catch (err) {
      setError(err.message || "Unable to approve departure.");

      if ([400, 404, 409].includes(err.status)) {
        setBlocked(true);
        setReviewed(false);
      }
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="border rounded-xl p-4">
      <h4 className="font-bold">
        {request.registrationNumber} — Trip #{request.id}
      </h4>

      <p className="text-sm mt-1">
        Driver: {request.driverName}
      </p>

      <p className="text-sm mt-1">
        {request.loadType} · {request.direction}
      </p>

      <p className="text-xs text-gray-500 mt-1">
        Requested:{" "}
        {request.departureRequestedAt
          ? new Date(
              request.departureRequestedAt
            ).toLocaleString()
          : "Not recorded"}
      </p>

      {!request.canApprove && (
        <p className="text-sm text-red-700 mt-3">
          {request.approvalBlockedReason ||
            "Departure approval is currently unavailable."}
        </p>
      )}

      <button
        type="button"
        onClick={() => {
          setReviewed(false);
          setExpanded((current) => !current);
        }}
        disabled={approving}
        className="text-sm underline mt-3 disabled:opacity-40"
      >
        {expanded ? "Hide review" : "Review departure request"}
      </button>

      {expanded && (
        <div className="mt-4">
          {!validLoadType ? (
            <p role="alert" className="text-sm text-red-700">
              Unrecognized load type. Approval is unavailable.
            </p>
          ) : request.loadType === "Empty" ? (
            <p className="text-sm text-gray-700">
              This is an empty trip. No loading photos are required.
            </p>
          ) : (
            <>
              <h5 className="font-semibold mb-2">
                Loading photos
              </h5>

              {loadingPhotos && (
                <p className="text-sm text-gray-500">
                  Loading photos…
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {views.map(([angle, label]) => (
                  <div key={angle} className="border rounded-lg p-2">
                    <p className="font-semibold text-sm mb-2">
                      {label}
                    </p>

                    {images[angle] && (
                      <img
                        src={images[angle]}
                        alt={`${label} loading evidence`}
                        onLoad={() =>
                          setDecoded((current) => ({
                            ...current,
                            [angle]: true
                          }))
                        }
                        onError={() => {
                          setDecoded((current) => ({
                            ...current,
                            [angle]: false
                          }));
                          setPhotoError(
                            `Unable to display the ${label} photo.`
                          );
                        }}
                        className="w-full h-56 object-contain"
                      />
                    )}
                  </div>
                ))}
              </div>

              {photoError && (
                <div className="mt-2">
                  <p role="alert" className="text-sm text-red-700">
                    {photoError}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setRetryKey((current) => current + 1)
                    }
                    disabled={approving}
                    className="text-sm underline mt-2"
                  >
                    Retry photos
                  </button>
                </div>
              )}
            </>
          )}

          <label className="flex items-start gap-2 text-sm mt-4">
            <input
              type="checkbox"
              checked={reviewed}
              onChange={(event) =>
                setReviewed(event.target.checked)
              }
              disabled={!photosReady || approving || blocked}
              className="mt-1"
            />
            <span>
              {request.loadType === "Empty"
                ? "I have reviewed this request and confirm that the trip is empty."
                : "I have reviewed all four loading photos and confirm the load is ready for departure."}
            </span>
          </label>

          {error && (
            <p role="alert" className="text-sm text-red-700 mt-3">
              {error}
            </p>
          )}

          {blocked && (
            <p className="text-sm text-amber-800 mt-2">
              Refresh the requests before reviewing again.
            </p>
          )}

          <button
            type="button"
            onClick={approve}
            disabled={!canApprove}
            className="mt-4 bg-green-700 text-white rounded-lg px-4 py-3 font-semibold disabled:opacity-40"
          >
            {approving ? "Approving…" : "Approve departure"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function OperationsDepartureApprovals() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const pending =
          await operationsTripService.getPendingDepartures();

        if (!cancelled) {
          setRequests(pending);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || "Unable to load departure requests."
          );
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
  }, [refreshKey]);

  const approved = (request) => {
    setRequests((current) =>
      current.filter((item) => item.id !== request.id)
    );

    setMessage(
      `Departure approved for ${request.registrationNumber}, trip #${request.id}.`
    );
  };

  return (
    <section className="bg-white border rounded-xl p-4">
      <h3 className="font-bold text-lg mb-2">
        Departure approvals
      </h3>

      <p className="text-sm text-gray-600 mb-3">
        Review each request before authorizing the driver to depart.
      </p>

      {message && (
        <p role="status" className="text-green-700 mb-3">
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={() => {
          setMessage("");
          setRefreshKey((current) => current + 1);
        }}
        disabled={loading}
        className="text-sm underline mb-4 disabled:opacity-40"
      >
        Refresh departure requests
      </button>

      {loading ? (
        <p className="text-sm text-gray-500">
          Loading departure requests…
        </p>
      ) : error ? (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-gray-500">
          No trips are awaiting departure approval.
        </p>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <DepartureRequestCard
              key={`${refreshKey}-${request.id}`}
              request={request}
              onApproved={approved}
            />
          ))}
        </div>
      )}
    </section>
  );
}