// データファイル: 素材、レシピ、採取場所のデータを定義

// Ingredients data
const ingredients = [
    { id: 1, name: "魔法の花", image: "images/ingredients/magic_flower.png", property: "magic", stock: 2, price: 50 },
    { id: 2, name: "輝く結晶", image: "images/ingredients/shining_crystal.png", property: "light", stock: 1, price: 80 },
    { id: 3, name: "神秘の水", image: "images/ingredients/mystic_water.png", property: "water", stock: 3, price: 40 },
    { id: 4, name: "古代の化石", image: "images/ingredients/ancient_fossil.png", property: "earth", stock: 1, price: 100 },
    { id: 5, name: "炎のエキス", image: "images/ingredients/flame_essence.png", property: "fire", stock: 2, price: 70 },
    { id: 6, name: "星の砂", image: "images/ingredients/star_sand.png", property: "star", stock: 1, price: 90 },
    { id: 7, name: "霧の結晶", image: "images/ingredients/fog_crystal.png", property: "air", stock: 2, price: 60 },
    { id: 8, name: "月光の露", image: "images/ingredients/moonlight_dew.png", property: "moon", stock: 1, price: 110 },
    { id: 9, name: "夢の断片", image: "images/ingredients/dream_fragment.png", property: "dream", stock: 0, price: 130 },
    { id: 10, name: "竜の鱗", image: "images/ingredients/dragon_scale.png", property: "dragon", stock: 0, price: 200 },
    { id: 11, name: "精霊の涙", image: "images/ingredients/spirit_tear.png", property: "spirit", stock: 0, price: 150 },
    { id: 12, name: "黄金の砂", image: "images/ingredients/golden_sand.png", property: "gold", stock: 0, price: 180 }
];

// Result items data
const resultItems = [
    { 
        id: 1, 
        name: "輝きのポーション", 
        image: "images/results/shining_potion.png", 
        description: "飲むと体に光が宿り、一時的に明るく輝きます。夜間の冒険に最適。",
        requires: [2, 3], // 輝く結晶, 神秘の水
        value: 150,
        discovered: false, // 実際に作ったかどうか
        known: true // 知識として知っているかどうか（初期から知っている）
    },
    { 
        id: 2, 
        name: "炎の宝石", 
        image: "images/results/fire_gem.png", 
        description: "永遠に燃え続ける小さな宝石。寒い夜の明かりや調理に使えます。",
        requires: [5, 4, 2], // 炎のエキス, 古代の化石, 輝く結晶
        value: 300,
        discovered: false,
        known: false
    },
    { 
        id: 3, 
        name: "夢見の香水", 
        image: "images/results/dream_perfume.png", 
        description: "この香水を嗅ぐと、美しい夢を見ることができます。不眠症にも効果的。",
        requires: [9, 1, 3], // 夢の断片, 魔法の花, 神秘の水
        value: 220,
        discovered: false,
        known: false
    },
    { 
        id: 4, 
        name: "治癒の霊薬", 
        image: "images/results/healing_elixir.png", 
        description: "傷を素早く治し、疲労を回復させる万能薬。冒険者の必需品。",
        requires: [1, 3, 6], // 魔法の花, 神秘の水, 星の砂
        value: 250,
        discovered: false,
        known: false
    },
    { 
        id: 5, 
        name: "フワフワクッキー", 
        image: "images/results/fluffy_cookie.png", 
        description: "食べると数分間空中に浮かぶことができる不思議なクッキー。",
        requires: [7, 6, 1], // 霧の結晶, 星の砂, 魔法の花
        value: 120,
        discovered: false,
        known: false
    },
    { 
        id: 6, 
        name: "月の涙", 
        image: "images/results/moon_tear.png", 
        description: "月の光を閉じ込めた美しい宝石。暗闇で淡く光り、方向を示します。",
        requires: [8, 2, 4], // 月光の露, 輝く結晶, 古代の化石
        value: 280,
        discovered: false,
        known: false
    },
    { 
        id: 7, 
        name: "時の砂時計", 
        image: "images/results/time_hourglass.png", 
        description: "周囲の時間をわずかに遅くする不思議な砂時計。危険な状況で役立ちます。",
        requires: [6, 4, 8], // 星の砂, 古代の化石, 月光の露
        value: 350,
        discovered: false,
        known: false
    },
    { 
        id: 8, 
        name: "虹色のインク", 
        image: "images/results/rainbow_ink.png", 
        description: "書くと色が変わる魔法のインク。特別な手紙や魔法の書物に使われます。",
        requires: [1, 2, 5], // 魔法の花, 輝く結晶, 炎のエキス
        value: 180,
        discovered: false,
        known: false
    },
    { 
        id: 9, 
        name: "幻影の鏡", 
        image: "images/results/phantom_mirror.png", 
        description: "のぞき込むと別の場所や過去を映し出す神秘的な鏡。",
        requires: [9, 8, 2], // 夢の断片, 月光の露, 輝く結晶
        value: 320,
        discovered: false,
        known: false
    },
    { 
        id: 10, 
        name: "元素の結晶", 
        image: "images/results/elemental_crystal.png", 
        description: "四元素の力を秘めた強力な結晶。高度な魔法の触媒として使えます。",
        requires: [5, 3, 7, 4], // 炎のエキス, 神秘の水, 霧の結晶, 古代の化石
        value: 500,
        discovered: false,
        known: false
    },
    { 
        id: 11, 
        name: "忘却の飲み物", 
        image: "images/results/oblivion_drink.png", 
        description: "飲むと一時的に悩みを忘れ、穏やかな気持ちになります。副作用はありません。",
        requires: [3, 9, 7], // 神秘の水, 夢の断片, 霧の結晶
        value: 200,
        discovered: false,
        known: false
    },
    { 
        id: 12, 
        name: "星屑のアクセサリー", 
        image: "images/results/stardust_accessory.png", 
        description: "身につけると幸運が訪れるといわれる星の粉で作られたアクセサリー。",
        requires: [6, 2, 9], // 星の砂, 輝く結晶, 夢の断片
        value: 280,
        discovered: false,
        known: false
    },
    { 
        id: 13, 
        name: "竜の心臓", 
        image: "images/results/dragon_heart.png", 
        description: "竜の力が宿った神秘的な宝石。持ち主に勇気と力を与えます。",
        requires: [10, 5, 4], // 竜の鱗, 炎のエキス, 古代の化石
        value: 450,
        discovered: false,
        known: false
    },
    { 
        id: 14, 
        name: "精霊のランプ", 
        image: "images/results/spirit_lamp.png", 
        description: "小さな精霊が住むランプ。暗闇を照らし、時々持ち主に幸運をもたらします。",
        requires: [11, 2, 8], // 精霊の涙, 輝く結晶, 月光の露
        value: 380,
        discovered: false,
        known: false
    },
    { 
        id: 15, 
        name: "黄金の砂時計", 
        image: "images/results/golden_hourglass.png", 
        description: "時を操る力を持つ砂時計。一度だけ過去に戻ることができるといわれています。",
        requires: [12, 6, 8], // 黄金の砂, 星の砂, 月光の露
        value: 420,
        discovered: false,
        known: false
    },
    { 
        id: 16, 
        name: "賢者の石", 
        image: "images/results/philosophers_stone.png", 
        description: "全ての錬金術師が求める伝説の石。あらゆる物質を金に変え、不老不死の霊薬を作ることができます。",
        requires: [10, 11, 12, 7], // 竜の鱗, 精霊の涙, 黄金の砂, 霧の結晶
        value: 1000,
        discovered: false,
        known: false,
        isGoal: true
    }
];

