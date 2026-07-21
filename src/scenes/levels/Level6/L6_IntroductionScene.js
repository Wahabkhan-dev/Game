import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';

// ── Level 6 · Parts 3 & 4 — Puppy Introduction + Final Celebration ────────
// Part 3: Each of the 7 puppies is introduced one by one with their name.
// Part 4: All 7 puppies appear together with Gamma — "A Beautiful Family".

const PUPPY_EMOJIS = ['🐶', '🐕', '🐩', '🐕‍🦺', '🦮', '🐾', '🐶'];
const PUPPY_COLORS = [
  { main: 0xC8915A, accent: 0xE8B07A, label: 'Golden' },
  { main: 0x3A2A22, accent: 0x6A4A38, label: 'Dark' },
  { main: 0xF0E6D2, accent: 0xFFFFFF, label: 'Cream' },
  { main: 0xE0B060, accent: 0xF8D080, label: 'Caramel' },
  { main: 0xA88858, accent: 0xC8A870, label: 'Brown' },
  { main: 0x806048, accent: 0xA08060, label: 'Chestnut' },
  { main: 0xD8C8A8, accent: 0xF4E8C8, label: 'Sandy' },
];
const PUPPY_TRAITS = [
  'The boldest pup — always first to explore!',
  'The sweetest — loves cuddles and naps.',
  'The funniest — always makes everyone laugh!',
  'The strongest — never gives up on anything.',
  'The gentlest — picks up flowers on walks.',
  'The dreamiest — loves watching the moonrise.',
  'The cuddliest — favourite of all seven!',
];

export class L6_IntroductionScene extends Phaser.Scene {
  constructor() { super('L6_Introduction'); }

  create(data) {
    this._names  = (data && data.names) || ['Tahoe', 'Mammoth', 'Little Bear', 'Everest', 'Whistler', 'Aspen', 'Big Bear'];
    this._stars  = (data && data.stars) || 0;
    this._idx    = 0; // current puppy being introduced

    this.cameras.main.fadeIn(700, 0, 0, 0);
    this._buildBackground();
    this._buildStage();
    this._showIntro(); // start the intro sequence
  }

  _buildBackground() {
    // Warm garden evening sky
    const bg = this.add.graphics().setDepth(-30);
    bg.fillGradientStyle(0x1A0A44, 0x1A0A44, 0x5A2A18, 0x5A2A18, 1);
    bg.fillRect(0, 0, W, H);

    // Stars
    for (let i = 0; i < 40; i++) {
      const sx = Math.random() * W, sy = Math.random() * (H * 0.55);
      const st = this.add.graphics().setDepth(-20);
      st.fillStyle(0xFFFFFF, 0.6 + Math.random() * 0.4);
      st.fillCircle(sx, sy, 1.2 + Math.random() * 1.5);
      this.tweens.add({ targets: st, alpha: 0.1, duration: 800 + Math.random() * 1000, yoyo: true, repeat: -1, delay: Math.random() * 2000 });
    }

    // Moon
    const moon = this.add.graphics().setDepth(-18);
    moon.fillStyle(0xFFF8C0, 0.9); moon.fillCircle(W - 100, 55, 36);
    moon.fillStyle(0xFFF0A0, 0.5); moon.fillCircle(W - 100, 55, 52);
    moon.fillStyle(0x1A0A44, 1); moon.fillCircle(W - 82, 46, 30); // crescent shadow

    // Garden silhouettes
    const sil = this.add.graphics().setDepth(-15);
    sil.fillStyle(0x0A1808, 0.9);
    // Grass bumps
    for (let gx = 0; gx < W; gx += 60) {
      sil.fillEllipse(gx + 30, H - 20, 80, 36);
    }
    // Trees
    [80, 240, 560, 720].forEach(tx => {
      sil.fillRect(tx - 4, H - 100, 8, 80);
      sil.fillCircle(tx, H - 108, 28);
      sil.fillCircle(tx - 14, H - 96, 20);
      sil.fillCircle(tx + 14, H - 98, 18);
    });

    // Fairy lights string
    const lights = this.add.graphics().setDepth(-8);
    lights.lineStyle(1, 0xD2A000, 0.6);
    lights.lineBetween(0, 100, W, 100);
    for (let lx = 40; lx < W; lx += 50) {
      const col = [0xFFD700, 0xFF6B9D, 0x4FC3F7, 0xC084FC, 0xFF9F45][Math.floor(lx / 50) % 5];
      lights.fillStyle(col, 0.9); lights.fillCircle(lx, 100, 4);
      const gl = this.add.graphics().setDepth(-7);
      gl.fillStyle(col, 0.25); gl.fillCircle(lx, 100, 9);
      this.tweens.add({ targets: gl, alpha: 0.6, duration: 400 + Math.random() * 600, yoyo: true, repeat: -1, delay: Math.random() * 800 });
    }

    // Ground / stage
    const ground = this.add.graphics().setDepth(-5);
    ground.fillStyle(0x2A1808, 1); ground.fillRect(0, H - 70, W, 70);
    ground.lineStyle(2, 0xFFD700, 0.4); ground.lineBetween(0, H - 70, W, H - 70);
    // Flowers on stage edge
    const fcs = [0xFF6B9D, 0xFFD700, 0xC084FC, 0xFF9F45];
    for (let fx = 60; fx < W; fx += 80) {
      ground.fillStyle(fcs[Math.floor(fx / 80) % fcs.length], 0.8);
      ground.fillCircle(fx, H - 70, 5);
      ground.fillStyle(0x4CAF50, 0.8);
      ground.fillRect(fx - 1, H - 68, 2, 10);
    }
  }

