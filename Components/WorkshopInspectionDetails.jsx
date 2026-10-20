import { useEffect, useState } from "react";
import workshopService from "../services/workshopService";
import InspectionPhoto from "./InspectionPhoto";

export default function WorkshopInspectionDetails({ inspectionId }) {
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      setInspection(null);

      try {
        const response = await workshopService.getInspection(
          inspectionId
        );

        if (!cancelled) {
          setInspection(response);
        }
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
  }, [inspectionId]);

  if (loading) {
    return (
      <p className="text-sm text-gray-500 mt-3">
        Loading inspection…
      </p>
    );
  }

  if (error) {
    return (
      <p role="alert" className="text-sm text-red-700 mt-3">
        {error}
      </p>
    );
  }

  if (!inspection) return null;

  return (
    <section className="mt-3 border rounded-xl p-3 bg-gray-50">
      <h4 className="font-bold mb-3">
        Inspection #{inspection.id}
      </h4>

      {inspection.answers.map((answer) => (
        <div key={answer.id} className="border-b py-2">
          <p className="text-sm font-semibold">
            {answer.checkLabel}
          </p>

          <p
            className={`text-sm ${
              answer.hasDefect ? "text-red-700" : "text-gray-600"
            }`}
          >
            {answer.hasDefect === null
              ? "Not answered"
              : answer.hasDefect
              ? "Defect reported"
              : "Passed"}
          </p>

          {answer.notes && (
            <p className="text-sm mt-1">{answer.notes}</p>
          )}
        </div>
      ))}

      <h4 className="font-bold mt-4 mb-2">Inspection photos</h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          ["front", "Front"],
          ["left", "Left side"],
          ["right", "Right side"],
          ["rear", "Rear"]
        ].map(([angle, label]) => (
          <InspectionPhoto
            key={angle}
            inspectionId={inspection.id}
            angle={angle}
            label={label}
            photo={inspection.photos.find(
              (photo) => photo.angle === angle
            )}
            readOnly
          />
        ))}
      </div>
    </section>
  );
}