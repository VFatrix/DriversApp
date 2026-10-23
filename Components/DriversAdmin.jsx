import { useEffect, useState } from "react";
import userService from "../Services/userService";

export default function DriversAdmin() {
const [drivers, setDrivers] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [resetPasswords, setResetPasswords] = useState({});
const [resettingId, setResettingId] = useState(null);
const [fullName, setFullName] = useState("");
const [username, setUsername] = useState("");
const [password, setPassword] = useState("");
const [creating, setCreating] = useState(false);
const [archivingId, setArchivingId] = useState(null);
const [message, setMessage] = useState("");

  const loadDrivers = async () => {
    setLoading(true);
    setError("");

    try {
      const users = await userService.getAll();
      setDrivers(users.filter((user) => user.role === "Driver"));
    } catch (err) {
      setError(err.message || "Unable to load drivers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

const addDriver = async (event) => {
  event.preventDefault();
  if (creating) return;

  setCreating(true);
  setError("");
  setMessage("");

  try {
    const created = await userService.createDriver(
      fullName,
      username,
      password
    );

    setDrivers((current) =>
      [...current, created].sort((a, b) =>
        a.fullName.localeCompare(b.fullName)
      )
    );

    setFullName("");
    setUsername("");
    setPassword("");
    setMessage("Driver saved successfully.");
  } catch (err) {
    setError(err.message || "Unable to add the driver.");
  } finally {
    setCreating(false);
  }
};

const resetPassword = async (event, driver) => {
  event.preventDefault();

  if (resettingId !== null) return;

  const newPassword = resetPasswords[driver.id] || "";

  if (!newPassword.trim() || newPassword.length < 12) {
    setError("Enter a password of at least 12 characters.");
    return;
  }

  setResettingId(driver.id);
  setError("");
  setMessage("");

  try {
    await userService.resetPassword(driver.id, newPassword);

    setResetPasswords((current) => ({
      ...current,
      [driver.id]: ""
    }));

    setMessage(`Password updated for ${driver.username}.`);
  } catch (err) {
    setError(err.message || "Unable to reset the password.");
  } finally {
    setResettingId(null);
  }
};


const archiveDriver = async (driver) => {
  if (archivingId !== null) return;

  const confirmed = window.confirm(
    `Archive ${driver.fullName} (${driver.username})? They will no longer be able to log in.`
  );

  if (!confirmed) return;

  setArchivingId(driver.id);
  setError("");
  setMessage("");

  try {
    await userService.archiveDriver(driver.id);

    setDrivers((current) =>
      current.map((item) =>
        item.id === driver.id
          ? { ...item, isActive: false }
          : item
      )
    );

    setMessage(`Driver ${driver.username} archived successfully.`);
  } catch (err) {
    setError(err.message || "Unable to archive the driver.");
  } finally {
    setArchivingId(null);
  }
};

  return (
    <section className="bg-white border rounded-xl p-4">
      <h3 className="font-bold text-lg mb-3">Drivers</h3>

      <form onSubmit={addDriver} className="border rounded-xl p-4 mb-4">
  <h4 className="font-semibold mb-3">Add driver</h4>

  <fieldset disabled={creating} className="space-y-3">
    <label className="block text-sm">
      Full name
      <input
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
        required
        maxLength={150}
        className="block w-full border rounded-lg p-2 mt-1"
      />
    </label>

    <label className="block text-sm">
      Username
      <input
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        required
        maxLength={100}
        pattern="[a-zA-Z0-9._\-]+"
        title="Use letters, numbers, dots, underscores or hyphens."
        autoComplete="off"
        className="block w-full border rounded-lg p-2 mt-1"
      />
    </label>

    <label className="block text-sm">
      Password
      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        minLength={12}
        maxLength={256}
        autoComplete="new-password"
        className="block w-full border rounded-lg p-2 mt-1"
      />
    </label>

    <p className="text-xs text-gray-500">
      Password must contain at least 12 characters.
    </p>

    <button
      type="submit"
      disabled={
        creating ||
        !fullName.trim() ||
        !username.trim() ||
        !password.trim()
      }
      className="bg-red-700 text-white rounded-lg px-4 py-2 disabled:opacity-40"
    >
      {creating ? "Saving…" : "Add driver"}
    </button>
  </fieldset>
</form>

{message && (
  <p role="status" className="text-green-700 mb-3">
    {message}
  </p>
)}

      {error && (
        <p role="alert" className="text-red-700 mb-3">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={loadDrivers}
        disabled={loading}
        className="text-sm underline mb-3 disabled:opacity-40"
      >
        Refresh drivers
      </button>

      {loading ? (
        <p>Loading drivers…</p>
      ) : (
        <div className="space-y-2">
          {drivers.length === 0 && !error && (
            <p>No drivers found.</p>
          )}

          {drivers.map((driver) => (
            <div key={driver.id} className="border rounded-lg p-3">
              <p className="font-semibold">{driver.fullName}</p>
              <p className="text-sm text-gray-600">
                Username: {driver.username}
              </p>
              <p className="text-sm">
  {driver.isActive ? "Active" : "Archived"}
</p>

{driver.isActive && (
  <button
    type="button"
    onClick={() => archiveDriver(driver)}
    disabled={archivingId !== null}
    className="mt-2 bg-red-700 text-white rounded-lg px-4 py-2 disabled:opacity-40"
  >
    {archivingId === driver.id ? "Archiving…" : "Archive driver"}
  </button>
)}
              <form
  onSubmit={(event) => resetPassword(event, driver)}
  className="mt-3"
>
  <label className="block text-sm">
    New password
    <input
      type="password"
      value={resetPasswords[driver.id] || ""}
      onChange={(event) =>
        setResetPasswords((current) => ({
          ...current,
          [driver.id]: event.target.value
        }))
      }
      required
      minLength={12}
      maxLength={256}
      autoComplete="new-password"
      disabled={resettingId !== null}
      className="block w-full border rounded-lg p-2 mt-1"
    />
  </label>

  <button
    type="submit"
    disabled={
      resettingId !== null ||
      !(resetPasswords[driver.id] || "").trim()
    }
    className="mt-2 bg-gray-700 text-white rounded-lg px-4 py-2 disabled:opacity-40"
  >
    {resettingId === driver.id
      ? "Updating…"
      : "Reset password"}
  </button>
</form>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}