/**
 * かんたんおえかきアプリ - メイン
 */
// DOM要素
let canvas;
let shapeList;
let partsList;
let roadsList;
let colorPalette;
let strokeColorPalette;
let deleteBtn;
let clearBtn;
let copyBtn;
let scaleDownBtn;
let scaleUpBtn;
let rotateLeftBtn;
let rotateRightBtn;
let widthPlusBtn;
let widthMinusBtn;
let heightPlusBtn;
let heightMinusBtn;
let bringForwardBtn;
let sendBackwardBtn;
let undoBtn;
let redoBtn;
let groupBtn;
let ungroupBtn;

// タブ関連の要素
let shapesTab;
let partsTab;
let roadsTab;
let shapesContent;
let partsContent;
let roadsContent;

/**
 * 初期化
 */
function init() {
  // DOM要素の参照を取得
  canvas = document.getElementById('canvas');
  shapeList = document.getElementById('shapeList');
  partsList = document.getElementById('partsList');
  roadsList = document.getElementById('roadsList');
  colorPalette = document.getElementById('colorPalette');
  strokeColorPalette = document.getElementById('strokeColorPalette');
  deleteBtn = document.getElementById('deleteBtn');
  clearBtn = document.getElementById('clearBtn');
  copyBtn = document.getElementById('copyBtn');
  scaleDownBtn = document.getElementById('scaleDownBtn');
  scaleUpBtn = document.getElementById('scaleUpBtn');
  rotateLeftBtn = document.getElementById('rotateLeftBtn');
  rotateRightBtn = document.getElementById('rotateRightBtn');
  
  // 幅・高さ変更ボタン（新機能）
  widthPlusBtn = document.getElementById('widthPlusBtn');
  widthMinusBtn = document.getElementById('widthMinusBtn');
  heightPlusBtn = document.getElementById('heightPlusBtn');
  heightMinusBtn = document.getElementById('heightMinusBtn');
  
  // レイヤー操作ボタン（新機能）
  bringForwardBtn = document.getElementById('bringForwardBtn');
  sendBackwardBtn = document.getElementById('sendBackwardBtn');
  
  // 履歴ボタン（新機能）
  undoBtn = document.getElementById('undoBtn');
  redoBtn = document.getElementById('redoBtn');
  
  // グループボタン（新機能）
  groupBtn = document.getElementById('groupBtn');
  ungroupBtn = document.getElementById('ungroupBtn');
  
  // タブ関連の要素を取得
  shapesTab = document.getElementById('shapesTab');
  partsTab = document.getElementById('partsTab');
  roadsTab = document.getElementById('roadsTab');
  shapesContent = document.getElementById('shapesContent');
  partsContent = document.getElementById('partsContent');
  roadsContent = document.getElementById('roadsContent');
  
  // グリッド線を描画
  drawGrid();
  
  // カラーパレットを初期化
  initColorPalette();
  
  // フチ色パレットを初期化（新機能）
  initStrokeColorPalette();
  
  // 図形リストを初期化
  initShapeList();
  
  // 部品リストを初期化
  initPartsList();
  
  // 道路リストを初期化
  initRoadsList();
  
  // イベントリスナーを設定
  deleteBtn.addEventListener('click', handleDeleteShape);
  clearBtn.addEventListener('click', handleClearAll);
  copyBtn.addEventListener('click', handleCopyShape);
  
  // 変形コントロール
  scaleDownBtn.addEventListener('click', () => adjustScale(-CONFIG.SCALE_STEP));
  scaleUpBtn.addEventListener('click', () => adjustScale(CONFIG.SCALE_STEP));
  rotateLeftBtn.addEventListener('click', () => adjustRotation(-CONFIG.ROTATION_STEP));
  rotateRightBtn.addEventListener('click', () => adjustRotation(CONFIG.ROTATION_STEP));
  
  // 幅・高さ変更ボタン（新機能）
  widthPlusBtn.addEventListener('click', () => adjustWidth(1));
  widthMinusBtn.addEventListener('click', () => adjustWidth(-1));
  heightPlusBtn.addEventListener('click', () => adjustHeight(1));
  heightMinusBtn.addEventListener('click', () => adjustHeight(-1));
  
  // レイヤー操作ボタン（新機能）
  bringForwardBtn.addEventListener('click', bringForward);
  sendBackwardBtn.addEventListener('click', sendBackward);
  
  // 履歴ボタン（新機能）
  undoBtn.addEventListener('click', handleUndo);
  redoBtn.addEventListener('click', handleRedo);
  
  // グループボタン（新機能）
  groupBtn.addEventListener('click', groupShapes);
  ungroupBtn.addEventListener('click', ungroupShapes);
  
  // タブ切り替えイベント
  shapesTab.addEventListener('click', () => switchTab('shapes'));
  partsTab.addEventListener('click', () => switchTab('parts'));
  roadsTab.addEventListener('click', () => switchTab('roads'));
  
  // キャンバスイベント
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('mouseleave', handleMouseUp);
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchend', handleMouseUp);
  canvas.addEventListener('touchcancel', handleMouseUp);
  
  // ウィンドウイベント
  window.addEventListener('resize', adjustCanvasSize);
  window.addEventListener('keydown', handleKeyDown);
  
  // ボタンの初期状態
  updateButtonStates();
  
  // キャンバスサイズの調整
  adjustCanvasSize();
  
  // 初期状態を履歴に記録（新機能）
  recordHistory('initial state');
  
  // 初期通知
  showNotification('かんたんおえかきアプリへようこそ！');

  initExtended();

  // 複数選択ボタン
  multiSelectBtn = document.getElementById('multiSelectBtn');
  if (multiSelectBtn) {
    multiSelectBtn.addEventListener('click', toggleMultiSelectMode);
  }
  
  // UIタブ初期化
  initUITabs();
  
  // 新しいUI簡略化関数を呼び出し
  simplifyUI();

// パレット折りたたみ機能
const paletteToggle = document.querySelector('.palette-toggle');
const paletteContainer = document.querySelector('.palette-container');
const paletteToggleIcon = document.getElementById('paletteToggleIcon');

if (paletteToggle) {
  paletteToggle.addEventListener('click', () => {
    paletteContainer.classList.toggle('collapsed');
    if (paletteContainer.classList.contains('collapsed')) {
      paletteToggleIcon.classList.remove('fa-chevron-left');
      paletteToggleIcon.classList.add('fa-chevron-right');
    } else {
      paletteToggleIcon.classList.remove('fa-chevron-right');
      paletteToggleIcon.classList.add('fa-chevron-left');
    }
  });
}

// フローティングボタンの設定
document.getElementById('floatingUndoBtn').addEventListener('click', handleUndo);
document.getElementById('floatingCopyBtn').addEventListener('click', handleCopyShape);
document.getElementById('floatingDeleteBtn').addEventListener('click', handleDeleteShape);
document.getElementById('floatingRotateBtn').addEventListener('click', () => adjustRotation(CONFIG.ROTATION_STEP));

}

