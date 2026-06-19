import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { generateL5Assets } from './L5Assets.js';

// ── Pastel color palette (matches UI mockup) ─────────────────────────────
const C = {
  PEACH:   0xF2A878,  PINK_BG: 0xF9D4D4,  CREAM:  0xF5E8D0,
  BLUE:    0x7DD3F0,  GOLD:    0xF5C842,  GREY:   0xB8B8B8,
  GREEN:   0x5BC85B,  WHITE:   0xFFFFFF,  PURPLE: 0xE8D5F5,
  ORANGE:  0xFF8C42,  DARK:    0x4A3A2A,  PINK2:  0xFFB8C8,
  LBLUE:   0xD0EEFF,  SOFTGRN: 0xD0FFE8,  BGLOW:  0xFFE8B0,
};

// ── Task definitions ─────────────────────────────────────────────────────
const TASKS = [
  { id:'heart',   label:'Heart Check',   emoji:'🩺', color:0xFFD0D8 },
  { id:'water',   label:'Fresh Water',   emoji:'💧', color:0xD0EEFF },
  { id:'towels',  label:'Soft Towel',    emoji:'🧺', color:0xFFEED0 },
  { id:'blanket', label:'Cozy Blanket',  emoji:'🧣', color:0xEDD0FF },
  { id:'lamp',    label:'Gentle Heat',   emoji:'💡', color:0xFFF0C0 },
  { id:'nursery', label:'Nursery Setup', emoji:'🧸', color:0xFFD8E8 },
];

// ── Layout constants ──────────────────────────────────────────────────────
const HDR_H = 50;               // header height
const BOT_H = 46;               // bottom bar height
const MID_Y = HDR_H;            // main area top
const MID_H = H - HDR_H - BOT_H; // main area height (354)
const L_W   = 550;              // left scene width
const R_X   = 554;              // right panel start x
const R_W   = W - R_X - 4;     // right panel width (242)
const ROW_H = Math.floor((MID_H - 12) / 6); // ≈59
const BOT_Y = H - BOT_H;       // bottom bar y (404)


// ── Puppy arrival data ────────────────────────────────────────────────────
const PUPPY_STEPS = [
  { task:'towels',  msg:'"Dry this little one! 🧺"',      action:'Use soft towels!'    },
  { task:'water',   msg:'"Warm paws in the bowl! 💧"',     action:'Warm water ready!'   },
  { task:'blanket', msg:'"Wrap in the blanket! 🧣"',       action:'Cozy and wrapped!'   },
  { task:'lamp',    msg:'"Under the warm lamp! 💡"',       action:'Nice and toasty!'    },
  { task:'nursery', msg:'"Nursery corner check! 🧸"',      action:'Comfort check done!' },
  { task:'heart',   msg:'"Last one — heart check! 🩺"',    action:'All heartbeats good!'},
];

export class Level5Scene extends Phaser.Scene {
  constructor() { super('Level5'); }

  preload() {
    const IMG_PATH = 'assets/images/Level%205/treatment/';
    // texture key → actual filename saved on disk
    const propFiles = {
      stethoscope: 'stethoscope',
      water_bowl:  'water_bowl',
      towels:      'towels_stack',
      blanket:     'blanket',
      lamp:        'heat_lamp',
      basket:      'puppy_basket',
      nursery:     'nursery',
      gemma_lying: 'gemma_lying',
      gemma_lying_blanket: 'gemma_lying_blanket',
      heat_lamp_img: 'heat_lamp',
      puppy:          'puppy',
      puppy_in_basket:'puppy_in_basket',
    };
    Object.entries(propFiles).forEach(([key, file]) => {
      if (!this.textures.exists(key)) {
        this.load.image(key, `${IMG_PATH}${file}.png`);
      }
    });
    this.load.on('loaderror', (fileObj) => console.warn('❌ Failed to load:', fileObj.src));
  }

