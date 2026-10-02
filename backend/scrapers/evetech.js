/* ============================================================
   DisNotify — scrapers/evetech.js       (source: scrape)
   Evetech is one of the larger SA component and prebuilt retailers,
   with wide GPU/CPU/monitor coverage. Build this second, after
   wootware.js, so you have two independent readings on the same parts
   and can actually test price comparison.

   ── WHAT YOU NEED TO CODE ──────────────────────────────────
   export class EvetechScraper extends BaseScraper {
     constructor() { super({ retailerId: 'evetech',
                             baseUrl: 'https://www.evetech.co.za',
                             rateLimitPerMin: 6, useBrowser: false }) }
     async scrapeProduct({ url, sku }) { ... }
     async searchProduct(query) { ... }
   }

   Same ladder as every scraper in this folder:
     1. storefront-platforms.js -> platform JSON if available
     2. JSON-LD
     3. CSS selectors, verified by you against the live page today

   ── THINGS TO WATCH ON SA COMPONENT SITES ──────────────────
   * "Price on request" / "Enquire" — some high-value items have no
     listed price. Return null, never 0.
   * Bundles and "build your own PC" configurators are NOT the same
     product as the bare component. Detect and skip them.
   * Stock wording varies a lot: "In Stock", "In stock - Pretoria",
     "3-5 working days", "Pre-order", "Backorder". Only the first two
     are genuinely in stock. "3-5 working days" means supplier stock —
     decide explicitly how you treat it and be consistent, because it
     changes what "in stock" means to your users.
   * Some SA retailers show a lower price for EFT than for card. If
     both appear, store the one a normal buyer pays and note the other.

   ── GREY IMPORTS ───────────────────────────────────────────
   Parallel/grey imports are common in SA: genuine hardware, imported
   outside the official channel, cheaper, often without local warranty
   or support. It is NOT the same offer as an official-channel one.
   Look for wording like "international warranty", "no local warranty",
   "imported", "parallel import", and set condition accordingly (see
   services/matching.js). Showing a grey import as the best price
   without saying so is exactly the kind of thing that loses trust.
   ============================================================ */
throw new Error('scrapers/evetech.js is a scaffold.');
