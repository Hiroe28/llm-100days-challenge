// メインアプリケーションコード

// グローバル変数
let scene, camera, renderer, composer;
let sun, planets = [], planetMeshes = [], orbitLines = [], labels = [];
let controls, clock;
let selectedPlanet = null;
let textureLoader, loadingManager;
let isRealisticScale = false;
let sizeScale = 1.0;
let distanceScale = 1.0;
let speedScale = 1.0;
let showOrbits = true;
let showLabels = true;

let isTourActive = false;
let currentTourPlanet = null;
let originalSpeedScale = 1.0;
let tourControls = null;

let rotationScale = 5.0; // 自転速度の基本倍率（デフォルトで5倍）
let originalRotationSpeeds = []; // 元の自転速度を保存
let originalRotationScale = 1.0; // 自転速度の元の値を保存


// DOMエレメント
const loadingContainer = document.getElementById('loading-container');
const loadingBar = document.getElementById('loading-bar');
const loadingText = document.getElementById('loading-progress');
const infoPanel = document.getElementById('info-panel');
const showOrbitsCheckbox = document.getElementById('show-orbits');
const showLabelsCheckbox = document.getElementById('show-labels');
const realScaleCheckbox = document.getElementById('realistic-scale');
const scaleSlider = document.getElementById('scale-slider');
const distanceSlider = document.getElementById('distance-slider');
const speedSlider = document.getElementById('speed-slider');
const scaleValue = document.getElementById('scale-value');
const distanceValue = document.getElementById('distance-value');
const speedValue = document.getElementById('speed-value');

// 初期化関数を修正 - 呼び出し順序を変更
function init() {
    // シーン、カメラ、レンダラーのセットアップ
    setupScene();
    
    // テクスチャローダーとローディングマネージャーのセットアップ
    setupLoadingManager();
    
    // 星空の背景を追加
    addStarBackground();
    
    // 太陽を作成（ポストプロセッシングの前にこれを実行）
    createSun();
    
    // 太陽が作成された後にポストプロセッシングのセットアップ
    setupPostProcessing();
    
    // 惑星を作成
    createPlanets();
    
    // UI初期化とイベントリスナー追加
    setupUI();
    
    // 時間計測用のクロックを初期化
    clock = new THREE.Clock();
    
    // オプション機能を初期化
    addOrbitalGrid();

    // UIの調整を追加
    adjustUIForScreenSize();

  // 自転速度を強化
  enhanceRotationSpeeds();

    addTourButton();
    // アニメーションループ開始
    animate();
  }

// シーン、カメラ、レンダラーのセットアップ
function setupScene() {
    // シーン作成
    scene = new THREE.Scene();
    
    // カメラ作成
    camera = new THREE.PerspectiveCamera(
      CONSTANTS.CAMERA.FOV,
      window.innerWidth / window.innerHeight,
      CONSTANTS.CAMERA.NEAR,
      CONSTANTS.CAMERA.FAR
    );
    camera.position.set(...CONSTANTS.CAMERA.INITIAL_POSITION);
    camera.lookAt(...CONSTANTS.CAMERA.LOOK_AT);
    
    // レンダラー作成
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,  // アンチエイリアスを有効化
        alpha: true,      // 透明度サポート
        powerPreference: "high-performance"  // パフォーマンス設定
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000);
    
    // ピクセル比を設定（高DPIディスプレイ対応）
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // ビジュアル改善のための設定を追加
    renderer.physicallyCorrectLights = true;          // 物理的に正確なライティング
    renderer.outputEncoding = THREE.sRGBEncoding;     // 正確な色表現
    renderer.toneMapping = THREE.ACESFilmicToneMapping; // 映画のような色調
    renderer.toneMappingExposure = 1.1;               // 露出調整
  
    document.body.appendChild(renderer.domElement);
    
    // OrbitControlsの設定
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = CONSTANTS.CAMERA.ORBIT_CONTROLS.ENABLE_DAMPING;
    controls.dampingFactor = CONSTANTS.CAMERA.ORBIT_CONTROLS.DAMPING_FACTOR;
    controls.minDistance = CONSTANTS.CAMERA.ORBIT_CONTROLS.MIN_DISTANCE;
    controls.maxDistance = CONSTANTS.CAMERA.ORBIT_CONTROLS.MAX_DISTANCE;
    controls.enablePan = CONSTANTS.CAMERA.ORBIT_CONTROLS.ENABLE_PAN;
    controls.autoRotate = CONSTANTS.CAMERA.ORBIT_CONTROLS.AUTO_ROTATE;
    
    // 追加：3点照明システムのセットアップ
    setupLighting();
    
    // ウィンドウリサイズイベントの処理
    window.addEventListener('resize', onWindowResize, false);

    // モバイル用にカメラ位置を調整
    if (window.innerWidth < 768) {  // モバイルデバイス判定
        camera.position.set(0, 40, 120);  // より遠くから見る
        camera.lookAt(0, 0, 0);
        
        // OrbitControlsの設定を調整
        controls.minDistance = 15;
        controls.maxDistance = 600;
    }
    
    // タッチイベントの調整
    if ('ontouchstart' in window) {
        controls.rotateSpeed = 0.5;  // 回転速度を遅く
        controls.zoomSpeed = 0.7;    // ズーム速度も遅く
    }
}


// 2. 3点照明システムの実装
// setupLighting関数を修正
function setupLighting() {
    // 環境光を強化（0.15 → 0.3）
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    
    // 半球光も強化（0.25 → 0.4）
    const hemisphereLight = new THREE.HemisphereLight(0x6677ff, 0x080820, 0.4);
    scene.add(hemisphereLight);
    
    // 追加：全体的な方向光（太陽からの光を補完）
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight.position.set(1, 0.5, 1).normalize();
    scene.add(directionalLight);
  }

// テクスチャローダーとローディングマネージャーのセットアップ
function setupLoadingManager() {
  loadingManager = new THREE.LoadingManager();
  
  loadingManager.onProgress = function(url, itemsLoaded, itemsTotal) {
    const progress = (itemsLoaded / itemsTotal * 100).toFixed(0);
    loadingBar.style.width = progress + '%';
    loadingText.textContent = progress + '%';
  };
  
  loadingManager.onLoad = function() {
    fadeOut(loadingContainer, 1000);
  };
  
  textureLoader = new THREE.TextureLoader(loadingManager);
}

