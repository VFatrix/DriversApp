import { useEffect, useState } from "react";
import workshopService from "../services/workshopService";
import WorkshopFaultCard from "./WorkshopFaultCard";

export default function WorkshopFaultList() {
  const [faults, setFaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadFaults = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await workshopService.getUnclearedFaults();
      setFaults(response);
    } catch (err) {
      setError(err.message || "Unable to load Workshop faults.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaults();
  }, []);

  const faultCleared = (updated) => {
    setFaults((current) =>
      current.filter((fault) => fault.id !== updated.id)
    );
  };

  const truckCount = new Set(
    faults.map((fault) => fault.truckId)
  ).size;

  return (
    <section>
      <div className="flex justify-between items-center gap-3 mb-3">
        <h3 className="font-bold text-lg">Uncleared truck faults</h3>

        <button
          type="button"
          onClick={loadFaults}
          disabled={loading}
          className="text-sm underline disabled:opacity-40"
        >
          Refresh
        </button>
      </div>

      {error && (
        <p role="alert" className="text-red-700 text-sm mb-3">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading faults…</p>
      ) : error ? null : (
        <>
          <p className="text-sm text-gray-600 mb-3">
            {faults.length} uncleared fault(s) across {truckCount} truck(s).
          </p>

          {faults.length === 0 ? (
            <p className="text-sm text-gray-600">
              No uncleared faults are recorded.
            </p>
          ) : (
            faults.map((fault) => (
              <WorkshopFaultCard
                key={fault.id}
                fault={fault}
                onCleared={faultCleared}
              />
            ))
          )}
        </>
      )}
    </section>
  );
}