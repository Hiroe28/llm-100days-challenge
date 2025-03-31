/**
 * アプリケーションのメインスクリプト
 * イベントリスナーやナビゲーション機能を設定
 */

// 画面要素の参照
const homeScreen = document.getElementById('home-screen');
const pitchQuizScreen = document.getElementById('pitch-quiz-screen');
const noteQuizScreen = document.getElementById('note-quiz-screen');
const progressScreen = document.getElementById('progress-screen');
const audioOverlay = document.getElementById('audio-overlay');

// 現在の画面
let currentScreen = 'home';

/**
 * アプリの初期化
 */
function initApp() {
  // イベントリスナーの設定
  setupEventListeners();
  
  // ホーム画面表示
  showScreen('home');
}


/**
 * 画面を切り替える関数
 * @param {string} screenId - 表示する画面のID
 */
function showScreen(screenId) {
  // すべての画面を非表示にする
  homeScreen.classList.remove('active');
  pitchQuizScreen.classList.remove('active');
  noteQuizScreen.classList.remove('active');
  progressScreen.classList.remove('active');
  
  // 指定された画面を表示する
  if (screenId === 'home') {
    homeScreen.classList.add('active');
    updateHomeScreenLevel(); // ホーム画面のレベル表示を更新
  } else if (screenId === 'pitch-quiz') {
    pitchQuizScreen.classList.add('active');
    
    // 音当てクイズ用のレベルに応じて音符セットを更新
    updateNotesForLevel(pitchLevel);
    
    startPitchQuiz();
    
    // オーディオ初期化チェック
    checkAudioInitialized();
  } else if (screenId === 'note-quiz') {
    noteQuizScreen.classList.add('active');
    
    // 楽譜クイズ用のレベルに応じて音符セットを更新
    updateNotesForLevel(noteLevel);
    
    startNoteQuiz();
    
    // オーディオ初期化チェック
    checkAudioInitialized();
  } else if (screenId === 'progress') {
    progressScreen.classList.add('active');
    updateProgressDisplay();
  }
  
  currentScreen = screenId;
}

/**
 * オーディオが初期化されているかチェックし、
 * 初期化されていない場合はオーバーレイを表示する
 */
function checkAudioInitialized() {
  if (!isAudioInitialized()) {
    audioOverlay.style.display = 'flex';
  } else {
    audioOverlay.style.display = 'none';
  }
}

/**
 * イベントリスナーを設定する関数
 */
function setupEventListeners() {
  // オーディオ初期化ボタン
  const initAudioBtn = document.getElementById('init-audio');
  if (initAudioBtn) {
    // クリックイベント
    initAudioBtn.addEventListener('click', async () => {
      console.log('Init audio button clicked');
      await initializeAudio();
    });
    
    // タッチイベント（スマホ対応）
    initAudioBtn.addEventListener('touchend', async (e) => {
      console.log('Init audio button touched');
      e.preventDefault(); // デフォルトの動作を防止
      await initializeAudio();
    }, false);
  }
  
  // ホーム画面ボタン
  document.getElementById('btn-pitch-quiz').addEventListener('click', () => {
    showScreen('pitch-quiz');
  });
  
  document.getElementById('btn-note-quiz').addEventListener('click', () => {
    showScreen('note-quiz');
  });
  
  document.getElementById('btn-progress').addEventListener('click', () => {
    showScreen('progress');
  });
  
  // ホームに戻るボタン
  const homeButtons = document.querySelectorAll('.go-home');
  homeButtons.forEach(button => {
    button.addEventListener('click', () => {
      showScreen('home');
    });
  });
  
  // 音を再生するボタン
  const playButton = document.getElementById('play-note');
  if (playButton) {
    playButton.addEventListener('click', () => {
      if (!isAudioInitialized()) {
        initializeAudio().then(() => {
          playPitchQuizSound();
        });
      } else {
        playPitchQuizSound();
      }
    });
    
    // タッチイベント（スマホ対応）
    playButton.addEventListener('touchend', (e) => {
      e.preventDefault(); // デフォルトの動作を防止
      if (!isAudioInitialized()) {
        initializeAudio().then(() => {
          playPitchQuizSound();
        });
      } else {
        playPitchQuizSound();
      }
    }, false);
  }
  
  // 音当てクイズの回答ボタン
  const pitchAnswerButtons = pitchQuizScreen.querySelectorAll('.btn-answer');
  pitchAnswerButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (!isAudioInitialized()) {
        initializeAudio().then(() => {
          checkPitchAnswer(button.dataset.note);
        });
      } else {
        checkPitchAnswer(button.dataset.note);
      }
    });
  });
  
  // 楽譜クイズの回答ボタン
  const noteAnswerButtons = noteQuizScreen.querySelectorAll('.btn-answer');
  noteAnswerButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (!isAudioInitialized()) {
        initializeAudio().then(() => {
          checkNoteAnswer(button.dataset.note);
        });
      } else {
        checkNoteAnswer(button.dataset.note);
      }
    });
  });

  // スコアリセットボタン
  document.getElementById('btn-reset-scores').addEventListener('click', () => {
    showResetConfirmation();
  });

  // オーディオオーバーレイ - 画面全体をタップ対応に
  if (audioOverlay) {
    audioOverlay.addEventListener('touchend', async (e) => {
      console.log('Audio overlay touched');
      e.preventDefault();
      await initializeAudio();
    }, false);
  }
}

