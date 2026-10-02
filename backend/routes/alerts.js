/* ============================================================
   DisNotify — routes/alerts.js      /api/alerts   (AUTH REQUIRED)

   ENDPOINTS:
     GET    /            -> { items: AlertRule[] }
     POST   /   body     -> created rule
     PATCH  /:id body    -> updated rule   (used by the pause switch)
     DELETE /:id         -> 204

   AlertRule body sent by frontend/js/alert-modal.js:
     { productId, productName, productImage, type, threshold,
       channels: string[], retailers: string[], active }

   ── WHAT YOU NEED TO CODE ──────────────────────────────────
   1.  Validate with zod:
         type      in price_below | percent_drop | any_drop | lowest_ever | back_in_stock
         threshold required for the first two, must be NULL otherwise
         percent_drop threshold clamped 1..90
         channels  non-empty subset of push|email|discord|sms
         retailers subset of the ids in the retailers table ([] = all)
   2.  Refuse a channel the user has not configured — e.g. 'email' with
       no verified address, or 'sms' with no phone. Return 400 naming
       the channel so the UI can point at Settings.
   3.  Enforce plan limits (free = 20 active rules).
   4.  Creating a rule should also add the product to the watchlist and
       bump its scrape priority (see routes/watchlist.js step 5).
   5.  PATCH must only allow the owner's rows: `WHERE id=$1 AND user_id=$2`.
       Returning 404 (not 403) for someone else's id leaks less.
   6.  Set cooldown_min on create (default 360). This is what stops a
       product oscillating R13 999 <-> R14 001 from sending 40 pushes.
   7.  Do NOT trust productName/productImage from the client — look
       them up from the products table when rendering notifications.
       Store them only as a display cache, or not at all.
   ============================================================ */
throw new Error('routes/alerts.js is a scaffold.');
