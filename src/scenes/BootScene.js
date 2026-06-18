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
    this.load.video('intro_video',    'assets/images/Intro.mp4');
    this.load.image('street_lamp',    'assets/images/Street_Lamp_Post.png');
    this.load.image('traffic_signal', 'assets/images/Traffic_Signal.png');
    this.load.image('cone',           'assets/images/Traffic_Cone.png');
    this.load.image('road_barrier',   'assets/images/Road Construction_ Barrier.png');
    this.load.image('barrel',         'assets/images/Oil_Barrel.png');
    this.load.image('key1',           'assets/images/key1.png');
    this.load.image('key2',           'assets/images/key2.png');
    this.load.image('checkpoint_flag','assets/images/checkpoint_flag.png');
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
    // ── Level 3 hospital scene real artwork ─────────────────────────────────
    this.load.image('l3_hospital_bg',       'assets/images/Level 3/l3_hospital_bg.png');
    this.load.image('l3_hospital_exterior', 'assets/images/Level 3/l3_hospital_exterior.png');
    this.load.image('l3_med_ok',      'assets/images/Level 3/l3_med_ok.png');
    this.load.image('l3_med_wrong',   'assets/images/Level 3/l3_med_wrong.png');
    this.load.image('l3_syringe',     'assets/images/Level 3/l3_syringe.png');
    this.load.image('l3_oxygen',      'assets/images/Level 3/l3_oxygen.png');
    this.load.image('l3_medkit',      'assets/images/Level 3/l3_medkit.png');
    this.load.image('l3_bowl',        'assets/images/Level 3/l3_bowl.png');
    // NOTE: l3_ekg_screen & l3_vitals_bg stay PROCEDURAL — the game draws live
    // animated EKG line / vitals readouts on top, which need a blank screen.
    // ── Level 4 real artwork (society / neighbourhood) ──────────────────────
    const L4 = 'assets/images/Level 4/';
    [
      'l4_bg_sky', 'l4_bg_houses', 'l4_ground', 'l4_garage_bg',
      'l4_house', 'l4_house_finished', 'l4_tree', 'l4_bush', 'l4_lamp', 'l4_bench',
      'l4_wood', 'l4_roof', 'l4_nails', 'l4_paint', 'l4_bed', 'l4_food_bowl',
      'l4_cone', 'l4_bin', 'l4_boxes', 'l4_bike', 'l4_puddle', 'l4_pothole',
    ].forEach(k => this.load.image(k, `${L4}${k}.png`));
    // Missing optional L4 files fall back to vector art
    this.load.on('loaderror', (f) => { if (f && f.key && f.key.startsWith('l4_')) { /* vector fallback in generators */ } });
    // ── Level 5 real artwork (rainy neighborhood + garage birth) ────────────
    const L5 = 'assets/images/Level 5/';
    [
      'l5_bg_sky', 'l5_bg_houses', 'l5_ground', 'l5_garage_bg',
      'l5_house', 'l5_house_finished', 'l5_tree', 'l5_bush', 'l5_lamp', 'l5_bench',
      'l5_wood', 'l5_roof', 'l5_nails', 'l5_paint', 'l5_bed', 'l5_food_bowl',
      'l5_cone', 'l5_bin', 'l5_boxes', 'l5_bike', 'l5_puddle', 'l5_pothole',
    ].forEach(k => this.load.image(k, `${L5}${k}.png`));
    // ── Level 3 audio (fail silently if files not present) ──────────────────
    this.load.audio('bump_fast',      'assets/audio/bump_fast.mp3');
    this.load.audio('bump_slow',      'assets/audio/bump_slow.mp3');
    this.load.audio('signal_beep',    'assets/audio/signal_beep.mp3');
    this.load.audio('gameover_sting', 'assets/audio/game_over.mp3');
  }

  create() {
    generateAssets(this);
    this.scene.start('Menu');

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
}
