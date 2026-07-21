// ════════════════════════════════════════════════════════════════════════════
// SpriteAnimConfig.js — Animation metadata for sprite simulator
// frames[] = exact filenames (with extension) as they exist on disk
// ════════════════════════════════════════════════════════════════════════════

export const SPRITE_ANIMS = {
  walking: {
    frames: ['1.png', '2.png', '3.png', '4.png', '5.png'],
    fps: 10,
    folder: 'Walking 8 Frames',
    repeat: -1,
  },
  running: {
    frames: ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png', '7.png', '8.png'],
    fps: 14,
    folder: 'Running 8 Frames',
    repeat: -1,
  },
  jumping: {
    frames: ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png'],
    fps: 12,
    folder: 'Jumping  Frames',
    repeat: 0,
  },
  attacking: {
    frames: [
      'Gemini_Generated_Image_7t4rhv7t4rhv7t4r.jfif',
      'Gemini_Generated_Image_hcnhghhcnhghhcnh.jfif',
      'Gemini_Generated_Image_knr3d5knr3d5knr3.jfif',
      'Gemini_Generated_Image_m0uqb5m0uqb5m0uq.jfif',
      'Gemini_Generated_Image_skqgtmskqgtmskqg.jfif',
    ],
    fps: 12,
    folder: 'Attack 6 Frames',
    repeat: 0,
  },
  sitting: {
    frames: ['Front.jfif', 'Left.png', 'Right.png', 'Back.png'],
    fps: 2,
    folder: 'Sitting  Frames',
    repeat: -1,
    isStatic: true,
  },
  idle: {
    frames: ['Front.jfif'],
    fps: 1,
    folder: 'Sitting  Frames',
    repeat: 0,
    isStatic: true,
  },
};

// Unique texture key for a frame  e.g. "sprite_walking_0"
export function getFrameKey(anim, frameIdx) {
  return `sprite_${anim}_${frameIdx}`;
}

// Full public path for loading — uses the exact filename from frames[]
export function getTexturePath(anim, frameIdx) {
  const config = SPRITE_ANIMS[anim];
  if (!config) return null;
  return `assets/images/test/${config.folder}/${config.frames[frameIdx]}`;
}
