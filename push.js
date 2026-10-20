// Client-side push: registers the service worker, subscribes the device,
// and stores the subscription via /api/subscribe. Exposes window hooks the
// React app calls (window.avemelEnablePush, window.avemelSendPush).
const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function registerSW() {
  if (!("serviceWorker" in navigator)) return null;
  try { return await navigator.serviceWorker.register("/sw.js"); } catch { return null; }
}

async function enablePush() {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      if (typeof Notification !== "undefined") await Notification.requestPermission();
      return { ok: false, reason: "unsupported" };
    }
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return { ok: false, reason: "denied" };
    if (!VAPID_PUBLIC) return { ok: false, reason: "no-key" };
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });
    }
    await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub),
    });
    return { ok: true };
  } catch (e) {
    console.warn("[Avemel] enablePush failed", e);
    return { ok: false, reason: "error" };
  }
}

async function sendPush(a) {
  try {
    await fetch("/api/send-push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: a.priority === "urgent" ? "\u26a0 " + a.title : a.title, body: a.body }),
    });
  } catch (e) { /* best effort */ }
}

registerSW();
window.avemelEnablePush = enablePush;
window.avemelSendPush = sendPush;
