// n8n Code node: "Load Promotion Facts"
// Reads the Airtable promotion and decides whether content may be generated.
const rec = $input.first().json;
const fl = rec.fields || {};
const today = $now.toFormat('yyyy-MM-dd');

let cf = {};
let offer = {};
try { cf = JSON.parse(fl['Customer facts JSON'] || '{}'); } catch (e) { cf = {}; }
try { offer = JSON.parse(fl['Offer JSON'] || '{}'); } catch (e) { offer = {}; }

const reasons = [];
if (!rec.id) reasons.push('Promotion record not found.');
if (fl['Check result'] === 'Blocked') reasons.push('This promotion failed the safeguard checks: ' + (fl['Issues'] || '').split('\n')[0]);
if (['Blocked', 'Expired'].includes(fl['Workflow status'])) reasons.push('Promotion status is ' + fl['Workflow status'] + '.');
if (cf.booking_deadline && cf.booking_deadline < today) reasons.push('Booking deadline ' + cf.booking_deadline + ' has passed.');

// Facts the copywriter may use: customer-safe facts + customer discount amounts. Never commission.
const fmt = (d, loc) => d ? new Date(d + 'T12:00:00Z').toLocaleDateString(loc, { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : '';
const aiFacts = {
  ...cf,
  price_tiers: (cf.price_tiers || []).filter((t) => t.price_type !== 'supplement'),
  discounts: (offer.discounts || []).map((d) => ({ amount: d.amount, description: d.description, condition: d.condition })),
  booking_deadline_display_en: fmt(cf.booking_deadline, 'en-US'),
  booking_deadline_display_es: fmt(cf.booking_deadline, 'es-ES'),
  first_departure_display_en: fmt((cf.departures || [])[0], 'en-US'),
  last_departure_display_en: fmt((cf.departures || []).slice(-1)[0], 'en-US')
};
const allowedNumbers = new Set();
const numsIn = (s) => (String(s || '').match(/\d[\d.,]*/g) || []).map((x) => x.replace(/[.,](?=\d{3}(?!\d))/g, '').replace(/[.,]+$/, ''));
(cf.price_tiers || []).forEach((t) => allowedNumbers.add(String(t.price)));
allowedNumbers.add(String(cf.price_from));
(offer.discounts || []).forEach((d) => numsIn(d.amount).forEach((n) => allowedNumbers.add(n)));
numsIn(cf.single_supplement).forEach((n) => allowedNumbers.add(n));

const com = offer.commission || {};
return [{
  json: {
    record_id: rec.id,
    promo_name: fl['Promo'] || cf.tour_name,
    version: fl['Version'] || 1,
    blocked: reasons.length > 0,
    reasons,
    cf,
    ai_facts: aiFacts,
    allowed_numbers: [...allowedNumbers],
    commission_numbers: numsIn(com.rate),
    existing_content_ids: fl['Content'] || [],
    photo_url: fl['Hero photo URL'] || ''
  }
}];
