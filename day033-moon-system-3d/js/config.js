// 設定と定数を一元管理
const CONFIG = {
  // サイズと距離の設定
  SUN_SIZE: 5.0,        // 太陽のサイズ
  EARTH_SIZE: 1.0,      // 地球のサイズ
  MOON_SIZE: 0.27,      // 月のサイズ（地球に対する比率）
  
  EARTH_DISTANCE: 20,   // 地球の軌道半径
  MOON_DISTANCE: 3,     // 月の軌道半径（地球からの距離）
  
  // 公転速度
  EARTH_ORBIT_SPEED: 0.005,  // 地球の公転速度
  MOON_ORBIT_SPEED: 0.05,    // 月の公転速度
  
  // 自転速度
  EARTH_ROTATION_SPEED: 0.01,  // 地球の自転速度
  MOON_ROTATION_SPEED: 0.005,  // 月の自転速度（同期回転）
  
  // 天体の色（テクスチャがない場合の代替色）
  COLORS: {
    SUN: 0xffcc00,    // 太陽の色
    EARTH: 0x1b7cff,  // 地球の色
    MOON: 0xdddddd,   // 月の色
    ORBIT: 0x444444   // 軌道の色
  },
  
  // テクスチャパス
  TEXTURE_PATH: 'textures/',
  
  // 月相の角度（ラジアン）
  MOON_PHASES: {
    NEW_MOON: 0,               // 新月
    WAXING_CRESCENT: Math.PI/4,  // 三日月
    FIRST_QUARTER: Math.PI/2,    // 上弦の月
    WAXING_GIBBOUS: 3*Math.PI/4, // 十三夜月
    FULL_MOON: Math.PI,          // 満月
    WANING_GIBBOUS: 5*Math.PI/4, // 十六夜月
    LAST_QUARTER: 3*Math.PI/2,   // 下弦の月
    WANING_CRESCENT: 7*Math.PI/4 // 二十六夜月
  },
  
  // カメラ設定
  CAMERA: {
    FOV: 60,
    NEAR: 0.1,
    FAR: 1000,
    INITIAL_POSITIONS: {
      SPACE: [0, 15, 40],    // 宇宙視点の初期位置 [x, y, z]
      EARTH: [0, 1.5, 4],    // 地球視点の初期位置
      MOON: [0, 0.5, 2]      // 月クローズアップの初期位置
    },
    ORBIT_CONTROLS: {
      MIN_DISTANCE: 2,
      MAX_DISTANCE: 100,
      ENABLE_DAMPING: true,
      DAMPING_FACTOR: 0.1
    }
  }
};