// Canvas要素とコンテキストを取得
const gameCanvas = document.getElementById('gameCanvas');
const gameCtx = gameCanvas.getContext('2d');

// UI要素
const powerBar = document.getElementById('powerBar');
const powerText = document.getElementById('powerText');
const shotsCounter = document.getElementById('shotsCounter');
const statusMessage = document.getElementById('statusMessage');
const resetButton = document.getElementById('resetButton');
const helpButton = document.getElementById('helpButton');
const helpModal = document.getElementById('helpModal');
const closeButton = document.querySelector('.close-button');
const scoreDisplay = document.getElementById('scoreDisplay');

// ゲーム設定
const ballRadius = 12;
const cueBallRadius = 14; // 手球（白いボール）
const pocketRadius = 20;
const friction = 0.98; // 摩擦係数（減速率）
const minVelocity = 0.1; // この速度より遅くなったらボールを停止
const borderPadding = 30; // テーブルの枠からの内側の余白

// ゲームの状態
let gameState = 'DIRECTION'; // 'DIRECTION', 'POWER', 'MOVING', 'SUCCESS', 'FAIL'
let shots = 0;
let score = 0;
let directionAngle = 0;
let power = 0;
let powerSpeed = 2; // パワーゲージの変化速度
let powerDirection = 1; // パワーゲージの方向（1=上昇、-1=下降）
let directionGaugeRadius = 40; // ボールを中心とした方向ゲージの半径
let showHitPreview = true; // ヒットプレビューを表示するか
let controlMode = 'manual'; // 常にマニュアルモード（マウスで方向指定）
let gameMode = 'practice'; // ゲームモード: 'practice'（1ボール）または'standard'（複数ボール）
let isTouchDevice = false; // タッチデバイスかどうか

// 手球の位置と速度
let cueBallX = 150;
let cueBallY = gameCanvas.height / 2;
let cueBallVelocityX = 0;
let cueBallVelocityY = 0;

// 複数のカラーボール
let colorBalls = [];
const ballColors = [
    { color: '#FFCC00', points: 1 }, // 黄色
    { color: '#E74C3C', points: 2 }, // 赤
    { color: '#3498DB', points: 3 }  // 青
];

// ポケットの位置
let pockets = [];

// サウンドエフェクト（実装する場合はここで設定）
// const hitSound = new Audio('hit.mp3');
// const pocketSound = new Audio('pocket.mp3');

// アニメーションID
let animationId = null;
let directionAnimationId = null;
let powerAnimationId = null;

// タッチデバイスの検出
function detectTouchDevice() {
    isTouchDevice = ('ontouchstart' in window) || 
                   (navigator.maxTouchPoints > 0) || 
                   (navigator.msMaxTouchPoints > 0);
    
    // CSSの調整（タッチデバイス用）
    if (isTouchDevice) {
        document.body.classList.add('touch-device');
    }
}

// ゲームの初期化
function initGame() {
    // タッチデバイスかどうかを検出
    detectTouchDevice();
    
    // キャンバスのサイズ調整
    const containerWidth = gameCanvas.parentElement.clientWidth - 30;
    if (containerWidth < gameCanvas.width) {
        const ratio = gameCanvas.height / gameCanvas.width;
        gameCanvas.width = containerWidth;
        gameCanvas.height = containerWidth * ratio;
    }
    
    // ゲーム状態のリセット
    gameState = 'DIRECTION';
    shots = 0;
    
    // UI更新
    updateShotsCounter();
    updateScoreDisplay();
    statusMessage.textContent = '';
    
    // 手球の初期化
    resetCueBall();
    
    // ポケットの初期化
    initPockets();
    
    // カラーボールの初期化
    initColorBalls();
    
    // アニメーションをキャンセル
    cancelAllAnimations();
    
    // ゲーム画面を描画
    drawGame();
    
    // 方向選択の開始
    startDirectionSelection();
}

