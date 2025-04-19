/**
 * メインゲームロジック
 * ゲームの初期化、ステージ管理、クリック処理などを担当
 */

// ゲームの状態を管理するオブジェクト
const gameState = {
    currentStage: 0,  // 0はステージ選択前、1からステージ番号
    foundErrors: 0,
    totalErrors: 3,
    isGameStarted: false,
    isStageCleared: false,
    foundObjects: []
};

// キャンバス要素（ヒットテスト用）
let hitCanvas, hitCtx;

// マスク画像
let maskImage;

// エラーオブジェクト
let errorObjects = [];

// DOMロード後の初期化
document.addEventListener('DOMContentLoaded', function() {
    initGame();
});

/**
 * ゲームの初期化
 */
function initGame() {
    console.log("ゲーム初期化開始");
    
    // UI要素の初期化
    initUIElements();
    
    // キャンバス要素の初期化
    hitCanvas = document.getElementById('hitCanvas');
    hitCtx = hitCanvas.getContext('2d');
    
    // 音声の読み込み
    loadSounds();
    
    // BGMのセットアップ
    setupBGM();
    
    // イベントリスナーの設定
    setupEventListeners();
    
    console.log("ゲーム初期化完了");
}

/**
 * イベントリスナーの設定
 */
function setupEventListeners() {
    console.log("イベントリスナーを設定中...");
    
    // タイトル・ストーリー関連
    document.getElementById('startButton').addEventListener('click', showStory);
    document.getElementById('storyNextButton').addEventListener('click', function() {
        // フェードアウト効果
        storyScreen.style.transition = "opacity 0.8s ease";
        storyScreen.style.opacity = 0;
        
        setTimeout(() => {
            storyScreen.style.display = 'none';
            // ゲーム画面を準備
            gameScreen.style.display = 'block';
            gameScreen.style.opacity = 0;
            
            // ステージ1を開始
            startStage(1);
            
            // フェードイン効果
            setTimeout(() => {
                gameScreen.style.transition = "opacity 0.8s ease";
                gameScreen.style.opacity = 1;
            }, 50);
        }, 800);
    });
    
    // ステージクリア・次のステージ
    document.getElementById('nextStageButton').addEventListener('click', goToNextStage);
    
    // エンディング
    document.getElementById('endingButton').addEventListener('click', resetGame);

    // BGM操作ボタン - イベント伝播を停止
    const bgmControl = document.getElementById('bgmControl');
    if (bgmControl) {
        bgmControl.addEventListener('click', function(e) {
            e.stopPropagation(); // イベント伝播を停止
            toggleBGM();
        });
    }
    
    // ゲーム画面のクリック/タップイベント
    gameScreen.addEventListener('click', handleGameInteraction);
    gameScreen.addEventListener('touchend', function(e) {
        // ヒントボタンや音声ボタンのタッチイベントは処理しない
        if (e.target.id === 'hintButton' || e.target.id === 'bgmControl') {
            return;
        }
        
        e.preventDefault(); // デフォルトのタッチイベントを抑制
        
        // タッチ位置を取得
        const touch = e.changedTouches[0];
        const touchEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY
        };
        
        handleGameInteraction(touchEvent);
    });
}

/**
 * ステージ開始
 */
function startStage(stageId) {
    console.log(`ステージ${stageId}を開始します`);
    
    // ステージ状態初期化
    gameState.currentStage = stageId;
    gameState.foundErrors = 0;
    gameState.isStageCleared = false;
    gameState.foundObjects = [];
    
    // stageIdが配列の範囲内かチェック
    if (stageId < 1 || stageId > stageSettings.length) {
        console.error(`無効なステージID: ${stageId}`);
        return;
    }
    
    const stage = stageSettings[stageId - 1];
    console.log("ステージ設定:", stage);
    
    // 進行度表示リセット
    resetProgressDots();
    
    // ステージ情報表示
    updateStageInfo(stageId);
    
    // 背景設定
    gameScreen.style.backgroundImage = `url('${stage.background}')`;
    
    // 間違いオブジェクト設定
    loadStageObjects(stage);
    
    // マスク画像読み込み
    loadMaskImage(stage.maskImage);
    
    // もしストーリー画面が表示されていたら消す
    if (storyScreen.style.display !== 'none') {
        storyScreen.classList.remove('active');
        storyScreen.style.display = 'none';
    }
    
    // ゲーム画面を表示
    gameScreen.style.display = 'block';
    gameState.isGameStarted = true;
    
    // 開始メッセージ
    showMessage(`この${stage.name}には3つの「おかしなところ」があります。見つけてください。`);
}

