/**
 * クイズの管理に関するモジュール
 */

// スコアと状態管理 - 独立したレベルを追加
let pitchScore = 0;
let noteScore = 0;
let pitchLevel = 1; // 音当てクイズ専用レベル
let noteLevel = 1;  // 楽譜クイズ専用レベル
let currentPitchNote = '';
let currentNoteNote = '';
let isProcessingAnswer = false; // 回答処理中フラグ
let hasPlayedCurrentNote = false; // 現在の音符を再生済みかどうか


/**
 * 音当てクイズを開始する関数
 */
function startPitchQuiz() {
  // 回答処理中フラグとプレイ済みフラグをリセット
  isProcessingAnswer = false;
  hasPlayedCurrentNote = false;
  
  // 「音を聴く」ボタンを有効化
  enablePlayButton(true);
  
  // ランダムな音符を選択（すべての音を一通り出題）
  const note = getRandomNote();
  currentPitchNote = note.id;
  
  // フィードバックをリセット
  const feedback = document.getElementById('pitch-feedback');
  if (feedback) {
    feedback.textContent = 'まず「音を聴く」ボタンを押してね';
    feedback.className = 'feedback instruction';
  }
  
  // フィードバックオーバーレイを非表示
  hideFeedbackOverlay();
  
  // クイズタイトルにレベル表示を追加
  const quizTitle = document.querySelector('#pitch-quiz-screen .quiz-title');
  if (quizTitle) {
    quizTitle.innerHTML = `この音は何でしょう？ <span class="level-badge">レベル ${pitchLevel}</span>`;
    
    // レベル2以上の場合は説明を追加
    const infoElement = document.querySelector('#pitch-quiz-screen .level-info');
    if (pitchLevel >= 2) {
      if (!infoElement) {
        const noteInfo = document.createElement('div');
        noteInfo.className = 'level-info';
        noteInfo.innerHTML = '低い音(<span class="extended-notes">低いラ～シ</span>)と高い音(<span class="extended-notes">高いド～ファ</span>)も含まれます';
        quizTitle.after(noteInfo);
      }
    } else if (infoElement) {
      infoElement.remove();
    }
  }
  
  // スコア表示を更新
  updateScoreDisplay('pitch-score', pitchScore);
  
  // 回答ボタンのスタイルをリセット
  resetButtonStyles();
  
  // 回答ボタンを非アクティブにする
  setAnswerButtonsActive(false);
  
  // 音当てクイズ用に音符セットを更新
  updateNotesForLevel(pitchLevel);
  
  // 回答ボタンを更新（すべての音符オプションを表示）
  updateAnswerButtons();
}


/**
 * 「音を聴く」ボタンの有効/無効を切り替える
 * @param {boolean} enabled - ボタンを有効にするならtrue
 */
function enablePlayButton(enabled) {
  const playButton = document.getElementById('play-note');
  if (playButton) {
    if (enabled) {
      playButton.disabled = false;
      playButton.classList.remove('disabled');
    } else {
      playButton.disabled = true;
      playButton.classList.add('disabled');
    }
  }
}

/**
 * 音当てクイズの音を再生
 */
function playPitchQuizSound() {
  // 音を再生
  if (playNote(currentPitchNote)) {
    hasPlayedCurrentNote = true;
    
    // フィードバックを更新
    const feedback = document.getElementById('pitch-feedback');
    if (feedback) {
      feedback.textContent = 'どの音かな？下から選んでね';
      feedback.className = 'feedback instruction';
    }
    
    // 回答ボタンをアクティブにする
    setAnswerButtonsActive(true);
  }
}

/**
 * 回答ボタンのアクティブ状態を切り替える
 * @param {boolean} isActive - アクティブにするかどうか
 */
function setAnswerButtonsActive(isActive) {
  const answerButtons = document.querySelectorAll('#pitch-quiz-screen .btn-answer');
  answerButtons.forEach(button => {
    if (isActive) {
      button.classList.remove('disabled');
      button.disabled = false;
    } else {
      button.classList.add('disabled');
      button.disabled = true;
    }
  });
}


/**
 * 回答ボタンのスタイルをリセットする
 */
function resetButtonStyles() {
  const buttons = document.querySelectorAll('#pitch-quiz-screen .btn-answer');
  buttons.forEach(button => {
    button.classList.remove('correct-selected', 'incorrect-selected', 'show-correct');
  });
}

/**
 * 回答ボタンを更新する関数（音符に合わせて）
 */
