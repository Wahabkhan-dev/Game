// ════════════════════════════════════════════════════════════════════════════
// L7_GlendaSkin — swaps L7BaseScene's player VISUAL to Glenda.
//
// L7BaseScene.buildPlayer() is shared by every Level 7 stage that has a
// running player (Stage1, Stage3). It hardcodes anim keys 'gleeda_walk' /
// 'gleeda_idle_anim' / 'gleeda_jump_anim' and reads them in runMovement().
// This skin OVERWRITES those exact existing anim keys with Glenda's real
// frames — applying it once inside buildPlayer() covers every stage.
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

const RUN_KEY  = (i) => `l7glenda_run_${i}`;
const IDLE_KEY = 'l7glenda_idle';
const JUMP_KEY = 'l7glenda_jump';

export function preloadGlendaSkin(scene) {
  // Only load frames that actually exist in the folder (missing: 10, 12, 20-23)
  const VALID_FRAMES = [1,2,3,4,5,6,7,8,9, 11, 13,14,15,16,17,18,19, 24,25,26,27];

  scene.load.on('loaderror', (f) => {
    if (f && f.key && String(f.key).startsWith('l7glenda_')) {
      console.warn(`[L7 GlendaSkin] frame unavailable: ${f.key}`);
    }
  });

  VALID_FRAMES.forEach(i => {
    const key = RUN_KEY(i);
    if (!scene.textures.exists(key)) {
      scene.load.image(key, `${FOLDER}frame_${String(i).padStart(3, '0')}.png`);
    }
  });

  if (!scene.textures.exists(IDLE_KEY)) scene.load.image(IDLE_KEY, `${FOLDER}gelnda-idle-frame.png`);
  if (!scene.textures.exists(JUMP_KEY)) scene.load.image(JUMP_KEY, `${FOLDER}gelnda-jump-frame.png`);
}

export function applyGlendaSkin(scene) {
  const player = scene.player;
  if (!player) { console.warn('[L7 GlendaSkin] no player sprite (scene.player) — skipped'); return; }

  // Stop any playing animation before removing animation keys
  player.stop();

  // Use only the frames that actually exist
  const VALID_FRAMES = [1,2,3,4,5,6,7,8,9, 11, 13,14,15,16,17,18,19, 24,25,26,27];
  const runKeys = VALID_FRAMES.map(i => RUN_KEY(i));

  const origScale = player.scaleX;
  const worldBW   = player.body.width  * origScale;
  const worldBH   = player.body.height * origScale;
  const SIZE_BOOST = 1.22;                          // visual-only enlargement, same as Level 2

  // IMPORTANT: the l7glenda_* textures are mutated in place by processGlendaGroups
  // (cropped + rescaled canvases overwrite the original images) and Phaser's
  // texture cache is GLOBAL across scenes. So the 2nd stage to call this (e.g.
  // Stage3, after Stage1 already ran) would otherwise compute its "original"
  // displayHeight from Stage1's ALREADY-SHRUNK canvas, cascading the size down
  // each time a stage is (re)entered. Cache the very first computed target
  // height on the game registry and reuse it everywhere so every stage renders
  // Glenda at the exact same size, regardless of visit order.
  let odh = scene.registry.get('l7GlendaTargetHeight');
  if (!odh) {
    // Match Level 2's Glenda size exactly, instead of deriving the boost from
    // THIS level's own pre-skin sprite. Level 2's buildPlayer() starts from a
    // small placeholder (gleeda_idle.png, 369px tall); Level 7's buildPlayer()
    // starts from the REAL Glenda art directly (666px tall) — boosting from
    // its own much-taller starting point rendered L7's Glenda nearly 2x the
    // size of Level 2's. Anchor to Level 2's actual final height instead:
    // gleeda_idle.png's 369px height × the shared 0.18 base scale × the same
    // 1.22 boost.
    odh = 369 * 0.18 * SIZE_BOOST;                    // ≈ 81px — matches Level 2
    scene.registry.set('l7GlendaTargetHeight', odh);
  }
  const odh0 = odh / SIZE_BOOST;

  // Filter runKeys to only include textures that exist BEFORE creating groups
  const validRunKeys = runKeys.filter(k => scene.textures.exists(k));
  const groups = [{ keys: validRunKeys.length > 0 ? validRunKeys : [IDLE_KEY] }, { keys: [IDLE_KEY] }, { keys: [JUMP_KEY] }];
  const { scale } = processGlendaGroups(scene, groups, odh, SS);

  // Remove old animations and create fresh ones (now safe since player.stop() was called)
  try { if (scene.anims.exists('gleeda_walk')) scene.anims.remove('gleeda_walk'); } catch (_) {}
  try { if (scene.anims.exists('gleeda_idle_anim')) scene.anims.remove('gleeda_idle_anim'); } catch (_) {}
  try { if (scene.anims.exists('gleeda_jump_anim')) scene.anims.remove('gleeda_jump_anim'); } catch (_) {}

  if (validRunKeys.length > 0) {
    scene.anims.create({ key: 'gleeda_walk', frames: validRunKeys.map(key => ({ key })), frameRate: 26, repeat: -1 });
  }
  scene.anims.create({ key: 'gleeda_idle_anim', frames: [{ key: IDLE_KEY }], frameRate: 1, repeat: -1 });
  scene.anims.create({ key: 'gleeda_jump_anim', frames: [{ key: JUMP_KEY }], frameRate: 1, repeat: -1 });

  player.setTexture(IDLE_KEY);
  player.setScale(scale);
  player.body.setSize(worldBW / scale, worldBH / scale, true);
  // Keep the ORIGINAL foot line: setSize's auto-centering would otherwise
  // sink the boosted sprite by half the added height — push the body down
  // within the frame so the extra height all goes UP (feet stay planted).
  player.body.setOffset(player.body.offset.x, player.body.offset.y + (odh - odh0) / 2 / scale);
  player.play('gleeda_idle_anim', true);

  console.log(`[L7 GlendaSkin] applied — scale ${scale.toFixed(3)}, world body ${worldBW.toFixed(0)}×${worldBH.toFixed(0)} (gameplay preserved).`);
}