// ポケットの初期化
function initPockets() {
    const width = gameCanvas.width;
    const height = gameCanvas.height;
    
    pockets = [
        { x: borderPadding, y: borderPadding }, // 左上
        { x: width / 2, y: borderPadding }, // 上中央
        { x: width - borderPadding, y: borderPadding }, // 右上
        { x: borderPadding, y: height - borderPadding }, // 左下
        { x: width / 2, y: height - borderPadding }, // 下中央
        { x: width - borderPadding, y: height - borderPadding } // 右下
    ];
}

// カラーボールの初期化
function initColorBalls() {
    colorBalls = [];
    
    // 練習モードの場合は赤いボール1つだけ
    if (gameMode === 'practice') {
        colorBalls.push({
            x: gameCanvas.width * 0.7,
            y: gameCanvas.height / 2,
            radius: ballRadius,
            velocityX: 0,
            velocityY: 0,
            color: '#E74C3C', // 赤色
            points: 2,
            active: true
        });
        return;
    }
    
    // 標準モード（複数ボール）
    const centerX = gameCanvas.width * 0.7;
    const centerY = gameCanvas.height / 2;
    const rowDistance = ballRadius * 2.2; // ボール間の距離を広げる
    const colDistance = ballRadius * 2.2; // 横方向の距離も広げる
    
    // 三角形に配置（間隔を広げる）
    // 1行目（一番上）
    colorBalls.push({
        x: centerX,
        y: centerY - rowDistance,
        radius: ballRadius,
        velocityX: 0,
        velocityY: 0,
        color: ballColors[0].color,
        points: ballColors[0].points,
        active: true
    });
    
    // 2行目
    colorBalls.push({
        x: centerX - colDistance/2,
        y: centerY,
        radius: ballRadius,
        velocityX: 0,
        velocityY: 0,
        color: ballColors[0].color,
        points: ballColors[0].points,
        active: true
    });
    
    colorBalls.push({
        x: centerX + colDistance/2,
        y: centerY,
        radius: ballRadius,
        velocityX: 0,
        velocityY: 0,
        color: ballColors[0].color,
        points: ballColors[0].points,
        active: true
    });
    
    // 3行目
    colorBalls.push({
        x: centerX - colDistance,
        y: centerY + rowDistance,
        radius: ballRadius,
        velocityX: 0,
        velocityY: 0,
        color: ballColors[1].color,
        points: ballColors[1].points,
        active: true
    });
    
    colorBalls.push({
        x: centerX,
        y: centerY + rowDistance,
        radius: ballRadius,
        velocityX: 0,
        velocityY: 0,
        color: ballColors[1].color,
        points: ballColors[1].points,
        active: true
    });
    
    colorBalls.push({
        x: centerX + colDistance,
        y: centerY + rowDistance,
        radius: ballRadius,
        velocityX: 0,
        velocityY: 0,
        color: ballColors[1].color,
        points: ballColors[1].points,
        active: true
    });
    
    // 4行目（青いボール）
    colorBalls.push({
        x: centerX - colDistance/2,
        y: centerY + rowDistance*2,
        radius: ballRadius,
        velocityX: 0,
        velocityY: 0,
        color: ballColors[2].color,
        points: ballColors[2].points,
        active: true
    });
    
    colorBalls.push({
        x: centerX + colDistance/2,
        y: centerY + rowDistance*2,
        radius: ballRadius,
        velocityX: 0,
        velocityY: 0,
        color: ballColors[2].color,
        points: ballColors[2].points,
        active: true
    });
}

// 手球のリセット
function resetCueBall() {
    cueBallX = gameCanvas.width * 0.25;
    cueBallY = gameCanvas.height / 2;
    cueBallVelocityX = 0;
    cueBallVelocityY = 0;
}

// アニメーションキャンセル
function cancelAllAnimations() {
    if (animationId) cancelAnimationFrame(animationId);
    if (directionAnimationId) cancelAnimationFrame(directionAnimationId);
    if (powerAnimationId) cancelAnimationFrame(powerAnimationId);
}

