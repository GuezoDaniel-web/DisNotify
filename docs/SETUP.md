# Setup — from zero to a working alert

## 0. See the frontend right now (30 seconds)

```bash
node serve-frontend.mjs
```

Open <http://localhost:5173>. Everything works on mock data: browse, filter, compare prices,
open a product, set alerts, toggle the theme. The orange **MOCK** pill in the header tells you
no backend is connected.

You cannot open `index.html` directly from the file system — ES modules require `http://`.

## 1. Install the tools

| Tool | Why | Check |
|---|---|---|
| Node 20+ | runtime | `node --version` |
| PostgreSQL 15+ | products, prices, users | `psql --version` |
| Redis 7+ | cache, locks, rate limits | `redis-cli ping` |

On Windows the easiest route is Docker Desktop:

```bash
docker run -d --name disnotify-pg -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:16
```

```bash
docker run -d --name disnotify-redis -p 6379:6379 redis:7
```

## 2. Database

```bash
cd backend
cp .env.example .env
npm install
npm run migrate
```

`db/schema.sql` is complete and runnable — it is the contract everything else is written
against. Everything that *uses* it is yours to write.

## 3. Generate your push keys

```bash
npx web-push generate-vapid-keys
```

Public key goes in `frontend/js/config.js` as `CONFIG.VAPID_PUBLIC_KEY`.
Private key goes in `backend/.env` as `VAPID_PRIVATE_KEY`. They must be the same pair.

## 4. Start your affiliate applications (do this on day one)

There is no instant free API key in South Africa. Apply now so approval runs while you build:

- **Takealot affiliate programme** (through an affiliate network) — the largest SA retailer
- **PriceCheck partner access** — one integration covering many SA merchants
- **Amazon Associates ZA** — and confirm whether PA-API covers the `.co.za` marketplace

Meanwhile, your first real data source is a scraper, not a feed: `scrapers/wootware.js`. Check
what platform the store runs on first (`scrapers/storefront-platforms.js`) — if it is Shopify or
WooCommerce, there is public structured JSON and you can skip CSS selectors entirely.

## 5. Write the code, in this order

Each step is independently testable. Do not skip ahead; step 3 is the one that makes the
whole frontend go live.

| # | Write | Test it worked |
|---|---|---|
| 1 | `db/client.js` | a `SELECT 1` returns |
| 2 | `server.js`, `routes/health.js`, `middleware/errors.js` | `curl localhost:4000/api/health` |
| 3 | `services/product-service.js`, `routes/deals.js`, `routes/products.js` | set `USE_MOCK: false` — the grid still fills |
| 4 | `scrapers/storefront-platforms.js` + `scrapers/wootware.js` | real ZAR prices appear in `offers` |
| 5 | `jobs/scheduler.js`, `jobs/refresh-prices.js` | prices update on their own |
| 6 | `routes/auth.js`, `middleware/auth.js` | login returns a JWT |
| 7 | `routes/watchlist.js`, `routes/alerts.js` | rules survive a reload |
| 8 | `services/alert-engine.js`, `notifications/*` | **your phone buzzes** |

## 6. Flip the frontend to live

In `frontend/js/config.js`:

```js
API_BASE: 'http://localhost:4000/api',
USE_MOCK: false,
```

The header pill turns green and reads **LIVE**. If it does not, open DevTools → Network and
check for a CORS error — `CORS_ORIGIN` in `.env` must list `http://localhost:5173`.

## Troubleshooting

| Symptom | Cause |
|---|---|
| Blank page, `Failed to load module script` | You opened the file directly. Use the dev server. |
| Prices render as `R NaN` | `pg` returns NUMERIC as a string. Set the type parser in `db/client.js`. |
| A price imports as `14` instead of `14329` | Your ZAR parser choked on the space separator — and it is probably a non-breaking space. See `scrapers/parse-utils.js`. |
| Quiet hours fire at the wrong time | Your server runs UTC; SAST is UTC+2. Convert to `Africa/Johannesburg` before comparing. |
| CORS error | `CORS_ORIGIN` does not include your frontend origin. |
| Push permission granted but nothing arrives | VAPID keys are from different pairs, or you are on plain `http://` on a non-localhost host. |
| Signed-in user keeps bouncing to login | You returned 401 where you meant 403. The frontend logs out on any 401. |
| Alerts fire repeatedly for the same price | `cooldown_min` is not being enforced in `alert-engine.js`. |
