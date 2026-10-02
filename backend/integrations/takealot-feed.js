/* ============================================================
   DisNotify — integrations/takealot-feed.js       (source: feed)
   Takealot is the largest online retailer in South Africa and the
   single highest-value source in this project: consoles, peripherals,
   monitors, storage, and a growing component range.

   ── HOW TO GET ACCESS ──────────────────────────────────────
   Apply to the Takealot affiliate programme (it runs through an
   affiliate network rather than being self-serve). Approval is not
   instant — APPLY BEFORE YOU WRITE ANY OTHER CODE so the clock runs
   while you build.

   Once approved you typically get some combination of:
     - a product data feed (large CSV/XML, refreshed daily), and/or
     - a deep-link/tracking-URL builder for outbound clicks.
   The exact format is whatever the network gives you. Read their docs
   and write this adapter to match — do not assume the shape.

   ── WHAT YOU NEED TO CODE ──────────────────────────────────
   1. downloadFeed()
        - GET the feed URL with your credentials, stream it to disk
          (it will be tens of MB; do not buffer it in memory)
        - gunzip if needed, then stream-parse rather than JSON.parse
          the whole thing
   2. parseFeed(stream) -> async generator of raw listings
        Stream it. A generator lets refresh-prices.js process rows as
        they arrive and keeps memory flat regardless of feed size.
   3. toOffer(row) -> the standard shape
        - price: VAT-inclusive already, do not adjust
        - currency: 'ZAR'
        - inStock: map their stock/availability field
        - url: wrap in your affiliate deep link (server-side only)
        - keep barcode/EAN if present — it is the best matching key
          you will get from any SA source, so store it religiously
   4. Filter to your categories on ingest. The full Takealot catalogue
      is groceries, books and nappies as well as GPUs; importing all of
      it wastes your database and your scrape budget.

   ── CADENCE ────────────────────────────────────────────────
   A daily feed is FINE for the long tail. For watched products and
   consoles you want faster than daily — pair the feed (catalogue,
   identifiers, images) with a light scrape of individual product pages
   for live price and stock. Feed for breadth, scrape for freshness.

   ── IF YOU ARE NOT APPROVED YET ────────────────────────────
   Leave this unimplemented. jobs/refresh-prices.js must skip any
   retailer whose credentials are missing from .env, so an unapproved
   programme degrades to "one fewer retailer" and never a crash.
   ============================================================ */
throw new Error('integrations/takealot-feed.js is a scaffold.');