// ページ読み込み完了時にアプリを初期化
document.addEventListener('DOMContentLoaded', initApp);


/**
 * スコアをローカルストレージに保存
 */
function saveScoresToStorage() {
  try {
    const scoreData = {
      pitchScore,
      noteScore,
      pitchLevel,  // 音当てクイズのレベルを追加
      noteLevel,   // 楽譜クイズのレベルを追加
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('musicQuizScores', JSON.stringify(scoreData));
    console.log('Scores saved to localStorage');
    return true;
  } catch (error) {
    console.error('Failed to save scores to localStorage:', error);
    return false;
  }
}
/**
 * ローカルストレージからスコアを読み込む
 */
function loadScoresFromStorage() {
  try {
    const savedData = localStorage.getItem('musicQuizScores');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      
      // スコアの復元
      pitchScore = parsedData.pitchScore || 0;
      noteScore = parsedData.noteScore || 0;
      pitchLevel = parsedData.pitchLevel || 1;  // 音当てクイズのレベルを復元
      noteLevel = parsedData.noteLevel || 1;    // 楽譜クイズのレベルを復元
      
      // 表示の更新
      updateScoreDisplay('pitch-score', pitchScore);
      updateScoreDisplay('note-score', noteScore);
      updateProgressDisplay();
      updateHomeScreenLevel();
      
      console.log('Scores loaded successfully from localStorage');
      return true;
    }
  } catch (error) {
    console.error('Failed to load scores from localStorage:', error);
  }
  
  return false;
}

/**
 * ローカルストレージが利用可能かチェックする
 * @returns {boolean} - 利用可能な場合はtrue
 */
function isLocalStorageAvailable() {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * セッションストレージをフォールバックとして使用する
 */
function saveScoresToSessionStorage() {
  try {
    const scoreData = {
      pitchScore,
      noteScore,
      pitchLevel,
      noteLevel,
      lastUpdated: new Date().toISOString()
    };
    
    sessionStorage.setItem('musicQuizScores', JSON.stringify(scoreData));
    console.log('Scores saved to sessionStorage');
    return true;
  } catch (error) {
    console.error('Failed to save scores to sessionStorage:', error);
    return false;
  }
}
/**
 * セッションストレージからスコアを読み込む
 */
function loadScoresFromSessionStorage() {
  try {
    const savedData = sessionStorage.getItem('musicQuizScores');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      
      // スコアの復元
      pitchScore = parsedData.pitchScore || 0;
      noteScore = parsedData.noteScore || 0;
      pitchLevel = parsedData.pitchLevel || 1;
      noteLevel = parsedData.noteLevel || 1;
      
      // 表示の更新
      updateScoreDisplay('pitch-score', pitchScore);
      updateScoreDisplay('note-score', noteScore);
      updateProgressDisplay();
      updateHomeScreenLevel();
      
      console.log('Scores loaded successfully from sessionStorage');
      return true;
    }
  } catch (error) {
    console.error('Failed to load scores from sessionStorage:', error);
  }
  
  return false;
}

// ページが閉じられる前にスコアを保存（localStorageとsessionStorage両方試す）
window.addEventListener('beforeunload', () => {
  // まずローカルストレージを試す
  const localSaved = saveScoresToStorage();
  
  // ローカルストレージが失敗したらセッションストレージを試す
  if (!localSaved) {
    saveScoresToSessionStorage();
  }
});

// 初期ロード時にスコアを読み込む試行
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  
  // まずローカルストレージを試す
  const localLoaded = loadScoresFromStorage();
  
  // ローカルストレージが失敗したらセッションストレージを試す
  if (!localLoaded) {
    loadScoresFromSessionStorage();
  }
  
  // クロスオリジンやプライバシーモードでの動作確認
  if (!isLocalStorageAvailable()) {
    console.warn('ローカルストレージが利用できません。プライベートブラウジングまたはブラウザの設定を確認してください。');
  }
});




/**
 * ホーム画面のレベル表示を更新する関数
 */
