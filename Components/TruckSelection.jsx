import { useEffect, useState } from "react";
import truckService from "../services/truckService";

export default function TruckSelection({ onAssigned }) {
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
      setTrucks(available);

      setTruckId((current) =>
        available.some((truck) => String(truck.id) === current)
          ? current
          : ""
      );
    } catch (err) {
      setError(err.message || "Unable to load trucks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrucks();
  }, []);

  const selectTruck = async (event) => {
    event.preventDefault();

    if (saving || !truckId) return;

    setSaving(true);
    setError("");

    try {
      const assignment = await truckService.selectTruck(
        Number(truckId)
      );

      onAssigned(assignment);
    } catch (err) {
      setError(err.message || "Unable to select the truck.");

      if (err.status === 409) {
        try {
          const active = await truckService.getMyActiveAssignment();

          if (active) {
            onAssigned(active);
            return;
          }

          const available = await truckService.getAvailable();
          setTrucks(available);
          setTruckId("");
        } catch {
          // Keep the original selection error visible.
        }
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={selectTruck}
      className="bg-white rounded-xl border p-4 shadow-sm"
    >
      <h3 className="font-bold text-lg mb-2">Select your truck</h3>

      {error && (
        <p role="alert" className="text-red-700 text-sm mb-3">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading trucks…</p>
      ) : (
        <>
          <select
            aria-label="Available truck"
            value={truckId}
            onChange={(event) => setTruckId(event.target.value)}
            disabled={saving}
            required
            className="w-full border rounded-xl px-3 py-3 mb-3"
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
            <p className="text-sm text-gray-500 mb-3">
              No trucks are currently available.
            </p>
          )}

          <button
            type="submit"
            disabled={saving || !truckId}
            className="w-full bg-red-700 text-white rounded-xl py-3 font-bold disabled:opacity-40"
          >
            {saving ? "Assigning truck…" : "Select truck"}
          </button>
        </>
      )}

      <button
        type="button"
        onClick={loadTrucks}
        disabled={loading || saving}
        className="mt-3 text-sm underline disabled:opacity-40"
      >
        Refresh available trucks
      </button>
    </form>
  );
}