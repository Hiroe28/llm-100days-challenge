// ひらがな・カタカナ・数字なぞり練習アプリ（スマホ対応版）

// 文字データ
const characters = {
  hiragana: ['あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'け', 'こ', 'さ', 'し', 'す', 'せ', 'そ', 'た', 'ち', 'つ', 'て', 'と', 'な', 'に', 'ぬ', 'ね', 'の', 'は', 'ひ', 'ふ', 'へ', 'ほ', 'ま', 'み', 'む', 'め', 'も', 'や', 'ゆ', 'よ', 'ら', 'り', 'る', 'れ', 'ろ', 'わ', 'を', 'ん'],
  katakana: ['ア', 'イ', 'ウ', 'エ', 'オ', 'カ', 'キ', 'ク', 'ケ', 'コ', 'サ', 'シ', 'ス', 'セ', 'ソ', 'タ', 'チ', 'ツ', 'テ', 'ト', 'ナ', 'ニ', 'ヌ', 'ネ', 'ノ', 'ハ', 'ヒ', 'フ', 'ヘ', 'ホ', 'マ', 'ミ', 'ム', 'メ', 'モ', 'ヤ', 'ユ', 'ヨ', 'ラ', 'リ', 'ル', 'レ', 'ロ', 'ワ', 'ヲ', 'ン'],
  numbers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
};

// カラーパレット
const colorPalette = [
  '#FF6B6B', // 赤
  '#FF9E7D', // オレンジ
  '#FFDA77', // 黄色
  '#91F48F', // 緑
  '#4CACBC', // 青
  '#7367F0', // 紫
  '#F77FBE'  // ピンク
];

// フォントオプション
const fontOptions = [
  { id: 'Klee One', label: 'クレー' }
];

// アプリケーション状態
let state = {
  currentCategory: 'hiragana',
  currentChar: 'あ',
  currentFont: 'Klee One',  // デフォルトをKleeに
  strokeColor: colorPalette[0],
  strokeWidth: 12,
  userStrokes: [],
  isDrawing: false,
  accuracy: 0,
  showAccuracy: false,
  templateCreated: false,
  pixelDensity: 1,  // デバイスピクセル比を保存
  canvasRect: null, // キャンバスの位置情報
  debugMode: false  // デバッグモード
};

// テンプレート（文字の輪郭）を保存するバッファ
let templateBuffer;

// デバイスがモバイルかどうかを判定する関数
function isMobileDevice() {
  return (window.innerWidth <= 768);
}

// タッチデバイスかどうかを判定
function isTouchDevice() {
  return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
}

// p5.jsのセットアップ関数
function setup() {
  // キャンバスを作成（モバイル向けに調整）
  let canvasWidth, canvasHeight;
  
  if (isMobileDevice()) {
    // モバイル用のサイズ設定 - 固定値ではなく比率で計算
    canvasWidth = min(windowWidth - 20, 400);
    // モバイルでは画面の50%をキャンバスに使用（60%→50%に縮小）
    canvasHeight = min(windowHeight * 0.5, 350);
    console.log(`モバイルキャンバスサイズ: ${canvasWidth}x${canvasHeight}, 画面サイズ: ${windowWidth}x${windowHeight}`);
  } else {
    // PC用のサイズ設定（縮小）
    canvasWidth = min(windowWidth - 40, 600);
    canvasHeight = min(windowHeight - 300, 500);
  }
  
  let canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent('sketch-holder');
  
  // キャンバスの実際の位置とサイズをログ出力（デバッグ用）
  const canvasRect = canvas.elt.getBoundingClientRect();
  state.canvasRect = canvasRect;
  console.log(`キャンバス実際の位置: x=${canvasRect.left}, y=${canvasRect.top}, 幅=${canvasRect.width}, 高さ=${canvasRect.height}`);
  
  // テンプレートバッファの初期化
  templateBuffer = createGraphics(canvasWidth, canvasHeight);
  
  // フォントを直接CSS名で指定
  textFont('Klee One');
  templateBuffer.textFont('Klee One');
  
  // デバイスピクセル比を記録（高解像度デバイス対応）
  state.pixelDensity = pixelDensity();
  console.log(`デバイスピクセル比: ${state.pixelDensity}`);
  
  // 結果表示エリアのセットアップ（先に実行）
  setupResultDisplay();
  
  // UI要素の初期化
  createUI();
  
  // 描画設定
  background(255);
  noFill();
  
  // モバイルタッチ対応の追加処理
  if (isTouchDevice()) {
    console.log('タッチデバイスを検出しました');
    // スケッチホルダーのスタイルを確認・設定
    const sketchHolder = document.getElementById('sketch-holder');
    if (sketchHolder) {
      sketchHolder.style.position = 'relative';
      sketchHolder.style.touchAction = 'none';
    }

    // スケッチ領域内のタッチイベントはデフォルト動作を防止
    sketchHolder.addEventListener('touchstart', function(e) {
      // キャンバス内のタッチのみpreventDefault
      e.preventDefault();
    }, { passive: false });
  }
  
  // 最初の文字表示を少し遅延させる
  setTimeout(() => {
    updateDisplayChar();
  }, 200); // 200ミリ秒後に実行 
}

// // 結果表示をクリアする関数
// function clearResultDisplay() {
//   const resultDisplay = document.getElementById('result-display');
//   if (resultDisplay) {
//     resultDisplay.innerHTML = '';
//     resultDisplay.style.display = 'none'; // 初期状態では非表示
//   }
// }

// UI要素を作成
function createUI() {
  // カテゴリ選択ボタン
  createCategoryButtons();
  
  // 文字選択ボタン
  createCharButtons();
  
  // フォント選択ボタン
  createFontButtons();
  
  // コントロールパネル
  createControlPanel();
}

// カテゴリ選択ボタンを作成
function createCategoryButtons() {
  const categoryDiv = document.getElementById('category-buttons');
  categoryDiv.innerHTML = '';
  
  const categories = [
    { id: 'hiragana', label: 'ひらがな' },
    { id: 'katakana', label: 'カタカナ' },
    { id: 'numbers', label: 'すうじ' }
  ];
  
  categories.forEach(category => {
    const button = document.createElement('button');
    button.className = `category-btn ${state.currentCategory === category.id ? 'active' : ''}`;
    button.textContent = category.label;
    // デバッグ用にdata属性を追加
    button.setAttribute('data-category', category.id);
    
    // タッチデバイス対応の処理
    if (isTouchDevice()) {
      // タッチスタートでタッチデバイス向けの処理を追加
      button.addEventListener('touchstart', function(event) {
        console.log(`カテゴリ変更タッチ: ${category.id}`);
        
        // 全てのカテゴリボタンからactiveクラスを削除
        document.querySelectorAll('.category-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        
        // タッチされたボタンにactiveクラスを追加
        this.classList.add('active');
        
        // 状態を更新
        state.currentCategory = category.id;
        state.currentChar = characters[category.id][0];
        
        // UIと表示を更新
        createCharButtons();
        resetCanvas();
        
        // イベントの伝播を止めない (preventDefault不使用)
      });
    } else {
      // 従来のクリックイベントリスナー (非タッチデバイス用)
      button.addEventListener('click', function(event) {
        event.preventDefault();
        console.log(`カテゴリ変更クリック: ${category.id}`);
        
        // 全てのカテゴリボタンからactiveクラスを削除
        document.querySelectorAll('.category-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        
        // クリックされたボタンにactiveクラスを追加
        this.classList.add('active');
        
        // 状態を更新
        state.currentCategory = category.id;
        state.currentChar = characters[category.id][0];
        
        // UIと表示を更新
        createCharButtons();
        resetCanvas();
      });
    }
    
    categoryDiv.appendChild(button);
  });
}

// 文字選択ボタンを作成 - スマホ向けに最適化
function createCharButtons() {
  const charDiv = document.getElementById('char-buttons');
  charDiv.innerHTML = '';
  
  // スマホの場合は文字選択エリアの高さをより大きくする
  if (isMobileDevice()) {
    charDiv.style.maxHeight = '140px';  // 高さを大幅に増加
    charDiv.style.padding = '8px 5px';
  } else {
    charDiv.style.maxHeight = '120px';
  }
  
  // 現在選択されているカテゴリを表示（デバッグ用）
  console.log(`文字ボタン生成: カテゴリ=${state.currentCategory}, 文字数=${characters[state.currentCategory].length}`);
  
  // 文字ボタンに直接タッチイベントリスナーを追加
  const charArray = characters[state.currentCategory];
  
  charArray.forEach(char => {
    const button = document.createElement('button');
    button.className = `char-btn ${state.currentChar === char ? 'active' : ''}`;
    button.textContent = char;
    
    // タッチデバイス対応の処理
    if (isTouchDevice()) {
      // タッチスタートでタッチデバイス向けの処理を追加
      button.addEventListener('touchstart', function(event) {
        console.log(`文字ボタンタッチ: ${char}`);
        // すべての文字ボタンからactiveクラスを削除
        document.querySelectorAll('.char-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        
        // クリックされたボタンにactiveクラスを追加
        this.classList.add('active');
        
        // 状態を更新
        state.currentChar = char;
        resetCanvas();
        
        // イベントの伝播を止めない (preventDefault不使用)
      });
    } else {
      // 従来のクリックイベントリスナー (非タッチデバイス用)
      button.addEventListener('click', function(event) {
        event.preventDefault();
        
        // すべての文字ボタンからactiveクラスを削除
        document.querySelectorAll('.char-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        
        // クリックされたボタンにactiveクラスを追加
        this.classList.add('active');
        
        // 状態を更新
        state.currentChar = char;
        resetCanvas();
      });
    }
    
    charDiv.appendChild(button);
  });
  
  // スクロール位置をリセット
  charDiv.scrollTop = 0;
}

// フォント選択ボタンを作成
function createFontButtons() {
  // フォントボタンを非表示にする
  if (!document.getElementById('font-buttons')) {
    const fontDiv = document.createElement('div');
    fontDiv.id = 'font-buttons';
    fontDiv.className = 'button-group';
    fontDiv.style.display = 'none'; // 完全に非表示にする
    
    // タイトルを追加
    const title = document.createElement('div');
    title.className = 'group-title';
    title.textContent = '字体：クレーフォント';
    fontDiv.appendChild(title);
    
    // 制御パネルの前に挿入
    const controlPanel = document.getElementById('control-panel');
    controlPanel.parentNode.insertBefore(fontDiv, controlPanel);
  }
}

let kleeFont;

function preload() {
  // 何もしない - フォントをプリロードしない
}

// コントロールパネルを作成 - スマホ向けに最適化
function createControlPanel() {
  const controlPanel = document.getElementById('control-panel');
  controlPanel.innerHTML = '';
  
  // スマホ用にレイアウトを変更
  if (isMobileDevice()) {
    controlPanel.style.flexDirection = 'column';
    controlPanel.style.alignItems = 'center';
    controlPanel.style.gap = '5px';
    controlPanel.style.padding = '5px';
  }
  
  // 色選択
  const colorContainer = document.createElement('div');
  colorContainer.id = 'color-picker-container';
  
  colorPalette.forEach((color, index) => {
    const colorOption = document.createElement('div');
    colorOption.className = `color-option ${state.strokeColor === color ? 'active' : ''}`;
    colorOption.style.backgroundColor = color;
    
    // タッチデバイスかどうかで処理を分ける
    if (isTouchDevice()) {
      colorOption.addEventListener('touchstart', function(event) {
        console.log(`色選択タッチ: ${color}`);
        
        // 全ての色オプションからactiveクラスを削除
        document.querySelectorAll('.color-option').forEach(option => {
          option.classList.remove('active');
        });
        
        // タッチされたオプションにactiveクラスを追加
        this.classList.add('active');
        
        state.strokeColor = color;
        
        // イベントの伝播を止めない (preventDefault不使用)
      });
    } else {
      // 従来のクリックイベントリスナー
      colorOption.addEventListener('click', function(event) {
        event.preventDefault();
        
        // 全ての色オプションからactiveクラスを削除
        document.querySelectorAll('.color-option').forEach(option => {
          option.classList.remove('active');
        });
        
        // クリックされたオプションにactiveクラスを追加
        this.classList.add('active');
        
        state.strokeColor = color;
      });
    }
    
    colorContainer.appendChild(colorOption);
  });
  controlPanel.appendChild(colorContainer);
  
  // ボタンコンテナ作成（スマホ用に最適化）
  const buttonContainer = document.createElement('div');
  buttonContainer.id = 'button-container';
  buttonContainer.style.display = 'flex';
  buttonContainer.style.flexWrap = 'wrap';
  buttonContainer.style.justifyContent = 'center';
  buttonContainer.style.gap = '5px';
  buttonContainer.style.width = '100%';
  controlPanel.appendChild(buttonContainer);
  
  // リセットボタン
  const resetButton = document.createElement('button');
  resetButton.className = 'control-btn';
  resetButton.innerHTML = '🔄 リセット';

  if (isTouchDevice()) {
    resetButton.addEventListener('touchstart', function(event) {
      event.stopPropagation(); // イベント伝播を停止
      console.log('リセットボタンタッチ');
      resetCanvas();
    }, { passive: false }); // passiveをfalseに設定
  } else {
    resetButton.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation(); // イベント伝播を停止
      console.log('リセットボタンクリック');
      resetCanvas();
    });
  }
    
  buttonContainer.appendChild(resetButton);
  
  // // 保存ボタン
  // const saveButton = document.createElement('button');
  // saveButton.className = 'control-btn';
  // saveButton.innerHTML = '💾 ほぞん';
  
  // if (isTouchDevice()) {
  //   saveButton.addEventListener('touchstart', function(event) {
  //     console.log('保存ボタンタッチ');
  //     saveCanvas(`なぞり書き_${state.currentChar}`, 'png');
  //     // イベントの伝播を止めない (preventDefault不使用)
  //   });
  // } else {
  //   saveButton.addEventListener('click', function(event) {
  //     event.preventDefault();
  //     saveCanvas(`なぞり書き_${state.currentChar}`, 'png');
  //   });
  // }
  
  // buttonContainer.appendChild(saveButton);
  
  // 読み上げボタン修正
  const speakButton = document.createElement('button');
  speakButton.className = 'control-btn';
  speakButton.id = 'speak-button';
  speakButton.innerHTML = '🔊 よみあげ';

  const handleSpeak = function(event) {
    // イベントの伝播と既定の動作を停止
    event.stopPropagation();
    if (event.cancelable) event.preventDefault();
    
    console.log('よみあげボタンアクション');
    
    // iOSの制約対策: ユーザージェスチャ内で音声合成APIを呼び出す
    setTimeout(function() {
      speakText(`${state.currentChar}`);
    }, 10);
  };

  if (isTouchDevice()) {
    speakButton.addEventListener('touchstart', handleSpeak, { passive: false });
  } else {
    speakButton.addEventListener('click', handleSpeak);
  }
  
  buttonContainer.appendChild(speakButton);
  
  // 判定ボタン - モバイルでより目立つように
  const checkButton = createCheckButton();
  if (isMobileDevice()) {
    checkButton.style.backgroundColor = '#ff5c5c';
    checkButton.style.fontWeight = 'bold';
    checkButton.style.fontSize = '15px';
    checkButton.style.padding = '8px 16px';
  }
  buttonContainer.appendChild(checkButton);
}

// キャンバスをリセット
function resetCanvas() {
  state.userStrokes = [];
  state.templateCreated = false; // テンプレートをリセット
  state.showAccuracy = false;    // 結果表示をクリア
  updateDisplayChar();
}

// テンプレート画像の作成を修正（数字向けに調整）
function createTemplateImage() {
  templateBuffer.clear();
  templateBuffer.background(255, 0); // 透明な背景
  
  // 数字カテゴリの場合は専用関数を呼び出す
  if (state.currentCategory === 'numbers') {
    createSimplifiedNumberTemplate();
    state.templateCreated = true;
    return;
  }
  
  // Y位置を調整（キャンバスの30%の位置に配置して文字位置と合わせる）
  let yPosition = isMobileDevice() ? templateBuffer.height * 0.3 : templateBuffer.height * 0.45;
  
  // すべてのカテゴリで同じ処理
  templateBuffer.push();
  templateBuffer.textSize(min(width, height) * 0.7);
  templateBuffer.textAlign(CENTER, CENTER);
  templateBuffer.fill(0, 0, 0, 255); // 黒でクリアに
  templateBuffer.text(state.currentChar, templateBuffer.width/2, yPosition);
  templateBuffer.pop();
  
  state.templateCreated = true;
}

// 数字用の簡略化されたテンプレートを作成
function createSimplifiedNumberTemplate() {
  // Y位置を調整（キャンバスの30%の位置に配置して文字位置と合わせる）
  const centerX = width / 2;
  const centerY = isMobileDevice() ? height * 0.3 : height * 0.45;
  const size = min(width, height) * 0.6; // サイズを少し小さく
  
  templateBuffer.push();
  templateBuffer.stroke(0);
  templateBuffer.strokeWeight(size * 0.15); // 太めの線
  templateBuffer.noFill();
  
  switch(state.currentChar) {
    case '0': // 丸
      templateBuffer.ellipse(centerX, centerY, size * 0.6, size * 0.8);
      break;
      
    case '1': // 縦棒のみ（飾りなし）
      templateBuffer.line(centerX, centerY - size * 0.4, centerX, centerY + size * 0.4);
      break;
      
    case '2': // 簡略化した2
      templateBuffer.beginShape();
      templateBuffer.vertex(centerX - size * 0.3, centerY - size * 0.3); // 左上
      templateBuffer.vertex(centerX + size * 0.3, centerY - size * 0.3); // 右上
      templateBuffer.vertex(centerX + size * 0.3, centerY); // 右中央
      templateBuffer.vertex(centerX - size * 0.3, centerY + size * 0.3); // 左下
      templateBuffer.vertex(centerX + size * 0.3, centerY + size * 0.3); // 右下
      templateBuffer.endShape();
      break;
      
    case '3': // 簡略化した3
      templateBuffer.beginShape();
      templateBuffer.vertex(centerX - size * 0.3, centerY - size * 0.3); // 左上
      templateBuffer.vertex(centerX + size * 0.3, centerY - size * 0.3); // 右上
      templateBuffer.vertex(centerX - size * 0.3, centerY); // 左中央
      templateBuffer.vertex(centerX + size * 0.3, centerY); // 右中央
      templateBuffer.vertex(centerX - size * 0.3, centerY + size * 0.3); // 左下
      templateBuffer.vertex(centerX + size * 0.3, centerY + size * 0.3); // 右下
      templateBuffer.endShape();
      break;
      
    case '4': // 簡略化した4
      templateBuffer.line(centerX, centerY - size * 0.4, centerX, centerY + size * 0.4); // 縦線
      templateBuffer.line(centerX - size * 0.3, centerY, centerX + size * 0.3, centerY); // 横線
      break;
      
    case '5': // 簡略化した5
      templateBuffer.beginShape();
      templateBuffer.vertex(centerX + size * 0.3, centerY - size * 0.3); // 右上
      templateBuffer.vertex(centerX - size * 0.3, centerY - size * 0.3); // 左上
      templateBuffer.vertex(centerX - size * 0.3, centerY); // 左中央
      templateBuffer.vertex(centerX + size * 0.3, centerY); // 右中央
      templateBuffer.vertex(centerX + size * 0.3, centerY + size * 0.3); // 右下
      templateBuffer.vertex(centerX - size * 0.3, centerY + size * 0.3); // 左下
      templateBuffer.endShape();
      break;
      
    case '6': // 簡略化した6
      templateBuffer.beginShape();
      templateBuffer.vertex(centerX, centerY - size * 0.4); // 上
      templateBuffer.vertex(centerX - size * 0.3, centerY); // 左中央
      templateBuffer.vertex(centerX - size * 0.3, centerY + size * 0.3); // 左下
      templateBuffer.vertex(centerX + size * 0.3, centerY + size * 0.3); // 右下
      templateBuffer.vertex(centerX + size * 0.3, centerY); // 右中央
      templateBuffer.vertex(centerX - size * 0.3, centerY); // 左中央
      templateBuffer.endShape();
      break;
      
    case '7': // 簡略化した7（横線と右下がりの線）
      templateBuffer.line(centerX - size * 0.3, centerY - size * 0.3, centerX + size * 0.3, centerY - size * 0.3); // 上の横線
      templateBuffer.line(centerX + size * 0.3, centerY - size * 0.3, centerX - size * 0.1, centerY + size * 0.3); // 斜め線
      break;
      
    case '8': // 簡略化した8（上下2つの丸）
      templateBuffer.ellipse(centerX, centerY - size * 0.2, size * 0.5, size * 0.4); // 上の丸
      templateBuffer.ellipse(centerX, centerY + size * 0.2, size * 0.5, size * 0.4); // 下の丸
      break;
      
    case '9': // 簡略化した9
      templateBuffer.beginShape();
      templateBuffer.vertex(centerX, centerY + size * 0.4); // 下
      templateBuffer.vertex(centerX + size * 0.3, centerY); // 右中央
      templateBuffer.vertex(centerX + size * 0.3, centerY - size * 0.3); // 右上
      templateBuffer.vertex(centerX - size * 0.3, centerY - size * 0.3); // 左上
      templateBuffer.vertex(centerX - size * 0.3, centerY); // 左中央
      templateBuffer.vertex(centerX + size * 0.3, centerY); // 右中央
      templateBuffer.endShape();
      break;
      
    default: // 他の場合（通常のテキスト描画に戻る）
      templateBuffer.textSize(min(width, height) * 0.7);
      templateBuffer.textAlign(CENTER, CENTER);
      templateBuffer.textFont(state.currentFont);
      templateBuffer.fill(0, 0, 0, 255); 
      templateBuffer.text(state.currentChar, centerX, centerY);
  }
  
  templateBuffer.pop();
}

// 文字の「重要ポイント」を特定する関数
function identifyKeyPoints() {
  if (!state.templateCreated) {
    createTemplateImage();
  }
  
  templateBuffer.loadPixels();
  
  // 文字の輪郭の重要点（単純化のため、外周のサンプリングを使用）
  const keyPoints = [];
  const width = templateBuffer.width;
  const height = templateBuffer.height;
  
  // 1. 文字領域の大まかな境界を特定
  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let y = 0; y < height; y += 5) {
    for (let x = 0; x < width; x += 5) {
      const idx = 4 * (y * width + x);
      if (templateBuffer.pixels[idx + 3] > 0) { // 文字の部分
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  
  // 2. 外周のサンプリングポイントを抽出（文字の形状に沿って）
  // 上部の縁
  for (let x = minX; x <= maxX; x += Math.max(5, Math.floor((maxX - minX) / 10))) {
    for (let y = minY; y <= maxY; y += 5) {
      const idx = 4 * (y * width + x);
      if (templateBuffer.pixels[idx + 3] > 0) {
        keyPoints.push({x, y});
        break; // 最初に見つかった点を追加して次の列へ
      }
    }
  }
  
  // 下部の縁（逆方向に走査）
  for (let x = maxX; x >= minX; x -= Math.max(5, Math.floor((maxX - minX) / 10))) {
    for (let y = maxY; y >= minY; y -= 5) {
      const idx = 4 * (y * width + x);
      if (templateBuffer.pixels[idx + 3] > 0) {
        keyPoints.push({x, y});
        break;
      }
    }
  }
  
  // 左側の縁
  for (let y = minY; y <= maxY; y += Math.max(5, Math.floor((maxY - minY) / 10))) {
    for (let x = minX; x <= maxX; x += 5) {
      const idx = 4 * (y * width + x);
      if (templateBuffer.pixels[idx + 3] > 0) {
        keyPoints.push({x, y});
        break;
      }
    }
  }
  
  // 右側の縁（逆方向に走査）
  for (let y = maxY; y >= minY; y -= Math.max(5, Math.floor((maxY - minY) / 10))) {
    for (let x = maxX; x >= minX; x -= 5) {
      const idx = 4 * (y * width + x);
      if (templateBuffer.pixels[idx + 3] > 0) {
        keyPoints.push({x, y});
        break;
      }
    }
  }
  
  return keyPoints;
}

// 重要ポイントがなぞられたかチェックする関数
function checkKeyPointsCoverage() {
  const keyPoints = identifyKeyPoints();
  const coveredKeyPoints = [];
  
  // ユーザーの線からある距離内にあるキーポイントは「カバーされた」と見なす
  // モバイルではやや広めに取る
  const coverageDistance = isMobileDevice() ? 
                          state.strokeWidth * 3.0 : // モバイルではより広い範囲を許容（2.2→3.0）
                          state.strokeWidth * 1.5;  // PCでの値
  
  for (const point of keyPoints) {
    let covered = false;
    
    // すべてのストロークをチェック
    for (const stroke of state.userStrokes) {
      for (const strokePoint of stroke) {
        // ユーザーの線とキーポイントの距離を計算
        const distance = Math.sqrt(
          Math.pow(strokePoint.x - point.x, 2) + 
          Math.pow(strokePoint.y - point.y, 2)
        );
        
        if (distance <= coverageDistance) {
          covered = true;
          break;
        }
      }
      if (covered) break;
    }
    
    if (covered) {
      coveredKeyPoints.push(point);
    }
  }
  
  // キーポイントのカバレッジ率を計算
  let coverageRate = keyPoints.length > 0 ? (coveredKeyPoints.length / keyPoints.length) * 100 : 0;
  
  // モバイル環境の場合は判定を緩くする補正
  if (isMobileDevice() && coverageRate > 0) {
    coverageRate = Math.min(100, coverageRate * 1.5); // 20%→50%増加
  }
  
  return coverageRate;
}

// 正確さを判定する関数（文字上のなぞり率）
function checkAccuracy() {
  if (!state.templateCreated) {
    createTemplateImage();
  }
  
  let totalPoints = 0;
  let pointsOnTemplate = 0;
  
  // ユーザーの描画ポイントをすべて調べる
  for (let userStroke of state.userStrokes) {
    for (let point of userStroke) {
      totalPoints++;
      
      // ポイントがテンプレート上にあるか確認
      // モバイルではより広い範囲をチェック
      if (isMobileDevice()) {
        // モバイルデバイスの場合、点の周辺もチェック
        const checkRadius = 3; // ピクセル単位で周辺もチェック
        let isOnTemplate = false;
        
        // 点の周辺もチェック
        for (let offsetY = -checkRadius; offsetY <= checkRadius; offsetY++) {
          for (let offsetX = -checkRadius; offsetX <= checkRadius; offsetX++) {
            let pixelColor = templateBuffer.get(point.x + offsetX, point.y + offsetY);
            if (pixelColor[3] > 0) { // アルファ値をチェック
              isOnTemplate = true;
              break;
            }
          }
          if (isOnTemplate) break;
        }
        
        if (isOnTemplate) {
          pointsOnTemplate++;
        }
      } else {
        // PC環境では通常のチェック
        let pixelColor = templateBuffer.get(point.x, point.y);
        if (pixelColor[3] > 0) { // アルファ値をチェック
          pointsOnTemplate++;
        }
      }
    }
  }
  
  // 文字の中を通ったポイントの割合を計算
  const onTemplateRatio = totalPoints > 0 ? (pointsOnTemplate / totalPoints) : 0;
  
  // 正確さを計算 (0-100の範囲)
  // モバイルでは閾値を下げる（50%以上→40%以上）
  const threshold = isMobileDevice() ? 40 : 60;
  const multiplier = 100 / threshold;
  
  return Math.min(100, Math.floor(onTemplateRatio * multiplier * 100));
}

// カバレッジ計算（文字のどれだけをなぞれたか）
function calculateCoverage() {
  if (!state.templateCreated) {
    createTemplateImage();
  }
  
  // テンプレートの文字部分の総ピクセル数をカウント
  templateBuffer.loadPixels();
  let totalTemplatePixels = 0;
  
  for (let i = 0; i < templateBuffer.pixels.length; i += 4) {
    if (templateBuffer.pixels[i+3] > 0) { // アルファ値が0より大きいピクセル
      totalTemplatePixels++;
    }
  }
  
  // ユーザーがなぞった文字部分をカウント
  // 簡易的にするため、ユーザーの描画ポイントから一定範囲内のピクセルをカバーしたと見なす
  let coveredPixels = new Set();
  // モバイルではストローク幅をやや広めに取る
  const radius = isMobileDevice() ? state.strokeWidth * 1.2 : state.strokeWidth / 2;
  
  for (let userStroke of state.userStrokes) {
    for (let point of userStroke) {
      // ポイントの周囲のピクセルをカバー済みとしてマーク
      for (let y = Math.max(0, Math.floor(point.y - radius)); y <= Math.min(height-1, Math.floor(point.y + radius)); y++) {
        for (let x = Math.max(0, Math.floor(point.x - radius)); x <= Math.min(width-1, Math.floor(point.x + radius)); x++) {
          // (x,y)の位置のピクセルがテンプレート上にあるか確認
          let idx = 4 * (y * templateBuffer.width + x);
          if (idx < templateBuffer.pixels.length && templateBuffer.pixels[idx+3] > 0) {
            coveredPixels.add(`${x},${y}`); // カバーしたピクセルを記録
          }
        }
      }
    }
  }
  
  // カバレッジ率を計算
  const coverage = totalTemplatePixels > 0 ? (coveredPixels.size / totalTemplatePixels) : 0;
  
  // モバイル環境の場合は加点する
  const coverageScore = Math.min(100, Math.floor(coverage * 100));
  
  return coverageScore;
}

// // 子供向けに改善した判定関数を修正
// function calculateFriendlyScore() {
//   // 従来の指標
//   let accuracyScore = checkAccuracy();    // はみ出さずに書けたか
//   let coverageScore = calculateCoverage(); // 文字全体をなぞれたか
//   let keyPointsScore = checkKeyPointsCoverage(); // 重要ポイントをなぞれたか
  
//   console.log(`判定前の生スコア - 精度:${accuracyScore.toFixed(1)}, カバー:${coverageScore.toFixed(1)}, キーポイント:${keyPointsScore.toFixed(1)}`);
  
//   // モバイル環境では判定を適切に調整
//   if (isMobileDevice()) {
//     // モバイルでは判定を大きく緩和
//     accuracyScore = Math.min(100, accuracyScore * 1.5);  // 50%増加
//     coverageScore = Math.min(100, coverageScore * 1.5);  // 50%増加
//     keyPointsScore = Math.min(100, keyPointsScore * 1.5); // 50%増加
//   }

//   // 単純な文字や数字に対する補正を強化
//   if (state.currentCategory === 'numbers' || 
//     ['一', '二', '三', 'イ', 'ー'].includes(state.currentChar)) {
//   // 単純な形状の文字は特に評価を緩くする
//   keyPointsScore = Math.min(100, keyPointsScore * 1.5);
//   coverageScore = Math.min(100, coverageScore * 1.3);
//   }

  
//   // ひらがな・カタカナも適切に
//   let finalScore = Math.floor(
//     accuracyScore * 0.25 + 
//     coverageScore * 0.3 + 
//     keyPointsScore * 0.45
//   );
  
//   // モバイル環境でも過剰な加点はしない
//   if (isMobileDevice()) {
//     finalScore = Math.min(100, finalScore + 15); // 加点を10→15に増加
//   }
  
//   console.log(`最終スコア: ${finalScore}`);
//   return finalScore;
// }
// 改善された採点ロジック
function calculateImprovedScore() {
  if (!state.templateCreated) {
    createTemplateImage();
  }
  
  // 1. ユーザーが描いた部分を取得
  const userDrawn = createUserDrawnBuffer();
  
  // 2. 重要度マップを作成（文字の重要な部分ほど高い値）
  const importanceMap = createImportanceMap();
  
  // 3. スコア計算
  let totalScore = 0;
  let possibleScore = 0;
  
  // キャンバス全体をスキャン
  importanceMap.loadPixels();
  userDrawn.loadPixels();
  
  // 重要度マップの各ピクセルをチェック
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = 4 * (y * width + x);
      
      // 重要度（0-255）を取得
      const importance = importanceMap.pixels[idx + 0]; // R値を重要度として使用
      
      if (importance > 0) {
        possibleScore += importance;
        
        // ユーザーがこのピクセルを描いたか確認
        if (userDrawn.pixels[idx + 3] > 0) {
          totalScore += importance;
        }
      }
    }
  }
  
  // 正規化して0-100のスコアに変換
  let finalScore = Math.round((totalScore / possibleScore) * 100);
  
  // 文字種別によるボーナス
  if (state.currentCategory === 'numbers') {
    // 数字は特にシンプルなのでボーナス
    finalScore = Math.min(100, Math.round(finalScore * 1.25));
  }
  
  // デバイスタイプによるボーナス
  if (isMobileDevice()) {
    // モバイルは操作が難しいのでボーナス
    finalScore = Math.min(100, Math.round(finalScore * 1.2));
  }
  
  // とても簡単な文字に特別ボーナス
  const simpleChars = ['一', 'ー', 'イ', '1', 'l', '|'];
  if (simpleChars.includes(state.currentChar)) {
    finalScore = Math.min(100, Math.round(finalScore * 1.3));
  }
  
  // 子供向けにスコアを調整（低すぎる点数にならないよう調整）
  finalScore = Math.max(20, finalScore);
  
  console.log(`新採点システム - スコア: ${finalScore}`);
  return finalScore;
}

// ユーザーの描画をバッファに変換
function createUserDrawnBuffer() {
  const buffer = createGraphics(width, height);
  buffer.background(255, 0); // 透明背景
  
  // ユーザーの描画を再現
  for (let userStroke of state.userStrokes) {
    if (userStroke.length > 0) {
      buffer.push();
      buffer.stroke(0); // 黒で統一
      buffer.strokeWeight(state.strokeWidth * 1.2); // 少し太めに
      buffer.noFill();
      buffer.beginShape();
      for (let point of userStroke) {
        buffer.vertex(point.x, point.y);
      }
      buffer.endShape();
      buffer.pop();
    }
  }
  
  return buffer;
}

// 文字の重要度マップを作成
function createImportanceMap() {
  const buffer = createGraphics(width, height);
  buffer.background(0, 0); // 透明な黒背景
  
  // Y位置の調整（メイン表示と同じ）
  let yPosition = isMobileDevice() ? buffer.height * 0.3 : buffer.height * 0.45;
  
  // 数字の場合は専用処理
  if (state.currentCategory === 'numbers') {
    // 数字用の重要度マップ
    createNumberImportanceMap(buffer, yPosition);
  } else {
    // ひらがな・カタカナ用の処理
    buffer.push();
    buffer.fill(100); // グレーで基本の重要度を表現
    buffer.stroke(180);
    buffer.strokeWeight(10);
    buffer.textSize(min(width, height) * 0.7);
    buffer.textAlign(CENTER, CENTER);
    buffer.text(state.currentChar, buffer.width/2, yPosition);
    
    // 文字の輪郭部分をより重要に
    buffer.noFill();
    buffer.stroke(255); // 白（最重要）
    buffer.strokeWeight(4);
    buffer.text(state.currentChar, buffer.width/2, yPosition);
    buffer.pop();
  }
  
  return buffer;
}

// 数字用の重要度マップ
function createNumberImportanceMap(buffer, yPosition) {
  const centerX = buffer.width / 2;
  const centerY = yPosition;
  const size = min(width, height) * 0.6;
  
  buffer.push();
  
  switch(state.currentChar) {
    case '1':
      // 縦線を強調
      buffer.stroke(255);
      buffer.strokeWeight(15);
      buffer.line(centerX, centerY - size * 0.4, centerX, centerY + size * 0.4);
      break;
      
    case '0':
      // 丸を強調
      buffer.stroke(255);
      buffer.strokeWeight(15);
      buffer.noFill();
      buffer.ellipse(centerX, centerY, size * 0.6, size * 0.8);
      break;
      
    // 他の数字も同様に特殊処理
      
    default:
      // その他の数字はテキストベース
      buffer.fill(150);
      buffer.stroke(255);
      buffer.strokeWeight(8);
      buffer.textSize(min(width, height) * 0.7);
      buffer.textAlign(CENTER, CENTER);
      buffer.text(state.currentChar, centerX, centerY);
  }
  
  buffer.pop();
  return buffer;
}

// 子供向けに改善した判定関数
function calculateFriendlyScore() {
  // 従来の指標
  let accuracyScore = checkAccuracy();    // はみ出さずに書けたか
  let coverageScore = calculateCoverage(); // 文字全体をなぞれたか
  let keyPointsScore = checkKeyPointsCoverage(); // 重要ポイントをなぞれたか
  
  console.log(`判定前の生スコア - 精度:${accuracyScore.toFixed(1)}, カバー:${coverageScore.toFixed(1)}, キーポイント:${keyPointsScore.toFixed(1)}`);
  
  // ストロークがほとんどない場合は低スコアにする
  if (state.userStrokes.length < 2) {
    const strokePoints = state.userStrokes.reduce((total, stroke) => total + stroke.length, 0);
    if (strokePoints < 10) {
      console.log("ストロークが少なすぎます: " + strokePoints);
      return 10; // ほとんど書いていない場合は低スコア
    }
  }
  
  // 数字の場合はスコアを適度に調整
  if (state.currentCategory === 'numbers') {
    // 数字は適度なボーナスを付与
    accuracyScore = Math.min(100, accuracyScore * 1.3);  // 30%増加
    coverageScore = Math.min(100, coverageScore * 1.4);  // 40%増加
    keyPointsScore = Math.min(100, keyPointsScore * 1.5); // 50%増加
    
    // 特に「1」と「0」は特別ボーナス
    if (state.currentChar === '1' || state.currentChar === '0') {
      keyPointsScore = Math.min(100, keyPointsScore * 1.2); // さらに20%増加
    }
    
    // 配分も調整
    let finalScore = Math.floor(
      accuracyScore * 0.25 + 
      coverageScore * 0.35 + 
      keyPointsScore * 0.4
    );
    
    // 最低スコアを設定（低すぎないが高すぎない値に）
    finalScore = Math.max(20, Math.min(90, finalScore));
    
    console.log(`数字の最終スコア: ${finalScore}`);
    return finalScore;
  } else if (state.currentCategory === 'hiragana') {
    // ひらがなは特に難しいので大幅なボーナス
    accuracyScore = Math.min(100, accuracyScore * 1.3);  // 30%増加
    coverageScore = Math.min(100, coverageScore * 1.6);  // 60%増加
    keyPointsScore = Math.min(100, keyPointsScore * 1.7); // 70%増加
    
    // 配分も調整（キーポイントの比重を下げる）
    let finalScore = Math.floor(
      accuracyScore * 0.3 + 
      coverageScore * 0.5 + 
      keyPointsScore * 0.2
    );
    
    // 最低点を設定
    finalScore = Math.max(20, finalScore);
    
    console.log(`ひらがなの最終スコア: ${finalScore}`);
    return finalScore;
  } else if (state.currentCategory === 'katakana') {
    // カタカナも難しいのでボーナス
    accuracyScore = Math.min(100, accuracyScore * 1.2);  // 20%増加
    coverageScore = Math.min(100, coverageScore * 1.5);  // 50%増加
    keyPointsScore = Math.min(100, keyPointsScore * 1.6); // 60%増加
    
    let finalScore = Math.floor(
      accuracyScore * 0.3 + 
      coverageScore * 0.45 + 
      keyPointsScore * 0.25
    );
    
    // 最低点を設定
    finalScore = Math.max(20, finalScore);
    
    console.log(`カタカナの最終スコア: ${finalScore}`);
    return finalScore;
  }
  
  // どのカテゴリにも当てはまらない場合（念のため）
  let finalScore = Math.floor(
    accuracyScore * 0.25 + 
    coverageScore * 0.3 + 
    keyPointsScore * 0.45
  );
  
  // モバイル環境でも過剰な加点はしない
  if (isMobileDevice()) {
    finalScore = Math.min(100, finalScore + 15); // 加点を15に
  }
  
  console.log(`その他カテゴリの最終スコア: ${finalScore}`);
  return finalScore;
}


// 評価表示の基準緩和版
function showFriendlyFeedback() {
  if (!state.showAccuracy) return;
  
  // 評価のレベルに応じた設定
  let emoji, message, color;
  
  // 評価を適切に分ける - 基準を大幅に緩和
  const actualScore = state.accuracy;
  const isMobile = isMobileDevice();
  
  // モバイル向けに特に緩和した基準
  if (isMobile) {
    // モバイルではさらに基準を下げる
    if (actualScore >= 45) {  // 50→45に下げる
      emoji = '⭐⭐⭐';
      message = 'すごい！';
      color = '#4CAF50'; // 緑
      playSuccessSound();
    } else if (actualScore >= 20) {  // 25→20に下げる
      emoji = '⭐⭐';
      message = 'がんばったね！';
      color = '#FFC107'; // 黄色
      playGoodSound();
    } else {
      emoji = '⭐';
      message = 'もう一度チャレンジ！';
      color = '#FF5722'; // オレンジ
      playTryAgainSound();
    }
  } else {
    // PC向けの基準（前回の調整通り）
    if (actualScore >= 50) {
      emoji = '⭐⭐⭐';
      message = 'すごい！';
      color = '#4CAF50'; // 緑
      playSuccessSound();
    } else if (actualScore >= 25) {
      emoji = '⭐⭐';
      message = 'がんばったね！';
      color = '#FFC107'; // 黄色
      playGoodSound();
    } else {
      emoji = '⭐';
      message = 'もう一度チャレンジ！';
      color = '#FF5722'; // オレンジ
      playTryAgainSound();
    }
  }
  
  // DOM要素に判定結果を表示（以下は変更なし）
  const resultDisplay = document.getElementById('result-display');
  if (!resultDisplay) {
    console.error('結果表示要素が見つかりません');
    return;
  }
  
  // コンテンツを設定
  resultDisplay.innerHTML = `${emoji}<br>${message}`;
  resultDisplay.style.color = color;
  
  // 既存のトランジションやアニメーションをキャンセル
  resultDisplay.style.transition = 'none';
  resultDisplay.classList.remove('pop-in');
  
  // 強制的にリフローを発生させる
  void resultDisplay.offsetWidth;
  
  // トランジションとアニメーションを再設定
  resultDisplay.style.transition = 'opacity 0.3s ease';
  resultDisplay.style.opacity = '1';
  resultDisplay.classList.add('pop-in');
  
  // 固定位置を維持するために直接スタイルを設定
  resultDisplay.style.top = '50%';
  resultDisplay.style.left = '50%';
  
  // 2秒後に自動的に消える
  setTimeout(() => {
    if (resultDisplay) {
      resultDisplay.style.opacity = '0';
    }
  }, 2000);
}

// 表示する文字を更新
function updateDisplayChar() {
  background(255);
  
  // すべてのカテゴリでKleeフォントを使用
  push();
  // スマホの場合は文字サイズを大きくする
  let textSizeValue = isMobileDevice() ? min(width, height) * 0.8 : min(width, height) * 0.7;
  textSize(textSizeValue);
  textAlign(CENTER, CENTER);
  textFont('Klee One'); // Kleeフォントを使用
  fill(220, 220, 220); // 透明度なしの薄いグレー
  
  // Y位置をさらに上に調整（キャンバスの30%の位置に配置）
  let yPosition = isMobileDevice() ? height * 0.3 : height * 0.45;
  text(state.currentChar, width/2, yPosition);
  pop();
  
  // ユーザーの描画を再描画
  for (let userStroke of state.userStrokes) {
    if (userStroke.length > 0) {
      push();
      stroke(userStroke[0].color);
      strokeWeight(userStroke[0].weight);
      noFill();
      beginShape();
      for (let point of userStroke) {
        vertex(point.x, point.y);
      }
      endShape();
      pop();
    }
  }
  
  // フィードバック表示
  if (state.showAccuracy) {
    showFriendlyFeedback();
  }
}

// 判定ボタンの処理
function createCheckButton() {
  const checkButton = document.createElement('button');
  checkButton.className = 'control-btn';
  checkButton.id = 'judge-button'; // IDを追加
  checkButton.innerHTML = '✓ はんてい';
  
  // モバイルでは強調表示
  if (isMobileDevice()) {
    checkButton.style.backgroundColor = '#ff5c5c';
    checkButton.style.fontWeight = 'bold';
    checkButton.style.fontSize = '15px';
    checkButton.style.padding = '10px 20px';
  }
  
  // タッチデバイスかどうかで処理を分ける
  if (isTouchDevice()) {
    checkButton.addEventListener('touchstart', function(event) {
      console.log('はんていボタンタッチ');
      
      // ボタン押下の視覚的フィードバック
      this.style.opacity = '0.7';
      setTimeout(() => { this.style.opacity = '1'; }, 150);
      
      // 判定処理の実行
      executeJudgement();
      
      // イベントの伝播を止めない (preventDefault不使用)
    });
  } else {
    // 従来のクリックイベントリスナー
    checkButton.addEventListener('click', function(event) {
      event.preventDefault();
      console.log('はんていボタンがクリックされました');
      
      // 判定処理の実行
      executeJudgement();
    });
  }
  
  return checkButton;
}

function executeJudgement() {
  console.log('判定処理開始');
  
  // 結果表示要素の確認と再作成
  setupResultDisplay(); // 毎回再作成して確実に表示
  
  const resultDisplay = document.getElementById('result-display');
  if (resultDisplay) {
    resultDisplay.innerHTML = '判定中...';
    resultDisplay.style.color = '#666';
    // トランジションをオフにして即座に表示
    resultDisplay.style.transition = 'none';
    resultDisplay.style.opacity = '1';
    console.log('判定中表示設定完了');
  }
  
  // 文字テンプレートの更新確認
  if (!state.templateCreated) {
    createTemplateImage();
  }
  
  // 新しい判定ロジックで計算 - タイミングを少し長めに
  setTimeout(() => {
    state.accuracy = calculateFriendlyScore();
    console.log(`判定結果: ${state.accuracy}点`);
    state.showAccuracy = true;
    
    // 結果表示の更新
    showFriendlyFeedback();
  }, 400); // 少し長めのタイムアウト
}

// マウスが押された時
function mousePressed() {
  if (isMouseInsideCanvas()) {
    state.isDrawing = true;
    state.userStrokes.push([]);
  }
}

// マウスがドラッグされた時
function mouseDragged() {
  if (state.isDrawing && isMouseInsideCanvas()) {
    let currentStroke = state.userStrokes[state.userStrokes.length - 1];
    
    // 点の情報（位置と描画スタイル）を保存
    currentStroke.push({
      x: mouseX,
      y: mouseY,
      color: state.strokeColor,
      weight: state.strokeWidth
    });
    
    // 線を描画
    push();
    stroke(state.strokeColor);
    strokeWeight(state.strokeWidth);
    
    if (currentStroke.length > 1) {
      let prev = currentStroke[currentStroke.length - 2];
      let curr = currentStroke[currentStroke.length - 1];
      line(prev.x, prev.y, curr.x, curr.y);
    } else if (currentStroke.length === 1) {
      // 単一点の場合は点を描画
      point(mouseX, mouseY);
    }
    
    pop();
  }
}

// マウスが離された時
function mouseReleased() {
  state.isDrawing = false;
}

function touchStarted() {
  // p5.jsのキャンバス内かどうかの判定に戻す
  if (isMouseInsideCanvas()) {
    state.isDrawing = true;
    state.userStrokes.push([]);
    
    // これが重要：タッチイベント処理の開始を記録
    console.log('タッチ描画開始: x=' + touchX + ', y=' + touchY);
    
    // カスタム座標変換は行わない
    return false; // p5.jsのデフォルト動作を防ぐ
  }
  return true; // キャンバス外ではデフォルト動作を許可
}

function touchMoved() {
  if (!state.isDrawing) return true;
  
  // p5.jsが提供するtouchX, touchYを使用
  if (isMouseInsideCanvas()) {
    let currentStroke = state.userStrokes[state.userStrokes.length - 1];
    
    // 点の情報を保存（p5.jsの座標系を使用）
    currentStroke.push({
      x: mouseX,
      y: mouseY,
      color: state.strokeColor,
      weight: state.strokeWidth
    });
    
    // 線を描画
    push();
    stroke(state.strokeColor);
    strokeWeight(state.strokeWidth);
    
    if (currentStroke.length > 1) {
      let prev = currentStroke[currentStroke.length - 2];
      let curr = currentStroke[currentStroke.length - 1];
      line(prev.x, prev.y, curr.x, curr.y);
    }
    
    pop();
    
    return false; // p5.jsのデフォルト動作を防ぐ
  }
  
  return true; // キャンバス外ではデフォルト動作を許可
}


// タッチエンド - p5.jsのタッチイベント
function touchEnded() {
  // 描画モードを必ず終了
  state.isDrawing = false;
  console.log('タッチ描画終了');
  
  // デフォルト動作を許可
  return true;
}

// キャンバス内にタッチ/マウスがあるかチェック - 修正版
function isMouseInsideCanvas() {
  // p5.jsが提供する座標を使用
  return (
    mouseX >= 0 && 
    mouseX <= width && 
    mouseY >= 0 && 
    mouseY <= height
  );
}

// キャンバスの位置情報を更新する関数 - スクロール位置も考慮
function updateCanvasPosition() {
  const canvas = document.getElementById('defaultCanvas0');
  if (canvas) {
    state.canvasRect = canvas.getBoundingClientRect();
    
    // スクロール位置も記録
    state.scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    state.scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    if (state.debugMode) {
      console.log(`キャンバス位置更新: x=${state.canvasRect.left}, y=${state.canvasRect.top}, スクロール=(${state.scrollX}, ${state.scrollY})`);
    }
  }
}

// 音声読み上げ機能
function speakText(text) {
  if ('speechSynthesis' in window) {
    // iOS Safariでの読み上げ問題対策
    window.speechSynthesis.cancel(); // 既存の読み上げをキャンセル
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    
    console.log('読み上げリクエスト: ' + text);
    
    // 音声を取得（日本語の女性の声があれば選択）
    let voices = window.speechSynthesis.getVoices();
    
    // iOS/Safariでの音声取得問題対策
    if (voices.length === 0) {
      // 音声が読み込めていない場合はタイマーを使って再試行
      setTimeout(function() {
        voices = window.speechSynthesis.getVoices();
        console.log(`利用可能な音声: ${voices.length}個`);
        setVoiceAndSpeak();
      }, 1000);
    } else {
      setVoiceAndSpeak();
    }
    
    function setVoiceAndSpeak() {
      // 利用可能な音声をログ出力
      if (voices.length > 0) {
        console.log('利用可能な音声:');
        voices.forEach((voice, index) => {
          console.log(`${index}: ${voice.name} (${voice.lang})`);
        });
      }
      
      // 優先順位で声を探す
      let selectedVoice = null;
      
      // 1. 日本語の子供向け音声があれば最優先
      selectedVoice = voices.find(voice => 
        voice.lang.includes('ja') && (voice.name.includes('Child') || voice.name.includes('子供')));
      
      // 2. 日本語の女性音声
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => 
          voice.lang.includes('ja') && (voice.name.includes('Female') || voice.name.includes('女性')));
      }
      
      // 3. どれでも日本語音声
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang.includes('ja'));
      }
      
      // 4. どの音声でも
      if (!selectedVoice && voices.length > 0) {
        selectedVoice = voices[0];
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log(`選択された音声: ${selectedVoice.name}`);
      }
      
      // 「ゆっくり解説」風の設定
      utterance.rate = 0.7;  // 少しゆっくり (0.5→0.7)
      utterance.pitch = 1.2; // 高めのピッチ (1.5→1.2)
      utterance.volume = 1.0; // 最大音量
      
      try {
        window.speechSynthesis.speak(utterance);
        console.log('読み上げ開始');
        
        // モバイルでの問題対策: 読み上げ中に画面が切り替わるのを防ぐ
        utterance.onend = function() {
          console.log('読み上げ完了');
        };
        
        utterance.onerror = function(event) {
          console.error('読み上げエラー:', event);
        };
      } catch (e) {
        console.error('音声合成エラー:', e);
      }
    }
  } else {
    console.log('お使いのブラウザは音声合成に対応していません');
    alert('お使いのブラウザは音声合成に対応していません');
  }
}

