# DisNotify — Backend (scaffold)

**Nothing in this folder is implemented.** Every file is a stub whose header comment
tells you exactly what to write, in what order, and how it connects to the rest of
the system. The frontend already works against `USE_MOCK = true`; your job is to make
the same shapes come from real data.

## Build order (do it in this sequence — each step is testable on its own)

| # | Step | Files | Done when |
|---|------|-------|-----------|
| 1 | Database | `db/schema.sql`, `db/client.js` | `npm run migrate` creates all tables |
| 2 | HTTP skeleton | `server.js`, `routes/health.js`, `middleware/errors.js` | `GET /api/health` → `{status:"ok"}` |
| 3 | Read endpoints | `routes/deals.js`, `routes/products.js`, `services/product-service.js` | Frontend works with `USE_MOCK = false` |
| 4 | One data source | `scrapers/storefront-platforms.js` + `scrapers/wootware.js` | Real ZAR prices land in `offers` |
| 5 | More sources | `scrapers/evetech.js`, then feeds in `integrations/*` | 3+ retailers per product |
| 6 | Product matching | `services/matching.js` | The same GPU from 4 retailers = 1 product row |
| 7 | Auth | `routes/auth.js`, `middleware/auth.js` | Login returns a JWT the frontend stores |
| 8 | Watchlist + alerts | `routes/watchlist.js`, `routes/alerts.js` | Rules persist per user |
| 9 | The actual point | `jobs/*`, `services/alert-engine.js`, `notifications/*` | A price drop sends you a push |

## Quick start

```bash
cd backend
cp .env.example .env
npm install
npm run migrate
npm run dev      # API on :4000
npm run worker   # cron jobs, separate process
```

Run the worker as a **separate process** from the API. If a scrape hangs it must not
take your HTTP server down with it.

## Apply for affiliate access TODAY

No major South African retailer has a public product API, so you cannot shortcut this the way
a US build would. Approval takes days to weeks — start the clock before you write code:

- **Takealot** affiliate programme (through an affiliate network) — the largest SA retailer
- **PriceCheck** partner access — one integration, many SA merchants
- **Amazon Associates ZA** — and confirm whether PA-API covers the `.co.za` marketplace

While those are pending, build against `scrapers/wootware.js`. See
`docs/SCRAPING_VS_API.md`.

## Read these before writing code

- `docs/API_CONTRACT.md` — the exact JSON every endpoint must return
- `docs/SCRAPING_VS_API.md` — the SA data-source situation, retailer by retailer
- `docs/ARCHITECTURE.md` — how data flows from retailer to notification