  create() {
    try { generateL5Assets(this); } catch(_) {}

    this._stars    = this.registry.get('l5_stars') || 0;
    this._taskIdx  = 0;
    this._done     = Array(6).fill(false);
    this._progress = 0;
    this._phase    = 'prep';
    this._iObjs    = [];
    this._roomDecors = [];   // persistent decor added after each task
    this._pupCount = 0;
    this._bktSlots = [];
    this._progressInterval = null;

    this.events.once('shutdown', () => {
      if (this._progressInterval) { clearInterval(this._progressInterval); this._progressInterval = null; }
      this.tweens.killAll();
      this.time.removeAllEvents();
    });
    // maps both task IDs (heart/water/...) and prop names to texture keys
    this._propTextures = {
      heart:'stethoscope', water:'water_bowl', towels:'towels', blanket:'blanket', lamp:'lamp', nursery:'nursery',
      stethoscope:'stethoscope', water_bowl:'water_bowl',
    };

    this.cameras.main.setBackgroundColor('#F9D4D4');
    this.cameras.main.fadeIn(700, 249, 212, 212);

    this._buildRoom();
    this._buildHeader();
    this._buildCareJourney();
    this._buildBottomBar();

    this.time.delayedCall(900, () => this._activateTask(0));
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ROOM SCENE (left 490px)
  // ═══════════════════════════════════════════════════════════════════════
  _buildRoom() {
    // ── WALL BACKGROUND ─────────────────────────────────────────────────
    const bg = this.add.graphics().setDepth(0);
    bg.fillGradientStyle(0xFFE4D8, 0xFFE4D8, 0xFAD4C4, 0xFAD4C4, 1);
    bg.fillRect(0, MID_Y, L_W, MID_H);

    // Subtle wall panel lines (wainscoting)
    const wall = this.add.graphics().setDepth(0);
    wall.lineStyle(1, 0xF0C0A8, 0.4);
    for (let wx = 40; wx < L_W; wx += 60) wall.lineBetween(wx, MID_Y, wx, MID_Y + MID_H * 0.6);
    wall.lineStyle(1, 0xF0C0A8, 0.35);
    wall.lineBetween(0, MID_Y + MID_H * 0.6, L_W, MID_Y + MID_H * 0.6);

    // ── FLOOR ───────────────────────────────────────────────────────────
    const fl = this.add.graphics().setDepth(0);
    fl.fillGradientStyle(0xF0DEC8, 0xF0DEC8, 0xE0CEB4, 0xE0CEB4, 1);
    fl.fillRect(0, MID_Y + MID_H * 0.6, L_W, MID_H * 0.4);
    // Floorboard lines
    for (let fx = 0; fx < L_W; fx += 48) {
      fl.lineStyle(1, 0xD0B898, 0.35);
      fl.lineBetween(fx, MID_Y + MID_H * 0.6, fx + 30, MID_Y + MID_H);
    }
    // Baseboard
    fl.fillStyle(0xE8C8A8, 1);
    fl.fillRect(0, MID_Y + MID_H * 0.6, L_W, 6);
    fl.lineStyle(1, 0xC8A880, 0.6);
    fl.lineBetween(0, MID_Y + MID_H * 0.6 + 6, L_W, MID_Y + MID_H * 0.6 + 6);

    // ── WINDOW (top right, with sunlight rays) ───────────────────────────
    const wx = 368, wy = MID_Y + 10, ww = 100, wh = 82;
    // Sunlight splash behind window
    const sunG = this.add.graphics().setDepth(1);
    sunG.fillStyle(0xFFEEB0, 0.22);
    sunG.fillTriangle(wx, wy, wx + ww, wy, wx + ww * 1.6, MID_Y + MID_H * 0.55);
    sunG.fillTriangle(wx - ww * 0.3, wy, wx + ww, wy, wx + ww * 0.8, MID_Y + MID_H * 0.55);
    // Window pane
    const win = this.add.graphics().setDepth(2);
    win.fillStyle(0xD8F4FF, 0.65); win.fillRoundedRect(wx, wy, ww, wh, 8);
    win.lineStyle(2.5, 0xB8D4E8, 0.8); win.strokeRoundedRect(wx, wy, ww, wh, 8);
    // Cross dividers
    win.lineStyle(2, 0xC0D8EE, 0.7);
    win.lineBetween(wx + ww/2, wy + 2, wx + ww/2, wy + wh - 2);
    win.lineBetween(wx + 2, wy + wh/2, wx + ww - 2, wy + wh/2);
    // Window sill
    win.fillStyle(0xE8C8A8, 1);
    win.fillRoundedRect(wx - 4, wy + wh - 2, ww + 8, 8, 3);
    // Curtain left
    const wcu = this.add.graphics().setDepth(3);
    wcu.fillStyle(0xFFB8A0, 0.6); wcu.fillRoundedRect(wx - 8, wy - 2, 20, wh + 8, { tl:4, tr:0, bl:4, br:0 });
    wcu.fillStyle(0xFF9880, 0.35); wcu.fillRect(wx - 4, wy, 10, wh);
    // Curtain right
    wcu.fillStyle(0xFFB8A0, 0.6); wcu.fillRoundedRect(wx + ww - 12, wy - 2, 20, wh + 8, { tl:0, tr:4, bl:0, br:4 });
    wcu.fillStyle(0xFF9880, 0.35); wcu.fillRect(wx + ww - 6, wy, 10, wh);
    // Curtain tie-backs
    wcu.fillStyle(0xFFD080, 1); wcu.fillCircle(wx + 10, wy + wh * 0.6, 5);
    wcu.fillStyle(0xFFD080, 1); wcu.fillCircle(wx + ww + 10, wy + wh * 0.6, 5);

    // ── WALL DECORATIONS ────────────────────────────────────────────────
    // Small heart picture frame
    const frame = this.add.graphics().setDepth(2);
    frame.fillStyle(0xD4A870, 1); frame.fillRoundedRect(38, MID_Y + 16, 44, 44, 5);
    frame.lineStyle(2, 0xC09050, 1); frame.strokeRoundedRect(38, MID_Y + 16, 44, 44, 5);
    frame.fillStyle(0xFFF0E8, 1); frame.fillRoundedRect(42, MID_Y + 20, 36, 36, 3);
    this.add.text(60, MID_Y + 38, '🐾', { fontSize: '20px' }).setOrigin(0.5).setDepth(3);

    // ── BED AREA with GAMMA ───────────────────────────────────────────────
    const bx = 226, by = MID_Y + MID_H * 0.56;
    this._bedCX = bx; this._bedCY = by;

    // Bed shadow on floor
    this.add.ellipse(bx + 4, by + 72, 280, 24, 0x000000, 0.1).setDepth(2);

    // GAMMA (gemma_lying.png fills the bed area)
    this._gammaX = bx; this._gammaY = by;

    if (this.textures.exists('gemma_lying')) {
      this._gamma = this.add.image(bx, by, 'gemma_lying')
        .setDisplaySize(320, 160).setDepth(7).setOrigin(0.5, 0.5);
    } else if (this.textures.exists('gemma_idle')) {
      // Use idle image, squished horizontally to suggest lying
      this._gamma = this.add.image(gx, gy, 'gemma_idle')
        .setDisplaySize(180, 82).setDepth(7).setOrigin(0.5, 0.85);
    } else {
      // Procedural lying dog (golden retriever, curled on side)
      const gg = this.add.graphics().setDepth(7);
      // Body shadow
      gg.fillStyle(0x000000, 0.07); gg.fillEllipse(gx + 8, gy + 24, 128, 22);
      // Main body (horizontal lying ellipse)
      gg.fillStyle(0xD4924A, 1); gg.fillEllipse(gx + 12, gy, 130, 54);
      // Belly highlight
      gg.fillStyle(0xEAB870, 1); gg.fillEllipse(gx + 10, gy + 10, 100, 28);
      // Back leg (back right, tucked)
      gg.fillStyle(0xC07830, 1); gg.fillEllipse(gx + 52, gy + 22, 36, 18);
      gg.fillStyle(0xD4924A, 1); gg.fillEllipse(gx + 66, gy + 26, 24, 12);
      // Front paws (stretched out left)
      gg.fillStyle(0xD4924A, 1); gg.fillEllipse(gx - 56, gy + 12, 38, 16);
      gg.fillStyle(0xC07830, 1); gg.fillEllipse(gx - 62, gy + 16, 18, 10);
      // Paw toe lines
      gg.lineStyle(1, 0xAA6020, 0.6);
      gg.lineBetween(gx - 66, gy + 14, gx - 66, gy + 22);
      gg.lineBetween(gx - 59, gy + 13, gx - 59, gy + 22);
      gg.lineBetween(gx - 52, gy + 14, gx - 52, gy + 22);
      // Head (resting, tilted)
      gg.fillStyle(0xD4924A, 1); gg.fillCircle(gx - 42, gy - 10, 30);
      // Cheek / muzzle
      gg.fillStyle(0xE8AA60, 1); gg.fillEllipse(gx - 28, gy - 4, 22, 18);
      // Ear (flopped flat to side)
      gg.fillStyle(0xC07830, 1); gg.fillEllipse(gx - 60, gy - 4, 16, 34);
      // Eyes closed (crescent arcs)
      gg.lineStyle(2.5, 0x4A2800, 1);
      gg.beginPath(); gg.arc(gx - 46, gy - 14, 6, Math.PI, 0); gg.strokePath();
      gg.beginPath(); gg.arc(gx - 30, gy - 12, 5, Math.PI, 0); gg.strokePath();
      // Nose
      gg.fillStyle(0x6A3400, 1); gg.fillEllipse(gx - 22, gy - 2, 11, 8);
      // Tail (curled behind)
      gg.fillStyle(0xD4924A, 1); gg.fillEllipse(gx + 68, gy - 14, 20, 30);
      gg.fillStyle(0xEAB870, 1); gg.fillEllipse(gx + 70, gy - 12, 12, 18);
      this._gamma = gg;
    }

    // Gentle breathing tween (subtle vertical bob)
    if (this._gamma.y !== undefined)
      this.tweens.add({ targets: this._gamma, y: this._gamma.y - 3, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // ── WATER BOWL (bottom left, improved) ──────────────────────────────
    const wbG = this.add.graphics().setDepth(4);
    // Bowl base shadow
    wbG.fillStyle(0x000000, 0.07); wbG.fillEllipse(60, BOT_Y - 14, 68, 14);
    // Bowl outer
    wbG.fillStyle(0xFFAACC, 1); wbG.fillEllipse(58, BOT_Y - 18, 68, 30);
    // Bowl rim
    wbG.lineStyle(2, 0xFF88AA, 1); wbG.strokeEllipse(58, BOT_Y - 18, 68, 30);
    // Water surface
    wbG.fillStyle(0xAADDFF, 0.85); wbG.fillEllipse(58, BOT_Y - 22, 52, 18);
    wbG.lineStyle(1, 0x88CCFF, 0.6); wbG.strokeEllipse(58, BOT_Y - 22, 52, 18);
    // Water shimmer
    wbG.fillStyle(0xFFFFFF, 0.5); wbG.fillEllipse(50, BOT_Y - 24, 16, 6);
    // "WATER" label
    this.add.text(58, BOT_Y - 6, 'water', { fontSize: '7px', fontFamily: 'Georgia, serif', color: '#AA88BB' }).setOrigin(0.5).setDepth(5);

    // Room warm glow (fills as tasks complete)
    this._roomGlow = this.add.rectangle(L_W/2, MID_Y + MID_H/2, L_W, MID_H, C.BGLOW, 0).setDepth(2);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════════════════════════
  _buildHeader() {
    const g = this.add.graphics().setDepth(35);
    g.fillStyle(C.PEACH, 1); g.fillRect(0, 0, W, HDR_H);
    g.fillStyle(0x000000, 0.05); g.fillRect(0, HDR_H - 3, W, 3);

    // Title
    this.add.text(W/2, 25, 'Treatment Support & Puppy Welcome',
      { fontSize: '14px', fontFamily: 'Georgia, serif', color: '#5A3A2A', fontStyle: 'bold' })
      .setOrigin(0.5).setDepth(36);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CARE JOURNEY PANEL  (right side — matches premium mockup)
  // ═══════════════════════════════════════════════════════════════════════
  _buildCareJourney() {
    // Panel background with soft shadow
    const shadowG = this.add.graphics().setDepth(9);
    shadowG.fillStyle(0x000000, 0.1);
    shadowG.fillRoundedRect(R_X + 3, MID_Y + 3, R_W - 2, MID_H - 2, 10);

    // Main white panel
    const pg = this.add.graphics().setDepth(10);
    pg.fillStyle(0xFFFAF8, 1);
    pg.fillRoundedRect(R_X, MID_Y, R_W, MID_H, 10);
    pg.lineStyle(3.5, 0xE8C8B8, 1);
    pg.strokeRoundedRect(R_X, MID_Y, R_W, MID_H, 10);

    // Gradient-like header with warm accent
    const hdrG = this.add.graphics().setDepth(11);
    hdrG.fillStyle(0xFFF5F0, 1);
    hdrG.fillRoundedRect(R_X, MID_Y, R_W, 45, { tl: 10, tr: 10, bl: 0, br: 0 });
    // Accent line below header
    hdrG.lineStyle(4, 0xE8B66C, 1);
    hdrG.lineBetween(R_X + 10, MID_Y + 45, R_X + R_W - 10, MID_Y + 45);

    this.add.text(R_X + R_W / 2, MID_Y + 22, 'Care Journey',
      { fontSize: '14px', fontFamily: 'Georgia, serif', color: '#C8623C', fontStyle: 'bold', stroke: '#FFF5F0', strokeThickness: 2 })
      .setOrigin(0.5).setDepth(12);

    // Build rows
    this._rowObjs = [];
    TASKS.forEach((t, i) => this._rowObjs.push(this._buildJourneyRow(i, t)));
  }

  _buildJourneyRow(i, def) {
    const all = [];
    const PANEL_TOP = MID_Y + 50;
    const STEP_H    = Math.floor((MID_H - 55) / 6);
    const ry        = PANEL_TOP + i * STEP_H + STEP_H / 2;
    const done      = this._done[i];
    const active    = i === this._taskIdx && !done;
    const locked    = i > this._taskIdx;

    // ── Connector line & arrow between rows ──────────────────────────
    if (i < 5) {
      const conn = this.add.graphics().setDepth(11);
      conn.lineStyle(3, locked && i >= this._taskIdx ? 0xD8D8D8 : 0xB8D8C8, 0.95);
      conn.lineBetween(R_X + 16, ry + STEP_H / 2 + 2, R_X + 16, ry + STEP_H - 6);
      // arrowhead
      conn.fillStyle(locked && i >= this._taskIdx ? 0xD8D8D8 : 0xB8D8C8, 0.95);
      conn.fillTriangle(R_X + 16, ry + STEP_H - 1, R_X + 10, ry + STEP_H - 10, R_X + 22, ry + STEP_H - 10);
      all.push(conn);
    }

    // ── Row background with soft shadow ───────────────────────────────
    const rowShadow = this.add.graphics().setDepth(11);
    const rowBg = this.add.graphics().setDepth(12);

    if (active) {
      // Active row: golden highlight with shadow
      rowShadow.fillStyle(0x000000, 0.08);
      rowShadow.fillRoundedRect(R_X + 4, ry - STEP_H/2 + 4, R_W - 8, STEP_H - 4, 8);
      rowBg.fillStyle(0xFFFAF0, 1);
      rowBg.fillRoundedRect(R_X + 4, ry - STEP_H/2 + 1, R_W - 8, STEP_H - 4, 8);
      rowBg.lineStyle(3, 0xE8B450, 1);
      rowBg.strokeRoundedRect(R_X + 4, ry - STEP_H/2 + 1, R_W - 8, STEP_H - 4, 8);
    } else if (done) {
      // Done row: soft green
      rowShadow.fillStyle(0x000000, 0.05);
      rowShadow.fillRoundedRect(R_X + 4, ry - STEP_H/2 + 4, R_W - 8, STEP_H - 4, 8);
      rowBg.fillStyle(0xF5FDF8, 1);
      rowBg.fillRoundedRect(R_X + 4, ry - STEP_H/2 + 1, R_W - 8, STEP_H - 4, 8);
      rowBg.lineStyle(2.5, 0xA0D8B8, 0.9);
      rowBg.strokeRoundedRect(R_X + 4, ry - STEP_H/2 + 1, R_W - 8, STEP_H - 4, 8);
    } else {
      // Locked row: neutral
      rowBg.fillStyle(0xFBFAF9, 0.6);
      rowBg.fillRoundedRect(R_X + 4, ry - STEP_H/2 + 1, R_W - 8, STEP_H - 4, 8);
      rowBg.lineStyle(1.5, 0xD8D8D8, 0.6);
      rowBg.strokeRoundedRect(R_X + 4, ry - STEP_H/2 + 1, R_W - 8, STEP_H - 4, 8);
    }
    all.push(rowShadow);
    all.push(rowBg);

    // ── Step number circle ────────────────────────────────────────────
    const cx = R_X + 16, cy = ry;
    const circG = this.add.graphics().setDepth(13);
    if (done) {
      circG.fillStyle(0x40D060, 1); circG.fillCircle(cx, cy, 13);
      circG.lineStyle(3, 0x1A8E38, 1); circG.strokeCircle(cx, cy, 13);
    } else if (active) {
      circG.fillStyle(0xF8D44A, 1); circG.fillCircle(cx, cy, 13);
      circG.lineStyle(3, 0xD8A01C, 1); circG.strokeCircle(cx, cy, 13);
      const pulse = this.add.circle(cx, cy, 17, 0xF8D44A, 0.3).setDepth(12);
      all.push(pulse);
      this.tweens.add({ targets: pulse, scaleX: 1.4, scaleY: 1.4, alpha: 0, duration: 800, repeat: -1 });
    } else {
      circG.fillStyle(0xE0E0E0, 1); circG.fillCircle(cx, cy, 13);
      circG.lineStyle(2, 0xB8B8B8, 1); circG.strokeCircle(cx, cy, 13);
    }
    all.push(circG);
    all.push(this.add.text(cx, cy, done ? '✓' : `${i+1}`,
      { fontSize: '11px', fontFamily: 'Arial Black', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 1 })
      .setOrigin(0.5).setDepth(14));

    // ── Prop icon (image or emoji) ────────────────────────────────────
    // icon center at R_X+40 (after circle r=11, gap=13)
    const propKeys = ['stethoscope','water_bowl','towels','blanket','lamp','nursery'];
    const iconKey  = this._propTextures[propKeys[i]];
    const iconX    = R_X + 40, iconSize = 20;
    const iconAlpha = locked ? 0.4 : 1;

    let iconObj;
    if (iconKey && this.textures.exists(iconKey)) {
      iconObj = this.add.image(iconX, ry, iconKey).setDisplaySize(iconSize, iconSize).setDepth(13).setAlpha(iconAlpha);
    } else {
      const EMOJI_MAP = { 'stethoscope': '🩺', 'water_bowl': '💧', 'towels': '🧺',
        'blanket': '🧣', 'lamp': '💡', 'nursery': '🧸' };
      const emoji = EMOJI_MAP[iconKey] || def.emoji || '✨';
      iconObj = this.add.text(iconX, ry, emoji, { fontSize: '16px' }).setOrigin(0.5).setDepth(13).setAlpha(iconAlpha);
    }
    all.push(iconObj);

    // ── Label text ───────────────────────────────────────────────────
    const lblColor = locked ? '#BFBFBF' : done ? '#2EA856' : active ? '#6B4423' : '#8A8A8A';
    const lblWeight = active ? 600 : done ? 500 : 400;
    const lbl = this.add.text(R_X + 56, ry, def.label,
      { fontSize: '11px', fontFamily: 'Georgia, serif', color: lblColor,
        fontStyle: active ? 'italic' : 'normal', fontWeight: lblWeight, wordWrap: { width: 130 } })
      .setOrigin(0, 0.5).setDepth(13).setAlpha(locked ? 0.6 : 1);
    all.push(lbl);

    // ── Right icon (lock / done star / arrow) ────────────────────────
    const iconRX = R_X + R_W - 16;
    if (locked) {
      const lkG = this.add.graphics().setDepth(13);
      lkG.fillStyle(0xE8E8E8, 1); lkG.fillCircle(iconRX, ry, 13);
      lkG.lineStyle(2.5, 0xB0B0B0, 1); lkG.strokeCircle(iconRX, ry, 13);
      all.push(lkG);
      all.push(this.add.text(iconRX, ry, '🔒', { fontSize: '11px' }).setOrigin(0.5).setDepth(14).setAlpha(0.7));
    } else if (done) {
      all.push(this.add.text(iconRX, ry, '⭐', { fontSize: '16px' }).setOrigin(0.5).setDepth(14));
    } else if (active) {
      const arrG = this.add.graphics().setDepth(13);
      arrG.fillStyle(0xE8B450, 1);
      arrG.fillTriangle(iconRX - 6, ry - 8, iconRX - 6, ry + 8, iconRX + 8, ry);
      all.push(arrG);
    }

    return { all };
  }

  _updateJourney() {
    this._rowObjs.forEach(r => r.all?.forEach(o => { try { this.tweens.killTweensOf(o); o?.destroy(); } catch(_){} }));
    this._rowObjs = [];
    TASKS.forEach((t, i) => this._rowObjs.push(this._buildJourneyRow(i, t)));
  }

  // kept for backward-compat calls
  _refreshPanel() { this._updateJourney(); }

  // ═══════════════════════════════════════════════════════════════════════
  // BOTTOM BAR
  // ═══════════════════════════════════════════════════════════════════════
  _buildBottomBar() {
    const g = this.add.graphics().setDepth(35);
    g.fillStyle(C.PINK_BG, 1); g.fillRect(0, BOT_Y, W, BOT_H);
    g.lineStyle(1, 0xDCC8C8, 1); g.lineBetween(0, BOT_Y, W, BOT_Y);

    this._phaseLbl = this.add.text(28, BOT_Y + 9, 'Preparation Phase',
      { fontSize: '11px', fontFamily: 'Georgia, serif', color: '#E08060', fontStyle: 'bold' }).setDepth(36);

    // Track
    this._bX = 28; this._bY = BOT_Y + 26; this._bW = W - 56; this._bHH = 13;
    const track = this.add.graphics().setDepth(36);
    track.fillStyle(0xFFFFFF, 0.85); track.fillRoundedRect(this._bX, this._bY, this._bW, this._bHH, 7);
    track.lineStyle(1, 0xDDCCCC, 1); track.strokeRoundedRect(this._bX, this._bY, this._bW, this._bHH, 7);

    this.add.text(this._bX, this._bY + this._bHH + 5, '0%', { fontSize: '8px', color: '#C09090' }).setOrigin(0, 0).setDepth(36);
    this._progEndLbl = this.add.text(this._bX + this._bW, this._bY + this._bHH + 5, '60%', { fontSize: '8px', color: '#C09090' }).setOrigin(1, 0).setDepth(36);

    this._progFill = this.add.graphics().setDepth(37);
    this._drawBar(0);

    // Shimmer
    this._shimmer = this.add.rectangle(this._bX + 8, this._bY + this._bHH/2, 24, this._bHH - 4, 0xFFFFFF, 0.55).setDepth(38);
    this.tweens.add({ targets: this._shimmer, x: this._bX + this._bW - 14, duration: 1700, repeat: -1, ease: 'Sine.easeInOut',
      onRepeat: () => { this._shimmer.x = this._bX + 8; } });

    // Confetti dots (decorative, static)
    const confG = this.add.graphics().setDepth(36);
    const cc = [0xFF6B6B, 0xFFD93D, 0x6BCB77, 0x4D96FF, 0xFF6BFF];
    for (let i = 0; i < 12; i++) {
      confG.fillStyle(cc[i % cc.length], 0.7);
      confG.fillRect(this._bX + 8 + i * (this._bW / 13), this._bY + (i%2 === 0 ? -5 : this._bHH + 2), 5, 5);
    }

  }

  // ── Persistent room decoration after each task ────────────────────────
  _addRoomDecor(taskIdx) {
    const decors = [
      // 0 heart: small EKG dot on wall
      () => { const d = this.add.text(318, MID_Y + 26, '💚', { fontSize: '13px' }).setDepth(8); this._roomDecors.push(d); },
      // 1 water: steam above bowl
      () => {
        for (let s = 0; s < 3; s++) {
          const st = this.add.text(44 + s * 14, BOT_Y - 40, '💨', { fontSize: '10px' }).setDepth(8).setAlpha(0.7);
          this.tweens.add({ targets: st, y: st.y - 18, alpha: 0, duration: 1400, repeat: -1, delay: s * 350 });
          this._roomDecors.push(st);
        }
      },
      // 2 towels: towel stack near bed foot
      () => {
        const propKey = 'towels';
        const d = this.textures.exists(propKey)
          ? this.add.image(68, MID_Y + MID_H * 0.75, propKey).setDisplaySize(40, 40).setDepth(8)
          : this.add.text(68, MID_Y + MID_H * 0.75, '🧺', { fontSize: '24px' }).setOrigin(0.5).setDepth(8);
        this._roomDecors.push(d);
      },
      // 3 blanket: soft purple overlay on bed
      () => {
        const bl = this.add.rectangle(this._bedCX, this._bedCY + 10, 210, 36, 0xCC88FF, 0.28).setDepth(9);
        this._roomDecors.push(bl);
        this.tweens.add({ targets: bl, alpha: 0.18, duration: 1800, yoyo: true, repeat: -1 });
      },
      // 4 lamp: warm glow circle persists
      () => {
        const gl = this.add.circle(380, MID_Y + MID_H * 0.38, 55, 0xFFDD88, 0.18).setDepth(7);
        this._roomDecors.push(gl);
        this.tweens.add({ targets: gl, alpha: 0.08, duration: 1600, yoyo: true, repeat: -1 });
      },
      // 5 nursery: stars & bear appear top-left
      () => {
        ['⭐','🧸','✨'].forEach((em, j) => {
          const d = this.add.text(28 + j * 28, MID_Y + MID_H * 0.18, em, { fontSize: '14px' }).setDepth(8).setAlpha(0);
          this.tweens.add({ targets: d, alpha: 1, duration: 500, delay: j * 150 });
          this._roomDecors.push(d);
        });
      },
    ];
    if (decors[taskIdx]) decors[taskIdx]();
  }

  _drawBar(pct) {
    this._progFill.clear();
    const fw = this._bW * (pct / 100);
    if (fw < 2) return;
    this._progFill.fillGradientStyle(0x7DD3F0, 0xA8E8FF, 0x58C0E8, 0x88D8F8, 1);
    this._progFill.fillRoundedRect(this._bX, this._bY, fw, this._bHH, 7);
  }

  _setProgress(pct) {
    this._progress = pct;
    const obj = { v: 0 };
    const start = this._lastPct || 0;
    this._lastPct = pct;
    this.tweens.add({ targets: obj, v: 1, duration: 700, ease: 'Sine.easeOut',
      onUpdate: (tw) => { this._drawBar(start + (pct - start) * tw.targets[0].v); }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ACTIVATE TASK
  // ═══════════════════════════════════════════════════════════════════════
  _activateTask(idx) {
    this._taskIdx = idx;
    this._clearI();
    this._updateJourney();

    const def = TASKS[idx];

    // ── Task name banner ──────────────────────────────────────────────
    const banner = this._io(this.add.graphics().setDepth(19));
    banner.fillStyle(0xFFFFFF, 0.92);
    banner.fillRoundedRect(L_W/2 - 130, MID_Y + 8, 260, 32, 16);
    banner.lineStyle(2.5, 0xF2A878, 0.9);
    banner.strokeRoundedRect(L_W/2 - 130, MID_Y + 8, 260, 32, 16);
    this._io(this.add.text(L_W/2, MID_Y + 24, `${def.emoji}  ${def.label}`,
      { fontSize: '13px', fontFamily: 'Georgia, serif', color: '#C05030', fontStyle: 'bold' })
      .setOrigin(0.5).setDepth(20));

    // Build per-task interaction
    this[`_buildTask_${def.id}`]();
  }

  // ── Interaction helpers ───────────────────────────────────────────────
  _io(o) { this._iObjs.push(o); return o; }

  _clearI() {
    this._iObjs.forEach(o => { try { this.tweens.killTweensOf(o); o.destroy(); } catch(_){} });
    this._iObjs = [];
  }

  _completeTask(idx, msg) {
    this._done[idx] = true;
    const pct = Math.round((this._done.filter(Boolean).length) / 6 * 60);
    this._setProgress(pct);
    this._sparkle(this._bedCX, this._bedCY - 20);
    this.cameras.main.flash(90, 91, 200, 91);
    this._float(msg, '#44AA44');

    // Add persistent room decoration
    this._addRoomDecor(idx);

    // Room gets warmer/brighter with each task
    const gv = Math.min(0.22, 0.03 * (idx + 1));
    this.tweens.add({ targets: this._roomGlow, alpha: gv, duration: 900 });

    // Floating hearts from Gamma
    this.time.delayedCall(300, () => {
      for (let h = 0; h < 3; h++) {
        const hx = this._bedCX + (Math.random() - 0.5) * 60;
        const ht = this.add.text(hx, this._bedCY - 20, ['💜','💛','💗'][h], { fontSize: '16px' }).setDepth(25).setAlpha(0);
        this.tweens.add({ targets: ht, y: ht.y - 45, alpha: { from: 0, to: 1 }, duration: 400, delay: h * 150,
          onComplete: () => this.tweens.add({ targets: ht, y: ht.y - 30, alpha: 0, duration: 500, onComplete: () => ht.destroy() }) });
      }
    });

    this.time.delayedCall(1400, () => {
      this._clearI();
      if (idx < 5) this._activateTask(idx + 1);
      else this._startPuppyPhase();
    });
  }

  // ── Floating message / sparkle ────────────────────────────────────────
  _float(msg, color) {
    const t = this.add.text(L_W/2, H/2, msg,
      { fontSize: '16px', fontFamily: 'Georgia, serif', color, stroke: '#fff', strokeThickness: 3 })
      .setOrigin(0.5).setDepth(65);
    this.tweens.add({ targets: t, y: H/2 - 55, alpha: 0, duration: 1100, onComplete: () => t.destroy() });
  }

  _sparkle(x, y) {
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2, d = 14 + Math.random() * 26;
      const s = this.add.text(x, y, ['✨','⭐','💛','🌟'][Math.floor(Math.random()*4)], { fontSize: '13px' }).setDepth(60);
      this.tweens.add({ targets: s, x: x + Math.cos(a)*d, y: y + Math.sin(a)*d, alpha: 0, duration: 750, onComplete: () => s.destroy() });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TASK 1 — Heart Check: drag stethoscope to Gamma's chest
  // ═══════════════════════════════════════════════════════════════════════
  _buildTask_heart() {
    const cx = this._bedCX + 44, cy = this._bedCY - 16; // chest zone
    let stabilized = 0; // 0-100 stabilization progress

    // Instruction
    this._io(this.add.text(240, BOT_Y - 20,
      '👆 Gently rub the chest to stabilize heartbeat',
      { fontSize: '11px', fontFamily: 'Georgia, serif', color: '#AA4488', fontStyle: 'bold' }).setOrigin(0.5).setDepth(20));

    // ═══ HEART MONITOR DISPLAY (compact) ═══
    const monitorX = 220, monitorY = MID_Y + 90;
    const monitor = this._io(this.add.graphics().setDepth(10));

    // Monitor frame (rounded rectangle, smaller)
    monitor.fillStyle(0xFFE8F0, 1);
    monitor.fillRoundedRect(monitorX - 70, monitorY - 60, 140, 120, 12);
    monitor.lineStyle(3, 0xFF88AA, 1);
    monitor.strokeRoundedRect(monitorX - 70, monitorY - 60, 140, 120, 12);

    // Heart icon in center
    const heartIcon = this._io(this.add.text(monitorX - 28, monitorY - 20, '❤️', { fontSize: '32px' }).setOrigin(0.5).setDepth(11));

    // "Stabilizing..." text
    const stabText = this._io(this.add.text(monitorX + 15, monitorY - 25, 'Stabilizing...',
      { fontSize: '9px', fontFamily: 'Georgia, serif', color: '#DD4466', fontStyle: 'bold' })
      .setOrigin(0.5).setDepth(11));

    // Percentage display
    const percText = this._io(this.add.text(monitorX + 22, monitorY - 5, '0%',
      { fontSize: '18px', fontFamily: 'Arial', color: '#FF6688', fontStyle: 'bold' })
      .setOrigin(0.5).setDepth(11));

    // EKG waveform
    const ekg = this._io(this.add.graphics().setDepth(11));
    const drawEKG = (progress) => {
      ekg.clear();
      ekg.lineStyle(2.5, progress >= 100 ? 0x44DD88 : 0xFF88AA, 1);
      ekg.beginPath();
      ekg.moveTo(monitorX - 52, monitorY + 25);
      const wave = Math.sin((progress / 100) * Math.PI * 2) * 12;
      ekg.lineTo(monitorX - 28, monitorY + 25 + wave);
      ekg.lineTo(monitorX - 4, monitorY + 25);
      ekg.lineTo(monitorX + 20, monitorY + 25 - (wave * 0.5));
      ekg.lineTo(monitorX + 52, monitorY + 25);
      ekg.strokePath();
    };
    drawEKG(0);

    // Pulsing heart icon
    this.tweens.add({
      targets: heartIcon,
      scaleX: { from: 1, to: 1.2 },
      scaleY: { from: 1, to: 1.2 },
      duration: 600,
      repeat: -1,
      yoyo: true
    });

    // Stethoscope image (left side for reference)
    const sx = 120, sy = MID_Y + MID_H * 0.62;
    let stet;
    if (this.textures.exists('stethoscope')) {
      stet = this._io(this.add.image(sx, sy, 'stethoscope').setDisplaySize(90, 90).setDepth(15));
    } else {
      stet = this._io(this.add.text(sx, sy, '🩺', { fontSize: '56px' }).setOrigin(0.5).setDepth(15));
    }

    // Chest interactive tap/rub zone
    let isRubbing = false;
    const chestHit = this._io(this.add.rectangle(cx, cy, 100, 100, 0, 0).setDepth(12).setInteractive({ useHandCursor: true }));

    chestHit.on('pointerdown', () => {
      if (stabilized >= 100) return;
      isRubbing = true;
      // Glow effect when rubbing
      const glow = this.add.circle(cx, cy, 50, 0xFF88AA, 0.25).setDepth(9);
      this.tweens.add({ targets: glow, scaleX: 1.6, scaleY: 1.6, alpha: 0, duration: 500, onComplete: () => glow.destroy() });
    });

    chestHit.on('pointerup', () => { isRubbing = false; });
    chestHit.on('pointerout', () => { isRubbing = false; });

    // Stabilization progress loop
    const startStabilization = () => {
      if (this._progressInterval) return;
      this._progressInterval = setInterval(() => {
        if (isRubbing && stabilized < 100) {
          stabilized += 3.3; // 3% per ~100ms = 100% in ~3 seconds
          if (stabilized > 100) stabilized = 100;

          percText.setText(`${Math.round(stabilized)}%`);
          drawEKG(stabilized);

          // When fully stabilized
          if (stabilized >= 100) {
            clearInterval(this._progressInterval);
            this._progressInterval = null;
            stabText.setText('Stabilized!').setColor('#44DD88');
            percText.setColor('#44DD88').setText('100%');
            heartIcon.setText('💚');
            chestHit.disableInteractive();
            this.cameras.main.flash(100, 91, 220, 91);
            this.time.delayedCall(800, () => this._completeTask(0, '❤️ Gamma feels calm!'));
          }
        }
      }, 100);
    };

    // Start stabilization on first tap
    chestHit.on('pointerdown', () => {
      if (stabilized === 0) {
        startStabilization();
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TASK 2 — Fresh Water: tap faucet + drag dial to warm zone
  // ═══════════════════════════════════════════════════════════════════════
  _buildTask_water() {
    let step = 0;
    const bwx = 58, bwy = BOT_Y - 20; // water bowl position

    const instr = this._io(this.add.text(L_W / 2, BOT_Y - 20,
      'TAP the faucet 🚿 to start!',
      { fontSize: '11px', fontFamily: 'Georgia, serif', color: '#4488AA', fontStyle: 'bold' }).setOrigin(0.5).setDepth(20));

    // Faucet (large, left-center area)
    const fx = 160, fy = MID_Y + MID_H * 0.42;
    const faucetG = this._io(this.add.graphics().setDepth(14));
    const drawFaucet = (on) => {
      faucetG.clear();
      faucetG.fillStyle(on ? 0x1A9ACC : 0x3A5A8A, 1); faucetG.fillCircle(fx, fy, 38);
      faucetG.lineStyle(4, on ? 0x55DDFF : 0x5A8AB8, 1); faucetG.strokeCircle(fx, fy, 38);
      faucetG.fillStyle(on ? 0x55BBEE : 0x2A4A7A, 1); faucetG.fillCircle(fx, fy, 20);
    };
    drawFaucet(false);
    // Faucet icon (tap handle, NOT the bowl image)
    this._io(this.add.text(fx, fy, '🚿', { fontSize: '38px' }).setOrigin(0.5).setDepth(15));
    this._io(this.add.text(fx, fy + 50, 'TAP ME!',
      { fontSize: '10px', fontFamily: 'Arial', color: '#3A8AB8', fontStyle: 'bold' }).setOrigin(0.5).setDepth(14));

    // Water bowl image shown at the BOWL position — PERSISTENT (not in _io)
    let bowl;
    if (this.textures.exists('water_bowl')) {
      bowl = this.add.image(bwx, bwy, 'water_bowl').setDisplaySize(90, 80).setDepth(14);
    } else {
      const bowlG = this.add.graphics().setDepth(14);
      bowlG.fillStyle(0xAADDF8, 1); bowlG.fillEllipse(bwx, bwy, 70, 32);
      bowlG.lineStyle(2.5, 0x44AACC, 1); bowlG.strokeEllipse(bwx, bwy, 70, 32);
      this.add.text(bwx, bwy, '💧', { fontSize: '22px' }).setOrigin(0.5).setDepth(15);
      bowl = bowlG;
    }

    const fHit = this._io(this.add.rectangle(fx, fy, 76, 76, 0, 0).setDepth(16).setInteractive({ useHandCursor: true }));
    fHit.once('pointerdown', () => {
      if (step > 0) return;
      step = 1;
      drawFaucet(true);
      // Water drops
      for (let i = 0; i < 7; i++) this.time.delayedCall(i * 110, () => {
        const d = this.add.text(fx + (Math.random()-0.5)*14, fy + 38, '💧', { fontSize: '14px' }).setDepth(17).setAlpha(0.9);
        this.tweens.add({ targets: d, x: bwx + (Math.random()-0.5)*16, y: bwy - 8, alpha: 0.5, duration: 550, ease: 'Sine.easeIn', onComplete: () => d.destroy() });
      });
      instr.setText('NOW: PRESS & HOLD the 🔥 button for 5 sec!').setStyle({ color: '#D06020', fontStyle: 'bold' });
      // Show heat button
      heatBtn.setVisible(true);
      heatLabel.setVisible(true);
      heatProgress.setVisible(true);
    });

    // ── Heat button (center-bottom, press & hold for 5 seconds)
    const HBX = L_W/2, HBY = MID_Y + MID_H * 0.72;
    const heatBtn = this._io(this.add.rectangle(HBX, HBY, 120, 60, 0xFF6B35, 0.8).setDepth(20).setInteractive({ useHandCursor: true }).setVisible(false));
    heatBtn.setStrokeStyle(3, 0xFF4500, 1);

    const heatLabel = this._io(this.add.text(HBX, HBY, '🔥 HEAT', { fontSize: '14px', fontFamily: 'Arial', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(21).setVisible(false));

    // Progress ring for 5-second hold
    const heatProgress = this._io(this.add.graphics().setDepth(19).setVisible(false));
    let holdTime = 0;
    let isHolding = false;

    heatBtn.on('pointerup', () => {
      if (isHolding) {
        isHolding = false;
        progressTween.stop();
        heatBtn.setFillStyle(0xFF6B35, 0.8);
        heatProgress.clear();
        heatLabel.setText('🔥 HEAT');
      }
    });

    heatBtn.on('pointerout', () => {
      if (isHolding) {
        isHolding = false;
        progressTween.stop();
        heatBtn.setFillStyle(0xFF6B35, 0.8);
        heatProgress.clear();
        heatLabel.setText('🔥 HEAT');
      }
    });

    // Update loop for hold duration (controlled, non-looping)
    const progressTween = this.tweens.add({
      targets: { holdTime: 0 },
      holdTime: 5000,
      duration: 5000,
      paused: true,
      onUpdate: (tween) => {
        if (!isHolding) return;
        holdTime = Math.round(tween.targets[0].holdTime);
        const progress = holdTime / 5000;

        // Draw progress arc
        heatProgress.clear();
        heatProgress.lineStyle(4, 0xFFDD44, 1);
        heatProgress.beginPath();
        heatProgress.arc(HBX, HBY, 68, -Math.PI/2, -Math.PI/2 + progress * Math.PI * 2);
        heatProgress.strokePath();

        // Update label with progress percent
        heatLabel.setText(`${Math.round(progress * 100)}%`);
      }
    });

    // Custom hold tracking
    heatBtn.on('pointerdown', () => {
      if (step !== 1) return;
      isHolding = true;
      holdTime = 0;
      progressTween.restart();
      heatBtn.setFillStyle(0xFF8B3D, 1);

      // After 5 seconds, complete
      const completeTimer = this.time.delayedCall(5000, () => {
        if (isHolding && step === 1) {
          isHolding = false;
          step = 2;
          heatBtn.disableInteractive();
          heatLabel.setText('🔥 HOT!').setStyle({ color: '#FFDD44' });
          heatProgress.clear();
          progressTween.stop();

          // Steam over bowl
          for (let i = 0; i < 8; i++) this.time.delayedCall(i*90, () => {
            const st = this.add.text(bwx + (Math.random()-0.5)*18, bwy - 10, '💨', { fontSize: '13px' }).setDepth(18).setAlpha(0.8);
            this.tweens.add({ targets: st, y: st.y - 30, alpha: 0, duration: 620, onComplete: () => st.destroy() });
          });
          instr.setText('✅ Perfect warm water!').setStyle({ color: '#228844' });
          this.time.delayedCall(800, () => this._completeTask(1, '💧 Warm water is ready!'));
        }
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TASK 3 — Soft Towel: drag 3 towels to basket to dry Gamma
  // ═══════════════════════════════════════════════════════════════════════
  _buildTask_towels() {
    let placed = 0;

    this._io(this.add.text(240, BOT_Y - 20,
      'Rub the towel on Gamma 3 times to dry! 🧺',
      { fontSize: '11px', fontFamily: 'Georgia, serif', color: '#AA6622', fontStyle: 'bold' }).setOrigin(0.5).setDepth(20));

    // Wet shine on Gamma
    const wetG = this._io(this.add.graphics().setDepth(7));
    const drawWet = (n) => {
      wetG.clear();
      if (n === 0) { wetG.fillStyle(0x2266CC, 0.3); wetG.fillCircle(this._bedCX, this._bedCY, 70); }
      else if (n === 1) { wetG.fillStyle(0x2266CC, 0.15); wetG.fillCircle(this._bedCX, this._bedCY, 55); }
      else if (n === 2) { wetG.fillStyle(0x2266CC, 0.06); wetG.fillCircle(this._bedCX, this._bedCY, 40); }
    };
    drawWet(0);
    const gammaLbl = this._io(this.add.text(this._bedCX, this._bedCY - 90, 'SOAKING WET!',
      { fontSize: '10px', fontFamily: 'Georgia, serif', color: '#2266CC', fontStyle: 'bold' }).setOrigin(0.5).setDepth(8));

    // Dog is the drop zone - rub towels ON Gamma
    const dogDropX = this._bedCX, dogDropY = this._bedCY;
    const ctr = this._io(this.add.text(dogDropX + 60, dogDropY + 80, '0 / 3', { fontSize: '10px', fontFamily: 'Georgia, serif', color: '#AA6622', fontStyle: 'bold' }).setOrigin(0.5).setDepth(14));

    // Single towel that can be rubbed 3 times
    const tx = 120, ty = MID_Y + MID_H * 0.55;
    let towel;
    if (this.textures.exists('towels')) {
      towel = this._io(
        this.add.image(tx, ty, 'towels').setDisplaySize(88, 88).setDepth(15)
          .setInteractive({ draggable: true, useHandCursor: true })
      );
    } else {
      towel = this._io(
        this.add.text(tx, ty, '🧺', { fontSize: '48px' }).setOrigin(0.5).setDepth(15)
          .setInteractive({ draggable: true, useHandCursor: true })
      );
    }
    this.input.setDraggable(towel);
    towel.on('drag', (_, x, y) => { towel.x = x; towel.y = y; });
    towel.on('dragend', () => {
      // Check if towel is dragged near dog (rubbing motion)
      if (Phaser.Math.Distance.Between(towel.x, towel.y, dogDropX, dogDropY) < 100) {
        placed++; // Another rub!
        // Towel snap back to start position for next rub
        this.tweens.add({ targets: towel, x: tx, y: ty, duration: 150 });
        drawWet(placed);
        // Dog shivers/shakes from drying
        this.tweens.add({ targets: this._gamma, x: this._gamma.x + 8, duration: 100, yoyo: true, repeat: 2 });
        this._sparkle(dogDropX, dogDropY);
        ctr.setText(`${placed} / 3`);
        if (placed === 1) gammaLbl.setText('Getting drier! 💧').setStyle({ color: '#4488AA' });
        else if (placed === 2) gammaLbl.setText('Almost dry! 🌟').setStyle({ color: '#44AA66' });
        else if (placed === 3) {
          ctr.setStyle({ color: '#44AA44' });
          gammaLbl.setText('SQUEAKY CLEAN! ✨').setStyle({ color: '#228844' });
          towel.disableInteractive();
          this.time.delayedCall(500, () => this._completeTask(2, '🧺 Gamma is dry & happy!'));
        }
      } else {
        this.tweens.add({ targets: towel, x: tx, y: ty, duration: 260, ease: 'Back.easeOut' });
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TASK 4 — Cozy Blanket: drag blanket onto bed
  // ═══════════════════════════════════════════════════════════════════════
  _buildTask_blanket() {
    this._io(this.add.text(240, BOT_Y - 20,
      'Drag the blanket onto Gamma\'s bed 🧣',
      { fontSize: '11px', fontFamily: 'Georgia, serif', color: '#8844AA', fontStyle: 'bold' }).setOrigin(0.5).setDepth(20));

    // Bed drop zone (visible outline)
    const bdx = this._bedCX, bdy = this._bedCY + 10;
    const bedZone = this._io(this.add.graphics().setDepth(7));
    bedZone.lineStyle(2.5, 0xCC88FF, 0.7); bedZone.fillStyle(0xEECCFF, 0.2);
    bedZone.fillRoundedRect(bdx - 110, bdy - 28, 220, 52, 10);
    bedZone.strokeRoundedRect(bdx - 110, bdy - 28, 220, 52, 10);
    const bdLbl = this._io(this.add.text(bdx, bdy + 36, 'drop on bed', { fontSize: '8px', fontFamily: 'Georgia, serif', color: '#CC88FF' }).setOrigin(0.5).setDepth(8));

    // Big blanket
    const blx = 300, bly = MID_Y + MID_H * 0.66;
    let bl;
    if (this.textures.exists('blanket')) {
      bl = this._io(
        this.add.image(blx, bly, 'blanket').setDisplaySize(100, 94).setDepth(15)
          .setInteractive({ draggable: true, useHandCursor: true })
      );
    } else {
      bl = this._io(
        this.add.text(blx, bly, '🧣', { fontSize: '62px' }).setOrigin(0.5).setDepth(15)
          .setInteractive({ draggable: true, useHandCursor: true })
      );
    }
    this.input.setDraggable(bl);
    bl.on('drag', (_, x, y) => { bl.x = x; bl.y = y; });
    bl.on('dragend', () => {
      if (Phaser.Math.Distance.Between(bl.x, bl.y, bdx, bdy) < 68) {
        bl.disableInteractive();
        // Slide blanket onto bed — NO zoom/squish
      this.tweens.add({ targets: bl, x: bdx, y: bdy - 4, duration: 220, ease: 'Sine.easeOut',
        onComplete: () => {
          // Fade blanket out smoothly
          this.tweens.add({ targets: bl, alpha: 0, duration: 200 });
          // Magic star burst around the bed
          for (let s = 0; s < 10; s++) {
            const angle = (s / 10) * Math.PI * 2;
            const star = this.add.text(
              bdx + Math.cos(angle) * 36, bdy + Math.sin(angle) * 22,
              ['✨','💜','⭐','💫'][s % 4], { fontSize: '14px' }
            ).setOrigin(0.5).setDepth(28);
            this.tweens.add({ targets: star,
              x: star.x + Math.cos(angle) * 52, y: star.y + Math.sin(angle) * 36,
              alpha: 0, scaleX: 0.2, scaleY: 0.2, duration: 580, delay: s * 38,
              ease: 'Sine.easeOut', onComplete: () => star.destroy() });
          }
          // Cross-fade Gamma → blanket version
          if (this.textures.exists('gemma_lying_blanket') && this._gamma) {
            this.tweens.add({ targets: this._gamma, alpha: 0, duration: 150,
              onComplete: () => {
                this._gamma.setTexture('gemma_lying_blanket').setDisplaySize(320, 160);
                this.tweens.add({ targets: this._gamma, alpha: 1, duration: 280 });
              }
            });
          }
          bdLbl.setText('💜 So cozy!').setStyle({ color: '#AA44FF' });
          bedZone.clear();
          this.cameras.main.flash(60, 180, 100, 255);
          this.time.delayedCall(700, () => this._completeTask(3, '🧣 So warm and cozy!'));
        }
      });
      } else {
        this.tweens.add({ targets: bl, x: blx, y: bly, duration: 260, ease: 'Back.easeOut' });
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TASK 5 — Gentle Heat: tap the lamp switch
  // ═══════════════════════════════════════════════════════════════════════
  _buildTask_lamp() {
    this._io(this.add.text(L_W / 2, BOT_Y - 20,
      'Tap the lamp to switch it on! 💡',
      { fontSize: '11px', fontFamily: 'Georgia, serif', color: '#AA8820', fontStyle: 'bold' }).setOrigin(0.5).setDepth(20));

    const lx = 95, ly = 235;

    // Small wooden surface for the lamp to sit on (left side of the bed)
    const tableG = this._io(this.add.graphics().setDepth(11));
    tableG.fillStyle(0x000000, 0.08); tableG.fillEllipse(lx + 3, ly + 56, 78, 16);
    tableG.fillStyle(0xB07F50, 1); tableG.fillRect(lx - 30, ly + 50, 60, 14);
    tableG.fillStyle(0xC89464, 1); tableG.fillRoundedRect(lx - 38, ly + 38, 76, 16, 4);
    tableG.lineStyle(1, 0x90623A, 0.6); tableG.strokeRoundedRect(lx - 38, ly + 38, 76, 16, 4);

    // Warm radial glow behind lamp (hidden until ON)
    const bgGlow = this._io(this.add.graphics().setDepth(6));
    bgGlow.fillStyle(0xFFEE88, 0); bgGlow.fillCircle(lx, ly, 85);

    // Floor mirror reflection (ellipse below lamp)
    const mirrorG = this._io(this.add.graphics().setDepth(7));
    mirrorG.fillStyle(0xFFEEAA, 0); mirrorG.fillEllipse(lx, ly + 77, 100, 25);

    // Warm cone of light (hidden until ON)
    const coneG = this._io(this.add.graphics().setDepth(6));

    // Lamp image — INTERACTIVE, click to turn on
    let lamp;
    if (this.textures.exists('heat_lamp_img')) {
      lamp = this._io(this.add.image(lx, ly, 'heat_lamp_img')
        .setDisplaySize(90, 108).setDepth(13)
        .setInteractive({ useHandCursor: true }));
    } else {
      lamp = this._io(this.add.text(lx, ly, '💡', { fontSize: '60px' })
        .setOrigin(0.5).setDepth(13).setInteractive({ useHandCursor: true }));
    }

    // Hover hint: lamp gently pulses
    lamp.on('pointerover', () => this.tweens.add({ targets: lamp, alpha: 0.75, duration: 180 }));
    lamp.on('pointerout',  () => this.tweens.add({ targets: lamp, alpha: 1,    duration: 180 }));

    lamp.once('pointerdown', () => {
      lamp.disableInteractive();
      lamp.clearTint();

      // Draw warm light cone downward from lamp
      coneG.fillStyle(0xFFEE88, 0.18);
      coneG.fillTriangle(lx - 14, ly + 46, lx + 14, ly + 46, lx + 62, ly + 92, lx - 62, ly + 92);

      // Animate bgGlow in
      this.tweens.add({ targets: bgGlow, alpha: 0.22, duration: 600, yoyo: true, repeat: -1 });

      // Mirror floor reflection fades in
      mirrorG.clear();
      mirrorG.fillStyle(0xFFEEAA, 0.28); mirrorG.fillEllipse(lx, ly + 86, 108, 26);
      mirrorG.lineStyle(1, 0xFFDD66, 0.4); mirrorG.strokeEllipse(lx, ly + 86, 108, 26);

      // Lamp bounces once
      this.tweens.add({ targets: lamp, y: ly - 6, duration: 120, yoyo: true, ease: 'Sine.easeOut' });

      // Small sparkles
      for (let s = 0; s < 6; s++) {
        const ang = (s / 6) * Math.PI * 2;
        const sp = this.add.text(lx + Math.cos(ang) * 42, ly + Math.sin(ang) * 42, '✨',
          { fontSize: '13px' }).setOrigin(0.5).setDepth(25);
        this.tweens.add({ targets: sp, alpha: 0, scaleX: 0.3, scaleY: 0.3, duration: 500, delay: s * 60,
          onComplete: () => sp.destroy() });
      }

      this.cameras.main.flash(80, 255, 220, 80);
      this.time.delayedCall(700, () => this._completeTask(4, '💡 Warm light for tiny paws!'));
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════
  // TASK 6 — Nursery Setup: place 3 items into a wall display frame
  // ═══════════════════════════════════════════════════════════════════════
  _buildTask_nursery() {
    let placed = 0;

    this._io(this.add.text(L_W / 2, BOT_Y - 20,
      'Drag each item into its spot in the nursery frame! 🧸',
      { fontSize: '11px', fontFamily: 'Georgia, serif', color: '#AA4488', fontStyle: 'bold' }).setOrigin(0.5).setDepth(20));

    // ── WALL FRAME ───────────────────────────────────────────────────────
    const fx = L_W / 2 - 10;          // center of left area
    const fy = MID_Y + MID_H * 0.53;  // vertical center
    const fw = 400, fh = 175;

    // Drop shadow
    const frG = this._io(this.add.graphics().setDepth(12));
    frG.fillStyle(0xAA8060, 0.18);
    frG.fillRoundedRect(fx - fw / 2 + 5, fy - fh / 2 + 6, fw, fh, 16);

    // Outer frame (warm wood)
    frG.fillStyle(0xD4A060, 1);
    frG.fillRoundedRect(fx - fw / 2, fy - fh / 2, fw, fh, 16);
    frG.lineStyle(3, 0xB87830, 1);
    frG.strokeRoundedRect(fx - fw / 2, fy - fh / 2, fw, fh, 16);

    // Inner border ring
    frG.lineStyle(2, 0xF0C870, 0.7);
    frG.strokeRoundedRect(fx - fw / 2 + 7, fy - fh / 2 + 7, fw - 14, fh - 14, 11);

    // Interior creamy background
    frG.fillStyle(0xFFF8F2, 1);
    frG.fillRoundedRect(fx - fw / 2 + 12, fy - fh / 2 + 12, fw - 24, fh - 24, 9);

    // Small corner rosettes (decorative dots)
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
      frG.fillStyle(0xC88838, 1);
      frG.fillCircle(fx + sx * (fw / 2 - 8), fy + sy * (fh / 2 - 8), 5);
    });

    // Frame title banner
    frG.fillStyle(0xF5C048, 1);
    frG.fillRoundedRect(fx - 72, fy - fh / 2 + 12, 144, 22, 6);
    this._io(this.add.text(fx, fy - fh / 2 + 23, '✦  Nursery Corner  ✦',
      { fontSize: '9px', fontFamily: 'Georgia, serif', color: '#7A4A10', fontStyle: 'bold italic' })
      .setOrigin(0.5).setDepth(14));

    // ── 3 DISPLAY SLOTS inside the frame ─────────────────────────────────
    const slotY = fy + 14;
    const slotXs = [fx - 126, fx, fx + 126];
    const slotLabels = ['Teddy 🧸', 'Bottle 🍼', 'Star ⭐'];
    const slots = slotXs.map((sx, si) => {
      // Dashed circle slot hint
      const sG = this._io(this.add.graphics().setDepth(13));
      sG.fillStyle(0xF0E4D0, 0.85);
      sG.fillCircle(sx, slotY, 38);
      sG.lineStyle(2.5, 0xD4B080, 0.9);
      sG.strokeCircle(sx, slotY, 38);
      // Slot label underneath
      this._io(this.add.text(sx, slotY + 50, slotLabels[si],
        { fontSize: '8px', fontFamily: 'Georgia, serif', color: '#C09060' }).setOrigin(0.5).setDepth(13));
      // Question mark hint
      const qm = this._io(this.add.text(sx, slotY, '?',
        { fontSize: '26px', color: '#D4A870', fontStyle: 'bold' }).setOrigin(0.5).setDepth(14));
      return { x: sx, y: slotY, occupied: false, slotG: sG, hint: qm };
    });

    // Counter below frame
    const ctr = this._io(this.add.text(fx, fy + fh / 2 - 10, '0 / 3 placed',
      { fontSize: '9px', fontFamily: 'Georgia, serif', color: '#A08050', fontStyle: 'bold' })
      .setOrigin(0.5).setDepth(14));

    // ── DRAGGABLE ITEMS (scattered around frame, clear of slots) ────────
    [
      { e: '🧸', x: 52,  y: MID_Y + MID_H * 0.28 },
      { e: '🍼', x: 500, y: MID_Y + MID_H * 0.35 },
      { e: '⭐', x: 55,  y: MID_Y + MID_H * 0.76 },
    ].forEach(({ e, x, y }, ii) => {
      // Item background bubble
      const bubG = this._io(this.add.graphics().setDepth(14));
      bubG.fillStyle(0xFFEEDD, 0.92);
      bubG.fillCircle(x, y, 30);
      bubG.lineStyle(2, 0xFFCC88, 1);
      bubG.strokeCircle(x, y, 30);

      const item = this._io(
        this.add.text(x, y, e, { fontSize: '38px' }).setOrigin(0.5).setDepth(15)
          .setInteractive({ draggable: true, useHandCursor: true })
      );
      item._sx = x; item._sy = y;
      this.input.setDraggable(item);

      item.on('drag', (_, dx, dy) => {
        item.x = dx; item.y = dy;
        bubG.clear();
        bubG.fillStyle(0xFFEEDD, 0.7);
        bubG.fillCircle(dx, dy, 30);
      });

      item.on('dragend', () => {
        if (item._used) return;
        // Find nearest unoccupied slot within range
        let best = null, bestD = 9999;
        slots.forEach(s => {
          if (!s.occupied) {
            const d = Phaser.Math.Distance.Between(item.x, item.y, s.x, s.y);
            if (d < bestD) { bestD = d; best = s; }
          }
        });
        if (best && bestD < 72) {
          best.occupied = true;
          item._used = true;
          item.disableInteractive();
          placed++;
          // Hide bubble and hint
          bubG.clear();
          best.hint.setAlpha(0);
          // Redraw slot as filled (golden ring)
          best.slotG.clear();
          best.slotG.fillStyle(0xFFF4E0, 1);
          best.slotG.fillCircle(best.x, best.y, 38);
          best.slotG.lineStyle(3, 0xF5C042, 1);
          best.slotG.strokeCircle(best.x, best.y, 38);
          // Snap item into slot
          this.tweens.add({ targets: item, x: best.x, y: best.y, scaleX: 1.1, scaleY: 1.1,
            duration: 220, ease: 'Back.easeOut',
            onComplete: () => this.tweens.add({ targets: item, scaleX: 1, scaleY: 1, duration: 100 }) });
          this._sparkle(best.x, best.y);
          ctr.setText(`${placed} / 3 placed`);
          if (placed === 3) {
            ctr.setText('✨ Nursery ready!').setStyle({ color: '#44AA44', fontSize: '10px' });
            this.cameras.main.flash(90, 255, 220, 100);
            this.time.delayedCall(600, () => this._completeTask(5, '🧸 The nursery is perfect!'));
          }
        } else {
          // Snap back
          this.tweens.add({ targets: item, x: item._sx, y: item._sy, duration: 260, ease: 'Back.easeOut' });
          bubG.clear();
          bubG.fillStyle(0xFFEEDD, 0.92);
          bubG.fillCircle(item._sx, item._sy, 30);
          bubG.lineStyle(2, 0xFFCC88, 1);
          bubG.strokeCircle(item._sx, item._sy, 30);
        }
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TRANSITION → PUPPY PHASE
  // ═══════════════════════════════════════════════════════════════════════
  _startPuppyPhase() {
    this._clearI();
    this._phase = 'puppies';
    this._phaseLbl.setText('Puppy Arrival Phase 🐶');
    this._progEndLbl.setText('100%');


    // Warm golden flash
    this.cameras.main.flash(400, 255, 230, 120);

    // Transition overlay + message
    const ov = this.add.rectangle(W/2, H/2, W, H, 0xFFEECC, 0).setDepth(55);
    this.tweens.add({ targets: ov, alpha: 0.8, duration: 800, yoyo: true,
      onYoyo: () => {
        this._buildSevenBaskets();
        this._buildCardOverlay();
        ov.destroy();
        this.time.delayedCall(700, () => this._spawnPuppy(0));
      }
    });

    const msg = this.add.text(W/2, H/2, '✨ Everything is ready!\nThe puppies are arriving!',
      { fontSize: '19px', fontFamily: 'Georgia, serif', color: '#C04080', align: 'center',
        stroke: '#fff', strokeThickness: 3 })
      .setOrigin(0.5).setDepth(56).setAlpha(0);
    this.tweens.add({ targets: msg, alpha: 1, duration: 500, yoyo: true, hold: 1300, onComplete: () => msg.destroy() });
  }

  // 7 mini-cards at top of scene showing task progress with images
  _buildCardOverlay() {
    const CW = 66, CH = 54, cy = MID_Y + 6;
    TASKS.forEach((def, i) => {
      const cx = 8 + i * (CW + 4) + CW/2;
      const card = this.add.graphics().setDepth(18);
      card.fillStyle(C.WHITE, 0.95); card.fillRoundedRect(cx - CW/2, cy, CW, CH, 8);
      card.lineStyle(1.5, this._done[i] ? C.GREEN : C.GREY, 1);
      card.strokeRoundedRect(cx - CW/2, cy, CW, CH, 8);

      // Badge
      const badge = this.add.graphics().setDepth(19);
      badge.fillStyle(this._done[i] ? C.GREEN : C.GOLD, 1); badge.fillCircle(cx - CW/2 + 11, cy + 11, 9);
      this.add.text(cx - CW/2 + 11, cy + 11, this._done[i] ? '✓' : `${i+1}`, { fontSize: '8px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(20);

      // Prop image or emoji
      const propKey = this._propTextures[def.id];
      if (propKey && this.textures.exists(propKey)) {
        this.add.image(cx, cy + 26, propKey).setDisplaySize(24, 24).setDepth(19).setAlpha(this._done[i] ? 1 : 0.8);
      } else {
        this.add.text(cx, cy + 26, def.emoji, { fontSize: '18px' }).setOrigin(0.5).setDepth(19).setAlpha(this._done[i] ? 1 : 0.8);
      }

      // Label
      this.add.text(cx, cy + 46, def.label, { fontSize: '6px', fontFamily: 'Georgia, serif', color: '#8A6050', align: 'center', wordWrap: { width: CW - 4 } }).setOrigin(0.5, 1).setDepth(19);
    });
  }

  // ── 7 individual small baskets — open floor area to the right of the bed ──
  _buildSevenBaskets() {
    const bW = 56, bH = 46;
    const colL = 410, colR = 495;
    const rowYs = [252, 293, 334, 375];
    const positions = [
      { x: colL, y: rowYs[0] }, { x: colR, y: rowYs[0] },
      { x: colL, y: rowYs[1] }, { x: colR, y: rowYs[1] },
      { x: colL, y: rowYs[2] }, { x: colR, y: rowYs[2] },
      { x: (colL + colR) / 2, y: rowYs[3] },
    ];
    this._finalBktX = (colL + colR) / 2;
    this._finalBktY = rowYs[1];

    this._baskets = positions.map((pos) => {
      // Empty-basket glow ring
      const ringG = this.add.graphics().setDepth(13);
      ringG.lineStyle(2, 0xFFCC88, 0.55);
      ringG.strokeEllipse(pos.x, pos.y + 14, bW, 18);

      // Basket image
      let img;
      if (this.textures.exists('basket')) {
        img = this.add.image(pos.x, pos.y, 'basket').setDisplaySize(bW, bH).setDepth(14);
      } else {
        img = this.add.text(pos.x, pos.y, '🪹', { fontSize: '30px' }).setOrigin(0.5).setDepth(14);
      }

      return { x: pos.x, y: pos.y, occupied: false, img, ringG };
    });

    this._bktLbl = this.add.text((colL + colR) / 2, rowYs[3] + 23,
      '0 / 7 puppies placed',
      { fontSize: '10px', fontFamily: 'Georgia, serif', color: '#8A6030', fontStyle: 'bold' })
      .setOrigin(0.5).setDepth(16);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PUPPY ARRIVALS — drag each puppy to any empty basket
  // ═══════════════════════════════════════════════════════════════════════
  _spawnPuppy(idx) {
    if (idx >= 7) { this._finalCelebration(); return; }

    // Spawn puppy near Gamma — user drags it to a basket
    const sx = this._bedCX - 30, sy = this._bedCY + 20;
    const targetSize = 46;
    let puppy, tsX = 1, tsY = 1;
    if (this.textures.exists('puppy')) {
      puppy = this.add.image(sx, sy, 'puppy').setDepth(22)
        .setInteractive({ draggable: true, useHandCursor: true });
      tsX = targetSize / puppy.width;
      tsY = targetSize / puppy.height;
    } else {
      puppy = this.add.text(sx, sy, '🐶', { fontSize: '40px' })
        .setOrigin(0.5).setDepth(22)
        .setInteractive({ draggable: true, useHandCursor: true });
    }
    puppy.setScale(0);
    this.input.setDraggable(puppy);
    this.tweens.add({ targets: puppy, scaleX: tsX, scaleY: tsY, duration: 400, ease: 'Back.easeOut' });
    // Gentle bounce while waiting
    const bounce = this.tweens.add({ targets: puppy, y: sy - 7, duration: 500, yoyo: true, repeat: -1, delay: 450 });

    // Hint label
    const hint = this.add.text(L_W / 2 - 20, MID_Y + 26,
      `Puppy ${idx + 1} of 7 — drag to a basket! 🐾`,
      { fontSize: '10px', fontFamily: 'Georgia, serif', color: '#C04080',
        backgroundColor: '#FFF0F8', padding: { x: 7, y: 4 } })
      .setOrigin(0.5).setDepth(26).setAlpha(0);
    this.tweens.add({ targets: hint, alpha: 1, duration: 300 });

    puppy.on('dragstart', () => { this.children.bringToTop(puppy); bounce.stop(); puppy.y = sy; });
    puppy.on('drag', (pointer) => { puppy.x = pointer.x; puppy.y = pointer.y; });

    puppy.on('dragend', () => {
      // Find nearest unoccupied basket in drop range
      let best = null, bestD = 9999;
      this._baskets.forEach(b => {
        if (!b.occupied) {
          const d = Phaser.Math.Distance.Between(puppy.x, puppy.y, b.x, b.y);
          if (d < bestD) { bestD = d; best = b; }
        }
      });

      if (best && bestD < 80) {
        best.occupied = true;
        puppy.disableInteractive();
        bounce.stop();
        hint.destroy();

        // Snap puppy into basket
        this.tweens.add({ targets: puppy, x: best.x, y: best.y - 8, scaleX: tsX * 0.75, scaleY: tsY * 0.75,
          duration: 260, ease: 'Back.easeOut',
          onComplete: () => {
            puppy.destroy();
            // Swap basket image → puppy_in_basket
            best.img.destroy();
            if (this.textures.exists('puppy_in_basket')) {
              best.img = this.add.image(best.x, best.y, 'puppy_in_basket')
                .setDisplaySize(56, 46).setDepth(15);
            } else {
              // Fallback: basket + puppy emoji overlay
              this.add.image(best.x, best.y, 'basket')
                .setDisplaySize(56, 46).setDepth(14);
              best.img = this.add.text(best.x, best.y - 12, '🐶',
                { fontSize: '20px' }).setOrigin(0.5).setDepth(15);
            }
            // Golden ring on filled basket
            best.ringG.clear();
            best.ringG.lineStyle(2.5, 0xF5C842, 1);
            best.ringG.strokeEllipse(best.x, best.y + 14, 56, 18);

            this._pupCount++;
            this._sparkle(best.x, best.y);
            if (this._bktLbl) this._bktLbl.setText(`${this._pupCount} / 7 puppies placed`);
            const pct = 60 + Math.round(this._pupCount / 7 * 40);
            this._setProgress(pct);

            if (this._pupCount >= 7) {
              this.time.delayedCall(800, () => this._finalCelebration());
            } else {
              this.time.delayedCall(500, () => this._spawnPuppy(this._pupCount));
            }
          }
        });
      } else {
        // Snap puppy back to Gamma
        this.tweens.add({ targets: puppy, x: sx, y: sy, duration: 260, ease: 'Back.easeOut' });
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FINAL CELEBRATION
  // ═══════════════════════════════════════════════════════════════════════
  _finalCelebration() {
    this._phase = 'done';

    // Warm golden wash
    const wash = this.add.rectangle(W/2, H/2, W, H, 0xFFEE88, 0).setDepth(48);
    this.tweens.add({ targets: wash, alpha: 0.24, duration: 1200, yoyo: true, onComplete: () => wash.destroy() });

    if (this._gamma && this._gamma.y !== undefined)
      this.tweens.killTweensOf(this._gamma);

    // Confetti burst
    const colors = [0xFF6B6B, 0xFFD93D, 0x6BCB77, 0x4D96FF, 0xFF6BFF, 0xFFB347, 0xFF88EE];
    this.time.addEvent({ delay: 55, repeat: 70, callback: () => {
      const col = colors[Math.floor(Math.random() * colors.length)];
      const cr = this.add.rectangle(Math.random() * W, -14, 8, 10, col, 1).setDepth(70).setAngle(Math.random()*360);
      this.tweens.add({ targets: cr, y: H + 20, angle: cr.angle + 720*(Math.random()>.5?1:-1), x: cr.x+(Math.random()-.5)*120, duration: 2000+Math.random()*700, ease: 'Linear', onComplete: () => cr.destroy() });
    }});

    // Floating hearts over basket
    this.time.delayedCall(400, () => {
      for (let h = 0; h < 7; h++) {
        const ht = this.add.text(this._finalBktX + (Math.random()-0.5)*80, this._finalBktY, '💜', { fontSize: '18px' }).setDepth(75).setAlpha(0);
        this.tweens.add({ targets: ht, y: ht.y - 60, alpha: { from: 0, to: 1 }, duration: 500, delay: h*120,
          onComplete: () => this.tweens.add({ targets: ht, alpha: 0, y: ht.y - 30, duration: 600, delay: 200, onComplete: () => ht.destroy() }) });
      }
    });

    // Message panel
    this.time.delayedCall(600, () => {
      const panel = this.add.graphics().setDepth(58);
      panel.fillStyle(C.WHITE, 0.97); panel.fillRoundedRect(W/2 - 248, H/2 - 106, 496, 212, 22);
      panel.lineStyle(3.5, C.GOLD, 1); panel.strokeRoundedRect(W/2 - 248, H/2 - 106, 496, 212, 22);
      // Rainbow top stripe
      panel.fillStyle(C.GOLD, 1); panel.fillRoundedRect(W/2 - 248, H/2 - 106, 496, 22, { tl:22, tr:22, bl:0, br:0 });

      const msgs = [
        { t: '🎉 Amazing Job! 🎉',                    fs: '21px', col: '#F5C842', bold: true  },
        { t: 'You helped Gamma welcome her puppies!',  fs: '12px', col: '#5A3A2A', bold: false },
        { t: 'All 7 puppies are safe & warm!',         fs: '12px', col: '#5A3A2A', bold: false },
        { t: '🐶  🐶  🐶  🐶  🐶  🐶  🐶',            fs: '20px', col: '#FF8844', bold: false },
      ];
      msgs.forEach((m, i) => {
        const t = this.add.text(W/2, H/2 - 62 + i * 36, m.t,
          { fontSize: m.fs, fontFamily: 'Georgia, serif', color: m.col, fontStyle: m.bold ? 'bold' : 'normal',
            stroke: m.bold ? '#8A6000' : 'none', strokeThickness: 2 })
          .setOrigin(0.5).setDepth(59).setAlpha(0);
        this.tweens.add({ targets: t, alpha: 1, duration: 500, delay: 180 + i * 260 });
      });

      // FINISH button
      this.time.delayedCall(1400, () => {
        const bx = W/2, by = H/2 + 76;
        const fg = this.add.graphics().setDepth(59);
        const drawFin = (h) => {
          fg.clear(); fg.fillStyle(h ? 0x44BB44 : C.GREEN, 1); fg.fillRoundedRect(bx-90, by-20, 180, 40, 20);
          fg.lineStyle(2.5, 0x44AA44, 1); fg.strokeRoundedRect(bx-90, by-20, 180, 40, 20);
        };
        drawFin(false);
        this.add.text(bx, by, 'FINISH! 🐾', { fontSize: '15px', fontFamily: 'Arial', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(60);
        const fH = this.add.rectangle(bx, by, 180, 40, 0, 0).setDepth(61).setInteractive({ useHandCursor: true });
        fH.on('pointerover', () => drawFin(true)); fH.on('pointerout', () => drawFin(false));
        fH.on('pointerdown', () => {
          this.cameras.main.fadeOut(800, 0, 0, 0);
          this.time.delayedCall(850, () => this.scene.start('L5_Nursery', { stars: this._stars + 3 }));
        });
      });
    });
  }
}
