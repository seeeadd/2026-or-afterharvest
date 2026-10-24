/* Ana Calin, the two confirmation pages. Settings come from window.CONF in each page. */
(function(){
  var C = window.CONF || {};
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var qs = new URLSearchParams(location.search), reg = {};
  try { reg = JSON.parse(sessionStorage.getItem('ana_reg') || '{}') } catch (e) {}
  var first = (qs.get('first') || qs.get('first_name') || reg.first_name || '').trim().split(/\s+/)[0];
  var email = (qs.get('email') || reg.email || '').trim();
  var ref = (qs.get('ref') || reg.ref || '').trim();
  if (first.length > 30) first = '';

  /* the first name in the headline (never the email) */
  if (first) document.querySelectorAll('[data-first]').forEach(function(e){ e.textContent = ', ' + first });

  /* clicks: action_calendar, action_whatsapp, action_sheet (and the video plays) */
  function track(n){
    try {
      (window.dataLayer = window.dataLayer || []).push({event: n});
      if (window.gtag) gtag('event', n);
      if (window.plausible) plausible(n);
      if (window.fbq) fbq('trackCustom', n);
      if (window.va) va('event', {name: n});
    } catch (e) {}
  }
  document.querySelectorAll('[data-track]').forEach(function(a){ a.addEventListener('click', function(){ track(a.getAttribute('data-track')) }) });

  /* the visitor's own time, when they're outside New York and Greece */
  try {
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && tz !== 'America/New_York' && tz !== 'Europe/Athens') {
      var p = {};
      new Intl.DateTimeFormat('en-US', {weekday:'short', hour:'numeric', minute:'2-digit', hour12:true}).formatToParts(new Date(Date.UTC(2026,10,17,17,0))).forEach(function(x){ p[x.type] = x.value });
      if (p.weekday && p.hour && p.dayPeriod) document.querySelectorAll('.lt').forEach(function(s){ s.textContent = ' · that’s ' + p.weekday + ' ' + p.hour + ':' + p.minute + ' ' + p.dayPeriod.toLowerCase() + ' for you' });
    }
  } catch (e) {}

  /* Google Calendar: one link per day (Google can't add several events from one link) */
  var SHEET = location.origin + location.pathname.replace(/[^\/]*\/[^\/]*$/, '') + 'assets/sheet.pdf';
  var EV = {
    '20261117': ['Free 3-day live workshop · Day 1 with Ana Calin', 'Day 1: find what your readers would pay for. You leave with your one reader, and the problem she\'d pay you to fix.'],
    '20261118': ['Free 3-day live workshop · Day 2 with Ana Calin', 'Day 2: turn it into an offer, with a price. You leave with your offer, in one sentence, priced.'],
    '20261119': ['Free 3-day live workshop · Day 3 with Ana Calin', 'Day 3: write the ask. You leave with your first ask, written, ready to send. Stay to the end: five people there live win a 1:1 with Ana.'],
    '20261120': ['VIP Q&A with Ana Calin', 'Bring your offer, your price or your ask. Ana works on it with you live.']
  };
  document.querySelectorAll('a[data-g]').forEach(function(a){
    var d = a.getAttribute('data-g'), e = EV[d];
    a.href = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
      + '&text=' + encodeURIComponent(e[0])
      + '&dates=' + d + 'T170000Z/' + d + 'T183000Z'
      + '&details=' + encodeURIComponent(e[1] + '\nPrint your sheet before Day 1: ' + SHEET)
      + '&location=' + encodeURIComponent('Your Zoom link is in your email from Ana');
    a.target = '_blank'; a.rel = 'noopener';
  });

  /* links that are settings */
  document.querySelectorAll('[data-link]').forEach(function(a){ var u = C[a.getAttribute('data-link')]; if (u) a.href = u });

  /* the video players. Main: autoplay muted with "tap for sound". Others: click to play. Cover stays when there's no file yet. */
  document.querySelectorAll('.iph[data-src]').forEach(function(ph){
    var src = C[ph.getAttribute('data-src')], v = ph.querySelector('video'), scr = ph.querySelector('.scr');
    if (!src) return;
    var auto = ph.hasAttribute('data-auto') && !reduce;
    function sound(){ v.muted = false; ph.classList.add('on', 'sound'); var pr = v.play(); if (pr && pr.catch) pr.catch(function(){}); track('video_play_' + ph.getAttribute('data-src').toLowerCase()) }
    if (auto) {
      v.src = src; v.muted = true; v.loop = false; v.preload = 'auto';
      var pr = v.play(); if (pr && pr.then) pr.then(function(){ ph.classList.add('on') }).catch(function(){});
    }
    scr.addEventListener('click', function(){
      if (!v.src) v.src = src;
      if (!ph.classList.contains('sound')) { if (auto) v.currentTime = 0; sound() }
      else if (v.paused) v.play(); else v.pause();
    });
    ph.seek = function(t){ if (!v.src) v.src = src; v.currentTime = t; sound() };
  });
  document.querySelectorAll('.chap button').forEach(function(b){
    b.addEventListener('click', function(){
      var ph = document.querySelector('.iph[data-src]');
      if (ph && ph.seek) ph.seek(+b.getAttribute('data-t'));
    });
  });
  document.querySelectorAll('.bo').forEach(function(bo, i){
    bo.addEventListener('click', function(){
      var src = (C.BREAKOUTS || [])[i];
      if (!src || bo.querySelector('video')) return;
      var v = document.createElement('video'); v.src = src; v.controls = true; v.playsInline = true; v.autoplay = true;
      bo.querySelector('.th').appendChild(v); track('video_play_breakout_' + (i + 1));
    });
  });

  /* the question forms: a second Kit form each, the email as a hidden field. With no form id, nothing is sent (demo). */
  document.querySelectorAll('.qf').forEach(function(box){
    var f = box.querySelector('form'), id = C[box.getAttribute('data-form')];
    var em = f.querySelector('input[name=email_address]');
    if (email) em.value = email; else { box.classList.add('need-email'); em.type = 'email'; em.required = true }
    f.addEventListener('submit', function(e){
      e.preventDefault();
      if (!f.reportValidity()) return;
      var b = f.querySelector('button[type=submit]'); b.disabled = true;
      function done(){ box.classList.add('done'); track('question_' + box.getAttribute('data-form').toLowerCase()) }
      if (!id) { done(); return }
      fetch('https://app.kit.com/forms/' + id + '/subscriptions', {method:'POST', body:new URLSearchParams(new FormData(f)), headers:{'Accept':'application/json'}}).then(done, done);
    });
  });

  /* second chance at VIP: back to the VIP page with the name and email, gone after Tue Nov 17, 11:59 pm New York */
  var now0 = qs.get('now') ? Date.parse(qs.get('now')) : Date.now();
  if (C.CLOSES && now0 >= C.CLOSES) document.body.classList.add('vip-closed');
  document.querySelectorAll('a.vipback').forEach(function(a){
    var p = [];
    if (first) p.push('first=' + encodeURIComponent(first));
    if (email) p.push('email=' + encodeURIComponent(email));
    if (ref) p.push('ref=' + encodeURIComponent(ref));
    if (p.length) a.href = a.getAttribute('href') + '?' + p.join('&');
  });

  /* reveal */
  var els = document.querySelectorAll('[data-r]');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }) }, {rootMargin:'0px 0px -8% 0px'});
    els.forEach(function(e){ io.observe(e) });
  } else els.forEach(function(e){ e.classList.add('in') });
})();
