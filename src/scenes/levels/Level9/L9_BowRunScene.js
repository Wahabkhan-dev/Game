import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { L9BaseScene, L9 } from './L9BaseScene.js';
import { generateL9Assets } from './L9Assets.js';
import { preloadGlendaSkin } from './L9_GlendaSkin.js';

// ════════════════════════════════════════════════════════════════════════════
// LEVEL 9 — PART 2 · STAGE 1: "Bow Run"  🎀
//
// Gleeda runs back through the snowy street to collect 7 different BOWS — one for
// each puppy. Same controls & feel as the Gift Run, with a fresh obstacle layout
// and one festive mini-activity stop. When all 7 bows are gathered she reaches
// the cottage door → the Bow-Tie finale.
// ════════════════════════════════════════════════════════════════════════════

const WORLD_W  = 5600;
const GROUND_Y = 380;
const CEIL_Y   = 60;

// 7 bows (one per puppy) — all ground-level (floating snow-ledge platforms removed).
// One carries an `activity` key — the mini-activity fires on COLLECTING that
// specific bow (never by walking past a separate position marker), same
// pattern Level 8's Food/Home Run already use.
const BOWS = [
  { x: 420,  tex: 'l9_bow_red',    high: false },
  { x: 1000, tex: 'l9_bow_green',  high: false },
  { x: 1650, tex: 'l9_bow_gold',   high: false },
  { x: 2400, tex: 'l9_bow_blue',   high: false },
  { x: 3150, tex: 'l9_bow_pink',   high: false, activity: 'catch_snow' },
  { x: 3900, tex: 'l9_bow_purple', high: false },
  { x: 4650, tex: 'l9_bow_silver', high: false },
];

const GROUND_OBS = [
  { x: 720,  tex: 'l9_giftstack', h: 62 },
  { x: 1300, tex: 'l9_snowball',  h: 54 },
  { x: 1950, tex: 'l9_snowman',   h: 74 },
  { x: 2700, tex: 'l9_giftstack', h: 62 },
  { x: 3450, tex: 'l9_snowball',  h: 54 },
  { x: 4200, tex: 'l9_snowman',   h: 74 },
  { x: 5000, tex: 'l9_giftstack', h: 62 },
];

const ICICLES = [{ x: 2150 }, { x: 4450 }];

const CP_XS = [1200, 2600, 4000];

export class L9_BowRunScene extends L9BaseScene {
  constructor() { super('L9_BowRun'); }

  preload() {
    preloadGlendaSkin(this);
    // Real bg/ground art — same fit-height/tile technique as Level 4/8. Loaded
    // here too (not just in L9_GiftRunScene) since this scene can run first.
    const load = (k, path) => { if (!this.textures.exists(k)) this.load.image(k, path); };
    load('l9_sky',      'assets/images/level 09/bg-l9.jpg');
    load('l9_ground',   'assets/images/level 09/bottom-l9.jpg');
    load('l9_bow',      'assets/images/level 09/Bow.png');
  }