// ポストプロセッシングのセットアップ
// setupPostProcessing関数を簡略化
function setupPostProcessing() {
    // 基本的なレンダーパス
    const renderPass = new THREE.RenderPass(scene, camera);
    
    // ブルームエフェクト（単純化）
    const bloomPass = new THREE.UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.8,    // 強度
      0.3,    // 半径
      0.6     // 閾値
    );
    
    // エフェクトコンポーザーの作成
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    
    // 太陽をブルームレイヤーに設定する処理は一時的に削除
  }
  

// 星空の背景を追加

function addStarBackground() {
    // HDRIテクスチャを使った背景の設定（ファイルがある場合）
    try {
      const loader = new THREE.TextureLoader();
      loader.load('textures/starfield_8k.jpg', (texture) => {
        texture.encoding = THREE.sRGBEncoding;
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;
        scene.environment = texture;  // PBRマテリアルの環境マップにも使用
      });
      
      // HDRIローダーの場合（.hdrファイル使用時）
      /*
      const hdrLoader = new THREE.RGBELoader();
      hdrLoader.load('textures/starfield.hdr', (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;
        scene.environment = texture;
      });
      */
    } catch (e) {
      console.warn('HDRIテクスチャの読み込みに失敗しました。パーティクルの星空を使用します:', e);
      
      // フォールバック：パーティクルで星を表現
      const starsGeometry = new THREE.BufferGeometry();
      const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.1,
        transparent: true
      });
      
      const starsVertices = [];
      for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starsVertices.push(x, y, z);
      }
      
      starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
      const starField = new THREE.Points(starsGeometry, starsMaterial);
      scene.add(starField);
    }
  }

// 太陽を作成

function createSun() {
    // 太陽のジオメトリ
    const sunGeometry = new THREE.SphereGeometry(CONSTANTS.SUN_SIZE * 1.2, 64, 64);
    
    try {
      // テクスチャをロード
      const sunTexture = textureLoader.load(CONSTANTS.TEXTURE_PATH + 'sun.jpg');
      sunTexture.encoding = THREE.sRGBEncoding;
      
      const sunMaterial = new THREE.MeshBasicMaterial({
        map: sunTexture,
        emissive: CONSTANTS.COLORS.SUN,
        emissiveIntensity: 1.0
      });
      sun = new THREE.Mesh(sunGeometry, sunMaterial);
    } catch (e) {
      console.warn('太陽テクスチャのロードに失敗しました。単色で表示します:', e);
      // テクスチャがない場合は単色で
      const sunMaterial = new THREE.MeshBasicMaterial({
        color: 0xffdd00,
        emissive: 0xffdd00,
        emissiveIntensity: 1.0
      });
      sun = new THREE.Mesh(sunGeometry, sunMaterial);
    }
    
    scene.add(sun);
    console.log("太陽をシーンに追加しました", sun);
    
    // 太陽光源
    const sunLight = new THREE.PointLight(0xffffff, 2.0, 1000);
    sun.add(sunLight);
  }

// 惑星の初期位置をより分散させる
function createPlanets() {
    PLANET_DATA.forEach((planetData, index) => {
      // 惑星のグループ作成（公転用）
      const planetGroup = new THREE.Group();
      scene.add(planetGroup);
      planets.push(planetGroup);
      
      // 惑星のサイズと距離をスケーリング
      const planetSize = getScaledPlanetSize(planetData.size, isRealisticScale, sizeScale);
      const orbitRadius = getScaledDistance(planetData.distance, isRealisticScale, distanceScale);
      
      // 軌道の作成
      createOrbit(planetData, orbitRadius, index);
      
      // 惑星のマテリアルの作成
      const planetMaterial = createPlanetMaterial(planetData);
      
      // 惑星のジオメトリとメッシュの作成
      const planetGeometry = new THREE.SphereGeometry(planetSize, 48, 48);  // 32から48に増加
      const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);


        // 惑星を作成する関数内に以下を追加（planetMesh作成後）
        planetMesh.layers.disable(1);  // ブルームレイヤー(1)から除外

        // 惑星の作成後、各軌道をブルームレイヤーから除外
        orbitLines.forEach(orbit => {
            orbit.layers.disable(1);
        });

    // // 地球の場合、特別なエフェクトを追加
    // if (planetData.id === 'earth') {
    //     addEarthAtmosphere(planetMesh);
    //     addEarthClouds(planetMesh);
    //   }

      // 初期角度を均等に分散させる（衝突を避けるため）
      const initialAngle = (index / PLANET_DATA.length) * Math.PI * 2;
      
      // 惑星にデータをアタッチ
      planetMesh.userData = {
        planetData: planetData,
        orbitRadius: orbitRadius,
        orbitSpeed: calculateOrbitalSpeed(
          planetData.distance,
          planetData.orbitSpeed * CONSTANTS.ORBIT_SPEED_SCALE
        ),
        rotationSpeed: planetData.rotationSpeed,
        orbitAngle: initialAngle // 均等に分散した初期角度
      };
      planetGroup.add(planetMesh);
      planetMeshes.push(planetMesh);
      
      // 惑星の初期位置を設定
      updatePlanetPosition(planetGroup, planetMesh, 0);
      
      // 惑星の名前ラベルを作成
      createPlanetLabel(planetData, planetMesh);
      
      // リングがある場合（土星など）
      if (planetData.rings) {
        addRingsToplanet(planetData, planetMesh);
      }
      
      // 月がある場合
      if (planetData.moons && planetData.moons.length > 0) {
        addMoonsToPlanet(planetData, planetMesh, planetGroup);
      }
    });
  }

// 惑星のマテリアルを作成

