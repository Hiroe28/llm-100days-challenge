/**
 * コントロール操作の管理
 */

// 状態変数
let selectedShapeId = null;
let selectedShapeIds = []; // 複数選択用（新機能）
let draggedShape = null;
let dragOffset = { x: 0, y: 0 };
let transformMode = null; // 'rotate', 'scale', 'move', 'width', 'height'
let initialMousePos = { x: 0, y: 0 };
let initialTransform = { rotation: 0, scale: 1, width: 0, height: 0 };
let originalShapePosition = { x: 0, y: 0 }; // 変形開始時の元の位置
let activeStrokeColor = CONFIG.STROKE_COLORS[0]; // 選択中のフチの色

/**
 * 図形のマウスダウン処理
 * @param {Event} e - イベントオブジェクト
 * @param {Object} shape - 図形オブジェクト
 */
function handleShapeMouseDown(e, shape) {
  e.preventDefault();
  
  // ドラッグ開始位置を記録
  const svgRect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - svgRect.left;
  const mouseY = e.clientY - svgRect.top;
  
  // SVGのビューボックスに対するスケール
  const svgScale = {
    x: CONFIG.GRID_WIDTH / svgRect.width,
    y: CONFIG.GRID_HEIGHT / svgRect.height
  };
  
  // マウス位置をSVG座標に変換
  const svgX = mouseX * svgScale.x;
  const svgY = mouseY * svgScale.y;
  
  // 元の図形の位置を保存
  originalShapePosition = {
    x: shape.x,
    y: shape.y
  };
  
  // ドラッグのオフセットを計算
  dragOffset = { 
    x: svgX - shape.x, 
    y: svgY - shape.y 
  };
  
  draggedShape = shape;
  transformMode = 'move';
  
  // Shiftキーが押されている場合は複数選択
  if (e.shiftKey) {
    const index = selectedShapeIds.indexOf(shape.id);
    if (index === -1) {
      // まだ選択されていない場合は追加
      selectedShapeIds.push(shape.id);
      if (selectedShapeIds.length === 1) {
        // 最初の選択の場合
        selectShape(shape.id);
      } else {
        // 追加選択の場合
        addToSelection(shape.id);
      }
    } else {
      // すでに選択されている場合は選択解除
      selectedShapeIds.splice(index, 1);
      if (selectedShapeIds.length === 0) {
        // 全て選択解除された場合
        clearSelection();
      } else if (selectedShapeId === shape.id) {
        // 現在の主選択が解除された場合は、最初の選択を主選択にする
        selectShape(selectedShapeIds[0]);
      } else {
        // それ以外の場合は選択状態を更新
        updateMultiSelection();
      }
    }
  } else {
    // 通常選択（単一）
    selectedShapeIds = [shape.id];
    selectShape(shape.id);
  }
}

/**
 * マウスの移動処理
 * @param {Event} e - イベントオブジェクト
 */
