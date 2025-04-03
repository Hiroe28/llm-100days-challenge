/**
 * タイピング入力と日本語変換処理を管理するモジュール
 */
import { HIRAGANA_TO_ROMAJI, ROMAJI_CONVERSION_RULES, initialRomajiState, COMPOUND_HIRAGANA } from './config.js';
import { GAME_STATE, checkWordCompletion } from './game.js';
import { updateProgressBar, updateEnemyWordDisplay, updateTypingDisplay } from './ui.js';
import { playSound } from './sound.js';

// ローマ字入力関連の変数
export const GAME_ROMAJI = { ...initialRomajiState };

/**
 * 単語のローマ字変換パターンを生成
 * @param {string} hiraganaWord ひらがな単語
 */
export function generateAlternativeInputs(hiraganaWord) {
  // 拡張アルゴリズムで詳細なパターンを生成
  const extendedPatterns = generateRomajiPatterns(hiraganaWord);
  if (extendedPatterns.length > 0) {
    GAME_ROMAJI.alternativeInputs = extendedPatterns;
    return;
  }
  
  // フォールバック：単純な文字ごとの変換
  let mainPattern = '';
  for (let i = 0; i < hiraganaWord.length; i++) {
    const char = hiraganaWord[i];
    if (HIRAGANA_TO_ROMAJI[char]) {
      mainPattern += HIRAGANA_TO_ROMAJI[char][0];
    } else {
      mainPattern += char;
    }
  }
  
  // 特定の文字についてよく使われるパターンを追加
  let patterns = [mainPattern];
  
  // つ/ツのパターン
  if (hiraganaWord.includes('つ')) {
    patterns.push(mainPattern.replace(/tsu/g, 'tu'));
  }
  
  // し/シのパターン
  if (hiraganaWord.includes('し')) {
    patterns.push(mainPattern.replace(/shi/g, 'si'));
  }
  
  // ち/チのパターン
  if (hiraganaWord.includes('ち')) {
    patterns.push(mainPattern.replace(/chi/g, 'ti'));
  }
  
  // ふ/フのパターン
  if (hiraganaWord.includes('ふ')) {
    patterns.push(mainPattern.replace(/fu/g, 'hu'));
  }
  
  // じ/ジのパターン
  if (hiraganaWord.includes('じ')) {
    patterns.push(mainPattern.replace(/ji/g, 'zi'));
  }
  
  // 「ん」の特殊処理（n/nn両方対応）
  if (hiraganaWord.includes('ん')) {
    // 「n」と「nn」の両パターンを生成
    const extraPatterns = [];
    for (const pattern of patterns) {
      // 母音の前の「ん」は「n」のみ
      const nnPattern = pattern.replace(/n([^aiueo]|$)/g, 'nn$1');
      if (nnPattern !== pattern) {
        extraPatterns.push(nnPattern);
      }
    }
    patterns = [...patterns, ...extraPatterns];
  }
  
  GAME_ROMAJI.alternativeInputs = patterns;
}


/**
 * ローマ字入力処理
 * @param {string} key 入力されたキー
 * @returns {boolean} 入力が処理されたかどうか
 */
