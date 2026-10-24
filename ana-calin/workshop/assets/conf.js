/* Ana Calin, the two confirmation pages. Settings come from window.CONF in each page. */
(function(){
  var C = window.CONF || {};
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var qs = new URLSearchParams(location.search), reg = {};
  try { reg = JSON.parse(sessionStorage.getItem('ana_reg') || localStorage.getItem('ana_reg') || '{}') } catch (e) {}
  var first = (qs.get('first') || qs.get('first_name') || reg.first_name || '').trim().split(/\s+/)[0];
  var email = (qs.get('email') || reg.email || '').trim();
  var ref = (qs.get('ref') || reg.ref || '').trim();
  if (first.length > 30) first = '';

  /* the first name in the headline (never the email) */
  if (first) document.querySelectorAll('[data-first]').forEach(function(e){ e.textContent = ', ' + first });
  if (first) document.querySelectorAll('[data-name]').forEach(function(e){ e.textContent = first });

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
  function gcal(text, d0, details, recur){
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE'
      + '&text=' + encodeURIComponent(text)
      + '&dates=' + d0 + 'T170000Z/' + d0 + 'T183000Z'
      + (recur ? '&recur=' + encodeURIComponent(recur) : '')
      + '&details=' + encodeURIComponent(details)
      + '&location=' + encodeURIComponent('Your Zoom link is in your email from Ana');
  }
  /* one Google link for every day: a repeating event (daily, 3 times, or 4 with the VIP Q&A on Fri Nov 20),
     in their own calendar so their usual reminders fire. The notes hold each day, with its own lines and links. */
  var vipCal = C.PAGE === 'vip', days = ['20261117', '20261118', '20261119'].concat(vipCal ? ['20261120'] : []);
  var notes = 'Every day at 12:00 pm New York (7:00 pm Greece), live on Zoom. Your Zoom link is in your email from Ana.\n';
  days.forEach(function(d, i){
    var lab = ['DAY 1 · Tue Nov 17', 'DAY 2 · Wed Nov 18', 'DAY 3 · Thu Nov 19', 'VIP Q&A · Fri Nov 20'][i];
    notes += '\n' + lab + '\n' + EV[d][1] + '\n';
  });
  notes += '\nPrint your sheet before Day 1: ' + SHEET;
  var waLink = vipCal ? C.VIP_GROUP_URL : C.CHANNEL_URL;
  if (waLink) notes += '\n' + (vipCal ? 'Your VIP WhatsApp group: ' : 'Reminders on WhatsApp: ') + waLink;
  var gAll = gcal(vipCal ? 'Ana Calin: live workshop + VIP Q&A (Nov 17 to 20)' : 'Ana Calin: free live workshop (Nov 17 to 19)', '20261117', notes, 'RRULE:FREQ=DAILY;COUNT=' + days.length);
  document.querySelectorAll('a[data-gall]').forEach(function(a){ a.href = gAll; a.target = '_blank'; a.rel = 'noopener' });
  /* a single day (the VIP Q&A card) */
  document.querySelectorAll('a[data-g]').forEach(function(a){
    var d = a.getAttribute('data-g'), e = EV[d];
    a.href = gcal(e[0], d, e[1] + '\n\nPrint your sheet before Day 1: ' + SHEET);
    a.target = '_blank'; a.rel = 'noopener';
  });

  /* getting ready: the four things punch their ticket (saved in this browser only) */
  var STEPS = C.STEPS || ['cal', 'mail', 'group', 'sheet'], st = {};
  try { st = JSON.parse(localStorage.getItem('ana_ready') || '{}') } catch (e) {}
  var ticket = document.querySelector('.tkt, .pcard'), wasReady = null;
  function renderReady(){
    var n = 0;
    STEPS.forEach(function(s){
      var on = !!st[s]; if (on) n++;
      document.body.classList.toggle('did-' + s, on);
      document.querySelectorAll('[data-card="' + s + '"],[data-ph="' + s + '"]').forEach(function(e){ e.classList.toggle('done', on) });
      document.querySelectorAll('button[data-step="' + s + '"]').forEach(function(b){ b.setAttribute('aria-pressed', on ? 'true' : 'false') });
    });
    document.querySelectorAll('[data-done]').forEach(function(e){ e.textContent = n });
    var ready = n === STEPS.length;
    document.body.classList.toggle('is-ready', ready);
    if (ready && wasReady === false && ticket) burst(ticket, 46);
    wasReady = ready;
  }
  function mark(s, toggle){
    st[s] = toggle ? !st[s] : true;
    try { localStorage.setItem('ana_ready', JSON.stringify(st)) } catch (e) {}
    renderReady();
  }
  document.querySelectorAll('[data-step]').forEach(function(el){
    el.addEventListener('click', function(){ mark(el.getAttribute('data-step'), el.tagName === 'BUTTON') });
  });

  /* a burst of her sunflowers and confetti: on arrival, and when the ticket is ready */
  function burst(el, n){
    if (reduce || !el.animate) return;
    var r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height * .35;
    var cols = ['#F72585', '#FFD400', '#1A1412', '#FF7FB6', '#FFD400'];
    for (var i = 0; i < n; i++) {
      var p = document.createElement('i'), flower = i % 4 === 0;
      p.className = 'cf' + (flower ? ' fl' : '');
      if (flower) p.innerHTML = '<svg><use href="#sf"/></svg>';
      else p.style.background = cols[i % cols.length];
      p.style.left = cx + 'px'; p.style.top = cy + 'px';
      document.body.appendChild(p);
      var a = Math.random() * Math.PI * 2, d = 120 + Math.random() * 260, dx = Math.cos(a) * d, dy = Math.sin(a) * d * .7 - 60;
      var rot = (Math.random() - .5) * 720;
      p.animate([
        {transform: 'translate(-50%,-50%) scale(.4) rotate(0deg)', opacity: 1},
        {transform: 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px)) scale(1) rotate(' + rot / 2 + 'deg)', opacity: 1, offset: .45},
        {transform: 'translate(calc(-50% + ' + dx * 1.1 + 'px), calc(-50% + ' + (dy + 220) + 'px)) scale(.9) rotate(' + rot + 'deg)', opacity: 0}
      ], {duration: 1500 + Math.random() * 900, easing: 'cubic-bezier(.2,.7,.3,1)'}).onfinish = (function(q){ return function(){ q.remove() } })(p);
    }
  }
  renderReady();
  /* the arrival burst, once the ticket or pass is on screen (on phones it sits under the video) */
  if (ticket && 'IntersectionObserver' in window) {
    var bo2 = new IntersectionObserver(function(es){
      if (!es[0].isIntersecting) return;
      bo2.disconnect(); setTimeout(function(){ burst(ticket, C.PAGE === 'vip' ? 70 : 40) }, 550);
    }, {threshold: .6});
    bo2.observe(ticket);
  }

  /* bookmark: show the shortcut for their computer */
  if (!/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) document.querySelectorAll('.bmk kbd').forEach(function(k){ k.style.display = k.classList.contains('win') ? 'inline-block' : 'none' });

  /* the address her emails come from, in the inbox notice */
  if (C.SENDER) document.querySelectorAll('[data-sender]').forEach(function(e){ e.textContent = C.SENDER });

  /* Meta pixel, for show-up ads to registrants: CompleteRegistration here, Purchase on the VIP confirmation */
  if (C.META_PIXEL_ID) {
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', C.META_PIXEL_ID); fbq('track', 'PageView');
    if (C.PAGE === 'vip') fbq('track', 'Purchase', {value: 67, currency: 'USD'}); else fbq('track', 'CompleteRegistration');
  }

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
