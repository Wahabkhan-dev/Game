import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { L9BaseScene, L9 } from './L9BaseScene.js';
import { generateL9Assets } from './L9Assets.js';
import { preloadGlendaSkin } from './L9_GlendaSkin.js';

// ════════════════════════════════════════════════════════════════════════════
// LEVEL 9 — PART 1 · STAGE 1: "Gift Run"  🎁
//
// Gleeda runs through a snowy holiday street collecting 8 wrapped GIFTS. Along
// the way she jumps snowballs / snowmen / gift-stacks, hops over ice patches,
// dodges falling icicles, and stops at a couple of festive mini-activities.
// When all gifts are gathered she reaches the cottage door → the Unwrap scene.
//
// First Level-9 scene, so it preloads optional real PNGs (guarded) and generates
// the procedural fallbacks. Mirrors the Level-8 Food Run the game already uses.
// ════════════════════════════════════════════════════════════════════════════

const WORLD_W  = 6400;
const GROUND_Y = 380;
const CEIL_Y   = 60;

// 8 gifts to collect — alternate ground / high (jump-gated)
const GIFTS = [
  { x: 460,  tex: 'l9_gift_red',    high: false },
  { x: 1050, tex: 'l9_gift_green',  high: true  },
  { x: 1650, tex: 'l9_gift_gold',   high: false },
  { x: 2400, tex: 'l9_gift_blue',   high: true  },
  { x: 3150, tex: 'l9_gift_pink',   high: false },
  { x: 3950, tex: 'l9_gift_purple', high: true  },
  { x: 4750, tex: 'l9_gift_white',  high: false },
  { x: 5500, tex: 'l9_gift_stripe', high: true  },
];

// One-way floating "snow ledges" to reach the high gifts
const LEDGES = [
  { x: 1050, y: 290, w: 110 },
  { x: 2400, y: 286, w: 110 },
  { x: 3950, y: 288, w: 110 },
  { x: 5500, y: 286, w: 110 },
];

// Ground obstacles (JUMP over)
const GROUND_OBS = [
  { x: 760,  tex: 'l9_snowball', h: 54 },
  { x: 1350, tex: 'l9_snowman',  h: 74 },
  { x: 1950, tex: 'l9_giftstack', h: 62 },
  { x: 2750, tex: 'l9_snowball', h: 54 },
  { x: 3500, tex: 'l9_snowman',  h: 74 },
  { x: 4350, tex: 'l9_giftstack', h: 62 },
  { x: 5100, tex: 'l9_snowball', h: 54 },
  { x: 5850, tex: 'l9_snowman',  h: 74 },
];

// Ice patches (flat — JUMP over)
const ICE = [{ x: 1200 }, { x: 3300 }, { x: 4950 }];

// Falling icicles — drop when the player passes
const ICICLES = [{ x: 2200 }, { x: 4150 }, { x: 5700 }];

// Festive mini-activity stops
const GATES = [
  { x: 1500, key: 'match_ornaments' },
  { x: 4500, key: 'wrap_gift' },
];

const CP_XS = [1000, 2400, 3800, 5200];

export class L9_GiftRunScene extends L9BaseScene {
  constructor() { super('L9_GiftRun'); }

