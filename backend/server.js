/* ============================================================
   DisNotify — server.js
   HTTP entry point. NOTHING IS IMPLEMENTED. This is your map.

   ── WHAT YOU NEED TO CODE HERE ─────────────────────────────
   1.  import 'dotenv/config' and read config from process.env.
   2.  Create the express app.
   3.  Middleware order matters — use exactly this order:
         helmet()                       // security headers
         compression()
         cors({ origin: process.env.CORS_ORIGIN.split(','), credentials: true })
         express.json({ limit: '100kb' })
         rateLimit (from middleware/rate-limit.js)
         requestLogger (from utils/logger.js)
   4.  Mount every router under /api:
         /api/health         -> routes/health.js
         /api/auth           -> routes/auth.js
         /api/deals          -> routes/deals.js
         /api/products       -> routes/products.js
         /api/search         -> routes/search.js
         /api/watchlist      -> routes/watchlist.js       (auth required)
         /api/alerts         -> routes/alerts.js          (auth required)
         /api/notifications  -> routes/notifications.js   (auth required)
         /api/settings       -> routes/settings.js        (auth required)
   5.  Mount the error handler LAST (middleware/errors.js).
   6.  Connect to Postgres + Redis BEFORE listening; exit(1) if either fails.
   7.  app.listen(process.env.PORT || 4000).
   8.  Handle SIGTERM: stop accepting connections, drain the job queue,
       close the DB pool, then exit — otherwise Docker/Railway will
       kill you mid-scrape and leave half-written rows.

   ── HOW THE FRONTEND FINDS YOU ─────────────────────────────
   frontend/js/config.js -> CONFIG.API_BASE must equal
   http://localhost:4000/api (dev). Then set CONFIG.USE_MOCK = false.
   The frontend header shows a green "LIVE" pill once
   GET /api/health returns 200.
   ============================================================ */

   import 'dotenv/config';
   import express from 'express';
   import helmet from "helmet";
   import compression from "compression";
   import cors from "cors";
   import rateLimit from "./middleware/rate-limit.js";
   import requestLogger from "./utils/logger.js";
   import errorHandler from "./middleware/errors.js";

   import healthRouter from "./routes/health.js";
   import authRouter from "./routes/auth.js";
   import dealsRouter from "./routes/deals.js";
   import productsRouter from "./routes/products.js";
   import searchRouter from "./routes/search.js";
   import watchlistRouter from "./routes/watchlist.js";
   import alertsRouter from "./routes/alerts.js";
   import notificationsRouter from "./routes/notifications.js";
   import settingsRouter from "./routes/settings.js";
   
   // Database / Redis / Queue
   import{pool} from "./db/postgres.js";
   import redis from "./db/redis.js";
   import jobQueue from "./jobs/queue.js";


   const app = express();
   app.use(helmet());
   app.use(compression());
   app.use(cors({ origin: process.env.CORS_ORIGIN.split(','), credentials: true }));
   app.use(express.json({ limit: '100kb'}));
   app.use(rateLimit);
   app.use(requestLogger);

   app.use("/api/health", healthRouter);
   app.use("/api/auth", authRouter);
   app.use("/api/deals", dealsRouter);
   app.use("/api/products", productsRouter);

   //Auth required routers
   app.use("/api/watchList", watchlistRouter);
   app.use("/api/alerts", alertsRouter);
   app.use("/api/notifications", notificationsRouter);
   app.use("/api/settings", settingsRouter);

   app.use(errorHandler);

   async function startServer() {
      try{
            await pool.query("SELECT 1");
            console.log("PostgreSQL connected");

            await redis.connect();
            console.log("redis connected");

            const server = app.listen(PORT, () => {
                  console.log(`Server running on port ${PORT}`);
            });

            const shutdown = async (signal) => {
                  console.log(`${signal} received. Starting graceful shutdown...`);

                  server.close(async () => {
                        console.log("Job queue closed");

                        try{
                              await jobQueue.close();
                              console.log("Job queue closed");

                              await pool.end();
                              console.log("PostgreSQL pool closed");

                              process.exit(0);
                        } catch (error) {
                              console.error("Error during shutdown:", error);
                              process.exit(1);
                        }
                  
                  });

            };
            process.on("SIGTERM", () => shutdown("SIGTERM"));
            process.on("SIGINT", () => shutdown("SIGINT"));
      } catch (error) {
            console.error("Failed to start server:", error);

            // Don't listen if Postgres or Redis failed
            process.exit(1);
      }
}

startServer();

// throw new Error('server.js is a scaffold — implement the steps in the header comment.');
