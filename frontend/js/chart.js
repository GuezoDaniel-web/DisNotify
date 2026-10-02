/* ============================================================
   DisNotify — chart.js
   Dependency-free SVG price-history chart with hover readout.
   renderPriceChart(container, series, opts)
     series = [{ retailerId, name, color, points:[{date, price}] }]
   ============================================================ */
import { money } from './ui.js';

export function renderPriceChart(host, series, { height = 230, currency, format } = {}) {
  /* Axis ticks land on fractional values; ZAR price axes read better
     as whole rands. Real prices are already integers, so rounding
     costs nothing in the hover readout either. */
  const fmtY = format || ((v) => money(Math.round(v), currency));
  if (!host) return;
  const live = series.filter(s => s.points && s.points.length > 1);
  if (!live.length) { host.innerHTML = '<div class="empty small">No price history yet.</div>'; return; }

  const W = 720, H = height, PAD = { t: 14, r: 14, b: 26, l: 52 };
  const all = live.flatMap(s => s.points);
  const prices = all.map(p => p.price);
  const times = all.map(p => +new Date(p.date));
  const minP = Math.min(...prices), maxP = Math.max(...prices);
  const padP = (maxP - minP) * 0.12 || maxP * 0.05 || 1;
  const y0 = Math.max(0, minP - padP), y1 = maxP + padP;
  const t0 = Math.min(...times), t1 = Math.max(...times) || t0 + 1;

  const px = t => PAD.l + ((t - t0) / (t1 - t0 || 1)) * (W - PAD.l - PAD.r);
  const py = v => PAD.t + (1 - (v - y0) / (y1 - y0 || 1)) * (H - PAD.t - PAD.b);

  /* horizontal grid + y labels */
  let grid = '';
  const TICKS = 4;
  for (let i = 0; i <= TICKS; i++) {
    const v = y0 + ((y1 - y0) * i) / TICKS;
    const y = py(v).toFixed(1);
    grid += `<line class="grid-line" x1="${PAD.l}" x2="${W - PAD.r}" y1="${y}" y2="${y}"/>` +
            `<text class="axis-label" x="${PAD.l - 8}" y="${+y + 3}" text-anchor="end">${fmtY(v)}</text>`;
  }
  /* x labels: first / middle / last */
  const fmt = t => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  [t0, (t0 + t1) / 2, t1].forEach((t, i) => {
    grid += `<text class="axis-label" x="${px(t).toFixed(1)}" y="${H - 8}" ` +
            `text-anchor="${i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}">${fmt(t)}</text>`;
  });

  const paths = live.map((s, idx) => {
    const pts = [...s.points].sort((a, b) => +new Date(a.date) - +new Date(b.date));
    const d = pts.map((p, i) => (i ? 'L' : 'M') + px(+new Date(p.date)).toFixed(1) + ' ' + py(p.price).toFixed(1)).join(' ');
    const color = s.color || 'var(--accent)';
    const area = idx === 0
      ? `<path d="${d} L${px(+new Date(pts.at(-1).date)).toFixed(1)} ${H - PAD.b} L${px(+new Date(pts[0].date)).toFixed(1)} ${H - PAD.b} Z" fill="${color}" opacity=".10"/>`
      : '';
    const dots = pts.map(p =>
      `<circle class="pt" data-price="${p.price}" data-date="${p.date}" data-name="${s.name}" ` +
      `cx="${px(+new Date(p.date)).toFixed(1)}" cy="${py(p.price).toFixed(1)}" r="9" fill="transparent"/>`).join('');
    return area + `<path d="${d}" fill="none" stroke="${color}" stroke-width="2.2"
      stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>` + dots;
  }).join('');

  host.innerHTML = `
    <svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Price history">
      ${grid}${paths}
      <circle id="hoverDot" r="4" fill="var(--accent)" stroke="var(--surface)" stroke-width="2" opacity="0"/>
    </svg>
    <div class="row wrap small muted mt-1" style="gap:14px">
      ${live.map(s => `<span class="row" style="gap:6px"><i class="retailer-dot" style="background:${s.color || 'var(--accent)'}"></i>${s.name}</span>`).join('')}
    </div>
    <div id="chartTip" class="badge" style="position:absolute;opacity:0;pointer-events:none;transition:opacity .12s"></div>`;

  /* hover readout */
  const svg = host.querySelector('svg');
  const tip = host.querySelector('#chartTip');
  const dot = host.querySelector('#hoverDot');
  host.style.position = 'relative';

  svg.addEventListener('pointermove', e => {
    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target || !target.classList.contains('pt')) { tip.style.opacity = '0'; dot.setAttribute('opacity', '0'); return; }
    const box = host.getBoundingClientRect();
    tip.textContent = `${target.dataset.name} · ${fmtY(+target.dataset.price)} · ` +
      new Date(target.dataset.date).toLocaleDateString();
    tip.style.left = Math.min(box.width - 190, Math.max(0, e.clientX - box.left - 60)) + 'px';
    tip.style.top = (e.clientY - box.top - 34) + 'px';
    tip.style.opacity = '1';
    dot.setAttribute('cx', target.getAttribute('cx'));
    dot.setAttribute('cy', target.getAttribute('cy'));
    dot.setAttribute('opacity', '1');
  });
  svg.addEventListener('pointerleave', () => { tip.style.opacity = '0'; dot.setAttribute('opacity', '0'); });
}
