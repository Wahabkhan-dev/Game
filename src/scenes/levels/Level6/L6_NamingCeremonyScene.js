import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';

// ── Level 6 · Part 2 — Naming Ceremony (Tap-to-Recall) ───────────────────
// All 12 names are VISIBLE from the first frame. The player taps the 7 names
// they collected during the Garden Runner. Correct → locks green w/ a check;
// wrong → flashes red briefly then reverts (no penalty, unlimited tries).
// This is a recall game, NOT a face-down memory-flip game.

const CORRECT_NAMES = ['Tahoe', 'Mammoth', 'Little Bear', 'Everest', 'Whistler', 'Aspen', 'Big Bear'];
const DECOY_NAMES   = ['Vail', 'Telluride', 'Heavenly', 'Sugarloaf', 'Snowbird'];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Grid geometry (canvas 800×450)
const COLS = 4, ROWS = 3;
const TILE_W = 150, TILE_H = 44, GAP_X = 14, GAP_Y = 16;
const GRID_W = COLS * TILE_W + (COLS - 1) * GAP_X;
const GRID_X = (W - GRID_W) / 2;
const GRID_Y = 132;

export class L6_NamingCeremonyScene extends Phaser.Scene {
  constructor() { super('L6_NamingCeremony'); }

  create(data) {
    // The collected names define the "correct" set; fall back to all 7.
    this._correct = (data && Array.isArray(data.names) && data.names.length >= 1)
      ? data.names : CORRECT_NAMES;
    this._stars  = (data && data.stars) || 0;
    this._found  = 0;
    this._tiles  = [];
    this._done   = false;

    this.cameras.main.fadeIn(500, 0, 0, 0);
    this._buildBackground();
    this._buildHeader();
    this._buildGrid();
    this._buildSpeechBubble();
  }

  // ── Background ──────────────────────────────────────────────────────────
  _buildBackground() {
    const bg = this.add.graphics().setDepth(-30);
    bg.fillGradientStyle(0x3A2A5E, 0x3A2A5E, 0x241640, 0x241640, 1);
    bg.fillRect(0, 0, W, H);
    // Soft starry dots
    for (let i = 0; i < 22; i++) {
      const sx = Math.random() * W, sy = Math.random() * H;
      bg.fillStyle(0xFFFFFF, 0.06 + Math.random() * 0.06);
      bg.fillCircle(sx, sy, 1 + Math.random() * 1.5);
    }
  }

  // ── Header banner + progress pill ───────────────────────────────────────
  _buildHeader() {
    const bw = W - 40, bx = 20, by = 8, bh = 50;
    const g = this.add.graphics().setDepth(20);
    g.fillStyle(0x000000, 0.25); g.fillRoundedRect(bx + 2, by + 3, bw, bh, 16);   // shadow
    g.fillGradientStyle(0x8E5BD0, 0x8E5BD0, 0x6A37B0, 0x6A37B0, 1);               // purple gradient
    g.fillRoundedRect(bx, by, bw, bh, 16);
    g.lineStyle(2, 0xC9A8F0, 0.8); g.strokeRoundedRect(bx, by, bw, bh, 16);
    // Paw-print corner accents
    g.fillStyle(0xFFFFFF, 0.18);
    [[bx + 26, by + 25], [bx + bw - 26, by + 25]].forEach(([px, py]) => {
      g.fillEllipse(px, py + 3, 13, 9);
      [[-5, -4], [0, -6], [5, -4]].forEach(([dx, dy]) => g.fillCircle(px + dx, py + dy, 2.4));
    });

    this.add.text(W / 2, by + 25, 'SELECT THE 7 NAMES YOU COLLECTED',
      { fontSize: '16px', fontFamily: 'Arial Black', color: '#FFFFFF' })
      .setOrigin(0.5).setDepth(21);

    // Progress pill (top-right of the banner)
    this._progPill = this.add.graphics().setDepth(22);
    this._progTxt = this.add.text(bx + bw - 38, by + 25, '0/7',
      { fontSize: '14px', fontFamily: 'Arial Black', color: '#FFFFFF' })
      .setOrigin(0.5).setDepth(23);
    this._drawProgPill();
  }

  _drawProgPill() {
    const bx = 20, bw = W - 40, by = 8;
    const cx = bx + bw - 38, cy = by + 25;
    this._progPill.clear();
    this._progPill.fillStyle(0x2A1A48, 1);
    this._progPill.fillRoundedRect(cx - 26, cy - 13, 52, 26, 13);
    this._progPill.lineStyle(1.5, 0xC9A8F0, 0.7);
    this._progPill.strokeRoundedRect(cx - 26, cy - 13, 52, 26, 13);
  }

