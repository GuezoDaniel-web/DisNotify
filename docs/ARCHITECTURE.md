# Architecture

```
                       +------------------------------------------+
   Retailers           |  WORKER PROCESS   (npm run worker)       |
   ---------           |                                          |
   Takealot feed ----> | jobs/scheduler.js  (cron, Redis-locked)  |
   PriceCheck   -----> |      |                                   |
   Wootware HTML ----> |      v                                   |
   Evetech HTML -----> | jobs/refresh-prices.js                   |
   Makro HTML   -----> |      |  integrations/* | scrapers/*      |
                       |      v                                   |
                       | services/matching.js    <- which product?|
                       |      v                                   |
                       | services/price-service.js  <- sanity check
                       |      |   writes offers + price_history   |
                       |      v   emits priceChanged              |
                       | services/alert-engine.js                 |
                       |      |   rules, cooldown, quiet hours    |
                       |      v                                   |
                       | notifications/dispatcher.js              |
                       |   push | email | discord | sms           |
                       +---------------+--------------------------+
                                       |
                   +-------------------v------------------+
                   |  PostgreSQL          Redis           |
                   |  products, offers,   cache, locks,   |
                   |  price_history,      rate limits     |
                   |  users, alert_rules                  |
                   +-------------------^------------------+
                                       |
                       +---------------+------------------+
                       |  API PROCESS   (npm run dev)     |
                       |  express + routes/*              |
                       +---------------^------------------+
                                       | JSON over HTTPS
                       +---------------+------------------+
                       |  FRONTEND  (static, no build)    |
                       |  index, product, watchlist,      |
                       |  alerts, trends, settings        |
                       |  sw.js  <- receives web push     |
                       +----------------------------------+
```

## The SA shape of this diagram

Note where the weight sits: in South Africa most of those inbound arrows are **scrapers**, not
API clients. There is no batched "20 products in one request" call to lean on except where an
affiliate feed covers you. That makes `jobs/refresh-prices.js` tiering (hot/warm/cold) and the
per-domain rate limiting in `scrapers/base-scraper.js` load-bearing rather than nice-to-have —
they are what keeps a mostly-scraped pipeline both polite and fast enough to be useful.

## Why two processes

A hung scrape must never take the API down. Run `server.js` and `jobs/scheduler.js` as
separate deployments -- they share the database, nothing else. Scale them independently: the
API scales with users, the worker scales with tracked products.

## The one-way data rule

Only `services/price-service.js` writes prices. Routes never touch the `offers` table
directly. Every sanity check, every history row, every `priceChanged` event lives in that one
file -- so when a bad price appears, there is exactly one place to look.

## Read path

`GET /deals` goes to `services/product-service.js`, which runs one SQL query using
`DISTINCT ON` to pick the cheapest offer per product, maps it to the DTO, and caches the
result in Redis for 60s. Target: under 150ms warm. This endpoint is ~90% of your traffic.

## Frontend architecture

Static files, no build step, native ES modules. `js/api.js` is the only file that talks to the
network; every page imports from it. Flipping `CONFIG.USE_MOCK` swaps the entire data source
without touching page code -- which is why you can build and demo the UI before the backend
exists.

`js/layout.js` injects the shared shell (top bar, sidebar, mobile tab bar) into every page, so
navigation lives in one place rather than being copy-pasted into six HTML files.

## What to build when it grows

- **>5k products:** move the cron queue to BullMQ, run multiple workers.
- **>50M price_history rows:** roll up old data (`jobs/cleanup.js`) or move that table to
  TimescaleDB.
- **Slow /deals:** add a materialised view `product_best_offer`, refreshed by the worker.
- **Frontend gets heavy:** the module boundaries already map onto React/Svelte components --
  `cards.js`, `chart.js` and `alert-modal.js` are already isolated, dependency-free units.
