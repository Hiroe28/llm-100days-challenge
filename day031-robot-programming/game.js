/**
 * ゲームエンジンを管理するファイル
 * ゲームのメインロジック、描画、状態管理などを行う
 */

// キャンバスと2Dコンテキスト
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// グリッドの設定
const GRID_SIZE = 10; // グリッドのマス数
const CELL_SIZE = canvas.width / GRID_SIZE; // マスの大きさ(ピクセル)

// 現在のステージ番号と実行モード
let currentStage = 1;
let currentMode = 'learning';

const sleep = ms => new Promise(res => setTimeout(res, ms));


// ゲームの状態に中断フラグを追加
let gameState = {
  robot: { x: 0, y: 0, direction: 0 }, // 0: 上, 1: 右, 2: 下, 3: 左
  bullets: [],
  enemies: [],
  goal: { x: 0, y: 0 },
  obstacles: [],
  isRunning: false,
  isCleared: false,
  executionSpeed: 500, // 1200 から 400 に変更（より早く）
  pendingAnimations: 0, // アニメーション中のカウンタ
  isAborted: false // 中断フラグを追加
};


// 効果音の設定
let soundSettings = {
    enabled: true,
    volume: 0.2,        // 0.5 から 0.2 へ下げる
    moveVolume: 0.2,     // 0.3 から 0.2 へ下げる
    turnVolume: 0.2,     // 0.3 から 0.2 へ下げる
    shootVolume: 0.3,    // 0.5 から 0.3 へ下げる
    enemyVolume: 0.3,    // 0.6 から 0.3 へ下げる
    clearVolume: 0.4     // 0.8 から 0.4 へ下げる
  };

// WebAudio API用のコンテキスト
let audioContext = null;

// Blocklyワークスペース
let workspace;


/**
 * ゲームを初期化する関数
 */
function initGame() {
  // 最初のステージを設定
  loadStageData(currentStage);
  
  // 画面を描画
  drawGame();
  
  // Blocklyを初期化
  initBlockly();
  
  // 効果音を初期化
  initAudio();
  
  // イベントリスナーを設定
  setupEventListeners();
  
  // ステージ情報を表示
  updateStageInfo(currentStage);
  
  // ウィンドウリサイズ時の調整
  window.addEventListener('resize', onResize);
  
  // Blocklyの初期化が完了するまで少し待ってからリサイズを実行
  setTimeout(function() {
    onResize();
  }, 500);
}
/**
 * Blocklyを初期化する関数
 */
function initBlockly() {
  console.log('Blockly初期化開始');
  
  // 要素の取得
  const blocklyDiv = document.getElementById('blocklyDiv');
  const blocklyArea = document.getElementById('blocklyArea');
  
  if (!blocklyDiv) {
    console.error('blocklyDiv要素が見つかりません');
    return;
  }
  
  if (!blocklyArea) {
    console.error('blocklyArea要素が見つかりません');
    return;
  }
  
  // ステージデータからツールボックスを作成
  const stageData = stageConfig[currentStage];
  if (!stageData) {
    console.error('ステージデータが見つかりません');
    return;
  }
  
  const toolboxXml = generateToolboxXml(stageData.availableBlocks);
  
  // 既存のWorkspaceがあれば破棄
  if (workspace) {
    try {
      workspace.dispose();
      workspace = null; // 明示的にnullに設定
    } catch (e) {
      console.error('既存ワークスペース破棄エラー:', e);
    }
  }
  
  try {
    const toolboxDom = Blockly.utils.xml.textToDom(toolboxXml);
    
    // Blocklyを初期化（グローバル変数を使用）
    workspace = Blockly.inject('blocklyDiv', {
      toolbox: toolboxDom,
      scrollbars: true,
      trashcan: true,
      media: 'media/', // メディアパスを明示的に指定
    });
    
    console.log('Blockly初期化成功');
    
    // スタートブロックを追加
    setTimeout(function() {
      try {
        if (workspace && !hasStartBlock(workspace)) {
          const startBlock = workspace.newBlock('robot_start');
          startBlock.initSvg();
          startBlock.render();
          startBlock.moveBy(50, 50);
          console.log('スタートブロック追加成功');
        }
      } catch (e) {
        console.error('スタートブロック追加エラー:', e);
      }
    }, 500);
    
  } catch (e) {
    console.error('Blockly初期化エラー詳細:', e);
  }
  
  // リサイズイベントの設定
  function resizeBlockly() {
    try {
      if (!workspace || !workspace.getMetrics) {
        console.warn('ワークスペースが初期化されていないためリサイズをスキップします');
        return;
      }
      
      const rect = blocklyArea.getBoundingClientRect();
      
      blocklyDiv.style.position = 'absolute';
      blocklyDiv.style.top = '0';
      blocklyDiv.style.left = '0';
      blocklyDiv.style.width = rect.width + 'px';
      blocklyDiv.style.height = rect.height + 'px';
      
      console.log('Blocklyサイズ調整:', rect.width, 'x', rect.height);
      
      // Blocklyに通知
      Blockly.svgResize(workspace);
    } catch (e) {
      console.error('リサイズエラー:', e);
    }
  }
  
  // 初回サイズ調整は少し遅延させる
  setTimeout(resizeBlockly, 500);
  
  // リサイズイベントの設定
  window.addEventListener('resize', resizeBlockly);
  // タッチ最適化設定を呼び出す
  // setTimeout(setupTouchOptimization, 1000);

// Blocklyのモバイル設定
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
  // スマホ向け設定を適用
  const options = {
    toolbox: toolboxDom,
    scrollbars: true,
    trashcan: true,
    zoom: {
      controls: true,
      wheel: false,
      startScale: 1.1,  // やや大きめに表示
      maxScale: 2.0,
      minScale: 0.7,
      scaleSpeed: 1.1
    },
    grid: {
      spacing: 40,
      length: 10,
      colour: '#ccc',
      snap: true
    },
    move: {
      scrollbars: true,
      drag: true,
      wheel: false
    },
    media: 'media/',
  };
  
  workspace = Blockly.inject('blocklyDiv', options);
  
  // スナップ感度を上げる（ブロックが近づいたときにくっつきやすくする）
  Blockly.SNAP_RADIUS = 45;  // デフォルトは25
} else {
  // 通常のPC向け設定
  workspace = Blockly.inject('blocklyDiv', {
    toolbox: toolboxDom,
    scrollbars: true,
    trashcan: true,
    media: 'media/',
  });
}

  
}
/**
 * ウィンドウリサイズ時の調整
 */
