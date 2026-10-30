/* Ana Calin, the two confirmation pages. Settings come from window.CONF in each page. */
(function(){
  var C = window.CONF || {};

  /* ---- the 7 quick questions (the survey) and the exit number ----
     Kit is a stub until Theia sets the form id (KIT_SURVEY_FORM in the page settings): with no id, nothing is sent.
     Each answer also becomes a tag name in fields[ep_tags], so a Kit automation can tag from it. */
  var KIT_SURVEY = {
    formId: C.KIT_SURVEY_FORM || '',
    endpoint: function(id){ return 'https://app.kit.com/forms/' + id + '/subscriptions' },
    tagAll: 'ep_survey',
    tagMap: {
      q1: ['ep_live_all', 'ep_live_some', 'ep_live_replay'],
      q2: ['ep_subs_none', 'ep_subs_under100', 'ep_subs_100_1k', 'ep_subs_1k_10k', 'ep_subs_10k_plus'],
      q3: ['ep_bought_course', 'ep_bought_paidsub', 'ep_bought_notyet'],
      q4: ['ep_work_wayout', 'ep_work_side', 'ep_work_self', 'ep_work_between', 'ep_work_other'],
      q5: ['ep_belief_easy', 'ep_belief_whattosell', 'ep_belief_subsfirst', 'ep_belief_pushy', 'ep_belief_time', 'ep_belief_notme'],
      q6: ['ep_topic_career', 'ep_topic_writing', 'ep_topic_health', 'ep_topic_money', 'ep_topic_family', 'ep_topic_other'],
      q7: ['ep_worth_sell', 'ep_worth_price', 'ep_worth_ask', 'ep_worth_send', 'ep_worth_all']
    }
  };
  /* where the exit number is pinned: the free channel, or the VIP group on /vip-confirmed */
  var EXIT_LINK_PLACEHOLDER = '#';
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

  /* clicks: action_calendar, action_whatsapp, action_sheet, the survey (and the video plays) */
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
  notes += '\nPrint your Head start page before Day 1: ' + SHEET;
  var waLink = vipCal ? C.VIP_GROUP_URL : C.CHANNEL_URL;
  if (waLink) notes += '\n' + (vipCal ? 'Your VIP WhatsApp group: ' : 'Reminders on WhatsApp: ') + waLink;
  var gAll = gcal(vipCal ? 'Ana Calin: live workshop + VIP Q&A (Nov 17 to 20)' : 'Ana Calin: free live workshop (Nov 17 to 19)', '20261117', notes, 'RRULE:FREQ=DAILY;COUNT=' + days.length);
  document.querySelectorAll('a[data-gall]').forEach(function(a){ a.href = gAll; a.target = '_blank'; a.rel = 'noopener' });
  /* a single day (the VIP Q&A card) */
  document.querySelectorAll('a[data-g]').forEach(function(a){
    var d = a.getAttribute('data-g'), e = EV[d];
    a.href = gcal(e[0], d, e[1] + '\n\nPrint your Head start page before Day 1: ' + SHEET);
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
      if (bo.querySelector('video')) return;
      if (!src) { bo.querySelector('.pl > span').textContent = "Ana's answer is on its way"; return }
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


  /* ---- the survey: opening screen, 7 tap-only questions, last screen ---- */
  var isVip = C.PAGE === 'vip';
  var exitLink = (isVip ? C.VIP_GROUP_URL : C.CHANNEL_URL) || EXIT_LINK_PLACEHOLDER;
  var localTime = '';
  try {
    var tz2 = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz2 && tz2 !== 'America/New_York') {
      var q = {};
      new Intl.DateTimeFormat('en-US', {hour:'numeric', minute:'2-digit', hour12:true}).formatToParts(new Date(Date.UTC(2026,10,17,17,0))).forEach(function(x){ q[x.type] = x.value });
      if (q.hour && q.dayPeriod) localTime = 'That’s ' + q.hour + ':' + q.minute + ' ' + q.dayPeriod.toLowerCase() + ' where you are.';
    }
  } catch (e) {}
  var QS = [
    {id:'q1', q:'Can you be there live, 12:00 to 1:30 pm New York, Tue Nov 17 to Thu Nov 19?', note: localTime,
     o:['Yes, all three days', 'Some of it, around work', 'Probably not, I’ll watch the replays']},
    {id:'q2', q:'How many subscribers do you have right now?', note:'No newsletter? Pick “None yet.” Every answer here is a normal place to start.',
     o:['None yet', 'Under 100', '100 to 1,000', '1,000 to 10,000', 'More than 10,000']},
    {id:'q3', q:'Have you bought something from me before?', note:'Pick all that fit.', multi:true, only:2,
     o:['Yes, a workshop or course', 'Yes, I’m a paid subscriber', 'Not yet']},
    {id:'q4', q:'What’s your work right now?',
     o:['A job, and I want a way out', 'A job I like, plus something of my own on the side', 'I work for myself: coaching, consulting, freelancing or my own thing', 'Between jobs, or retired', 'Something else']},
    {id:'q5', q:'Which one sounds most like you?', note:'Pick the loudest.',
     o:['“It feels wrong to charge for something that comes easy to me.”', '“I wouldn’t know what to sell.”', '“I need more subscribers first.”', '“Asking for money feels pushy.”', '“I don’t have the time.”', '“This works for other people, not for people like me.”']},
    {id:'q6', q:'What do people come to you for help with?', note:'Pick the closest.',
     o:['Work and career', 'Writing and creativity', 'Health, food or fitness', 'Money and business', 'Family, home and relationships', 'Something else']},
    {id:'q7', q:'By Thursday, these three days were worth it if I...',
     o:['know what I’d sell', 'have a price I can say without wincing', 'have my first ask written', 'actually send it to someone', 'all of the above, obviously']}
  ];
  var sv = {a:{}, i:0, done:false};
  try { var sv0 = JSON.parse(localStorage.getItem('ana_survey') || 'null'); if (sv0 && sv0.a) sv = sv0 } catch (e) {}
  function saveSv(){ try { localStorage.setItem('ana_survey', JSON.stringify(sv)) } catch (e) {} }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c] }) }

  function payload(delivery, em){
    var d = new URLSearchParams(), tags = [KIT_SURVEY.tagAll];
    d.append('email_address', em || email);
    if (first) d.append('first_name', first);
    QS.forEach(function(s){
      var v = sv.a[s.id]; if (v == null) return;
      var idx = [].concat(v);
      d.append('fields[survey_' + s.id + ']', idx.map(function(k){ return s.o[k] }).join(' | '));
      idx.forEach(function(k){ var tg = (KIT_SURVEY.tagMap[s.id] || [])[k]; if (tg) tags.push(tg) });
    });
    d.append('fields[exit_delivery]', delivery);
    d.append('fields[ep_tags]', tags.join(','));
    return d;
  }
  /* the stub: posts only when the form id is set */
  function sendSurvey(delivery, em){
    track('survey_' + delivery);
    if (!KIT_SURVEY.formId || !(em || email)) return Promise.resolve('demo');
    return fetch(KIT_SURVEY.endpoint(KIT_SURVEY.formId), {method:'POST', body: payload(delivery, em), headers:{'Accept':'application/json'}}).then(function(){ return 'sent' }, function(){ return 'failed' });
  }

  var box = document.createElement('div');
  box.className = 'sv' + (isVip ? ' vip' : '');
  box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'sv-t'); box.hidden = true;
  box.innerHTML = '<div class="sv-card"><div class="sv-top"><button type="button" class="sv-back">&larr; back</button><span class="sv-prog" aria-live="polite"></span><button type="button" class="sv-x" aria-label="Close">&times;</button></div><div class="sv-bar" aria-hidden="true"><i></i></div><div class="sv-body"></div></div>';
  document.body.appendChild(box);
  var body = box.querySelector('.sv-body'), prog = box.querySelector('.sv-prog'), bar = box.querySelector('.sv-bar i'), back = box.querySelector('.sv-back'), lastFocus = null;
  var LAST = QS.length + 1;

  function render(){
    var i = sv.i;
    box.setAttribute('data-screen', i === 0 ? 'open' : (i === LAST ? 'last' : (i === 'email' ? 'email' : 'q')));
    back.style.visibility = (i === 0 || i === LAST) ? 'hidden' : 'visible';
    if (i === 'email') { back.style.visibility = 'hidden' }
    if (typeof i === 'number' && i >= 1 && i <= QS.length) { prog.textContent = i + ' of ' + QS.length; bar.style.width = (i / QS.length * 100) + '%' }
    else { prog.textContent = ''; bar.style.width = i === LAST ? '100%' : '0%' }
    var h = '';
    if (i === 0) {
      h = '<h2 id="sv-t">Your seat is saved.</h2>'
        + '<p>Seven short questions, about a minute, and your exit number is yours. It’s waiting in the ' + (isVip ? 'VIP group' : 'WhatsApp channel') + '.</p>'
        + '<p>I read through these before Day 1 and answer the most common ones live.</p>'
        + '<div class="sv-act"><button type="button" class="btn" data-sv="start">Start</button><button type="button" class="sv-skip" data-sv="close">skip for now</button></div>';
    } else if (i === LAST) {
      h = '<h2 id="sv-t">Thank you' + (first ? ', ' + esc(first) : '') + '.</h2>'
        + '<p>' + (isVip ? 'Your exit number is pinned in the VIP group.' : 'Your exit number is the pinned post in the WhatsApp channel.') + '</p>'
        + '<div class="sv-act"><a class="btn" href="' + esc(exitLink) + '" target="_blank" rel="noopener" data-sv="join">' + (isVip ? 'Join the VIP group and get it' : 'Join the channel and get it') + '</a></div>'
        + '<p class="sv-alt">Not on WhatsApp? <a href="#" data-sv="email">Send it to my email instead</a></p>'
        + '<p class="sv-ok" role="status" hidden></p>';
    } else if (i === 'email') {
      h = '<h2 id="sv-t">Where should I send it?</h2>'
        + '<p>Your exit number comes as an email called “Your exit number.”</p>'
        + '<form class="sv-em" novalidate><label for="sv-em">Your email <small>(the one you registered with)</small></label><input type="email" id="sv-em" required autocomplete="email" value="' + esc(email) + '"><button class="btn" type="submit">send it to me</button></form>'
        + '<p class="sv-ok" role="status" hidden></p>';
    } else {
      var s = QS[i - 1], v = sv.a[s.id], sel = [].concat(v == null ? [] : v);
      h = '<h2 id="sv-t">' + esc(s.q) + '</h2>' + (s.note ? '<p class="sv-note">' + esc(s.note) + '</p>' : '')
        + '<div class="sv-opts' + (s.multi ? ' multi' : '') + '" role="' + (s.multi ? 'group' : 'radiogroup') + '" aria-labelledby="sv-t">'
        + s.o.map(function(o, k){ var on = sel.indexOf(k) > -1; return '<button type="button" class="sv-o' + (on ? ' on' : '') + '" role="' + (s.multi ? 'checkbox' : 'radio') + '" aria-checked="' + on + '" data-k="' + k + '">' + esc(o) + '</button>' }).join('')
        + '</div>' + (s.multi ? '<div class="sv-act"><button type="button" class="btn" data-sv="next"' + (sel.length ? '' : ' disabled') + '>next</button></div>' : '');
    }
    body.innerHTML = h;
    var f = body.querySelector('.sv-o.on') || body.querySelector('.sv-o, [data-sv="start"], [data-sv="join"], #sv-em');
    if (f) try { f.focus({preventScroll:true}) } catch (e) { f.focus() }
  }
  function go(i){ sv.i = i; saveSv(); render(); body.scrollTop = 0 }
  function finish(){
    sv.done = true; saveSv(); mark('group');
    sendSurvey(isVip ? 'vip_group' : 'whatsapp');
    go(LAST);
  }
  function open(at){
    lastFocus = document.activeElement;
    if (at === 'email' && sv.i !== 'email') sv.prev = sv.i;
    if (at) sv.i = at; else if (sv.done) sv.i = LAST; else if (sv.i === 'email') sv.i = sv.prev || 0;
    box.hidden = false; document.documentElement.classList.add('sv-on');
    render(); track('survey_open');
  }
  function close(){ box.hidden = true; document.documentElement.classList.remove('sv-on'); if (sv.i === 'email') sv.i = sv.done ? LAST : (sv.prev || 0); saveSv(); if (lastFocus && lastFocus.focus) lastFocus.focus() }
  function emailDone(where, okEl){
    sv.mailed = true; saveSv(); mark('group');
    okEl.hidden = false; okEl.textContent = 'On its way. Look for “Your exit number.” in your inbox.';
  }

  box.addEventListener('click', function(e){
    if (e.target === box) return close();
    var o = e.target.closest('.sv-o'), b = e.target.closest('[data-sv]');
    if (o) {
      var s = QS[sv.i - 1], k = +o.getAttribute('data-k');
      if (s.multi) {
        var cur = [].concat(sv.a[s.id] == null ? [] : sv.a[s.id]), at = cur.indexOf(k);
        if (at > -1) cur.splice(at, 1); else if (k === s.only) cur = [k]; else { cur = cur.filter(function(x){ return x !== s.only }); cur.push(k) }
        sv.a[s.id] = cur; saveSv(); render();
      } else {
        sv.a[s.id] = k; saveSv();
        o.classList.add('on');
        setTimeout(function(){ if (sv.i < QS.length) go(sv.i + 1); else finish() }, reduce ? 0 : 160);
      }
      return;
    }
    if (!b) return;
    var a = b.getAttribute('data-sv');
    if (a === 'start') go(1);
    else if (a === 'close') close();
    else if (a === 'next') { if (sv.i < QS.length) go(sv.i + 1); else finish() }
    else if (a === 'join') { mark('group'); track('action_whatsapp') }
    else if (a === 'email') {
      e.preventDefault();
      if (email) sendSurvey('email').then(function(){ emailDone('last', body.querySelector('.sv-ok')) });
      else go('email');
    }
  });
  box.addEventListener('submit', function(e){
    var f = e.target; if (!f.classList.contains('sv-em')) return;
    e.preventDefault();
    var inp = f.querySelector('input'); if (!inp.reportValidity()) return;
    email = inp.value.trim(); f.querySelector('button').disabled = true;
    sendSurvey('email', email).then(function(){ emailDone('email', body.querySelector('.sv-ok')) });
  });
  back.addEventListener('click', function(){ if (typeof sv.i === 'number' && sv.i > 0) go(sv.i - 1) });
  box.querySelector('.sv-x').addEventListener('click', close);
  document.addEventListener('keydown', function(e){ if (!box.hidden && e.key === 'Escape') close() });
  document.querySelectorAll('[data-survey]').forEach(function(a){ a.addEventListener('click', function(e){ e.preventDefault(); open() }) });
  /* "Not on WhatsApp? Send it to my email instead", under step 1 */
  document.querySelectorAll('[data-exit-email]').forEach(function(a){
    a.addEventListener('click', function(e){
      e.preventDefault();
      var ok = a.closest('.act') && a.closest('.act').querySelector('.alt-ok');
      if (email && ok) sendSurvey('email').then(function(){ emailDone('page', ok) });
      else open('email');
    });
  });
  if (C.SENDER) document.querySelectorAll('a[data-mail="gmail"]').forEach(function(a){ a.href = 'https://mail.google.com/mail/u/0/#search/' + encodeURIComponent(C.SENDER) });

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
