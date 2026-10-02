/* ============================================================
   DisNotify — routes/notifications.js   (AUTH REQUIRED)

   ENDPOINTS:
     GET  /                -> { items: Notification[] }  newest first, limit 50
     POST /read            -> marks all of this user's as read, 204
     POST /subscribe  body -> stores a Web Push subscription, 201
     POST /test            -> fires a test message on every enabled channel

   ── WHAT YOU NEED TO CODE ──────────────────────────────────
   1.  GET: SELECT ... WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50.
       The bell dropdown shows the first 8; alerts.html shows all.
   2.  POST /subscribe receives exactly what `PushSubscription.toJSON()`
       produces:
         { endpoint, keys: { p256dh, auth } }
       INSERT into push_subscriptions with ON CONFLICT (endpoint) DO
       UPDATE — the same browser re-subscribes after cache clears.
       Store req.headers['user-agent'] so users can identify devices.
   3.  Dead subscriptions: when web-push returns HTTP 404 or 410 the
       endpoint is gone forever — DELETE the row. If you skip this,
       your send queue fills with corpses and every alert gets slower.
       (Handle that in notifications/push.js, but the cleanup belongs
       to this table.)
   4.  POST /test: call notifications/dispatcher.js -> send(userId,
       { title: 'Test notification', body: '...' }) and return which
       channels succeeded, so Settings can show per-channel results.
   5.  Rate limit /test to 3 per hour per user.
   ============================================================ */
throw new Error('routes/notifications.js is a scaffold.');
