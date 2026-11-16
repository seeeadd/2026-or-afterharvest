/* Nonprofit Marketing Summit 2027 · You're in page, v4
   One config block below. No tracking, no outside requests, no form posts.
   Test any moment with ?now=2027-02-23T18:00:00Z, any state with ?state=pre|week|morning|live|between|after,
   sample details with ?first=Maya&last=Chen&org=Riverside%20Food%20Bank (testing only: the opt-in page passes details in
   sessionStorage, never in the URL), ?still stops the motion, ?videos shows the video slots before the videos exist. */
(function(){
'use strict';

/* ---------- CONFIG: the only block to edit when Community Boost confirms ----------
   Times are Pacific (PT); 9:00 am is the first session on the published schedule. Run make_ics.py after any change. */
var EVENT = {
  days: [
    {n:1, date:'2027-02-23', title:'Org Strategy & AI Tech Foundation'},
    {n:2, date:'2027-02-24', title:'The Growth & Marketing Blueprint'},
    {n:3, date:'2027-02-25', title:'The Build'}
  ],
  startPT: '09:00',
  endPT:   '14:30',
  utcOffset: -8,      // PST in February
  name: 'Nonprofit Marketing Summit 2027',
  optinUrl: 'https://2026-or-afterharvest.vercel.app/community-boost/nms-2027/',
  icsUrl: 'nms-2027.ics',
  contact: 'summit@communityboost.org',
  betaUrl: ''         // the early beta sign-up; the after-summit button shows only once this is set
};
/* -------------------------------------------------------------------------------- */

var q = new URLSearchParams(location.search);
var $ = function(s,r){ return (r||document).querySelector(s); };
var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
function each(s, fn){ $$(s).forEach(fn); }
function cut(s, n){ return Array.from(s || '').slice(0, n).join(''); }
function say(text){ var live = $('#live'); if (!live) return; live.textContent = ''; setTimeout(function(){ live.textContent = text; }, 60); }

/* ---- who: from the opt-in page (sessionStorage, same site) or the URL for testing; nothing is required ---- */
var ss = {};
try { ['first','last','org','email','ref'].forEach(function(k){ ss[k] = sessionStorage.getItem('nms27-'+k) || ''; }); } catch(e) {}
function pick(k){ return (q.get(k) || ss[k] || '').trim(); }
var who = {
  first: cut(pick('first').split(/\s+/)[0], 40),
  last: cut(pick('last'), 40),
  org: cut(pick('org'), 60),
  ref: pick('ref').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,40)
};
var known = !!who.first;
document.documentElement.classList.toggle('noname', !known);
each('[data-first]', function(el){ el.textContent = known ? ', ' + who.first : ''; });
each('[data-subject]', function(el){ el.textContent = known ? 'You’re in, ' + who.first : 'You’re in'; });
each('[data-known]', function(el){ el.hidden = !known; });
each('[data-unknown]', function(el){ el.hidden = known; });
each('[data-seat-me]', function(el){ if (known) el.textContent = who.first + (who.last ? ' ' + who.last : ''); });

/* ---- dates and times: PT always complete on its own; the visitor's own date and time on a separate line ---- */
function hm(s){ var p = s.split(':'); return [+p[0], +p[1]]; }
function at(date, t){ var d = date.split('-'), h = hm(t); return new Date(Date.UTC(+d[0], +d[1]-1, +d[2], h[0] - EVENT.utcOffset, h[1])); }
var D = EVENT.days, first = D[0], last = D[D.length-1];
var WDL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
var MOL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
D.forEach(function(d){
  var p = d.date.split('-'), u = new Date(Date.UTC(+p[0], +p[1]-1, +p[2], 12));
  d.long = WDL[u.getUTCDay()] + ', ' + MOL[u.getUTCMonth()] + ' ' + u.getUTCDate() + ', ' + p[0];
  d.dom = u.getUTCDate();
});
function ptTime(t){ var h = hm(t), ap = h[0] < 12 ? 'am' : 'pm', hh = h[0] % 12 || 12; return hh + ':' + (h[1] < 10 ? '0' : '') + h[1] + ' ' + ap; }
var startPT = ptTime(EVENT.startPT);
var start1 = at(first.date, EVENT.startPT), endLast = at(last.date, EVENT.endPT);
each('[data-fill="daylong"]', function(el){ el.textContent = first.long; });

var tz = '', city = '', local = null;
try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch(e) {}
if (tz && ['America/Los_Angeles','America/Vancouver','America/Tijuana','US/Pacific','PST8PDT'].indexOf(tz) < 0) {
  city = tz.split('/').pop().replace(/_/g, ' ');
  local = function(date, withYear){
    var t = at(date, EVENT.startPT);
    var o = {timeZone: tz, weekday: 'long', month: 'long', day: 'numeric'}; if (withYear) o.year = 'numeric';
    var d = new Intl.DateTimeFormat('en-US', o).format(t);
    var tm = new Intl.DateTimeFormat('en-US', {timeZone: tz, hour: 'numeric', minute: '2-digit'}).format(t).replace(' AM',' am').replace(' PM',' pm');
    return {date: d, time: tm, dom: +new Intl.DateTimeFormat('en-US', {timeZone: tz, day: 'numeric'}).format(t)};
  };
}
if (local) {
  var a = local(first.date), b = local(last.date, true);
  each('[data-local-line]', function(el){ el.textContent = 'Your time in ' + city + ': ' + a.date + ' to ' + b.date + ', starting ' + a.time + ' each day.'; el.hidden = false; });
  each('[data-dayline] > li', function(li, i){ var d = D[i], el = $('[data-day-local]', li); if (d && el) { var l = local(d.date); el.textContent = 'Your time in ' + city + ': ' + l.date + ', ' + l.time; el.hidden = false; } });
  each('[data-week-local]', function(el){ var l = local(first.date, true); el.textContent = ' In ' + city + ', that’s ' + l.date + ', ' + l.time + '.'; });
  window.__yiShift = a.dom - first.dom;   /* the hero's February floor holds their own dates */
}
each('[data-week-start]', function(el){ el.textContent = first.long + ', ' + startPT + ' PT'; });

/* ---- calendar links: one Google entry repeating daily, a hosted file for Outlook, Apple and the rest ---- */
function z(d){ return d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,''); }
var details = 'Free and live on Zoom, hosted by Community Boost. Your personal Zoom link is in your confirmation email, with "You’re in" in the subject. Search your inbox for "Nonprofit Marketing Summit". Questions: ' + EVENT.contact;
var gcal = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
  + '&text=' + encodeURIComponent(EVENT.name + ' (live on Zoom)')
  + '&dates=' + z(start1) + '/' + z(at(first.date, EVENT.endPT)) + '&ctz=America/Los_Angeles'
  + (D.length > 1 ? '&recur=' + encodeURIComponent('RRULE:FREQ=DAILY;COUNT=' + D.length) : '')
  + '&details=' + encodeURIComponent(details)
  + '&location=' + encodeURIComponent('Zoom (your personal link is in your email)');