// ゲーム画面の描画
function drawGame() {
    // キャンバスをクリア
    gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    // ビリヤードテーブルの背景
    drawTable();
    
    // ポケットを描画
    drawPockets();
    
    // 方向選択モード中は方向ゲージとキューを描画
    if (gameState === 'DIRECTION' || gameState === 'POWER') {
        drawCue();
        
        // ガイダンステキストを表示
        gameCtx.fillStyle = '#FFFFFF';
        gameCtx.font = '16px Montserrat';
        gameCtx.textAlign = 'center';
        
        // ゲーム状態に応じて異なるテキストを表示
        if (gameState === 'DIRECTION') {
            drawDirectionGuide();
            if (isTouchDevice) {
                gameCtx.fillText('タップで方向を決定', gameCanvas.width / 2, 30);
            } else {
                gameCtx.fillText('クリックで方向を決定', gameCanvas.width / 2, 30);
            }
        } else if (gameState === 'POWER') {
            if (isTouchDevice) {
                gameCtx.fillText('タップでパワーを決定', gameCanvas.width / 2, 30);
            } else {
                gameCtx.fillText('クリックでパワーを決定', gameCanvas.width / 2, 30);
            }
        }
    }
    
    // カラーボールを描画
    drawColorBalls();
    
    // 手球（白いボール）を描画
    drawCueBall();
}

// テーブルの描画
function drawTable() {
    // テーブルの背景（フェルト）
    gameCtx.fillStyle = '#0a5e36';
    gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    // クッション部分（テーブルの内側の枠）
    gameCtx.strokeStyle = '#073f24';
    gameCtx.lineWidth = 8;
    gameCtx.strokeRect(borderPadding - 4, borderPadding - 4, 
                        gameCanvas.width - (borderPadding - 4) * 2, 
                        gameCanvas.height - (borderPadding - 4) * 2);
    
    // テーブルのマーカー点（装飾）
    const markerPositions = [
        { x: gameCanvas.width / 4, y: gameCanvas.height / 2 },
        { x: gameCanvas.width / 2, y: gameCanvas.height / 2 },
        { x: gameCanvas.width * 3 / 4, y: gameCanvas.height / 2 }
    ];
    
    markerPositions.forEach(pos => {
        gameCtx.fillStyle = '#0f3460';
        gameCtx.beginPath();
        gameCtx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
        gameCtx.fill();
    });
}

// ポケットの描画
function drawPockets() {
    pockets.forEach(pocket => {
        // ポケットの外側の枠
        gameCtx.fillStyle = '#111';
        gameCtx.beginPath();
        gameCtx.arc(pocket.x, pocket.y, pocketRadius, 0, Math.PI * 2);
        gameCtx.fill();
        
        // ポケットの内側（穴）
        gameCtx.fillStyle = '#000';
        gameCtx.beginPath();
        gameCtx.arc(pocket.x, pocket.y, pocketRadius - 3, 0, Math.PI * 2);
        gameCtx.fill();
    });
}

// 方向ガイドの描画
function drawDirectionGuide() {
    // 方向ゲージの円
    gameCtx.beginPath();
    gameCtx.arc(cueBallX, cueBallY, directionGaugeRadius, 0, Math.PI * 2);
    gameCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    gameCtx.lineWidth = 2;
    gameCtx.stroke();
    
    // 方向ポインター
    const pointerX = cueBallX + Math.cos(directionAngle * Math.PI / 180) * directionGaugeRadius;
    const pointerY = cueBallY + Math.sin(directionAngle * Math.PI / 180) * directionGaugeRadius;
    
    gameCtx.beginPath();
    gameCtx.arc(pointerX, pointerY, 6, 0, Math.PI * 2);
    gameCtx.fillStyle = '#FFCC00';
    gameCtx.fill();
    
    // ヒットプレビュー（方向線）の表示
    if (showHitPreview) {
        const lineLength = 150;
        const endX = cueBallX + Math.cos(directionAngle * Math.PI / 180) * lineLength;
        const endY = cueBallY + Math.sin(directionAngle * Math.PI / 180) * lineLength;
        
        gameCtx.beginPath();
        gameCtx.moveTo(cueBallX, cueBallY);
        gameCtx.lineTo(endX, endY);
        gameCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        gameCtx.lineWidth = 1;
        gameCtx.setLineDash([5, 5]); // 点線
        gameCtx.stroke();
        gameCtx.setLineDash([]); // 実線に戻す
    }
}

