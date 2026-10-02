/* ============================================================
   DisNotify — middleware/auth.js

   ── WHAT YOU NEED TO CODE ──────────────────────────────────
   export function requireAuth(req, res, next)
     1. Read `Authorization: Bearer <token>` (that is exactly what
        frontend/js/api.js sends).
     2. jwt.verify(token, process.env.JWT_SECRET).
     3. Attach req.user = { id: payload.sub } and call next().
     4. On a missing/invalid/expired token respond 401 with
        { message: 'Session expired' }.
        THE FRONTEND TREATS ANY 401 AS "log out and redirect to
        login.html" (see api.js request()). So never use 401 for
        "you lack permission" — use 403 for that, or you will bounce
        signed-in users to the login screen for no reason.

   export function optionalAuth(req, res, next)
     Same, but continues with req.user = null when there is no token.
     Use it on /deals and /products so anonymous visitors can browse.

   LATER: if you add refresh tokens, put the access token in memory and
   the refresh token in an httpOnly, SameSite=Lax cookie. localStorage
   (what the frontend does today) is fine for v1 but is readable by any
   XSS on your domain.
   ============================================================ */
throw new Error('middleware/auth.js is a scaffold.');
