// ボールころがしパズル - 単一ファイルバージョン（クリック操作のみ）

// =========================================
// グローバル変数と初期設定
// =========================================

// Three.jsとCannon.jsをグローバルから取得
const THREE = window.THREE;
const CANNON = window.CANNON;

// ゲームの状態
const gameState = {
    isGameStarted: false,
    isGameOver: false,
    isLevelCompleted: false,
    score: 0,
    level: 1,
    gameTime: 0,
    startTime: 0,
    lastUpdateTime: 0
};

// レンダラー関連
let scene, camera, renderer;
let mazeContainer = null;
const mazeSize = 20;

// 物理エンジン関連
let world;
let ballBody;
const timeStep = 1/60;
const ballRadius = 0.6;
let ballPosition = new THREE.Vector3();
let ball;
let walls = [];

// レベル関連
let coins = [];
let holes = [];
let obstacles = [];
let goal;
let allCoinsCollected = false;
let isLevelCompleted = false;

// コントロール関連
let currentTiltX = 0;
let currentTiltZ = 0;
let maxTilt = 0.3;
let controlMode = 'click'; // 常にクリック操作
let targetTiltX = 0;
let targetTiltZ = 0;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

// クロックとデルタタイム
let clock;
let deltaTime = 0;

// 衝突関連
let lastCollidedCoinId = null;
let lastCollisionTime = 0;
const COLLISION_COOLDOWN = 100; // 500msから100msに短縮
let particleCount = 0;
const MAX_PARTICLES = 100;

// 衝突判定のパラメータも調整
// handleCollisions関数内の定数を変更
const COLLISION_MARGIN = 0.3; // 0.5から0.3に減少

// =========================================
// ユーティリティ関数
// =========================================

// ロード進捗の更新
function updateLoadingProgress(percent) {
    const progressBar = document.getElementById('loading-progress');
    if (progressBar) {
        progressBar.style.width = `${percent}%`;
    }
}

// ランダムな値を生成（min以上max未満）
function random(min, max) {
    return Math.random() * (max - min) + min;
}

// 指定された範囲に値を制限
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// 度からラジアンに変換
function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

// ラジアンから度に変換
function radToDeg(radians) {
    return radians * 180 / Math.PI;
}

// 線形補間（0～1の範囲でa～bの値を返す）
function lerp(a, b, t) {
    return a + (b - a) * clamp(t, 0, 1);
}

// 2点間の距離を計算
function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// 2次元の位置を3次元空間の位置に変換
function screenToWorld(screenX, screenY, targetZ = 0) {
    const vector = new THREE.Vector3(
        (screenX / window.innerWidth) * 2 - 1,
        -(screenY / window.innerHeight) * 2 + 1,
        0.5
    );
    
    vector.unproject(camera);
    
    const direction = vector.sub(camera.position).normalize();
    const distance = (targetZ - camera.position.z) / direction.z;
    
    return camera.position.clone().add(direction.multiplyScalar(distance));
}

// デバッグモードのセットアップ
function setupDebugMode() {
    let isDebugMode = false;
    
    // キーボードのDキーでデバッグモードを切り替え
    window.addEventListener('keydown', (e) => {
        if (e.key === 'd' || e.key === 'D') {
            isDebugMode = !isDebugMode;
            toggleDebugInfo(isDebugMode);
        }
    });
    
    // デバッグ情報の表示/非表示切り替え
    function toggleDebugInfo(show) {
        let debugInfo = document.getElementById('debug-info');
        
        if (show) {
            if (!debugInfo) {
                debugInfo = document.createElement('div');
                debugInfo.id = 'debug-info';
                document.body.appendChild(debugInfo);
            }
            debugInfo.style.display = 'block';
            updateDebugInfo();
        } else if (debugInfo) {
            debugInfo.style.display = 'none';
        }
    }
    
    // デバッグ情報の更新
    function updateDebugInfo() {
        if (!isDebugMode) return;
        
        const debugInfo = document.getElementById('debug-info');
        if (!debugInfo) return;
        
        if (ball) {
            debugInfo.innerHTML = `
                ボール位置: X=${ball.position.x.toFixed(2)}, Y=${ball.position.y.toFixed(2)}, Z=${ball.position.z.toFixed(2)}<br>
                ゲーム状態: ${gameState.isGameStarted ? '開始' : '待機'}, ${gameState.isGameOver ? 'ゲームオーバー' : ''}, ${gameState.isLevelCompleted ? 'レベルクリア' : ''}<br>
                スコア: ${gameState.score}<br>
                レベル: ${gameState.level}<br>
                時間: ${gameState.gameTime}秒
            `;
        } else {
            debugInfo.innerHTML = 'ボールが存在しません';
        }
        
        // 定期的に更新
        if (isDebugMode) {
            requestAnimationFrame(updateDebugInfo);
        }
    }
}

// =========================================
// レンダラー関連の関数
// =========================================

// シーンの初期化
function initScene() {
    // シーンの作成
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // 空色の背景
    
    // カメラの設定
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 25, 25);
    camera.lookAt(0, 0, 0);
    
    // レンダラーの設定
    renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById('game-canvas'),
        antialias: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    
    // 環境光とディレクショナルライト
    addLights();
    
    // ウィンドウリサイズイベントの設定
    window.addEventListener('resize', onWindowResize, false);
}

// 光源の追加
function addLights() {
    // 環境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    // ディレクショナルライト（太陽光）
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 30, 20);
    directionalLight.castShadow = true;
    
    // シャドウマップの設定
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    
    scene.add(directionalLight);
}

// 迷路コンテナの作成
function createMazeContainer() {
    // 既存のコンテナがあれば削除
    if (mazeContainer) {
        scene.remove(mazeContainer);
    }
    
    // 新しいコンテナを作成
    mazeContainer = new THREE.Group();
    scene.add(mazeContainer);
    
    return mazeContainer;
}

// レンダリング処理
function render() {
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// ウィンドウリサイズ時の処理
function onWindowResize() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// カメラの位置を調整
function adjustCamera() {
    camera.position.set(0, 25, 25);
    camera.lookAt(0, 0, 0);
}

// マテリアルの作成ヘルパー
function createStandardMaterial(color, metalness = 0.3, roughness = 0.6, emissive = 0x000000, emissiveIntensity = 0) {
    return new THREE.MeshStandardMaterial({
        color: color,
        metalness: metalness,
        roughness: roughness,
        emissive: emissive,
        emissiveIntensity: emissiveIntensity
    });
}

// エフェクトライトの作成
function createPointLight(color, intensity, distance) {
    return new THREE.PointLight(color, intensity, distance);
}

// =========================================
// 物理エンジン関連の関数
// =========================================

// 物理エンジンの初期化
function initPhysics() {
    // CANNON.jsの世界を作成
    world = new CANNON.World();
    world.gravity.set(0, -9.82, 0); // 重力設定
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;
    
    // 衝突イベントのリスナーを追加
    world.addEventListener('postStep', handleCollisions);
}

// 物理シミュレーションの更新
function updatePhysics(mazeContainer, deltaTime) {
    // 迷路とボールが存在しない場合は処理しない
    if (!mazeContainer || !ballBody) return;
    
    // 迷路の傾きに応じて重力方向を変更
    const gravityStrength = 15; // 重力の強さ
    world.gravity.set(
        -Math.sin(mazeContainer.rotation.z) * gravityStrength,
        -9.8, // 通常の重力
        Math.sin(mazeContainer.rotation.x) * gravityStrength
    );
    
    // 物理世界の更新
    world.step(timeStep);
    
    // ボールの位置と回転を更新
    updateBallPosition();
}

// ボールの位置と回転を更新
function updateBallPosition() {
    if (ball && ballBody) {
        // 物理ボディの位置をボールメッシュに適用
        ball.position.copy(new THREE.Vector3(
            ballBody.position.x,
            ballBody.position.y,
            ballBody.position.z
        ));
        
        // 回転も同期
        ball.quaternion.copy(new THREE.Quaternion(
            ballBody.quaternion.x,
            ballBody.quaternion.y,
            ballBody.quaternion.z,
            ballBody.quaternion.w
        ));
        
        // 位置を保存（衝突判定用）
        ballPosition.copy(ball.position);
        
        // ボールが落下した場合のチェック
        if (ball.position.y < -5) {
            // イベントを発火して、ゲームオーバー処理を行う
            const event = new CustomEvent('ballFallOut');
            document.dispatchEvent(event);
        }
    }
}

// ボールの作成
function createBall(x = 0, y = 1.0, z = 0, color = 0xFF4500) {
    try {
        // 既存のボールがあれば削除
        if (ball) {
            scene.remove(ball);
            ball = null;
        }
        
        if (ballBody) {
            world.removeBody(ballBody);
            ballBody = null;
        }
        
        // ボールのサイズを調整
        const ballGeometry = new THREE.SphereGeometry(0.5, 16, 16); // ポリゴン数を削減
        const ballMaterial = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.3,
            roughness: 0.4
        });
        
        // ボールメッシュの作成
        ball = new THREE.Mesh(ballGeometry, ballMaterial);
        ball.castShadow = true;
        ball.position.set(x, y, z);
        
        // ボールの物理ボディを作成
        const ballShape = new CANNON.Sphere(0.5);
        ballBody = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(x, y, z),
            shape: ballShape,
            linearDamping: 0.4,
            angularDamping: 0.4
        });
        
        world.addBody(ballBody);
        
        // ボールの周囲に光のエフェクト（軽量化）
        const ballLight = new THREE.PointLight(color, 0.4, 2);
        ballLight.position.set(0, 0, 0);
        ball.add(ballLight);
        
        console.log("ボールが正常に作成されました", ball.position);
        
        return ball;
    } catch (e) {
        console.error("ボール作成エラー:", e);
        
        // 最小限のフォールバック
        try {
            const simpleGeometry = new THREE.SphereGeometry(0.5, 8, 8);
            const simpleMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
            ball = new THREE.Mesh(simpleGeometry, simpleMaterial);
            ball.position.set(x, y, z);
            
            const simpleShape = new CANNON.Sphere(0.5);
            ballBody = new CANNON.Body({
                mass: 1,
                position: new CANNON.Vec3(x, y, z),
                shape: simpleShape
            });
            world.addBody(ballBody);
            
            return ball;
        } catch (innerError) {
            console.error("フォールバックボール作成にも失敗:", innerError);
            return null;
        }
    }
}