function handleMouseMove(e) {
  if (!draggedShape || !transformMode) return;
  
  // SVGの位置とサイズを取得
  const svgRect = canvas.getBoundingClientRect();
  
  // SVGのビューボックスに対するスケール
  const svgScale = {
    x: CONFIG.GRID_WIDTH / svgRect.width,
    y: CONFIG.GRID_HEIGHT / svgRect.height
  };
  
  // マウス位置をSVG座標に変換
  const mouseX = e.clientX - svgRect.left;
  const mouseY = e.clientY - svgRect.top;
  const svgX = mouseX * svgScale.x;
  const svgY = mouseY * svgScale.y;
  
  if (transformMode === 'move') {
    // 移動モード
    let newX = svgX - dragOffset.x;
    let newY = svgY - dragOffset.y;
    
    // グリッドにスナップ
    newX = Math.round(newX / CONFIG.GRID_SIZE) * CONFIG.GRID_SIZE;
    newY = Math.round(newY / CONFIG.GRID_SIZE) * CONFIG.GRID_SIZE;
    
    // 移動量を計算
    const deltaX = newX - draggedShape.x;
    const deltaY = newY - draggedShape.y;
    
    if (deltaX === 0 && deltaY === 0) return; // 変化がなければ何もしない
    
    if (selectedShapeIds.length > 1 && selectedShapeIds.includes(draggedShape.id)) {
      // 複数選択時は全ての選択図形を移動
      selectedShapeIds.forEach(id => {
        const shape = shapes.find(s => s.id === id);
        if (shape) {
          // スケールを考慮した図形のサイズを計算
          const scaledWidth = shape.width * CONFIG.GRID_SIZE * shape.scale;
          const scaledHeight = shape.height * CONFIG.GRID_SIZE * shape.scale;
          
          // 新しい位置を計算
          let shapeNewX = shape.x + deltaX;
          let shapeNewY = shape.y + deltaY;
          
          // 境界チェック
          shapeNewX = Math.max(0, Math.min(CONFIG.GRID_WIDTH - scaledWidth, shapeNewX));
          shapeNewY = Math.max(0, Math.min(CONFIG.GRID_HEIGHT - scaledHeight, shapeNewY));
          
          // 座標を更新
          shape.x = shapeNewX;
          shape.y = shapeNewY;
          
          // 図形を更新
          drawShape(shape);
        }
      });
    } else {
      // 単一選択時は選択図形のみ移動
      // スケールを考慮した図形のサイズを計算
      const scaledWidth = draggedShape.width * CONFIG.GRID_SIZE * draggedShape.scale;
      const scaledHeight = draggedShape.height * CONFIG.GRID_SIZE * draggedShape.scale;
      
      // 境界チェック（画面外に出ないようにする）
      newX = Math.max(0, Math.min(CONFIG.GRID_WIDTH - scaledWidth, newX));
      newY = Math.max(0, Math.min(CONFIG.GRID_HEIGHT - scaledHeight, newY));
      
      // 座標を更新
      draggedShape.x = newX;
      draggedShape.y = newY;
      
      // 図形を更新
      drawShape(draggedShape);
    }
  } else if (transformMode === 'rotate') {
    // 回転モード
    const shapeCenter = {
      x: draggedShape.x + (draggedShape.width * CONFIG.GRID_SIZE * draggedShape.scale) / 2,
      y: draggedShape.y + (draggedShape.height * CONFIG.GRID_SIZE * draggedShape.scale) / 2
    };
    
    // 角度を計算
    const initialAngle = Math.atan2(
      initialMousePos.y - shapeCenter.y,
      initialMousePos.x - shapeCenter.x
    ) * (180 / Math.PI);
    
    const currentAngle = Math.atan2(
      svgY - shapeCenter.y,
      svgX - shapeCenter.x
    ) * (180 / Math.PI);
    
    let newRotation = initialTransform.rotation + (currentAngle - initialAngle);
    
    // 15度単位でスナップ（より細かい制御）
    newRotation = Math.round(newRotation / 15) * 15;
    
    // 回転を更新
    draggedShape.rotation = newRotation;
    
    // 通知
    showNotification(`${newRotation}度`);

    // 回転後のグリッドスナップ調整（新機能）
    adjustPositionAfterRotation(draggedShape);
    
    // 図形を更新
    drawShape(draggedShape);

  } else if (transformMode === 'scale') {
    // 拡大縮小モード - 修正版
    // 図形の中心座標を計算
    const shapeCenter = {
      x: originalShapePosition.x + (draggedShape.width * CONFIG.GRID_SIZE * initialTransform.scale) / 2,
      y: originalShapePosition.y + (draggedShape.height * CONFIG.GRID_SIZE * initialTransform.scale) / 2
    };
    
    // マウスの移動量に基づいてスケールを計算
    const initialDist = Math.sqrt(
      Math.pow(initialMousePos.x - shapeCenter.x, 2) + 
      Math.pow(initialMousePos.y - shapeCenter.y, 2)
    );
    
    const currentDist = Math.sqrt(
      Math.pow(svgX - shapeCenter.x, 2) + 
      Math.pow(svgY - shapeCenter.y, 2)
    );
    
    let newScale = initialTransform.scale * (currentDist / initialDist);
    
    // 0.5単位でスナップ
    newScale = Math.round(newScale * 2) / 2;
    
    // 最小・最大サイズを制限
    newScale = Math.max(CONFIG.MIN_SCALE, Math.min(CONFIG.MAX_SCALE, newScale));
    
    // スケールの変化があった場合のみ更新
    if (newScale !== draggedShape.scale) {
      // スケールを更新
      draggedShape.scale = newScale;
      
      // 新しいサイズを計算
      const newWidth = draggedShape.width * CONFIG.GRID_SIZE * newScale;
      const newHeight = draggedShape.height * CONFIG.GRID_SIZE * newScale;
      
      // 中心位置を維持するための座標計算
      const newX = shapeCenter.x - newWidth / 2;
      const newY = shapeCenter.y - newHeight / 2;
      
      // 座標をグリッドにスナップ
      draggedShape.x = Math.round(newX / CONFIG.GRID_SIZE) * CONFIG.GRID_SIZE;
      draggedShape.y = Math.round(newY / CONFIG.GRID_SIZE) * CONFIG.GRID_SIZE;
      
      // 境界チェック
      draggedShape.x = Math.max(0, Math.min(CONFIG.GRID_WIDTH - newWidth, draggedShape.x));
      draggedShape.y = Math.max(0, Math.min(CONFIG.GRID_HEIGHT - newHeight, draggedShape.y));
      
      // 通知
      showNotification(`${newScale}倍`);
      
      // 図形を更新
      drawShape(draggedShape);
    }
  } else if (transformMode === 'width') {
    // 幅変更モード（新機能）
    const deltaX = svgX - initialMousePos.x;
    let newWidth = initialTransform.width + Math.round(deltaX / CONFIG.GRID_SIZE);
    
    // 最小サイズを制限
    newWidth = Math.max(1, newWidth);
    
    // 幅の変化があった場合のみ更新
    if (newWidth !== draggedShape.width) {
      // 幅を更新
      draggedShape.width = newWidth;
      
      // 通知
      showNotification(`よこ: ${newWidth}`);
      
      // 図形を更新
      drawShape(draggedShape);
    }
  } else if (transformMode === 'height') {
    // 高さ変更モード（新機能）
    const deltaY = svgY - initialMousePos.y;
    let newHeight = initialTransform.height + Math.round(deltaY / CONFIG.GRID_SIZE);
    
    // 最小サイズを制限
    newHeight = Math.max(1, newHeight);
    
    // 高さの変化があった場合のみ更新
    if (newHeight !== draggedShape.height) {
      // 高さを更新
      draggedShape.height = newHeight;
      
      // 通知
      showNotification(`たて: ${newHeight}`);
      
      // 図形を更新
      drawShape(draggedShape);
    }
  }
}

