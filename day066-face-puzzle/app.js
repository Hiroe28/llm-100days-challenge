// グローバル変数
let faceMesh;
let uploadedImage;
let landmarks;
let parts = [];
let draggedPart = null;
let gameState = {
    placedParts: []
};

// MediaPipe Face Meshの初期化
function initializeFaceMesh() {
    faceMesh = new FaceMesh({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`;
        }
    });

    faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    faceMesh.onResults(onFaceDetected);
}

// DOMが読み込まれた後に実行
document.addEventListener('DOMContentLoaded', function() {
    // ファイル選択時の処理
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            document.getElementById('loading').style.display = 'block';
            document.getElementById('canvasContainer').style.display = 'none';
            document.getElementById('gameSection').style.display = 'none';
            document.getElementById('controls').style.display = 'none';

            const img = new Image();
            img.onload = async () => {
                uploadedImage = img;
                await detectFace(img);
            };
            img.src = URL.createObjectURL(file);
        });
    }

    // MediaPipe Face Meshを初期化
    initializeFaceMesh();
});

// 顔検出の実行
async function detectFace(img) {
    if (!faceMesh) {
        initializeFaceMesh();
    }

    // Canvasに画像を描画
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 画像サイズを調整
    const maxSize = 800;
    let width = img.width;
    let height = img.height;
    
    if (width > maxSize || height > maxSize) {
        if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
        } else {
            width = (width / height) * maxSize;
            height = maxSize;
        }
    }
    
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    // MediaPipe Face Meshで顔検出
    await faceMesh.send({ image: canvas });
}

// 顔検出結果の処理
function onFaceDetected(results) {
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        landmarks = results.multiFaceLandmarks[0];
        processImage();
    } else {
        alert('顔が検出できませんでした。別の画像を試してください。');
        document.getElementById('loading').style.display = 'none';
    }
}

// 画像処理とパーツ抽出
function processImage() {
    const originalCanvas = document.getElementById('originalCanvas');
    const blankCanvas = document.getElementById('blankCanvas');
    const ctx1 = originalCanvas.getContext('2d');
    const ctx2 = blankCanvas.getContext('2d');

    // キャンバスサイズ設定
    const maxSize = 400;
    let width = uploadedImage.width;
    let height = uploadedImage.height;
    
    if (width > maxSize || height > maxSize) {
        if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
        } else {
            width = (width / height) * maxSize;
            height = maxSize;
        }
    }

    originalCanvas.width = width;
    originalCanvas.height = height;
    blankCanvas.width = width;
    blankCanvas.height = height;

    // 元画像を描画
    ctx1.drawImage(uploadedImage, 0, 0, width, height);

    // ランドマークをピクセル座標に変換
    const scaledLandmarks = landmarks.map(lm => ({
        x: lm.x * width,
        y: lm.y * height
    }));

    // パーツを抽出
    extractParts(ctx1, scaledLandmarks, width, height);

    // のっぺらぼうを作成
    createBlankFace(ctx1, ctx2, scaledLandmarks, width, height);

    // ゲーム画面を初期化
    initializeGame(width, height);

    document.getElementById('loading').style.display = 'none';
    document.getElementById('canvasContainer').style.display = 'flex';
    document.getElementById('gameSection').style.display = 'block';
    document.getElementById('controls').style.display = 'flex';
}

// パーツ抽出
function extractParts(ctx, lms, width, height) {
    parts = [];
    
    // 左目 (indices: 33, 133, 159, 145, 362, 263)
    const leftEye = extractPart(ctx, lms, [33, 7, 163, 144, 145, 153, 154, 155, 133], '左目');
    parts.push(leftEye);

    // 右目 (indices: 362, 263, 386, 374, 133, 33)
    const rightEye = extractPart(ctx, lms, [362, 382, 381, 380, 374, 373, 390, 249, 263], '右目');
    parts.push(rightEye);

    // 鼻 (indices around nose)
    const nose = extractPart(ctx, lms, [1, 2, 98, 327, 94, 19, 141, 370, 462, 458, 459, 460, 461, 4], '鼻');
    parts.push(nose);

    // 口 (indices around mouth)
    const mouth = extractPart(ctx, lms, [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 185, 40, 39, 37, 0, 267, 269, 270, 409], '口');
    parts.push(mouth);

    // 左眉 
    const leftEyebrow = extractPart(ctx, lms, [70, 63, 105, 66, 107, 55, 65], '左眉');
    parts.push(leftEyebrow);

    // 右眉
    const rightEyebrow = extractPart(ctx, lms, [300, 293, 334, 296, 336, 285, 295], '右眉');
    parts.push(rightEyebrow);

    // パーツを表示
    displayParts();
}

// 個別パーツの抽出
function extractPart(ctx, landmarks, indices, name) {
    const points = indices.map(i => landmarks[i]);
    
    // バウンディングボックスを計算
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs) - 10;
    const minY = Math.min(...ys) - 10;
    const maxX = Math.max(...xs) + 10;
    const maxY = Math.max(...ys) + 10;
    const w = maxX - minX;
    const h = maxY - minY;

    // パーツ画像を抽出
    const partCanvas = document.createElement('canvas');
    partCanvas.width = w;
    partCanvas.height = h;
    const partCtx = partCanvas.getContext('2d');
    
    partCtx.drawImage(ctx.canvas, minX, minY, w, h, 0, 0, w, h);

    return {
        name: name,
        canvas: partCanvas,
        width: w,
        height: h,
        originalX: minX,
        originalY: minY
    };
}

// パーツ表示
function displayParts() {
    const container = document.getElementById('partsContainer');
    container.innerHTML = '';

    parts.forEach((part, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'part-item';
        wrapper.draggable = true;
        wrapper.dataset.index = index;
        
        const canvas = document.createElement('canvas');
        canvas.width = part.width;
        canvas.height = part.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(part.canvas, 0, 0);
        
        wrapper.appendChild(canvas);
        
        // ドラッグイベント（デスクトップ用）
        wrapper.addEventListener('dragstart', (e) => {
            draggedPart = {
                index: index,
                offsetX: e.offsetX,
                offsetY: e.offsetY
            };
        });
        
        // タッチイベント（モバイル用）
        wrapper.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = wrapper.getBoundingClientRect();
            draggedPart = {
                index: index,
                offsetX: touch.clientX - rect.left,
                offsetY: touch.clientY - rect.top
            };
        });
        
        wrapper.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });
        
        wrapper.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!draggedPart) return;
            
            const touch = e.changedTouches[0];
            const gameCanvas = document.getElementById('gameCanvas');
            const rect = gameCanvas.getBoundingClientRect();
            
            // タッチ位置がゲームキャンバス内かチェック
            if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
                touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
                
                const x = touch.clientX - rect.left - draggedPart.offsetX;
                const y = touch.clientY - rect.top - draggedPart.offsetY;
                
                const part = parts[draggedPart.index];
                
                // パーツを配置
                gameState.placedParts.push({
                    part: part,
                    x: x,
                    y: y
                });
                
                redrawGame();
            }
            
            draggedPart = null;
        });
        
        container.appendChild(wrapper);
    });
}

// のっぺらぼう作成
function createBlankFace(srcCtx, destCtx, landmarks, width, height) {
    // 元画像をコピー
    destCtx.drawImage(srcCtx.canvas, 0, 0);
    
    // パーツ部分をぼかして消去
    parts.forEach(part => {
        // ぼかしフィルター
        destCtx.filter = 'blur(20px)';
        
        // 肌色で塗りつぶし
        const imgData = srcCtx.getImageData(part.originalX, part.originalY, part.width, part.height);
        const avgColor = getAverageColor(imgData);
        
        destCtx.fillStyle = avgColor;
        destCtx.fillRect(part.originalX, part.originalY, part.width, part.height);
        
        destCtx.filter = 'none';
    });
}

// 平均色を取得
function getAverageColor(imageData) {
    const data = imageData.data;
    let r = 0, g = 0, b = 0;
    const count = data.length / 4;
    
    for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
    }
    
    r = Math.floor(r / count);
    g = Math.floor(g / count);
    b = Math.floor(b / count);
    
    return `rgb(${r}, ${g}, ${b})`;
}

// ゲーム初期化
function initializeGame(width, height) {
    const gameCanvas = document.getElementById('gameCanvas');
    const ctx = gameCanvas.getContext('2d');
    
    // キャンバスサイズを調整
    gameCanvas.width = width;
    gameCanvas.height = height;
    
    // のっぺらぼうをコピー
    const blankCanvas = document.getElementById('blankCanvas');
    ctx.drawImage(blankCanvas, 0, 0);
    
    gameState.placedParts = [];
    
    // ドロップイベント
    gameCanvas.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    
    gameCanvas.addEventListener('drop', (e) => {
        e.preventDefault();
        if (!draggedPart) return;
        
        const rect = gameCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left - draggedPart.offsetX;
        const y = e.clientY - rect.top - draggedPart.offsetY;
        
        const part = parts[draggedPart.index];
        
        // パーツを配置
        gameState.placedParts.push({
            part: part,
            x: x,
            y: y
        });
        
        redrawGame();
        draggedPart = null;
    });
}

// ゲーム画面再描画
function redrawGame() {
    const gameCanvas = document.getElementById('gameCanvas');
    const ctx = gameCanvas.getContext('2d');
    const blankCanvas = document.getElementById('blankCanvas');
    
    // のっぺらぼうを描画
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    ctx.drawImage(blankCanvas, 0, 0);
    
    // 配置されたパーツを描画
    gameState.placedParts.forEach(placed => {
        ctx.drawImage(placed.part.canvas, placed.x, placed.y);
    });
}

// リセット
function resetGame() {
    gameState.placedParts = [];
    redrawGame();
}

// 画像保存
function saveImage() {
    const gameCanvas = document.getElementById('gameCanvas');
    const link = document.createElement('a');
    link.download = 'fukuwarai.png';
    link.href = gameCanvas.toDataURL();
    link.click();
}
