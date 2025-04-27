// Three.jsとOrbitControls、OBJLoaderをインポート
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

// グローバル変数
let scene, camera, renderer, controls, gemMesh;
let pointLight1, pointLight2, pointLight3;
let objLoader; // OBJLoader用の変数
let gemModels = {}; // 読み込んだ宝石モデルを保存するオブジェクト
let envMap; // 環境マップをグローバル変数として保持
let sparkleSystem; // スパークルパーティクルシステム
const BASE_URL = document.querySelector('base')?.href || window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/');

// 設定のデフォルト値（ダイヤモンドをデフォルトに）
let currentSettings = {
    shape: 'round',
    color: '#ffffff', // 白色（ダイヤモンド）
    roughness: 0.01,  // 非常に滑らか
    transmission: 0.95, // 高い透明度
    ior: 2.417,  // ダイヤモンドの屈折率
    metalness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.01,
    sparkleIntensity: 1.0, // 輝き強度
    sparkleSize: 1.0,      // 輝きの大きさ
    sparkleColor: '#ffffff', // 輝きの色
    dispersion: 0.02       // 色分散効果
};

// 宝石プリセットの定義 - 実際の宝石特性に基づき改善
const gemPresets = {
    diamond: {
        shape: 'round',
        color: '#ffffff',
        roughness: 0.01,
        transmission: 0.96,
        ior: 2.417,  // ダイヤモンドの正確な屈折率
        metalness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.01,
        sparkleIntensity: 1.2,
        sparkleSize: 1.0,
        sparkleColor: '#ffffff',
        dispersion: 0.044  // ダイヤモンドの分散値
    },
    ruby: {
        shape: 'oval',
        color: '#e0115f', // より深みのあるルビーレッド
        roughness: 0.05,
        transmission: 0.8,
        ior: 1.76,    // ルビーの屈折率
        metalness: 0.1,
        clearcoat: 0.9,
        clearcoatRoughness: 0.03,
        sparkleIntensity: 0.9,
        sparkleSize: 0.9,
        sparkleColor: '#ff9999',
        dispersion: 0.018
    },
    sapphire: {
        shape: 'princess',
        color: '#0f52ba', // リッチなサファイアブルー
        roughness: 0.05,
        transmission: 0.85,
        ior: 1.77,    // サファイアの屈折率
        metalness: 0.1,
        clearcoat: 0.9,
        clearcoatRoughness: 0.03,
        sparkleIntensity: 0.9,
        sparkleSize: 0.9,
        sparkleColor: '#aaddff',
        dispersion: 0.018
    },
    emerald: {
        shape: 'emerald',
        color: '#046307', // エメラルドグリーン
        roughness: 0.1,
        transmission: 0.75,
        ior: 1.57,    // エメラルドの屈折率
        metalness: 0.0,
        clearcoat: 0.8,
        clearcoatRoughness: 0.05,
        sparkleIntensity: 0.8,
        sparkleSize: 0.8,
        sparkleColor: '#aaeeaa',
        dispersion: 0.014
    },
    amethyst: {
        shape: 'trillion',
        color: '#9966cc', // アメジストパープル
        roughness: 0.07,
        transmission: 0.85,
        ior: 1.54,    // アメジストの屈折率
        metalness: 0.0,
        clearcoat: 0.7,
        clearcoatRoughness: 0.04,
        sparkleIntensity: 0.85,
        sparkleSize: 0.8,
        sparkleColor: '#ddaaff',
        dispersion: 0.013
    },
    topaz: {
        shape: 'round',
        color: '#ffc87c', // イエロートパーズ
        roughness: 0.06,
        transmission: 0.9,
        ior: 1.62,    // トパーズの屈折率
        metalness: 0.05,
        clearcoat: 0.8,
        clearcoatRoughness: 0.03,
        sparkleIntensity: 0.9,
        sparkleSize: 0.9,
        sparkleColor: '#ffeecc',
        dispersion: 0.014
    },
    aquamarine: {
        shape: 'emerald',
        color: '#7fffd4', // アクアマリン
        roughness: 0.06,
        transmission: 0.9,
        ior: 1.58,
        metalness: 0.05,
        clearcoat: 0.8,
        clearcoatRoughness: 0.03,
        sparkleIntensity: 0.85,
        sparkleSize: 0.8,
        sparkleColor: '#ccffff',
        dispersion: 0.014
    },
    pinkDiamond: {
        shape: 'round',
        color: '#ffb6c1', // ピンクダイヤモンド
        roughness: 0.01,
        transmission: 0.96,
        ior: 2.417,
        metalness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.01,
        sparkleIntensity: 1.2,
        sparkleSize: 1.0,
        sparkleColor: '#ffddee',
        dispersion: 0.044
    }
};

// 誕生石の定義
const birthstones = {
    1: { name: '1月 - ガーネット', color: '#a42424', preset: 'ruby', description: '忠実さと友情を象徴し、着用者に愛と保護をもたらすとされています。' },
    2: { name: '2月 - アメジスト', color: '#9966cc', preset: 'amethyst', description: '冷静さと明晰さを象徴し、穏やかな心と知恵をもたらすとされています。' },
    3: { name: '3月 - アクアマリン', color: '#7fffd4', preset: 'aquamarine', description: '若さ、希望、健康を象徴し、幸せな結婚生活をもたらすとされています。' },
    4: { name: '4月 - ダイヤモンド', color: '#ffffff', preset: 'diamond', description: '純潔と永遠の愛を象徴し、無敵の強さとパワーをもたらすとされています。' },
    5: { name: '5月 - エメラルド', color: '#046307', preset: 'emerald', description: '愛と再生を象徴し、幸運と洞察力をもたらすとされています。' },
    6: { name: '6月 - パール/ムーンストーン', color: '#f0eee9', preset: 'diamond', description: '純潔と誠実さを象徴し、長寿と幸福をもたらすとされています。' },
    7: { name: '7月 - ルビー', color: '#e0115f', preset: 'ruby', description: '情熱と保護を象徴し、愛と豊かさをもたらすとされています。' },
    8: { name: '8月 - ペリドット', color: '#9aca3c', preset: 'emerald', description: '強さと明るさを象徴し、良い結婚と成功をもたらすとされています。' },
    9: { name: '9月 - サファイア', color: '#0f52ba', preset: 'sapphire', description: '叡智と純粋さを象徴し、心の平和と成功をもたらすとされています。' },
    10: { name: '10月 - オパール/トルマリン', color: '#ffcc99', preset: 'topaz', description: '希望と純潔を象徴し、忠実さと自信をもたらすとされています。' },
    11: { name: '11月 - トパーズ/シトリン', color: '#ffc87c', preset: 'topaz', description: '友情と希望を象徴し、強さと知性をもたらすとされています。' },
    12: { name: '12月 - タンザナイト/ターコイズ', color: '#4682b4', preset: 'sapphire', description: '成功と繁栄を象徴し、幸運と保護をもたらすとされています。' }
};

