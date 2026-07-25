import Phaser from 'phaser';
import { W, H } from '../config/GameConfig.js';
import { preloadSnakeSkin, createSnakeSprite } from './levels/SnakeSkin.js';

// ════════════════════════════════════════════════════════════════════════════
// SNAKE ANIM SIMULATOR
//
// Previews the snake hazard NPC (SnakeSkin.js) patrolling back and forth on
// its own, the same way the porcupine hazard patrols in Level 2 — continuous
// looping slither animation + autonomous bounce between two x bounds. Unlike
// FolderFrameSimulator (arrow-key controlled), this one drives itself so you
// can just watch the loop and tune speed/size before wiring it into a level.
// ════════════════════════════════════════════════════════════════════════════

const GROUND_MARGIN = 56;
const SNAKE_W = 270, SNAKE_H = 126;   // 3x size
const PATROL_MARGIN = SNAKE_W / 2 + 20;   // keeps the (now 3x wider) body fully on-screen at each turn
const SPEED = 1.4;          // px/frame at 60fps-equivalent (matches porcupine's scale)

export class SnakeAnimSimulator extends Phaser.Scene {
  constructor() { super('SnakeAnimSimulator'); }

  preload() {
    preloadSnakeSkin(this);
  }

  create() {
    this.cameras.main.setBackgroundColor('#8ec5ff');
    this.cameras.main.fadeIn(300, 0, 0, 0);

    this._buildGround();
    this._buildHud();
    this._setupInput();

    const groundY = H - GROUND_MARGIN;
    this._snake = {
      img: createSnakeSprite(this, W / 2, groundY, SNAKE_W, SNAKE_H).setOrigin(0.5, 1).setDepth(10),
      x: W / 2, dir: 1, min: PATROL_MARGIN, max: W - PATROL_MARGIN, speed: SPEED,
    };
  }

  _buildGround() {
    const groundY = H - GROUND_MARGIN;
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0x6b4a2f, 1); g.fillRect(0, groundY, W, H - groundY);
    g.fillStyle(0x4c8f3a, 1); g.fillRect(0, groundY, W, 10);
    this._groundY = groundY;
  }

  _buildHud() {
    this.add.rectangle(W / 2, 24, W, 48, 0x000000, 0.5).setDepth(20);
    this.add.text(12, 14, '🐍 SNAKE PATROL SIMULATOR', {
      fontSize: '15px', fontFamily: 'Georgia, serif', color: '#ffe08a',
      stroke: '#000', strokeThickness: 3,
    }).setDepth(21);
    this.add.text(W - 12, 8, 'ESC Menu', {
      fontSize: '10px', fontFamily: 'Arial', color: '#dddddd',
    }).setOrigin(1, 0).setDepth(21);
    this._stateTxt = this.add.text(W - 12, 24, 'State: patrolling', {
      fontSize: '11px', fontFamily: 'Courier New', color: '#53d8fb',
    }).setOrigin(1, 0).setDepth(21);
  }

  _setupInput() {
    this.input.keyboard.on('keydown-ESC', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(320, () => this.scene.start('Menu'));
    });
  }

  update() {
    const p = this._snake;
    if (!p) return;
    p.x += p.dir * p.speed;
    if (p.x >= p.max) { p.x = p.max; p.dir = -1; }
    if (p.x <= p.min) { p.x = p.min; p.dir = 1; }
    // Flip to face the direction of travel — flip the boolean below if the
    // source frames turn out to face the opposite way once you see them move.
    p.img.setX(p.x).setFlipX(p.dir > 0);
  }
}
