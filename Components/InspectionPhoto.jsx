import { useEffect, useState } from "react";
import inspectionService from "../services/inspectionService";

export default function InspectionPhoto({
  inspectionId,
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

  useEffect(() => {
    let cancelled = false;
    let objectUrl;

    setImageUrl("");
    setPreviewError("");

    if (photo) {
      inspectionService.getPhoto(photo.id)
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
  }, [photo?.id]);

  const selectFile = (event) => {
    const selected = event.target.files?.[0];

    setError("");
    setFile(null);

    if (!selected) return;

    if (selected.size > 5 * 1024 * 1024) {
      setError("Choose an image no larger than 5 MB.");
      event.target.value = "";
      return;
    }

    setFile(selected);
  };

  const upload = async () => {
    if (!file || uploading || readOnly || photo) return;

    setUploading(true);
    setError("");

    try {
      const saved = await inspectionService.uploadPhoto(
        inspectionId,
        angle,
        file
      );

      onUploaded(saved);
      setFile(null);
    } catch (err) {
      setError(err.message || "Unable to upload the photo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border rounded-xl p-3">
      <h4 className="font-semibold text-sm mb-2">
        {label}
      </h4>

      {photo ? (
        <>
          <p className="text-green-700 text-sm mb-2">
            Photo saved
          </p>

          {imageUrl && (
            <img
              src={imageUrl}
              alt={`${label} inspection evidence`}
              className="w-full h-40 object-contain rounded-lg"
            />
          )}

          {previewError && (
            <p role="alert" className="text-red-700 text-sm">
              {previewError}
            </p>
          )}
        </>
      ) : readOnly ? (
  <p className="text-sm text-gray-500">
    Photo upload is currently unavailable.
  </p>
) : (
        <>
          <input
            aria-label={`Choose ${label} photo`}
            type="file"
            accept="image/jpeg,image/png"
            capture="environment"
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