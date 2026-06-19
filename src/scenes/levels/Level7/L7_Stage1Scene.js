import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { L7BaseScene } from './L7BaseScene.js';
import { generateL7Assets } from './L7Assets.js';

const WORLD_W = 3100;
const GROUND_Y = 408;

// ════════════════════════════════════════════════════════════════════════════
// STAGE 1 — FIND THE HOUSE KEY  (rainy countryside home, night)
// Restore power → unlock attic cabinet → search basement → assemble jeep key.
// ════════════════════════════════════════════════════════════════════════════
export class L7_Stage1Scene extends L7BaseScene {
  constructor() { super('L7_Stage1'); }

  create() {
    generateL7Assets(this);
    this.physics.world.setBounds(0, 0, WORLD_W, H + 200);
    this.cameras.main.setBounds(0, 0, WORLD_W, H);
    this.cameras.main.fadeIn(700, 0, 0, 0);
    this.cameras.main.setBackgroundColor('#0a1424');

    this._fragments = 0;
    this._stationsDone = { power: false, attic: false, basement: false };

    this._buildWorld();
    this._buildGround();
    this._buildStations();
    this._buildPlayer();
    this.buildStageHUD(1, 'Find the House Key',
      ['Restore the power', 'Unlock the attic cabinet', 'Search the basement', 'Assemble the jeep key']);
    this.buildFog(18, 0.45);
    this.buildRain(130);
    this.startLightning();

    this.time.delayedCall(500, () => this.toast('🏠 A stormy night — find the jeep key. Walk right →', 3200));
  }

  _buildWorld() {
    // Parallax sky
    this._sky = this.add.tileSprite(W / 2, H / 2, W, H, 'l7_s1_sky').setScrollFactor(0).setDepth(-30);
    // far trees
    [200, 700, 1300, 1900, 2600].forEach((x, i) =>
      this.add.image(x, GROUND_Y + 6, 'l7_s1_tree').setOrigin(0.5, 1).setDisplaySize(150, 200).setDepth(-12).setTint(0x16241c).setAlpha(0.8));
    // shed (mid-left)
    this.add.image(480, GROUND_Y + 8, 'l7_s1_shed').setOrigin(0.5, 1).setDisplaySize(150, 132).setDepth(2);
    // picket fence stretches
    for (let x = 0; x < WORLD_W; x += 120) {
      if (x > 1050 && x < 1300) continue; // gap where attic area is
      this.add.image(x + 60, GROUND_Y + 12, 'l7_s1_fence').setOrigin(0.5, 1).setDisplaySize(120, 56).setDepth(3).setAlpha(0.9);
    }
    // big house far right
    this.add.image(2850, GROUND_Y + 10, 'l7_s1_house').setOrigin(0.5, 1).setDisplaySize(380, 280).setDepth(2);
    // nearer trees
    [1050, 2400].forEach(x => this.add.image(x, GROUND_Y + 10, 'l7_s1_tree').setOrigin(0.5, 1).setDisplaySize(170, 220).setDepth(4).setTint(0x101c16));
  }

  _buildGround() {
    const stripH = 90;
    this._groundTile = this.add.tileSprite(WORLD_W / 2, GROUND_Y + stripH / 2 - 6, WORLD_W, stripH, 'l7_s1_ground').setDepth(5);
    const body = this.add.rectangle(WORLD_W / 2, GROUND_Y + 16, WORLD_W, 28, 0, 0);
    this.physics.add.existing(body, true);
    this._ground = body;

    // Hurdle: fallen tree (jump over it)
    this._fallenTree = this.add.image(1000, GROUND_Y + 14, 'l7_fallentree').setOrigin(0.5, 1).setDisplaySize(120, 64).setDepth(8);
    const tb = this.add.rectangle(1000, GROUND_Y - 14, 90, 36, 0, 0);
    this.physics.add.existing(tb, true);
    this._treeBody = tb;

    // Mud puddles (slow / splash hazard)
    this._puddles = [400, 1750, 2500].map(x => ({
      x, img: this.add.image(x, GROUND_Y + 8, 'l7_puddle').setOrigin(0.5, 1).setDisplaySize(90, 26).setDepth(7), hit: false
    }));
  }