// 壁の物理ボディを作成
function createWallBody(x, y, z, width, height, depth) {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const halfDepth = depth / 2;
    
    const wallShape = new CANNON.Box(new CANNON.Vec3(halfWidth, halfHeight, halfDepth));
    const wallBody = new CANNON.Body({
        mass: 0, // 質量0で固定
        position: new CANNON.Vec3(x, y + halfHeight, z),
        shape: wallShape
    });
    
    world.addBody(wallBody);
    walls.push(wallBody);
    
    return wallBody;
}

// 床の物理ボディを作成
function createFloorBody(x, y, z, width, height, depth) {
    const floorShape = new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2));
    const floorBody = new CANNON.Body({
        mass: 0, // 質量0で固定
        position: new CANNON.Vec3(x, y, z),
        shape: floorShape
    });
    
    world.addBody(floorBody);
    
    return floorBody;
}

// 物理世界のクリア
function clearPhysics() {
    // すべての物理ボディを削除
    if (world) {
        const bodies = world.bodies.slice(); // コピーを作成
        for (const body of bodies) {
            world.removeBody(body);
        }
    }
    
    // 配列をリセット
    walls = [];
    ballBody = null;
    ball = null;
}

// =========================================
// コントロール関連の関数
// =========================================

// コントロールの初期化
// コントロールの初期化関数を修正
// コントロールの初期化
function initControls() {
    // デフォルトはクリック操作に固定
    controlMode = 'click';
    
    // 操作モード選択UIを非表示（スマホでも表示しない）
    document.getElementById('control-options').style.display = 'none';
    
    // 操作方法説明の更新（クリック/タップ操作のみに）
    document.getElementById('controls').innerHTML = 
        '画面をクリック/タップしてボールを転がす方向を指定します<br>すべてのコインを集めてから、緑の旗（ゴール）に到達してください！';
    
    // 操作UIの更新
    updateControlUI();
}
// function initControls() {
//     // モバイルデバイスの検出
//     const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
//     // デフォルトはクリック操作
//     controlMode = 'click';
    
//     // モバイルの場合は制御モード選択UIを表示
//     if (isMobile) {
//         document.getElementById('control-options').style.display = 'flex';
        
//         // 操作方法説明の更新
//         document.getElementById('controls').innerHTML = 
//             '画面をクリック/タップしてボールを転がす方向を指定します<br>または「傾き操作」を選択するとデバイスを傾けて操作できます';
//     } else {
//         // PCでは常にクリック操作
//         document.getElementById('control-options').style.display = 'none';
//     }
    
//     // 傾きモードスイッチのリスナーを設定
//     const tiltControl = document.getElementById('tilt-control');
//     const clickControl = document.getElementById('click-control');
    
//     if (tiltControl) {
//         tiltControl.addEventListener('click', enableTiltControl);
//     }
    
//     if (clickControl) {
//         clickControl.addEventListener('click', () => {
//             setControlMode('click');
//         });
//     }
    
//     // タッチ操作はオプションから削除（タッチはクリックと同等）
//     const touchControl = document.getElementById('touch-control');
//     if (touchControl) {
//         touchControl.style.display = 'none';
//     }
    
//     updateControlUI();
// }

// 傾き操作を有効化する関数
function enableTiltControl() {
    // 傾き操作に切り替え
    setControlMode('tilt');
    
    // iOSの場合は許可が必要
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
            .then(response => {
                if (response === 'granted') {
                    hasDeviceMotion = true;
                    setupDeviceMotion();
                    showMessage('傾きセンサーが有効になりました。デバイスを傾けてボールを操作できます', 3000);
                } else {
                    // 許可されなかった場合はクリックモードに戻す
                    setControlMode('click');
                    showMessage('センサーへのアクセスが許可されませんでした。クリック操作を使用します', 3000);
                }
            })
            .catch(error => {
                console.error('センサーエラー:', error);
                setControlMode('click');
                showMessage('センサーへのアクセスエラー。クリック操作を使用します', 3000);
            });
    } else {
        // Android等、許可が不要なデバイス
        hasDeviceMotion = true;
        setupDeviceMotion();
        showMessage('傾きセンサーが有効になりました。デバイスを傾けてボールを操作できます', 3000);
    }
}

// デバイスモーションのセットアップ
function setupDeviceMotion() {
    // 既存のリスナーを削除
    window.removeEventListener('devicemotion', onDeviceMotion);
    
    // 新しいリスナーを追加
    window.addEventListener('devicemotion', onDeviceMotion, false);
    
    // キャリブレーション
    calibrateTilt();
}

// 傾きのキャリブレーション
let tiltOffsetX = 0;
let tiltOffsetZ = 0;

function calibrateTilt() {
    showMessage('デバイスを水平に保持してください...キャリブレーション中', 2000);
    
    // 2秒後にキャリブレーション完了
    setTimeout(() => {
        // 現在の傾きを0とみなす
        tiltOffsetX = currentTiltX;
        tiltOffsetZ = currentTiltZ;
        
        showMessage('キャリブレーション完了！デバイスを傾けてボールを操作してください', 2000);
    }, 2000);
}


// デバイスモーションイベント処理
function onDeviceMotion(event) {
    if (controlMode !== 'tilt' || !gameState.isGameStarted || 
        gameState.isGameOver || gameState.isLevelCompleted) return;
    
    // デバイスの傾きを取得
    const acceleration = event.accelerationIncludingGravity;
    if (!acceleration || acceleration.x === null || acceleration.y === null) return;
    
    // 傾きの感度係数
    const sensitivity = 0.03;
    
    // デバイスの向きに応じた傾きを計算
    if (window.orientation === 0) {
        // 縦向き
        currentTiltZ = Math.max(-maxTilt, Math.min(maxTilt, (acceleration.x * sensitivity) - tiltOffsetZ));
        currentTiltX = Math.max(-maxTilt, Math.min(maxTilt, (acceleration.y * sensitivity) - tiltOffsetX));
    } else if (window.orientation === 90) {
        // 横向き（右）
        currentTiltZ = Math.max(-maxTilt, Math.min(maxTilt, (-acceleration.y * sensitivity) - tiltOffsetZ));
        currentTiltX = Math.max(-maxTilt, Math.min(maxTilt, (acceleration.x * sensitivity) - tiltOffsetX));
    } else if (window.orientation === -90) {
        // 横向き（左）
        currentTiltZ = Math.max(-maxTilt, Math.min(maxTilt, (acceleration.y * sensitivity) - tiltOffsetZ));
        currentTiltX = Math.max(-maxTilt, Math.min(maxTilt, (-acceleration.x * sensitivity) - tiltOffsetX));
    } else {
        // 逆さま
        currentTiltZ = Math.max(-maxTilt, Math.min(maxTilt, (-acceleration.x * sensitivity) - tiltOffsetZ));
        currentTiltX = Math.max(-maxTilt, Math.min(maxTilt, (-acceleration.y * sensitivity) - tiltOffsetX));
    }
}


// 操作モードの設定
function setControlMode(mode) {
    controlMode = mode;
    
    // クリック操作と傾き操作で選択状態を表示
    const tiltControl = document.getElementById('tilt-control');
    const clickControl = document.getElementById('click-control');
    
    if (tiltControl) {
        tiltControl.classList.toggle('option-selected', mode === 'tilt');
    }
    
    if (clickControl) {
        clickControl.classList.toggle('option-selected', mode === 'click');
    }
    
    // 操作説明の更新
    updateControlUI();
}




