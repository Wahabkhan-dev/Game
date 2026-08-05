// WorldMapUI — fixed HUD layered on top of the scrollable map (everything
// here uses setScrollFactor(0), so it stays put while the world underneath
// pans/zooms). Layout mirrors the reference composition: top bar (lives ·
// coins · stars · settings · mail), left rail (daily reward · events ·
// achievements · map), right rail (shop · inventory · quests), bottom
// chapter progress bar, and a floating Play button that jumps straight into
// the current level. Every panel besides Play is a stub for now ("coming
// soon" toast) — frontend-only pass, no real backend behind any of it yet.
import Phaser from 'phaser';
import { W, H } from '../../config/GameConfig.js';

const D = 100;
const WOOD = 0x2a1608;
const GOLD = 0xd4a040;
const TXT = { fontFamily: 'Georgia, serif', color: '#f8efd9', stroke: '#1a0f04', strokeThickness: 2 };

function roundedPanel(scene, x, y, w, h, r, fill, fillAlpha, strokeColor) {
  const g = scene.add.graphics().setScrollFactor(0).setDepth(D);
  g.fillStyle(fill, fillAlpha);
  g.fillRoundedRect(x, y, w, h, r);
  if (strokeColor != null) { g.lineStyle(2, strokeColor, 0.9); g.strokeRoundedRect(x, y, w, h, r); }
  return g;
}