  preload() {
    preloadGlendaSkin(this);
    // Guarded real-PNG loading — any missing file falls back to procedural art.
    const B = 'assets/images/level9/';
    const load = (k, path) => { if (!this.textures.exists(k)) this.load.image(k, path); };
    ['l9_sky', 'l9_hills', 'l9_ground', 'l9_room_bg', 'l9_tree', 'l9_lights', 'l9_house', 'l9_door']
      .forEach(k => load(k, `${B}bg/${k}.png`));
    ['l9_gift_red', 'l9_gift_green', 'l9_gift_gold', 'l9_gift_blue', 'l9_gift_pink', 'l9_gift_purple', 'l9_gift_white', 'l9_gift_stripe', 'l9_gift_open']
      .forEach(k => load(k, `${B}gift/${k}.png`));
    ['l9_bow_red', 'l9_bow_green', 'l9_bow_gold', 'l9_bow_blue', 'l9_bow_pink', 'l9_bow_purple', 'l9_bow_silver']
      .forEach(k => load(k, `${B}bow/${k}.png`));
    ['l9_puppy', 'l9_gamma', 'l9_toy_ball', 'l9_toy_bone', 'l9_candy', 'l9_ornament']
      .forEach(k => load(k, `${B}char/${k}.png`));
    ['l9_snowball', 'l9_snowman', 'l9_giftstack', 'l9_ice', 'l9_icicle', 'l9_cp']
      .forEach(k => load(k, `${B}obstacle/${k}.png`));
    this.load.on('loaderror', () => { /* procedural fallback covers it */ });
  }