  // ── 12-name grid (all visible immediately) ──────────────────────────────
  _buildGrid() {
    const all = shuffle([...CORRECT_NAMES, ...DECOY_NAMES]);
    all.forEach((name, i) => {
      const col = i % COLS, row = Math.floor(i / COLS);
      const x = GRID_X + col * (TILE_W + GAP_X) + TILE_W / 2;
      const y = GRID_Y + row * (TILE_H + GAP_Y) + TILE_H / 2;
      const isCorrect = this._correct.includes(name);

      const bgG = this.add.graphics().setDepth(10);
      const lbl = this.add.text(x, y, name,
        { fontSize: '15px', fontFamily: 'Arial Black', color: '#4A4060' })
        .setOrigin(0.5).setDepth(11);

      const hit = this.add.rectangle(x, y, TILE_W, TILE_H, 0, 0)
        .setDepth(12).setInteractive({ useHandCursor: true });

      const tile = { name, x, y, isCorrect, bgG, lbl, hit, state: 'neutral', busy: false };
      this._drawTile(tile);
      this._tiles.push(tile);

      hit.on('pointerover', () => { if (tile.state === 'neutral') lbl.setScale(1.06); });
      hit.on('pointerout',  () => { if (tile.state === 'neutral') lbl.setScale(1); });
      hit.on('pointerdown', () => this._tapTile(tile));
    });
  }

  _drawTile(tile) {
    const { bgG, x, y, state, lbl } = tile;
    const hw = TILE_W / 2, hh = TILE_H / 2;
    bgG.clear();
    bgG.fillStyle(0x000000, 0.18); bgG.fillRoundedRect(x - hw + 2, y - hh + 3, TILE_W, TILE_H, 12); // shadow
    let fill, border, txt;
    if (state === 'correct')      { fill = 0xBFE9C4; border = 0x4CAF50; txt = '#1B5E20'; }
    else if (state === 'wrong')   { fill = 0xF6C5C5; border = 0xE53935; txt = '#B71C1C'; }
    else                          { fill = 0xE6E1F0; border = 0xB8AED0; txt = '#4A4060'; }
    bgG.fillStyle(fill, 1); bgG.fillRoundedRect(x - hw, y - hh, TILE_W, TILE_H, 12);
    bgG.lineStyle(2.5, border, 1); bgG.strokeRoundedRect(x - hw, y - hh, TILE_W, TILE_H, 12);
    lbl.setColor(txt);
    lbl.setText(state === 'correct' ? `${tile.name}  ✓` : tile.name);
  }

  _tapTile(tile) {
    if (this._done || tile.state === 'correct' || tile.busy) return;

    if (tile.isCorrect) {
      tile.state = 'correct';
      tile.hit.disableInteractive();
      this._drawTile(tile);
      this._found++;
      this._progTxt.setText(`${this._found}/7`);
      this.cameras.main.flash(90, 180, 255, 180);
      this._sparkle(tile.x, tile.y);
      // Gold pop
      this.tweens.add({ targets: tile.lbl, scaleX: 1.25, scaleY: 1.25, duration: 140, yoyo: true });
      if (this._found >= 7) this.time.delayedCall(550, () => this._win());
    } else {
      tile.busy = true;
      tile.state = 'wrong';
      this._drawTile(tile);
      this.cameras.main.shake(120, 0.005);
      this.tweens.add({ targets: [tile.bgG, tile.lbl], x: '+=4', duration: 50, yoyo: true, repeat: 2 });
      this.time.delayedCall(460, () => {
        tile.state = 'neutral';
        tile.busy = false;
        this._drawTile(tile);
      });
    }
  }

  // ── Entry speech bubble (fades after a few seconds) ─────────────────────
  _buildSpeechBubble() {
    const bx = 20, by = H - 56;
    const g = this.add.graphics().setDepth(25);
    g.fillStyle(0xFFFDF5, 0.96); g.fillRoundedRect(bx, by, 360, 42, 12);
    g.lineStyle(2, 0xC9A8F0, 0.9); g.strokeRoundedRect(bx, by, 360, 42, 12);
    g.fillStyle(0xFFFDF5, 0.96); g.fillTriangle(bx + 30, by + 42, bx + 50, by + 42, bx + 24, by + 56);
    const txt = this.add.text(bx + 16, by + 21, '🐾 Tap the 7 names you collected on the run!',
      { fontSize: '12px', fontFamily: 'Georgia, serif', color: '#5A3A80' })
      .setOrigin(0, 0.5).setDepth(26);
    const group = [g, txt];
    this.time.delayedCall(4200, () =>
      this.tweens.add({ targets: group, alpha: 0, duration: 500, onComplete: () => group.forEach(o => o.destroy()) }));
  }

