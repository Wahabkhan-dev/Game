import Phaser from 'phaser';

export function generateL5Assets(scene) {
  // Guard — skip if already generated this session (key never loaded as a real image)
  if (scene.textures.exists('l5_doghouse')) return;
  const g = scene.make.graphics({ add: false });
  // Only generate a texture if a real image wasn't already loaded under that key
  const gen = (k, w, h) => { if (!scene.textures.exists(k)) g.generateTexture(k, w, h); };

  // ══════════════════════════════════════════════════════════════════════════════
  // GARAGE INTERIOR BACKGROUND (490 × 320)
  // ══════════════════════════════════════════════════════════════════════════════
  g.clear();
  // Ceiling
  g.fillStyle(0xe0d8d0, 1); g.fillRect(0, 0, 490, 28);
  g.fillStyle(0xc8c0b8, 0.6); g.fillRect(0, 24, 490, 6);
  // Back wall — warm beige/cream
  g.fillStyle(0xd8d0c8, 1); g.fillRect(0, 28, 490, 172);
  // Wall depth shadows at edges
  g.fillStyle(0x000000, 0.09); g.fillRect(0, 28, 28, 172);
  g.fillStyle(0x000000, 0.09); g.fillRect(462, 28, 28, 172);

  // ── GARAGE DOOR (back wall center) ─────────────────────────────────────────
  g.fillStyle(0xc4bcb4, 1); g.fillRect(114, 32, 272, 162);
  // Panel sections (4 horizontal panels)
  const panelH = 40;
  for (let pi = 0; pi < 4; pi++) {
    const py = 32 + pi * panelH;
    g.fillStyle(pi % 2 === 0 ? 0xbcb4ac : 0xc0b8b0, 1);
    g.fillRect(116, py + 1, 268, panelH - 2);
    // Inset shadow per panel
    g.fillStyle(0x000000, 0.06); g.fillRect(116, py + 1, 268, 4);
    g.fillStyle(0xffffff, 0.06); g.fillRect(116, py + panelH - 5, 268, 4);
  }
  // Door vertical centre split
  g.lineStyle(1.5, 0xa8a098, 0.5); g.lineBetween(250, 32, 250, 194);
  // Door horizontal panel lines
  g.lineStyle(2, 0xa0988c, 0.55);
  for (let pl = 1; pl < 4; pl++) g.lineBetween(116, 32 + pl * panelH, 384, 32 + pl * panelH);
  // Door frame
  g.lineStyle(4, 0x9c948c, 0.8); g.strokeRect(114, 32, 272, 162);
  // Track rails
  g.fillStyle(0x888078, 0.8); g.fillRect(112, 32, 5, 162); g.fillRect(383, 32, 5, 162);
  // Door handle
  g.fillStyle(0x7a726c, 1); g.fillRoundedRect(237, 120, 26, 8, 3);
  g.fillStyle(0x9a928c, 0.5); g.fillRect(238, 120, 24, 3);

  // Light leaking from under garage door
  g.fillStyle(0xfff8cc, 0.18); g.fillRect(116, 191, 268, 6);
  g.fillStyle(0xfff8cc, 0.08); g.fillRect(116, 197, 268, 4);

  // ── LEFT PEGBOARD WALL ──────────────────────────────────────────────────────
  g.fillStyle(0xc8a870, 1); g.fillRect(0, 28, 108, 172);
  g.fillStyle(0xb89858, 0.35); g.fillRect(0, 28, 108, 172);
  // Pegboard holes grid
  for (let hx = 8; hx < 100; hx += 13) {
    for (let hy = 38; hy < 192; hy += 13) {
      g.fillStyle(0x8a6838, 0.55); g.fillCircle(hx, hy, 1.8);
    }
  }
  // Pegboard border
  g.lineStyle(2, 0xa88040, 0.5); g.strokeRect(0, 28, 108, 172);
  // ── Tool silhouettes on pegboard ──
  // Hammer
  g.fillStyle(0x444440, 1); g.fillRect(14, 46, 5, 36);
  g.fillStyle(0x666660, 1); g.fillRect(8, 44, 18, 10); g.fillRect(9, 43, 16, 3);
  g.fillStyle(0x888880, 0.4); g.fillRect(9, 44, 6, 4);
  // Wrench
  g.fillStyle(0x555550, 1); g.fillRect(42, 50, 5, 30);
  g.fillStyle(0x666660, 1); g.fillEllipse(44, 50, 16, 11); g.fillEllipse(44, 80, 16, 11);
  g.fillStyle(0x888880, 0.4); g.fillCircle(41, 50, 4);
  // Screwdriver
  g.fillStyle(0xcc3322, 1); g.fillRoundedRect(70, 46, 7, 24, 2);
  g.fillStyle(0x7a7870, 1); g.fillRect(72, 70, 4, 20);
  g.fillStyle(0x555550, 1); g.fillRect(73, 88, 2, 4);
  // Hand saw
  g.fillStyle(0x888870, 1); g.fillRect(14, 100, 60, 5);
  for (let st = 14; st < 72; st += 5) {
    g.fillStyle(0x666860, 1); g.fillTriangle(st, 100, st+2, 95, st+4, 100);
  }
  g.fillStyle(0xcc8844, 1); g.fillRoundedRect(62, 98, 18, 10, 3);
  // Paint brush
  g.fillStyle(0xcc6622, 1); g.fillRect(80, 50, 6, 30);
  g.fillStyle(0x888860, 1); g.fillRect(81, 80, 4, 12);
  g.fillStyle(0x222210, 1); g.fillRect(80, 92, 6, 8);

  // ── WORKBENCH — RIGHT SIDE ──────────────────────────────────────────────────
  g.fillStyle(0xb87828, 1); g.fillRect(388, 130, 102, 14);
  g.fillStyle(0xd49840, 0.8); g.fillRect(388, 130, 102, 4);
  g.fillStyle(0x9a6018, 1); g.fillRect(388, 144, 102, 56);
  g.fillStyle(0x8a5010, 0.5); g.fillRect(390, 146, 98, 4);
  // Workbench legs
  g.fillStyle(0x8a5010, 0.8); g.fillRect(390, 150, 10, 50); g.fillRect(478, 150, 10, 50);
  g.fillStyle(0xa06820, 0.4); g.fillRect(391, 150, 4, 50);
  // Items on bench: paint can
  g.fillStyle(0x3377cc, 1); g.fillRect(402, 108, 20, 24);
  g.fillStyle(0x5599ee, 1); g.fillEllipse(412, 108, 20, 7);
  g.lineStyle(1, 0x2255aa, 0.7); g.strokeEllipse(412, 108, 20, 7);
  // Small hammer on bench
  g.fillStyle(0x666660, 1); g.fillRect(432, 116, 4, 14);
  g.fillStyle(0x888880, 1); g.fillRect(428, 114, 12, 6);
  // Rag/cloth
  g.fillStyle(0x4488cc, 0.6); g.fillRoundedRect(448, 128, 20, 4, 2);

  // ── OVERHEAD STRIP LIGHT ────────────────────────────────────────────────────
  g.fillStyle(0xe0e8e8, 1); g.fillRect(155, 0, 180, 10);
  g.fillStyle(0xccdddd, 0.8); g.fillRect(157, 2, 176, 6);
  // Light diffuser glow
  g.fillStyle(0xfff8e8, 0.22); g.fillEllipse(245, 18, 360, 90);
  g.fillStyle(0xfff4e0, 0.12); g.fillEllipse(245, 40, 480, 160);

  // ── FLOOR — CONCRETE ────────────────────────────────────────────────────────
  g.fillStyle(0xb4aca4, 1); g.fillRect(0, 200, 490, 120);
  // Floor highlight strip (light from door)
  g.fillStyle(0xffffff, 0.06); g.fillRect(0, 200, 490, 16);
  // Concrete lines (horizontal grout marks)
  g.lineStyle(1, 0xa4a09a, 0.4);
  for (let fy = 218; fy < 320; fy += 22) g.lineBetween(0, fy, 490, fy);
  // Vertical joints (staggered)
  g.lineStyle(1, 0xa4a09a, 0.25);
  for (let fxi = 0; fxi < 6; fxi++) {
    const fx = 40 + fxi * 80 + (fxi % 2) * 40;
    g.lineBetween(fx, 200 + (fxi % 2) * 22, fx, 320);
  }
  // Floor cracks
  g.lineStyle(1.2, 0x8c8880, 0.3);
  g.lineBetween(55, 224, 88, 268); g.lineBetween(330, 232, 380, 290); g.lineBetween(195, 250, 240, 318);
  // Dust/grime patches
  g.fillStyle(0x000000, 0.05); g.fillEllipse(120, 295, 100, 20); g.fillEllipse(360, 285, 80, 18);

  // ── FLOOR PROPS ─────────────────────────────────────────────────────────────
  // Paint cans cluster (left corner)
  g.fillStyle(0xee3322, 1); g.fillRect(6, 260, 22, 34);
  g.fillStyle(0xff5544, 1); g.fillEllipse(17, 260, 22, 7);
  g.lineStyle(1, 0xcc2211, 0.6); g.strokeEllipse(17, 260, 22, 7);
  g.fillStyle(0x3366dd, 1); g.fillRect(30, 266, 20, 28);
  g.fillStyle(0x5588ff, 1); g.fillEllipse(40, 266, 20, 7);
  g.lineStyle(1, 0x2244bb, 0.6); g.strokeEllipse(40, 266, 20, 7);
  // Paint brush on floor
  g.fillStyle(0xbb7733, 1); g.fillRoundedRect(22, 252, 4, 18, 1);
  g.fillStyle(0x666640, 1); g.fillRect(22, 268, 4, 8);

  // Wooden crate (right corner)
  g.fillStyle(0xc08830, 1); g.fillRect(432, 252, 48, 44);
  g.fillStyle(0xd4a040, 0.5); g.fillRect(432, 252, 48, 6);
  g.lineStyle(2, 0xa07020, 0.7);
  g.lineBetween(432, 274, 480, 274);
  g.lineBetween(456, 252, 456, 296);
  g.lineStyle(1, 0x886010, 0.4);
  g.lineBetween(432, 263, 456, 263); g.lineBetween(456, 263, 480, 263);
  g.lineBetween(432, 285, 456, 285); g.lineBetween(456, 285, 480, 285);

  // Floor baseboard
  g.fillStyle(0xc0b8b0, 1); g.fillRect(0, 198, 490, 4);
  gen('l5_garage_bg', 490, 320);

  // ══════════════════════════════════════════════════════════════════════════════
  // DOGHOUSE — enhanced for indoor use (220 × 210)
  // ══════════════════════════════════════════════════════════════════════════════
  g.clear();
  // Drop shadow on floor
  g.fillStyle(0x000000, 0.2); g.fillEllipse(110, 208, 186, 14);
  // House body — warm wood
  g.fillStyle(0xc07828, 1); g.fillRect(12, 82, 196, 122);
  // Plank lines
  g.lineStyle(1.5, 0xa86020, 0.4);
  for (let wy = 96; wy < 204; wy += 15) g.lineBetween(12, wy, 208, wy);
  for (let wx = 22; wx < 208; wx += 22) g.lineBetween(wx, 82, wx, 204);
  // Right depth shadow
  g.fillStyle(0x804010, 0.3); g.fillRect(178, 82, 30, 122);
  // Left highlight
  g.fillStyle(0xf0a040, 0.12); g.fillRect(12, 82, 22, 122);
  // Roof
  g.fillStyle(0x8a2e1e, 1); g.fillTriangle(2, 86, 110, 6, 218, 86);
  // Shingles
  for (let row = 0; row < 5; row++) {
    const ry = 10 + row * 16, halfW = 16 + row * 22;
    const cols = row * 2 + 2;
    for (let col = 0; col < cols; col++) {
      g.fillStyle(row % 2 === 0 ? 0x7a2414 : 0x9e3420, 0.9);
      g.fillRoundedRect(110 - halfW + col * (halfW * 2 / cols), ry, (halfW * 2 / cols) - 1, 14, 2);
    }
  }
  g.fillStyle(0x551810, 1); g.fillRect(52, 82, 116, 8);
  // Interior warm glow
  g.fillStyle(0xffd870, 0.2); g.fillEllipse(110, 172, 120, 110);
  g.fillStyle(0xffee88, 0.1); g.fillEllipse(110, 168, 80, 72);
  // Door
  g.fillStyle(0x0e0605, 1); g.fillEllipse(110, 172, 88, 104);
  g.lineStyle(6, 0xa06820, 0.95); g.strokeEllipse(110, 172, 88, 104);
  g.lineStyle(2, 0xd4a040, 0.35); g.strokeEllipse(110, 172, 80, 96);
  // Floor ledge
  g.fillStyle(0x5a3418, 1); g.fillRect(66, 196, 88, 12);
  g.fillStyle(0x7a4a24, 0.45); g.fillRect(68, 197, 84, 4);
  // Base (no grass — sits on concrete floor)
  g.fillStyle(0x9a8a7a, 1); g.fillRect(0, 206, 220, 6);
  gen('l5_doghouse', 220, 212);

  // ══════════════════════════════════════════════════════════════════════════════
  // PINK CAR (140 × 92) — parked outside, seen through garage door gap
  // ══════════════════════════════════════════════════════════════════════════════
  g.clear();
  g.fillStyle(0x000000, 0.16); g.fillEllipse(68, 90, 118, 10);
  g.fillStyle(0xe04898, 1); g.fillRoundedRect(2, 28, 128, 46, 9);
  g.fillStyle(0xc03480, 1); g.fillRoundedRect(20, 6, 86, 40, 8);
  g.fillStyle(0xee5ca8, 0.35); g.fillRect(22, 8, 82, 12);
  g.fillStyle(0x7ad8ee, 0.88); g.fillRoundedRect(26, 12, 34, 24, 5);
  g.fillStyle(0x7ad8ee, 0.88); g.fillRoundedRect(68, 12, 30, 24, 5);
  g.fillStyle(0xffffff, 0.3); g.fillRect(27, 13, 12, 7); g.fillRect(69, 13, 10, 6);
  g.fillStyle(0xee70b8, 0.5); g.fillRect(4, 44, 126, 6);
  g.fillStyle(0xffee88, 1); g.fillRoundedRect(122, 42, 10, 18, 3);
  g.fillStyle(0xff2222, 0.9); g.fillRect(2, 38, 7, 12);
  g.fillStyle(0x1a1a1a, 1); g.fillCircle(28, 74, 14); g.fillCircle(102, 74, 14);
  g.fillStyle(0x555555, 1); g.fillCircle(28, 74, 10); g.fillCircle(102, 74, 10);
  g.fillStyle(0xcccccc, 1); g.fillCircle(28, 74, 5);  g.fillCircle(102, 74, 5);
  g.fillStyle(0xffffff, 0.5); g.fillCircle(26, 72, 2); g.fillCircle(100, 72, 2);
  gen('l5_car', 140, 92);

  // ══════════════════════════════════════════════════════════════════════════════
  // DRAG ITEMS — all transparent bg
  // ══════════════════════════════════════════════════════════════════════════════

  // Dog Bed (100 × 70) — cozy pink oval
  g.clear();
  g.fillStyle(0xe0589a, 1); g.fillEllipse(50, 35, 96, 66);
  g.fillStyle(0xee7ab8, 0.8); g.fillEllipse(50, 36, 70, 48);
  g.fillStyle(0xf8a8d0, 0.6); g.fillEllipse(50, 38, 48, 30);
  g.lineStyle(3, 0xc44080, 0.7); g.strokeEllipse(50, 35, 96, 66);
  g.fillStyle(0xc03870, 0.55);
  g.fillCircle(50,38,8); g.fillCircle(39,28,5); g.fillCircle(61,28,5); g.fillCircle(34,36,5); g.fillCircle(66,36,5);
  gen('l5_bed', 100, 70);

  // Food Bowl (84 × 72)
  g.clear();
  g.fillStyle(0x000000, 0.12); g.fillEllipse(42, 68, 76, 12);
  g.fillStyle(0xaa2818, 1); g.fillEllipse(42, 48, 76, 50);
  g.fillStyle(0xcc3828, 1); g.fillEllipse(42, 26, 76, 22);
  g.fillStyle(0x7a3a14, 1);
  [[30,26],[46,22],[42,30],[56,28],[36,32]].forEach(([cx,cy]) => g.fillCircle(cx, cy, 5));
  g.lineStyle(2, 0xdd4434, 0.5); g.strokeEllipse(42, 26, 76, 22);
  gen('l5_food_bowl', 84, 72);

  // Water Bowl (84 × 72)
  g.clear();
  g.fillStyle(0x000000, 0.12); g.fillEllipse(42, 68, 76, 12);
  g.fillStyle(0x1460a0, 1); g.fillEllipse(42, 48, 76, 50);
  g.fillStyle(0x2880cc, 1); g.fillEllipse(42, 26, 76, 22);
  g.fillStyle(0x58aae0, 0.6); g.fillEllipse(34, 24, 28, 9);
  g.fillStyle(0x7cc4ee, 0.4); g.fillEllipse(54, 28, 16, 6);
  g.lineStyle(2, 0x3898dc, 0.5); g.strokeEllipse(42, 26, 76, 22);
  gen('l5_water_bowl', 84, 72);

  // Bone (100 × 60)
  g.clear();
  g.fillStyle(0xefe4cc, 1); g.fillRect(18,22,64,16);
  g.fillCircle(20,22,14); g.fillCircle(20,38,14); g.fillCircle(80,22,14); g.fillCircle(80,38,14);
  g.fillStyle(0xd8cdb2, 0.5); g.fillCircle(14,18,8); g.fillCircle(14,42,8); g.fillCircle(86,18,8); g.fillCircle(86,42,8);
  gen('l5_bone', 100, 60);

  // Ball (72 × 72)
  g.clear();
  g.fillStyle(0x8cc838, 1); g.fillCircle(36,36,34);
  g.fillStyle(0xa4de50, 0.7); g.fillCircle(28,26,20);
  g.lineStyle(3, 0xffffff, 0.75);
  g.beginPath(); g.arc(36,36,27,-0.75,0.75); g.strokePath();
  g.beginPath(); g.arc(36,36,27,Math.PI-0.75,Math.PI+0.75); g.strokePath();
  gen('l5_ball', 72, 72);

  // Flower Pot (76 × 90) — Gleeda brought it to brighten the garage
  g.clear();
  g.fillStyle(0x5a8230, 1); g.fillRect(16,44,44,44);
  g.fillStyle(0x4a6e22, 1); g.fillTriangle(16,44,10,88,16,88); g.fillTriangle(60,44,66,88,60,88);
  g.fillStyle(0x78a040, 1); g.fillRect(10,40,56,10);
  g.fillStyle(0x4a2e14, 1); g.fillEllipse(38,46,52,12);
  g.lineStyle(2, 0x2e6618, 1);
  g.lineBetween(28,46,14,16); g.lineBetween(38,44,38,8); g.lineBetween(48,46,62,18);
  [[14,12,0xff5577],[38,4,0xffcc33],[62,14,0xff88cc]].forEach(([fx,fy,fc]) => {
    g.fillStyle(fc,1); g.fillCircle(fx,fy,9); g.fillStyle(0xffee44,1); g.fillCircle(fx,fy,4);
  });
  gen('l5_flower_pot', 76, 90);

  // Welcome Sign (96 × 100)
  g.clear();
  g.fillStyle(0x9a6828, 1); g.fillRect(40,68,12,32); g.fillStyle(0x7a5018, 0.5); g.fillRect(42,68,5,32);
  g.fillStyle(0xc08830, 1); g.fillRoundedRect(2,2,92,66,7);
  g.lineStyle(1, 0xa07020, 0.25); for (let wl=14; wl<66; wl+=14) g.lineBetween(6,wl,88,wl);
  g.lineStyle(2, 0x7a5018, 0.7); g.strokeRoundedRect(2,2,92,66,7);
  g.fillStyle(0x7a4e18, 0.45);
  g.fillCircle(20,22,5); g.fillCircle(14,16,3); g.fillCircle(22,15,3); g.fillCircle(11,21,3); g.fillCircle(24,22,3);
  g.fillCircle(76,50,5); g.fillCircle(70,44,3); g.fillCircle(78,43,3); g.fillCircle(67,49,3); g.fillCircle(80,50,3);
  gen('l5_welcome_sign', 96, 100);

  // ══════════════════════════════════════════════════════════════════════════════
  // PHASE 2 — PLANT WATERING ITEMS
  // ══════════════════════════════════════════════════════════════════════════════

  // Watering Can (70 × 66)
  g.clear();
  g.fillStyle(0x2288cc, 1); g.fillEllipse(30, 38, 52, 44);
  g.fillStyle(0x44aaee, 0.6); g.fillEllipse(26, 28, 30, 22);
  g.lineStyle(2, 0x1a6aaa, 0.8); g.strokeEllipse(30, 38, 52, 44);
  g.fillStyle(0x1a78aa, 1); g.fillRect(52, 28, 16, 8); g.fillRect(64, 20, 4, 12);
  g.fillStyle(0x1a78aa, 1); g.fillEllipse(66, 18, 14, 10);
  g.lineStyle(1, 0x88ccee, 0.5); g.strokeEllipse(66, 18, 14, 10);
  g.lineStyle(5, 0x1a6aaa, 1);
  g.beginPath(); g.arc(30, 20, 18, -0.4, -Math.PI + 0.4, true); g.strokePath();
  g.fillStyle(0x66ccff, 0.8); g.fillCircle(62,8,3); g.fillCircle(67,5,2); g.fillCircle(57,6,2); g.fillCircle(64,2,2);
  gen('l5_watering_can', 70, 66);

  // Wilted Plant (36 × 58) — houseplant drooping
  g.clear();
  g.lineStyle(3, 0x6a8a2a, 1); g.beginPath(); g.moveTo(18,56); g.lineTo(18,28); g.lineTo(30,14); g.strokePath();
  g.lineStyle(2, 0x8aaa3a, 0.6); g.lineBetween(14,38,6,32);
  g.fillStyle(0xccbbaa, 0.8); [[30,8],[28,14],[30,20],[34,14],[30,6]].forEach(([px,py]) => g.fillEllipse(px,py,10,7));
  g.fillStyle(0xbbaa88, 1); g.fillCircle(30,13,5);
  gen('l5_wilted_flower', 36, 58);

  // Bloomed plant — red
  g.clear();
  g.lineStyle(3, 0x448820, 1); g.lineBetween(18,56,18,20);
  g.lineStyle(2, 0x55aa28, 0.7); g.lineBetween(14,40,5,33); g.lineBetween(22,35,30,28);
  g.fillStyle(0xff2244, 1);
  for (let a=0; a<6; a++) { const ang=(a/6)*Math.PI*2; g.fillEllipse(18+Math.cos(ang)*11, 18+Math.sin(ang)*11, 12, 18); }
  g.fillStyle(0xffcc22, 1); g.fillCircle(18,18,7); g.fillStyle(0xffee88,0.7); g.fillCircle(16,16,3);
  gen('l5_bloom_r', 36, 58);

  // Bloomed plant — yellow
  g.clear();
  g.lineStyle(3, 0x448820, 1); g.lineBetween(18,56,18,20);
  g.lineStyle(2, 0x55aa28, 0.7); g.lineBetween(14,42,5,35);
  g.fillStyle(0xffcc00, 1);
  for (let a=0; a<8; a++) { const ang=(a/8)*Math.PI*2; g.fillEllipse(18+Math.cos(ang)*11, 18+Math.sin(ang)*11, 10, 16); }
  g.fillStyle(0xff8800, 1); g.fillCircle(18,18,7); g.fillStyle(0xffee55,0.7); g.fillCircle(16,16,3);
  gen('l5_bloom_y', 36, 58);

  // Bloomed plant — purple
  g.clear();
  g.lineStyle(3, 0x448820, 1); g.lineBetween(18,56,18,20);
  g.lineStyle(2, 0x55aa28, 0.7); g.lineBetween(22,38,30,30);
  g.fillStyle(0xcc44ff, 1);
  for (let a=0; a<6; a++) { const ang=(a/6)*Math.PI*2; g.fillEllipse(18+Math.cos(ang)*10, 18+Math.sin(ang)*10, 11, 17); }
  g.fillStyle(0xffcc22, 1); g.fillCircle(18,18,6); g.fillStyle(0xffee88,0.7); g.fillCircle(16,16,3);
  gen('l5_bloom_p', 36, 58);

  // ══════════════════════════════════════════════════════════════════════════════
  // PHASE 3 — PARTY ITEMS
  // ══════════════════════════════════════════════════════════════════════════════

  // Balloon cluster (52 × 80)
  g.clear();
  [[10,16,0xff3344],[26,8,0x4488ff],[42,20,0xffcc22]].forEach(([bx,by,bc]) => {
    g.fillStyle(bc,1); g.fillEllipse(bx,by,22,28);
    g.fillStyle(0xffffff,0.3); g.fillEllipse(bx-4,by-6,9,10);
    g.fillStyle(0x000000,0.12); g.fillEllipse(bx+4,by+6,8,10);
    g.fillStyle(bc,1); g.fillCircle(bx,by+14,3);
  });
  g.lineStyle(1, 0x555555, 0.6);
  g.lineBetween(10,30,26,72); g.lineBetween(26,22,26,72); g.lineBetween(42,34,26,72);
  g.fillStyle(0x888888, 0.8); g.fillCircle(26,72,4);
  gen('l5_balloon', 52, 80);

  // Cake (78 × 80)
  g.clear();
  g.fillStyle(0xfff0e0,1); g.fillRect(4,46,70,30); g.fillStyle(0xffe8c8,0.5); g.fillRect(5,46,68,10);
  g.lineStyle(2, 0xf0c8a0, 0.8); g.strokeRect(4,46,70,30);
  g.fillStyle(0xfff4e8,1); g.fillRect(14,24,50,24); g.lineStyle(2, 0xf0c8a0, 0.7); g.strokeRect(14,24,50,24);
  g.fillStyle(0xff88bb,1); [8,18,28,38,48,58,68].forEach(dx => g.fillEllipse(dx,46,10,7)); g.fillRect(4,41,70,8);
  g.fillStyle(0xffffff,1); [18,28,38,48,58].forEach(dx => g.fillEllipse(dx,24,9,6)); g.fillRect(14,19,50,7);
  [[22,10,0xff4444],[39,6,0x4488ff],[56,10,0x44cc44]].forEach(([cx,cy,cc]) => {
    g.fillStyle(cc,1); g.fillRect(cx-2,cy,4,14);
    g.fillStyle(0xffee44,1); g.fillEllipse(cx,cy,6,9); g.fillStyle(0xff8800,0.8); g.fillEllipse(cx,cy+2,4,6);
  });
  gen('l5_cake', 78, 80);

  // Party Banner (128 × 38)
  g.clear();
  g.lineStyle(1.5, 0x888888, 0.7); g.beginPath(); g.moveTo(4,6);
  for (let i=0; i<=8; i++) g.lineTo(4+i*15, 6+(i%2)*8);
  g.strokePath();
  [0xff4444,0xff8800,0xffcc00,0x44cc44,0x4488ff,0xaa44ff,0xff44aa,0xff4444].forEach((bc,i) => {
    const bx=6+i*15, by=4+(i%2)*8;
    g.fillStyle(bc,1); g.fillTriangle(bx,by,bx+12,by,bx+6,by+22);
    g.fillStyle(0xffffff,0.2); g.fillTriangle(bx,by,bx+6,by,bx+3,by+12);
  });
  gen('l5_party_banner', 128, 38);

  // Gift Box (62 × 66)
  g.clear();
  g.fillStyle(0x000000,0.14); g.fillEllipse(31,66,52,10);
  g.fillStyle(0x4488dd,1); g.fillRect(6,28,50,36); g.fillStyle(0x3366bb,0.4); g.fillRect(6,50,50,14);
  g.lineStyle(1.5, 0x2255aa, 0.6); g.strokeRect(6,28,50,36);
  g.fillStyle(0x3377cc,1); g.fillRect(4,20,54,12); g.fillStyle(0x5599ee,0.5); g.fillRect(4,20,54,5);
  g.lineStyle(1.5, 0x2255aa, 0.6); g.strokeRect(4,20,54,12);
  g.fillStyle(0xff4488,1); g.fillRect(28,20,6,44); g.fillStyle(0xff88bb,0.5); g.fillRect(29,20,3,44);
  g.fillStyle(0xff4488,1); g.fillRect(4,24,54,6); g.fillStyle(0xff88bb,0.5); g.fillRect(4,25,54,3);
  g.fillStyle(0xff2266,1); g.fillEllipse(22,20,18,12); g.fillEllipse(40,20,18,12);
  g.fillStyle(0xff4488,0.6); g.fillEllipse(20,18,10,7); g.fillEllipse(42,18,10,7);
  g.fillStyle(0xff2266,1); g.fillCircle(31,20,6);
  gen('l5_gift', 62, 66);

  // ══════════════════════════════════════════════════════════════════════════════
  // UI ELEMENTS
  // ══════════════════════════════════════════════════════════════════════════════

  if (!scene.textures.exists('l5_sparkle')) {
    g.clear();
    g.fillStyle(0xffffff,1); g.fillTriangle(16,0,13,13,19,13); g.fillTriangle(16,32,13,19,19,19);
    g.fillTriangle(0,16,13,13,13,19); g.fillTriangle(32,16,19,13,19,19);
    g.fillStyle(0xffffaa,0.7); g.fillTriangle(16,5,14,14,18,14); g.fillTriangle(16,27,14,18,18,18);
    gen('l5_sparkle', 32, 32);
  }
  if (!scene.textures.exists('l5_hint_bulb')) {
    g.clear();
    g.fillStyle(0xffee44,1); g.fillCircle(20,17,15); g.fillStyle(0xffffff,0.45); g.fillCircle(14,11,7);
    g.fillStyle(0xaa8800,1); g.fillRect(14,31,12,5); g.fillRect(15,35,10,4);
    g.lineStyle(1, 0x886600, 0.6); g.lineBetween(14,31,26,31); g.lineBetween(15,33,25,33);
    gen('l5_hint_bulb', 40, 40);
  }
  if (!scene.textures.exists('l5_coin')) {
    g.clear();
    g.fillStyle(0xf5c84a,1); g.fillCircle(12,12,11); g.fillStyle(0xfde880,0.7); g.fillCircle(9,9,6);
    g.lineStyle(2, 0xd4a020,1); g.strokeCircle(12,12,11);
    gen('l5_coin', 24, 24);
  }
  if (!scene.textures.exists('l5_diamond')) {
    g.clear();
    g.fillStyle(0x44ccff,1); g.fillTriangle(12,2,2,10,12,22); g.fillTriangle(12,2,22,10,12,22);
    g.fillStyle(0x88eeff,0.5); g.fillTriangle(12,2,6,10,16,10);
    g.lineStyle(1, 0x22aaee,0.6); g.strokeTriangle(12,2,2,10,12,22); g.strokeTriangle(12,2,22,10,12,22);
    gen('l5_diamond', 24, 24);
  }

  g.destroy();
}

