// ════════════════════════════════════════════════════════════════════════════
// L3_CarSkin — real pickup-truck art (public/assets/images/Level 3/car/) for
// the Level 3 car-journey drive. Same 9-frame sequence previewed in the
// "Car Simulator" Dev/QA tool (src/scenes/CarSimulator.js).
//
// Every frame has ~51px of transparent padding below the tires out of a 410px
// canvas (measured, consistent across frames — no per-frame jitter like the
// porcupine walk-cycle had, so no crop-normalize pass is needed here). This
// module exposes that ratio so the caller can push the sprite down by exactly
// that much, keeping the tires flush with the road instead of floating.
//
// Plain visual swap: gameplay (speed, accelerate/brake physics, hit-detection)
// is driven entirely by world distance elsewhere in L3_CarJourneyScene and is
// untouched by this module.
// ════════════════════════════════════════════════════════════════════════════

const FOLDER  = 'assets/images/Level 3/car/';
const FRAME_N = 9;
const FRAME_KEY = (i) => `l3car_frame_${i}`;
const ANIM_KEY  = 'l3car_drive';

// Measured on the source art: 51px transparent pad below the tires out of a
// 410px-tall canvas.
export const CAR_BOTTOM_PAD_RATIO = 51 / 410;

export function preloadCarSkin(scene) {
  scene.load.on('loaderror', (f) => {
    if (f && f.key && String(f.key).startsWith('l3car_frame_')) {
      console.error(`[L3 CarSkin] ❌ frame failed: ${f.key} → ${f.url}`);
    }
  });
  for (let i = 1; i <= FRAME_N; i++) {
    const key = FRAME_KEY(i);
    if (!scene.textures.exists(key)) {
      scene.load.image(key, `${FOLDER}frame_${String(i).padStart(3, '0')}.png`);
    }
  }
}

// Creates the car sprite at (x, y) — y is where the TIRES should touch (the
// road surface), already correcting for the transparent padding baked into
// the art. Starts on the idle (first) frame; call playCarSkin()/stopCarSkin()
// to control the driving animation loop.
export function createCarSprite(scene, x, y, w, h) {
  if (!scene.anims.exists(ANIM_KEY)) {
    const frames = Array.from({ length: FRAME_N }, (_, i) => ({ key: FRAME_KEY(i + 1) }));
    scene.anims.create({ key: ANIM_KEY, frames, frameRate: 14, repeat: -1 });
  }
  const padPx = h * CAR_BOTTOM_PAD_RATIO;
  const spr = scene.add.sprite(x, y + padPx, FRAME_KEY(1)).setDisplaySize(w, h);
  return spr;
}

export function playCarSkin(sprite) {
  if (!sprite.anims.isPlaying || sprite.anims.currentAnim?.key !== ANIM_KEY) {
    sprite.play(ANIM_KEY);
  }
}

export function stopCarSkin(sprite) {
  if (sprite.anims.isPlaying) sprite.anims.stop();
  sprite.setTexture(FRAME_KEY(1));
}
