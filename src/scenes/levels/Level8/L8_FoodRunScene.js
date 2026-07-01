import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { L8BaseScene } from './L8BaseScene.js';
import { generateL8Assets } from './L8Assets.js';

// ════════════════════════════════════════════════════════════════════════════
// LEVEL 8 — STAGE 1: GLEEDA RUNS THROUGH PUPPY TOWN TO COLLECT FOOD
//
// Mirrors Level 6 runner (L6_EquipmentRunScene) exactly:
//   - Manual A/D + ←/→ movement (no auto-run)
//   - JUMP over ground obstacles, SLIDE under overhead ones
//   - 7 food collectibles with floating + glow FX
//   - Auto-checkpoint every ~900 world units (flag + banner + score)
//   - Level 6 style HUD: food slots top-centre, LIVES top-left,
//     SCORE top-right, distance bar + CP markers bottom
//   - Respawn at latest checkpoint on life loss
// ════════════════════════════════════════════════════════════════════════════

const WORLD_W  = 7000;
const GROUND_Y = 380;
// Obstacles sit flush on the path: their base drops below GROUND_Y so they
// line up with the character's visual feet (same trick as Level 6).
const OBS_BASE_DROP = 16;

// 8 collectibles — alternating ground / high positions across the longer world
const FOOD = [
  { x: 520,  tex: 'l8_food_bag',       label: 'Puppy Food Bag',  high: false },
  { x: 1200, tex: 'l8_food_milk',      label: 'Puppy Milk',      high: true  },
  { x: 1900, tex: 'l8_food_bone',      label: 'Dog Biscuit',     high: false },
  { x: 2700, tex: 'l8_food_bowl',      label: 'Food Bowl',       high: true  },
  { x: 3400, tex: 'l8_food_can',       label: 'Healthy Treat',   high: false },
  { x: 4200, tex: 'l8_food_jar',       label: 'Water Jar',       high: true  },
  { x: 4950, tex: 'l8_food_meat',      label: 'Fresh Meat',      high: false },
  { x: 5900, tex: 'l8_item_toybasket', label: 'Puppy Toy',       high: true  },
];

// Auto-checkpoint markers every ~1000–1500 units over the longer course
const CP_XS = [1000, 2000, 3500, 5000, 6300];

// ── Mini-activity gates (same pattern as Level 2 checkpoints) ─────────────
// Placed between food collectibles to avoid overlapping with obstacles.
// Change `key` to swap which activity runs — see L8_Activities.ACTIVITY_META.
const ACTIVITY_GATES = [
  { x: 1380, key: 'good_food'  },   // Pet-shop stop — pick safe puppy foods
  { x: 2950, key: 'count_pups' },   // Park stop — count 7 hungry puppies
  { x: 4550, key: 'spell_puppy'},   // Market stop — spell P-U-P-P-Y
  { x: 6300, key: 'match_food' },   // Final stretch — memory match food pairs
];

// ALL hurdles sit ON the surface and are cleared by JUMPING (same as Level 6).
// 10 obstacles across the longer 7000-unit world for tighter difficulty.
const OBS_GROUND = [
  { x: 800,  tex: 'l8_obs_pot',    h: 60 },
  { x: 1500, tex: 'l8_obs_branch', h: 50 },
  { x: 2250, tex: 'l8_obs_toybox', h: 52 },
  { x: 2700, tex: 'l8_obs_crate',  h: 54 },
  { x: 3150, tex: 'l8_obs_pot',    h: 60 },
  { x: 3750, tex: 'l8_obs_puddle', h: 26, flat: true },
  { x: 4350, tex: 'l8_obs_crate',  h: 54 },
  { x: 5100, tex: 'l8_obs_branch', h: 50 },
  { x: 5600, tex: 'l8_obs_toybox', h: 52 },
  { x: 6500, tex: 'l8_obs_pot',    h: 60 },
];

export class L8_FoodRunScene extends L8BaseScene {
  constructor() { super('L8_FoodRun'); }

