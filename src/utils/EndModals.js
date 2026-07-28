// ════════════════════════════════════════════════════════════════════════════
// EndModals — shared "Try Again" (game over) and "Level Complete" (points +
// Menu/Next Level) modals, used by every level. Plain functions that take a
// `scene` as their first argument, so they work regardless of which class
// hierarchy a level scene extends (BaseLevelScene, L7/L8/L9BaseScene, or a
// fully custom scene like Level3's).
// ════════════════════════════════════════════════════════════════════════════
import Phaser from 'phaser';
import { W, H } from '../config/GameConfig.js';
import { drawModalPanelBg } from '../scenes/levels/ModalFrame.js';

function panelBg(scene, h) {
  // Fully opaque black backdrop — the "Try Again" and "Level Complete / Next
  // Level" modals sit on a solid black background (game scene fully hidden
  // behind), not a see-through dim.
  const bg = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 1)
    .setScrollFactor(0).setDepth(300);
  const panel = scene.add.rectangle(W / 2, H / 2, 360, h, 0x2a1608, 0.97)
    .setScrollFactor(0).setDepth(301).setStrokeStyle(3, 0xf5c87a, 0.9);
  return [bg, panel];
}

function makeButton(scene, x, y, label, color, depth) {
  const btn = scene.add.text(x, y, label, {
    fontSize: '16px', fontFamily: 'Georgia, serif', color: '#fff',
    backgroundColor: color, padding: { x: 18, y: 10 },
  }).setOrigin(0.5).setScrollFactor(0).setDepth(depth).setInteractive({ useHandCursor: true });
  btn.on('pointerover', () => btn.setScale(1.05));
  btn.on('pointerout', () => btn.setScale(1));
  return btn;
}

// Some embedded browsers/webviews (and backgrounded or covered tabs) put
// Phaser's requestAnimationFrame loop to SLEEP and don't reliably wake it —
// a <video> element playing (game-over/level-complete cinematics are the
// norm right before these modals show up) is a common trigger. Without this,
// scene.start()/stop() and any tween only actually advance on the NEXT loop
// tick, which reads as "Try Again"/"Next Level" hanging on the old screen.
function _wakeLoop(game) {
  try {
    const l = game.loop;
    if (!l) return;
    if (l.hasFocus === false) l.hasFocus = true;
    if (l.running === false) { l.wake?.(); l.resume?.(); }
  } catch (_) {}
}

// ── The ONE transition every "Try Again" / "Next Level" / "Menu" button in
// every level (1–9) routes through ──────────────────────────────────────────
//
// The loading screen lives in its OWN persistent scene (LoadingScene,
// registered in main.js) launched on top — NOT drawn on the scene being
// replaced. Because it's a separate scene, it keeps rendering continuously
// across the old scene's stop() and the new scene's FULL preload()+create()
// (including any real videos/images the new scene still needs to load,
// since Phaser doesn't reach RUNNING status until preload's queued loads
// finish and create() has returned). It is only ever removed once the
// target scene is CONFIRMED actually running — never on a guessed fixed
// timer. This guarantees, for every level:
//   • the loading screen is NEVER hidden early
//   • the previous level is never glimpsed mid-transition (no flash/glitch)
//   • the next level is 100% loaded + initialized before play resumes
//   • old tweens/timers/physics/keys are fully cleared first (no leftover
//     state or objects bleeding into the new scene)
//   • a stalled rAF loop (see _wakeLoop above) can't leave it hanging forever
//     — a setInterval fallback (its own timer, independent of Phaser's own
//     clock/rAF) force-pumps game.step() until the target is confirmed up.
function transitionToScene(scene, sceneKey, data) {
  // Full cleanup of the scene being left — kills its tweens/timers/keys and
  // pauses its physics so nothing from the old level can keep running (or
  // firing hazard/timer callbacks) underneath the loading screen.
  try { scene.tweens.killAll(); } catch (_) {}
  try { scene.time.removeAllEvents(); } catch (_) {}
  try { scene.input.keyboard.removeAllKeys(); } catch (_) {}
  try { scene.physics?.pause?.(); } catch (_) {}

  const game = scene.game;
  const sm = game.scene; // Phaser's SceneManager — stable regardless of which individual scene is running/stopped

  _wakeLoop(game);
  sm.launch('LoadingScene');
  sm.bringToTop('LoadingScene');

  const fromKey = scene.sys.settings.key;
  // One rAF tick so the overlay actually paints before the old scene
  // beneath it is torn down — avoids a same-frame destroy+create race.
  requestAnimationFrame(() => {
    _wakeLoop(game);
    sm.stop(fromKey);
    try { sm.start(sceneKey, data); } catch (_) {}

    const isRunning = () => {
      const s = sm.getScene(sceneKey);
      const status = s ? s.sys.settings.status : -1;
      return status === 5 || status === 8 || status === 9 || sm.isActive(sceneKey);
    };

    let tries = 0;
    const iv = setInterval(() => {
      if (isRunning()) { clearInterval(iv); sm.stop('LoadingScene'); return; }
      _wakeLoop(game);
      try {
        const t = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        game.step(t, 16);
      } catch (_) {}
      // ~30s hard ceiling — never spins forever even in some pathological
      // stuck-preload case; still better than an infinite loading screen.
      if (++tries >= 600) { clearInterval(iv); sm.stop('LoadingScene'); }
    }, 50);
  });
}

