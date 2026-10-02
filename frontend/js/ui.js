/* ============================================================
   DisNotify — ui.js
   Formatting helpers, toasts, modals, theme, SVG charts.
   Pure presentation. No network calls live here.
   ============================================================ */
import { CONFIG } from './config.js';

/* ---------- DOM shorthands ---------- */
export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function el(tag, className, html) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (html != null) n.innerHTML = html;
  return n;
}

/** Always run untrusted strings (product names from scrapers!) through this. */
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------- Formatting ---------- */
/* Whole amounts render without cents (R 14 329), fractions keep them
   (R 529,99). SA hardware pricing is almost always whole rands, and
   a screen full of ",00" is just noise. */
export const money = (n, currency = CONFIG.CURRENCY) => {
  if (n == null) return '—';
  const whole = Number.isInteger(n);
  return new Intl.NumberFormat(CONFIG.LOCALE, {
    style: 'currency', currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(n);
};

export const pct = (n) => (n == null ? '—' : `${n > 0 ? '-' : ''}${Math.abs(Math.round(n))}%`);

export function timeAgo(iso) {
  if (!iso) return '—';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  const units = [[60, 's'], [3600, 'm', 60], [86400, 'h', 3600], [604800, 'd', 86400]];
  if (diff < 60) return 'just now';
  for (const [limit, suffix, div] of units) {
    if (diff < limit) return `${Math.floor(diff / div)}${suffix} ago`;
  }
  return new Date(iso).toLocaleDateString(CONFIG.LOCALE, { month: 'short', day: 'numeric' });
}

/* ---------- Theme ---------- */
export function initTheme() {
  const saved = localStorage.getItem('dn.theme');
  const sys = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  document.documentElement.dataset.theme = saved || sys;
}
export function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('dn.theme', next);
  return next;
}

/* ---------- Toasts ---------- */
export function toast(title, msg = '', variant = '') {
  let host = $('.toasts');
  if (!host) { host = el('div', 'toasts'); document.body.appendChild(host); }
  const t = el('div', `toast ${variant}`);
  t.innerHTML = `<div class="grow"><div class="t-title">${esc(title)}</div>` +
                (msg ? `<div class="t-msg">${esc(msg)}</div>` : '') + '</div>';
  host.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(16px)'; }, 3600);
  setTimeout(() => t.remove(), 4000);
}

/* ---------- Modal ---------- */
export function openModal(html, { onMount } = {}) {
  closeModal();
  const wrap = el('div', 'modal open');
  wrap.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true">${html}</div>`;
  wrap.addEventListener('click', e => { if (e.target === wrap) closeModal(); });
  document.body.appendChild(wrap);
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', escClose);
  onMount?.(wrap);
  return wrap;
}
export function closeModal() {
  $('.modal')?.remove();
  document.body.style.overflow = '';
  document.removeEventListener('keydown', escClose);
}
function escClose(e) { if (e.key === 'Escape') closeModal(); }

/* ---------- Skeletons ---------- */
export const skeletonCards = (n = 8) =>
  Array.from({ length: n }, () => '<div class="skeleton skeleton-card"></div>').join('');

export function emptyState(iconSvg, title, body, actionHtml = '') {
  return `<div class="empty"><div class="icon">${iconSvg}</div>
    <h3>${esc(title)}</h3><p class="small">${esc(body)}</p>${actionHtml}</div>`;
}

/* ---------- Sparkline (price history mini chart) ---------- */
export function sparkline(points, { w = 200, h = 34 } = {}) {
  if (!points || points.length < 2) return '';
  const vals = points.map(p => (typeof p === 'number' ? p : p.price));
  const min = Math.min(...vals), max = Math.max(...vals), span = max - min || 1;
  const step = w / (vals.length - 1);
  const xy = vals.map((v, i) => [i * step, h - ((v - min) / span) * (h - 4) - 2]);
  const line = xy.map(([x, y], i) => (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1)).join(' ');
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  const down = vals[vals.length - 1] <= vals[0];
  const c = down ? 'var(--accent)' : 'var(--danger)';
  const uid = 'g' + Math.random().toString(36).slice(2, 8);
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <defs><linearGradient id="${uid}" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="${c}" stop-opacity=".28"/>
      <stop offset="100%" stop-color="${c}" stop-opacity="0"/></linearGradient></defs>
    <path d="${area}" fill="url(#${uid})"/>
    <path d="${line}" fill="none" stroke="${c}" stroke-width="1.8"
      stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
  </svg>`;
}
