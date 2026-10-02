/* ============================================================
   DisNotify — services/matching.js
   "Is Wootware's listing the same GPU as Evetech's?"

   THIS IS THE HARDEST PART OF THE WHOLE PROJECT. Price comparison is
   easy; deciding that two listings are the same product is not.
   Budget real time for it and expect to keep tuning it.

   Same card, four names:
     "GIGABYTE GeForce RTX 4070 SUPER WINDFORCE OC 12G Graphics Card"
     "Gigabyte RTX4070Super Windforce OC 12GB GDDR6X"
     "GeForce RTX 4070 SUPER 12GB WINDFORCE OC - GV-N407SWF3OC-12GD"
     "RTX 4070 Super 12G Windforce (Refurbished)"     <- NOT the same
     "RTX 4070 Super Windforce 12GB [Parallel Import]" <- NOT the same

   ── MATCHING LADDER (stop at the first hit) ────────────────
   1. EAN / UPC / GTIN barcode      -> certain. Harder to come by in
                                       SA than in the US: your best
                                       chances are Shopify `barcode`
                                       fields (scrapers/storefront-
                                       platforms.js) and affiliate
                                       feeds. Grab it every single time
                                       it appears -- it is the only
                                       matching signal that is never
                                       ambiguous.
   2. MPN (manufacturer part no.)   -> near certain within one brand.
                                       'GV-N407SWF3OC-12GD' above.
   3. ASIN / SKU cross-reference    -> retailer-specific, keep a
                                       product_identifiers table.
   4. Fuzzy title + spec match      -> last resort. Normalise, then
                                       compare with pg_trgm similarity()
                                       AND require key specs to agree
                                       (VRAM, capacity, socket, size).
                                       Accept only above ~0.82 similarity.
   5. Anything below the threshold  -> write to a `match_queue` table
                                       and review it by hand. Never
                                       guess: one bad match shows users
                                       an R13 999 price that does not exist.

   ── NORMALISATION (write this first, everything else depends on it) ─
   normalizeTitle(s):
     lowercase; strip brand noise ("graphics card", "gaming", "retail",
     "brand new"); unify '4070super' -> '4070 super'; '12g'/'12gb' -> '12gb';
     strip punctuation; collapse whitespace; sort tokens for comparison.

   ── HARD RULES ─────────────────────────────────────────────
   * NEVER match across `condition`. Refurbished, open-box, used and
     GREY IMPORTS must be separate offers or your "best price" is a
     lie. The offers table already has condition in its unique key.
   * GREY IMPORTS ARE THE SA-SPECIFIC TRAP. Parallel-imported hardware
     is genuine and materially cheaper, but usually carries no local
     warranty or support. It will consistently undercut official stock
     and therefore consistently win your comparison table. Detect it
     (see scrapers/parse-utils.js -> detectCondition) and either
     exclude it or label it loudly. A user who buys a grey-import GPU
     from your "best price" and cannot RMA it locally will never trust
     the app again.
   * NEVER match across currency. Every ZA offer should be ZAR; an
     offer in another currency is either an import listing or a
     parsing bug, and both need handling, not averaging.
   * Bundles ("GPU + game code") are different products.
   * Different VRAM, capacity, or socket = different product, no matter
     how similar the titles look.

   ── FUNCTIONS TO WRITE ─────────────────────────────────────
   normalizeTitle(title) -> string
   extractIdentifiers(rawListing) -> { ean, upc, mpn, sku }
   findProduct(rawListing) -> { productId, confidence, method } | null
   linkOrCreate(rawListing) -> productId   (creates a product when nothing matches)
   ============================================================ */
throw new Error('services/matching.js is a scaffold.');
