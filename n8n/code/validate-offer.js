// n8n Code node: "Validate Offer Against Source"
// Deterministic safeguards. The AI extracts; this code decides what is trustworthy.
const src = $('Build Source Text').first().json;
const f = $input.first().json.output || {};
const today = $now.toFormat('yyyy-MM-dd');
const source = src.source_text || '';

const norm = (s) => String(s || '')
  .toLowerCase()
  .replace(/[‘’]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/[–—]/g, '-')
  .replace(/\s+/g, ' ')
  .trim();
const nsrc = norm(source);
const numsIn = (s) => (String(s || '').match(/\d[\d.,]*/g) || [])
  .map((x) => x.replace(/[.,](?=\d{3}(?!\d))/g, '').replace(/[.,]+$/, ''));
const srcNums = numsIn(source);
const inSource = (quote) => !!quote && nsrc.includes(norm(quote));
const isoDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(String(d || ''));
const MONTHS_EN = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const dateMentioned = (iso) => {
  const [, m, d] = String(iso || '').split('-').map(Number);
  if (!m || !d) return false;
  if (nsrc.includes(iso)) return true;
  const names = [MONTHS_EN[m - 1], MONTHS_EN[m - 1].slice(0, 3), MONTHS_ES[m - 1], MONTHS_ES[m - 1].slice(0, 3)];
  return names.some((n) => new RegExp('\\b' + n + '\\.?\\s+' + d + '(st|nd|rd|th)?\\b').test(nsrc) ||
    new RegExp('\\b' + d + '(st|nd|rd|th)?\\s+(of\\s+|de\\s+)?' + n + '\\b').test(nsrc));
};

const red = [];
const yellow = [];
const checks = [];
function check(label, ok, level, msg) {
  checks.push({ label, status: ok ? 'ok' : level, msg: ok ? '' : msg });
  if (!ok) {
    const list = level === 'red' ? red : yellow;
    if (!list.includes(msg)) list.push(msg);
  }
}

// ---------- Price tiers ----------
const tiers = Array.isArray(f.price_tiers) ? f.price_tiers : [];
check('At least one price found', tiers.length > 0, 'red', 'No price found in the supplier material.');
const tierLabel = (t) => [t.room_type, t.applies_to].filter(Boolean).join(' / ') || t.label || 'price';
for (const t of tiers) {
  const p = Number(t.price) || 0;
  const name = tierLabel(t) + (t.price_type && t.price_type !== 'promo' ? ' (' + t.price_type + ')' : '');
  check('Price is a number: ' + name, p > 0, 'red', 'Price for "' + name + '" is missing or not a number.');
  if (p > 0) {
    check('Price appears in source: ' + name, srcNums.includes(String(p)), 'red',
      'Price ' + p + ' for "' + name + '" does not appear anywhere in the supplier material.');
  }
  if (t.evidence) {
    check('Source quote verified: ' + name, inSource(t.evidence), 'red',
      'AI quote for "' + name + '" was not found word-for-word in the source (possible hallucination).');
    if (p > 0) {
      check('Price inside its quote: ' + name, numsIn(t.evidence).includes(String(p)), 'yellow',
        'Price ' + p + ' for "' + name + '" is not in the sentence it was taken from - check it.');
    }
  } else {
    check('Source quote present: ' + name, false, 'yellow', 'No source quote for "' + name + '" - check it manually.');
  }
}

