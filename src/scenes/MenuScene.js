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

    // Button layout — left side of screen, evenly spaced, no overlap
    // Play:     cy=268, h=48  → bottom edge at 292
    // Continue: cy=330, h=38  → top edge at 311  (gap 19px)
    // Settings: cy=378, h=38  → top edge at 359  (gap 21px)

    this._playBtn(158, 194, '🐾 Level 1', () => {
      this.registry.set('lives', 3);
      this.registry.set('points', 0);
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(520, () => this.scene.start('IntroVideo'));
    });

    this._playBtn(158, 243, '👧 Level 2', () => {
      this.registry.set('lives', 3);
      this.registry.set('points', 0);
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(520, () => this.scene.start('Cinematic2'));
    });

    this._playBtn(158, 292, '🚗 Level 3', () => {
      this.registry.set('l3_health', 100);
      this.registry.set('l3_coins',  0);
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(520, () => this.scene.start('Level3'));
    });

    this._playBtn(158, 341, '🏠 Level 4', () => {
      this.registry.set('lives', 3);
      this.registry.set('points', 0);
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(520, () => this.scene.start('Level4'));
    });

    this._playBtn(158, 390, '🐶 Level 5', () => {
      this.registry.set('lives', 3);
      this.registry.set('points', 0);
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(520, () => this.scene.start('L5_EquipmentRun'));
    });

    this._playBtn(258, 390, '🐾 Level 6', () => {
      this.registry.set('lives', 3);
      this.registry.set('points', 0);
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(520, () => this.scene.start('Level6'));
    });

    this._secondaryBtn(92,  432, '📖', 'Continue', () => this._showContinueMsg(), 126);
    this._secondaryBtn(224, 432, '⚙', 'Settings',  () => this._showSettings(),    126);

    // ── Dev test panel (L3 zones + L4 jumps) — centre ────────────────────
    const tp3G = this.add.graphics().setDepth(9);
    tp3G.fillStyle(0x020810, 0.72);
    tp3G.fillRoundedRect(302, 195, 192, 226, 12);
    tp3G.lineStyle(1.5, 0x4488cc, 0.55);
    tp3G.strokeRoundedRect(302, 195, 192, 226, 12);

    this.add.text(398, 214, '🔧  L3 / L4 Test', {
      fontSize: '12px', fontFamily: 'Georgia, serif',
      color: '#88ccff', stroke: '#010408', strokeThickness: 2
    }).setOrigin(0.5).setDepth(12);

    this._secondaryBtn(398, 250, '1️⃣', 'Zone 1', () => {
      this.registry.set('l3_health', 100);
      this.registry.set('l3_coins',  0);
      this.registry.set('l3_startZone', 1);
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(520, () => this.scene.start('L3_Drive'));
    });

    this._secondaryBtn(398, 292, '2️⃣', 'Zone 2', () => {
      this.registry.set('l3_health', 80);
      this.registry.set('l3_coins',  0);
      this.registry.set('l3_startZone', 2);
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(520, () => this.scene.start('L3_Drive'));
    });

    // ── Level 2 phase (zone) test panel — right side ─────────────────────
    const tpG = this.add.graphics().setDepth(9);
    tpG.fillStyle(0x080402, 0.72);
    tpG.fillRoundedRect(534, 195, 192, 228, 12);
    tpG.lineStyle(1.5, 0xc8a040, 0.55);
    tpG.strokeRoundedRect(534, 195, 192, 228, 12);

    this.add.text(630, 214, '🔧  L2 Zone Jump', {
      fontSize: '12px', fontFamily: 'Georgia, serif',
      color: '#f5c87a', stroke: '#0a0502', strokeThickness: 2
    }).setOrigin(0.5).setDepth(12);

    this._secondaryBtn(630, 250, '1️⃣', 'Phase 1', () => {
      this.registry.set('lives', 3);
      this.registry.set('points', 0);
      this.registry.set('l2_testPhase', 1);
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(520, () => this.scene.start('Level2'));
    });

    this._secondaryBtn(630, 292, '2️⃣', 'Phase 2', () => {
      this.registry.set('lives', 3);
      this.registry.set('points', 0);
      this.registry.set('l2_testPhase', 2);
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(520, () => this.scene.start('Level2'));
    });

    this._secondaryBtn(630, 334, '3️⃣', 'Phase 3', () => {
      this.registry.set('lives', 3);
      this.registry.set('points', 0);
      this.registry.set('l2_testPhase', 3);
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(520, () => this.scene.start('Level2'));
    });

    this._secondaryBtn(630, 376, '🐾', 'L2 Trust QA', () => {
      this.registry.set('lives', 3);
      this.registry.set('points', 0);
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(520, () => this.scene.start('L2_Calmer'));
    });

    // ── Level 4 test jumps (run vs. build scene) ─────────────────────────
    this._secondaryBtn(398, 332, '🏠', 'L4 Run', () => {
      this.registry.set('lives', 3);
      this.registry.set('points', 0);
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(520, () => this.scene.start('Level4'));
    });

    this._secondaryBtn(398, 374, '🔨', 'L4 Build', () => {
      this.registry.set('points', 0);
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(520, () => this.scene.start('L4_Decorate'));
    });

    // ── Level 5 test jump (Garage Treatment) ─────────────────────────────
    this._secondaryBtn(398, 416, '🐶', 'L5 Garage', () => {
      this.registry.set('lives', 3);
      this.registry.set('points', 0);
      this.registry.set('l5_stars', 0);
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(520, () => this.scene.start('Level5'));
    });

    // ── Level 6 test jumps (Puppy Naming Adventure) ──────────────────────
    const L6_TEST_NAMES = ['Max', 'Bella', 'Coco', 'Milo', 'Daisy', 'Luna', 'Teddy'];
    this._secondaryBtn(398, 458, '🐾', 'L6 Run', () => {
      this.registry.set('lives', 3);
      this.registry.set('points', 0);
      this.registry.set('l6_stars', 0);
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(520, () => this.scene.start('Level6'));
    });
    this._secondaryBtn(620, 416, '🏆', 'L6 Naming', () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(520, () => this.scene.start('L6_NamingCeremony', { names: L6_TEST_NAMES, stars: 1400 }));
    }, 116);
    this._secondaryBtn(620, 458, '🐶', 'L6 Family', () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(520, () => this.scene.start('L6_Introduction', { names: L6_TEST_NAMES, stars: 1400 }));
    }, 116);
  }

  // ── Coral-red Play button ─────────────────────────────────────────────────
  _playBtn(cx, cy, label, cb) {
    const BW = 210, BH = 48, R = 24;
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
}