function onResize() {
  // BlocklyエリアのサイズにBlocklyDivを合わせる
  const blocklyArea = document.getElementById('blocklyArea');
  const blocklyDiv = document.getElementById('blocklyDiv');
  
  if (blocklyArea && blocklyDiv) {
    // 位置とサイズを計算
    const rect = blocklyArea.getBoundingClientRect();
    blocklyDiv.style.left = rect.left + 'px';
    blocklyDiv.style.top = rect.top + 'px';
    blocklyDiv.style.width = rect.width + 'px';
    blocklyDiv.style.height = rect.height + 'px';
    
    // workspaceが存在し、かつ初期化されていることを確認してからリサイズ
    if (workspace && workspace.getMetrics) {
      Blockly.svgResize(workspace);
    }
  }
}

/**
 * ステージデータをロードする関数
 * @param {number|string} stageId ステージID
 */
function loadStageData(stageId) {
  const stageData = stageConfig[stageId];
  if (!stageData) return;
  
  // ゲーム状態をリセット
  gameState.robot = { ...stageData.robot };
  gameState.enemies = JSON.parse(JSON.stringify(stageData.enemies));
  gameState.goal = { ...stageData.goal };
  gameState.obstacles = JSON.parse(JSON.stringify(stageData.obstacles));
  gameState.bullets = [];
  gameState.isRunning = false;
  gameState.isCleared = false;
  gameState.pendingAnimations = 0;
}

/**
 * イベントリスナーを設定する関数
 */
