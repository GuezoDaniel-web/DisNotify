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

import "dotenv/config";
import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import { connect, close } from "./db/client.js";
import { requestLogger, log } from "./utils/logger.js";
import rateLimit from "./middleware/rate-limit.js";
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
import "./services/alert-engine.js";
import jobQueue from "./jobs/queue.js";

const app=express();
const origins=(process.env.CORS_ORIGIN||"http://localhost:5173,http://127.0.0.1:5500,http://localhost:5500").split(",").map(x=>x.trim()).filter(Boolean);
app.use(helmet({crossOriginResourcePolicy:{policy:"cross-origin"}}));
app.use(compression());
app.use(cors({origin(origin,cb){if(!origin||origins.includes(origin))return cb(null,true);return cb(Object.assign(new Error("Origin not allowed by CORS"),{status:403}));},credentials:true}));
app.use(express.json({limit:"100kb"}));
app.use(rateLimit);
app.use(requestLogger);
app.get("/",(_req,res)=>res.json({name:"DisNotify API",health:"/api/health"}));
app.use("/api/health",healthRouter);
app.use("/api/auth",authRouter);
app.use("/api/deals",dealsRouter);
app.use("/api/products",productsRouter);
app.use("/api/search",searchRouter);
app.use("/api/watchlist",watchlistRouter);
app.use("/api/alerts",alertsRouter);
app.use("/api/notifications",notificationsRouter);
app.use("/api/settings",settingsRouter);
app.use((_req,res)=>res.status(404).json({message:"Route not found"}));
app.use(errorHandler);

let server;
async function start(){
 try{
  if(!process.env.JWT_SECRET||process.env.JWT_SECRET.length<32||process.env.JWT_SECRET==="change-me-to-a-long-random-string" || process.env.JWT_SECRET.startsWith("REPLACE_WITH")){
   throw new Error("Set JWT_SECRET in backend/.env to a random secret of at least 32 characters.");
  }
  await connect();
  const port=Number(process.env.PORT)||4000;
  server=app.listen(port,()=>log.info({port,origins},"DisNotify API listening"));
 }catch(e){log.fatal({err:e},"Startup failed; API will not listen");try{await close();}catch{}process.exit(1);}
}
let shuttingDown=false;
async function shutdown(signal){
 if(shuttingDown)return;shuttingDown=true;log.info({signal},"Graceful shutdown started");
 const force=setTimeout(()=>{log.error("Shutdown timed out");process.exit(1);},30000);force.unref();
 try{
  if(server)await new Promise(resolve=>server.close(resolve));
  await jobQueue.close();
  await close();
  clearTimeout(force);log.info("Shutdown complete");process.exit(0);
 }catch(e){log.error({err:e},"Shutdown failed");process.exit(1);}
}
process.on("SIGTERM",()=>shutdown("SIGTERM"));
process.on("SIGINT",()=>shutdown("SIGINT"));
if(process.env.NODE_ENV!=="test")start();
export {app};