function createPlanetMaterial(planetData) {
    if (planetData.textures && planetData.textures.map) {
      try {
        const diffuseMap = textureLoader.load(CONSTANTS.TEXTURE_PATH + planetData.textures.map);
        diffuseMap.encoding = THREE.sRGBEncoding;
        
        if (planetData.textures.bumpMap) {
          try {
            const bumpMap = textureLoader.load(CONSTANTS.TEXTURE_PATH + planetData.textures.bumpMap);
            return new THREE.MeshStandardMaterial({
              map: diffuseMap,
              bumpMap: bumpMap,
              bumpScale: 0.02,
              metalness: 0.0,
              roughness: 0.7,  // 0.8から0.7に減少（少し光沢を増す）
              emissive: 0x111111  // 微妙な発光を追加
            });
          } catch (e) {
            console.warn(`バンプマップ ${planetData.textures.bumpMap} のロードに失敗しました: `, e);
            return new THREE.MeshStandardMaterial({
              map: diffuseMap,
              metalness: 0.0,
              roughness: 0.7,
              emissive: 0x111111
            });
          }
        }
        
        return new THREE.MeshStandardMaterial({
          map: diffuseMap,
          metalness: 0.0,
          roughness: 0.7,
          emissive: 0x111111
        });
      } catch (e) {
        console.warn(`テクスチャ ${planetData.textures.map} のロードに失敗しました: `, e);
      }
    }
    
    // テクスチャがない場合は色を明るくする
    return new THREE.MeshStandardMaterial({
      color: planetData.color,
      metalness: 0.0,
      roughness: 0.9,
      emissive: 0x111111
    });
  }

// 惑星の軌道を作成
function createOrbit(planetData, orbitRadius, index) {
    // 軌道点の配列を生成
    const segments = CONSTANTS.ORBIT_LINE_SEGMENTS; // 軌道の分割数
    const orbitPoints = [];
    
    // 軌道の各点を計算（楕円軌道を考慮）
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2; // 0から2πまでの角度
        
        // 軌道パラメータを使用して位置を計算
        const position = calculateOrbitPosition(
            planetData.orbitParams,
            orbitRadius,
            theta
        );
        
        // 点の座標を配列に追加
        orbitPoints.push(position.x, position.y, position.z);
    }
    
    // 軌道ラインのジオメトリとマテリアルを作成
    const orbitGeometry = new THREE.BufferGeometry();
    orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(orbitPoints, 3));
    
    const orbitMaterial = new THREE.LineBasicMaterial({
      color: CONSTANTS.COLORS.ORBIT,
      transparent: true,
      opacity: 0.3
    });
    
    const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
    
    // ブルームレイヤーから除外（この行を追加）
    orbit.layers.disable(1);
    
    scene.add(orbit);
    orbitLines.push(orbit);
}
  
// 惑星の名前ラベルを作成
function createPlanetLabel(planetData, planetMesh) {
  const planetLabel = document.createElement('div');
  planetLabel.className = 'planet-label';
  planetLabel.textContent = planetData.jpName;
  document.body.appendChild(planetLabel);
  
  labels.push({
    element: planetLabel,
    mesh: planetMesh
  });
}


// addRingsToplanet関数を修正
function addRingsToplanet(planetData, planetMesh) {
    // 惑星が土星かどうかチェック
    if (planetData.id === 'saturn') {
      // 土星の輪のサイズを調整
      const planetRadius = planetMesh.geometry.parameters.radius;
      const innerRadius = planetRadius * 1.2;
      const outerRadius = planetRadius * 2.5;
      
      // 輪のジオメトリを作成
      const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
      
      // UVマッピング調整
      const pos = ringGeometry.attributes.position;
      const v3 = new THREE.Vector3();
      const uv = [];
      
      for (let i = 0; i < pos.count; i++) {
        v3.fromBufferAttribute(pos, i);
        const radius = Math.sqrt(v3.x * v3.x + v3.z * v3.z);
        const u = ((radius - innerRadius) / (outerRadius - innerRadius));
        uv.push(u, (i % 2) ? 0 : 1);
      }
      
      ringGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      
      // 修正した関数を呼び出す
      createSaturnRing(ringGeometry, planetMesh, planetData);
    }
    
    // 天王星の輪も同様に
    else if (planetData.id === 'uranus') {
      const planetRadius = planetMesh.geometry.parameters.radius;
      const innerRadius = planetRadius * 1.4;
      const outerRadius = planetRadius * 2.0;
      
      const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
      
      // UVマッピング
      const pos = ringGeometry.attributes.position;
      const v3 = new THREE.Vector3();
      const uv = [];
      
      for (let i = 0; i < pos.count; i++) {
        v3.fromBufferAttribute(pos, i);
        const radius = Math.sqrt(v3.x * v3.x + v3.z * v3.z);
        const u = ((radius - innerRadius) / (outerRadius - innerRadius));
        uv.push(u, (i % 2) ? 0 : 1);
      }
      
      ringGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      
      // 修正した関数を呼び出す
      createUranusRing(ringGeometry, planetMesh, planetData);
    }
  }
  
// 既存の関数を活用してテクスチャを適用する修正

