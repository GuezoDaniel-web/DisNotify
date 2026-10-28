/* ============================================================
   DisNotify — routes/health.js       GET /api/health

   ── WHAT YOU NEED TO CODE ──────────────────────────────────
   Export an express Router with one GET '/' that returns 200 and:
     { status: 'ok', db: true, redis: true, uptime, version,
       lastScrapeAt, staleOffers }
   where:
     db / redis   — result of a real ping, not a hardcoded true
     staleOffers  — SELECT count(*) FROM offers WHERE last_checked < now() - interval '6 hours'
     lastScrapeAt — SELECT max(created_at) FROM scrape_log WHERE ok

   Return 503 (not 200) if db or redis is down, so your uptime
   monitor and load balancer actually notice.

   The frontend flips its header pill from MOCK to LIVE based on
   this endpoint — keep it fast and unauthenticated.
   ============================================================ */

import { Router } from "express";
import { query, redis } from "../db/client.js";
const router = Router();
router.get("/", async (_req,res) => {
  let db = false, redisOk = false, lastScrapeAt = null, staleOffers = null;
  try {
    const r = await query(`SELECT (SELECT MAX(created_at) FROM scrape_log WHERE ok=true) AS last_scrape_at,
      (SELECT COUNT(*)::integer FROM offers WHERE last_checked < now()-interval '6 hours') AS stale_offers`);
    db = true; lastScrapeAt = r.rows[0].last_scrape_at; staleOffers = Number(r.rows[0].stale_offers);
  } catch {}
  try { redisOk = (await redis.ping()) === "PONG"; } catch {}
  const status = db && redisOk ? "ok" : "degraded";
  res.status(db && redisOk ? 200 : 503).json({
    status, db, redis:redisOk, uptime:process.uptime(),
    version:process.env.npm_package_version || "0.1.0",
    lastScrapeAt, staleOffers,
  });
});
export default router;
