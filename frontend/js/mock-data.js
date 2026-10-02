/* ============================================================
   DisNotify — mock-data.js
   Fake but realistically-shaped data so the UI is fully usable
   before the backend exists.

   Prices are ZAR and VAT-INCLUSIVE, which is how South African
   retailers advertise them — the number shown is the number paid.
   Do not add 15% anywhere in the UI.

   >>> THIS OBJECT SHAPE IS THE API CONTRACT. <<<
   Your backend must return exactly these fields — see
   docs/API_CONTRACT.md. Delete this file once the API is live.
   ============================================================ */
import { RETAILERS } from './config.js';

/* Placeholder artwork: inline SVG, so nothing loads from the network. */
export function placeholder(label, tint = '#2ee6a8') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180">
    <rect width="240" height="180" fill="#18202c"/>
    <rect x="46" y="42" width="148" height="96" rx="10" fill="none" stroke="${tint}" stroke-opacity=".45" stroke-width="2"/>
    <text x="120" y="98" font-family="system-ui,sans-serif" font-size="17" font-weight="700"
      fill="${tint}" fill-opacity=".8" text-anchor="middle">${label}</text></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

/* Deterministic pseudo-random so the demo looks the same on each reload. */
let seed = 42;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;

function history(end, days = 90, volatility = 0.06) {
  const out = [];
  let p = end * (1 + 0.18 + rnd() * 0.1);
  for (let i = days; i >= 0; i--) {
    p += (end - p) * 0.045 + (rnd() - 0.5) * end * volatility * 0.35;
    out.push({
      date: new Date(Date.now() - i * 864e5).toISOString().slice(0, 10),
      price: Math.max(Math.round(end * 0.85), Math.round(p)),
    });
  }
  out[out.length - 1].price = end;
  return out;
}

function offers(base, ids) {
  return ids.map((id, i) => {
    const r = RETAILERS.find(x => x.id === id);
    /* SA retail prices are whole rands and almost always end in 9. */
    const price = Math.round(base * (1 + i * 0.035 + rnd() * 0.04) / 10) * 10 - 1;
    return {
      retailerId: id,
      retailer: r.name,
      color: r.color,
      price,
      /* Most SA stores ship free above ~R500; the rest charge courier. */
      shipping: i % 3 === 0 ? 0 : [60, 99, 150][Math.floor(rnd() * 3)],
      inStock: rnd() > 0.18,
      url: 'https://example.co.za/' + id + '/product', // backend supplies the real deep link
      condition: 'new',
      lastChecked: new Date(Date.now() - rnd() * 36e5).toISOString(),
      history: history(price, 90),
    };
  });
}

function product(id, name, brand, category, msrp, best, retailerIds, specs) {
  const o = offers(best, retailerIds).sort((a, b) => a.price - b.price);
  const lowest = Math.min(...o[0].history.map(h => h.price));
  return {
    id, name, brand, category, msrp,
    image: placeholder(brand),
    specs,
    offers: o,
    bestOffer: o[0],
    priceHistory: o[0].history,
    lowestEver: Math.round(lowest),
    discountPercent: Math.round(((msrp - o[0].price) / msrp) * 100),
    isLowestEver: o[0].price <= lowest * 1.005,
    rating: Math.round((3.8 + rnd() * 1.2) * 10) / 10,
    reviewCount: Math.round(120 + rnd() * 9000),
    updatedAt: new Date(Date.now() - rnd() * 18e5).toISOString(),
  };
}

