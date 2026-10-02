/* ============================================================
   DisNotify — routes/health.js       GET /api/health

   ── WHAT YOU NEED TO CODE ──────────────────────────────────
   Export an express Router with one GET '/' that returns 200 and:
     { status: 'ok', db: true, redis: true, uptime, version,
       lastScrapeAt, staleOffers }
   where:
     db / redis   — result of a real ping, not a hardcoded true
     staleOffers  — SELECT count(*) FROM offers WHERE last_checked < now() - interval '6 hours'
     lastScrapeAt — SELECT max(created_at) FROM scrape_log WHERE ok

   Return 503 (not 200) if db or redis is down, so your uptime
   monitor and load balancer actually notice.

   The frontend flips its header pill from MOCK to LIVE based on
   this endpoint — keep it fast and unauthenticated.
   ============================================================ */
throw new Error('routes/health.js is a scaffold.');