each('[data-cal="google"]', function(a){ a.href = gcal; });
each('[data-cal="ics"]', function(a){ a.href = EVENT.icsUrl; });
/* opening a calendar is not saving it: only "It's in my calendar" marks the step done */
each('[data-cal]', function(a){ a.addEventListener('click', function(){
  each('[data-cal-done]', function(el){ el.textContent = 'Calendar opened.'; });
  say('Calendar opened.');
}); });

/* ---- the coworker link: tagged so the registration form can fill "Referred by"; a code from the opt-in wins ---- */
function slug(s){ return (s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,24); }
var refTag = who.ref || [slug(who.first), slug(who.org)].filter(Boolean).join('-');
if (refTag && !who.ref) refTag = 'invite-' + refTag;
var share = EVENT.optinUrl + '?utm_source=coworker-invite&utm_medium=referral&utm_campaign=nms2027' + (refTag ? '&ref=' + encodeURIComponent(refTag) : '');
each('[data-share-link]', function(el){ el.value = share; });
each('[data-optin]', function(a){ a.href = EVENT.optinUrl; });
each('[data-schedule]', function(a){ a.href = EVENT.optinUrl + '#schedule'; });

/* copy: say what was copied; when the browser refuses, show the text selected so they can copy it themselves */
function copy(text, btn, okText, onFail){
  var done = function(){
    var old = btn.dataset.label || btn.textContent; btn.dataset.label = old;
    btn.textContent = okText; say(okText);
    setTimeout(function(){ btn.textContent = old; }, 2400);
  };
  var fallback = function(){
    var t = document.createElement('textarea'), ok = false;
    t.value = text; t.setAttribute('readonly',''); t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    try { ok = document.execCommand('copy'); } catch(e) {}
    t.remove();
    if (ok) done(); else { onFail(); say('Couldn’t copy automatically. Select and copy the text below.'); }
  };
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
}
function selectIn(el){ try { var r = document.createRange(); r.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(r); } catch(e) {} }
each('[data-copy="share"]', function(b){ b.addEventListener('click', function(){
  copy(share, b, 'Invite link copied.', function(){
    each('[data-copy-fail="share"]', function(p){ p.hidden = false; });
    var inp = $('[data-share-link]'); if (inp) { inp.classList.remove('sr'); inp.classList.add('share-show'); inp.focus(); inp.select(); }
  });
}); });
var invite = 'Hi,\n\nI’m registered for Community Boost’s free Nonprofit Marketing Summit, February 23–25, 2027 PT. The three days cover nonprofit strategy, marketing planning and hands-on campaign work.\n\nWant to join me? We can choose a few sessions together and compare notes afterward.\n\nRegister for the summit: ' + share;
each('[data-mail="team"]', function(a){ a.href = 'mailto:?subject=' + encodeURIComponent('Join me at the Nonprofit Marketing Summit?') + '&body=' + encodeURIComponent(invite); });
var noteEl = $('[data-note]');
if (noteEl) {
  var note = noteEl.textContent.replace(/[ \t]+\n/g,'\n').replace(/\n[ \t]+/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
  var subj = ($('[data-note-subject]') || {}).textContent || 'Request to attend the Nonprofit Marketing Summit 2027';
  each('[data-copy="note"]', function(b){ b.addEventListener('click', function(){
    copy(note, b, 'Manager note copied.', function(){ each('[data-copy-fail="note"]', function(p){ p.hidden = false; }); selectIn(noteEl); });
  }); });
  each('[data-mail="manager"]', function(a){ a.href = 'mailto:?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(note); });
}
/* "Need a yes from your manager? Use our note." opens the note where it sits */
each('[data-open-note]', function(a){ a.addEventListener('click', function(){ var d = $('[data-note-fold]'); if (d) d.open = true; }); });

/* ---- states: before, the week before, a summit morning, live, between days, after ---- */
var now = q.get('now') ? new Date(q.get('now')) : new Date();
if (isNaN(now)) now = new Date();
function dayIndexAt(d){ for (var i = 0; i < D.length; i++) if (d >= at(D[i].date, '00:00') && d <= at(D[i].date, '23:59')) return i; return -1; }
var state = 'pre', di = dayIndexAt(now);
var weekStart = new Date(at(first.date, '00:00').getTime() - 7*864e5);
if (now > endLast) state = 'after';
else if (di >= 0) {
  var s0 = at(D[di].date, EVENT.startPT), e0 = at(D[di].date, EVENT.endPT);
  state = now < s0 ? 'morning' : (now <= e0 ? 'live' : 'between');
} else if (now >= weekStart) state = 'week';
if (/^(pre|week|morning|live|between|after)$/.test(q.get('state') || '')) { state = q.get('state'); if (di < 0) di = 0; }
if (state === 'between' && !D[Math.max(di,0)+1]) state = 'after';
document.documentElement.dataset.state = state;
var cur = D[Math.max(di,0)], nxt = D[Math.max(di,0)+1];
var fill = { day: 'Day ' + cur.n, daylong: cur.long };
each('[data-fill]', function(el){ var k = el.dataset.fill; if (fill[k] != null) el.textContent = fill[k]; });
each('[data-show]', function(el){ el.hidden = el.dataset.show.split(' ').indexOf(state) < 0; });
each('[data-hide]', function(el){ if (el.dataset.hide.split(' ').indexOf(state) >= 0) el.hidden = true; });
/* the session start as a complete date and time in PT; the visitor's own on its own line */
var when = state === 'between' ? nxt : cur;
if (when) {
  each('[data-state-when]', function(el){ el.textContent = 'Day ' + when.n + ' starts ' + when.long + ', ' + startPT + ' PT.'; });
  each('[data-hd-state]', function(el){ el.textContent = state === 'between' ? 'Day ' + when.n + ' starts ' + when.long.replace(/, \d{4}$/, '') + ', ' + startPT + ' PT.' : 'Day ' + when.n + ' starts at ' + startPT + ' PT.'; });
  if (local) each('[data-state-local]', function(el){ if (state !== 'morning' && state !== 'between') return; var l = local(when.date, true); el.textContent = 'Your time in ' + city + ': ' + l.date + ', ' + l.time + '.'; el.hidden = false; });
}
if (EVENT.betaUrl) { each('[data-beta-link]', function(a){ a.href = EVENT.betaUrl; }); each('[data-beta]', function(p){ p.hidden = false; }); }

/* ---- one orchestrated entrance: first visit only, never under reduced motion ---- */
var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
var seen = false; try { seen = sessionStorage.getItem('nms27-yi-seen') === '1'; sessionStorage.setItem('nms27-yi-seen','1'); } catch(e) {}
if (!reduce && !seen && !q.has('still') && (state === 'pre' || state === 'week')) document.documentElement.classList.add('enter');

/* ---- readiness: the calendar and the Zoom email, each marked by its own button; kept on this device only.
   The coworker invite and the videos never count toward "You're ready". ---- */
var STEPS = ['1','2'], doneSet = {};
try { (localStorage.getItem('nms27-yi4-done') || '').split(',').forEach(function(k){ if (STEPS.indexOf(k) >= 0) doneSet[k] = 1; }); } catch(e) {}
var NEXT = {'1': 'Next: add the summit to your calendar', '2': 'Next: find your Zoom link'};
function paint(){
  STEPS.forEach(function(k){
    var on = !!doneSet[k];
    each('[data-step-dot="' + k + '"]', function(li){ li.classList.toggle('done', on); });
    each('[data-done="' + k + '"]', function(b){ b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
  });
  var nextK = STEPS.filter(function(k){ return !doneSet[k]; })[0];
  each('[data-dock-next]', function(el){ el.textContent = nextK ? NEXT[nextK] : 'You’re ready. See you at the summit.'; });
  document.documentElement.classList.toggle('yi-ready', !nextK);
  try { localStorage.setItem('nms27-yi4-done', Object.keys(doneSet).join(',')); } catch(e) {}
}
each('[data-done]', function(b){ b.addEventListener('click', function(){
  var k = b.dataset.done, on = !doneSet[k];
  if (on) doneSet[k] = 1; else delete doneSet[k];
  paint();
  var msg = on ? (k === '1' ? 'Marked as saved in your calendar.' : 'Zoom link found.') : '';
  each(k === '1' ? '[data-cal-done]' : '[data-mail-done]', function(el){ el.textContent = msg; });
  if (on) { var all = STEPS.every(function(s){ return doneSet[s]; }); say(msg + (all ? ' You’re ready. See you at the summit.' : '')); }
}); });
paint();

})();
