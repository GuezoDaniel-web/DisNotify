/* ============================================================
   DisNotify — watchlist.js  (page controller for watchlist.html)
   ============================================================ */
import { mountShell } from './layout.js';
import { icon } from './icons.js';
import { $, money, skeletonCards, emptyState } from './ui.js';
import { dealCard, wireWatchButtons } from './cards.js';
import * as api from './api.js';

mountShell('watchlist');

const grid = $('#watchGrid');
const stats = $('#statRow');

wireWatchButtons(document);
load();

async function load() {
  grid.innerHTML = skeletonCards(4);
  try {
    const { items } = await api.getWatchlist();
    if (!items.length) {
      stats.innerHTML = '';
      grid.innerHTML = emptyState(icon('heart', 26), 'Nothing on your watchlist yet',
        'Tap the heart on any deal and we will track its price at every retailer.',
        '<a class="btn btn-primary mt-2" href="index.html">Browse deals</a>');
      return;
    }
    grid.innerHTML = items.map(dealCard).join('');

    const potential = items.reduce((s, p) => s + Math.max(0, p.msrp - p.bestOffer.price), 0);
    const lows = items.filter(p => p.isLowestEver).length;
    const oos = items.filter(p => !p.bestOffer.inStock).length;
    stats.innerHTML = [
      ['Watching', items.length, 'products'],
      ['At all-time low', lows, 'right now'],
      ['Out of stock', oos, 'items'],
      ['Below MSRP by', money(potential), 'combined'],
    ].map(([l, v, d]) => `<div class="stat"><div class="label">${l}</div>
        <div class="value">${v}</div><div class="delta muted">${d}</div></div>`).join('');
  } catch (e) {
    grid.innerHTML = emptyState(icon('info', 26), 'Could not load watchlist', e.message);
  }
}

/* Re-render after a heart is toggled so removed items disappear. */
document.addEventListener('click', e => {
  if (e.target.closest('[data-watch]')) setTimeout(load, 150);
});
