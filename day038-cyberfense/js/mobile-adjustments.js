// スマホ向け調整コード
// モバイル向けに調整が必要な場合のみこの変更を適用します

// モバイル検出関数
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  
  // モバイルの場合のみ調整を適用
  if (isMobile()) {
    console.log("モバイルデバイスを検出しました。モバイル向け調整を適用します。");
    
    // 1. 照準サイズと判定範囲を拡大（Targeting モジュールを修正）
    Targeting.switchReticle = function(type) {
      activeReticleType = type;
      reticles.forEach(reticle => {
        reticle.classList.remove('active');
      });
      document.querySelector(`.reticle-${type}`).classList.add('active');
      
      // スマホ用に照準を大きく表示
      const reticleContainer = document.querySelector('.reticle-container');
      if (reticleContainer) {
        if (type === 'sniper') {
          reticleContainer.style.transform = 'scale(1.5) translate(-33%, -33%)';
        } else {
          reticleContainer.style.transform = 'scale(1.2) translate(-42%, -42%)';
        }
      }
    };
    
    // 2. 敵のスピードを遅くする
    const originalEnemyUpdate = Enemies.update;
    Enemies.update = function(deltaTime) {
      // デルタタイムを0.7倍に（敵の動きが30%遅くなる）
      originalEnemyUpdate(deltaTime * 0.7);
    };
    
    // 3. 敵のHPを減らす
    const originalDamageEnemy = Enemies.damageEnemy;
    Enemies.damageEnemy = function(enemy, damage, weaponType) {
      // 与えるダメージを1.5倍に
      return originalDamageEnemy(enemy, damage * 1.5, weaponType);
    };
    
    // 4. 照準判定をさらに強化
    const originalCheckCollision = Targeting.checkCollision;
    Targeting.checkCollision = function(enemy) {
      // 照準の中心座標
      const reticleX = reticlePosition.x;
      const reticleY = reticlePosition.y;
      
      // 照準の半径（タイプによって異なる）
      let hitRadius;
      switch(activeReticleType) {
        case 'normal':
          hitRadius = 50;  // 40から50に増加
          break;
        case 'sniper':
          hitRadius = 25;  // 15から25に増加
          break;
        case 'radar':
          hitRadius = 70;  // 60から70に増加
          break;
        default:
          hitRadius = 40;
      }
      
      // 敵との距離を計算
      const dx = reticleX - enemy.x;
      const dy = reticleY - enemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // すべての敵タイプの判定を緩和
      const enemyHitRadius = enemy.radius * 1.3;
      
      // 敵の半径と照準の半径の合計より距離が小さければ当たり
      return distance < (hitRadius + enemyHitRadius);
    };
    
    // 5. 武器のダメージを大きく
    Weapons.WEAPON_ATTRIBUTES[Weapons.WEAPON_TYPES.NORMAL].damage = 12;  // 8から12に
    Weapons.WEAPON_ATTRIBUTES[Weapons.WEAPON_TYPES.SNIPER].damage = 40;  // 25から40に
    Weapons.WEAPON_ATTRIBUTES[Weapons.WEAPON_TYPES.RADAR].damage = 25;   // 15から25に
    
    // 6. レベルアップのスコア要件を緩和（Levels モジュールを直接修正）
    if (Levels.getScoreForNextLevel) {
      const originalGetScoreForNextLevel = Levels.getScoreForNextLevel;
      Levels.getScoreForNextLevel = function(currentLevel) {
        // 必要スコアを0.7倍に
        return Math.floor(originalGetScoreForNextLevel(currentLevel) * 0.7);
      };
    }
    
    console.log("モバイル向け調整が完了しました！");
  }