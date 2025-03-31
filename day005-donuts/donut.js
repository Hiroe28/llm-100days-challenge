// ドーナツの内側かどうかをチェックする関数
function isInsideDonut(x, y, margin = 0) {
  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadius = min(width, height) * 0.35; // ドーナツ全体の半径
  const safeOuterRadius = outerRadius - margin; // 安全マージンを引いた外側半径
  
  if (donutShape === 'ring') {
    const innerRadius = outerRadius * 0.4; // 穴の半径
    const safeInnerRadius = innerRadius + margin; // 安全マージンを足した内側半径
    const distFromCenter = dist(x, y, centerX, centerY);
    return distFromCenter <= safeOuterRadius && distFromCenter >= safeInnerRadius;
  }
  else { // jam
    const distFromCenter = dist(x, y, centerX, centerY);
    return distFromCenter <= safeOuterRadius;
  }
}

// ドーナツの形状マスクを生成
function createDonutMask() {
  maskLayer.clear();
  maskLayer.background(0, 0); // 透明背景
  
  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadius = min(width, height) * 0.35;
  
  maskLayer.fill(255);
  maskLayer.noStroke();
  
  if (donutShape === 'ring') {
    // リングドーナツのマスク
    const innerRadius = outerRadius * 0.4;
    
    // 外側の円
    maskLayer.ellipse(centerX, centerY, outerRadius * 2);
    
    // 内側の穴（透明に切り抜く）
    maskLayer.erase();
    maskLayer.ellipse(centerX, centerY, innerRadius * 2);
    maskLayer.noErase();
  }
  else if (donutShape === 'jam') {
    // ジャムドーナツ（穴なし）
    maskLayer.ellipse(centerX, centerY, outerRadius * 2);
  }
}

// ドーナツの縁取りを描く関数
function drawDonutOutline() {
  outlineLayer.clear();
  
  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadius = min(width, height) * 0.35;
  const innerRadius = outerRadius * 0.4;
  const outlineThickness = 3; // 縁取りの太さを設定
  
  // 縁取りの色は濃い茶色
  outlineLayer.stroke('#442c1e');
  outlineLayer.strokeWeight(outlineThickness);
  outlineLayer.noFill();
  
  if (donutShape === 'ring') {
    // 外側の円の縁取り
    outlineLayer.ellipse(centerX, centerY, outerRadius * 2);
    
    // 内側の穴の縁取り
    outlineLayer.ellipse(centerX, centerY, innerRadius * 2);
  }
  else if (donutShape === 'jam') {
    // ジャムドーナツの縁取り
    outlineLayer.ellipse(centerX, centerY, outerRadius * 2);
  }
}

// ドーナツの影を描画する関数
function drawDonutShadow() {
  shadowLayer.clear();
  
  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadius = min(width, height) * 0.35;
  const shadowOffset = 8; // 影のオフセット
  
  shadowLayer.noStroke();
  shadowLayer.fill(0, 0, 0, 60); // 半透明の黒で影を表現
  
  if (donutShape === 'ring' || donutShape === 'jam') {
    // ドーナツの影
    shadowLayer.ellipse(centerX + shadowOffset, centerY + shadowOffset, outerRadius * 2);
  }
}

// ドーナツを描画する関数
function drawDonut() {
  background('#fff6e6'); // よりきれいなクリーム色の背景
  
  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadius = min(width, height) * 0.35;
  const innerRadius = outerRadius * 0.4;
  
  // ベースレイヤーをクリア
  baseLayer.clear();
  
  // アイシングレイヤーをクリア
  icingLayer.clear();
  
  // 縁取りレイヤーをクリア
  outlineLayer.clear();
  
  // ドーナツ形状のマスクを作成（穴部分を抜きたいとき用）
  createDonutMask();
  
  if (donutShape === 'ring') {
    // リングドーナツ（穴あり）
    baseLayer.noStroke();
    baseLayer.fill(baseColor);
    baseLayer.ellipse(centerX, centerY, outerRadius * 2);
    baseLayer.fill('#fff6e6'); // 背景色で穴を塗りつぶし
    baseLayer.ellipse(centerX, centerY, innerRadius * 2);
    
    // アイシング（上部だけ）
    icingLayer.noStroke();
    icingLayer.fill(icingColor);
    // -PI（左端）から 0（右端）までの半円を描画
    icingLayer.arc(centerX, centerY, outerRadius * 2, outerRadius * 2, -PI, 0);
    icingLayer.fill('#fff6e6');
    icingLayer.ellipse(centerX, centerY, innerRadius * 2);
  } else if (donutShape === 'jam') {
    // ジャムドーナツ（穴なし）
    baseLayer.noStroke();
    baseLayer.fill(baseColor);
    baseLayer.ellipse(centerX, centerY, outerRadius * 2);
    
    // アイシング（上部だけ）
    icingLayer.noStroke();
    icingLayer.fill(icingColor);
    // -PI から 0 までの半円を描画
    icingLayer.arc(centerX, centerY, outerRadius * 2, outerRadius * 2, -PI, 0);
  }
  
  // 縁取りを描画
  drawDonutOutline();
  
  // 最後に各レイヤーを合成して表示
  image(baseLayer, 0, 0);
  image(icingLayer, 0, 0);
  image(paintLayer, 0, 0);
  image(outlineLayer, 0, 0);
}