/**
 * 回転後の位置調整（グリッドスナップ）
 * @param {Object} shape - 図形オブジェクト
 */
// controls.jsの関数を修正
function adjustPositionAfterRotation(shape) {

  console.table({ x:shape.x, y:shape.y, w:shape.width, h:shape.height,
    r:shape.rotation,
    dispW:(shape.rotation%180 ? shape.height : shape.width),
    dispH:(shape.rotation%180 ? shape.width  : shape.height) });
  
  // 90°／270° のときだけ位置を調整
  if ((shape.rotation % 180 !== 0) && (shape.rotation % 90 === 0)) {

    // 回転前の中心座標
    const centerX = shape.x + (shape.width  * CONFIG.GRID_SIZE * shape.scale) / 2;
    const centerY = shape.y + (shape.height * CONFIG.GRID_SIZE * shape.scale) / 2;

    /* ★ 幅・高さは入れ替えない ★
       ただし 90° 回転後の「表示上の幅・高さ」は逆になるので
       それを使って左上座標を計算し直す                         */
    const rotatedWidthPx  = shape.height * CONFIG.GRID_SIZE * shape.scale; // ←高さ→幅
    const rotatedHeightPx = shape.width  * CONFIG.GRID_SIZE * shape.scale; // ←幅→高さ

    // 中心を保ちながら新しい左上を求める
    shape.x = centerX - rotatedWidthPx  / 2;
    shape.y = centerY - rotatedHeightPx / 2;

    // グリッドにスナップ
    shape.x = Math.round(shape.x / CONFIG.GRID_SIZE) * CONFIG.GRID_SIZE;
    shape.y = Math.round(shape.y / CONFIG.GRID_SIZE) * CONFIG.GRID_SIZE;

    // 回転角を 0‑359° に整理（任意）
    shape.rotation = shape.rotation % 360;
  }
}


