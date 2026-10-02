/* ============================================================
   DisNotify — scrapers/template.js
   Copy this file to add a retailer. Checklist, in order:

   [ ] 1. Is there an API or affiliate feed? Check ../integrations/
          and docs/SCRAPING_VS_API.md first. Do not scrape by default.
   [ ] 2. Read <retailer>/robots.txt. Is the product path allowed?
   [ ] 3. Read their Terms of Service for an automated-access clause.
   [ ] 4. INSERT the retailer into the `retailers` table (db/schema.sql)
          and add it to RETAILERS in frontend/js/config.js — the UI
          reads its name and colour from there.
   [ ] 5. Open one product page with JS disabled. Does the price still
          show? Yes -> useBrowser: false (cheap). No -> Playwright.
   [ ] 6. Check for JSON-LD before writing a single CSS selector.
   [ ] 7. Set a conservative rateLimitPerMin (start at 6).
   [ ] 8. Test against 10 real products, including one out of stock,
          one on sale, and one that no longer exists (404).
   [ ] 9. Add it to jobs/refresh-prices.js.
   [ ] 10. Watch scrape_log for 24h before trusting it with alerts.

   export class TemplateScraper extends BaseScraper {
     constructor() {
       super({ retailerId: 'xxx', baseUrl: 'https://…',
               rateLimitPerMin: 6, useBrowser: false });
     }
     async scrapeProduct({ url }) {
       // return { price, shipping, inStock, url, sku, currency, condition }
       // return null (never 0, never a guess) if you cannot parse it
     }
     async searchProduct(query) { }
   }
   ============================================================ */
throw new Error('scrapers/template.js is a scaffold.');
