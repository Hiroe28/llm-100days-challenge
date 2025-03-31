// モバイル用タブ切り替え機能
function setupMobileTabs() {
  const tabs = document.querySelectorAll('.mobile-tab');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      // すべてのタブを非アクティブ化
      tabs.forEach(t => t.classList.remove('active'));
      // クリックされたタブをアクティブ化
      this.classList.add('active');
      
      // タブコンテンツを切り替え
      const tabId = this.getAttribute('data-tab');
      const tabContents = document.querySelectorAll('.mobile-tab-content');
      
      tabContents.forEach(content => {
        content.classList.remove('active');
      });
      
      document.getElementById('mobile-tab-' + tabId).classList.add('active');
    });
  });
}

// モバイル用UIとデスクトップ用UIの同期
function setupMobileSync() {
  // ドーナツ形状ボタンの同期
  document.getElementById('mobile-btn-ring').addEventListener('click', function() {
    document.getElementById('btn-ring').click();
    this.classList.add('active');
    document.getElementById('mobile-btn-jam').classList.remove('active');
  });
  
  document.getElementById('mobile-btn-jam').addEventListener('click', function() {
    document.getElementById('btn-jam').click();
    this.classList.add('active');
    document.getElementById('mobile-btn-ring').classList.remove('active');
  });
  
  // デコレーションツールの同期
  document.getElementById('mobile-btn-spray').addEventListener('click', function() {
    document.getElementById('btn-spray').click();
    setActiveButton('mobile-btn-spray', ['mobile-btn-sprinkles', 'mobile-btn-choco', 'mobile-btn-heart', 'mobile-btn-star']);
    document.getElementById('mobile-spray-settings').style.display = 'block';
    document.getElementById('mobile-topping-settings').style.display = 'none';
  });
  
  document.getElementById('mobile-btn-sprinkles').addEventListener('click', function() {
    document.getElementById('btn-sprinkles').click();
    setActiveButton('mobile-btn-sprinkles', ['mobile-btn-spray', 'mobile-btn-choco', 'mobile-btn-heart', 'mobile-btn-star']);
    document.getElementById('mobile-spray-settings').style.display = 'none';
    document.getElementById('mobile-topping-settings').style.display = 'block';
  });
  
  document.getElementById('mobile-btn-choco').addEventListener('click', function() {
    document.getElementById('btn-choco').click();
    setActiveButton('mobile-btn-choco', ['mobile-btn-spray', 'mobile-btn-sprinkles', 'mobile-btn-heart', 'mobile-btn-star']);
    document.getElementById('mobile-spray-settings').style.display = 'none';
    document.getElementById('mobile-topping-settings').style.display = 'block';
  });
  
  document.getElementById('mobile-btn-heart').addEventListener('click', function() {
    document.getElementById('btn-heart').click();
    setActiveButton('mobile-btn-heart', ['mobile-btn-spray', 'mobile-btn-sprinkles', 'mobile-btn-choco', 'mobile-btn-star']);
    document.getElementById('mobile-spray-settings').style.display = 'none';
    document.getElementById('mobile-topping-settings').style.display = 'block';
  });
  
  document.getElementById('mobile-btn-star').addEventListener('click', function() {
    document.getElementById('btn-star').click();
    setActiveButton('mobile-btn-star', ['mobile-btn-spray', 'mobile-btn-sprinkles', 'mobile-btn-choco', 'mobile-btn-heart']);
    document.getElementById('mobile-spray-settings').style.display = 'none';
    document.getElementById('mobile-topping-settings').style.display = 'block';
  });
  
  // サイズスライダーの同期
  document.getElementById('mobile-tool-size').addEventListener('input', function() {
    document.getElementById('tool-size').value = this.value;
    document.getElementById('tool-size-value').textContent = this.value;
    document.getElementById('mobile-tool-size-value').textContent = this.value;
    toolSize = parseInt(this.value);
  });
  
  document.getElementById('mobile-topping-size').addEventListener('input', function() {
    document.getElementById('topping-size').value = this.value;
    document.getElementById('topping-size-value').textContent = this.value;
    document.getElementById('mobile-topping-size-value').textContent = this.value;
    toppingSize = parseInt(this.value);
  });
  
  // ランダム配置の同期
  document.getElementById('mobile-random-placement').addEventListener('change', function() {
    document.getElementById('random-placement').checked = this.checked;
    randomPlacement = this.checked;
  });
  
  // アクションボタンの同期
  document.getElementById('mobile-btn-undo').addEventListener('click', function() {
    document.getElementById('btn-undo').click();
  });
  
  document.getElementById('mobile-btn-random').addEventListener('click', function() {
    document.getElementById('btn-random').click();
  });
  
  document.getElementById('mobile-btn-reset').addEventListener('click', function() {
    document.getElementById('btn-reset').click();
  });
  
  document.getElementById('mobile-btn-save').addEventListener('click', function() {
    document.getElementById('btn-save').click();
  });
}

