-- ============================================================
-- DisNotify — PostgreSQL schema
--
-- This file IS complete and runnable: `npm run migrate`.
-- It is the contract every other file depends on, so it is given
-- to you finished. Everything that USES it is still yours to write.
--
-- Design notes:
--  * `products` is the canonical item ("RTX 4070 SUPER 12GB").
--  * `offers` is one row per (product, retailer) — the live price.
--  * `price_history` is append-only; never UPDATE it. It powers the
--    charts, the "all-time low" badge, and percent-drop alerts.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;      -- fuzzy product-name matching

-- ---------- users ----------
CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          CITEXT UNIQUE NOT NULL,
  password_hash  TEXT NOT NULL,
  name           TEXT,
  plan           TEXT NOT NULL DEFAULT 'free',   -- free | pro
  settings       JSONB NOT NULL DEFAULT '{}',    -- mirrors frontend store.js DEFAULT_SETTINGS
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- catalogue ----------
CREATE TABLE IF NOT EXISTS products (
  id           TEXT PRIMARY KEY,                 -- slug: 'gpu-rtx-4070-super'
  name         TEXT NOT NULL,
  brand        TEXT,
  category     TEXT NOT NULL,                    -- must match CATEGORIES in frontend/js/config.js
  image_url    TEXT,
  msrp         NUMERIC(10,2),
  specs        JSONB NOT NULL DEFAULT '{}',
  ean          TEXT,                             -- barcode: the single best cross-retailer key
  upc          TEXT,
  mpn          TEXT,                             -- manufacturer part number: second best key
  search_vector TEXT,                            -- lowercased name+brand, for pg_trgm matching
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS products_category_idx ON products (category);
CREATE INDEX IF NOT EXISTS products_trgm_idx ON products USING gin (search_vector gin_trgm_ops);
CREATE INDEX IF NOT EXISTS products_ean_idx ON products (ean) WHERE ean IS NOT NULL;

CREATE TABLE IF NOT EXISTS retailers (
  id        TEXT PRIMARY KEY,                    -- 'newegg'
  name      TEXT NOT NULL,
  region    TEXT NOT NULL DEFAULT 'ZA',
  source    TEXT NOT NULL,                       -- api | scrape | feed
  color     TEXT,
  base_url  TEXT,
  enabled   BOOLEAN NOT NULL DEFAULT true,
  -- politeness controls read by scrapers/base-scraper.js
  rate_limit_per_min INT NOT NULL DEFAULT 10,
  last_error TEXT,
  last_error_at TIMESTAMPTZ
);

-- ---------- live prices ----------
CREATE TABLE IF NOT EXISTS offers (
  id            BIGSERIAL PRIMARY KEY,
  product_id    TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  retailer_id   TEXT NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
  price         NUMERIC(10,2),
  shipping      NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency      TEXT NOT NULL DEFAULT 'ZAR',
  in_stock      BOOLEAN NOT NULL DEFAULT false,
  condition     TEXT NOT NULL DEFAULT 'new',
  -- new | grey_import | refurbished | open_box | used
  -- grey_import matters in SA: genuine goods, unofficial channel,
  -- cheaper, usually no local warranty. Never rank it as 'new'.
  url           TEXT NOT NULL,                   -- affiliate deep link goes here
  sku           TEXT,
  last_checked  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, retailer_id, condition)
);
CREATE INDEX IF NOT EXISTS offers_product_idx ON offers (product_id, price);
CREATE INDEX IF NOT EXISTS offers_stale_idx ON offers (last_checked);

