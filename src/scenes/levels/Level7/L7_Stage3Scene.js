import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { L7BaseScene } from './L7BaseScene.js';
import { generateL7Assets } from './L7Assets.js';
import { preloadGlendaSkin } from './L7_GlendaSkin.js';

const WORLD_W = 3000;
const GROUND_Y = 408;

// ════════════════════════════════════════════════════════════════════════════
// STAGE 3 — FUEL COLLECTION  (rainy highway gas station, neon)
// Move barrel → start generator → connect pipes → unlock tank → fill the fuel.
// ════════════════════════════════════════════════════════════════════════════
export class L7_Stage3Scene extends L7BaseScene {
  constructor() { super('L7_Stage3'); }

  preload() {
    preloadGlendaSkin(this);
    const P = 'assets/images/Level7/Stage3/';
    // Real Gemini art for Stage 3. A procedural placeholder for these keys may
    // already exist (generateL7Assets in an earlier scene); drop it so the real
    // PNG loads. If a file is missing, generateL7Assets() in create() regenerates it.
    ['l7_s3_sky', 'l7_s3_ground', 'l7_s3_station', 'l7_barrel', 'l7_generator',
     'l7_barrier', 'l7_pipe_straight', 'l7_pipe_elbow', 'l7_fuelcan']
      .forEach(k => { if (this.textures.exists(k)) this.textures.remove(k); this.load.image(k, `${P}${k}.png`); });
    // reused jeep from Stage 2
    if (!this.textures.exists('l7_jeep_side')) this.load.image('l7_jeep_side', 'assets/images/Level7/Stage2/l7_jeep_side.png');
    this.load.on('loaderror', () => { /* generateL7Assets regenerates a fallback */ });
  }

  // size an image by target HEIGHT, preserving its native aspect ratio
  _wh(key, h) { const s = this.textures.get(key).getSourceImage(); return [h * s.width / s.height, h]; }

  create() {
    generateL7Assets(this);
    this.physics.world.setBounds(0, 0, WORLD_W, H + 200);
    this.cameras.main.setBounds(0, 0, WORLD_W, H);
    this.cameras.main.fadeIn(700, 0, 0, 0);
    this.cameras.main.setBackgroundColor('#0c1020');

    this._fuel = 0;          // 0..100
    this._stationsDone = {};

    this._buildWorld();
    this._buildGround();
    this._buildStations();
    this._buildPlayer();
    this.buildStageHUD(3, 'Collect the Fuel',
      ['Move the barrel', 'Start the generator', 'Connect the pipes', 'Unlock the tank', 'Fill the fuel']);
    this._buildFuelMeter();
    this.buildFog(18, 0.4);
    this.buildRain(140, 0x9fb8ff);
    this.startLightning();

    this.time.delayedCall(500, () => this.toast('⛽ Out of fuel! Reach the station and refuel. Walk right →', 3200));
  }

  _buildWorld() {
    // full-scene night roadside backdrop, scaled to fit the viewport height; the
    // existing update() parallax (tilePositionX) then drifts it gently.
    this._sky = this.add.tileSprite(W / 2, H / 2, W, H, 'l7_s3_sky').setScrollFactor(0).setDepth(-30);
    const sky = this.textures.get('l7_s3_sky').getSourceImage();
    if (sky && sky.height) this._sky.tileScaleX = this._sky.tileScaleY = H / sky.height;
    // gas station building near the right (aspect-preserved)
    const [stw, sth] = this._wh('l7_s3_station', 224);
    this.add.image(2750, GROUND_Y + 10, 'l7_s3_station').setOrigin(0.5, 1).setDisplaySize(stw, sth).setDepth(2);
    // a parked jeep at the start (the one that ran dry)
    const [jw, jh] = this._wh('l7_jeep_side', 118);
    this.add.image(180, GROUND_Y + 12, 'l7_jeep_side').setOrigin(0.5, 1).setDisplaySize(jw, jh).setDepth(3).setAlpha(0.97);
  }

