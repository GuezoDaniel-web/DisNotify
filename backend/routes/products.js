/* ============================================================
   DisNotify — routes/products.js    /api/products/*

   ENDPOINTS:
     GET  /:id            -> full Product (all offers + per-retailer history)
     POST /:id/refresh    -> force an immediate re-check, returns
                             { ok: true, refreshedAt } (the product page
                             re-fetches straight after)

   ── WHAT YOU NEED TO CODE ──────────────────────────────────
   1.  GET /:id must return EVERY offer, not just the cheapest, sorted
       by price ascending — the comparison table renders them in order
       and marks offers[0] as BEST.
   2.  Each offer needs its own `history` array (the product page draws
       up to 4 retailer lines on one chart). Downsample to daily.
       SELECT date_trunc('day', recorded_at) d, min(price) ...
       GROUP BY d ORDER BY d
   3.  Include: lowestEver, msrp, specs, rating, reviewCount, updatedAt.
   4.  404 with { message: 'Product not found' } — the frontend shows
       that message in its empty state.
   5.  POST /:id/refresh:
        - authenticate it, and rate-limit HARD (1 per product per 5 min,
          3 per user per minute) using Redis. Without this, one user
          holding down the refresh button becomes a self-inflicted DDoS
          on Wootware or Evetech and gets your IP banned.
        - enqueue a job rather than scraping inline; wait up to ~8s for
          the result, then return whatever you have.
        - call services/price-service.js -> refreshProduct(productId).

   AFFILIATE LINKS: offer.url is what "Buy at X" opens. Wrap it in your
   affiliate tag HERE, server-side, so the tag is never editable by the
   client. Keep rel="nofollow sponsored" on the frontend (already set).
   ============================================================ */
throw new Error('routes/products.js is a scaffold.');
