// ════════════════════════════════════════════════════════════════════════════
// L1_DogSkin — swaps Level 1's player VISUAL to the NEW-RUN black dog.
//
// Gameplay is untouched: the physics body keeps its exact original world size,
// so collisions/gaps/jumps feel identical. Only the textures + the player's
// three animation keys change, and they use Level-1-only keys (l1dog_*) so the
// global shadow_* animations and every other level stay exactly as they were.
//
// Frames (public/assets/images/test/NEW-RUN):
//   run   01.png … 08.png   (gray background  → removed)
//   jump  jump-1.png … 4.png (white background → removed)
//   idle  idle.png           (already transparent)
//
// All frames are background-removed, cropped to ONE shared bounding box, and
// downscaled high-quality to a SINGLE common size — so a single scale + single
// hitbox works for every frame (no per-frame churn, no jump flicker).
// ════════════════════════════════════════════════════════════════════════════

const FOLDER   = 'assets/images/test/NEW-RUN/';
const RUN_N    = 8;
const JUMP_N   = 4;
const SS       = 3;    // supersample factor for crisp downscaling
const CHROMA   = 40;   // background-removal tolerance

const RUN_KEY  = (i) => `l1dog_run_${i}`;
const JUMP_KEY = (i) => `l1dog_jump_${i}`;
const IDLE_KEY = 'l1dog_idle';

// Phaser's texture manager is global to the GAME instance, not per-scene — so
// on a level restart (scene.restart(), e.g. after losing all lives) the
// l1dog_* textures are already the small, background-removed, cropped canvases
// from the FIRST run. Re-running the chroma-key/bbox/redraw pipeline on those
// (instead of the original raw frames) double-processes already-processed
// pixels and visibly corrupts the sprite. This flag makes that pipeline run
// exactly once per page load; every later call just re-applies the cached
// scale to the (new) sprite instance.
let _skinProcessed = false;
let _cachedScale   = null;

export function preloadDogSkin(scene) {
  // Report ONLY dog-frame failures by name (unrelated game 404s are ignored).
  scene.load.on('loaderror', (f) => {
    if (f && f.key && String(f.key).startsWith('l1dog_')) {
      console.error(`[L1 DogSkin] ❌ frame failed: ${f.key} → ${f.url}`);
    }
  });
  for (let i = 1; i <= RUN_N; i++) {
    if (!scene.textures.exists(RUN_KEY(i))) scene.load.image(RUN_KEY(i), `${FOLDER}${String(i).padStart(2, '0')}.png`);
  }
  for (let i = 1; i <= JUMP_N; i++) {
    if (!scene.textures.exists(JUMP_KEY(i))) scene.load.image(JUMP_KEY(i), `${FOLDER}jump-${i}.png`);
  }
  if (!scene.textures.exists(IDLE_KEY)) scene.load.image(IDLE_KEY, `${FOLDER}idle.png`);
}