function updateAnswerButtons() {
  const answerGrid = document.querySelector('#pitch-quiz-screen .answer-grid');
  if (!answerGrid) return;
  
  // 現在のボタンをクリア
  answerGrid.innerHTML = '';
  
  // 音符を周波数順（低い音から高い音へ）にソート
  const sortedNotes = [...notes].sort((a, b) => a.frequency - b.frequency);
  
  // 固定で列数を設定（レベルに応じて列数を変更）
  if (pitchLevel >= 2 && sortedNotes.length > 8) {
    // レベル2以上で音符が多い場合は4列
    answerGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
  } else {
    // それ以外は3列
    answerGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
  }
  
  // すべての音符のボタンを作成（周波数順）
  sortedNotes.forEach(note => {
    const button = document.createElement('button');
    button.className = 'btn btn-answer disabled'; // 最初は非アクティブ
    button.setAttribute('data-note', note.id);
    button.textContent = note.name;
    button.disabled = true; // 最初は無効
    
    // クリックイベントを追加
    button.addEventListener('click', () => {
      if (!isAudioInitialized()) {
        initializeAudio().then(() => {
          checkPitchAnswer(note.id);
        });
      } else {
        checkPitchAnswer(note.id);
      }
    });
    
    answerGrid.appendChild(button);
  });
}

/**
 * 楽譜クイズの回答ボタンを更新
 */
function updateNoteAnswerButtons() {
  const answerGrid = document.querySelector('#note-quiz-screen .answer-grid');
  if (!answerGrid) return;
  
  // 現在のボタンをクリア
  answerGrid.innerHTML = '';
  
  // 音符を周波数順（低い音から高い音へ）にソート
  const sortedNotes = [...notes].sort((a, b) => a.frequency - b.frequency);
  
  // 固定で列数を設定（レベルに応じて列数を変更）
  if (noteLevel >= 2 && sortedNotes.length > 8) {
    // レベル2以上で音符が多い場合は4列
    answerGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
  } else {
    // それ以外は3列
    answerGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
  }
  
  // すべての音符のボタンを作成（周波数順）
  sortedNotes.forEach(note => {
    const button = document.createElement('button');
    button.className = 'btn btn-answer';
    button.setAttribute('data-note', note.id);
    button.textContent = `${note.name} (${note.id.charAt(0)})`;
    
    // クリックイベントを追加
    button.addEventListener('click', () => {
      if (!isAudioInitialized()) {
        initializeAudio().then(() => {
          checkNoteAnswer(note.id);
        });
      } else {
        checkNoteAnswer(note.id);
      }
    });
    
    answerGrid.appendChild(button);
  });
}


/**
 * 楽譜クイズを開始する関数
 */
function startNoteQuiz() {
  // 回答処理中フラグをリセット
  isProcessingAnswer = false;
  
  // ランダムな音符を選択（すべての音を一通り出題）
  const note = getRandomNote();
  currentNoteNote = note.id;
  
  // フィードバックをリセット
  const feedback = document.getElementById('note-feedback');
  if (feedback) {
    feedback.textContent = '上の楽譜を見て、音を当ててね';
    feedback.className = 'feedback instruction';
  }
  
  // フィードバックオーバーレイを非表示
  hideFeedbackOverlay();
  
  // クイズタイトルにレベル表示を追加
  const quizTitle = document.querySelector('#note-quiz-screen .quiz-title');
  if (quizTitle) {
    quizTitle.innerHTML = `この楽譜はどの音？ <span class="level-badge">レベル ${noteLevel}</span>`;
    
    // レベル2以上の場合は説明を追加
    const infoElement = document.querySelector('#note-quiz-screen .level-info');
    if (noteLevel >= 2) {
      if (!infoElement) {
        const noteInfo = document.createElement('div');
        noteInfo.className = 'level-info';
        noteInfo.innerHTML = '低い音(<span class="extended-notes">低いラ～シ</span>)と高い音(<span class="extended-notes">高いド～ファ</span>)も含まれます';
        quizTitle.after(noteInfo);
      }
    } else if (infoElement) {
      infoElement.remove();
    }
  }
  
  // 楽譜クイズ用に音符セットを更新
  updateNotesForLevel(noteLevel);
  
  // 楽譜を描画
  drawSheet(note.id);
  
  // スコア表示を更新
  updateScoreDisplay('note-score', noteScore);
  
  // 回答ボタンのスタイルをリセット
  resetNoteButtonStyles();
  
  // 回答ボタンを更新
  updateNoteAnswerButtons();
}

