/* ============================================================
   DisNotify — deals.js   (page controller for index.html)
   ============================================================ */
import { mountShell } from './layout.js';
import { CATEGORIES, RETAILERS, CONFIG } from './config.js';
import { icon } from './icons.js';
import { $, $$, esc, money, skeletonCards, emptyState, toast } from './ui.js';
import { dealCard, wireWatchButtons } from './cards.js';
import * as api from './api.js';

mountShell('deals');

const params = new URLSearchParams(location.search);
const state = {
  q: params.get('q') || '',
  category: params.get('category') || 'all',
  sort: params.get('sort') || 'discount',
  retailers: [],
  minDiscount: 0,
  inStockOnly: false,
  page: 1,
  items: [],
  total: 0,
};
if (params.get('filter') === 'hot') state.minDiscount = 25;
if (params.get('filter') === 'lowest') state.sort = 'discount';

const grid   = $('#dealGrid');
const stats  = $('#statRow');
const chips  = $('#catChips');
const sortEl = $('#sortSelect');
const moreBtn= $('#loadMore');
const countEl= $('#resultCount');

/* ---------- filter UI ---------- */
chips.innerHTML = CATEGORIES.map(c =>
  `<button class="chip ${c.id === state.category ? 'active' : ''}" data-cat="${c.id}">${c.label}</button>`).join('');

$('#retailerFilters').innerHTML = RETAILERS.map(r =>
  `<label class="chip" data-ret="${r.id}">
     <input type="checkbox" value="${r.id}" style="accent-color:var(--accent)">
     <i class="retailer-dot" style="background:${r.color}"></i>${esc(r.name)}</label>`).join('');

sortEl.value = state.sort;
if (state.q) $('#globalSearch').value = state.q;

/* ---------- events ---------- */
chips.addEventListener('click', e => {
  const b = e.target.closest('[data-cat]'); if (!b) return;
  $$('.chip', chips).forEach(c => c.classList.remove('active'));
  b.classList.add('active');
  state.category = b.dataset.cat; state.page = 1; load();
});

sortEl.addEventListener('change', () => { state.sort = sortEl.value; state.page = 1; load(); });

$('#retailerFilters').addEventListener('change', () => {
  state.retailers = $$('#retailerFilters input:checked').map(i => i.value);
  $$('#retailerFilters label').forEach(l => l.classList.toggle('active', l.querySelector('input').checked));
  state.page = 1; load();
});

$('#minDiscount').addEventListener('input', e => {
  state.minDiscount = +e.target.value;
  $('#minDiscountVal').textContent = state.minDiscount + '%';
});
$('#minDiscount').addEventListener('change', () => { state.page = 1; load(); });

$('#inStockOnly').addEventListener('change', e => { state.inStockOnly = e.target.checked; state.page = 1; load(); });

$('#clearFilters').addEventListener('click', () => {
  Object.assign(state, { q: '', category: 'all', retailers: [], minDiscount: 0, inStockOnly: false, page: 1 });
  history.replaceState({}, '', location.pathname);
  $$('#retailerFilters input').forEach(i => { i.checked = false; i.closest('label').classList.remove('active'); });
  $('#minDiscount').value = 0; $('#minDiscountVal').textContent = '0%';
  $('#inStockOnly').checked = false; $('#globalSearch').value = '';
  $$('.chip', chips).forEach((c, i) => c.classList.toggle('active', i === 0));
  load();
});

moreBtn.addEventListener('click', () => { state.page++; load(true); });

$('#filterToggle')?.addEventListener('click', () => $('#filterPanel').classList.toggle('hidden'));

wireWatchButtons(document);

/* ---------- data ---------- */
async function load(append = false) {
  if (!append) grid.innerHTML = skeletonCards(8);
  moreBtn.classList.add('hidden');
  try {
    const res = await api.getDeals({
      q: state.q, category: state.category, sort: state.sort,
      retailers: state.retailers, minDiscount: state.minDiscount,
      inStockOnly: state.inStockOnly, page: state.page, pageSize: CONFIG.PAGE_SIZE,
    });
    state.items = append ? [...state.items, ...res.items] : res.items;
    state.total = res.total;
    render();
  } catch (err) {
    grid.innerHTML = emptyState(icon('info', 26), 'Could not load deals', err.message,
      '<button class="btn btn-primary mt-2" onclick="location.reload()">Retry</button>');
  }
}

function render() {
  countEl.textContent = `${state.total} product${state.total === 1 ? '' : 's'}`;
  grid.innerHTML = state.items.length
    ? state.items.map(dealCard).join('')
    : emptyState(icon('search', 26), 'No deals match those filters',
        'Try widening the discount threshold or clearing a retailer.');
  moreBtn.classList.toggle('hidden', state.items.length >= state.total);
  renderStats();
}

function renderStats() {
  const items = state.items;
  const best = items.reduce((a, b) => (a && a.discountPercent > b.discountPercent ? a : b), null);
  const saved = items.reduce((sum, p) => sum + Math.max(0, p.msrp - p.bestOffer.price), 0);
  const lows = items.filter(p => p.isLowestEver).length;
  stats.innerHTML = [
    ['Tracked deals', state.total, ''],
    ['Biggest discount', best ? `-${best.discountPercent}%` : '—', best ? best.brand : ''],
    ['All-time lows', lows, 'on this page'],
    ['Total savings', money(saved), 'vs MSRP'],
  ].map(([l, v, d]) => `<div class="stat"><div class="label">${l}</div>
      <div class="value">${v}</div><div class="delta muted">${d}</div></div>`).join('');
}

load();
setInterval(() => { if (!document.hidden && state.page === 1) load(); }, CONFIG.REFRESH_MS);

/* Filters are open by default on desktop, collapsed on small screens. */
if (window.innerWidth >= 1024) $('#filterPanel').classList.remove('hidden');
