import Phaser from 'phaser';
import { W, H } from '../config/GameConfig.js';

// ═════════════════════════════════════════════════════════════════════════════
// SPIRIT ACTIONS CONFIG
// To add a new action: create a folder, add an entry below. That's it.
//
// Two frame modes:
//   Numbered  — set frameCount, omit customFrames  → loads 1.png … N.png
//   Custom    — set customFrames with exact filenames (any extension)
// ═════════════════════════════════════════════════════════════════════════════
const SPIRIT_ACTIONS = {
  idle: {
    label: 'Idle',
    folder: 'Sitting  Frames',
    fps: 1,
    loop: false,
    beltSpeed: 0,
    customFrames: ['Front.jfif'],
  },
  walk: {
    label: 'Walk',
    folder: 'Walking 8 Frames',
    frameCount: 8,
    fps: 10,
    loop: true,
    beltSpeed: 3,
  },
  run: {
    label: 'Run',
    folder: 'Running 8 Frames',
    frameCount: 8,
    fps: 14,
    loop: true,
    beltSpeed: 7,
  },
  new_run: {
    label: 'New Run',
    folder: 'NEW-RUN',
    frameCount: 8,
    fps: 14,
    loop: true,
    beltSpeed: 8,
    padZero: true,
    chromaKey: true, // frames have a flat gray backdrop baked in — strip it at runtime
  },
  spirit_run: {
    label: 'Spirit Run',
    folder: 'glenda-run',
    fps: 26,
    loop: true,
    beltSpeed: 7,
    // PNG frames already have real transparency — no background removal needed.
    customFrames: [
      'frame_001.png', 'frame_002.png', 'frame_003.png', 'frame_004.png',
      'frame_005.png', 'frame_006.png', 'frame_007.png', 'frame_008.png',
      'frame_009.png', 'frame_010.png', 'frame_011.png', 'frame_012.png',
      'frame_013.png', 'frame_014.png', 'frame_015.png', 'frame_016.png',
      'frame_017.png', 'frame_018.png', 'frame_019.png', 'frame_020.png',
      'frame_021.png', 'frame_022.png', 'frame_023.png', 'frame_024.png',
      'frame_025.png', 'frame_026.png',
    ],
  },
  jump: {
    label: 'Jump',
    folder: 'Jumping  Frames',
    frameCount: 6,
    fps: 12,
    loop: false,
    beltSpeed: 0,
  },
  attack: {
    label: 'Attack',
    folder: 'Attack 6 Frames',
    fps: 12,
    loop: false,
    beltSpeed: 0,
    customFrames: [
      'Gemini_Generated_Image_7t4rhv7t4rhv7t4r.jfif',
      'Gemini_Generated_Image_hcnhghhcnhghhcnh.jfif',
      'Gemini_Generated_Image_knr3d5knr3d5knr3.jfif',
      'Gemini_Generated_Image_m0uqb5m0uqb5m0uq.jfif',
      'Gemini_Generated_Image_skqgtmskqgtmskqg.jfif',
    ],
  },
  sit: {
    label: 'Sit',
    folder: 'Sitting  Frames',
    fps: 2,
    loop: true,
    beltSpeed: 0,
    customFrames: ['Front.jfif', 'Left.png', 'Right.png', 'Back.png'],
  },
};

// ── Internal helpers ──────────────────────────────────────────────────────────
const BASE     = 'assets/images/test/';
const KEY      = (action, i) => `spirit_${action}_${i}`;
const MISSING  = 'spirit_placeholder';

// ── Layout constants ──────────────────────────────────────────────────────────
const HEADER_H = 46;
const LEFT_W   = 132;
const RIGHT_W  = 116;
const BOT_H    = 82;
const BELT_H   = 26;

const CENTRE_W = W - LEFT_W - RIGHT_W;
const CENTRE_H = H - HEADER_H - BOT_H;
const CX       = LEFT_W + CENTRE_W / 2;
const CY       = HEADER_H + CENTRE_H / 2;
const BELT_Y   = H - BOT_H;
const DOT_Y    = BELT_Y + BELT_H + 4;
const CTRL_Y   = BELT_Y + BELT_H + 28;