/**
 * キー入力イベント処理
 * @param {KeyboardEvent} e - キーボードイベント
 */
function handleKeyDown(e) {
  // Ctrl + Z でもとにもどす（新機能）
  if (e.ctrlKey && e.key === 'z') {
    e.preventDefault();
    handleUndo();
    return;
  }
  
  // Ctrl + Y でやりなおす（新機能）
  if (e.ctrlKey && e.key === 'y') {
    e.preventDefault();
    handleRedo();
    return;
  }
  
  // Ctrl + G でグループ化（新機能）
  if (e.ctrlKey && e.key === 'g') {
    e.preventDefault();
    if (selectedShapeIds.length > 1) {
      groupShapes();
    }
    return;
  }
  
  // Ctrl + Shift + G でグループ解除（新機能）
  if (e.ctrlKey && e.shiftKey && e.key === 'G') {
    e.preventDefault();
    if (isGroupType()) {
      ungroupShapes();
    }
    return;
  }
  
  if (selectedShapeId) {
    const shape = shapes.find(s => s.id === selectedShapeId);
    if (!shape) return;
    
    // 矢印キーによる移動
    switch (e.key) {
      case 'ArrowLeft':
        shape.x = Math.max(0, shape.x - CONFIG.GRID_SIZE);
        drawShape(shape);
        recordHistory('move');
        break;
      case 'ArrowRight':
        const maxX = CONFIG.GRID_WIDTH - shape.width * CONFIG.GRID_SIZE * shape.scale;
        shape.x = Math.min(maxX, shape.x + CONFIG.GRID_SIZE);
        drawShape(shape);
        recordHistory('move');
        break;
      case 'ArrowUp':
        shape.y = Math.max(0, shape.y - CONFIG.GRID_SIZE);
        drawShape(shape);
        recordHistory('move');
        break;
      case 'ArrowDown':
        const maxY = CONFIG.GRID_HEIGHT - shape.height * CONFIG.GRID_SIZE * shape.scale;
        shape.y = Math.min(maxY, shape.y + CONFIG.GRID_SIZE);
        drawShape(shape);
        recordHistory('move');
        break;
      case 'Delete':
        handleDeleteShape();
        break;
      case 'r':
        adjustRotation(CONFIG.ROTATION_STEP);
        break;
      case 'R':
        adjustRotation(-CONFIG.ROTATION_STEP);
        break;
      case '+':
      case '=':
        adjustScale(CONFIG.SCALE_STEP);
        break;
      case '-':
        adjustScale(-CONFIG.SCALE_STEP);
        break;
      case 'PageUp':
        bringForward();
        break;
      case 'PageDown':
        sendBackward();
        break;
    }
  }
}

/**
 * タブを切り替える
 * @param {string} tabName - 選択するタブの名前
 */
function switchTab(tabName) {
  // すべてのタブとコンテンツを非アクティブ化
  shapesTab.classList.remove('active');
  partsTab.classList.remove('active');
  roadsTab.classList.remove('active');
  shapesContent.classList.remove('active');
  partsContent.classList.remove('active');
  roadsContent.classList.remove('active');
  
  // 選択されたタブをアクティブ化
  switch (tabName) {
    case 'shapes':
      shapesTab.classList.add('active');
      shapesContent.classList.add('active');
      break;
    case 'parts':
      partsTab.classList.add('active');
      partsContent.classList.add('active');
      break;
    case 'roads':
      roadsTab.classList.add('active');
      roadsContent.classList.add('active');
      break;
  }
}

/**
 * タッチイベント処理
 * @param {TouchEvent} e - タッチイベント
 */
function handleTouchMove(e) {
  if (draggedShape) {
    e.preventDefault(); // スクロールを防止
    
    // 最初のタッチポイントを使用
    const touch = e.touches[0];
    
    // マウスイベントとしてシミュレート
    const simulatedEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      preventDefault: function() {}
    };
    
    handleMouseMove(simulatedEvent);
  }
}

