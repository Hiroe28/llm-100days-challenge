/**
 * 図形と部品の描画処理
 */

// 状態変数
let shapes = [];
let nextShapeId = 0;
let activeColor = CONFIG.COLORS[0];

/**
 * 図形を追加
 * @param {Object} shapeTemplate - 追加する図形のテンプレート
 */
function addShape(shapeTemplate) {
  const id = `shape-${nextShapeId++}`;
  
  // キャンバスの中央に図形を配置
  const centerX = Math.floor(CONFIG.GRID_WIDTH / 2) - Math.floor(shapeTemplate.width * CONFIG.GRID_SIZE / 2);
  const centerY = Math.floor(CONFIG.GRID_HEIGHT / 2) - Math.floor(shapeTemplate.height * CONFIG.GRID_SIZE / 2);
  
  // グリッドにスナップ
  const x = Math.round(centerX / CONFIG.GRID_SIZE) * CONFIG.GRID_SIZE;
  const y = Math.round(centerY / CONFIG.GRID_SIZE) * CONFIG.GRID_SIZE;
  
  const newShape = {
    ...shapeTemplate,
    id,
    x,
    y,
    color: activeColor,
    stroke: activeStrokeColor, // フチ色を追加
    rotation: 0,
    scale: 1,
    label: shapeTemplate.label
  };
  
  shapes.push(newShape);
  drawShape(newShape);
  selectShape(id);
  
  // 操作履歴に記録
  recordHistory('add shape');
  
  // 通知を表示
  showNotification('新しい図形を追加しました！');
  
  // ハイライト効果を適用
  const element = document.getElementById(id);
  if (element) {
    element.querySelectorAll('*').forEach(el => {
      el.classList.add('highlight');
      setTimeout(() => el.classList.remove('highlight'), 1000);
    });
  }
}

/**
 * 部品を追加
 * @param {Object} partTemplate - 追加する部品のテンプレート
 */
function addPart(partTemplate) {
  const id = `shape-${nextShapeId++}`;
  
  // キャンバスの中央に部品を配置
  const centerX = Math.floor(CONFIG.GRID_WIDTH / 2) - Math.floor(partTemplate.width * CONFIG.GRID_SIZE / 2);
  const centerY = Math.floor(CONFIG.GRID_HEIGHT / 2) - Math.floor(partTemplate.height * CONFIG.GRID_SIZE / 2);
  
  // グリッドにスナップ
  const x = Math.round(centerX / CONFIG.GRID_SIZE) * CONFIG.GRID_SIZE;
  const y = Math.round(centerY / CONFIG.GRID_SIZE) * CONFIG.GRID_SIZE;
  
  const newPart = {
    ...partTemplate,
    id,
    x,
    y,
    color: partTemplate.color, // 部品は初期色を維持
    stroke: '#333333', // デフォルトのフチ色
    rotation: 0,
    scale: 1,
    label: partTemplate.label
  };
  
  shapes.push(newPart);
  drawPart(newPart);
  selectShape(id);
  
  // 操作履歴に記録
  recordHistory('add part');
  
  // 通知を表示
  showNotification('新しい部品を追加しました！');
  
  // ハイライト効果を適用
  const element = document.getElementById(id);
  if (element) {
    element.querySelectorAll('*').forEach(el => {
      el.classList.add('highlight');
      setTimeout(() => el.classList.remove('highlight'), 1000);
    });
  }
}

/**
 * 道路を追加
 * @param {Object} roadTemplate - 追加する道路のテンプレート
 */
function addRoad(roadTemplate) {
  const id = `shape-${nextShapeId++}`;
  
  // キャンバスの中央に道路を配置
  const centerX = Math.floor(CONFIG.GRID_WIDTH / 2) - Math.floor(roadTemplate.width * CONFIG.GRID_SIZE / 2);
  const centerY = Math.floor(CONFIG.GRID_HEIGHT / 2) - Math.floor(roadTemplate.height * CONFIG.GRID_SIZE / 2);
  
  // グリッドにスナップ
  const x = Math.round(centerX / CONFIG.GRID_SIZE) * CONFIG.GRID_SIZE;
  const y = Math.round(centerY / CONFIG.GRID_SIZE) * CONFIG.GRID_SIZE;
  
  const newRoad = {
    ...roadTemplate,
    id,
    x,
    y,
    color: roadTemplate.color,
    stroke: '#555555', // 道路のフチ色
    rotation: 0,
    scale: 1,
    label: roadTemplate.label
  };
  
  shapes.push(newRoad);
  drawRoad(newRoad);
  selectShape(id);
  
  // 操作履歴に記録
  recordHistory('add road');
  
  // 通知を表示
  showNotification('新しい道路を追加しました！');
  
  // ハイライト効果を適用
  const element = document.getElementById(id);
  if (element) {
    element.querySelectorAll('*').forEach(el => {
      el.classList.add('highlight');
      setTimeout(() => el.classList.remove('highlight'), 1000);
    });
  }
}

/**
 * 図形を描画
 * @param {Object} shape - 描画する図形
 */
/**
 * 図形を描画
 * @param {Object} shape - 描画する図形
 */
