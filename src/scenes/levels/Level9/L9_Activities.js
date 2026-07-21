import Phaser from 'phaser';

// ════════════════════════════════════════════════════════════════════════════
// L9_Activities.js — 3 holiday mini-activities for Level 9 (woven into the runs).
//
// Builder signature (same as L8_Activities):
//   buildXxx(scene, ax, ay, aw, ah, objects, onSucceed, D)
// Usage:  scene.runActivity('match_ornaments', onDone)  — see L9BaseScene.runActivity()
// ════════════════════════════════════════════════════════════════════════════

const GREEN = 0x2f7a4a;
const RED   = 0xd23a4e;
const GOLD  = 0xffd24a;

function instr(scene, ax, ay, aw, text, objects, D) {
  const t = scene.add.text(ax + aw / 2, ay + 6, text, {
    fontSize: '12px', fontFamily: 'Georgia, serif', color: '#ffe8c0', stroke: '#2a1608', strokeThickness: 2, align: 'center', wordWrap: { width: aw - 20 }
  }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(D);
  objects.push(t); return t;
}
function hitRect(scene, cx, cy, w, h, objects, D) {
  const z = scene.add.rectangle(cx, cy, w, h, 0xffffff, 0).setScrollFactor(0).setDepth(D).setInteractive({ useHandCursor: true });
  objects.push(z); return z;
}
function sparkle(scene, x, y, objects, D) {
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2, d = 20 + Math.random() * 26;
    const s = scene.add.image(x, y, 'l9_spark').setScale(0.7).setScrollFactor(0).setDepth(D).setTint([0xffd24a, 0xd23a4e, 0x2f7a4a, 0xffffff][i % 4]);
    objects.push(s);
    scene.tweens.add({ targets: s, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, scale: 1.4, duration: 540, onComplete: () => { try { s.destroy(); } catch (_) {} } });
  }
}
function wrongShake(scene, target, objects) {
  const ox = target.x;
  scene.tweens.add({ targets: target, x: ox + 9, duration: 55, yoyo: true, repeat: 4, ease: 'Sine.easeInOut', onComplete: () => { try { target.x = ox; } catch (_) {} } });
  if (target.setTint) { target.setTint(0xff5555); scene.time.delayedCall(380, () => { try { target.clearTint(); } catch (_) {} }); }
}

