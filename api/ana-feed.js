// Live registrations for /ana-calin/workshop/: the total and the latest first names, read from Kit.
// Set two environment variables in the Vercel project: KIT_API_KEY (a Kit v4 API key) and
// KIT_TAG_ID (the id of the ep_registered tag). Without them it answers {ok:false} and the page
// shows no count and no names. Only first names leave this function; emails never do.
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  var key = process.env.KIT_API_KEY, tag = process.env.KIT_TAG_ID;
  if (!key || !tag) return res.status(200).json({ ok: false });
  try {
    var base = 'https://api.kit.com/v4/tags/' + encodeURIComponent(tag) + '/subscribers';
    var opt = { headers: { 'X-Kit-Api-Key': key, Accept: 'application/json' } };
    var since = new Date(Date.now() - 3 * 864e5).toISOString();
    var out = await Promise.all([
      fetch(base + '?per_page=1&include_total_count=true', opt).then(function (r) { return r.json() }),
      fetch(base + '?per_page=100&tagged_after=' + encodeURIComponent(since), opt).then(function (r) { return r.json() })
    ]);
    var count = out[0] && out[0].pagination && out[0].pagination.total_count;
    var recent = ((out[1] && out[1].subscribers) || [])
      .map(function (s) { return { name: first(s.first_name), at: s.tagged_at || s.created_at } })
      .filter(function (s) { return s.name && s.at })
      .sort(function (a, b) { return new Date(b.at) - new Date(a.at) })
      .slice(0, 8);
    res.status(200).json({ ok: true, count: typeof count === 'number' ? count : null, recent: recent });
  } catch (e) {
    res.status(200).json({ ok: false });
  }
};

// "maria  garcía" -> "Maria"; anything that is not a plain first name is dropped
function first(n) {
  n = String(n || '').trim().split(/\s+/)[0].replace(/[^\p{L}'-]/gu, '');
  if (n.length < 2 || n.length > 14) return '';
  return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
}
