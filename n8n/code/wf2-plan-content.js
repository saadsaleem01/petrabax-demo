// n8n Code node: "Plan Content Records"
// Replaces this promotion's content in Airtable with the new drafts, updates the promotion,
// and writes a change-log entry.
const BASE = 'https://api.airtable.com/v0/appq1uORcGaTdhNiA/';
const T = { promos: 'tblto8v1qITtb9Bjw', content: 'tblJ0nBAkpOAXkBkv', log: 'tblTFaxIO2C8y6ePa' };
const p = $('Load Promotion Facts').first().json;
const built = $('Fact-Check Copy & Build Emails').all().map((i) => i.json);
const drafts = $('Create Mailchimp Draft').all().map((i) => i.json);
const copy = built[0].copy;
const NL = String.fromCharCode(10);
const chunk = (arr, n) => { const out = []; for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out; };

const rows = [];
built.forEach((b, i) => {
  const lang = b.lang;
  const L = lang.toUpperCase();
  const warn = b.warnings;
  const warnFor = (k) => warn.filter((w) => w.startsWith(k + '_' + lang) || w.startsWith(k + ':')).join(NL);
  const status = (k) => (warnFor(k) ? 'Needs changes' : 'Ready for review');
  const base = { 'Language': L, 'Promotion': [p.record_id], 'Headline': copy['graphic_headline_' + lang] || '', 'Subline': copy['graphic_subline_' + lang] || '' };
  for (const ch of [['facebook', 'Facebook'], ['instagram', 'Instagram'], ['linkedin', 'LinkedIn']]) {
    rows.push({ fields: { ...base, 'Item': ch[1] + ' ' + L + ' — ' + p.cf.tour_name, 'Channel': ch[1], 'Body': copy[ch[0] + '_' + lang] || '', 'Status': status(ch[0]), 'Fact-check warnings': warnFor(ch[0]) } });
  }
  const slides = (copy['carousel_' + lang] || []).map((s, n) => 'Slide ' + (n + 1) + ': ' + s.title + NL + s.text).join(NL + NL);
  rows.push({ fields: { ...base, 'Item': 'Instagram carousel ' + L + ' — ' + p.cf.tour_name, 'Channel': 'Instagram carousel', 'Body': slides, 'Status': status('carousel'), 'Fact-check warnings': warnFor('carousel') } });
  const d = drafts[i] || {};
  const emailWarn = warn.filter((w) => /^email_/.test(w)).join(NL);
  rows.push({ fields: { ...base, 'Item': 'Email ' + L + ' — ' + p.cf.tour_name, 'Channel': 'Email', 'Headline': copy['email_headline_' + lang] || '', 'Email subject': copy['email_subject_' + lang] || '', 'Email preview text': copy['email_preview_' + lang] || '', 'Body': copy['email_body_' + lang] || '', 'Status': emailWarn ? 'Needs changes' : 'Ready for review', 'Fact-check warnings': emailWarn, 'Mailchimp campaign ID': d.id || '', 'Preview link': d.web_id ? 'https://us18.admin.mailchimp.com/campaigns/edit?id=' + d.web_id : null } });
});

const ops = [];
for (const ids of chunk(p.existing_content_ids, 10)) {
  ops.push({ method: 'DELETE', url: BASE + T.content + '?' + ids.map((id) => 'records[]=' + id).join('&'), body: {} });
}
for (const records of chunk(rows, 10)) ops.push({ method: 'POST', url: BASE + T.content, body: { typecast: true, records } });

const needs = rows.filter((r) => r.fields.Status === 'Needs changes').length;
ops.push({ method: 'PATCH', url: BASE + T.promos, body: { typecast: true, records: [{ id: p.record_id, fields: { 'Workflow status': needs ? 'Needs check' : 'Ready for review' } }] } });
ops.push({ method: 'POST', url: BASE + T.log, body: { typecast: true, records: [{ fields: {
  'Event': 'Content generated: ' + rows.length + ' drafts (EN + ES)',
  'Type': 'Edited',
  'Details': rows.map((r) => '• ' + r.fields.Item + ' — ' + r.fields.Status).join(NL) + (p.existing_content_ids.length ? NL + NL + p.existing_content_ids.length + ' previous draft(s) replaced.' : ''),
  'At': $now.toISO(),
  'Promotion': [p.record_id]
} }] } });

return ops.map((o) => ({ json: o }));