// ════════════════════════════════════════════════════════════════════════════
// ACTIVITY 1 — "Match the Ornaments" — memory pair-match (4 pairs)
// ════════════════════════════════════════════════════════════════════════════
export function buildMatchOrnaments(scene, ax, ay, aw, ah, objects, onSucceed, D) {
  const KEYS = ['l9_gift_red', 'l9_gift_green', 'l9_gift_gold', 'l9_ornament'];
  let matched = 0, flipped = [], checking = false;
  instr(scene, ax, ay, aw, '🎄 Tap two cards to find matching holiday pairs!', objects, D);

  const deck = [...KEYS, ...KEYS]; Phaser.Utils.Array.Shuffle(deck);
  const COLS = 4, ROWS = 2, gap = 8;
  const cW = Math.floor((aw - gap * (COLS + 1)) / COLS);
  const cH = Math.floor((ah - 40 - gap * (ROWS + 1)) / ROWS);
  const startX = ax + gap + cW / 2, startY = ay + 40 + gap + cH / 2;

  deck.forEach((tex, i) => {
    const col = i % COLS, row = Math.floor(i / COLS);
    const cx = startX + col * (cW + gap), cy = startY + row * (cH + gap);
    const back = scene.add.graphics().setScrollFactor(0).setDepth(D + 1);
    back.fillStyle(GREEN, 1); back.fillRoundedRect(cx - cW / 2, cy - cH / 2, cW, cH, 8);
    back.lineStyle(2, GOLD, 0.8); back.strokeRoundedRect(cx - cW / 2, cy - cH / 2, cW, cH, 8);
    objects.push(back);
    const q = scene.add.text(cx, cy, '❄', { fontSize: '20px', color: '#eaf2ff' }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 2);
    objects.push(q); scene.tweens.add({ targets: q, angle: 360, duration: 4000, repeat: -1 });
    const front = scene.add.image(cx, cy, tex).setDisplaySize(cW - 14, cH - 12).setScrollFactor(0).setDepth(D + 2).setAlpha(0);
    const fScX = front.scaleX, fScY = front.scaleY;
    objects.push(front);
    const card = { tex, cx, cy, cW, cH, back, q, front, fScX, fScY, faceUp: false, matched: false, hit: null };
    const z = hitRect(scene, cx, cy, cW + 4, cH + 4, objects, D + 3); card.hit = z;
    z.on('pointerdown', () => {
      if (checking || card.faceUp || card.matched) return;
      card.faceUp = true; back.setAlpha(0); q.setAlpha(0); scene.tweens.killTweensOf(q);
      front.setAlpha(1).setScale(fScX, fScY); flipped.push(card);
      if (flipped.length === 2) {
        checking = true; const [a, b] = flipped;
        if (a.tex === b.tex) {
          matched++;
          [a, b].forEach(c => { c.matched = true; c.hit?.removeInteractive();
            const ov = scene.add.graphics().setScrollFactor(0).setDepth(D + 2);
            ov.fillStyle(0x5fd86a, 0.32); ov.fillRoundedRect(c.cx - c.cW / 2, c.cy - c.cH / 2, c.cW, c.cH, 8);
            ov.lineStyle(2, 0x5fd86a, 1); ov.strokeRoundedRect(c.cx - c.cW / 2, c.cy - c.cH / 2, c.cW, c.cH, 8);
            objects.push(ov); sparkle(scene, c.cx, c.cy, objects, D + 5); });
          flipped = []; checking = false;
          if (matched >= KEYS.length) scene.time.delayedCall(400, onSucceed);
        } else {
          scene.cameras.main.shake(80, 0.006);
          scene.time.delayedCall(820, () => {
            [a, b].forEach(c => { c.faceUp = false; c.front.setAlpha(0); c.back.setAlpha(1); c.q.setAlpha(1);
              scene.tweens.killTweensOf(c.q); scene.tweens.add({ targets: c.q, angle: 360, duration: 4000, repeat: -1 }); });
            flipped = []; checking = false;
          });
        }
      }
    });
  });
}