// 一般的な宝石色パレット（カラーピッカー用プリセット）
const gemColorPalette = [
    { name: 'ダイヤモンド', color: '#ffffff' },
    { name: 'ルビー', color: '#e0115f' },
    { name: 'サファイア', color: '#0f52ba' },
    { name: 'エメラルド', color: '#046307' },
    { name: 'アメジスト', color: '#9966cc' },
    { name: '黄色ダイヤ', color: '#ffeb3b' },
    { name: 'トパーズ', color: '#ffc87c' },
    { name: 'ピンクサファイア', color: '#ff748c' },
    { name: 'アクアマリン', color: '#7fffd4' },
    { name: 'ペリドット', color: '#9aca3c' },
    { name: 'ガーネット', color: '#a42424' },
    { name: 'シトリン', color: '#ffd700' }
];

// 保存された宝石の配列
let savedGems = [];
// スパークルパーティクル用の配列
let sparkles = [];

// モバイルデバイス検出関数
function isMobileDevice() {
    return /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (window.innerWidth <= 767) || 
           window.matchMedia('(pointer: coarse)').matches;
}

// 初期化
function init() {
    // シーンのセットアップ
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111122);
    
    // カメラのセットアップ
    const container = document.getElementById('gem-container');
    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    
    // モバイルの検出と調整
    const isMobile = isMobileDevice();
    
    // カメラ位置
    camera.position.set(0, 0, isMobile ? -4.5 : -5);
    camera.lookAt(0, 0, 0);
    
    // レンダラーのセットアップ
    renderer = new THREE.WebGLRenderer({ 
        antialias: !isMobile, // モバイルではアンチエイリアスを無効化（パフォーマンス向上）
        powerPreference: "high-performance"
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2)); // モバイルではピクセル比を制限
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    renderer.shadowMap.enabled = !isMobile; // モバイルではシャドウマップを無効化
    container.appendChild(renderer.domElement);
    
    // OrbitControlsのセットアップ - モバイル向けに調整
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = isMobile ? 1.0 : 0.7; // モバイルでは回転速度を上げる
    controls.panSpeed = 0.8;
    controls.zoomSpeed = isMobile ? 1.5 : 1.2; // モバイルではズーム速度を上げる
    controls.minDistance = isMobile ? 3 : 4;
    controls.maxDistance = isMobile ? 15 : 20;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 1.0;
    controls.maxPolarAngle = Math.PI; // 真下までの回転を許可
    controls.minPolarAngle = 0; // 真上までの回転を許可
    controls.target.set(0, 0, 0);
    controls.update();
    
    // タッチデバイス対応
    if (isMobile) {
        // ピンチズームを有効化
        controls.enableZoom = true;
        // 2本指でのパンを有効化
        controls.enablePan = true;
        // シングルタッチで回転
        controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    }
    
    // OBJLoaderの初期化
    objLoader = new OBJLoader();
    
    // モバイル向けに最適化
    if (isMobile) {
        // 簡易的な環境マップと照明
        setupSimplifiedEnvironment();
        
        // モバイル向けにパラメータ調整
        currentSettings.sparkleIntensity = Math.min(currentSettings.sparkleIntensity, 0.8);
        
        // モバイル向けUI調整
        setupMobileUI();
    } else {
        // 標準の環境マップと照明
        setupEnvironmentAndLighting();
    }
    
    // 宝石モデルの読み込み
    loadGemModels().then(() => {
        // モデル読み込み完了後、ダイヤモンドプリセットを適用
        applyGemPreset('diamond');
        
        // 自動回転を少しの間有効化して宝石を見せる
        controls.autoRotate = true;
        setTimeout(() => {
            controls.autoRotate = false;
        }, 2000);
    });
    
    // カラーパレットの生成
    createColorPalette();
    
    // 誕生石セレクタの設定（存在する場合）
    setupBirthstoneSelector();
    
    // ウィンドウリサイズ対応
    window.addEventListener('resize', onWindowResize);
    
    // アニメーションループの開始
    animate();
    
    // 保存された宝石を読み込む
    loadSavedGems();
    
    // UIのイベントリスナーを設定
    setupEventListeners();
    
    // スパークル強度スライダーの設定（存在する場合）
    setupSparkleSlider();
    
    // 自動回転ボタンの設定
    setupAutoRotateButton();
}

// モバイル向けUI調整
function setupMobileUI() {
    // タブナビゲーションをスワイプで切り替え可能に
    const tabNav = document.querySelector('.tab-navigation');
    if (!tabNav) return;
    
    // タブボタンを見やすく
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.style.padding = '10px 15px';
        button.style.fontSize = '0.9rem';
    });
    
    // アクションボタンのテキストサイズ調整
    const actionButtons = document.querySelectorAll('.action-button');
    actionButtons.forEach(button => {
        const textSpan = button.querySelector('.button-text');
        if (textSpan) {
            textSpan.style.fontSize = '0.8rem';
        }
    });
}