/**
 * 楽譜クイズの回答ボタンのスタイルをリセットする
 */
function resetNoteButtonStyles() {
  const buttons = document.querySelectorAll('#note-quiz-screen .btn-answer');
  buttons.forEach(button => {
    button.classList.remove('correct-selected', 'incorrect-selected', 'show-correct');
  });
}


/**
 * 音当てクイズの回答をチェックする関数
 * @param {string} selectedNote - プレイヤーが選択した音符のID
 */
function checkPitchAnswer(selectedNote) {
  // 回答処理中なら無視（連打防止）
  if (isProcessingAnswer) return;
  
  // 音を再生していない場合は無視
  if (!hasPlayedCurrentNote) return;
  
  // 回答処理中フラグを設定
  isProcessingAnswer = true;
  
  // 「音を聴く」ボタンを無効化
  enablePlayButton(false);
  
  const isCorrect = selectedNote === currentPitchNote;
  const feedback = document.getElementById('pitch-feedback');
  
  // フィードバックオーバーレイを表示（ボタン操作を防止）
  showFeedbackOverlay();
  
  // 選択したボタンを強調表示
  highlightSelectedButton(selectedNote);
  
  if (isCorrect) {
    // 正解の場合
    feedback.textContent = 'せいかい！';
    feedback.className = 'feedback correct animate-bounce';
    pitchScore += 10;
    
    // 1秒後に次のクイズを開始（短縮）
    setTimeout(() => {
      hideFeedbackOverlay();
      startPitchQuiz();
    }, 1000);
  } else {
    // 不正解の場合
    const correctNoteName = getNoteNameById(currentPitchNote);
    feedback.innerHTML = `ざんねん...<br>正解は <span class="correct-answer">${correctNoteName}</span> でした`;
    feedback.className = 'feedback incorrect';
    
    // 正解のボタンも強調表示
    highlightCorrectButton();
    
    // 正解の音符を再生
    setTimeout(() => {
      playNote(currentPitchNote);
    }, 300);
    
    // 2秒後に次のクイズを開始
    setTimeout(() => {
      hideFeedbackOverlay();
      startPitchQuiz();
    }, 2000);
  }
  
  // 回答ボタンを非アクティブにする
  setAnswerButtonsActive(false);
  
  // スコア表示の更新
  updateScoreDisplay('pitch-score', pitchScore);
  
  // レベルの更新 - 音当てクイズのみ
  updatePitchLevel();
}


/**
 * レベルアップ通知を表示する関数
 * @param {string} quizType - クイズの種類（音当て/楽譜）
 * @param {number} newLevel - 新しいレベル
 * @param {number} oldLevel - 古いレベル
 */
function showLevelUpNotice(quizType, newLevel, oldLevel) {
  const levelUpNotice = document.createElement('div');
  levelUpNotice.className = 'level-up-notice';
  
  // レベル2以上になったときは拡張セットの紹介も表示
  if (newLevel >= 2 && oldLevel < 2) {
    levelUpNotice.innerHTML = `${quizType}クイズ レベル ${newLevel} になりました！<br>新しい音符が追加されました！`;
  } else {
    levelUpNotice.textContent = `${quizType}クイズ レベル ${newLevel} になりました！`;
  }
  
  document.body.appendChild(levelUpNotice);
  
  // 2秒後に通知を消す
  setTimeout(() => {
    levelUpNotice.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(levelUpNotice);
    }, 500);
  }, 2000);
}

/**
 * 楽譜クイズのレベルを更新する関数
 */
function updateNoteLevel() {
  const oldLevel = noteLevel;
  const newLevel = Math.floor(noteScore / 100) + 1;
  
  if (newLevel > noteLevel) {
    noteLevel = newLevel;
    
    // レベルに応じて音符セットを更新（楽譜クイズ用）
    if (currentScreen === 'note-quiz') {
      updateNotesForLevel(noteLevel);
    }
    
    // レベルアップ時の演出
    showLevelUpNotice('楽譜', noteLevel, oldLevel);
  }
}


/**
 * 音当てクイズのレベルを更新する関数
 */
function updatePitchLevel() {
  const oldLevel = pitchLevel;
  const newLevel = Math.floor(pitchScore / 100) + 1;
  
  if (newLevel > pitchLevel) {
    pitchLevel = newLevel;
    
    // レベルに応じて音符セットを更新（音当てクイズ用）
    if (currentScreen === 'pitch-quiz') {
      updateNotesForLevel(pitchLevel);
    }
    
    // レベルアップ時の演出
    showLevelUpNotice('音当て', pitchLevel, oldLevel);
  }
}

