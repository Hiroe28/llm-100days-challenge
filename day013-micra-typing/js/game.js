/**
 * ゲームのコア処理とロジックを管理するモジュール
 */
import { GAME_CONFIG, initialGameState } from './config.js';
import { createEnemyMesh, getScreenPosition, removeFromScene, renderScene, hideOriginalModels } from './renderer.js';
import { updateUI, updateEnemyWordDisplay, updateProgressBar, createExplosionEffect, cleanupParticles, showGameOverScreen, togglePauseMessage, showDamageEffect } from './ui.js';
import { playSound, playBGM, pauseBGM } from './sound.js';
import { GAME_ROMAJI, initRomajiInput  } from './input.js';
import { showGameScreen } from './ui.js';  // ファイル上部のimport文に追加

// ゲーム状態
export const GAME_STATE = { ...initialGameState };

// アニメーションのフレーム管理
let animationFrameId = null;

/**
 * ゲーム状態のリセット
 */
export function resetGameState() {
  // 既存のエネミーをクリア
  if (GAME_STATE.enemies) {
    for (const enemy of GAME_STATE.enemies) {
      if (enemy.mesh) removeFromScene(enemy.mesh);
      if (enemy.element) enemy.element.remove();
    }
  }
  
  // パーティクルクリーンアップ
  cleanupParticles();
  
  // オリジナルモデルを非表示
  hideOriginalModels();
  
  // 現在のモードと難易度を保存
  const currentGameMode = GAME_STATE.gameMode;
  const currentDifficulty = GAME_STATE.difficulty;
  
  // 状態をリセット
  Object.assign(GAME_STATE, initialGameState);
  
  // 保存したモードと難易度を復元
  GAME_STATE.gameMode = currentGameMode;
  GAME_STATE.difficulty = currentDifficulty;
  
  // モードに応じた単語リストを適切に設定
  if (GAME_STATE.gameMode === 'hiragana') {
    // ひらがなモードの場合は平仮名単語のみをフィルタリング
    filterHiraganaWords();
  } else {
    // 英語モードの場合は英語（アルファベット）のみの単語をフィルタリング
    let sourceList;
    switch(GAME_STATE.difficulty) {
      case 'easy':
        sourceList = GAME_CONFIG.wordListEasy;
        break;
      case 'normal':
        sourceList = GAME_CONFIG.wordListNormal;
        break;
      case 'hard':
        sourceList = GAME_CONFIG.wordListHard;
        break;
    }
    
    // 修正: 英語（アルファベット）のみの単語をフィルタリング
    GAME_STATE.wordList = sourceList.filter(word => 
      /^[a-zA-Z]+$/.test(word)
    );
  }
  
  console.log(`ゲーム状態をリセットしました（モード: ${GAME_STATE.gameMode}, 難易度: ${GAME_STATE.difficulty}）`);
  
  // UI更新
  updateUI();
}

/**
 * ゲーム開始処理
 */
export function startGame() {
  console.log("ゲーム開始！");
  
  // スタート画面を非表示に
  showGameScreen();  // この行を追加

  // オリジナルモデルを完全に非表示に
  hideOriginalModels();
  
  // ゲーム状態を実行中に
  GAME_STATE.isRunning = true;
  
  // 既存のインターバルがある場合はクリア
  if (GAME_STATE.spawnInterval) {
    clearInterval(GAME_STATE.spawnInterval);
  }
  
  // 既存のエネミーがある場合はクリア
  if (GAME_STATE.enemies.length > 0) {
    for (const enemy of GAME_STATE.enemies) {
      removeFromScene(enemy.mesh);
      if (enemy.element) {
        enemy.element.remove();
      }
    }
    GAME_STATE.enemies = [];
  }
  
  // タイピング状態をリセット
  GAME_STATE.currentTypingEnemy = null;
  GAME_STATE.typedText = '';
  
  // ローマ字入力状態をリセット
  if (GAME_ROMAJI) {
    GAME_ROMAJI.typedRomaji = '';
    GAME_ROMAJI.typedHiragana = '';
    GAME_ROMAJI.targetWord = '';
    GAME_ROMAJI.romajiWord = '';
  }
  
  // タイピング表示をクリア
  const typingDisplay = document.getElementById('typing-display');
  if (typingDisplay) {
    typingDisplay.innerHTML = '';
  }
  
  // 初期状態を設定
  updateUI();
  
  // BGMを再生
  playBGM();
  
  // 最初の黒い人をすぐに出現させる
  setTimeout(() => {
    if (GAME_STATE.isRunning) {
      spawnEnemy();
    }
  }, 1000);
  
  // エンダーマンの定期的な出現
  GAME_STATE.spawnInterval = setInterval(() => {
    if (GAME_STATE.isRunning) {
      spawnEnemy();
      console.log("新しいエネミーを生成");
    }
  }, GAME_CONFIG.spawnInterval / GAME_STATE.difficultyMultiplier);
  
  // アニメーションループの開始
  if (!animationFrameId) {
    animateGame();
  }
}

