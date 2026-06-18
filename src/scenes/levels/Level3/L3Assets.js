import { W, H } from '../../../config/GameConfig.js';

export function generateL3Assets(scene) {
  // Guard on l3_coin — it is always procedural so this is safe even when
  // real artwork (l3_car, l3_road, l3_bg_city …) is pre-loaded in BootScene.
  if (scene.textures.exists('l3_coin')) return;
  const g = scene.make.graphics({ add: false });

  // ── CAR (120×68, red SUV) — skip if real image was loaded ─────────────────
  if (!scene.textures.exists('l3_car')) {
  g.clear();
  g.fillStyle(0xbb1818, 1); g.fillRoundedRect(8, 22, 104, 34, 7);
  g.fillStyle(0x991010, 1); g.fillRoundedRect(22, 8, 68, 24, 6);
  g.fillStyle(0x88aacc, 0.8); g.fillRoundedRect(25, 11, 26, 16, 3);
  g.fillStyle(0x88aacc, 0.8); g.fillRoundedRect(56, 11, 26, 16, 3);
  g.fillStyle(0xffffff, 0.25); g.fillRect(26, 12, 8, 4); g.fillRect(57, 12, 8, 4);
  g.fillStyle(0xdd2222, 0.4);  g.fillRect(10, 23, 100, 6);
  g.fillStyle(0x771010, 1);    g.fillRoundedRect(104, 28, 10, 22, 3);
  g.fillStyle(0xffffcc, 1);    g.fillRoundedRect(108, 30, 6, 8, 2);
  g.fillStyle(0xffffff, 0.4);  g.fillRect(108, 30, 3, 4);
  g.fillStyle(0x660808, 1);    g.fillRect(8, 30, 6, 18);
  g.fillStyle(0xff4444, 0.9);  g.fillRect(8, 34, 5, 6);
  g.fillStyle(0x441010, 1);    g.fillRect(14, 52, 90, 6);
  g.fillStyle(0x220808, 1);    g.fillCircle(32, 56, 14); g.fillCircle(88, 56, 14);
  g.fillStyle(0x1a1a1a, 1);    g.fillCircle(32, 56, 12); g.fillCircle(88, 56, 12);
  g.fillStyle(0x555555, 1);    g.fillCircle(32, 56, 7);  g.fillCircle(88, 56, 7);
  g.fillStyle(0xc0c0c0, 1);    g.fillCircle(32, 56, 4);  g.fillCircle(88, 56, 4);
  g.fillStyle(0x7a4020, 0.75); g.fillRect(30, 8, 50, 3);
  g.fillStyle(0x4a2810, 0.55); g.fillRect(30, 7, 50, 2);
  g.generateTexture('l3_car', 120, 68);
  } // end if !l3_car

  // ── ROAD (800×90, dark wet asphalt) — skip if real image was loaded ───────
  if (!scene.textures.exists('l3_road')) {
  g.clear();
  // Base wet asphalt
  g.fillStyle(0x181820, 1); g.fillRect(0, 0, W, 90);
  // Scattered asphalt specks — deterministic but irregular looking
  for (let i = 0; i < 160; i++) {
    const sx = (i * 47 + (i * i * 3) % 113) % W;
    const sy = (i * 31 + (i * 7) % 59) % 90;
    const sw = 1 + (i % 4);
    const sh = 1 + (i % 2);
    g.fillStyle(0x2a2a38, 0.35 + (i % 5) * 0.08);
    g.fillRect(sx, sy, sw, sh);
  }
  // Faint wet-road horizontal smears (vary in Y so they don't form stripes)
  for (let i = 0; i < 12; i++) {
    const ly = 6 + (i * 37 + i * i) % 78;
    const lx = (i * 91) % W;
    const lw = 30 + (i * 17) % 120;
    g.fillStyle(0x22283a, 0.22);
    g.fillRect(lx, ly, lw, 1);
  }
  // Blue-tinted wet sheen strip in the centre
  g.fillStyle(0x2244aa, 0.06); g.fillRect(0, 28, W, 34);
  g.generateTexture('l3_road', W, 90);
  } // end if !l3_road

  // ── ROAD CENTRE-LINE (80×6) — always procedural ───────────────────────────
  g.clear();
  g.fillStyle(0xdddd88, 0.65); g.fillRect(0, 0, 52, 6);
  g.generateTexture('l3_roadline', 80, 6);

  if (!scene.textures.exists('l3_bg_city')) {
  // ── CITY BUILDINGS (200×200) — Zone 1 midground ────────────────────────────
  // 6 varied skyscrapers, brightly lit windows, cyan + pink neon signs,
  // rooftop water tower, antenna, wet-road puddle reflections
  g.clear();
  g.fillStyle(0x040810, 1); g.fillRect(0, 0, 200, 200);
  g.fillStyle(0x06101e, 0.65); g.fillRect(0, 55, 200, 145); // sky haze

  const bldgs = [
    { x: 0,   y: 82,  w: 38, h: 118, col: 0x090d1c },
    { x: 42,  y: 52,  w: 30, h: 148, col: 0x070b18 },
    { x: 76,  y: 70,  w: 28, h: 130, col: 0x080c1a },
    { x: 108, y: 42,  w: 44, h: 158, col: 0x060a16 },
    { x: 156, y: 65,  w: 28, h: 135, col: 0x090d1e },
    { x: 186, y: 84,  w: 14, h: 116, col: 0x0a0e20 },
  ];
  bldgs.forEach(b => {
    g.fillStyle(b.col, 1); g.fillRect(b.x, b.y, b.w, b.h);
    g.fillStyle(0x1a2840, 0.35); g.fillRect(b.x, b.y, 2, b.h);       // left rim light
    g.fillStyle(0x141e30, 0.5);  g.fillRect(b.x, b.y, b.w, 2);       // top rim
    for (let wy = b.y + 8; wy < b.y + b.h - 6; wy += 13) {
      for (let wx = b.x + 4; wx < b.x + b.w - 4; wx += 9) {
        const seed = (wx * 7 + wy * 13) % 31;
        if (seed < 20) {
          const warm = seed % 4 < 3;
          g.fillStyle(warm ? 0xf5c870 : 0x8899ff, warm ? 0.72 : 0.52);
        } else {
          g.fillStyle(0x050a14, 0.85);
        }
        g.fillRect(wx, wy, 5, 7);
      }
    }
  });
  // Neon sign — cyan on building 0
  g.fillStyle(0x00bbdd, 0.92); g.fillRoundedRect(3, 94, 34, 11, 2);
  g.fillStyle(0x00eeff, 0.22); g.fillRect(3, 94, 34, 5); // glow layer
  // Neon sign — hot pink on building 3
  g.fillStyle(0xff1199, 0.90); g.fillRoundedRect(112, 55, 38, 11, 2);
  g.fillStyle(0xff88cc, 0.18); g.fillRect(112, 55, 38, 5);
  // Rooftop: water tower (building 1)
  g.fillStyle(0x0d1830, 1);  g.fillRect(52, 46, 12, 8);
  g.fillStyle(0x1a2840, 1);  g.fillEllipse(58, 46, 16, 5);
  // Rooftop: blinking antenna (building 3)
  g.fillStyle(0x1a2840, 1);  g.fillRect(128, 36, 2, 12);
  g.fillStyle(0xff1111, 0.6); g.fillCircle(129, 36, 2);
  // Wet-road puddle reflections at base
  g.fillStyle(0x080e18, 0.40); g.fillEllipse(65, 196, 90, 8);
  g.fillStyle(0x00bbdd, 0.09); g.fillRect(3,   192, 34, 6); // cyan neon in puddle
  g.fillStyle(0xff1199, 0.07); g.fillRect(112, 192, 38, 6); // pink neon in puddle
  g.generateTexture('l3_bg_city', 200, 200);
  } // end if !l3_bg_city

  if (!scene.textures.exists('l3_bg_jungle')) {
  // ── JUNGLE TREES (200×200) — Zone 2 midground ────────────────────────────
  // Moonlight shaft, 3-depth canopy, hanging vines, ferns, bioluminescent fungi
  g.clear();
  g.fillStyle(0x010703, 1); g.fillRect(0, 0, 200, 200);
  // Moonlight crepuscular ray
  g.fillStyle(0x8899cc, 0.11); g.fillTriangle(98, 0, 72, 200, 124, 200);
  g.fillStyle(0x9aaddd, 0.06); g.fillTriangle(92, 0, 107, 0, 118, 200, 68, 200);
  // Far canopy silhouettes
  [[10, 112, 52], [68, 90, 64], [130, 108, 50], [182, 96, 46]].forEach(([tx, ty, tr]) => {
    g.fillStyle(0x020904, 1); g.fillCircle(tx, ty, tr);
  });
  // Mid canopy
  [[30, 70, 40], [92, 54, 50], [158, 64, 44]].forEach(([tx, ty, tr]) => {
    g.fillStyle(0x021006, 1); g.fillCircle(tx, ty, tr);
    g.fillStyle(0x031408, 0.65); g.fillCircle(tx - 10, ty - 12, tr * 0.6);
    g.fillStyle(0x041608, 0.45); g.fillCircle(tx + 13, ty - 7,  tr * 0.5);
  });
  // Tree trunks
  [[28, 200, 9, 152], [90, 200, 11, 132], [156, 200, 10, 147], [195, 200, 8, 128]].forEach(([tx, tb, tw, th]) => {
    g.fillStyle(0x180c03, 1); g.fillRect(tx - tw / 2, tb - th, tw, th);
    g.fillStyle(0x241202, 0.45); g.fillRect(tx - tw / 2 + 1, tb - th, Math.floor(tw / 2), th);
  });
  // Hanging vines
  g.lineStyle(1.5, 0x082010, 0.55);
  g.lineBetween(55, 100, 48, 200); g.lineBetween(60, 100, 63, 200);
  g.lineBetween(158, 78, 150, 200); g.lineBetween(163, 78, 166, 200);
  g.lineStyle(1, 0x061a0a, 0.4);
  g.lineBetween(112, 108, 109, 200); g.lineBetween(188, 88, 192, 200);
  // Ground ferns
  [[18, 186], [68, 189], [132, 184], [178, 188]].forEach(([fx, fy]) => {
    g.fillStyle(0x061a06, 0.75);
    g.fillTriangle(fx, fy, fx - 14, fy - 18, fx + 14, fy - 18);
    g.fillTriangle(fx, fy, fx - 10, fy - 22, fx + 5,  fy - 8);
  });
  // Bioluminescent fungi spots
  [[46, 162, 0x22ff88], [94, 172, 0x44ddaa], [162, 159, 0x11ee66]].forEach(([fx, fy, fc]) => {
    g.fillStyle(fc, 0.45); g.fillCircle(fx, fy, 2.5);
    g.fillStyle(fc, 0.14); g.fillCircle(fx, fy, 6);
  });
  g.generateTexture('l3_bg_jungle', 200, 200);
  } // end if !l3_bg_jungle

  // ── NIGHT SKY (200×200) — Zone 3 sky overlay — always procedural ─────────
  // Stars, moon with halo, distant city horizon glow
  g.clear();
  g.fillStyle(0x020510, 1); g.fillRect(0, 0, 200, 200);
  // Stars (deterministic positions so every reload looks the same)
  for (let i = 0; i < 74; i++) {
    const sx = (i * 47 + (i * i) % 13 * 7 + 11) % 200;
    const sy = (i * 31 + 17) % 155;
    g.fillStyle(0xffffff, 0.35 + (i % 5) * 0.13);
    if (i % 11 === 0) g.fillCircle(sx, sy, 1.4);
    else              g.fillCircle(sx, sy, 0.7);
  }
  // Sparkle crosses on a few bright stars
  [[38, 28], [142, 54], [172, 18], [82, 78]].forEach(([sx, sy]) => {
    g.fillStyle(0xeeeeff, 0.72);
    g.fillRect(sx - 3, sy, 6, 1); g.fillRect(sx, sy - 3, 1, 6);
  });
  // Moon: outer halo → inner glow → disc → mare
  g.fillStyle(0x6677aa, 0.08);  g.fillCircle(165, 30, 32);
  g.fillStyle(0x8899bb, 0.14);  g.fillCircle(165, 30, 22);
  g.fillStyle(0xdde8ff, 0.92);  g.fillCircle(165, 30, 12);
  g.fillStyle(0xc8d5ee, 0.55);  g.fillCircle(161, 26, 5);
  // Distant city horizon amber glow
  g.fillStyle(0xee6611, 0.05);  g.fillRect(0, 148, 200, 52);
  g.fillStyle(0xee7722, 0.09);  g.fillRect(0, 165, 200, 35);
  g.fillStyle(0xff9933, 0.07);  g.fillRect(0, 178, 200, 22);
  // Horizon light dots (distant streetlights)
  for (let i = 0; i < 16; i++) {
    g.fillStyle(0xffaa44, 0.35 + (i % 3) * 0.1);
    g.fillCircle((i * 31 + 5) % 198, 180 + (i % 4), 1);
  }
  g.generateTexture('l3_bg_night', 200, 200);

  if (!scene.textures.exists('l3_bg_highway')) {
  // ── HIGHWAY OVERPASS (300×200) — Zone 3 midground ──────────────────────────
  // Bridge deck, support pillars, highway sign, speed-limit disc
  g.clear();
  // Bridge deck
  g.fillStyle(0x0a0c18, 1);    g.fillRect(0, 108, 300, 16);
  g.fillStyle(0x141828, 0.55); g.fillRect(0, 106, 300, 2);
  g.fillStyle(0x0e1224, 0.40); g.fillRect(0, 124, 300, 3);
  // Support pillars
  [[22, 180, 14, 72], [138, 180, 14, 72], [256, 180, 14, 72]].forEach(([px, pb, pw, ph]) => {
    g.fillStyle(0x0b0e1c, 1);    g.fillRect(px, pb - ph, pw, ph);
    g.fillStyle(0x18203a, 0.40); g.fillRect(px, pb - ph, Math.floor(pw / 2), ph);
  });
  // Guardrail on deck
  g.fillStyle(0x1c2438, 0.80); g.fillRect(0, 105, 300, 3);
  g.fillStyle(0x2a3450, 0.50); g.fillRect(0, 103, 300, 2);
  // Highway direction sign (green)
  g.fillStyle(0x063014, 1);    g.fillRoundedRect(36, 68, 96, 32, 3);
  g.lineStyle(2, 0x0c5025, 0.85); g.strokeRoundedRect(36, 68, 96, 32, 3);
  g.fillStyle(0xffffff, 0.68);
  g.fillTriangle(118, 78, 128, 84, 118, 90);
  g.fillRect(106, 82, 13, 4);
  // Sign text (simplified dot pattern)
  g.fillStyle(0xffffff, 0.50);
  g.fillRect(42, 76, 20, 3); g.fillRect(42, 82, 14, 3); g.fillRect(42, 88, 20, 3);
  // Speed limit disc (red circle)
  g.fillStyle(0x0d0d18, 1);   g.fillCircle(244, 87, 18);
  g.lineStyle(2.5, 0xcc1818, 0.9); g.strokeCircle(244, 87, 18);
  g.fillStyle(0xffffff, 0.65);
  g.fillRect(237, 82, 14, 3); g.fillRect(240, 85, 8, 3); g.fillRect(237, 88, 14, 3);
  // Expansion joints
  g.lineStyle(1, 0x141828, 0.60);
  g.lineBetween(80, 108, 80, 124);
  g.lineBetween(160, 108, 160, 124);
  g.lineBetween(240, 108, 240, 124);
  g.generateTexture('l3_bg_highway', 300, 200);
  } // end if !l3_bg_highway

  // ── COIN (20×20) — always procedural ─────────────────────────────────────
  g.clear();
  g.fillStyle(0xf0c020, 1); g.fillCircle(10, 10, 10);
  g.fillStyle(0xfce060, 0.65); g.fillCircle(8, 8, 6);
  g.fillStyle(0xf8e840, 0.35); g.fillCircle(7, 7, 3);
  g.fillStyle(0x8a6010, 0.5);  g.fillRect(9, 4, 2, 12); g.fillRect(6, 9, 8, 2);
  g.generateTexture('l3_coin', 20, 20);

  // ── MEDKIT (28×28) ───────────────────────────────────────────────────────
  g.clear();
  g.fillStyle(0xeeeeee, 1); g.fillRoundedRect(0, 0, 28, 28, 4);
  g.fillStyle(0xdd2222, 1); g.fillRect(11, 4, 6, 20); g.fillRect(4, 11, 20, 6);
  g.fillStyle(0xff5555, 0.4); g.fillRect(12, 5, 3, 8);
  if (!scene.textures.exists('l3_medkit')) g.generateTexture('l3_medkit', 28, 28);

  // ── NITRO BOOST (22×26) ──────────────────────────────────────────────────
  g.clear();
  g.fillStyle(0x1144ff, 1); g.fillTriangle(11, 0, 0, 18, 22, 18);
  g.fillStyle(0x4488ff, 0.6); g.fillTriangle(11, 4, 4, 14, 18, 14);
  g.fillStyle(0xffcc00, 1); g.fillRect(5, 18, 12, 8);
  g.fillStyle(0xffffff, 0.4); g.fillRect(6, 19, 4, 4);
  g.generateTexture('l3_nitro', 22, 26);

  // ── HOSPITAL BACKGROUND (800×450) ────────────────────────────────────────
  g.clear();
  g.fillStyle(0x0d1620, 1); g.fillRect(0, 0, W, H);
  g.fillStyle(0x101a2a, 1);
  for (let y = 300; y < H; y += 30)
    for (let x = 0; x < W; x += 60) g.fillRect(x + 1, y + 1, 58, 28);
  g.fillStyle(0x0a1420, 0.9);
  for (let y = 300; y < H; y += 30) g.fillRect(0, y, W, 1);
  for (let x = 0; x < W; x += 60) g.fillRect(x, 300, 1, H - 300);
  g.fillStyle(0x0d1828, 1); g.fillRect(0, 0, W, 302);
  g.fillStyle(0x111e30, 0.8);
  for (let x = 0; x < W; x += 80) g.fillRect(x + 2, 20, 76, 260);
  g.lineStyle(1, 0x1a2c40, 0.6);
  for (let x = 0; x < W; x += 80) g.strokeRect(x + 2, 20, 76, 260);
  for (let x = 100; x < W; x += 200) {
    g.fillStyle(0x283848, 1); g.fillRect(x - 40, 0, 80, 12);
    g.fillStyle(0x88ccff, 0.25); g.fillRect(x - 38, 12, 76, 4);
    g.fillStyle(0x88ccff, 0.04);
    g.fillTriangle(x - 30, 16, x + 30, 16, x + 80, H / 2);
    g.fillTriangle(x - 30, 16, x + 30, 16, x - 80, H / 2);
  }
  if (!scene.textures.exists('l3_hospital_bg')) g.generateTexture('l3_hospital_bg', W, H);

  // ── CORRECT MEDICINE BOTTLE (30×50) ──────────────────────────────────────
  g.clear();
  g.fillStyle(0x336633, 1); g.fillRoundedRect(4, 8, 22, 38, 3);
  g.fillStyle(0x449944, 0.45); g.fillRect(6, 10, 10, 34);
  g.fillStyle(0x224422, 1); g.fillRoundedRect(2, 4, 26, 8, 2);
  g.fillStyle(0xeeffee, 0.95); g.fillRect(7, 18, 16, 16);
  g.fillStyle(0x226622, 1); g.fillRect(14, 20, 2, 12); g.fillRect(10, 25, 10, 2);
  if (!scene.textures.exists('l3_med_ok')) g.generateTexture('l3_med_ok', 30, 50);

  // ── WRONG MEDICINE BOTTLE (30×50) ────────────────────────────────────────
  g.clear();
  g.fillStyle(0x663333, 1); g.fillRoundedRect(4, 8, 22, 38, 3);
  g.fillStyle(0x994444, 0.45); g.fillRect(6, 10, 10, 34);
  g.fillStyle(0x442222, 1); g.fillRoundedRect(2, 4, 26, 8, 2);
  g.fillStyle(0xffeeee, 0.95); g.fillRect(7, 18, 16, 16);
  g.fillStyle(0x882222, 1);
  g.fillRect(9, 22, 12, 2); g.fillRect(9, 29, 12, 2);
  g.fillRect(9, 22, 2, 10); g.fillRect(19, 22, 2, 10);
  if (!scene.textures.exists('l3_med_wrong')) g.generateTexture('l3_med_wrong', 30, 50);

  // ── SYRINGE (90×30) ──────────────────────────────────────────────────────
  g.clear();
  g.fillStyle(0xdddddd, 0.9); g.fillRoundedRect(0, 8, 70, 14, 4);
  g.fillStyle(0x88aacc, 0.7); g.fillRect(4, 10, 50, 10);
  g.fillStyle(0xff4444, 0.8); g.fillRect(4, 10, 22, 10);
  g.fillStyle(0x606060, 1);   g.fillRect(70, 10, 16, 10);
  g.fillStyle(0xaaaaaa, 1);   g.fillRect(0, 13, 8, 4);
  if (!scene.textures.exists('l3_syringe')) g.generateTexture('l3_syringe', 90, 30);

  // ── INJECTION TARGET (40×40) ─────────────────────────────────────────────
  g.clear();
  g.lineStyle(3, 0x88ff88, 0.9); g.strokeCircle(20, 20, 18);
  g.lineStyle(1.5, 0x44ff44, 0.5); g.strokeCircle(20, 20, 10);
  g.fillStyle(0x44ff44, 0.15); g.fillCircle(20, 20, 18);
  g.fillStyle(0x44ff44, 0.35); g.fillCircle(20, 20, 6);
  g.generateTexture('l3_inject_spot', 40, 40);

  // ── EKG SCREEN BG (200×120) ──────────────────────────────────────────────
  g.clear();
  g.fillStyle(0x061a10, 1); g.fillRoundedRect(0, 0, 200, 120, 8);
  g.lineStyle(1, 0x0d3020, 0.6);
  for (let yi = 0; yi < 7; yi++) g.lineBetween(0, yi * 20, 200, yi * 20);
  for (let xi = 0; xi < 11; xi++) g.lineBetween(xi * 20, 0, xi * 20, 120);
  if (!scene.textures.exists('l3_ekg_screen')) g.generateTexture('l3_ekg_screen', 200, 120);

  // ── PUPPY (54×44) ────────────────────────────────────────────────────────
  g.clear();
  g.fillStyle(0x9a6020, 1); g.fillEllipse(26, 24, 52, 26);
  g.fillStyle(0xc07e30, 0.8); g.fillEllipse(24, 22, 44, 18);
  g.fillStyle(0xb07028, 1);   g.fillCircle(10, 18, 10);
  g.fillStyle(0xc07e30, 0.7); g.fillCircle(9, 17, 7);
  g.fillStyle(0x8a5020, 1);   g.fillEllipse(5, 14, 8, 14);
  g.fillStyle(0x060200, 1);   g.fillCircle(7, 16, 3); g.fillEllipse(3, 20, 5, 4);
  g.fillStyle(0xb07028, 1);   g.fillRect(16, 30, 6, 14); g.fillRect(30, 30, 6, 14);
  g.fillStyle(0x8a5020, 0.7); g.fillEllipse(48, 20, 8, 18);
  g.generateTexture('l3_puppy', 54, 44);

  // ── DOG BOWL (60×38) ─────────────────────────────────────────────────────
  g.clear();
  g.fillStyle(0x2244aa, 1);   g.fillEllipse(30, 28, 60, 28);
  g.fillStyle(0x1a3488, 1);   g.fillEllipse(30, 26, 50, 20);
  g.fillStyle(0xffcc44, 0.8); g.fillEllipse(30, 24, 44, 16);
  g.fillStyle(0xeeaa22, 0.55); g.fillEllipse(26, 22, 22, 10);
  g.fillStyle(0x1a3488, 0.5); g.fillRect(5, 32, 50, 6);
  if (!scene.textures.exists('l3_bowl')) g.generateTexture('l3_bowl', 60, 38);

  // ── OXYGEN MASK (60×70) ──────────────────────────────────────────────────
  g.clear();
  g.fillStyle(0x8899bb, 0.9); g.fillEllipse(30, 26, 60, 50);
  g.fillStyle(0x6688aa, 0.7); g.fillEllipse(30, 24, 52, 40);
  g.fillStyle(0xaabbcc, 0.4); g.fillEllipse(22, 18, 26, 20);
  g.fillStyle(0x446688, 1);   g.fillRect(26, 46, 8, 10);
  g.lineStyle(2, 0x334466, 0.8); g.lineBetween(30, 56, 30, 70);
  if (!scene.textures.exists('l3_oxygen')) g.generateTexture('l3_oxygen', 60, 70);

  // ── VITALS PANEL BG (160×110) ────────────────────────────────────────────
  g.clear();
  g.fillStyle(0x0a1820, 1);   g.fillRoundedRect(0, 0, 160, 110, 8);
  g.lineStyle(1.5, 0x1e4060, 0.8); g.strokeRoundedRect(0, 0, 160, 110, 8);
  g.fillStyle(0x0e2030, 0.8); g.fillRect(8, 28, 144, 2); g.fillRect(8, 64, 144, 2);
  if (!scene.textures.exists('l3_vitals_bg')) g.generateTexture('l3_vitals_bg', 160, 110);

  if (!scene.textures.exists('l3_hosp_sign')) {
  // ── HOSPITAL SIGN POST (96×52) ──────────────────────────────────────────────
  g.clear();
  g.fillStyle(0x0a4a1a, 1); g.fillRoundedRect(0, 0, 96, 38, 5);
  g.lineStyle(2.5, 0x44dd44, 1); g.strokeRoundedRect(0, 0, 96, 38, 5);
  g.fillStyle(0x44ff88, 1);
  g.fillRect(8,  8,  6, 22); g.fillRect(8,  17, 22, 6); g.fillRect(24, 8,  6, 22);
  g.fillRect(50, 10, 10, 18); g.fillRect(44, 16, 22, 6);
  g.fillStyle(0xf5c87a, 1);
  g.fillTriangle(80, 10, 94, 19, 80, 28);
  g.fillRect(68, 17, 13, 4);
  g.fillStyle(0x5a4820, 1); g.fillRect(44, 38, 8, 14);
  g.generateTexture('l3_hosp_sign', 96, 52);
  } // end if !l3_hosp_sign

  g.destroy();
}
