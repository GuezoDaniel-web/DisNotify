/* ============================================================
   DisNotify — services/product-service.js
   Assembles the Product JSON the frontend expects. Routes should
   contain NO SQL for products — it all lives here so /deals,
   /products/:id and /watchlist can never drift apart.

   ── FUNCTIONS TO WRITE ─────────────────────────────────────
   listProducts(filter)  -> { items, total }
       filter: { q, category, retailers[], minDiscount, maxPrice,
                 inStockOnly, sort, page, pageSize, ids[] }
   getProduct(id)        -> full Product with every offer + per-offer history
   toProductDTO(row)     -> the ONE place that maps DB rows to the
                            exact JSON in docs/API_CONTRACT.md

   ── RULES ──────────────────────────────────────────────────
   1. bestOffer = cheapest IN-STOCK offer. Only if nothing is in stock
      do you fall back to the cheapest out-of-stock one — and then set
      inStock:false so the card shows "Out of stock" instead of a
      price nobody can actually pay.
   2. Compare on price + shipping, not price alone. An R13 999 GPU
      with R150 courier loses to an R14 099 one with free delivery.
      The UI already shows a Total column; make bestOffer agree with
      it. Many SA stores ship free above a threshold, so this flips
      the winner more often here than you would expect.
   3. discountPercent is against msrp. If msrp is NULL, use the 90-day
      median instead and mark it, otherwise every new product shows a
      fake -100%.
   4. Downsample history to <= 90 points before it leaves this file.
   5. Return numbers as numbers. See the NUMERIC parser note in
      db/client.js.
   ============================================================ */
throw new Error('services/product-service.js is a scaffold.');
