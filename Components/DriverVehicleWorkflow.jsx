import { useEffect, useState } from "react";
import truckService from "../services/truckService";
import TruckInspectionPanel from "./TruckInspectionPanel";
import DriverTruckFaults from "./DriverTruckFaults";
import TruckReplacementPanel from "./TruckReplacementPanel";
import DriverTrailerSelection from "./DriverTrailerSelection";
import TruckSelection from "./TruckSelection";

export default function DriverVehicleWorkflow() {
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [faultRefreshKey, setFaultRefreshKey] = useState(0);


  const [trailerLock, setTrailerLock] = useState({
  assignmentId: null,
  locked: true
});
  const loadAssignment = async () => {
    setLoading(true);
    setError("");

    try {
      const active = await truckService.getMyActiveAssignment();
      setAssignment(active);
    } catch (err) {
      setError(err.message || "Unable to load your assignment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignment();
  }, []);

  if (loading) {
    return <p className="text-sm text-gray-500">Loading your truck…</p>;
  }

  if (error) {
    return (
      <div className="bg-white border rounded-xl p-4">
        <p role="alert" className="text-red-700 mb-3">{error}</p>
        <button
          type="button"
          onClick={loadAssignment}
          className="text-sm underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!assignment) {
    return <TruckSelection onAssigned={setAssignment} />;
  }

  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm">
      <h3 className="font-bold text-lg mb-1">
        {assignment.reg}
      </h3>

      <p className="text-sm text-gray-600">
        {assignment.make}
      </p>

      <p className="text-sm mt-3">
        This truck is assigned to you. A pre-trip inspection is required.
      </p>

<DriverTrailerSelection
  key={`trailers-${assignment.id}`}
  assignmentId={assignment.id}
  readOnly={
    trailerLock.assignmentId !== assignment.id ||
    trailerLock.locked
  }
/>

<TruckInspectionPanel
  key={assignment.id}
  assignmentId={assignment.id}
  onTrailerLockChange={setTrailerLock}
  onSubmitted={() =>
    setFaultRefreshKey((current) => current + 1)
  }
/>

<DriverTruckFaults
  key={`faults-${assignment.id}`}
  assignmentId={assignment.id}
  refreshKey={faultRefreshKey}
/>


<TruckReplacementPanel
  key={`replacement-${assignment.id}`}
  assignmentId={assignment.id}
  onReplaced={loadAssignment}
/>
    </div>
    
  );
}