  _buildStations() {
    // Station markers + prompts. Each becomes interactive when player is near.
    this._stations = [
      { key: 'power',    x: 660,  tex: 'l7_fusebox', label: '⚡ Fuse Box', y: GROUND_Y - 80, dw: 70, dh: 86, run: () => this._wirePuzzle() },
      { key: 'attic',    x: 1450, tex: null,         label: '🪜 Attic',    y: GROUND_Y - 120, run: () => this._comboPuzzle() },
      { key: 'basement', x: 2200, tex: null,         label: '🚪 Basement', y: GROUND_Y - 60, run: () => this._basementPuzzle() },
    ];
    this._stations.forEach(st => {
      if (st.tex) st.sprite = this.add.image(st.x, st.y, st.tex).setDisplaySize(st.dw, st.dh).setDepth(9);
      else if (st.key === 'attic') {
        // attic = a lit window high on a pole/ladder
        this.add.rectangle(st.x, GROUND_Y - 50, 8, 100, 0x4a3420).setDepth(6); // ladder pole
        for (let i = 0; i < 5; i++) this.add.rectangle(st.x, GROUND_Y - 18 - i * 22, 26, 4, 0x6a4e2c).setDepth(6);
        st.sprite = this.add.rectangle(st.x, GROUND_Y - 130, 50, 44, 0xffd870, 0.9).setDepth(9).setStrokeStyle(3, 0x2a1a10);
      } else if (st.key === 'basement') {
        st.sprite = this.add.rectangle(st.x, GROUND_Y + 4, 70, 16, 0x1a1208).setOrigin(0.5, 1).setDepth(9).setStrokeStyle(2, 0x4a3420);
      }
      // glow
      st.glow = this.add.circle(st.x, st.sprite.y ?? st.y, 26, 0xffe9a0, 0.18).setDepth(8);
      this.tweens.add({ targets: st.glow, alpha: 0.4, scale: 1.25, duration: 800, yoyo: true, repeat: -1 });
      st.prompt = this.add.text(st.x, (st.sprite.y ?? st.y) - 50, `${st.label}\n[E] / tap`, {
        fontSize: '11px', fontFamily: 'Georgia, serif', color: '#fff', align: 'center',
        stroke: '#000', strokeThickness: 3, backgroundColor: '#000a', padding: { x: 6, y: 3 }
      }).setOrigin(0.5).setDepth(30).setVisible(false);
      // tap on marker to trigger when near
      st.sprite.setInteractive({ useHandCursor: true });
      st.sprite.on('pointerdown', () => { if (this._near === st && !this._busy) this._trigger(st); });
    });

    // House-door key-assembly point (appears after 3 fragments)
    this._assembleX = 2820;
  }

  _buildPlayer() {
    this.buildPlayer(80, GROUND_Y);
    this.physics.add.collider(this.player, this._ground);
    this.physics.add.collider(this.player, this._treeBody);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
  }

