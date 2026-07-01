import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { L8BaseScene } from './L8BaseScene.js';
import { generateL8Assets } from './L8Assets.js';

const WORLD_W = 6200;
const GROUND_Y = 380;

// ════════════════════════════════════════════════════════════════════════════
// STAGE 5+6 — RUN & COLLECT HOME ITEMS  →  RETURN HOME
// A second sunny run. Same JUMP/SLIDE skills, this time gathering the 8 things
// the puppies' new home needs. Collect them all, then head home to decorate.
// (The 8 items map 1:1 to the decorate slots, matching the ITEMS COLLECTED panel.)
// ════════════════════════════════════════════════════════════════════════════
const ITEMS = [
  { x: 480,  tex: 'l8_item_bed',          label: 'Bed',           high: false },
  { x: 1100, tex: 'l8_item_foodstation',  label: 'Food Station',  high: true  },
  { x: 1780, tex: 'l8_item_waterstation', label: 'Water Station', high: false },
  { x: 2600, tex: 'l8_item_toybasket',    label: 'Toy Basket',    high: true  },
  { x: 3300, tex: 'l8_item_picture',      label: 'Wall Picture',  high: false },
  { x: 4000, tex: 'l8_item_plant',        label: 'Plant',         high: true  },
  { x: 4750, tex: 'l8_item_rug',          label: 'Rug',           high: false },
  { x: 5500, tex: 'l8_item_tunnel',       label: 'Play Tunnel',   high: true  },
];

const OBSTACLES = [
  { x: 700,  tex: 'l8_obs_pot',     type: 'ground',   h: 62 },
  { x: 1300, tex: 'l8_obs_branch',  type: 'overhead', h: 58 },
  { x: 1950, tex: 'l8_obs_crate',   type: 'ground',   h: 56 },
  { x: 2350, tex: 'l8_obs_balloon', type: 'overhead', h: 84 },
  { x: 2900, tex: 'l8_obs_puddle',  type: 'ground',   h: 28, flat: true },
  { x: 3550, tex: 'l8_obs_banner',  type: 'overhead', h: 52 },
  { x: 4100, tex: 'l8_obs_pot',     type: 'ground',   h: 62 },
  { x: 4600, tex: 'l8_obs_crate',   type: 'ground',   h: 56 },
  { x: 5200, tex: 'l8_obs_balloon', type: 'overhead', h: 84 },
  { x: 5750, tex: 'l8_obs_pot',     type: 'ground',   h: 62 },
];

// ── Mid-run mini-activity gates ─────────────────────────────────────────────
// Change `key` or move `x` — nothing else needs to change.
// Keys reference L8_Activities.ACTIVITY_META.
const ACTIVITY_GATES = [
  { x: 1450, key: 'where_goes' },   // Home-design stop — match item to room spot
  { x: 3200, key: 'clean_home' },   // Cleaning stop — tap mud blobs before timer
  { x: 5100, key: 'build_bed'  },   // Bed-building stop — tap parts in order
];

export class L8_HomeRunScene extends L8BaseScene {
  constructor() { super('L8_HomeRun'); }

  preload() {
    const B  = 'assets/images/level8/';
    const HI = `${B}home-item/`;
    const OB = `${B}obstacle/`;
    const load = (k, path) => { if (!this.textures.exists(k)) this.load.image(k, path); };

    load('l8_bg',      `${B}l8_bg.png`);
    load('l8_surface', `${B}l8_surface.png`);

    load('l8_item_bed',          `${HI}l8_item_bed.png`);
    load('l8_item_foodstation',  `${HI}l8_item_foodstation.png`);
    load('l8_item_waterstation', `${HI}l8_item_waterstation.png`);
    load('l8_item_toybasket',    `${HI}l8_item_toybasket.png`);
    load('l8_item_picture',      `${HI}l8_item_picture.png`);
    load('l8_item_plant',        `${HI}l8_item_plant.png`);
    load('l8_item_rug',          `${HI}l8_item_rug.png`);
    load('l8_item_tunnel',       `${HI}l8_item_tunnel.png`);

    load('l8_obs_pot',     `${OB}l8_obs_pot.png`);
    load('l8_obs_branch',  `${OB}l8_obs_branch.png`);
    load('l8_obs_crate',   `${OB}l8_obs_crate.png`);
    load('l8_obs_balloon', `${OB}l8_obs_balloon.png`);
    load('l8_obs_puddle',  `${OB}l8_obs_puddle.png`);
    load('l8_obs_banner',  `${OB}l8_obs_banner.png`);
    load('l8_house',       `${OB}l8_house.png`);
  }