// キューの描画
function drawCue() {
    const lineLength = 200;
    // キューの端の位置（ボールと反対方向）
    const startX = cueBallX - Math.cos(directionAngle * Math.PI / 180) * lineLength;
    const startY = cueBallY - Math.sin(directionAngle * Math.PI / 180) * lineLength;
    
    // ボールとの接点
    const endX = cueBallX - Math.cos(directionAngle * Math.PI / 180) * (cueBallRadius + 2);
    const endY = cueBallY - Math.sin(directionAngle * Math.PI / 180) * (cueBallRadius + 2);
    
    // キューのグラデーション
    const gradient = gameCtx.createLinearGradient(startX, startY, endX, endY);
    gradient.addColorStop(0, '#8B4513'); // 茶色（グリップ側）
    gradient.addColorStop(0.7, '#D2B48C'); // 薄い茶色（先端側）
    gradient.addColorStop(0.9, '#FFEBCD'); // さらに薄い色（先端）
    
    // パワーに応じてキューの位置を調整（引き具合）
    let powerAdjustment = 0;
    if (gameState === 'POWER') {
        powerAdjustment = power * 0.4; // パワーに応じて引く距離を調整
    }
    
    const adjustedStartX = startX - Math.cos(directionAngle * Math.PI / 180) * powerAdjustment;
    const adjustedStartY = startY - Math.sin(directionAngle * Math.PI / 180) * powerAdjustment;
    
    // キューを描画
    gameCtx.beginPath();
    gameCtx.moveTo(adjustedStartX, adjustedStartY);
    gameCtx.lineTo(endX, endY);
    gameCtx.strokeStyle = gradient;
    gameCtx.lineWidth = 6;
    gameCtx.lineCap = 'round';
    gameCtx.stroke();
    
    // キューの先端（チョーク部分）
    gameCtx.beginPath();
    gameCtx.arc(endX, endY, 3, 0, Math.PI * 2);
    gameCtx.fillStyle = '#87CEEB'; // 水色
    gameCtx.fill();
}

// カラーボールの描画
function drawColorBalls() {
    colorBalls.forEach(ball => {
        if (ball.active) {
            // ボールの基本色
            gameCtx.fillStyle = ball.color;
            gameCtx.beginPath();
            gameCtx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            gameCtx.fill();
            
            // ボールの3D効果（ハイライト）
            gameCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            gameCtx.beginPath();
            gameCtx.arc(ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, ball.radius * 0.5, 0, Math.PI * 2);
            gameCtx.fill();
            
            // ボールの数字や模様（ポイント数で区別）
            gameCtx.fillStyle = 'white';
            gameCtx.font = '10px Montserrat';
            gameCtx.textAlign = 'center';
            gameCtx.textBaseline = 'middle';
            gameCtx.fillText(ball.points.toString(), ball.x, ball.y);
        }
    });
}

// 手球の描画
function drawCueBall() {
    // 白いボールの基本
    gameCtx.fillStyle = '#FFF';
    gameCtx.beginPath();
    gameCtx.arc(cueBallX, cueBallY, cueBallRadius, 0, Math.PI * 2);
    gameCtx.fill();
    
    // 手球の輪郭線
    gameCtx.strokeStyle = '#DDD';
    gameCtx.lineWidth = 1;
    gameCtx.stroke();
    
    // 3D効果（ハイライト）
    gameCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    gameCtx.beginPath();
    gameCtx.arc(cueBallX - cueBallRadius * 0.3, cueBallY - cueBallRadius * 0.3, cueBallRadius * 0.5, 0, Math.PI * 2);
    gameCtx.fill();
}

// パワーゲージの更新
function updatePowerGauge() {
    powerBar.style.width = `${power}%`;
    powerText.textContent = `パワー: ${power}%`;
}

// ショットカウンタの更新
function updateShotsCounter() {
    shotsCounter.textContent = `ショット: ${shots}`;
}

// スコア表示の更新
function updateScoreDisplay() {
    scoreDisplay.textContent = `スコア: ${score}`;
}

