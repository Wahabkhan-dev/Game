import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { L7BaseScene } from './L7BaseScene.js';
import { generateL7Assets } from './L7Assets.js';
import { preloadGlendaSkin } from './L7_GlendaSkin.js';

const WORLD_W = 1900;
const GROUND_Y = 400;
const IMG = 'assets/images/Level7/Stage1/';

// ════════════════════════════════════════════════════════════════════════════
// STAGE 1 — FIND THE HOUSE KEY  (inside the home, stormy night, power out)
// Restore power (fuse box) → unlock the attic cabinet → search the basement →
// assemble the jeep key. Real hand-painted interior art.
// ════════════════════════════════════════════════════════════════════════════
export class L7_Stage1Scene extends L7BaseScene {
  constructor() { super('L7_Stage1'); }

  init(data) {
    console.log('[L7_Stage1] init()', data);
  }

  preload() {
    console.log('[L7_Stage1] preload() start');
    preloadGlendaSkin(this);
    const files = ['l7_s1_bg', 'l7_s1_floor', 'l7_s1_window', 'l7_s1_ladder', 'l7_s1_basement',
      'l7_s1_debris', 'l7_fusebox', 'l7_puddle', 'l7_keyfrag', 'l7_key'];

    files.forEach(k => {
      if (!this.textures.exists(k)) {
        console.log(`[L7_Stage1] queue image ${k}`);
        this.load.image(k, `${IMG}${k}.png`);
      }
    });

    this.load.on('filecomplete', (key) => {
      console.log(`[L7_Stage1] loaded ${key}`);
    });

    this.load.on('loaderror', (file) => {
      console.error(`[L7_Stage1] loaderror ${file?.key} @ ${file?.src}`);
    });
  }

  create() {
    console.log('[L7_Stage1] create() start');
    generateL7Assets(this);
    this.physics.world.setBounds(0, 0, WORLD_W, H + 200);
    this.cameras.main.setBounds(0, 0, WORLD_W, H);
    this.cameras.main.fadeIn(700, 0, 0, 0);
    this.cameras.main.setBackgroundColor('#0a0e16');

    this._fragments = 0;
    this._stationsDone = { power: false, attic: false, basement: false };
    this._powerOn = false;

    this._buildWorld();
    this._buildGround();
    this._buildStations();
    this._buildPlayer();
    this.buildStageHUD(1, 'Find the House Key',
      ['Restore the power', 'Unlock the attic cabinet', 'Search the basement', 'Assemble the jeep key']);
    this.buildFog(18, 0.18);
    this.startLightning();

    this.time.delayedCall(500, () => this.toast('🏠 The storm cut the power — find the jeep key. Walk right →', 3400));
  }

  _buildWorld() {
    // Interior wall — scrolls with the world, repeats as a long house wall
    const scale = H / 768;
    this._bg = this.add.tileSprite(WORLD_W / 2, H / 2, WORLD_W, H, 'l7_s1_bg').setDepth(-10);
    this._bg.tileScaleX = this._bg.tileScaleY = scale;

    // Power-out darkness (lifts when the fuse box is fixed)
    this._dark = this.add.rectangle(W / 2, H / 2, W, H, 0x0a1024, 0.6).setScrollFactor(0).setDepth(40);
    // cold light pooling from the windows even while dark
    this._dark.setBlendMode(Phaser.BlendModes.MULTIPLY);
  }

