import { useEffect, useState } from "react";
import ReplacementTruckSelection from "./ReplacementTruckSelection";
import replacementService from "../services/replacementService";

export default function TruckReplacementPanel({ assignmentId , onReplaced}) {
  const [request, setRequest] = useState(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadRequest = async () => {
    setLoading(true);
    setError("");

    try {
      const active = await replacementService.getMyActive();

      if (active && active.assignmentId !== assignmentId) {
        throw new Error(
          "Your truck assignment changed. Reload the page."
        );
      }

      setRequest(active);
    } catch (err) {
      setError(err.message || "Unable to load your replacement request.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequest();
  }, [assignmentId]);

  const submitRequest = async (event) => {
    event.preventDefault();

    if (saving || !reason.trim()) return;

    setSaving(true);
    setError("");

    try {
      const created = await replacementService.create(
        assignmentId,
        reason.trim()
      );

      setRequest(created);
      setReason("");
    } catch (err) {
      setError(err.message || "Unable to request another truck.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-4 border rounded-xl p-4">
      <h3 className="font-bold text-lg mb-2">
        Choose alternate vehicle / authorization
      </h3>

      {error && (
        <p role="alert" className="text-red-700 text-sm mb-3">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">
          Loading replacement request…
        </p>
      ) : request ? (
        <div>
          <p className="font-semibold text-sm">
            Status: {request.status}
          </p>

          <p className="text-sm mt-2">{request.reason}</p>

          {request.reviewNotes && (
            <p className="text-sm text-gray-600 mt-2">
              Review: {request.reviewNotes}
            </p>
          )}

          {request.status === "Pending" && (
            <p className="text-sm mt-2">
              Waiting for Workshop or Admin to review your request.
            </p>
          )}

          {request.status === "Approved" && (
  <>
    <p className="text-sm text-green-700 mt-2">
      You are authorized to choose an available replacement truck.
    </p>

    <ReplacementTruckSelection
      requestId={request.id}
      originalTruckId={request.truckId}
      onCompleted={(completed) => {
        setRequest(completed);
        onReplaced?.();
      }}
    />
  </>
)}
        </div>
      ) : !error ? (
        <form onSubmit={submitRequest}>
          <p className="text-sm text-gray-600 mb-3">
            If your truck has reported faults and cannot be repaired
            immediately, request authorization to use another truck.
          </p>

          <textarea
            aria-label="Reason for requesting another truck"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={500}
            required
            disabled={saving}
            placeholder="Explain why you need another truck."
            rows={3}
            className="w-full border rounded-lg p-2 text-sm mb-2"
          />

          <button
            type="submit"
            disabled={saving || !reason.trim()}
            className="bg-red-700 text-white rounded-lg px-4 py-2 font-semibold disabled:opacity-40"
          >
            {saving ? "Requesting…" : "Request authorization"}
          </button>
        </form>
      ) : null}

      <button
        type="button"
        onClick={loadRequest}
        disabled={loading || saving}
        className="mt-3 text-sm underline disabled:opacity-40"
      >
        Refresh request status
      </button>
    </section>
  );
}