// Small square rail button: icon + tiny label, optional notification badge.
function railButton(scene, x, y, item, onTap) {
  const SZ = 48;
  roundedPanel(scene, x - SZ / 2, y - SZ / 2, SZ, SZ, 10, WOOD, 0.88, GOLD);
  scene.add.text(x, y - 8, item.icon, { fontSize: '18px' }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 1);
  scene.add.text(x, y + 15, item.short, {
    fontFamily: 'Georgia, serif', fontSize: '8px', color: '#e8d0a8',
  }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 1);

  if (item.badge) {
    scene.add.circle(x + SZ / 2 - 6, y - SZ / 2 + 6, 8, 0xd6402c).setScrollFactor(0).setDepth(D + 2).setStrokeStyle(1.5, 0xffffff, 0.9);
    scene.add.text(x + SZ / 2 - 6, y - SZ / 2 + 6, `${item.badge}`, { fontSize: '9px', color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(D + 3);
  }
  if (item.timer) {
    scene.add.text(x, y + SZ / 2 + 10, item.timer, { fontFamily: 'Georgia, serif', fontSize: '8px', color: '#f5c87a' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(D + 1);
  }

  const hit = scene.add.rectangle(x, y, SZ + 4, SZ + 4, 0, 0).setScrollFactor(0).setDepth(D + 4).setInteractive({ useHandCursor: true });
  hit.on('pointerup', onTap);
  return hit;
}

export function buildWorldMapUI(scene, { onBack, onTestComplete, onPlayCurrent, chapterLabel, playLabel }) {
  // ── Top bar ────────────────────────────────────────────────────────────
  roundedPanel(scene, 0, 0, W, 44, 0, WOOD, 0.9);
  scene.add.graphics().setScrollFactor(0).setDepth(D).lineStyle(2, GOLD, 0.8).lineBetween(0, 44, W, 44);

  const back = scene.add.text(12, 12, '←', { fontSize: '16px', color: '#f5c87a' })
    .setScrollFactor(0).setDepth(D + 1).setInteractive({ useHandCursor: true });
  back.on('pointerup', onBack);

  const statPill = (x, icon, value) => {
    roundedPanel(scene, x, 8, 78, 28, 14, 0x1c0e05, 0.75, GOLD);
    scene.add.text(x + 10, 22, icon, { fontSize: '15px' }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 1);
    scene.add.text(x + 32, 22, `${value}`, { ...TXT, fontSize: '13px' }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 1);
    const plus = scene.add.circle(x + 78 - 2, 8 + 2, 8, 0x4caf50).setScrollFactor(0).setDepth(D + 1).setStrokeStyle(1.5, 0xffffff, 0.8);
    scene.add.text(plus.x, plus.y, '+', { fontSize: '11px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 2);
  };
  statPill(34, '❤️', scene.registry.get('lives') ?? 5);
  statPill(120, '🪙', scene.registry.get('points') ?? 0);

  // Stars — the hero stat, centered
  scene.add.text(W / 2, 22, `⭐ ${scene.registry.get('totalStars') ?? 0}`, {
    ...TXT, fontSize: '17px',
  }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 1);

  // Settings pill
  const setW = 88;
  roundedPanel(scene, W - 178, 7, setW, 30, 15, 0x5a3a9a, 0.92, 0x8a6ad4);
  scene.add.text(W - 178 + 16, 22, '⚙', { fontSize: '15px' }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 1);
  scene.add.text(W - 178 + 54, 22, 'Settings', { ...TXT, fontSize: '11px' }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 1);
  const settingsHit = scene.add.rectangle(W - 178 + setW / 2, 22, setW, 30, 0, 0).setScrollFactor(0).setDepth(D + 2).setInteractive({ useHandCursor: true });
  settingsHit.on('pointerup', () => scene._toast?.('Settings — coming soon!'));

  // Mail
  const mail = scene.add.text(W - 30, 22, '✉️', { fontSize: '18px' }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 1).setInteractive({ useHandCursor: true });
  scene.add.circle(W - 20, 10, 8, 0xd6402c).setScrollFactor(0).setDepth(D + 2).setStrokeStyle(1.5, 0xffffff, 0.9);
  scene.add.text(W - 20, 10, '3', { fontSize: '9px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 3);
  mail.on('pointerup', () => scene._toast?.('Mail — coming soon!'));

  // ── Left rail ──────────────────────────────────────────────────────────
  const leftX = 32;
  railButton(scene, leftX, 78, { icon: '🎁', short: 'Daily', timer: '23:59:59' }, () => scene._toast?.('Daily Reward — coming soon!'));
  railButton(scene, leftX, 150, { icon: '🎉', short: 'Events', badge: 2 }, () => scene._toast?.('Events — coming soon!'));
  railButton(scene, leftX, 214, { icon: '🏆', short: 'Awards' }, () => scene._toast?.('Achievements — coming soon!'));

  // ── Right rail ─────────────────────────────────────────────────────────
  const rightX = W - 32;
  railButton(scene, rightX, 78, { icon: '🏠', short: 'Shop' }, () => scene._toast?.('Shop — coming soon!'));
  railButton(scene, rightX, 150, { icon: '🎒', short: 'Items', badge: 1 }, () => scene._toast?.('Inventory — coming soon!'));
  railButton(scene, rightX, 214, { icon: '🎗️', short: 'Quests' }, () => scene._toast?.('Quests — coming soon!'));

  // ── Bottom chapter bar ─────────────────────────────────────────────────
  const barY = H - 40, barH = 40;
  roundedPanel(scene, 0, barY, W, barH, 0, WOOD, 0.9);
  scene.add.graphics().setScrollFactor(0).setDepth(D).lineStyle(2, GOLD, 0.8).lineBetween(0, barY, W, barY);

  const chapterText = scene.add.text(20, barY + 10, chapterLabel || 'Chapter', {
    fontFamily: 'Georgia, serif', fontSize: '11px', color: '#f5c87a', stroke: '#1a0f04', strokeThickness: 2,
  }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 1);

  // trackW is kept short enough that the track + key icon clear the floating
  // Play button's left edge (playCx - playW/2, defined below) instead of
  // being hidden underneath it.
  const trackX = 20, trackY = barY + 26, trackW = W - 210, trackH = 8;
  roundedPanel(scene, trackX, trackY - trackH / 2, trackW, trackH, 4, 0x1c0e05, 0.7);
  const fillGraphics = scene.add.graphics().setScrollFactor(0).setDepth(D + 1);
  const pctText = scene.add.text(trackX + 6, trackY, '0%', {
    fontSize: '8px', color: '#f8efd9',
  }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 2);
  scene.add.text(trackX + trackW + 12, trackY, '🗝️', { fontSize: '15px' }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 1);

  // ── Floating Play button ───────────────────────────────────────────────
  const playCx = W - 76, playCy = H - 36, playW = 128, playH = 50;
  const playG = scene.add.graphics().setScrollFactor(0).setDepth(D + 3);
  playG.fillStyle(0x6e1212, 1); playG.fillRoundedRect(playCx - playW / 2, playCy - playH / 2 + 3, playW, playH, 22);
  playG.fillStyle(0xd44040, 1); playG.fillRoundedRect(playCx - playW / 2, playCy - playH / 2, playW, playH - 3, 22);
  playG.lineStyle(2, 0xf5c840, 0.95); playG.strokeRoundedRect(playCx - playW / 2, playCy - playH / 2, playW, playH - 3, 22);

  scene.add.text(playCx, playCy - 10, 'Play', {
    fontFamily: 'Georgia, serif', fontSize: '17px', fontStyle: 'bold', color: '#ffffff', stroke: '#5a0a0a', strokeThickness: 2,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 4);
  const playLabelText = scene.add.text(playCx, playCy + 12, playLabel || '', {
    fontFamily: 'Georgia, serif', fontSize: '10px', color: '#ffe0c8',
  }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 4);

  const playHit = scene.add.rectangle(playCx, playCy, playW, playH, 0, 0).setScrollFactor(0).setDepth(D + 5).setInteractive({ useHandCursor: true });
  playHit.on('pointerup', onPlayCurrent);

  // Small QA affordance: demos the completion → unlock → gold road → camera
  // focus flow without needing to actually finish one of the real levels.
  const testBtn = scene.add.text(W / 2, 56, '🧪 Test: Complete Current', {
    fontFamily: 'Georgia, serif', fontSize: '9px', color: '#cfe0f5',
    backgroundColor: '#1c2436', padding: { x: 6, y: 3 },
  }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 1).setInteractive({ useHandCursor: true });
  testBtn.on('pointerup', onTestComplete);

  const setChapterFill = (t) => {
    const clamped = Phaser.Math.Clamp(t, 0, 1);
    fillGraphics.clear();
    fillGraphics.fillStyle(0xf5c840, 1);
    fillGraphics.fillRoundedRect(trackX, trackY - trackH / 2, Math.max(6, trackW * clamped), trackH, 4);
    pctText.setText(`${Math.round(clamped * 100)}%`);
  };

  return {
    back, testBtn, playHit, setChapterFill,
    setChapterLabel: (text) => chapterText.setText(text),
    setPlayLabel: (text) => playLabelText.setText(text),
  };
}