/**
 * 楽譜クイズの回答をチェックする関数
 * @param {string} selectedNote - プレイヤーが選択した音符のID
 */
function checkNoteAnswer(selectedNote) {
  // 回答処理中なら無視（連打防止）
  if (isProcessingAnswer) return;
  
  // 回答処理中フラグを設定
  isProcessingAnswer = true;
  
  const isCorrect = selectedNote === currentNoteNote;
  const feedback = document.getElementById('note-feedback');
  
  // フィードバックオーバーレイを表示（ボタン操作を防止）
  showFeedbackOverlay();
  
  // 選択したボタンを強調表示
  highlightNoteSelectedButton(selectedNote);
  
  if (isCorrect) {
    // 正解の場合
    feedback.textContent = 'せいかい！';
    feedback.className = 'feedback correct animate-bounce';
    noteScore += 10;
    
    // 選択した音符を再生
    setTimeout(() => {
      playNote(selectedNote);
    }, 200);
    
    // 1.5秒後に次のクイズを開始
    setTimeout(() => {
      hideFeedbackOverlay();
      startNoteQuiz();
    }, 1500);
  } else {
    // 不正解の場合
    const correctNoteName = getNoteNameById(currentNoteNote);
    feedback.innerHTML = `ざんねん...<br>正解は <span class="correct-answer">${correctNoteName}</span> でした`;
    feedback.className = 'feedback incorrect';
    
    // 正解のボタンも強調表示
    setTimeout(() => {
      highlightNoteCorrectButton();
    }, 300);
    
    // 正解の音符を再生
    setTimeout(() => {
      playNote(currentNoteNote);
    }, 600);
    
    // 2秒後に次のクイズを開始
    setTimeout(() => {
      hideFeedbackOverlay();
      startNoteQuiz();
    }, 2000);
  }
  
  // スコア表示の更新
  updateScoreDisplay('note-score', noteScore);
  
  // レベルの更新 - 楽譜クイズのみ
  updateNoteLevel();
}


/**
 * フィードバックオーバーレイを非表示にする関数
 */
function hideFeedbackOverlay() {
  const overlay = document.querySelector('.feedback-overlay');
  if (overlay) {
    overlay.classList.remove('active');
  }
  
  // フィードバック自体も指示に戻す
  const pitchFeedback = document.getElementById('pitch-feedback');
  const noteFeedback = document.getElementById('note-feedback');
  
  if (pitchFeedback && currentScreen === 'pitch-quiz') {
    pitchFeedback.textContent = 'まず「音を聴く」ボタンを押してね';
    pitchFeedback.className = 'feedback instruction';
  }
  
  if (noteFeedback && currentScreen === 'note-quiz') {
    noteFeedback.textContent = '上の楽譜を見て、音を当ててね';
    noteFeedback.className = 'feedback instruction';
  }
}

/**
 * フィードバックオーバーレイを表示する関数
 */
function showFeedbackOverlay() {
  // オーバーレイがまだ存在しない場合は作成
  let overlay = document.querySelector('.feedback-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'feedback-overlay';
    document.body.appendChild(overlay);
  }
  
  // オーバーレイを表示
  overlay.classList.add('active');
}

/**
 * レベルを更新する関数
 */
function updateLevel() {
  const oldLevel = level;
  const newLevel = Math.floor(totalScore / 100) + 1;
  
  if (newLevel > level) {
    level = newLevel;
    
    // レベルに応じて音符セットを更新
    updateNotesForLevel(level);
    
    // レベルアップ時の演出
    const levelUpNotice = document.createElement('div');
    levelUpNotice.className = 'level-up-notice';
    
    // レベル2以上になったときは拡張セットの紹介も表示
    if (level >= 2 && oldLevel < 2) {
      levelUpNotice.innerHTML = `レベル ${level} になりました！<br>新しい音符が追加されました！`;
    } else {
      levelUpNotice.textContent = `レベル ${level} になりました！`;
    }
    
    document.body.appendChild(levelUpNotice);
    
    // 2秒後に通知を消す
    setTimeout(() => {
      levelUpNotice.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(levelUpNotice);
      }, 500);
    }, 2000);
  }
}

/**
 * スコア表示を更新する関数
 * @param {string} elementId - 更新するスコア表示要素のID
 * @param {number} score - 表示するスコア
 */
