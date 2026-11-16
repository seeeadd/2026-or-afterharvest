/* You're in page v4: the parts page.js does not cover. The videos (shown only once they exist), the city pin, the
   February floor, the header glass, the road and its car, the frozen checklist, the inbox demo. Nothing is sent anywhere. */
(function(){
'use strict';
var q = new URLSearchParams(location.search);
function $(s){ return document.querySelector(s); }
function $$(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); }
function say(t){ var l = $('#live'); if (l) { l.textContent = ''; setTimeout(function(){ l.textContent = t; }, 30); } }

/* "Will you be there live?": one answer, its own reply. The default we hope for is all three days. */
var KEY = 'nms27-yi-commit';
function firstLine(){
  var wd = null, dn = null, main = $('[data-hd-main]');
  var tm = main ? (main.textContent.split(' · ')[1] || '') : '';
  return 'See you ' + (window.__yiFirstLocal || 'Tuesday, February 23') + '.';
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

/* videos: a play control appears only once its video exists (set src below: an .mp4 file, or a YouTube, Vimeo or
   Loom embed link). Until then the written words carry it. ?videos shows the slots for review before the videos exist. */
var VIDEOS = {
  welcome: {src: '', dur: ''},   // Cameron's welcome, beside the calendar
  time:    {src: '', dur: ''},   // "I can't be away from my desk for whole days." Cameron
  ai:      {src: '', dur: ''},   // "I'm not good with AI." Chloe
  join:    {src: '', dur: ''}    // how to join on the day
};
var preview = q.has('videos');
var toast = document.createElement('p'); toast.className = 'toast'; toast.setAttribute('aria-hidden', 'true'); document.body.appendChild(toast);
var tt;
function note(m){ toast.textContent = m; toast.classList.add('on'); say(m); clearTimeout(tt); tt = setTimeout(function(){ toast.classList.remove('on'); }, 3200); }
var dlg = $('[data-vdlg]');
function openVideo(src, label){
  if (!dlg || !dlg.showModal) { window.open(src, '_blank', 'noopener'); return; }
  var box = dlg.querySelector('.vdlg-in'); box.innerHTML = '';
  var el;
  if (/\.(mp4|webm|mov)(\?|#|$)/i.test(src)) { el = document.createElement('video'); el.controls = true; el.autoplay = true; el.playsInline = true; el.src = src; }
  else { el = document.createElement('iframe'); el.src = src; el.allow = 'autoplay; fullscreen; picture-in-picture'; el.allowFullscreen = true; el.title = label; }
  box.appendChild(el); dlg.setAttribute('aria-label', label); dlg.showModal();
}
if (dlg) {
  var shut = function(){ dlg.querySelector('.vdlg-in').innerHTML = ''; if (dlg.open) dlg.close(); };
  dlg.querySelector('[data-vclose]').addEventListener('click', shut);
  dlg.addEventListener('click', function(e){ if (e.target === dlg) shut(); });
  dlg.addEventListener('close', function(){ dlg.querySelector('.vdlg-in').innerHTML = ''; });
}
$$('[data-play]').forEach(function(b){
  var v = VIDEOS[b.dataset.play] || {}, has = !!v.src, wrap = b.closest('[data-vid]');
  var always = b.dataset.play === 'welcome';   /* Sean: "not remove the 'Watch this video' text and the arrow" */
  if (!has && !preview && !always) {
    if (b.classList.contains('player')) { b.disabled = true; b.tabIndex = -1; b.setAttribute('aria-hidden', 'true'); if (wrap) wrap.classList.add('novid'); }
    else b.hidden = true;
    return;
  }
  if (v.dur) Array.prototype.forEach.call(b.querySelectorAll('[data-dur]'), function(d){ d.textContent = v.dur; });
  b.addEventListener('click', function(){
    if (has) openVideo(v.src, b.getAttribute('aria-label') || b.textContent.trim());
    else note('This video is coming soon. Everything it says is written on this page.');
  });
});
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
  var SEL = '.reply .r-h,[data-hd-main],[data-hd-sub],[data-when-local],[data-week-start],[data-state-when],[data-hd-state],.stops .ld span';
  function wrapCity(){
    Array.prototype.forEach.call(document.querySelectorAll(SEL), function(el){
      if (el.classList.contains('city') || el.closest('.city')) return;
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

/* the road through the three days, with a car on it. Wide screens: hover (or focus, or tap) a day and the car drives
   there. Narrow screens: the road runs down the left and the car follows the day you have scrolled to. */
(function(){
  var road = document.querySelector('.road'), svg = road && road.querySelector('.road-svg'), list = road && road.querySelector('.stops');
  if (!svg || !list) return;
  var NS = 'http://www.w3.org/2000/svg';
  var stops = Array.prototype.slice.call(list.children).filter(function(el){ return el.tagName === 'LI'; });
  var still = document.documentElement.classList.contains('still');
  var reduce = still || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var path, car, total = 0, at = [], cur = 0, ang = 0, active = -1, raf = 0, vertical = false, seen = false;
  function mk(n, a, parent){ var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); if (parent) parent.appendChild(e); return e; }
  function f(x){ return Math.round(x * 10) / 10; }
  function curve(p){
    var d = 'M' + f(p[0][0]) + ' ' + f(p[0][1]);
    for (var i = 0; i < p.length - 1; i++) {
      var p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
      d += ' C' + f(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + f(p1[1] + (p2[1] - p0[1]) / 6) + ' ' + f(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + f(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + f(p2[0]) + ' ' + f(p2[1]);
    }
    return d;
  }
  function tangent(L){ var a = path.getPointAtLength(Math.max(0, L - 1.5)), b = path.getPointAtLength(Math.min(total, L + 1.5)); return Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI; }
  function drawCar(){
    var p = path.getPointAtLength(cur);
    car.setAttribute('transform', 'translate(' + f(p.x) + ' ' + f(p.y) + ') rotate(' + f(ang) + ')' + (vertical ? ' scale(.74)' : ''));
  }
  function build(){
    vertical = innerWidth <= 1000;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var rr = road.getBoundingClientRect(), lr = list.getBoundingClientRect();
    var W = vertical ? (innerWidth <= 700 ? 40 : 54) : rr.width, H = vertical ? lr.height : 118;
    svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var pts = stops.map(function(li, i){
      var r = li.getBoundingClientRect();
      return vertical ? [W * (i % 2 ? .62 : .4), r.top - rr.top + 46] : [r.left - rr.left + r.width / 2, i % 2 ? 66 : 48];
    });
    var all = [vertical ? [W * .5, -26] : [-40, 64]].concat(pts, [vertical ? [W * .5, H + 26] : [W + 40, 58]]);
    var d = curve(all), band = vertical ? 22 : 30;
    mk('path', {d: d, fill: 'none', stroke: '#c7eba2', 'stroke-width': band, 'stroke-linecap': 'round'}, svg);
    path = mk('path', {d: d, fill: 'none', stroke: '#009b27', 'stroke-width': 2.2, 'stroke-dasharray': '9 10', 'stroke-linecap': 'round'}, svg);
    total = path.getTotalLength();
    at = pts.map(function(pt){
      var best = 0, bd = 1e9;
      for (var L = 0; L <= total; L += 2) { var q = path.getPointAtLength(L), dd = (q.x - pt[0]) * (q.x - pt[0]) + (q.y - pt[1]) * (q.y - pt[1]); if (dd < bd) { bd = dd; best = L; } }
      return best;
    });
    pts.forEach(function(pt, i){
      var a = tangent(at[i]), goal = i === stops.length - 1;
      if (!vertical) mk('path', {d: 'M' + f(pt[0]) + ' ' + f(pt[1] + band / 2 + 3) + 'V' + (H - 4), stroke: '#8fcc9c', 'stroke-width': 1.6, 'stroke-dasharray': '3 4', 'stroke-linecap': 'round', fill: 'none'}, svg);
      var g = mk('g', {transform: 'translate(' + f(pt[0]) + ' ' + f(pt[1]) + ') rotate(' + f(a) + ')'}, svg);
      if (goal) {
        for (var r = 0; r < 5; r++) for (var col = 0; col < 2; col++)
          mk('rect', {x: -4 + col * 4, y: -band / 2 + r * band / 5, width: 4, height: band / 5, fill: (r + col) % 2 ? '#071407' : '#ffffff'}, g);
      } else {
        mk('rect', {x: -1.6, y: -band / 2 + 3, width: 3.2, height: band - 6, rx: 1.2, fill: '#ffffff'}, g);
      }
    });
    car = mk('g', {'class': 'car'}, svg);
    var c = mk('g', {}, car);
    mk('rect', {x: -21, y: -10, width: 46, height: 26, rx: 9, fill: '#071407', opacity: '.16'}, c);
    [[-15, -15.5], [7, -15.5], [-15, 10.5], [7, 10.5]].forEach(function(w){ mk('rect', {x: w[0], y: w[1], width: 10, height: 5, rx: 2, fill: '#071407'}, c); });
    mk('rect', {x: -23, y: -13, width: 46, height: 26, rx: 9, fill: '#FC7540'}, c);
    mk('path', {d: 'M-23 4H23V5A8 8 0 0 1 15 13H-15A8 8 0 0 1-23 5Z', fill: '#071407', opacity: '.13'}, c);
    mk('rect', {x: -12, y: -9.5, width: 20, height: 19, rx: 5, fill: '#FFB27F'}, c);
    mk('path', {d: 'M8.5-9.5L14.5-8Q16.6 0 14.5 8L8.5 9.5Z', fill: '#071407'}, c);
    mk('path', {d: 'M-12-9L-16.5-7.2Q-18 0-16.5 7.2L-12 9Z', fill: '#071407', opacity: '.82'}, c);
    mk('rect', {x: 19.5, y: -10, width: 3, height: 5, rx: 1.2, fill: '#FFF4C2'}, c);
    mk('rect', {x: 19.5, y: 5, width: 3, height: 5, rx: 1.2, fill: '#FFF4C2'}, c);
    mk('rect', {x: -23, y: -9.5, width: 2, height: 4.5, rx: 1, fill: '#C7321F'}, c);
    mk('rect', {x: -23, y: 5, width: 2, height: 4.5, rx: 1, fill: '#C7321F'}, c);
    if (active >= 0) cur = at[active]; else cur = Math.min(total, vertical ? 6 : 70);
    ang = tangent(cur);
    drawCar();
  }
  function go(i){
    if (i < 0 || i >= at.length) return;
    stops.forEach(function(li, k){ li.classList.toggle('here', k === i); });
    if (i === active) return;
    active = i;
    var from = cur, to = at[i], dir = to >= from ? 1 : -1;
    cancelAnimationFrame(raf);
    if (reduce) { cur = to; ang = tangent(cur); drawCar(); return; }
    var dur = Math.min(1700, 420 + Math.abs(to - from) * 1.05), t0 = performance.now();
    function step(now){
      var k = Math.min(1, (now - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      cur = from + (to - from) * e;
      var want = tangent(cur) + (dir < 0 ? 180 : 0), dl = ((want - ang + 540) % 360) - 180;
      ang += dl * .22;
      drawCar();
      if (k < 1 || Math.abs(dl) > .6) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
  }
  stops.forEach(function(li, i){
    li.addEventListener('mouseenter', function(){ if (!vertical) go(i); });
    li.addEventListener('click', function(){ go(i); });
    li.addEventListener('focusin', function(){ go(i); });
  });
  /* on summit days the car waits at today's day (between days: tomorrow's) */
  var st = document.documentElement.dataset.state, dn = parseInt(((document.querySelector('[data-fill="day"]') || {}).textContent || '').replace(/\D/g, ''), 10);
  var home = (st === 'morning' || st === 'live') && dn ? dn - 1 : (st === 'between' && dn ? dn : 0);
  function scrolled(){
    if (!vertical) return;
    var mid = innerHeight * .55, pick = -1;
    stops.forEach(function(li, i){ if (li.getBoundingClientRect().top < mid) pick = i; });
    if (pick >= 0) go(pick);
  }
  function start(){ if (seen) return; seen = true; if (vertical) scrolled(); else go(Math.min(home, stops.length - 1)); }
  build();
  if (still) { active = -1; go(Math.min(home, stops.length - 1)); seen = true; }
  else if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) { start(); io.disconnect(); } }); }, {threshold: .35});
    io.observe(road);
  } else start();
  var rq = 0;
  addEventListener('scroll', function(){ if (seen && vertical && !rq) rq = requestAnimationFrame(function(){ rq = 0; scrolled(); }); }, {passive: true});
  var rt; addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(function(){ cancelAnimationFrame(raf); build(); if (active >= 0) { var a = active; active = -1; reduce = true; go(a); reduce = still || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); } }, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ var a = active; build(); if (a >= 0) { active = -1; var r0 = reduce; reduce = true; go(a); reduce = r0; } });
  window.addEventListener('load', function(){ var a = active; build(); if (a >= 0) { active = -1; var r0 = reduce; reduce = true; go(a); reduce = r0; } });
})();

/* the frozen three steps: in view once they have scrolled past step 3, to the end of the page; the first step not done is lit */
(function(){
  var dock = document.querySelector('[data-dock]'), st3 = document.getElementById('step-2');
  if (!dock || !st3) return;
  var items = Array.prototype.slice.call(dock.querySelectorAll('[data-step-dot]'));
  function mark(){ var n = items.filter(function(li){ return !li.classList.contains('done'); })[0]; items.forEach(function(li){ li.classList.toggle('next', li === n); }); }
  mark();
  if (window.MutationObserver) new MutationObserver(mark).observe(dock, {subtree: true, attributes: true, attributeFilter: ['class']});
  var dark = Array.prototype.slice.call(document.querySelectorAll('.hero, .commit')), q = false;
  var sec = st3.closest('section') || st3;
  function upd(){
    q = false;
    var past = sec.getBoundingClientRect().bottom < innerHeight * .35;
    dock.classList.toggle('on', past);
    var r = dock.getBoundingClientRect(), y = r.top + r.height / 2, on = false;
    dark.forEach(function(s){ var b = s.getBoundingClientRect(); if (b.top <= y && b.bottom > y) on = true; });
    dock.classList.toggle('on-dark', on);
  }
  function ask(){ if (!q) { q = true; requestAnimationFrame(upd); } }
  addEventListener('scroll', ask, {passive: true}); addEventListener('resize', ask); upd();
})();

/* the CFRE credit log ticks its three days when it comes into view */
(function(){
  var a = document.querySelector('.cfre-art'); if (!a) return;
  if (!('IntersectionObserver' in window)) { a.classList.add('in'); return; }
  var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) { a.classList.add('in'); io.disconnect(); } }); }, {threshold: .45});
  io.observe(a);
})();

