# Level 8 — "Puppy Care Day" · Asset Production Guide

**Status:** Gameplay is **fully built and playable now** using procedural WebGL
placeholder art (`src/scenes/levels/Level8/L8Assets.js`). This guide is the
production package for replacing those placeholders with final artwork.

Every texture key below is generated procedurally today. To swap in a final PNG
later, add a `preload()` to the relevant scene that **evicts the placeholder and
loads the file** (same pattern Level 7 Stage 2/3 use):

```js
preload() {
  const P = 'assets/images/Level8/';
  ['l8_food_bone', 'l8_food_milk', /* … */].forEach(k => {
    if (this.textures.exists(k)) this.textures.remove(k);
    this.load.image(k, `${P}${k}.png`);
  });
}
```

No gameplay code changes are needed — keys, sizes, and origins already match.

---

## 1. Level structure (what was built)

| Stage(s) | Scene | Key | Gameplay |
|----------|-------|-----|----------|
| 1 + 2 | Food Run | `L8_FoodRun` | Auto-runner; JUMP/SLIDE; collect 8 foods |
| 3 + 4 | Feeding | `L8_Feeding` | Drag matching food to each of 7 puppies |
| 5 + 6 | Home Run | `L8_HomeRun` | Auto-runner; collect 8 home items; return home |
| 7 + 8 | Decorate | `L8_Decorate` | Drag 8 items into slots → Happy Home → Level Complete → EndScene |

**Controls:** auto-run right · `W`/`↑`/`SPACE` or JUMP button = jump (over ground
hazards) · `S`/`↓` or SLIDE button = slide (under overhead hazards). Feeding &
decorate are drag-and-drop.

**Flow:** `L8_FoodRun → L8_Feeding → L8_HomeRun → L8_Decorate → EndScene`. Each
transition uses the freeze-proof `fadeOut → _wakeLoop → scene.start` pattern.

---

## 2. Asset inventory (all keys)

**Folder convention for finals:** `assets/images/Level8/<key>.png`

### Backgrounds (full-bleed 800×450 unless noted)
| Key | Size | Transparent | Usage |
|-----|------|-------------|-------|
| `l8_sky` | 800×450 | No | Day sky behind both runs |
| `l8_hills` | 400×240 | No (tileable X) | Parallax park band |
| `l8_ground` | 128×80 | No (tileable X) | Grass/path strip |
| `l8_feed_bg` | 800×450 | No | Feeding room |
| `l8_room_bg` | 800×450 | No | Empty room to decorate |
| `l8_house` | 200×180 | Yes | Cottage marker at run end |

### Characters
| Key | Size | Transparent | Usage / Animation |
|-----|------|-------------|-------------------|
| `l8_runner_idle` | 72×112 | Yes | Gleeda standing |
| `l8_runner_run1` | 72×112 | Yes | Gleeda run frame A |
| `l8_runner_run2` | 72×112 | Yes | Gleeda run frame B (alternate A/B @ ~9 fps) |
| `l8_runner_jump` | 72×112 | Yes | Gleeda airborne |
| `l8_runner_slide` | 104×72 | Yes | Gleeda crouched/sliding (wider, shorter) |
| `l8_gamma` | 170×120 | Yes | Mother dog (feeding + finale) |
| `l8_puppy` | 96×84 | Yes | Puppy base — **tinted** 7 ways in code |

### Food (collectible + feeding tray) — 7 kinds
| Key | Size | Transparent | Usage |
|-----|------|-------------|-------|
| `l8_food_bone` | 64×44 | Yes | Bone biscuit |
| `l8_food_milk` | 52×64 | Yes | Milk bottle |
| `l8_food_bowl` | 68×56 | Yes | Kibble bowl (also puppy bowls) |
| `l8_food_can` | 60×64 | Yes | Food can |
| `l8_food_bag` | 64×70 | Yes | Treat bag |
| `l8_food_meat` | 64×56 | Yes | Meat treat |
| `l8_food_jar` | 64×66 | Yes | Treat jar |

### Home items (collect + decorate) — 8 kinds (1:1 with decorate slots)
| Key | Size | Transparent | Usage |
|-----|------|-------------|-------|
| `l8_item_bed` | 100×64 | Yes | Puppy bed |
| `l8_item_foodstation` | 92×58 | Yes | Food station |
| `l8_item_waterstation` | 92×58 | Yes | Water station |
| `l8_item_toybasket` | 88×64 | Yes | Toy basket |
| `l8_item_picture` | 72×64 | Yes | Wall picture |
| `l8_item_plant` | 68×68 | Yes | Potted plant |
| `l8_item_rug` | 100×64 | Yes | Round rug |
| `l8_item_tunnel` | 100×64 | Yes | Play tunnel |

