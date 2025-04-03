/**
 * UI関連の処理とDOM操作を管理するモジュール
 */
import { GAME_STATE } from './game.js';
import { GAME_ROMAJI } from './input.js';

// DOM要素キャッシュ
let elements = {
  scoreElement: null,
  levelElement: null,
  typingDisplay: null,
  progressBar: null,
  livesContainer: null
};

/**
 * UI要素の初期化
 */
export function initUI() {
  // 要素を取得してキャッシュ
  elements = {
    scoreElement: document.getElementById('score'),
    levelElement: document.getElementById('level'),
    typingDisplay: document.getElementById('typing-display'),
    progressBar: document.getElementById('progress-bar'),
    livesContainer: document.getElementById('lives-container'),
    startScreen: document.getElementById('start-screen'),
    gameOverScreen: document.getElementById('game-over'),
    finalScoreElement: document.getElementById('final-score'),
    settingsScreen: document.getElementById('settings-screen'),
    helpScreen: document.getElementById('help-screen')
  };
  
  // スタイルの追加
  addEnhancedStyles();
  
  // フォーカスヒントを追加
  addFocusHint();
}

/**
 * フォーカスヒントの追加
 */
function addFocusHint() {
  const gameContainer = document.getElementById('game-container');
  if (!gameContainer) return;
  
  // すでに存在する場合は作らない
  if (document.getElementById('focus-hint')) return;
  
  const focusHintElement = document.createElement('div');
  focusHintElement.id = 'focus-hint';
  focusHintElement.textContent = 'タブキーでフォーカス切替';
  gameContainer.appendChild(focusHintElement);
}

/**
 * 拡張スタイルの追加
 */
function addEnhancedStyles() {
  // すでに追加済みかチェック
  if (document.getElementById('enhanced-focus-styles')) {
    return;
  }
  
  // CSS追加のためのヘルパー関数
  function addStyle(css) {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }
  
  // ローマ字入力用CSS
  addStyle(`
    .typing {
      color: #FFCC00;
      text-decoration: underline;
    }
    
    .romaji-hint {
      font-size: 1.2em;
      color: #AAAAAA;
      margin-left: 5px;
      margin-right: 5px;
    }
    
    .expected {
      color: #FFFFFF;
    }
  `);
  
  // フォーカス強調表示用CSS
  addStyle(`
    /* フォーカスされた単語の強調表示 */
    .word-container.focused {
      border: 5px solid #ffcc00 !important; /* 太い金色の枠線 */
      box-shadow: 0 0 20px rgba(255, 204, 0, 0.9) !important; /* 強い発光エフェクト */
      transform: translateX(-50%) scale(1.3) !important; /* より大きく表示 */
      background-color: rgba(0, 0, 0, 0.9) !important; /* 背景を濃くして文字を明確に */
      z-index: 100 !important; /* 他の要素の上に表示 */
      animation: pulse-focus 1.5s infinite alternate !important; /* 脈動エフェクト */
    }
    
    /* 脈動アニメーションの定義 */
    @keyframes pulse-focus {
      0% { box-shadow: 0 0 15px rgba(255, 204, 0, 0.8); }
      100% { box-shadow: 0 0 25px rgba(255, 204, 0, 1); }
    }
    
    /* フォーカスされた単語の矢印を強調 */
    .word-container.focused::after {
      content: '▼';
      position: absolute;
      bottom: -25px;
      left: 50%;
      transform: translateX(-50%);
      color: #ffcc00;
      font-size: 24px !important;
      text-shadow: 0 0 10px #ffcc00;
      animation: bounce 0.7s infinite alternate;
    }
    
    /* 背景の強制設定 - gradient only - 地平線を上に調整 */
    .game-background {
      background: linear-gradient(to bottom, #87CEEB 0%, #87CEEB 40%, #5c913b 40%, #5c913b 100%) !important;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
    }
    
    /* 敵の吹き出し位置を再調整 - キャラクターのすぐ上に */
    .word-container {
      position: absolute;
      transform: translateX(-50%) translateY(-70%) !important; /* 上方向の移動量を減らす */
      margin-top: 10px !important;
    }
    
    /* フォーカスされた吹き出しの調整 */
    .word-container.focused {
      transform: translateX(-50%) translateY(-80%) scale(1.3) !important; /* 上方向の移動量を減らす */
      margin-top: 15px !important;
    }
    
    /* フォーカスされた矢印の位置調整と透明度調整 */
    .word-container.focused::after {
      bottom: -5px !important; /* 矢印の位置を上に */
      opacity: 0.5 !important; /* 矢印を半透明に */
      font-size: 16px !important; /* 矢印を小さく */
    }
    
    /* タイピング表示位置を下部に調整 - より見やすく */
    #typing-display {
      top: auto !important; /* 上からの位置指定を解除 */
      bottom: 120px !important; /* 下からの位置をさらに下に */
      background-color: rgba(0, 0, 0, 0.85) !important; /* 背景をより暗く */
      padding: 15px 25px !important; /* パディングを増やす */
      border: 4px solid #ffcc00 !important; /* 目立つ枠線 */
      border-radius: 10px !important; /* 角を丸く */
      z-index: 100 !important; /* 他のすべての要素の前面に */
      font-size: 28px !important; /* 文字を大きく */
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.7) !important; /* 影を付ける */
      left: 50% !important;
      transform: translateX(-50%) !important;
      min-width: 70% !important; /* 最小幅を設定 */
      text-align: center !important;
    }
  `);
  
  console.log("拡張スタイルを追加しました");
}