/* step 2's demo: plays Promotions, Spam and Outlook in turn (8 s each) until they tap one; "Watch how to move it" opens it bigger */
(function(){
  var ib = document.querySelector('[data-ib]'); if (!ib) return;
  var still = document.documentElement.classList.contains('still') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var ORDER = ['promo', 'spam', 'outlook'];
  function wire(root, hint){
    var win = root.querySelector('.ib-win'), btns = Array.prototype.slice.call(root.querySelectorAll('[data-sc]')), i = 0, locked = false;
    function show(k){
      root.dataset.scene = k;
      btns.forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.sc === k ? 'true' : 'false'); });
      win.classList.remove('run'); void win.offsetWidth; win.classList.add('run');
    }
    btns.forEach(function(b){ b.addEventListener('click', function(){ locked = true; i = ORDER.indexOf(b.dataset.sc); show(b.dataset.sc); if (hint) hint.textContent = 'Tap another to see it.'; }); });
    var timer = still ? 0 : setInterval(function(){ if (locked || document.hidden) return; i = (i + 1) % ORDER.length; show(ORDER[i]); }, 8000);
    show(root.dataset.scene || 'promo');
    return function(){ clearInterval(timer); };
  }
  wire(ib, ib.querySelector('[data-ib-hint]'));
  var dlg = document.querySelector('[data-ib-dlg]'), open = ib.querySelector('[data-ib-open]'), stop = null;
  if (!dlg || !open || !dlg.showModal) { if (open) open.hidden = true; return; }
  open.addEventListener('click', function(){
    var box = dlg.querySelector('.ib-dlg-in'); box.innerHTML = '';
    var big = document.createElement('div'); big.className = 'ib big'; big.dataset.scene = ib.dataset.scene;
    big.appendChild(ib.querySelector('.ib-switch').cloneNode(true));
    big.appendChild(ib.querySelector('.ib-win').cloneNode(true));
    box.appendChild(big);
    stop = wire(big, null);
    dlg.showModal();
  });
  function close(){ if (stop) stop(); stop = null; if (dlg.open) dlg.close(); }
  dlg.querySelector('[data-ib-close]').addEventListener('click', close);
  dlg.addEventListener('click', function(e){ if (e.target === dlg) close(); });
  dlg.addEventListener('close', function(){ if (stop) stop(); stop = null; });
})();
