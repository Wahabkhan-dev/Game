// ════════════════════════════════════════════════════════════════════════════
// L3Modal — applies the premium wood/gold modal artwork as a decorative,
// full-screen BORDER FRAME around each Level 3 mini-game.
//
// Unlike Level 2's popup (a smaller centered card over a dark backdrop), Level
// 3's 6 mini-games are full-screen, immersive scenes whose game logic (drag
// zones, tray slots, hit-test rectangles) is hand-positioned for the entire
// W×H canvas. Recalculating every coordinate to fit a smaller card would risk
// silently breaking drag/drop — so instead this ADDS the frame on top at a
// high depth, non-interactive, with its center made fully TRANSPARENT so it
// never blocks or shifts any existing gameplay.
//
// The source image (l3_modal_frame, copied from Level 1's modal art) is a
// SOLID card, not a hollow frame — this module processes it once at runtime
// (canvas: punch a transparent hole in the center, keeping only the outer
// gold-bordered band) and caches the result as 'l3_modal_frame_hollow'.
// ════════════════════════════════════════════════════════════════════════════
import { W, H } from '../../../../config/GameConfig.js';

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
}
