import Phaser from 'phaser';
import { generateAssets } from '../utils/AssetGenerator.js';
import { warmUpVideos } from '../utils/VideoWarmup.js';
import { preloadDogSkin, prepareDogSkin } from './levels/Level1/L1_DogSkin.js';
import { preloadPorcupineSkin, preparePorcupineSkin } from './levels/PorcupineSkin.js';
import { preloadSnakeSkin, prepareSnakeSkin } from './levels/SnakeSkin.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    // Real progress, tied to the actual bytes downloading — the OLD version of
    // this bar was a fake 0→100 animation that only started AFTER every asset
    // had already finished loading (Phaser doesn't call create() until preload's
    // queue is empty), so players stared at a frozen 0%-width bar for the
    // entire real download, then watched it rush to 100% in half a second —
    // reading as "stuck", even though nothing was actually frozen. Now the bar
    // fills in lockstep with real download progress, so the wait is visible
    // and moving the whole time instead of looking hung.
    const tips = ['Waking Shadow up...', 'Brewing forest magic...', 'Hiding berries...', 'Training the snake...', 'Almost ready...'];
    this.load.on('progress', (value) => {
      const pct = Math.round(value * 100);
      const bar = document.getElementById('load-bar');
      const tip = document.getElementById('load-tip');
      if (bar) bar.style.width = pct + '%';
      if (tip) tip.textContent = tips[Math.min(tips.length - 1, Math.floor(pct / 22))];
    });

    // .jpg versions below are re-encoded from the original .png (opaque art,
    // no transparency needed) — same content, ~85-90% smaller file, since PNG
    // is a lossless format that's very wasteful for photographic/painted
    // backgrounds. Originals kept on disk untouched.
    this.load.image('jungle_bg',    'assets/images/jungle.jpg');
    this.load.image('start_screen', 'assets/images/StartScreen.jpg');
    this.load.image('ground',       'assets/images/ground.png');
    this.load.image('platform',     'assets/images/platform.png');
    this.load.image('log',          'assets/images/log.png');
    this.load.image('rock',         'assets/images/rock.png');
    // Real-art cactus — replaces the plain 🌵 emoji-text "thorn" hazard
    // (Level 1 + Level 2). Not used for the falling boulders/rocks/debris.
    this.load.image('cactus_thorn', 'assets/images/all/hurdle/01.png');
    // Real-art lever (Level 1's two bridge-unlock levers) — replaces the
    // procedurally-drawn (WebGL graphics) pedestal + pole + ball.
    this.load.image('lever_closed', 'assets/images/all/hurdle/lever.png');
    this.load.image('lever_open',   'assets/images/all/hurdle/lever-open.png');
    this.load.image('fallen_tree',  'assets/images/fallen_tree.png');
    this.load.image('fallen_log',   'assets/images/fallen_log.png');
    this.load.image('porcupine',    'assets/images/porcupine.png');
    this.load.image('fountain',     'assets/images/fountain.png');
    this.load.image('gemma_idle',    'assets/images/gemma/gemma_idle.png');
    this.load.image('gemma_happy',   'assets/images/gemma/gemma_happy.png');
    // Real-art "Gemma in cage" (dog + cage baked into one image) — replaces
    // the procedurally-drawn bars + plain gemma_idle sprite combo in Level 1's
    // fruit part and Level 2's cage scene.
    this.load.image('l1_gemma_cage', 'assets/images/level1/gemma-in-cage.png');
    // l1_gemma_cage and l2_gemma_cage are byte-identical art — load both KEYS
    // from the SAME file so the browser's HTTP cache serves the 2nd one
    // instantly instead of downloading the ~1.1MB image twice.
    this.load.image('l2_gemma_cage', 'assets/images/level1/gemma-in-cage.png');
    // Short looping "Gemma in cage" video — replaces the static gemma-in-cage
    // image/drawn-bars combo at Level 1's end-zone, Level 1's fruit part, and
    // Level 2's end-zone (already H.264, no transcode needed).
    this.load.video('gemma_cage_loop', 'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784949837/shadow-gamma/video/all/gemma-cage-loop.mp4');
    this.load.image('shadow_idle',   'assets/images/shadow/shadow_idle.png');
    this.load.image('shadow_run1',   'assets/images/shadow/shadow_run1.png');
    this.load.image('shadow_run2',   'assets/images/shadow/shadow_run2.png');
    this.load.image('shadow_jump',   'assets/images/shadow/shadow_jump.png');
    this.load.image('gleeda_idle',   'assets/images/Gleenda/gleeda_idle.png');
    this.load.image('gleeda_run1',   'assets/images/Gleenda/gleeda_run1.png');
    this.load.image('gleeda_jump',   'assets/images/Gleenda/gleeda_jump.png');
    preloadDogSkin(this);
    preloadPorcupineSkin(this);
    preloadSnakeSkin(this);
    this.load.image('road_bg',        'assets/images/road_bg.jpg');
    this.load.video('intro_video',       'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784658241/shadow-gamma/video/Level%2001/intro.mp4');
    // ── Level 1 story videos (game-over + food-collected feeding scene) ──────
    this.load.video('l1_gameover_video', 'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784658150/shadow-gamma/video/Level%2001/exceptional.mp4');
    this.load.video('l1_food_video',     'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784658183/shadow-gamma/video/Level%2001/food.mp4');
    // Source file is HEVC (hvc1) — most browsers can't play that; vc_h264
    // asks Cloudinary to transcode on-the-fly to H.264 (avc1) for playback,
    // matching every other video's codec.
    this.load.video('l1_conclusion_video', 'https://res.cloudinary.com/jlvxvo5r/video/upload/vc_h264/v1784685880/shadow-gamma/video/Level%2001/conclusion-l1.mp4');
    // ── Level 2 story videos ────────────────────────────────────────────────
    this.load.video('l2_intro_video',          'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784658537/shadow-gamma/video/level%2002/intro-level2.mp4');
    this.load.video('l2_gameover_video',       'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784658322/shadow-gamma/video/level%2002/exceptional.mp4');
    this.load.video('l2_transition_video',     'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784658601/shadow-gamma/video/level%2002/street-to-jungle.mp4');
    this.load.video('l2_cage_video',           'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784658260/shadow-gamma/video/level%2002/after-reaching-to-cage.mp4');
    this.load.video('l2_conclusion_video',     'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784658301/shadow-gamma/video/level%2002/conclusion-l2.mp4');
    // ── Level 4 story videos (3-part intro + reach-home cinematic) ───────────
    this.load.video('l4_intro1',      'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784658616/shadow-gamma/video/Level%2004/intro-1.mp4');
    this.load.video('l4_intro2',      'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784658637/shadow-gamma/video/Level%2004/intro-2.mp4');
    this.load.video('l4_intro3',      'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784658733/shadow-gamma/video/Level%2004/intro-3.mp4');
    this.load.video('l4_after_home',  'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784658610/shadow-gamma/video/Level%2004/after-reach-home.mp4');
    // ── Level 5 story videos (2-part intro + reach-home + conclusion) ────────
    this.load.video('l5_intro1',      'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784658751/shadow-gamma/video/Level%2005/intro-l5-pain.mp4');
    this.load.video('l5_intro2',      'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784658743/shadow-gamma/video/Level%2005/after-intro.mp4');
    this.load.video('l5_reach_home',  'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784658777/shadow-gamma/video/Level%2005/reaching-home-l5.mp4');
    this.load.video('l5_conclusion',  'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784658746/shadow-gamma/video/Level%2005/conclusion.mp4');
    // ── Level 6 story videos ─────────────────────────────────────────────────
    // Source files are HEVC (hvc1) — audio plays but video doesn't render in
    // most browsers. vc_h264 asks Cloudinary to transcode on-the-fly to H.264
    // (avc1), same fix already used for l1_conclusion_video below.
    this.load.video('l6_intro_video',      'https://res.cloudinary.com/jlvxvo5r/video/upload/vc_h264/v1784771946/shadow-gamma/video/Level%206/intro-l6.mp4');
    this.load.video('l6_conclusion_video', 'https://res.cloudinary.com/jlvxvo5r/video/upload/vc_h264/v1784771954/shadow-gamma/video/Level%206/conclusion-l6.mp4');
    // ── Level 7 story videos (8 clips; already H.264/avc1, no transcode needed) ──
    // v1+v2 = merged intro (before Stage 1); v3 = Stage 2 start; v4+v5 = merged,
    // end of Stage 2 → Stage 3; v6 = Stage 4 start; v7 = Stage 4 end (reached
    // hospital) → Stage 5; v8 = game-over cinematic (all lives lost).
    this.load.video('l7_v1', 'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784777635/shadow-gamma/video/Level%207/video-1.mp4');
    this.load.video('l7_v2', 'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784777635/shadow-gamma/video/Level%207/video-2.mp4');
    this.load.video('l7_v3', 'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784777637/shadow-gamma/video/Level%207/video-3.mp4');
    this.load.video('l7_v4', 'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784777645/shadow-gamma/video/Level%207/video-4.mp4');
    this.load.video('l7_v5', 'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784777654/shadow-gamma/video/Level%207/video-5.mp4');
    this.load.video('l7_v6', 'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784777661/shadow-gamma/video/Level%207/video-6.mp4');
    this.load.video('l7_v7', 'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784777665/shadow-gamma/video/Level%207/video-7.mp4');
    this.load.video('l7_v8', 'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784777669/shadow-gamma/video/Level%207/video-8.mp4');
    this.load.image('street_lamp',    'assets/images/Street_Lamp_Post.png');
    this.load.image('traffic_signal', 'assets/images/Traffic_Signal.png');

    // ── Level 8 story videos (already H.264/avc1, no transcode needed) ──────────
    this.load.video('l8_intro',                'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784936466/shadow-gamma/video/Level%208/intro-l8.mp4');
    this.load.video('l8_reach_home_food',       'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784936478/shadow-gamma/video/Level%208/reach-home-food.mp4');
    this.load.video('l8_after_eat',             'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784936496/shadow-gamma/video/Level%208/after-eat-l8.mp4');
    this.load.video('l8_decorate_intro',        'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784936511/shadow-gamma/video/Level%208/decorate-intro-l8.mp4');
    this.load.video('l8_decorate_home_reach',   'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784936527/shadow-gamma/video/Level%208/decorate-home-reach-l8.mp4');
    this.load.video('l8_end',                   'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784936550/shadow-gamma/video/Level%208/l8-end.mp4');

    // ── Level 9 story videos (already H.264/avc1, no transcode needed) ──────────
    this.load.video('l9_intro',       'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784936576/shadow-gamma/video/Level%209/intro-l10.mp4');
    this.load.video('l9_gift_open',   'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784936594/shadow-gamma/video/Level%209/gift-open-l10.mp4');
    this.load.video('l9_bow_intro',   'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784936616/shadow-gamma/video/Level%209/bow-intro-l10.mp4');
    // Reused in two spots: reaching home after the Bow Run, and the "all
    // puppies dressed" ending — same clip, one upload (see
    // scripts/upload-l9-part2.mjs).
    this.load.video('l9_part2',       'https://res.cloudinary.com/jlvxvo5r/video/upload/v1785026510/shadow-gamma/video/Level%209/part-02.mp4');
    this.load.image('cone',           'assets/images/Traffic_Cone.png');
    this.load.image('road_barrier',   'assets/images/Road Construction_ Barrier.png');
    this.load.image('barrel',         'assets/images/Oil_Barrel.png');
    this.load.image('key1',           'assets/images/key1.png');
    this.load.image('key2',           'assets/images/key2.png');
    this.load.image('checkpoint_flag','assets/images/checkpoint_flag.png');
    // ── Shared premium HUD art (assets/images/all — used by Theme Design + levels)
    this.load.image('heart',        'assets/images/all/heart.png');
    this.load.image('ui_life_bg',   'assets/images/all/lifebg.png');
    this.load.image('ui_banner_bg', 'assets/images/all/banner-bg.png');
    this.load.image('ui_time_bg',   'assets/images/all/time-bg.png');
    this.load.image('ui_coin_bg',   'assets/images/all/coin-bg.png');
    this.load.image('ui_menu_bg',   'assets/images/all/menu-bg.png');
    this.load.image('ui_health_bar','assets/images/all/health-bar.png');
    // l2_modal_bg is byte-identical to Level 1's modal panel — same file, same
    // cache-dedupe trick as l2_gemma_cage above (saves a ~155KB duplicate fetch).
    this.load.image('l2_modal_bg',    'assets/images/level1/Level1_modal.png');
    // Shared wood/gold modal panel (Level 1 art) — used by ALL levels' mini-activities
    this.load.image('shared_modal_bg', 'assets/images/level1/Level1_modal.png');
    // ── Level 1 real artwork (jungle background + forest-floor surface) ──────
    // -opt versions are resized to the actual max resolution ever rendered
    // (these tile horizontally, so far less width was needed than the source
    // art had) + re-encoded — same visual result, much smaller download.
    this.load.image('l1_bg',      'assets/images/level1/Level 01-opt.jpg');
    this.load.image('l1_surface', 'assets/images/level1/Level 01 bottom-opt.jpg');
    // Real-art meat prop (replaces the procedurally-drawn 'meat' texture in the
    // food-collecting bonus round) — falls back to the procedural one if missing.
    this.load.image('l1_meat_real', 'assets/images/level1/meat.png');
    // ── Level 2 real artwork (background + ground strip) ───────────────────
    this.load.image('l2_bg',      'assets/images/Level 2/level-2-bg.jpg');
    this.load.image('l2_surface', 'assets/images/Level 2/Level -02-bottom.jpg');
    // ── Level 2 mini-game artwork ───────────────────────────────────────────
    ['l2mg_bg_catch', 'l2mg_bg_dodge', 'l2mg_bg_fireflies', 'l2mg_basket', 'l2mg_bush', 'l2mg_firefly',
     'l2cal_bg', 'l2cal_speak', 'l2cal_bark', 'l2cal_run',
     'l2feed_bg', 'l2feed_bowl', 'l2feed_meat', 'l2feed_bone', 'l2feed_chicken', 'l2feed_cheese',
     'l2feed_choc', 'l2feed_grapes', 'l2feed_candy', 'l2feed_mushroom']
      .forEach(k => this.load.image(k, `assets/images/Level 2/${k}.png`));
    // ── Level 3 real artwork ────────────────────────────────────────────────
    this.load.image('l3_car',         'assets/images/Level 3/l3_car.png');
    this.load.image('l3_road',        'assets/images/Level 3/l3_road.jpg');
    this.load.image('l3_bg_city',     'assets/images/Level 3/l3_city_bg.jpg');
    this.load.image('l3_bg_jungle',   'assets/images/Level 3/l3_jungle_bg.jpg');
    this.load.image('l3_bg_highway',  'assets/images/Level 3/l3_highway_bg.jpg');
    this.load.image('l3_cone',        'assets/images/Level 3/l3_cone.png');
    this.load.image('l3_hosp_sign',   'assets/images/Level 3/l3_hosp_sign.png');
    // ── Level 3 car-journey background + road (dusk city street art) ────────
    this.load.image('l3_bg_main',     'assets/images/Level 3/Level 03.jpg');
    this.load.image('l3_road_bottom', 'assets/images/Level 3/Level 03 bottom.png');
    // ── Level 3 story videos (intro, arrival, fail, pre-injection, recovery) ─
    this.load.video('l3_intro_video',     'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784658828/shadow-gamma/video/Level%203/intro.mp4');
    this.load.video('l3_reaching_video',  'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784658837/shadow-gamma/video/Level%203/reaching-hospital.mp4');
    this.load.video('l3_exception_video', 'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784658796/shadow-gamma/video/Level%203/exception.mp4');
    this.load.video('l3_injection_video', 'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784658820/shadow-gamma/video/Level%203/Injection.mp4');
    this.load.video('l3_recovery_video',  'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784658790/shadow-gamma/video/Level%203/after-recovery.mp4');
    // ── Level 3 hospital scene real artwork ─────────────────────────────────
    this.load.image('l3_hospital_bg',       'assets/images/Level 3/l3_hospital_bg.jpg');
    this.load.image('l3_hospital_exterior', 'assets/images/Level 3/l3_hospital_exterior.jpg');
    this.load.image('l3_med_ok',      'assets/images/all/hurdle/medicine bottle.png');
    this.load.image('l3_med_wrong',   'assets/images/Level 3/l3_med_wrong.png');
    this.load.image('l3_syringe',     'assets/images/all/hurdle/injection.png');
    this.load.image('l3_oxygen',      'assets/images/Level 3/l3_oxygen.png');
    this.load.image('l3_medkit',      'assets/images/Level 3/l3_medkit.png');
    this.load.image('l3_bowl',        'assets/images/Level 3/l3_bowl.png');
    this.load.image('l3_stretcher',   'assets/images/Level 3/stretcher.png');
    // Same byte-identical modal art as shared_modal_bg — reuse the file so this
    // is a free HTTP-cache hit instead of a 3rd ~155KB duplicate download.
    this.load.image('l3_modal_frame', 'assets/images/level1/Level1_modal.png');
    // NOTE: l3_ekg_screen & l3_vitals_bg stay PROCEDURAL — the game draws live
    // animated EKG line / vitals readouts on top, which need a blank screen.
    // ── Level 4 real artwork (society / neighbourhood) ──────────────────────
    const L4 = 'assets/images/Level 4/';
    [
      'l4_bg_sky', 'l4_bg_houses', 'l4_ground', 'l4_garage_bg',
      'l4_house_finished', 'l4_bush', 'l4_bench',
      'l4_wood', 'l4_roof', 'l4_nails', 'l4_paint', 'l4_bed', 'l4_food_bowl',
      'l4_cone', 'l4_bin', 'l4_boxes', 'l4_bike', 'l4_puddle', 'l4_pothole',
    ].forEach(k => this.load.image(k, `${L4}${k}.png`));
    // Missing optional L4 files fall back to vector art
    this.load.on('loaderror', (f) => { if (f && f.key && f.key.startsWith('l4_')) { /* vector fallback in generators */ } });
    // Real-art background + ground (same technique as Level 3's Level 03 art)
    // -opt versions are the same pixels re-encoded at a leaner JPEG quality —
    // dimensions untouched (already exactly the resolution this scene needs).
    this.load.image('l4_bg_main',      'assets/images/Level 4/backgorund-l4-opt.jpg');
    this.load.image('l4_ground_bottom','assets/images/Level 4/Level 04 bottom-opt.jpg');
    // New garage-build background (replaces the old l4_garage_bg) — .jpg is a
    // re-encode of the same opaque art, ~85% smaller than the source PNG.
    this.load.image('l4_garage_bg_new','assets/images/Level 4/level-04-garage.jpg');
    // ── Level 5 real artwork (rainy neighborhood + garage birth) ────────────
    // Level 5 reuses almost all of Level 4's neighbourhood art byte-for-byte
    // (2nd treatment cycle, same houses/garage/props) — load those keys from
    // Level 4's own files so the browser's HTTP cache serves them for free
    // instead of downloading a duplicate ~5MB copy. This also fixes l5_bush
    // and l5_bench, whose OWN Level 5 files don't actually exist on disk
    // (silent 404s before this fix) — Level 4's copies do exist.
    const L5 = 'assets/images/Level 5/';
    [
      'l5_bg_sky', 'l5_bg_houses', 'l5_garage_bg', 'l5_house_finished',
      'l5_bush', 'l5_bench', 'l5_wood', 'l5_roof', 'l5_nails', 'l5_paint', 'l5_bed',
      'l5_food_bowl', 'l5_cone', 'l5_bin', 'l5_boxes', 'l5_bike', 'l5_puddle', 'l5_pothole',
    ].forEach(k => this.load.image(k, `${L4}${k.replace('l5_', 'l4_')}.png`));
    // l5_house / l5_tree / l5_ground have no (working) Level 4 counterpart —
    // l4_ground.png doesn't actually exist on disk (pre-existing gap, falls
    // back to vector art like every other missing l4_* key) — genuinely load
    // these 3 from Level 5's own real files.
    ['l5_house', 'l5_tree', 'l5_ground'].forEach(k => this.load.image(k, `${L5}${k}.png`));
    // Byte-identical to Level 4's own backgorund-l4/Level 04 bottom — reuse
    // those files (cache-dedupe trick, saves ~2.4MB of duplicate download).
    this.load.image('l5_bg_main',      'assets/images/Level 4/backgorund-l4-opt.jpg');
    this.load.image('l5_ground_bottom','assets/images/Level 4/Level 04 bottom-opt.jpg');
    // ── Level 3 audio (fail silently if files not present) ──────────────────
    this.load.audio('bump_fast',      'assets/audio/bump_fast.mp3');
    this.load.audio('bump_slow',      'assets/audio/bump_slow.mp3');
    this.load.audio('signal_beep',    'assets/audio/signal_beep.mp3');
    this.load.audio('gameover_sting', 'assets/audio/game_over.mp3');
  }

  create() {
    generateAssets(this);
    // Some exported obstacle art has an opaque white backdrop baked in instead
    // of real alpha transparency (e.g. the puddle sprites) — key it out here so
    // it doesn't show as a white box behind the sprite in-game.
    ['l4_puddle', 'l5_puddle'].forEach(k => this._stripWhiteBackground(k));

    // Start buffering every cinematic in the background NOW (Phaser doesn't
    // preload video data — it only records URLs), so each one plays instantly
    // instead of stalling on a black screen while it fetches from the network.
    warmUpVideos(this);
    prepareDogSkin(this);
    preparePorcupineSkin(this);
    prepareSnakeSkin(this);

    this.scene.start('Menu');

    // Debug: launch sprite simulator on Ctrl+Shift+S
    this.input.keyboard.on('keydown-S', (e) => {
      if (e.ctrlKey && e.shiftKey) {
        this.scene.start('SpriteSimulator');
      }
    });

    // Preload's real progress already drove the bar to 100% by the time this
    // runs (create() only fires once the load queue is empty) — just dismiss
    // the loading screen now instead of re-simulating a fake fill. Hidden
    // (not removed) — every level transition's "Menu"/"Next Level" reuses
    // this exact element (see utils/LoadingOverlay.js) instead of a fresh
    // Phaser-managed overlay, so it stays in the DOM for the whole session.
    const bar = document.getElementById('load-bar');
    if (bar) bar.style.width = '100%';
    const ls = document.getElementById('loading-screen');
    if (ls) {
      ls.style.opacity = '0';
      setTimeout(() => { ls.style.display = 'none'; }, 600);
    }
  }

  // Keys near-white pixels out to transparent, in place, for a texture whose
  // source PNG has an opaque white backdrop instead of real alpha. Uses a
  // soft cutoff (fades alpha near the threshold) so edges stay smooth rather
  // than leaving a hard white fringe around the sprite.
  _stripWhiteBackground(key, cutoff = 200) {
    if (!this.textures.exists(key)) return;
    const src = this.textures.get(key).getSourceImage();
    const w = src.naturalWidth || src.width, h = src.naturalHeight || src.height;
    if (!w || !h) return;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(src, 0, 0, w, h);
    let imgData;
    try { imgData = ctx.getImageData(0, 0, w, h); } catch (_) { return; }
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const minC = Math.min(d[i], d[i + 1], d[i + 2]);
      if (minC > cutoff) {
        const fade = Phaser.Math.Clamp((255 - minC) / (255 - cutoff), 0, 1);
        d[i + 3] = Math.round(d[i + 3] * fade);
      }
    }
    ctx.putImageData(imgData, 0, 0);
    this.textures.remove(key);
    this.textures.addCanvas(key, canvas);
  }
}
