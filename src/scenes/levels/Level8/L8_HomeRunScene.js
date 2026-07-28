import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { L8BaseScene } from './L8BaseScene.js';
import { generateL8Assets } from './L8Assets.js';
import { preloadGlendaSkin } from './L8_GlendaSkin.js';

const WORLD_W = 6200;
const GROUND_Y = 380;

// ════════════════════════════════════════════════════════════════════════════
// STAGE 5+6 — RUN & COLLECT CHRISTMAS PROPS  →  RETURN HOME
// A second sunny run. Same JUMP/SLIDE skills, this time gathering the 6
// Christmas decorations for the puppies' home. Collect them all, then head
// home — the Magic Bag Reveal (L8_Decorate) unpacks them one by one.
// ════════════════════════════════════════════════════════════════════════════
// Mini-activities fire on collecting specific items (not on walking past a
// position marker) — `activity` names which one, see L8_Activities.ACTIVITY_META.
const PROPS_DIR = 'christmas props/';
const ITEMS = [
  { x: 480,  tex: 'l8_prop_garland',   label: 'Garland',        high: false },
  { x: 1100, tex: 'l8_prop_tree',      label: 'Christmas Tree', high: true,  activity: 'bonus_1' },
  { x: 1780, tex: 'l8_prop_wreath',    label: 'Wreath',         high: false },
  { x: 2600, tex: 'l8_prop_stockings', label: 'Stockings',      high: true  },
  { x: 3300, tex: 'l8_prop_lights',    label: 'Fairy Lights',   high: false, activity: 'bonus_2' },
  { x: 4000, tex: 'l8_prop_lantern',   label: 'Lantern',        high: true  },
];

// Ground obstacles only — jump over, no slide in Level 8 (the old branch/
// banner overhead hazards needed sliding under, so they're gone).
const OBSTACLES = [
  { x: 700,  tex: 'l8_obs_pot',     type: 'ground', h: 62 },
  { x: 1950, tex: 'l8_obs_crate',   type: 'ground', h: 56 },
  { x: 4100, tex: 'l8_obs_pot',     type: 'ground', h: 62 },
  { x: 4600, tex: 'l8_obs_crate',   type: 'ground', h: 56 },
  { x: 5750, tex: 'l8_obs_pot',     type: 'ground', h: 62 },
];

// Fall-through ground holes (Level-2/6 style) — walk/jump-mistimed into one
// and you lose a life, same as Level 6's pits. hw = half-width of the gap.
const PITS = [
  { x: 2900, hw: 80 },
];

// Checkpoint flags — this run had NO visual checkpoint markers at all before
// (only a silent registry save on each prop pickup); adds real, visible
// checkpoint_flag.png landmarks + a save/reveal moment, same pattern as the
// Food Run. Positions picked clear of ITEMS/OBSTACLES/PITS above so the flag
// never sits dead-center on top of another sprite.
const CP_XS = [1550, 2350, 3900, 5000];

// Each ground-obstacle PNG has a chunk of transparent canvas padding below
// the actual visible art (measured from the source alpha channel — the real
// artwork ends well above the canvas edge), as a fraction of the image's
// native height. Anchoring these sprites bottom-first via setDisplaySize
// alone puts that padding at the very bottom of the display box, so the
// object visibly floats above the path; nudging each one down by
// (fraction × its display height) puts its real base flush on the ground.
// Overhead obstacles (branch/balloon/banner) hang from the top by design and
// don't need this.
const OBS_BOTTOM_PAD = {
  l8_obs_pot:   0.060,
  l8_obs_crate: 0.134,
};

export class L8_HomeRunScene extends L8BaseScene {
  constructor() { super('L8_HomeRun'); }

