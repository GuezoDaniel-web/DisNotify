/* ============================================================
   DisNotify — scrapers/storefront-platforms.js
   THE BIGGEST SHORTCUT IN THIS PROJECT. Read this before writing a
   single CSS selector for any SA retailer.

   Most South African tech stores are not bespoke builds — they run on
   Shopify, WooCommerce or Magento. Each of those platforms exposes
   structured product data by default, and reading it is enormously
   more reliable than parsing rendered HTML.

   ── STEP 1: IDENTIFY THE PLATFORM ──────────────────────────
   Fetch any product page and look for:
     Shopify      'cdn.shopify.com' in asset URLs; a Shopify-* header
     WooCommerce  '/wp-content/plugins/woocommerce/' in the markup
     Magento      '/static/version…/frontend/' paths; 'Magento_' modules
     Custom       none of the above -> fall back to selectors

   ── STEP 2: USE THE PLATFORM'S OWN JSON ────────────────────
   Shopify
     <product-url>.json           single product, no auth
     /products.json?limit=250&page=N   paginated catalogue
     These are documented, public, first-party endpoints. Fields:
     variants[].price, variants[].available, variants[].sku, barcode.
     `barcode` is the EAN — the single most valuable field you can get
     for services/matching.js. Take it every time it is present.

   WooCommerce
     /wp-json/wc/store/products?per_page=100     Store API, public
     /wp-json/wc/store/products/<id>
     (The /wc/v3/ admin API needs keys; the Store API does not.)

   Magento
     Product pages embed a JSON config for price and stock. Look for
     the x-magento-init script block. Some stores also expose
     /rest/V1/products but usually behind auth.

   ── STEP 3: JSON-LD, THEN SELECTORS ────────────────────────
   If the platform endpoints are unavailable, try
   <script type="application/ld+json"> before touching CSS selectors.
   Selectors are the last resort, always.

   ── FUNCTIONS TO WRITE ─────────────────────────────────────
   detectPlatform(html, headers) -> 'shopify' | 'woocommerce' | 'magento' | 'custom'
   fetchShopifyProduct(url)      -> raw product JSON
   fetchWooProduct(baseUrl, slug)-> raw product JSON
   toOffer(platform, raw)        -> the standard shape

   ── STILL BE POLITE ────────────────────────────────────────
   A public JSON endpoint is not an invitation to hammer it. Same rate
   limits, same caching, same User-Agent, same circuit breaker as any
   other request in this folder. And do not paginate the entire
   /products.json catalogue of a small store daily just because you can
   — pull what you track.
   ============================================================ */
throw new Error('scrapers/storefront-platforms.js is a scaffold.');