// ─────────────────────────────────────────────────────────────────────────────
export class SpriteSimulator extends Phaser.Scene {
  constructor() { super('SpriteSimulator'); }

  // ── PRELOAD: attempt every frame; collect failures ────────────────────────
  preload() {
    this._failedKeys = new Set();

    this.load.on('loaderror', f => {
      this._failedKeys.add(f.key);
      console.error(`[Spirit] LOAD FAILED: key="${f.key}" url="${f.url}"`);
    });

    for (const [action, cfg] of Object.entries(SPIRIT_ACTIONS)) {
      const filenames = _filenames(cfg);
      filenames.forEach((fname, i) => {
        const k = KEY(action, i);
        const path = `${BASE}${cfg.folder}/${fname}`;
        if (!this.textures.exists(k)) {
          console.log(`[Spirit] Loading: "${k}" from "${path}"`);
          this.load.image(k, path);
        }
      });
    }
  }

  // ── CREATE ────────────────────────────────────────────────────────────────
  create() {
    this._buildValidFrameLists();
    this._chromaKeyFrames();
    this._makePlaceholderTexture();

    // Runtime state
    this._action   = 'idle';
    this._frameIdx = 0;
    this._playing  = true;
    this._elapsed  = 0;
    this._flipX    = false;
    this._scale    = 1.0;
    this._beltOff  = 0;
    this._btnRefs  = {};   // { actionKey → { g, draw } }

    this._buildBackground();
    this._buildSprite();
    this._buildHeader();
    this._buildActionButtons();
    this._buildRightPanel();
    this._buildBelt();
    this._buildPlaybackControls();
    this._setupKeys();

    this.cameras.main.fadeIn(300, 0, 0, 0);
    this._switchAction('idle');
  }

  // ── UPDATE ────────────────────────────────────────────────────────────────
  update(_, delta) {
    this._tickBelt(delta);
    if (!this._playing) return;
    const fps = SPIRIT_ACTIONS[this._action]?.fps ?? 10;
    this._elapsed += delta;
    if (this._elapsed >= 1000 / fps) {
      this._elapsed = 0;
      this._advanceFrame();
    }
  }

  // ── BUILD VALID FRAME LISTS ───────────────────────────────────────────────
  _buildValidFrameLists() {
    this._frames = {};      // { action: [textureKey, ...] }
    this._warnings = [];

    for (const [action, cfg] of Object.entries(SPIRIT_ACTIONS)) {
      const filenames = _filenames(cfg);
      const valid = [], failed = [];

      filenames.forEach((fname, i) => {
        const k = KEY(action, i);
        if (this._failedKeys.has(k)) {
          failed.push(fname);
          console.warn(`[Spirit] ${cfg.label}: frame "${fname}" failed — folder: "${cfg.folder}"`);
        } else {
          valid.push(k);
        }
      });

      if (valid.length === 0) {
        const msg = `${cfg.label}: ⚠ NO FRAMES loaded (folder: "${cfg.folder}")`;
        this._warnings.push(msg);
        console.warn(`[Spirit] ${msg}`);
      } else if (failed.length) {
        const msg = `${cfg.label}: ${failed.length} frame(s) missing`;
        this._warnings.push(msg);
      } else {
        console.log(`[Spirit] ${cfg.label}: ✓  ${valid.length} frame(s) loaded`);
      }

      // Numeric-sort numbered keys (handles frame_2 < frame_10)
      this._frames[action] = valid.sort((a, b) => {
        const ai = parseInt(a.split('_').pop(), 10);
        const bi = parseInt(b.split('_').pop(), 10);
        return isNaN(ai) || isNaN(bi) ? 0 : ai - bi;
      });
    }

    if (this._warnings.length) {
      console.warn(`[Spirit] ${this._warnings.length} warning(s) — check console above`);
    }
  }