  create() {
    generateL9Assets(this);
    this.physics.world.setBounds(0, 0, WORLD_W, H + 220);
    this.cameras.main.setBounds(0, 0, WORLD_W, H);
    this.cameras.main.fadeIn(600, 0, 0, 0);

    this._collected = 0; this._done = false; this._streak = 0; this._dustT = 0;
    this._groundY = GROUND_Y;

    this.buildSnowyBg(WORLD_W);
    this.buildGround(WORLD_W, GROUND_Y);
    this._platforms = this.physics.add.staticGroup();
    this._buildLedges();
    this._buildSigns();
    this._buildCPs();
    this._buildGifts();
    this._buildObstacles();
    this._buildIce();
    this._buildIcicles();

    this.buildPlayer(80, GROUND_Y, 250, -470);
    this.physics.add.collider(this.player, this._platforms);
    this.registry.set('l9_checkpointX', 80); this.registry.set('l9_checkpointY', GROUND_Y);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    this._buildGates();

    this._giftHud = this.buildCounterPill('🎁', 'GIFTS', GIFTS.length);   // top-centre
    this.buildHearts();          // top-left
    this.buildScorePause();      // top-right (score + pause)
    this._updateDist = this.buildDistanceBar(WORLD_W, CP_XS);   // bottom

    // finish door
    this._door = this.add.image(WORLD_W - 90, GROUND_Y - 78, 'l9_door').setDisplaySize(104, 156).setDepth(3);
    this.add.text(WORLD_W - 90, GROUND_Y - 168, "🏡 HOME", {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#0a1a0e', strokeThickness: 4,
      backgroundColor: '#1c4a2e', padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setDepth(6);

    this.time.delayedCall(400, () => this.toast('🎁 Collect 8 gifts!\nA/D move · W jump over snow · S slide', 3000));
  }

  _buildLedges() {
    LEDGES.forEach(p => {
      const pl = this._platforms.create(p.x, p.y, 'l9_ground');
      pl.setDisplaySize(p.w, 18).refreshBody();
      pl.setTint(0xffffff);
      pl.body.checkCollision.down = false; pl.body.checkCollision.left = false; pl.body.checkCollision.right = false;
      pl.setDepth(6);
      // a little snow cap line
      this.add.rectangle(p.x, p.y - 9, p.w, 4, 0xffffff, 0.9).setDepth(7);
      this.tweens.add({ targets: pl, y: p.y - 4, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });
  }

  _buildSigns() {
    const sign = (x, txt) => this.add.text(x, GROUND_Y - 150, txt, {
      fontSize: '11px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#0a1a0e', strokeThickness: 3,
      backgroundColor: '#1c4a2ecc', padding: { x: 6, y: 3 }
    }).setOrigin(0.5).setDepth(6);
    sign(300,  '🎄 SNOW LANE');
    sign(2000, '⛄ FROSTY SQUARE');
    sign(4000, '🎅 CANDY CORNER');
    sign(5700, '✨ ALMOST HOME');
  }

  _buildCPs() {
    this._cpObjs = CP_XS.map((x, i) => {
      const beacon = this.add.image(x, GROUND_Y - 46, 'l9_cp').setDisplaySize(40, 68).setDepth(5).setAlpha(0.4);
      const label = this.add.text(x, GROUND_Y - 92, `CP ${i + 1}`, { fontSize: '9px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#1c4a2e', strokeThickness: 2 }).setOrigin(0.5).setDepth(5).setAlpha(0.4);
      return { x, beacon, label, triggered: false, idx: i + 1 };
    });
  }

  _buildGifts() {
    this._giftObjs = GIFTS.map(gc => {
      const y = gc.high ? GROUND_Y - 128 : GROUND_Y - 44;
      const glow = this.add.image(gc.x, y, 'l9_glow').setScale(0.6).setAlpha(0.35).setDepth(7).setTint(0xffe6a0);
      this.tweens.add({ targets: glow, alpha: 0.6, scale: 0.85, duration: 800, yoyo: true, repeat: -1 });
      const img = this.add.image(gc.x, y, gc.tex).setDepth(9).setDisplaySize(46, 46);
      this.tweens.add({ targets: img, y: y - 10, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const hint = gc.high ? this.add.text(gc.x, y + 32, '⬆', { fontSize: '12px', color: '#ffe6a0' }).setOrigin(0.5).setDepth(9) : null;
      return { ...gc, img, glow, hint, taken: false, y };
    });
  }

  _buildObstacles() {
    const baseY = GROUND_Y + 12;
    this._obs = GROUND_OBS.map(o => {
      const src = this.textures.get(o.tex).getSourceImage();
      const w = o.h * (src.width / src.height);
      const sh = this.add.graphics({ x: o.x, y: baseY }).setDepth(10);
      sh.fillStyle(0x000000, 0.18); sh.fillEllipse(0, 0, w + 14, 10);
      const spr = this.add.image(o.x, baseY - o.h / 2, o.tex).setOrigin(0.5, 0.5).setDisplaySize(w, o.h).setDepth(11);
      return { ...o, spr, w, clearY: baseY - o.h - 6 };
    });
  }

  _buildIce() {
    this._ice = ICE.map(a => {
      const img = this.add.image(a.x, GROUND_Y - 4, 'l9_ice').setDisplaySize(90, 24).setDepth(8);
      this.tweens.add({ targets: img, alpha: 0.7, duration: 800, yoyo: true, repeat: -1 });
      this.add.text(a.x, GROUND_Y - 38, '⬆ jump', { fontSize: '9px', color: '#bfe6ff' }).setOrigin(0.5).setDepth(8);
      return { ...a, img };
    });
  }

  _buildIcicles() {
    this._icicles = ICICLES.map(s => {
      const img = this.add.image(s.x, CEIL_Y + 16, 'l9_icicle').setDisplaySize(26, 56).setOrigin(0.5, 0).setDepth(11);
      this.tweens.add({ targets: img, y: CEIL_Y + 20, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      return { ...s, img, state: 'hang' };
    });
  }

  _buildGates() {
    this._gates = GATES.map(g => {
      const marker = this.add.image(g.x, GROUND_Y - 100, 'l9_glow').setScale(0.7).setAlpha(0.5).setDepth(8).setTint(0xffe6a0);
      const paw = this.add.text(g.x, GROUND_Y - 100, '🎄', { fontSize: '24px' }).setOrigin(0.5).setDepth(9);
      this.tweens.add({ targets: [marker, paw], y: GROUND_Y - 110, duration: 720, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.add.text(g.x, GROUND_Y - 64, 'STOP HERE', { fontSize: '9px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#1c4a2e', strokeThickness: 3 }).setOrigin(0.5).setDepth(9);
      return { ...g, done: false, marker, paw };
    });
  }

  update(time) {
    if (this._done || this._paused || this._busy) return;
    const onG = this.runMovement();
    this.updateParallax();
    this._emitDust(onG);
    this._checkGates();
    this._checkCPs();
    this._checkGifts();
    this._checkObstacles(onG);
    this._checkIce();
    this._updateIcicles();
    this._checkDoor();
    this._updateDist(this.player.x);
  }

  _emitDust(onG) {
    const p = this.player;
    if (!onG || Math.abs(p.body.velocity.x) < 30) return;
    if (this.time.now - this._dustT < 90) return;
    this._dustT = this.time.now;
    const dir = this._facing < 0 ? 1 : -1;
    const puff = this.add.image(p.x + dir * 12, GROUND_Y + 6, 'l9_dust').setDepth(8).setAlpha(0.8);
    this.tweens.add({ targets: puff, x: puff.x + dir * 20, y: puff.y - 10, alpha: 0, scale: 1.8, duration: 420, onComplete: () => puff.destroy() });
  }

  _checkGates() {
    for (const g of this._gates) {
      if (g.done) continue;
      if (this.player.x >= g.x) {
        g.done = true; this.player.setVelocityX(0);
        this.registry.set('l9_checkpointX', Math.max(80, g.x - 80));
        this.tweens.add({ targets: [g.marker, g.paw], alpha: 0, duration: 220 });
        this.runActivity(g.key, () => this.toast('✨ Nicely done! Keep collecting gifts!', 1600));
        break;
      }
    }
  }

  _checkCPs() {
    for (const cp of this._cpObjs) {
      if (!cp.triggered && this.player.x > cp.x) {
        cp.triggered = true;
        this.registry.set('l9_checkpointX', Math.max(80, cp.x - 50));
        this.registry.set('l9_checkpointY', GROUND_Y);
        cp.beacon.setAlpha(1); cp.label.setAlpha(1);
        this.tweens.add({ targets: cp.beacon, scale: cp.beacon.scale * 1.15, duration: 200, yoyo: true, repeat: 2 });
        this.sparkleBurst(cp.x, GROUND_Y - 54, 12);
        this.addScore(50);
        this.banner('✅ Checkpoint!');
      }
    }
  }

  _checkGifts() {
    const p = this.player;
    for (let i = 0; i < this._giftObjs.length; i++) {
      const gc = this._giftObjs[i];
      if (gc.taken) continue;
      if (Math.abs(p.x - gc.x) < 44 && Math.abs(p.y - gc.img.y) < 62) {
        gc.taken = true; this._collected++; this._streak++;
        this.registry.set('l9_checkpointX', Math.max(80, p.x - 80));
        const bonus = Math.min(this._streak - 1, 6) * 25;
        this.addScore(150 + bonus);
        this.tweens.killTweensOf(gc.img); this.tweens.killTweensOf(gc.glow);
        this.sparkleBurst(gc.x, gc.img.y, 14);
        try { gc.glow.destroy(); gc.hint?.destroy(); } catch (_) {}
        this._flyToHud(gc.img);
        if (this._streak >= 2) this.popText(gc.x, gc.img.y - 30, `COMBO x${this._streak}!`, '#ffe6a0');
        this._giftHud(this._collected);
        if (this._collected >= GIFTS.length) this.popText(p.x, p.y - 50, 'All gifts found!', '#2f7a4a');
        else this.toast(`🎁 Gift ${this._collected}/${GIFTS.length}!`, 1000);
      }
    }
  }

  _flyToHud(img) {
    const cam = this.cameras.main;
    const flyer = this.add.image(img.x - cam.scrollX, img.y - cam.scrollY, img.texture.key).setScrollFactor(0).setDepth(115).setDisplaySize(46, 46);
    try { img.destroy(); } catch (_) {}
    this.tweens.add({ targets: flyer, x: W / 2, y: 24, scale: flyer.scale * 0.5, duration: 480, ease: 'Cubic.easeIn', onComplete: () => flyer.destroy() });
  }

  _checkObstacles(onG) {
    if (this._invuln || this._done) return;
    const p = this.player;
    for (const o of this._obs) {
      const hw = o.spr.displayWidth / 2 + 12;
      if (Math.abs(p.x - o.x) < hw && p.body.bottom > o.clearY + 4) {
        const dir = (p.x <= o.x) ? -1 : 1;
        p.setPosition(o.x + dir * (o.spr.displayWidth / 2 + 28), p.y);
        p.setVelocityX(dir * 150); p.setVelocityY(-180);
        this.cameras.main.shake(160, 0.01);
        this._streak = 0;
        this.loseLife();
        if (!this._done) this.toast('💥 Jump over it! (W or ↑)', 1500);
        return;
      }
    }
  }

  _checkIce() {
    if (this._invuln || this._done) return;
    const p = this.player;
    for (const a of this._ice) {
      if (Math.abs(p.x - a.x) < 42 && p.body.bottom > GROUND_Y - 6) {
        this._streak = 0;
        const dir = this._facing < 0 ? 1 : -1; p.setVelocity(dir * 130, -170);
        this.loseLife();
        if (!this._done) this.toast('🧊 Jump over the ice!', 1400);
        return;
      }
    }
  }

  _updateIcicles() {
    const p = this.player;
    for (const s of this._icicles) {
      if (s.state === 'hang' && Math.abs(p.x - s.x) < 40 && p.x < s.x) {
        s.state = 'falling';
        this.tweens.killTweensOf(s.img);
        this.tweens.add({ targets: s.img, y: GROUND_Y - 16, duration: 500, ease: 'Quad.easeIn', onComplete: () => {
          this.cameras.main.shake(100, 0.005); s.state = 'done'; this.sparkleBurst(s.x, GROUND_Y - 16, 6);
          this.tweens.add({ targets: s.img, alpha: 0, duration: 400, onComplete: () => s.img.destroy() });
        }});
      }
      if (s.state === 'falling' && !this._invuln && Phaser.Math.Distance.Between(p.x, p.y, s.img.x, s.img.y + 20) < 32) {
        this._streak = 0;
        const dir = this._facing < 0 ? 1 : -1; p.setVelocity(dir * 130, -170);
        this.loseLife();
        if (!this._done) this.toast('🧊 Falling icicle — keep moving!', 1400);
      }
    }
  }

  _checkDoor() {
    if (this.player.x >= WORLD_W - 110) this._finish();
  }

  _finish() {
    if (this._done) return;
    this._done = true;
    this.player.setVelocity(0, 0); this._setPose('idle');
    this.cameras.main.flash(400, 255, 240, 200);
    this.sparkleBurst(this.cameras.main.scrollX + W / 2, H / 2, 24, false);
    const cx = this.cameras.main.scrollX;
    [0.25, 0.5, 0.75].forEach((fx, i) => this.time.delayedCall(i * 220, () => this.confetti(cx + W * fx, 100)));
    this.addScore(200);
    const ov = this.add.rectangle(W / 2, H / 2, W, H, 0x1c4a2e, 0).setScrollFactor(0).setDepth(110);
    this.tweens.add({ targets: ov, alpha: 0.5, duration: 500 });
    this.add.text(W / 2, H / 2 - 24, '🎁 All Gifts Collected!', { fontSize: '28px', fontFamily: 'Georgia, serif', color: '#ffe6a0', stroke: '#0a1a0e', strokeThickness: 5 }).setOrigin(0.5).setScrollFactor(0).setDepth(111);
    this.add.text(W / 2, H / 2 + 16, `Gifts: ${this._collected}/${GIFTS.length}  ·  Time to open them!`, { fontSize: '13px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#0a1a0e', strokeThickness: 3 }).setOrigin(0.5).setScrollFactor(0).setDepth(111);
    // remember how many gifts were collected for the unwrap scene
    this.registry.set('l9_gifts', this._collected);
    this.time.delayedCall(2000, () => this.goToScene('L9_Unwrap'));
  }
}
