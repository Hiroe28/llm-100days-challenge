// グローバル変数
let donutShape = 'ring'; // ring, jam
let baseColor;
let icingColor;
let sprayColor;
let toolSize = 10;     // スプレー用サイズ
let toppingSize = 10;  // トッピング用サイズ
let randomPlacement = true;
let activeTool = 'spray'; // spray, sprinkles, choco, heart, star
let baseLayer;
let icingLayer;
let paintLayer;
let outlineLayer; // 縁取り用のレイヤー
let shadowLayer; // 影用のレイヤー
let maskLayer; // ドーナツの形状のマスク用レイヤー
let isPainting = false;
let lastX, lastY;

// 操作履歴の管理
let history = [];
let currentHistoryIndex = -1;
const MAX_HISTORY = 20; // 最大履歴数

// モバイルか確認
const isMobile = () => window.innerWidth <= 768;

function setup() {
  // キャンバスサイズ設定
  let canvasSize;
  
  // モバイルデバイスの場合、キャンバスサイズをウィンドウ幅に合わせる
  if (isMobile()) {
    const mobileCanvasArea = document.getElementById('mobile-canvas-area');
    if (mobileCanvasArea) {
      // モバイルキャンバスエリアの寸法を取得
      const areaWidth = mobileCanvasArea.clientWidth;
      const areaHeight = mobileCanvasArea.clientHeight;
      
      // 利用可能なスペースの80%を使用（パディングも考慮）
      canvasSize = Math.min(areaWidth, areaHeight) * 0.8;
    } else {
      // フォールバック
      canvasSize = Math.min(windowWidth * 0.85, 350);
    }
    
    // モバイル用キャンバスコンテナに配置
    const canvas = createCanvas(canvasSize, canvasSize);
    const mobileCanvasContainer = document.getElementById('mobile-canvas-container');
    if (mobileCanvasContainer) {
      canvas.parent(mobileCanvasContainer);
    } else {
      canvas.parent('canvas-container'); // フォールバック
    }
  } else {
    // デスクトップサイズ
    canvasSize = min(windowWidth * 0.4, 400);
    const canvas = createCanvas(canvasSize, canvasSize);
    canvas.parent('canvas-container');
  }
  
  // 別のキャンバスをレイヤー用に作成
  baseLayer = createGraphics(width, height);
  icingLayer = createGraphics(width, height);
  paintLayer = createGraphics(width, height);
  outlineLayer = createGraphics(width, height);
  shadowLayer = createGraphics(width, height);
  maskLayer = createGraphics(width, height);
  
  // 初期色を設定
  baseColor = baseColors[0].value;
  icingColor = icingColors[1].value;
  sprayColor = 'rainbow'; // レインボーをデフォルトに
  
  // UI要素を設定
  setupUI();
  
  // 初期ドーナツを描画
  drawDonut();
  
  // 初期状態を履歴に保存
  saveToHistory();
}

function mousePressed() {
  // キャンバス上でのみ処理
  if (mouseX >= 0 && mouseX < width && mouseY >= 0 && mouseY < height) {
    // アクティブなツールに応じた処理
    if (activeTool === 'spray') {
      // スプレーペイント
      if (isInsideDonut(mouseX, mouseY)) {
        isPainting = true;
        sprayPaint(mouseX, mouseY, toolSize, 20);
        drawDonut();
      }
    } else {
      // 手動でトッピングを配置（ランダム配置がオフの場合のみ）
      if (!randomPlacement && isInsideDonut(mouseX, mouseY)) {
        // トッピングタイプに応じたサイズのマージンを適用
        const marginFactor = {
          'sprinkles': 0.5,
          'choco': 0.6,
          'heart': 0.8,
          'star': 0.8
        };
        const margin = toppingSize * (marginFactor[activeTool] || 0.6);
        
        if (isInsideDonut(mouseX, mouseY, margin)) {
          toppings[activeTool].draw(mouseX, mouseY, toppingSize);
          drawDonut();
          saveToHistory();
        }
      }
    }
  }
}

function mouseDragged() {
  // キャンバス上でのみ処理
  if (mouseX >= 0 && mouseX < width && mouseY >= 0 && mouseY < height) {
    // スプレーモードの場合のみドラッグで描画
    if (activeTool === 'spray' && isPainting && isInsideDonut(mouseX, mouseY)) {
      sprayPaint(mouseX, mouseY, toolSize, 10);
      drawDonut();
    }
  }
}

function mouseReleased() {
  if (isPainting) {
    // ペイントが終了したら履歴に保存
    saveToHistory();
    isPainting = false;
  }
}