  create() {
    generateL8Assets(this);
    this.physics.world.setBounds(0, 0, WORLD_W, H + 200);
    this.cameras.main.setBounds(0, 0, WORLD_W, H);
    this.cameras.main.fadeIn(600, 0, 0, 0);

    this._collected = 0;
    this._done = false;
    this._groundY = GROUND_Y;   // needed by buildSky() before buildGround()

    this.buildSky();
    this.buildGround(WORLD_W, GROUND_Y);
    this._buildDecor();
    this._buildItems();
    this._buildObstacles();
    this._buildGates();
    this.buildPlayer(80, GROUND_Y, 250, -470);
    this._groundY = GROUND_Y;
    this.registry.set('l8_checkpointX', 80);
    this.registry.set('l8_checkpointY', GROUND_Y);
    this.cameras.main.startFollow(this.player, false, 0.1, 0.1);

    this.buildTopBanner(5, 'Run & Collect Home Items', 'JUMP & SLIDE — grab all 8 home things!');
    this.buildHearts();
    this.buildScore();
    this._setCount = this.buildCounterPill('🧺', 'ITEMS COLLECTED', ITEMS.length);

    this.time.delayedCall(400, () => this.toast('🏡 Collect 8 home items! A/D or ←/→ = Move, W/↑/SPACE = Jump, S/↓ = Slide'));
  }

  _buildDecor() {
    const place = (x, tex, h, depth = 4) => {
      const img = this.textures.get(tex).getSourceImage();
      const w = h * (img.width / img.height);
      this.add.image(x, GROUND_Y + 8, tex).setOrigin(0.5, 1).setDisplaySize(w, h).setDepth(depth);
    };
    [320, 1180, 2050, 2950, 3760, 4680, 5400].forEach((x, i) => place(x, i % 2 ? 'l8_item_plant' : 'l8_obs_pot', 64, 3));
    place(6000, 'l8_house', 178, 3);
    this.add.text(6000, GROUND_Y - 188, '🏠 HOME', {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#6a3fa0', stroke: '#fff', strokeThickness: 3
    }).setOrigin(0.5).setDepth(6);
  }