// 方向選択の開始
function startDirectionSelection() {
    gameState = 'DIRECTION';
    
    // マニュアルモード: マウス/タッチで方向を決める
    // 初期方向を設定（白いボールからテーブル中央へ向かう方向）
    const centerX = gameCanvas.width / 2;
    const centerY = gameCanvas.height / 2;
    directionAngle = Math.atan2(centerY - cueBallY, centerX - cueBallX) * 180 / Math.PI;
    
    // ゲーム画面を描画
    drawGame();
}

// パワー選択の開始
function startPowerSelection() {
    gameState = 'POWER';
    cancelAnimationFrame(directionAnimationId);
    
    power = 0; // 必ず0から開始
    powerDirection = 1;
    
    // パワーゲージをアニメーション
    function animatePower() {
        power += powerSpeed * powerDirection;
        
        // パワーが上限または下限に達したら方向を反転
        if (power >= 100) {
            power = 100;
            powerDirection = -1;
        } else if (power <= 0) {
            power = 0;
            powerDirection = 1;
        }
        
        updatePowerGauge();
        drawGame(); // ゲーム画面も更新して、キューの位置を同期
        powerAnimationId = requestAnimationFrame(animatePower);
    }
    
    // パワーゲージを初期化して表示
    updatePowerGauge();
    animatePower();
}

// ショットの実行
function takeShot() {
    gameState = 'MOVING';
    shots++;
    updateShotsCounter();
    
    // パワーアニメーションを停止
    cancelAnimationFrame(powerAnimationId);
    
    // 角度とパワーに基づいて初速を計算
    const speed = power * 0.2; // パワーを適切な速度に変換
    cueBallVelocityX = Math.cos(directionAngle * Math.PI / 180) * speed;
    cueBallVelocityY = Math.sin(directionAngle * Math.PI / 180) * speed;
    
    // 効果音（実装する場合）
    // hitSound.play();
    
    // ボールの動きをアニメーション
    animateBalls();
}

// ボールのアニメーション
function animateBalls() {
    // 手球の位置を更新
    cueBallX += cueBallVelocityX;
    cueBallY += cueBallVelocityY;
    
    // 摩擦による減速
    cueBallVelocityX *= friction;
    cueBallVelocityY *= friction;
    
    // カラーボールの位置を更新
    colorBalls.forEach(ball => {
        if (ball.active) {
            ball.x += ball.velocityX;
            ball.y += ball.velocityY;
            
            ball.velocityX *= friction;
            ball.velocityY *= friction;
        }
    });
    
    // 壁との衝突判定と反射（手球）
    handleWallCollision();
    
    // ボール同士の衝突判定
    handleBallCollisions();
    
    // ポケットとの衝突判定
    handlePocketCollisions();
    
    // ボールの速度チェック
    const isMoving = checkBallsMoving();
    
    // ゲーム画面を再描画
    drawGame();
    
    // すべてのボールが停止したか成功/失敗状態でない場合は、アニメーションを継続
    if (isMoving && gameState === 'MOVING') {
        animationId = requestAnimationFrame(animateBalls);
    } else if (gameState === 'MOVING') {
        // 次のショットへ
        setTimeout(() => {
            startDirectionSelection();
        }, 500);
    }
}

