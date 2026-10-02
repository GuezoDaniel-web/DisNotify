# Deployment

## Shape

Three deployables, one database:

| Part | What it is | Where |
|---|---|---|
| Frontend | static files | Netlify, Cloudflare Pages, Vercel, any CDN |
| API | `node server.js` | Railway, Render, Fly.io, a VPS |
| Worker | `node jobs/scheduler.js` | **separate service, same image** |

Postgres and Redis: managed instances (Neon/Supabase/RDS, Upstash/Redis Cloud). Do not run
them on the same box as the worker — a runaway scrape should not be able to OOM your database.

## Host close to your users

Your users are in South Africa; most default cloud regions are not. A server in Europe or
us-east adds roughly 150–200ms to every request, which is very noticeable on a page that fires
several. Options worth comparing:

- **AWS af-south-1 (Cape Town)** or **Azure South Africa North** — proper local regions
- **Local hosts** (Xneelo, Afrihost and similar) — simple and close
- A CDN in front of the static frontend fixes most of it regardless of where the API sits

Put the **frontend on a CDN** (Cloudflare has SA presence) and the **API as close to your users
as you can afford**. The database must sit next to the API, not next to you.

One SA-specific note for the worker: your scrape targets are also local, so a fast local region
helps there too — and if a retailer becomes briefly unreachable for reasons unrelated to you,
back off and retry rather than marking the scraper broken.

## Frontend

No build step. Upload `frontend/` as-is. Before you do:

1. Set `CONFIG.API_BASE` to your production API URL and `USE_MOCK: false`.
2. Set `CONFIG.VAPID_PUBLIC_KEY`.
3. Bump `CACHE_VERSION` in `sw.js` on every deploy, or returning users keep the old JS. This
   is the single most common "why is my fix not live?" cause with service workers.
4. Add the three PNGs listed in `frontend/assets/README.md`.

Headers worth setting at the CDN:

```
Cache-Control: public, max-age=31536000, immutable   # css/, js/, assets/
Cache-Control: no-cache                              # *.html and sw.js
```

`sw.js` must never be cached, or it can never update itself.

## API and worker

- **HTTPS is mandatory** — Web Push does not work over plain http.
- `app.set('trust proxy', 1)` behind a load balancer, or rate limiting keys everything to the
  proxy's IP.
- Set `CORS_ORIGIN` to your exact frontend origin. Not `*`.
- Every value in `.env.example` must be set in the platform's secret store. Never commit `.env`.
- Health check path: `/api/health` (make it return 503 when the DB is down, or the platform
  will happily keep routing traffic to a broken instance).
- Run the worker as its own service with **one** instance until you move to BullMQ — two
  cron processes without distributed locks means double scraping and duplicate alerts.

## Before you go live

- [ ] Rotate `JWT_SECRET` — the example value is public
- [ ] Confirm `.env` is in `.gitignore` and no key was ever committed
- [ ] Backups on Postgres, and actually restore one to check it works
- [ ] Error tracking (Sentry) on both API and worker
- [ ] Uptime monitor on `/api/health`
- [ ] An alert to **you** when a retailer's scrape success rate drops below 80%
- [ ] SPF/DKIM/DMARC set up if you send email
- [ ] **POPIA compliance** — the Protection of Personal Information Act applies to you. You
      store emails, phone numbers and push endpoints, which are personal information. You need:
      a privacy policy stating what you collect and why, a lawful basis for holding it, a way to
      export a user's data on request, and a real delete (not a soft flag). Build the delete
      path early; retrofitting it across six tables is miserable.
- [ ] Affiliate disclosure on any page showing affiliate links (also a consumer-protection
      expectation, not just good manners)

## Cost sketch (small scale)

Postgres free tier + Redis free tier + two small services is roughly R200–R400/month at small
scale. The expensive line items are **SMS** (per message, and it adds up fast on a busy deals
day) and **residential proxies** (per GB). Avoid both until you have revenue. Local hosting is
often cheaper than a dollar-billed cloud region once the rand is factored in — compare before
committing, and remember that a dollar-priced bill is also currency risk.