/**
 * キャンバスのサイズを調整
 */
function adjustCanvasSize() {
  const container = document.querySelector('.canvas-container');
  if (!container) return;
  
  // コンテナサイズに合わせてキャンバスのビューボックスを調整
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  
  // アスペクト比を維持したままサイズを調整
  const ratio = Math.min(
    containerWidth / CONFIG.GRID_WIDTH,
    containerHeight / CONFIG.GRID_HEIGHT
  );
  
  const width = Math.floor(CONFIG.GRID_WIDTH * ratio);
  const height = Math.floor(CONFIG.GRID_HEIGHT * ratio);
  
  // キャンバスのサイズを設定
  canvas.setAttribute('width', width);
  canvas.setAttribute('height', height);
  
  // ビューボックスを設定
  canvas.setAttribute('viewBox', `0 0 ${CONFIG.GRID_WIDTH} ${CONFIG.GRID_HEIGHT}`);
  canvas.setAttribute('preserveAspectRatio', 'xMidYMid meet');
}

/**
 * グリッド線を描画
 */
function drawGrid() {
  // 背景
  const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  background.setAttribute('id', 'background');
  background.setAttribute('x', 0);
  background.setAttribute('y', 0);
  background.setAttribute('width', CONFIG.GRID_WIDTH);
  background.setAttribute('height', CONFIG.GRID_HEIGHT);
  background.setAttribute('fill', 'white');
  canvas.appendChild(background);
  
  const cols = CONFIG.GRID_WIDTH / CONFIG.GRID_SIZE;
  const rows = CONFIG.GRID_HEIGHT / CONFIG.GRID_SIZE;
  
  // グリッド線のグループ要素
  const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  gridGroup.setAttribute('id', 'grid-lines');
  
  // 縦線
  for (let i = 0; i <= cols; i++) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', i * CONFIG.GRID_SIZE);
    line.setAttribute('y1', 0);
    line.setAttribute('x2', i * CONFIG.GRID_SIZE);
    line.setAttribute('y2', CONFIG.GRID_HEIGHT);
    line.setAttribute('stroke', '#e6e6e6');
    line.setAttribute('stroke-width', '1');
    gridGroup.appendChild(line);
  }
  
  // 横線
  for (let i = 0; i <= rows; i++) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', 0);
    line.setAttribute('y1', i * CONFIG.GRID_SIZE);
    line.setAttribute('x2', CONFIG.GRID_WIDTH);
    line.setAttribute('y2', i * CONFIG.GRID_SIZE);
    line.setAttribute('stroke', '#e6e6e6');
    line.setAttribute('stroke-width', '1');
    gridGroup.appendChild(line);
  }
  
  canvas.appendChild(gridGroup);
  
  // キャンバスクリックイベント
  canvas.addEventListener('mousedown', (e) => {
    // グリッド線をクリックした場合のみ選択解除
    const target = e.target;
    if (target === canvas || target === background || target.tagName === 'line' || target.parentNode === gridGroup) {
      clearSelection();
    }
  });
  
  // タッチイベント対応
  canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (element === canvas || element === background || element.tagName === 'line' || element.parentNode === gridGroup) {
      clearSelection();
    }
  });
}

/**
 * カラーパレットの初期化
 */
function initColorPalette() {
  CONFIG.COLORS.forEach(color => {
    const colorBtn = document.createElement('div');
    colorBtn.className = 'color-btn';
    colorBtn.style.backgroundColor = color;
    
    if (color === activeColor) {
      colorBtn.classList.add('active');
    }
    
    colorBtn.addEventListener('click', () => {
      document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('active'));
      colorBtn.classList.add('active');
      activeColor = color;
      updateSelectedShapeColor(color);
    });
    
    colorPalette.appendChild(colorBtn);
  });
}

/**
 * フチ色パレットの初期化（新機能）
 */
function initStrokeColorPalette() {
  CONFIG.STROKE_COLORS.forEach(color => {
    const colorBtn = document.createElement('div');
    colorBtn.className = 'color-btn stroke-color-btn';
    
    if (color === 'none') {
      // フチなしの場合は特別な表示
      colorBtn.style.backgroundColor = 'white';
      colorBtn.style.backgroundImage = 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)';
      colorBtn.style.backgroundSize = '8px 8px';
      colorBtn.style.backgroundPosition = '0 0, 4px 4px';
    } else {
      colorBtn.style.backgroundColor = color;
    }
    
    if (color === activeStrokeColor) {
      colorBtn.classList.add('active');
    }
    
    colorBtn.addEventListener('click', () => {
      document.querySelectorAll('.stroke-color-btn').forEach(btn => btn.classList.remove('active'));
      colorBtn.classList.add('active');
      activeStrokeColor = color;
      updateStrokeColor(color);
    });
    
    strokeColorPalette.appendChild(colorBtn);
  });
}

/**
 * 図形リストの初期化
 */
