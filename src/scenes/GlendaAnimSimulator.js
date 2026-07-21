import Phaser from 'phaser';
import { W, H } from '../config/GameConfig.js';

// ════════════════════════════════════════════════════════════════════════════
// GLENDA ANIMATION SIMULATOR — standalone test scene
//
// Run animation is done by MANUAL frame-by-frame texture swapping (the same
// proven approach as the old SpriteSimulator) — NOT Phaser's anims system.
// This makes the 26-frame run bullet-proof: it can never be hijacked by
// physics/collision churn, and it advances one image at a time while moving.
//
// Assets — ALL from public/assets/images/test/glenda-run:
//   Run  : frame_001.png … frame_026.png   (26 frames, 720×1280) — cycled while moving
//   Idle : gelnda-idle-frame.png            (375×666)
//   Jump : gelnda-jump-frame.png            (375×666) — shown ONLY while airborne
// ════════════════════════════════════════════════════════════════════════════

const RUN_FRAME_COUNT = 26;
const RUN_FOLDER       = 'assets/images/test/glenda-run/';
const IDLE_PATH        = `${RUN_FOLDER}gelnda-idle-frame.png`;
const JUMP_PATH        = `${RUN_FOLDER}gelnda-jump-frame.png`;

const MOVE_SPEED    = 200;
const JUMP_VELOCITY = -430;
const RUN_FPS       = 26;   // ← run speed. Change this one number to retune.
const TARGET_HEIGHT = 130;  // fixed on-screen character height (px), all states

// Fixed physics-body size in world px — never changes, so ground contact is stable.
const BODY_W = 42;
const BODY_H = 118;

const IDLE_KEY = 'gsim_idle';
const JUMP_KEY = 'gsim_jump';
const RUN_KEY  = (i) => `gsim_run_${i}`; // i = 1..26

export class GlendaAnimSimulator extends Phaser.Scene {
  constructor() { super('GlendaAnimSimulator'); }

  // ── PRELOAD ─────────────────────────────────────────────────────────────────
  preload() {
    this._failedKeys = new Set();
    this.load.on('loaderror', f => {
      this._failedKeys.add(f.key);
      console.error(`[GlendaSim] ❌ LOAD FAILED: key="${f.key}"  url="${f.url}"`);
    });

    if (!this.textures.exists(IDLE_KEY)) this.load.image(IDLE_KEY, IDLE_PATH);
    if (!this.textures.exists(JUMP_KEY)) this.load.image(JUMP_KEY, JUMP_PATH);
    for (let i = 1; i <= RUN_FRAME_COUNT; i++) {
      if (!this.textures.exists(RUN_KEY(i))) {
        this.load.image(RUN_KEY(i), `${RUN_FOLDER}frame_${String(i).padStart(3, '0')}.png`);
      }
    }
  }

  // ── CREATE ──────────────────────────────────────────────────────────────────
  create() {
    this.cameras.main.setBackgroundColor('#87ceeb');
    this.cameras.main.fadeIn(400, 0, 0, 0);

    this._verifyLoads();
    this._prepareTextures();   // high-quality one-time downscale → crisp, not blurry

    // Per-state scale so every state renders at the same on-screen height.
    this._idleScale = TARGET_HEIGHT / this._texH(IDLE_KEY, 666);
    this._jumpScale = TARGET_HEIGHT / this._texH(JUMP_KEY, 666);
    this._runScale  = TARGET_HEIGHT / this._texH(RUN_KEY(1), 1280);

    this._buildGround();
    this._buildPlayer();
    this._buildHud();
    this._buildFrameInspector();
    this._setupInput();

    // Manual run-animation state.
    this._runIdx      = 0;     // 0..25 → frame_001..frame_026
    this._runTimer    = 0;     // ms accumulator
    this._facing      = 1;     // 1 right, -1 left
    this._canJump     = true;
    this._inspectMode = false;
    this._appliedScale = null;
    this._appliedTex   = null;

    this._showIdle();
  }

  _texH(key, fallback) {
    const img = this.textures.exists(key) && this.textures.get(key).getSourceImage();
    return (img && img.height) ? img.height : fallback;
  }

  _verifyLoads() {
    const missing = [];
    for (let i = 1; i <= RUN_FRAME_COUNT; i++) {
      if (!this.textures.exists(RUN_KEY(i))) missing.push(`frame_${String(i).padStart(3, '0')}.png`);
    }
    if (missing.length) console.error(`[GlendaSim] ⚠ ${missing.length}/${RUN_FRAME_COUNT} run frames MISSING:`, missing);
    else console.log(`[GlendaSim] ✓ All ${RUN_FRAME_COUNT} run frames loaded (frame_001 … frame_026).`);
    console.log(`[GlendaSim] idle: ${this.textures.exists(IDLE_KEY)}, jump: ${this.textures.exists(JUMP_KEY)}`);
  }