CREATE TABLE IF NOT EXISTS price_history (
  id          BIGSERIAL PRIMARY KEY,
  product_id  TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  retailer_id TEXT NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
  price       NUMERIC(10,2) NOT NULL,
  in_stock    BOOLEAN NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS price_history_lookup_idx
  ON price_history (product_id, retailer_id, recorded_at DESC);

-- ---------- user-facing objects ----------
CREATE TABLE IF NOT EXISTS watchlist (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS alert_rules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id   TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,        -- price_below | percent_drop | any_drop | lowest_ever | back_in_stock
  threshold    NUMERIC(10,2),        -- price for price_below, percent for percent_drop, NULL otherwise
  retailers    TEXT[] NOT NULL DEFAULT '{}',   -- empty array = every retailer
  channels     TEXT[] NOT NULL DEFAULT '{push}',
  active       BOOLEAN NOT NULL DEFAULT true,
  cooldown_min INT NOT NULL DEFAULT 360,       -- do not re-fire within this many minutes
  last_triggered_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS alert_rules_product_idx ON alert_rules (product_id) WHERE active;

CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rule_id     UUID REFERENCES alert_rules(id) ON DELETE SET NULL,
  product_id  TEXT REFERENCES products(id) ON DELETE SET NULL,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  url         TEXT,
  read        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint   TEXT UNIQUE NOT NULL,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- operations ----------
-- One row per scrape/API attempt. Without this you cannot tell
-- "the price is unchanged" from "our scraper silently broke".
CREATE TABLE IF NOT EXISTS scrape_log (
  id          BIGSERIAL PRIMARY KEY,
  retailer_id TEXT NOT NULL,
  product_id  TEXT,
  ok          BOOLEAN NOT NULL,
  http_status INT,
  duration_ms INT,
  error       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS scrape_log_recent_idx ON scrape_log (retailer_id, created_at DESC);

-- ---------- seed the retailers the frontend already knows about ----------
-- South African retailers. `source` mirrors RETAILERS in
-- frontend/js/config.js -- keep the two lists in sync.
INSERT INTO retailers (id, name, region, source, color, base_url) VALUES
  ('takealot',   'Takealot',     'ZA', 'feed',   '#00a8e1', 'https://www.takealot.com'),
  ('evetech',    'Evetech',      'ZA', 'scrape', '#e02424', 'https://www.evetech.co.za'),
  ('wootware',   'Wootware',     'ZA', 'scrape', '#f47b20', 'https://www.wootware.co.za'),
  ('rebeltech',  'Rebel Tech',   'ZA', 'scrape', '#9b30d9', 'https://www.rebeltech.co.za'),
  ('makro',      'Makro',        'ZA', 'scrape', '#e30613', 'https://www.makro.co.za'),
  ('incredible', 'Incredible',   'ZA', 'scrape', '#f5821f', 'https://www.incredible.co.za'),
  ('amazonza',   'Amazon.co.za', 'ZA', 'api',    '#ff9900', 'https://www.amazon.co.za'),
  ('loot',       'Loot',         'ZA', 'scrape', '#7ac143', 'https://www.loot.co.za'),
  ('btgames',    'BT Games',     'ZA', 'scrape', '#1b9e4b', 'https://www.btgames.co.za')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- THINGS YOU STILL HAVE TO DECIDE / ADD YOURSELF
--
-- 1. `CITEXT` needs `CREATE EXTENSION citext;` — add it above the
--    users table if your Postgres does not have it enabled.
-- 2. Retention: price_history grows ~1 row per product per retailer
--    per check. At 5k products x 5 retailers x hourly that is 600k
--    rows/day. Write a monthly rollup job (jobs/cleanup.js) that
--    collapses rows older than 90 days into one row per day.
-- 3. If you outgrow a single Postgres, price_history is the table to
--    move to TimescaleDB or ClickHouse first.
-- 4. Add a `deleted_at` column instead of hard-deleting products so
--    old notifications keep resolving to something.
-- 5. ZAR only for now. `currency` exists on offers so you CAN add
--    other regions later, but do not compare across currencies --
--    a converted price is an estimate, and an estimate must never
--    win a "best price" comparison. If you add FX, store the rate
--    and its timestamp on the offer row.
-- 6. POPIA: users.email, settings->phone and push_subscriptions are
--    personal information under South African law. You need a lawful
--    basis to hold them, a way to export them on request, and a real
--    delete (not a soft flag) when a user asks. Plan the delete path
--    now -- retrofitting it across 6 tables later is miserable.
-- ============================================================
