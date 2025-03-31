/**
 * オーディオ関連の機能を管理するモジュール
 */

// グローバル変数
let synth;
let audioInitialized = false;

/**
 * オーディオシステムを初期化する関数
 * @returns {Promise<void>} - 初期化処理の完了を表すPromise
 */
async function initializeAudio() {
  try {
    await Tone.start();
    
    // シンセサイザーの設定を調整（より自然な音に）
    synth = new Tone.Synth({
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0.3,
        release: 0.8
      }
    }).toDestination();
    
    audioInitialized = true;
    
    // オーバーレイを非表示
    const audioOverlay = document.getElementById('audio-overlay');
    if (audioOverlay) {
      audioOverlay.style.display = 'none';
    }
    
    console.log('Audio system initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize audio:', error);
    return false;
  }
}

/**
 * 指定された音符を再生する関数
 * @param {string} noteId - 再生する音符のID (例: 'C4')
 * @param {number} [duration='4n'] - 音の長さ (Tone.jsの表記による)
 */
function playNote(noteId, duration = '4n') {
  if (!audioInitialized || !synth) {
    console.warn('Audio not initialized yet. Please initialize audio first.');
    return false;
  }
  
  try {
    // 存在する音符かチェック
    const noteObj = getNoteById(noteId);
    if (!noteObj) {
      console.warn(`Invalid note ID: ${noteId}`);
      return false;
    }
    
    synth.triggerAttackRelease(noteId, duration);
    return true;
  } catch (error) {
    console.error('Error playing note:', error);
    return false;
  }
}

/**
 * 正解時のサウンドエフェクトを再生
 */
function playCorrectSound() {
  if (!audioInitialized || !synth) return;
  
  try {
    // シンセの設定を一時保存
    const originalSettings = {
      oscillator: synth.oscillator.type,
      envelope: { ...synth.envelope }
    };
    
    // 効果音用に設定を変更
    synth.oscillator.type = 'sine';
    
    // ドレミの短いシーケンスを鳴らす（notes配列から取得）
    const correctNotes = ['C4', 'E4', 'G4'];
    
    // 連続して音を鳴らす
    setTimeout(() => playNote(correctNotes[0], '16n'), 0);
    setTimeout(() => playNote(correctNotes[1], '16n'), 150);
    setTimeout(() => playNote(correctNotes[2], '8n'), 300);
    
    // 元の設定に戻す
    setTimeout(() => {
      synth.oscillator.type = originalSettings.oscillator;
    }, 500);
  } catch (error) {
    console.error('Error playing correct sound:', error);
  }
}

/**
 * 不正解時のサウンドエフェクトを再生
 */
function playIncorrectSound() {
  if (!audioInitialized || !synth) return;
  
  try {
    // シンセの設定を一時保存
    const originalSettings = {
      oscillator: synth.oscillator.type,
      envelope: { ...synth.envelope }
    };
    
    // 効果音用に設定を変更
    synth.oscillator.type = 'triangle';
    
    // 下降音を鳴らす（notes配列から取得）
    const incorrectNotes = ['E4', 'C4'];
    
    // 連続して音を鳴らす
    setTimeout(() => playNote(incorrectNotes[0], '16n'), 0);
    setTimeout(() => playNote(incorrectNotes[1], '8n'), 150);
    
    // 元の設定に戻す
    setTimeout(() => {
      synth.oscillator.type = originalSettings.oscillator;
    }, 500);
  } catch (error) {
    console.error('Error playing incorrect sound:', error);
  }
}

/**
 * オーディオの状態をチェックする関数
 * @returns {boolean} - オーディオが初期化されていればtrue
 */
function isAudioInitialized() {
  return audioInitialized;
}