export function handleRomajiInput(key) {
    console.log(`ローマ字入力処理: key=${key}`);
    
    // ローマ字情報がない場合は初期化
    if ((!GAME_ROMAJI.romajiWord || !GAME_ROMAJI.alternativeInputs || GAME_ROMAJI.alternativeInputs.length === 0) && 
        GAME_STATE.currentTypingEnemy) {
      initRomajiInput(GAME_STATE.currentTypingEnemy.word);
      console.log("ローマ字情報を初期化しました:", GAME_ROMAJI.romajiWord);
    }
    
    // バックスペースの処理
    if (key === 'Backspace') {
      if (GAME_ROMAJI.typedRomaji.length > 0) {
        // 一文字削除
        GAME_ROMAJI.typedRomaji = GAME_ROMAJI.typedRomaji.slice(0, -1);
        
        // 進捗更新
        if (GAME_ROMAJI.romajiWord) {
          const progress = GAME_ROMAJI.typedRomaji.length / GAME_ROMAJI.romajiWord.length;
          if (GAME_STATE.currentTypingEnemy) {
            GAME_STATE.currentTypingEnemy.progress = progress;
            
            // 表示更新
            updateEnemyWordDisplay();
            updateProgressBar(progress);
            updateRomajiDisplay();
          }
        }
      }
      return true;
    }
    
    // 入力チェック - パターンを検索
    const currentPosition = GAME_ROMAJI.typedRomaji.length;
    let matched = false;
    let expectedChar = '';
    let matchedPattern = '';
    
    // どのパターンが最適かを検出（前方一致で最も長く一致するものを探す）
    if (GAME_ROMAJI.alternativeInputs && GAME_ROMAJI.alternativeInputs.length > 0) {
      // 1. 現在の入力が前方一致するパターンを探す
      for (const pattern of GAME_ROMAJI.alternativeInputs) {
        if (pattern.startsWith(GAME_ROMAJI.typedRomaji + key)) {
          // 現在の入力+新しいキーがどのパターンの正確な前方一致になっているか確認
          matched = true;
          matchedPattern = pattern;
          break;
        }
      }
      
      // マッチするパターンが見つからなかった場合は入力を受け付けない
      if (!matched) {
        // ここではあえてマッチングを行わず、入力を受け付けないようにする
        for (const pattern of GAME_ROMAJI.alternativeInputs) {
          if (currentPosition < pattern.length) {
            const expected = pattern[currentPosition];
            if (!expectedChar) expectedChar = expected; // 最初のパターンの期待文字を保存
          }
        }
      }
    }
    
    if (matched) {
      // 正しいキー入力
      GAME_ROMAJI.typedRomaji += key;
      
      // マッチしたパターンを優先順位の最上位に
      if (matchedPattern && GAME_ROMAJI.alternativeInputs) {
        const index = GAME_ROMAJI.alternativeInputs.indexOf(matchedPattern);
        if (index > 0) {
          GAME_ROMAJI.alternativeInputs.splice(index, 1);
          GAME_ROMAJI.alternativeInputs.unshift(matchedPattern);
          GAME_ROMAJI.romajiWord = matchedPattern;
        } else if (index === 0) {
          // すでに最上位ならromajiWordを更新
          GAME_ROMAJI.romajiWord = matchedPattern;
        }
      }
      
      // 進捗の更新
      const progress = GAME_ROMAJI.romajiWord ? GAME_ROMAJI.typedRomaji.length / GAME_ROMAJI.romajiWord.length : 0;
      
      if (GAME_STATE.currentTypingEnemy) {
        GAME_STATE.currentTypingEnemy.progress = progress;
        
        // 表示更新
        updateEnemyWordDisplay();
        updateProgressBar(progress);
      }
      
      // 単語完成チェック
      let completed = false;
      if (GAME_ROMAJI.alternativeInputs) {
        // 通常のパターンマッチ
        for (const pattern of GAME_ROMAJI.alternativeInputs) {
          if (GAME_ROMAJI.typedRomaji === pattern) {
            completed = true;
            break;
          }
        }
      }
      
      // ここで補完的なチェックを行う - アルゴリズムで生成しきれない可能性を考慮
      if (!completed) {
        // デバッグ出力 - 入力された単語と期待されるパターン
        console.log(`完了チェック: 入力=${GAME_ROMAJI.typedRomaji}, 期待パターン=${GAME_ROMAJI.alternativeInputs.join(', ')}`);
        
        // 一般的な正規化ルール
        const normalizedInput = normalizeRomajiInput(GAME_ROMAJI.typedRomaji);
        
        // 全パターンを正規化して比較
        for (const pattern of GAME_ROMAJI.alternativeInputs) {
          const normalizedPattern = normalizeRomajiInput(pattern);
          
          // 正規化後の入力と期待パターンが一致する場合
          if (normalizedInput === normalizedPattern) {
            console.log("一般正規化マッチ:", normalizedInput);
            completed = true;
            break;
          }
          
          // 厳格な入力判定 - 完全一致のみを許可
          // 部分一致や類似性による判定は行わない
        }
        
        // 特殊ケースの入力補助は完全に無効化
        // 単語パターンの完全一致のみを許可する
        // const currentWord = GAME_ROMAJI.targetWord;
        // if (!completed) {
        //   console.log("長さベースの判定は行いません");
        // }
        
        /**
         * 2つの文字列の類似度を計算する（0-1の範囲で、1が完全一致）
         * @param {string} str1 比較対象の文字列1
         * @param {string} str2 比較対象の文字列2
         * @returns {number} 類似度（0-1）
         */
        function calculateStringSimilarity(str1, str2) {
          // 各文字が両方の文字列に現れる回数を計算
          const charCount1 = {};
          const charCount2 = {};
          
          // 最初の文字列の文字カウント
          for (const char of str1) {
            charCount1[char] = (charCount1[char] || 0) + 1;
          }
          
          // 2番目の文字列の文字カウント
          for (const char of str2) {
            charCount2[char] = (charCount2[char] || 0) + 1;
          }
          
          // 共通する文字の数をカウント
          let commonChars = 0;
          const allChars = new Set([...Object.keys(charCount1), ...Object.keys(charCount2)]);
          
          for (const char of allChars) {
            const count1 = charCount1[char] || 0;
            const count2 = charCount2[char] || 0;
            commonChars += Math.min(count1, count2);
          }
          
          // 類似度を計算（共通文字数 / 両方の文字列の平均長）
          const similarity = commonChars / ((str1.length + str2.length) / 2);
          
          return similarity;
        }
      }
      
      /**
       * ローマ字入力を正規化する関数
       * @param {string} input ローマ字入力
       * @returns {string} 正規化された入力
       */
      function normalizeRomajiInput(input) {
        // コンソールに入力を表示（デバッグ用）
        console.log(`正規化前入力: ${input}`);
        
        // 正規化処理を順番に適用
        const normalized = input
          // 子音と拗音の変換
          .replace(/chy([auo])/g, 'cy$1')   // chya→cya
          .replace(/shy([auo])/g, 'sy$1')   // shya→sya
          
          // ちゃ・しゃ系の変換
          .replace(/ch([auo])/g, 'ty$1')    // cha→tya
          .replace(/sh([auo])/g, 'sy$1')    // sha→sya
          
          // 特殊な拗音変換
          .replace(/j([auo])/g, 'zy$1')     // ja→zya
          
          // 長音の正規化
          .replace(/ou/g, 'o')              // ou→o
          .replace(/uu/g, 'u')              // uu→u
          
          // 拗音+長音の正規化
          .replace(/([cs]h|[kgszjtdnhfpbmyrlw])y([auo])u/g, '$1y$2')  // kyuu→kyu
          
          // 促音の正規化（削除）
          .replace(/([bcdfghjklmnpqrstvwxyz])\1/g, '$1') // kk→k
          
          // 「がっこう」関連の正規化
          .replace(/kkou/g, 'kko')          // gakkou→gakko
          
          // fとhの変換対応
          .replace(/fu/g, 'hu')             // fu→hu
          .replace(/hu/g, 'fu')             // hu→fu
          
          // ちゅうがっこう関連の特殊正規化
          .replace(/cyugakkou/g, 'chugakkou')  // cyugakkou→chugakkou（特殊ケース）
          .replace(/tyugakkou/g, 'chugakkou'); // tyugakkou→chugakkou（特殊ケース）
        
        // 正規化後の入力を表示（デバッグ用）
        console.log(`正規化後結果: ${normalized}`);
        return normalized;
      }
      
      /**
       * 単語からフルローマ字パターンを取得
       * @param {string} word ひらがな単語
       * @returns {string} ローマ字パターン
       */
      function getFullRomajiPattern(word) {
        let pattern = '';
        for (let i = 0; i < word.length; i++) {
          const char = word[i];
          if (HIRAGANA_TO_ROMAJI[char]) {
            pattern += HIRAGANA_TO_ROMAJI[char][0];
          } else {
            pattern += char;
          }
        }
        return pattern;
      }
      
      if (completed) {
        console.log('単語入力完了!');
        // 単語完成処理
        if (GAME_STATE.currentTypingEnemy) {
          GAME_ROMAJI.typedHiragana = GAME_ROMAJI.targetWord;
          GAME_STATE.typedText = GAME_ROMAJI.targetWord;
          
          // タイプが完了したら表示をクリア
          const typingDisplay = document.getElementById('typing-display');
          if (typingDisplay) {
            typingDisplay.innerHTML = '';
          }
          
          checkWordCompletion();
        }
        return true;
      }
      
      // タイピング表示更新
      updateRomajiDisplay();
      return true;
    } else {
      // 間違いキー入力 - フォーカスは失わず、警告音のみ
      if (expectedChar) {
        // 間違い音を再生
        playSound('wrong');
        
        // 振動エフェクトを追加
        if (GAME_STATE.currentTypingEnemy && GAME_STATE.currentTypingEnemy.element) {
          GAME_STATE.currentTypingEnemy.element.classList.add('shake');
          setTimeout(() => {
            if (GAME_STATE.currentTypingEnemy && GAME_STATE.currentTypingEnemy.element) {
              GAME_STATE.currentTypingEnemy.element.classList.remove('shake');
            }
          }, 500);
        }
      }
      return false;
    }
  }