// シンプルな環境マップ（モバイル向け）
function setupSimplifiedEnvironment() {
    // 環境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    // メインライト
    const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
    mainLight.position.set(5, 10, 7);
    scene.add(mainLight);
    
    // 下からの光（宝石の透明感を強調）
    const bottomLight = new THREE.DirectionalLight(0xffffff, 0.8);
    bottomLight.position.set(0, -10, 2);
    scene.add(bottomLight);
    
    // 動くポイントライト - キラキラ効果用（少なく）
    pointLight1 = new THREE.PointLight(0xffffff, 2.0, 30);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);
    
    pointLight2 = new THREE.PointLight(0xffffee, 2.0, 30);
    pointLight2.position.set(-5, 5, -5);
    scene.add(pointLight2);
    
    // シンプルな環境マップ
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    
    // 単純な背景色の環境マップ
    const canvas = document.createElement('canvas');
    canvas.width = 512; // モバイルでは小さいテクスチャ
    canvas.height = 256;
    
    const context = canvas.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#000510');
    gradient.addColorStop(1, '#000000');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // いくつかの光るスポットを追加（簡易版）
    for (let i = 0; i < 10; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height * 0.7;
        const radius = 30 + Math.random() * 80;
        
        const spotGradient = context.createRadialGradient(
            x, y, 0,
            x, y, radius
        );
        
        spotGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        spotGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        spotGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        context.fillStyle = spotGradient;
        context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    
    envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;
}

// 誕生石セレクタの設定
function setupBirthstoneSelector() {
    const birthstoneSelector = document.getElementById('birthstone-selector');
    if (!birthstoneSelector) return;
    
    // 月のリストをセレクタに追加
    for (let month = 1; month <= 12; month++) {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = birthstones[month].name;
        birthstoneSelector.appendChild(option);
    }
    
    // 変更イベントを監視
    birthstoneSelector.addEventListener('change', (e) => {
        const month = parseInt(e.target.value);
        if (birthstones[month]) {
            // 情報を表示
            const infoElement = document.getElementById('birthstone-info');
            if (infoElement) {
                infoElement.textContent = birthstones[month].description;
                infoElement.style.display = 'block';
            }
            
            // プリセットを適用
            applyGemPreset(birthstones[month].preset);
            
            // 色を設定
            currentSettings.color = birthstones[month].color;
            document.getElementById('color').value = birthstones[month].color;
            updateGemColor(birthstones[month].color);
        }
    });
}

// カラーパレットの生成
function createColorPalette() {
    const paletteContainer = document.getElementById('color-palette');
    if (!paletteContainer) return;
    
    gemColorPalette.forEach(gemColor => {
        const colorButton = document.createElement('button');
        colorButton.className = 'color-preset';
        colorButton.style.backgroundColor = gemColor.color;
        colorButton.title = gemColor.name;
        colorButton.setAttribute('data-color', gemColor.color);
        
        // カラーボタンクリック時の処理
        colorButton.addEventListener('click', () => {
            const colorInput = document.getElementById('color');
            if (colorInput) {
                colorInput.value = gemColor.color;
                // 色を変更して宝石に適用
                currentSettings.color = gemColor.color;
                if (gemMesh) {
                    updateGemColor(gemColor.color);
                }
            }
        });
        
        paletteContainer.appendChild(colorButton);
    });
}

// スパークル強度スライダーの設定
function setupSparkleSlider() {
    const sparkleSlider = document.getElementById('sparkle-intensity');
    if (!sparkleSlider) return;
    
    // モバイルデバイスでは最大値を制限
    if (isMobileDevice()) {
        sparkleSlider.max = 1.5;
    }
    
    sparkleSlider.value = currentSettings.sparkleIntensity;
    const sparkleValue = document.getElementById('sparkle-value');
    if (sparkleValue) {
        sparkleValue.textContent = currentSettings.sparkleIntensity.toFixed(1);
    }
    
    sparkleSlider.addEventListener('input', (e) => {
        currentSettings.sparkleIntensity = parseFloat(e.target.value);
        if (sparkleValue) {
            sparkleValue.textContent = currentSettings.sparkleIntensity.toFixed(1);
        }
        
        // スパークルエフェクトを更新
        removeAllSparkles();
        if (currentSettings.sparkleIntensity > 0) {
            addSparkleEffect(currentSettings.sparkleIntensity);
        }
    });
}

// 宝石の色を更新
function updateGemColor(color) {
    if (!gemMesh) return;
    
    gemMesh.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
            child.material.color.set(color);
        }
    });
}

// 読み込み表示を制御する関数
function showLoadingIndicator(show) {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = show ? 'flex' : 'none';
    }
}

// モデルの読み込み進捗を表示する関数
function updateLoadingProgress(type, progress) {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        const progressText = loadingIndicator.querySelector('p');
        if (progressText) {
            progressText.textContent = `${type} モデル: ${Math.round(progress)}% 読み込み中...`;
        }
    }
}

