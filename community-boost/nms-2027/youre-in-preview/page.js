/* Nonprofit Marketing Summit 2027 · You're in page
   One config block below. No tracking, no outside requests, no form posts.
   The page reads right with no script too: the HTML carries working defaults and the three-day working dates.
   Test any moment with ?now=2027-02-23T18:00:00Z, any state with ?state=pre|week|morning|live|between|after,
   sample details with ?first=Maya&last=Chen&org=Riverside%20Food%20Bank&email=maya@example.org (testing only:
   the opt-in page passes details in sessionStorage, never in the URL), ?clean hides the markers, ?still stops the entrance. */
(function(){
'use strict';

/* ---------- CONFIG: the only block to edit when CB confirms ----------
   Dates: [TO ADD: confirmed dates, CB]. For a two-day summit delete the third entry, then run make_ics.py.
   Times are Pacific (PT). */
var EVENT = {
  days: [
    {n:1, date:'2027-02-23', title:'Org Strategy & AI Tech Foundation'},
    {n:2, date:'2027-02-24', title:'The Growth & Marketing Blueprint'},
    {n:3, date:'2027-02-25', title:'The Build'}
  ],
  startPT: '09:00',   // [TO ADD: confirmed start, CB]
  endPT:   '14:30',   // [TO ADD: confirmed end, CB]
  utcOffset: -8,      // PST in February
  name: 'Nonprofit Marketing Summit 2027',
  optinUrl: 'https://2026-or-afterharvest.vercel.app/community-boost/nms-2027/', // [TO ADD: final domain, CB]
  icsUrl: 'nms-2027.ics',
  contact: 'summit@communityboost.org'
};
/* -------------------------------------------------------------------- */

var q = new URLSearchParams(location.search);
var $ = function(s,r){ return (r||document).querySelector(s); };
var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
function each(s, fn){ $$(s).forEach(fn); }
function cut(s, n){ return Array.from(s || '').slice(0, n).join(''); }
if (q.has('clean')) document.documentElement.classList.add('clean');

/* ---- who: from the opt-in page (sessionStorage, same site) or the URL for testing; nothing is required ---- */
var ss = {};
try { ['first','last','org','email','ref'].forEach(function(k){ ss[k] = sessionStorage.getItem('nms27-'+k) || ''; }); } catch(e) {}
function pick(k){ return (q.get(k) || ss[k] || '').trim(); }
var who = {
  first: cut(pick('first').split(/\s+/)[0], 40),
  last: cut(pick('last'), 40),
  org: cut(pick('org'), 60),
  email: cut(pick('email'), 120),
  ref: pick('ref').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,40)
};
var known = !!who.first;
document.documentElement.classList.toggle('noname', !known);
each('[data-first]', function(el){ el.textContent = known ? ', ' + who.first : ''; });
each('[data-fullname]', function(el){ if (known) el.textContent = (who.first + ' ' + who.last).trim(); });
each('[data-org]', function(el){ if (who.org) { el.textContent = who.org; el.hidden = false; } });
each('[data-subject]', function(el){ el.textContent = known ? 'You’re in, ' + who.first : 'You’re in'; });
each('[data-known]', function(el){ el.hidden = !known; });
each('[data-unknown]', function(el){ el.hidden = known; });
if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(who.email)) {
  var em = who.email.split('@');
  each('[data-email]', function(el){ el.textContent = Array.from(em[0])[0] + '•••@' + em[1]; });
  each('[data-email-known]', function(el){ el.hidden = false; });
}