// Same room type + overlapping travel period + different prices = conflict.
// Periods come from month/season words in "applies to"; no period stated = whole offer (overlaps everything).
const SEASONS = { spring: [3, 4, 5], summer: [6, 7, 8], autumn: [9, 10, 11], fall: [9, 10, 11], winter: [12, 1, 2], primavera: [3, 4, 5], verano: [6, 7, 8], 'otoño': [9, 10, 11], invierno: [12, 1, 2] };
const monthsOf = (text) => {
  const s = norm(text);
  const set = new Set();
  MONTHS_EN.forEach((m, k) => { if (new RegExp('\\b(' + m + '|' + m.slice(0, 3) + ')\\b').test(s)) set.add(k + 1); });
  MONTHS_ES.forEach((m, k) => { if (new RegExp('\\b' + m + '\\b').test(s)) set.add(k + 1); });
  Object.keys(SEASONS).forEach((w) => { if (s.includes(w)) SEASONS[w].forEach((x) => set.add(x)); });
  return set.size ? set : null;
};
const overlaps = (a, b) => !a || !b || [...a].some((x) => b.has(x));
const roomKey = (t) => norm(t.room_type).replace(/\b(room|occupancy|habitaci[oó]n)\b/g, '').trim();
const conflictSeen = new Set();
for (let a = 0; a < tiers.length; a++) {
  for (let b = a + 1; b < tiers.length; b++) {
    const x = tiers[a], y = tiers[b];
    const px = Number(x.price) || 0, py = Number(y.price) || 0;
    if (!px || !py || px === py) continue;
    if ((x.price_type || 'promo') !== (y.price_type || 'promo') || roomKey(x) !== roomKey(y)) continue;
    const same = norm(x.applies_to) === norm(y.applies_to);
    if (!same && !overlaps(monthsOf(x.applies_to), monthsOf(y.applies_to))) continue;
    const key = roomKey(x) + '|' + [px, py].sort().join('|');
    if (conflictSeen.has(key)) continue;
    conflictSeen.add(key);
    const name = (x.room_type || 'room') + (same && x.applies_to ? ' / ' + x.applies_to : '');
    check('No conflicting prices: ' + name, false, 'red',
      'Conflicting prices for "' + name + '": ' + px + ' vs ' + py + ' for the same travel period - confirm with the supplier.');
  }
}
if (!conflictSeen.size) check('No conflicting prices', true, 'red', '');

// Any money amount in the source that the AI did not capture anywhere?
const captured = new Set();
tiers.forEach((t) => captured.add(String(Number(t.price) || '')));
(f.discounts || []).forEach((d) => numsIn(d.amount).forEach((n) => captured.add(n)));
numsIn(f.single_supplement).forEach((n) => captured.add(n));
const moneyRe = /(?:US\$|USD\s?\$?|\$|€|EUR\s?)\s?(\d[\d.,]*)/g;
let mm;
const missed = [];
while ((mm = moneyRe.exec(source)) !== null) {
  const n = numsIn(mm[1])[0];
  if (n && !captured.has(n) && !missed.includes(n)) missed.push(n);
}
check('All prices in the source captured', missed.length === 0, 'yellow',
  'Supplier material mentions ' + missed.map((n) => '$' + n).join(', ') + ' which was not captured - check nothing is missing.');

// ---------- Currency ----------
const currencyOk = !!(f.currency && String(f.currency).trim());
check('Currency stated', currencyOk, 'red', 'Currency is not stated - a price cannot be published without it.');

// ---------- Booking deadline ----------
if (f.booking_deadline) {
  check('Booking deadline is a valid date', isoDate(f.booking_deadline), 'red', 'Booking deadline "' + f.booking_deadline + '" is not a valid date.');
  check('Booking deadline still open', f.booking_deadline >= today, 'red',
    'Booking deadline ' + f.booking_deadline + ' has already passed (today is ' + today + ') - promo is expired.');
  if (f.booking_deadline_evidence) {
    check('Source quote verified: booking deadline', inSource(f.booking_deadline_evidence) || dateMentioned(f.booking_deadline), 'red',
      'AI quote for the booking deadline was not found word-for-word in the source.');
  }
} else {
  check('Booking deadline stated', false, 'yellow', 'No booking deadline stated.');
}

// ---------- Departures / travel window ----------
const deps = (Array.isArray(f.departures) ? f.departures : []).filter((d) => d && d.date);
const depDates = [];
for (const d of deps) {
  if (!isoDate(d.date)) { check('Departure date valid', false, 'yellow', 'Departure "' + d.date + '" is not a valid date.'); continue; }
  depDates.push(d.date);
  if (d.date < today) check('Departure in the future: ' + d.date, false, 'yellow', 'Departure ' + d.date + ' is in the past and will be left out.');
  // Verify the date itself appears in the supplier text (e.g. "May 8", "8 de mayo", "2027-05-08"),
  // so a correct date is not blocked just because the AI stitched its quote together.
  check('Departure date found in source: ' + d.date, inSource(d.evidence) || dateMentioned(d.date), 'red',
    'Departure ' + d.date + ' does not appear in the supplier material (possible hallucination).');
}
depDates.sort();
const futureDeps = depDates.filter((d) => d >= today);
const travelStart = f.travel_start || futureDeps[0] || '';
const travelEnd = f.travel_end || futureDeps[futureDeps.length - 1] || '';
if (travelStart && travelEnd) {
  check('Travel dates consistent', travelEnd >= travelStart, 'red', 'Travel end date is before the start date.');
} else {
  check('Travel dates stated', false, 'yellow', 'No exact departure dates or travel window stated.');
}
if (f.booking_deadline && futureDeps.length) {
  check('Booking deadline before first departure', f.booking_deadline <= futureDeps[0], 'yellow',
    'Booking deadline ' + f.booking_deadline + ' is after the first departure ' + futureDeps[0] + ' - check.');
}

