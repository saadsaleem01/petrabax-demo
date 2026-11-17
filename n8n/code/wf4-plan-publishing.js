// n8n Code node: "Plan Publishing"
// Takes Approved drafts, re-checks the booking deadline one last time, and builds Ayrshare posts.
const today = $now.toFormat('yyyy-MM-dd');
const nowIso = $now.toUTC().toISO();
const recs = $input.all().flatMap((i) => i.json.records || []);
const PLAT = { Facebook: 'facebook', Instagram: 'instagram', LinkedIn: 'linkedin', 'Instagram carousel': 'instagram' };

const posts = [];
const pulled = [];
for (const r of recs) {
  const f = r.fields || {};
  let cf = {};
  try { cf = JSON.parse(f['Localized facts JSON'] || '{}'); } catch (e) { cf = {}; }
  const base = { record_id: r.id, item: f['Item'] || 'Content item', promo: (f['Promotion'] || [])[0] || null };
  if (cf.booking_deadline && cf.booking_deadline < today) {
    pulled.push({ ...base, reason: 'Booking deadline ' + cf.booking_deadline + ' has passed - not published.' });
    continue;
  }
  const plat = PLAT[f['Channel']];
  if (!plat) continue; // emails are sent from Mailchimp
  const media = (f['Graphic'] || []).map((a) => a.url).filter(Boolean);
  if (plat === 'instagram' && !media.length) {
    pulled.push({ ...base, reason: 'Instagram needs an image - generate or rebuild the graphic first.' });
    continue;
  }
  const body = { post: f['Body'] || '', platforms: [plat], idempotencyKey: r.id + '-' + (f['Graphic hash'] || 'v1') };
  if (media.length) body.mediaUrls = media;
  const when = f['Scheduled for'];
  if (when && when > nowIso) body.scheduleDate = new Date(when).toISOString().replace(/\.\d{3}Z$/, 'Z');
  posts.push({ ...base, platform: plat, scheduled: !!body.scheduleDate, body });
}
return [{ json: { posts, pulled, checked: recs.length } }];
