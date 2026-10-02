/* ============================================================
   DisNotify — notifications/push.js       (Web Push)
   The frontend half is DONE: frontend/sw.js already receives and
   renders these. You only have to send them.

   ── SETUP ──────────────────────────────────────────────────
   npx web-push generate-vapid-keys
     public  -> frontend/js/config.js  CONFIG.VAPID_PUBLIC_KEY
     private -> backend/.env           VAPID_PRIVATE_KEY
   Both halves must be the same key pair or every send returns 403.

   ── WHAT YOU NEED TO CODE ──────────────────────────────────
   1. webpush.setVapidDetails(VAPID_SUBJECT, PUBLIC, PRIVATE) once at
      module load.
   2. export async function send(userId, message)
        - SELECT every push_subscriptions row for the user (a person
          has phone + laptop + work machine; send to all).
        - Payload MUST match what frontend/sw.js expects:
            { title, body, url, tag, image }
          `tag` should be the product id, so a second alert for the
          same product REPLACES the first on the lock screen instead
          of stacking.
        - Keep the payload under ~4KB.
        - Promise.allSettled across subscriptions.
   3. HANDLE DEAD ENDPOINTS. On statusCode 404 or 410 the subscription
      is permanently gone: DELETE that row immediately. This is the #1
      cause of push systems slowly grinding to a halt.
      On 413 the payload is too big; on 429 back off and retry later.
   4. Push does not work on http:// (localhost excepted). Get TLS
      sorted before you debug for hours.
   5. iOS: only works for a PWA the user has ADDED TO HOME SCREEN, on
      iOS 16.4+. If your audience is iPhone-heavy, email matters more
      than push — plan accordingly.
   ============================================================ */
throw new Error('notifications/push.js is a scaffold.');
