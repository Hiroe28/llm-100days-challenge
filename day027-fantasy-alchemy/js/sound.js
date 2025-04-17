// 音声関連のデータは data.js に追加
// sound.js ファイルを新規作成

// サウンドマネージャークラス
class SoundManager {
    constructor() {
        this.bgmPlayer = null;
        this.sfxPlayers = {};
        this.isMuted = false;
        this.bgmVolume = 0.1;
        this.sfxVolume = 0.4;
        this.initialized = false;
    }
    
    // 初期化
    // SoundManager クラスの init メソッドを修正
    init() {
        if (this.initialized) return;
        
        // サウンド設定ボタンをUIに追加
        this.addSoundControls();
        this.initialized = true;
        
        // BGM再生はユーザーの最初のインタラクション後に行う
        // 自動的に再生を開始しない
        // this.playBGM('gameplay'); ← この行を削除または以下のように変更
        
        // 最初のクリックやタッチでBGM再生を開始するイベントリスナーを追加
        const startAudio = () => {
            this.playBGM('gameplay');
            // 一度再生したらイベントリスナーを削除
            document.removeEventListener('click', startAudio);
            document.removeEventListener('touchstart', startAudio);
        };
        
        document.addEventListener('click', startAudio);
        document.addEventListener('touchstart', startAudio);
    }
    
    // UIコントロール追加
    addSoundControls() {
        const gameHeader = document.querySelector('.game-header > div:last-child');
        if (!gameHeader) return;
        
        const soundButton = document.createElement('button');
        soundButton.id = 'sound-button';
        soundButton.className = 'sound-button';
        soundButton.textContent = '🔊';
        soundButton.title = 'サウンド設定';
        soundButton.style.cssText = 'background-color: #8a2be2; color: white; margin-left: 10px;';
        
        soundButton.addEventListener('click', () => {
            this.showSoundSettings();
        });
        
        gameHeader.appendChild(soundButton);
    }
    
    // サウンド設定ダイアログ表示
    showSoundSettings() {
        const overlay = document.createElement('div');
        overlay.className = 'sound-settings-overlay';
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 1000;';
        
        const content = document.createElement('div');
        content.className = 'sound-settings-content';
        content.style.cssText = 'background-color: white; border-radius: 15px; padding: 20px; width: 80%; max-width: 500px; text-align: center;';
        
        content.innerHTML = `
            <h3>サウンド設定</h3>
            <div style="margin: 20px 0;">
                <label>BGM音量: <span id="bgm-volume-value">${Math.round(this.bgmVolume * 100)}%</span></label><br>
                <input type="range" id="bgm-volume" min="0" max="1" step="0.1" value="${this.bgmVolume}">
            </div>
            <div style="margin: 20px 0;">
                <label>効果音音量: <span id="sfx-volume-value">${Math.round(this.sfxVolume * 100)}%</span></label><br>
                <input type="range" id="sfx-volume" min="0" max="1" step="0.1" value="${this.sfxVolume}">
            </div>
            <div style="margin: 20px 0;">
                <button id="mute-toggle" class="mute-button">${this.isMuted ? '🔇 ミュート解除' : '🔊 ミュート'}</button>
            </div>
            <button id="close-sound-settings" class="close-button">閉じる</button>
        `;
        
        overlay.appendChild(content);
        document.body.appendChild(overlay);
        
        // イベントリスナー設定
        document.getElementById('bgm-volume').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.setVolume('bgm', value);
            document.getElementById('bgm-volume-value').textContent = `${Math.round(value * 100)}%`;
        });
        
        document.getElementById('sfx-volume').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.setVolume('sfx', value);
            document.getElementById('sfx-volume-value').textContent = `${Math.round(value * 100)}%`;
        });
        
        document.getElementById('mute-toggle').addEventListener('click', () => {
            const isMuted = this.toggleMute();
            document.getElementById('mute-toggle').textContent = isMuted ? '🔇 ミュート解除' : '🔊 ミュート';
        });
        
        document.getElementById('close-sound-settings').addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
    }
    
    // BGM再生
    playBGM(type) {
        if (this.isMuted) return;
        
        const bgmFile = soundFiles.bgm[type];
        if (!bgmFile) return;
        
        // 現在のBGMを停止
        if (this.bgmPlayer) {
            this.bgmPlayer.pause();
        }
        
        // 新しいBGMを再生
        this.bgmPlayer = new Audio(bgmFile);
        this.bgmPlayer.volume = this.bgmVolume;
        this.bgmPlayer.loop = true;
        this.bgmPlayer.play().catch(e => console.error('BGM再生エラー:', e));
    }
    
    // 効果音再生
    playSFX(type) {
        if (this.isMuted) return;
        
        const sfxFile = soundFiles.sfx[type];
        if (!sfxFile) return;
        
        // 効果音を再生
        const player = new Audio(sfxFile);
        player.volume = this.sfxVolume;
        player.play().catch(e => console.error('効果音再生エラー:', e));
    }
    
    // 音量設定
    setVolume(type, value) {
        if (type === 'bgm') {
            this.bgmVolume = value;
            if (this.bgmPlayer) {
                this.bgmPlayer.volume = value;
            }
        } else if (type === 'sfx') {
            this.sfxVolume = value;
        }
    }
    
    // ミュート切替
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.isMuted) {
            if (this.bgmPlayer) {
                this.bgmPlayer.pause();
            }
        } else {
            if (this.bgmPlayer) {
                this.bgmPlayer.play().catch(e => console.error('BGM再生エラー:', e));
            }
        }
        
        return this.isMuted;
    }
}

// グローバルインスタンス
const soundManager = new SoundManager();

// 各アクションで効果音を再生する関数の追加
function playCraftSound(isSuccess) {
    soundManager.playSFX(isSuccess ? 'craftSuccess' : 'craftFail');
}

function playGatherSound() {
    soundManager.playSFX('itemGet');
}

function playButtonSound() {
    soundManager.playSFX('buttonClick');
}

function playPurchaseSound() {
    soundManager.playSFX('purchase');
}

function playLevelUpSound() {
    soundManager.playSFX('levelUp');
}

function playCraftStartSound() {
    soundManager.playSFX('craftStart');
}

// playSFX 関数を拡張
function playSFX(type, duration = 0) {
    if (soundManager.isMuted) return;
    
    const sfxFile = soundFiles.sfx[type];
    if (!sfxFile) return;
    
    // 効果音を再生
    const player = new Audio(sfxFile);
    player.volume = soundManager.sfxVolume;
    
    // 再生開始
    player.play().catch(e => console.error('効果音再生エラー:', e));
    
    // フェードアウト設定（durationが指定されている場合）
    if (duration > 0) {
        // 指定時間後にフェードアウト開始
        setTimeout(() => {
            // 1秒かけてフェードアウト
            const fadeInterval = setInterval(() => {
                if (player.volume > 0.05) {
                    player.volume -= 0.05;
                } else {
                    clearInterval(fadeInterval);
                    player.pause();
                    player.currentTime = 0;
                }
            }, 50);
        }, duration);
    }
    
    return player; // プレイヤーを返す（必要に応じて停止できるように）
}

// 日付変更音を再生する関数を修正
function playDayChangeSound() {
    // 5秒後にフェードアウトさせる
    return playSFX('newDay', 5000);
}

function playUnlockSound() {
    soundManager.playSFX('unlock');
}