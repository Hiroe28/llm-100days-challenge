// 敵の生成・動作管理
const Enemies = (function() {
    // 敵の種類
    const ENEMY_TYPES = {
        BYTE: 'byte',        // 小さく素早い基本敵
        BLOCK: 'block',      // 耐久力が高い敵
        CLUSTER: 'cluster',  // 撃破すると分裂する敵
        FIREWALL: 'firewall', // シールドを持つ敵
        BOSS: 'boss'         // ボス敵
    };
    
    // 敵の基本属性
    // enemies.jsの敵属性を修正
    // enemies.jsの敵属性を修正
    const ENEMY_ATTRIBUTES = {
        [ENEMY_TYPES.BYTE]: {
            radius: 15,
            speed: 1.5,  // 2.0から1.5に減速
            health: 8,   // 10から8に減少
            color: '#00ffcc',
            points: 100,
            spawnRate: 0.7
        },
        [ENEMY_TYPES.BLOCK]: {
            radius: 25,
            speed: 0.9,  // さらに減速
            health: 15,  // さらにヘルス減少
            color: '#ff6600',
            points: 200,
            spawnRate: 0.5
        },
        [ENEMY_TYPES.CLUSTER]: {
            radius: 30,
            speed: 1.0,  // 1.5から1.0に減速
            health: 20,
            color: '#ffcc00',
            points: 150,
            spawnRate: 0.4,
            childCount: 2  // 3から2に減少
        },
        [ENEMY_TYPES.FIREWALL]: {
            radius: 35,
            speed: 0.8,  // 1.0から0.8に減速
            health: 30,  // 40から30に減少
            shieldHealth: 15, // 20から15に減少
            color: '#cc00ff',
            points: 300,
            spawnRate: 0.3
        },
        [ENEMY_TYPES.BOSS]: {
            radius: 60,
            speed: 0.5,  // 0.8から0.5に減速
            health: 150,  // 200から150に減少
            color: '#ff0033',
            points: 1000,
            spawnRate: 0
        }
    };
    
    // 敵配列
    let enemies = [];
    
    // パワーアップアイテム配列
    let powerupItems = [];
    
    // DOM要素
    let enemiesContainer;
    let effectsContainer;
    
    // 敵生成タイマー
    let lastSpawnTime = 0;
    let SPAWN_INTERVAL = 2000;  // 基本スポーン間隔（ミリ秒）
    let enemyMultiplier = 1.0;  // 敵の能力倍率
    
    // スポーン間隔設定関数
    function setSpawnInterval(interval) {
        SPAWN_INTERVAL = interval;
    }
    
    // 敵の能力倍率設定関数
    function setEnemyMultiplier(multiplier) {
        enemyMultiplier = multiplier;
    }

    
    // 初期化
    function init() {
        enemiesContainer = document.getElementById('enemies-container');
        effectsContainer = document.getElementById('effects-container');
        lastSpawnTime = performance.now();
        powerupItems = [];
    }
    
    // 敵オブジェクト生成
    function createEnemy(type, level) {
        const attr = ENEMY_ATTRIBUTES[type];
        if (!attr) return null;
        
        // レベルと難易度による敵強化
        const levelMultiplier = 1 + (level - 1) * 0.1;
        const health = Math.floor(attr.health * levelMultiplier * enemyMultiplier);
        const speed = attr.speed * (1 + (level - 1) * 0.05) * enemyMultiplier;
        
        // 画面外のランダムな位置に配置
        let x, y;
        const side = Math.floor(Math.random() * 4); // 0: 上, 1: 右, 2: 下, 3: 左
        
        switch(side) {
            case 0: // 上
                x = Math.random() * window.innerWidth;
                y = -attr.radius * 2;
                break;
            case 1: // 右
                x = window.innerWidth + attr.radius * 2;
                y = Math.random() * window.innerHeight;
                break;
            case 2: // 下
                x = Math.random() * window.innerWidth;
                y = window.innerHeight + attr.radius * 2;
                break;
            case 3: // 左
                x = -attr.radius * 2;
                y = Math.random() * window.innerHeight;
                break;
        }
        
        // 敵オブジェクト
        const enemy = {
            id: `enemy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            x,
            y,
            radius: attr.radius,
            speed,
            health,
            maxHealth: health,
            color: attr.color,
            points: attr.points,
            element: null,
            isActive: true,
            hasShield: type === ENEMY_TYPES.FIREWALL,
            shieldHealth: type === ENEMY_TYPES.FIREWALL ? attr.shieldHealth : 0,
            childCount: type === ENEMY_TYPES.CLUSTER ? attr.childCount : 0
        };
        
        // DOM要素作成
        const element = document.createElement('div');
        element.id = enemy.id;
        element.className = `enemy enemy-${type}`;
        element.style.width = `${enemy.radius * 2}px`;
        element.style.height = `${enemy.radius * 2}px`;
        element.style.left = `${enemy.x}px`;
        element.style.top = `${enemy.y}px`;
        
        // 敵タイプを表示する小さなラベルを追加（デバッグ用）
        if (window.location.hash === '#debug') {
            const label = document.createElement('div');
            label.className = 'enemy-label';
            label.textContent = type.toUpperCase();
            element.appendChild(label);
        }
        
        // シールド要素追加
        if (enemy.hasShield) {
            const shield = document.createElement('div');
            shield.className = 'enemy-shield';
            element.appendChild(shield);
        }
        
        // HPバー追加（ボスのみ）
        if (type === ENEMY_TYPES.BOSS) {
            const hpBar = document.createElement('div');
            hpBar.className = 'enemy-hp-bar';
            const hpFill = document.createElement('div');
            hpFill.className = 'enemy-hp-fill';
            hpBar.appendChild(hpFill);
            element.appendChild(hpBar);
        }
        
        // 敵要素を追加
        enemiesContainer.appendChild(element);
        enemy.element = element;
        
        return enemy;
    }
    
    // 敵の出現
    function spawnEnemy(type, level) {
        const enemy = createEnemy(type, level);
        if (enemy) {
            enemies.push(enemy);
            Sound.playSfx('enemy_spawn');
            lastSpawnTime = performance.now();
        }
    }
    
    // ボス敵の出現
    function spawnBoss(level) {
        const boss = createEnemy(ENEMY_TYPES.BOSS, level);
        if (boss) {
            // ボスの位置を画面上部中央に
            boss.x = window.innerWidth / 2;
            boss.y = -boss.radius;
            boss.element.style.left = `${boss.x}px`;
            boss.element.style.top = `${boss.y}px`;
            
            enemies.push(boss);
        }
    }
    
    // 敵の撃破
    function destroyEnemy(enemy, byPlayer = true) {
        // 敵リストから削除
        const index = enemies.indexOf(enemy);
        if (index > -1) {
            enemies.splice(index, 1);
        }
        
        // DOM要素削除
        if (enemy.element && enemy.element.parentNode) {
            enemy.element.classList.add('destroyed');
            setTimeout(() => {
                if (enemy.element.parentNode) {
                    enemy.element.parentNode.removeChild(enemy.element);
                }
            }, 500); // 消滅アニメーション用の遅延
        }
        
        // プレイヤーによる撃破ならスコア加算とパワーアップドロップ
        if (byPlayer) {
            Game.addScore(enemy.points);
            Sound.playSfx(enemy.type === ENEMY_TYPES.BOSS ? 'enemy_boss_destroy' : 'enemy_destroy');
            
            // 一定確率でシールド回復アイテムをドロップ
            if (Math.random() < 0.2 || enemy.type === ENEMY_TYPES.BOSS) { // 10%から20%に増加、ボスは100%
                spawnShieldRepair(enemy.x, enemy.y);
            }
            
            // クラスター型敵の分裂
            if (enemy.type === ENEMY_TYPES.CLUSTER && enemy.childCount > 0) {
                for (let i = 0; i < enemy.childCount; i++) {
                    const angle = (Math.PI * 2 / enemy.childCount) * i;
                    const childEnemy = createEnemy(ENEMY_TYPES.BYTE, Game.getLevel());
                    if (childEnemy) {
                        childEnemy.x = enemy.x + Math.cos(angle) * enemy.radius;
                        childEnemy.y = enemy.y + Math.sin(angle) * enemy.radius;
                        childEnemy.radius = enemy.radius / 2;
                        childEnemy.element.style.width = `${childEnemy.radius * 2}px`;
                        childEnemy.element.style.height = `${childEnemy.radius * 2}px`;
                        childEnemy.element.style.left = `${childEnemy.x}px`;
                        childEnemy.element.style.top = `${childEnemy.y}px`;
                        enemies.push(childEnemy);
                    }
                }
            }
        }
    }
    
    // シールド回復アイテム生成
    function spawnShieldRepair(x, y) {
        // アイテム要素作成
        const shieldRepair = document.createElement('div');
        shieldRepair.className = 'shield-repair-item';
        shieldRepair.style.left = `${x}px`;
        shieldRepair.style.top = `${y}px`;
        
        // ゲームコンテナに追加
        effectsContainer.appendChild(shieldRepair);
        
        // 一定時間後に消去
        const timeoutId = setTimeout(() => {
            removeShieldRepair(shieldRepair);
        }, 5000);
        
        // アイテムデータ
        const item = {
            element: shieldRepair,
            x: x,
            y: y,
            radius: 15,
            timeoutId: timeoutId
        };
        
        // アイテムリストに追加
        powerupItems.push(item);
    }
    
    // シールド回復アイテム消去
    function removeShieldRepair(element) {
        // タイムアウトのクリア
        const itemIndex = powerupItems.findIndex(item => item.element === element);
        if (itemIndex > -1) {
            clearTimeout(powerupItems[itemIndex].timeoutId);
            powerupItems.splice(itemIndex, 1);
        }
        
        // 要素を削除
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }
    
    // パワーアップアイテムの更新
    function updatePowerupItems(reticlePos) {
        powerupItems.forEach(item => {
            // 照準との当たり判定
            const dx = reticlePos.x - item.x;
            const dy = reticlePos.y - item.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < item.radius + 10) { // 照準半径を10とする
                // アイテム効果（シールド回復）
                const repairAmount = 20; // 20%回復
                Game.repairShield(repairAmount);
                
                // 効果音
                Sound.playSfx('powerup');
                
                // 通知
                HUD.showShieldRepairMessage(repairAmount);
                
                // アイテム消去
                removeShieldRepair(item.element);
            }
        });
    }
    
    // 敵へのダメージ
    function damageEnemy(enemy, damage, weaponType) {
        if (!enemy || !enemy.isActive) return false;
        
        let isDead = false;
        
        // シールドがあればそれに先にダメージ
        if (enemy.hasShield && enemy.shieldHealth > 0) {
            // レーダー型はシールドに効果的
            const shieldDamage = weaponType === 'radar' ? damage * 2 : damage;
            enemy.shieldHealth -= shieldDamage;
            
            if (enemy.shieldHealth <= 0) {
                enemy.hasShield = false;
                enemy.element.querySelector('.enemy-shield').classList.add('broken');
            }
        } else {
            // スナイパー型はブロック型に効果的（効果をさらに高める）
            let finalDamage = damage;
            if (weaponType === 'sniper' && enemy.type === ENEMY_TYPES.BLOCK) {
                finalDamage *= 3;  // 2から3に増加
                console.log("ブロック型に効果的な攻撃: " + finalDamage + "ダメージ");
            }
            // 通常型はバイト型に効果的
            else if (weaponType === 'normal' && enemy.type === ENEMY_TYPES.BYTE) {
                finalDamage *= 1.5;
            }
            // レーダー型もブロック型に若干効果的に
            else if (weaponType === 'radar' && enemy.type === ENEMY_TYPES.BLOCK) {
                finalDamage *= 1.3;
            }
            
            enemy.health -= finalDamage;
            
            // HPバー更新（ボスのみ）
            if (enemy.type === ENEMY_TYPES.BOSS && enemy.element.querySelector('.enemy-hp-fill')) {
                const healthPercent = Math.max(0, enemy.health / enemy.maxHealth * 100);
                enemy.element.querySelector('.enemy-hp-fill').style.width = `${healthPercent}%`;
            }
            
            // 撃破判定
            if (enemy.health <= 0) {
                destroyEnemy(enemy);
                isDead = true;
            } else {
                // ヒットエフェクト
                enemy.element.classList.add('hit');
                setTimeout(() => {
                    if (enemy.element) {
                        enemy.element.classList.remove('hit');
                    }
                }, 100);
                
                Sound.playSfx('enemy_hit');
            }
        }
        
        return isDead;
    }
    
    // すべての敵をクリア
    function clearAll() {
        enemies.forEach(enemy => {
            if (enemy.element && enemy.element.parentNode) {
                enemy.element.parentNode.removeChild(enemy.element);
            }
        });
        enemies = [];
        
        // パワーアップアイテムもクリア
        powerupItems.forEach(item => {
            clearTimeout(item.timeoutId);
            if (item.element && item.element.parentNode) {
                item.element.parentNode.removeChild(item.element);
            }
        });
        powerupItems = [];
    }
    
    // 敵出現チェック
    function shouldSpawnEnemy() {
        // 前回の出現から一定時間経過したかチェック
        const now = performance.now();
        const timeSinceLastSpawn = now - lastSpawnTime;
        
        // レベルに応じてスポーン間隔調整
        const level = Game.getLevel();
        const adjustedInterval = SPAWN_INTERVAL / (1 + (level - 1) * 0.1);
        
        return timeSinceLastSpawn > adjustedInterval;
    }
    
    // 敵の更新
    function update(deltaTime) {
        // 照準と敵の当たり判定
        Targeting.update(enemies);
        
        // 各敵の移動と衝突判定
        enemies.forEach(enemy => {
            if (!enemy.isActive) return;
            
            // ボス型の場合は特殊な動き
            if (enemy.type === ENEMY_TYPES.BOSS) {
                // ボスの特殊な動き
                updateBossMovement(enemy, deltaTime);
            } else {
                // 通常の敵の動き
                // 移動先の計算（画面中央に向かう）
                const centerX = window.innerWidth / 2;
                const centerY = window.innerHeight / 2;
                
                const dx = centerX - enemy.x;
                const dy = centerY - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // 正規化して速度を掛ける
                let moveX = 0;
                let moveY = 0;
                
                if (distance > 0) {
                    moveX = (dx / distance) * enemy.speed;
                    moveY = (dy / distance) * enemy.speed;
                }
                
                // 位置更新
                enemy.x += moveX;
                enemy.y += moveY;
            }
            
            // DOM要素の位置更新
            enemy.element.style.left = `${enemy.x}px`;
            enemy.element.style.top = `${enemy.y}px`;
            
            // 中央に到達したらプレイヤーにダメージ
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const distanceToCenter = Math.sqrt(
                Math.pow(enemy.x - centerX, 2) + 
                Math.pow(enemy.y - centerY, 2)
            );
            
            if (distanceToCenter < 50) {
                Game.takeDamage(10);
                destroyEnemy(enemy, false);
            }
        });
    }



    // ボスの動きを管理する新しい関数
    function updateBossMovement(boss, deltaTime) {
        // ボスに移動パターンプロパティがなければ初期化
        if (!boss.movementPattern) {
            boss.movementPattern = 'approach';
            boss.movementTimer = 0;
            boss.targetX = window.innerWidth / 2;
            boss.targetY = window.innerHeight / 2;
            boss.orbitAngle = 0;
            boss.attackCooldown = 0;
        }
        
        // 中央座標
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // 移動タイマーを更新
        boss.movementTimer += deltaTime;
        boss.attackCooldown -= deltaTime;
        
        // 中央からの距離
        const distanceToCenter = Math.sqrt(
            Math.pow(boss.x - centerX, 2) + 
            Math.pow(boss.y - centerY, 2)
        );
        
        // 移動パターンに基づいて動作
        switch (boss.movementPattern) {
            case 'approach':
                // 中央に向かって接近
                if (distanceToCenter > 200) {
                    const dx = centerX - boss.x;
                    const dy = centerY - boss.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    boss.x += (dx / dist) * boss.speed;
                    boss.y += (dy / dist) * boss.speed;
                } else {
                    // 一定距離まで近づいたら周回パターンに変更
                    boss.movementPattern = 'orbit';
                    boss.orbitAngle = Math.atan2(boss.y - centerY, boss.x - centerX);
                }
                break;
                
            case 'orbit':
                // 中央を周回
                boss.orbitAngle += 0.001 * deltaTime;
                const orbitRadius = 200;
                boss.x = centerX + Math.cos(boss.orbitAngle) * orbitRadius;
                boss.y = centerY + Math.sin(boss.orbitAngle) * orbitRadius;
                
                // 一定時間ごとに攻撃
                if (boss.attackCooldown <= 0) {
                    // 攻撃パターンに切り替え
                    boss.movementPattern = 'attack';
                    boss.attackCooldown = 5000; // 5秒のクールダウン
                    
                    // プレイヤーの位置に向かって急速に移動する目標を設定
                    boss.targetX = centerX;
                    boss.targetY = centerY;
                }
                break;
                
            case 'attack':
                // 中央に向かって素早く突進
                const dx = boss.targetX - boss.x;
                const dy = boss.targetY - boss.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 10) {
                    boss.x += (dx / dist) * boss.speed * 3; // 通常の3倍の速度
                    boss.y += (dy / dist) * boss.speed * 3;
                } else {
                    // 攻撃が終わったら周回に戻る
                    boss.movementPattern = 'orbit';
                }
                break;
        }
    }
    
    // 公開APIに新しい関数を追加
    return {
        init,
        spawnEnemy,
        spawnBoss,
        damageEnemy,
        clearAll,
        update,
        updatePowerupItems,
        shouldSpawnEnemy,
        getEnemies: () => enemies,
        setSpawnInterval,
        setEnemyMultiplier,
        ENEMY_TYPES
    };
})();