/**
 * タイピング表示の更新
 */
export function updateTypingDisplay() {
  if (!elements.typingDisplay) {
    elements.typingDisplay = document.getElementById('typing-display');
    if (!elements.typingDisplay) return;
  }
  
  if (GAME_STATE.currentTypingEnemy) {
    // ひらがなモードでローマ字入力の場合は別の関数を使用
    if (GAME_STATE.gameMode === 'hiragana' && /^[\u3040-\u309F]+$/.test(GAME_STATE.currentTypingEnemy.word)) {
      return; // updateRomajiDisplay() で処理
    }
    
    const targetWord = GAME_STATE.currentTypingEnemy.word;
    let displayHTML = '';
    
    // 入力済みの部分を緑色に
    for (let i = 0; i < GAME_STATE.typedText.length; i++) {
      displayHTML += `<span class="typed">${targetWord[i]}</span>`;
    }
    
    // 未入力の部分を白色に
    for (let i = GAME_STATE.typedText.length; i < targetWord.length; i++) {
      displayHTML += `<span>${targetWord[i]}</span>`;
    }
    
    elements.typingDisplay.innerHTML = displayHTML;
  } else {
    elements.typingDisplay.innerHTML = '';
  }
}

/**
 * 敵の単語表示を更新
 */
export function updateEnemyWordDisplay() {
  if (GAME_STATE.currentTypingEnemy && GAME_STATE.currentTypingEnemy.element) {
    const targetWord = GAME_STATE.currentTypingEnemy.word;
    let typedPart, remainingPart;
    
    if (GAME_STATE.gameMode === 'hiragana' && /^[\u3040-\u309F]+$/.test(targetWord)) {
      typedPart = GAME_ROMAJI.typedHiragana;
      remainingPart = targetWord.substring(typedPart.length);
    } else {
      typedPart = GAME_STATE.typedText;
      remainingPart = targetWord.substring(typedPart.length);
    }
    
    GAME_STATE.currentTypingEnemy.element.innerHTML = 
      `<span style="color: #66FF66;">${typedPart}</span><span>${remainingPart}</span>`;
    
    // 正解エフェクトを適用
    GAME_STATE.currentTypingEnemy.element.classList.add('correct-flash');
    setTimeout(() => {
      if (GAME_STATE.currentTypingEnemy && GAME_STATE.currentTypingEnemy.element) {
        GAME_STATE.currentTypingEnemy.element.classList.remove('correct-flash');
      }
    }, 500);
  }
}

