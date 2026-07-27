import { W, H } from '../config/GameConfig.js';

// A small, continuously-looping IN-PLACE video (as opposed to every other
// video helper here, which is a full-screen one-shot cutscene) — used to
// replace a static image with an animated clip sitting at a fixed spot in
// the scene, e.g. "Gemma idling in her cage". Loops natively via Phaser's
// own Video.play(loop) — no manual restart-on-'complete' wiring, so there's
// no gap/flash between cycles. Muted by default so autoplay isn't blocked
// by the browser (this is ambient background motion, not a cutscene with
// dialogue/sound).
export function addLoopingVideo(scene, x, y, key, opts = {}) {
  const vid = scene.add.video(x, y, key)
    .setOrigin(opts.originX ?? 0.5, opts.originY ?? 0.5)
    .setDepth(opts.depth ?? 8);
  if (opts.mute !== false) vid.setMute(true);
  // MUST wait for 'created' — a Video's natural width/height are 0 until its
  // metadata loads, so calling setDisplaySize() any earlier computes scale
  // against 0 (broken) and Phaser never re-applies it once the real frame
  // size lands, which renders the clip at its raw, unscaled pixel size.
  if (opts.width && opts.height) {
    // 'created' hands back the clip's REAL pixel size — fit it inside the
    // requested (width, height) box preserving that aspect ratio (never
    // force both dimensions independently), otherwise any clip whose native
    // ratio doesn't match the box gets visibly squashed/stretched sideways
    // (e.g. a ~4:3 clip forced into a wider box reads as horizontally
    // stretched).
    vid.on('created', (_v, vw, vh) => {
      const scale = Math.min(opts.width / vw, opts.height / vh);
      vid.setDisplaySize(vw * scale, vh * scale);
    });
  }
  vid.play(true); // native loop — starts immediately, no delay between cycles
  return vid;
}

// Full-screen story text card — a dark overlay with centered message, held for a
// few seconds then dismissed (or tap to skip), calling onDone. Used to give
// story context (e.g. a death beat) right before a cinematic plays.
export function showStoryCard(scene, message, onDone, opts = {}) {
  const holdMs = Number.isFinite(opts.holdMs) ? opts.holdMs : 2600;

  // fillAlpha is the final darkness; fade it in via the GameObject alpha (0 → 1).
  const bg = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.94)
    .setScrollFactor(0).setDepth(210).setAlpha(0);
  scene.tweens.add({ targets: bg, alpha: 1, duration: 400 });

  const txt = scene.add.text(W / 2, H / 2, message, {
    fontSize: '22px', fontFamily: 'Georgia, serif', color: '#f5c87a',
    stroke: '#000', strokeThickness: 4, align: 'center', lineSpacing: 8,
    wordWrap: { width: W - 120 },
  }).setOrigin(0.5).setScrollFactor(0).setDepth(211).setAlpha(0);
  scene.tweens.add({ targets: txt, alpha: 1, duration: 500, delay: 200 });

  let done = false;
  const finish = () => {
    if (done) return; done = true;
    if (timer) timer.remove(false);
    try { bg.destroy(); txt.destroy(); hit.destroy(); } catch (_) {}
    if (onDone) onDone();
  };
  const timer = scene.time.delayedCall(holdMs, finish);

  // Tap anywhere to skip ahead.
  const hit = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.001)
    .setScrollFactor(0).setDepth(212).setInteractive({ useHandCursor: true });
  hit.on('pointerup', finish);
}

// Play several video keys back-to-back as ONE continuous overlay (used to
// "merge" clips like Level 7's intro V1+V2 and the V4+V5 bridge). Each clip
// runs to completion (or is skipped) before the next begins; onDone fires once
// after the last. Missing keys are skipped over gracefully.
export function playVideoSequence(scene, keys, onDone) {
  const list = (keys || []).filter(Boolean);
  let i = 0;
  const playNext = () => {
    if (i >= list.length) { if (onDone) onDone(); return; }
    const key = list[i++];
    playVideoOverlay(scene, key, playNext);
  };
  playNext();
}

