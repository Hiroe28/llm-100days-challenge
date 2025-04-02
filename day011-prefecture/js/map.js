// マップ関連の処理を扱うモジュール

// グローバル変数
const mapContainer = document.getElementById('japan-map');
const loadingMessage = document.getElementById('loading-message');
const zoomInBtn = document.getElementById('zoom-in');
const zoomOutBtn = document.getElementById('zoom-out');
const zoomResetBtn = document.getElementById('zoom-reset');

// マップ状態の管理
const mapState = {
    zoomLevel: 1,
    originalViewBox: null,
    currentViewBox: null,
    isPanning: false,
    startPanX: 0,
    startPanY: 0,
    lastTranslateX: 0,
    lastTranslateY: 0,
    pinchStartDistance: 0,
    pinchStartZoom: 1,
    isPinching: false,
    lastPinchTime: 0,   // ピンチ操作が最後に完了した時刻
    touchStartTime: 0,  // タッチ開始時刻
    touchStartPos: { x: 0, y: 0 } // タッチ開始位置
};

// 都道府県の枠を読み込む
function loadFrameSVG() {
    if (!wakuSvgData) {
        console.error('waku_data.js が読み込まれていないか、定義されていません');
        return false;
    }
    
    try {
        // SVG要素を作成
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(wakuSvgData, 'image/svg+xml');
        
        // 枠のグループを作成
        const frameGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        frameGroup.id = 'prefecture-frame';
        
        // 位置調整用の変換
        // 注: transform属性を使って調整します（必要に応じて調整してください）
        frameGroup.setAttribute('transform', 'scale(1.00) translate(38, 38)');
        
        // rect要素とpolyline要素を取得して追加
        const shapes = svgDoc.querySelectorAll('rect, polyline');
        shapes.forEach(shape => {
            // 新しい要素を作成
            const newShape = document.createElementNS('http://www.w3.org/2000/svg', shape.tagName);
            
            // 属性をコピー
            Array.from(shape.attributes).forEach(attr => {
                // cls-1クラスは無視し、直接スタイルを適用
                if (attr.name !== 'class') {
                    newShape.setAttribute(attr.name, attr.value);
                }
            });
            
            // スタイルを設定
            newShape.setAttribute('fill', 'none');
            newShape.setAttribute('stroke', '#000');
            newShape.setAttribute('stroke-width', '2');
            newShape.classList.add('prefecture-frame');
            
            // グループに追加
            frameGroup.appendChild(newShape);
        });
        
        // マップに追加（後から追加して都道府県の上に表示）
        mapContainer.appendChild(frameGroup);
        
        return true;
    } catch (error) {
        console.error('枠SVGの解析に失敗しました:', error);
        return false;
    }
}

// SVGデータをHTMLに読み込む
function loadSVGsFromData() {
    if (!prefectureSvgData) {
        console.error('prefecture_data.js が読み込まれていないか、定義されていません');
        loadingMessage.textContent = 'SVGデータの読み込みに失敗しました';
        return;
    }

    // SVGのビューボックスを設定
    mapContainer.setAttribute('viewBox', '0 0 1000 1000');
    
    // 枠を読み込む
    loadFrameSVG();
    
    // すべての都道府県SVGを処理
    for (const [code, svgContent] of Object.entries(prefectureSvgData)) {
        try {
            // パースしたSVGからパスデータを取得
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
            
            // 都道府県グループを作成
            const prefGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            prefGroup.id = `prefecture-${code}`;
            prefGroup.setAttribute('data-code', code);
            
            // 都道府県の名前を検索
            const prefecture = prefectures.find(p => p.code === code);
            if (prefecture) {
                prefGroup.setAttribute('data-name', prefecture.name);
            }
            
            // <path>要素を取得し追加
            const paths = svgDoc.querySelectorAll('path');
            paths.forEach(path => {
                const newPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                
                // 必要な属性をコピー
                if (path.hasAttribute('d')) {
                    newPath.setAttribute('d', path.getAttribute('d'));
                }
                
                // クラスと属性を追加
                newPath.classList.add('prefecture');
                newPath.setAttribute('data-code', code);
                if (prefecture) {
                    newPath.setAttribute('data-name', prefecture.name);
                }
                
                // クリックイベントとタッチイベントの追加部分を以下のように修正
                newPath.addEventListener('click', handlePrefectureClick);

                // タッチでの選択を強化するため、タッチスタート時にもデータを記録
                newPath.addEventListener('touchstart', function(e) {
                    if (e.touches && e.touches.length === 1) {
                        const touch = e.touches[0];
                        // 明示的にこの要素のタッチデータを記録
                        mapState.touchElementCode = this.getAttribute('data-code');
                        mapState.touchElementName = this.getAttribute('data-name');
                    }
                });

                // タップイベントの改善
                newPath.addEventListener('touchend', function(e) {
                    // 同じ要素でのタッチの場合のみ反応
                    if (mapState.touchElementCode === this.getAttribute('data-code')) {
                        handlePrefectureTap(e);
                    }
                });
                
                // グループに追加
                prefGroup.appendChild(newPath);
            });
            
            // マップに追加
            mapContainer.appendChild(prefGroup);
        } catch (error) {
            console.error(`Failed to load SVG for prefecture ${code}:`, error);
        }
    }

    // ロード完了
    loadingMessage.style.display = 'none';
    
    // スケーリングと位置調整を行う
    adjustSVGMap();
    
    // パン機能のセットアップ
    setupMapPanning();
    
    // ピンチズーム機能のセットアップ
    setupPinchZoom();
    
    // ゲームモードに応じたマップ表示ボタンを追加
    addCenterButton();
    
    // マップモードなら最初から全体表示にする
    if (gameState && gameState.gameMode === 'map') {
        resetZoom();
    }
    
    // モバイルデバイスかどうかをチェックして初期調整
    if (isMobileDevice()) {
        adjustForMobile();
    } else {
        adjustForPC(); // PC向けの調整を追加
    }
}

