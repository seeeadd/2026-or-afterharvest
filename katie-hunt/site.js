/* ============================================================================
   HOSTED LAYER v5  ·  templates/lp/site.js
   Loaded only by site/<slug>/index.html. lp.js (the frozen Canva build) fills
   the 800px canvas and then sets window.LP_READY; everything here runs AFTER
   that and rebuilds the same nodes into a real, full-width site.

   Rules this file keeps:
     - lp.css / lp.js are never edited. #probe is never display:none (that
       blinds lp.js's font probe and costs a 6s stall before LP_READY).
     - Nothing is hard-coded per lead: every string, colour and number comes
       from window.LP (the landing page data) or window.SITE (build_site.py).
     - The base layer's fitters, pattern, ghosts and headline mask are all
       drawn for an 800px canvas, so this file re-runs its own versions of
       them at the real width, on load and on resize.

   Order:
     1 helpers        4 restructure     7 clocks + tickers
     2 state          5 sections        8 layout engine (fits, phone, bg)
     3 drawn art      6 overlays        9 boot
   ========================================================================= */
(function () {
  'use strict';
  var LP = window.LP || {}, S = window.SITE || {};
  var P = document.getElementById('page');
  if (!P) return;

  /* ------------------------------------------------------------ 1. helpers */
  function $(id) { return document.getElementById(id); }
  function q(sel, root) { return (root || document).querySelector(sel); }
  function qa(sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function toNum(v, dflt) {
    var n = parseFloat(String(v == null ? '' : v).replace(/[^\d.]/g, ''));
    return isFinite(n) ? n : dflt;
  }
  function comma(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function debounce(fn, ms) {
    var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h;
  }
  var ARROW = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9.5M8.6 3.8 12.8 8l-4.2 4.2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var TICK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.2 8.4l3 3 6.6-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* -------------------------------------------------------------- 2. state */
  var EV = LP.event_core || LP.event || '3-day live event';
  var FIRST = LP.first_name || String(LP.name || '').split(' ')[0] || '';
  var WHO = LP.name || '', BRAND = LP.brand || WHO;
  var NAMES = (S.names && S.names.length) ? S.names : ['Maya', 'Devon', 'Priya', 'Sam', 'Alix', 'Jordan', 'Noor', 'Rae'];

  var START = (function () {
    var d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + Math.max(1, toNum(S.starts_in_days, 9)));
    return d;
  })();
  var END = new Date(START.getTime() + 2 * 864e5);

  function dfmt(d, withWeekday) {
    var o = { day: 'numeric', month: 'short' };
    if (withWeekday) o.weekday = 'short';
    return d.toLocaleDateString(undefined, o).replace(',', '');
  }
  function tfmt(d) {
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }).replace(/\s/g, ' ');
  }
  var WHEN = S.when || (dfmt(START, true) + ' to ' + dfmt(END, true));
  var WHEN_FULL = WHEN + ' · ' + tfmt(START) + ' · Live online';

  var state = {
    seats: Math.max(12, toNum(S.registered, 1204)),
    last24: Math.max(1, toNum(S.last24, 18)),
    rating: S.rating || '4.9',
    cap: 0,
    name: NAMES[0]
  };
  state.cap = Math.round(state.seats * 1.34);
  function seatText() { return comma(state.seats); }

  /* ------------------------------------------------------------ 3. drawn art */
  /* Sample faces are drawn, never photographs and never letters: a pastel
     plate in the lead's accent, a thin ink line for the face, four hair cuts. */
  function face(i, size) {
    var photos = S.faces || [];
    if (photos.length) {
      var src = photos[i % photos.length];
      return '<img class="favimg" src="' + src + '" width="' + (size || 40) + '" height="' + (size || 40) +
        '" alt="" loading="lazy">';
    }
    var r = rng(hash('face' + i + (LP.slug || '')));
    var plate = (0.10 + r() * 0.16).toFixed(3), hair = Math.floor(r() * 4), skin = (0.30 + r() * 0.2).toFixed(2);
    var hairs = [
      '<path d="M11.4 17.4c-.6-5.6 3.3-8.6 8.6-8.6s9.2 3 8.6 8.6c-.7-3.6-4-5.1-8.6-5.1s-7.9 1.5-8.6 5.1z"/><path d="M11.6 16.8c-.5 3.4-.2 6.6.5 8.8 1-2.3 1-5.6.6-8.8zM28.4 16.8c.5 3.4.2 6.6-.5 8.8-1-2.3-1-5.6-.6-8.8z"/>',
      '<path d="M11.7 16.6c.4-5.2 4-7.8 8.3-7.8s7.9 2.6 8.3 7.8c-1.6-3.1-4.6-4.3-8.3-4.3s-6.7 1.2-8.3 4.3z"/>',
      '<path d="M12 17c0-5 3.6-8.2 8-8.2s8 3.2 8 8.2c-1.4-3.2-4.4-4.6-8-4.6s-6.6 1.4-8 4.6z"/><circle cx="20" cy="6.6" r="3"/>',
      '<circle cx="13.6" cy="13.6" r="3.5"/><circle cx="20" cy="10.6" r="3.9"/><circle cx="26.4" cy="13.6" r="3.5"/><circle cx="12.6" cy="18.4" r="2.9"/><circle cx="27.4" cy="18.4" r="2.9"/>'
    ][hair];
    return '<svg viewBox="0 0 40 40" width="' + (size || 40) + '" height="' + (size || 40) + '" aria-hidden="true">' +
      '<rect width="40" height="40" fill="var(--accent)" fill-opacity="' + plate + '"/>' +
      '<path d="M4 40c0-8 7.2-12.6 16-12.6S36 32 36 40z" fill="var(--ink)" fill-opacity="' + (0.16 + r() * 0.1).toFixed(2) + '"/>' +
      '<path d="M4 40c0-8 7.2-12.6 16-12.6S36 32 36 40" fill="none" stroke="var(--ink)" stroke-opacity="' + skin + '" stroke-width="1.15"/>' +
      '<circle cx="20" cy="18.6" r="7.6" fill="var(--glass-hi)" stroke="var(--ink)" stroke-opacity="' + skin + '" stroke-width="1.15"/>' +
      '<g fill="var(--ink)" fill-opacity="' + (0.42 + r() * 0.16).toFixed(2) + '">' + hairs + '</g></svg>';
  }
  function avstack(n, cls) {
    var h = '';
    for (var i = 0; i < n; i++) h += '<span class="fav">' + face(i) + '</span>';
    return '<span class="avstack' + (cls ? ' ' + cls : '') + '">' + h + '</span>';
  }
  var PLAY = '<svg viewBox="0 0 24 24" width="15" height="15"><path d="M8 5.4v13.2c0 .8.9 1.3 1.6.9l10.4-6.6c.6-.4.6-1.3 0-1.7L9.6 4.5c-.7-.4-1.6 0-1.6.9z" fill="currentColor"/></svg>';
  var STAR = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.6l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.4 4.2 13.4l.7-4.3-3.1-3 4.3-.6z" fill="currentColor"/></svg>';
  function stars(n) { var h = ''; for (var i = 0; i < (n || 5); i++) h += STAR; return '<span class="stars">' + h + '</span>'; }

  /* award rosette: thin laurel branches, a soft accent plate, one small star */
  var AWARD = '<svg viewBox="0 0 40 40" aria-hidden="true">' +
    '<circle cx="20" cy="18.5" r="11" fill="var(--accent)" fill-opacity=".12"/>' +
    '<circle cx="20" cy="18.5" r="11" fill="none" stroke="var(--accent)" stroke-opacity=".5" stroke-width="1.1"/>' +
    '<g fill="none" stroke="var(--ink)" stroke-opacity=".45" stroke-width="1.2" stroke-linecap="round">' +
    '<path d="M13.4 30.4C7.6 26.8 5.8 20.2 8.2 13.6"/><path d="M26.6 30.4c5.8-3.6 7.6-10.2 5.2-16.8"/>' +
    '<path d="M9.2 17.6c-1.9-.6-2.8-1.9-2.9-3.6 1.8-.2 3.1.4 3.9 1.8M10.6 22.4c-1.9-.4-3-1.6-3.3-3.3 1.8-.4 3.1.1 4 1.4M13 26.6c-1.8-.6-2.8-1.9-2.9-3.6 1.8-.2 3.1.4 3.9 1.8"/>' +
    '<path d="M30.8 17.6c1.9-.6 2.8-1.9 2.9-3.6-1.8-.2-3.1.4-3.9 1.8M29.4 22.4c1.9-.4 3-1.6 3.3-3.3-1.8-.4-3.1.1-4 1.4M27 26.6c1.8-.6 2.8-1.9 2.9-3.6-1.8-.2-3.1.4-3.9 1.8"/></g>' +
    '<path d="M20 12.4l1.7 3.5 3.8.5-2.8 2.7.7 3.8L20 21l-3.4 1.9.7-3.8-2.8-2.7 3.8-.5z" fill="var(--accent)"/></svg>';

  /* ---------------------------------------------------- 4. restructure: head */
  function headerStack() {
    var navwrap = $('navwrap'), nav = $('nav');
    if (!navwrap || !nav) return;

    var bar = el('div', '', '<i class="pulse"></i>' +
      '<span class="tblong"><b class="seatn">' + seatText() + '</b>+ have registered for ' + esc(EV) + '</span>' +
      '<span class="tbshort"><b class="seatn">' + seatText() + '</b>+ registered</span>');
    bar.id = 'topbar';

    var hdr = el('div', 'hdr');
    P.insertBefore(hdr, navwrap);
    hdr.appendChild(bar);
    hdr.appendChild(navwrap);

    /* the base nav label says "Concept": the hosted page is the lead's own page */
    var small = q('.lw small', nav);
    if (small) small.innerHTML = 'Free <i></i> 3-day live event';

    /* countdown: LIVE IN + four dark tiles, driven by the clock */
    var cd = q('.cd', nav);
    if (cd) {
      var wrap = el('span', 'cdwrap',
        '<span class="cdl"><i class="pulse"></i>Live in</span>' +
        '<span class="cd">' +
        ['days', 'hrs', 'min', 'sec'].map(function (u) {
          return '<span class="tile" data-u="' + u + '"><b>00</b><small>' + u + '</small></span>';
        }).join('') + '</span>');
      nav.replaceChild(wrap, cd);
    }
    var cta = q('.btn.sm', nav);
    if (cta) { cta.classList.add('sheen'); cta.setAttribute('data-reg', '1'); cta.setAttribute('role', 'button'); cta.tabIndex = 0; }

    var onScroll = function () { hdr.classList.toggle('stuck', window.pageYOffset > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------------------------------------------------- 4b. restructure: hero */
  function heroLayout() {
    var hero = $('hero'), eye = $('heroEye'), h1 = $('headline'), lede = $('lede');
    var stage = $('stagebox'), phone = $('iphone'), reg = $('regcard');
    if (!hero || !phone || !reg) return;

    var grid = el('div', 'hgrid'), left = el('div', 'hleft'), right = el('div', 'hright');
    grid.appendChild(left); grid.appendChild(right);
    hero.appendChild(grid);

    /* trust strip above the video */
    var aud = S.audience || 'people';
    var cnt = S.trusted_count || (LP.stats && LP.stats.length ? LP.stats[0].num : '');
    var trust = el('div', 'htrust',
      '<span class="awd"><b>Verified</b><i>' + esc(S.badge_claim || 'Top rated event') + '</i><u>' + esc(LP.brand || '') + '</u></span>' +
      avstack(5) +
      '<span class="tmeta">' + stars(5) +
      '<span class="tm2">Trusted by over <b>' + esc(cnt) + ' ' + esc(aud) + '</b></span></span>');
    left.appendChild(trust);

    var vid = el('div', 'hvid');
    vid.appendChild(phone);
    left.appendChild(vid);

    /* booking card: tape tag, the slide on a laptop, then the join line, the dates and the action */
    var book = el('div', 'hbook',
      '<span class="hbtape">\u2605 Secure your free spot <i>\u00B7</i> Now</span>' +
      '<div class="hbgrid">' +
        '<div class="hblap"><span class="hbscr"><img src="img/slide.jpg" alt="" loading="lazy">' +
          '<i class="hbplay">' + PLAY + '</i></span><span class="hbfoot"></span></div>' +
        '<div class="hbmain">' +
          '<p class="hbjoin">Join the <em>free</em> 3-day ' + esc(EV) + '.</p>' +
          '<p class="hbwhen"><b>' + esc(WHEN) + '</b><span>' + esc(tfmt(START)) + ' \u00B7 Live</span></p>' +
          '<span class="btn lg sq" data-reg="1" role="button" tabindex="0">Hold my seat' + ARROW + '</span>' +
        '</div>' +
      '</div>');
    left.appendChild(book);

    right.appendChild(eye); right.appendChild(h1); right.appendChild(lede); right.appendChild(reg);
    if (stage && stage.parentNode) stage.parentNode.removeChild(stage);

    /* hero eyebrow becomes the coloured date pill */
    eye.innerHTML = '<i class="dot"></i>Free 3-day live event<i></i>' + esc(WHEN) + '<i></i>Live online';

    /* registration card: social proof above the button */
    var proof = el('div', '',
      '<div class="rproof">' + avstack(4, 'sm') +
      '<span class="rrate">' + stars(5) + '<b>' + esc(state.rating) + '</b> average rating</span></div>' +
      '<div class="rseats"><b class="seatn">' + seatText() + '</b> people have their seat ' +
      '<em class="last24">· ' + comma(state.last24) + ' registered in the last 24 hours</em></div>' +
      '<div class="rlive"><i class="pulse"></i><span class="justreg"><b>' + esc(state.name) + '</b> just registered</span></div>');
    var rtop = q('.rtop', reg);
    if (rtop && rtop.nextSibling) reg.insertBefore(proof, rtop.nextSibling); else reg.appendChild(proof);
    var rbtn = q('.btn', reg);
    if (rbtn) { rbtn.setAttribute('data-reg', '1'); rbtn.setAttribute('role', 'button'); rbtn.tabIndex = 0; }
  }

  /* ------------------------------------------------- 5. sections + page copy */
  function fkItem(t) {
    var m = String(t).match(/^([\d][\d.,]*[KkMm]?\+?)\s+(.*)$/);
    return '<span class="fki">' + (m ? '<b>' + esc(m[1]) + '</b><span>' + esc(m[2]) + '</span>'
      : '<span>' + esc(t) + '</span>') + '</span>';
  }
  var FACTS_ONE = '';
  function factsStrip() {
    var facts = (LP.ticker || []).filter(Boolean);
    var box = $('facts'), fk = $('fk');
    if (!box || !fk) return;
    if (!facts.length) { box.style.display = 'none'; return; }
    /* the base layer repeats the list three times for a clipped marquee; we
       rebuild it as one cycle and decide static vs marquee by measured width */
    FACTS_ONE = '<span class="fkc">' + facts.map(fkItem).join('<i class="fkd"></i>') + '<i class="fkd"></i></span>';
    fk.innerHTML = FACTS_ONE;
  }

  function restoreChecks() {
    var ul = $('checks');
    if (!ul || !(LP.checks || []).length) return;
    var CHK = '<svg width="14" height="14" viewBox="0 0 15 15" aria-hidden="true"><path d="M3 7.9l2.9 2.9 6.2-6.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    ul.innerHTML = LP.checks.slice(0, LP.fit_count || LP.checks.length).map(function (c) {
      return '<li><span class="ck">' + CHK + '</span><p><b>' +
        esc(String(c.bold).replace(/[.:]+$/, '')) + '.</b> ' + esc(c.text) + '</p></li>';
    }).join('');
  }

  /* the result card: challenge, outcome, voice. Structure from the reference, drawn in the lead's brand. */
  function testimonial() {
    var t = S.testimonial || {};
    if (!t.quote) return;
    var sec = el('section', 'tst z');
    sec.id = 'tst';
    var who = esc(t.name || 'A member'), role = esc(t.role || '');
    sec.innerHTML =
      '<div class="tstin">' +
        '<figure class="tvid"><span class="tvplay">' + PLAY + '</span>' +
          '<span class="tvspeed"><b>1.2\u00D7</b><s>' + esc(t.length || '2 min 13 sec') + '</s>' +
            esc(t.short || '1 min 51 sec') + '</span>' +
          '<span class="tvbar"><i></i></span></figure>' +
        '<div class="tstbody">' +
          '<ol class="tsteps">' +
            '<li><span class="tsdot"></span><b>The challenge</b><p>' +
              esc(t.challenge || ('Plenty of work going out, no clear line from it to sales.')) + '</p></li>' +
            '<li><span class="tsdot on"></span><b>The result</b>' +
              '<h3>' + esc(t.result || 'A plan she could run the week after.') + '</h3></li>' +
          '</ol>' +
          '<blockquote class="tsquote"><p>' + esc(t.quote) + '</p>' +
            '<footer><span class="tsav">' + esc((t.name || 'A').trim().charAt(0)) + '</span>' +
            '<span><b>' + who + '</b><i>' + role + '</i></span></footer></blockquote>' +
        '</div>' +
      '</div>';
    P.insertBefore(sec, $('closing') || null);
  }

  function gated() {
    var days = LP.days || [], foot = q('#page > .foot');
    var wrap = el('div', ''), inner = el('div', 'gated');
    wrap.id = 'gatewrap';
    wrap.appendChild(inner);

    var ICONS = [
      '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="5" y="7" width="30" height="22" rx="3"/><path d="M14 33h12M20 29v4" stroke-linecap="round"/><path d="M12 16h9M12 21h16" stroke-linecap="round" stroke-opacity=".6"/></svg>',
      '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M9 6h14l8 8v20a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/><path d="M23 6v8h8" stroke-linejoin="round"/><path d="M13 23h14M13 28h9" stroke-linecap="round" stroke-opacity=".6"/></svg>',
      '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="20" cy="20" r="14"/><path d="M20 12v8l6 4" stroke-linecap="round"/></svg>'
    ];
    var s1 = el('section', 'gsec z',
      '<p class="eyebrow"><i class="dot"></i>What you get</p>' +
      '<h2 class="gh">Three days, and the pieces you keep.</h2>' +
      '<p class="gsub">Every session is live and recorded, and you finish with the working version of ' +
      esc(String(days[0] && days[0].title || '').split('|').join(' ').toLowerCase() || 'your plan') + '</p>' +
      '<div class="gcards">' + days.slice(0, 3).map(function (d, i) {
        return '<div class="gcard">' + ICONS[i % 3] + '<h4>' + esc(String(d.title).split('|').join(' ')) +
          '</h4><p>' + esc(d.outcome) + '</p></div>';
      }).join('') + '</div>');

    var s2 = el('section', 'gsec z',
      '<p class="eyebrow"><i class="dot"></i>The workbook</p>' +
      '<h2 class="gh">The workbook you fill in live.</h2>' +
      '<div class="gwork"><svg class="gart" viewBox="0 0 420 260" aria-hidden="true">' +
      '<rect x="24" y="18" width="372" height="224" rx="14" fill="var(--glass-hi)" fill-opacity=".7"/>' +
      '<g fill="none" stroke="var(--ink)" stroke-opacity=".18" stroke-width="1.2">' +
      '<path d="M56 62h300M56 86h300M56 110h230M56 158h300M56 182h300M56 206h180"/></g>' +
      '<g fill="none" stroke="var(--accent)" stroke-opacity=".55" stroke-width="1.6" stroke-linecap="round">' +
      '<path d="M56 40h96"/><path d="M56 136h74"/><path d="M300 104c14 6 28 2 34-8"/></g>' +
      '<g fill="var(--accent)" fill-opacity=".14"><rect x="248" y="150" width="108" height="64" rx="10"/></g>' +
      '<g fill="none" stroke="var(--ink)" stroke-opacity=".3" stroke-width="1.3" stroke-linecap="round">' +
      '<path d="M266 182l10 10 20-22"/></g></svg>' +
      '<ul class="glist">' + (LP.checks || []).slice(0, 4).map(function (c) {
        return '<li>' + TICK + '<span><b>' + esc(String(c.bold).replace(/[.:]+$/, '')) + '.</b> ' + esc(c.text) + '</span></li>';
      }).join('') + '</ul></div>');

    var FAQ = [
      ['Do I need anything before Day 1?', 'No. Bring one product line and an hour a day. Everything else is handed to you in the workbook.'],
      ['What if I cannot make a session live?', 'Every session is recorded and the replay lands in your inbox the same evening.'],
      ['Is this really free?', 'Yes. Three days, live with ' + FIRST + ', no card and no catch.'],
      ['Who is this for?', 'Anyone who wants ' + String(EV).toLowerCase() + ' finished rather than planned.']
    ];
    var s3 = el('section', 'gsec z',
      '<p class="eyebrow"><i class="dot"></i>Before you hold a seat</p>' +
      '<h2 class="gh">Questions people ask.</h2>' +
      '<div class="gfaq">' + FAQ.map(function (f) {
        return '<div><b>' + esc(f[0]) + '</b><p>' + esc(f[1]) + '</p></div>';
      }).join('') + '</div>');

    var s4 = el('section', 'gsec z',
      '<div class="gup"><div><h4>Keep going after the three days.</h4>' +
      '<p>Everyone who joins gets the option to carry on with ' + esc(BRAND) +
      ': the recordings, the filled-in workbook and the follow-up sessions, opened up on the last day.</p></div>' +
      '<span class="btn lg" data-reg="1" role="button" tabindex="0">See the upgrade' + ARROW + '</span></div>');

    [s1, s2, s3, s4].forEach(function (s) { inner.appendChild(s); });
    if (foot) P.insertBefore(wrap, foot); else P.appendChild(wrap);

    /* the lock: a slim bar floating over the blurred part, never a card */
    var mail = 'mailto:' + encodeURIComponent(S.reply_to || '') +
      '?subject=' + encodeURIComponent(S.subject || ('Unlock the full page for ' + BRAND)) +
      '&body=' + encodeURIComponent(S.body || '');
    var gate = el('div', '',
      '<div class="gbar"><img class="glock" src="img/lock.png" alt="">' +
      '<span class="gtx"><b>' + esc(S.gate_title || 'Unlock this full page') + '</b>' +
      '<small>' + esc(S.gate_hint || 'One reply is enough') + '</small></span>' +
      '<a class="btn sm sheen" data-noreg="1" href="' + mail + '">' + esc(S.gate_cta || 'Show me the full page') + ARROW + '</a></div>');
    gate.id = 'gate';
    document.body.appendChild(gate);
    return wrap;
  }

  /* the hosted page is the lead's finished page: no "concept" anywhere */
  function copy() {
    document.title = EV + (BRAND ? ' | ' + BRAND : '');
    var fine = $('fine'), cFine = $('cFine'), footL = $('footL'), chip = q('.cchip');
    if (fine) fine.textContent = 'Free. Three days live with ' + FIRST + '.';
    if (cFine) cFine.textContent = 'Free. Three days live with ' + FIRST + '. Your seat is held as soon as you sign up.';
    if (footL) footL.textContent = 'A free 3-day live event with ' + WHO + '. ' + WHEN_FULL + '.';
    if (chip) chip.textContent = 'Free event';
    var cH = $('cH');
    if (cH) cH.innerHTML = 'Join the free 3-day <span id="cEvent">' + esc(EV) + '</span>.';
  }

  /* ----------------------------------------------------------- 6. overlays */
  function modal() {
    var m = el('div', '');
    m.id = 'modal';
    m.innerHTML = '<div class="mbd" data-close="1"></div><div class="mcard" role="dialog" aria-modal="true" aria-label="Hold my seat">' +
      '<div class="mlive"><i class="pulse"></i>Registration open<span class="mclock">00:00:00:00</span></div>' +
      '<button class="mx" data-close="1" aria-label="Close">' +
      '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 3l8 8M11 3l-8 8"/></svg></button>' +
      '<div class="mtop"><span class="chip"><i class="pulse"></i>Live on Zoom</span>' +
      '<h3>Hold my seat for ' + esc(EV) + '.</h3>' +
      '<p class="mwhen">' + esc(WHEN_FULL) + '</p></div>' +
      '<div class="mseats"><div class="msrow"><b class="seatn">' + seatText() + '</b> people have their seat' +
      '<span class="msnote" style="margin-left:auto">' + comma(state.last24) + ' in the last 24 hours</span></div>' +
      '<div class="msbar"><i></i></div></div>' +
      '<form class="mform" novalidate>' +
      '<label><span>First name</span><input type="text" name="first" autocomplete="off" placeholder="' + esc(FIRST) + '"></label>' +
      '<label><span>Email address</span><input type="email" name="email" autocomplete="off" placeholder="you@example.com"></label>' +
      '<span class="btn lg sheen" data-submit="1" role="button" tabindex="0">Hold my seat' + ARROW + '</span></form>' +
      '<ul class="mticks"><li>' + TICK + 'Free to join</li><li>' + TICK + 'Replays for every session</li><li>' + TICK + 'Leave any time</li></ul>' +
      '<div class="mfoot"><span class="av"><img src="' + esc(S.avatar || 'img/headshot.jpg') + '" alt=""></span>' +
      '<span><b>Hosted by ' + esc(WHO) + '</b><small>' + esc(LP.role || BRAND) + '</small></span></div></div>';
    document.body.appendChild(m);

    function close() { m.classList.remove('on'); document.body.classList.remove('modalopen'); }
    function open() {
      m.classList.add('on');
      document.body.classList.add('modalopen');
      var bar = q('.msbar i', m);
      if (bar) { bar.style.width = '0'; setTimeout(function () { bar.style.width = clamp(state.seats / state.cap * 100, 10, 94).toFixed(1) + '%'; }, 60); }
    }
    m.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) close();
      if (e.target.closest('[data-submit]')) { e.preventDefault(); close(); }
    });
    q('form', m).addEventListener('submit', function (e) { e.preventDefault(); close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-reg]');
      if (!t && !e.target.closest('[data-noreg]')) {
        var b = e.target.closest('.btn');
        if (b && !b.closest('#modal') && !b.closest('#gate')) t = b;
      }
      if (t) { e.preventDefault(); open(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var t = document.activeElement;
      if (t && t.matches && t.matches('[data-reg]')) { e.preventDefault(); open(); }
    });
    return { open: open, close: close, node: m };
  }

  function toast() {
    var t = el('div', '');
    t.id = 'toast';
    t.innerHTML = '<span class="fav"></span><span class="tt"><b></b> <span>just registered</span><small></small></span>';
    document.body.appendChild(t);
    var i = 0;
    function show() {
      var n = NAMES[i % NAMES.length], mins = 2 + (i * 3) % 11;
      i++;
      q('.fav', t).innerHTML = face(i + 2);
      q('.tt b', t).textContent = n;
      q('.tt small', t).textContent = mins + ' minutes ago';
      state.name = n;
      qa('.justreg').forEach(function (x) { x.innerHTML = '<b>' + esc(n) + '</b> just registered'; });
      t.classList.add('on');
      setTimeout(function () { t.classList.remove('on'); }, 5600);
    }
    setTimeout(function () { show(); setInterval(show, 12000); }, 4200);
  }

  function stickyVideo() {
    var cfg = S.sticky || {};
    var caps = [];
    (LP.days || []).slice(0, 3).forEach(function (d, i) {
      caps.push('Day ' + (i + 1) + ': <b>' + esc(String(d.title).split('|').join(' ').replace(/\.$/, '')) + '</b>');
    });
    caps.unshift('This is the <b>60 second version</b> of the three days.');
    caps.push('It is free, and it is live with <b>' + esc(FIRST) + '</b>.');

    var s = el('aside', '');
    s.id = 'stick';
    s.innerHTML = '<div class="svcard"><div class="svmedia">' +
      '<img src="' + esc(cfg.image || 'img/sticky.jpg') + '" alt="">' +
      '<button class="svx" aria-label="Close">' +
      '<svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3l8 8M11 3l-8 8"/></svg></button>' +
      '<span class="svmute"><svg width="11" height="11" viewBox="0 0 16 16" aria-hidden="true">' +
      '<path d="M2.5 6h2.6L8.6 3v10L5.1 10H2.5z" fill="currentColor"/>' +
      '<path d="M11 5.4a3.6 3.6 0 0 1 0 5.2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>Unmute</span>' +
      '<span class="svcap"></span><span class="svhint">Click here to unmute</span>' +
      '<span class="svbar"><i></i></span></div>' +
      '<span class="btn" data-reg="1" role="button" tabindex="0">Hold my seat</span></div>';
    document.body.appendChild(s);

    var cap = q('.svcap', s), i = 0, killed = false;
    function next() {
      cap.style.opacity = '0';
      setTimeout(function () { cap.innerHTML = caps[i % caps.length]; i++; cap.style.opacity = '1'; }, 300);
    }
    next(); setInterval(next, 3800);
    q('.svx', s).addEventListener('click', function () { killed = true; s.classList.remove('on'); });

    /* it appears once the hero is behind you and steps aside for the closing
       card and the lock bar, so it can never sit on top of a call to action */
    var closing = $('closing'), gatewrap = $('gatewrap');
    function tick() {
      if (killed) return;
      var past = window.pageYOffset > (($('hero') || {}).offsetHeight || 500) * 0.75;
      var block = false;
      [closing, gatewrap].forEach(function (n) {
        if (!n) return;
        var r = n.getBoundingClientRect();
        if (r.top < window.innerHeight - 40 && r.bottom > 0) block = true;
      });
      s.classList.toggle('on', past && !block);
    }
    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick);
    tick();
  }

  /* the lock bar fades in with the blurred part and grows as you scroll into it */
  function lockBar(wrap) {
    var gate = $('gate'), bar = q('.gbar', gate);
    if (!gate || !wrap) return;
    function tick() {
      var r = wrap.getBoundingClientRect(), vh = window.innerHeight;
      var inView = r.top < vh - 60 && r.bottom > 120;
      var p = clamp((vh - r.top) / (r.height + vh * 0.6), 0, 1);
      gate.classList.toggle('on', inView);
      document.body.classList.toggle('gateon', inView);
      bar.style.setProperty('--gk', (0.9 + p * 0.26).toFixed(3));
    }
    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick);
    tick();
  }

  /* the Day 1 slide on a laptop, under the booking card: the left column has to carry weight too */
  function heroSlide() {
    var left = q('.hleft'), book = q('.hbook');
    if (!left) return;
    var mac = el('div', 'hmac',
      '<div class="hmac-lid"><div class="hmac-scr"><img src="img/slide.jpg" alt="" loading="lazy">' +
      '<span class="hmac-glare"></span></div></div><div class="hmac-base"><span></span></div>' +
      '<p class="hmac-cap">' + esc(S.slide_caption || 'Day 1, on screen') + '</p>');
    left.insertBefore(mac, book ? book.nextSibling : null);
  }

  /* a quiet nudge at the end of the hero */
  function scrollCue() {
    var hero = $('hero');
    if (!hero) return;
    var cue = el('div', 'scue', '<span>Scroll</span>' +
      '<i><svg viewBox="0 0 24 24" width="15" height="15"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" ' +
      'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></i>');
    hero.appendChild(cue);
    addEventListener('scroll', function () {
      cue.classList.toggle('gone', scrollY > 220);
    }, {passive: true});
  }

  /* the registration ticker: a band of names moving under the hero, the page breathing */
  function nameTicker() {
    var hero = $('hero');
    if (!hero || S.ticker === false) return;
    var names = S.names || [], run = '';
    for (var i = 0; i < 12; i++) {
      var n = names[i % (names.length || 1)] || 'Maya';
      run += '<span class="tkitem"><i class="tkdot"></i><b>' + esc(n) + '</b> just registered' +
        '<em>' + ((i * 7) % 40 + 2) + ' minutes ago</em></span>';
    }
    var band = el('div', 'nticker', '<span class="tklive"><i></i>Live</span>' +
      '<div class="tktrack"><div class="tkrun">' + run + '</div><div class="tkrun" aria-hidden="true">' + run + '</div></div>');
    hero.parentNode.insertBefore(band, hero.nextSibling);
  }

  /* -------------------------------------------------- 7. clocks and tickers */
  function clocks() {
    var tiles = {}, mclock = null;
    qa('.tile').forEach(function (t) { tiles[t.getAttribute('data-u')] = q('b', t); });
    function tick() {
      mclock = mclock || q('.mclock');
      var ms = Math.max(0, START - new Date());
      var d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
      if (tiles.days) tiles.days.textContent = pad2(d);
      if (tiles.hrs) tiles.hrs.textContent = pad2(h);
      if (tiles.min) tiles.min.textContent = pad2(m);
      if (tiles.sec) tiles.sec.textContent = pad2(s);
      if (mclock) mclock.textContent = pad2(d) + ':' + pad2(h) + ':' + pad2(m) + ':' + pad2(s);
    }
    tick(); setInterval(tick, 1000);
  }

  function seatTicker() {
    function paint() {
      qa('.seatn').forEach(function (n) { n.textContent = seatText(); });
      qa('.last24').forEach(function (n) { n.textContent = '· ' + comma(state.last24) + ' registered in the last 24 hours'; });
      var note = q('#modal .msnote');
      if (note) note.textContent = comma(state.last24) + ' in the last 24 hours';
      var bar = q('#modal .msbar i');
      if (bar && q('#modal.on')) bar.style.width = clamp(state.seats / state.cap * 100, 10, 94).toFixed(1) + '%';
    }
    function bump() {
      state.seats += 1;
      state.last24 += 1;
      paint();
      setTimeout(bump, 7000 + Math.random() * 7000);
    }
    paint();
    setTimeout(bump, 6000);
  }

  /* --------------------------------------------- 8. layout engine (re-fits) */
  /* lp.js fits every display line to the 800px canvas (704 and 796 are baked
     into it) and never runs again. These are the same fitters against the real
     hosted column, plus a wrap fallback so a phone can never overflow. */
  function fitLines(el, colW, max, min) {
    if (!el || !el.children.length || colW < 40) return 0;
    el.classList.remove('wrapped');
    el.style.fontSize = '100px';
    var w = 0;
    [].forEach.call(el.children, function (s) { w = Math.max(w, s.scrollWidth); });
    if (!w) return 0;
    var size = 100 * colW / w;
    if (size < min) { el.classList.add('wrapped'); size = min; }
    size = Math.min(size, max);
    el.style.fontSize = size.toFixed(2) + 'px';
    return size;
  }
  function shrinkTo(el, colW, min) {
    if (!el || colW < 20) return;
    el.style.fontSize = '';
    var fs = parseFloat(getComputedStyle(el).fontSize);
    var guard = 0;
    while (el.scrollWidth > colW + 0.5 && fs > (min || 9) && guard++ < 200) {
      fs -= 0.5; el.style.fontSize = fs + 'px';
    }
  }
  var MARK0 = null;
  function rescaleMark(fsNow) {
    var mk = q('#headline .mark');
    if (!mk) return;
    if (!MARK0) {
      MARK0 = {
        w: parseFloat(mk.getAttribute('width')), h: parseFloat(mk.getAttribute('height')),
        fs: (window.LP_READY && window.LP_READY.headline_px) || fsNow
      };
      mk.setAttribute('viewBox', '0 0 ' + MARK0.w + ' ' + MARK0.h);
    }
    var k = fsNow / MARK0.fs, pad = fsNow * 0.3;
    mk.setAttribute('width', (MARK0.w * k).toFixed(1));
    mk.setAttribute('height', (MARK0.h * k).toFixed(1));
    mk.style.left = (-pad).toFixed(1) + 'px';
    mk.style.top = (-pad).toFixed(1) + 'px';
  }

  function scalePhone() {
    var vid = q('.hvid'), ph = $('iphone');
    if (!vid || !ph) return;
    var k = clamp(vid.clientWidth / 516, 0.3, 1.34);
    ph.style.transform = 'scale(' + k.toFixed(4) + ')';
    vid.style.height = Math.round(248 * k + 16) + 'px';
  }

  function statCols() {
    var bs = $('bstats');
    if (!bs) return;
    var n = (LP.stats || []).length || bs.children.length;
    var w = P.clientWidth, cols = n;
    if (w <= 760 && n > 2) cols = 2;
    if (w <= 380 && n > 2) cols = 2;
    bs.style.gridTemplateColumns = 'repeat(' + cols + ',minmax(0,1fr))';
    bs.style.rowGap = cols < n ? '30px' : '0';
    bs.classList.toggle('grid2', cols === 2 && n > 2);
  }

  function facts() {
    var box = $('facts'), fk = $('fk');
    if (!box || !fk || !FACTS_ONE) return;
    fk.innerHTML = FACTS_ONE;
    var one = q('.fkc', fk).scrollWidth;
    var room = box.clientWidth - 2 * parseFloat(getComputedStyle(box).paddingLeft || 0);
    if (one <= box.clientWidth - 40) {
      box.classList.add('still'); box.classList.remove('mq');
      fk.style.removeProperty('--mqs');
    } else {
      box.classList.remove('still'); box.classList.add('mq');
      fk.innerHTML = FACTS_ONE + FACTS_ONE;
      fk.style.setProperty('--mqs', Math.max(18, one / 55).toFixed(1) + 's');
    }
    void room;
  }

  /* ---- background: pattern, ghost objects and the calm mask, re-drawn wide */
  function L(x1, y1, x2, y2, w) {
    return '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke-width="' + w + '"/>';
  }
  var PAT = {
    grid: function (W, H, r) {
      var s = '', step = 60, ox = -Math.round(r() * step), oy = -Math.round(r() * step), x, y;
      for (x = ox; x < W + step; x += step) s += L(x, -4, x, H + 4, 2);
      for (y = oy; y < H + step; y += step) s += L(-4, y, W + 4, y, 2);
      return s;
    },
    dots: function (W, H, r) {
      var s = '<g fill="currentColor" stroke="none">', step = 24, ox = Math.round(r() * step), oy = Math.round(r() * step);
      for (var y = oy - step; y < H + step; y += step)
        for (var x = ox - step; x < W + step; x += step) s += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="1.9"/>';
      return s + '</g>';
    },
    ruled: function (W, H, r) {
      var s = '', step = 34, oy = r() * step;
      for (var y = oy; y < H; y += step) {
        var a = (r() - 0.5) * 2.4, b = (r() - 0.5) * 2.4;
        s += '<path d="M-6 ' + y.toFixed(1) + ' C ' + (W * 0.33).toFixed(0) + ' ' + (y + a).toFixed(1) +
          ' ' + (W * 0.67).toFixed(0) + ' ' + (y + b).toFixed(1) + ' ' + (W + 6).toFixed(0) + ' ' + (y + (a - b) / 2).toFixed(1) + '" stroke-width="1.5"/>';
      }
      return s + L(62, -4, 62, H + 4, 2.2) + L(68, -4, 68, H + 4, 1.3);
    },
    loops: function (W, H, r) {
      var s = '';
      for (var y0 = 180 + r() * 120; y0 < H + 200; y0 += 560 + r() * 160) {
        var a = 16 + r() * 6, bb = 34 + r() * 14, d = '', tilt = (r() - 0.5) * 16;
        for (var t = 0; t <= (W + 300) / a; t += 0.12) {
          var x = -150 + a * t - bb * Math.sin(t), y = y0 - bb * Math.cos(t) + Math.sin(t * 0.23) * 24;
          d += (t === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
        }
        s += '<path d="' + d + '" stroke-width="2.6" stroke-linejoin="round" transform="rotate(' + tilt.toFixed(1) + ' ' + (W / 2).toFixed(0) + ' ' + y0.toFixed(0) + ')"/>';
      }
      return s;
    },
    hatch: function (W, H) {
      var s = '';
      for (var y0 = 60; y0 < H; y0 += 520) {
        var right = (Math.round(y0 / 520) % 2 === 0), x0 = right ? W - 180 : -60;
        for (var k = 0; k < 26; k++) s += L(x0 + k * 9, y0, x0 + k * 9 - 150, y0 + 240, 1.4);
      }
      return s;
    },
    ui: function (W, H, r) {
      var s = '', step = 44, ox = Math.round(r() * step) + 0.25, oy = Math.round(r() * step) + 0.25;
      for (var x = ox - step; x < W + step; x += step)
        for (var y = oy - step; y < H + step; y += step)
          s += '<path d="M' + (x - 4).toFixed(1) + ',' + y.toFixed(1) + 'h8M' + x.toFixed(1) + ',' + (y - 4).toFixed(1) + 'v8" stroke-width="1.5"/>';
      for (var yy = 300; yy < H; yy += 620) {
        s += L(-4, yy, W + 4, yy, 1.5);
        for (var tx = 0; tx < W; tx += 11) s += L(tx, yy, tx, yy + (tx % 55 === 0 ? 12 : 6), 1.3);
      }
      return s;
    },
    blooms: function () { return ''; }
  };
  function drawPattern(W, H) {
    var svg = $('pattern');
    if (!svg) return;
    var r = rng(hash(LP.slug || 'lp')), inner = '';
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.style.height = H + 'px';
    String(LP.pattern || 'dots').split('+').forEach(function (k) { if (PAT[k]) inner += '<g>' + PAT[k](W, H, r) + '</g>'; });
    svg.innerHTML = '<g fill="none" stroke="currentColor" stroke-linecap="round">' + inner + '</g>';
  }
  function topOf(node) { return node.getBoundingClientRect().top - P.getBoundingClientRect().top; }
  function placeGhosts(W) {
    var box = $('ghosts'), G = LP.ghosts || [];
    if (!box) return;
    box.innerHTML = '';
    if (!G.length) return;
    var hero = $('hero'), fitc = $('fitc'), days = $('days');
    var mul = clamp(W / 800, 1, 1.7);
    var slots = [
      { edge: 'r', cy: topOf(hero) + hero.offsetHeight * 0.44, size: 520, rot: -7, crop: 0.40 },
      { edge: 'l', cy: topOf(fitc) + fitc.offsetHeight * 0.58, size: 500, rot: 8, crop: 0.42 },
      { edge: 'l', cy: topOf(days) + days.offsetHeight * 0.22, size: 520, rot: -6, crop: 0.46 }
    ];
    slots.forEach(function (sl, i) {
      var g = G[i % G.length], mx = Math.max(g.w, g.h), mn = Math.min(g.w, g.h);
      var s = sl.size * mul / mx;
      if (mn * s < 190 * mul) s = Math.min(190 * mul / mn, 700 * mul / mx);
      var target = (LP.ghost_stroke || 4.5);
      if (g.sw) {
        if (g.sw * s < target * 0.9) s = Math.min(target * 0.9 / g.sw, 760 * mul / mx);
        if (g.sw * s > target * 1.5) s = target * 1.5 / g.sw;
      }
      var w = g.w * s, h = g.h * s;
      var left = sl.edge === 'r' ? W - w * (1 - sl.crop) : -w * sl.crop;
      var holder = document.createElement('div');
      holder.innerHTML = g.svg;
      var node = holder.firstElementChild;
      if (!node) return;
      node.setAttribute('width', w.toFixed(1)); node.setAttribute('height', h.toFixed(1));
      node.style.left = left.toFixed(1) + 'px';
      node.style.top = (sl.cy - h / 2).toFixed(1) + 'px';
      node.style.transform = 'rotate(' + sl.rot + 'deg)';
      box.appendChild(node);
    });
  }
  function calmMask(W, H) {
    var k = Math.min(1, 0.10 / Math.max(LP.pat_op || 0.2, LP.ghost_op || 0.2));
    var pr = P.getBoundingClientRect(), holes = '', boxes = '';
    ['headline', 'fith', 'daysh'].forEach(function (id) {
      var n = $(id);
      if (!n) return;
      [].forEach.call(n.children, function (c) {
        var r = c.getBoundingClientRect();
        var x = r.left - pr.left - 14, y = r.top - pr.top - 8;
        var w = Math.max(c.scrollWidth, r.width) + 28, h = r.height + 16;
        var d = 'M' + x.toFixed(0) + ',' + y.toFixed(0) + 'h' + w.toFixed(0) + 'v' + h.toFixed(0) + 'h-' + w.toFixed(0) + 'z';
        holes += d; boxes += '<path d="' + d + '"/>';
      });
    });
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '">' +
      '<filter id="b" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="10"/></filter>' +
      '<g filter="url(#b)"><path fill-rule="evenodd" d="M-60,-60H' + (W + 60) + 'V' + (H + 60) + 'H-60z' + holes + '"/>' +
      '<g fill-opacity="' + k.toFixed(3) + '">' + boxes + '</g></g></svg>';
    var m = 'url("data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '")';
    ['pattern', 'ghosts'].forEach(function (id) {
      var n = $(id);
      if (!n) return;
      var st = n.style;
      st.webkitMaskImage = m; st.maskImage = m;
      st.webkitMaskSize = W + 'px ' + H + 'px'; st.maskSize = W + 'px ' + H + 'px';
      st.webkitMaskRepeat = 'no-repeat'; st.maskRepeat = 'no-repeat';
    });
  }
  function background() {
    var W = Math.round(P.clientWidth), H = Math.round(P.offsetHeight);
    drawPattern(W, H);
    placeGhosts(W);
    calmMask(W, H);
  }

  function layout() {
    var wide = P.clientWidth;
    scalePhone();
    statCols();

    var right = q('.hright'), h1 = $('headline');
    if (h1 && right) {
      var colW = (right.clientWidth || wide) - 2;
      var fs = fitLines(h1, colW, wide > 900 ? 80 : 62, 26);
      rescaleMark(fs);
    }
    var fith = $('fith'), fitc = $('fitc');
    if (fith && fitc) {
      var fw = Math.min(fitc.clientWidth - 8, 980);
      fitLines(fith, fw, 56, 22);
    }
    var daysh = $('daysh'), days = $('days');
    if (daysh && days) fitLines(daysh, Math.min(days.clientWidth - 8, 1000), 54, 22);
    var d1t = $('d1t');
    if (d1t) fitLines(d1t, d1t.parentNode.clientWidth - 4, 38, 20);
    qa('.dc .dt').forEach(function (n) { fitLines(n, n.parentNode.clientWidth - 56, 30, 18); });
    qa('.bs .n').forEach(function (n) { n.style.fontSize = ''; shrinkTo(n, n.parentNode.clientWidth - 16, 20); });
    qa('.pfn').forEach(function (n) { shrinkTo(n, n.parentNode.clientWidth, 11); });
    qa('.pfs').forEach(function (n) { shrinkTo(n, n.parentNode.clientWidth, 7.5); });
    var meName = $('meName'), photo = q('.photo');
    if (meName && photo) shrinkTo(meName, photo.clientWidth - 52, 12);
    fitNav();
    facts();
    background();
  }

  function fitNav() {
    var lock = q('.nav .lock'), nm = $('navEvent'), lw = q('.nav .lw');
    if (!lock || !nm || !lw) return;
    lw.classList.remove('two');
    nm.style.whiteSpace = '';
    nm.style.fontSize = '';
    var avail = lock.clientWidth - (q('.nav .cal') ? q('.nav .cal').offsetWidth + 11 : 45);
    var fs = parseFloat(getComputedStyle(nm).fontSize), guard = 0;
    while (nm.scrollWidth > avail + 0.5 && fs > 12 && guard++ < 60) { fs -= 0.25; nm.style.fontSize = fs + 'px'; }
    if (nm.scrollWidth > avail + 0.5) {          /* still long: two tidy lines, never an ellipsis */
      lw.classList.add('two');
      nm.style.fontSize = '13px';
    }
  }

  /* --------------------------------------------------------------- 9. boot */
  function ready(fn) {
    var done = false, v = window.LP_READY;
    function go() { if (done) return; done = true; fn(); }
    if (v) return go();
    try {
      Object.defineProperty(window, 'LP_READY', {
        configurable: true,
        get: function () { return v; },
        set: function (x) { v = x; setTimeout(go, 0); }
      });
    } catch (e) { /* fall through to the poll */ }
    var t0 = Date.now();
    (function poll() {
      if (done) return;
      if (v || window.LP_READY) return go();
      if (Date.now() - t0 > 9000) return go();
      setTimeout(poll, 50);
    })();
  }

  function start() {
    /* the base layer's compact passes are measured against the 800px canvas:
       they mean nothing here and fight the hosted padding */
    P.classList.remove('compact', 'compact2');
    var np = $('numprobe');
    if (np && np.parentNode) np.parentNode.removeChild(np);
    new MutationObserver(function () {
      var n = $('numprobe');
      if (n && n.parentNode) n.parentNode.removeChild(n);
    }).observe(P, { childList: true });

    copy();
    headerStack();
    heroLayout();
    restoreChecks();
    factsStrip();
    testimonial();
    scrollCue();
    nameTicker();
    var wrap = gated();

    modal();
    toast();
    stickyVideo();
    lockBar(wrap);
    clocks();
    seatTicker();

    layout();
    window.addEventListener('resize', debounce(layout, 140));
    window.addEventListener('load', function () { setTimeout(layout, 50); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(layout, 30); });
    setTimeout(layout, 400);
    setTimeout(function () { background(); window.SITE_READY = { w: P.clientWidth, h: P.offsetHeight }; }, 900);
  }

  ready(start);
})();