function initShapeList() {
  CONFIG.SHAPES.forEach(shape => {
    const item = document.createElement('div');
    item.className = 'shape-item';
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '24');
    svg.setAttribute('height', '24');
    
    let shapeElement;
    
    switch (shape.type) {
      case 'square':
      case 'rectangle':
        shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        const rectWidth = shape.width * 4;
        const rectHeight = shape.height * 4;
        shapeElement.setAttribute('x', (24 - rectWidth) / 2);
        shapeElement.setAttribute('y', (24 - rectHeight) / 2);
        shapeElement.setAttribute('width', rectWidth);
        shapeElement.setAttribute('height', rectHeight);
        break;
      case 'triangle':
      case 'roof':
        shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const triWidth = shape.width * 4;
        const triHeight = shape.height * 4;
        const x = (24 - triWidth) / 2;
        const y = (24 - triHeight) / 2;
        shapeElement.setAttribute('points', 
          `${x},${y + triHeight} ${x + triWidth / 2},${y} ${x + triWidth},${y + triHeight}`
        );
        break;
      case 'circle':
        shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        shapeElement.setAttribute('cx', 12);
        shapeElement.setAttribute('cy', 12);
        shapeElement.setAttribute('r', 8);
        break;
    }
    
    shapeElement.setAttribute('fill', shape.color);
    shapeElement.setAttribute('stroke', '#333');
    shapeElement.setAttribute('stroke-width', '1');
    svg.appendChild(shapeElement);
    
    item.appendChild(svg);
    
    const label = document.createElement('span');
    label.className = 'shape-item-label';
    label.textContent = shape.label || shape.type;
    item.appendChild(label);
    
    item.addEventListener('click', () => addShape(shape));
    
    shapeList.appendChild(item);
  });
}

/**
 * 部品リストの初期化
 */
function initPartsList() {
  CONFIG.PARTS.forEach(part => {
    const item = document.createElement('div');
    item.className = 'part-item';
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '24');
    svg.setAttribute('height', '24');
    
    let partElement;
    
    switch (part.type) {
      case 'window':
        // 窓
        const windowGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        const windowRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        windowRect.setAttribute('x', 4);
        windowRect.setAttribute('y', 4);
        windowRect.setAttribute('width', 16);
        windowRect.setAttribute('height', 16);
        windowRect.setAttribute('fill', part.color);
        windowRect.setAttribute('stroke', '#333');
        
        const windowLine1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        windowLine1.setAttribute('x1', 4);
        windowLine1.setAttribute('y1', 12);
        windowLine1.setAttribute('x2', 20);
        windowLine1.setAttribute('y2', 12);
        windowLine1.setAttribute('stroke', '#333');
        
        const windowLine2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        windowLine2.setAttribute('x1', 12);
        windowLine2.setAttribute('y1', 4);
        windowLine2.setAttribute('x2', 12);
        windowLine2.setAttribute('y2', 20);
        windowLine2.setAttribute('stroke', '#333');
        
        windowGroup.appendChild(windowRect);
        windowGroup.appendChild(windowLine1);
        windowGroup.appendChild(windowLine2);
        
        partElement = windowGroup;
        break;
        
      case 'door':
        // ドア
        const doorGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        const doorRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        doorRect.setAttribute('x', 8);
        doorRect.setAttribute('y', 4);
        doorRect.setAttribute('width', 8);
        doorRect.setAttribute('height', 16);
        doorRect.setAttribute('fill', part.color);
        doorRect.setAttribute('stroke', '#333');
        
        const doorknob = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        doorknob.setAttribute('cx', 14);
        doorknob.setAttribute('cy', 12);
        doorknob.setAttribute('r', 1.5);
        doorknob.setAttribute('fill', '#ffcc5c');
        
        doorGroup.appendChild(doorRect);
        doorGroup.appendChild(doorknob);
        
        partElement = doorGroup;
        break;
        
      case 'chimney':
        // 煙突
        const chimneyGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        const chimneyRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        chimneyRect.setAttribute('x', 10);
        chimneyRect.setAttribute('y', 8);
        chimneyRect.setAttribute('width', 6);
        chimneyRect.setAttribute('height', 12);
        chimneyRect.setAttribute('fill', part.color);
        chimneyRect.setAttribute('stroke', '#333');
        
        const chimneyTop = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        chimneyTop.setAttribute('x', 8);
        chimneyTop.setAttribute('y', 6);
        chimneyTop.setAttribute('width', 10);
        chimneyTop.setAttribute('height', 2);
        chimneyTop.setAttribute('fill', '#333');
        
        chimneyGroup.appendChild(chimneyRect);
        chimneyGroup.appendChild(chimneyTop);
        
        partElement = chimneyGroup;
        break;
        
      case 'tree':
        // 木
        const treeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        const treeTrunk = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        treeTrunk.setAttribute('x', 11);
        treeTrunk.setAttribute('y', 15);
        treeTrunk.setAttribute('width', 2);
        treeTrunk.setAttribute('height', 6);
        treeTrunk.setAttribute('fill', '#795548'); // 茶色
        
        const treeTop = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        treeTop.setAttribute('points', '6,15 18,15 12,4');
        treeTop.setAttribute('fill', part.color);
        
        treeGroup.appendChild(treeTrunk);
        treeGroup.appendChild(treeTop);
        
        partElement = treeGroup;
        break;
    }
    
    svg.appendChild(partElement);
    
    item.appendChild(svg);
    
    const label = document.createElement('span');
    label.className = 'part-item-label';
    label.textContent = part.label;
    item.appendChild(label);
    
    item.addEventListener('click', () => addPart(part));
    
    partsList.appendChild(item);
  });
}

/**
 * 道路リストの初期化
 */
