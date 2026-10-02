/* ============================================================
   DisNotify — scrapers/parse-utils.js
   Small, boring, and the source of most of your bad data. Unit-test
   every function here with the real strings you find in the wild.

   ── FUNCTIONS TO WRITE ─────────────────────────────────────
   parsePrice(text) -> number | null
     ZAR is NOT formatted like USD. Handle all of these:
       "R 14 329,00"    -> 14329     (space thousands, comma decimal)
       "R14 329"        -> 14329
       "R14,329.00"     -> 14329     (some SA stores use US style)
       "R 3 999"        -> 3999
       "R1 299,50"      -> 1299.50
       "R 14 329,00"    -> 14329     but with U+00A0 non-breaking
                                     spaces inside — THIS ONE WILL
                                     BREAK YOUR REGEX. Normalise
                                     whitespace FIRST:
                                       s.replace(/[\s\u00A0\u202F]/g, '')
       "R529.99 - R599" -> 529.99    (range: take the low end)
       "Now R13 999 was R16 999" -> 13999   (never grab the "was")
       "Price on request"        -> null
       "Enquire" / "Sold out"    -> null

     The separator problem: after stripping "R" and whitespace you may
     have "14329,00" or "14,329.00". Decide by position — if the last
     separator is followed by exactly 2 digits it is the decimal;
     everything else is a grouping separator. Do not guess by
     character alone, because SA stores use both conventions.

     Return null, never 0, when there is no price. Zero looks like a
     real number to the alert engine and will fire "R0,00 deal!"
     notifications at everyone watching.

   parseStock(text) -> boolean
     true  : "In Stock", "In stock - Cape Town", "Available",
             "Add to Cart", "Ships in 1-2 days"
     false : "Out of Stock", "Sold Out", "Backorder", "Notify Me",
             "Coming Soon", "Pre-order", "Currently unavailable"
     AMBIGUOUS, decide once and apply everywhere:
             "3-5 working days", "Supplier stock", "On order"
             These mean the retailer does not have it — they will
             order it in. Recommended: treat as OUT of stock, and add
             a separate `leadTime` field if you want to surface it.
     Prefer a structured signal (JSON-LD availability, a disabled
     add-to-cart button) over a text match whenever one exists.

   parseJsonLd(html) -> object | null
     cheerio: script[type="application/ld+json"], JSON.parse each,
     handle @graph arrays, return the first node with @type 'Product'.
     Wrap every parse in try/catch — malformed JSON-LD is common.

   extractShipping(html) -> number
     "FREE" / "Free delivery" -> 0. Many SA stores ship free above a
     threshold (commonly around R500) and charge courier below it —
     capture the actual number shown for this item, not the policy.

   detectCondition(title, html) -> 'new' | 'grey_import' | 'refurbished'
                                 | 'open_box' | 'used'
     Look for: refurb, renewed, open box, pre-owned, used, "grade a".
     AND, specific to South Africa: "parallel import", "grey import",
     "international warranty", "no local warranty", "imported stock".
     Grey imports are genuine goods through an unofficial channel —
     cheaper, usually without local warranty or support. Ranking one
     as the best price without labelling it is how you lose a user's
     trust permanently. Treat it as its own condition, never as new.
   ============================================================ */
throw new Error('scrapers/parse-utils.js is a scaffold.');
