/* ============================================================
   DisNotify — middleware/errors.js

   ── WHAT YOU NEED TO CODE ──────────────────────────────────
   1. export class ApiError extends Error { constructor(status, message, code) }
      Throw `new ApiError(404, 'Product not found')` from anywhere.
   2. export function notFound(req, res) — 404 JSON for unmatched routes.
   3. export function errorHandler(err, req, res, next)  <-- 4 args, or
      express will not recognise it as an error handler.
        - ZodError            -> 400 with the first issue's message
        - ApiError            -> err.status
        - pg error 23505      -> 409 'Already exists'
        - anything else       -> 500 'Something went wrong'
        - log the full stack with pino; NEVER send a stack to the client
   4. Every response body must contain a `message` string — the whole
      frontend surfaces `err.message` in toasts and inline errors.
   5. Mount errorHandler LAST in server.js, after all routers.
   ============================================================ */
import { log } from "..utils/logger.js";
export default function errorHandler (err, req, res, next) {
   if (res.headersSent) return next(err);
   const status = Number(err.status || err.statusCode) || 500;
   if (status >= 500) log.error({ err, requestedId: req.id }, "Unhandled request error");
const body = { message: status >= 500 ? "Internal server error" : (err.message || "Request failed") };
if (err.details && status < 500) body.details = err.details;
res.status(status).json(body);
}