// 壁との衝突処理
function handleWallCollision() {
    // 手球の壁との衝突
    if (cueBallX - cueBallRadius < borderPadding) {
        cueBallX = borderPadding + cueBallRadius;
        cueBallVelocityX = -cueBallVelocityX * 0.8; // 反発係数
    } else if (cueBallX + cueBallRadius > gameCanvas.width - borderPadding) {
        cueBallX = gameCanvas.width - borderPadding - cueBallRadius;
        cueBallVelocityX = -cueBallVelocityX * 0.8;
    }
    
    if (cueBallY - cueBallRadius < borderPadding) {
        cueBallY = borderPadding + cueBallRadius;
        cueBallVelocityY = -cueBallVelocityY * 0.8;
    } else if (cueBallY + cueBallRadius > gameCanvas.height - borderPadding) {
        cueBallY = gameCanvas.height - borderPadding - cueBallRadius;
        cueBallVelocityY = -cueBallVelocityY * 0.8;
    }
    
    // カラーボールの壁との衝突
    colorBalls.forEach(ball => {
        if (ball.active) {
            if (ball.x - ball.radius < borderPadding) {
                ball.x = borderPadding + ball.radius;
                ball.velocityX = -ball.velocityX * 0.8;
            } else if (ball.x + ball.radius > gameCanvas.width - borderPadding) {
                ball.x = gameCanvas.width - borderPadding - ball.radius;
                ball.velocityX = -ball.velocityX * 0.8;
            }
            
            if (ball.y - ball.radius < borderPadding) {
                ball.y = borderPadding + ball.radius;
                ball.velocityY = -ball.velocityY * 0.8;
            } else if (ball.y + ball.radius > gameCanvas.height - borderPadding) {
                ball.y = gameCanvas.height - borderPadding - ball.radius;
                ball.velocityY = -ball.velocityY * 0.8;
            }
        }
    });
}

// ボール同士の衝突処理
function handleBallCollisions() {
    // 手球とカラーボールの衝突
    colorBalls.forEach(ball => {
        if (ball.active) {
            const dx = ball.x - cueBallX;
            const dy = ball.y - cueBallY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < cueBallRadius + ball.radius) {
                // 衝突時の効果音（実装する場合）
                // hitSound.play();
                
                // 衝突後の速度を計算
                const angle = Math.atan2(dy, dx);
                const sin = Math.sin(angle);
                const cos = Math.cos(angle);
                
                // 回転座標系での位置と速度
                const pos0 = {x: 0, y: 0};
                const pos1 = {x: dx * cos + dy * sin, y: dy * cos - dx * sin};
                const vel0 = {x: cueBallVelocityX * cos + cueBallVelocityY * sin, y: cueBallVelocityY * cos - cueBallVelocityX * sin};
                const vel1 = {x: ball.velocityX * cos + ball.velocityY * sin, y: ball.velocityY * cos - ball.velocityX * sin};
                
                // 運動量保存則に基づく衝突後の速度
                const vx0Final = ((cueBallRadius - ball.radius) * vel0.x + 2 * ball.radius * vel1.x) / (cueBallRadius + ball.radius);
                const vx1Final = ((ball.radius - cueBallRadius) * vel1.x + 2 * cueBallRadius * vel0.x) / (cueBallRadius + ball.radius);
                
                // 速度を元の座標系に戻す
                cueBallVelocityX = vx0Final * cos - vel0.y * sin;
                cueBallVelocityY = vel0.y * cos + vx0Final * sin;
                ball.velocityX = vx1Final * cos - vel1.y * sin;
                ball.velocityY = vel1.y * cos + vx1Final * sin;
                
                // ボールが重ならないように位置を調整
                const overlap = (cueBallRadius + ball.radius - distance) / 2;
                cueBallX -= overlap * cos;
                cueBallY -= overlap * sin;
                ball.x += overlap * cos;
                ball.y += overlap * sin;
            }
        }
    });
    
    // カラーボール同士の衝突
    for (let i = 0; i < colorBalls.length; i++) {
        for (let j = i + 1; j < colorBalls.length; j++) {
            const ball1 = colorBalls[i];
            const ball2 = colorBalls[j];
            
            if (ball1.active && ball2.active) {
                const dx = ball2.x - ball1.x;
                const dy = ball2.y - ball1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < ball1.radius + ball2.radius) {
                    // 衝突後の速度を計算
                    const angle = Math.atan2(dy, dx);
                    const sin = Math.sin(angle);
                    const cos = Math.cos(angle);
                    
                    // 回転座標系での位置と速度
                    const pos1 = {x: 0, y: 0};
                    const pos2 = {x: dx * cos + dy * sin, y: dy * cos - dx * sin};
                    const vel1 = {x: ball1.velocityX * cos + ball1.velocityY * sin, y: ball1.velocityY * cos - ball1.velocityX * sin};
                    const vel2 = {x: ball2.velocityX * cos + ball2.velocityY * sin, y: ball2.velocityY * cos - ball2.velocityX * sin};
                    
                    // 運動量保存則に基づく衝突後の速度
                    const vx1Final = ((ball1.radius - ball2.radius) * vel1.x + 2 * ball2.radius * vel2.x) / (ball1.radius + ball2.radius);
                    const vx2Final = ((ball2.radius - ball1.radius) * vel2.x + 2 * ball1.radius * vel1.x) / (ball1.radius + ball2.radius);
                    
                    // 速度を元の座標系に戻す
                    ball1.velocityX = vx1Final * cos - vel1.y * sin;
                    ball1.velocityY = vel1.y * cos + vx1Final * sin;
                    ball2.velocityX = vx2Final * cos - vel2.y * sin;
                    ball2.velocityY = vel2.y * cos + vx2Final * sin;
                    
                    // ボールが重ならないように位置を調整
                    const overlap = (ball1.radius + ball2.radius - distance) / 2;
                    ball1.x -= overlap * cos;
                    ball1.y -= overlap * sin;
                    ball2.x += overlap * cos;
                    ball2.y += overlap * sin;
                }
            }
        }
    }
}