function setupEventListeners() {
  // 実行ボタン
  document.getElementById('runButton').addEventListener('click', runCode);
  
  // リセットボタン
  document.getElementById('resetButton').addEventListener('click', function() {
    resetGame(currentMode === 'learning' ? currentStage : 'free');
  });
  
  // 次のステージボタン
  document.getElementById('nextStageButton').addEventListener('click', goToNextStage);
  
  // 前のステージボタン
  document.getElementById('prevStageBtn').addEventListener('click', function() {
    if (currentMode === 'learning' && currentStage > 1) {
      changeStage(currentStage - 1);
    }
  });
  
  // 次のステージボタン（ナビゲーション）
  document.getElementById('nextStageBtn').addEventListener('click', function() {
    if (currentMode === 'learning' && currentStage < MAX_STAGE) {
      changeStage(currentStage + 1);
    }
  });
  
  // ヒントを表示するボタン
  document.getElementById('showHintBtn').addEventListener('click', toggleHint);
  
  // ヘルプを閉じるボタン
  document.getElementById('closeHelpBtn').addEventListener('click', function() {
    document.getElementById('helpOverlay').style.display = 'none';
  });
  
  // 学習モードボタン
  document.getElementById('learningModeBtn').addEventListener('click', function() {
    if (currentMode !== 'learning') {
      currentMode = 'learning';
      document.getElementById('learningModeBtn').classList.add('active');
      document.getElementById('freeModeBtn').classList.remove('active');
      changeStage(currentStage);
    }
  });
  
  // 自由モードボタン
  document.getElementById('freeModeBtn').addEventListener('click', function() {
    if (currentMode !== 'free') {
      currentMode = 'free';
      document.getElementById('freeModeBtn').classList.add('active');
      document.getElementById('learningModeBtn').classList.remove('active');
      changeStage('free');
    }
  });
  
  // 音量設定ボタン
  document.getElementById('soundBtn').addEventListener('click', toggleSoundSettings);
  
  // 音量設定パネルのイベント
  document.getElementById('soundEnabledCheckbox').addEventListener('change', function() {
    soundSettings.enabled = this.checked;
    saveSettings();
  });
  
  document.getElementById('volumeSlider').addEventListener('input', function() {
    soundSettings.volume = parseFloat(this.value);
    document.getElementById('volumeValue').textContent = Math.round(this.value * 100) + '%';
    saveSettings();
  });
  
  document.getElementById('testSoundBtn').addEventListener('click', playTestSounds);
  
  document.getElementById('closeSoundBtn').addEventListener('click', function() {
    document.getElementById('soundSettingsPanel').style.display = 'none';
  });
  
  // 設定のロード
  loadSettings();
}
/**
 * ステージを変更する関数
 * @param {number|string} stageId ステージID
 */
function changeStage(stageId) {
  if (gameState.isRunning) return; // 実行中はステージ変更不可
  
  // 現在のステージを更新
  if (stageId !== 'free') {
    currentStage = parseInt(stageId);
  }
  
  // ステージ情報を表示
  updateStageInfo(stageId);
  
  // ゲームをリセット
  resetGame(stageId);
  
  // Blocklyのワークスペースをクリア
  if (workspace) {
    try {
      // BlocklyのDOMを完全に再構築
      const blocklyDiv = document.getElementById('blocklyDiv');
      const blocklyArea = document.getElementById('blocklyArea');
      
      if (blocklyDiv && blocklyArea) {
        // 古いBlocklyを削除
        workspace.dispose();
        workspace = null; // 明示的にnullに設定
        blocklyDiv.innerHTML = '';
        
        // 新しいBlocklyを構築
        const stageData = stageConfig[stageId];
        if (!stageData) {
          console.error('ステージデータが見つかりません:', stageId);
          return;
        }
        
        const toolboxXml = generateToolboxXml(stageData.availableBlocks);
        
        try {
          const toolboxDom = Blockly.utils.xml.textToDom(toolboxXml);
          
          // 少し待ってから初期化
          setTimeout(function() {
            try {
              workspace = Blockly.inject(blocklyDiv, {
                toolbox: toolboxDom,
                scrollbars: true,
                trashcan: true,
                sounds: true,
                media: 'media/'
              });
              
              // スタートブロックを追加
              setTimeout(function() {
                if (workspace && !hasStartBlock(workspace)) {
                  var startBlock = workspace.newBlock('robot_start');
                  startBlock.initSvg();
                  startBlock.render();
                  startBlock.moveBy(50, 50);
                  console.log('スタートブロック追加成功');
                }
                
                // サイズを再調整
                if (workspace && workspace.getMetrics) {
                  onResize();
                }
              }, 300);
            } catch (e) {
              console.error('ワークスペース初期化エラー:', e);
            }
          }, 100);
        } catch (e) {
          console.error('ツールボックス解析エラー:', e);
        }
      }
    } catch (e) {
      console.error('ワークスペース再構築エラー:', e);
      // エラーが発生した場合は元のコードを使ってクリアだけ試みる
      try {
        if (workspace) {
          workspace.clear();
          
          // ツールボックスを更新
          updateToolbox(stageId);
          
          // スタートブロックを追加（バックアッププラン）
          setTimeout(function() {
            if (workspace && workspace.getTopBlocks().length === 0) {
              var startBlock = workspace.newBlock('robot_start');
              startBlock.initSvg();
              startBlock.render();
              startBlock.moveBy(50, 50);
            }
          }, 300);
        }
      } catch (e2) {
        console.error('バックアッププランも失敗:', e2);
      }
    }
  }
  
  // ウィンドウリサイズイベントを発火してレイアウトを修正
  // workspace存在確認を入れる
  setTimeout(function() {
    onResize();
  }, 500);
}

