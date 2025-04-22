// 定数・設定を一元管理
const CONSTANTS = {
  // スケーリング関連
  SIZE_SCALE: 0.6,        // 惑星サイズを少し小さく
  DISTANCE_SCALE: 25,  // 20から25に増加
  ORBIT_SPEED_SCALE: 0.5, // 公転速度のスケール係数
  SUN_SIZE: 5,            // 太陽の基本サイズ
  
  // 教育的モード用（現実の比率を維持しつつ、近すぎたり小さすぎたりしないようにする）
  AESTHETIC_MIN_PLANET_SIZE: 0.3,  // 見た目上の最小惑星サイズ
  AESTHETIC_MIN_DISTANCE: 8,       // 惑星間の最小距離
  
  // 物理的に正確な定数（現実的スケールモード用）
  AU_TO_KM: 149597871,              // 1天文単位(AU)のキロメートル数
  EARTH_RADIUS_KM: 6371,            // 地球の半径（キロメートル）
  SUN_RADIUS_KM: 695700,            // 太陽の半径（キロメートル）
  
  // テクスチャパス
  TEXTURE_PATH: 'textures/',
  
  // 軌道の線の設定
  ORBIT_LINE_SEGMENTS: 128,
  
  // 天体の色（テクスチャがない場合や、ラベルなどに使用）
  COLORS: {
    SUN: 0xffcc00,
    MERCURY: 0x8a8a8a,
    VENUS: 0xe6c8a0,
    EARTH: 0x1b7cff,
    MARS: 0xc1440e,
    JUPITER: 0xd8ca9d,
    SATURN: 0xead6b8,
    URANUS: 0x99d9ea,
    NEPTUNE: 0x3341ff,
    MOON: 0xe6e6e6,
    ORBIT: 0x444444,
    ORBIT_SELECTED: 0x6666ff
  },
  
  // ブルームエフェクト設定（弱めに調整）
  BLOOM: {
      STRENGTH: 0.5,    // 1.5から0.5に弱める
      RADIUS: 0.4,      // 0.7から0.4に減らす
      THRESHOLD: 0.6    // 0.3から0.6に上げる（明るい部分のみブルーム）
  },
      
  // アニメーション設定
  DEFAULT_SPEED: 1.0,   // デフォルトの時間経過速度
  MAX_SPEED: 10.0,      // 最大速度倍率
  
  // カメラ設定
  CAMERA: {
    FOV: 60,
    NEAR: 0.1,
    FAR: 10000,
    INITIAL_POSITION: [0, 30, 80],  // [x, y, z]
    LOOK_AT: [0, 0, 0],             // [x, y, z]
    ORBIT_CONTROLS: {
      MIN_DISTANCE: 10,
      MAX_DISTANCE: 500,
      ENABLE_DAMPING: true,
      DAMPING_FACTOR: 0.1,
      ENABLE_PAN: true,
      AUTO_ROTATE: false
    }
  }
};