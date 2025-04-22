/**
 * ステージデータを管理するファイル
 * 各ステージの設定、ロボット・敵の初期位置、ゴールなどを定義
 */

// ステージごとの設定
const stageConfig = {
  // ステージ1: はじめの一歩（前進のみ）
  1: {
    title: "はじめの一歩",
    description: "「前に進む」ブロックを使って、ロボットをゴールまで動かそう！",
    hint: "「前に進む」ブロックを左からドラッグして、中央のワークスペースに置いてみよう！そして、「実行する」ボタンを押してね。",
    robot: { x: 1, y: 4, direction: 1 }, // 右向き
    enemies: [],
    goal: { x: 8, y: 4 },
    obstacles: [
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, 
      { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 }, { x: 9, y: 0 },
      { x: 0, y: 9 }, { x: 1, y: 9 }, { x: 2, y: 9 }, { x: 3, y: 9 }, { x: 4, y: 9 }, 
      { x: 5, y: 9 }, { x: 6, y: 9 }, { x: 7, y: 9 }, { x: 8, y: 9 }, { x: 9, y: 9 },
      { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 0, y: 5 }, 
      { x: 0, y: 6 }, { x: 0, y: 7 }, { x: 0, y: 8 },
      { x: 9, y: 1 }, { x: 9, y: 2 }, { x: 9, y: 3 }, { x: 9, y: 4 }, { x: 9, y: 5 }, 
      { x: 9, y: 6 }, { x: 9, y: 7 }, { x: 9, y: 8 }
    ],
    availableBlocks: [ "robot_move_forward"],
    requiredBlocks: ["robot_move_forward"]
  },
  
  // ステージ2: 曲がる練習（前進と右折）
  2: {
    title: "曲がる練習",
    description: "「右にまがる」ブロックを使って、角を曲がろう！",
    hint: "まず「前に進む」で3マス進み、「右にまがる」で右に曲がって、また「前に進む」でゴールへ向かおう！",
    robot: { x: 1, y: 1, direction: 1 }, // 右向き
    enemies: [],
    goal: { x: 8, y: 4 },
    obstacles: [
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, 
      { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 }, { x: 9, y: 0 },
      { x: 0, y: 9 }, { x: 1, y: 9 }, { x: 2, y: 9 }, { x: 3, y: 9 }, { x: 4, y: 9 }, 
      { x: 5, y: 9 }, { x: 6, y: 9 }, { x: 7, y: 9 }, { x: 8, y: 9 }, { x: 9, y: 9 },
      { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 0, y: 5 }, 
      { x: 0, y: 6 }, { x: 0, y: 7 }, { x: 0, y: 8 },
      { x: 9, y: 1 }, { x: 9, y: 2 }, { x: 9, y: 3 }, { x: 9, y: 4 }, { x: 9, y: 5 }, 
      { x: 9, y: 6 }, { x: 9, y: 7 }, { x: 9, y: 8 }
    ],
    availableBlocks: ["robot_move_forward", "robot_turn_right"],
    requiredBlocks: ["robot_move_forward", "robot_turn_right"]
  },
  
  // ステージ3: 左右に曲がる（前進と右折と左折）
  3: {
    title: "左右に曲がる",
    description: "「左にまがる」ブロックも使えるようになりました！障害物を避けてゴールへ進もう。",
    hint: "障害物を避けて通るには、「右にまがる」と「左にまがる」を上手に使い分けよう！",
    robot: { x: 1, y: 4, direction: 1 }, // 右向き
    enemies: [],
    goal: { x: 8, y: 4 },
    obstacles: [
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, 
      { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 }, { x: 9, y: 0 },
      { x: 0, y: 9 }, { x: 1, y: 9 }, { x: 2, y: 9 }, { x: 3, y: 9 }, { x: 4, y: 9 }, 
      { x: 5, y: 9 }, { x: 6, y: 9 }, { x: 7, y: 9 }, { x: 8, y: 9 }, { x: 9, y: 9 },
      { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 0, y: 5 }, 
      { x: 0, y: 6 }, { x: 0, y: 7 }, { x: 0, y: 8 },
      { x: 9, y: 1 }, { x: 9, y: 2 }, { x: 9, y: 3 }, { x: 9, y: 4 }, { x: 9, y: 5 }, 
      { x: 9, y: 6 }, { x: 9, y: 7 }, { x: 9, y: 8 },
      { x: 4, y: 2 }, { x: 4, y: 3 }, { x: 4, y: 4 }, { x: 4, y: 5 }, { x: 4, y: 6 }
    ],
    availableBlocks: ["robot_move_forward", "robot_turn_right", "robot_turn_left"],
    requiredBlocks: ["robot_move_forward", "robot_turn_left", "robot_turn_right"]
  },
  
  // ステージ4: はじめての敵（前進と玉を出す）
  4: {
    title: "はじめての敵",
    description: "「玉を出す」ブロックを使って、敵を倒そう！",
    hint: "敵の目の前まで進んだら「玉を出す」で攻撃しよう！",
    robot: { x: 1, y: 4, direction: 1 }, // 右向き
    enemies: [{ x: 5, y: 4 }],
    goal: { x: 8, y: 4 },
    obstacles: [
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, 
      { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 }, { x: 9, y: 0 },
      { x: 0, y: 9 }, { x: 1, y: 9 }, { x: 2, y: 9 }, { x: 3, y: 9 }, { x: 4, y: 9 }, 
      { x: 5, y: 9 }, { x: 6, y: 9 }, { x: 7, y: 9 }, { x: 8, y: 9 }, { x: 9, y: 9 },
      { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 0, y: 5 }, 
      { x: 0, y: 6 }, { x: 0, y: 7 }, { x: 0, y: 8 },
      { x: 9, y: 1 }, { x: 9, y: 2 }, { x: 9, y: 3 }, { x: 9, y: 4 }, { x: 9, y: 5 }, 
      { x: 9, y: 6 }, { x: 9, y: 7 }, { x: 9, y: 8 }
    ],
    availableBlocks: ["robot_move_forward", "robot_shoot"],
    requiredBlocks: ["robot_move_forward", "robot_shoot"]
  },
  
  // ステージ5: くりかえし処理
  5: {
    title: "くりかえし",
    description: "「くりかえし」ブロックを使うと、同じ動きを何回も書かなくて済むよ！",
    hint: "「くりかえし」ブロックの中に「前に進む」を入れると、決まった回数だけ進めるよ！",
    robot: { x: 1, y: 4, direction: 1 }, // 右向き
    enemies: [],
    goal: { x: 8, y: 4 },
    obstacles: [
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, 
      { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 }, { x: 9, y: 0 },
      { x: 0, y: 9 }, { x: 1, y: 9 }, { x: 2, y: 9 }, { x: 3, y: 9 }, { x: 4, y: 9 }, 
      { x: 5, y: 9 }, { x: 6, y: 9 }, { x: 7, y: 9 }, { x: 8, y: 9 }, { x: 9, y: 9 },
      { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 0, y: 5 }, 
      { x: 0, y: 6 }, { x: 0, y: 7 }, { x: 0, y: 8 },
      { x: 9, y: 1 }, { x: 9, y: 2 }, { x: 9, y: 3 }, { x: 9, y: 4 }, { x: 9, y: 5 }, 
      { x: 9, y: 6 }, { x: 9, y: 7 }, { x: 9, y: 8 }
    ],
    availableBlocks: ["robot_move_forward", "controls_repeat_ext"],
    requiredBlocks: ["robot_move_forward", "controls_repeat_ext"]
  },
  
  // ステージ6: 繰り返しと方向転換
  6: {
    title: "くりかえしと方向転換",
    description: "「くりかえし」ブロックの中に複数の命令を入れることもできるよ！",
    hint: "「くりかえし」ブロックの中に「前に進む」と「右にまがる」を入れると、四角形を描くような動きができるよ！",
    robot: { x: 1, y: 8, direction: 0 }, // 上向き
    enemies: [],
    goal: { x: 8, y: 1 },
    obstacles: [
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, 
      { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 }, { x: 9, y: 0 },
      { x: 0, y: 9 }, { x: 1, y: 9 }, { x: 2, y: 9 }, { x: 3, y: 9 }, { x: 4, y: 9 }, 
      { x: 5, y: 9 }, { x: 6, y: 9 }, { x: 7, y: 9 }, { x: 8, y: 9 }, { x: 9, y: 9 },
      { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 0, y: 5 }, 
      { x: 0, y: 6 }, { x: 0, y: 7 }, { x: 0, y: 8 },
      { x: 9, y: 1 }, { x: 9, y: 2 }, { x: 9, y: 3 }, { x: 9, y: 4 }, { x: 9, y: 5 }, 
      { x: 9, y: 6 }, { x: 9, y: 7 }, { x: 9, y: 8 },
      { x: 3, y: 3 }, { x: 3, y: 4 }, { x: 3, y: 5 }, { x: 3, y: 6 },
      { x: 6, y: 3 }, { x: 6, y: 4 }, { x: 6, y: 5 }, { x: 6, y: 6 }
    ],
    availableBlocks: ["robot_move_forward", "robot_turn_right", "robot_turn_left", "controls_repeat_ext"],
    requiredBlocks: ["robot_move_forward", "robot_turn_right", "controls_repeat_ext"]
  },
  
  // ステージ7: 繰り返しで敵を倒す
  7: {
    title: "くりかえしで敵を倒す",
    description: "「くりかえし」ブロックを使って、複数の敵を効率よく倒そう！",
    hint: "「前に進む」「玉を出す」「前に進む」というパターンを「くりかえし」を使って書くと簡単だよ！",
    robot: { x: 1, y: 4, direction: 1 }, // 右向き
    enemies: [{ x: 3, y: 4 }, { x: 5, y: 4 }, { x: 7, y: 4 }],
    goal: { x: 8, y: 4 },
    obstacles: [
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, 
      { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 }, { x: 9, y: 0 },
      { x: 0, y: 9 }, { x: 1, y: 9 }, { x: 2, y: 9 }, { x: 3, y: 9 }, { x: 4, y: 9 }, 
      { x: 5, y: 9 }, { x: 6, y: 9 }, { x: 7, y: 9 }, { x: 8, y: 9 }, { x: 9, y: 9 },
      { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 0, y: 5 }, 
      { x: 0, y: 6 }, { x: 0, y: 7 }, { x: 0, y: 8 },
      { x: 9, y: 1 }, { x: 9, y: 2 }, { x: 9, y: 3 }, { x: 9, y: 4 }, { x: 9, y: 5 }, 
      { x: 9, y: 6 }, { x: 9, y: 7 }, { x: 9, y: 8 }
    ],
    availableBlocks: ["robot_move_forward", "robot_shoot", "controls_repeat_ext"],
    requiredBlocks: ["robot_move_forward", "robot_shoot", "controls_repeat_ext"]
  },
  
  // ステージ8: 条件分岐（修正・強化版）
  8: {
    title: "もし〇〇なら",
    description: "「もし前に敵がいたら」ブロックを使って、敵を見つけたら攻撃しよう！",
    hint: "「もし前に敵がいたら」の中に「玉を出す」を入れると、敵がいる時だけ攻撃できるよ！",
    robot: { x: 1, y: 4, direction: 1 }, // 右向き
    enemies: [{ x: 5, y: 4 }],
    goal: { x: 8, y: 4 },
    obstacles: [
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, 
      { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 }, { x: 9, y: 0 },
      { x: 0, y: 9 }, { x: 1, y: 9 }, { x: 2, y: 9 }, { x: 3, y: 9 }, { x: 4, y: 9 }, 
      { x: 5, y: 9 }, { x: 6, y: 9 }, { x: 7, y: 9 }, { x: 8, y: 9 }, { x: 9, y: 9 },
      { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 0, y: 5 }, 
      { x: 0, y: 6 }, { x: 0, y: 7 }, { x: 0, y: 8 },
      { x: 9, y: 1 }, { x: 9, y: 2 }, { x: 9, y: 3 }, { x: 9, y: 4 }, { x: 9, y: 5 }, 
      { x: 9, y: 6 }, { x: 9, y: 7 }, { x: 9, y: 8 }
    ],
    availableBlocks: ["robot_move_forward", "robot_shoot", "controls_if", "robot_check_enemy"],
    requiredBlocks: ["robot_move_forward", "controls_if", "robot_check_enemy", "robot_shoot"]
  },
  
  // ステージ9: 条件分岐と繰り返し（修正・強化版）
  9: {
    title: "もし〇〇ならと繰り返し",
    description: "「くりかえし」と「もし前に敵がいたら」を組み合わせて使おう！",
    hint: "「くりかえし」の中に「前に進む」と「もし前に敵がいたら」を入れると、道を進みながら敵を見つけたら攻撃できるよ！",
    robot: { x: 1, y: 4, direction: 1 }, // 右向き
    enemies: [{ x: 3, y: 4 }, { x: 6, y: 4 }],
    goal: { x: 8, y: 4 },
    obstacles: [
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, 
      { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 }, { x: 9, y: 0 },
      { x: 0, y: 9 }, { x: 1, y: 9 }, { x: 2, y: 9 }, { x: 3, y: 9 }, { x: 4, y: 9 }, 
      { x: 5, y: 9 }, { x: 6, y: 9 }, { x: 7, y: 9 }, { x: 8, y: 9 }, { x: 9, y: 9 },
      { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 0, y: 5 }, 
      { x: 0, y: 6 }, { x: 0, y: 7 }, { x: 0, y: 8 },
      { x: 9, y: 1 }, { x: 9, y: 2 }, { x: 9, y: 3 }, { x: 9, y: 4 }, { x: 9, y: 5 }, 
      { x: 9, y: 6 }, { x: 9, y: 7 }, { x: 9, y: 8 }
    ],
    availableBlocks: ["robot_move_forward", "robot_shoot", "controls_repeat_ext", "controls_if", "robot_check_enemy"],
    requiredBlocks: ["robot_move_forward", "robot_shoot", "controls_repeat_ext", "controls_if", "robot_check_enemy"]
  },
  
  // ステージ10: 総合力を試す
  10: {
    title: "総合力を試す",
    description: "これまで学んだことを全部使って、迷路を抜けて敵を倒し、ゴールを目指そう！",
    hint: "「前に進む」「右にまがる」「左にまがる」「玉を出す」「くりかえし」「もし前に敵がいたら」をうまく組み合わせよう！",
    robot: { x: 1, y: 8, direction: 0 }, // 上向き
    enemies: [{ x: 4, y: 3 }, { x: 7, y: 6 }],
    goal: { x: 8, y: 1 },
    obstacles: [
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, 
      { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 }, { x: 9, y: 0 },
      { x: 0, y: 9 }, { x: 1, y: 9 }, { x: 2, y: 9 }, { x: 3, y: 9 }, { x: 4, y: 9 }, 
      { x: 5, y: 9 }, { x: 6, y: 9 }, { x: 7, y: 9 }, { x: 8, y: 9 }, { x: 9, y: 9 },
      { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 0, y: 5 }, 
      { x: 0, y: 6 }, { x: 0, y: 7 }, { x: 0, y: 8 },
      { x: 9, y: 1 }, { x: 9, y: 2 }, { x: 9, y: 3 }, { x: 9, y: 4 }, { x: 9, y: 5 }, 
      { x: 9, y: 6 }, { x: 9, y: 7 }, { x: 9, y: 8 },
      { x: 3, y: 2 }, { x: 3, y: 3 }, { x: 3, y: 4 }, { x: 3, y: 5 },
      { x: 5, y: 4 }, { x: 5, y: 5 }, { x: 5, y: 6 }, { x: 5, y: 7 },
      { x: 2, y: 7 }, { x: 3, y: 7 }, { x: 4, y: 7 },
      { x: 7, y: 2 }, { x: 7, y: 3 }, { x: 7, y: 4 }
    ],
    availableBlocks: ["robot_move_forward", "robot_turn_right", "robot_turn_left", "robot_shoot", "controls_repeat_ext", "controls_if", "robot_check_enemy"],
    requiredBlocks: []
  },
  
  // 自由モード
  free: {
    title: "自由モード",
    description: "好きなようにプログラミングして、敵を倒したりゴールを目指そう！",
    hint: "すべてのブロックを自由に使えるよ！自分だけのロボットプログラムを作ってみよう！",
    robot: { x: 1, y: 4, direction: 1 }, // 右向き
    enemies: [
      { x: 3, y: 2 }, { x: 3, y: 6 }, 
      { x: 5, y: 3 }, { x: 5, y: 5 }, 
      { x: 7, y: 4 }
    ],
    goal: { x: 8, y: 4 },
    obstacles: [
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, 
      { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 }, { x: 9, y: 0 },
      { x: 0, y: 9 }, { x: 1, y: 9 }, { x: 2, y: 9 }, { x: 3, y: 9 }, { x: 4, y: 9 }, 
      { x: 5, y: 9 }, { x: 6, y: 9 }, { x: 7, y: 9 }, { x: 8, y: 9 }, { x: 9, y: 9 },
      { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 0, y: 5 }, 
      { x: 0, y: 6 }, { x: 0, y: 7 }, { x: 0, y: 8 },
      { x: 9, y: 1 }, { x: 9, y: 2 }, { x: 9, y: 3 }, { x: 9, y: 4 }, { x: 9, y: 5 }, 
      { x: 9, y: 6 }, { x: 9, y: 7 }, { x: 9, y: 8 }
    ],
    availableBlocks: [
      "robot_move_forward", "robot_turn_right", "robot_turn_left", 
      "robot_shoot", "controls_repeat_ext", "controls_if", 
      "robot_check_enemy"
    ],
    requiredBlocks: []
  }
};

// 各ステージの最大数を計算（自由モードを除く）
const MAX_STAGE = Object.keys(stageConfig).length - 1;