// 宝石モデルの読み込み
async function loadGemModels() {
    showLoadingIndicator(true);
    
    const gemTypes = [
        'round',
        'oval',
        'princess',
        'pear',
        'marquise',
        'heart',
        'trillion',
        'radiant',
        'emerald'
    ];
    
    // モバイル判定
    const isMobile = isMobileDevice();
    
    // モバイルでは必要なモデルだけを読み込む
    const loadTypes = isMobile ? 
        ['round', 'oval', 'princess', 'heart', 'emerald'] : // モバイルでは一部のみ
        gemTypes; // デスクトップでは全て
    
    // 全てのモデルを読み込む Promise の配列
    const loadPromises = loadTypes.map(type => {
        return new Promise((resolve, reject) => {
            objLoader.load(
                `${BASE_URL}asset/gem_${type}.obj`,
                (object) => {
                    // モデルの調整
                    object.traverse((child) => {
                        if (child instanceof THREE.Mesh) {
                            // スケールを調整
                            child.scale.set(2, 2, 2);
                            // 位置を調整
                            child.position.set(0, 0, 0);
                            // 回転を調整
                            if (type === 'heart') {
                                child.rotation.set(Math.PI / 2, 0, Math.PI); // X軸90度 + Y軸180度
                            } else {
                                child.rotation.set(-Math.PI / 2, 0, 0); // 他は今まで通り
                            }
                            // ジオメトリの中心を原点に移動
                            child.geometry.center();
                            
                            // 法線を再計算（光の反射に重要）
                            child.geometry.computeVertexNormals();
                            
                            // モバイルの場合はジオメトリを簡略化
                            if (isMobile) {
                                // ジオメトリの頂点数を減らす
                                const simplifier = new THREE.BufferGeometryUtils.SimplifyModifier();
                                const count = child.geometry.attributes.position.count;
                                const targetCount = Math.floor(count * 0.7); // 30%削減
                                
                                try {
                                    child.geometry = simplifier.modify(child.geometry, targetCount);
                                } catch (e) {
                                    console.warn('ジオメトリの簡略化に失敗しました:', e);
                                }
                            }
                        }
                    });
                    
                    // モデルを保存
                    gemModels[type] = object;
                    resolve();
                },
                // 読み込み進捗
                (xhr) => {
                    const progress = xhr.loaded / xhr.total * 100;
                    updateLoadingProgress(type, progress);
                },
                // エラー時
                (error) => {
                    console.error(`モデル ${type} の読み込みに失敗:`, error);
                    // エラーしても進める
                    resolve();
                }
            );
        });
    });
    
    try {
        // 全てのモデルが読み込まれるまで待機
        await Promise.all(loadPromises);
        console.log('全ての宝石モデルの読み込みが完了しました');
        
        // モバイルの場合、読み込まなかったモデルのフォールバック
        if (isMobile) {
            gemTypes.forEach(type => {
                if (!gemModels[type]) {
                    // 最も近い形状のモデルをフォールバックとして使用
                    let fallback;
                    if (type === 'pear' || type === 'marquise') {
                        fallback = 'oval';
                    } else if (type === 'trillion' || type === 'radiant') {
                        fallback = 'princess';
                    } else {
                        fallback = 'round';
                    }
                    
                    if (gemModels[fallback]) {
                        gemModels[type] = gemModels[fallback].clone();
                    }
                }
            });
        }
    } catch (error) {
        console.error('モデル読み込み中にエラーが発生しました:', error);
    } finally {
        // 読み込み完了後、インジケーターを非表示
        showLoadingIndicator(false);
    }
}

// 環境マップと照明のセットアップ - キラキラ効果向上
function setupEnvironmentAndLighting() {
    // 環境光（全体を明るくする）
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // メインライト（上から）
    const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
    mainLight.position.set(5, 10, 7);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);
    
    // フィルライト（反対側から）
    const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
    fillLight.position.set(-5, 2, -5);
    scene.add(fillLight);
    
    // 下からの光（宝石の透明感を強調）
    const bottomLight = new THREE.DirectionalLight(0xffffff, 0.8);
    bottomLight.position.set(0, -10, 2);
    scene.add(bottomLight);
    
    // 動くポイントライト - キラキラ効果用
    pointLight1 = new THREE.PointLight(0xffffff, 2.0, 30);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);
    
    pointLight2 = new THREE.PointLight(0xffffee, 2.0, 30);
    pointLight2.position.set(-5, 5, -5);
    scene.add(pointLight2);
    
    pointLight3 = new THREE.PointLight(0xeeeeff, 2.0, 30);
    pointLight3.position.set(0, -5, 5);
    scene.add(pointLight3);
    
    // キラキラ効果用の小さなポイントライト - より多く
    for (let i = 0; i < 12; i++) {
        const sparkleLight = new THREE.PointLight(0xffffff, 1.0, 10);
        const angle = (i / 12) * Math.PI * 2;
        const radius = 6;
        
        sparkleLight.position.set(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius * 0.5,
            Math.sin(angle) * radius
        );
        
        scene.add(sparkleLight);
    }
    
    // 環境マップの設定 - よりキラキラした見た目に
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    
    // キラキラ感のある環境マップを作成
    const envTexture = createSparkleEnvironmentTexture();
    envMap = pmremGenerator.fromEquirectangular(envTexture).texture;
    scene.environment = envMap;
}

// キラキラした環境テクスチャを作成 - より豪華に
function createSparkleEnvironmentTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    
    const context = canvas.getContext('2d');
    
    // グラデーション背景
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#000510');
    gradient.addColorStop(1, '#000000');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // 大きな明るいスポット（キラキラ感の基礎）- より多く、より大きく
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height * 0.7;
        const radius = 100 + Math.random() * 200;
        
        const spotGradient = context.createRadialGradient(
            x, y, 0,
            x, y, radius
        );
        
        spotGradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
        spotGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.6)');
        spotGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        context.fillStyle = spotGradient;
        context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    
    // カラフルなハイライト（宝石の分散効果のため）- より多彩に
    const colors = [
        'rgba(255, 0, 0, 0.7)',    // 赤
        'rgba(255, 165, 0, 0.7)',  // オレンジ
        'rgba(255, 255, 0, 0.7)',  // 黄
        'rgba(0, 255, 0, 0.7)',    // 緑
        'rgba(0, 0, 255, 0.7)',    // 青
        'rgba(75, 0, 130, 0.7)',   // インディゴ
        'rgba(148, 0, 211, 0.7)',  // 紫
        'rgba(255, 105, 180, 0.7)' // ピンク
    ];
    
    for (let i = 0; i < 40; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = 15 + Math.random() * 40;
        
        context.fillStyle = color;
        context.beginPath();
        context.arc(x, y, size, 0, Math.PI * 2);
        context.fill();
    }
    
    // 星のような小さな輝点をたくさん追加 - 密度を上げる
    for (let i = 0; i < 800; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = 0.5 + Math.random() * 2.5;
        
        // ランダムな輝度と色合いで
        const brightness = 0.5 + Math.random() * 0.5;
        const hue = Math.random() * 60; // 黄色から赤の範囲でランダム
        context.fillStyle = `hsla(${hue}, 100%, 90%, ${brightness})`;
        
        context.beginPath();
        context.arc(x, y, size, 0, Math.PI * 2);
        context.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    return texture;
}