/**
 * プログレスバーの更新
 * @param {number} progress 進行度 (0.0〜1.0)
 */
export function updateProgressBar(progress) {
  if (!elements.progressBar) {
    elements.progressBar = document.getElementById('progress-bar');
    if (!elements.progressBar) return;
  }
  
  elements.progressBar.style.width = `${progress * 100}%`;
  
  // 進捗に応じた色の変更
  if (progress < 0.3) {
    elements.progressBar.style.backgroundColor = '#66FF66'; // 緑
  } else if (progress < 0.7) {
    elements.progressBar.style.backgroundColor = '#FFCC00'; // 黄色
  } else {
    elements.progressBar.style.backgroundColor = '#FF6666'; // 赤
  }
}

/**
 * UI全体の更新
 */
export function updateUI() {
  if (!elements.scoreElement || !elements.levelElement) {
    elements.scoreElement = document.getElementById('score');
    elements.levelElement = document.getElementById('level');
  }
  
  // スコアとレベルの更新
  if (elements.scoreElement) {
    elements.scoreElement.textContent = GAME_STATE.score;
  }
  
  if (elements.levelElement) {
    elements.levelElement.textContent = GAME_STATE.level;
  }
  
  // ライフの更新
  updateLives();
  
  // タイピング表示のクリア
  if (elements.typingDisplay) {
    elements.typingDisplay.innerHTML = '';
  }
  
  // プログレスバーの更新
  updateProgressBar(0);
}

/**
 * ライフ表示の更新
 */
export function updateLives() {
  if (!elements.livesContainer) {
    elements.livesContainer = document.getElementById('lives-container');
    if (!elements.livesContainer) return;
  }
  
  elements.livesContainer.innerHTML = '';
  
  for (let i = 0; i < GAME_STATE.lives; i++) {
    const heartDiv = document.createElement('div');
    heartDiv.className = 'ui-heart';
    elements.livesContainer.appendChild(heartDiv);
  }
  
  // 失ったライフを表示
  for (let i = GAME_STATE.lives; i < 3; i++) {
    const heartDiv = document.createElement('div');
    heartDiv.className = 'ui-heart-empty';
    elements.livesContainer.appendChild(heartDiv);
  }
}

/**
 * 画面上に爆発エフェクトを作成
 * @param {Object} position {x, y}座標
 */
export function createExplosionEffect(position) {
  const particlesContainer = document.getElementById('particles-container');
  if (!particlesContainer) return;
  
  // 爆発エフェクト
  const explosion = document.createElement('div');
  explosion.className = 'effect-explosion';
  explosion.style.left = `${position.x - 10}px`;
  explosion.style.top = `${position.y - 10}px`;
  
  // キラキラエフェクトも追加
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const sparkle = document.createElement('div');
      sparkle.className = 'effect-sparkle';
      sparkle.style.left = `${position.x + (Math.random() * 40 - 20)}px`;
      sparkle.style.top = `${position.y + (Math.random() * 40 - 20)}px`;
      particlesContainer.appendChild(sparkle);
      
      // アニメーション終了後に削除
      setTimeout(() => {
        sparkle.remove();
      }, 500);
    }, i * 100);
  }
  
  particlesContainer.appendChild(explosion);
  
  // アニメーション終了後に削除
  setTimeout(() => {
    explosion.remove();
  }, 500);
}

/**
 * パーティクルのクリーンアップ
 */
export function cleanupParticles() {
  // 全てのパーティクルクリーンアップ
  const particlesContainer = document.getElementById('particles-container');
  if (particlesContainer) {
    particlesContainer.innerHTML = '';
  }
  
  // 残ったエフェクト要素を削除
  const effects = document.querySelectorAll('.effect-explosion, .effect-sparkle');
  effects.forEach(el => el.remove());
}

/**
 * ゲームオーバー画面の表示
 */
