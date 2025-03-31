// グローバル変数
let maze;
let pillbug;
let isSimulationRunning = false;

/**
 * p5.js初期化関数
 * 一度だけ実行される
 */
function setup() {
  // キャンバスを作成し、コンテナに配置
  const canvas = createCanvas(800, 600);
  canvas.parent('canvas-container');
  
  // 迷路とダンゴムシを初期化
  maze = new Maze(width, height);
  pillbug = new Pillbug(maze.startPosition, maze);
  
  // UIのイベントリスナー設定
  setupUIEventListeners();
  
  // フレームレートを設定
  frameRate(60);
  
  // コンソールに初期設定を出力（デバッグ用）
  console.log("迷路初期化完了: ", maze);
  console.log("ダンゴムシ初期化完了: ", pillbug);
}

/**
 * p5.js描画関数
 * 毎フレーム実行される
 */
function draw() {
  // 背景を描画
  background(240);
  
  // 迷路とダンゴムシを描画
  maze.display();
  
  // ダンゴムシの更新と描画（初期化が完了している場合のみ）
  if (pillbug) {
    pillbug.update();
    pillbug.display();
  }
  
  // ステータス表示を更新
  updateStatusDisplay();
}

/**
 * UIのイベントリスナーを設定
 */
function setupUIEventListeners() {
// 「開始」ボタン
const startBtn = document.getElementById('start-btn');
if (startBtn) {
  startBtn.addEventListener('click', () => {
    if (!isSimulationRunning) {
      // 開始前に位置を少し調整して確実に動き出せるようにする
      if (pillbug) {
        // 速度をリセットして確実に上に向かうようにする
        pillbug.velocity = createVector(0, -1);
        pillbug.velocity.setMag(pillbug.speed);
        
        // 少し位置を調整
        pillbug.position.y += 5;
        
        // 初期方向設定を再確認（ラジオボタンから）
        const leftRadio = document.getElementById('turn-left');
        pillbug.turnDirection = leftRadio && leftRadio.checked ? 'left' : 'right';
        
        // 開始
        pillbug.start();
        
        // 状態表示の更新
        const directionText = pillbug.turnDirection === 'left' ? '左' : '右';
        document.getElementById('bug-turn-direction').textContent = `次の曲がり方向: ${directionText}`;
      }
      
      isSimulationRunning = true;
      startBtn.textContent = '停止';
      document.getElementById('bug-state').textContent = '移動中';
    } else {
      pillbug.stop();
      isSimulationRunning = false;
      startBtn.textContent = '開始';
      document.getElementById('bug-state').textContent = '停止中';
    }
  });
}
  
// 「リセット」ボタン
const resetBtn = document.getElementById('reset-btn');
if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    if (pillbug) {
      pillbug.reset();
      if (isSimulationRunning) {
        // リセット時に実行中なら自動的に再開
        pillbug.start();
      }
      
      // 選択された方向を表示に反映
      const leftRadio = document.getElementById('turn-left');
      const initialDirection = leftRadio && leftRadio.checked ? '左' : '右';
      document.getElementById('bug-turn-direction').textContent = `次の曲がり方向: ${initialDirection}`;
    }
  });
}

// 方向選択ラジオボタンのイベントリスナー
const turnLeftRadio = document.getElementById('turn-left');
const turnRightRadio = document.getElementById('turn-right');

if (turnLeftRadio && turnRightRadio) {
  turnLeftRadio.addEventListener('change', () => {
    if (!isSimulationRunning) {
      document.getElementById('bug-turn-direction').textContent = '次の曲がり方向: 左';
    }
  });
  
  turnRightRadio.addEventListener('change', () => {
    if (!isSimulationRunning) {
      document.getElementById('bug-turn-direction').textContent = '次の曲がり方向: 右';
    }
  });
}
  
  // 「速度調整」スライダー
  const speedSlider = document.getElementById('speed-slider');
  if (speedSlider) {
    speedSlider.addEventListener('input', () => {
      if (pillbug) {
        pillbug.setSpeed(parseInt(speedSlider.value));
      }
    });
  }
  
  // 「経路表示」トグル
  const showPathToggle = document.getElementById('show-path');
  if (showPathToggle) {
    showPathToggle.addEventListener('change', () => {
      if (pillbug) {
        pillbug.setShowPath(showPathToggle.checked);
      }
    });
  }
}

/**
 * ステータス表示を更新
 */
function updateStatusDisplay() {
  if (!pillbug) return;
  
  const status = pillbug.getStatus();
  const bugTurnDirection = document.getElementById('bug-turn-direction');
  
  if (bugTurnDirection) {
    // ダンゴムシの次の曲がる方向を表示
    bugTurnDirection.textContent = 
      `次の曲がり方向: ${status.nextTurn === 'left' ? '左' : '右'}`;
  }
}

/**
 * ウィンドウサイズ変更時の処理
 */
/**
 * ウィンドウサイズ変更時の処理
 */
function windowResized() {
  // キャンバスコンテナの幅に合わせる
  const container = document.getElementById('canvas-container');
  if (!container) return;
  
  // 最大サイズを制限して安定性を確保
  const maxWidth = 800;
  const maxHeight = 600;
  
  // コンテナのサイズを取得
  const containerWidth = Math.min(container.offsetWidth, maxWidth);
  
  // アスペクト比を保持（4:3）
  const aspectRatio = 4/3;
  const newHeight = Math.min(containerWidth / aspectRatio, maxHeight);
  const newWidth = newHeight * aspectRatio;
  
  // キャンバスをリサイズ
  resizeCanvas(newWidth, newHeight);
  
  // 迷路を再初期化
  maze = new Maze(width, height);
  
  // pillbugが既に初期化されている場合のみresetを呼び出す
  if (pillbug) {
    // 初期方向の保持
    const currentDirection = pillbug.turnDirection;
    
    pillbug.reset();
    pillbug.maze = maze;
    
    // 以前の向きを維持
    pillbug.turnDirection = currentDirection;
    
    // 表示を更新
    const directionText = pillbug.turnDirection === 'left' ? '左' : '右';
    document.getElementById('bug-turn-direction').textContent = `次の曲がり方向: ${directionText}`;
  } else {
    // pillbugが初期化されていない場合は新規作成
    pillbug = new Pillbug(maze.startPosition, maze);
  }
}