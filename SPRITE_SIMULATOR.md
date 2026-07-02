# 🎮 Sprite Simulator Guide

A test scene for designing and animating character sprites with multiple animation frames.

## 🚀 How to Launch

**Option 1 (Easy):** 
1. From the main menu, click the **🔧 Dev / QA** button
2. Click **🎬 SPRITE SIMULATOR** (first item at top)

**Option 2 (Shortcut):** 
Press `Ctrl + Shift + S` while the game is running (works from anywhere)

## 📁 Animation Folders

The simulator loads animations from:
- `public/assets/images/test/Walking 8 Frames/` — 5 frames (1.png–5.png)
- `public/assets/images/test/Running 8 Frames/` — 8 frames (1.png–8.png)
- `public/assets/images/test/Jumping Frames/` — 6 frames (1.png–6.png)
- `public/assets/images/test/Attack 6 Frames/` — 6 frames (1.png–6.png)
- `public/assets/images/test/Sitting Frames/` — directional variants (Front.jfif, Left.png, Right.png, Back.png)

## 🎮 Controls

| Key | Action |
|-----|--------|
| **W** | Play Walk animation (loop) |
| **R** | Play Run animation (loop) |
| **SPACE** | Play Jump animation (once) |
| **A** | Play Attack animation (once) |
| **S** | Play Sit animation (directional cycle) |
| **ESC** | Return to Idle pose |
| **F** | Flip sprite horizontally (left/right direction) |
| **↑** | Scale sprite up (+10%) |
| **↓** | Scale sprite down (-10%) |

## 📊 Display Info

- **Treadmill belt** — Moving ground animation (character stays centered, like a treadmill)
- **Current animation name** (top center)
- **Frame counter** (e.g., "Frame 3 / 6")
- **Playback mode** — ▶ (playing) or ⏸ (stopped)
- **Loop mode** — "(loop)" or "(once)"
- **Grid overlay** (faint background) for alignment reference
- **Center marker** (orange crosshair) — sprite stays here always

## 🏃 Treadmill Mode

The simulator uses a **treadmill effect**:
- ✅ Character stays **centered** on screen
- ✅ **Does NOT move** forward/backward
- ✅ Animated belt beneath feet shows "running in place"
- ✅ Perfect for testing animations in isolation

*This lets you focus on animation quality without camera/movement concerns.*

## 🎨 Configuration

Edit `src/config/SpriteAnimConfig.js` to:
- Adjust FPS for each animation
- Change frame sequences
- Add new animations
- Modify folder paths

Example:
```javascript
walking: {
  frames: [1, 2, 3, 4, 5],
  fps: 10,
  folder: 'Walking 8 Frames',
  repeat: -1,  // -1 = loop, 0 = play once
},
```

## 💡 Tips

- Use **↑/↓** to find the right sprite size for your game
- Use **←/→** to test different X positions
- Use **F** to preview left-facing versions
- Note the FPS that looks smooth — adjust in config as needed
- The grid (every 100px) helps with alignment

## 🐛 Troubleshooting

### Images Not Loading?

1. **Check the browser console** (Press F12 → Console tab)
   - Look for red `[Sprite Simulator] Loading:` messages
   - Check for `Failed to load:` warnings

2. **Verify folder names & paths**
   - Exact match in `SpriteAnimConfig.js` 
   - Example: `'Walking 8 Frames'` (note the spaces!)
   - Paths are case-sensitive

3. **Check PNG numbering**
   - Must be sequential: `1.png`, `2.png`, `3.png`...
   - NO gaps in numbering

4. **For static poses** (like Sitting)
   - Use filename WITHOUT `.png` extension
   - Example: `'Front'`, `'Left'`, `'Right'`, `'Back'`
   - NOT `'Front.png'`

5. **If images still fail**
   - A gray box with red border + ❌ appears
   - Check the path in browser dev tools (Network tab)
   - Verify files exist in the folder

## 📝 Scene Info

- **File:** `src/scenes/SpriteSimulator.js`
- **Config:** `src/config/SpriteAnimConfig.js`
- **White canvas:** 800×450 (game size)
- **All animations play at full FPS** (not frame-skipped)

---

Ready to test your character? Press **Ctrl + Shift + S** now! 🎬
