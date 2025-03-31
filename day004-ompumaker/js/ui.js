// ui.js - ユーザーインターフェース関連の機能

// --- UI要素 ---
let loadingDiv;
let startButton;
let playButton;
let clearButton;
let loopButton;
let playhead;
let musicContainer;

// --- UI要素の参照を取得 ---
function setupUIElements() {
  loadingDiv = document.getElementById('loading');
  startButton = document.getElementById('startButton');
  playButton = document.getElementById('play-button');
  clearButton = document.getElementById('clear-button');
  loopButton = document.getElementById('loop-button');
  playhead = document.getElementById('playhead');
  musicContainer = document.querySelector('.music-container');
}

// --- ドラッグ関連のイベントハンドラ ---
function setupDragEvents() {
  // --- マウスイベント ---
  // マウスダウンイベント（音符をつかむ）
  document.addEventListener('mousedown', function(event) {
    handleDragStart(event);
  });
  
  // マウス移動イベント（音符を移動）
  document.addEventListener('mousemove', function(event) {
    handleDragMove(event);
  });
  
  // マウスアップイベント（音符を配置）
  document.addEventListener('mouseup', function(event) {
    handleDragEnd(event);
  });
  
  // --- タッチイベント (モバイル対応) ---
  // タッチ開始イベント - 改善版
  document.addEventListener('touchstart', function(event) {
    // モバイルでのタッチ操作性を向上
    const touch = event.touches[0];
    // ターゲット要素をより正確に検出
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // タッチ位置に要素が見つかった場合
    if (target) {
      // タッチ情報にターゲット要素を追加
      const touchWithTarget = {
        target: target,
        clientX: touch.clientX,
        clientY: touch.clientY,
        stopPropagation: () => event.stopPropagation()
      };
      
      handleDragStart(touchWithTarget);
      
      // 音符要素の場合のみデフォルト動作を防止
      if (target.classList.contains('note')) {
        event.preventDefault();
      }
    }
  }, { passive: false });
  
  // タッチ移動イベント - 改善版
  document.addEventListener('touchmove', function(event) {
    // ドラッグ中のみスクロールを防止
    if (draggedNote) {
      event.preventDefault();
      
      const touch = event.touches[0];
      const touchWithInfo = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        stopPropagation: () => event.stopPropagation()
      };
      
      handleDragMove(touchWithInfo);
      
      // 自動スクロール対応
      handleAutoScroll(touch.clientX);
    }
  }, { passive: false });
  
  // タッチ終了イベント - 改善版
  document.addEventListener('touchend', function(event) {
    if (draggedNote) {
      // 最後の指の位置を取得
      const lastTouch = event.changedTouches[0];
      
      const touchWithInfo = {
        clientX: lastTouch.clientX,
        clientY: lastTouch.clientY,
        preventDefault: () => event.preventDefault(),
        stopPropagation: () => event.stopPropagation()
      };
      
      handleDragEnd(touchWithInfo);
    }
  });
  
  // タッチキャンセルイベント
  document.addEventListener('touchcancel', function(event) {
    if (draggedNote) {
      // ドラッグをキャンセル（元の位置に戻す）
      draggedNote.element.style.left = `${draggedNote.originalX}px`;
      draggedNote.element.style.top = `${draggedNote.originalY}px`;
      draggedNote.element.style.opacity = '1';
      draggedNote.element.style.zIndex = '10';
      draggedNote.element.style.boxShadow = '';
      draggedNote = null;
    }
  });
  
  // ドラッグ中の自動スクロール処理
  function handleAutoScroll(clientX) {
    if (!draggedNote) return;
    
    const containerRect = musicContainer.getBoundingClientRect();
    const scrollThreshold = 40; // スクロール開始領域のpx数
    const scrollSpeed = 8; // スクロール速度
    
    // 右端に近づいたら右にスクロール
    if (clientX > containerRect.right - scrollThreshold) {
      musicContainer.scrollLeft += scrollSpeed;
    }
    // 左端に近づいたら左にスクロール
    else if (clientX < containerRect.left + scrollThreshold) {
      musicContainer.scrollLeft -= scrollSpeed;
    }
  }
}