  // ── Win panel ───────────────────────────────────────────────────────────
  _win() {
    this._done = true;
    this.cameras.main.flash(400, 255, 230, 120);

    const ov = this.add.rectangle(W / 2, H / 2, W, H, 0x1A0A2E, 0.66).setDepth(60);

    const pw = 420, ph = 230, px = W / 2 - pw / 2, py = H / 2 - ph / 2;
    const g = this.add.graphics().setDepth(61);
    g.fillStyle(0x000000, 0.3); g.fillRoundedRect(px + 3, py + 4, pw, ph, 20);
    g.fillStyle(0xFFF8E8, 1); g.fillRoundedRect(px, py, pw, ph, 20);
    g.lineStyle(4, 0xF5C84A, 1); g.strokeRoundedRect(px, py, pw, ph, 20);

    this.add.text(W / 2, py + 46, '⭐', { fontSize: '40px' }).setOrigin(0.5).setDepth(62);
    this.add.text(W / 2, py + 92, 'WONDERFUL MEMORY!  7/7',
      { fontSize: '22px', fontFamily: 'Arial Black', color: '#E08A2C' }).setOrigin(0.5).setDepth(62);
    this.add.text(W / 2, py + 122, 'You remembered every name!',
      { fontSize: '14px', fontFamily: 'Georgia, serif', color: '#7A5A30' }).setOrigin(0.5).setDepth(62);

    // Confetti
    for (let i = 0; i < 44; i++) {
      const cc = this.add.rectangle(
        Phaser.Math.Between(20, W - 20), Phaser.Math.Between(-20, H / 2 - 40),
        9, 6, Phaser.Math.RND.pick([0xFF6B9D, 0xFFD700, 0x4CAF50, 0x4FC3F7, 0xC084FC]))
        .setDepth(63);
      this.tweens.add({ targets: cc, y: cc.y + H, angle: 360, alpha: 0, duration: 1800 + Math.random() * 700,
        delay: i * 35, onComplete: () => cc.destroy() });
    }

    // Continue pill button (green gradient)
    const btnY = py + ph - 34, btnW = 200;
    const btnG = this.add.graphics().setDepth(62);
    const drawBtn = (hover) => {
      btnG.clear();
      btnG.fillStyle(0x000000, 0.25); btnG.fillRoundedRect(W / 2 - btnW / 2 + 2, btnY - 17 + 3, btnW, 36, 18);
      btnG.fillGradientStyle(hover ? 0x6FD66F : 0x57C257, hover ? 0x6FD66F : 0x57C257, 0x3DA03D, 0x3DA03D, 1);
      btnG.fillRoundedRect(W / 2 - btnW / 2, btnY - 17, btnW, 36, 18);
      btnG.lineStyle(2, 0xCFF5CF, 0.8); btnG.strokeRoundedRect(W / 2 - btnW / 2, btnY - 17, btnW, 36, 18);
    };
    drawBtn(false);
    const btnTxt = this.add.text(W / 2, btnY, 'CONTINUE →',
      { fontSize: '16px', fontFamily: 'Arial Black', color: '#FFFFFF' }).setOrigin(0.5).setDepth(63);
    const btnHit = this.add.rectangle(W / 2, btnY, btnW, 36, 0, 0).setDepth(64).setInteractive({ useHandCursor: true });
    btnHit.on('pointerover', () => drawBtn(true));
    btnHit.on('pointerout',  () => drawBtn(false));
    btnHit.on('pointerdown', () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(550, () =>
        this.scene.start('L6_Introduction', { names: this._correct, stars: this._stars }));
    });
  }

  _sparkle(x, y) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2, d = 20 + Math.random() * 16;
      const s = this.add.text(x + Math.cos(a) * d, y + Math.sin(a) * d, '✨', { fontSize: '12px' }).setDepth(30);
      this.tweens.add({ targets: s, alpha: 0, scaleX: 0.2, scaleY: 0.2, duration: 520, delay: i * 30, onComplete: () => s.destroy() });
    }
  }
}