  _buildGround() {
    // crop a wood-only band out of the floor image (it has grey perspective corners)
    const ftex = this.textures.get('l7_s1_floor');
    if (ftex && !ftex.has('strip')) {
      const sw = ftex.getSourceImage().width, sh = ftex.getSourceImage().height;
      ftex.add('strip', 0, Math.round(sw * 0.12), Math.round(sh * 0.40), Math.round(sw * 0.76), Math.round(sh * 0.22));
    }
    const floorTop = GROUND_Y - 4;
    const floor = this.add.tileSprite(WORLD_W / 2, floorTop + 30, WORLD_W, 60, 'l7_s1_floor', 'strip').setDepth(5);
    floor.tileScaleX = floor.tileScaleY = 60 / (this.textures.get('l7_s1_floor').frames.strip?.height || 168);
    // soft shadow line where wall meets floor
    this.add.rectangle(WORLD_W / 2, floorTop, WORLD_W, 4, 0x000000, 0.35).setDepth(5);

    const body = this.add.rectangle(WORLD_W / 2, GROUND_Y + 16, WORLD_W, 28, 0, 0);
    this.physics.add.existing(body, true);
    this._ground = body;

    // Hurdle: fallen boxes / toppled stool (jump over)
    this._debris = this.add.image(720, GROUND_Y + 10, 'l7_s1_debris').setOrigin(0.5, 1).setDisplaySize(140, 76).setDepth(8);
    const db = this.add.rectangle(720, GROUND_Y - 14, 96, 40, 0, 0);
    this.physics.add.existing(db, true);
    this._debrisBody = db;

    // Hurdle: ceiling-leak puddle (slippery)
    this._puddles = [1280].map(x => ({
      x, img: this.add.image(x, GROUND_Y + 8, 'l7_puddle').setOrigin(0.5, 1).setDisplaySize(96, 30).setDepth(6), hit: false
    }));
  }

  _buildStations() {
    this._stations = [
      { key: 'power',    x: 420,  tex: 'l7_fusebox',    dw: 122, dh: 122 * 369 / 677, oy: 0.5, y: 232, label: '⚡ Fuse Box', run: () => this._wirePuzzle() },
      { key: 'attic',    x: 1010, tex: 'l7_s1_ladder',  dw: 300 * 373 / 669, dh: 300, oy: 1,   y: GROUND_Y + 4, label: '🪜 Attic',    run: () => this._comboPuzzle() },
      { key: 'basement', x: 1560, tex: 'l7_s1_basement',dw: 168, dh: 168 * 369 / 677, oy: 1,   y: GROUND_Y + 10, label: '🚪 Basement', run: () => this._basementPuzzle() },
    ];
    this._stations.forEach(st => {
      st.sprite = this.add.image(st.x, st.y, st.tex).setOrigin(0.5, st.oy).setDisplaySize(st.dw, st.dh).setDepth(9)
        .setInteractive({ useHandCursor: true });
      const gy = st.oy === 1 ? st.y - st.dh / 2 : st.y;
      st.glow = this.add.circle(st.x, gy, 30, 0xffe9a0, 0.22).setDepth(8);
      this.tweens.add({ targets: st.glow, alpha: 0.45, scale: 1.25, duration: 800, yoyo: true, repeat: -1 });
      st.prompt = this.add.text(st.x, gy - st.dh / 2 - 8, `${st.label}\n[E] / tap`, {
        fontSize: '11px', fontFamily: 'Georgia, serif', color: '#fff', align: 'center',
        stroke: '#000', strokeThickness: 3, backgroundColor: '#000a', padding: { x: 6, y: 3 }
      }).setOrigin(0.5).setDepth(30).setVisible(false);
      st.sprite.on('pointerdown', () => { if (this._near === st && !this._busy) this._trigger(st); });
    });
    this._assembleX = WORLD_W - 130;
  }

  _buildPlayer() {
    this.buildPlayer(80, GROUND_Y);
    this.physics.add.collider(this.player, this._ground);
    this.physics.add.collider(this.player, this._debrisBody);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
  }

  update() {
    if (this._busy || this._paused) return;
    this.runMovement(210, -460);
    this.updateFog();

    for (const pd of this._puddles) {
      if (!pd.hit && Math.abs(this.player.x - pd.x) < 32 && this.player.body.blocked.down) {
        pd.hit = true;
        this.sparkleBurst(pd.x, GROUND_Y - 4, 6);
        this.toast('💦 Splash! Slippery floor — careful.', 1400);
        this.time.delayedCall(2500, () => { pd.hit = false; });
      }
    }

    let near = null;
    for (const st of this._stations) {
      if (!this._stationsDone[st.key] && Math.abs(this.player.x - st.x) < 80) near = st;
      st.prompt.setVisible(!this._stationsDone[st.key] && near === st);
    }
    this._near = near;
    if (near && Phaser.Input.Keyboard.JustDown(this.keys.E)) this._trigger(near);

    if (this._fragments >= 3 && !this._assembled && this.player.x > this._assembleX) this._assembleKey();
  }