// 土星用の専用リング作成関数を修正
function createSaturnRing(geometry, planetMesh, planetData) {
  // テクスチャの読み込みを試みる
  if (planetData.textures && planetData.textures.ringsMap) {
    try {
      // テクスチャをロード
      const ringTexture = textureLoader.load(
        CONSTANTS.TEXTURE_PATH + planetData.textures.ringsMap,
        // 成功時のコールバック
        function(texture) {
          console.log("土星の輪テクスチャを正常にロードしました");
          texture.encoding = THREE.sRGBEncoding;
          
          // テクスチャを使用したマテリアル
          const ringMaterial = new THREE.MeshStandardMaterial({
            map: texture,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide,
            metalness: 0.2,
            roughness: 0.7
          });
          
          const ring = new THREE.Mesh(geometry, ringMaterial);
          ring.rotation.x = Math.PI / 2;
          planetMesh.add(ring);
        },
        // 進行中のコールバック
        undefined,
        // エラー時のコールバック
        function(error) {
          console.error("土星の輪テクスチャのロードに失敗しました:", error);
          createDefaultSaturnRing(geometry, planetMesh);
        }
      );
    } catch (e) {
      console.error("土星の輪テクスチャの処理中にエラーが発生しました:", e);
      createDefaultSaturnRing(geometry, planetMesh);
    }
  } else {
    console.log("土星の輪テクスチャが指定されていません。デフォルトリングを使用します。");
    createDefaultSaturnRing(geometry, planetMesh);
  }
}

  
// デフォルトの土星リング（テクスチャなし）- 改良版
function createDefaultSaturnRing(geometry, planetMesh) {
  console.log("デフォルトの土星リングを作成します");
  
  // 複数のリングを作成
  const ringColors = [
    0xf0e2c9, // 明るいベージュ
    0xe6d2b5, // 少し暗いベージュ
    0xd9c4a0, // さらに暗いベージュ
    0xccb68c  // 最も暗いベージュ
  ];
  
  const planetRadius = planetMesh.geometry.parameters.radius;
  const ringSpacing = planetRadius * 0.25; // リング間の間隔
  
  ringColors.forEach((color, index) => {
    const innerRadius = planetRadius * 1.2 + index * ringSpacing;
    const outerRadius = innerRadius + ringSpacing * 0.8;
    
    const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
    
    // UVマッピング調整
    const pos = ringGeometry.attributes.position;
    const v3 = new THREE.Vector3();
    const uv = [];
    
    for (let i = 0; i < pos.count; i++) {
      v3.fromBufferAttribute(pos, i);
      const radius = Math.sqrt(v3.x * v3.x + v3.z * v3.z);
      const u = ((radius - innerRadius) / (outerRadius - innerRadius));
      uv.push(u, (i % 2) ? 0 : 1);
    }
    
    ringGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    
    // リングのマテリアル
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: color,
      transparent: true,
      opacity: 0.7 + index * 0.05, // リングごとに不透明度を変える
      side: THREE.DoubleSide,
      metalness: 0.2,
      roughness: 0.8 - index * 0.1 // リングごとに粗さを変える
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    planetMesh.add(ring);
  });
}
  // 天王星用の専用リング作成関数を修正
  function createUranusRing(geometry, planetMesh, planetData) {
    // テクスチャの読み込みを試みる
    if (planetData.textures && planetData.textures.ringsMap) {
      try {
        // テクスチャをロード
        const ringTexture = textureLoader.load(CONSTANTS.TEXTURE_PATH + planetData.textures.ringsMap);
        ringTexture.encoding = THREE.sRGBEncoding;
        
        // テクスチャを使用したマテリアル
        const ringMaterial = new THREE.MeshStandardMaterial({
          map: ringTexture,
          transparent: true,
          opacity: 0.7,
          side: THREE.DoubleSide,
          metalness: 0.1,
          roughness: 0.7
        });
        
        const ring = new THREE.Mesh(geometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        planetMesh.add(ring);
        
        console.log("天王星の輪テクスチャを適用しました:", planetData.textures.ringsMap);
      } catch (e) {
        console.warn("天王星の輪テクスチャの読み込みに失敗しました:", e);
        // 失敗した場合はデフォルトの単色マテリアル
        createDefaultUranusRing(geometry, planetMesh);
      }
    } else {
      // テクスチャが指定されていない場合はデフォルトを使用
      createDefaultUranusRing(geometry, planetMesh);
    }
  }
  
  // デフォルトの天王星リング（テクスチャなし）
  function createDefaultUranusRing(geometry, planetMesh) {
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0xa6d9e3,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      metalness: 0.1,
      roughness: 0.7
    });
    
    const ring = new THREE.Mesh(geometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    planetMesh.add(ring);
  }

// 惑星に月を追加
function addMoonsToPlanet(planetData, planetMesh, planetGroup) {
  planetData.moons.forEach(moon => {
    // 月のグループ（公転用）
    const moonGroup = new THREE.Group();
    planetGroup.add(moonGroup);
    
    // 月のサイズを計算
    const moonSize = moon.size * planetMesh.geometry.parameters.radius;
    
    // 月の距離を計算
    const moonDistance = moon.distance * CONSTANTS.DISTANCE_SCALE * distanceScale;
    
    // 月のジオメトリとマテリアルを作成
    const moonGeometry = new THREE.SphereGeometry(moonSize, 16, 16);
    let moonMaterial;
    
    // 月のテクスチャがある場合
    if (moon.textures && moon.textures.map) {
      try {
        const moonTexture = textureLoader.load(CONSTANTS.TEXTURE_PATH + moon.textures.map);
        moonMaterial = new THREE.MeshStandardMaterial({ map: moonTexture });
      } catch (e) {
        moonMaterial = new THREE.MeshStandardMaterial({ color: moon.color });
      }
    } else {
      moonMaterial = new THREE.MeshStandardMaterial({ color: moon.color });
    }
    
    const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
    moonMesh.position.x = moonDistance;
    moonGroup.add(moonMesh);
    
    // 月のデータをアタッチ
    moonMesh.userData = {
      orbitSpeed: moon.orbitSpeed,
      orbitAngle: Math.random() * Math.PI * 2
    };
  });
}


// 惑星の更新関数を修正（main.jsの該当関数を置き換える）
function updatePlanetPosition(planetGroup, planetMesh, deltaTime) {
    const planetData = planetMesh.userData;
    
    // 最大値を設定して数値がNaNになるのを防ぐ
    const maxDeltaTime = Math.min(deltaTime, 1.0 / 30.0);
    
    // 公転角度を更新（公転速度にはspeedScaleを適用）
    planetData.orbitAngle += planetData.orbitSpeed * speedScale * maxDeltaTime;
    
    // 角度が2πを超えたら0に戻す
    if (planetData.orbitAngle > Math.PI * 2) {
      planetData.orbitAngle -= Math.PI * 2;
    }
    
    // 楕円軌道上の位置を計算
    const orbitPosition = calculateOrbitPosition(
      planetData.planetData.orbitParams,
      planetData.orbitRadius,
      planetData.orbitAngle
    );
    
    // 惑星グループの位置を更新
    const x = isNaN(orbitPosition.x) ? 0 : orbitPosition.x;
    const y = isNaN(orbitPosition.y) ? 0 : orbitPosition.y;
    const z = isNaN(orbitPosition.z) ? 0 : orbitPosition.z;
    
    planetGroup.position.set(x, y, z);
    
    // 惑星の自転を更新（自転にはrotationScaleを適用し、speedScaleとは独立）
    planetMesh.rotation.y += planetData.rotationSpeed * rotationScale * maxDeltaTime;
  }

