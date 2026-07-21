// ════════════════════════════════════════════════════════════════════════════
// PorcupineSkin — shared looping walk-cycle animation for the porcupine hazard
// NPC, used by Level 1 and Level 2 (and any future level).
//
// The 6 source frames (public/assets/images/test/porcupine/01–06.png) are
// independently-generated stills, NOT a rigged animation — each has wildly
// different transparent padding around the creature (top padding alone ranges
// from 25px to 134px out of a 1229px canvas). Anchoring origin to the raw
// canvas bottom made the porcupine appear to float above the ground and bob
// around during the loop.
//
// Fix: crop every frame to ONE SHARED bounding box (the union of all frames'
// visible pixels) and normalize them onto identical canvases — same technique
// already used for the player skins (see GlendaSkinCore.js / L1_DogSkin.js).
// After this, every frame has IDENTICAL dimensions, so the sprite's bottom
// edge reliably lines up with the ground and a single setDisplaySize() holds
// steady across the whole loop (no per-frame drift).
//
// This is a plain NPC hazard driven by manual distance-check patrol code in
// each level scene — no physics body, no collider — so nothing about movement
// or hit-detection changes here, only the visual.
// ════════════════════════════════════════════════════════════════════════════

import { processGlendaGroups } from './GlendaSkinCore.js';

const FOLDER   = 'assets/images/test/porcupine/';
const FRAME_N  = 6;
const FRAME_KEY = (i) => `porc_walk_${i}`;
const ANIM_KEY  = 'porc_walk';
const SS        = 3;     // supersample factor for crisp downscaling
const REF_H     = 100;   // reference processing height (actual on-screen size is set per-instance)

let _normalized = false;

export function preloadPorcupineSkin(scene) {
  scene.load.on('loaderror', (f) => {
    if (f && f.key && String(f.key).startsWith('porc_walk_')) {
      console.error(`[PorcupineSkin] ❌ frame failed: ${f.key} → ${f.url}`);
    }
  });
  for (let i = 1; i <= FRAME_N; i++) {
    const key = FRAME_KEY(i);
    if (!scene.textures.exists(key)) {
      scene.load.image(key, `${FOLDER}${String(i).padStart(2, '0')}.png`);
    }
  }
}

function ensureNormalized(scene) {
  if (_normalized) return;
  const keys = Array.from({ length: FRAME_N }, (_, i) => FRAME_KEY(i + 1));
  processGlendaGroups(scene, [{ keys }], REF_H, SS);
  _normalized = true;
}

// Creates a continuously-looping-animation porcupine sprite at (x, y), locked
// to display size (w, h) — same call signature/result as the old
// `scene.add.image(x, y, 'porcupine').setDisplaySize(w, h)`, except the feet
// now sit consistently at the sprite's bottom edge (origin still yours to set).
export function createPorcupineSprite(scene, x, y, w, h) {
  ensureNormalized(scene);

  if (!scene.anims.exists(ANIM_KEY)) {
    const frames = Array.from({ length: FRAME_N }, (_, i) => ({ key: FRAME_KEY(i + 1) }));
    scene.anims.create({ key: ANIM_KEY, frames, frameRate: 8, repeat: -1 });
  }

  const spr = scene.add.sprite(x, y, FRAME_KEY(1)).setDisplaySize(w, h);
  spr.play(ANIM_KEY);
  return spr;
}