function initRoadsList() {
  CONFIG.ROADS.forEach(road => {
    const item = document.createElement('div');
    item.className = 'road-item';
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '24');
    svg.setAttribute('height', '24');
    
    let roadElement;
    
    switch (road.type) {
      case 'straight-road':
        // 直線道路
        const roadGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        const roadRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        roadRect.setAttribute('x', 4);
        roadRect.setAttribute('y', 10);
        roadRect.setAttribute('width', 16);
        roadRect.setAttribute('height', 4);
        roadRect.setAttribute('fill', road.color);
        roadRect.setAttribute('stroke', '#555');
        
        const centerLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        centerLine.setAttribute('x1', 4);
        centerLine.setAttribute('y1', 12);
        centerLine.setAttribute('x2', 20);
        centerLine.setAttribute('y2', 12);
        centerLine.setAttribute('stroke', '#fff');
        centerLine.setAttribute('stroke-width', '1');
        centerLine.setAttribute('stroke-dasharray', '2,2');
        
        roadGroup.appendChild(roadRect);
        roadGroup.appendChild(centerLine);
        
        roadElement = roadGroup;
        break;
        
      case 'cross-road':
        // 十字路
        const crossGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        const crossRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        crossRect.setAttribute('x', 4);
        crossRect.setAttribute('y', 4);
        crossRect.setAttribute('width', 16);
        crossRect.setAttribute('height', 16);
        crossRect.setAttribute('fill', road.color);
        crossRect.setAttribute('stroke', '#555');
        
        const vertLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        vertLine.setAttribute('x1', 12);
        vertLine.setAttribute('y1', 4);
        vertLine.setAttribute('x2', 12);
        vertLine.setAttribute('y2', 20);
        vertLine.setAttribute('stroke', '#fff');
        vertLine.setAttribute('stroke-width', '1');
        vertLine.setAttribute('stroke-dasharray', '2,2');
        
        const horizLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        horizLine.setAttribute('x1', 4);
        horizLine.setAttribute('y1', 12);
        horizLine.setAttribute('x2', 20);
        horizLine.setAttribute('y2', 12);
        horizLine.setAttribute('stroke', '#fff');
        horizLine.setAttribute('stroke-width', '1');
        horizLine.setAttribute('stroke-dasharray', '2,2');
        
        crossGroup.appendChild(crossRect);
        crossGroup.appendChild(vertLine);
        crossGroup.appendChild(horizLine);
        
        roadElement = crossGroup;
        break;
        
      case 'corner-road':
        // 角の道路
        const cornerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        const cornerRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        cornerRect.setAttribute('x', 4);
        cornerRect.setAttribute('y', 4);
        cornerRect.setAttribute('width', 16);
        cornerRect.setAttribute('height', 16);
        cornerRect.setAttribute('fill', road.color);
        cornerRect.setAttribute('stroke', '#555');
        
        // L字の白線
        const cornerPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        cornerPath.setAttribute('d', 'M 12 4 L 12 12 L 20 12');
        cornerPath.setAttribute('stroke', '#fff');
        cornerPath.setAttribute('fill', 'none');
        cornerPath.setAttribute('stroke-width', '1');
        cornerPath.setAttribute('stroke-dasharray', '2,2');
        
        cornerGroup.appendChild(cornerRect);
        cornerGroup.appendChild(cornerPath);
        
        roadElement = cornerGroup;
        break;
        
      case 't-junction':
        // T字路（新機能）
        const tJunctionGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        const tJunctionRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        tJunctionRect.setAttribute('x', 4);
        tJunctionRect.setAttribute('y', 4);
        tJunctionRect.setAttribute('width', 16);
        tJunctionRect.setAttribute('height', 16);
        tJunctionRect.setAttribute('fill', road.color);
        tJunctionRect.setAttribute('stroke', '#555');
        
        // 水平線
        const tHorizLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        tHorizLine.setAttribute('x1', 4);
        tHorizLine.setAttribute('y1', 12);
        tHorizLine.setAttribute('x2', 20);
        tHorizLine.setAttribute('y2', 12);
        tHorizLine.setAttribute('stroke', '#fff');
        tHorizLine.setAttribute('stroke-width', '1');
        tHorizLine.setAttribute('stroke-dasharray', '2,2');
        
        // 垂直線（上半分）
        const tVertLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        tVertLine.setAttribute('x1', 12);
        tVertLine.setAttribute('y1', 4);
        tVertLine.setAttribute('x2', 12);
        tVertLine.setAttribute('y2', 12);
        tVertLine.setAttribute('stroke', '#fff');
        tVertLine.setAttribute('stroke-width', '1');
        tVertLine.setAttribute('stroke-dasharray', '2,2');
        
        tJunctionGroup.appendChild(tJunctionRect);
        tJunctionGroup.appendChild(tHorizLine);
        tJunctionGroup.appendChild(tVertLine);
        
        roadElement = tJunctionGroup;
        break;
        
      case 'bridge':
        // 橋
        const bridgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        const bridgeRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bridgeRect.setAttribute('x', 4);
        bridgeRect.setAttribute('y', 10);
        bridgeRect.setAttribute('width', 16);
        bridgeRect.setAttribute('height', 4);
        bridgeRect.setAttribute('fill', road.color);
        bridgeRect.setAttribute('stroke', '#555');
        
        const railTop = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        railTop.setAttribute('x1', 4);
        railTop.setAttribute('y1', 10);
        railTop.setAttribute('x2', 20);
        railTop.setAttribute('y2', 10);
        railTop.setAttribute('stroke', '#7f8c8d');
        railTop.setAttribute('stroke-width', '1');
        
        const railBottom = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        railBottom.setAttribute('x1', 4);
        railBottom.setAttribute('y1', 14);
        railBottom.setAttribute('x2', 20);
        railBottom.setAttribute('y2', 14);
        railBottom.setAttribute('stroke', '#7f8c8d');
        railBottom.setAttribute('stroke-width', '1');
        
        // 橋の支柱
        for (let i = 0; i < 3; i++) {
          const post = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          post.setAttribute('x1', 8 + i * 6);
          post.setAttribute('y1', 10);
          post.setAttribute('x2', 8 + i * 6);
          post.setAttribute('y2', 14);
          post.setAttribute('stroke', '#7f8c8d');
          post.setAttribute('stroke-width', '1');
          bridgeGroup.appendChild(post);
        }
        
        bridgeGroup.appendChild(bridgeRect);
        bridgeGroup.appendChild(railTop);
        bridgeGroup.appendChild(railBottom);
        
        roadElement = bridgeGroup;
        break;
    }
    
    svg.appendChild(roadElement);
    
    item.appendChild(svg);
    
    const label = document.createElement('span');
    label.className = 'road-item-label';
    label.textContent = road.label;
    item.appendChild(label);
    
    item.addEventListener('click', () => addRoad(road));
    
    roadsList.appendChild(item);
  });
}

