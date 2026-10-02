/* ============================================================
   DisNotify — scrapers/wootware.js       (source: scrape)
   >>> START HERE. This is your first real data source. <<<

   Wootware is a focused Cape Town component retailer: a clean,
   well-structured catalogue of exactly the products your users care
   about (GPUs, CPUs, RAM, storage, PSUs, motherboards), with far less
   noise than a general marketplace.

   ── WHY IT IS THE RIGHT FIRST SCRAPER ──────────────────────
   * Narrow catalogue — you can cover their whole GPU + CPU range.
   * Component-only, so product titles are specification-rich, which
     makes services/matching.js much easier to get right.
   * No marketplace sellers muddying the "is this the same product?"
     question.

   ── WHAT YOU NEED TO CODE ──────────────────────────────────
   export class WootwareScraper extends BaseScraper {
     constructor() { super({ retailerId: 'wootware',
                             baseUrl: 'https://www.wootware.co.za',
                             rateLimitPerMin: 6, useBrowser: false }) }

     async scrapeProduct({ url, sku }) {
       1. FIRST: run scrapers/storefront-platforms.js -> detectPlatform().
          If it is a known platform, use its JSON endpoint and stop.
          Only write selectors if it is a custom build.
       2. Then try JSON-LD (@type Product -> offers.price, availability).
       3. Only then fall back to CSS selectors — and go and read the
          live page yourself to find them. Do not copy selectors from a
          tutorial; verify them against the site as it is today.
       4. Return { price, shipping, inStock, url, sku, currency: 'ZAR',
                   condition: detectCondition(title) }
     }

     async searchProduct(query)   // for adding new products
       Use their search results page, return the top 5
       { title, url, sku, price } for services/matching.js.
   }

   ── ZAR PARSING ────────────────────────────────────────────
   Prices appear as "R 14 329" or "R14 329.00" or "R 14 329,00".
   parsePrice() in parse-utils.js MUST handle:
     - the "R" prefix, with or without a space
     - SPACE as the thousands separator (SA convention)
     - COMMA as the decimal separator, sometimes
     - NON-BREAKING spaces (U+00A0) inside the number — this one
       silently breaks naive regexes; normalise whitespace first
   Get this wrong and "R 14 329" parses as 14, which sanity-checking in
   price-service.js will reject — but only if you wrote that check.

   ── VAT ────────────────────────────────────────────────────
   SA retail prices already include 15% VAT. The advertised number is
   the number paid. Never add or subtract VAT anywhere in the pipeline.
   ============================================================ */
throw new Error('scrapers/wootware.js is a scaffold.');