/**
 * 通常の英語入力処理
 * @param {string} key 入力されたキー
 */
export function handleNormalInput(key) {
  if (!GAME_STATE.currentTypingEnemy) return;
  
  const targetWord = GAME_STATE.currentTypingEnemy.word;
  const currentPosition = GAME_STATE.typedText.length;
  
  // 正しいキーが押された場合
  if (currentPosition < targetWord.length && key === targetWord[currentPosition]) {
    GAME_STATE.typedText += key;
    GAME_STATE.currentTypingEnemy.progress = GAME_STATE.typedText.length / targetWord.length;
    
    console.log(`正しいキー入力: ${key}, 進捗: ${(GAME_STATE.currentTypingEnemy.progress * 100).toFixed(0)}%`);
    
    // 単語表示を更新
    updateEnemyWordDisplay();
    
    // プログレスバーを更新
    updateProgressBar(GAME_STATE.typedText.length / targetWord.length);
    
    // 単語が完成した場合
    checkWordCompletion();
  } else {
    // 間違ったキーが押された場合
    handleWrongInput(key, targetWord[currentPosition]);
  }
  
  updateTypingDisplay();
}

/**
 * 間違った入力の処理
 * @param {string} key 入力されたキー
 * @param {string} expectedKey 期待されるキー
 */
export function handleWrongInput(key, expectedKey) {
    console.log(`間違ったキー: ${key}, 期待: ${expectedKey}`);
    
    // 間違い音を再生
    playSound('wrong');
    
    // 振動エフェクトを追加
    if (GAME_STATE.currentTypingEnemy && GAME_STATE.currentTypingEnemy.element) {
      GAME_STATE.currentTypingEnemy.element.classList.add('shake');
      setTimeout(() => {
        if (GAME_STATE.currentTypingEnemy && GAME_STATE.currentTypingEnemy.element) {
          GAME_STATE.currentTypingEnemy.element.classList.remove('shake');
        }
      }, 500);
    }
    
    // 重要な変更: フォーカスは解除せず、入力状態も維持する
    // ただし誤った入力回数をカウントなどの処理は追加可能
    
    // 以下のコードはコメントアウト
    /*
    // フォーカスを解除
    if (GAME_STATE.currentTypingEnemy) {
      GAME_STATE.currentTypingEnemy.isTyping = false;
      GAME_STATE.currentTypingEnemy.progress = 0;
      
      // 単語表示を元に戻す
      if (GAME_STATE.currentTypingEnemy.element) {
        GAME_STATE.currentTypingEnemy.element.textContent = GAME_STATE.currentTypingEnemy.word;
        GAME_STATE.currentTypingEnemy.element.classList.remove('focused');
      }
    }
    
    // 状態をリセット
    GAME_STATE.currentTypingEnemy = null;
    GAME_STATE.typedText = '';
    
    // ローマ字入力情報もリセット
    GAME_ROMAJI.typedRomaji = '';
    GAME_ROMAJI.typedHiragana = '';
    */
  }

/**
 * ローマ字表示の更新（下部の表示エリア）
 */
export function updateRomajiDisplay() {
  const typingDisplay = document.getElementById('typing-display');
  if (!GAME_STATE.currentTypingEnemy || !typingDisplay) return;
  
  const targetWord = GAME_ROMAJI.targetWord;
  const typedRomaji = GAME_ROMAJI.typedRomaji;
  const romajiWord = GAME_ROMAJI.romajiWord;
  
  // 表示用HTML
  let displayHTML = '';
  
  // ひらがな表示
  displayHTML += `<span style="font-size: 1.1em;">${targetWord}</span>`;
  
  // ローマ字ヒント (必ず表示)
  displayHTML += `<br><span class="romaji-hint">
                 <span class="typed">${typedRomaji}</span>
                 <span class="expected">${romajiWord.substring(typedRomaji.length)}</span>
                 </span>`;
  
  // 複数の入力方法がある場合には代替パターンを表示（ミニサイズ）
  if (GAME_ROMAJI.alternativeInputs && GAME_ROMAJI.alternativeInputs.length > 1) {
    const altPatterns = [...GAME_ROMAJI.alternativeInputs];
    // 最初のパターンは既に上に表示しているので除外
    altPatterns.shift();
    // 最大3つまで表示（画面を圧迫しないように）
    const displayPatterns = altPatterns.slice(0, 3);
    if (displayPatterns.length > 0) {
      displayHTML += `<br><span style="font-size: 0.6em; color: #999999;">他: ${displayPatterns.join(', ')}</span>`;
    }
  }
  
  typingDisplay.innerHTML = displayHTML;
}

/**
 * タイピング処理のメイン関数
 * @param {string} key 入力されたキー
 */
export function handleTyping(key) {
  console.log(`キー入力: ${key}`);
  console.log(`ゲームモード: ${GAME_STATE.gameMode}`);
  
  // タイピング音を再生
  playSound('type');
  
  // タイピング対象がない場合は先頭のエネミーを選択
  if (!GAME_STATE.currentTypingEnemy) {
    for (let i = 0; i < GAME_STATE.enemies.length; i++) {
      const enemy = GAME_STATE.enemies[i];
      if (!enemy.isTyping) {
        GAME_STATE.currentTypingEnemy = enemy;
        enemy.isTyping = true;
        GAME_STATE.typedText = '';
        
        // ローマ字入力情報をリセット
        GAME_ROMAJI.typedRomaji = '';
        GAME_ROMAJI.typedHiragana = '';
        GAME_ROMAJI.targetWord = '';
        GAME_ROMAJI.romajiWord = '';
        
        // フォーカスクラスを追加
        if (enemy.element) {
          enemy.element.classList.add('focused');
        }
        
        // ローマ字入力情報の初期化
        if (GAME_STATE.gameMode === 'hiragana' && /^[\u3040-\u309F]+$/.test(enemy.word)) {
          // ローマ字入力を使用
          initRomajiInput(enemy.word);
        }
        
        console.log(`新しいタイピング対象: ${enemy.word}`);
        break;
      }
    }
  }
  
  if (GAME_STATE.currentTypingEnemy) {
    const targetWord = GAME_STATE.currentTypingEnemy.word;
    console.log(`対象単語: ${targetWord}`);
    console.log(`平仮名判定: ${/^[\u3040-\u309F]+$/.test(targetWord)}`);
    
    // ひらがなモードでローマ字入力の場合
    if (GAME_STATE.gameMode === 'hiragana' && /^[\u3040-\u309F]+$/.test(targetWord)) {
      console.log('ローマ字入力モードで処理');
      // ローマ字入力関数を使用
      handleRomajiInput(key);
    } else {
      // 通常の英語入力
      console.log('通常入力モードで処理');
      handleNormalInput(key);
    }
  } else {
    console.log("タイピング対象がありません");
  }
}

