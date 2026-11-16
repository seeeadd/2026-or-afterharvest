/* You're in page v3: the parts page.js (v2's logic, unchanged) does not cover.
   The countdown in the header, the "Will you be there live?" answers, and the video placeholders. Nothing is sent anywhere. */
(function(){
'use strict';
var q = new URLSearchParams(location.search);
function $(s){ return document.querySelector(s); }
function $$(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); }
function say(t){ var l = $('#live'); if (l) { l.textContent = ''; setTimeout(function(){ l.textContent = t; }, 30); } }

/* countdown to Day 1, 9:00 am PT (17:00 UTC in February) [TO ADD: confirmed start, CB] */
var START = Date.parse('2027-02-23T17:00:00Z');
var nowFix = q.get('now') ? Date.parse(q.get('now')) : null;
function pad(n){ return (n < 10 ? '0' : '') + n; }
function tick(){
  var now = nowFix || Date.now(), s = Math.max(0, Math.floor((START - now) / 1000));
  var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
  $$('[data-cd="d"]').forEach(function(e){ e.textContent = d; });
  $$('[data-cd="h"]').forEach(function(e){ e.textContent = pad(h); });
  $$('[data-cd="m"]').forEach(function(e){ e.textContent = pad(m); });
}
tick(); if (!nowFix) setInterval(tick, 30000);

/* "Will you be there live?": one answer, its own reply. The default we hope for is all three days. */
var KEY = 'nms27-yi-commit';
function firstLine(){
  var wd = null, dn = null, main = $('[data-hd-main]');
  var tm = main ? (main.textContent.split(' · ')[1] || '') : '';
  return 'See you Tue, Feb 23' + (tm ? ', ' + tm : '') + '.';
}
function pick(a, quiet){
  $$('[data-ans]').forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.ans === a ? 'true' : 'false'); });
  $$('[data-reply]').forEach(function(r){ r.hidden = r.dataset.reply !== a; });
  $$('[data-rsvp-hint]').forEach(function(h){ h.hidden = true; });
  $$('[data-r-first]').forEach(function(e){ e.parentNode.textContent = firstLine(); });
  try { localStorage.setItem(KEY, a); } catch(e) {}
  if (!quiet) say(a === 'all' ? 'Saved: all three days.' : a === 'some' ? 'Saved: some of it, around work.' : 'Saved: not sure yet.');
}
$$('[data-ans]').forEach(function(b){ b.addEventListener('click', function(){ pick(b.dataset.ans); }); });
try { var was = localStorage.getItem(KEY); if (was) pick(was, true); } catch(e) {}

/* video placeholders: say plainly that the video is coming and its answer is on the page */
var toast = document.createElement('p'); toast.className = 'toast'; toast.setAttribute('aria-hidden', 'true'); document.body.appendChild(toast);
var tt;
$$('[data-play]').forEach(function(b){ b.addEventListener('click', function(){
  var m = 'This video is coming soon. Everything it says is written on this page.';
  toast.textContent = m; toast.classList.add('on'); say(m); clearTimeout(tt); tt = setTimeout(function(){ toast.classList.remove('on'); }, 3200);
}); });
})();
