import { useCallback, useEffect, useState } from "react";
import inspectionService from "../services/inspectionService";
import InspectionAnswer from "./InspectionAnswer";
import InspectionPhoto from "./InspectionPhoto";

export default function TruckInspectionPanel({
  assignmentId,
  onSubmitted
}) {
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [dirtyAnswers, setDirtyAnswers] = useState({});

const answerDirtyChanged = useCallback((answerId, isDirty) => {
  setDirtyAnswers((current) => {
    if (Boolean(current[answerId]) === isDirty) {
      return current;
    }

    return {
      ...current,
      [answerId]: isDirty
    };
  });
}, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      setInspection(null);

      try {
        const draft = await inspectionService.getMyLatest();

        if (!cancelled) {
          if (draft && draft.assignmentId !== assignmentId) {
            throw new Error(
              "Your truck assignment changed. Reload the page."
            );
          }

          setInspection(draft);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load the inspection.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [assignmentId]);

  const startInspection = async () => {
    if (starting) return;

    setStarting(true);
    setError("");

    try {
      const created = await inspectionService.create(assignmentId);
      setInspection(created);
    } catch (err) {
      if (err.status === 409) {
        try {
          const draft = await inspectionService.getMyLatest();

          if (draft && draft.assignmentId === assignmentId) {
            setInspection(draft);
            return;
          }
        } catch {
          // Keep the original error visible.
        }
      }

      setError(err.message || "Unable to start the inspection.");
    } finally {
      setStarting(false);
    }
  };

  const answerSaved = (updated) => {
    setInspection((current) => ({
      ...current,
      answers: current.answers.map((answer) =>
        answer.id === updated.id ? updated : answer
      )
    }));
  };
  const photoUploaded = (savedPhoto) => {
  setInspection((current) => ({
    ...current,
    photos: [
      ...current.photos.filter(
        (photo) => photo.angle !== savedPhoto.angle
      ),
      savedPhoto
    ]
  }));
};
const hasUnsavedAnswers = Object.values(dirtyAnswers).some(Boolean);

const canSubmit =
  inspection?.status === "Draft" &&
  inspection.answers.length === 21 &&
  inspection.answers.every(
    (answer) =>
      answer.hasDefect !== null &&
      (!answer.hasDefect || answer.notes?.trim())
  ) &&
  ["front", "left", "right", "rear"].every((angle) =>
    inspection.photos.some((photo) => photo.angle === angle)
  ) &&
  !hasUnsavedAnswers;

const submitInspection = async () => {
  if (!canSubmit || submitting) return;

  setSubmitting(true);
  setError("");

  try {
    const submitted = await inspectionService.submit(inspection.id);
    setInspection(submitted);
    setDirtyAnswers({});
    onSubmitted?.();
  } catch (err) {
    setError(err.message || "Unable to submit the inspection.");
  } finally {
    setSubmitting(false);
  }
};

  if (loading) {
    return (
      <p className="text-sm text-gray-500 mt-4">
        Loading inspection…
      </p>
    );
  }

  const answeredCount = inspection
    ? inspection.answers.filter(
        (answer) => answer.hasDefect !== null
      ).length
    : 0;

  return (
    <section className="mt-4">
      <h3 className="font-bold text-lg mb-2">
        Pre-trip inspection
      </h3>

      {error && (
        <p role="alert" className="text-red-700 text-sm mb-3">
          {error}
        </p>
      )}

      {!inspection ? (
        <button
          type="button"
          onClick={startInspection}
          disabled={starting}
          className="bg-red-700 text-white rounded-xl px-4 py-3 font-bold disabled:opacity-40"
        >
          {starting ? "Starting…" : "Start inspection"}
        </button>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-3">
            {answeredCount} of {inspection.answers.length} answers saved.
            Save each answer before continuing.
          </p>

/*/// button just for testing purposes, will be removed in  */
{inspection.status === "Draft" && (
  <button
    type="button"
    onClick={() => {
      setAnswers((current) =>
        current.map((answer) => ({
          ...answer,
          hasDefect: false8
        }))
      );
    }}
    disabled={busy}
    className="border rounded-lg px-4 py-2 mb-3 text-sm disabled:opacity-40"
  >
    Testing: set all answers to No
  </button>
)}

          {inspection.answers.map((answer) => (
            <InspectionAnswer
              key={`${inspection.id}-${answer.id}`}
              inspectionId={inspection.id}
              answer={answer}
              onSaved={answerSaved}
              readOnly={submitting || inspection.status !== "Draft"}
              onDirtyChange={answerDirtyChanged}
            />
          ))}
          <h3 className="font-bold text-lg mt-5 mb-2">
  Required truck photos
</h3>

<p className="text-sm text-gray-600 mb-3">
  Upload all four photos before submitting the inspection.
</p>

<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  {[
    ["front", "Front"],
    ["left", "Left side"],
    ["right", "Right side"],
    ["rear", "Rear"]
  ].map(([angle, label]) => (
    <InspectionPhoto
      key={`${inspection.id}-${angle}`}
      inspectionId={inspection.id}
      angle={angle}
      label={label}
      photo={inspection.photos.find(
        (photo) => photo.angle === angle
      )}
      onUploaded={photoUploaded}
      readOnly={submitting || inspection.status !== "Draft"}
    />
  ))}
</div>

{inspection.status === "Draft" ? (
  <div className="mt-4">
    {hasUnsavedAnswers && (
      <p className="text-sm text-red-700 mb-2">
        Save your changed answers before submitting.
      </p>
    )}

    <button
      type="button"
      onClick={submitInspection}
      disabled={!canSubmit || submitting}
      className="w-full bg-red-700 text-white rounded-xl py-3 font-bold disabled:opacity-40"
    >
      {submitting ? "Submitting…" : "Submit inspection"}
    </button>

    <p className="text-xs text-gray-500 mt-2">
      All 21 answers and four photos must be saved.
    </p>
  </div>
) : (
  <div className="mt-4 border rounded-xl p-3 bg-gray-50">
    <p className="font-semibold">Inspection submitted</p>
    <p className="text-sm mt-1">
      Reported defects require Workshop clearance.
      Trip departure requires Operations authorization.
    </p>
  </div>
)}
        </>
      )}
    </section>
  );
}