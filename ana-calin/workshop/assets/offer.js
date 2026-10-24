/* Ana Calin, the offer pages. Settings come from window.OFFER (one block, shared by /join and /program). */
(function(){
  var C = window.OFFER || {};
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var qs = new URLSearchParams(location.search), reg = {};
  try { reg = JSON.parse(sessionStorage.getItem('ana_reg') || localStorage.getItem('ana_reg') || '{}') } catch (e) {}
  var email = (qs.get('email') || reg.email || '').trim();
  var ref = (qs.get('ref') || reg.ref || '').trim();

  /* the dates (all New York; November is UTC-5) */
  var T = {
    OPENS:     Date.UTC(2026, 10, 18, 17, 55), // Wed Nov 18, about 12:55 pm, the price reveal on Day 2
    B2_ENDS:   Date.UTC(2026, 10, 19, 4, 59),  // Wed Nov 18, 11:59 pm
    B3_REVEAL: Date.UTC(2026, 10, 19, 17, 55), // Thu Nov 19, revealed live on Day 3
    B3_ENDS:   Date.UTC(2026, 10, 20, 4, 59),  // Thu Nov 19, 11:59 pm
    CLOSES:    Date.UTC(2026, 11, 1, 4, 59)    // Mon Nov 30, 11:59 pm. Buttons off at that minute. No reopening.
  };
  var now = qs.get('now') ? Date.parse(qs.get('now')) : Date.now();   // ?now=2026-11-19T12:00:00Z tests a moment

  /* settings into the page */
  var NAME = C.PROGRAM || 'The Exit Lab';
  document.querySelectorAll('[data-prog]').forEach(function(e){ e.textContent = NAME });
  document.querySelectorAll('[data-progu]').forEach(function(e){ e.textContent = NAME.toUpperCase() });
  if (!C.LIVE_CALLS) document.querySelectorAll('[data-calls]').forEach(function(e){ e.remove() });
  else document.querySelectorAll('[data-calls-text]').forEach(function(e){ e.textContent = C.LIVE_CALLS });
  document.querySelectorAll('[data-renum]').forEach(function(list){
    var n = 0; list.querySelectorAll('[data-n]').forEach(function(e){ e.textContent = ('0' + (++n)).slice(-2) });
  });
  if (C.HOURS) document.querySelectorAll('[data-hours]').forEach(function(e){ e.textContent = 'for ' + C.HOURS + ', on the evenings you have' });
  if (C.SAFETY_TEXT) {
    document.body.classList.add('has-safety');
    document.querySelectorAll('[data-safety-title]').forEach(function(e){ e.textContent = C.SAFETY_TITLE || 'My promise' });
    document.querySelectorAll('[data-safety-text]').forEach(function(e){ e.textContent = C.SAFETY_TEXT });
    document.querySelectorAll('[data-safety-line]').forEach(function(e){ e.textContent = C.SAFETY_LINE || C.SAFETY_TITLE || 'My promise' });
  }
  if (C.SKIP_TEXT) document.querySelectorAll('[data-skip]').forEach(function(e){ e.textContent = C.SKIP_TEXT; var r = e.closest('[data-skip-row]'); if (r) r.hidden = false });
  if (C.METHOD) document.querySelectorAll('[data-method]').forEach(function(e){ e.textContent = C.METHOD });
  if (C.BACKUP_PAY_URL) document.querySelectorAll('[data-bkp]').forEach(function(e){
    e.hidden = false; e.querySelector('[data-bkp-link]').href = C.BACKUP_PAY_URL;
    if (C.BACKUP_PAY_TEXT) e.querySelector('[data-bkp-text]').textContent = C.BACKUP_PAY_TEXT;
  });
  if (C.PAY2_DATE) document.querySelectorAll('[data-pay2]').forEach(function(e){ e.textContent = 'on ' + C.PAY2_DATE });

  /* where we are in the week */
  var b = document.body, phase;
  if (now >= T.CLOSES) phase = 'closed';
  else if (now < T.OPENS) phase = 'soon';
  else if (now < T.B2_ENDS) phase = 'b2';
  else if (now < T.B3_ENDS) phase = now < T.B3_REVEAL ? 'b3pre' : 'b3';
  else phase = 'open';
  b.classList.add(phase === 'closed' ? 'is-closed' : phase === 'soon' ? 'is-soon' : 'is-open');
  if (phase === 'b2' || phase === 'b3') b.classList.add(phase);

  var bname = phase === 'b2' ? (C.BONUS2_NAME || 'An AI-assisted audit of your offer') : (C.BONUS3_NAME || '');
  if (phase === 'b3' && !bname) { b.classList.remove('b3'); phase = 'open' }   // nothing to show until Ana names it
  var seats = phase === 'b2' ? C.BONUS2_SEATS : C.BONUS3_SEATS;
  document.querySelectorAll('[data-bname]').forEach(function(e){ e.textContent = bname });
  document.querySelectorAll('[data-bday]').forEach(function(e){ e.textContent = phase === 'b2' ? 'Day 2 bonus' : 'Day 3 bonus' });
  document.querySelectorAll('[data-bends]').forEach(function(e){ e.textContent = (phase === 'b2' ? 'Ends Wed Nov 18' : 'Ends Thu Nov 19') + ' at 11:59 pm New York' + (seats ? '. ' + seats + ' seats.' : '.') });

  var MSG = {
    soon:   'Doors open Wed Nov 18, live on Day 2',
    b2:     'Doors are open · Day 2 bonus ends tonight, 11:59 pm New York',
    b3pre:  'Doors are open · the Day 3 bonus is revealed live today',
    b3:     'Day 3 bonus ends tonight, 11:59 pm New York',
    open:   'Doors close Mon Nov 30 · 11:59 pm New York',
    closed: 'Doors are closed. Thank you.'
  };
  /* the four phase tiles: by the clock, today's in colour, the ones before it struck through, the ones after it greyed */
  var cur = now < T.OPENS ? 0 : now < T.B2_ENDS ? 1 : now < T.B3_ENDS ? 2 : now < T.CLOSES ? 3 : 4;
  document.querySelectorAll('[data-ph]').forEach(function(e){
    var n = +e.getAttribute('data-ph');
    e.classList.add(n === cur ? 'now' : n < cur ? 'past' : 'next');
  });
  if (C.BONUS2_NAME) document.querySelectorAll('[data-ph1]').forEach(function(e){ e.textContent = C.BONUS2_NAME });
  if (C.BONUS3_NAME && now >= T.B3_REVEAL) document.querySelectorAll('[data-ph2]').forEach(function(e){ e.textContent = C.BONUS3_NAME });

  document.querySelectorAll('[data-barmsg]').forEach(function(e){ e.textContent = MSG[phase] });

  /* two payments or pay in full: every order box and button on the page moves together. Opens on the payment plan (SOP 3C). */
  var plan = 'plan';
  function setPlan(p){
    plan = p;
    document.querySelectorAll('.tg button').forEach(function(x){ x.setAttribute('aria-pressed', x.getAttribute('data-plan') === p ? 'true' : 'false') });
    document.querySelectorAll('[data-total]').forEach(function(e){ e.textContent = p === 'full' ? '$1,500' : '$850' });
    document.querySelectorAll('[data-later]').forEach(function(e){ e.hidden = p === 'full' });
    document.querySelectorAll('[data-btnp]').forEach(function(e){ e.textContent = p === 'full' ? '$1,500' : '$850 today' });
    document.querySelectorAll('[data-ctaline]').forEach(function(e){ e.textContent = p === 'full' ? 'or 2 payments of $850' : 'or $1,500 in full' });
  }
  document.querySelectorAll('.tg button').forEach(function(x){ x.addEventListener('click', function(){ setPlan(x.getAttribute('data-plan')) }) });
  setPlan('plan');

  /* checkout: email prefilled, the partner ref (30% commission), which page */
  var toast = document.createElement('div'); toast.className = 'demo'; toast.textContent = 'Checkout link not set yet (demo).'; b.appendChild(toast);
  function track(n){ try { (window.dataLayer = window.dataLayer || []).push({event: n}); if (window.fbq) fbq('track', 'InitiateCheckout', {value: plan === 'full' ? 1500 : 850, currency: 'USD'}) } catch (e) {} }
  document.querySelectorAll('[data-join]').forEach(function(a){
    a.addEventListener('click', function(e){
      e.preventDefault();
      if (phase === 'closed' || phase === 'soon') return;
      var u = plan === 'full' ? C.CHECKOUT_FULL : C.CHECKOUT_PLAN;
      track('offer_checkout_' + plan);
      if (!u) { toast.classList.add('on'); setTimeout(function(){ toast.classList.remove('on') }, 2200); return }
      var p = [];
      if (email) p.push('prefilled_email=' + encodeURIComponent(email));
      if (ref) p.push('client_reference_id=' + encodeURIComponent(ref.replace(/[^\w-]/g, '_').slice(0, 200)));
      p.push('utm_content=' + (window.OFFER_PAGE || 'offer') + '_' + phase);
      location.href = u + (u.indexOf('?') < 0 ? '?' : '&') + p.join('&');
    });
  });
  /* the bar's button goes to the nearest order box */
  document.querySelectorAll('[data-toorder]').forEach(function(a){
    a.addEventListener('click', function(e){
      e.preventDefault();
      var o = [].filter.call(document.querySelectorAll('.ob'), function(x){ return x.offsetParent })[0];
      if (o) o.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'center'});
    });
  });
  /* links between the pages keep the ref and email */
  document.querySelectorAll('a[data-keep]').forEach(function(a){
    var p = []; if (ref) p.push('ref=' + encodeURIComponent(ref)); if (email) p.push('email=' + encodeURIComponent(email));
    if (p.length) a.href = a.getAttribute('href') + '?' + p.join('&');
  });

  /* the offer video (long page): click to play; Ana's photo until it's set */
  document.querySelectorAll('.iph').forEach(function(ph){
    var v = ph.querySelector('video'), s = ph.querySelector('.scr');
    if (!C.VIDEO_SRC) return;
    ph.classList.add('has-v');
    s.addEventListener('click', function(){ if (!v.src) v.src = C.VIDEO_SRC; if (v.paused) { v.play(); ph.classList.add('on') } else v.pause() });
  });

  /* the contents rail (long page): the section you're reading is lit */
  var toc = document.querySelectorAll('.toc a');
  if (toc.length && 'IntersectionObserver' in window) {
    var secs = [].map.call(toc, function(a){ return document.querySelector(a.getAttribute('href')) });
    var spy = function(){
      var y = innerHeight * .35, cur = 0;
      secs.forEach(function(s, i){ if (s && s.getBoundingClientRect().top < y) cur = i });
      toc.forEach(function(a, i){ a.classList.toggle('on', i === cur) });
    };
    addEventListener('scroll', spy, {passive: true}); spy();
  }

  /* the phone buy bar: shows once the first screen is gone, hides while an order box is on screen */
  var hero = document.querySelector('.hx,.ck-h'), seen = [], past = false;
  function mb(){ b.classList.toggle('mb-on', past && !seen.length) }
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function(es){ past = !es[0].isIntersecting && es[0].boundingClientRect.top < 0; mb() }).observe(hero);
    var oio = new IntersectionObserver(function(es){
      es.forEach(function(e){ var i = seen.indexOf(e.target); if (e.isIntersecting && i < 0) seen.push(e.target); if (!e.isIntersecting && i >= 0) seen.splice(i, 1) });
      mb();
    });
    document.querySelectorAll('.ob').forEach(function(o){ if (o.offsetParent) oio.observe(o) });
  }

  /* reveal */
  var els = document.querySelectorAll('[data-r]');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }) }, {rootMargin: '0px 0px -8% 0px'});
    els.forEach(function(e){ io.observe(e) });
  } else els.forEach(function(e){ e.classList.add('in') });
})();