// Full restart with complete cleanup, handed off to transitionToScene() —
// kept as a named export since it's the one other modules import directly.
export function doFullRestart(scene, sceneKey) {
  transitionToScene(scene, sceneKey);
}

// Shown instead of auto-restarting the level after the player loses all
// lives — the level only actually restarts once "Try Again" is clicked.
export function showTryAgainModal(scene, onRetry) {
  const objs = panelBg(scene, 210);
  objs.push(
    scene.add.text(W / 2, H / 2 - 60, '💔 Game Over', {
      fontSize: '24px', fontFamily: 'Georgia, serif', color: '#f5c87a',
      stroke: '#0a0502', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(302),
    scene.add.text(W / 2, H / 2 - 20, 'You ran out of lives.', {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#e8d0a8',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(302),
  );
  const btn = makeButton(scene, W / 2, H / 2 + 45, '🔁 Try Again', '#5b6cff', 302);
  objs.push(btn);
  btn.on('pointerup', () => {
    objs.forEach(o => { try { o.destroy(); } catch (_) {} });
    // Use full restart if onRetry is a string (scene key), otherwise fall back to callback
    if (typeof onRetry === 'string') {
      transitionToScene(scene, onRetry);
    } else {
      onRetry();
    }
  });
}

// Shown when the player finishes a level — the points collected, plus a
// Menu button and (if nextLevelKey is given) a Next Level button. Neither
// button fires until clicked, so nothing auto-advances.
export function showLevelCompleteModal(scene, points, opts = {}) {
  const { menuKey = 'Menu', nextLevelKey = null, nextLevelData = {} } = opts;

  // Fully opaque black backdrop, same as showTryAgainModal's panelBg().
  const bg = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 1)
    .setScrollFactor(0).setDepth(300);

  // Panel uses the shared wood/gold "Level1_modal.png" frame art (same asset
  // ModalFrame.js already shares across every level's mini-activities)
  // instead of a plain rectangle — falls back to the old flat panel if the
  // texture somehow isn't loaded.
  const PW = 400, PH = 301;   // 491:370 source aspect
  const panel = drawModalPanelBg(scene, W / 2 - PW / 2, H / 2 - PH / 2, PW, PH, 301)
    || scene.add.rectangle(W / 2, H / 2, PW, PH, 0x2a1608, 0.97)
        .setScrollFactor(0).setDepth(301).setStrokeStyle(3, 0xf5c87a, 0.9);

  const objs = [bg, panel];
  objs.push(
    scene.add.text(W / 2, H / 2 - 85, '🎉 Level Complete!', {
      fontSize: '24px', fontFamily: 'Georgia, serif', color: '#f5c87a',
      stroke: '#0a0502', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(302),
    scene.add.text(W / 2, H / 2 - 35, `⭐ ${points} points collected`, {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: '#ffe08a',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(302),
  );

  // ── Rainbow spinning star flourish above the title — a procedural 5-point
  // star (not an emoji, so its fill color can actually be driven through a
  // rainbow instead of being stuck as whatever color the glyph bakes in),
  // continuously rotating and cycling hue.
  const starG = scene.add.graphics().setScrollFactor(0).setDepth(302);
  objs.push(starG);
  const scx = W / 2, scy = H / 2 - 122, sR = 15, sr = 6.5;
  let hue = 0, sAngle = 0;
  const drawStar = () => {
    starG.clear();
    const col = Phaser.Display.Color.HSVToRGB(hue, 0.85, 1).color;
    starG.fillStyle(col, 1);
    starG.lineStyle(1.5, 0xffffff, 0.55);
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 === 0 ? sR : sr;
      const a = sAngle + (-Math.PI / 2) + i * Math.PI / 5;
      pts.push({ x: scx + Math.cos(a) * rad, y: scy + Math.sin(a) * rad });
    }
    starG.fillPoints(pts, true);
    starG.strokePoints(pts, true);
  };
  drawStar();
  const starEvt = scene.time.addEvent({
    delay: 40, loop: true,
    callback: () => { hue = (hue + 0.012) % 1; sAngle += 0.06; drawStar(); }
  });

  const cleanup = () => { starEvt.remove(false); objs.forEach(o => { try { o.destroy(); } catch (_) {} }); };
  const menuX = nextLevelKey ? W / 2 - 90 : W / 2;
  const menuBtn = makeButton(scene, menuX, H / 2 + 55, '🏠 Menu', '#8a5030', 302);
  menuBtn.on('pointerup', () => { cleanup(); transitionToScene(scene, menuKey); });
  objs.push(menuBtn);

  if (nextLevelKey) {
    const nextBtn = makeButton(scene, W / 2 + 90, H / 2 + 55, '▶ Next Level', '#5b6cff', 302);
    nextBtn.on('pointerup', () => {
      cleanup();
      // Always reset lives to default (3) when starting a new level
      const dataWithFreshLives = { ...nextLevelData, lives: 3 };
      transitionToScene(scene, nextLevelKey, dataWithFreshLives);
    });
    objs.push(nextBtn);
  }
}
