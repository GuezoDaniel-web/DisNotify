# integrations/

Official APIs and affiliate feeds. Always prefer these over `../scrapers/`.

## The South African reality

**There is no Best Buy equivalent here.** In the US you can get a free API key in five minutes
and have real prices the same day. In South Africa, essentially **no major retailer publishes a
public product API**. That changes the build:

| Source | Type | How you get it | Reality check |
|---|---|---|---|
| `takealot-feed.js` | Affiliate feed | Apply to the Takealot affiliate programme (runs through an affiliate network) | Best single source — Takealot is the largest SA online retailer and carries consoles, peripherals and some components |
| `pricecheck.js` | Feed / partner API | Apply as a PriceCheck partner | An aggregator: one integration, many SA merchants. Worth applying for early. |
| `amazon-za.js` | API | Amazon Associates ZA + PA-API | Amazon.co.za is newer here; **confirm PA-API supports the ZA marketplace before building on it** |
| everything else | Scrape | `../scrapers/` | Evetech, Wootware, Rebel Tech, Makro, Incredible, Loot, BT Games |

**Verify every claim in this table yourself before you build on it.** Affiliate programmes,
networks and feed formats change, and SA programmes change more often than US ones. Apply
first, read what they actually give you, then write the adapter to match.

## What this means for your build order

The US-shaped plan ("get one API key, ship in a day") does not apply. Yours is:

1. **Apply for affiliate access on day one** — Takealot and PriceCheck. Approval takes days to
   weeks, and you want that clock running while you build everything else.
2. **Start with a scraper**, not an API — `../scrapers/wootware.js` or `evetech.js`. They are
   small, well-structured sites and the fastest path to real data in your database.
3. **Fold in feeds as approvals land.** A feed replaces a scraper for that retailer; the rest
   of the system does not change, because every adapter normalises to the same shape.

## What every adapter must return

Normalise before handing off to `services/price-service.js` — nothing downstream should know
or care whether the data came from a feed, an API, or HTML:

```js
{ price, shipping, inStock, url, sku, currency: 'ZAR', condition, ean, mpn, title, image }
```

## ZAR rules that apply to every adapter

- **Prices are VAT-inclusive.** SA retailers advertise the final price. Never add 15% anywhere.
- **Store whole rands** where the source gives them. Hardware here is not priced in cents.
- **Never mix currencies.** If a source returns USD (an Amazon.co.za listing sourced abroad,
  say), either convert it at a stored, timestamped rate and mark it, or drop the offer.
  Silently comparing a USD price against ZAR prices produces a "best price" that is nonsense.
- **Watch for grey imports.** SA has a large parallel-import market. A grey-import GPU without
  local warranty is not the same offer as an official one — see the `condition` handling in
  `../services/matching.js`.