// ══════════════════════════════════════════════════════════════════════════════
// STREET / COLLECT-LEVEL TEXTURES  (items, obstacles, neighbourhood props)
// ══════════════════════════════════════════════════════════════════════════════
export function generateL5StreetAssets(scene) {
  // Guard on a key that's never loaded as a real image, so this still runs to
  // create the few procedural-only textures (l5_homesign, l5_star).
  if (scene.textures.exists('l5_homesign')) return;
  const g = scene.make.graphics({ add: false });
  // Only generate if a real image wasn't already loaded under that key
  const gen = (k, w, h) => { if (!scene.textures.exists(k)) g.generateTexture(k, w, h); };

  // ── ITEM: Wood Planks (60×34) ──────────────────────────────────────────────
  g.clear();
  for (let i = 0; i < 3; i++) {
    const y = 4 + i * 10;
    g.fillStyle(i % 2 ? 0x9a6a2e : 0xb07e38, 1); g.fillRoundedRect(2, y, 56, 9, 2);
    g.fillStyle(0x7a4e1e, 0.5); g.fillRect(4, y + 7, 52, 2);
    g.lineStyle(1, 0x5a3a12, 0.4); g.strokeRoundedRect(2, y, 56, 9, 2);
  }
  gen('l5_wood', 60, 36);

  // ── ITEM: Roof Panel (60×36) red tiles ─────────────────────────────────────
  g.clear();
  for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) {
    g.fillStyle((r + c) % 2 ? 0xc0392b : 0xa82f22, 1);
    g.fillRoundedRect(2 + c * 12, 2 + r * 11, 11, 10, 3);
    g.fillStyle(0xe05a44, 0.4); g.fillRect(3 + c * 12, 3 + r * 11, 9, 3);
  }
  gen('l5_roof', 60, 36);

  // ── ITEM: Nails Box (54×46) ────────────────────────────────────────────────
  g.clear();
  g.fillStyle(0x4a7a2e, 1); g.fillRoundedRect(2, 14, 50, 30, 4);
  g.fillStyle(0x5e9438, 1); g.fillRect(4, 16, 46, 8);
  g.fillStyle(0x3a5e22, 0.6); g.fillRect(4, 38, 46, 4);
  // nails sticking out
  g.fillStyle(0xb8b8c0, 1);
  [10, 20, 30, 40].forEach((nx, i) => { g.fillRect(nx, 6 - (i % 2) * 3, 3, 12); g.fillCircle(nx + 1.5, 6 - (i % 2) * 3, 3); });
  g.lineStyle(1.5, 0x2e4a18, 0.7); g.strokeRoundedRect(2, 14, 50, 30, 4);
  gen('l5_nails', 54, 48);

  // ── ITEM: Paint Bucket (48×54) ─────────────────────────────────────────────
  g.clear();
  g.fillStyle(0xb0b4ba, 1); g.fillRoundedRect(6, 14, 36, 36, 4);
  g.fillStyle(0xd6dade, 0.6); g.fillRect(9, 16, 8, 32);
  g.fillStyle(0x7e1f6b, 1); g.fillEllipse(24, 16, 38, 12);     // purple paint
  g.fillStyle(0xa83b94, 0.6); g.fillEllipse(20, 14, 16, 6);
  g.lineStyle(2.5, 0x888c92, 1); g.beginPath(); g.arc(24, 12, 18, Math.PI + 0.3, -0.3, false); g.strokePath(); // handle
  g.lineStyle(2, 0x7a7e84, 0.8); g.strokeRoundedRect(6, 14, 36, 36, 4);
  // drip
  g.fillStyle(0x7e1f6b, 1); g.fillRect(40, 24, 4, 14); g.fillCircle(42, 38, 3);
  gen('l5_paint', 48, 56);

  // ── OBSTACLE: Traffic Cone (40×46) ─────────────────────────────────────────
  g.clear();
  g.fillStyle(0x000000, 0.12); g.fillEllipse(20, 44, 36, 8);
  g.fillStyle(0xe8621f, 1); g.fillTriangle(20, 2, 6, 40, 34, 40);
  g.fillStyle(0xffffff, 1); g.fillTriangle(20, 14, 14, 26, 26, 26);
  g.fillStyle(0xe8621f, 1); g.fillTriangle(20, 18, 16.5, 26, 23.5, 26);
  g.fillStyle(0xd4541a, 1); g.fillRoundedRect(2, 40, 36, 6, 2);
  gen('l5_cone', 40, 48);

  // ── OBSTACLE: Trash Bin (44×56) ────────────────────────────────────────────
  g.clear();
  g.fillStyle(0x000000, 0.12); g.fillEllipse(22, 54, 40, 8);
  g.fillStyle(0x2e7d46, 1); g.fillRoundedRect(6, 12, 32, 42, 4);
  g.fillStyle(0x37985a, 0.6); g.fillRect(9, 14, 6, 38);
  g.lineStyle(1, 0x205a32, 0.6); for (let i = 1; i < 4; i++) g.lineBetween(6 + i * 8, 12, 6 + i * 8, 54);
  g.fillStyle(0x256b3b, 1); g.fillRoundedRect(2, 6, 40, 9, 3);   // lid
  g.fillStyle(0x1a4d2a, 1); g.fillRect(18, 2, 8, 5);             // handle
  gen('l5_bin', 44, 58);

  // ── OBSTACLE: Cardboard Boxes (62×52) ──────────────────────────────────────
  g.clear();
  g.fillStyle(0x000000, 0.12); g.fillEllipse(31, 50, 56, 8);
  const box = (x, y, w, h) => {
    g.fillStyle(0xc89a5e, 1); g.fillRect(x, y, w, h);
    g.fillStyle(0xa87e44, 1); g.fillRect(x, y, w, 5);
    g.lineStyle(1.5, 0x8a6630, 0.8); g.strokeRect(x, y, w, h);
    g.lineStyle(1.5, 0x8a6630, 0.5); g.lineBetween(x + w / 2, y, x + w / 2, y + h);
  };
  box(4, 22, 30, 28); box(34, 18, 24, 32); box(16, 4, 26, 20);
  gen('l5_boxes', 62, 52);

  // ── OBSTACLE: Bicycle (74×48) ──────────────────────────────────────────────
  g.clear();
  g.fillStyle(0x000000, 0.12); g.fillEllipse(37, 46, 64, 6);
  g.lineStyle(4, 0x1a1a1a, 1); g.strokeCircle(16, 32, 13); g.strokeCircle(58, 32, 13);
  g.lineStyle(2, 0x888888, 0.8); for (let a = 0; a < 6; a++) { const an = a * Math.PI / 3; g.lineBetween(16, 32, 16 + Math.cos(an) * 11, 32 + Math.sin(an) * 11); g.lineBetween(58, 32, 58 + Math.cos(an) * 11, 32 + Math.sin(an) * 11); }
  g.lineStyle(3, 0x2266cc, 1); g.lineBetween(16, 32, 38, 32); g.lineBetween(38, 32, 30, 14); g.lineBetween(30, 14, 58, 32); g.lineBetween(38, 32, 50, 14); g.lineBetween(50, 14, 58, 32);
  g.fillStyle(0x111111, 1); g.fillRoundedRect(26, 11, 12, 4, 2);  // seat
  g.lineStyle(3, 0x111111, 1); g.lineBetween(50, 14, 56, 8); g.lineBetween(54, 8, 60, 10); // handle
  gen('l5_bike', 74, 50);

  // ── OBSTACLE: Water Puddle (76×22) ─────────────────────────────────────────
  g.clear();
  g.fillStyle(0x3a6a9a, 0.55); g.fillEllipse(38, 12, 72, 18);
  g.fillStyle(0x5a8ec0, 0.45); g.fillEllipse(36, 10, 56, 12);
  g.fillStyle(0xbfe0ff, 0.4); g.fillEllipse(26, 8, 20, 5);
  gen('l5_puddle', 76, 22);

  // ── OBSTACLE: Pothole (66×24) ──────────────────────────────────────────────
  g.clear();
  g.fillStyle(0x0a0a0a, 1); g.fillEllipse(33, 12, 62, 20);
  g.fillStyle(0x1e1e1e, 1); g.fillEllipse(33, 10, 50, 14);
  g.lineStyle(2, 0x3a3a3a, 0.6); g.strokeEllipse(33, 12, 62, 20);
  gen('l5_pothole', 66, 24);

  // ── BG: House (180×170) — tintable ─────────────────────────────────────────
  g.clear();
  g.fillStyle(0xe8dcc4, 1); g.fillRect(20, 70, 140, 100);          // body
  g.fillStyle(0xcdbf9f, 0.5); g.fillRect(20, 70, 140, 8);
  g.fillStyle(0x9a3b2e, 1); g.fillTriangle(8, 72, 90, 18, 172, 72); // roof
  g.fillStyle(0x7e2e22, 1); g.fillRect(8, 70, 164, 6);
  g.fillStyle(0x6a4a2a, 1); g.fillRoundedRect(74, 116, 32, 54, 3);  // door
  g.fillStyle(0xf5c84a, 1); g.fillCircle(100, 143, 2.5);
  g.fillStyle(0x9bd0ee, 1); g.fillRect(36, 92, 30, 28); g.fillRect(114, 92, 30, 28); // windows
  g.lineStyle(2, 0xffffff, 0.8); g.strokeRect(36, 92, 30, 28); g.strokeRect(114, 92, 30, 28);
  g.lineBetween(51, 92, 51, 120); g.lineBetween(36, 106, 66, 106);
  g.lineBetween(129, 92, 129, 120); g.lineBetween(114, 106, 144, 106);
  gen('l5_house', 180, 172);

  // ── BG: Bush (64×40) ───────────────────────────────────────────────────────
  g.clear();
  g.fillStyle(0x2f7d3a, 1); g.fillEllipse(20, 26, 36, 30); g.fillEllipse(44, 24, 40, 32); g.fillEllipse(32, 16, 30, 26);
  g.fillStyle(0x3c9a49, 0.7); g.fillEllipse(24, 18, 18, 12); g.fillEllipse(42, 18, 16, 10);
  gen('l5_bush', 64, 42);

  // ── BG: Street Lamp (26×96) ────────────────────────────────────────────────
  g.clear();
  g.fillStyle(0x3a3f4a, 1); g.fillRect(11, 16, 4, 78);
  g.fillStyle(0x2a2f38, 1); g.fillRoundedRect(4, 90, 18, 6, 2);
  g.fillStyle(0x3a3f4a, 1); g.fillRect(11, 14, 12, 4);
  g.fillStyle(0xffe9a8, 1); g.fillRoundedRect(18, 8, 8, 12, 3);
  g.fillStyle(0xfff4cc, 0.5); g.fillCircle(22, 14, 8);
  gen('l5_lamp', 28, 98);

  // ── HOME arrow sign (96×46) ────────────────────────────────────────────────
  g.clear();
  g.fillStyle(0x8a5a28, 1); g.fillRect(6, 30, 6, 16);
  g.fillStyle(0xe0a23c, 1); g.fillRoundedRect(2, 6, 74, 26, 5); g.fillTriangle(76, 6, 94, 19, 76, 32);
  g.lineStyle(2, 0x9a6a20, 0.9); g.strokeRoundedRect(2, 6, 74, 26, 5);
  gen('l5_homesign', 96, 46);

  // ── Star collectable (28×28) ───────────────────────────────────────────────
  g.clear();
  const sx = 14, sy = 14, R = 12, r = 5;
  const pts = [];
  for (let i = 0; i < 10; i++) { const ang = -Math.PI / 2 + i * Math.PI / 5; const rad = i % 2 ? r : R; pts.push(sx + Math.cos(ang) * rad, sy + Math.sin(ang) * rad); }
  g.fillStyle(0xffd33a, 1); g.fillPoints(pts.reduce((a, v, i) => { if (i % 2 === 0) a.push({ x: v, y: pts[i + 1] }); return a; }, []), true);
  g.fillStyle(0xfff0a0, 0.6); g.fillCircle(11, 10, 3);
  gen('l5_star', 28, 28);

  g.destroy();
}
