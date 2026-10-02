/* ============================================================
   DisNotify — layout.js
   Renders the app shell (brand bar, sidebar, top bar, mobile
   tab bar) into every page so navigation lives in ONE place.

   Each page calls:  mountShell('deals')
   ============================================================ */
import { icon } from './icons.js';
import { $, esc, money, initTheme, toggleTheme, timeAgo, toast } from './ui.js';
import * as api from './api.js';
import * as store from './store.js';
import { CONFIG } from './config.js';

const NAV = [
  { id: 'deals',     href: 'index.html',     label: 'Deals',     ic: 'tag' },
  { id: 'watchlist', href: 'watchlist.html', label: 'Watchlist', ic: 'heart' },
  { id: 'alerts',    href: 'alerts.html',    label: 'Alerts',    ic: 'bell' },
  { id: 'trends',    href: 'trends.html',    label: 'Trends',    ic: 'chart' },
  { id: 'settings',  href: 'settings.html',  label: 'Settings',  ic: 'settings' },
];

export function mountShell(active) {
  initTheme();
  const app = $('.app');
  if (!app) return console.error('layout.js: no .app element on this page');

  const user = store.getUser();
  const watchCount = store.getWatchlist().length;
  const alertCount = store.getAlerts().filter(a => a.active !== false).length;
  const counts = { watchlist: watchCount, alerts: alertCount };

  const navHtml = NAV.map(n => `
    <a class="nav-item ${n.id === active ? 'active' : ''}" href="${n.href}">
      ${icon(n.ic, 18)}<span>${n.label}</span>
      ${counts[n.id] ? `<span class="count">${counts[n.id]}</span>` : ''}
    </a>`).join('');

  const brand = `<div class="brandbar">
      <div class="brand-logo">D</div>
      <div class="brand-name">Dis<span>Notify</span></div>
    </div>`;

  app.insertAdjacentHTML('afterbegin', `
    ${brand}
    <header class="topbar">
      <button class="btn btn-icon btn-ghost hidden" id="menuBtn" aria-label="Open menu">${icon('menu', 20)}</button>
      <div class="search">
        ${icon('search', 17)}
        <input class="input" id="globalSearch" type="search" placeholder="Search GPUs, consoles, gaming gear…"
               autocomplete="off" aria-label="Search products">
        <div class="pop hidden" id="searchPop"></div>
      </div>
      <div class="grow"></div>
      <span class="badge ${CONFIG.USE_MOCK ? 'badge-warn' : 'badge-deal'}" id="modePill"
            title="${CONFIG.USE_MOCK ? 'Frontend is running on mock data' : 'Connected to backend'}">
        ${CONFIG.USE_MOCK ? 'MOCK' : 'LIVE'}</span>
      <div class="pos-rel">
        <button class="btn btn-icon btn-ghost pos-rel" id="bellBtn" aria-label="Notifications">
          ${icon('bell', 19)}<span class="dot-badge hidden" id="bellDot"></span>
        </button>
        <div class="pop hidden" id="notifPop"></div>
      </div>
      <button class="btn btn-icon btn-ghost" id="themeBtn" aria-label="Toggle theme">${icon('moon', 19)}</button>
      <a class="btn btn-icon btn-ghost" href="${user ? 'settings.html' : 'login.html'}"
         aria-label="Account">${icon('user', 19)}</a>
    </header>
    <aside class="sidebar" id="sidebar">
      ${brand}
      <nav>${navHtml}</nav>
      <div class="nav-label">Shortcuts</div>
      <a class="nav-item" href="index.html?filter=hot">${icon('bolt', 18)}<span>Hot right now</span></a>
      <a class="nav-item" href="index.html?filter=lowest">${icon('arrowDown', 18)}<span>All-time lows</span></a>
      <div class="sidebar-foot">
        ${user
          ? `<div class="card" style="padding:12px">
               <div class="row"><div class="brand-logo" style="width:28px;height:28px;font-size:12px">${esc((user.name || 'U')[0].toUpperCase())}</div>
               <div class="grow truncate"><div class="small bold truncate">${esc(user.name || 'You')}</div>
               <div class="tiny faint truncate">${esc(user.email || '')}</div></div>
               <button class="btn btn-icon btn-sm btn-ghost" id="logoutBtn" aria-label="Log out">${icon('logout', 15)}</button></div>
             </div>`
          : `<a class="btn btn-primary btn-block" href="login.html">Sign in</a>`}
      </div>
    </aside>
    <div class="scrim" id="scrim"></div>
    <nav class="tabbar">
      ${NAV.filter(n => n.id !== 'trends').map(n => `
        <a class="tab ${n.id === active ? 'active' : ''}" href="${n.href}">${icon(n.ic, 21)}<span>${n.label}</span></a>`).join('')}
    </nav>`);

  wireShell();
}