/**
 * マウスアップ処理
 */
function handleMouseUp() {
  if (draggedShape && transformMode) {
    // 操作履歴を記録
    recordHistory(`${transformMode} shape`);
    
    draggedShape = null;
    transformMode = null;
  }
}

/**
 * 図形の選択
 * @param {string} id - 選択する図形のID
 */
function selectShape(id) {
  selectedShapeId = id;
  updateButtonStates();
  
  // すべての図形を再描画（選択ハンドルを表示するため）
  redrawShapes();
  
  // 選択された図形を前面に表示
  const selectedElement = document.getElementById(id);
  if (selectedElement && selectedElement.parentNode) {
    selectedElement.parentNode.appendChild(selectedElement);
  }
  
  // 選択通知
  const selectedShape = shapes.find(s => s.id === id);
  if (selectedShape) {
    showNotification(`${selectedShape.label || selectedShape.type}を選択`);
  }
}

/**
 * 複数選択に図形を追加
 * @param {string} id - 追加する図形のID
 */
function addToSelection(id) {
  if (!selectedShapeIds.includes(id)) {
    selectedShapeIds.push(id);
  }
  
  updateButtonStates();
  redrawShapes();
  
  // 選択通知
  const selectedShape = shapes.find(s => s.id === id);
  if (selectedShape) {
    showNotification(`${selectedShape.label || selectedShape.type}を追加選択`);
  }
}

/**
 * 複数選択の状態を更新
 */
function updateMultiSelection() {
  updateButtonStates();
  redrawShapes();
  
  showNotification(`${selectedShapeIds.length}個選択中`);
}

/**
 * 選択解除
 */
function clearSelection() {
  selectedShapeId = null;
  selectedShapeIds = [];
  updateButtonStates();
  redrawShapes();
}

/**
 * ボタン状態を更新
 */
function updateButtonStates() {
  const isSelected = selectedShapeId !== null;
  const isMultiSelected = selectedShapeIds.length > 1;
  
  // 削除と複製ボタンの有効/無効
  deleteBtn.disabled = !isSelected;
  copyBtn.disabled = !isSelected;
  
  // 選択されている場合のみ変形ボタンを有効化
  scaleDownBtn.disabled = !isSelected;
  scaleUpBtn.disabled = !isSelected;
  rotateLeftBtn.disabled = !isSelected;
  rotateRightBtn.disabled = !isSelected;
  
  // 幅・高さ変更ボタンの有効/無効（新機能）
  document.getElementById('widthPlusBtn').disabled = !isSelected;
  document.getElementById('widthMinusBtn').disabled = !isSelected;
  document.getElementById('heightPlusBtn').disabled = !isSelected;
  document.getElementById('heightMinusBtn').disabled = !isSelected;
  
  // レイヤーボタンの有効/無効（新機能）
  document.getElementById('bringForwardBtn').disabled = !isSelected;
  document.getElementById('sendBackwardBtn').disabled = !isSelected;
  
  // グループ化ボタンの有効/無効（新機能）
  document.getElementById('groupBtn').disabled = !isMultiSelected;
  document.getElementById('ungroupBtn').disabled = !(isSelected && isGroupType());
}

/**
 * 選択図形がグループかどうか確認
 * @returns {boolean} グループならtrue
 */
function isGroupType() {
  if (!selectedShapeId) return false;
  const shape = shapes.find(s => s.id === selectedShapeId);
  return shape && shape.type === 'group';
}

/**
 * 拡大・縮小調整
 * @param {number} delta - 拡大縮小の変化量
 */