  _buildGround() {
    const stripH = 90;
    const ground = this.add.tileSprite(WORLD_W / 2, GROUND_Y + stripH / 2 - 6, WORLD_W, stripH, 'l7_s3_ground').setDepth(5);
    const gs = this.textures.get('l7_s3_ground').getSourceImage();
    if (gs && gs.height) ground.tileScaleX = ground.tileScaleY = stripH / gs.height;  // fit the wet-road texture into the strip
    const body = this.add.rectangle(WORLD_W / 2, GROUND_Y + 16, WORLD_W, 28, 0, 0);
    this.physics.add.existing(body, true);
    this._ground = body;

    // Roadblock barriers (jump hurdles)
    const [bw, bh] = this._wh('l7_barrier', 58);
    this._barriers = [850, 1850].map(x => {
      this.add.image(x, GROUND_Y + 14, 'l7_barrier').setOrigin(0.5, 1).setDisplaySize(bw, bh).setDepth(8);
      const b = this.add.rectangle(x, GROUND_Y - 8, 80, 30, 0, 0);
      this.physics.add.existing(b, true);
      return b;
    });
  }

  _buildStations() {
    this._stations = [
      { key: 'barrel',    x: 600,  tex: 'l7_barrel',    dh: 86, label: '🛢️ Barrel',    obj: 0, run: () => this._moveBarrel() },
      { key: 'generator', x: 1200, tex: 'l7_generator', dh: 72, label: '🔌 Generator', obj: 1, run: () => this._startGenerator() },
      { key: 'pipes',     x: 1600, tex: 'l7_pipe_elbow',dh: 60, label: '🔧 Pipes',     obj: 2, run: () => this._connectPipes() },
      { key: 'tank',      x: 2300, tex: 'l7_fuelcan',   dh: 90, label: '🔒 Tank',      obj: 3, run: () => this._unlockTank() },
      { key: 'fill',      x: 2650, tex: 'l7_fuelcan',   dh: 96, label: '⛽ Fill',      obj: 4, run: () => this._fillFuel() },
    ];
    this._stations.forEach(st => {
      const [sw, sh] = this._wh(st.tex, st.dh);
      st.sprite = this.add.image(st.x, GROUND_Y - 4, st.tex).setOrigin(0.5, 1).setDisplaySize(sw, sh).setDepth(9).setInteractive({ useHandCursor: true });
      st.glow = this.add.circle(st.x, GROUND_Y - st.dh / 2 - 4, 28, 0x66ecff, 0.16).setDepth(8);
      this.tweens.add({ targets: st.glow, alpha: 0.4, scale: 1.25, duration: 800, yoyo: true, repeat: -1 });
      st.prompt = this.add.text(st.x, GROUND_Y - st.dh - 24, `${st.label}\n[E] / tap`, {
        fontSize: '11px', fontFamily: 'Georgia, serif', color: '#fff', align: 'center',
        stroke: '#000', strokeThickness: 3, backgroundColor: '#000a', padding: { x: 6, y: 3 }
      }).setOrigin(0.5).setDepth(30).setVisible(false);
      st.sprite.on('pointerdown', () => { if (this._near === st && !this._busy) this._trigger(st); });
    });
  }

  _buildPlayer() {
    this.buildPlayer(80, GROUND_Y);
    this.physics.add.collider(this.player, this._ground);
    this._barriers.forEach(b => this.physics.add.collider(this.player, b));
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
  }

  _buildFuelMeter() {
    const x = W - 150, y = 56;
    this.add.text(x + 60, y - 14, '⛽ FUEL', { fontSize: '11px', fontFamily: 'Georgia, serif', color: '#9fe0b0' }).setOrigin(0.5).setScrollFactor(0).setDepth(61);
    this._fuelFrame = this.add.graphics().setScrollFactor(0).setDepth(60);
    this._fuelFrame.fillStyle(0x0a140e, 0.85); this._fuelFrame.fillRoundedRect(x, y, 120, 18, 5);
    this._fuelFrame.lineStyle(1.5, 0x3a8a5a, 0.8); this._fuelFrame.strokeRoundedRect(x, y, 120, 18, 5);
    this.add.text(x - 6, y + 9, 'E', { fontSize: '9px', color: '#cc6666' }).setOrigin(0.5).setScrollFactor(0).setDepth(61);
    this.add.text(x + 126, y + 9, 'F', { fontSize: '9px', color: '#66cc88' }).setOrigin(0.5).setScrollFactor(0).setDepth(61);
    this._fuelFill = this.add.graphics().setScrollFactor(0).setDepth(61);
    this._fuelMeterPos = { x, y };
    this._drawFuel();
  }

