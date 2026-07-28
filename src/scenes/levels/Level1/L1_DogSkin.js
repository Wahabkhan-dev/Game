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
const BASE_SHADOW_SCALE = 0.18; // same base scale used by BaseLevelScene.buildPlayer()

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
let _skinPrepared = false;
let _cachedScale   = null;
let _dogSkinAnimsCreated = false;

function _createDogSkinAnims(scene) {
  if (_dogSkinAnimsCreated || scene.anims.exists('l1dog_walk')) {
    _dogSkinAnimsCreated = true;
    return;
  }
  scene.anims.create({ key: 'l1dog_walk',      frames: Array.from({ length: RUN_N }, (_, i) => ({ key: RUN_KEY(i + 1) })), frameRate: 14, repeat: -1 });
  scene.anims.create({ key: 'l1dog_idle_anim', frames: [{ key: IDLE_KEY }], frameRate: 1, repeat: -1 });
  scene.anims.create({ key: 'l1dog_jump_anim', frames: Array.from({ length: JUMP_N }, (_, i) => ({ key: JUMP_KEY(i + 1) })), frameRate: 10, repeat: -1 });
  _dogSkinAnimsCreated = true;
}

function _buildDogSkinGroups(scene, runKeys, jumpKeys) {
  const groups = [
    { keys: runKeys,      chroma: true  },
    { keys: jumpKeys,     chroma: true  },
    { keys: [IDLE_KEY],   chroma: false },
  ];

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
    const soft2 = soft * soft;
    const chroma2 = CHROMA * CHROMA;
    for (let p = 0; p < d.length; p += 4) {
      const dr = d[p] - bR, dg = d[p + 1] - bG, db = d[p + 2] - bB;
      const dist2 = dr * dr + dg * dg + db * db;
      if (dist2 < chroma2) d[p + 3] = 0;
      else if (dist2 < soft2) {
        const dist = Math.sqrt(dist2);
        d[p + 3] = Math.round(d[p + 3] * ((dist - CHROMA) / (soft - CHROMA)));
      }
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

  return groups;
}

function _renderDogSkinGroups(scene, groups, targetDisplayHeight) {
  const outH = Math.max(1, Math.round(targetDisplayHeight * SS));
  let outW = 1;
  for (const g of groups) { g.sw = Math.max(1, Math.round(g.box.w * outH / g.box.h)); if (g.sw > outW) outW = g.sw; }
  const scale = targetDisplayHeight / outH;

  for (const g of groups) {
    const dx = Math.round((outW - g.sw) / 2);
    for (const it of g.items) {
      const out = document.createElement('canvas');
      out.width = outW; out.height = outH;
      const ctx = out.getContext('2d', { willReadFrequently: true });
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, outW, outH);
      ctx.drawImage(it.cv, g.box.x, g.box.y, g.box.w, g.box.h, dx, 0, g.sw, outH);
      scene.textures.remove(it.key);
      scene.textures.addCanvas(it.key, out);
    }
  }

  return scale;
}

export function prepareDogSkin(scene) {
  if (_skinPrepared) return;
  const runKeys  = Array.from({ length: RUN_N },  (_, i) => RUN_KEY(i + 1));
  const jumpKeys = Array.from({ length: JUMP_N }, (_, i) => JUMP_KEY(i + 1));
  if (!runKeys.every(k => scene.textures.exists(k)) || !jumpKeys.every(k => scene.textures.exists(k)) || !scene.textures.exists(IDLE_KEY) || !scene.textures.exists('shadow_idle')) {
    return;
  }

  const shadowSrc = scene.textures.get('shadow_idle').getSourceImage();
  const targetHeight = shadowSrc.height * BASE_SHADOW_SCALE;
  const groups = _buildDogSkinGroups(scene, runKeys, jumpKeys);
  _cachedScale = _renderDogSkinGroups(scene, groups, targetHeight);
  _skinPrepared = true;
  _createDogSkinAnims(scene);
}

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

  if (!_skinPrepared) {
    prepareDogSkin(scene);
  }

  _createDogSkinAnims(scene);
  scene._walkAnim = 'l1dog_walk';
  scene._idleAnim = 'l1dog_idle_anim';
  scene._jumpAnim = 'l1dog_jump_anim';
  scene.shadow.setTexture(IDLE_KEY);

  if (_cachedScale) {
    scene.shadow.setScale(_cachedScale);
    scene.shadow.body.setSize(worldBW / _cachedScale, worldBH / _cachedScale, true);
  } else {
    const shadowSrc = scene.textures.exists('shadow_idle') ? scene.textures.get('shadow_idle').getSourceImage() : null;
    const targetHeight = shadowSrc ? shadowSrc.height * BASE_SHADOW_SCALE : scene.shadow.displayHeight * BASE_SHADOW_SCALE;
    const groups = _buildDogSkinGroups(scene, runKeys, jumpKeys);
    const scale = _renderDogSkinGroups(scene, groups, targetHeight);
    _cachedScale = scale;
    _skinPrepared = true;
    scene.shadow.setScale(scale);
    scene.shadow.body.setSize(worldBW / scale, worldBH / scale, true);
  }

  scene.shadow.play('l1dog_idle_anim', true);
}
