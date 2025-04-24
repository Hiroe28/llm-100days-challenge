// グローバル変数
let scene, camera, renderer, controls;
let earthPivot, moonPivot;
let isPlaying = false;
let speed = 1.0;
let angle = 0;
let prevAngle = 0;
let currentView = 'space';
let showOrbits = true;
let showInfo = true;
let showMenu = true; // メニュー表示状態
let playBGM = false; // BGM再生状態
let bgmAudio; // BGM用オーディオ要素
let sunLight, ambientLight;
let clock;
let objects = {};
let moonAngleRad = 0; // 月の相対角度
let isDragging = false;
let userInteracted = false;
let viewLocked = false;


// 初期化処理
function init() {
  // シーンの作成
  scene = new THREE.Scene();
  
  // カメラの作成
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 20, 50);
  
  // レンダラーの作成
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000);
  document.getElementById('canvas-container').appendChild(renderer.domElement);
  
  // コントロールの作成
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  // ドラッグ検知
  controls.addEventListener('start', function() {
    isDragging = true;
  });
  
  controls.addEventListener('end', function() {
    isDragging = false;
    viewLocked = true; // ドラッグ操作後も視点を固定
  });
  
  // 光源の作成
  sunLight = new THREE.PointLight(0xffffff, 2, 200);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);
  
  ambientLight = new THREE.AmbientLight(0x333333);
  scene.add(ambientLight);
  
  // 地球のピボット（公転の中心）
  earthPivot = new THREE.Object3D();
  scene.add(earthPivot);
  
  // 月のピボット
  moonPivot = new THREE.Object3D();
  scene.add(moonPivot);
  
  // 天体の作成
  objects = createCelestialBodies(scene, earthPivot, moonPivot);
  
  // 星空の背景
  createStarBackground(scene);
  
  // クロック
  clock = new THREE.Clock();
  
  // ウィンドウリサイズイベント
  window.addEventListener('resize', onWindowResize, false);
  
  // UIイベントの設定
  setupUIEvents();
  
  // 今日の月の位置を設定（新月の初期表示をスキップ）
  setTodayMoonPosition();
  
  // 初期視点を地球からに設定（地球からの視点ボタンをクリック）
  document.querySelector('[data-view="earth"]').click();
  
  // ローディング画面を非表示
  const loadingScreen = document.querySelector('.loading');
  loadingScreen.style.opacity = 0;
  setTimeout(() => {
    loadingScreen.style.display = 'none';
  }, 1000);
  
  // BGMの初期化
  bgmAudio = document.getElementById('background-music');
  bgmAudio.volume = 0.3; // ボリュームを30%に設定

  // アニメーションの開始
  animate();
}

// 月の位置を特定の角度に設定する関数
function setMoonPhase(targetAngle) {
  moonAngleRad = THREE.MathUtils.degToRad(targetAngle % 360);
  angle = targetAngle % 360;
  prevAngle = angle;
  updatePhaseInfo(angle);
}

// ウィンドウリサイズ時の処理
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// アニメーションループ
function animate() {
  requestAnimationFrame(animate);
  const deltaTime = clock.getDelta();

  // 地球の公転
  if (isPlaying) {
    earthPivot.rotation.y += 0.003 * speed * deltaTime;

    // 月の相対角度を進める
    moonAngleRad += 0.03 * speed * deltaTime;
    
    // 地球の自転
    objects.earth.rotation.y += 0.1 * speed * deltaTime;
  }

  // 地球の位置を取得 → 月の回転中心を追従させる
  const earthWorldPos = new THREE.Vector3();
  objects.earth.getWorldPosition(earthWorldPos);
  moonPivot.position.copy(earthWorldPos);

  // 月の絶対回転角度（地球 + 相対角度）
  moonPivot.rotation.y = earthPivot.rotation.y + moonAngleRad;

  // 現在の相対角度（表示のため）
  angle = (moonAngleRad * 180 / Math.PI) % 360;
  if (angle < 0) angle += 360;

  // 角度が変わったら月相情報を更新
  if (Math.floor(angle / 10) !== Math.floor(prevAngle / 10)) {
    updatePhaseInfo(angle);
    prevAngle = angle;
  }

  updateCameraView();
  controls.update();
  renderer.render(scene, camera);
}


// ラベルの位置を更新
function updateLabels() {
  // この関数は使用しないため削除しておく
}

// UIイベントの設定
function updateCameraView() {
  // ユーザーがカメラを操作した場合、または視点がロックされている場合は自動更新しない
  if (isDragging || userInteracted || viewLocked) return;
  
  if (currentView === 'earth') {
    // 地球からの視点（月を見る）
    const earthPos = new THREE.Vector3();
    objects.earth.getWorldPosition(earthPos);
    
    const moonPos = new THREE.Vector3();
    objects.moon.getWorldPosition(moonPos);
    
    // 地球の少し上から月を見る
    camera.position.copy(earthPos).add(new THREE.Vector3(0, 1, 0));
    controls.target.copy(moonPos);
  }
  else if (currentView === 'moon') {
    // 月のクローズアップ
    const moonPos = new THREE.Vector3();
    objects.moon.getWorldPosition(moonPos);
    
    // 月との距離を保つ
    const direction = new THREE.Vector3().subVectors(camera.position, moonPos).normalize();
    const distance = 2;
    
    if (camera.position.distanceTo(moonPos) > distance * 1.5 || camera.position.distanceTo(moonPos) < distance * 0.5) {
      camera.position.copy(moonPos).add(direction.multiplyScalar(distance));
    }
    
    controls.target.copy(moonPos);
  }
}

