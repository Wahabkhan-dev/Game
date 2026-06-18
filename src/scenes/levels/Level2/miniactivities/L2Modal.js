import { W, H } from '../../../../config/GameConfig.js';

// Shared compact modal card for Level 2 checkpoint mini-games — same look &
// size language as Level 1 / Level 4: a solid dim that hides the level behind,
// and a centered bordered card the game lays out inside.
// Card rect (exported so each game positions its content inside it):
export const CARD = { x: 120, y: 38, w: 560, h: 380 };

export function openL2Modal(scene, emoji, title, subtitle, bgKey) {
  // Solid backdrop — fully hides the frozen platformer (no bleed-through)
  scene.add.rectangle(W / 2, H / 2, W, H, 0x04060a, 0.92).setDepth(0).setInteractive();

  const { x, y, w, h } = CARD;
  // Base fill
  const g = scene.add.graphics().setDepth(1);
  g.fillStyle(0x0c1018, 0.98); g.fillRoundedRect(x, y, w, h, 16);

  // Themed background image, clipped to the rounded card
  if (bgKey && scene.textures.exists(bgKey)) {
    const bg = scene.add.image(x + w / 2, y + h / 2, bgKey).setDisplaySize(w, h).setDepth(1.1);
    const maskG = scene.make.graphics(); maskG.fillStyle(0xffffff); maskG.fillRoundedRect(x, y, w, h, 16);
    bg.setMask(maskG.createGeometryMask());
    // Slight darken so HUD text stays legible
    const dim = scene.add.rectangle(x + w / 2, y + h / 2, w, h, 0x000000, 0.22).setDepth(1.2);
    const dimMask = scene.make.graphics(); dimMask.fillStyle(0xffffff); dimMask.fillRoundedRect(x, y, w, h, 16);
    dim.setMask(dimMask.createGeometryMask());
  }

  // Border + header on top
  const bd = scene.add.graphics().setDepth(2);
  bd.lineStyle(3, 0xf5c87a, 0.85); bd.strokeRoundedRect(x, y, w, h, 16);
  bd.fillStyle(0x0a0e16, 0.55); bd.fillRoundedRect(x + 4, y + 4, w - 8, 44, 12);   // header strip backing
  bd.lineStyle(1.5, 0xf5c87a, 0.3); bd.lineBetween(x + 16, y + 50, x + w - 16, y + 50);

  scene.add.text(W / 2, y + 20, `${emoji}  ${title}`, {
    fontSize: '17px', fontFamily: 'Georgia, serif', color: '#f5c87a', stroke: '#000', strokeThickness: 3
  }).setOrigin(0.5).setDepth(3);
  if (subtitle) {
    scene.add.text(W / 2, y + 40, subtitle, {
      fontSize: '11px', fontFamily: 'Georgia, serif', color: '#dfe8f5', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(3);
  }
  scene.cameras.main.fadeIn(300, 0, 0, 0);
}