/**
 * フォーカス切り替え関数の改良版
 */
export function cycleFocus() {
    console.log('cycleFocus呼び出し');
    console.log('現在の敵数:', GAME_STATE.enemies.length);
  
    // エネミーがいない場合は何もしない
    if (GAME_STATE.enemies.length === 0) {
      return;
    }
    
    // まず、すべてのフォーカスを解除
    document.querySelectorAll('.word-container.focused').forEach(el => {
      el.classList.remove('focused');
    });
    
    // 現在フォーカスがある場合
    if (GAME_STATE.currentTypingEnemy) {
      // 現在のフォーカスを解除
      GAME_STATE.currentTypingEnemy.isTyping = false;
      
      // 次のエネミーへフォーカスを移動
      const currentIndex = GAME_STATE.enemies.indexOf(GAME_STATE.currentTypingEnemy);
      const nextIndex = (currentIndex + 1) % GAME_STATE.enemies.length;
      GAME_STATE.currentTypingEnemy = GAME_STATE.enemies[nextIndex];
    } else if (GAME_STATE.enemies.length > 0) {
      // フォーカスがない場合は最初のエネミーにフォーカス
      GAME_STATE.currentTypingEnemy = GAME_STATE.enemies[0];
    }
    
    // 新しいフォーカスを設定
    if (GAME_STATE.currentTypingEnemy) {
      GAME_STATE.currentTypingEnemy.isTyping = true;
      
      // ローマ字入力情報を完全にリセット
      GAME_STATE.typedText = '';
      GAME_ROMAJI.typedRomaji = '';
      GAME_ROMAJI.typedHiragana = '';
      GAME_ROMAJI.romajiWord = '';
      GAME_ROMAJI.alternativeInputs = [];
      
      // フォーカスされたエネミーの表示を更新
      if (GAME_STATE.currentTypingEnemy.element) {
        GAME_STATE.currentTypingEnemy.element.classList.add('focused');
      }
      
      // ひらがなモードの場合は初期化
      if (GAME_STATE.gameMode === 'hiragana' && 
          /^[\u3040-\u309F]+$/.test(GAME_STATE.currentTypingEnemy.word)) {
        initRomajiInput(GAME_STATE.currentTypingEnemy.word);
      }
      
      // タイピング表示を更新
      updateTypingDisplay();
      
      // プログレスバーを初期化
      updateProgressBar(0);
      
      // 効果音を再生
      playSound('type');
      
      console.log(`フォーカス切り替え: ${GAME_STATE.currentTypingEnemy.word}`);
    }
  }

/**
 * キーダウンイベントハンドラ
 * @param {KeyboardEvent} event キーボードイベント
 */
export function onKeyDown(event) {
  if (!GAME_STATE.isRunning) return;
  
  // スペースキーは無視（ブラウザのスクロールを防止）
  if (event.key === ' ') {
    event.preventDefault();
  }
  
  // Tabキーでフォーカス切り替え
  if (event.key === 'Tab') {
    event.preventDefault(); // ブラウザのフォーカス移動を防止
    
    // フォーカスヒントを表示
    const focusHint = document.getElementById('focus-hint');
    if (focusHint) {
      focusHint.classList.add('visible');
      focusHint.style.opacity = '1'; // 確実に表示
      // 3秒後に非表示
      setTimeout(() => {
        focusHint.classList.remove('visible');
        focusHint.style.opacity = '0';
      }, 3000);
    }
    
    console.log('タブキーでフォーカス切り替え');
    cycleFocus();
    return;
  }
  
  // Escキーでゲームを一時停止
  if (event.key === 'Escape') {
    // 一時停止関数は game.js で定義されているため、ここではイベントを発火
    const pauseEvent = new CustomEvent('game-pause');
    document.dispatchEvent(pauseEvent);
    return;
  }
  
  // バックスペースの処理
  if (event.key === 'Backspace') {
    event.preventDefault(); // ブラウザの戻る機能を防止
    
    // ひらがなモードの場合は特殊処理
    if (GAME_STATE.gameMode === 'hiragana' && 
        GAME_STATE.currentTypingEnemy && 
        /^[\u3040-\u309F]+$/.test(GAME_STATE.currentTypingEnemy.word)) {
      // 拡張処理
      handleRomajiInput('Backspace');
    } else if (GAME_STATE.typedText.length > 0) {
      // 通常モードのバックスペース処理
      GAME_STATE.typedText = GAME_STATE.typedText.slice(0, -1);
      
      // 進捗更新
      if (GAME_STATE.currentTypingEnemy) {
        GAME_STATE.currentTypingEnemy.progress = 
          GAME_STATE.typedText.length / GAME_STATE.currentTypingEnemy.word.length;
        
        // UI更新
        updateTypingDisplay();
        updateEnemyWordDisplay();
        updateProgressBar(GAME_STATE.currentTypingEnemy.progress);
      }
    }
    return;
  }
  
  // 文字キーのみ処理
  if (event.key.length === 1) {
    handleTyping(event.key);
  }
}

/**
 * スマートフォーカス機能のセットアップ
 * 入力された文字で始まる単語を持つ敵を自動的に選択
 */