/**
 * ステージ情報を更新する関数
 * @param {number|string} stageId ステージID
 */
function updateStageInfo(stageId) {
  const config = stageConfig[stageId];
  if (!config) return;
  
  // ステージタイトル
  const stageTitle = `ステージ${stageId === 'free' ? '' : stageId}: ${config.title}`;
  document.getElementById('stageTitleText').textContent = stageTitle;
  document.getElementById('currentStageText').textContent = stageTitle;
  
  // ステージ説明
  document.getElementById('stageDescriptionText').textContent = config.description;
  
  // ヒントテキスト
  document.getElementById('hintText').textContent = config.hint;
  
  // ヒントを初期状態では非表示に
  document.getElementById('hintContent').style.display = 'none';
  document.getElementById('showHintBtn').textContent = 'ヒントを見る';
}

/**
 * ツールボックスを更新する関数
 * @param {number|string} stageId ステージID
 */
function updateToolbox(stageId) {
  const config = stageConfig[stageId];
  if (!config) return;
  
  // ツールボックスXMLを生成
  const toolboxXml = generateToolboxXml(config.availableBlocks);
  
  try {
    // ツールボックスを更新
    const toolboxDom = Blockly.utils.xml.textToDom(toolboxXml);
    workspace.updateToolbox(toolboxDom);
    
    // 更新後に強制的に再描画
    setTimeout(() => {
      Blockly.svgResize(workspace);
    }, 100);
  } catch (e) {
    console.error('ツールボックス更新エラー:', e);
  }
}

/**
 * ヒント表示の切り替え関数
 */
function toggleHint() {
  const hintContent = document.getElementById('hintContent');
  const showHintBtn = document.getElementById('showHintBtn');
  
  if (hintContent.style.display === 'none') {
    hintContent.style.display = 'block';
    showHintBtn.textContent = 'ヒントを隠す';
  } else {
    hintContent.style.display = 'none';
    showHintBtn.textContent = 'ヒントを見る';
  }
}

/**
 * 音量設定パネルの表示切り替え
 */
function toggleSoundSettings() {
  const panel = document.getElementById('soundSettingsPanel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

/**
 * 効果音設定を保存する
 */
function saveSettings() {
  try {
    localStorage.setItem('robotGameSound', JSON.stringify(soundSettings));
  } catch (e) {
    console.warn('設定の保存に失敗しました', e);
  }
}

/**
 * 効果音設定を読み込む
 */
function loadSettings() {
  try {
    const saved = localStorage.getItem('robotGameSound');
    if (saved) {
      const parsed = JSON.parse(saved);
      soundSettings = { ...soundSettings, ...parsed };
      
      // UIに反映
      document.getElementById('soundEnabledCheckbox').checked = soundSettings.enabled;
      document.getElementById('volumeSlider').value = soundSettings.volume;
      document.getElementById('volumeValue').textContent = Math.round(soundSettings.volume * 100) + '%';
    }
  } catch (e) {
    console.warn('設定の読み込みに失敗しました', e);
  }
}

/**
 * ゲームをリセットする関数
 * @param {number|string} stageId リセットするステージID
 */
function resetGame(stageId = currentMode === 'learning' ? currentStage : 'free') {
  // 実行中の処理を中断
  gameState.isAborted = true;
  gameState.isRunning = false;
  
  // アニメーション中のすべての処理を強制終了
  if (gameState.pendingAnimations > 0) {
    gameState.pendingAnimations = 0;
  }
  
  // 実行中に使用している可能性のあるタイマーをクリア
  clearAllTimeouts();
  
  // 少し待ってから状態をリセット
  setTimeout(() => {
    gameState.isAborted = false;
    
    // ステージデータをロード
    loadStageData(stageId);
    
    // クリアオーバーレイを非表示
    document.getElementById('clearOverlay').style.display = 'none';
    
    // ゲーム画面を描画
    drawGame();
  }, 100);
}

// 実行中のすべてのタイマーをクリアする関数を追加
function clearAllTimeouts() {
  // 実行中のタイマーを全てクリア
  const highestTimeoutId = setTimeout(() => {}, 0);
  for (let i = 0; i < highestTimeoutId; i++) {
    clearTimeout(i);
  }
}

/**
 * ゲーム画面を描画する関数
 */
function drawGame() {
  // 画面をクリア
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // グリッドを描画
  drawGrid();
  
  // 障害物を描画
  drawObstacles();
  
  // ゴールを描画
  drawGoal();
  
  // 敵を描画
  drawEnemies();
  
  // ロボットを描画
  drawRobot();
  
  // 弾を描画
  drawBullets();
}

/**
 * グリッドを描画する関数
 */
function drawGrid() {
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 1;
  
  // 横線
  for (let i = 0; i <= GRID_SIZE; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * CELL_SIZE);
    ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
    ctx.stroke();
  }
  
  // 縦線
  for (let i = 0; i <= GRID_SIZE; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CELL_SIZE, 0);
    ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
    ctx.stroke();
  }
}

