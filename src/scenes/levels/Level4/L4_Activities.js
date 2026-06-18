import Phaser from 'phaser';

// ─────────────────────────────────────────────────────────────────────────────
// L4_Activities.js  — one mini-activity per item
// Builder signature:
//   buildXxx(scene, ax, ay, aw, ah, objects, onSucceed)
//     ax,ay  – top-left of the content area inside the card
//     aw,ah  – dimensions of that area
//     objects – push every created display-object here (auto-cleanup on close)
//     onSucceed – call when player wins
// ─────────────────────────────────────────────────────────────────────────────

// ── helpers ───────────────────────────────────────────────────────────────────
function instr(scene, ax, ay, aw, text, objects) {
  const t = scene.add.text(ax + aw / 2, ay + 8, text, {
    fontSize: '11px', fontFamily: 'Georgia, serif',
    color: '#5a3820', align: 'center', wordWrap: { width: aw - 16 }
  }).setOrigin(0.5, 0).setDepth(95);
  objects.push(t);
  return t;
}

function progressBar(scene, ax, ay, aw, ah, objects) {
  const bW = aw - 48, bX = ax + 24, bY = ay + ah - 22;
  const bg   = scene.add.rectangle(bX + bW / 2, bY, bW, 12, 0xe0ccc0).setDepth(95).setStrokeStyle(1.5, 0xc0a890);
  const fill = scene.add.rectangle(bX, bY, 2, 12, 0xf06090).setOrigin(0, 0.5).setDepth(96);
  const lbl  = scene.add.text(bX + bW / 2, bY + 14, '', { fontSize: '9px', fontFamily: 'Georgia, serif', color: '#7a3a5a' }).setOrigin(0.5, 0).setDepth(96);
  objects.push(bg, fill, lbl);
  return {
    fill, lbl, bW,
    update(cur, max) { this.fill.width = Math.max(2, (cur / max) * this.bW); this.lbl.setText(`${cur} / ${max}`); }
  };
}

function spawnSparkle(scene, x, y, objects) {
  [0xffee44, 0xff88cc, 0x88eeff, 0xaaffaa].forEach((col, i) => {
    for (let j = 0; j < 2; j++) {
      const ang = ((i * 2 + j) / 8) * Math.PI * 2;
      const s = scene.add.circle(x, y, 5, col).setDepth(98);
      objects.push(s);
      scene.tweens.add({ targets: s, x: x + Math.cos(ang) * 34, y: y + Math.sin(ang) * 34, alpha: 0, scale: 1.8, duration: 500, onComplete: () => { try { s.destroy(); } catch (_) {} } });
    }
  });
}

function wrongShake(scene, target) {
  const ox = target.x;
  scene.tweens.add({ targets: target, x: ox + 9, duration: 55, yoyo: true, repeat: 4, ease: 'Sine.easeInOut' });
  if (target.setTint) { target.setTint(0xff5555); scene.time.delayedCall(380, () => { try { target.clearTint(); } catch (_) {} }); }
}

// invisible rectangle hit-zone helper
function hitRect(scene, cx, cy, w, h, depth, objects) {
  const z = scene.add.rectangle(cx, cy, w, h, 0xffffff, 0).setDepth(depth).setInteractive({ useHandCursor: true });
  objects.push(z);
  return z;
}

