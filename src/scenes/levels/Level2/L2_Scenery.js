import { W, H } from '../../../config/GameConfig.js';

// ════════════════════════════════════════════════════════════════════════════
// L2_Scenery — Level 2's real-art background + ground.
//
// BaseLevelScene builds a generic jungle_bg parallax + plain green ground.
// Level 2 overrides those to use the hand-painted art instead:
//   • l2_bg      (level-2-bg.jpg)        → background, above the ground line
//   • l2_surface (Level -02-bottom.jpg)  → the walkable ground strip
//
// The ground strip is fit FIRST (scaled to its natural aspect, anchored to the
// screen bottom), which fixes GROUND_TOP — the background is then sized to
// end EXACTLY at that same y, so the two images meet with no gap and no
// overlap (same technique used for Level 3/4's road+background pairing).
//
// Physics is untouched: buildL2Ground re-creates the EXACT same invisible
// collision tiles BaseLevelScene makes, then draws the new surface art over
// each non-gap segment (gaps stay visually open, same as Level 1).
// ════════════════════════════════════════════════════════════════════════════

const BG_KEY      = 'l2_bg';
const SURFACE_KEY = 'l2_surface';
const L1_BG_KEY   = 'l1_bg';
const L1_SURFACE_KEY = 'l1_surface';
const GROUND_TOP  = 404;   // y where the ground art begins — background ends exactly here
const BG_PARALLAX = 0.18;  // gentle drift for depth (0 = fully static)
const L1_BG_PARALLAX = 0.22;

export function buildL2Background(scene) {
  // Solid fallback so nothing is ever black if the image is missing.
  scene.add.rectangle(W / 2, GROUND_TOP / 2, W, GROUND_TOP, 0x0a1a0a)
    .setScrollFactor(0).setDepth(-15);

  scene._l2Bg = null;
  if (scene.textures.exists(BG_KEY)) {
    const src = scene.textures.get(BG_KEY).getSourceImage();
    const srcH = src.naturalHeight || src.height;
    const scale = GROUND_TOP / srcH;   // exact fit, one vertical copy, no distortion
    const ts = scene.add.tileSprite(W / 2, GROUND_TOP / 2, W, GROUND_TOP, BG_KEY)
      .setScrollFactor(0).setDepth(-12);
    ts.tileScaleX = ts.tileScaleY = scale;
    scene._l2Bg = ts;
  }

  // Subtle top darkening so the header HUD stays readable over the art.
  scene.add.rectangle(W / 2, 34, W, 74, 0x000000, 0.40).setScrollFactor(0).setDepth(-5);
}

// Called every frame from the scene's _updateBgParallax override.
export function updateL2Parallax(scene) {
  if (scene._l2Bg) {
    scene._l2Bg.tilePositionX = scene.cameras.main.scrollX * BG_PARALLAX / scene._l2Bg.tileScaleX;
  }
  if (scene._l1Bg) {
    scene._l1Bg.tilePositionX = scene.cameras.main.scrollX * L1_BG_PARALLAX / scene._l1Bg.tileScaleX;
  }
}

export function buildL2Ground(scene, config) {
  const worldW = config.worldWidth || 2000;
  const gaps   = config.gaps || [];
  scene._l2Grounds = [];

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

  // ── Visual ground strip, per non-gap segment (gaps stay visually open),
  // starting EXACTLY where the background ends (GROUND_TOP) — no seam gap.
  if (!scene.textures.exists(SURFACE_KEY)) return;
  const src = scene.textures.get(SURFACE_KEY).getSourceImage();
  const srcH = src.naturalHeight || src.height;
  const bandH = H - GROUND_TOP;   // fills all the way down to the screen bottom
  const scale = bandH / srcH;
  scene._groundSections(worldW, gaps).forEach(sec => {
    const ts = scene.add.tileSprite(sec.start + sec.width / 2, GROUND_TOP + bandH / 2, sec.width, bandH, SURFACE_KEY)
      .setDepth(5);
    ts.tileScaleX = ts.tileScaleY = scale;
    scene._l2Grounds.push(ts);
  });
}

export function buildL1TransitionVisuals(scene) {
  scene._l1Bg = null;
  scene._l1Grounds = [];
  scene._l1TopOverlay = null;

  scene.add.rectangle(W / 2, GROUND_TOP / 2, W, GROUND_TOP, 0x0a160c)
    .setScrollFactor(0).setDepth(-15).setAlpha(0.0);

  if (scene.textures.exists(L1_BG_KEY)) {
    const src = scene.textures.get(L1_BG_KEY).getSourceImage();
    const srcH = src.naturalHeight || src.height;
    const scale = GROUND_TOP / srcH;
    const ts = scene.add.tileSprite(W / 2, GROUND_TOP / 2, W, GROUND_TOP, L1_BG_KEY)
      .setScrollFactor(0).setDepth(-12).setAlpha(0);
    ts.tileScaleX = ts.tileScaleY = scale;
    scene._l1Bg = ts;
  }

  scene._l1TopOverlay = scene.add.rectangle(W / 2, 34, W, 74, 0x000000, 0.40)
    .setScrollFactor(0).setDepth(-5).setAlpha(0);

  if (scene.textures.exists(L1_SURFACE_KEY)) {
    const src = scene.textures.get(L1_SURFACE_KEY).getSourceImage();
    const srcH = src.naturalHeight || src.height;
    const bandH = H - GROUND_TOP;
    const scale = bandH / srcH;
    scene._groundSections(scene.lvlConfig?.worldWidth || 18500, scene.lvlConfig?.gaps || []).forEach(sec => {
      const ts = scene.add.tileSprite(sec.start + sec.width / 2, GROUND_TOP + bandH / 2, sec.width, bandH, L1_SURFACE_KEY)
        .setDepth(5).setAlpha(0);
      ts.tileScaleX = ts.tileScaleY = scale;
      scene._l1Grounds.push(ts);
    });
  }
}

export function transitionToL1Visuals(scene, duration = 1100) {
  if (scene._l1TransitionStarted) return;
  if (!scene._l1Bg && !scene._l1Grounds.length) {
    buildL1TransitionVisuals(scene);
  }

  scene._l1TransitionStarted = true;
  const oldTargets = [];
  if (scene._l2Bg) oldTargets.push(scene._l2Bg);
  if (scene._l2Grounds?.length) oldTargets.push(...scene._l2Grounds);

  const newTargets = [];
  if (scene._l1Bg) newTargets.push(scene._l1Bg);
  if (scene._l1TopOverlay) newTargets.push(scene._l1TopOverlay);
  if (scene._l1Grounds?.length) newTargets.push(...scene._l1Grounds);

  if (oldTargets.length) {
    scene.tweens.add({ targets: oldTargets, alpha: 0, duration, ease: 'Sine.easeInOut' });
  }
  if (newTargets.length) {
    scene.tweens.add({ targets: newTargets, alpha: 1, duration, ease: 'Sine.easeInOut' });
  }
}
