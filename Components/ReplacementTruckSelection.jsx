import { useEffect, useState } from "react";
import truckService from "../services/truckService";
import replacementService from "../services/replacementService";

export default function ReplacementTruckSelection({
  requestId,
  originalTruckId,
  onCompleted
}) {
  const [trucks, setTrucks] = useState([]);
  const [truckId, setTruckId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadTrucks = async () => {
    setLoading(true);
    setError("");

    try {
      const available = await truckService.getAvailable();

      setTrucks(
        available.filter((truck) => truck.id !== originalTruckId)
      );

      setTruckId("");
    } catch (err) {
      setError(err.message || "Unable to load available trucks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrucks();
  }, [originalTruckId]);

  const chooseTruck = async (event) => {
    event.preventDefault();

    if (saving || !truckId) return;

    setSaving(true);
    setError("");

    try {
      const completed = await replacementService.chooseTruck(
        requestId,
        Number(truckId)
      );

      onCompleted(completed);
    } catch (err) {
      setError(err.message || "Unable to switch trucks.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={chooseTruck} className="mt-4">
      <h4 className="font-semibold mb-2">
        Select replacement truck
      </h4>

      {error && (
        <p role="alert" className="text-red-700 text-sm mb-2">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading trucks…</p>
      ) : (
        <>
          <select
            aria-label="Replacement truck"
            value={truckId}
            onChange={(event) => setTruckId(event.target.value)}
            disabled={saving}
            required
            className="w-full border rounded-lg p-3 mb-2"
          >
            <option value="">Choose an available truck</option>

            {trucks.map((truck) => (
              <option key={truck.id} value={truck.id}>
                {truck.reg}
                {truck.make ? ` — ${truck.make}` : ""}
              </option>
            ))}
          </select>

          {trucks.length === 0 && (
            <p className="text-sm text-gray-600 mb-2">
              No replacement trucks are currently available.
            </p>
          )}

          <button
            type="submit"
            disabled={saving || !truckId}
            className="bg-red-700 text-white rounded-lg px-4 py-2 font-semibold disabled:opacity-40"
          >
            {saving ? "Switching trucks…" : "Confirm replacement"}
          </button>
        </>
      )}

      <button
        type="button"
        onClick={loadTrucks}
        disabled={loading || saving}
        className="block mt-3 text-sm underline disabled:opacity-40"
      >
        Refresh available trucks
      </button>
    </form>
  );
}