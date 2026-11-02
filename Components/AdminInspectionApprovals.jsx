import { useCallback, useEffect, useState } from "react";
import adminInspectionService from "../services/adminInspectionService";
import WorkshopInspectionDetails from "./WorkshopInspectionDetails";

export default function AdminInspectionApprovals() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [loadedInspectionId, setLoadedInspectionId] = useState(null);

const inspectionLoadChanged = useCallback((inspectionId, loaded) => {
  setLoadedInspectionId((current) =>
    loaded ? inspectionId : current === inspectionId ? null : current
  );
}, []);

  const loadPending = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const pending = await adminInspectionService.getPending();
      setInspections(pending);
    } catch (err) {
      setError(err.message || "Unable to load pending inspections.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const approveInspection = async (inspection) => {
  if (
  loading ||
  approvingId !== null ||
  !inspection.canApprove ||
  expandedId !== inspection.id ||
  loadedInspectionId !== inspection.id
) {
  return;
}
    setApprovingId(inspection.id);
    setError("");
    setMessage("");

    try {
      await adminInspectionService.approve(inspection.id);

      setInspections((current) =>
        current.filter((item) => item.id !== inspection.id)
      );

      setExpandedId(null);
      setMessage(
        `Inspection for ${inspection.registrationNumber} approved for loading.`
      );
    } catch (err) {
      setError(err.message || "Unable to approve the inspection.");

      // Disable approval until refreshed if availability changed.
      if (err.status === 409) {
        setInspections((current) =>
          current.map((item) =>
            item.id === inspection.id
              ? { ...item, canApprove: false }
              : item
          )
        );
      }
    } finally {
      setApprovingId(null);
    }
  };

  const busy = loading || approvingId !== null;

  return (
    <section className="bg-white border rounded-xl p-4">
      <h3 className="font-bold text-lg mb-2">
        Inspection approvals
      </h3>

      <p className="text-sm text-gray-600 mb-4">
        Review the inspection answers, comments and photos before
        approving the driver to load.
      </p>

      {message && (
        <p role="status" className="text-green-700 mb-3">
          {message}
        </p>
      )}

      {error && (
        <p role="alert" className="text-red-700 mb-3">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={loadPending}
        disabled={busy}
        className="text-sm underline mb-4 disabled:opacity-40"
      >
        Refresh inspections
      </button>

      {loading ? (
        <p className="text-sm text-gray-500">
          Loading pending inspections…
        </p>
      ) : (
        <div className="space-y-4">
          {!error && inspections.length === 0 && (
            <p className="text-sm text-gray-500">
              No inspections are awaiting approval.
            </p>
          )}

          {inspections.map((inspection) => (
            <div
              key={inspection.id}
              className="border rounded-xl p-4"
            >
              <h4 className="font-bold">
                {inspection.registrationNumber}
              </h4>

              <p className="text-sm mt-1">
                Driver: {inspection.driverName}
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Submitted:{" "}
                {inspection.submittedAt
                  ? new Date(inspection.submittedAt).toLocaleString()
                  : "Not recorded"}
              </p>

              <p className="text-sm font-semibold text-amber-700 mt-3">
                Awaiting admin approval
              </p>

              {inspection.unclearedFaultCount > 0 && (
                <p className="text-sm text-red-700 mt-2">
                  Workshop must clear{" "}
                  {inspection.unclearedFaultCount} outstanding fault(s)
                  before approval.
                </p>
              )}

              {!inspection.canApprove &&
                inspection.unclearedFaultCount === 0 && (
                  <p className="text-sm text-red-700 mt-2">
                    Approval is unavailable. Refresh the list and check
                    that the truck and driver are active.
                  </p>
                )}

              <button
                type="button"
               onClick={() => {
  setLoadedInspectionId(null);
  setExpandedId((current) =>
    current === inspection.id ? null : inspection.id
  );
}}
                disabled={busy}
                className="text-sm underline mt-3 disabled:opacity-40"
              >
                {expandedId === inspection.id
                  ? "Hide inspection"
                  : "Review inspection"}
              </button>

              {expandedId === inspection.id && (
                <>
                 <WorkshopInspectionDetails
                 key={inspection.id}
                   inspectionId={inspection.id}
                   onLoadStateChange={inspectionLoadChanged}
                     />

                  <button
                    type="button"
                    onClick={() => approveInspection(inspection)}
                  disabled={
                           busy ||
                          !inspection.canApprove ||
                       loadedInspectionId !== inspection.id
}
                    className="block mt-4 bg-green-700 text-white rounded-lg px-4 py-2 disabled:opacity-40"
                  >
                    {approvingId === inspection.id
                      ? "Approving…"
                      : "Approve for loading"}
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}