  preload() {
    preloadGlendaSkin(this);
    const B  = 'assets/images/level8/';
    const CP = `${B}${PROPS_DIR}`;
    const OB = `${B}obstacle/`;
    const load = (k, path) => { if (!this.textures.exists(k)) this.load.image(k, path); };

    // background + surface — reuses Level 9's sky/ground art. The old
    // `bg-l8.jpg` / `bottom-l8.jpg` here were byte-for-byte the SAME as Level 9's
    // huge unoptimized "-original" files (14.5MB / 1.97MB — a leftover from when
    // L9's raw art was copied in as a placeholder), so this scene was silently
    // downloading a ~16MB duplicate every time. Pointing at L9's actual final,
    // compressed art (718KB / 94KB) fixes the bloat AND matches Level 9's look.
    // Unique keys (not the shared l8_bg/l8_surface L8_FoodRunScene uses) so
    // this scene's own art always loads, regardless of preload order.
    load('l8_home_bg',      'assets/images/level 09/bg-l9.jpg');
    load('l8_home_surface', 'assets/images/level 09/bottom-l9.jpg');

    load('l8_prop_garland',   `${CP}03.png`);
    load('l8_prop_tree',      `${CP}04.png`);
    load('l8_prop_wreath',    `${CP}05.png`);
    load('l8_prop_stockings', `${CP}06.png`);
    load('l8_prop_lights',    `${CP}07.png`);
    load('l8_prop_lantern',   `${CP}08.png`);

    load('l8_obs_pot',     `${OB}l8_obs_pot.png`);
    load('l8_obs_crate',   `${OB}l8_obs_crate.png`);
    load('l8_house',       `${OB}l8_house.png`);
  }

  create() {
    generateL8Assets(this);
    this.physics.world.setBounds(0, 0, WORLD_W, H + 200);
    this.cameras.main.setBounds(0, 0, WORLD_W, H);
    this.cameras.main.fadeIn(220, 0, 0, 0);

    this._collected = 0;
    this._done = false;
    this._groundY = GROUND_Y;   // needed by buildSky() before buildGround()

    this.buildSky('l8_home_bg');
    this.buildGround(WORLD_W, GROUND_Y, PITS, 'l8_home_surface');
    this._buildDecor();
    this._buildCPs();
    this._buildItems();
    this._buildObstacles();
    this.buildPlayer(80, GROUND_Y, 250, -470);
    this._groundY = GROUND_Y;
    this.registry.set('l8_checkpointX', 80);
    this.registry.set('l8_checkpointY', GROUND_Y);
    this.cameras.main.startFollow(this.player, false, 0.1, 0.1);

    this.buildTopBanner(5, 'Run & Collect Christmas Props', 'JUMP — grab all 6 decorations!', { timer: 90 });
    this._buildPropPanel();

    this.time.delayedCall(400, () => this.toast('🎁 Collect 6 Christmas props! A/D or ←/→ = Move, W/↑/SPACE = Jump'));
  }

