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

  /* -------------------------------------------------------------- the gate */
  function gate() {
    var page = document.getElementById('page');
    var from = document.getElementById(S.gate_from || 'band');   // everything from this section down is blurred
    if (!page || !from) return;
    var wrap = el('div');
    wrap.id = 'gatewrap';
    var inner = el('div', 'gated');
    page.insertBefore(wrap, from);
    while (from) {
      var next = from.nextElementSibling;
      inner.appendChild(from);
      from = next;
    }
    wrap.appendChild(inner);
    var g = el('div');
    g.id = 'gate';
    g.innerHTML =
      '<img class="glock" src="' + (S.lock || 'img/lock.png') + '" alt="">' +
      '<b>' + (S.gate_title || 'Unlock this full page') + '</b>' +
      '<a class="ubtn" href="' + mailto() + '">' + (S.gate_cta || 'Show me the full page') +
        '<svg width="14" height="14" viewBox="0 0 16 16"><path d="M3 8h9.5M8.6 3.8 12.8 8l-4.2 4.2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg></a>';
    document.body.appendChild(g);
    // it appears when the blurred part comes into view and grows the further they scroll into it
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
    wrap.appendChild(g);
  }

  /* ------------------------------------------------------- registration modal */
  function modal() {
    var m = el('div');
    m.id = 'modal';
    var ev = LP.event || '3-day live event', who = LP.name || '', when = S.when || '';
    m.innerHTML =
      '<div class="mcard"><span class="mtape l"></span><span class="mtape r"></span>' +
        '<button class="mx" aria-label="Close">✕</button>' +
        '<p class="meye">Free 3-day event ·<b>' + when + '</b></p>' +
        '<h3>Hold your seat for <em>the three (3) days</em>.</h3>' +
        '<p class="msub">You will get everything you need to join live for three days.</p>' +
        '<div class="mproof" id="mproof"></div>' +
        '<input class="mfield" placeholder="First name"><input class="mfield" placeholder="you@yourdomain.com">' +
        '<button class="mgo">Hold my seat →</button>' +
        '<p class="mticks">✓ Free &nbsp; ✓ 3 days live with ' + (LP.first || who.split(' ')[0] || 'me') + ' &nbsp; ✓ Show up live</p>' +
        '<div class="mfoot"><img src="' + (S.avatar || 'img/headshot.png') + '" alt=""><div>See you there,<br><b>' + who + '</b> · ' + (LP.brand || '') + '</div></div>' +
      '</div>';
    document.body.appendChild(m);
    var proof = m.querySelector('#mproof');
    proof.innerHTML = '<b>' + (S.registered || '1,204') + '</b> registered<br>' +
      '<span style="opacity:.65">' + (S.names || ['Maya'])[0] + ' just registered · 2 hours ago</span>';
    m.querySelector('.mx').onclick = function () { m.classList.remove('on'); };
    m.onclick = function (e) { if (e.target === m) m.classList.remove('on'); };
    m.querySelector('.mgo').onclick = function () { window.location.href = mailto(); };
    document.querySelectorAll('.btn, #regcard .btn, .form .btn').forEach(function (b) {
      b.style.cursor = 'pointer';
      b.addEventListener('click', function (e) { e.preventDefault(); m.classList.add('on'); });
    });
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
      '<p class="pline"><b>' + (S.registered || '1,204') + '</b>&nbsp;registered</p>' +
      '<p class="pline"><span class="pdot g"></span><span class="pmono">' + (S.last24 || '18') +
        ' registered in the last 24 hours</span></p>' +
      '<p class="pline"><span class="pdot a"></span><span class="pmono"><b>' + seats[0] +
        '</b> just registered <em>\u00B7 12 minutes ago</em></span></p>';
    var btn = card.querySelector('.btn');
    if (btn) card.insertBefore(d, btn); else card.appendChild(d);
  }

  function boot() {
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
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
