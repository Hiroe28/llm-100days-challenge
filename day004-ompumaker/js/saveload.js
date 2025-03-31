// saveload.js - メロディーの保存と読み込み機能

// --- UIエレメント ---
let saveButton;
let loadButton;
let saveDialog;
let loadDialog;
let saveCancelButton;
let saveConfirmButton;
let loadCancelButton;
let melodyNameInput;
let emojiSelector;
let selectedEmojiInput;
let savedMelodiesList;
let noMelodiesMessage;

// --- 保存と読み込みの機能をセットアップ ---
function setupSaveLoadFeatures() {
  // UI要素の取得
  saveButton = document.getElementById('save-button');
  loadButton = document.getElementById('load-button');
  saveDialog = document.getElementById('save-dialog');
  loadDialog = document.getElementById('load-dialog');
  saveCancelButton = document.getElementById('save-cancel');
  saveConfirmButton = document.getElementById('save-confirm');
  loadCancelButton = document.getElementById('load-cancel');
  melodyNameInput = document.getElementById('melody-name');
  emojiSelector = document.querySelectorAll('.emoji-btn');
  selectedEmojiInput = document.getElementById('selected-emoji');
  savedMelodiesList = document.getElementById('saved-melodies');
  noMelodiesMessage = document.getElementById('no-melodies');
  
  // イベントリスナーの設定
  saveButton.addEventListener('click', openSaveDialog);
  loadButton.addEventListener('click', openLoadDialog);
  saveCancelButton.addEventListener('click', closeSaveDialog);
  saveConfirmButton.addEventListener('click', saveMelody);
  loadCancelButton.addEventListener('click', closeLoadDialog);
  
  // 絵文字ボタンのイベントリスナー
  emojiSelector.forEach(btn => {
    btn.addEventListener('click', function() {
      // 前に選択されたボタンからselectedクラスを削除
      document.querySelectorAll('.emoji-btn.selected').forEach(b => {
        b.classList.remove('selected');
      });
      
      // クリックされたボタンにselectedクラスを追加
      this.classList.add('selected');
      
      // 選択された絵文字を保存
      selectedEmojiInput.value = this.dataset.emoji;
    });
  });
  
  // 初期状態で最初の絵文字を選択
  emojiSelector[0].classList.add('selected');
}

// --- 保存ダイアログを開く ---
function openSaveDialog() {
  if (isPlaying) togglePlay(); // 再生中なら停止
  
  // 音符が1つもない場合、警告を表示して終了
  if (notes.length === 0) {
    alert('メロディーがまだありません。音符を追加してからもう一度試してね！');
    return;
  }
  
  // ダイアログを表示
  saveDialog.style.display = 'flex';
  
  // デフォルト名を設定（今日の日付＋番号）
  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;
  const defaultName = `${dateStr}のメロディー`;
  melodyNameInput.value = defaultName;
  
  // 入力フィールドにフォーカス
  setTimeout(() => {
    melodyNameInput.focus();
    melodyNameInput.select();
  }, 100);
}

// --- 保存ダイアログを閉じる ---
function closeSaveDialog() {
  saveDialog.style.display = 'none';
}

// --- 読み込みダイアログを開く ---
function openLoadDialog() {
  if (isPlaying) togglePlay(); // 再生中なら停止
  
  // 保存済みメロディーを取得してリスト化
  updateMelodyList();
  
  // ダイアログを表示
  loadDialog.style.display = 'flex';
}

// --- 読み込みダイアログを閉じる ---
function closeLoadDialog() {
  loadDialog.style.display = 'none';
}

// --- メロディーを保存 - 修正版 ---
function saveMelody() {
  console.log('メロディーを保存します...');
  
  // 入力値を取得
  const name = melodyNameInput.value.trim() || 'わすれていたメロディー';
  const emoji = selectedEmojiInput.value;
  const date = new Date().toISOString();
  
  // 現在の音符情報を正確に取得（DOM要素から直接取得）
  const melodyData = [];
  
  // すべての音符要素を取得
  const noteElements = document.querySelectorAll('.note');
  
  noteElements.forEach(noteElement => {
    // データ属性から情報を取得
    const id = noteElement.dataset.id;
    const tone = noteElement.dataset.tone;
    const x = parseInt(noteElement.style.left);
    const y = parseInt(noteElement.style.top);
    
    // 属するスタッフ（trebleかbass）を特定
    const clef = noteElement.closest('.staff').id.split('-')[0];
    
    // 音符情報を保存形式で格納
    melodyData.push({
      id: id,
      clef: clef,
      x: x,
      y: y,
      tone: tone
    });
  });
  
  // X座標順にソート
  melodyData.sort((a, b) => a.x - b.x);
  
  console.log(`保存する音符数: ${melodyData.length}`);
  
  // メロディー情報をオブジェクトに格納
  const melody = {
    id: Date.now().toString(),
    name: name,
    emoji: emoji,
    date: date,
    notes: melodyData,
    version: "2.0" // バージョン情報を追加
  };
  
  // ローカルストレージから既存のメロディーリストを取得
  let melodies = JSON.parse(localStorage.getItem('savedMelodies')) || [];
  
  // 新しいメロディーを追加
  melodies.push(melody);
  
  // ローカルストレージに保存
  localStorage.setItem('savedMelodies', JSON.stringify(melodies));
  
  // 保存成功メッセージ
  alert(`「${name}」を保存しました！`);
  
  // ダイアログを閉じる
  closeSaveDialog();
}

