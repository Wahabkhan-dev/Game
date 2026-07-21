// Level 4's HUD theme — colors copied 1:1 from Level4Scene's previous hand-rolled
// HUD (same look, new shared components — this is not a re-skin).
import { makeTheme } from '../../../hud/HudTheme.js';

export const L4_THEME = makeTheme({
  panelFill: 0x1a0904, panelFillAlpha: 0.72,
  panelStroke: 0x5a3010, panelStrokeAlpha: 0.6,
  bannerFill: 0x1a2230, bannerFillAlpha: 0.9,
  bannerStroke: 0x4a6080, bannerStrokeAlpha: 0.8,
  textColor: '#cfe0f5',
});
