// 武器タイプと攻撃ロジック
const Weapons = (function() {
    // 武器タイプ
    const WEAPON_TYPES = {
        NORMAL: 'normal',    // 通常攻撃（広範囲・低威力）
        SNIPER: 'sniper',    // 精密攻撃（狭範囲・高威力）
        RADAR: 'radar'       // 範囲攻撃（全方向・中威力）
    };
    
    // 武器の基本属性
    // weapons.jsの武器属性を修正
    const WEAPON_ATTRIBUTES = {
        [WEAPON_TYPES.NORMAL]: {
            damage: 8,      // 5から8に増加
            fireRate: 200,
            ammo: 30,
            reloadTime: 800,
            range: 40,
            effectClass: 'effect-normal'
        },
        [WEAPON_TYPES.SNIPER]: {
            damage: 25,     // 20から25に増加
            fireRate: 800,
            ammo: 10,
            reloadTime: 1000,
            range: 5,
            effectClass: 'effect-sniper'
        },
        [WEAPON_TYPES.RADAR]: {
            damage: 15,     // 12から15に増加
            fireRate: 0,
            chargeTime: 1000, // 1200から1000に短縮
            ammo: 5,
            reloadTime: 1500,
            range: 90,
            effectClass: 'effect-radar'
        }
    };
    
    // 現在の武器状態
    let currentWeapon = WEAPON_TYPES.NORMAL;
    let ammo = {};
    let lastFireTime = 0;
    let isReloading = false;
    let reloadTimeoutId = null;
    let chargeLevel = 0;
    let isCharging = false;
    let chargeStartTime = 0;
    
    // DOM要素
    let effectsContainer;
    
    // 初期化
    function init() {
        effectsContainer = document.getElementById('effects-container');
        
        // 弾薬初期化
        Object.keys(WEAPON_TYPES).forEach(key => {
            const type = WEAPON_TYPES[key];
            ammo[type] = WEAPON_ATTRIBUTES[type].ammo;
        });
        
        // UI更新
        updateAmmoDisplay();
        
        // リロードボタンを追加
        addReloadButton();
        
        // キーボードイベント追加
        window.addEventListener('keydown', (e) => {
            if (e.key === 'r' || e.key === 'R' || e.key === '4') {
                reload();
            }
        });
    }
    
    // リロードボタン追加関数
    function addReloadButton() {
        const reloadButton = document.createElement('button');
        reloadButton.className = 'reload-button';
        reloadButton.textContent = 'R';
        reloadButton.addEventListener('click', reload);
        document.getElementById('game-container').appendChild(reloadButton);
    }
    
    
    // 武器切り替え
    function switchWeapon(type) {
        if (!WEAPON_ATTRIBUTES[type]) return;
        
        // リロード中なら中断
        if (isReloading) {
            clearTimeout(reloadTimeoutId);
            isReloading = false;
        }
        
        // チャージ中なら中断
        if (isCharging) {
            isCharging = false;
            chargeLevel = 0;
            updateChargeDisplay();
        }
        
        // 武器切り替え
        currentWeapon = type;
        
        // 照準変更
        Targeting.switchReticle(type);
        
        // UI更新
        HUD.updateWeapon(type);
        updateAmmoDisplay();
        
        // 効果音
        Sound.playSfx('weapon_switch');
    }
    
    // 発射処理の修正（自動リロード部分を削除）
    function fire(targetEnemy) {
        // ゲームが一時停止中なら発射しない
        if (Game.isPaused()) return;
        
        // リロード中なら発射不可
        if (isReloading) return;
        
        // 弾切れチェック
        if (ammo[currentWeapon] <= 0) {
            // 自動リロードを削除し、弾切れメッセージを表示
            HUD.showStatusMessage('弾切れです。リロードしてください。', 1500);
            Sound.playSfx('weapon_empty');
            return;
        }
        
        // 発射間隔チェック
        const now = performance.now();
        const timeSinceLastFire = now - lastFireTime;
        const attr = WEAPON_ATTRIBUTES[currentWeapon];
        
        // レーダー型はチャージ式処理
        if (currentWeapon === WEAPON_TYPES.RADAR) {
            if (!isCharging) {
                // チャージ開始
                startCharging();
                return;
            } else {
                // チャージ完了チェック
                const chargeTime = now - chargeStartTime;
                if (chargeTime < attr.chargeTime) {
                    // チャージ中
                    chargeLevel = chargeTime / attr.chargeTime;
                    updateChargeDisplay();
                    return;
                } else {
                    // チャージ完了、発射処理
                    fireRadar();
                    resetCharge();
                    return;
                }
            }
        }
        
        // 通常とスナイパーは発射間隔チェック
        if (timeSinceLastFire < attr.fireRate) return;
        
        // 弾薬消費
        ammo[currentWeapon]--;
        updateAmmoDisplay();
        
        // 発射時間更新
        lastFireTime = now;
        
        // 効果音
        if (currentWeapon === WEAPON_TYPES.NORMAL) {
            Sound.playSfx('weapon_normal');
        } else if (currentWeapon === WEAPON_TYPES.SNIPER) {
            Sound.playSfx('weapon_sniper');
        }
        
        // 発射エフェクト
        createFireEffect();
        
        // ターゲットにダメージ
        // ターゲットがロックされていなくても、照準範囲内の敵にダメージを与える
        const reticlePos = Targeting.getReticlePosition();
        const enemies = Enemies.getEnemies();
        let hitAny = false;

        // 照準範囲を取得
        let hitRadius;
        switch(currentWeapon) {
            case WEAPON_TYPES.NORMAL:
                hitRadius = 40;
                break;
            case WEAPON_TYPES.SNIPER:
                hitRadius = 15; // スナイパーの判定範囲を広げる
                break;
            case WEAPON_TYPES.RADAR:
                hitRadius = 60;
                break;
            default:
                hitRadius = 30;
        }

        // 照準範囲内の敵を探して攻撃
        enemies.forEach(enemy => {
            const dx = reticlePos.x - enemy.x;
            const dy = reticlePos.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // ブロック型の場合は判定範囲を広げる（ENEMY_TYPESの代わりに直接'block'を使用）
            const enemyRadius = enemy.type === 'block' ? enemy.radius * 1.2 : enemy.radius;
            
            if (distance < (hitRadius + enemyRadius)) {
                hitAny = true;
                Enemies.damageEnemy(enemy, attr.damage, currentWeapon);
            }
        });

        // ターゲットがロックされている場合は確実にダメージ
        if (targetEnemy && !hitAny) {
            Enemies.damageEnemy(targetEnemy, attr.damage, currentWeapon);
        }
        
        // 弾切れチェックとリロード
        if (ammo[currentWeapon] <= 0) {
            reload();
        }
    }
    
    // レーダー型発射処理
    function fireRadar() {
        // 弾薬消費
        ammo[currentWeapon]--;
        updateAmmoDisplay();
        
        // 効果音
        Sound.playSfx('weapon_radar_fire');
        
        // 発射エフェクト（全方向）
        createRadarEffect();
        
        // 範囲内の全敵にダメージ
        const attr = WEAPON_ATTRIBUTES[WEAPON_TYPES.RADAR];
        const reticlePos = Targeting.getReticlePosition();
        const enemies = Enemies.getEnemies();
        
        enemies.forEach(enemy => {
            const dx = enemy.x - reticlePos.x;
            const dy = enemy.y - reticlePos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= attr.range * 4) { // 範囲を拡大（3から4に）
                // 距離による減衰を緩和
                const damageFactor = 1 - (distance / (attr.range * 4)) * 0.7; // 減衰を0.7に設定
                const damage = Math.floor(attr.damage * damageFactor * (1 + chargeLevel));
                
                if (damage > 0) {
                    Enemies.damageEnemy(enemy, damage, WEAPON_TYPES.RADAR);
                }
            }
        });
        
        // 弾切れチェックとリロード
        if (ammo[WEAPON_TYPES.RADAR] <= 0) {
            reload();
        }
    }
    
    // チャージ開始
    function startCharging() {
        isCharging = true;
        chargeStartTime = performance.now();
        chargeLevel = 0;
        updateChargeDisplay();
        
        // チャージ効果音
        Sound.playSfx('weapon_radar_charge');
    }
    
    // チャージリセット
    function resetCharge() {
        isCharging = false;
        chargeLevel = 0;
        updateChargeDisplay();
    }
    
    // チャージ表示更新
    function updateChargeDisplay() {
        const chargeBar = document.querySelector('.hud-charge-fill');
        if (chargeBar) {
            chargeBar.style.width = `${chargeLevel * 100}%`;
        }
    }
    
    // 弾薬表示更新
    function updateAmmoDisplay() {
        // HUDが初期化されているか確認
        if (HUD.isInitialized()) {
            const attr = WEAPON_ATTRIBUTES[currentWeapon];
            HUD.updateAmmo(ammo[currentWeapon], attr.ammo);
        }
    }
    
    // リロード処理
    function reload() {
        if (isReloading) return;
        
        isReloading = true;
        const attr = WEAPON_ATTRIBUTES[currentWeapon];
        
        // リロード効果音
        Sound.playSfx('reload');
        
        // リロード表示
        HUD.showReloadMessage();
        
        // リロード完了タイマー
        reloadTimeoutId = setTimeout(() => {
            ammo[currentWeapon] = attr.ammo;
            isReloading = false;
            updateAmmoDisplay();
        }, attr.reloadTime);
    }
    
    // 発射エフェクト作成
    function createFireEffect() {
        const attr = WEAPON_ATTRIBUTES[currentWeapon];
        const reticlePos = Targeting.getReticlePosition();
        
        const effect = document.createElement('div');
        effect.className = `weapon-effect ${attr.effectClass}`;
        
        effect.style.left = `${reticlePos.x}px`;
        effect.style.top = `${reticlePos.y}px`;
        
        effectsContainer.appendChild(effect);
        
        // エフェクト消去タイマー
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 300);
    }
    
    // レーダーエフェクト作成
    function createRadarEffect() {
        const reticlePos = Targeting.getReticlePosition();
        
        const effect = document.createElement('div');
        effect.className = 'weapon-effect effect-radar-pulse';
        
        effect.style.left = `${reticlePos.x}px`;
        effect.style.top = `${reticlePos.y}px`;
        
        effectsContainer.appendChild(effect);
        
        // エフェクト消去タイマー
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 500);
    }
    
    // 更新処理
    function update(deltaTime) {
        // チャージ中なら更新
        if (isCharging) {
            const now = performance.now();
            const attr = WEAPON_ATTRIBUTES[WEAPON_TYPES.RADAR];
            const chargeTime = now - chargeStartTime;
            
            // チャージレベル更新
            chargeLevel = Math.min(1, chargeTime / attr.chargeTime);
            updateChargeDisplay();
            
            // 完全チャージで自動発射
            if (chargeLevel >= 1) {
                fireRadar();
                resetCharge();
            }
        }
    }
    
    // 公開API
    return {
        init,
        switchWeapon,
        fire,
        reload,
        update,
        getCurrentWeapon: () => currentWeapon,
        getAmmo: () => ammo[currentWeapon],
        getMaxAmmo: () => WEAPON_ATTRIBUTES[currentWeapon].ammo,
        isReloading: () => isReloading,
        WEAPON_TYPES,
        WEAPON_ATTRIBUTES   // ★ 追加
    };
})();