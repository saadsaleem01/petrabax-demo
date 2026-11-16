// n8n Code node: "Prepare Airtable Promotion"
// Maps the validated offer onto the Airtable "Promotions" table (upsert on Promo key).
const r = $('Compare With Previous Version').first().json;
const f = JSON.parse(r.offer_json || '{}');
const cf = JSON.parse(r.customer_facts_json || '{}');
const NL = String.fromCharCode(10);
const lines = (arr) => (arr || []).filter(Boolean).join(NL);
const split = (s) => String(s || '').split(' | ').filter(Boolean);

const expired = /already passed/.test(r.issues || '');
const checkResult = { green: 'Verified', yellow: 'Needs check', red: 'Blocked' }[r.status];
const workflowStatus = r.status === 'red' ? (expired ? 'Expired' : 'Blocked') : (r.status === 'green' ? 'Ready for review' : 'Needs check');
const com = f.commission || {};

const fields = {
  'Promo': (r.tour_name || 'Untitled promo') + ' — ' + r.supplier,
  'Promo key': r.promo_key,
  'Supplier': r.supplier,
  'Check result': checkResult,
  'Workflow status': workflowStatus,
  'Version': r.version,
  'From price': r.price_from || null,
  'Currency': r.currency,
  'Booking deadline': r.booking_deadline || null,
  'Travel start': cf.travel_start || null,
  'Travel end': cf.travel_end || null,
  'Departures': lines(cf.departures),
  'Issues': lines(split(r.issues)),
  'Supplier changes': lines(split(r.changes)),
  'Discounts': lines((f.discounts || []).map((d) => [d.amount, d.description].filter(Boolean).join(' – ') + (d.condition ? ' (' + d.condition + ')' : ''))),
  'Restrictions': lines(f.restrictions),
  'Inclusions': lines(f.inclusions),
  'Commission (internal only)': com.rate ? [com.rate, com.notes].filter(Boolean).join(' – ') : '',
  'Source text': r.source_text,
  'Offer JSON': r.offer_json,
  'Customer facts JSON': r.customer_facts_json,
  'Updated': r.updated_at
};

return [{ json: { body: { performUpsert: { fieldsToMergeOn: ['Promo key'] }, typecast: true, records: [{ fields }] } } }];