export function setupSmartFocus() {
    // キー入力に対するグローバルイベントリスナー
    document.addEventListener('keydown', function(event) {
      // すでにタイピング中なら何もしない
      if (GAME_STATE.currentTypingEnemy) return;
      
      // 文字キーのみ処理
      if (event.key.length !== 1) return;
      
      const pressedKey = event.key.toLowerCase();
      console.log(`スマートフォーカス: キー "${pressedKey}" を検索`);
      
      // 入力された文字で始まる単語を持つ敵を探す
      for (let i = 0; i < GAME_STATE.enemies.length; i++) {
        const enemy = GAME_STATE.enemies[i];
        if (!enemy.isTyping) {
          let matchFound = false;
          
          // ひらがなモードの場合
          if (GAME_STATE.gameMode === 'hiragana' && /^[\u3040-\u309F]+$/.test(enemy.word)) {
            // ひらがなの最初の文字に対応するローマ字を取得
            const firstChar = enemy.word[0];
            const romajiOptions = HIRAGANA_TO_ROMAJI[firstChar] || [];
            
            // 最初の文字が一致するかチェック
            if (romajiOptions.length > 0 && romajiOptions[0][0] === pressedKey) {
              matchFound = true;
            }
          } 
          // 英語モードの場合
          else if (enemy.word.length > 0 && enemy.word[0].toLowerCase() === pressedKey) {
            matchFound = true;
          }
          
          // 一致したらフォーカスを設定
          if (matchFound) {
            console.log(`スマートフォーカス: "${enemy.word}" にフォーカスを設定`);
            
            // すべてのフォーカスを解除
            document.querySelectorAll('.word-container.focused').forEach(el => {
              el.classList.remove('focused');
            });
            
            // 既存のタイピング状態をリセット
            if (GAME_STATE.currentTypingEnemy) {
              GAME_STATE.currentTypingEnemy.isTyping = false;
            }
            
            // 新しいフォーカスを設定
            GAME_STATE.currentTypingEnemy = enemy;
            enemy.isTyping = true;
            GAME_STATE.typedText = '';
            
            // ローマ字入力情報のリセット
            GAME_ROMAJI.typedRomaji = '';
            GAME_ROMAJI.typedHiragana = '';
            GAME_ROMAJI.romajiWord = '';
            
            // フォーカスクラスを追加
            if (enemy.element) {
              enemy.element.classList.add('focused');
            }
            
            // ローマ字入力情報の初期化 (ひらがなモードの場合)
            if (GAME_STATE.gameMode === 'hiragana' && /^[\u3040-\u309F]+$/.test(enemy.word)) {
              // ひらがなをローマ字に変換
              let romajiWord = '';
              for (let i = 0; i < enemy.word.length; i++) {
                const char = enemy.word[i];
                if (HIRAGANA_TO_ROMAJI[char] && HIRAGANA_TO_ROMAJI[char].length > 0) {
                  romajiWord += HIRAGANA_TO_ROMAJI[char][0];
                } else {
                  romajiWord += char;
                }
              }
              
              GAME_ROMAJI.targetWord = enemy.word;
              GAME_ROMAJI.romajiWord = romajiWord;
              
              console.log(`ローマ字変換: ${enemy.word} → ${romajiWord}`);
            }
            
            // 一発目の入力として処理する
            handleTyping(pressedKey);
            
            // プログレスバーをリセット
            updateProgressBar(0);
            
            // イベントのデフォルト動作を防止
            event.preventDefault();
            return;
          }
        }
      }
    });
    
    console.log("スマートフォーカス機能を設定しました");
  }


export function initRomajiInput(hiraganaWord) {
  console.log(`ローマ字入力初期化: '${hiraganaWord}'`);
  
  GAME_ROMAJI.targetWord = hiraganaWord;
  GAME_ROMAJI.typedRomaji = '';
  GAME_ROMAJI.typedHiragana = '';

  // 拡張した汎用アルゴリズムでパターンを生成
  const patterns = generateRomajiPatterns(hiraganaWord);
  
  if (patterns.length === 0) {
    // フォールバックとして単純な変換を提供
    let simplePattern = '';
    for (let i = 0; i < hiraganaWord.length; i++) {
      const char = hiraganaWord[i];
      const options = getHiraganaRomaji(char);
      simplePattern += options[0] || char;
    }
    GAME_ROMAJI.alternativeInputs = [simplePattern];
  } else {
    GAME_ROMAJI.alternativeInputs = patterns;
  }
  
  GAME_ROMAJI.romajiWord = GAME_ROMAJI.alternativeInputs[0];
  
  console.log(`ローマ字変換パターン: ${hiraganaWord} → ${GAME_ROMAJI.alternativeInputs.join(', ')}`);
  
  // ヒント表示を更新
  updateRomajiDisplay();
}

/**
 * 母音のひらがなかどうかを判定する
 * @param {string} hiraganaChar ひらがな1文字
 * @returns {boolean} 母音かどうか
 */
function isVowelHiragana(hiraganaChar) {
  const vowels = ['あ', 'い', 'う', 'え', 'お'];
  return vowels.includes(hiraganaChar);
}

/**
 * 拡張ローマ字変換アルゴリズム
 * @param {string} hiraganaWord ひらがな単語
 * @returns {string[]} 可能なローマ字入力パターン
 */