function wireShell() {
  /* --- mobile drawer --- */
  const sidebar = $('#sidebar'), scrim = $('#scrim'), menuBtn = $('#menuBtn');
  const setDrawer = (open) => { sidebar.classList.toggle('open', open); scrim.classList.toggle('open', open); };
  const syncMenuBtn = () => menuBtn.classList.toggle('hidden', window.innerWidth >= 1024);
  syncMenuBtn();
  addEventListener('resize', () => { syncMenuBtn(); if (innerWidth >= 1024) setDrawer(false); });
  menuBtn.onclick = () => setDrawer(!sidebar.classList.contains('open'));
  scrim.onclick = () => setDrawer(false);

  /* --- theme --- */
  const themeBtn = $('#themeBtn');
  const paintThemeIcon = () => {
    themeBtn.innerHTML = document.documentElement.dataset.theme === 'light' ? iconMoon() : iconSun();
  };
  themeBtn.onclick = () => { toggleTheme(); paintThemeIcon(); };
  paintThemeIcon();

  /* --- logout --- */
  $('#logoutBtn')?.addEventListener('click', () => {
    api.logout();
    toast('Signed out', 'See you next deal.');
    setTimeout(() => location.href = 'login.html', 600);
  });

  wireSearch();
  wireNotifications();
}

/* lazy icon helpers (avoid importing twice) */
function iconSun()  { return '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/></svg>'; }
function iconMoon() { return '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>'; }

/* --- global search with debounce + dropdown --- */
function wireSearch() {
  const input = $('#globalSearch'), pop = $('#searchPop');
  if (!input) return;
  let timer;

  const close = () => pop.classList.add('hidden');

  input.addEventListener('input', () => {
    clearTimeout(timer);
    const term = input.value.trim();
    if (term.length < 2) return close();
    timer = setTimeout(async () => {
      try {
        const results = await api.searchProducts(term);
        pop.innerHTML = results.length
          ? results.map(p => `<a class="pop-item" href="product.html?id=${encodeURIComponent(p.id)}">
               <img class="thumb-sm" src="${p.image}" alt="">
               <div class="grow"><div class="small bold clamp-2">${esc(p.name)}</div>
               <div class="tiny muted">${esc(p.brand)} · best ${p.bestOffer.retailer}</div></div>
               <div class="small bold nowrap">${money(p.bestOffer.price)}</div></a>`).join('')
          : '<div class="pop-item small muted">No matches</div>';
        pop.classList.remove('hidden');
      } catch (e) { console.error(e); }
    }, 220);
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') { input.blur(); close(); }
    if (e.key === 'Enter' && input.value.trim())
      location.href = 'index.html?q=' + encodeURIComponent(input.value.trim());
  });

  document.addEventListener('click', e => { if (!e.target.closest('.search')) close(); });

  /* "/" focuses search, like GitHub */
  addEventListener('keydown', e => {
    if (e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); input.focus(); }
  });
}

/* --- notification bell --- */
async function wireNotifications() {
  const btn = $('#bellBtn'), pop = $('#notifPop'), dot = $('#bellDot');
  if (!btn) return;

  const paint = async () => {
    const { items } = await api.getNotifications();
    const unread = items.filter(n => !n.read).length;
    dot.classList.toggle('hidden', unread === 0);
    pop.innerHTML = `
      <div class="card-head" style="padding:12px 14px">
        <strong class="small">Notifications</strong>
        <button class="btn btn-sm btn-ghost" id="readAll">Mark all read</button>
      </div>
      ${items.length ? items.slice(0, 8).map(n => `
        <a class="pop-item ${n.read ? '' : 'unread'}" href="${n.productId ? 'product.html?id=' + n.productId : '#'}">
          <div class="grow"><div class="small bold">${esc(n.title)}</div>
            <div class="tiny muted">${esc(n.body)}</div>
            <div class="tiny faint mt-0">${timeAgo(n.at)}</div></div></a>`).join('')
        : '<div class="pop-item small muted">Nothing yet — create an alert to get pinged.</div>'}
      <a class="pop-item small bold center" href="alerts.html">Manage alerts</a>`;
    pop.querySelector('#readAll')?.addEventListener('click', async (e) => {
      e.preventDefault(); e.stopPropagation();
      await api.markNotificationsRead(); paint();
    });
  };

  btn.onclick = async (e) => {
    e.stopPropagation();
    pop.classList.toggle('hidden');
    if (!pop.classList.contains('hidden')) await paint();
  };
  document.addEventListener('click', e => { if (!e.target.closest('.pos-rel')) pop.classList.add('hidden'); });

  const { items } = await api.getNotifications();
  dot.classList.toggle('hidden', items.filter(n => !n.read).length === 0);
}