function updateHomeScreenLevel() {
  const subtitle = document.querySelector('#home-screen .subtitle');
  if (subtitle) {
    // 両方のクイズのレベルを表示
    subtitle.innerHTML = `音楽を楽しく学ぼう！ <span class="level-badge">音当て: ${pitchLevel}</span> <span class="level-badge">楽譜: ${noteLevel}</span>`;
  }
}

/**
 * スコアの自動保存を設定
 */
function setupAutoSave() {
  // スコアが変更されたときに自動保存するためのタイマー
  let autoSaveTimer = null;
  
  // スコア自動保存を行う関数
  function autoSaveScores() {
    // まずローカルストレージを試す
    const localSaved = saveScoresToStorage();
    
    // ローカルストレージが失敗したらセッションストレージを試す
    if (!localSaved) {
      saveScoresToSessionStorage();
    }
    
    console.log('Auto-saved scores');
  }
  
  // スコア変更を監視する関数
  function onScoreChanged() {
    // 既存のタイマーをクリア
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    
    // 3秒後に自動保存
    autoSaveTimer = setTimeout(autoSaveScores, 3000);
  }
  
  // MutationObserverでDOM変更を監視
  const scoreElements = [
    document.getElementById('pitch-score'),
    document.getElementById('note-score'),
    document.getElementById('total-score-display')
  ];
  
  // スコア表示要素の変更を監視
  scoreElements.forEach(element => {
    if (element) {
      const observer = new MutationObserver(onScoreChanged);
      observer.observe(element, { 
        characterData: true, 
        childList: true, 
        subtree: true 
      });
    }
  });
  
  // 定期的な自動保存（1分ごと）
  setInterval(autoSaveScores, 60000);
  
  // ページがフォーカスを失ったときも保存
  window.addEventListener('blur', autoSaveScores);
  
  // タブやウィンドウの可視性が変わったときも保存
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
      autoSaveScores();
    }
  });
}

// 新しい方法で自動保存を設定
const originalUpdatePitchLevel = updatePitchLevel;
updatePitchLevel = function() {
  // 元の関数を呼び出す
  originalUpdatePitchLevel.apply(this, arguments);
  
  // スコアを保存
  saveScoresToStorage();
};

const originalUpdateNoteLevel = updateNoteLevel;
updateNoteLevel = function() {
  // 元の関数を呼び出す
  originalUpdateNoteLevel.apply(this, arguments);
  
  // スコアを保存
  saveScoresToStorage();
};

// DOMContentLoadedイベントリスナーに自動保存設定を追加
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  
  // スコアの読み込み
  const localLoaded = loadScoresFromStorage();
  if (!localLoaded) {
    loadScoresFromSessionStorage();
  }
  
  // 自動保存の設定
  setupAutoSave();
});


/**
 * ローカルストレージに関する通知を表示
 */
function showStorageNotice() {
  // プライベートブラウジングなどでローカルストレージが使えない場合
  if (!isLocalStorageAvailable()) {
    // すでに通知が表示されている場合は表示しない
    if (document.querySelector('.storage-notice')) {
      return;
    }
    
    // 通知要素を作成
    const notice = document.createElement('div');
    notice.className = 'storage-notice';
    notice.innerHTML = `
      <div class="notice-content">
        <p>プライベートブラウジングモードなどの理由でスコアが保存されません。</p>
        <button class="btn notice-close">閉じる</button>
      </div>
    `;
    
    // スタイルを追加
    const style = document.createElement('style');
    style.textContent = `
      .storage-notice {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(255, 243, 205, 0.95);
        color: #856404;
        padding: 10px 15px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        text-align: center;
        font-size: 14px;
        max-width: 90%;
      }
      
      .notice-content {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .notice-close {
        margin-top: 10px;
        background-color: #856404;
        color: white;
        border: none;
        padding: 5px 15px;
        border-radius: 4px;
        cursor: pointer;
      }
      
      .notice-close:hover {
        background-color: #6d5302;
      }
    `;
    
    // ボディに追加
    document.head.appendChild(style);
    document.body.appendChild(notice);
    
    // 閉じるボタン
    const closeButton = notice.querySelector('.notice-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        document.body.removeChild(notice);
      });
    }
    
    // 5秒後に自動的に消える
    setTimeout(() => {
      if (document.body.contains(notice)) {
        notice.style.opacity = '0';
        notice.style.transition = 'opacity 0.5s';
        
        setTimeout(() => {
          if (document.body.contains(notice)) {
            document.body.removeChild(notice);
          }
        }, 500);
      }
    }, 5000);
  }
}

// プライバシーアラートの表示タイミングを追加
document.addEventListener('DOMContentLoaded', () => {
  // 既存の処理...
  
  // ローカルストレージ確認
  setTimeout(() => {
    showStorageNotice();
  }, 2000); // ページ読み込み後2秒後に表示
});