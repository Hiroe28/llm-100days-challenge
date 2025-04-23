// 3D描画関連の関数

let scene, camera, renderer;
let controls, textureLoader;
let sun, earth, moon;
let earthOrbit, moonOrbit;
let celestialLabels = [];
let currentViewMode = 'space';

// シーン、カメラ、レンダラーのセットアップ
function setupScene(loadingManager) {
  // シーン作成
  scene = new THREE.Scene();
  
  // カメラ作成
  camera = new THREE.PerspectiveCamera(
    CONFIG.CAMERA.FOV,
    window.innerWidth / window.innerHeight,
    CONFIG.CAMERA.NEAR,
    CONFIG.CAMERA.FAR
  );
  
  // 初期カメラ位置を設定
  camera.position.set(...CONFIG.CAMERA.INITIAL_POSITIONS.SPACE);
  camera.lookAt(0, 0, 0);
  
  // レンダラー作成
  renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  // ビジュアル改善のための設定
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  
  document.body.appendChild(renderer.domElement);
  
  // OrbitControlsのセットアップ
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = CONFIG.CAMERA.ORBIT_CONTROLS.ENABLE_DAMPING;
  controls.dampingFactor = CONFIG.CAMERA.ORBIT_CONTROLS.DAMPING_FACTOR;
  controls.minDistance = CONFIG.CAMERA.ORBIT_CONTROLS.MIN_DISTANCE;
  controls.maxDistance = CONFIG.CAMERA.ORBIT_CONTROLS.MAX_DISTANCE;
  
  // テクスチャローダー作成 - ローディングマネージャーを渡す
  textureLoader = new THREE.TextureLoader(loadingManager);
  
  // 環境光の追加
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
  scene.add(ambientLight);
  
  // 星空の背景を追加
  addStarBackground();
  
  // ウィンドウリサイズイベントの処理
  window.addEventListener('resize', onWindowResize, false);
}

// 星空の背景を追加
function addStarBackground() {
  const starsGeometry = new THREE.BufferGeometry();
  const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.1,
    transparent: true
  });
  
  const starsVertices = [];
  for (let i = 0; i < 5000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    starsVertices.push(x, y, z);
  }
  
  starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
  const starField = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(starField);
}

// 天体の作成
function createCelestialBodies() {
  // 太陽の作成
  createSun();
  
  // 地球と軌道の作成
  createEarth();
  
  // 月と軌道の作成
  createMoon();
  
  // ラベルの作成
  createCelestialLabels();
}

// 太陽の作成
function createSun() {
  const sunGeometry = new THREE.SphereGeometry(CELESTIAL_BODIES.SUN.size, 32, 32);
  
  // テクスチャのロード
  const sunTexture = textureLoader.load(CELESTIAL_BODIES.SUN.texturePath);
  sunTexture.encoding = THREE.sRGBEncoding;
  
  // 太陽のマテリアル（発光する）
  const sunMaterial = new THREE.MeshStandardMaterial({
    map: sunTexture,
    emissive: CELESTIAL_BODIES.SUN.color,
    emissiveIntensity: 1.0
  });
  
  sun = new THREE.Mesh(sunGeometry, sunMaterial);
  scene.add(sun);
  
  // 太陽光源
  const sunLight = new THREE.PointLight(0xffffff, 2.0, 100);
  sun.add(sunLight);
}

