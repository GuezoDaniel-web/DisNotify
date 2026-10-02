/* ============================================================
   DisNotify — jobs/refresh-prices.js
   The heartbeat of the whole product.

   ── WHAT YOU NEED TO CODE ──────────────────────────────────
   export async function run({ tier })   // 'hot' | 'warm' | 'cold'

   1. SELECT the products for this tier, oldest last_checked first:
        hot   = on a watchlist OR has an active alert rule
        warm  = everything else
        cold  = no price change in 30 days
      LIMIT the batch (start at 200) so one run always finishes.

   2. Group the work BY RETAILER, not by product. Every retailer has
      its own rate limit; interleaving them lets you use all of them at
      once instead of queueing behind the slowest.

   3. For each retailer, pick the right adapter:
        source 'api'    -> integrations/*   (batch! 10-100 items/call)
        source 'scrape' -> scrapers/*       (one at a time, with delay)
      Skip any retailer whose circuit breaker is open, or whose API key
      is missing from .env. A missing key is a config state, not an
      error -- most SA affiliate credentials will be pending approval
      for a while, and the app must run fine without them.

   4. Hand every result to services/price-service.js -> recordOffer().
      That is the only place allowed to write prices.

   5. Wrap each product in try/catch. ONE broken listing must never
      abort the batch — log it to scrape_log and continue.

   6. Emit a summary at the end: { tier, checked, changed, failed,
      byRetailer, durationMs }.

   ── BUDGET CHECK (do this maths before you scale up) ───────
   5,000 products x 5 retailers = 25,000 checks per full pass.
   At a polite 1 request / 4s per retailer domain, one retailer can do
   ~900/hour. So a full catalogue pass takes ~5.5 hours per retailer.
   This bites harder in South Africa than it would in the US, because
   almost every source here is a scrape rather than a batched API call
   -- there is no "20 products in one request" shortcut except where an
   affiliate feed covers you. Feeds give you breadth cheaply; spend
   your scrape budget on the products people actually watch.
   That is why tiering exists: check the 200 products people actually
   watch every 15 minutes, and the long tail overnight. Do not try to
   check everything constantly — you will get blocked and it buys you
   nothing.
   ============================================================ */
throw new Error('jobs/refresh-prices.js is a scaffold.');