export const MOCK_PRODUCTS = [
  product('gpu-4070s', 'GeForce RTX 4070 SUPER 12GB Gaming OC', 'NVIDIA', 'gpu', 16999, 13999,
    ['evetech','wootware','rebeltech','takealot'], { vram: '12GB GDDR6X', tdp: '220W', ports: '3x DP 1.4, 1x HDMI 2.1' }),
  product('gpu-9070xt', 'Radeon RX 9070 XT 16GB Nitro+', 'AMD', 'gpu', 17999, 15799,
    ['wootware','evetech','rebeltech'], { vram: '16GB GDDR6', tdp: '304W' }),
  product('cpu-9800x3d', 'Ryzen 7 9800X3D 8-Core Processor', 'AMD', 'cpu', 12499, 10999,
    ['wootware','evetech','takealot','rebeltech'], { cores: '8C/16T', socket: 'AM5', tdp: '120W' }),
  product('cpu-14700k', 'Core i7-14700K 20-Core Processor', 'Intel', 'cpu', 9999, 7899,
    ['evetech','wootware','rebeltech'], { cores: '20C/28T', socket: 'LGA1700' }),
  product('console-ps5p', 'PlayStation 5 Pro 2TB Console', 'Sony', 'console', 18999, 17499,
    ['takealot','makro','btgames','loot'], { storage: '2TB SSD', output: '8K / 120Hz' }),
  product('console-xsx', 'Xbox Series X 1TB Digital', 'Microsoft', 'console', 11999, 9999,
    ['makro','takealot','btgames','incredible'], { storage: '1TB SSD' }),
  product('console-sw2', 'Nintendo Switch 2 Console', 'Nintendo', 'console', 11499, 10999,
    ['btgames','takealot','loot','makro'], { screen: '7.9in LCD' }),
  product('mon-aw3225', '32in 4K QD-OLED 240Hz Gaming Monitor', 'Alienware', 'monitor', 32999, 25999,
    ['evetech','takealot','incredible'], { panel: 'QD-OLED', refresh: '240Hz', res: '3840x2160' }),
  product('mon-odyssey', '49in Odyssey OLED G9 Ultrawide', 'Samsung', 'monitor', 44999, 33999,
    ['takealot','incredible','evetech','makro'], { panel: 'OLED', refresh: '240Hz', res: '5120x1440' }),
  product('ram-ddr5-32', 'Trident Z5 RGB 32GB DDR5-6400 CL32', 'G.Skill', 'ram', 4499, 3199,
    ['wootware','evetech','rebeltech'], { kit: '2x16GB', speed: 'DDR5-6400', cl: 'CL32' }),
  product('ssd-990p', '990 PRO 2TB PCIe 4.0 NVMe SSD', 'Samsung', 'storage', 5999, 3999,
    ['takealot','wootware','evetech','amazonza'], { capacity: '2TB', read: '7450 MB/s' }),
  product('ssd-t705', 'T705 4TB PCIe 5.0 NVMe SSD', 'Crucial', 'storage', 15999, 11499,
    ['wootware','rebeltech'], { capacity: '4TB', read: '14500 MB/s' }),
  product('psu-rm1000x', 'RM1000x 1000W 80+ Gold ATX 3.1', 'Corsair', 'psu', 4999, 3899,
    ['evetech','wootware','rebeltech'], { watts: '1000W', rating: '80+ Gold' }),
  product('mb-x870e', 'X870E AORUS Master ATX Motherboard', 'Gigabyte', 'motherboard', 13999, 11499,
    ['wootware','evetech'], { socket: 'AM5', wifi: 'Wi-Fi 7' }),
  product('per-gpro', 'G PRO X Superlight 2 Wireless Mouse', 'Logitech', 'peripheral', 3999, 2999,
    ['takealot','incredible','evetech','amazonza'], { weight: '60g', sensor: 'HERO 2' }),
  product('lap-legion', 'Legion Pro 7i 16in RTX 5080 Laptop', 'Lenovo', 'laptop', 74999, 59999,
    ['incredible','takealot','evetech'], { cpu: 'Core Ultra 9', gpu: 'RTX 5080', ram: '32GB' }),
  product('pre-nzxt', 'Player: Three Prime Gaming PC', 'NZXT', 'prebuilt', 89999, 78999,
    ['evetech','wootware'], { cpu: 'Ryzen 7 9800X3D', gpu: 'RTX 5080' }),
  product('per-k70', 'K70 RGB MK.2 Mechanical Keyboard', 'Corsair', 'peripheral', 3999, 2399,
    ['takealot','loot','incredible'], { switches: 'Cherry MX Red' }),
];

export const MOCK_NOTIFICATIONS = [
  { id: 'n1', productId: 'gpu-4070s', type: 'price_below', read: false,
    title: 'RTX 4070 SUPER hit your target',
    body: 'Now R 13 999 at Evetech (was R 16 999)',
    at: new Date(Date.now() - 12 * 6e4).toISOString() },
  { id: 'n2', productId: 'console-ps5p', type: 'back_in_stock', read: false,
    title: 'PS5 Pro back in stock',
    body: 'Makro - R 17 499',
    at: new Date(Date.now() - 3 * 36e5).toISOString() },
  { id: 'n3', productId: 'ssd-990p', type: 'lowest_ever', read: true,
    title: 'All-time low',
    body: 'Samsung 990 PRO 2TB - R 3 999 at Takealot',
    at: new Date(Date.now() - 26 * 36e5).toISOString() },
];