// モバイルデバイスかどうかをチェック
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
}

// モバイルデバイス向けの調整
function adjustForMobile() {
    // マップサイズの初期調整
    if (window.innerWidth <= 480) {
        // 小さい画面では少し拡大して表示
        mapState.zoomLevel = 1.2;
        zoomMap(0); // 現在のズームレベルを適用
    }
}

// PC向けの調整
function adjustForPC() {
    if (!isMobileDevice()) {
        // PCでは初期ズームを少し大きく
        mapState.zoomLevel = 1.25;
        zoomMap(0); // 現在のズームレベルを適用
    }
}

// SVG地図の表示調整
function adjustSVGMap() {
    // すべてのパスを取得
    const paths = document.querySelectorAll('.prefecture');
    if (paths.length === 0) return;

    // バウンディングボックスを計算
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    paths.forEach(path => {
        try {
            const bbox = path.getBBox();
            minX = Math.min(minX, bbox.x);
            minY = Math.min(minY, bbox.y);
            maxX = Math.max(maxX, bbox.x + bbox.width);
            maxY = Math.max(maxY, bbox.y + bbox.height);
        } catch (e) {
            // getBBoxが失敗した場合は無視
        }
    });

    // 計算されたバウンディングボックスでビューボックスを設定
    const width = maxX - minX;
    const height = maxY - minY;
    
    // デバイスに応じてパディングを調整
    const paddingPercentage = isMobileDevice() ? 0.05 : 0.02; // PCでは余白を少なく
    const padding = Math.max(width, height) * paddingPercentage;
    
    // ビューボックスを設定（これにより全体がビューポートに収まる）
    const viewBox = `${minX - padding} ${minY - padding} ${width + padding * 2} ${height + padding * 2}`;
    mapContainer.setAttribute('viewBox', viewBox);
    
    // ズーム用に元のビューボックスを保存
    mapState.originalViewBox = viewBox;
    mapState.currentViewBox = viewBox;
}

// ズーム処理
function zoomMap(zoomDelta) {
    if (!mapState.currentViewBox) return;
    
    // ズームレベルを更新
    mapState.zoomLevel += zoomDelta;
    if (mapState.zoomLevel < 0.5) mapState.zoomLevel = 0.5; // 最小50%
    if (mapState.zoomLevel > 5) mapState.zoomLevel = 5; // 最大500%
    
    // ビューボックスの現在値を取得
    const vb = mapContainer.getAttribute('viewBox').split(' ').map(Number);
    
    // 中心点を計算
    const centerX = vb[0] + vb[2] / 2;
    const centerY = vb[1] + vb[3] / 2;
    
    // 新しいビューボックスサイズを計算
    const originalVb = mapState.originalViewBox.split(' ').map(Number);
    const newWidth = originalVb[2] / mapState.zoomLevel;
    const newHeight = originalVb[3] / mapState.zoomLevel;
    
    // 新しいビューボックス位置を計算（中心点を維持）
    const newX = centerX - newWidth / 2;
    const newY = centerY - newHeight / 2;
    
    // 新しいビューボックスを設定
    const newViewBox = `${newX} ${newY} ${newWidth} ${newHeight}`;
    mapContainer.setAttribute('viewBox', newViewBox);
    mapState.currentViewBox = newViewBox;
}

