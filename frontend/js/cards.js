/* ============================================================
   DisNotify — cards.js
   Shared product-card renderer used by Deals, Watchlist, Trends.
   ============================================================ */
import { icon } from './icons.js';
import { esc, money, sparkline, timeAgo, toast } from './ui.js';
import * as store from './store.js';
import * as api from './api.js';

export function dealCard(p) {
  const o = p.bestOffer;
  const watched = store.isWatched(p.id);
  const hot = p.discountPercent >= 25;
  const badge = p.isLowestEver
    ? '<span class="badge badge-deal badge-abs">ALL-TIME LOW</span>'
    : hot ? `<span class="badge badge-hot badge-abs">-${p.discountPercent}%</span>`
          : p.discountPercent > 0 ? `<span class="badge badge-deal badge-abs">-${p.discountPercent}%</span>` : '';

  return `<article class="deal" data-id="${esc(p.id)}">
    <a class="deal-media" href="product.html?id=${encodeURIComponent(p.id)}" aria-label="${esc(p.name)}">
      ${badge}
      <img src="${p.image}" alt="" loading="lazy" decoding="async">
    </a>
    <button class="deal-watch ${watched ? 'on' : ''}" data-watch="${esc(p.id)}"
            aria-label="${watched ? 'Remove from watchlist' : 'Add to watchlist'}"
            aria-pressed="${watched}">${icon('heart', 16)}</button>
    <div class="deal-body">
      <div class="tiny faint up">${esc(p.brand)}</div>
      <a class="deal-title clamp-2" href="product.html?id=${encodeURIComponent(p.id)}">${esc(p.name)}</a>
      ${sparkline(p.priceHistory)}
      <div class="deal-prices">
        <span class="price-now">${money(o.price)}</span>
        ${p.msrp > o.price ? `<span class="price-was">${money(p.msrp)}</span>` : ''}
      </div>
      <div class="deal-foot">
        <span class="badge" title="Cheapest of ${p.offers.length} retailers">
          <i class="retailer-dot" style="background:${o.color}"></i>${esc(o.retailer)}</span>
        <span class="tiny ${o.inStock ? 'muted' : 'text-bad'}">${o.inStock ? timeAgo(o.lastChecked) : 'Out of stock'}</span>
      </div>
    </div>
  </article>`;
}

/** Delegated click handling for every heart button inside `root`. */
export function wireWatchButtons(root = document) {
  root.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-watch]');
    if (!btn) return;
    e.preventDefault();
    const id = btn.dataset.watch;
    const nowOn = store.toggleWatch(id);
    btn.classList.toggle('on', nowOn);
    btn.setAttribute('aria-pressed', String(nowOn));
    try {
      nowOn ? await api.addToWatchlist(id) : await api.removeFromWatchlist(id);
    } catch (err) { console.error(err); }
    toast(nowOn ? 'Added to watchlist' : 'Removed from watchlist',
          nowOn ? 'We will track every retailer for this item.' : '');
  });
}
