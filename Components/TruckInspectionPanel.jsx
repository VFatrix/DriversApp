import { useCallback, useEffect, useRef, useState } from "react";
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
  onSubmitted,
  onTrailerLockChange
}) {
  const [inspection, setInspection] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [comments, setComments] = useState("");

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [statusError, setStatusError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Invalidates status requests when starting a new inspection.
  const statusGeneration = useRef(0);

  const applyInspection = useCallback((data) => {
    setInspection(data);
    setAnswers(data?.answers ?? []);
    setComments(data?.additionalComments ?? "");
    setSaveMessage("");
  }, []);

  useEffect(() => {
    onTrailerLockChange?.({
      assignmentId,
      locked:
        loading ||
        starting ||
        Boolean(inspection) ||
        Boolean(error)
    });
  }, [
    assignmentId,
    loading,
    starting,
    inspection,
    error,
    onTrailerLockChange
  ]);

  useEffect(() => {
    let cancelled = false;
    statusGeneration.current += 1;

    const load = async () => {
      setLoading(true);
      setError("");
      setStatusError("");
      applyInspection(null);

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
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      statusGeneration.current += 1;
    };
  }, [assignmentId, applyInspection]);

  // Poll only submitted inspections, preserving unsaved draft answers.
  useEffect(() => {
    if (
      loading ||
      starting ||
      inspection?.status !== "Submitted"
    ) {
      return;
    }

    let cancelled = false;
    let timer;
    const generation = statusGeneration.current;

    const refresh = async () => {
      setRefreshing(true);

      try {
        const latest = await inspectionService.getMyLatest();

        if (
          cancelled ||
          generation !== statusGeneration.current
        ) {
          return;
        }

        if (!latest || latest.assignmentId !== assignmentId) {
          throw new Error(
            "Your truck assignment changed. Reload the page."
          );
        }

        applyInspection(latest);
        setStatusError("");
      } catch (err) {
        if (
          !cancelled &&
          generation === statusGeneration.current
        ) {
          setStatusError(
            err.message || "Unable to refresh approval status."
          );
        }
      } finally {
        if (
          !cancelled &&
          generation === statusGeneration.current
        ) {
          setRefreshing(false);
          timer = window.setTimeout(refresh, 10000);
        }
      }
    };

    refresh();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    assignmentId,
    inspection?.id,
    inspection?.status,
    loading,
    starting,
    refreshKey,
    applyInspection
  ]);

  const busy = saving || submitting || starting;
  const isDraft = inspection?.status === "Draft";
  const isSubmitted = inspection?.status === "Submitted";
  const isApproved = isSubmitted && Boolean(inspection?.approvedAt);
  const readOnly = busy || !isDraft;

  const startInspection = async () => {
    if (busy) return;

    if (
      inspection &&
      !window.confirm(
        "Start a new inspection for this truck? You will need new " +
        "answers, four new photos and a new admin approval. " +
        "Previous inspection and Workshop records remain saved."
      )
    ) {
      return;
    }

    statusGeneration.current += 1;
    setStarting(true);
    setRefreshing(false);
    setError("");
    setStatusError("");

    try {
      const created = await inspectionService.create(assignmentId);
      applyInspection(created);
    } catch (err) {
      if (err.status === 409) {
        try {
          const latest = await inspectionService.getMyLatest();

          if (
            latest &&
            latest.assignmentId === assignmentId &&
            latest.status === "Draft"
          ) {
            applyInspection(latest);
            return;
          }
        } catch {
          // Preserve the original creation error.
        }
      }

      setError(err.message || "Unable to start the inspection.");
    } finally {
      setStarting(false);
    }
  };

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

  const hasUnsavedAnswers = answers.some((answer) => {
    const saved = inspection?.answers?.find(
      (item) => item.id === answer.id
    );

    return !saved || saved.hasDefect !== answer.hasDefect;
  });

  const hasUnsavedComments =
    (comments.trim() || null) !==
    (inspection?.additionalComments?.trim() || null);

  const hasUnsavedChanges =
    hasUnsavedAnswers || hasUnsavedComments;

  const answeredCount = answers.filter(
    (answer) => typeof answer.hasDefect === "boolean"
  ).length;

  const allAnswered =
    answers.length === 21 && answeredCount === 21;

  const missingPhotos = PHOTO_ANGLES.filter(
    ([angle]) =>
      !inspection?.photos?.some((photo) => photo.angle === angle)
  );

  const canSubmit =
    isDraft &&
    allAnswered &&
    missingPhotos.length === 0 &&
    !hasUnsavedChanges &&
    !busy;

  const saveAnswers = async () => {
    if (!isDraft || busy || !hasUnsavedChanges) return;

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

      // Preserve photos that may have finished uploading during saving.
      setInspection((current) => ({
        ...updated,
        photos: current?.photos ?? updated.photos ?? []
      }));
      setAnswers(updated.answers ?? []);
      setComments(updated.additionalComments ?? "");
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
      setStatusError("");
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
          disabled={busy}
          className="bg-red-700 text-white rounded-xl px-4 py-3 font-bold disabled:opacity-40"
        >
          {starting ? "Starting…" : "Start inspection"}
        </button>
      ) : (
        <>
          {isSubmitted && (
            <div
              role="status"
              aria-live="polite"
              className={`border rounded-xl p-4 mb-4 ${
                statusError
                  ? "bg-gray-100 border-gray-300"
                  : isApproved
                  ? "bg-green-50 border-green-300"
                  : "bg-amber-50 border-amber-300"
              }`}
            >
              <p className="font-bold">
                {statusError
                  ? "Approval status could not be verified"
                  : isApproved
                  ? "Inspection approved — you may proceed to loading."
                  : "Awaiting admin approval"}
              </p>

              <p className="text-sm mt-2">
                {isApproved && !statusError
                  ? "Trip departure still requires Operations authorization after loading."
                  : "Inspection editing is locked. Workshop must clear any outstanding faults before Admin can approve loading."}
              </p>

              {statusError && (
                <p role="alert" className="text-sm text-red-700 mt-2">
                  {statusError}
                </p>
              )}

              <button
                type="button"
                onClick={() => setRefreshKey((current) => current + 1)}
                disabled={refreshing || busy}
                className="text-sm underline mt-3 disabled:opacity-40"
              >
                {refreshing ? "Checking status…" : "Refresh approval status"}
              </button>

              <p className="text-xs text-gray-600 mt-2">
                Status checks automatically every 10 seconds.
              </p>
            </div>
          )}

          <div className={!isDraft ? "opacity-60 bg-gray-50 rounded-xl p-3" : ""}>
            <p className="text-sm text-gray-600 mb-2">
              {answeredCount} of {answers.length} questions answered.
            </p>

            <p className="text-sm font-semibold mb-4">
              Yes = a defect was found. No = no defect was found.
            </p>

            {isDraft && (
              <button
                type="button"
                onClick={() => {
                  setAnswers((current) =>
                    current.map((answer) => ({
                      ...answer,
                      hasDefect: false
                    }))
                  );
                  setSaveMessage("");
                }}
                disabled={readOnly}
                className="bg-gray-700 text-white rounded-lg px-4 py-2 mb-4 disabled:opacity-40"
              >
                Testing: select all No
              </button>
            )}

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
                Describe anything you found that was not covered by
                the questions above.
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
              All four photos are required before submission.
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
          </div>

          {isDraft && (
            <div className="mt-4">
              <button
                type="button"
                onClick={submitInspection}
                disabled={!canSubmit}
                className="w-full bg-red-700 text-white rounded-xl py-3 font-bold disabled:opacity-40"
              >
                {submitting ? "Submitting…" : "Submit inspection"}
              </button>

              <div aria-live="polite" className="text-sm mt-3 space-y-1">
                {!allAnswered && (
                  <p className="text-red-700">
                    Answer all 21 questions. Currently answered: {answeredCount}.
                  </p>
                )}

                {missingPhotos.length > 0 && (
                  <p className="text-red-700">
                    Upload the missing photos:{" "}
                    {missingPhotos.map(([, label]) => label).join(", ")}.
                  </p>
                )}

                {hasUnsavedChanges && (
                  <p className="text-red-700">
                    Press Save answers below to save your answers and comments.
                  </p>
                )}

                {canSubmit && (
                  <p className="text-green-700">
                    All required answers and photos are saved. Ready to submit
                    for admin review.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={saveAnswers}
                disabled={busy || !hasUnsavedChanges}
                className="w-full mt-4 bg-red-700 text-white rounded-xl py-3 font-bold disabled:opacity-40"
              >
                {saving ? "Saving…" : "Save answers"}
              </button>

              {saveMessage && (
                <p role="status" className="text-sm text-green-700 mt-2">
                  {saveMessage}
                </p>
              )}
            </div>
          )}

          {isSubmitted && (
            <div className="mt-4 border rounded-xl p-3">
              <button
                type="button"
                onClick={startInspection}
                disabled={busy}
                className="text-sm underline disabled:opacity-40"
              >
                {starting ? "Starting…" : "Re-inspect this truck"}
              </button>

              <p className="text-xs text-gray-500 mt-2">
                A new inspection requires new answers, four new photos and
                a new admin approval. Previous records remain saved.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}