// ズームをリセット
function resetZoom() {
    if (!mapState.originalViewBox) return;
    
    mapContainer.setAttribute('viewBox', mapState.originalViewBox);
    mapState.currentViewBox = mapState.originalViewBox;
    
    // デバイスに応じてズームレベルをリセット
    if (isMobileDevice()) {
        mapState.zoomLevel = 1;
    } else {
        // PCでは少し拡大して表示
        mapState.zoomLevel = 1.25;
        zoomMap(0); // 現在のズームレベルを適用
    }
    
    mapState.lastTranslateX = 0;
    mapState.lastTranslateY = 0;
}

// ピンチズーム機能のセットアップ
function setupPinchZoom() {
    // タッチスタート時の処理
    mapContainer.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            // 2本指のピンチ操作開始
            mapState.isPinching = true;
            mapState.pinchStartDistance = getTouchDistance(e.touches);
            mapState.pinchStartZoom = mapState.zoomLevel;
            e.preventDefault(); // スクロールを防止
        }
    });
    
    // タッチ移動時の処理
    mapContainer.addEventListener('touchmove', (e) => {
        if (mapState.isPinching && e.touches.length === 2) {
            // 現在の2点間の距離を計算
            const currentDistance = getTouchDistance(e.touches);
            
            // ズーム倍率の計算（相対的な変化）
            const scale = currentDistance / mapState.pinchStartDistance;
            const newZoom = mapState.pinchStartZoom * scale;
            
            // ズームレベルの変化量
            const zoomDelta = newZoom - mapState.zoomLevel;
            
            // ズーム適用
            zoomMap(zoomDelta);
            
            e.preventDefault(); // スクロールを防止
        }
    });
    
    // タッチ終了時の処理
    mapContainer.addEventListener('touchend', (e) => {
        if (mapState.isPinching) {
            mapState.isPinching = false;
            mapState.lastPinchTime = Date.now(); // ピンチ操作の終了時刻を記録
            e.preventDefault(); // スクロールを防止
        }
    });
    
    // タッチキャンセル時の処理
    mapContainer.addEventListener('touchcancel', (e) => {
        mapState.isPinching = false;
        mapState.lastPinchTime = Date.now(); // ピンチ操作の終了時刻を記録
    });
    
    // 2点間の距離を計算する関数
    function getTouchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

// マップのパン（ドラッグ＆ドロップで移動）機能
function setupMapPanning() {
    // マウスイベント
    mapContainer.addEventListener('mousedown', startPan);
    document.addEventListener('mousemove', movePan);
    document.addEventListener('mouseup', endPan);
    
    // タッチイベント
    mapContainer.addEventListener('touchstart', startPanTouch);
    document.addEventListener('touchmove', movePanTouch);
    document.addEventListener('touchend', endPan);
    
    // ホイールでのズーム
    mapContainer.addEventListener('wheel', handleWheel);
}

// パンの開始（マウス）
function startPan(e) {
    if (gameState.answered) return; // 回答中は無効
    
    mapState.isPanning = true;
    mapState.startPanX = e.clientX;
    mapState.startPanY = e.clientY;
    mapContainer.classList.add('grabbing');
}

// startPanTouch関数も修正して、タッチ情報をより確実に記録
function startPanTouch(e) {
    if (gameState.answered || e.touches.length !== 1 || mapState.isPinching) return;
    
    // 現在のタッチ位置を明示的に記録
    if (e.touches && e.touches.length > 0) {
        const touch = e.touches[0];
        mapState.isPanning = true;
        mapState.startPanX = touch.clientX;
        mapState.startPanY = touch.clientY;
        
        // タッチ開始時刻と位置を確実に記録（クリック判定用）
        mapState.touchStartTime = Date.now();
        mapState.touchStartPos = { 
            x: touch.clientX, 
            y: touch.clientY 
        };
    }
}

