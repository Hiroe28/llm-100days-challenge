// script.js
// リアルタイムARメイクアップアプリのJavaScript実装

// グローバル変数
let video, canvas, ctx;
let faceMesh, selfieSegmentation, camera;
let makeupSettings = {
    lipstick: {
        color: '#e91e63',
        opacity: 0.5,
        enabled: false  // trueからfalseに変更
    },
    blush: {
        color: '#f8bbd0',
        opacity: 0.4,
        enabled: false  // trueからfalseに変更
    },
    eyeshadow: {
        color: '#bcaaa4',
        opacity: 0.4,
        enabled: false  // trueからfalseに変更
    }
};

let accessorySettings = {
    type: 'none',
    enabled: false
};

let headSettings = {
    type: 'none',
    enabled: false
};

let backgroundSettings = {
    type: 'none',
    enabled: false,
    image: null
};

// アクセサリーと背景画像のプリロード
const accessoryImages = {
    earringLeft: new Image(),
    earringRight: new Image(),
    earringLeft2: new Image(),  // 追加
    earringRight2: new Image(), // 追加
    necklace: new Image(),
    necklace2: new Image(),     // 追加
    glasses: new Image(),
    choker: new Image(),
    sunglasses: new Image()
};

const headImages = {
    catEars: new Image(),
    rabbitEars: new Image(),
    flowerCrown: new Image(),
    tiara: new Image(),      // アクセサリーから移動
    hairpin: new Image()     // アクセサリーから移動
};

const backgroundImages = {
    beach: new Image(),
    citynight: new Image(),
    forest: new Image(),
    blur: new Image(),
    cafe: new Image(),
    sakura: new Image(),
    party: new Image(),
    sunset: new Image()
};

// FaceMeshの顔のランドマーク定義
const FACEMESH_LANDMARKS = {
    lips: [
        // 上唇の外側
        61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291,
        // 上唇の内側
        78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308,
        // 下唇の内側
        78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308,
        // 下唇の外側
        61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291
    ],
    leftCheek: [
        123, 50, 101, 100, 47, 114, 188
    ],
    rightCheek: [
        352, 280, 330, 329, 277, 343, 417
    ],
    leftEye: [
        // 左目の周り
        263, 249, 390, 373, 374, 380, 381, 382, 362, 
        398, 384, 385, 386, 387, 388, 466, 263
    ],
    rightEye: [
        // 右目の周り
        33, 7, 163, 144, 145, 153, 154, 155, 133, 
        173, 157, 158, 159, 160, 161, 246, 33
    ],
    ears: {
        left: 234,
        right: 454
    },
    nose: 1,
    forehead: 10,
    chin: 152
};

// アプリケーションの初期化
async function init() {
    // DOM要素の取得
    video = document.getElementById('input-video');
    canvas = document.getElementById('output-canvas');
    ctx = canvas.getContext('2d');
    
    // 画像のロード
    await loadImages();
    
    // MediaPipe FaceMeshの設定
    faceMesh = new FaceMesh({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
    });
    
    faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    
    faceMesh.onResults(onFaceMeshResults);
    
    // MediaPipe Selfie Segmentationの設定
    selfieSegmentation = new SelfieSegmentation({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
        }
    });
    
    selfieSegmentation.setOptions({
        modelSelection: 1, // 1=一般的なモデル、0=ランドスケープモデル
    });
    
    selfieSegmentation.onResults(onSegmentationResults);
    
    // カメラのセットアップと処理パイプラインの設定
    setupCamera();
    
    try {
        await camera.start();
        console.log('カメラ開始成功');
        // キャンバスサイズの調整
        adjustCanvasSize();
        window.addEventListener('resize', adjustCanvasSize);
    } catch (error) {
        console.error('カメラ開始エラー:', error);
        handleCameraError(error);
    }
    
    // イベントリスナーの設定
    setupEventListeners();
    
    // 初期パネルのオープン状態を設定
    initializePanels();
    
    // デフォルトでクリアプリセットをアクティブに
    document.querySelector('.preset-button[data-preset="clear"]').classList.add('active');

    // アプリケーションの読み込み完了アニメーション
    showAppLoadedAnimation();
}

// アプリケーションのロード完了アニメーション
function showAppLoadedAnimation() {
    const elements = document.querySelectorAll('.panel, .tab-container, .video-container');
    elements.forEach((el, index) => {
        setTimeout(() => {
            el.classList.add('slide-up');
        }, 100 * index);
    });
}

// パネルの初期状態設定
function initializePanels() {
    // 全てのパネルをオープンにする
    document.querySelectorAll('.panel').forEach((panel) => {
        panel.classList.add('open');
    });
}

// カメラのセットアップ
function setupCamera() {
    // モバイルブラウザのチェック
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    try {
        // MediaDevices APIが利用可能かチェック
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('お使いのブラウザはカメラにアクセスできません。最新のブラウザを使用するか、HTTPSで接続してください。');
        }
        
        camera = new Camera(video, {
            onFrame: async () => {
                // 背景処理が有効な場合、Selfie Segmentationを使用
                if (backgroundSettings.enabled && backgroundSettings.type !== 'none') {
                    await selfieSegmentation.send({image: video});
                    // 背景処理の後にFaceMeshも実行するのは、onSegmentationResultsの中で行う
                } else {
                    // 背景処理が無効な場合は直接FaceMeshを実行
                    await faceMesh.send({image: video});
                }
            },
            width: 640,
            height: 480
        });
    } catch (error) {
        console.error('カメラセットアップエラー:', error);
        handleCameraError(error);
    }
}

// カメラエラー処理
function handleCameraError(error) {
    // より詳細なエラーメッセージ
    let errorMessage = 'カメラへのアクセスに失敗しました。';
    
    if (error.name === 'NotAllowedError') {
        errorMessage = 'カメラへのアクセスが許可されていません。ブラウザの設定でカメラへのアクセスを許可してください。';
    } else if (error.name === 'NotFoundError') {
        errorMessage = 'カメラが見つかりませんでした。';
    } else if (error.name === 'NotReadableError') {
        errorMessage = 'カメラにアクセスできません。他のアプリがカメラを使用している可能性があります。';
    } else if (error.name === 'SecurityError' || !window.isSecureContext) {
        errorMessage = 'セキュリティ上の理由からカメラにアクセスできません。HTTPSで接続してください。';
    }
    
    showError(errorMessage);
    
    // カメラにアクセスできない場合はサンプル画像を表示
    showSampleImage();
}

