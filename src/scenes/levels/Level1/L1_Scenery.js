import { W, H } from '../../../config/GameConfig.js';

// ════════════════════════════════════════════════════════════════════════════
// L1_Scenery — Level 1's real-art background + forest-floor surface.
//
// BaseLevelScene builds a generic procedural/jungle_bg background and a green
// tiled ground. Level 1 (and its bonus "fruit" scene) override those to use the
// hand-painted art instead:
//   • l1_bg      (Level 01.jpg)        → background, above the ground line
//   • l1_surface (Level 01 bottom.png) → the walkable ground strip
//
// The ground strip is fit FIRST (scaled to its natural aspect, anchored to the
// screen bottom), which fixes GROUND_TOP — the background is then sized to end
// EXACTLY at that same y, so the two images meet with no gap and no overlap.
// Both tile ONLY horizontally (one vertical copy each — never repeats on Y).
//
// Physics is untouched: buildL1Ground re-creates the EXACT same invisible
// collision tiles BaseLevelScene makes, then draws the new surface art over
// each non-gap segment (gaps stay visually open).
// ════════════════════════════════════════════════════════════════════════════

const BG_KEY      = 'l1_bg';
const SURFACE_KEY = 'l1_surface';
const GROUND_TOP  = 404;   // y where the ground art begins — background ends exactly here
const BG_PARALLAX = 0.22;  // gentle horizontal drift for depth (0 = fully static)

export function buildL1Background(scene) {
  // Solid fallback so nothing is ever black if the image is missing.
  scene.add.rectangle(W / 2, GROUND_TOP / 2, W, GROUND_TOP, 0x0a160c)
    .setScrollFactor(0).setDepth(-15);

  scene._l1Bg = null;
  if (scene.textures.exists(BG_KEY)) {
    const src = scene.textures.get(BG_KEY).getSourceImage();
    const srcH = src.naturalHeight || src.height;
    const scale = GROUND_TOP / srcH;   // exact fit, one vertical copy, no distortion
    const ts = scene.add.tileSprite(W / 2, GROUND_TOP / 2, W, GROUND_TOP, BG_KEY)
      .setScrollFactor(0).setDepth(-12);
    ts.tileScaleX = ts.tileScaleY = scale;   // tilePositionY stays 0 → no vertical repeat
    scene._l1Bg = ts;
  }

  // Subtle top darkening so the header HUD stays readable over the bright art.
  scene.add.rectangle(W / 2, 34, W, 74, 0x000000, 0.40).setScrollFactor(0).setDepth(-5);
}

// Called every frame from the scene's _updateBgParallax override.
export function updateL1Parallax(scene) {
  if (!scene._l1Bg) return;
  // tilePositionX is in (unscaled) texture px → divide by tileScale so the
  // image scrolls by BG_PARALLAX × camera screen pixels.
  scene._l1Bg.tilePositionX = scene.cameras.main.scrollX * BG_PARALLAX / scene._l1Bg.tileScaleX;
}

export function buildL1Ground(scene, config) {
  const worldW = config.worldWidth || 2000;
  const gaps   = config.gaps || [];

  // ── Physics collision tiles — IDENTICAL to BaseLevelScene (unchanged gameplay)
  let x = 0;
  while (x < worldW) {
    const inGap = gaps.some(g => x + 16 > g.x && x < g.x + g.w);
    if (!inGap) {
      const tile = scene.groundGroup.create(x + 16, H - 16, 'ground');
      tile.setDisplaySize(32, 32).setAlpha(0).refreshBody();
    }
    x += 32;
  }

  // ── Visual forest-floor surface, per non-gap segment (gaps stay visually
  // open), starting EXACTLY where the background ends (GROUND_TOP) — no seam
  // gap — and filling all the way down to the screen bottom. One vertical
  // copy of the strip (never repeats on Y); tiles only horizontally.
  if (!scene.textures.exists(SURFACE_KEY)) return;
  const src = scene.textures.get(SURFACE_KEY).getSourceImage();
  const srcH = src.naturalHeight || src.height;
  const bandH = H - GROUND_TOP;
  const scale = bandH / srcH;
  scene._groundSections(worldW, gaps).forEach(sec => {
    const ts = scene.add.tileSprite(sec.start + sec.width / 2, GROUND_TOP + bandH / 2, sec.width, bandH, SURFACE_KEY)
      .setDepth(5);
    ts.tileScaleX = ts.tileScaleY = scale;
  });
}
