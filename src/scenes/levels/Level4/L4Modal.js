import { W, H } from '../../../config/GameConfig.js';

// Shared modal frame for Level 4 checkpoint mini-games — same look as Level 1's
// puzzle popups: a dimmed (still-visible) game behind a centered rounded panel.
// Returns the panel geometry so each game lays its content out inside it.
export function drawCPModal(scene, emoji, title, subtitle) {
  const PX = 150, PY = 80, PW = 500, PH = 290;

  // Dim backdrop — the paused platformer shows through faintly, and clicks are blocked
  scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setDepth(0).setInteractive();

  // Centered panel card
  const g = scene.add.graphics().setDepth(1);
  g.fillStyle(0x100c06, 0.97); g.fillRoundedRect(PX, PY, PW, PH, 18);
  g.lineStyle(3, 0xf5c87a, 0.9); g.strokeRoundedRect(PX, PY, PW, PH, 18);

  scene.add.text(W / 2, PY + 28, `${emoji}  ${title}`, {
    fontSize: '20px', fontFamily: 'Georgia, serif', color: '#f5c87a', stroke: '#1a0802', strokeThickness: 3
  }).setOrigin(0.5).setDepth(2);

  if (subtitle) {
    scene.add.text(W / 2, PY + 54, subtitle, {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: '#c8a870', align: 'center'
    }).setOrigin(0.5).setDepth(2);
  }

  return { PX, PY, PW, PH, cx: W / 2, cy: PY + PH / 2, top: PY, bottom: PY + PH };
}