// カメラが使えない場合のサンプル画像表示
function showSampleImage() {
    // サンプル顔画像を表示（デモ用）
    const sampleFace = new Image();
    sampleFace.src = 'img/sample-face.jpg'; // サンプル画像のパス
    sampleFace.onload = () => {
        ctx.drawImage(sampleFace, 0, 0, canvas.width, canvas.height);
        
        // サンプルモードのメッセージ
        const messageContainer = document.createElement('div');
        messageContainer.className = 'sample-mode-message';
        messageContainer.innerHTML = '<i class="fas fa-info-circle"></i> サンプルモード - カメラが利用できません';
        document.querySelector('.video-container').appendChild(messageContainer);
    };
    
    // エラー時はサンプル画像を読み込めない場合の対応
    sampleFace.onerror = () => {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#333';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('カメラにアクセスできません', canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillText('HTTPSで接続するか、別のブラウザをお試しください', canvas.width / 2, canvas.height / 2 + 20);
    };
}

// 画像のロード
// loadImages関数の修正 - backgroundPromisesを定義
async function loadImages() {
    const loadImage = (url) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    };
    
    try {
        // ローディングインジケータを表示
        document.getElementById('loading').style.display = 'block';
        
        // アクセサリー画像のロード
        const accessoryPromises = [];
        accessoryPromises.push(loadImage('img/earring-left.png').then(img => accessoryImages.earringLeft = img).catch(() => console.warn('Failed to load earring-left.png')));
        accessoryPromises.push(loadImage('img/earring-right.png').then(img => accessoryImages.earringRight = img).catch(() => console.warn('Failed to load earring-right.png')));
        accessoryPromises.push(loadImage('img/earring2-left.png').then(img => accessoryImages.earringLeft2 = img).catch(() => console.warn('Failed to load earring2-left.png')));
        accessoryPromises.push(loadImage('img/earring2-right.png').then(img => accessoryImages.earringRight2 = img).catch(() => console.warn('Failed to load earring2-right.png')));
        accessoryPromises.push(loadImage('img/necklace.png').then(img => accessoryImages.necklace = img).catch(() => console.warn('Failed to load necklace.png')));
        accessoryPromises.push(loadImage('img/necklace2.png').then(img => accessoryImages.necklace2 = img).catch(() => console.warn('Failed to load necklace2.png')));
        accessoryPromises.push(loadImage('img/glasses.png').then(img => accessoryImages.glasses = img).catch(() => console.warn('Failed to load glasses.png')));
        accessoryPromises.push(loadImage('img/choker.png').then(img => accessoryImages.choker = img).catch(() => console.warn('Failed to load choker.png')));
        accessoryPromises.push(loadImage('img/sunglasses.png').then(img => accessoryImages.sunglasses = img).catch(() => console.warn('Failed to load sunglasses.png')));
        
        // あたま用画像のロード（旧デコレーション）
        const headPromises = [];
        headPromises.push(loadImage('img/cat-ears.png').then(img => headImages.catEars = img).catch(() => console.warn('Failed to load cat-ears.png')));
        headPromises.push(loadImage('img/rabbit-ears.png').then(img => headImages.rabbitEars = img).catch(() => console.warn('Failed to load rabbit-ears.png')));
        headPromises.push(loadImage('img/flower-crown.png').then(img => headImages.flowerCrown = img).catch(() => console.warn('Failed to load flower-crown.png')));
        headPromises.push(loadImage('img/tiara.png').then(img => headImages.tiara = img).catch(() => console.warn('Failed to load tiara.png')));
        headPromises.push(loadImage('img/hairpin.png').then(img => headImages.hairpin = img).catch(() => console.warn('Failed to load hairpin.png')));
        
        // 背景画像のロード - backgroundPromisesを定義
        const backgroundPromises = [];
        backgroundPromises.push(loadImage('img/bg-beach.png').then(img => backgroundImages.beach = img).catch(() => console.warn('Failed to load bg-beach.png')));
        backgroundPromises.push(loadImage('img/bg-citynight.png').then(img => backgroundImages.citynight = img).catch(() => console.warn('Failed to load bg-citynight.png')));
        backgroundPromises.push(loadImage('img/bg-forest.png').then(img => backgroundImages.forest = img).catch(() => console.warn('Failed to load bg-forest.png')));
        backgroundPromises.push(loadImage('img/bg-blur.png').then(img => backgroundImages.blur = img).catch(() => console.warn('Failed to load bg-blur.png')));
        backgroundPromises.push(loadImage('img/bg-cafe.png').then(img => backgroundImages.cafe = img).catch(() => console.warn('Failed to load bg-cafe.png')));
        backgroundPromises.push(loadImage('img/bg-sakura.png').then(img => backgroundImages.sakura = img).catch(() => console.warn('Failed to load bg-sakura.png')));
        backgroundPromises.push(loadImage('img/bg-party.png').then(img => backgroundImages.party = img).catch(() => console.warn('Failed to load bg-party.png')));
        backgroundPromises.push(loadImage('img/bg-sunset.png').then(img => backgroundImages.sunset = img).catch(() => console.warn('Failed to load bg-sunset.png')));
        
        // すべての画像ロードを並行処理
        await Promise.allSettled([
            ...accessoryPromises,
            ...headPromises,
            ...backgroundPromises
        ]);
        
        // ローディングインジケータを非表示
        document.getElementById('loading').style.display = 'none';
        
        console.log('画像のロード完了');
    } catch (error) {
        console.error('画像のロードエラー:', error);
        document.getElementById('loading').style.display = 'none';
        
        // エラーメッセージを表示
        showError('一部の画像のロードに失敗しました。アプリの機能が制限される場合があります。');
    }
}