export function showGameOverScreen() {
  if (!elements.gameOverScreen || !elements.finalScoreElement) {
    elements.gameOverScreen = document.getElementById('game-over');
    elements.finalScoreElement = document.getElementById('final-score');
  }
  
  if (elements.finalScoreElement) {
    elements.finalScoreElement.textContent = GAME_STATE.score;
  }
  
  if (elements.gameOverScreen) {
    elements.gameOverScreen.style.display = 'block';
  }
  
  console.log("ゲームオーバー画面を表示しました");
}

/**
 * スタート画面の表示
 */
export function showStartScreen() {
  if (!elements.startScreen) {
    elements.startScreen = document.getElementById('start-screen');
  }
  
  if (!elements.gameOverScreen) {
    elements.gameOverScreen = document.getElementById('game-over');
  }
  
  // スタート画面を表示
  if (elements.startScreen) {
    elements.startScreen.classList.remove('hidden');
  }
  
  // ゲームオーバー画面を非表示
  if (elements.gameOverScreen) {
    elements.gameOverScreen.style.display = 'none';
  }
  
  // ゲームモードと難易度の選択ボタンを適切に更新
  updateModeSelectionButtons();
  
  console.log("スタート画面を表示しました - モードと難易度ボタンを更新");
}

/**
 * ゲームモードと難易度の選択ボタンを更新
 */
function updateModeSelectionButtons() {
  // モード選択ボタンの更新
  const englishModeButton = document.getElementById('english-mode');
  const hiraganaModeButton = document.getElementById('hiragana-mode');
  
  if (englishModeButton && hiraganaModeButton) {
    // いったんすべての選択を解除
    englishModeButton.classList.remove('selected');
    hiraganaModeButton.classList.remove('selected');
    
    // 現在のモードに基づいて選択を設定
    if (GAME_STATE.gameMode === 'english') {
      englishModeButton.classList.add('selected');
    } else {
      hiraganaModeButton.classList.add('selected');
    }
  }
  
  // 難易度ボタンの更新
  const easyButton = document.getElementById('easy-button');
  const normalButton = document.getElementById('normal-button');
  const hardButton = document.getElementById('hard-button');
  
  if (easyButton && normalButton && hardButton) {
    // いったんすべての選択を解除
    easyButton.classList.remove('selected');
    normalButton.classList.remove('selected');
    hardButton.classList.remove('selected');
    
    // 現在の難易度に基づいて選択を設定
    switch(GAME_STATE.difficulty) {
      case 'easy':
        easyButton.classList.add('selected');
        break;
      case 'normal':
        normalButton.classList.add('selected');
        break;
      case 'hard':
        hardButton.classList.add('selected');
        break;
    }
  }
}

/**
 * 設定画面と遊び方画面を非表示
 */
export function hideSettingsAndHelpScreens() {
  if (!elements.settingsScreen || !elements.helpScreen) {
    elements.settingsScreen = document.getElementById('settings-screen');
    elements.helpScreen = document.getElementById('help-screen');
  }
  
  if (elements.settingsScreen) {
    elements.settingsScreen.classList.add('hidden');
  }
  
  if (elements.helpScreen) {
    elements.helpScreen.classList.add('hidden');
  }
}

/**
 * ゲーム画面の表示（スタート画面を非表示）
 */
export function showGameScreen() {
  if (!elements.startScreen) {
    elements.startScreen = document.getElementById('start-screen');
  }
  
  if (elements.startScreen) {
    elements.startScreen.classList.add('hidden');
  }
  
  hideSettingsAndHelpScreens();
  
  if (elements.gameOverScreen) {
    elements.gameOverScreen.style.display = 'none';
  }
}


/**
 * 直接背景を設定する
 */
// ui.js の fixBackground 関数を修正
export function fixBackground() {
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) return;
    
    // 背景要素を確認
    let bgElement = document.querySelector('.game-background');
    
    // なければ作成
    if (!bgElement) {
      bgElement = document.createElement('div');
      bgElement.className = 'game-background';
      gameContainer.prepend(bgElement);
    }
    
    // 地平線の位置を30%から20%に変更（上に移動）
    bgElement.style.position = 'absolute';
    bgElement.style.top = '0';
    bgElement.style.left = '0';
    bgElement.style.width = '100%';
    bgElement.style.height = '100%';
    bgElement.style.background = 'linear-gradient(to bottom, #87CEEB 0%, #87CEEB 20%, #5c913b 20%, #5c913b 100%)';
    bgElement.style.zIndex = '-1';
    
    // ゲームコンテナにも同じ背景を設定
    gameContainer.style.background = 'linear-gradient(to bottom, #87CEEB 0%, #87CEEB 20%, #5c913b 20%, #5c913b 100%)';
    
    console.log("背景を設定しました（地平線を上に調整）");
  }
