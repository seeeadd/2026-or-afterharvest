/* Hosted version only (scripts/build_site.py writes window.SITE next to window.LP).
   Adds: the blur gate with the reply CTA, the registration modal, the bottom-left toast, the sticky vertical
   video and the testimonial strip. Nothing here runs for the Canva screenshot, which loads lp.js alone. */
(function () {
  var S = window.SITE || {}, LP = window.LP || {};
  var accentInk = getComputedStyle(document.documentElement).getPropertyValue('--accent-ink') || '#fff';
  var el = function (tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  var initials = function (name) {
    return (name || '').trim().split(/\s+/).slice(0, 2).map(function (w) { return w[0] || ''; }).join('').toUpperCase();
  };
  var mailto = function () {
    return 'mailto:' + encodeURIComponent(S.reply_to || '') +
      '?subject=' + encodeURIComponent(S.subject || ('Unlock the full page for ' + (LP.brand || ''))) +
      '&body=' + encodeURIComponent(S.body || 'Yes, send me the full page.');
  };

  /* ------------------------------------------------------------ testimonial */
  function testimonial() {
    var t = S.testimonial;
    if (!t) return null;
    var sec = el('section', 'z');
    sec.id = 'tst';
    var thumb = t.image
      ? '<img src="' + t.image + '" alt="">'
      : '<canvas width="640" height="400"></canvas>';
    sec.innerHTML =
      '<div class="tcard">' +
        '<div class="tvid">' + thumb +
          '<span class="tplay"><i><svg width="20" height="20" viewBox="0 0 24 24"><path d="M8 5.2v13.6c0 .8.9 1.3 1.6.9l10.7-6.8c.6-.4.6-1.3 0-1.7L9.6 4.3c-.7-.4-1.6 0-1.6.9z" fill="currentColor"/></svg></i></span>' +
          '<span class="tspeed"><b>' + (t.speed || '1.2\u00D7') + '</b><s>' + (t.length || '2 min 13 sec') + '</s>\u26A1 ' +
            (t.short || '1 min 51 sec') + '</span>' +
        '</div>' +
        '<div><p class="tq">' + (t.quote || '') + '</p>' +
          '<div class="twho"><span class="tav">' + initials(t.name) + '</span>' +
            '<div><b>' + (t.name || '') + '</b><span>' + (t.role || '') + '</span></div></div></div>' +
      '</div>';
    var c = sec.querySelector('canvas');
    if (c) {  // brand-tinted stand-in, so no stranger's face carries an invented quote
      var x = c.getContext('2d'), a = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#e2662f';
      var g = x.createLinearGradient(0, 0, 640, 400);
      g.addColorStop(0, a); g.addColorStop(1, '#14161b');
      x.fillStyle = g; x.fillRect(0, 0, 640, 400);
      x.globalAlpha = .18; x.fillStyle = '#fff';
      for (var i = 0; i < 9; i++) x.beginPath(), x.arc(90 + i * 62, 300 - i * 19, 120 - i * 9, 0, 7), x.fill();
    }
    return sec;
  }

  /* -------------------------------------------------------------- the gate
     Nothing we actually built gets blurred. The page runs to its end, then continues into invented sections
     (what you get, the workbook, questions, the upgrade) and those are what sits behind the lock. */
  function fakeSections(ev, who) {
    var card = function (t, b) { return '<div class="fkc"><b>' + t + '</b><p>' + b + '</p></div>'; };
    var qa = function (q) { return '<li><b>' + q + '</b><span>+</span></li>'; };
    var h = '';
    h += '<section class="fks"><p class="eyebrow c">Everything you get</p>' +
         '<h2 class="disp">Three days, and the pieces you keep.</h2>' +
         '<div class="fkgrid">' +
           card('The live sessions', 'Three working sessions with ' + who + ', replays for seven days.') +
           card('The workbook', 'The same sheets used on screen, ready to fill in during the session.') +
           card('The pitch checklist', 'What to have ready before you contact a single store.') +
         '</div></section>';
    h += '<section class="fks"><div class="fkwork"><div class="fkshot"></div>' +
         '<div><p class="eyebrow">Day by day</p><h3 class="disp">The workbook you fill in live.</h3>' +
         '<p>Margins, minimums, the buyer list and the follow-up, in one file you keep after ' + ev + '.</p>' +
         '<span class="fkbtn">Hold my seat</span></div></div></section>';
    h += '<section class="fks"><p class="eyebrow c">Questions</p><h2 class="disp">Before you hold a seat.</h2>' +
         '<ul class="fkq">' + qa('Do I need anything ready before day one?') + qa('What if I cannot make a session live?') +
         qa('Is this right for a brand that has never sold wholesale?') + qa('What happens after the three days?') +
         '</ul></section>';
    h += '<section class="fks"><div class="fkprice"><p class="eyebrow">After the three days</p>' +
         '<h3 class="disp">Keep going with the full program.</h3><p>Optional, and only if the three days land.</p>' +
         '<span class="fkbtn">See the options</span></div></section>';
    var wrap = el('div');
    wrap.id = 'fake';
    wrap.innerHTML = h;
    return wrap;
  }

  function gate() {
    var page = document.getElementById('page');
    if (!page) return;
    var foot = page.querySelector('.foot');
    var fake = fakeSections(LP.event || 'the event', LP.first || (LP.name || '').split(' ')[0] || 'me');
    var wrap = el('div');
    wrap.id = 'gatewrap';
    var inner = el('div', 'gated');
    inner.appendChild(fake);
    wrap.appendChild(inner);
    if (foot) page.insertBefore(wrap, foot); else page.appendChild(wrap);

    var g = el('div');
    g.id = 'gate';
    g.innerHTML =
      '<img class="glock" src="' + (S.lock || 'img/lock.png') + '" alt="">' +
      '<b>' + (S.gate_title || 'Unlock this full page') + '</b>' +
      '<a class="ubtn" href="' + mailto() + '">' + (S.gate_cta || 'Show me the full page') +
        '<svg width="14" height="14" viewBox="0 0 16 16"><path d="M3 8h9.5M8.6 3.8 12.8 8l-4.2 4.2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg></a>';
    document.body.appendChild(g);
    var grow = function () {
      var r = wrap.getBoundingClientRect(), vh = innerHeight;
      var into = vh * 0.82 - r.top;
      var on = into > 0 && r.bottom > vh * 0.12;
      g.classList.toggle('on', on);
      if (!on) return;
      var span = Math.max(240, r.height * 0.7);
      var pct = Math.max(0, Math.min(1, into / span));
      var max = innerWidth <= 560 ? 1.16 : 1.42;
      g.style.setProperty('--gs', (1 + pct * (max - 1)).toFixed(3));
    };
    grow();
    addEventListener('scroll', grow, {passive: true});
    addEventListener('resize', grow);
  }

  /* ------------------------------------------------------- registration modal
     Our own: a live strip across the top (pulsing dot, ticking clock, room button), the seat count in the
     brand colour with a filling bar, then the form. */
  function modal() {
    var m = el('div');
    m.id = 'modal';
    var who = LP.name || '', first = LP.first || who.split(' ')[0] || 'me';
    m.innerHTML =
      '<div class="mcard"><span class="mrail"></span>' +
        '<button class="mx" aria-label="Close">\u2715</button>' +
        '<div class="mlive"><span class="mdot"></span><b>Room open</b>' +
          '<span class="mclock" id="mClock">00:00:00</span>' +
          '<span class="mzoom"><svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">' +
          '<path d="M4 7h9a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zm12 3.4 4.2-2.6c.5-.3 1.1.1 1.1.7v7c0 .6-.6 1-1.1.7L16 13.6z"/>' +
          '</svg>Zoom live</span></div>' +
        '<h3>Hold your seat for <em>' + (LP.event || 'the three days') + '</em>.</h3>' +
        '<p class="msub">Three days, live with ' + first + '. Replays for seven days.</p>' +
        '<div class="mseats"><div class="mnum"><b id="mCount" data-seat>' + seatTotal.toLocaleString() + '</b> registered' +
          '<span id="mRecent">' + (S.names || ['Maya'])[0] + ' just now</span></div>' +
          '<div class="mbar"><i id="mFill"></i></div></div>' +
        '<div class="mrow"><input class="mfield" placeholder="First name"><input class="mfield" placeholder="you@yourdomain.com"></div>' +
        '<button class="mgo">Hold my seat \u2192</button>' +
        '<p class="mticks"><span>\u2713 Free</span><span>\u2713 3 days live</span><span>\u2713 Replays 7 days</span></p>' +
        '<div class="mfoot"><img src="' + (S.avatar || 'img/headshot.jpg') + '" alt=""><div>See you there,<br><b>' + who +
          '</b> \u00B7 ' + (LP.brand || '') + '</div></div>' +
      '</div>';
    document.body.appendChild(m);
    m.querySelector('.mx').onclick = function () { m.classList.remove('on'); };
    m.onclick = function (e) { if (e.target === m) m.classList.remove('on'); };
    m.querySelector('.mgo').onclick = function () { window.location.href = mailto(); };
    document.querySelectorAll('.btn, #regcard .btn, .form .btn').forEach(function (b) {
      b.style.cursor = 'pointer';
      b.addEventListener('click', function (e) { e.preventDefault(); m.classList.add('on'); });
    });
    // it keeps moving while they look at it
    var fill = m.querySelector('#mFill'), recent = m.querySelector('#mRecent'),
        names = S.names || ['Maya'], k = 0, pct = 62;
    fill.style.width = pct + '%';
    setInterval(function () {
      k++;
      recent.textContent = names[k % names.length] + ' just now';
      pct = Math.min(96, pct + 0.7);
      fill.style.width = pct.toFixed(1) + '%';
    }, 9000);
  }

  /* --------------------------------------------------------------- the toast */
  function toast() {
    var names = S.names || ['Maya', 'Devon', 'Priya', 'Sam', 'Ali', 'Jordan'];
    var t = el('div');
    t.id = 'toast';
    t.innerHTML = '<span class="tav"></span><div><b></b><span></span></div><span class="tdot"></span>';
    document.body.appendChild(t);
    var i = 0;
    var show = function () {
      var n = names[i % names.length], mins = 2 + ((i * 7) % 26);
      t.querySelector('.tav').textContent = initials(n);
      t.querySelector('b').textContent = n + ' just registered';
      t.querySelector('span:not(.tav):not(.tdot)').textContent = mins + ' minutes ago';
      t.classList.add('on');
      i++;
      setTimeout(function () { t.classList.remove('on'); }, 5200);
    };
    setTimeout(show, 3200);
    setInterval(show, 13000);
  }

  /* ------------------------------------------------------ sticky vertical video */
  function sticky() {
    if (!S.sticky) return;
    var caps = S.sticky.captions || ["THIS ONE IS COMPLETELY <em>FREE</em>.",
                                     "THREE DAYS, <em>LIVE</em> WITH ME.",
                                     "I WILL SHOW YOU THE <em>WHOLE PLAN</em>."];
    var s = el('div');
    s.id = 'stick';
    s.innerHTML =
      '<div class="scard">' +
        '<img class="sv" src="' + S.sticky.image + '" alt="">' +
        '<button class="sx" aria-label="Close">\u2715</button>' +
        '<span class="sunmute"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M2.5 6h2.6L8.6 3v10L5.1 10H2.5z"/>' +
          '<path d="M11 6l4 4M15 6l-4 4" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>' +
          (S.sticky.unmute || 'Unmute') + '</span>' +
        '<span class="scap"><b>' + caps[0] + '</b></span>' +
        '<span class="sclick">' + (S.sticky.tap || 'Click here to unmute') + '</span>' +
        '<span class="sbar"><i></i></span>' +
      '</div>' +
      '<a class="scta">' + (S.sticky.cta || 'Save my free seat') +
        '<svg width="13" height="13" viewBox="0 0 16 16"><path d="M3 8h9.5M8.6 3.8 12.8 8l-4.2 4.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>';
    document.body.appendChild(s);
    var cap = s.querySelector('.scap b'), i = 0;
    setInterval(function () { i = (i + 1) % caps.length; cap.innerHTML = caps[i]; }, 2600);   // it reads as playing
    s.querySelector('.sx').onclick = function (e) { e.stopPropagation(); s.classList.remove('on'); };
    s.onclick = function () { document.getElementById('modal').classList.add('on'); };
    setTimeout(function () { s.classList.add('on'); }, 1800);
  }

  /* ------------------------------------------ social proof on the register card */
  function proof() {
    var card = document.getElementById('regcard');
    if (!card || S.proof === false) return;
    var seats = S.names || ['Maya', 'Devon', 'Priya', 'Sam', 'Alix'];
    var tints = ['#f2d3bd', '#cfe0f1', '#e4ded2', '#dfe8cf', '#d8d4ea'];
    var stack = seats.slice(0, 5).map(function (n, i) {
      return '<span style="background:' + tints[i % tints.length] + '">' + initials(n) + '</span>';
    }).join('') + '<span class="more">+</span>';
    var d = el('div');
    d.id = 'proof';
    d.innerHTML =
      '<div class="pav"><div class="pstack">' + stack + '</div>' +
        '<span class="pstars"><i>\u2605\u2605\u2605\u2605\u2605</i>' + (S.rating || '4.9') + '</span></div>' +
      '<p class="pline"><b data-seat>' + seatTotal.toLocaleString() + '</b>&nbsp;registered</p>' +
      '<p class="pline"><span class="pdot g"></span><span class="pmono">' + (S.last24 || '18') +
        ' registered in the last 24 hours</span></p>' +
      '<p class="pline"><span class="pdot a"></span><span class="pmono"><b>' + seats[0] +
        '</b> just registered <em>\u00B7 12 minutes ago</em></span></p>';
    var btn = card.querySelector('.btn');
    if (btn) card.insertBefore(d, btn); else card.appendChild(d);
  }

  /* the page should look alive: the nav clock runs and the modal clock runs with it */
  function clocks() {
    var days = S.starts_in_days || 9;
    var target = Date.now() + days * 864e5 + 3 * 36e5;
    var nav = document.querySelectorAll('.cdn b');
    var mc = function () { return document.getElementById('mClock'); };
    var tick = function () {
      var d = Math.max(0, target - Date.now()), s = Math.floor(d / 1000);
      var dd = Math.floor(s / 86400), hh = Math.floor(s % 86400 / 3600), mm = Math.floor(s % 3600 / 60), ss = s % 60;
      var p = function (v) { return (v < 10 ? '0' : '') + v; };
      if (nav[0]) nav[0].textContent = p(dd);
      if (nav[1]) nav[1].textContent = p(hh);
      if (nav[2]) nav[2].textContent = p(mm);
      if (nav[3]) nav[3].textContent = p(ss);
      var c = mc();
      if (c) c.textContent = p(hh) + ':' + p(mm) + ':' + p(ss);
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ------------------------------------------------------- the live seat count
     One number, shown in the announcement bar, on the register card and in the modal, ticking up together. */
  var seatTotal = parseInt(String(S.registered || '1204').replace(/\D/g, ''), 10) || 1204;
  function paintSeats(flash) {
    document.querySelectorAll('[data-seat]').forEach(function (n) {
      n.textContent = seatTotal.toLocaleString();
      if (!flash) return;
      n.classList.add('tick');
      setTimeout(function () { n.classList.remove('tick'); }, 700);
    });
  }
  function seatTicker() {
    paintSeats(false);
    setInterval(function () { seatTotal += 1 + (seatTotal % 2); paintSeats(true); }, 8000);
  }

  /* --------------------------------------------------------- announcement bar
     A slim strip above the header: same brand, its own row, sticky with it. */
  function topbar() {
    if (S.topbar === false) return;
    var ev = LP.event || '3-day live event';
    var bar = el('div');
    bar.id = 'topbar';
    bar.innerHTML =
      '<span class="tbin"><span class="tbdot"></span>' +
      '<b data-seat>' + seatTotal.toLocaleString() + '</b>+ ' +
      (S.topbar_text || ('have registered for ' + ev)) + '</span>';
    document.body.insertBefore(bar, document.body.firstChild);
    bar.onclick = function () { document.getElementById('modal').classList.add('on'); };
  }

  /* ------------------------------------------------------------ hero layout
     Hosted, the hero follows the reference: video top left with a booking card under it, and the date pill,
     headline, copy and register card down the right. The pieces are the page's own, only re-stacked. */
  function hero() {
    var hero = document.getElementById('hero');
    var stage = document.getElementById('stagebox');
    if (!hero || !stage) return;
    var phone = document.getElementById('iphone'), reg = document.getElementById('regcard');
    var eye = document.getElementById('heroEye'), h1 = document.getElementById('headline'),
        lede = document.getElementById('lede');
    var grid = el('div', 'hgrid'), left = el('div', 'hleft'), right = el('div', 'hright');
    grid.appendChild(left); grid.appendChild(right);
    hero.appendChild(grid);
    // trust strip above the video: badge, faces, stars, count
    var tr = S.trust || {};
    var names = S.names || ['Maya', 'Devon', 'Priya', 'Sam', 'Alix'];
    var tints = ['#f2d3bd', '#cfe0f1', '#e4ded2', '#dfe8cf', '#d8d4ea'];
    var faces = names.slice(0, 5).map(function (n, i) {
      return '<span style="background:' + tints[i % tints.length] + '">' + initials(n) + '</span>';
    }).join('');
    var strip = el('div', 'htrust');
    strip.innerHTML =
      '<span class="htbadge"><b>' + (tr.badge_top || 'Top rated') + '</b>' + (tr.badge_bot || (LP.brand || 'Live event')) + '</span>' +
      '<span class="htfaces">' + faces + '</span>' +
      '<span class="htstars"><i>\u2605\u2605\u2605\u2605\u2605</i><b>Trusted by over ' +
        (tr.count || '1,793') + '</b>' + (tr.label || 'makers') + '</span>';
    left.appendChild(strip);
    left.appendChild(phone);
    // booking card under the video
    var book = el('div', 'hbook');
    book.innerHTML =
      '<span class="hbtag">' + (S.book_tag || 'Secure your free spot') + '</span>' +
      '<div class="hbrow"><div class="hbwhen"><b>' + (S.when || 'Three days') + '</b>' +
        '<span>' + (S.when_sub || 'Live online, replays for 7 days') + '</span></div>' +
        '<span class="btn lg hbgo">Hold my seat<svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 8h9.5M8.6 3.8 12.8 8l-4.2 4.2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>';
    left.appendChild(book);
    [eye, h1, lede, reg].forEach(function (n) { if (n) right.appendChild(n); });
    stage.remove();
  }

  /* the header: live dot, "live in", seconds, and a button that keeps catching the eye */
  function seconds() {
    var cd = document.querySelector('.nav .cd');
    if (!cd || cd.querySelector('.sec')) return;
    var sep = el('em'), unit = el('span', 'cdn sec', '<b>00</b><small>sec</small>');
    cd.appendChild(sep); cd.appendChild(unit);
    var label = cd.querySelector('.cdl');
    if (label) {
      label.innerHTML = '<i class="livedot"></i>' + (S.live_label || 'Live in');
      label.classList.add('live');
    }
    var btn = document.querySelector('.nav .btn.sm');
    if (btn) {
      btn.classList.add('halo');
      btn.innerHTML = btn.innerHTML.replace('Hold my seat', S.nav_cta || 'Hold my seat');
    }
  }

  function boot() {
    topbar();
    hero();
    seconds();
    var t = testimonial();
    if (t) {
      var band = document.getElementById('band');
      if (band && band.parentNode) band.parentNode.insertBefore(t, band.nextSibling);
    }
    proof();
    modal();
    if (S.gate !== false) gate();
    toast();
    sticky();
    clocks();
    seatTicker();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