### Obstacles
| Key | Size | Transparent | Type | Usage |
|-----|------|-------------|------|-------|
| `l8_obs_pot` | 56×62 | Yes | Ground (jump) | Flower pot |
| `l8_obs_crate` | 56×58 | Yes | Ground (jump) | Wooden crate |
| `l8_obs_puddle` | 92×28 | Yes | Ground (jump) | Mud puddle (flat) |
| `l8_obs_banner` | 120×52 | Yes | Overhead (slide) | Hanging banner |
| `l8_obs_branch` | 130×58 | Yes | Overhead (slide) | Low tree branch |
| `l8_obs_balloon` | 140×84 | Yes | Overhead (slide) | Balloon arch |

### FX / UI
| Key | Size | Transparent | Usage |
|-----|------|-------------|-------|
| `l8_spark` | 24×24 | Yes | Collect/place sparkle |
| `l8_star` | 36×36 | Yes | Level-complete rating star |
| `l8_heart` | 36×36 | Yes | Love feedback |
| `l8_cloud` | 130×64 | Yes | Parallax cloud |
| `l8_bubble` | 84×78 | Yes | Puppy "wanted food" thought bubble |
| `l8_slot` | 100×100 | Yes | Dashed drop-target placeholder (decorate) |

---

## 3. Generation order & priority

**Priority 1 — Critical (blocks the look of every screen):**
1. `l8_runner_idle`, `l8_runner_run1`, `l8_runner_run2`, `l8_runner_jump`, `l8_runner_slide`
2. `l8_sky`, `l8_ground`, `l8_hills`
3. `l8_puppy`, `l8_gamma`

**Priority 2 — Core interactables:**
4. All 7 `l8_food_*`
5. All 8 `l8_item_*`
6. All 6 `l8_obs_*`

**Priority 3 — Rooms & finale:**
7. `l8_feed_bg`, `l8_room_bg`, `l8_house`

**Priority 4 — Polish/UI:**
8. `l8_spark`, `l8_star`, `l8_heart`, `l8_cloud`, `l8_bubble`, `l8_slot`

---

## 4. Gemini image-generation prompts

> Global style suffix to append to every prompt:
> *"soft cartoon children's mobile-game art, bright cheerful colors, clean
> vector-like shading, isolated object, transparent background, no text, no
> watermark."* (Backgrounds: omit "isolated/transparent"; request a full scene.)

### Characters

**Asset:** Gleeda (caretaker girl) — Idle · `l8_runner_idle` · 72×112 · transparent
Gemini: *"Friendly young animal-caretaker girl, brown hair in a top bun with a pink clip, teal scrub top, denim trousers, white sneakers, standing happily, full body, front-facing, children's mobile-game character, soft cartoon style, transparent background, no text."*

**Asset:** Gleeda — Run frames · `l8_runner_run1`, `l8_runner_run2` · 72×112 · transparent
Gemini: *"Same caretaker girl mid-run, legs in a running stride (provide two stride variants), arms swinging, side-on cheerful pose, consistent character design, children's mobile-game sprite, transparent background, no text."*

**Asset:** Gleeda — Jump · `l8_runner_jump` · 72×112 · transparent
Gemini: *"Same caretaker girl jumping, legs tucked, arms raised, joyful expression, side-on, children's mobile-game sprite, transparent background, no text."*

**Asset:** Gleeda — Slide · `l8_runner_slide` · 104×72 · transparent
Gemini: *"Same caretaker girl sliding/crouching low to the ground, legs extended forward, leaning back, dynamic pose, side-on, fits a wide short frame, transparent background, no text."*

**Asset:** Gamma (mother dog) · `l8_gamma` · 170×120 · transparent
Gemini: *"Gentle mother dog named Gamma, warm brown and white fur, soft floppy ears, kind happy eyes, sitting, full body, front-facing, children's story-game character, soft cartoon style, transparent background, no text."*

**Asset:** Puppy (tintable base) · `l8_puppy` · 96×84 · transparent
Gemini: *"Cute sitting puppy, light cream/tan fur (neutral so it can be recoloured), big sparkly eyes, floppy ears, happy smile, front-facing, full body, children's mobile-game character, soft cartoon style, transparent background, no text."*

### Food

**Asset:** Bone biscuit · `l8_food_bone` · 64×44 · transparent
Gemini: *"Dog bone-shaped biscuit, golden baked color, cute, isolated object, soft cartoon mobile-game asset, transparent background, no text."*

**Asset:** Milk bottle · `l8_food_milk` · 52×64 · transparent
Gemini: *"Small puppy milk bottle, white milk, blue cap, tiny pink label, cute, isolated object, soft cartoon mobile-game asset, transparent background, no text."*

