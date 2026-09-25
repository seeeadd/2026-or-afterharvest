/* Fills the v4 LP template from window.LP, fits hand-set headlines (scrollWidth of nowrap spans), draws the one
   headline mark (the device lifted from the lead's slide), the brand pattern and the slide's ghost objects,
   then sets window.LP_READY = {cut, height, fonts, overflow, ...} for scripts/build_lp.py. */
(function () {
  var D = window.LP, P = document.getElementById('page');
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function nwh(h) { return h.replace(/([A-Za-z0-9]+(?:-[A-Za-z0-9]+)+)/g, '<span class="nw">$1</span>'); }   /* no break at hyphens */
  function bolds(s) { return nwh(esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')); }       /* **phrase** -> bold */
  var overflow = [];
  var EV = D.event_core, FIRST = D.first_name;

  /* ---------- nav + hero ---------- */
  $('navEvent').textContent = EV;
  $('heroEye').innerHTML = '<i class="dot"></i>Free 3-day live event<i></i>Live online<i></i>With ' + esc(D.name);
  var H = D.headline, markDone = false;
  function markify(line, word) {            /* key phrase -> .kw (carries the one mark); trailing punctuation stays outside */
    var e = esc(line);
    if (!word || markDone) return e;
    var w = esc(String(word).replace(/[\s.,;:!?]+$/, ''));
    var i = e.toLowerCase().indexOf(w.toLowerCase());
    if (i < 0) return e;
    markDone = true;
    return e.slice(0, i) + '<span class="kw">' + e.slice(i, i + w.length) + '</span>' + e.slice(i + w.length);
  }
  var accLine = typeof H.accent_line === 'number' ? H.accent_line : -1;
  $('headline').innerHTML = H.lines.map(function (l, i) {
    return '<span' + (i === accLine ? ' class="acc"' : '') + '>' + markify(l, H.mark_word) + '</span>';
  }).join('');
  $('lede').innerHTML = bolds(D.lede);
  $('fine').textContent = 'Free. Three days live with ' + FIRST + '.';
  $('cFine').textContent = 'Free. Three days live with ' + FIRST + '. Concept page, not live.';
  $('pfx').innerHTML = D.proof.map(function (p) {
    return '<div class="pfn"><b>' + esc(p.num) + '</b><span>' + esc(p.label) + '</span></div>';
  }).join('') + '<div class="pfs">' + esc(D.name) + (D.brand ? ' · ' + esc(D.brand) : '') + '</div>';
  if (!D.proof.length) $('pfx').innerHTML = '<div class="pfn"><b style="font-size:21px">' + esc(D.name) + '</b></div><div class="pfs">' + esc(D.role || D.brand) + '</div>';

  /* ---------- facts strip: sourced facts only ---------- */
  function fkItem(t) {
    var m = String(t).match(/^([\d][\d.,]*[KkMm]?\+?)\s+(.*)$/);
    return '<span class="fki">' + (m ? '<b>' + esc(m[1]) + '</b><span>' + esc(m[2]) + '</span>' : '<span>' + esc(t) + '</span>') + '</span>';
  }
  var items = D.ticker.map(fkItem), fk = [];
  for (var rep = 0; rep < 3 && items.length; rep++) items.forEach(function (h) { fk.push(h); });
  $('fk').innerHTML = fk.join('<i class="fkd"></i>');
  if (!items.length) $('facts').style.display = 'none';

  /* ---------- fit check ---------- */
  $('fitL1').textContent = 'Is the 3-day ' + EV;
  var CHK = '<svg width="14" height="14" viewBox="0 0 15 15"><path d="M3 7.9l2.9 2.9 6.2-6.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function checksHTML(n) {
    return D.checks.slice(0, n).map(function (c) {
      return '<li><span class="ck">' + CHK + '</span><p><b>' + esc(String(c.bold).replace(/[.:]+$/, '')) + '.</b> ' + nwh(esc(c.text)) + '</p></li>';
    }).join('');
  }
  $('checks').innerHTML = checksHTML(D.fit_count);
  $('meName').textContent = D.name;
  $('meRole').textContent = D.role || D.brand || '';

  /* ---------- stats band ---------- */
  var bs = $('bstats');
  bs.style.gridTemplateColumns = 'repeat(' + D.stats.length + ',1fr)';
  bs.innerHTML = D.stats.map(function (s) {
    return '<div class="bs"><div class="n">' + esc(s.num) + '</div><div class="l">' + esc(s.label) + '</div></div>';
  }).join('');
  $('bline').innerHTML = 'The actual numbers<i></i>' + esc(D.brand || D.name);
  if (!D.stats.length) $('band').style.display = 'none';

  /* ---------- days ---------- */
  function split(t) { return String(t).split('|').map(function (s) { return s.trim(); }); }
  $('intro').textContent = D.days_intro;
  $('d1t').innerHTML = split(D.days[0].title).map(function (l) { return '<span>' + esc(l) + '</span>'; }).join('');
  $('d1o').innerHTML = nwh(esc(D.days[0].outcome));
  $('d23').innerHTML = D.days.slice(1, 3).map(function (d, i) {
    return '<div class="dc"><div class="when"><span class="dl">Day</span><b class="dn">0' + (i + 2) + '</b><span class="dmeta">Live session<br>Online</span></div>' +
      '<h3 class="dt disp fit">' + split(d.title).map(function (l) { return '<span>' + esc(l) + '</span>'; }).join('') +
      '</h3><p class="do">' + nwh(esc(d.outcome)) + '</p></div>';
  }).join('');
  $('cEvent').textContent = EV;
  $('footL').innerHTML = 'Proposed free 3-day live event for ' + esc(D.brand || D.name) + '. Not a live page.';
  $('footR').textContent = D.sources_line || '';

  /* ---------- images ---------- */
  $('video').src = D.img.video; $('video').style.objectPosition = D.style.video_focus || '50% 30%';
  $('slide').src = D.img.slide;
  ['portrait', 'pfAvatar', 'cAvatar'].forEach(function (id) {
    var im = $(id); im.src = D.img.headshot;
    if (D.img.headshot_cutout) {
      im.style.cssText = id === 'portrait'
        ? 'inset:auto;left:-6%;top:8%;width:112%;height:100%;object-fit:cover;object-position:50% 0'
        : 'inset:auto;left:-18%;top:6%;width:136%;height:136%;object-fit:cover;object-position:50% 0';
    } else im.style.objectPosition = D.style.headshot_focus || '50% 20%';
  });

  /* ---------- fitting: hand-set lines, sized by scrollWidth of nowrap spans ---------- */
  function fit(el, colW, maxPx, minPx) {
    el.style.fontSize = '100px';
    var w = 0;
    [].forEach.call(el.children, function (s) { w = Math.max(w, s.scrollWidth); });
    var size = Math.max(minPx, Math.min(maxPx, 100 * colW / w));
    el.style.fontSize = size.toFixed(2) + 'px';
    var widest = 0;
    [].forEach.call(el.children, function (s) { widest = Math.max(widest, s.scrollWidth); });
    if (widest > colW + 1) overflow.push((el.id || el.className) + ' ' + widest + '>' + colW);
    return size;
  }
  function shrinkNowrap(el, colW, min) {
    var fs = parseFloat(getComputedStyle(el).fontSize);
    while (el.scrollWidth > colW + 0.5 && fs > (min || 9)) { fs -= 0.25; el.style.fontSize = fs + 'px'; }
    if (el.scrollWidth > colW + 1) overflow.push((el.id || el.className) + ' ' + el.scrollWidth + '>' + colW);
  }
  function fitNav() {                       /* the nav must hold on one row: shrink the event name first */
    var lk = document.querySelector('.lock'), nm = $('navEvent'), fs = 18;
    function over() { return nm.scrollWidth > lk.clientWidth - 51 + 0.5; }
    while (over() && fs > 13) { fs -= 0.25; nm.style.fontSize = fs + 'px'; }
    if (over()) overflow.push('nav event ' + nm.scrollWidth + '>' + (lk.clientWidth - 51));
  }

  /* ---------- the one signature mark on the headline key phrase (device from the lead's slide) ---------- */
  function drawMark() {
    var kw = document.querySelector('#headline .kw');
    if (!kw || !D.mark) return null;
    var ns = 'http://www.w3.org/2000/svg', fs = parseFloat($('headline').style.fontSize);
    var w = kw.offsetWidth, h = kw.offsetHeight, col = D.mark.color || 'var(--accent)', k = D.mark.kind, d = '', body = '';
    var r = rng(hash((D.slug || '') + k));
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'mark');
    var pad = fs * 0.3;
    svg.setAttribute('width', w + 2 * pad); svg.setAttribute('height', h + 2 * pad);
    svg.style.left = -pad + 'px'; svg.style.top = -pad + 'px';
    function X(x) { return (x + pad).toFixed(1); }
    function Y(y) { return (y + pad).toFixed(1); }
    if (k === 'swipe') {                    /* marker hatch under the baseline, like the slide's swipe */
      var y0 = h * 0.80, y1 = h * 1.00, step = fs * 0.062, x = -fs * 0.04, up = true;
      d = 'M' + X(x) + ' ' + Y(y1);
      while (x < w + fs * 0.02) {
        x += step * (0.85 + r() * 0.3);
        d += ' L' + X(x) + ' ' + Y((up ? y0 : y1) + (r() - 0.5) * fs * 0.02);
        up = !up;
      }
      body = '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + (fs * 0.034).toFixed(2) + '" stroke-linecap="round" stroke-linejoin="round"/>';
    } else if (k === 'box') {               /* selection box with corner handles (a screen creator's device) */
      var p = fs * 0.06, x0 = -p, yA = h * 0.06, x1 = w + p, yB = h * 0.98, hs = Math.max(6, fs * 0.075);
      body = '<rect x="' + X(x0) + '" y="' + Y(yA) + '" width="' + (x1 - x0).toFixed(1) + '" height="' + (yB - yA).toFixed(1) + '" fill="' + col + '" fill-opacity=".10" stroke="' + col + '" stroke-width="' + Math.max(1.5, fs * 0.022).toFixed(2) + '"/>';
      [[x0, yA], [x1, yA], [x0, yB], [x1, yB]].forEach(function (c) {
        body += '<rect x="' + (c[0] + pad - hs / 2).toFixed(1) + '" y="' + (c[1] + pad - hs / 2).toFixed(1) + '" width="' + hs.toFixed(1) + '" height="' + hs.toFixed(1) + '" fill="var(--ground)" stroke="' + col + '" stroke-width="' + Math.max(1.5, fs * 0.022).toFixed(2) + '"/>';
      });
    } else if (k === 'ring') {              /* loose hand-drawn ellipse, open at the top right */
      var cx = w / 2, cy = h * 0.55, rx = w / 2 + fs * 0.16, ry = h * 0.56, pts = [], a0 = -0.9, n = 64;
      for (var i = 0; i <= n; i++) {
        var a = a0 + (i / n) * (Math.PI * 2 + 0.55), wob = 1 + Math.sin(a * 3 + r() * 0.3) * 0.02 + (i / n) * 0.05;
        pts.push(X(cx + Math.cos(a) * rx * wob) + ' ' + Y(cy + Math.sin(a) * ry * wob));
      }
      body = '<path d="M' + pts.join(' L') + '" fill="none" stroke="' + col + '" stroke-width="' + (fs * 0.035).toFixed(2) + '" stroke-linecap="round" stroke-linejoin="round"/>';
    } else if (k === 'highlight') {
      body = '<path d="M' + X(-fs * 0.05) + ' ' + Y(h * 0.52) + ' L' + X(w + fs * 0.06) + ' ' + Y(h * 0.49) + ' L' + X(w + fs * 0.04) + ' ' + Y(h * 0.9) +
        ' L' + X(-fs * 0.04) + ' ' + Y(h * 0.93) + 'Z" fill="' + col + '" fill-opacity=".32"/>';
    } else {                                /* underline: one hand-drawn stroke, and a shorter return for 'double' */
      var yb = h * 0.93, sw = (fs * 0.05).toFixed(2);
      body = '<path d="M' + X(-fs * 0.03) + ' ' + Y(yb + fs * 0.02) + ' C' + X(w * 0.3) + ' ' + Y(yb - fs * 0.035) + ' ' + X(w * 0.7) + ' ' + Y(yb - fs * 0.01) +
        ' ' + X(w + fs * 0.05) + ' ' + Y(yb - fs * 0.05) + '" fill="none" stroke="' + col + '" stroke-width="' + sw + '" stroke-linecap="round"/>';
      if (k === 'double') body += '<path d="M' + X(w * 0.08) + ' ' + Y(yb + fs * 0.1) + ' C' + X(w * 0.4) + ' ' + Y(yb + fs * 0.06) + ' ' + X(w * 0.7) + ' ' + Y(yb + fs * 0.08) +
        ' ' + X(w * 0.94) + ' ' + Y(yb + fs * 0.05) + '" fill="none" stroke="' + col + '" stroke-width="' + (fs * 0.035).toFixed(2) + '" stroke-linecap="round"/>';
    }
    svg.innerHTML = body;
    kw.appendChild(svg);
    return k;
  }

  /* ---------- brand pattern library (seeded), full page, bleeding off every edge ---------- */
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h; }
  function L(x1, y1, x2, y2, w) { return '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke-width="' + w + '"/>'; }
  var PAT = {
    grid: function (W, Hh, r) {             /* blueprint grid: even fine lines, snapped to the device pixel grid */
      var s = '', step = 60, ox = -Math.round(r() * step), oy = -Math.round(r() * step), x, y;
      for (x = ox; x < W + step; x += step) s += L(x, -4, x, Hh + 4, 2);
      for (y = oy; y < Hh + step; y += step) s += L(-4, y, W + 4, y, 2);
      return s;
    },
    dots: function (W, Hh, r) {
      var s = '<g fill="currentColor" stroke="none">', step = 24, ox = Math.round(r() * step), oy = Math.round(r() * step);
      for (var y = oy - step; y < Hh + step; y += step) for (var x = ox - step; x < W + step; x += step) s += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="1.9"/>';
      return s + '</g>';
    },
    ruled: function (W, Hh, r) {            /* notebook: ruled lines with a slight hand wobble, double margin rule */
      var s = '', step = 34, oy = r() * step;
      for (var y = oy; y < Hh; y += step) {
        var a = (r() - 0.5) * 2.4, b = (r() - 0.5) * 2.4;
        s += '<path d="M-6 ' + y.toFixed(1) + ' C 260 ' + (y + a).toFixed(1) + ' 540 ' + (y + b).toFixed(1) + ' 806 ' + (y + (a - b) / 2).toFixed(1) + '" stroke-width="1.5"/>';
      }
      return s + L(62, -4, 62, Hh + 4, 2.2) + L(68, -4, 68, Hh + 4, 1.3);
    },
    loops: function (W, Hh, r) {            /* marker loops sweeping across the page every ~620 px */
      var s = '';
      for (var y0 = 180 + r() * 120; y0 < Hh + 200; y0 += 560 + r() * 160) {
        var a = 16 + r() * 6, bb = 34 + r() * 14, d = '', tilt = (r() - 0.5) * 16;
        for (var t = 0; t <= (W + 300) / a; t += 0.12) {
          var x = -150 + a * t - bb * Math.sin(t), y = y0 - bb * Math.cos(t) + Math.sin(t * 0.23) * 24;
          d += (t === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
        }
        s += '<path d="' + d + '" stroke-width="2.6" stroke-linejoin="round" transform="rotate(' + tilt.toFixed(1) + ' 400 ' + y0.toFixed(0) + ')"/>';
      }
      return s;
    },
    hatch: function (W, Hh, r) {            /* engraved hatching: diagonal bands bleeding off alternate edges */
      var s = '';
      for (var y0 = 60; y0 < Hh; y0 += 520) {
        var right = (Math.round(y0 / 520) % 2 === 0), x0 = right ? W - 180 : -60;
        for (var k = 0; k < 26; k++) s += L(x0 + k * 9, y0, x0 + k * 9 - 150, y0 + 240, 1.4);
      }
      return s;
    },
    ui: function (W, Hh, r) {               /* screen world: crosshair ticks on a 44 px grid, a few ruler rows */
      var s = '', step = 44, ox = Math.round(r() * step) + 0.25, oy = Math.round(r() * step) + 0.25;
      for (var x = ox - step; x < W + step; x += step) for (var y = oy - step; y < Hh + step; y += step) s += '<path d="M' + (x - 4).toFixed(1) + ',' + y.toFixed(1) + 'h8M' + x.toFixed(1) + ',' + (y - 4).toFixed(1) + 'v8" stroke-width="1.5"/>';
      for (var yy = 300; yy < Hh; yy += 620) {
        s += L(-4, yy, W + 4, yy, 1.5);
        for (var tx = 0; tx < W; tx += 11) s += L(tx, yy, tx, yy + (tx % 55 === 0 ? 12 : 6), 1.3);
      }
      return s;
    },
    blooms: function () { return ''; }
  };
  function drawPattern() {
    var W = 800, Hh = P.offsetHeight, r = rng(hash(D.slug || 'lp')), svg = $('pattern');
    svg.setAttribute('width', W); svg.setAttribute('height', Hh); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + Hh);
    svg.style.height = Hh + 'px';
    var inner = '';
    String(D.pattern || 'dots').split('+').forEach(function (k) { if (PAT[k]) inner += '<g>' + PAT[k](W, Hh, r) + '</g>'; });
    svg.innerHTML = '<g fill="none" stroke="currentColor" stroke-linecap="round">' + inner + '</g>';
  }

  /* ---------- ghost objects lifted from the slide: oversized outlines cropped by the page edge ---------- */
  function top(el) { return el.getBoundingClientRect().top - P.getBoundingClientRect().top; }
  function placeGhosts() {
    var box = $('ghosts'); box.innerHTML = '';
    var G = D.ghosts || [];
    if (!G.length) return [];
    var slots = [
      { edge: 'r', cy: 250, size: 520, rot: -7, crop: 0.40 },
      { edge: 'l', cy: top($('fitc')) + $('fitc').offsetHeight * 0.58, size: 500, rot: 8, crop: 0.42 },
      { edge: 'l', cy: top($('days')) + 190, size: 520, rot: -6, crop: 0.46 }
    ], placed = [];
    slots.forEach(function (sl, i) {
      var g = G[i % G.length], mx = Math.max(g.w, g.h), mn = Math.min(g.w, g.h);
      var s = sl.size / mx;
      if (mn * s < 190) s = Math.min(190 / mn, 700 / mx);   /* long thin objects grow until they read */
      var target = D.ghost_stroke || 4.5;       /* css px on the page */
      if (g.sw) {
        if (g.sw * s < target * 0.9) s = Math.min(target * 0.9 / g.sw, 760 / mx);
        if (g.sw * s > target * 1.4) s = target * 1.4 / g.sw;
      }
      var w = g.w * s, h = g.h * s;
      var left = sl.edge === 'r' ? 800 - w * (1 - sl.crop) : -w * sl.crop;
      var wrap = document.createElement('div');
      wrap.innerHTML = g.svg;
      var el = wrap.firstElementChild;
      el.setAttribute('width', w.toFixed(1)); el.setAttribute('height', h.toFixed(1));
      el.style.left = left.toFixed(1) + 'px'; el.style.top = (sl.cy - h / 2).toFixed(1) + 'px';
      el.style.transform = 'rotate(' + sl.rot + 'deg)';
      box.appendChild(el);
      placed.push({ i: i % G.length, x: Math.round(left), y: Math.round(sl.cy - h / 2), w: Math.round(w), h: Math.round(h), stroke_css: +(g.sw * s).toFixed(2) });
    });
    return placed;
  }
  function calmHeadline() {                 /* marks behind display headings stay at 0.10 opacity or less: a tight,
                                               blurred mask around each line's ink box (scrollWidth, not block width) */
    var pr = P.getBoundingClientRect(), k = Math.min(1, 0.10 / Math.max(D.pat_op, D.ghost_op)), Hh = P.offsetHeight;
    var holes = '', boxes = '';
    ['headline', 'fith', 'daysh'].forEach(function (id) {
      [].forEach.call($(id).children, function (c) {
        var q = c.getBoundingClientRect(), x = q.left - pr.left - 14, y = q.top - pr.top - 8, w = c.scrollWidth + 28, h = q.height + 16;
        var rr = 'M' + x.toFixed(0) + ',' + y.toFixed(0) + 'h' + w.toFixed(0) + 'v' + h.toFixed(0) + 'h-' + w.toFixed(0) + 'z';
        holes += rr; boxes += '<path d="' + rr + '"/>';
      });
    });
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="' + Hh + '"><filter id="b" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="10"/></filter>' +
      '<g filter="url(#b)"><path fill-rule="evenodd" d="M-60,-60H860V' + (Hh + 60) + 'H-60z' + holes + '"/><g fill-opacity="' + k.toFixed(3) + '">' + boxes + '</g></g></svg>';
    var m = 'url("data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '")';
    ['pattern', 'ghosts'].forEach(function (id) {
      var st = $(id).style;
      st.webkitMaskImage = m; st.maskImage = m; st.webkitMaskSize = '800px ' + Hh + 'px'; st.maskSize = '800px ' + Hh + 'px';
      st.webkitMaskRepeat = 'no-repeat'; st.maskRepeat = 'no-repeat'; st.maskComposite = ''; st.webkitMaskComposite = '';
    });
    return +k.toFixed(3);
  }
  /* ---------- fonts: width probe, not document.fonts.check ---------- */
  function probe(fam, weight, style) {
    var p = $('probe'), t = 'Hamburgefonstiv 0123 WMQ', diff = false;
    p.style.fontWeight = weight; p.style.fontStyle = style || 'normal'; p.textContent = t;
    ['monospace', 'serif'].forEach(function (fb) {   /* loaded if it differs from either fallback */
      p.style.fontFamily = fb; var a = p.offsetWidth;
      p.style.fontFamily = '"' + fam + '", ' + fb; var b = p.offsetWidth;
      if (Math.abs(a - b) > 2) diff = true;
    });
    return diff;
  }
  function imgsReady() { return [].every.call(document.images, function (im) { return !im.getAttribute('src') || im.complete; }); }
  var t0 = Date.now(), ghostsPlaced = [], markKind = null, calmK = 1;
  function background() { drawPattern(); ghostsPlaced = placeGhosts(); calmK = calmHeadline(); }
  function layout(fontsOk) {
    fitNav();
    var hl = $('headline');
    fit(hl, hl.parentNode.clientWidth - 4, D.style.headline_max || 84, 48);
    var hp = parseFloat(hl.style.fontSize);
    markKind = drawMark();
    var f1 = $('fitL1'), f2 = $('fitL2'), fh = $('fith');       /* both fit-check lines share one size */
    fh.style.fontSize = '40px';
    while ((f1.scrollWidth > 704 || f2.scrollWidth > 704) && parseFloat(fh.style.fontSize) > 26) fh.style.fontSize = (parseFloat(fh.style.fontSize) - 0.5) + 'px';
    fit($('daysh'), 704, Math.min(42, hp - 10), 28);
    fit($('d1t'), $('d1t').parentNode.clientWidth - 4, 34, 22);
    [].forEach.call(document.querySelectorAll('.dc .dt'), function (el) { fit(el, el.parentNode.clientWidth - 52, 28, 19); });
    [].forEach.call(document.querySelectorAll('.bs .n'), function (el) { shrinkNowrap(el, el.parentNode.clientWidth - 20); });
    [].forEach.call(document.querySelectorAll('.pfn'), function (el) { shrinkNowrap(el, el.parentNode.clientWidth, 11); });
    [].forEach.call(document.querySelectorAll('.pfs'), function (el) { shrinkNowrap(el, $('pfx').clientWidth, 7.5); });
    shrinkNowrap($('meName'), 236 - 24 - 28, 12);
    if (P.offsetHeight > 2700) { P.classList.add('compact'); if (D.fit_count > 3) $('checks').innerHTML = checksHTML(3); }
    if (P.offsetHeight > 2700) P.classList.add('compact2');
    background();
    var ptop = P.getBoundingClientRect().top, cut = $('band').getBoundingClientRect().top - ptop;
    var hb = hl.getBoundingClientRect(), widths = [].map.call(hl.children, function (s) { return s.scrollWidth; });
    var np = document.createElement('div');   /* removed by build_lp.py before the page shot */
    np.id = 'numprobe';
    np.innerHTML = '<span class="n">2011</span><span class="n">48</span>';
    P.appendChild(np);
    window.LP_READY = {
      cut: Math.round(cut), height: P.offsetHeight, fonts: fontsOk, overflow: overflow,
      headline_px: hp, headline_widths: widths, headline_col: hl.parentNode.clientWidth - 4,
      headline_box: [Math.round(hb.left), Math.round(hb.top - ptop), Math.round(hb.width), Math.round(hb.height)],
      mark: markKind, ghosts: ghostsPlaced, calm_mask: calmK, compact: P.className, ms: Date.now() - t0,
      checks_shown: $('checks').children.length,
      days_top: Math.round($('days').getBoundingClientRect().top - ptop),
      numprobe: [].map.call(np.children, function (s) { var r = s.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; })
    };
  }
  function wait() {
    var F = D.fonts, ok = { display: probe(F.display, F.display_weight), body: probe(F.body, 400), label: probe(F.label, 500) };
    var all = ok.display && ok.body && ok.label;
    if ((all && imgsReady()) || Date.now() - t0 > 6000) {
      ok.display_family = F.display; ok.body_family = F.body; ok.label_family = F.label;
      setTimeout(function () { layout(ok); }, 0);
    } else setTimeout(wait, 40);
  }
  window.LP_numFallback = function () {   /* display face has no lining figures: numerals switch to the body face */
    P.classList.add('numfb');
    [].forEach.call(document.querySelectorAll('.bs .n'), function (el) { el.style.fontSize = ''; shrinkNowrap(el, el.parentNode.clientWidth - 20); });
    var p = $('numprobe'); if (p) p.parentNode.removeChild(p);
    return { cut: Math.round($('band').getBoundingClientRect().top - P.getBoundingClientRect().top), height: P.offsetHeight };
  };
  window.LP_sticky = function (y) {       /* bottom half: the nav re-drawn over the band's top, as a sticky nav would sit */
    var n = $('navwrap'), b = $('band');
    n.classList.add('sticky'); n.style.top = y + 'px';
    $('hero').style.marginTop = '96px';    /* keeps the top half's layout identical while the nav is lifted out */
    b.style.paddingTop = (parseFloat(getComputedStyle(b).paddingTop) + 86) + 'px';
    background();
    return P.offsetHeight;
  };
  window.LP_bg = function (on) { P.classList.toggle('nobg', !on); return true; };   /* verification: hide pattern + ghosts */
  wait();
})();
