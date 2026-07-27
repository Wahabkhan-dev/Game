import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { L9BaseScene, L9 } from './L9BaseScene.js';
import { generateL9Assets } from './L9Assets.js';

// ════════════════════════════════════════════════════════════════════════════
// LEVEL 9 — PART 2 · STAGE 2 (FINALE): "Bow-Tie Time!"  🐶🎀
//
// The 7 puppies (Max, Bella, Coco, Milo, Daisy, Luna, Teddy) wait by the tree.
// Drag a bow from the tray onto each puppy to dress them up for the holidays.
// Any bow fits any puppy — the child just picks. When all 7 are dressed → a big
// family celebration + ending card → back to the Menu.
//
// A calm drag-and-drop scene, mirroring the Level-8 Decorate scene.
// ════════════════════════════════════════════════════════════════════════════

// Default names — used only if Level 6's naming ceremony was skipped
// (e.g. jumping straight into this scene from the debug menu).
const DEFAULT_PUP_NAMES = ['Max', 'Bella', 'Coco', 'Milo', 'Daisy', 'Luna', 'Teddy'];

const BOW_COUNT = 7;

export class L9_BowTieScene extends L9BaseScene {
  constructor() { super('L9_BowTie'); }

  // Real bg/ground art (see L9_GiftRunScene/L9_BowRunScene) — loaded here too
  // so a debug-menu jump straight into this scene can't beat the other Level 9
  // scenes to generateL9Assets() and lock in the procedural fallback instead.
  preload() {
    const load = (k, path) => { if (!this.textures.exists(k)) this.load.image(k, path); };
    load('l9_sky',          'assets/images/level 09/bg-l9.jpg');
    load('l9_ground',       'assets/images/level 09/bottom-l9.jpg');
    load('l9_puppy_real',   'assets/images/level 09/puppy-without-bow.png');
    load('l9_puppy_bow',    'assets/images/level 09/Puppy_with_boo.png');
    load('l9_room_bg_real', 'assets/images/level 09/after-decoration.png');
    load('l9_bow',          'assets/images/level 09/Bow.png');
  }

  create() {
    generateL9Assets(this);
    this.cameras.main.fadeIn(220, 0, 0, 0);
    this._done = false; this._dressed = 0;

    // Real puppy names, as given during Level 6's naming ceremony (persisted
    // via registry since it survives every scene hop in between).
    const names = this.registry.get('l6_puppy_names');
    this._pups = (Array.isArray(names) && names.length >= 1 ? names : DEFAULT_PUP_NAMES)
      .map(name => ({ name }));

    this.buildRoomBg();

    this.buildTopBanner('LEVEL 9', 'BOW-TIE PUPPIES', null);
    this._buildTray();
    this._buildPuppies();
    // progress lives at the bottom, same spot as Level 8's Feeding scene
    this._counter = this.buildProgressBar('🎀 DRESSED', this._pups.length);

    this.time.delayedCall(400, () => this.toast('🎀 Drag a bow onto each puppy to dress them up!', 3000));
  }

