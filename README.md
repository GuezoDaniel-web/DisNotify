# DisNotify

**Get pinged the moment PC parts, consoles and gaming tech go on sale in South Africa — and
see which retailer is actually cheapest before you buy.**

Built for the SA market: prices in **ZAR**, VAT-inclusive, across Takealot, Evetech, Wootware,
Rebel Tech, Makro, Incredible, Loot, BT Games and Amazon.co.za.

The frontend is **finished and running**. The backend is a complete scaffold: every file
exists, and every file's header comment tells you exactly what to write in it and how it
connects to the rest of the system. No backend logic has been written for you.

```bash
node serve-frontend.mjs
```

Then open <http://localhost:5173>. Everything works immediately on mock data.

> Opening `index.html` directly from the file system shows a blank page — ES modules require
> `http://`. Use the command above.

---

## What is built vs. what you build

| | Status |
|---|---|
| **Frontend** — 6 pages, responsive, dark/light, PWA, service worker | Done and tested |
| **Mock data layer** — the whole UI is usable today | Done |
| **Database schema** — `backend/db/schema.sql`, runnable | Done (it is the contract) |
| **API contract + architecture + setup docs** | Done |
| **Backend** — 30 guided stub files | Yours to write |

Every stub throws on import with a message pointing at its own header comment, so you can
never accidentally ship a half-wired file that silently returns nothing.

---

## Features in the UI right now

- **Deals feed** — filter by category, retailer, minimum discount, stock; sort five ways;
  live stat tiles; all-time-low badges; a price sparkline on every card. ZAR throughout,
  formatted the SA way (`R 14 329`, cents only where they exist)
- **Price comparison** — every retailer's price, shipping and true total side by side, the
  cheapest highlighted, plus a multi-retailer 30/90/all-day price history chart
- **Watchlist** — one tap on any card
- **Alerts** — five rule types (price below, % drop, any drop, all-time low, back in stock),
  per-retailer scoping, four delivery channels, pause/resume
- **Trends** — category price index, which retailer wins most often, biggest movers
- **Settings** — channels, quiet hours, digest frequency, region/currency, retailer selection
- **Notifications** — in-app bell feed plus real Web Push through the service worker
- **Everywhere** — dark/light theme, `/` to focus search, offline shell, installable PWA

Responsive at every size: single column with a bottom tab bar on phones, a slide-over drawer
on tablets, a full sidebar on desktop. Verified with no horizontal overflow at 375px, 768px
and desktop widths.

---

## Project layout

```
DisNotify/
├── serve-frontend.mjs        # zero-dependency static server (dev only)
├── frontend/                 # COMPLETE — nothing here needs writing
│   ├── index.html            #   deals feed
│   ├── product.html          #   price comparison + history
│   ├── watchlist.html  alerts.html  trends.html  settings.html  login.html
│   ├── sw.js                 #   service worker: offline shell + push receiver
│   ├── css/                  #   base (tokens) · layout (responsive) · components
│   └── js/
│       ├── config.js         #   <-- EDIT THIS to point at your backend
│       ├── api.js            #   the only file that talks to the network
│       ├── mock-data.js      #   delete once your API is live
│       ├── layout.js  cards.js  chart.js  alert-modal.js  ui.js  store.js  icons.js
│       └── deals.js  product.js  watchlist.js  alerts.js  trends.js  settings.js  auth.js
│
├── backend/                  # SCAFFOLD — read each file's header, then write it
│   ├── server.js             #   start here
│   ├── db/schema.sql         #   complete and runnable
│   ├── routes/               #   9 endpoints
│   ├── services/             #   product · price · matching · alert-engine
│   ├── integrations/         #   takealot-feed · pricecheck · amazon-za
│   ├── scrapers/             #   base · storefront-platforms · wootware · evetech
│   │                         #   · takealot · parse-utils · template
│   ├── jobs/                 #   scheduler · refresh-prices · evaluate-alerts · cleanup
│   ├── notifications/        #   dispatcher · push · email · discord · sms
│   ├── middleware/  utils/
│   └── .env.example
│
└── docs/
    ├── SETUP.md              # START HERE: zero to a working alert
    ├── API_CONTRACT.md       # the exact JSON your backend must return
    ├── SCRAPING_VS_API.md    # which retailers get an API, which get scraped, why
    ├── ARCHITECTURE.md       # how data flows from retailer to notification
    ├── DEPLOYMENT.md         # hosting, HTTPS, service-worker cache gotchas
    └── ROADMAP.md            # what to build after v1
```