// ── 1. BED — "Fluff the Bed!" ─────────────────────────────────────────────────
export function buildFluff(scene, ax, ay, aw, ah, objects, onSucceed) {
  const MAX = 10; let taps = 0;
  instr(scene, ax, ay, aw, 'Tap the bed 10 times to fluff it up!', objects);

  const bed = scene.textures.exists('l4_bed')
    ? scene.add.image(ax + aw / 2, ay + ah / 2 - 12, 'l4_bed').setDisplaySize(160, 112).setDepth(95)
    : scene.add.rectangle(ax + aw / 2, ay + ah / 2 - 12, 160, 112, 0xff88bb).setDepth(95);
  objects.push(bed);
  scene.tweens.add({ targets: bed, y: bed.y - 5, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

  const bar = progressBar(scene, ax, ay, aw, ah, objects);
  bar.update(0, MAX);

  const zone = hitRect(scene, ax + aw / 2, ay + ah / 2 - 12, 175, 120, 97, objects);
  zone.on('pointerover', () => bed.setScale(1.06)).on('pointerout', () => bed.setScale(1));
  zone.on('pointerdown', () => {
    if (taps >= MAX) return;
    taps++;
    bar.update(taps, MAX);
    scene.tweens.killTweensOf(bed);
    scene.tweens.add({ targets: bed, scaleY: 0.82, duration: 70, yoyo: true,
      onComplete: () => scene.tweens.add({ targets: bed, y: bed.y - 5, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    });
    const puff = scene.add.text(ax + aw / 2 + (Math.random() - 0.5) * 100, ay + ah / 2 - 30 + (Math.random() - 0.5) * 30, '💨', { fontSize: '20px' }).setDepth(97);
    objects.push(puff);
    scene.tweens.add({ targets: puff, y: puff.y - 28, alpha: 0, duration: 550, onComplete: () => { try { puff.destroy(); } catch (_) {} } });
    if (taps >= MAX) { zone.removeInteractive(); scene.time.delayedCall(300, onSucceed); }
  });
}

// ── 2. FOOD BOWL — "Collect the Kibble!" ─────────────────────────────────────
export function buildKibble(scene, ax, ay, aw, ah, objects, onSucceed) {
  const MAX = 6; let collected = 0;
  instr(scene, ax, ay, aw, 'Tap all 6 kibble pieces to collect them!', objects);

  const bowl = scene.textures.exists('l4_food_bowl')
    ? scene.add.image(ax + aw * 0.5, ay + ah - 34, 'l4_food_bowl').setDisplaySize(68, 58).setDepth(95)
    : scene.add.ellipse(ax + aw * 0.5, ay + ah - 34, 68, 48, 0xcc2818).setDepth(95);
  objects.push(bowl);

  const countTxt = scene.add.text(ax + aw / 2, ay + ah - 12, '0 / 6', {
    fontSize: '10px', fontFamily: 'Georgia, serif', color: '#7a3a20'
  }).setOrigin(0.5).setDepth(96);
  objects.push(countTxt);

  const positions = [
    [ax + 28, ay + 42], [ax + aw - 28, ay + 42],
    [ax + 60, ay + 102], [ax + aw - 60, ay + 102],
    [ax + aw * 0.35, ay + 68], [ax + aw * 0.65, ay + 68],
  ];
  positions.forEach(([kx, ky]) => {
    const k = scene.add.circle(kx, ky, 11, 0x8a4818).setDepth(95).setStrokeStyle(2, 0x5a2808);
    const shine = scene.add.circle(kx - 4, ky - 4, 4, 0xd07840, 0.6).setDepth(96);
    objects.push(k, shine);
    scene.tweens.add({ targets: [k, shine], y: `-=5`, duration: 600 + Math.random() * 400, yoyo: true, repeat: -1 });

    const z = hitRect(scene, kx, ky, 26, 26, 97, objects);
    z.on('pointerover', () => k.setScale(1.3)).on('pointerout', () => k.setScale(1));
    z.on('pointerdown', () => {
      z.removeInteractive();
      scene.tweens.killTweensOf(k); scene.tweens.killTweensOf(shine);
      [k, shine].forEach(o => scene.tweens.add({ targets: o, x: bowl.x, y: bowl.y, scale: 0.2, alpha: 0, duration: 380, ease: 'Cubic.easeIn', onComplete: () => { try { o.destroy(); } catch (_) {} } }));
      collected++;
      countTxt.setText(`${collected} / ${MAX}`);
      if (collected >= MAX) scene.time.delayedCall(400, onSucceed);
    });
  });
}

// ── 3. WATER BOWL — "Fill It Up!" ─────────────────────────────────────────────
export function buildWaterFill(scene, ax, ay, aw, ah, objects, onSucceed) {
  let taps = 0; const MAX = 8;
  instr(scene, ax, ay, aw, "Tap the tap handle 8 times to fill the bowl!", objects);

  const bowl = scene.textures.exists('l4_water_bowl')
    ? scene.add.image(ax + aw * 0.62, ay + ah - 38, 'l4_water_bowl').setDisplaySize(68, 58).setDepth(95)
    : scene.add.ellipse(ax + aw * 0.62, ay + ah - 38, 68, 48, 0x1460a0).setDepth(95);
  objects.push(bowl);

  // Water fill visual
  const waterG = scene.add.graphics().setDepth(96);
  objects.push(waterG);
  const drawWater = (lvl) => {
    waterG.clear();
    if (lvl <= 0) return;
    const wh = Math.min((lvl / MAX) * 36, 36);
    const bx = bowl.x, by = bowl.y;
    waterG.fillStyle(0x3399ee, 0.72); waterG.fillRect(bx - 27, by - 8 + (36 - wh), 54, wh);
    waterG.fillStyle(0x88ccff, 0.3); waterG.fillRect(bx - 21, by - 6 + (36 - wh), 20, 4);
  };
  drawWater(0);

  // Faucet graphic
  const fX = ax + aw * 0.3, fBaseY = ay + ah * 0.75;
  const faucetG = scene.add.graphics().setDepth(95);
  objects.push(faucetG);
  let handlePressed = false;
  const drawFaucet = (pressed) => {
    handlePressed = pressed;
    faucetG.clear();
    faucetG.fillStyle(0x7a9ab0, 1); faucetG.fillRoundedRect(fX - 12, fBaseY - 52, 24, 56, 5);
    faucetG.fillStyle(0xaaccdd, 0.4); faucetG.fillRect(fX - 10, fBaseY - 50, 10, 14);
    faucetG.fillStyle(0x6a8a9a, 1); faucetG.fillRect(fX + 12, fBaseY - 20, 32, 8);
    faucetG.fillStyle(pressed ? 0x44aa44 : 0x3388cc, 1);
    faucetG.fillRoundedRect(fX - 18, fBaseY - 62 + (pressed ? 8 : 0), 36, 14, 4);
    faucetG.lineStyle(1.5, 0x2266aa, 0.7); faucetG.strokeRoundedRect(fX - 18, fBaseY - 62 + (pressed ? 8 : 0), 36, 14, 4);
  };
  drawFaucet(false);

  const tapLbl = scene.add.text(fX, fBaseY + 12, 'TAP!', { fontSize: '11px', fontFamily: 'Georgia, serif', color: '#2266aa', stroke: '#fff', strokeThickness: 1 }).setOrigin(0.5).setDepth(96);
  objects.push(tapLbl);
  const countTxt = scene.add.text(bowl.x, ay + ah - 12, '0 / 8', { fontSize: '10px', fontFamily: 'Georgia, serif', color: '#1460a0' }).setOrigin(0.5).setDepth(96);
  objects.push(countTxt);

  const tapZone = hitRect(scene, fX, fBaseY - 42, 50, 80, 97, objects);
  tapZone.on('pointerover', () => tapLbl.setScale(1.1)).on('pointerout', () => tapLbl.setScale(1));
  tapZone.on('pointerdown', () => {
    if (taps >= MAX) return;
    taps++;
    drawFaucet(true); scene.time.delayedCall(130, () => drawFaucet(false));
    drawWater(taps);
    countTxt.setText(`${taps} / ${MAX}`);
    const drop = scene.add.circle(fX + 44, fBaseY - 16, 5, 0x66bbee, 0.9).setDepth(97);
    objects.push(drop);
    scene.tweens.add({ targets: drop, y: drop.y + 55, alpha: 0, scaleX: 0.5, duration: 340, onComplete: () => { try { drop.destroy(); } catch (_) {} } });
    if (taps >= MAX) { tapZone.removeInteractive(); scene.time.delayedCall(350, onSucceed); }
  });
}

// ── 4. BONE — "Shell Game!" ───────────────────────────────────────────────────
export function buildShellGame(scene, ax, ay, aw, ah, objects, onSucceed) {
  let boneIdx = 1; // which cup (0/1/2) hides the bone
  let canGuess = false;
  let attempts = 0;

  instr(scene, ax, ay, aw, 'Watch where the bone goes — then tap the right cup!', objects);

  const CY = ay + ah * 0.50;
  // Starting x-positions of the 3 cups
  const startXs = [ax + aw * 0.20, ax + aw * 0.50, ax + aw * 0.80];

  // Draw cup shape in LOCAL coords (centred at 0,0) into graphics object g
  const drawCup = (g, lifted, showBone) => {
    g.clear();
    const ly = lifted ? -36 : 0;
    g.fillStyle(0x000000, 0.12); g.fillEllipse(0, 28, 56, 10);         // shadow
    if (showBone) {
      g.fillStyle(0xefe4cc, 1); g.fillRect(-14, 12, 28, 8);
      g.fillCircle(-14, 16, 7); g.fillCircle(-14, 12, 7);
      g.fillCircle(14, 16, 7);  g.fillCircle(14, 12, 7);
    }
    g.fillStyle(0xc07030, 1); g.fillRect(-24, -38 + ly, 48, 60);
    g.fillStyle(0xd08840, 1); g.fillRect(-24, -38 + ly, 48, 8);
    g.fillStyle(0xa05820, 1); g.fillRect(-28,  20 + ly, 56, 8);
    g.fillStyle(0xe09850, 0.4); g.fillRect(-20, -34 + ly, 12, 40);
  };

  // Graphics objects positioned at cup centres; draw in local space
  const cups = startXs.map(cx => {
    const g = scene.add.graphics().setDepth(95);
    g.x = cx; g.y = CY;
    objects.push(g);
    return g;
  });
  cups.forEach(g => drawCup(g, false, false));

  const statusTxt = scene.add.text(ax + aw / 2, ay + ah - 12, 'Watch carefully...', {
    fontSize: '10px', fontFamily: 'Georgia, serif', color: '#7a4020'
  }).setOrigin(0.5).setDepth(96);
  objects.push(statusTxt);

  // Step 1: lift cup boneIdx so player sees the bone
  scene.time.delayedCall(350, () => {
    drawCup(cups[boneIdx], true, true);
    scene.time.delayedCall(900, () => {
      drawCup(cups[boneIdx], false, false);
      scene.time.delayedCall(280, () => doShuffle());
    });
  });

  function doShuffle() {
    statusTxt.setText('Shuffling...');
    const SWAPS = [[0, 1], [1, 2], [0, 2], [1, 0], [2, 1], [0, 2]];
    let step = 0;

    const next = () => {
      if (step >= SWAPS.length) { enableGuess(); return; }
      const [a, b] = SWAPS[step++];
      const xA = cups[a].x, xB = cups[b].x;
      scene.tweens.add({ targets: cups[a], x: xB, duration: 260, ease: 'Sine.easeInOut' });
      scene.tweens.add({ targets: cups[b], x: xA, duration: 260, ease: 'Sine.easeInOut',
        onComplete: () => { scene.time.delayedCall(70, next); }
      });
      if (boneIdx === a) boneIdx = b;
      else if (boneIdx === b) boneIdx = a;
    };
    next();
  }

  function enableGuess() {
    canGuess = true;
    statusTxt.setText('Which cup hides the bone? Tap it!');
    cups.forEach((cup, i) => {
      const z = scene.add.rectangle(cup.x, cup.y, 56, 72, 0xffffff, 0).setDepth(97).setInteractive({ useHandCursor: true });
      objects.push(z);
      // Keep z position in sync if cups were moved by shuffle
      z.x = cup.x;
      cup.setData('zone', z);

      z.on('pointerover', () => cup.setScale(1.06)).on('pointerout', () => cup.setScale(1));
      z.on('pointerdown', () => {
        if (!canGuess) return;
        canGuess = false;
        z.disableInteractive();
        if (i === boneIdx) {
          drawCup(cup, true, true);
          statusTxt.setText('🎉 You found the bone!').setStyle({ color: '#44aa44' });
          spawnSparkle(scene, cup.x, cup.y - 20, objects);
          scene.time.delayedCall(600, onSucceed);
        } else {
          attempts++;
          drawCup(cup, true, false);
          const msg = attempts < 2 ? '❌ Nope! Try again!' : '🔍 Here it was!';
          statusTxt.setText(msg).setStyle({ color: '#cc3322' });
          scene.time.delayedCall(650, () => {
            drawCup(cup, false, false);
            if (attempts >= 2) {
              drawCup(cups[boneIdx], true, true);
              scene.time.delayedCall(900, onSucceed);
            } else {
              canGuess = true;
              z.setInteractive({ useHandCursor: true });
              statusTxt.setStyle({ color: '#7a4020' });
            }
          });
        }
      });
    });
  }
}

// ── 5. BALL — "Pump It Up!" ───────────────────────────────────────────────────
export function buildPump(scene, ax, ay, aw, ah, objects, onSucceed) {
  const MAX = 15; let taps = 0;
  instr(scene, ax, ay, aw, 'Click the pump handle 15 times to inflate the ball!', objects);

  const ballX = ax + aw * 0.66, ballY = ay + ah * 0.48;
  const ballG = scene.add.graphics().setDepth(95);
  objects.push(ballG);
  const drawBall = (stage) => {
    ballG.clear();
    const r = 16 + stage * 7;
    ballG.fillStyle(0x8cc838, 1); ballG.fillCircle(ballX, ballY, r);
    ballG.fillStyle(0xa4de50, 0.65); ballG.fillCircle(ballX - r * 0.3, ballY - r * 0.3, r * 0.42);
    ballG.lineStyle(2.5, 0xffffff, 0.65);
    ballG.beginPath(); ballG.arc(ballX, ballY, r * 0.82, -0.65, 0.65); ballG.strokePath();
    ballG.beginPath(); ballG.arc(ballX, ballY, r * 0.82, Math.PI - 0.65, Math.PI + 0.65); ballG.strokePath();
    if (stage >= 5) { ballG.lineStyle(3, 0xffee44, 0.55); ballG.strokeCircle(ballX, ballY, r + 5); }
  };
  drawBall(0);

  const pX = ax + aw * 0.27, pBaseY = ay + ah * 0.82;
  const pumpG = scene.add.graphics().setDepth(95);
  objects.push(pumpG);
  const drawPump = (pressed) => {
    pumpG.clear();
    const hOff = pressed ? 14 : 0;
    pumpG.fillStyle(0x888878, 1); pumpG.fillRect(pX - 14, pBaseY - 10, 28, 14);
    pumpG.fillStyle(0xaaa898, 1); pumpG.fillRect(pX - 8, pBaseY - 68, 16, 60);
    pumpG.fillStyle(0xccbba8, 0.4); pumpG.fillRect(pX - 6, pBaseY - 66, 5, 56);
    pumpG.fillStyle(0x4488cc, 1); pumpG.fillRoundedRect(pX - 22, pBaseY - 80 + hOff, 44, 11, 4);
    pumpG.lineStyle(3, 0x555555, 0.7);
    pumpG.beginPath(); pumpG.moveTo(pX + 14, pBaseY - 40); pumpG.lineTo(ballX - 18, ballY + 12); pumpG.strokePath();
  };
  drawPump(false);

  const tapLbl = scene.add.text(pX, pBaseY - 96, 'PUSH!', { fontSize: '11px', fontFamily: 'Georgia, serif', color: '#2266aa', stroke: '#fff', strokeThickness: 1 }).setOrigin(0.5).setDepth(96);
  objects.push(tapLbl);

  const bar = progressBar(scene, ax, ay, aw, ah, objects);
  bar.update(0, MAX);

  const pumpZone = hitRect(scene, pX, pBaseY - 46, 50, 80, 97, objects);
  pumpZone.on('pointerover', () => tapLbl.setScale(1.1)).on('pointerout', () => tapLbl.setScale(1));
  pumpZone.on('pointerdown', () => {
    if (taps >= MAX) return;
    taps++;
    bar.update(taps, MAX);
    drawPump(true); scene.time.delayedCall(130, () => drawPump(false));
    drawBall(Math.floor(taps / 3));
    scene.tweens.add({ targets: ballG, scaleX: 1.06, scaleY: 1.06, duration: 75, yoyo: true });
    if (taps >= MAX) { pumpZone.removeInteractive(); scene.time.delayedCall(300, onSucceed); }
  });
}

// ── 6. FLOWER POT — "Memory Match!" ──────────────────────────────────────────
export function buildMemory(scene, ax, ay, aw, ah, objects, onSucceed) {
  instr(scene, ax, ay, aw, 'Flip cards and find the 3 matching flower pairs!', objects);

  const PAIRS = [0xff4477, 0xffcc22, 0x44aaff];
  const deck  = [...PAIRS, ...PAIRS].sort(() => Math.random() - 0.5);
  let flipped = [], matched = 0, locked = false;

  const cW = 62, cH = 72, gap = 10;
  const startX = ax + (aw - (3 * cW + 2 * gap)) / 2;
  const startY = ay + 30;

  deck.map((color, idx) => {
    const col = idx % 3, row = Math.floor(idx / 3);
    const cx = startX + col * (cW + gap) + cW / 2;
    const cy = startY + row * (cH + gap) + cH / 2;

    const back = scene.add.graphics().setDepth(95);
    back.fillStyle(0x5a3a1a, 1); back.fillRoundedRect(cx - cW / 2, cy - cH / 2, cW, cH, 6);
    back.fillStyle(0x7a5a2a, 0.45); back.fillRoundedRect(cx - cW / 2 + 4, cy - cH / 2 + 4, cW - 8, cH - 8, 4);
    back.fillStyle(0x9a7a3a, 0.35); back.fillCircle(cx, cy, 17); back.fillCircle(cx, cy, 9);
    objects.push(back);

    const front = scene.add.graphics().setDepth(94).setAlpha(0);
    front.fillStyle(0xfdf4ec, 1); front.fillRoundedRect(cx - cW / 2, cy - cH / 2, cW, cH, 6);
    front.lineStyle(2, color, 0.9); front.strokeRoundedRect(cx - cW / 2, cy - cH / 2, cW, cH, 6);
    for (let p = 0; p < 6; p++) { const a = (p / 6) * Math.PI * 2; front.fillStyle(color, 1); front.fillCircle(cx + Math.cos(a) * 11, cy + Math.sin(a) * 11, 8); }
    front.fillStyle(0xffee44, 1); front.fillCircle(cx, cy, 7);
    objects.push(front);

    const card = { color, back, front, matched: false, isFlipped: false, cx, cy };
    const z = hitRect(scene, cx, cy, cW, cH, 97, objects);

    z.on('pointerover', () => { if (!card.isFlipped && !card.matched) { back.y -= 4; front.y -= 4; } });
    z.on('pointerout',  () => { back.y = 0; front.y = 0; });
    z.on('pointerdown', () => {
      if (locked || card.isFlipped || card.matched) return;
      card.isFlipped = true;
      scene.tweens.add({ targets: back, scaleX: 0, duration: 110, onComplete: () => { back.setAlpha(0); back.scaleX = 1; } });
      front.setAlpha(1); front.scaleX = 0;
      scene.tweens.add({ targets: front, scaleX: 1, duration: 110 });
      flipped.push(card);

      if (flipped.length === 2) {
        locked = true;
        const [a, b] = flipped;
        if (a.color === b.color) {
          [a, b].forEach(c => { c.matched = true; spawnSparkle(scene, c.cx, c.cy, objects); });
          matched++;
          flipped = [];
          scene.time.delayedCall(380, () => { locked = false; if (matched >= PAIRS.length) scene.time.delayedCall(180, onSucceed); });
        } else {
          scene.time.delayedCall(700, () => {
            [a, b].forEach(c => {
              c.isFlipped = false;
              scene.tweens.add({ targets: c.front, scaleX: 0, duration: 110, onComplete: () => { c.front.setAlpha(0); c.front.scaleX = 1; } });
              c.back.setAlpha(1); c.back.scaleX = 0;
              scene.tweens.add({ targets: c.back, scaleX: 1, duration: 110 });
            });
            flipped = []; locked = false;
          });
        }
      }
    });
    return card;
  });
}

// ── 7. WELCOME SIGN — "Spell GAMMA!" ─────────────────────────────────────────
export function buildSpell(scene, ax, ay, aw, ah, objects, onSucceed) {
  const WORD = ['G', 'A', 'M', 'M', 'A'];
  let nextIdx = 0;
  instr(scene, ax, ay, aw, 'Tap the letters in order to spell  G – A – M – M – A!', objects);

  // Answer slots
  const sW = 34, sGap = 8, totalSW = WORD.length * (sW + sGap) - sGap;
  const sStartX = ax + (aw - totalSW) / 2, sY = ay + 44;
  const slotTxts = WORD.map((_, i) => {
    const sx = sStartX + i * (sW + sGap) + sW / 2;
    const sg = scene.add.graphics().setDepth(95);
    sg.fillStyle(0xe8d8c8, 1); sg.fillRoundedRect(sx - sW / 2, sY, sW, 36, 5);
    sg.lineStyle(2, 0xd0b898, 0.8); sg.strokeRoundedRect(sx - sW / 2, sY, sW, 36, 5);
    objects.push(sg);
    const t = scene.add.text(sx, sY + 18, '_', { fontSize: '18px', fontFamily: 'Georgia, serif', color: '#8a6848' }).setOrigin(0.5).setDepth(96);
    objects.push(t);
    return { g: sg, t, sx };
  });

  // Scrambled tiles
  const positions = [
    [ax + aw * 0.12, ay + 110], [ax + aw * 0.30, ay + 120],
    [ax + aw * 0.50, ay + 108], [ax + aw * 0.70, ay + 118],
    [ax + aw * 0.88, ay + 110],
  ].sort(() => Math.random() - 0.5);

  WORD.forEach((letter, i) => {
    const [lx, ly] = positions[i];
    const tileG = scene.add.graphics().setDepth(95);
    tileG.fillStyle(0xd94060, 1); tileG.fillRoundedRect(lx - 20, ly - 20, 40, 40, 7);
    tileG.fillStyle(0xf08090, 0.4); tileG.fillRect(lx - 18, ly - 18, 20, 8);
    tileG.lineStyle(2, 0xaa2040, 0.7); tileG.strokeRoundedRect(lx - 20, ly - 20, 40, 40, 7);
    objects.push(tileG);

    const lTxt = scene.add.text(lx, ly, letter, { fontSize: '22px', fontFamily: 'Georgia, serif', color: '#ffffff', stroke: '#8a0020', strokeThickness: 2 }).setOrigin(0.5).setDepth(96);
    objects.push(lTxt);
    scene.tweens.add({ targets: [tileG, lTxt], y: '-=5', duration: 500 + i * 80, yoyo: true, repeat: -1 });

    const z = hitRect(scene, lx, ly, 44, 44, 97, objects);
    z.on('pointerover', () => { tileG.setScale(1.08); lTxt.setScale(1.08); });
    z.on('pointerout',  () => { tileG.setScale(1); lTxt.setScale(1); });
    z.on('pointerdown', () => {
      if (WORD[nextIdx] !== letter) { wrongShake(scene, tileG); return; }
      z.removeInteractive();
      scene.tweens.killTweensOf(tileG); scene.tweens.killTweensOf(lTxt);
      const slot = slotTxts[nextIdx];
      scene.tweens.add({ targets: [tileG, lTxt], x: slot.sx, y: sY + 18, duration: 340, ease: 'Cubic.easeOut',
        onComplete: () => {
          tileG.clear(); tileG.fillStyle(0x44aa44, 1); tileG.fillRoundedRect(slot.sx - 17, sY + 1, 34, 34, 5);
          slot.t.setText(letter).setStyle({ color: '#ffffff' });
          spawnSparkle(scene, slot.sx, sY + 18, objects);
        }
      });
      nextIdx++;
      if (nextIdx >= WORD.length) scene.time.delayedCall(600, onSucceed);
    });
  });
}

// ── 8. BALLOON — "Match the Colors!" ─────────────────────────────────────────
export function buildBalloonMatch(scene, ax, ay, aw, ah, objects, onSucceed) {
  const TARGETS = [0xff3344, 0x4488ff, 0xffcc22];
  const EXTRA   = [0x44cc44, 0xcc44ff, 0xff8800, 0x22bbcc, 0xee4422];
  const ALL_COL = [...TARGETS, ...EXTRA].sort(() => Math.random() - 0.5).slice(0, 8);
  let found = 0;
  instr(scene, ax, ay, aw, 'Tap only the RED, BLUE and YELLOW balloons!', objects);

  // Reference row
  TARGETS.forEach((col, i) => {
    const rx = ax + aw * 0.18 + i * aw * 0.26, ry = ay + 36;
    const g = scene.add.graphics().setDepth(95);
    g.fillStyle(col, 1); g.fillEllipse(rx, ry, 26, 32);
    g.fillStyle(0xffffff, 0.35); g.fillEllipse(rx - 5, ry - 8, 10, 13);
    objects.push(g);
  });
  const refLbl = scene.add.text(ax + aw / 2, ay + 56, '▲ Find these 3 colors ▲', { fontSize: '9px', fontFamily: 'Georgia, serif', color: '#7a5020' }).setOrigin(0.5).setDepth(95);
  objects.push(refLbl);

  const countTxt = scene.add.text(ax + aw / 2, ay + ah - 12, '0 / 3 found', { fontSize: '10px', fontFamily: 'Georgia, serif', color: '#5a3020' }).setOrigin(0.5).setDepth(96);
  objects.push(countTxt);

  const bPositions = [
    [ax + 28,       ay + 80], [ax + 88,       ay + 74], [ax + 152,      ay + 82],
    [ax + aw - 28,  ay + 80], [ax + aw - 88,  ay + 74], [ax + aw - 152, ay + 82],
    [ax + aw * 0.43,ay + 70], [ax + aw * 0.57,ay + 86],
  ];

  ALL_COL.forEach((col, i) => {
    const [bx, by] = bPositions[i] || [ax + 50 + i * 50, ay + 80];
    const bg = scene.add.graphics().setDepth(95);
    bg.fillStyle(col, 1); bg.fillEllipse(bx, by, 30, 36);
    bg.fillStyle(0xffffff, 0.35); bg.fillEllipse(bx - 5, by - 8, 11, 13);
    bg.lineStyle(1.5, 0x000000, 0.15); bg.strokeEllipse(bx, by, 30, 36);
    bg.fillStyle(col, 1); bg.fillCircle(bx, by + 18, 3);
    objects.push(bg);
    scene.tweens.add({ targets: bg, y: bg.y - 5, duration: 620 + i * 90, yoyo: true, repeat: -1 });

    const z = hitRect(scene, bx, by, 34, 40, 97, objects);
    z.on('pointerover', () => bg.setScale(1.12)).on('pointerout', () => bg.setScale(1));
    z.on('pointerdown', () => {
      if (TARGETS.includes(col)) {
        z.removeInteractive(); scene.tweens.killTweensOf(bg);
        scene.tweens.add({ targets: bg, scale: 2, alpha: 0, duration: 240, onComplete: () => { try { bg.destroy(); } catch (_) {} } });
        spawnSparkle(scene, bx, by, objects);
        found++; countTxt.setText(`${found} / 3 found`);
        if (found >= TARGETS.length) scene.time.delayedCall(280, onSucceed);
      } else {
        wrongShake(scene, bg);
      }
    });
  });
}

// ── 9. CAKE — "Light the Candles!" ───────────────────────────────────────────
export function buildCandleLight(scene, ax, ay, aw, ah, objects, onSucceed) {
  let lit = 0;
  instr(scene, ax, ay, aw, "Tap each candle to light it for Gamma's party!", objects);

  const cakeX = ax + aw / 2, cakeY = ay + ah - 26;
  const cakeG = scene.add.graphics().setDepth(95);
  cakeG.fillStyle(0xfff0e0, 1); cakeG.fillRect(cakeX - 72, cakeY - 38, 144, 42);
  cakeG.fillStyle(0xff88bb, 1);
  for (let di = 0; di < 6; di++) cakeG.fillEllipse(cakeX - 60 + di * 24, cakeY - 38, 26, 10);
  cakeG.fillStyle(0xffe8c8, 0.5); cakeG.fillRect(cakeX - 72, cakeY - 36, 144, 8);
  cakeG.lineStyle(1.5, 0xf0c8a0, 0.7); cakeG.strokeRect(cakeX - 72, cakeY - 38, 144, 42);
  objects.push(cakeG);

  const countTxt = scene.add.text(cakeX, ay + ah - 10, '0 / 3 lit', { fontSize: '10px', fontFamily: 'Georgia, serif', color: '#7a3020' }).setOrigin(0.5).setDepth(96);
  objects.push(countTxt);

  [[cakeX - 40, 0xff4444], [cakeX, 0x4488ff], [cakeX + 40, 0x44cc44]].forEach(([cx, candleCol], i) => {
    const cy = cakeY - 52;
    const cndG = scene.add.graphics().setDepth(95);
    cndG.fillStyle(candleCol, 1); cndG.fillRect(cx - 5, cy, 10, 30);
    cndG.fillStyle(0xffffff, 0.3); cndG.fillRect(cx - 4, cy + 2, 4, 24);
    cndG.fillStyle(0x222210, 1); cndG.fillRect(cx - 1, cy - 8, 2, 10);
    objects.push(cndG);
    scene.tweens.add({ targets: cndG, y: cndG.y - 3, duration: 520 + i * 80, yoyo: true, repeat: -1 });

    const flameG = scene.add.graphics().setDepth(96).setAlpha(0);
    objects.push(flameG);
    const drawFlame = () => { flameG.clear(); flameG.fillStyle(0xff8800, 0.9); flameG.fillEllipse(cx, cy - 14, 10, 18); flameG.fillStyle(0xffee22, 0.9); flameG.fillEllipse(cx, cy - 16, 6, 12); flameG.fillStyle(0xffffff, 0.6); flameG.fillEllipse(cx, cy - 17, 3, 6); };
    drawFlame();

    const z = hitRect(scene, cx, cy + 12, 22, 52, 97, objects);
    z.on('pointerover', () => cndG.setScale(1.05)).on('pointerout', () => cndG.setScale(1));
    z.on('pointerdown', () => {
      if (flameG.alpha > 0) return;
      z.removeInteractive();
      scene.tweens.add({ targets: flameG, alpha: 1, duration: 260, ease: 'Back.easeOut' });
      scene.tweens.add({ targets: flameG, scaleY: 1.15, duration: 250, yoyo: true, repeat: -1 });
      spawnSparkle(scene, cx, cy - 14, objects);
      lit++; countTxt.setText(`${lit} / 3 lit`);
      if (lit >= 3) scene.time.delayedCall(380, onSucceed);
    });
  });
}

// ── 10. BANNER — "Copy the Pattern!" ─────────────────────────────────────────
export function buildPatternSeq(scene, ax, ay, aw, ah, objects, onSucceed) {
  const COLORS = [0xff4444, 0x4488ff, 0xffcc22, 0x44cc44];
  const LABELS = ['Red', 'Blue', 'Yellow', 'Green'];
  const SEQ = Array.from({ length: 4 }, () => Math.floor(Math.random() * 4));
  let phase = 'show', guessIdx = 0, showIdx = 0;

  const instrTxt = instr(scene, ax, ay, aw, 'Watch the color pattern, then repeat it!', objects);

  const bxW = 36, bxGap = 8, totalBxW = SEQ.length * (bxW + bxGap) - bxGap;
  const bxStartX = ax + (aw - totalBxW) / 2, bxY = ay + 42;
  const seqBoxes = SEQ.map((ci, i) => {
    const bx = bxStartX + i * (bxW + bxGap) + bxW / 2;
    const g = scene.add.graphics().setDepth(95);
    g.fillStyle(0xe0d0c0, 1); g.fillRoundedRect(bx - bxW / 2, bxY, bxW, 28, 5);
    g.lineStyle(1.5, 0xc0a888, 0.7); g.strokeRoundedRect(bx - bxW / 2, bxY, bxW, 28, 5);
    objects.push(g);
    return { g, bx, ci };
  });

  const btnW = 54, btnGap = 10, totalBtnW = 4 * (btnW + btnGap) - btnGap;
  const btnStartX = ax + (aw - totalBtnW) / 2, btnY = ay + 100;
  const btns = COLORS.map((col, i) => {
    const bx = btnStartX + i * (btnW + btnGap) + btnW / 2;
    const g = scene.add.graphics().setDepth(95);
    const draw = (active) => {
      g.clear(); g.fillStyle(col, active ? 1 : 0.5); g.fillRoundedRect(bx - btnW / 2, btnY, btnW, 30, 7);
      g.fillStyle(0xffffff, 0.22); g.fillRect(bx - btnW / 2 + 4, btnY + 3, btnW - 8, 8);
    };
    draw(false);
    const lbl = scene.add.text(bx, btnY + 34, LABELS[i], { fontSize: '9px', fontFamily: 'Georgia, serif', color: '#7a5030' }).setOrigin(0.5, 0).setDepth(96);
    objects.push(g, lbl);
    const z = hitRect(scene, bx, btnY + 15, btnW, 30, 97, objects);
    return { g, lbl, draw, z, ci: i };
  });

  const showSeq = () => {
    instrTxt.setText('Watch the pattern...');
    btns.forEach(b => b.z.disableInteractive());
    const showNext = () => {
      if (showIdx >= SEQ.length) {
        scene.time.delayedCall(380, () => {
          instrTxt.setText('Now repeat the pattern!');
          btns.forEach(b => b.z.setInteractive({ useHandCursor: true }));
          phase = 'guess';
        });
        return;
      }
      const ci = SEQ[showIdx];
      seqBoxes[showIdx].g.clear(); seqBoxes[showIdx].g.fillStyle(COLORS[ci], 1); seqBoxes[showIdx].g.fillRoundedRect(seqBoxes[showIdx].bx - bxW / 2, bxY, bxW, 28, 5);
      btns[ci].draw(true);
      scene.time.delayedCall(580, () => {
        seqBoxes[showIdx].g.clear(); seqBoxes[showIdx].g.fillStyle(0xe0d0c0, 1); seqBoxes[showIdx].g.fillRoundedRect(seqBoxes[showIdx].bx - bxW / 2, bxY, bxW, 28, 5); seqBoxes[showIdx].g.lineStyle(1.5, 0xc0a888, 0.7); seqBoxes[showIdx].g.strokeRoundedRect(seqBoxes[showIdx].bx - bxW / 2, bxY, bxW, 28, 5);
        btns[ci].draw(false);
        showIdx++;
        scene.time.delayedCall(180, showNext);
      });
    };
    scene.time.delayedCall(380, showNext);
  };
  showSeq();

  btns.forEach(btn => {
    btn.z.on('pointerdown', () => {
      if (phase !== 'guess') return;
      btn.draw(true); scene.time.delayedCall(180, () => btn.draw(false));
      if (btn.ci === SEQ[guessIdx]) {
        const box = seqBoxes[guessIdx];
        box.g.clear(); box.g.fillStyle(COLORS[btn.ci], 1); box.g.fillRoundedRect(box.bx - bxW / 2, bxY, bxW, 28, 5);
        box.g.lineStyle(2, 0x44cc44, 0.9); box.g.strokeRoundedRect(box.bx - bxW / 2, bxY, bxW, 28, 5);
        spawnSparkle(scene, box.bx, bxY + 14, objects);
        guessIdx++;
        if (guessIdx >= SEQ.length) { btns.forEach(b => b.z.disableInteractive()); scene.time.delayedCall(380, onSucceed); }
      } else {
        wrongShake(scene, btn.g);
        instrTxt.setText('Wrong! Watch again...').setStyle({ color: '#cc3322' });
        phase = 'show'; guessIdx = 0; showIdx = 0;
        seqBoxes.forEach(box => { box.g.clear(); box.g.fillStyle(0xe0d0c0, 1); box.g.fillRoundedRect(box.bx - bxW / 2, bxY, bxW, 28, 5); box.g.lineStyle(1.5, 0xc0a888, 0.7); box.g.strokeRoundedRect(box.bx - bxW / 2, bxY, bxW, 28, 5); });
        btns.forEach(b => b.z.disableInteractive());
        scene.time.delayedCall(660, () => { instrTxt.setStyle({ color: '#5a3820' }); showSeq(); });
      }
    });
    btn.z.on('pointerover', () => { if (phase === 'guess') btn.g.setScale(1.07); });
    btn.z.on('pointerout',  () => btn.g.setScale(1));
  });
}

// ── 11. GIFT — "Wrap the Gift!" ───────────────────────────────────────────────
export function buildWrapGift(scene, ax, ay, aw, ah, objects, onSucceed) {
  let taps = 0; const MAX = 8;
  instr(scene, ax, ay, aw, 'Tap the gift box to wrap and decorate it!', objects);

  const gX = ax + aw / 2, gY = ay + ah * 0.46;
  const giftG = scene.add.graphics().setDepth(95);
  objects.push(giftG);

  const drawGift = (stage) => {
    giftG.clear();
    giftG.fillStyle(0x000000, 0.1); giftG.fillEllipse(gX, gY + 50, 76, 10);
    giftG.fillStyle(0x4488dd, 1); giftG.fillRect(gX - 38, gY - 38, 76, 52);
    giftG.fillStyle(0x6699ee, 0.32); giftG.fillRect(gX - 36, gY - 36, 36, 12);
    giftG.fillStyle(0x3377cc, 1); giftG.fillRect(gX - 42, gY - 48, 84, 14);
    giftG.fillStyle(0x5599ee, 0.38); giftG.fillRect(gX - 40, gY - 48, 80, 5);
    if (stage >= 1) {
      giftG.fillStyle(0xff4488, 1); giftG.fillRect(gX - 5, gY - 48, 10, 66); giftG.fillRect(gX - 42, gY - 38, 84, 10);
    }
    if (stage >= 2) {
      giftG.fillStyle(0xff2266, 1); giftG.fillEllipse(gX - 18, gY - 44, 26, 16); giftG.fillEllipse(gX + 18, gY - 44, 26, 16); giftG.fillCircle(gX, gY - 44, 8);
    }
    if (stage >= 3) {
      [[10,-28],[-22,-14],[22,-10],[-10,2],[0,-40]].forEach(([ox,oy]) => { giftG.fillStyle(0xffffff, 0.38); giftG.fillCircle(gX + ox, gY + oy, 5); });
    }
    giftG.lineStyle(1.5, 0x2255aa, 0.5); giftG.strokeRect(gX - 38, gY - 38, 76, 52); giftG.strokeRect(gX - 42, gY - 48, 84, 14);
  };
  drawGift(0);

  const bar = progressBar(scene, ax, ay, aw, ah, objects);
  bar.update(0, MAX);
  const stageLbl = scene.add.text(gX, gY + 60, 'Unwrapped', { fontSize: '10px', fontFamily: 'Georgia, serif', color: '#7a5030' }).setOrigin(0.5).setDepth(96);
  objects.push(stageLbl);

  const giftZone = hitRect(scene, gX, gY + 4, 90, 100, 97, objects);
  giftZone.on('pointerover', () => giftG.setScale(1.04)).on('pointerout', () => giftG.setScale(1));
  giftZone.on('pointerdown', () => {
    if (taps >= MAX) return;
    taps++;
    bar.update(taps, MAX);
    scene.tweens.add({ targets: giftG, scaleX: 1.07, scaleY: 0.94, duration: 65, yoyo: true });
    const stage = Math.floor((taps / MAX) * 4);
    drawGift(stage);
    const stageLabels = ['Wrapping...', 'Adding ribbon...', 'Tying the bow...', 'Adding sparkles!'];
    stageLbl.setText(stageLabels[Math.min(stage, stageLabels.length - 1)]);
    spawnSparkle(scene, gX + (Math.random() - 0.5) * 60, gY + (Math.random() - 0.5) * 38, objects);
    if (taps >= MAX) { giftZone.removeInteractive(); scene.time.delayedCall(280, onSucceed); }
  });
}

// ── ROUTER ────────────────────────────────────────────────────────────────────
export const ACTIVITY_META = {
  bed:          { title: '🛏️ Fluff the Bed!',       color: 0xe0589a, fn: buildFluff         },
  food_bowl:    { title: '🍖 Collect the Kibble!',   color: 0xcc3828, fn: buildKibble        },
  water_bowl:   { title: '💧 Fill the Bowl!',        color: 0x2880cc, fn: buildWaterFill     },
  bone:         { title: '🦴 Shell Game!',           color: 0xb88050, fn: buildShellGame     },
  ball:         { title: '🎾 Pump It Up!',           color: 0x8cc838, fn: buildPump          },
  flower_pot:   { title: '🌸 Memory Match!',         color: 0x44aa44, fn: buildMemory        },
  welcome_sign: { title: '📝 Spell GAMMA!',          color: 0xd94060, fn: buildSpell         },
  balloon:      { title: '🎈 Match the Colors!',     color: 0x4488ff, fn: buildBalloonMatch  },
  cake:         { title: '🎂 Light the Candles!',    color: 0xff8800, fn: buildCandleLight   },
  banner:       { title: '🎀 Copy the Pattern!',     color: 0xcc44ff, fn: buildPatternSeq    },
  gift:         { title: '🎁 Wrap the Gift!',        color: 0xff4488, fn: buildWrapGift      },
};
