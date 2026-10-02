/* ============================================================
   DisNotify — notifications/sms.js       (optional, costs money)

   ── BEFORE YOU BUILD THIS ──────────────────────────────────
   SMS to SA numbers is priced per message and is not cheap at volume.
   One user with 20 alerts on a busy Black Friday can generate
   hundreds. Work out the per-message cost with your provider BEFORE
   you build this — it is a paid-plan feature, not a free one.

   Worth knowing for this market: SMS still has far better reach in
   South Africa than push does, because it works on any handset with no
   app installed and no data. If your audience is not all on modern
   smartphones, SMS may matter more here than it would elsewhere. That
   is an argument for building it — carefully and gated — not for
   skipping it.

   ── WHAT YOU NEED TO CODE ──────────────────────────────────
   1. Pick a provider. South African options (Clickatell, BulkSMS,
      SMSPortal, Panacea Mobile) are usually cheaper for local delivery
      than routing through Twilio, and they handle local number
      formats and sender IDs properly. Set SMS_PROVIDER / SMS_API_KEY /
      SMS_FROM in .env and keep this file provider-agnostic behind one
      send() function, so switching costs you an afternoon.
   2. export async function send(userId, message)
        - E.164 only. SA numbers: +27 followed by 9 digits, dropping
          the leading 0. "082 123 4567" becomes "+27821234567".
          Normalise on save AND on send; users will type it every way
          imaginable.
        - hard cap at 160 characters; SMS splits and bills per segment:
            "RTX 4070S R13999 (-18%) at Evetech dsnfy.co.za/a1b2"
        - use a URL shortener you control, so links do not eat the
          character budget
   3. GATE IT HARD:
        - only for alerts above a user-set value threshold
        - a per-user daily cap (5/day) that you enforce, not trust
        - only on paid plans
   4. COMPLIANCE — not optional:
        - explicit opt-in, recorded with a timestamp
        - verify the number with a code before the first send
        - honour STOP/UNSUBSCRIBE replies automatically (Twilio does
          this for you, but you must stop your own sends too)
        - South Africa: POPIA governs this. You need consent for
          direct electronic marketing, records proving it, and an
          easy opt-out. Alerts a user explicitly asked for are not
          the same as marketing, but keep the consent trail anyway.
        - Check your provider's rules on sender IDs and on messaging
          outside reasonable hours; quiet hours matter more for SMS
          than for any other channel, because it wakes people up.
   5. Never put anything sensitive in an SMS. Assume it is public.
   ============================================================ */
throw new Error('notifications/sms.js is a scaffold.');
