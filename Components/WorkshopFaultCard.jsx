import { useState } from "react";
import WorkshopInspectionDetails from "./WorkshopInspectionDetails";
import workshopService from "../services/workshopService";

export default function WorkshopFaultCard({ fault, onCleared }) {
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showInspection, setShowInspection] = useState(false);

  const clearFault = async () => {
    if (saving || !notes.trim()) return;

    setSaving(true);
    setError("");

    try {
      const cleared = await workshopService.clearFault(
        fault.id,
        notes.trim()
      );

      onCleared(cleared);
    } catch (err) {
      setError(err.message || "Unable to clear the fault.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border rounded-xl p-4 mb-3">
      <h4 className="font-bold">{fault.reg}</h4>

      <p className="text-sm text-gray-600 mt-1">
        {fault.checkLabel || "Vehicle fault"}
      </p>

      <p className="text-sm mt-2">{fault.description}</p>

      <p className="text-xs text-gray-500 mt-2">
        Status: {fault.status}
      </p>

{fault.inspectionId && (
  <>
    <button
      type="button"
      onClick={() => setShowInspection((current) => !current)}
      className="text-sm underline mt-3"
    >
      {showInspection ? "Hide inspection" : "View inspection"}
    </button>

    {showInspection && (
      <WorkshopInspectionDetails
        inspectionId={fault.inspectionId}
      />
    )}
  </>
)}

      <textarea
        aria-label={`Resolution notes for fault ${fault.id}`}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        maxLength={1000}
        disabled={saving}
        placeholder="Describe how the defect was repaired or resolved."
        rows={3}
        className="w-full border rounded-lg p-2 text-sm mt-3"
      />

      {error && (
        <p role="alert" className="text-red-700 text-sm mt-2">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={clearFault}
        disabled={saving || !notes.trim()}
        className="bg-green-700 text-white rounded-lg px-4 py-2 mt-3 disabled:opacity-40"
      >
        {saving ? "Saving…" : "Clear fault"}
      </button>
    </div>
  );
}