function drawShape(shape) {
  const { id, type, x, y, width, height, color, stroke, rotation, scale } = shape;
  
  // 部品や道路の場合は専用の描画関数を使用
  if (['window', 'door', 'chimney', 'tree'].includes(type)) {
    drawPart(shape);
    return;
  } else if (['straight-road', 'cross-road', 'corner-road', 't-junction', 'bridge'].includes(type)) {
    drawRoad(shape);
    return;
  } else if (type === 'group') {
    drawGroup(shape);
    return;
  }
  
  
  // グループ要素（変形のため）
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('id', id);
  
  // 中心点を計算
  const centerX = x + (width * CONFIG.GRID_SIZE * scale) / 2;
  const centerY = y + (height * CONFIG.GRID_SIZE * scale) / 2;
  
  // 回転処理のためのグループ
  const rotateG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  
  // 90度単位の回転の場合、表示上は幅と高さが入れ替わる
  let displayWidth = width;
  let displayHeight = height;
  
  if ((rotation % 180 !== 0) && (rotation % 90 === 0) && width !== height) {
    // 90度または270度回転で長方形の場合、表示上の幅と高さを入れ替える
    displayWidth = height;
    displayHeight = width;
  }
  
  // 変形を適用
  rotateG.setAttribute('transform', `rotate(${rotation} ${centerX} ${centerY})`);
  
  let shapeElement;
  

  switch (type) {
    case 'square':
    case 'rectangle':
      shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      shapeElement.setAttribute('x', x);
      shapeElement.setAttribute('y', y);
      shapeElement.setAttribute('width', width * CONFIG.GRID_SIZE * scale);
      shapeElement.setAttribute('height', height * CONFIG.GRID_SIZE * scale);
      break;
    case 'triangle':
    case 'roof':
      shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      shapeElement.setAttribute('points', 
        `${x},${y + height * CONFIG.GRID_SIZE * scale} ${x + width * CONFIG.GRID_SIZE * scale / 2},${y} ${x + width * CONFIG.GRID_SIZE * scale},${y + height * CONFIG.GRID_SIZE * scale}`
      );
      break;
    case 'circle':
      shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      shapeElement.setAttribute('cx', x + width * CONFIG.GRID_SIZE * scale / 2);
      shapeElement.setAttribute('cy', y + height * CONFIG.GRID_SIZE * scale / 2);
      shapeElement.setAttribute('r', width * CONFIG.GRID_SIZE * scale / 2);
      break;
  }
  
  shapeElement.setAttribute('fill', color);
  shapeElement.setAttribute('stroke', stroke || '#333');
  shapeElement.setAttribute('stroke-width', '1');
  if (stroke === 'none') {
    shapeElement.classList.add('no-stroke');
  }
  shapeElement.style.cursor = 'move';
  
  rotateG.appendChild(shapeElement);
  g.appendChild(rotateG);
  
  // 選択されている場合は制御ハンドルを追加
  if (selectedShapeIds.includes(shape.id)) {
    addSelectionHandles(g, shape, displayWidth, displayHeight);
  }
  
  // イベントリスナーを設定
  g.addEventListener('mousedown', (e) => handleShapeMouseDown(e, shape));

  // スマホ向けタッチハンドリング
  addShapeTouchHandlers(g, shape);

  // 既に存在する場合は更新、そうでなければ追加
  const existingShape = document.getElementById(id);
  if (existingShape) {
    canvas.replaceChild(g, existingShape);
  } else {
    canvas.appendChild(g);
  }
}

/**
 * グループを描画（新機能）
 * @param {Object} group - 描画するグループ
 */
function drawGroup(group) {
  const { id, x, y, width, height, color, stroke, rotation, scale, children } = group;
  
  // グループ要素
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('id', id);
  
  // 中心点を計算
  const centerX = x + (width * CONFIG.GRID_SIZE * scale) / 2;
  const centerY = y + (height * CONFIG.GRID_SIZE * scale) / 2;
  
  // 変形を適用
  g.setAttribute('transform', `rotate(${rotation} ${centerX} ${centerY})`);
  
  // グループの境界を表す四角形（選択時のみ表示）
  if (selectedShapeIds.includes(id)) {
    const border = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    border.setAttribute('x', x);
    border.setAttribute('y', y);
    border.setAttribute('width', width * CONFIG.GRID_SIZE * scale);
    border.setAttribute('height', height * CONFIG.GRID_SIZE * scale);
    border.setAttribute('fill', 'transparent');
    border.setAttribute('stroke', stroke || '#666');
    border.setAttribute('stroke-width', '1');
    border.setAttribute('stroke-dasharray', '4,4');
    g.appendChild(border);
  }
  
  // 子要素を描画
  if (children && children.length > 0) {
    children.forEach(child => {
      // 子要素の絶対位置を計算
      const childX = x + child.relativeX;
      const childY = y + child.relativeY;
      
      // 子要素のグループを作成
      const childG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      
      // 子要素の図形要素を作成
      let childElement;
      
      switch (child.type) {
        case 'square':
        case 'rectangle':
          childElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          childElement.setAttribute('x', childX);
          childElement.setAttribute('y', childY);
          childElement.setAttribute('width', child.width * CONFIG.GRID_SIZE * child.scale);
          childElement.setAttribute('height', child.height * CONFIG.GRID_SIZE * child.scale);
          break;
        case 'triangle':
        case 'roof':
          childElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
          childElement.setAttribute('points', 
            `${childX},${childY + child.height * CONFIG.GRID_SIZE * child.scale} ${childX + child.width * CONFIG.GRID_SIZE * child.scale / 2},${childY} ${childX + child.width * CONFIG.GRID_SIZE * child.scale},${childY + child.height * CONFIG.GRID_SIZE * child.scale}`
          );
          break;
        case 'circle':
          childElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          childElement.setAttribute('cx', childX + child.width * CONFIG.GRID_SIZE * child.scale / 2);
          childElement.setAttribute('cy', childY + child.height * CONFIG.GRID_SIZE * child.scale / 2);
          childElement.setAttribute('r', child.width * CONFIG.GRID_SIZE * child.scale / 2);
          break;
      }
      
      if (childElement) {
        childElement.setAttribute('fill', child.color);
        childElement.setAttribute('stroke', child.stroke || '#333');
        childElement.setAttribute('stroke-width', '1');
        childG.appendChild(childElement);
        g.appendChild(childG);
      }
    });
  }
  
  // 選択されている場合は制御ハンドルを追加
  if (selectedShapeIds.includes(id)) {
    addSelectionHandles(g, group);
  }
  
  // イベントリスナーを設定
  g.addEventListener('mousedown', (e) => handleShapeMouseDown(e, group));

  // スマホ向けタッチハンドリング
  addShapeTouchHandlers(g, group);
  
  // 既に存在する場合は更新、そうでなければ追加
  const existingGroup = document.getElementById(id);
  if (existingGroup) {
    canvas.replaceChild(g, existingGroup);
  } else {
    canvas.appendChild(g);
  }
}


