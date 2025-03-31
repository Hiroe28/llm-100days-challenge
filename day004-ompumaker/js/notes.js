// notes.js - 音符の管理と操作に関する機能

// --- 音符の位置データ ---
const notes = [];

// --- ドラッグ中の音符情報 ---
let draggedNote = null;

// 音階マッピング - 標準的な五線譜の音位置に正確に合わせて修正
const noteMapping = {
  // ト音記号 - 正しい音階配置
  "treble_37.5": "G5",    // 一番上の線より上（ソ）
  "treble_50":   "F5",    // 一番上の線（ファ）
  "treble_62.5": "E5",    // 一番上と二番目の間（ミ）
  "treble_75":   "D5",    // 二番目の線（レ）
  "treble_87.5": "C5",    // 二番目と三番目の間（ド）
  "treble_100":  "B4",    // 三番目の線（シ）
  "treble_112.5":"A4",    // 三番目と四番目の間（ラ）
  "treble_125":  "G4",    // 四番目の線（ソ）
  "treble_137.5":"F4",    // 四番目と五番目の間（ファ）
  "treble_150":  "E4",    // 五番目の線（ミ）
  "treble_162.5":"D4",    // 五番目の線の下の間（レ）
  "treble_175":  "C4",    // 下の加線上（ド）
  "treble_187.5":"B3",    // 下の加線下のスペース（シ）

  // ヘ音記号 - 正しい音階配置
  "bass_37.5": "B3",      // 一番上の線より上（シ）
  "bass_50":   "A3",      // 一番上の線（ラ）
  "bass_62.5": "G3",      // 一番上と二番目の間（ソ）
  "bass_75":   "F3",      // 二番目の線（ファ）
  "bass_87.5": "E3",      // 二番目と三番目の間（ミ）
  "bass_100":  "D3",      // 三番目の線（レ）
  "bass_112.5":"C3",      // 三番目と四番目の間（ド）
  "bass_125":  "B2",      // 四番目の線（シ）
  "bass_137.5":"A2",      // 四番目と五番目の間（ラ）
  "bass_150":  "G2",      // 五番目の線（ソ）
  "bass_162.5":"F2",      // 五番目の線の下の間（ファ）
  "bass_175":  "E2",      // 下の加線上（ミ）
  "bass_187.5":"D2",      // 下の加線下のスペース（レ）
};

// 音名ごとの色
const colorMapping = {
  'A': '#ff5252', 
  'B': '#ff9800', 
  'C': '#ffeb3b', 
  'D': '#8bc34a', 
  'E': '#03a9f4', 
  'F': '#3f51b5', 
  'G': '#9c27b0'
};

// 加線が必要な音の定義
const ledgerLineNotes = {
  // ト音記号の加線が必要な音 - 正しい音階に合わせて修正
  'C4': { position: 'middle' }, // C4（ド）- 中央に線
  'B3': { position: 'top' },    // B3（シ）- 上に線
  
  // ヘ音記号の加線が必要な音 - 正しい音階に合わせて修正
  'E2': { position: 'middle' }, // E2（ミ）- 中央に線
  'D2': { position: 'top' }     // D2（レ）- 上に線
};