  create() {
    generateL9Assets(this);
    this.physics.world.setBounds(0, 0, WORLD_W, H + 220);
    this.cameras.main.setBounds(0, 0, WORLD_W, H);
    this.cameras.main.fadeIn(220, 0, 0, 0);

    this._collected = 0; this._done = false; this._streak = 0; this._dustT = 0;
    this._groundY = GROUND_Y;

    this.buildSnowyBg(WORLD_W);
    this.buildGround(WORLD_W, GROUND_Y);
    this._buildSigns();
    this._buildCPs();
    this._buildBows();
    this._buildObstacles();
    this._buildIcicles();

    this.buildPlayer(80, GROUND_Y, 250, -470);
    this.registry.set('l9_checkpointX', 80); this.registry.set('l9_checkpointY', GROUND_Y);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    this.buildTopBanner('LEVEL 9', 'BOW RUN', null, { timer: 90 });
    this._bowHud = this.buildCounterPill('🎀', 'BOWS', BOWS.length);
    this._updateDist = this.buildDistanceBar(WORLD_W, CP_XS);

    this._door = this.add.image(WORLD_W - 90, GROUND_Y - 78, 'l9_door').setDisplaySize(104, 156).setDepth(3);
    this.add.text(WORLD_W - 90, GROUND_Y - 168, '🏡 HOME', {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#0a1a0e', strokeThickness: 4,
      backgroundColor: '#1c4a2e', padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setDepth(6);

    this.time.delayedCall(400, () => this.toast('🎀 Collect 7 bows — one for each puppy!\nA/D move · W jump · S slide', 3000));
  }

  _buildSigns() {
    const sign = (x, txt) => this.add.text(x, GROUND_Y - 150, txt, {
      fontSize: '11px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#0a1a0e', strokeThickness: 3,
      backgroundColor: '#1c4a2ecc', padding: { x: 6, y: 3 }
    }).setOrigin(0.5).setDepth(6);
    sign(300,  '🎀 RIBBON ROW');
    sign(2900, '❄️ SNOW STOP');
    sign(4900, '✨ ALMOST HOME');
  }

  _buildCPs() {
    this._cpObjs = CP_XS.map((x, i) => {
      // Real checkpoint_flag.png (same art/size/anchoring as every other
      // level's checkpoints) instead of the old procedural 'l9_cp' beacon.
      const beacon = this.add.image(x, GROUND_Y + 16, 'checkpoint_flag').setDisplaySize(56, 139).setOrigin(0.5, 1).setDepth(5).setAlpha(0.4);
      // Label raised to clear the taller flag's top (was tuned for the old
      // 68px-tall beacon; checkpoint_flag.png is 139px tall).
      const label = this.add.text(x, GROUND_Y - 138, `CP ${i + 1}`, { fontSize: '9px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#1c4a2e', strokeThickness: 2 }).setOrigin(0.5).setDepth(5).setAlpha(0.4);
      return { x, beacon, label, triggered: false, idx: i + 1 };
    });
  }

  _buildBows() {
    const src = this.textures.get('l9_bow').getSourceImage();
    const bowH = 40, bowW = Math.round(bowH * (src.width / src.height));
    this._bowObjs = BOWS.map(bc => {
      const y = bc.high ? GROUND_Y - 128 : GROUND_Y - 44;
      const glow = this.add.image(bc.x, y, 'l9_glow').setScale(0.55).setAlpha(0.35).setDepth(7).setTint(0xffe6a0);
      this.tweens.add({ targets: glow, alpha: 0.6, scale: 0.8, duration: 800, yoyo: true, repeat: -1 });
      const img = this.add.image(bc.x, y, 'l9_bow').setDepth(9).setDisplaySize(bowW, bowH);
      this.tweens.add({ targets: img, y: y - 10, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      // No jump-hint text above high bows — removed per request.
      return { ...bc, img, glow, hint: null, taken: false, y };
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

  _buildIcicles() {
    this._icicles = ICICLES.map(s => {
      const img = this.add.image(s.x, CEIL_Y + 16, 'l9_icicle').setDisplaySize(26, 56).setOrigin(0.5, 0).setDepth(11);
      this.tweens.add({ targets: img, y: CEIL_Y + 20, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      return { ...s, img, state: 'hang' };
    });
  }

  update() {
    if (this._done || this._paused || this._busy || this._miniGameOpen) return;
    const onG = this.runMovement();
    this.updateParallax();
    this._emitDust(onG);
    this._checkCPs();
    this._checkBows();
    this._checkObstacles(onG);
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

  _checkBows() {
    const p = this.player;
    for (let i = 0; i < this._bowObjs.length; i++) {
      const bc = this._bowObjs[i];
      if (bc.taken) continue;
      if (Math.abs(p.x - bc.x) < 44 && Math.abs(p.y - bc.img.y) < 60) {
        bc.taken = true; this._collected++; this._streak++;
        this.registry.set('l9_checkpointX', Math.max(80, p.x - 80));
        this.addScore(150 + Math.min(this._streak - 1, 6) * 25);
        this.tweens.killTweensOf(bc.img); this.tweens.killTweensOf(bc.glow);
        this.sparkleBurst(bc.x, bc.img.y, 14);
        try { bc.glow.destroy(); bc.hint?.destroy(); } catch (_) {}
        this._flyToHud(bc.img);
        if (this._streak >= 2) this.popText(bc.x, bc.img.y - 30, `COMBO x${this._streak}!`, '#ffe6a0');
        this._bowHud(this._collected);
        // Mini-activity fires on collecting the specific bow (never by walking
        // past a separate position marker) — see BOWS' `activity` field above.
        if (bc.activity) {
          this.player.setVelocityX(0);
          this.runActivity(bc.activity, () => {
            if (this._collected >= BOWS.length) this.popText(p.x, p.y - 50, 'All bows found!', '#2f7a4a');
            else this.toast('✨ Lovely! Keep collecting bows!', 1600);
          });
        } else if (this._collected >= BOWS.length) {
          this.popText(p.x, p.y - 50, 'All bows found!', '#2f7a4a');
        } else {
          this.toast(`🎀 Bow ${this._collected}/${BOWS.length}!`, 1000);
        }
      }
    }
  }

  _flyToHud(img) {
    const cam = this.cameras.main;
    const flyer = this.add.image(img.x - cam.scrollX, img.y - cam.scrollY, img.texture.key).setScrollFactor(0).setDepth(115).setDisplaySize(48, 40);
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
        this._streak = 0; this.loseLife();
        if (!this._done) this.toast('💥 Jump over it! (W or ↑)', 1500);
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
    this.add.text(W / 2, H / 2 - 24, '🎀 All Bows Collected!', { fontSize: '28px', fontFamily: 'Georgia, serif', color: '#ffe6a0', stroke: '#0a1a0e', strokeThickness: 5 }).setOrigin(0.5).setScrollFactor(0).setDepth(111);
    this.add.text(W / 2, H / 2 + 16, `Now let's dress up the 7 puppies! 🐶`, { fontSize: '13px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#0a1a0e', strokeThickness: 3 }).setOrigin(0.5).setScrollFactor(0).setDepth(111);
    this.registry.set('l9_bows', this._collected);
    this.time.delayedCall(2000, () =>
      this.playStoryVideos(['l9_part2'], () => this.goToScene('L9_BowTie'))
    );
  }
}