/**
 * 部品を描画
 * @param {Object} part - 描画する部品
 */
function drawPart(part) {
  const { id, type, x, y, width, height, color, stroke, rotation, scale } = part;
  
  // グループ要素（変形のため）
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('id', id);
  
  // 中心点を計算
  const centerX = x + (width * CONFIG.GRID_SIZE * scale) / 2;
  const centerY = y + (height * CONFIG.GRID_SIZE * scale) / 2;
  
  // 回転処理のためのグループ
  const rotateG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  
  // 90度単位の回転の場合、表示上は幅と高さが入れ替わる
  let displayWidth = width;
  let displayHeight = height;
  
  if ((rotation % 180 !== 0) && (rotation % 90 === 0) && width !== height) {
    // 90度または270度回転で長方形の場合、表示上の幅と高さを入れ替える
    displayWidth = height;
    displayHeight = width;
  }
  
  // 変形を適用
  rotateG.setAttribute('transform', `rotate(${rotation} ${centerX} ${centerY})`);
  
  let partElement;
  
  switch (type) {
    case 'window':
      // 窓
      const windowGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      
      const windowRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      windowRect.setAttribute('x', x);
      windowRect.setAttribute('y', y);
      windowRect.setAttribute('width', width * CONFIG.GRID_SIZE * scale);
      windowRect.setAttribute('height', height * CONFIG.GRID_SIZE * scale);
      windowRect.setAttribute('fill', color);
      windowRect.setAttribute('stroke', stroke || '#333');
      
      const windowLine1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      windowLine1.setAttribute('x1', x);
      windowLine1.setAttribute('y1', y + height * CONFIG.GRID_SIZE * scale / 2);
      windowLine1.setAttribute('x2', x + width * CONFIG.GRID_SIZE * scale);
      windowLine1.setAttribute('y2', y + height * CONFIG.GRID_SIZE * scale / 2);
      windowLine1.setAttribute('stroke', stroke || '#333');
      
      const windowLine2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      windowLine2.setAttribute('x1', x + width * CONFIG.GRID_SIZE * scale / 2);
      windowLine2.setAttribute('y1', y);
      windowLine2.setAttribute('x2', x + width * CONFIG.GRID_SIZE * scale / 2);
      windowLine2.setAttribute('y2', y + height * CONFIG.GRID_SIZE * scale);
      windowLine2.setAttribute('stroke', stroke || '#333');
      
      windowGroup.appendChild(windowRect);
      windowGroup.appendChild(windowLine1);
      windowGroup.appendChild(windowLine2);
      
      partElement = windowGroup;
      break;
      
    case 'door':
      // ドア
      const doorGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      
      const doorRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      doorRect.setAttribute('x', x);
      doorRect.setAttribute('y', y);
      doorRect.setAttribute('width', width * CONFIG.GRID_SIZE * scale);
      doorRect.setAttribute('height', height * CONFIG.GRID_SIZE * scale);
      doorRect.setAttribute('fill', color);
      doorRect.setAttribute('stroke', stroke || '#333');
      
      const doorknob = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      doorknob.setAttribute('cx', x + width * CONFIG.GRID_SIZE * scale * 0.75);
      doorknob.setAttribute('cy', y + height * CONFIG.GRID_SIZE * scale / 2);
      doorknob.setAttribute('r', CONFIG.GRID_SIZE * scale / 4);
      doorknob.setAttribute('fill', '#ffcc5c');
      
      doorGroup.appendChild(doorRect);
      doorGroup.appendChild(doorknob);
      
      partElement = doorGroup;
      break;
      
    case 'chimney':
      // 煙突
      const chimneyGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      
      const chimneyRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      chimneyRect.setAttribute('x', x);
      chimneyRect.setAttribute('y', y);
      chimneyRect.setAttribute('width', width * CONFIG.GRID_SIZE * scale);
      chimneyRect.setAttribute('height', height * CONFIG.GRID_SIZE * scale);
      chimneyRect.setAttribute('fill', color);
      chimneyRect.setAttribute('stroke', stroke || '#333');
      
      const chimneyTop = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      chimneyTop.setAttribute('x', x - CONFIG.GRID_SIZE * scale / 4);
      chimneyTop.setAttribute('y', y - CONFIG.GRID_SIZE * scale / 4);
      chimneyTop.setAttribute('width', width * CONFIG.GRID_SIZE * scale + CONFIG.GRID_SIZE * scale / 2);
      chimneyTop.setAttribute('height', CONFIG.GRID_SIZE * scale / 2);
      chimneyTop.setAttribute('fill', '#333');
      
      chimneyGroup.appendChild(chimneyRect);
      chimneyGroup.appendChild(chimneyTop);
      
      partElement = chimneyGroup;
      break;
      
    case 'tree':
      // 木
      const treeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      
      const treeTrunk = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      treeTrunk.setAttribute('x', x + CONFIG.GRID_SIZE * scale);
      treeTrunk.setAttribute('y', y + CONFIG.GRID_SIZE * scale * 2);
      treeTrunk.setAttribute('width', CONFIG.GRID_SIZE * scale);
      treeTrunk.setAttribute('height', height * CONFIG.GRID_SIZE * scale - CONFIG.GRID_SIZE * scale * 2);
      treeTrunk.setAttribute('fill', '#795548'); // 幹は茶色固定
      
      const treeTop = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      treeTop.setAttribute('points', 
        `${x},${y + CONFIG.GRID_SIZE * scale * 2} ${x + width * CONFIG.GRID_SIZE * scale},${y + CONFIG.GRID_SIZE * scale * 2} ${x + width * CONFIG.GRID_SIZE * scale / 2},${y}`
      );
      treeTop.setAttribute('fill', color);
      treeTop.setAttribute('stroke', stroke || '#333');
      
      treeGroup.appendChild(treeTrunk);
      treeGroup.appendChild(treeTop);
      
      partElement = treeGroup;
      break;
  }
  
  rotateG.appendChild(partElement);
  g.appendChild(rotateG);
  
  // 選択されている場合は制御ハンドルを追加
  if (selectedShapeIds.includes(part.id)) {
    addSelectionHandles(g, part, displayWidth, displayHeight);
  }
  
  // イベントリスナーを設定
  g.addEventListener('mousedown', (e) => handleShapeMouseDown(e, part));
  
  // スマホ向けタッチハンドリング
  addShapeTouchHandlers(g, part);
  
  // 既に存在する場合は更新、そうでなければ追加
  const existingPart = document.getElementById(id);
  if (existingPart) {
    canvas.replaceChild(g, existingPart);
  } else {
    canvas.appendChild(g);
  }
}