// 操作UIの更新
function updateControlUI() {
    const controlsText = document.getElementById('controls');
    if (controlsText) {
        if (controlMode === 'tilt') {
            controlsText.innerHTML = 'デバイスを傾けてボールを動かします<br>すべてのコインを集めてからゴール（緑の旗）に到達してください！';
        } else {
            controlsText.innerHTML = '画面をクリック/タップしてボールを転がす方向を指定します<br>すべてのコインを集めてからゴール（緑の旗）に到達してください！';
        }
    }
}

// イベントリスナーの設定
function setupEventListeners() {
    // キーボード操作
    window.addEventListener('keydown', onKeyDown, false);
    window.addEventListener('keyup', onKeyUp, false);
    
    // マウス/タッチ操作
    const canvas = document.getElementById('game-canvas');
    canvas.addEventListener('mousedown', onPointerDown);
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
}

// マウス/タッチ操作の処理
function onPointerDown(event) {
    if (!gameState.isGameStarted || gameState.isGameOver || gameState.isLevelCompleted) return;
    
    // マウスクリック位置をNDC座標に変換
    const rect = event.target.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // カメラとレイキャスト
    handleClick({ x, y });
}

// タッチイベントの処理
function handleTouch(event) {
    event.preventDefault();
    
    if (!gameState.isGameStarted || gameState.isGameOver || gameState.isLevelCompleted) return;
    
    const touch = event.touches[0];
    const rect = event.target.getBoundingClientRect();
    
    // タッチ位置をNDC座標に変換
    const x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
    
    // クリック処理を呼び出し
    handleClick({ x, y });
}

// クリック処理の関数を修正
function handleClick(pointer) {
    // カメラが初期化されていなければ処理しない
    if (!camera) return;
    
    // レイキャスト
    raycaster.setFromCamera(pointer, camera);
    
    // 平面との交点を計算
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersectPoint);
    
    // ボールからクリック位置への方向ベクトル
    const ballPos = ball ? ball.position.clone() : new THREE.Vector3(0, 0, 0);
    const direction = new THREE.Vector3().subVectors(intersectPoint, ballPos).normalize();
    
    // ※※※ ここが重要 ※※※
    // クリックした方向に直接ボールが転がるように符号を調整
    // 物理的には「迷路を左に傾けるとボールは右に転がる」だが
    // 直感的には「右をクリックしたらボールが右に転がる」方が自然
    targetTiltZ = -direction.x * maxTilt; // X方向はそのまま
    targetTiltX = direction.z * maxTilt; // Z方向は逆に
    
    // 徐々に傾けるアニメーション
    animateTilt();
}


// 方向を日本語で説明する補助関数
function getDirectionName(direction) {
    // 主要な方向を判定
    const absX = Math.abs(direction.x);
    const absZ = Math.abs(direction.z);
    
    if (absX > absZ * 2) {
        return direction.x > 0 ? "右" : "左";
    } else if (absZ > absX * 2) {
        return direction.z > 0 ? "下" : "上";
    } else if (absX > absZ) {
        return direction.x > 0 ? (direction.z > 0 ? "右下" : "右上") : (direction.z > 0 ? "左下" : "左上");
    } else {
        return direction.z > 0 ? (direction.x > 0 ? "右下" : "左下") : (direction.x > 0 ? "右上" : "左上");
    }
}

// 傾きアニメーション
function animateTilt() {
    // 現在の傾きを目標値に近づける
    currentTiltX += (targetTiltX - currentTiltX) * 0.1;
    currentTiltZ += (targetTiltZ - currentTiltZ) * 0.1;
    
    // ある程度近づいたら終了
    if (Math.abs(currentTiltX - targetTiltX) > 0.001 || 
        Math.abs(currentTiltZ - targetTiltZ) > 0.001) {
        requestAnimationFrame(animateTilt);
    } else {
        // ボールが止まったら徐々に傾きを戻す
        setTimeout(() => {
            const restoreSpeed = 0.05;
            
            function restoreTilt() {
                currentTiltX *= (1 - restoreSpeed);
                currentTiltZ *= (1 - restoreSpeed);
                
                if (Math.abs(currentTiltX) > 0.01 || Math.abs(currentTiltZ) > 0.01) {
                    requestAnimationFrame(restoreTilt);
                } else {
                    currentTiltX = 0;
                    currentTiltZ = 0;
                }
            }
            
            restoreTilt();
        }, 1000);
    }
}

// キーボードのキーが押された時の処理
function onKeyDown(event) {
    if (!gameState.isGameStarted || gameState.isGameOver || gameState.isLevelCompleted) return;
    
    switch (event.key) {
        case 'ArrowUp':
        case 'w':
            currentTiltX = -maxTilt;
            break;
        case 'ArrowDown':
        case 's':
            currentTiltX = maxTilt;
            break;
        case 'ArrowLeft':
        case 'a':
            currentTiltZ = -maxTilt;
            break;
        case 'ArrowRight':
        case 'd':
            currentTiltZ = maxTilt;
            break;
        case 'r':
            restartLevel();
            break;
    }
}

// キーボードのキーが離された時の処理
function onKeyUp(event) {
    if (!gameState.isGameStarted || gameState.isGameOver || gameState.isLevelCompleted) return;
    
    switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'ArrowDown':
        case 's':
            currentTiltX = 0;
            break;
        case 'ArrowLeft':
        case 'a':
        case 'ArrowRight':
        case 'd':
            currentTiltZ = 0;
            break;
    }
}

// 現在の傾きを返す
function getCurrentTilt() {
    return { x: currentTiltX, z: currentTiltZ };
}

// =========================================
// 衝突判定関連の関数
// =========================================

// 衝突処理
function handleCollisions() {
    // ボールが存在しない場合は処理しない
    if (!ball) return;
    
    // コイン収集
    handleCoinCollisions(ballPosition, ballRadius);
    
    // ゴールとの接触
    handleGoalCollisions(ballPosition, ballRadius);
    
    // 穴落下
    handleHoleCollisions(ballPosition, ballRadius);
}

// コインとの衝突判定
function handleCoinCollisions(ballPosition, ballRadius) {
    // 現在の時間を取得
    const now = Date.now();
    
    // クールダウン期間を短縮
    const COLLISION_COOLDOWN = 50; // 500msから50msに大幅短縮
    
    // クールダウン期間中は衝突判定をスキップ
    if (now - lastCollisionTime < COLLISION_COOLDOWN) {
        return;
    }
    
    // コインを直接チェック（最適化）
    for (let i = 0; i < coins.length; i++) {
        const coin = coins[i];
        
        if (!coin || !coin.visible) continue;
        
        // ボールとコインの距離を計算
        const distance = ballPosition.distanceTo(coin.position);
        
        // 衝突判定の余裕を増やす
        const COIN_COLLISION_MARGIN = 0.8; // 0.3から0.8に増加
        
        // 衝突判定
        if (distance < ballRadius + COIN_COLLISION_MARGIN) {
            // 同じコインとの連続衝突を防止
            if (coin.uuid === lastCollidedCoinId) {
                continue;
            }
            
            // コインを非表示にする
            coin.visible = false;
            
            // ライトも削除
            if (coin.children.length > 0) {
                for (let j = coin.children.length - 1; j >= 0; j--) {
                    coin.remove(coin.children[j]);
                }
            }
            
            // コインを配列から削除
            removeCoin(coin);
            
            // 最後に衝突したコインを記録
            lastCollidedCoinId = coin.uuid;
            lastCollisionTime = now;
            
            // スコア加算
            gameState.score += 100;
            updateScore();
            
            // エフェクト表示（軽量化）
            if (particleCount < MAX_PARTICLES) {
                createCollectEffect(coin.position.clone());
            }
            
            // 効果音再生
            playSound('coin');
            
            // コインをすべて集めたかチェック
            if (getCoinsCount() === 0) {
                setAllCoinsCollected(true);
                showMessage('すべてのコインを集めました！ゴールを目指しましょう！', 3000);
            }
            
            // 一度に1つのコインだけ処理
            break;
        }
    }
}

// ゴールとの衝突判定
function handleGoalCollisions(ballPosition, ballRadius) {
    if (!goal || isLevelCompleted) return;
    
    const distance = ballPosition.distanceTo(goal.position);
    
    // ゴール条件：コインをすべて集めていて、ゴールに触れた場合
    if (distance < ballRadius + 1.5 && allCoinsCollected) {
        setLevelComplete(true);
        
        // レベルクリア処理
        handleLevelComplete();
    } else if (distance < ballRadius + 1.5 && !allCoinsCollected && getCoinsCount() > 0) {
        // まだコインが残っている場合のメッセージ
        showMessage('先にすべてのコインを集めましょう！', 2000);
    }
}

