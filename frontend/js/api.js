/* ============================================================
   DisNotify — api.js
   THE ONLY FILE THAT TALKS TO YOUR BACKEND.

   Every function below already works in MOCK mode. When your
   backend is running, set CONFIG.USE_MOCK = false in config.js
   and these same functions hit real endpoints — no page code
   changes. Endpoint list: docs/API_CONTRACT.md
   ============================================================ */
import { CONFIG } from './config.js';
import * as store from './store.js';
import { MOCK_PRODUCTS, MOCK_NOTIFICATIONS } from './mock-data.js';

/* ---------- low-level fetch ---------- */
async function request(path, { method = 'GET', body, params } = {}) {
  const url = new URL(CONFIG.API_BASE.replace(/\/$/, '') + path, location.origin);
  if (params) Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '' && !(Array.isArray(v) && !v.length)) url.searchParams.set(k, Array.isArray(v) ? v.join(',') : v);
  });

  const token = store.getToken();
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) { store.logout(); location.href = 'login.html'; throw new Error('Session expired'); }
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `Request failed (${res.status})`);
  return res.status === 204 ? null : res.json();
}

const wait = (ms) => new Promise(r => setTimeout(r, ms));   // fake latency in mock mode

/* ============================================================
   PRODUCTS / DEALS
   ============================================================ */