// キャンバスサイズの調整
function adjustCanvasSize() {
    const containerWidth = video.clientWidth;
    const containerHeight = video.clientHeight;
    
    canvas.width = containerWidth;
    canvas.height = containerHeight;
}

// イベントリスナーの設定
function setupEventListeners() {
    // タブの切り替え
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // 全てのタブとコンテンツを非アクティブにする
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // クリックされたタブとそれに対応するコンテンツをアクティブにする
            tab.classList.add('active');
            const tabName = tab.dataset.tab;
            document.getElementById(`${tabName}-tab`).classList.add('active');
            
            // タブ切り替え時の軽やかなアニメーション
            addTabSwitchAnimation(document.getElementById(`${tabName}-tab`));
        });
    });
    
    // メイクアップの色選択
    setupColorSelectors('lipstick-colors', 'lipstick');
    setupColorSelectors('blush-colors', 'blush');
    setupColorSelectors('eyeshadow-colors', 'eyeshadow');
    
    // 不透明度スライダー
    setupOpacitySlider('lipstick-opacity', 'lipstick-opacity-value', 'lipstick');
    setupOpacitySlider('blush-opacity', 'blush-opacity-value', 'blush');
    setupOpacitySlider('eyeshadow-opacity', 'eyeshadow-opacity-value', 'eyeshadow');
    
    // トグルスイッチ
    setupToggleSwitch('lipstick-toggle', 'lipstick');
    setupToggleSwitch('blush-toggle', 'blush');
    setupToggleSwitch('eyeshadow-toggle', 'eyeshadow');
    setupToggleSwitch('accessory-toggle', 'accessory');
    setupToggleSwitch('head-toggle', 'head');
    setupToggleSwitch('background-toggle', 'background');
    
    // アクセサリー選択
    setupAccessorySelectors();
    
    // あたまアイテム選択（旧デコレーション）
    setupHeadSelectors();
    
    // 背景選択
    setupBackgroundSelectors();
    
    // プリセットボタン
    document.querySelectorAll('.preset-button').forEach(button => {
        button.addEventListener('click', () => {
            // アクティブクラスをトグル
            document.querySelectorAll('.preset-button').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
            
            // プリセットを適用
            applyPreset(button.dataset.preset);
            
            // ボタンのプレス効果
            addButtonPressAnimation(button);
        });
    });
    
    // スナップショットボタン（PC用）
    document.getElementById('snapshot-button').addEventListener('click', () => {
        takeSnapshot();
        addButtonPressAnimation(document.getElementById('snapshot-button'));
    });
    
    // スナップショットボタン（モバイル用）
    const mobileButton = document.getElementById('snapshot-button-mobile');
    if (mobileButton) {
        mobileButton.addEventListener('click', () => {
            takeSnapshot();
            addButtonPressAnimation(mobileButton);
        });
    }
    
    // パネルの開閉（アコーディオン機能）
    setupAccordionPanels();
}

// パネルのアコーディオン機能セットアップ
function setupAccordionPanels() {
    document.querySelectorAll('.panel-header').forEach(header => {
        header.addEventListener('click', () => {
            const panel = header.parentElement;
            panel.classList.toggle('open');
            
            // アイコン回転アニメーション
            const toggleIcon = header.querySelector('.panel-toggle i');
            if (panel.classList.contains('open')) {
                toggleIcon.style.transform = 'rotate(180deg)';
            } else {
                toggleIcon.style.transform = 'rotate(0deg)';
            }
        });
    });
}

// タブ切り替えアニメーション
function addTabSwitchAnimation(tabContent) {
    tabContent.style.animation = 'none';
    setTimeout(() => {
        tabContent.style.animation = 'fadeIn 0.3s ease forwards';
    }, 10);
}

// ボタンプレスアニメーション
function addButtonPressAnimation(button) {
    button.classList.add('pressed');
    setTimeout(() => {
        button.classList.remove('pressed');
    }, 200);
}

// 色選択セレクタのセットアップ
function setupColorSelectors(containerId, feature) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', () => {
            // 選択状態の更新
            container.querySelectorAll('.color-option').forEach(el => {
                el.classList.remove('selected');
            });
            option.classList.add('selected');
            
            // 色の設定を更新
            const color = option.dataset.color;
            makeupSettings[feature].color = color;
            
            // 色選択時のアニメーション
            addColorSelectionAnimation(option);
        });
    });
}

// 色選択時のアニメーション
function addColorSelectionAnimation(colorOption) {
    colorOption.style.transform = 'scale(1.2)';
    setTimeout(() => {
        colorOption.style.transform = 'scale(1.1)';
    }, 200);
}

// 不透明度スライダーのセットアップ
function setupOpacitySlider(sliderId, valueId, feature) {
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueId);
    
    if (!slider || !valueDisplay) return;
    
    slider.addEventListener('input', () => {
        const value = slider.value;
        valueDisplay.textContent = `${value}%`;
        makeupSettings[feature].opacity = value / 100;
    });
}

// トグルスイッチのセットアップ
function setupToggleSwitch(toggleId, feature) {
    const toggle = document.getElementById(toggleId);
    if (!toggle) return;
    
    toggle.addEventListener('change', () => {
        if (feature === 'accessory') {
            accessorySettings.enabled = toggle.checked;
        } else if (feature === 'head') {  // 'decoration' から 'head' に変更
            headSettings.enabled = toggle.checked;
        } else if (feature === 'background') {
            backgroundSettings.enabled = toggle.checked;
            // カメラを再起動して処理パイプラインを更新
            updateProcessingPipeline();
        } else {
            makeupSettings[feature].enabled = toggle.checked;
        }
    });
}

