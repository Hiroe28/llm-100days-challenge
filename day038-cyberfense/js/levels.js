// レベルデザインと難易度管理
const Levels = (function() {
    // レベルごとのスコア要件
    const LEVEL_SCORE_REQUIREMENTS = [
        0,      // レベル1（開始時）
        500,   // レベル2
        1000,   // レベル3
        2000,   // レベル4
        5000,  // レベル5（ボス1）
        7000,  // レベル6
        8000,  // レベル7
        10000,  // レベル8
        12000,  // レベル9
        14000,  // レベル10（ボス2）
        17000,  // 以降、5000ずつ増加
    ];
    
    // レベルごとの敵出現率テーブル
    const ENEMY_SPAWN_RATES = [
        // レベル1
        {
            [Enemies.ENEMY_TYPES.BYTE]: 1.0,
            [Enemies.ENEMY_TYPES.BLOCK]: 0.0,
            [Enemies.ENEMY_TYPES.CLUSTER]: 0.0,
            [Enemies.ENEMY_TYPES.FIREWALL]: 0.0
        },
        // レベル2
        {
            [Enemies.ENEMY_TYPES.BYTE]: 0.8,
            [Enemies.ENEMY_TYPES.BLOCK]: 0.2,
            [Enemies.ENEMY_TYPES.CLUSTER]: 0.0,
            [Enemies.ENEMY_TYPES.FIREWALL]: 0.0
        },
        // レベル3
        {
            [Enemies.ENEMY_TYPES.BYTE]: 0.7,
            [Enemies.ENEMY_TYPES.BLOCK]: 0.2,
            [Enemies.ENEMY_TYPES.CLUSTER]: 0.1,
            [Enemies.ENEMY_TYPES.FIREWALL]: 0.0
        },
        // レベル4
        {
            [Enemies.ENEMY_TYPES.BYTE]: 0.6,
            [Enemies.ENEMY_TYPES.BLOCK]: 0.3,
            [Enemies.ENEMY_TYPES.CLUSTER]: 0.1,
            [Enemies.ENEMY_TYPES.FIREWALL]: 0.0
        },
        // レベル5（ボス1）
        {
            [Enemies.ENEMY_TYPES.BYTE]: 0.5,
            [Enemies.ENEMY_TYPES.BLOCK]: 0.3,
            [Enemies.ENEMY_TYPES.CLUSTER]: 0.2,
            [Enemies.ENEMY_TYPES.FIREWALL]: 0.0
        },
        // レベル6
        {
            [Enemies.ENEMY_TYPES.BYTE]: 0.5,
            [Enemies.ENEMY_TYPES.BLOCK]: 0.3,
            [Enemies.ENEMY_TYPES.CLUSTER]: 0.1,
            [Enemies.ENEMY_TYPES.FIREWALL]: 0.1
        },
        // レベル7
        {
            [Enemies.ENEMY_TYPES.BYTE]: 0.4,
            [Enemies.ENEMY_TYPES.BLOCK]: 0.3,
            [Enemies.ENEMY_TYPES.CLUSTER]: 0.2,
            [Enemies.ENEMY_TYPES.FIREWALL]: 0.1
        },
        // レベル8
        {
            [Enemies.ENEMY_TYPES.BYTE]: 0.3,
            [Enemies.ENEMY_TYPES.BLOCK]: 0.3,
            [Enemies.ENEMY_TYPES.CLUSTER]: 0.2,
            [Enemies.ENEMY_TYPES.FIREWALL]: 0.2
        },
        // レベル9
        {
            [Enemies.ENEMY_TYPES.BYTE]: 0.2,
            [Enemies.ENEMY_TYPES.BLOCK]: 0.3,
            [Enemies.ENEMY_TYPES.CLUSTER]: 0.3,
            [Enemies.ENEMY_TYPES.FIREWALL]: 0.2
        },
        // レベル10（ボス2）
        {
            [Enemies.ENEMY_TYPES.BYTE]: 0.2,
            [Enemies.ENEMY_TYPES.BLOCK]: 0.2,
            [Enemies.ENEMY_TYPES.CLUSTER]: 0.3,
            [Enemies.ENEMY_TYPES.FIREWALL]: 0.3
        }
    ];
    
    // パワーアップタイプ
    const POWERUP_TYPES = {
        ATTACK_BOOST: 'attack_boost',
        RELOAD_SPEED: 'reload_speed',
        AMMO_REFILL: 'ammo_refill',
        SHIELD_REPAIR: 'shield_repair',
        SCREEN_CLEAR: 'screen_clear',
        TIME_SLOW: 'time_slow'
    };
    
    // 初期化
    function init() {
        // 特に初期化が必要な処理はない
    }
    
    // レベルに基づく敵タイプをランダムに選択
    function getRandomEnemyType(level) {
        // レベルが範囲外の場合は最大レベルの設定を使用
        const levelIndex = Math.min(level - 1, ENEMY_SPAWN_RATES.length - 1);
        const spawnRates = ENEMY_SPAWN_RATES[levelIndex];
        
        // 重み付き抽選
        const rand = Math.random();
        let cumulativeRate = 0;
        
        for (const type in spawnRates) {
            cumulativeRate += spawnRates[type];
            if (rand < cumulativeRate) {
                return type;
            }
        }
        
        // デフォルト
        return Enemies.ENEMY_TYPES.BYTE;
    }
    
    // 次のレベルに必要なスコアを取得
    function getScoreForNextLevel(currentLevel) {
        // 定義済みのレベル要件を超える場合は計算式で生成
        if (currentLevel >= LEVEL_SCORE_REQUIREMENTS.length) {
            // 最後の定義済み要件 + 5000ずつ増加
            return LEVEL_SCORE_REQUIREMENTS[LEVEL_SCORE_REQUIREMENTS.length - 1] + 
                  (currentLevel - LEVEL_SCORE_REQUIREMENTS.length + 1) * 5000;
        }
        
        return LEVEL_SCORE_REQUIREMENTS[currentLevel];
    }
    
    // ランダムなパワーアップを生成
    function getRandomPowerupType() {
        const types = Object.values(POWERUP_TYPES);
        const randIndex = Math.floor(Math.random() * types.length);
        return types[randIndex];
    }
    
    // 公開API
    return {
        init,
        getRandomEnemyType,
        getScoreForNextLevel,
        getRandomPowerupType,
        POWERUP_TYPES
    };
})();