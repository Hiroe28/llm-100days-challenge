// グローバル変数
let canvas;
let ctx;
let flowersContainer;
let flowerColors;
let isTracing = false;
let pathPoints = []; // 軌跡のパス

// 音声効果
let soundEnabled = true;
const sounds = {
    flower: [
        'sounds/pop2.mp3'
    ]
};

// 音声を事前にロード
const audioElements = {};

document.addEventListener('DOMContentLoaded', () => {
    // キャンバスの設定
    canvas = document.getElementById('drawing-canvas');
    ctx = canvas.getContext('2d');
    flowersContainer = document.getElementById('flowers-container');
    
    // 色のプリセット
    flowerColors = {
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
    
    // 音声を事前にロード
    sounds.flower.forEach((url, index) => {
        audioElements[`flower-${index}`] = new Audio(url);
    });
    
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
    
    // 保存ボタン
    document.getElementById('save-btn').addEventListener('click', saveArtwork);

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

    // 背景色変更
    document.getElementById('background-color').addEventListener('change', function(e) {
        document.querySelector('.canvas-container').style.backgroundColor = e.target.value;
    });

    // 音のトグル設定
    document.getElementById('sound-toggle').addEventListener('change', function(e) {
        soundEnabled = e.target.checked;
    });

    // チュートリアル機能
    const tutorialSeen = localStorage.getItem('marimekkoTutorialSeen');
    
    if (!tutorialSeen) {
        // チュートリアルを表示
        document.getElementById('tutorial-container').style.display = 'flex';
    } else {
        // チュートリアルを非表示
        document.getElementById('tutorial-container').style.display = 'none';
    }
    
    // 「お絵かき開始」ボタンのイベント
    document.getElementById('start-drawing-btn').addEventListener('click', function() {
        // チュートリアルを非表示
        document.getElementById('tutorial-container').style.display = 'none';
        
        // ローカルストレージに表示済みフラグを設定
        localStorage.setItem('marimekkoTutorialSeen', 'true');
    });
    
    // ヘルプボタンのイベント
    document.getElementById('help-btn').addEventListener('click', function() {
        // チュートリアルを再表示
        document.getElementById('tutorial-container').style.display = 'flex';
    });
    
    // 花にホバーエフェクト追加
    addHoverEffects();
});

// 花にホバーエフェクト追加（タッチデバイスでは無効）
function addHoverEffects() {
    // マウスを使用しているか判定（タッチデバイスでは無効化）
    if (window.matchMedia('(hover: hover)').matches) {
        document.addEventListener('mouseover', function(e) {
            if (e.target.classList.contains('flower')) {
                e.target.classList.add('pop-animation');
            }
        });
        
        document.addEventListener('mouseout', function(e) {
            if (e.target.classList.contains('flower')) {
                e.target.classList.remove('pop-animation');
            }
        });
    }
}

// 作品を保存する関数
function saveArtwork() {
    // 一時的なキャンバスを作成して背景と花を結合
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // 背景色を取得
    const backgroundColor = document.querySelector('.canvas-container').style.backgroundColor || '#ffffff';
    
    // 背景を描画
    tempCtx.fillStyle = backgroundColor;
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // 花のSVGを画像に変換して描画
    const flowers = document.querySelectorAll('.flower');
    
    // すべての花が描画されるのを待つためのPromise配列
    const drawPromises = Array.from(flowers).map(flower => {
        return new Promise(resolve => {
            // SVGをデータURLに変換
            const svgData = new XMLSerializer().serializeToString(flower);
            const svg64 = btoa(svgData);
            const svgDataUrl = 'data:image/svg+xml;base64,' + svg64;
            
            // データURLから画像を作成
            const img = new Image();
            img.onload = function() {
                // 花の位置を取得
                const left = parseFloat(flower.style.left);
                const top = parseFloat(flower.style.top);
                
                // 画像を描画
                tempCtx.drawImage(img, left, top, parseFloat(flower.getAttribute('width')), 
                                  parseFloat(flower.getAttribute('height')));
                resolve();
            };
            img.src = svgDataUrl;
        });
    });
    
    // すべての花の描画が完了したら保存処理を続行
    Promise.all(drawPromises).then(() => {
        // データURLを生成
        const dataURL = tempCanvas.toDataURL('image/png');
        
        // ダウンロードリンクを作成
        const link = document.createElement('a');
        link.download = 'marimekko-artwork.png';
        link.href = dataURL;
        
        // リンクをクリックしてダウンロード開始
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

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
    createMotif(x, y, size, color);
    
    // 音を鳴らす
    playSound('flower');
    
    // アニメーション効果（リップル）
    createRippleEffect(x, y);
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

// 花の種類による描画関数
function createMotif(x, y, size, color) {
    const motifType = document.getElementById('flower-type').value;
    
    // SVG要素の作成
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'flower');
    svg.setAttribute('width', size * 2);
    svg.setAttribute('height', size * 2);
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.style.left = `${x - size}px`;
    svg.style.top = `${y - size}px`;
    
    // 少し暗い色を中心用に作成
    const centerColor = shadeColor(color, -20);
    
    switch(motifType) {
        case 'flower':
            // 既存の花の描画コード
            drawFlower(svg, color, centerColor);
            break;
        case 'leaf':
            drawLeaf(svg, color);
            break;
        case 'heart':
            drawHeart(svg, color);
            break;
        case 'star':
            drawStar(svg, color);
            break;
        case 'circle':
            drawCircle(svg, color);
            break;
    }
    
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

// 花を描画する関数
function drawFlower(svg, color, centerColor) {
    // 花びらの数をランダムに決定
    const petalCount = 4 + Math.floor(Math.random() * 5);
    const angleStep = (2 * Math.PI) / petalCount;
    
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
}

// 葉っぱを描画する関数
function drawLeaf(svg, color) {
    // 葉っぱの形を作成
    const leaf = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    // ランダムな回転
    const rotation = Math.random() * 360;
    
    // 葉っぱのパス
    const d = 'M50,15 C70,30 70,50 50,85 C30,50 30,30 50,15 Z';
    
    leaf.setAttribute('d', d);
    leaf.setAttribute('fill', color);
    leaf.setAttribute('transform', `rotate(${rotation} 50 50)`);
    leaf.setAttribute('fill-opacity', 0.9);
    
    // 葉の筋を追加
    const vein = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    vein.setAttribute('d', 'M50,15 L50,85');
    vein.setAttribute('stroke', shadeColor(color, -30));
    vein.setAttribute('stroke-width', '2');
    vein.setAttribute('transform', `rotate(${rotation} 50 50)`);
    
    svg.appendChild(leaf);
    svg.appendChild(vein);
}

// ハートを描画する関数
function drawHeart(svg, color) {
    const heart = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    // ハートのパス
    const d = 'M50,90 C30,70 10,50 10,30 C10,15 20,5 35,5 C45,5 50,15 50,25 C50,15 55,5 65,5 C80,5 90,15 90,30 C90,50 70,70 50,90 Z';
    
    heart.setAttribute('d', d);
    heart.setAttribute('fill', color);
    
    svg.appendChild(heart);
}

// 星を描画する関数
function drawStar(svg, color) {
    const star = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    
    // 5角形の星の座標
    const points = calculateStarPoints(50, 50, 5, 45, 20);
    
    star.setAttribute('points', points);
    star.setAttribute('fill', color);
    
    svg.appendChild(star);
}

// 星の頂点を計算する関数
function calculateStarPoints(centerX, centerY, points, outerRadius, innerRadius) {
    let output = '';
    
    for (let i = 0; i < points * 2; i++) {
        // 外側または内側の半径を交互に使用
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (Math.PI / points) * i;
        
        const x = centerX + radius * Math.sin(angle);
        const y = centerY - radius * Math.cos(angle);
        
        output += `${x},${y} `;
    }
    
    return output.trim();
}

// 丸を描画する関数
function drawCircle(svg, color) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    
    circle.setAttribute('cx', 50);
    circle.setAttribute('cy', 50);
    circle.setAttribute('r', 40);
    circle.setAttribute('fill', color);
    
    // 内側の丸（マリメッコ風に）
    const innerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    innerCircle.setAttribute('cx', 50);
    innerCircle.setAttribute('cy', 50);
    innerCircle.setAttribute('r', 25);
    innerCircle.setAttribute('fill', shadeColor(color, 15));
    
    svg.appendChild(circle);
    svg.appendChild(innerCircle);
}

// 音を再生する関数
function playSound(type) {
    if (!soundEnabled) return;
    
    // ランダムな音を選択
    const soundIndex = Math.floor(Math.random() * sounds[type].length);
    const audio = audioElements[`${type}-${soundIndex}`];
    
    // 音声を再生
    audio.currentTime = 0;
    audio.play().catch(e => console.log('音声再生エラー:', e));
}

// リップルエフェクトを作成
function createRippleEffect(x, y) {
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    flowersContainer.appendChild(ripple);
    
    // アニメーションが終わったら要素を削除
    setTimeout(() => {
        ripple.remove();
    }, 600);
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