// パンの移動（マウス）
function movePan(e) {
    if (!mapState.isPanning) return;
    
    // パン操作中はクリックイベントを無効にするためにイベントを消費
    e.preventDefault();
    
    // 現在のビューボックスを取得
    const vb = mapContainer.getAttribute('viewBox').split(' ').map(Number);
    
    // 移動量を計算（スクリーン座標からSVG座標に変換）
    const dx = (mapState.startPanX - e.clientX) * (vb[2] / mapContainer.clientWidth);
    const dy = (mapState.startPanY - e.clientY) * (vb[3] / mapContainer.clientHeight);
    
    // 新しいビューボックスを設定
    const newX = vb[0] + dx;
    const newY = vb[1] + dy;
    mapContainer.setAttribute('viewBox', `${newX} ${newY} ${vb[2]} ${vb[3]}`);
    
    // 次回計算用に保存
    mapState.lastTranslateX = newX;
    mapState.lastTranslateY = newY;
    mapState.startPanX = e.clientX;
    mapState.startPanY = e.clientY;
}

// パンの移動（タッチ）
function movePanTouch(e) {
    if (!mapState.isPanning || e.touches.length !== 1 || mapState.isPinching) return;
    
    // パン中はスクロールを防止
    e.preventDefault();
    
    // 現在のビューボックスを取得
    const vb = mapContainer.getAttribute('viewBox').split(' ').map(Number);
    
    // 移動量を計算
    const dx = (mapState.startPanX - e.touches[0].clientX) * (vb[2] / mapContainer.clientWidth);
    const dy = (mapState.startPanY - e.touches[0].clientY) * (vb[3] / mapContainer.clientHeight);
    
    // 新しいビューボックスを設定
    const newX = vb[0] + dx;
    const newY = vb[1] + dy;
    mapContainer.setAttribute('viewBox', `${newX} ${newY} ${vb[2]} ${vb[3]}`);
    
    // 次回計算用に保存
    mapState.lastTranslateX = newX;
    mapState.lastTranslateY = newY;
    mapState.startPanX = e.touches[0].clientX;
    mapState.startPanY = e.touches[0].clientY;
}

// パンの終了
function endPan() {
    // 短時間のパンはタップ判定のため、isPanningフラグをすぐに解除
    mapState.isPanning = false;
    mapContainer.classList.remove('grabbing');
    
    // 短いパン操作はタップとして扱えるように、パン終了時刻を記録しない
}

// タップで都道府県を選択する処理（モバイル向け）の改善
function handlePrefectureTap(e) {
    // タッチイベントの簡素化と判定条件の緩和
    
    // 直近のピンチ操作後は短い時間だけタップを無効化
    if (mapState.isPinching || (mapState.lastPinchTime && (Date.now() - mapState.lastPinchTime < 150))) {
        e.preventDefault();
        return;
    }
    
    // 簡易タップ判定（従来の複雑な条件を簡素化）
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - mapState.touchStartTime;
    
    // タッチ移動距離の計算を確実に行う
    let touchDistance = 0;
    if (e.changedTouches && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - mapState.touchStartPos.x;
        const deltaY = touch.clientY - mapState.touchStartPos.y;
        touchDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    }
    
    // 判定条件を大幅に緩和（モバイルでも選択しやすく）
    if (touchDistance < 30 && touchDuration < 800) {
        const code = e.target.getAttribute('data-code');
        const name = e.target.getAttribute('data-name');
        
        if (code && name && !gameState.answered) {
            e.preventDefault(); // デフォルトのタッチイベントを防止
            e.stopPropagation(); // イベントの伝播を停止
            handlePrefectureClick({ target: e.target }); // クリックイベントと同様に処理
        }
    }
}


// ホイールでのズーム処理を修正
function handleWheel(e) {
    e.preventDefault();
    
    // ホイール操作でのズーム量
    const delta = -Math.sign(e.deltaY) * 0.1;
    
    // マウス位置を取得
    const rect = mapContainer.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // マウス位置でズーム
    zoomMapAtPoint(delta, mouseX, mouseY);
}

// 指定された点を中心にズームする新しい関数
function zoomMapAtPoint(zoomDelta, pointX, pointY) {
    if (!mapState.currentViewBox) return;
    
    // 現在のビューボックスを取得
    const vb = mapContainer.getAttribute('viewBox').split(' ').map(Number);
    const [currentX, currentY, currentWidth, currentHeight] = vb;
    
    // マウス位置をSVG座標に変換（相対位置を計算）
    const svgWidth = mapContainer.clientWidth;
    const svgHeight = mapContainer.clientHeight;
    const relativeX = pointX / svgWidth;
    const relativeY = pointY / svgHeight;
    
    // 現在のSVG座標系でのマウス位置
    const svgMouseX = currentX + currentWidth * relativeX;
    const svgMouseY = currentY + currentHeight * relativeY;
    
    // ズームレベルを更新
    const oldZoom = mapState.zoomLevel;
    mapState.zoomLevel += zoomDelta;
    if (mapState.zoomLevel < 0.5) mapState.zoomLevel = 0.5; // 最小50%
    if (mapState.zoomLevel > 5) mapState.zoomLevel = 5; // 最大500%
    
    // 新しいビューボックスサイズを計算
    const originalVb = mapState.originalViewBox.split(' ').map(Number);
    const newWidth = originalVb[2] / mapState.zoomLevel;
    const newHeight = originalVb[3] / mapState.zoomLevel;
    
    // 新しいビューボックスの位置を計算（マウス位置を維持）
    const newX = svgMouseX - newWidth * relativeX;
    const newY = svgMouseY - newHeight * relativeY;
    
    // 新しいビューボックスを設定
    const newViewBox = `${newX} ${newY} ${newWidth} ${newHeight}`;
    mapContainer.setAttribute('viewBox', newViewBox);
    mapState.currentViewBox = newViewBox;
}

