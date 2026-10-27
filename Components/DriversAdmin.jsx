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
const [driverFilter, setDriverFilter] = useState("active");
const [restoringId, setRestoringId] = useState(null);
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
 if (archivingId !== null || restoringId !== null) return;

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

const visibleDrivers = drivers.filter((driver) => {
  if (driverFilter === "active") return driver.isActive;
  if (driverFilter === "archived") return !driver.isActive;
  return true;
});
                
              const restoreDriver = async (driver) => {
  if (restoringId !== null || archivingId !== null) return;

  setRestoringId(driver.id);
  setError("");
  setMessage("");

  try {
    await userService.restoreDriver(driver.id);

    setDrivers((current) =>
      current.map((item) =>
        item.id === driver.id
          ? { ...item, isActive: true }
          : item
      )
    );

    setMessage(`Driver ${driver.username} restored successfully.`);
  } catch (err) {
    setError(err.message || "Unable to restore the driver.");
  } finally {
    setRestoringId(null);
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
        className="block w-full border rounded-lg p-2 mt-1 bg-white text-gray-900"
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
        className="block w-full border rounded-lg p-2 mt-1 bg-white text-gray-900"
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
        className="block w-full border rounded-lg p-2 mt-1 bg-white text-gray-900"
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
      className="bg-red-700 text-white rounded-lg px-4 py-2 disabled:opacity-70"
    >
      {creating ? "Saving…" : "Add driver"}
    </button>
  </fieldset>
</form>

      <label className="block text-sm mb-3 text-gray-900">
  Show drivers
  <select
    value={driverFilter}
    onChange={(event) => setDriverFilter(event.target.value)}
    className="block w-full border rounded-lg p-2 mt-1 bg-white text-gray-900"
  >
    <option value="active">Active drivers</option>
    <option value="archived">Archived drivers</option>
    <option value="all">All drivers</option>
  </select>
</label>

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
         {visibleDrivers.length === 0 && !error && (
  <p>No drivers found for this filter.</p>
)}

   {visibleDrivers.map((driver) => (
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
    disabled={archivingId !== null || restoringId !== null}
    className="mt-2 bg-red-700 text-white rounded-lg px-4 py-2 disabled:opacity-40"
    >
    {archivingId === driver.id ? "Archiving…" : "Archive driver"}
    </button>
  )}

  {!driver.isActive && (
  <button
    type="button"
    onClick={() => restoreDriver(driver)}
    disabled={restoringId !== null || archivingId !== null}
    className="mt-2 bg-green-700 text-white rounded-lg px-4 py-2 disabled:opacity-40"
  >
    {restoringId === driver.id ? "Restoring…" : "Restore driver"}
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
      className="block w-full border rounded-lg p-2 mt-1 bg-white text-gray-900"
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