// Level 2's HUD theme — Level 2 uses BaseLevelScene's default gold/wood HUD, so
// its shared-component theme matches those defaults (barTrack tuned to Level 2's
// previous hand-rolled zone-bar groove color).
import { makeTheme } from '../../../hud/HudTheme.js';

export const L2_THEME = makeTheme({
  barTrack: 0x120904,
  bannerStroke: 0x3a2810, bannerStrokeAlpha: 1,
});
