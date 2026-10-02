# Roadmap

## v1 — the thing works (build this, ship it, stop)

- [x] Full responsive frontend on mock data
- [ ] Postgres schema applied
- [ ] `/api/health`, `/api/deals`, `/api/products/:id`
- [ ] Wootware scraper (first real ZAR data)
- [ ] Cron price refresh (hot tier only)
- [ ] Auth + watchlist + alert rules
- [ ] Web push notifications
- [ ] Deployed with HTTPS

**Definition of done: you get a push on your phone when a GPU you watch drops.** Everything
below is optional until that works.

## v1.1 — coverage

- [ ] Evetech scraper (a second reading on the same parts — this is when price
      *comparison* actually starts working)
- [ ] Takealot affiliate feed, once approved (consoles + breadth)
- [ ] Email notifications with a real template
- [ ] Discord webhooks (this audience will use it more than email)
- [ ] Product matching by EAN/barcode across retailers, sourced from Shopify/Woo endpoints
- [ ] Grey-import detection and labelling

## v1.2 — retention

- [ ] Digest modes (hourly/daily) and quiet hours enforced per timezone
- [ ] PriceCheck partner feed — many merchants for one integration
- [ ] "Deal score": is this actually good, or just a fake discount off an inflated RRP?
      SA "was" prices are often aspirational, so score against *your own* observed history,
      not against the retailer's claimed RRP
- [ ] Public shareable deal pages (SEO — this is how price trackers grow)
- [ ] Browser extension: a "track this" button on retailer product pages

## v2 — ideas worth considering

- **PC build tracker.** Save a full parts list, get alerted when the *total* drops below a
  budget. Nothing else does this well, and it fits your audience exactly.
- **Restock alerts for launches.** GPU and console launch days are the highest-intent moment
  in this market — and SA allocations are small, so stock genuinely sells out in minutes.
  Whoever notifies fastest wins the user.
- **Black Friday.** SA Black Friday is a big, concentrated retail event. It is your best
  acquisition moment of the year and also the day your scrapers get hammered hardest and
  retailers' sites are slowest. Load-test before November, not during it.
- **Import-cost transparency.** Landed cost versus local price is a real question for SA
  buyers. Showing "cheaper abroad, but +duty +VAT +shipping +no local warranty" would be
  genuinely useful and nobody does it well.
- **Price prediction.** "Historically this drops ~12% in November — consider waiting."
- **Discord bot.** Slash commands to add alerts, alerts delivered as DMs.
- **Regional expansion.** UK/EU/CA retailers; the schema already has region and currency.

## Business model, briefly

Affiliate commissions on outbound clicks are the natural fit, and in South Africa the
affiliate programme is also your data source — so applying early pays twice. Commission rates
on hardware are thin, so volume matters. Apply on day one; approval takes time. A Pro tier (unlimited alerts,
SMS, instant instead of digest) is the obvious second stream.

If you take affiliate money, disclose it on the site. Users forgive a disclosed affiliate
link; they do not forgive finding out later. Never let a commission rate influence which
retailer you show as "best price" — the moment you do that, the product is worthless.

## Things that will bite you, ranked

1. **Product matching** (`services/matching.js`) — harder than everything else combined.
2. **Notification fatigue** — no cooldown means users mute you in two days.
3. **Scraper rot** — and this is heavier here than in the US, because scraping is your primary
   mechanism rather than your fallback. Budget ongoing maintenance, not a one-time build.
4. **Bad price data** — one "R0,00 deal!" alert costs more trust than ten good alerts earn,
   and ZAR's space-separated formatting makes parsing errors more likely than USD's.
5. **price_history growth** — plan the rollup before the table is 50M rows, not after.