  // ── TEXTURE QUALITY ──────────────────────────────────────────────────────────
  // The source frames are huge (720×1280 / 375×666) but display at ~130px tall.
  // Letting the GPU do that ~10× downscale every frame looks blurry. Instead we
  // do ONE high-quality CPU downscale here (to ~2× the on-screen size), so the
  // runtime only does a gentle 2× reduction → crisp. Preserves alpha.
  _prepareTextures() {
    const targetH = Math.round(TARGET_HEIGHT * 2); // 2× supersample for retina crispness
    const keys = [IDLE_KEY, JUMP_KEY];
    for (let i = 1; i <= RUN_FRAME_COUNT; i++) keys.push(RUN_KEY(i));

    for (const key of keys) {
      if (!this.textures.exists(key)) continue;
      const src = this.textures.get(key).getSourceImage();
      if (!src || !src.height || src.height <= targetH) continue;

      const scale = targetH / src.height;
      const w = Math.max(1, Math.round(src.width * scale));
      const h = Math.max(1, Math.round(src.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(src, 0, 0, w, h);

      this.textures.remove(key);
      this.textures.addCanvas(key, canvas);
    }
    console.log(`[GlendaSim] textures downscaled to ${targetH}px tall (high-quality) for crisp rendering.`);
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

  // ── PLAYER ────────────────────────────────────────────────────────────────────
  // Physics and visuals are FULLY SEPARATED — this is the fix for the jump-frame
  // flashing during the run.
  //
  //   this.mover  → an INVISIBLE, fixed-size physics body. It never changes size
  //                 or texture, so ground contact (blocked.down) is rock-solid
  //                 and can never flicker while the run frames swap.
  //   this.glenda → a plain (non-physics) Image that shows the character art.
  //                 It swaps between all 26 run frames / idle / jump freely and
  //                 simply follows the mover each frame. Because it has NO body,
  //                 changing its texture/scale can't affect collision at all.
  _buildPlayer() {
    // Invisible physics SPRITE = the fixed-size collision body. Using a real
    // physics sprite (proven to initialise cleanly) but kept invisible; its
    // texture/size NEVER change, so blocked.down stays rock-solid.
    this.mover = this.physics.add.sprite(W / 2, this._groundY - BODY_H / 2, IDLE_KEY);
    this.mover.setVisible(false);
    this.mover.body.setSize(BODY_W, BODY_H, true);   // fixed body in texture px (scale = 1)
    this.mover.setCollideWorldBounds(true);
    this.physics.add.collider(this.mover, this.groundGroup);

    // Visual follower — bottom-centre origin so the feet sit on the body's base.
    this.glenda = this.add.image(this.mover.x, this.mover.body.bottom, IDLE_KEY)
      .setOrigin(0.5, 1).setDepth(10);
  }

  // ── VISUAL HELPERS (manual texture + scale swap on the follower image) ───────
  _setVisual(texKey, scale) {
    if (this._appliedTex !== texKey) {
      this.glenda.setTexture(texKey);
      this._appliedTex = texKey;
    }
    if (this._appliedScale !== scale) {
      this.glenda.setScale(scale);
      this._appliedScale = scale;
    }
    this.glenda.setFlipX(this._facing < 0);
    // Follow the physics body: horizontally centred, feet on the body's bottom.
    this.glenda.x = this.mover.x;
    this.glenda.y = this.mover.body.bottom;
  }

  _showIdle() { this._setVisual(IDLE_KEY, this._idleScale); }
  _showJump() { this._setVisual(JUMP_KEY, this._jumpScale); }
  _showRunFrame(idx) { this._setVisual(RUN_KEY(idx + 1), this._runScale); }

  // ── HUD ────────────────────────────────────────────────────────────────────
  _buildHud() {
    this.add.rectangle(W / 2, 24, W, 48, 0x000000, 0.5).setDepth(20);
    this.add.text(12, 14, '👧 GLENDA ANIMATION SIMULATOR', {
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

  // ── FRAME INSPECTOR (mouse-only, steps the 26 frames one by one) ─────────────
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
    this._frameCounterTxt = this.add.text(W / 2, panelY - 24, 'Frame 1 / 26', {
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
      // Keep the visual glued to the (frozen) body while inspecting.
      this.glenda.x = this.mover.x;
      this.glenda.y = this.mover.body.bottom;
      return;
    }

    const body = this.mover.body;
    const onGround = body.blocked.down || body.touching.down;

    const left  = this.keys.a.isDown || this.cursors.left.isDown;
    const right = this.keys.d.isDown || this.cursors.right.isDown;
    const stop  = this.keys.s.isDown || this.cursors.down.isDown;
    const jump  = Phaser.Input.Keyboard.JustDown(this.keys.w) ||
                  Phaser.Input.Keyboard.JustDown(this.cursors.up);

    // Movement + facing. (Velocity helpers live on body for a Rectangle body.)
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

    // Jump (single trigger).
    if (jump && onGround && this._canJump) {
      body.setVelocityY(JUMP_VELOCITY);
      this._canJump = false;
    }
    if (onGround) this._canJump = true;

    // ── State priority: airborne → JUMP, moving on ground → RUN, else IDLE ──
    const moving = !stop && (left || right);

    if (!onGround) {
      // JUMP — single image while airborne.
      this._showJump();
      this._stateTxt.setText('State: jump');
      this._frameReadout.setText('JUMP  (single image)');
    } else if (moving) {
      // RUN — advance the 26 frames one by one at RUN_FPS.
      this._runTimer += delta;
      const msPerFrame = 1000 / RUN_FPS;
      while (this._runTimer >= msPerFrame) {
        this._runTimer -= msPerFrame;
        this._runIdx = (this._runIdx + 1) % RUN_FRAME_COUNT; // loop 25→0 (frame_026→frame_001)
      }
      this._showRunFrame(this._runIdx);
      this._stateTxt.setText('State: run');
      this._frameReadout.setText(`RUN  frame ${this._runIdx + 1} / ${RUN_FRAME_COUNT}   @ ${RUN_FPS} FPS`);
    } else {
      // IDLE — single image; reset the run cycle so next run starts at frame_001.
      this._runIdx   = 0;
      this._runTimer = 0;
      this._showIdle();
      this._stateTxt.setText('State: idle');
      this._frameReadout.setText('IDLE  (single image)');
    }
  }
}