// 惑星情報パネルを表示
function showPlanetInfo(planetMesh) {
  const planetData = planetMesh.userData.planetData;
  
  // パネルの情報を更新
  document.getElementById('planet-name').textContent = planetData.name;
  document.getElementById('planet-type').textContent = '種類: ' + planetData.type;
  document.getElementById('planet-distance').textContent = '太陽からの距離: ' + planetData.distance + ' AU (約' + (planetData.distance * 149.6).toFixed(1) + '百万km)';
  document.getElementById('planet-year').textContent = '公転周期: ' + planetData.year;
  document.getElementById('planet-day').textContent = '自転周期: ' + planetData.day;
  document.getElementById('planet-diameter').textContent = '直径: ' + planetData.diameter;
  document.getElementById('planet-facts').textContent = '豆知識: ' + planetData.facts;
  
  // 惑星画像を設定（あれば）
  const planetImage = document.getElementById('planet-image');
  if (planetData.textures && planetData.textures.map) {
    planetImage.style.backgroundImage = `url(${CONSTANTS.TEXTURE_PATH + planetData.textures.map})`;
    planetImage.style.display = 'block';
  } else {
    planetImage.style.display = 'none';
  }
  
  // パネルを表示
  infoPanel.classList.remove('hidden');
  infoPanel.classList.add('visible');
}

// 惑星情報パネルを非表示
function hidePlanetInfo() {
  infoPanel.classList.remove('visible');
  infoPanel.classList.add('hidden');
}

// ラベルの位置を更新
function updateLabels() {
  labels.forEach(({ element, mesh }) => {
    if (!mesh.parent) return;
    
    // メッシュの世界座標を取得
    const worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);
    
    // 世界座標からスクリーン座標に変換
    const screenPos = worldToScreen(worldPos, camera, window.innerWidth, window.innerHeight);
    
    // 画面内に表示されている場合のみラベルを表示
    if (screenPos.visible && showLabels) {
      element.style.display = 'block';
      element.style.transform = `translate(-50%, -50%) translate(${screenPos.x}px, ${screenPos.y}px)`;
      
      // 距離に応じて不透明度を調整（遠いほど透明に）
      const distance = camera.position.distanceTo(worldPos);
      const opacity = Math.max(0.2, Math.min(1, 50 / distance));
      element.style.opacity = opacity;
    } else {
      element.style.display = 'none';
    }
  });
}

// setupUI関数を修正（既存のsetupUI関数の内部に追加）
function setupUI() {
    // 既存のコード...
    
    // 軌道表示切り替え
    showOrbitsCheckbox.addEventListener('change', function() {
      showOrbits = this.checked;
      orbitLines.forEach(orbit => {
        orbit.visible = showOrbits;
      });
    });
    
    // ラベル表示切り替え
    showLabelsCheckbox.addEventListener('change', function() {
      showLabels = this.checked;
      labels.forEach(({ element }) => {
        element.style.display = showLabels ? 'block' : 'none';
      });
    });
    
    // 現実的なスケール切り替え
    realScaleCheckbox.addEventListener('change', function() {
      isRealisticScale = this.checked;
      rebuildScene();
    });
    
    // サイズスケールスライダー
    scaleSlider.addEventListener('input', function() {
      sizeScale = parseFloat(this.value);
      scaleValue.textContent = sizeScale.toFixed(1);
      rebuildScene();
    });
    
    // 距離スケールスライダー
    distanceSlider.addEventListener('input', function() {
      distanceScale = parseFloat(this.value);
      distanceValue.textContent = distanceScale.toFixed(1);
      rebuildScene();
    });
    
    // 速度スケールスライダー
    speedSlider.addEventListener('input', function() {
      speedScale = parseFloat(this.value);
      speedValue.textContent = speedScale.toFixed(1);
    });
    
    // // ここから追加：自転速度スライダーをコントロールパネルに追加
    // const controlsPanel = document.getElementById('controls-panel');
    
    // // HTMLを挿入
    // const tempDiv = document.createElement('div');
    // tempDiv.innerHTML = rotationSliderHTML;
    // controlsPanel.appendChild(tempDiv.firstElementChild);
    
    // 自転速度スライダーへの参照を取得
    const rotationSlider = document.getElementById('rotation-slider');
    const rotationValue = document.getElementById('rotation-value');
    
    // 自転速度スライダーのイベントリスナーを追加
    rotationSlider.addEventListener('input', function() {
      rotationScale = parseFloat(this.value);
      rotationValue.textContent = rotationScale.toFixed(1);
    });
    
    // 閉じるボタン
    document.getElementById('close-panel').addEventListener('click', function() {
      hidePlanetInfo();
      selectedPlanet = null;
    });
    
    // 惑星選択（クリック検出）
    renderer.domElement.addEventListener('click', onPlanetClick);
    
    // 惑星にダブルクリックしたときのカメラ移動
    renderer.domElement.addEventListener('dblclick', onPlanetDoubleClick);
  }
  
  // 惑星ツアーを開始する関数を修正
  function startPlanetaryTour() {
    if (isTourActive) return;
    
    isTourActive = true;
    currentTourPlanet = 0;
    
    // 現在の速度を保存して、公転速度を遅くする
    originalSpeedScale = speedScale;
    speedScale = speedScale * 0.1; // 公転速度を90%遅くする
    speedSlider.value = speedScale;
    speedValue.textContent = speedScale.toFixed(1);
    
    // 自転速度を増加
    const rotationSlider = document.getElementById('rotation-slider');
    const rotationValueSpan = document.getElementById('rotation-value');
    
    // 前の自転速度を保存
    originalRotationScale = rotationScale;
    
    // 自転速度を10倍に設定
    rotationScale = 10.0; 
    rotationSlider.value = rotationScale.toString();
    rotationValueSpan.textContent = rotationScale.toFixed(1);
    
    // ツアーコントロールを表示
    createTourControls();
    
    // 最初の惑星にフォーカス
    visitCurrentPlanet();
  }