// レベルクリア処理
function handleLevelComplete() {
    // スコア加算（残り時間ボーナス）
    const timeBonus = Math.max(0, 300 - gameState.gameTime) * 2;
    gameState.score += 500 + timeBonus;
    updateScore();
    
    // エフェクト表示
    createGoalEffect();
    
    // 効果音再生
    playSound('goal');
    
    // ゲーム状態を更新
    gameState.isLevelCompleted = true;
    
    // レベルクリアメッセージ表示
    setTimeout(() => {
        const event = new CustomEvent('levelComplete');
        document.dispatchEvent(event);
    }, 1000);
}

// 穴との衝突判定
function handleHoleCollisions(ballPosition, ballRadius) {
    for (let i = 0; i < holes.length; i++) {
        const hole = holes[i];
        const distanceToHole = new THREE.Vector2(
            ballPosition.x - hole.position.x,
            ballPosition.z - hole.position.z
        ).length();
        
        // ボールが穴に落ちた判定
        if (distanceToHole < hole.userData.radius && !gameState.isGameOver && ballPosition.y < 1) {
            // 穴に落ちた処理
            handleFallIntoHole();
            break;
        }
    }
}

// 穴に落ちた時の処理
// 穴に落ちた時の処理を修正
function handleFallIntoHole() {
    // 既にゲームオーバーなら何もしない
    if (gameState.isGameOver) return;
    
    gameState.isGameOver = true;
    
    // ボールを落下させるアニメーション
    const fallAnimation = () => {
        if (ball && ball.position.y > -5) {
            ball.position.y -= 0.2;
            requestAnimationFrame(fallAnimation);
        } else {
            // 効果音再生
            playSound('fall');
            
            // 少し遅延してからゲームオーバーメッセージを表示
            setTimeout(() => {
                const event = new CustomEvent('gameOver');
                document.dispatchEvent(event);
            }, 500);
        }
    };
    
    // ボールが存在する場合のみアニメーション実行
    if (ball) {
        fallAnimation();
    } else {
        // ボールがない場合は直接ゲームオーバー処理
        setTimeout(() => {
            const event = new CustomEvent('gameOver');
            document.dispatchEvent(event);
        }, 500);
    }
}

// コイン収集エフェクト
function createCollectEffect(position) {
    // パーティクル数をさらに減らす
    const particlesToCreate = 5; // 元の10から5に削減
    const particles = [];
    
    for (let i = 0; i < particlesToCreate; i++) {
        const geometry = new THREE.SphereGeometry(0.08, 4, 4); // さらにポリゴン数を削減
        const material = new THREE.MeshBasicMaterial({
            color: 0xFFD700,
            transparent: true,
            opacity: 0.8
        });
        
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(position);
        
        // ランダムな方向と速度（少し速めに）
        particle.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,
            Math.random() * 0.3 + 0.1,
            (Math.random() - 0.5) * 0.3
        );
        
        // 寿命設定を短く
        particle.lifetime = 0.5; // 0.8から0.5に短縮
        particle.age = 0;
        
        scene.add(particle);
        particles.push(particle);
        particleCount++;
    }
    
    // アニメーション関数も高速化
    function updateParticles() {
        let allDead = true;
        
        for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i];
            particle.age += 0.05; // 更新速度をさらに上げる
            
            if (particle.age < particle.lifetime) {
                allDead = false;
                
                // 位置の更新
                particle.position.add(particle.velocity);
                particle.velocity.y -= 0.02; // 重力効果増加
                
                // 透明度の更新
                particle.material.opacity = 1 - (particle.age / particle.lifetime);
                
                // サイズの縮小も高速化
                const scale = 1 - (particle.age / particle.lifetime) * 0.7;
                particle.scale.set(scale, scale, scale);
            } else {
                // 寿命が尽きたパーティクルを削除
                scene.remove(particle);
                particles.splice(i, 1);
                particleCount--;
            }
        }
        
        if (!allDead) {
            requestAnimationFrame(updateParticles);
        }
    }
    
    // アニメーション開始
    updateParticles();
}

// ゴール到達エフェクト
function createGoalEffect() {
    if (!goal) return;
    
    // 光の輪が広がるエフェクト
    const ringCount = 3;
    const rings = [];
    
    for (let i = 0; i < ringCount; i++) {
        const geometry = new THREE.RingGeometry(0.5, 1, 16); // ポリゴン数を削減
        const material = new THREE.MeshBasicMaterial({
            color: 0x00FFFF,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        const ring = new THREE.Mesh(geometry, material);
        ring.position.copy(goal.position);
        ring.position.y += 0.1;
        ring.rotation.x = Math.PI / 2; // 水平に向ける
        
        // 開始を少しずらす
        ring.delay = i * 0.3;
        ring.scale.set(0.1, 0.1, 0.1);
        
        scene.add(ring);
        rings.push(ring);
    }
    
    // アニメーション関数
    function updateRings() {
        let allDone = true;
        
        for (let i = 0; i < rings.length; i++) {
            const ring = rings[i];
            
            if (ring.delay > 0) {
                ring.delay -= 0.016;
                allDone = false;
            } else if (ring.scale.x < 10) {
                allDone = false;
                
                // サイズの拡大
                ring.scale.x += 0.2;
                ring.scale.y += 0.2;
                
                // 透明度の更新
                ring.material.opacity = Math.max(0, 0.7 - ring.scale.x * 0.07);
            }
        }
        
        if (!allDone) {
            requestAnimationFrame(updateRings);
        } else {
            // 全てのリングのアニメーション終了後、削除
            for (const ring of rings) {
                scene.remove(ring);
            }
        }
    }
    
    // アニメーション開始
    updateRings();
}

// 効果音の再生 - より軽量化
function playSound(type) {
    try {
        // AudioContextの作成（既存があれば再利用）
        if (!window.gameAudioContext) {
            window.gameAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const audioContext = window.gameAudioContext;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        switch (type) {
            case 'coin':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1760, audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime); // 音量を下げる
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.2);
                break;
                
            case 'goal':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(554, audioContext.currentTime + 0.2);
                oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.4);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + 0.4);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.6);
                break;
                
            case 'fall':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(55, audioContext.currentTime + 0.3);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.3);
                break;
        }
    } catch (e) {
        console.log('効果音の再生に失敗しました:', e);
    }
}

// パーティクル数のリセット
function resetParticleCount() {
    particleCount = 0;
}

// =========================================
// レベル関連の関数
// =========================================

// レベルの読み込み
function loadLevel(levelNumber) {
    try {
        // 前のレベルをクリア
        clearLevel();
        
        // ゲーム状態をリセット
        isLevelCompleted = false;
        allCoinsCollected = false;
        
        // レベル表示を更新
        document.getElementById('level-value').textContent = levelNumber;
        
        // 迷路コンテナを作成
        const mazeContainer = createMazeContainer();
        
        // 迷路の床を作成
        createMazeBase(mazeContainer);
        
        // 迷路の壁を作成
        createMazeWalls(mazeContainer, levelNumber);
        
        // 穴を追加（レベル2以降）
        if (levelNumber >= 2) {
            addHoles(mazeContainer, levelNumber);
        }
        
        // 障害物を配置（レベル2以降）
        if (levelNumber >= 2) {
            placeObstacles(mazeContainer, levelNumber);
        }
        
        // ゴールを配置
        createGoal(mazeContainer);
        
        // コインを配置（ボールとゴールを避けた安全な場所に）
        placeCoins(mazeContainer, levelNumber);
        
        // すべてのレベルで安全な固定位置にボールを配置
        // レベルごとに安全な位置を指定
        let ballX = 0, ballY = 1.0, ballZ = 0;
        
        // レベル3以降では右下にスタート位置を変更
        if (levelNumber >= 3) {
            ballX = -7;
            ballZ = -7;
        }
        
        const ball = createBall(ballX, ballY, ballZ);
        if (ball) {
            mazeContainer.add(ball);
            console.log(`レベル ${levelNumber} でボールを位置 (${ballX}, ${ballY}, ${ballZ}) に配置しました`);
        }
        
        // レベル開始メッセージ
        if (gameState.isGameStarted) {
            showMessage(`レベル ${levelNumber} 開始！`, 2000);
        }
    } catch (e) {
        console.error("レベル読み込みエラー:", e);
        setTimeout(restartLevel, 1000);
    }
}

// 迷路の床の作成
function createMazeBase(mazeContainer) {
    // 床のジオメトリとマテリアル
    const floorGeometry = new THREE.BoxGeometry(mazeSize, 1, mazeSize);
    const floorMaterial = createStandardMaterial(0x808080, 0.2, 0.8);
    
    // 床メッシュの作成
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.receiveShadow = true;
    floor.position.y = -0.5; // 床の厚みを考慮して位置調整
    mazeContainer.add(floor);
    
    // 床の物理ボディを作成
    createFloorBody(0, -0.5, 0, mazeSize, 1, mazeSize);
}