  _buildStage() {
    // Spotlight backdrops on either side
    const sl = this.add.graphics().setDepth(-4);
    sl.fillStyle(0xFFFFCC, 0.06);
    sl.fillTriangle(150, 0, 230, 0, 400, H - 70);
    sl.fillTriangle(W - 150, 0, W - 230, 0, W - 400, H - 70);

    // Decorative frame around the puppy spotlight area
    const frame = this.add.graphics().setDepth(2);
    frame.lineStyle(3, 0xFFD700, 0.7);
    frame.strokeRoundedRect(W / 2 - 180, 110, 360, 240, 20);
    frame.lineStyle(1, 0xFFD700, 0.3);
    frame.strokeRoundedRect(W / 2 - 172, 118, 344, 224, 16);
    // Corner stars
    [[W/2 - 180, 110], [W/2 + 180, 110], [W/2 - 180, 350], [W/2 + 180, 350]].forEach(([fx, fy]) => {
      this.add.text(fx, fy, '⭐', { fontSize: '14px' }).setOrigin(0.5).setDepth(3);
    });
  }

  // ── INTRO SEQUENCE: introduce each puppy one by one ──────────────────────
  _showIntro() {
    if (this._idx >= this._names.length) {
      this.time.delayedCall(600, () => this._startCelebration());
      return;
    }

    const name  = this._names[this._idx];
    const pc    = PUPPY_COLORS[this._idx % PUPPY_COLORS.length];
    const trait = PUPPY_TRAITS[this._idx % PUPPY_TRAITS.length];
    const emoji = PUPPY_EMOJIS[this._idx % PUPPY_EMOJIS.length];

    this.children.removeAll(false); // clear previous slide objects
    this._buildBackground();       // redraw bg each slide
    this._buildStage();

    // Slide counter
    this.add.text(W / 2, 16, `Puppy ${this._idx + 1} of ${this._names.length}`,
      { fontSize: '11px', fontFamily: 'Georgia, serif', color: '#F5D5A0' }).setOrigin(0.5).setDepth(30);

    // Name banner at top
    const nameBg = this.add.graphics().setDepth(20);
    nameBg.fillStyle(0x1A0A04, 0.9); nameBg.fillRoundedRect(W / 2 - 160, 28, 320, 52, 12);
    nameBg.lineStyle(3, 0xFFD700, 1); nameBg.strokeRoundedRect(W / 2 - 160, 28, 320, 52, 12);
    this.add.text(W / 2, 46, `Hi, I'm ${name}!`,
      { fontSize: '22px', fontFamily: 'Georgia, serif', color: '#FFD700', fontStyle: 'bold' })
      .setOrigin(0.5).setDepth(21).setAlpha(0).setData('a', 1);
    this.add.text(W / 2, 68, pc.label + ' Puppy',
      { fontSize: '12px', fontFamily: 'Georgia, serif', color: '#F5D5A0', fontStyle: 'italic' })
      .setOrigin(0.5).setDepth(21).setAlpha(0).setData('a', 1);

    // Puppy large emoji in spotlight
    const pe = this.add.text(W / 2, 232, emoji, { fontSize: '88px' })
      .setOrigin(0.5).setDepth(10).setScale(0.2).setAlpha(0).setData('a', 1);

    // Colour bubble below puppy
    const colBub = this.add.graphics().setDepth(9);
    colBub.fillStyle(pc.main, 0.8);
    colBub.fillEllipse(W / 2, 308, 160, 38);
    colBub.fillStyle(pc.accent, 0.5);
    colBub.fillEllipse(W / 2, 302, 90, 20);

    // Trait text
    this.add.text(W / 2, 346, `"${trait}"`,
      { fontSize: '12px', fontFamily: 'Georgia, serif', color: '#FFE0B2', fontStyle: 'italic', align: 'center', wordWrap: { width: 340 } })
      .setOrigin(0.5).setDepth(20).setAlpha(0).setData('a', 1);

    // Hearts floating up
    for (let h = 0; h < 5; h++) {
      const hx = W / 2 + Phaser.Math.Between(-120, 120);
      const ht = this.add.text(hx, 240, '💛', { fontSize: `${12 + h * 3}px` }).setDepth(15).setAlpha(0).setData('a', 1);
      this.tweens.add({ targets: ht, y: 170 - h * 20, alpha: 1, duration: 800, delay: 500 + h * 200,
        onComplete: () => this.tweens.add({ targets: ht, alpha: 0, y: ht.y - 30, duration: 600 }) });
    }

    // Sparkle ring around puppy
    this.time.delayedCall(300, () => this._sparkle(W / 2, 232));

    // Animate in
    this.children.list.filter(c => c.getData && c.getData('a')).forEach(c => {
      this.tweens.add({ targets: c, alpha: 1, scaleX: 1, scaleY: 1, duration: 500, ease: 'Back.easeOut', delay: 200 });
    });

    // Progress dots at bottom
    const dotY = H - 95;
    this._names.forEach((_, di) => {
      const dg = this.add.graphics().setDepth(25);
      dg.fillStyle(di <= this._idx ? 0xFFD700 : 0x554422, 1);
      dg.fillCircle(W / 2 - (this._names.length - 1) * 12 + di * 24, dotY, di === this._idx ? 8 : 5);
    });

    // Next button
    const nextBtn = this.add.text(W / 2, H - 44, this._idx < this._names.length - 1 ? 'Next Puppy →' : 'Meet Them All! →',
      { fontSize: '15px', fontFamily: 'Georgia, serif', color: '#fff', backgroundColor: '#5A2A08', padding: { x: 20, y: 10 } })
      .setOrigin(0.5).setDepth(30).setInteractive({ useHandCursor: true });
    nextBtn.on('pointerover', () => nextBtn.setColor('#FFD700'));
    nextBtn.on('pointerout',  () => nextBtn.setColor('#fff'));
    nextBtn.on('pointerdown', () => {
      this.cameras.main.flash(200, 255, 200, 50);
      this._idx++;
      this.time.delayedCall(250, () => this._showIntro());
    });
  }

