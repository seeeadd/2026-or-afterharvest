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
  var THEME = S.skin ? S.skin.base_theme : S.theme;     /* a skin names its own base theme (or none) */
  if (THEME) document.body.classList.add('theme-' + String(THEME).replace(/[^a-z0-9-]/gi, ''));
  if (S.font_link) { var fl = document.createElement('link'); fl.rel = 'stylesheet'; fl.href = S.font_link; document.head.appendChild(fl); }

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

  var TZ = S.time_zone || 'America/New_York';        /* the lead's clock (site.json / lead.json time_zone) */
  function tzOffset(tz, t) {                          /* minutes east of UTC in tz at instant t */
    try {
      var p = {};
      new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(t)).forEach(function (x) { p[x.type] = x.value; });
      return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - t) / 6e4;
    } catch (e) { return -new Date(t).getTimezoneOffset(); }
  }
  var START = (function () {
    var now = Date.now(), wall = new Date(now + tzOffset(TZ, now) * 6e4);
    var guess = Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth(), wall.getUTCDate() + Math.max(1, toNum(S.starts_in_days, 9)),
      toNum(S.start_hour, 12), 0, 0);
    var t = new Date(guess - tzOffset(TZ, guess) * 6e4);
    var sm = /^(\d{4})-(\d\d)-(\d\d)$/.exec(S.start_date || '');      /* a real date beats the rolling default while it is ahead */
    if (sm) { var sg = Date.UTC(+sm[1], +sm[2] - 1, +sm[3], toNum(S.start_hour, 12), 0, 0), st = new Date(sg - tzOffset(TZ, sg) * 6e4);
      if (st.getTime() > now) return st; }
    return isNaN(t.getTime()) ? new Date(Math.ceil(now / 864e5) * 864e5 + 9 * 864e5 + 16 * 36e5) : t;
  })();
  var WEBINAR = LP.format === 'webinar';          /* 1-day webinar lead: one session on START's day */
  var END = new Date(START.getTime() + (WEBINAR ? 60 * 6e4 : 2 * 864e5));

  /* every date on the page goes through here: one English format ("Thu Oct 8"), never the visitor's locale order,
     and never "Invalid Date" (a bad start_hour or starts_in_days falls back to 12:00, 9 days out) */
  function dparts(d) {
    var o = {};
    try {
      new Intl.DateTimeFormat('en-US', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ })
        .formatToParts(d).forEach(function (x) { o[x.type] = x.value; });
    } catch (e) {
      o = { weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()], day: String(d.getDate()),
            month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()] };
    }
    return o;
  }
  function dfmt(d, withWeekday) {
    if (!(d instanceof Date) || isNaN(d.getTime())) return '';
    var o = dparts(d);
    return (withWeekday ? o.weekday + ' ' : '') + o.month + ' ' + o.day;
  }
  function tfmt(d) {
    try {
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ, timeZoneName: 'short' }).replace(/\s/g, ' ');
    } catch (e) { return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }).replace(/\s/g, ' '); }
  }
  function yours(d) {                                 /* "9:00 AM your time", only when the visitor's clock differs */
    try {
      var mine = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!mine || tzOffset(mine, d.getTime()) === tzOffset(TZ, d.getTime())) return '';
      return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }).replace(/\s/g, ' ') + ' your time';
    } catch (e) { return ''; }
  }
  function yoursHTML(d, cls) { var y = yours(d); return y ? '<small class="' + (cls || 'yt') + '">' + esc(y) + '</small>' : ''; }
  /* the lead's zone on every bare date too, "Oct 2 to Oct 4 PDT" (asked for 2026-09-23); times carry it already */
  var ZONE = (function () {
    try {
      return new Intl.DateTimeFormat('en-US', { timeZone: TZ, timeZoneName: 'short' }).formatToParts(START)
        .filter(function (x) { return x.type === 'timeZoneName'; })[0].value;
    } catch (e) { return ''; }
  })();
  function zoned(t) { return ZONE ? t + ' ' + ZONE : t; }
  var WHEN = S.when || (dfmt(START, true) + ' to ' + dfmt(END, true));
  var WHEN_FULL = WHEN + ' · ' + tfmt(START) + ' · Live online';
  /* the line under every call to action (asked for 2026-09-22) */
  var CTA_NOTE = S.cta_note || zoned('Free online challenge: ' + dfmt(START) + ' to ' + dfmt(END));

  var REG = null;                         /* the sign-up modal, once built */
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
  /* the three line-art marks: the takeaway route and the day rows both use them */
  var ART = [
      '<svg viewBox="0 0 120 92" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.4">' +
      '<rect x="10.5" y="8.5" width="64" height="75" rx="3"/><path d="M21 26h42M21 36h42M21 46h30"/>' +
      '<path d="M21 60h42M21 70h24" stroke-dasharray="3 4"/>' +
      '<rect x="63" y="40" width="46" height="34" rx="3" fill="var(--paper)"/>' +
      '<path d="M70 52h32M70 60h20"/><circle cx="101" cy="62" r="5"/></g></svg>',
      '<svg viewBox="0 0 120 92" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.4">' +
      '<rect x="8.5" y="14.5" width="46" height="30" rx="3"/><rect x="8.5" y="52.5" width="46" height="30" rx="3"/>' +
      '<rect x="64.5" y="14.5" width="46" height="30" rx="3"/><rect x="64.5" y="52.5" width="46" height="30" rx="3"/>' +
      '<path d="M16 26h20M16 33h14M72 26h20M72 33h10M16 64h20M16 71h12M72 64h20M72 71h16"/>' +
      '<path d="M96 60l5 5 9-10" stroke-width="2"/></g></svg>',
      '<svg viewBox="0 0 120 92" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.4">' +
      '<path d="M12 22h62M12 34h62M12 46h40"/><rect x="10.5" y="10.5" width="65" height="48" rx="3"/>' +
      '<path d="M30 70h60M30 80h38"/><circle cx="20" cy="70" r="3.4"/><circle cx="20" cy="80" r="3.4"/>' +
      '<path d="M86 30l10 10 18-20" stroke-width="2"/></g></svg>'
  ];

  /* the lead's own mark: the initials of their brand, set in their display face on their accent. Every
     lead has a brand name, so every lead gets a logo, and the favicon is built from the same letters. */
  function initials(name) {
    var skip = { to: 1, and: 1, the: 1, of: 1, for: 1, a: 1, at: 1, in: 1, on: 1, with: 1, by: 1, '&': 1 };
    var w = String(name || '').replace(/[^A-Za-z0-9&\s]/g, ' ').split(/\s+/).filter(Boolean)
      .filter(function (x) { return !skip[x.toLowerCase()]; });
    if (!w.length) return '';
    return w.map(function (x) { return x.charAt(0).toUpperCase(); }).join('').slice(0, 3);
  }
  /* the lead's own logo beside their name: the real one when a person saved it, their monogram otherwise */
  function hostMark() {
    var cap = q('.fitgrid .me figcaption'), nm = $('meName');
    if (!cap || !nm || q('.melogo', cap)) return;
    var m = S.monogram || initials(LP.brand || BRAND);
    var html = S.logo ? '<span class="melogo real"><img src="' + esc(S.logo) + '" alt=""></span>'
      : '<span class="melogo">' + emblemSVG(1.7) + '</span>';
    if (!html) return;
    cap.insertAdjacentHTML('afterbegin', html);
    cap.classList.add('haslogo');
  }
  function brandMark() {
    var cal = q('.nav .cal'), m = S.monogram || initials(LP.brand || BRAND);
    if (!cal || !m) return;
    /* the lead's own photo favicon (favicon.png, the framed 512) is the sticky header's icon; the drawn emblem is the
       fallback when the file is not there (Sean 2026-09-29: "use their custom favicons as icons on the sticky header") */
    cal.innerHTML = '<span class="bmark favimg"><img src="favicon.png" alt="" width="44" height="44"></span>';
    var im = cal.querySelector('img');
    im.onerror = function () { cal.innerHTML = '<span class="bmark">' + emblemSVG(1.8) + '</span>'; };
  }

  /* a call to action in the reader's own words: the day's promise turned into the button. Built from the
     lead's own day titles, so no lead needs copy written by hand. */
  function ctaFor(title, i) {
    /* the whole day title as the button, or a plain "Hold my seat" line: a cut title left "Learn how to pick 3
       topics you can" and "Learn how to turn it" on the buttons (2026-09-29). Only a short title that opens on a
       verb reads as "Learn how to ..." */
    var t = String(title || '').split('|').join(' ').replace(/\s+/g, ' ').replace(/[.!?]+\s*$/, '').trim();
    var w = t ? t.split(' ') : [];
    if (w.length && w.length <= 6 && t.length <= 40 && phraseKind(t) === 'verb')
      return 'Learn how to ' + w[0].toLowerCase() + (w.length > 1 ? ' ' + w.slice(1).join(' ') : '');
    return i != null ? 'Hold my seat for Day ' + (i + 1) : 'Hold my seat';
  }
  /* is a lead's phrase a verb phrase ("pick one goal"), a noun phrase ("your real unit cost") or unknown? Generated
     sentences only splice a phrase whose kind is known, so no page reads "Day 1 starts on list what you read" or
     "by Day 3 you your hour a day" (2026-09-29) */
  var VERBS = ('add answer audit block book build choose clarify close collect craft create cut decide define design draft ' +
    'edit film find fix follow get grow identify land launch list lock make map name open outline package pick pitch plan ' +
    'post pre-sell prepare presell price protect publish put raise record rewrite run schedule score script sell send set ' +
    'shape ship sketch spot start stay test track turn understand use validate write learn leave walk see work build draw ' +
    'bring join go share show kill fill simplify replace swap stop tighten scan read reach ask earn grab hire invite ' +
    'match offer position refine reframe remove reset sort trim upgrade').split(' ');
  var NOUNISH = ('a an the your my our their one two three four five six seven ten every each this that these those ' +
    'day week month first last next new real simple clear').split(' ');
  function phraseKind(t) {
    var w0 = String(t || '').trim().split(/\s+/)[0] || '';
    w0 = w0.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!w0) return '';
    if (VERBS.indexOf(w0) > -1) return 'verb';
    if (NOUNISH.indexOf(w0) > -1 || /^\d/.test(w0)) return 'noun';
    return '';
  }
  function ctaBlock(label, note) {
    return '<div class="scta"><span class="btn lg" data-reg="1" role="button" tabindex="0">' +
      esc(label) + ARROW + '</span>' +
      '<span class="sctan">' + esc(CTA_NOTE) + '</span></div>';
  }

  /* the lead's own subject, drawn once and worn by every primary action. Matched from words the lead
     already gave us (brand, event, eyebrow tags, audience), so no lead needs an icon picked by hand. */
  var ICONS = {
    /* wholesale: her whole line is "your products belong in more stores", so the mark is a shopfront with
       a parcel under the awning, not a generic carton */
    box: '<path d="M5 8.6h14l1 11.1a1.7 1.7 0 0 1-1.7 1.9H5.7A1.7 1.7 0 0 1 4 19.7z" fill="currentColor" ' +
      'fill-opacity=".26" stroke="none"/>' +
      '<path d="M5 8.6h14l1 11.1a1.7 1.7 0 0 1-1.7 1.9H5.7A1.7 1.7 0 0 1 4 19.7z"/>' +
      '<path d="M9 11V7.2a3 3 0 0 1 6 0V11"/>',
    people: '<circle cx="9.2" cy="8.2" r="3.2" fill="currentColor" fill-opacity=".28" stroke="none"/>' +
      '<circle cx="9.2" cy="8.2" r="3.2"/><path d="M3.3 19.4c.5-3.3 3-5.2 5.9-5.2s5.4 1.9 5.9 5.2"/>' +
      '<path d="M16.2 5.9a3.1 3.1 0 0 1 0 6.2M17.5 14.9c2.1.7 3.4 2.3 3.7 4.5"/>',
    mic: '<rect x="9" y="3" width="6" height="10.6" rx="3" fill="currentColor" fill-opacity=".3" stroke="none"/>' +
      '<rect x="9" y="3" width="6" height="10.6" rx="3"/>' +
      '<path d="M5.5 11.6a6.5 6.5 0 0 0 13 0M12 18.1V21M9.1 21h5.8"/>',
    mail: '<path d="M3.6 6.6h16.8L12 12.9z" fill="currentColor" fill-opacity=".3" stroke="none"/>' +
      '<rect x="2.8" y="5.2" width="18.4" height="13.6" rx="2.4"/><path d="m3.6 6.6 8.4 6.3 8.4-6.3"/>',
    book: '<path d="M12 6.9a2.6 2.6 0 0 0-2-2.5H4v13h6a2.2 2.2 0 0 1 2 1.5z" fill="currentColor" ' +
      'fill-opacity=".28" stroke="none"/><path d="M4 4.4h6a2.6 2.6 0 0 1 2 2.5v12a2.2 2.2 0 0 0-2-1.5H4z"/>' +
      '<path d="M20 4.4h-6a2.6 2.6 0 0 0-2 2.5v12a2.2 2.2 0 0 1 2-1.5h6z"/><path d="M15.4 8.4h2.8M15.4 11.6h2.8"/>',
    tag: '<path d="M11.2 3.2H20v8.8l-8.6 8.6a1.6 1.6 0 0 1-2.3 0l-6.5-6.5a1.6 1.6 0 0 1 0-2.3z" ' +
      'fill="currentColor" fill-opacity=".28" stroke="none"/>' +
      '<path d="M11.2 3.2H20v8.8l-8.6 8.6a1.6 1.6 0 0 1-2.3 0l-6.5-6.5a1.6 1.6 0 0 1 0-2.3z"/>' +
      '<circle cx="16.2" cy="7.8" r="1.6"/>',
    pen: '<path d="M14.6 4.6 19.4 9.4 8.8 20H4v-4.8z" fill="currentColor" fill-opacity=".26" stroke="none"/>' +
      '<path d="M14.6 4.6 19.4 9.4 8.8 20H4v-4.8z"/><path d="m13 6.2 4.8 4.8M4 20l3.4-1.2"/>',
    camera: '<circle cx="12" cy="13" r="3.8" fill="currentColor" fill-opacity=".3" stroke="none"/>' +
      '<rect x="2.8" y="6.6" width="18.4" height="12.6" rx="2.6"/><circle cx="12" cy="13" r="3.8"/>' +
      '<path d="M8.6 6.6 10 4.2h4l1.4 2.4"/>',
    seat: '<path d="M4.2 12h15.6l-.6 3.1A1.6 1.6 0 0 1 17.6 17H6.4a1.6 1.6 0 0 1-1.6-1.9z" ' +
      'fill="currentColor" fill-opacity=".3" stroke="none"/><path d="M6 20.4v-3.4M18 20.4v-3.4"/>' +
      '<path d="M4.8 17h14.4a1.6 1.6 0 0 0 1.6-1.9l-.6-3.1H4.2l-.6 3.1A1.6 1.6 0 0 0 5 17z"/>' +
      '<path d="M6.6 12V6.2A2.2 2.2 0 0 1 8.8 4h6.4a2.2 2.2 0 0 1 2.2 2.2V12"/>'
  };
  var ICONMAP = [
    ['box', 'wholesale retail retailer store shop stockist buyer product maker craft goods order shipping'],
    ['people', 'member membership community subscriber audience group circle club'],
    ['mic', 'podcast show episode audio interview voice'],
    ['mail', 'email newsletter list inbox subscriber mailing'],
    ['book', 'course curriculum lesson teach student class school workshop'],
    ['tag', 'price pricing margin profit money offer rate fee'],
    ['pen', 'design brand studio illustration art creative'],
    ['camera', 'photo photography film video shoot']
  ];
  function brandIconKey() {
    var hay = [LP.brand, EV, LP.role, S.audience, (LP.eyebrow || []).join(' ')].join(' ').toLowerCase();
    for (var i = 0; i < ICONMAP.length; i++) {
      var words = ICONMAP[i][1].split(' ');
      for (var j = 0; j < words.length; j++) if (hay.indexOf(words[j]) > -1) return ICONMAP[i][0];
    }
    return 'seat';
  }
  var BICON = '';
  /* the lead's mark: their subject drawn inside a brand tile. A graphic, not their initials. */
  function emblemSVG(stroke) {
    /* the mark is composed, not an icon: their subject, a broadcast arc that says this is live, and the
       3 of the three days set in their own display face on a disc. */
    return '<svg class="bglyph" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" ' +
      'stroke-width="' + (stroke || 1.7) + '" stroke-linecap="round" stroke-linejoin="round">' +
      ICONS[brandIconKey()] + '</svg>' +
      '<span class="b3"><b>3</b></span>';
  }
  function ctaIcons() {
    BICON = '<i class="bi" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + ICONS[brandIconKey()] + '</svg></i>';
    qa('#page .btn.lg, #stick .btn, .scta .btn').forEach(function (b) {
      if (q('.bi', b) || b.closest('#modal')) return;
      b.insertAdjacentHTML('afterbegin', BICON);
    });
  }

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
      '<span class="tblong"><b class="seatn">' + seatText() + '</b>+ already registered</span>' +
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
        '<span class="cdl"><i class="pulse"></i>Starts in</span>' +
        '<span class="cd">' +
        ['days', 'hrs', 'min', 'sec'].map(function (u) {
          return '<span class="tile" data-u="' + u + '"><b>00</b><small>' + u + '</small></span>';
        }).join('') + '</span>');
      nav.replaceChild(wrap, cd);
    }
    var cta = q('.btn.sm', nav);
    if (cta) { cta.classList.add('sheen'); cta.setAttribute('data-reg', '1'); cta.setAttribute('role', 'button'); cta.tabIndex = 0; }
    if (cta && !q('.hsoc', nav)) {         /* who is already in, next to the action it proves (2026-09-22) */
      cta.insertAdjacentHTML('beforebegin', '<span class="hsoc">' + avstack(3, 'sm') +
        '<span class="hsn"><b class="seatn">' + seatText() + '</b>+<small>joined</small></span></span>');
    }

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
      '<span class="hbtape">\u2605 Secure your free spot<b><i>\u00B7</i>Now</b></span>' +
      '<div class="hbgrid">' +
        '<div class="hblap"><span class="hbscr"><img src="img/slide.jpg" alt="" loading="lazy">' +
          '<i class="hbplay">' + PLAY + '</i></span><span class="hbfoot"></span></div>' +
        '<div class="hbmain">' +
          '<p class="hbjoin">Join the <em>free</em> 3-day ' + esc(EV) + '.</p>' +
          '<p class="hbwhen"><b>' + esc(WHEN) + '</b><span>' + esc(tfmt(START)) + ' \u00B7 Live' + yoursHTML(START) + '</span></p>' +
          '<span class="btn lg sq" data-reg="1" role="button" tabindex="0">Hold my seat' + ARROW + '</span>' +
        '</div>' +
      '</div>');
    left.appendChild(book);
    (function () {                    /* the tape belongs with the copy, not floating in the card's corner */
      var tape = q('.hbtape', book), main = q('.hbmain', book);
      if (tape && main) main.insertBefore(tape, main.firstChild);
      var grid = q('.hbgrid', book);
      if (grid) {                     /* flatten: slide, copy, action all on one row of the card */
        while (grid.firstChild) book.appendChild(grid.firstChild);
        grid.remove();
      }
      var btn = q('.btn.lg', book);
      if (btn && main && btn.parentNode === main) {   /* the action is a block, not a pill floating in a void */
        var act = el('div', 'hbact');
        book.appendChild(act); act.appendChild(btn);
        act.insertAdjacentHTML('beforeend', '<span class="hbfine">' + esc(CTA_NOTE) + '</span>');
      }
    })();

    right.appendChild(eye); right.appendChild(h1); right.appendChild(lede); right.appendChild(reg);
    if (stage && stage.parentNode) stage.parentNode.removeChild(stage);

    /* hero eyebrow becomes the coloured date pill */
    eye.innerHTML = '<i class="dot"></i>Free 3-day live event<i></i>' +
      '<b class="eyd"><span class="eyfull">' + esc(zoned(WHEN)) + '</span><span class="eyshort">' +
      esc(zoned(S.when || (dfmt(START) + ' to ' + dfmt(END)))) + '</span></b><i></i><span class="eyl">Live online</span>';

    /* registration card: social proof above the button */
    var proof = el('div', '',
      '<div class="rproof">' + avstack(6, 'sm') +
      '<span class="rrate">' + stars(5) + '<b>' + esc(state.rating) + '</b> average rating</span></div>' +
      '<div class="rseats"><b class="seatn">' + seatText() + '</b> people have their seat ' +
      '<em class="last24">· ' + comma(state.last24) + ' registered in the last 24 hours</em></div>' +
      '<div class="rlive"><i class="pulse"></i><span class="justreg"><b>' + esc(state.name) + '</b> just registered</span></div>');
    var rtop = q('.rtop', reg);
    if (rtop) rtop.remove();          /* the lead's podcast stat has nothing to do with holding a seat */
    rtop = null;
    var regBtn = q('.btn', reg);      /* proof belongs above the action, not under it */
    if (regBtn) reg.insertBefore(proof, regBtn); else reg.appendChild(proof);
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
    ul.innerHTML = LP.checks.slice(0, LP.fit_count || LP.checks.length).map(function (c, i) {
      var why = (S.check_why || [])[i] || '';
      return '<li><span class="ck">' + CHK + '</span><div><p><b>' +
        esc(String(c.bold).replace(/[.:]+$/, '')) + '.</b> ' + esc(c.text) + '</p>' +
        (why ? '<p class="ckwhy">' + esc(why) + '</p>' : '') + '</div></li>';
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
        '<figure class="tvid" style="background-image:url(' + ((t.image) || (S.faces && S.faces[2]) || '') + ')"><span class="tvplay">' + PLAY + '</span>' +
          '<span class="tvspeed"><b>1.2\u00D7</b><s>' + esc(t.length || '2 min 13 sec') + '</s>' +
            esc(t.short || '1 min 51 sec') + '</span>' +
          '<span class="tvbar"><i></i></span></figure>' +
        '<div class="tstbody">' +
          '<ol class="tsteps">' +
            '<li><span class="tsdot"></span><b>The challenge</b><p>' +
              esc(t.challenge || ('Plenty of work going out, no clear line from it to sales.')) + '</p></li>' +
            '<li><span class="tsdot on"></span><b>The result</b>' +
              '<h3>' + esc(t.result || 'A plan to run the week after.') + '</h3></li>' +
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
      '<p class="gsub">Every session is live and recorded, and each day ends with a finished piece you keep.</p>' +
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
      ['Do I need anything before Day 1?', prepAnswer()],
      ['What if I cannot make a session live?', 'Every session is recorded and the replay lands in your inbox the same evening.'],
      ['Is this really free?', 'Yes. Three days, live with ' + FIRST + ', no card and no catch.'],
      ['Who is this for?', 'Anyone who recognised themselves in the fit check. Bring the work you already have and leave with the next step done.']
    ];
    var s3 = el('section', 'gsec z',
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
    var LOCKSVG = '<svg class="glock" viewBox="0 0 32 32" aria-hidden="true">' +
      '<rect x="6.5" y="14" width="19" height="13.5" rx="3.2" fill="var(--accent)" fill-opacity=".14" ' +
      'stroke="var(--accent)" stroke-width="1.6"/>' +
      '<path d="M11 14v-3.4a5 5 0 0 1 10 0V14" fill="none" stroke="var(--ink)" stroke-opacity=".78" stroke-width="1.6" ' +
      'stroke-linecap="round"/>' +
      '<circle cx="16" cy="20" r="1.9" fill="var(--accent)"/>' +
      '<path d="M16 21.6v2.4" stroke="var(--accent)" stroke-width="1.6" stroke-linecap="round"/></svg>';
    var gate = el('div', '',
      '<div class="gbar"><span class="gstub">' + LOCKSVG + '</span>' +
      '<span class="gtx"><b>' + esc(S.gate_title || 'The rest of this page is ready') + '</b>' +
      '<small>' + esc(S.gate_hint || 'Reply to my email and I will open it') + '</small></span>' +
      '<button class="btn sm" data-noreg="1" type="button">' + esc(S.gate_cta || 'Open the full page') + ARROW + '</button></div>' +
      '<div class="gpanel" hidden><p class="gpt">' + esc(S.panel_title || 'Reply to the email I sent you') + '</p>' +
      '<p class="gpd">' + esc(S.panel_text || 'One line back is all it takes and I will open the rest of this page for you.') + '</p>' +
      '<div class="gprow"><code>' + esc(S.reply_to || '') + '</code>' +
      '<button class="gpcopy" type="button">Copy</button></div>' +
      '<a class="gpmail" href="' + mail + '">Or open it in your mail app</a>' +
      '<button class="gpx" type="button" aria-label="Close">\u2715</button></div>');
    gate.id = 'gate';
    document.body.appendChild(gate);
    var cta = q('.btn', gate), addr = S.reply_to || '', panel = q('.gpanel', gate);
    var copy = function (btn) {
      try { navigator.clipboard && navigator.clipboard.writeText(addr); } catch (e) {}
      if (btn) { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = 'Copy'; }, 2200); }
    };
    if (cta) cta.addEventListener('click', function () {
      panel.hidden = false;
      requestAnimationFrame(function () { panel.classList.add('on'); });
      copy(q('.gpcopy', panel));
    });
    q('.gpcopy', panel).addEventListener('click', function () { copy(this); });
    q('.gpx', panel).addEventListener('click', function () {
      panel.classList.remove('on');
      setTimeout(function () { panel.hidden = true; }, 220);
    });
    /* position and scale are handled by lockBar() */
    return wrap;
  }

  /* the hosted page is the lead's finished page: no "concept" anywhere */
  function copy() {
    document.title = EV + (BRAND ? ' | ' + BRAND : '');
    var fine = $('fine'), cFine = $('cFine'), footL = $('footL'), chip = q('.cchip');
    if (fine) fine.textContent = CTA_NOTE;
    if (cFine) cFine.textContent = CTA_NOTE;
    if (footL) footL.textContent = 'A free 3-day live event with ' + WHO + '. ' + WHEN_FULL + '.';
    if (chip) chip.textContent = 'Free event';
    var cH = $('cH');
    if (cH) cH.innerHTML = 'Join the free 3-day <span id="cEvent">' + esc(EV) + '</span>.';
  }

  /* ----------------------------------------------------------- 6. overlays */
  function modal() {
    var m = el('div', '');
    m.id = 'modal';
    /* the ticket, not a form in a white box: a stub carrying the event, a perforation, then the counterfoil
       you fill in. It is the same mark as the favicon, so the page and the tab agree on what a seat is. */
    m.innerHTML = '<div class="mbd" data-close="1"></div><div class="mcard" role="dialog" aria-modal="true" aria-label="Hold my seat">' +
      '<button class="mx" data-close="1" aria-label="Close">' +
      '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 3l8 8M11 3l-8 8"/></svg></button>' +

      '<div class="mstub">' +
        '<div class="msthead"><span class="mstb">' + esc(BRAND) + '</span><span class="mstone">Admit one</span></div>' +
        '<p class="mstk">Free seat</p>' +
        '<h3 class="mstev">' + esc(EV) + '</h3>' +
        '<p class="mstwhen"><b>' + esc(WHEN) + '</b><span>' + esc(tfmt(START)) + ' \u00B7 Live' + yoursHTML(START, 'ytw') + '</span></p>' +
        '<div class="mstwho"><span>Admit one</span><b class="mstname">Your name here</b></div>' +
        '<ul class="mstfacts"><li>Zoom, link by email</li><li>Free</li><li>Replay same day</li></ul>' +
        '<ol class="mstdays">' + (LP.days || []).slice(0, 3).map(function (d, i) {
          return '<li><b>Day ' + (i + 1) + '</b>' +
            esc(String(d.title).split('|').join(' ').replace(/\.$/, '')) + '</li>';
        }).join('') + '</ol>' +
        '<div class="mstseat"><span>Seat no.</span><b class="seatn">' + seatText() + '</b></div>' +
        '<div class="msbar"><i></i></div>' +
        '<p class="mstnote">' + comma(state.last24) + ' taken in the last 24 hours</p>' +
        '<div class="mfoot"><span class="av"><img src="' + esc(S.avatar || 'img/headshot.jpg') + '" alt=""></span>' +
        '<span><b>Hosted by ' + esc(WHO) + '</b><small>' + esc(LP.role || BRAND) + '</small></span></div>' +
      '</div>' +

      '<div class="mbody">' +
        '<div class="mlive"><i class="pulse"></i>Registration open<span class="mclock">00:00:00:00</span>' +
        '<em class="mlivex">left</em></div>' +
        '<p class="mwhen">Fill this in and the Zoom link is on its way.</p>' +
        '<p class="mfocus"></p>' +
        '<form class="mform" novalidate>' +
        '<label><span>First name</span><input type="text" name="first" autocomplete="given-name" placeholder="Your first name"></label>' +
        '<label><span>Email address</span><input type="email" name="email" autocomplete="email" inputmode="email" placeholder="you@example.com"></label>' +
        '<label><span>Phone number</span><input type="tel" name="phone" autocomplete="tel" placeholder="Optional, for the reminder"></label>' +
        '<div class="mavail"><p class="mavq">I am available ' + esc(zoned(WHEN)) + ' to attend:</p><div class="mopts">' +
        ['Yes', 'No', 'Maybe'].map(function (o, i) {
          return '<label class="mopt"><input type="radio" name="avail" value="' + o.toLowerCase() + '"' +
            (i === 0 ? ' checked' : '') + '><span class="mdot"></span><em>' + o + '</em></label>';
        }).join('') + '</div></div>' +
        '<span class="btn lg sheen" data-submit="1" role="button" tabindex="0">Save my free seat' + ARROW + '</span></form>' +
        '<ul class="mticks"><li>' + TICK + 'Free to join</li><li>' + TICK + 'Replays for every session</li><li>' + TICK + 'Leave any time</li></ul>' +
      '</div></div>';
    document.body.appendChild(m);

    function close() { m.classList.remove('on'); document.body.classList.remove('modalopen'); }
    var body0 = q('.mbody', m).innerHTML;
    function ics() {
      var z = function (d) { return d.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, ''); };
      var end = new Date(START.getTime() + 60 * 6e4), n = (LP.days || []).length || 3;
      return { s: z(START), e: z(end), n: n, t: EV + ' (free, live with ' + WHO + ')', d: 'Live on Zoom. The link comes by email.' };
    }
    function done(first, email) {
      var c = ics();
      var file = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
        'DTSTART:' + c.s, 'DTEND:' + c.e, 'RRULE:FREQ=DAILY;COUNT=' + c.n, 'SUMMARY:' + c.t, 'DESCRIPTION:' + c.d,
        'END:VEVENT', 'END:VCALENDAR'].join('\r\n'));
      var g = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(c.t) +
        '&dates=' + c.s + '/' + c.e + '&recur=' + encodeURIComponent('RRULE:FREQ=DAILY;COUNT=' + c.n) +
        '&details=' + encodeURIComponent(c.d);
      m.classList.add('done');
      q('.mbody', m).innerHTML = '<div class="mdone"><span class="mdtick">' + TICK + '</span>' +
        '<p class="mdk">You are in</p><h3 class="mdh">Seat <b class="seatn">' + seatText() + '</b> is yours' +
        (first ? ', ' + esc(first) : '') + '.</h3>' +
        '<p class="mdp">The Zoom link is on its way' + (email ? ' to <b>' + esc(email) + '</b>' : '') + '. ' +
        'Put the three days in your calendar now so they do not get booked over.</p>' +
        '<div class="mdcal"><a class="btn lg" href="' + file + '" download="' + esc(LP.slug || 'event') + '.ics">Add to calendar' + ARROW + '</a>' +
        '<a class="mdg" href="' + g + '" target="_blank" rel="noopener">Google Calendar</a></div>' +
        '<p class="mdrep">' + TICK + 'Cannot make one live? Each day has a replay.</p>' +
        '<button type="button" class="mdclose" data-close="1">Back to the page</button></div>';
    }
    function nameOnTicket() {             /* the seat is theirs before they press anything */
      var f = q('form', m), b = q('.mstname', m); if (!f || !b) return;
      var v = f.first.value.trim();
      b.textContent = v || 'Your name here';
      b.parentNode.classList.toggle('filled', !!v);
    }
    function submit() {
      var f = q('form', m); if (!f) return;
      var first = f.first.value.trim(), email = f.email.value.trim(), ok = true;
      [[f.first, !!first], [f.email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)]].forEach(function (x) {
        x[0].parentNode.classList.toggle('bad', !x[1]); if (!x[1]) ok = false;
      });
      if (!ok) { (q('.bad input', f) || f.first).focus(); return; }
      done(first, email);
    }
    function open() {
      if (m.classList.contains('done')) { m.classList.remove('done'); q('.mbody', m).innerHTML = body0; wire(); }
      var cf = $('closing'), f = q('form', m);
      if (cf && f) {                      /* what they typed in the closing card comes with them */
        qa('input', cf).forEach(function (i) { if (i.value && f[i.name]) f[i.name].value = i.value; });
      }
      nameOnTicket();
      var fo = q('.mfocus', m);
      if (fo) { fo.innerHTML = state.focus ? 'Your focus: <b>' + esc(state.focus) + '</b>. We work on it live.' : ''; fo.classList.toggle('on', !!state.focus); }
      m.classList.add('on');
      document.body.classList.add('modalopen');
      setTimeout(function () { var f2 = q('form', m); if (f2) (f2.first.value ? (f2.email.value ? f2.phone : f2.email) : f2.first).focus({ preventScroll: true }); }, 80);
      var bar = q('.msbar i', m);
      if (bar) { bar.style.width = '0'; setTimeout(function () { bar.style.width = clamp(state.seats / state.cap * 100, 10, 94).toFixed(1) + '%'; }, 60); }
    }
    m.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) close();
      if (e.target.closest('[data-submit]')) { e.preventDefault(); e.stopPropagation(); submit(); }
    });
    function wire() {
      var f = q('form', m); if (!f) return;
      f.addEventListener('submit', function (e) { e.preventDefault(); submit(); });
      qa('input', f).forEach(function (i) { i.addEventListener('input', function () { i.parentNode.classList.remove('bad'); }); });
      if (f.first) f.first.addEventListener('input', nameOnTicket);
      var sb = q('[data-submit]', f);
      if (sb) sb.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); submit(); } });
    }
    wire();
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
    function finish(first, email) { m.classList.add('on'); document.body.classList.add('modalopen'); done(first, email); }
    return { open: open, close: close, node: m, finish: finish };
  }

  function stuck() {                       /* the lead's own fit-check problems as three chips; a tap opens the form */
    var reg = $('regcard'), c = (LP.checks || []).slice(0, 3).map(function (k) { return String(k.bold || '').replace(/[.:]$/, '').trim(); }).filter(Boolean);
    if (!reg || c.length < 2 || q('.hq')) return;
    var hq = el('div', 'hq', '<p class="hql">Where are you stuck right now?</p><div class="hqc">' +
      c.map(function (t) { return '<button type="button" class="hqb" data-reg="1">' + esc(t) + '</button>'; }).join('') + '</div>');
    reg.parentNode.insertBefore(hq, reg);
    hq.addEventListener('click', function (e) {
      var b = e.target.closest('.hqb'); if (!b) return;
      state.focus = b.textContent;
      qa('.hqb', hq).forEach(function (x) { x.classList.toggle('on', x === b); });
    }, true);
  }

  /* before they go: the people who cannot make the times still want the replays */
  function exitCatch() {
    var seen = false;
    try { seen = sessionStorage.getItem('xcatch') === '1'; } catch (e) {}
    if (seen || $('xcatch')) return;
    var t0 = Date.now(), c = el('div', ''); c.id = 'xcatch';
    c.innerHTML = '<div class="xcbd" data-xc="1"></div><div class="xccard" role="dialog" aria-label="Get the replays" data-noreg="1">' +
      '<button type="button" class="xcx" data-xc="1" aria-label="Close"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" ' +
      'stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 3l8 8M11 3l-8 8"/></svg></button>' +
      '<p class="xck">Before you go</p><h3 class="xch">Save your free seat. It takes ten seconds.</h3>' +
      '<p class="xcp">Three live days with ' + esc(FIRST) + ', ' + esc(dfmt(START) + ' to ' + dfmt(END)) + ' at ' + esc(tfmt(START)) +
        '. Bring your questions: the live sessions are where they get answered.</p>' +
      '<form class="xcf" novalidate><input type="email" name="email" autocomplete="email" inputmode="email" placeholder="you@example.com" aria-label="Email address">' +
      '<button type="submit" class="btn lg">Save my free seat' + ARROW + '</button></form>' +
      '<p class="xcfine">' + TICK + 'Can\u2019t make one day? You still get that day\u2019s replay.</p></div>';
    document.body.appendChild(c);
    function show() {
      if (seen || document.body.classList.contains('modalopen') || Date.now() - t0 < 8000) return;
      seen = true;
      try { sessionStorage.setItem('xcatch', '1'); } catch (e) {}
      c.classList.add('on');
    }
    function hide() { c.classList.remove('on'); }
    c.addEventListener('click', function (e) { if (e.target.closest('[data-xc]')) hide(); });
    q('form', c).addEventListener('submit', function (e) {
      e.preventDefault();
      var v = e.target.email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { e.target.email.classList.add('bad'); e.target.email.focus(); return; }
      hide();                               /* same seat, same confirmation, same calendar add as the main form */
      if (REG && REG.finish) REG.finish('', v);
    });
    document.addEventListener('mouseout', function (e) { if (!e.relatedTarget && e.clientY < 10) show(); });
    var lastY = window.pageYOffset, lastT = Date.now();
    addEventListener('scroll', function () {             /* phones: a quick flick back up after reading a while */
      var y = window.pageYOffset, now = Date.now(), v = (lastY - y) / Math.max(1, now - lastT);
      if (window.innerWidth <= 760 && y > 1500 && v > 2.4) show();
      lastY = y; lastT = now;
    }, { passive: true });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });
  }

  function dock() {
    if ($('dock')) return;
    var d = el('div', ''); d.id = 'dock';
    d.innerHTML = '<span class="dkw"><b>Free online challenge</b>' + esc(dfmt(START) + ' to ' + dfmt(END)) + ' \u00B7 ' + esc(tfmt(START)) + '</span>' +
      '<span class="btn" data-reg="1" role="button" tabindex="0">Hold my seat' + ARROW + '</span>';
    document.body.appendChild(d);
    var reg = $('regcard'), cl = $('closing'), queued = false;
    function tick() {
      queued = false;
      var vh = window.innerHeight, show = true;
      if (reg) show = reg.getBoundingClientRect().bottom < 0;
      if (cl) { var r = cl.getBoundingClientRect(); if (r.top < vh && r.bottom > 0) show = false; }
      if (document.body.classList.contains('gateon') || document.body.classList.contains('modalopen')) show = false;
      d.classList.toggle('on', show);
      document.body.classList.toggle('dockon', show);
    }
    addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(tick); } }, { passive: true });
    setTimeout(tick, 1200);
  }

  /* the closing card's fields were drawings of fields: they become inputs, and it says when (2026-09-22) */
  function closingForm() {
    var cf = $('closing'); if (!cf || q('input', cf)) return;
    var names = [['first', 'text', 'given-name', 'First name'], ['email', 'email', 'email', 'Email address']];
    qa('.form .field', cf).forEach(function (sp, i) {
      var d = names[i]; if (!d) return;
      var inp = document.createElement('input');
      inp.className = 'field'; inp.name = d[0]; inp.type = d[1]; inp.setAttribute('autocomplete', d[2]);
      inp.placeholder = d[3]; inp.setAttribute('aria-label', d[3]);
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); var b = q('.form .btn', cf); if (b) b.click(); } });
      sp.parentNode.replaceChild(inp, sp);
    });
    var t = q('.ctext', cf);
    if (t && !q('.cwhen', t)) t.insertAdjacentHTML('beforeend', '<p class="cwhen">' + esc(WHEN) + ' \u00B7 ' + esc(tfmt(START)) + ' \u00B7 Live on Zoom' + (yours(START) ? ' \u00B7 ' + esc(yours(START)) : '') + '</p>');
  }

  /* the bottom-left notice: who, where, what they did, how long ago, and whose page it is */
  function toast() {
    var cities = S.cities || ['Melbourne, AU', 'Austin, TX', 'Leeds, UK', 'Toronto, CA', 'Portland, OR',
                              'Dublin, IE', 'Brisbane, AU', 'Nashville, TN'];
    var surnames = S.surnames || ['D.', 'M.', 'R.', 'K.', 'B.', 'S.', 'T.', 'L.'];
    var t = el('div', '');
    t.id = 'toast';
    t.innerHTML =
      '<span class="tav"></span>' +
      '<div class="tbody"><p class="tline"><b></b><em></em></p>' +
      '<p class="tact">' + esc(S.toast_action || 'just grabbed their free spot!') + '</p>' +
      '<p class="tago"><i></i><span></span></p></div>' +
      '<span class="tsrc">' + esc(LP.brand || EV) + '</span>' +
      '<span class="tbar"><i></i></span>';
    document.body.appendChild(t);
    var i = 0;
    function show() {
      var hr = q('.hero');                /* past the hero it lands on the copy */
      if (hr && hr.getBoundingClientRect().bottom < 120) return;
      var n = NAMES[i % NAMES.length], sur = surnames[i % surnames.length];
      var city = cities[(i * 3) % cities.length], mins = 2 + (i * 3) % 11;
      i++;
      q('.tav', t).textContent = (n.charAt(0) + sur.charAt(0)).toUpperCase();
      q('.tline b', t).textContent = n + ' ' + sur;
      q('.tline em', t).textContent = '\u00B7 ' + city;
      q('.tago span', t).textContent = mins + ' minutes ago';
      state.name = n;
      qa('.justreg').forEach(function (x) { x.innerHTML = '<b>' + esc(n) + '</b> just registered'; });
      t.classList.add('on');
      setTimeout(function () { t.classList.remove('on'); }, 6200);
    }
    setTimeout(function () { show(); setInterval(show, 12000); }, 4200);
  }

  function stickyVideo() {
    var cfg = S.sticky || {};
    var caps = [];
    (LP.days || []).slice(0, 3).forEach(function (d, i) {
      caps.push('Day ' + (i + 1) + ': <b>' + esc(String(d.title).split('|').join(' ').replace(/\.$/, '')) + '</b>');
    });
    caps.unshift('The <b>60 second version</b> of the three days.');
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
      '<span class="svcap"></span><span class="svhint">Tap for sound</span>' +
      '<span class="svbar"><i></i></span></div>' +
      '<span class="btn" data-reg="1" role="button" tabindex="0">Hold my seat</span></div>';
    document.body.appendChild(s);

    var cap = q('.svcap', s), i = 0, killed = false;
    function next() {
      cap.style.opacity = '0';
      setTimeout(function () { cap.innerHTML = caps[i % caps.length]; i++; cap.style.opacity = '1'; }, 300);
    }
    next(); setInterval(next, 3800);
    /* on a phone the card is a round bubble in the corner; a tap opens it, the x folds it back (2026-09-22) */
    /* the full card needs a free right margin; with no room (phones, most laptops) it is the round bubble */
    var small = { get matches() { return window.innerWidth <= 760; } };   /* the bubble is for phones only */
    function fit() {
      var W = window.innerWidth;
      if (W <= 760) { s.style.removeProperty('--svw'); return; }
      var right = 0;                       /* the card keeps its full shape and fits the free margin instead */
      qa('.d1, #d23, .tstin, #checks, .ccard, .fitgrid, .tkgrid, .faqlist').forEach(function (n) {
        right = Math.max(right, n.getBoundingClientRect().right);
      });
      s.style.setProperty('--svw', clamp(W - right - 20, 150, 198).toFixed(0) + 'px');
    }
    fit(); addEventListener('resize', debounce(fit, 150));
    /* closing folds the card into a bubble instead of killing it; a tap on the bubble opens it again */
    s.addEventListener('click', function (e) {
      if (!s.classList.contains('bub') || e.target.closest('.svx')) return;
      s.classList.remove('bub'); e.preventDefault(); e.stopPropagation();
    }, true);
    q('.svx', s).addEventListener('click', function (e) { e.stopPropagation(); s.classList.add('bub'); });

    /* it waits until the hero is behind you: in the hero it would sit on top of the register card.
       Below the hero it is always up, scrolling up or down, so it can never be lost mid page. */
    var hero = q('.hero'), armed = false;
    function tick() {
      if (killed) return;
      var past = true;
      if (hero) { var r = hero.getBoundingClientRect(); past = r.bottom < 90; }
      if (past) armed = true;
      /* once it has come up it stays up, all the way to the footer: scrolling back toward the hero used to
         take it away mid page (2026-09-23). It still waits for the first pass so it never lands on the
         register card on load. */
      s.classList.toggle('on', armed);
    }
    setTimeout(function () { tick(); addEventListener('scroll', tick, { passive: true });
      addEventListener('resize', tick); }, 1400);
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
      bar.style.setProperty('--gk', (0.9 + p * 0.2).toFixed(3));
      gate.style.setProperty('--gy', (8 + p * 30).toFixed(1) + 'vh');   /* climbs towards the middle */
      gate.style.setProperty('--gs', (1 + p * 0.16).toFixed(3));
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
    el.style.whiteSpace = 'nowrap';        /* measure each line unbroken, or a wrapping line reads as fitting */
    var w = 0;
    [].forEach.call(el.children, function (s) { w = Math.max(w, s.scrollWidth); });
    el.style.whiteSpace = '';
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
    /* fit the mark to the key phrase as it is now: lp.js can draw it before the lead's font has loaded, when
       the phrase is narrower, and scaling by font size alone then leaves it short and riding too high */
    var kw = q('#headline .kw'), pad = fsNow * 0.3;
    mk.setAttribute('preserveAspectRatio', 'none');
    if (kw && kw.offsetWidth) {
      mk.setAttribute('width', (kw.offsetWidth + 2 * pad).toFixed(1));
      mk.setAttribute('height', (kw.offsetHeight + 2 * pad).toFixed(1));
    } else {
      var k = fsNow / MARK0.fs;
      mk.setAttribute('width', (MARK0.w * k).toFixed(1));
      mk.setAttribute('height', (MARK0.h * k).toFixed(1));
    }
    mk.style.left = (-pad).toFixed(1) + 'px';
    mk.style.top = (-pad).toFixed(1) + 'px';
  }

  /* the hero device is drawn at PHONE_W x PHONE_H in lp.css and scaled to the column; keep the two in step */
  var PHONE_W = 516, PHONE_H = 340;
  function scalePhone() {
    var vid = q('.hvid'), ph = $('iphone');
    if (!vid || !ph) return;
    var k = clamp(vid.clientWidth / PHONE_W, 0.3, 2.2);  /* fill the column, do not stop at 1.34 */
    ph.style.transform = 'scale(' + k.toFixed(4) + ')';
    vid.style.height = Math.round(PHONE_H * k + 16) + 'px';
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
    if (one <= box.clientWidth - 40 || document.body.classList.contains('skin-facts-static')) {
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
      /* top left corner, above the video. On a phone the hero is one column and that corner is the headline,
         so the hero drawing is left out there and the other two carry the texture (2026-09-23) */
      { edge: 'l', cy: topOf(hero) + 96, size: 300, rot: -8, crop: 0.16, minW: 900 },
      { edge: 'l', cy: topOf(fitc) + fitc.offsetHeight * 0.58, size: 500, rot: 8, crop: 0.42 },
      { edge: 'l', cy: topOf(days) + days.offsetHeight * 0.22, size: 520, rot: -6, crop: 0.46 }
    ];
    slots.forEach(function (sl, i) {
      if (sl.minW && W < sl.minW) return;
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
    function clear(el, pad) {
      if (!el) return;
      var r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var px = pad || 14, x = r.left - pr.left - px, y = r.top - pr.top - 8;
      var w = Math.max(el.scrollWidth, r.width) + px * 2, h = r.height + 16;
      var d = 'M' + x.toFixed(0) + ',' + y.toFixed(0) + 'h' + w.toFixed(0) + 'v' + h.toFixed(0) + 'h-' + w.toFixed(0) + 'z';
      holes += d; boxes += '<path d="' + d + '"/>';
    }
    ['headline', 'fith', 'daysh'].forEach(function (id) {
      var n = $(id);
      if (n) [].forEach.call(n.children, function (c) { clear(c); });
    });
    /* the copy that carries the promise needs the same clear ground as the headlines */
    [$('lede'), q('.hq'), q('#intro'), q('.fitnote')].forEach(function (n) { clear(n, 18); });
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

  function headerFit() {                   /* the title never runs into the countdown: the faces step aside first */
    var nv = q('.hdr .nav'); if (!nv) return;
    nv.classList.remove('crowd');
    nv.style.removeProperty('--tfs');
    var tb = q('.lw b', nv), cw = q('.cdwrap', nv), hdr = q('.hdr');
    if (!tb || !cw || (hdr && hdr.classList.contains('tight'))) return;
    var fs = parseFloat(getComputedStyle(tb).fontSize), guard = 0;
    while (tb.scrollHeight > tb.clientHeight + 1 && fs > 13 && guard++ < 8) {   /* whole title in two lines: size down a little */
      fs -= 0.5; nv.style.setProperty('--tfs', fs + 'px');
    }
    if (tb.scrollHeight > tb.clientHeight + 1 ||
        (cw.offsetWidth && tb.getBoundingClientRect().right > cw.getBoundingClientRect().left - 6)) nv.classList.add('crowd');
  }
  function layout() {
    var wide = P.clientWidth;
    var TY = (SK && SK.type) || {};           /* skin type caps (skin.json "type"); empty for every other page */
    headerFit();
    scalePhone();
    statCols();

    var right = q('.hright'), h1 = $('headline');
    if (h1 && right) {
      var colW = (right.clientWidth || wide) - 2;
      var fs = fitLines(h1, colW, wide > 900 ? (+TY.h1 || 80) : wide > 760 ? (+TY.h1 || 62) : (+TY.h1_phone || 62), 26);
      rescaleMark(fs);
    }
    var fith = $('fith'), fitc = $('fitc'), daysh = $('daysh'), days = $('days');
    if (wide <= 760) {                     /* on a phone the section heads wrap to two balanced lines (CSS) */
      [fith, daysh].forEach(function (h) { if (h) { h.style.fontSize = ''; h.classList.add('wrapped'); } });
    } else {
      if (fith && document.body.classList.contains('skin-fit-split')) { fith.style.fontSize = ''; fith.classList.add('wrapped'); }
      else if (fith && fitc) fitLines(fith, Math.min((fith.clientWidth || fitc.clientWidth) - 8, 980), +TY.h2 || 56, 22);
      if (daysh && days) fitLines(daysh, Math.min((daysh.clientWidth || days.clientWidth) - 8, 1000), +TY.h2 || 54, 22);
    }
    var d1t = $('d1t');
    if (d1t) fitLines(d1t, d1t.parentNode.clientWidth - 4, +TY.h3 || 38, 20);
    qa('.dc .dt').forEach(function (n) { fitLines(n, n.parentNode.clientWidth - (TY.h3 ? 4 : 56), +TY.h3 || 30, 18); });
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

  /* ======================================================== 10. brand skin
     leads/<slug>/skin.json (optional) arrives as window.SITE.skin. No skin = today's page, untouched. Everything
     here is data driven: tokens become CSS variables, choices become body classes (skin-*), and the extra drawings
     (trust badge, day art, notes, rings) come from the small libraries below. Field reference: docs/brand-skin-log.md */
  var SK = S.skin && typeof S.skin === 'object' ? S.skin : null;
  function hexRGB(h) {
    h = String(h || '').trim().replace('#', '');
    if (h.length === 3) h = h.replace(/(.)/g, '$1$1');
    if (!/^[0-9a-f]{6}$/i.test(h)) return null;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function rgba(h, a) { var c = hexRGB(h); return c ? 'rgba(' + c.join(',') + ',' + a + ')' : h; }
  function relLum(h) {
    var c = hexRGB(h); if (!c) return 0.5;
    return c.map(function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); })
      .reduce(function (s, v, k) { return s + v * [.2126, .7152, .0722][k]; }, 0);
  }
  function fam(f, fb) { return f && f.family ? '"' + f.family + '", ' + fb : ''; }
  var SKDARK = false;
  function skinTokens() {
    if (!SK) return;
    var c = SK.colors || {}, f = SK.fonts || {}, sh = SK.shape || {}, r = document.body.style, B = document.body.classList;
    SKDARK = c.ground ? relLum(c.ground) < 0.2 : !!SK.dark;
    B.add('skin', 'skin-' + (SKDARK ? 'dark' : 'light'));
    if (SK.name) B.add('skin-' + String(SK.name).replace(/[^a-z0-9-]/gi, ''));
    var set = function (k, v) { if (v != null && v !== '') r.setProperty(k, v); };
    /* colours: the lead's sampled hexes, and the derived tokens lp.css reads */
    var ground = c.ground, ink = c.ink, mute = c.mute, acc = c.accent;
    set('--ground', ground); set('--ink', ink); set('--cap-ink', ink);
    if (mute) { set('--muted', mute); set('--cap-muted', mute); set('--ink-soft', 'color-mix(in srgb,' + ink + ' 62%,' + mute + ')'); }
    if (c.line) { set('--hair', c.line); set('--hair-2', 'color-mix(in srgb,' + c.line + ' 60%,' + (ink || '#888') + ' 12%)'); }
    else if (ink) { set('--hair', rgba(ink, SKDARK ? .12 : .10)); set('--hair-2', rgba(ink, SKDARK ? .2 : .17)); }
    if (acc) {
      set('--accent', acc); set('--head-acc', c.accent_text || acc); set('--accent-text', c.accent_text || acc);
      set('--accent-10', rgba(acc, .13)); set('--accent-sh', rgba(acc, .5)); set('--accent-sh2', rgba(acc, .26));
      set('--pat', acc); set('--ghost', acc);
    }
    set('--accent-ink', c.accent_ink); set('--accent2', c.accent2);
    var panel = c.panel || (SKDARK ? 'color-mix(in srgb,' + ground + ' 94%,#fff)' : '#ffffff');
    set('--sk-panel', panel);
    ['--card', '--glass', '--glass-solid', '--glass-hi', '--field', '--cap-bg', '--strip'].forEach(function (k) { set(k, panel); });
    set('--well', c.well || (ink ? rgba(ink, .05) : null));
    set('--card-brd', c.line || (ink ? rgba(ink, .1) : null)); set('--glass-brd', c.line || (ink ? rgba(ink, .1) : null));
    set('--av-ring', ground);
    if (ground) {
      var spot = (SK.decor || {}).spot;
      set('--ground-paint', spot ? 'radial-gradient(48% 34% at 50% -4%,' + rgba(SKDARK ? '#ffffff' : (acc || ink), SKDARK ? .09 : .08) +
        ',transparent 72%),' + ground : ground);
      set('--wall', ground);
    }
    set('--band', c.band || (SKDARK ? panel : (c.night || ink)));
    var bandInk = c.band_ink || (SKDARK ? ink : ground);
    set('--band-ink', bandInk); set('--band-ink-70', 'color-mix(in srgb,' + bandInk + ' 72%,transparent)');
    set('--band-ink-50', 'color-mix(in srgb,' + bandInk + ' 55%,transparent)'); set('--band-hair', 'color-mix(in srgb,' + bandInk + ' 14%,transparent)');
    set('--band-paint', 'none');
    set('--sk-tone', (SK.heading || {}).tone || mute || ink);
    set('--sk-note1', c.note1 || acc); set('--sk-note2', c.note2 || c.accent2 || acc);
    set('--sk-mark', (SK.heading || {}).mark_color || c.accent2 || acc);
    set('--sk-accent2', c.accent2 || acc);
    if (c.pill) { set('--sk-pill', c.pill); set('--sk-pill-ink', c.pill_ink || ink); B.add('skin-pill'); }   /* the hero date pill */
    if (c.chip) { set('--sk-chip', c.chip); set('--sk-chip-ink', c.chip_ink || '#ffffff'); B.add('skin-chip'); }
    /* type: display, body, label and the hand-note face */
    if (f.display) { set('--display', fam(f.display, 'Georgia, serif')); set('--dw', f.display.weight || 600); set('--dw2', f.display.weight2 || f.display.weight || 500);
      set('--sk-dtrack', f.display.tracking || '-.03em'); if (f.display['case'] === 'upper') B.add('skin-dupper'); }
    if (f.body) { set('--body', fam(f.body, 'system-ui, sans-serif')); set('--sk-bw', f.body.weight || 400); set('--sk-bw-b', f.body.bold || 600); }
    if (f.label) { set('--label', fam(f.label, 'system-ui, sans-serif')); set('--lw', f.label.weight || 600); set('--ltr', f.label.tracking || '.15em'); }
    if (f.note) set('--sk-note', fam(f.note, 'cursive'));
    /* shape: corners, edges and lift */
    if (sh.radius != null) {
      var R = +sh.radius;
      set('--r-lg', R + 'px'); set('--r-md', Math.round(R * .72) + 'px'); set('--r-sm', Math.round(R * .5) + 'px'); set('--sk-r', R + 'px');
    }
    var btn = sh.button || 'pill';
    set('--btn-r', btn === 'pill' ? '999px' : btn === 'square' ? '4px' : Math.round((+sh.radius || 12) * .6) + 'px');
    B.add('skin-btn-' + btn, 'skin-shadow-' + (sh.shadow || 'soft'), 'skin-border-' + (sh.border || 'hairline'));
    if (sh.shadow === 'flat') ['--sh1', '--sh2', '--lift', '--sh-dev', '--sh-dev-sm', '--sh-raise'].forEach(function (k) { set(k, 'none'); });
    if (sh.shadow === 'lifted') { set('--sh1', '0 1px 2px ' + rgba(ink || '#000', .05) + ',0 12px 32px -14px ' + rgba(ink || '#000', .22) + ',0 40px 80px -48px ' + rgba(ink || '#000', .3)); set('--sh2', 'var(--sh1)'); }
    /* the phone */
    var ph = SK.phone || {};
    set('--sk-bezel', ph.bezel); set('--sk-edge', ph.edge);
    if (ph.bezel || ph.edge) B.add('skin-phone');
    if (ph.style) B.add('skin-phone-' + ph.style);
    /* choices */
    var hd = SK.heading || {}, dec = SK.decor || {}, w = SK.widgets || {};
    if (hd.two_tone) B.add('skin-twotone');
    B.add('skin-mark-' + (hd.mark || 'keep'));
    if (dec.pattern === false) B.add('skin-nopattern');
    if (dec.grain === false) B.add('skin-nograin');
    if (dec.rings) B.add('skin-rings');
    if (dec.disc) { B.add('skin-disc'); set('--sk-disc', dec.disc); }
    if (w.toast === false) B.add('skin-notoast');
    if (w.joined === false) B.add('skin-nojoined');
    if (w.rating === false) B.add('skin-norating');
    if (w.ticker === false) S.ticker = false;
    if (w.facts === false) B.add('skin-nofacts');
    B.add('skin-sticky-' + ((SK.sticky_video || {}).style || 'keep'));
    B.add('skin-close-' + ((SK.closing || {}).style || 'keep'));
    if ((SK.annotations || {}).on) B.add('skin-notes');
    if (SK.stars) set('--sk-star', SK.stars);
    if (dec.chips) B.add('skin-chips-' + dec.chips);
    var sdays = (SK.sections || {}).days || 'plain';
    B.add('skin-days-' + sdays);
    set('--sk-slab', c.night || (SKDARK ? panel : ink));
    set('--sk-days-bg', sdays === 'panel' ? panel : sdays === 'band' ? (c.days_band || c.band || ink) : 'transparent');
    /* ---- options from the hand-made pages (2026-09-29, docs/brand-skin-log.md "Hand-page options") */
    var dy = SK.days || {}, band = sdays === 'band';
    if (band) {
      set('--skd-ink', c.days_ink || '#ffffff');
      set('--skd-mute', c.days_mute || 'color-mix(in srgb,' + (c.days_ink || '#ffffff') + ' 84%,' + (c.days_band || c.band || ink) + ')');
      set('--skd-btn', c.days_button || c.accent2 || acc); set('--skd-btn-ink', c.days_button_ink || ink);
    }
    set('--skd-num', c.days_num || (band ? (c.accent2 || acc) : (c.accent_text || acc)));
    set('--skd-when', band ? (c.days_num || c.accent2 || acc) : (c.accent_text || acc));
    set('--skd-mask', band ? (c.days_band || c.band || ink) : sdays === 'panel' ? panel : (ground || '#fff'));
    if (dy.numerals) B.add('skin-num', 'skin-num-' + dy.numerals);
    if (dy.route) B.add('skin-route');
    if (dy.cta === false) B.add('skin-days-nocta');
    if (dy.keep === false) B.add('skin-days-nokeep');
    if ((SK.booking_card || {}).style === 'ticket') B.add('skin-ticket');
    var hd2 = SK.heading || {};
    set('--sk-uw', hd2.underline_color || hd2.mark_color || c.accent2 || acc);
    set('--sk-uw2', hd2.underline_color2 || c.accent2 || hd2.underline_color || acc);
    var art = SK.day_art || {};
    set('--sks-hl', art.highlight || hd2.mark_color || c.accent2 || acc);
    set('--sks-move', art.move || hd2.underline_color || acc);
    var pb = SK.photo_band || {};
    if (pb.style === 'duotone') {
      B.add('skin-duo');
      set('--skb-ground', pb.ground || ink); set('--skb-tint', pb.tint || acc);
      set('--skb-ink', pb.ink || '#ffffff'); set('--skb-num', pb.num || c.accent2 || '#ffffff');
      set('--skb-mute', pb.mute || 'color-mix(in srgb,' + (pb.ink || '#ffffff') + ' 80%,' + (pb.ground || ink) + ')');
      set('--skb-tag', pb.tag || c.accent2 || acc); set('--skb-tag-ink', pb.tag_ink || ink);
    }
    var cl = SK.closing || {};
    if (cl.style === 'pass') {
      set('--skp-main', cl.main || acc); set('--skp-main-ink', cl.main_ink || c.accent_ink || '#ffffff');
      set('--skp-stub', cl.stub || c.accent2 || acc); set('--skp-stub-ink', cl.stub_ink || ink);
      if (cl.bg) { set('--skp-bg', cl.bg); B.add('skin-close-band'); }
    }
    var hh = SK.header || {};
    if (hh.style) {
      B.add('skin-hdr', 'skin-hdr-' + hh.style);
      set('--skh-r', (hh.radius != null ? +hh.radius : (hh.style === 'solid' ? 4 : hh.style === 'soft' ? 24 : 16)) + 'px');
      set('--skh-w', (hh.width || 1080) + 'px');
      set('--skh-bg', hh.bg || acc); set('--skh-ink', hh.ink || (hh.style === 'solid' ? (c.accent_ink || '#ffffff') : ink));
      set('--skh-mute', hh.mute || (hh.style === 'solid' ? 'color-mix(in srgb,' + (hh.ink || c.accent_ink || '#ffffff') + ' 82%,' + (hh.bg || acc) + ')' : mute || ink));
      set('--skh-sec', hh.sec || (hh.style === 'solid' ? (c.accent2 || acc) : 'color-mix(in srgb,' + (c.accent2 || acc) + ' 26%,' + panel + ')'));
      set('--skh-sec-ink', hh.sec_ink || ink);
      set('--skh-btn', hh.button || acc); set('--skh-btn-ink', hh.button_ink || (hh.button ? ink : c.accent_ink));
      if (hh.logo_plate) B.add('skin-hdr-plate');
      if (hh.icon === 'round') B.add('skin-hdr-round');
      if (hh.icon === 'none') B.add('skin-hdr-noicon');
      if (hh.topbar === false) B.add('skin-hdr-notop');
    }
    skinTokens2(c, set, B, panel);
  }

  /* ---- hand-page options, second pass (2026-09-29, Kelsey Tonner side by side): trust block, nav links, sticky
     video and lock bar styles, section order, day rows, type scale, fit split, takeaway row, stacked closing form.
     Tokens and classes only; the elements are added in skinHand2(). */
  function skinTokens2(c, set, B, panel) {
    var ink = c.ink, acc = c.accent;
    var tb = SK.trust_badge || {};
    if (tb.art === 'block') {
      B.add('skin-tblock');
      set('--skt-bg', tb.bg || c.days_band || acc); set('--skt-ink', tb.ink || '#ffffff');
      set('--skt-eye', tb.eyebrow_color || c.accent2 || tb.ink || '#ffffff');
      set('--skt-sub', tb.sub_color || 'color-mix(in srgb,' + (tb.ink || '#ffffff') + ' 84%,' + (tb.bg || c.days_band || acc) + ')');
    }
    var sv = SK.sticky_video || {};
    if (sv.style === 'flat') {
      set('--skv-brd', sv.border || '#ffffff'); set('--skv-btn', sv.button || c.accent2 || acc);
      set('--skv-btn-ink', sv.button_ink || (sv.button || c.accent2 ? ink : c.accent_ink) || '#ffffff');
      set('--skv-bar', sv.bar || sv.button || c.accent2 || acc); set('--skv-r', (sv.radius != null ? +sv.radius : 12) + 'px');
    }
    var g = SK.gate || {};
    if (g.style === 'solid') {
      B.add('skin-gate-solid');
      set('--skg-bg', g.bg || ink); set('--skg-ink', g.ink || '#ffffff');
      set('--skg-mute', g.mute || 'color-mix(in srgb,' + (g.ink || '#ffffff') + ' 80%,' + (g.bg || ink) + ')');
      set('--skg-edge', g.edge || c.accent2 || acc); set('--skg-btn', g.button || c.accent2 || acc);
      set('--skg-btn-ink', g.button_ink || (g.button || c.accent2 ? ink : c.accent_ink) || '#ffffff');
      set('--skg-r', (g.radius != null ? +g.radius : 6) + 'px');
    }
    var se = SK.sections || {};
    if (se.tight) B.add('skin-tight');
    if (se.width) { B.add('skin-width'); set('--skw', (+se.width) + 'px'); }
    var dy = SK.days || {};
    if (dy.rows === 'left' || dy.rows === 'right') B.add('skin-rows-' + dy.rows);
    if (dy.lead_bold) B.add('skin-days-leadb');
    var ty = SK.type || {};
    if (ty.h1) { B.add('skin-type-h1'); set('--skt-h1', (+ty.h1) + 'px'); }
    if (ty.h1_phone) { B.add('skin-type-h1p'); set('--skt-h1p', (+ty.h1_phone) + 'px'); }
    if (ty.h2) set('--skt-h2', (+ty.h2) + 'px');
    if (ty.h2_phone) set('--skt-h2p', (+ty.h2_phone) + 'px');
    if (ty.h3) set('--skt-h3', (+ty.h3) + 'px');
    if (ty.lede) set('--skt-lede', (+ty.lede) + 'px');
    if (ty.body) set('--skt-body', (+ty.body) + 'px');
    if (ty.line) set('--skt-line', ty.line);
    if (ty.head_line) set('--skt-hl', ty.head_line);
    if (ty.h2 || ty.h2_phone) B.add('skin-type-h2');
    if (ty.h3) B.add('skin-type-h3');
    if (ty.lede) B.add('skin-type-lede');
    if (ty.body) B.add('skin-type-body');
    if (ty.line) B.add('skin-type-line');
    if (ty.head_line) B.add('skin-type-hl');
    var sh = SK.shape || {};
    if (sh.button_case === 'upper') { B.add('skin-btn-upper'); set('--skbt', sh.button_tracking || '.05em'); }
    var fit = SK.fit || {};
    if (fit.layout === 'split') {
      B.add('skin-fit-split');
      if (fit.bg) { B.add('skin-fit-bg'); set('--skf-bg', fit.bg); }
    }
    if (fit.portrait === false) B.add('skin-fit-noportrait');
    if (fit.note === false) B.add('skin-fit-nonote');
    if (fit.cta === false) B.add('skin-fit-nocta');
    if (fit.cards === 'boxed') B.add('skin-fit-boxed');
    if ((SK.takeaway || {}).layout === 'row') B.add('skin-tk-row');
    if ((SK.hero || {}).phone_order === 'media') B.add('skin-hero-media');
    if ((SK.booking_card || {}).phone) B.add('skin-book-phone');
    if ((SK.decor || {}).chips === 'boxed') B.add('skin-chips-boxed');
    if (fit.tick === 'arrow') B.add('skin-fit-arrow');
    if ((SK.booking_card || {}).bold) B.add('skin-ticket-bold');
    if (se.pad) { B.add('skin-pad'); set('--skpad', (+se.pad) + 'px'); }
    var da2 = SK.day_art || {};
    if (da2.card) { B.add('skin-art-card'); set('--sks-card', da2.card); }
    var cl = SK.closing || {};
    if (cl.form === 'stack') { B.add('skin-close-stack'); set('--skc-card', cl.card || '#ffffff'); }
    var ph = SK.phone || {};
    if (ph.play === 'square') B.add('skin-play-sq');
    var rc = SK.regcard || {};
    if (rc.top) { B.add('skin-reg-top'); set('--skr-top', rc.top === true ? acc : rc.top); }
    if (rc.bg) { B.add('skin-reg-bg'); set('--skr-bg', rc.bg); }
    var w = SK.widgets || {};
    if (w.facts === 'static') B.add('skin-facts-static');
    if (w.cue === false) B.add('skin-nocue');
    var pb = SK.photo_band || {};
    if (pb.bio_lead) B.add('skin-duo-biolead');
    if (pb.eyebrow_style === 'fill') B.add('skin-duo-eyefill');
    if (((SK.header || {}).nav_links || []).length) B.add('skin-navlinks');
    if ((SK.gated || {}).cards === 'band') B.add('skin-gcards-band');
  }

  /* ---- swipe / underline marks under a key phrase, drawn once, coloured from the skin */
  function markURI(kind, col) {
    var d = kind === 'underline'
      ? '<path d="M3 20 C 60 14, 140 12, 297 16" fill="none" stroke="' + col + '" stroke-width="5" stroke-linecap="round"/>'
      : '<path d="M4 18 C 60 9, 150 7, 296 12 L 294 26 C 190 22, 90 24, 6 28 Z" fill="' + col + '"/>';
    return 'url("data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 30" preserveAspectRatio="none">' + d + '</svg>') + '")';
  }

  /* ---- trust badge art: four originals, all drawn in currentColor + the accent */
  var BADGE = {
    rings: function (id) {
      return '<svg class="skbadge" viewBox="0 0 40 40" fill="none" stroke="currentColor" aria-hidden="true"><defs><pattern id="' + id + '" width="2.2" height="2.2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="2.2" stroke="currentColor" stroke-width=".45"/></pattern></defs>' +
        '<circle cx="20" cy="20" r="18.5" stroke-opacity=".35" stroke-width=".7"/><circle cx="20" cy="20" r="15.5" stroke-opacity=".8" stroke-width=".8" stroke-dasharray="1 1.6"/>' +
        '<circle cx="20" cy="20" r="11" stroke-width=".9"/><circle cx="20" cy="20" r="6" fill="url(#' + id + ')" stroke-width=".7"/><circle cx="20" cy="20" r="1.3" fill="currentColor" stroke="none"/></svg>';
    },
    medal: function () {
      return '<svg class="skbadge" viewBox="0 0 40 40" aria-hidden="true"><path d="M13 3h6l3 9h-6zM27 3h-6l-3 9h6z" fill="var(--sk-accent2)" opacity=".85"/>' +
        '<circle cx="20" cy="24" r="12" fill="var(--sk-mark)" stroke="currentColor" stroke-opacity=".35" stroke-width="1.2"/>' +
        '<circle cx="20" cy="24" r="8.4" fill="none" stroke="currentColor" stroke-opacity=".5" stroke-width="1" stroke-dasharray="1.4 1.8"/>' +
        '<path d="M20 18.6l1.7 3.4 3.7.5-2.7 2.6.7 3.7-3.4-1.8-3.3 1.8.6-3.7-2.7-2.6 3.8-.5z" fill="currentColor"/></svg>';
    },
    laurel: function () { return AWARD.replace('<svg ', '<svg class="skbadge" '); },
    star: function () {
      var p = '', n = 12;
      for (var i = 0; i < n * 2; i++) {
        var a = Math.PI * i / n - Math.PI / 2, rr = i % 2 ? 13.5 : 18;
        p += (i ? 'L' : 'M') + (20 + Math.cos(a) * rr).toFixed(1) + ' ' + (20 + Math.sin(a) * rr).toFixed(1);
      }
      return '<svg class="skbadge" viewBox="0 0 40 40" aria-hidden="true"><path d="' + p + 'Z" fill="var(--accent)"/>' +
        '<circle cx="20" cy="20" r="9.5" fill="none" stroke="var(--accent-ink)" stroke-opacity=".7" stroke-width="1"/>' +
        '<path d="M15.6 20.4l3 3 6-6.4" fill="none" stroke="var(--accent-ink)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
  };

  /* ---- day art: four original styles x three variants. Every stroke that should draw itself carries .dr;
     fills that fade in after the lines carry .hf. Texts come from the lead's own day bullets. */
  function dayBullets(i) {
    var b = ((S.day_bullets || [])[i] || ((LP.days || [])[i] || {}).bullets || []).slice(0, 3);
    return b.length ? b : [String(((LP.days || [])[i] || {}).outcome || '')].filter(Boolean);
  }
  function dayTitle(i) { return String(((LP.days || [])[i] || {}).title || '').split('|').join(' ').replace(/\s+/g, ' ').replace(/\.$/, '').trim(); }
  var ROMAN = ['I', 'II', 'III', 'IV'];
  function ring(cx, cy, r, extra) { return '<circle class="dr" pathLength="1" cx="' + cx + '" cy="' + cy + '" r="' + r + '" ' + (extra || '') + '/>'; }
  var DAYART = {
    engraved: function (i, v, id) {
      var h = '<defs><pattern id="' + id + 'h" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="3" stroke="currentColor" stroke-width=".55"/></pattern>' +
        '<pattern id="' + id + 'l" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><line x1="0" y1="0" x2="0" y2="5" stroke="currentColor" stroke-width=".4" stroke-opacity=".55"/></pattern></defs>';
      var g = ring(130, 130, 118, 'stroke-opacity=".14" stroke-width=".8"');
      if (v === 0) {                                  /* three circles, the overlap hatched */
        g += '<defs><clipPath id="' + id + 'a"><circle cx="130" cy="98" r="52"/></clipPath><clipPath id="' + id + 'b"><circle cx="100" cy="150" r="52"/></clipPath></defs>' +
          '<g class="hf" clip-path="url(#' + id + 'a)"><circle cx="100" cy="150" r="52" fill="url(#' + id + 'l)"/><circle cx="160" cy="150" r="52" fill="url(#' + id + 'l)"/></g>' +
          '<g class="hf" clip-path="url(#' + id + 'a)"><g clip-path="url(#' + id + 'b)"><circle cx="160" cy="150" r="52" fill="url(#' + id + 'h)"/></g></g>' +
          '<g stroke-width="1.1">' + ring(130, 98, 52) + ring(100, 150, 52) + ring(160, 150, 52) + '</g>' +
          '<g stroke-width=".6" stroke-opacity=".35">' + ring(130, 98, 47) + ring(100, 150, 47) + ring(160, 150, 47) + '</g>' +
          '<circle class="hf" cx="130" cy="133" r="2.4" fill="currentColor" stroke="none"/>';
      } else if (v === 1) {                           /* one idea radiating into seven */
        var rays = '';
        for (var k = 0; k < 72; k++) {
          var a = k / 72 * Math.PI * 2, r2 = k % 12 === 0 ? 90 : k % 3 === 0 ? 76 : 60;
          rays += 'M' + (130 + Math.cos(a) * 24).toFixed(1) + ' ' + (130 + Math.sin(a) * 24).toFixed(1) + 'L' + (130 + Math.cos(a) * r2).toFixed(1) + ' ' + (130 + Math.sin(a) * r2).toFixed(1);
        }
        g += ring(130, 130, 92, 'stroke-opacity=".35" stroke-width=".8"') + '<path class="hf" d="' + rays + '" stroke-opacity=".3" stroke-width=".55"/>';
        for (var j = 0; j < 7; j++) {
          var b = -Math.PI / 2 + j / 7 * Math.PI * 2, x = 130 + Math.cos(b) * 92, y = 130 + Math.sin(b) * 92;
          g += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="9" fill="var(--sk-artbg)" class="dr" pathLength="1"/>' +
            '<circle class="hf" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="5" fill="url(#' + id + 'h)" stroke-opacity=".5" stroke-width=".6"/>';
        }
        g += '<circle class="hf" cx="130" cy="130" r="17" fill="url(#' + id + 'h)" stroke-width="1.1"/>' + ring(130, 130, 22, 'stroke-opacity=".5" stroke-width=".6"');
      } else {                                        /* a dial with one hour hatched */
        var t = '';
        for (var q = 0; q < 96; q++) {
          var cq = -Math.PI / 2 + q / 96 * Math.PI * 2, big = q % 4 === 0, r0 = big ? 104 : 100, r3 = big ? 114 : 106;
          t += 'M' + (130 + Math.cos(cq) * r0).toFixed(1) + ' ' + (130 + Math.sin(cq) * r0).toFixed(1) + 'L' + (130 + Math.cos(cq) * r3).toFixed(1) + ' ' + (130 + Math.sin(cq) * r3).toFixed(1);
        }
        g += ring(130, 130, 98, 'stroke-opacity=".8" stroke-width="1.1"') + '<path class="hf" d="' + t + '" stroke-opacity=".5" stroke-width=".7"/>' +
          '<path class="hf" d="M130 130 L130 38 A92 92 0 0 1 153.8 41.1 Z" fill="url(#' + id + 'h)" stroke-width=".9"/>' +
          ring(130, 130, 58, 'stroke-opacity=".28" stroke-width=".6"') +
          '<path class="dr" pathLength="1" d="M130 130V60" stroke-width="1.3"/><path class="dr" pathLength="1" d="M130 130l30 30" stroke-width="1"/>' +
          '<circle class="hf" cx="130" cy="130" r="3.2" fill="currentColor" stroke="none"/>';
      }
      return '<div class="skart sk-engraved"><span class="ska">Day ' + (i + 1) + '</span><span class="skr">' + ROMAN[i] + '</span>' +
        '<svg viewBox="0 0 260 260" fill="none" stroke="currentColor" aria-hidden="true">' + h + g + '</svg></div>';
    },
    blueprint: function (i, v) {
      var b = dayBullets(i), g = '';
      if (v === 0) {                                  /* three nodes wired into one */
        var P = [[50, 60], [50, 150], [210, 105]];
        g = '<path class="dr" pathLength="1" d="M74 60 C 130 60, 130 105, 186 105"/><path class="dr" pathLength="1" d="M74 150 C 130 150, 130 105, 186 105"/>' +
          P.map(function (p, k) { return '<rect class="dr" pathLength="1" x="' + (p[0] - 24) + '" y="' + (p[1] - 18) + '" width="48" height="36" rx="6"/>' +
            '<text class="hf" x="' + p[0] + '" y="' + (p[1] + 5) + '" text-anchor="middle">' + (k < 2 ? '0' + (k + 1) : 'OUT') + '</text>'; }).join('') +
          '<circle class="hf" cx="130" cy="105" r="3" fill="currentColor"/>';
      } else if (v === 1) {                           /* a terminal running the day's steps */
        g = '<rect class="dr" pathLength="1" x="14" y="22" width="232" height="166" rx="8"/><path class="dr" pathLength="1" d="M14 44h232"/>' +
          '<circle class="hf" cx="28" cy="33" r="3" fill="currentColor"/><circle class="hf" cx="40" cy="33" r="3" fill="currentColor" fill-opacity=".5"/>';
        g += '</svg><div class="skterm">' + b.map(function (t, k) { return '<p style="--k:' + k + '"><b>$</b> ' + esc(String(t).toLowerCase()) + '</p>'; }).join('') +
          '<p class="skcur" style="--k:' + b.length + '"><b>$</b> <u></u></p></div><svg style="display:none">';
      } else {                                        /* bars that climb */
        var H = [34, 52, 48, 76, 98, 130];
        g = '<path class="dr" pathLength="1" d="M20 180h220M20 180V28"/>' + H.map(function (hh, k) {
          return '<rect class="hf" x="' + (36 + k * 34) + '" y="' + (180 - hh) + '" width="20" height="' + hh + '" rx="2" fill="currentColor" fill-opacity="' + (0.14 + k * 0.1).toFixed(2) + '" style="--k:' + k + '"/>';
        }).join('') + '<path class="dr" pathLength="1" d="M46 140 L80 124 L114 128 L148 100 L182 76 L216 44" stroke-width="2"/><circle class="hf" cx="216" cy="44" r="4.5" fill="currentColor"/>';
      }
      return '<div class="skart sk-blueprint"><span class="ska">Day ' + (i + 1) + '</span><span class="skr">' + esc(String(i + 1).length < 2 ? '0' + (i + 1) : i + 1) + '</span>' +
        '<svg viewBox="0 0 260 210" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true">' + g + '</svg></div>';
    },
    tiles: function (i, v) {
      var b = dayBullets(i), CK = '<svg viewBox="0 0 12 12"><path class="dr" pathLength="1" d="M2.5 6.2 5 8.6 9.6 3.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      var rows = b.map(function (t, k) {
        return '<div class="skrow"><span class="skcb' + (k === 0 ? ' on' : '') + '">' + (k === 0 ? CK : '') + '</span><span class="sktx">' + esc(t) + '</span>' +
          (k === 0 ? '<span class="skchip g">Day ' + (i + 1) + '</span>' : k === b.length - 1 ? '<span class="skchip">' + (v === 2 ? 'Sunday' : 'Next') + '</span>' : '') + '</div>';
      }).join('');
      var top = '';
      if (v === 0) top = '<div class="skuh">' + esc(dayTitle(i)) + '</div>';
      else if (v === 1) top = '<div class="sktimer"><span><small>Focus session</small><b class="sktm">25:00</b></span><span class="skctl"><i></i><i class="k">' + CK + '</i></span></div><div class="skprog"><b></b></div>';
      else top = '<div class="skweek">' + ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(function (d, k) {
        var ht = [24, 30, 18, 28, 0, 34, 20][k], tp = [10, 30, 8, 24, 0, 6, 36][k];
        return '<div>' + d + '<span class="skc">' + (ht ? '<em class="' + (k % 3 === 2 ? 'p' : '') + '" style="top:' + tp + 'px;height:' + ht + 'px"></em>' : '') + '</span></div>';
      }).join('') + '</div>';
      return '<div class="skart sk-tiles"><div class="skui">' + top + rows + '</div></div>';
    },
    stickers: function (i, v) {
      var b = dayBullets(i);
      var star = '<svg class="skst" viewBox="0 0 34 34"><path d="M17 3 L20.6 12.6 30.8 13 22.8 19.4 25.6 29.4 17 23.6 8.4 29.4 11.2 19.4 3.2 13 13.4 12.6Z" fill="var(--sk-mark)" stroke="var(--ink)" stroke-opacity=".5" stroke-width="1.6" stroke-linejoin="round"/></svg>';
      if (v === 0) return '<div class="skart sk-stickers v0">' + b.slice(0, 2).map(function (t, k) {
        return '<span class="sknote n' + k + '" style="--k:' + k + '">' + esc(t) + '</span>'; }).join('') + star + '</div>';
      if (v === 1) return '<div class="skart sk-stickers v1"><span class="skbig" style="--k:0"><small>Day</small><b>' + (i + 1) + '</b></span>' +
        '<span class="sknote n1" style="--k:1">' + esc(b[0] || dayTitle(i)) + '</span>' + star + '</div>';
      return '<div class="skart sk-stickers v2"><span class="skrib" style="--k:0">' + esc(dayTitle(i)) + '</span>' +
        b.slice(0, 3).map(function (t, k) { return '<span class="skcard" style="--k:' + (k + 1) + '"><i>' + (k + 1) + '</i>' + esc(t) + '</span>'; }).join('') + '</div>';
    },
    /* scenes (from Kelsey Tonner's hand page): one small picture of the day's work, in the brand's colours.
       Kind per day from day_art.scenes[i].kind, else variants: 0 page-fix, 1 thread, 2 route-year. Every text is a
       skin field, else the day's own title, bullets and outcome. Budgets: docs/brand-skin-log.md */
    scenes: function (i, v) {
      var sc = ((SK.day_art || {}).scenes || [])[i] || {}, b = dayBullets(i);
      var kind = sc.kind || ['page-fix', 'thread', 'route-year'][v] || 'page-fix';
      return (SCENE[kind] || SCENE['page-fix'])(i, sc, b);
    }
  };

  /* wrap a string into at most `max` lines of about `n` characters (never splits a word) */
  function wrapT(t, n, max) {
    var L = [], cur = '';
    String(t || '').split(/\s+/).filter(Boolean).forEach(function (w) {
      if (cur && (cur + ' ' + w).length > n) { L.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w;
    });
    if (cur) L.push(cur);
    if (L.length > max) L = L.slice(0, max - 1).concat([L.slice(max - 1).join(' ')]);
    return L;
  }
  function sceneHead(label, meta) {
    return '<div class="skscn-h"><b>' + esc(label) + '</b>' + (meta ? '<span>' + esc(meta) + '</span>' : '') + '</div>';
  }
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var SCENE = {
    /* before/after of one page: the old line struck through, the new one highlighted, the button slides up */
    'page-fix': function (i, sc, b) {
      var title = sc.title || dayTitle(i), before = sc.before || b[0] || '', after = sc.after || b[1] || b[0] || '';
      var btn = sc.button || 'Sign up', was = sc.was || 'was down here';
      var bl = wrapT(before, 36, 2), al = wrapT(after, 29, 2);
      var y0 = 157 + (bl.length - 1) * 17, ya = y0 + 28;
      var g = '<rect class="dr skl2" pathLength="1" x="6" y="6" width="428" height="250" rx="8"/><path class="dr skl1" pathLength="1" d="M6 32h428"/>' +
        '<circle class="hf skdot" cx="22" cy="19" r="4"/><circle class="hf skdot" cx="36" cy="19" r="4"/><circle class="hf skdot" cx="50" cy="19" r="4"/>' +
        '<text class="hf sktx sksm" x="70" y="23">' + esc(wrapT(title, 30, 1)[0]) + '</text>' +
        '<rect class="hf skph" x="22" y="46" width="268" height="84" rx="6"/><circle class="hf sksun" cx="244" cy="72" r="12"/>' +
        '<path class="hf skhill" d="M22 112c40-22 70-28 104-12s62 8 94-12 50-10 70 2v34a6 6 0 0 1-6 6H28a6 6 0 0 1-6-6z"/>' +
        '<path class="dr skl1 skwv" pathLength="1" d="M40 122c10-4 20-4 30 0s20 4 30 0M150 122c10-4 20-4 30 0s20 4 30 0"/>';
      bl.forEach(function (l, k) {
        var y = 157 + k * 17;
        g += '<text class="hf sktx skold" x="22" y="' + y + '">' + esc(l) + '</text>' +
          '<path class="dr skl1 skstrike" pathLength="1" d="M20 ' + (y - 4) + 'h' + Math.min(268, Math.round(l.length * 6.4) + 6) + '"/>';
      });
      al.forEach(function (l, k) {
        var y = ya + k * 24;
        g += '<rect class="hf skhl" x="20" y="' + (y - 15) + '" width="' + Math.min(290, Math.round(l.length * 8.3) + 8) + '" height="20" rx="2"/>' +
          '<text class="hf sktx skbig" x="23" y="' + y + '">' + esc(l) + '</text>';
      });
      var yl = Math.min(246, ya + al.length * 24 + 4);
      if (yl < 240) g += '<path class="dr skl1 skcl" pathLength="1" d="M22 ' + yl + 'h180' + (yl + 12 < 250 ? 'M22 ' + (yl + 12) + 'h120' : '') + '"/>';
      g += '<rect class="hf skghost" x="318" y="208" width="100" height="32" rx="6"/>' +
        '<text class="hf sktx skgtx" x="368" y="228" text-anchor="middle">' + esc(was) + '</text>' +
        '<path class="dr skl2 skmv" pathLength="1" d="M368 200V96M359 106l9-11 9 11"/>' +
        '<g class="skslide"><rect class="skbtnf" x="318" y="46" width="100" height="32" rx="6"/><text class="sktx skbtx" x="368" y="66.5" text-anchor="middle">' + esc(btn) + '</text></g>' +
        '<g class="hf skbadge"><circle cx="262" cy="19" r="10"/><text x="262" y="23" text-anchor="middle">1</text></g>' +
        '<g class="hf skbadge"><circle cx="300" cy="' + (ya - 6) + '" r="10"/><text x="300" y="' + (ya - 2) + '" text-anchor="middle">2</text></g>' +
        '<g class="hf skbadge"><circle cx="418" cy="46" r="10"/><text x="418" y="50" text-anchor="middle">3</text></g>';
      var aria = 'Before and after: ' + before + ', then ' + after + ', with the ' + btn + ' button moved up';
      return '<div class="skart sk-scene sk-pagefix">' + sceneHead(sc.label || 'Before and after', sc.meta || ('Day ' + (i + 1))) +
        '<svg class="skdg" viewBox="0 0 440 262" role="img" aria-label="' + esc(aria) + '">' + g + '</svg></div>';
    },
    /* an inbox: three items with timing chips, the open one drafts itself */
    thread: function (i, sc, b) {
      var items = (sc.items || b.map(function (t) { return { title: t }; })).slice(0, 3);
      var chips = sc.chips || ['Today', 'Tomorrow', 'Next week'], open = sc.open != null ? +sc.open : Math.min(1, items.length - 1);
      var it = items[open] || items[0] || { title: dayTitle(i) };
      var draft = sc.draft || String(((LP.days || [])[i] || {}).outcome || it.title || '');
      var W = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
      return '<div class="skart sk-scene sk-thread">' + sceneHead(sc.label || dayTitle(i), sc.meta || ('Day ' + (i + 1))) +
        '<div class="skinbox"><ul class="skil">' + items.map(function (x, k) {
          return '<li' + (k === open ? ' class="on"' : '') + '><b>' + esc(x.title || x) + '</b><span class="sktch">' + esc(x.when || chips[k] || '') + '</span></li>';
        }).join('') + '</ul>' +
        '<div class="skmail"><p class="skmh">' + esc(sc.draft_label || 'Draft') + ' · <b>' + esc(sc.subject || it.title || it) + '</b></p>' +
          '<p class="skbd"><span class="sksr">' + esc(draft) + '</span><span class="skty" aria-hidden="true">' + esc(draft) + '</span><span class="skcar" aria-hidden="true"></span></p>' +
          '<p class="skvoice"><svg width="30" height="16" viewBox="0 0 30 16" aria-hidden="true"><path d="M2 8h0M6 4v8M10 1v14M14 5v6M18 2v12M22 6v4M26 3v10" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>' + esc(sc.voice || 'Drafted live') + '</p></div></div>' +
        (sc.week ? '<div class="skwk"><b>' + esc(sc.week) + '</b><span class="sksq">' + W.map(function (d) { return '<i>' + d + '</i>'; }).join('') + '</span></div>' : '') +
        '</div>';
    },
    /* twelve months on one dotted route, pins drop on the gaps */
    'route-year': function (i, sc, b) {
      var X = [26, 61, 97, 132, 167, 202, 238, 273, 308, 344, 379, 414], Y = [138, 159, 163, 145, 122, 112, 124, 147, 163, 158, 136, 116];
      var gaps = (sc.gaps || [10, 7, 2]).slice(0, 3).map(function (m) { return clamp(Math.round(+m) || 0, 0, 11); });
      var d = 'M' + X[0] + ' ' + Y[0];
      for (var k = 1; k < 12; k++) { var mx = (X[k - 1] + X[k]) / 2; d += ' C' + mx + ' ' + Y[k - 1] + ' ' + mx + ' ' + Y[k] + ' ' + X[k] + ' ' + Y[k]; }
      var g = '<path class="hf skroute3" d="' + d + '"/>';
      for (var m = 0; m < 12; m++) {
        g += (gaps.indexOf(m) > -1 ? '<circle class="hf skgapr" cx="' + X[m] + '" cy="' + Y[m] + '" r="8"/>' : '<circle class="hf skstop" cx="' + X[m] + '" cy="' + Y[m] + '" r="5.5"/>') +
          '<text class="hf sktx skmo" x="' + X[m] + '" y="' + (Y[m] + 26) + '" text-anchor="middle">' + MONTHS[m] + '</text>';
      }
      gaps.forEach(function (m, k) {
        var x = X[m], y = Y[m];
        g += '<g class="skpin" style="--k:' + (k + 1) + '"><path d="M' + (x - 8) + ' ' + (y - 28) + 'L' + x + ' ' + (y - 12) + 'L' + (x + 8) + ' ' + (y - 28) + 'Z"/>' +
          '<circle cx="' + x + '" cy="' + (y - 36) + '" r="13"/><text x="' + x + '" y="' + (y - 31) + '" text-anchor="middle">' + (k + 1) + '</text></g>';
      });
      var call = wrapT(sc.call || ('Fix gap 1 first'), 22, 2), p1 = X[gaps[0] || 0], left = p1 > 230;
      var cx = left ? Math.max(16, p1 - 200) : Math.min(p1 + 40, 280), cy = 40;
      call.forEach(function (l, k) { g += '<text class="hf sktx skcall" x="' + cx + '" y="' + (cy + k * 18) + '">' + esc(l) + '</text>'; });
      var ax = left ? cx + Math.min(170, Math.round(Math.max.apply(null, call.map(function (l) { return l.length; })) * 7.6) + 8) : cx - 8;
      var py = Y[gaps[0] || 0] - 52;
      g += '<path class="dr skl2 skmv" pathLength="1" d="M' + ax + ' ' + (cy + 10) + 'C' + (left ? ax + 24 : ax - 24) + ' ' + (cy + 10) + ' ' + (p1 + (left ? -10 : 10)) + ' ' + (cy + 20) + ' ' + (p1 + (left ? -6 : 6)) + ' ' + py + '"/>' +
        '<path class="dr skl2 skmv" pathLength="1" d="M' + (p1 + (left ? -13 : -1)) + ' ' + (py - 8) + 'l' + (left ? 7 : 7) + ' 8 ' + (left ? 4 : -7) + ' ' + (left ? -11 : -8) + '"/>';
      var lg = sc.legend || ['On track', 'A gap to close'];
      g += '<circle class="hf skstop" cx="26" cy="232" r="5.5"/><text class="hf sktx sksm" x="38" y="236">' + esc(lg[0]) + '</text>' +
        '<circle class="hf skgapr" cx="176" cy="232" r="7"/><text class="hf sktx sksm" x="190" y="236">' + esc(lg[1]) + '</text>';
      var aria = 'Twelve months on one route with ' + gaps.length + ' gaps pinned: ' + gaps.map(function (m, k) { return (k + 1) + ' ' + MONTHS[m]; }).join(', ');
      return '<div class="skart sk-scene sk-year">' + sceneHead(sc.label || dayTitle(i), sc.meta || ('12 months, ' + gaps.length + ' gaps')) +
        '<svg class="skdg" viewBox="0 0 440 262" role="img" aria-label="' + esc(aria) + '">' + g + '</svg></div>';
    }
  };

  function skinDecor() {
    if (!SK) return;
    var B = document.body.classList, hd = SK.heading || {};
    skinFitTitle();
    /* key-phrase mark */
    if (hd.mark === 'swipe' || hd.mark === 'underline') {
      document.body.style.setProperty('--sk-swipe', markURI(hd.mark, (SK.heading || {}).mark_color || (SK.colors || {}).accent2 || (SK.colors || {}).accent || '#fdd671'));
      qa('#headline .kw, #fith .perf').forEach(function (k) { k.classList.add('skmk'); });
    }
    /* two-tone section heads: the part up to the first comma, or the first line, in the tone colour */
    if (hd.two_tone) {
      qa('#daysh > span, #page .sh').forEach(function (h) {
        if (q('.sktone', h) || h.children.length) return;
        var t = h.textContent, i = t.indexOf(',');
        if (i > 3 && i < t.length - 4) h.innerHTML = '<span class="sktone">' + esc(t.slice(0, i + 1)) + '</span>' + esc(t.slice(i + 1));
      });
    }
    /* trust badge art */
    var art = (SK.trust_badge || {}).art, awd = q('.htrust .awd');
    if (awd && art && BADGE[art] && !q('.skbadge', awd)) {
      awd.insertAdjacentHTML('afterbegin', BADGE[art]('skbh'));
      awd.classList.add('skawd');
      var txt = el('span', 'skawt'); while (awd.children.length > 1) txt.appendChild(awd.children[1]); awd.appendChild(txt);
    }
    /* the lead's own logo in the header, beside the favicon */
    if (SK.nav_logo && S.logo) {
      var lock = q('.nav .lock');
      if (lock && !q('.sklogo', lock)) { var cal = q('.cal', lock); (cal || lock).insertAdjacentHTML(cal ? 'afterend' : 'afterbegin', '<img class="sklogo" src="' + esc(S.logo) + '" alt="' + esc(BRAND) + '">'); B.add('skin-navlogo'); }
    }
    /* day art */
    var da = SK.day_art || {}, style = da.style;
    if (style && DAYART[style]) {
      B.add('skin-art', 'skin-art-' + style);
      var vs = da.variants || [0, 1, 2];
      qa('#days .dagenda').forEach(function (card, i) {
        if (q('.skart', card)) return;
        var html = DAYART[style](i, (vs[i % vs.length] || 0) % 3, 'skd' + i);
        if (i === 0) {
          var mac = q('.macbook', card);
          if (mac && !da.keep_slide) { mac.insertAdjacentHTML('beforebegin', html); card.classList.add('skhasart'); }
        } else {
          var ss = q('.dsess', card);
          if (ss) { ss.innerHTML = html; ss.classList.add('skdsess'); card.classList.add('skhasart'); }
        }
      });
    }
    /* closing: a seat card that fills in with the name they type */
    if ((SK.closing || {}).style === 'seatcard') {
      var cc = q('#closing .ccard');
      if (cc && !q('.skseat', cc)) {
        cc.insertAdjacentHTML('afterbegin', '<div class="skseat" aria-hidden="true"><div class="skmc"><span class="skstamp">seat held</span>' +
          '<div><b class="skmt">' + esc(EV) + '</b><span class="skmp">Free seat</span></div>' +
          '<div class="skmn"><span class="skml"><i class="skname"></i><small>' + esc(dfmt(START) + ' to ' + dfmt(END)) + ', live online</small></span>' +
          '<span class="skmi"><img src="favicon.png" alt=""></span></div></div></div>');
        var inp = q('input[name="first"]', cc), nm = q('.skname', cc);
        if (inp && nm) inp.addEventListener('input', function () { nm.textContent = inp.value.slice(0, 24); });
      }
    }
    /* hand notes: only the lines the skin gives, placed on fixed anchors */
    var an = SK.annotations || {};
    if (an.on) {
      var ARW = function (flip) {
        return '<svg class="skarw' + (flip ? ' f' : '') + '" width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><path class="dr" pathLength="1" d="M36 6 C 20 4, 8 14, 8 34" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>' +
          '<path class="dr" pathLength="1" d="M2 27 L 8 36 L 15 28" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      };
      var note = function (host, text, cls, tone) {
        if (!host || !text || q('.sknote-h.' + cls, host)) return;
        host.classList.add('skanch');
        host.insertAdjacentHTML('beforeend', '<span class="sknote-h ' + cls + ' t' + (tone || 1) + '" aria-hidden="true">' + esc(text) + ARW(cls === 'nfit') + '</span>');
      };
      note($('regcard'), an.reg, 'nreg', 2);
      note($('checks'), an.fit, 'nfit', 2);
      (an.days || []).forEach(function (t, i) {
        var c = qa('#days .dagenda')[i]; if (!c) return;
        var a = q('.skart', c);                       /* the art clips its own overflow: the note goes on its holder */
        note(a ? a.parentNode : (q('.dsess', c) || q('.macbook', c)), t, 'nday', i % 2 ? 2 : 1);
      });
      note(q('#closing .skseat') || q('#closing .ccard'), an.close, 'nclose', 1);
    }
    /* decor: rings behind the video and the close */
    if ((SK.decor || {}).rings) {
      var RINGS = '<svg class="skrings" viewBox="0 0 1000 1000" fill="none" stroke="currentColor" aria-hidden="true">' +
        [300, 350, 408, 462].map(function (rr, k) { return '<circle cx="500" cy="500" r="' + rr + '" stroke-opacity="' + (.1 - k * .02).toFixed(2) + '"/>'; }).join('') +
        '<circle cx="500" cy="500" r="496" stroke-opacity=".04" stroke-dasharray="1 5"/></svg>';
      var hl = q('.hleft'); if (hl && !q('.skrings', hl)) hl.insertAdjacentHTML('afterbegin', RINGS);
      var cl = $('closing'); if (cl && !q('.skrings', cl)) cl.insertAdjacentHTML('afterbegin', RINGS.replace('skrings', 'skrings c'));
    }
    skinHand();
    skinHand2();
  }

  /* ---- the options taken from the hand-made pages (2026-09-29). Each one is off unless its field is set; all of
     it is added by this script, so without JS the template page is simply there. */
  var SKROUTE = null, SKTALLY = null, SKPASS = null;
  function skinHand() {
    var B = document.body.classList, hd = SK.heading || {}, c = SK.colors || {};
    /* booking card as a ticket: a barcode edge (the stub and perforation are CSS on the existing parts) */
    if ((SK.booking_card || {}).style === 'ticket') {
      var bk = q('.hbook');
      if (bk && !q('.skbcode', bk)) bk.insertAdjacentHTML('beforeend', '<span class="skbcode" aria-hidden="true"></span>');
    }
    /* the day band: big numerals in the node column, the date line above each title, one route through them */
    var dy = SK.days || {}, cards = qa('#days .dagenda');
    if (dy.numerals && cards.length) cards.forEach(function (card, i) {
      var node = q('.dnode', card);
      if (!node || q('.sknum', node)) return;
      var n = pad2(i + 1);
      node.insertAdjacentHTML('afterbegin', '<b class="sknum" aria-hidden="true">' +
        (dy.numerals === 'outline-zero' ? '<span class="o">' + n.charAt(0) + '</span>' + n.slice(1) : n) + '</b>');
      var ml = q('.dmetaline', card), o = dparts(new Date(START.getTime() + (WEBINAR ? 0 : i * 864e5)));
      if (ml) ml.textContent = 'Day ' + (i + 1) + ' · ' + [o.weekday, o.month, o.day].filter(Boolean).join(' ') + ' · ' + (S.day_time || tfmt(START));
    });
    if (dy.route && cards.length > 1 && !q('#days .skroute')) {
      $('days').insertAdjacentHTML('beforeend', '<span class="skroute" aria-hidden="true"><i></i><b><svg width="16" height="16" viewBox="0 0 16 16">' +
        '<path d="M8 3.5v9M3.8 8.4 8 12.6l4.2-4.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></b></span>');
      SKROUTE = q('#days .skroute');
      var place = function () {
        var box = $('days'), marks = qa('#days .sknum').length ? qa('#days .sknum') : qa('#days .dnode');
        if (!box || !marks.length || getComputedStyle(SKROUTE).display === 'none') return;
        var br = box.getBoundingClientRect(), a = marks[0].getBoundingClientRect(), last = cards[cards.length - 1].getBoundingClientRect();
        SKROUTE.style.left = (a.left + a.width / 2 - br.left - 3).toFixed(1) + 'px';
        SKROUTE.style.top = (a.bottom - br.top + 14).toFixed(1) + 'px';
        SKROUTE.style.height = Math.max(0, last.bottom - a.bottom - 70).toFixed(1) + 'px';
      };
      SKROUTE._place = place;
      place(); setTimeout(place, 400); setTimeout(place, 1500);
      addEventListener('resize', debounce(place, 120));
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
      if (window.ResizeObserver) new ResizeObserver(function () { place(); }).observe($('days'));
    }
    /* scenes: the highlight behind the new line is as wide as the line itself */
    var hl = function () {
      qa('.sk-pagefix .skhl').forEach(function (r) {
        var t = r.nextElementSibling;
        try { var w = t && t.getComputedTextLength(); if (w > 20) r.setAttribute('width', Math.min(300, Math.ceil(w) + 8)); } catch (e) {}
      });
    };
    hl(); setTimeout(hl, 800);                        /* again once the display face has loaded */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(hl);
    /* one underline under one word per section heading (and the headline's key phrase with heading.mark "band") */
    if (hd.mark === 'band') qa('#headline .kw, #fith .perf').forEach(function (k) { k.classList.add('skuw', 'skband'); });
    if (hd.underline_word) {
      var picks = (Array.isArray(hd.underline_word) ? hd.underline_word : []).map(function (w) { return String(w).toLowerCase(); });
      var STOP = /^(the|and|for|you|your|with|from|this|that|what|here|there|day|days|part|parts|are|into|who|how|why|when|they|them|their|have|will|just|each|every|one|two|three|session|people|doing|going|getting|making|being|having|where|which|about|over|more|most|than|then|only|also|like|need|want|ready|really|actually)$/i;
      qa('#page .sh, #daysh, #page .skduoh').forEach(function (h) {
        if (q('.skmk, .skuw', h) || h.closest('.gated')) return;
        var nodes = [], w = document.createTreeWalker(h, NodeFilter.SHOW_TEXT, null), n;
        while ((n = w.nextNode())) nodes.push(n);
        var best = null;
        nodes.forEach(function (tn) {
          var re = /[A-Za-zÀ-ɏ'’]+/g, m;
          while ((m = re.exec(tn.nodeValue))) {
            var word = m[0], lw = word.toLowerCase().replace(/['’]s$/, ''), score;
            if (picks.length) score = picks.indexOf(lw) > -1 ? 100 - picks.indexOf(lw) : -1;
            else score = STOP.test(lw) || lw.length < 4 || /['’]/.test(lw) ? -1 : lw.length + (m.index / 1000);
            if (score > 0 && (!best || score >= best.s)) best = { s: score, n: tn, i: m.index, l: word.length };
          }
        });
        if (!best) return;
        var mid = best.n.splitText(best.i); mid.splitText(best.l);
        var sp = document.createElement('span');
        sp.className = 'skuw' + ((B.contains('skin-days-band') && h.closest('#days')) || h.closest('#band') ? ' y' : '');
        mid.parentNode.insertBefore(sp, mid); sp.appendChild(mid);
      });
    }
    /* fit check: "N of 5 sound like you", counted as they tap */
    if ((SK.fit || {}).counter) {
      var ul = $('checks');
      if (ul && !q('.sktally')) {
        var tot = qa('#checks li').length, lines = (SK.fit || {}).counter_lines || [
          WEBINAR ? 'The whole session is for you.' : 'All three days are for you.',
          WEBINAR ? 'Most of the session speaks to you.' : 'Two or more days speak to you.',
          'One is still worth a free seat.', 'Tap any that sound like you.'];
        ul.insertAdjacentHTML('afterend', '<div class="sktally" aria-live="polite"><b class="sktn">' + tot + '</b><span><strong>of ' + tot +
          ' sound like you.</strong> <span class="sktt">' + esc(lines[0]) + '</span></span></div>');
        SKTALLY = function () {
          var n = qa('#checks li:not(.off)').length;
          q('.sktn').textContent = n;
          q('.sktt').textContent = n >= tot - 1 ? lines[0] : n >= 2 ? lines[1] : n === 1 ? lines[2] : lines[3];
        };
      }
    }
    /* the numbers band with the lead's photo in a two-colour duotone */
    var pb = SK.photo_band || {}, bandEl = $('band');
    if (pb.style === 'duotone' && bandEl && !q('.skngrid', bandEl)) {
      var stats = (LP.stats || []).slice(0, 4), host = function (u) { try { return String(u).replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, ''); } catch (e) { return ''; } };
      var srcs = []; stats.forEach(function (s) { var h2 = host(s.source); if (h2 && srcs.indexOf(h2) < 0) srcs.push(h2); });
      var ttl = pb.title || ('Live with ' + FIRST), bio = pb.bio === false ? '' : (pb.bio || S.bio || LP.bio || '');
      var ttlHTML = esc(ttl);
      if (FIRST && ttl.indexOf(FIRST) > -1 && (hd.underline_word || hd.mark === 'band')) ttlHTML = esc(ttl).replace(esc(FIRST), '<span class="skuw y">' + esc(FIRST) + '</span>');
      bandEl.innerHTML = '<div class="skngrid"><div class="skduo"><img src="img/headshot.jpg" alt="' + esc(WHO || FIRST) + '" loading="lazy">' +
        '<div class="skduotag"><b>' + esc(WHO) + '</b><span>' + esc(LP.role || BRAND) + '</span></div></div>' +
        '<div class="skncopy"><span class="skduoe">' + esc(pb.eyebrow || 'Who is teaching') + '</span><h2 class="sh skduoh">' + ttlHTML + '</h2>' +
        '<div class="skstats">' + stats.map(function (s) { return '<div class="skstat"><b>' + esc(s.num) + '</b><span>' + esc(s.label) + '</span></div>'; }).join('') + '</div>' +
        (bio ? '<p class="skbio">' + esc(bio) + '</p>' : '') + (srcs.length ? '<p class="sksrc">Figures: ' + esc(srcs.join(', ')) + '</p>' : '') + '</div></div>';
    }
    /* closing: the guest pass. The name prints as it is typed; the button rides the route and punches the stub */
    if ((SK.closing || {}).style === 'pass') {
      var cc = q('#closing .ccard');
      if (cc && !q('.skpass', cc)) {
        B.add('skin-close-seatcard');                /* same two-column card as the seat card */
        var nd = Math.max(1, Math.min(3, (LP.days || []).length || 3));
        var stopX = [18, 150, 282], lab = [0, 1, 2].map(function (k) {
          return WEBINAR ? ['Join', 'Live', 'Replay'][k] : dfmt(new Date(START.getTime() + k * 864e5));
        });
        cc.insertAdjacentHTML('afterbegin', '<div class="skseat skpassw" aria-hidden="true"><div class="skpass">' +
          '<div class="skpm"><div class="skph"><span>' + esc((SK.closing || {}).label || 'Guest pass') + '</span><img src="favicon-32.png" alt=""></div>' +
            '<div class="skpev">' + esc(EV) + '</div>' +
            '<div class="skpgn"><small>Guest</small><i class="skpname ph0">Your name</i></div>' +
            '<svg class="skrt3" viewBox="0 0 300 44"><path class="skrl" d="M18 14H282"/>' +
              stopX.map(function (x) { return '<circle class="skrs" cx="' + x + '" cy="14" r="6"/>'; }).join('') +
              lab.map(function (t, k) { return '<text x="' + stopX[k] + '" y="39" text-anchor="' + ['start', 'middle', 'end'][k] + '">' + esc(t) + '</text>'; }).join('') +
              '<g class="skrm"><circle cx="18" cy="14" r="11"/><path d="M12.5 14h10M18.5 9.8 22.7 14l-4.2 4.2"/></g></svg>' +
            '<div class="skpfl"><div><small>Time</small><b>' + esc(tfmt(START)) + '</b></div><div><small>Where</small><b>Online</b></div><div><small>Price</small><b>Free</b></div></div>' +
          '</div>' +
          '<div class="skps"><div class="skpseat"><small>Seat</small>' + nd + (nd > 1 ? ' days' : ' day') + '</div><span class="skbars"></span><small>Admit one</small></div>' +
          '<span class="skpunch"></span><span class="skpstamp">' + esc((SK.closing || {}).stamp || 'Seat held') + '</span></div></div>');
        SKPASS = q('.skpass', cc);
        var inp = q('input[name="first"]', cc), nm = q('.skpname', cc), shown = '';
        if (inp && nm) inp.addEventListener('input', function () {
          var v = inp.value.replace(/\s+/g, ' ').trim().slice(0, 22);
          if (!v) { nm.textContent = 'Your name'; nm.classList.add('ph0'); shown = ''; return; }
          nm.classList.remove('ph0');
          if (!shown || v.indexOf(shown) !== 0) { nm.textContent = ''; shown = ''; }
          for (var k = shown.length; k < v.length; k++) { var s = document.createElement('span'); s.className = 'c new'; s.textContent = v.charAt(k); nm.appendChild(s); }
          shown = v;
        });
        var go = q('.form .btn', cc);
        if (go) go.addEventListener('click', function (e) {
          if (SKPASS.classList.contains('done') || !inp || !inp.value.trim()) return;   /* nothing typed: the form opens as usual */
          e.preventDefault(); e.stopPropagation();
          var still = !document.documentElement.classList.contains('skm'), stops = qa('.skrs', SKPASS), rm = q('.skrm', SKPASS);
          SKPASS.classList.add('done'); stops[0].classList.add('lit');
          if (still) { stops.forEach(function (s) { s.classList.add('lit'); }); rm.style.transform = 'translateX(264px)'; if (REG) REG.open(); return; }
          rm.style.transform = 'translateX(132px)';
          setTimeout(function () { stops[1].classList.add('lit'); rm.style.transform = 'translateX(264px)'; }, 700);
          setTimeout(function () { stops[2].classList.add('lit'); }, 1400);
          setTimeout(function () { if (REG) REG.open(); }, 2300);
        }, true);
      }
    }
  }

  /* ---- hand-page options, second pass: the elements (tokens and classes are set in skinTokens2) */
  var SKSEC = { hero: 'hero', facts: 'facts', fit: 'fitc', fitc: 'fitc', band: 'band', numbers: 'band', photo: 'band',
    days: 'days', takeaway: 'takeaway', keep: 'takeaway', host: 'host', faq: 'faq', testimonial: 'tst', tst: 'tst',
    closing: 'closing', join: 'closing' };
  function skinFitTitle() {                    /* before the marks are placed: they look for #fith .perf */
    var fit = SK.fit || {}, t = fit.title, l1 = $('fitL1'), l2 = $('fitL2');
    if (!Array.isArray(t) || t.length < 2 || !l1 || !l2) return;
    l1.textContent = t[0];
    var mk = String(fit.mark || '').trim();
    [[l1, String(t[0])], [l2, String(t[1])]].forEach(function (p, n) {
      var i = mk ? p[1].indexOf(mk) : -1;
      if (n === 0 && i < 0) return;
      p[0].innerHTML = i < 0 ? esc(p[1]) : esc(p[1].slice(0, i)) + '<span class="perf">' + esc(mk) + '</span>' + esc(p[1].slice(i + mk.length));
      if (i > -1) mk = '';                          /* one mark only */
    });
  }
  function skinHand2() {
    var B = document.body.classList, c = SK.colors || {};
    /* trust strip as a stat block: eyebrow, big line, sub line, faces, one uppercase line */
    var tb = SK.trust_badge || {}, ht = q('.htrust');
    if (tb.art === 'block' && ht && !q('.skblk', ht)) {
      var st = LP.stats || [], s0 = st[0] || {}, s1 = st[1] || {};
      var big = tb.big || [s0.num, s0.label].filter(Boolean).join(' ');
      var sub = tb.sub != null ? tb.sub : [s1.num, s1.label].filter(Boolean).join(' ');
      var tm2 = q('.tm2', ht), line = tb.text || (tm2 ? tm2.textContent : '');
      var av = q('.avstack', ht);
      ht.innerHTML = '<span class="skblk">' + (tb.eyebrow ? '<small>' + esc(tb.eyebrow) + '</small>' : '') + '<b>' + esc(big) + '</b>' +
        (sub ? '<span>' + esc(sub) + '</span>' : '') + '</span>';
      if (av) ht.appendChild(av);
      if (line) ht.insertAdjacentHTML('beforeend', '<p class="sktr">' + esc(line) + '</p>');
      ht.classList.add('skblock');
    }
    /* the registration card: who it is for beside the faces, one note in place of "just registered" */
    var rc = SK.regcard || {}, reg = $('regcard');
    if (reg && rc.who && !q('.skwho', reg)) {
      var rp = q('.rproof', reg);
      if (rp) rp.insertAdjacentHTML('beforeend', '<span class="skwho"><b>' + esc(rc.who) + '</b> ' + esc(rc.who_tail || 'like you') + '</span>');
      B.add('skin-reg-who');
    }
    if (reg && Array.isArray(rc.note) && !q('.sknote2', reg)) {
      var rl = q('.rlive', reg);
      if (rl) { rl.classList.add('sknote2'); rl.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="var(--sk-mark)"/>' +
        '<path d="M6.5 12h10M12.5 7.5 17 12l-4.5 4.5" fill="none" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '<span><b>' + esc(rc.note[0] || '') + '</b> ' + esc(rc.note[1] || '') + '</span>'; }
    }
    /* a slim row of section links above the floating header */
    var nl = (SK.header || {}).nav_links || [], hdr = q('#page > .hdr');
    if (nl.length && hdr && !q('.sknavl')) {
      var links = nl.map(function (l) {
        var id = SKSEC[l.anchor] || String(l.anchor || '').replace(/^#/, '');
        return $(id) ? '<a href="#' + esc(id) + '">' + esc(l.label) + '</a>' : '';
      }).join('');
      if (links) {
        hdr.insertAdjacentHTML('beforebegin', '<nav class="sknavl" aria-label="Sections">' + links + '</nav>');
        document.documentElement.style.scrollPaddingTop = '100px';
      }
    }
    /* section order and the sections left out */
    var se = SK.sections || {};
    (se.hide || []).forEach(function (k) { var n = $(SKSEC[k] || k); if (n) n.classList.add('skhide'); });
    if (Array.isArray(se.order) && se.order.length > 1) {
      var nodes = [], seen = {};
      se.order.forEach(function (k) { var id = SKSEC[k] || k, n = $(id); if (n && n.parentNode === P && !seen[id]) { seen[id] = 1; nodes.push(n); } });
      if (nodes.length > 1) {
        var first = nodes.reduce(function (a, n) { return (a.compareDocumentPosition(n) & 2) ? n : a; }, nodes[0]);
        var mark = document.createComment('skorder');
        P.insertBefore(mark, first);
        nodes.forEach(function (n) { P.insertBefore(n, mark); });
        P.removeChild(mark);
      }
    }
    /* fit check split: the head, a sub line and the tally in the left column, the cards on the right */
    var fit = SK.fit || {}, fitc = $('fitc'), grid = fitc && q('.fitgrid', fitc);
    if (fit.layout === 'split' && grid && !q('.skfhead', grid)) {
      var head = el('div', 'skfhead'), eye = q(':scope > .eyebrow', fitc), h2 = $('fith');
      if (eye) head.appendChild(eye);
      if (h2) head.appendChild(h2);
      if (fit.sub) head.insertAdjacentHTML('beforeend', '<p class="skfsub">' + esc(fit.sub) + '</p>');
      var tally = q('.sktally', grid); if (tally) head.appendChild(tally);
      grid.insertBefore(head, grid.firstChild);
      if (fit.portrait !== true) B.add('skin-fit-noportrait');
    }
    /* boxed fit cards: the title reads as a title (no closing full stop); the tick can be a round arrow */
    if (fit.cards === 'boxed') qa('#checks li > div > p:first-child > b:first-child').forEach(function (b) { b.textContent = b.textContent.replace(/[.:]\s*$/, ''); });
    if (fit.tick === 'arrow') qa('#checks .ck').forEach(function (ck) {
      ck.innerHTML = '<svg width="30" height="30" viewBox="0 0 40 40" aria-hidden="true"><circle class="skr" cx="20" cy="20" r="17"/>' +
        '<path class="ska" d="M12 20h15M21.5 13.5 28 20l-6.5 6.5"/></svg>';
      ck.classList.add('skarrow');
    });
    /* takeaway: an eyebrow over the head, the lede left out */
    var tk = SK.takeaway || {}, tks = q('#takeaway .tkside');
    if (tk.eyebrow && tks && !q('.skeye', tks)) tks.insertAdjacentHTML('afterbegin', '<p class="eyebrow skeye">' + esc(tk.eyebrow) + '</p>');
    if (tk.lede === false && tks) { var tl = q('.slede', tks); if (tl) tl.classList.add('skhide'); }
    /* the closing card: a sub line under the head */
    var csub = (SK.closing || {}).sub, chd = q('#closing .chead .ctext') || q('#closing .chead');
    if (csub && chd && !q('.skcsub', chd)) chd.insertAdjacentHTML('beforeend', '<p class="skcsub">' + esc(csub) + '</p>');
    /* the photo band's bio: the first clause in bold */
    if ((SK.photo_band || {}).bio_lead) {
      var bio = q('#band .skbio');
      if (bio && !q('b', bio)) {
        var t = bio.textContent, k = t.indexOf(','), k2 = t.indexOf('. ');
        var cut = k > 12 && (k2 < 0 || k < k2) ? k + 1 : k2 > 12 ? k2 + 1 : -1;
        if (cut > 0) bio.innerHTML = '<b>' + esc(t.slice(0, cut)) + '</b>' + esc(t.slice(cut));
      }
    }
  }

  /* ---- the motion pack: reveals, line draw-on, count-up, hairlines, hover lift, ring drift, play pulse,
     tap-to-tick. html.skm is only set when the visitor allows motion; nothing is hidden before this code runs,
     and a timer shows everything if a reveal never fires. */
  function skinMotion() {
    if (!SK) return;
    var lvl = (SK.motion || {}).level || 'none', H = document.documentElement, B = document.body.classList;
    var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    /* tap-to-tick works with or without motion: it is a widget, not an animation */
    if ((SK.widgets || {}).tick_cards || (SK.fit || {}).counter) {
      B.add('skin-tick');
      qa('#checks li').forEach(function (li) {
        li.setAttribute('role', 'button'); li.tabIndex = 0; li.setAttribute('aria-pressed', 'true');
        var t = function () { li.classList.toggle('off'); li.setAttribute('aria-pressed', li.classList.contains('off') ? 'false' : 'true'); if (SKTALLY) SKTALLY(); };
        li.addEventListener('click', t);
        li.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); t(); } });
      });
    }
    if (lvl === 'none' || still || !('IntersectionObserver' in window)) return;
    H.classList.add('skm', 'skm-' + lvl);
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('skin-in'); io.unobserve(e.target);
        if (e.target._on) e.target._on();
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    var watch = function (n, d) { if (d != null) n.style.setProperty('--skd', d + 'ms'); io.observe(n); };
    var below = function (n) { return n.getBoundingClientRect().top > innerHeight * 0.9; };
    /* fade-up, staggered inside each group; anything already on screen is left alone */
    ['#fitc .fith', '#fitc .fitgrid .me', '#checks li', '#fitc .fitnote', '#band .blead', '#band .bst', '#days .daysh', '#days .intro',
     '#days .dagenda', '#takeaway .tkart', '#takeaway .tkrows li', '#faq .faqi', '#tst .tstin', '#closing .ccard', '#band .skncopy', '#fitc .sktally']
      .forEach(function (sel) {
        qa(sel).forEach(function (n, i) { if (!below(n)) return; n.classList.add('skrv'); watch(n, Math.min(i, 6) * 90); });
      });
    /* line art draws itself */
    qa('.skart, .sknote-h').forEach(function (a) { if (below(a)) { a.classList.add('skdraw'); watch(a); } else a.classList.add('skin-in'); });
    qa('.skmk, .skuw').forEach(function (k) { k.classList.add('skdraw'); if (below(k)) watch(k); else setTimeout(function () { k.classList.add('skin-in'); }, 350); });
    /* the route through the days fills as the page scrolls, the marker rides its end */
    if (SKROUTE) {
      var fill = function () {
        if (getComputedStyle(SKROUTE).display === 'none') return;
        var r = SKROUTE.getBoundingClientRect(), p = r.height ? (innerHeight * 0.55 - r.top) / r.height : 1;
        SKROUTE.style.setProperty('--sktl', clamp(p, 0, 1).toFixed(3));
      };
      fill(); addEventListener('scroll', fill, { passive: true }); addEventListener('resize', fill);
    }
    /* the thread scene: the open draft types itself once it is on screen */
    qa('.sk-thread .skty').forEach(function (ty) {
      var full = ty.textContent, art = ty.closest('.skart');
      if (!below(art)) return;
      ty.textContent = '';
      var prev = art._on;
      art._on = function () {
        if (prev) prev();
        var i = 0;
        (function step() { if (i > full.length) return; ty.textContent = full.slice(0, i); i += 1; setTimeout(step, full.charAt(i - 1) === '.' ? 260 : 26); })();
      };
    });
    /* numbers count up and end exactly as written */
    qa('#band .blead b, #band .bst b, #band .skstat b').forEach(function (n) {
      var txt = n.textContent, m = txt.match(/^([^0-9]*)([0-9]+(?:\.[0-9]+)?)(.*)$/);
      if (!m || !below(n)) return;
      var to = parseFloat(m[2]), dec = (m[2].split('.')[1] || '').length;
      n._on = function () {
        var t0 = performance.now();
        (function step(t) {
          var k = Math.min(1, (t - t0) / 1400), v = to * (1 - Math.pow(1 - k, 3));
          n.textContent = k < 1 ? m[1] + v.toFixed(dec) + m[3] : txt;
          if (k < 1) requestAnimationFrame(step);
        })(t0);
      };
      watch(n);
    });
    /* the tiles' focus timer runs while it is on screen */
    qa('.sktm').forEach(function (tm) {
      var left = 1500, bar = q('.skprog b', tm.closest('.skui')), on = false;
      tm.closest('.skart')._on = function () { on = true; };
      setInterval(function () { if (!on || left <= 0) return; left--; tm.textContent = pad2(Math.floor(left / 60)) + ':' + pad2(left % 60); if (bar) bar.style.width = ((1500 - left) / 1500 * 100).toFixed(1) + '%'; }, 1000);
    });
    /* safety: whatever has not revealed after 5 s shows anyway */
    setTimeout(function () { qa('.skrv:not(.skin-in)').forEach(function (n) { if (!below(n)) n.classList.add('skin-in'); }); }, 5000);
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

  /* The header docks once the page is moving. One state change, read in a frame and written only when it
     actually flips, so scrolling never pays for a style write. The motion itself is pure transform. */
  function headerScroll() {
    var hdr = q('.hdr');
    if (!hdr) return;
    var tight = null, queued = false;
    var apply = function () {
      queued = false;
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      var want = tight ? y > 54 : y > 96;          /* hysteresis: no flutter at the threshold */
      if (want === tight) return;
      tight = want;
      hdr.classList.toggle('tight', want);
    };
    var on = function () { if (!queued) { queued = true; requestAnimationFrame(apply); } };
    apply();
    addEventListener('scroll', on, { passive: true });
    addEventListener('resize', on, { passive: true });
  }

  /* the lead's finish: corners, edge weight and lift, computed from their slide (see build_site.style_for) */
  function styleTokens() {
    var st = S.style || {};
    var r = document.documentElement.style;
    if (st.r_lg) r.setProperty('--r-lg', st.r_lg);
    if (st.r_md) r.setProperty('--r-md', st.r_md);
    if (st.r_sm) r.setProperty('--r-sm', st.r_sm);
    if (st.btn_r) r.setProperty('--btn-r', st.btn_r);
    if (st.btn_off) r.setProperty('--btn-off', st.btn_off);
    if (st.brd) r.setProperty('--brd', st.brd);
    if (st.lift) r.setProperty('--lift', st.lift);
    if (st.face) P.setAttribute('data-finish', st.face);
    if (st.night) r.setProperty('--night', st.night);
  }

  /* the day blocks: a real date and time on each, and a line on what happens in the room */
  function dayDetail() {
    var days = LP.days || [];
    var box = $('days');
    if (!box || !days.length) return;
    var slot = S.day_time || tfmt(START);
    var meta = function (i) {
      var d = new Date(START.getTime() + i * 864e5);
      return dfmt(d) + ' \u00B7 ' + slot + ' \u00B7 live, replay the same day';
    };
    var when1 = q('.when .dmeta', box);
    if (when1) when1.innerHTML = 'Live session<br>' + esc(meta(0));
    var bullets = function (i) {
      var list = (S.day_bullets || [])[i] || [];
      if (!list.length) return '';
      return '<ul class="dbul">' + list.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>';
    };
    var extra = $('d1o');
    if (extra && days[0] && days[0].outcome) {
      extra.insertAdjacentHTML('afterend', '<p class="dxtra">' +
        esc((S.day_detail || [])[0] || ('You work it in the session, on your own product, with ' + FIRST + ' on the call.')) +
        '</p>' + bullets(0));
    }
    qa('.d23 > *', box).forEach(function (card, i) {
      if (q('.dwhen', card)) return;
      var line = el('p', 'dwhen', esc(meta(i + 1)));
      card.insertBefore(line, card.firstChild);
      var det = (S.day_detail || [])[i + 1];
      if (det && !q('.dxtra', card)) card.insertAdjacentHTML('beforeend', '<p class="dxtra">' + esc(det) + '</p>' + bullets(i + 1));
    });
    agendaDays(box, slot);
  }

  /* An agenda, which is what three live days actually are: a dated rail down the left with a node per
     day, the session beside it. Not a card, not a ticket, not a numbered list. Every value comes from
     the lead's own dates, so it costs nothing per lead. */
  function agendaDays(box, slot) {
    var n = qa('.d23 > *', box).length + 1;
    function node(i) {
      var o = dparts(new Date(START.getTime() + i * 864e5));
      return '<div class="dnode"><span class="dnwd">' + esc(o.weekday || '') + '</span>' +
        '<b class="dnday">' + esc(o.day || '') + '</b>' +
        '<span class="dnmon">' + esc(o.month || '') + '</span>' +
        '<span class="dntime">' + esc(slot) + '</span>' +
        '<span class="dnlive"><i></i>Live</span></div>';
    }
    function wrap(card, i) {
      if (q('.dnode', card)) return;
      var body = el('div', 'dbody');
      while (card.firstChild) body.appendChild(card.firstChild);
      card.insertAdjacentHTML('afterbegin', node(i));
      card.appendChild(body);
      card.classList.add('dagenda');
      if (i === 0) card.classList.add('first');
      if (i === n - 1) card.classList.add('last');
      var t = q('.dt', body);
      if (t) t.insertAdjacentHTML('beforebegin',
        '<p class="dmetaline">Day ' + (i + 1) + ' of ' + n + ' \u00B7 Replay the same day</p>');
      /* what you leave with, as a labelled block rather than bullets strung across the whole row */
      var bul = q('.dbul', body);
      if (bul) {
        var keep = el('div', 'dkeep', '<p class="dkeepl">You leave with</p>');
        bul.parentNode.insertBefore(keep, bul);
        keep.appendChild(bul);
      }
      /* the action, in the words of the day you just read about */
      var host = q('.d1body', body) || body, keepEl = q('.dkeep', host) || q('.dkeep', body);
      (keepEl || host).insertAdjacentHTML(keepEl ? 'afterend' : 'beforeend',
        ctaBlock(ctaFor((LP.days || [])[i] && (LP.days || [])[i].title, i), 'Free \u00B7 Live with ' + FIRST));
      /* Day 1's object column carries the document that comes off it (2026-09-23): the laptop is the screen
         you watch that day and the takeaway box is what it produces, so they stack in one column and the row
         stops leaving 255px of empty ground under a 281px laptop. The CTA moves up to be a grid child so it
         can bottom out level with the copy. */
      if (i === 0) {
        var mac = q('.macbook', body), keep0 = q('.dkeep', body), cta0 = q('.scta', body);
        if (mac) {
          var col = el('div', 'dmaccol');
          mac.parentNode.insertBefore(col, mac);
          col.appendChild(mac);
          if (keep0) col.appendChild(keep0); else col.classList.add('solo');
          if (cta0) body.appendChild(cta0);
          card.classList.add('hasmac');
        }
      }
      /* Days 2+: the empty column shows the live session itself (2026-09-22, replacing the take-home sheet):
         a call window with the day's title on the shared screen in the lead's own type and colours, the host's
         camera tile, and the room. "You leave with" stays under the copy, as on Day 1. Rows alternate sides. */
      if (i > 0) {
        var ttl = String(((LP.days || [])[i] || {}).title || '');
        var lines = ttl.split('|').map(function (x) { return esc(x.trim()); }).filter(Boolean);
        var flat = ttl.split('|').join(' ').replace(/\s+/g, ' ').replace(/\.$/, '').trim();
        var cam = i % 2 ? (S.avatar || 'img/headshot.jpg') : 'img/video.jpg';
        /* the shared screen is the NEXT SLIDE OF THE LEAD'S OWN DECK: their Day 1 slide art on the right (Day 3
           zooms into a detail), their wordmark, "Day N . event" in the slide's eyebrow and the title in their
           display face, first line in the accent over the hatched marker the slide uses */
        var tl = lines.length ? '<span class="dsacc">' + lines[0] + '</span>' + (lines.length > 1 ? '<br>' + lines.slice(1).join('<br>') : '') : esc(flat);
        var chats = ['Mine’s in the chat, can you check it?', 'Doing this one tonight. Thank you!'];
        var sess = el('div', 'dsess' + (i % 2 ? '' : ' zoom'), '<div class="dswin">' +
          '<div class="dsbar"><img class="dsemb" src="favicon-32.png" alt="">' +
            '<span class="dsname"><b>Day ' + (i + 1) + '</b>' + esc(flat) + '</span>' +
            '<span class="dslive"><b></b>Live</span></div>' +
          (i % 2 ?
          /* screen share: the slide fills the stage, the host in a corner tile */
          '<div class="dsstage"><div class="dsslide">' +
            '<img class="dsart" src="img/slide.jpg" alt="" loading="lazy">' +
            '<div class="dscopy"><span class="dswm">' + esc(BRAND) + '</span>' +
              '<span class="dssk"><b>Day ' + (i + 1) + '</b><i></i>' + esc(EV) + '</span>' +
              '<span class="dsst">' + tl + '</span></div></div>' +
            '<span class="dscam"><img src="' + esc(cam) + '" alt="" loading="lazy"><em>' + esc(FIRST) + '</em></span></div>' +
          '<div class="dsppl">' + avstack(5, 'sm') + '<span><b class="seatn">' + seatText() + '</b> in the room</span>' +
            '<span class="dsmic">Replay same day</span></div>'
          :
          /* speaker view: the host fills the stage, the slide shrinks to a corner, the room is a gallery strip */
          '<div class="dsstage spk"><img class="dsspk" src="' + esc(cam) + '" alt="" loading="lazy">' +
            '<div class="dspip"><img src="img/slide.jpg" alt="" loading="lazy"><span>Day ' + (i + 1) + '</span></div>' +
            '<span class="dslower"><b>' + esc(WHO) + '</b>' + esc(BRAND) + ' \u00B7 live</span>' +
            '<span class="dscap">' + esc(String(((LP.days || [])[i] || {}).outcome || flat)) + '</span></div>' +
          '<div class="dsgal">' + [0, 1, 2, 3].map(function (k) { return '<span class="dsg">' + face(i * 4 + k) + '</span>'; }).join('') +
            '<span class="dsgn"><b class="seatn">' + seatText() + '</b> watching</span></div>') +
          '</div>' +
          '<span class="dschat"><span class="fav">' + face(i + 2) + '</span><span><b>' + esc(NAMES[(i + 3) % NAMES.length]) +
            '</b>' + esc(chats[(i - 1) % chats.length]) + '</span></span>');
        var txt = el('div', 'dtext'), cta = q('.scta', body);
        [].slice.call(body.children).forEach(function (c) { if (c !== cta) txt.appendChild(c); });
        body.insertBefore(txt, body.firstChild);
        body.appendChild(sess);
        if (cta) body.appendChild(cta);
        card.classList.add('hassheet');
        if (i % 2 === 0) card.classList.add('flip');
      } else if (i > 0 && ART[i]) {
        card.insertAdjacentHTML('beforeend', '<span class="dmark">' + ART[i] + '</span>');
      }
    }
    var d1 = q('.d1', box);
    if (d1) wrap(d1, 0);
    (function () {
      var im = new Image();
      im.onload = function () {
        try {
          var c = document.createElement('canvas'); c.width = 8; c.height = 8;
          var x = c.getContext('2d'); x.drawImage(im, 0, im.height * 0.45, im.width * 0.03, im.height * 0.1, 0, 0, 8, 8);
          var d = x.getImageData(0, 0, 8, 8).data, r = 0, g = 0, b = 0;
          for (var k = 0; k < d.length; k += 4) { r += d[k]; g += d[k + 1]; b += d[k + 2]; }
          var nPx = d.length / 4;
          box.style.setProperty('--sg', 'rgb(' + Math.round(r / nPx) + ',' + Math.round(g / nPx) + ',' + Math.round(b / nPx) + ')');
        } catch (e) { /* cross-origin or no canvas: the ground token stands in */ }
      };
      im.src = 'img/slide.jpg';
    })();
    qa('.d23 > *', box).forEach(function (card, i) { wrap(card, i + 1); });
  }

  /* every line about the work itself is taken from the lead's own days, so no page ever carries another
     lead's vocabulary, and nothing about the host assumes a pronoun (2026-09-23) */
  function dayLine(i, key) {
    var d = (LP.days || [])[i] || {};
    var v = key === 'bullet' ? (d.bullets || [])[0] : d[key];
    v = String(v || '').trim().replace(/[.\u2022\s]+$/, '');
    return v ? v.charAt(0).toLowerCase() + v.slice(1) : '';
  }
  function prepAnswer() {
    if (S.prep_answer) return S.prep_answer;
    var b = dayLine(0, 'bullet') || dayLine(0, 'outcome'), k = phraseKind(b);
    if (k === 'verb') return 'Nothing to prepare. On Day 1 you ' + b + ', working with whatever you already have.';
    if (k === 'noun') return 'Nothing to prepare. Day 1 starts with ' + b + ', and you work with whatever you already have.';
    return 'Nothing to prepare. Bring whatever you already have; everything else is handed to you on Day 1.';
  }
  /* "On Day 1 you list what you read ... by Day 3 you set up the review", built only from phrases whose kind is known
     (phraseKind), else the safe line. lp.json site.fit_paragraph replaces the whole sentence. */
  function fitArc() {
    if (S.fit_paragraph) return ' ' + S.fit_paragraph;
    var d1 = dayLine(0, 'bullet') || dayLine(0, 'outcome'), d3 = dayLine(2, 'outcome');
    var k1 = phraseKind(d1), k3 = phraseKind(d3);
    var a = k1 === 'verb' ? 'On Day 1 you ' + d1 : k1 === 'noun' ? 'Day 1 starts with ' + d1 : '';
    var b = k3 === 'verb' ? 'by Day 3 you ' + d3 : k3 === 'noun' ? 'by Day 3 you leave with ' + d3 : '';
    if (a && b) return ' ' + a + ', so bring what you already have; ' + b + '.';
    if (b) return ' Bring what you already have; ' + b + '.';
    return ' You bring the work you already have, and you leave with the next three moves made.';
  }

  /* the fit check needs more than a list: who this is for, and who it is not for */
  function fitCopy() {
    var fitc = $('fitc');
    if (!fitc || q('.fitnote', fitc)) return;
    /* S.audience is a channel label ("newsletter subscribers"), never a who-it-is-for phrase: never put it here */
    var fitFor = S.fit_note || 'It is built for anyone who recognised themselves up there.';
    var arc = fitArc();
    var note = el('div', 'fitnote',
      '<p><b>' + esc(fitFor) + '</b>' + esc(arc) + '</p>' +
      '<p>' + esc(S.fit_not || ('If you have not started yet, come back for the next one. Three days can sharpen ' +
      'work that already exists. They cannot invent it from nothing.')) + '</p>');
    fitc.appendChild(note);
    fitc.insertAdjacentHTML('beforeend', ctaBlock('Sounds like me, hold my seat', 'Free \u00B7 Nothing to pay'));
  }

  /* three real sections between the days and the close: what they walk away with, who runs it, the questions
     people actually ask. All of it from data the lead already has, so no lead needs copy written by hand. */
  function bodySections() {
    var days = LP.days || [], closing = $('closing');
    if (!closing || $('takeaway')) return;

    var outs = days.slice(0, 3).map(function (d) { return String(d.outcome || '').trim(); }).filter(Boolean);
    if (outs.length) {
      /* the name of each piece follows what it actually is for this lead: 'The numbers' belongs to a margin
         day, not to a goal-setting one (2026-09-23) */
      var KIND_LABEL = { Worksheet: 'The numbers', Sheet: 'The sheet', Template: 'The template',
        Tracker: 'The follow-up', Plan: 'The plan', Shortlist: 'The shortlist', Brief: 'The brief',
        Checklist: 'The checklist' };
      var labels = [];
      var take = el('section', 'sect z');
      take.id = 'takeaway';
      /* the payoff of the three days: the take-home sheets from the schedule, clipped together as one kit,
         and one line per day beside it (2026-09-22). The day rows above already list every item. */
      function kindOf(t) {
        t = String(t).toLowerCase();
        if (/price|cost|margin|number|budget|calculator|profit/.test(t)) return 'Worksheet';
        if (/track|follow[- ]?up|pipeline|calendar|sequence/.test(t)) return 'Tracker';
        if (/sheet|list|catalog|menu|portfolio/.test(t)) return 'Sheet';
        if (/email|pitch|script|message|dm|post|caption|letter/.test(t)) return 'Template';
        if (/project|shortlist|crucial few|select/.test(t)) return 'Shortlist';
        if (/goal|focus|audience|brief|positioning|priorit|choose|pick /.test(t)) return 'Brief';
        if (/plan|roadmap|map |schedule|week|quarter|90[- ]?day|month/.test(t)) return 'Plan';
        if (/checklist|step|system|process|routine/.test(t)) return 'Checklist';
        return 'Sheet';
      }
      /* the flat lay, fixed and made theirs (2026-09-23): the stacked cards come back, each one drawn as the real
         document that day produces. lp.json site.keep holds one object per day, all keys optional:
           {name, status, title, foot, foot_tag, kind:'table',   cols:[..], rows:[[..]], flag:{row}}
           {name, status, title, foot, foot_tag, kind:'sheet',   head, items:[{art, name, sku, price}]}
           {name, status, title, foot, foot_tag, kind:'tracker', who, cols:[..], rows:[{name, marks:'ssn-', next}]}
         art is card / notebook / print / candle / box; marks are s sent, r replied, n next, - planned.
         site.keep_title replaces the headline. Without keep each card lists that day's own keep items.
         No tape, no seal, no placeholder bars, nothing cut off with an ellipsis. */
      var KEEP = S.keep || [];
      var PROD = {
        card: '<rect x="10" y="20" width="32" height="21" rx="1.5" fill="var(--tint2)" stroke="currentColor"/><path d="M10 21l16 10 16-10" stroke="currentColor" stroke-opacity=".5"/><g transform="rotate(-7 42 24)"><rect x="30" y="7" width="22" height="30" rx="1.5" fill="#fffdf9" stroke="currentColor"/><circle cx="41" cy="19" r="5" fill="var(--tint)" stroke="var(--accent)"/><path d="M36 30h10" stroke="var(--accent)"/></g>',
        notebook: '<rect x="19" y="6" width="27" height="36" rx="2" fill="var(--tint)" stroke="var(--accent)"/><path d="M24 6v36" stroke="var(--accent)" stroke-opacity=".55"/><path d="M41 6v36" stroke="currentColor" stroke-opacity=".5"/><rect x="27" y="14" width="10" height="6" rx="1" fill="#fffdf9" stroke="currentColor"/>',
        print: '<rect x="17" y="5" width="30" height="38" rx="1" fill="#fffdf9" stroke="currentColor"/><rect x="21" y="9" width="22" height="30" fill="var(--tint2)"/><circle cx="36" cy="17" r="3.5" fill="var(--tint)" stroke="var(--accent)"/><path d="M21 35l7-8 5 5 4-4 6 7" stroke="currentColor" stroke-linejoin="round"/>',
        candle: '<path d="M21 18h22v21a3 3 0 0 1-3 3H24a3 3 0 0 1-3-3z" fill="var(--tint)" stroke="currentColor"/><rect x="21" y="25" width="22" height="9" fill="#fffdf9" stroke="var(--accent)"/><path d="M32 18v-5" stroke="currentColor"/><path d="M32 6c2.2 2.4 2.2 4.4 0 5.6-2.2-1.2-2.2-3.2 0-5.6z" fill="var(--tint)" stroke="var(--accent)"/>',
        box: '<path d="M14 17l18-8 18 8v19l-18 8-18-8z" fill="var(--tint2)" stroke="currentColor"/><path d="M14 17l18 8 18-8M32 25v19" stroke="currentColor" stroke-opacity=".55"/><path d="M23 13l18 8v6" stroke="var(--accent)"/>'
      };
      function prodArt(a) {
        return '<svg viewBox="0 0 64 48" fill="none" stroke-width="1.3" stroke-linecap="round" aria-hidden="true">' +
          (PROD[a] || PROD.box) + '</svg>';
      }
      function mockBody(k, items) {
        if (k.kind === 'table' && k.rows) {
          var n = (k.cols || k.rows[0] || []).length, fl = k.flag || {};
          var tr = function (r, cls) {
            return '<span class="ktr' + (cls || '') + '">' + r.map(function (c, j) {
              return '<span' + (j ? ' class="kn"' : '') + '>' + esc(c) + '</span>';
            }).join('') + '</span>';
          };
          return '<span class="kt" style="--n:' + (n - 1) + '">' + (k.cols ? tr(k.cols, ' kth') : '') +
            k.rows.map(function (r, j) { return tr(r, j === fl.row ? ' flag' : ''); }).join('') + '</span>';
        }
        if (k.kind === 'sheet' && k.items) {
          return (k.head ? '<span class="kshh"><b>' + esc(k.head) + '</b><i></i></span>' : '') +
            '<span class="ksh">' + k.items.slice(0, 3).map(function (p) {
              return '<span class="kp"><span class="kpimg">' + prodArt(p.art) + '</span>' +
                '<b>' + esc(p.name) + '</b>' + (p.sku ? '<small>' + esc(p.sku) + '</small>' : '') +
                (p.price ? '<em>' + esc(p.price) + '</em>' : '') + '</span>';
            }).join('') + '</span>';
        }
        if (k.kind === 'tracker' && k.rows) {
          var cols = k.cols || ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'];
          var MK = { s: '<i class="tm s"></i>', r: '<i class="tm r"><svg viewBox="0 0 12 12"><path d="M3.2 6.2l1.9 1.9L8.9 4" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></i>',
                     n: '<i class="tm n"></i>', '-': '<i class="tm"></i>' };
          return '<span class="kk" style="--n:' + cols.length + '"><span class="kkr kth"><span>' + esc(k.who || 'Store') + '</span>' +
            cols.map(function (c) { return '<span class="kc">' + esc(c) + '</span>'; }).join('') + '<span>Next</span></span>' +
            k.rows.map(function (r) {
              var m = String(r.marks || '');
              return '<span class="kkr' + (/n/.test(m) ? ' now' : '') + '"><span>' + esc(r.name) + '</span>' +
                cols.map(function (c, j) { return '<span class="kc">' + (MK[m.charAt(j)] || MK['-']) + '</span>'; }).join('') +
                '<span class="kx">' + esc(r.next || '') + '</span></span>';
            }).join('') + '</span>';
        }
        /* the written document (2026-09-24). The other three kinds are all grids of short values and none of
           them can hold a sentence, so a lead whose day produces a brief, a script, an outline or a draft had
           nowhere to put it and got forced into a table. Label down the left, their actual line beside it,
           one row pulled out in the accent. */
        if (k.kind === 'brief' && k.rows) {
          return (k.head ? '<span class="kshh"><b>' + esc(k.head) + '</b><i></i></span>' : '') +
            '<span class="kb">' + k.rows.slice(0, 4).map(function (r) {
              return '<span class="kbr' + (r.pull ? ' pull' : '') + '"><b>' + esc(r.label) + '</b>' +
                '<em>' + esc(r.text) + '</em></span>';
            }).join('') + '</span>';
        }
        return '<span class="kl">' + items.slice(0, 3).map(function (t) {
          return '<span><i></i><em>' + esc(String(t).replace(/\.$/, '')) + '</em></span>';
        }).join('') + '</span>';
      }
      var artHTML = outs.map(function (o, i) {
        var k = KEEP[i] || {};
        var items = ((S.day_bullets || [])[i] || []).slice(0, 3);
        var t = String(((days[i] || {}).title) || '').split('|').join(' ').replace(/\s+/g, ' ').replace(/\.$/, '').trim();
        if (!items.length) items = [o];
        var kind = kindOf(items.join(' ') + ' ' + t);
        var lab = k.name || KIND_LABEL[kind] || ('Day ' + (i + 1));
        if (!k.name && labels.indexOf(lab) > -1) lab = lab.replace('The ', 'The second ');   /* two days, one kind */
        labels[i] = lab;
        var foot = k.foot || k.foot_tag ? '<span class="kfoot"><span>' + esc(k.foot || '') + '</span>' +
          (k.foot_tag ? '<em>' + esc(k.foot_tag) + '</em>' : '') + '</span>' : '';
        return '<figure class="tkart a' + (i + 1) + ' k-' + esc(k.kind || 'list') + '" data-i="' + i + '">' +
          '<span class="tkatop"><b>Day ' + (i + 1) + '</b><span>' + esc(k.name ? k.name : kind) + '</span>' +
            (k.status ? '<em>' + esc(k.status) + '</em>' : '') + '</span>' +
          '<span class="mkhead">' + esc(k.title || t) + '</span>' +
          mockBody(k, items) + foot + '</figure>';
      }).join('');
      take.classList.add('tkkit');
      take.innerHTML =
        '<div class="tkgrid">' +
          '<div class="tkstack" aria-hidden="true">' + artHTML + '</div>' +
          '<div class="tkside">' +
            '<h2 class="sh">' + esc(S.keep_title || 'Three days in, you have the thing itself.') + '</h2>' +
            '<p class="slede">' + esc(S.days_intro || LP.days_intro || '') + '</p>' +
            '<ol class="tkrows">' + outs.map(function (o, i) {
              return '<li data-i="' + i + '"><span class="tkday">Day ' + (i + 1) + '</span><div><b>' + esc(labels[i] || ('Day ' + (i + 1))) +
                '</b><p>' + esc(o) + '</p></div></li>';
            }).join('') + '</ol></div>' +
        '</div>';
      q('.tkside', take).insertAdjacentHTML('beforeend', ctaBlock('Hold my seat for the three days', 'Free · Nothing to pay'));
      P.insertBefore(take, closing);
      /* The three documents read one at a time (2026-09-23): a slow loop brings one card forward, sharp and a
         shade larger, and lets the other two sit back blurred, with a drawn arrow tying that card to its own day
         in the list. Pointing at a card or its day row takes the loop over and holds it there; moving away hands
         it back where it left off. */
      (function () {
        var grid = q('.tkgrid', take), stack = q('.tkstack', take), rows = q('.tkrows', take);
        if (!grid || !stack || !rows) return;
        var cards = qa('.tkart', stack), n = Math.min(cards.length, rows.children.length);
        if (!n) return;

        var wire = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        wire.setAttribute('class', 'tkwire');
        wire.setAttribute('aria-hidden', 'true');
        grid.appendChild(wire);

        var still = window.matchMedia ? matchMedia('(prefers-reduced-motion:reduce)') : { matches: false };
        var at = 0, held = null, timer = null;

        function paint() { grid.setAttribute('data-focus', held === null ? at : held); }

        /* one curve per day, measured off the live boxes so it survives reflow and late fonts */
        function draw() {
          var gb = grid.getBoundingClientRect();
          if (!gb.width) return;
          wire.setAttribute('viewBox', '0 0 ' + gb.width.toFixed(1) + ' ' + gb.height.toFixed(1));
          wire.setAttribute('width', gb.width.toFixed(1));
          wire.setAttribute('height', gb.height.toFixed(1));
          var out = '';
          for (var i = 0; i < n; i++) {
            var cb = cards[i].getBoundingClientRect(), rb = rows.children[i].getBoundingClientRect();
            var x1 = cb.right - gb.left - 4, y1 = cb.top + cb.height / 2 - gb.top;
            var x2 = rb.left - gb.left - 13, y2 = rb.top + rb.height / 2 - gb.top;
            if (x2 - x1 < 26) continue;                    /* no room in the gutter: draw nothing, not a scribble */
            var mx = x1 + (x2 - x1) * 0.55;
            out += '<path class="tkw" data-i="' + i + '" d="M' + x1.toFixed(1) + ' ' + y1.toFixed(1) +
              'C' + mx.toFixed(1) + ' ' + y1.toFixed(1) + ' ' + mx.toFixed(1) + ' ' + y2.toFixed(1) +
              ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1) + '"/>' +
              '<path class="tkh" data-i="' + i + '" d="M' + (x2 - 7).toFixed(1) + ' ' + (y2 - 4.6).toFixed(1) +
              'L' + x2.toFixed(1) + ' ' + y2.toFixed(1) + 'L' + (x2 - 7).toFixed(1) + ' ' + (y2 + 4.6).toFixed(1) + '"/>';
          }
          wire.innerHTML = out;
          qa('.tkw', wire).forEach(function (pth) {
            pth.style.setProperty('--len', pth.getTotalLength().toFixed(1));
          });
        }

        function tick() { at = (at + 1) % n; paint(); }
        function run() { if (!timer && !still.matches) timer = setInterval(tick, 4400); }
        function stop() { if (timer) { clearInterval(timer); timer = null; } }

        qa('[data-i]', take).forEach(function (x) {
          var k = parseInt(x.getAttribute('data-i'), 10);
          if (isNaN(k) || k >= n) return;
          x.addEventListener('mouseenter', function () { held = k; stop(); paint(); });
          x.addEventListener('mouseleave', function () { held = null; at = k; paint(); run(); });
        });

        draw(); paint();
        var re;
        window.addEventListener('resize', function () { clearTimeout(re); re = setTimeout(draw, 160); }, { passive: true });
        if (window.ResizeObserver) new ResizeObserver(function () { draw(); }).observe(grid);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);

        /* the loop only turns while the section is on screen */
        if (window.IntersectionObserver) {
          new IntersectionObserver(function (es) {
            es.forEach(function (e) {
              if (e.isIntersecting) { draw(); if (held === null) run(); } else stop();
            });
          }, { threshold: 0.2 }).observe(take);
        } else run();
      })();
      /* light, medium and dark of the lead's own colours, one per day (2026-09-23). On the dark card the accent is
         the first of their colours that still reads at 4.5:1, so every lead's third card stays legible */
      (function () {
        var dark = q('.tkart.a3', take);
        if (!dark) return;
        var probe = document.createElement('i');
        dark.appendChild(probe);
        var rgb = function (c) {
          var m = String(c).match(/[\d.]+/g) || [];
          return /^color\(/.test(c) ? m.slice(0, 3).map(function (v) { return v * 255; }) : m.slice(0, 3).map(Number);
        };
        var lum = function (c) {
          return rgb(c).reduce(function (sum, v, k) {
            v /= 255;
            return sum + (v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4)) * [.2126, .7152, .0722][k];
          }, 0);
        };
        var bg = lum(getComputedStyle(dark).backgroundColor);
        var pick = ['var(--accent2)', 'color-mix(in srgb,var(--accent2) 55%,#fff)', 'color-mix(in srgb,var(--accent) 45%,#fff)', '#fff']
          .filter(function (c) {
            probe.style.color = c;
            var l = lum(getComputedStyle(probe).color);
            return (Math.max(l, bg) + .05) / (Math.min(l, bg) + .05) >= 4.5;
          })[0];
        dark.removeChild(probe);
        if (pick) dark.style.setProperty('--kc-acc', pick);
      })();
      /* the route is drawn through the discs themselves, after layout, so it can never cross the copy */
      var drawRoute = function () {
        var route = q('.tkroute', take), svg = q('.tkpath', take);
        if (!route || !svg) return;
        var box = route.getBoundingClientRect();
        var pts = qa('.tkdisc', route).map(function (d) {
          var r = d.getBoundingClientRect();
          return [r.left - box.left + r.width / 2, r.top - box.top + r.height / 2];
        });
        if (pts.length < 2) return;
        svg.setAttribute('viewBox', '0 0 ' + Math.round(box.width) + ' ' + Math.round(box.height));
        svg.setAttribute('width', Math.round(box.width));
        svg.setAttribute('height', Math.round(box.height));
        var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
        for (var i = 1; i < pts.length; i++) {
          var a0 = pts[i - 1], b0 = pts[i], mx = (a0[0] + b0[0]) / 2;
          d += ' C' + mx.toFixed(1) + ' ' + a0[1].toFixed(1) + ', ' + mx.toFixed(1) + ' ' + b0[1].toFixed(1) +
               ', ' + b0[0].toFixed(1) + ' ' + b0[1].toFixed(1);
        }
        q('path', svg).setAttribute('d', d);
      };
      drawRoute();
      setTimeout(drawRoute, 400);
      addEventListener('resize', drawRoute);
    }

    var BIO = S.bio || LP.bio || '';
    if (BIO && S.host_section) {      /* off: the fit check already carries her photo and story */
      var host = el('section', 'sect z');
      host.id = 'host';
      host.innerHTML = '<div class="hostin">' +
        '<div class="hostpic"><img src="img/headshot.jpg" alt="' + esc(LP.name || FIRST) + '"></div>' +
        '<div><p class="seye">Who is running it</p>' +
        '<h2 class="sh">' + esc(LP.name || FIRST) + '</h2>' +
        '<p class="hostbio">' + esc(BIO) + '</p>' +
        '<p class="hostrun">' + esc(FIRST + ' runs all three days. No panel, no guest carousel.') + '</p></div></div>';
      P.insertBefore(host, closing);
    }

    var qs = [
      ['Is it really free?', 'Yes. Three days, live with ' + FIRST + ', no card and nothing to buy on the way in.'],
      ['What if I cannot make a session?', 'Register anyway. The replay of each day goes out the same evening and stays up for a week.'],
      ['How much time does it take?', 'About an hour a day, plus the work you do in the room on your own product.'],
      ['Do I need anything ready?', prepAnswer()]
    ];
    var faq = el('section', 'sect z');
    faq.id = 'faq';
    faq.innerHTML = '<div class="faqhead"><div class="faqtitle">' +
      '<h2 class="sh">The questions people ask.</h2></div>' +
      '<p class="faqnote">' + esc('If yours is not here, reply to the email and ask. ' + FIRST + ' answers them.') +
      '</p></div>' +
      '<ol class="faqlist">' + qs.map(function (r, i) {
        return '<li class="faqi' + (i === 0 ? ' open' : '') + '">' +
          '<button class="faqq" type="button" aria-expanded="' + (i === 0 ? 'true' : 'false') + '">' +
          '<span class="faqn">' + (i < 9 ? '0' : '') + (i + 1) + '</span>' +
          '<b>' + esc(r[0]) + '</b>' +
          '<span class="faqx" aria-hidden="true"><i></i><i></i></span></button>' +
          '<div class="faqa"><div><p>' + esc(r[1]) + '</p></div></div></li>';
      }).join('') + '</ol>';
    P.insertBefore(faq, closing);
    /* one open at a time: the list stays short enough to scan, and the open one is unmistakable */
    faq.addEventListener('click', function (e) {
      var btn = e.target.closest('.faqq');
      if (!btn) return;
      var li = btn.parentNode, was = li.classList.contains('open');
      qa('.faqi', faq).forEach(function (x) {
        x.classList.remove('open');
        var b = q('.faqq', x); if (b) b.setAttribute('aria-expanded', 'false');
      });
      if (!was) { li.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
    });
  }

  /* the numbers band: one figure leads, the rest support it, each with where it comes from */
  function statsBand() {
    var band = $('band'), box = $('bstats');
    if (!band || !box || band.classList.contains('rebuilt')) return;
    var stats = (LP.stats || []).slice(0, 4);
    if (!stats.length) return;
    var host = function (u) {
      try { return String(u).replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, ''); } catch (e) { return ''; }
    };
    var lead = stats[0], rest = stats.slice(1);
    box.innerHTML =
      '<div class="bhead"><p class="beye">' + esc(S.stats_eye || 'The actual numbers') + '</p>' +
      '<p class="bnote">' + esc(S.stats_note || ('Public, from ' + (LP.brand || 'their own pages') + '.')) + '</p></div>' +
      '<div class="blead"><b>' + esc(lead.num) + '</b><span>' + esc(lead.label) + '</span>' +
      (lead.source ? '<i>' + esc(host(lead.source)) + '</i>' : '') + '</div>' +
      '<div class="brest">' + rest.map(function (t) {
        return '<div class="bst"><b>' + esc(t.num) + '</b><span>' + esc(t.label) + '</span>' +
          (t.source ? '<i>' + esc(host(t.source)) + '</i>' : '') + '</div>';
      }).join('') + '</div>';
    box.removeAttribute('style');
    band.classList.add('rebuilt');
    var line = $('bline');
    if (line) line.remove();
  }

  /* the hero video reads as a device playing something: iOS-style controls, elapsed time, a creeping scrubber */
  function playerUI() {
    var scr = q('.ip-screen');
    if (!scr || q('.uic', scr)) return;
    qa('.ip-chip, .ip-scrub, .ip-play', scr).forEach(function (n) { n.remove(); });
    var total = S.video_len || 92;
    var bar = el('div', 'uic',
      '<button class="uipl" type="button" aria-label="Play">' +
        '<svg viewBox="0 0 24 24" width="13" height="13"><path d="M8 5.4v13.2c0 .8.9 1.3 1.6.9l10.4-6.6c.6-.4.6-1.3 0-1.7L9.6 4.5c-.7-.4-1.6 0-1.6.9z" fill="currentColor"/></svg>' +
      '</button>' +
      '<span class="uit el">0:03</span>' +
      '<span class="uitrack"><i></i><b></b></span>' +
      '<span class="uit rem">-1:29</span>' +
      '<button class="uimute" type="button" aria-label="Unmute">' +
        '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M4 9h3.2L12 5v14l-4.8-4H4z" fill="currentColor"/>' +
        '<path d="M16.5 9.5l4 5M20.5 9.5l-4 5" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/></svg>' +
      '</button>');
    scr.appendChild(bar);
    var centre = el('button', 'uibig', '<span>' +
      '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M8 5.4v13.2c0 .8.9 1.3 1.6.9l10.4-6.6c.6-.4.6-1.3 0-1.7L9.6 4.5c-.7-.4-1.6 0-1.6.9z" fill="currentColor"/></svg>' +
      '</span><em>Tap for sound</em>');
    centre.type = 'button';
    scr.appendChild(centre);
    var fill = q('.uitrack i', bar), knob = q('.uitrack b', bar);
    var elp = q('.uit.el', bar), rem = q('.uit.rem', bar), t = 3;
    var fmt = function (v) { return Math.floor(v / 60) + ':' + (v % 60 < 10 ? '0' : '') + Math.floor(v % 60); };
    setInterval(function () {
      t = (t + 1) % total;
      var pct = (t / total) * 100;
      fill.style.width = pct.toFixed(1) + '%';
      knob.style.left = pct.toFixed(1) + '%';
      elp.textContent = fmt(t);
      rem.textContent = '-' + fmt(total - t);
    }, 1000);
    [bar, centre].forEach(function (n) {
      n.addEventListener('click', function () { $('modal').classList.add('on'); });
    });
  }

  function start() {
    styleTokens();
    skinTokens();
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
    playerUI();
    restoreChecks();
    fitCopy();
    dayDetail();
    bodySections();
    factsStrip();
    statsBand();
    testimonial();
    scrollCue();
    nameTicker();
    headerScroll();
    var wrap = gated();

    closingForm();
    stuck();
    exitCatch();
    dock();
    REG = modal();
    toast();
    brandMark();
    hostMark();
    stickyVideo();
    setTimeout(ctaIcons, 0);
    skinDecor();
    lockBar(wrap);
    clocks();
    seatTicker();

    layout();
    window.addEventListener('resize', debounce(layout, 140));
    window.addEventListener('load', function () { setTimeout(layout, 50); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(layout, 30); });
    setTimeout(layout, 400);
    if (WEBINAR && window.LP_webinarize) { window.LP_webinarize(document.body); setTimeout(layout, 20); }
    setTimeout(function () { background(); window.SITE_READY = { w: P.clientWidth, h: P.offsetHeight }; }, 900);
    var shown = false;
    function reveal() {
      if (shown) return;
      shown = true; layout();
      skinMotion();
      requestAnimationFrame(function () { document.documentElement.classList.add('sready'); });
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(reveal);
    setTimeout(reveal, 700);
  }

  ready(start);
})();
