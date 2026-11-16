// n8n Code node: "Collect Results"
// Merges the plan with any freshly rendered graphics into one Airtable update + change-log entry.
const BASE = 'https://api.airtable.com/v0/appq1uORcGaTdhNiA/';
const p = $('Plan Rebuild').first().json;
const NL = String.fromCharCode(10);
let renders = [];
if (p.needsRender) { try { renders = $('Render Graphic').all().map((i) => i.json); } catch (e) { renders = []; } }
const urls = renders.map((r) => r && r.url).filter(Boolean);

let status = p.status;
const warn = p.warnings.slice();
const fields = {};
let rendered = 0;
if (p.needsRender) {
  if (urls.length === p.jobs.length) {
    fields['Graphic'] = urls.map((u, n) => ({ url: u + '.png', filename: 'petrabax-' + p.lang + '-' + (urls.length > 1 ? 'slide-' + (n + 1) : 'post') + '.png' }));
    fields['Graphic hash'] = p.hash;
    rendered = urls.length;
  } else {
    warn.push('Graphic could not be rendered - click Rebuild again.');
    status = 'Needs changes';
  }
}
fields['Status'] = status;
fields['Fact-check warnings'] = warn.join(NL);

const details = [
  'Re-checked against the verified supplier offer: ' + (warn.length ? warn.length + ' problem(s)' : 'all prices OK') + '.',
  warn.length ? warn.map((w) => '• ' + w).join(NL) : '',
  p.accepted.length ? 'Accepted with supplier confirmation:' + NL + p.accepted.map((a) => '• ' + a).join(NL) : '',
  p.jobs.length || p.skippedRender ? (rendered ? 'Graphic re-rendered (' + rendered + ' image' + (rendered > 1 ? 's' : '') + ').' : (p.skippedRender ? 'Graphic unchanged - not re-rendered (no image quota used).' : '')) : '',
  p.email ? 'Mailchimp draft updated with the edited subject, preview and text.' : ''
].filter(Boolean).join(NL);

const ops = [
  { method: 'PATCH', url: BASE + 'tblJ0nBAkpOAXkBkv', body: { typecast: true, records: [{ id: p.record_id, fields }] } },
  { method: 'POST', url: BASE + 'tblTFaxIO2C8y6ePa', body: { typecast: true, records: [{ fields: { 'Event': 'Edited & re-checked: ' + p.item + ' (' + status + ')', 'Type': 'Edited', 'Details': details, 'At': $now.toISO(), 'Promotion': [p.promo_id] } }] } }
];
return [{ json: { ops, email: p.email, status, warnings: warn, rendered, skipped: p.skippedRender, item: p.item, accepted: p.accepted } }];