// レシピ販売データ
const recipeShopItems = [
    { id: 1, recipeId: 1, price: 400, purchased: false },
    { id: 2, recipeId: 4, price: 550, purchased: false },
    { id: 3, recipeId: 8, price: 620, purchased: false },
    { id: 4, recipeId: 2, price: 600, purchased: false },
    { id: 5, recipeId: 5, price: 600, purchased: false },
    { id: 6, recipeId: 6, price: 680, purchased: false },
    { id: 7, recipeId: 9, price: 750, purchased: false },
    { id: 8, recipeId: 7, price: 880, purchased: false },
    { id: 9, recipeId: 3, price: 950, purchased: false },
    { id: 10, recipeId: 11, price: 1180, purchased: false }
];

// 採取場所データ
const gatheringPlaces = [
    {
        id: 1,
        name: "妖精の森",
        image: "images/places/fairy_forest.png",
        description: "魔法の花や神秘の水が見つかることがある静かな森。",
        items: [1, 2, 3],  // 魔法の花, 輝く結晶, 神秘の水
        timeRequired: 1
    },
    {
        id: 2,
        name: "古代遺跡",
        image: "images/places/ancient_ruins.png",
        description: "古代の化石や不思議な結晶が埋まっている遺跡。",
        items: [4, 6, 7],  // 古代の化石, 星の砂, 霧の結晶
        timeRequired: 1
    },
    {
        id: 3,
        name: "月の湖",
        image: "images/places/moon_lake.png",
        description: "月の光を反射する神秘的な湖。夜に訪れると特別な素材が見つかる。",
        items: [8, 9, 3],  // 月光の露, 夢の断片, 神秘の水
        timeRequired: 2
    },
    {
        id: 4,
        name: "炎山",
        image: "images/places/fire_mountain.png",
        description: "常に活動している火山。危険だが貴重な素材が採取できる。",
        items: [5, 4, 2],  // 炎のエキス, 古代の化石, 輝く結晶
        timeRequired: 2
    },
    {
        id: 5,
        name: "竜の巣",
        image: "images/places/dragon_nest.png",
        description: "かつて竜が住んでいたという伝説の場所。非常に危険だが、最も貴重な素材が眠っている。",
        items: [10, 5, 6],  // 竜の鱗, 炎のエキス, 星の砂
        timeRequired: 3
    },
    {
        id: 6,
        name: "精霊の泉",
        image: "images/places/spirit_spring.png",
        description: "清らかな水が湧き出る神聖な場所。精霊の姿を見ることができるかもしれない。",
        items: [11, 3, 8],  // 精霊の涙, 神秘の水, 月光の露
        timeRequired: 3
    },
    {
        id: 7,
        name: "黄金の砂浜",
        image: "images/places/golden_beach.png",
        description: "伝説の財宝が埋まっているという噂のある神秘的な砂浜。",
        items: [12, 6, 2],  // 黄金の砂, 星の砂, 輝く結晶
        timeRequired: 3
    }
];

