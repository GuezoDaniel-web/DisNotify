/* ============================================================
   DisNotify — integrations/amazon-za.js       (source: api)
   Amazon.co.za — the newest major player in SA retail.

   ── CHECK THIS FIRST ───────────────────────────────────────
   Amazon's Product Advertising API (PA-API 5.0) serves specific
   marketplaces, each with its own host and region. BEFORE writing any
   code here, confirm on Amazon's own developer documentation:
     1. Is the .co.za marketplace supported by PA-API at all?
     2. If so, what host and region string does it use?
     3. Does the SA Associates programme grant PA-API access on the
        same terms as the US one?
   Do not assume the US answers carry over. If PA-API does not cover
   .co.za, your options are the SA Associates programme's own reporting
   /link tools, or leaving Amazon out of v1 entirely.

   ── IF PA-API IS AVAILABLE ─────────────────────────────────
   1. Use the official SDK; do not hand-roll AWS SigV4 signing.
   2. GetItems, batching up to 10 ASINs per request, requesting:
        Offers.Listings.Price, Offers.Listings.Availability.Message,
        ItemInfo.Title, ItemInfo.ExternalIds, Images.Primary.Large
   3. Like the US programme, expect access to be gated behind
      qualifying sales, and expect the request quota to scale with
      those sales. Plan for low quota at the start: batch, cache, and
      poll Amazon less often than your scraped retailers.
   4. Amazon's licence terms require showing a "price as of <time>"
      alongside any price you display. Store that timestamp on the
      offer and render it — `lastChecked` already exists for this.

   ── SA-SPECIFIC GOTCHAS ────────────────────────────────────
   * Some Amazon.co.za listings are fulfilled from abroad with import
     fees and long lead times. An offer that arrives in six weeks is
     not comparable to one in a Takealot warehouse. Capture the
     delivery estimate and surface it, or exclude such listings.
   * Confirm the currency on every offer. Anything not ZAR must be
     converted with a stored, timestamped rate and flagged — or dropped.
   * Do NOT scrape amazon.co.za as a workaround. It breaches their
     Conditions of Use and they detect it reliably.
   ============================================================ */
throw new Error('integrations/amazon-za.js is a scaffold.');
