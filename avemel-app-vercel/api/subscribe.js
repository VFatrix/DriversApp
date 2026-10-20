// Stores a browser push subscription in Supabase.
const SUPA = process.env.SUPABASE_URL?.replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
const KEY = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method" });
  if (!SUPA || !KEY) return res.status(500).json({ error: "server not configured" });
  try {
    const sub = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (!sub || !sub.endpoint) return res.status(400).json({ error: "no subscription" });
    const r = await fetch(`${SUPA}/rest/v1/push_subscriptions?on_conflict=endpoint`, {
      method: "POST",
      headers: {
        apikey: KEY, Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json", Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({ endpoint: sub.endpoint, sub, updated_at: new Date().toISOString() }),
    });
    if (!r.ok) return res.status(500).json({ error: "store failed", detail: await r.text() });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
