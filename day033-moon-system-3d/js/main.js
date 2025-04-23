// メインアプリケーション

// グローバル変数
let clock;
let loadingManager;

// アプリケーションの初期化
function init() {
  // ローディングマネージャーのセットアップ
  loadingManager = setupLoadingManager();
  
  // UIの初期化
  initUI();
  
  // Three.jsシーンのセットアップ（ローディングマネージャーを渡す）
  setupScene(loadingManager);
  
  // 天体の作成
  createCelestialBodies();
  
  // 時間計測用のクロックを初期化
  clock = new THREE.Clock();
  
  // 月相を初期設定（満月からスタート）
  setMoonPhase('full-moon');
  
  // アニメーションループ開始
  animate();
}

// アニメーションループ
function animate() {
  requestAnimationFrame(animate);
  
  // 経過時間を取得
  const deltaTime = Math.min(clock.getDelta(), 0.1);
  
  // アニメーション中なら天体を更新
  if (isAnimationPlaying) {
    updateCelestialBodies(deltaTime, animationSpeed, showOrbits);
    
    // 一定間隔でUIを自動更新
    if (Math.floor(clock.elapsedTime * 10) % 10 === 0) {
      autoUpdatePhaseUI();
    }
  }
  
  // ラベルの更新
  updateLabels(showLabels);
  
  // コントロールの更新
  controls.update();
  
  // シーンをレンダリング
  renderer.render(scene, camera);
}

// ウィンドウが読み込まれたら初期化
window.addEventListener('load', init);