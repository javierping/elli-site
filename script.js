// Защита от копирования: выделение, копирование, контекстное меню, drag
(function () {
  ['copy', 'cut', 'selectstart', 'dragstart', 'contextmenu'].forEach(function (ev) {
    document.addEventListener(ev, function (e) { e.preventDefault(); });
  });
  document.addEventListener('keydown', function (e) {
    var k = (e.key || '').toLowerCase();
    if ((e.ctrlKey || e.metaKey) && (k === 'c' || k === 'x' || k === 'a' || k === 's' || k === 'u')) {
      e.preventDefault();
    }
  });
})();

// Плавное появление секций при прокрутке.
// После проявления служебные классы снимаются — чтобы вернуть
// карточкам их собственные быстрые hover-переходы (тени и подъём).
(function () {
  var sels = '.sec-head,.pic,.txt,.edu,.price,.duo figure,.car,.price-note,.zoom-list,.checklist,.contact-btns,.thanks .wrap';
  var els = document.querySelectorAll(sels);
  if (!('IntersectionObserver' in window)) return; // без JS-анимации — всё статично

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      io.unobserve(el);
      el.classList.add('in');
      function clear() {
        // .in-состояние совпадает с обычным, поэтому снятие классов незаметно
        el.classList.remove('rv', 'in');
        el.removeEventListener('transitionend', onEnd);
        clearTimeout(t);
      }
      function onEnd(ev) { if (ev.target === el && ev.propertyName === 'opacity') clear(); }
      var t = setTimeout(clear, 900);
      el.addEventListener('transitionend', onEnd);
    });
  }, { threshold: .1, rootMargin: '0px 0px -40px 0px' });

  els.forEach(function (el) {
    el.classList.add('rv');
    io.observe(el);
  });
})();

// Карусель на transform: кнопки, точки, перетаскивание мышью и свайп.
// Никакого scrollLeft — потому и нет «застреваний».
(function () {
  var vp = document.getElementById('carVp');
  var inner = document.getElementById('carTrack');
  var dotsBox = document.getElementById('carDots');
  var prev = document.querySelector('.car-prev');
  var next = document.querySelector('.car-next');
  if (!vp || !inner) return;

  var imgs = inner.querySelectorAll('img');
  var idx = 0, dotEls = [];

  function gap() {
    var s = getComputedStyle(inner);
    return parseFloat(s.columnGap || s.gap) || 20;
  }
  function step() { return imgs[0].getBoundingClientRect().width + gap(); }
  function maxOffset() {
    return Math.max(0, inner.scrollWidth - vp.clientWidth);
  }
  function maxIdx() {
    var st = step();
    return Math.max(0, Math.ceil((maxOffset() - 1) / st));
  }
  function offsetFor(i) {
    return Math.min(i * step(), maxOffset());
  }
  function render(animate) {
    inner.style.transition = animate === false ? 'none' : '';
    inner.style.transform = 'translateX(' + (-offsetFor(idx)) + 'px)';
    setDot(idx);
    updateBtns();
  }
  function setDot(i) {
    dotEls.forEach(function (d, k) { d.classList.toggle('on', k === i); });
  }
  function updateBtns() {
    var m = maxIdx();
    prev.disabled = idx <= 0;
    next.disabled = idx >= m;
  }

  // точки (перестраиваются при изменении размера)
  function buildDots() {
    dotsBox.innerHTML = '';
    dotEls = [];
    var m = maxIdx();
    for (var k = 0; k <= m; k++) {
      (function (k) {
        var d = document.createElement('span');
        d.addEventListener('click', function () { idx = k; render(); });
        dotsBox.appendChild(d);
        dotEls.push(d);
      })(k);
    }
  }

  prev.addEventListener('click', function () { idx = Math.max(0, idx - 1); render(); });
  next.addEventListener('click', function () { idx = Math.min(maxIdx(), idx + 1); render(); });

  // перетаскивание мышью / свайп
  var drag = null;
  vp.addEventListener('pointerdown', function (e) {
    drag = { x: e.clientX, start: -offsetFor(idx), moved: false };
    vp.classList.add('dragging');
    vp.setPointerCapture(e.pointerId);
  });
  vp.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.x;
    if (Math.abs(dx) > 4) drag.moved = true;
    var t = drag.start + dx;
    var max = -maxOffset();
    // лёгкое сопротивление на краях
    if (t > 0) t = t / 3;
    if (t < max) t = max + (t - max) / 3;
    inner.style.transition = 'none';
    inner.style.transform = 'translateX(' + t + 'px)';
  });
  function endDrag(e) {
    if (!drag) return;
    var dx = e.clientX - drag.x;
    var st = step();
    var base = -drag.start;
    var target = Math.round((base - dx) / st);
    idx = Math.min(Math.max(target, 0), maxIdx());
    drag = null;
    vp.classList.remove('dragging');
    render();
  }
  vp.addEventListener('pointerup', endDrag);
  vp.addEventListener('pointercancel', endDrag);
  vp.addEventListener('pointerleave', function (e) { if (drag && e.buttons === 0) endDrag(e); });

  // пересчёт при изменении окна
  var rz = null;
  window.addEventListener('resize', function () {
    if (rz) clearTimeout(rz);
    rz = setTimeout(function () {
      idx = Math.min(idx, maxIdx());
      buildDots();
      render(false);
    }, 120);
  });

  buildDots();
  render(false);
})();
