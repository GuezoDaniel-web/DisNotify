/* ============================================================
   DisNotify — settings.js  (page controller for settings.html)
   ============================================================ */
import { mountShell } from './layout.js';
import { CHANNELS, RETAILERS } from './config.js';
import { $, $$, esc, toast } from './ui.js';
import { enablePush, permission } from './notifications.js';
import * as api from './api.js';
import * as store from './store.js';

mountShell('settings');

const root = $('#settingsRoot');
let s = store.getSettings();

init();
async function init() { s = await api.getSettings(); render(); }

function render() {
  const user = store.getUser();
  root.innerHTML = `
    <section class="card mb-3">
      <div class="card-head"><h2>Account</h2></div>
      <div class="card-body">
        ${user ? `<div class="setting-row"><div><div class="bold">${esc(user.name || 'You')}</div>
            <div class="small muted">${esc(user.email)}</div></div>
            <button class="btn btn-sm" id="signOut">Sign out</button></div>`
          : `<div class="setting-row"><div><div class="bold">Not signed in</div>
            <div class="small muted">Your data lives in this browser only.</div></div>
            <a class="btn btn-primary btn-sm" href="login.html">Sign in</a></div>`}
      </div>
    </section>

    <section class="card mb-3">
      <div class="card-head"><h2>Notification channels</h2>
        <button class="btn btn-sm" id="testBtn">Send test</button></div>
      <div class="card-body">
        ${CHANNELS.map(c => `<div class="setting-row">
          <div><div class="bold small">${c.label}</div>
            <div class="tiny muted">${channelHint(c.id)}</div></div>
          <label class="switch"><input type="checkbox" data-chan="${c.id}"
            ${s.channels[c.id] ? 'checked' : ''}><span class="track"></span></label></div>`).join('')}

        <div class="field mt-3"><label for="email">Email address</label>
          <input class="input" id="email" type="email" value="${esc(s.email)}" placeholder="you@example.com"></div>

        <div class="field"><label for="discordWebhook">Discord webhook URL</label>
          <input class="input" id="discordWebhook" value="${esc(s.discordWebhook)}"
            placeholder="https://discord.com/api/webhooks/…">
          <div class="hint">Server Settings → Integrations → Webhooks → Copy URL.</div></div>

        <div class="field"><label for="phone">Phone (SMS)</label>
          <input class="input" id="phone" value="${esc(s.phone)}" placeholder="+27 82 000 0000">
          <div class="hint">Requires a Twilio account configured on the backend.</div></div>

        <div class="setting-row">
          <div><div class="bold small">Browser push</div>
            <div class="tiny muted">Status: <span class="badge ${permission() === 'granted' ? 'badge-deal' : 'badge-warn'}">${permission()}</span></div></div>
          <button class="btn btn-sm" id="pushBtn">Enable push</button></div>
      </div>
    </section>

    <section class="card mb-3">
      <div class="card-head"><h2>Alert behaviour</h2></div>
      <div class="card-body">
        <div class="field"><label for="digest">Delivery frequency</label>
          <select class="select" id="digest">
            ${[['instant', 'Instant — ping me immediately'],
               ['hourly', 'Hourly digest'],
               ['daily', 'Daily digest']].map(([v, l]) =>
              `<option value="${v}" ${s.digest === v ? 'selected' : ''}>${l}</option>`).join('')}
          </select></div>

        <div class="field"><label for="minDiscount">Ignore deals under <span id="minVal">${s.minDiscount}%</span></label>
          <input id="minDiscount" type="range" min="0" max="50" step="5" value="${s.minDiscount}"
            style="width:100%;accent-color:var(--accent)"></div>

        <div class="setting-row">
          <div><div class="bold small">Quiet hours</div>
            <div class="tiny muted">Hold notifications overnight and batch them for the morning.</div></div>
          <label class="switch"><input type="checkbox" id="quiet" ${s.quietHours.enabled ? 'checked' : ''}><span class="track"></span></label></div>
        <div class="row" style="gap:12px" id="quietRow">
          <div class="field grow"><label for="qFrom">From</label>
            <input class="input" id="qFrom" type="time" value="${s.quietHours.from}"></div>
          <div class="field grow"><label for="qTo">To</label>
            <input class="input" id="qTo" type="time" value="${s.quietHours.to}"></div>
        </div>
      </div>
    </section>

    <section class="card mb-3">
      <div class="card-head"><h2>Region &amp; retailers</h2></div>
      <div class="card-body">
        <div class="row wrap" style="gap:12px">
          <div class="field grow"><label for="region">Region</label>
            <select class="select" id="region">
              ${['ZA'].map(r => `<option ${s.region === r ? 'selected' : ''}>${r}</option>`).join('')}
            </select></div>
          <div class="field grow"><label for="currency">Currency</label>
            <select class="select" id="currency">
              ${['ZAR'].map(c => `<option ${s.currency === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select></div>
        </div>
        <div class="small bold mb-1 mt-2">Track these retailers <span class="faint">(none = all)</span></div>
        <div class="row wrap" style="gap:8px" id="retailerPicks">
          ${RETAILERS.map(r => `<label class="chip ${s.retailers.includes(r.id) ? 'active' : ''}" data-ret="${r.id}">
            <i class="retailer-dot" style="background:${r.color}"></i>${esc(r.name)}
            <span class="tiny faint">${r.source}</span></label>`).join('')}
        </div>
      </div>
    </section>

    <section class="card" style="border-color:var(--danger)">
      <div class="card-head"><h2 class="text-bad">Danger zone</h2></div>
      <div class="card-body">
        <div class="setting-row"><div><div class="bold small">Clear local data</div>
          <div class="tiny muted">Wipes watchlist, alerts and settings stored in this browser.</div></div>
          <button class="btn btn-danger btn-sm" id="wipeBtn">Clear</button></div>
      </div>
    </section>`;

  wire();
}

function channelHint(id) {
  return { push: 'Instant desktop / mobile notification. Needs permission.',
           email: 'Sent from your backend via Resend, SendGrid or SMTP.',
           discord: 'Posts a rich embed to a channel webhook.',
           sms: 'Costs money per message (Clickatell / BulkSMS) — big drops only.' }[id];
}

function wire() {
  const quietRow = $('#quietRow');
  const syncQuiet = () => quietRow.classList.toggle('hidden', !$('#quiet').checked);
  $('#quiet').addEventListener('change', syncQuiet); syncQuiet();

  $('#minDiscount').addEventListener('input', e => $('#minVal').textContent = e.target.value + '%');

  $('#retailerPicks').addEventListener('click', e => {
    const chip = e.target.closest('[data-ret]');
    if (chip) chip.classList.toggle('active');
  });

  $('#pushBtn').addEventListener('click', async () => { await enablePush(); render(); });

  $('#testBtn').addEventListener('click', async () => {
    try { await api.sendTestNotification(); toast('Test sent', 'Check every channel you enabled.'); }
    catch (e) { toast('Test failed', e.message, 'err'); }
  });

  $('#signOut')?.addEventListener('click', () => { api.logout(); location.href = 'login.html'; });

  $('#wipeBtn').addEventListener('click', () => {
    if (!confirm('Clear all DisNotify data stored in this browser?')) return;
    Object.keys(localStorage).filter(k => k.startsWith('dn.')).forEach(k => localStorage.removeItem(k));
    toast('Local data cleared');
    setTimeout(() => location.reload(), 600);
  });

  $('#saveBtn').onclick = save;
}

async function save() {
  const patch = {
    channels: Object.fromEntries(CHANNELS.map(c => [c.id, $(`[data-chan="${c.id}"]`).checked])),
    email: $('#email').value.trim(),
    discordWebhook: $('#discordWebhook').value.trim(),
    phone: $('#phone').value.trim(),
    digest: $('#digest').value,
    minDiscount: +$('#minDiscount').value,
    quietHours: { enabled: $('#quiet').checked, from: $('#qFrom').value, to: $('#qTo').value },
    region: $('#region').value,
    currency: $('#currency').value,
    retailers: $$('#retailerPicks .active').map(c => c.dataset.ret),
  };
  try {
    await api.saveSettings(patch);
    store.saveSettings(patch);
    s = { ...s, ...patch };
    toast('Settings saved', 'Your alert preferences are up to date.');
  } catch (e) { toast('Could not save', e.message, 'err'); }
}
