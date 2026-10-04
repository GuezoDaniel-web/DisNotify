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

const {Pool, types} = pg;

types.setTypeParser(1700, parseFloat); // NUMERIC -> float
export const pool = new Pool({
    connectString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false }
    : false,
});

export const redis = new Redis(process.env.REDIS_URL);

export async function query(text, params) {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now () - start;
        if (duration > 200) {
            console.warn(`Slow query (${duration}ms): ${text}`);
        }
        return result;
    } catch (error) {
        console.error(`Query error: ${text}`);
        throw error;
    }
}

export async function tx(fn){
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await fn(client);
        await client.query("COMMIT");
        return result;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

export async function connect() {
    await query("SELECT 1");
    await redis.ping();

    console.log("PostgreSql connected");
    console.log("Redis connected");
}

export async function close() {
    await redis.quit();
    await pool.end();

    console.log("PostgreSQL and Redis connections closed"); 
}

throw new Error('db/client.js is a scaffold — implement the steps in the header comment.');