// ポケットとの衝突処理
function handlePocketCollisions() {
    // 手球とポケットの衝突
    for (const pocket of pockets) {
        const dx = cueBallX - pocket.x;
        const dy = cueBallY - pocket.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < pocketRadius - 5) {
            // 効果音（実装する場合）
            // pocketSound.play();
            
            // 手球がポケットに入った（減点）
            gameState = 'FAIL';
            score = Math.max(0, score - 1); // スコアを減点（最小0）
            updateScoreDisplay();
            statusMessage.textContent = '手球がポケットに入りました！（-1点）';
            
            // 少し遅延してから手球をリセット
            setTimeout(() => {
                resetCueBall();
                gameState = 'MOVING';
                
                // すべてのボールの動きが止まった場合、次のショットへ
                if (!checkBallsMoving()) {
                    setTimeout(startDirectionSelection, 500);
                }
            }, 1000);
            
            return;
        }
    }
    
    // カラーボールとポケットの衝突
    for (let i = 0; i < colorBalls.length; i++) {
        const ball = colorBalls[i];
        if (ball.active) {
            for (const pocket of pockets) {
                const dx = ball.x - pocket.x;
                const dy = ball.y - pocket.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < pocketRadius - 5) {
                    // 効果音（実装する場合）
                    // pocketSound.play();
                    
                    // カラーボールがポケットに入った（得点）
                    ball.active = false;
                    score += ball.points;
                    updateScoreDisplay();
                    statusMessage.textContent = `${ball.points}点獲得！`;
                    
                    // 練習モードの場合は1つのボールが入ったら成功
                    if (gameMode === 'practice') {
                        gameState = 'SUCCESS';
                        statusMessage.textContent = '成功！赤いボールを入れました！';
                        
                        // ゲームをリセットするボタンを強調
                        resetButton.style.animation = 'pulse 1s infinite';
                        
                        // 少し遅延してから自動リセット
                        setTimeout(() => {
                            resetButton.style.animation = '';
                            initGame();
                        }, 3000);
                        return;
                    }
                    
                    // 標準モードの場合はすべてのカラーボールが入ったかチェック
                    const remainingBalls = colorBalls.filter(b => b.active).length;
                    if (remainingBalls === 0) {
                        gameState = 'SUCCESS';
                        statusMessage.textContent = `すべてのボールを入れました！ 最終スコア: ${score}`;
                        
                        // ゲームをリセットするボタンを強調
                        resetButton.style.animation = 'pulse 1s infinite';
                        
                        // 少し遅延してから自動リセット
                        setTimeout(() => {
                            resetButton.style.animation = '';
                            initGame();
                        }, 3000);
                    }
                    
                    break;
                }
            }
        }
    }
}