// UI要素を設定
function setupUI() {
  // モバイル用タブと同期機能を設定
  setupMobileTabs();
  setupMobileSync();
  
  // ドーナツ形状ボタン
  document.getElementById('btn-ring').addEventListener('click', () => {
    donutShape = 'ring';
    setActiveButton('btn-ring', ['btn-jam']);
    clearPaintLayer(); // ペイントレイヤーをクリア
    drawDonut();
    saveToHistory();
  });
  
  document.getElementById('btn-jam').addEventListener('click', () => {
    donutShape = 'jam';
    setActiveButton('btn-jam', ['btn-ring']);
    clearPaintLayer(); // ペイントレイヤーをクリア
    drawDonut();
    saveToHistory();
  });

  // デコレーションツール
  document.getElementById('btn-spray').addEventListener('click', () => {
    activeTool = 'spray';
    setActiveButton('btn-spray', ['btn-sprinkles', 'btn-choco', 'btn-heart', 'btn-star']);
    document.getElementById('spray-settings').style.display = 'block';
    document.getElementById('topping-settings').style.display = 'none';
  });
  
  document.getElementById('btn-sprinkles').addEventListener('click', () => {
    activeTool = 'sprinkles';
    setActiveButton('btn-sprinkles', ['btn-spray', 'btn-choco', 'btn-heart', 'btn-star']);
    document.getElementById('spray-settings').style.display = 'none';
    document.getElementById('topping-settings').style.display = 'block';
    
    if (randomPlacement) {
      addRandomToppings('sprinkles');
      drawDonut();
      saveToHistory();
    }
  });
  
  document.getElementById('btn-choco').addEventListener('click', () => {
    activeTool = 'choco';
    setActiveButton('btn-choco', ['btn-spray', 'btn-sprinkles', 'btn-heart', 'btn-star']);
    document.getElementById('spray-settings').style.display = 'none';
    document.getElementById('topping-settings').style.display = 'block';
    
    if (randomPlacement) {
      addRandomToppings('choco', 15);
      drawDonut();
      saveToHistory();
    }
  });
  
  document.getElementById('btn-heart').addEventListener('click', () => {
    activeTool = 'heart';
    setActiveButton('btn-heart', ['btn-spray', 'btn-sprinkles', 'btn-choco', 'btn-star']);
    document.getElementById('spray-settings').style.display = 'none';
    document.getElementById('topping-settings').style.display = 'block';
    
    if (randomPlacement) {
      addRandomToppings('heart', 10);
      drawDonut();
      saveToHistory();
    }
  });
  
  document.getElementById('btn-star').addEventListener('click', () => {
    activeTool = 'star';
    setActiveButton('btn-star', ['btn-spray', 'btn-sprinkles', 'btn-choco', 'btn-heart']);
    document.getElementById('spray-settings').style.display = 'none';
    document.getElementById('topping-settings').style.display = 'block';
    
    if (randomPlacement) {
      addRandomToppings('star', 10);
      drawDonut();
      saveToHistory();
    }
  });
  
  // ツールサイズのスライダー設定
  const toolSizeSlider = document.getElementById('tool-size');
  const toolSizeValue = document.getElementById('tool-size-value');
  
  toolSizeSlider.addEventListener('input', (e) => {
    toolSize = parseInt(e.target.value);
    toolSizeValue.textContent = toolSize;
  });
  
  // トッピングサイズのスライダー設定
  const toppingSizeSlider = document.getElementById('topping-size');
  const toppingSizeValue = document.getElementById('topping-size-value');
  
  toppingSizeSlider.addEventListener('input', (e) => {
    toppingSize = parseInt(e.target.value);
    toppingSizeValue.textContent = toppingSize;
  });
  
  // ランダム配置設定
  document.getElementById('random-placement').addEventListener('change', (e) => {
    randomPlacement = e.target.checked;
  });
  
  // 色パレットを作成
  createColorPalette('base-colors', baseColors, (color) => {
    baseColor = color;
    drawDonut();
    saveToHistory();
  });
  
  createColorPalette('icing-colors', icingColors, (color) => {
    icingColor = color;
    drawDonut();
    saveToHistory();
  });
  
  createColorPalette('spray-colors', sprayColors, (color) => {
    sprayColor = color;
  });
  
  // モバイル用の色パレットも作成
  createColorPalette('mobile-base-colors', baseColors, (color) => {
    baseColor = color;
    drawDonut();
    saveToHistory();
  });
  
  createColorPalette('mobile-icing-colors', icingColors, (color) => {
    icingColor = color;
    drawDonut();
    saveToHistory();
  });
  
  createColorPalette('mobile-spray-colors', sprayColors, (color) => {
    sprayColor = color;
  });
  
  // レインボーを初期選択状態にする
  setTimeout(() => {
    const sprayContainers = [
      document.getElementById('spray-colors'),
      document.getElementById('mobile-spray-colors')
    ];
    
    sprayContainers.forEach(container => {
      if (container) {
        const colorOptions = container.querySelectorAll('.color-option');
        
        // 全ての選択状態をクリア
        colorOptions.forEach(option => {
          option.classList.remove('selected');
        });
        
        // レインボーのオプションを見つけて選択状態にする
        colorOptions.forEach(option => {
          // グラデーション背景を持つ要素がレインボー
          if (option.style.background && option.style.background.includes('linear-gradient')) {
            option.classList.add('selected');
          }
        });
      }
    });
  }, 100); // DOMが完全に読み込まれるのを少し待つ
  
  // アクションボタン
  document.getElementById('btn-undo').addEventListener('click', () => {
    if (currentHistoryIndex > 0) {
      restoreFromHistory(currentHistoryIndex - 1);
    }
  });
  
  document.getElementById('btn-random').addEventListener('click', () => {
    createRandomDonut();
    saveToHistory();
  });
  
  document.getElementById('btn-reset').addEventListener('click', () => {
    resetDonut();
    saveToHistory();
  });
  
  document.getElementById('btn-save').addEventListener('click', () => {
    saveDonut();
  });
}

