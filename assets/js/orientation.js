/* ═══════════════════════════════════════════════════════════════════
   THE SONIC MEDIA — TABLET / iPAD ORIENTATION SWITCHING
   ───────────────────────────────────────────────────────────────────
   • Portrait  → body[data-orientation="portrait"]  → full mobile UX
   • Landscape → body[data-orientation="landscape"] → full desktop UX
   • Only activates for genuine tablet-sized screens (600–1366px
     on their shorter dimension), leaving phones and large desktops
     completely unaffected.
   • Re-triggers all JS-side layout logic (FV cards, svc carousel,
     GSAP ScrollTrigger, video sources) so the switch is seamless.
═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Tablet range: shorter side 600–1366px ───────────────────── */
  var TAB_MIN = 600;
  var TAB_MAX = 1366;

  /* Is the current device a tablet-sized screen? */
  function isTabletSized() {
    var w = window.screen.width;
    var h = window.screen.height;
    var shorter = Math.min(w, h);
    var longer  = Math.max(w, h);
    return shorter >= TAB_MIN && longer <= TAB_MAX;
  }

  /* Derive orientation from window dimensions (works after rotation) */
  function currentOrientation() {
    return window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait';
  }

  /* ── Effective mobile breakpoint used throughout app.js ─────── */
  var MOBILE_BP = 768;

  /* Fake innerWidth so JS checks like `window.innerWidth <= 768`
     give the right answer during and after orientation callbacks.
     We proxy the getter on window; the assignment is harmless on
     browsers that ignore it, but our proxy intercepts it.          */
  var _fakeWidth = null;

  function patchWindowWidth(fakeW) {
    _fakeWidth = fakeW;
  }
  function unpatchWindowWidth() {
    _fakeWidth = null;
  }

  /* Override window.innerWidth so app.js helper functions see
     the right value while we trigger them from orientation code. */
  try {
    Object.defineProperty(window, '_tsm_effectiveWidth', {
      get: function () {
        return _fakeWidth !== null ? _fakeWidth : window.innerWidth;
      },
      configurable: true
    });
  } catch (e) { /* older browsers — graceful degradation */ }

  /* ── FV (Future Vision) card rebuild ───────────────────────── */
  function rebuildFVCards(isMobile) {
    /* buildFVHome / buildFVPage are defined in app.js; call them if
       available. The guard prevents errors when the page hasn't loaded. */
    if (typeof window.buildFVHome === 'function') window.buildFVHome();
    if (typeof window.buildFVPage === 'function') window.buildFVPage();

    /* Manually toggle display if build functions not exposed */
    var homeMob  = document.getElementById('home-fv-mobile');
    var homeDsk  = document.getElementById('home-fv-desktop');
    var pageMob  = document.getElementById('page-fv-mobile');
    var pageDsk  = document.getElementById('page-fv-desktop');

    if (isMobile) {
      if (homeMob) homeMob.style.removeProperty('display');
      if (homeDsk) homeDsk.style.removeProperty('display');
      if (pageMob) pageMob.style.removeProperty('display');
      if (pageDsk) pageDsk.style.removeProperty('display');
    } else {
      if (homeMob) homeMob.style.removeProperty('display');
      if (homeDsk) homeDsk.style.removeProperty('display');
      if (pageMob) pageMob.style.removeProperty('display');
      if (pageDsk) pageDsk.style.removeProperty('display');
    }
  }

  /* ── Services carousel vs. coverflow ────────────────────────── */
  function refreshServicesLayout(isMobile) {
    var carousel  = document.getElementById('pageMobSvcCarousel');
    var coverflow = document.getElementById('pageSvcScrollWrapper');
    var hCarousel = document.getElementById('homeMobSvcCarousel');
    var hCoverflow= document.getElementById('homeSvcScrollWrapper');

    if (isMobile) {
      if (carousel)  { carousel.style.display  = 'flex'; }
      if (coverflow) { coverflow.style.display  = 'none'; }
      if (hCarousel) { hCarousel.style.display  = 'flex'; }
      if (hCoverflow){ hCoverflow.style.display = 'none'; }
    } else {
      if (carousel)  { carousel.style.display  = 'none'; }
      if (coverflow) { coverflow.style.display  = ''; }
      if (hCarousel) { hCarousel.style.display  = 'none'; }
      if (hCoverflow){ hCoverflow.style.display = ''; }
    }
  }

  /* ── Video source switching ─────────────────────────────────── */
  function refreshVideoSources(isMobile) {
    if (typeof window.setResponsiveVideoSrc !== 'function') return;
    document.querySelectorAll('video').forEach(function (vid) {
      window.setResponsiveVideoSrc(vid, isMobile);
    });
  }

  /* ── GSAP ScrollTrigger refresh ─────────────────────────────── */
  function refreshScrollTrigger() {
    if (window.ScrollTrigger && typeof window.ScrollTrigger.refresh === 'function') {
      setTimeout(function () { window.ScrollTrigger.refresh(); }, 100);
    }
  }

  /* ── Mobile nav drawer: close on orientation change ─────────── */
  function closeMobileDrawer() {
    var drawer = document.getElementById('mobNavDrawer');
    var overlay= document.getElementById('mobNavOverlay');
    if (drawer  && drawer.classList.contains('open'))  drawer.classList.remove('open');
    if (overlay && overlay.classList.contains('open')) overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ── Cursor: hide custom cursor on mobile, show on desktop ─── */
  function refreshCursor(isMobile) {
    var cursor = document.getElementById('tsm-cursor');
    if (!cursor) return;
    cursor.style.display = isMobile ? 'none' : '';
  }

  /* ── Main apply function ─────────────────────────────────────── */
  var _lastOrientation = null;

  function applyOrientation() {
    if (!isTabletSized()) {
      /* Not a tablet: remove any previously set attribute and exit */
      if (document.body.hasAttribute('data-orientation')) {
        document.body.removeAttribute('data-orientation');
      }
      _lastOrientation = null;
      return;
    }

    var orientation = currentOrientation();

    /* Skip if nothing changed */
    if (orientation === _lastOrientation) return;
    _lastOrientation = orientation;

    var isMobile = (orientation === 'portrait');

    /* 1. Stamp the attribute — CSS picks this up immediately */
    document.body.setAttribute('data-orientation', orientation);

    /* 2. Close mobile nav drawer to prevent stale state */
    closeMobileDrawer();

    /* 3. Refresh JS-driven layout components */
    refreshServicesLayout(isMobile);
    rebuildFVCards(isMobile);
    refreshVideoSources(isMobile);
    refreshCursor(isMobile);

    /* 4. Nudge GSAP after layout has settled */
    refreshScrollTrigger();

    /* 5. Dispatch a custom event so other modules can react */
    try {
      window.dispatchEvent(new CustomEvent('tsmOrientationChange', {
        detail: { orientation: orientation, isMobile: isMobile }
      }));
    } catch (e) { /* IE11 CustomEvent fallback — not critical */ }
  }

  /* ── Boot ─────────────────────────────────────────────────────── */
  function boot() {
    /* Run once on load */
    applyOrientation();

    /* Listen for orientation changes via screen.orientation API */
    if (window.screen && window.screen.orientation) {
      window.screen.orientation.addEventListener('change', function () {
        /* Small delay so innerWidth/Height have updated */
        setTimeout(applyOrientation, 80);
      });
    }

    /* Fallback: resize event (covers all browsers) */
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(applyOrientation, 80);
    }, { passive: true });

    /* Legacy orientationchange event (iOS Safari) */
    window.addEventListener('orientationchange', function () {
      setTimeout(applyOrientation, 120);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
