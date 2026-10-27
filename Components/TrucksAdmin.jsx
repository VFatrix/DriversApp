import { useEffect, useState } from "react";
import truckService from "../services/truckService";

export default function TrucksAdmin() {
  const [trucks, setTrucks] = useState([]);
  const [filter, setFilter] = useState("active");
  const [loading, setLoading] = useState(true);
  const [changingId, setChangingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [registration, setRegistration] = useState("");
  const [makeModel, setMakeModel] = useState("");
  const [creating, setCreating] = useState(false);

  const loadTrucks = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await truckService.getAll();
      setTrucks(result);
    } catch (err) {
      setError(err.message || "Unable to load trucks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrucks();
  }, []);

  const changeStatus = async (truck) => {
    if (changingId !== null || loading || creating) return;

    const registration = truck.reg ?? truck.registrationNumber;
    const archiving = truck.isActive;

    if (
      archiving &&
      !window.confirm(`Archive truck ${registration}?`)
    ) {
      return;
    }

    setChangingId(truck.id);
    setError("");
    setMessage("");

    try {
      if (archiving) {
        await truckService.archiveTruck(truck.id);
      } else {
        await truckService.restoreTruck(truck.id);
      }

      // Reload availability because restored trucks may still have faults.
      try {
        const updated = await truckService.getAll();
        setTrucks(updated);

        setMessage(
          `Truck ${registration} ${
            archiving ? "archived" : "restored"
          } successfully.`
        );
      } catch {
        setError(
          "The change was saved, but the list could not refresh. Click Refresh trucks."
        );
      }
    } catch (err) {
      setError(err.message || "Unable to update the truck.");
    } finally {
      setChangingId(null);
    }
  };

  const addTruck = async (event) => {
  event.preventDefault();

  if (creating || loading || changingId !== null) return;

  setCreating(true);
  setError("");
  setMessage("");

  try {
    const created = await truckService.createTruck(
      registration,
      makeModel
    );

    setTrucks((current) =>
      [...current, created].sort((a, b) =>
        (a.reg ?? a.registrationNumber ?? "").localeCompare(
          b.reg ?? b.registrationNumber ?? ""
        )
      )
    );

    setRegistration("");
    setMakeModel("");
    setFilter("active");
    setMessage("Truck added successfully.");
  } catch (err) {
    setError(err.message || "Unable to add the truck.");
  } finally {
    setCreating(false);
  }
};

  const visibleTrucks = trucks.filter((truck) => {
    if (filter === "active") return truck.isActive;
    if (filter === "archived") return !truck.isActive;
    return true;
  });

  return (
    <section className="bg-white border rounded-xl p-4 mb-5">
      <h3 className="font-bold text-lg mb-3">Trucks</h3>

              <form onSubmit={addTruck} className="border rounded-xl p-4 mb-4">
  <h4 className="font-semibold mb-3">Add truck</h4>

  <fieldset
    disabled={creating || loading || changingId !== null}
    className="space-y-3"
  >
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

    <label className="block text-sm">
      Make / model
      <input
        value={makeModel}
        onChange={(event) => setMakeModel(event.target.value)}
        maxLength={100}
        className="block w-full border rounded-lg p-2 mt-1"
      />
    </label>

    <button
      type="submit"
      disabled={!registration.trim()}
      className="bg-red-700 text-white rounded-lg px-4 py-2 disabled:opacity-40"
    >
      {creating ? "Saving…" : "Add truck"}
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
        Show trucks
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="block w-full border rounded-lg p-2 mt-1"
        >
          <option value="active">Active trucks</option>
          <option value="archived">Archived trucks</option>
          <option value="all">All trucks</option>
        </select>
      </label>

      <button
        type="button"
        onClick={loadTrucks}
        disabled={loading || changingId !== null || creating}
        className="text-sm underline mb-3 disabled:opacity-40"
      >
        Refresh trucks
      </button>

      {loading ? (
        <p>Loading trucks…</p>
      ) : (
        <div className="space-y-3">
          {visibleTrucks.length === 0 && !error && (
            <p>No trucks found for this filter.</p>
          )}

          {visibleTrucks.map((truck) => (
            <div key={truck.id} className="border rounded-lg p-3">
              <p className="font-semibold">
                {truck.reg ?? truck.registrationNumber}
              </p>

              <p className="text-sm text-gray-600">
                {truck.make ?? truck.makeModel}
              </p>

              <p className="text-sm mt-1">
                {!truck.isActive
                  ? "Archived"
                  : truck.isAvailable
                  ? "Available"
                  : "Unavailable"}
              </p>

              <button
                type="button"
                onClick={() => changeStatus(truck)}
                disabled={changingId !== null || creating}
                className={`mt-3 text-white rounded-lg px-4 py-2 disabled:opacity-40 ${
                  truck.isActive ? "bg-red-700" : "bg-green-700"
                }`}
              >
                {changingId === truck.id
                  ? "Saving…"
                  : truck.isActive
                  ? "Archive truck"
                  : "Restore truck"}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}