/* ============================================================
   DisNotify — routes/auth.js        /api/auth/*

   ENDPOINTS THE FRONTEND ALREADY CALLS (frontend/js/api.js):
     POST /register  { name, email, password }  -> { user, token }
     POST /login     { email, password }        -> { user, token }
     GET  /me                                   -> user     (auth)
     POST /logout                               -> 204

   ── WHAT YOU NEED TO CODE ──────────────────────────────────
   1.  Validate the body with zod. Reject passwords under 8 chars.
       Normalise email to lowercase before touching the DB.
   2.  register: bcrypt.hash(password, +BCRYPT_ROUNDS) -> INSERT INTO
       users -> issue JWT. On duplicate email return 409 with
       { message: 'Email already registered' } — the frontend prints
       `message` verbatim in the red error line.
   3.  login: SELECT by email, bcrypt.compare. On failure return 401
       with the SAME generic message for "no such user" and "wrong
       password" — otherwise you leak which emails are registered.
   4.  Sign JWT: { sub: user.id }, expiresIn: process.env.JWT_EXPIRES_IN.
   5.  Never return password_hash. Whitelist the fields you send:
       { id, email, name, plan }.
   6.  Rate limit login to ~5 attempts / 15 min per IP+email
       (middleware/rate-limit.js) or you will be credential-stuffed.
   7.  logout: with stateless JWTs there is nothing to do server-side.
       Either return 204 and let the client drop the token, or keep a
       Redis denylist of jti values if you want real revocation.

   OPTIONAL LATER: email verification, password reset, OAuth (Google /
   Discord). Discord OAuth is a nice fit — you can then DM alerts
   instead of relying on a webhook.
   ============================================================ */
throw new Error('routes/auth.js is a scaffold.');
