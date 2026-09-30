/* Offer / checkout short page (templates/lp/offer.js). Fills offer.html from window.OFFER (scripts/build_offer.py). The
   button connects to nothing: this is a draft page. */
(function () {
  var V = window.OFFER || {};
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function em(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<em>$1</em>'); }
  var TZ = V.time_zone || 'America/New_York';
  function tzOffset(tz, t) {
    try { var p = {}; new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(t)).forEach(function (x) { p[x.type] = x.value; });
      return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - t) / 6e4; } catch (e) { return -new Date(t).getTimezoneOffset(); }
  }
  var CLOSE = (function () {
    var m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(V.close_date || ''); if (!m) return new Date(Date.now() + 5 * 864e5);
    var g = Date.UTC(+m[1], +m[2] - 1, +m[3], V.close_hour == null ? 23 : V.close_hour, V.close_minute == null ? 59 : V.close_minute, 0);
    return new Date(g - tzOffset(TZ, g) * 6e4);
  })();
  var START = (function () {
    var now = Date.now(), wall = new Date(now + tzOffset(TZ, now) * 6e4);
    var g = Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth(), wall.getUTCDate() + Math.max(1, +V.starts_in_days || 9), +V.start_hour || 12, 0, 0);
    var sm = /^(\d{4})-(\d\d)-(\d\d)$/.exec(V.start_date || '');
    if (sm) { var sg = Date.UTC(+sm[1], +sm[2] - 1, +sm[3], +V.start_hour || 12, 0, 0), st = new Date(sg - tzOffset(TZ, sg) * 6e4); if (st.getTime() > now) return st; }
    return new Date(g - tzOffset(TZ, g) * 6e4);
  })();
  function day(n) { return new Date(START.getTime() + (n - 1) * 864e5); }
  function dfmt(d, wk) { var o = { day: 'numeric', month: 'short', timeZone: TZ }; if (wk) o.weekday = 'short'; return d.toLocaleDateString('en-US', o).replace(',', ''); }
  var N = V.format === 'webinar' ? 1 : 3;
  var TOK = { '{day1}': dfmt(day(1), true), '{day1_date}': dfmt(day(1)), '{day4}': dfmt(day(N + 1), true), '{day4_date}': dfmt(day(N + 1)), '{close}': dfmt(day(N + 8)),
    '{time}': (function () { try { return day(1).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ, timeZoneName: 'short' }); } catch (e) { return ''; } })(),
    '{first}': V.first_name || '', '{event}': V.event || '' };
  function fill(x) { return String(x == null ? '' : x).replace(/\{[a-z0-9_]+\}/g, function (k) { return k in TOK ? TOK[k] : ''; }); }
  var cur = V.currency || '$', money = function (n) { return cur + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };

  $('oBrand').textContent = V.brand || ''; if (V.logo) { var lg = $('oLogo'); lg.src = V.logo; lg.hidden = false; }
  $('oCloseLbl').textContent = V.bar_label || 'Enrollment closes in';
  $('oBarBtn').textContent = V.bar_cta || 'Enroll';
  $('oTitle').innerHTML = em(V.title || "You're one step from **your cohort.**");
  $('oTerms').textContent = V.terms || 'One-time payment';
  $('oProd').textContent = V.product || ''; $('oPrice').textContent = money(V.price);
  $('oMeta').textContent = V.meta || '';
  $('oTicks').innerHTML = (V.bullets || []).map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('');
  $('oTotal').textContent = money(V.price) + '.00';
  $('oCta').textContent = (V.cta || 'Enroll in the cohort') + ' · ' + money(V.price);
  $('oSecure').textContent = V.secure || 'Secure checkout';
  $('oFine').textContent = V.fine || ''; if (!V.fine) $('oFine').hidden = true;
  $('oHand').hidden = !V.hand; $('oHand').textContent = V.hand || '';

  $('oHead').innerHTML = em(V.headline || '');
  $('oLede').textContent = V.lede || '';
  if (V.photo) { $('oPhoto').src = V.photo; $('oHostCap').textContent = V.photo_note || ''; } else $('oHost').hidden = true;
  $('oBand').textContent = V.band || "Here's what you get";
  $('oList').innerHTML = (V.included || []).map(function (it, i) { return '<li><span class="on">0' + (i + 1) + '</span><span><h3>' + esc(fill(it.title)) + '</h3><p>' + esc(fill(it.text)) + '</p></span></li>'; }).join('');
  $('oWeeks').innerHTML = (V.weeks || []).map(function (w) { return '<div class="owk"><small>' + esc(w.tag) + '</small><b>' + esc(w.title) + '</b><p>' + esc(w.text) + '</p></div>'; }).join('');
  if (!(V.weeks || []).length) $('oWeeks').hidden = true;

  var W = V.walk || {};
  $('wCap').textContent = W.cap || 'Inside the cohort';
  $('wTitle').innerHTML = em(W.title || 'What you actually **walk away with**');
  $('wIntro').textContent = W.intro || ''; if (!W.intro) $('wIntro').hidden = true;
  $('wRows').innerHTML = (W.rows || []).map(function (r) {
    return '<article class="orow"><div><span class="otag">' + esc(r.tag) + '</span><h3>' + esc(r.title) + '</h3><p>' + esc(r.text) + '</p>' +
      (r.files && r.files.length ? '<ul>' + r.files.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' : '') + '</div><div class="oart" data-art="' + esc(r.art || '') + '" role="img" aria-label="' + esc(r.art_label || r.title) + '"></div></article>';
  }).join('');

  function tick() {
    var s = Math.max(0, CLOSE.getTime() - Date.now()) / 1e3, d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
    $('cdD').textContent = d; $('cdH').textContent = ('0' + h).slice(-2); $('cdM').textContent = ('0' + m).slice(-2);
  }
  if (!V.close_date) { var oc = document.querySelector('.oclose'); if (oc) oc.hidden = true; } else { tick(); setInterval(tick, 20000); }
  if (!(W.rows || []).length) { var ws = $('walk'); if (ws) ws.hidden = true; }
})();
