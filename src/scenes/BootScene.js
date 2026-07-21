import Phaser from 'phaser';
import { generateAssets } from '../utils/AssetGenerator.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    this.load.image('jungle_bg',    'assets/images/jungle.png');
    this.load.image('start_screen', 'assets/images/StartScreen.png');
    this.load.image('ground',       'assets/images/ground.png');
    this.load.image('platform',     'assets/images/platform.png');
    this.load.image('log',          'assets/images/log.png');
    this.load.image('rock',         'assets/images/rock.png');
    // Real-art cactus — replaces the plain 🌵 emoji-text "thorn" hazard
    // (Level 1 + Level 2). Not used for the falling boulders/rocks/debris.
    this.load.image('cactus_thorn', 'assets/images/all/hurdle/01.png');
    this.load.image('fallen_tree',  'assets/images/fallen_tree.png');
    this.load.image('fallen_log',   'assets/images/fallen_log.png');
    this.load.image('porcupine',    'assets/images/porcupine.png');
    this.load.image('fountain',     'assets/images/fountain.png');
    this.load.image('gemma_idle',    'assets/images/gemma/gemma_idle.png');
    this.load.image('gemma_happy',   'assets/images/gemma/gemma_happy.png');
    this.load.image('shadow_idle',   'assets/images/shadow/shadow_idle.png');
    this.load.image('shadow_run1',   'assets/images/shadow/shadow_run1.png');
    this.load.image('shadow_run2',   'assets/images/shadow/shadow_run2.png');
    this.load.image('shadow_jump',   'assets/images/shadow/shadow_jump.png');
    this.load.image('gleeda_idle',   'assets/images/Gleenda/gleeda_idle.png');
    this.load.image('gleeda_run1',   'assets/images/Gleenda/gleeda_run1.png');
    this.load.image('gleeda_jump',   'assets/images/Gleenda/gleeda_jump.png');
    this.load.image('road_bg',        'assets/images/road_bg.png');
    this.load.video('intro_video',       'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784658241/shadow-gamma/video/Level%2001/intro.mp4');
    // ── Level 1 story videos (game-over + food-collected feeding scene) ──────
    this.load.video('l1_gameover_video', 'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784658150/shadow-gamma/video/Level%2001/exceptional.mp4');
    this.load.video('l1_food_video',     'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784658183/shadow-gamma/video/Level%2001/food.mp4');
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
    this.load.image('street_lamp',    'assets/images/Street_Lamp_Post.png');
    this.load.image('traffic_signal', 'assets/images/Traffic_Signal.png');
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
    this.load.image('l2_modal_bg',    'assets/images/Level 2/Level2_modal.png');
    // Shared wood/gold modal panel (Level 1 art) — used by ALL levels' mini-activities
    this.load.image('shared_modal_bg', 'assets/images/level1/Level1_modal.png');
    // ── Level 1 real artwork (jungle background + forest-floor surface) ──────
    this.load.image('l1_bg',      'assets/images/level1/Level 01.jpg');
    this.load.image('l1_surface', 'assets/images/level1/Level 01 bottom.png');
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
    this.load.image('l3_road',        'assets/images/Level 3/l3_road.png');
    this.load.image('l3_bg_city',     'assets/images/Level 3/l3_city_bg.png');
    this.load.image('l3_bg_jungle',   'assets/images/Level 3/l3_jungle_bg.png');
    this.load.image('l3_bg_highway',  'assets/images/Level 3/l3_highway_bg.png');
    this.load.image('l3_cone',        'assets/images/Level 3/l3_cone.png');
    this.load.image('l3_hosp_sign',   'assets/images/Level 3/l3_hosp_sign.png');
    // ── Level 3 car-journey background + road (dusk city street art) ────────
    this.load.image('l3_bg_main',     'assets/images/Level 3/Level 03.png');
    this.load.image('l3_road_bottom', 'assets/images/Level 3/Level 03 bottom.png');
    // ── Level 3 story videos (intro, arrival, fail, pre-injection, recovery) ─
    this.load.video('l3_intro_video',     'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784658828/shadow-gamma/video/Level%203/intro.mp4');
    this.load.video('l3_reaching_video',  'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784658837/shadow-gamma/video/Level%203/reaching-hospital.mp4');
    this.load.video('l3_exception_video', 'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784658796/shadow-gamma/video/Level%203/exception.mp4');
    this.load.video('l3_injection_video', 'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784658820/shadow-gamma/video/Level%203/Injection.mp4');
    this.load.video('l3_recovery_video',  'https://res.cloudinary.com/jlvxvo5r/video/upload/v1784658790/shadow-gamma/video/Level%203/after-recovery.mp4');
    // ── Level 3 hospital scene real artwork ─────────────────────────────────
    this.load.image('l3_hospital_bg',       'assets/images/Level 3/l3_hospital_bg.png');
    this.load.image('l3_hospital_exterior', 'assets/images/Level 3/l3_hospital_exterior.png');
    this.load.image('l3_med_ok',      'assets/images/Level 3/l3_med_ok.png');
    this.load.image('l3_med_wrong',   'assets/images/Level 3/l3_med_wrong.png');
    this.load.image('l3_syringe',     'assets/images/Level 3/l3_syringe.png');
    this.load.image('l3_oxygen',      'assets/images/Level 3/l3_oxygen.png');
    this.load.image('l3_medkit',      'assets/images/Level 3/l3_medkit.png');
    this.load.image('l3_bowl',        'assets/images/Level 3/l3_bowl.png');
    this.load.image('l3_modal_frame', 'assets/images/Level 3/l3_modal_frame.png');
    // NOTE: l3_ekg_screen & l3_vitals_bg stay PROCEDURAL — the game draws live
    // animated EKG line / vitals readouts on top, which need a blank screen.
    // ── Level 4 real artwork (society / neighbourhood) ──────────────────────
    const L4 = 'assets/images/Level 4/';
    [
      'l4_bg_sky', 'l4_bg_houses', 'l4_ground', 'l4_garage_bg',
      'l4_house_finished', 'l4_bush', 'l4_lamp', 'l4_bench',
      'l4_wood', 'l4_roof', 'l4_nails', 'l4_paint', 'l4_bed', 'l4_food_bowl',
      'l4_cone', 'l4_bin', 'l4_boxes', 'l4_bike', 'l4_puddle', 'l4_pothole',
    ].forEach(k => this.load.image(k, `${L4}${k}.png`));
    // Missing optional L4 files fall back to vector art
    this.load.on('loaderror', (f) => { if (f && f.key && f.key.startsWith('l4_')) { /* vector fallback in generators */ } });
    // Real-art background + ground (same technique as Level 3's Level 03 art)
    this.load.image('l4_bg_main',      'assets/images/Level 4/backgorund-l4.jpeg');
    this.load.image('l4_ground_bottom','assets/images/Level 4/Level 04 bottom.png');
    // New garage-build background (replaces the old l4_garage_bg)
    this.load.image('l4_garage_bg_new','assets/images/Level 4/level-04-garage.png');
    // ── Level 5 real artwork (rainy neighborhood + garage birth) ────────────
    const L5 = 'assets/images/Level 5/';
    [
      'l5_bg_sky', 'l5_bg_houses', 'l5_ground', 'l5_garage_bg',
      'l5_house', 'l5_house_finished', 'l5_tree', 'l5_bush', 'l5_lamp', 'l5_bench',
      'l5_wood', 'l5_roof', 'l5_nails', 'l5_paint', 'l5_bed', 'l5_food_bowl',
      'l5_cone', 'l5_bin', 'l5_boxes', 'l5_bike', 'l5_puddle', 'l5_pothole',
    ].forEach(k => this.load.image(k, `${L5}${k}.png`));
    // Real-art background + ground (same technique as Level 4's backgorund-l4)
    this.load.image('l5_bg_main',      'assets/images/Level 5/backgorund-l5.jpeg');
    this.load.image('l5_ground_bottom','assets/images/Level 5/bottom-l5.png');
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
    this.scene.start('Menu');

    // Debug: launch sprite simulator on Ctrl+Shift+S
    this.input.keyboard.on('keydown-S', (e) => {
      if (e.ctrlKey && e.shiftKey) {
        this.scene.start('SpriteSimulator');
      }
    });

    let pct = 0;
    const tips = ['Waking Shadow up...', 'Brewing forest magic...', 'Hiding berries...', 'Training the snake...', 'Almost ready...'];
    const iv = setInterval(() => {
      pct = Math.min(pct + 8, 100);
      document.getElementById('load-bar').style.width = pct + '%';
      document.getElementById('load-tip').textContent = tips[Math.floor(pct / 22)] || 'Almost ready...';
      if (pct >= 100) {
        clearInterval(iv);
        setTimeout(() => {
          const ls = document.getElementById('loading-screen');
          ls.style.opacity = '0';
          setTimeout(() => ls.remove(), 1000);
        }, 400);
      }
    }, 40);
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
    const ctx = canvas.getContext('2d');
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
