/* ============================================================
   DisNotify — routes/search.js      GET /api/search?q=

   Powers the header autocomplete (frontend/js/layout.js). It fires
   on every keystroke after a 220ms debounce, so it must be FAST.

   RETURNS: a bare array (not an object) of up to 8 Products, each
   needing only: id, name, brand, image, bestOffer{price,retailer}.

   ── WHAT YOU NEED TO CODE ──────────────────────────────────
   1.  Reject q shorter than 2 chars with an empty array.
   2.  Use the pg_trgm index created in db/schema.sql:
         WHERE search_vector % $1
         ORDER BY similarity(search_vector, $1) DESC
         LIMIT 8
       (`%` is the trigram similarity operator.) Plain ILIKE '%x%'
       cannot use an index and will crawl once you have 50k products.
   3.  Keep `products.search_vector` populated — set it to
       lower(name || ' ' || brand) on every insert/update, or add a
       trigger so you cannot forget.
   4.  Cache each query string in Redis for 5 minutes.
   5.  Rate limit: 30 req/min per IP.
   ============================================================ */
throw new Error('routes/search.js is a scaffold.');
