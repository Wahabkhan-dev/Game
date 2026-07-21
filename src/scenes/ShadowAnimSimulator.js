import Phaser from 'phaser';
import { W, H } from '../config/GameConfig.js';

// ════════════════════════════════════════════════════════════════════════════
// SHADOW ANIMATION SIMULATOR — standalone test scene (the black dog)
//
// Same structure/controls as the Glenda simulator, adapted for the NEW-RUN dog:
//   • 8 run frames (01.png … 08.png), gray background → removed (chroma-key).
//   • 4 jump frames (jump-1.png … jump-4.png), white background → removed;
//     played ONCE on takeoff, then holds the last frame until landing.
//   • idle.png (already transparent) → used directly for the idle pose.
//   • Every frame is auto-cropped to its content and downscaled high-quality so
//     the empty margin is gone, the feet sit on the ground, and it's crisp.
//
// Physics and visuals are fully separated (invisible fixed body + follower
// image), exactly like the Glenda simulator, so ground contact never flickers.
//
// Assets: public/assets/images/test/NEW-RUN/  →  01.png … 08.png (run),
//         jump-1.png … jump-4.png (jump), idle.png (idle)
// ════════════════════════════════════════════════════════════════════════════

const RUN_FRAME_COUNT  = 8;
const JUMP_FRAME_COUNT = 4;
const RUN_FOLDER       = 'assets/images/test/NEW-RUN/';
const IDLE_PATH        = `${RUN_FOLDER}idle.png`;

const MOVE_SPEED    = 200;
const JUMP_VELOCITY = -430;
const GRAVITY       = 800;   // matches the global arcade gravity in main.js
const RUN_FPS       = 14;    // ← run speed. Change this one number to retune.
const TARGET_HEIGHT = 110;   // on-screen height of the (cropped) dog, in px

// Total airtime of a jump (up + down) → each of the 4 jump frames gets 1/4 of it,
// so all four images are shown for an EQUAL amount of time across the jump.
const JUMP_ARC_MS   = (2 * Math.abs(JUMP_VELOCITY) / GRAVITY) * 1000;

// Fixed physics body (dog is wider than tall).
const BODY_W = 96;
const BODY_H = 62;

// Background removal tolerance (run = gray bg, jump = white bg; idle already transparent).
const CHROMA_TOL = 40;

const RUN_KEY  = (i) => `sh_run_${i}`;  // i = 1..8
const JUMP_KEY = (i) => `sh_jump_${i}`; // i = 1..4
const IDLE_KEY = 'sh_idle';

export class ShadowAnimSimulator extends Phaser.Scene {
  constructor() { super('ShadowAnimSimulator'); }

  // ── PRELOAD ─────────────────────────────────────────────────────────────────
  preload() {
    this._failedKeys = new Set();
    this.load.on('loaderror', f => {
      this._failedKeys.add(f.key);
      console.error(`[ShadowSim] ❌ LOAD FAILED: key="${f.key}"  url="${f.url}"`);
    });
    for (let i = 1; i <= RUN_FRAME_COUNT; i++) {
      if (!this.textures.exists(RUN_KEY(i))) {
        this.load.image(RUN_KEY(i), `${RUN_FOLDER}${String(i).padStart(2, '0')}.png`);
      }
    }
    for (let i = 1; i <= JUMP_FRAME_COUNT; i++) {
      if (!this.textures.exists(JUMP_KEY(i))) {
        this.load.image(JUMP_KEY(i), `${RUN_FOLDER}jump-${i}.png`);
      }
    }
    if (!this.textures.exists(IDLE_KEY)) this.load.image(IDLE_KEY, IDLE_PATH);
  }

  // ── CREATE ──────────────────────────────────────────────────────────────────
  create() {
    this.cameras.main.setBackgroundColor('#87ceeb');
    this.cameras.main.fadeIn(400, 0, 0, 0);

    this._texScale = {};       // per-texture display scale → uniform on-screen height
    this._verifyLoads();
    this._prepareTextures();   // chroma-key + crop + high-quality downscale

    this._buildGround();
    this._buildPlayer();
    this._buildHud();
    this._buildFrameInspector();
    this._setupInput();

    this._runIdx      = 0;
    this._runTimer    = 0;
    this._jumpIdx     = 0;
    this._jumpTimer   = 0;
    this._facing      = 1;
    this._canJump     = true;
    this._inspectMode = false;
    this._appliedTex  = null;

    this._showIdle();
  }

