/* ============================================================
   DisNotify — notifications/dispatcher.js
   One entry point. services/alert-engine.js calls THIS, never the
   individual channel files.

   ── WHAT YOU NEED TO CODE ──────────────────────────────────
   export async function send(userId, message, { channels } = {})
     message = { title, body, url, productId, image, type }

   1. Load the user's settings. Intersect the rule's channels with the
      channels the user has actually enabled and configured.
   2. QUIET HOURS: convert now() to users.settings.timezone
      (default 'Africa/Johannesburg' — SAST is UTC+2 with no daylight
      saving, so this is simpler than most markets, but your SERVER is
      probably running UTC. 23:00 SAST is 21:00 UTC; get this wrong and
      you wake people at 01:00). If now falls inside the window,
      persist the notification with a `deliver_after` timestamp and
      return — do not send. Exception:
      let 'back_in_stock' through, since a console restock does not
      wait until morning. Make that exception configurable.
   3. DIGEST MODE: if digest !== 'instant', append to the user's
      pending bucket and return. jobs/evaluate-alerts.js flushes it.
   4. Send to each channel in PARALLEL with Promise.allSettled — one
      dead webhook must not block the push.
   5. Retry transient failures (5xx, network) twice with backoff.
      Never retry a 4xx; that is a config error, not a blip.
   6. Return { push: 'ok', email: 'ok', discord: 'failed: 404' } so
      POST /api/notifications/test can show per-channel results in
      Settings.
   7. Log every send with the notification id. When a user says "I
      never got it", this log is the only way to answer them.

   ── MESSAGE COPY ───────────────────────────────────────────
   Title: "RTX 4070 SUPER dropped to R13 999"
   Body:  "Evetech · was R16 999 · -18% · all-time low"
   Format ZAR the SA way — "R13 999", space separator, no cents on
   whole amounts. The frontend already does this in ui.js -> money();
   match it so the notification and the app agree.
   Put the number in the TITLE. Notifications are read on a lock
   screen where the body is often truncated to nothing.
   ============================================================ */
throw new Error('notifications/dispatcher.js is a scaffold.');
