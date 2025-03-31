// player.js - 音楽再生に関する機能

// --- Tone.js関連 ---
let synth;
let isPlaying = false;
let isLooping = false;
let currentColumn = 0;
let sequencer;

// --- 再生/停止トグル ---
function togglePlay() {
  isPlaying = !isPlaying;
  if (isPlaying) {
    playButton.textContent = '■ 停止';
    playhead.style.display = 'block';
    startSequencer();
  } else {
    playButton.textContent = '▶ 再生';
    clearInterval(sequencer);
    playhead.style.display = 'none';
  }
}

// --- シーケンサー ---
function startSequencer() {
  const containerWidth = musicContainer.offsetWidth;
  
  // グリッドの開始位置を設定
  const GRID_START = 120;
  currentColumn = GRID_START;
  
  // プレイヘッドのスタイル調整
  playhead.style.display = 'block';
  playhead.style.position = 'absolute';
  playhead.style.top = '0';
  playhead.style.left = `${currentColumn}px`;
  playhead.style.transition = 'none'; // アニメーションなしで初期位置へ
  
  // プレイヘッドの高さを調整
  adjustPlayheadHeight();
  
  // プレイヘッドの位置をz-indexを高く設定して確実に前面に表示
  playhead.style.zIndex = '50';
  
  // 少し遅延して再生開始（DOMレンダリング完了後）
  setTimeout(() => {
    // プレイヘッドの位置を再確認
    playhead.style.left = `${currentColumn}px`;
    
    // アニメーションを有効に
    playhead.style.transition = 'left 0.25s linear';
    
    // シーケンサーの開始
    sequencer = setInterval(() => {
      // 現在位置の音符を再生
      playNotesAtPosition(currentColumn);
      
      // 次のグリッド位置へ移動
      currentColumn += 25;
      
      // プレイヘッドの位置を更新（アニメーションによって滑らかに移動）
      playhead.style.left = `${currentColumn}px`;
      
      // 右端まで来たら
      if (currentColumn >= containerWidth - 20) {
        if (isLooping) {
          // アニメーションを一時的に無効にして即座に初期位置に戻す
          playhead.style.transition = 'none';
          currentColumn = GRID_START;
          playhead.style.left = `${currentColumn}px`;
          
          // 次のフレームでアニメーションを再有効化
          setTimeout(() => {
            playhead.style.transition = 'left 0.25s linear';
          }, 10);
        } else {
          clearInterval(sequencer);
          isPlaying = false;
          playButton.textContent = '▶ 再生';
          playhead.style.display = 'none';
        }
      }
    }, 250); // 250ms間隔（適度なテンポ）
  }, 10);
}

// プレイヘッドの高さを動的に調整する関数（修正版）
function adjustPlayheadHeight() {
  if (!playhead) return;
  
  // スタッフコンテナの総合的な高さを計算
  const staffContainers = document.querySelectorAll('.staff-container');
  let totalHeight = 0;
  
  staffContainers.forEach(container => {
    totalHeight += container.offsetHeight;
  });
  
  // 五線譜の上下のパディングも考慮
  const musicContainerPadding = 40; // 上下20pxずつと仮定
  
  // 実際のプレイヘッドの高さを設定（少し余裕を持たせる）
  playhead.style.height = `${totalHeight + musicContainerPadding}px`;
  
  // 透明度を調整して視認性をよくする（モバイル向け）
  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    playhead.style.opacity = '0.8';
    playhead.style.width = '3px';
  } else {
    playhead.style.opacity = '1';
    playhead.style.width = '2px';
  }
  
  console.log('プレイヘッドの高さを調整しました:', playhead.style.height);
}

// 指定位置の音符を再生する関数
function playNotesAtPosition(position) {
  const currentNotes = notes.filter(n => parseInt(n.x) === position);
  
  if (currentNotes.length > 0) {
    // 同時に再生する音符数を制限して音割れを防止
    const maxSimultaneousNotes = 8;
    const notesToPlay = currentNotes.length > maxSimultaneousNotes 
      ? currentNotes.slice(0, maxSimultaneousNotes) 
      : currentNotes;
    
    notesToPlay.forEach(n => {
      // 元の音の長さに戻す
      synth.triggerAttackRelease(n.tone, '8n');
    });
  }
}

// --- ループON/OFF ---
function toggleLoop() {
  isLooping = !isLooping;
  loopButton.textContent = isLooping ? '🔄 ループON' : '🔄 ループOFF';
}