function updateScoreDisplay(elementId, score) {
  const scoreElement = document.getElementById(elementId);
  if (scoreElement) {
    scoreElement.textContent = `スコア: ${score}`;
  }
}


/**
 * 進捗表示を更新する関数
 */
function updateProgressDisplay() {
  // 音当てクイズのレベル進捗
  const pitchLevelDisplay = document.createElement('div');
  pitchLevelDisplay.innerHTML = `<div class="quiz-type-label">音当てクイズ:</div>
                               <div class="level-display">レベル ${pitchLevel}</div>
                               <div class="score-display">スコア: ${pitchScore}</div>`;
  
  // 楽譜クイズのレベル進捗
  const noteLevelDisplay = document.createElement('div');
  noteLevelDisplay.innerHTML = `<div class="quiz-type-label">楽譜クイズ:</div>
                             <div class="level-display">レベル ${noteLevel}</div>
                             <div class="score-display">スコア: ${noteScore}</div>`;
  
  // 表示コンテナの取得と初期化
  const quizContainer = document.querySelector('#progress-screen .quiz-container');
  if (quizContainer) {
    quizContainer.innerHTML = '';
    
    // スタイルを追加
    const style = document.createElement('style');
    style.textContent = `
      .quiz-progress-item {
        background-color: rgba(255, 255, 255, 0.5);
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 15px;
      }
      .quiz-type-label {
        font-weight: bold;
        color: var(--primary-color);
        margin-bottom: 5px;
      }
      .level-display {
        font-size: 20px;
        font-weight: bold;
        color: var(--accent-color);
        margin-bottom: 5px;
      }
      .next-level-label {
        text-align: left;
        margin-bottom: 5px;
        font-size: 14px;
        color: var(--light-text);
      }
      .level-badges {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-top: 10px;
      }
      .level-badge-item {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background-color: #f3f4f6;
        border: 2px solid #d1d5db;
        font-size: 16px;
      }
      .level-badge-item.earned {
        background-color: #fef3c7;
        border-color: var(--warning-color);
      }
    `;
    document.head.appendChild(style);
    
    // 音当てクイズの進捗項目
    const pitchProgressItem = document.createElement('div');
    pitchProgressItem.className = 'quiz-progress-item';
    pitchProgressItem.innerHTML = `
      <div class="quiz-type-label">音当てクイズ</div>
      <div class="level-display">レベル ${pitchLevel}</div>
      <div class="score-display">スコア: ${pitchScore}</div>
      <div class="next-level-label">次のレベルまで:</div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${(pitchScore % 100) / 100 * 100}%;"></div>
      </div>
      <div class="level-badges">
        ${generateLevelBadges(pitchLevel, 3)}
      </div>
    `;
    quizContainer.appendChild(pitchProgressItem);
    
    // 楽譜クイズの進捗項目
    const noteProgressItem = document.createElement('div');
    noteProgressItem.className = 'quiz-progress-item';
    noteProgressItem.innerHTML = `
      <div class="quiz-type-label">楽譜クイズ</div>
      <div class="level-display">レベル ${noteLevel}</div>
      <div class="score-display">スコア: ${noteScore}</div>
      <div class="next-level-label">次のレベルまで:</div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${(noteScore % 100) / 100 * 100}%;"></div>
      </div>
      <div class="level-badges">
        ${generateLevelBadges(noteLevel, 3)}
      </div>
    `;
    quizContainer.appendChild(noteProgressItem);
  }
}

/**
 * レベルバッジを生成する関数
 * @param {number} level - 現在のレベル
 * @param {number} maxBadges - 表示するバッジの最大数
 * @returns {string} - バッジのHTML
 */
function generateLevelBadges(level, maxBadges) {
  let badgesHTML = '';
  for (let i = 1; i <= maxBadges; i++) {
    const isEarned = i <= level;
    badgesHTML += `<div class="level-badge-item ${isEarned ? 'earned' : ''}">${isEarned ? '🌟' : '⭐'}</div>`;
  }
  return badgesHTML;
}

/**
 * バッジの表示を更新する関数
 */
function updateBadges() {
  for (let i = 1; i <= 6; i++) {
    const badge = document.getElementById(`badge-${i}`);
    if (badge) {
      if (i <= level) {
        badge.textContent = '🌟';
        badge.classList.add('earned');
      } else {
        badge.textContent = '⭐';
        badge.classList.remove('earned');
      }
    }
  }
}

