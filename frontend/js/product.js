/* ============================================================
   DisNotify — product.js   (page controller for product.html)
   Price comparison + history + alert creation.
   ============================================================ */
import { mountShell } from './layout.js';
import { icon } from './icons.js';
import { $, $$, esc, money, timeAgo, toast, emptyState } from './ui.js';
import { renderPriceChart } from './chart.js';
import { openAlertModal } from './alert-modal.js';
import * as api from './api.js';
import * as store from './store.js';

mountShell('deals');

const id = new URLSearchParams(location.search).get('id');
const root = $('#productRoot');
let product = null;
let range = 90;

init();

async function init() {
  if (!id) { root.innerHTML = emptyState(icon('info', 26), 'No product selected', 'Open a product from the deals grid.'); return; }
  root.innerHTML = '<div class="center" style="padding:80px"><div class="spinner"></div></div>';
  try {
    product = await api.getProduct(id);
    render();
  } catch (e) {
    root.innerHTML = emptyState(icon('info', 26), 'Product not found', e.message,
      '<a class="btn btn-primary mt-2" href="index.html">Back to deals</a>');
  }
}

function render() {
  const p = product;
  const best = p.offers[0];
  const watched = store.isWatched(p.id);
  const avg = p.priceHistory.reduce((s, h) => s + h.price, 0) / p.priceHistory.length;

  root.innerHTML = `
    <a class="small muted row mb-2" href="index.html" style="gap:6px">${icon('chevron', 14)} Back to deals</a>

    <div class="split">
      <!-- ============ LEFT: identity + comparison ============ -->
      <div>
        <div class="card">
          <div class="card-body row wrap" style="gap:20px;align-items:flex-start">
            <img src="${p.image}" alt="" style="width:180px;border-radius:var(--r-md);background:var(--surface-2)">
            <div class="grow" style="min-width:220px">
              <div class="tiny faint up">${esc(p.brand)} · ${esc(p.category)}</div>
              <h1 class="mt-1">${esc(p.name)}</h1>
              <div class="row wrap mt-2" style="gap:8px">
                ${p.isLowestEver ? '<span class="badge badge-deal">ALL-TIME LOW</span>' : ''}
                ${p.discountPercent > 0 ? `<span class="badge badge-hot">-${p.discountPercent}% vs MSRP</span>` : ''}
                <span class="badge ${best.inStock ? 'badge-info' : 'badge-out'}">${best.inStock ? 'In stock' : 'Out of stock'}</span>
                <span class="badge">${p.offers.length} retailers</span>
              </div>
              <div class="row wrap mt-3" style="gap:12px;align-items:baseline">
                <span style="font-size:2rem;font-weight:750;letter-spacing:-.03em">${money(best.price)}</span>
                ${p.msrp > best.price ? `<span class="price-was">${money(p.msrp)}</span>` : ''}
                <span class="small muted">at ${esc(best.retailer)}</span>
              </div>
              <div class="row wrap mt-3" style="gap:10px">
                <a class="btn btn-primary" href="${esc(best.url)}" target="_blank" rel="noopener nofollow">
                  ${icon('external', 16)} Buy at ${esc(best.retailer)}</a>
                <button class="btn" id="alertBtn">${icon('bell', 16)} Set price alert</button>
                <button class="btn ${watched ? 'btn-primary' : ''}" id="watchBtn">${icon('heart', 16)} ${watched ? 'Watching' : 'Watch'}</button>
                <button class="btn btn-icon" id="refreshBtn" title="Re-check prices now">${icon('refresh', 16)}</button>
              </div>
            </div>
          </div>
        </div>

        <div class="card mt-3">
          <div class="card-head"><h2>Price comparison</h2>
            <span class="small muted">Updated ${timeAgo(p.updatedAt)}</span></div>
          <div class="table-wrap">
            <table class="table">
              <thead><tr><th>Retailer</th><th>Price</th><th>Shipping</th><th>Total</th><th>Stock</th><th>Checked</th><th></th></tr></thead>
              <tbody>${p.offers.map((o, i) => offerRow(o, i)).join('')}</tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ============ RIGHT: history + specs ============ -->
      <div>
        <div class="card">
          <div class="card-head"><h2>Price history</h2>
            <div class="row" style="gap:6px">
              ${[30, 90, 0].map(d => `<button class="chip btn-sm ${d === range ? 'active' : ''}" data-range="${d}">${d ? d + 'd' : 'All'}</button>`).join('')}
            </div>
          </div>
          <div class="card-body"><div id="chartHost"></div></div>
          <div class="card-body" style="border-top:1px solid var(--border-soft)">
            <div class="stat-grid" style="margin:0">
              <div class="stat"><div class="label">Lowest ever</div><div class="value">${money(p.lowestEver)}</div></div>
              <div class="stat"><div class="label">90-day average</div><div class="value">${money(Math.round(avg))}</div></div>
              <div class="stat"><div class="label">MSRP</div><div class="value">${money(p.msrp)}</div></div>
            </div>
          </div>
        </div>

        <div class="card mt-3">
          <div class="card-head"><h2>Specifications</h2></div>
          <div class="card-body">
            ${Object.entries(p.specs || {}).map(([k, v]) =>
              `<div class="setting-row"><span class="small muted up">${esc(k)}</span><span class="small bold">${esc(v)}</span></div>`).join('')
              || '<div class="small muted">No specs recorded.</div>'}
          </div>
        </div>
      </div>
    </div>`;

  drawChart();
  wire();
}