// Full-screen video overlay with a skip button and a safety timeout, for
// scenes that don't extend BaseLevelScene (which has its own private copy of
// this same pattern, used by Level 1/2). Pauses arcade physics for the
// duration if the scene has it.
export function playVideoOverlay(scene, key, onDone, opts = {}) {
  if (scene._videoOverlayOpen) {
    // A previous overlay on this scene is still playing (e.g. a stage's own
    // intro video hadn't finished yet when the player already finished the
    // stage's mini-games and triggered the end-of-stage video/transition).
    // Queue this request to run the instant the current one finishes, rather
    // than dropping it — dropping it silently ate onDone() forever, which is
    // what left the game on a permanent blank screen after Stage 2 whenever
    // the player was faster than Stage 2's own intro cutscene.
    if (!scene._videoOverlayQueue) scene._videoOverlayQueue = [];
    scene._videoOverlayQueue.push(() => playVideoOverlay(scene, key, onDone, opts));
    return;
  }
  scene._videoOverlayOpen = true;
  if (scene.physics?.world) scene.physics.pause();

  // Touch controls must never show over a cutscene — hide them for the
  // duration, then restore whatever visibility the level had before
  // (CSS still keeps them off on large screens regardless).
  const footer = document.getElementById('game-footer');
  const footerWasVisible = !!footer && footer.style.display !== 'none';
  if (footer) footer.style.display = 'none';

  const bg = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 1)
    .setScrollFactor(0).setDepth(200);

  let video = null;
  let done = false;
  let safetyTO = null;   // DOM timer — fires even when the Phaser clock is frozen
  // Restore the RAF game loop if it went to sleep (webview focus loss sets
  // loop.hasFocus=false, which makes TimeStep.step() a silent no-op — so any
  // scene.start() queued by onDone() never gets processed → black screen).
  const wakeLoop = () => {
    try {
      const l = scene.game?.loop; if (!l) return;
      if (l.hasFocus === false) l.hasFocus = true;
      if (l.running === false) { l.wake?.(); l.resume?.(); }
    } catch (_) {}
  };
  const finish = () => {
    if (done) return; done = true;
    scene._videoOverlayOpen = false;
    if (safety) safety.remove(false);
    if (safetyTO) { clearTimeout(safetyTO); safetyTO = null; }
    try { video?.stop(); video?.destroy(); } catch (_) {}
    try { bg.destroy(); skip.destroy(); } catch (_) {}
    if (scene.physics?.world) scene.physics.resume();
    if (footer && footerWasVisible) footer.style.display = 'flex';
    // Wake the loop BEFORE handing control back — otherwise the scene transition
    // that onDone() is about to trigger would freeze on a black screen.
    wakeLoop();
    if (onDone) onDone();
    // Now that this overlay is fully closed, run the next queued request (if
    // any queued up while this one was still playing).
    if (scene._videoOverlayQueue && scene._videoOverlayQueue.length) {
      const next = scene._videoOverlayQueue.shift();
      next();
    }
  };

  if (!scene.cache.video.exists(key)) { finish(); return; }

  video = scene.add.video(W / 2, H / 2, key).setScrollFactor(0).setDepth(201);
  // DOM safety net armed IMMEDIATELY, before 'created' — if the video never
  // even fires 'created' (decoder unavailable, autoplay silently rejected,
  // slow/broken buffering — all more likely deep into a play session with
  // several videos already using up the browser's limited concurrent video
  // decoders), this is the ONLY thing that can ever unblock the game from a
  // permanent black-screen hang. Uses setTimeout (not the Phaser clock, which
  // may be frozen while the video plays), and is independent of every other
  // event below firing.
  safetyTO = setTimeout(finish, 12000);
  video.on('created', () => {
    const scale = Math.min(W / video.width, H / video.height);
    video.setScale(scale);
    // Now that we know the clip's real length, tighten the fallback to a bit
    // past its own duration instead of the generic ceiling above.
    let durMs = 0;
    try { const d = video.getDuration?.(); if (Number.isFinite(d) && d > 0) durMs = d * 1000; } catch (_) {}
    if (durMs > 0) {
      clearTimeout(safetyTO);
      safetyTO = setTimeout(finish, durMs + 2000);
    }
  });
  video.on('complete', finish);
  video.on('error', finish);
  video.play();

  // Safety net: only use a timeout when explicitly requested. By default,
  // let the video play all the way through until the user skips it.
  const safety = Number.isFinite(opts.maxMs) && opts.maxMs > 0
    ? scene.time.delayedCall(opts.maxMs, finish)
    : null;

  const skip = scene.add.text(W - 16, H - 12, 'SKIP  ›', {
    fontSize: '12px', fontFamily: 'Georgia, serif', color: '#c8a870',
    stroke: '#000', strokeThickness: 2
  }).setOrigin(1, 1).setScrollFactor(0).setDepth(202);
  skip.on('pointerup', finish);

  // Minimum delay before the skip button appears/works — defaults to 3s on
  // every video (same rule as BaseLevelScene's private copy of this pattern)
  // so it can't be insta-skipped before it even registers. Any call site can
  // override via opts.skipDelayMs.
  const skipDelay = Number.isFinite(opts.skipDelayMs) && opts.skipDelayMs >= 0 ? opts.skipDelayMs : 3000;
  if (skipDelay > 0) {
    skip.setAlpha(0).disableInteractive();
    scene.time.delayedCall(skipDelay, () => {
      if (done) return;
      skip.setAlpha(1).setInteractive({ useHandCursor: true });
    });
  } else {
    skip.setInteractive({ useHandCursor: true });
  }
}