function generateRomajiPatterns(hiraganaWord) {
  console.log(`------ 「${hiraganaWord}」のパターン生成開始 ------`);
  
  // 基本パターンを生成
  let basePattern = '';
  for (let i = 0; i < hiraganaWord.length; i++) {
    const char = hiraganaWord[i];
    if (HIRAGANA_TO_ROMAJI[char]) {
      basePattern += HIRAGANA_TO_ROMAJI[char][0];
    } else {
      basePattern += char;
    }
  }
  console.log("基本パターン:", basePattern);
  
  // チャンクに分解して処理（連続する文字を適切にグループ化）
  const chunks = splitIntoChunks(hiraganaWord);
  console.log("チャンク分解結果:", chunks);
  
  // 各チャンクの変換パターンを生成
  const chunkPatterns = [];
  for (const chunk of chunks) {
    // チャンクごとの変換パターンを取得
    let patterns = [];
    
    // COMPOUND_HIRAGANAに定義されているか確認
    if (COMPOUND_HIRAGANA[chunk]) {
      patterns = COMPOUND_HIRAGANA[chunk];
    } else {
      patterns = getChunkPatterns(chunk);
    }
    
    console.log(`チャンク「${chunk}」のパターン:`, patterns);
    chunkPatterns.push(patterns);
  }
  
  // すべての組み合わせを生成
  let result = [''];
  for (const patterns of chunkPatterns) {
    const newResult = [];
    for (const current of result) {
      for (const pattern of patterns) {
        newResult.push(current + pattern);
      }
    }
    result = newResult;
  }
  
  // 特殊な処理 - 長音短縮パターンも追加
  if (ROMAJI_CONVERSION_RULES.longVowelRule) {
    // 長音を短縮したパターンを追加 (ou→o, uu→u など)
    const shortPatterns = generateShortVowelPatterns(result);
    result = [...result, ...shortPatterns];
  }
  
  // 柔軟性向上のためのパターン拡張（アルゴリズムの補完）
  // すべての単語に対して汎用的に処理する
    
  // 1. 促音の省略パターン（「っか」→「ka」など）
  const simplifiedSokuon = result
    .map(p => p.replace(/([kstpcgzjdbprlmf])\1/g, '$1'))
    .filter(p => !result.includes(p));
  
  // 2. 長音の省略パターン（「とう」→「to」など）
  const simplifiedLongVowel = result
    .map(p => p.replace(/([aiueo])\1/g, '$1')
              .replace(/ou/g, 'o')
              .replace(/uu/g, 'u'))
    .filter(p => !result.includes(p));
  
  // 3. 拗音+長音の簡略化パターン
  const simplifiedYoon = result
    .map(p => p.replace(/chuu/g, 'chu')
              .replace(/shuu/g, 'shu')
              .replace(/juu/g, 'ju')
              .replace(/che+/g, 'che')
              .replace(/cye+/g, 'cye')
              .replace(/tye+/g, 'tye')
              .replace(/kyu+/g, 'kyu')
              .replace(/ryu+/g, 'ryu')
              .replace(/myu+/g, 'myu')
              .replace(/hyu+/g, 'hyu')
              .replace(/nyu+/g, 'nyu')
              .replace(/gyu+/g, 'gyu')
              .replace(/byu+/g, 'byu')
              .replace(/pyu+/g, 'pyu')
              .replace(/tyo+/g, 'tyo'))
    .filter(p => !result.includes(p));
  
  // 4. 「ん」の特殊処理（n/nn両方対応）
  const nVariations = [];
  if (hiraganaWord.includes('ん')) {
    for (const pattern of result) {
      // 「n」を「nn」に置き換えるパターンと
      // 「nn」を「n」に置き換えるパターンの両方を生成
      const nPattern = pattern.replace(/n([^aiueo]|$)/g, 'nn$1');
      const nnPattern = pattern.replace(/nn([^aiueo]|$)/g, 'n$1');
      
      if (!result.includes(nPattern)) nVariations.push(nPattern);
      if (!result.includes(nnPattern)) nVariations.push(nnPattern);
    }
  }
  
  // 5. 「りょう」→「ryo」などの簡略化
  const ryoVariations = result
    .map(p => p.replace(/ryou/g, 'ryo')
              .replace(/kyou/g, 'kyo')
              .replace(/shou/g, 'sho')
              .replace(/chou/g, 'cho')
              .replace(/jou/g, 'jo')
              .replace(/senryou/g, 'senryo'))
    .filter(p => !result.includes(p));
  
  // 6. 促音処理: 'っこう' => 'kkou'/'kko' など
  const gakkouPatterns = [];
  for (const pattern of result) {
    if (pattern.includes('kkou')) {
      gakkouPatterns.push(pattern.replace('kkou', 'kko'));  // gakkou -> gakko
    }
    if (pattern.includes('ttou')) {
      gakkouPatterns.push(pattern.replace('ttou', 'tto'));  // gattou -> gatto
    }
  }
  
  // 7. cyuu -> cyu パターン (ちゅう -> ちゅ) など
  const shortenedPatterns = result.map(p => {
    return p.replace(/chuu/g, 'chu')
      .replace(/tyu+/g, 'tyu')
      .replace(/cyu+/g, 'cyu')
      .replace(/shu+/g, 'shu')
      .replace(/syu+/g, 'syu');
  }).filter(p => !result.includes(p));
  
  // すべてのバリエーションを結合
  result = [
    ...result, 
    ...simplifiedSokuon, 
    ...simplifiedLongVowel, 
    ...simplifiedYoon,
    ...nVariations,
    ...ryoVariations,
    ...gakkouPatterns,
    ...shortenedPatterns
  ];
  
  // 基本パターンを必ず含める
  if (!result.includes(basePattern)) {
    result.push(basePattern);
  }
  
  // 8. 特殊ケース: ちゅうがっこう/ぎゅうにゅう など
  if (hiraganaWord === 'ちゅうがっこう') {
    const specialPatterns = ['cyugakkou', 'chugakkou', 'tyugakkou', 'cyugakko', 'chugakko', 'tyugakko'];
    console.log("特殊ケース追加: ちゅうがっこう");
    
    for (const pattern of specialPatterns) {
      if (!result.includes(pattern)) {
        result.push(pattern);
      }
    }
  }
  else if (hiraganaWord === 'ぎゅうにゅう') {
    const specialPatterns = ['gyunyu', 'gyuunyu', 'gyunyuu', 'gyuunyuu'];
    console.log("特殊ケース追加: ぎゅうにゅう");
    
    for (const pattern of specialPatterns) {
      if (!result.includes(pattern)) {
        result.push(pattern);
      }
    }
  }
  
  console.log(`パターン生成完了: ${result.length}個のパターン`);
  return [...new Set(result)]; // 重複を排除
}

/**
 * ひらがな単語をチャンク（意味のある単位）に分解
 * @param {string} hiraganaWord ひらがな単語
 * @returns {string[]} チャンク配列
 */
