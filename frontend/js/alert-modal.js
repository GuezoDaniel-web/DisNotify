/* ============================================================
   DisNotify — alert-modal.js
   Shared "create / edit alert rule" dialog.
   Used by product.js and alerts.js.
   ============================================================ */
import { ALERT_TYPES, CHANNELS, RETAILERS } from './config.js';
import { $, $$, esc, money, openModal, closeModal, toast } from './ui.js';
import { icon } from './icons.js';
import * as api from './api.js';
import * as store from './store.js';

export function openAlertModal(product, existing = null, onSaved) {
  const rule = existing || {
    type: 'price_below',
    threshold: Math.round(product.bestOffer.price * 0.9),
    channels: ['push', 'email'],
    retailers: [],
    active: true,
  };

  openModal(`
    <div class="card-head">
      <div><h2>${existing ? 'Edit' : 'New'} price alert</h2>
        <div class="tiny muted clamp-2" style="max-width:340px">${esc(product.name)}</div></div>
      <button class="btn btn-icon btn-sm btn-ghost" data-close>${icon('x', 16)}</button>
    </div>
    <div class="card-body">
      <div class="row" style="gap:12px;padding:12px;background:var(--surface-2);border-radius:var(--r-md)">
        <img src="${product.image}" class="thumb-sm" alt="">
        <div class="grow"><div class="small bold">Currently ${money(product.bestOffer.price)}</div>
          <div class="tiny muted">at ${esc(product.bestOffer.retailer)} · lowest ever ${money(product.lowestEver)}</div></div>
      </div>

      <div class="field mt-3">
        <label for="alertType">Notify me when</label>
        <select class="select" id="alertType">
          ${ALERT_TYPES.map(t => `<option value="${t.id}" ${t.id === rule.type ? 'selected' : ''}>${t.label}</option>`).join('')}
        </select>
      </div>

      <div class="field" id="thresholdField">
        <label for="threshold"><span id="thresholdLabel">Target price</span></label>
        <input class="input" id="threshold" type="number" min="0" step="1" value="${rule.threshold ?? ''}">
        <div class="hint" id="thresholdHint"></div>
      </div>

      <div class="field">
        <label>Send via</label>
        <div class="row wrap" style="gap:8px">
          ${CHANNELS.map(c => `<label class="chip ${rule.channels.includes(c.id) ? 'active' : ''}" data-chan="${c.id}">
            <input type="checkbox" value="${c.id}" ${rule.channels.includes(c.id) ? 'checked' : ''} hidden>${c.label}</label>`).join('')}
        </div>
      </div>

      <div class="field">
        <label>Only these retailers <span class="faint">(none selected = all)</span></label>
        <div class="row wrap" style="gap:8px">
          ${RETAILERS.filter(r => product.offers.some(o => o.retailerId === r.id))
            .map(r => `<label class="chip ${rule.retailers?.includes(r.id) ? 'active' : ''}" data-ret="${r.id}">
              <i class="retailer-dot" style="background:${r.color}"></i>${esc(r.name)}</label>`).join('')}
        </div>
      </div>

      <div class="row mt-3" style="gap:10px">
        <button class="btn btn-ghost grow" data-close>Cancel</button>
        <button class="btn btn-primary grow" id="saveAlert">${existing ? 'Save changes' : 'Create alert'}</button>
      </div>
    </div>`, { onMount: wire });

  function wire(box) {
    const typeSel = $('#alertType', box);
    const field = $('#thresholdField', box);
    const input = $('#threshold', box);

    const syncType = () => {
      const t = ALERT_TYPES.find(x => x.id === typeSel.value);
      field.classList.toggle('hidden', !t.needsValue);
      $('#thresholdLabel', box).textContent = t.unit === 'percent' ? 'Minimum discount (%)' : 'Target price';
      $('#thresholdHint', box).textContent = t.unit === 'percent'
        ? 'We ping you when any retailer drops at least this much below MSRP.'
        : `Current best is ${money(product.bestOffer.price)}. All-time low ${money(product.lowestEver)}.`;
      if (t.unit === 'percent' && +input.value > 100) input.value = 20;
    };
    typeSel.addEventListener('change', syncType);
    syncType();

    box.addEventListener('click', e => {
      const chip = e.target.closest('[data-chan],[data-ret]');
      if (chip) { chip.classList.toggle('active'); const cb = chip.querySelector('input'); if (cb) cb.checked = chip.classList.contains('active'); }
      if (e.target.closest('[data-close]')) closeModal();
    });

    $('#saveAlert', box).addEventListener('click', async () => {
      const t = ALERT_TYPES.find(x => x.id === typeSel.value);
      const payload = {
        id: existing?.id,
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        type: typeSel.value,
        threshold: t.needsValue ? Number(input.value) : null,
        channels: $$('[data-chan].active', box).map(c => c.dataset.chan),
        retailers: $$('[data-ret].active', box).map(c => c.dataset.ret),
        active: true,
      };
      if (t.needsValue && !payload.threshold) return toast('Enter a value', 'That alert type needs a number.', 'warn');
      if (!payload.channels.length) return toast('Pick a channel', 'Choose at least one way to be notified.', 'warn');

      try {
        existing ? await api.updateAlert(existing.id, payload) : await api.createAlert(payload);
        if (!store.isWatched(product.id)) store.toggleWatch(product.id);
        closeModal();
        toast('Alert saved', 'We are watching every retailer for this one.');
        onSaved?.();
      } catch (e) { toast('Could not save', e.message, 'err'); }
    });
  }
}
