import Phaser from 'phaser';

// ─────────────────────────────────────────────────────────────────────────────
// Polished animated "TRUST" meter for Level-2 bonding mini-games.
//   createTrustMeter(scene, x, y, { w, startPct, depth })
//   → { setPct(target, { animate }), heart, label }
// ─────────────────────────────────────────────────────────────────────────────
export function createTrustMeter(scene, x, y, opts = {}) {
  const BW = opts.w || 330;
  const BH = 20;
  const D  = opts.depth || 24;
  let pct  = Phaser.Math.Clamp(opts.startPct ?? 0, 0, 100);

  const left   = x - BW / 2;
  const innerL = left + 6;
  const innerW = BW - 12;

  const colorFor = (p) => (p < 50 ? 0xff5599 : p < 85 ? 0xff66cc : 0xffaa44);

  // ── Glow (behind, grows with fill) ──
  const glow = scene.add.graphics().setScrollFactor(0).setDepth(D - 1);

  // ── Outer frame + groove + ticks ──
  const frame = scene.add.graphics().setScrollFactor(0).setDepth(D);
  frame.fillStyle(0x1a0a12, 0.95);
  frame.fillRoundedRect(left, y - BH / 2, BW, BH, 10);
  frame.lineStyle(2.5, 0xff77bb, 0.9);
  frame.strokeRoundedRect(left, y - BH / 2, BW, BH, 10);
  frame.fillStyle(0x000000, 0.45);
  frame.fillRoundedRect(innerL, y - BH / 2 + 4, innerW, BH - 8, 6);
  frame.lineStyle(1.5, 0xffffff, 0.16);
  [0.25, 0.5, 0.75].forEach(f => {
    const tx = innerL + innerW * f;
    frame.lineBetween(tx, y - BH / 2 + 5, tx, y + BH / 2 - 5);
  });

  // ── Fill (redrawn on change) ──
  const fillG = scene.add.graphics().setScrollFactor(0).setDepth(D + 1);

  // ── Heart cap on the left end ──
  const heart = scene.textures.exists('heart')
    ? scene.add.image(left + 2, y, 'heart').setDisplaySize(30, 30).setScrollFactor(0).setDepth(D + 3)
    : scene.add.text(left + 2, y, '❤️', { fontSize: '22px' }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 3);
  const heartBaseSX = heart.scaleX, heartBaseSY = heart.scaleY;

  // ── Percentage label ──
  const label = scene.add.text(x, y, '', {
    fontSize: '13px', fontFamily: 'Georgia, serif', color: '#ffffff',
    stroke: '#3a0820', strokeThickness: 3
  }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 2);

  const setLabel = (p) => label.setText(`TRUST  ${Math.round(p)}%${p >= 99.5 ? '  ✓' : ''}`);

  const draw = (p) => {
    fillG.clear();
    const fw = innerW * p / 100;
    if (fw > 2) {
      const c = colorFor(p);
      fillG.fillStyle(c, 1);
      fillG.fillRoundedRect(innerL, y - BH / 2 + 4, fw, BH - 8, 6);
      fillG.fillStyle(0xffffff, 0.30);                                  // top shine
      fillG.fillRoundedRect(innerL + 1, y - BH / 2 + 5, Math.max(0, fw - 2), (BH - 8) / 2.4, 5);
      fillG.fillStyle(0xffffff, 0.65);                                  // leading edge
      fillG.fillRect(innerL + fw - 2, y - BH / 2 + 5, 2, BH - 10);
    }
    glow.clear();
    glow.fillStyle(colorFor(p), 0.10 + 0.24 * (p / 100));
    glow.fillRoundedRect(left - 8, y - BH / 2 - 8, BW * (0.4 + 0.6 * p / 100), BH + 16, 14);
  };

  draw(pct);
  setLabel(pct);

  const setPct = (target, o = {}) => {
    target = Phaser.Math.Clamp(target, 0, 100);
    const from = pct;
    pct = target;
    if (o.animate === false) { draw(target); setLabel(target); }
    else {
      const obj = { v: from };
      scene.tweens.add({
        targets: obj, v: target, duration: 360, ease: 'Cubic.easeOut',
        onUpdate: () => { draw(obj.v); setLabel(obj.v); },
        onComplete: () => { draw(target); setLabel(target); }
      });
    }
    // heartbeat on every change
    scene.tweens.killTweensOf(heart);
    heart.setScale(heartBaseSX, heartBaseSY);
    scene.tweens.add({
      targets: heart, scaleX: heartBaseSX * 1.35, scaleY: heartBaseSY * 1.35,
      duration: 150, yoyo: true, ease: 'Quad.easeOut'
    });
  };

  return { setPct, heart, label };
}

// ─────────────────────────────────────────────────────────────────────────────
// Warm "bonding" atmosphere: soft aura behind the characters + floating hearts.
//   addBondAtmosphere(scene, { auraX, auraY })  → returns the timer (to stop)
// ─────────────────────────────────────────────────────────────────────────────
export function addBondAtmosphere(scene, opts = {}) {
  const ax = opts.auraX ?? 400;
  const ay = opts.auraY ?? 360;

  // Soft warm aura behind characters
  const aura = scene.add.graphics().setDepth(7);
  aura.fillStyle(0xff88bb, 0.06); aura.fillEllipse(ax, ay, 540, 250);
  aura.fillStyle(0xffcc66, 0.05); aura.fillEllipse(ax, ay, 380, 190);
  aura.fillStyle(0xff66aa, 0.05); aura.fillEllipse(ax, ay, 220, 130);
  scene.tweens.add({ targets: aura, alpha: { from: 0.65, to: 1 }, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

  // Gentle floating hearts drifting upward
  const useImg = scene.textures.exists('heart');
  const timer = scene.time.addEvent({
    delay: 850, loop: true, callback: () => {
      const hx = 110 + Math.random() * 580;
      const h = useImg
        ? scene.add.image(hx, 432, 'heart').setDisplaySize(14, 14).setAlpha(0.45).setDepth(6).setTint(0xff99cc)
        : scene.add.text(hx, 432, '💗', { fontSize: '13px' }).setAlpha(0.45).setDepth(6);
      scene.tweens.add({
        targets: h, y: 190 + Math.random() * 130, x: hx + (Math.random() - 0.5) * 70,
        alpha: 0, scaleX: { from: h.scaleX, to: h.scaleX * 1.4 }, scaleY: { from: h.scaleY, to: h.scaleY * 1.4 },
        duration: 3000 + Math.random() * 1600, ease: 'Sine.easeOut',
        onComplete: () => { try { h.destroy(); } catch (_) {} }
      });
    }
  });
  return timer;
}