// 迷路の壁の作成
function createMazeWalls(mazeContainer, levelNumber) {
    const wallHeight = 1.2;
    const wallThickness = 0.8;
    
    // 外周の壁を作成
    const outerWalls = [
        // 北壁
        { pos: [0, 0, -mazeSize/2], size: [mazeSize, wallHeight, wallThickness] },
        // 南壁
        { pos: [0, 0, mazeSize/2], size: [mazeSize, wallHeight, wallThickness] },
        // 東壁
        { pos: [mazeSize/2, 0, 0], size: [wallThickness, wallHeight, mazeSize] },
        // 西壁
        { pos: [-mazeSize/2, 0, 0], size: [wallThickness, wallHeight, mazeSize] }
    ];
    
    // 外周壁を作成
    outerWalls.forEach(wall => {
        addWall(mazeContainer, wall.pos[0], wall.pos[1], wall.pos[2], wall.size[0], wall.size[1], wall.size[2]);
    });
    
    // レベルに応じた内部の壁を追加
    const innerWalls = getLevelWalls(levelNumber);
    innerWalls.forEach(wall => {
        addWall(mazeContainer, wall.pos[0], wall.pos[1], wall.pos[2], wall.size[0], wall.size[1], wall.size[2]);
    });
}

// 壁の追加
function addWall(mazeContainer, x, y, z, width, height, depth) {
    // 壁のジオメトリとマテリアル
    const wallGeometry = new THREE.BoxGeometry(width, height, depth);
    const wallMaterial = createStandardMaterial(0x8B4513, 0.1, 0.8); // 茶色
    
    // 壁メッシュの作成
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.castShadow = true;
    wall.receiveShadow = true;
    wall.position.set(x, y + height/2, z);
    wall.userData = { type: 'wall' };
    mazeContainer.add(wall);
    
    // 壁の物理ボディを作成
    createWallBody(x, y, z, width, height, depth);
}

// 各レベルの壁の配置を取得
function getLevelWalls(levelNumber) {
    switch (levelNumber) {
        case 1:
            // 初級レベル - シンプルな迷路
            return [
                { pos: [-5, 0, -2], size: [8, 1.2, 0.8] },
                { pos: [3, 0, 5], size: [0.8, 1.2, 8] },
                { pos: [-1, 0, 0], size: [0.8, 1.2, 10] }
            ];
        case 2:
            // 中級レベル - より複雑な迷路
            return [
                { pos: [-6, 0, -5], size: [6, 1.2, 0.8] },
                { pos: [5, 0, -3], size: [0.8, 1.2, 12] },
                { pos: [-2, 0, 3], size: [10, 1.2, 0.8] },
                { pos: [-6, 0, 0], size: [0.8, 1.2, 6] },
                { pos: [0, 0, -2], size: [8, 1.2, 0.8] }
            ];
        case 3:
            // 上級レベル - 複雑な迷路構造
            return [
                { pos: [-7, 0, -5], size: [4, 1.2, 0.8] },
                { pos: [3, 0, -6], size: [0.8, 1.2, 8] },
                { pos: [-3, 0, 3], size: [12, 1.2, 0.8] },
                { pos: [-4, 0, -2], size: [0.8, 1.2, 10] },
                { pos: [7, 0, -2], size: [4, 1.2, 0.8] },
                { pos: [0, 0, 0], size: [8, 1.2, 0.8] },
                { pos: [0, 0, 5], size: [0.8, 1.2, 6] }
            ];
        default:
            // それ以降のレベル - ランダム生成
            return generateRandomWalls(levelNumber);
    }
}

// ランダムな壁の生成（高レベル用）
function generateRandomWalls(levelNumber) {
    const walls = [];
    const wallCount = 5 + levelNumber; // レベルに応じて壁の数を増やす
    
    for (let i = 0; i < wallCount; i++) {
        // ランダムな位置と向き
        const isHorizontal = Math.random() > 0.5;
        const size = isHorizontal 
            ? [4 + Math.random() * 8, 1.2, 0.8] 
            : [0.8, 1.2, 4 + Math.random() * 8];
        
        // 位置の範囲制限（迷路内に収める）
        const maxX = mazeSize / 2 - size[0] / 2 - 2;
        const maxZ = mazeSize / 2 - size[2] / 2 - 2;
        
        const x = (Math.random() * 2 - 1) * maxX;
        const z = (Math.random() * 2 - 1) * maxZ;
        
        // スタート位置とゴール位置の近くには壁を置かない
        const distanceToStart = Math.sqrt(x * x + z * z);
        const distanceToGoal = Math.sqrt(Math.pow(x - mazeSize/2 + 2, 2) + Math.pow(z - mazeSize/2 + 2, 2));
        
        if (distanceToStart < 5 || distanceToGoal < 5) {
            i--; // やり直し
            continue;
        }
        
        // 他の壁と重ならないかチェック
        let overlaps = false;
        for (const wall of walls) {
            const dx = Math.abs(x - wall.pos[0]);
            const dz = Math.abs(z - wall.pos[2]);
            if (dx < (size[0] + wall.size[0]) / 2 + 1 && 
                dz < (size[2] + wall.size[2]) / 2 + 1) {
                overlaps = true;
                break;
            }
        }
        
        if (overlaps) {
            i--; // やり直し
            continue;
        }
        
        // 壁を追加
        walls.push({
            pos: [x, 0, z],
            size: size
        });
    }
    
    return walls;
}

// 穴の追加
// addHoles関数の修正 - レベル2で追加される穴の処理を安全に
// addHoles関数を改善：安全な場所に穴を配置
function addHoles(mazeContainer, levelNumber) {
    try {
        // レベル1では穴なし
        if (levelNumber < 2) return;
        
        // レベルに応じた穴の数（少なめに）
        const holeCount = Math.min(2, levelNumber - 1);
        
        // 固定の配置位置（安全なエリア）
        const safePositions = [
            // レベル2用
            [
                {x: 7, z: -7}, // 右下隅
                {x: -7, z: 7}  // 左上隅
            ],
            // レベル3以降用
            [
                {x: 7, z: -7},
                {x: -7, z: 7},
                {x: 7, z: 7}
            ]
        ];
        
        // 現在のレベルの安全な位置を選択
        const levelIndex = Math.min(levelNumber - 2, 1);
        const positions = safePositions[levelIndex];
        
        for (let i = 0; i < Math.min(holeCount, positions.length); i++) {
            const pos = positions[i];
            const x = pos.x;
            const z = pos.z;
            
            // 穴のサイズ（やや小さめに）
            const holeSize = 0.8;
            
            // 穴のジオメトリを作成
            const holeGeometry = new THREE.CircleGeometry(holeSize, 32);
            const holeMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x000000,
                side: THREE.DoubleSide
            });
            
            const hole = new THREE.Mesh(holeGeometry, holeMaterial);
            hole.rotation.x = -Math.PI / 2; // 水平に向ける
            hole.position.set(x, 0.01, z); // 床のすぐ上に配置
            hole.userData = { radius: holeSize, type: 'hole' };
            mazeContainer.add(hole);
            holes.push(hole);
            
            // 穴の周囲に警告用の赤い枠を追加
            const ringGeometry = new THREE.RingGeometry(holeSize, holeSize + 0.2, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0xFF0000,
                side: THREE.DoubleSide
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = -Math.PI / 2;
            ring.position.set(x, 0.02, z);
            mazeContainer.add(ring);
            
            // 穴の周りに警告用のポイントライト
            const warningLight = new THREE.PointLight(0xFF0000, 0.5, 3);
            warningLight.position.set(0, 0.2, 0);
            hole.add(warningLight);
        }
        
        // 穴の説明（初めて穴が登場するレベルでのみ表示）
        if (levelNumber === 2) {
            setTimeout(() => {
                showMessage('赤い縁取りのある黒い円は落とし穴です！落ちないように注意してください！', 5000);
            }, 2000);
        }
    } catch (e) {
        console.error("穴の作成エラー:", e);
    }
}

