import { useEffect, useState } from "react";
import inspectionService from "../services/inspectionService";
import inspectionQuestions from "../Components/inspectionQuestions";

export default function InspectionAnswer({
  inspectionId,
  answer,
  onSaved,
  onDirtyChange,
  readOnly = false
}) {
  const [hasDefect, setHasDefect] = useState(
    answer.hasDefect ?? null
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setHasDefect(answer.hasDefect ?? null);
  }, [answer.id, answer.hasDefect]);

  const changed =
    hasDefect !== (answer.hasDefect ?? null);

  useEffect(() => {
    onDirtyChange?.(answer.id, changed || saving);
  }, [answer.id, changed, saving, onDirtyChange]);

  const saveAnswer = async () => {
    if (
      readOnly ||
      saving ||
      !changed ||
      hasDefect === null
    ) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updated = await inspectionService.updateAnswer(
        inspectionId,
        answer.id,
        {
          hasDefect,
          notes: answer.notes ?? null
        }
      );

      onSaved(updated);
    } catch (err) {
      setError(err.message || "Unable to save this answer.");
    } finally {
      setSaving(false);
    }
  };

  const question = inspectionQuestions[answer.checkCode];

  if (!question) {
    return (
      <p role="alert" className="text-red-700 mb-3">
        Unknown inspection question: {answer.checkCode}.
        Please contact support.
      </p>
    );
  }

  return (
    <div className="border rounded-xl p-4 mb-3">
      <fieldset disabled={readOnly || saving}>
        <legend className="font-semibold mb-3">
          {question}
        </legend>

        <div className="flex items-center gap-8">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`inspection-${inspectionId}-answer-${answer.id}`}
              value="yes"
              checked={hasDefect === true}
              onChange={() => {
                setHasDefect(true);
                setError("");
              }}
              className="h-5 w-5 accent-red-700"
            />
            Yes
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`inspection-${inspectionId}-answer-${answer.id}`}
              value="no"
              checked={hasDefect === false}
              onChange={() => {
                setHasDefect(false);
                setError("");
              }}
              className="h-5 w-5 accent-red-700"
            />
            No
          </label>
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-red-700 mt-2">
          {error}
        </p>
      )}

      {!readOnly && (
        <div className="flex items-center gap-3 mt-3">
          <button
            type="button"
            onClick={saveAnswer}
            disabled={saving || !changed || hasDefect === null}
            className="bg-red-700 text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save answer"}
          </button>

          <span className="text-sm text-gray-500">
            {saving
              ? "Saving…"
              : changed
                ? "Unsaved changes"
                : hasDefect === null
                  ? "Choose Yes or No"
                  : "Saved"}
          </span>
        </div>
      )}
    </div>
  );
}