// ボールの動きをチェック
function checkBallsMoving() {
    // 手球の速度
    const cueBallSpeed = Math.sqrt(cueBallVelocityX * cueBallVelocityX + cueBallVelocityY * cueBallVelocityY);
    
    // いずれかのボールが動いているかチェック
    if (cueBallSpeed > minVelocity) {
        return true;
    }
    
    // カラーボールの速度チェック
    for (const ball of colorBalls) {
        if (ball.active) {
            const ballSpeed = Math.sqrt(ball.velocityX * ball.velocityX + ball.velocityY * ball.velocityY);
            if (ballSpeed > minVelocity) {
                return true;
            }
        }
    }
    
    // すべてのボールが停止している
    return false;
}

// イベントリスナー
gameCanvas.addEventListener('click', function(event) {
    handlePointerEvent(event);
});

// タッチイベントリスナー
gameCanvas.addEventListener('touchstart', function(event) {
    // タッチイベントの場合はスクロールを防止
    event.preventDefault();
    
    // 最初のタッチポイントを使用
    const touch = event.touches[0];
    handlePointerEvent(touch);
});

// ポインターイベント（マウスクリックまたはタッチ）の処理
function handlePointerEvent(event) {
    if (gameState === 'MOVING' || gameState === 'SUCCESS' || gameState === 'FAIL') return;
    
    if (gameState === 'DIRECTION') {
        startPowerSelection();
    } else if (gameState === 'POWER') {
        takeShot();
    }
}

// マウス移動イベントリスナー
gameCanvas.addEventListener('mousemove', function(event) {
    handlePointerMove(event);
});

// タッチ移動イベントリスナー
gameCanvas.addEventListener('touchmove', function(event) {
    // スクロールを防止
    event.preventDefault();
    
    // 最初のタッチポイントを使用
    const touch = event.touches[0];
    
    // タッチイベントをマウスイベントのようにシミュレート
    const simulatedEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY
    };
    
    handlePointerMove(simulatedEvent);
});

// ポインター移動（マウスまたはタッチ）の処理
function handlePointerMove(event) {
    if (gameState === 'DIRECTION') {
        // キャンバス上の座標を取得
        const rect = gameCanvas.getBoundingClientRect();
        const pointerX = event.clientX - rect.left;
        const pointerY = event.clientY - rect.top;
        
        // 白いボールとポインター位置の角度を計算
        const dx = pointerX - cueBallX;
        const dy = pointerY - cueBallY;
        directionAngle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        // ゲーム画面を再描画
        drawGame();
    }
}

// パワーゲージのクリックイベント
document.getElementById('powerGauge').addEventListener('click', function() {
    if (gameState === 'POWER') {
        takeShot();
    }
});

// パワーゲージのタッチイベント（スマートフォン用）
document.getElementById('powerGauge').addEventListener('touchstart', function(event) {
    event.preventDefault(); // デフォルトの動作を防止
    if (gameState === 'POWER') {
        takeShot();
    }
});

// リセットボタン
resetButton.addEventListener('click', function() {
    resetButton.style.animation = '';
    initGame();
});

// ヘルプモーダル
helpButton.addEventListener('click', function() {
    helpModal.style.display = 'flex';
});

closeButton.addEventListener('click', function() {
    helpModal.style.display = 'none';
});

// モーダル外クリックで閉じる
window.addEventListener('click', function(event) {
    if (event.target === helpModal) {
        helpModal.style.display = 'none';
    }
});

// ゲームモードの切り替え
const gameModeOptions = document.querySelectorAll('input[name="game-mode"]');
gameModeOptions.forEach(option => {
    option.addEventListener('change', function() {
        gameMode = this.value;
        
        // ゲームをリセット
        resetButton.style.animation = '';
        initGame();
        
        // モードに応じたメッセージを表示
        if (gameMode === 'practice') {
            statusMessage.textContent = '練習モード: 赤いボールをポケットに入れましょう';
        } else {
            statusMessage.textContent = '標準モード: 複数のボールでスコアを競います';
        }
        setTimeout(() => {
            statusMessage.textContent = '';
        }, 3000);
    });
});

// ウィンドウリサイズ時にゲームをリサイズ
window.addEventListener('resize', function() {
    initGame();
});

// ゲーム開始
window.onload = initGame;