function windowResized() {
  // モバイルの場合の処理
  if (isMobile()) {
    const mobileCanvasArea = document.getElementById('mobile-canvas-area');
    if (mobileCanvasArea) {
      // モバイルキャンバスエリアの寸法を取得
      const areaWidth = mobileCanvasArea.clientWidth;
      const areaHeight = mobileCanvasArea.clientHeight;
      
      // 利用可能なスペースの80%を使用
      const canvasSize = Math.min(areaWidth, areaHeight) * 0.8;
      
      // キャンバスサイズを変更
      resizeCanvas(canvasSize, canvasSize);
      
      // グラフィックスバッファのリサイズ
      baseLayer.resizeCanvas(width, height);
      icingLayer.resizeCanvas(width, height);
      paintLayer.resizeCanvas(width, height);
      outlineLayer.resizeCanvas(width, height);
      shadowLayer.resizeCanvas(width, height);
      maskLayer.resizeCanvas(width, height);
      
      // 再描画
      drawDonut();
    }
  } else {
    // デスクトップ用のリサイズ処理
    const canvasSize = min(windowWidth * 0.4, 400);
    resizeCanvas(canvasSize, canvasSize);
    
    // グラフィックスバッファのリサイズ
    baseLayer.resizeCanvas(width, height);
    icingLayer.resizeCanvas(width, height);
    paintLayer.resizeCanvas(width, height);
    outlineLayer.resizeCanvas(width, height);
    shadowLayer.resizeCanvas(width, height);
    maskLayer.resizeCanvas(width, height);
    
    // 再描画
    drawDonut();
  }
}

// 現在の状態を履歴に保存する関数
function saveToHistory() {
  // 現在のpaintLayerの状態をコピー
  const paintLayerCopy = createGraphics(width, height);
  paintLayerCopy.image(paintLayer, 0, 0);
  
  // ドーナツの現在の状態を保存
  const state = {
    donutShape: donutShape,
    baseColor: baseColor,
    icingColor: icingColor,
    paintLayer: paintLayerCopy
  };
  
  // 現在位置より後の履歴があれば削除（分岐を防ぐ）
  if (currentHistoryIndex < history.length - 1) {
    history = history.slice(0, currentHistoryIndex + 1);
  }
  
  // 新しい状態を履歴に追加
  history.push(state);
  currentHistoryIndex = history.length - 1;
  
  // 履歴の上限を管理
  if (history.length > MAX_HISTORY) {
    // 古い履歴（最初の要素）を削除
    history.shift();
    currentHistoryIndex--;
  }
  
  // Undoボタンの状態を更新
  updateUndoButtonState();
}

// 履歴から状態を復元する関数
function restoreFromHistory(index) {
  if (index < 0 || index >= history.length) return;
  
  const state = history[index];
  
  // 状態を復元
  donutShape = state.donutShape;
  baseColor = state.baseColor;
  icingColor = state.icingColor;
  
  // paintLayerを復元
  paintLayer.clear();
  paintLayer.image(state.paintLayer, 0, 0);
  
  // UIの選択状態を更新
  updateUIState();
  
  // ドーナツを再描画
  drawDonut();
  
  // 現在の履歴インデックスを更新
  currentHistoryIndex = index;
  
  // Undoボタンの状態を更新
  updateUndoButtonState();
}

// Undoボタンの状態を更新
function updateUndoButtonState() {
  const undoButtonIds = ['btn-undo', 'mobile-btn-undo'];
  
  undoButtonIds.forEach(id => {
    const undoButton = document.getElementById(id);
    if (undoButton) {
      undoButton.disabled = currentHistoryIndex <= 0;
    }
  });
}

// UIの選択状態を更新
function updateUIState() {
  // ドーナツ形状のボタン状態を更新（デスクトップ）
  if (document.getElementById('btn-ring')) {
    document.getElementById('btn-ring').classList.remove('active');
    document.getElementById('btn-jam').classList.remove('active');
    
    if (donutShape === 'ring') {
      document.getElementById('btn-ring').classList.add('active');
    } else {
      document.getElementById('btn-jam').classList.add('active');
    }
  }
  
  // ドーナツ形状のボタン状態を更新（モバイル）
  if (document.getElementById('mobile-btn-ring')) {
    document.getElementById('mobile-btn-ring').classList.remove('active');
    document.getElementById('mobile-btn-jam').classList.remove('active');
    
    if (donutShape === 'ring') {
      document.getElementById('mobile-btn-ring').classList.add('active');
    } else {
      document.getElementById('mobile-btn-jam').classList.add('active');
    }
  }
  
  // 色選択の状態を更新
  updateColorSelection('base-colors', baseColor);
  updateColorSelection('icing-colors', icingColor);
  updateColorSelection('mobile-base-colors', baseColor);
  updateColorSelection('mobile-icing-colors', icingColor);
}

function draw() {
  // 描画更新はイベント駆動で行うため、ここでは特に何もしない
}