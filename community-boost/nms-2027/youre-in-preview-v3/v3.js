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
  $$('[data-me-tile]').forEach(function(t){ t.classList.toggle('on', a === 'all' || a === 'some'); t.classList.toggle('maybe', a === 'some'); });
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
/* their own tile in the 2025 room: their name and initials */
(function(){
  var s = document.querySelector('[data-seat-me]'), nm = s ? s.textContent.trim() : '';
  if (!nm || nm === 'Your seat') return;
  var ini = nm.split(/\s+/).map(function(w){ return w.charAt(0).toUpperCase(); }).slice(0,2).join('');
  Array.prototype.forEach.call(document.querySelectorAll('[data-me-name]'), function(e){ e.textContent = nm; });
  Array.prototype.forEach.call(document.querySelectorAll('[data-initials]'), function(e){ e.textContent = ini; });
})();

/* a pin beside their city wherever the page prints it, so a different time zone is obvious at a glance */
(function(){
  var tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch(e) {}
  if (!tz || ['America/Los_Angeles','America/Vancouver','America/Tijuana','US/Pacific'].indexOf(tz) >= 0) return;
  var city = tz.split('/').pop().replace(/_/g, ' ');
  var SEL = '[data-hd-main],[data-hd-sub],[data-hd-when],[data-when-local],[data-hd-start],[data-tl-30],.stops .ld span,.reply .r-h,[data-local-start-inline]';
  function wrapCity(){
    Array.prototype.forEach.call(document.querySelectorAll(SEL), function(el){
      if (el.innerHTML.indexOf(city) < 0 || el.innerHTML.indexOf('class="city"') >= 0) return;
      el.innerHTML = el.innerHTML.split(city).join('<span class="city">' + city + '</span>');
    });
  }
  window.wrapCity = wrapCity;
  wrapCity();
  document.addEventListener('click', function(){ setTimeout(wrapCity, 30); }, true);
})();

if (new URLSearchParams(location.search).has('still')) document.documentElement.classList.add('still');

/* the summit's three days, held on the hero's February floor: their own dates (Manila holds Wed 24 to Fri 26),
   lined up under Cameron's video, each day a third of the video's width */
(function(){
  var hero = document.getElementById('hero'), fl = hero && hero.querySelector('.cal-floor'), vid = hero && hero.querySelector('.hero-player');
  if (!fl) return;
  var cells = Array.prototype.slice.call(fl.querySelectorAll('.cf-d'));
  var s = window.__yiShift || 0;
  if (s) {
    var idx = cells.map(function(c, i){ return c.classList.contains('hold') ? i : -1; }).filter(function(i){ return i >= 0; });
    if (idx.length && cells[idx[idx.length - 1] + s]) {
      idx.forEach(function(i){ cells[i].classList.remove('hold', 'h1', 'h2', 'h3'); });
      idx.forEach(function(i, k){ cells[i + s].classList.add('hold', 'h' + (k + 1)); });
    }
  }
  var mid = 3; cells.forEach(function(c, i){ if (c.classList.contains('h2')) mid = i % 7; });
  fl.style.setProperty('--mid', mid);
  function place(){
    var vr = vid ? vid.getBoundingClientRect() : null;
    if (!vr || !vr.width) { fl.style.display = 'none'; return; }
    fl.style.display = '';
    var hr = hero.getBoundingClientRect(), cw = vr.width / 3;
    hero.style.setProperty('--cw', cw.toFixed(2) + 'px');
    fl.style.setProperty('--cw', cw.toFixed(2) + 'px');
    fl.style.left = (vr.left - hr.left + vr.width / 2 - (mid + .5) * cw).toFixed(1) + 'px';
  }
  place();
  addEventListener('resize', place);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
})();

/* the floating header's glass: dark over the dark sections, light over the rest */
(function(){
  var nav = document.querySelector('.nav'), bar = nav && nav.querySelector('.bar');
  if (!bar) return;
  var dark = Array.prototype.slice.call(document.querySelectorAll('.hero, .commit'));
  var queued = false;
  function upd(){
    queued = false;
    var r = bar.getBoundingClientRect(), y = r.top + r.height / 2, on = false;
    dark.forEach(function(s){ if (s.offsetParent === null) return; var b = s.getBoundingClientRect(); if (b.top <= y && b.bottom > y) on = true; });
    nav.classList.toggle('on-dark', on);
  }
  function ask(){ if (!queued) { queued = true; requestAnimationFrame(upd); } }
  addEventListener('scroll', ask, {passive: true}); addEventListener('resize', ask); upd();
})();
