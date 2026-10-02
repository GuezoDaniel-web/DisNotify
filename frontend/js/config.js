/* ============================================================
   DisNotify — config.js
   Single source of truth for environment + catalogue constants.
   ============================================================ */

export const CONFIG = {
  /* Base URL of YOUR backend (see /backend). Keep the /api suffix.
     Local dev:  http://localhost:4000/api
     Production: https://api.yourdomain.com/api                */
  API_BASE: 'http://localhost:4000/api',

  /* MOCK MODE — the whole UI runs off frontend/js/mock-data.js.
     Flip to false the moment your backend answers GET /api/health. */
  USE_MOCK: true,

  /* Public VAPID key for Web Push. Generate with:
       npx web-push generate-vapid-keys
     Paste the PUBLIC key here, put the PRIVATE key in backend/.env  */
  VAPID_PUBLIC_KEY: '',

  CURRENCY: 'ZAR',
  LOCALE: 'en-ZA',                 // renders as "R 14 999,00" — SA convention
  DEFAULT_REGION: 'ZA',            // drives which retailers are queried
  PAGE_SIZE: 24,
  REFRESH_MS: 60000,               // dashboard poll interval
};

/* Product categories — must match the `category` enum in your DB schema. */
export const CATEGORIES = [
  { id: 'all',         label: 'All' },
  { id: 'gpu',         label: 'Graphics Cards' },
  { id: 'cpu',         label: 'Processors' },
  { id: 'ram',         label: 'Memory' },
  { id: 'storage',     label: 'Storage' },
  { id: 'motherboard', label: 'Motherboards' },
  { id: 'psu',         label: 'Power Supplies' },
  { id: 'monitor',     label: 'Monitors' },
  { id: 'console',     label: 'Consoles' },
  { id: 'peripheral',  label: 'Peripherals' },
  { id: 'laptop',      label: 'Laptops' },
  { id: 'prebuilt',    label: 'Prebuilt PCs' },
];

/* Retailer registry.
   `source` documents how you will get prices for that retailer:
     'api'    -> official/affiliate API exists (preferred)
     'scrape' -> HTML scraping required (see backend/scrapers)
     'feed'   -> affiliate product feed / CSV drop                */
export const RETAILERS = [
  { id: 'takealot',   name: 'Takealot',       color: '#00a8e1', source: 'feed',   region: 'ZA' },
  { id: 'evetech',    name: 'Evetech',        color: '#e02424', source: 'scrape', region: 'ZA' },
  { id: 'wootware',   name: 'Wootware',       color: '#f47b20', source: 'scrape', region: 'ZA' },
  { id: 'rebeltech',  name: 'Rebel Tech',     color: '#9b30d9', source: 'scrape', region: 'ZA' },
  { id: 'makro',      name: 'Makro',          color: '#e30613', source: 'scrape', region: 'ZA' },
  { id: 'incredible', name: 'Incredible',     color: '#f5821f', source: 'scrape', region: 'ZA' },
  { id: 'amazonza',   name: 'Amazon.co.za',   color: '#ff9900', source: 'api',    region: 'ZA' },
  { id: 'loot',       name: 'Loot',           color: '#7ac143', source: 'scrape', region: 'ZA' },
  { id: 'btgames',    name: 'BT Games',       color: '#1b9e4b', source: 'scrape', region: 'ZA' },
];

/* Region presets. The schema and API are multi-region already; these are
   just the options the Settings page offers. */
export const REGIONS = [
  { id: 'ZA', label: 'South Africa', currency: 'ZAR' },
];

export const ALERT_TYPES = [
  { id: 'price_below',   label: 'Price drops below',    needsValue: true,  unit: 'currency' },
  { id: 'percent_drop',  label: 'Discount of at least', needsValue: true,  unit: 'percent' },
  { id: 'any_drop',      label: 'Any price drop',       needsValue: false },
  { id: 'lowest_ever',   label: 'Hits an all-time low', needsValue: false },
  { id: 'back_in_stock', label: 'Back in stock',        needsValue: false },
];

export const CHANNELS = [
  { id: 'push',    label: 'Browser push' },
  { id: 'email',   label: 'Email' },
  { id: 'discord', label: 'Discord' },
  { id: 'sms',     label: 'SMS' },
];

export const retailerById = (id) =>
  RETAILERS.find(r => r.id === id) || { id, name: id, color: '#8894a5', source: 'scrape' };

export const categoryLabel = (id) =>
  (CATEGORIES.find(c => c.id === id) || { label: id }).label;
