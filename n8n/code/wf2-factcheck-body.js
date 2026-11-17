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

// Spanish versions of cities/inclusions come from the AI; numbers must survive translation
const numBag = (arr) => (arr || []).map((x) => numsIn(x).join(',')).join('|');
if ((copy.inclusions_es || []).length && numBag(copy.inclusions_es) !== numBag(cf.inclusions)) {
  warnings.es.push('inclusions_es: numbers differ from the verified inclusions - check the Spanish translation.');
}
const capFirst = (x) => String(x || '').replace(/^\s*\S/, (c) => c.toUpperCase());
const cfFor = (lang) => {
  const out = lang === 'es'
    ? { ...cf, inclusions: (copy.inclusions_es || []).length === (cf.inclusions || []).length ? copy.inclusions_es : cf.inclusions, cities: (copy.cities_es || []).length === (cf.cities || []).length ? copy.cities_es : cf.cities, tour_name: copy.tour_name_es || cf.tour_name }
    : { ...cf };
  out.inclusions = (out.inclusions || []).map(capFirst);
  return out;
};

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
    html: buildEmail(cfFor(lang), copy, lang, p.photo_url),
    cf_lang: cfFor(lang),
    copy
  }
}));
