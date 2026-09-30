/* Thank-you page (templates/lp/typ.js). Fills typ.html from window.TYP (scripts/build_typ.py). The form sends nothing
   unless TYP.endpoint is set (a webhook / sheet URL); answers are also kept in this browser. */
(function () {
  var V = window.TYP || {};
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function md(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  var TZ = V.time_zone || 'America/New_York', WEB = V.format === 'webinar', N = WEB ? 1 : 3, MIN = V.minutes || 90;
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
    var guess = Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth(), wall.getUTCDate() + Math.max(1, +V.starts_in_days || 9), +V.start_hour || 12, 0, 0);
    var sm = /^(\d{4})-(\d\d)-(\d\d)$/.exec(V.start_date || '');
    if (sm) { var sg = Date.UTC(+sm[1], +sm[2] - 1, +sm[3], +V.start_hour || 12, 0, 0), st = new Date(sg - tzOffset(TZ, sg) * 6e4); if (st.getTime() > now) return st; }
    return new Date(guess - tzOffset(TZ, guess) * 6e4);
  })();
  function day(n) { return new Date(START.getTime() + (n - 1) * 864e5); }
  function dfmt(d, wk) { var o = { day: 'numeric', month: 'short', timeZone: TZ }; if (wk) o.weekday = 'short'; return d.toLocaleDateString('en-US', o).replace(',', ''); }
  function tfmt(d) { try { return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ, timeZoneName: 'short' }); } catch (e) { return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); } }
  var TOK = { '{day4}': dfmt(day(N + 1), true), '{day4_date}': dfmt(day(N + 1)), '{day1_date}': dfmt(day(1)), '{close}': dfmt(day(N + 8)), '{day1}': dfmt(day(1), true), '{lastday}': dfmt(day(N), true), '{time}': tfmt(day(1)), '{first}': V.first_name || '', '{event}': V.event || '', '{n}': String(N) };
  function fill(s) { return String(s || '').replace(/\{[a-z0-9_]+\}/g, function (k) { return k in TOK ? TOK[k] : k; }); }
  var KEY = 'typ:' + (V.slug || 'x');

  $('vEvent').textContent = V.event || '';
  $('tKick').textContent = fill(V.kick || 'You are in');
  var h1 = esc(fill(V.headline || 'You are in for {event}.'));
  if (V.mark && h1.indexOf(esc(V.mark)) > -1) h1 = h1.replace(esc(V.mark), '<span class="mk">' + esc(V.mark) + '</span>');
  $('tH1').innerHTML = h1;
  $('tSub').innerHTML = md(fill(V.sub || 'Your seat is held for **{day1} at {time}**. Two short videos and three quick steps below get you ready.'));

  /* VIP variant: what the upgrade includes, as small cards under the welcome (V.perks [{t,x}]) */
  if (V.perks && V.perks.length) { var pk = $('tPerks'); pk.hidden = false; pk.innerHTML = V.perks.map(function (k, i) { return '<div class="tperk"><span>0' + (i + 1) + '</span><b>' + esc(fill(k.t)) + '</b><p>' + esc(fill(k.x)) + '</p></div>'; }).join(''); }

  /* the two videos: HOW (logistics) then WHY (show up live). No file yet = a poster with a play button that says so. */
  var chev = '<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.2v13.6a.8.8 0 0 0 1.2.7l10.6-6.8a.8.8 0 0 0 0-1.4L9.2 4.5A.8.8 0 0 0 8 5.2z" fill="currentColor"/></svg>';
  function vid(v, img, k) {
    return '<article class="tvid" id="tv' + k + '"><div class="tshot"><img src="' + esc(img) + '" alt="">' +
      '<button type="button" class="tplay" aria-label="Play: ' + esc(v.title) + '">' + chev + '</button><span class="tlen">' + esc(v.len) + '</span>' +
      '<span class="tsoon" role="status">This video plays here as soon as it is added.</span></div>' +
      '<div class="tcap"><small>' + esc(v.tag) + '</small><h3>' + esc(fill(v.title)) + '</h3><p>' + md(fill(v.sub)) + '</p></div></article>';
  }
  var how = V.how || {}, why = V.why || {};
  $('tVids').innerHTML =
    vid({ tag: 'Video 1 of 2', title: how.title || 'How to join, in 60 seconds', len: how.len || '1:00', sub: how.sub || 'What time it starts, your time zone, where the link is and where to find the replay.' }, V.still_how, 1) +
    vid({ tag: 'Video 2 of 2', title: why.title || 'Why to show up live', len: why.len || '2:30', sub: why.sub || 'What happens live that a replay cannot give you, and what to bring on {day1}.' }, V.still_why, 2);
  Array.prototype.forEach.call(document.querySelectorAll('.tplay'), function (b) {
    b.addEventListener('click', function () {
      var c = b.closest('.tvid'), src = c.getAttribute('data-src');
      c.classList.add('on'); setTimeout(function () { c.classList.remove('on'); }, 4200);
    });
  });

  /* prep steps */
  $('tPrepH').textContent = fill(V.prep_title || 'Three small steps before ' + (WEB ? 'the session' : 'Day 1'));
  $('tCalTxt').textContent = fill(V.cal_text || 'One click adds ' + (WEB ? 'the session' : 'all {n} days') + ' at {time}. Your join link is in your confirmation email.');
  $('tConfirmTxt').textContent = fill(V.confirm_text || 'One click tells us you are coming. It takes a second.');
  $('tLockTxt').textContent = fill(V.confirm_label || (WEB ? "I'm locked in for the live session" : "I'm locked in for all {n} days"));
  $('tGoalTxt').textContent = fill(V.goal_text || 'This helps us personalise your experience. Skip it if you like, nothing else changes.');
  $('tGoal').placeholder = V.goal_placeholder || 'Example: what do you want to have in hand by the last session?';

  function stamp(d, end) { return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
  var title = V.event || 'Live event', desc = 'Your join link is in your confirmation email.';
  function ics() {
    var L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//typ//EN', 'CALSCALE:GREGORIAN'];
    for (var i = 1; i <= N; i++) {
      var a = day(i), b = new Date(a.getTime() + MIN * 6e4);
      L.push('BEGIN:VEVENT', 'UID:' + (V.slug || 'event') + '-' + i + '@typ', 'DTSTAMP:' + stamp(new Date()), 'DTSTART:' + stamp(a), 'DTEND:' + stamp(b),
        'SUMMARY:' + title + (WEB ? '' : ' (Day ' + i + ')'), 'DESCRIPTION:' + desc,
        'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Starting in 15 minutes', 'TRIGGER:-PT15M', 'END:VALARM', 'END:VEVENT');
    }
    L.push('END:VCALENDAR'); return L.join('\r\n');
  }
  var a1 = day(1), b1 = new Date(a1.getTime() + MIN * 6e4);
  var google = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(title) + '&dates=' + stamp(a1) + '/' + stamp(b1) +
    '&details=' + encodeURIComponent(desc) + (WEB ? '' : '&recur=' + encodeURIComponent('RRULE:FREQ=DAILY;COUNT=' + N));
  var outlook = 'https://outlook.live.com/calendar/0/deeplink/compose?path=%2Fcalendar%2Faction%2Fcompose&rru=addevent&subject=' + encodeURIComponent(title) +
    '&startdt=' + encodeURIComponent(a1.toISOString()) + '&enddt=' + encodeURIComponent(b1.toISOString()) + '&body=' + encodeURIComponent(desc);
  var calIco = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/></svg>';
  $('tCals').innerHTML =
    '<a class="tcal" data-c="cal" target="_blank" rel="noopener" href="' + esc(google) + '">' + calIco + 'Google Calendar</a>' +
    '<a class="tcal" data-c="cal" href="#" id="tIcs">' + calIco + 'Apple, Outlook app or other</a>' +
    '<a class="tcal" data-c="cal" target="_blank" rel="noopener" href="' + esc(outlook) + '">' + calIco + 'Outlook.com' + (WEB ? '' : ' (Day 1)') + '</a>';
  $('tIcs').addEventListener('click', function (e) {
    e.preventDefault();
    var blob = new Blob([ics()], { type: 'text/calendar;charset=utf-8' }), url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = (V.slug || 'event') + '.ics'; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 500);
  });

  /* time zone list, the visitor's own preselected */
  var zones = [], mine = TZ;
  try { mine = Intl.DateTimeFormat().resolvedOptions().timeZone || TZ; } catch (e) {}
  try { zones = Intl.supportedValuesOf('timeZone'); } catch (e) {}
  if (!zones.length) zones = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Manila', 'Asia/Tokyo', 'Australia/Sydney'];
  if (zones.indexOf(mine) < 0) zones.unshift(mine);
  $('tZone').innerHTML = zones.map(function (z) { return '<option value="' + esc(z) + '"' + (z === mine ? ' selected' : '') + '>' + esc(z.replace(/_/g, ' ')) + '</option>'; }).join('');

  /* progress: calendar, confirm, answers */
  var st = { cal: false, confirm: false, goal: false };
  try { st = JSON.parse(store(KEY) || 'null') || st; } catch (e) {}
  function paint() {
    var n = (st.cal ? 1 : 0) + (st.confirm ? 1 : 0) + (st.goal ? 1 : 0);
    $('sCal').classList.toggle('done', !!st.cal); $('sConfirm').classList.toggle('done', !!st.confirm); $('sGoal').classList.toggle('done', !!st.goal);
    $('tLock').setAttribute('aria-pressed', st.confirm ? 'true' : 'false');
    var m = $('tMeter'); m.setAttribute('aria-valuenow', n); m.firstElementChild.style.width = (n / 3 * 100) + '%';
    $('tMeterTxt').textContent = n === 3 ? 'All done. See you ' + TOK['{day1}'] + '.' : n + ' of 3 done';
    store(KEY, JSON.stringify(st));
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-c="cal"]'), function (a) { a.addEventListener('click', function () { st.cal = true; paint(); }); });
  $('tLock').addEventListener('click', function () { st.confirm = !st.confirm; paint(); });
  $('tForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var body = { slug: V.slug, event: V.event, goal: $('tGoal').value.trim(), time_zone: $('tZone').value, confirmed: !!st.confirm, at: new Date().toISOString() };
    st.goal = true; paint();
    if (V.endpoint) { try { fetch(V.endpoint, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(body) }); } catch (err) {} }
    var n = $('tSaved'); n.hidden = false; n.textContent = body.goal ? 'Saved. Thank you, we will keep it in mind for ' + TOK['{day1}'] + '.' : 'Saved. Thank you.';
  });
  paint();

  /* proof: one real quote and up to three of the lead's own numbers */
  var pr = '';
  if (V.proof_quote) {
    var q = esc(fill(V.proof_quote.q));
    if (V.proof_quote.hl && q.indexOf(esc(V.proof_quote.hl)) > -1) q = q.replace(esc(V.proof_quote.hl), '<mark>' + esc(V.proof_quote.hl) + '</mark>');
    pr += '<blockquote class="tquote"><p>' + q + '</p><footer><b>' + esc(V.proof_quote.name) + '</b>, ' + esc(V.proof_quote.role) + '</footer></blockquote>';
  }
  if (V.stats && V.stats.length) pr += '<div class="tstats">' + V.stats.slice(0, 3).map(function (s) { return '<div class="tstat"><b>' + esc(s.num) + '</b><span>' + esc(s.label) + '</span></div>'; }).join('') + '</div>';
  if (pr) $('tProof').innerHTML = '<span class="vspark" aria-hidden="true"></span><p class="vcap">' + esc(V.proof_cap || 'Who you are learning from') + '</p><h2 class="vh2">' + esc(fill(V.proof_title || 'Why people show up for {first}')) + '</h2>' + pr;
  $('tNext').innerHTML = md(fill(V.next || 'Your join link is in your confirmation email. **{first}** goes live on **{day1} at {time}**. See you there.'));
  $('tFoot').textContent = V.foot || '';
})();
