import { useEffect, useState } from "react";
import replacementService from "../services/replacementService";
import WorkshopReplacementReview from "./WorkshopReplacementReview";

export default function WorkshopReplacementList() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRequests = async () => {
    setLoading(true);
    setError("");

    try {
      const pending = await replacementService.getPending();
      setRequests(pending);
    } catch (err) {
      setError(err.message || "Unable to load replacement requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const requestReviewed = (updated) => {
    setRequests((current) =>
      current.filter((request) => request.id !== updated.id)
    );
  };

  return (
    <section className="mt-4">
      <div className="flex justify-between items-center gap-3 mb-3">
        <h3 className="font-bold text-lg">
          Pending truck replacements
        </h3>

        <button
          type="button"
          onClick={loadRequests}
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
        <p className="text-sm text-gray-500">Loading requests…</p>
      ) : error ? null : requests.length === 0 ? (
        <p className="text-sm text-gray-600">
          No replacement requests are awaiting review.
        </p>
      ) : (
        requests.map((request) => (
          <WorkshopReplacementReview
            key={request.id}
            request={request}
            onReviewed={requestReviewed}
          />
        ))
      )}
    </section>
  );
}