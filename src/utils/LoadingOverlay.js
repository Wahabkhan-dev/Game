// ════════════════════════════════════════════════════════════════════════════
// LoadingOverlay — shows/hides the SAME plain-DOM loading screen used at boot
// (index.html's #loading-screen), reused for every level transition ("Menu" /
// "Next Level" buttons in EndModals.js).
//
// Deliberately plain DOM/CSS, NOT a Phaser Scene: an earlier version routed
// the loading screen through a second persistent Phaser scene (launched on
// top, stopped via rAF/interval polling once the target scene was confirmed
// running) — that added Phaser scene-management complexity was itself the
// source of hangs/latency. A DOM overlay can't hang: showing it is a single
// synchronous style change, so it always appears INSTANTLY regardless of
// whatever Phaser is doing underneath (which matters most on a real deploy,
// where the next scene's images/videos may need actual network time to load,
// unlike localhost dev where everything's already cached).
// ════════════════════════════════════════════════════════════════════════════

const TIPS = ['Loading...', 'Almost there...', 'Getting things ready...'];

export function showLoadingOverlay() {
  const ls = document.getElementById('loading-screen');
  if (!ls) return;
  const bar = document.getElementById('load-bar');
  const tip = document.getElementById('load-tip');
  if (bar) bar.style.width = '0%';
  if (tip) tip.textContent = TIPS[0];
  ls.style.display = 'flex';
  // Force a reflow so the browser registers display:flex BEFORE the opacity
  // transition below starts — otherwise the two changes on the same tick can
  // collapse into no visible transition (or none at all) in some browsers.
  void ls.offsetHeight;
  ls.style.opacity = '1';

  // Purely cosmetic indeterminate fill — there's no real byte-progress signal
  // for a scene that's already 99% cached, so this just gives the bar visible
  // motion instead of sitting frozen at 0% the whole time.
  let pct = 0;
  const iv = setInterval(() => {
    pct = Math.min(92, pct + 6);
    if (bar) bar.style.width = pct + '%';
    if (tip) tip.textContent = TIPS[Math.min(TIPS.length - 1, Math.floor(pct / 35))];
  }, 120);
  ls._loadingOverlayInterval = iv;
}

export function hideLoadingOverlay() {
  const ls = document.getElementById('loading-screen');
  if (!ls) return;
  if (ls._loadingOverlayInterval) { clearInterval(ls._loadingOverlayInterval); ls._loadingOverlayInterval = null; }
  const bar = document.getElementById('load-bar');
  if (bar) bar.style.width = '100%';
  ls.style.opacity = '0';
  setTimeout(() => { ls.style.display = 'none'; }, 350);
}