  _verifyLoads() {
    const missing = [];
    for (let i = 1; i <= RUN_FRAME_COUNT; i++) {
      if (!this.textures.exists(RUN_KEY(i))) missing.push(`${String(i).padStart(2, '0')}.png`);
    }
    if (missing.length) console.error(`[ShadowSim] ⚠ ${missing.length}/${RUN_FRAME_COUNT} run frames MISSING:`, missing);
    else console.log(`[ShadowSim] ✓ All ${RUN_FRAME_COUNT} run frames loaded (01.png … 08.png).`);
    let jumpOk = 0;
    for (let i = 1; i <= JUMP_FRAME_COUNT; i++) if (this.textures.exists(JUMP_KEY(i))) jumpOk++;
    console.log(`[ShadowSim] jump frames: ${jumpOk}/${JUMP_FRAME_COUNT}, idle: ${this.textures.exists(IDLE_KEY)}`);
  }

  // ── TEXTURE PREP ─────────────────────────────────────────────────────────────
  // Run frames  → gray removed + shared-bbox crop (so the cycle doesn't jitter).
  // Idle / jump → already transparent → own-bbox crop only.
  // Every texture is downscaled so its cropped content is 2× the on-screen height
  // (crisp), and each gets a display scale that yields the SAME on-screen height
  // with feet at the bottom (origin 0.5,1) — so all poses line up on the ground.
  _prepareTextures() {
    const SUPER = Math.round(TARGET_HEIGHT * 2); // 2× supersample target height

    // Turn a source image into a background-removed, alpha-carrying canvas.
    const toCanvas = (src, chroma) => {
      const w = src.width, h = src.height;
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      ctx.drawImage(src, 0, 0);
      if (!chroma) return c;
      let img;
      try { img = ctx.getImageData(0, 0, w, h); } catch (e) { return c; }
      const d = img.data;
      const corners = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + w - 1) * 4];
      let bR = 0, bG = 0, bB = 0;
      corners.forEach(o => { bR += d[o]; bG += d[o + 1]; bB += d[o + 2]; });
      bR /= 4; bG /= 4; bB /= 4;
      const soft = CHROMA_TOL * 1.8;
      for (let p = 0; p < d.length; p += 4) {
        const dr = d[p] - bR, dg = d[p + 1] - bG, db = d[p + 2] - bB;
        const dist = Math.sqrt(dr * dr + dg * dg + db * db);
        if (dist < CHROMA_TOL) d[p + 3] = 0;
        else if (dist < soft) d[p + 3] = Math.round(d[p + 3] * ((dist - CHROMA_TOL) / (soft - CHROMA_TOL)));
      }
      ctx.putImageData(img, 0, 0);
      return c;
    };

    // Content bounding box (alpha > 16) of a canvas.
    const bbox = (canvas) => {
      const w = canvas.width, h = canvas.height;
      const d = canvas.getContext('2d').getImageData(0, 0, w, h).data;
      let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (d[(y * w + x) * 4 + 3] > 16) {
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
      if (!isFinite(minX)) return { x: 0, y: 0, w, h };
      return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
    };

    // Crop `box` out of `canvas`, downscale to SUPER-tall, register as `key`,
    // and record the display scale that renders it at TARGET_HEIGHT.
    const emit = (key, canvas, box) => {
      const s = SUPER / box.h;
      const ow = Math.max(1, Math.round(box.w * s));
      const oh = Math.max(1, Math.round(box.h * s));
      const out = document.createElement('canvas');
      out.width = ow; out.height = oh;
      const octx = out.getContext('2d');
      octx.imageSmoothingEnabled = true;
      octx.imageSmoothingQuality = 'high';
      octx.clearRect(0, 0, ow, oh);
      octx.drawImage(canvas, box.x, box.y, box.w, box.h, 0, 0, ow, oh);
      this.textures.remove(key);
      this.textures.addCanvas(key, out);
      this._texScale[key] = TARGET_HEIGHT / oh;
    };

    // Process a group of frames sharing ONE bounding box (so the animation
    // doesn't jitter/resize between frames). `chroma` strips the flat backdrop.
    const emitGroup = (keys, chroma) => {
      const cvs = {};
      let uX = Infinity, uY = Infinity, uMaxX = 0, uMaxY = 0;
      for (const key of keys) {
        if (!this.textures.exists(key)) continue;
        const cv = toCanvas(this.textures.get(key).getSourceImage(), chroma);
        cvs[key] = cv;
        const b = bbox(cv);
        uX = Math.min(uX, b.x); uY = Math.min(uY, b.y);
        uMaxX = Math.max(uMaxX, b.x + b.w - 1); uMaxY = Math.max(uMaxY, b.y + b.h - 1);
      }
      const box = isFinite(uX) ? { x: uX, y: uY, w: uMaxX - uX + 1, h: uMaxY - uY + 1 } : { x: 0, y: 0, w: 1000, h: 1000 };
      for (const key of keys) if (cvs[key]) emit(key, cvs[key], box);
    };

    // Run frames — gray backdrop removed, shared bbox across all 8.
    const runKeys = [];
    for (let i = 1; i <= RUN_FRAME_COUNT; i++) runKeys.push(RUN_KEY(i));
    emitGroup(runKeys, true);

    // Jump frames — WHITE backdrop removed, shared bbox across all 4.
    const jumpKeys = [];
    for (let i = 1; i <= JUMP_FRAME_COUNT; i++) jumpKeys.push(JUMP_KEY(i));
    emitGroup(jumpKeys, true);

    // Idle — already transparent → own bounding box, no chroma.
    if (this.textures.exists(IDLE_KEY)) {
      const cv = toCanvas(this.textures.get(IDLE_KEY).getSourceImage(), false);
      emit(IDLE_KEY, cv, bbox(cv));
    }

    console.log('[ShadowSim] textures prepped (bg removed, cropped, high-quality). scales:', this._texScale);
  }

  // ── GROUND ────────────────────────────────────────────────────────────────────
  _buildGround() {
    const groundY = H - 56;
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0x6b4a2f, 1); g.fillRect(0, groundY, W, H - groundY);
    g.fillStyle(0x4c8f3a, 1); g.fillRect(0, groundY, W, 10);
    this._groundY = groundY;

    this.groundGroup = this.physics.add.staticGroup();
    const floor = this.add.rectangle(W / 2, groundY + (H - groundY) / 2, W, H - groundY, 0, 0);
    this.physics.add.existing(floor, true);
    this.groundGroup.add(floor);
  }

  // ── PLAYER (invisible fixed body + visual follower) ──────────────────────────
  _buildPlayer() {
    this.mover = this.physics.add.sprite(W / 2, this._groundY - BODY_H / 2, IDLE_KEY);
    this.mover.setVisible(false);
    this.mover.body.setSize(BODY_W, BODY_H, true);
    this.mover.setCollideWorldBounds(true);
    this.physics.add.collider(this.mover, this.groundGroup);

    this.dog = this.add.image(this.mover.x, this.mover.body.bottom, IDLE_KEY)
      .setOrigin(0.5, 1).setDepth(10);
  }

  _setVisual(texKey) {
    if (this._appliedTex !== texKey) {
      this.dog.setTexture(texKey);
      this._appliedTex = texKey;
    }
    this.dog.setScale(this._texScale[texKey] ?? 0.5);
    this.dog.setFlipX(this._facing < 0);
    this.dog.x = this.mover.x;
    this.dog.y = this.mover.body.bottom;
  }

  _showIdle() { this._setVisual(IDLE_KEY); }
  _showRunFrame(idx) { this._setVisual(RUN_KEY(idx + 1)); }
  _showJumpFrame(idx) { this._setVisual(JUMP_KEY(idx + 1)); }

  // ── HUD ────────────────────────────────────────────────────────────────────
  _buildHud() {
    this.add.rectangle(W / 2, 24, W, 48, 0x000000, 0.5).setDepth(20);
    this.add.text(12, 14, '🐕 SHADOW ANIMATION SIMULATOR', {
      fontSize: '15px', fontFamily: 'Georgia, serif', color: '#ffe08a',
      stroke: '#000', strokeThickness: 3,
    }).setDepth(21);
    this.add.text(W - 12, 8, 'A/← Left   D/→ Right   W/↑ Jump   S/↓ Idle   ESC Menu', {
      fontSize: '10px', fontFamily: 'Arial', color: '#dddddd',
    }).setOrigin(1, 0).setDepth(21);
    this._stateTxt = this.add.text(W - 12, 24, 'State: idle', {
      fontSize: '11px', fontFamily: 'Courier New', color: '#53d8fb',
    }).setOrigin(1, 0).setDepth(21);
    this._frameReadout = this.add.text(W / 2, 44, '', {
      fontSize: '13px', fontFamily: 'Courier New', color: '#ffe08a',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(21);
  }

  // ── FRAME INSPECTOR (mouse-only, steps the 8 frames one by one) ──────────────
  _buildFrameInspector() {
    const panelY = H - 30;
    this._inspectBtnG = this.add.graphics().setDepth(30);
    this.add.text(70, 14, '🔍 Inspect Frames', {
      fontSize: '11px', fontFamily: 'Georgia, serif', color: '#ffffff',
    }).setOrigin(0.5).setDepth(31);
    this._drawToggleBtn(false);
    this.add.rectangle(70, 14, 130, 24, 0, 0)
      .setDepth(32).setInteractive({ useHandCursor: true })
      .on('pointerup', () => this._toggleInspectMode());

    this._stepPanel = this.add.container(0, 0).setDepth(30).setVisible(false);
    this._stepPanel.add(this.add.rectangle(W / 2, panelY, W, 40, 0x000000, 0.6));
    const btns = [
      { icon: '⏮', cb: () => this._setInspectFrame(0) },
      { icon: '◀', cb: () => this._setInspectFrame(this._inspectFrameIdx - 1) },
      { icon: '▶', cb: () => this._setInspectFrame(this._inspectFrameIdx + 1) },
      { icon: '⏭', cb: () => this._setInspectFrame(RUN_FRAME_COUNT - 1) },
    ];
    const BW = 44, GAP = 8;
    const startX = W / 2 - (btns.length * BW + (btns.length - 1) * GAP) / 2 + BW / 2;
    btns.forEach((btn, i) => {
      const cx = startX + i * (BW + GAP);
      const g = this.add.graphics();
      g.fillStyle(0x2a2e44, 1); g.fillRoundedRect(cx - BW / 2, panelY - 13, BW, 26, 6);
      g.lineStyle(1, 0x4a7aee, 0.8); g.strokeRoundedRect(cx - BW / 2, panelY - 13, BW, 26, 6);
      const t = this.add.text(cx, panelY, btn.icon, { fontSize: '15px', color: '#fff' }).setOrigin(0.5);
      const hit = this.add.rectangle(cx, panelY, BW, 26, 0, 0).setInteractive({ useHandCursor: true });
      hit.on('pointerup', btn.cb);
      this._stepPanel.add([g, t, hit]);
    });
    this._frameCounterTxt = this.add.text(W / 2, panelY - 24, `Frame 1 / ${RUN_FRAME_COUNT}`, {
      fontSize: '11px', fontFamily: 'Courier New', color: '#ffe08a',
    }).setOrigin(0.5);
    this._stepPanel.add(this._frameCounterTxt);
    this._inspectFrameIdx = 0;
  }

  _drawToggleBtn(active) {
    const g = this._inspectBtnG;
    g.clear();
    g.fillStyle(active ? 0xe94560 : 0x2a2e44, 1); g.fillRoundedRect(5, 2, 130, 24, 8);
    g.lineStyle(1, active ? 0xffffff : 0x4a7aee, 0.9); g.strokeRoundedRect(5, 2, 130, 24, 8);
  }

  _toggleInspectMode() {
    this._inspectMode = !this._inspectMode;
    this._drawToggleBtn(this._inspectMode);
    this._stepPanel.setVisible(this._inspectMode);
    if (this._inspectMode) {
      this.mover.body.setVelocity(0, 0);
      this.mover.body.setAllowGravity(false);
      this._setInspectFrame(0);
    } else {
      this.mover.body.setAllowGravity(true);
      this._showIdle();
    }
  }

  _setInspectFrame(idx) {
    this._inspectFrameIdx = Phaser.Math.Clamp(idx, 0, RUN_FRAME_COUNT - 1);
    this._showRunFrame(this._inspectFrameIdx);
    this._frameCounterTxt.setText(`Frame ${this._inspectFrameIdx + 1} / ${RUN_FRAME_COUNT}`);
  }

  // ── INPUT ─────────────────────────────────────────────────────────────────
  _setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      s: Phaser.Input.Keyboard.KeyCodes.S,
    });
    this.input.keyboard.on('keydown-ESC', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(320, () => this.scene.start('Menu'));
    });
  }

  // ── UPDATE LOOP ──────────────────────────────────────────────────────────────
  update(_, delta) {
    if (this._inspectMode) {
      this.dog.x = this.mover.x;
      this.dog.y = this.mover.body.bottom;
      return;
    }

    const body = this.mover.body;
    const onGround = body.blocked.down || body.touching.down;

    const left  = this.keys.a.isDown || this.cursors.left.isDown;
    const right = this.keys.d.isDown || this.cursors.right.isDown;
    const stop  = this.keys.s.isDown || this.cursors.down.isDown;
    const jump  = Phaser.Input.Keyboard.JustDown(this.keys.w) ||
                  Phaser.Input.Keyboard.JustDown(this.cursors.up);

    if (stop) {
      body.setVelocityX(0);
    } else if (left) {
      body.setVelocityX(-MOVE_SPEED);
      this._facing = -1;
    } else if (right) {
      body.setVelocityX(MOVE_SPEED);
      this._facing = 1;
    } else {
      body.setVelocityX(0);
    }

    if (jump && onGround && this._canJump) {
      body.setVelocityY(JUMP_VELOCITY);
      this._canJump = false;
      this._jumpIdx = 0;      // restart the jump arc on every takeoff
      this._jumpTimer = 0;
    }
    if (onGround) this._canJump = true;

    const moving = !stop && (left || right);

    if (!onGround) {
      // JUMP — spread the 4 frames EQUALLY across the airtime (¼ each), so every
      // jump image is shown for the same amount of time. Holds frame 4 if the
      // dog stays airborne longer than expected.
      this._jumpTimer += delta;
      const msPerFrame = JUMP_ARC_MS / JUMP_FRAME_COUNT;
      this._jumpIdx = Math.min(Math.floor(this._jumpTimer / msPerFrame), JUMP_FRAME_COUNT - 1);
      this._showJumpFrame(this._jumpIdx);
      this._stateTxt.setText('State: jump');
      this._frameReadout.setText(`JUMP  frame ${this._jumpIdx + 1} / ${JUMP_FRAME_COUNT}   (¼ airtime each)`);
    } else if (moving) {
      this._runTimer += delta;
      const msPerFrame = 1000 / RUN_FPS;
      while (this._runTimer >= msPerFrame) {
        this._runTimer -= msPerFrame;
        this._runIdx = (this._runIdx + 1) % RUN_FRAME_COUNT;
      }
      this._showRunFrame(this._runIdx);
      this._stateTxt.setText('State: run');
      this._frameReadout.setText(`RUN  frame ${this._runIdx + 1} / ${RUN_FRAME_COUNT}   @ ${RUN_FPS} FPS`);
    } else {
      this._runIdx = 0;
      this._runTimer = 0;
      this._showIdle();
      this._stateTxt.setText('State: idle');
      this._frameReadout.setText('IDLE  (idle.png)');
    }
  }
}
