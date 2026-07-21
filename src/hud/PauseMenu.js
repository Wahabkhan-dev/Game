// ════════════════════════════════════════════════════════════════════════════
// PauseMenu — piece 5: hamburger menu button + pause modal (Resume/Restart/
// Settings/Exit). Ported from BaseLevelScene._openPauseMenu/_openSettings,
// themed. This module is presentation + button-wiring ONLY — it never touches
// this.physics/this.tweens/this.time itself; the scene's onOpen/onClose
// callbacks own pausing gameplay, so this composes with any existing flag
// convention (_paused, _pauseMenuOpen, _levelDone, etc).
// ════════════════════════════════════════════════════════════════════════════
import Phaser from 'phaser';
import { W, H } from '../config/GameConfig.js';

export function buildPauseMenu(scene, theme, cfg = {}) {
  const {
    menuX = W - 46, menuY = 8,
    onOpen = () => {}, onClose = () => {},
    onRestart = () => { scene.cameras.main.fadeOut(400, 0, 0, 0); scene.time.delayedCall(450, () => scene.scene.restart()); },
    onExit = () => { scene.cameras.main.fadeOut(500, 0, 0, 0); scene.time.delayedCall(550, () => scene.scene.start('Menu')); },
    showSettings = true,
    bindEsc = true,
  } = cfg;

  let open = false;
  let activeResume = null; // set while open — the cleanup fn shared by the Resume button and external close()

  // ── Hamburger button ────────────────────────────────────────────────────
  const menuBtnG = scene.add.graphics().setScrollFactor(0).setDepth(36);
  const drawMenuBtn = (hover) => {
    menuBtnG.clear();
    menuBtnG.fillStyle(hover ? 0x5a3010 : 0x2a1408, 0.88);
    menuBtnG.fillRoundedRect(menuX, menuY, 38, 28, 6);
    menuBtnG.lineStyle(1.5, hover ? theme.accent : 0x8a6030, 1);
    menuBtnG.strokeRoundedRect(menuX, menuY, 38, 28, 6);
  };
  drawMenuBtn(false);
  scene.add.text(menuX + 19, menuY + 14, '☰', {
    fontSize: '16px', fontFamily: theme.font, color: theme.textColor,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(37);
  const menuHit = scene.add.rectangle(menuX + 19, menuY + 14, 38, 28, 0, 0)
    .setScrollFactor(0).setDepth(38).setInteractive({ useHandCursor: true });
  menuHit.on('pointerover', () => drawMenuBtn(true));
  menuHit.on('pointerout', () => drawMenuBtn(false));
  menuHit.on('pointerup', () => (open ? doClose() : doOpen()));

  let escKey = null;
  if (bindEsc) {
    escKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey.on('down', () => (open ? doClose() : doOpen()));
  }

  function doOpen() {
    if (open) return;
    open = true;
    onOpen();

    const W2 = W / 2, H2 = H / 2;
    const PW = 270, PH = 268;
    const px = W2 - PW / 2, py = H2 - PH / 2;
    const toDestroy = [];

    toDestroy.push(scene.add.rectangle(W2, H2, W, H, 0x000000, 0.72).setScrollFactor(0).setDepth(95).setInteractive());

    const panelG = scene.add.graphics().setScrollFactor(0).setDepth(96);
    panelG.fillStyle(0x100c06, 0.97);
    panelG.fillRoundedRect(px, py, PW, PH, 14);
    panelG.lineStyle(2.5, theme.accent, 0.9);
    panelG.strokeRoundedRect(px, py, PW, PH, 14);
    toDestroy.push(panelG);

    toDestroy.push(scene.add.text(W2, py + 26, '☰  Game Menu', {
      fontSize: '17px', fontFamily: theme.font, color: theme.textColor,
      stroke: theme.textStroke, strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(97));

    const divG = scene.add.graphics().setScrollFactor(0).setDepth(97);
    divG.lineStyle(1, theme.accent, 0.35);
    divG.lineBetween(px + 18, py + 44, px + PW - 18, py + 44);
    toDestroy.push(divG);

    const doResume = () => {
      toDestroy.forEach(o => { try { if (o && o.active) o.destroy(); } catch (_) {} });
      open = false;
      activeResume = null;
      onClose();
    };
    activeResume = doResume;

    const BTNS = [
      { label: '▶   Resume', color: '#a8e878', action: () => doResume() },
      { label: '↺   Restart', color: theme.textColor, action: () => { doResume(); onRestart(); } },
      ...(showSettings ? [{ label: '⚙   Settings', color: '#c8a8f8', action: () => openSettings(px, py, PW, PH, doResume) }] : []),
      { label: '✕   Exit', color: '#f87070', action: () => { doResume(); onExit(); } },
    ];

    BTNS.forEach((btn, i) => {
      const by = py + 56 + i * 50;
      const BW = PW - 36, BH = 38;
      const bx = px + 18;

      const btnG = scene.add.graphics().setScrollFactor(0).setDepth(97);
      const draw = (hover) => {
        btnG.clear();
        btnG.fillStyle(hover ? 0x3a2010 : 0x221408, 0.95);
        btnG.fillRoundedRect(bx, by, BW, BH, 8);
        btnG.lineStyle(1.5, hover ? theme.accent : 0x6a4820, hover ? 1 : 0.7);
        btnG.strokeRoundedRect(bx, by, BW, BH, 8);
      };
      draw(false);
      toDestroy.push(btnG);

      const txt = scene.add.text(bx + BW / 2, by + BH / 2, btn.label, {
        fontSize: '14px', fontFamily: theme.font, color: btn.color,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(98);
      toDestroy.push(txt);

      const hit = scene.add.rectangle(bx + BW / 2, by + BH / 2, BW, BH, 0, 0)
        .setScrollFactor(0).setDepth(99).setInteractive({ useHandCursor: true });
      toDestroy.push(hit);
      hit.on('pointerover', () => { draw(true); txt.setColor('#ffffff'); });
      hit.on('pointerout', () => { draw(false); txt.setColor(btn.color); });
      hit.on('pointerup', () => btn.action());
    });
  }

  function openSettings(px, py, PW, PH, onBack) {
    const W2 = W / 2, H2 = H / 2;
    const SPW = PW - 20, SPH = 160;
    const spx = W2 - SPW / 2, spy = H2 - SPH / 2;
    const toDestroy = [];

    toDestroy.push(scene.add.rectangle(W2, H2, W, H, 0x000000, 0.45).setScrollFactor(0).setDepth(100).setInteractive());

    const sg = scene.add.graphics().setScrollFactor(0).setDepth(101);
    sg.fillStyle(0x150f08, 0.98);
    sg.fillRoundedRect(spx, spy, SPW, SPH, 12);
    sg.lineStyle(2, 0xc8a870, 0.85);
    sg.strokeRoundedRect(spx, spy, SPW, SPH, 12);
    toDestroy.push(sg);

    toDestroy.push(scene.add.text(W2, spy + 22, '⚙  Settings', {
      fontSize: '15px', fontFamily: theme.font, color: '#c8a8f8',
      stroke: '#0a0502', strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102));

    const closeSettings = () => toDestroy.forEach(o => { try { if (o && o.active) o.destroy(); } catch (_) {} });

    let sfxOn = scene.registry.get('sfxOn') !== false;
    const sfxG = scene.add.graphics().setScrollFactor(0).setDepth(102);
    const sfxTxt = scene.add.text(W2, spy + 68, '', { fontSize: '13px', fontFamily: theme.font, color: '#e8d0a8' }).setOrigin(0.5).setScrollFactor(0).setDepth(103);
    toDestroy.push(sfxG, sfxTxt);
    const drawSfx = () => {
      sfxG.clear();
      sfxG.fillStyle(sfxOn ? 0x44aa44 : 0x662222, 0.9);
      sfxG.fillRoundedRect(W2 + 30, spy + 58, 50, 22, 11);
      sfxTxt.setText(`🔊 Sound FX:  ${sfxOn ? 'ON ' : 'OFF'}`);
    };
    drawSfx();
    const sfxHit = scene.add.rectangle(W2 + 55, spy + 69, 50, 22, 0, 0).setScrollFactor(0).setDepth(104).setInteractive({ useHandCursor: true });
    toDestroy.push(sfxHit);
    sfxHit.on('pointerup', () => { sfxOn = !sfxOn; scene.registry.set('sfxOn', sfxOn); drawSfx(); });

    let musicOn = scene.registry.get('musicOn') !== false;
    const musicG = scene.add.graphics().setScrollFactor(0).setDepth(102);
    const musicTxt = scene.add.text(W2, spy + 100, '', { fontSize: '13px', fontFamily: theme.font, color: '#e8d0a8' }).setOrigin(0.5).setScrollFactor(0).setDepth(103);
    toDestroy.push(musicG, musicTxt);
    const drawMusic = () => {
      musicG.clear();
      musicG.fillStyle(musicOn ? 0x44aa44 : 0x662222, 0.9);
      musicG.fillRoundedRect(W2 + 30, spy + 90, 50, 22, 11);
      musicTxt.setText(`🎵 Music:        ${musicOn ? 'ON ' : 'OFF'}`);
    };
    drawMusic();
    const musicHit = scene.add.rectangle(W2 + 55, spy + 101, 50, 22, 0, 0).setScrollFactor(0).setDepth(104).setInteractive({ useHandCursor: true });
    toDestroy.push(musicHit);
    musicHit.on('pointerup', () => { musicOn = !musicOn; scene.registry.set('musicOn', musicOn); drawMusic(); });

    const backG = scene.add.graphics().setScrollFactor(0).setDepth(102);
    const drawBack = (h) => {
      backG.clear();
      backG.fillStyle(h ? 0x3a2010 : 0x221408, 0.95);
      backG.fillRoundedRect(W2 - 50, spy + SPH - 38, 100, 28, 7);
      backG.lineStyle(1.5, h ? theme.accent : 0x6a4820, 1);
      backG.strokeRoundedRect(W2 - 50, spy + SPH - 38, 100, 28, 7);
    };
    drawBack(false);
    toDestroy.push(backG);
    const backTxt = scene.add.text(W2, spy + SPH - 24, '← Back', { fontSize: '13px', fontFamily: theme.font, color: theme.textColor }).setOrigin(0.5).setScrollFactor(0).setDepth(103);
    toDestroy.push(backTxt);
    const backHit = scene.add.rectangle(W2, spy + SPH - 24, 100, 28, 0, 0).setScrollFactor(0).setDepth(104).setInteractive({ useHandCursor: true });
    toDestroy.push(backHit);
    backHit.on('pointerover', () => { drawBack(true); backTxt.setColor('#ffffff'); });
    backHit.on('pointerout', () => { drawBack(false); backTxt.setColor(theme.textColor); });
    backHit.on('pointerup', () => closeSettings());
  }

  function doClose() {
    // External programmatic close (ESC key, or any external caller) — reuses
    // the exact same cleanup as the Resume button so the modal is always destroyed.
    if (!open || !activeResume) return;
    activeResume();
  }

  return {
    open: doOpen,
    close: doClose,
    isOpen: () => open,
    destroy: () => { menuBtnG.destroy(); if (escKey) escKey.destroy(); },
  };
}
