/* ============================================================
   DisNotify — db/client.js
   Postgres + Redis connection singletons.

   ── WHAT YOU NEED TO CODE HERE ─────────────────────────────
   1.  export const pool = new pg.Pool({
         connectionString: process.env.DATABASE_URL,
         max: 10, idleTimeoutMillis: 30_000,
         ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
       })
   2.  export async function query(text, params) — thin wrapper that
       logs slow queries (>200ms) and re-throws with the SQL attached.
       Every other file should import THIS, never `pool` directly.
   3.  export async function tx(fn) — BEGIN / fn(client) / COMMIT,
       ROLLBACK on throw. Needed by services/price-service.js so an
       offer update and its price_history insert land atomically.
   4.  export const redis = new Redis(process.env.REDIS_URL)
       Used for: response caching, per-domain scrape rate limits,
       and de-duplicating alert firing across worker restarts.
   5.  export async function connect() — ping both, throw if either
       is unreachable. server.js awaits this before listen().
   6.  export async function close() — for graceful shutdown.

   GOTCHA: node-postgres returns NUMERIC as a *string* to avoid float
   loss. Either parse it (`pg.types.setTypeParser(1700, parseFloat)`)
   or the frontend will render "R 13 999" as "R NaN". Do it here, once.
   ============================================================ */

import pg from "pg";
import Redis from "ioredis";
import { log } from "../utils/logger.js";

const {Pool, types} = pg;

types.setTypeParser(1700, parseFloat); // NUMERIC -> float

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
if (!process.env.REDIS_URL) throw new Error("REDIS_URL is required.");

export const pool = new Pool({
    connectString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false }
    : false,
});
pool.on("error", (error) => log.error({ err: error }, "Unexpected PostgreSQL pool error"));

export const redis = new Redis(process.env.REDIS_URL,{
lazyConnect: true,
maxRetriesPerRequest: 2,
enableReadyCheck: true,
});
redis.on("error", (error) => log.error({ err:error }, "Redis error"));

export async function query(text, params) {
    const start = Date.now();
    try {
      return await pool.query(text, params);
    }catch (error) {
        error.sql = text; 
        log.error({ err:error, durationMs: Date.now() - start }, "Database query failed");
        throw error;
    } finally {
        const durationMs = Date.now() - start;
        if (durationMs > 200) log.warn({ durationMs, sql: text.slice(0, 500) }, "Slow SQL query");
    }
}

export async function tx(fn){
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const value = await fn(client);
        await client.query("COMMIT");
        return value;
    } catch (error) {
        try { await client.query("ROLLBACK"); } catch (rollbackError) {
            log.error({ err: rollbackError }, "Transaction rollback failed");
        }
        throw error;
    } finally {
        client.release();
    }
}

export async function connect() {
    await pool.query("SELECT 1");
    if (redis.status === "wait") await redis.connect();
    await redis.ping();
    log.info("PostgreSQL and Redis connected");
}

export async function close() {
    await Promise.allSettled([
        redis.status === "end" ? Promise.resolve() : redis.quit(),
        pool.end(),
    ])

    log.info("PostgreSQL and Redis connections closed"); 
}

