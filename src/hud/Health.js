// ════════════════════════════════════════════════════════════════════════════
// Health — piece 2: hearts (lives) + HP pips. Ported 1:1 from
// BaseLevelScene._buildHUD's hearts loop + _drawHPPips, using SEMANTIC colors
// (never themed — HP tier colors mean the same thing in every level).
// ════════════════════════════════════════════════════════════════════════════
import { SEMANTIC } from './HudTheme.js';
import { drawPanel } from './PanelKit.js';

export function buildHealth(scene, theme, cfg = {}) {
  const {
    lives, maxLives = 3,
    x = 4, y = 4, w = 94, h = 50,
    heartTex = 'heart', heartScale = 0.8,
    depth = 50,
  } = cfg;

  drawPanel(scene, x, y, w, h, theme, depth - 2);

  const livesNow = lives ?? maxLives;
  const hearts = [];
  for (let i = 0; i < maxLives; i++) {
    const heart = scene.add.image(x + 15 + i * 27, y + 15, heartTex)
      .setScale(heartScale).setScrollFactor(0).setDepth(depth);
    if (i >= livesNow) { heart.setTint(SEMANTIC.heartDimTint); heart.setAlpha(SEMANTIC.heartDimAlpha); }
    hearts.push(heart);
  }

  const hpGraphics = scene.add.graphics().setScrollFactor(0).setDepth(depth);

  function drawHP(hp) {
    hpGraphics.clear();
    const PW = 17, PH = 7, GAP = 3, X0 = x + 6, Y = y + 31;
    const activeCol = hp >= 3 ? SEMANTIC.hpGreen : hp === 2 ? SEMANTIC.hpYellow : SEMANTIC.hpRed;
    for (let i = 0; i < 3; i++) {
      const px = X0 + i * (PW + GAP);
      hpGraphics.fillStyle(0x110603, 1);
      hpGraphics.fillRoundedRect(px, Y - 3, PW, PH, 2);
      hpGraphics.lineStyle(1, 0x4a2808, 1);
      hpGraphics.strokeRoundedRect(px, Y - 3, PW, PH, 2);
      if (i < hp) {
        hpGraphics.fillStyle(activeCol, 1);
        hpGraphics.fillRoundedRect(px + 1, Y - 2, PW - 2, PH - 2, 1);
      }
    }
  }

  return { hearts, hpGraphics, drawHP };
}
