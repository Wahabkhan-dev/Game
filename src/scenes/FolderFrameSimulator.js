import Phaser from 'phaser';
import { W, H } from '../config/GameConfig.js';

// ════════════════════════════════════════════════════════════════════════════
// FOLDER FRAME SIMULATOR
//
// Loads a small image sequence from one test folder and plays it frame by frame
// like a sprite sheet, but using separate image files. This makes it easy to
// test new character folders without changing the scene logic.
// ════════════════════════════════════════════════════════════════════════════

const FOLDER = 'assets/images/test/porcupine/';
const FRAME_FILES = ['01.png', '02.png', '03.png', '04.png', '05.png', '06.png'];
const FRAME_KEYS = FRAME_FILES.map((_, i) => `ffsim_frame_${i + 1}`);

const MOVE_SPEED = 200;
const RUN_FPS = 26;
const TARGET_HEIGHT = 130;

const BODY_W = 42;
const BODY_H = 118;

export class FolderFrameSimulator extends Phaser.Scene {
  constructor() { super('FolderFrameSimulator'); }

  preload() {
    this._failedKeys = new Set();
    this.load.on('loaderror', f => {
      this._failedKeys.add(f.key);
      console.error(`[FolderSim] ❌ LOAD FAILED: key="${f.key}"  url="${f.url}"`);
    });

    FRAME_FILES.forEach((file, i) => {
      const key = FRAME_KEYS[i];
      if (!this.textures.exists(key)) {
        this.load.image(key, `${FOLDER}${file}`);
      }
    });
  }

  create() {
    this.cameras.main.setBackgroundColor('#8ec5ff');
    this.cameras.main.fadeIn(300, 0, 0, 0);

    this._buildGround();
    this._buildHud();
    this._setupInput();

    this._scaleMap = {};
    this._frameIdx = 0;
    this._frameTimer = 0;
    this._facing = 1;
    this._moveDir = 0;

    this._prepareTextures();
    this._buildPlayer();
    this._showFrame(0);
  }

  _prepareTextures() {
    FRAME_KEYS.forEach(key => {
      if (!this.textures.exists(key)) return;
      const src = this.textures.get(key).getSourceImage();
      if (!src || !src.height) return;
      const scale = TARGET_HEIGHT / src.height;
      this._scaleMap[key] = scale;
    });
  }

  _buildGround() {
    const groundY = H - 56;
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0x6b4a2f, 1); g.fillRect(0, groundY, W, H - groundY);
    g.fillStyle(0x4c8f3a, 1); g.fillRect(0, groundY, W, 10);
    this._groundY = groundY;
  }

  _buildPlayer() {
    this.player = this.add.image(W / 2, this._groundY - BODY_H / 2, FRAME_KEYS[0])
      .setOrigin(0.5, 1)
      .setDepth(10);
  }

  _buildHud() {
    this.add.rectangle(W / 2, 24, W, 48, 0x000000, 0.5).setDepth(20);
    this.add.text(12, 14, '🦔 PORCUPINE FRAME SIMULATOR', {
      fontSize: '15px', fontFamily: 'Georgia, serif', color: '#ffe08a',
      stroke: '#000', strokeThickness: 3,
    }).setDepth(21);
    this.add.text(W - 12, 8, 'A/← Left   D/→ Right   ESC Menu', {
      fontSize: '10px', fontFamily: 'Arial', color: '#dddddd',
    }).setOrigin(1, 0).setDepth(21);
    this._stateTxt = this.add.text(W - 12, 24, 'State: idle', {
      fontSize: '11px', fontFamily: 'Courier New', color: '#53d8fb',
    }).setOrigin(1, 0).setDepth(21);
    this._frameReadout = this.add.text(W / 2, 44, '', {
      fontSize: '13px', fontFamily: 'Courier New', color: '#ffe08a',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(21);
  }

  _setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.input.keyboard.on('keydown-ESC', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(320, () => this.scene.start('Menu'));
    });
  }

  _showFrame(index) {
    const key = FRAME_KEYS[index % FRAME_KEYS.length];
    if (this.player) {
      this.player.setTexture(key);
      this.player.setScale(this._scaleMap[key] ?? 1);
      this.player.setFlipX(this._facing < 0);
      this.player.x = Phaser.Math.Clamp(this.player.x, 80, W - 80);
      this.player.y = this._groundY;
    }
  }

  update(_, delta) {
    const left = this.keys.a.isDown || this.cursors.left.isDown;
    const right = this.keys.d.isDown || this.cursors.right.isDown;

    if (left) {
      this._moveDir = -1;
      this._facing = -1;
      this.player.x -= MOVE_SPEED * (delta / 1000);
    } else if (right) {
      this._moveDir = 1;
      this._facing = 1;
      this.player.x += MOVE_SPEED * (delta / 1000);
    } else {
      this._moveDir = 0;
    }

    if (this._moveDir !== 0) {
      this._frameTimer += delta;
      const msPerFrame = 1000 / RUN_FPS;
      while (this._frameTimer >= msPerFrame) {
        this._frameTimer -= msPerFrame;
        this._frameIdx = (this._frameIdx + 1) % FRAME_KEYS.length;
      }
      this._showFrame(this._frameIdx);
      this._stateTxt.setText('State: play');
      this._frameReadout.setText(`FRAME ${this._frameIdx + 1} / ${FRAME_KEYS.length}`);
    } else {
      this._frameTimer = 0;
      this._showFrame(0);
      this._stateTxt.setText('State: idle');
      this._frameReadout.setText('IDLE  (first frame)');
    }
  }
}