// アプリケーションの初期化を実行
document.addEventListener('DOMContentLoaded', init);


/**
 * スマートフォン向け複数選択モードの変数
 */
let isMultiSelectMode = false;
let touchStartTime = 0;
let multiSelectBtn;

/**
 * タッチイベント処理（長押し検出）
 * @param {TouchEvent} e - タッチイベント
 */
function handleTouchStart(e, shape) {
  touchStartTime = Date.now();
}

/**
 * タッチ終了処理
 * @param {TouchEvent} e - タッチイベント
 * @param {Object} shape - 図形オブジェクト
 */
function handleTouchEnd(e, shape) {
  const touchDuration = Date.now() - touchStartTime;
  
  // 長押し（500ms以上）で複数選択モードに
  if (touchDuration >= 500) {
    if (!isMultiSelectMode) {
      isMultiSelectMode = true;
      updateMultiSelectButton();
      showNotification('複数選択モードになりました');
    }
    
    // 選択状態を切り替え
    toggleShapeSelection(shape);
    e.preventDefault();
    return;
  }
  
  // 選択モード中のタップ
  if (isMultiSelectMode) {
    toggleShapeSelection(shape);
    e.preventDefault();
  }
}

/**
 * 選択切り替え
 * @param {Object} shape - 切り替える図形
 */
function toggleShapeSelection(shape) {
  const index = selectedShapeIds.indexOf(shape.id);
  if (index === -1) {
    // 追加選択
    selectedShapeIds.push(shape.id);
    if (selectedShapeIds.length === 1) {
      selectedShapeId = shape.id;
    }
  } else {
    // 選択解除
    selectedShapeIds.splice(index, 1);
    if (selectedShapeId === shape.id && selectedShapeIds.length > 0) {
      selectedShapeId = selectedShapeIds[0];
    } else if (selectedShapeIds.length === 0) {
      selectedShapeId = null;
    }
  }
  
  updateMultiSelection();
  updateButtonStates();
}

/**
 * 複数選択ボタンの状態を更新
 */
function updateMultiSelectButton() {
  if (!multiSelectBtn) return;
  
  if (isMultiSelectMode) {
    multiSelectBtn.classList.add('active');
    multiSelectBtn.style.backgroundColor = '#3498db';
    multiSelectBtn.style.color = 'white';
  } else {
    multiSelectBtn.classList.remove('active');
    multiSelectBtn.style.backgroundColor = '';
    multiSelectBtn.style.color = '';
  }
}

/**
 * 複数選択モードの切り替え
 */
function toggleMultiSelectMode() {
  isMultiSelectMode = !isMultiSelectMode;
  updateMultiSelectButton();
  
  if (isMultiSelectMode) {
    showNotification('複数選択モードになりました');
  } else {
    // 選択モード解除時は選択もクリア
    clearSelection();
    showNotification('通常モードに戻りました');
  }
}

/**
 * UI操作のためのタブ切り替え
 */