/**
 * 障害物を描画する関数
 */
function drawObstacles() {
  ctx.fillStyle = '#777';
  for (const obstacle of gameState.obstacles) {
    ctx.fillRect(
      obstacle.x * CELL_SIZE, 
      obstacle.y * CELL_SIZE, 
      CELL_SIZE, 
      CELL_SIZE
    );
  }
}

/**
 * ゴールを描画する関数
 */
function drawGoal() {
  ctx.fillStyle = '#4caf50';
  ctx.fillRect(
    gameState.goal.x * CELL_SIZE, 
    gameState.goal.y * CELL_SIZE, 
    CELL_SIZE, 
    CELL_SIZE
  );
  
  ctx.fillStyle = 'white';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    'GOAL', 
    gameState.goal.x * CELL_SIZE + CELL_SIZE / 2,
    gameState.goal.y * CELL_SIZE + CELL_SIZE / 2
  );
}

/**
 * 敵を描画する関数
 */
function drawEnemies() {
  for (const enemy of gameState.enemies) {
    const x = enemy.x * CELL_SIZE;
    const y = enemy.y * CELL_SIZE;
    
    // 敵ロボットの体
    ctx.fillStyle = '#f44336';
    ctx.beginPath();
    ctx.arc(
      x + CELL_SIZE / 2, 
      y + CELL_SIZE / 2, 
      CELL_SIZE / 3, 
      0, 
      Math.PI * 2
    );
    ctx.fill();
    
    // 目
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(
      x + CELL_SIZE / 2 - 5, 
      y + CELL_SIZE / 2 - 5, 
      3, 
      0, 
      Math.PI * 2
    );
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(
      x + CELL_SIZE / 2 + 5, 
      y + CELL_SIZE / 2 - 5, 
      3, 
      0, 
      Math.PI * 2
    );
    ctx.fill();
    
    // 口
    ctx.beginPath();
    ctx.arc(
      x + CELL_SIZE / 2, 
      y + CELL_SIZE / 2 + 5, 
      5, 
      0, 
      Math.PI
    );
    ctx.stroke();
  }
}

/**
 * ロボットを描画する関数
 */
