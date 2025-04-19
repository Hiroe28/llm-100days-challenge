/**
 * 音声関連の機能を管理するモジュール
 * BGMと効果音の読み込み・再生・制御を担当
 */

// 音声オブジェクト
let clickSound, correctSound, errorSound, clearSound;
let bgmPlayer = null;
let audioInitialized = false;
let bgmEnabled = true;

/**
 * 音声の読み込みを行う
 */
function loadSounds() {
    console.log("音声の読み込みを開始");
    
    // 効果音の読み込み
    clickSound = new Audio('assets/click.mp3');
    correctSound = new Audio('assets/correct.mp3');
    errorSound = new Audio('assets/error.mp3');
    clearSound = new Audio('assets/clear.mp3');
    
    // 音量調整
    clickSound.volume = 0.2;
    correctSound.volume = 0.25;
    errorSound.volume = 0.15;
    clearSound.volume = 0.3;
    
    // エラーハンドリング
    [clickSound, correctSound, errorSound, clearSound].forEach(sound => {
        sound.onerror = function() {
            console.error("音声ファイルの読み込みに失敗: " + sound.src);
        };
        sound.oncanplaythrough = function() {
            console.log("音声ファイルの読み込み成功: " + sound.src);
        };
    });
}

/**
 * BGMのセットアップ
 */
function setupBGM() {
    // BGM用のオーディオ要素を作成
    bgmPlayer = new Audio('assets/bgm.mp3');
    bgmPlayer.loop = true;
    bgmPlayer.volume = 0.15;
    
    // BGM読み込み完了イベント
    bgmPlayer.addEventListener('canplaythrough', function() {
        console.log("BGM読み込み完了");
    });
    
    // BGM再生エラー処理
    bgmPlayer.addEventListener('error', function(e) {
        console.error("BGM再生エラー:", e);
    });
    
    // ページ内クリックでBGM再生（ブラウザの自動再生制限対策）
    document.addEventListener('click', startBGM, { once: true });
    
    // タッチイベントでもBGM再生
    document.addEventListener('touchstart', startBGM, { once: true });
}

/**
 * BGM再生開始
 */
function startBGM() {
    if (!audioInitialized) {
        audioInitialized = true;
        
        if (bgmPlayer && bgmEnabled) {
            // playPromiseを使って再生を試みる
            const playPromise = bgmPlayer.play();
            
            // play()がPromiseを返す場合の処理
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log("BGM再生開始");
                }).catch(error => {
                    console.error("BGM自動再生できませんでした:", error);
                    // 自動再生に失敗した場合は手動再生ボタンの表示などの対応
                    showPlayButton();
                });
            }
        }
    }
}

/**
 * BGMのON/OFF切り替え
 */
function toggleBGM() {
    if (bgmPlayer) {
        bgmEnabled = !bgmEnabled;
        const bgmControl = document.getElementById('bgmControl');
        
        if (bgmEnabled) {
            bgmPlayer.play().catch(e => {
                console.error("BGM再生エラー:", e);
            });
            if (bgmControl) bgmControl.textContent = '🎵';
        } else {
            bgmPlayer.pause();
            if (bgmControl) bgmControl.textContent = '🔇';
        }
    }
}

/**
 * クリック効果音再生
 */
function playClickSound() {
    if (audioInitialized && clickSound) {
        // 再生位置をリセット
        clickSound.currentTime = 0;
        
        // 再生
        clickSound.play().catch(e => {
            console.error("効果音再生エラー:", e);
        });
    }
}

/**
 * 正解効果音再生
 */
function playCorrectSound() {
    if (audioInitialized && correctSound) {
        correctSound.currentTime = 0;
        correctSound.play().catch(e => {
            console.error("効果音再生エラー:", e);
        });
    }
}

/**
 * 不正解効果音再生
 */
function playErrorSound() {
    if (audioInitialized && errorSound) {
        errorSound.currentTime = 0;
        errorSound.play().catch(e => {
            console.error("効果音再生エラー:", e);
        });
    }
}

/**
 * クリア効果音再生
 */
function playClearSound() {
    if (audioInitialized && clearSound) {
        clearSound.currentTime = 0;
        clearSound.play().catch(e => {
            console.error("効果音再生エラー:", e);
        });
    }
}

/**
 * 自動再生に失敗した場合の手動再生ボタン表示
 */
function showPlayButton() {
    const container = document.querySelector('.container');
    if (!container) return;
    
    const playButton = document.createElement('button');
    playButton.className = 'button';
    playButton.textContent = 'BGMを再生';
    playButton.style.position = 'absolute';
    playButton.style.top = '50%';
    playButton.style.left = '50%';
    playButton.style.transform = 'translate(-50%, -50%)';
    playButton.style.zIndex = '1000';
    
    playButton.addEventListener('click', function() {
        if (bgmPlayer) {
            bgmPlayer.play().catch(e => {
                console.error("BGM再生エラー:", e);
            });
        }
        this.remove();
    });
    
    container.appendChild(playButton);
}