function initUITabs() {
  // タブ数を減らし、関連機能をまとめる
  const allControls = {
    'basic': [
      { id: 'undoBtn', icon: 'fa-undo', label: 'もどす' },
      { id: 'redoBtn', icon: 'fa-redo', label: 'やりなおす' },
      { id: 'copyBtn', icon: 'fa-copy', label: 'コピー' },
      { id: 'deleteBtn', icon: 'fa-trash', label: 'けす' },
      { id: 'clearBtn', icon: 'fa-trash-alt', label: 'ぜんぶけす' },
      { id: 'scaleDownBtn', icon: 'fa-search-minus', label: 'ちいさく' },
      { id: 'scaleUpBtn', icon: 'fa-search-plus', label: 'おおきく' },
      { id: 'rotateLeftBtn', icon: 'fa-undo', label: '←まわす' },
      { id: 'rotateRightBtn', icon: 'fa-redo', label: 'まわす→' }
    ],
    'advanced': [
      { id: 'multiSelectBtn', icon: 'fa-object-group', label: '複数選択' },
      { id: 'groupBtn', icon: 'fa-object-group', label: 'グループか' },
      { id: 'ungroupBtn', icon: 'fa-object-ungroup', label: 'グループかいじょ' },
      { id: 'widthPlusBtn', icon: 'fa-arrows-alt-h', label: 'よこ+' },
      { id: 'widthMinusBtn', icon: 'fa-compress-alt', label: 'よこ-' },
      { id: 'heightPlusBtn', icon: 'fa-arrows-alt-v', label: 'たて+' },
      { id: 'heightMinusBtn', icon: 'fa-compress-alt fa-rotate-90', label: 'たて-' },
      { id: 'bringForwardBtn', icon: 'fa-level-up-alt', label: 'まえに' },
      { id: 'sendBackwardBtn', icon: 'fa-level-down-alt', label: 'うしろに' }
    ]
  };
  
  // HTMLを動的に構築
  const tabContainer = document.querySelector('.control-tabs');
  tabContainer.innerHTML = '';
  
  // タブヘッダー作成
  const tabHeader = document.createElement('div');
  tabHeader.className = 'tab-header';
  
  Object.keys(allControls).forEach((tabName, idx) => {
    const btn = document.createElement('button');
    btn.id = `${tabName}TabBtn`;
    btn.className = `tab-btn ${idx === 0 ? 'active' : ''}`;
    btn.innerHTML = `<i class="fas ${tabName === 'basic' ? 'fa-home' : 'fa-cogs'}"></i> ${tabName === 'basic' ? '基本' : '詳細'}`;
    btn.onclick = () => switchUITab(tabName);
    tabHeader.appendChild(btn);
  });
  
  tabContainer.appendChild(tabHeader);
  
  // タブコンテンツ作成
  Object.keys(allControls).forEach((tabName, idx) => {
    const panel = document.createElement('div');
    panel.id = `${tabName}Tab`;
    panel.className = `control-panel ${idx === 0 ? 'active' : ''}`;
    
    // 1行に4つずつボタンを並べる
    for (let i = 0; i < allControls[tabName].length; i += 4) {
      const group = document.createElement('div');
      group.className = 'button-group';
      
      for (let j = 0; j < 4 && i + j < allControls[tabName].length; j++) {
        const ctrl = allControls[tabName][i + j];
        const btn = document.createElement('button');
        btn.id = ctrl.id;
        btn.className = 'control-btn';
        btn.title = ctrl.label;
        btn.innerHTML = `<i class="fas ${ctrl.icon}"></i> <span class="btn-text">${ctrl.label}</span>`;
        group.appendChild(btn);
      }
      
      panel.appendChild(group);
    }
    
    tabContainer.appendChild(panel);
  });
}

/**
 * UIタブを切り替える
 * @param {string} tabName - 選択するタブの名前
 */
function switchUITab(tabName) {
  // すべてのタブとコンテンツを非アクティブ化
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.control-panel').forEach(panel => panel.classList.remove('active'));
  
  // 選択されたタブをアクティブ化
  switch (tabName) {
    case 'basic':
      document.getElementById('basicTabBtn').classList.add('active');
      document.getElementById('basicTab').classList.add('active');
      break;
    case 'transform':
      document.getElementById('transformTabBtn').classList.add('active');
      document.getElementById('transformTab').classList.add('active');
      break;
    case 'size':
      document.getElementById('sizeTabBtn').classList.add('active');
      document.getElementById('sizeTab').classList.add('active');
      break;
    case 'layer':
      document.getElementById('layerTabBtn').classList.add('active');
      document.getElementById('layerTab').classList.add('active');
      break;
  }
}

/**
 * 初期化関数の拡張部分
 */
function initExtended() {
  // 複数選択ボタン
  multiSelectBtn = document.getElementById('multiSelectBtn');
  if (multiSelectBtn) { // 存在チェックを追加
    multiSelectBtn.addEventListener('click', toggleMultiSelectMode);
  }

}


/**
 * 図形イベントリスナーに追加するタッチハンドリング
 */
// タッチイベントリスナーを修正（passive: falseを削除またはtrueに変更）
// shapes.js に以下の関数を修正
function addShapeTouchHandlers(g, shape) {
  g.addEventListener('touchstart', (e) => {
    // タッチ開始位置を記録
    const touch = e.touches[0];
    const svgRect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - svgRect.left;
    const touchY = touch.clientY - svgRect.top;
    
    // SVG座標に変換
    const svgScale = {
      x: CONFIG.GRID_WIDTH / svgRect.width,
      y: CONFIG.GRID_HEIGHT / svgRect.height
    };
    
    dragOffset = {
      x: touchX * svgScale.x - shape.x,
      y: touchY * svgScale.y - shape.y
    };
    
    draggedShape = shape;
    transformMode = 'move';
    
    // 選択
    if (!selectedShapeIds.includes(shape.id)) {
      selectedShapeIds = [shape.id];
      selectShape(shape.id);
    }
    
    handleTouchStart(e, shape);
    e.preventDefault(); // この行が重要
  }, {passive: false});
  
  g.addEventListener('touchmove', (e) => {
    if (draggedShape && transformMode === 'move') {
      e.preventDefault();
      handleTouchMove(e);
    }
  }, {passive: false});
}

/**
 * UI要素をよりシンプルに再構成
 */