  _drawFuel() {
    const { x, y } = this._fuelMeterPos;
    this._fuelFill.clear();
    const cells = 6, filled = Math.round(this._fuel / 100 * cells);
    for (let i = 0; i < cells; i++) {
      this._fuelFill.fillStyle(i < filled ? 0x44dd66 : 0x16301f, 1);
      this._fuelFill.fillRoundedRect(x + 4 + i * 19, y + 4, 16, 10, 2);
    }
  }

  setFuel(v) {
    this._fuel = Phaser.Math.Clamp(v, 0, 100);
    this._drawFuel();
  }

  update() {
    if (this._busy || this._paused) return;
    this.runMovement(210, -460);
    this.updateRain();
    this.updateFog();
    if (this._sky) this._sky.tilePositionX = this.cameras.main.scrollX * 0.1;

    let near = null;
    for (const st of this._stations) {
      const avail = this._isAvailable(st);
      if (avail && Math.abs(this.player.x - st.x) < 70) near = st;
      st.prompt.setVisible(avail && near === st);
    }
    this._near = near;
    if (near && Phaser.Input.Keyboard.JustDown(this.keys.E)) this._trigger(near);
  }

  // stations must be done in order (each prep step gates the next)
  _isAvailable(st) {
    if (this._stationsDone[st.key]) return false;
    const order = ['barrel', 'generator', 'pipes', 'tank', 'fill'];
    const idx = order.indexOf(st.key);
    return idx === 0 || this._stationsDone[order[idx - 1]];
  }

  _trigger(st) {
    if (this._busy || !this._isAvailable(st)) return;
    this.player.setVelocity(0, 0);
    const intros = {
      barrel:    ['🛢️', 'Move the Barrel', 'Drag the fuel barrel out of\nthe way onto the marker.'],
      generator: ['🔌', 'Start the Generator', 'Tap rapidly to pull the cord\nand fire up the generator!'],
      pipes:     ['🔧', 'Connect the Pipes', 'Rotate each pipe so the fuel\nline runs straight across.'],
      tank:      ['🔒', 'Unlock the Tank', 'Turn the dial to each number\nof the valve code in order.'],
      fill:      ['⛽', 'Fill the Fuel', 'Hold to pour. Watch the fuel\nmeter climb to FULL!'],
    };
    const [e, t, d] = intros[st.key];
    this.activityIntro(e, t, d, () => st.run());
  }

  _onStationWin(st, fuelTarget) {
    this._stationsDone[st.key] = true;
    this.completeObjective(st.obj);
    st.glow.destroy(); st.prompt.destroy();
    st.sprite.setTint(0x66ff99);
    this.sparkleBurst(st.x, GROUND_Y - 40, 12);
    if (fuelTarget != null) this.tweens.addCounter({ from: this._fuel, to: fuelTarget, duration: 600, onUpdate: t => this.setFuel(t.getValue()) });
    if (st.key === 'fill') {
      this.time.delayedCall(900, () => this._finishStage());
    } else {
      this.toast('✓ Done! Next prep step →', 1600);
    }
  }

