// n8n Code node: "Plan Airtable Sync"
// After the promotion is upserted: replace its price tiers, write a change-log entry, and
// on a supplier correction pull back any content already made for this promo.
const BASE = 'https://api.airtable.com/v0/appq1uORcGaTdhNiA/';
const T = { tiers: 'tbl6Kgg2f4rSvzsrV', content: 'tblJ0nBAkpOAXkBkv', log: 'tblTFaxIO2C8y6ePa' };

const rec = ($input.first().json.records || [])[0];
if (!rec) throw new Error('Airtable upsert returned no record');
const r = $('Compare With Previous Version').first().json;
const f = JSON.parse(r.offer_json || '{}');
const NL = String.fromCharCode(10);

const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
const nsrc = norm(r.source_text);
const chunk = (arr, n) => { const out = []; for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out; };
const ops = [];

// 1. Remove the previous version's tiers
const oldTierIds = rec.fields['Price Tiers'] || [];
for (const ids of chunk(oldTierIds, 10)) {
  ops.push({ method: 'DELETE', url: BASE + T.tiers + '?' + ids.map((id) => 'records[]=' + id).join('&'), body: {} });
}

// 2. Create the current tiers
const tierRecords = (f.price_tiers || []).map((t) => ({
  fields: {
    'Tier': [t.room_type, t.applies_to].filter(Boolean).join(' · ') + (t.price_type && t.price_type !== 'promo' ? ' (' + t.price_type + ')' : ''),
    'Room type': t.room_type || '',
    'Applies to': t.applies_to || '',
    'Price': Number(t.price) || null,
    'Type': t.price_type || 'promo',
    'Source quote': t.evidence || '',
    'Verified in source': !!t.evidence && nsrc.includes(norm(t.evidence)),
    'Promotion': [rec.id]
  }
}));
for (const records of chunk(tierRecords, 10)) {
  ops.push({ method: 'POST', url: BASE + T.tiers, body: { typecast: true, records } });
}

// 3. Supplier correction: pull back content that was made from the old version
const changes = String(r.changes || '').split(' | ').filter(Boolean);
const expired = /already passed/.test(r.issues || '');
const contentIds = rec.fields['Content'] || [];
if ((changes.length || expired) && contentIds.length) {
  const note = expired
    ? 'Pulled back automatically: booking deadline has passed.'
    : 'Pulled back automatically: supplier sent a correction (version ' + r.version + '). Re-generate and re-approve.';
  for (const ids of chunk(contentIds, 10)) {
    ops.push({ method: 'PATCH', url: BASE + T.content, body: { typecast: true, records: ids.map((id) => ({ id, fields: { 'Status': 'Pulled back', 'Reviewer notes': note } })) } });
  }
}

// 4. Change log
let type = 'Created';
let event = 'Promotion received (version ' + r.version + ')';
if (expired) { type = 'Expired'; event = 'Promotion blocked: booking deadline passed'; }
else if (r.version > 1 && changes.length) { type = 'Supplier correction'; event = 'Supplier correction: ' + changes.length + ' change(s), version ' + r.version; }
else if (r.version > 1) { event = 'Same promotion received again (no changes), version ' + r.version; }
const details = [
  changes.length ? 'Changes:' + NL + changes.map((c) => '• ' + c).join(NL) : '',
  contentIds.length && (changes.length || expired) ? contentIds.length + ' content item(s) pulled back from the queue.' : '',
  r.issues ? 'Checks:' + NL + String(r.issues).split(' | ').map((c) => '• ' + c).join(NL) : ''
].filter(Boolean).join(NL + NL);
ops.push({ method: 'POST', url: BASE + T.log, body: { typecast: true, records: [{ fields: { 'Event': event, 'Type': type, 'Details': details, 'At': r.updated_at, 'Promotion': [rec.id] } }] } });

return ops.map((o) => ({ json: o }));
