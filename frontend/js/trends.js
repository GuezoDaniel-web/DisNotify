/* ============================================================
   DisNotify — trends.js  (page controller for trends.html)
   Derives everything from the deals payload — no extra endpoint
   needed until you build /api/trends.
   ============================================================ */
import { mountShell } from './layout.js';
import { CATEGORIES } from './config.js';
import { $, esc, money, pct } from './ui.js';
import { renderPriceChart } from './chart.js';
import * as api from './api.js';

mountShell('trends');

load();

async function load() {
  const { items } = await api.getDeals({ pageSize: 200 });

  /* --- headline stats --- */
  const avgDisc = items.reduce((s, p) => s + p.discountPercent, 0) / items.length;
  const lows = items.filter(p => p.isLowestEver).length;
  const oos = Math.round(100 * items.filter(p => !p.bestOffer.inStock).length / items.length);
  $('#statRow').innerHTML = [
    ['Products tracked', items.length, ''],
    ['Average discount', Math.round(avgDisc) + '%', 'vs MSRP'],
    ['At all-time low', lows, 'products'],
    ['Out of stock', oos + '%', 'of tracked offers'],
  ].map(([l, v, d]) => `<div class="stat"><div class="label">${l}</div>
      <div class="value">${v}</div><div class="delta muted">${d}</div></div>`).join('');

  /* --- category average price index over time --- */
  const palette = ['#2ee6a8', '#4f8cff', '#ffb020', '#ff5f5f', '#c084fc'];
  const cats = [...new Set(items.map(p => p.category))].slice(0, 5);
  const series = cats.map((c, i) => {
    const group = items.filter(p => p.category === c);
    const len = Math.min(...group.map(p => p.priceHistory.length));
    const points = Array.from({ length: len }, (_, d) => {
      const idx = p => p.priceHistory[p.priceHistory.length - len + d];
      const base = group.reduce((s, p) => s + idx(p).price / p.msrp, 0) / group.length;
      return { date: idx(group[0]).date, price: Math.round(base * 100) };   // index: 100 = MSRP
    });
    return { name: (CATEGORIES.find(x => x.id === c) || {}).label || c, color: palette[i % palette.length], points };
  });
  renderPriceChart($('#catChart'), series, { format: v => Math.round(v) + ' idx' });

  /* --- which retailer wins most often --- */
  const wins = {};
  items.forEach(p => { wins[p.bestOffer.retailer] = (wins[p.bestOffer.retailer] || 0) + 1; });
  const max = Math.max(...Object.values(wins));
  $('#retailerBars').innerHTML = Object.entries(wins).sort((a, b) => b[1] - a[1]).map(([name, n]) => `
    <div class="mb-2"><div class="row-between small"><span class="bold">${esc(name)}</span>
      <span class="muted">${n} best price${n === 1 ? '' : 's'}</span></div>
      <div class="bar mt-1"><i style="width:${(n / max) * 100}%"></i></div></div>`).join('');

  /* --- biggest movers --- */
  $('#moversBody').innerHTML = [...items]
    .sort((a, b) => b.discountPercent - a.discountPercent).slice(0, 12)
    .map(p => {
      const avg = p.priceHistory.reduce((s, h) => s + h.price, 0) / p.priceHistory.length;
      const vsAvg = ((p.bestOffer.price - avg) / avg) * 100;
      return `<tr><td><a class="bold" href="product.html?id=${encodeURIComponent(p.id)}">${esc(p.name)}</a></td>
        <td class="mono">${money(p.bestOffer.price)}</td>
        <td class="text-good bold">${pct(p.discountPercent)}</td>
        <td class="${vsAvg < 0 ? 'text-good' : 'text-bad'} mono">${vsAvg.toFixed(1)}%</td>
        <td><span class="badge"><i class="retailer-dot" style="background:${p.bestOffer.color}"></i>${esc(p.bestOffer.retailer)}</span></td></tr>`;
    }).join('');
}
