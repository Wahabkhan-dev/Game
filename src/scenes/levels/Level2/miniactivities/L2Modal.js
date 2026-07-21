import { W, H } from '../../../../config/GameConfig.js';
import { THEME, makePanel, generatePremiumHudTextures } from '../../../../hud/premium/PremiumTheme.js';

// Shared modal card for Level 2 checkpoint mini-games. Uses the premium modal
// artwork (public/assets/images/Level 2/Level2_modal.png — a local copy of the
// Level 1 wood panel with an ornate gold + leaf-corner frame, so Level 2 owns
// its own asset instead of reaching into Level 1's folder) as the card
// background for ALL Level 2 mini-activities, matching the Level 1 look. The
// games lay out their content inside CARD as before, so gameplay is untouched.
export const CARD = { x: 120, y: 38, w: 560, h: 380 };

export function openL2Modal(scene, emoji, title, subtitle, bgKey) {
  // Backdrop — dark overlay that fully hides the frozen platformer behind.
  scene.add.rectangle(W / 2, H / 2, W, H, 0x020402, 0.9).setDepth(0).setInteractive();

  const { x, y, w, h } = CARD;

  // Premium modal frame artwork (falls back to a procedural wood panel if the
  // image somehow isn't loaded).
  if (scene.textures.exists('l2_modal_bg')) {
    scene.add.image(x + w / 2, y + h / 2, 'l2_modal_bg').setDisplaySize(w, h).setDepth(1);
  } else {
    generatePremiumHudTextures(scene);
    makePanel(scene, x, y, w, h, 1);
  }

  // Title + subtitle (gold), in the frame's top band just below the gold border.
  scene.add.text(W / 2, y + 34, `${emoji}  ${title}`, {
    fontSize: '17px', fontFamily: THEME.font, color: THEME.goldTxt, stroke: '#1a0f04', strokeThickness: 3
  }).setOrigin(0.5).setDepth(3);
  if (subtitle) {
    scene.add.text(W / 2, y + 54, subtitle, {
      fontSize: '11px', fontFamily: THEME.font, color: '#f0e6d0', stroke: '#1a0f04', strokeThickness: 2
    }).setOrigin(0.5).setDepth(3);
  }

  scene.cameras.main.fadeIn(300, 0, 0, 0);
}