function placeCoins(mazeContainer, levelNumber) {
    // 前のコインを削除
    coins = [];
    
    // 穴の位置を先に取得
    const holePositions = [];
    mazeContainer.traverse(object => {
        if (object.userData && object.userData.type === 'hole') {
            holePositions.push({
                x: object.position.x,
                z: object.position.z,
                radius: object.userData.radius + 2.0 // 余裕を十分に取る
            });
        }
    });
    
    // 各レベルで完全に固定された安全な位置を定義
    const levelPositions = {
        1: [ // レベル1のコイン位置
            {x: -6, z: -6}, // 左上隅付近
            {x: 6, z: -6},  // 右上隅付近
            {x: -6, z: 6}   // 左下隅付近
        ],
        2: [ // レベル2のコイン位置
            {x: -6, z: -6}, // 左上隅付近
            {x: 6, z: -6},  // 右上隅付近
            {x: 0, z: 0}    // 中央（穴から離れた場所）
        ],
        3: [ // レベル3のコイン位置
            {x: 6, z: -6},   // 右上隅付近
            {x: 6, z: 6},    // 右下隅付近
            {x: -4, z: 0}    // 左中央付近
        ],
        4: [ // レベル4以降のコイン位置
            {x: 6, z: -6},  // 右上隅付近
            {x: 6, z: 6},   // 右下隅付近
            {x: -3, z: -3}  // 左上中央付近
        ],
        5: [ // レベル5のコイン位置（予備）
            {x: 6, z: -6},  // 右上隅付近
            {x: -6, z: 6},  // 左下隅付近
            {x: 0, z: -4}   // 上部中央付近
        ]
    };
    
    // 使用する位置を選択（レベル5以上はレベル5と同じ配置）
    let safePositions = levelPositions[Math.min(levelNumber, 5)] || levelPositions[5];
    
    // 穴と衝突するコイン位置をフィルタリング
    let filteredPositions = safePositions.filter(pos => {
        // 穴との重なりをチェック
        for (const hole of holePositions) {
            const dist = Math.sqrt(
                Math.pow(pos.x - hole.x, 2) + 
                Math.pow(pos.z - hole.z, 2)
            );
            if (dist < hole.radius) {
                console.log(`コイン位置 (${pos.x}, ${pos.z}) は穴と重なるため除外します`);
                return false; // 穴と重なる位置を除外
            }
        }
        return true;
    });
    
    // 少なくとも1つのコイン位置を確保
    if (filteredPositions.length === 0) {
        console.log("安全なコイン位置が見つからないため、代替位置を使用します");
        // 穴から離れた代替位置
        filteredPositions = [
            {x: -7, z: 0},  // 左端中央
            {x: 0, z: -7},  // 上端中央
            {x: 7, z: 0}    // 右端中央
        ];
    }
    
    // コインを配置
    for (let i = 0; i < filteredPositions.length; i++) {
        const pos = filteredPositions[i];
        
        // コインを作成
        const coinGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16);
        const coinMaterial = createStandardMaterial(0xFFD700, 1.0, 0.3, 0xFFD700, 0.5);
        
        const coin = new THREE.Mesh(coinGeometry, coinMaterial);
        coin.castShadow = true;
        coin.rotation.x = Math.PI / 2;
        coin.position.set(pos.x, 0.5, pos.z);
        coin.userData = { type: 'coin', id: `coin-${Date.now()}-${i}` };
        mazeContainer.add(coin);
        
        coin.rotationSpeed = 0.05;
        coins.push(coin);
        
        const pointLight = createPointLight(0xFFD700, 0.5, 2);
        pointLight.position.set(0, 0, 0);
        coin.add(pointLight);
    }
    
    // レベル1の説明
    if (levelNumber === 1) {
        setTimeout(() => {
            showMessage('すべての金色のコインを集めてから、緑の旗（ゴール）に到達してください！', 5000);
        }, 3000);
    }
}

// 障害物の配置
function placeObstacles(mazeContainer, levelNumber) {
    try {
        // レベル1では障害物なし
        if (levelNumber < 2) return;
        
        // 既存のコインの位置を取得（重なりを避けるため）
        const coinPositions = [];
        coins.forEach(coin => {
            coinPositions.push({
                x: coin.position.x,
                z: coin.position.z,
                radius: 1.5 // コインの周囲に余裕
            });
        });
        
        // スタート位置を保護エリアとして追加
        const protectedAreas = [
            // スタート位置（原点周辺）
            {x: 0, z: 0, radius: 3.0},
            // ゴール位置（右下）
            {x: mazeSize/2 - 2, z: mazeSize/2 - 2, radius: 3.0}
        ];
        
        // コイン位置も保護エリアに追加
        protectedAreas.push(...coinPositions);
        
        // 壁位置を取得
        const wallAreas = [];
        mazeContainer.traverse(object => {
            if (object.userData && object.userData.type === 'wall') {
                const box = new THREE.Box3().setFromObject(object);
                wallAreas.push(box);
            }
        });
        
        // レベルに応じた固定障害物位置
        const obstaclePositions = {
            2: [{x: 3, z: -3}],  // レベル2の障害物位置
            3: [{x: 0, z: 3}],   // レベル3の障害物位置
            4: [{x: -3, z: 4}],  // レベル4の障害物位置
            5: [{x: 4, z: 4}]    // レベル5の障害物位置
        };
        
        // 現在のレベルの障害物位置を取得（5以上は5と同じ）
        const levelKey = Math.min(levelNumber, 5);
        const positions = obstaclePositions[levelKey] || [];
        
        // 障害物を配置
        if (positions.length > 0) {
            for (const pos of positions) {
                // サイズを小さくした障害物を配置
                createRotatingBlock(mazeContainer, pos.x, pos.z, 1.0);
            }
            
            // 障害物の説明
            if (levelNumber === 2) {
                setTimeout(() => {
                    showMessage('紫色のブロックは回転する障害物です！避けてください！', 4000);
                }, 8000);
            }
        }
    } catch (e) {
        console.error("障害物の作成エラー:", e);
    }
}

// 回転するブロック障害物の関数も修正してサイズ指定を可能に
function createRotatingBlock(mazeContainer, x, z, size = 2) {
    // ブロックのジオメトリとマテリアル（サイズを可変に）
    const blockGeometry = new THREE.BoxGeometry(size, 0.4, size);
    const blockMaterial = createStandardMaterial(0x8B008B); // 紫色
    
    // ブロックメッシュの作成
    const block = new THREE.Mesh(blockGeometry, blockMaterial);
    block.castShadow = true;
    block.receiveShadow = true;
    block.position.set(x, 0.2, z);
    block.userData = { type: 'rotatingBlock' };
    mazeContainer.add(block);
    
    // 回転情報を設定
    block.rotationSpeed = 0.01; // 速度を遅く
    block.isRotating = true;
    
    // 物理ボディを追加（回転するが位置は固定）
    const blockShape = new CANNON.Box(new CANNON.Vec3(size/2, 0.2, size/2));
    const blockBody = new CANNON.Body({
        mass: 0, // 質量0で固定
        position: new CANNON.Vec3(x, 0.2, z),
        shape: blockShape
    });
    
    // 物理世界に追加
    world.addBody(blockBody);
    
    // 障害物オブジェクトに物理ボディを関連付け
    block.userData.physicsBody = blockBody;
    
    obstacles.push(block);
}

// updateObstacles関数を修正して、物理ボディも同期
function updateObstacles(deltaTime) {
    for (let i = 0; i < obstacles.length; i++) {
        const obstacle = obstacles[i];
        
        if (obstacle.userData && obstacle.userData.type === 'rotatingBlock') {
            // 回転するブロック
            obstacle.rotation.y += obstacle.rotationSpeed;
            
            // 物理ボディも回転（物理ボディが存在する場合）
            if (obstacle.userData.physicsBody) {
                const q = new CANNON.Quaternion();
                q.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), obstacle.rotation.y);
                obstacle.userData.physicsBody.quaternion = q;
            }
        }
    }
}

// 上下運動するブロック障害物
function createMovingBlock(mazeContainer, x, z) {
    // ブロックのジオメトリとマテリアル
    const blockGeometry = new THREE.BoxGeometry(1.5, 0.3, 1.5);
    const blockMaterial = createStandardMaterial(0x006400); // 深緑色
    
    // ブロックメッシュの作成
    const block = new THREE.Mesh(blockGeometry, blockMaterial);
    block.castShadow = true;
    block.receiveShadow = true;
    block.position.set(x, 0.15, z);
    block.userData = { type: 'movingBlock' };
    mazeContainer.add(block);
    
    // 移動情報を設定
    block.isMoving = true;
    block.baseY = 0.15;
    block.moveRange = 0.5;
    block.moveSpeed = 0.01;
    block.moveDirection = 1;
    
    obstacles.push(block);
}

// 傾斜面障害物
function createRamp(mazeContainer, x, z) {
    // 傾斜面のジオメトリ
    const rampGeometry = new THREE.BoxGeometry(3, 0.3, 3);
    const rampMaterial = createStandardMaterial(0xCD853F); // 薄茶色
    
    // 傾斜面メッシュの作成
    const ramp = new THREE.Mesh(rampGeometry, rampMaterial);
    ramp.castShadow = true;
    ramp.receiveShadow = true;
    ramp.position.set(x, 0.15, z);
    ramp.userData = { type: 'ramp' };
    
    // ランダムな角度で傾ける
    const angle = Math.random() * Math.PI / 6; // 最大30度
    const rotationAxis = Math.random() > 0.5 ? 'x' : 'z';
    
    if (rotationAxis === 'x') {
        ramp.rotation.x = angle;
    } else {
        ramp.rotation.z = angle;
    }
    
    mazeContainer.add(ramp);
    obstacles.push(ramp);
}

