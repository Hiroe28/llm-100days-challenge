/**
 * マイクラ風タイピングゲーム - メインエントリーポイント
 */

// モジュールのインポート
import { initUI, fixBackground, setupBackToTitleButton } from './ui.js';
import { setupRenderer } from './renderer.js';
import { loadSounds, toggleSound, updateBgmVolume, updateSfxVolume } from './sound.js';
import { GAME_STATE, resetGameState, startGame, pauseGame, selectDifficulty, selectGameMode } from './game.js';
import { onKeyDown, setupSmartFocus } from './input.js';

// DOM要素のキャッシュ
let elements = {};

/**
 * ゲームの初期化
 */
function init() {
  console.log("ゲーム初期化開始");
  
  // UI要素の初期化
  initUI();
  
  // Three.jsの設定
  setupRenderer();
  
  // サウンドの読み込み
  loadSounds();
  
  // イベントリスナーの設定
  setupEventListeners();
  
  // ゲーム状態の初期化
  resetGameState();
  
  // スマートフォーカス機能のセットアップ
  setupSmartFocus();
  
  // 背景の修正
  fixBackground();
  
  // 初期設定
  selectDifficulty('normal');
  selectGameMode('hiragana');

  // ボタン設定
  setupBackToTitleButton();
  
  console.log("ゲーム初期化完了");
}

/**
 * ゲームの再スタート
 */
function restartGame() {
  console.log("ゲームをリスタートします");
  
  // ゲーム状態をリセット（モードと難易度は保持される）
  resetGameState();
  
  // 選択ボタンの状態を更新
  updateSelectedButtons();
  
  // ゲームを開始
  startGame();
}

/**
 * 選択ボタンの状態を更新
 */
function updateSelectedButtons() {
  // 前回選択されたモードを反映
  if (elements.englishModeButton && elements.hiraganaModeButton) {
    elements.englishModeButton.classList.remove('selected');
    elements.hiraganaModeButton.classList.remove('selected');
    
    if (GAME_STATE.gameMode === 'english') {
      elements.englishModeButton.classList.add('selected');
    } else {
      elements.hiraganaModeButton.classList.add('selected');
    }
  }
  
  // 前回選択された難易度を反映
  if (elements.easyButton && elements.normalButton && elements.hardButton) {
    elements.easyButton.classList.remove('selected');
    elements.normalButton.classList.remove('selected');
    elements.hardButton.classList.remove('selected');
    
    switch (GAME_STATE.difficulty) {
      case 'easy':
        elements.easyButton.classList.add('selected');
        break;
      case 'normal':
        elements.normalButton.classList.add('selected');
        break;
      case 'hard':
        elements.hardButton.classList.add('selected');
        break;
    }
  }
}

/**
 * DOM要素の取得とキャッシュ
 */
function cacheElements() {
  elements = {
    // スタート画面関連
    startScreen: document.getElementById('start-screen'),
    startButton: document.getElementById('start-button'),
    
    // 難易度選択ボタン
    easyButton: document.getElementById('easy-button'),
    normalButton: document.getElementById('normal-button'),
    hardButton: document.getElementById('hard-button'),
    
    // モード選択ボタン
    englishModeButton: document.getElementById('english-mode'),
    hiraganaModeButton: document.getElementById('hiragana-mode'),
    
    // ゲームオーバー画面関連
    gameOverScreen: document.getElementById('game-over'),
    restartButton: document.getElementById('restart-button'),
    menuButton: document.getElementById('menu-button'),
    
    // 設定・ヘルプ関連
    settingsButton: document.getElementById('settings-button'),
    helpButton: document.getElementById('help-button'),
    settingsScreen: document.getElementById('settings-screen'),
    helpScreen: document.getElementById('help-screen'),
    backFromSettingsButton: document.getElementById('back-from-settings'),
    backFromHelpButton: document.getElementById('back-from-help'),
    
    // サウンド設定関連
    soundToggle: document.getElementById('sound-toggle'),
    bgmVolumeSlider: document.getElementById('bgm-volume'),
    sfxVolumeSlider: document.getElementById('sfx-volume'),
    
    // フォントサイズ設定
    fontSizeSelect: document.getElementById('font-size')
  };
}

/**
 * イベントリスナーの設定
 */