/* ---- dates and times: everything below is built from EVENT, so two days or three is one edit ---- */
function hm(s){ var p = s.split(':'); return [+p[0], +p[1]]; }
function at(date, t){ var d = date.split('-'), h = hm(t); return new Date(Date.UTC(+d[0], +d[1]-1, +d[2], h[0] - EVENT.utcOffset, h[1])); }
var D = EVENT.days, first = D[0], last = D[D.length-1];
var WD = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], MO = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function parts(date){ var d = date.split('-'); var u = new Date(Date.UTC(+d[0], +d[1]-1, +d[2], 12)); return {wd: WD[u.getUTCDay()], mo: MO[u.getUTCMonth()], day: u.getUTCDate(), dow: u.getUTCDay()}; }
D.forEach(function(d){ var p = parts(d.date); d.label = p.wd + ', ' + p.mo + ' ' + p.day; d.p = p; });
function ptTime(t){ var h = hm(t), ap = h[0] < 12 ? 'am' : 'pm', hh = h[0] % 12 || 12; return hh + ':' + (h[1] < 10 ? '0' : '') + h[1] + ' ' + ap; }
var multi = D.length > 1, fp = first.p, lp = last.p;
var rangeLong = multi ? first.label + ' to ' + last.label + ', 2027' : first.label + ', 2027';
var rangeShort = multi ? fp.mo + ' ' + fp.day + '-' + lp.day : fp.mo + ' ' + fp.day;
var rangePass = multi ? fp.wd + ' to ' + lp.wd + ', ' + fp.mo + ' ' + fp.day + ' to ' + lp.day + ' · PT' : first.label + ' · PT';
each('[data-range]', function(el){ el.textContent = (multi ? 'Every summit day, ' : '') + rangeLong; });
each('[data-range-short]', function(el){ el.textContent = rangeShort; });
each('[data-range-pass]', function(el){ el.textContent = rangePass; });
each('[data-range-note]', function(el){ el.textContent = rangeLong; });
each('[data-start]', function(el){ el.textContent = ptTime(EVENT.startPT); });
each('[data-end]', function(el){ el.textContent = ptTime(EVENT.endPT); });

/* the day line in "Here's what you'll leave with" */
var line = $('[data-dayline]');
if (line) {
  var items = $$('li', line);
  items.forEach(function(li, i){
    var d = D[i];
    if (!d) { li.remove(); return; }
    var s = $('.ld span', li); if (s) s.textContent = d.label + ' · ' + ptTime(EVENT.startPT) + ' PT';
    var h = $('h3', li); if (h && d.title) h.textContent = d.title;
  });
  line.style.setProperty('--n', Math.min(D.length, items.length));
}

/* the hero calendar (February 2027) and the phone week strip */
var grid = $('[data-calgrid]');
if (grid) {
  var html = WD.map(function(w){ return '<span class="dow">' + w + '</span>'; }).join('');
  var firstDow = parts('2027-02-01').dow, sumDays = D.map(function(d){ return d.p.day; });
  var weekOf = Math.floor((firstDow + fp.day - 1) / 7);
  for (var w = 0; w < 5; w++) {
    var row = '';
    for (var k = 0; k < 7; k++) {
      var n = w*7 + k - firstDow + 1, inMonth = n >= 1 && n <= 28;
      var label = inMonth ? n : (n < 1 ? 31 + n : n - 28);
      var idx = inMonth ? sumDays.indexOf(n) : -1, faded = w < weekOf - 1;
      row += '<span class="d' + (inMonth ? '' : ' o') + (faded ? ' f' : '') + (idx >= 0 ? ' s s' + (idx+1) : '') + '">' + (idx >= 0 ? '<i>' + label + '</i>' : label) + '</span>';
    }
    if (w === weekOf) {
      var col = (firstDow + fp.day - 1) % 7;
      row = '<div class="wk">' + row + '<span class="ev" style="--c:' + col + ';--w:' + D.length + '"><span class="ev-l">Nonprofit Marketing </span>Summit<small>' + ptTime(EVENT.startPT) + ' PT · Live on Zoom</small></span></div>';
    }
    html += row;
  }
  grid.innerHTML = html;
}
var strip = $('[data-daystrip]');
if (strip) strip.innerHTML = D.map(function(d){ return '<li><b>' + d.p.wd + '</b><i>' + d.p.day + '</i></li>'; }).join('') + '<li class="strip-t">' + fp.mo + ' · ' + ptTime(EVENT.startPT) + ' PT</li>';