// ドラッグ開始ハンドラ
function handleDragStart(event) {
  if (event.target.classList.contains('note')) {
    // イベントの伝播を止める
    if (event.stopPropagation) event.stopPropagation();
    
    // 再生中は操作不可
    if (isPlaying) return;
    
    // ドラッグ開始
    draggedNote = {
      element: event.target,
      initialX: event.clientX,
      initialY: event.clientY,
      originalX: parseInt(event.target.style.left),
      originalY: parseInt(event.target.style.top),
      clef: event.target.closest('.staff').id.split('-')[0], // 'treble' or 'bass'
      lastPreviewTone: null,  // 最後にプレビューした音を記録するプロパティ
      lastScrollTime: 0       // 最後のスクロール時間
    };
    
    // 音符にドラッグ中のスタイルを適用
    event.target.style.opacity = '0.6';
    event.target.style.zIndex = '100';
    
    // クリック時の削除を防止するためのフラグ
    event.target.dataset.dragging = 'true';
    
    // ビジュアルフィードバック（モバイル向け）
    addDragVisualFeedback(event.target);
  }
}

// ドラッグ移動ハンドラ
function handleDragMove(event) {
  if (draggedNote) {
    // ドラッグ中はイベントの伝播を止める
    if (event.stopPropagation) event.stopPropagation();
    
    // 小さな動きでも確実にドラッグ状態にする
    draggedNote.element.dataset.dragging = 'true';
    
    const dx = event.clientX - draggedNote.initialX;
    const dy = event.clientY - draggedNote.initialY;
    
    // 音符の位置を更新
    const newX = draggedNote.originalX + dx;
    const newY = draggedNote.originalY + dy;
    
    draggedNote.element.style.left = `${newX}px`;
    draggedNote.element.style.top = `${newY}px`;
    
    // 現在のスタッフを取得
    const staff = document.getElementById(`${draggedNote.clef}-staff`);
    const rect = staff.getBoundingClientRect();
    
    // マウス位置からグリッド位置を計算
    const rawX = event.clientX - rect.left;
    const rawY = event.clientY - rect.top;
    
    // 有効な位置かをチェック
    if (rawX >= 120 && rawX <= rect.width && rawY >= 0 && rawY <= rect.height) {
      // Y座標をスナップ
      let snappedY;
      
      // 改善されたY座標のスナップ - より細かく
      if (rawY <= 25) {
        snappedY = 25;
      } else if (rawY <= 37.5) {
        snappedY = 37.5;
      } else if (rawY <= 50) {
        snappedY = 50;
      } else if (rawY <= 62.5) {
        snappedY = 62.5;
      } else if (rawY <= 75) {
        snappedY = 75;
      } else if (rawY <= 87.5) {
        snappedY = 87.5;
      } else if (rawY <= 100) {
        snappedY = 100;
      } else if (rawY <= 112.5) {
        snappedY = 112.5;
      } else if (rawY <= 125) {
        snappedY = 125;
      } else if (rawY <= 137.5) {
        snappedY = 137.5;
      } else if (rawY <= 150) {
        snappedY = 150;
      } else if (rawY <= 162.5) {
        snappedY = 162.5;
      } else if (rawY <= 175) {
        snappedY = 175;
      } else if (rawY <= 187.5) {
        snappedY = 187.5;
      } else {
        snappedY = 175;
      }
      
      // 対応する音階を取得
      const noteKey = `${draggedNote.clef}_${snappedY}`;
      const newTone = noteMapping[noteKey];
      
      if (newTone) {
        // 移動先の有効な音階がある場合、色を更新
        const colorKey = newTone.charAt(0);
        const color = colorMapping[colorKey] || '#000';
        draggedNote.element.style.backgroundColor = color;
        
        // ストローク効果を追加して視覚的なフィードバックを強化
        draggedNote.element.style.boxShadow = `0 0 0 2px white, 0 0 8px 3px ${color}80`;
        
        // 現在のプレビュー音と違う場合のみ音を鳴らす（音の連打を防止）
        if (draggedNote.lastPreviewTone !== newTone) {
          // 音を少し小さく再生（ヒント音として）
          synth.volume.value = -10; // 音量を下げる
          synth.triggerAttackRelease(newTone, '16n');
          synth.volume.value = 0; // 音量を元に戻す
          
          // 最後にプレビューした音を記録
          draggedNote.lastPreviewTone = newTone;
        }
      }
    } else {
      // 無効な位置の場合、元の色に戻す
      const originalNote = notes.find(n => n.element === draggedNote.element);
      if (originalNote) {
        const colorKey = originalNote.tone.charAt(0);
        const color = colorMapping[colorKey] || '#000';
        draggedNote.element.style.backgroundColor = color;
        
        // 通常のドラッグ中のスタイルに戻す
        draggedNote.element.style.boxShadow = '0 0 8px rgba(0, 0, 0, 0.7)';
      }
    }
  }
}

