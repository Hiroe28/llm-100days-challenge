// UI操作関連の関数

// UI要素への参照
let animationSpeedSlider, showOrbitCheckbox, showLabelsCheckbox;
let playPauseButton, viewButtons, phaseButtons;

// UIの設定値
let animationSpeed = 1.0;
let showOrbits = true;
let showLabels = true;
let isAnimationPlaying = true;

// ローディング関連
let loadingContainer, loadingBar, loadingProgress;

// UIの初期化
function initUI() {
  // ローディング要素
  loadingContainer = document.getElementById('loading-container');
  loadingBar = document.getElementById('loading-bar');
  loadingProgress = document.getElementById('loading-progress');
  
  // コントロール要素
  animationSpeedSlider = document.getElementById('animation-speed');
  showOrbitCheckbox = document.getElementById('show-orbit');
  showLabelsCheckbox = document.getElementById('show-labels');
  playPauseButton = document.getElementById('play-pause-button');
  
  // 視点切り替えボタン
  viewButtons = document.querySelectorAll('.view-button');
  
  // 月相ボタン
  phaseButtons = document.querySelectorAll('.phase-button');
  
  // イベントリスナーの設定
  setupEventListeners();
}

// イベントリスナーのセットアップ
function setupEventListeners() {
  // アニメーション速度スライダー
  animationSpeedSlider.addEventListener('input', function() {
    animationSpeed = parseFloat(this.value);
    document.getElementById('speed-value').textContent = animationSpeed.toFixed(1);
  });
  
  // 軌道表示チェックボックス
  showOrbitCheckbox.addEventListener('change', function() {
    showOrbits = this.checked;
  });
  
  // ラベル表示チェックボックス
  showLabelsCheckbox.addEventListener('change', function() {
    showLabels = this.checked;
  });
  
  // 再生/一時停止ボタン
  playPauseButton.addEventListener('click', toggleAnimation);
  
  // 視点切り替えボタン
  viewButtons.forEach(button => {
    button.addEventListener('click', function() {
      const viewMode = this.id.replace('-view', '');
      
      // アクティブクラスを更新
      viewButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // 視点を変更
      changeView(viewMode);
    });
  });
  
  // 月相ボタン
  phaseButtons.forEach(button => {
    button.addEventListener('click', function() {
      const phaseId = this.dataset.phase;
      setMoonPhase(phaseId);
    });
  });
}

// アニメーションの再生/一時停止を切り替え
function toggleAnimation() {
  isAnimationPlaying = !isAnimationPlaying;
  
  // ボタンのテキストを更新
  playPauseButton.textContent = isAnimationPlaying ? '一時停止' : '再生';
}

// ローディング進捗の更新
function updateLoadingProgress(loaded, total) {
  const progress = Math.min(Math.round((loaded / total) * 100), 100);
  loadingBar.style.width = progress + '%';
  loadingProgress.textContent = progress + '%';
  
  if (progress >= 100) {
    setTimeout(() => {
      fadeOut(loadingContainer, 500);
    }, 300);
  }
}

// ローディングマネージャーの設定
function setupLoadingManager() {
  const manager = new THREE.LoadingManager();
  
  manager.onProgress = function(url, itemsLoaded, itemsTotal) {
    updateLoadingProgress(itemsLoaded, itemsTotal);
  };
  
  manager.onLoad = function() {
    console.log('すべてのリソースがロードされました');
  };
  
  manager.onError = function(url) {
    console.error('リソースのロード中にエラーが発生しました: ' + url);
  };
  
  return manager;
}