  // Same row placement as Level 8's Feeding scene puppies (fixed 92px gap,
  // anchored near the bottom of the screen, real puppy art at 51×96) so both
  // levels' puppy rows feel like one consistent piece.
  _buildPuppies() {
    const startX = 130, gap = 92, py = H - 96;
    const pupSrc = this.textures.get('l9_puppy_real').getSourceImage();
    const pupRatio = pupSrc.width / pupSrc.height;
    const pupH = 96, pupW = pupH * pupRatio;
    this._puppies = this._pups.map((pd, i) => {
      const x = startX + i * gap;
      // gentle stand shadow
      this.add.ellipse(x, py + 34, 62, 14, 0x000000, 0.14).setDepth(4);
      // Real puppy art (same illustration for all 7 — no per-puppy tint since
      // that would wash out the linework/shading; the name plate below is
      // what tells them apart, same as it already did).
      const pup = this.add.image(x, py, 'l9_puppy_real').setDisplaySize(pupW, pupH).setDepth(6);
      this.tweens.add({ targets: pup, y: py - 4, duration: 900 + i * 70, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      // name plate
      const plate = this.add.graphics().setDepth(6);
      plate.fillStyle(0x1c4a2e, 0.9); plate.fillRoundedRect(x - 34, py + 30, 68, 18, 6);
      plate.lineStyle(1.5, L9.GOLD, 0.8); plate.strokeRoundedRect(x - 34, py + 30, 68, 18, 6);
      this.add.text(x, py + 39, pd.name, { fontSize: '11px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#0a1a0e', strokeThickness: 2 }).setOrigin(0.5).setDepth(7);
      // "needs a bow" hint, floating just above the head
      const hintY = py - pupH / 2 - 12;
      const hint = this.add.text(x, hintY, '🎀?', { fontSize: '14px' }).setOrigin(0.5).setDepth(7);
      this.tweens.add({ targets: hint, y: hintY - 6, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      return { ...pd, x, y: py, pup, hint, dressed: false, bowImg: null };
    });
  }

  // Bow tray now sits at the top (same slot Level 8's Feeding food tray uses),
  // freeing the bottom of the screen for the puppy row + progress bar.
  // Uses the real Bow.png art (same asset the Bow Run collectibles use)
  // instead of the old procedurally-drawn colored bows.
  _buildTray() {
    const trayY = 102;
    const g = this.add.graphics().setDepth(30);
    g.fillStyle(0x1c4a2e, 0.85); g.fillRoundedRect(20, 74, W - 40, 56, 12);
    g.lineStyle(2, L9.GOLD, 0.8); g.strokeRoundedRect(20, 74, W - 40, 56, 12);
    this.add.text(30, 70, '🎀 Bows — drag one onto each puppy', { fontSize: '10px', fontFamily: 'Georgia, serif', color: '#ffe6a0' }).setOrigin(0, 1).setDepth(31);

    const src = this.textures.get('l9_bow').getSourceImage();
    const ratio = src.width / src.height;
    this._bowH = 40; this._bowW = this._bowH * ratio;
    this._bowDragH = 46; this._bowDragW = this._bowDragH * ratio;

    const n = BOW_COUNT;
    const startX = 70, endX = W - 70;
    const step = (endX - startX) / (n - 1);
    this._bows = Array.from({ length: n }, (_, i) => {
      const hx = startX + i * step, hy = trayY;
      const bow = this.add.image(hx, hy, 'l9_bow').setDisplaySize(this._bowW, this._bowH).setDepth(32);
      bow.setData('homeX', hx); bow.setData('homeY', hy); bow.setData('placed', false);
      bow.setInteractive({ useHandCursor: true, draggable: true });
      this.input.setDraggable(bow);
      const b = { tex: 'l9_bow', bow, hx, hy };
      bow.setData('b', b);
      return b;
    });

    // one global drag handler set (identifies the bow via getData)
    this.input.on('dragstart', (ptr, obj) => { if (obj.getData && obj.getData('b')) { obj.setDepth(60); obj.setDisplaySize(this._bowDragW, this._bowDragH); } });
    this.input.on('drag',      (ptr, obj, dx, dy) => { if (obj.getData && obj.getData('b')) obj.setPosition(dx, dy); });
    this.input.on('dragend',   (ptr, obj) => this._onDrop(obj));
  }

  _onDrop(obj) {
    const b = obj.getData && obj.getData('b');
    if (!b || obj.getData('placed') || this._done) return;
    obj.setDepth(32).setDisplaySize(this._bowW, this._bowH);

    // find nearest undressed puppy within reach
    let best = null, bestD = 9999;
    for (const pup of this._puppies) {
      if (pup.dressed) continue;
      const d = Phaser.Math.Distance.Between(obj.x, obj.y, pup.x, pup.y);
      if (d < 90 && d < bestD) { bestD = d; best = pup; }
    }

    if (best) {
      obj.setData('placed', true);
      obj.disableInteractive();
      this.input.setDraggable(obj, false);
      best.dressed = true;
      best.hint.destroy();
      // Magic swap: the dragged bow flies to the puppy's neck and shrinks
      // into a burst of sparkles the instant the puppy's own art swaps to
      // the already-wearing-the-bow illustration (Puppy_with_boo.png has the
      // bow baked into the art, so we don't keep a separate bow sprite tacked
      // onto the neck afterward).
      this.tweens.add({
        targets: obj, x: best.x, y: best.y + 4, scale: 0, duration: 220, ease: 'Back.easeIn',
        onComplete: () => {
          try { obj.destroy(); } catch (_) {}
          best.pup.setTexture('l9_puppy_bow');
          this.tweens.add({ targets: best.pup, scaleX: best.pup.scaleX * 1.25, scaleY: best.pup.scaleY * 1.25, duration: 160, yoyo: true, ease: 'Back.easeOut' });
          this.sparkleBurst(best.x, best.y - 10, 18);
        }
      });
      this.confetti(best.x, best.y - 10);
      this.popText(best.x, best.y - 40, `${best.name} looks great!`, '#ffe6a0');
      this.addScore(140);
      this._dressed++;
      this._counter(this._dressed);
      if (this._dressed >= this._pups.length) this.time.delayedCall(700, () => this._finish());
      else this.toast(`🎀 ${this._dressed} / ${this._pups.length} puppies dressed!`, 1100);
    } else {
      // snap back to the tray
      this.tweens.add({ targets: obj, x: obj.getData('homeX'), y: obj.getData('homeY'), duration: 240, ease: 'Back.easeOut' });
    }
  }

  _finish() {
    if (this._done) return;
    this._done = true;
    this.addScore(300);
    this.cameras.main.flash(500, 255, 240, 200);
    for (let k = 0; k < 5; k++) this.time.delayedCall(k * 200, () => this.confetti(Phaser.Math.Between(120, 680), Phaser.Math.Between(90, 160)));
    // puppies do a happy hop
    this._puppies.forEach((pup, i) => this.time.delayedCall(i * 90, () => {
      this.tweens.add({ targets: [pup.pup, pup.bowImg].filter(Boolean), y: `-=14`, duration: 200, yoyo: true, repeat: 1, ease: 'Sine.easeOut' });
    }));
    this.time.delayedCall(900, () =>
      this.playStoryVideos(['l9_part2'], () => this._endingCard())
    );
  }

  _endingCard() {
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x0a1a0e, 0).setScrollFactor(0).setDepth(120);
    this.tweens.add({ targets: bg, alpha: 0.5, duration: 600 });

    const cx = W / 2;
    const card = this.add.graphics().setScrollFactor(0).setDepth(121);
    card.fillStyle(0xfff6e8, 0.98); card.fillRoundedRect(cx - 220, 70, 440, 300, 18);
    card.lineStyle(3, L9.RED, 0.95); card.strokeRoundedRect(cx - 220, 70, 440, 300, 18);
    card.fillStyle(L9.GREEN, 1); card.fillRoundedRect(cx - 220, 70, 440, 44, 18); card.fillRect(cx - 220, 96, 440, 18);

    this.add.text(cx, 92, '🎄  Merry Christmas!', { fontSize: '22px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#0a1a0e', strokeThickness: 3 }).setOrigin(0.5).setScrollFactor(0).setDepth(122);
    this.add.text(cx, 138, 'All 7 puppies got their gifts and bows!', { fontSize: '14px', fontFamily: 'Georgia, serif', color: '#7a3a1a' }).setOrigin(0.5).setScrollFactor(0).setDepth(122);

    // a little row of bowed puppies on the card — real "with bow" art now
    // that every puppy is dressed, no separate bow overlay needed
    const cardPupSrc = this.textures.get('l9_puppy_bow').getSourceImage();
    const cardPupRatio = cardPupSrc.width / cardPupSrc.height;
    const cardPupH = 46, cardPupW = cardPupH * cardPupRatio;
    this._pups.forEach((pd, i) => {
      const x = cx - 180 + i * 60, y = 190;
      this.add.image(x, y, 'l9_puppy_bow').setDisplaySize(cardPupW, cardPupH).setScrollFactor(0).setDepth(122);
      this.add.text(x, y + 26, pd.name, { fontSize: '8px', fontFamily: 'Georgia, serif', color: '#5a3a1a' }).setOrigin(0.5).setScrollFactor(0).setDepth(123);
    });

    const score = this.registry.get('l9_score') ?? 0;
    this.add.text(cx, 244, `⭐ Score: ${score}`, { fontSize: '16px', fontFamily: 'Georgia, serif', color: '#2f7a4a' }).setOrigin(0.5).setScrollFactor(0).setDepth(122);
    this.add.text(cx, 270, '⭐⭐⭐  A perfect holiday!', { fontSize: '13px', fontFamily: 'Georgia, serif', color: '#d23a4e' }).setOrigin(0.5).setScrollFactor(0).setDepth(122);

    // buttons: Play again (Level 9) + Menu
    const mkBtn = (bx, label, color, cb) => {
      const bw = 170, bh = 38, by = 312;
      const g = this.add.graphics().setScrollFactor(0).setDepth(122);
      const draw = (h) => { g.clear(); g.fillStyle(h ? 0x3a9a5e : color, 1); g.fillRoundedRect(bx, by, bw, bh, 11); g.lineStyle(2, L9.GOLD, 0.9); g.strokeRoundedRect(bx, by, bw, bh, 11); };
      draw(false);
      const t = this.add.text(bx + bw / 2, by + bh / 2, label, { fontSize: '13px', fontFamily: 'Georgia, serif', color: '#fff', stroke: '#0a1a0e', strokeThickness: 2 }).setOrigin(0.5).setScrollFactor(0).setDepth(123);
      const hit = this.add.rectangle(bx + bw / 2, by + bh / 2, bw, bh, 0, 0).setScrollFactor(0).setDepth(124).setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => { draw(true); }); hit.on('pointerout', () => draw(false));
      hit.on('pointerup', cb);
    };
    mkBtn(cx - 180, '↺  Play Again', L9.GREEN, () => { this.cameras.main.fadeOut(500, 0, 0, 0); this.time.delayedCall(520, () => { this._wakeLoop(); this.registry.set('l9_score', 0); this.scene.start('L9_GiftRun', { lives: 3, points: 0, l9_score: 0, l9_hp: 3, l9_gifts: 0, l9_bows: 0 }); }); });
    mkBtn(cx + 10,  '🏠  Menu',       L9.RED,   () => { this.cameras.main.fadeOut(500, 0, 0, 0); this.time.delayedCall(520, () => { this._wakeLoop(); this.scene.start('Menu'); }); });
  }
}
