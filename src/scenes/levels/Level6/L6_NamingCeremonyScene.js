import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { playVideoOverlay } from '../../../utils/VideoOverlay.js';
import { showLevelCompleteModal } from '../../../utils/EndModals.js';
import { generatePremiumHudTextures, THEME, makePanel, drawWoodPanel, drawBannerFrame } from '../../../hud/premium/PremiumTheme.js';
import { drawModalPanelBg } from '../ModalFrame.js';

// ── Level 6 · Part 2 — Naming Ceremony (Tap-to-Recall) ───────────────────
// All 12 names are VISIBLE from the first frame. The player taps the 7 names
// they collected during the Garden Runner. Correct → locks in warm gold w/ a
// check; wrong → flashes red briefly then reverts (no penalty, unlimited tries).
// This is a recall game, NOT a face-down memory-flip game.
//
// Visuals use the same shared wood/gold premium theme as every other level
// (PremiumTheme.js) instead of the bespoke flat-purple/Arial-Black look this
// screen used to have, so it matches the rest of the game.

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
const TILE_W = 150, TILE_H = 46, GAP_X = 14, GAP_Y = 16;
const GRID_W = COLS * TILE_W + (COLS - 1) * GAP_X;
const GRID_X = (W - GRID_W) / 2;
const GRID_Y = 138;

export class L6_NamingCeremonyScene extends Phaser.Scene {
  constructor() { super('L6_NamingCeremony'); }

  create(data) {
    generatePremiumHudTextures(this);

    // The collected names define the "correct" set; fall back to all 7.
    this._correct = (data && Array.isArray(data.names) && data.names.length >= 1)
      ? data.names : CORRECT_NAMES;
    this._stars  = (data && data.stars) || 0;
    this._found  = 0;
    this._tiles  = [];
    this._done   = false;

    this.cameras.main.fadeIn(220, 0, 0, 0);
    this._buildBackground();
    this._buildHeader();
    this._buildGrid();
    this._buildSpeechBubble();
  }

  // ── Background — deep walnut wood tone + drifting gold dust, matching the
  // premium theme instead of the old flat purple gradient ────────────────
  _buildBackground() {
    const bg = this.add.graphics().setDepth(-30);
    bg.fillGradientStyle(THEME.WALNUT_D, THEME.WALNUT_D, 0x0a0603, 0x0a0603, 1);
    bg.fillRect(0, 0, W, H);
    // Soft gold dust motes (replaces the plain white dots)
    for (let i = 0; i < 26; i++) {
      const sx = Math.random() * W, sy = Math.random() * H;
      bg.fillStyle(THEME.GOLD_HI, 0.05 + Math.random() * 0.09);
      bg.fillCircle(sx, sy, 1 + Math.random() * 1.6);
    }
  }

  // ── Header banner + progress pill — real wood/gold banner frame (same
  // technique every other level's title banner uses) ─────────────────────
  _buildHeader() {
    const bw = W - 40, bx = 20, by = 8, bh = 54;
    drawBannerFrame(this, bx, by, bw, bh, 20);

    this.add.text(W / 2, by + bh / 2, 'Select the 7 Names You Collected', {
      fontFamily: 'Georgia, serif', fontSize: '17px', fontStyle: 'bold', color: THEME.goldTxt,
      stroke: '#2a1a06', strokeThickness: 3,
      shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 3, stroke: true, fill: true },
    }).setOrigin(0.5).setDepth(23);

