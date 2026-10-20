import { useEffect, useState } from "react";
import workshopService from "../services/workshopService";

export default function DriverTruckFaults({
  assignmentId,
  refreshKey = 0
}) {
  const [faults, setFaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadFaults = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await workshopService.getMyTruckFaults();
      setFaults(response);
    } catch (err) {
      setError(err.message || "Unable to load truck faults.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaults();
  }, [assignmentId, refreshKey]);

  return (
    <section className="mt-4 border rounded-xl p-4">
      <h3 className="font-bold text-lg mb-2">
        Workshop faults
      </h3>

      {error && (
        <p role="alert" className="text-red-700 text-sm mb-3">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading faults…</p>
      ) : !error && faults.length === 0 ? (
        <p className="text-sm text-gray-600">
          No uncleared faults are recorded for your assigned truck.
        </p>
      ) : (
        faults.map((fault) => (
          <div
            key={fault.id}
            className="border rounded-lg p-3 mb-2 bg-red-50"
          >
            <p className="font-semibold text-sm">
              {fault.checkLabel || "Vehicle fault"}
            </p>

            <p className="text-sm mt-1">{fault.description}</p>

            <p className="text-xs text-gray-600 mt-2">
              Status: {fault.status}
            </p>
          </div>
        ))
      )}

      <button
        type="button"
        onClick={loadFaults}
        disabled={loading}
        className="mt-2 text-sm underline disabled:opacity-40"
      >
        Refresh faults
      </button>
    </section>
  );
}