  // ── Preload ALL Level 8 real PNGs here (first scene, always runs first).
  //    generateL8Assets() is guarded by l8_ready so it only runs once — all
  //    real PNGs must be in the texture manager BEFORE that first call so the
  //    procedural fallbacks are skipped for every key that has a real image.
  preload() {
    const B  = 'assets/images/level8/';
    const F  = `${B}food/`;
    const HI = `${B}home-item/`;
    const OB = `${B}obstacle/`;
    const load = (k, path) => { if (!this.textures.exists(k)) this.load.image(k, path); };

    // background + surface (Level 6 art, kept in root)
    load('l8_bg',      `${B}l8_bg.png`);
    load('l8_surface', `${B}l8_surface.png`);

    // food collectibles (Food Run + Feeding scene)
    load('l8_food_bag',  `${F}l8_food_bag.png`);
    load('l8_food_milk', `${F}l8_food_milk.png`);
    load('l8_food_bone', `${F}l8_food_bone.png`);
    load('l8_food_bowl', `${F}l8_food_bowl.png`);
    load('l8_food_can',  `${F}l8_food_can.png`);
    load('l8_food_jar',  `${F}l8_food_jar.png`);
    load('l8_food_meat', `${F}l8_food_meat.png`);

    // home items (Home Run collectibles + Decorate scene)
    load('l8_item_bed',          `${HI}l8_item_bed.png`);
    load('l8_item_foodstation',  `${HI}l8_item_foodstation.png`);
    load('l8_item_waterstation', `${HI}l8_item_waterstation.png`);
    load('l8_item_toybasket',    `${HI}l8_item_toybasket.png`);
    load('l8_item_picture',      `${HI}l8_item_picture.png`);
    load('l8_item_plant',        `${HI}l8_item_plant.png`);
    load('l8_item_rug',          `${HI}l8_item_rug.png`);
    load('l8_item_tunnel',       `${HI}l8_item_tunnel.png`);

    // obstacles + misc props
    load('l8_obs_pot',     `${OB}l8_obs_pot.png`);
    load('l8_obs_branch',  `${OB}l8_obs_branch.png`);
    load('l8_obs_toybox',  `${OB}l8_obs_toybox.png`);
    load('l8_obs_crate',   `${OB}l8_obs_crate.png`);
    load('l8_obs_puddle',  `${OB}l8_obs_puddle.png`);
    load('l8_obs_banner',  `${OB}l8_obs_banner.png`);
    load('l8_obs_balloon', `${OB}l8_obs_balloon.png`);
    load('l8_cp_flag',     `${OB}l8_cp_flag.png`);
    load('l8_house',       `${OB}l8_house.png`);
  }

  // ── create ──────────────────────────────────────────────────────────────────
  create() {
    generateL8Assets(this);  // procedural fallbacks for any missing textures

    this.physics.world.setBounds(0, 0, WORLD_W, H + 200);
    this.cameras.main.setBounds(0, 0, WORLD_W, H);
    this.cameras.main.fadeIn(600, 0, 0, 0);

    this._collected = 0;
    this._done      = false;
    this._streak    = 0;          // collect combo (resets when hit)
    this._dustT     = 0;          // running-dust throttle
    this._groundY   = GROUND_Y;   // needed by buildSky() before buildGround()

    // ── world ────────────────────────────────────────────────────────────────
    this.buildSky();
    this.buildGround(WORLD_W, GROUND_Y);
    this._buildDecor();
    this._buildCPs();
    this._buildFood();
    this._buildObstacles();
    this._buildGates();

    // ── player (Level 6 manual movement via L8BaseScene) ────────────────────
    this.buildPlayer(80, GROUND_Y, 250, -470);
    this._groundY = GROUND_Y;
    this.registry.set('l8_checkpointX', 80);
    this.registry.set('l8_checkpointY', GROUND_Y);

    // tight-lerp follow matching Level 6
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // ── HUD (Level 6 layout) ─────────────────────────────────────────────────
    this.buildHearts();       // top-left: HP hearts + lives (L8BaseScene)
    this._buildFoodPanel();   // top-centre: 7 food collection slots
    this._buildScorePause();  // top-right: score badge + pause button
    this._buildDistBar();     // bottom: distance bar + checkpoint markers

    this.time.delayedCall(400, () =>
      this.toast('🐾 Collect 7 foods for the puppies!\nA/D = Move   W/↑/SPACE = Jump over hurdles')
    );
  }

