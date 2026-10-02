/* ============================================================
   DisNotify — notifications.js
   Browser notification permission + Web Push subscription.

   ── WHAT YOU STILL NEED TO DO ──────────────────────────────
   1. npx web-push generate-vapid-keys
   2. Public key  -> CONFIG.VAPID_PUBLIC_KEY in js/config.js
      Private key -> VAPID_PRIVATE_KEY in backend/.env
   3. Implement POST /api/notifications/subscribe (backend/routes/notifications.js)
      storing { endpoint, keys.p256dh, keys.auth, userId } in the
      push_subscriptions table.
   4. Implement backend/notifications/push.js to send with the
      `web-push` npm package when an alert fires.
   Push only works over HTTPS (localhost is exempt).
   ============================================================ */
import { CONFIG } from './config.js';
import { toast } from './ui.js';
import * as api from './api.js';

/* Register the service worker (needed for push + offline shell). */
export async function registerSW() {
  if (!('serviceWorker' in navigator)) return null;
  try { return await navigator.serviceWorker.register('sw.js'); }
  catch (e) { console.warn('SW registration failed:', e); return null; }
}

export function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export const permission = () => (pushSupported() ? Notification.permission : 'unsupported');

/** Ask for permission and register a push subscription with the backend. */
export async function enablePush() {
  if (!pushSupported()) { toast('Not supported', 'This browser cannot receive push notifications.', 'warn'); return false; }

  const perm = await Notification.requestPermission();
  if (perm !== 'granted') { toast('Permission denied', 'Enable notifications in your browser settings.', 'warn'); return false; }

  const reg = await registerSW();
  if (!reg) return false;

  if (!CONFIG.VAPID_PUBLIC_KEY) {
    toast('Push not configured', 'Add VAPID_PUBLIC_KEY to js/config.js — see notifications.js header.', 'warn');
    return false;
  }

  try {
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY),
    });
    await api.subscribeToPush(sub.toJSON());
    toast('Push enabled', 'You will get a ping the second a price drops.');
    return true;
  } catch (e) {
    console.error(e);
    toast('Could not subscribe', e.message, 'err');
    return false;
  }
}

/* VAPID keys are base64url; the Push API wants a Uint8Array. */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

/* Fire-and-forget registration on every page load. */
registerSW();