// ドラッグ終了ハンドラ
function handleDragEnd(event) {
  if (draggedNote) {
    // イベントの伝播を止めて、クリックイベントが発火するのを防ぐ
    if (event.preventDefault) event.preventDefault();
    if (event.stopPropagation) event.stopPropagation();
    
    // ドラッグ中フラグは少し遅延して削除（クリックイベントが処理された後）
    setTimeout(() => {
      if (draggedNote && draggedNote.element) {
        draggedNote.element.removeAttribute('data-dragging');
      }
    }, 100);
    
    // 音符のスタイルを元に戻す
    draggedNote.element.style.opacity = '1';
    draggedNote.element.style.zIndex = '10';
    draggedNote.element.style.boxShadow = '';  // ドラッグ中のエフェクトをクリア
    
    // ドロップされた座標を取得
    const staff = document.getElementById(`${draggedNote.clef}-staff`);
    const rect = staff.getBoundingClientRect();
    const rawX = event.clientX - rect.left;
    const rawY = event.clientY - rect.top;
    
    // 有効な配置エリアかチェック
    if (rawX < 120 || rawX > rect.width || rawY < 0 || rawY > rect.height) {
      // 範囲外なら元の位置に戻す
      draggedNote.element.style.left = `${draggedNote.originalX}px`;
      draggedNote.element.style.top = `${draggedNote.originalY}px`;
      draggedNote = null;
      return;
    }
    
    // X座標をグリッドにスナップ
    const x = Math.round((rawX - 120) / 25) * 25 + 120;
    
    // Y座標をグリッドにスナップ - より改善された精度
    let snappedY;
    if (rawY <= 25) {
      snappedY = 25;
    } else if (rawY <= 37.5) {
      snappedY = 37.5;
    } else if (rawY <= 50) {
      snappedY = 50;
    } else if (rawY <= 62.5) {
      snappedY = 62.5;
    } else if (rawY <= 75) {
      snappedY = 75;
    } else if (rawY <= 87.5) {
      snappedY = 87.5;
    } else if (rawY <= 100) {
      snappedY = 100;
    } else if (rawY <= 112.5) {
      snappedY = 112.5;
    } else if (rawY <= 125) {
      snappedY = 125;
    } else if (rawY <= 137.5) {
      snappedY = 137.5;
    } else if (rawY <= 150) {
      snappedY = 150;
    } else if (rawY <= 162.5) {
      snappedY = 162.5;
    } else if (rawY <= 175) {
      snappedY = 175;
    } else if (rawY <= 187.5) {
      snappedY = 187.5;
    } else {
      snappedY = 175;
    }
    
    // 同じ位置に既に音符があるかチェック
    const newNoteId = `${draggedNote.clef}_${x}_${snappedY}`;
    const existingNote = document.querySelector(`.note[data-id="${newNoteId}"]`);
    
    if (existingNote && existingNote !== draggedNote.element) {
      // 既存の音符がある場合、元の位置に戻す
      draggedNote.element.style.left = `${draggedNote.originalX}px`;
      draggedNote.element.style.top = `${draggedNote.originalY}px`;
    } else {
      // 音階情報を取得
      const noteKey = `${draggedNote.clef}_${snappedY}`;
      const newTone = noteMapping[noteKey];
      
      if (newTone) {
        // 音符の位置と音階を更新
        updateNotePosition(draggedNote.element, draggedNote.clef, x, snappedY, newTone);
      } else {
        // 無効な位置なら元に戻す
        draggedNote.element.style.left = `${draggedNote.originalX}px`;
        draggedNote.element.style.top = `${draggedNote.originalY}px`;
      }
    }
    
    // ドラッグ情報をクリア
    draggedNote = null;
  }
}

// ドラッグ中のビジュアルフィードバックを追加
function addDragVisualFeedback(element) {
  // すでに大きくなっているかチェック
  if (element.dataset.enhanced) return;
  
  // モバイル端末かどうかを検出
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // モバイルでのドラッグ時は一時的に音符を大きく表示
    const originalWidth = element.style.width;
    const originalHeight = element.style.height;
    
    // 音符を少し大きく
    element.style.width = '40px';
    element.style.height = '40px';
    element.dataset.enhanced = 'true';
    
    // ドラッグ終了時に元に戻す関数
    const resetSize = function() {
      element.style.width = originalWidth || '32px';
      element.style.height = originalHeight || '32px';
      element.removeAttribute('data-enhanced');
      element.removeEventListener('transitionend', resetSize);
      document.removeEventListener('mouseup', resetSize);
      document.removeEventListener('touchend', resetSize);
    };
    
    // ドラッグ終了時にリセット
    document.addEventListener('mouseup', resetSize, { once: true });
    document.addEventListener('touchend', resetSize, { once: true });
  }
}

