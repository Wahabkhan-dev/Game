import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { L7BaseScene } from './L7BaseScene.js';
import { generateL7Assets } from './L7Assets.js';
import { preloadGlendaSkin } from './L7_GlendaSkin.js';
import { drawModalPanelBg } from '../ModalFrame.js';
import { buildStandardHeader, openGameMenuModal, THEME } from '../../../hud/premium/PremiumTheme.js';
import { playVideoSequence, showStoryCard } from '../../../utils/VideoOverlay.js';
import { launchRandomMiniGame } from '../../../utils/MiniGamePicker.js';
import { showLevelCompleteModal } from '../../../utils/EndModals.js';

// ════════════════════════════════════════════════════════════════════════════
// L7CombinedScene — ALL 5 LEVEL 7 STAGES IN ONE CONTINUOUS WORLD
// No scene.start() transitions. Player walks through all zones continuously.
// Videos (l7_v1 through l7_v7) play at zone boundaries but stay in same scene.
// ════════════════════════════════════════════════════════════════════════════

// World coordinates
const STAGE1_X = 0,        STAGE1_W = 1900;
const STAGE2_X = 2000,     STAGE2_W = 2000;
const STAGE3_X = 4100,     STAGE3_W = 3000;
const STAGE4_X = 7200,     STAGE4_W = 9600;
const STAGE5_X = 17000,    STAGE5_W = 2000;
const TOTAL_WORLD_W = 19000;

const S1_GROUND_Y = 400;
const S2_GROUND_Y = 398;
const S3_GROUND_Y = 408;
const S3_BG_SEAM_Y = 404;
const S4_GROUND_Y = Math.round(H * 0.82);
const S4_ROAD_H = H - S4_GROUND_Y;
const S4_DRIVE_Y = S4_GROUND_Y + 52;
const S4_CAR_X = STAGE4_X + 200;

const S4_CFG = {
  TOTAL: 9600, MAX: 6.4, ACCEL: 0.22, FRICTION: 0.10, BRAKE: 0.42,
  SAFE_CLOSE: 2.3, DMG: 24, SLOW: 1.7, ZONE: 34, DISPLAY_MAX_SPEED: 80,
  BREAKERS: [1500, 2900, 5400, 8600],
  SIGNALS: [2100, 4400, 7700],
  BLOCKS: [3500, 6900],
  QTES: [4900, 8100],
  CLIMB: 6200,
  HOSPITAL: 9600,
};

export class L7CombinedScene extends L7BaseScene {
  constructor() { super('L7Combined'); }

  init(data) { console.log('[L7Combined] init()', data); }

  preload() {
    console.log('[L7Combined] preload() start');
    preloadGlendaSkin(this);

    // Stage 1 assets
    ['l7_s1_bg', 'l7_s1_floor', 'l7_s1_window', 'l7_s1_basement', 'l7_fusebox', 'l7_keyfrag', 'l7_key'].forEach(k => {
      if (!this.textures.exists(k)) this.load.image(k, `assets/images/Level7/Stage1/${k}.png`);
    });

    // Stage 2 assets
    ['l7_s2_bg', 'l7_jeep_side', 'l7_jeep_fixed', 'l7_tire', 'l7_tire_flat', 'l7_jack', 'l7_wrench', 'l7_patchkit', 'l7_lugnut', 'l7_patch'].forEach(k => {
      if (this.textures.exists(k)) this.textures.remove(k);
      this.load.image(k, `assets/images/Level7/Stage2/${k}.png`);
    });

    // Stage 3 assets
    ['l7_s3_station', 'l7_barrel', 'l7_generator', 'l7_barrier', 'l7_pipe_straight', 'l7_pipe_elbow', 'l7_fuelcan'].forEach(k => {
      if (this.textures.exists(k)) this.textures.remove(k);
      this.load.image(k, `assets/images/Level7/Stage3/${k}.png`);
    });

    // Stage 4 assets
    if (!this.textures.exists('l7_jeep_fixed')) this.load.image('l7_jeep_fixed', 'assets/images/Level7/Stage2/l7_jeep_fixed.png');
    if (!this.textures.exists('l3_car')) this.load.image('l3_car', 'assets/images/Level 3/l3_car.png');
    const s4 = 'assets/images/Level 7/Stage4/';
    if (!this.textures.exists('l7s4_bg')) this.load.image('l7s4_bg', `${s4}city-bg.png`);
    if (!this.textures.exists('l7s4_road')) this.load.image('l7s4_road', `${s4}road-bottom.png`);
    if (!this.textures.exists('l7_fallentree')) this.load.image('l7_fallentree', `${s4}fallentree.png`);
    for (let i = 1; i <= 9; i++) {
      const key = `l7s4_car_${i}`;
      if (!this.textures.exists(key)) this.load.image(key, `${s4}car/frame_${String(i).padStart(3, '0')}.png`);
    }

    // Stage 5 assets
    if (!this.textures.exists('l7_s5_puppy_basket')) this.load.image('l7_s5_puppy_basket', 'assets/images/Level 5/treatment/puppy_in_basket.png');

    // Level 7 story videos (all 7 transition videos)
    const videoPath = 'assets/video/Level 7/';
    const videos = ['Part 01', 'Part 02', 'Part 03', 'Part 04', 'Part 05', 'Part 06', 'Part 07'];
    videos.forEach((name, i) => {
      const key = `l7_v${i + 1}`;
      if (!this.cache.video.exists(key)) {
        this.load.video(key, `${videoPath}${name}.mp4`);
      }
    });

    this.load.on('loaderror', (file) => console.error(`[L7Combined] loaderror ${file?.key} @ ${file?.src}`));
  }

