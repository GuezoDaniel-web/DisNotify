/* ============================================================
   DisNotify — scrapers/takealot.js       (source: scrape)

   ── READ THIS BEFORE BUILDING ──────────────────────────────
   Takealot has an affiliate programme with a product feed. THAT is the
   supported way to get their data — see integrations/takealot-feed.js.
   Apply for it. Use this file only for the gap the feed leaves: live
   price and stock on the specific products your users actually watch,
   at a cadence a daily feed cannot serve.

   Check their robots.txt and Terms of Service first, respect what they
   disallow, and keep the request volume genuinely small. As the largest
   SA online retailer they have both the traffic monitoring and the
   affiliate programme that makes unannounced scraping the wrong choice.

   ── WHAT YOU NEED TO CODE (if you proceed) ─────────────────
   export class TakealotScraper extends BaseScraper {
     constructor() { super({ retailerId: 'takealot',
                             baseUrl: 'https://www.takealot.com',
                             rateLimitPerMin: 4,      // deliberately low
                             useBrowser: true }) }    // heavily JS-rendered
   }

   * The site renders through JavaScript, so a plain HTML fetch will
     not contain the price. That means Playwright, which is slow and
     expensive — another reason to prefer the feed.
   * Block images, fonts and media in the browser context. Product
     photos will otherwise dominate your bandwidth bill.
   * WATCH FOR MARKETPLACE SELLERS. Many listings are third-party, not
     Takealot themselves. The seller changes the price, the warranty
     and the return policy. Capture the seller name and either exclude
     marketplace offers or store them as a distinct condition.
   * Bundle listings ("console + 2 games") are separate products.

   ── SCOPE IT TIGHTLY ───────────────────────────────────────
   Watched products only, at a slow cadence, cached hard. If your job
   queue ever wants to check thousands of Takealot pages, the design is
   wrong — that is what the feed is for.
   ============================================================ */
throw new Error('scrapers/takealot.js is a scaffold.');
