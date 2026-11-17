// n8n Code node: "Plan Expiry Sweep"
// Finds drafts / approved / scheduled posts whose promo booking deadline has passed.
// Scheduled posts are cancelled in Ayrshare; everything expired is pulled back in Airtable.
const BASE = 'https://api.airtable.com/v0/appq1uORcGaTdhNiA/';
const NL = String.fromCharCode(10);
const today = $now.toFormat('yyyy-MM-dd');
const recs = $input.all().flatMap((i) => i.json.records || []);

const expired = [];
for (const r of recs) {
  const f = r.fields || {};
  let cf = {};
  try { cf = JSON.parse(f['Localized facts JSON'] || '{}'); } catch (e) { cf = {}; }
  if (!cf.booking_deadline || cf.booking_deadline >= today) continue;
  expired.push({ record_id: r.id, item: f['Item'] || 'Content item', status: f['Status'], promo: (f['Promotion'] || [])[0] || null, deadline: cf.booking_deadline, ayrshare_id: f['Status'] === 'Scheduled' ? (f['Ayrshare post ID'] || '') : '' });
}

const cancels = expired.filter((x) => x.ayrshare_id).map((x) => ({ id: x.ayrshare_id, item: x.item }));
const updates = expired.map((x) => ({ id: x.record_id, fields: { 'Status': 'Pulled back', 'Reviewer notes': 'Pulled back automatically on ' + today + ': booking deadline ' + x.deadline + ' has passed' + (x.ayrshare_id ? ' (scheduled post cancelled).' : '.') } }));
const promos = [...new Set(expired.map((x) => x.promo).filter(Boolean))];

const ops = [];
for (let i = 0; i < updates.length; i += 10) ops.push({ method: 'PATCH', url: BASE + 'tblJ0nBAkpOAXkBkv', body: { typecast: true, records: updates.slice(i, i + 10) } });
for (let i = 0; i < promos.length; i += 10) ops.push({ method: 'PATCH', url: BASE + 'tblto8v1qITtb9Bjw', body: { typecast: true, records: promos.slice(i, i + 10).map((id) => ({ id, fields: { 'Workflow status': 'Expired' } })) } });
const logs = promos.map((promo) => {
  const mine = expired.filter((x) => x.promo === promo);
  return { fields: { 'Event': 'Expired: ' + mine.length + ' item(s) pulled back', 'Type': 'Expired', 'Details': mine.map((x) => '• ' + x.item + ' (was ' + x.status + ')' + (x.ayrshare_id ? ' - scheduled post cancelled' : '')).join(NL), 'At': $now.toISO(), 'Promotion': [promo] } };
});
for (let i = 0; i < logs.length; i += 10) ops.push({ method: 'POST', url: BASE + 'tblTFaxIO2C8y6ePa', body: { typecast: true, records: logs.slice(i, i + 10) } });

return [{ json: { checked: recs.length, expired, cancels, ops } }];