  create() {
    console.log('[L7Combined] create() start');
    generateL7Assets(this);

    this.physics.world.setBounds(0, 0, TOTAL_WORLD_W, H + 200);
    this.cameras.main.setBounds(0, 0, TOTAL_WORLD_W, H);
    this.cameras.main.fadeIn(220, 0, 0, 0);
    this.cameras.main.setBackgroundColor('#0a0e16');

    // Global state
    this._lives = this.registry.get('lives') ?? 3;
    this._videosPlayed = {};
    this._paused = false;
    this._busy = false;

    // Stage 1
    this._s1_fragments = 0;
    this._s1_stationsDone = { power: false, basement: false };
    this._s1_powerOn = false;
    this._s1_assembled = false;

    // Stage 2
    this._s2_step = 0;

    // Stage 3
    this._s3_fuel = 0;
    this._s3_stationsDone = {};

    // Stage 4
    this._s4_distance = 0;
    this._s4_speed = 0;
    this._s4_hp = 3;
    this._s4_done = false;
    this._s4_blocking = false;
    this._s4_invuln = false;
    this._s4_rain = [];

    // Stage 5
    this._s5_task = 0;
    this._s5_taskObjs = [];

    // Build all stages
    this._buildStage1World();
    this._buildStage1Ground();
    this._buildStage1Stations();

    this._buildStage2World();
    this._buildStage2Ground();

    this._buildStage3World();
    this._buildStage3Ground();
    this._buildStage3Stations();

    this._buildStage4Background();
    this._buildStage4Road();
    this._buildStage4Car();
    this._buildStage4Hurdles();
    this._buildStage4Rain();

    this._buildStage5World();

    // Unified player
    this._buildPlayer();
    this.buildStageHUD(1, 'Level 7: Full Journey', ['Find Key', 'Fix Tire', 'Fuel Up', 'Drive Safe', 'Treat Puppies']);
    this.buildFog(18, 0.18);
    this.startLightning();

    // Intro video
    this.playStoryVideos(['l7_v1'], () => {
      this.toast('🏠 Walk right through all 5 areas to save the puppies →', 3400);
    });

    console.log('[L7Combined] create() done');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STAGE 1: HOUSE
  // ══════════════════════════════════════════════════════════════════════════

  _buildStage1World() {
    const scale = H / 768;
    this._s1_bg = this.add.tileSprite(STAGE1_X + STAGE1_W / 2, H / 2, STAGE1_W, H, 'l7_s1_bg').setDepth(-10);
    this._s1_bg.tileScaleX = this._s1_bg.tileScaleY = scale;

    this._s1_dark = this.add.rectangle(W / 2, H / 2, W, H, 0x0a1024, 0.6).setScrollFactor(0).setDepth(40);
    this._s1_dark.setBlendMode(Phaser.BlendModes.MULTIPLY);
  }

  _buildStage1Ground() {
    const ftex = this.textures.get('l7_s1_floor');
    if (ftex && !ftex.has('strip')) {
      const sw = ftex.getSourceImage().width, sh = ftex.getSourceImage().height;
      ftex.add('strip', 0, Math.round(sw * 0.12), Math.round(sh * 0.40), Math.round(sw * 0.76), Math.round(sh * 0.22));
    }
    const floorTop = S1_GROUND_Y - 4;
    const floor = this.add.tileSprite(STAGE1_X + STAGE1_W / 2, floorTop + 30, STAGE1_W, 60, 'l7_s1_floor', 'strip').setDepth(5);
    floor.tileScaleX = floor.tileScaleY = 60 / (this.textures.get('l7_s1_floor').frames.strip?.height || 168);
    this.add.rectangle(STAGE1_X + STAGE1_W / 2, floorTop, STAGE1_W, 4, 0x000000, 0.35).setDepth(5);

    const body = this.add.rectangle(STAGE1_X + STAGE1_W / 2, S1_GROUND_Y + 16, STAGE1_W, 28, 0, 0);
    this.physics.add.existing(body, true);
    this._s1_ground = body;
  }

  _buildStage1Stations() {
    this._s1_stations = [
      { key: 'power',    x: STAGE1_X + 420,  tex: 'l7_fusebox',    dw: 122, dh: 122 * 369 / 677, oy: 0.5, y: 232, label: '⚡ Fuse Box', run: () => this._s1_wirePuzzle() },
      { key: 'basement', x: STAGE1_X + 1560, tex: 'l7_s1_basement',dw: 168, dh: 168 * 369 / 677, oy: 1,   y: S1_GROUND_Y + 10, label: '🚪 Basement', run: () => this._s1_basementPuzzle() },
    ];
    this._s1_stations.forEach(st => {
      st.sprite = this.add.image(st.x, st.y, st.tex).setOrigin(0.5, st.oy).setDisplaySize(st.dw, st.dh).setDepth(9).setInteractive({ useHandCursor: true });
      const gy = st.oy === 1 ? st.y - st.dh / 2 : st.y;
      st.glow = this.add.circle(st.x, gy, 30, 0xffe9a0, 0.22).setDepth(8);
      this.tweens.add({ targets: st.glow, alpha: 0.45, scale: 1.25, duration: 800, yoyo: true, repeat: -1 });
      st.prompt = this.add.text(st.x, gy - st.dh / 2 - 8, `${st.label}\n[E] / tap`, {
        fontSize: '11px', fontFamily: 'Georgia, serif', color: '#fff', align: 'center',
        stroke: '#000', strokeThickness: 3, backgroundColor: '#000a', padding: { x: 6, y: 3 }
      }).setOrigin(0.5).setDepth(30).setVisible(false);
      st.sprite.on('pointerdown', () => { if (this._s1_near === st && !this._busy) this._s1_trigger(st); });
    });
    this._s1_assembleX = STAGE1_X + STAGE1_W - 130;
  }

  _s1_trigger(st) {
    if (this._busy || this._s1_stationsDone[st.key]) return;
    this.player.setVelocity(0, 0);
    const intros = {
      power:    ['⚡', 'Restore the Power', 'Connect each wire to the\nmatching coloured socket.'],
      basement: ['🔦', 'Search the Basement', "It's pitch black — drag the\nflashlight to find the fragment."],
    };
    const [e, t, d] = intros[st.key];
    this.activityIntro(e, t, d, () => st.run());
  }

  _s1_onStationWin(key, objIdx) {
    this._s1_stationsDone[key] = true;
    this.completeObjective(objIdx);
    this._s1_fragments++;
    const st = this._s1_stations.find(s => s.key === key);
    if (st) { st.glow.destroy(); st.prompt.destroy(); }

    if (key === 'power' && !this._s1_powerOn) {
      this._s1_powerOn = true;
      this.cameras.main.flash(350, 255, 235, 170);
      this.tweens.add({ targets: this._s1_dark, fillAlpha: 0.12, duration: 700 });
      this.toast('💡 Power restored!', 2200);
    }

    const frag = this.add.image(this.player.x, S1_GROUND_Y - 90, 'l7_keyfrag').setDisplaySize(48, 30).setDepth(40);
    this.sparkleBurst(frag.x, frag.y, 12);
    this.tweens.add({ targets: frag, x: this.cameras.main.scrollX + 120, y: 70, scale: 0.5, duration: 700, scrollFactorX: 0 });
    this.time.delayedCall(720, () => frag.destroy());
    this.toast(`🗝️ Fragment ${this._s1_fragments}/2!`, 2200);

    if (this._s1_fragments >= 2) {
      this.time.delayedCall(900, () => this.toast('✨ Assemble the key at the end →', 3200));
      this._s1_doorKey = this.add.image(this._s1_assembleX, S1_GROUND_Y - 70, 'l7_keyfrag').setDisplaySize(54, 34).setDepth(20);
      this.tweens.add({ targets: this._s1_doorKey, y: this._s1_doorKey.y - 12, duration: 700, yoyo: true, repeat: -1 });
    }
  }

  _s1_assembleKey() {
    this._s1_assembled = true;
    this._busy = true;
    this.player.setVelocity(0, 0);
    if (this._s1_doorKey) this._s1_doorKey.destroy();
    this.completeObjective(2);
    const key = this.add.image(this.player.x, S1_GROUND_Y - 90, 'l7_key').setScale(0).setDepth(40);
    this.sparkleBurst(key.x, key.y, 20);
    this.tweens.add({ targets: key, scale: 0.5, duration: 600, ease: 'Back.easeOut', yoyo: true, hold: 400, onComplete: () => key.destroy() });
    this.cameras.main.flash(300, 255, 220, 120);
    this.time.delayedCall(700, () => {
      this.registry.set('lives', this._lives);
      this._busy = false;
    });
  }

  _s1_wirePuzzle() {
    const { td, close, px, py, pw, ph } = this.openPanel('⚡ Wire Connection', 'Click a wire, then its matching socket.', { w: 560, h: 320 });
    const colors = [0xff4444, 0x44cc66, 0x4488ff, 0xffcc33];
    const leftY  = [py + 90, py + 150, py + 210, py + 270];
    const order  = Phaser.Utils.Array.Shuffle([0, 1, 2, 3]);
    const rightY = [py + 90, py + 150, py + 210, py + 270];
    const lx = px + 120, rx = px + pw - 120;
    let selected = null, connected = 0;
    const wires = this.add.graphics().setScrollFactor(0).setDepth(102); td.push(wires);
    const links = [];
    const drawLinks = () => {
      wires.clear();
      links.forEach(l => { wires.lineStyle(5, colors[l.c], 1); wires.lineBetween(lx, leftY[l.l], rx, rightY[l.r]); });
    };
    const nodes = [];
    colors.forEach((c, i) => {
      const ln = this.add.circle(lx, leftY[i], 15, c, 1).setScrollFactor(0).setDepth(103).setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0xffffff, 0.5);
      td.push(ln); nodes.push(ln);
      ln.on('pointerdown', () => { if (ln.getData('used')) return; selected = i; ln.setScale(1.3); drawLinks(); });
    });
    order.forEach((c, slot) => {
      const rn = this.add.circle(rx, rightY[slot], 15, c, 1).setScrollFactor(0).setDepth(103).setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0xffffff, 0.5);
      td.push(rn);
      rn.on('pointerdown', () => {
        if (selected === null || rn.getData('used')) return;
        if (selected === c) {
          links.push({ l: selected, r: slot, c });
          rn.setData('used', true); nodes[selected].setData('used', true);
          nodes[selected].setScale(1); connected++; selected = null; drawLinks();
          this.sparkleBurst(rx, rightY[slot], 6, false);
          if (connected >= 4) { this.cameras.main.flash(300, 120, 220, 140); this.time.delayedCall(500, () => { close(); this._s1_onStationWin('power', 0); }); }
        } else {
          this.cameras.main.shake(160, 0.008);
          nodes[selected].setScale(1); selected = null; drawLinks();
        }
      });
    });
    drawLinks();
  }

  _s1_basementPuzzle() {
    const { td, close, px, py, pw, ph } = this.openPanel('🔦 Dark Basement', 'Drag the flashlight to find the key fragment.', { w: 580, h: 330 });
    const maskArea = { x: px + 20, y: py + 70, w: pw - 40, h: ph - 100 };
    const dark = this.add.rectangle(maskArea.x + maskArea.w / 2, maskArea.y + maskArea.h / 2, maskArea.w, maskArea.h, 0x05080c, 1).setScrollFactor(0).setDepth(102); td.push(dark);
    const clutter = this.add.container(0, 0).setScrollFactor(0).setDepth(103); td.push(clutter);
    const addClutter = (x, y, emoji) => { const o = this.add.text(x, y, emoji, { fontSize: '30px' }).setOrigin(0.5).setAlpha(0.12); clutter.add(o); };
    addClutter(maskArea.x + 70, maskArea.y + 60, '📦');
    addClutter(maskArea.x + 200, maskArea.y + 130, '🕸️');
    addClutter(maskArea.x + 360, maskArea.y + 70, '🪑');
    addClutter(maskArea.x + 460, maskArea.y + 150, '🛢️');
    const fragX = maskArea.x + 300, fragY = maskArea.y + 110;
    const frag = this.add.image(fragX, fragY, 'l7_keyfrag').setDisplaySize(54, 34).setScrollFactor(0).setDepth(104).setAlpha(0).setInteractive({ useHandCursor: true }); td.push(frag);
    const beam = this.add.circle(maskArea.x + 80, maskArea.y + 80, 56, 0xffffcc, 0.16).setScrollFactor(0).setDepth(103); td.push(beam);
    const beamCore = this.add.circle(beam.x, beam.y, 30, 0xffffcc, 0.22).setScrollFactor(0).setDepth(103); td.push(beamCore);
    const torch = this.add.text(beam.x, beam.y, '🔦', { fontSize: '26px' }).setOrigin(0.5).setScrollFactor(0).setDepth(105).setInteractive({ draggable: true, useHandCursor: true }); td.push(torch); this.input.setDraggable(torch);
    const reveal = () => {
      clutter.list.forEach(o => { o.setAlpha(Phaser.Math.Distance.Between(o.x, o.y, beam.x, beam.y) < 60 ? 0.7 : 0.12); });
      const d = Phaser.Math.Distance.Between(fragX, fragY, beam.x, beam.y);
      frag.setAlpha(d < 60 ? 1 : 0);
    };
    torch.on('drag', (p, x, y) => {
      x = Phaser.Math.Clamp(x, maskArea.x, maskArea.x + maskArea.w);
      y = Phaser.Math.Clamp(y, maskArea.y, maskArea.y + maskArea.h);
      torch.setPosition(x, y); beam.setPosition(x, y); beamCore.setPosition(x, y); reveal();
    });
    frag.on('pointerdown', () => {
      if (frag.alpha < 0.9) return;
      this.cameras.main.flash(300, 120, 220, 140);
      this.time.delayedCall(400, () => { close(); this._s1_onStationWin('basement', 1); });
    });
    reveal();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STAGE 2: GARAGE
  // ══════════════════════════════════════════════════════════════════════════

  _buildStage2World() {
    this.add.image(STAGE2_X + STAGE2_W / 2, H / 2, 'l7_s2_bg').setDisplaySize(STAGE2_W, H).setDepth(-10);
  }

  _buildStage2Ground() {
    const body = this.add.rectangle(STAGE2_X + STAGE2_W / 2, S2_GROUND_Y + 16, STAGE2_W, 28, 0, 0);
    this.physics.add.existing(body, true);
    this._s2_ground = body;
    this._s2_jeepBaseY = S2_GROUND_Y;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STAGE 3: GAS STATION
  // ══════════════════════════════════════════════════════════════════════════

  _buildStage3World() {
    if (this.textures.exists('l2_bg')) {
      const src = this.textures.get('l2_bg').getSourceImage();
      const srcH = src.naturalHeight || src.height;
      this._s3_sky = this.add.tileSprite(STAGE3_X + STAGE3_W / 2, S3_BG_SEAM_Y / 2, STAGE3_W, S3_BG_SEAM_Y, 'l2_bg').setScrollFactor(0).setDepth(-30);
      this._s3_sky.tileScaleX = this._s3_sky.tileScaleY = S3_BG_SEAM_Y / srcH;
    }
  }

  _buildStage3Ground() {
    const bandH = H - S3_BG_SEAM_Y;
    if (this.textures.exists('l2_surface')) {
      const src = this.textures.get('l2_surface').getSourceImage();
      const srcH = src.naturalHeight || src.height;
      const ground = this.add.tileSprite(STAGE3_X + STAGE3_W / 2, S3_BG_SEAM_Y + bandH / 2, STAGE3_W, bandH, 'l2_surface').setDepth(5);
      ground.tileScaleX = ground.tileScaleY = bandH / srcH;
    }
    const body = this.add.rectangle(STAGE3_X + STAGE3_W / 2, S3_GROUND_Y + 16, STAGE3_W, 28, 0, 0);
    this.physics.add.existing(body, true);
    this._s3_ground = body;
  }

  _buildStage3Stations() {
    this._s3_stations = [
      { key: 'barrel',    x: STAGE3_X + 600,  tex: 'l7_barrel',    dh: 86, label: '🛢️ Barrel',    obj: 0, run: () => this._s3_moveBarrel() },
      { key: 'generator', x: STAGE3_X + 1200, tex: 'l7_generator', dh: 72, label: '🔌 Generator', obj: 1, run: () => this._s3_startGenerator() },
      { key: 'pipes',     x: STAGE3_X + 1600, tex: 'l7_pipe_elbow',dh: 60, label: '🔧 Pipes',     obj: 2, run: () => this._s3_connectPipes() },
      { key: 'tank',      x: STAGE3_X + 2300, tex: 'l7_fuelcan',   dh: 90, label: '🔒 Tank',      obj: 3, run: () => this._s3_unlockTank() },
      { key: 'fill',      x: STAGE3_X + 2650, tex: 'l7_fuelcan',   dh: 96, label: '⛽ Fill',      obj: 4, run: () => this._s3_fillFuel() },
    ];
    this._s3_stations.forEach(st => {
      const [sw, sh] = this._wh3(st.tex, st.dh);
      st.sprite = this.add.image(st.x, S3_GROUND_Y - 4, st.tex).setOrigin(0.5, 1).setDisplaySize(sw, sh).setDepth(9).setInteractive({ useHandCursor: true });
      st.glow = this.add.circle(st.x, S3_GROUND_Y - st.dh / 2 - 4, 28, 0x66ecff, 0.16).setDepth(8);
      this.tweens.add({ targets: st.glow, alpha: 0.4, scale: 1.25, duration: 800, yoyo: true, repeat: -1 });
      st.prompt = this.add.text(st.x, S3_GROUND_Y - st.dh - 24, `${st.label}\n[E] / tap`, {
        fontSize: '11px', fontFamily: 'Georgia, serif', color: '#fff', align: 'center',
        stroke: '#000', strokeThickness: 3, backgroundColor: '#000a', padding: { x: 6, y: 3 }
      }).setOrigin(0.5).setDepth(30).setVisible(false);
      st.sprite.on('pointerdown', () => { if (this._s3_near === st && !this._busy) this._s3_trigger(st); });
    });
  }

  _wh3(key, h) {
    const s = this.textures.get(key).getSourceImage();
    return [h * s.width / s.height, h];
  }

  _s3_trigger(st) {
    if (this._busy || !this._s3_isAvailable(st)) return;
    this.player.setVelocity(0, 0);
    const intros = {
      barrel:    ['🛢️', 'Move the Barrel', 'Drag the fuel barrel out of\nthe way onto the marker.'],
      generator: ['🔌', 'Start the Generator', 'Tap rapidly to pull the cord!'],
      pipes:     ['🔧', 'Connect the Pipes', 'Rotate each pipe straight.'],
      tank:      ['🔒', 'Unlock the Tank', 'Turn the dial to the code.'],
      fill:      ['⛽', 'Fill the Fuel', 'Hold to pour.'],
    };
    const [e, t, d] = intros[st.key];
    this.activityIntro(e, t, d, () => st.run());
  }

  _s3_isAvailable(st) {
    if (this._s3_stationsDone[st.key]) return false;
    const order = ['barrel', 'generator', 'pipes', 'tank', 'fill'];
    const idx = order.indexOf(st.key);
    return idx === 0 || this._s3_stationsDone[order[idx - 1]];
  }

  _s3_onStationWin(st, fuelTarget) {
    this._s3_stationsDone[st.key] = true;
    this.completeObjective(st.obj);
    st.glow.destroy(); st.prompt.destroy();
    st.sprite.setTint(0x66ff99);
    this.sparkleBurst(st.x, S3_GROUND_Y - 40, 12);
    if (fuelTarget != null) this._s3_fuel = fuelTarget;
  }

  _s3_moveBarrel() {
    const { td, close, px, py, pw, ph } = this.openPanel('🛢️ Move Barrel', 'Drag onto the green marker.', { w: 520, h: 320 });
    const targetX = px + pw - 110, targetY = py + ph - 90;
    const marker = this.add.circle(targetX, targetY, 42, 0x44dd66, 0.18).setScrollFactor(0).setDepth(102).setStrokeStyle(3, 0x44dd66, 0.9); td.push(marker);
    const barrel = this.add.image(px + 120, targetY, 'l7_barrel').setDisplaySize(...this._wh3('l7_barrel', 96)).setScrollFactor(0).setDepth(104).setInteractive({ draggable: true, useHandCursor: true }); td.push(barrel); this.input.setDraggable(barrel);
    barrel.on('drag', (p, x, y) => barrel.setPosition(x, y));
    barrel.on('dragend', () => {
      if (Phaser.Math.Distance.Between(barrel.x, barrel.y, targetX, targetY) < 48) {
        barrel.disableInteractive();
        this.tweens.add({ targets: barrel, x: targetX, y: targetY, duration: 200 });
        this.cameras.main.flash(250, 120, 220, 140);
        this.time.delayedCall(450, () => { close(); this._s3_onStationWin(this._s3_stations[0], 20); });
      } else {
        this.tweens.add({ targets: barrel, x: px + 120, y: targetY, duration: 250, ease: 'Back.easeOut' });
      }
    });
  }

  _s3_startGenerator() {
    const { td, close, px, py, pw, ph } = this.openPanel('🔌 Start Generator', 'Tap PULL rapidly!', { w: 420, h: 320 });
    let val = 0, done = false;
    const barX = px + 40, barY = py + 90, barW = 30, barH = 160;
    const frame = this.add.graphics().setScrollFactor(0).setDepth(103);
    frame.fillStyle(0x0a0f18, 1); frame.fillRoundedRect(barX, barY, barW, barH, 6); frame.lineStyle(2, 0x5a6a82, 1); frame.strokeRoundedRect(barX, barY, barW, barH, 6); td.push(frame);
    const fill = this.add.graphics().setScrollFactor(0).setDepth(104); td.push(fill);
    const draw = () => { fill.clear(); const h = val / 100 * (barH - 4); fill.fillStyle(val > 80 ? 0x7dff88 : 0xffaa33, 1); fill.fillRoundedRect(barX + 2, barY + (barH - 2) - h, barW - 4, h, 4); };
    draw();
    const pull = () => {
      if (done) return;
      val = Math.min(100, val + 13);
      draw();
      this.cameras.main.shake(40, 0.003);
      if (val >= 100) { done = true; this.cameras.main.flash(250, 120, 220, 140); this.time.delayedCall(400, () => { close(); this._s3_onStationWin(this._s3_stations[1], 40); }); }
    };
    this.panelButton(td, W / 2 + 60, py + ph - 40, '🪢  PULL', 0x7dff88, pull, 150, 46);
    const drain = this.time.addEvent({ delay: 60, loop: true, callback: () => { if (!done) { val = Math.max(0, val - 2.2); draw(); } } }); td.push({ destroy: () => drain.remove() });
  }

  _s3_connectPipes() {
    const { td, close, px, py, pw, ph } = this.openPanel('🔧 Connect Pipes', 'Rotate pipes straight.', { w: 560, h: 300 });
    const n = 4, y = py + 150, startX = px + 130, gap = 76;
    td.push(this.add.text(px + 60, y, '⛽', { fontSize: '34px' }).setOrigin(0.5).setScrollFactor(0).setDepth(102));
    td.push(this.add.text(px + pw - 50, y, '🛢️', { fontSize: '32px' }).setOrigin(0.5).setScrollFactor(0).setDepth(102));
    const pipes = [];
    for (let i = 0; i < n; i++) {
      const angle = Phaser.Utils.Array.GetRandom([90, 270]);
      const pipe = this.add.image(startX + i * gap, y, 'l7_pipe_straight').setDisplaySize(64, 64).setAngle(angle).setScrollFactor(0).setDepth(103).setInteractive({ useHandCursor: true });
      pipe.setData('angle', angle); td.push(pipe); pipes.push(pipe);
      pipe.on('pointerdown', () => {
        const a = (pipe.getData('angle') + 90) % 360;
        pipe.setData('angle', a);
        this.tweens.add({ targets: pipe, angle: pipe.angle + 90, duration: 150 });
        this.time.delayedCall(170, check);
      });
    }
    const flow = this.add.graphics().setScrollFactor(0).setDepth(102); td.push(flow);
    const check = () => {
      if (pipes.every(p => p.getData('angle') % 180 === 0)) {
        flow.lineStyle(6, 0x44dd66, 0.8); flow.lineBetween(px + 80, y, px + pw - 70, y);
        this.cameras.main.flash(250, 120, 220, 140);
        this.time.delayedCall(500, () => { close(); this._s3_onStationWin(this._s3_stations[2], 60); });
      }
    };
  }

  _s3_unlockTank() {
    const { td, close, px, py, pw, ph } = this.openPanel('🔒 Unlock Tank', 'Dial to code: 3-5-3', { w: 460, h: 320 });
    const code = [3, 5, 3];
    let stage = 0, val = 0;
    const codeTxt = this.add.text(W / 2, py + 80, '', { fontSize: '16px', fontFamily: 'Georgia, serif', color: '#f0c860' }).setOrigin(0.5).setScrollFactor(0).setDepth(103); td.push(codeTxt);
    const renderCode = () => codeTxt.setText('CODE:  ' + code.map((c, i) => i < stage ? '✓' : (i === stage ? `[${c}]` : c)).join('  '));
    renderCode();
    const cx = W / 2, cy = py + 175, R = 56;
    const dial = this.add.graphics().setScrollFactor(0).setDepth(102); td.push(dial);
    const valTxt = this.add.text(cx, cy, '0', { fontSize: '34px', fontFamily: 'Georgia, serif', color: '#cfe0f5' }).setOrigin(0.5).setScrollFactor(0).setDepth(103); td.push(valTxt);
    const drawDial = () => {
      dial.clear();
      dial.fillStyle(0x1c2436, 1); dial.fillCircle(cx, cy, R); dial.lineStyle(3, 0x5a6a82, 1); dial.strokeCircle(cx, cy, R);
      const a = -Math.PI / 2 + (val / 10) * Math.PI * 2;
      dial.lineStyle(4, 0xffe066, 1); dial.lineBetween(cx, cy, cx + Math.cos(a) * (R - 10), cy + Math.sin(a) * (R - 10));
      valTxt.setText(String(val));
    };
    drawDial();
    this.panelButton(td, cx - 90, cy, '◀', 0x7fb0e0, () => { val = (val + 9) % 10; drawDial(); }, 44, 44);
    this.panelButton(td, cx + 90, cy, '▶', 0x7fb0e0, () => { val = (val + 1) % 10; drawDial(); }, 44, 44);
    this.panelButton(td, W / 2, py + ph - 36, '✓  SET', 0x7dff88, () => {
      if (val === code[stage]) {
        stage++; this.sparkleBurst(cx, cy, 6, false); renderCode();
        if (stage >= code.length) {
          this.cameras.main.flash(250, 120, 220, 140);
          this.time.delayedCall(400, () => { close(); this._s3_onStationWin(this._s3_stations[3], 75); });
        }
      } else {
        this.cameras.main.shake(160, 0.01);
        valTxt.setColor('#ff6666'); this.time.delayedCall(350, () => valTxt.setColor('#cfe0f5'));
      }
    }, 150, 42);
  }

  _s3_fillFuel() {
    const { td, close, px, py, pw, ph } = this.openPanel('⛽ Fill Fuel', 'Hold POUR until FULL!', { w: 440, h: 320 });
    let level = this._s3_fuel;
    const barX = px + pw - 90, barY = py + 80, barW = 40, barH = 170;
    const frame = this.add.graphics().setScrollFactor(0).setDepth(103);
    frame.fillStyle(0x0a140e, 1); frame.fillRoundedRect(barX, barY, barW, barH, 6); frame.lineStyle(2, 0x3a8a5a, 1); frame.strokeRoundedRect(barX, barY, barW, barH, 6); td.push(frame);
    const fill = this.add.graphics().setScrollFactor(0).setDepth(104); td.push(fill);
    const lbl = this.add.text(barX + barW / 2, barY - 16, '', { fontSize: '13px', fontFamily: 'Georgia, serif', color: '#9fe0b0' }).setOrigin(0.5).setScrollFactor(0).setDepth(104); td.push(lbl);
    const draw = () => { fill.clear(); const h = level / 100 * (barH - 4); fill.fillStyle(0x44dd66, 1); fill.fillRoundedRect(barX + 2, barY + (barH - 2) - h, barW - 4, h, 4); lbl.setText(Math.floor(level) + '%'); };
    draw();
    let holding = false, done = false;
    const loop = this.time.addEvent({ delay: 30, loop: true, callback: () => {
      if (done) return;
      level += (holding ? 1.1 : -0.3);
      level = Phaser.Math.Clamp(level, 0, 100);
      draw();
      this._s3_fuel = level;
      if (level >= 100) { done = true; this.cameras.main.flash(300, 120, 220, 140); this.time.delayedCall(400, () => { close(); this._s3_onStationWin(this._s3_stations[4], 100); }); }
    }});
    td.push({ destroy: () => loop.remove() });
    const btn = this.panelButton(td, W / 2 - 30, py + ph - 36, '⛽  HOLD', 0x7dff88, () => {}, 220, 42);
    btn.on('pointerdown', () => holding = true);
    btn.on('pointerup',   () => holding = false);
    btn.on('pointerout',  () => holding = false);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STAGE 4: HIGHWAY DRIVING
  // ══════════════════════════════════════════════════════════════════════════

  _buildStage4Background() {
    this.add.rectangle(W / 2, H / 2, W, H, 0x0c1322, 1).setDepth(-20);
    const cityKey = this.textures.exists('l3_bg_main') ? 'l3_bg_main' : this.textures.exists('l7s4_bg') ? 'l7s4_bg' : null;
    if (cityKey) {
      const src = this.textures.get(cityKey).getSourceImage();
      const srcH = src.naturalHeight || src.height || S4_GROUND_Y;
      this._s4_bgCity = this.add.tileSprite(W / 2, S4_GROUND_Y / 2, W, S4_GROUND_Y, cityKey).setDepth(-15);
      this._s4_bgCity.tileScaleX = this._s4_bgCity.tileScaleY = S4_GROUND_Y / srcH;
    }
    this._s4_fog = this.add.tileSprite(W / 2, S4_GROUND_Y - 50, W, 110, 'l7_fog').setDepth(-6).setAlpha(0.4);
  }

  _buildStage4Road() {
    const roadH = H - S4_GROUND_Y;
    const roadKey = this.textures.exists('l3_road_bottom') ? 'l3_road_bottom' : this.textures.exists('l7s4_road') ? 'l7s4_road' : null;
    if (roadKey) {
      const src = this.textures.get(roadKey).getSourceImage();
      const srcH = src.naturalHeight || src.height || 81;
      this._s4_roadTile = this.add.tileSprite(W / 2, S4_GROUND_Y + roadH / 2, W, roadH, roadKey).setDepth(1).setScrollFactor(0);
      this._s4_roadTile.tileScaleX = this._s4_roadTile.tileScaleY = roadH / srcH;
    }
  }

  _buildStage4Car() {
    const CAR_FRAMES = Array.from({ length: 9 }, (_, i) => `l7s4_car_${i + 1}`);
    const hasFrames = this.textures.exists(CAR_FRAMES[0]);
    const bh = 82;
    const carY = S4_DRIVE_Y + 17;
    this._s4_carGroundY = carY;

    let bw = bh * 2.5;
    if (hasFrames) {
      const src = this.textures.get(CAR_FRAMES[0]).getSourceImage();
      bw = bh * (src.width / src.height);
    }
    this._s4_carShadow = this.add.ellipse(S4_CAR_X, S4_DRIVE_Y + 2, bw * 0.72, 12, 0x000000, 0.3).setDepth(4);

    const firstTex = hasFrames ? CAR_FRAMES[0] : this.textures.exists('l7_jeep_fixed') ? 'l7_jeep_fixed' : 'l3_car';
    const body = this.add.image(0, 0, firstTex).setOrigin(0.5, 1).setDisplaySize(bw, bh);
    this._s4_carBody = body;
    this._s4_carAnimated = hasFrames;
    this._s4_carFrameIdx = 0;
    this._s4_carFrameTimer = 0;
    this._s4_carC = this.add.container(S4_CAR_X, carY, [body]).setDepth(9);
    this._s4_beam = this.add.graphics().setDepth(8);
    this._s4_CAR_FRAMES = CAR_FRAMES;
  }

  _buildStage4Hurdles() {
    this._s4_breakers = S4_CFG.BREAKERS.map((distOffset) => ({ distOffset, triggered: false }));
    this._s4_signals = S4_CFG.SIGNALS.map((distOffset) => ({ distOffset, triggered: false, state: 'green', passed: false }));
    this._s4_blocks = S4_CFG.BLOCKS.map((distOffset) => ({ distOffset, triggered: false, solved: false }));
    this._s4_qtes = S4_CFG.QTES.map((distOffset) => ({ distOffset, triggered: false, done: false }));
    this._s4_climb = { distOffset: S4_CFG.CLIMB, triggered: false, solved: false };
  }

  _buildStage4Rain() {
    this._s4_rainGfx = this.add.graphics().setDepth(14).setScrollFactor(0);
    for (let i = 0; i < 170; i++) this._s4_rain.push({ x: Math.random() * W, y: Math.random() * H, speed: 8 + Math.random() * 6, len: 10 + Math.random() * 10 });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STAGE 5: PUPPIES SHELTER
  // ══════════════════════════════════════════════════════════════════════════

  _buildStage5World() {
    const bgKey = this.textures.exists('l3_hospital_bg') ? 'l3_hospital_bg' : 'l7_s5_bg';
    this.add.image(STAGE5_X + W / 2, H / 2, bgKey).setDisplaySize(W, H).setDepth(-10);
    const puppyKey = this.textures.exists('l7_s5_puppy_basket') ? 'l7_s5_puppy_basket' : 'l7_puppy';
    const pupSrc = this.textures.get(puppyKey).getSourceImage();
    this._s5_puppyDispH = 100;
    this._s5_puppyDispW = this._s5_puppyDispH * (pupSrc.width / pupSrc.height);
    this._s5_puppy = this.add.image(STAGE5_X + W / 2 + 30, 300, puppyKey).setDisplaySize(this._s5_puppyDispW, this._s5_puppyDispH).setDepth(5);
    this._s5_puppyBaseScale = this._s5_puppy.scaleX;
    this._s5_puppyKey = puppyKey;
  }

  _buildPlayer() {
    this.buildPlayer(STAGE1_X + 80, S1_GROUND_Y);
    this.physics.add.collider(this.player, this._s1_ground);
    this.physics.add.collider(this.player, this._s2_ground);
    this.physics.add.collider(this.player, this._s3_ground);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // UPDATE LOOP
  // ══════════════════════════════════════════════════════════════════════════

  update() {
    if (this._busy || this._paused) return;

    const px = this.player.x;

    // Stage 1-3: Walking gameplay
    if (px < STAGE4_X) {
      this.runMovement(210, -460);
      this.updateFog();

      // Stage 1 interactions
      if (px < STAGE2_X) {
        let near = null;
        for (const st of this._s1_stations) {
          if (!this._s1_stationsDone[st.key] && Math.abs(px - st.x) < 80) near = st;
          st.prompt.setVisible(!this._s1_stationsDone[st.key] && near === st);
        }
        this._s1_near = near;
        if (near && Phaser.Input.Keyboard.JustDown(this.keys.E)) this._s1_trigger(near);
        if (this._s1_fragments >= 2 && !this._s1_assembled && px > this._s1_assembleX) this._s1_assembleKey();
      }

      // Stage 3 interactions
      if (px >= STAGE3_X && px < STAGE4_X) {
        let near = null;
        for (const st of this._s3_stations) {
          const avail = this._s3_isAvailable(st);
          if (avail && Math.abs(px - st.x) < 70) near = st;
          st.prompt.setVisible(avail && near === st);
        }
        this._s3_near = near;
        if (near && Phaser.Input.Keyboard.JustDown(this.keys.E)) this._s3_trigger(near);
        if (this._s3_sky) this._s3_sky.tilePositionX = this.cameras.main.scrollX * 0.1;
      }

      // Trigger video transitions
      if (px >= STAGE2_X - 100 && this._s1_assembled && !this._videosPlayed['v2']) {
        this._videosPlayed['v2'] = true;
        this._busy = true;
        this.playStoryVideos(['l7_v2'], () => { this._busy = false; });
      }
      if (px >= STAGE3_X - 100 && !this._videosPlayed['v3']) {
        this._videosPlayed['v3'] = true;
        this._busy = true;
        this.playStoryVideos(['l7_v3'], () => { this._busy = false; });
      }
      if (px >= STAGE4_X - 100 && this._s3_stationsDone['fill'] && !this._videosPlayed['v4']) {
        this._videosPlayed['v4'] = true;
        this._busy = true;
        this.playStoryVideos(['l7_v4'], () => { this._busy = false; });
      }
    }

    // Stage 4: Driving
    else if (px < STAGE5_X) {
      this._updateStage4();
    }

    // Stage 5: Puppies
    else {
      this.player.setVelocity(0, 0);
      if (!this._s5_task) {
        this._s5_task = 1;
        this.time.delayedCall(500, () => this._s5_beginTask(1));
      }
    }

    // Trigger final video
    if (px >= STAGE5_X - 100 && this._s4_distance >= S4_CFG.HOSPITAL && !this._videosPlayed['v6']) {
      this._videosPlayed['v6'] = true;
      this._busy = true;
      this.playStoryVideos(['l7_v6'], () => { this._busy = false; });
    }
  }

  _updateStage4() {
    if (this._s4_done) return;

    const FF = this.game.loop.delta / (1000 / 60);

    // Rain
    this._updateStage4Rain(this.game.loop.delta);

    // Controls
    if (!this._s4_blocking) {
      const ts = window._touchState || {};
      const gas   = this.cursors.right.isDown || this.keys.D.isDown || ts.right;
      const brake = this.cursors.left.isDown  || this.keys.A.isDown || ts.left;
      if (gas)        this._s4_speed = Math.min(S4_CFG.MAX, this._s4_speed + S4_CFG.ACCEL * FF);
      else if (brake) this._s4_speed = Math.max(0, this._s4_speed - S4_CFG.BRAKE * FF);
      else            this._s4_speed = Math.max(0, this._s4_speed - S4_CFG.FRICTION * FF);
      this._s4_distance += this._s4_speed * FF;

      const scroll = this._s4_speed * FF;
      if (this._s4_bgCity)  this._s4_bgCity.tilePositionX  += scroll * 0.12;
      if (this._s4_roadTile) this._s4_roadTile.tilePositionX += scroll;
      if (this._s4_fog) this._s4_fog.tilePositionX += scroll * 0.25;
    }

    this._updateStage4CarAnim(this.game.loop.delta);

    const bob = Math.sin(this.time.now * 0.02) * (this._s4_speed > 0.4 ? 1.4 : 0.4);
    this._s4_carC.y = this._s4_carGroundY + bob;

    this._s4_beam.clear(); this._s4_beam.fillStyle(0xfff3c0, 0.10);
    const bx = S4_CAR_X + 78, by = this._s4_carC.y - 48;
    this._s4_beam.fillTriangle(bx, by, bx + 130, by - 18, bx + 130, by + 26);

    // Move player to match car
    this.player.x = S4_CAR_X + 200;

    if (this._s4_distance >= S4_CFG.HOSPITAL) {
      this._s4_done = true;
      this.toast('🏥 Hospital reached!', 2200);
      this.time.delayedCall(2000, () => {
        this.player.x = STAGE5_X + 80;
      });
    }
  }

  _updateStage4CarAnim(delta) {
    if (!this._s4_carAnimated) return;
    if (this._s4_speed > 0.05) {
      this._s4_carFrameTimer += delta;
      const msPerFrame = 1000 / 14;
      while (this._s4_carFrameTimer >= msPerFrame) {
        this._s4_carFrameTimer -= msPerFrame;
        this._s4_carFrameIdx = (this._s4_carFrameIdx + 1) % this._s4_CAR_FRAMES.length;
      }
      this._s4_carBody.setTexture(this._s4_CAR_FRAMES[this._s4_carFrameIdx]);
    } else {
      this._s4_carFrameTimer = 0;
      this._s4_carFrameIdx = 0;
      this._s4_carBody.setTexture(this._s4_CAR_FRAMES[0]);
    }
  }

  _updateStage4Rain(delta) {
    const FF = delta / (1000 / 60), SIN = 0.3, COS = 0.954;
    this._s4_rainGfx.clear(); this._s4_rainGfx.lineStyle(1, 0xb4c8ff, 0.32); this._s4_rainGfx.beginPath();
    for (const d of this._s4_rain) {
      d.x += d.speed * SIN * FF; d.y += d.speed * COS * FF;
      if (d.y > H) { d.y = Math.random() * -50; d.x = Math.random() * W; }
      this._s4_rainGfx.moveTo(d.x, d.y); this._s4_rainGfx.lineTo(d.x + d.len * SIN, d.y + d.len * COS);
    }
    this._s4_rainGfx.strokePath();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STAGE 5: PUPPIES TREATMENT
  // ══════════════════════════════════════════════════════════════════════════

  _s5_beginTask(n) {
    this._s5_task = n;
    const tasks = {
      1: ['🌡️', 'Check Temperature', 'Drag thermometer onto puppy and hold.', () => this._s5_tTemperature()],
      2: ['💊', 'Give Medicine', "Drag medicine to puppy's mouth.", () => this._s5_tMedicine()],
      3: ['💉', 'Give Injection', 'Drag syringe to spot, HOLD steady.', () => this._s5_tInjection()],
      4: ['🩹', 'Bandage the Wound', 'Drag bandages onto wound.', () => this._s5_tBandage()],
      5: ['❤️', 'Recovery & Comfort', 'Stroke puppy to soothe it.', () => this._s5_tRecovery()],
    };
    const [e, t, d, fn] = tasks[n];
    this.activityIntro(e, t, d, fn);
  }

  _s5_taskDone(msg) {
    this.completeObjective(this._s5_task - 1);
    this.sparkleBurst(STAGE5_X + W / 2 + 30, 300, 14);
    this.toast(msg, 1800);
    this._s5_clearTask();
    if (this._s5_task >= 5) {
      this.time.delayedCall(900, () => this._s5_allSafe());
    } else {
      this.time.delayedCall(900, () => this._s5_beginTask(this._s5_task + 1));
    }
  }

  _s5_clearTask() {
    this._s5_taskObjs.forEach(o => { try { this.tweens.killTweensOf(o); if (o.destroy) o.destroy(); } catch (_) {} });
    this._s5_taskObjs = [];
  }

  _s5_allSafe() {
    this._busy = true;
    this.registry.set('lives', this._lives);
    this.registry.set('l7_checkpoint', 'L7_COMPLETE');
    this.playStoryVideos(['l7_v7'], () => {
      const points = this.registry.get('points') ?? 0;
      showLevelCompleteModal(this, points, { menuKey: 'Menu' });
    });
  }

  _s5_tTemperature() {
    const th = this.add.image(W / 2 - 250, 360, 'l7_thermometer').setDisplaySize(80, 26).setDepth(40).setInteractive({ draggable: true, useHandCursor: true });
    this.input.setDraggable(th); this._s5_taskObjs.push(th);
    const reading = this.add.text(STAGE5_X + W / 2 + 30, 230, '39.5°C', { fontSize: '16px', fontFamily: 'Georgia, serif', color: '#cc3333', stroke: '#fff', strokeThickness: 3 }).setOrigin(0.5).setDepth(41);
    this._s5_taskObjs.push(reading);
    let measuring = false;
    th.on('drag', (p, x, y) => { if (!measuring) th.setPosition(x, y); });
    th.on('dragend', () => {
      if (Phaser.Math.Distance.Between(th.x, th.y, STAGE5_X + W / 2 + 30, 300) < 70) {
        measuring = true; th.disableInteractive();
        this.tweens.addCounter({ from: 39.5, to: 38.4, duration: 1800, onUpdate: t => {
          const v = t.getValue(); reading.setText(v.toFixed(1) + '°C');
        }, onComplete: () => { this.cameras.main.flash(200, 120, 220, 140); this.time.delayedCall(300, () => this._s5_taskDone('🌡️ Temperature stable!')); } });
      } else {
        this.tweens.add({ targets: th, x: W / 2 - 250, y: 360, duration: 250, ease: 'Back.easeOut' });
      }
    });
  }

  _s5_tMedicine() {
    const mouthX = STAGE5_X + W / 2 - 14, mouthY = 294;
    const ring = this.add.circle(mouthX, mouthY, 16, 0x44aadd, 0).setDepth(40).setStrokeStyle(2, 0x44aadd, 0.8);
    this.tweens.add({ targets: ring, scale: 1.5, alpha: { from: 0.8, to: 0 }, duration: 900, repeat: -1 });
    this._s5_taskObjs.push(ring);
    const med = this.add.image(W / 2 - 250, 360, 'l7_medicine').setDisplaySize(50, 64).setDepth(40).setInteractive({ draggable: true, useHandCursor: true });
    this.input.setDraggable(med); this._s5_taskObjs.push(med);
    med.on('drag', (p, x, y) => med.setPosition(x, y));
    med.on('dragend', () => {
      if (Phaser.Math.Distance.Between(med.x, med.y, mouthX, mouthY) < 50) {
        med.disableInteractive();
        this.tweens.add({ targets: med, x: mouthX, y: mouthY - 6, angle: 40, duration: 300, yoyo: true, onComplete: () => {
          this.cameras.main.flash(200, 120, 220, 140);
          this.time.delayedCall(400, () => this._s5_taskDone('💊 Medicine given!'));
        } });
      } else {
        this.tweens.add({ targets: med, x: W / 2 - 250, y: 360, duration: 250, ease: 'Back.easeOut' });
      }
    });
  }

  _s5_tInjection() {
    const spotX = STAGE5_X + W / 2 + 36, spotY = 308;
    const ring = this.add.circle(spotX, spotY, 14, 0xff5577, 0).setDepth(40).setStrokeStyle(2, 0xff5577, 0.9);
    this.tweens.add({ targets: ring, scale: 1.6, alpha: { from: 0.9, to: 0 }, duration: 800, repeat: -1 });
    this._s5_taskObjs.push(ring);
    const syr = this.add.image(W / 2 - 250, 360, 'l7_syringe').setDisplaySize(90, 30).setDepth(40).setInteractive({ draggable: true, useHandCursor: true });
    this.input.setDraggable(syr); this._s5_taskObjs.push(syr);
    let placed = false;
    syr.on('drag', (p, x, y) => { if (!placed) syr.setPosition(x, y); });
    syr.on('dragend', () => {
      if (!placed && Phaser.Math.Distance.Between(syr.x, syr.y, spotX, spotY) < 46) {
        placed = true; syr.setPosition(spotX - 30, spotY - 14);
        const fr = this.add.graphics().setDepth(41); fr.lineStyle(2, 0xffffff, 0.9); fr.fillStyle(0x00000055, 1); fr.fillRoundedRect(spotX - 60, spotY - 60, 120, 14, 5); this._s5_taskObjs.push(fr);
        const bar = this.add.graphics().setDepth(42); this._s5_taskObjs.push(bar);
        let prog = 0, holding = false, done = false;
        const draw = () => { bar.clear(); bar.fillStyle(0x44dd66, 1); bar.fillRoundedRect(spotX - 58, spotY - 58, 116 * prog / 100, 10, 4); };
        const btn = this.add.text(W / 2, 400, '💉 HOLD', { fontSize: '15px', fontFamily: 'Georgia, serif', color: '#fff', backgroundColor: '#2a8a4a', padding: { x: 16, y: 9 } }).setOrigin(0.5).setDepth(43).setInteractive({ useHandCursor: true });
        this._s5_taskObjs.push(btn);
        btn.on('pointerdown', () => holding = true); btn.on('pointerup', () => holding = false); btn.on('pointerout', () => holding = false);
        const loop = this.time.addEvent({ delay: 30, loop: true, callback: () => {
          if (done) return;
          prog += holding ? 1.4 : -0.8; prog = Phaser.Math.Clamp(prog, 0, 100); draw();
          if (prog >= 100) { done = true; loop.remove(); this.cameras.main.flash(200, 120, 220, 140); this.time.delayedCall(300, () => this._s5_taskDone('💉 Injection done!')); }
        }});
        this._s5_taskObjs.push({ destroy: () => loop.remove() });
      } else if (!placed) {
        this.tweens.add({ targets: syr, x: W / 2 - 250, y: 360, duration: 250, ease: 'Back.easeOut' });
      }
    });
  }

  _s5_tBandage() {
    const woundX = STAGE5_X + W / 2 + 54, woundY = 314;
    const wound = this.add.circle(woundX, woundY, 12, 0xcc3333, 0.9).setDepth(40).setStrokeStyle(2, 0x882222);
    this._s5_taskObjs.push(wound);
    let wraps = 0; const need = 3;
    const counter = this.add.text(STAGE5_X + W / 2 + 30, 230, `Wraps: 0/${need}`, { fontSize: '13px', fontFamily: 'Georgia, serif', color: '#2a4a6a', stroke: '#fff', strokeThickness: 3 }).setOrigin(0.5).setDepth(41);
    this._s5_taskObjs.push(counter);
    const makeStrip = () => {
      const s = this.add.image(W / 2 - 250, 350, 'l7_bandage').setDisplaySize(56, 36).setDepth(42).setInteractive({ draggable: true, useHandCursor: true });
      this.input.setDraggable(s); this._s5_taskObjs.push(s);
      s.on('drag', (p, x, y) => s.setPosition(x, y));
      s.on('dragend', () => {
        if (Phaser.Math.Distance.Between(s.x, s.y, woundX, woundY) < 46) {
          s.disableInteractive();
          this.tweens.add({ targets: s, x: woundX, y: woundY, angle: wraps * 25 - 25, scale: 0.5, duration: 200 });
          wraps++; counter.setText(`Wraps: ${wraps}/${need}`); this.sparkleBurst(woundX, woundY, 5);
          if (wraps >= need) { wound.setVisible(false); this.cameras.main.flash(200, 120, 220, 140); this.time.delayedCall(400, () => this._s5_taskDone('🩹 Bandaged!')); }
          else makeStrip();
        } else {
          this.tweens.add({ targets: s, x: W / 2 - 250, y: 350, duration: 250, ease: 'Back.easeOut' });
        }
      });
    };
    makeStrip();
  }

  _s5_tRecovery() {
    const meterY = 150;
    const fr = this.add.graphics().setDepth(40); fr.lineStyle(2, 0x2a7a4a, 0.9); fr.fillStyle(0xffffff, 0.6); fr.fillRoundedRect(W / 2 - 120, meterY, 240, 16, 8); this._s5_taskObjs.push(fr);
    const bar = this.add.graphics().setDepth(41); this._s5_taskObjs.push(bar);
    let comfort = 0, done = false, lastX = null, lastY = null;
    const draw = () => { bar.clear(); bar.fillStyle(0xff5577, 1); bar.fillRoundedRect(W / 2 - 118, meterY + 2, 236 * comfort / 100, 12, 6); };
    draw();
    const zone = this.add.zone(STAGE5_X + W / 2 + 30, 300, 150, 110).setInteractive({ useHandCursor: true });
    this._s5_taskObjs.push(zone);
    const onMove = (p) => {
      if (done) return;
      if (lastX != null) {
        const d = Phaser.Math.Distance.Between(p.x, p.y, lastX, lastY);
        if (d > 4 && Phaser.Math.Distance.Between(p.x, p.y, STAGE5_X + W / 2 + 30, 300) < 90) {
          comfort = Math.min(100, comfort + d * 0.12); draw();
          if (comfort >= 100 && !done) {
            done = true;
            this.cameras.main.flash(300, 255, 200, 200);
            const s = this._s5_puppyBaseScale;
            this.tweens.add({ targets: this._s5_puppy, scale: { from: s, to: s * 1.3 }, duration: 300, yoyo: true });
            this.time.delayedCall(400, () => this._s5_taskDone('❤️ Puppy recovered!'));
          }
        }
      }
      lastX = p.x; lastY = p.y;
    };
    this.input.on('pointermove', onMove);
    this._s5_taskObjs.push({ destroy: () => this.input.off('pointermove', onMove) });
  }
}
