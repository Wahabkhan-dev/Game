// ════════════════════════════════════════════════════════════════════════════
// L8_Activities.js  — 5 story mini-activities for Level 8 "Puppy Care Day"
//
// Pattern mirrors L4_Activities.js: each builder draws its game into the
// content area (ax,ay,aw,ah) of an already-open panel popup.
//
// Builder signature:
//   buildXxx(scene, ax, ay, aw, ah, objects, onSucceed, D)
//     ax,ay      – top-left of content area inside the panel
//     aw,ah      – size of that content area
//     objects    – push every Phaser object here; auto-destroyed on close
//     onSucceed  – call when the player wins
//     D          – base depth (panel body is at 100–102, content here = D 103+)
//
// Usage:  scene.runActivity('good_food', onDone)  — see L8BaseScene.runActivity()
// Add:    write builder + add row to ACTIVITY_META at bottom.
// ════════════════════════════════════════════════════════════════════════════

// ── shared palette ────────────────────────────────────────────────────────────
const PURPLE = 0x6a3fa0;
const GOLD   = 0xffd23a;
const GREEN  = 0x6ad06a;
const RED    = 0xe04040;

// ── tiny helpers ──────────────────────────────────────────────────────────────
function instr(scene, ax, ay, aw, text, objects, D) {
  const t = scene.add.text(ax + aw / 2, ay + 6, text, {
    fontSize: '12px', fontFamily: 'Georgia, serif',
    color: '#ffe8c0', stroke: '#2a1608', strokeThickness: 2,
    align: 'center', wordWrap: { width: aw - 20 }
  }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(D);
  objects.push(t);
  return t;
}

function progressBar(scene, ax, ay, aw, ah, objects, D) {
  const bW = aw - 64, bX = ax + 32, bY = ay + ah - 16;
  const bg   = scene.add.rectangle(bX + bW / 2, bY, bW, 12, 0xe6dcef)
    .setScrollFactor(0).setDepth(D).setStrokeStyle(1.5, PURPLE, 0.6);
  const fill = scene.add.rectangle(bX, bY, 2, 12, GREEN)
    .setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 1);
  const lbl  = scene.add.text(bX + bW / 2, bY + 11, '', {
    fontSize: '9px', fontFamily: 'Georgia, serif', color: '#f0e6d0'
  }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(D + 1);
  objects.push(bg, fill, lbl);
  return { bW, fill, lbl,
    update(cur, max) { this.fill.width = Math.max(2, (cur / max) * bW); lbl.setText(`${cur} / ${max}`); } };
}

function hitRect(scene, cx, cy, w, h, objects, D) {
  const z = scene.add.rectangle(cx, cy, w, h, 0xffffff, 0)
    .setScrollFactor(0).setDepth(D).setInteractive({ useHandCursor: true });
  objects.push(z);
  return z;
}

function sparkle(scene, x, y, objects, D) {
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2, d = 20 + Math.random() * 28;
    const s = scene.add.image(x, y, 'l8_spark').setScale(0.7)
      .setScrollFactor(0).setDepth(D)
      .setTint([0xffee44, 0xff88cc, 0x88eeff, 0xaaffaa][i % 4]);
    objects.push(s);
    scene.tweens.add({ targets: s, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d,
      alpha: 0, scale: 1.4, duration: 540, onComplete: () => { try { s.destroy(); } catch (_) {} } });
  }
}