/**
 * 一時停止メッセージの表示
 * @param {boolean} isPaused 一時停止中かどうか
 */
export function togglePauseMessage(isPaused) {
  const gameContainer = document.getElementById('game-container');
  if (!gameContainer) return;
  
  // 既存の一時停止メッセージを削除
  const existingMessage = document.getElementById('pause-message');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  // 一時停止中のみメッセージを表示
  if (isPaused) {
    const pauseMessage = document.createElement('div');
    pauseMessage.id = 'pause-message';
    pauseMessage.style.position = 'absolute';
    pauseMessage.style.top = '50%';
    pauseMessage.style.left = '50%';
    pauseMessage.style.transform = 'translate(-50%, -50%)';
    pauseMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    pauseMessage.style.color = 'white';
    pauseMessage.style.padding = '20px 40px';
    pauseMessage.style.borderRadius = '10px';
    pauseMessage.style.fontSize = '24px';
    pauseMessage.style.zIndex = '100';
    pauseMessage.textContent = '一時停止中 - 続けるには [ESC] を押してください';
    gameContainer.appendChild(pauseMessage);
  }
}

/**
 * ダメージエフェクトの表示（画面を赤く点滅）
 */
export function showDamageEffect() {
  const gameContainer = document.getElementById('game-container');
  if (!gameContainer) return;
  
  const flashOverlay = document.createElement('div');
  flashOverlay.style.position = 'absolute';
  flashOverlay.style.top = '0';
  flashOverlay.style.left = '0';
  flashOverlay.style.width = '100%';
  flashOverlay.style.height = '100%';
  flashOverlay.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
  flashOverlay.style.pointerEvents = 'none';
  flashOverlay.style.zIndex = '100';
  gameContainer.appendChild(flashOverlay);
  
  setTimeout(() => {
    flashOverlay.style.transition = 'opacity 0.5s';
    flashOverlay.style.opacity = '0';
    setTimeout(() => {
      flashOverlay.remove();
    }, 500);
  }, 300);
}


  // ui.js に追加
export function debugFocusState() {
    console.log('===== フォーカス状態 =====');
    console.log('currentTypingEnemy:', GAME_STATE.currentTypingEnemy ? GAME_STATE.currentTypingEnemy.word : 'なし');
    
    const focusedElements = document.querySelectorAll('.word-container.focused');
    console.log('フォーカス要素数:', focusedElements.length);
    
    focusedElements.forEach((el, index) => {
      console.log(`フォーカス要素 ${index}:`, el.textContent);
    });
    
    console.log('全エネミー:', GAME_STATE.enemies.map(e => e.word).join(', '));
    console.log('=======================');
  }

  /**
 * メニューに戻るボタンの初期設定
 */
  export function setupBackToTitleButton() {
    const backButton = document.getElementById('back-to-title-button');
    
    if (backButton) {
      backButton.addEventListener('click', function() {
        console.log("メニューに戻るボタンがクリックされました");
        // ゲームを一時停止
        if (GAME_STATE.isRunning) {
          pauseGame();
        }
        
        // タイトル画面に戻る
        showStartScreen();
      });
      
      console.log("メニューに戻るボタンを設定しました");
    }
  }
  
  // カスタムイベントリスナーを設定
document.addEventListener('back-to-title-clicked', function() {
  console.log("バックトゥタイトルイベントを受信");
  // ゲームを一時停止
  if (GAME_STATE.isRunning) {
    pauseGame();
  }
  
  // タイトル画面に戻る
  showStartScreen();
});