    // Progress pill (top-right of the banner)
    const pw = 60, ph = 28, pcx = bx + bw - 40, pcy = by + bh / 2;
    drawWoodPanel(this.add.graphics().setDepth(24), pcx - pw / 2, pcy - ph / 2, pw, ph, 9);
    this._progTxt = this.add.text(pcx, pcy, '0/7', {
      fontFamily: 'Georgia, serif', fontSize: '15px', fontStyle: 'bold', color: THEME.goldTxt,
      stroke: '#1a0f04', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(25);
  }

  // ── 12-name grid (all visible immediately) — parchment/gold tiles ───────
  _buildGrid() {
    const all = shuffle([...CORRECT_NAMES, ...DECOY_NAMES]);
    all.forEach((name, i) => {
      const col = i % COLS, row = Math.floor(i / COLS);
      const x = GRID_X + col * (TILE_W + GAP_X) + TILE_W / 2;
      const y = GRID_Y + row * (TILE_H + GAP_Y) + TILE_H / 2;
      const isCorrect = this._correct.includes(name);

      const bgG = this.add.graphics().setDepth(10);
      const lbl = this.add.text(x, y, name, {
        fontFamily: 'Georgia, serif', fontSize: '15px', fontStyle: 'bold', color: THEME.darkTxt,
      }).setOrigin(0.5).setDepth(11);

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
    bgG.fillStyle(0x000000, 0.3); bgG.fillRoundedRect(x - hw + 2, y - hh + 3, TILE_W, TILE_H, 10); // shadow

    let fill, border, txt;
    if (state === 'correct')      { fill = 0x3a4a1e; border = THEME.GOLD;   txt = THEME.goldTxt; }
    else if (state === 'wrong')   { fill = 0x4a1616; border = 0xd44a3a;     txt = '#ffd6d0'; }
    else                          { fill = 0xe8dcc0; border = THEME.GOLD_DK; txt = THEME.darkTxt; }

    bgG.fillStyle(fill, 1); bgG.fillRoundedRect(x - hw, y - hh, TILE_W, TILE_H, 10);
    bgG.lineStyle(2.5, border, 1); bgG.strokeRoundedRect(x - hw, y - hh, TILE_W, TILE_H, 10);
    if (state !== 'neutral') {
      bgG.lineStyle(1, THEME.GOLD_HI, 0.5); bgG.strokeRoundedRect(x - hw + 2.5, y - hh + 2.5, TILE_W - 5, TILE_H - 5, 8);
    }
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
      this.cameras.main.flash(90, 255, 224, 150);
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

  // ── Entry speech bubble (fades after a few seconds) — parchment note ────
  _buildSpeechBubble() {
    const bx = 20, by = H - 56, bw = 380, bh = 42;
    const g = this.add.graphics().setDepth(25);
    g.fillStyle(0x000000, 0.3); g.fillRoundedRect(bx + 2, by + 3, bw, bh, 12);
    drawWoodPanel(g, bx, by, bw, bh, 12);
    g.fillStyle(THEME.WALNUT, 1); g.fillTriangle(bx + 30, by + bh, bx + 50, by + bh, bx + 24, by + bh + 14);
    g.lineStyle(2, THEME.GOLD, 1); g.lineBetween(bx + 30, by + bh, bx + 24, by + bh + 14); g.lineBetween(bx + 50, by + bh, bx + 24, by + bh + 14);
    const txt = this.add.text(bx + 16, by + bh / 2, '🐾 Tap the 7 names you collected on the run!', {
      fontFamily: 'Georgia, serif', fontSize: '12px', color: THEME.goldTxt,
    }).setOrigin(0, 0.5).setDepth(26);
    const group = [g, txt];
    this.time.delayedCall(4200, () =>
      this.tweens.add({ targets: group, alpha: 0, duration: 500, onComplete: () => group.forEach(o => o.destroy()) }));
  }

  // ── Win panel — same premium wood/gold modal art every level uses ───────
  _win() {
    this._done = true;
    this.cameras.main.flash(400, 255, 230, 120);

    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0603, 0.68).setDepth(60);

    const pw = 420, ph = 236, px = W / 2 - pw / 2, py = H / 2 - ph / 2;
    const shG = this.add.graphics().setDepth(60);
    shG.fillStyle(0x000000, 0.35); shG.fillRoundedRect(px + 3, py + 5, pw, ph, 20);
    const panel = drawModalPanelBg(this, px, py, pw, ph, 61);
    if (!panel) drawWoodPanel(this.add.graphics().setDepth(61), px, py, pw, ph, 18);
    this.add.image(px + 24, py + 32, 'shud_leaf').setScale(0.55).setDepth(62);
    this.add.image(px + pw - 24, py + 32, 'shud_leaf').setScale(0.55).setDepth(62).setFlipX(true);

    this.add.text(W / 2, py + 46, '⭐', { fontSize: '40px' }).setOrigin(0.5).setDepth(62);
    this.add.text(W / 2, py + 94, 'WONDERFUL MEMORY!  7/7', {
      fontFamily: 'Georgia, serif', fontSize: '21px', fontStyle: 'bold', color: THEME.goldTxt,
      stroke: '#2a1a06', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(62);
    this.add.text(W / 2, py + 124, 'You remembered every name!', {
      fontFamily: 'Georgia, serif', fontSize: '13px', color: '#f0e0c0',
    }).setOrigin(0.5).setDepth(62);

    // Confetti
    for (let i = 0; i < 44; i++) {
      const cc = this.add.rectangle(
        Phaser.Math.Between(20, W - 20), Phaser.Math.Between(-20, H / 2 - 40),
        9, 6, Phaser.Math.RND.pick([THEME.GOLD, THEME.GOLD_HI, 0xe0b060, 0xfff3d0, THEME.LEAF_HI]))
        .setDepth(63);
      this.tweens.add({ targets: cc, y: cc.y + H, angle: 360, alpha: 0, duration: 1800 + Math.random() * 700,
        delay: i * 35, onComplete: () => cc.destroy() });
    }

    // Continue button — same wood/gold button style as the pause menu
    const btnW = 200, btnH = 40, bx = W / 2 - btnW / 2, by = py + ph - 54;
    const btnG = this.add.graphics().setDepth(62);
    const drawBtn = (hover) => {
      btnG.clear();
      btnG.fillStyle(hover ? THEME.WALNUT_L : THEME.WALNUT_D, hover ? 0.95 : 0.9);
      btnG.fillRoundedRect(bx, by, btnW, btnH, 12);
      btnG.lineStyle(2.5, hover ? THEME.GOLD_HI : THEME.GOLD, 1);
      btnG.strokeRoundedRect(bx, by, btnW, btnH, 12);
    };
    drawBtn(false);
    const btnTxt = this.add.text(W / 2, by + btnH / 2, 'CONTINUE →', {
      fontFamily: 'Georgia, serif', fontSize: '16px', fontStyle: 'bold', color: THEME.goldTxt,
    }).setOrigin(0.5).setDepth(63);
    const btnHit = this.add.rectangle(W / 2, by + btnH / 2, btnW, btnH, 0, 0).setDepth(64).setInteractive({ useHandCursor: true });
    btnHit.on('pointerover', () => { drawBtn(true); btnTxt.setColor('#ffffff'); });
    btnHit.on('pointerout',  () => { drawBtn(false); btnTxt.setColor(THEME.goldTxt); });
    btnHit.on('pointerdown', () => {
      // Straight to the conclusion cinematic + Level Complete — no separate
      // puppy-introduction/celebration scene in between. playVideoOverlay
      // draws its own opaque black backdrop, so no camera fade is needed
      // here — a fadeOut with nothing to fade back IN would otherwise leave
      // the video and the modal after it invisible (audio would still play).
      playVideoOverlay(this, 'l6_conclusion_video', () => {
        // Show the coins collected from solving mini-games (registry 'points'),
        // consistent with every other level — not a star-based score.
        const points = this.registry.get('points') || 0;
        // Go straight to Level 7 (Stage 1, which plays the L7 intro cinematic
        // itself). Was 'L7_Cutscene' with no `next` in its data — L7_Cutscene
        // defaults to the Menu when data.next is missing, so the old link sent
        // the player back to the menu instead of into Level 7.
        showLevelCompleteModal(this, points, { nextLevelKey: 'L7_Stage1', nextLevelData: { lives: 3, points: 0 } });
      });
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