function adjustScale(delta) {
  if (selectedShapeId) {
    const shapeIndex = shapes.findIndex(s => s.id === selectedShapeId);
    if (shapeIndex !== -1) {
      const shape = shapes[shapeIndex];
      
      // 元のスケールを保存
      const oldScale = shape.scale;
      
      // 新しいスケールを計算
      let newScale = oldScale + delta;
      
      // 最小・最大サイズを制限
      newScale = Math.max(CONFIG.MIN_SCALE, Math.min(CONFIG.MAX_SCALE, newScale));
      
      // 図形の中心座標を計算
      const centerX = shape.x + (shape.width * CONFIG.GRID_SIZE * oldScale) / 2;
      const centerY = shape.y + (shape.height * CONFIG.GRID_SIZE * oldScale) / 2;
      
      // スケールを更新
      shape.scale = newScale;
      
      // 新しいサイズを計算
      const newWidth = shape.width * CONFIG.GRID_SIZE * newScale;
      const newHeight = shape.height * CONFIG.GRID_SIZE * newScale;
      
      // 中心位置を維持するための新しい座標を計算
      const newX = centerX - newWidth / 2;
      const newY = centerY - newHeight / 2;
      
      // 座標をグリッドにスナップ
      shape.x = Math.round(newX / CONFIG.GRID_SIZE) * CONFIG.GRID_SIZE;
      shape.y = Math.round(newY / CONFIG.GRID_SIZE) * CONFIG.GRID_SIZE;
      
      // 境界チェック
      shape.x = Math.max(0, Math.min(CONFIG.GRID_WIDTH - newWidth, shape.x));
      shape.y = Math.max(0, Math.min(CONFIG.GRID_HEIGHT - newHeight, shape.y));
      
      // 図形を更新
      drawShape(shape);
      
      // 操作履歴を記録
      recordHistory('change scale');
      
      // 通知を表示
      if (delta > 0) {
        showNotification(`おおきく: ${newScale}倍`);
      } else {
        showNotification(`ちいさく: ${newScale}倍`);
      }
    }
  }
}

/**
 * 幅を調整（新機能）
 * @param {number} delta - 変化量（グリッド単位）
 */
function adjustWidth(delta) {
  if (selectedShapeId) {
    const shapeIndex = shapes.findIndex(s => s.id === selectedShapeId);
    if (shapeIndex !== -1) {
      let newWidth = shapes[shapeIndex].width + delta;
      
      // 最小サイズを制限
      newWidth = Math.max(1, newWidth);
      
      shapes[shapeIndex].width = newWidth;
      
      // 図形を更新
      drawShape(shapes[shapeIndex]);
      
      // 操作履歴を記録
      recordHistory('change width');
      
      // 通知を表示
      showNotification(`よこ: ${newWidth}`);
    }
  }
}

/**
 * 高さを調整（新機能）
 * @param {number} delta - 変化量（グリッド単位）
 */
function adjustHeight(delta) {
  if (selectedShapeId) {
    const shapeIndex = shapes.findIndex(s => s.id === selectedShapeId);
    if (shapeIndex !== -1) {
      let newHeight = shapes[shapeIndex].height + delta;
      
      // 最小サイズを制限
      newHeight = Math.max(1, newHeight);
      
      shapes[shapeIndex].height = newHeight;
      
      // 図形を更新
      drawShape(shapes[shapeIndex]);
      
      // 操作履歴を記録
      recordHistory('change height');
      
      // 通知を表示
      showNotification(`たて: ${newHeight}`);
    }
  }
}

/**
 * 回転調整
 * @param {number} delta - 回転角度の変化量（度）
 */
function adjustRotation(delta) {
  if (selectedShapeId) {
    const shapeIndex = shapes.findIndex(s => s.id === selectedShapeId);
    if (shapeIndex !== -1) {
      let newRotation = shapes[shapeIndex].rotation + delta;
      
      // 360度で一周
      newRotation = (newRotation % 360 + 360) % 360;
      
      shapes[shapeIndex].rotation = newRotation;
      
      // 回転後のグリッドスナップ調整（新機能）
      adjustPositionAfterRotation(shapes[shapeIndex]);

      // 図形を更新
      drawShape(shapes[shapeIndex]);      

      // 操作履歴を記録
      recordHistory('rotate');
      
      // 通知を表示
      if (delta > 0) {
        showNotification(`${newRotation}度`);
      } else {
        showNotification(`${newRotation}度`);
      }
    }
  }
}

