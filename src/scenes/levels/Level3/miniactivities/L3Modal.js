// ════════════════════════════════════════════════════════════════════════════
// L3Modal — shared chrome for Level 3's 6 hospital mini-games.
// ════════════════════════════════════════════════════════════════════════════
import { W, H } from '../../../../config/GameConfig.js';

<<<<<<< Updated upstream
const SRC_KEY    = 'l3_modal_frame';
const HOLLOW_KEY = 'l3_modal_frame_hollow';
const INSET_X_PCT = 0.115;   // fraction of width cleared from each side
const INSET_Y_PCT = 0.14;    // fraction of height cleared from top/bottom

function ensureHollowFrame(scene) {
  if (scene.textures.exists(HOLLOW_KEY)) return;
  if (!scene.textures.exists(SRC_KEY)) return;

  const src = scene.textures.get(SRC_KEY).getSourceImage();
  const w = src.width, h = src.height;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(src, 0, 0);

  const ix = Math.round(w * INSET_X_PCT), iy = Math.round(h * INSET_Y_PCT);
  ctx.clearRect(ix, iy, w - ix * 2, h - iy * 2);

  scene.textures.addCanvas(HOLLOW_KEY, canvas);
}

// Draws the hollow gold-framed border across the whole screen, non-interactive.
// Depth defaults to just above the background dim rectangle (depth 0) but
// BELOW every HUD/gameplay element (which start at depth ~3+ in these scenes,
// several flush against the very top-left edge) — so the frame's border only
// shows through in the margins that nothing else draws over, and never covers
// or intercepts any existing UI or interaction.
export function applyL3Frame(scene, depth = 1) {
  ensureHollowFrame(scene);
  const key = scene.textures.exists(HOLLOW_KEY) ? HOLLOW_KEY : null;
  if (!key) return null;
  return scene.add.image(W / 2, H / 2, key).setDisplaySize(W, H).setDepth(depth);
=======
// Sets up a Level 3 hospital scene's chrome — just the standalone menu button
// (these mini-games have no persistent header, so this is the only way to
// pause/exit mid-activity). Previously also drew a decorative gold-framed
// border image around the whole screen; removed since it boxed in the actual
// treatment interaction without adding anything functional.
export function applyL3Frame(scene) {
  addStandaloneMenuButton(scene);
}

// Brief transition toast — shown the moment the mini-activity finishes and the
// real hands-on treatment step unlocks, so the shift from "quick game" to
// "now treat Gamma" is clearly signposted rather than silent.
export function showTreatmentPrompt(scene, text) {
  const t = scene.add.text(W / 2, H / 2 - 150, text, {
    fontSize: '15px', fontFamily: 'Georgia, serif', color: '#f5c87a',
    stroke: '#000', strokeThickness: 3, align: 'center',
  }).setOrigin(0.5).setDepth(45).setAlpha(0);
  scene.tweens.add({ targets: t, alpha: 1, y: t.y - 10, duration: 400 });
  scene.tweens.add({ targets: t, alpha: 0, duration: 500, delay: 1800, onComplete: () => t.destroy() });
>>>>>>> Stashed changes
}