**Asset:** Kibble bowl · `l8_food_bowl` · 68×56 · transparent
Gemini: *"Orange pet food bowl filled with brown kibble, cute, isolated object, soft cartoon mobile-game asset, transparent background, no text."*

**Asset:** Food can · `l8_food_can` · 60×64 · transparent
Gemini: *"Pet food tin can with a yellow paw-print label, cute, isolated object, soft cartoon mobile-game asset, transparent background, no text."*

**Asset:** Treat bag · `l8_food_bag` · 64×70 · transparent
Gemini: *"Orange puppy treat bag with a paw logo, crimped top, cute, isolated object, soft cartoon mobile-game asset, transparent background, no text."*

**Asset:** Meat treat · `l8_food_meat` · 64×56 · transparent
Gemini: *"Juicy cartoon meat/steak treat with a small bone, appetizing, isolated object, soft cartoon mobile-game asset, transparent background, no text."*

**Asset:** Treat jar · `l8_food_jar` · 64×66 · transparent
Gemini: *"Glass jar of round dog treats with a pink lid, cute, isolated object, soft cartoon mobile-game asset, transparent background, no text."*

### Home items

**Asset:** Puppy bed · `l8_item_bed` · 100×64 · transparent
Gemini: *"Cozy round puppy bed, soft purple cushion, plump and inviting, isolated object, soft cartoon mobile-game asset, transparent background, no text."*

**Asset:** Food station · `l8_item_foodstation` · 92×58 · transparent
Gemini: *"Pet food bowl on a yellow feeding mat filled with kibble, isolated object, soft cartoon mobile-game asset, transparent background, no text."*

**Asset:** Water station · `l8_item_waterstation` · 92×58 · transparent
Gemini: *"Blue water bowl on a light-blue mat with fresh water and a shine highlight, isolated object, soft cartoon mobile-game asset, transparent background, no text."*

**Asset:** Toy basket · `l8_item_toybasket` · 88×64 · transparent
Gemini: *"Wicker basket full of colorful puppy toys and balls, isolated object, soft cartoon mobile-game asset, transparent background, no text."*

**Asset:** Wall picture · `l8_item_picture` · 72×64 · transparent
Gemini: *"Framed wall picture of a sunny green hill and sun, gold frame, isolated object, soft cartoon mobile-game asset, transparent background, no text."*

**Asset:** Potted plant · `l8_item_plant` · 68×68 · transparent
Gemini: *"Cheerful potted green houseplant in a terracotta pot, isolated object, soft cartoon mobile-game asset, transparent background, no text."*

**Asset:** Round rug · `l8_item_rug` · 100×64 · transparent
Gemini: *"Round cozy rug with warm orange rings and a paw-print center, top-down-ish, isolated object, soft cartoon mobile-game asset, transparent background, no text."*

**Asset:** Play tunnel · `l8_item_tunnel` · 100×64 · transparent
Gemini: *"Purple collapsible pet play tunnel, ribbed body, dark openings, isolated object, soft cartoon mobile-game asset, transparent background, no text."*

### Obstacles

**Asset:** Flower pot · `l8_obs_pot` · 56×62 · transparent
Gemini: *"Terracotta flower pot with a pink flower, small obstacle prop, isolated object, soft cartoon mobile-game asset, transparent background, no text."*

**Asset:** Wooden crate · `l8_obs_crate` · 56×58 · transparent
Gemini: *"Wooden crate box with cross planks, small obstacle prop, isolated object, soft cartoon mobile-game asset, transparent background, no text."*

**Asset:** Mud puddle · `l8_obs_puddle` · 92×28 · transparent
Gemini: *"Flat brown mud puddle splash on the ground, top-down flat obstacle, isolated object, soft cartoon mobile-game asset, transparent background, no text."*

**Asset:** Hanging banner · `l8_obs_banner` · 120×52 · transparent
Gemini: *"Festive blue party banner with dots and a fringe, hanging from two short poles, an overhead obstacle to duck under, isolated object, soft cartoon mobile-game asset, transparent background, no text."*

**Asset:** Low tree branch · `l8_obs_branch` · 130×58 · transparent
Gemini: *"Horizontal leafy tree branch with green leaves, an overhead obstacle to duck under, isolated object, soft cartoon mobile-game asset, transparent background, no text."*

**Asset:** Balloon arch · `l8_obs_balloon` · 140×84 · transparent
Gemini: *"Colorful party balloon arch, an overhead obstacle to duck under, isolated object, soft cartoon mobile-game asset, transparent background, no text."*

### Backgrounds

**Asset:** Day sky · `l8_sky` · 800×450 · opaque
Gemini: *"Bright sunny daytime sky, gentle blue gradient, warm sun top-right, a few soft fluffy clouds, cheerful children's game background, no characters, no text."*