// 共有変数
let playerGold = 500; // プレイヤーの初期ゴールド
let inventory = {}; // プレイヤーのインベントリ（調合結果アイテム）
let currentDay = 1; // 現在の日数
const maxDays = 30; // 最大日数
let currentTime = 7; // 朝7時からスタート
const dayStartTime = 7; // 活動開始時間
const dayEndTime = 23; // 活動終了時間
const hoursPerDay = 16; // 1日の活動可能時間
let selectedIngredients = []; // 選択された素材
const maxSelections = 4; // 最大選択可能素材数
// レシピヒント保存用の配列
const recipeHints = [];

let alchemyLevel = 1;
let alchemyExp = 0;
const expToNextLevel = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000]; // レベルごとの必要経験値

// 各レシピに難易度を追加
resultItems.forEach(item => {
    // 基本的なアイテムは難易度1、貴重なアイテムほど難易度が上がる
    // 値段に基づいて難易度を設定
    if (item.value <= 150) item.difficulty = 1;
    else if (item.value <= 250) item.difficulty = 2;
    else if (item.value <= 350) item.difficulty = 3;
    else if (item.value <= 500) item.difficulty = 4;
    else item.difficulty = 5;
    
    // 賢者の石は特別に難易度10に設定
    if (item.isGoal) item.difficulty = 10;
});

// data.js に追加
// 採取回数の初期化
// 採取回数の初期化
let gatheringCount = {
    1: 0, 
    2: 0, 
    3: 0, 
    4: 0, 
    5: 0, 
    6: 0, 
    7: 0
};

// 採取場所データに unlocked と unlockCondition を追加
gatheringPlaces.forEach((place, index) => {
    // 最初の場所だけ解放済み、他はロック
    place.unlocked = index === 0;
    
    // アンロック条件を設定
    if (index > 0) {
        switch(index) {
            case 1: // 古代遺跡
                place.unlockCondition = { type: 'level', level: 2 };
                break;
            case 2: // 月の湖
                place.unlockCondition = { type: 'gathering', placeId: 1, count: 3 };
                break;
            case 3: // 炎山
                place.unlockCondition = { type: 'level', level: 4 };
                break;
            case 4: // 竜の巣
                place.unlockCondition = { type: 'item', itemId: 10, count: 1 };
                break;
            case 5: // 精霊の泉
                place.unlockCondition = { type: 'level', level: 5 };
                break;
            case 6: // 黄金の砂浜
                place.unlockCondition = { type: 'item', itemId: 13, count: 1 };
                break;
        }
    }
});

// ショップの在庫データ
const shopStock = {
    // 素材の在庫
    materials: ingredients.map(ing => ({
        id: ing.id,
        maxStock: 3,  // 最大在庫数
        currentStock: 3,  // 現在の在庫数
        restockDays: 3,  // 何日ごとに補充するか
        lastRestockDay: 0  // 最後に補充した日
    })),
    
    // レシピの在庫（一度購入したらなくなる）
    recipes: recipeShopItems.map(item => ({
        id: item.id,
        stock: 1
    }))
};


// サウンドファイル一覧
const soundFiles = {
    bgm: {
        title: "sounds/bgm/title_theme.mp3",
        gameplay: "sounds/bgm/gameplay_theme.mp3",
        shop: "sounds/bgm/shop_theme.mp3",
        gameOver: "sounds/bgm/game_over.mp3",
        gameClear: "sounds/bgm/game_clear.mp3"
    },
    sfx: {
        buttonClick: "sounds/sfx/button_click.mp3",
        craftStart: "sounds/sfx/craft_start.mp3",
        craftSuccess: "sounds/sfx/craft_success.mp3",
        craftFail: "sounds/sfx/craft_fail.mp3",
        itemGet: "sounds/sfx/item_get.mp3",
        levelUp: "sounds/sfx/level_up.mp3",
        purchase: "sounds/sfx/purchase.mp3",
        newDay: "sounds/sfx/new_day.mp3",
        unlock: "sounds/sfx/unlock.mp3"
    }
};