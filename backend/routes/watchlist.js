/* ============================================================
   DisNotify — routes/watchlist.js   /api/watchlist   (AUTH REQUIRED)

   ENDPOINTS:
     GET    /              -> { items: Product[] }
     POST   /  {productId} -> 201
     DELETE /:productId    -> 204

   ── WHAT YOU NEED TO CODE ──────────────────────────────────
   1.  Put `requireAuth` (middleware/auth.js) on the whole router.
       Read the user id from req.user.id — NEVER from the request body.
   2.  GET: same product-assembly logic as routes/deals.js. Extract it
       into services/product-service.js -> getProducts({ ids }) and
       call it from both, or you will maintain the shape twice and
       they will drift.
   3.  POST: `INSERT ... ON CONFLICT DO NOTHING` so double-taps on the
       heart button are harmless.
   4.  Enforce the plan limit here (free = 20 products). Return 402
       with { message: 'Free plan is limited to 20 products' }.
   5.  IMPORTANT SIDE EFFECT: adding a product to any watchlist should
       raise its scrape priority. Watched products get checked every
       15-30 min; unwatched catalogue items every 6-24 h. Store that
       as a `priority` column on products or a Redis sorted set that
       jobs/refresh-prices.js drains.
   6.  DELETE: also decide whether to delete that user's alert_rules
       for the product. Recommended: keep them but mark inactive, and
       tell the user in the UI response.

   ANONYMOUS USERS: the frontend keeps a watchlist in localStorage when
   nobody is signed in. On first login, POST that local list up and
   merge it — otherwise people lose their list the moment they register.
   ============================================================ */
throw new Error('routes/watchlist.js is a scaffold.');
