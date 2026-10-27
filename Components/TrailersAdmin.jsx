import { useEffect, useState } from "react";
import trailerService from "../services/trailerService";

export default function TrailersAdmin() {
  const [trailers, setTrailers] = useState([]);
  const [registration, setRegistration] = useState("");
  const [filter, setFilter] = useState("active");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [changingId, setChangingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const busy = loading || creating || changingId !== null;

  const loadTrailers = async () => {
    setLoading(true);
    setError("");

    try {
      const records = await trailerService.getAll();
      setTrailers(records);
    } catch (err) {
      setError(err.message || "Unable to load trailers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrailers();
  }, []);

  const addTrailer = async (event) => {
    event.preventDefault();

    if (busy || !registration.trim()) return;

    setCreating(true);
    setError("");
    setMessage("");

    try {
      const created = await trailerService.createTrailer(registration);

      setTrailers((current) =>
        [...current, created].sort((a, b) =>
          a.reg.localeCompare(b.reg)
        )
      );

      setRegistration("");
      setFilter("active");
      setMessage("Trailer added successfully.");
    } catch (err) {
      setError(err.message || "Unable to add the trailer.");
    } finally {
      setCreating(false);
    }
  };

  const changeStatus = async (trailer) => {
    if (busy) return;

    const archiving = trailer.isActive;

    if (
      archiving &&
      !window.confirm(`Archive trailer ${trailer.reg}?`)
    ) {
      return;
    }

    setChangingId(trailer.id);
    setError("");
    setMessage("");

    try {
      if (archiving) {
        await trailerService.archiveTrailer(trailer.id);
      } else {
        await trailerService.restoreTrailer(trailer.id);
      }

      setTrailers((current) =>
        current.map((item) =>
          item.id === trailer.id
            ? { ...item, isActive: !archiving }
            : item
        )
      );

      setMessage(
        `Trailer ${trailer.reg} ${
          archiving ? "archived" : "restored"
        } successfully.`
      );
    } catch (err) {
      setError(err.message || "Unable to update the trailer.");
    } finally {
      setChangingId(null);
    }
  };

  const visibleTrailers = trailers.filter((trailer) => {
    if (filter === "active") return trailer.isActive;
    if (filter === "archived") return !trailer.isActive;
    return true;
  });

  return (
    <section className="bg-white border rounded-xl p-4 mt-4">
      <h3 className="font-bold text-lg mb-3">Trailers</h3>

      <form
        onSubmit={addTrailer}
        className="border rounded-xl p-4 mb-4"
      >
        <h4 className="font-semibold mb-3">Add trailer</h4>

        <fieldset disabled={busy}>
          <label className="block text-sm">
            Registration number
            <input
              value={registration}
              onChange={(event) => setRegistration(event.target.value)}
              required
              maxLength={30}
              className="block w-full border rounded-lg p-2 mt-1"
            />
          </label>

          <button
            type="submit"
            disabled={busy || !registration.trim()}
            className="mt-3 bg-red-700 text-white rounded-lg px-4 py-2 disabled:opacity-40"
          >
            {creating ? "Saving…" : "Add trailer"}
          </button>
        </fieldset>
      </form>

      {error && (
        <p role="alert" className="text-red-700 mb-3">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="text-green-700 mb-3">
          {message}
        </p>
      )}

      <label className="block text-sm mb-3">
        Show trailers
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="block w-full border rounded-lg p-2 mt-1"
        >
          <option value="active">Active trailers</option>
          <option value="archived">Archived trailers</option>
          <option value="all">All trailers</option>
        </select>
      </label>

      <button
        type="button"
        onClick={loadTrailers}
        disabled={busy}
        className="text-sm underline mb-3 disabled:opacity-40"
      >
        Refresh trailers
      </button>

      {loading ? (
        <p>Loading trailers…</p>
      ) : (
        <div className="space-y-2">
          {visibleTrailers.length === 0 && !error && (
            <p>No trailers found.</p>
          )}

          {visibleTrailers.map((trailer) => (
            <div key={trailer.id} className="border rounded-lg p-3">
              <p className="font-semibold">{trailer.reg}</p>

              <p className="text-sm text-gray-600">
                {trailer.isActive ? "Active" : "Archived"}
              </p>

             <button
  type="button"
  onClick={() => changeStatus(trailer)}
  disabled={busy}
  className={`mt-2 text-white rounded-lg px-4 py-2 disabled:opacity-40 ${
    trailer.isActive
      ? "bg-gray-700 hover:bg-gray-800"
      : "bg-green-700 hover:bg-green-800"
  }`}
>
  {changingId === trailer.id
    ? "Saving…"
    : trailer.isActive
    ? "Archive trailer"
    : "Restore trailer"}
</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}