/* ============================================================
   DisNotify — services/alert-engine.js
   Decides who gets pinged when a price moves. This is the product.

   ── ENTRY POINT ────────────────────────────────────────────
   evaluate({ productId, retailerId, previousPrice, newPrice, inStock })
     Called for every confirmed price change emitted by
     services/price-service.js.

   ── ALGORITHM ──────────────────────────────────────────────
   1. Load active rules for this product:
        SELECT * FROM alert_rules
        WHERE product_id = $1 AND active
          AND (retailers = '{}' OR $2 = ANY(retailers))
   2. For each rule, test its condition:
        price_below    newPrice <= threshold
        percent_drop   (msrp - newPrice) / msrp * 100 >= threshold
        any_drop       newPrice < previousPrice
        lowest_ever    newPrice <= (min price ever seen) * 1.005
        back_in_stock  inStock === true AND it was false last check
   3. COOLDOWN — skip if last_triggered_at > now() - cooldown_min.
      This single check is the difference between a useful product and
      one people mute on day two.
   4. HYSTERESIS — for any_drop, require a move of at least 1% or $1,
      whichever is larger. Retailers jitter prices by cents all day.
   5. Apply the user's own filters from users.settings:
        - minDiscount: drop anything under their global threshold
        - quietHours:  if now is inside the window IN THE USER'S
          TIMEZONE, queue the notification for the end of the window
          instead of sending it
        - digest: 'instant' sends now; 'hourly'/'daily' appends to a
          pending bucket that jobs/scheduler.js flushes
   6. Write the notification row FIRST, then hand it to
      notifications/dispatcher.js. If a push provider is down, the
      in-app bell must still show it.
   7. Update last_triggered_at.
   8. IDEMPOTENCY: key each send as `alert:{ruleId}:{newPrice}` in Redis
      with a TTL of the cooldown. Two worker processes racing the same
      price change must produce ONE notification, not two.

   ── TESTING (do not skip) ──────────────────────────────────
   Write unit tests for the five condition types with a fixed clock and
   fake prices. Every bug here is a bug your users experience as spam
   or as silence, and both lose you the user.
   ============================================================ */
throw new Error('services/alert-engine.js is a scaffold.');