**Asset:** Parallax hills band · `l8_hills` · 400×240 · opaque, **seamless horizontal tile**
Gemini: *"Rolling green park hills with small cartoon trees, seamless horizontally tileable strip, cheerful children's game background layer, no characters, no text."*

**Asset:** Grass path strip · `l8_ground` · 128×80 · opaque, **seamless horizontal tile**
Gemini: *"Green grass ground with tiny flowers, seamless horizontally tileable strip, cheerful children's game ground texture, no text."*

**Asset:** Feeding room · `l8_feed_bg` · 800×450 · opaque
Gemini: *"Bright cozy indoor room with a sunny window, party bunting, a framed picture, warm wooden floor, cheerful children's game interior background, no characters, no text."*

**Asset:** Empty puppy room · `l8_room_bg` · 800×450 · opaque
Gemini: *"Warm empty cottage room with a curtained window and wooden plank floor, ready to be furnished, cheerful children's game interior background, no furniture, no characters, no text."*

**Asset:** Cottage marker · `l8_house` · 200×180 · transparent
Gemini: *"Cute small cottage with red roof, two windows and a door, cheerful, isolated building, soft cartoon mobile-game asset, transparent background, no text."*

### FX / UI

| Asset | Key | Size | Gemini prompt |
|-------|-----|------|---------------|
| Sparkle | `l8_spark` | 24×24 | *"Tiny white-gold sparkle star, glow, isolated, transparent background, no text."* |
| Rating star | `l8_star` | 36×36 | *"Glossy gold five-point rating star, isolated, transparent background, no text."* |
| Heart | `l8_heart` | 36×36 | *"Cute glossy red love heart, isolated, transparent background, no text."* |
| Cloud | `l8_cloud` | 130×64 | *"Soft fluffy white cloud, isolated, transparent background, no text."* |
| Thought bubble | `l8_bubble` | 84×78 | *"White rounded cartoon thought bubble with trailing dots, empty inside, isolated, transparent background, no text."* |
| Drop slot | `l8_slot` | 100×100 | *"Dashed rounded placeholder outline with a faint paw print, UI drop-target, isolated, transparent background, no text."* |

---

## 5. Sprite-sheet & animation recommendations

- **Gleeda runner:** pack `idle / run1 / run2 / jump / slide` into one sheet.
  Run = `run1,run2` @ 9 fps loop (already configured as anim key `l8_walk`).
  Keep `slide` on a **bottom-anchored** baseline so feet stay on the ground when
  the frame is shorter.
- **Puppy:** ship one neutral-tan sprite; the 7 variants are produced at runtime
  via `setTint(...)` (`PUP_TINTS` in feeding & decorate). If you prefer hand-painted
  coats, deliver 7 sheets named `l8_puppy_1…7` and drop the tint calls.
- **Food / items:** static single frames; a gentle bob is applied by tween, no
  animation frames needed.
- **Obstacles:** static; overhead ones get an idle sway tween in code.

## 6. Folder structure

```
assets/images/Level8/
├── characters/   l8_runner_*.png, l8_gamma.png, l8_puppy.png
├── food/         l8_food_*.png
├── items/        l8_item_*.png
├── obstacles/    l8_obs_*.png
├── bg/           l8_sky.png, l8_hills.png, l8_ground.png,
│                 l8_feed_bg.png, l8_room_bg.png, l8_house.png
└── ui/           l8_spark.png, l8_star.png, l8_heart.png,
                  l8_cloud.png, l8_bubble.png, l8_slot.png
```
> If you keep finals flat (`assets/images/Level8/<key>.png`) the preload snippet
> in §intro works as-is; for sub-folders, adjust the path prefix per group.

## 7. Optimization recommendations

- Export **trimmed** transparent PNGs (tight alpha bounds) to cut overdraw.
- Author at **2×** the sizes in the tables for crisp scaling (the canvas is
  Scale.FIT and the renderer super-samples 2×), then let Phaser downscale.
- Run all PNGs through a compressor (TinyPNG / `pngquant`) — target < 60 KB each.
- Pack each group into a **Phaser atlas** (`food.png`+`food.json`, etc.) to reduce
  draw calls; load with `this.load.atlas(...)` and the same frame keys.
- Backgrounds can be JP‑quality where no alpha is needed (`l8_sky`, room/feed,
  hills, ground), but keep tileable strips lossless to avoid seam artifacts.
- Keep `l8_ground` and `l8_hills` **seamless on X** — they tile during scrolling.

---

**Implementation files (already in repo):**
`src/scenes/levels/Level8/` → `L8Assets.js`, `L8BaseScene.js`, `L8_FoodRunScene.js`,
`L8_FeedingScene.js`, `L8_HomeRunScene.js`, `L8_DecorateScene.js`.
Registered in `src/main.js`; launched from `MenuScene.js` (🐾 Level 8 + Dev/QA jumps).