// 宝石を作成する関数 - より輝く設定に
function createGem() {
    // 既存の宝石メッシュを削除
    if (gemMesh) {
        scene.remove(gemMesh);
        gemMesh = null;
    }
    
    // スパークルを削除
    removeAllSparkles();
    
    // 宝石の形状を取得
    const shape = currentSettings.shape;
    
    // OBJモデルが読み込まれているかチェック
    if (gemModels[shape]) {
        // モデルのクローンを作成
        gemMesh = gemModels[shape].clone();
        
        // マテリアルの作成 - 輝きを強化
        const gemColor = new THREE.Color(currentSettings.color);
        
        // 輝きの強さに応じて反射率とenvMapIntensityを調整
        const envMapIntensity = 1.5 + currentSettings.sparkleIntensity * 1.5;
        const transmission = Math.min(0.95, currentSettings.transmission);
        
        // モバイルの場合は品質を下げてパフォーマンス向上
        const isMobile = isMobileDevice();
        const materialParams = {
            color: gemColor,
            metalness: currentSettings.metalness || 0.1,
            roughness: Math.max(0.01, currentSettings.roughness),
            transmission: transmission,
            thickness: 0.5,
            ior: currentSettings.ior,
            reflectivity: 1.0,
            envMapIntensity: isMobile ? envMapIntensity * 0.8 : envMapIntensity,
            envMap: envMap,
            clearcoat: isMobile ? Math.min(0.8, currentSettings.clearcoat) : currentSettings.clearcoat,
            clearcoatRoughness: currentSettings.clearcoatRoughness,
            transparent: true,
            side: THREE.DoubleSide,
            specularIntensity: isMobile ? 1.2 : 1.5 + currentSettings.sparkleIntensity * 0.5,
            specularColor: new THREE.Color(1, 1, 1)
        };
        
        // 材質の最終調整
        const material = new THREE.MeshPhysicalMaterial(materialParams);
        
        // すべてのメッシュにマテリアルを適用
        gemMesh.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.material = material;
                child.castShadow = !isMobile;
                child.receiveShadow = !isMobile;
            }
        });
        
        // シーンに追加
        scene.add(gemMesh);
        
        // スパークルエフェクトを追加（キラキラ感を表現）
        if (currentSettings.sparkleIntensity > 0) {
            addSparkleEffect(currentSettings.sparkleIntensity);
        }
    } else {
        // モデルが読み込まれていない場合はフォールバック
        console.warn(`モデル ${shape} が見つかりません。代替表示を使用します。`);
        createFallbackGem();
    }
    
    // ライトの位置を調整して宝石を照らす
    adjustLightsForGem();
}

// スパークルエフェクトを追加（キラキラ効果）- 強化版
function addSparkleEffect(intensity) {
    if (!gemMesh) return;
    
    // モバイルデバイス検出
    const isMobile = isMobileDevice();
    
    // スパークル数を輝き強度に応じて調整（モバイルでは少なく）
    const multiplier = isMobile ? 0.6 : 1.0;
    const sparkleCount = Math.floor(30 * intensity * multiplier);
    
    // スパークルを格納するグループ
    sparkleSystem = new THREE.Group();
    gemMesh.add(sparkleSystem);
    
    // スパークルのサイズをランダムに
    for (let i = 0; i < sparkleCount; i++) {
        // サイズをランダム化 - 小さいものから大きいものまで
        const size = (0.02 + Math.random() * 0.05) * currentSettings.sparkleSize;
        
        // ジオメトリはシンプルな八面体（ダイヤモンドの形状）
        const sparkleGeometry = new THREE.OctahedronGeometry(size, 0);
        
        // 色をわずかにランダム化して自然な輝きに
        let sparkleColor;
        if (currentSettings.sparkleColor === '#ffffff') {
            // 白色スパークルの場合、わずかに色付け
            const hue = Math.random() * 0.2; // わずかな色相の違い
            const saturation = 0.1 + Math.random() * 0.2; // 低い彩度
            sparkleColor = new THREE.Color().setHSL(hue, saturation, 0.9);
        } else {
            // 指定色のスパークル
            sparkleColor = new THREE.Color(currentSettings.sparkleColor);
            // わずかに明度をランダム化
            sparkleColor.offsetHSL(0, 0, Math.random() * 0.2 - 0.1);
        }
        
        // 加算合成で輝くマテリアル
        const sparkleMaterial = new THREE.MeshBasicMaterial({
            color: sparkleColor,
            transparent: true,
            opacity: 0.7 + Math.random() * 0.3,
            blending: THREE.AdditiveBlending
        });
        
        const sparkleMesh = new THREE.Mesh(sparkleGeometry, sparkleMaterial);
        
        // 宝石内部と周囲にランダムに配置
        const radiusMultiplier = 0.8 + Math.random() * 0.6; // 内部と外部の両方に
        const radius = 1.8 * Math.random() * radiusMultiplier;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        sparkleMesh.position.set(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.cos(phi),
            radius * Math.sin(phi) * Math.sin(theta)
        );
        
        // ランダムな回転
        sparkleMesh.rotation.x = Math.random() * Math.PI * 2;
        sparkleMesh.rotation.y = Math.random() * Math.PI * 2;
        sparkleMesh.rotation.z = Math.random() * Math.PI * 2;
        
        // アニメーション用にデータを設定
        sparkleMesh.userData = {
            blinkSpeed: 0.5 + Math.random() * 2.0,
            blinkOffset: Math.random() * Math.PI * 2,
            originalOpacity: sparkleMaterial.opacity,
            rotationSpeed: {
                x: (Math.random() - 0.5) * 0.01,
                y: (Math.random() - 0.5) * 0.01,
                z: (Math.random() - 0.5) * 0.01
            },
            moveSpeed: {
                x: (Math.random() - 0.5) * 0.005,
                y: (Math.random() - 0.5) * 0.005,
                z: (Math.random() - 0.5) * 0.005
            },
            originalPosition: sparkleMesh.position.clone(),
            moveFactor: Math.random() * Math.PI * 2
        };
        
        sparkleSystem.add(sparkleMesh);
        
        // 配列に追加（アニメーション管理用）
        sparkles.push(sparkleMesh);
    }
}

