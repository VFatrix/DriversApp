# Avemel Driver App - Deployable Build

Flat layout (all code at the top level) so GitHub web uploads can't nest files wrong.

## Logins
- Driver - taps name, no PIN
- Operations - PIN: Avemel26
- Admin & Payroll - PIN: Avemel27
- Workshop - PIN: Avemel28
Change PINs in App.jsx (OPS_PIN / ADMIN_PIN / WORKSHOP_PIN).

## Announcements
- Post from Admin & Payroll -> Announce (title, message, urgent toggle).
- Everyone gets a bell in the top bar with an unread count.
- Unread announcements POP UP automatically and are flagged NEW; closing the
  pop-up marks them read on that device. They stay listed in the panel.

## Push notifications (background alerts)
The app is wired for real web push. To turn it on you need:

1. VAPID keys (already generated for you - see below).
2. A Supabase table (in supabase-schema.sql, table push_subscriptions).
3. Environment variables in Vercel.

### Environment variables (Vercel -> Settings -> Environment Variables)
Client (safe to expose):
  VITE_SUPABASE_URL        = https://xxxx.supabase.co   (base URL only)
  VITE_SUPABASE_ANON_KEY   = your publishable/anon key
  VITE_VAPID_PUBLIC_KEY    = (public key below)

Server (functions only - keep secret):
  SUPABASE_URL             = https://xxxx.supabase.co
  SUPABASE_SERVICE_KEY     = your Supabase SECRET / service_role key
  VAPID_PUBLIC_KEY         = (public key below)
  VAPID_PRIVATE_KEY        = (private key below)
  VAPID_SUBJECT            = mailto:admin@avemel.com

### Your generated VAPID keys
VAPID_PUBLIC_KEY:
BMeHsiuTaZGTLPvepwBs3GCpfDLkV4by0WEKzztTlZ6rled_F8cuAW4VEyRFLRE_HUX848O3de8fkojVToevXjA

VAPID_PRIVATE_KEY (secret - never put in VITE_ vars):
tR5vayHvp9zzrI1REHBr8cvgKKyDc8FouhXaZup4mxY

### How it works
- On "Turn on push alerts", the browser registers /sw.js and subscribes the
  device; the subscription is stored via /api/subscribe.
- When an announcement is posted, the app calls /api/send-push, which sends a
  web-push to every stored device via the VAPID keys.
- iPhone note: web push only works once the app is ADDED TO THE HOME SCREEN
  (Safari -> Share -> Add to Home Screen), iOS 16.4+.

## Deploy (Vercel + GitHub)
Put every file at the ROOT of the repo, including the public/ and api/ folders.
vercel.com -> sign in with GitHub -> import repo -> Deploy. Vercel auto-detects
Vite and runs the /api functions as serverless endpoints.

## Supabase
SQL Editor -> paste supabase-schema.sql -> Run (creates kv_store and
push_subscriptions). The app auto-strips a stray /rest/v1 from the URL.

## Local test
npm install && npm run dev