/* the visitor's own city beside PT (device setting; nothing asked, nothing sent) */
var start1 = at(first.date, EVENT.startPT), end1 = at(first.date, EVENT.endPT), endLast = at(last.date, EVENT.endPT);
try {
  var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  if (tz && ['America/Los_Angeles','America/Vancouver','America/Tijuana','US/Pacific'].indexOf(tz) < 0) {
    var fmt = function(d){ return new Intl.DateTimeFormat('en-US',{timeZone:tz,hour:'numeric',minute:'2-digit'}).format(d).replace(':00','').replace(' AM',' am').replace(' PM',' pm').replace(/^12 pm$/,'noon'); };
    var dayIn = function(d, zone){ return new Intl.DateTimeFormat('en-US',{timeZone:zone,day:'numeric'}).format(d); };
    var city = tz.split('/').pop().replace(/_/g,' ');
    var later = dayIn(start1, tz) !== dayIn(start1, 'America/Los_Angeles') ? ' the next day' : '';
    each('[data-local]', function(el){ el.textContent = ' That’s ' + fmt(start1) + ' to ' + fmt(end1) + later + ' in ' + city + '.'; el.hidden = false; });
    each('[data-local-start]', function(el){ el.textContent = 'That’s ' + fmt(start1) + later + ' in ' + city + '.'; el.hidden = false; });
  }
} catch(e) {}

/* ---- calendar links: one Google entry repeating daily (Sean 2026-10-24), a hosted file for Outlook and Apple ---- */
function z(d){ return d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,''); }
var details = 'Free and live on Zoom, hosted by Community Boost. Your personal Zoom link is in the email from Cameron Ripley called "You’re in". Search your inbox for "Nonprofit Marketing Summit". Questions: ' + EVENT.contact;
var gcal = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
  + '&text=' + encodeURIComponent(EVENT.name + ' (live on Zoom)')
  + '&dates=' + z(start1) + '/' + z(end1) + '&ctz=America/Los_Angeles'
  + (multi ? '&recur=' + encodeURIComponent('RRULE:FREQ=DAILY;COUNT=' + D.length) : '')
  + '&details=' + encodeURIComponent(details)
  + '&location=' + encodeURIComponent('Zoom (your personal link is in your email)');
each('[data-cal="google"]', function(a){ a.href = gcal; });
each('[data-cal="ics"]', function(a){ a.href = EVENT.icsUrl; });
function say(text){ var live = $('#live'); if (!live) return; live.textContent = ''; setTimeout(function(){ live.textContent = text; }, 60); }
each('[data-cal]', function(a){ a.addEventListener('click', function(){
  var msg = 'Your calendar is opening. Check every summit day is there, then save.';
  each('[data-cal-done]', function(el){ el.textContent = msg; });
  say(msg);
}); });

