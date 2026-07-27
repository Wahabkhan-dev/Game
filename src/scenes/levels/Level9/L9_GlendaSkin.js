// ════════════════════════════════════════════════════════════════════════════
// L9_GlendaSkin — swaps L9BaseScene's player VISUAL to Glenda.
//
// L9BaseScene.buildPlayer() is shared by every Level 9 run scene (GiftRun,
// BowRun). Its anim keys are named WITHOUT the '_anim' suffix ('gleeda_walk' /
// 'gleeda_idle' / 'gleeda_jump'), same convention as Level 8 — match exactly
// so _setPose() picks up the new frames with no other code changes.
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

const RUN_KEY  = (i) => `l9glenda_run_${i}`;
const IDLE_KEY = 'l9glenda_idle';
const JUMP_KEY = 'l9glenda_jump';

export function preloadGlendaSkin(scene) {
  scene.load.on('loaderror', (f) => {
    if (f && f.key && String(f.key).startsWith('l9glenda_')) {
      console.error(`[L9 GlendaSkin] ❌ frame failed: ${f.key} → ${f.url}`);
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
  if (!player) { console.warn('[L9 GlendaSkin] no player sprite (scene.player) — skipped'); return; }

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

  // IMPORTANT: the l9glenda_* textures are mutated in place by processGlendaGroups
  // and Phaser's texture cache is GLOBAL across scenes. Gift Run and Bow Run both
  // call this — whichever runs SECOND would otherwise compute its "original"
  // displayHeight from the FIRST scene's already-shrunk canvas, making the two
  // runs' Glenda render at different sizes. Cache the first computed target
  // height on the game registry and reuse it everywhere so both runs always
  // render Glenda at the exact same size, regardless of which one loads first.
  //
  // The cached value is also anchored to Level 2's EXACT final height (same
  // fix as Level 7/8's GlendaSkin) rather than trusting player.displayHeight
  // in the moment: Level 2's buildPlayer() starts from gleeda_idle.png (369px
  // tall) at the shared 0.18 base scale, boosted by the same 1.22× — so this
  // constant guarantees Level 9 renders Glenda at IDENTICAL size to Level 2,
  // with no dependency on which texture happens to be active on this scene's
  // player sprite at the moment this runs.
  let odh = scene.registry.get('l9GlendaTargetHeight');
  if (!odh) {
    odh = 369 * 0.18 * SIZE_BOOST;                    // ≈ 81px — matches Level 2
    scene.registry.set('l9GlendaTargetHeight', odh);
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

  console.log(`[L9 GlendaSkin] applied — scale ${scale.toFixed(3)}, world body ${worldBW.toFixed(0)}×${worldBH.toFixed(0)} (gameplay preserved).`);
}
