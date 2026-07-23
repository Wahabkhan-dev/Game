// ════════════════════════════════════════════════════════════════════════════
// EndModals — shared "Try Again" (game over) and "Level Complete" (points +
// Menu/Next Level) modals, used by every level. Plain functions that take a
// `scene` as their first argument, so they work regardless of which class
// hierarchy a level scene extends (BaseLevelScene, L7/L8/L9BaseScene, or a
// fully custom scene like Level3's).
// ════════════════════════════════════════════════════════════════════════════
import { W, H } from '../config/GameConfig.js';

function panelBg(scene, h) {
  const bg = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.8)
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
    onRetry();
  });
}

// Shown when the player finishes a level — the points collected, plus a
// Menu button and (if nextLevelKey is given) a Next Level button. Neither
// button fires until clicked, so nothing auto-advances.
export function showLevelCompleteModal(scene, points, opts = {}) {
  const { menuKey = 'Menu', nextLevelKey = null, nextLevelData = {} } = opts;
  const objs = panelBg(scene, 250);
  objs.push(
    scene.add.text(W / 2, H / 2 - 85, '🎉 Level Complete!', {
      fontSize: '24px', fontFamily: 'Georgia, serif', color: '#f5c87a',
      stroke: '#0a0502', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(302),
    scene.add.text(W / 2, H / 2 - 35, `⭐ ${points} points collected`, {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: '#ffe08a',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(302),
  );

  const cleanup = () => objs.forEach(o => o.destroy());
  const menuX = nextLevelKey ? W / 2 - 90 : W / 2;
  const menuBtn = makeButton(scene, menuX, H / 2 + 55, '🏠 Menu', '#8a5030', 302);
  menuBtn.on('pointerup', () => { cleanup(); scene.scene.start(menuKey); });
  objs.push(menuBtn);

  if (nextLevelKey) {
    const nextBtn = makeButton(scene, W / 2 + 90, H / 2 + 55, '▶ Next Level', '#5b6cff', 302);
    nextBtn.on('pointerup', () => {
      cleanup();
      showLoadingTransition(scene, () => scene.scene.start(nextLevelKey, nextLevelData));
    });
    objs.push(nextBtn);
  }
}