export function pauseGame() {
    console.log("ゲーム一時停止/再開: 現在の状態=", GAME_STATE.isRunning);
    
    if (GAME_STATE.isRunning) {
      // 実行中→一時停止
      GAME_STATE.isRunning = false;
      clearInterval(GAME_STATE.spawnInterval);
      GAME_STATE.spawnInterval = null; // 重要：nullに設定
      
      // BGMを一時停止
      pauseBGM();
      
      // 一時停止メッセージを表示
      togglePauseMessage(true);
    } else {
      // 一時停止→再開
      GAME_STATE.isRunning = true;
      
      // BGMを再開
      playBGM();
      
      // エネミー生成インターバルを再開
      if (!GAME_STATE.spawnInterval) { // nullチェックを追加
        GAME_STATE.spawnInterval = setInterval(() => {
          if (GAME_STATE.isRunning) {
            spawnEnemy();
          }
        }, GAME_CONFIG.spawnInterval / GAME_STATE.difficultyMultiplier);
      }
      
      // 一時停止メッセージを削除
      togglePauseMessage(false);
      
      // アニメーションがストップしていれば再開
      if (!animationFrameId) {
        animateGame();
      }
    }
  }

/**
 * ゲームオーバー処理
 */
export function gameOver() {
  console.log("ゲームオーバー処理を実行");
  GAME_STATE.isRunning = false;
  
  // ゲームオーバー音を再生
  playSound('gameOver');
  
  // BGMを停止
  pauseBGM();
  
  // インターバルをクリア
  if (GAME_STATE.spawnInterval) {
    clearInterval(GAME_STATE.spawnInterval);
  }
  
  // ゲームオーバー画面を表示
  showGameOverScreen();
}

/**
 * 敵キャラクターの生成
 */
export function spawnEnemy() {
  if (!GAME_STATE.isRunning) {
    console.log("ゲームが実行中ではありません");
    return;
  }
  
  if (GAME_STATE.enemies.length >= GAME_CONFIG.maxEnemies) {
    console.log("最大エネミー数に達しています");
    return;
  }
  
  console.log("新しいエネミーを生成します");
  
  // 3Dモデルを生成
  const enemyData = createEnemyMesh();
  if (!enemyData) return;
  
  // ランダムな単語を選択
  if (GAME_STATE.wordList.length === 0) {
    console.error("単語リストが空です");
    // デフォルトの単語リストにフォールバック
    GAME_STATE.wordList = GAME_CONFIG.wordListNormal;
  }
  
  // 重複防止: 現在表示されている単語と同じ単語を避ける
  let availableWords = [...GAME_STATE.wordList];
  
  // 現在表示されている単語リストを作成
  const displayedWords = GAME_STATE.enemies.map(enemy => enemy.word);
  
  // 現在表示されている単語を除外
  availableWords = availableWords.filter(word => !displayedWords.includes(word));
  
  // 利用可能な単語がない場合は元のリストから選択
  if (availableWords.length === 0) {
    availableWords = GAME_STATE.wordList;
  }
  
  // 選択
  const word = availableWords[Math.floor(Math.random() * availableWords.length)];
  console.log("選択された単語:", word);
  
  // 単語表示用のHTML要素を作成
  const wordElement = document.createElement('div');
  wordElement.className = 'word-container';
  wordElement.textContent = word;
  const gameContainer = document.getElementById('game-container');
  if (gameContainer) {
    gameContainer.appendChild(wordElement);
  }
  
  // エネミーを追加
  const newEnemy = {
    mesh: enemyData.mesh,
    word: word,
    element: wordElement,
    isTyping: false,
    progress: 0,
    startTime: Date.now(),
    type: enemyData.type
  };
  
  GAME_STATE.enemies.push(newEnemy);
  
  console.log(`現在のエネミー数: ${GAME_STATE.enemies.length}`);
  
  // 最初のエネミーの場合、自動的にフォーカス
  if (GAME_STATE.enemies.length === 1 && !GAME_STATE.currentTypingEnemy) {
    GAME_STATE.currentTypingEnemy = newEnemy;
    newEnemy.isTyping = true;
    
    // フォーカスクラスを追加
    if (newEnemy.element) {
      newEnemy.element.classList.add('focused');
    }
  }
}