// 色パレットを作成する関数
function createColorPalette(containerId, colors, callback) {
  const container = document.getElementById(containerId);
  if (!container) return; // コンテナが存在しない場合は中止
  
  colors.forEach(color => {
    const element = document.createElement('div');
    element.className = 'color-option';
    
    if (color.value === 'rainbow') {
      // レインボーカラーの場合、グラデーションを設定
      element.style.background = 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)';
      
      // レインボーの場合はデフォルトで選択状態に（sprayColorsの場合のみ）
      if (containerId.includes('spray-colors')) {
        element.classList.add('selected');
      }
    } else {
      element.style.backgroundColor = color.value;
    }
    
    element.title = color.name;
    
    element.addEventListener('click', () => {
      // 選択状態をリセット
      container.querySelectorAll('.color-option').forEach(el => {
        el.classList.remove('selected');
      });
      
      // 選択した色をハイライト
      element.classList.add('selected');
      
      // コールバックを実行
      callback(color.value);
    });
    
    container.appendChild(element);
  });
  
  // デフォルトの色が明示的に選択されていない場合、最初の色を選択状態に
  if (container.querySelector('.selected') === null) {
    const firstOption = container.querySelector('.color-option');
    if (firstOption) {
      firstOption.classList.add('selected');
    }
  }
}

// アクティブボタンを設定する関数
function setActiveButton(activeId, inactiveIds) {
  const activeButton = document.getElementById(activeId);
  if (activeButton) {
    activeButton.classList.add('active');
  }
  
  inactiveIds.forEach(id => {
    const button = document.getElementById(id);
    if (button) {
      button.classList.remove('active');
    }
  });
}

// 色選択の状態を更新
function updateColorSelection(containerId, color) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const elements = container.querySelectorAll('.color-option');
  
  elements.forEach(el => {
    el.classList.remove('selected');
    if (el.style.backgroundColor === color) {
      el.classList.add('selected');
    }
  });
}