/**
 * 図形の複製
 */
function handleCopyShape() {
  if (selectedShapeId) {
    const originalShape = shapes.find(s => s.id === selectedShapeId);
    if (originalShape) {
      const id = `shape-${nextShapeId++}`;
      
      // オフセットを設定（少し右下にずらす）
      const offsetX = CONFIG.GRID_SIZE * 2;
      const offsetY = CONFIG.GRID_SIZE * 2;
      
      const newX = originalShape.x + offsetX;
      const newY = originalShape.y + offsetY;
      
      // 新しい図形を作成（深いコピー）
      const newShape = JSON.parse(JSON.stringify(originalShape));
      newShape.id = id;
      newShape.x = newX;
      newShape.y = newY;
      
      // 境界チェック
      const scaledWidth = newShape.width * CONFIG.GRID_SIZE * newShape.scale;
      const scaledHeight = newShape.height * CONFIG.GRID_SIZE * newShape.scale;
      
      if (newShape.x + scaledWidth > CONFIG.GRID_WIDTH) {
        newShape.x = Math.max(0, CONFIG.GRID_WIDTH - scaledWidth);
      }
      
      if (newShape.y + scaledHeight > CONFIG.GRID_HEIGHT) {
        newShape.y = Math.max(0, CONFIG.GRID_HEIGHT - scaledHeight);
      }
      
      shapes.push(newShape);
      drawShape(newShape);
      selectedShapeIds = [id];
      selectShape(id);
      
      // 操作履歴を記録
      recordHistory('copy');
      
      // 通知を表示
      showNotification('コピーしました！');
    }
  }
}

/**
 * 図形削除処理
 */
function handleDeleteShape() {
  if (selectedShapeIds.length > 0) {
    // 操作前の状態を記録
    recordHistory('before delete');
    
    // 図形をIDで削除
    shapes = shapes.filter(s => !selectedShapeIds.includes(s.id));
    
    // 要素をIDで削除
    selectedShapeIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        canvas.removeChild(element);
      }
    });
    
    // 選択状態をリセット
    clearSelection();
    
    // 通知を表示
    showNotification('けしました');
  }
}

/**
 * すべてクリア
 */
function handleClearAll() {
  // 確認ダイアログ
  if (confirm('ほんとうにぜんぶけしますか？')) {
    // 操作前の状態を記録
    recordHistory('before clear all');
    
    // 図形配列をクリア
    shapes = [];
    
    // 図形要素だけを取得（グリッド線以外）
    const shapeElements = Array.from(canvas.querySelectorAll('[id^="shape-"]'));
    
    // 図形要素を削除
    shapeElements.forEach(element => canvas.removeChild(element));
    
    // 選択状態をリセット
    clearSelection();
    
    // 通知を表示
    showNotification('ぜんぶけしました');
  }
}

/**
 * 前面に移動（新機能）
 */
function bringForward() {
  if (selectedShapeId) {
    const index = shapes.findIndex(s => s.id === selectedShapeId);
    if (index !== -1 && index < shapes.length - 1) {
      // 配列内での位置を入れ替え
      [shapes[index], shapes[index + 1]] = [shapes[index + 1], shapes[index]];
      
      // 図形を更新
      redrawShapes();
      
      // 操作履歴を記録
      recordHistory('bring forward');
      
      // 通知を表示
      showNotification('まえに移動しました');
    }
  }
}

/**
 * 背面に移動（新機能）
 */
function sendBackward() {
  if (selectedShapeId) {
    const index = shapes.findIndex(s => s.id === selectedShapeId);
    if (index > 0) {
      // 配列内での位置を入れ替え
      [shapes[index], shapes[index - 1]] = [shapes[index - 1], shapes[index]];
      
      // 図形を更新
      redrawShapes();
      
      // 操作履歴を記録
      recordHistory('send backward');
      
      // 通知を表示
      showNotification('うしろに移動しました');
    }
  }
}

/**
 * グループ化（新機能）
 */