// すべてのスパークルを削除
function removeAllSparkles() {
    // すべてのスパークルを削除
    sparkles.forEach(sparkle => {
        if (sparkle.parent) {
            sparkle.parent.remove(sparkle);
        }
    });
    
    // スパークルシステムを削除
    if (sparkleSystem && sparkleSystem.parent) {
        sparkleSystem.parent.remove(sparkleSystem);
    }
    
    // 配列をクリア
    sparkles = [];
    sparkleSystem = null;
}

// ライトの位置を調整
function adjustLightsForGem() {
    // メインライトの位置を調整
    if (pointLight1) {
        pointLight1.position.set(3, 5, 3);
        pointLight1.intensity = 2.0 + currentSettings.sparkleIntensity;
    }
    
    if (pointLight2) {
        pointLight2.position.set(-3, 5, -3);
        pointLight2.intensity = 2.0 + currentSettings.sparkleIntensity;
    }
    
    if (pointLight3) {
        pointLight3.position.set(0, -5, 3);
        pointLight3.intensity = 2.0 + currentSettings.sparkleIntensity;
    }
}

// フォールバック用の宝石作成 - 輝きを強化
function createFallbackGem() {
    const geometry = new THREE.SphereGeometry(2, 64, 64);
    
    const gemColor = new THREE.Color(currentSettings.color);
    const material = new THREE.MeshPhysicalMaterial({
        color: gemColor,
        metalness: currentSettings.metalness || 0.1,
        roughness: Math.max(0.01, currentSettings.roughness),
        transmission: currentSettings.transmission,
        thickness: 0.5,
        ior: currentSettings.ior,
        reflectivity: 1.0,
        envMapIntensity: 2.0,
        clearcoat: currentSettings.clearcoat,
        clearcoatRoughness: currentSettings.clearcoatRoughness,
        transparent: true,
        side: THREE.DoubleSide,
        specularIntensity: 1.5,
        specularColor: new THREE.Color(1, 1, 1)
    });
    
    gemMesh = new THREE.Mesh(geometry, material);
    gemMesh.castShadow = true;
    gemMesh.receiveShadow = true;
    scene.add(gemMesh);
    
    // スパークルエフェクトを追加
    if (currentSettings.sparkleIntensity > 0) {
        addSparkleEffect(currentSettings.sparkleIntensity);
    }
}

// プリセットを適用する関数
function applyGemPreset(presetName) {
    const preset = gemPresets[presetName];
    if (!preset) return;
    
    // 設定を更新
    currentSettings = { ...currentSettings, ...preset };
    
    // モバイルの場合はパラメータを調整
    if (isMobileDevice()) {
        currentSettings.sparkleIntensity = Math.min(currentSettings.sparkleIntensity, 0.8);
    }
    
    // UIを更新
    document.getElementById('shape').value = currentSettings.shape;
    document.getElementById('color').value = currentSettings.color;
    document.getElementById('roughness').value = currentSettings.roughness;
    document.getElementById('roughness-value').textContent = currentSettings.roughness.toFixed(2);
    document.getElementById('transmission').value = currentSettings.transmission;
    document.getElementById('transmission-value').textContent = currentSettings.transmission.toFixed(2);
    document.getElementById('ior').value = currentSettings.ior;
    document.getElementById('ior-value').textContent = currentSettings.ior.toFixed(2);
    
    // スパークル強度スライダーがあれば更新
    const sparkleSlider = document.getElementById('sparkle-intensity');
    if (sparkleSlider) {
        sparkleSlider.value = currentSettings.sparkleIntensity;
        const sparkleValue = document.getElementById('sparkle-value');
        if (sparkleValue) {
            sparkleValue.textContent = currentSettings.sparkleIntensity.toFixed(1);
        }
    }
    
    // 宝石を再作成
    createGem();
}

// アニメーションループ - スパークルのアニメーション向上
function animate() {
    requestAnimationFrame(animate);
    
    // 現在時刻
    const time = Date.now() * 0.001;
    
    // スパークルエフェクトのアニメーション - より洗練された動き
    sparkles.forEach((sparkle) => {
        if (sparkle && sparkle.material) {
            const userData = sparkle.userData;
            
            // 息づくような点滅アニメーション
            const blink = 0.3 + 0.7 * Math.sin(time * userData.blinkSpeed + userData.blinkOffset);
            sparkle.material.opacity = userData.originalOpacity * blink;
            
            // 回転アニメーション - キラリと光る感じ
            sparkle.rotation.x += userData.rotationSpeed.x;
            sparkle.rotation.y += userData.rotationSpeed.y;
            sparkle.rotation.z += userData.rotationSpeed.z;
            
            // 微妙な位置の揺れ動き
            const moveFactor = time * 0.5 + userData.moveFactor;
            sparkle.position.x = userData.originalPosition.x + Math.sin(moveFactor) * 0.05;
            sparkle.position.y = userData.originalPosition.y + Math.cos(moveFactor * 0.7) * 0.05;
            sparkle.position.z = userData.originalPosition.z + Math.sin(moveFactor * 1.3) * 0.05;
        }
    });
    
    // ライトのアニメーション（弱めの動き）
    if (pointLight1) {
        pointLight1.position.x = 3 + Math.sin(time * 0.3) * 0.5;
        pointLight1.position.y = 5 + Math.cos(time * 0.2) * 0.5;
        pointLight1.intensity = 2.0 + Math.sin(time) * 0.5;
    }
    
    if (pointLight2) {
        pointLight2.position.x = -3 + Math.sin(time * 0.4 + 1) * 0.5;
        pointLight2.position.y = 5 + Math.sin(time * 0.3) * 0.5;
        pointLight2.intensity = 2.0 + Math.sin(time * 1.1) * 0.5;
    }
    
    // OrbitControlsの更新
    controls.update();
    
    // レンダリング
    renderer.render(scene, camera);
}

