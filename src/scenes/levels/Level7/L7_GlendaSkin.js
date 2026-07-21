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
  scene.load.on('loaderror', (f) => {
    if (f && f.key && String(f.key).startsWith('l7glenda_')) {
      console.error(`[L7 GlendaSkin] ❌ frame failed: ${f.key} → ${f.url}`);
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
  if (!player) { console.warn('[L7 GlendaSkin] no player sprite (scene.player) — skipped'); return; }

  const runKeys = Array.from({ length: RUN_N }, (_, i) => RUN_KEY(i + 1));

  const origScale = player.scaleX;
  const worldBW   = player.body.width  * origScale;
  const worldBH   = player.body.height * origScale;
  const odh       = player.displayHeight;

  const groups = [{ keys: runKeys }, { keys: [IDLE_KEY] }, { keys: [JUMP_KEY] }];
  const { scale } = processGlendaGroups(scene, groups, odh, SS);

  ['gleeda_walk', 'gleeda_idle_anim', 'gleeda_jump_anim'].forEach(a => { if (scene.anims.exists(a)) scene.anims.remove(a); });
  scene.anims.create({ key: 'gleeda_walk',      frames: runKeys.map(key => ({ key })), frameRate: 26, repeat: -1 });
  scene.anims.create({ key: 'gleeda_idle_anim', frames: [{ key: IDLE_KEY }],           frameRate: 1,  repeat: -1 });
  scene.anims.create({ key: 'gleeda_jump_anim', frames: [{ key: JUMP_KEY }],           frameRate: 1,  repeat: -1 });

  player.setTexture(IDLE_KEY);
  player.setScale(scale);
  player.body.setSize(worldBW / scale, worldBH / scale, true);
  player.play('gleeda_idle_anim', true);

  console.log(`[L7 GlendaSkin] applied — scale ${scale.toFixed(3)}, world body ${worldBW.toFixed(0)}×${worldBH.toFixed(0)} (gameplay preserved).`);
}
