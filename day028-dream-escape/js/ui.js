/**
 * UI関連の機能を管理するモジュール
 * 画面遷移、アニメーション、メッセージ表示などを担当
 */

// UI要素
let titleScreen, storyScreen, gameScreen, clearScreen, endingScreen;
let stageInfo, errorLayer, message;
let dots = [];

/**
 * UI要素の初期化
 */
function initUIElements() {
    // 画面要素
    titleScreen = document.getElementById('titleScreen');
    storyScreen = document.getElementById('storyScreen');
    gameScreen = document.getElementById('gameScreen');
    clearScreen = document.getElementById('clearScreen');
    endingScreen = document.getElementById('endingScreen');
    stageTransition = document.getElementById('stageTransition');
    
    // UI要素
    stageInfo = document.getElementById('stageInfo');
    errorLayer = document.getElementById('errorLayer');
    message = document.getElementById('message');
    
    // 進行度ドット
    dots = [
        document.getElementById('dot1'),
        document.getElementById('dot2'),
        document.getElementById('dot3')
    ];
}

/**
 * 全画面のスクロールリセット
 * すべての画面遷移時に呼び出す共通関数
 */
function resetAllScrolls() {
    // すべてのスクロール可能要素をリセット
    const scrollableElements = [
      document.getElementById('storyScreen'),
      document.getElementById('clearScreen'),
      document.getElementById('endingScreen')
    ];
    
    scrollableElements.forEach(element => {
      if (element) {
        // スクロール位置をリセット
        setTimeout(() => {
          element.scrollTop = 0;
        }, 10);
      }
    });
  }
  

/**
 * ストーリー画面表示
 */
function showStory() {
    // まず強制的にスクロールリセット
    resetAllScrolls();
    
    // フェードアウト効果
    titleScreen.style.transition = "opacity 0.8s ease";
    titleScreen.style.opacity = 0;
    
    setTimeout(() => {
      titleScreen.style.display = 'none';
      storyScreen.style.display = 'flex';
      storyScreen.style.opacity = 0;
      
      // 表示後にも強制的にスクロールリセット
      resetAllScrolls();
      
      // フェードイン
      setTimeout(() => {
        storyScreen.style.transition = "opacity 0.8s ease";
        storyScreen.style.opacity = 1;
        storyScreen.classList.add('active');
        
        // 再度スクロールリセット
        resetAllScrolls();
      }, 50);
    }, 800);
  }

/**
 * ゲーム画面にステージ情報を表示
 */
function updateStageInfo(stageId) {
    const stage = stageSettings[stageId - 1];
    if (stageInfo) {
        stageInfo.textContent = `ステージ${stageId}: ${stage.name}`;
    }
}

/**
 * 進行度表示をリセット
 */
function resetProgressDots() {
    dots.forEach(dot => dot.classList.remove('found'));
}

/**
 * 進行度を更新
 */
function updateProgress(foundCount) {
    if (foundCount > 0 && foundCount <= dots.length) {
        dots[foundCount - 1].classList.add('found');
    }
}

/**
 * メッセージを表示
 */
function showMessage(text) {
    console.log("メッセージ表示:", text);
    
    message.textContent = text;
    message.classList.add('show');
    
    // 3秒後に消す
    clearMessageTimeout = setTimeout(() => {
        message.classList.remove('show');
    }, 3000);
}

/**
 * チェックマーク表示
 */
function showCheckMark(x, y) {
    const checkMark = document.createElement('div');
    checkMark.className = 'check-mark';
    checkMark.style.left = (x - 30) + 'px'; // 中心に表示するため半分のサイズをオフセット
    checkMark.style.top = (y - 30) + 'px';
    
    gameScreen.appendChild(checkMark);
    
    // 3秒後に消す
    setTimeout(() => {
        if (gameScreen.contains(checkMark)) {
            gameScreen.removeChild(checkMark);
        }
    }, 3000);
}

/**
 * クリック位置に視覚フィードバックを表示
 */
function showFeedback(x, y) {
    const feedback = document.createElement('div');
    feedback.className = 'feedback';
    feedback.style.left = x + 'px';
    feedback.style.top = y + 'px';
    feedback.style.width = '30px';
    feedback.style.height = '30px';
    
    gameScreen.appendChild(feedback);
    
    // アニメーション完了後に要素を削除
    setTimeout(() => {
        if (gameScreen.contains(feedback)) {
            gameScreen.removeChild(feedback);
        }
    }, 800);
}

