// ════════════════════════════════════════════════════════════════════════════
// L9_GlendaSkin — swaps L9BaseScene's player VISUAL to Glenda.
//
// L9BaseScene.buildPlayer() is shared by every Level 9 run scene (GiftRun,
// BowRun). Its anim keys are named WITHOUT the '_anim' suffix ('gleeda_walk' /
// 'gleeda_idle' / 'gleeda_jump'), same convention as Level 8 — match exactly
// so _setPose() picks up the new frames with no other code changes.
//
// L9 also has the SAME slide move as Level 8 (120×30 → restore 73×56, source
// px tied to the original 0.18 scale). See the L9BaseScene.js patch:
// _startSlide/_endSlide now derive source-space size from stored WORLD-space
// constants ÷ current scale, so slide collision stays correct at whatever
// scale this skin picks.
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

  const runKeys = Array.from({ length: RUN_N }, (_, i) => RUN_KEY(i + 1));

  const origScale = player.scaleX;
  const worldBW   = player.body.width  * origScale;
  const worldBH   = player.body.height * origScale;
  const SIZE_BOOST = 1.22;                          // visual-only enlargement, same as Level 2
  const odh0      = player.displayHeight;           // original on-screen height
  const odh       = odh0 * SIZE_BOOST;               // enlarged on-screen height

  const groups = [{ keys: runKeys }, { keys: [IDLE_KEY] }, { keys: [JUMP_KEY] }];
  const { scale } = processGlendaGroups(scene, groups, odh, SS);

  ['gleeda_walk', 'gleeda_idle', 'gleeda_jump'].forEach(a => { if (scene.anims.exists(a)) scene.anims.remove(a); });
  scene.anims.create({ key: 'gleeda_walk', frames: runKeys.map(key => ({ key })), frameRate: 26, repeat: -1 });
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

  // Slide's hardcoded (120,30)/(73,56) source-space restores are calibrated for
  // the ORIGINAL scale. Recompute the world-space constants L9BaseScene's
  // _startSlide now uses, so the slide hitbox stays correct at the new scale.
  scene._normalBodyW = worldBW;
  scene._normalBodyH = worldBH;
  scene._slideBodyW  = 120 * origScale;
  scene._slideBodyH  = 30  * origScale;

  console.log(`[L9 GlendaSkin] applied — scale ${scale.toFixed(3)}, world body ${worldBW.toFixed(0)}×${worldBH.toFixed(0)} (gameplay preserved).`);
}
