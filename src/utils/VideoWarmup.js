// ════════════════════════════════════════════════════════════════════════════
// VideoWarmup — pre-buffers every level's cinematic in the background so it
// plays INSTANTLY when triggered.
//
// Why this exists: Phaser 3.60's `load.video()` does NOT download the video —
// it only records the URL (see VideoFile.onProcess, which completes without
// fetching). The real network fetch happens the moment `add.video(key).play()`
// runs, so every cinematic used to stall on a black screen while it buffered
// from the remote (Cloudinary) host.
//
// Fix: right after boot, create hidden <video preload="auto"> elements for each
// registered URL (staggered so they don't all saturate the connection at once).
// The browser buffers them into its HTTP cache while the player is on the menu /
// early levels; when Phaser later plays the SAME url, it's served from cache —
// no start delay.
// ════════════════════════════════════════════════════════════════════════════

let _started = false;

export function warmUpVideos(scene) {
  if (_started) return;
  _started = true;

  // Pull every registered video URL straight out of Phaser's video cache
  // (populated by BootScene's load.video calls) — no need to duplicate the list.
  const cache = scene.cache.video;
  let keys = [];
  try { keys = cache.getKeys(); } catch (_) {
    try { keys = Object.keys(cache.entries.entries || {}); } catch (_) { keys = []; }
  }
  // Level 1's cinematics warm FIRST (immediately, no stagger) — it's the very
  // first thing a player hits, so its intro must be buffered by the time they
  // press "Level 1". The rest follow, staggered.
  const PRIORITY = ['intro_video', 'l1_food_video', 'l1_conclusion_video', 'l1_gameover_video', 'gemma_cage_loop'];
  const orderedKeys = [
    ...PRIORITY.filter(k => keys.includes(k)),
    ...keys.filter(k => !PRIORITY.includes(k)),
  ];
  const priorityCount = PRIORITY.filter(k => keys.includes(k)).length;

  const urls = [];
  const urlIsPriority = [];
  orderedKeys.forEach((k, idx) => {
    const e = cache.get(k);
    const url = e && (e.url || (e.data && e.data.url));
    if (url && !urls.includes(url)) { urls.push(url); urlIsPriority.push(idx < priorityCount); }
  });
  if (!urls.length) return;

  // Hidden, off-screen container the warm-up <video> elements live in.
  let box = document.getElementById('video-warmup');
  if (!box) {
    box = document.createElement('div');
    box.id = 'video-warmup';
    box.style.cssText =
      'position:absolute;left:-9999px;top:0;width:1px;height:1px;' +
      'overflow:hidden;opacity:0;pointer-events:none;';
    document.body.appendChild(box);
  }

  const makeWarm = (url) => {
    const v = document.createElement('video');
    v.preload = 'auto';
    v.muted = true;
    v.playsInline = true;
    v.crossOrigin = 'anonymous';
    v.src = url;
    // Kick the browser into actually buffering it into the HTTP cache.
    try { v.load(); } catch (_) {}
    box.appendChild(v);
  };

  // Priority (Level 1) videos start buffering RIGHT NOW; the rest are staggered
  // so the connection isn't hammered by 40+ simultaneous downloads.
  let staggerIdx = 0;
  urls.forEach((url, i) => {
    if (urlIsPriority[i]) {
      makeWarm(url);
    } else {
      setTimeout(() => makeWarm(url), (staggerIdx++) * 300 + 500);
    }
  });
}