/**
 * ステージクリア画面表示
 */
function showClearScreen(stageId) {
    resetAllScrolls();

    console.log("ステージクリア処理を開始");
    
    try {
        playClearSound();
    } catch (e) {
        console.error("音声再生エラー:", e);
    }
    
    // クリア画面表示前にスクロール位置をリセット
    clearScreen.scrollTop = 0;
    
    // ステージ情報設定
    const stage = stageSettings[stageId - 1];
    document.getElementById('clearTitle').textContent = stage.clearMessage;
    document.getElementById('clearDescription').innerHTML = stage.clearDescription;
    document.getElementById('nextStageDescription').innerHTML = stage.nextStageMessage;
    document.getElementById('clearImage').src = stage.clearImage || `assets/clear_stage${stageId}.png`;
    
    // 最終ステージの場合、ボタンテキスト変更
    if (stageId === stageSettings.length) {
        document.getElementById('nextStageButton').textContent = "エンディングへ";
    } else {
        document.getElementById('nextStageButton').textContent = "次のステージへ";
    }
    
    // クリア画面表示
    clearScreen.style.display = 'block';
    clearScreen.style.opacity = '0';
    
    setTimeout(() => {
        clearScreen.style.opacity = '1';
        clearScreen.classList.add('active');
        console.log("クリア画面を表示しました");
    }, 50);
}

/**
 * エンディング画面表示
 */
function showEnding() {
    resetAllScrolls();
    
    console.log("エンディング表示処理を開始");
    
    if (!endingScreen) {
        console.error("エンディング画面要素が見つかりません");
        return; // エラー回避
    }
    
    // エンディング画面を表示
    gameScreen.style.display = 'none';
    endingScreen.style.display = 'block';
    endingScreen.style.opacity = '0';
    
    setTimeout(() => {
        endingScreen.style.opacity = '1';
        endingScreen.classList.add('active');
        console.log("エンディング画面を表示しました");
    }, 50);
}

/**
 * タイトル画面に戻る
 */
function returnToTitle() {
    console.log("タイトル画面に戻ります");
    
    const currentScreen = document.querySelector('.active');
    if (currentScreen) {
        currentScreen.classList.remove('active');
        currentScreen.style.opacity = '0';
        
        setTimeout(() => {
            currentScreen.style.display = 'none';
            
            // タイトル画面表示
            titleScreen.style.display = 'flex';
            titleScreen.style.opacity = '0';
            
            setTimeout(() => {
                titleScreen.style.opacity = '1';
            }, 50);
        }, 500);
    } else {
        // アクティブな画面がない場合、直接タイトルへ
        endingScreen.style.display = 'none';
        clearScreen.style.display = 'none';
        gameScreen.style.display = 'none';
        storyScreen.style.display = 'none';
        
        titleScreen.style.display = 'flex';
        titleScreen.style.opacity = '1';
    }
}

/**
 * 次のステージへ移行
 */
function goToNextStage() {
    resetAllScrolls();
    // クリア画面を閉じる
    clearScreen.classList.remove('active');
    clearScreen.style.opacity = 0;
    
    setTimeout(() => {
        clearScreen.style.display = 'none';
        
        // 最終ステージだった場合はエンディング
        if (gameState.currentStage === stageSettings.length) {
            // ゲーム画面をフェードアウト
            gameScreen.style.opacity = 0;
            
            setTimeout(() => {
                showEnding();
            }, 500);
        } else {
            // ゲーム画面を完全に非表示にする
            gameScreen.style.opacity = 0;
            
            setTimeout(() => {
                // 次のステージを準備して開始
                const nextStageId = gameState.currentStage + 1;
                startStage(nextStageId);
                
                // フェードイン
                setTimeout(() => {
                    gameScreen.style.opacity = 1;
                }, 100);
            }, 500);
        }
    }, 800);
}

// メッセージタイムアウトを管理する変数
let clearMessageTimeout = null;

/**
 * メッセージのクリア処理
 */
function clearMessage() {
    if (clearMessageTimeout) {
        clearTimeout(clearMessageTimeout);
        clearMessageTimeout = null;
    }
    message.classList.remove('show');
}