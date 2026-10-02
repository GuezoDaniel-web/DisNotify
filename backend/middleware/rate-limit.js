/* ============================================================
   DisNotify — middleware/rate-limit.js

   Two different things share this name — do not confuse them:
     (a) INBOUND  — protecting your API from your users   (this file)
     (b) OUTBOUND — being polite to retailers you scrape  (scrapers/base-scraper.js)

   ── WHAT YOU NEED TO CODE ──────────────────────────────────
   1. Build limiters with express-rate-limit backed by Redis (the
      memory store breaks the moment you run 2 instances):
        globalLimiter   300 req / 15 min / IP
        authLimiter       5 req / 15 min / IP+email   (login, register)
        refreshLimiter    3 req / min / user          (POST /products/:id/refresh)
        searchLimiter    30 req / min / IP
        testLimiter       3 req / hour / user         (POST /notifications/test)
   2. Key by req.user?.id ?? req.ip. Behind a proxy you MUST set
      app.set('trust proxy', 1) or every request looks like it comes
      from the load balancer and one user can lock out everybody.
   3. Return 429 with { message: 'Too many requests, try again in Xs' }
      and a Retry-After header.
   ============================================================ */
throw new Error('middleware/rate-limit.js is a scaffold.');
