/* ============================================================
   DisNotify — jobs/evaluate-alerts.js

   Alerts are normally evaluated EVENT-DRIVEN, the moment
   services/price-service.js records a change. This job is the safety
   net for the cases events miss.

   ── WHAT YOU NEED TO CODE ──────────────────────────────────
   export async function run()

   1. Sweep for rules that SHOULD have fired but did not — e.g. a rule
      created after the price already dropped below its threshold. A
      price_below rule set at $500 on an item already at $480 must fire
      immediately, not wait for the next change.
   2. Flush queued quiet-hours notifications whose window has ended.
   3. Flush hourly/daily digests: group each user's pending
      notifications into one message ("6 items you watch dropped
      today") and send via notifications/dispatcher.js.
   4. Expire stale rules: if a product has had no successful check in
      7 days, email the user that tracking is paused rather than
      leaving them waiting for an alert that can never come.
   5. Same Redis idempotency keys as the event path — this job must be
      safe to run alongside it without producing duplicates.
   ============================================================ */
throw new Error('jobs/evaluate-alerts.js is a scaffold.');
