import { useEffect, useRef, useState } from "react";
import adminTripInstructionService from "../Services/adminTripInstructionService";

const EMPTY_FORM = {
  customerName: "",
  bookingNumber: "",
  bookingAt: "",
  collectionAddress: "",
  collectionContact: "",
  cargoDescription: "",
  plannedLoadingAt: "",
  loadingInstructions: "",
  deliveryAddress: "",
  deliveryContact: "",
  deliveryInstructions: ""
};

const FIELDS = [
  {
    name: "customerName",
    label: "Customer name",
    maxLength: 200,
    required: true
  },
  {
    name: "bookingNumber",
    label: "Booking number",
    maxLength: 100
  },
  {
    name: "bookingAt",
    label: "Booking date and time",
    type: "datetime-local"
  },
  {
    name: "collectionAddress",
    label: "Collection / departure address",
    maxLength: 500,
    required: true,
    multiline: true
  },
  {
    name: "collectionContact",
    label: "Collection contact name and phone",
    maxLength: 200
  },
  {
    name: "cargoDescription",
    label: "Cargo description",
    maxLength: 1000,
    multiline: true
  },
  {
    name: "plannedLoadingAt",
    label: "Planned loading date and time",
    type: "datetime-local"
  },
  {
    name: "loadingInstructions",
    label: "Loading instructions",
    maxLength: 2000,
    multiline: true
  },
  {
    name: "deliveryAddress",
    label: "Delivery / destination address",
    maxLength: 500,
    required: true,
    multiline: true
  },
  {
    name: "deliveryContact",
    label: "Delivery contact name and phone",
    maxLength: 200
  },
  {
    name: "deliveryInstructions",
    label: "Delivery instructions",
    maxLength: 2000,
    multiline: true
  }
];

function toUtc(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Enter a valid booking or loading date.");
  }

  return date.toISOString();
}

function InstructionForm({ trip, onIssued }) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);
  const sending = useRef(false);

  const submit = async (event) => {
    event.preventDefault();

    if (sending.current || blocked) return;

    if (
      !form.customerName.trim() ||
      !form.collectionAddress.trim() ||
      !form.deliveryAddress.trim()
    ) {
      setError(
        "Customer name, collection address and delivery address are required."
      );
      return;
    }

    sending.current = true;
    setSaving(true);
    setError("");

    try {
      const payload = {
        customerName: form.customerName.trim(),
        bookingNumber: form.bookingNumber.trim() || null,
        bookingAt: toUtc(form.bookingAt),
        collectionAddress: form.collectionAddress.trim(),
        collectionContact: form.collectionContact.trim() || null,
        cargoDescription: form.cargoDescription.trim() || null,
        plannedLoadingAt: toUtc(form.plannedLoadingAt),
        loadingInstructions: form.loadingInstructions.trim() || null,
        deliveryAddress: form.deliveryAddress.trim(),
        deliveryContact: form.deliveryContact.trim() || null,
        deliveryInstructions: form.deliveryInstructions.trim() || null
      };

      const updated =
        await adminTripInstructionService.issueInstructions(
          trip.id,
          payload
        );

      onIssued(updated);
    } catch (err) {
      setError(err.message || "Unable to issue trip instructions.");

      if (err.status === 404 || err.status === 409) {
        setBlocked(true);
      }
    } finally {
      sending.current = false;
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="border rounded-xl p-4">
      <h4 className="font-bold">
        {trip.registrationNumber} — Trip #{trip.id}
      </h4>

      <p className="text-sm text-gray-600 mt-1">
        Driver ID: {trip.driverId} · {trip.loadType} · {trip.direction}
      </p>

      {trip.loadType === "Empty" && (
        <p className="text-sm text-amber-800 mt-2">
          Empty trip: enter the departure and destination addresses.
          Cargo and loading details can remain blank.
        </p>
      )}

      <p className="text-xs text-gray-500 mt-2 mb-4">
        Times use this device’s local timezone. Fields marked * are required.
      </p>

      <fieldset disabled={saving || blocked} className="space-y-3">
        {FIELDS.map((field) => {
          const id = `trip-${trip.id}-${field.name}`;

          const inputProps = {
            id,
            name: field.name,
            value: form[field.name],
            required: Boolean(field.required),
            maxLength: field.maxLength,
            onChange: (event) =>
              setForm((current) => ({
                ...current,
                [field.name]: event.target.value
              })),
            className:
              "block w-full border rounded-lg p-2 mt-1 disabled:bg-gray-100"
          };

          return (
            <div key={field.name}>
              <label htmlFor={id} className="block text-sm font-semibold">
                {field.label}
                {field.required ? " *" : ""}
              </label>

              {field.multiline ? (
                <textarea {...inputProps} rows={3} />
              ) : (
                <input {...inputProps} type={field.type || "text"} />
              )}
            </div>
          );
        })}

        <p className="text-sm text-gray-600">
          Check the details before issuing. This form does not allow
          changes after instructions have been issued.
        </p>

        <button
          type="submit"
          className="bg-red-700 text-white rounded-lg px-4 py-3 font-semibold disabled:opacity-40"
        >
          {saving ? "Issuing…" : "Issue trip instructions"}
        </button>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-red-700 mt-3">
          {error}
        </p>
      )}

      {blocked && (
        <p className="text-sm text-amber-800 mt-2">
          The trip changed or is no longer available. Refresh the list
          before continuing.
        </p>
      )}
    </form>
  );
}

export default function AdminTripInstructions() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const result =
          await adminTripInstructionService.getAwaitingInstructions();

        if (!cancelled) {
          setTrips(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load trips.");
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
  }, [refreshKey]);

  const issued = (updated) => {
    setTrips((current) =>
      current.filter((trip) => trip.id !== updated.id)
    );
    setSelectedId(null);
    setMessage(
      `Instructions ${updated.instructionReference} issued for ${updated.registrationNumber}.`
    );
  };

  const selectedTrip = trips.find((trip) => trip.id === selectedId);

  return (
    <section className="bg-white border rounded-xl p-4">
      <h3 className="font-bold text-lg mb-3">Trip instructions</h3>

      {message && (
        <p role="status" className="text-green-700 mb-3">
          {message}
        </p>
      )}

      <button
        type="button"
        disabled={loading || selectedId !== null}
        onClick={() => {
          setMessage("");
          setRefreshKey((current) => current + 1);
        }}
        className="text-sm underline mb-4 disabled:opacity-40"
      >
        Refresh trips
      </button>

      {loading ? (
        <p className="text-sm text-gray-500">Loading trips…</p>
      ) : error ? (
        <p role="alert" className="text-red-700">{error}</p>
      ) : selectedTrip ? (
        <>
          <InstructionForm
            key={selectedTrip.id}
            trip={selectedTrip}
            onIssued={issued}
          />

          <p className="text-xs text-gray-500 mt-3">
            To return to the list without issuing, reload the page.
            Unsaved form entries will be lost.
          </p>
        </>
      ) : trips.length === 0 ? (
        <p className="text-sm text-gray-500">
          No eligible trips are awaiting instructions.
        </p>
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => (
            <div key={trip.id} className="border rounded-lg p-3">
              <p className="font-semibold">
                {trip.registrationNumber} — Trip #{trip.id}
              </p>

              <p className="text-sm text-gray-600 mt-1">
                Driver ID: {trip.driverId} · {trip.loadType} · {trip.direction}
              </p>

              <button
                type="button"
                onClick={() => setSelectedId(trip.id)}
                className="mt-3 bg-gray-700 text-white rounded-lg px-4 py-2"
              >
                Enter instructions
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}