/* ---- coworker link: tagged so HubSpot can fill "Referred by" (Al, 10.29). Al's opaque code wins when the opt-in passes it ---- */
function slug(s){ return (s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,24); }
var refTag = who.ref || [slug(who.first), slug(who.org)].filter(Boolean).join('-');
if (refTag && !who.ref) refTag = 'invite-' + refTag;
var share = EVENT.optinUrl + '?utm_source=coworker-invite&utm_medium=referral&utm_campaign=nms2027' + (refTag ? '&ref=' + encodeURIComponent(refTag) : '');
each('[data-share-link]', function(el){ el.value = share; });
each('[data-optin]', function(a){ a.href = EVENT.optinUrl; });
each('[data-schedule]', function(a){ a.href = EVENT.optinUrl + '#schedule'; });
function copy(text, btn, okText){
  var done = function(){
    var old = btn.dataset.label || btn.textContent; btn.dataset.label = old;
    btn.textContent = okText; say(okText);
    setTimeout(function(){ btn.textContent = old; }, 2400);
  };
  var fallback = function(){ var t = document.createElement('textarea'); t.value = text; t.setAttribute('readonly',''); t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch(e) {} t.remove(); done(); };
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
}
each('[data-copy="share"]', function(b){ b.addEventListener('click', function(){ copy(share, b, 'Link copied'); }); });
var invite = 'Hi,\n\nI just saved my free seat for the Nonprofit Marketing Summit 2027, a free, live online summit from Community Boost on ' + rangeLong + ' (PT). Want to plan our 2027 marketing together? Sign up here with your own name and email, so you get your own Zoom link:\n\n' + share + (known ? '\n\n' + who.first : '');
each('[data-mail="team"]', function(a){ a.href = 'mailto:?subject=' + encodeURIComponent('Join me at the Nonprofit Marketing Summit (free, ' + rangeLong + ', PT)') + '&body=' + encodeURIComponent(invite); });
var noteEl = $('[data-note]');
if (noteEl) {
  var note = noteEl.textContent.replace(/[ \t]+\n/g,'\n').replace(/\n[ \t]+/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
  each('[data-copy="note"]', function(b){ b.addEventListener('click', function(){ copy(note, b, 'Note copied'); }); });
  each('[data-mail="manager"]', function(a){ a.href = 'mailto:?subject=' + encodeURIComponent('Can I join a free summit on ' + rangeLong + ' (PT)?') + '&body=' + encodeURIComponent(note); });
}
var box = $('[data-note-box]');
if (box && window.matchMedia && matchMedia('(min-width: 961px)').matches) box.open = true;

/* ---- states: before, the week before, a live morning, live, between days, after ---- */
var now = q.get('now') ? new Date(q.get('now')) : new Date();
if (isNaN(now)) now = new Date();
function dayIndexAt(d){
  for (var i = 0; i < D.length; i++) {
    if (d >= at(D[i].date, '00:00') && d <= at(D[i].date, '23:59')) return i;
  }
  return -1;
}
var state = 'pre', di = dayIndexAt(now);
var weekStart = new Date(at(first.date, '00:00').getTime() - 7*864e5);
if (now > endLast) state = 'after';
else if (di >= 0) {
  var s0 = at(D[di].date, EVENT.startPT), e0 = at(D[di].date, EVENT.endPT);
  state = now < s0 ? 'morning' : (now <= e0 ? 'live' : 'between');
} else if (now >= weekStart) state = 'week';
if (/^(pre|week|morning|live|between|after)$/.test(q.get('state') || '')) { state = q.get('state'); if (di < 0) di = 0; }
document.documentElement.dataset.state = state;
var cur = D[Math.max(di,0)], nxt = D[Math.max(di,0)+1];
var fill = { day: 'Day ' + cur.n, daylabel: cur.label, next: nxt ? 'Day ' + nxt.n : '' };
each('[data-fill]', function(el){ var k = el.dataset.fill; if (fill[k] != null) el.textContent = fill[k]; });
each('[data-show]', function(el){ el.hidden = el.dataset.show.split(' ').indexOf(state) < 0; });
each('[data-needs-next]', function(el){ if (!nxt) el.hidden = true; });
each('[data-hide]', function(el){ if (el.dataset.hide.split(' ').indexOf(state) >= 0) el.hidden = true; });

/* ---- one orchestrated entrance: first visit only, never under reduced motion ---- */
var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
var seen = false; try { seen = sessionStorage.getItem('nms27-yi-seen') === '1'; sessionStorage.setItem('nms27-yi-seen','1'); } catch(e) {}
if (!reduce && !seen && !q.has('still') && (state === 'pre' || state === 'week')) document.documentElement.classList.add('enter');
})();