function drawRobot() {
  const robotX = gameState.robot.x * CELL_SIZE;
  const robotY = gameState.robot.y * CELL_SIZE;
  
  ctx.save();
  ctx.translate(
    robotX + CELL_SIZE / 2, 
    robotY + CELL_SIZE / 2
  );
  ctx.rotate(gameState.robot.direction * Math.PI / 2);
  
  // ロボットの体
  ctx.fillStyle = '#2196f3';
  ctx.fillRect(-CELL_SIZE / 3, -CELL_SIZE / 3, CELL_SIZE * 2/3, CELL_SIZE * 2/3);
  
  // ロボットの頭
  ctx.beginPath();
  ctx.moveTo(0, -CELL_SIZE / 3);
  ctx.lineTo(CELL_SIZE / 4, -CELL_SIZE / 2);
  ctx.lineTo(-CELL_SIZE / 4, -CELL_SIZE / 2);
  ctx.closePath();
  ctx.fill();
  
  // 目
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(-CELL_SIZE / 6, -CELL_SIZE / 6, 3, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(CELL_SIZE / 6, -CELL_SIZE / 6, 3, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

/**
 * 弾を描画する関数
 */
function drawBullets() {
  ctx.fillStyle = 'yellow';
  for (const bullet of gameState.bullets) {
    ctx.beginPath();
    ctx.arc(
      bullet.x * CELL_SIZE + CELL_SIZE / 2, 
      bullet.y * CELL_SIZE + CELL_SIZE / 2, 
      CELL_SIZE / 6, 
      0, 
      Math.PI * 2
    );
    ctx.fill();
  }
}

/**
 * 前進する関数
 */
async function moveForward() {
  if (gameState.isCleared || gameState.isAborted) return;
  
  const dx = [0, 1, 0, -1]; // 上、右、下、左への移動量(x)
  const dy = [-1, 0, 1, 0]; // 上、右、下、左への移動量(y)
  
  const newX = gameState.robot.x + dx[gameState.robot.direction];
  const newY = gameState.robot.y + dy[gameState.robot.direction];
  
  // 移動先が壁や障害物でないか確認
  if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
    // 障害物チェック
    const isObstacle = gameState.obstacles.some(obs => 
      obs.x === newX && obs.y === newY
    );
    
    // 敵チェック
    const isEnemy = gameState.enemies.some(enemy => 
      enemy.x === newX && enemy.y === newY
    );
    
    if (!isObstacle && !isEnemy) {
      gameState.robot.x = newX;
      gameState.robot.y = newY;
      
      // 移動音再生
      playMoveSound();
      
      // ゴールに到達したかチェック
      checkGoal();
    }
  }
  
  // 画面更新
  drawGame();
  await sleep(gameState.executionSpeed);   // ★描画後に待つ
}

/**
 * 右に回転する関数
 */
async function turnRight() {
  if (gameState.isCleared || gameState.isAborted) return;
  
  gameState.robot.direction = (gameState.robot.direction + 1) % 4;
  
  // 回転音再生
  playTurnSound();
  
  // 画面更新
  drawGame();
  await sleep(gameState.executionSpeed);
}

/**
 * 左に回転する関数
 */
async function turnLeft() {
  if (gameState.isCleared || gameState.isAborted) return;
  
  gameState.robot.direction = (gameState.robot.direction + 3) % 4;
  
  // 回転音再生
  playTurnSound();
  
  // 画面更新
  drawGame();
  await sleep(gameState.executionSpeed); 
}
/**
 * 弾を発射する関数（完全修正版）
 */
async function shoot() {
  if (gameState.isCleared || gameState.isAborted) return;
  
  const dx = [0, 1, 0, -1]; // 上、右、下、左への移動量(x)
  const dy = [-1, 0, 1, 0]; // 上、右、下、左への移動量(y)
  
  // 弾の初期位置（ロボットの位置）と方向
  const bullet = {
    x: gameState.robot.x,
    y: gameState.robot.y,
    direction: gameState.robot.direction,
    steps: 0,
    maxSteps: 10 // 弾の最大飛距離
  };
  
  gameState.bullets.push(bullet);
  
  // 発射音再生
  playShootSound();
  
  // アニメーション中フラグをON
  gameState.pendingAnimations++;
  
  // 弾のアニメーションを開始し、完了を待つ
  return new Promise(resolve => {
    moveBullet(bullet, resolve);
  });
}


// moveBullet 関数を修正（コールバックを正しく処理）
function moveBullet(bullet, callback) {
  // ゲームが中断された場合は即座に終了
  if (gameState.isAborted) {
    gameState.pendingAnimations--;
    if (callback) callback();
    return;
  }
  
  const dx = [0, 1, 0, -1]; // 上、右、下、左への移動量(x)
  const dy = [-1, 0, 1, 0]; // 上、右、下、左への移動量(y)
  
  // 弾を移動
  bullet.x += dx[bullet.direction];
  bullet.y += dy[bullet.direction];
  bullet.steps++;
  
  // 画面更新
  drawGame();
  
  // 画面外に出たか、障害物に当たったか、最大距離に達したかをチェック
  if (
    bullet.x < 0 || bullet.x >= GRID_SIZE || 
    bullet.y < 0 || bullet.y >= GRID_SIZE ||
    bullet.steps >= bullet.maxSteps ||
    gameState.obstacles.some(obs => obs.x === bullet.x && obs.y === bullet.y)
  ) {
    // 弾を削除
    gameState.bullets = gameState.bullets.filter(b => b !== bullet);
    gameState.pendingAnimations--;
    if (callback) callback(); // コールバックを呼び出して完了を通知
    return;
  }
  
  // 敵に当たったかチェック
  const hitEnemyIndex = gameState.enemies.findIndex(
    enemy => enemy.x === bullet.x && enemy.y === bullet.y
  );
  
  if (hitEnemyIndex !== -1) {
    // 敵を削除
    gameState.enemies.splice(hitEnemyIndex, 1);
    
    // 弾を削除
    gameState.bullets = gameState.bullets.filter(b => b !== bullet);
    gameState.pendingAnimations--;
    
    // 敵撃破音再生
    playEnemyDefeatSound();
    
    // すべての敵を倒したらゴールをチェック
    if (gameState.enemies.length === 0) {
      checkGoal();
    }
    
    // 画面更新
    drawGame();
    if (callback) callback(); // コールバックを呼び出して完了を通知
    return;
  }
  
  // 次のアニメーションフレーム
  setTimeout(() => {
    moveBullet(bullet, callback);
  }, 100); // アニメーション速度を速くする（元々は400ms）
}

/**
 * 前に敵がいるかチェックする関数（修正版）
 * @returns {boolean} 敵がいればtrue、いなければfalse
 */
function checkEnemyAhead() {
  const dx = [0, 1, 0, -1]; // 上、右、下、左への移動量(x)
  const dy = [-1, 0, 1, 0]; // 上、右、下、左への移動量(y)
  
  const checkX = gameState.robot.x + dx[gameState.robot.direction];
  const checkY = gameState.robot.y + dy[gameState.robot.direction];
  
  // ちょうど1マス先に敵がいるかチェック
  const enemyAhead = gameState.enemies.some(
    enemy => enemy.x === checkX && enemy.y === checkY
  );
  
  return enemyAhead;
}

/**
 * ゴールに到達したかチェックする関数
 */
function checkGoal() {
  // ゴールに到達し、敵が全て倒されているかチェック
  if (
    gameState.robot.x === gameState.goal.x && 
    gameState.robot.y === gameState.goal.y && 
    gameState.enemies.length === 0
  ) {
    gameState.isCleared = true;
    
    // クリア音再生
    playClearSound();
    
    // クリア演出
    setTimeout(() => {
      document.getElementById('clearOverlay').style.display = 'flex';
      
      // クリアメッセージを設定
      if (currentMode === 'learning') {
        document.getElementById('clearMessageText').textContent = 
          currentStage < MAX_STAGE ? 
          'よくできました！次のステージに進もう！' : 
          'すべてのステージをクリアしました！おめでとう！';
      } else {
        document.getElementById('clearMessageText').textContent = 
          'クリアしました！また別のプログラムも試してみましょう！';
      }
    }, 500);
  }
}

/**
 * 次のステージに進む関数
 */
function goToNextStage() {
  if (currentMode === 'learning') {
    // 学習モードの場合
    if (currentStage < MAX_STAGE) {
      changeStage(currentStage + 1);
    } else {
      alert('すべてのステージをクリアしました！おめでとう！');
      changeStage(1); // 最初のステージに戻る
    }
  } else {
    // 自由モードの場合
    resetGame('free');
    document.getElementById('clearOverlay').style.display = 'none';
  }
}

/**
 * コードを実行する関数
 */
function runCode() {
  // すでに実行中の場合は一度リセット
  if (gameState.isRunning) {
    resetGame(currentMode === 'learning' ? currentStage : 'free');
    setTimeout(() => {
      runCode(); // リセット後に再度実行
    }, 300);
    return;
  }

  // リセット実行
  resetGame(currentMode === 'learning' ? currentStage : 'free');

  // リセット後に少し遅延を入れて実行開始
  setTimeout(() => {
    const code = generateCodeFromWorkspace(workspace);
    if (!code.trim()) { 
      alert('ブロックがありません'); 
      return; 
    }

    gameState.isRunning = true;
    gameState.isAborted = false;

    /* ラップして実行 */
    (async () => {
      try {
        await (new Function(`return (async () => { 
          try {
            ${code} 
            return true;
          } catch(e) {
            console.error("実行エラー：", e);
            if (!gameState.isAborted) {
              alert('実行エラー: ' + e.message);
            }
            return false;
          }
        })()`))();
      } catch (e) {
        console.error("実行ラッパーエラー:", e);
        if (!gameState.isAborted) {
          alert('実行エラー: ' + e.message);
        }
      } finally {
        gameState.isRunning = false;
      }
    })();
  }, 200);
}


/**
 * コードを実行する関数（修正版）
 * @param {string} code 実行するJavaScriptコード
 */
function executeCode(code) {
  // 実行用の関数をラッピング
  const wrappedCode = `(async function() {
    try {
      ${code}
      return "success";
    } catch(e) {
      console.error("実行エラー:", e);
      return e.message;
    }
  })()`;
  
  // 実行
  try {
    eval(wrappedCode)
      .then(result => {
        // すべてのアニメーションが終了するまで待機
        const checkAnimations = () => {
          if (gameState.pendingAnimations > 0) {
            setTimeout(checkAnimations, 100);
          } else {
            gameState.isRunning = false;
            
            if (result !== "success") {
              alert('コードの実行中にエラーが発生しました: ' + result);
            }
          }
        };
        
        checkAnimations();
      })
      .catch(err => {
        console.error('非同期実行エラー:', err);
        gameState.isRunning = false;
        alert('コードの実行中にエラーが発生しました。');
      });
  } catch (e) {
    console.error('コード実行エラー:', e);
    gameState.isRunning = false;
    alert('コードの実行中にエラーが発生しました。ブロックの配置を確認してください。');
  }
}

// レイアウト切り替え機能
function setupLayoutToggle() {
  const toggleBtn = document.getElementById('toggleLayoutBtn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function() {
      const mainArea = document.querySelector('.main-area');
      if (mainArea.classList.contains('vertical-layout')) {
        mainArea.classList.remove('vertical-layout');
      } else {
        mainArea.classList.add('vertical-layout');
      }
      
      // レイアウト変更後にBlocklyをリサイズ
      setTimeout(function() {
        if (workspace && workspace.getMetrics) {
          Blockly.svgResize(workspace);
          onResize();
        }
      }, 300);
    });
  }
}

