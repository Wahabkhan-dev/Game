import Phaser from 'phaser';

// ════════════════════════════════════════════════════════════════════════════
// LEVEL 9 — A HOLIDAY FOR THE PUPPIES  (procedural WebGL placeholder art)
//
// Story flow: Part 1 — collect wrapped GIFTS then UNWRAP them.
//             Part 2 — collect BOWS then TIE one on each of the 7 puppies.
//
// Every texture is generated at runtime with Phaser.Graphics so the whole level
// is playable BEFORE any final PNG exists. Each key maps 1:1 to a future file in
// public/assets/images/level9/**, so real art can be dropped in later with no
// gameplay changes. THEME: cosy Christmas / holiday — evergreen, holly-red, gold,
// snow-white, warm firelit indoors. Guarded by the sentinel 'l9_ready'.
// ════════════════════════════════════════════════════════════════════════════
export function generateL9Assets(scene) {
  if (scene.textures.exists('l9_ready')) return;
  const g = scene.make.graphics({ add: false });
  const gen = (k, w, h) => { if (!scene.textures.exists(k)) g.generateTexture(k, w, h); g.clear(); };

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
  // Sparkle
  g.fillStyle(0xffffff, 1);
  g.fillTriangle(12, 0, 9, 9, 15, 9); g.fillTriangle(12, 24, 9, 15, 15, 15);
  g.fillTriangle(0, 12, 9, 9, 9, 15); g.fillTriangle(24, 12, 15, 9, 15, 15);
  g.fillStyle(0xfff3aa, 0.95); g.fillCircle(12, 12, 3.2);
  gen('l9_spark', 24, 24);

  // Snowflake
  g.lineStyle(2, 0xffffff, 0.95);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.lineBetween(8, 8, 8 + Math.cos(a) * 7, 8 + Math.sin(a) * 7); }
  g.fillStyle(0xffffff, 1); g.fillCircle(8, 8, 2);
  gen('l9_snow', 16, 16);

  // Soft round glow
  { const R = 64; for (let i = R; i > 0; i--) { g.fillStyle(0xffffff, 0.9 * Math.pow(1 - i / R, 2)); g.fillCircle(R, R, i); } }
  gen('l9_glow', 128, 128);

  // Landing puff
  g.fillStyle(0xffffff, 0.9); g.fillCircle(5, 5, 4);
  gen('l9_dust', 10, 10);

  // Heart (HP)
  g.fillStyle(0xe23a4e, 1); g.fillCircle(12, 13, 9); g.fillCircle(24, 13, 9); g.fillTriangle(3, 16, 33, 16, 18, 34);
  g.fillStyle(0xff8aa0, 0.7); g.fillCircle(10, 10, 3);
  gen('l9_heart', 36, 36);

  // Gold star (rating + tree topper)
  { const cx = 18, cy = 18, R = 16, r = 7, pts = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5; const rad = i % 2 ? r : R; pts.push({ x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad }); }
    g.fillStyle(0xffd24a, 1); g.fillPoints(pts, true); g.lineStyle(2, 0xd49810, 1); g.strokePoints(pts, true);
    g.fillStyle(0xfff0a0, 0.6); g.fillCircle(14, 13, 4); }
  gen('l9_star', 36, 36);

  // Drop slot (puppy stand / gift target)
  g.fillStyle(0xffffff, 0.12); g.fillRoundedRect(2, 2, 96, 96, 14);
  g.lineStyle(3, 0xffffff, 0.5);
  for (let x = 6; x < 94; x += 14) { g.lineBetween(x, 3, x + 8, 3); g.lineBetween(x, 97, x + 8, 97); }
  for (let y = 6; y < 94; y += 14) { g.lineBetween(3, y, 3, y + 8); g.lineBetween(97, y, 97, y + 8); }
  gen('l9_slot', 100, 100);

  // ══════════════════════════════════════════════════════════════════════════
  // BACKGROUNDS
  // ══════════════════════════════════════════════════════════════════════════
  // Snowy evening sky 800×450 — deep blue → soft mauve, moon + stars
  grad(800, 450, 0x14224a, 0x3a3a66);
  g.fillStyle(0xfff6d8, 0.5); g.fillCircle(650, 90, 60);   // moon glow
  g.fillStyle(0xfff8e6, 1);   g.fillCircle(650, 90, 34);   // moon
  g.fillStyle(0x2a2a52, 1);   g.fillCircle(636, 82, 30);   // crescent shadow
  g.fillStyle(0xffffff, 0.9); for (let i = 0; i < 40; i++) g.fillCircle(Phaser.Math.Between(0, 800), Phaser.Math.Between(0, 240), Phaser.Math.Between(1, 2));
  gen('l9_sky', 800, 450);

  // Snowy hills band 400×240 (tileable) — rolling snow + pine silhouettes
  g.fillStyle(0xdfeaff, 1); g.fillRect(0, 120, 400, 120);
  g.fillStyle(0xcfe0f6, 1); for (let x = -40; x < 440; x += 170) g.fillEllipse(x, 150, 240, 120);
  g.fillStyle(0xbcd2ee, 1); for (let x = 40; x < 440; x += 210) g.fillEllipse(x, 205, 280, 140);
  // pines
  for (let x = 26; x < 400; x += 84) {
    g.fillStyle(0x244a30, 1);
    g.fillTriangle(x - 16, 150, x + 16, 150, x, 108);
    g.fillTriangle(x - 13, 132, x + 13, 132, x, 96);
    g.fillStyle(0x5a3b1e, 1); g.fillRect(x - 3, 150, 6, 12);
    g.fillStyle(0xffffff, 0.75); g.fillTriangle(x - 16, 150, x - 8, 150, x - 12, 138); // snow cap
  }
  gen('l9_hills', 400, 240);

  // Snow ground tile 128×80 (tileable)
  grad(128, 80, 0xf4f8ff, 0xd8e4f6);
  g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 128, 8);
  g.fillStyle(0xe6eefc, 0.8); for (let i = 0; i < 6; i++) g.fillEllipse(Phaser.Math.Between(0, 128), Phaser.Math.Between(16, 70), Phaser.Math.Between(14, 30), 8);
  g.fillStyle(0x9ab0d8, 0.4); for (let i = 0; i < 5; i++) g.fillCircle(Phaser.Math.Between(0, 128), Phaser.Math.Between(20, 70), 2); // sparkle specks
  gen('l9_ground', 128, 80);

  // Cosy living-room bg 800×450 (screen-locked) — warm wall, window w/ snow, fireplace, rug, tree
  grad(800, 450, 0xf6ddb8, 0xecc999);
  g.fillStyle(0xf2d3a6, 1); g.fillRect(0, 0, 800, 300);
  // wainscot line
  g.fillStyle(0xd8a86a, 1); g.fillRect(0, 292, 800, 8);
  // window with snowy night
  g.fillStyle(0x2a3a5e, 1); g.fillRoundedRect(70, 60, 150, 120, 8);
  g.fillStyle(0x3e5680, 1); g.fillRect(78, 68, 134, 46);
  g.fillStyle(0xffffff, 0.9); for (let i = 0; i < 16; i++) g.fillCircle(Phaser.Math.Between(78, 212), Phaser.Math.Between(68, 172), 2);
  g.lineStyle(5, 0xfff6e6, 1); g.strokeRoundedRect(70, 60, 150, 120, 8); g.lineBetween(145, 60, 145, 180); g.lineBetween(70, 120, 220, 120);
  // fireplace
  g.fillStyle(0x8a5a38, 1); g.fillRoundedRect(560, 120, 150, 170, 8);
  g.fillStyle(0x3a2418, 1); g.fillRoundedRect(582, 170, 106, 120, 6);
  g.fillStyle(0xff8a3a, 0.9); g.fillEllipse(635, 262, 70, 40);
  g.fillStyle(0xffd24a, 0.9); g.fillEllipse(635, 268, 40, 26);
  // stockings on mantle
  ['0xd23a4e', '0x2f7a4a', '0xffd24a'].forEach((c, i) => { g.fillStyle(Number(c), 1); g.fillRoundedRect(585 + i * 40, 120, 18, 26, 5); g.fillStyle(0xffffff, 1); g.fillRect(585 + i * 40, 120, 18, 6); });
  // wood floor
  g.fillStyle(0xd9a86a, 1); g.fillRect(0, 300, 800, 150);
  g.fillStyle(0xc9924f, 1); for (let y = 320; y < 450; y += 30) g.fillRect(0, y, 800, 3);
  g.lineStyle(1, 0xb07c3e, 0.5); for (let x = 0; x < 800; x += 70) g.lineBetween(x, 300, x + 16, 450);
  // round rug
  g.fillStyle(0xc0304a, 0.85); g.fillEllipse(300, 400, 320, 70);
  g.fillStyle(0xe6c060, 0.7); g.fillEllipse(300, 400, 230, 48);
  g.fillStyle(0xc0304a, 0.85); g.fillEllipse(300, 400, 150, 30);
  gen('l9_room_bg', 800, 450);

  // Christmas tree 150×220
  g.fillStyle(0x000000, 0.14); g.fillEllipse(75, 212, 110, 14);
  g.fillStyle(0x6a4326, 1); g.fillRect(66, 184, 18, 26);                  // trunk
  g.fillStyle(0x1f5a3a, 1);
  g.fillTriangle(75, 8, 20, 96, 130, 96);
  g.fillTriangle(75, 52, 12, 150, 138, 150);
  g.fillTriangle(75, 104, 6, 200, 144, 200);
  g.fillStyle(0x2f7a4a, 0.6);
  g.fillTriangle(75, 20, 40, 90, 110, 90);
  // baubles + lights
  const bcol = [0xd23a4e, 0xffd24a, 0x4a9fe0, 0xffffff, 0xe06ab0];
  for (let i = 0; i < 22; i++) { g.fillStyle(bcol[i % bcol.length], 1); g.fillCircle(Phaser.Math.Between(24, 126), Phaser.Math.Between(40, 194), 4); }
  // star topper
  { const cx = 75, cy = 10, R = 12, r = 5, pts = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5; const rad = i % 2 ? r : R; pts.push({ x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad }); }
    g.fillStyle(0xffe066, 1); g.fillPoints(pts, true); }
  gen('l9_tree', 150, 220);

  // String lights (tileable strip 160×30) for outdoor decor
  g.lineStyle(2, 0x3a3a44, 1); g.beginPath(); g.moveTo(0, 6); for (let x = 0; x <= 160; x += 20) g.lineTo(x, 6 + Math.sin(x / 20) * 6); g.strokePath();
  const lc = [0xd23a4e, 0xffd24a, 0x2f7a4a, 0x4a9fe0];
  for (let i = 0; i < 8; i++) { g.fillStyle(lc[i % lc.length], 1); g.fillCircle(i * 20 + 10, 16, 4); g.fillStyle(0xffffff, 0.5); g.fillCircle(i * 20 + 9, 15, 1.5); }
  gen('l9_lights', 160, 30);

  // Snowy cottage finish marker 200×180 (warm windows, wreath)
  g.fillStyle(0x000000, 0.12); g.fillEllipse(100, 172, 170, 16);
  g.fillStyle(0xe8d0b0, 1); g.fillRect(30, 84, 140, 88);
  g.fillStyle(0xffffff, 1); g.fillTriangle(14, 88, 100, 26, 186, 88);      // snowy roof
  g.fillStyle(0xd23a4e, 1); g.fillRect(14, 84, 172, 8);
  g.fillStyle(0x8a5a32, 1); g.fillRoundedRect(82, 118, 36, 54, 4);        // door
  g.fillStyle(0x2f7a4a, 1); g.fillCircle(100, 118, 10); g.fillStyle(0xd23a4e, 1); g.fillCircle(100, 118, 3); // wreath
  g.fillStyle(0xffd24a, 1); g.fillRect(46, 104, 28, 26); g.fillRect(126, 104, 28, 26); // warm windows
  g.lineStyle(2, 0xfff6e6, 1); g.strokeRect(46, 104, 28, 26); g.strokeRect(126, 104, 28, 26);
  g.fillStyle(0xffffff, 0.85); g.fillEllipse(100, 30, 60, 10);            // snow on roof peak
  gen('l9_house', 200, 180);

  // ══════════════════════════════════════════════════════════════════════════
  // CHARACTERS — mother Gamma (santa hat) + tintable puppy
  // ══════════════════════════════════════════════════════════════════════════
  g.fillStyle(0x000000, 0.16); g.fillEllipse(86, 112, 150, 16);
  g.fillStyle(0x9a6a38, 1); g.fillEllipse(92, 72, 140, 62);
  g.fillStyle(0xf2e4cf, 1); g.fillEllipse(96, 86, 118, 36);
  g.fillStyle(0xa6743e, 1); g.fillCircle(42, 56, 34);
  g.fillStyle(0xf2e4cf, 1); g.fillEllipse(34, 68, 32, 24);
  g.fillStyle(0x6e4a26, 1); g.fillEllipse(18, 30, 20, 32); g.fillEllipse(62, 30, 18, 30);
  g.fillStyle(0x2a160a, 1); g.fillEllipse(20, 64, 10, 7);
  g.fillStyle(0x2a1a10, 1); g.fillCircle(34, 50, 4.5); g.fillCircle(52, 50, 4.5);
  g.fillStyle(0xffffff, 0.8); g.fillCircle(35, 48, 1.8); g.fillCircle(53, 48, 1.8);
  g.lineStyle(2, 0x2a1a10, 1); g.beginPath(); g.arc(28, 70, 5, 0, Math.PI, false); g.strokePath();
  g.fillStyle(0xf2e4cf, 1); g.fillEllipse(60, 104, 22, 12); g.fillEllipse(112, 104, 22, 12);
  g.fillStyle(0x9a6a38, 1); g.fillEllipse(160, 62, 26, 15);
  // santa hat
  g.fillStyle(0xd23a4e, 1); g.fillTriangle(22, 26, 62, 26, 60, 2); g.fillStyle(0xffffff, 1); g.fillRect(20, 24, 46, 8); g.fillCircle(60, 3, 5);
  gen('l9_gamma', 170, 120);

  // Puppy 96×84 (tintable light-tan base, sits facing front)
  g.fillStyle(0x000000, 0.12); g.fillEllipse(48, 78, 72, 12);
  g.fillStyle(0xe8c79a, 1); g.fillEllipse(48, 56, 60, 44);
  g.fillStyle(0xfdf0dc, 1); g.fillEllipse(48, 66, 38, 26);
  g.fillStyle(0xeccfa4, 1); g.fillCircle(48, 34, 26);
  g.fillStyle(0xc89a64, 1); g.fillEllipse(26, 22, 16, 24); g.fillEllipse(70, 22, 16, 24);
  g.fillStyle(0xfdf0dc, 1); g.fillEllipse(48, 44, 26, 18);
  g.fillStyle(0x2a160a, 1); g.fillEllipse(48, 40, 8, 6);
  g.fillStyle(0x2a1a10, 1); g.fillCircle(38, 30, 5); g.fillCircle(58, 30, 5);
  g.fillStyle(0xffffff, 0.9); g.fillCircle(40, 28, 2); g.fillCircle(60, 28, 2);
  g.lineStyle(2, 0x2a1a10, 1); g.beginPath(); g.arc(48, 46, 5, 0, Math.PI, false); g.strokePath();
  g.fillStyle(0xfdf0dc, 1); g.fillEllipse(34, 74, 16, 10); g.fillEllipse(62, 74, 16, 10);
  gen('l9_puppy', 96, 84);

  // ══════════════════════════════════════════════════════════════════════════
  // GIFTS — 8 wrapped styles (collect + unwrap) + opened box + surprise contents
  // ══════════════════════════════════════════════════════════════════════════
  const giftBox = (bodyCol, ribCol, lidCol, pattern) => {
    g.fillStyle(0x000000, 0.14); g.fillEllipse(32, 60, 52, 8);
    g.fillStyle(bodyCol, 1); g.fillRoundedRect(8, 24, 48, 34, 4);
    // pattern on body
    if (pattern === 'stripe') { g.fillStyle(0xffffff, 0.5); for (let x = 12; x < 56; x += 12) g.fillRect(x, 24, 4, 34); }
    if (pattern === 'polka')  { g.fillStyle(0xffffff, 0.6); for (let y = 30; y < 56; y += 12) for (let x = 16; x < 54; x += 14) g.fillCircle(x, y, 3); }
    if (pattern === 'holly')  { g.fillStyle(0x2f7a4a, 1); g.fillEllipse(24, 40, 12, 7); g.fillEllipse(40, 40, 12, 7); g.fillStyle(0xd23a4e, 1); g.fillCircle(32, 40, 3); }
    g.fillStyle(lidCol, 1); g.fillRoundedRect(4, 16, 56, 14, 4);
    g.fillStyle(ribCol, 1); g.fillRect(28, 16, 8, 42); g.fillRect(4, 20, 56, 6);
    // bow
    g.fillStyle(ribCol, 1); g.fillEllipse(25, 13, 14, 10); g.fillEllipse(39, 13, 14, 10); g.fillCircle(32, 14, 4);
    g.fillStyle(0xffffff, 0.35); g.fillEllipse(25, 11, 6, 4);
    g.lineStyle(1.5, 0x000000, 0.12); g.strokeRoundedRect(8, 24, 48, 34, 4);
  };
  giftBox(0xd23a4e, 0xffd24a, 0xb02a3e, 'plain');  gen('l9_gift_red', 64, 64);
  giftBox(0x2f7a4a, 0xd23a4e, 0x246038, 'plain');  gen('l9_gift_green', 64, 64);
  giftBox(0xffd24a, 0xd23a4e, 0xe6b830, 'plain');  gen('l9_gift_gold', 64, 64);
  giftBox(0x4a9fe0, 0xffffff, 0x3a80c0, 'stripe');  gen('l9_gift_blue', 64, 64);
  giftBox(0xe06ab0, 0xffd24a, 0xc0508e, 'polka');   gen('l9_gift_pink', 64, 64);
  giftBox(0x8a5fd0, 0xffffff, 0x6e48b0, 'plain');   gen('l9_gift_purple', 64, 64);
  giftBox(0xf4f8ff, 0xd23a4e, 0xd8e0ee, 'holly');   gen('l9_gift_white', 64, 64);
  giftBox(0xd23a4e, 0x2f7a4a, 0xb02a3e, 'stripe');  gen('l9_gift_stripe', 64, 64);

  // Opened gift box (lid off, paper flaps) 64×64
  g.fillStyle(0x000000, 0.14); g.fillEllipse(32, 58, 52, 8);
  g.fillStyle(0xc0304a, 1); g.fillRoundedRect(10, 30, 44, 28, 4);
  g.fillStyle(0x8a1f34, 1); g.fillRect(10, 30, 44, 8);                    // inner shadow
  g.fillStyle(0xd23a4e, 1);                                                // opened flaps
  g.fillTriangle(10, 30, 30, 30, 4, 14); g.fillTriangle(54, 30, 34, 30, 60, 14);
  g.fillStyle(0xffd24a, 1); g.fillRect(30, 12, 4, 20);                    // ribbon curl
  gen('l9_gift_open', 64, 64);

  // Surprise contents (revealed on unwrap)
  // toy ball
  g.fillStyle(0xd23a4e, 1); g.fillCircle(20, 20, 16); g.fillStyle(0xffffff, 1); g.fillRect(4, 18, 32, 4); g.fillStyle(0xffffff, 0.5); g.fillCircle(14, 13, 4); gen('l9_toy_ball', 40, 40);
  // bone
  g.fillStyle(0xf6e6c2, 1); [[8,10],[8,22],[32,10],[32,22]].forEach(([x, y]) => g.fillCircle(x, y, 7)); g.fillRect(8, 10, 24, 12); g.lineStyle(2, 0xd8c090, 1); g.strokeCircle(8, 10, 7); g.strokeCircle(32, 22, 7); gen('l9_toy_bone', 40, 32);
  // candy cane
  g.fillStyle(0xffffff, 1); g.fillRoundedRect(14, 6, 8, 34, 4); g.beginPath(); g.arc(20, 10, 8, Math.PI, 0, false); g.fillPath();
  g.fillStyle(0xd23a4e, 1); for (let y = 6; y < 40; y += 10) g.fillRect(14, y, 8, 4); gen('l9_candy', 40, 44);
  // ornament
  g.fillStyle(0x4a9fe0, 1); g.fillCircle(18, 22, 15); g.fillStyle(0xffd24a, 1); g.fillRect(14, 4, 8, 8); g.fillStyle(0xffffff, 0.5); g.fillCircle(12, 16, 4); g.lineStyle(2, 0xffd24a, 1); g.strokeCircle(18, 22, 15); gen('l9_ornament', 36, 40);

  // ══════════════════════════════════════════════════════════════════════════
  // BOWS — 7 ribbon bows (collect in Part 2, one per puppy)
  // ══════════════════════════════════════════════════════════════════════════
  const bow = (col, dark) => {
    g.fillStyle(0x000000, 0.12); g.fillEllipse(26, 34, 40, 7);
    g.fillStyle(dark, 1); g.fillTriangle(24, 18, 12, 40, 24, 32); g.fillTriangle(28, 18, 40, 40, 28, 32);  // tails
    g.fillStyle(col, 1); g.fillEllipse(14, 16, 22, 18); g.fillEllipse(38, 16, 22, 18);                     // loops
    g.fillStyle(dark, 1); g.fillEllipse(14, 20, 16, 8); g.fillEllipse(38, 20, 16, 8);                      // loop shade
    g.fillStyle(col, 1); g.fillCircle(26, 16, 8);                                                          // knot
    g.fillStyle(0xffffff, 0.45); g.fillEllipse(9, 12, 8, 5); g.fillEllipse(33, 12, 8, 5);                  // sheen
    g.lineStyle(1.5, dark, 0.8); g.strokeCircle(26, 16, 8);
  };
  bow(0xd23a4e, 0x9a1f34); gen('l9_bow_red', 52, 44);
  bow(0x2f7a4a, 0x1c4a2c); gen('l9_bow_green', 52, 44);
  bow(0xffd24a, 0xd49810); gen('l9_bow_gold', 52, 44);
  bow(0x4a9fe0, 0x2f70b0); gen('l9_bow_blue', 52, 44);
  bow(0xe06ab0, 0xb04888); gen('l9_bow_pink', 52, 44);
  bow(0x8a5fd0, 0x6040a0); gen('l9_bow_purple', 52, 44);
  bow(0xe8eef8, 0xb8c2d4); gen('l9_bow_silver', 52, 44);

  // ══════════════════════════════════════════════════════════════════════════
  // OBSTACLES / MARKERS — snowball · ice patch · icicle · snowman · gift stack
  // ══════════════════════════════════════════════════════════════════════════
  // Rolling snowball (JUMP over)
  g.fillStyle(0x000000, 0.14); g.fillEllipse(28, 50, 46, 8);
  g.fillStyle(0xffffff, 1); g.fillCircle(28, 28, 22);
  g.fillStyle(0xdfeaff, 1); g.fillEllipse(28, 38, 40, 14);
  g.fillStyle(0xbcd2ee, 0.7); g.fillCircle(20, 32, 4); g.fillCircle(34, 24, 3);
  g.lineStyle(2, 0xbcd2ee, 0.8); g.strokeCircle(28, 28, 22);
  gen('l9_snowball', 56, 56);

  // Ice patch (flat ground — JUMP over / slippery)
  g.fillStyle(0xbfe6ff, 0.6); g.fillEllipse(45, 14, 86, 20);
  g.fillStyle(0xeaf6ff, 0.7); g.fillEllipse(38, 12, 50, 12);
  g.fillStyle(0xffffff, 0.7); g.fillEllipse(28, 10, 18, 5);
  gen('l9_ice', 92, 28);

  // Icicle (falls from above)
  g.fillStyle(0xdff2ff, 1); g.fillTriangle(2, 0, 26, 0, 14, 60);
  g.fillStyle(0xffffff, 0.7); g.fillTriangle(6, 0, 14, 0, 12, 36);
  g.lineStyle(1.5, 0xbcd2ee, 0.8); g.strokePoints([{ x: 2, y: 0 }, { x: 14, y: 60 }, { x: 26, y: 0 }], false);
  gen('l9_icicle', 28, 64);

  // Snowman (ground obstacle — JUMP over) 56×74
  g.fillStyle(0x000000, 0.14); g.fillEllipse(28, 70, 50, 8);
  g.fillStyle(0xffffff, 1); g.fillCircle(28, 54, 20); g.fillCircle(28, 30, 15); g.fillCircle(28, 12, 10);
  g.fillStyle(0xdfeaff, 1); g.fillEllipse(28, 60, 34, 12);
  g.fillStyle(0x2a2a2a, 1); g.fillCircle(24, 10, 1.6); g.fillCircle(32, 10, 1.6);
  g.fillStyle(0xff8a3a, 1); g.fillTriangle(28, 13, 40, 15, 28, 16);       // carrot nose
  g.fillStyle(0x2a2a2a, 1); g.fillCircle(28, 28, 1.6); g.fillCircle(28, 34, 1.6);
  g.fillStyle(0xd23a4e, 1); g.fillRect(16, 20, 24, 4);                    // scarf
  g.fillStyle(0x3a2418, 1); g.fillRect(18, 2, 20, 3); g.fillRect(23, -6, 10, 10); // hat
  gen('l9_snowman', 56, 78);

  // Gift stack (ground obstacle — JUMP over) 60×64
  g.fillStyle(0x000000, 0.16); g.fillEllipse(30, 60, 54, 9);
  g.fillStyle(0x2f7a4a, 1); g.fillRoundedRect(6, 30, 48, 28, 4); g.fillStyle(0xffd24a, 1); g.fillRect(26, 30, 8, 28);
  g.fillStyle(0xd23a4e, 1); g.fillRoundedRect(12, 8, 36, 24, 4); g.fillStyle(0xffffff, 1); g.fillRect(28, 8, 6, 24);
  g.fillStyle(0xffd24a, 1); g.fillEllipse(28, 8, 12, 8); g.fillEllipse(38, 8, 12, 8);
  gen('l9_giftstack', 60, 66);

  // Checkpoint — glowing lantern on a candy-cane post 56×88
  g.fillStyle(0x000000, 0.14); g.fillEllipse(28, 84, 24, 6);
  g.fillStyle(0xffffff, 1); g.fillRect(25, 20, 6, 64); g.fillStyle(0xd23a4e, 1); for (let y = 20; y < 84; y += 12) g.fillRect(25, y, 6, 6); // candy pole
  g.fillStyle(0x3a2a1a, 1); g.fillRoundedRect(14, 6, 28, 26, 5);          // lantern frame
  g.fillStyle(0xffe066, 1); g.fillRoundedRect(18, 10, 20, 18, 3);        // lit pane (dim at use)
  g.fillStyle(0xfff6c8, 0.8); g.fillCircle(28, 19, 6);
  g.lineStyle(2, 0x6a4a2a, 1); g.strokeRoundedRect(14, 6, 28, 26, 5);
  gen('l9_cp', 56, 92);

  // Glowing door portal (run finish) 120×170
  { const cx = 60;
    g.fillStyle(0x3a2418, 1); g.fillRoundedRect(cx - 40, 20, 80, 150, 10);
    g.fillStyle(0x8a5a38, 1); g.fillRoundedRect(cx - 34, 26, 68, 144, 8);
    g.fillStyle(0xffe6a0, 0.9); g.fillRoundedRect(cx - 24, 40, 48, 90, 6);   // warm light
    g.fillStyle(0x2f7a4a, 1); g.fillCircle(cx, 30, 12); g.fillStyle(0xd23a4e, 1); g.fillCircle(cx, 30, 4); // wreath
    g.fillStyle(0xffd24a, 1); g.fillCircle(cx + 18, 96, 3); }
  gen('l9_door', 120, 180);

  gen('l9_ready', 4, 4);
  g.destroy();
}
