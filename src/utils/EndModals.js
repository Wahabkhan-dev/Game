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
import { showLoadingOverlay, hideLoadingOverlay } from './LoadingOverlay.js';

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
// scene.start()/fadeOut tweens only actually advance on the NEXT loop tick,
// which reads as "Menu"/"Next Level" hanging on the old screen.
function _wakeLoop(game) {
  try {
    const l = game.loop;
    if (!l) return;
    if (l.hasFocus === false) l.hasFocus = true;
    if (l.running === false) { l.wake?.(); l.resume?.(); }
  } catch (_) {}
}

// The ONE scene-change every "Main Menu" / "Next Level" button in every level
// (1–9) routes through:
//   1. Show the plain-DOM loading overlay (utils/LoadingOverlay.js) — this is
//      NOT a Phaser scene, so it appears INSTANTLY (a synchronous style
//      change), independent of whatever Phaser/the network is doing. This is
//      what was actually missing before: on a real deploy the next scene's
//      images/videos may need genuine network time (unlike local dev, where
//      everything's already cached), and with nothing on screen during that
//      wait it read as a blank/hung page.
//   2. Fade to black → scene.start() — same simple pattern every level's own
//      pause-menu "Exit" button already uses (proven reliable everywhere).
//   3. Passively poll (read-only — no forced game.step(), no second Phaser
//      scene to manage) until the target scene is confirmed active, then
//      hide the overlay. An earlier version routed the loading UI through a
//      SECOND persistent Phaser scene with rAF/interval polling that also
//      force-stepped the game loop — that combination was itself the source
//      of the hangs; this version never touches Phaser's scene lifecycle for
//      the overlay at all, only reads scene.isActive().
function goToScene(scene, sceneKey, data) {
  showLoadingOverlay();
  _wakeLoop(scene.game);
  if (scene.physics?.world) { try { scene.physics.resume(); } catch (_) {} }
  try { scene.tweens.resumeAll(); } catch (_) {}
  scene.cameras.main.fadeOut(400, 0, 0, 0);

  const game = scene.game;
  scene.time.delayedCall(210, () => {
    _wakeLoop(game);
    try { scene.scene.start(sceneKey, data); } catch (_) {}

    let tries = 0;
    const iv = setInterval(() => {
      // ~10s hard ceiling — never leaves the overlay stuck up forever even
      // in some pathological stuck-preload case.
      if (game.scene.isActive(sceneKey) || ++tries >= 200) {
        clearInterval(iv);
        hideLoadingOverlay();
      }
    }, 50);
  });
}

// Kept as a named export — several level files import this alongside
// showTryAgainModal. Routes through the same simple, reliable goToScene().
export function doFullRestart(scene, sceneKey) {
  goToScene(scene, sceneKey);
}

// Shown after the player loses all lives — ONE button only ("Main Menu"), no
// "Try Again" retry (removed per request, in every level).
// `onRetry` is accepted but unused now — kept so every existing call site
// (one per level, all passing either a scene-key string or a callback)
// doesn't need to change.
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
  const btn = makeButton(scene, W / 2, H / 2 + 45, '🏠 Main Menu', '#8a5030', 302);
  objs.push(btn);
  btn.on('pointerup', () => {
    objs.forEach(o => { try { o.destroy(); } catch (_) {} });
    goToScene(scene, 'Menu');
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
  menuBtn.on('pointerup', () => { cleanup(); goToScene(scene, menuKey); });
  objs.push(menuBtn);

  if (nextLevelKey) {
    const nextBtn = makeButton(scene, W / 2 + 90, H / 2 + 55, '▶ Next Level', '#5b6cff', 302);
    nextBtn.on('pointerup', () => {
      cleanup();
      // Always reset lives to default (3) when starting a new level
      const dataWithFreshLives = { ...nextLevelData, lives: 3 };
      goToScene(scene, nextLevelKey, dataWithFreshLives);
    });
    objs.push(nextBtn);
  }
}