/**
 * 敵の更新処理
 */
export function updateEnemies() {
  if (GAME_STATE.enemies.length === 0) {
    return; // エネミーがいなければ何もしない
  }
  
  for (let i = GAME_STATE.enemies.length - 1; i >= 0; i--) {
    const enemy = GAME_STATE.enemies[i];
    
    // 移動速度
    let moveSpeed = GAME_CONFIG.moveSpeed * GAME_STATE.difficultyMultiplier;
    
    // Z方向（手前）に移動
    enemy.mesh.position.z += moveSpeed;
    
    // 単語表示の位置を更新
    if (enemy.element) {
      const screenPosition = getScreenPosition(enemy.mesh);
      enemy.element.style.left = screenPosition.x + 'px';
      enemy.element.style.top = (screenPosition.y - 80) + 'px'; // より上に表示
      
      // 進行度に応じて単語の色を変更
      if (enemy.progress > 0) {
        const fullWord = enemy.word;
        const typedPart = fullWord.substring(0, Math.floor(fullWord.length * enemy.progress));
        const remainingPart = fullWord.substring(Math.floor(fullWord.length * enemy.progress));
        enemy.element.innerHTML = `<span style="color: #66FF66;">${typedPart}</span><span>${remainingPart}</span>`;
      }
    }
    
    // プレイヤーに到達したらライフを減らして敵を消去
    if (enemy.mesh.position.z >= GAME_CONFIG.endZ) {
      console.log("エネミーがプレイヤーに到達しました！");
      
      // 敵を削除
      removeFromScene(enemy.mesh);
      if (enemy.element) {
        enemy.element.remove();
      }
      GAME_STATE.enemies.splice(i, 1);
      
      // ライフを減らす
      reduceLife();
      
      // 現在タイピング中の敵だった場合、タイピング状態をリセット
      if (GAME_STATE.currentTypingEnemy === enemy) {
        GAME_STATE.currentTypingEnemy = null;
        GAME_STATE.typedText = '';
        const typingDisplay = document.getElementById('typing-display');
        if (typingDisplay) {
          typingDisplay.innerHTML = '';
        }
        updateProgressBar(0);
      }
    }
  }
}

/**
 * 敵の破壊処理
 * @param {Object} enemy 破壊する敵オブジェクト
 */
export function destroyEnemy(enemy) {
  // 爆発音を再生
  playSound('explosion');
  
  // 爆発エフェクト
  createExplosionEffect(getScreenPosition(enemy.mesh));
  
  // メッシュをシーンから削除
  removeFromScene(enemy.mesh);
  
  // 単語表示要素を削除
  if (enemy.element) {
    enemy.element.remove();
  }
  
  // 敵リストから削除
  const index = GAME_STATE.enemies.indexOf(enemy);
  if (index !== -1) {
    GAME_STATE.enemies.splice(index, 1);
  }
}

/**
 * ライフ減少処理
 */
export function reduceLife() {
  GAME_STATE.lives--;
  updateUI();
  
  // ダメージエフェクト表示
  showDamageEffect();
  
  // ライフが0になったらゲームオーバー
  if (GAME_STATE.lives <= 0) {
    gameOver();
  }
}

