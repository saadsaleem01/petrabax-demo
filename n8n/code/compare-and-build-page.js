// n8n Code node: "Compare With Previous Version"
// Detects supplier corrections by comparing against the last saved version of the same promo,
// then builds the result page shown to the employee.
const v = $('Validate Offer Against Source').first().json;
const prev = $input.all().map((i) => i.json).find((r) => r && r.offer_json) || null;
const f = v.facts || {};
const cf = v.customer_facts || {};

const red = [...v.red];
const yellow = [...v.yellow];
const changes = [];
let version = 1;

const tierKey = (t) => [t.room_type, t.applies_to, t.price_type || 'promo'].map((x) => String(x || '').toLowerCase().trim()).join(' | ');
const tierName = (t) => [t.room_type, t.applies_to].filter(Boolean).join(' / ') + (t.price_type && t.price_type !== 'promo' ? ' (' + t.price_type + ')' : '');
const money = (n) => (cf.currency === 'USD' || !cf.currency ? '$' : cf.currency + ' ') + Number(n).toLocaleString('en-US');

if (prev) {
  version = (Number(prev.version) || 1) + 1;
  let old = {};
  try { old = JSON.parse(prev.offer_json); } catch (e) { old = {}; }

  // Match tiers: exact key first, then by room type + price type when the AI reworded "applies_to"
  const baseKey = (t) => [t.room_type, t.price_type || 'promo'].map((x) => String(x || '').toLowerCase().trim()).join(' | ');
  const oldList = (old.price_tiers || []).slice();
  const newList = (f.price_tiers || []).slice();
  const pairs = [];
  for (const n of newList.slice()) {
    const i = oldList.findIndex((o) => tierKey(o) === tierKey(n));
    if (i >= 0) { pairs.push([oldList[i], n]); oldList.splice(i, 1); newList.splice(newList.indexOf(n), 1); }
  }
  for (const n of newList.slice()) {
    const sameOld = oldList.filter((o) => baseKey(o) === baseKey(n));
    const sameNew = newList.filter((x) => baseKey(x) === baseKey(n));
    if (sameOld.length === 1 && sameNew.length === 1) { pairs.push([sameOld[0], n]); oldList.splice(oldList.indexOf(sameOld[0]), 1); newList.splice(newList.indexOf(n), 1); }
  }
  pairs.forEach((p) => { if (Number(p[0].price) !== Number(p[1].price)) changes.push('Price changed: ' + tierName(p[1]) + ' ' + money(p[0].price) + ' → ' + money(p[1].price)); });
  newList.forEach((t) => changes.push('New price: ' + tierName(t) + ' ' + money(t.price)));
  oldList.forEach((t) => changes.push('Price removed: ' + tierName(t) + ' ' + money(t.price)));

  const oldD = (old.departures || []).map((d) => d.date).filter(Boolean);
  const newD = (f.departures || []).map((d) => d.date).filter(Boolean);
  oldD.filter((d) => !newD.includes(d)).forEach((d) => changes.push('Departure removed: ' + d));
  newD.filter((d) => !oldD.includes(d)).forEach((d) => changes.push('Departure added: ' + d));

  if ((old.booking_deadline || '') !== (f.booking_deadline || '')) changes.push('Booking deadline: ' + (old.booking_deadline || 'none') + ' → ' + (f.booking_deadline || 'none'));
  if ((old.currency || '') !== (f.currency || '')) changes.push('Currency: ' + (old.currency || 'none') + ' → ' + (f.currency || 'none'));

  // Discounts compared by amount (wording varies between AI runs)
  const amt = (d) => String(d.amount || '').replace(/[\s,]/g, '').toLowerCase();
  const oldDisc = (old.discounts || []).map(amt);
  const newDisc = (f.discounts || []).map(amt);
  (f.discounts || []).filter((d) => !oldDisc.includes(amt(d))).forEach((d) => changes.push('Discount added/changed: ' + d.amount + ' - ' + d.description));
  (old.discounts || []).filter((d) => !newDisc.includes(amt(d))).forEach((d) => changes.push('Discount removed: ' + d.amount + ' - ' + d.description));

  if (changes.length) {
    yellow.unshift('Supplier correction: ' + changes.length + ' change(s) vs version ' + (version - 1) + '. All content for this promo must be re-approved, and anything already scheduled is pulled from the queue.');
  } else {
    yellow.unshift('Same offer as saved version ' + (version - 1) + ' - no changes detected (possible duplicate email).');
  }
}

const status = red.length ? 'red' : (yellow.length ? 'yellow' : 'green');

// ---------- Result page ----------
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const C = { red: ['#c0392b', '#fff5f4', '⛔ Blocked - no content will be generated'], yellow: ['#8a5a00', '#fffaf0', '⚠️ Needs a human check before content is generated'], green: ['#1e7b45', '#f3fbf6', '✅ All facts verified against the supplier source'] };
const c = C[status];
const li = (arr) => arr.map((x) => '<li style="margin:4px 0">' + esc(x) + '</li>').join('');
const th = 'style="text-align:left;padding:6px 8px;background:#7a1f2b;color:#fff;font-size:12px"';
const td = 'style="padding:6px 8px;border-bottom:1px solid #eee;font-size:13px;vertical-align:top"';
const h3 = (t) => '<h3 style="margin:22px 0 8px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#7a1f2b;border-bottom:2px solid #7a1f2b;padding-bottom:4px">' + t + '</h3>';
const quoteCell = (q) => q ? '<span style="color:#1e7b45;font-size:12px">✔ “' + esc(q) + '”</span>' : '<span style="color:#999;font-size:12px">-</span>';