// --- 保存済みメロディーのリストを更新 ---
function updateMelodyList() {
  // リストをクリア
  savedMelodiesList.innerHTML = '';
  
  // ローカルストレージからメロディーリストを取得
  const melodies = JSON.parse(localStorage.getItem('savedMelodies')) || [];
  
  // メロディーがない場合のメッセージ
  if (melodies.length === 0) {
    noMelodiesMessage.style.display = 'block';
    return;
  } else {
    noMelodiesMessage.style.display = 'none';
  }
  
  // メロディーリストを作成
  melodies.forEach(melody => {
    const date = new Date(melody.date);
    const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    
    const li = document.createElement('li');
    li.className = 'melody-item';
    li.dataset.id = melody.id;
    
    li.innerHTML = `
      <div class="melody-emoji">${melody.emoji}</div>
      <div class="melody-info">
        <div class="melody-name">${melody.name}</div>
        <div class="melody-date">${dateStr}</div>
      </div>
      <div class="melody-controls">
        <button class="melody-delete" title="削除">🗑️</button>
      </div>
    `;
    
    // クリックイベント（メロディーを読み込む）
    li.addEventListener('click', function(e) {
      // 削除ボタンがクリックされた場合は別処理
      if (e.target.classList.contains('melody-delete')) {
        e.stopPropagation();
        deleteMelody(melody.id);
        return;
      }
      
      loadMelody(melody.id);
    });
    
    savedMelodiesList.appendChild(li);
  });
}

// --- メロディーを読み込む - 修正版 ---
function loadMelody(id) {
  console.log('メロディーを読み込みます...', id);
  
  // ローカルストレージからメロディーリストを取得
  const melodies = JSON.parse(localStorage.getItem('savedMelodies')) || [];
  
  // 指定されたIDのメロディーを検索
  const melody = melodies.find(m => m.id === id);
  
  if (!melody) {
    alert('メロディーが見つかりませんでした。');
    return;
  }
  
  // バージョン確認
  const isNewVersion = melody.version === "2.0";
  console.log(`メロディーバージョン: ${isNewVersion ? "2.0 (新)" : "1.0 (旧)"}`);
  
  // 現在の音符をクリア
  clearNotes();
  
  // 保存されていた音符を配置
  if (melody.notes && melody.notes.length > 0) {
    console.log(`読み込む音符数: ${melody.notes.length}`);
    
    // 音符を順番に配置（処理負荷分散のため）
    melody.notes.forEach((noteData, index) => {
      setTimeout(() => {
        try {
          if (isNewVersion) {
            // 新形式のデータ
            addNote(
              noteData.clef,
              noteData.x,
              noteData.y,
              noteData.id || `${noteData.clef}_${noteData.x}_${noteData.y}`,
              noteData.tone,
              false // プレビュー音は再生しない
            );
          } else {
            // 旧形式のデータ（互換モード）
            const noteKey = `${noteData.clef}_${noteData.y}`;
            const toneName = noteMapping[noteKey];
            
            if (toneName) {
              const noteId = `${noteData.clef}_${noteData.x}_${noteData.y}`;
              addNote(noteData.clef, noteData.x, noteData.y, noteId, toneName, false);
            } else {
              console.warn(`未定義の音階キー: ${noteKey}`);
            }
          }
        } catch (error) {
          console.error(`音符の復元エラー:`, error, noteData);
        }
      }, index * 20); // 各音符に20msの遅延
    });
    
    // すべての音符を配置した後にメッセージを表示
    setTimeout(() => {
      alert(`「${melody.name}」を読み込みました！`);
    }, melody.notes.length * 20 + 100);
  } else {
    alert(`「${melody.name}」を読み込みましたが、音符データがありませんでした。`);
  }
  
  // ダイアログを閉じる
  closeLoadDialog();
}

// --- メロディーを削除 ---
function deleteMelody(id) {
  // 確認ダイアログ
  if (!confirm('このメロディーを削除してもよろしいですか？')) {
    return;
  }
  
  // ローカルストレージからメロディーリストを取得
  let melodies = JSON.parse(localStorage.getItem('savedMelodies')) || [];
  
  // 指定されたIDのメロディーを削除
  melodies = melodies.filter(m => m.id !== id);
  
  // ローカルストレージに保存
  localStorage.setItem('savedMelodies', JSON.stringify(melodies));
  
  // リストを更新
  updateMelodyList();
  
  // メロディーがなくなった場合のメッセージ
  if (melodies.length === 0) {
    noMelodiesMessage.style.display = 'block';
  }
}