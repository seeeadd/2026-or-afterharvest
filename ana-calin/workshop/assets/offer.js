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
    WED_ENDS:  Date.UTC(2026, 10, 19, 4, 59),  // Wed Nov 18, 11:59 pm (the phase tiles only)
    B2_ENDS:   Date.UTC(2026, 10, 20, 4, 59),  // Thu Nov 19, 11:59 pm: the audit's last seats (one live bonus, Day 2 buyers first)
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
  /* the long page's answers only Ana can give: each line, question or block stays hidden until its setting is filled in */
  document.querySelectorAll('[data-opt]').forEach(function(e){
    var v = C[e.getAttribute('data-opt')]; if (!v) return;
    e.hidden = false; e.querySelectorAll('[data-opt-text]').forEach(function(t){ t.textContent = v });
  });
  if (C.SENTENCE) document.querySelectorAll('[data-sentence]').forEach(function(e){ e.textContent = C.SENTENCE });
  if (C.HOURS) document.querySelectorAll('[data-hours-px]').forEach(function(e){ e.textContent = 'One a day (' + C.HOURS + '). A missed day costs nothing; the next task waits.' });
  if (C.RESULTS && C.RESULTS.length) document.querySelectorAll('[data-results]').forEach(function(box){
    var g = box.querySelector('.hg-rg'), el = function(t, c, txt){ var x = document.createElement(t); if (c) x.className = c; if (txt) x.textContent = txt; return x };
    C.RESULTS.forEach(function(r){
      var f = el('figure', 'hg-r'); f.appendChild(el('b', '', r.result));
      if (r.quote) f.appendChild(el('blockquote', '', r.quote));
      var cap = el('figcaption');
      if (r.photo) { var im = el('img'); im.src = r.photo; im.alt = ''; cap.appendChild(im) }
      var who = el('span'); who.appendChild(el('strong', '', r.name)); if (r.where) who.appendChild(document.createTextNode(r.where));
      cap.appendChild(who); f.appendChild(cap); g.appendChild(f);
    });
    box.hidden = false;
  });

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
  document.querySelectorAll('[data-bday]').forEach(function(e){ e.textContent = phase === 'b2' ? 'Live bonus' : 'Day 3 bonus' });
  document.querySelectorAll('[data-bends]').forEach(function(e){ e.textContent = (phase === 'b2' ? 'Last seats Thu Nov 19' : 'Ends Thu Nov 19') + ' at 11:59 pm New York' + (seats ? '. ' + seats + ' seats.' : '.') });

  var MSG = {
    soon:   'Doors open Wed Nov 18, live on Day 2',
    b2:     'Doors are open · audit seats close Thu Nov 19, 11:59 pm New York',
    b3pre:  'Doors are open · the Day 3 bonus is revealed live today',
    b3:     'Day 3 bonus ends tonight, 11:59 pm New York',
    open:   'Doors close Mon Nov 30 · 11:59 pm New York',
    closed: 'Doors are closed. Thank you.'
  };
  /* the four phase tiles: by the clock, today's in colour, the ones before it struck through, the ones after it greyed */
  var cur = now < T.OPENS ? 0 : now < T.WED_ENDS ? 1 : now < T.B2_ENDS ? 2 : now < T.CLOSES ? 3 : 4;
  document.querySelectorAll('[data-ph]').forEach(function(e){
    var n = +e.getAttribute('data-ph');
    e.classList.add(n === cur ? 'now' : n < cur ? 'past' : 'next');
  });
  if (C.BONUS2_NAME) document.querySelectorAll('[data-ph1]').forEach(function(e){ e.textContent = C.BONUS2_NAME });
  if (C.BONUS3_NAME && now >= T.B3_REVEAL) document.querySelectorAll('[data-ph2]').forEach(function(e){ e.textContent = C.BONUS3_NAME });

  /* the sticky pill: a short label and the deadline as date tiles (nothing ticks) */
  var SHORT = {soon: ['Doors open', 'Wed', 'Nov 18', '12:55'], b2: ['Audit seats close', 'Thu', 'Nov 19', '11:59'], b3pre: ['Day 3 bonus today', 'Thu', 'Nov 19', '12:55'],
               b3: ['Day 3 bonus ends', 'Thu', 'Nov 19', '11:59'], open: ['Doors close', 'Mon', 'Nov 30', '11:59'], closed: ['Doors are closed', '', '', '']};
  var sh = SHORT[phase];
  document.querySelectorAll('[data-barshort]').forEach(function(e){ e.textContent = sh[0] });
  [1, 2, 3].forEach(function(i){ document.querySelectorAll('[data-t' + i + ']').forEach(function(e){ e.textContent = sh[i] }) });

  document.querySelectorAll('[data-barmsg]').forEach(function(e){ e.textContent = MSG[phase] });

  /* two payments or pay in full: every order box and button on the page moves together. Opens on the payment plan (SOP 3C). */
  var plan = 'plan';
  function setPlan(p){
    plan = p;
    document.querySelectorAll('.tg button,.tiers button').forEach(function(x){ x.setAttribute('aria-pressed', x.getAttribute('data-plan') === p ? 'true' : 'false') });
    document.querySelectorAll('[data-total]').forEach(function(e){ e.textContent = p === 'full' ? '$1,500.00' : '$850.00' });
    document.querySelectorAll('[data-later]').forEach(function(e){ e.hidden = p === 'full' });
    document.querySelectorAll('[data-full]').forEach(function(e){ e.hidden = p !== 'full' });
    document.querySelectorAll('[data-btnp]').forEach(function(e){ e.textContent = p === 'full' ? '$1,500' : '$850 today' });
    document.querySelectorAll('[data-ctaline]').forEach(function(e){ e.textContent = p === 'full' ? 'or 2 payments of $850' : 'or $1,500 in full' });
  }
  document.querySelectorAll('.tg button,.tiers button').forEach(function(x){ x.addEventListener('click', function(){ setPlan(x.getAttribute('data-plan')) }) });
  setPlan('plan');

  /* checkout: email prefilled, the partner ref (30% commission), which page */
  var toast = document.createElement('div'); toast.className = 'demo'; toast.setAttribute('role', 'status'); b.appendChild(toast);
  var toastT = 0;
  function say(t){ toast.textContent = t; toast.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function(){ toast.classList.remove('on') }, 2600) }
  function track(n){ try { (window.dataLayer = window.dataLayer || []).push({event: n}); if (window.fbq) fbq('track', 'InitiateCheckout', {value: plan === 'full' ? 1500 : 850, currency: 'USD'}) } catch (e) {} }
  document.querySelectorAll('[data-join]').forEach(function(a){
    a.addEventListener('click', function(e){
      e.preventDefault();
      if (phase === 'closed') return;
      if (phase === 'soon') { say('Doors open Wed Nov 18, live on Day 2.'); return }   // the buttons stay live; before doors open they say when
      var u = plan === 'full' ? C.CHECKOUT_FULL : C.CHECKOUT_PLAN;
      track('offer_checkout_' + plan);
      if (!u) { say('Checkout link not set yet (demo).'); return }
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
  var hero = document.querySelector('.hero,.hx,.ck-h'), seen = [], past = false;
  function mb(){ b.classList.toggle('mb-on', past && !seen.length) }
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function(es){ past = !es[0].isIntersecting && es[0].boundingClientRect.top < 0; mb() }).observe(hero);
    var oio = new IntersectionObserver(function(es){
      es.forEach(function(e){ var i = seen.indexOf(e.target); if (e.isIntersecting && i < 0) seen.push(e.target); if (!e.isIntersecting && i >= 0) seen.splice(i, 1) });
      mb();
    });
    document.querySelectorAll('.ob').forEach(function(o){ if (o.offsetParent) oio.observe(o) });
  }

  /* the full build: the row in the middle of the screen lights up */
  var bms = document.querySelectorAll('.bm-item');
  if (bms.length) {
    var lit = function(){
      var mid = innerHeight * .5, best = null, bd = 1e9;
      bms.forEach(function(li){ if (!li.offsetParent) return; var r = li.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - mid); if (d < bd) { bd = d; best = li } });
      bms.forEach(function(li){ li.classList.toggle('is-active', li === best && bd < innerHeight * .45) });
    };
    addEventListener('scroll', lit, {passive: true}); lit();
  }
  /* the long page's road map: stops light up as you reach them, and the line fills to the last one lit */
  var stops = document.querySelectorAll('.rm-stop'), fill = document.querySelector('.rm-fill');
  if (stops.length) {
    var road = function(){
      var lim = innerHeight * .62, last = null;
      stops.forEach(function(st){ var on = st.getBoundingClientRect().top < lim; st.classList.toggle('lit', on); if (on) last = st });
      if (fill) { var rm = fill.parentNode.getBoundingClientRect(); fill.style.height = last ? (last.getBoundingClientRect().top - rm.top + 42) + 'px' : '0px' }
    };
    addEventListener('scroll', road, {passive: true}); road();
  }
  /* the long page's December: on a laptop or bigger the month is pinned and moves sideways as you scroll; the
     frame in the middle is lit, and the calendar under it fills to the end of that stretch. Stacked on a phone. */
  var dec = document.querySelector('[data-dec]');
  if (dec) {
    var dtrack = dec.querySelector('.dec-track'), frs = [].slice.call(dec.querySelectorAll('.fr')), cells = dec.querySelectorAll('[data-day]'), dlab = dec.querySelector('[data-daylab]');
    var mq = matchMedia('(min-width: 1101px) and (min-height: 620px)'), pin = false, span = 0, lastI = -1;
    var LAB = ['Tue Dec 1', 'Dec 1 to 7', 'Dec 8 to 14', 'Dec 15 to 20', 'Dec 21 to 27, Christmas', 'Dec 28 to 30, launch'];
    var light = function(i){
      if (i === lastI) return; lastI = i;
      frs.forEach(function(f, k){ f.classList.toggle('on', k === i) });
      var a = +frs[i].getAttribute('data-from'), z = +frs[i].getAttribute('data-to');
      cells.forEach(function(c){ var d = +c.getAttribute('data-day'); c.classList.toggle('done', d <= z); c.classList.toggle('cur', d >= a && d <= z) });
      if (dlab) dlab.textContent = LAB[i] || '';
    };
    var move = function(){
      if (!pin) return;
      var r = dec.getBoundingClientRect(), p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
      dtrack.style.transform = 'translate3d(' + (-p * span).toFixed(1) + 'px,0,0)';
      light(Math.round(p * (frs.length - 1)));
    };
    var size = function(){
      pin = mq.matches && !reduce;
      dec.classList.toggle('is-pin', pin);
      if (!pin) { dec.style.height = ''; dtrack.style.transform = ''; frs.forEach(function(f){ f.classList.add('on') }); lastI = -1; return }
      span = dtrack.scrollWidth - innerWidth;
      dec.style.height = (span + innerHeight * 1.15) + 'px';
      lastI = -1; move();
    };
    size(); addEventListener('resize', size); addEventListener('scroll', move, {passive: true});
    /* on a phone the month is a swipe: the dots under it follow the frame in view */
    var ddots = dec.querySelectorAll('.dec-dots i');
    dtrack.addEventListener('scroll', function(){
      if (pin || !frs.length) return;
      var k = Math.round(dtrack.scrollLeft / (frs[0].getBoundingClientRect().width + 14));
      ddots.forEach(function(d, j){ d.classList.toggle('on', j === k) });
    }, {passive: true});
    if (document.fonts) document.fonts.ready.then(size);
  }
  /* the long page's last day: November on a wall calendar, the days already gone in New York crossed off, today marked,
     the 30th circled (placed by script so the ring sits on the real cell at every width) */
  document.querySelectorAll('[data-nov]').forEach(function(cal){
    var f = new Intl.DateTimeFormat('en-US', {timeZone: 'America/New_York', year: 'numeric', month: 'numeric', day: 'numeric'}).formatToParts(new Date(now));
    var g = {}; f.forEach(function(x){ g[x.type] = +x.value });
    var today = g.year > 2026 || (g.year === 2026 && g.month > 11) ? 31 : (g.year === 2026 && g.month === 11 ? g.day : 0);
    cal.querySelectorAll('[data-n]').forEach(function(c){ var n = +c.getAttribute('data-n'); c.classList.toggle('x', n < today); c.classList.toggle('today', n === today) });
    var place = function(){
      var box = cal.getBoundingClientRect(), d30 = cal.querySelector('[data-n="30"]'), ring = cal.querySelector('.nov-ring');
      if (!d30 || !ring) return;
      var r = d30.getBoundingClientRect(), g = ring.getBoundingClientRect();   // an svg has no offsetWidth
      ring.style.left = (r.left - box.left + r.width / 2 - g.width / 2) + 'px'; ring.style.top = (r.top - box.top + r.height / 2 - g.height / 2) + 'px';
    };
    place(); addEventListener('resize', place); if (document.fonts) document.fonts.ready.then(place);
  });
  /* the long page's crossroads: three statements to tick; when all three are ticked, the button below nods */
  document.querySelectorAll('[data-nod]').forEach(function(n){
    var bs = n.querySelectorAll('.nod-l button');
    bs.forEach(function(x){ x.addEventListener('click', function(){
      x.setAttribute('aria-pressed', x.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      n.classList.toggle('all', [].every.call(bs, function(y){ return y.getAttribute('aria-pressed') === 'true' }));
    }) });
  });
  /* the long page's calendar: where you're starting from changes the day shown */
  document.querySelectorAll('.eve').forEach(function(ev){
    ev.querySelectorAll('[data-pick]').forEach(function(bt){
      bt.addEventListener('click', function(){
        ev.setAttribute('data-p', bt.getAttribute('data-pick'));
        ev.querySelectorAll('[data-pick]').forEach(function(x){ x.setAttribute('aria-pressed', x === bt ? 'true' : 'false') });
      });
    });
  });
  /* the buy button's glow follows the pointer */
  document.querySelectorAll('.cta-buy,.is-buy').forEach(function(c){
    c.addEventListener('pointermove', function(e){ var r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px') });
  });

  /* reveal */
  var els = document.querySelectorAll('[data-r]');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }) }, {rootMargin: '0px 0px -8% 0px'});
    els.forEach(function(e){ io.observe(e) });
  } else els.forEach(function(e){ e.classList.add('in') });
})();
