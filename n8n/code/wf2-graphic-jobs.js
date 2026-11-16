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
// n8n Code node: "Build Graphic Jobs" (GFX templates are prepended from build-graphics-html.js)
// One square post + 4 carousel slides per language = 10 render jobs.
const p = $('Load Promotion Facts').first().json;
const built = $('Fact-Check Copy & Build Emails').all().map((i) => i.json);
const copy = built[0].copy;
const jobs = [];
for (const b of built) {
  const cfL = b.cf_lang || p.cf;
  const post = GFX.buildPost(cfL, copy, b.lang, p.photo_url);
  jobs.push({ lang: b.lang, kind: 'post', index: 0, ...post });
  for (let i = 0; i < 4; i++) jobs.push({ lang: b.lang, kind: 'slide', index: i, ...GFX.buildSlide(cfL, copy, b.lang, i, p.photo_url) });
}
return jobs.map((j) => ({ json: { lang: j.lang, kind: j.kind, index: j.index, request: { html: j.html, css: j.css, google_fonts: j.fonts, viewport_width: j.w, viewport_height: j.h, device_scale: 1, ms_delay: 300 } } }));