  _trigger(st) {
    if (this._busy || this._stationsDone[st.key]) return;
    this.player.setVelocity(0, 0);
    const intros = {
      power:    ['⚡', 'Restore the Power', 'Connect each wire to the\nmatching coloured socket.'],
      attic:    ['🔒', 'Attic Cabinet Lock', 'Set the 3 dials to match\nthe code to open it.'],
      basement: ['🔦', 'Search the Basement', "It's pitch black — drag the\nflashlight to find the fragment."],
    };
    const [e, t, d] = intros[st.key];
    this.activityIntro(e, t, d, () => st.run());
  }

  _onStationWin(key, objIdx) {
    this._stationsDone[key] = true;
    this.completeObjective(objIdx);
    this._fragments++;
    const st = this._stations.find(s => s.key === key);
    if (st) { st.glow.destroy(); st.prompt.destroy(); }

    // Restoring power lights the whole house
    if (key === 'power' && !this._powerOn) {
      this._powerOn = true;
      this.cameras.main.flash(350, 255, 235, 170);
      this.tweens.add({ targets: this._dark, fillAlpha: 0.12, duration: 700 });
      this.toast('💡 Power restored — the lights flicker on!', 2200);
    }

    const frag = this.add.image(this.player.x, GROUND_Y - 90, 'l7_keyfrag').setDisplaySize(48, 30).setDepth(40);
    this.sparkleBurst(frag.x, frag.y, 12);
    this.tweens.add({ targets: frag, x: this.cameras.main.scrollX + 120, y: 70, scale: 0.5, duration: 700, scrollFactorX: 0 });
    this.time.delayedCall(720, () => frag.destroy());
    this.toast(`🗝️ Key fragment ${this._fragments}/3 collected!`, 2200);

    if (this._fragments >= 3) {
      this.time.delayedCall(900, () => this.toast('✨ All 3 fragments found — assemble the key at the end →', 3200));
      this._doorKey = this.add.image(this._assembleX, GROUND_Y - 70, 'l7_keyfrag').setDisplaySize(54, 34).setDepth(20);
      this.tweens.add({ targets: this._doorKey, y: this._doorKey.y - 12, duration: 700, yoyo: true, repeat: -1 });
      this.add.text(this._assembleX, GROUND_Y - 110, '🔧 Assemble Key', { fontSize: '11px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(20);
    }
  }

  _assembleKey() {
    this._assembled = true;
    this._busy = true;
    this.player.setVelocity(0, 0);
    if (this._doorKey) this._doorKey.destroy();
    this.completeObjective(3);
    const key = this.add.image(this.player.x, GROUND_Y - 90, 'l7_key').setScale(0).setDepth(40);
    this.sparkleBurst(key.x, key.y, 20);
    this.tweens.add({ targets: key, scale: 0.5, duration: 600, ease: 'Back.easeOut', yoyo: true, hold: 400, onComplete: () => key.destroy() });
    this.cameras.main.flash(300, 255, 220, 120);
    this.time.delayedCall(1100, () => {
      this.registry.set('lives', this._lives);
      this.registry.set('l7_checkpoint', 'L7_Stage2');
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(520, () => {
        this._wakeLoop();
        this.scene.start('L7_Stage2');
      });
    });
  }

  // ── Mini-game 1: Wire connection (Restore Power) ───────────────────────────
  _wirePuzzle() {
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
      if (selected !== null) { wires.lineStyle(3, colors[selected], 0.4); }
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
          if (connected >= 4) { this.cameras.main.flash(300, 120, 220, 140); this.time.delayedCall(500, () => { close(); this._onStationWin('power', 0); }); }
        } else {
          this.cameras.main.shake(160, 0.008);
          nodes[selected].setScale(1); selected = null; drawLinks();
        }
      });
    });
    drawLinks();
  }

  // ── Mini-game 2: Combination lock (Attic Cabinet) ──────────────────────────
  _comboPuzzle() {
    const { td, close, px, py, pw, ph } = this.openPanel('🔒 Cabinet Lock', 'Match the dials to the code, then OPEN.', { w: 480, h: 320 });
    const code = [Phaser.Math.Between(1, 9), Phaser.Math.Between(1, 9), Phaser.Math.Between(1, 9)];
    td.push(this.add.text(W / 2, py + 84, `CODE:  ${code.join('  ')}`, {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: '#f0c860', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(103));
    const vals = [1, 1, 1];
    const dialTxt = [];
    const startX = W / 2 - 90;
    for (let d = 0; d < 3; d++) {
      const dx = startX + d * 90, dy = py + 170;
      const box = this.add.graphics().setScrollFactor(0).setDepth(102);
      box.fillStyle(0x1c2436, 1); box.fillRoundedRect(dx - 28, dy - 30, 56, 60, 8);
      box.lineStyle(2, 0x5a6a82, 1); box.strokeRoundedRect(dx - 28, dy - 30, 56, 60, 8);
      td.push(box);
      const t = this.add.text(dx, dy, '1', { fontSize: '30px', fontFamily: 'Georgia, serif', color: '#cfe0f5' }).setOrigin(0.5).setScrollFactor(0).setDepth(103);
      td.push(t); dialTxt.push(t);
      this.panelButton(td, dx, dy - 52, '▲', 0x7fb0e0, () => { vals[d] = vals[d] === 9 ? 1 : vals[d] + 1; t.setText(String(vals[d])); }, 44, 28);
      this.panelButton(td, dx, dy + 52, '▼', 0x7fb0e0, () => { vals[d] = vals[d] === 1 ? 9 : vals[d] - 1; t.setText(String(vals[d])); }, 44, 28);
    }
    this.panelButton(td, W / 2, py + ph - 36, '🔓  OPEN', 0x7dff88, () => {
      if (vals.every((v, i) => v === code[i])) {
        this.cameras.main.flash(300, 120, 220, 140);
        this.time.delayedCall(400, () => { close(); this._onStationWin('attic', 1); });
      } else {
        this.cameras.main.shake(180, 0.01);
        dialTxt.forEach(t => t.setColor('#ff6666'));
        this.time.delayedCall(400, () => dialTxt.forEach(t => t.setColor('#cfe0f5')));
      }
    }, 160, 42);
  }

  // ── Mini-game 3: Flashlight hidden-object (Basement) ───────────────────────
  _basementPuzzle() {
    const { td, close, px, py, pw, ph } = this.openPanel('🔦 Dark Basement', 'Drag the flashlight to find the key fragment.', { w: 580, h: 330 });
    const maskArea = { x: px + 20, y: py + 70, w: pw - 40, h: ph - 100 };
    const dark = this.add.rectangle(maskArea.x + maskArea.w / 2, maskArea.y + maskArea.h / 2, maskArea.w, maskArea.h, 0x05080c, 1)
      .setScrollFactor(0).setDepth(102); td.push(dark);

    const clutter = this.add.container(0, 0).setScrollFactor(0).setDepth(103); td.push(clutter);
    const addClutter = (x, y, emoji) => { const o = this.add.text(x, y, emoji, { fontSize: '30px' }).setOrigin(0.5).setAlpha(0.12); clutter.add(o); return o; };
    addClutter(maskArea.x + 70, maskArea.y + 60, '📦');
    addClutter(maskArea.x + 200, maskArea.y + 130, '🕸️');
    addClutter(maskArea.x + 360, maskArea.y + 70, '🪑');
    addClutter(maskArea.x + 460, maskArea.y + 150, '🛢️');
    const fragX = maskArea.x + 300, fragY = maskArea.y + 110;
    const frag = this.add.image(fragX, fragY, 'l7_keyfrag').setDisplaySize(54, 34).setScrollFactor(0).setDepth(104).setAlpha(0).setInteractive({ useHandCursor: true });
    td.push(frag);

    const beam = this.add.circle(maskArea.x + 80, maskArea.y + 80, 56, 0xffffcc, 0.16).setScrollFactor(0).setDepth(103); td.push(beam);
    const beamCore = this.add.circle(beam.x, beam.y, 30, 0xffffcc, 0.22).setScrollFactor(0).setDepth(103); td.push(beamCore);
    const torch = this.add.text(beam.x, beam.y, '🔦', { fontSize: '26px' }).setOrigin(0.5).setScrollFactor(0).setDepth(105).setInteractive({ draggable: true, useHandCursor: true });
    td.push(torch); this.input.setDraggable(torch);

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
      this.time.delayedCall(400, () => { close(); this._onStationWin('basement', 2); });
    });
    reveal();
  }
}