  // ── Puppy Town zone signs + finish marker ──────────────────────────────────
  // (Garden cottages/flowers are already painted into the Level-6 background,
  //  so we only add light themed signage — no duplicate procedural props.)
  _buildDecor() {
    const sign = (x, txt) => this.add.text(x, GROUND_Y - 110, txt, {
      fontSize: '11px', fontFamily: 'Georgia, serif', color: '#fff',
      stroke: '#3a1a5a', strokeThickness: 3, backgroundColor: '#6a3fa0cc', padding: { x: 6, y: 3 }
    }).setOrigin(0.5).setDepth(6);
    sign(920,  '🛒 PET SHOP');
    sign(2100, '🌳 PUPPY PARK');
    sign(3600, '🏪 MARKET');
    sign(5100, '🏡 HOME ZONE');
    sign(6550, '✨ FINAL STRETCH');
    // finish marker at the far end
    this.add.text(WORLD_W - 140, GROUND_Y - 150, '🏠 HOME', {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#fff',
      stroke: '#3a1a5a', strokeThickness: 4, backgroundColor: '#6a3fa0', padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setDepth(6);
  }

  // ── Checkpoint flags (dimmed until triggered) ───────────────────────────────
  _buildCPs() {
    this._cpObjs = CP_XS.map((x, i) => {
      this.add.rectangle(x, GROUND_Y - 38, 4, 76, 0x6e4a26).setDepth(5);
      const flag  = this.add.image(x + 22, GROUND_Y - 68, 'l8_cp_flag')
        .setDisplaySize(40, 50).setDepth(5).setAlpha(0.28);
      const label = this.add.text(x + 6, GROUND_Y - 96, `CP ${i + 1}`, {
        fontSize: '9px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#6a3fa0', strokeThickness: 2
      }).setOrigin(0.5).setDepth(5).setAlpha(0.28);
      return { x, flag, label, triggered: false, idx: i + 1 };
    });
  }

  // ── Food collectibles ───────────────────────────────────────────────────────
  _buildFood() {
    this._foodObjs = FOOD.map(f => {
      const y = f.high ? GROUND_Y - 118 : GROUND_Y - 48;
      const glow = this.add.circle(f.x, y, 28, 0xfff0a0, 0.22).setDepth(7);
      this.tweens.add({ targets: glow, alpha: 0.45, scale: 1.25, duration: 800, yoyo: true, repeat: -1 });
      const img = this.add.image(f.x, y, f.tex).setDepth(9).setDisplaySize(52, 52);
      this.tweens.add({ targets: img, y: y - 10, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const label = this.add.text(f.x, y - 36, f.label, {
        fontSize: '10px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#3a1a5a', strokeThickness: 3
      }).setOrigin(0.5).setDepth(9);
      const hint = f.high ? this.add.text(f.x, y + 30, '⬆ jump', {
        fontSize: '9px', color: '#fff', stroke: '#6a3fa0', strokeThickness: 2
      }).setOrigin(0.5).setDepth(9) : null;
      return { ...f, img, glow, label, hint, taken: false };
    });
  }

  // ── Obstacles (centred on the path, grounded with a soft shadow) ───────────
  _buildObstacles() {
    const baseY = GROUND_Y + OBS_BASE_DROP;   // visual ground line for feet/props

    // Ground hazards — JUMP over. Origin-centred sprite sitting on a shadow.
    this._gObjs = OBS_GROUND.map(o => {
      const src = this.textures.get(o.tex).getSourceImage();
      const w   = o.h * (src.width / src.height);
      // soft contact shadow so it reads as planted on the path
      const sh = this.add.graphics({ x: o.x, y: baseY }).setDepth(10);
      sh.fillStyle(0x000000, 0.22); sh.fillEllipse(0, 0, w + 16, 11);
      const spr = this.add.image(o.x, baseY - o.h / 2, o.tex)
        .setOrigin(0.5, 0.5).setDisplaySize(w, o.h).setDepth(11);
      // gentle idle bob (skip flat puddles)
      if (!o.flat) this.tweens.add({
        targets: spr, y: spr.y - 3, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
      return { ...o, spr, w, clearY: baseY - o.h - 6 };
    });
  }

  // ── HUD: food collection panel (top-centre, Level 6 style) ─────────────────
  _buildFoodPanel() {
    const PW = 476, PH = 68;
    const px = W / 2 - PW / 2, py = 4;
    const bg = this.add.graphics().setScrollFactor(0).setDepth(60);
    bg.fillStyle(0x1a0904, 0.88); bg.fillRoundedRect(px, py, PW, PH, 11);
    bg.lineStyle(2, 0xf5c87a, 0.85); bg.strokeRoundedRect(px, py, PW, PH, 11);
    this.add.text(W / 2, py + 13, '🐾  Collect 8 Foods for the Puppies!', {
      fontSize: '11px', fontFamily: 'Georgia, serif', color: '#f5c87a', stroke: '#1a0904', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(61);
    // centred food slots
    const spacing = 58;
    const startX  = px + PW / 2 - ((FOOD.length - 1) * spacing) / 2;
    this._slots = FOOD.map((f, i) => {
      const ix = startX + i * spacing, iy = py + 48;
      const icon = this.add.image(ix, iy, f.tex).setDisplaySize(30, 26)
        .setScrollFactor(0).setDepth(61).setAlpha(0.32);
      const chk  = this.add.text(ix, iy + 16, '·', {
        fontSize: '10px', fontFamily: 'Georgia, serif', color: '#7a8898'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(62);
      return { icon, chk };
    });
  }

  // ── HUD: score + pause (top-right) ─────────────────────────────────────────
  _buildScorePause() {
    this._score = this.registry.get('l8_score') ?? 0;
    const bg = this.add.graphics().setScrollFactor(0).setDepth(60);
    bg.fillStyle(0x1a0904, 0.72); bg.fillRoundedRect(W - 138, 4, 130, 28, 7);
    bg.lineStyle(1, 0x5a3010, 0.6); bg.strokeRoundedRect(W - 138, 4, 130, 28, 7);
    this._scoreTxt = this.add.text(W - 86, 18, `SCORE ${this._score}`, {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: '#ffe08a'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(61);
    const pb = this.add.text(W - 22, 18, '⏸', { fontSize: '22px' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(61).setInteractive({ useHandCursor: true });
    pb.on('pointerdown', () => this.togglePause());
    this._escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this._escKey.on('down', () => this.togglePause());
  }

  // ── HUD: distance bar + CP triangle markers (bottom) ───────────────────────
  _buildDistBar() {
    const bx = 100, bw = W - 200, by = H - 18;
    const dBg = this.add.graphics().setScrollFactor(0).setDepth(60);
    dBg.fillStyle(0x1a0904, 0.65); dBg.fillRoundedRect(bx - 2, by - 2, bw + 4, 14, 6);
    this._dFill = this.add.graphics().setScrollFactor(0).setDepth(61);
    this._dBx = bx; this._dBw = bw; this._dBy = by;
    // checkpoint triangle markers along the bar
    CP_XS.forEach(cpx => {
      const rx = bx + (cpx / WORLD_W) * bw;
      const mg = this.add.graphics().setScrollFactor(0).setDepth(62);
      mg.fillStyle(0x4adb6a, 0.9);
      mg.fillTriangle(rx, by - 2, rx - 5, by + 10, rx + 5, by + 10);
    });
    this._dLabel = this.add.text(W / 2, by - 14, 'Distance: 0 m', {
      fontSize: '9px', fontFamily: 'Georgia, serif', color: '#c8e8c8', stroke: '#1a0904', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(62);
  }

  // ── update ──────────────────────────────────────────────────────────────────
  update() {
    if (this._done || this._paused) return;
    const onG = this.runMovement();  // L8BaseScene manual left/right + jump/slide
    this.updateParallax();
    this._emitDust(onG);
    this._checkGates();
    this._checkCPs();
    this._checkFood();
    this._checkObstacles(onG);
    this._updateDist();
  }

  // ── Running dust puffs kicked up behind the player's feet ──────────────────
  _emitDust(onG) {
    const p = this.player;
    if (!onG || Math.abs(p.body.velocity.x) < 30) return;
    if (this.time.now - this._dustT < 90) return;
    this._dustT = this.time.now;
    const dir = this._facing < 0 ? 1 : -1;
    const puff = this.add.circle(p.x + dir * 12, GROUND_Y + 14, Phaser.Math.Between(3, 6), 0xe8dcc0, 0.7).setDepth(8);
    this.tweens.add({
      targets: puff, x: puff.x + dir * 22, y: puff.y - 10, alpha: 0, scale: 1.8,
      duration: 420, ease: 'Sine.easeOut', onComplete: () => puff.destroy()
    });
  }

  // ── Mini-activity gates — pause the run, play activity, resume ──────────────
  _buildGates() {
    this._gates = ACTIVITY_GATES.map(g => {
      // visible paw-print marker so player sees the stop coming
      const marker = this.add.text(g.x, GROUND_Y - 100, '🐾', { fontSize: '24px' })
        .setOrigin(0.5).setDepth(8);
      this.tweens.add({ targets: marker, y: marker.y - 8, duration: 720, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.add.text(g.x, GROUND_Y - 66, 'STOP HERE', {
        fontSize: '9px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#6a3fa0', strokeThickness: 3
      }).setOrigin(0.5).setDepth(8);
      return { ...g, done: false, marker };
    });
  }

  _checkGates() {
    if (this._busy) return;
    for (const g of this._gates) {
      if (g.done) continue;
      if (this.player.x >= g.x) {
        g.done = true;
        this.player.setVelocityX(0);
        this.registry.set('l8_checkpointX', Math.max(80, g.x - 80));
        this.registry.set('l8_checkpointY', GROUND_Y);
        this.tweens.add({ targets: g.marker, alpha: 0, duration: 220 });
        this.runActivity(g.key, () =>
          this.toast('🐾 Great job! Keep collecting food! A/D to move', 1600)
        );
        break;
      }
    }
  }

  // ── Auto-checkpoints: trigger once when player crosses each x ──────────────
  _checkCPs() {
    for (const cp of this._cpObjs) {
      if (!cp.triggered && this.player.x > cp.x) {
        cp.triggered = true;
        this._hitCP(cp);
      }
    }
  }

  _hitCP(cp) {
    // save respawn position just before this checkpoint
    this.registry.set('l8_checkpointX', Math.max(80, cp.x - 50));
    this.registry.set('l8_checkpointY', GROUND_Y);
    // reveal & animate the flag
    cp.flag.setAlpha(1); cp.label.setAlpha(1);
    this.tweens.add({
      targets: cp.flag, y: cp.flag.y - 14, duration: 320, ease: 'Back.easeOut',
      onComplete: () => this.tweens.add({
        targets: cp.flag, y: cp.flag.y + 8, duration: 200, yoyo: true, repeat: 2
      })
    });
    this.sparkleBurst(cp.x, GROUND_Y - 64, 14);
    this._confetti(cp.x, GROUND_Y - 90);
    this.addScore(50);
    this.banner('✅ Checkpoint Reached!', '#6ad06a');
    this.toast(`Checkpoint ${cp.idx} / ${CP_XS.length} — Keep going! 🐾`, 1800);
  }

  // ── Colourful confetti burst (world-space) for celebrations ────────────────
  _confetti(x, y) {
    const cols = [0xff7a8a, 0x6ab0ee, 0xfff06a, 0x8fd86a, 0xff9ec4, 0x9a73c4];
    for (let i = 0; i < 18; i++) {
      const a = -Math.PI / 2 + Phaser.Math.FloatBetween(-1, 1);
      const sp = Phaser.Math.Between(40, 110);
      const bit = this.add.rectangle(x, y, Phaser.Math.Between(4, 7), Phaser.Math.Between(6, 10),
        cols[i % cols.length]).setDepth(40).setAngle(Phaser.Math.Between(0, 360));
      this.tweens.add({
        targets: bit,
        x: x + Math.cos(a) * sp,
        y: y + Math.sin(a) * sp + Phaser.Math.Between(30, 70),
        angle: bit.angle + Phaser.Math.Between(180, 540),
        alpha: 0, duration: Phaser.Math.Between(700, 1100), ease: 'Quad.easeIn',
        onComplete: () => bit.destroy()
      });
    }
  }

  // ── Food collection ─────────────────────────────────────────────────────────
  _checkFood() {
    const p = this.player;
    for (let i = 0; i < this._foodObjs.length; i++) {
      const f = this._foodObjs[i];
      if (f.taken) continue;
      if (Math.abs(p.x - f.x) < 48 && Math.abs(p.y - f.img.y) < 68) {
        f.taken = true;
        this._collected++;
        this._streak++;
        // update checkpoint to just before this collectible
        this.registry.set('l8_checkpointX', Math.max(80, p.x - 80));
        this.registry.set('l8_checkpointY', GROUND_Y);
        // combo-scaled score: 150 base + 25 per streak step (capped)
        const bonus = Math.min(this._streak - 1, 6) * 25;
        this.addScore(150 + bonus);
        // burst + remove world objects / floating text
        this.tweens.killTweensOf(f.img); this.tweens.killTweensOf(f.glow);
        this.sparkleBurst(f.x, f.img.y, 14);
        try { f.glow.destroy(); f.label?.destroy(); f.hint?.destroy(); } catch (_) {}
        // ── fly the item up into its HUD inventory slot ─────────────────────
        this._flyToCounter(f, i);
        // streak popup for a sense of momentum
        if (this._streak >= 2) this._popText(f.x, f.img.y - 30, `COMBO x${this._streak}!`, '#ffd23a');
        if (this._collected >= FOOD.length) this._allCollected();
        else this.toast(`✓ ${f.label}!  (${this._collected} / ${FOOD.length})`, 1100);
      }
    }
  }

  // ── Fly the collected item from world-space into its HUD slot ───────────────
  _flyToCounter(f, i) {
    const cam = this.cameras.main;
    const sl  = this._slots[i];
    // screen-space copy of the item (locked to camera so it tracks the HUD)
    const flyer = this.add.image(f.x - cam.scrollX, f.img.y - cam.scrollY, f.tex)
      .setScrollFactor(0).setDepth(115).setDisplaySize(52, 52);
    try { f.img.destroy(); } catch (_) {}
    const tx = sl ? sl.icon.x : W / 2;
    const ty = sl ? sl.icon.y : 40;
    const endScale = flyer.scale * (30 / 52); // shrink to match HUD slot icon (30px)
    // little arc: pop up, then swoop into the slot
    this.tweens.add({
      targets: flyer, y: flyer.y - 40, duration: 180, ease: 'Quad.easeOut',
      onComplete: () => this.tweens.add({
        targets: flyer, x: tx, y: ty, scale: endScale, duration: 380, ease: 'Cubic.easeIn',
        onComplete: () => {
          flyer.destroy();
          if (sl) {
            sl.icon.setAlpha(1);
            sl.chk.setText('✓').setColor('#66ff88').setFontSize('13px');
            // bounce relative to the icon's current display scale (not absolute 1.0)
            const sx = sl.icon.scaleX, sy = sl.icon.scaleY;
            this.tweens.add({ targets: sl.icon, scaleX: { from: sx * 1.7, to: sx }, scaleY: { from: sy * 1.7, to: sy }, duration: 320, ease: 'Back.easeOut' });
          }
        }
      })
    });
  }

  // ── Floating score / combo popup that rises and fades ──────────────────────
  _popText(x, y, msg, color = '#ffffff') {
    const t = this.add.text(x, y, msg, {
      fontSize: '13px', fontFamily: 'Georgia, serif', color,
      stroke: '#3a1a5a', strokeThickness: 3
    }).setOrigin(0.5).setDepth(40);
    this.tweens.add({ targets: t, y: y - 34, alpha: 0, scale: 1.25, duration: 750, ease: 'Quad.easeOut', onComplete: () => t.destroy() });
  }

  // ── Obstacle detection — all hurdles sit on the floor, cleared by JUMPING ──
  _checkObstacles(onG) {
    if (this._invuln || this._done) return;
    const p = this.player;
    for (const o of this._gObjs) {
      const hw = o.spr.displayWidth / 2 + 14;
      // only a hit if the player is low enough (not cleared by a jump)
      if (Math.abs(p.x - o.x) < hw && p.body.bottom > o.clearY + 4) {
        const dir = (p.x <= o.x) ? -1 : 1;
        p.setPosition(o.x + dir * (o.spr.displayWidth / 2 + 30), p.y);
        p.setVelocityX(dir * 160); p.setVelocityY(-180);
        this.cameras.main.shake(160, 0.01);
        this._streak = 0;   // combo broken
        this.loseLife();
        if (!this._done) this.toast('💥 Jump over it! (W or ↑)', 1600);
        return;
      }
    }
  }

  // ── Distance bar update ─────────────────────────────────────────────────────
  _updateDist() {
    if (!this._dFill) return;
    const pct = Math.min(1, (this.player?.x || 0) / WORLD_W);
    const fw   = Math.max(0, pct * this._dBw);
    this._dFill.clear();
    if (fw > 0) {
      this._dFill.fillStyle(0x9a73c4, 0.8);
      this._dFill.fillRoundedRect(this._dBx, this._dBy, fw, 10, 5);
    }
    this._dLabel?.setText(`Distance: ${Math.floor(pct * 500)} m`);
  }

  // ── Override addScore to drive our custom score text ───────────────────────
  addScore(n) {
    if (this._score == null) this._score = this.registry.get('l8_score') ?? 0;
    this._score += n;
    this.registry.set('l8_score', this._score);
    if (this._scoreTxt) {
      this._scoreTxt.setText(`SCORE ${this._score}`);
      this.tweens.add({ targets: this._scoreTxt, scale: { from: 1.3, to: 1 }, duration: 250, ease: 'Back.easeOut' });
    }
  }

  // ── All 7 foods collected → celebrate → feed the puppies ───────────────────
  _allCollected() {
    if (this._done) return;
    this._done = true;
    if (this.player?.body) this.player.setVelocity(0, 0);
    this._setPose && this._setPose('idle');
    this.sparkleBurst(this.cameras.main.scrollX + W / 2, H / 2, 28, false);
    const cx = this.cameras.main.scrollX;
    // a few confetti volleys across the screen for a big finish
    [0.25, 0.5, 0.75].forEach((fx, i) =>
      this.time.delayedCall(i * 220, () => this._confetti(cx + W * fx, 90)));
    const ov = this.add.rectangle(W / 2, H / 2, W, H, 0x6a3fa0, 0).setScrollFactor(0).setDepth(110);
    this.tweens.add({ targets: ov, alpha: 0.45, duration: 500 });
    const big = this.add.text(W / 2, H / 2 - 28, '🎉 Great Job!', {
      fontSize: '32px', fontFamily: 'Georgia, serif', color: '#ffd23a', stroke: '#3a1a5a', strokeThickness: 5
    }).setOrigin(0.5).setScrollFactor(0).setDepth(111);
    this.tweens.add({ targets: big, scale: { from: 0.4, to: 1 }, duration: 450, ease: 'Back.easeOut' });
    this.add.text(W / 2, H / 2 + 18, 'You collected enough food for all the puppies! 🐾', {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#fff3d0', stroke: '#3a1a5a', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(111);
    this.time.delayedCall(2000, () => this.goToScene('L8_Feeding'));
  }
}
