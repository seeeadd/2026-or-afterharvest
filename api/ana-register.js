// Registrations for /ana-calin/workshop/: the sign-up popup posts here, and this sends the person to
// Ana's Kit through the v4 API. Posting from the page straight to Kit's public form address gets
// parked by Kit's bot check ("one more step"), which nobody sees, so nobody gets added.
// Needs KIT_API_KEY (a Kit v4 API key, Vercel environment variable). Optional: KIT_SEQUENCE_ID, the
// "EP · Confirmation" sequence, so someone who signs up again gets the "You're in." email again
// (the form's visual automation only runs the first time someone joins the form).
var FORM_ID = process.env.KIT_REG_FORM_ID || '10120079';
var FIELDS = ['ref', 'situation', 'sticky_variant', 'utm_source', 'utm_medium', 'utm_campaign'];
var ORIGINS = /^https:\/\/(2026-or-afterharvest[a-z0-9-]*\.vercel\.app|exitplan\.howwegrowtoday\.com)$/;

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  var origin = req.headers.origin || '';
  if (origin && !ORIGINS.test(origin)) return res.status(403).json({ ok: false });
  var key = process.env.KIT_API_KEY;
  if (!key) return res.status(503).json({ ok: false, error: 'not_configured' });

  var b = req.body || {};
  if (typeof b === 'string') { try { b = Object.fromEntries(new URLSearchParams(b)) } catch (e) { b = {} } }
  if (b.ep_check) return res.status(200).json({ ok: true }); // the hidden honeypot field: only bots fill it
  var email = String(b.email_address || '').trim().toLowerCase();
  var name = String(b.first_name || '').trim().slice(0, 60);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) return res.status(400).json({ ok: false, error: 'email' });
  var fields = {};
  FIELDS.forEach(function (k) { var v = b['fields[' + k + ']']; if (v != null && v !== '') fields[k] = String(v).slice(0, 200) });

  var kit = function (path, body) {
    return fetch('https://api.kit.com/v4' + path, {
      method: 'POST',
      headers: { 'X-Kit-Api-Key': key, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body)
    });
  };
  try {
    var s = await kit('/subscribers', { email_address: email, first_name: name || null, fields: fields });
    if (s.status === 422 && Object.keys(fields).length) s = await kit('/subscribers', { email_address: email, first_name: name || null });
    if (!s.ok) return res.status(502).json({ ok: false, error: 'kit_subscriber_' + s.status });
    var f = await kit('/forms/' + FORM_ID + '/subscribers', { email_address: email, referrer: String(b.referrer || req.headers.referer || '').slice(0, 500) || null });
    if (!f.ok) return res.status(502).json({ ok: false, error: 'kit_form_' + f.status });
    var again = f.status === 200; // 200 = already on the form (signed up before), 201 = first time
    if (again && process.env.KIT_SEQUENCE_ID) await kit('/sequences/' + process.env.KIT_SEQUENCE_ID + '/subscribers', { email_address: email });
    return res.status(200).json({ ok: true, again: again });
  } catch (e) {
    return res.status(502).json({ ok: false, error: 'kit_unreachable' });
  }
};