function groupShapes() {
  if (selectedShapeIds.length <= 1) return;
  
  // グループ対象の図形を取得
  const selectedShapes = shapes.filter(s => selectedShapeIds.includes(s.id));
  if (selectedShapes.length <= 1) return;
  
  // 操作前の状態を記録
  recordHistory('before group');
  
  // バウンディングボックスを計算
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  selectedShapes.forEach(shape => {
    const scaledWidth = shape.width * CONFIG.GRID_SIZE * shape.scale;
    const scaledHeight = shape.height * CONFIG.GRID_SIZE * shape.scale;
    
    minX = Math.min(minX, shape.x);
    minY = Math.min(minY, shape.y);
    maxX = Math.max(maxX, shape.x + scaledWidth);
    maxY = Math.max(maxY, shape.y + scaledHeight);
  });
  
  // グループのサイズと位置を計算（グリッド単位）
  const groupWidth = Math.ceil((maxX - minX) / CONFIG.GRID_SIZE);
  const groupHeight = Math.ceil((maxY - minY) / CONFIG.GRID_SIZE);
  
  // グループ内の図形の相対位置を計算
  const children = selectedShapes.map(shape => {
    return {
      ...shape,
      relativeX: shape.x - minX,
      relativeY: shape.y - minY
    };
  });
  
  // 新しいグループを作成
  const groupId = `shape-${nextShapeId++}`;
  const group = {
    id: groupId,
    type: 'group',
    x: minX,
    y: minY,
    width: groupWidth,
    height: groupHeight,
    color: 'transparent',
    stroke: '#666666',
    rotation: 0,
    scale: 1,
    label: 'グループ',
    children: children
  };
  
  // 元の図形を削除
  shapes = shapes.filter(s => !selectedShapeIds.includes(s.id));
  
  // グループを追加
  shapes.push(group);
  
  // 図形を更新
  redrawShapes();
  
  // 新しいグループを選択
  selectedShapeIds = [groupId];
  selectShape(groupId);
  
  // 通知を表示
  showNotification(`${children.length}個の図形をグループ化しました`);
}

/**
 * グループ解除（新機能）
 */
function ungroupShapes() {
  if (!selectedShapeId) return;
  
  const groupIndex = shapes.findIndex(s => s.id === selectedShapeId);
  if (groupIndex === -1) return;
  
  const group = shapes[groupIndex];
  if (group.type !== 'group' || !group.children) return;
  
  // 操作前の状態を記録
  recordHistory('before ungroup');
  
  // グループ内の図形を追加
  const newIds = [];
  group.children.forEach(child => {
    const newId = `shape-${nextShapeId++}`;
    newIds.push(newId);
    
    // グループの位置と回転を考慮して図形の位置を計算
    const absX = group.x + child.relativeX;
    const absY = group.y + child.relativeY;
    
    // 新しい図形を作成
    const newShape = {
      ...child,
      id: newId,
      x: absX,
      y: absY
    };
    
    // 相対位置を削除
    delete newShape.relativeX;
    delete newShape.relativeY;
    
    // 図形を追加
    shapes.push(newShape);
  });
  
  // グループを削除
  shapes.splice(groupIndex, 1);
  
  // 図形を更新
  redrawShapes();
  
  // 解除した図形を全て選択
  selectedShapeIds = newIds;
  if (newIds.length > 0) {
    selectShape(newIds[0]);
  } else {
    clearSelection();
  }
  
  // 通知を表示
  showNotification('グループを解除しました');
}

/**
 * フチの色を変更（新機能）
 * @param {string} color - 新しいフチの色
 */
function updateStrokeColor(color) {
  activeStrokeColor = color;
  
  if (selectedShapeId) {
    const shapeIndex = shapes.findIndex(s => s.id === selectedShapeId);
    if (shapeIndex !== -1) {
      // フチの色を更新
      shapes[shapeIndex].stroke = color;
      
      // 図形を更新
      drawShape(shapes[shapeIndex]);
      
      // 操作履歴を記録
      recordHistory('change stroke');
      
      // 通知を表示
      if (color === 'none') {
        showNotification('フチをけしました');
      } else {
        showNotification('フチのいろをかえました');
      }
    }
  }
}