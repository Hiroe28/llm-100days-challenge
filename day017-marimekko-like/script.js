document.addEventListener('DOMContentLoaded', () => {
    // キャンバスの設定
    const canvas = document.getElementById('drawing-canvas');
    const ctx = canvas.getContext('2d');
    const flowersContainer = document.getElementById('flowers-container');
    
    // 色のプリセット
    const flowerColors = {
        random: [
            '#e56b6f', // サーモンピンク
            '#6c8ea0', // ダスティブルー
            '#9db17c', // モスグリーン
            '#d8973c', // マスタード
            '#a8516e', // ラズベリー
            '#829079', // セージグリーン
            '#5a7a94', // スチールブルー
            '#b05574', // ローズ
            '#486683', // ネイビー
            '#5e6472'  // チャコール
        ],
        red: ['#e56b6f', '#b05574', '#a8516e', '#cd5c5c', '#ff6347'],
        pink: ['#ffb6c1', '#e56b6f', '#b05574', '#a8516e', '#db7093'],
        blue: ['#6c8ea0', '#5a7a94', '#486683', '#4682b4', '#5f9ea0'],
        green: ['#9db17c', '#829079', '#6b8e23', '#8fbc8f', '#2e8b57'],
        yellow: ['#d8973c', '#daa520', '#f0e68c', '#ffd700', '#ffb400']
    };
    
    // 軌跡記録用の変数
    let isTracing = false;
    let pathPoints = []; // 軌跡のパス
    
    // キャンバスのサイズを設定
    function setCanvasSize() {
        const container = canvas.parentElement;
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        // キャンバスを透明に
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // 初期化
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);
    
    // マウスイベント
    canvas.addEventListener('mousedown', startTracing);
    canvas.addEventListener('mousemove', recordPath);
    canvas.addEventListener('mouseup', endTracing);
    canvas.addEventListener('mouseout', endTracing);
    
    // タッチイベント
    canvas.addEventListener('touchstart', function(e) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        isTracing = true;
        pathPoints = [{x: x, y: y}];
    }, { passive: true });
    
    canvas.addEventListener('touchmove', function(e) {
        if (!isTracing) return;
        
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        pathPoints.push({x: x, y: y});
        
        // 軌跡に沿って花を追加（確率で）
        if (Math.random() < 0.1) {
            addFlowerAt(x, y);
        }
    }, { passive: true });
    
    canvas.addEventListener('touchend', function() {
        endTracing();
    }, { passive: true });
    
    // 軌跡の記録開始
    function startTracing(e) {
        isTracing = true;
        
        // クライアント座標からキャンバス上の座標に変換
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 新しいパスを開始
        pathPoints = [{x: x, y: y}];
    }
    
    // 軌跡の記録
    function recordPath(e) {
        if (!isTracing) return;
        
        // クライアント座標からキャンバス上の座標に変換
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 座標を記録
        pathPoints.push({x: x, y: y});
        
        // 軌跡に沿って花を追加（確率で）
        if (Math.random() < 0.1) {
            addFlowerAt(x, y);
        }
    }
    
    // 軌跡の記録終了
    function endTracing() {
        isTracing = false;
    }
    
    // クリアボタン
    document.getElementById('clear-btn').addEventListener('click', () => {
        // 花をすべて削除
        flowersContainer.innerHTML = '';
        // パスをリセット
        pathPoints = [];
    });
    
    // お花追加ボタン
    document.getElementById('add-flower-btn').addEventListener('click', () => {
        // パスがない場合、ランダムに花を配置
        if (pathPoints.length === 0) {
            for (let i = 0; i < 5; i++) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                addFlowerAt(x, y);
            }
        } else {
            // パスに沿って花を追加
            addFlowersAlongPath();
        }
    });
    
    // 特定の位置に花を追加
    function addFlowerAt(x, y) {
        // 選択されている色を取得
        const colorChoice = document.getElementById('flower-color').value;
        const colors = flowerColors[colorChoice];
        
        // 花のサイズをランダムに決定
        const size = 30 + Math.random() * 40;
        
        // 花の色をランダムに選択
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // 花を生成
        createFlower(x, y, size, color);
    }
    
    // パスに沿って花を追加する
    function addFlowersAlongPath() {
        // パスの長さに応じて花の数を決定
        const numFlowers = Math.min(Math.max(3, Math.floor(pathPoints.length / 20)), 10);
        
        for (let i = 0; i < numFlowers; i++) {
            // パス上のランダムな位置を選択
            const pointIndex = Math.floor(Math.random() * pathPoints.length);
            const point = pathPoints[pointIndex];
            
            // 少しランダムにずらす
            const offsetX = Math.random() * 20 - 10;
            const offsetY = Math.random() * 20 - 10;
            
            addFlowerAt(point.x + offsetX, point.y + offsetY);
        }
    }
    
    // 花を生成する関数
    function createFlower(x, y, size, color) {
        // SVG要素の作成
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'flower');
        svg.setAttribute('width', size * 2);
        svg.setAttribute('height', size * 2);
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.style.left = `${x - size}px`;
        svg.style.top = `${y - size}px`;
        
        // 花びらの数をランダムに決定
        const petalCount = 4 + Math.floor(Math.random() * 5);
        const angleStep = (2 * Math.PI) / petalCount;
        
        // 少し暗い色を中心用に作成
        const centerColor = shadeColor(color, -20);
        
        // 花びらを追加
        for (let i = 0; i < petalCount; i++) {
            const angle = i * angleStep;
            const distance = 30;
            
            const petalX = 50 + Math.cos(angle) * distance;
            const petalY = 50 + Math.sin(angle) * distance;
            
            // 花びらの形を決定（円または楕円）
            const isCircle = Math.random() > 0.5;
            const petal = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            
            if (isCircle) {
                petal.setAttribute('cx', petalX);
                petal.setAttribute('cy', petalY);
                petal.setAttribute('rx', 25);
                petal.setAttribute('ry', 25);
            } else {
                petal.setAttribute('cx', petalX);
                petal.setAttribute('cy', petalY);
                petal.setAttribute('rx', 30);
                petal.setAttribute('ry', 20);
                
                // 楕円を回転
                const rotation = (angle * 180 / Math.PI) + Math.random() * 40 - 20;
                petal.setAttribute('transform', `rotate(${rotation} ${petalX} ${petalY})`);
            }
            
            // 花びらの色と透明度を設定
            petal.setAttribute('fill', color);
            petal.setAttribute('fill-opacity', 0.8 + Math.random() * 0.2);
            
            svg.appendChild(petal);
        }
        
        // 花の中心を作成
        const center = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        center.setAttribute('cx', 50);
        center.setAttribute('cy', 50);
        center.setAttribute('r', 15);
        center.setAttribute('fill', centerColor);
        
        svg.appendChild(center);
        
        // アニメーション効果
        svg.style.opacity = '0';
        svg.style.transform = 'scale(0.2)';
        svg.style.transition = 'all 0.3s ease-out';
        
        // コンテナに追加
        flowersContainer.appendChild(svg);
        
        // アニメーションのトリガー
        setTimeout(() => {
            svg.style.opacity = '1';
            svg.style.transform = 'scale(1)';
        }, 10);
    }
    
    // 色を明るくしたり暗くしたりする関数
    function shadeColor(color, percent) {
        let R = parseInt(color.substring(1, 3), 16);
        let G = parseInt(color.substring(3, 5), 16);
        let B = parseInt(color.substring(5, 7), 16);

        R = parseInt(R * (100 + percent) / 100);
        G = parseInt(G * (100 + percent) / 100);
        B = parseInt(B * (100 + percent) / 100);

        R = (R < 255) ? R : 255;
        G = (G < 255) ? G : 255;
        B = (B < 255) ? B : 255;

        R = Math.max(0, R).toString(16).padStart(2, '0');
        G = Math.max(0, G).toString(16).padStart(2, '0');
        B = Math.max(0, B).toString(16).padStart(2, '0');

        return `#${R}${G}${B}`;
    }
});