// アクセサリーセレクタのセットアップ
function setupAccessorySelectors() {
    const container = document.querySelector('.accessory-options');
    if (!container) return;
    
    container.querySelectorAll('.accessory-option').forEach(option => {
        option.addEventListener('click', () => {
            // 選択状態の更新
            container.querySelectorAll('.accessory-option').forEach(el => {
                el.classList.remove('selected');
            });
            option.classList.add('selected');
            
            // アクセサリーの設定を更新
            const type = option.dataset.type;
            accessorySettings.type = type;
            
            // なし以外が選択された場合、トグルをオンにする
            if (type !== 'none') {
                document.getElementById('accessory-toggle').checked = true;
                accessorySettings.enabled = true;
            } else {
                document.getElementById('accessory-toggle').checked = false;
                accessorySettings.enabled = false;
            }
            
            // 選択時のアニメーション
            addAccessorySelectionAnimation(option);
        });
    });
}

// アクセサリー選択時のアニメーション
function addAccessorySelectionAnimation(option) {
    option.style.transform = 'translateY(-5px)';
    setTimeout(() => {
        option.style.transform = 'translateY(-3px)';
    }, 200);
}

// 「あたま」セレクタのセットアップ (旧デコレーション)
function setupHeadSelectors() {
    const container = document.querySelector('.head-options');
    if (!container) return;
    
    container.querySelectorAll('.head-option').forEach(option => {
        option.addEventListener('click', () => {
            // 選択状態の更新
            container.querySelectorAll('.head-option').forEach(el => {
                el.classList.remove('selected');
            });
            option.classList.add('selected');
            
            // あたまアイテムの設定を更新
            const type = option.dataset.type;
            headSettings.type = type;
            
            // なし以外が選択された場合、トグルをオンにする
            if (type !== 'none') {
                document.getElementById('head-toggle').checked = true;
                headSettings.enabled = true;
            } else {
                document.getElementById('head-toggle').checked = false;
                headSettings.enabled = false;
            }
            
            // 選択時のアニメーション
            addHeadSelectionAnimation(option);
        });
    });
}

// あたまアイテム選択時のアニメーション
function addHeadSelectionAnimation(option) {
    option.style.transform = 'translateY(-5px)';
    setTimeout(() => {
        option.style.transform = 'translateY(-3px)';
    }, 200);
}

// 背景セレクタのセットアップ
function setupBackgroundSelectors() {
    const container = document.querySelector('.background-options');
    if (!container) return;
    
    container.querySelectorAll('.background-option').forEach(option => {
        option.addEventListener('click', () => {
            // 選択状態の更新
            container.querySelectorAll('.background-option').forEach(el => {
                el.classList.remove('selected');
            });
            option.classList.add('selected');
            
            // 背景の設定を更新
            const type = option.dataset.type;
            backgroundSettings.type = type;
            
            if (type !== 'none') {
                backgroundSettings.image = backgroundImages[type];
                document.getElementById('background-toggle').checked = true;
                backgroundSettings.enabled = true;
            } else {
                backgroundSettings.image = null;
                document.getElementById('background-toggle').checked = false;
                backgroundSettings.enabled = false;
            }
            
            updateProcessingPipeline();
            
            // 選択時のアニメーション
            addBackgroundSelectionAnimation(option);
        });
    });
}

// 背景選択時のアニメーション
function addBackgroundSelectionAnimation(option) {
    option.style.transform = 'translateY(-5px)';
    setTimeout(() => {
        option.style.transform = 'translateY(-3px)';
    }, 200);
}

// 処理パイプラインの更新
function updateProcessingPipeline() {
    // ローディングインジケータを表示
    document.getElementById('loading').style.display = 'block';
    
    // カメラを一旦停止
    if (camera) {
        camera.stop();
    }
    
    // 設定を変更した新しいカメラインスタンスを作成
    setupCamera();
    
    // 新しいカメラインスタンスを開始
    camera.start().then(() => {
        // ローディングインジケータを非表示
        document.getElementById('loading').style.display = 'none';
    }).catch(error => {
        console.error('カメラ再起動エラー:', error);
        document.getElementById('loading').style.display = 'none';
        handleCameraError(error);
    });
}

// プリセットの適用
function applyPreset(preset) {
    // プリセット適用中のインジケータを表示
    document.getElementById('loading').textContent = 'プリセット適用中...';
    document.getElementById('loading').style.display = 'block';
    
    setTimeout(() => {
    switch (preset) {
        case 'natural':
            // ナチュラルメイク設定
            updateMakeupSettings({
                lipstick: { color: '#e57373', opacity: 0.3, enabled: true },
                blush: { color: '#ffccbc', opacity: 0.25, enabled: true },
                eyeshadow: { color: '#bcaaa4', opacity: 0.3, enabled: true }
            });
            break;
            
        case 'glamour':
            // グラマラスメイク設定
            updateMakeupSettings({
                lipstick: { color: '#d32f2f', opacity: 0.7, enabled: true },
                blush: { color: '#e57373', opacity: 0.4, enabled: true },
                eyeshadow: { color: '#9e9e9e', opacity: 0.6, enabled: true }
            });
            break;
            
        case 'cute':
            // キュートメイク設定
            updateMakeupSettings({
                lipstick: { color: '#ff80ab', opacity: 0.5, enabled: true },
                blush: { color: '#f8bbd0', opacity: 0.5, enabled: true },
                eyeshadow: { color: '#9fa8da', opacity: 0.4, enabled: true }
            });
            break;
            
        case 'clear':
            // すべてクリア
            makeupSettings.lipstick.enabled = false;
            makeupSettings.blush.enabled = false;
            makeupSettings.eyeshadow.enabled = false;
            accessorySettings.enabled = false;
            filterSettings.enabled = false;
            backgroundSettings.enabled = false;
            // UIの選択状態をリセット
            resetSelections();
            break;
    }
        
        // UIの値を更新
        updateUIFromSettings();
        
        // インジケータを非表示
        document.getElementById('loading').style.display = 'none';
    }, 300);
}

// メイクアップ設定の更新
function updateMakeupSettings(settings) {
    for (const [feature, options] of Object.entries(settings)) {
        if (makeupSettings[feature]) {
            if (options.color) makeupSettings[feature].color = options.color;
            if (options.opacity !== undefined) makeupSettings[feature].opacity = options.opacity;
            if (options.enabled !== undefined) makeupSettings[feature].enabled = options.enabled;
        }
    }
}

