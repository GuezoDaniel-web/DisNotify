/* ============================================================
   DisNotify — services/price-service.js
   The write path: takes whatever a scraper or API adapter returned
   and lands it in the database correctly.

   ── FUNCTIONS TO WRITE ─────────────────────────────────────
   recordOffer({ productId, retailerId, price, shipping, inStock,
                 url, sku, currency, condition })

   Prices arriving here are ZAR and VAT-INCLUSIVE. Do not adjust them,
   do not add 15%, do not convert anything. Store what the shopper
   would actually pay.

   ── ALGORITHM ──────────────────────────────────────────────
   1. SANITY-CHECK BEFORE WRITING. A broken selector returns garbage,
      and garbage prices fire false alerts and destroy user trust.
      Reject and log to scrape_log instead of saving when:
        - price <= 0, NaN, or missing
        - price < 20% of the last known price   (parsed "$1,299" as "1")
        - price > 500% of the last known price
        - currency is not ZAR for a ZA retailer (a USD number sitting
          in a ZAR column is ~18x wrong and will fire an "amazing
          deal" alert at everyone watching)
        - the value looks like a broken ZAR parse: "R 14 329" read as
          14 or as 1432900. Sanity-check against the item's own
          history, not against a fixed range -- R14 000 is absurd for
          a mouse and normal for a GPU.
      Only accept a wild swing if TWO consecutive checks agree.
   2. Wrap in a transaction (db/client.js -> tx):
        UPSERT into offers  (ON CONFLICT (product_id, retailer_id, condition))
        INSERT into price_history ONLY IF price or in_stock changed
          since the last row. Writing an identical row every 15 minutes
          gives you a 100x bigger table and identical charts.
        Always UPDATE offers.last_checked, even when nothing changed —
        that is how you tell "stable price" from "scraper is dead".
   3. Return { changed: boolean, previousPrice, newPrice } — the
      alert engine consumes this.
   4. AFTER the transaction commits, publish an event
      (Redis pub/sub or a simple in-process emitter):
        priceChanged { productId, retailerId, previousPrice, newPrice, inStock }
      services/alert-engine.js listens for it. Do NOT evaluate alerts
      inside the transaction — a slow push provider would hold a DB
      lock open.

   refreshProduct(productId) -> re-checks every enabled retailer for one
      product, in parallel but respecting per-domain limits, and returns
      the fresh Product. Called by POST /api/products/:id/refresh.
   ============================================================ */
throw new Error('services/price-service.js is a scaffold.');