// 評価結果に応じたサウンド再生
function playSuccessSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    // 明るく高い音（成功）
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // ドの音
    
    // 短い音を連続で鳴らす
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.2);
    
    // 2つ目の音
    setTimeout(() => {
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime); // ミの音
      
      gain2.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain2.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
      
      osc2.start();
      osc2.stop(audioCtx.currentTime + 0.2);
    }, 200);
    
    // 3つ目の音
    setTimeout(() => {
      const osc3 = audioCtx.createOscillator();
      const gain3 = audioCtx.createGain();
      osc3.connect(gain3);
      gain3.connect(audioCtx.destination);
      
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(783.99, audioCtx.currentTime); // ソの音
      
      gain3.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain3.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
      
      osc3.start();
      osc3.stop(audioCtx.currentTime + 0.3);
    }, 400);
  } catch (e) {
    console.log('効果音の再生に失敗しました:', e);
  }
}

function playGoodSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    // 中間の音（まずまず）
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(392.00, audioCtx.currentTime); // ソの音
    
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.3);
    
    // 2つ目の音
    setTimeout(() => {
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(523.25, audioCtx.currentTime); // ドの音
      
      gain2.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain2.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
      
      osc2.start();
      osc2.stop(audioCtx.currentTime + 0.3);
    }, 300);
  } catch (e) {
    console.log('効果音の再生に失敗しました:', e);
  }
}

function playTryAgainSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    // 低めの音（もう一度）
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(329.63, audioCtx.currentTime); // ミの音
    
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.4);
  } catch (e) {
    console.log('効果音の再生に失敗しました:', e);
  }
}

// ウィンドウサイズが変更された時
function windowResized() {
  let canvasWidth, canvasHeight;
  
  if (isMobileDevice()) {
    // モバイル用のサイズ設定（固定値ではなく比率で計算）
    canvasWidth = min(windowWidth - 20, 400);
    canvasHeight = min(windowHeight * 0.6, 400);
  } else {
    // PC用のサイズ設定
    canvasWidth = min(windowWidth - 40, 600);
    canvasHeight = min(windowHeight - 300, 500);
  }
  
  resizeCanvas(canvasWidth, canvasHeight);
  
  // キャンバスの位置情報を更新
  const canvas = document.getElementById('defaultCanvas0');
  if (canvas) {
    state.canvasRect = canvas.getBoundingClientRect();
    console.log(`リサイズ後のキャンバス位置: x=${state.canvasRect.left}, y=${state.canvasRect.top}, 幅=${state.canvasRect.width}, 高さ=${state.canvasRect.height}`);
  }
  
  // テンプレートバッファが存在する場合のみリサイズ
  if (templateBuffer) {
    templateBuffer.resizeCanvas(canvasWidth, canvasHeight);
    state.templateCreated = false; // テンプレートを再作成する必要がある
  }
  
  // UIの再構築も検討
  createUI();
  
  updateDisplayChar();
}

// 結果表示要素のセットアップを改善
function setupResultDisplay() {
  // 既存の要素があれば削除
  let oldResultDisplay = document.getElementById('result-display');
  if (oldResultDisplay) {
    oldResultDisplay.remove();
  }
  
  // sketch-holderを取得
  const sketchHolder = document.getElementById('sketch-holder');
  if (!sketchHolder) {
    console.error('sketch-holderが見つかりません');
    return;
  }
  
  // 結果表示要素を作成
  const resultDisplay = document.createElement('div');
  resultDisplay.id = 'result-display';
  
  // スケッチホルダーに追加
  sketchHolder.appendChild(resultDisplay);
  
  // 絶対に確実にイベントが透過するように
  resultDisplay.style.pointerEvents = 'none';
  
  // その他のスタイル設定
  Object.assign(resultDisplay.style, {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '15px',
    padding: '20px',
    width: '80%',
    maxWidth: '300px',
    textAlign: 'center',
    fontSize: '28px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    zIndex: '1000',
    opacity: '0',
    transition: 'opacity 0.3s ease',
    border: '3px solid #ffb347'
  });
  
  console.log('結果表示エリアを設定しました - タッチイベント透過モード');
}