  // ── CHROMA-KEY PASS ────────────────────────────────────────────────────────
  // Some source frames (e.g. NEW-RUN) come with a flat, opaque background
  // baked in instead of real transparency. For any action flagged
  // `chromaKey: true`, sample the corner pixel as the background color and
  // punch it out to alpha=0 (with a soft edge) so the sprite floats cleanly.
  _chromaKeyFrames() {
    for (const [action, cfg] of Object.entries(SPIRIT_ACTIONS)) {
      if (!cfg.chromaKey) continue;
      for (const key of this._frames[action] || []) {
        this._chromaKeyTexture(key);
      }
    }
  }

  _chromaKeyTexture(key, tolerance = 26) {
    const src = this.textures.get(key).getSourceImage();
    const w = src.width, h = src.height;
    if (!w || !h) return;

    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(src, 0, 0);

    let imgData;
    try {
      imgData = ctx.getImageData(0, 0, w, h);
    } catch (e) {
      console.warn(`[Spirit] chroma-key skipped for "${key}" (canvas tainted):`, e);
      return;
    }
    const d = imgData.data;

    // Sample background color from the four corners (average) — more robust
    // than a single pixel if there's a slight gradient or noise.
    const corners = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + w - 1) * 4];
    let bgR = 0, bgG = 0, bgB = 0;
    corners.forEach(o => { bgR += d[o]; bgG += d[o + 1]; bgB += d[o + 2]; });
    bgR /= corners.length; bgG /= corners.length; bgB /= corners.length;

    const soft = tolerance * 1.8;
    for (let i = 0; i < d.length; i += 4) {
      const dr = d[i] - bgR, dg = d[i + 1] - bgG, db = d[i + 2] - bgB;
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);
      if (dist < tolerance) {
        d[i + 3] = 0;
      } else if (dist < soft) {
        d[i + 3] = Math.round(d[i + 3] * ((dist - tolerance) / (soft - tolerance)));
      }
    }

    ctx.putImageData(imgData, 0, 0);
    this.textures.remove(key);
    this.textures.addCanvas(key, canvas);
  }

  // ── PLACEHOLDER TEXTURE ───────────────────────────────────────────────────
  _makePlaceholderTexture() {
    if (this.textures.exists(MISSING)) return;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xdddddd, 1); g.fillRect(0, 0, 200, 300);
    g.lineStyle(3, 0xff4444, 1);
    g.lineBetween(0, 0, 200, 300); g.lineBetween(200, 0, 0, 300);
    g.lineStyle(2, 0xff4444, 0.5); g.strokeRect(1, 1, 198, 298);
    g.generateTexture(MISSING, 200, 300);
    g.destroy();
  }

  // ── BACKGROUND + PANELS ───────────────────────────────────────────────────
  _buildBackground() {
    // Main bg
    this.add.rectangle(W/2, H/2, W, H, 0x10121e).setDepth(0);
    // Header strip
    this.add.rectangle(W/2, HEADER_H/2, W, HEADER_H, 0x1a1e30).setDepth(1);
    this.add.graphics().setDepth(1).lineStyle(1, 0xe94560, 0.6)
      .lineBetween(0, HEADER_H, W, HEADER_H);
    // Left sidebar
    this.add.rectangle(LEFT_W/2, HEADER_H + (H-HEADER_H)/2, LEFT_W, H-HEADER_H, 0x141828).setDepth(1);
    this.add.graphics().setDepth(1).lineStyle(1, 0x334, 1)
      .lineBetween(LEFT_W, HEADER_H, LEFT_W, H);
    // Right panel
    this.add.rectangle(W - RIGHT_W/2, HEADER_H + (H-HEADER_H)/2, RIGHT_W, H-HEADER_H, 0x141828).setDepth(1);
    this.add.graphics().setDepth(1).lineStyle(1, 0x334, 1)
      .lineBetween(W - RIGHT_W, HEADER_H, W - RIGHT_W, H);
    // Centre canvas (light)
    this.add.rectangle(CX, HEADER_H + CENTRE_H/2, CENTRE_W, CENTRE_H, 0xf2f4f8).setDepth(1);
    // Subtle grid on centre
    const grid = this.add.graphics().setDepth(2).setAlpha(0.07);
    grid.lineStyle(1, 0x000000);
    for (let x = LEFT_W; x <= W - RIGHT_W; x += 56) grid.lineBetween(x, HEADER_H, x, H - BOT_H);
    for (let y = HEADER_H; y <= H - BOT_H; y += 56) grid.lineBetween(LEFT_W, y, W - RIGHT_W, y);
    // Centre cross
    const ch = this.add.graphics().setDepth(3).setAlpha(0.2);
    ch.lineStyle(1, 0xff6600);
    ch.lineBetween(CX-22, CY, CX+22, CY);
    ch.lineBetween(CX, CY-22, CX, CY+22);
    // Bottom bar
    this.add.rectangle(W/2, BELT_Y + BOT_H/2, W, BOT_H, 0x0e1020).setDepth(1);
    this.add.graphics().setDepth(1).lineStyle(1, 0x334, 1)
      .lineBetween(0, BELT_Y, W, BELT_Y);
  }

  // ── SPRITE (fixed center — treadmill mode) ────────────────────────────────
  _buildSprite() {
    this._sprite = this.add.image(CX, CY, MISSING)
      .setOrigin(0.5).setDisplaySize(160, 240).setDepth(10);
  }

  // ── HEADER BAR ────────────────────────────────────────────────────────────
  _buildHeader() {
    // Logo text
    this.add.text(12, HEADER_H/2, '👻  SPIRIT', {
      fontSize: '20px', fontFamily: 'Georgia, serif',
      color: '#e94560', stroke: '#0a0c18', strokeThickness: 3,
    }).setOrigin(0, 0.5).setDepth(5);

    // Centre info (updates every frame switch)
    this._hdrInfo = this.add.text(W/2 + 30, HEADER_H/2, '', {
      fontSize: '12px', fontFamily: 'Courier New, monospace', color: '#53d8fb',
    }).setOrigin(0.5).setDepth(5);

    // Hint
    this.add.text(W - 8, HEADER_H/2, 'ESC = menu', {
      fontSize: '9px', fontFamily: 'Arial', color: '#556',
    }).setOrigin(1, 0.5).setDepth(5);
  }

  // ── LEFT: ACTION BUTTONS ──────────────────────────────────────────────────
  _buildActionButtons() {
    const ACTIONS = Object.keys(SPIRIT_ACTIONS);
    const BW = LEFT_W - 16, BH = 36, GAP = 10;
    const startY = HEADER_H + 18;
    const cx = LEFT_W / 2;

    // Section label
    this.add.text(cx, HEADER_H + 6, 'ACTIONS', {
      fontSize: '8px', fontFamily: 'Arial', color: '#53d8fb',
    }).setOrigin(0.5).setDepth(5);

    ACTIONS.forEach((key, i) => {
      const cfg = SPIRIT_ACTIONS[key];
      const frameCount = this._frames[key].length;
      const hasFrames = frameCount > 0;
      const cy = startY + i * (BH + GAP);

      const g = this.add.graphics().setDepth(4);

      const draw = (active, hover) => {
        g.clear();
        const fill = active ? 0xe94560 : hover ? 0x1e3a6e : 0x181c30;
        const line = active ? 0xffffff : hover ? 0x4a7aee : 0x2a2e44;
        g.fillStyle(fill, 1);
        g.fillRoundedRect(cx - BW/2, cy - BH/2, BW, BH, 8);
        g.lineStyle(1.5, line, 0.9);
        g.strokeRoundedRect(cx - BW/2, cy - BH/2, BW, BH, 8);
        if (!hasFrames) {
          g.lineStyle(1, 0x884444, 0.5);
          g.strokeRoundedRect(cx - BW/2, cy - BH/2, BW, BH, 8);
        }
      };
      draw(false, false);

      // Label
      const lbl = this.add.text(cx, cy - 5, cfg.label, {
        fontSize: '13px', fontFamily: 'Georgia, serif',
        color: hasFrames ? '#ffffff' : '#664444',
      }).setOrigin(0.5).setDepth(5);

      // Frame count sub-label
      this.add.text(cx, cy + 9, `${frameCount} frame${frameCount !== 1 ? 's' : ''}`, {
        fontSize: '8px', fontFamily: 'Arial',
        color: hasFrames ? '#7799cc' : '#553333',
      }).setOrigin(0.5).setDepth(5);

      const hit = this.add.rectangle(cx, cy, BW, BH, 0, 0)
        .setDepth(6).setInteractive({ useHandCursor: hasFrames });

      if (hasFrames) {
        hit.on('pointerover', () => { if (this._action !== key) draw(false, true); });
        hit.on('pointerout',  () => { if (this._action !== key) draw(false, false); });
        hit.on('pointerup',   () => this._switchAction(key));
      }

      this._btnRefs[key] = { g, draw };
    });
  }

  // ── RIGHT PANEL ──────────────────────────────────────────────────────────
  _buildRightPanel() {
    const rx = W - RIGHT_W/2;
    const BW = RIGHT_W - 14;

    let y = HEADER_H + 10;

    this.add.text(rx, y, 'CONTROLS', {
      fontSize: '8px', fontFamily: 'Arial', color: '#53d8fb',
    }).setOrigin(0.5).setDepth(5);

    y += 18;
    this._makeIconBtn(rx, y, BW, 28, 'F  Flip ↔', 0x1e3060, () => {
      this._flipX = !this._flipX;
      this._sprite.setFlipX(this._flipX);
    });

    y += 36;
    this._makeIconBtn(rx, y, BW, 28, '↑  Bigger', 0x1e3060, () => {
      this._scale = Math.min(2.5, this._scale + 0.15);
      this._applyScale();
    });

    y += 34;
    this._makeIconBtn(rx, y, BW, 28, '↓  Smaller', 0x1e3060, () => {
      this._scale = Math.max(0.2, this._scale - 0.15);
      this._applyScale();
    });

    y += 34;
    this._makeIconBtn(rx, y, BW, 28, '↺  Reset', 0x2a1a3a, () => {
      this._scale = 1.0; this._flipX = false;
      this._sprite.setFlipX(false);
      this._applyScale();
    });

    // Info labels
    y += 46;
    this.add.text(rx, y, 'INFO', {
      fontSize: '8px', fontFamily: 'Arial', color: '#53d8fb',
    }).setOrigin(0.5).setDepth(5);

    y += 16;
    this._lblFps   = this._infoLabel(rx, y,      '—');
    this._lblLoop  = this._infoLabel(rx, y + 18,  '—');
    this._lblScale = this._infoLabel(rx, y + 36,  '—');
    this._lblFrames = this._infoLabel(rx, y + 54, '—');

    // Key hints
    const hints = [
      'W Walk', 'R Run', 'N New Run', 'G Spirit',
      'J Jump', 'A Attack', 'S Sit', 'I Idle',
      'F Flip', '↑↓ Scale', '◀▶ Step', 'SPC Play',
    ];
    let hy = H - BOT_H - 14 - hints.length * 13;
    hints.forEach(h => {
      this.add.text(rx, hy, h, {
        fontSize: '8px', fontFamily: 'Courier New', color: '#445566',
      }).setOrigin(0.5).setDepth(5);
      hy += 13;
    });

    // Warning indicator
    this._lblWarn = this.add.text(rx, H - BOT_H - 8, '', {
      fontSize: '8px', fontFamily: 'Arial', color: '#ff7777',
      align: 'center', wordWrap: { width: RIGHT_W - 8 },
    }).setOrigin(0.5, 1).setDepth(5);

    if (this._warnings.length) {
      this._lblWarn.setText(`⚠ ${this._warnings.length} warning(s)\nsee console`);
    }
  }

  _infoLabel(x, y, initial) {
    return this.add.text(x, y, initial, {
      fontSize: '9px', fontFamily: 'Courier New', color: '#ffe08a', align: 'center',
    }).setOrigin(0.5).setDepth(5);
  }

  _makeIconBtn(cx, cy, bw, bh, label, baseFill, cb) {
    const g = this.add.graphics().setDepth(4);
    const draw = h => {
      g.clear();
      g.fillStyle(h ? 0x2a5a9a : baseFill, 1);
      g.fillRoundedRect(cx - bw/2, cy - bh/2, bw, bh, 7);
      g.lineStyle(1, h ? 0x6699dd : 0x334, 1);
      g.strokeRoundedRect(cx - bw/2, cy - bh/2, bw, bh, 7);
    };
    draw(false);
    this.add.text(cx, cy, label, {
      fontSize: '9px', fontFamily: 'Arial', color: '#c8ddf5',
    }).setOrigin(0.5).setDepth(5);
    const hit = this.add.rectangle(cx, cy, bw, bh, 0, 0)
      .setDepth(6).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => draw(true));
    hit.on('pointerout',  () => draw(false));
    hit.on('pointerup',   () => cb());
  }

  // ── TREADMILL BELT ────────────────────────────────────────────────────────
  _buildBelt() {
    this._beltG = this.add.graphics().setDepth(3);
    this._redrawBelt(0);
  }

  _redrawBelt(offset) {
    const g = this._beltG;
    g.clear();
    g.fillStyle(0x2a2a3a, 1);
    g.fillRect(0, BELT_Y, W, BELT_H);
    // Moving stripe lanes
    for (let x = -48 + (offset % 48); x < W; x += 48) {
      g.fillStyle(0x1e1e2e, 0.9);
      g.fillRect(x, BELT_Y, 24, BELT_H);
    }
    // Stud bolts
    for (let x = 8 + (offset % 48) * 0.6; x < W; x += 48) {
      g.fillStyle(0x445566, 1);
      g.fillCircle(x, BELT_Y + BELT_H/2, 3);
    }
    // Top / bottom edges
    g.lineStyle(2, 0x445566, 1);
    g.lineBetween(0, BELT_Y, W, BELT_Y);
    g.lineBetween(0, BELT_Y + BELT_H, W, BELT_Y + BELT_H);
  }

  _tickBelt(delta) {
    const cfg = SPIRIT_ACTIONS[this._action];
    const speed = (cfg?.beltSpeed ?? 0) * (this._playing ? 1 : 0);
    if (speed > 0) {
      this._beltOff = (this._beltOff + speed * delta / 16) % 480;
      this._redrawBelt(this._beltOff);
    }
  }

  // ── PLAYBACK CONTROLS (bottom bar) ────────────────────────────────────────
  _buildPlaybackControls() {
    const btns = [
      { icon: '⏮', tip: 'First frame',  cb: () => this._gotoFrame(0) },
      { icon: '◀',  tip: 'Prev frame',   cb: () => this._stepFrame(-1) },
      { icon: '⏸',  tip: 'Play/Pause',  cb: () => this._togglePlay(), isPlay: true },
      { icon: '▶',  tip: 'Next frame',   cb: () => this._stepFrame(1) },
      { icon: '⏭', tip: 'Last frame',   cb: () => this._gotoFrame(99) },
    ];

    const BW = 50, BH = 32, GAP = 8;
    const totalW = btns.length * BW + (btns.length - 1) * GAP;
    const startX = W/2 - totalW/2 + BW/2;

    btns.forEach((btn, i) => {
      const cx = startX + i * (BW + GAP);
      const g = this.add.graphics().setDepth(4);
      const t = this.add.text(cx, CTRL_Y, btn.icon, {
        fontSize: btn.isPlay ? '17px' : '14px',
        fontFamily: 'Arial', color: '#ffffff',
      }).setOrigin(0.5).setDepth(5);

      const draw = (h, active) => {
        g.clear();
        const col = active ? 0xe94560 : h ? 0x3050a0 : 0x1e2848;
        g.fillStyle(col, 1);
        g.fillRoundedRect(cx - BW/2, CTRL_Y - BH/2, BW, BH, 9);
        g.lineStyle(1, h || active ? 0x6688cc : 0x2a3050, 1);
        g.strokeRoundedRect(cx - BW/2, CTRL_Y - BH/2, BW, BH, 9);
      };
      draw(false, false);

      const hit = this.add.rectangle(cx, CTRL_Y, BW, BH, 0, 0)
        .setDepth(6).setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => draw(true, btn.isPlay && this._playing));
      hit.on('pointerout',  () => draw(false, btn.isPlay && this._playing));
      hit.on('pointerup',   () => { btn.cb(); if (btn.isPlay) draw(false, this._playing); });

      if (btn.isPlay) {
        this._playBtnG = g; this._playBtnT = t;
        this._redrawPlayBtn = draw;
      }
    });

    // Frame progress dots
    this._dotsG = this.add.graphics().setDepth(4);
  }

  // ── KEYBOARD ──────────────────────────────────────────────────────────────
  _setupKeys() {
    const kb = this.input.keyboard;
    kb.on('keydown-W',     () => this._switchAction('walk'));
    kb.on('keydown-R',     () => this._switchAction('run'));
    kb.on('keydown-N',     () => this._switchAction('new_run'));
    kb.on('keydown-G',     () => this._switchAction('spirit_run'));
    kb.on('keydown-J',     () => this._switchAction('jump'));
    kb.on('keydown-A',     () => this._switchAction('attack'));
    kb.on('keydown-S',     () => this._switchAction('sit'));
    kb.on('keydown-I',     () => this._switchAction('idle'));
    kb.on('keydown-F',     () => { this._flipX = !this._flipX; this._sprite.setFlipX(this._flipX); });
    kb.on('keydown-SPACE', () => this._togglePlay());
    kb.on('keydown-LEFT',  () => this._stepFrame(-1));
    kb.on('keydown-RIGHT', () => this._stepFrame(1));
    kb.on('keydown-UP',    () => { this._scale = Math.min(2.5, this._scale + 0.15); this._applyScale(); });
    kb.on('keydown-DOWN',  () => { this._scale = Math.max(0.2, this._scale - 0.15); this._applyScale(); });
    kb.on('keydown-ESC',   () => {
      this.cameras.main.fadeOut(350, 0, 0, 0);
      this.time.delayedCall(370, () => this.scene.start('Menu'));
    });
  }

  // ── ACTION SWITCH ─────────────────────────────────────────────────────────
  _switchAction(key) {
    if (!SPIRIT_ACTIONS[key] || !this._frames[key].length) return;

    // Deactivate old button
    this._btnRefs[this._action]?.draw(false, false);

    this._action   = key;
    this._frameIdx = 0;
    this._elapsed  = 0;
    this._playing  = true;

    // Activate new button
    this._btnRefs[key]?.draw(true, false);

    this._updateSprite();
    this._refreshHUD();
  }

  // ── CYCLE ACTIONS WITH ARROW KEYS ──────────────────────────────────────────
  _cycleAction(dir) {
    const actionKeys = Object.keys(SPIRIT_ACTIONS);
    const idx = actionKeys.indexOf(this._action);
    const nextIdx = (idx + dir + actionKeys.length) % actionKeys.length;
    const nextKey = actionKeys[nextIdx];
    this._switchAction(nextKey);
  }

  // ── FRAME NAVIGATION ─────────────────────────────────────────────────────
  _advanceFrame() {
    const frames = this._frames[this._action];
    if (!frames?.length) return;
    const cfg = SPIRIT_ACTIONS[this._action];
    this._frameIdx++;
    if (this._frameIdx >= frames.length) {
      if (cfg.loop) {
        this._frameIdx = 0;
      } else {
        this._frameIdx = frames.length - 1;
        this._playing = false;
        this._redrawPlayBtn?.(false, false);
      }
    }
    this._updateSprite();
    this._refreshHUD();
  }

  _stepFrame(dir) {
    const frames = this._frames[this._action];
    if (!frames?.length) return;
    this._playing = false;
    this._redrawPlayBtn?.(false, false);
    this._frameIdx = Phaser.Math.Clamp(this._frameIdx + dir, 0, frames.length - 1);
    this._updateSprite();
    this._refreshHUD();
  }

  _gotoFrame(idx) {
    const frames = this._frames[this._action];
    if (!frames?.length) return;
    this._playing = false;
    this._redrawPlayBtn?.(false, false);
    this._frameIdx = Phaser.Math.Clamp(idx, 0, frames.length - 1);
    this._updateSprite();
    this._refreshHUD();
  }

  _togglePlay() {
    this._playing = !this._playing;
    this._redrawPlayBtn?.(false, this._playing);
    if (this._playBtnT) this._playBtnT.setText(this._playing ? '⏸' : '▶');
  }

  // ── SPRITE UPDATE ─────────────────────────────────────────────────────────
  _updateSprite() {
    const frames = this._frames[this._action];
    const texKey = frames?.[this._frameIdx] ?? MISSING;
    this._sprite.setTexture(this.textures.exists(texKey) ? texKey : MISSING);
    this._sprite.setFlipX(this._flipX);
    this._applyScale();
  }

  _applyScale() {
    const src = this._sprite.texture.getSourceImage();
    const imgW = src?.width  || 200;
    const imgH = src?.height || 300;
    const maxH = Math.min(CENTRE_H - 20, 290) * this._scale;
    const maxW = (CENTRE_W - 20) * this._scale;
    // Fit within centre area, maintain aspect ratio
    let dh = maxH;
    let dw = dh * (imgW / imgH);
    if (dw > maxW) { dw = maxW; dh = dw * (imgH / imgW); }
    this._sprite.setDisplaySize(dw, dh);
    this._lblScale?.setText(`Scale: ${Math.round(this._scale * 100)}%`);
  }

  // ── HUD UPDATE ────────────────────────────────────────────────────────────
  _refreshHUD() {
    const cfg    = SPIRIT_ACTIONS[this._action];
    const frames = this._frames[this._action];
    const total  = frames.length;
    const cur    = this._frameIdx + 1;
    const pIcon  = this._playing ? '▶' : '⏸';
    const lIcon  = cfg.loop ? '↺ LOOP' : '→ ONCE';

    this._hdrInfo?.setText(
      `${pIcon}  ${cfg.label.toUpperCase()}  │  Frame ${cur} / ${total}  │  ${cfg.fps} FPS  │  ${lIcon}`
    );

    this._lblFps?.setText(`FPS: ${cfg.fps}`);
    this._lblLoop?.setText(lIcon);
    this._lblFrames?.setText(`${cur} / ${total} frames`);

    // Play button icon sync
    if (this._playBtnT) this._playBtnT.setText(this._playing ? '⏸' : '▶');

    this._drawDots(total, this._frameIdx);
  }

  _drawDots(total, current) {
    const g = this._dotsG;
    if (!g) return;
    g.clear();
    if (total === 0) return;
    const max = Math.min(total, 24);
    const dW = 9, dGap = 4;
    const strip = max * (dW + dGap) - dGap;
    const sx = W/2 - strip/2;
    for (let i = 0; i < max; i++) {
      const x = sx + i * (dW + dGap);
      const col = i === current ? 0xe94560 : i < current ? 0x3a7acc : 0x2a2e44;
      g.fillStyle(col, 1);
      g.fillRoundedRect(x, DOT_Y, dW, 5, 2);
    }
  }
}

// ── Internal: get filename list for a config entry ────────────────────────────
function _filenames(cfg) {
  if (cfg.customFrames) return cfg.customFrames;
  const pad = cfg.padZero ? 2 : 0; // Always 2 digits: 01, 02, ..., 99
  const ext = cfg.ext || 'png';
  return Array.from({ length: cfg.frameCount }, (_, i) => {
    const num = String(i + 1).padStart(pad, '0');
    return `${num}.${ext}`;
  });
}
