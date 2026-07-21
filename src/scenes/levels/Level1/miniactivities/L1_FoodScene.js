import Phaser from 'phaser';
import { W, H } from '../../../../config/GameConfig.js';
import { BaseLevelScene } from '../../BaseLevelScene.js';
import { L1HUD } from '../hud/L1_HUD.js';
import { preloadDogSkin, applyDogSkin } from '../L1_DogSkin.js';
import { buildL1Background, updateL1Parallax, buildL1Ground } from '../L1_Scenery.js';
import { pickRandomGame } from '../../../../utils/MiniGamePicker.js';

// Bonus round — collect 5 pieces of meat across the world, solve puzzles, then
// return to Gemma at the start to feed her — all on one continuous map.
// Uses Level 1's premium fantasy HUD + black-dog "shadow spirit" skin.
export class L1_FoodScene extends BaseLevelScene {
  constructor() { super('L1_Food'); }

  preload() { preloadDogSkin(this); }

  // ── Premium fantasy HUD — same overrides Level1Scene uses ────────────────
  _buildHUD(config) {
    this._hud = new L1HUD(this, config);
    this._hud.build();
  }
  _drawHPPips()          { if (this._hud) this._hud.drawHP(this._shadowHP); }
  _setAttackBtn(visible) { if (this._hud) this._hud.setAttackVisible(visible); }

  // ── Real-art scenery (same jungle bg + forest-floor surface as Level 1) ─────
  _buildBackground(worldW) { buildL1Background(this, worldW); }
  _updateBgParallax()      { updateL1Parallax(this); }
  _buildGround(config)     { buildL1Ground(this, config); }

  _givePoints(n) {
    this._points = (this._points || 0) + n;
    this.registry.set('points', this._points);
    if (this._pointsTxt) this._pointsTxt.setText(`${this._points}`);
    const pop = this.add.text(W / 2, H / 2 - 80, `+${n} 🪙`, {
      fontSize: '26px', fontFamily: 'Georgia, serif', color: '#ffd24a', stroke: '#1a0f04', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(90);
    this.tweens.add({ targets: pop, y: pop.y - 40, alpha: 0, duration: 1000, onComplete: () => pop.destroy() });
  }
  _spendPoints(n) {
    this._points = Math.max(0, (this._points || 0) - n);
    this.registry.set('points', this._points);
    if (this._pointsTxt) this._pointsTxt.setText(`${this._points}`);
  }
  _resetTimer(seconds) {
    if (!this._timerTxt) return;
    this._timerLeft  = seconds;
    this._timerFull  = seconds;
    this._timerFired = false;
    this._timerTxt.setText(`${seconds}s`);
    this._timerTxt.setColor('#ffe08a');
  }
  _initZoneProgressBar() {
    if (this._progressBar) this._progressBar.setAlpha(0);
    const WORLD_W = (this.lvlConfig && this.lvlConfig.worldWidth) || 1800;
    if (this._hud) this._hud.buildProgressBar(WORLD_W);
  }

  create() {
    const config = {
      worldWidth:  1800,
      startX:      260,
      startY:      360,
      timer:       60,
      chapterName: 'Bonus — Find Meat for Gemma!',
      objective:   'Collect 5 pieces of meat and bring them back to Gemma! 🍖',
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

    // Level 1's black-dog "shadow spirit" skin + premium HUD.
    applyDogSkin(this);
    // Level 1 renders controls as Phaser wood buttons → hide the HTML footer.
    const _htmlFooter = document.getElementById('game-footer');
    if (_htmlFooter) _htmlFooter.style.display = 'none';
    this._initZoneProgressBar();

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

    // Sits just below the premium header (top row is health · timer · coin · menu)
    this._fruitTxt = this.add.text(W - 16, 62, '🍖 0 / 5', {
      fontSize: '16px', fontFamily: 'Georgia, serif',
      color: '#f5e0b0', stroke: '#1a0802', strokeThickness: 3
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(35);

    // Real-art meat prop (falls back to the procedural 'meat' texture if missing).
    const meatKey = this.textures.exists('l1_meat_real') ? 'l1_meat_real' : 'meat';

    fruitDefs.forEach((fd, idx) => {
      const fruit = this.physics.add.staticImage(fd.x, fd.y, meatKey).setDepth(9);
      if (meatKey === 'l1_meat_real') {
        fruit.setDisplaySize(46, 46);
        fruit.refreshBody();
      } else {
        fruit.setScale(1.0);
      }
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
        this._showMessage('Collect all 5 pieces of meat first! 🍖');
      }
    });

    this.time.delayedCall(900, () =>
      this._showMessage('Run right and collect 5 pieces of meat for Gemma! 🍖')
    );
  }

  _onFruitCollected(fruitNum) {
    this._collected++;
    this._fruitTxt.setText(`🍖 ${this._collected} / 5`);

    const sp = this.add.image(this.shadow.x, this.shadow.y - 20, 'sparkle').setDepth(20);
    this.tweens.add({ targets: sp, scale: 2, alpha: 0, duration: 450, onComplete: () => sp.destroy() });

    const pop = this.add.text(this.shadow.x, this.shadow.y - 30, '+1 🍖', {
      fontSize: '20px', fontFamily: 'Georgia, serif',
      color: '#ffcc44', stroke: '#1a0802', strokeThickness: 3
    }).setDepth(22);
    this.tweens.add({ targets: pop, y: pop.y - 50, alpha: 0, duration: 800, onComplete: () => pop.destroy() });
    this.cameras.main.flash(160, 60, 140, 10);

    // Puzzle at fruit 2 — Random mini-game
    if (fruitNum === 2 && !this._act2Done) {
      this._act2Done = true;
      this.time.delayedCall(900, async () => {
        const game = await pickRandomGame(1);
        if (game) this._launchMiniGame(game);
      });
    }

    // Puzzle at fruit 4 — Random mini-game
    if (fruitNum === 4 && !this._act4Done) {
      this._act4Done = true;
      this.time.delayedCall(900, async () => {
        const game = await pickRandomGame(1);
        if (game) this._launchMiniGame(game);
      });
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
    this._showMessage('All meat collected! Go back to Gemma! 💛', 3000);

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

    // Real feeding cinematic replaces the old sparkle/heart-burst celebration.
    this._playVideoOverlay('l1_food_video', () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.time.delayedCall(650, () => this.scene.start('L1_End'));
    });
  }

  update() {
    this._updateBgParallax();
    this.updateMovement();

    // Premium progress bar (same fields Level 1 drives)
    if (this._zpFill && this.shadow) {
      const pct = Math.min(this.shadow.x / this._zpWorldW, 1);
      this._zpFill.width = Math.max(2, pct * this._zpWidth);
      this._zpRunner.x = this._zpLeft + pct * this._zpWidth;
      this._zpFill.setFillStyle(0x44cc44);
    }
  }
}
