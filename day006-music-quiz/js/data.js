/**
 * 音符データの定義
 * 音符のID、名前、周波数を含む
 */

// 基本セット（レベル1：C4～B4）
const basicNotes = [
  { id: 'C4', name: 'ド', frequency: 261.63 },
  { id: 'D4', name: 'レ', frequency: 293.66 },
  { id: 'E4', name: 'ミ', frequency: 329.63 },
  { id: 'F4', name: 'ファ', frequency: 349.23 },
  { id: 'G4', name: 'ソ', frequency: 392.00 },
  { id: 'A4', name: 'ラ', frequency: 440.00 },
  { id: 'B4', name: 'シ', frequency: 493.88 }
];

// 拡張セット（レベル2用の追加音符：A3～F5）
const extendedNotes = [
  // 低音域（オクターブ3）
  { id: 'A3', name: '低いラ', frequency: 220.00 },
  { id: 'B3', name: '低いシ', frequency: 246.94 },
  
  // 高音域（オクターブ5）
  { id: 'C5', name: '高いド', frequency: 523.25 },
  { id: 'D5', name: '高いレ', frequency: 587.33 },
  { id: 'E5', name: '高いミ', frequency: 659.26 },
  { id: 'F5', name: '高いファ', frequency: 698.46 }
];

// 現在使用中の音符セット（クイズで使用）
let notes = [...basicNotes];

// レベルに応じて音符セットを更新する関数
function updateNotesForLevel(level) {
  if (level >= 2) {
    // レベル2以上：基本セット + 拡張セット
    notes = [...basicNotes, ...extendedNotes];
  } else {
    // レベル1：基本セットのみ
    notes = [...basicNotes];
  }
  
  // 出題リストも初期化
  initRemainingNotes();
  return notes;
}

// 出題管理用の変数
let remainingNotes = []; // 未出題の音符リスト

/**
 * 音符の出題リストを初期化する
 */
function initRemainingNotes() {
  // すべての音符をコピー
  remainingNotes = [...notes];
  
  // ランダムに並べ替え
  shuffleArray(remainingNotes);
}

/**
 * 配列をランダムに並べ替える関数
 * @param {Array} array - 並べ替える配列
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * ランダムな音符を選択する関数（すべての音を一通り出題）
 * @returns {Object} - 選択された音符オブジェクト
 */
function getRandomNote() {
  // 未出題リストが空の場合は初期化
  if (remainingNotes.length === 0) {
    initRemainingNotes();
  }
  
  // リストから1つ取り出す
  return remainingNotes.pop();
}

/**
 * 特定のIDから音符オブジェクトを取得する関数
 * @param {string} noteId - 探す音符のID (例: 'C4')
 * @returns {Object|null} - 見つかった音符オブジェクト、または見つからない場合はnull
 */
function getNoteById(noteId) {
  // 全音符セット（基本+拡張）から探す
  const allNotes = [...basicNotes, ...extendedNotes];
  return allNotes.find(note => note.id === noteId) || null;
}

/**
 * IDから音符の名前を取得する関数
 * @param {string} noteId - 音符のID (例: 'C4')
 * @returns {string} - 見つかった音符の名前、または見つからない場合は空文字
 */
function getNoteNameById(noteId) {
  const note = getNoteById(noteId);
  return note ? note.name : '';
}

/**
 * レベルに応じた難易度調整を行う関数
 * @param {number} level - 現在のレベル
 * @returns {Object} - 難易度設定オブジェクト（将来的な拡張用）
 */
function getDifficultySettings(level) {
  // レベルに応じて音符セットを更新
  updateNotesForLevel(level);
  
  return {
    noteCount: Math.min(notes.length, Math.floor(level / 2) + 3), // レベルが上がるほど選択肢が増える
    answerTimeLimit: Math.max(5, 10 - Math.floor(level / 3)), // レベルが上がるほど時間制限が厳しくなる
    pointsPerCorrectAnswer: 10 + Math.floor(level / 2) // レベルが上がるほど獲得ポイントが増える
  };
}

// アプリ起動時に出題リストを初期化
initRemainingNotes();