export function applyDogSkin(scene) {
  if (!scene.shadow) { console.warn('[L1 DogSkin] no player sprite — skipped'); return; }

  const runKeys  = Array.from({ length: RUN_N },  (_, i) => RUN_KEY(i + 1));
  const jumpKeys = Array.from({ length: JUMP_N }, (_, i) => JUMP_KEY(i + 1));

  // ── Capture the ORIGINAL gameplay dims (preserve them exactly). ──
  // NOTE: Arcade body.width/height are SOURCE (unscaled) texture px, so the real
  // world collision size = body.width * sprite.scale. We preserve that world size.
  const origScale = scene.shadow.scaleX;                     // e.g. 0.18
  const worldBW   = scene.shadow.body.width  * origScale;    // real world collision W (~73)
  const worldBH   = scene.shadow.body.height * origScale;    // real world collision H (~56)

  if (_skinProcessed) {
    // Already processed once this page load — the l1dog_* textures are the
    // small, final canvases from that run. Just re-apply the cached scale to
    // this (new, post-restart) sprite instance without touching pixels again.
    ['l1dog_walk', 'l1dog_idle_anim', 'l1dog_jump_anim'].forEach(a => { if (scene.anims.exists(a)) scene.anims.remove(a); });
    scene.anims.create({ key: 'l1dog_walk',      frames: runKeys.map(key => ({ key })),  frameRate: 14, repeat: -1 });
    scene.anims.create({ key: 'l1dog_idle_anim', frames: [{ key: IDLE_KEY }],            frameRate: 1,  repeat: -1 });
    scene.anims.create({ key: 'l1dog_jump_anim', frames: jumpKeys.map(key => ({ key })), frameRate: 10, repeat: -1 });
    scene._walkAnim = 'l1dog_walk';
    scene._idleAnim = 'l1dog_idle_anim';
    scene._jumpAnim = 'l1dog_jump_anim';
    scene.shadow.setTexture(IDLE_KEY);
    scene.shadow.setScale(_cachedScale);
    scene.shadow.body.setSize(worldBW / _cachedScale, worldBH / _cachedScale, true);
    scene.shadow.play('l1dog_idle_anim', true);
    return;
  }

  // ── Remove a flat backdrop (gray/white) by corner-sampling → alpha. ──
  const toCanvas = (src, chroma) => {
    const w = src.width, h = src.height;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(src, 0, 0);
    if (!chroma) return c;
    let img;
    try { img = ctx.getImageData(0, 0, w, h); } catch (e) { return c; }
    const d = img.data;
    const corners = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + w - 1) * 4];
    let bR = 0, bG = 0, bB = 0;
    corners.forEach(o => { bR += d[o]; bG += d[o + 1]; bB += d[o + 2]; });
    bR /= 4; bG /= 4; bB /= 4;
    const soft = CHROMA * 1.8;
    for (let p = 0; p < d.length; p += 4) {
      const dr = d[p] - bR, dg = d[p + 1] - bG, db = d[p + 2] - bB;
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);
      if (dist < CHROMA) d[p + 3] = 0;
      else if (dist < soft) d[p + 3] = Math.round(d[p + 3] * ((dist - CHROMA) / (soft - CHROMA)));
    }
    ctx.putImageData(img, 0, 0);
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

  // ── Background-remove every frame and compute ONE shared bounding box. ──
  // ── Process each pose-GROUP with its OWN shared bounding box. ──
  // A single shared box across ALL frames was wrong: idle.png is 500×500 while
  // the run frames are 1000×1000, so a box sized for the big run frames made the
  // small idle dog render tiny. Instead each group (run / jump / idle) gets its
  // own box (run & jump share within their group → no jitter), and every group
  // is normalized to the SAME on-screen height so all poses match in size.
  const groups = [
    { keys: runKeys,      chroma: true  },
    { keys: jumpKeys,     chroma: true  },
    { keys: [IDLE_KEY],   chroma: false },
  ];
  for (const g of groups) {
    g.items = [];
    let gX = Infinity, gY = Infinity, gMaxX = 0, gMaxY = 0;
    for (const key of g.keys) {
      if (!scene.textures.exists(key)) continue;
      const cv = toCanvas(scene.textures.get(key).getSourceImage(), g.chroma);
      g.items.push({ key, cv });
      const b = bboxOf(cv);
      gX = Math.min(gX, b.x); gY = Math.min(gY, b.y);
      gMaxX = Math.max(gMaxX, b.x + b.w - 1); gMaxY = Math.max(gMaxY, b.y + b.h - 1);
    }
    g.box = isFinite(gX) ? { x: gX, y: gY, w: gMaxX - gX + 1, h: gMaxY - gY + 1 } : { x: 0, y: 0, w: 1, h: 1 };
  }

  const odh = scene.shadow.displayHeight;              // match the on-screen height

  // Every group is scaled so its content is `outH` tall → uniform on-screen size.
  const outH  = Math.max(1, Math.round(odh * SS));
  let outW = 1;
  for (const g of groups) { g.sw = Math.max(1, Math.round(g.box.w * outH / g.box.h)); if (g.sw > outW) outW = g.sw; }
  const scale = odh / outH;               // = 1/SS

  // Draw each frame: content scaled to full height, centred horizontally, feet at bottom.
  for (const g of groups) {
    const dx = Math.round((outW - g.sw) / 2);
    for (const it of g.items) {
      const out = document.createElement('canvas');
      out.width = outW; out.height = outH;
      const ctx = out.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, outW, outH);
      ctx.drawImage(it.cv, g.box.x, g.box.y, g.box.w, g.box.h, dx, 0, g.sw, outH);
      scene.textures.remove(it.key);
      scene.textures.addCanvas(it.key, out);
    }
  }

  // ── Level-1-only animations (distinct keys → nothing global is touched). ──
  ['l1dog_walk', 'l1dog_idle_anim', 'l1dog_jump_anim'].forEach(a => { if (scene.anims.exists(a)) scene.anims.remove(a); });
  scene.anims.create({ key: 'l1dog_walk',      frames: runKeys.map(key => ({ key })),  frameRate: 14, repeat: -1 });
  scene.anims.create({ key: 'l1dog_idle_anim', frames: [{ key: IDLE_KEY }],            frameRate: 1,  repeat: -1 });
  scene.anims.create({ key: 'l1dog_jump_anim', frames: jumpKeys.map(key => ({ key })), frameRate: 10, repeat: -1 });

  // Point the player's animation names (BaseLevelScene.updateMovement reads these).
  scene._walkAnim = 'l1dog_walk';
  scene._idleAnim = 'l1dog_idle_anim';
  scene._jumpAnim = 'l1dog_jump_anim';

  // ── Apply the new look; keep the physics body's WORLD size unchanged. ──
  // setSize is in source px; source × newScale must equal the original world size.
  scene.shadow.setTexture(IDLE_KEY);
  scene.shadow.setScale(scale);
  scene.shadow.body.setSize(worldBW / scale, worldBH / scale, true); // world stays worldBW×worldBH
  scene.shadow.play('l1dog_idle_anim', true);

  _cachedScale   = scale;
  _skinProcessed = true;

  console.log(`[L1 DogSkin] applied — out ${outW}×${outH}, scale ${scale.toFixed(3)}, world body ${worldBW.toFixed(0)}×${worldBH.toFixed(0)} (gameplay preserved).`);
}
