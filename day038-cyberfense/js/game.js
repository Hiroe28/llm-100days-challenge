// ゲームのメインロジック
const Game = (function() {
    // 変数
    let gameState = 'menu'; // 'menu', 'playing', 'paused', 'gameOver'
    let score = 0;
    let level = 1;
    let playerHealth = 100;
    let gameLoopId = null;
    let lastFrameTime = 0;
    let isPaused = false;
    let isBossBgmPlaying = false;
    let isBossFight = false; // ボス戦フラグ

    
    // DOM要素
    const gameContainer = document.getElementById('game-container');
    const gameOverPanel = document.getElementById('game-over-panel');
    const pausePanel = document.getElementById('pause-panel');
    const finalScoreElement = document.getElementById('final-score');
    const finalLevelElement = document.getElementById('final-level');
    const retryButton = document.getElementById('retry-button');
    const menuButton = document.getElementById('menu-button');
    const resumeButton = document.getElementById('resume-button');
    const soundToggleButton = document.getElementById('sound-toggle');
    const quitButton = document.getElementById('quit-button'); // 追加：終了ボタンの定義


    // 初期化

    function init() {
        // URLパラメータチェック
        const urlParams = new URLSearchParams(window.location.search);
        const hasDifficulty = urlParams.has('difficulty');

        // メニュー画面からの適切な遷移でなければリダイレクト
        if (!hasDifficulty) {
            window.location.href = 'pages/menu.html';
            return; // 初期化を中断
        }
        
        // イベントリスナー設定
        window.addEventListener('keydown', handleKeyDown);
        
        // 以下の要素を取得する際にnull対策を行う
        const retryButton = document.getElementById('retry-button');
        const menuButton = document.getElementById('menu-button');
        const resumeButton = document.getElementById('resume-button');
        const soundToggleButton = document.getElementById('sound-toggle');
        const quitButton = document.getElementById('quit-button');
        
        // 要素が存在する場合のみイベントリスナーを追加
        if (retryButton) retryButton.addEventListener('click', restartGame);
        if (menuButton) menuButton.addEventListener('click', goToMenu);
        if (resumeButton) resumeButton.addEventListener('click', resumeGame);
        if (soundToggleButton) soundToggleButton.addEventListener('click', toggleSound);
        if (quitButton) quitButton.addEventListener('click', goToMenu);
        
        // コントロールボタンのツールチップ追加
        addControlTooltips();
        
        // モジュール初期化（順序が重要）
        Sound.init();
        HUD.init();     // HUDを先に初期化
        Targeting.init();
        Weapons.init();
        Enemies.init();
        Levels.init();

        // 難易度に応じた設定を適用
        applyDifficulty(urlParams.get('difficulty'));
            
        // ゲーム開始
        startGame();
    }



    // 難易度設定を適用する関数を修正
    function applyDifficulty(difficulty) {
        // ローカルストレージに保存
        localStorage.setItem('cyberfense-difficulty', difficulty);
        
        // 難易度に応じてゲームパラメータを調整
        switch (difficulty) {
            case 'easy':
                // 敵の出現間隔を長く、敵の速度と耐久力を下げる
                Enemies.setSpawnInterval(3500);  // 3000から3500に延長
                Enemies.setEnemyMultiplier(0.5); // 0.6から0.5に減少
                playerHealth = 100;              // 初期シールド
                break;
            case 'normal':
                Enemies.setSpawnInterval(2500);  // 2000から2500に延長
                Enemies.setEnemyMultiplier(0.7); // 0.8から0.7に減少
                playerHealth = 100;
                break;
            case 'hard':
                // 敵の出現間隔を短く、敵の速度と耐久力を上げる
                Enemies.setSpawnInterval(2000);  // 1500から2000に延長
                Enemies.setEnemyMultiplier(0.9); // 1.0から0.9に減少
                playerHealth = 90;               // 80から90に増加
                break;
        }
    }
        
    // コントロールボタンにツールチップを追加
    function addControlTooltips() {
        const controlButtons = document.querySelectorAll('.control-button');
        controlButtons.forEach(button => {
            const weaponType = button.getAttribute('data-weapon');
            let tooltip;
            
            switch(weaponType) {
                case 'normal':
                    tooltip = 'バイト型に効果的';
                    break;
                case 'sniper':
                    tooltip = 'ブロック型に効果的';
                    break;
                case 'radar':
                    tooltip = 'ファイアウォール型に効果的';
                    break;
            }
            
            if (tooltip) {
                button.setAttribute('title', tooltip);
                
                // ツールチップ要素作成
                const tooltipElement = document.createElement('div');
                tooltipElement.className = 'tooltip';
                tooltipElement.textContent = tooltip;
                button.appendChild(tooltipElement);
                
                // ホバーイベント
                button.addEventListener('mouseenter', () => {
                    tooltipElement.style.display = 'block';
                });
                
                button.addEventListener('mouseleave', () => {
                    tooltipElement.style.display = 'none';
                });
            }
        });
    }
    
    // ゲーム開始
    function startGame() {
        // 状態リセット
        gameState = 'playing';
        score = 0;
        level = 1;
        playerHealth = 100;
        isPaused = false;
        
        // UI更新
        HUD.updateScore(score);
        HUD.updateLevel(level);
        HUD.updateHealth(playerHealth);
        
        // 初回プレイ時のみヘルプを表示
        if (!localStorage.getItem('cyberfense-played')) {
            setTimeout(() => {
                HUD.showHelpOverlay();
                localStorage.setItem('cyberfense-played', 'true');
            }, 1000);
        }
        
        // 敵クリア
        Enemies.clearAll();
        
        // パネル非表示
        gameOverPanel.classList.add('hidden');
        pausePanel.classList.add('hidden');
        
        // サウンドが準備完了したらBGM再生
        if (Sound.isReady) {
            Sound.isReady().then(() => {
                Sound.playBgm('game_normal');
            }).catch(err => {
                console.error('Error starting BGM:', err);
            });
        } else {
            // 旧バージョン互換性のため
            Sound.playBgm('game_normal');
        }
        
        // ゲームループ開始
        lastFrameTime = performance.now();
        gameLoopId = requestAnimationFrame(gameLoop);
    }
    
    // ゲームループ
    function gameLoop(timestamp) {
        if (isPaused) {
            gameLoopId = requestAnimationFrame(gameLoop);
            return;
        }
        
        // フレーム時間計算
        const deltaTime = timestamp - lastFrameTime;
        lastFrameTime = timestamp;
        
        // 敵の更新と生成
        Enemies.update(deltaTime);
        if (Enemies.shouldSpawnEnemy()) {
            const enemyType = Levels.getRandomEnemyType(level);
            Enemies.spawnEnemy(enemyType, level);
        }
        
        // パワーアップアイテムの更新
        Enemies.updatePowerupItems(Targeting.getReticlePosition());
        
        // 武器の更新
        Weapons.update(deltaTime);
        
        // レベル更新チェック
        if (score >= Levels.getScoreForNextLevel(level)) {
            levelUp();
        }
        
        // ゲームオーバーチェック
        if (playerHealth <= 0) {
            gameOver();
            return;
        }

        // ボス戦状態の確認と調整
        if (isBossFight) {
            // ボスの存在確認
            const bossList = Enemies.getEnemies().filter(enemy => 
                enemy.type === Enemies.ENEMY_TYPES.BOSS
            );
            
            // ボスがいなくなった場合
            if (bossList.length === 0) {
                console.log('ボスがいなくなりました: 通常BGMに戻します');
                isBossFight = false; // フラグをリセット
                
                // レベルに応じたBGMに戻す
                const bgm = level >= 10 ? 'game_intense' : 'game_normal';
                Sound.stopBgm();
                Sound.playBgm(bgm);
            }
        }

        // 次のフレーム要求
        gameLoopId = requestAnimationFrame(gameLoop);
    }
    
    // レベルアップ
    function levelUp() {
        level++;
        HUD.updateLevel(level);
        HUD.showLevelUpMessage();
        Sound.playSfx('level_up');
        
        // ボスレベルチェック
        if (level % 5 === 0) {
            spawnBoss();
        }
        
        // レベルに応じてBGM変更
        if (level >= 10) {
            Sound.playBgm('game_intense');
        }
    }
    
    // ボス出現
    function spawnBoss() {
        console.log('ボス出現イベント開始');
        isBossFight = true; // ボス戦フラグを立てる
        
        // ボスBGM切り替えを強制
        Sound.stopBgm(); // 既存のBGMを停止
        
        // タイムアウトを追加してBGM切り替えを遅延
        setTimeout(() => {
            Sound.playBgm('boss_battle');
            console.log('Boss battle BGM played');
        }, 100);
        
        HUD.showWarningMessage('警告: 強力な敵が接近中');
        
        // ボス出現
        setTimeout(() => {
            Enemies.spawnBoss(level);
            Sound.playSfx('enemy_boss_spawn');
        }, 3000);
    }
    
    
    // 敵撃破時のスコア加算
    function addScore(points) {
        score += points;
        HUD.updateScore(score);
    }
    
    // ダメージ受けた時
    function takeDamage(damage) {
        playerHealth -= damage;
        if (playerHealth < 0) playerHealth = 0;
        HUD.updateHealth(playerHealth);
        
        if (playerHealth <= 30) {
            HUD.showWarningMessage('シールド危険！');
        }
        
        Sound.playSfx('shield_hit');
    }
    
    // シールド回復
    function repairShield(amount) {
        playerHealth = Math.min(100, playerHealth + amount);
        HUD.updateHealth(playerHealth);
    }
    
    // ゲームオーバー
    function gameOver() {
        gameState = 'gameOver';
        cancelAnimationFrame(gameLoopId);
        
        // スコア表示
        finalScoreElement.textContent = score;
        finalLevelElement.textContent = level;
        
        // パネル表示
        gameOverPanel.classList.remove('hidden');
        
        // サウンド
        Sound.stopBgm();
        Sound.playSfx('game_over');
    }
    
    // 一時停止
    function pauseGame() {
        if (gameState !== 'playing') return;
        
        isPaused = true;
        pausePanel.classList.remove('hidden');
        Sound.pauseBgm();
    }
    
    // 再開
    function resumeGame() {
        isPaused = false;
        pausePanel.classList.add('hidden');
        Sound.resumeBgm();
    }
    
    // サウンド切り替え
    function toggleSound() {
        const isMuted = Sound.toggleMute();
        soundToggleButton.textContent = `サウンド: ${isMuted ? 'OFF' : 'ON'}`;
    }
    
    // メニューに戻る
    function goToMenu() {
        cancelAnimationFrame(gameLoopId);
        window.location.href = 'pages/menu.html';
    }
    
    // ゲームリスタート
    function restartGame() {
        startGame();
    }
    
    // キー操作
    function handleKeyDown(e) {
        switch(e.key) {
            case 'Escape':
                if (gameState === 'playing') {
                    if (isPaused) resumeGame();
                    else pauseGame();
                }
                break;
            case '1':
                Weapons.switchWeapon('normal');
                break;
            case '2':
                Weapons.switchWeapon('sniper');
                break;
            case '3':
                Weapons.switchWeapon('radar');
                break;
            case 'h': // ヘルプ表示
                HUD.showHelpOverlay();
                break;
        }
    }
    
    // 公開API
    return {
        init,
        addScore,
        takeDamage,
        repairShield,
        pauseGame,
        resumeGame,
        goToMenu,          // この行を追加
        restartGame,       // こちらも追加しておくと便利
        getScore: () => score,
        getLevel: () => level,
        getHealth: () => playerHealth,
        isPaused: () => isPaused
    };
})();

// ページロード時に初期化
document.addEventListener('DOMContentLoaded', Game.init);