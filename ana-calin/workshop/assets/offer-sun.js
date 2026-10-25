/* Ana's sunflower (offer-sun.css): each one blooms the first time it is well in view, and turns its face toward the
   pointer, the way a sunflower follows the sun. Reduced motion: nothing moves, the flowers are simply in bloom. */
(function(){
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.documentElement.classList.add('sf-js');
  var flowers = [].slice.call(document.querySelectorAll('.sf,.sun-big'));
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('sf-in'); io.unobserve(e.target) } });
    }, {threshold: .6});
    flowers.forEach(function(f){ io.observe(f) });
  } else flowers.forEach(function(f){ f.classList.add('sf-in') });

  if (!matchMedia('(pointer: fine)').matches) return;
  var mx = 0, my = 0, raf = 0;
  function look(){
    raf = 0;
    flowers.forEach(function(f){
      var r = f.getBoundingClientRect();
      if (r.bottom < -100 || r.top > innerHeight + 100 || !r.width) return;
      var big = f.classList.contains('sun-big');
      var cx = r.left + r.width / 2, cy = r.top + r.height * (big ? .28 : .5);
      var dx = mx - cx, dy = my - cy, d = Math.sqrt(dx * dx + dy * dy) || 1, k = Math.min(1, d / 500), m = big ? 8 : 2.2;
      f.style.setProperty('--hx', (dx / d * m * k).toFixed(2) + 'px');
      f.style.setProperty('--hy', (dy / d * m * k).toFixed(2) + 'px');
      f.style.setProperty('--hr', (Math.max(-1, Math.min(1, dx / 520)) * (big ? 10 : 8)).toFixed(2) + 'deg');
    });
  }
  addEventListener('pointermove', function(e){ mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(look) }, {passive: true});
})();