// ウィンドウサイズが変更されたときの処理（スマホ対応強化）
function onWindowResize() {
    const container = document.getElementById('gem-container');
    if (!container) return;
    
    // コンテナのサイズを取得
    const width = container.clientWidth;
    const height = container.clientHeight;
    const aspect = width / height;
    
    // カメラのアスペクト比を更新
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    
    // レンダラーのサイズを更新
    renderer.setSize(width, height);
    
    // モバイルかどうかを検出
    const isMobile = isMobileDevice();
    
    // モバイルの場合はピクセル比と品質を調整
    if (isMobile) {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        
        // 簡略化したマテリアルを適用
        if (gemMesh && gemMesh.material) {
            gemMesh.traverse((child) => {
                if (child instanceof THREE.Mesh && child.material) {
                    child.material.roughness = Math.max(0.05, currentSettings.roughness);
                    child.material.envMapIntensity *= 0.8;
                }
            });
        }
        
        // スパークル数を削減（パフォーマンス向上）
        if (currentSettings.sparkleIntensity > 0) {
            removeAllSparkles();
            addSparkleEffect(currentSettings.sparkleIntensity * 0.7);  // 30%削減
        }
    } else {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
}

// 自動回転ボタンの設定
function setupAutoRotateButton() {
    const autoRotateBtn = document.getElementById('auto-rotate');
    if (autoRotateBtn) {
        autoRotateBtn.addEventListener('click', () => {
            controls.autoRotate = !controls.autoRotate;
            
            // ボタンのテキストとアイコンを更新
            const buttonTextElement = autoRotateBtn.querySelector('.button-text');
            const buttonIconElement = autoRotateBtn.querySelector('.button-icon');
            
            if (controls.autoRotate) {
                if (buttonTextElement) buttonTextElement.textContent = '回転停止';
                if (buttonIconElement) buttonIconElement.textContent = '⏹️';
                autoRotateBtn.classList.add('active');
            } else {
                if (buttonTextElement) buttonTextElement.textContent = '自動回転';
                if (buttonIconElement) buttonIconElement.textContent = '🔄';
                autoRotateBtn.classList.remove('active');
            }
        });
    }
}

// イベントリスナーのセットアップ
function setupEventListeners() {
    // 形状の変更
    document.getElementById('shape').addEventListener('change', (e) => {
        currentSettings.shape = e.target.value;
        createGem();
    });
    
    // 色の変更
    document.getElementById('color').addEventListener('input', (e) => {
        currentSettings.color = e.target.value;
        if (gemMesh) {
            updateGemColor(currentSettings.color);
        }
    });
    
    // 光沢の変更
    document.getElementById('roughness').addEventListener('input', (e) => {
        currentSettings.roughness = parseFloat(e.target.value);
        document.getElementById('roughness-value').textContent = currentSettings.roughness.toFixed(2);
        if (gemMesh) {
            gemMesh.traverse((child) => {
                if (child instanceof THREE.Mesh && child.material) {
                    child.material.roughness = currentSettings.roughness;
                }
            });
        }
    });
    
    // 透明度の変更
    document.getElementById('transmission').addEventListener('input', (e) => {
        currentSettings.transmission = parseFloat(e.target.value);
        document.getElementById('transmission-value').textContent = currentSettings.transmission.toFixed(2);
        if (gemMesh) {
            gemMesh.traverse((child) => {
                if (child instanceof THREE.Mesh && child.material) {
                    child.material.transmission = currentSettings.transmission;
                }
            });
        }
    });
    
    // 屈折率の変更
    document.getElementById('ior').addEventListener('input', (e) => {
        currentSettings.ior = parseFloat(e.target.value);
        document.getElementById('ior-value').textContent = currentSettings.ior.toFixed(2);
        if (gemMesh) {
            gemMesh.traverse((child) => {
                if (child instanceof THREE.Mesh && child.material) {
                    child.material.ior = currentSettings.ior;
                }
            });
        }
    });
    
    // 宝石プリセットボタン
    document.getElementById('preset-diamond').addEventListener('click', () => applyGemPreset('diamond'));
    document.getElementById('preset-ruby').addEventListener('click', () => applyGemPreset('ruby'));
    document.getElementById('preset-sapphire').addEventListener('click', () => applyGemPreset('sapphire'));
    document.getElementById('preset-emerald').addEventListener('click', () => applyGemPreset('emerald'));
    document.getElementById('preset-amethyst').addEventListener('click', () => applyGemPreset('amethyst'));
    
    // 画像として保存
    document.getElementById('save-image').addEventListener('click', saveAsImage);
    
    // 設定を保存
    document.getElementById('save-settings').addEventListener('click', saveSettings);
    
    // 保存した設定を読み込む
    document.getElementById('load-settings').addEventListener('click', loadSettingsFromStorage);
    
    // モバイルデバイス用のタッチイベント最適化
    if (isMobileDevice()) {
        // ダブルタップによるズームを防止
        document.addEventListener('dblclick', (e) => {
            e.preventDefault();
        });
        
        // 長押しでのコンテキストメニューを抑制
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
// ボタン用の高速タップ応答
const allButtons = document.querySelectorAll('button');
allButtons.forEach(button => {
    button.addEventListener('touchstart', () => {
        button.classList.add('touch-active');
    }, { passive: true });
    
    button.addEventListener('touchend', () => {
        button.classList.remove('touch-active');
        setTimeout(() => {
            button.blur(); // フォーカスを外してハイライトを消す
        }, 300);
    }, { passive: true });
});
}
}

// 画像として保存する関数
function saveAsImage() {
// キャンバスをレンダリング
renderer.render(scene, camera);

// 画像データを取得
const dataURL = renderer.domElement.toDataURL('image/png');

// モバイルの場合はダウンロード方法を調整
if (isMobileDevice()) {
// 新しいウィンドウで画像を開く（デバイスの共有機能を使用可能に）
const newWindow = window.open();
if (newWindow) {
    newWindow.document.write(`
        <html>
        <head>
            <title>保存する宝石</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    font-family: sans-serif;
                    background: #111;
                    color: white;
                    height: 100vh;
                    text-align: center;
                }
                img {
                    max-width: 100%;
                    max-height: 70vh;
                    margin: 20px 0;
                }
                .instructions {
                    padding: 15px;
                    font-size: 14px;
                }
                .button {
                    background: #9c27b0;
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 8px;
                    font-size: 16px;
                    margin-top: 10px;
                    touch-action: manipulation;
                }
            </style>
        </head>
        <body>
            <div class="instructions">
                この画像を長押しすると保存できます
            </div>
            <img src="${dataURL}" alt="3D宝石">
            <button class="button" onclick="window.close()">閉じる</button>
        </body>
        </html>
    `);
} else {
    alert('新しいウィンドウが開けませんでした。ブラウザの設定を確認してください。');
}
} else {
// 通常のダウンロード（デスクトップ用）
const downloadLink = document.createElement('a');
downloadLink.href = dataURL;
downloadLink.download = `gem-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.png`;
document.body.appendChild(downloadLink);

// リンクをクリック（ダウンロード実行）
downloadLink.click();

// リンク要素を削除
document.body.removeChild(downloadLink);
}

// 保存した画像と設定を記録
saveGemToList(dataURL);
}

// 宝石と設定を保存する関数
function saveSettings() {
// 現在の設定をローカルストレージに保存
localStorage.setItem('currentGemSettings', JSON.stringify(currentSettings));
alert('設定が保存されました！');
}

// 保存された設定を読み込む関数
function loadSettingsFromStorage() {
const savedSettings = localStorage.getItem('currentGemSettings');
if (savedSettings) {
const settings = JSON.parse(savedSettings);

// 設定を適用
applySettings(settings);

alert('保存された設定を読み込みました！');
} else {
alert('保存された設定がありません。');
}
}

// 設定を適用する関数
function applySettings(settings) {
// 設定をコピー
currentSettings = { ...settings };

// モバイルの場合はスパークル強度を制限
if (isMobileDevice()) {
currentSettings.sparkleIntensity = Math.min(currentSettings.sparkleIntensity, 0.8);
}

// UIを更新
document.getElementById('shape').value = currentSettings.shape;
document.getElementById('color').value = currentSettings.color;
document.getElementById('roughness').value = currentSettings.roughness;
document.getElementById('roughness-value').textContent = currentSettings.roughness.toFixed(2);
document.getElementById('transmission').value = currentSettings.transmission;
document.getElementById('transmission-value').textContent = currentSettings.transmission.toFixed(2);
document.getElementById('ior').value = currentSettings.ior;
document.getElementById('ior-value').textContent = currentSettings.ior.toFixed(2);

// スパークル強度スライダーがあれば更新
const sparkleSlider = document.getElementById('sparkle-intensity');
if (sparkleSlider) {
sparkleSlider.value = currentSettings.sparkleIntensity || 1.0;
const sparkleValue = document.getElementById('sparkle-value');
if (sparkleValue) {
    sparkleValue.textContent = (currentSettings.sparkleIntensity || 1.0).toFixed(1);
}
}

// 宝石を再作成
createGem();
}

// 保存された宝石のリストに追加する関数
function saveGemToList(imageDataURL) {
// 新しい宝石オブジェクトを作成
const newGem = {
id: Date.now(),
image: imageDataURL,
settings: { ...currentSettings }
};

// 配列に追加
savedGems.push(newGem);

// 容量制限を設ける（モバイルのストレージ対策）
const maxGems = isMobileDevice() ? 8 : 16;
if (savedGems.length > maxGems) {
savedGems = savedGems.slice(-maxGems); // 最大数を超えたら古いものから削除
}

// localStorageに保存（容量制限に注意）
try {
localStorage.setItem('savedGems', JSON.stringify(savedGems));
} catch (e) {
// localStorageの容量制限を超えた場合
console.error('localStorage容量制限を超えました:', e);
alert('保存容量の制限を超えました。一部の宝石を削除してください。');

// 最も古い宝石を削除
savedGems.shift();
localStorage.setItem('savedGems', JSON.stringify(savedGems));
}

// UIを更新
updateSavedGemsUI();
}

// 保存された宝石のUIを更新する関数
function updateSavedGemsUI() {
const container = document.getElementById('saved-gems-list');
if (!container) return;

container.innerHTML = '';

if (savedGems.length === 0) {
const emptyMessage = document.createElement('p');
emptyMessage.className = 'empty-message';
emptyMessage.textContent = '保存された宝石はありません。';
container.appendChild(emptyMessage);
return;
}

// モバイルかどうかでUIを調整
const isMobile = isMobileDevice();

savedGems.forEach((gem) => {
const gemElement = document.createElement('div');
gemElement.className = 'saved-gem-item';

const img = document.createElement('img');
img.src = gem.image;
img.alt = '保存された宝石';
img.loading = 'lazy'; // 遅延読み込みでパフォーマンス向上

const buttonContainer = document.createElement('div');
buttonContainer.className = 'gem-buttons';

const loadButton = document.createElement('button');
loadButton.textContent = '読込';
loadButton.addEventListener('click', () => loadGem(gem));

const deleteButton = document.createElement('button');
deleteButton.textContent = '削除';
deleteButton.className = 'delete-button';
deleteButton.addEventListener('click', () => deleteGem(gem.id));

buttonContainer.appendChild(loadButton);
buttonContainer.appendChild(deleteButton);

gemElement.appendChild(img);
gemElement.appendChild(buttonContainer);

// モバイルの場合はタップ操作を改善
if (isMobile) {
    img.addEventListener('click', () => {
        // タップしたら読み込む
        loadGem(gem);
    }, { passive: true });
}

container.appendChild(gemElement);
});
}

// 保存された宝石を読み込む関数
function loadGem(gem) {
applySettings(gem.settings);
}

// 保存された宝石を削除する関数
function deleteGem(id) {
savedGems = savedGems.filter(gem => gem.id !== id);
localStorage.setItem('savedGems', JSON.stringify(savedGems));
updateSavedGemsUI();
}

// 保存された宝石を読み込む関数
function loadSavedGems() {
const savedGemsStr = localStorage.getItem('savedGems');
if (savedGemsStr) {
try {
    savedGems = JSON.parse(savedGemsStr);
    updateSavedGemsUI();
} catch (e) {
    console.error('保存された宝石の読み込みエラー:', e);
    localStorage.removeItem('savedGems');
    savedGems = [];
}
}
}

// ページロード時に初期化
window.addEventListener('DOMContentLoaded', () => {
init();
});