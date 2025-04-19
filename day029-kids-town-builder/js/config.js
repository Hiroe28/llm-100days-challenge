/**
 * かんたんおえかきアプリの設定ファイル
 */

// 定数
const CONFIG = {
  // グリッド設定
  GRID_SIZE: 20,
  GRID_WIDTH: 650,
  GRID_HEIGHT: 450,
  
  // 変形設定
  MIN_SCALE: 0.5,  // 最小サイズ
  MAX_SCALE: 3.0,  // 最大サイズ
  SCALE_STEP: 0.5, // 拡大縮小ステップ
  ROTATION_STEP: 15, // 回転ステップ（度）
  
  // 履歴設定
  MAX_HISTORY: 20, // 履歴の最大保存数
  
  // カラーパレット - 子供向けに親しみやすい色セット
  COLORS: [
    '#ff0000', // 赤
    '#ff6b6b', // 薄赤
    '#ff8c00', // オレンジ
    '#ffa500', // 明るいオレンジ
    '#ffff00', // 黄色
    '#ffed4a', // 薄黄色
    '#008000', // 緑
    '#4cd137', // 明るい緑
    '#00bfff', // 空色
    '#3498db', // 青
    '#0000ff', // 濃い青
    '#9b59b6', // 紫
    '#fd79a8', // 薄ピンク
    '#8b4513', // 茶色
    '#795548', // 薄茶色
    '#ff7f50', // サーモンピンク
    '#1abc9c', // ターコイズ
    '#2ecc71', // エメラルド
    '#f1c40f', // 金色
    '#e74c3c', // 赤レンガ
    '#95a5a6', // グレー
    '#7f8c8d', // 濃いグレー
    '#34495e', // 紺色
    '#ffffff', // 白
    '#000000'  // 黒
  ],

  // フチの色
  STROKE_COLORS: [
    '#000000', // 黒
    '#333333', // 濃いグレー
    '#666666', // グレー
    '#999999', // 薄いグレー
    '#ff0000', // 赤
    '#0000ff', // 青
    '#008000', // 緑
    '#800080', // 紫
    '#ffffff', // 白
    'none'     // フチなし
  ],
  
  // 図形定義
  SHAPES: [
    { type: 'square', width: 2, height: 2, color: '#ff6b6b', label: '四角' },
    { type: 'rectangle', width: 4, height: 2, color: '#4ecdc4', label: '長方形' },
    { type: 'triangle', width: 2, height: 2, color: '#ffcc5c', label: '三角' },
    { type: 'circle', width: 2, height: 2, color: '#6c88c4', label: '円' },
    { type: 'roof', width: 4, height: 2, color: '#ff6b6b', label: '屋根' }
  ],

  // 部品定義
  PARTS: [
    { type: 'window', width: 2, height: 2, color: '#74b9ff', label: 'まど' },
    { type: 'door', width: 2, height: 3, color: '#a55eea', label: 'ドア' },
    { type: 'chimney', width: 1, height: 2, color: '#ff7675', label: 'えんとつ' },
    { type: 'tree', width: 3, height: 4, color: '#55efc4', label: 'き' }
  ],
  
  // 道路設定
  ROAD_THICK: 1, // 道路の厚み（グリッド単位）
    
  // 道路定義 - サイズを調整して使いやすく
  ROADS: [
    { type: 'straight-road', width: 2, height: 1, color: '#95a5a6', label: 'まっすぐな道' },
    { type: 'cross-road', width: 2, height: 2, color: '#95a5a6', label: '十字路' },
    { type: 'corner-road', width: 2, height: 2, color: '#95a5a6', label: 'かどの道' },
    { type: 't-junction', width: 2, height: 2, color: '#95a5a6', label: 'T字路' },
    { type: 'bridge', width: 2, height: 1, color: '#e67e22', label: 'はし' }
  ]
};