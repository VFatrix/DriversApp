import { useEffect, useState } from "react";
import inspectionService from "../services/inspectionService";
import InspectionAnswer from "./InspectionAnswer";
import InspectionPhoto from "./InspectionPhoto";

const PHOTO_ANGLES = [
  ["front", "Front"],
  ["left", "Left side"],
  ["right", "Right side"],
  ["rear", "Rear"]
];

export default function TruckInspectionPanel({
  assignmentId,
  onSubmitted
}) {
  // Inspection contains the last confirmed saved values.
  const [inspection, setInspection] = useState(null);

  // Answers and comments contain the driver's current selections.
  const [answers, setAnswers] = useState([]);
  const [comments, setComments] = useState("");

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const applyInspection = (data) => {
    setInspection(data);
    setAnswers(data?.answers ?? []);
    setComments(data?.additionalComments ?? "");
    setSaveMessage("");
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      setInspection(null);
      setAnswers([]);
      setComments("");
      setSaveMessage("");

      try {
        const latest = await inspectionService.getMyLatest();

        if (cancelled) return;

        if (latest && latest.assignmentId !== assignmentId) {
          throw new Error(
            "Your truck assignment changed. Reload the page."
          );
        }

        applyInspection(latest);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load the inspection.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
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
      applyInspection(created);
    } catch (err) {
      if (err.status === 409) {
        try {
          const latest = await inspectionService.getMyLatest();

          if (latest && latest.assignmentId === assignmentId) {
            applyInspection(latest);
            return;
          }
        } catch {
          // Display the original creation error below.
        }
      }

      setError(err.message || "Unable to start the inspection.");
    } finally {
      setStarting(false);
    }
  };

  const busy = saving || submitting;
  const readOnly = busy || inspection?.status !== "Draft";

  const answerChanged = (answerId, hasDefect) => {
    if (readOnly) return;

    setAnswers((current) =>
      current.map((answer) =>
        answer.id === answerId
          ? { ...answer, hasDefect }
          : answer
      )
    );

    setSaveMessage("");
  };

  const changedAnswers = answers.filter((answer) => {
    const saved = inspection?.answers.find(
      (item) => item.id === answer.id
    );

    return !saved || saved.hasDefect !== answer.hasDefect;
  });

  const hasUnsavedComments =
    (comments.trim() || null) !==
    (inspection?.additionalComments?.trim() || null);

  const hasUnsavedChanges =
    changedAnswers.length > 0 || hasUnsavedComments;

  const allAnswered =
    answers.length === 21 &&
    answers.every(
      (answer) =>
        answer.hasDefect === true ||
        answer.hasDefect === false
    );

  const allPhotosUploaded = PHOTO_ANGLES.every(([angle]) =>
    inspection?.photos?.some((photo) => photo.angle === angle)
  );

  const canSubmit =
    inspection?.status === "Draft" &&
    allAnswered &&
    allPhotosUploaded &&
    !hasUnsavedChanges &&
    !busy;

  const saveAnswers = async () => {
  if (
    !inspection ||
    inspection.status !== "Draft" ||
    busy ||
    !hasUnsavedChanges
  ) {
    return;
  }

  if (!allAnswered) {
    setError("Answer all 21 questions before saving.");
    setSaveMessage("");
    return;
  }

  setSaving(true);
  setError("");
  setSaveMessage("");

  try {
    const updated = await inspectionService.save(
      inspection.id,
      answers,
      comments
    );

    applyInspection(updated);

    setSaveMessage("Your answers and comments are saved.");
  } catch (err) {
    setError(
      err.message ||
      "Unable to save. Your selections remain here; please try again."
    );
  } finally {
    setSaving(false);
  }
};
  const photoUploaded = (savedPhoto) => {
    setInspection((current) => {
      if (!current) return current;

      return {
        ...current,
        photos: [
          ...(current.photos ?? []).filter(
            (photo) => photo.angle !== savedPhoto.angle
          ),
          savedPhoto
        ]
      };
    });
  };

  const submitInspection = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    setError("");
    setSaveMessage("");

    try {
      const submitted = await inspectionService.submit(inspection.id);
      applyInspection(submitted);
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

  const answeredCount = answers.filter(
    (answer) => typeof answer.hasDefect === "boolean"
  ).length;

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
          <p className="text-sm text-gray-600 mb-2">
            {answeredCount} of {answers.length} questions answered.
          </p>

          <p className="text-sm font-semibold mb-4">
            Yes = a defect was found. No = no defect was found.
          </p>

          {answers.map((answer) => (
            <InspectionAnswer
              key={`${inspection.id}-${answer.id}`}
              inspectionId={inspection.id}
              answer={answer}
              onChange={answerChanged}
              readOnly={readOnly}
            />
          ))}

          <div className="border rounded-xl p-4 mt-4">
            <label
              htmlFor={`inspection-comments-${inspection.id}`}
              className="block font-semibold mb-2"
            >
              Other issues / comments (optional)
            </label>

            <p className="text-sm text-gray-600 mb-3">
              Describe anything you found that was not covered
              by the questions above.
            </p>

            <textarea
              id={`inspection-comments-${inspection.id}`}
              value={comments}
              onChange={(event) => {
                setComments(event.target.value);
                setSaveMessage("");
              }}
              maxLength={1000}
              rows={4}
              disabled={readOnly}
              placeholder="Enter any additional issues here…"
              className="w-full border rounded-lg p-3 disabled:bg-gray-100"
            />

            <p className="text-xs text-gray-500 mt-1">
              {comments.length} / 1,000 characters
            </p>
          </div>

      

          <h3 className="font-bold text-lg mt-5 mb-2">
            Required truck photos
          </h3>

          <p className="text-sm text-gray-600 mb-3">
            Upload all four photos before submitting the inspection.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PHOTO_ANGLES.map(([angle, label]) => (
              <InspectionPhoto
                key={`${inspection.id}-${angle}`}
                inspectionId={inspection.id}
                angle={angle}
                label={label}
                photo={inspection.photos?.find(
                  (photo) => photo.angle === angle
                )}
                onUploaded={photoUploaded}
                readOnly={readOnly}
              />
            ))}
          </div>

          {inspection.status === "Draft" ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={submitInspection}
                disabled={!canSubmit}
                className="w-full bg-red-700 text-white rounded-xl py-3 font-bold disabled:opacity-40"
              >
                {submitting ? "Submitting…" : "Submit inspection"}
              </button>

              <p className="text-xs text-gray-500 mt-2">
                Save all 21 answers and upload all four photos
                before submitting.
              </p>
            </div>
          ) : (
            <div className="mt-4 border rounded-xl p-3 bg-gray-50">
              <p className="font-bold">Inspection submitted</p>

              <p className="text-sm mt-1">
                Reported defects require Workshop clearance.
                Trip departure requires Operations authorization.
              </p>

              <button
  type="button"
  onClick={startInspection}
  disabled={starting || busy}
  className="mt-3 bg-red-700 text-white rounded-xl px-4 py-3 font-bold disabled:opacity-40"
>
  {starting ? "Starting…" : "Start new inspection"}
</button>

<p className="text-xs text-gray-500 mt-2">
  Re-evaluate your assigned truck with new answers and four new photos.
  Your previous inspection and Workshop records remain saved.
</p>
            </div>
          )}
              {inspection.status === "Draft" && (
            <div className="mt-4">
              <button
                type="button"
                onClick={saveAnswers}
                disabled={busy || !hasUnsavedChanges}
                className="w-full bg-red-700 text-white rounded-xl py-3 font-bold disabled:opacity-40"
              >
                {saving ? "Saving…" : "Save answers"}
              </button>

              {hasUnsavedChanges && (
                <p className="text-sm text-red-700 mt-2">
                  You have unsaved answers or comments.
                </p>
              )}

              {saveMessage && (
                <p
                  role="status"
                  className="text-sm text-green-700 mt-2"
                >
                  {saveMessage}
                </p>
              )}
            </div>
          )}
        </>
      )}

    </section>
  );
}