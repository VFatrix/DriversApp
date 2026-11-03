import { useEffect, useRef, useState } from "react";
import tripLoadingPhotoService from "../Services/tripLoadingPhotoService";

export default function TripLoadingPhoto({
  tripId,
  angle,
  label,
  photo,
  onUploaded,
  readOnly = false
}) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const [previewError, setPreviewError] = useState("");
  const [previewKey, setPreviewKey] = useState(0);

  const inputRef = useRef(null);
  const uploadInProgress = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl;

    setImageUrl("");
    setPreviewError("");

    if (photo?.id) {
      tripLoadingPhotoService
        .getPhoto(photo.id)
        .then((blob) => {
          if (cancelled) return;

          objectUrl = URL.createObjectURL(blob);
          setImageUrl(objectUrl);
        })
        .catch((err) => {
          if (!cancelled) {
            setPreviewError(
              err.message || "Unable to display the saved photo."
            );
          }
        });
    }

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [photo?.id, previewKey]);

  const selectFile = (event) => {
    const selected = event.target.files?.[0];

    setFile(null);
    setError("");

    if (!selected) return;

    if (selected.size === 0) {
      setError("The selected file is empty.");
      event.target.value = "";
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setError("Choose an image no larger than 5 MB.");
      event.target.value = "";
      return;
    }

    setFile(selected);
  };

  const upload = async () => {
    if (
      !file ||
      uploadInProgress.current ||
      readOnly ||
      photo
    ) {
      return;
    }

    uploadInProgress.current = true;
    setUploading(true);
    setError("");

    try {
      const saved = await tripLoadingPhotoService.upload(
        tripId,
        angle,
        file
      );

      onUploaded(saved);
      setFile(null);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (err) {
      // Recover if a previous upload succeeded but its response was lost.
      try {
        const savedPhotos =
          await tripLoadingPhotoService.getForTrip(tripId);

        const existing = savedPhotos.find(
          (item) => item.angle === angle
        );

        if (existing) {
          onUploaded(existing);
          setFile(null);

          if (inputRef.current) {
            inputRef.current.value = "";
          }

          return;
        }
      } catch {
        // Keep the original upload error visible.
      }

      setError(err.message || "Unable to upload the loading photo.");
    } finally {
      uploadInProgress.current = false;
      setUploading(false);
    }
  };

  return (
    <div className="border rounded-xl p-3 bg-white">
      <h4 className="font-semibold text-sm mb-2">
        {label}
      </h4>

      {photo ? (
        <>
          <p className="text-green-700 text-sm mb-2">
            Photo saved
          </p>

          {!imageUrl && !previewError && (
            <p className="text-sm text-gray-500">
              Loading preview…
            </p>
          )}

          {imageUrl && !previewError && (
            <img
              src={imageUrl}
              alt={`${label} loading evidence`}
              onError={() =>
                setPreviewError("Unable to display this image.")
              }
              className="w-full h-40 object-contain rounded-lg"
            />
          )}

          {previewError && (
            <div>
              <p role="alert" className="text-red-700 text-sm">
                {previewError}
              </p>

              <button
                type="button"
                onClick={() =>
                  setPreviewKey((current) => current + 1)
                }
                className="text-sm underline mt-2"
              >
                Retry preview
              </button>
            </div>
          )}
        </>
      ) : readOnly ? (
        <p className="text-sm text-gray-500">
          No photo saved. Uploading is currently unavailable.
        </p>
      ) : (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            capture="environment"
            aria-label={`Choose ${label} loading photo`}
            onChange={selectFile}
            disabled={uploading}
            className="w-full text-sm mb-2"
          />

          {file && (
            <p className="text-xs text-gray-600 mb-2 break-all">
              Selected: {file.name}
            </p>
          )}

          <button
            type="button"
            onClick={upload}
            disabled={!file || uploading}
            className="bg-red-700 text-white rounded-lg px-3 py-2 text-sm disabled:opacity-40"
          >
            {uploading ? "Uploading…" : "Upload photo"}
          </button>
        </>
      )}

      {error && (
        <p role="alert" className="text-red-700 text-sm mt-2">
          {error}
        </p>
      )}
    </div>
  );
}