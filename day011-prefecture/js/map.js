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
    lastTranslateY: 0
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
                
                // クリックイベントの追加
                newPath.addEventListener('click', handlePrefectureClick);
                
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
    
    // 中心表示ボタンを追加
    addCenterButton();
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
    const padding = Math.max(width, height) * 0.05; // 5%のパディング
    
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
    mapState.zoomLevel = 1;
    mapState.lastTranslateX = 0;
    mapState.lastTranslateY = 0;
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

// パンの開始（タッチ）
function startPanTouch(e) {
    if (gameState.answered || e.touches.length !== 1) return;
    
    mapState.isPanning = true;
    mapState.startPanX = e.touches[0].clientX;
    mapState.startPanY = e.touches[0].clientY;
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
    if (!mapState.isPanning || e.touches.length !== 1) return;
    
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
    mapState.isPanning = false;
    mapContainer.classList.remove('grabbing');
}

// ホイールでのズーム処理
function handleWheel(e) {
    e.preventDefault();
    
    // ホイール操作でのズーム量の調整（デルタが大きすぎる場合は調整）
    const delta = -Math.sign(e.deltaY) * 0.1;
    zoomMap(delta);
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
        // ズームレベルをリセット（もっと引きの状態に調整）
        mapState.zoomLevel = 1.0;
        
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
        
        // 表示する領域のサイズを計算（より広い範囲を表示）
        const width = (maxX - minX) * 5; // 5倍に拡大（より引いた表示に）
        const height = (maxY - minY) * 5;
        
        // 新しいビューボックスを設定
        const newViewBox = `${centerX - width/2} ${centerY - height/2} ${width} ${height}`;
        mapContainer.setAttribute('viewBox', newViewBox);
        mapState.currentViewBox = newViewBox;
        
        console.log(`都道府県${prefectureCode}を中心に表示しました`);
        return true;
    } catch (error) {
        console.error('都道府県を中心に表示できませんでした:', error);
        return false;
    }
}

// 都道府県クリック時に中心表示するボタンを追加
function addCenterButton() {
    const buttonContainer = document.getElementById('zoom-controls');
    
    // すでに中心表示ボタンがある場合は何もしない
    if (document.getElementById('center-prefecture')) return;
    
    // 中心表示ボタンを作成
    const centerButton = document.createElement('button');
    centerButton.id = 'center-prefecture';
    centerButton.className = 'zoom-button';
    centerButton.textContent = '問題を表示';
    centerButton.title = '問題の都道府県を中心に表示';
    
    // ボタンクリック時の処理
    centerButton.addEventListener('click', function() {
        if (gameState && gameState.currentPrefecture) {
            centerPrefecture(gameState.currentPrefecture.code);
        }
    });
    
    // ボタンコンテナに追加
    buttonContainer.appendChild(centerButton);
}