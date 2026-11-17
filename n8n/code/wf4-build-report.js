// n8n Code node: "Build Report"
// Combines Ayrshare post analytics and Mailchimp campaign reports into a weekly summary.
const posts = $('Plan Report').first().json.posts;
let stats = [];
if (posts.length) { try { stats = $('Get Post Analytics').all().map((i) => i.json); } catch (e) { stats = []; } }
let mc = [];
try { mc = ($('Get Mailchimp Reports').first().json.reports || []); } catch (e) { mc = []; }

const pick = (o, keys) => { for (const k of keys) { if (o && typeof o[k] === 'number') return o[k]; } return null; };
const rows = posts.map((p, k) => {
  const s = stats[k] || {};
  const a = (s[p.platform] && (s[p.platform].analytics || s[p.platform])) || {};
  const reach = pick(a, ['impressionsUnique', 'reachCount', 'reach', 'impressionCount', 'impressions', 'impressionsCount', 'views']);
  const likes = pick(a, ['likeCount', 'likes', 'reactionsCount', 'reactions']) || 0;
  const comments = pick(a, ['commentsCount', 'commentCount', 'comments']) || 0;
  const shares = pick(a, ['sharesCount', 'shareCount', 'shares']) || 0;
  const err = s.error || (s.status === 'error' ? (s.message || 'analytics unavailable') : null);
  return { item: p.item, platform: p.platform, url: p.url, reach, engagement: likes + comments + shares, likes, comments, shares, err };
});
const totReach = rows.reduce((n, r) => n + (r.reach || 0), 0);
const totEng = rows.reduce((n, r) => n + r.engagement, 0);
const sent = mc.filter((c) => c.emails_sent > 0);
const opens = sent.reduce((n, c) => n + ((c.opens && c.opens.unique_opens) || 0), 0);
const clicks = sent.reduce((n, c) => n + ((c.clicks && c.clicks.unique_clicks) || 0), 0);

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const NAVY = '#2d3e52', GREEN = '#65B140';
const card = (label, val) => '<td style="padding:14px 16px;background:#f6f3ee;border-radius:10px;text-align:center"><div style="font-size:12px;color:#6b7682;text-transform:uppercase;letter-spacing:1px">' + label + '</div><div style="font-size:28px;font-weight:bold;color:' + NAVY + '">' + val + '</div></td>';
const title = 'Week of ' + $now.startOf('week').toFormat('MMM d, yyyy');
let html = '<div style="font-family:Arial,sans-serif;max-width:820px;margin:30px auto;padding:26px;border:2px solid ' + GREEN + ';border-radius:12px;background:#fff">';
html += '<h2 style="margin:0 0 4px;color:' + NAVY + '">📊 Petrabax marketing report</h2><div style="color:#6b7682;margin-bottom:18px">' + esc(title) + '</div>';
html += '<table style="width:100%;border-spacing:10px"><tr>' + card('Posts published', rows.length) + card('Reach', totReach ? totReach.toLocaleString('en-US') : '–') + card('Engagement', totEng.toLocaleString('en-US')) + card('Email opens', opens) + card('Email clicks', clicks) + '</tr></table>';
html += '<h3 style="color:' + NAVY + ';margin-top:22px">Social posts</h3>';
html += rows.length ? '<table style="width:100%;border-collapse:collapse;font-size:13px"><tr style="background:' + NAVY + ';color:#fff"><th style="text-align:left;padding:6px">Post</th><th>Platform</th><th>Reach</th><th>Likes</th><th>Comments</th><th>Shares</th></tr>' +
  rows.map((r) => '<tr><td style="padding:6px;border-bottom:1px solid #eee">' + (r.url ? '<a href="' + esc(r.url) + '">' + esc(r.item) + '</a>' : esc(r.item)) + (r.err ? '<div style="color:#8a5a00;font-size:11px">' + esc(r.err) + '</div>' : '') + '</td><td style="text-align:center;border-bottom:1px solid #eee">' + esc(r.platform) + '</td><td style="text-align:center;border-bottom:1px solid #eee">' + (r.reach == null ? '–' : r.reach) + '</td><td style="text-align:center;border-bottom:1px solid #eee">' + r.likes + '</td><td style="text-align:center;border-bottom:1px solid #eee">' + r.comments + '</td><td style="text-align:center;border-bottom:1px solid #eee">' + r.shares + '</td></tr>').join('') + '</table>'
  : '<p style="color:#6b7682">No published posts yet.</p>';
html += '<h3 style="color:' + NAVY + ';margin-top:22px">Email campaigns</h3>';
html += sent.length ? '<table style="width:100%;border-collapse:collapse;font-size:13px"><tr style="background:' + NAVY + ';color:#fff"><th style="text-align:left;padding:6px">Campaign</th><th>Sent</th><th>Open rate</th><th>Click rate</th></tr>' +
  sent.map((c) => '<tr><td style="padding:6px;border-bottom:1px solid #eee">' + esc(c.campaign_title) + '</td><td style="text-align:center;border-bottom:1px solid #eee">' + c.emails_sent + '</td><td style="text-align:center;border-bottom:1px solid #eee">' + Math.round(((c.opens && c.opens.open_rate) || 0) * 100) + '%</td><td style="text-align:center;border-bottom:1px solid #eee">' + Math.round(((c.clicks && c.clicks.click_rate) || 0) * 100) + '%</td></tr>').join('') + '</table>'
  : '<p style="color:#6b7682">No campaigns sent yet (drafts are waiting for approval in Mailchimp).</p>';
html += '<p style="color:#999;font-size:11px;margin-top:20px">Generated ' + $now.toFormat('yyyy-MM-dd HH:mm') + ' · Saved to Airtable › Reports</p></div>';

const summary = rows.length + ' post(s), reach ' + (totReach || '–') + ', engagement ' + totEng + '; ' + sent.length + ' email campaign(s), ' + opens + ' opens, ' + clicks + ' clicks.';
return [{ json: { html, record: { fields: { 'Report': title, 'Created': $now.toISO(), 'Posts published': rows.length, 'Total reach': totReach, 'Total engagement': totEng, 'Email opens': opens, 'Email clicks': clicks, 'Summary': summary, 'Report HTML': html } } } }];