// --- 音符追加 ---
function addNote(clef, x, y, id, tone, playPreviewSound = true) {
  const staff = document.getElementById(`${clef}-staff`);
  const colorKey = tone.charAt(0); 
  const color = colorMapping[colorKey] || '#000';

  // 音符の作成
  const note = document.createElement('div');
  note.className = 'note';
  note.style.left = `${x}px`;
  note.style.top = `${y}px`;
  note.style.backgroundColor = color;
  note.dataset.id = id;
  note.dataset.tone = tone;
  note.dataset.x = x;
  
  // モバイル端末向けのサイズ調整
  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    note.style.width = '32px';
    note.style.height = '32px';
  }
  
  staff.appendChild(note);
  
  // 加線が必要な音符の場合、加線を追加
  if (ledgerLineNotes[tone]) {
    const ledgerLine = document.createElement('div');
    ledgerLine.className = 'ledger-line';
    ledgerLine.style.left = `${x}px`;
    
    // 加線の位置を決定（中央か上か）
    if (ledgerLineNotes[tone].position === 'middle') {
      // 丸の真ん中に横線（ドの場合）
      ledgerLine.style.top = `${y}px`;
    } else if (ledgerLineNotes[tone].position === 'top') {
      // 丸の上に線（シの場合）
      ledgerLine.style.top = `${y - 12}px`;
    }
    
    // モバイル端末向けの加線サイズ調整
    if (isMobile) {
      ledgerLine.style.width = '38px';
    }
    
    // 音符のdata-idを加線のdata-note-idとして設定
    ledgerLine.dataset.noteId = id;
    staff.appendChild(ledgerLine);
  }
  
  // 音符オブジェクトを追加
  const noteObj = {
    element: note,
    id: id,
    tone: tone,
    x: x,
    clef: clef
  };
  notes.push(noteObj);
  
  // 音符要素にクリックイベントを追加（バブリングを止める）
  note.addEventListener('click', function(event) {
    // ドラッグ中なら何もしない
    if (this.dataset.dragging === 'true') {
      event.stopPropagation();
      return;
    }
  });
  
  // プレビュー音（必要な場合のみ）
  if (playPreviewSound) {
    // 音質向上のため演奏時間を調整
    synth.triggerAttackRelease(tone, '16n');
  }
}

// --- 音符削除 ---
function removeNote(noteElement) {
  const index = notes.findIndex(n => n.element === noteElement);
  if (index !== -1) {
    notes.splice(index, 1);
  }
  
  // 関連する加線も削除
  const noteId = noteElement.dataset.id;
  const ledgerLines = document.querySelectorAll(`.ledger-line[data-note-id="${noteId}"]`);
  ledgerLines.forEach(line => {
    line.remove();
  });
  
  noteElement.remove();
}

// --- 音符の移動 ---
function updateNotePosition(noteElement, clef, x, y, newTone) {
  // 対応するノートオブジェクトを見つける
  const noteIndex = notes.findIndex(n => n.element === noteElement);
  if (noteIndex === -1) return;
  
  const note = notes[noteIndex];
  const oldNoteId = note.id;
  
  // 新しいIDを設定
  const newNoteId = `${clef}_${x}_${y}`;
  
  // 新しい位置に更新
  noteElement.style.left = `${x}px`;
  noteElement.style.top = `${y}px`;
  noteElement.dataset.id = newNoteId;
  noteElement.dataset.tone = newTone;
  noteElement.dataset.x = x;
  
  // 色を更新
  const colorKey = newTone.charAt(0);
  const color = colorMapping[colorKey] || '#000';
  noteElement.style.backgroundColor = color;
  
  // notesデータ更新
  note.id = newNoteId;
  note.tone = newTone;
  note.x = x;
  
  // 古い加線を削除
  const oldLedgerLines = document.querySelectorAll(`.ledger-line[data-note-id="${oldNoteId}"]`);
  oldLedgerLines.forEach(line => line.remove());
  
  // 必要に応じて新しい加線を追加
  if (ledgerLineNotes[newTone]) {
    const ledgerLine = document.createElement('div');
    ledgerLine.className = 'ledger-line';
    ledgerLine.style.left = `${x}px`;
    
    if (ledgerLineNotes[newTone].position === 'middle') {
      ledgerLine.style.top = `${y}px`;
    } else if (ledgerLineNotes[newTone].position === 'top') {
      ledgerLine.style.top = `${y - 12}px`;
    }
    
    // モバイル端末向けのサイズ調整
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      ledgerLine.style.width = '38px';
    }
    
    ledgerLine.dataset.noteId = newNoteId;
    document.getElementById(`${clef}-staff`).appendChild(ledgerLine);
  }
  
  // 移動後の音をプレビュー再生
  synth.triggerAttackRelease(newTone, '16n');
}

// --- 全音符削除 ---
function clearNotes() {
  if (isPlaying) togglePlay();
  
  // 音符を削除
  notes.forEach(n => n.element.remove());
  
  // 加線も削除
  document.querySelectorAll('.ledger-line').forEach(line => line.remove());
  
  notes.length = 0;
}