  update() {
    if (this._busy || this._paused) return;
    this.runMovement(210, -460);
    this.updateRain();
    this.updateFog();
    if (this._sky) this._sky.tilePositionX = this.cameras.main.scrollX * 0.1;

    // puddle splash slow
    for (const pd of this._puddles) {
      if (!pd.hit && Math.abs(this.player.x - pd.x) < 30 && this.player.body.blocked.down) {
        pd.hit = true;
        this.sparkleBurst(pd.x, GROUND_Y - 4, 6);
        this.toast('💦 Splash! Slippery mud — mind your step.', 1400);
        this.time.delayedCall(2500, () => { pd.hit = false; });
      }
    }

    // nearest station prompt
    let near = null;
    for (const st of this._stations) {
      if (!this._stationsDone[st.key] && Math.abs(this.player.x - st.x) < 70) near = st;
      st.prompt.setVisible(!this._stationsDone[st.key] && near === st);
    }
    this._near = near;
    if (near && Phaser.Input.Keyboard.JustDown(this.keys.E)) this._trigger(near);

    // assemble key when ready
    if (this._fragments >= 3 && !this._assembled && this.player.x > this._assembleX) {
      this._assembleKey();
    }
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
    // fragment flies to HUD
    const st = this._stations.find(s => s.key === key);
    if (st) { st.glow.destroy(); st.prompt.destroy(); }
    const frag = this.add.image(this.player.x, GROUND_Y - 90, 'l7_keyfrag').setDisplaySize(40, 40).setDepth(40);
    this.sparkleBurst(frag.x, frag.y, 12);
    this.tweens.add({ targets: frag, x: this.cameras.main.scrollX + 120, y: 70, scale: 0.5, duration: 700, scrollFactorX: 0 });
    this.time.delayedCall(720, () => frag.destroy());
    this.toast(`🗝️ Key fragment ${this._fragments}/3 collected!`, 2200);
    if (this._fragments >= 3) {
      this.time.delayedCall(900, () => this.toast('✨ All 3 fragments found — head to the house door →', 3200));
      // marker at door
      this._doorKey = this.add.image(2820, GROUND_Y - 70, 'l7_keyfrag').setDisplaySize(46, 46).setDepth(20);
      this.tweens.add({ targets: this._doorKey, y: this._doorKey.y - 12, duration: 700, yoyo: true, repeat: -1 });
      this.add.text(2820, GROUND_Y - 120, '🔧 Assemble Key', { fontSize: '11px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(20);
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
    this.tweens.add({ targets: key, scale: 1.4, duration: 600, ease: 'Back.easeOut', yoyo: true,
      onComplete: () => key.destroy() });
    this.cameras.main.flash(300, 255, 220, 120);
    this.time.delayedCall(900, () => {
      this.completeStage('L7_Cutscene', 'Jeep Key Assembled!', {
        slides: [
          { bg: 'l7_s2_bg', emoji: '🔑', charTex: 'gleeda_idle', text: 'Glenda grips the cold jeep key. "Hold on, Gamma. The puppies need a doctor — and I\'m getting us there."' },
          { bg: 'l7_s2_bg', emoji: '🚙', charTex: 'gleeda_idle', text: 'But out in the garage, the jeep sits low on one corner. A flat tyre. No journey starts until it\'s fixed.' },
        ],
        next: 'L7_Stage2', nextData: {}
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
    // dark interior
    const maskArea = { x: px + 20, y: py + 70, w: pw - 40, h: ph - 100 };
    const dark = this.add.rectangle(maskArea.x + maskArea.w / 2, maskArea.y + maskArea.h / 2, maskArea.w, maskArea.h, 0x05080c, 1)
      .setScrollFactor(0).setDepth(102); td.push(dark);

    // clutter (revealed faintly)
    const clutter = this.add.container(0, 0).setScrollFactor(0).setDepth(103); td.push(clutter);
    const addClutter = (x, y, emoji) => { const o = this.add.text(x, y, emoji, { fontSize: '30px' }).setOrigin(0.5).setAlpha(0.12); clutter.add(o); return o; };
    addClutter(maskArea.x + 70, maskArea.y + 60, '📦');
    addClutter(maskArea.x + 200, maskArea.y + 130, '🕸️');
    addClutter(maskArea.x + 360, maskArea.y + 70, '🪑');
    addClutter(maskArea.x + 460, maskArea.y + 150, '🛢️');
    // the fragment, hidden
    const fragX = maskArea.x + 300, fragY = maskArea.y + 110;
    const frag = this.add.image(fragX, fragY, 'l7_keyfrag').setDisplaySize(36, 36).setScrollFactor(0).setDepth(104).setAlpha(0).setInteractive({ useHandCursor: true });
    td.push(frag);

    // flashlight beam
    const beam = this.add.circle(maskArea.x + 80, maskArea.y + 80, 56, 0xffffcc, 0.16).setScrollFactor(0).setDepth(103); td.push(beam);
    const beamCore = this.add.circle(beam.x, beam.y, 30, 0xffffcc, 0.22).setScrollFactor(0).setDepth(103); td.push(beamCore);
    const torch = this.add.text(beam.x, beam.y, '🔦', { fontSize: '26px' }).setOrigin(0.5).setScrollFactor(0).setDepth(105).setInteractive({ draggable: true, useHandCursor: true });
    td.push(torch); this.input.setDraggable(torch);

    const reveal = () => {
      // reveal clutter/frag near beam
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