function setupEventListeners() {
  // キャッシュする要素を取得
  cacheElements();
  
  // キーボードイベント
  document.addEventListener('keydown', onKeyDown);
  
  // ゲーム一時停止イベント
  // document.addEventListener('game-pause', () => pauseGame());
  
  // ウィンドウリサイズイベント
  window.addEventListener('resize', () => {
    // リサイズイベントはrenderer.jsで処理
  });
  
  // スタートボタン
  if (elements.startButton) {
    elements.startButton.addEventListener('click', () => {
      console.log("スタートボタンがクリックされました");
      startGame();
    });
  }
  
  // リスタートボタン
  if (elements.restartButton) {
    elements.restartButton.addEventListener('click', () => {
      console.log("リスタートボタンがクリックされました");
      restartGame();
    });
  }
  
  // メニューボタン
  if (elements.menuButton) {
    elements.menuButton.addEventListener('click', () => {
      console.log("メニューボタンがクリックされました");
      showStartScreen();
    });
  }
  
  // 難易度選択ボタン
  if (elements.easyButton) {
    elements.easyButton.addEventListener('click', () => selectDifficulty('easy'));
  }
  
  if (elements.normalButton) {
    elements.normalButton.addEventListener('click', () => selectDifficulty('normal'));
  }
  
  if (elements.hardButton) {
    elements.hardButton.addEventListener('click', () => selectDifficulty('hard'));
  }
  
  // ゲームモード選択ボタン
  if (elements.englishModeButton) {
    elements.englishModeButton.addEventListener('click', () => selectGameMode('english'));
  }
  
  if (elements.hiraganaModeButton) {
    elements.hiraganaModeButton.addEventListener('click', () => selectGameMode('hiragana'));
  }
  
  // 設定・ヘルプボタン
  if (elements.settingsButton) {
    elements.settingsButton.addEventListener('click', () => {
      if (elements.settingsScreen) {
        elements.settingsScreen.classList.remove('hidden');
      }
    });
  }
  
  if (elements.helpButton) {
    elements.helpButton.addEventListener('click', () => {
      if (elements.helpScreen) {
        elements.helpScreen.classList.remove('hidden');
      }
    });
  }
  
  if (elements.backFromSettingsButton) {
    elements.backFromSettingsButton.addEventListener('click', () => {
      if (elements.settingsScreen) {
        elements.settingsScreen.classList.add('hidden');
      }
    });
  }
  
  if (elements.backFromHelpButton) {
    elements.backFromHelpButton.addEventListener('click', () => {
      if (elements.helpScreen) {
        elements.helpScreen.classList.add('hidden');
      }
    });
  }
  
  // サウンド設定のイベントリスナー
  if (elements.soundToggle) {
    elements.soundToggle.addEventListener('click', toggleSound);
  }
  
  if (elements.bgmVolumeSlider) {
    elements.bgmVolumeSlider.addEventListener('input', updateBgmVolume);
  }
  
  if (elements.sfxVolumeSlider) {
    elements.sfxVolumeSlider.addEventListener('input', updateSfxVolume);
  }
  
  // フォントサイズ設定
  if (elements.fontSizeSelect) {
    elements.fontSizeSelect.addEventListener('change', updateFontSize);
  }
}

/**
 * スタート画面の表示
 */
function showStartScreen() {
  // ゲーム状態をリセット（モードと難易度は保持される）
  resetGameState();
  
  // 選択ボタンの状態を更新
  updateSelectedButtons();
  
  if (elements.startScreen) {
    elements.startScreen.classList.remove('hidden');
  }
  
  if (elements.gameOverScreen) {
    elements.gameOverScreen.style.display = 'none';
  }
  
  console.log(`スタート画面表示: モード=${GAME_STATE.gameMode}, 難易度=${GAME_STATE.difficulty}`);
}

/**
 * フォントサイズの更新
 */
function updateFontSize() {
  if (!elements.fontSizeSelect) return;
  
  const fontSize = elements.fontSizeSelect.value;
  
  // 前のクラスを削除
  document.body.classList.remove('font-small', 'font-medium', 'font-large');
  
  // 新しいクラスを追加
  document.body.classList.add(`font-${fontSize}`);
}

// DOMが読み込まれたら実行
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM読み込み完了");
  init();
});