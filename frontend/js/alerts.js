/* ============================================================
   DisNotify — alerts.js  (page controller for alerts.html)
   ============================================================ */
import { mountShell } from './layout.js';
import { ALERT_TYPES, retailerById } from './config.js';
import { icon } from './icons.js';
import { $, $$, esc, money, timeAgo, toast, emptyState, openModal, closeModal } from './ui.js';
import { openAlertModal } from './alert-modal.js';
import * as api from './api.js';
import * as store from './store.js';

mountShell('alerts');

const list = $('#ruleList'), feed = $('#feed'), stats = $('#statRow');

$('#newAlertBtn').addEventListener('click', pickProduct);
$('#markRead').addEventListener('click', async () => { await api.markNotificationsRead(); renderFeed(); });

render();

async function render() { await Promise.all([renderRules(), renderFeed()]); }

async function renderRules() {
  const { items } = await api.getAlerts();
  $('#ruleCount').textContent = `${items.length} rule${items.length === 1 ? '' : 's'}`;

  stats.innerHTML = [
    ['Active rules', items.filter(a => a.active !== false).length, ''],
    ['Paused', items.filter(a => a.active === false).length, ''],
    ['Triggered', store.getNotifications().length, 'all time'],
    ['Unread', store.unreadCount(), 'notifications'],
  ].map(([l, v, d]) => `<div class="stat"><div class="label">${l}</div>
      <div class="value">${v}</div><div class="delta muted">${d}</div></div>`).join('');

  if (!items.length) {
    list.innerHTML = emptyState(icon('bell', 26), 'No alert rules yet',
      'Create one and DisNotify will watch every retailer for you around the clock.',
      '<button class="btn btn-primary mt-2" id="emptyNew">Create your first alert</button>');
    $('#emptyNew')?.addEventListener('click', pickProduct);
    return;
  }

  list.innerHTML = items.map(a => {
    const t = ALERT_TYPES.find(x => x.id === a.type) || { label: a.type };
    const cond = a.type === 'percent_drop' ? `${t.label} ${a.threshold}%`
               : a.threshold ? `${t.label} ${money(a.threshold)}` : t.label;
    const rets = a.retailers?.length
      ? a.retailers.map(r => `<span class="badge"><i class="retailer-dot" style="background:${retailerById(r).color}"></i>${esc(retailerById(r).name)}</span>`).join(' ')
      : '<span class="badge">All retailers</span>';
    return `<div class="setting-row" style="padding:14px 18px" data-rule="${a.id}">
      <img class="thumb-sm" src="${a.productImage || ''}" alt="">
      <div class="grow" style="min-width:0">
        <a class="small bold clamp-2" href="product.html?id=${encodeURIComponent(a.productId)}">${esc(a.productName)}</a>
        <div class="tiny muted mt-0">${esc(cond)}</div>
        <div class="row wrap mt-1" style="gap:6px">${rets}
          ${(a.channels || []).map(c => `<span class="badge badge-info">${esc(c)}</span>`).join('')}</div>
      </div>
      <label class="switch" title="Pause / resume">
        <input type="checkbox" data-toggle="${a.id}" ${a.active !== false ? 'checked' : ''}><span class="track"></span></label>
      <button class="btn btn-icon btn-sm btn-ghost" data-edit="${a.id}" aria-label="Edit">${icon('settings', 15)}</button>
      <button class="btn btn-icon btn-sm btn-ghost" data-del="${a.id}" aria-label="Delete">${icon('trash', 15)}</button>
    </div>`;
  }).join('');

  $$('[data-toggle]').forEach(el => el.addEventListener('change', async () => {
    await api.updateAlert(el.dataset.toggle, { active: el.checked });
    store.toggleAlert(el.dataset.toggle);
    toast(el.checked ? 'Alert resumed' : 'Alert paused');
  }));
  $$('[data-del]').forEach(el => el.addEventListener('click', async () => {
    await api.deleteAlert(el.dataset.del);
    toast('Alert deleted'); render();
  }));
  $$('[data-edit]').forEach(el => el.addEventListener('click', async () => {
    const rule = (await api.getAlerts()).items.find(a => a.id === el.dataset.edit);
    const product = await api.getProduct(rule.productId);
    openAlertModal(product, rule, render);
  }));
}

async function renderFeed() {
  const { items } = await api.getNotifications();
  feed.innerHTML = items.length
    ? items.map(n => `<div class="pop-item ${n.read ? '' : 'unread'}">
        <div class="grow"><div class="small bold">${esc(n.title)}</div>
          <div class="tiny muted">${esc(n.body)}</div></div>
        <div class="tiny faint nowrap">${timeAgo(n.at)}</div></div>`).join('')
    : '<div class="empty small">No alerts have fired yet.</div>';
}

/* Choose which product a new rule applies to. */
async function pickProduct() {
  const { items } = await api.getDeals({ pageSize: 100 });
  openModal(`
    <div class="card-head"><h2>Pick a product</h2>
      <button class="btn btn-icon btn-sm btn-ghost" data-close>${icon('x', 16)}</button></div>
    <div class="card-body">
      <input class="input mb-2" id="pickSearch" placeholder="Filter products…" autocomplete="off">
      <div id="pickList" style="max-height:52vh;overflow:auto">
        ${items.map(p => `<button class="pop-item" style="width:100%;text-align:left;background:none;border:0;cursor:pointer" data-pick="${p.id}">
          <img class="thumb-sm" src="${p.image}" alt="">
          <div class="grow"><div class="small bold clamp-2">${esc(p.name)}</div>
            <div class="tiny muted">${money(p.bestOffer.price)} at ${esc(p.bestOffer.retailer)}</div></div></button>`).join('')}
      </div>
    </div>`, { onMount: box => {
      box.addEventListener('click', async e => {
        if (e.target.closest('[data-close]')) return closeModal();
        const b = e.target.closest('[data-pick]'); if (!b) return;
        const product = items.find(p => p.id === b.dataset.pick);
        closeModal();
        openAlertModal(product, null, render);
      });
      $('#pickSearch', box).addEventListener('input', e => {
        const s = e.target.value.toLowerCase();
        $$('[data-pick]', box).forEach(el => el.classList.toggle('hidden', !el.textContent.toLowerCase().includes(s)));
      });
    }});
}