  // ── HUD: prop collection panel — same "collecting modal" look as the Food
  // Run's food panel (dark rounded bar, dimmed icon slots that light up with
  // a ✓ as each one is collected), so both runs share one consistent theme.
  // Width fixed to a 50px pad from each side of the screen (W-100), same as
  // the Food Run panel, so all 6 prop icons always fit without spilling out.
  _buildPropPanel() {
    const PW = W - 100, PH = 68;
    const px = W / 2 - PW / 2, py = (this._hdr?.bottom ?? 68) + 6;
    // Real wood/gold board (ui_life_bg) — same "collecting modal" art as the
    // approved Theme Design reference (ThemeDesignScene's checkpoint+items
    // section), replacing the old flat dark-graphics panel.
    this.add.image(W / 2, py + PH / 2, 'ui_life_bg').setDisplaySize(PW, PH)
      .setScrollFactor(0).setDepth(60);
    this.add.text(W / 2, py + 13, '🎄  Collect 6 Christmas Props!', {
      fontSize: '11px', fontFamily: 'Georgia, serif', color: '#f5c87a', stroke: '#1a0904', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(61);
    // Prop slots — evenly spread with a 20px gap from the panel's left/right
    // edges, each icon at its own aspect ratio (shared helper on L8BaseScene).
    this._layoutCollectSlots(ITEMS, px, py, PW);
  }

  // ── Fly the collected prop from world-space into its HUD slot — same
  // flourish as the Food Run's _flyToCounter, for a matching feel.
  _flyToCounter(it, i) {
    const cam = this.cameras.main;
    const sl = this._slots[i];
    const flyer = this.add.image(it.x - cam.scrollX, it.img.y - cam.scrollY, it.tex)
      .setScrollFactor(0).setDepth(115).setDisplaySize(60, 60);
    try { it.img.destroy(); } catch (_) {}
    const tx = sl ? sl.icon.x : W / 2;
    const ty = sl ? sl.icon.y : 40;
    const endScale = flyer.scale * (30 / 60);
    this.tweens.add({
      targets: flyer, y: flyer.y - 40, duration: 180, ease: 'Quad.easeOut',
      onComplete: () => this.tweens.add({
        targets: flyer, x: tx, y: ty, scale: endScale, duration: 380, ease: 'Cubic.easeIn',
        onComplete: () => {
          flyer.destroy();
          if (sl) {
            sl.icon.setAlpha(1);
            sl.chk.setText('✓').setColor('#66ff88').setFontSize('13px');
            const sx = sl.icon.scaleX, sy = sl.icon.scaleY;
            this.tweens.add({ targets: sl.icon, scaleX: { from: sx * 1.7, to: sx }, scaleY: { from: sy * 1.7, to: sy }, duration: 320, ease: 'Back.easeOut' });
          }
        }
      })
    });
  }

  _buildDecor() {
    const img = this.textures.get('l8_house').getSourceImage();
    const w = 178 * (img.width / img.height);
    this.add.image(6000, GROUND_Y + 8, 'l8_house').setOrigin(0.5, 1).setDisplaySize(w, 178).setDepth(3);
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
      // No name label above the prop — keep it a surprise until the Magic Bag
      // reveals it back at the Decorate scene. Jump hint stays (it's a control
      // cue, not a spoiler of which prop this is).
      if (it.high) this.add.text(it.x, y + 34, '⬆ jump', { fontSize: '9px', color: '#fff', stroke: '#6a3fa0', strokeThickness: 2 }).setOrigin(0.5).setDepth(9);
      return { ...it, img, glow, taken: false };
    });
  }

  // Every obstacle is a ground hazard now (jump over) — no overhead/slide type.
  _buildObstacles() {
    this._obsObjs = OBSTACLES.map(o => {
      const img = this.textures.get(o.tex).getSourceImage();
      const w = o.h * (img.width / img.height);
      // Planted on the floor with a soft contact shadow (matches the FoodRun
      // look). Centre-anchored on a slightly lower ground line (GROUND_Y+24)
      // so it sits near the bottom instead of floating.
      const baseY = GROUND_Y + 24;
      const pad = (OBS_BOTTOM_PAD[o.tex] || 0) * o.h;
      const sh = this.add.graphics({ x: o.x, y: baseY }).setDepth(10);
      sh.fillStyle(0x000000, 0.22); sh.fillEllipse(0, 0, w + 16, 11);
      const spr = this.add.image(o.x, baseY - o.h / 2 + pad, o.tex)
        .setOrigin(0.5, 0.5).setDisplaySize(w, o.h).setDepth(11);
      return { ...o, spr, clearY: baseY - o.h - 6, w };
    });
  }

  update() {
    if (this._done || this._paused || this._miniGameOpen) return;
    const onG = this.runMovement();
    this.updateParallax();
    this._checkCPs();
    this._checkItems();
    this._checkObstacles(onG);
    this._checkPits();
    if (this.player.x > WORLD_W - 240) this._finish();
  }