/**
 * 効果音を初期化する関数
 */
// game.jsの修正
function initAudio() {
  try {
    // AudioContextの作成
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();
    
    // 外部音声ファイル読み込みを試みない
    // エラーハンドリングを追加（元のコードを削除）
  } catch (e) {
    console.warn('Web Audio APIがサポートされていません。効果音は無効です。', e);
  }
}

/**
 * 指定した周波数と長さの音を再生
 * @param {number} frequency 周波数
 * @param {number} duration 長さ（秒）
 * @param {number} volume 音量（0.0～1.0）
 */
function playTone(frequency, duration, volume) {
  if (!audioContext || !soundSettings.enabled) return;
  
  try {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    osc.type = 'sine';
    osc.frequency.value = frequency;
    
    gain.gain.value = volume * soundSettings.volume;
    
    osc.start();
    osc.stop(audioContext.currentTime + duration);
  } catch (e) {
    console.warn('音声再生エラー:', e);
  }
}

/**
 * 動作音を再生
 */
function playMoveSound() {
  playTone(440, 0.1, soundSettings.moveVolume);
}

/**
 * ターン音を再生
 */
function playTurnSound() {
  playTone(330, 0.1, soundSettings.turnVolume);
}

/**
 * 発射音を再生
 */
function playShootSound() {
  if (!audioContext || !soundSettings.enabled) return;
  
  try {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, audioContext.currentTime + 0.2);
    
    gain.gain.setValueAtTime(soundSettings.shootVolume * soundSettings.volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    osc.start();
    osc.stop(audioContext.currentTime + 0.2);
  } catch (e) {
    console.warn('音声再生エラー:', e);
  }
}

