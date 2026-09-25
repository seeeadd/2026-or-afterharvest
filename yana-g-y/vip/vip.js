/* VIP upsell hero (templates/lp/vip.js). Fills templates/lp/vip.html from window.VIP, which scripts/build_vip.py
   writes from lp.json site.vip plus the lead's name, event, clock and sample faces. Copy lives in lp.json only. */
(function () {
  var V = window.VIP || {};
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function md(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); }

  /* the event clock: the same START as site.js, so Day 4 lands the day after the registration page's Day 3 */
  var TZ = V.time_zone || 'America/New_York';
  function tzOffset(tz, t) {
    try {
      var p = {};
      new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(t)).forEach(function (x) { p[x.type] = x.value; });
      return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - t) / 6e4;
    } catch (e) { return -new Date(t).getTimezoneOffset(); }
  }
  var START = (function () {
    var now = Date.now(), wall = new Date(now + tzOffset(TZ, now) * 6e4);
    var guess = Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth(), wall.getUTCDate() + Math.max(1, +V.starts_in_days || 9),
      +V.start_hour || 12, 0, 0);
    return new Date(guess - tzOffset(TZ, guess) * 6e4);
  })();
  function day(n) { return new Date(START.getTime() + (n - 1) * 864e5); }
  function dfmt(d, wk) {
    var o = { day: 'numeric', month: 'short', timeZone: TZ }; if (wk) o.weekday = 'short';
    return d.toLocaleDateString('en-US', o).replace(',', '');
  }
  function tfmt(d) {
    try { return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ, timeZoneName: 'short' }); }
    catch (e) { return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); }
  }
  var TOK = {
    '{day1}': dfmt(day(1), true), '{day3}': dfmt(day(3), true), '{day4}': dfmt(day(4), true),
    '{day4_date}': dfmt(day(4)), '{day1_date}': dfmt(day(1)), '{close}': dfmt(day(11)),
    '{time}': tfmt(day(1)), '{first}': V.first_name || '', '{event}': V.event || '', '{price}': (V.currency || '$') + V.price
  };
  function fill(s) { return String(s || '').replace(/\{[a-z0-9_]+\}/g, function (k) { return k in TOK ? TOK[k] : k; }); }

  $('vEvent').textContent = V.event || '';
  // a long event name steps its size down (to 15px) before the ellipsis cuts it
  (function fitEvent() {
    var el = $('vEvent'), px = 19;
    if (!el) return;
    el.style.fontSize = '';
    while (el.scrollWidth > el.clientWidth + 1 && px > 15) { px -= 1; el.style.fontSize = px + 'px'; }
  })();
  window.addEventListener('resize', function () {
    var el = $('vEvent'), px = 19; if (!el) return; el.style.fontSize = '';
    while (el.scrollWidth > el.clientWidth + 1 && px > 15) { px -= 1; el.style.fontSize = px + 'px'; }
  });
  $('vHeld').innerHTML = md(fill(V.held || 'Your seat is held for **{day1} at {time}**. The join link is on its way to your inbox.'));
  $('vTape').textContent = fill(V.tape || 'Before you close this tab');

  /* headline: hand-set lines, the mark phrase gets the highlighter band */
  var mark = V.mark || '';
  $('vH1').innerHTML = (V.headline || []).map(function (l) {
    var h = esc(fill(l));
    if (mark && h.indexOf(esc(mark)) > -1) h = h.replace(esc(mark), '<span class="mk">' + esc(mark) + '</span>');
    return '<span class="ln">' + h + '</span>';
  }).join('');
  $('vLede').innerHTML = md(fill(V.lede));

  $('vStill').src = V.still || '../img/vip-video.jpg';
  if (V.still_focus) $('vStill').style.objectPosition = V.still_focus;
  $('vAva').src = V.avatar || '../img/headshot.jpg';
  $('vChipName').textContent = fill(V.video_title || 'A quick note from {first}');
  $('vChipSub').textContent = fill(V.video_sub || '{first} for {event} VIPs');
  $('vLen').textContent = '-' + (V.video_len || '1:32');

  /* their real logo in the pass stub when leads/<slug>/logo/ has one, else the monogram roundel in their faces */
  if (V.logo) {
    var r = document.querySelector('.vroundel'), im = document.createElement('img');
    im.className = 'vlogo'; im.src = V.logo; im.alt = ''; r.parentNode.replaceChild(im, r);
  }
  if (V.pattern) document.querySelector('.vslab').setAttribute('data-pat', V.pattern);
  var nm = (V.name || '').split(/\s+/);
  if ($('vMonoA')) $('vMonoA').textContent = (nm[0] || '').charAt(0);
  if ($('vMonoB')) $('vMonoB').textContent = (nm[nm.length - 1] || '').charAt(0);
  $('vPassKick').textContent = fill(V.pass_kick || '{event}');
  $('vCells').innerHTML = (V.pass_cells || ['4 days', 'Replays', 'VIP thread']).map(function (c) { return '<span>' + esc(fill(c)) + '</span>'; }).join('');

  $('vCur').textContent = V.currency || '$';
  $('vPrice').textContent = V.price;
  var ck = '<span class="vck"><svg width="13" height="13" viewBox="0 0 16 16"><path d="M3.2 8.4 6.4 11.4 12.8 4.6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
  $('vList').innerHTML = (V.items || []).map(function (it) {
    return '<li>' + ck + '<span><b>' + esc(fill(it.bold)) + '</b> ' + md(fill(it.text)) + '</span></li>';
  }).join('');
  $('vCta').textContent = fill(V.cta || 'Yes, add VIP for {price}');
  $('vNo').textContent = fill(V.decline || 'No thanks, take me to my join details');

  var faces = V.faces || [];
  $('vFaces').innerHTML = faces.slice(0, 4).map(function (f) { return '<img src="' + esc(f) + '" alt="">'; }).join('');
  $('vProof').innerHTML = md(fill(V.proof || '**{vip_count} people** added VIP to their seat')).replace('{vip_count}', esc(V.vip_count || '146'));

  /* progress track fills on load; the sample toast rotates through the registration page's names */
  requestAnimationFrame(function () { setTimeout(function () { document.querySelector('.vtrack').classList.add('go'); }, 120); });
  var names = V.names || ['Maya', 'Devon', 'Priya'], i = 0, ago = ['2 minutes ago', '6 minutes ago', '11 minutes ago', '18 minutes ago'];
  function toast() {
    var n = names[i % names.length];
    $('vToastAv').textContent = n.slice(0, 2).toUpperCase();
    $('vToastName').textContent = n;
    $('vToastAgo').textContent = ago[i % ago.length];
    $('vToast').classList.add('on');
    setTimeout(function () { $('vToast').classList.remove('on'); }, 5200);
    i++;
  }
  setTimeout(function () { toast(); setInterval(toast, 11000); }, 2600);
})();