let html = '<div style="font-family:Arial,sans-serif;max-width:860px;margin:24px auto;padding:24px;border-radius:12px;border:2px solid ' + c[0] + ';background:#fff;text-align:left">';
html += '<div style="background:' + c[1] + ';color:' + c[0] + ';padding:12px 16px;border-radius:8px;font-weight:bold;font-size:16px">' + c[2] + '</div>';
html += '<p style="margin:14px 0 0;font-size:15px"><b>' + esc(f.tour_name || 'Untitled promo') + '</b> · ' + esc(v.supplier) + ' · version ' + version + '</p>';
if (red.length) html += h3('Blocking problems') + '<ul style="color:#c0392b;font-size:13px">' + li(red) + '</ul>';
if (yellow.length) html += h3('Check before approving') + '<ul style="color:#8a5a00;font-size:13px">' + li(yellow) + '</ul>';
if (changes.length) html += h3('What the supplier changed') + '<ul style="font-size:13px">' + li(changes) + '</ul>';

html += h3('Offer summary');
const rows = [
  ['Destination', [(cf.destination_countries || []).join(', '), (cf.cities || []).join(', ')].filter(Boolean).join(' - ')],
  ['Duration', cf.duration],
  ['From price (lowest promo tier)', cf.price_from ? money(cf.price_from) + ' ' + (cf.price_basis || '') : ''],
  ['Book by', cf.booking_deadline],
  ['Travel window', [cf.travel_start, cf.travel_end].filter(Boolean).join(' to ')],
  ['Promo code', cf.promo_code]
].filter((r) => r[1]);
html += '<table style="width:100%;border-collapse:collapse">' + rows.map((r) => '<tr><td ' + td + '><b>' + esc(r[0]) + '</b></td><td ' + td + '>' + esc(r[1]) + '</td></tr>').join('') + '</table>';

html += h3('Price tiers (' + (f.price_tiers || []).length + ')');
html += '<table style="width:100%;border-collapse:collapse"><tr><th ' + th + '>Room</th><th ' + th + '>Applies to</th><th ' + th + '>Type</th><th ' + th + '>Price</th><th ' + th + '>Source</th></tr>';
html += (f.price_tiers || []).map((t) => '<tr><td ' + td + '>' + esc(t.room_type) + '</td><td ' + td + '>' + esc(t.applies_to) + '</td><td ' + td + '>' + esc(t.price_type || 'promo') + '</td><td ' + td + '><b>' + esc(t.price ? money(t.price) : '') + '</b></td><td ' + td + '>' + quoteCell(t.evidence) + '</td></tr>').join('');
html += '</table>';

if ((cf.departures || []).length) {
  html += h3('Departures (' + cf.departures.length + ')') + '<p>' + cf.departures.map((d) => '<span style="display:inline-block;margin:3px;padding:4px 10px;border-radius:12px;background:#faf3e6;font-size:12px">' + esc(d) + '</span>').join('') + '</p>';
}
if ((f.discounts || []).length) {
  html += h3('Discounts') + '<ul style="font-size:13px">' + (f.discounts || []).map((d) => '<li>' + esc(d.description) + (d.condition ? ' <i>(' + esc(d.condition) + ')</i>' : '') + '</li>').join('') + '</ul>';
}
if ((f.restrictions || []).length) html += h3('Restrictions & conditions') + '<ul style="font-size:13px">' + li(f.restrictions) + '</ul>';
const com = f.commission || {};
if (com.rate) {
  html += h3('Commission') + '<p style="font-size:13px;background:#f4f4f4;padding:8px 12px;border-radius:6px">🔒 <b>' + esc(com.rate) + '</b> ' + esc(com.notes || '') + '<br><span style="color:#c0392b;font-size:12px">INTERNAL ONLY - removed from all customer-facing content.</span></p>';
}
html += h3('Safeguard checks (' + v.checks.filter((x) => x.status === 'ok').length + '/' + v.checks.length + ' passed)');
html += '<ul style="font-size:12px;columns:2;list-style:none;padding:0">' + v.checks.map((x) => '<li style="margin:2px 0">' + (x.status === 'ok' ? '✅' : x.status === 'red' ? '⛔' : '⚠️') + ' ' + esc(x.label) + '</li>').join('') + '</ul>';
html += '<p style="color:#666;font-size:12px;margin-top:18px">Saved to Petrabax Promotions · ' + esc(v.source_type) + ' · ' + esc(v.today) + '</p></div>';

return [{
  json: {
    promo_key: v.promo_key,
    supplier: v.supplier,
    tour_name: f.tour_name || '',
    status,
    version,
    price_from: v.price_from,
    currency: f.currency || '',
    booking_deadline: f.booking_deadline || '',
    issues: red.concat(yellow).join(' | '),
    changes: changes.join(' | '),
    offer_json: JSON.stringify(f),
    customer_facts_json: JSON.stringify(cf),
    source_text: v.source_text,
    updated_at: $now.toISO(),
    page_html: html
  }
}];
