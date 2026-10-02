/* ============================================================
   DisNotify — scrapers/base-scraper.js
   The shared machinery. Individual scrapers should contain almost
   nothing but selectors.

   ── WHAT YOU NEED TO CODE ──────────────────────────────────
   export class BaseScraper {
     constructor({ retailerId, baseUrl, rateLimitPerMin, useBrowser })

     async fetchHtml(url)
       1. Check Redis for a cached body first (TTL ~10 min).
       2. Wait for a token from the per-domain limiter — use p-queue
          with concurrency 1 and an interval derived from
          rateLimitPerMin. The limiter must be shared across every
          worker process, so keep the token bucket in Redis.
       3. Add jitter: sleep SCRAPE_DELAY_MS +/- 40%. Perfectly regular
          intervals are the easiest bot signature there is.
       4. undici.request with:
            'User-Agent': process.env.SCRAPE_USER_AGENT
            'Accept-Language': 'en-US,en;q=0.9'
          plus the proxy agent from proxy.js when PROXY_URL is set.
       5. Retry 2x with exponential backoff on 429/5xx/network errors.
          On 403/404 do NOT retry — you are blocked or it is gone.
       6. Write one scrape_log row per attempt, always.

     async fetchRendered(url)   // only when useBrowser
       Playwright, ONE shared browser instance for the whole process
       (launching Chromium per request costs ~1s and 300MB).
       - block images/fonts/media via route interception; you only
         need the DOM, and it cuts bandwidth ~80%
       - page.waitForSelector on the price element, with a timeout
       - always close the CONTEXT, reuse the browser
       - hard cap: 20s per page, then abort

     async scrapeProduct(productRef) -> {
         price, shipping, inStock, url, sku, currency, condition
       }
       ABSTRACT — each retailer implements it.

     shouldSkip()   true when the circuit breaker is open (see below)
   }

   ── CIRCUIT BREAKER (do not skip this) ─────────────────────
   Track consecutive failures per retailer in Redis. After 5 in a row,
   stop scraping that retailer for 30 minutes and write to
   retailers.last_error. Without it, a retailer that starts returning
   403 will have you hammering them thousands of times an hour — which
   turns a temporary block into a permanent one.

   ── PARSING ORDER OF PREFERENCE ────────────────────────────
   1. JSON-LD  <script type="application/ld+json"> with @type Product
      -> offers.price, offers.availability. Structured, stable, and
      the retailer maintains it for Google. ALWAYS TRY THIS FIRST.
   2. Other embedded JSON (__NEXT_DATA__, window.__INITIAL_STATE__).
   3. Meta tags (og:price:amount, product:price:amount).
   4. CSS selectors on visible text — the most brittle. Last resort.
   ============================================================ */
throw new Error('scrapers/base-scraper.js is a scaffold.');
