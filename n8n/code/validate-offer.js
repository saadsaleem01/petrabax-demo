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

// Same tier, different prices = conflict
const groups = {};
for (const t of tiers) {
  const key = norm([t.room_type, t.applies_to, t.price_type || 'promo'].join('|'));
  groups[key] = groups[key] || { name: tierLabel(t), prices: [] };
  const p = Number(t.price) || 0;
  if (p && !groups[key].prices.includes(p)) groups[key].prices.push(p);
}
for (const k of Object.keys(groups)) {
  const g = groups[k];
  check('No conflicting prices: ' + g.name, g.prices.length <= 1, 'red',
    'Conflicting prices for "' + g.name + '": ' + g.prices.join(' vs ') + ' - confirm with the supplier.');
}

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
    check('Source quote verified: booking deadline', inSource(f.booking_deadline_evidence), 'red',
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
  if (d.evidence && !inSource(d.evidence)) {
    check('Source quote verified: departure ' + d.date, false, 'red', 'AI quote for departure ' + d.date + ' was not found in the source.');
  }
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
