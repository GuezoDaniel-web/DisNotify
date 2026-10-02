/* ============================================================
   DisNotify — integrations/pricecheck.js       (source: feed/api)
   PriceCheck is South Africa's established price-comparison engine.
   Because it already aggregates many SA merchants, ONE integration
   here can be worth five scrapers.

   ── WHY IT IS WORTH APPLYING FOR ───────────────────────────
   * Breadth: merchants you would otherwise have to scrape one by one.
   * Identifiers: an aggregator has already done some of the product-
     matching work, which is the hardest part of your build.
   * Legitimacy: a partner relationship instead of unannounced traffic.

   ── BEFORE YOU BUILD ───────────────────────────────────────
   Apply as a partner/affiliate and READ WHAT THEY ACTUALLY OFFER.
   Access terms, feed formats and whether you get an API at all are
   things to confirm with them directly — do not build against an
   assumed shape. Two questions to settle up front:
     1. Are you permitted to re-display their merchant prices in your
        own product, and under what attribution?
     2. How fresh is the data? An aggregator that refreshes daily
        cannot power a 15-minute restock alert.

   ── WHAT YOU NEED TO CODE (once you know the format) ───────
   1. fetchFeed() / search(query) — whatever they expose.
   2. toOffer(row):
        - map their merchant name onto YOUR retailer id; keep an
          explicit alias table, because an aggregator's merchant
          naming will not match your `retailers` table
        - currency 'ZAR', VAT-inclusive
        - if a merchant is one you ALSO scrape directly, prefer your
          own reading (it is fresher) and use the aggregator only for
          discovery and identifiers
   3. Deduplicate hard. The fastest way to make your comparison table
      look broken is to show the same merchant twice — once from the
      aggregator, once from your own scraper.

   ── FALLBACK ───────────────────────────────────────────────
   If partner access is not available to you, this file stays a stub.
   It is a shortcut, not a dependency: the scrapers cover the same
   merchants with more work and more maintenance.
   ============================================================ */
throw new Error('integrations/pricecheck.js is a scaffold.');
