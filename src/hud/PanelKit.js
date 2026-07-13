// ════════════════════════════════════════════════════════════════════════════
// PanelKit — shared graphics-drawn (not baked-texture) building blocks used by
// every HUD piece. Drawing with Graphics (not textures.addCanvas) means N levels
// with N different palettes never collide on texture keys.
// ════════════════════════════════════════════════════════════════════════════

export function drawPanel(scene, x, y, w, h, theme, depth = 48, radius = 7) {
  const g = scene.add.graphics().setScrollFactor(0).setDepth(depth);
  g.fillStyle(theme.panelFill, theme.panelFillAlpha);
  g.fillRoundedRect(x, y, w, h, radius);
  g.lineStyle(1, theme.panelStroke, theme.panelStrokeAlpha);
  g.strokeRoundedRect(x, y, w, h, radius);
  return g;
}

export function drawBadge(scene, x, y, w, h, theme, depth = 48, radius = 10) {
  const g = scene.add.graphics().setScrollFactor(0).setDepth(depth);
  g.fillStyle(theme.bannerFill, theme.bannerFillAlpha);
  g.fillRoundedRect(x, y, w, h, radius);
  g.lineStyle(2, theme.bannerStroke, theme.bannerStrokeAlpha);
  g.strokeRoundedRect(x, y, w, h, radius);
  return g;
}
