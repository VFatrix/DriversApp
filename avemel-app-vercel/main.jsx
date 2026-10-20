import "./storage.js";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./push.js";
window.authStore = {
  get: () => { try { return localStorage.getItem("avemel-session"); } catch { return null; } },
  set: (v) => { try { localStorage.setItem("avemel-session", v); } catch {} },
};
window.notifStore = {
  get: () => { try { return localStorage.getItem("avemel-seen"); } catch { return null; } },
  set: (v) => { try { localStorage.setItem("avemel-seen", v); } catch {} },
};
createRoot(document.getElementById("root")).render(<App />);
