import inspectionQuestions from "./inspectionQuestions";

export default function InspectionAnswer({
  inspectionId,
  answer,
  onChange,
  readOnly = false
}) {
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
      <fieldset disabled={readOnly}>
        <legend className="font-semibold mb-3">
          {question}
        </legend>

        <div className="flex items-center gap-8">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`inspection-${inspectionId}-answer-${answer.id}`}
              checked={answer.hasDefect === true}
              onChange={() => onChange(answer.id, true)}
              className="h-5 w-5 accent-red-700"
            />
            Yes
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`inspection-${inspectionId}-answer-${answer.id}`}
              checked={answer.hasDefect === false}
              onChange={() => onChange(answer.id, false)}
              className="h-5 w-5 accent-red-700"
            />
            No
          </label>
        </div>
      </fieldset>
    </div>
  );
}