// ════════════════════════════════════════════════════════════════════════════
// ACTIVITY 2 — "Catch the Snowflakes" — move the basket to catch flakes,
// avoid the lumps of coal.
// ════════════════════════════════════════════════════════════════════════════
export function buildCatchSnow(scene, ax, ay, aw, ah, objects, onSucceed, D) {
  const NEED = 8; let caught = 0, done = false;
  instr(scene, ax, ay, aw, '❄️ Move the basket to catch snowflakes. Dodge the coal!', objects, D);

  const arena = scene.add.graphics().setScrollFactor(0).setDepth(D);
  arena.fillStyle(0x2a3a5e, 1); arena.fillRoundedRect(ax + 4, ay + 26, aw - 8, ah - 54, 10);
  arena.lineStyle(1.5, 0x8fb0e0, 0.5); arena.strokeRoundedRect(ax + 4, ay + 26, aw - 8, ah - 54, 10);
  objects.push(arena);

  const floorY = ay + ah - 34;
  const count = scene.add.text(ax + aw - 12, ay + 6, `0 / ${NEED}`, { fontSize: '12px', fontFamily: 'Georgia, serif', color: '#eaf2ff' }).setOrigin(1, 0).setScrollFactor(0).setDepth(D + 2);
  objects.push(count);

  const basket = scene.add.graphics().setScrollFactor(0).setDepth(D + 3);
  let bx = ax + aw / 2; const bw = 60;
  const drawBasket = () => { basket.clear(); basket.fillStyle(0xb07a44, 1); basket.fillEllipse(bx, floorY, bw, 22); basket.fillStyle(0x8a5a32, 1); basket.fillEllipse(bx, floorY - 5, bw - 10, 8); basket.lineStyle(2, 0x6a4326, 1); basket.strokeEllipse(bx, floorY, bw, 22); };
  drawBasket(); objects.push(basket);

  const minX = ax + 20 + bw / 2, maxX = ax + aw - 20 - bw / 2;
  const moveZone = hitRect(scene, ax + aw / 2, ay + ah / 2, aw, ah, objects, D + 1);
  moveZone.on('pointermove', (p) => { bx = Phaser.Math.Clamp(p.x, minX, maxX); drawBasket(); });

  const spawn = () => {
    if (done) return;
    const coal = Math.random() < 0.3;
    const dx = Phaser.Math.Between(ax + 24, ax + aw - 24);
    const d = coal
      ? scene.add.circle(dx, ay + 34, 9, 0x2a2a2a).setScrollFactor(0).setDepth(D + 3)
      : scene.add.image(dx, ay + 34, 'l9_snow').setScale(1.6).setScrollFactor(0).setDepth(D + 3);
    objects.push(d);
    const speed = Phaser.Math.Between(1500, 2300);
    const tw = scene.tweens.add({
      targets: d, y: floorY, duration: speed, ease: 'Quad.easeIn',
      onUpdate: () => {
        if (done || !d.active) return;
        if (d.y >= floorY - 14 && Math.abs(d.x - bx) < bw / 2 + 6) {
          tw.stop();
          if (coal) {
            scene.cameras.main.shake(120, 0.008); caught = Math.max(0, caught - 1); count.setText(`${caught} / ${NEED}`);
            const s = scene.add.text(d.x, d.y, '✖', { fontSize: '16px', color: '#ff6060' }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 4);
            objects.push(s); scene.tweens.add({ targets: s, y: s.y - 16, alpha: 0, duration: 500, onComplete: () => { try { s.destroy(); } catch (_) {} } });
          } else {
            sparkle(scene, d.x, floorY - 10, objects, D + 5); caught++; count.setText(`${caught} / ${NEED}`);
            if (caught >= NEED && !done) { done = true; scene.time.delayedCall(300, onSucceed); }
          }
          try { d.destroy(); } catch (_) {}
        }
      },
      onComplete: () => { try { d.destroy(); } catch (_) {} }
    });
  };
  const ev = scene.time.addEvent({ delay: 720, loop: true, callback: () => { if (!done) spawn(); } });
  objects.push({ destroy: () => ev.remove() });
  spawn();
}