function splitIntoChunks(hiraganaWord) {
  let chunks = [];
  let i = 0;
  
  while (i < hiraganaWord.length) {
    // 1. 促音+拗音 (例: っきゃ)
    if (i + 2 < hiraganaWord.length && 
        hiraganaWord[i] === 'っ' && 
        "ゃゅょぇぃぉ".includes(hiraganaWord[i+2])) {
      
      // 特別に「ちぇ」を検出
      if (hiraganaWord.substring(i+1, i+3) === 'ちぇ') {
        chunks.push('っ');
        chunks.push('ちぇ');
        i += 3;
      } else {
        chunks.push(hiraganaWord.substring(i, i+3));
        i += 3;
      }
    } 
    // 2. 拗音 (例: きゃ、しゅ、ちぇ)
    else if (i + 1 < hiraganaWord.length && 
             "ゃゅょぇぃぉ".includes(hiraganaWord[i+1])) {
      
      chunks.push(hiraganaWord.substring(i, i+2));
      i += 2;
    }
    // 3. 促音 (例: っか)
    else if (i + 1 < hiraganaWord.length && 
             hiraganaWord[i] === 'っ') {
      
      chunks.push(hiraganaWord.substring(i, i+2));
      i += 2;
    }
    // 4. 長音 (おう、とう)
    else if (i + 1 < hiraganaWord.length && 
             hiraganaWord[i+1] === 'う' &&
             !isVowelHiragana(hiraganaWord[i])) {
      
      chunks.push(hiraganaWord.substring(i, i+2));
      i += 2;
    }
    // 5. 連続母音 (例: あい、おう)
    else if (i + 1 < hiraganaWord.length && 
             isVowelHiragana(hiraganaWord[i]) && 
             isVowelHiragana(hiraganaWord[i+1])) {
      
      chunks.push(hiraganaWord.substring(i, i+2));
      i += 2;
    }
    // 6. 単独のひらがな
    else {
      chunks.push(hiraganaWord[i]);
      i++;
    }
  }
  
  return chunks;
}

/**
 * チャンクに対する変換パターンを取得
 * @param {string} chunk ひらがなチャンク
 * @returns {string[]} 変換パターン配列
 */
function getChunkPatterns(chunk) {
  // 1文字の場合は単純変換
  if (chunk.length === 1) {
    return getHiraganaRomaji(chunk);
  }
  
  let patterns = [];
  
  // 2文字チャンク：拗音または長音
  if (chunk.length === 2) {
    // 拗音 (きゃ、しゅなど)
    if ("ゃゅょぇぃぉ".includes(chunk[1])) {
      // COMPOUNDに定義されているか確認
      if (COMPOUND_HIRAGANA[chunk]) {
        patterns = COMPOUND_HIRAGANA[chunk];
      } else {
        // 自動生成 (基本パターンのみ)
        const first = chunk[0];
        const second = chunk[1];
        
        // 子音部分を取得
        let consonant = '';
        switch(first) {
          case 'き': consonant = 'k'; break;
          case 'し': consonant = ['sh', 's']; break;
          case 'ち': consonant = ['ch', 't', 'c']; break;
          case 'に': consonant = 'n'; break;
          case 'ひ': consonant = 'h'; break;
          case 'み': consonant = 'm'; break;
          case 'り': consonant = 'r'; break;
          case 'ぎ': consonant = 'g'; break;
          case 'じ': consonant = ['j', 'z']; break;
          case 'び': consonant = 'b'; break;
          case 'ぴ': consonant = 'p'; break;
          case 'い': consonant = ['y', 'i']; break;  // いぇ → ye/ie
          case 'う': consonant = 'w'; break;         // うぃ/うぇ/うぉ → wi/we/wo
          default: return [chunk]; // 対応する子音がなければそのまま返す
        }
        
        // 母音部分を取得
        let vowel = '';
        switch(second) {
          case 'ゃ': vowel = 'a'; break;
          case 'ゅ': vowel = 'u'; break;
          case 'ょ': vowel = 'o'; break;
          case 'ぇ': vowel = 'e'; break;  // ○ぇ → ○e (しぇ/ちぇなど)
          case 'ぃ': vowel = 'i'; break;  // ○ぃ → ○i (うぃなど)
          case 'ぉ': vowel = 'o'; break;  // ○ぉ → ○o (うぉなど)
          default: return [chunk]; // 対応する母音がなければそのまま返す
        }
        
        // 複数の子音に対応
        if (Array.isArray(consonant)) {
          for (const c of consonant) {
            patterns.push(c + vowel);
            
            // 特殊ケース: しゃ→sya, しゅ→syu など
            if (c === 'sh' && ROMAJI_CONVERSION_RULES.yoonVariations) {
              patterns.push('sy' + vowel);
            }
            // 特殊ケース: ちゃ→tya, ちゅ→tyu など
            if (c === 'ch' && ROMAJI_CONVERSION_RULES.yoonVariations) {
              patterns.push('ty' + vowel);
            }
          }
        } else {
          patterns.push(consonant + 'y' + vowel);
          
          // 特殊ケース: ちゃ→cha, ちゅ→chu など
          if (first === 'ち') {
            patterns.push('ch' + vowel);
            // さらに追加のバリエーション
            patterns.push('cy' + vowel);  // cya, cyu, cyo
          }
          // 追加の非標準バリエーション
          if (first === 'し') {
            patterns.push('sy' + vowel);  // sya, syu, syo
          }
        }
      }
    }
    // 促音 (っか、っさなど)
    else if (chunk[0] === 'っ') {
      const nextChar = chunk[1];
      const nextPatterns = getHiraganaRomaji(nextChar);
      
      // 子音を重ねるパターン
      for (const nextPattern of nextPatterns) {
        const consonant = nextPattern.match(/^[bcdfghjklmnpqrstvwxyz]/);
        if (consonant) {
          patterns.push(consonant[0] + nextPattern);  // 例: kka, tta
          
          // 促音省略パターン (kka→ka など): 厳密な入力ではなくゲームなので許容
          if (ROMAJI_CONVERSION_RULES.sokuonRule) {
            patterns.push(nextPattern);  // 例: ka, ta
          }
        }
      }
      
      // 「っ」の直接表記
      patterns.push('xtu' + nextPatterns[0], 'ltu' + nextPatterns[0]);
    }
    // 長音 (おう、とうなど)
    else if (chunk[1] === 'う') {
      const baseSounds = getHiraganaRomaji(chunk[0]);
      
      for (const base of baseSounds) {
        patterns.push(base + 'u');  // 例: to+u, o+u
        
        // 長音省略パターン
        if (ROMAJI_CONVERSION_RULES.longVowelRule) {
          const lastChar = base.charAt(base.length - 1);
          // 母音が同じ場合だけ省略可能 (ou→o, kuu→ku)
          if (lastChar === 'u' || lastChar === 'o') {
            patterns.push(base);  // 例: to, o
          }
        }
      }
    }
    // 連続母音 (あい、おうなど)
    else if (isVowelHiragana(chunk[0]) && isVowelHiragana(chunk[1])) {
      const first = getHiraganaRomaji(chunk[0]);
      const second = getHiraganaRomaji(chunk[1]);
      
      // すべての組み合わせを生成
      for (const f of first) {
        for (const s of second) {
          patterns.push(f + s);  // 例: a+i, o+u
          
          // 省略パターン (あい→a など): 必要なら追加
          if (ROMAJI_CONVERSION_RULES.longVowelRule) {
            patterns.push(f);  // 例: a, o
          }
        }
      }
    } else {
      // それ以外の2文字チャンク: 各文字を個別に変換して結合
      const p1 = getHiraganaRomaji(chunk[0]);
      const p2 = getHiraganaRomaji(chunk[1]);
      
      for (const a of p1) {
        for (const b of p2) {
          patterns.push(a + b);
        }
      }
    }
  }
  // 3文字チャンク: 促音+拗音
  else if (chunk.length === 3 && chunk[0] === 'っ' && "ゃゅょぇぃぉ".includes(chunk[2])) {
    const consonant = getConsonantFromHiragana(chunk[1]);
    const compoundChunk = chunk.substring(1, 3); // 拗音部分 (きゃ, しゅなど)
    const compoundPatterns = getChunkPatterns(compoundChunk);
    
    if (consonant) {
      for (const pattern of compoundPatterns) {
        // 重複子音バージョン (例: kkya, sshu)
        if (Array.isArray(consonant)) {
          for (const c of consonant) {
            patterns.push(c + pattern);
          }
        } else {
          patterns.push(consonant + pattern);
        }
        
        // 促音省略パターン (例: kya, shu)
        if (ROMAJI_CONVERSION_RULES.sokuonRule) {
          patterns.push(pattern);
        }
      }
    } else {
      // 子音が取得できない場合
      patterns = compoundPatterns;
    }
    
    // 明示的な促音表記も追加
    patterns.push('xtu' + compoundPatterns[0], 'ltu' + compoundPatterns[0]);
  }
  
  // 結果がなければ空文字列を返す
  return patterns.length > 0 ? patterns : [chunk];
}