/**
 * 道路を描画（改良版）
 * @param {Object} road - 描画する道路
 */
function drawRoad(road) {
  const { id, type, x, y, width, height, color, stroke, rotation, scale } = road;
  
  // グループ要素（変形のため）
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('id', id);
  
  // 中心点を計算
  const centerX = x + (width * CONFIG.GRID_SIZE * scale) / 2;
  const centerY = y + (height * CONFIG.GRID_SIZE * scale) / 2;
  
  // 回転処理のためのグループ
  const rotateG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  
  // 90度単位の回転の場合、表示上は幅と高さが入れ替わる
  let displayWidth = width;
  let displayHeight = height;
  
  if ((rotation % 180 !== 0) && (rotation % 90 === 0) && width !== height) {
    // 90度または270度回転で長方形の場合、表示上の幅と高さを入れ替える
    displayWidth = height;
    displayHeight = width;
  }
  
  // 変形を適用
  rotateG.setAttribute('transform', `rotate(${rotation} ${centerX} ${centerY})`);
  
  // 道路の厚み（共通）
  const roadThick = CONFIG.ROAD_THICK * CONFIG.GRID_SIZE * scale;
  
  let roadElement;
  
  switch (type) {
    case 'straight-road':
      // 直線道路 - シンプルな長方形
      const straightGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      
      const straightRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      straightRect.setAttribute('x', x);
      straightRect.setAttribute('y', y);
      straightRect.setAttribute('width', width * CONFIG.GRID_SIZE * scale);
      straightRect.setAttribute('height', height * CONFIG.GRID_SIZE * scale);
      straightRect.setAttribute('fill', color);
      straightRect.setAttribute('stroke', stroke || '#555');
      
      // 中央線
      const centerLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      centerLine.setAttribute('x1', x);
      centerLine.setAttribute('y1', y + (height * CONFIG.GRID_SIZE * scale) / 2);
      centerLine.setAttribute('x2', x + (width * CONFIG.GRID_SIZE * scale));
      centerLine.setAttribute('y2', y + (height * CONFIG.GRID_SIZE * scale) / 2);
      centerLine.setAttribute('stroke', '#fff');
      centerLine.setAttribute('stroke-width', '2');
      centerLine.setAttribute('stroke-dasharray', '5,5');
      
      straightGroup.appendChild(straightRect);
      straightGroup.appendChild(centerLine);
      
      roadElement = straightGroup;
      break;
      
    case 'cross-road':
      // 十字路 - 新しいシンプルなデザイン
      const crossGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      
      // 基本の四角形（道路の交差点）
      const crossRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      crossRect.setAttribute('x', x);
      crossRect.setAttribute('y', y);
      crossRect.setAttribute('width', width * CONFIG.GRID_SIZE * scale);
      crossRect.setAttribute('height', height * CONFIG.GRID_SIZE * scale);
      crossRect.setAttribute('fill', color);
      crossRect.setAttribute('stroke', stroke || '#555');
      crossGroup.appendChild(crossRect);
      
      // 水平方向の白線
      const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      hLine.setAttribute('x1', x);
      hLine.setAttribute('y1', y + (height * CONFIG.GRID_SIZE * scale) / 2);
      hLine.setAttribute('x2', x + (width * CONFIG.GRID_SIZE * scale));
      hLine.setAttribute('y2', y + (height * CONFIG.GRID_SIZE * scale) / 2);
      hLine.setAttribute('stroke', '#fff');
      hLine.setAttribute('stroke-width', '2');
      hLine.setAttribute('stroke-dasharray', '5,5');
      crossGroup.appendChild(hLine);
      
      // 垂直方向の白線
      const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      vLine.setAttribute('x1', x + (width * CONFIG.GRID_SIZE * scale) / 2);
      vLine.setAttribute('y1', y);
      vLine.setAttribute('x2', x + (width * CONFIG.GRID_SIZE * scale) / 2);
      vLine.setAttribute('y2', y + (height * CONFIG.GRID_SIZE * scale));
      vLine.setAttribute('stroke', '#fff');
      vLine.setAttribute('stroke-width', '2');
      vLine.setAttribute('stroke-dasharray', '5,5');
      crossGroup.appendChild(vLine);
      
      roadElement = crossGroup;
      break;
      
    case 'corner-road':
      // 角の道路 - シンプルで使いやすいL字型
      const cornerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      
      // 基本の四角形
      const cornerBase = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      cornerBase.setAttribute('x', x);
      cornerBase.setAttribute('y', y);
      cornerBase.setAttribute('width', width * CONFIG.GRID_SIZE * scale);
      cornerBase.setAttribute('height', height * CONFIG.GRID_SIZE * scale);
      cornerBase.setAttribute('fill', color);
      cornerBase.setAttribute('stroke', stroke || '#555');
      cornerGroup.appendChild(cornerBase);
      
      // L字の白線（上からスタート、右に曲がる）
      const cornerPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      cornerPath.setAttribute('d', `M ${x + (width * CONFIG.GRID_SIZE * scale) / 2} ${y} 
                                 L ${x + (width * CONFIG.GRID_SIZE * scale) / 2} ${y + (height * CONFIG.GRID_SIZE * scale) / 2}
                                 L ${x + (width * CONFIG.GRID_SIZE * scale)} ${y + (height * CONFIG.GRID_SIZE * scale) / 2}`);
      cornerPath.setAttribute('fill', 'none');
      cornerPath.setAttribute('stroke', '#fff');
      cornerPath.setAttribute('stroke-width', '2');
      cornerPath.setAttribute('stroke-dasharray', '5,5');
      cornerGroup.appendChild(cornerPath);
      
      roadElement = cornerGroup;
      break;
    
    case 't-junction':
      // T字路 - 新しく追加された道路パーツ
      const tJunctionGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      
      // 基本の四角形
      const tJunctionBase = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      tJunctionBase.setAttribute('x', x);
      tJunctionBase.setAttribute('y', y);
      tJunctionBase.setAttribute('width', width * CONFIG.GRID_SIZE * scale);
      tJunctionBase.setAttribute('height', height * CONFIG.GRID_SIZE * scale);
      tJunctionBase.setAttribute('fill', color);
      tJunctionBase.setAttribute('stroke', stroke || '#555');
      tJunctionGroup.appendChild(tJunctionBase);
      
      // 水平方向の白線
      const tHLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      tHLine.setAttribute('x1', x);
      tHLine.setAttribute('y1', y + (height * CONFIG.GRID_SIZE * scale) / 2);
      tHLine.setAttribute('x2', x + (width * CONFIG.GRID_SIZE * scale));
      tHLine.setAttribute('y2', y + (height * CONFIG.GRID_SIZE * scale) / 2);
      tHLine.setAttribute('stroke', '#fff');
      tHLine.setAttribute('stroke-width', '2');
      tHLine.setAttribute('stroke-dasharray', '5,5');
      tJunctionGroup.appendChild(tHLine);
      
      // 垂直方向の白線（上から中央まで）
      const tVLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      tVLine.setAttribute('x1', x + (width * CONFIG.GRID_SIZE * scale) / 2);
      tVLine.setAttribute('y1', y);
      tVLine.setAttribute('x2', x + (width * CONFIG.GRID_SIZE * scale) / 2);
      tVLine.setAttribute('y2', y + (height * CONFIG.GRID_SIZE * scale) / 2);
      tVLine.setAttribute('stroke', '#fff');
      tVLine.setAttribute('stroke-width', '2');
      tVLine.setAttribute('stroke-dasharray', '5,5');
      tJunctionGroup.appendChild(tVLine);
      
      roadElement = tJunctionGroup;
      break;
      
    case 'bridge':
      // 橋 - デザインを少し改良
      const bridgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      
      // 橋の本体
      const bridgeRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bridgeRect.setAttribute('x', x);
      bridgeRect.setAttribute('y', y);
      bridgeRect.setAttribute('width', width * CONFIG.GRID_SIZE * scale);
      bridgeRect.setAttribute('height', height * CONFIG.GRID_SIZE * scale);
      bridgeRect.setAttribute('fill', color);
      bridgeRect.setAttribute('stroke', stroke || '#555');
      bridgeGroup.appendChild(bridgeRect);
      
      // 中央線
      const bridgeLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      bridgeLine.setAttribute('x1', x);
      bridgeLine.setAttribute('y1', y + (height * CONFIG.GRID_SIZE * scale) / 2);
      bridgeLine.setAttribute('x2', x + (width * CONFIG.GRID_SIZE * scale));
      bridgeLine.setAttribute('y2', y + (height * CONFIG.GRID_SIZE * scale) / 2);
      bridgeLine.setAttribute('stroke', '#fff');
      bridgeLine.setAttribute('stroke-width', '2');
      bridgeLine.setAttribute('stroke-dasharray', '5,5');
      bridgeGroup.appendChild(bridgeLine);
      
      // 手すり（上）
      const railTop = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      railTop.setAttribute('x1', x);
      railTop.setAttribute('y1', y);
      railTop.setAttribute('x2', x + (width * CONFIG.GRID_SIZE * scale));
      railTop.setAttribute('y2', y);
      railTop.setAttribute('stroke', '#7f8c8d');
      railTop.setAttribute('stroke-width', '2');
      bridgeGroup.appendChild(railTop);
      
      // 手すり（下）
      const railBottom = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      railBottom.setAttribute('x1', x);
      railBottom.setAttribute('y1', y + (height * CONFIG.GRID_SIZE * scale));
      railBottom.setAttribute('x2', x + (width * CONFIG.GRID_SIZE * scale));
      railBottom.setAttribute('y2', y + (height * CONFIG.GRID_SIZE * scale));
      railBottom.setAttribute('stroke', '#7f8c8d');
      railBottom.setAttribute('stroke-width', '2');
      bridgeGroup.appendChild(railBottom);
      
      // 橋の支柱（シンプルに3つに）
      const posts = 3;
      for (let i = 0; i <= posts; i++) {
        const post = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        post.setAttribute('x1', x + (i * (width * CONFIG.GRID_SIZE * scale) / posts));
        post.setAttribute('y1', y);
        post.setAttribute('x2', x + (i * (width * CONFIG.GRID_SIZE * scale) / posts));
        post.setAttribute('y2', y + (height * CONFIG.GRID_SIZE * scale));
        post.setAttribute('stroke', '#7f8c8d');
        post.setAttribute('stroke-width', '1.5');
        bridgeGroup.appendChild(post);
      }
      
      roadElement = bridgeGroup;
      break;
  }
  
  rotateG.appendChild(roadElement);
  g.appendChild(rotateG);
  
  // 選択されている場合は制御ハンドルを追加
  if (selectedShapeIds.includes(road.id)) {
    addSelectionHandles(g, road, displayWidth, displayHeight);
  }
  
  // イベントリスナーを設定
  g.addEventListener('mousedown', (e) => handleShapeMouseDown(e, road));
  
  // スマホ向けタッチハンドリング
  addShapeTouchHandlers(g, road);
  
  // 既に存在する場合は更新、そうでなければ追加
  const existingRoad = document.getElementById(id);
  if (existingRoad) {
    canvas.replaceChild(g, existingRoad);
  } else {
    canvas.appendChild(g);
  }
}