// UIの選択状態をリセット
function resetSelections() {
    // トグルスイッチをリセット
    document.getElementById('lipstick-toggle').checked = false;
    document.getElementById('blush-toggle').checked = false;
    document.getElementById('eyeshadow-toggle').checked = false;
    document.getElementById('accessory-toggle').checked = false;
    document.getElementById('head-toggle').checked = false;  // 'decoration-toggle' から 'head-toggle' に変更
    document.getElementById('background-toggle').checked = false;
    
    // アクセサリー選択をリセット
    const noneAccessoryOption = document.querySelector('.accessory-option[data-type="none"]');
    if (noneAccessoryOption) {
        document.querySelectorAll('.accessory-option.selected').forEach(option => {
            option.classList.remove('selected');
        });
        noneAccessoryOption.classList.add('selected');
    }
    
    // あたま選択をリセット（旧デコレーション）
    const noneHeadOption = document.querySelector('.head-option[data-type="none"]');
    if (noneHeadOption) {
        document.querySelectorAll('.head-option.selected').forEach(option => {
            option.classList.remove('selected');
        });
        noneHeadOption.classList.add('selected');
    }
    
    // 背景選択をリセット
    const noneBackgroundOption = document.querySelector('.background-option[data-type="none"]');
    if (noneBackgroundOption) {
        document.querySelectorAll('.background-option.selected').forEach(option => {
            option.classList.remove('selected');
        });
        noneBackgroundOption.classList.add('selected');
    }
    
    // プリセットボタンのアクティブ状態をリセット
    document.querySelectorAll('.preset-button').forEach(button => {
        button.classList.remove('active');
    });
    document.querySelector('.preset-button[data-preset="clear"]').classList.add('active');
}

// 設定からUIを更新
function updateUIFromSettings() {
    // リップカラー
    updateColorSelection('lipstick-colors', makeupSettings.lipstick.color);
    document.getElementById('lipstick-opacity').value = makeupSettings.lipstick.opacity * 100;
    document.getElementById('lipstick-opacity-value').textContent = `${Math.round(makeupSettings.lipstick.opacity * 100)}%`;
    document.getElementById('lipstick-toggle').checked = makeupSettings.lipstick.enabled;
    
    // チーク
    updateColorSelection('blush-colors', makeupSettings.blush.color);
    document.getElementById('blush-opacity').value = makeupSettings.blush.opacity * 100;
    document.getElementById('blush-opacity-value').textContent = `${Math.round(makeupSettings.blush.opacity * 100)}%`;
    document.getElementById('blush-toggle').checked = makeupSettings.blush.enabled;
    
    // アイシャドウ
    updateColorSelection('eyeshadow-colors', makeupSettings.eyeshadow.color);
    document.getElementById('eyeshadow-opacity').value = makeupSettings.eyeshadow.opacity * 100;
    document.getElementById('eyeshadow-opacity-value').textContent = `${Math.round(makeupSettings.eyeshadow.opacity * 100)}%`;
    document.getElementById('eyeshadow-toggle').checked = makeupSettings.eyeshadow.enabled;
    
    // パネルを更新のためにいったん閉じて開く（視覚的フィードバック）
    animatePanelUpdate();
}

// パネル更新アニメーション
function animatePanelUpdate() {
    const openPanels = document.querySelectorAll('.panel.open');
    openPanels.forEach(panel => {
        panel.classList.remove('open');
        setTimeout(() => {
            panel.classList.add('open');
        }, 100);
    });
}

// 色選択の更新
function updateColorSelection(containerId, color) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.color === color) {
            option.classList.add('selected');
        }
    });
}

// FaceMeshの結果を処理
function onFaceMeshResults(results) {
    if (!results.multiFaceLandmarks?.length) return;
    const landmarks = results.multiFaceLandmarks[0];
  
    // 背景合成がオフのときだけクリア
    if (!backgroundSettings.enabled) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height); // 元映像も描く
    }
    
    // バーチャルメイクアップを適用
    if (makeupSettings.lipstick.enabled) {
        applyLipstick(ctx, landmarks, makeupSettings.lipstick);
    }
    
    if (makeupSettings.blush.enabled) {
        applyBlush(ctx, landmarks, makeupSettings.blush);
    }
    
    if (makeupSettings.eyeshadow.enabled) {
        applyEyeshadow(ctx, landmarks, makeupSettings.eyeshadow);
    }
    
    // アクセサリーを適用
    if (accessorySettings.enabled && accessorySettings.type !== 'none') {
        applyAccessory(ctx, landmarks, accessorySettings.type);
    }
    
    // あたまアイテムを適用（旧デコレーション）
    if (headSettings.enabled && headSettings.type !== 'none') {
        applyHead(ctx, landmarks, headSettings.type);
    }
}


// 背景分離の結果を処理
function onSegmentationResults(results) {
    if (!(backgroundSettings.enabled && backgroundSettings.image)) return;
  
    ctx.save();
  
    // ① まず元の映像（人物＋背景）を描く
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    
    // ② destination-in で「人物マスクを掛ける」
    //    ⇒ α がマスク値になるので人物だけ残る
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);
  
    // ③ 透明になった所（背景）を下から埋める
    ctx.globalCompositeOperation = 'destination-over';
    ctx.drawImage(backgroundSettings.image, 0, 0, canvas.width, canvas.height);
  
    ctx.restore();

    faceMesh.send({image: video});
  }

