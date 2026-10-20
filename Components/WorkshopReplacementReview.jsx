import { useState } from "react";
import replacementService from "../services/replacementService";

export default function WorkshopReplacementReview({
  request,
  onReviewed
}) {
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const review = async (approve) => {
    if (saving) return;

    if (!notes.trim()) {
      setError("Explain your decision before continuing.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updated = await replacementService.review(
        request.id,
        approve,
        notes.trim()
      );

      onReviewed(updated);
    } catch (err) {
      setError(err.message || "Unable to review the request.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border rounded-xl p-4 mb-3 bg-white">
      <h4 className="font-bold">
        Replacement request — {request.reg}
      </h4>

      <p className="text-sm text-gray-600 mt-1">
        Driver ID: {request.driverId}
      </p>

      <p className="text-sm mt-2">
        {request.reason}
      </p>

      <textarea
        aria-label={`Decision notes for request ${request.id}`}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        maxLength={500}
        disabled={saving}
        placeholder="Explain the approval or rejection."
        rows={3}
        className="w-full border rounded-lg p-2 text-sm mt-3"
      />

      {error && (
        <p role="alert" className="text-red-700 text-sm mt-2">
          {error}
        </p>
      )}

      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={() => review(true)}
          disabled={saving || !notes.trim()}
          className="bg-green-700 text-white rounded-lg px-4 py-2 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Approve"}
        </button>

        <button
          type="button"
          onClick={() => review(false)}
          disabled={saving || !notes.trim()}
          className="bg-red-700 text-white rounded-lg px-4 py-2 disabled:opacity-40"
        >
          Reject
        </button>
      </div>
    </div>
  );
}