/* ============================================================
   DisNotify — routes/settings.js    /api/settings  (AUTH REQUIRED)

   ENDPOINTS:
     GET /   -> the settings object
     PUT /   -> replaces it, returns the saved object

   SHAPE — must match DEFAULT_SETTINGS in frontend/js/store.js:
     { channels: {push,email,discord,sms},
       email, discordWebhook, phone,
       quietHours: { enabled, from, to },
       minDiscount, region, currency, retailers[], digest }

   ── WHAT YOU NEED TO CODE ──────────────────────────────────
   1.  Store it as JSONB on users.settings. Merge server-side rather
       than blind-overwriting, so an older client cannot wipe fields
       it does not know about.
   2.  Validate with zod. In particular:
        - discordWebhook must match ^https://discord(app)?\.com/api/webhooks/
          Anything else is either a typo or someone using you as an
          open HTTP proxy.
        - phone: E.164 only.
        - quietHours from/to: 'HH:MM' 24-hour.
        - minDiscount 0..90, region/currency from an allowlist
          (currently ZA / ZAR only).
        - phone: E.164, and for SA expect +27 followed by 9 digits.
   3.  Changing `email` must NOT immediately start sending there —
       flag it unverified, send a confirmation link, and only enable
       the email channel after it is clicked.
   4.  quietHours is enforced at SEND time, not save time — see
       notifications/dispatcher.js. Store the user's IANA timezone too
       ('America/Chicago'), or 23:00-07:00 means nothing on a server
       running in UTC. Add a `timezone` field; the frontend can send
       Intl.DateTimeFormat().resolvedOptions().timeZone.
   ============================================================ */
throw new Error('routes/settings.js is a scaffold.');