// ペイントレイヤーをクリア
function clearPaintLayer() {
  paintLayer.clear();
}

// ドーナツをリセット
function resetDonut() {
  paintLayer.clear();
  donutShape = 'ring';
  baseColor = baseColors[0].value;
  icingColor = icingColors[1].value;
  activeTool = 'spray';
  sprayColor = 'rainbow'; // レインボーをデフォルトに
  
  // UIの選択状態をリセット
  document.getElementById('btn-ring').classList.add('active');
  document.getElementById('btn-jam').classList.remove('active');
  
  document.getElementById('btn-spray').classList.add('active');
  document.getElementById('btn-sprinkles').classList.remove('active');
  document.getElementById('btn-choco').classList.remove('active');
  document.getElementById('btn-heart').classList.remove('active');
  document.getElementById('btn-star').classList.remove('active');
  
  // ツール設定パネルの表示・非表示を切り替え
  document.getElementById('spray-settings').style.display = 'block';
  document.getElementById('topping-settings').style.display = 'none';
  
  updateColorSelection('base-colors', baseColor);
  updateColorSelection('icing-colors', icingColor);
  
  // スプレーカラーのレインボーを選択状態に
  const sprayContainer = document.getElementById('spray-colors');
  const colorOptions = sprayContainer.querySelectorAll('.color-option');
  colorOptions.forEach(option => {
    option.classList.remove('selected');
    if (option.style.background && option.style.background.includes('linear-gradient')) {
      option.classList.add('selected');
    }
  });
  
  drawDonut();
  
  // 履歴をクリア
  history = [];
  currentHistoryIndex = -1;
  saveToHistory(); // リセット後の状態を履歴に保存
}

// ランダムなドーナツを作成
function createRandomDonut() {
  // レイヤーをクリア
  paintLayer.clear();
  
  // ランダムな形を選択
  const shapes = ['ring', 'jam'];
  donutShape = random(shapes);
  
  // UIのボタンを更新
  document.getElementById('btn-ring').classList.remove('active');
  document.getElementById('btn-jam').classList.remove('active');
  
  if (donutShape === 'ring') {
    document.getElementById('btn-ring').classList.add('active');
  } else {
    document.getElementById('btn-jam').classList.add('active');
  }
  
  // ランダムな色を選択
  baseColor = random(baseColors).value;
  icingColor = random(icingColors).value;
  
  // 色パレットの選択状態を更新
  updateColorSelection('base-colors', baseColor);
  updateColorSelection('icing-colors', icingColor);
  
  // ドーナツを描画
  drawDonut();
  
  // ランダムなスプレーとトッピングを追加
  const decorationTypes = ['spray', 'sprinkles', 'choco', 'heart', 'star'];
  const randomDecorations = [];
  
  // 1-3種類のデコレーションをランダムに選択
  const numDecorationTypes = floor(random(1, 4));
  for (let i = 0; i < numDecorationTypes; i++) {
    randomDecorations.push(random(decorationTypes));
  }
  
  // 選択したデコレーションを追加
  randomDecorations.forEach(type => {
    let count;
    if (type === 'spray') {
      count = floor(random(5, 15)); // スプレーの点の数
    } else if (type === 'sprinkles') {
      count = floor(random(20, 50));
    } else {
      count = floor(random(5, 15));
    }
    addRandomToppings(type, count);
  });
  
  drawDonut();
}

// ドーナツを保存
function saveDonut() {
  // 新しいキャンバスを作成（透明背景用）
  const saveCanvas = createGraphics(width, height, P2D);
  saveCanvas.clear(); // 透明背景
  
  // マスクレイヤーを適用して保存
  const tempCanvas = createGraphics(width, height, P2D);
  tempCanvas.clear();
  
  // 各レイヤーを合成（影は除く）
  tempCanvas.image(baseLayer, 0, 0);
  tempCanvas.image(icingLayer, 0, 0);
  tempCanvas.image(paintLayer, 0, 0);
  tempCanvas.image(outlineLayer, 0, 0);
  
  // マスクを適用
  saveCanvas.drawingContext.globalCompositeOperation = 'source-over';
  saveCanvas.image(tempCanvas, 0, 0);
  
  // マスクの外側を透明に
  createDonutMask(); // 最新のマスクを作成
  saveCanvas.drawingContext.globalCompositeOperation = 'destination-in';
  saveCanvas.image(maskLayer, 0, 0);
  
  // ファイル名を生成（現在の日時を含む）
  const timestamp = year() + '' + month() + '' + day() + '' + hour() + '' + minute();
  const filename = `わたしのドーナツ_${timestamp}.png`;
  
  // 保存
  saveCanvas.save(filename);
}
