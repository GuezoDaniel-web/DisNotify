/* ============================================================
   DisNotify — notifications/email.js

   ── WHAT YOU NEED TO CODE ──────────────────────────────────
   1. Pick a provider: Resend (simplest), SendGrid, Postmark, or SMTP.
      Set RESEND_API_KEY and MAIL_FROM in .env.
   2. export async function send(userId, message)
        - fetch the user's email; refuse to send if unverified
        - render an HTML template + a plain-text fallback (some clients
          and most spam filters want both)
        - include a one-click unsubscribe link AND the
          List-Unsubscribe header — this is a legal requirement in
          several jurisdictions and a deliverability necessity
          everywhere
   3. TEMPLATE CONTENT (keep it short — it is read on a phone):
        subject: "RTX 4070 SUPER dropped to R 13 999 (-18%)"
        body:    product image, old -> new price, retailer, a big
                 "View deal" button, a small price-history sparkline
                 (render it as an <img> from a signed URL, or inline
                 SVG — most clients strip <svg>, so PNG is safer),
                 and a link to mute this alert.
   4. DELIVERABILITY — do this before your first real send:
        - verify your sending domain
        - set SPF, DKIM and DMARC records
        - never send from a free gmail address
        - warm up slowly; a burst of 5,000 first-ever emails goes
          straight to spam
   5. Digest emails: one message listing every drop, not one email per
      product. Users will unsubscribe from the latter within a day.
   ============================================================ */
throw new Error('notifications/email.js is a scaffold.');
