// HUD表示更新
const HUD = (function() {
    // DOM要素
    let hudScore;
    let hudLevel;
    let hudAmmo;
    let hudHealth;
    let hudWeapon;
    let hudStatus;
    let playerShield;
    
    // パワーアップアイテム配列
    let powerupItems = [];
    
    // 要素が初期化されたかのフラグ
    let isInitialized = false;
    
    // メッセージタイマーID
    let statusMessageTimeoutId = null;
    let warningMessageTimeoutId = null;
    let weaponInfoTimeoutId = null;
    
    // 初期化
    function init() {
        // DOM要素取得
        hudScore = document.querySelector('.hud-score');
        hudLevel = document.querySelector('.hud-level');
        hudAmmo = document.querySelector('.hud-ammo');
        hudHealth = document.querySelector('.hud-health');
        hudWeapon = document.querySelector('.hud-weapon');
        hudStatus = document.querySelector('.hud-status');
        
        // 初期表示
        updateScore(0);
        updateLevel(1);
        updateAmmo(30, 30);
        updateHealth(100);
        updateWeapon('normal');
        
        // プレイヤーシールドの視覚化を追加
        playerShield = addShieldVisualizer();
        
        // ヘルプボタンを追加
        addHelpButton();
        
        isInitialized = true;
    }
    
    // ヘルプボタン追加
    function addHelpButton() {
        const helpButton = document.createElement('button');
        helpButton.className = 'help-button';
        helpButton.textContent = '?';
        helpButton.addEventListener('click', showHelpOverlay);
        document.getElementById('game-container').appendChild(helpButton);
    }
    
    // スコア更新
    function updateScore(score) {
        if (!isInitialized) return;
        hudScore.textContent = `SCORE: ${score}`;
        
        // スコア変更エフェクト
        hudScore.classList.add('highlight');
        setTimeout(() => {
            hudScore.classList.remove('highlight');
        }, 300);
    }
    
    // レベル更新
    function updateLevel(level) {
        if (!isInitialized) return;
        hudLevel.textContent = `LEVEL: ${level}`;
    }
    
    // 弾薬更新
    function updateAmmo(current, max) {
        if (!isInitialized) return;
        hudAmmo.textContent = `AMMO: ${current}/${max}`;
        
        // 残弾少ない時は警告色
        if (current <= max * 0.25) {
            hudAmmo.classList.add('warning');
        } else {
            hudAmmo.classList.remove('warning');
        }
    }
    
    // シールド/ヘルス更新
    function updateHealth(health) {
        if (!isInitialized) return;
        const percent = Math.max(0, health);
        hudHealth.textContent = `SHIELD: ${percent}%`;
        
        // シールドの視覚表現も更新
        updateShieldVisualizer(percent);
        
        // 残量少ない時は警告色
        if (health <= 30) {
            hudHealth.classList.add('warning');
            if (playerShield) {
                playerShield.classList.add('danger');
            }
        } else {
            hudHealth.classList.remove('warning');
            if (playerShield) {
                playerShield.classList.remove('danger');
            }
        }
    }
    
    // プレイヤーシールドの視覚化
    function addShieldVisualizer() {
        const shieldElement = document.createElement('div');
        shieldElement.className = 'player-shield';
        
        // ゲームコンテナに追加
        document.getElementById('game-container').appendChild(shieldElement);
        
        return shieldElement;
    }
    
    // シールド視覚表現の更新
    function updateShieldVisualizer(percent) {
        if (!playerShield) return;
        
        // シールド強度に応じて透明度を変更
        playerShield.style.opacity = 0.3 + (percent / 100) * 0.7;
        
        // シールドサイズも少し変更
        const baseSize = 100;
        const newSize = baseSize * (0.8 + (percent / 100) * 0.2);
        playerShield.style.width = `${newSize}px`;
        playerShield.style.height = `${newSize}px`;
    }
    
    // 武器更新
    function updateWeapon(type) {
        if (!isInitialized) return;
        // 武器名を取得
        let weaponName;
        switch(type) {
            case 'normal':
                weaponName = 'NORMAL';
                break;
            case 'sniper':
                weaponName = 'SNIPER';
                break;
            case 'radar':
                weaponName = 'RADAR';
                break;
            default:
                weaponName = 'UNKNOWN';
        }
        
        hudWeapon.textContent = `WEAPON: ${weaponName}`;
        
        // 武器効果情報を表示
        showWeaponEffectInfo(type);
        
        // 武器ボタンのアクティブ状態更新
        const buttons = document.querySelectorAll('.control-button');
        buttons.forEach(btn => {
            if (btn.getAttribute('data-weapon') === type) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    // 武器効果情報の表示
    function showWeaponEffectInfo(type) {
        // 既存の情報表示がある場合は削除
        clearWeaponEffectInfo();
        
        // 効果情報要素作成
        const infoElement = document.createElement('div');
        infoElement.className = 'weapon-effect-info';
        
        // 武器ごとの効果情報
        let infoText = '';
        switch(type) {
            case 'normal':
                infoText = '効果的: バイト型 <span class="enemy-icon byte-icon"></span>';
                break;
            case 'sniper':
                infoText = '効果的: ブロック型 <span class="enemy-icon block-icon"></span>';
                break;
            case 'radar':
                infoText = '効果的: ファイアウォール型 <span class="enemy-icon firewall-icon"></span>';
                break;
        }
        
        infoElement.innerHTML = infoText;
        document.getElementById('game-container').appendChild(infoElement);
        
        // 一定時間後に消去
        weaponInfoTimeoutId = setTimeout(() => {
            clearWeaponEffectInfo();
        }, 3000);
    }
    
    // 効果情報の消去
    function clearWeaponEffectInfo() {
        if (weaponInfoTimeoutId) {
            clearTimeout(weaponInfoTimeoutId);
            weaponInfoTimeoutId = null;
        }
        
        const existingInfo = document.querySelector('.weapon-effect-info');
        if (existingInfo && existingInfo.parentNode) {
            existingInfo.parentNode.removeChild(existingInfo);
        }
    }
    
    // hud.js の showHelpOverlay 関数修正
    function showHelpOverlay() {
        // 既存のヘルプがあれば削除
        const existingHelp = document.getElementById('help-overlay');
        if (existingHelp) {
            existingHelp.parentNode.removeChild(existingHelp);
            return;
        }
        
        // ゲームを一時停止
        Game.pauseGame();
        
        // 一時停止パネルを隠す（追加）
        const pausePanel = document.getElementById('pause-panel');
        if (pausePanel) {
            pausePanel.classList.add('hidden');
        }
        
        // ヘルプオーバーレイ要素作成
        const helpOverlay = document.createElement('div');
        helpOverlay.id = 'help-overlay';
        helpOverlay.className = 'help-overlay';
        
        // ヘルプ内容
        helpOverlay.innerHTML = `
            <div class="help-content">
                <h3>ゲームヘルプ</h3>
                
                <h4>武器システム</h4>
                <p><strong>通常照準 [1]</strong>: バイト型敵<span class="enemy-icon byte-icon"></span>に効果的</p>
                <p><strong>スナイパー照準 [2]</strong>: ブロック型敵<span class="enemy-icon block-icon"></span>に効果的</p>
                <p><strong>レーダー照準 [3]</strong>: ファイアウォール型敵<span class="enemy-icon firewall-icon"></span>に効果的</p>
                
                <h4>リロード</h4>
                <p><strong>リロード</strong>: [R]キーまたは[4]キー、あるいは画面右下のRボタンでリロードできます。</p>
                <p>弾切れになると自動的にリロードが必要になります。</p>
                
                <h4>画面表示</h4>
                <p><strong>CHARGE</strong>: レーダー武器のチャージレベルを表示します。</p>
                <p><strong>STATUS</strong>: 現在の状態（リロード中、レベルアップなど）を表示します。</p>
                <p><strong>SHIELD</strong>: プレイヤーの体力です。敵が中央に到達すると減少します。</p>
                
                <h4>シールド回復</h4>
                <p>敵の撃破で稀にシールド回復アイテム<span class="shield-icon"></span>が出現します。</p>
                <p>照準を合わせてクリックすると回収できます。</p>
                
                <div class="help-buttons">
                    <button id="resume-button-help">ゲームを再開</button>
                    <button id="sound-toggle-help">サウンド: ${Sound.isMuted() ? 'OFF' : 'ON'}</button>
                    <button id="quit-button-help">終了</button>
                </div>
            </div>
        `;
        
        // ゲームコンテナに追加
        document.getElementById('game-container').appendChild(helpOverlay);
        
        // ボタンのイベントリスナー
        document.getElementById('resume-button-help').addEventListener('click', () => {
            if (helpOverlay.parentNode) {
                helpOverlay.parentNode.removeChild(helpOverlay);
                // ゲームを再開
                Game.resumeGame();
            }
        });
        
        document.getElementById('sound-toggle-help').addEventListener('click', () => {
            const isMuted = Sound.toggleMute();
            document.getElementById('sound-toggle-help').textContent = `サウンド: ${isMuted ? 'OFF' : 'ON'}`;
        });
        
        document.getElementById('quit-button-help').addEventListener('click', () => {
            Game.goToMenu();
        });
    }
    
    // ステータスメッセージ表示
    function showStatusMessage(message, duration = 2000) {
        if (!isInitialized) return;
        // 既存のタイマーをクリア
        if (statusMessageTimeoutId) {
            clearTimeout(statusMessageTimeoutId);
        }
        
        // メッセージ更新
        hudStatus.textContent = message;
        hudStatus.classList.add('highlight');
        
        // 一定時間後に元に戻す
        statusMessageTimeoutId = setTimeout(() => {
            hudStatus.classList.remove('highlight');
            hudStatus.textContent = 'STATUS: READY';
        }, duration);
    }
    
    // 警告メッセージ表示
    function showWarningMessage(message, duration = 3000) {
        if (!isInitialized) return;
        // 既存の警告を削除
        clearWarningMessage();
        
        // 警告メッセージ要素作成
        const warningElement = document.createElement('div');
        warningElement.className = 'warning-message';
        warningElement.textContent = message;
        
        // 警告音
        Sound.playSfx('warning');
        
        // 表示
        document.getElementById('game-container').appendChild(warningElement);
        
        // 一定時間後に消去
        warningMessageTimeoutId = setTimeout(() => {
            clearWarningMessage();
        }, duration);
    }
    
    // 警告メッセージ消去
    function clearWarningMessage() {
        if (!isInitialized) return;
        if (warningMessageTimeoutId) {
            clearTimeout(warningMessageTimeoutId);
            warningMessageTimeoutId = null;
        }
        
        const existingWarning = document.querySelector('.warning-message');
        if (existingWarning && existingWarning.parentNode) {
            existingWarning.parentNode.removeChild(existingWarning);
        }
    }
    
    // リロードメッセージ表示
    function showReloadMessage() {
        if (!isInitialized) return;
        showStatusMessage('RELOADING...', Weapons.getMaxAmmo() === 0 ? 3000 : 1500);
    }
    
    // レベルアップメッセージ表示
    function showLevelUpMessage() {
        if (!isInitialized) return;
        showStatusMessage(`LEVEL UP: ${Game.getLevel()}`, 2000);
    }
    
    // シールド回復メッセージ表示
    function showShieldRepairMessage(amount) {
        if (!isInitialized) return;
        showStatusMessage(`SHIELD REPAIRED: +${amount}%`, 2000);
    }
    
    // 公開API
    return {
        init,
        updateScore,
        updateLevel,
        updateAmmo,
        updateHealth,
        updateWeapon,
        showStatusMessage,
        showWarningMessage,
        clearWarningMessage,
        showReloadMessage,
        showLevelUpMessage,
        showShieldRepairMessage,
        showWeaponEffectInfo,
        showHelpOverlay,
        isInitialized: () => isInitialized
    };
})();