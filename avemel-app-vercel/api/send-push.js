// Sends a web-push to every stored subscription. Called when an announcement posts.
import webpush from "web-push";

const SUPA = process.env.SUPABASE_URL?.replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
const KEY = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method" });
  if (!SUPA || !KEY || !process.env.VAPID_PRIVATE_KEY) return res.status(500).json({ error: "server not configured" });
  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:admin@avemel.com",
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const payload = JSON.stringify({ title: body.title || "Avemel", body: body.body || "" });

    const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };
    const r = await fetch(`${SUPA}/rest/v1/push_subscriptions?select=endpoint,sub`, { headers });
    const rows = await r.json();

    let sent = 0;
    await Promise.all((rows || []).map(async (row) => {
      try { await webpush.sendNotification(row.sub, payload); sent++; }
      catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) {
          await fetch(`${SUPA}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(row.endpoint)}`, { method: "DELETE", headers });
        }
      }
    }));
    return res.status(200).json({ ok: true, sent });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