/**
 * 選択されたボタンを強調表示する
 * @param {string} noteId - 強調表示するボタンの音符ID
 */
function highlightSelectedButton(noteId) {
  const buttons = document.querySelectorAll('#pitch-quiz-screen .btn-answer');
  buttons.forEach(button => {
    if (button.dataset.note === noteId) {
      if (noteId === currentPitchNote) {
        button.classList.add('correct-selected');
      } else {
        button.classList.add('incorrect-selected');
      }
    }
  });
}

/**
 * 正解のボタンを強調表示する
 */
function highlightCorrectButton() {
  const buttons = document.querySelectorAll('#pitch-quiz-screen .btn-answer');
  buttons.forEach(button => {
    if (button.dataset.note === currentPitchNote) {
      button.classList.add('show-correct');
    }
  });
}

/**
 * 楽譜クイズで選択されたボタンを強調表示する
 * @param {string} noteId - 強調表示するボタンの音符ID
 */
function highlightNoteSelectedButton(noteId) {
  const buttons = document.querySelectorAll('#note-quiz-screen .btn-answer');
  buttons.forEach(button => {
    if (button.dataset.note === noteId) {
      if (noteId === currentNoteNote) {
        button.classList.add('correct-selected');
      } else {
        button.classList.add('incorrect-selected');
      }
    }
  });
}

/**
 * 楽譜クイズで正解のボタンを強調表示する
 */
function highlightNoteCorrectButton() {
  const buttons = document.querySelectorAll('#note-quiz-screen .btn-answer');
  buttons.forEach(button => {
    if (button.dataset.note === currentNoteNote) {
      button.classList.add('show-correct');
    }
  });
}

/**
 * スコアデータを取得する関数
 * @returns {Object} - 現在のスコアデータ
 */
function getScoreData() {
  return {
    pitchScore,
    noteScore,
    totalScore,
    level
  };
}


/**
 * スコアリセットの確認ダイアログを表示
 */
function showResetConfirmation() {
  // すでにダイアログが表示されている場合は処理しない
  if (document.querySelector('.confirm-dialog')) {
    return;
  }

  // ダイアログ要素の作成
  const dialog = document.createElement('div');
  dialog.className = 'confirm-dialog';
  dialog.id = 'reset-confirm-dialog'; // ID追加
  
  // ダイアログの内容
  dialog.innerHTML = `
    <div class="confirm-box">
      <div class="confirm-text">すべてのスコアとレベルをリセットしますか？</div>
      <div class="confirm-buttons">
        <button class="btn confirm-no">いいえ</button>
        <button class="btn confirm-yes">はい</button>
      </div>
    </div>
  `;
  
  // ボディに追加
  document.body.appendChild(dialog);
  
  // イベントリスナー
  const yesButton = dialog.querySelector('.confirm-yes');
  const noButton = dialog.querySelector('.confirm-no');
  
  yesButton.addEventListener('click', () => {
    // スコアリセット実行
    resetScores();
    // ダイアログ閉じる
    removeResetDialog();
    // ローカルストレージもクリア
    localStorage.removeItem('musicQuizScores');
    // 表示を更新
    updateProgressDisplay();
    
    // リセット完了通知
    const resetNotice = document.createElement('div');
    resetNotice.className = 'level-up-notice';
    resetNotice.style.backgroundColor = 'rgba(239, 68, 68, 0.9)';
    resetNotice.textContent = 'スコアをリセットしました';
    
    document.body.appendChild(resetNotice);
    
    // 2秒後に通知を消す
    setTimeout(() => {
      resetNotice.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(resetNotice);
      }, 500);
    }, 2000);
  });
  
  noButton.addEventListener('click', () => {
    // ダイアログを閉じるだけ
    removeResetDialog();
  });
}

/**
 * リセット確認ダイアログを削除する補助関数
 */
function removeResetDialog() {
  const dialog = document.getElementById('reset-confirm-dialog');
  if (dialog) {
    document.body.removeChild(dialog);
  }
}

/**
 * スコアをリセットする関数
 */
function resetScores() {
  pitchScore = 0;
  noteScore = 0;
  pitchLevel = 1;
  noteLevel = 1;
  
  // レベル1に応じた音符セットに戻す
  updateNotesForLevel(1);
  
  // 表示も更新
  updateScoreDisplay('pitch-score', pitchScore);
  updateScoreDisplay('note-score', noteScore);
  updateProgressDisplay();
  updateHomeScreenLevel();
}