import Phaser from 'phaser';
import { W, H } from '../../../../config/GameConfig.js';
import { BaseLevelScene } from '../../BaseLevelScene.js';

// Bonus round — collect 5 fruits across the world, solve puzzles, then
// return to Gemma at the start to feed her — all on one continuous map.
export class L1_FoodScene extends BaseLevelScene {
  constructor() { super('L1_Food'); }

  create() {
    const config = {
      worldWidth:  1800,
      startX:      260,
      startY:      360,
      timer:       60,
      chapterName: 'Bonus — Find Food for Gemma!',
      objective:   'Collect 5 fruits and bring them back to Gemma! 🍓',
      platforms: [
        { x:  480, y: 320, w: 62, h: 14 },
        { x:  720, y: 285, w: 62, h: 14 },
        { x:  980, y: 320, w: 62, h: 14 },
        { x: 1240, y: 280, w: 62, h: 14 },
        { x: 1520, y: 305, w: 62, h: 14 },
      ],
      gaps: [
        { x: 590, w: 110 },
        { x: 1080, w: 120 },
      ],
    };

    this.initLevel(config);

    // ── Gemma in her cage, waiting at the left ───────────────────────────
    this._gemmaX = 55;
    this._gemmaY = H - 32;   // ground surface (setOrigin bottom-anchored)

    // Smaller cage: 100px wide so it stays in x=5..105, well left of Shadow's spawn (260)
    const cageW = 100, cageH = 90;
    const cageL = this._gemmaX - cageW / 2;   // = 5
    const cageT = this._gemmaY - cageH;

    // Back wall of cage (depth 7)
    const cageBack = this.add.graphics().setDepth(7);
    cageBack.fillStyle(0x1a1208, 1);
    cageBack.fillRect(cageL, cageT, cageW, cageH);
    cageBack.lineStyle(2, 0x3a2e10, 1);
    cageBack.strokeRect(cageL, cageT, cageW, cageH);
    cageBack.lineStyle(3, 0x2a2010, 0.9);
    for (let row = 1; row <= 3; row++) {
      const by = cageT + (cageH / 4) * row;
      cageBack.lineBetween(cageL + 4, by, cageL + cageW - 4, by);
    }

    // Gemma inside the cage (depth 8)
    this._gemmaImg = this.add.image(this._gemmaX, this._gemmaY, 'gemma_idle')
      .setDisplaySize(95, 52).setOrigin(0.5, 1).setDepth(8);
    this.tweens.add({
      targets: this._gemmaImg, y: this._gemmaY - 4,
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // Front bars of cage drawn OVER Gemma (depth 10)
    const cageFront = this.add.graphics().setDepth(10);
    const barCount = 6;
    const barGap = cageW / (barCount + 1);
    cageFront.lineStyle(5, 0x4a3a18, 1);
    for (let b = 1; b <= barCount; b++) {
      const bx = cageL + barGap * b;
      cageFront.lineBetween(bx, cageT + 3, bx, this._gemmaY - 2);
    }
    cageFront.lineStyle(6, 0x4a3a18, 1);
    cageFront.lineBetween(cageL, cageT + 3,              cageL + cageW, cageT + 3);
    cageFront.lineBetween(cageL, cageT + cageH * 0.45,   cageL + cageW, cageT + cageH * 0.45);
    cageFront.lineBetween(cageL, this._gemmaY - 2,        cageL + cageW, this._gemmaY - 2);
    cageFront.lineStyle(2, 0xc8a040, 0.35);
    for (let b = 1; b <= barCount; b++) {
      const bx = cageL + barGap * b - 1;
      cageFront.lineBetween(bx, cageT + 3, bx, this._gemmaY - 2);
    }

    // Glow under cage — appears when all fruits collected
    this._gemmaGlow = this.add.circle(this._gemmaX, this._gemmaY - 10, 38, 0xffcc00, 0)
      .setDepth(6);

    // Feed trigger zone: sits just to the RIGHT of the cage front bars
    // so Shadow walks up to the cage and the overlap fires automatically
    const zoneX = cageL + cageW + 35;   // = 140 — right of cage, clear of bars
    this._gemmaZone = this.physics.add.staticImage(zoneX, this._gemmaY - 40, null)
      .setSize(70, 85).setAlpha(0).refreshBody();

    // ── 5 fruits scattered to the right ──────────────────────────────────
    const fruitDefs = [
      { x:  480, y: 298 },
      { x:  720, y: 262 },
      { x:  980, y: 298 },
      { x: 1240, y: 257 },
      { x: 1520, y: 282 },
    ];

    this._collected  = 0;
    this._needed     = 5;
    this._act2Done   = false;
    this._act4Done   = false;
    this._act5Done   = false;
    this._readyFeed  = false;

    this._fruitTxt = this.add.text(W - 20, 18, '🍓 0 / 5', {
      fontSize: '15px', fontFamily: 'Georgia, serif',
      color: '#f5e0b0', stroke: '#1a0802', strokeThickness: 2
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(35);

    fruitDefs.forEach((fd, idx) => {
      const fruit = this.physics.add.staticImage(fd.x, fd.y, 'berry')
        .setScale(1.5).setDepth(9);
      const glow = this.add.circle(fd.x, fd.y, 20, 0xffcc44, 0.2).setDepth(8);
      this.tweens.add({
        targets: fruit, y: fd.y - 7,
        duration: 700 + idx * 100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
      this.tweens.add({
        targets: glow, alpha: 0.4, scaleX: 1.3, scaleY: 1.3,
        duration: 650 + idx * 80, yoyo: true, repeat: -1
      });

      this.physics.add.overlap(this.shadow, fruit, () => {
        if (fruit.getData('collected')) return;
        fruit.setData('collected', true);
        fruit.destroy();
        glow.destroy();
        this._onFruitCollected(idx + 1);
      });
    });

    // Overlap: Shadow returns to Gemma with all 5 fruits
    this.physics.add.overlap(this.shadow, this._gemmaZone, () => {
      if (!this._levelDone && this._readyFeed) {
        this._levelDone = true;
        this._feedGemma();
      } else if (!this._levelDone && this._collected > 0 && !this._hintedReturn) {
        this._hintedReturn = true;
        this._showMessage('Collect all 5 fruits first! 🍓');
      }
    });

    this.time.delayedCall(900, () =>
      this._showMessage('Run right and collect 5 fruits for Gemma! 🍓')
    );
  }

  _onFruitCollected(fruitNum) {
    this._collected++;
    this._fruitTxt.setText(`🍓 ${this._collected} / 5`);

    const sp = this.add.image(this.shadow.x, this.shadow.y - 20, 'sparkle').setDepth(20);
    this.tweens.add({ targets: sp, scale: 2, alpha: 0, duration: 450, onComplete: () => sp.destroy() });

    const pop = this.add.text(this.shadow.x, this.shadow.y - 30, '+1 🍓', {
      fontSize: '20px', fontFamily: 'Georgia, serif',
      color: '#ffcc44', stroke: '#1a0802', strokeThickness: 3
    }).setDepth(22);
    this.tweens.add({ targets: pop, y: pop.y - 50, alpha: 0, duration: 800, onComplete: () => pop.destroy() });
    this.cameras.main.flash(160, 60, 140, 10);

    // Puzzle at fruit 2
    if (fruitNum === 2 && !this._act2Done) {
      this._act2Done = true;
      this.time.delayedCall(900, () =>
        this._puzzleSizeCompare(() => this._showMessage('Great! Keep collecting! 🍓'))
      );
    }

    // Puzzle at fruit 4
    if (fruitNum === 4 && !this._act4Done) {
      this._act4Done = true;
      this.time.delayedCall(900, () =>
        this._puzzlePattern(() => this._showMessage('Almost there! One more! 🍓'))
      );
    }

    // Puzzle at fruit 5 — last collection mini-activity
    if (fruitNum === 5 && !this._act5Done) {
      this._act5Done = true;
      this.time.delayedCall(900, () =>
        this._puzzleMissingLetter(() => this._onAllCollected())
      );
    }
  }

  _onAllCollected() {
    this._readyFeed = true;
    this._showMessage('All fruits collected! Go back to Gemma! 💛', 3000);

    // Gemma glows to guide the player back
    this.tweens.add({
      targets: this._gemmaGlow,
      alpha: { from: 0.15, to: 0.5 }, scaleX: { from: 1, to: 1.5 }, scaleY: { from: 1, to: 1.5 },
      duration: 550, yoyo: true, repeat: -1
    });
  }

  _feedGemma() {
    this.shadow.setVelocityX(0);
    this._gemmaGlow.destroy();
    this.cameras.main.shake(280, 0.009);

    // Gemma bounces happily
    this.tweens.add({
      targets: this._gemmaImg, y: '-=18',
      duration: 220, yoyo: true, repeat: 4
    });

    // Hearts burst
    for (let i = 0; i < 10; i++) {
      this.time.delayedCall(i * 120, () => {
        const h = this.add.image(
          this._gemmaX + (Math.random() - 0.5) * 60,
          this._gemmaY - 30,
          'heart'
        ).setDepth(60).setScale(0.7);
        this.tweens.add({ targets: h, y: h.y - 80, alpha: 0, duration: 1000, onComplete: () => h.destroy() });
      });
    }

    this.cameras.main.flash(500, 80, 160, 20);
    this._showMessage('Gemma is SO happy! 💛 Shadow is the best friend!', 3000);

    this.time.delayedCall(2200, () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.time.delayedCall(650, () => this.scene.start('L1_End'));
    });
  }

  update() {
    this._updateBgParallax();
    this.updateMovement();
  }
}