  _finishStage() {
    this.cameras.main.flash(300, 120, 220, 140);
    this.registry.set('lives', this._lives);
    this.registry.set('l7_checkpoint', 'L7_Stage4');
    this.time.delayedCall(600, () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(520, () => {
        this._forceSceneStart('L7_Stage4');
      });
    });
  }

  // ── Move the Barrel (drag to marker) ───────────────────────────────────────
  _moveBarrel() {
    const { td, close, px, py, pw, ph } = this.openPanel('🛢️ Move the Barrel', 'Drag the barrel onto the green marker.', { w: 520, h: 320 });
    const targetX = px + pw - 110, targetY = py + ph - 90;
    const marker = this.add.circle(targetX, targetY, 42, 0x44dd66, 0.18).setScrollFactor(0).setDepth(102).setStrokeStyle(3, 0x44dd66, 0.9); td.push(marker);
    td.push(this.add.text(targetX, targetY - 58, 'PLACE HERE', { fontSize: '11px', color: '#7dff88' }).setOrigin(0.5).setScrollFactor(0).setDepth(102));
    const barrel = this.add.image(px + 120, targetY, 'l7_barrel').setDisplaySize(...this._wh('l7_barrel', 96)).setScrollFactor(0).setDepth(104).setInteractive({ draggable: true, useHandCursor: true });
    td.push(barrel); this.input.setDraggable(barrel);
    barrel.on('drag', (p, x, y) => barrel.setPosition(x, y));
    barrel.on('dragend', () => {
      if (Phaser.Math.Distance.Between(barrel.x, barrel.y, targetX, targetY) < 48) {
        barrel.disableInteractive();
        this.tweens.add({ targets: barrel, x: targetX, y: targetY, duration: 200 });
        this.cameras.main.flash(250, 120, 220, 140);
        this.time.delayedCall(450, () => { close(); this._onStationWin(this._stations[0], 20); });
      } else {
        this.tweens.add({ targets: barrel, x: px + 120, y: targetY, duration: 250, ease: 'Back.easeOut' });
      }
    });
  }

  // ── Start the Generator (tap-to-pull) ──────────────────────────────────────
  _startGenerator() {
    const { td, close, px, py, pw, ph } = this.openPanel('🔌 Start the Generator', 'Tap PULL or SPACE rapidly!', { w: 420, h: 320 });
    td.push(this.add.image(W / 2, py + 150, 'l7_generator').setDisplaySize(...this._wh('l7_generator', 104)).setScrollFactor(0).setDepth(102));
    let val = 0, done = false;
    const barX = px + 40, barY = py + 90, barW = 30, barH = 160;
    const frame = this.add.graphics().setScrollFactor(0).setDepth(103);
    frame.fillStyle(0x0a0f18, 1); frame.fillRoundedRect(barX, barY, barW, barH, 6); frame.lineStyle(2, 0x5a6a82, 1); frame.strokeRoundedRect(barX, barY, barW, barH, 6);
    td.push(frame);
    const fill = this.add.graphics().setScrollFactor(0).setDepth(104); td.push(fill);
    const draw = () => { fill.clear(); const h = val / 100 * (barH - 4); fill.fillStyle(val > 80 ? 0x7dff88 : 0xffaa33, 1); fill.fillRoundedRect(barX + 2, barY + (barH - 2) - h, barW - 4, h, 4); };
    draw();
    const pull = () => {
      if (done) return;
      val = Math.min(100, val + 13);
      draw();
      this.cameras.main.shake(40, 0.003);
      if (val >= 100) { done = true; this.cameras.main.flash(250, 120, 220, 140); this.time.delayedCall(400, () => { close(); this._onStationWin(this._stations[1], 40); }); }
    };
    this.panelButton(td, W / 2 + 60, py + ph - 40, '🪢  PULL', 0x7dff88, pull, 150, 46);
    const drain = this.time.addEvent({ delay: 60, loop: true, callback: () => { if (!done) { val = Math.max(0, val - 2.2); draw(); } } });
    td.push({ destroy: () => drain.remove() });
    const sp = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    sp.on('down', pull); td.push({ destroy: () => sp.removeAllListeners() });
  }

  // ── Connect the Pipes (rotate to straight) ─────────────────────────────────
  _connectPipes() {
    const { td, close, px, py, pw, ph } = this.openPanel('🔧 Connect the Pipes', 'Click each pipe to rotate it straight.', { w: 560, h: 300 });
    const n = 4, y = py + 150, startX = px + 130, gap = 76;
    // source + tank
    td.push(this.add.text(px + 60, y, '⛽', { fontSize: '34px' }).setOrigin(0.5).setScrollFactor(0).setDepth(102));
    td.push(this.add.text(px + pw - 50, y, '🛢️', { fontSize: '32px' }).setOrigin(0.5).setScrollFactor(0).setDepth(102));
    const pipes = [];
    for (let i = 0; i < n; i++) {
      const angle = Phaser.Utils.Array.GetRandom([90, 270]); // start vertical so a rotation is always required
      const pipe = this.add.image(startX + i * gap, y, 'l7_pipe_straight').setDisplaySize(64, 64).setAngle(angle).setScrollFactor(0).setDepth(103).setInteractive({ useHandCursor: true });
      pipe.setData('angle', angle);
      td.push(pipe); pipes.push(pipe);
      pipe.on('pointerdown', () => {
        const a = (pipe.getData('angle') + 90) % 360;
        pipe.setData('angle', a);
        this.tweens.add({ targets: pipe, angle: pipe.angle + 90, duration: 150 });
        this.time.delayedCall(170, check);
      });
    }
    const flow = this.add.graphics().setScrollFactor(0).setDepth(102); td.push(flow);
    const check = () => {
      const ok = pipes.every(p => p.getData('angle') % 180 === 0); // straight (horizontal)
      flow.clear();
      if (ok) {
        flow.lineStyle(6, 0x44dd66, 0.8); flow.lineBetween(px + 80, y, px + pw - 70, y);
        this.cameras.main.flash(250, 120, 220, 140);
        this.time.delayedCall(500, () => { close(); this._onStationWin(this._stations[2], 60); });
      }
    };
  }

  // ── Unlock the Tank (rotary code) ──────────────────────────────────────────
  _unlockTank() {
    const { td, close, px, py, pw, ph } = this.openPanel('🔒 Unlock the Tank', 'Dial to each number, then SET.', { w: 460, h: 320 });
    const code = [3, 5, 3];
    let stage = 0, val = 0;
    const codeTxt = this.add.text(W / 2, py + 80, '', { fontSize: '16px', fontFamily: 'Georgia, serif', color: '#f0c860' }).setOrigin(0.5).setScrollFactor(0).setDepth(103); td.push(codeTxt);
    const renderCode = () => codeTxt.setText('VALVE CODE:  ' + code.map((c, i) => i < stage ? '✓' : (i === stage ? `[${c}]` : c)).join('  '));
    renderCode();
    // dial
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
          this.time.delayedCall(400, () => { close(); this._onStationWin(this._stations[3], 75); });
        }
      } else {
        this.cameras.main.shake(160, 0.01);
        valTxt.setColor('#ff6666'); this.time.delayedCall(350, () => valTxt.setColor('#cfe0f5'));
      }
    }, 150, 42);
  }

  // ── Fill the Fuel (hold to pour, meter fills gradually) ────────────────────
  _fillFuel() {
    const { td, close, px, py, pw, ph } = this.openPanel('⛽ Fill the Fuel', 'Hold POUR until the tank is FULL!', { w: 440, h: 320 });
    td.push(this.add.image(W / 2, py + 150, 'l7_fuelcan').setDisplaySize(...this._wh('l7_fuelcan', 120)).setScrollFactor(0).setDepth(102));
    let level = this._fuel; // continue from 75
    const barX = px + pw - 90, barY = py + 80, barW = 40, barH = 170;
    const frame = this.add.graphics().setScrollFactor(0).setDepth(103);
    frame.fillStyle(0x0a140e, 1); frame.fillRoundedRect(barX, barY, barW, barH, 6); frame.lineStyle(2, 0x3a8a5a, 1); frame.strokeRoundedRect(barX, barY, barW, barH, 6);
    td.push(frame);
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
      this.setFuel(level);
      if (level >= 100) { done = true; this.cameras.main.flash(300, 120, 220, 140); this.time.delayedCall(400, () => { close(); this._onStationWin(this._stations[4], 100); }); }
    }});
    td.push({ destroy: () => loop.remove() });
    const btn = this.panelButton(td, W / 2 - 30, py + ph - 36, '⛽  HOLD TO POUR', 0x7dff88, () => {}, 220, 42);
    btn.on('pointerdown', () => holding = true);
    btn.on('pointerup',   () => holding = false);
    btn.on('pointerout',  () => holding = false);
    const eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    eKey.on('down', () => holding = true); eKey.on('up', () => holding = false);
    td.push({ destroy: () => eKey.removeAllListeners() });
  }
}