// 地球と軌道の作成
function createEarth() {
  // 地球のグループ（公転用）
  const earthGroup = new THREE.Group();
  scene.add(earthGroup);
  
  // 地球の軌道の作成
  earthOrbit = createOrbit(CELESTIAL_BODIES.EARTH.distance);
  scene.add(earthOrbit);
  
  // 地球のジオメトリ
  const earthGeometry = new THREE.SphereGeometry(CELESTIAL_BODIES.EARTH.size, 32, 32);
  
  // 地球のテクスチャのロード
  const earthTexture = textureLoader.load(CELESTIAL_BODIES.EARTH.texturePath);
  earthTexture.encoding = THREE.sRGBEncoding;
  
  // バンプマップのロード（もしあれば）
  let earthBumpMap = null;
  if (CELESTIAL_BODIES.EARTH.bumpMapPath) {
    earthBumpMap = textureLoader.load(CELESTIAL_BODIES.EARTH.bumpMapPath);
  }
  
  // 地球のマテリアル
  const earthMaterial = new THREE.MeshStandardMaterial({
    map: earthTexture,
    bumpMap: earthBumpMap,
    bumpScale: 0.05,
    metalness: 0.0,
    roughness: 0.7
  });
  
  earth = new THREE.Mesh(earthGeometry, earthMaterial);
  
  // 地球の初期位置を設定
  earth.position.x = CELESTIAL_BODIES.EARTH.distance;
  
  // 地球の公転軸を少し傾ける（23.5度）
  earth.rotation.z = 23.5 * Math.PI / 180;
  
  earthGroup.add(earth);
  
  // 地球のデータを保存
  earth.userData = {
    body: CELESTIAL_BODIES.EARTH,
    orbitAngle: 0,
    orbitSpeed: CELESTIAL_BODIES.EARTH.orbitSpeed,
    rotationSpeed: CELESTIAL_BODIES.EARTH.rotationSpeed,
    parent: earthGroup
  };
}

// 月と軌道の作成
function createMoon() {
  // 月のグループ（公転用）- 地球のグループに追加
  const moonGroup = new THREE.Group();
  earth.userData.parent.add(moonGroup);
  
  // 月の軌道の作成 - 地球の子要素として追加
  moonOrbit = createOrbit(CELESTIAL_BODIES.MOON.distance, 0x888888);
  earth.add(moonOrbit);
  
  // 月のジオメトリ
  const moonGeometry = new THREE.SphereGeometry(CELESTIAL_BODIES.MOON.size, 32, 32);
  
  // 月のテクスチャのロード
  const moonTexture = textureLoader.load(CELESTIAL_BODIES.MOON.texturePath);
  moonTexture.encoding = THREE.sRGBEncoding;
  
  // バンプマップのロード（もしあれば）
  let moonBumpMap = null;
  if (CELESTIAL_BODIES.MOON.bumpMapPath) {
    moonBumpMap = textureLoader.load(CELESTIAL_BODIES.MOON.bumpMapPath);
  }
  
  // 月のマテリアル
  const moonMaterial = new THREE.MeshStandardMaterial({
    map: moonTexture,
    bumpMap: moonBumpMap,
    bumpScale: 0.02,
    metalness: 0.0,
    roughness: 0.8
  });
  
  moon = new THREE.Mesh(moonGeometry, moonMaterial);
  
  // 月の初期位置を設定
  moon.position.x = CELESTIAL_BODIES.MOON.distance;
  
  moonGroup.add(moon);
  
  // 月のデータを保存
  moon.userData = {
    body: CELESTIAL_BODIES.MOON,
    orbitAngle: 0,
    orbitSpeed: CELESTIAL_BODIES.MOON.orbitSpeed,
    rotationSpeed: CELESTIAL_BODIES.MOON.rotationSpeed,
    parent: moonGroup
  };
}

// 軌道の作成
function createOrbit(radius, color = CONFIG.COLORS.ORBIT) {
  const segments = 64;
  const orbitGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(segments * 3);
  
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
  }
  
  orbitGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const orbitMaterial = new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.3
  });
  
  return new THREE.Line(orbitGeometry, orbitMaterial);
}

// 天体ラベルの作成
function createCelestialLabels() {
  // 既存のラベルをクリア
  celestialLabels.forEach(label => {
    if (label.element && label.element.parentNode) {
      document.body.removeChild(label.element);
    }
  });
  celestialLabels = [];
  
  // 太陽のラベル
  createCelestialLabel(sun, CELESTIAL_BODIES.SUN.jpName);
  
  // 地球のラベル
  createCelestialLabel(earth, CELESTIAL_BODIES.EARTH.jpName);
  
  // 月のラベル
  createCelestialLabel(moon, CELESTIAL_BODIES.MOON.jpName);
}

// 天体ラベルの作成
function createCelestialLabel(mesh, name) {
  const label = document.createElement('div');
  label.className = 'celestial-label';
  label.textContent = name;
  document.body.appendChild(label);
  
  celestialLabels.push({
    element: label,
    mesh: mesh
  });
}