  _buildItems() {
    this._itemObjs = ITEMS.map(it => {
      const y = it.high ? GROUND_Y - 120 : GROUND_Y - 50;
      const glow = this.add.circle(it.x, y, 30, 0xfff0a0, 0.22).setDepth(7);
      this.tweens.add({ targets: glow, alpha: 0.45, scale: 1.25, duration: 800, yoyo: true, repeat: -1 });
      const img = this.add.image(it.x, y, it.tex).setDepth(9).setDisplaySize(60, 60);
      this.tweens.add({ targets: img, y: y - 10, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.add.text(it.x, y - 38, it.label, {
        fontSize: '10px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#3a1a5a', strokeThickness: 3
      }).setOrigin(0.5).setDepth(9);
      if (it.high) this.add.text(it.x, y + 34, '⬆ jump', { fontSize: '9px', color: '#fff', stroke: '#6a3fa0', strokeThickness: 2 }).setOrigin(0.5).setDepth(9);
      return { ...it, img, glow, taken: false };
    });
  }

  _buildObstacles() {
    this._obsObjs = OBSTACLES.map(o => {
      const img = this.textures.get(o.tex).getSourceImage();
      const w = o.h * (img.width / img.height);
      if (o.type === 'overhead') {
        const y = GROUND_Y - 70;
        const spr = this.add.image(o.x, y, o.tex).setOrigin(0.5, 0).setDisplaySize(w, o.h).setDepth(12);
        this.tweens.add({ targets: spr, y: y - 4, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        return { ...o, spr };
      }
      const y = GROUND_Y + 16;
      const spr = this.add.image(o.x, y, o.tex).setOrigin(0.5, 1).setDisplaySize(w, o.h).setDepth(11);
      return { ...o, spr, clearY: y - o.h - 6, w };
    });
  }

  update() {
    if (this._done) return;
    const onG = this.runMovement();
    this.updateParallax();
    this._checkGates();
    this._checkItems();
    this._checkObstacles(onG);
    if (this.player.x > WORLD_W - 240) this._finish();
  }

  _buildGates() {
    this._gates = ACTIVITY_GATES.map(g => {
      // a little "care stop" flag so the player can see it coming
      const flag = this.add.text(g.x, GROUND_Y - 96, '🐾', { fontSize: '26px' })
        .setOrigin(0.5).setDepth(8);
      this.tweens.add({ targets: flag, y: flag.y - 8, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.add.text(g.x, GROUND_Y - 64, 'CARE STOP', {
        fontSize: '10px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#6a3fa0', strokeThickness: 3
      }).setOrigin(0.5).setDepth(8);
      return { ...g, done: false, flag };
    });
  }

  _checkGates() {
    if (this._busy) return;
    for (const g of this._gates) {
      if (g.done) continue;
      if (this.player.x >= g.x) {
        g.done = true;
        this.player.setVelocity(0, 0);
        this.registry.set('l8_checkpointX', Math.max(80, g.x - 100));
        this.registry.set('l8_checkpointY', this._groundY);
        this.tweens.add({ targets: g.flag, scale: 0, alpha: 0, duration: 250 });
        // launch the swappable activity; resume the run when it's done
        this.runActivity(g.key, () => this.toast('💪 Nice! Keep collecting — A/D to move', 1600));
        break;
      }
    }
  }

  _checkItems() {
    const p = this.player;
    for (const it of this._itemObjs) {
      if (it.taken) continue;
      if (Math.abs(p.x - it.x) < 50 && Math.abs(p.y - it.img.y) < 70) {
        it.taken = true;
        this._collected++;
        this.registry.set('l8_checkpointX', Math.max(80, p.x - 100));
        this.registry.set('l8_checkpointY', this._groundY);
        this.tweens.killTweensOf(it.img); this.tweens.killTweensOf(it.glow); it.glow.destroy();
        this.sparkleBurst(it.x, it.img.y, 10);
        this.addScore(120);
        this._setCount(this._collected);
        const endSc = it.img.scaleX * 0.4;
        this.tweens.add({ targets: it.img, y: it.img.y - 50, scale: endSc, alpha: 0, duration: 420, onComplete: () => it.img.destroy(), ease: 'Cubic.easeIn' });
        if (this._collected >= ITEMS.length) this._finish();
        else this.toast(`✓ ${it.label}! (${this._collected}/${ITEMS.length})`, 1200);
      }
    }
  }

  _checkObstacles(onG) {
    if (this._invuln || this._done) return;
    const p = this.player;
    for (const o of this._obsObjs) {
      if (Math.abs(p.x - o.x) > 40) continue;
      let hit = false;
      if (o.type === 'overhead') {
        const grounded = p.body.blocked.down || p.body.touching.down;
        hit = grounded && !this._sliding;
      } else {
        hit = p.body.bottom > o.clearY + 4;
      }
      if (hit) {
        p.setVelocityY(-180); p.x -= 14;
        this.cameras.main.shake(160, 0.01);
        const tip = o.type === 'overhead' ? '↓ SLIDE to duck under!' : '↑ JUMP to leap over!';
        this.loseLife();
        if (!this._done) this.toast(`💥 ${tip}`, 1600);
        break;
      }
    }
  }

  _finish() {
    if (this._done) return;
    this._done = true; this._running = false;
    if (this.player?.body) this.player.setVelocity(0, 0);
    this.sparkleBurst(this.cameras.main.scrollX + W / 2, H / 2, 22, false);
    const ov = this.add.rectangle(W / 2, H / 2, W, H, 0x6a3fa0, 0).setScrollFactor(0).setDepth(110);
    this.tweens.add({ targets: ov, alpha: 0.35, duration: 500 });
    this.add.text(W / 2, H / 2 - 20, '🏡 Back Home!', {
      fontSize: '26px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#3a1a5a', strokeThickness: 5
    }).setOrigin(0.5).setScrollFactor(0).setDepth(111);
    this.add.text(W / 2, H / 2 + 18, 'Time to decorate the puppy home! 🎨', {
      fontSize: '15px', fontFamily: 'Georgia, serif', color: '#fff3d0', stroke: '#3a1a5a', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(111);
    this.time.delayedCall(1700, () => this.goToScene('L8_Decorate'));
  }
}
