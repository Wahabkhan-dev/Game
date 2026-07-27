// ════════════════════════════════════════════════════════════════════════════
// L8_GlendaSkin — swaps L8BaseScene's player VISUAL to Glenda.
//
// L8BaseScene.buildPlayer() is shared by every Level 8 run scene (HomeRun,
// FoodRun). Its anim keys are named WITHOUT the '_anim' suffix used elsewhere
// ('gleeda_walk' / 'gleeda_idle' / 'gleeda_jump') — match that exactly so
// _setPose() picks up the new frames with no other code changes.
//
// Frames (public/assets/images/test/glenda-run) — ALL already transparent:
//   run   frame_001.png … frame_026.png   (720×1280)
//   idle  gelnda-idle-frame.png            (375×666)
//   jump  gelnda-jump-frame.png            (375×666)
// ════════════════════════════════════════════════════════════════════════════

import { processGlendaGroups } from '../GlendaSkinCore.js';

const FOLDER = 'assets/images/test/glenda-run/';
const RUN_N  = 26;
const SS     = 3;

const RUN_KEY  = (i) => `l8glenda_run_${i}`;
const IDLE_KEY = 'l8glenda_idle';
const JUMP_KEY = 'l8glenda_jump';

export function preloadGlendaSkin(scene) {
  scene.load.on('loaderror', (f) => {
    if (f && f.key && String(f.key).startsWith('l8glenda_')) {
      console.error(`[L8 GlendaSkin] ❌ frame failed: ${f.key} → ${f.url}`);
    }
  });
  for (let i = 1; i <= RUN_N; i++) {
    const key = RUN_KEY(i);
    if (!scene.textures.exists(key)) {
      scene.load.image(key, `${FOLDER}frame_${String(i).padStart(3, '0')}.png`);
    }
  }
  if (!scene.textures.exists(IDLE_KEY)) scene.load.image(IDLE_KEY, `${FOLDER}gelnda-idle-frame.png`);
  if (!scene.textures.exists(JUMP_KEY)) scene.load.image(JUMP_KEY, `${FOLDER}gelnda-jump-frame.png`);
}

export function applyGlendaSkin(scene) {
  const player = scene.player;
  if (!player) { console.warn('[L8 GlendaSkin] no player sprite (scene.player) — skipped'); return; }

  // Stop any playing animation BEFORE removing anim keys below — Phaser
  // crashes (null frame → "Cannot read properties of null (reading
  // 'sourceSize')") if you remove an animation a sprite is actively playing.
  player.stop();

  // Some frame files are missing on disk (10, 12, 20-23) — filter them out so
  // the walk animation never references a texture that doesn't exist (that
  // also crashes with the same null-frame error once the cycle reaches it).
  const runKeys = Array.from({ length: RUN_N }, (_, i) => RUN_KEY(i + 1))
    .filter(k => scene.textures.exists(k));

  const origScale = player.scaleX;
  const worldBW   = player.body.width  * origScale;
  const worldBH   = player.body.height * origScale;
  const SIZE_BOOST = 1.22;                          // visual-only enlargement, same as Level 2

  // IMPORTANT: the l8glenda_* textures are mutated in place by processGlendaGroups
  // (cropped + rescaled canvases overwrite the original images) and Phaser's
  // texture cache is GLOBAL across scenes. So the 2nd Level 8 scene to call this
  // (e.g. Home Run, after Food Run already ran) would otherwise compute its
  // "original" displayHeight from Food Run's ALREADY-SHRUNK canvas, cascading
  // the size down each time a new scene applies the skin — this is what made
  // Home Run's Glenda render visibly smaller than Food Run's. Cache the very
  // first computed target height on the game registry and reuse it everywhere
  // so every Level 8 scene renders Glenda at the exact same size, regardless
  // of visit order (same fix already used by Level 7's GlendaSkin).
  let odh = scene.registry.get('l8GlendaTargetHeight');
  if (!odh) {
    const odh0 = player.displayHeight;               // original on-screen height (pre-skin)
    odh = odh0 * SIZE_BOOST;                          // enlarged on-screen height
    scene.registry.set('l8GlendaTargetHeight', odh);
  }
  const odh0 = odh / SIZE_BOOST;

  const groups = [{ keys: runKeys.length > 0 ? runKeys : [IDLE_KEY] }, { keys: [IDLE_KEY] }, { keys: [JUMP_KEY] }];
  const { scale } = processGlendaGroups(scene, groups, odh, SS);

  ['gleeda_walk', 'gleeda_idle', 'gleeda_jump'].forEach(a => { if (scene.anims.exists(a)) scene.anims.remove(a); });
  if (runKeys.length > 0) {
    scene.anims.create({ key: 'gleeda_walk', frames: runKeys.map(key => ({ key })), frameRate: 26, repeat: -1 });
  }
  scene.anims.create({ key: 'gleeda_idle', frames: [{ key: IDLE_KEY }],           frameRate: 1,  repeat: -1 });
  scene.anims.create({ key: 'gleeda_jump', frames: [{ key: JUMP_KEY }],           frameRate: 1,  repeat: -1 });

  player.setTexture(IDLE_KEY);
  player.setScale(scale);
  player.body.setSize(worldBW / scale, worldBH / scale, true);
  // Keep the ORIGINAL foot line: setSize's auto-centering would otherwise
  // sink the boosted sprite by half the added height — push the body down
  // within the frame so the extra height all goes UP (feet stay planted).
  player.body.setOffset(player.body.offset.x, player.body.offset.y + (odh - odh0) / 2 / scale);
  player.play('gleeda_idle', true);

  console.log(`[L8 GlendaSkin] applied — scale ${scale.toFixed(3)}, world body ${worldBW.toFixed(0)}×${worldBH.toFixed(0)} (gameplay preserved).`);
}