/**
 * ステージの間違いオブジェクト読み込み
 */
function loadStageObjects(stage) {
    // 既存のオブジェクトをクリア
    errorLayer.innerHTML = '';
    errorObjects = [];
    
    // 新しいオブジェクトを追加
    stage.errorObjects.forEach(obj => {
        const imgElement = document.createElement('img');
        imgElement.src = obj.image;
        imgElement.className = 'error-object';
        imgElement.id = obj.id + 'Wrong';
        imgElement.alt = obj.id;
        errorLayer.appendChild(imgElement);
        
        errorObjects.push(imgElement);
    });
}

/**
 * マスク画像読み込み
 */
function loadMaskImage(maskSrc) {
    console.log("マスク画像の読み込みを開始: " + maskSrc);
    
    maskImage = new Image();
    maskImage.src = maskSrc;
    maskImage.onload = function() {
        // キャンバスサイズを設定（マスク画像と同じサイズ）
        hitCanvas.width = maskImage.width;
        hitCanvas.height = maskImage.height;
        
        // マスク画像をキャンバスに描画
        hitCtx.drawImage(maskImage, 0, 0);
        console.log("マスク画像を読み込みました: " + maskImage.width + "x" + maskImage.height);
    };
    
    // エラーハンドリング
    maskImage.onerror = function() {
        console.error("マスク画像の読み込みに失敗しました: " + maskSrc);
    };
}

/**
 * ゲーム画面クリック/タップ処理
 */
function handleGameInteraction(e) {
    console.log("画面がクリック/タップされました");
    
    if (!gameState.isGameStarted || gameState.isStageCleared) return;
    
    // クリック音
    playClickSound();
    
    // クリック位置を取得
    const rect = gameScreen.getBoundingClientRect();
    
    // キャンバスとゲーム画面の比率計算
    const scaleX = hitCanvas.width / rect.width;
    const scaleY = hitCanvas.height / rect.height;
    
    // クリック位置をマスクの座標系に変換
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);
    
    console.log(`座標変換後: (${x}, ${y})`);
    
    // 視覚フィードバックを表示
    showFeedback(e.clientX - rect.left, e.clientY - rect.top);
    
    // 座標が範囲内かチェック
    if (x >= 0 && x < hitCanvas.width && y >= 0 && y < hitCanvas.height) {
        // キャンバスのピクセル色を取得してヒットテスト
        const pixel = hitCtx.getImageData(x, y, 1, 1).data;
        const pixelColor = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
        
        console.log(`クリック位置: (${x}, ${y}), 色: ${pixelColor}`);
        
        // エラー領域の判定
        const stage = stageSettings[gameState.currentStage - 1];
        let errorIndex = -1;
        
        for (let i = 0; i < stage.errorObjects.length; i++) {
            const obj = stage.errorObjects[i];
            console.log(`比較中: ${obj.id}, 色: ${obj.color}`);
            
            // 完全一致だけでなく、近似一致も許容する
            if (isColorMatch(pixel, obj.color) && !gameState.foundObjects.includes(obj.id)) {
                errorIndex = i;
                console.log(`一致しました: ${obj.id}`);
                break;
            }
        }
        
        if (errorIndex !== -1) {
            // 正解処理
            handleCorrect(errorIndex, e.clientX - rect.left, e.clientY - rect.top);
        } else {
            // 不正解処理
            playErrorSound();
            showMessage("ここには異常はないようです...");
        }
    } else {
        // 範囲外クリック
        playErrorSound();
        showMessage("ここには何もないようです...");
    }
}

/**
 * 色の近似一致判定
 */