// ════════════════════════════════════════════════════════════════════════════
// ACTIVITY 3 — "Wrap the Gift" — tap the steps in the right order:
// Box → Paper → Ribbon → Bow
// ════════════════════════════════════════════════════════════════════════════
export function buildWrapGift(scene, ax, ay, aw, ah, objects, onSucceed, D) {
  const STEPS = [
    { label: 'Box',    color: 0xb07a44 },
    { label: 'Paper',  color: 0xd23a4e },
    { label: 'Ribbon', color: 0xffd24a },
    { label: 'Bow',    color: 0x2f7a4a },
  ];
  let nextIdx = 0;
  instr(scene, ax, ay, aw, '🎁 Tap the steps in order to wrap the gift!\nBox → Paper → Ribbon → Bow', objects, D);

  const slotGap = 8;
  const slotW = Math.floor((aw - slotGap * (STEPS.length + 1)) / STEPS.length);
  const slotH = 30, sStartX = ax + slotGap + slotW / 2, sY = ay + 44;
  const stepSlots = STEPS.map((p, i) => {
    const sx = sStartX + i * (slotW + slotGap);
    const g = scene.add.graphics().setScrollFactor(0).setDepth(D);
    g.fillStyle(0xf0e2d0, 1); g.fillRoundedRect(sx - slotW / 2, sY, slotW, slotH, 6);
    g.lineStyle(1.5, GREEN, 0.6); g.strokeRoundedRect(sx - slotW / 2, sY, slotW, slotH, 6);
    objects.push(g);
    const t = scene.add.text(sx, sY + slotH / 2, `${i + 1}`, { fontSize: '11px', fontFamily: 'Georgia, serif', color: '#a08868' }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 1);
    objects.push(t);
    return { g, t, p, sx };
  });

  const tGap = 16;
  const tileW = Math.floor((aw - 3 * tGap) / 2), tileH = 60;
  const baseY = sY + slotH + 20;
  const positions = [
    { x: ax + tGap + tileW / 2, y: baseY + tileH / 2 },
    { x: ax + tGap * 2 + tileW + tileW / 2, y: baseY + tileH / 2 },
    { x: ax + tGap + tileW / 2, y: baseY + tileH + 12 + tileH / 2 },
    { x: ax + tGap * 2 + tileW + tileW / 2, y: baseY + tileH + 12 + tileH / 2 },
  ];
  Phaser.Utils.Array.Shuffle(positions);

  STEPS.forEach((p, i) => {
    const { x: lx, y: ly } = positions[i];
    const tileG = scene.add.graphics().setScrollFactor(0).setDepth(D + 1);
    tileG.fillStyle(p.color, 0.95); tileG.fillRoundedRect(lx - tileW / 2, ly - tileH / 2, tileW, tileH, 10);
    tileG.fillStyle(0xffffff, 0.16); tileG.fillRect(lx - tileW / 2 + 6, ly - tileH / 2 + 6, tileW - 12, 9);
    tileG.lineStyle(2, 0xffffff, 0.4); tileG.strokeRoundedRect(lx - tileW / 2, ly - tileH / 2, tileW, tileH, 10);
    objects.push(tileG);
    const tTxt = scene.add.text(lx, ly, p.label, { fontSize: '16px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#5a3010', strokeThickness: 3 }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 2);
    objects.push(tTxt);
    scene.tweens.add({ targets: [tileG, tTxt], y: '-=5', duration: 560 + i * 80, yoyo: true, repeat: -1 });
    const z = hitRect(scene, lx, ly, tileW + 4, tileH + 4, objects, D + 3);
    z.on('pointerdown', () => {
      if (STEPS[nextIdx].label !== p.label) {
        wrongShake(scene, tileG, objects);
        const hint = scene.add.text(lx, ly - tileH / 2 - 12, `Next: ${STEPS[nextIdx].label}`, { fontSize: '10px', fontFamily: 'Georgia, serif', color: '#cc3333', stroke: '#fff', strokeThickness: 2 }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 5);
        objects.push(hint); scene.tweens.add({ targets: hint, y: hint.y - 12, alpha: 0, duration: 900, onComplete: () => { try { hint.destroy(); } catch (_) {} } });
        return;
      }
      z.removeInteractive(); scene.tweens.killTweensOf(tileG); scene.tweens.killTweensOf(tTxt);
      const slot = stepSlots[nextIdx];
      slot.g.clear(); slot.g.fillStyle(0x5fd86a, 1); slot.g.fillRoundedRect(slot.sx - slotW / 2, sY, slotW, slotH, 6);
      slot.t.setText(p.label).setStyle({ color: '#fff', fontSize: '11px' });
      scene.tweens.add({ targets: slot.t, scaleX: { from: 1.3, to: 1 }, scaleY: { from: 1.3, to: 1 }, duration: 200, ease: 'Back.easeOut' });
      sparkle(scene, lx, ly, objects, D + 5);
      scene.tweens.add({ targets: [tileG, tTxt], alpha: 0, scale: 0.7, duration: 260 });
      nextIdx++;
      if (nextIdx >= STEPS.length) scene.time.delayedCall(320, onSucceed);
    });
  });
}

// ════════════════════════════════════════════════════════════════════════════
// ACTIVITY META — router used by L9BaseScene.runActivity(key, onDone)
// ════════════════════════════════════════════════════════════════════════════
export const ACTIVITY_META = {
  match_ornaments: { emoji: '🎄', title: 'Match the Ornaments', desc: 'Find all four matching holiday pairs.',            fn: buildMatchOrnaments, score: 120, w: 500, h: 320 },
  catch_snow:      { emoji: '❄️', title: 'Catch the Snowflakes', desc: 'Catch 8 snowflakes, dodge the coal!',             fn: buildCatchSnow,      score: 120, w: 480, h: 330 },
  wrap_gift:       { emoji: '🎁', title: 'Wrap the Gift',        desc: 'Tap the steps in order: Box → Paper → Ribbon → Bow', fn: buildWrapGift,     score: 130, w: 480, h: 320 },
};
