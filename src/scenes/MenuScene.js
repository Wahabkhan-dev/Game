import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    const W = 800, H = 450;
    this.cameras.main.fadeIn(700, 0, 0, 0);

    // Full background — artwork is the screen, no dark overlay
    if (this.textures.exists('start_screen')) {
      this.add.image(W / 2, H / 2, 'start_screen').setDisplaySize(W, H).setDepth(0);
    } else if (this.textures.exists('jungle_bg')) {
      this.add.image(W / 2, H / 2, 'jungle_bg').setDisplaySize(W, H).setDepth(0);
    } else {
      this.cameras.main.setBackgroundColor('#3a2010');
    }

    // ── Clean 2-column layout (left/centre of screen, clear of the artwork) ──
    //   [L1] [L2]
    //   [L3] [L4]
    //   [L5] [L6]
    //   [L7] [Dev/QA]
    //   [Continue] [Settings]
    const colA = 115, colB = 315, BW = 180;
    const r = [200, 256, 312, 368];

    this._playBtn(colA, r[0], '🐾 Level 1', () => this._go('IntroVideo'), BW);
    this._playBtn(colB, r[0], '👧 Level 2', () => this._go('Cinematic2'), BW);
    this._playBtn(colA, r[1], '🚗 Level 3', () => this._go('Level3', { l3_health: 100, l3_coins: 0 }), BW);
    this._playBtn(colB, r[1], '🏠 Level 4', () => this._go('Level4'), BW);
    this._playBtn(colA, r[2], '🐶 Level 5', () => this._go('L5_EquipmentRun'), BW);
    this._playBtn(colB, r[2], '🐾 Level 6', () => this._go('Level6'), BW);
    this._playBtn(colA, r[3], '🚑 Level 7', () => this._go('L7_Cutscene', { lives: 3, points: 0 }, {
      slides: [
        { bg: 'l7_s1_sky', emoji: '🌧️', charTex: 'gleeda_idle', text: 'A thunderstorm rolls over the countryside. Inside, Gamma the dog whimpers — her three newborn puppies are sick and fading fast.' },
        { bg: 'l7_s1_sky', emoji: '🐶', charTex: 'gleeda_idle', text: 'Glenda makes a vow: "I\'ll get you to the animal hospital tonight — whatever it takes." But first she needs the jeep key…' },
      ],
      next: 'L7_Stage1'
    }), BW);

    this._playBtn(colB, r[3], '🐾 Level 8', () => this._go('L8_FoodRun', { lives: 3, points: 0, l8_score: 0, l8_hp: 3 }), BW);

    // secondary row — three compact buttons (Dev/QA, Continue, Settings)
    this._secondaryBtn(150, 424, '🔧', 'Dev / QA', () => this._showDevMenu(),     150);
    this._secondaryBtn(330, 424, '📖', 'Continue', () => this._showContinueMsg(), 150);
    this._secondaryBtn(510, 424, '⚙', 'Settings',  () => this._showSettings(),    150);
  }

  // ── Shared launch helper: set registry, fade out, start scene ───────────────
  _go(sceneKey, reg = { lives: 3, points: 0 }, data) {
    Object.entries(reg).forEach(([k, v]) => this.registry.set(k, v));
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.time.delayedCall(520, () => this.scene.start(sceneKey, data));
  }

  // ── Coral-red Play button ─────────────────────────────────────────────────
  _playBtn(cx, cy, label, cb, bw = 210) {
    const BW = bw, BH = 48, R = 24;
    const bx = cx - BW / 2, by = cy - BH / 2;

    const g = this.add.graphics().setDepth(10);

    const redraw = (hover) => {
      g.clear();

      // Shadow (contained — no vertical bleed into next button)
      g.fillStyle(0x000000, 0.28);
      g.fillRoundedRect(bx + 2, by + 3, BW, BH, R);

      // 3-D bottom edge (dark red)
      g.fillStyle(0x6e1212, 1);
      g.fillRoundedRect(bx, by + 3, BW, BH - 3, R);

      // Main fill
      g.fillStyle(hover ? 0xd44040 : 0xc03535, 1);
      g.fillRoundedRect(bx, by, BW, BH - 3, R);

      // Top highlight — thin strip, small radius so it doesn't blob
      g.fillStyle(0xffffff, hover ? 0.18 : 0.12);
      g.fillRoundedRect(bx + 10, by + 4, BW - 20, 8, 4);

      // Gold border
      g.lineStyle(2, hover ? 0xf5c840 : 0xc8900a, 0.95);
      g.strokeRoundedRect(bx, by, BW, BH - 3, R);
    };

    redraw(false);

    // Invisible hit zone — same size as visible button, NO shadow included
    const hit = this.add.rectangle(cx, cy - 1, BW, BH - 3, 0x000000, 0)
      .setDepth(11).setInteractive({ useHandCursor: true });

    const labelTxt = this.add.text(cx, cy - 2, label, {
      fontSize: '19px', fontFamily: 'Georgia, serif',
      color: '#ffffff', stroke: '#5a0a0a', strokeThickness: 3,
      shadow: { x: 1, y: 2, color: '#000', blur: 3, fill: true }
    }).setOrigin(0.5).setDepth(11);

    hit.on('pointerover', () => { redraw(true);  labelTxt.setScale(1.04); });
    hit.on('pointerout',  () => { redraw(false); labelTxt.setScale(1); });
    hit.on('pointerdown', () => { labelTxt.y += 2; });
    hit.on('pointerup',   () => { labelTxt.y -= 2; cb(); });
  }

  // ── Beige secondary button ────────────────────────────────────────────────
  _secondaryBtn(cx, cy, icon, label, cb, bw = 182) {
    const BW = bw, BH = 36, R = 10;
    const bx = cx - BW / 2, by = cy - BH / 2;

    const g = this.add.graphics().setDepth(10);

    const redraw = (hover) => {
      g.clear();

      // Shadow
      g.fillStyle(0x000000, 0.22);
      g.fillRoundedRect(bx + 2, by + 3, BW, BH, R);

      // Bottom edge
      g.fillStyle(0x6e4a10, 1);
      g.fillRoundedRect(bx, by + 3, BW, BH - 3, R);

      // Main fill
      g.fillStyle(hover ? 0xdbb870 : 0xc8a458, 1);
      g.fillRoundedRect(bx, by, BW, BH - 3, R);

      // Top highlight — thin strip only
      g.fillStyle(0xffffff, hover ? 0.18 : 0.10);
      g.fillRoundedRect(bx + 8, by + 3, BW - 16, 6, 3);

      // Border
      g.lineStyle(1.5, hover ? 0xa07828 : 0x886018, 1);
      g.strokeRoundedRect(bx, by, BW, BH - 3, R);

      // Divider after icon
      g.lineStyle(1, 0x886018, 0.5);
      g.lineBetween(bx + 36, by + 6, bx + 36, by + BH - 9);
    };

    redraw(false);

    const hit = this.add.rectangle(cx, cy - 1, BW, BH - 3, 0x000000, 0)
      .setDepth(11).setInteractive({ useHandCursor: true });

    const iconTxt = this.add.text(bx + 18, cy - 2, icon, { fontSize: '14px' })
      .setOrigin(0.5).setDepth(11);

    const txt = this.add.text(bx + 36 + (BW - 36) / 2, cy - 2, label, {
      fontSize: '14px', fontFamily: 'Georgia, serif',
      color: '#2e1404', stroke: '#c8a458', strokeThickness: 1
    }).setOrigin(0.5).setDepth(11);

    hit.on('pointerover', () => { redraw(true);  txt.setScale(1.04); iconTxt.setScale(1.04); });
    hit.on('pointerout',  () => { redraw(false); txt.setScale(1);    iconTxt.setScale(1); });
    hit.on('pointerdown', () => { txt.y += 1; iconTxt.y += 1; });
    hit.on('pointerup',   () => { txt.y -= 1; iconTxt.y -= 1; cb(); });
  }

  // ── Continue popup ────────────────────────────────────────────────────────
  _showContinueMsg() {
    const W = 800, H = 450;
    const toDestroy = [];

    const backdrop = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6)
      .setDepth(30).setInteractive();
    toDestroy.push(backdrop);

    const bg = this.add.graphics().setDepth(31);
    bg.fillStyle(0x1a0e06, 0.97);
    bg.fillRoundedRect(250, 160, 300, 130, 14);
    bg.lineStyle(2, 0xd4a040, 0.9);
    bg.strokeRoundedRect(250, 160, 300, 130, 14);
    toDestroy.push(bg);

    toDestroy.push(this.add.text(400, 192, '🐾  No Saved Game', {
      fontSize: '17px', fontFamily: 'Georgia, serif', color: '#f5c87a'
    }).setOrigin(0.5).setDepth(32));

    toDestroy.push(this.add.text(400, 220, 'Play through a level first\nto create a save.', {
      fontSize: '12px', fontFamily: 'Georgia, serif',
      color: '#e8d0a8', align: 'center', lineSpacing: 4
    }).setOrigin(0.5).setDepth(32));

    const btnG = this.add.graphics().setDepth(32);
    btnG.fillStyle(0x3a1a08, 0.9);
    btnG.fillRoundedRect(330, 260, 140, 30, 7);
    btnG.lineStyle(1, 0xd4a040, 0.7);
    btnG.strokeRoundedRect(330, 260, 140, 30, 7);
    toDestroy.push(btnG);

    const closeHit = this.add.rectangle(400, 275, 140, 30, 0x000000, 0)
      .setDepth(33).setInteractive({ useHandCursor: true });
    toDestroy.push(closeHit);
    toDestroy.push(this.add.text(400, 275, '[ OK ]', {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#f5c87a'
    }).setOrigin(0.5).setDepth(33));

    const done = () => toDestroy.forEach(o => o.destroy());
    closeHit.on('pointerup', done);
    backdrop.on('pointerup', done);
  }

  // ── Settings popup ────────────────────────────────────────────────────────
  _showSettings() {
    const W = 800, H = 450;
    const toDestroy = [];

    const backdrop = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.65)
      .setDepth(30).setInteractive();
    toDestroy.push(backdrop);

    const bg = this.add.graphics().setDepth(31);
    bg.fillStyle(0x1a0e06, 0.97);
    bg.fillRoundedRect(230, 95, 340, 260, 14);
    bg.lineStyle(2, 0xd4a040, 0.9);
    bg.strokeRoundedRect(230, 95, 340, 260, 14);
    toDestroy.push(bg);

    toDestroy.push(this.add.text(400, 128, '⚙  Settings', {
      fontSize: '19px', fontFamily: 'Georgia, serif', color: '#f5c87a'
    }).setOrigin(0.5).setDepth(32));

    const divG = this.add.graphics().setDepth(32);
    divG.lineStyle(1, 0xd4a040, 0.35);
    divG.lineBetween(250, 148, 550, 148);
    toDestroy.push(divG);

    [{ label: 'Music', y: 190 }, { label: 'Sound FX', y: 240 }].forEach(row => {
      toDestroy.push(this.add.text(280, row.y, row.label, {
        fontSize: '14px', fontFamily: 'Georgia, serif', color: '#e8d0a8'
      }).setOrigin(0, 0.5).setDepth(32));

      let on = true;
      const tg = this.add.graphics().setDepth(32);
      toDestroy.push(tg);

      const drawToggle = () => {
        tg.clear();
        tg.fillStyle(on ? 0x3a8a3a : 0x4a3a2a, 1);
        tg.fillRoundedRect(460, row.y - 12, 54, 24, 12);
        tg.fillStyle(0xffffff, 1);
        tg.fillCircle(on ? 503 : 473, row.y, 9);
      };
      drawToggle();

      const th = this.add.rectangle(487, row.y, 54, 24, 0x000000, 0)
        .setDepth(33).setInteractive({ useHandCursor: true });
      toDestroy.push(th);
      th.on('pointerup', () => { on = !on; drawToggle(); });
    });

    const btnG = this.add.graphics().setDepth(32);
    btnG.fillStyle(0x3a1a08, 0.9);
    btnG.fillRoundedRect(320, 308, 160, 32, 8);
    btnG.lineStyle(1, 0xd4a040, 0.7);
    btnG.strokeRoundedRect(320, 308, 160, 32, 8);
    toDestroy.push(btnG);

    const closeHit = this.add.rectangle(400, 324, 160, 32, 0x000000, 0)
      .setDepth(33).setInteractive({ useHandCursor: true });
    toDestroy.push(closeHit);
    toDestroy.push(this.add.text(400, 324, '[ Close ]', {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#f5c87a'
    }).setOrigin(0.5).setDepth(33));

    const done = () => toDestroy.forEach(o => o.destroy());
    closeHit.on('pointerup', done);
    backdrop.on('pointerup', done);
  }

  // ── Dev / QA popup — every test jump in one tidy place ──────────────────────
  _showDevMenu() {
    const W = 800, H = 450;
    const names = ['Max', 'Bella', 'Coco', 'Milo', 'Daisy', 'Luna', 'Teddy'];
    const toDestroy = [];

    const backdrop = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.72)
      .setDepth(30).setInteractive();
    toDestroy.push(backdrop);

    const bg = this.add.graphics().setDepth(31);
    bg.fillStyle(0x0a0f1a, 0.98); bg.fillRoundedRect(100, 28, 600, 410, 14);
    bg.lineStyle(2, 0xf0a830, 0.9); bg.strokeRoundedRect(100, 28, 600, 410, 14);
    toDestroy.push(bg);

    toDestroy.push(this.add.text(400, 52, '🔧  Dev / QA — Jump to any scene', {
      fontSize: '15px', fontFamily: 'Georgia, serif', color: '#f0c860', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(32));

    const L7_INTRO = {
      slides: [
        { bg: 'l7_s1_sky', emoji: '🌧️', charTex: 'gleeda_idle', text: 'A thunderstorm rolls over the countryside. Inside, Gamma the dog whimpers — her three newborn puppies are sick and fading fast.' },
        { bg: 'l7_s1_sky', emoji: '🐶', charTex: 'gleeda_idle', text: 'Glenda makes a vow: "I\'ll get you to the animal hospital tonight — whatever it takes." But first she needs the jeep key…' },
      ],
      next: 'L7_Stage1'
    };

    const items = [
      ['▶  L7 — Full Story',     () => this._go('L7_Cutscene', { lives: 3, points: 0 }, L7_INTRO)],
      ['🏠  L7 Stage 1 — Key',    () => this._go('L7_Stage1')],
      ['🔧  L7 Stage 2 — Tyre',   () => this._go('L7_Stage2')],
      ['⛽  L7 Stage 3 — Fuel',   () => this._go('L7_Stage3')],
      ['🚗  L7 Stage 4 — Drive',  () => this._go('L7_Stage4')],
      ['🐶  L7 Stage 5 — Puppies',() => this._go('L7_Stage5')],
      ['▶  L8 — Puppy Care Day',  () => this._go('L8_FoodRun', { lives: 3, points: 0, l8_score: 0, l8_hp: 3 })],
      ['🍖  L8 — Feed Puppies',    () => this._go('L8_Feeding', { lives: 3, l8_score: 1000, l8_hp: 3 })],
      ['🏃  L8 — Home Run',        () => this._go('L8_HomeRun', { lives: 3, l8_score: 1500, l8_hp: 3 })],
      ['🎨  L8 — Decorate',        () => this._go('L8_Decorate', { lives: 3, l8_score: 2500, l8_hp: 3 })],
      ['1️⃣  L2 Phase 1',         () => this._go('Level2', { lives: 3, points: 0, l2_testPhase: 1 })],
      ['2️⃣  L2 Phase 2',         () => this._go('Level2', { lives: 3, points: 0, l2_testPhase: 2 })],
      ['3️⃣  L2 Phase 3',         () => this._go('Level2', { lives: 3, points: 0, l2_testPhase: 3 })],
      ['🐾  L2 Trust QA',         () => this._go('L2_Calmer')],
      ['1️⃣  L3 Zone 1',          () => this._go('L3_Drive', { l3_health: 100, l3_coins: 0, l3_startZone: 1 })],
      ['2️⃣  L3 Zone 2',          () => this._go('L3_Drive', { l3_health: 80,  l3_coins: 0, l3_startZone: 2 })],
      ['🏠  L4 Run',              () => this._go('Level4')],
      ['🔨  L4 Build',            () => this._go('L4_Decorate', { points: 0 })],
      ['🐶  L5 Garage',           () => this._go('Level5', { lives: 3, points: 0, l5_stars: 0 })],
      ['🐾  L6 Run',              () => this._go('Level6', { lives: 3, points: 0, l6_stars: 0 })],
      ['🏆  L6 Naming',           () => this._go('L6_NamingCeremony', {}, { names, stars: 1400 })],
      ['🐶  L6 Family',           () => this._go('L6_Introduction', {}, { names, stars: 1400 })],
    ];

    const bw = 270, bh = 28, perCol = 11;
    items.forEach(([label, fn], i) => {
      const col = i < perCol ? 0 : 1;
      const row = i % perCol;
      const cx = col ? 545 : 255;
      const cy = 84 + row * 32;

      const g = this.add.graphics().setDepth(32);
      g.fillStyle(0x1c2436, 0.96); g.fillRoundedRect(cx - bw / 2, cy - bh / 2, bw, bh, 8);
      g.lineStyle(1.5, 0x5a6a82, 1); g.strokeRoundedRect(cx - bw / 2, cy - bh / 2, bw, bh, 8);
      toDestroy.push(g);

      const t = this.add.text(cx, cy, label, {
        fontSize: '12px', fontFamily: 'Georgia, serif', color: '#cfe0f5'
      }).setOrigin(0.5).setDepth(33);
      toDestroy.push(t);

      const hit = this.add.rectangle(cx, cy, bw, bh, 0, 0).setDepth(34).setInteractive({ useHandCursor: true });
      toDestroy.push(hit);
      hit.on('pointerover', () => { g.clear(); g.fillStyle(0x2e3a4e, 0.98); g.fillRoundedRect(cx - bw / 2, cy - bh / 2, bw, bh, 8); g.lineStyle(1.5, 0xf0a830, 1); g.strokeRoundedRect(cx - bw / 2, cy - bh / 2, bw, bh, 8); t.setColor('#ffffff'); });
      hit.on('pointerout',  () => { g.clear(); g.fillStyle(0x1c2436, 0.96); g.fillRoundedRect(cx - bw / 2, cy - bh / 2, bw, bh, 8); g.lineStyle(1.5, 0x5a6a82, 1); g.strokeRoundedRect(cx - bw / 2, cy - bh / 2, bw, bh, 8); t.setColor('#cfe0f5'); });
      hit.on('pointerup',   () => fn());
    });

    const close = this.add.text(400, 416, '[ Close ]', {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#f0a830'
    }).setOrigin(0.5).setDepth(33).setInteractive({ useHandCursor: true });
    toDestroy.push(close);
    const done = () => toDestroy.forEach(o => o.destroy());
    close.on('pointerup', done);
    backdrop.on('pointerup', done);
  }
}