function wrongShake(scene, target, objects) {
  const ox = target.x;
  scene.tweens.add({ targets: target, x: ox + 9, duration: 55, yoyo: true, repeat: 4,
    ease: 'Sine.easeInOut', onComplete: () => { try { target.x = ox; } catch (_) {} } });
  if (target.setTint) {
    target.setTint(0xff5555);
    scene.time.delayedCall(380, () => { try { target.clearTint(); } catch (_) {} });
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ACTIVITY 1 — "Choose Good Food!" (Food Run, stop 1)
// Story: At the pet shop, Gleeda must pick the 3 foods that are SAFE for puppies.
// Tap correct items (bag, bone, milk). Tap wrong ones and they shake + flash red.
// ════════════════════════════════════════════════════════════════════════════
export function buildGoodFood(scene, ax, ay, aw, ah, objects, onSucceed, D) {
  const GOOD_KEYS  = ['l8_food_bag', 'l8_food_bone', 'l8_food_milk'];
  const BAD_EMOJIS = ['🍫', '🍇', '🧅'];
  const NEED = 3;
  let found = 0;

  instr(scene, ax, ay, aw, '🐾 Tap the 3 foods that are SAFE for puppies!', objects, D);

  const count = scene.add.text(ax + aw / 2, ay + ah - 14, `Found: 0 / ${NEED}`, {
    fontSize: '11px', fontFamily: 'Georgia, serif', color: '#f0e6d0'
  }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 1);
  objects.push(count);

  // 6 items (3 good + 3 bad), arranged in 2 rows of 3
  const items = [
    { tex: GOOD_KEYS[0], good: true },
    { tex: GOOD_KEYS[1], good: true },
    { tex: GOOD_KEYS[2], good: true },
    { tex: null, emoji: BAD_EMOJIS[0], good: false },
    { tex: null, emoji: BAD_EMOJIS[1], good: false },
    { tex: null, emoji: BAD_EMOJIS[2], good: false },
  ];
  Phaser.Utils.Array.Shuffle(items);

  const cols = 3, gap = 8;
  const cellW = (aw - gap * (cols + 1)) / cols;
  const cellH = Math.floor((ah - 68) / 2);
  const startX = ax + gap + cellW / 2;
  const rowY   = [ay + 36 + cellH / 2, ay + 36 + cellH + gap + cellH / 2];

  items.forEach((it, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const cx = startX + col * (cellW + gap);
    const cy = rowY[row];

    // card background
    const card = scene.add.graphics().setScrollFactor(0).setDepth(D);
    card.fillStyle(it.good ? 0xf0ffe8 : 0xfff0f0, 1);
    card.fillRoundedRect(cx - cellW / 2, cy - cellH / 2, cellW, cellH, 8);
    card.lineStyle(1.5, it.good ? 0x88cc66 : 0xcc6666, 0.5);
    card.strokeRoundedRect(cx - cellW / 2, cy - cellH / 2, cellW, cellH, 8);
    objects.push(card);

    let icon;
    if (it.tex && scene.textures.exists(it.tex)) {
      icon = scene.add.image(cx, cy - 4, it.tex)
        .setDisplaySize(50, 50).setScrollFactor(0).setDepth(D + 1);
    } else {
      icon = scene.add.text(cx, cy - 8, it.emoji || '?', { fontSize: '34px' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(D + 1);
    }
    objects.push(icon);
    scene.tweens.add({ targets: icon, y: icon.y - 4, duration: 600 + i * 80, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const badLabel = it.good ? null : scene.add.text(cx, cy + cellH / 2 - 10, '🚫 BAD', {
      fontSize: '9px', fontFamily: 'Georgia, serif', color: '#cc3333'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 2).setAlpha(0);
    if (badLabel) objects.push(badLabel);

    const z = hitRect(scene, cx, cy, cellW, cellH, objects, D + 3);
    z.on('pointerover', () => icon.setScale((icon.scaleX || 1) * 1.08));
    z.on('pointerout',  () => icon.setScale(icon._baseScale || 1));
    z.on('pointerdown', () => {
      if (it.done) return;
      if (it.good) {
        it.done = true;
        z.removeInteractive();
        scene.tweens.killTweensOf(icon);
        scene.tweens.add({ targets: icon, y: icon.y - 8, duration: 130, yoyo: true });
        // green tick overlay
        const tick = scene.add.text(cx, cy - 4, '✅', { fontSize: '28px' })
          .setOrigin(0.5).setScrollFactor(0).setDepth(D + 4);
        objects.push(tick);
        sparkle(scene, cx, cy, objects, D + 5);
        found++;
        count.setText(`Found: ${found} / ${NEED}`);
        if (found >= NEED) scene.time.delayedCall(350, onSucceed);
      } else {
        // wrong
        wrongShake(scene, icon, objects);
        if (badLabel) scene.tweens.add({ targets: badLabel, alpha: 1, duration: 200, hold: 800, yoyo: true });
      }
    });
    icon._baseScale = icon.scaleX || 1;
  });
}

// ════════════════════════════════════════════════════════════════════════════
// ACTIVITY 2 — "Count the Hungry Puppies!" (Food Run, stop 2)
// Story: At the puppy park, count the puppies who are waiting for food.
// 7 pups with rumbling tummies — tap the correct number from 3 choices.
// ════════════════════════════════════════════════════════════════════════════
export function buildCountPups(scene, ax, ay, aw, ah, objects, onSucceed, D) {
  const PUP_COUNT = 7;
  const CHOICES   = Phaser.Utils.Array.Shuffle([5, 6, 7]);

  instr(scene, ax, ay, aw, '🐶 How many puppies are waiting for food?\nCount carefully and tap the right number!', objects, D);

  // Draw PUP_COUNT puppy icons in a wrapping row
  const pupCols = 4, pupGap = 8;
  const pupSize = Math.floor((aw - pupGap * (pupCols + 1)) / pupCols);
  for (let i = 0; i < PUP_COUNT; i++) {
    const col = i % pupCols, row = Math.floor(i / pupCols);
    const px = ax + pupGap + col * (pupSize + pupGap) + pupSize / 2;
    const py = ay + 44 + row * (pupSize + 8) + pupSize / 2;
    const pup = scene.add.image(px, py, 'l8_puppy').setDisplaySize(pupSize - 4, pupSize - 4)
      .setScrollFactor(0).setDepth(D);
    objects.push(pup);
    scene.tweens.add({ targets: pup, y: py - 5, duration: 700 + i * 60, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // little hunger rumble icon
    const hunger = scene.add.text(px + pupSize / 2 - 8, py - pupSize / 2 + 2, '😋', { fontSize: '10px' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(D + 1);
    objects.push(hunger);
    scene.tweens.add({ targets: hunger, alpha: 0.3, duration: 450 + i * 40, yoyo: true, repeat: -1 });
  }

  // question label
  const q = scene.add.text(ax + aw / 2, ay + ah - 56, 'How many?', {
    fontSize: '13px', fontFamily: 'Georgia, serif', color: '#ffe8c0', stroke: '#2a1608', strokeThickness: 2
  }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 1);
  objects.push(q);

  // 3 number buttons
  const btnW = 52, btnH = 38, btnGap = 18;
  const totalBW = CHOICES.length * btnW + (CHOICES.length - 1) * btnGap;
  const bStartX = ax + (aw - totalBW) / 2 + btnW / 2;
  const bY = ay + ah - 24;

  CHOICES.forEach((n, i) => {
    const cx = bStartX + i * (btnW + btnGap);
    const bg = scene.add.graphics().setScrollFactor(0).setDepth(D + 1);
    const draw = (hov) => {
      bg.clear();
      bg.fillStyle(hov ? 0x8a5fc0 : PURPLE, 1);
      bg.fillRoundedRect(cx - btnW / 2, bY - btnH / 2, btnW, btnH, 10);
      bg.lineStyle(2, GOLD, 0.9);
      bg.strokeRoundedRect(cx - btnW / 2, bY - btnH / 2, btnW, btnH, 10);
    };
    draw(false); objects.push(bg);

    const t = scene.add.text(cx, bY, `${n}`, {
      fontSize: '20px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#3a1a5a', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 2);
    objects.push(t);

    const z = hitRect(scene, cx, bY, btnW, btnH, objects, D + 3);
    z.on('pointerover', () => { draw(true); t.setScale(1.1); });
    z.on('pointerout',  () => { draw(false); t.setScale(1); });
    z.on('pointerdown', () => {
      if (n === PUP_COUNT) {
        sparkle(scene, cx, bY, objects, D + 4);
        scene.time.delayedCall(320, onSucceed);
      } else {
        wrongShake(scene, t, objects);
        const nope = scene.add.text(cx, bY - 28, 'Try again!', {
          fontSize: '11px', fontFamily: 'Georgia, serif', color: '#cc3333'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 4);
        objects.push(nope);
        scene.tweens.add({ targets: nope, y: nope.y - 14, alpha: 0, duration: 900, onComplete: () => { try { nope.destroy(); } catch (_) {} } });
      }
    });
  });
}

// ════════════════════════════════════════════════════════════════════════════
// ACTIVITY 3 — "Spell PUPPY!" (Food Run, stop 3)
// Story: Near the home zone, Gleeda calls the puppies by spelling their name.
// Tap the letter tiles in order: P → U → P → P → Y.
// ════════════════════════════════════════════════════════════════════════════
export function buildSpellPuppy(scene, ax, ay, aw, ah, objects, onSucceed, D) {
  const WORD = ['P', 'U', 'P', 'P', 'Y'];
  let nextIdx = 0;

  instr(scene, ax, ay, aw, '🐾 Tap the letters in order to spell P – U – P – P – Y!', objects, D);

  // Answer slots (top row)
  const sW = 36, sGap = 10, totalSW = WORD.length * (sW + sGap) - sGap;
  const sStartX = ax + (aw - totalSW) / 2;
  const sY = ay + 40;

  const slotGfx = WORD.map((_, i) => {
    const sx = sStartX + i * (sW + sGap);
    const g = scene.add.graphics().setScrollFactor(0).setDepth(D);
    g.fillStyle(0xede0f5, 1); g.fillRoundedRect(sx, sY, sW, 38, 6);
    g.lineStyle(2, PURPLE, 0.7); g.strokeRoundedRect(sx, sY, sW, 38, 6);
    objects.push(g);
    const t = scene.add.text(sx + sW / 2, sY + 19, '_', {
      fontSize: '20px', fontFamily: 'Georgia, serif', color: '#9a6ac8'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 1);
    objects.push(t);
    return { g, t, sx };
  });

  // Scrambled tile positions (bottom area)
  const tileW = 40, tileH = 40;
  const positions = WORD.map((_, i) => ({
    x: ax + 36 + i * Math.floor((aw - 72) / (WORD.length - 1)),
    y: ay + 130 + (i % 2 === 0 ? 0 : 14)
  }));
  // Shuffle positions so letters aren't in order
  Phaser.Utils.Array.Shuffle(positions);

  WORD.forEach((letter, i) => {
    const { x: lx, y: ly } = positions[i];

    const tileG = scene.add.graphics().setScrollFactor(0).setDepth(D + 1);
    tileG.fillStyle(0xe05070, 1); tileG.fillRoundedRect(lx - tileW / 2, ly - tileH / 2, tileW, tileH, 8);
    tileG.fillStyle(0xff7090, 0.4); tileG.fillRect(lx - tileW / 2 + 4, ly - tileH / 2 + 4, tileW - 8, 9);
    tileG.lineStyle(2, 0xaa2040, 0.7); tileG.strokeRoundedRect(lx - tileW / 2, ly - tileH / 2, tileW, tileH, 8);
    objects.push(tileG);

    const lTxt = scene.add.text(lx, ly, letter, {
      fontSize: '22px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#8a0020', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 2);
    objects.push(lTxt);
    scene.tweens.add({ targets: [tileG, lTxt], y: '-=5', duration: 520 + i * 90, yoyo: true, repeat: -1 });

    const z = hitRect(scene, lx, ly, tileW + 6, tileH + 6, objects, D + 3);
    z.on('pointerover', () => { tileG.setScale(1.08); lTxt.setScale(1.08); });
    z.on('pointerout',  () => { tileG.setScale(1); lTxt.setScale(1); });
    z.on('pointerdown', () => {
      if (WORD[nextIdx] !== letter) { wrongShake(scene, tileG, objects); return; }
      z.removeInteractive();
      scene.tweens.killTweensOf(tileG); scene.tweens.killTweensOf(lTxt);
      const slot = slotGfx[nextIdx];
      const destX = slot.sx + sW / 2;
      scene.tweens.add({
        targets: [tileG, lTxt], x: destX, y: sY + 19, duration: 320, ease: 'Cubic.easeOut',
        onComplete: () => {
          tileG.clear();
          tileG.fillStyle(0x44aa44, 1); tileG.fillRoundedRect(slot.sx + 1, sY + 1, sW - 2, 36, 5);
          slot.t.setText(letter).setStyle({ color: '#fff' });
          sparkle(scene, destX, sY + 19, objects, D + 5);
        }
      });
      nextIdx++;
      if (nextIdx >= WORD.length) scene.time.delayedCall(560, onSucceed);
    });
  });
}

// ════════════════════════════════════════════════════════════════════════════
// ACTIVITY 4 — "Where Does It Go?" (Home Run, stop 1)
// Story: Gleeda needs to remember where each home item belongs before
// decorating. Drag each item to its correct room label.
// ════════════════════════════════════════════════════════════════════════════
export function buildWhereGoesIt(scene, ax, ay, aw, ah, objects, onSucceed, D) {
  const PAIRS = [
    { tex: 'l8_item_bed',          label: 'Sleeping\nCorner', color: 0x88aaff },
    { tex: 'l8_item_waterstation', label: 'Water\nCorner',    color: 0x66ccee },
    { tex: 'l8_item_tunnel',       label: 'Play\nZone',       color: 0xaaee66 },
    { tex: 'l8_item_picture',      label: 'Wall\nSpot',       color: 0xffcc66 },
  ];
  let placed = 0;

  instr(scene, ax, ay, aw, '🏠 Drag each item to its correct spot in the puppy home!', objects, D);

  const leftX = ax + 52, rightX = ax + aw - 88;
  const itemGap = Math.floor((ah - 52) / PAIRS.length);
  const startY = ay + 38 + itemGap / 2;

  // Right-side target slots (labeled boxes)
  const slots = Phaser.Utils.Array.Shuffle(PAIRS.slice()).map((p, i) => {
    const sy = startY + i * itemGap;
    const sg = scene.add.graphics().setScrollFactor(0).setDepth(D);
    sg.fillStyle(p.color, 0.2); sg.fillRoundedRect(rightX - 52, sy - 26, 104, 52, 10);
    sg.lineStyle(2, p.color, 0.9); sg.strokeRoundedRect(rightX - 52, sy - 26, 104, 52, 10);
    objects.push(sg);
    const lt = scene.add.text(rightX, sy, p.label, {
      fontSize: '11px', fontFamily: 'Georgia, serif', color: '#f0e6d0', align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 1);
    objects.push(lt);
    return { ...p, x: rightX, y: sy, sg, lt, filled: false };
  });

  // Left-side draggable items
  Phaser.Utils.Array.Shuffle(PAIRS.slice()).forEach((p, i) => {
    const homeX = leftX, homeY = startY + i * itemGap;
    const img = scene.textures.exists(p.tex)
      ? scene.add.image(homeX, homeY, p.tex).setDisplaySize(50, 50).setScrollFactor(0).setDepth(D + 2)
      : scene.add.rectangle(homeX, homeY, 50, 50, p.color).setScrollFactor(0).setDepth(D + 2);
    objects.push(img);
    img.setInteractive({ useHandCursor: true });
    scene.input.setDraggable(img);
    img.setData('tex', p.tex);
    img.setData('homeX', homeX); img.setData('homeY', homeY);
    const baseSc = img.scaleX || 1;

    scene.input.on('dragstart', (ptr, obj) => {
      if (obj !== img) return;
      obj.setDepth(D + 10);
      obj.setScale(baseSc * 1.2);
    });
    scene.input.on('drag', (ptr, obj, dx, dy) => {
      if (obj !== img) return;
      obj.setPosition(dx, dy);
    });
    scene.input.on('dragend', (ptr, obj) => {
      if (obj !== img || obj.getData('placed')) return;
      obj.setScale(baseSc); obj.setDepth(D + 2);
      let hit = null, best = 9999;
      for (const s of slots) {
        if (s.filled) continue;
        const d = Phaser.Math.Distance.Between(obj.x, obj.y, s.x, s.y);
        if (d < 64 && d < best) { best = d; hit = s; }
      }
      if (hit && hit.tex === obj.getData('tex')) {
        // correct!
        obj.setData('placed', true); obj.disableInteractive();
        hit.filled = true;
        scene.tweens.add({ targets: obj, x: hit.x, y: hit.y, scaleX: baseSc, scaleY: baseSc, duration: 220, ease: 'Back.easeOut' });
        hit.sg.clear();
        hit.sg.fillStyle(GREEN, 0.35); hit.sg.fillRoundedRect(hit.x - 52, hit.y - 26, 104, 52, 10);
        hit.sg.lineStyle(2, GREEN, 1); hit.sg.strokeRoundedRect(hit.x - 52, hit.y - 26, 104, 52, 10);
        sparkle(scene, hit.x, hit.y, objects, D + 5);
        placed++;
        if (placed >= PAIRS.length) scene.time.delayedCall(380, onSucceed);
      } else {
        if (hit) {
          scene.cameras.main.shake(100, 0.006);
          const msg = scene.add.text(obj.x, obj.y - 30, '❌ Wrong spot!', {
            fontSize: '11px', fontFamily: 'Georgia, serif', color: '#cc3333'
          }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 6);
          objects.push(msg);
          scene.tweens.add({ targets: msg, y: msg.y - 18, alpha: 0, duration: 800, onComplete: () => { try { msg.destroy(); } catch (_) {} } });
        }
        scene.tweens.add({ targets: obj, x: homeX, y: homeY, duration: 240, ease: 'Back.easeOut' });
      }
    });
  });
}

// ════════════════════════════════════════════════════════════════════════════
// ACTIVITY 5 — "Clean the Home!" (Home Run, stop 2)
// Story: Before decorating, Gleeda must tap away all the mud/dirt spots
// to clean the puppy home. Mud spots appear — tap them before time runs out!
// Tap 10 mud blobs in 25 seconds. New blobs appear every 3 s.
// ════════════════════════════════════════════════════════════════════════════
export function buildCleanHome(scene, ax, ay, aw, ah, objects, onSucceed, D) {
  const NEED    = 10;
  const TIME_S  = 25;
  let cleaned = 0, timeLeft = TIME_S, done = false;

  instr(scene, ax, ay, aw, '🧹 Tap all the mud blobs to clean the puppy home!', objects, D);

  // timer + progress texts
  const timeTxt = scene.add.text(ax + aw - 12, ay + 6, `⏱ ${TIME_S}s`, {
    fontSize: '12px', fontFamily: 'Georgia, serif', color: '#c04040'
  }).setOrigin(1, 0).setScrollFactor(0).setDepth(D + 1);
  objects.push(timeTxt);

  const bar = progressBar(scene, ax, ay, aw, ah, objects, D); bar.update(0, NEED);

  // floor background (simple home-floor feel)
  const floor = scene.add.graphics().setScrollFactor(0).setDepth(D);
  floor.fillStyle(0xf5e8d0, 1); floor.fillRoundedRect(ax + 4, ay + 28, aw - 8, ah - 48, 10);
  floor.lineStyle(1.5, 0xd0b080, 0.7); floor.strokeRoundedRect(ax + 4, ay + 28, aw - 8, ah - 48, 10);
  objects.push(floor);

  // grid of possible blob spots (4×3)
  const gridCols = 4, gridRows = 3;
  const cellW2 = Math.floor((aw - 24) / gridCols);
  const cellH2 = Math.floor((ah - 68) / gridRows);
  const allSpots = [];
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      allSpots.push({
        x: ax + 12 + c * cellW2 + cellW2 / 2,
        y: ay + 38 + r * cellH2 + cellH2 / 2
      });
    }
  }

  const activeBlobs = [];

  const spawnBlob = () => {
    if (done) return;
    const freeSpots = allSpots.filter(s => !activeBlobs.some(b => b.sx === s.x && b.sy === s.y));
    if (!freeSpots.length) return;
    const spot = Phaser.Math.RND.pick(freeSpots);
    const r = 14 + Math.random() * 8;
    const g = scene.add.graphics().setScrollFactor(0).setDepth(D + 2);
    g.fillStyle(0x7a5a30, 0.88); g.fillEllipse(spot.x, spot.y, r * 2, r * 1.3);
    g.fillStyle(0x9a7a50, 0.45); g.fillEllipse(spot.x - r * 0.25, spot.y - r * 0.18, r * 0.7, r * 0.45);
    objects.push(g);

    const blob = { sx: spot.x, sy: spot.y, g, done: false };
    activeBlobs.push(blob);

    scene.tweens.add({ targets: g, scaleX: 1.06, scaleY: 0.94, duration: 520, yoyo: true, repeat: -1 });

    const z = hitRect(scene, spot.x, spot.y, r * 2 + 10, r * 1.5 + 10, objects, D + 3);
    z.on('pointerover', () => g.setAlpha(0.7));
    z.on('pointerout',  () => g.setAlpha(1));
    z.on('pointerdown', () => {
      if (blob.done || done) return;
      blob.done = true;
      z.removeInteractive(); z.destroy();
      scene.tweens.killTweensOf(g);
      scene.tweens.add({ targets: g, scaleX: 2, scaleY: 2, alpha: 0, duration: 180,
        onComplete: () => { try { g.destroy(); } catch (_) {} } });
      const splash = scene.add.text(spot.x, spot.y, '💦', { fontSize: '18px' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(D + 4);
      objects.push(splash);
      scene.tweens.add({ targets: splash, y: spot.y - 22, alpha: 0, duration: 480,
        onComplete: () => { try { splash.destroy(); } catch (_) {} } });
      const idx = activeBlobs.indexOf(blob);
      if (idx !== -1) activeBlobs.splice(idx, 1);
      cleaned++;
      bar.update(cleaned, NEED);
      if (cleaned >= NEED && !done) { done = true; scene.time.delayedCall(320, onSucceed); }
    });
  };

  // spawn initial blobs + spawn more every 3 s
  spawnBlob(); spawnBlob(); spawnBlob();
  const spawnEvt = scene.time.addEvent({ delay: 3000, loop: true, callback: () => {
    if (done) { spawnEvt.remove(); return; }
    if (activeBlobs.filter(b => !b.done).length < 6) spawnBlob();
  }});
  objects.push({ destroy: () => spawnEvt.remove() }); // cleanup hook

  // countdown timer
  const tickEvt = scene.time.addEvent({ delay: 1000, loop: true, callback: () => {
    if (done) { tickEvt.remove(); return; }
    timeLeft--;
    timeTxt.setText(`⏱ ${timeLeft}s`);
    if (timeLeft <= 8) timeTxt.setStyle({ color: '#ff2020', fontSize: '14px' });
    if (timeLeft <= 0) {
      done = true;
      // time's up — show fail flash and auto-restart the activity popup
      scene.cameras.main.shake(300, 0.012);
      const fail = scene.add.text(ax + aw / 2, ay + ah / 2, "⏱ Time's up!\nTap faster next time!", {
        fontSize: '16px', fontFamily: 'Georgia, serif', color: '#cc3333',
        align: 'center', stroke: '#fff', strokeThickness: 3
      }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 8);
      objects.push(fail);
      // after 1.6 s reset state and re-run the same activity
      scene.time.delayedCall(1600, () => {
        try { fail.destroy(); } catch (_) {}
        // restart the activity inline by re-initialising state
        done = false; cleaned = 0; timeLeft = TIME_S;
        timeTxt.setText(`⏱ ${TIME_S}s`).setStyle({ color: '#c04040', fontSize: '12px' });
        bar.update(0, NEED);
        activeBlobs.forEach(b => { try { b.g.destroy(); } catch (_) {} });
        activeBlobs.length = 0;
        spawnBlob(); spawnBlob(); spawnBlob();
      });
    }
  }});
  objects.push({ destroy: () => tickEvt.remove() }); // cleanup hook
}

// ════════════════════════════════════════════════════════════════════════════
// ACTIVITY 6 — "Match the Food!" (Food Run, stop 4)
// Story: At the market Gleeda plays a memory game with food package pairs.
// Find all 4 pairs. Wrong picks are tracked — 6 wrong resets the counter.
// ════════════════════════════════════════════════════════════════════════════
export function buildMatchFood(scene, ax, ay, aw, ah, objects, onSucceed, D) {
  const FOOD_KEYS = ['l8_food_bag', 'l8_food_milk', 'l8_food_bone', 'l8_food_bowl'];
  const MAX_WRONG = 6;
  let matched = 0, wrongCount = 0;
  let flipped = [], checking = false;

  instr(scene, ax, ay, aw, '🧠 Tap two matching foods to pair them!\nMax 6 wrong picks before the count resets.', objects, D);

  const wrongTxt = scene.add.text(ax + aw - 8, ay + 6, `❌ 0 / ${MAX_WRONG}`, {
    fontSize: '11px', fontFamily: 'Georgia, serif', color: '#c04040'
  }).setOrigin(1, 0).setScrollFactor(0).setDepth(D + 1);
  objects.push(wrongTxt);

  const deck = [...FOOD_KEYS, ...FOOD_KEYS];
  Phaser.Utils.Array.Shuffle(deck);

  const COLS = 4, ROWS = 2;
  const gap = 8;
  const cW = Math.floor((aw - gap * (COLS + 1)) / COLS);
  const cH = Math.floor((ah - 52 - gap * (ROWS + 1)) / ROWS);
  const startX = ax + gap + cW / 2;
  const startY = ay + 52 + gap + cH / 2;

  const cards = deck.map((tex, i) => {
    const col = i % COLS, row = Math.floor(i / COLS);
    const cx = startX + col * (cW + gap);
    const cy = startY + row * (cH + gap);

    const back = scene.add.graphics().setScrollFactor(0).setDepth(D + 1);
    back.fillStyle(PURPLE, 1);
    back.fillRoundedRect(cx - cW / 2, cy - cH / 2, cW, cH, 8);
    back.lineStyle(2, GOLD, 0.8);
    back.strokeRoundedRect(cx - cW / 2, cy - cH / 2, cW, cH, 8);
    objects.push(back);

    const qmark = scene.add.text(cx, cy, '?', {
      fontSize: '20px', fontFamily: 'Georgia, serif', color: '#ffd23a'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 2);
    objects.push(qmark);
    scene.tweens.add({ targets: qmark, y: cy - 5, duration: 640 + i * 70, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const front = scene.textures.exists(tex)
      ? scene.add.image(cx, cy, tex).setDisplaySize(cW - 16, cH - 16).setScrollFactor(0).setDepth(D + 2).setAlpha(0)
      : scene.add.rectangle(cx, cy, cW - 16, cH - 16, GOLD).setScrollFactor(0).setDepth(D + 2).setAlpha(0);
    const fScX = front.scaleX, fScY = front.scaleY;
    objects.push(front);

    const card = { tex, cx, cy, cW, cH, back, qmark, front, fScX, fScY, faceUp: false, matched: false, hit: null };
    const z = hitRect(scene, cx, cy, cW + 4, cH + 4, objects, D + 3);
    card.hit = z;

    z.on('pointerover', () => { if (!card.faceUp && !card.matched) back.setAlpha(0.7); });
    z.on('pointerout',  () => { if (!card.faceUp && !card.matched) back.setAlpha(1); });
    z.on('pointerdown', () => {
      if (checking || card.faceUp || card.matched) return;
      card.faceUp = true;
      back.setAlpha(0); qmark.setAlpha(0);
      scene.tweens.killTweensOf(qmark);
      front.setAlpha(1).setScale(fScX, fScY);
      flipped.push(card);

      if (flipped.length === 2) {
        checking = true;
        const [a, b] = flipped;
        if (a.tex === b.tex) {
          matched++;
          [a, b].forEach(c => {
            c.matched = true;
            c.hit?.removeInteractive();
            const ov = scene.add.graphics().setScrollFactor(0).setDepth(D + 2);
            ov.fillStyle(GREEN, 0.38);
            ov.fillRoundedRect(c.cx - c.cW / 2, c.cy - c.cH / 2, c.cW, c.cH, 8);
            ov.lineStyle(2, GREEN, 1);
            ov.strokeRoundedRect(c.cx - c.cW / 2, c.cy - c.cH / 2, c.cW, c.cH, 8);
            objects.push(ov);
            sparkle(scene, c.cx, c.cy, objects, D + 5);
          });
          flipped = []; checking = false;
          if (matched >= FOOD_KEYS.length) scene.time.delayedCall(400, onSucceed);
        } else {
          wrongCount++;
          wrongTxt.setText(`❌ ${wrongCount} / ${MAX_WRONG}`);
          if (wrongCount >= MAX_WRONG) wrongTxt.setStyle({ color: '#ff2020', fontSize: '13px' });
          scene.cameras.main.shake(80, 0.006);

          scene.time.delayedCall(860, () => {
            [a, b].forEach(c => {
              c.faceUp = false;
              c.front.setAlpha(0);
              c.back.setAlpha(1); c.qmark.setAlpha(1);
              scene.tweens.killTweensOf(c.qmark);
              scene.tweens.add({ targets: c.qmark, y: c.cy - 5, duration: 640, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            });
            flipped = []; checking = false;
            if (wrongCount >= MAX_WRONG) {
              scene.time.delayedCall(300, () => {
                wrongCount = 0;
                wrongTxt.setText(`❌ 0 / ${MAX_WRONG}`).setStyle({ color: '#c04040', fontSize: '11px' });
                const msg = scene.add.text(ax + aw / 2, ay + ah / 2, '⚠️ Too many wrong picks!\nKeep trying!', {
                  fontSize: '13px', fontFamily: 'Georgia, serif', color: '#c04040',
                  align: 'center', stroke: '#fff', strokeThickness: 2
                }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 8);
                objects.push(msg);
                scene.tweens.add({ targets: msg, y: msg.y - 18, alpha: 0, duration: 1400,
                  onComplete: () => { try { msg.destroy(); } catch (_) {} } });
              });
            }
          });
        }
      }
    });

    return card;
  });
}

// ════════════════════════════════════════════════════════════════════════════
// ACTIVITY 7 — "Build the Bed!" (Home Run, stop 3)
// Story: The puppies need a comfy bed! Tap the parts in build order:
// Leg → Frame → Cushion → Blanket
// ════════════════════════════════════════════════════════════════════════════
export function buildBedPuzzle(scene, ax, ay, aw, ah, objects, onSucceed, D) {
  const PARTS = [
    { label: 'Leg',     color: 0xd4a060 },
    { label: 'Frame',   color: 0xb07830 },
    { label: 'Cushion', color: 0x88aaf0 },
    { label: 'Blanket', color: 0xff9988 },
  ];
  let nextIdx = 0;

  instr(scene, ax, ay, aw, '🛏️ Tap the parts in the right order to build the bed!\nLeg  →  Frame  →  Cushion  →  Blanket', objects, D);

  // step tracker slots
  const slotGap = 8;
  const slotW = Math.floor((aw - slotGap * (PARTS.length + 1)) / PARTS.length);
  const slotH = 32;
  const sStartX = ax + slotGap + slotW / 2;
  const sY = ay + 44;

  const stepSlots = PARTS.map((p, i) => {
    const sx = sStartX + i * (slotW + slotGap);
    const g = scene.add.graphics().setScrollFactor(0).setDepth(D);
    g.fillStyle(0xede0f5, 1);
    g.fillRoundedRect(sx - slotW / 2, sY, slotW, slotH, 6);
    g.lineStyle(1.5, PURPLE, 0.6);
    g.strokeRoundedRect(sx - slotW / 2, sY, slotW, slotH, 6);
    objects.push(g);
    const t = scene.add.text(sx, sY + slotH / 2, p.label, {
      fontSize: '10px', fontFamily: 'Georgia, serif', color: '#9a6ac8'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 1);
    objects.push(t);
    return { g, t, p, sx };
  });

  // 4 tiles in 2×2 grid — positions shuffled so order isn't obvious
  const tGap = 16;
  const tileW = Math.floor((aw - 3 * tGap) / 2);
  const tileH = 66;
  const baseY = sY + slotH + 22;
  const positions = [
    { x: ax + tGap + tileW / 2,                y: baseY + tileH / 2              },
    { x: ax + tGap * 2 + tileW + tileW / 2,    y: baseY + tileH / 2              },
    { x: ax + tGap + tileW / 2,                y: baseY + tileH + 14 + tileH / 2 },
    { x: ax + tGap * 2 + tileW + tileW / 2,    y: baseY + tileH + 14 + tileH / 2 },
  ];
  Phaser.Utils.Array.Shuffle(positions);

  PARTS.forEach((p, i) => {
    const { x: lx, y: ly } = positions[i];

    const tileG = scene.add.graphics().setScrollFactor(0).setDepth(D + 1);
    tileG.fillStyle(p.color, 0.92);
    tileG.fillRoundedRect(lx - tileW / 2, ly - tileH / 2, tileW, tileH, 10);
    tileG.fillStyle(0xffffff, 0.15);
    tileG.fillRect(lx - tileW / 2 + 6, ly - tileH / 2 + 6, tileW - 12, 10);
    tileG.lineStyle(2, 0xffffff, 0.35);
    tileG.strokeRoundedRect(lx - tileW / 2, ly - tileH / 2, tileW, tileH, 10);
    objects.push(tileG);

    const tTxt = scene.add.text(lx, ly, p.label, {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#fff',
      stroke: '#5a3010', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 2);
    objects.push(tTxt);
    scene.tweens.add({ targets: [tileG, tTxt], y: '-=5', duration: 560 + i * 80, yoyo: true, repeat: -1 });

    const z = hitRect(scene, lx, ly, tileW + 4, tileH + 4, objects, D + 3);
    z.on('pointerover', () => tileG.setAlpha(0.75));
    z.on('pointerout',  () => tileG.setAlpha(1));
    z.on('pointerdown', () => {
      if (PARTS[nextIdx].label !== p.label) {
        wrongShake(scene, tileG, objects);
        const hint = scene.add.text(lx, ly - tileH / 2 - 14, `Next: ${PARTS[nextIdx].label}`, {
          fontSize: '10px', fontFamily: 'Georgia, serif', color: '#cc3333', stroke: '#fff', strokeThickness: 2
        }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 5);
        objects.push(hint);
        scene.tweens.add({ targets: hint, y: hint.y - 12, alpha: 0, duration: 900,
          onComplete: () => { try { hint.destroy(); } catch (_) {} } });
        return;
      }
      z.removeInteractive();
      scene.tweens.killTweensOf(tileG); scene.tweens.killTweensOf(tTxt);
      const slot = stepSlots[nextIdx];
      slot.g.clear();
      slot.g.fillStyle(GREEN, 1);
      slot.g.fillRoundedRect(slot.sx - slotW / 2, sY, slotW, slotH, 6);
      slot.t.setStyle({ color: '#fff' });
      scene.tweens.add({ targets: slot.t, scaleX: { from: 1.3, to: 1 }, scaleY: { from: 1.3, to: 1 }, duration: 200, ease: 'Back.easeOut' });
      sparkle(scene, lx, ly, objects, D + 5);
      scene.tweens.add({ targets: [tileG, tTxt], alpha: 0, scale: 0.7, duration: 260 });
      nextIdx++;
      if (nextIdx >= PARTS.length) scene.time.delayedCall(320, onSucceed);
    });
  });
}

// ════════════════════════════════════════════════════════════════════════════
// ACTIVITY META — router used by L8BaseScene.runActivity(key, onDone)
// Add new activities here: emoji/title/desc drive the intro card.
// ════════════════════════════════════════════════════════════════════════════
export const ACTIVITY_META = {
  // ── Food Run stops ──────────────────────────────────────────────────────
  good_food: {
    emoji: '🛒', title: 'Choose Good Food!',
    desc:  'Pick the 3 foods that are safe for puppies.',
    fn:    buildGoodFood,  score: 120,
    w: 480, h: 320
  },
  count_pups: {
    emoji: '🐶', title: 'Count the Puppies!',
    desc:  'How many puppies are waiting to be fed?',
    fn:    buildCountPups, score: 100,
    w: 460, h: 300
  },
  spell_puppy: {
    emoji: '✏️', title: 'Spell PUPPY!',
    desc:  'Tap the letters in order: P – U – P – P – Y',
    fn:    buildSpellPuppy, score: 130,
    w: 460, h: 280
  },
  // ── Home Run stops ───────────────────────────────────────────────────────
  where_goes: {
    emoji: '🏠', title: 'Where Does It Go?',
    desc:  'Drag each item to its correct spot in the home.',
    fn:    buildWhereGoesIt, score: 140,
    w: 480, h: 340
  },
  clean_home: {
    emoji: '🧹', title: 'Clean the Home!',
    desc:  'Tap all the mud blobs before the timer runs out!',
    fn:    buildCleanHome, score: 120,
    w: 460, h: 330
  },
  build_bed: {
    emoji: '🛏️', title: 'Build the Bed!',
    desc:  'Tap the parts in order: Leg → Frame → Cushion → Blanket',
    fn:    buildBedPuzzle, score: 130,
    w: 460, h: 320
  },
  // ── Food Run stop 4 ──────────────────────────────────────────────────────
  match_food: {
    emoji: '🃏', title: 'Match the Food!',
    desc:  'Find matching food pairs. Watch out — 6 wrong picks resets your count!',
    fn:    buildMatchFood, score: 140,
    w: 500, h: 380
  },
};
