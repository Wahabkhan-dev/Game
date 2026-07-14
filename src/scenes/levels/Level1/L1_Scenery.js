import { W, H } from '../../../config/GameConfig.js';

// ════════════════════════════════════════════════════════════════════════════
// L1_Scenery — Level 1's real-art background + forest-floor surface.
//
// BaseLevelScene builds a generic procedural/jungle_bg background and a green
// tiled ground. Level 1 (and its bonus "fruit" scene) override those to use the
// hand-painted art instead:
//   • l1_bg      — full jungle scene (5504×3072) → parallax background
//   • l1_surface — forest-floor strip (5504×547) → the walkable ground surface
//
// Physics is untouched: buildL1Ground re-creates the EXACT same invisible
// collision tiles BaseLevelScene makes, then draws the new surface art over the
// ground band. All the tuning knobs live in the constants below.
// ════════════════════════════════════════════════════════════════════════════

const BG_KEY       = 'l1_bg';
const SURFACE_KEY  = 'l1_surface';
const BG_SRC_H     = 3072;   // source height of l1_bg
const SURFACE_SRC_H = 547;   // source height of l1_surface

// ── Tuning knobs (adjust these to taste) ────────────────────────────────────
const BG_PARALLAX   = 0.22;  // background scroll speed vs world (0 = static, 1 = locked to world)
const BG_SHIFT_Y    = 0.15;  // push the background DOWN by this fraction of the screen height
// Vertical headroom so the shifted-down image still covers the top with NO gap.
// (Must be ≥ 1 + 2·BG_SHIFT_Y; the small buffer avoids edge slivers.)
const BG_ZOOM       = 1 + 2 * BG_SHIFT_Y + 0.02;
const SURFACE_SCALE = 0.16;  // ground-surface art scale (bigger = chunkier/fewer repeats)
const SURFACE_TOP   = 404;   // screen-y of the surface's TOP edge (physics surface is y=418)

export function buildL1Background(scene, worldW) {
  // Solid fallback so the scene is never black if the image is missing.
  scene.add.rectangle(W / 2, H / 2, W, H, 0x0a160c).setScrollFactor(0).setDepth(-15);

  scene._l1Bg = [];
  if (scene.textures.exists(BG_KEY)) {
    // The tileSprite is as tall as ONE scaled copy of the image, so it never
    // repeats vertically. It tiles only horizontally (for the parallax scroll).
    // We shift it DOWN by moving the sprite itself (not by panning the texture,
    // which would wrap and repeat). The extra height (BG_ZOOM) keeps the top
    // covered after the shift.
    const dispH = H * BG_ZOOM;
    const scale = dispH / BG_SRC_H;         // uniform scale → no distortion, one vertical copy
    const ts = scene.add.tileSprite(W / 2, H / 2 + H * BG_SHIFT_Y, W, dispH, BG_KEY)
      .setScrollFactor(0).setDepth(-12);
    ts.tileScaleX = ts.tileScaleY = scale;  // tilePositionY stays 0 → no vertical repeat
    scene._l1Bg.push({ ts, factor: BG_PARALLAX });
  }

  // Subtle top darkening so the header HUD stays readable over the bright art.
  scene.add.rectangle(W / 2, 34, W, 74, 0x000000, 0.40).setScrollFactor(0).setDepth(-5);
}

// Called every frame from the scene's _updateBgParallax override.
export function updateL1Parallax(scene) {
  const sx = scene.cameras.main.scrollX;
  if (!scene._l1Bg) return;
  for (const l of scene._l1Bg) {
    // tilePositionX is in (unscaled) texture px → divide by tileScale so the
    // image scrolls by `factor × camera` screen pixels.
    l.ts.tilePositionX = sx * l.factor / l.ts.tileScaleX;
  }
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

  // ── Visual forest-floor surface, per ground section (skips gaps so the water
  //    gaps stay visible). One vertical copy of the strip (stripH matches the
  //    scaled source height), top edge sitting at SURFACE_TOP.
  const stripH = SURFACE_SRC_H * SURFACE_SCALE;
  scene._groundSections(worldW, gaps).forEach(sec => {
    const ts = scene.add.tileSprite(sec.start + sec.width / 2, SURFACE_TOP + stripH / 2, sec.width, stripH, SURFACE_KEY)
      .setDepth(5);
    ts.tileScaleX = ts.tileScaleY = SURFACE_SCALE;
  });
}