export async function getDeals(q = {}) {
  if (!CONFIG.USE_MOCK) return request('/deals', { params: q });

  await wait(280);
  let items = [...MOCK_PRODUCTS];
  if (q.category && q.category !== 'all') items = items.filter(p => p.category === q.category);
  if (q.retailers?.length) items = items.filter(p => p.offers.some(o => q.retailers.includes(o.retailerId)));
  if (q.minDiscount) items = items.filter(p => p.discountPercent >= q.minDiscount);
  if (q.maxPrice) items = items.filter(p => p.bestOffer.price <= q.maxPrice);
  if (q.inStockOnly) items = items.filter(p => p.bestOffer.inStock);
  if (q.q) {
    const s = q.q.toLowerCase();
    items = items.filter(p => (p.name + ' ' + p.brand).toLowerCase().includes(s));
  }
  const sorters = {
    discount: (a, b) => b.discountPercent - a.discountPercent,
    price_asc: (a, b) => a.bestOffer.price - b.bestOffer.price,
    price_desc: (a, b) => b.bestOffer.price - a.bestOffer.price,
    newest: (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
    name: (a, b) => a.name.localeCompare(b.name),
  };
  items.sort(sorters[q.sort] || sorters.discount);

  const page = q.page || 1, size = q.pageSize || CONFIG.PAGE_SIZE;
  return { items: items.slice((page - 1) * size, page * size), total: items.length, page, pageSize: size };
}

export async function getProduct(id) {
  if (!CONFIG.USE_MOCK) return request(`/products/${encodeURIComponent(id)}`);
  await wait(200);
  const p = MOCK_PRODUCTS.find(x => x.id === id);
  if (!p) throw new Error('Product not found');
  return p;
}

export async function searchProducts(term) {
  if (!CONFIG.USE_MOCK) return request('/search', { params: { q: term } });
  await wait(150);
  const s = term.toLowerCase();
  return MOCK_PRODUCTS.filter(p => (p.name + ' ' + p.brand).toLowerCase().includes(s)).slice(0, 8);
}

/** Force the backend to re-scrape / re-poll this product right now. */
export async function refreshProduct(id) {
  if (!CONFIG.USE_MOCK) return request(`/products/${encodeURIComponent(id)}/refresh`, { method: 'POST' });
  await wait(700);
  return { ok: true, refreshedAt: new Date().toISOString() };
}

/* ============================================================
   WATCHLIST
   ============================================================ */
export async function getWatchlist() {
  if (!CONFIG.USE_MOCK) return request('/watchlist');
  await wait(180);
  const ids = store.getWatchlist();
  return { items: MOCK_PRODUCTS.filter(p => ids.includes(p.id)) };
}
export async function addToWatchlist(productId) {
  if (!CONFIG.USE_MOCK) return request('/watchlist', { method: 'POST', body: { productId } });
  return { ok: true };
}
export async function removeFromWatchlist(productId) {
  if (!CONFIG.USE_MOCK) return request(`/watchlist/${productId}`, { method: 'DELETE' });
  return { ok: true };
}

/* ============================================================
   ALERT RULES
   ============================================================ */
export async function getAlerts() {
  if (!CONFIG.USE_MOCK) return request('/alerts');
  await wait(160);
  return { items: store.getAlerts() };
}
export async function createAlert(rule) {
  if (!CONFIG.USE_MOCK) return request('/alerts', { method: 'POST', body: rule });
  return store.saveAlert(rule);
}
export async function updateAlert(id, patch) {
  if (!CONFIG.USE_MOCK) return request(`/alerts/${id}`, { method: 'PATCH', body: patch });
  return store.saveAlert({ id, ...patch });
}
export async function deleteAlert(id) {
  if (!CONFIG.USE_MOCK) return request(`/alerts/${id}`, { method: 'DELETE' });
  return store.deleteAlert(id);
}

/* ============================================================
   NOTIFICATIONS
   ============================================================ */
export async function getNotifications() {
  if (!CONFIG.USE_MOCK) return request('/notifications');
  await wait(120);
  const local = store.getNotifications();
  return { items: local.length ? local : MOCK_NOTIFICATIONS };
}
export async function markNotificationsRead() {
  if (!CONFIG.USE_MOCK) return request('/notifications/read', { method: 'POST' });
  store.markAllRead();
  return { ok: true };
}

/* Registers this browser for Web Push. The subscription object must be
   stored server-side (table: push_subscriptions) and used by
   backend/notifications/push.js when an alert fires. */
export async function subscribeToPush(subscription) {
  if (!CONFIG.USE_MOCK) return request('/notifications/subscribe', { method: 'POST', body: subscription });
  return { ok: true };
}

/* ============================================================
   SETTINGS
   ============================================================ */
export async function getSettings() {
  if (!CONFIG.USE_MOCK) return request('/settings');
  await wait(100);
  return store.getSettings();
}
export async function saveSettings(patch) {
  if (!CONFIG.USE_MOCK) return request('/settings', { method: 'PUT', body: patch });
  return store.saveSettings(patch);
}

/* Fires a test notification through every enabled channel. */
export async function sendTestNotification() {
  if (!CONFIG.USE_MOCK) return request('/notifications/test', { method: 'POST' });
  await wait(500);
  store.pushNotification({
    type: 'test', title: 'Test notification',
    body: 'If you can read this, your channels are wired up.',
  });
  return { ok: true };
}

/* ============================================================
   AUTH
   ============================================================ */
export async function login(email, password) {
  if (!CONFIG.USE_MOCK) {
    const r = await request('/auth/login', { method: 'POST', body: { email, password } });
    store.setToken(r.token); store.setUser(r.user);
    return r;
  }
  await wait(500);
  const user = { id: 'demo', email, name: email.split('@')[0], plan: 'free' };
  store.setToken('mock-token'); store.setUser(user);
  return { user, token: 'mock-token' };
}

export async function register(name, email, password) {
  if (!CONFIG.USE_MOCK) {
    const r = await request('/auth/register', { method: 'POST', body: { name, email, password } });
    store.setToken(r.token); store.setUser(r.user);
    return r;
  }
  await wait(600);
  const user = { id: 'demo', email, name, plan: 'free' };
  store.setToken('mock-token'); store.setUser(user);
  return { user, token: 'mock-token' };
}

export async function me() {
  if (!CONFIG.USE_MOCK) return request('/auth/me');
  return store.getUser();
}

export function logout() {
  store.logout();
  if (!CONFIG.USE_MOCK) request('/auth/logout', { method: 'POST' }).catch(() => {});
}

/* ============================================================
   HEALTH — used by the "Live / Mock" pill in the header
   ============================================================ */
export async function health() {
  if (CONFIG.USE_MOCK) return { status: 'mock' };
  try { return await request('/health'); } catch { return { status: 'down' }; }
}
