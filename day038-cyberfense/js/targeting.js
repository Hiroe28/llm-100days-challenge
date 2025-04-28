// 照準システム制御
const Targeting = (function() {
    // 定数
    const VIBRATION_NORMAL = 3; // 通常時の振動の強さ
    const VIBRATION_LOCK = 0.5; // ロックオン時の振動の強さ
    
    // DOM要素
    const reticleContainer = document.querySelector('.reticle-container');
    const reticles = document.querySelectorAll('.reticle');
    const hudLock = document.querySelector('.hud-lock');
    
    // 状態変数
    let isLocked = false;
    let activeReticleType = 'normal';
    let targetEnemy = null;
    let mousePosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let reticlePosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    
    // 初期化
    // targeting.js のイベントリスナー部分を修正
    function init() {
        // マウス移動イベントリスナー設定
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('click', handleClick);
        
        // タッチデバイス対応を追加（パッシブオプション指定）
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchstart', handleTouchStart, { passive: false });
        
        // 照準切り替えボタン設定
        const controlButtons = document.querySelectorAll('.control-button');
        controlButtons.forEach(button => {
            button.addEventListener('click', () => {
                const weaponType = button.getAttribute('data-weapon');
                Weapons.switchWeapon(weaponType);
            });
        });
    }

    // targeting.jsのタッチイベント処理を修正
    function handleTouchMove(e) {
        // ヘルプ画面表示中やゲームが一時停止中は処理しない
        if (document.getElementById('help-overlay') || Game.isPaused()) {
            return;
        }
        
        // スクロール防止
        e.preventDefault(); 
        
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            
            // マウス位置を更新
            mousePosition.x = touch.clientX;
            mousePosition.y = touch.clientY;
            
            // 照準位置を即座に更新（モバイルではスムーズさより反応速度優先）
            reticlePosition.x = touch.clientX;
            reticlePosition.y = touch.clientY;
            updateReticlePosition();
        }
    }
      
    
    function handleTouchStart(e) {
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            
            // タッチ位置を更新
            mousePosition.x = touch.clientX;
            mousePosition.y = touch.clientY;
            
            // 照準位置を更新
            animateReticlePosition();
            
            // 武器発射
            Weapons.fire(targetEnemy);
        }
    }
    
    // マウス移動ハンドラ
    function handleMouseMove(e) {
        // マウス位置を更新
        mousePosition.x = e.clientX;
        mousePosition.y = e.clientY;
        
        // 照準位置をなめらかに追従
        animateReticlePosition();
    }
    
    // クリックハンドラ
    function handleClick() {
        // 武器発射
        Weapons.fire(targetEnemy);
    }
    
    // 照準位置のアニメーション
    function animateReticlePosition() {
        // 現在位置と目標位置の差分を計算
        const dx = mousePosition.x - reticlePosition.x;
        const dy = mousePosition.y - reticlePosition.y;
        
        // なめらかに追従（イージング）
        reticlePosition.x += dx * 0.2;
        reticlePosition.y += dy * 0.2;
        
        // 照準の位置を更新
        updateReticlePosition();
    }
    
    // 照準位置の更新
    function updateReticlePosition() {
        reticleContainer.style.left = `${reticlePosition.x}px`;
        reticleContainer.style.top = `${reticlePosition.y}px`;
        reticleContainer.style.transform = 'translate(-50%, -50%)';
    }
    
    // 照準の切り替え
    function switchReticle(type) {
        activeReticleType = type;
        reticles.forEach(reticle => {
            reticle.classList.remove('active');
        });
        document.querySelector(`.reticle-${type}`).classList.add('active');
    }
    
    // 照準とオブジェクトの当たり判定
    function checkCollision(enemy) {
        // 照準の中心座標
        const reticleX = reticlePosition.x;
        const reticleY = reticlePosition.y;
        
        // 照準の半径（タイプによって異なる）
        let hitRadius;
        switch(activeReticleType) {
            case 'normal':
                hitRadius = 40;
                break;
            case 'sniper':
                hitRadius = 15;  // 5から15に増加 - 照準が当たりやすくなる
                break;
            case 'radar':
                hitRadius = 60;
                break;
            default:
                hitRadius = 30;
        }
        
        // 敵との距離を計算
        const dx = reticleX - enemy.x;
        const dy = reticleY - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // ブロック型の敵の場合は判定を緩和
        const enemyHitRadius = enemy.type === 'block' ? enemy.radius * 1.2 : enemy.radius;
        
        // 敵の半径と照準の半径の合計より距離が小さければ当たり
        return distance < (hitRadius + enemyHitRadius);
    }
    
    // 最も近い敵を検出
    function findClosestEnemy(enemies) {
        let closest = null;
        let minDistance = Infinity;
        
        enemies.forEach(enemy => {
            const dx = reticlePosition.x - enemy.x;
            const dy = reticlePosition.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                minDistance = distance;
                closest = enemy;
            }
        });
        
        return closest;
    }
    
    // 照準の敵へのロックオン
    function lockOn(enemy) {
        if (isLocked && targetEnemy === enemy) return;
        
        isLocked = true;
        targetEnemy = enemy;
        
        // ロックオン表示
        reticleContainer.classList.add('locked');
        hudLock.classList.add('visible');
        
        // ロックオン時の振動アニメーション
        reticleContainer.style.animation = 'none';
        reticleContainer.offsetHeight; // リフロー
        reticleContainer.style.animation = `reticle-vibration ${VIBRATION_LOCK}s ease-in-out infinite`;
        
        // 効果音
        Sound.playSfx('lock_on');
    }
    
    // ロックオフ
    function lockOff() {
        if (!isLocked) return;
        
        isLocked = false;
        targetEnemy = null;
        
        // ロックオフ表示
        reticleContainer.classList.remove('locked');
        hudLock.classList.remove('visible');
        
        // 通常の振動に戻す
        reticleContainer.style.animation = 'none';
        reticleContainer.offsetHeight; // リフロー
        reticleContainer.style.animation = `reticle-vibration ${VIBRATION_NORMAL}s ease-in-out infinite`;
    }
    
    // 更新関数
    function update(enemies) {
        // 最も近い敵を検出
        const closestEnemy = findClosestEnemy(enemies);
        
        // 敵がいなければロックオフ
        if (!closestEnemy) {
            lockOff();
            return;
        }
        
        // 敵が照準内にいるかチェック
        if (checkCollision(closestEnemy)) {
            lockOn(closestEnemy);
        } else {
            lockOff();
        }
    }
    
    // 公開API
    return {
        init,
        switchReticle,
        update,
        getReticlePosition: () => reticlePosition,
        getActiveReticleType: () => activeReticleType,
        isLocked: () => isLocked,
        getTargetEnemy: () => targetEnemy
    };
})();