// ════════════════════════════════════════════════════════════════════════════
// ModalFrame — shared wood/gold panel artwork for ALL levels' mini-activities.
//
// Uses the Level 1 modal art (public/assets/images/level1/Level1_modal.png,
// loaded once in BootScene as 'shared_modal_bg') so every mini-activity across
// Levels 4–9 gets the exact same premium look Levels 1–3 already have.
//
// Two ways to use it:
//   • drawModalPanelBg(scene, x, y, w, h, depth) — stretches the art over a
//     modal card rect. Returns the image, or null if the texture is missing —
//     callers keep their old procedural panel as the fallback in that case.
//   • applyModalFrame(scene, depth) — for FULL-SCREEN activity scenes: punches
//     the center out of the art (same trick as Level 3's L3Modal) and lays the
//     remaining gold border band over the whole screen, non-interactive, so
//     existing gameplay/drag-drop underneath is never blocked or moved.
// ════════════════════════════════════════════════════════════════════════════
import { W, H } from '../../config/GameConfig.js';

export const MODAL_BG_KEY = 'shared_modal_bg';
const HOLLOW_KEY = 'shared_modal_bg_hollow';
const INSET_X_PCT = 0.115;   // fraction of width cleared from each side
const INSET_Y_PCT = 0.14;    // fraction of height cleared from top/bottom

// Stretch the solid wood/gold panel art over the given card rect.
export function drawModalPanelBg(scene, x, y, w, h, depth = 1) {
  if (!scene.textures.exists(MODAL_BG_KEY)) return null;
  return scene.add.image(x + w / 2, y + h / 2, MODAL_BG_KEY)
    .setDisplaySize(w, h).setDepth(depth).setScrollFactor(0);
}

// Build (once) a hollow version of the panel art — only the outer gold border
// band remains, the center is fully transparent.
function ensureHollowFrame(scene) {
  if (scene.textures.exists(HOLLOW_KEY)) return;
  if (!scene.textures.exists(MODAL_BG_KEY)) return;

  const src = scene.textures.get(MODAL_BG_KEY).getSourceImage();
  const w = src.width, h = src.height;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(src, 0, 0);

  const ix = Math.round(w * INSET_X_PCT), iy = Math.round(h * INSET_Y_PCT);
  ctx.clearRect(ix, iy, w - ix * 2, h - iy * 2);

  scene.textures.addCanvas(HOLLOW_KEY, canvas);
}

// Full-screen gold border frame for immersive (non-card) activity scenes.
export function applyModalFrame(scene, depth = 1) {
  ensureHollowFrame(scene);
  if (!scene.textures.exists(HOLLOW_KEY)) return null;
  return scene.add.image(W / 2, H / 2, HOLLOW_KEY)
    .setDisplaySize(W, H).setDepth(depth).setScrollFactor(0);
}
