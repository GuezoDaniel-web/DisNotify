/* ============================================================
   DisNotify — store.js
   Client-side persistence (localStorage).

   In MOCK mode this IS the database.
   Once your backend is live, api.js writes to the server and
   these helpers only cache the last known state for instant paint.
   ============================================================ */

const NS = 'dn.';
const read  = (k, fallback) => { try { return JSON.parse(localStorage.getItem(NS + k)) ?? fallback; } catch { return fallback; } };
const write = (k, v) => { localStorage.setItem(NS + k, JSON.stringify(v)); return v; };

export const uid = () => 'id_' + Math.random().toString(36).slice(2, 10);

/* ---------- Watchlist (product ids) ---------- */
export const getWatchlist   = () => read('watchlist', []);
export const isWatched      = (id) => getWatchlist().includes(id);
export function toggleWatch(id) {
  const list = getWatchlist();
  const i = list.indexOf(id);
  i === -1 ? list.push(id) : list.splice(i, 1);
  write('watchlist', list);
  return i === -1;                       // true = now watched
}

/* ---------- Alert rules ---------- */
export const getAlerts = () => read('alerts', []);
export function saveAlert(rule) {
  const list = getAlerts();
  const i = list.findIndex(a => a.id === rule.id);
  if (i === -1) list.unshift({ ...rule, id: rule.id || uid(), createdAt: new Date().toISOString() });
  else list[i] = { ...list[i], ...rule };
  return write('alerts', list);
}
export const deleteAlert = (id) => write('alerts', getAlerts().filter(a => a.id !== id));
export function toggleAlert(id) {
  const list = getAlerts();
  const a = list.find(x => x.id === id);
  if (a) a.active = !a.active;
  write('alerts', list);
  return a?.active;
}

/* ---------- Notification feed ---------- */
export const getNotifications = () => read('notifications', []);
export const pushNotification = (n) =>
  write('notifications', [{ id: uid(), read: false, at: new Date().toISOString(), ...n }, ...getNotifications()].slice(0, 50));
export const markAllRead = () => write('notifications', getNotifications().map(n => ({ ...n, read: true })));
export const unreadCount = () => getNotifications().filter(n => !n.read).length;

/* ---------- User settings ---------- */
export const DEFAULT_SETTINGS = {
  channels:       { push: true, email: true, discord: false, sms: false },
  email:          '',
  discordWebhook: '',
  phone:          '',
  quietHours:     { enabled: false, from: '23:00', to: '07:00' },
  minDiscount:    10,          // ignore deals under this %
  region:         'ZA',
  currency:       'ZAR',
  retailers:      [],          // [] = all enabled
  digest:         'instant',   // instant | hourly | daily
};
export const getSettings  = () => ({ ...DEFAULT_SETTINGS, ...read('settings', {}) });
export const saveSettings = (patch) => write('settings', { ...getSettings(), ...patch });

/* ---------- Session ---------- */
export const getToken  = () => localStorage.getItem(NS + 'token');
export const setToken  = (t) => t ? localStorage.setItem(NS + 'token', t) : localStorage.removeItem(NS + 'token');
export const getUser   = () => read('user', null);
export const setUser   = (u) => u ? write('user', u) : localStorage.removeItem(NS + 'user');
export const isLoggedIn = () => Boolean(getUser());
export function logout() { setToken(null); setUser(null); }
