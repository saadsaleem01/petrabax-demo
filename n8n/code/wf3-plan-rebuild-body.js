// n8n Code node: "Plan Rebuild" (GFX + buildEmail are prepended)
// Re-checks an employee's edits against the verified supplier offer, decides what must be
// re-rendered (only if the graphic inputs changed), and rebuilds the Mailchimp email.
const rec = $('Get Content Record').first().json;
const promo = $('Get Promotion').first().json;
const f = rec.fields || {};
const pf = promo.fields || {};
const today = $now.toFormat('yyyy-MM-dd');
const NL = String.fromCharCode(10);

let cf = {}, offer = {};
try { cf = JSON.parse(pf['Customer facts JSON'] || '{}'); } catch (e) { cf = {}; }
try { offer = JSON.parse(pf['Offer JSON'] || '{}'); } catch (e) { offer = {}; }
let cfL = cf;
try { if (f['Localized facts JSON']) cfL = JSON.parse(f['Localized facts JSON']); } catch (e) { cfL = cf; }

const lang = String(f['Language'] || 'EN').toLowerCase();
const channel = f['Channel'] || '';
const reasons = [];
if (!rec.id) reasons.push('Content record not found.');
if (!promo.id) reasons.push('Linked promotion not found.');
if (['Published', 'Scheduled'].includes(f['Status'])) reasons.push('This item is already ' + String(f['Status']).toLowerCase() + '. Pull it back before editing.');
if (pf['Check result'] === 'Blocked' || ['Blocked', 'Expired'].includes(pf['Workflow status'])) reasons.push('The promotion is ' + (pf['Workflow status'] || 'blocked') + '.');
if (cf.booking_deadline && cf.booking_deadline < today) reasons.push('Booking deadline ' + cf.booking_deadline + ' has passed.');

// ---- Re-check the edited text against the verified offer ----
const numsIn = (s) => (String(s || '').match(/\d[\d.,]*/g) || []).map((x) => x.replace(/[.,](?=\d{3}(?!\d))/g, '').replace(/[.,]+$/, ''));
const moneyRe = /(?:US\$|USD|\$|€|EUR)\s?\d[\d.,]*|\d[\d.,]*\s?(?:USD|EUR|€|d[oó]lares)/gi;
const allowed = new Set();
(cf.price_tiers || []).forEach((t) => allowed.add(String(t.price)));
allowed.add(String(cf.price_from));
(offer.discounts || []).forEach((d) => numsIn(d.amount).forEach((n) => allowed.add(n)));
numsIn(cf.single_supplement).forEach((n) => allowed.add(n));
const com = offer.commission || {};
const confirmed = /supplier confirmed|confirmed by (the )?supplier|confirmado por el proveedor/i.test(f['Reviewer notes'] || '');

const warnings = [];
const accepted = [];
const fieldsToCheck = ['Headline', 'Subline', 'Body', 'Email subject', 'Email preview text'];
for (const k of fieldsToCheck) {
  const t = String(f[k] || '');
  for (const m of (t.match(moneyRe) || [])) {
    const n = numsIn(m)[0];
    if (!n || allowed.has(n)) continue;
    if (confirmed) accepted.push(k + ': "' + m.trim() + '" is not in the supplier offer - accepted because the reviewer noted the supplier confirmed it.');
    else warnings.push(k + ': "' + m.trim() + '" is not in the verified supplier offer. Fix it, or add "supplier confirmed" in Reviewer notes.');
  }
  if (/commission|comisi[oó]n|net rate|tarifa neta/i.test(t)) warnings.push(k + ': mentions commission/net rates (trade-only information).');
  numsIn(com.rate).forEach((c) => { if (new RegExp('\\b' + c + '\\s?%').test(t)) warnings.push(k + ': mentions ' + c + '%, which matches the internal commission rate.'); });
}
if (channel === 'Email' && String(f['Email subject'] || '').length > 60) warnings.push('Email subject: ' + String(f['Email subject']).length + ' characters (max 60).');

// ---- Rebuild inputs from the (edited) record ----
const slides = [];
const re = /Slide\s*\d+:\s*([^\n]*)\n?([\s\S]*?)(?=\n\s*\n\s*Slide\s*\d+:|\s*$)/g;
let mm;
while ((mm = re.exec(String(f['Body'] || ''))) !== null) { slides.push({ title: mm[1].trim(), text: mm[2].trim() }); if (slides.length >= 4) break; }

const copy = {};
copy['graphic_headline_' + lang] = f['Headline'] || '';
copy['graphic_subline_' + lang] = f['Subline'] || '';
copy['carousel_' + lang] = slides;
const photo = f['Photo URL'] || '';

const hashOf = (v) => { const s = JSON.stringify(v); let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); };
let jobs = [];
let hash = '';
if (['Facebook', 'Instagram', 'LinkedIn'].includes(channel)) {
  hash = hashOf(['post', lang, copy['graphic_headline_' + lang], copy['graphic_subline_' + lang], photo, [], cfL.price_from, cfL.booking_deadline]);
  const g = GFX.buildPost(cfL, copy, lang, photo);
  jobs = [{ kind: 'post', index: 0, request: { html: g.html, css: g.css, google_fonts: g.fonts, viewport_width: g.w, viewport_height: g.h, device_scale: 1, ms_delay: 300 } }];
} else if (channel === 'Instagram carousel') {
  if (slides.length !== 4) warnings.push('Carousel: keep the "Slide 1: ... Slide 4: ..." format with exactly 4 slides.');
  hash = hashOf(['carousel', lang, copy['graphic_headline_' + lang], copy['graphic_subline_' + lang], photo, slides.map((s) => [s.title, s.text]), cfL.price_from, cfL.booking_deadline]);
  jobs = [0, 1, 2, 3].map((i) => { const g = GFX.buildSlide(cfL, copy, lang, i, photo); return { kind: 'slide', index: i, request: { html: g.html, css: g.css, google_fonts: g.fonts, viewport_width: g.w, viewport_height: g.h, device_scale: 1, ms_delay: 300 } }; });
}
const needsRender = jobs.length > 0 && hash !== (f['Graphic hash'] || '') && reasons.length === 0;

let email = null;
if (channel === 'Email' && f['Mailchimp campaign ID']) {
  const ecopy = {};
  ecopy['email_subject_' + lang] = f['Email subject'] || '';
  ecopy['email_preview_' + lang] = f['Email preview text'] || '';
  ecopy['email_headline_' + lang] = f['Headline'] || '';
  ecopy['email_body_' + lang] = f['Body'] || '';
  ecopy['graphic_headline_' + lang] = cf.tour_name || '';
  email = {
    id: f['Mailchimp campaign ID'],
    settings: { subject_line: f['Email subject'] || cf.tour_name, preview_text: f['Email preview text'] || '', from_name: 'Petrabax', reply_to: 'engrsaadullahsaleem7@gmail.com' },
    html: buildEmail(cfL, ecopy, lang, photo)
  };
}

return [{
  json: {
    ok: reasons.length === 0,
    reasons,
    item: f['Item'] || 'Content item',
    record_id: rec.id,
    promo_id: promo.id,
    lang,
    channel,
    status: warnings.length ? 'Needs changes' : 'Ready for review',
    warnings,
    accepted,
    needsRender,
    skippedRender: jobs.length > 0 && !needsRender,
    jobs: needsRender ? jobs : [],
    hash,
    email
  }
}];