export function checkWordCompletion() {
    if (!GAME_STATE.currentTypingEnemy) return;
    
    const targetWord = GAME_STATE.currentTypingEnemy.word;
    const complete = (GAME_STATE.gameMode === 'hiragana') ? 
                    (GAME_ROMAJI.typedHiragana === GAME_ROMAJI.targetWord) : 
                    (GAME_STATE.typedText === targetWord);
    
    if (complete) {
      console.log(`単語完成: ${targetWord}`);
      
      // 正解音を再生
      playSound('correct');
      

      // スコア計算 - 単語の長さと難易度に応じた改善版ボーナス
      const wordLength = targetWord.length;
      const baseScore = Math.floor(100 * GAME_STATE.level);

      // 長さボーナス - 長さの2乗に比例（指数関数的にボーナスが増える）
      const lengthBonus = Math.floor(wordLength * wordLength * 5);

      // 難易度ボーナス - 難しい単語ほど高スコア
      let difficultyBonus = 0;
      if (GAME_STATE.difficulty === 'normal') {
        difficultyBonus = 50;
      } else if (GAME_STATE.difficulty === 'hard') {
        difficultyBonus = 100;
      }

      // 特別長い単語へのボーナス - 10文字以上でさらにボーナス
      let extraLengthBonus = 0;
      if (wordLength >= 10) {
        extraLengthBonus = (wordLength - 9) * 20; // 10文字目以降、1文字につき20ポイント追加
      }

      // スコア合計
      const totalScore = baseScore + lengthBonus + difficultyBonus + extraLengthBonus;
      GAME_STATE.score += totalScore;
      
      // 現在のエネミーを保存し、破壊前に次のエネミーを選択する
      const currentEnemy = GAME_STATE.currentTypingEnemy;
      const currentIndex = GAME_STATE.enemies.indexOf(currentEnemy);
      
      // 敵を破壊
      destroyEnemy(currentEnemy);
      
      // レベルアップのチェック
      const newLevel = Math.floor(GAME_STATE.score / 500) + 1;
      if (newLevel > GAME_STATE.level) {
        GAME_STATE.level = newLevel;
        GAME_STATE.difficultyMultiplier = 1 + (GAME_STATE.level - 1) * 0.2;
        updateUI();
        console.log(`レベルアップ: ${GAME_STATE.level}, 難易度倍率: ${GAME_STATE.difficultyMultiplier.toFixed(1)}`);
      }
      
      // 表示をクリア
      const typingDisplay = document.getElementById('typing-display');
      if (typingDisplay) {
        typingDisplay.innerHTML = '';
      }
      
      // *** 重要: ローマ字入力情報を完全にリセット ***
      GAME_STATE.typedText = '';
      GAME_ROMAJI.typedRomaji = '';
      GAME_ROMAJI.typedHiragana = '';
      GAME_ROMAJI.romajiWord = '';
      GAME_ROMAJI.targetWord = '';
      GAME_ROMAJI.alternativeInputs = [];
      
      // 次の敵にフォーカスを移動
      if (GAME_STATE.enemies.length > 0) {
        // すべてのフォーカスを解除
        document.querySelectorAll('.word-container.focused').forEach(el => {
          el.classList.remove('focused');
        });
        
        // 配列サイズが変わっているため、インデックス計算を修正
        let nextIndex = 0;
        if (currentIndex < GAME_STATE.enemies.length) {
          nextIndex = currentIndex;
        }
        
        // 次の敵を選択
        GAME_STATE.currentTypingEnemy = GAME_STATE.enemies[nextIndex];
        GAME_STATE.currentTypingEnemy.isTyping = true;
        
        // 新しい敵にフォーカスを設定
        if (GAME_STATE.currentTypingEnemy.element) {
          GAME_STATE.currentTypingEnemy.element.classList.add('focused');
          console.log(`新しいフォーカス: ${GAME_STATE.currentTypingEnemy.word}`);
        }
        
        // ひらがなモードの場合は再度初期化
        if (GAME_STATE.gameMode === 'hiragana' && 
            /^[\u3040-\u309F]+$/.test(GAME_STATE.currentTypingEnemy.word)) {
          console.log("次の単語のローマ字変換を初期化:", GAME_STATE.currentTypingEnemy.word);
          initRomajiInput(GAME_STATE.currentTypingEnemy.word);
        }
      } else {
        // 敵がいなくなった場合
        GAME_STATE.currentTypingEnemy = null;
      }
      
      updateProgressBar(0);
    }
  }

/**
 * 平仮名のみの単語をフィルタリング
 */
export function filterHiraganaWords() {
  if (GAME_STATE.gameMode === 'hiragana') {
    // 難易度に基づいて適切な単語リストを選択
    let sourceList;
    switch(GAME_STATE.difficulty) {
      case 'easy':
        sourceList = GAME_CONFIG.wordListEasy;
        break;
      case 'normal':
        sourceList = GAME_CONFIG.wordListNormal;
        break;
      case 'hard':
        sourceList = GAME_CONFIG.wordListHard;
        break;
    }
    
    // 平仮名の単語のみをフィルタリング
    GAME_STATE.wordList = sourceList.filter(word => 
      /^[\u3040-\u309F]+$/.test(word) // 平仮名の Unicode 範囲でフィルタリング
    );
    
    // 平仮名の単語が不足している場合、基本的な平仮名単語を追加
    if (GAME_STATE.wordList.length < 5) {
      const basicHiragana = [
        "ねこ", "いぬ", "ぶた", "とり", "さる", "くま", "うま", "かに", "あり",
        "みず", "やま", "そら", "うみ", "ほし", "つき", "ひこうき", "でんしゃ", "くるま"
      ];
      GAME_STATE.wordList = [...GAME_STATE.wordList, ...basicHiragana];
    }
  }
}