// ゴールの作成
function createGoal(mazeContainer) {
    // ゴールの位置（迷路の右下コーナー付近）
    const goalX = mazeSize / 2 - 2;
    const goalZ = mazeSize / 2 - 2;
    
    // ゴールの床部分
    const goalBaseGeometry = new THREE.CircleGeometry(1.5, 32);
    const goalBaseMaterial = createStandardMaterial(0x00FF00, 0.3, 0.6, 0x00FF00, 0.3);
    
    const goalBase = new THREE.Mesh(goalBaseGeometry, goalBaseMaterial);
    goalBase.rotation.x = -Math.PI / 2; // 水平に向ける
    goalBase.position.set(goalX, 0.02, goalZ);
    mazeContainer.add(goalBase);
    
    // ゴールのフラッグ部分
    const flagPoleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 8);
    const flagPanelGeometry = new THREE.PlaneGeometry(1, 0.7);
    
    const flagPoleMaterial = createStandardMaterial(0x808080);
    const flagPanelMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x00FF00,
        side: THREE.DoubleSide
    });
    
    const flagPole = new THREE.Mesh(flagPoleGeometry, flagPoleMaterial);
    flagPole.position.set(0, 1, 0);
    
    const flagPanel = new THREE.Mesh(flagPanelGeometry, flagPanelMaterial);
    flagPanel.position.set(0.5, 1.5, 0);
    
    // ゴールグループを作成
    goal = new THREE.Group();
    goal.add(goalBase);
    goal.add(flagPole);
    goal.add(flagPanel);
    goal.position.set(goalX, 0, goalZ);
    goal.userData = { type: 'goal' };
    
    mazeContainer.add(goal);
    
    // ゴールのエフェクト光
    const goalLight = createPointLight(0x00FF00, 1, 5);
    goalLight.position.set(0, 1, 0);
    goal.add(goalLight);
    
    // 点滅アニメーション
    const pulseAnimation = () => {
        if (goalBaseMaterial.emissiveIntensity < 0.1) {
            goalBaseMaterial.emissiveIntensity = 0.5;
        } else {
            goalBaseMaterial.emissiveIntensity = 0.1;
        }
        
        setTimeout(pulseAnimation, 500);
    };
    
    pulseAnimation();
}

// 前のレベルをクリア
function clearLevel() {
    // 配列のリセット
    coins = [];
    holes = [];
    obstacles = [];
    goal = null;
    
    // 物理エンジンをクリア
    clearPhysics();
}



// コインの更新
function updateCoins(deltaTime) {
    for (const coin of coins) {
        coin.rotation.y += coin.rotationSpeed;
    }
}

// コイン削除
function removeCoin(coin) {
    const index = coins.indexOf(coin);
    if (index !== -1) {
        coins.splice(index, 1);
    }
}

// コインの数を取得
function getCoinsCount() {
    return coins.length;
}

// すべてのコインが集められたかどうか
function isAllCoinsCollected() {
    return allCoinsCollected;
}

// すべてのコインが集められたフラグをセット
function setAllCoinsCollected(collected) {
    allCoinsCollected = collected;
}

// レベル完了フラグをセット
function setLevelComplete(completed) {
    isLevelCompleted = completed;
}

// レベルをやり直す
// restartLevel関数の修正
// restartLevel関数を完全に書き直し
// restartLevel関数も同様に修正
function restartLevel() {
    try {
        // 傾きを完全にリセット
        currentTiltX = 0;
        currentTiltZ = 0;
        targetTiltX = 0;
        targetTiltZ = 0;
        
        // 迷路の回転もリセット
        if (mazeContainer) {
            mazeContainer.rotation.x = 0;
            mazeContainer.rotation.z = 0;
        }
        
        // ゲーム状態をリセット
        gameState.isGameOver = false;
        gameState.isLevelCompleted = false;
        allCoinsCollected = false;
        
        document.getElementById('message-box').style.display = 'none';
        
        setTimeout(() => {
            clearLevel();
            loadLevel(gameState.level);
            gameState.startTime = Date.now();
            gameState.lastUpdateTime = gameState.startTime;
            
            if (!gameState.isGameStarted) {
                gameState.isGameStarted = true;
            }
        }, 100);
    } catch (e) {
        console.error("レベル再開エラー:", e);
        gameState.level = 1;
        clearLevel();
        loadLevel(1);
        gameState.isGameStarted = true;
        gameState.isGameOver = false;
        gameState.isLevelCompleted = false;
        gameState.startTime = Date.now();
        gameState.lastUpdateTime = gameState.startTime;
    }
}

// =========================================
// UI関連の関数
// =========================================

// スコアの更新
function updateScore() {
    document.getElementById('score-value').textContent = gameState.score;
}

// 時間の更新
function updateTime() {
    if (!gameState.isGameStarted || gameState.isGameOver || gameState.isLevelCompleted) return;
    
    const currentTime = Date.now();
    gameState.gameTime = Math.floor((currentTime - gameState.startTime) / 1000);
    
    const minutes = Math.floor(gameState.gameTime / 60);
    const seconds = gameState.gameTime % 60;
    
    document.getElementById('time-value').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// ゲーム開始メッセージの表示
function showStartMessage() {
    const messageBox = document.getElementById('message-box');
    const messageTitle = document.getElementById('message-title');
    const messageText = document.getElementById('message-text');
    const nextLevelButton = document.getElementById('next-level-button');
    const restartButton = document.getElementById('restart-button');
    
    messageTitle.textContent = 'ボールころがしパズル';
    messageText.innerHTML = `レベル${gameState.level}を開始します！<br><br>すべてのコインを集めてからゴールを目指しましょう！`;
    nextLevelButton.textContent = 'ゲーム開始';
    nextLevelButton.style.display = 'inline-block';
    restartButton.style.display = 'none';
    
    messageBox.style.display = 'block';
}

// レベルクリアメッセージの表示
function showLevelCompleteMessage() {
    const messageBox = document.getElementById('message-box');
    const messageTitle = document.getElementById('message-title');
    const messageText = document.getElementById('message-text');
    const nextLevelButton = document.getElementById('next-level-button');
    const restartButton = document.getElementById('restart-button');
    
    // ボーナス計算
    const timeBonus = Math.max(0, 300 - gameState.gameTime) * 2;
    
    messageTitle.textContent = 'レベルクリア！';
    messageText.innerHTML = `タイム: ${document.getElementById('time-value').textContent}<br>
                          スコア: ${gameState.score - 500 - timeBonus}<br>
                          ボーナス: +500<br>
                          タイムボーナス: +${timeBonus}<br>
                          合計: ${gameState.score}`;
    nextLevelButton.textContent = '次のレベル';
    nextLevelButton.style.display = 'inline-block';
    restartButton.textContent = 'もう一度';
    restartButton.style.display = 'inline-block';
    
    messageBox.style.display = 'block';
}

// ゲームオーバーメッセージの表示
function showGameOverMessage() {
    const messageBox = document.getElementById('message-box');
    const messageTitle = document.getElementById('message-title');
    const messageText = document.getElementById('message-text');
    const nextLevelButton = document.getElementById('next-level-button');
    const restartButton = document.getElementById('restart-button');
    
    messageTitle.textContent = 'ゲームオーバー';
    messageText.innerHTML = 'ボールが穴に落ちてしまいました！<br>もう一度チャレンジしましょう。';
    nextLevelButton.style.display = 'none';
    restartButton.textContent = 'やり直す';
    restartButton.style.display = 'inline-block';
    
    messageBox.style.display = 'block';
}

// 一時的なメッセージ表示
function showMessage(text, duration = 2000) {
    // 既存のメッセージを削除
    const existingMessage = document.getElementById('temp-message');
    if (existingMessage) {
        document.body.removeChild(existingMessage);
    }
    
    // 新しいメッセージ要素を作成
    const messageElement = document.createElement('div');
    messageElement.id = 'temp-message';
    messageElement.innerHTML = text;
    
    document.body.appendChild(messageElement);
    
    // 指定時間後にメッセージをフェードアウト
    setTimeout(() => {
        messageElement.style.opacity = '0';
        // フェードアウト後に要素を削除
        setTimeout(() => {
            if (messageElement.parentNode) {
                document.body.removeChild(messageElement);
            }
        }, 500);
    }, duration);
}

// =========================================
// メインゲーム初期化と実行
// =========================================

// メインのゲーム初期化

// 初期化時にデバッグ機能をセットアップ
function init() {
    updateLoadingProgress(10);
    
    // Three.jsのシーンを初期化
    initScene();
    updateLoadingProgress(30);
    
    // 物理エンジンを初期化
    initPhysics();
    updateLoadingProgress(50);
    
    // コントロールを初期化
    initControls();
    updateLoadingProgress(60);
    
    // レベルを読み込む
    loadLevel(gameState.level);
    updateLoadingProgress(70);
    
    // イベントリスナーを設定
    setupEventListeners();
    updateLoadingProgress(80);
    
    // // デバッグ機能をセットアップ（追加）
    // setupDebugLevelSelector();
    // updateLoadingProgress(85);
    
    // // デバッグモードのセットアップ
    // setupDebugMode();
    // updateLoadingProgress(90);
    
    // クロックを初期化
    clock = new THREE.Clock();
    updateLoadingProgress(95);
    
    // アニメーションを開始
    animate();
    updateLoadingProgress(100);
    
    // ロード完了、ロード画面を非表示
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        showStartMessage();
    }, 500);
}