// --- 五線譜クリックイベントをセット ---
function setupStaffClickEvents() {
  const trebleStaff = document.getElementById('treble-staff');
  const bassStaff   = document.getElementById('bass-staff');
  
  // タッチフィードバック要素（モバイル向け）の作成
  const touchFeedback = document.createElement('div');
  touchFeedback.className = 'touch-feedback';
  touchFeedback.style.cssText = `
    position: absolute;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: rgba(100, 100, 255, 0.3);
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 50;
    opacity: 0;
    transition: opacity 0.3s;
  `;
  document.body.appendChild(touchFeedback);
  
  // タッチフィードバック表示関数
  function showTouchFeedback(x, y) {
    touchFeedback.style.left = `${x}px`;
    touchFeedback.style.top = `${y}px`;
    touchFeedback.style.opacity = '1';
    
    setTimeout(() => {
      touchFeedback.style.opacity = '0';
    }, 300);
  }
  
  // ト音記号
  trebleStaff.addEventListener('click', function(event) {
    // タッチ操作のフィードバック
    showTouchFeedback(event.clientX, event.clientY);
    
    if (event.target.classList.contains('note')) {
      // ドラッグ中の場合は削除しない
      if (event.target.dataset.dragging === 'true') {
        return;
      }
      // 既存ノートなら削除
      removeNote(event.target);
      return;
    }
    // クリック座標
    const rect = trebleStaff.getBoundingClientRect();
    const rawX = event.clientX - rect.left;
    const rawY = event.clientY - rect.top;
    
    // デバッグ情報
    console.log(`クリック位置: x=${rawX}, y=${rawY}`);
    
    // 音部記号より右側か確認 (120px以降に配置可能)
    if (rawX < 120) return;
    
    // X座標を25pxごとのグリッドにスナップ
    const x = Math.round((rawX - 120) / 25) * 25 + 120;
    
    // Y座標を12.5pxごとのグリッドにスナップ (五線の線と間)
    let snappedY;
    
    // クリックした位置に基づいて最も近い音階位置を決定
    if (rawY <= 25) {
      snappedY = 25;  // G5 (一番上の線より上)
    } else if (rawY <= 37.5) {
      snappedY = 37.5; // F5 (一番上の線の上の間)
    } else if (rawY <= 50) {
      snappedY = 50;  // E5 (一番上の線)
    } else if (rawY <= 62.5) {
      snappedY = 62.5; // D5 (一番上と二番目の線の間)
    } else if (rawY <= 75) {
      snappedY = 75;  // C5 (二番目の線)
    } else if (rawY <= 87.5) {
      snappedY = 87.5; // B4 (二番目と三番目の線の間)
    } else if (rawY <= 100) {
      snappedY = 100; // A4 (三番目の線)
    } else if (rawY <= 112.5) {
      snappedY = 112.5; // G4 (三番目と四番目の線の間)
    } else if (rawY <= 125) {
      snappedY = 125; // F4 (四番目の線)
    } else if (rawY <= 137.5) {
      snappedY = 137.5; // E4 (四番目と五番目の線の間)
    } else if (rawY <= 150) {
      snappedY = 150; // D4 (五番目の線)
    } else if (rawY <= 162.5) {
      snappedY = 162.5; // C4 (五番目の線の下の間)
    } else if (rawY <= 175) {
      snappedY = 175; // B3 (下の加線)
    } else {
      console.log("範囲外のY座標:", rawY);
      return;
    }
    
    // noteIdと音名
    const noteKey = `treble_${snappedY}`;
    const toneName = noteMapping[noteKey];
    
    if (!toneName) {
      console.log(`未定義の音: ${noteKey}, Y=${snappedY}`);
      return;
    }

    const noteId = `treble_${x}_${snappedY}`;
    
    // デバッグ情報
    console.log(`配置: 音=${toneName}, 位置Y=${snappedY}`);
    
    // 同じ座標に既にあれば削除
    const existingNote = document.querySelector(`.note[data-id="${noteId}"]`);
    if (existingNote) {
      removeNote(existingNote);
    } else {
      addNote('treble', x, snappedY, noteId, toneName);
    }
  });
  
  // ヘ音記号 (同様の処理)
  bassStaff.addEventListener('click', function(event) {
    // タッチ操作のフィードバック
    showTouchFeedback(event.clientX, event.clientY);
    
    if (event.target.classList.contains('note')) {
      // ドラッグ中の場合は削除しない
      if (event.target.dataset.dragging === 'true') {
        return;
      }
      removeNote(event.target);
      return;
    }
    const rect = bassStaff.getBoundingClientRect();
    const rawX = event.clientX - rect.left;
    const rawY = event.clientY - rect.top;
    
    // 音部記号より右側か確認 (120px以降に配置可能)
    if (rawX < 120) return;
    
    // X座標を25pxごとのグリッドにスナップ
    const x = Math.round((rawX - 120) / 25) * 25 + 120;
    
    // Y座標を12.5pxごとのグリッドにスナップ (五線の線と間)
    let snappedY;
    
    // クリックした位置に基づいて最も近い音階位置を決定
    if (rawY <= 25) {
      snappedY = 25;  // B3 (一番上の線より上)
    } else if (rawY <= 37.5) {
      snappedY = 37.5; // A3 (一番上の線の上の間)
    } else if (rawY <= 50) {
      snappedY = 50;  // G3 (一番上の線)
    } else if (rawY <= 62.5) {
      snappedY = 62.5; // F3 (一番上と二番目の線の間)
    } else if (rawY <= 75) {
      snappedY = 75;  // E3 (二番目の線)
    } else if (rawY <= 87.5) {
      snappedY = 87.5; // D3 (二番目と三番目の線の間)
    } else if (rawY <= 100) {
      snappedY = 100; // C3 (三番目の線)
    } else if (rawY <= 112.5) {
      snappedY = 112.5; // B2 (三番目と四番目の線の間)
    } else if (rawY <= 125) {
      snappedY = 125; // A2 (四番目の線)
    } else if (rawY <= 137.5) {
      snappedY = 137.5; // G2 (四番目と五番目の線の間)
    } else if (rawY <= 150) {
      snappedY = 150; // F2 (五番目の線)
    } else if (rawY <= 162.5) {
      snappedY = 162.5; // E2 (五番目の線の下の間)
    } else if (rawY <= 175) {
      snappedY = 175; // D2 (下の加線)
    } else {
      console.log("範囲外のY座標:", rawY);
      return;
    }
    
    // noteIdと音名
    const noteKey = `bass_${snappedY}`;
    const toneName = noteMapping[noteKey];
    
    if (!toneName) {
      console.log(`未定義の音: ${noteKey}, Y=${snappedY}`);
      return;
    }

    const noteId = `bass_${x}_${snappedY}`;
    
    const existingNote = document.querySelector(`.note[data-id="${noteId}"]`);
    if (existingNote) {
      removeNote(existingNote);
    } else {
      addNote('bass', x, snappedY, noteId, toneName);
    }
  });
  
  // タッチイベント向けの追加処理
  document.addEventListener('touchstart', function(event) {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      showTouchFeedback(touch.clientX, touch.clientY);
    }
  }, { passive: true });
}

// --- ボタンイベントのセットアップ ---
function setupButtonEvents() {
  playButton.addEventListener('click', togglePlay);
  clearButton.addEventListener('click', clearNotes);
  loopButton.addEventListener('click', toggleLoop);
  
  // モバイル端末向けの改善
  enhanceButtonsForMobile();
  
  // ESCキーでダイアログを閉じる
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      document.getElementById('save-dialog').style.display = 'none';
      document.getElementById('load-dialog').style.display = 'none';
    }
  });
}

// モバイル端末向けのボタン最適化
function enhanceButtonsForMobile() {
  // モバイル端末かどうかを検出
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    const buttons = document.querySelectorAll('.button');
    
    // ボタンのタッチ領域を拡大
    buttons.forEach(button => {
      // タッチ開始時のエフェクト
      button.addEventListener('touchstart', function() {
        this.style.transform = 'scale(0.95)';
      }, { passive: true });
      
      // タッチ終了時のエフェクト
      button.addEventListener('touchend', function() {
        this.style.transform = '';
      }, { passive: true });
    });
    
    // ダブルタップによる拡大を防止
    document.addEventListener('dblclick', function(e) {
      if (e.target.classList.contains('button')) {
        e.preventDefault();
      }
    }, { passive: false });
  }
}