  // ── Checkpoint flags (dimmed until triggered) — real checkpoint_flag.png,
  // same art/size/anchoring as every other level's checkpoints. Was entirely
  // missing from this run before (checkpoints only saved silently on prop
  // pickup, with no visible landmark). ───────────────────────────────────────
  _buildCPs() {
    this._cpObjs = CP_XS.map((x, i) => {
      const flag  = this.add.image(x, GROUND_Y + 16, 'checkpoint_flag')
        .setDisplaySize(56, 139).setOrigin(0.5, 1).setDepth(5).setAlpha(0.28);
      const label = this.add.text(x, GROUND_Y - 96, `CP ${i + 1}`, {
        fontSize: '9px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#6a3fa0', strokeThickness: 2
      }).setOrigin(0.5).setDepth(5).setAlpha(0.28);
      return { x, flag, label, triggered: false, idx: i + 1 };
    });
  }

  _checkCPs() {
    for (const cp of this._cpObjs) {
      if (!cp.triggered && this.player.x > cp.x) {
        cp.triggered = true;
        this._hitCP(cp);
      }
    }
  }

  _hitCP(cp) {
    this.registry.set('l8_checkpointX', Math.max(80, cp.x - 50));
    this.registry.set('l8_checkpointY', GROUND_Y);
    cp.flag.setAlpha(1); cp.label.setAlpha(1);
    this.tweens.add({
      targets: cp.flag, y: cp.flag.y - 14, duration: 320, ease: 'Back.easeOut',
      onComplete: () => this.tweens.add({
        targets: cp.flag, y: cp.flag.y + 8, duration: 200, yoyo: true, repeat: 2
      })
    });
    this.sparkleBurst(cp.x, GROUND_Y - 64, 14);
    this.addScore(50);
    this.banner('✅ Checkpoint Reached!', '#6ad06a');
    this.toast(`Checkpoint ${cp.idx} / ${CP_XS.length} — Keep going! 🎄`, 1800);
  }

  _checkItems() {
    const p = this.player;
    for (let i = 0; i < this._itemObjs.length; i++) {
      const it = this._itemObjs[i];
      if (it.taken) continue;
      if (Math.abs(p.x - it.x) < 50 && Math.abs(p.y - it.img.y) < 70) {
        it.taken = true;
        this._collected++;
        this.registry.set('l8_checkpointX', Math.max(80, p.x - 100));
        this.registry.set('l8_checkpointY', this._groundY);
        this.tweens.killTweensOf(it.img); this.tweens.killTweensOf(it.glow); it.glow.destroy();
        this.sparkleBurst(it.x, it.img.y, 10);
        this.addScore(120);
        this._flyToCounter(it, i);
        // Mini-activity fires on collecting specific items (never by walking
        // past a position marker) — see ITEMS' `activity` field above.
        if (it.activity) {
          this.player.setVelocity(0, 0);
          this.runActivity(it.activity, () => {
            if (this._collected >= ITEMS.length) this._finish();
            else this.toast('💪 Nice! Keep collecting — A/D to move', 1600);
          });
        } else if (this._collected >= ITEMS.length) {
          this._finish();
        } else {
          this.toast(`✓ ${it.label}! (${this._collected}/${ITEMS.length})`, 1200);
        }
      }
    }
  }

  _checkObstacles(onG) {
    if (this._invuln || this._done) return;
    const p = this.player;
    for (const o of this._obsObjs) {
      if (Math.abs(p.x - o.x) > 40) continue;
      const hit = p.body.bottom > o.clearY + 4;
      if (hit) {
        p.setVelocityY(-180); p.x -= 14;
        this.cameras.main.shake(160, 0.01);
        this.loseLife();
        if (!this._done) this.toast('💥 ↑ JUMP to leap over!', 1600);
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
    this.add.text(W / 2, H / 2 + 18, 'Time to unpack the magic bag! 🎄', {
      fontSize: '15px', fontFamily: 'Georgia, serif', color: '#fff3d0', stroke: '#3a1a5a', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(111);
    this.time.delayedCall(1700, () =>
      this.playStoryVideos(['l8_decorate_home_reach'], () => this.goToScene('L8_Decorate'))
    );
  }
}
