/* ============================================================
   DisNotify — routes/deals.js       GET /api/deals

   This is THE most important endpoint — it paints the home page.

   QUERY PARAMS the frontend sends (see frontend/js/deals.js):
     q            free-text search
     category     'gpu' | 'cpu' | ... | 'all'
     retailers    comma-separated ids, e.g. 'newegg,amazon'
     minDiscount  integer percent
     maxPrice     number
     inStockOnly  'true' | 'false'
     sort         discount | price_asc | price_desc | newest | name
     page         1-based
     pageSize     default 24

   MUST RETURN exactly:
     { items: Product[], total: number, page: number, pageSize: number }
   Product shape is documented in docs/API_CONTRACT.md and mirrored
   by frontend/js/mock-data.js — match it field for field.

   ── WHAT YOU NEED TO CODE ──────────────────────────────────
   1.  Parse + validate params with zod, clamping pageSize to <= 100.
       Never string-concatenate params into SQL — parameterise.
   2.  One query, not N+1. Join products -> offers, pick the cheapest
       in-stock offer per product with DISTINCT ON:
         SELECT DISTINCT ON (o.product_id) ...
         FROM offers o ... ORDER BY o.product_id, o.in_stock DESC, o.price ASC
       Then join that back to products.
   3.  discountPercent = round((msrp - best.price) / msrp * 100).
       Compute it in SQL so you can sort and filter on it.
   4.  priceHistory: return a DOWNSAMPLED series (~90 points max) for
       the best offer. Sending 90 days of hourly rows per card will
       make the payload megabytes. Use date_trunc('day', recorded_at)
       with min(price).
   5.  isLowestEver = best.price <= (SELECT min(price) FROM price_history
       WHERE product_id = p.id) * 1.005
   6.  Cache the whole response in Redis for 60s keyed on the full
       query string. This endpoint will be 90% of your traffic.
   7.  Set `Cache-Control: public, max-age=60`.

   PERFORMANCE TARGET: under 150ms warm. If you exceed that, add a
   materialised view `product_best_offer` refreshed by jobs/scheduler.js.
   ============================================================ */
throw new Error('routes/deals.js is a scaffold.');
