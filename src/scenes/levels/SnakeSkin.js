// ════════════════════════════════════════════════════════════════════════════
// SnakeSkin — shared looping slither-cycle animation for the snake hazard NPC.
// Same pattern as PorcupineSkin.js (see that file for the full rationale): the
// 24 source frames (public/assets/images/test/snake/Comp 1_00000–00023.png)
// are an After Effects render sequence, each with different transparent
// padding around the creature — cropping every frame to ONE SHARED bounding
// box and normalizing them onto identical canvases keeps the sprite's bottom
// edge steady on the ground across the whole loop (no per-frame drift/bob).
//
// This is a plain NPC hazard driven by manual distance-check patrol code in
// whichever level scene uses it — no physics body, no collider — so nothing
// about movement or hit-detection lives here, only the visual.
// ════════════════════════════════════════════════════════════════════════════

import { processGlendaGroups } from './GlendaSkinCore.js';

const FOLDER    = 'assets/images/test/snake/';
const FRAME_N   = 24;
const FRAME_KEY = (i) => `snake_walk_${i}`;
export const SNAKE_ANIM_KEY  = 'snake_walk';
export const SNAKE_FIRST_KEY = FRAME_KEY(0);
const SS        = 3;     // supersample factor for crisp downscaling
const REF_H     = 100;   // reference processing height (actual on-screen size is set per-instance)

let _normalized = false;

export function preloadSnakeSkin(scene) {
  scene.load.on('loaderror', (f) => {
    if (f && f.key && String(f.key).startsWith('snake_walk_')) {
      console.error(`[SnakeSkin] ❌ frame failed: ${f.key} → ${f.url}`);
    }
  });
  for (let i = 0; i < FRAME_N; i++) {
    const key = FRAME_KEY(i);
    if (!scene.textures.exists(key)) {
      scene.load.image(key, `${FOLDER}Comp 1_${String(i).padStart(5, '0')}.png`);
    }
  }
}

// Normalizes the frames + registers the shared 'snake_walk' animation, but
// doesn't create any Phaser object — call this before building EITHER a plain
// sprite (createSnakeSprite below) or a physics sprite (scene.physics.add
// .sprite(...).play(SNAKE_ANIM_KEY)), e.g. for a hazard/boss that needs a
// physics body. Idempotent — safe to call from multiple places.
export function ensureSnakeAnim(scene) {
  if (!_normalized) {
    const keys = Array.from({ length: FRAME_N }, (_, i) => FRAME_KEY(i));
    processGlendaGroups(scene, [{ keys }], REF_H, SS);
    _normalized = true;
  }
  if (!scene.anims.exists(SNAKE_ANIM_KEY)) {
    const frames = Array.from({ length: FRAME_N }, (_, i) => ({ key: FRAME_KEY(i) }));
    scene.anims.create({ key: SNAKE_ANIM_KEY, frames, frameRate: 20, repeat: -1 });
  }
}

export function prepareSnakeSkin(scene) {
  ensureSnakeAnim(scene);
}

// Creates a continuously-looping-animation snake sprite at (x, y), locked to
// display size (w, h) — same call signature/result as createPorcupineSprite.
// Not physics-enabled; for a hazard/boss that needs a physics body, use
// ensureSnakeAnim() + scene.physics.add.sprite(x, y, SNAKE_FIRST_KEY) instead.
export function createSnakeSprite(scene, x, y, w, h) {
  ensureSnakeAnim(scene);
  const spr = scene.add.sprite(x, y, SNAKE_FIRST_KEY).setDisplaySize(w, h);
  spr.play(SNAKE_ANIM_KEY);
  return spr;
}
