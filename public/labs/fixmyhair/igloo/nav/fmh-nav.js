/* Copied from fixmyhair-site-main (dark-10k) assets/nav/fmh-nav.js. Keep in sync with the site. */
/* fmh-nav: drop-down, phone drawer, and the sticky header that hides on the way down and returns on the way up. */
(function () {
  var nav = document.getElementById('nav');
  if (!nav || !nav.classList.contains('fnav')) return;
  var root = document.documentElement, burger = nav.querySelector('.fnav-burger'), tb = nav.querySelector('.fnav-tbtn'), has = nav.querySelector('.fnav-has');
  var phone = matchMedia('(max-width: 899px)');
  var isOpen = function () { return nav.classList.contains('is-open'); };
  var dropOpen = function () { return !!tb && tb.getAttribute('aria-expanded') === 'true'; };
  function setDrop(open) { if (tb) tb.setAttribute('aria-expanded', String(open)); }
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    root.classList.toggle('fnav-lock', open);
    if (burger) { burger.setAttribute('aria-expanded', String(open)); burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); }
    if (phone.matches) setDrop(open);   /* in the drawer the treatment links are always shown */
    if (open) nav.classList.remove('is-hidden');
  }
  if (tb) tb.addEventListener('click', function () { if (!phone.matches) setDrop(!dropOpen()); });
  if (burger) burger.addEventListener('click', function () { setMenu(!isOpen()); });
  nav.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a')) { setMenu(false); setDrop(false); } });
  document.addEventListener('click', function (e) { if (!phone.matches && dropOpen() && !has.contains(e.target)) setDrop(false); });
  if (has) has.addEventListener('focusout', function (e) { if (!phone.matches && !has.contains(e.relatedTarget)) setDrop(false); });
  addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (isOpen()) { setMenu(false); if (burger) burger.focus(); }
    else if (dropOpen()) { setDrop(false); tb.focus(); }
  });
  phone.addEventListener('change', function () { setMenu(false); setDrop(false); });

  var lastY = scrollY;
  function onScroll() {
    var y = scrollY, dy = y - lastY; lastY = y;
    nav.classList.toggle('is-scrolled', y > 8);
    if (isOpen() || dropOpen() || nav.contains(document.activeElement)) { nav.classList.remove('is-hidden'); return; }
    if (y < 120 || dy < -4) nav.classList.remove('is-hidden');
    else if (dy > 4) nav.classList.add('is-hidden');
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
