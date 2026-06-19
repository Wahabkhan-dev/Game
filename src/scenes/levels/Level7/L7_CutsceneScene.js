import Phaser from 'phaser';
import { W, H } from '../../../config/GameConfig.js';
import { generateL7Assets } from './L7Assets.js';

// ════════════════════════════════════════════════════════════════════════════
// L7_CutsceneScene — reusable cinematic between stages.
// init({ slides:[{bg,text,emoji,char,charTex}], next, nextData, title, final })
// ════════════════════════════════════════════════════════════════════════════
export class L7_CutsceneScene extends Phaser.Scene {
  constructor() { super('L7_Cutscene'); }

  init(data) {
    this._slides   = data.slides || [];
    this._next     = data.next;
    this._nextData = data.nextData || {};
    this._title    = data.title;
    this._final    = data.final === true;
    this._idx      = 0;
  }

  create() {
    generateL7Assets(this);
    this.cameras.main.fadeIn(700, 0, 0, 0);
    this.cameras.main.setBackgroundColor('#05080f');

    // Hide the gameplay footer and drop focus off any HTML button so the
    // keyboard reaches Phaser (tapping footer buttons can steal SPACE focus).
    const footer = document.getElementById('game-footer'); if (footer) footer.style.display = 'none';
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();

    // Give the game keyboard focus (some embedded browsers steal it).
    try {
      const cv = this.game.canvas; if (cv) { cv.setAttribute('tabindex', '0'); cv.focus(); }
      window.focus();
    } catch (_) {}

    // Letterbox bars for cinematic feel
    this.add.rectangle(W / 2, 18, W, 36, 0x000000, 1).setDepth(40);
    this.add.rectangle(W / 2, H - 18, W, 36, 0x000000, 1).setDepth(40);

    this._layer = this.add.container(0, 0).setDepth(10);

    // ── Big, obvious CONTINUE button — works by click/tap no matter what ──────
    const bw = 210, bh = 36, bx = W / 2 - bw / 2, by = H - 62;
    this._nextG = this.add.graphics().setDepth(46);
    this._nextG.fillStyle(0xc03535, 1); this._nextG.fillRoundedRect(bx, by, bw, bh, 11);
    this._nextG.lineStyle(2, 0xf5c840, 1); this._nextG.strokeRoundedRect(bx, by, bw, bh, 11);
    const nbTxt = this.add.text(W / 2, by + bh / 2, 'CONTINUE  ▶', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#ffffff', stroke: '#5a0a0a', strokeThickness: 3
    }).setOrigin(0.5).setDepth(47);
    const nbHit = this.add.rectangle(W / 2, by + bh / 2, bw, bh, 0, 0).setDepth(48).setInteractive({ useHandCursor: true });
    nbHit.on('pointerup', () => this._advance());
    this.tweens.add({ targets: [this._nextG, nbTxt], alpha: { from: 0.65, to: 1 }, duration: 700, yoyo: true, repeat: -1 });

    this._uiHint = this.add.text(W / 2, H - 15, 'tap anywhere · or press any key', {
      fontSize: '10px', fontFamily: 'Georgia, serif', color: '#9ab0c8'
    }).setOrigin(0.5).setDepth(47);

    // Advance on: the button, a click/tap anywhere, a Phaser key, OR a raw
    // window keydown (fallback for browsers where Phaser loses keyboard focus).
    this.input.keyboard.on('keydown', () => this._advance());
    this.input.on('pointerdown', () => this._advance());
    this._winKey = () => this._advance();
    window.addEventListener('keydown', this._winKey);
    this.events.once('shutdown', () => {
      window.removeEventListener('keydown', this._winKey);
      if (this._autoTimer) this._autoTimer.remove();
    });

