// n8n Code node: "Collect Publishing Results"
// Turns Ayrshare responses into Airtable status updates + change-log entries.
const BASE = 'https://api.airtable.com/v0/appq1uORcGaTdhNiA/';
const p = $('Plan Publishing').first().json;
const NL = String.fromCharCode(10);
let res = [];
if (p.posts.length) { try { res = $('Post to Ayrshare').all().map((i) => i.json); } catch (e) { res = []; } }

const updates = [];
const lines = [];
const byPromo = {};
const note = (promo, line) => { if (!promo) return; (byPromo[promo] = byPromo[promo] || []).push(line); };
const errText = (r) => {
  const e = (r.errors && r.errors[0]) || r.error || null;
  if (!e) return r.message || 'Unknown publishing error';
  return typeof e === 'string' ? e : (e.message || e.description || JSON.stringify(e)).slice(0, 300);
};

p.posts.forEach((x, k) => {
  const r = res[k] || {};
  const ok = r.status === 'success' || r.status === 'scheduled';
  if (ok) {
    const pid = (r.postIds || [])[0] || {};
    const status = r.status === 'scheduled' ? 'Scheduled' : 'Published';
    updates.push({ id: x.record_id, fields: { 'Status': status, 'Published link': pid.postUrl || null, 'Ayrshare post ID': r.id || '' } });
    lines.push({ ok: true, item: x.item, text: status + (pid.postUrl ? ' - ' + pid.postUrl : ''), url: pid.postUrl || '' });
    note(x.promo, '• ' + x.item + ': ' + status + (pid.postUrl ? ' ' + pid.postUrl : ''));
  } else {
    const msg = errText(r);
    updates.push({ id: x.record_id, fields: { 'Status': 'Needs changes', 'Fact-check warnings': 'Publishing failed: ' + msg } });
    lines.push({ ok: false, item: x.item, text: 'Failed: ' + msg });
    note(x.promo, '• ' + x.item + ': publishing failed - ' + msg);
  }
});
p.pulled.forEach((x) => {
  updates.push({ id: x.record_id, fields: { 'Status': 'Pulled back', 'Reviewer notes': 'Pulled back automatically: ' + x.reason } });
  lines.push({ ok: false, item: x.item, text: 'Pulled back: ' + x.reason });
  note(x.promo, '• ' + x.item + ': pulled back - ' + x.reason);
});

const ops = [];
for (let i = 0; i < updates.length; i += 10) ops.push({ method: 'PATCH', url: BASE + 'tblJ0nBAkpOAXkBkv', body: { typecast: true, records: updates.slice(i, i + 10) } });
const logs = Object.keys(byPromo).map((promo) => ({ fields: { 'Event': 'Publishing run: ' + byPromo[promo].length + ' item(s)', 'Type': p.pulled.some((x) => x.promo === promo) ? 'Pulled back' : 'Published', 'Details': byPromo[promo].join(NL), 'At': $now.toISO(), 'Promotion': [promo] } }));
for (let i = 0; i < logs.length; i += 10) ops.push({ method: 'POST', url: BASE + 'tblTFaxIO2C8y6ePa', body: { typecast: true, records: logs.slice(i, i + 10) } });

return [{ json: { ops, lines, published: lines.filter((l) => l.ok).length, problems: lines.filter((l) => !l.ok).length, checked: p.checked } }];