// ---------- Discounts ----------
for (const d of (f.discounts || [])) {
  if (!d) continue;
  const nums = numsIn(d.amount);
  for (const n of nums) {
    check('Discount amount in source: ' + n, srcNums.includes(n), 'red', 'Discount "' + (d.description || n) + '" uses ' + n + ' which is not in the source.');
  }
  if (d.evidence) check('Source quote verified: discount', inSource(d.evidence), 'red', 'AI quote for discount "' + (d.description || '') + '" was not found in the source.');
}

// ---------- Commission (internal only) ----------
const commission = f.commission || {};
if (commission.rate && commission.evidence) {
  check('Source quote verified: commission', inSource(commission.evidence), 'yellow', 'Commission quote not found word-for-word in the source.');
}

// ---------- AI review flags ----------
for (const i of (f.issues || [])) {
  if (!i || !i.message) continue;
  const m = String(i.message);
  if (!currencyOk && /currenc/i.test(m)) continue;
  if (/conflict/i.test(m) && /price/i.test(m) && red.some((r) => /Conflicting prices/.test(r))) continue;
  if (/expire|passed/i.test(m) && red.some((r) => /already passed/.test(r))) continue;
  // Low-severity notes and remarks about the AI's own evidence quotes are informational:
  // the quotes are already verified word-for-word above, so they must not downgrade the promo.
  if (i.severity === 'low' || /evidence|quote|fragment/i.test(m)) { checks.push({ label: 'AI note', status: 'ok', msg: m }); continue; }
  check('AI review flag', false, i.severity === 'high' ? 'red' : 'yellow', m);
}

// ---------- Derived values (computed in code, never by AI) ----------
const promoTiers = tiers.filter((t) => (t.price_type || 'promo') === 'promo' && Number(t.price) > 0);
const priceFrom = promoTiers.length ? Math.min(...promoTiers.map((t) => Number(t.price))) : 0;

const slug = (s) => norm(s)
  .replace(/\([^)]*\)/g, ' ')
  .replace(/\b\d+\s*(days?|nights?|d[ií]as?|noches?)\b/g, ' ')
  .replace(/\b(early booking|special offer|promo(tion)?|correction|updated?|flash sale|offer|20\d\d)\b/g, ' ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');
const supplier = f.supplier || src.supplier;
const promoKey = slug(supplier) + '__' + slug(f.tour_name);

// Customer-safe facts: no commission, no internal notes, no source quotes
const customerFacts = {
  tour_name: f.tour_name,
  destination_countries: f.destination_countries || [],
  cities: f.cities || [],
  duration: f.duration,
  currency: f.currency,
  price_basis: f.price_basis,
  price_from: priceFrom,
  price_tiers: tiers.map((t) => ({ room_type: t.room_type, applies_to: t.applies_to, price: Number(t.price) || 0, price_type: t.price_type || 'promo' })),
  departures: futureDeps,
  travel_start: travelStart,
  travel_end: travelEnd,
  booking_deadline: f.booking_deadline,
  discounts: (f.discounts || []).map((d) => ({ description: d.description, condition: d.condition })),
  restrictions: f.restrictions || [],
  inclusions: f.inclusions || [],
  exclusions: f.exclusions || [],
  single_supplement: f.single_supplement || '',
  promo_code: f.promo_code || ''
};

const status = red.length ? 'red' : (yellow.length ? 'yellow' : 'green');
return [{
  json: {
    promo_key: promoKey,
    supplier,
    source_type: src.source_type,
    source_text: source,
    facts: f,
    customer_facts: customerFacts,
    price_from: priceFrom,
    status,
    red,
    yellow,
    checks,
    today
  }
}];
