// Shared email builder used by the n8n Code node "Build Mailchimp Emails".
// buildEmail(cf, copy, lang, photoUrl) -> full HTML (table layout, inline styles, Mailchimp-safe)
function buildEmail(cf, copy, lang, photoUrl) {
  const es = lang === 'es';
  const NAVY = '#2d3e52', GREEN = '#65B140', SAND = '#f6f3ee', INK = '#26323f', MUTED = '#6b7682';
  const LOGO = 'https://petrabax.com/images/logo/petrabax-logo-new.gif';
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const money = (n) => (es ? 'US$' : '$') + Number(n).toLocaleString('en-US');
  const fmtDate = (d) => {
    if (!d) return '';
    const x = new Date(d + 'T12:00:00Z');
    return x.toLocaleDateString(es ? 'es-US' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  };
  const shortDate = (d) => new Date(d + 'T12:00:00Z').toLocaleDateString(es ? 'es-US' : 'en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const ROOM = es ? { double: 'Habitación doble', single: 'Habitación individual', triple: 'Habitación triple' } : { double: 'Double room', single: 'Single room', triple: 'Triple room' };
  const L = es
    ? { from: 'Desde', pp: 'por persona', book: 'Reserva antes del', prices: 'Precios de la promoción', deps: 'Salidas', incl: 'Incluye', cta: 'Habla con tu asesor de viajes', terms: 'Condiciones', all: 'Todas las salidas' }
    : { from: 'From', pp: 'per person', book: 'Book by', prices: 'Promotional prices', deps: 'Departures', incl: 'Includes', cta: 'Talk to your travel advisor', terms: 'Terms', all: 'All departures' };
  const c = (k) => copy[k + '_' + lang] || '';
  const paras = (s) => String(s || '').split(/\n\s*\n|\n/).filter((p) => p.trim()).map((p) => '<p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:' + INK + '">' + esc(p.trim()) + '</p>').join('');

  const promoTiers = (cf.price_tiers || []).filter((t) => t.price_type === 'promo' && t.price > 0);
  const tierRows = promoTiers.map((t) =>
    '<tr><td style="padding:10px 12px;border-bottom:1px solid #e6e1d8;font-size:14px;color:' + INK + '">' + esc(ROOM[String(t.room_type).toLowerCase()] || t.room_type) +
    '</td><td style="padding:10px 12px;border-bottom:1px solid #e6e1d8;font-size:14px;color:' + MUTED + '">' + esc(t.applies_to || L.all) +
    '</td><td align="right" style="padding:10px 12px;border-bottom:1px solid #e6e1d8;font-size:16px;font-weight:bold;color:' + NAVY + '">' + money(t.price) + '</td></tr>').join('');

  const deps = (cf.departures || []).map((d) => '<span style="display:inline-block;margin:3px 4px 3px 0;padding:6px 10px;border-radius:14px;background:#ffffff;border:1px solid #d9e8cf;font-size:13px;color:' + NAVY + '">' + esc(shortDate(d)) + '</span>').join('');
  const incl = (cf.inclusions || []).slice(0, 8).map((i) => '<tr><td valign="top" style="padding:3px 8px 3px 0;color:' + GREEN + ';font-size:15px">&#10003;</td><td style="padding:3px 0;font-size:14px;color:' + INK + '">' + esc(i) + '</td></tr>').join('');
  const terms = [].concat(cf.restrictions || [], (cf.exclusions || []).length ? [(es ? 'No incluye: ' : 'Not included: ') + cf.exclusions.join(', ')] : [], cf.price_basis ? [(es ? 'Precios ' : 'Prices ') + cf.price_basis + '.'] : []).map(esc).join(' · ');

  const hero = photoUrl
    ? '<tr><td><img src="' + esc(photoUrl) + '" width="600" alt="' + esc(cf.tour_name) + '" style="display:block;width:100%;max-width:600px;height:auto;border:0"></td></tr>'
    : '<tr><td style="background:' + NAVY + ';background-image:linear-gradient(135deg,' + NAVY + ' 0%,#3d5a73 60%,' + GREEN + ' 140%);padding:46px 36px" align="left">' +
      '<div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#cfe6c1">' + esc((cf.destination_countries || []).join(' · ')) + '</div>' +
      '<div style="font-family:Georgia,serif;font-size:34px;line-height:1.15;color:#ffffff;margin-top:10px">' + esc(c('graphic_headline') || cf.tour_name) + '</div>' +
      '<div style="font-size:16px;color:#e7eef4;margin-top:10px">' + esc((cf.cities || []).join(' · ')) + '</div></td></tr>';

  return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(c('email_subject')) + '</title></head>' +
    '<body style="margin:0;padding:0;background:' + SAND + '">' +
    '<div style="display:none;max-height:0;overflow:hidden">' + esc(c('email_preview')) + '</div>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + SAND + '"><tr><td align="center" style="padding:24px 12px">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:10px;overflow:hidden;font-family:Helvetica,Arial,sans-serif">' +
    '<tr><td style="padding:20px 28px;border-bottom:4px solid ' + GREEN + '"><a href="https://petrabax.com"><img src="' + LOGO + '" width="180" alt="Petrabax" style="display:block;border:0"></a></td></tr>' +
    hero +
    '<tr><td style="padding:30px 36px 8px">' +
      '<div style="font-family:Georgia,serif;font-size:26px;line-height:1.25;color:' + NAVY + '">' + esc(c('email_headline') || cf.tour_name) + '</div>' +
      (cf.duration ? '<div style="font-size:14px;color:' + MUTED + ';margin-top:6px">' + esc(cf.duration) + '</div>' : '') +
    '</td></tr>' +
    '<tr><td style="padding:16px 36px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + NAVY + ';border-radius:8px"><tr>' +
      '<td style="padding:18px 22px;color:#ffffff"><div style="font-size:13px;color:#cfe6c1;text-transform:uppercase;letter-spacing:1px">' + L.from + '</div>' +
      '<div style="font-size:32px;font-weight:bold">' + money(cf.price_from) + ' <span style="font-size:14px;font-weight:normal">' + L.pp + '</span></div></td>' +
      (cf.booking_deadline ? '<td align="right" style="padding:18px 22px;color:#ffffff"><div style="font-size:13px;color:#cfe6c1;text-transform:uppercase;letter-spacing:1px">' + L.book + '</div><div style="font-size:18px;font-weight:bold">' + esc(fmtDate(cf.booking_deadline)) + '</div></td>' : '') +
    '</tr></table></td></tr>' +
    '<tr><td style="padding:12px 36px 6px">' + paras(c('email_body')) + '</td></tr>' +
    (tierRows ? '<tr><td style="padding:6px 36px 6px"><div style="font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:' + GREEN + ';margin-bottom:6px">' + L.prices + '</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + SAND + ';border-radius:8px">' + tierRows + '</table></td></tr>' : '') +
    (deps ? '<tr><td style="padding:16px 36px 6px"><div style="font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:' + GREEN + ';margin-bottom:6px">' + L.deps + '</div><div style="background:#f3f8ef;border-radius:8px;padding:10px">' + deps + '</div></td></tr>' : '') +
    (incl ? '<tr><td style="padding:16px 36px 6px"><div style="font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:' + GREEN + ';margin-bottom:6px">' + L.incl + '</div><table role="presentation" cellpadding="0" cellspacing="0">' + incl + '</table></td></tr>' : '') +
    '<tr><td align="center" style="padding:26px 36px"><a href="https://petrabax.com" style="display:inline-block;background:' + GREEN + ';color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;padding:14px 30px;border-radius:6px">' + L.cta + ' &rarr;</a></td></tr>' +
    (terms ? '<tr><td style="padding:0 36px 26px;font-size:12px;line-height:1.5;color:' + MUTED + '"><b>' + L.terms + ':</b> ' + terms + '</td></tr>' : '') +
    '<tr><td style="background:' + NAVY + ';padding:20px 36px;font-size:12px;line-height:1.6;color:#c9d3dc" align="center">Petrabax · 31-21 31st Street, 4th Floor, Astoria, NY 11106 · 800-634-1188<br>' +
      '<a href="*|UNSUB|*" style="color:#cfe6c1">' + (es ? 'Darse de baja' : 'Unsubscribe') + '</a> · <a href="*|UPDATE_PROFILE|*" style="color:#cfe6c1">' + (es ? 'Preferencias' : 'Update preferences') + '</a></td></tr>' +
    '</table></td></tr></table></body></html>';
}
// n8n Code node: "Fact-Check Copy & Build Emails" (buildEmail() is prepended from build-email-html.js)
// Checks every number in the AI copy against the verified facts, blocks commission leaks,
// then builds the EN + ES Mailchimp emails. Outputs one item per language.
const p = $('Load Promotion Facts').first().json;
const copy = $input.first().json.output || {};
const cf = p.cf;
const allowed = new Set(p.allowed_numbers.map(String));
const numsIn = (s) => (String(s || '').match(/\d[\d.,]*/g) || []).map((x) => x.replace(/[.,](?=\d{3}(?!\d))/g, '').replace(/[.,]+$/, ''));
const moneyRe = /(?:US\$|USD|\$|€|EUR)\s?\d[\d.,]*|\d[\d.,]*\s?(?:USD|EUR|€|d[oó]lares)/gi;

const warnings = { en: [], es: [] };
const keysFor = (lang) => ['facebook', 'instagram', 'linkedin', 'email_subject', 'email_preview', 'email_headline', 'email_body', 'graphic_headline', 'graphic_subline'].map((k) => k + '_' + lang);
const textOf = (v) => Array.isArray(v) ? v.map((s) => (s.title || '') + ' ' + (s.text || '')).join(' ') : String(v || '');

for (const lang of ['en', 'es']) {
  const fields = keysFor(lang).concat(['carousel_' + lang]);
  for (const k of fields) {
    const t = textOf(copy[k]);
    for (const m of (t.match(moneyRe) || [])) {
      const n = numsIn(m)[0];
      if (n && !allowed.has(n)) warnings[lang].push(k + ': mentions "' + m.trim() + '", which is not in the verified offer.');
    }
    if (/commission|comisi[oó]n|net rate|tarifa neta/i.test(t)) warnings[lang].push(k + ': mentions commission/net rates (trade-only information).');
    for (const c of p.commission_numbers) {
      if (new RegExp('\\b' + c + '\\s?%').test(t)) warnings[lang].push(k + ': mentions ' + c + '%, which matches the internal commission rate.');
    }
  }
  const pf = String(cf.price_from || '');
  for (const k of ['facebook_' + lang, 'instagram_' + lang, 'email_body_' + lang]) {
    if (pf && !numsIn(copy[k]).includes(pf)) warnings[lang].push(k + ': does not mention the "from" price.');
  }
  const subj = String(copy['email_subject_' + lang] || '');
  if (subj.length > 60) warnings[lang].push('email_subject_' + lang + ': ' + subj.length + ' characters (max 60).');
}

const settingsFor = (lang) => ({
  subject_line: copy['email_subject_' + lang],
  preview_text: copy['email_preview_' + lang],
  title: '[Petrabax] ' + cf.tour_name + ' — ' + lang.toUpperCase() + ' v' + p.version,
  from_name: 'Petrabax',
  reply_to: 'engrsaadullahsaleem7@gmail.com'
});

return ['en', 'es'].map((lang) => ({
  json: {
    lang,
    warnings: warnings[lang],
    campaign: { type: 'regular', recipients: { list_id: '8176e97349' }, settings: settingsFor(lang) },
    html: buildEmail(cf, copy, lang, p.photo_url),
    copy
  }
}));
