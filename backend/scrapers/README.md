# scrapers/

Only for retailers with **no usable API or feed**. Check `../integrations/` first.

**In South Africa this folder does most of the work.** Unlike the US, no major SA retailer
publishes a public product API, so scraping is not the fallback here — it is the primary
mechanism, with affiliate feeds layered in as approvals land. Plan the maintenance accordingly.
See `docs/SCRAPING_VS_API.md` for the per-retailer decision.

## Before you write a single selector

1. **Read the retailer's `/robots.txt` and Terms of Service.** If a path is disallowed, do
   not fetch it. Some retailers forbid automated access outright — respect that and use their
   affiliate feed or drop them from your list.
2. **Identify yourself.** Set a real `User-Agent` with a contact URL (`SCRAPE_USER_AGENT`
   in `.env`). Anonymous spoofed traffic is what gets IP ranges banned.
3. **Go slow.** One request every few seconds per domain, never parallel bursts. You are
   asking for a favour, not exercising a right.
4. **Cache aggressively.** Never re-fetch a page you pulled 10 minutes ago.
5. **Only take price and availability.** Do not copy their images, descriptions, or reviews
   into your database — that is their copyrighted content. Hotlink or use manufacturer art.
6. **Honour deletion.** If a retailer asks you to stop, stop that day.

Product data itself (a price, an availability flag) is generally factual, but access to it is
governed by the contract you accept when you use the site. When in doubt, prefer the affiliate
program: nearly every retailer here has one, and it turns an adversarial relationship into a
paid one.

## Files

| File | Purpose |
|---|---|
| `base-scraper.js` | Fetch + retry + rate-limit + circuit breaker + logging. Every scraper extends it. |
| `storefront-platforms.js` | **Read this first.** Shopify/WooCommerce/Magento expose structured product JSON — most SA stores run one of them. |
| `parse-utils.js` | ZAR price and stock parsing. The boring code that breaks most often. |
| `proxy.js` | Rotating-proxy agent, only if you genuinely need it. |
| `wootware.js` | **Start here.** Focused component catalogue, clean structure. |
| `evetech.js` | Build second, so you have two readings on the same parts. |
| `takealot.js` | JS-rendered and better served by the affiliate feed — narrow scope only. |
| `template.js` | Copy this to add a retailer (Rebel Tech, Makro, Incredible, Loot, BT Games…). |

## South Africa specifics

- **Prices include 15% VAT.** The advertised number is the number paid. Never adjust it.
- **ZAR parsing is not USD parsing.** `R 14 329,00` uses a space as the thousands separator and
  a comma as the decimal — and the space is often a non-breaking space (U+00A0) that silently
  defeats naive regexes. Normalise whitespace before parsing.
- **Grey imports are everywhere.** Genuine hardware imported outside the official channel,
  cheaper, often with no local warranty. Treat it as a distinct `condition`, never as the same
  offer.
- **Stock wording is vague.** "3-5 working days" means supplier stock, not shelf stock. Decide
  what counts as in-stock and apply it consistently across every retailer.
- **Marketplace sellers** on Takealot are third parties with their own pricing and warranty.
- **Uptime is not guaranteed.** SA sites can be intermittently unreachable for reasons that
  have nothing to do with you. A failed fetch should back off and retry later, not immediately
  trip the circuit breaker or mark a price as changed.

## The maintenance reality

Every scraper here **will** break — a class name changes, a page becomes React-rendered, a
bot wall appears. Expect to fix one every few weeks. That is why `scrape_log` exists: alert
yourself when a retailer's success rate drops below ~80% over an hour, so you find out before
your users do.