function simplifyUI() {
  // コントロールタブのコンテナを取得
  const controlTabs = document.querySelector('.control-tabs');
  if (!controlTabs) return; // 存在チェック
  
  // 現在のタブヘッダーを非表示
  const tabHeader = controlTabs.querySelector('.tab-header');
  if (tabHeader) {
    tabHeader.style.display = 'none';
  }
  
  // シンプルなコントロールパネルを作成
  const simplePanel = document.createElement('div');
  simplePanel.className = 'control-panel active';
  simplePanel.style.display = 'flex';
  simplePanel.style.flexWrap = 'wrap';
  simplePanel.style.padding = '10px';
  
  // 基本操作ボタングループ（1行目）
  const basicGroup = document.createElement('div');
  basicGroup.className = 'button-group';
  basicGroup.style.width = '100%';
  basicGroup.style.justifyContent = 'center';
  basicGroup.style.marginBottom = '8px';
  
  // 変形操作ボタングループ（2行目）
  const transformGroup = document.createElement('div');
  transformGroup.className = 'button-group';
  transformGroup.style.width = '100%';
  transformGroup.style.justifyContent = 'center';
  transformGroup.style.marginBottom = '8px';
  
  // サイズ・レイヤー操作ボタングループ（3行目）
  const advancedGroup = document.createElement('div');
  advancedGroup.className = 'button-group';
  advancedGroup.style.width = '100%';
  advancedGroup.style.justifyContent = 'center';
  
  // 既存のボタンを取得して新しいグループに移動
  // 基本操作ボタン（もどす、やりなおす、コピー、けす、ぜんぶけす）
  const basicButtons = ['undoBtn', 'redoBtn', 'copyBtn', 'deleteBtn', 'clearBtn'];
  basicButtons.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      basicGroup.appendChild(btn.cloneNode(true));
    }
  });
  
  // 変形操作ボタン（ちいさく、おおきく、まわす、複数選択、グループ化）
  const transformButtons = ['scaleDownBtn', 'scaleUpBtn', 'rotateLeftBtn', 'rotateRightBtn', 'multiSelectBtn', 'groupBtn', 'ungroupBtn'];
  transformButtons.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      transformGroup.appendChild(btn.cloneNode(true));
    }
  });
  
  // サイズ・レイヤー操作ボタン（よこ+-、たて+-、まえに、うしろに）
  const advancedButtons = ['widthPlusBtn', 'widthMinusBtn', 'heightPlusBtn', 'heightMinusBtn', 'bringForwardBtn', 'sendBackwardBtn'];
  advancedButtons.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      advancedGroup.appendChild(btn.cloneNode(true));
    }
  });
  
  // パネルにグループを追加
  simplePanel.appendChild(basicGroup);
  simplePanel.appendChild(transformGroup);
  simplePanel.appendChild(advancedGroup);
  
  // 既存のパネルを全て非表示
  const panels = controlTabs.querySelectorAll('.control-panel');
  panels.forEach(panel => {
    panel.style.display = 'none';
  });
  
  // 新しいパネルをコンテナに追加
  controlTabs.appendChild(simplePanel);
  
  // イベントリスナーを再設定（クローンしたボタンには元のイベントリスナーが付いていない）
  setupButtonListeners(simplePanel);
}

/**
 * ボタンのイベントリスナーを再設定
 */
function setupButtonListeners(panel) {
  // 基本操作ボタン
  setupButtonListener(panel, 'undoBtn', handleUndo);
  setupButtonListener(panel, 'redoBtn', handleRedo);
  setupButtonListener(panel, 'copyBtn', handleCopyShape);
  setupButtonListener(panel, 'deleteBtn', handleDeleteShape);
  setupButtonListener(panel, 'clearBtn', handleClearAll);
  
  // 変形操作ボタン
  setupButtonListener(panel, 'scaleDownBtn', () => adjustScale(-CONFIG.SCALE_STEP));
  setupButtonListener(panel, 'scaleUpBtn', () => adjustScale(CONFIG.SCALE_STEP));
  setupButtonListener(panel, 'rotateLeftBtn', () => adjustRotation(-CONFIG.ROTATION_STEP));
  setupButtonListener(panel, 'rotateRightBtn', () => adjustRotation(CONFIG.ROTATION_STEP));
  
  // 複数選択・グループ操作ボタン
  setupButtonListener(panel, 'multiSelectBtn', toggleMultiSelectMode);
  setupButtonListener(panel, 'groupBtn', groupShapes);
  setupButtonListener(panel, 'ungroupBtn', ungroupShapes);
  
  // サイズ変更ボタン
  setupButtonListener(panel, 'widthPlusBtn', () => adjustWidth(1));
  setupButtonListener(panel, 'widthMinusBtn', () => adjustWidth(-1));
  setupButtonListener(panel, 'heightPlusBtn', () => adjustHeight(1));
  setupButtonListener(panel, 'heightMinusBtn', () => adjustHeight(-1));
  
  // レイヤー操作ボタン
  setupButtonListener(panel, 'bringForwardBtn', bringForward);
  setupButtonListener(panel, 'sendBackwardBtn', sendBackward);
}

/**
 * 個別ボタンのイベントリスナー設定
 */
function setupButtonListener(panel, btnId, handler) {
  const btn = panel.querySelector(`#${btnId}`);
  if (btn) {
    btn.addEventListener('click', handler);
  }
}