---

## Scraping or APIs? — the SA answer is different

**This is a scraping project with affiliate feeds layered on top.** In the US you would grab a
free API key and have prices the same afternoon. **No major South African retailer publishes a
public product API**, so that shortcut does not exist here.

- **Scrape:** Wootware (start here), Evetech, Rebel Tech, Makro, Incredible, Loot, BT Games
- **Affiliate feed:** Takealot, PriceCheck — apply on **day one**, approval takes days to weeks
- **API, if available:** Amazon.co.za — confirm PA-API covers the `.co.za` marketplace first

**The shortcut most people miss:** many SA stores run Shopify, WooCommerce or Magento, all of
which expose structured product JSON (`/products.json`, `/wp-json/wc/store/products`) including
the **barcode** — the single most valuable field for matching the same GPU across retailers.
Check the platform before writing a single CSS selector. See
[backend/scrapers/storefront-platforms.js](backend/scrapers/storefront-platforms.js).

Full per-retailer reasoning: [docs/SCRAPING_VS_API.md](docs/SCRAPING_VS_API.md).

---

## Connecting the frontend to your backend

One file, two lines — `frontend/js/config.js`:

```js
API_BASE: 'http://localhost:4000/api',
USE_MOCK: false,
```

The header pill flips from orange **MOCK** to green **LIVE** as soon as `/api/health`
answers. Nothing else in the frontend changes, because `js/api.js` is the only module that
touches the network.

---

## Build order

Do these in sequence — each one is testable on its own.

1. `db/client.js` — connect to Postgres and Redis
2. `server.js` + `routes/health.js` + `middleware/errors.js` — `curl /api/health`
3. `services/product-service.js` + `routes/deals.js` + `routes/products.js` — **flip
   `USE_MOCK` off; the whole UI now runs on your data**
4. `scrapers/storefront-platforms.js` + `scrapers/wootware.js` — real ZAR prices
5. `jobs/scheduler.js` + `jobs/refresh-prices.js` — prices update themselves
6. `routes/auth.js` + `middleware/auth.js` — accounts
7. `routes/watchlist.js` + `routes/alerts.js` — rules persist
8. `services/alert-engine.js` + `notifications/*` — **your phone buzzes. Ship it.**

Step-by-step commands, prerequisites and a troubleshooting table are in
[docs/SETUP.md](docs/SETUP.md).

---

## The three things that will be hardest

1. **Matching listings across retailers** (`services/matching.js`) — deciding that Wootware's
   "GIGABYTE RTX 4070 SUPER WINDFORCE OC 12G" and Evetech's listing are the same product.
   Match on barcode/EAN/MPN first (Shopify and WooCommerce endpoints hand you the barcode);
   fuzzy title matching is a last resort and needs a human review queue.
2. **Not becoming spam** (`services/alert-engine.js`) — cooldowns, hysteresis and quiet hours
   are what separate a product people keep from one they mute on day two.
3. **Bad price data** (`services/price-service.js`) — `R 14 329` parsed as `14` fires a
   "R14 GPU!" alert at everyone watching. ZAR uses a **space** as the thousands separator, and
   it is frequently a non-breaking space that quietly defeats naive regexes. Sanity-check every
   price before writing it, and never store `0` to mean "no price found".

Runner-up, and specific to this market: **grey imports**. Parallel-imported hardware is genuine
and materially cheaper, but usually carries no local warranty — so it will systematically win
your comparison table. Detect it, label it, or exclude it. A user who buys your "best price"
and then cannot RMA it locally will not come back.

---

## Legal, briefly

Read a retailer's `robots.txt` and Terms of Service before scraping it. Identify your bot,
rate-limit yourself, cache, and take only prices and availability — not their images,
descriptions or reviews. Join the affiliate programme where one exists: in South Africa it is
both how this app funds itself *and* your best data source, so applying early pays twice. If
you show affiliate links, disclose it — and never let commission rates decide which retailer
you rank as cheapest.

**POPIA applies to you.** You store emails, phone numbers and push endpoints, all of which are
personal information under the Protection of Personal Information Act. You need a privacy
policy, a lawful basis for holding the data, and a real export-and-delete path. Build the
delete path early — see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
