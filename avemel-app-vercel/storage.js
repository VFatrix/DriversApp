const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const useSupabase = Boolean(SUPA_URL && SUPA_KEY);
const base = (SUPA_URL || "").replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
const headers = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, "Content-Type": "application/json" };
const supabase = {
  async get(key) {
    const r = await fetch(`${base}/rest/v1/kv_store?select=value&key=eq.${encodeURIComponent(key)}`, { headers });
    if (!r.ok) throw new Error("get " + r.status);
    const rows = await r.json(); if (!rows.length) throw new Error("not found");
    return { key, value: rows[0].value };
  },
  async set(key, value) {
    const r = await fetch(`${base}/rest/v1/kv_store?on_conflict=key`, { method: "POST", headers: { ...headers, Prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ key, value, updated_at: new Date().toISOString() }) });
    if (!r.ok) throw new Error("set " + r.status); return { key, value };
  },
};
const local = {
  async get(key) { const v = localStorage.getItem("avemel-kv:" + key); if (v === null) throw new Error("not found"); return { key, value: v }; },
  async set(key, value) { localStorage.setItem("avemel-kv:" + key, value); return { key, value }; },
};
const backend = useSupabase ? supabase : local;
window.storage = { get: (k) => backend.get(k), set: (k, v) => backend.set(k, v) };
if (!useSupabase) console.warn("[Avemel] Running on localStorage (single-device). Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for shared data.");
