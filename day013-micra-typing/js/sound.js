/**
 * サウンド管理を行うモジュール
 */

// サウンドリスト
let sounds = {
  bgm: null,
  type: null,
  correct: null,
  wrong: null,
  explosion: null,
  gameOver: null
};

// サウンド設定
let soundSettings = {
  isSoundOn: true,
  bgmVolume: 0.5,
  sfxVolume: 0.7
};

/**
 * サウンドの読み込み
 */
export function loadSounds() {
  try {
    // BGM
    sounds.bgm = new Howl({
      src: ['sounds/bgm.mp3'],
      loop: true,
      volume: soundSettings.bgmVolume,
      autoplay: false,
      onloaderror: function() {
        console.log("BGMの読み込みに失敗しましたが、ゲームは続行します");
      }
    });
    
    // タイピング音
    sounds.type = new Howl({
      src: ['sounds/type.mp3'],
      volume: soundSettings.sfxVolume,
      onloaderror: function() {
        console.log("タイピング音の読み込みに失敗しましたが、ゲームは続行します");
      }
    });
    
    // 正解音
    sounds.correct = new Howl({
      src: ['sounds/correct.mp3'],
      volume: soundSettings.sfxVolume,
      onloaderror: function() {
        console.log("正解音の読み込みに失敗しましたが、ゲームは続行します");
      }
    });
    
    // 間違い音
    sounds.wrong = new Howl({
      src: ['sounds/wrong.mp3'],
      volume: soundSettings.sfxVolume,
      onloaderror: function() {
        console.log("間違い音の読み込みに失敗しましたが、ゲームは続行します");
      }
    });
    
    // 爆発音
    sounds.explosion = new Howl({
      src: ['sounds/explosion.mp3'],
      volume: soundSettings.sfxVolume,
      onloaderror: function() {
        console.log("爆発音の読み込みに失敗しましたが、ゲームは続行します");
      }
    });
    
    // ゲームオーバー音
    sounds.gameOver = new Howl({
      src: ['sounds/gameover.mp3'],
      volume: soundSettings.sfxVolume,
      onloaderror: function() {
        console.log("ゲームオーバー音の読み込みに失敗しましたが、ゲームは続行します");
      }
    });
    
    console.log("サウンドを読み込みました");
  } catch (e) {
    console.log("サウンドの読み込みに失敗しましたが、ゲームは続行します", e);
    // ダミーのサウンドオブジェクトを作成
    sounds = {
      bgm: { play: function(){}, pause: function(){}, volume: 1 },
      type: { play: function(){} },
      correct: { play: function(){} },
      wrong: { play: function(){} },
      explosion: { play: function(){} },
      gameOver: { play: function(){} }
    };
  }
}

/**
 * 効果音の再生
 * @param {string} soundName 効果音の名前
 */
export function playSound(soundName) {
  if (sounds[soundName] && 
      typeof sounds[soundName].play === 'function' && 
      soundSettings.isSoundOn) {
    try {
      sounds[soundName].play();
    } catch (e) {
      console.log(`${soundName}の再生に失敗しましたが、ゲームは続行します`);
    }
  }
}

/**
 * BGMの再生
 */
export function playBGM() {
  if (sounds.bgm && soundSettings.isSoundOn) {
    try {
      sounds.bgm.play();
    } catch (e) {
      console.log("BGMの再生に失敗しましたが、ゲームは続行します");
    }
  }
}

/**
 * BGMの一時停止
 */
export function pauseBGM() {
  if (sounds.bgm) {
    try {
      sounds.bgm.pause();
    } catch (e) {
      console.log("BGMの一時停止に失敗しましたが、ゲームは続行します");
    }
  }
}

/**
 * サウンド設定の切り替え
 * @returns {boolean} 新しいサウンド設定状態
 */
export function toggleSound() {
  soundSettings.isSoundOn = !soundSettings.isSoundOn;
  
  // UI要素を更新
  const soundToggle = document.getElementById('sound-toggle');
  if (soundToggle) {
    if (soundSettings.isSoundOn) {
      soundToggle.classList.remove('off');
      soundToggle.classList.add('on');
      soundToggle.textContent = 'オン';
      
      // BGMを再開
      if (sounds.bgm) {
        sounds.bgm.play();
      }
    } else {
      soundToggle.classList.remove('on');
      soundToggle.classList.add('off');
      soundToggle.textContent = 'オフ';
      
      // BGMを停止
      if (sounds.bgm) {
        sounds.bgm.pause();
      }
    }
  }
  
  return soundSettings.isSoundOn;
}

/**
 * BGM音量の更新
 * @param {number} volume 音量 (0.0〜1.0)
 */
export function updateBgmVolume(volume) {
  if (volume !== undefined) {
    soundSettings.bgmVolume = volume;
  } else {
    // スライダーから値を取得
    const bgmVolumeSlider = document.getElementById('bgm-volume');
    if (bgmVolumeSlider) {
      soundSettings.bgmVolume = bgmVolumeSlider.value / 100;
    }
  }
  
  // BGM音量を更新
  if (sounds.bgm) {
    sounds.bgm.volume(soundSettings.bgmVolume);
  }
}

/**
 * 効果音音量の更新
 * @param {number} volume 音量 (0.0〜1.0)
 */
export function updateSfxVolume(volume) {
  if (volume !== undefined) {
    soundSettings.sfxVolume = volume;
  } else {
    // スライダーから値を取得
    const sfxVolumeSlider = document.getElementById('sfx-volume');
    if (sfxVolumeSlider) {
      soundSettings.sfxVolume = sfxVolumeSlider.value / 100;
    }
  }
  
  // 全ての効果音の音量を更新
  for (const key in sounds) {
    if (key !== 'bgm' && sounds[key]) {
      sounds[key].volume(soundSettings.sfxVolume);
    }
  }
}