/**
 * 長音省略パターンを生成
 * @param {string[]} patterns 元のパターン配列
 * @returns {string[]} 短縮パターン配列
 */
function generateShortVowelPatterns(patterns) {
  const result = [];
  
  for (const pattern of patterns) {
    // 長音の置換パターン
    const shortened = pattern
      // 「ou」→「o」
      .replace(/ou/g, 'o')
      // 「uu」→「u」 
      .replace(/uu/g, 'u')
      // 「kyuu」→「kyu」などの拗音+長音の処理
      .replace(/([kstnhmrgzbp]y)uu/g, '$1u')
      // 「chuu」→「chu」などの特殊拗音+長音の処理
      .replace(/(ch|sh|j)uu/g, '$1u');
    
    if (shortened !== pattern) {
      result.push(shortened);
    }
  }
  
  return result;
}

/**
 * ひらがなから子音部分を取得
 * @param {string} char ひらがな1文字
 * @returns {string|null} 子音部分
 */
function getConsonantFromHiragana(char) {
  const romaji = getHiraganaRomaji(char)[0] || '';
  const consonant = romaji.match(/^[bcdfghjklmnpqrstvwxyz]+/);
  return consonant ? consonant[0] : null;
}

/**
 * デバッグ用：単語のすべての入力パターンを表示
 * @param {string} word ひらがな単語
 */
export function debugRomajiPatterns(word) {
  console.log(`「${word}」のローマ字パターン生成開始...`);
  const patterns = generateRomajiPatterns(word);
  console.log(`「${word}」の入力パターン (${patterns.length}個):`, patterns);
  
  // 特に「ちゅうがっこう」の場合の検証
  if (word === 'ちゅうがっこう') {
    // cyugakkou や chugakkou が含まれているか確認
    const testPatterns = ['cyugakkou', 'chugakkou', 'tyugakkou', 'cyugakko', 'chugakko'];
    for (const pattern of testPatterns) {
      const included = patterns.includes(pattern);
      console.log(`パターン「${pattern}」: ${included ? '含まれています ✓' : '含まれていません ✗'}`);
    }
  }
  
  return patterns;
}

/**
 * 1文字のひらがなに対応するローマ字パターンを返す
 * @param {string} char ひらがな1文字
 * @returns {string[]} ローマ字パターン
 */
function getHiraganaRomaji(char) {
  const map = {
    'あ': ['a'], 'い': ['i'], 'う': ['u'], 'え': ['e'], 'お': ['o'],
    'か': ['ka'], 'き': ['ki'], 'く': ['ku'], 'け': ['ke'], 'こ': ['ko'],
    'さ': ['sa'], 'し': ['shi', 'si'], 'す': ['su'], 'せ': ['se'], 'そ': ['so'],
    'た': ['ta'], 'ち': ['chi', 'ti'], 'つ': ['tsu', 'tu'], 'て': ['te'], 'と': ['to'],
    'な': ['na'], 'に': ['ni'], 'ぬ': ['nu'], 'ね': ['ne'], 'の': ['no'],
    'は': ['ha'], 'ひ': ['hi'], 'ふ': ['fu', 'hu'], 'へ': ['he'], 'ほ': ['ho'],
    'ま': ['ma'], 'み': ['mi'], 'む': ['mu'], 'め': ['me'], 'も': ['mo'],
    'や': ['ya'], 'ゆ': ['yu'], 'よ': ['yo'],
    'ら': ['ra'], 'り': ['ri'], 'る': ['ru'], 'れ': ['re'], 'ろ': ['ro'],
    'わ': ['wa'], 'を': ['wo', 'o'], 'ん': ['n', 'nn'],
    'が': ['ga'], 'ぎ': ['gi'], 'ぐ': ['gu'], 'げ': ['ge'], 'ご': ['go'],
    'ざ': ['za'], 'じ': ['ji', 'zi'], 'ず': ['zu'], 'ぜ': ['ze'], 'ぞ': ['zo'],
    'だ': ['da'], 'ぢ': ['ji', 'di'], 'づ': ['zu', 'du'], 'で': ['de'], 'ど': ['do'],
    'ば': ['ba'], 'び': ['bi'], 'ぶ': ['bu'], 'べ': ['be'], 'ぼ': ['bo'],
    'ぱ': ['pa'], 'ぴ': ['pi'], 'ぷ': ['pu'], 'ぺ': ['pe'], 'ぽ': ['po']
  };
  
  return map[char] || [char];
}