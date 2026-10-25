/* Ana Calin, the offer pages: plays the example screens (offer-ui.css). A scene acts out what it shows the first time
   it is mostly on screen (typing, counting, the classes that start its CSS), and starts again from the top when it
   comes back after leaving. Reduced motion, or no IntersectionObserver: every scene stays in its finished state. */
(function(){
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  var scenes = [].slice.call(document.querySelectorAll('[data-anim]'));

  function fmt(e, n){ var p = e.getAttribute('data-pre') || ''; return p + Math.round(n).toLocaleString('en-US') }
  function prep(sc){
    sc._gen = (sc._gen || 0) + 1;
    (sc._t || []).forEach(clearTimeout); (sc._t || []).forEach(clearInterval); sc._t = [];
    sc.querySelectorAll('[data-type]').forEach(function(e){ if (e._full == null) e._full = e.textContent; e.textContent = ''; e.classList.remove('typing') });
    sc.querySelectorAll('[data-count]').forEach(function(e){ e.textContent = fmt(e, +(e.getAttribute('data-from') || 0)) });
  }
  function later(sc, fn, ms){ var t = setTimeout(fn, ms); sc._t.push(t); return t }
  function type(sc, e){
    var full = e._full, cps = +(e.getAttribute('data-cps') || 24), i = 0;
    later(sc, function(){
      e.classList.add('typing');
      var iv = setInterval(function(){
        i++; e.textContent = full.slice(0, i);
        if (i >= full.length) { clearInterval(iv); later(sc, function(){ e.classList.remove('typing') }, 350) }
      }, 1000 / cps);
      sc._t.push(iv);
    }, +(e.getAttribute('data-d') || 0) * 1000);
  }
  function count(sc, e){
    var to = +e.getAttribute('data-count'), from = +(e.getAttribute('data-from') || 0), step = e.getAttribute('data-step');
    later(sc, function(){
      if (step) {   // one at a time, every `step` seconds (an inbox filling up)
        var n = from; var iv = setInterval(function(){ n++; e.textContent = fmt(e, n); if (n >= to) clearInterval(iv) }, +step * 1000); sc._t.push(iv);
      } else {      // a quick count up, easing out
        var t0 = performance.now(), dur = +(e.getAttribute('data-dur') || 1.4) * 1000;
        var gen = sc._gen;
        (function tick(t){ if (gen !== sc._gen) return; var k = Math.min(1, (t - t0) / dur); e.textContent = fmt(e, from + (to - from) * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick) })(t0);
      }
    }, +(e.getAttribute('data-d') || 0) * 1000);
  }
  function play(sc){
    if (sc.classList.contains('u-play')) return;
    prep(sc); void sc.offsetWidth; sc.classList.add('u-play');
    sc.querySelectorAll('[data-type]').forEach(function(e){ type(sc, e) });
    sc.querySelectorAll('[data-count]').forEach(function(e){ count(sc, e) });
  }
  function reset(sc){ if (!sc.classList.contains('u-play')) return; sc.classList.remove('u-play'); prep(sc) }

  scenes.forEach(function(sc){ sc.classList.add('u-armed'); prep(sc) });
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){ if (e.intersectionRatio >= .5 || e.intersectionRect.height >= innerHeight * .45) play(e.target); else if (!e.isIntersecting) reset(e.target) });
  }, {threshold: [0, .1, .2, .3, .4, .5]});
  scenes.forEach(function(sc){ io.observe(sc) });
  window.UScenes = {play: play, reset: reset};
})();
