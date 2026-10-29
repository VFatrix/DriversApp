import { useEffect, useState } from "react";
import trailerService from "../services/trailerService";

export default function DriverTrailerSelection({ assignmentId,readOnly= false }) {
  const [trailers, setTrailers] = useState([]);
  const [firstId, setFirstId] = useState("");
  const [secondId, setSecondId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setLoaded(false);
      setError("");
      setMessage("");

      try {
        const [available, assigned] = await Promise.all([
          trailerService.getAvailableForAssignment(assignmentId),
          trailerService.getAssigned(assignmentId)
        ]);

        if (cancelled) return;

        const ordered = [...assigned].sort(
          (a, b) => a.position - b.position
        );

        // Include saved trailers even if absent from the available list.
        const options = [...available];

        for (const item of ordered) {
          if (!options.some((trailer) => trailer.id === item.trailerId)) {
            options.push({
              id: item.trailerId,
              reg: item.reg
            });
          }
        }

        setTrailers(options);
        setFirstId(
          ordered[0] ? String(ordered[0].trailerId) : ""
        );
        setSecondId(
          ordered[1] ? String(ordered[1].trailerId) : ""
        );
        setLoaded(true);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load trailers.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [assignmentId, refreshKey]);

  const saveTrailers = async () => {
   if (loading || saving || !loaded || readOnly) return;

    setSaving(true);
    setError("");
    setMessage("");

    const trailerIds = [firstId, secondId]
      .filter(Boolean)
      .map(Number);

    try {
      await trailerService.saveAssignments(
        assignmentId,
        trailerIds
      );

      setMessage("Trailer selection saved successfully.");
    } catch (err) {
      setError(err.message || "Unable to save trailer selection.");
    } finally {
      setSaving(false);
    }
  };

  const busy = loading || saving;

  return (
    <section className="border rounded-xl p-4 mt-4">
      <h3 className="font-bold mb-2">
  Trailer selection — NEW VERSION
</h3>

      <p className="text-sm text-gray-600 mb-3">
        Select up to two trailers and save before starting your
        inspection. Leave both empty if no trailer is required.
      </p>

      {error && (
        <p role="alert" className="text-red-700 text-sm mb-3">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="text-green-700 text-sm mb-3">
          {message}
        </p>
      )}

      {readOnly && (
  <p className="text-sm text-gray-600 mb-3">
    Trailer editing is locked while inspection status is being
    checked or once an inspection has started.
  </p>
)}

      {loading ? (
        <p className="text-sm text-gray-500">
          Loading trailers…
        </p>
      ) : (
        <fieldset
          disabled={busy || !loaded || readOnly}
          className="space-y-3"
        >
          <label className="block text-sm font-semibold">
            First trailer
            <select
              value={firstId}
              onChange={(event) => {
                const value = event.target.value;
                setFirstId(value);

                if (!value) setSecondId("");

                setMessage("");
              }}
              className="block w-full border rounded-lg p-3 mt-1"
            >
              <option value="">No trailer</option>

              {trailers
                .filter((trailer) => String(trailer.id) !== secondId)
                .map((trailer) => (
                  <option key={trailer.id} value={trailer.id}>
                    {trailer.reg}
                  </option>
                ))}
            </select>
          </label>

          <label className="block text-sm font-semibold">
            Second trailer (optional)
            <select
              value={secondId}
              onChange={(event) => {
                setSecondId(event.target.value);
                setMessage("");
              }}
              disabled={!firstId}
              className="block w-full border rounded-lg p-3 mt-1 disabled:opacity-40"
            >
              <option value="">No second trailer</option>

              {trailers
                .filter((trailer) => String(trailer.id) !== firstId)
                .map((trailer) => (
                  <option key={trailer.id} value={trailer.id}>
                    {trailer.reg}
                  </option>
                ))}
            </select>
          </label>

          <button
            type="button"
            onClick={saveTrailers}
            disabled={busy || !loaded}
            className="bg-red-700 text-white rounded-lg px-4 py-2 disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save trailers"}
          </button>
        </fieldset>
      )}

      <button
        type="button"
        onClick={() => setRefreshKey((current) => current + 1)}
        disabled={busy}
        className="text-sm underline mt-3 disabled:opacity-40"
      >
        Reload saved trailers
      </button>

      <p className="text-xs text-gray-500 mt-2">
        Reloading replaces any unsaved selection.
      </p>
    </section>
  );
}