// ズームボタンのイベントリスナーを設定
zoomInBtn.addEventListener('click', () => {
    zoomMap(0.2); // 20%ズームイン
});

zoomOutBtn.addEventListener('click', () => {
    zoomMap(-0.2); // 20%ズームアウト
});

zoomResetBtn.addEventListener('click', () => {
    resetZoom();
});

// 特定の都道府県を中心に表示する機能
function centerPrefecture(prefectureCode) {
    // 対象の都道府県要素を取得
    const prefElement = document.getElementById(`prefecture-${prefectureCode}`);
    if (!prefElement) return false;
    
    try {
        // 都道府県のバウンディングボックスを計算
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        const paths = prefElement.querySelectorAll('path');
        
        paths.forEach(path => {
            try {
                const bbox = path.getBBox();
                minX = Math.min(minX, bbox.x);
                minY = Math.min(minY, bbox.y);
                maxX = Math.max(maxX, bbox.x + bbox.width);
                maxY = Math.max(maxY, bbox.y + bbox.height);
            } catch (e) {
                // getBBoxが失敗した場合は無視
            }
        });
        
        // 中心点を計算
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        
        // モバイルかどうかで拡大率を調整
        const viewScale = isMobileDevice() ? 3 : 5;
        
        // 表示する領域のサイズを計算
        const width = (maxX - minX) * viewScale;
        const height = (maxY - minY) * viewScale;
        
        // 新しいビューボックスを設定
        const newViewBox = `${centerX - width/2} ${centerY - height/2} ${width} ${height}`;
        mapContainer.setAttribute('viewBox', newViewBox);
        mapState.currentViewBox = newViewBox;
        
        // ズームレベルを更新（アプロキシメーション）
        const originalVb = mapState.originalViewBox.split(' ').map(Number);
        mapState.zoomLevel = originalVb[2] / width;
        
        console.log(`都道府県${prefectureCode}を中心に表示しました`);
        return true;
    } catch (error) {
        console.error('都道府県を中心に表示できませんでした:', error);
        return false;
    }
}

// ゲームモードに応じたマップ表示ボタンを追加
function addCenterButton() {
    const buttonContainer = document.getElementById('zoom-controls');
    
    // すでに中心表示ボタンがある場合は何もしない
    if (document.getElementById('center-prefecture')) return;
    
    // ボタンを作成
    const centerButton = document.createElement('button');
    centerButton.id = 'center-prefecture';
    centerButton.className = 'zoom-button';
    
    // ゲームモードに応じたボタンの初期設定
    updateCenterButtonForGameMode(centerButton);
    
    // ボタンクリック時の処理
    centerButton.addEventListener('click', function() {
        // ゲームモードに応じた処理
        if (gameState.gameMode === 'map') {
            // マップモードでは日本全体を表示（ズームリセット）
            resetZoom();
        } else if (gameState.gameMode === 'choice' && gameState.currentPrefecture) {
            // 選択肢モードではハイライト部分を中心に表示
            centerPrefecture(gameState.currentPrefecture.code);
        }
    });
    
    // ボタンコンテナに追加
    buttonContainer.appendChild(centerButton);
}

// ゲームモードに応じてボタンのテキストと機能を更新
function updateCenterButtonForGameMode(button) {
    if (!button) {
        button = document.getElementById('center-prefecture');
        if (!button) return;
    }
    
    if (gameState.gameMode === 'map') {
        button.textContent = '地図全体を表示';
        button.title = '日本地図全体を表示します';
    } else {
        button.textContent = 'ハイライト部分を表示';
        button.title = 'ハイライトされた都道府県を中心に表示します';
    }
}