    if (this._final) this._showFinal();
    else this._showSlide();
  }

  _showSlide() {
    this._layer.removeAll(true);
    const s = this._slides[this._idx];
    if (!s) { this._finish(); return; }

    // Background
    if (s.bg && this.textures.exists(s.bg)) {
      const img = this.add.image(W / 2, H / 2, s.bg).setDisplaySize(W, H);
      img.setTint(0x8a96b0);
      this._layer.add(img);
    } else {
      this._layer.add(this.add.rectangle(W / 2, H / 2, W, H, s.color ?? 0x0c1424, 1));
    }
    this._layer.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000814, 0.45));

    // Character portrait
    const charTex = s.charTex || 'gleeda_idle';
    if (this.textures.exists(charTex)) {
      const c = this.add.image(150, H - 70, charTex).setOrigin(0.5, 1);
      const img = this.textures.get(charTex).getSourceImage();
      const h = 180, w = h * (img.width / img.height);
      c.setDisplaySize(w, h);
      this._layer.add(c);
      this.tweens.add({ targets: c, y: c.y - 6, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // Emoji accent
    if (s.emoji) {
      const e = this.add.text(W - 130, 130, s.emoji, { fontSize: '60px' }).setOrigin(0.5);
      this._layer.add(e);
      this.tweens.add({ targets: e, scale: { from: 0.9, to: 1.08 }, duration: 1200, yoyo: true, repeat: -1 });
    }

    // Dialogue box (sits above the CONTINUE button)
    const boxY = H - 122;
    const box = this.add.graphics();
    box.fillStyle(0x0a0f1a, 0.9); box.fillRoundedRect(40, boxY - 34, W - 80, 64, 12);
    box.lineStyle(2, 0xf0a830, 0.7); box.strokeRoundedRect(40, boxY - 34, W - 80, 64, 12);
    this._layer.add(box);

    const txt = this.add.text(W / 2 + 30, boxY - 2, '', {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#fde8c0',
      align: 'center', wordWrap: { width: W - 220 }, lineSpacing: 4
    }).setOrigin(0.5);
    this._layer.add(txt);

    // Typewriter
    if (this._autoTimer) { this._autoTimer.remove(); this._autoTimer = null; }
    this._typing = true;
    const full = s.text || '';
    let i = 0;
    this._typeEv = this.time.addEvent({
      delay: 18, loop: true, callback: () => {
        i++; txt.setText(full.slice(0, i));
        if (i >= full.length) {
          this._typeEv.remove(); this._typing = false;
          // Safety net: auto-advance after a read pause so it can NEVER soft-lock.
          this._autoTimer = this.time.delayedCall(6500, () => this._advance());
        }
      }
    });
    this._curText = txt; this._curFull = full;
  }

  _advance() {
    // debounce key-repeat / rapid taps so we don't skip slides
    const now = this.time.now;
    if (this._lastAdv && now - this._lastAdv < 200) return;
    this._lastAdv = now;
    if (this._autoTimer) { this._autoTimer.remove(); this._autoTimer = null; }
    if (this._final) { this._finish(); return; }
    if (this._typing) { // finish typing instantly
      this._typeEv?.remove(); this._typing = false; this._curText?.setText(this._curFull); return;
    }
    this._idx++;
    if (this._idx >= this._slides.length) { this._finish(); return; }
    this.cameras.main.flash(180, 0, 0, 0);
    this._showSlide();
  }

  _finish() {
    if (this._done) return;
    this._done = true;
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.time.delayedCall(640, () => {
      if (this._next) this.scene.start(this._next, this._nextData);
      else this.scene.start('Menu');
    });
  }

  // ── Final celebration ──────────────────────────────────────────────────────
  _showFinal() {
    this._uiHint.setText('▶  tap to return to menu');
    // morning vet room
    if (this.textures.exists('l7_s5_bg')) this.add.image(W / 2, H / 2, 'l7_s5_bg').setDisplaySize(W, H).setDepth(0);
    // warm morning light sweep
    const light = this.add.rectangle(W / 2, H / 2, W, H, 0xffe9a0, 0.0).setDepth(2);
    this.tweens.add({ targets: light, alpha: 0.28, duration: 2500, yoyo: true, repeat: -1 });

    // Gamma + puppies resting
    if (this.textures.exists('l7_gamma')) this.add.image(W / 2 - 80, 300, 'l7_gamma').setDisplaySize(180, 128).setDepth(5);
    const colors = [0xffffff, 0xc89858, 0x9a7040];
    for (let i = 0; i < 3; i++) {
      const pup = this.add.image(W / 2 + 30 + i * 70, 320, 'l7_puppy').setDisplaySize(96, 70).setDepth(6).setTint(colors[i]);
      this.tweens.add({ targets: pup, y: pup.y - 5, duration: 900 + i * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    this.add.text(W / 2, 80, '🐾 LEVEL 7 COMPLETE', {
      fontSize: '30px', fontFamily: 'Georgia, serif', color: '#f5c84a', stroke: '#1a0e02', strokeThickness: 5
    }).setOrigin(0.5).setDepth(20);
    this.add.text(W / 2, 116, 'Emergency Journey', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#fde8c0', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(20);

    // Star rating
    for (let i = 0; i < 5; i++) {
      const st = this.add.image(W / 2 - 100 + i * 50, 160, 'l7_star').setScale(0).setDepth(20);
      this.time.delayedCall(500 + i * 250, () => {
        this.tweens.add({ targets: st, scale: 1.1, duration: 400, ease: 'Back.easeOut' });
        this.cameras.main.flash(120, 255, 230, 140);
      });
    }

    this.time.delayedCall(2200, () => {
      this.add.text(W / 2, 210, 'All three puppies are safe. ❤️', {
        fontSize: '14px', fontFamily: 'Georgia, serif', color: '#9fe0b0', stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(20);
    });

    // gentle confetti
    this.time.addEvent({ delay: 220, loop: true, callback: () => {
      const c = this.add.rectangle(Phaser.Math.Between(0, W), -10, 6, 10,
        [0xff5577, 0x44aaff, 0xffcc33, 0x66dd88][Phaser.Math.Between(0, 3)], 1).setDepth(18);
      this.tweens.add({ targets: c, y: H + 20, angle: 360, x: c.x + Phaser.Math.Between(-40, 40), duration: 3000, onComplete: () => c.destroy() });
    }});
  }
}
