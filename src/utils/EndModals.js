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

// Brief loading transition shown between "Next Level" being clicked and the
// next level scene actually starting — a filling progress bar over a dark
// screen, so advancing feels like a real level load rather than an instant
// cut. Purely visual/timed (assets are already cached by this point).
function showLoadingTransition(scene, onDone) {
  const bg = scene.add.rectangle(W / 2, H / 2, W, H, 0x1a0a05, 1).setScrollFactor(0).setDepth(310);
  const title = scene.add.text(W / 2, H / 2 - 30, "Gemma's Story", {
    fontSize: '22px', fontFamily: 'Georgia, serif', color: '#f5c87a',
    stroke: '#0a0502', strokeThickness: 3,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(311);
  const barBg = scene.add.rectangle(W / 2, H / 2 + 20, 220, 10, 0xffffff, 0.1)
    .setScrollFactor(0).setDepth(311).setStrokeStyle(1, 0xf5c87a, 0.5);
  const barFill = scene.add.rectangle(W / 2 - 110, H / 2 + 20, 4, 10, 0xf5c87a, 1)
    .setOrigin(0, 0.5).setScrollFactor(0).setDepth(312);
  const label = scene.add.text(W / 2, H / 2 + 44, 'Loading next level…', {
    fontSize: '12px', fontFamily: 'Georgia, serif', color: '#c9956b',
  }).setOrigin(0.5).setScrollFactor(0).setDepth(311);

  scene.tweens.add({
    targets: barFill, width: 220, duration: 800, ease: 'Sine.easeInOut',
    onComplete: () => {
      [bg, title, barBg, barFill, label].forEach(o => o.destroy());
      onDone();
    },
  });
}

// Full restart with loading screen and complete cleanup — kills all tweens,
// timers, events, and shows a loading transition so the player sees a real
// reload instead of an instant cut. This ensures NO cached state persists.
export function doFullRestart(scene, sceneKey) {
  // Kill all running tweens, timers, events in this scene
  scene.tweens.killAll();
  scene.time.removeAllEvents();
  scene.input.keyboard.removeAllKeys();
  scene.physics.pause();

  // Show loading screen then do the restart
  showLoadingTransition(scene, () => {
    // Full scene stop+start (not restart) — completely resets all state
    scene.scene.stop();
    scene.scene.start(sceneKey);
  });
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
    objs.forEach(o => o.destroy());
    // Use full restart if onRetry is a string (scene key), otherwise fall back to callback
    if (typeof onRetry === 'string') {
      doFullRestart(scene, onRetry);
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

  const cleanup = () => { starEvt.remove(false); objs.forEach(o => o.destroy()); };
  const menuX = nextLevelKey ? W / 2 - 90 : W / 2;
  const menuBtn = makeButton(scene, menuX, H / 2 + 55, '🏠 Menu', '#8a5030', 302);
  menuBtn.on('pointerup', () => { cleanup(); scene.scene.start(menuKey); });
  objs.push(menuBtn);

  if (nextLevelKey) {
    const nextBtn = makeButton(scene, W / 2 + 90, H / 2 + 55, '▶ Next Level', '#5b6cff', 302);
    nextBtn.on('pointerup', () => {
      cleanup();
      // Always reset lives to default (3) when starting a new level
      const dataWithFreshLives = { ...nextLevelData, lives: 3 };
      showLoadingTransition(scene, () => scene.scene.start(nextLevelKey, dataWithFreshLives));
    });
    objs.push(nextBtn);
  }
}
