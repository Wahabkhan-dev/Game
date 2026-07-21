import Phaser from 'phaser';
import { W, H } from '../config/GameConfig.js';

// ════════════════════════════════════════════════════════════════════════════
// CAR SIMULATOR
//
// Loads the Level 3 car image sequence (public/assets/images/Level 3/car/) and
// plays it frame by frame like a sprite sheet, but using separate image files —
// same technique as FolderFrameSimulator.js, just themed for the car (road
// background, drives left/right instead of walking). Lets you preview the new
// car art/animation before wiring it into the real Level 3 car-journey scene.
// ════════════════════════════════════════════════════════════════════════════

// Exported so the real Level 3 driving scene (L3_CarJourneyScene) can load and
// animate the exact same frame set/keys/rate tuned here instead of duplicating them.
export const FOLDER = 'assets/images/Level 3/car/';
const FRAME_N = 9;
export const FRAME_FILES = Array.from({ length: FRAME_N }, (_, i) => `frame_${String(i + 1).padStart(3, '0')}.png`);
export const FRAME_KEYS = FRAME_FILES.map((_, i) => `carsim_frame_${i + 1}`);

const MOVE_SPEED = 260;
export const RUN_FPS = 14;
export const TARGET_HEIGHT = 90;   // frames are 1046×410 (≈2.55:1) → width ≈ 230 at this height

export class CarSimulator extends Phaser.Scene {
  constructor() { super('CarSimulator'); }

  preload() {
    this._failedKeys = new Set();
    this.load.on('loaderror', f => {
      this._failedKeys.add(f.key);
      console.error(`[CarSim] ❌ LOAD FAILED: key="${f.key}"  url="${f.url}"`);
    });

    FRAME_FILES.forEach((file, i) => {
      const key = FRAME_KEYS[i];
      if (!this.textures.exists(key)) {
        this.load.image(key, `${FOLDER}${file}`);
      }
    });
  }

  create() {
    this.cameras.main.setBackgroundColor('#4a4a52');
    this.cameras.main.fadeIn(300, 0, 0, 0);

    this._buildRoad();
    this._buildHud();
    this._setupInput();

    this._scaleMap = {};
    this._frameIdx = 0;
    this._frameTimer = 0;
    this._facing = 1;
    this._moveDir = 0;

    this._prepareTextures();
    this._buildCar();
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

  // Dark asphalt road (matches Level 3's dusk-drive theme) instead of grass.
  _buildRoad() {
    const roadY = H - 70;
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0x1e1f26, 1); g.fillRect(0, roadY, W, H - roadY);
    // Yellow lane-dash strip
    g.fillStyle(0xe8c840, 0.85);
    for (let x = 10; x < W; x += 60) g.fillRect(x, roadY + 18, 34, 4);
    // Kerb line
    g.fillStyle(0x38393f, 1); g.fillRect(0, roadY, W, 6);
    // Car's wheel-contact line sits at the lane-dash strip, not the road's top edge.
    this._roadY = roadY + 22;
  }

  _buildCar() {
    this.car = this.add.image(W / 2, this._roadY, FRAME_KEYS[0])
      .setOrigin(0.5, 1)
      .setDepth(10);
  }

  _buildHud() {
    this.add.rectangle(W / 2, 24, W, 48, 0x000000, 0.5).setDepth(20);
    this.add.text(12, 14, '🚗 CAR SIMULATOR', {
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
    if (this.car) {
      this.car.setTexture(key);
      this.car.setScale(this._scaleMap[key] ?? 1);
      this.car.setFlipX(this._facing < 0);
      this.car.x = Phaser.Math.Clamp(this.car.x, 120, W - 120);
      this.car.y = this._roadY;
    }
  }

  update(_, delta) {
    const left = this.keys.a.isDown || this.cursors.left.isDown;
    const right = this.keys.d.isDown || this.cursors.right.isDown;

    if (left) {
      this._moveDir = -1;
      this._facing = -1;
      this.car.x -= MOVE_SPEED * (delta / 1000);
    } else if (right) {
      this._moveDir = 1;
      this._facing = 1;
      this.car.x += MOVE_SPEED * (delta / 1000);
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
      this._stateTxt.setText('State: driving');
      this._frameReadout.setText(`FRAME ${this._frameIdx + 1} / ${FRAME_KEYS.length}`);
    } else {
      this._frameTimer = 0;
      this._showFrame(0);
      this._stateTxt.setText('State: idle');
      this._frameReadout.setText('IDLE  (first frame)');
    }
  }
}
