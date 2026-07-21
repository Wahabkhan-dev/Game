import { W, H } from '../config/GameConfig.js';

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

// Full-screen video overlay with a skip button and a safety timeout, for
// scenes that don't extend BaseLevelScene (which has its own private copy of
// this same pattern, used by Level 1/2). Pauses arcade physics for the
// duration if the scene has it.
export function playVideoOverlay(scene, key, onDone, opts = {}) {
  if (scene._videoOverlayOpen) return;
  scene._videoOverlayOpen = true;
  if (scene.physics?.world) scene.physics.pause();

  const bg = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 1)
    .setScrollFactor(0).setDepth(200);

  let video = null;
  let done = false;
  const finish = () => {
    if (done) return; done = true;
    scene._videoOverlayOpen = false;
    if (safety) safety.remove(false);
    try { video?.stop(); video?.destroy(); } catch (_) {}
    try { bg.destroy(); skip.destroy(); } catch (_) {}
    if (scene.physics?.world) scene.physics.resume();
    if (onDone) onDone();
  };

  if (!scene.cache.video.exists(key)) { finish(); return; }

  video = scene.add.video(W / 2, H / 2, key).setScrollFactor(0).setDepth(201);
  video.on('created', () => {
    const scale = Math.min(W / video.width, H / video.height);
    video.setScale(scale);
  });
  video.play();
  video.on('complete', finish);

  // Safety net: only use a timeout when explicitly requested. By default,
  // let the video play all the way through until the user skips it.
  const safety = Number.isFinite(opts.maxMs) && opts.maxMs > 0
    ? scene.time.delayedCall(opts.maxMs, finish)
    : null;

  const skip = scene.add.text(W - 16, H - 12, 'SKIP  ›', {
    fontSize: '12px', fontFamily: 'Georgia, serif', color: '#c8a870',
    stroke: '#000', strokeThickness: 2
  }).setOrigin(1, 1).setScrollFactor(0).setDepth(202)
    .setInteractive({ useHandCursor: true });
  skip.on('pointerup', finish);
}