/**
 * 難易度選択
 * @param {string} difficulty 難易度 ('easy', 'normal', 'hard')
 */
export function selectDifficulty(difficulty) {
  // 前の選択をリセット
  const easyButton = document.getElementById('easy-button');
  const normalButton = document.getElementById('normal-button');
  const hardButton = document.getElementById('hard-button');
  
  if (easyButton) easyButton.classList.remove('selected');
  if (normalButton) normalButton.classList.remove('selected');
  if (hardButton) hardButton.classList.remove('selected');
  
  // 新しい選択を適用
  GAME_STATE.difficulty = difficulty;
  
  switch(difficulty) {
    case 'easy':
      if (easyButton) easyButton.classList.add('selected');
      break;
    case 'normal':
      if (normalButton) normalButton.classList.add('selected');
      break;
    case 'hard':
      if (hardButton) hardButton.classList.add('selected');
      break;
  }
  
  console.log(`難易度が${difficulty}に設定されました`);
  
  // ゲームモードに応じて適切な単語リストを設定
  if (GAME_STATE.gameMode === 'hiragana') {
    // ひらがなモードの場合は平仮名のみをフィルタリング
    filterHiraganaWords();
  } else {
    // 英語モードの場合は平仮名以外の単語をフィルタリング
    let sourceList;
    switch(difficulty) {
      case 'easy':
        sourceList = GAME_CONFIG.wordListEasy;
        break;
      case 'normal':
        sourceList = GAME_CONFIG.wordListNormal;
        break;
      case 'hard':
        sourceList = GAME_CONFIG.wordListHard;
        break;
    }
    
    // 平仮名以外の単語をフィルタリング
    GAME_STATE.wordList = sourceList.filter(word => 
      !/^[\u3040-\u309F]+$/.test(word)
    );
    
    console.log(`英語モード: 単語リスト更新 (${GAME_STATE.wordList.length}件)`);
  }
}

/**
 * ゲームモード選択
 * @param {string} mode ゲームモード ('english', 'hiragana')
 */
export function selectGameMode(mode) {
  // 前の選択をリセット
  const englishModeButton = document.getElementById('english-mode');
  const hiraganaModeButton = document.getElementById('hiragana-mode');
  
  if (englishModeButton) englishModeButton.classList.remove('selected');
  if (hiraganaModeButton) hiraganaModeButton.classList.remove('selected');
  
  // 新しい選択を適用
  GAME_STATE.gameMode = mode;
  
  if (mode === 'english') {
    if (englishModeButton) englishModeButton.classList.add('selected');
    console.log('英語モードを選択しました');
    
    // 英語モードでは、選択した難易度の元のリストを使用
    switch(GAME_STATE.difficulty) {
      case 'easy':
        // 修正: 英語モードでは英語のみを表示するよう変更
        GAME_STATE.wordList = GAME_CONFIG.wordListEasy.filter(word => 
          /^[a-zA-Z]+$/.test(word) // 英語（アルファベット）のみの単語を選択
        );
        break;
      case 'normal':
        GAME_STATE.wordList = GAME_CONFIG.wordListNormal.filter(word => 
          /^[a-zA-Z]+$/.test(word)
        );
        break;
      case 'hard':
        GAME_STATE.wordList = GAME_CONFIG.wordListHard.filter(word => 
          /^[a-zA-Z]+$/.test(word)
        );
        break;
    }
    
    console.log(`英語モード: 単語リスト更新 (${GAME_STATE.wordList.length}件)`);
    
  } else if (mode === 'hiragana') {
    if (hiraganaModeButton) hiraganaModeButton.classList.add('selected');
    console.log('ひらがなモードを選択しました');
    // 平仮名モードの場合、単語リストをフィルタリング
    filterHiraganaWords();
  }
  
  console.log(`ゲームモードが${mode}に設定されました`);
}

/**
 * ゲームアニメーションループ
 */
function animateGame() {
  animationFrameId = requestAnimationFrame(animateGame);
  
  if (GAME_STATE.isRunning) {
    updateEnemies();
  }
  
  renderScene();
}