function offerRow(o, i) {
  const total = o.price + (o.shipping || 0);
  return `<tr class="${i === 0 ? 'best' : ''}">
    <td><span class="row" style="gap:8px"><i class="retailer-dot" style="background:${o.color}"></i>
      <span class="bold">${esc(o.retailer)}</span>${i === 0 ? '<span class="badge badge-deal">BEST</span>' : ''}</span></td>
    <td class="mono bold">${money(o.price)}</td>
    <td class="mono small ${o.shipping ? '' : 'text-good'}">${o.shipping ? money(o.shipping) : 'Free'}</td>
    <td class="mono">${money(total)}</td>
    <td>${o.inStock ? '<span class="badge badge-info">In stock</span>' : '<span class="badge badge-out">Out</span>'}</td>
    <td class="small muted nowrap">${timeAgo(o.lastChecked)}</td>
    <td><a class="btn btn-sm" href="${esc(o.url)}" target="_blank" rel="noopener nofollow">Go ${icon('external', 13)}</a></td>
  </tr>`;
}

function drawChart() {
  const cut = range ? Date.now() - range * 864e5 : 0;
  const series = product.offers.slice(0, 4).map(o => ({
    retailerId: o.retailerId,
    name: o.retailer,
    color: o.color,
    points: o.history.filter(h => +new Date(h.date) >= cut),
  }));
  renderPriceChart($('#chartHost'), series, { currency: undefined });
}

function wire() {
  $$('[data-range]').forEach(b => b.addEventListener('click', () => {
    range = +b.dataset.range;
    $$('[data-range]').forEach(x => x.classList.toggle('active', x === b));
    drawChart();
  }));

  $('#watchBtn').addEventListener('click', async () => {
    const on = store.toggleWatch(product.id);
    $('#watchBtn').classList.toggle('btn-primary', on);
    $('#watchBtn').innerHTML = icon('heart', 16) + (on ? ' Watching' : ' Watch');
    on ? await api.addToWatchlist(product.id) : await api.removeFromWatchlist(product.id);
    toast(on ? 'Watching this product' : 'Stopped watching');
  });

  $('#alertBtn').addEventListener('click', () => openAlertModal(product));

  $('#refreshBtn').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.innerHTML = '<span class="spinner"></span>';
    try {
      await api.refreshProduct(product.id);
      product = await api.getProduct(product.id);
      render();
      toast('Prices refreshed', 'Fetched live prices from every retailer.');
    } catch (err) {
      toast('Refresh failed', err.message, 'err');
      btn.innerHTML = icon('refresh', 16);
    }
  });
}