// ラベルの位置を更新
function updateLabels(showLabels) {
  celestialLabels.forEach(({ element, mesh }) => {
    // メッシュの世界座標を取得
    const worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);
    
    // 世界座標からスクリーン座標に変換
    const screenPos = worldToScreen(worldPos, camera, window.innerWidth, window.innerHeight);
    
    // 画面内に表示されている場合のみラベルを表示
    if (screenPos.visible && showLabels) {
      element.style.display = 'block';
      element.style.transform = `translate(-50%, -50%) translate(${screenPos.x}px, ${screenPos.y}px)`;
      
      // 距離に応じて不透明度を調整
      const distance = camera.position.distanceTo(worldPos);
      const opacity = Math.max(0.2, Math.min(1, 50 / distance));
      element.style.opacity = opacity;
    } else {
      element.style.display = 'none';
    }
  });
}

// ウィンドウリサイズ時の処理
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// 視点を切り替える
function changeView(viewMode) {
  currentViewMode = viewMode;
  
  // トランジションのために現在のカメラ位置を保存
  const startPosition = camera.position.clone();
  const startTarget = controls.target.clone();
  
  let endPosition, endTarget;
  
  switch (viewMode) {
    case 'space':
      // 宇宙からの視点
      endPosition = new THREE.Vector3(...CONFIG.CAMERA.INITIAL_POSITIONS.SPACE);
      endTarget = new THREE.Vector3(0, 0, 0);
      break;
      
    case 'earth':
      // 地球からの視点
      const earthPos = new THREE.Vector3();
      earth.getWorldPosition(earthPos);
      
      // 地球の少し上から月を見る位置
      endPosition = earthPos.clone().add(new THREE.Vector3(0, 1.5, 0));
      
      // 月の方向を向く
      const moonPos = new THREE.Vector3();
      moon.getWorldPosition(moonPos);
      endTarget = moonPos;
      break;
      
    case 'moon':
      // 月のクローズアップ
      const moonWorldPos = new THREE.Vector3();
      moon.getWorldPosition(moonWorldPos);
      
      // 月の近くにカメラを配置
      endPosition = moonWorldPos.clone().add(new THREE.Vector3(0, 0.5, 2));
      endTarget = moonWorldPos;
      break;
  }
  
  // カメラを徐々に移動させる
  animateCamera(startPosition, endPosition, startTarget, endTarget, 1000);
}

// カメラを徐々に移動させる
function animateCamera(startPos, endPos, startTarget, endTarget, duration) {
  const startTime = Date.now();
  
  function updateCamera() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // イージング関数（緩やかに始まり、緩やかに終わる）
    const easeProgress = progress < 0.5 
      ? 2 * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    
    // カメラ位置の補間
    camera.position.lerpVectors(startPos, endPos, easeProgress);
    
    // カメラターゲットの補間
    const currentTarget = new THREE.Vector3().lerpVectors(startTarget, endTarget, easeProgress);
    controls.target.copy(currentTarget);
    controls.update();
    
    if (progress < 1) {
      requestAnimationFrame(updateCamera);
    }
  }
  
  updateCamera();
}

// 天体の更新
function updateCelestialBodies(deltaTime, animationSpeed, orbitVisible) {
  // 地球の公転更新
  updateOrbit(earth, deltaTime, animationSpeed);
  
  // 月の公転更新
  updateOrbit(moon, deltaTime, animationSpeed);
  
  // 自転の更新
  earth.rotation.y += earth.userData.rotationSpeed * animationSpeed * deltaTime;
  moon.rotation.y += moon.userData.rotationSpeed * animationSpeed * deltaTime;
  
  // 軌道の表示/非表示
  earthOrbit.visible = orbitVisible;
  moonOrbit.visible = orbitVisible;
}

// 天体の公転更新
function updateOrbit(celestialBody, deltaTime, speedFactor) {
  // 公転角度を更新
  celestialBody.userData.orbitAngle += celestialBody.userData.orbitSpeed * speedFactor * deltaTime;
  
  // 公転グループを回転
  celestialBody.userData.parent.rotation.y = celestialBody.userData.orbitAngle;
}