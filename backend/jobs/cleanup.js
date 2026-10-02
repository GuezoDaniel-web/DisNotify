/* ============================================================
   DisNotify — jobs/cleanup.js       (nightly)

   ── WHAT YOU NEED TO CODE ──────────────────────────────────
   1. Roll up price_history older than 90 days into one row per
      product/retailer/day (keep min, max, close). Do it in batches
      inside a transaction; a single unbounded DELETE on a 50M-row
      table will lock your database for minutes.
   2. Delete scrape_log rows older than 14 days.
   3. Delete notifications older than 90 days.
   4. Delete push_subscriptions that have returned 404/410
      (notifications/push.js marks them).
   5. Mark products with no successful offer check in 30 days as
      `stale` so the UI can hide them instead of showing an ancient
      price as if it were live. A wrong price is worse than no price.
   6. VACUUM ANALYZE the big tables.
   7. Log what you deleted. Silent data loss is how you discover, six
      months later, that a bug ate everyone's history.
   ============================================================ */
throw new Error('jobs/cleanup.js is a scaffold.');