/**
 * 選択ハンドルを追加（回転対応・完全版）
 * @param {SVGElement} g                 追加先 <g>
 * @param {Object}     shape             図形
 * @param {number}     displayWidth      見た目の幅（グリッド）
 * @param {number}     displayHeight     見た目の高さ（グリッド）
 */
function addSelectionHandles(g, shape, displayWidth, displayHeight) {
  const { x, y, width, height, scale } = shape;

  /* ── 1. 見た目サイズ(px) ───────────────────── */
  const shapeWidth  = displayWidth  * CONFIG.GRID_SIZE * scale;
  const shapeHeight = displayHeight * CONFIG.GRID_SIZE * scale;

  /* ── 2. 回転前の中心(px) ───────────────────── */
  const cx = x + (width  * CONFIG.GRID_SIZE * scale) / 2;
  const cy = y + (height * CONFIG.GRID_SIZE * scale) / 2;

  /* ── 3. 左上(px) ＝ 中心 − ½サイズ ─────────── */
  const boxX = cx - shapeWidth  / 2;
  const boxY = cy - shapeHeight / 2;

  /* ── 選択枠 (破線) ────────────────────────── */
  const selectionBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  selectionBox.setAttribute('x', boxX);
  selectionBox.setAttribute('y', boxY);
  selectionBox.setAttribute('width',  shapeWidth);
  selectionBox.setAttribute('height', shapeHeight);
  selectionBox.setAttribute('class', 'selection-box');
  g.appendChild(selectionBox);

  /* ── 共通ハンドル ─────────────────────────── */
  const handleSize = 10;

  /* 回転ハンドル（上中央） */
  const rotationHandle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  rotationHandle.setAttribute('cx', boxX + shapeWidth / 2);
  rotationHandle.setAttribute('cy', boxY - 15);
  rotationHandle.setAttribute('r',  handleSize / 2);
  rotationHandle.setAttribute('class', 'rotation-handle');
  g.appendChild(rotationHandle);

  /* 回転ハンドルと図形を結ぶ線 */
  const rotationLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  rotationLine.setAttribute('x1', boxX + shapeWidth / 2);
  rotationLine.setAttribute('y1', boxY);
  rotationLine.setAttribute('x2', boxX + shapeWidth / 2);
  rotationLine.setAttribute('y2', boxY - 15);
  rotationLine.setAttribute('class', 'rotation-line');
  g.appendChild(rotationLine);

  /* 右下リサイズハンドル */
  const resizeHandle = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  resizeHandle.setAttribute('x', boxX + shapeWidth - handleSize / 2);
  resizeHandle.setAttribute('y', boxY + shapeHeight - handleSize / 2);
  resizeHandle.setAttribute('width',  handleSize);
  resizeHandle.setAttribute('height', handleSize);
  resizeHandle.setAttribute('class', 'handle');
  resizeHandle.style.cursor = 'nwse-resize';
  g.appendChild(resizeHandle);

  /* ── 幅・高さハンドル（長方形など） ─────────── */
  if (shape.type !== 'circle' && shape.type !== 'group') {
    /* 幅ハンドル（右中央） */
    const widthHandle = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    widthHandle.setAttribute('x', boxX + shapeWidth - handleSize / 2);
    widthHandle.setAttribute('y', boxY + shapeHeight / 2 - handleSize / 2);
    widthHandle.setAttribute('width',  handleSize);
    widthHandle.setAttribute('height', handleSize);
    widthHandle.setAttribute('class', 'width-handle');
    widthHandle.style.cursor = 'ew-resize';
    g.appendChild(widthHandle);

    /* 高さハンドル（下中央） */
    const heightHandle = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    heightHandle.setAttribute('x', boxX + shapeWidth / 2 - handleSize / 2);
    heightHandle.setAttribute('y', boxY + shapeHeight - handleSize / 2);
    heightHandle.setAttribute('width',  handleSize);
    heightHandle.setAttribute('height', handleSize);
    heightHandle.setAttribute('class', 'height-handle');
    heightHandle.style.cursor = 'ns-resize';
    g.appendChild(heightHandle);

    /* --- 幅ハンドル mousedown --- */
    widthHandle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      const svgRect = canvas.getBoundingClientRect();
      const svgScale = {
        x: CONFIG.GRID_WIDTH  / svgRect.width,
        y: CONFIG.GRID_HEIGHT / svgRect.height
      };
      initialMousePos = {
        x: (e.clientX - svgRect.left) * svgScale.x,
        y: (e.clientY - svgRect.top)  * svgScale.y
      };
      initialTransform = { width: shape.width };
      draggedShape    = shape;
      transformMode   = 'width';
      showNotification('よこ幅変更モード');
    });

    /* --- 高さハンドル mousedown --- */
    heightHandle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      const svgRect = canvas.getBoundingClientRect();
      const svgScale = {
        x: CONFIG.GRID_WIDTH  / svgRect.width,
        y: CONFIG.GRID_HEIGHT / svgRect.height
      };
      initialMousePos = {
        x: (e.clientX - svgRect.left) * svgScale.x,
        y: (e.clientY - svgRect.top)  * svgScale.y
      };
      initialTransform = { height: shape.height };
      draggedShape    = shape;
      transformMode   = 'height';
      showNotification('たて幅変更モード');
    });
  }

  /* ── 回転ハンドル mousedown ─────────────────── */
  rotationHandle.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    const svgRect = canvas.getBoundingClientRect();
    const svgScale = {
      x: CONFIG.GRID_WIDTH  / svgRect.width,
      y: CONFIG.GRID_HEIGHT / svgRect.height
    };
    initialMousePos = {
      x: (e.clientX - svgRect.left) * svgScale.x,
      y: (e.clientY - svgRect.top)  * svgScale.y
    };
    initialTransform = { rotation: shape.rotation };
    originalShapePosition = { x: shape.x, y: shape.y };
    draggedShape  = shape;
    transformMode = 'rotate';
    showNotification('回転モード');
  });

  /* ── リサイズハンドル mousedown ─────────────── */
  resizeHandle.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    const svgRect = canvas.getBoundingClientRect();
    const svgScale = {
      x: CONFIG.GRID_WIDTH  / svgRect.width,
      y: CONFIG.GRID_HEIGHT / svgRect.height
    };
    initialMousePos = {
      x: (e.clientX - svgRect.left) * svgScale.x,
      y: (e.clientY - svgRect.top)  * svgScale.y
    };
    initialTransform = { scale: shape.scale };
    originalShapePosition = { x: shape.x, y: shape.y };
    draggedShape  = shape;
    transformMode = 'scale';
    showNotification('サイズ変更モード');
  });
  
  // タッチイベント
  resizeHandle.addEventListener('touchstart', (e) => {
    e.stopPropagation();
    e.preventDefault();
    const touch = e.touches[0];
    const svgRect = canvas.getBoundingClientRect();
    
    // SVGのビューボックスに対するスケール
    const svgScale = {
      x: CONFIG.GRID_WIDTH / svgRect.width,
      y: CONFIG.GRID_HEIGHT / svgRect.height
    };
    
    // タッチ位置をSVG座標に変換
    const touchX = touch.clientX - svgRect.left;
    const touchY = touch.clientY - svgRect.top;
    
    initialMousePos = {
      x: touchX * svgScale.x,
      y: touchY * svgScale.y
    };
    
    initialTransform = {
      scale: shape.scale
    };
    
    originalShapePosition = {
      x: shape.x,
      y: shape.y
    };
    
    draggedShape = shape;
    transformMode = 'scale';
    showNotification('サイズ変更モード');
  }, { passive: false });
  
  g.appendChild(resizeHandle);
  
  // 個別のサイズ調整ハンドル（幅と高さを個別に変更するための新機能）
  if (shape.type !== 'circle' && shape.type !== 'group') {
    // 右中央の幅調整ハンドル
    const widthHandle = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    widthHandle.setAttribute('x', x + shapeWidth - handleSize / 2);
    widthHandle.setAttribute('y', y + shapeHeight / 2 - handleSize / 2);
    widthHandle.setAttribute('width', handleSize);
    widthHandle.setAttribute('height', handleSize);
    widthHandle.setAttribute('class', 'width-handle');
    widthHandle.style.cursor = 'ew-resize';
    
    widthHandle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      const svgRect = canvas.getBoundingClientRect();
      
      // SVGのビューボックスに対するスケール
      const svgScale = {
        x: CONFIG.GRID_WIDTH / svgRect.width,
        y: CONFIG.GRID_HEIGHT / svgRect.height
      };
      
      // マウス位置をSVG座標に変換
      const mouseX = e.clientX - svgRect.left;
      const mouseY = e.clientY - svgRect.top;
      
      initialMousePos = {
        x: mouseX * svgScale.x,
        y: mouseY * svgScale.y
      };
      
      initialTransform = {
        width: shape.width
      };
      
      draggedShape = shape;
      transformMode = 'width';
      showNotification('よこ幅変更モード');
    });
    
    // タッチイベント
    widthHandle.addEventListener('touchstart', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const touch = e.touches[0];
      const svgRect = canvas.getBoundingClientRect();
      
      // SVGのビューボックスに対するスケール
      const svgScale = {
        x: CONFIG.GRID_WIDTH / svgRect.width,
        y: CONFIG.GRID_HEIGHT / svgRect.height
      };
      
      // タッチ位置をSVG座標に変換
      const touchX = touch.clientX - svgRect.left;
      const touchY = touch.clientY - svgRect.top;
      
      initialMousePos = {
        x: touchX * svgScale.x,
        y: touchY * svgScale.y
      };
      
      initialTransform = {
        width: shape.width
      };
      
      draggedShape = shape;
      transformMode = 'width';
      showNotification('よこ幅変更モード');
    }, { passive: false });
    
    g.appendChild(widthHandle);
    
    // 下中央の高さ調整ハンドル
    const heightHandle = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    heightHandle.setAttribute('x', x + shapeWidth / 2 - handleSize / 2);
    heightHandle.setAttribute('y', y + shapeHeight - handleSize / 2);
    heightHandle.setAttribute('width', handleSize);
    heightHandle.setAttribute('height', handleSize);
    heightHandle.setAttribute('class', 'height-handle');
    heightHandle.style.cursor = 'ns-resize';
    
    heightHandle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      const svgRect = canvas.getBoundingClientRect();
      
      // SVGのビューボックスに対するスケール
      const svgScale = {
        x: CONFIG.GRID_WIDTH / svgRect.width,
        y: CONFIG.GRID_HEIGHT / svgRect.height
      };
      
      // マウス位置をSVG座標に変換
      const mouseX = e.clientX - svgRect.left;
      const mouseY = e.clientY - svgRect.top;
      
      initialMousePos = {
        x: mouseX * svgScale.x,
        y: mouseY * svgScale.y
      };
      
      initialTransform = {
        height: shape.height
      };
      
      draggedShape = shape;
      transformMode = 'height';
      showNotification('たて幅変更モード');
    });
    
    // タッチイベント
    heightHandle.addEventListener('touchstart', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const touch = e.touches[0];
      const svgRect = canvas.getBoundingClientRect();
      
      // SVGのビューボックスに対するスケール
      const svgScale = {
        x: CONFIG.GRID_WIDTH / svgRect.width,
        y: CONFIG.GRID_HEIGHT / svgRect.height
      };
      
      // タッチ位置をSVG座標に変換
      const touchX = touch.clientX - svgRect.left;
      const touchY = touch.clientY - svgRect.top;
      
      initialMousePos = {
        x: touchX * svgScale.x,
        y: touchY * svgScale.y
      };
      
      initialTransform = {
        height: shape.height
      };
      
      draggedShape = shape;
      transformMode = 'height';
      showNotification('たて幅変更モード');
    }, { passive: false });
    
    g.appendChild(heightHandle);
  }
}

/**
 * すべての図形を再描画
 */
function redrawShapes() {
  // 図形要素だけを取得（グリッド線以外）
  const shapeElements = Array.from(canvas.querySelectorAll('[id^="shape-"]'));
  
  // 図形要素を削除
  shapeElements.forEach(element => canvas.removeChild(element));
  
  // 図形を再描画
  shapes.forEach(shape => drawShape(shape));
}

/**
 * 選択した図形の色を更新
 * @param {string} color - 新しい色
 */
function updateSelectedShapeColor(color) {
  if (selectedShapeId) {
    const shapeIndex = shapes.findIndex(s => s.id === selectedShapeId);
    if (shapeIndex !== -1) {
      // 色の変更が許可されているタイプか確認 - 新機能：すべてのタイプで色変更可能に
      shapes[shapeIndex].color = color;
      drawShape(shapes[shapeIndex]);
      
      // 操作履歴を記録
      recordHistory('change color');
      
      // 通知を表示
      showNotification('いろをかえました');
    }
  }
}

/**
 * 通知を表示
 * @param {string} message - 表示するメッセージ
 */
function showNotification(message) {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.classList.add('show');
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, 1500);
}