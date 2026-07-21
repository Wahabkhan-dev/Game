import Phaser from 'phaser';

// ════════════════════════════════════════════════════════════════════════════
// LEVEL 8 — PUPPY CARE DAY  (procedural WebGL placeholder art)
//
// Every texture here is generated at runtime with Phaser.Graphics so the level
// is fully playable BEFORE any final artwork exists. Each key documented here
// maps 1:1 to an entry in LEVEL8_ASSET_GUIDE.md, so final PNGs can later be
// dropped in (via a preload() that evicts the procedural placeholder) with no
// gameplay changes. Theme: bright, sunny, cheerful daytime — deliberately
// distinct from Level 7's stormy night.
// ════════════════════════════════════════════════════════════════════════════
export function generateL8Assets(scene) {
  // Guard — run once per session.
  if (scene.textures.exists('l8_ready')) return;
  const g = scene.make.graphics({ add: false });
  const gen = (k, w, h) => { if (!scene.textures.exists(k)) g.generateTexture(k, w, h); g.clear(); };

  // vertical gradient fill helper
  const grad = (w, h, top, bot) => {
    const a = Phaser.Display.Color.ValueToColor(top), b = Phaser.Display.Color.ValueToColor(bot);
    for (let y = 0; y < h; y++) {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(a, b, 100, Math.floor(y / h * 100));
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
      g.fillRect(0, y, w, 1);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // SHARED FX / UI
  // ══════════════════════════════════════════════════════════════════════════
  // Sparkle (4-point star)
  g.fillStyle(0xffffff, 1);
  g.fillTriangle(12, 0, 9, 9, 15, 9); g.fillTriangle(12, 24, 9, 15, 15, 15);
  g.fillTriangle(0, 12, 9, 9, 9, 15); g.fillTriangle(24, 12, 15, 9, 15, 15);
  g.fillStyle(0xfff3aa, 0.95); g.fillCircle(12, 12, 3.2);
  gen('l8_spark', 24, 24);

  // Gold rating star
  {
    const cx = 18, cy = 18, R = 16, r = 7, pts = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5; const rad = i % 2 ? r : R; pts.push({ x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad }); }
    g.fillStyle(0xffd23a, 1); g.fillPoints(pts, true);
    g.lineStyle(2, 0xd49810, 1); g.strokePoints(pts, true);
    g.fillStyle(0xfff0a0, 0.6); g.fillCircle(14, 13, 4);
  }
  gen('l8_star', 36, 36);

  // Heart
  g.fillStyle(0xff5577, 1);
  g.fillCircle(12, 13, 9); g.fillCircle(24, 13, 9); g.fillTriangle(3, 16, 33, 16, 18, 34);
  g.fillStyle(0xff9ab0, 0.6); g.fillCircle(10, 10, 3);
  gen('l8_heart', 36, 36);

  // Soft cloud (parallax)
  g.fillStyle(0xffffff, 0.95);
  g.fillEllipse(40, 38, 60, 34); g.fillEllipse(72, 32, 56, 40); g.fillEllipse(96, 40, 50, 30);
  g.fillStyle(0xeaf2ff, 0.9); g.fillEllipse(60, 46, 110, 22);
  gen('l8_cloud', 130, 64);

  // Thought bubble (for puppy food request)
  g.fillStyle(0xffffff, 0.98); g.fillRoundedRect(4, 4, 72, 50, 14);
  g.lineStyle(2.5, 0xbfc8d4, 1); g.strokeRoundedRect(4, 4, 72, 50, 14);
  g.fillStyle(0xffffff, 0.98); g.fillCircle(20, 60, 6); g.fillCircle(12, 70, 3.5);
  g.lineStyle(2, 0xbfc8d4, 1); g.strokeCircle(20, 60, 6); g.strokeCircle(12, 70, 3.5);
  gen('l8_bubble', 84, 78);

  // Drop slot (dashed-look placeholder target for decorate)
  g.fillStyle(0xffffff, 0.10); g.fillRoundedRect(2, 2, 96, 96, 14);
  g.lineStyle(3, 0xffffff, 0.5);
  // pseudo-dashed border
  for (let x = 6; x < 94; x += 14) { g.lineBetween(x, 3, x + 8, 3); g.lineBetween(x, 97, x + 8, 97); }
  for (let y = 6; y < 94; y += 14) { g.lineBetween(3, y, 3, y + 8); g.lineBetween(97, y, 97, y + 8); }
  // paw hint
  g.fillStyle(0xffffff, 0.22);
  g.fillEllipse(50, 56, 22, 18);
  g.fillCircle(40, 40, 5); g.fillCircle(50, 36, 5); g.fillCircle(60, 40, 5);
  gen('l8_slot', 100, 100);

  // ══════════════════════════════════════════════════════════════════════════
  // BACKGROUNDS
  // ══════════════════════════════════════════════════════════════════════════
  // Bright day sky 800×450 — sun + soft clouds baked in
  grad(800, 450, 0x7fc4f5, 0xd8f0ff);
  g.fillStyle(0xfff3b0, 0.55); g.fillCircle(680, 90, 96);   // sun glow
  g.fillStyle(0xfff6c8, 1);   g.fillCircle(680, 90, 54);    // sun
  g.fillStyle(0xffffff, 0.85);
  g.fillEllipse(160, 110, 130, 44); g.fillEllipse(210, 96, 90, 50); g.fillEllipse(250, 112, 80, 38);
  g.fillEllipse(470, 70, 120, 40); g.fillEllipse(520, 60, 80, 44);
  gen('l8_sky', 800, 450);

  // Park hills band (tileable) 400×240 — layered rolling green
  g.fillStyle(0x9bd86a, 1); g.fillRect(0, 120, 400, 120);
  g.fillStyle(0x86cf57, 1);
  for (let x = -40; x < 440; x += 160) g.fillEllipse(x, 150, 220, 120);
  g.fillStyle(0x73c047, 1);
  for (let x = 40; x < 440; x += 200) g.fillEllipse(x, 200, 260, 140);
  // little trees on the band
  for (let x = 30; x < 400; x += 90) {
    g.fillStyle(0x5a3b1e, 1); g.fillRect(x - 3, 150, 6, 28);
    g.fillStyle(0x4f9c3a, 1); g.fillCircle(x, 142, 18); g.fillCircle(x - 12, 150, 13); g.fillCircle(x + 12, 150, 13);
  }
  gen('l8_hills', 400, 240);

  // Grass / path ground tile 128×80 (tileable)
  grad(128, 80, 0x7cc24a, 0x5a9c33);
  g.fillStyle(0x6aae3e, 1); g.fillRect(0, 0, 128, 10);
  g.fillStyle(0x4f8c2c, 0.5); for (let i = 0; i < 14; i++) g.fillRect(Phaser.Math.Between(0, 128), Phaser.Math.Between(14, 70), 2, 6);
  // little flowers
  for (let i = 0; i < 4; i++) {
    const fx = Phaser.Math.Between(8, 120), fy = Phaser.Math.Between(20, 60);
    g.fillStyle([0xff8fb0, 0xfff06a, 0xffffff][i % 3], 1);
    for (let a = 0; a < 5; a++) { const an = a / 5 * Math.PI * 2; g.fillCircle(fx + Math.cos(an) * 3, fy + Math.sin(an) * 3, 2); }
    g.fillStyle(0xffd23a, 1); g.fillCircle(fx, fy, 1.6);
  }
  gen('l8_ground', 128, 80);

  // Feeding-room background 800×450 — bright cozy indoor
  grad(800, 450, 0xfff0d8, 0xffe0bc);
  g.fillStyle(0xffe9c2, 1); g.fillRect(0, 0, 800, 270);
  // wainscot line
  g.fillStyle(0xe9c79a, 1); g.fillRect(0, 262, 800, 8);
  // window
  g.fillStyle(0xbfe8f5, 1); g.fillRoundedRect(80, 50, 150, 120, 8);
  g.fillStyle(0xe8f8ff, 0.7); g.fillRect(86, 56, 138, 46);
  g.lineStyle(5, 0xfff6e6, 1); g.strokeRoundedRect(80, 50, 150, 120, 8); g.lineBetween(155, 50, 155, 170); g.lineBetween(80, 110, 230, 110);
  // hanging picture
  g.fillStyle(0x9a6a3a, 1); g.fillRoundedRect(560, 64, 90, 70, 6);
  g.fillStyle(0xbfe8c8, 1); g.fillRect(568, 72, 74, 54);
  g.fillStyle(0xffd23a, 1); g.fillCircle(600, 92, 10);
  // bunting
  for (let i = 0; i < 9; i++) { g.fillStyle([0xff8fb0, 0xfff06a, 0x8fd0ff, 0xb0f0a0][i % 4], 1); g.fillTriangle(300 + i * 26, 30, 320 + i * 26, 30, 310 + i * 26, 50); }
  // wood floor
  g.fillStyle(0xd9a86a, 1); g.fillRect(0, 270, 800, 180);
  g.fillStyle(0xc9924f, 1); for (let y = 290; y < 450; y += 34) g.fillRect(0, y, 800, 3);
  g.lineStyle(1, 0xb07c3e, 0.5); for (let x = 0; x < 800; x += 70) g.lineBetween(x, 270, x + 18, 450);
  gen('l8_feed_bg', 800, 450);

  // Decorate-room background 800×450 — empty puppy room to furnish
  grad(800, 450, 0xfbe7cf, 0xf3d2ad);
  g.fillStyle(0xf6dcbb, 1); g.fillRect(0, 0, 800, 280);
  // plank wall hints
  g.lineStyle(1, 0xe2bd8e, 0.5); for (let x = 0; x < 800; x += 96) g.lineBetween(x, 0, x, 280);
  // window with curtains
  g.fillStyle(0xbfe8f5, 1); g.fillRoundedRect(520, 46, 170, 130, 8);
  g.fillStyle(0xe8f8ff, 0.7); g.fillRect(528, 52, 154, 50);
  g.lineStyle(6, 0xfff6e6, 1); g.strokeRoundedRect(520, 46, 170, 130, 8); g.lineBetween(605, 46, 605, 176);
  g.fillStyle(0xff9ab0, 0.9); g.fillTriangle(520, 40, 560, 40, 530, 130); g.fillTriangle(690, 40, 650, 40, 680, 130);
  // floor
  g.fillStyle(0xdcae72, 1); g.fillRect(0, 280, 800, 170);
  g.fillStyle(0xcb9a56, 1); for (let y = 300; y < 450; y += 32) g.fillRect(0, y, 800, 3);
  g.lineStyle(1, 0xb3823f, 0.5); for (let x = 0; x < 800; x += 64) g.lineBetween(x, 280, x + 16, 450);
  gen('l8_room_bg', 800, 450);

  // Cozy finished cottage (run end marker) 200×180
  g.fillStyle(0x000000, 0.12); g.fillEllipse(100, 172, 170, 16);
  g.fillStyle(0xf2d2a8, 1); g.fillRect(30, 80, 140, 92);          // body
  g.lineStyle(1, 0xd9b486, 0.7); for (let y = 92; y < 172; y += 16) g.lineBetween(30, y, 170, y);
  g.fillStyle(0xc94f4f, 1); g.fillTriangle(14, 84, 100, 22, 186, 84); // roof
  g.fillStyle(0xb03e3e, 1); g.fillRect(14, 80, 172, 8);
  g.fillStyle(0x8a5a32, 1); g.fillRoundedRect(82, 120, 36, 52, 4); // door
  g.fillStyle(0xffd23a, 1); g.fillCircle(110, 146, 2.5);
  g.fillStyle(0xbfe8f5, 1); g.fillRect(46, 100, 28, 26); g.fillRect(126, 100, 28, 26); // windows
  g.lineStyle(2, 0xfff6e6, 1); g.strokeRect(46, 100, 28, 26); g.strokeRect(126, 100, 28, 26);
  g.fillStyle(0xff9ab0, 1); g.fillCircle(56, 70, 6); g.fillCircle(150, 66, 6); // little hearts/flowers on roof
  gen('l8_house', 200, 180);

  // ══════════════════════════════════════════════════════════════════════════
  // CHARACTERS
  // ══════════════════════════════════════════════════════════════════════════
  // Caretaker girl (Gleeda) — drawn in several poses.
  // Helper draws the figure into g; w=72 h=112, ground at y≈108.
  const girlBase = (legL, legR, armSwing) => {
    g.fillStyle(0x000000, 0.14); g.fillEllipse(36, 108, 46, 10);            // shadow
    // legs (denim)
    g.fillStyle(0x37598a, 1);
    g.fillRoundedRect(28 + legL.x, 76, 9, 28, 4); g.fillRoundedRect(38 + legR.x, 76, 9, 28, 4);
    // shoes
    g.fillStyle(0xffffff, 1);
    g.fillEllipse(31 + legL.x, 106, 14, 7); g.fillEllipse(43 + legR.x, 106, 14, 7);
    g.fillStyle(0xff9ab0, 1); g.fillEllipse(31 + legL.x, 108, 14, 4); g.fillEllipse(43 + legR.x, 108, 14, 4);
    // body (teal scrub top)
    g.fillStyle(0x29a39a, 1); g.fillRoundedRect(20, 44, 32, 40, 11);
    g.fillStyle(0x33b8ae, 0.7); g.fillRoundedRect(24, 47, 8, 32, 4);
    // arms
    g.fillStyle(0x29a39a, 1);
    g.fillRoundedRect(14, 48 + armSwing, 9, 24, 4); g.fillRoundedRect(49, 48 - armSwing, 9, 24, 4);
    g.fillStyle(0xf0c8a0, 1); g.fillCircle(18, 72 + armSwing, 5); g.fillCircle(53, 72 - armSwing, 5); // hands
    // head
    g.fillStyle(0xf0c8a0, 1); g.fillCircle(36, 30, 16);
    // hair (brown) — bun + side framing
    g.fillStyle(0x6e4626, 1);
    g.fillCircle(36, 13, 11);                 // top bun
    g.fillEllipse(22, 28, 12, 22); g.fillEllipse(50, 28, 12, 22);  // side hair
    g.fillRect(24, 14, 24, 10);
    g.fillStyle(0x5a3820, 1); g.fillCircle(36, 11, 6);
    // face
    g.fillStyle(0x3a2418, 1); g.fillCircle(31, 31, 2.4); g.fillCircle(41, 31, 2.4);
    g.fillStyle(0xff9ab0, 0.55); g.fillCircle(28, 36, 3); g.fillCircle(44, 36, 3);
    g.lineStyle(2, 0x8a4a3a, 1); g.beginPath(); g.arc(36, 35, 5, 0.2, Math.PI - 0.2, false); g.strokePath();
    g.fillStyle(0xff9ab0, 1); g.fillCircle(48, 12, 3); // hair clip
  };
  girlBase({ x: -3 }, { x: 3 }, 0); gen('l8_runner_idle', 72, 112);
  girlBase({ x: -8 }, { x: 9 }, 4); gen('l8_runner_run1', 72, 112);
  girlBase({ x: 7 }, { x: -7 }, -4); gen('l8_runner_run2', 72, 112);
  // jump pose (legs tucked, arms up)
  {
    g.fillStyle(0x000000, 0.10); g.fillEllipse(36, 108, 34, 7);
    g.fillStyle(0x37598a, 1); g.fillRoundedRect(26, 74, 10, 20, 5); g.fillRoundedRect(38, 78, 10, 18, 5);
    g.fillStyle(0xffffff, 1); g.fillEllipse(30, 94, 14, 7); g.fillEllipse(44, 96, 14, 7);
    g.fillStyle(0x29a39a, 1); g.fillRoundedRect(20, 44, 32, 38, 11);
    g.fillStyle(0x29a39a, 1); g.fillRoundedRect(12, 30, 9, 22, 4); g.fillRoundedRect(51, 30, 9, 22, 4); // arms up
    g.fillStyle(0xf0c8a0, 1); g.fillCircle(16, 30, 5); g.fillCircle(55, 30, 5);
    g.fillStyle(0xf0c8a0, 1); g.fillCircle(36, 30, 16);
    g.fillStyle(0x6e4626, 1); g.fillCircle(36, 13, 11); g.fillEllipse(22, 28, 12, 22); g.fillEllipse(50, 28, 12, 22); g.fillRect(24, 14, 24, 10);
    g.fillStyle(0x3a2418, 1); g.fillCircle(31, 31, 2.4); g.fillCircle(41, 31, 2.4);
    g.lineStyle(2, 0x8a4a3a, 1); g.beginPath(); g.arc(36, 34, 5, 0, Math.PI, false); g.strokePath(); // open smile
  }
  gen('l8_runner_jump', 72, 112);
  // slide pose (crouched low + leaning) — wider, shorter texture 104×72, ground y≈68
  {
    g.fillStyle(0x000000, 0.14); g.fillEllipse(54, 68, 80, 10);
    // legs forward
    g.fillStyle(0x37598a, 1); g.fillRoundedRect(60, 40, 30, 12, 6); g.fillRoundedRect(60, 52, 26, 11, 6);
    g.fillStyle(0xffffff, 1); g.fillEllipse(90, 46, 16, 8); g.fillEllipse(86, 60, 16, 8);
    // body leaning back
    g.fillStyle(0x29a39a, 1); g.fillRoundedRect(24, 34, 42, 26, 12);
    g.fillStyle(0x29a39a, 1); g.fillRoundedRect(20, 30, 22, 9, 4); // back arm
    g.fillStyle(0xf0c8a0, 1); g.fillCircle(20, 34, 5);
    // head
    g.fillStyle(0xf0c8a0, 1); g.fillCircle(30, 24, 15);
    g.fillStyle(0x6e4626, 1); g.fillCircle(24, 12, 10); g.fillEllipse(18, 24, 11, 18); g.fillRect(20, 12, 20, 9);
    g.fillStyle(0x3a2418, 1); g.fillCircle(34, 24, 2.4); g.fillCircle(26, 25, 2.4);
    g.lineStyle(2, 0x8a4a3a, 1); g.beginPath(); g.arc(32, 28, 4, 0, Math.PI, false); g.strokePath();
  }
  gen('l8_runner_slide', 104, 72);

  // Mother dog Gamma 170×120 (brown & white)
  g.fillStyle(0x000000, 0.14); g.fillEllipse(86, 112, 150, 16);
  g.fillStyle(0x9a6a38, 1); g.fillEllipse(92, 70, 140, 66);     // body
  g.fillStyle(0xf2e4cf, 1); g.fillEllipse(96, 84, 120, 40);     // belly/chest white
  g.fillStyle(0xa6743e, 1); g.fillCircle(42, 54, 36);            // head
  g.fillStyle(0xf2e4cf, 1); g.fillEllipse(34, 66, 34, 26);       // muzzle white
  g.fillStyle(0x6e4a26, 1); g.fillEllipse(18, 28, 22, 34); g.fillEllipse(62, 28, 20, 32); // ears
  g.fillStyle(0x2a160a, 1); g.fillEllipse(20, 62, 11, 8);        // nose
  g.fillStyle(0x2a1a10, 1); g.fillCircle(34, 48, 5); g.fillCircle(52, 48, 5); // eyes
  g.fillStyle(0xffffff, 0.8); g.fillCircle(35, 46, 2); g.fillCircle(53, 46, 2);
  g.lineStyle(2, 0x2a1a10, 1); g.beginPath(); g.arc(28, 70, 6, 0, Math.PI, false); g.strokePath(); // smile
  g.fillStyle(0xf2e4cf, 1); g.fillEllipse(60, 104, 22, 14); g.fillEllipse(112, 104, 22, 14); // paws
  g.fillStyle(0x9a6a38, 1); g.fillEllipse(160, 60, 28, 16);     // tail
  gen('l8_gamma', 170, 120);

  // Puppy 96×84 (tintable base — light tan; sit pose, facing front)
  g.fillStyle(0x000000, 0.12); g.fillEllipse(48, 78, 72, 12);
  g.fillStyle(0xe8c79a, 1); g.fillEllipse(48, 56, 60, 44);       // body
  g.fillStyle(0xfdf0dc, 1); g.fillEllipse(48, 66, 38, 26);       // belly
  g.fillStyle(0xeccfa4, 1); g.fillCircle(48, 34, 26);            // head
  g.fillStyle(0xc89a64, 1); g.fillEllipse(26, 22, 16, 24); g.fillEllipse(70, 22, 16, 24); // ears
  g.fillStyle(0xfdf0dc, 1); g.fillEllipse(48, 44, 26, 18);       // muzzle
  g.fillStyle(0x2a160a, 1); g.fillEllipse(48, 40, 8, 6);         // nose
  g.fillStyle(0x2a1a10, 1); g.fillCircle(38, 30, 5); g.fillCircle(58, 30, 5); // eyes
  g.fillStyle(0xffffff, 0.9); g.fillCircle(40, 28, 2); g.fillCircle(60, 28, 2);
  g.lineStyle(2, 0x2a1a10, 1); g.beginPath(); g.arc(48, 46, 5, 0, Math.PI, false); g.strokePath(); // smile
  g.fillStyle(0xfdf0dc, 1); g.fillEllipse(34, 74, 16, 10); g.fillEllipse(62, 74, 16, 10); // front paws
  gen('l8_puppy', 96, 84);

  // ══════════════════════════════════════════════════════════════════════════
  // FOOD ITEMS (collectible + feeding) — 7 kinds
  // Quality pass: every item gets a soft contact shadow, a clean dark outline,
  // gradient-style shading (lighter top / darker base) and a glossy highlight.
  // ══════════════════════════════════════════════════════════════════════════
  const OUT = 0x4a3526;   // shared warm dark outline colour
  const gloss = (x, y, rx, ry) => { g.fillStyle(0xffffff, 0.4); g.fillEllipse(x, y, rx, ry); };

  // Bone biscuit — rounded knobs, shaded, outlined
  g.fillStyle(0x000000, 0.14); g.fillEllipse(32, 40, 50, 8);                 // shadow
  g.lineStyle(2.5, OUT, 1);
  g.fillStyle(0xf6e6c2, 1);
  [ [15,15],[15,29],[49,15],[49,29] ].forEach(([cx,cy]) => { g.fillCircle(cx, cy, 9.5); g.strokeCircle(cx, cy, 9.5); });
  g.fillStyle(0xf6e6c2, 1); g.fillRect(15, 15, 34, 14);
  g.fillStyle(0xe8d2a4, 1); g.fillRect(15, 24, 34, 5);                       // lower shade
  g.lineStyle(2.5, OUT, 1); g.lineBetween(15, 15, 49, 15); g.lineBetween(15, 29, 49, 29);
  gloss(22, 12, 10, 4);
  gen('l8_food_bone', 64, 44);

  // Milk bottle — glass body, milk fill, cap, label
  g.fillStyle(0x000000, 0.14); g.fillEllipse(26, 60, 30, 7);                 // shadow
  g.fillStyle(0xeaf4ff, 1); g.fillRoundedRect(13, 16, 26, 42, 9);           // glass
  g.fillStyle(0xffffff, 1); g.fillRoundedRect(15, 30, 22, 26, 6);          // milk
  g.fillStyle(0xf0f7ff, 1); g.fillRect(15, 30, 22, 4);                      // milk top sheen
  g.fillStyle(0x6ab8f0, 1); g.fillRoundedRect(17, 12, 18, 9, 3);           // cap
  g.fillStyle(0x4a90d0, 1); g.fillRect(17, 8, 18, 5);
  g.fillStyle(0xff9ab0, 1); g.fillRoundedRect(18, 36, 16, 12, 3);          // label
  g.fillStyle(0xffffff, 1); g.fillCircle(26, 42, 3);                        // label paw dot
  g.lineStyle(2.5, 0x6f87a0, 1); g.strokeRoundedRect(13, 16, 26, 42, 9);
  gloss(20, 24, 5, 14);
  gen('l8_food_milk', 52, 66);

  // Food bowl (kibble) — glossy bowl heaped with kibble
  g.fillStyle(0x000000, 0.16); g.fillEllipse(34, 52, 58, 9);
  g.fillStyle(0xff8a66, 1); g.fillEllipse(34, 40, 62, 24);                   // bowl
  g.fillStyle(0xe85f3f, 1); g.fillEllipse(34, 46, 62, 14);                   // bowl base shade
  g.lineStyle(2.5, 0xb84a2e, 1); g.strokeEllipse(34, 40, 62, 24);
  g.fillStyle(0xa8743e, 1); g.fillEllipse(34, 33, 50, 18);                   // kibble mound
  for (let i = 0; i < 10; i++) { g.fillStyle(i % 2 ? 0x8a5d2e : 0x6f4a24, 1); g.fillCircle(14 + i * 4.4, 30 + (i % 3) * 4, 3.3); }
  gloss(22, 36, 12, 5);
  gen('l8_food_bowl', 68, 58);

  // Food can — metal tin with paw label
  g.fillStyle(0x000000, 0.14); g.fillEllipse(30, 58, 38, 7);
  g.fillStyle(0xc8ced4, 1); g.fillRoundedRect(11, 14, 38, 40, 5);          // body
  g.fillStyle(0xe2e8ee, 1); g.fillEllipse(30, 14, 38, 9);                    // lid
  g.fillStyle(0xb4bcc4, 1); g.fillRect(11, 44, 38, 6);                       // base shade
  g.fillStyle(0xffcf5a, 1); g.fillRect(11, 24, 38, 20);                      // label band
  g.fillStyle(0xf0b840, 1); g.fillRect(11, 40, 38, 4);
  g.fillStyle(0x9a6a38, 1); g.fillCircle(30, 33, 6.5);                       // paw
  g.fillStyle(0x7d5328, 1); g.fillCircle(25, 28, 2); g.fillCircle(30, 26.5, 2); g.fillCircle(35, 28, 2);
  g.lineStyle(2.5, 0x8a9098, 1); g.strokeRoundedRect(11, 14, 38, 40, 5);
  gloss(18, 22, 4, 12);
  gen('l8_food_can', 60, 64);

  // Treat bag — crimped foil pouch with window
  g.fillStyle(0x000000, 0.14); g.fillEllipse(32, 66, 40, 7);
  g.fillStyle(0xffb24a, 1); g.fillRoundedRect(11, 16, 42, 48, 7);          // body
  g.fillStyle(0xffc873, 1); g.fillRoundedRect(14, 18, 10, 44, 4);          // sheen stripe
  g.fillStyle(0xf09a2e, 1); g.fillRect(11, 56, 42, 8);                       // base shade
  g.fillStyle(0xfff6e6, 1); g.fillRoundedRect(18, 30, 28, 22, 4);          // window
  g.fillStyle(0x9a6a38, 1); g.fillCircle(32, 41, 7);                         // paw logo
  g.fillStyle(0xffb24a, 1);                                                  // crimped top
  for (let i = 0; i < 4; i++) g.fillTriangle(11 + i * 11, 16, 16.5 + i * 11, 7, 22 + i * 11, 16);
  g.lineStyle(2.5, OUT, 1); g.strokeRoundedRect(11, 16, 42, 48, 7);
  gloss(20, 26, 4, 10);
  gen('l8_food_bag', 64, 70);

  // Meat / steak treat — juicy with bone end
  g.fillStyle(0x000000, 0.14); g.fillEllipse(30, 50, 46, 7);
  g.fillStyle(0xe07458, 1); g.fillEllipse(28, 28, 50, 34);                   // meat
  g.fillStyle(0xc4543c, 1); g.fillEllipse(28, 33, 46, 22);                   // lower shade
  g.lineStyle(2.5, 0x9a3f2c, 1); g.strokeEllipse(28, 28, 50, 34);
  g.fillStyle(0xf2e6d2, 1); g.fillCircle(50, 20, 8); g.fillCircle(50, 30, 8); // bone end
  g.lineStyle(2, 0xd8c4a8, 1); g.strokeCircle(50, 20, 8); g.strokeCircle(50, 30, 8);
  g.fillStyle(0xffb0a0, 0.7); g.fillEllipse(22, 22, 18, 9);                  // highlight
  gen('l8_food_meat', 64, 56);

  // Jar of treats — glass jar with lid, biscuits inside
  g.fillStyle(0x000000, 0.14); g.fillEllipse(32, 62, 36, 7);
  g.fillStyle(0xd8eef8, 0.85); g.fillRoundedRect(13, 16, 38, 44, 9);        // glass
  g.fillStyle(0xc6a06a, 1);                                                   // biscuits inside
  for (let i = 0; i < 6; i++) g.fillCircle(22 + (i % 3) * 10, 36 + Math.floor(i / 3) * 12, 5.5);
  g.fillStyle(0xb98a52, 1);
  for (let i = 0; i < 3; i++) g.fillCircle(22 + i * 10, 48, 5);
  g.fillStyle(0xff9ab0, 1); g.fillRoundedRect(11, 10, 42, 9, 3);            // lid
  g.fillStyle(0xe87f99, 1); g.fillRect(13, 16, 38, 3);
  g.lineStyle(2.5, 0x8fb0c4, 1); g.strokeRoundedRect(13, 16, 38, 44, 9);
  gloss(22, 26, 5, 14);
  gen('l8_food_jar', 64, 66);

  // ══════════════════════════════════════════════════════════════════════════
  // HOME ITEMS (collect + decorate) — 8 kinds matching ITEMS COLLECTED panel
  // ══════════════════════════════════════════════════════════════════════════
  // Puppy bed
  g.fillStyle(0x000000, 0.12); g.fillEllipse(50, 56, 88, 12);
  g.fillStyle(0x9a73c4, 1); g.fillEllipse(50, 44, 86, 30);       // outer cushion
  g.fillStyle(0x7d57ac, 1); g.fillEllipse(50, 40, 86, 26);
  g.fillStyle(0xc7a8e6, 1); g.fillEllipse(50, 42, 58, 18);       // inner pad
  gen('l8_item_bed', 100, 64);

  // Food station (bowl on mat)
  g.fillStyle(0x000000, 0.10); g.fillEllipse(46, 52, 80, 10);
  g.fillStyle(0xffcf5a, 1); g.fillEllipse(46, 46, 82, 18);       // mat
  g.fillStyle(0xff7a59, 1); g.fillEllipse(46, 36, 50, 20);       // bowl
  g.fillStyle(0x9a6a38, 1); g.fillEllipse(46, 32, 40, 14);       // food
  for (let i = 0; i < 6; i++) { g.fillStyle(0x7d5328, 1); g.fillCircle(30 + i * 6, 30 + (i % 2) * 4, 3); }
  gen('l8_item_foodstation', 92, 58);

  // Water station (blue bowl)
  g.fillStyle(0x000000, 0.10); g.fillEllipse(46, 52, 80, 10);
  g.fillStyle(0xbfe1ff, 1); g.fillEllipse(46, 46, 82, 18);       // mat
  g.fillStyle(0x4a9fe0, 1); g.fillEllipse(46, 36, 50, 20);       // bowl
  g.fillStyle(0x8fd0ff, 1); g.fillEllipse(46, 33, 40, 12);       // water
  g.fillStyle(0xffffff, 0.7); g.fillEllipse(38, 31, 12, 4);
  gen('l8_item_waterstation', 92, 58);

  // Toy basket — woven basket brimming with colourful toys (Puppy Toy pickup)
  g.fillStyle(0x000000, 0.16); g.fillEllipse(44, 59, 78, 10);
  g.fillStyle(0xff6a6a, 1); g.fillCircle(26, 22, 10); gloss(22, 18, 4, 3);   // red ball
  g.fillStyle(0x6ad0ff, 1); g.fillCircle(45, 17, 9);  gloss(41, 13, 3.5, 3); // blue ball
  g.fillStyle(0xfff06a, 1); g.fillCircle(62, 23, 8);  gloss(58, 19, 3, 2.5); // yellow ball
  g.fillStyle(0x8fd86a, 1); g.fillCircle(54, 14, 5);                          // green peek
  g.fillStyle(0xc28b4e, 1); g.fillRoundedRect(11, 26, 66, 32, 9);            // basket body
  g.fillStyle(0xa06f3a, 1); g.fillRoundedRect(11, 26, 66, 8, 9);             // rim shade
  g.lineStyle(2, 0x7a5326, 0.85);                                            // weave
  for (let x = 18; x < 78; x += 9) g.lineBetween(x, 30, x, 56);
  g.lineBetween(11, 40, 77, 40); g.lineBetween(11, 49, 77, 49);
  g.lineStyle(2.5, 0x5f3f1c, 1); g.strokeRoundedRect(11, 26, 66, 32, 9);
  gen('l8_item_toybasket', 88, 64);

  // Wall picture
  g.fillStyle(0xf6c45a, 1); g.fillRoundedRect(8, 8, 56, 48, 4); // frame
  g.fillStyle(0xfff3d0, 1); g.fillRect(15, 15, 42, 34);
  g.fillStyle(0x8fd0ff, 1); g.fillRect(15, 15, 42, 18);        // sky in pic
  g.fillStyle(0x73c047, 1); g.fillEllipse(36, 50, 50, 16);     // hill
  g.fillStyle(0xffd23a, 1); g.fillCircle(50, 22, 6);          // sun
  g.lineStyle(2, 0xd89c2e, 1); g.strokeRoundedRect(8, 8, 56, 48, 4);
  gen('l8_item_picture', 72, 64);

  // Potted plant
  g.fillStyle(0x000000, 0.10); g.fillEllipse(34, 60, 50, 8);
  g.fillStyle(0xd9694f, 1); g.fillRect(18, 40, 32, 22);        // pot
  g.fillStyle(0xc4543c, 1); g.fillRect(16, 38, 36, 8);
  g.fillStyle(0x4f9c3a, 1);
  g.fillEllipse(34, 24, 20, 30); g.fillEllipse(20, 30, 16, 24); g.fillEllipse(48, 30, 16, 24);
  g.fillStyle(0x5fb048, 0.7); g.fillEllipse(30, 22, 8, 16);
  gen('l8_item_plant', 68, 68);

  // Rug (round)
  g.fillStyle(0x000000, 0.08); g.fillEllipse(50, 36, 96, 22);
  g.fillStyle(0xf0a93a, 1); g.fillEllipse(50, 32, 96, 30);
  g.fillStyle(0xffd27a, 1); g.fillEllipse(50, 32, 70, 22);
  g.fillStyle(0xe8923a, 1); g.fillEllipse(50, 32, 44, 14);
  // paw print in middle
  g.fillStyle(0x9a6a38, 1); g.fillEllipse(50, 34, 14, 10); g.fillCircle(44, 26, 3); g.fillCircle(50, 24, 3); g.fillCircle(56, 26, 3);
  gen('l8_item_rug', 100, 64);

  // Play tunnel
  g.fillStyle(0x000000, 0.12); g.fillEllipse(50, 58, 84, 10);
  g.fillStyle(0x7d57ac, 1); g.fillEllipse(78, 36, 40, 44);      // far opening
  g.fillStyle(0x4a2f6e, 1); g.fillEllipse(78, 36, 26, 30);
  g.fillStyle(0x9a73c4, 1); g.fillRoundedRect(20, 16, 60, 42, 16); // body
  g.lineStyle(3, 0x7d57ac, 1); for (let x = 28; x < 80; x += 12) { g.beginPath(); g.arc(x, 37, 21, -Math.PI / 2, Math.PI / 2, false); g.strokePath(); }
  g.fillStyle(0x4a2f6e, 1); g.fillEllipse(22, 36, 30, 42);      // near opening
  g.fillStyle(0x33204e, 1); g.fillEllipse(22, 36, 18, 28);
  gen('l8_item_tunnel', 100, 64);

  // ══════════════════════════════════════════════════════════════════════════
  // OBSTACLES — ground (JUMP over) + overhead (SLIDE under)
  // ══════════════════════════════════════════════════════════════════════════
  // Flower pot (ground)
  g.fillStyle(0x000000, 0.12); g.fillEllipse(28, 58, 48, 8);
  g.fillStyle(0xd9694f, 1); g.fillRect(10, 34, 36, 24);
  g.fillStyle(0xc4543c, 1); g.fillRect(8, 30, 40, 8);
  g.fillStyle(0x4f9c3a, 1); g.fillRect(24, 18, 6, 14);
  g.fillStyle(0xff8fb0, 1); g.fillCircle(27, 14, 8);
  g.fillStyle(0xfff06a, 1); g.fillCircle(27, 14, 3);
  gen('l8_obs_pot', 56, 62);

  // Wooden crate (ground)
  g.fillStyle(0x000000, 0.12); g.fillEllipse(28, 54, 50, 8);
  g.fillStyle(0xc08a4a, 1); g.fillRoundedRect(6, 10, 44, 44, 4);
  g.fillStyle(0xa9743a, 1); g.fillRect(6, 10, 44, 6); g.fillRect(6, 48, 44, 6);
  g.lineStyle(3, 0x8a5e2e, 1); g.strokeRoundedRect(6, 10, 44, 44, 4); g.lineBetween(6, 10, 50, 54); g.lineBetween(50, 10, 6, 54);
  gen('l8_obs_crate', 56, 58);

  // Mud puddle (ground, flat — jump)
  g.fillStyle(0x6a4a2a, 0.8); g.fillEllipse(45, 14, 86, 22);
  g.fillStyle(0x4a3018, 0.7); g.fillEllipse(42, 12, 60, 14);
  g.fillStyle(0x8a6a3a, 0.5); g.fillEllipse(30, 10, 22, 6);
  gen('l8_obs_puddle', 92, 28);

  // Hanging banner (overhead — slide under)
  g.fillStyle(0x8a5e2e, 1); g.fillRect(0, 0, 6, 18); g.fillRect(114, 0, 6, 18); // poles top
  g.fillStyle(0x4a9fe0, 1); g.fillRoundedRect(10, 6, 100, 30, 6);              // banner cloth
  g.fillStyle(0x6ab0ee, 1); g.fillRect(14, 10, 92, 6);
  g.fillStyle(0xfff3d0, 1); g.fillCircle(40, 22, 7); g.fillCircle(60, 22, 7); g.fillCircle(80, 22, 7); // dots
  // hanging fringe
  g.fillStyle(0xffd23a, 1); for (let i = 0; i < 9; i++) g.fillTriangle(14 + i * 11, 36, 24 + i * 11, 36, 19 + i * 11, 48);
  gen('l8_obs_banner', 120, 52);

  // Low tree branch (overhead — slide under)
  g.fillStyle(0x6e4a26, 1); g.fillRoundedRect(0, 20, 130, 12, 6);
  g.fillStyle(0x5a3b1e, 0.7); g.fillRect(8, 23, 110, 3);
  g.fillStyle(0x4f9c3a, 1);
  g.fillEllipse(30, 16, 34, 22); g.fillEllipse(70, 14, 38, 24); g.fillEllipse(108, 16, 34, 22);
  g.fillStyle(0x5fb048, 0.7); g.fillEllipse(60, 12, 20, 12);
  // hanging twig
  g.fillStyle(0x6e4a26, 1); g.fillRect(64, 30, 5, 18);
  g.fillStyle(0x4f9c3a, 1); g.fillCircle(66, 50, 8);
  gen('l8_obs_branch', 130, 58);

  // Balloon arch (overhead — slide under)
  g.fillStyle(0x9a73c4, 1); g.fillRect(0, 30, 8, 50); g.fillRect(132, 30, 8, 50); // base ribbons
  const bcol = [0xff7a8a, 0x6ab0ee, 0xfff06a, 0x8fd86a, 0xff9ec4, 0x6ad0ff];
  const arc = [[12, 50], [26, 30], [48, 16], [70, 12], [92, 16], [114, 30], [128, 50]];
  arc.forEach((p, i) => { g.fillStyle(bcol[i % bcol.length], 1); g.fillEllipse(p[0], p[1], 24, 28); g.fillStyle(0xffffff, 0.35); g.fillEllipse(p[0] - 4, p[1] - 6, 7, 9); });
  gen('l8_obs_balloon', 140, 84);

  // Toy box (ground obstacle — JUMP over) 64×62 — bright wooden chest of toys
  g.fillStyle(0x000000, 0.18); g.fillEllipse(32, 59, 58, 9);
  g.fillStyle(0x6ad0ff, 1); g.fillCircle(20, 16, 7); gloss(17, 13, 3, 2.5);   // toys peeking
  g.fillStyle(0xfff06a, 1); g.fillCircle(34, 13, 5);
  g.fillStyle(0xff9ab0, 1); g.fillCircle(46, 17, 5); gloss(44, 14, 2.5, 2);
  g.fillStyle(0xee7a2e, 1); g.fillRoundedRect(8, 22, 48, 36, 5);              // body
  g.fillStyle(0xd45f1e, 1); g.fillRect(8, 50, 48, 8);                         // base shade
  g.fillStyle(0xffb066, 1); g.fillRect(12, 26, 6, 28);                        // plank sheen
  g.fillStyle(0xf0824a, 1); g.fillRoundedRect(6, 14, 52, 12, 5);            // lid
  g.fillStyle(0xffd23a, 1); g.fillRect(28, 26, 8, 32);                        // ribbon
  g.fillStyle(0xffd23a, 1); g.fillRect(6, 18, 52, 4);                         // ribbon across lid
  g.lineStyle(2.5, 0x9a4010, 1);
  g.strokeRoundedRect(6, 14, 52, 12, 5); g.strokeRoundedRect(8, 22, 48, 36, 5);
  gen('l8_obs_toybox', 64, 62);

  // Checkpoint flag on pole 72×84 — chequered banner + paw badge
  g.fillStyle(0x000000, 0.14); g.fillEllipse(30, 80, 26, 6);                  // base shadow
  g.fillStyle(0x7a5326, 1); g.fillRect(27, 4, 6, 76);                         // pole
  g.fillStyle(0x5f3f1c, 1); g.fillRect(27, 4, 2, 76);                         // pole shade
  g.fillStyle(0xffd23a, 1); g.fillTriangle(33, 6, 33, 44, 72, 25);            // flag
  g.fillStyle(0xff8a3a, 1); g.fillTriangle(33, 30, 33, 44, 60, 37);           // lower fold shade
  g.fillStyle(0x6a3fa0, 1); g.fillCircle(48, 22, 5.5);                        // paw badge
  g.fillStyle(0xffffff, 1); g.fillCircle(45, 19, 1.6); g.fillCircle(51, 19, 1.6); g.fillCircle(48, 25, 2.2);
  g.lineStyle(2, 0xd49810, 1); g.strokeTriangle(33, 6, 33, 44, 72, 25);
  g.fillStyle(0xffd23a, 1); g.fillCircle(30, 5, 4);                           // pole finial
  gen('l8_cp_flag', 72, 84);

  // Done marker
  gen('l8_ready', 4, 4);
  g.destroy();
}
