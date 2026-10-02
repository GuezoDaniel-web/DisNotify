/* ============================================================
   DisNotify — scrapers/proxy.js

   ── DO YOU ACTUALLY NEED THIS? ─────────────────────────────
   Probably not at first. A single well-behaved IP making one polite
   request every few seconds is rarely blocked. Reach for proxies only
   after you see sustained 403s from a retailer you are allowed to
   scrape — and if a retailer is blocking you deliberately, rotating
   IPs to evade them is a decision to make consciously, not by default.
   Prefer their affiliate feed or their API instead.

   ── WHAT TO CODE IF YOU DO ─────────────────────────────────
   export function proxyAgent()
     Return an undici ProxyAgent built from process.env.PROXY_URL,
     or null when the var is empty. Cache the instance — building one
     per request leaks sockets.

   export async function checkProxy()
     Hit https://api.ipify.org through the agent at boot and log the
     egress IP, so you can prove which IP a retailer is seeing.

   Notes:
   - Datacenter proxies are cheap and blocked everywhere. Residential
     ones work and cost per GB — block images in Playwright or your
     bill will be dominated by product photos.
   - Never route your own API traffic through it. Scraping only.
   ============================================================ */
throw new Error('scrapers/proxy.js is a scaffold.');
