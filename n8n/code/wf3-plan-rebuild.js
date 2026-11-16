// Shared graphic templates (rendered to PNG by HTMLCSStoImage).
// buildPost(cf, copy, lang, photoUrl)          -> { html, css, w, h }  1080x1080
// buildSlide(cf, copy, lang, i, photoUrl)      -> { html, css, w, h }  1080x1350, i = 0..3
const GFX = (() => {
  const NAVY = '#24364a', NAVY2 = '#33506b', GREEN = '#65B140', SAND = '#f4efe6', GOLD = '#d9b26f';
  const LOGO = 'https://petrabax.com/images/logo/petrabax-logo-new.gif';
  const FONTS = 'Playfair Display|Inter';
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const money = (n, es) => (es ? 'US$' : '$') + Number(n).toLocaleString('en-US');
  const fmt = (d, es) => d ? new Date(d + 'T12:00:00Z').toLocaleDateString(es ? 'es-ES' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : '';
  const COUNTRY_ES = { Spain: 'España', Portugal: 'Portugal', Morocco: 'Marruecos', France: 'Francia', Italy: 'Italia' };
  const countries = (cf, es) => (cf.destination_countries || []).map((c) => (es ? COUNTRY_ES[c] || c : c)).join(' · ');
  const dur = (cf, es) => !es ? (cf.duration || '') : String(cf.duration || '').replace(/\bdays?\b/gi, (m) => (/s$/i.test(m) ? 'días' : 'día')).replace(/\bnights?\b/gi, (m) => (/s$/i.test(m) ? 'noches' : 'noche'));
  const FLAGS = { Spain: '🇪🇸', Portugal: '🇵🇹', Morocco: '🇲🇦', 'España': '🇪🇸', 'Marruecos': '🇲🇦' };
  const T = (es) => es
    ? { from: 'Desde', pp: 'por persona', book: 'Reserva antes del', incl: 'Incluye', route: 'El recorrido', cta: 'Reserva con tu asesor de viajes', swipe: 'Desliza', early: 'Precio especial' }
    : { from: 'From', pp: 'per person', book: 'Book by', incl: 'What’s included', route: 'The route', cta: 'Book with your travel advisor', swipe: 'Swipe', early: 'Special price' };

  // Azulejo-inspired tile pattern: pure CSS, no stock photos needed
  const pattern = 'background-color:' + NAVY + ';background-image:' +
    'radial-gradient(circle at 50% 50%, rgba(255,255,255,.07) 0 18%, transparent 19%),' +
    'conic-gradient(from 45deg, rgba(255,255,255,.05) 0 25%, transparent 0 50%, rgba(255,255,255,.05) 0 75%, transparent 0),' +
    'linear-gradient(160deg,' + NAVY + ' 0%,' + NAVY2 + ' 55%, #2f6a4a 130%);background-size:120px 120px,120px 120px,100% 100%;';
  const bg = (photoUrl) => photoUrl
    ? 'background:linear-gradient(180deg,rgba(20,32,45,.15) 0%,rgba(20,32,45,.25) 45%,rgba(20,32,45,.88) 100%),url(' + esc(photoUrl) + ') center/cover no-repeat;'
    : pattern;

  const baseCss = '*{box-sizing:border-box;margin:0;padding:0}body{font-family:Inter,Helvetica,Arial,sans-serif;color:#fff}' +
    '.frame{position:relative;overflow:hidden}' +
    '.logo{position:absolute;top:56px;left:56px;background:#fff;border-radius:14px;padding:14px 20px}.logo img{display:block;height:44px}' +
    '.tag{position:absolute;top:66px;right:56px;font-size:24px;letter-spacing:5px;text-transform:uppercase;color:#cfe6c1;font-weight:600}' +
    '.serif{font-family:"Playfair Display",Georgia,serif}' +
    '.bar{height:8px;background:' + GREEN + ';position:absolute;left:0;right:0;bottom:0}' +
    '.url{font-size:24px;color:#d6e2ec;letter-spacing:1px}';

  function priceBlock(cf, es, big) {
    const t = T(es);
    return '<div style="display:inline-flex;align-items:stretch;gap:0;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.25)">' +
      '<div style="background:' + GREEN + ';padding:' + (big ? '26px 34px' : '20px 28px') + '"><div style="font-size:' + (big ? 24 : 20) + 'px;text-transform:uppercase;letter-spacing:2px;color:#eaf6e1">' + t.from + '</div>' +
      '<div style="font-size:' + (big ? 76 : 58) + 'px;font-weight:800;line-height:1">' + money(cf.price_from, es) + '</div>' +
      '<div style="font-size:' + (big ? 24 : 20) + 'px;color:#eaf6e1">' + t.pp + '</div></div>' +
      (cf.booking_deadline ? '<div style="background:#fff;color:' + NAVY + ';padding:' + (big ? '26px 34px' : '20px 28px') + ';display:flex;flex-direction:column;justify-content:center"><div style="font-size:' + (big ? 22 : 19) + 'px;text-transform:uppercase;letter-spacing:2px;color:#6b7682">' + t.book + '</div><div style="font-size:' + (big ? 36 : 30) + 'px;font-weight:700">' + esc(fmt(cf.booking_deadline, es)) + '</div></div>' : '') +
      '</div>';
  }

  function buildPost(cf, copy, lang, photoUrl) {
    const es = lang === 'es';
    const flags = (cf.destination_countries || []).map((c) => FLAGS[c] || '').join(' ');
    const html = '<div class="frame" style="width:1080px;height:1080px;' + bg(photoUrl) + '">' +
      '<div class="logo"><img src="' + LOGO + '"></div>' +
      '<div class="tag">' + esc(countries(cf, es)) + '</div>' +
      '<div style="position:absolute;left:72px;right:72px;bottom:96px">' +
        '<div style="font-size:30px;color:' + GOLD + ';letter-spacing:3px;text-transform:uppercase;margin-bottom:18px">' + esc(dur(cf, es)) + ' ' + flags + '</div>' +
        '<div class="serif" style="font-size:96px;line-height:1.02;font-weight:700;margin-bottom:22px">' + esc(copy['graphic_headline_' + lang] || cf.tour_name) + '</div>' +
        '<div style="font-size:36px;line-height:1.3;color:#e7eef4;margin-bottom:40px;max-width:860px">' + esc(copy['graphic_subline_' + lang] || '') + '</div>' +
        priceBlock(cf, es, false) +
      '</div>' +
      '<div style="position:absolute;right:72px;bottom:40px" class="url">petrabax.com</div>' +
      '<div class="bar"></div></div>';
    return { html, css: baseCss, w: 1080, h: 1080, fonts: FONTS };
  }

  function buildSlide(cf, copy, lang, i, photoUrl) {
    const es = lang === 'es';
    const t = T(es);
    const slides = copy['carousel_' + lang] || [];
    const s = slides[i] || {};
    const dots = [0, 1, 2, 3].map((k) => '<span style="display:inline-block;width:' + (k === i ? 46 : 14) + 'px;height:14px;border-radius:7px;margin-right:10px;background:' + (k === i ? GREEN : 'rgba(255,255,255,.45)') + '"></span>').join('');
    let body = '';
    if (i === 0) {
      body = '<div style="position:absolute;left:80px;right:80px;bottom:200px">' +
        '<div style="font-size:30px;color:' + GOLD + ';letter-spacing:4px;text-transform:uppercase;margin-bottom:24px">' + esc(cf.tour_name) + '</div>' +
        '<div class="serif" style="font-size:118px;line-height:1;font-weight:700;margin-bottom:30px">' + esc(s.title || copy['graphic_headline_' + lang]) + '</div>' +
        '<div style="font-size:40px;line-height:1.35;color:#e7eef4">' + esc(s.text || '') + '</div></div>' +
        '<div style="position:absolute;right:80px;bottom:110px;font-size:28px;color:#cfe6c1">' + t.swipe + ' →</div>';
    } else if (i === 1) {
      const cities = (cf.cities || []).map((c, k, a) => '<div style="display:flex;align-items:center;gap:26px;margin-bottom:22px"><span style="width:30px;height:30px;border-radius:50%;background:' + (k === 0 || k === a.length - 1 ? GREEN : '#fff') + ';border:6px solid ' + NAVY2 + ';box-shadow:0 0 0 3px ' + GREEN + '"></span><span style="font-size:52px;font-weight:600">' + esc(c) + '</span></div>').join('');
      body = '<div style="position:absolute;left:80px;right:80px;top:210px">' +
        '<div style="font-size:30px;color:' + GOLD + ';letter-spacing:4px;text-transform:uppercase;margin-bottom:14px">' + t.route + '</div>' +
        '<div class="serif" style="font-size:80px;font-weight:700;line-height:1.05;margin-bottom:46px">' + esc(s.title || '') + '</div>' +
        '<div style="border-left:4px dashed rgba(255,255,255,.35);margin-left:13px;padding-left:0">' + cities + '</div>' +
        '<div style="font-size:34px;color:#e7eef4;margin-top:30px;line-height:1.35">' + esc(s.text || '') + '</div></div>';
    } else if (i === 2) {
      const incl = (cf.inclusions || []).slice(0, 7).map((x) => '<div style="display:flex;gap:22px;align-items:flex-start;margin-bottom:24px"><span style="flex:none;width:48px;height:48px;border-radius:50%;background:' + GREEN + ';color:#fff;font-size:30px;font-weight:800;display:flex;align-items:center;justify-content:center">✓</span><span style="font-size:40px;line-height:1.25">' + esc(x) + '</span></div>').join('');
      body = '<div style="position:absolute;left:80px;right:80px;top:210px">' +
        '<div style="font-size:30px;color:' + GOLD + ';letter-spacing:4px;text-transform:uppercase;margin-bottom:14px">' + t.incl + '</div>' +
        '<div class="serif" style="font-size:80px;font-weight:700;line-height:1.05;margin-bottom:50px">' + esc(s.title || '') + '</div>' + incl + '</div>';
    } else {
      body = '<div style="position:absolute;left:80px;right:80px;top:260px">' +
        '<div style="font-size:30px;color:' + GOLD + ';letter-spacing:4px;text-transform:uppercase;margin-bottom:14px">' + t.early + '</div>' +
        '<div class="serif" style="font-size:96px;font-weight:700;line-height:1.02;margin-bottom:30px">' + esc(s.title || cf.tour_name) + '</div>' +
        '<div style="font-size:38px;color:#e7eef4;line-height:1.35;margin-bottom:60px">' + esc(dur(cf, es)) + ((cf.cities || []).length ? ' · ' + (cf.cities || []).length + (es ? ' ciudades' : ' cities') : '') + '</div>' +
        priceBlock(cf, es, true) +
        '<div style="margin-top:70px;display:inline-block;background:#fff;color:' + NAVY + ';font-size:36px;font-weight:700;padding:24px 40px;border-radius:14px">' + t.cta + ' → petrabax.com</div></div>';
    }
    const html = '<div class="frame" style="width:1080px;height:1350px;' + (i === 0 ? bg(photoUrl) : pattern) + '">' +
      '<div class="logo"><img src="' + LOGO + '"></div>' +
      '<div class="tag">' + (i + 1) + ' / 4</div>' + body +
      '<div style="position:absolute;left:80px;bottom:60px">' + dots + '</div>' +
      '<div style="position:absolute;right:80px;bottom:52px" class="url">petrabax.com</div>' +
      '<div class="bar"></div></div>';
    return { html, css: baseCss, w: 1080, h: 1350, fonts: FONTS };
  }
  return { buildPost, buildSlide };
})();
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