function isColorMatch(pixelData, targetColor) {
    // targetColorからRGB値を抽出
    console.log("色一致を確認中:", pixelData, targetColor);
    
    const targetMatch = targetColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!targetMatch) {
        console.error("ターゲット色のフォーマットが不正:", targetColor);
        return false;
    }
    
    const targetR = parseInt(targetMatch[1], 10);
    const targetG = parseInt(targetMatch[2], 10);
    const targetB = parseInt(targetMatch[3], 10);
    
    // pixelDataから直接RGB値を取得
    const r = pixelData[0];
    const g = pixelData[1];
    const b = pixelData[2];
    
    // 各色の差分を計算
    const rDiff = Math.abs(r - targetR);
    const gDiff = Math.abs(g - targetG);
    const bDiff = Math.abs(b - targetB);
    
    // より寛容な許容誤差（各色成分に対して50の差まで許容）
    const tolerance = 50;
    
    // いずれかの色成分が強い場合も一致と判定
    const isMatch = (rDiff <= tolerance && gDiff <= tolerance && bDiff <= tolerance) ||
                (r > 200 && targetR > 200) ||  // 赤が強い
                (g > 200 && targetG > 200) ||  // 緑が強い
                (b > 200 && targetB > 200);    // 青が強い
    
    console.log(`色比較: [${r},${g},${b}] vs [${targetR},${targetG},${targetB}], 一致: ${isMatch}`);
    return isMatch;
}

/**
 * 正解処理
 */
function handleCorrect(index, x, y) {
    playCorrectSound();
    
    const stage = stageSettings[gameState.currentStage - 1];
    const obj = stage.errorObjects[index];
    
    gameState.foundObjects.push(obj.id);
    gameState.foundErrors++;
    
    // 進行度表示の更新
    updateProgress(gameState.foundErrors);
    
    // チェックマーク表示
    showCheckMark(x, y);
    
    // エラーオブジェクトをフェードアウト
    let errorObject = document.getElementById(obj.id + 'Wrong');
    
    if (errorObject) {
        // アニメーション効果
        errorObject.style.animation = 'correct 1s ease';
        
        // メッセージを表示
        if (stage.correctMessages && stage.correctMessages[obj.id]) {
            showMessage(stage.correctMessages[obj.id]);
        } else {
            showMessage("おかしなところが直りました！");
        }
        
        // アニメーション後にフェードアウト
        setTimeout(() => {
            errorObject.style.opacity = 0;
            
            // すべての間違いが見つかったらクリア
            if (gameState.foundErrors === gameState.totalErrors) {
                setTimeout(() => {
                    gameState.isStageCleared = true;
                    showClearScreen(gameState.currentStage);
                }, 1500);
            }
        }, 1000);
    }
}

/**
 * ヒント表示
 */
function showHint() {
    // まだ見つかっていないおかしなところのヒントをランダムに表示
    const notFoundIndexes = [];
    const stage = stageSettings[gameState.currentStage - 1];
    
    if (!stage) {
        console.error("ステージデータが見つかりません");
        return;
    }
    
    stage.errorObjects.forEach((obj, index) => {
        if (!gameState.foundObjects.includes(obj.id)) {
            notFoundIndexes.push(index);
        }
    });
    
    if (notFoundIndexes.length > 0) {
        const randomIndex = notFoundIndexes[Math.floor(Math.random() * notFoundIndexes.length)];
        showMessage(stage.errorObjects[randomIndex].hint);
    } else {
        showMessage("すべての「おかしなところ」を見つけました！");
    }
}

/**
 * ゲームリセット
 */
function resetGame() {
    console.log("ゲームをリセットします");
    
    // スクロール位置をリセット
    storyScreen.scrollTop = 0;
    clearScreen.scrollTop = 0;
    endingScreen.scrollTop = 0;
    
    endingScreen.classList.remove('active');
    endingScreen.style.opacity = '0';
    
    setTimeout(() => {
        endingScreen.style.display = 'none';
        titleScreen.style.display = 'flex';
        titleScreen.style.opacity = '0';
        
        setTimeout(() => {
            titleScreen.style.opacity = '1';
            
            // ゲーム状態リセット
            gameState.currentStage = 0;
            gameState.foundErrors = 0;
            gameState.isGameStarted = false;
            gameState.isStageCleared = false;
            gameState.foundObjects = [];
            
            console.log("ゲームをリセットしました");
        }, 50);
    }, 500);
}