/**
 * 敵撃破音を再生
 */
function playEnemyDefeatSound() {
  if (!audioContext || !soundSettings.enabled) return;
  
  try {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, audioContext.currentTime);
    osc.frequency.setValueAtTime(880, audioContext.currentTime + 0.1);
    
    gain.gain.setValueAtTime(soundSettings.enemyVolume * soundSettings.volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    osc.start();
    osc.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    console.warn('音声再生エラー:', e);
  }
}

/**
 * クリア音を再生
 */
function playClearSound() {
  if (!audioContext || !soundSettings.enabled) return;
  
  const notes = [523.25, 659.25, 783.99, 1046.50]; // ド、ミ、ソ、高いド
  
  notes.forEach((freq, i) => {
    setTimeout(() => {
      playTone(freq, 0.2, soundSettings.clearVolume);
    }, i * 150);
  });
}

/**
 * テスト用に全ての効果音を順番に再生
 */
function playTestSounds() {
  if (!soundSettings.enabled) return;
  
  setTimeout(() => playMoveSound(), 0);
  setTimeout(() => playTurnSound(), 300);
  setTimeout(() => playShootSound(), 600);
  setTimeout(() => playEnemyDefeatSound(), 900);
  setTimeout(() => playClearSound(), 1200);
}

// タッチデバイス向け設定を追加
function setupTouchOptimization() {
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    // モバイルデバイスと判断
    if (workspace) {
      // タッチ操作用のスペースを広げる
      Blockly.SNAP_RADIUS = 40; // ブロック同士の接続範囲を広げる
      Blockly.BUMP_DELAY = 250; // ドラッグ時の反応速度調整
      
      // ズーム設定の調整
      workspace.setScale(1.0); // 初期ズームレベル
      workspace.zoomControls_.autoPositionHorizontally_ = true;
    }
  }
}

// ゲームを初期化
window.addEventListener('DOMContentLoaded', initGame);