// setupUIEvents関数内に以下を追加
function setupUIEvents() {
  // タブ切り替え
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', function() {
      const tabId = this.dataset.tab;
      
      // タブボタンのアクティブ状態を切り替え
      document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
      });
      this.classList.add('active');
      
      // タブコンテンツの表示を切り替え
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(`${tabId}-tab`).classList.add('active');
    });
  });
  
  // 再生/一時停止ボタン
  document.getElementById('play-pause').addEventListener('click', function() {
    isPlaying = !isPlaying;
    this.textContent = isPlaying ? '一時停止' : '再生';
  });
  
  // 速度スライダー
  const speedSlider = document.getElementById('speed-slider');
  const speedValue = document.getElementById('speed-value');
  
  speedSlider.addEventListener('input', function() {
    speed = parseFloat(this.value);
    speedValue.textContent = speed.toFixed(1);
  });
  
  // 今日の位置ボタンのイベント設定
  document.getElementById('today-position').addEventListener('click', function() {
    setTodayMoonPosition();
  });
  
  
  // マウスホイールのイベントリスナーを追加
  renderer.domElement.addEventListener('wheel', function() {
    userInteracted = true;
    viewLocked = true;
  });
  
  // 視点ボタンのイベントリスナーを修正
  document.querySelectorAll('.view-button').forEach(button => {
    button.addEventListener('click', function() {
      // 前の視点ボタンからアクティブクラスを削除
      document.querySelectorAll('.view-button').forEach(btn => {
        btn.classList.remove('active');
      });
      
      // 新しい視点ボタンにアクティブクラスを追加
      this.classList.add('active');
      
      // 視点を変更
      currentView = this.dataset.view;
      
      // ユーザー操作フラグをリセット - ただし視点ボタンクリック時のみ
      userInteracted = false;
      viewLocked = false;
  
      // カメラ位置をリセット
      if (currentView === 'space') {
        camera.position.set(0, 20, 50);
        controls.target.set(0, 0, 0);
      }
    });
  });
  
  // 軌道表示切替ボタン
  document.getElementById('toggle-orbit').addEventListener('click', function() {
    showOrbits = !showOrbits;
    this.textContent = `軌道: ${showOrbits ? 'OFF' : 'ON'}`;
    
    // 軌道の表示/非表示
    objects.earthOrbit.visible = showOrbits;
    objects.moonOrbit.visible = showOrbits;
  });
  
  // ラベル表示切替ボタンを削除
  
  // 月相情報表示切替ボタン（UIコントロール内に移動）
  document.getElementById('toggle-info').addEventListener('click', function() {
    showInfo = !showInfo;
    this.textContent = `説明: ${showInfo ? 'OFF' : 'ON'}`;
    document.querySelector('.phase-info').style.opacity = showInfo ? '1' : '0';
    document.querySelector('.phase-info').style.pointerEvents = showInfo ? 'auto' : 'none';
  });
  
  // BGM再生切替ボタン
  document.getElementById('toggle-bgm').addEventListener('click', function() {
    playBGM = !playBGM;
    
    if (playBGM) {
      // BGM再生
      bgmAudio.play().catch(error => {
        console.error('BGMの再生に失敗しました:', error);
        // 再生失敗時は状態を戻す
        playBGM = false;
        this.textContent = 'BGM: OFF';
        this.classList.remove('active');
      });
      this.textContent = 'BGM: ON';
      this.classList.add('active');
    } else {
      // BGM停止
      bgmAudio.pause();
      bgmAudio.currentTime = 0;
      this.textContent = 'BGM: OFF';
      this.classList.remove('active');
    }
  });

  // メニュー表示/非表示切替ボタン
  document.getElementById('toggle-menu').addEventListener('click', function() {
    showMenu = !showMenu;
    const menuButton = document.getElementById('toggle-menu');
    const mobileControls = document.querySelector('.mobile-controls');
    
    if (showMenu) {
      // メニューを表示
      mobileControls.classList.remove('hidden');
      menuButton.textContent = '▼';
      menuButton.classList.remove('closed');
    } else {
      // メニューを非表示
      mobileControls.classList.add('hidden');
      menuButton.textContent = '▲';
      menuButton.classList.add('closed');
    }
  });
  
  // 月相ボタン
  document.querySelectorAll('.phase-button').forEach(button => {
    button.addEventListener('click', function() {
      const targetAngle = parseInt(this.dataset.angle);
      setMoonPhase(targetAngle);
    });
  });
  // モバイルデバイスでのピンチズーム防止
  document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
  });
  
  document.addEventListener('gesturechange', function(e) {
    e.preventDefault();
  });
  
  document.addEventListener('gestureend', function(e) {
    e.preventDefault();
  });
}

// ページが読み込まれたら初期化
window.addEventListener('load', function() {
  // ローディングプログレスの更新
  const progressBar = document.querySelector('.loading-progress');
  let progress = 0;
  
  const interval = setInterval(() => {
    progress += 5;
    progressBar.style.width = `${progress}%`;
    
    if (progress >= 100) {
      clearInterval(interval);
      init();
      
      // 初期化完了後の追加処理は必要なくなった（init内部で対応）
    }
  }, 100);
});