// 口紅の適用
function applyLipstick(ctx, landmarks, options) {
    ctx.save();
    
    // 唇の輪郭を描画
    ctx.beginPath();
    
    // 上唇の外側
    let startIndex = 0;
    FACEMESH_LANDMARKS.lips.slice(0, 11).forEach((index, i) => {
        const point = landmarks[index];
        const x = point.x * canvas.width;
        const y = point.y * canvas.height;
        
        if (i === 0) {
            ctx.moveTo(x, y);
            startIndex = index;
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    // 下唇の外側（逆順）
    FACEMESH_LANDMARKS.lips.slice(-11).reverse().forEach((index, i) => {
        const point = landmarks[index];
        const x = point.x * canvas.width;
        const y = point.y * canvas.height;
        
        ctx.lineTo(x, y);
    });
    
    // 開始点に戻る
    const startPoint = landmarks[startIndex];
    ctx.lineTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
    
    // 塗りつぶし
    ctx.fillStyle = options.color;
    ctx.globalAlpha = options.opacity;
    ctx.fill();
    
    ctx.restore();
}

// チークの適用
function applyBlush(ctx, landmarks, options) {
    ctx.save();
    
    // チークの位置を頬骨付近に調整（目の下あたり）
    const leftCheekIndex = 111;  // より頬骨に近いランドマーク
    const rightCheekIndex = 340; // より頬骨に近いランドマーク
    
    // サイズを小さく調整
    const blushSize = {
        width: canvas.width * 0.03,  // より小さく
        height: canvas.height * 0.02 // 楕円形に
    };
    
    // グラデーション効果の追加
    const leftPoint = landmarks[leftCheekIndex];
    const leftX = leftPoint.x * canvas.width;
    const leftY = leftPoint.y * canvas.height;
    
    const gradient = ctx.createRadialGradient(
        leftX, leftY, 0,
        leftX, leftY, blushSize.width
    );
    gradient.addColorStop(0, options.color);
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    
    // 左チーク描画
    ctx.beginPath();
    ctx.ellipse(
        leftX, leftY,
        blushSize.width, blushSize.height,
        Math.PI / 6, 0, Math.PI * 2
    );
    ctx.fillStyle = gradient;
    ctx.globalAlpha = options.opacity;
    ctx.fill();
    
    // 右チーク（同様に）
    const rightPoint = landmarks[rightCheekIndex];
    const rightX = rightPoint.x * canvas.width;
    const rightY = rightPoint.y * canvas.height;
    
    const gradientRight = ctx.createRadialGradient(
        rightX, rightY, 0,
        rightX, rightY, blushSize.width
    );
    gradientRight.addColorStop(0, options.color);
    gradientRight.addColorStop(1, 'rgba(255,255,255,0)');
    
    ctx.beginPath();
    ctx.ellipse(
        rightX, rightY,
        blushSize.width, blushSize.height,
        -Math.PI / 6, 0, Math.PI * 2
    );
    ctx.fillStyle = gradientRight;
    ctx.fill();
    
    ctx.restore();
}

// アイシャドウの適用
function applyEyeshadow(ctx, landmarks, options) {
    ctx.save();
    
    // 左目のアイシャドウ
    ctx.beginPath();
    FACEMESH_LANDMARKS.leftEye.forEach((index, i) => {
        const point = landmarks[index];
        const x = point.x * canvas.width;
        const y = (point.y - 0.01) * canvas.height; // 少し上に移動
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.fillStyle = options.color;
    ctx.globalAlpha = options.opacity;
    ctx.fill();
    
    // 右目のアイシャドウ
    ctx.beginPath();
    FACEMESH_LANDMARKS.rightEye.forEach((index, i) => {
        const point = landmarks[index];
        const x = point.x * canvas.width;
        const y = (point.y - 0.01) * canvas.height; // 少し上に移動
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.fill();
    
    ctx.restore();
}

// アクセサリーの適用
function applyAccessory(ctx, landmarks, accessoryType) {
    ctx.save();
    
    switch (accessoryType) {
        case 'earrings':
            // 耳のランドマークを使用
            const leftEarIndex = FACEMESH_LANDMARKS.ears.left;
            const rightEarIndex = FACEMESH_LANDMARKS.ears.right;
            
            const leftEar = landmarks[leftEarIndex];
            const rightEar = landmarks[rightEarIndex];
            
            // 左耳にイヤリングを描画
            if (accessoryImages.earringLeft.complete && accessoryImages.earringLeft.naturalWidth > 0) {
                ctx.drawImage(
                    accessoryImages.earringLeft, 
                    leftEar.x * canvas.width - 15, 
                    leftEar.y * canvas.height - 5, 
                    30, 40
                );
            }
            
            // 右耳にイヤリングを描画
            if (accessoryImages.earringRight.complete && accessoryImages.earringRight.naturalWidth > 0) {
                ctx.drawImage(
                    accessoryImages.earringRight, 
                    rightEar.x * canvas.width - 15, 
                    rightEar.y * canvas.height - 5, 
                    30, 40
                );
            }
            break;
            
        case 'earrings2': // 新しいイヤリング2
            // 耳のランドマークを使用
            const leftEarIndex2 = FACEMESH_LANDMARKS.ears.left;
            const rightEarIndex2 = FACEMESH_LANDMARKS.ears.right;
            
            const leftEar2 = landmarks[leftEarIndex2];
            const rightEar2 = landmarks[rightEarIndex2];
            
            // 左耳にイヤリング2を描画
            if (accessoryImages.earringLeft2.complete && accessoryImages.earringLeft2.naturalWidth > 0) {
                ctx.drawImage(
                    accessoryImages.earringLeft2, 
                    leftEar2.x * canvas.width - 15, 
                    leftEar2.y * canvas.height - 5, 
                    30, 40
                );
            }
            
            // 右耳にイヤリング2を描画
            if (accessoryImages.earringRight2.complete && accessoryImages.earringRight2.naturalWidth > 0) {
                ctx.drawImage(
                    accessoryImages.earringRight2, 
                    rightEar2.x * canvas.width - 15, 
                    rightEar2.y * canvas.height - 5, 
                    30, 40
                );
            }
            break;
            
        case 'necklace':
            // 首のランドマークを使用（あごの下）
            const chinIndex = FACEMESH_LANDMARKS.chin;
            const chin = landmarks[chinIndex];
            
            // ネックレスを描画
            if (accessoryImages.necklace.complete && accessoryImages.necklace.naturalWidth > 0) {
                ctx.drawImage(
                    accessoryImages.necklace, 
                    chin.x * canvas.width - 50, 
                    chin.y * canvas.height + 20, 
                    100, 50
                );
            }
            break;
            
        case 'necklace2': // 新しいネックレス2
            // 首のランドマークを使用（あごの下）
            const chinIndex2 = FACEMESH_LANDMARKS.chin;
            const chin2 = landmarks[chinIndex2];
            
            // ネックレス2を描画
            if (accessoryImages.necklace2.complete && accessoryImages.necklace2.naturalWidth > 0) {
                ctx.drawImage(
                    accessoryImages.necklace2, 
                    chin2.x * canvas.width - 50, 
                    chin2.y * canvas.height + 20, 
                    100, 50
                );
            }
            break;
            
        case 'glasses':
            // メガネの処理
            const nosePoint = landmarks[FACEMESH_LANDMARKS.nose];
            
            if (accessoryImages.glasses.complete && accessoryImages.glasses.naturalWidth > 0) {
                // 顔の幅を計算
                const faceWidth = (landmarks[FACEMESH_LANDMARKS.ears.right].x - landmarks[FACEMESH_LANDMARKS.ears.left].x) * canvas.width;
                const glassesWidth = faceWidth * 1.1; // 顔幅に合わせて調整
                
                ctx.drawImage(
                    accessoryImages.glasses,
                    nosePoint.x * canvas.width - glassesWidth / 2, // 中央揃え
                    nosePoint.y * canvas.height - 50, // 鼻より少し上方向に配置
                    glassesWidth,
                    glassesWidth * 0.4 // アスペクト比を維持
                );
            }
            break;
            
        case 'choker':
            // チョーカーの処理
            const chinChoker = landmarks[FACEMESH_LANDMARKS.chin];
            
            if (accessoryImages.choker.complete && accessoryImages.choker.naturalWidth > 0) {
                // 顔の幅を計算
                const faceWidth = (landmarks[FACEMESH_LANDMARKS.ears.right].x - landmarks[FACEMESH_LANDMARKS.ears.left].x) * canvas.width;
                const chokerWidth = faceWidth * 1.2; // 首の幅に合わせて調整
                
                ctx.drawImage(
                    accessoryImages.choker,
                    chinChoker.x * canvas.width - chokerWidth / 2, // 中央揃え
                    chinChoker.y * canvas.height + 30, // あごの下に配置
                    chokerWidth,
                    chokerWidth * 0.25 // アスペクト比を維持
                );
            }
            break;
            
        case 'sunglasses':
            // サングラスの処理
            const noseSunglasses = landmarks[FACEMESH_LANDMARKS.nose];
            
            if (accessoryImages.sunglasses.complete && accessoryImages.sunglasses.naturalWidth > 0) {
                // 顔の幅を計算
                const faceWidth = (landmarks[FACEMESH_LANDMARKS.ears.right].x - landmarks[FACEMESH_LANDMARKS.ears.left].x) * canvas.width;
                const sunglassesWidth = faceWidth * 1.1; // 顔幅に合わせて調整
                
                ctx.drawImage(
                    accessoryImages.sunglasses,
                    noseSunglasses.x * canvas.width - sunglassesWidth / 2, // 中央揃え
                    noseSunglasses.y * canvas.height - 50, // 鼻より少し上方向に配置
                    sunglassesWidth,
                    sunglassesWidth * 0.4 // アスペクト比を維持
                );
            }
            break;
    }
    
    ctx.restore();
}


// あたまアイテムの適用（旧デコレーション）- ティアラとヘアピンを追加、星空・蝶々・ハートを削除
function applyHead(ctx, landmarks, headType) {
    ctx.save();
    
    switch (headType) {
        case 'animalEars':
            // 猫耳を頭の上に配置
            const topHead = landmarks[FACEMESH_LANDMARKS.forehead];
            // 顔の幅を計算
            const faceWidth = (landmarks[FACEMESH_LANDMARKS.ears.right].x - landmarks[FACEMESH_LANDMARKS.ears.left].x) * canvas.width;
            const earsWidth = faceWidth * 1.2; // 顔幅に合わせて調整
            
            if (headImages.catEars.complete && headImages.catEars.naturalWidth > 0) {
                ctx.drawImage(
                    headImages.catEars,
                    topHead.x * canvas.width - earsWidth/2, // 中央揃え
                    topHead.y * canvas.height - 100, // 上方向に調整
                    earsWidth, 
                    earsWidth * 0.6 // アスペクト比を維持
                );
            }
            break;
            
        case 'rabbitEars':
            // うさぎ耳を頭の上に配置
            const topHeadRabbit = landmarks[FACEMESH_LANDMARKS.forehead];
            // 顔の幅を計算
            const faceWidthRabbit = (landmarks[FACEMESH_LANDMARKS.ears.right].x - landmarks[FACEMESH_LANDMARKS.ears.left].x) * canvas.width;
            const rabbitEarsWidth = faceWidthRabbit * 1.2;
            
            if (headImages.rabbitEars.complete && headImages.rabbitEars.naturalWidth > 0) {
                ctx.drawImage(
                    headImages.rabbitEars,
                    topHeadRabbit.x * canvas.width - rabbitEarsWidth/2,
                    topHeadRabbit.y * canvas.height - 120, // さらに上方向に調整
                    rabbitEarsWidth, 
                    rabbitEarsWidth * 0.8
                );
            }
            break;
            
        case 'flowerCrown':
            // 花冠を頭の上に配置
            const topHeadFlower = landmarks[FACEMESH_LANDMARKS.forehead];
            // 顔の幅を計算
            const faceWidthFlower = (landmarks[FACEMESH_LANDMARKS.ears.right].x - landmarks[FACEMESH_LANDMARKS.ears.left].x) * canvas.width;
            
            if (headImages.flowerCrown.complete && headImages.flowerCrown.naturalWidth > 0) {
                ctx.drawImage(
                    headImages.flowerCrown,
                    topHeadFlower.x * canvas.width - faceWidthFlower * 0.6,
                    topHeadFlower.y * canvas.height - 80,
                    faceWidthFlower * 1.2,
                    faceWidthFlower * 0.5
                );
            }
            break;
            
        case 'tiara':
            // ティアラを頭の上に配置（アクセサリーから移動）
            const topHeadTiara = landmarks[FACEMESH_LANDMARKS.forehead];
            // 顔の幅を計算
            const faceWidthTiara = (landmarks[FACEMESH_LANDMARKS.ears.right].x - landmarks[FACEMESH_LANDMARKS.ears.left].x) * canvas.width;
            
            if (headImages.tiara.complete && headImages.tiara.naturalWidth > 0) {
                ctx.drawImage(
                    headImages.tiara,
                    topHeadTiara.x * canvas.width - faceWidthTiara / 2,
                    (topHeadTiara.y * canvas.height) - faceWidthTiara * 0.3,
                    faceWidthTiara,
                    faceWidthTiara * 0.4
                );
            }
            break;
            
        case 'hairpin':
            // ヘアピンを頭に配置（アクセサリーから移動）
            const foreheadHairpin = landmarks[FACEMESH_LANDMARKS.forehead];
            
            if (headImages.hairpin.complete && headImages.hairpin.naturalWidth > 0) {
                ctx.drawImage(
                    headImages.hairpin,
                    (foreheadHairpin.x * canvas.width) - 50,
                    (foreheadHairpin.y * canvas.height) - 50,
                    40, 30
                );
            }
            break;
    }
    
    ctx.restore();
}


// スナップショットを撮る
function takeSnapshot() {
    // スナップショット撮影時のフラッシュエフェクト
    const flashOverlay = document.createElement('div');
    flashOverlay.style.position = 'absolute';
    flashOverlay.style.top = '0';
    flashOverlay.style.left = '0';
    flashOverlay.style.width = '100%';
    flashOverlay.style.height = '100%';
    flashOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
    flashOverlay.style.zIndex = '1000';
    flashOverlay.style.pointerEvents = 'none';
    flashOverlay.style.transition = 'opacity 0.5s ease';
    
    document.querySelector('.video-container').appendChild(flashOverlay);
    
    // フラッシュを消す
    setTimeout(() => {
        flashOverlay.style.opacity = '0';
        
        // キャンバスをスナップショットに
        const snapshotCanvas = document.createElement('canvas');
        snapshotCanvas.width = canvas.width;
        snapshotCanvas.height = canvas.height;
        const snapshotCtx = snapshotCanvas.getContext('2d');
        
        // 現在のキャンバスの内容（背景とエフェクト全て）をスナップショットに描画
        snapshotCtx.drawImage(canvas, 0, 0);
        
        try {
            // 画像としてダウンロード
            const link = document.createElement('a');
            link.download = `ar-makeup-snapshot-${new Date().getTime()}.png`;
            link.href = snapshotCanvas.toDataURL('image/png');
            link.click();
            
            // 成功メッセージを表示（一時的に）
            const successMessage = document.createElement('div');
            successMessage.textContent = '写真を保存しました！';
            successMessage.style.position = 'absolute';
            successMessage.style.top = '50%';
            successMessage.style.left = '50%';
            successMessage.style.transform = 'translate(-50%, -50%)';
            successMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            successMessage.style.color = 'white';
            successMessage.style.padding = '10px 20px';
            successMessage.style.borderRadius = '50px';
            successMessage.style.zIndex = '1001';
            
            document.querySelector('.video-container').appendChild(successMessage);
            
            // 成功メッセージを消す
            setTimeout(() => {
                successMessage.style.opacity = '0';
                successMessage.style.transition = 'opacity 0.5s ease';
                
                // 完全に消えたら削除
                setTimeout(() => {
                    successMessage.remove();
                    flashOverlay.remove();
                }, 500);
            }, 1500);
        } catch (e) {
            console.error('スナップショットのエクスポート中にエラーが発生しました', e);
            alert('スナップショットの保存中にエラーが発生しました');
            flashOverlay.remove();
        }
    }, 100);
}

// エラーメッセージの表示
function showError(message) {
    // スタイリッシュなエラーポップアップ
    const errorPopup = document.createElement('div');
    errorPopup.style.position = 'fixed';
    errorPopup.style.top = '20px';
    errorPopup.style.left = '50%';
    errorPopup.style.transform = 'translateX(-50%)';
    errorPopup.style.backgroundColor = '#f44336';
    errorPopup.style.color = 'white';
    errorPopup.style.padding = '15px 25px';
    errorPopup.style.borderRadius = '8px';
    errorPopup.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    errorPopup.style.zIndex = '9999';
    errorPopup.style.display = 'flex';
    errorPopup.style.alignItems = 'center';
    errorPopup.style.gap = '10px';
    errorPopup.style.maxWidth = '80%';
    errorPopup.style.animation = 'slide-up 0.3s forwards';
    
    const errorIcon = document.createElement('i');
    errorIcon.className = 'fas fa-exclamation-circle';
    errorIcon.style.fontSize = '20px';
    
    const errorText = document.createElement('span');
    errorText.textContent = message;
    
    const closeButton = document.createElement('i');
    closeButton.className = 'fas fa-times';
    closeButton.style.marginLeft = '15px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontSize = '18px';
    closeButton.onclick = function() {
        document.body.removeChild(errorPopup);
    };
    
    errorPopup.appendChild(errorIcon);
    errorPopup.appendChild(errorText);
    errorPopup.appendChild(closeButton);
    
    document.body.appendChild(errorPopup);
    
    // 5秒後に自動的に消える
    setTimeout(() => {
        if (document.body.contains(errorPopup)) {
            errorPopup.style.opacity = '0';
            errorPopup.style.transform = 'translateX(-50%) translateY(-20px)';
            errorPopup.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            
            setTimeout(() => {
                if (document.body.contains(errorPopup)) {
                    document.body.removeChild(errorPopup);
                }
            }, 500);
        }
    }, 5000);
}

// ページ読み込み時に初期化
window.addEventListener('load', init);