// 惑星のクリック検出
function onPlanetClick(event) {
  event.preventDefault();
  
  // マウス位置をノーマライズ
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  // レイキャスト
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  
  // 惑星との交差を検出
  const intersects = raycaster.intersectObjects(planetMeshes);
  
  if (intersects.length > 0) {
    const planetMesh = intersects[0].object;
    selectedPlanet = planetMesh;
    showPlanetInfo(planetMesh);
  } else {
    // 何もクリックされなかった場合
    selectedPlanet = null;
    hidePlanetInfo();
  }
}

// 惑星にダブルクリックしたときのカメラ移動
function onPlanetDoubleClick(event) {
  event.preventDefault();
  
  // マウス位置をノーマライズ
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  // レイキャスト
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  
  // 惑星との交差を検出
  const intersects = raycaster.intersectObjects(planetMeshes);
  
  if (intersects.length > 0) {
    const planetMesh = intersects[0].object;
    // カメラの注視点を惑星に設定
    const planetPosition = new THREE.Vector3();
    planetMesh.getWorldPosition(planetPosition);
    
    // OrbitControlsのターゲットを惑星の位置に設定
    controls.target.copy(planetPosition);
    
    // 少し離れた位置にカメラを配置
    const planetRadius = planetMesh.geometry.parameters.radius;
    const distanceFactor = 10;
    
    // カメラの現在方向を維持しながら、惑星からの距離を調整
    const direction = camera.position.clone().sub(controls.target).normalize();
    camera.position.copy(planetPosition).add(direction.multiplyScalar(planetRadius * distanceFactor));
    
    controls.update();
  }
}


// ウィンドウリサイズ時の処理（composerの存在チェック）
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  
  if (composer) {
    composer.setSize(window.innerWidth, window.innerHeight);
  }
  
  // ウィンドウサイズに応じてUIの位置を調整
  adjustUIForScreenSize();
}


// 画面サイズに応じてUIを調整する関数
function adjustUIForScreenSize() {
    const controlsPanel = document.getElementById('controls-panel');
    const title = document.getElementById('title');
    const instructions = document.getElementById('instructions');
    
    if (window.innerWidth < 768) {
      // モバイル表示
      controlsPanel.style.left = '10px';
      controlsPanel.style.top = '60px';
      controlsPanel.style.width = 'calc(100% - 20px)';
      controlsPanel.style.maxWidth = '280px';
      
      title.style.fontSize = '20px';
      instructions.style.fontSize = '12px';
    } else {
      // デスクトップ表示
      controlsPanel.style.left = '20px';
      controlsPanel.style.top = '70px';
      controlsPanel.style.width = '250px';
      
      title.style.fontSize = '28px';
      instructions.style.fontSize = '14px';
    }
  }
  

// シーンを再構築（スケール変更時）
function rebuildScene() {
  // 既存の惑星と軌道を削除
  planets.forEach(planet => {
    scene.remove(planet);
  });
  
  orbitLines.forEach(orbit => {
    scene.remove(orbit);
  });
  
  labels.forEach(({ element }) => {
    document.body.removeChild(element);
  });
  
  planets = [];
  planetMeshes = [];
  orbitLines = [];
  labels = [];
  
  // 惑星を再作成
  createPlanets();
}

// アニメーションループ
function animate() {
  requestAnimationFrame(animate);
  
  const deltaTime = clock.getDelta();
  
  // 惑星の更新
  planets.forEach((planetGroup, index) => {
    const planetMesh = planetMeshes[index];
    if (planetMesh) {
      updatePlanetPosition(planetGroup, planetMesh, deltaTime);
    }
  });
  
  // 太陽の自転
  sun.rotation.y += 0.002 * speedScale * deltaTime;
  
  // ラベルの更新
  updateLabels();
  
  // コントロールの更新
  controls.update();
  
  // ポストプロセッシングでレンダリング
  composer.render();
}

// // +α機能：サンフレア効果
// function addSunFlare() {
//     // サンフレア用のテクスチャ
//     const textureLoader = new THREE.TextureLoader();
//     const flareTexture = textureLoader.load('textures/lensflare0.png');
    
//     // スプライトマテリアル作成
//     const flareMaterial = new THREE.SpriteMaterial({
//       map: flareTexture,
//       color: 0xffee66,
//       transparent: true,
//       blending: THREE.AdditiveBlending
//     });
    
//     // スプライト作成
//     const flareSprite = new THREE.Sprite(flareMaterial);
//     flareSprite.scale.set(CONSTANTS.SUN_SIZE * 3, CONSTANTS.SUN_SIZE * 3, 1);
    
//     // 太陽に追加
//     sun.add(flareSprite);
//   }
  
//   // +α機能：地球の大気効果
//   function addEarthAtmosphere(earthMesh) {
//     // 大気のジオメトリ（地球より少し大きく）
//     const atmosphereGeometry = new THREE.SphereGeometry(
//       earthMesh.geometry.parameters.radius * 1.03,
//       32, 32
//     );
    
//     // 大気用のシェーダーマテリアル
//     const atmosphereMaterial = new THREE.ShaderMaterial({
//       uniforms: {
//         "c": { value: 0.2 },
//         "p": { value: 4.0 },
//         glowColor: { value: new THREE.Color(0x3399ff) },
//         viewVector: { value: camera.position }
//       },
//       vertexShader: `
//         uniform vec3 viewVector;
//         uniform float c;
//         uniform float p;
//         varying float intensity;
//         void main() {
//           vec3 vNormal = normalize(normalMatrix * normal);
//           vec3 vNormel = normalize(normalMatrix * viewVector);
//           intensity = pow(c - dot(vNormal, vNormel), p);
//           gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
//         }
//       `,
//       fragmentShader: `
//         uniform vec3 glowColor;
//         varying float intensity;
//         void main() {
//           vec3 glow = glowColor * intensity;
//           gl_FragColor = vec4(glow, 0.6);
//         }
//       `,
//       side: THREE.BackSide,
//       blending: THREE.AdditiveBlending,
//       transparent: true
//     });
    
