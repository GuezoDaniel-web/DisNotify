/* ============================================================
   DisNotify — jobs/scheduler.js
   The worker process. Run it SEPARATELY from the API:
     npm run worker

   ── WHAT YOU NEED TO CODE ──────────────────────────────────
   1. import 'dotenv/config', connect to db + redis, then register
      node-cron schedules:

        every 15 min   refresh-prices.js  tier 'hot'
                         products on someone's watchlist or with an
                         active alert rule
        every 2 hours  refresh-prices.js  tier 'warm'
                         everything else in the catalogue
        daily 03:00    refresh-prices.js  tier 'cold'
                         products with no price change in 30 days
        hourly :00     flush hourly digests
        daily 08:00    flush daily digests (per user timezone!)
        daily 03:30    cleanup.js
        every 5 min    health check: alert YOU if any retailer's
                         scrape_log success rate < 80% in the last hour

      (Write them as real cron strings in code -- they are spelled out
       in words here because a cron expression contains the character
       sequence that would end this block comment.)

   2. LOCKING: use a Redis SET NX EX lock per job name. Two workers,
      or one worker restarted mid-run, must not double-scrape.
   3. Never let two runs of the same job overlap — if the previous run
      still holds the lock, skip this tick and log it. Queuing them up
      is how you end up with 400 concurrent requests to one retailer.
   4. Graceful shutdown on SIGTERM: stop accepting new jobs, let the
      current batch finish (cap ~30s), close connections.
   5. Log a one-line summary per run: products checked, prices changed,
      failures per retailer, duration. You will read these constantly.

   ── SCALING NOTE ───────────────────────────────────────────
   node-cron in-process is right up to a few thousand products. Past
   that, move to BullMQ (Redis-backed) so you can run several workers
   and get retries, backoff and dead-letter queues for free.
   ============================================================ */
throw new Error('jobs/scheduler.js is a scaffold.');