// アニメーションループ
// animate関数の修正 - エラーのキャッチと処理を追加
function animate() {
    // アニメーションが常に継続するように、try-catchで囲む
    try {
        requestAnimationFrame(animate);
        
        // デルタタイムを取得（最大0.1秒に制限）
        deltaTime = Math.min(clock.getDelta(), 0.1);
        
        if (gameState.isGameStarted && !gameState.isGameOver && !gameState.isLevelCompleted) {
            // 迷路の傾きを更新
            const tilt = getCurrentTilt();
            if (mazeContainer) {
                mazeContainer.rotation.x = THREE.MathUtils.lerp(
                    mazeContainer.rotation.x,
                    tilt.x,
                    0.1
                );
                
                mazeContainer.rotation.z = THREE.MathUtils.lerp(
                    mazeContainer.rotation.z,
                    tilt.z,
                    0.1
                );
            }
            
            // 物理シミュレーションを更新（エラーが発生しやすい処理）
            try {
                updatePhysics(mazeContainer, deltaTime);
            } catch (e) {
                console.error("物理演算エラー:", e);
            }
            
            // 障害物とコインの更新（エラーが発生しやすい処理）
            try {
                updateObstacles(deltaTime);
                updateCoins(deltaTime);
            } catch (e) {
                console.error("オブジェクト更新エラー:", e);
            }
            
            // 時間の更新（500ミリ秒ごと）
            const now = Date.now();
            if (now - gameState.lastUpdateTime > 500) {
                updateTime();
                gameState.lastUpdateTime = now;
                
                // コインがすべて集められたか確認
                if (getCoinsCount() === 0 && !isAllCoinsCollected()) {
                    setAllCoinsCollected(true);
                    showMessage('すべてのコインを集めました！ゴールを目指しましょう！', 3000);
                }
            }
        }
        
        // レンダリング
        render();
    } catch (e) {
        console.error("アニメーションループエラー:", e);
        // エラーが発生しても次のフレームを継続
        requestAnimationFrame(animate);
    }
}

// イベントハンドラ
// nextLevel関数の修正 - レベル遷移を安全に
function nextLevel() {
    try {
        // 傾きを完全にリセット
        currentTiltX = 0;
        currentTiltZ = 0;
        targetTiltX = 0;
        targetTiltZ = 0;
        
        // 迷路の回転もリセット
        if (mazeContainer) {
            mazeContainer.rotation.x = 0;
            mazeContainer.rotation.z = 0;
        }
        
        if (!gameState.isGameStarted) {
            // ゲーム開始
            gameState.isGameStarted = true;
            document.getElementById('message-box').style.display = 'none';
            gameState.startTime = Date.now();
            gameState.lastUpdateTime = gameState.startTime;
        } else {
            // 次のレベルに進む
            gameState.level++;
            gameState.isGameOver = false;
            gameState.isLevelCompleted = false;
            allCoinsCollected = false;
            
            clearLevel();
            loadLevel(gameState.level);
            document.getElementById('message-box').style.display = 'none';
            gameState.startTime = Date.now();
            gameState.lastUpdateTime = gameState.startTime;
        }
    } catch (e) {
        console.error("レベル遷移エラー:", e);
        restartLevel();
    }
}

// デバッグ機能（レベル選択）を追加
function setupDebugLevelSelector() {
    // キーボードのナンバーキー（1～9）でレベル選択
    window.addEventListener('keydown', (e) => {
        // PCでのみ有効（開発中のデバッグ用）
        if (e.key >= '1' && e.key <= '9') {
            const level = parseInt(e.key);
            console.log(`デバッグ: レベル ${level} を読み込みます`);
            loadDebugLevel(level);
        }
        
        // Dキーでデバッグメニューの表示切替
        if (e.key === 'd' || e.key === 'D') {
            toggleDebugMenu();
        }
    });
    
    // デバッグメニューを作成
    createDebugMenu();
}

// デバッグメニューの作成
function createDebugMenu() {
    // 既存のメニューがあれば削除
    const existingMenu = document.getElementById('debug-menu');
    if (existingMenu) {
        document.body.removeChild(existingMenu);
    }
    
    // デバッグメニューの作成
    const menu = document.createElement('div');
    menu.id = 'debug-menu';
    menu.style.position = 'absolute';
    menu.style.bottom = '100px';
    menu.style.left = '50%';
    menu.style.transform = 'translateX(-50%)';
    menu.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    menu.style.padding = '10px';
    menu.style.borderRadius = '5px';
    menu.style.color = 'white';
    menu.style.display = 'none';
    menu.style.zIndex = '1000';
    menu.style.fontFamily = 'Arial, sans-serif';
    menu.style.fontSize = '14px';
    menu.style.textAlign = 'center';
    menu.style.pointerEvents = 'auto';
    menu.innerHTML = `
        <div style="margin-bottom: 10px; font-weight: bold;">デバッグメニュー</div>
        <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 5px;">
            <button class="debug-level-button" data-level="1">レベル1</button>
            <button class="debug-level-button" data-level="2">レベル2</button>
            <button class="debug-level-button" data-level="3">レベル3</button>
            <button class="debug-level-button" data-level="4">レベル4</button>
            <button class="debug-level-button" data-level="5">レベル5</button>
        </div>
        <div style="margin-top: 10px; font-size: 12px;">
            数字キー（1-5）でもレベル選択できます<br>
            Dキーでメニュー表示/非表示
        </div>
    `;
    
    document.body.appendChild(menu);
    
    // ボタンのスタイル設定
    const buttons = menu.querySelectorAll('.debug-level-button');
    buttons.forEach(button => {
        button.style.padding = '5px 10px';
        button.style.backgroundColor = '#4CAF50';
        button.style.border = 'none';
        button.style.borderRadius = '3px';
        button.style.color = 'white';
        button.style.cursor = 'pointer';
        button.style.fontSize = '12px';
        
        // ホバー効果
        button.addEventListener('mouseover', () => {
            button.style.backgroundColor = '#388E3C';
        });
        
        button.addEventListener('mouseout', () => {
            button.style.backgroundColor = '#4CAF50';
        });
        
        // クリックイベント
        button.addEventListener('click', () => {
            const level = parseInt(button.getAttribute('data-level'));
            loadDebugLevel(level);
            toggleDebugMenu(false); // メニューを閉じる
        });
    });
}

// デバッグメニューの表示/非表示を切り替え
function toggleDebugMenu(forceState = null) {
    const menu = document.getElementById('debug-menu');
    if (!menu) return;
    
    if (forceState !== null) {
        menu.style.display = forceState ? 'block' : 'none';
    } else {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
}

// デバッグ用レベル読み込み関数
function loadDebugLevel(level) {
    // ゲーム状態をリセット
    gameState.level = level;
    gameState.isGameOver = false;
    gameState.isLevelCompleted = false;
    allCoinsCollected = false;
    
    // 傾きをリセット
    currentTiltX = 0;
    currentTiltZ = 0;
    targetTiltX = 0;
    targetTiltZ = 0;
    
    // 迷路の回転もリセット
    if (mazeContainer) {
        mazeContainer.rotation.x = 0;
        mazeContainer.rotation.z = 0;
    }
    
    // UI要素をリセット
    document.getElementById('message-box').style.display = 'none';
    
    // レベルをロード
    clearLevel();
    loadLevel(level);
    
    // ゲームの開始状態を設定
    if (!gameState.isGameStarted) {
        gameState.isGameStarted = true;
    }
    
    // 時間をリセット
    gameState.startTime = Date.now();
    gameState.lastUpdateTime = gameState.startTime;
    
    // デバッグメッセージ
    showMessage(`デバッグモード: レベル ${level} を読み込みました`, 2000);
}

// ページロード時の初期化とイベントリスナー
window.addEventListener('load', init);
document.getElementById('next-level-button').addEventListener('click', nextLevel);
document.getElementById('restart-button').addEventListener('click', restartLevel);
document.addEventListener('levelComplete', showLevelCompleteMessage);
document.addEventListener('gameOver', showGameOverMessage);