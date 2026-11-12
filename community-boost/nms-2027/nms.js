/* Nonprofit Marketing Summit 2027, the brand-only page (2026-11-12).
   The sign-up form and the HubSpot submission, the same form, fields, checks, source tags and confirmation redirect
   as the previous page's site.js (Theia's version on main), without the rest of that page. */
(function () {
  'use strict';
  var HS = 'https://api.hsforms.com/submissions/v3/integration/submit/8868638/49c39ae5-f5dd-434a-81ea-a8f5b1157c47';
  var OPT_INS = ['nms_2027_marketing_opt_in', 'nms_2027_sponsor_sharing_opt_in'];
  var me = document.currentScript;
  var NMS = Object.assign({
    confirmUrl: me && me.src ? new URL('youre-in/', me.src).href : '',
    utmFields: ['utm_source', 'utm_medium']
  }, window.NMS || {});

  // the header gets a hairline once the page scrolls
  var top = document.querySelector('.top');
  if (top) {
    var onScroll = function () { top.classList.toggle('is-scrolled', window.scrollY > 8); };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  // every "Save my free seat" takes people to the form on the side and puts the cursor in it
  var reg = document.getElementById('register');
  function toForm(e) {
    if (!reg) return;
    if (e) e.preventDefault();
    reg.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    var f = reg.querySelector('input[name=firstname]'); if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 450);
    if (history.replaceState) history.replaceState(null, '', '#register');
  }
  document.querySelectorAll('[data-register]').forEach(function (a) { a.addEventListener('click', toForm); });

  // source tags from the address, kept for the session (same key as before)
  var params = new URLSearchParams(location.search);
  var src = (function () {
    var q = {};
    try { q = JSON.parse(sessionStorage.getItem('nms27-src') || '{}') || {}; } catch (e) {}
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref'].forEach(function (h) {
      var v = (params.get(h) || '').trim(); if (v) q[h] = v.slice(0, 255);
    });
    try { sessionStorage.setItem('nms27-src', JSON.stringify(q)); } catch (e) {}
    return q;
  })();

  function normUrl(v) {
    var t = v.trim(); if (!t || /\s/.test(t)) return '';
    try {
      var u = new URL(/^[a-z][a-z\d+.\-]*:/i.test(t) ? t : 'https://' + t);
      return (['http:', 'https:'].indexOf(u.protocol) < 0 || u.username || u.password || u.hostname.indexOf('.') < 0 || /\.$/.test(u.hostname)) ? '' : u.href;
    } catch (e) { return ''; }
  }
  function setErr(el, msg) {
    if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
    var s = document.getElementById(el.id + '-error'); if (s) s.textContent = msg;
  }
  // phone: optional. Digits with the chosen country's calling code, unless the person typed their own +code.
  function phoneOf(f) {
    var raw = f.phone.value.trim(); if (!raw) return { ok: true, value: '' };
    var plus = raw.charAt(0) === '+', d = raw.replace(/[^\d]/g, '');
    var opt = f.phoneCountry.selectedOptions[0], dial = opt ? opt.getAttribute('data-dial') : '';
    var full = plus ? d : (dial || '') + d.replace(/^0+/, '');
    return { ok: full.length >= 8 && full.length <= 15, value: '+' + full };
  }
  function check(f) {
    var e = f.elements, ph = phoneOf(e), site = normUrl(e.website.value), first;
    [[e.firstname, !e.firstname.value.trim(), 'Enter your first name.'],
     [e.lastname, !e.lastname.value.trim(), 'Enter your last name.'],
     [e.email, !e.email.value.trim() || !e.email.validity.valid, 'Enter a valid email address.'],
     [e.company, !e.company.value.trim(), 'Enter your company or organization name.'],
     [e.website, !site, 'Enter a website, such as yournonprofit.org.'],
     [e.phone, !ph.ok, 'Check the country and phone number, or leave the number blank.']
    ].forEach(function (r) { setErr(r[0], r[1] ? r[2] : ''); if (r[1] && !first) first = r[0]; });
    if (first) { first.focus(); return null; }
    var out = { firstname: e.firstname.value.trim(), lastname: e.lastname.value.trim(), email: e.email.value.trim(), company: e.company.value.trim(), website: site };
    if (ph.value) out.phone = ph.value;
    OPT_INS.forEach(function (n) { out[n] = String(e[n].checked); });
    return out;
  }

  document.querySelectorAll('form[data-pass-form]').forEach(function (form) {
    var status = form.querySelector('[data-registration-status]'), btn = form.querySelector('[type=submit]'), busy = false;
    var say = function (t, err) { status.textContent = t; status.toggleAttribute('data-error', !!err); };
    // the country box shows "US +1"
    var sel = form.elements.phoneCountry, code = form.querySelector('[data-country-code]');
    if (sel && code) { var show = function () { var o = sel.selectedOptions[0]; if (o) code.textContent = o.value + ' +' + o.getAttribute('data-dial'); }; sel.addEventListener('change', show); show(); }
    form.addEventListener('input', function (ev) { if (ev.target.getAttribute('aria-invalid') === 'true') setErr(ev.target, ''); });
    form.addEventListener('submit', async function (ev) {
      ev.preventDefault(); if (busy) return;
      var data = check(form); if (!data) { say('Check the highlighted fields.', true); return; }
      (NMS.utmFields || []).forEach(function (h) { var v = (params.get(h) || src[h] || '').trim(); if (v) data[h] = v.slice(0, 255); });
      if (NMS.refField) { var r = (params.get('ref') || src.ref || '').trim(); if (r) data[NMS.refField] = r.slice(0, 255); }
      var fields = Object.keys(data).map(function (k) { return { objectTypeId: '0-1', name: k, value: data[k] }; });
      var ctx = { pageName: document.title, pageUri: location.origin + location.pathname };
      var ac = new AbortController(), timer = setTimeout(function () { ac.abort(); }, 20000), saved = false;
      busy = true; btn.disabled = true; say('Saving your seat…');
      try {
        var res = await fetch(HS, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: fields, context: ctx }), credentials: 'omit', redirect: 'error', signal: ac.signal });
        if (res.status === 200) {
          saved = true;
          var next = new URL(NMS.confirmUrl || 'youre-in/', location.href), room = form.elements.room && form.elements.room.value;
          if (['foundation', 'scale', 'unsure'].indexOf(room) >= 0) next.searchParams.set('stage', room);
          try { sessionStorage.setItem('nms27-first', data.firstname.split(/\s+/)[0].slice(0, 40)); sessionStorage.setItem('nms27-org', data.company.slice(0, 60)); } catch (e) {}
          say('Your seat is saved. Opening your confirmation…');
          document.dispatchEvent(new CustomEvent('nms:saved', { detail: data.firstname }));
          location.assign(next.href); return;
        }
        say(res.status === 429 ? 'Too many registrations arrived at once. Please wait a moment and try again.' : 'Your registration wasn’t accepted. Check your details and try again.', true);
      } catch (e) {
        say(saved ? 'Your seat is saved. Check your email for your summit details.' : 'We couldn’t confirm your registration. Check your inbox before trying again.', !saved);
      } finally { clearTimeout(timer); if (!saved) { busy = false; btn.disabled = false; } }
    });
    btn.disabled = false;
  });
})();