//     // 大気メッシュ作成
//     const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
//     earthMesh.add(atmosphere);
//   }
  
  // +α機能：地球の雲レイヤー
  function addEarthClouds(earthMesh) {
    if (!earthMesh) return;
    
    try {
      // 雲テクスチャを読み込み
      const cloudsTexture = textureLoader.load('textures/earth_clouds.png');
      cloudsTexture.encoding = THREE.sRGBEncoding;
      
      // 雲のマテリアル
      const cloudsMaterial = new THREE.MeshStandardMaterial({
        map: cloudsTexture,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      
      // 雲のジオメトリ（地球より少し大きく）
      const cloudsGeometry = new THREE.SphereGeometry(
        earthMesh.geometry.parameters.radius * 1.01, 
        32, 32
      );
      
      // 雲メッシュ作成
      const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
      clouds.name = 'earthClouds';
      
      // ブルームレイヤーから除外
      clouds.layers.disable(1);
      
      // 地球メッシュに追加
      earthMesh.add(clouds);
      
      // アニメーション関数に雲の回転アニメーションを追加
      // 以下は animate 関数内で各フレーム毎に呼び出す処理
      /*
      const earthClouds = scene.getObjectByName('earthClouds');
      if (earthClouds) {
        earthClouds.rotation.y += 0.0005 * speedScale * deltaTime; // 雲をゆっくり回転
      }
      */
    } catch (e) {
      console.warn('雲テクスチャのロードに失敗しました:', e);
    }
  }
  
  // +α機能：軌道面グリッド
  function addOrbitalGrid() {
    // グリッドヘルパーの作成
    const gridSize = CONSTANTS.DISTANCE_SCALE * 35; // 最も遠い惑星の軌道より大きく
    const gridHelper = new THREE.GridHelper(gridSize, 20, 0x666666, 0x222222);
    
    // グリッドを回転して水平にする
    gridHelper.rotation.x = Math.PI / 2;
    
    // 透明度の設定
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.2;
    
    // ブルームから除外
    gridHelper.layers.disable(1);
    
    scene.add(gridHelper);
  }
  

// 惑星ツアーを開始する関数を修正
function startPlanetaryTour() {
    if (isTourActive) return;
    
    // まず回転コントロールを追加（まだなければ）
    addRotationControls();
    
    isTourActive = true;
    currentTourPlanet = 0;
    
    // 現在の速度を保存して、公転速度を遅くする
    originalSpeedScale = speedScale;
    speedScale = speedScale * 0.1; // 公転速度を90%遅くする
    speedSlider.value = speedScale;
    speedValue.textContent = speedScale.toFixed(1);
    
    // 自転速度を増加（スライダーが存在する場合のみ）
    const rotationSlider = document.getElementById('rotation-slider');
    const rotationValueSpan = document.getElementById('rotation-value');
    
    if (rotationSlider) {
      rotationScale = 10.0; // 自転速度を10倍に
      rotationSlider.value = rotationScale.toString();
    }
    
    if (rotationValueSpan) {
      rotationValueSpan.textContent = rotationScale.toFixed(1);
    }
    
    // ツアーコントロールを表示
    createTourControls();
    
    // 最初の惑星にフォーカス
    visitCurrentPlanet();
  }

// 現在の惑星を表示
function visitCurrentPlanet() {
    if (!isTourActive || currentTourPlanet === null) return;
    
    const planetMesh = planetMeshes[currentTourPlanet];
    if (!planetMesh) return;
    
    // 惑星情報を表示
    showPlanetInfo(planetMesh);
    
    // 惑星を追従するように設定
    startFollowingPlanet(planetMesh);
  }
  
  // 次の惑星に移動
  function visitNextPlanet() {
    if (!isTourActive) return;
    
    // 次の惑星に移動
    currentTourPlanet++;
    if (currentTourPlanet >= planetMeshes.length) {
      currentTourPlanet = 0;
    }
    
    visitCurrentPlanet();
  }
  
  // 前の惑星に移動
  function visitPreviousPlanet() {
    if (!isTourActive) return;
    
    // 前の惑星に移動
    currentTourPlanet--;
    if (currentTourPlanet < 0) {
      currentTourPlanet = planetMeshes.length - 1;
    }
    
    visitCurrentPlanet();
  }


    // 現在の惑星追従ID
    let followingIntervalId = null;

    // 惑星の追従を開始
    function startFollowingPlanet(planetMesh) {
    // 前の追従をクリア
    stopFollowingPlanet();
    
    // 惑星の世界座標を取得
    const planetPosition = new THREE.Vector3();
    planetMesh.getWorldPosition(planetPosition);
    
    // 惑星からの距離を計算
    const planetRadius = planetMesh.geometry.parameters.radius;
    const distance = planetRadius * 15;
    
    // カメラの初期位置を設定
    const cameraOffset = new THREE.Vector3(distance, distance/2, distance);
    camera.position.copy(planetPosition).add(cameraOffset);
    controls.target.copy(planetPosition);
    controls.update();
    
    // 定期的に惑星を追従
    followingIntervalId = setInterval(() => {
        if (!isTourActive) {
        stopFollowingPlanet();
        return;
        }
        
        // 惑星の最新位置を取得
        planetMesh.getWorldPosition(planetPosition);
        
        // 惑星との相対位置を維持
        camera.position.copy(planetPosition).add(cameraOffset);
        controls.target.copy(planetPosition);
        controls.update();
    }, 16); // 約60FPS
    }
    // 惑星の追従を停止
    function stopFollowingPlanet() {
        if (followingIntervalId) {
        clearInterval(followingIntervalId);
        followingIntervalId = null;
        }
    }
  
// endPlanetaryTour関数を修正
function endPlanetaryTour() {
  if (!isTourActive) return;
  
  isTourActive = false;
  currentTourPlanet = null;
  
  // 公転速度を元に戻す
  speedScale = originalSpeedScale;
  speedSlider.value = speedScale;
  speedValue.textContent = speedScale.toFixed(1);
  
  // 自転速度を元に戻す
  const rotationSlider = document.getElementById('rotation-slider');
  const rotationValueSpan = document.getElementById('rotation-value');
  
  rotationScale = originalRotationScale; // 元の自転速度に戻す
  
  if (rotationSlider) {
      rotationSlider.value = rotationScale.toString();
  }
  
  if (rotationValueSpan) {
      rotationValueSpan.textContent = rotationScale.toFixed(1);
  }
  
  // パネルを閉じる
  hidePlanetInfo();
  
  // ツアーコントロールを削除
  const existingTourControls = document.getElementById('tour-controls');
  if (existingTourControls) {
      existingTourControls.remove(); // 確実に削除
  }
  
  tourControls = null;
  
  // 追従を停止
  stopFollowingPlanet();
}
  
  
// 新しいツアーボタンを追加
function addTourButton() {
    const tourButton = document.createElement('button');
    tourButton.id = 'tour-button';
    tourButton.textContent = '惑星ツアー開始';
    tourButton.style.position = 'absolute';
    tourButton.style.bottom = '60px';
    tourButton.style.right = '20px';
    tourButton.style.padding = '10px 15px';
    tourButton.style.backgroundColor = '#1565c0';
    tourButton.style.color = 'white';
    tourButton.style.border = 'none';
    tourButton.style.borderRadius = '5px';
    tourButton.style.cursor = 'pointer';
    tourButton.style.zIndex = '100';
    tourButton.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
    
    tourButton.addEventListener('click', startPlanetaryTour);
    
    document.body.appendChild(tourButton);
  }
  

// ツアーコントロール用のUIを作成
function createTourControls() {
  // すでに存在する場合は削除
  const existingTourControls = document.getElementById('tour-controls');
  if (existingTourControls) {
      existingTourControls.remove();
  }

  // ツアーコントロールパネルを作成
  tourControls = document.createElement('div');
  tourControls.id = 'tour-controls'; // 明示的にIDを設定
  
    // ツアーコントロールパネルを作成
    tourControls = document.createElement('div');
    tourControls.id = 'tour-controls';
    tourControls.style.position = 'absolute';
    tourControls.style.bottom = '20px';
    tourControls.style.left = '50%';
    tourControls.style.transform = 'translateX(-50%)';
    tourControls.style.backgroundColor = 'rgba(10, 10, 20, 0.8)';
    tourControls.style.padding = '10px 15px';
    tourControls.style.borderRadius = '8px';
    tourControls.style.display = 'flex';
    tourControls.style.gap = '10px';
    tourControls.style.zIndex = '100';
    tourControls.style.boxShadow = '0 0 20px rgba(0, 150, 255, 0.4)';
  
    // 前の惑星ボタン
    const prevButton = document.createElement('button');
    prevButton.textContent = '前の惑星';
    prevButton.style.padding = '8px 15px';
    prevButton.style.backgroundColor = '#1565c0';
    prevButton.style.color = 'white';
    prevButton.style.border = 'none';
    prevButton.style.borderRadius = '5px';
    prevButton.style.cursor = 'pointer';
    prevButton.addEventListener('click', visitPreviousPlanet);
    tourControls.appendChild(prevButton);
  
    // 次の惑星ボタン
    const nextButton = document.createElement('button');
    nextButton.textContent = '次の惑星';
    nextButton.style.padding = '8px 15px';
    nextButton.style.backgroundColor = '#1565c0';
    nextButton.style.color = 'white';
    nextButton.style.border = 'none';
    nextButton.style.borderRadius = '5px';
    nextButton.style.cursor = 'pointer';
    nextButton.addEventListener('click', visitNextPlanet);
    tourControls.appendChild(nextButton);
  
    // ツアー終了ボタン
    const endTourButton = document.createElement('button');
    endTourButton.textContent = 'ツアー終了';
    endTourButton.style.padding = '8px 15px';
    endTourButton.style.backgroundColor = '#c41c00';
    endTourButton.style.color = 'white';
    endTourButton.style.border = 'none';
    endTourButton.style.borderRadius = '5px';
    endTourButton.style.cursor = 'pointer';
    endTourButton.addEventListener('click', endPlanetaryTour);
    tourControls.appendChild(endTourButton);
  
    document.body.appendChild(tourControls);
  }


// 自転速度スライダーを追加する関数
function addRotationControls() {
    const controlsPanel = document.getElementById('controls-panel');
    
    // 新しいコントロールグループを作成
    const rotationControlGroup = document.createElement('div');
    rotationControlGroup.className = 'control-group';
    
    // ラベルを作成
    const rotationLabel = document.createElement('label');
    rotationLabel.htmlFor = 'rotation-slider';
    rotationLabel.textContent = '自転速度:';
    rotationControlGroup.appendChild(rotationLabel);
    
    // スライダーを作成
    const rotationSlider = document.createElement('input');
    rotationSlider.type = 'range';
    rotationSlider.id = 'rotation-slider';
    rotationSlider.min = '0.1';
    rotationSlider.max = '10';
    rotationSlider.step = '0.1';
    rotationSlider.value = '1';
    rotationControlGroup.appendChild(rotationSlider);
    
    // 値表示用のスパンを作成
    const rotationValue = document.createElement('span');
    rotationValue.id = 'rotation-value';
    rotationValue.textContent = '1.0';
    rotationControlGroup.appendChild(rotationValue);
    
    // コントロールパネルに追加
    controlsPanel.appendChild(rotationControlGroup);
    
    // イベントリスナーを追加
    rotationSlider.addEventListener('input', function() {
      rotationScale = parseFloat(this.value);
      rotationValue.textContent = rotationScale.toFixed(1);
      
      // 惑星の自転速度を更新
      updatePlanetRotationSpeeds();
    });
  }
  
  // 惑星の自転速度を強化（初期化時に呼び出す）
  function enhanceRotationSpeeds() {
    // 元の自転速度をバックアップ
    originalRotationSpeeds = planetMeshes.map(planetMesh => 
      planetMesh.userData.rotationSpeed
    );
    
    // 自転速度を強化（5倍）
    updatePlanetRotationSpeeds(5.0);
  }
  
  // 惑星の自転速度を更新
  function updatePlanetRotationSpeeds(initialBoost = null) {
    const boost = initialBoost || rotationScale;
    
    planetMeshes.forEach((planetMesh, index) => {
      if (originalRotationSpeeds[index]) {
        // 元の速度に基づいて新しい速度を設定
        planetMesh.userData.rotationSpeed = originalRotationSpeeds[index] * boost;
      }
    });
  }
  

// アプリケーション開始
init();