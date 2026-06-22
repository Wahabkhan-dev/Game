import Phaser from 'phaser';

// ════════════════════════════════════════════════════════════════════════════
// LEVEL 7 — EMERGENCY JOURNEY
// All textures are generated procedurally so the level NEVER reuses the jungle
// background (or any other level's art). Each stage owns a unique environment.
// ════════════════════════════════════════════════════════════════════════════
export function generateL7Assets(scene) {
  // Guard — run once per session (key never loaded as a real image file)
  if (scene.textures.exists('l7_ready')) return;
  const g = scene.make.graphics({ add: false });
  const gen = (k, w, h) => { if (!scene.textures.exists(k)) g.generateTexture(k, w, h); g.clear(); };

  // helper: vertical gradient fill
  const grad = (w, h, top, bot) => {
    for (let y = 0; y < h; y++) {
      const t = y / h;
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(top),
        Phaser.Display.Color.ValueToColor(bot), 100, Math.floor(t * 100));
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
      g.fillRect(0, y, w, 1);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // SHARED — fog, sparkle, glow, star, checkmark
  // ──────────────────────────────────────────────────────────────────────────
  // Soft fog blob (volumetric mist)
  g.clear();
  for (let i = 0; i < 40; i++) {
    const x = Phaser.Math.Between(0, 256), y = Phaser.Math.Between(0, 128);
    g.fillStyle(0xffffff, 0.03 + Math.random() * 0.04);
    g.fillCircle(x, y, 18 + Math.random() * 30);
  }
  gen('l7_fog', 256, 128);

  // Sparkle (4-point star)
  g.clear();
  g.fillStyle(0xffffff, 1);
  g.fillTriangle(12, 0, 9, 9, 15, 9); g.fillTriangle(12, 24, 9, 15, 15, 15);
  g.fillTriangle(0, 12, 9, 9, 9, 15); g.fillTriangle(24, 12, 15, 9, 15, 15);
  g.fillStyle(0xfff3aa, 0.9); g.fillCircle(12, 12, 3);
  gen('l7_spark', 24, 24);

  // Round glow
  g.clear();
  for (let r = 30; r > 0; r--) { g.fillStyle(0xffe9a0, 0.04); g.fillCircle(32, 32, r); }
  gen('l7_glow', 64, 64);

  // Gold star (rating)
  g.clear();
  {
    const cx = 18, cy = 18, R = 16, r = 7, pts = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5; const rad = i % 2 ? r : R; pts.push({ x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad }); }
    g.fillStyle(0xffd23a, 1); g.fillPoints(pts, true);
    g.lineStyle(2, 0xd49810, 1); g.strokePoints(pts, true);
    g.fillStyle(0xfff0a0, 0.6); g.fillCircle(14, 13, 4);
  }
  gen('l7_star', 36, 36);

  // ══════════════════════════════════════════════════════════════════════════
  // STAGE 1 — RAINY COUNTRYSIDE HOUSE (night)
  // ══════════════════════════════════════════════════════════════════════════
  // Sky (deep stormy night)
  g.clear();
  grad(800, 450, 0x0a1424, 0x1a2236);
  // distant lightning haze
  g.fillStyle(0x2a3a52, 0.25); g.fillEllipse(560, 90, 420, 180);
  // stars
  for (let i = 0; i < 60; i++) { g.fillStyle(0xffffff, Math.random() * 0.5); g.fillCircle(Math.random() * 800, Math.random() * 220, Math.random() * 1.3); }
  // far hills
  g.fillStyle(0x0c1a14, 1); g.fillEllipse(150, 470, 600, 200); g.fillEllipse(650, 480, 700, 220);
  gen('l7_s1_sky', 800, 450);

  // Large house (lit windows) — 360×260
  g.clear();
  // body
  g.fillStyle(0x3a2a1e, 1); g.fillRect(30, 90, 300, 170);
  g.fillStyle(0x2e2016, 0.5); g.fillRect(30, 90, 300, 10);
  // wood plank lines
  g.lineStyle(1, 0x261a10, 0.5); for (let y = 104; y < 260; y += 16) g.lineBetween(30, y, 330, y);
  // roof
  g.fillStyle(0x4a1e16, 1); g.fillTriangle(10, 96, 180, 8, 350, 96);
  g.fillStyle(0x3a1610, 1); g.fillRect(10, 92, 340, 8);
  // chimney
  g.fillStyle(0x5a2a1e, 1); g.fillRect(260, 30, 26, 50);
  // lit windows (warm glow)
  const win = (x, y, w, h) => {
    g.fillStyle(0xffd870, 1); g.fillRect(x, y, w, h);
    g.fillStyle(0xfff0b0, 0.5); g.fillRect(x, y, w, h / 2);
    g.lineStyle(2, 0x2a1a10, 0.9); g.strokeRect(x, y, w, h);
    g.lineBetween(x + w / 2, y, x + w / 2, y + h); g.lineBetween(x, y + h / 2, x + w, y + h / 2);
  };
  win(60, 120, 44, 42); win(150, 120, 44, 42); win(250, 120, 44, 42);
  // door (warm light leaking)
  g.fillStyle(0x2a1a10, 1); g.fillRect(150, 196, 50, 64);
  g.fillStyle(0xffcf70, 0.85); g.fillRect(154, 200, 42, 56);
  g.fillStyle(0x3a2414, 1); g.fillRect(154, 200, 42, 56); g.lineStyle(2, 0x1a0e06, 1); g.strokeRect(154, 200, 42, 56);
  g.fillStyle(0xf5c84a, 1); g.fillCircle(190, 230, 2.5);
  // porch light glow
  g.fillStyle(0xffe9a0, 0.18); g.fillCircle(175, 196, 40);
  gen('l7_s1_house', 360, 264);

  // Shed (small wooden) — 150×130
  g.clear();
  g.fillStyle(0x2e2418, 1); g.fillRect(10, 50, 130, 80);
  g.lineStyle(1, 0x241a10, 0.6); for (let y = 60; y < 130; y += 12) g.lineBetween(10, y, 140, y);
  g.fillStyle(0x3a2a1a, 1); g.fillTriangle(0, 54, 75, 14, 150, 54);
  g.fillStyle(0x1a1208, 1); g.fillRect(54, 78, 42, 52); // dark doorway
  g.lineStyle(2, 0x4a3420, 1); g.strokeRect(54, 78, 42, 52);
  g.fillStyle(0x5a4028, 1); g.fillRect(74, 100, 4, 10); // handle
  gen('l7_s1_shed', 150, 132);

  // Picket fence (tileable) — 120×60
  g.clear();
  g.fillStyle(0x6a5238, 1); g.fillRect(0, 26, 120, 6); g.fillRect(0, 42, 120, 6);
  for (let x = 4; x < 120; x += 18) {
    g.fillStyle(0x7a6042, 1); g.fillRect(x, 8, 10, 50);
    g.fillTriangle(x, 8, x + 5, 0, x + 10, 8);
    g.fillStyle(0x5a4430, 0.4); g.fillRect(x, 8, 3, 50);
  }
  gen('l7_s1_fence', 120, 60);

  // Dark tree silhouette — 160×220
  g.clear();
  g.fillStyle(0x0a1410, 1);
  g.fillRect(70, 120, 20, 100);
  g.fillEllipse(80, 90, 150, 130); g.fillEllipse(40, 110, 90, 90); g.fillEllipse(120, 110, 90, 90);
  g.fillStyle(0x10201a, 0.6); g.fillEllipse(70, 70, 80, 70);
  gen('l7_s1_tree', 160, 224);

  // Muddy wet ground strip (tile 128×80)
  g.clear();
  grad(128, 80, 0x241a12, 0x140d08);
  g.fillStyle(0x000000, 0.3); for (let i = 0; i < 10; i++) g.fillEllipse(Math.random() * 128, 20 + Math.random() * 50, 20 + Math.random() * 30, 6);
  // wet sheen
  g.fillStyle(0x4a6a7a, 0.10); g.fillRect(0, 0, 128, 14);
  gen('l7_s1_ground', 128, 80);

  // Mud puddle (hurdle, flat) 90×26
  g.clear();
  g.fillStyle(0x1a2a30, 0.7); g.fillEllipse(45, 14, 86, 22);
  g.fillStyle(0x35525e, 0.5); g.fillEllipse(42, 12, 64, 14);
  g.fillStyle(0xaecadb, 0.25); g.fillEllipse(30, 10, 22, 5);
  gen('l7_puddle', 90, 28);

  // Fallen tree (hurdle) 130×70
  g.clear();
  g.fillStyle(0x000000, 0.2); g.fillEllipse(65, 64, 120, 12);
  g.fillStyle(0x4a3420, 1); g.fillRoundedRect(6, 26, 118, 30, 14);
  g.fillStyle(0x5a4028, 0.6); g.fillRect(10, 30, 110, 6);
  g.lineStyle(2, 0x3a2614, 0.6); for (let x = 20; x < 120; x += 16) g.lineBetween(x, 28, x, 54);
  // cut end rings
  g.fillStyle(0xa6824e, 1); g.fillEllipse(10, 41, 16, 30);
  g.lineStyle(1.5, 0x7a5e34, 0.8); g.strokeEllipse(10, 41, 10, 20); g.strokeEllipse(10, 41, 5, 10);
  // broken branch
  g.fillStyle(0x4a3420, 1); g.fillRect(70, 8, 8, 22);
  gen('l7_fallentree', 130, 70);

  // Key fragment (glint shard) 40×40
  g.clear();
  g.fillStyle(0xf5c84a, 1); g.fillTriangle(6, 30, 20, 6, 34, 30); g.fillRect(12, 24, 16, 12);
  g.fillStyle(0xfde47a, 0.8); g.fillTriangle(10, 28, 20, 12, 26, 28);
  g.lineStyle(2, 0xc89020, 1); g.strokeTriangle(6, 30, 20, 6, 34, 30);
  gen('l7_keyfrag', 40, 40);

  // Assembled jeep key (gold) 90×46
  g.clear();
  g.fillStyle(0xf5c84a, 1);
  g.fillCircle(20, 23, 16);                 // bow
  g.fillStyle(0x1a1208, 1); g.fillCircle(20, 23, 7);
  g.fillStyle(0xf5c84a, 1); g.fillRect(34, 19, 46, 8); // shaft
  g.fillRect(66, 19, 6, 14); g.fillRect(74, 19, 5, 11); // teeth
  g.fillStyle(0xfde47a, 0.7); g.fillRect(34, 19, 46, 3);
  g.lineStyle(2, 0xc89020, 1); g.strokeCircle(20, 23, 16);
  gen('l7_key', 90, 46);

  // Fuse box (wall panel) 90×110
  g.clear();
  g.fillStyle(0x3a3a40, 1); g.fillRoundedRect(4, 4, 82, 102, 6);
  g.fillStyle(0x55555c, 1); g.fillRoundedRect(10, 10, 70, 90, 4);
  g.lineStyle(2, 0x222228, 1); g.strokeRoundedRect(10, 10, 70, 90, 4);
  // breaker switches
  for (let i = 0; i < 4; i++) { g.fillStyle(0x2a2a30, 1); g.fillRect(18 + i * 16, 22, 10, 24); g.fillStyle(0xcc4422, 1); g.fillRect(18 + i * 16, 22, 10, 10); }
  g.fillStyle(0xffcc33, 1); g.fillCircle(45, 78, 8); // warning
  g.fillStyle(0x000000, 1); g.fillRect(43, 72, 4, 9); g.fillRect(43, 83, 4, 3);
  gen('l7_fusebox', 90, 110);

  // ══════════════════════════════════════════════════════════════════════════
  // SHARED — JEEP (side view + rear/driving view)
  // ══════════════════════════════════════════════════════════════════════════
  // Side-view jeep 200×120
  g.clear();
  g.fillStyle(0x000000, 0.22); g.fillEllipse(100, 112, 180, 16);
  // body
  g.fillStyle(0x556b2f, 1); g.fillRoundedRect(14, 52, 172, 42, 8);
  g.fillStyle(0x4a5e28, 1); g.fillRect(40, 30, 110, 30); // cabin
  g.fillStyle(0x3a4a20, 1); g.fillRoundedRect(40, 28, 110, 8, 3);
  // windows
  g.fillStyle(0x9fd0e6, 0.85); g.fillRect(48, 34, 44, 22); g.fillRect(100, 34, 44, 22);
  g.fillStyle(0xffffff, 0.3); g.fillRect(50, 36, 16, 8);
  // wheel arches + tyres
  g.fillStyle(0x1a1a1a, 1); g.fillCircle(54, 94, 24); g.fillCircle(150, 94, 24);
  g.fillStyle(0x444444, 1); g.fillCircle(54, 94, 13); g.fillCircle(150, 94, 13);
  g.fillStyle(0xbbbbbb, 1); g.fillCircle(54, 94, 5); g.fillCircle(150, 94, 5);
  // bumper + lights
  g.fillStyle(0x3a3a3a, 1); g.fillRect(180, 70, 10, 18);
  g.fillStyle(0xffe98a, 1); g.fillCircle(184, 64, 6);
  g.fillStyle(0xff5533, 0.9); g.fillRect(14, 64, 6, 10);
  // roof rack
  g.fillStyle(0x2e2e2e, 1); g.fillRect(48, 24, 96, 5);
  // detail trim
  g.fillStyle(0x6a8038, 0.5); g.fillRect(16, 70, 168, 4);
  gen('l7_jeep_side', 200, 120);

  // Rear/driving-view jeep (player car for Stage 4) 130×120
  g.clear();
  g.fillStyle(0x000000, 0.28); g.fillEllipse(65, 114, 110, 14);
  g.fillStyle(0x556b2f, 1); g.fillRoundedRect(14, 40, 102, 70, 12);
  g.fillStyle(0x4a5e28, 1); g.fillRoundedRect(24, 18, 82, 34, 10); // cabin
  g.fillStyle(0x1a2a30, 0.9); g.fillRoundedRect(30, 22, 70, 24, 6); // rear window
  g.fillStyle(0x3a4a20, 1); g.fillRect(14, 58, 102, 10);            // trim
  // tyres
  g.fillStyle(0x141414, 1); g.fillRoundedRect(6, 70, 20, 38, 5); g.fillRoundedRect(104, 70, 20, 38, 5);
  // tail lights
  g.fillStyle(0xff3322, 1); g.fillRoundedRect(22, 92, 26, 12, 3); g.fillRoundedRect(82, 92, 26, 12, 3);
  g.fillStyle(0xff8877, 0.7); g.fillRect(26, 94, 10, 4); g.fillRect(86, 94, 10, 4);
  // plate
  g.fillStyle(0xe8e8d8, 1); g.fillRect(54, 96, 22, 9);
  // roof rack
  g.fillStyle(0x2e2e2e, 1); g.fillRect(28, 14, 74, 5);
  gen('l7_jeep_rear', 130, 120);

  // Spinning car wheel (overlay for driving stage) 40×40 — asymmetric so spin reads
  g.clear();
  g.fillStyle(0x0e0e10, 1); g.fillCircle(20, 20, 18);            // tyre
  g.fillStyle(0x1a1a1e, 1); g.fillCircle(20, 20, 15);
  g.fillStyle(0xc4c8d0, 1); g.fillCircle(20, 20, 10);            // rim
  g.lineStyle(2.5, 0x6a6e78, 1);
  for (let a = 0; a < 5; a++) { const an = a / 5 * Math.PI * 2; g.lineBetween(20, 20, 20 + Math.cos(an) * 9, 20 + Math.sin(an) * 9); }
  g.fillStyle(0x5a5e66, 1); g.fillCircle(20, 20, 4);             // hub
  g.fillStyle(0xeef0f4, 1); g.fillCircle(20, 9, 2.2);           // bright lug = rotation cue
  gen('l7_carwheel', 40, 40);

  // Dark muddy off-road spinning wheel — matched to the jeep's own tyres 48×48
  g.clear();
  g.fillStyle(0x0b0b0d, 1); g.fillCircle(24, 24, 23);                 // tyre
  for (let a = 0; a < 18; a++) { const an = a / 18 * Math.PI * 2; g.fillStyle(0x040405, 1); g.fillRect(24 + Math.cos(an) * 20 - 2.2, 24 + Math.sin(an) * 20 - 3, 4.4, 6); } // chunky tread
  g.fillStyle(0x141519, 1); g.fillCircle(24, 24, 16);                 // dark sidewall
  g.fillStyle(0x24262b, 1); g.fillCircle(24, 24, 12);                 // dark rim
  g.fillStyle(0x2d3036, 1); g.fillCircle(24, 24, 11);
  for (let a = 0; a < 5; a++) { const an = -Math.PI / 2 + a / 5 * Math.PI * 2; g.fillStyle(0x0e0f12, 1); g.fillCircle(24 + Math.cos(an) * 7, 24 + Math.sin(an) * 7, 2.6); } // 5 dark spoke holes
  g.fillStyle(0x363941, 1); g.fillCircle(24, 24, 3.4);               // hub
  g.fillStyle(0x4e515a, 0.85); g.fillCircle(24, 11, 1.8);           // subtle scuff = rotation cue
  g.fillStyle(0x4a3a22, 0.45); g.fillCircle(31, 29, 3);             // mud fleck (asymmetric)
  gen('l7_jeepwheel', 48, 48);

  // ══════════════════════════════════════════════════════════════════════════
  // STAGE 2 — GARAGE INTERIOR + repair props
  // ══════════════════════════════════════════════════════════════════════════
  g.clear();
  grad(800, 450, 0x2a2e34, 0x1a1d22);
  // back wall panels
  g.fillStyle(0x33373e, 1); g.fillRect(0, 60, 800, 250);
  g.lineStyle(1, 0x22252b, 0.6); for (let x = 0; x < 800; x += 60) g.lineBetween(x, 60, x, 310);
  // big garage roller door (right)
  g.fillStyle(0x3e4148, 1); g.fillRect(500, 70, 270, 230);
  g.lineStyle(2, 0x2a2d33, 0.7); for (let y = 80; y < 300; y += 26) g.lineBetween(502, y, 768, y);
  g.lineStyle(3, 0x55585f, 0.8); g.strokeRect(500, 70, 270, 230);
  // pegboard with tools (left)
  g.fillStyle(0x6a5028, 1); g.fillRect(20, 80, 200, 150);
  for (let hx = 30; hx < 218; hx += 16) for (let hy = 90; hy < 226; hy += 16) { g.fillStyle(0x4a3618, 0.6); g.fillCircle(hx, hy, 1.8); }
  // hanging tools silhouettes
  g.fillStyle(0x555, 1); g.fillRect(50, 92, 5, 40); g.fillRect(40, 90, 26, 8);     // hammer
  g.fillStyle(0x666, 1); g.fillEllipse(110, 100, 16, 12); g.fillRect(107, 100, 6, 36); g.fillEllipse(110, 136, 16, 12); // wrench
  g.fillStyle(0xcc3322, 1); g.fillRect(170, 92, 7, 22); g.fillStyle(0x888, 1); g.fillRect(172, 114, 3, 22); // screwdriver
  // workbench
  g.fillStyle(0x7a4a1e, 1); g.fillRect(20, 250, 220, 16); g.fillStyle(0x5a3414, 1); g.fillRect(20, 266, 220, 44);
  g.fillStyle(0x4a2c10, 1); g.fillRect(28, 266, 10, 44); g.fillRect(220, 266, 10, 44);
  // red tool chest
  g.fillStyle(0xc0392b, 1); g.fillRoundedRect(300, 220, 130, 90, 6);
  g.fillStyle(0xa42f22, 1); for (let i = 0; i < 3; i++) g.fillRect(308, 232 + i * 24, 114, 18);
  g.fillStyle(0xddd, 1); for (let i = 0; i < 3; i++) g.fillRect(355, 238 + i * 24, 20, 5);
  // hanging work lamp
  g.fillStyle(0x222, 1); g.fillRect(395, 0, 4, 40); g.fillStyle(0xdddddd, 1); g.fillTriangle(380, 40, 414, 40, 397, 60);
  g.fillStyle(0xfff4cc, 0.4); g.fillEllipse(397, 90, 200, 130);
  // oil stains on floor
  g.fillStyle(0x14161a, 1); g.fillRect(0, 308, 800, 142);
  g.fillStyle(0x000000, 0.4); g.fillEllipse(250, 360, 120, 24); g.fillEllipse(560, 400, 160, 30);
  g.fillStyle(0x3a3d44, 0.5); g.fillRect(0, 308, 800, 4);
  gen('l7_s2_bg', 800, 450);

  // Car jack 70×70
  g.clear();
  g.fillStyle(0x444a52, 1); g.fillRect(8, 50, 54, 12);                 // base
  g.fillStyle(0xcc8822, 1); g.fillTriangle(14, 50, 35, 20, 56, 50);   // scissor body
  g.fillStyle(0x222, 1); g.fillTriangle(20, 50, 35, 26, 50, 50);
  g.fillStyle(0x666, 1); g.fillRect(30, 14, 10, 10);                  // top saddle
  g.lineStyle(3, 0x999, 1); g.lineBetween(56, 50, 66, 44);           // crank
  gen('l7_jack', 70, 70);

  // Wrench 80×80
  g.clear();
  g.fillStyle(0x9aa0a8, 1); g.fillRect(34, 18, 9, 50);
  g.fillStyle(0xb8bec6, 1); g.fillCircle(38, 16, 13); g.fillCircle(38, 70, 13);
  g.fillStyle(0x14161a, 1); g.fillCircle(38, 16, 6); g.fillCircle(38, 70, 6);
  g.fillStyle(0xffffff, 0.3); g.fillRect(34, 24, 4, 36);
  gen('l7_wrench', 80, 80);

  // Patch kit (box) 70×56
  g.clear();
  g.fillStyle(0x2a6a3a, 1); g.fillRoundedRect(6, 12, 58, 40, 5);
  g.fillStyle(0x37985a, 1); g.fillRect(6, 12, 58, 12);
  g.fillStyle(0xffffff, 1); g.fillRect(28, 28, 14, 4); g.fillRect(33, 23, 4, 14); // plus
  g.lineStyle(2, 0x1c4a28, 1); g.strokeRoundedRect(6, 12, 58, 40, 5);
  gen('l7_patchkit', 70, 56);

  // Tire (good) 96×96
  g.clear();
  g.fillStyle(0x1a1a1a, 1); g.fillCircle(48, 48, 44);
  g.fillStyle(0x000000, 1); for (let a = 0; a < 24; a++) { const an = a / 24 * Math.PI * 2; g.fillRect(48 + Math.cos(an) * 40 - 2, 48 + Math.sin(an) * 40 - 4, 4, 8); }
  g.fillStyle(0x3a3a3a, 1); g.fillCircle(48, 48, 28);
  g.fillStyle(0x888, 1); g.fillCircle(48, 48, 16);
  g.fillStyle(0x555, 1); g.fillCircle(48, 48, 6);
  for (let a = 0; a < 5; a++) { const an = a / 5 * Math.PI * 2; g.fillStyle(0x333, 1); g.fillCircle(48 + Math.cos(an) * 11, 48 + Math.sin(an) * 11, 2.5); }
  gen('l7_tire', 96, 96);

  // Tire (flat / punctured) 100×96
  g.clear();
  g.fillStyle(0x1a1a1a, 1); g.fillEllipse(50, 56, 92, 70);  // squashed
  g.fillStyle(0x3a3a3a, 1); g.fillEllipse(50, 54, 56, 40);
  g.fillStyle(0x888, 1); g.fillEllipse(50, 54, 30, 22);
  g.fillStyle(0xcc3322, 1); g.fillCircle(74, 40, 4); // puncture hole marker
  gen('l7_tire_flat', 100, 96);

  // Lug nut 26×26
  g.clear();
  {
    const cx = 13, cy = 13, R = 11, pts = [];
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; pts.push({ x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R }); }
    g.fillStyle(0x9aa0a8, 1); g.fillPoints(pts, true);
    g.lineStyle(1.5, 0x555, 1); g.strokePoints(pts, true);
    g.fillStyle(0x666, 1); g.fillCircle(cx, cy, 4);
  }
  gen('l7_lugnut', 26, 26);

  // Patch (rubber circle) 40×40
  g.clear();
  g.fillStyle(0x222, 1); g.fillCircle(20, 20, 16);
  g.fillStyle(0x3a3a3a, 1); g.fillCircle(20, 20, 11);
  g.lineStyle(1.5, 0x111, 1); g.strokeCircle(20, 20, 16);
  gen('l7_patch', 40, 40);

  // ══════════════════════════════════════════════════════════════════════════
  // STAGE 3 — HIGHWAY GAS STATION (night, neon, rain reflections)
  // ══════════════════════════════════════════════════════════════════════════
  g.clear();
  grad(800, 450, 0x0c1020, 0x161b2e);
  // distant mountains
  g.fillStyle(0x0a0e18, 1); g.fillTriangle(0, 300, 180, 150, 360, 300); g.fillTriangle(260, 300, 460, 130, 660, 300); g.fillTriangle(520, 300, 720, 160, 920, 300);
  // misty rain band
  g.fillStyle(0x2a3450, 0.2); g.fillRect(0, 180, 800, 130);
  // stars
  for (let i = 0; i < 40; i++) { g.fillStyle(0xbcd0ff, Math.random() * 0.4); g.fillCircle(Math.random() * 800, Math.random() * 150, Math.random()); }
  gen('l7_s3_sky', 800, 450);

  // Gas station building w/ neon canopy 340×220
  g.clear();
  // canopy supports
  g.fillStyle(0x2a2e36, 1); g.fillRect(40, 70, 14, 150); g.fillRect(286, 70, 14, 150);
  // canopy roof
  g.fillStyle(0x3a3f4a, 1); g.fillRect(20, 40, 300, 34);
  g.fillStyle(0xff3366, 1); g.fillRect(20, 60, 300, 6);  // neon strip (pink)
  g.fillStyle(0xff86a8, 0.6); g.fillRect(20, 58, 300, 3);
  // "GAS" sign
  g.fillStyle(0x101622, 1); g.fillRoundedRect(110, 8, 120, 30, 5);
  g.fillStyle(0x33e0ff, 1);
  g.fillRect(126, 16, 4, 14); g.fillRect(126, 16, 14, 4); g.fillRect(126, 23, 12, 4); // G-ish
  g.fillStyle(0x33e0ff, 1); g.fillRect(150, 16, 16, 14); g.fillStyle(0x101622,1); g.fillRect(154,20,8,6);
  g.fillStyle(0x33e0ff, 1); g.fillRect(176, 16, 14, 4); g.fillRect(176, 23, 14, 4);
  g.fillStyle(0x66ecff, 0.5); g.fillRoundedRect(110, 8, 120, 6, 3);
  // station shop
  g.fillStyle(0x242830, 1); g.fillRect(60, 120, 220, 100);
  g.fillStyle(0x3a6a8a, 0.6); g.fillRect(74, 134, 80, 50); g.fillRect(186, 134, 80, 50); // lit windows
  g.fillStyle(0xffd870, 0.5); g.fillRect(150, 150, 36, 70); // doorway light
  // fuel pump
  g.fillStyle(0xcc3322, 1); g.fillRoundedRect(0, 150, 34, 70, 4);
  g.fillStyle(0x111, 1); g.fillRect(6, 158, 22, 20);
  g.fillStyle(0x33ff66, 0.9); g.fillRect(9, 161, 16, 6);
  g.lineStyle(3, 0x222, 1); g.beginPath(); g.arc(34, 180, 16, -Math.PI / 2, Math.PI / 2, false); g.strokePath(); // hose
  // ground reflection glow
  g.fillStyle(0xff3366, 0.10); g.fillEllipse(170, 222, 320, 24);
  gen('l7_s3_station', 340, 224);

  // Wet road ground tile 128×80
  g.clear();
  grad(128, 80, 0x20242c, 0x101218);
  // neon reflections shimmering
  g.fillStyle(0xff3366, 0.07); g.fillRect(20, 10, 16, 70);
  g.fillStyle(0x33e0ff, 0.06); g.fillRect(70, 14, 14, 66);
  g.fillStyle(0x4a5a6a, 0.18); g.fillRect(0, 0, 128, 8);
  gen('l7_s3_ground', 128, 80);

  // Fuel barrel (red) 60×80
  g.clear();
  g.fillStyle(0x000000, 0.2); g.fillEllipse(30, 76, 52, 8);
  g.fillStyle(0xc0392b, 1); g.fillRoundedRect(6, 12, 48, 62, 6);
  g.fillStyle(0xe05a44, 0.5); g.fillRect(10, 14, 8, 58);
  g.fillStyle(0xa42f22, 1); g.fillEllipse(30, 12, 48, 10); g.fillEllipse(30, 36, 48, 8); g.fillEllipse(30, 60, 48, 8);
  g.fillStyle(0xffcc33, 1); g.fillRect(20, 40, 20, 14); g.fillStyle(0x111, 1); g.fillRect(24, 43, 3, 8); g.fillRect(30, 43, 3, 8); // hazard
  gen('l7_barrel', 60, 80);

  // Generator 110×90
  g.clear();
  g.fillStyle(0x000000, 0.2); g.fillEllipse(55, 86, 96, 10);
  g.fillStyle(0xd4541a, 1); g.fillRoundedRect(8, 26, 94, 56, 6);  // body
  g.fillStyle(0x2a2a2a, 1); g.fillRect(8, 18, 94, 12);            // top frame
  g.fillStyle(0x3a3a3a, 1); g.fillRoundedRect(60, 34, 34, 30, 4); // engine block
  g.fillStyle(0x888, 1); for (let i = 0; i < 4; i++) g.fillRect(64, 38 + i * 6, 26, 3);
  g.fillStyle(0x111, 1); g.fillCircle(28, 56, 16); g.fillStyle(0x555, 1); g.fillCircle(28, 56, 8); // wheel/pulley
  g.lineStyle(3, 0x999, 1); g.lineBetween(40, 30, 56, 22); // pull cord
  g.fillStyle(0xcc2222, 1); g.fillCircle(58, 20, 4);       // cord handle
  gen('l7_generator', 110, 90);

  // Pipe segment straight (tile) 64×64
  g.clear();
  g.fillStyle(0x6a7078, 1); g.fillRect(0, 22, 64, 20);
  g.fillStyle(0x9aa0a8, 0.6); g.fillRect(0, 24, 64, 5);
  g.fillStyle(0x4a5058, 1); g.fillRect(0, 38, 64, 4);
  g.lineStyle(2, 0x3a4048, 1); g.strokeRect(0, 22, 64, 20);
  gen('l7_pipe_straight', 64, 64);

  // Pipe elbow 64×64
  g.clear();
  g.fillStyle(0x6a7078, 1); g.fillRect(22, 22, 20, 42); g.fillRect(22, 22, 42, 20);
  g.fillStyle(0x9aa0a8, 0.6); g.fillRect(24, 24, 5, 40); g.fillRect(24, 24, 40, 5);
  g.lineStyle(2, 0x3a4048, 1); g.strokeRect(22, 22, 20, 42); g.strokeRect(22, 22, 42, 20);
  gen('l7_pipe_elbow', 64, 64);

  // Fuel can (jerry can, green) 64×72
  g.clear();
  g.fillStyle(0x000000, 0.2); g.fillEllipse(32, 68, 52, 8);
  g.fillStyle(0x2a7a3a, 1); g.fillRoundedRect(8, 16, 48, 50, 5);
  g.fillStyle(0x37985a, 0.5); g.fillRect(12, 18, 8, 46);
  g.fillStyle(0x1c5a28, 1); g.fillRect(8, 38, 48, 4);
  g.fillStyle(0x222, 1); g.fillRect(20, 8, 24, 10);  // spout cap
  g.lineStyle(3, 0x1c5a28, 1); g.beginPath(); g.arc(44, 14, 10, -Math.PI, 0, false); g.strokePath(); // handle
  gen('l7_fuelcan', 64, 72);

  // Roadblock barrier (striped) 90×54
  g.clear();
  g.fillStyle(0x000000, 0.2); g.fillEllipse(45, 50, 80, 8);
  g.fillStyle(0xddddd0, 1); g.fillRect(6, 14, 78, 16);
  for (let i = 0; i < 5; i++) { g.fillStyle(i % 2 ? 0xddddd0 : 0xd4541a, 1); g.fillRect(6 + i * 16, 14, 16, 16); }
  g.fillStyle(0x555, 1); g.fillRect(14, 30, 6, 22); g.fillRect(70, 30, 6, 22);
  g.fillStyle(0x333, 1); g.fillRect(8, 48, 18, 6); g.fillRect(64, 48, 18, 6);
  gen('l7_barrier', 90, 54);

  // ══════════════════════════════════════════════════════════════════════════
  // STAGE 4 — RAINY CITY HIGHWAY (driving) + hospital
  // ══════════════════════════════════════════════════════════════════════════
  // City skyline backdrop
  g.clear();
  grad(800, 450, 0x10172a, 0x1c2540);
  for (let i = 0; i < 26; i++) {
    const bw = 24 + Math.random() * 50, bx = i * 32 - 10, bh = 80 + Math.random() * 180;
    g.fillStyle(Phaser.Display.Color.GetColor(20 + Math.random() * 12, 26 + Math.random() * 14, 44 + Math.random() * 16), 1);
    g.fillRect(bx, 300 - bh, bw, bh);
    // lit windows
    for (let wy = 300 - bh + 8; wy < 296; wy += 14) for (let wx = bx + 5; wx < bx + bw - 5; wx += 11) { if (Math.random() > 0.45) { g.fillStyle(0xffd66a, 0.5 + Math.random() * 0.4); g.fillRect(wx, wy, 5, 7); } }
  }
  // rain haze
  g.fillStyle(0x2a3552, 0.22); g.fillRect(0, 0, 800, 450);
  gen('l7_s4_sky', 800, 450);

  // Perspective road (top-narrow to bottom-wide) 800×320
  g.clear();
  g.fillStyle(0x16181e, 1); g.fillRect(0, 0, 800, 320);
  // road trapezoid
  g.fillStyle(0x2a2d34, 1); g.fillPoints([{ x: 300, y: 0 }, { x: 500, y: 0 }, { x: 780, y: 320 }, { x: 20, y: 320 }], true);
  // lane dashes (center)
  g.fillStyle(0xe8e0c0, 0.85);
  for (let i = 0; i < 9; i++) { const t = i / 9; const y = t * 320; const w = 3 + t * 10; g.fillRect(400 - w / 2, y, w, 14 + t * 16); }
  // edge lines
  g.lineStyle(3, 0xd8d0b0, 0.6); g.beginPath(); g.moveTo(300, 0); g.lineTo(20, 320); g.strokePath();
  g.beginPath(); g.moveTo(500, 0); g.lineTo(780, 320); g.strokePath();
  // wet reflections
  g.fillStyle(0xffd66a, 0.05); g.fillRect(360, 0, 80, 320);
  gen('l7_s4_road', 800, 320);

  // Oncoming traffic car (top-down-ish, red) 70×100
  g.clear();
  g.fillStyle(0x000000, 0.3); g.fillEllipse(35, 96, 60, 10);
  g.fillStyle(0xcc2a2a, 1); g.fillRoundedRect(8, 10, 54, 84, 12);
  g.fillStyle(0xe04444, 0.5); g.fillRect(12, 14, 8, 76);
  g.fillStyle(0x1a2a30, 0.9); g.fillRoundedRect(14, 22, 42, 22, 6); g.fillRoundedRect(14, 56, 42, 22, 6); // windows
  g.fillStyle(0xfff3aa, 1); g.fillRoundedRect(12, 6, 14, 8, 3); g.fillRoundedRect(44, 6, 14, 8, 3);       // headlights (facing player)
  g.fillStyle(0x111, 1); g.fillRect(4, 24, 6, 18); g.fillRect(60, 24, 6, 18); g.fillRect(4, 60, 6, 18); g.fillRect(60, 60, 6, 18);
  gen('l7_car_red', 70, 100);

  // Traffic cone (driving) 44×52
  g.clear();
  g.fillStyle(0x000000, 0.18); g.fillEllipse(22, 48, 38, 8);
  g.fillStyle(0xe8621f, 1); g.fillTriangle(22, 4, 6, 44, 38, 44);
  g.fillStyle(0xffffff, 1); g.fillTriangle(22, 16, 15, 30, 29, 30);
  g.fillStyle(0xe8621f, 1); g.fillTriangle(22, 20, 18, 30, 26, 30);
  g.fillStyle(0xd4541a, 1); g.fillRoundedRect(4, 44, 36, 7, 2);
  gen('l7_cone2', 44, 52);

  // Hospital exterior (big, cinematic, "ANIMAL HOSPITAL") 460×260
  g.clear();
  grad(460, 260, 0x101830, 0x1a2440);
  // building
  g.fillStyle(0xe8ecf0, 1); g.fillRect(40, 70, 380, 180);
  g.fillStyle(0xd0d6dc, 1); g.fillRect(40, 70, 380, 14);
  // many lit windows
  for (let ry = 96; ry < 230; ry += 30) for (let rx = 60; rx < 400; rx += 38) { g.fillStyle(0xfff0b0, 0.85); g.fillRect(rx, ry, 26, 20); g.lineStyle(1, 0x9aa6b0, 0.6); g.strokeRect(rx, ry, 26, 20); }
  // entrance canopy + glass doors
  g.fillStyle(0x2a6a4a, 1); g.fillRect(170, 180, 120, 70);
  g.fillStyle(0xbfe8d8, 0.85); g.fillRect(182, 192, 44, 58); g.fillRect(232, 192, 44, 58);
  g.fillStyle(0xfff8e0, 0.5); g.fillRect(170, 174, 120, 8);
  // red cross sign
  g.fillStyle(0xffffff, 1); g.fillRoundedRect(206, 30, 48, 48, 6);
  g.fillStyle(0xd83030, 1); g.fillRect(224, 38, 12, 32); g.fillRect(214, 48, 32, 12);
  g.fillStyle(0xff5a5a, 0.5); g.fillCircle(230, 54, 26);
  // "ANIMAL HOSPITAL" plaque
  g.fillStyle(0x1a3a5a, 1); g.fillRoundedRect(120, 86, 220, 22, 5);
  g.fillStyle(0x66ddff, 1); for (let i = 0; i < 13; i++) g.fillRect(132 + i * 16, 92, 9, 10);
  // warm ground glow
  g.fillStyle(0x2a6a4a, 0.12); g.fillEllipse(230, 250, 300, 30);
  gen('l7_hospital', 460, 260);

  // ══════════════════════════════════════════════════════════════════════════
  // STAGE 5 — VET HOSPITAL ROOM + medical props + puppies + gamma
  // ══════════════════════════════════════════════════════════════════════════
  g.clear();
  grad(800, 450, 0xdfe8ee, 0xc4d2da);
  // wall trim
  g.fillStyle(0xb6c6d0, 1); g.fillRect(0, 250, 800, 6);
  // window with morning hint (left)
  g.fillStyle(0xaad4ea, 1); g.fillRoundedRect(40, 50, 150, 130, 8);
  g.fillStyle(0xcfeaf6, 0.7); g.fillRect(46, 56, 138, 50);
  g.lineStyle(4, 0xe8eef2, 1); g.strokeRoundedRect(40, 50, 150, 130, 8); g.lineBetween(115, 50, 115, 180); g.lineBetween(40, 115, 190, 115);
  // medical cabinet (right)
  g.fillStyle(0xe6ecf0, 1); g.fillRect(610, 60, 150, 190);
  g.lineStyle(2, 0xc0ccd4, 1); g.strokeRect(610, 60, 150, 190); g.lineBetween(685, 60, 685, 250);
  g.fillStyle(0xc8d4dc, 1); g.fillRect(672, 150, 8, 16); g.fillRect(690, 150, 8, 16);
  // red cross on cabinet
  g.fillStyle(0xd83030, 1); g.fillRect(728, 80, 8, 24); g.fillRect(720, 88, 24, 8);
  // monitor on wall
  g.fillStyle(0x14202a, 1); g.fillRoundedRect(250, 60, 130, 86, 6);
  g.fillStyle(0x0a2a1a, 1); g.fillRect(256, 66, 118, 74);
  g.lineStyle(2, 0x33ff88, 0.8); g.beginPath(); g.moveTo(258, 104);
  for (let x = 0; x < 118; x += 2) { let y = 104 + Math.sin(x * 0.3) * 3; const s = x % 30; if (s < 3) y -= 18; else if (s < 6) y += 10; g.lineTo(258 + x, y); }
  g.strokePath();
  // soft ceiling light glow
  g.fillStyle(0xffffff, 0.25); g.fillEllipse(400, 30, 500, 90);
  // floor
  g.fillStyle(0xeef3f6, 1); g.fillRect(0, 256, 800, 194);
  g.lineStyle(1, 0xd4dde2, 0.7); for (let x = 0; x < 800; x += 64) g.lineBetween(x, 256, x - 30, 450);
  for (let y = 290; y < 450; y += 36) g.lineBetween(0, y, 800, y);
  gen('l7_s5_bg', 800, 450);

  // Exam table 260×110
  g.clear();
  g.fillStyle(0x000000, 0.12); g.fillEllipse(130, 104, 230, 16);
  g.fillStyle(0xc8d2d8, 1); g.fillRoundedRect(10, 20, 240, 40, 10); // padded top
  g.fillStyle(0xe4ecf0, 1); g.fillRoundedRect(14, 22, 232, 18, 8);
  g.fillStyle(0x9aa6ae, 1); g.fillRect(30, 58, 12, 46); g.fillRect(218, 58, 12, 46); // legs
  g.fillStyle(0x808d96, 1); g.fillRect(26, 100, 20, 6); g.fillRect(214, 100, 20, 6);
  gen('l7_exam_table', 260, 110);

  // Puppy (cute, side-lying) 110×80 — tintable for 3 colours
  g.clear();
  g.fillStyle(0x000000, 0.12); g.fillEllipse(56, 74, 92, 12);
  // body
  g.fillStyle(0xc89858, 1); g.fillEllipse(54, 50, 84, 44);
  // head
  g.fillStyle(0xcea060, 1); g.fillCircle(26, 40, 24);
  // ears
  g.fillStyle(0xa87a40, 1); g.fillEllipse(14, 24, 16, 24); g.fillEllipse(40, 24, 14, 22);
  // muzzle
  g.fillStyle(0xe4c898, 1); g.fillEllipse(20, 48, 22, 16);
  g.fillStyle(0x2a1a10, 1); g.fillEllipse(13, 46, 7, 5);   // nose
  // eyes (closed, resting)
  g.lineStyle(2, 0x2a1a10, 1); g.beginPath(); g.arc(24, 36, 5, 0.2, Math.PI - 0.2, false); g.strokePath();
  g.beginPath(); g.arc(36, 36, 4, 0.2, Math.PI - 0.2, false); g.strokePath();
  // paws
  g.fillStyle(0xe4c898, 1); g.fillEllipse(44, 70, 16, 9); g.fillEllipse(70, 70, 16, 9);
  // tail
  g.fillStyle(0xc89858, 1); g.fillEllipse(94, 46, 20, 12);
  gen('l7_puppy', 110, 80);

  // Gamma — mother dog (larger, protective) 170×120
  g.clear();
  g.fillStyle(0x000000, 0.15); g.fillEllipse(86, 112, 150, 16);
  g.fillStyle(0x8a6634, 1); g.fillEllipse(90, 70, 140, 64);   // body
  g.fillStyle(0x96703a, 1); g.fillCircle(40, 56, 34);          // head
  g.fillStyle(0x6e4e26, 1); g.fillEllipse(20, 30, 22, 34); g.fillEllipse(60, 30, 20, 32); // ears
  g.fillStyle(0xb89058, 1); g.fillEllipse(30, 66, 30, 22);    // muzzle
  g.fillStyle(0x1a0e06, 1); g.fillEllipse(18, 62, 10, 7);      // nose
  g.fillStyle(0x2a1a10, 1); g.fillCircle(34, 50, 5); g.fillCircle(50, 50, 5); // eyes
  g.fillStyle(0xffffff, 0.7); g.fillCircle(35, 48, 2); g.fillCircle(51, 48, 2);
  g.fillStyle(0xb89058, 1); g.fillEllipse(60, 102, 22, 14); g.fillEllipse(110, 102, 22, 14); // paws
  g.fillStyle(0x8a6634, 1); g.fillEllipse(158, 64, 28, 16);   // tail
  gen('l7_gamma', 170, 120);

  // Thermometer 80×26
  g.clear();
  g.fillStyle(0xe8edf0, 1); g.fillRoundedRect(2, 8, 64, 10, 5);
  g.fillStyle(0xcc2a2a, 1); g.fillRect(6, 11, 34, 4);
  g.fillStyle(0xcc2a2a, 1); g.fillCircle(68, 13, 9);
  g.lineStyle(1, 0x9aa6ae, 1); g.strokeRoundedRect(2, 8, 64, 10, 5);
  gen('l7_thermometer', 80, 26);

  // Medicine bottle + dropper 56×72
  g.clear();
  g.fillStyle(0x8a5a2a, 0.85); g.fillRoundedRect(12, 26, 32, 40, 4); // amber bottle
  g.fillStyle(0xb47a3a, 0.5); g.fillRect(16, 28, 6, 36);
  g.fillStyle(0xffffff, 1); g.fillRect(16, 40, 24, 16);             // label
  g.fillStyle(0xcc2a2a, 1); g.fillRect(26, 44, 4, 8); g.fillRect(22, 46, 12, 4);
  g.fillStyle(0x444, 1); g.fillRect(20, 18, 16, 10);               // cap
  gen('l7_medicine', 56, 72);

  // Syringe 90×30
  g.clear();
  g.fillStyle(0xdfe8ee, 0.9); g.fillRoundedRect(14, 10, 50, 12, 3); // barrel
  g.fillStyle(0x9fd0e6, 0.7); g.fillRect(18, 12, 36, 8);            // liquid
  g.lineStyle(1, 0x9aa6ae, 1); g.strokeRoundedRect(14, 10, 50, 12, 3);
  g.fillStyle(0xcccccc, 1); g.fillRect(64, 14, 16, 4);             // needle
  g.fillStyle(0x888, 1); g.fillRect(6, 8, 8, 16);                  // plunger
  for (let i = 0; i < 4; i++) { g.fillStyle(0x9aa6ae, 1); g.fillRect(24 + i * 9, 8, 1, 4); }
  gen('l7_syringe', 90, 30);

  // Bandage roll 64×40
  g.clear();
  g.fillStyle(0xf0e6d2, 1); g.fillRoundedRect(6, 6, 52, 28, 8);
  g.fillStyle(0xe4d6ba, 1); g.fillRect(6, 6, 52, 6);
  g.lineStyle(1.5, 0xd6c4a0, 0.8); for (let x = 12; x < 58; x += 8) g.lineBetween(x, 8, x, 32);
  g.fillStyle(0xffffff, 1); g.fillRect(40, 30, 22, 10);  // loose end
  gen('l7_bandage', 64, 40);

  // Heart pulse icon 40×40
  g.clear();
  g.fillStyle(0xff5577, 1);
  g.fillCircle(14, 15, 9); g.fillCircle(26, 15, 9); g.fillTriangle(5, 18, 35, 18, 20, 36);
  g.fillStyle(0xff90a8, 0.6); g.fillCircle(12, 12, 3);
  gen('l7_heart', 40, 40);

  g.clear();
  gen('l7_ready', 4, 4);
  g.destroy();
}
