/* ============================================================
   DisNotify — utils/logger.js

   ── WHAT YOU NEED TO CODE ──────────────────────────────────
   1. export const log = pino({ level: process.env.LOG_LEVEL ?? 'info',
        transport: NODE_ENV === 'development'
          ? { target: 'pino-pretty' } : undefined,
        redact: ['req.headers.authorization', '*.password',
                 '*.discordWebhook', '*.password_hash', '*.token'] })
      That redact list is not decoration — without it you WILL print a
      user's password or webhook into your log aggregator.
   2. export function requestLogger(req, res, next)
      Attach a request id (crypto.randomUUID), log method/path/status/
      duration on finish. Skip /api/health or it drowns everything.
   3. export function jobLogger(name) -> a child logger with { job: name }
      so you can filter one cron job's output.
   4. In production, log JSON to stdout and let the platform collect
      it. Do not write log files yourself.
   ============================================================ */
throw new Error('utils/logger.js is a scaffold.');
