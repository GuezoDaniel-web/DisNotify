# Scraping or APIs? — the South African answer

**Short version: in South Africa this is a scraping project with affiliate feeds layered on
top.** That is the opposite of how you would build it for the US market, and it changes your
plan, your timeline and your ongoing maintenance cost.

## The core difference

In the US you can sign up at a retailer developer portal, get a free key in five minutes, and
have real prices in your database the same afternoon. **No major South African retailer offers
that.** What exists here instead is:

- **Affiliate programmes** — Takealot and others run affiliate schemes, generally through
  affiliate networks. Approved affiliates typically get a product feed and tracked deep links.
  You must apply, and approval takes time.
- **Comparison-engine partnerships** — PriceCheck already aggregates many SA merchants. One
  partnership can replace several scrapers.
- **Everything else** — HTML.

## Per-retailer decision

| Retailer | Approach | Notes |
|---|---|---|
| **Wootware** | Scrape | **Start here.** Focused component catalogue, clean structure, no marketplace noise. |
| **Evetech** | Scrape | Build second. Wide GPU/CPU/monitor range; watch for bundles and "price on request". |
| **Rebel Tech** | Scrape | Components. Use `scrapers/template.js`. |
| **Takealot** | Affiliate feed (+ narrow scrape) | Largest SA online retailer. Apply for the affiliate programme; it is JS-rendered so scraping it is expensive. Marketplace sellers need care. |
| **Makro** | Scrape | Consoles, TVs, bulk. |
| **Incredible Connection** | Scrape | Laptops, peripherals. |
| **Loot / BT Games** | Scrape | Consoles and games. |
| **Amazon.co.za** | API, if available | Newer in SA. **Confirm whether PA-API covers the `.co.za` marketplace** before building on it. Never scrape Amazon. |
| **PriceCheck** | Partner feed | An aggregator — one integration, many merchants. Apply early. |

**Verify this table yourself.** Programmes, networks and feed formats change, and I would
rather you check than inherit a stale assumption. Apply first, read what they actually give
you, then write the adapter to fit.

## The shortcut most people miss

Before writing a single CSS selector, check what platform the store runs on. Many SA retailers
use **Shopify, WooCommerce or Magento**, and each exposes structured product data by default:

- Shopify: `<product-url>.json` and `/products.json` — public, documented, first-party
- WooCommerce: `/wp-json/wc/store/products` — the public Store API, no keys needed
- Magento: an embedded JSON config block on each product page

These give you price, stock, SKU and — critically — **barcode/EAN**, which is the single most
valuable field for matching the same GPU across four retailers. This is far more reliable than
parsing rendered HTML, and it is the difference between a scraper you fix monthly and one you
fix yearly. See `backend/scrapers/storefront-platforms.js`.

A public JSON endpoint is still not an invitation to hammer it: same rate limits, same caching,
same politeness as any other request.

## Rules for scraping, since you will be doing a lot of it

1. Read `robots.txt` and the Terms of Service. If a path is disallowed, do not fetch it.
2. Identify yourself in the `User-Agent`, with a contact URL.
3. One request every few seconds per domain. Never parallel bursts.
4. Cache. Never re-fetch a page you pulled minutes ago.
5. Take **price and availability only** — not their images, descriptions or reviews.
6. Platform JSON → JSON-LD → CSS selectors, in that order of preference.
7. Circuit-break: 5 consecutive failures means stop that retailer for 30 minutes.
8. If a retailer asks you to stop, stop.

Prices are facts, but access is governed by the terms you accept when using a site, and those
differ per retailer. Where an affiliate programme exists, join it — it turns an adversarial
relationship into a paid one, and it is how this app funds itself.

## ZAR and SA-specific data traps

- **VAT is included.** SA retailers advertise the final price. Never add 15% anywhere.
- **Number formatting differs.** `R 14 329,00` uses a space for thousands and a comma for
  decimals — and that space is often a **non-breaking space (U+00A0)** that quietly breaks
  regexes. Some stores use `R14,329.00` instead. Handle both. `R 14 329` parsed as `14` is the
  bug that will fire a "R14 GPU!" alert at every user.
- **Grey imports.** Parallel-imported hardware is genuine, cheaper, and usually has no local
  warranty. It will systematically win your comparison table. Treat it as its own `condition`
  and label it, or exclude it.
- **Stock wording is soft.** "3-5 working days" means supplier stock, not shelf stock. Pick one
  interpretation and apply it across every retailer.
- **Marketplace sellers** (Takealot) set their own price, warranty and returns.
- **Uptime.** SA sites can be intermittently unreachable for reasons unrelated to you. Back off
  and retry rather than immediately tripping a circuit breaker or recording a price change.

## Recommended v1 scope

**Wootware + Evetech (scraped) + Takealot (feed, once approved).** Three retailers covering
components and consoles. Apply for Takealot and PriceCheck on day one so approval runs in
parallel with your build, and ship the two scrapers while you wait.

Three reliable retailers beat eight flaky ones — especially here, where every extra retailer is
another scraper to maintain rather than another API key to paste.
