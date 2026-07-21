// ════════════════════════════════════════════════════════════════════════════
// Banner — piece 1: header/chapter banner (top-center title + optional subtitle,
// e.g. Level 4's "CHECKPOINT N — ..." line). Themed panel, dynamic text.
// ════════════════════════════════════════════════════════════════════════════
import { W } from '../config/GameConfig.js';
import { drawBadge } from './PanelKit.js';

export function buildBanner(scene, theme, cfg = {}) {
  const {
    title, subtitle = '',
    x = W / 2, y = 6, w = 360, h = 58, depth = 49,
  } = cfg;

  const px = x - w / 2;
  const panel = drawBadge(scene, px, y, w, h, theme, depth);

  const titleTxt = scene.add.text(x, y + 16, title, {
    fontSize: '13px', fontFamily: theme.font, color: theme.textColor,
    stroke: theme.textStroke, strokeThickness: 2,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);

  const subTxt = scene.add.text(x, y + 38, subtitle, {
    fontSize: '12px', fontFamily: theme.font, color: '#cfe0f5',
  }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);

  return {
    panel, titleTxt, subTxt,
    setTitle: (t) => titleTxt.setText(t),
    setSubtitle: (t) => subTxt.setText(t),
  };
}
