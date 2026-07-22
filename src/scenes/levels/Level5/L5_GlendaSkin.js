// ════════════════════════════════════════════════════════════════════════════
// L5_GlendaSkin — swaps L5_EquipmentRunScene's player VISUAL to Glenda.
//
// NOTE: There are two scenes in the Level 5 folder — Level5Scene.js is the
// care/treatment mini-game (drag puppies into baskets, NO running player
// character, not skinned). This file targets L5_EquipmentRunScene.js, the
// platformer "run to collect supplies" scene, which has `this.player` and
// hardcodes anim keys 'gleeda_walk' / 'gleeda_idle_anim' / 'gleeda_jump_anim'
// directly in its update() (same structure as Level 4). So this skin
// OVERWRITES those exact existing anim keys with Glenda's real frames instead
// of creating new ones — no changes needed to the movement/update code.
//
// Frames (public/assets/images/test/glenda-run) — ALL already transparent:
//   run   frame_001.png … frame_026.png   (720×1280)
//   idle  gelnda-idle-frame.png            (375×666)
//   jump  gelnda-jump-frame.png            (375×666)
//
// Each pose-group is cropped to its OWN content bounding box then every group
// is normalized to the SAME on-screen height — same technique as L2/L4 skins.
// ════════════════════════════════════════════════════════════════════════════

const FOLDER  = 'assets/images/test/glenda-run/';
const RUN_N   = 26;
const SS      = 3; // supersample factor for crisp downscaling

const RUN_KEY  = (i) => `l5glenda_run_${i}`;
const IDLE_KEY = 'l5glenda_idle';
const JUMP_KEY = 'l5glenda_jump';

export function preloadGlendaSkin(scene) {
  scene.load.on('loaderror', (f) => {
    if (f && f.key && String(f.key).startsWith('l5glenda_')) {
      console.error(`[L5 GlendaSkin] ❌ frame failed: ${f.key} → ${f.url}`);
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
  if (!player) { console.warn('[L5 GlendaSkin] no player sprite (scene.player) — skipped'); return; }

  const runKeys = Array.from({ length: RUN_N }, (_, i) => RUN_KEY(i + 1));

  const toCanvas = (src) => {
    const w = src.width, h = src.height;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d', { willReadFrequently: true }).drawImage(src, 0, 0);
    return c;
  };

  const bboxOf = (canvas) => {
    const w = canvas.width, h = canvas.height;
    const d = canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data;
    let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > 16) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
    if (!isFinite(minX)) return { x: 0, y: 0, w, h };
    return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
  };

  const premultiply = (canvas) => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = img.data;
    for (let p = 0; p < d.length; p += 4) {
      const a = d[p + 3] / 255;
      d[p] *= a; d[p + 1] *= a; d[p + 2] *= a;
    }
    ctx.putImageData(img, 0, 0);
  };
  const unpremultiply = (canvas) => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = img.data;
    for (let p = 0; p < d.length; p += 4) {
      const a = d[p + 3] / 255;
      if (a > 0.004) { d[p] /= a; d[p + 1] /= a; d[p + 2] /= a; }
    }
    ctx.putImageData(img, 0, 0);
  };

  const groups = [
    { keys: runKeys,    },
    { keys: [IDLE_KEY], },
    { keys: [JUMP_KEY], },
  ];
  for (const g of groups) {
    g.items = [];
    let gX = Infinity, gY = Infinity, gMaxX = 0, gMaxY = 0;
    for (const key of g.keys) {
      if (!scene.textures.exists(key)) continue;
      const cv = toCanvas(scene.textures.get(key).getSourceImage());
      g.items.push({ key, cv });
      const b = bboxOf(cv);
      gX = Math.min(gX, b.x); gY = Math.min(gY, b.y);
      gMaxX = Math.max(gMaxX, b.x + b.w - 1); gMaxY = Math.max(gMaxY, b.y + b.h - 1);
    }
    g.box = isFinite(gX) ? { x: gX, y: gY, w: gMaxX - gX + 1, h: gMaxY - gY + 1 } : { x: 0, y: 0, w: 1, h: 1 };
  }

  const origScale = player.scaleX;
  const worldBW   = player.body.width  * origScale;
  const worldBH   = player.body.height * origScale;
  const SIZE_BOOST = 1.22;               // visual-only enlargement — matches L2/L4 GlendaSkin so
                                          // Glenda renders at the SAME on-screen size in every level.
  const odh0      = player.displayHeight;
  const odh       = odh0 * SIZE_BOOST;

  const outH  = Math.max(1, Math.round(odh * SS));
  let outW = 1;
  for (const g of groups) { g.sw = Math.max(1, Math.round(g.box.w * outH / g.box.h)); if (g.sw > outW) outW = g.sw; }
  const scale = odh / outH;

  for (const g of groups) {
    const dx = Math.round((outW - g.sw) / 2);
    for (const it of g.items) {
      premultiply(it.cv);

      const out = document.createElement('canvas');
      out.width = outW; out.height = outH;
      const ctx = out.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, outW, outH);
      ctx.drawImage(it.cv, g.box.x, g.box.y, g.box.w, g.box.h, dx, 0, g.sw, outH);

      unpremultiply(out);
      scene.textures.remove(it.key);
      scene.textures.addCanvas(it.key, out);
    }
  }

  // Overwrite the EXISTING anim keys L5_EquipmentRunScene's update() already
  // calls directly ('gleeda_walk' / 'gleeda_idle_anim' / 'gleeda_jump_anim')
  // with Glenda's real frames — no changes needed to the movement/update code.
  ['gleeda_walk', 'gleeda_idle_anim', 'gleeda_jump_anim'].forEach(a => { if (scene.anims.exists(a)) scene.anims.remove(a); });
  scene.anims.create({ key: 'gleeda_walk',      frames: runKeys.map(key => ({ key })), frameRate: 26, repeat: -1 });
  scene.anims.create({ key: 'gleeda_idle_anim', frames: [{ key: IDLE_KEY }],           frameRate: 1,  repeat: -1 });
  scene.anims.create({ key: 'gleeda_jump_anim', frames: [{ key: JUMP_KEY }],           frameRate: 1,  repeat: -1 });

  player.setTexture(IDLE_KEY);
  player.setScale(scale);
  player.body.setSize(worldBW / scale, worldBH / scale, true);
  // Keep the ORIGINAL foot line: centred, the boosted sprite would sink by half
  // the added height — push the body down within the frame so the extra height
  // all goes UP instead (feet stay planted on the ground). Same as L2/L4.
  player.body.setOffset(player.body.offset.x, player.body.offset.y + (odh - odh0) / 2 / scale);
  player.play('gleeda_idle_anim', true);

  console.log(`[L5 GlendaSkin] applied — out ${outW}×${outH}, scale ${scale.toFixed(3)}, world body ${worldBW.toFixed(0)}×${worldBH.toFixed(0)} (gameplay preserved).`);
}
