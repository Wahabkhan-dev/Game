// ════════════════════════════════════════════════════════════════════════════
// GlendaSkinCore — shared pixel-processing helpers used by every LevelN's
// Glenda skin file (L1 uses its own dog-specific variant; L2/L4/L5/L6/L7/L8/L9
// all share this core). Each level keeps its OWN texture-key prefix (avoids
// cross-level texture-cache collisions) and its own animation-key names/quirks;
// only the raw crop + high-quality downscale + alpha-fix pipeline lives here.
//
// Why premultiply/unpremultiply: transparent PNG pixels often carry garbage
// RGB underneath (frequently the original background colour). A smoothed
// canvas downscale would blend that hidden colour into visible edges,
// producing a dark/light halo. Premultiplying before the scale (then
// unpremultiplying after) neutralizes it.
// ════════════════════════════════════════════════════════════════════════════

export function toCanvas(src) {
  const w = src.width, h = src.height;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.getContext('2d', { willReadFrequently: true }).drawImage(src, 0, 0);
  return c;
}

export function bboxOf(canvas) {
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
}

export function premultiply(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let p = 0; p < d.length; p += 4) {
    const a = d[p + 3] / 255;
    d[p] *= a; d[p + 1] *= a; d[p + 2] *= a;
  }
  ctx.putImageData(img, 0, 0);
}

export function unpremultiply(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let p = 0; p < d.length; p += 4) {
    const a = d[p + 3] / 255;
    if (a > 0.004) { d[p] /= a; d[p + 1] /= a; d[p + 2] /= a; }
  }
  ctx.putImageData(img, 0, 0);
}

// Processes pose-groups (each `{ keys: [...] }`, sharing ONE bounding box among
// its own keys — e.g. all 26 run frames share a box, idle has its own, jump has
// its own). Every group is then normalized to the SAME on-screen height
// (targetDisplayHeight), so idle/run/jump all render at a consistent size.
// Mutates the scene's texture cache in place. Returns { outW, outH, scale } —
// the common canvas size every processed texture now has, and the display
// scale needed so that size renders at targetDisplayHeight.
export function processGlendaGroups(scene, groups, targetDisplayHeight, ss = 3) {
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

  const outH = Math.max(1, Math.round(targetDisplayHeight * ss));
  let outW = 1;
  for (const g of groups) { g.sw = Math.max(1, Math.round(g.box.w * outH / g.box.h)); if (g.sw > outW) outW = g.sw; }
  const scale = targetDisplayHeight / outH;

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
  return { outW, outH, scale };
}
