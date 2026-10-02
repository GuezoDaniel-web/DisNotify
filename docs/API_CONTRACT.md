# API contract

The frontend is already written against this contract. Match it exactly and the UI works
with no changes to page code. The live reference implementation of these shapes is
`frontend/js/mock-data.js` — if a field is confusing, log a mock object and look at it.

Base URL: `CONFIG.API_BASE` in `frontend/js/config.js` (default `http://localhost:4000/api`).
Auth: `Authorization: Bearer <jwt>` on protected routes.
Errors: **every** non-2xx body must contain `{ "message": "human readable" }` — the UI prints
that string verbatim in toasts and inline errors.

## Types

### Offer
```json
{
  "retailerId": "evetech",
  "retailer": "Evetech",
  "color": "#e02424",
  "price": 13999,
  "shipping": 0,
  "currency": "ZAR",
  "inStock": true,
  "condition": "new",
  "url": "https://www.evetech.co.za/…?affiliate=you",
  "lastChecked": "2026-08-29T18:04:11.000Z",
  "history": [{ "date": "2026-08-01", "price": 14899 }]
}
```
`history` is only required on `GET /products/:id`. Downsample to daily, max ~90 points.

### Product
```json
{
  "id": "gpu-rtx-4070-super",
  "name": "GeForce RTX 4070 SUPER 12GB Gaming OC",
  "brand": "NVIDIA",
  "category": "gpu",
  "image": "https://…",
  "specs": { "vram": "12GB GDDR6X", "tdp": "220W" },
  "msrp": 16999,
  "offers": [ Offer, … ],
  "bestOffer": Offer,
  "priceHistory": [{ "date": "2026-08-01", "price": 14899 }],
  "lowestEver": 13499,
  "discountPercent": 18,
  "isLowestEver": false,
  "rating": 4.6,
  "reviewCount": 3120,
  "updatedAt": "2026-08-29T18:04:11.000Z"
}
```

Rules the UI depends on:
- `offers` **sorted ascending by price**; `offers[0]` is rendered as BEST.
- `bestOffer` is the cheapest **in-stock** offer (compare price + shipping).
- `discountPercent` is an integer, positive when discounted.
- `msrp` may be null; then omit `discountPercent` rather than sending a fake one.
- All money fields are **numbers**, not strings.
- **Money is ZAR and VAT-inclusive.** Send the price the shopper actually pays; the UI never
  adds tax. Whole rands are preferred — `ui.js -> money()` drops cents on integers and keeps
  them on fractions, so `13999` renders as `R 13 999` and `529.99` as `R 529,99`.
- `condition` is `new | grey_import | refurbished | open_box | used`. Grey imports must never
  be returned as `new` — see `docs/SCRAPING_VS_API.md`.

## Endpoints

| Method | Path | Auth | Returns |
|---|---|---|---|
| GET | `/health` | – | `{ status, db, redis, uptime }` |
| POST | `/auth/register` | – | `{ user, token }` |
| POST | `/auth/login` | – | `{ user, token }` |
| GET | `/auth/me` | ✔ | `user` |
| POST | `/auth/logout` | ✔ | `204` |
| GET | `/deals` | – | `{ items: Product[], total, page, pageSize }` |
| GET | `/search?q=` | – | `Product[]` (bare array, max 8) |
| GET | `/products/:id` | – | `Product` (all offers, each with `history`) |
| POST | `/products/:id/refresh` | ✔ | `{ ok, refreshedAt }` |
| GET | `/watchlist` | ✔ | `{ items: Product[] }` |
| POST | `/watchlist` | ✔ | `201` — body `{ productId }` |
| DELETE | `/watchlist/:productId` | ✔ | `204` |
| GET | `/alerts` | ✔ | `{ items: AlertRule[] }` |
| POST | `/alerts` | ✔ | `AlertRule` |
| PATCH | `/alerts/:id` | ✔ | `AlertRule` |
| DELETE | `/alerts/:id` | ✔ | `204` |
| GET | `/notifications` | ✔ | `{ items: Notification[] }` |
| POST | `/notifications/read` | ✔ | `204` |
| POST | `/notifications/subscribe` | ✔ | `201` — body is `PushSubscription.toJSON()` |
| POST | `/notifications/test` | ✔ | `{ push: "ok", email: "ok", … }` |
| GET | `/settings` | ✔ | settings object |
| PUT | `/settings` | ✔ | saved settings object |

### `GET /deals` query parameters
`q`, `category`, `retailers` (comma-separated), `minDiscount`, `maxPrice`,
`inStockOnly`, `sort` (`discount|price_asc|price_desc|newest|name`), `page`, `pageSize`.

### AlertRule
```json
{
  "id": "uuid",
  "productId": "gpu-rtx-4070-super",
  "productName": "GeForce RTX 4070 SUPER 12GB",
  "productImage": "https://…",
  "type": "price_below",
  "threshold": 13000,
  "retailers": ["evetech"],
  "channels": ["push", "email"],
  "active": true,
  "createdAt": "2026-08-20T10:00:00.000Z",
  "lastTriggeredAt": null
}
```
`type` ∈ `price_below | percent_drop | any_drop | lowest_ever | back_in_stock`.
`threshold` is a price for `price_below`, a percent for `percent_drop`, `null` otherwise.
`retailers: []` means every retailer. `threshold` for `price_below` is in whole rands.

### Notification
```json
{ "id": "uuid", "productId": "gpu-…", "type": "price_below",
  "title": "RTX 4070 SUPER hit your target",
  "body": "Now R 13 999 at Evetech (was R 16 999)",
  "url": "/product.html?id=gpu-…",
  "read": false, "at": "2026-08-29T18:04:11.000Z" }
```
Note the field is **`at`**, not `createdAt` — map it in your DTO.

## Status codes the frontend reacts to

| Code | Frontend behaviour |
|---|---|
| 401 | Clears the token and redirects to `login.html`. **Never use 401 for "forbidden"** — use 403. |
| 402 | Shown as a toast; use for plan-limit messages. |
| 409 | Shown inline on the auth form (duplicate email). |
| 429 | Shown as a toast; include `Retry-After`. |