  // ── PART 4: FINAL CELEBRATION — all 7 puppies + Gamma ───────────────────
  _startCelebration() {
    this.children.removeAll(false);
    this._buildBackground();
    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.cameras.main.zoomTo(1.1, 2000, 'Sine.easeInOut');

    // Title
    const titleBg = this.add.graphics().setDepth(25);
    titleBg.fillStyle(0x1A0A04, 0.92); titleBg.fillRoundedRect(W / 2 - 250, 8, 500, 56, 12);
    titleBg.lineStyle(3, 0xFFD700, 1); titleBg.strokeRoundedRect(W / 2 - 250, 8, 500, 56, 12);
    const titleTxt = this.add.text(W / 2, 28, '🐾 A Beautiful Family 🐾',
      { fontSize: '24px', fontFamily: 'Georgia, serif', color: '#FFD700', fontStyle: 'bold' })
      .setOrigin(0.5).setDepth(26).setAlpha(0);
    const subTxt = this.add.text(W / 2, 54, 'All seven puppies are home with Gamma',
      { fontSize: '12px', fontFamily: 'Georgia, serif', color: '#F5D5A0' })
      .setOrigin(0.5).setDepth(26).setAlpha(0);
    this.tweens.add({ targets: [titleTxt, subTxt], alpha: 1, duration: 800, delay: 400 });

    // Ground / stage
    const ground = this.add.graphics().setDepth(-5);
    ground.fillStyle(0x2A1808, 1); ground.fillRect(0, H - 80, W, 80);
    ground.lineStyle(2, 0xFFD700, 0.4); ground.lineBetween(0, H - 80, W, H - 80);

    // Gamma (mum) in the centre
    const gammaY = H - 82;
    this.add.ellipse(W / 2, gammaY + 14, 200, 28, 0x000000, 0.22).setDepth(3);
    if (this.textures.exists('gemma_happy')) {
      this.add.image(W / 2, gammaY, 'gemma_happy').setOrigin(0.5, 1).setDisplaySize(160, 90).setDepth(5);
    } else {
      this.add.text(W / 2, gammaY, '🐕', { fontSize: '72px' }).setOrigin(0.5, 1).setDepth(5);
    }
    // Gleeda
    if (this.textures.exists('gleeda_idle')) {
      this.add.image(W / 2 - 165, gammaY, 'gleeda_idle').setOrigin(0.5, 1).setDisplaySize(80, 96).setDepth(5);
    }

    // Name labels ring around Gamma position
    const nameAngles = [200, 230, 265, 295, 335, 160, 125];
    const radii      = [160, 130, 110, 130, 150, 155, 140];

    this._names.forEach((name, i) => {
      const ang  = (nameAngles[i] * Math.PI) / 180;
      const r    = radii[i];
      const px2  = W / 2 + Math.cos(ang) * r;
      const py2  = gammaY + Math.sin(ang) * r;
      const pc   = PUPPY_COLORS[i];
      const emoji = PUPPY_EMOJIS[i];

      const pup = this.add.text(px2, py2, emoji, { fontSize: '32px' })
        .setOrigin(0.5, 1).setDepth(6).setScale(0.2).setAlpha(0);
      const nameLbl = this.add.text(px2, py2 - 38, name,
        { fontSize: '10px', fontFamily: 'Arial Black', color: '#FFD700', stroke: '#3A1800', strokeThickness: 2 })
        .setOrigin(0.5).setDepth(7).setAlpha(0);

      this.time.delayedCall(600 + i * 320, () => {
        this.tweens.add({ targets: pup, scaleX: 1, scaleY: 1, alpha: 1, duration: 420, ease: 'Back.easeOut' });
        this.tweens.add({ targets: nameLbl, alpha: 1, y: nameLbl.y - 6, duration: 400, delay: 200 });
        this._sparkle(px2, py2);
        this.cameras.main.flash(100, 255, 230, 150);

        // Small bounce idle
        this.tweens.add({ targets: pup, y: `-=8`, duration: 500, yoyo: true, repeat: -1, delay: 600 + i * 100, ease: 'Sine.easeInOut' });

        // Heart pop above each puppy
        const ht = this.add.text(px2, py2 - 50, '💛', { fontSize: '14px' }).setOrigin(0.5).setDepth(8).setAlpha(0);
        this.time.delayedCall(320, () =>
          this.tweens.add({ targets: ht, y: ht.y - 28, alpha: 1, duration: 500, yoyo: true, onComplete: () => ht.destroy() }));
      });
    });

    // Rainbow above after all appear
    this.time.delayedCall(3200, () => {
      const rb = this.add.graphics().setDepth(-6).setAlpha(0);
      [0xFF4444, 0xFF9900, 0xFFFF00, 0x44CC44, 0x4499FF, 0x9944FF].forEach((c, i) => {
        rb.lineStyle(10 - i * 1.2, c, 0.5);
        rb.beginPath(); rb.arc(W / 2, H - 80, 260 - i * 22, Math.PI, 0); rb.strokePath();
      });
      this.tweens.add({ targets: rb, alpha: 1, duration: 1200 });
    });

    // Falling petals / confetti
    this.time.addEvent({ delay: 220, repeat: 30, callback: () => {
      const x = 50 + Math.random() * (W - 100);
      const e = Phaser.Math.RND.pick(['💛', '🌸', '✨', '🌼', '💜']);
      const t = this.add.text(x, 90, e, { fontSize: `${11 + Math.random() * 9}px` }).setDepth(12).setAlpha(0.9);
      this.tweens.add({ targets: t, y: t.y + 200, alpha: 0, duration: 2500, onComplete: () => t.destroy() });
    }});

    // "A Beautiful Family" caption
    this.time.delayedCall(2800, () => {
      const cap = this.add.text(W / 2, 82, '"Seven puppies. One loving family. 💛"',
        { fontSize: '14px', fontFamily: 'Georgia, serif', color: '#FFE0B2', fontStyle: 'italic' })
        .setOrigin(0.5).setDepth(28).setAlpha(0);
      this.tweens.add({ targets: cap, alpha: 1, y: cap.y - 6, duration: 900 });
    });

    // Final "Continue" button (leads to nursery setup)
    this.time.delayedCall(4000, () => {
      const btn = this.add.text(W / 2, H - 22, '🏡 Setup Their Home →',
        { fontSize: '15px', fontFamily: 'Georgia, serif', color: '#fff', backgroundColor: '#4A5A18', padding: { x: 18, y: 9 } })
        .setOrigin(0.5).setDepth(30).setScale(0).setInteractive({ useHandCursor: true });
      this.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 450, ease: 'Back.easeOut' });
      btn.on('pointerover', () => btn.setColor('#FFD700'));
      btn.on('pointerout',  () => btn.setColor('#fff'));
      btn.on('pointerdown', () => {
        this.cameras.main.fadeOut(600, 0, 0, 0);
        this.time.delayedCall(650, () =>
          this.scene.start('EndScene'));
      });
    });
  }

  _sparkle(x, y) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2, d = 18 + Math.random() * 18;
      const s = this.add.text(x + Math.cos(a) * d, y + Math.sin(a) * d, '✨', { fontSize: '12px' }).setDepth(30);
      this.tweens.add({ targets: s, alpha: 0, scaleX: 0.2, scaleY: 0.2, duration: 560, delay: i * 40, onComplete: () => s.destroy() });
    }
  }
}
