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
