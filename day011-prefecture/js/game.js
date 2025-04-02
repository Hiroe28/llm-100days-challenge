// ゲームの主要なロジックを扱うモジュール

// DOM要素の取得
const questionElement = document.getElementById('question');
const scoreElement = document.getElementById('score');
const resultMessage = document.getElementById('result-message');
const nextButton = document.getElementById('next-button');
const optionsContainer = document.getElementById('options-container');
const mapModeButton = document.getElementById('map-mode');
const choiceModeButton = document.getElementById('choice-mode');
const regionSelect = document.getElementById('region-select');
const instructionsElement = document.getElementById('instructions');
const helpButton = document.getElementById('help-button');
const kanjiModeButton = document.getElementById('kanji-mode');
const hiraganaModeButton = document.getElementById('hiragana-mode');

// ゲーム状態の管理
const gameState = {
    score: 0,
    currentPrefecture: null,
    previousPrefecture: null, // 前回の問題を記録
    gameMode: 'map', // 'map' または 'choice'
    answered: false,
    currentRegion: 'all', // デフォルトは全国
    availablePrefectures: [...prefectures], // 初期値として全都道府県をコピー
    textMode: 'kanji', // 'kanji' または 'hiragana'
    isMobileDevice: false // モバイルデバイスかどうか
};

// モバイルデバイスの検出
function detectMobileDevice() {
    gameState.isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    
    // モバイルデバイスの場合のUI調整
    if (gameState.isMobileDevice) {
        // 選択肢モードがモバイルでより使いやすいため、モバイルではデフォルトで選択肢モードに設定
        if (window.innerWidth <= 480) {
            gameState.gameMode = 'choice';
            mapModeButton.classList.remove('active');
            choiceModeButton.classList.add('active');
            optionsContainer.style.display = 'flex';
        }
    }
}

// 設定ボタンのイベントリスナー
document.getElementById('settings-toggle').addEventListener('click', function() {
    const panel = document.getElementById('settings-panel');
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
    } else {
        panel.style.display = 'none';
    }
});

// 設定パネルを閉じるボタン
document.getElementById('close-settings').addEventListener('click', function() {
    document.getElementById('settings-panel').style.display = 'none';
});

// 遊び方の表示/非表示を切り替える
helpButton.addEventListener('click', function() {
    console.log("遊び方ボタンがクリックされました");
    if (instructionsElement.style.display === 'none') {
        instructionsElement.style.display = 'block';
        helpButton.textContent = '遊び方を隠す';
    } else {
        instructionsElement.style.display = 'none';
        helpButton.textContent = '遊び方を表示';
    }
    
    // 設定パネルを自動的に閉じる
    document.getElementById('settings-panel').style.display = 'none';
});

// 地方選択が変更されたときの処理
regionSelect.addEventListener('change', function() {
    console.log("地方が選択されました:", regionSelect.value);
    gameState.currentRegion = regionSelect.value;
    updateAvailablePrefectures();
    console.log("利用可能な都道府県:", gameState.availablePrefectures.map(p => p.name));
    resetAndNextQuestion();
});

// 現在選択された地方に基づいて出題可能な都道府県を更新
function updateAvailablePrefectures() {
    const regionCodes = regionPrefectures[gameState.currentRegion];
    console.log("選択された地方のコード:", regionCodes);
    if (!regionCodes) {
        console.error("無効な地方が選択されました:", gameState.currentRegion);
        gameState.availablePrefectures = [...prefectures]; // エラー時は全国を選択
        return;
    }
    gameState.availablePrefectures = prefectures.filter(p => regionCodes.includes(p.code));
}

// 効果音のグローバル変数
let correctSound;
let incorrectSound;

// 効果音の初期化（オーディオコンテキストを使用）
function initSounds() {
    try {
        // Web Audio APIを使用して効果音を生成
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();

        // 正解音（短い明るい音）
        function playCorrectSound() {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(784, audioCtx.currentTime); // G5
            gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.5);
        }

        // 不正解音（短い低い音）
        function playIncorrectSound() {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(196, audioCtx.currentTime); // G3
            gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.5);
        }

        // 関数を割り当て
        correctSound = { play: playCorrectSound };
        incorrectSound = { play: playIncorrectSound };

    } catch (e) {
        console.error('効果音の初期化に失敗しました:', e);
        // ダミー関数を割り当て（エラーを防止）
        correctSound = { play: function() {} };
        incorrectSound = { play: function() {} };
    }
}

// モード切り替え - メインページのボタンと設定パネル内のボタンの両方に対応
function setupModeButtons() {
    // マップモードへの切り替え
    const mapModeButtons = document.querySelectorAll('#map-mode');
    mapModeButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (gameState.gameMode !== 'map') {
                gameState.gameMode = 'map';
                // すべてのマップモードボタンをアクティブにする
                document.querySelectorAll('#map-mode').forEach(btn => btn.classList.add('active'));
                // すべての選択肢モードボタンを非アクティブにする
                document.querySelectorAll('#choice-mode').forEach(btn => btn.classList.remove('active'));
                
                optionsContainer.style.display = 'none';
                
                // 「地図全体を表示」ボタンに更新
                if (typeof updateCenterButtonForGameMode === 'function') {
                    updateCenterButtonForGameMode();
                }
                
                resetAndNextQuestion();
            }
        });
    });
    
    // 選択肢モードへの切り替え
    const choiceModeButtons = document.querySelectorAll('#choice-mode');
    choiceModeButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (gameState.gameMode !== 'choice') {
                gameState.gameMode = 'choice';
                // すべての選択肢モードボタンをアクティブにする
                document.querySelectorAll('#choice-mode').forEach(btn => btn.classList.add('active'));
                // すべてのマップモードボタンを非アクティブにする
                document.querySelectorAll('#map-mode').forEach(btn => btn.classList.remove('active'));
                
                optionsContainer.style.display = 'flex';
                
                // 「ハイライト部分を表示」ボタンに更新
                if (typeof updateCenterButtonForGameMode === 'function') {
                    updateCenterButtonForGameMode();
                }
                
                resetAndNextQuestion();
            }
        });
    });
}

// 次の問題ボタン
nextButton.addEventListener('click', resetAndNextQuestion);

// テキストモード切り替え（漢字/ひらがな）
kanjiModeButton.addEventListener('click', () => {
    if (gameState.textMode !== 'kanji') {
        gameState.textMode = 'kanji';
        kanjiModeButton.classList.add('active');
        hiraganaModeButton.classList.remove('active');
        updatePrefectureDisplay();
    }
});

hiraganaModeButton.addEventListener('click', () => {
    if (gameState.textMode !== 'hiragana') {
        gameState.textMode = 'hiragana';
        hiraganaModeButton.classList.add('active');
        kanjiModeButton.classList.remove('active');
        updatePrefectureDisplay();
    }
});

// 現在のテキストモードに応じて都道府県名を取得する
function getPrefectureName(prefecture) {
    return gameState.textMode === 'hiragana' ? prefecture.hiragana : prefecture.name;
}

// 問題表示を更新する
function updatePrefectureDisplay() {
    if (!gameState.currentPrefecture) return;
    
    const prefName = getPrefectureName(gameState.currentPrefecture);
    
    if (gameState.gameMode === 'map') {
        questionElement.textContent = `${prefName}はどこでしょう？`;
    } else {
        questionElement.textContent = `ハイライトされているのはどこの都道府県でしょう？`;
    }
    
    // 選択肢も更新（選択肢モードの場合）
    if (gameState.gameMode === 'choice' && !gameState.answered) {
        updateOptions();
    }
    
    // メッセージも更新（回答済みの場合）
    if (gameState.answered) {
        updateResultMessage();
    }
}

// 選択肢を更新する
function updateOptions() {
    const options = optionsContainer.querySelectorAll('.option-button');
    options.forEach(option => {
        const code = option.getAttribute('data-code');
        const prefecture = prefectures.find(p => p.code === code);
        if (prefecture) {
            option.textContent = getPrefectureName(prefecture);
        }
    });
}

// 結果メッセージを更新する
function updateResultMessage() {
    const isCorrect = resultMessage.style.color === 'rgb(76, 175, 80)'; // 緑色 = 正解
    
    if (gameState.gameMode === 'map') {
        if (isCorrect) {
            const prefName = getPrefectureName(gameState.currentPrefecture);
            resultMessage.textContent = `正解！ ${prefName}を正しく選びました！`;
        } else {
            // 不正解の場合はHTMLで分けているので複雑な処理が必要
            const messageText = resultMessage.innerHTML;
            const selectedName = messageText.match(/あなたが選んだのは、(.*?)です/)?.[1];
            
            if (selectedName && gameState.currentPrefecture) {
                const selectedPref = prefectures.find(p => p.name === selectedName || p.hiragana === selectedName);
                const correctPrefName = getPrefectureName(gameState.currentPrefecture);
                
                if (selectedPref) {
                    const selectedPrefName = getPrefectureName(selectedPref);
                    resultMessage.innerHTML = `不正解... あなたが選んだのは、${selectedPrefName}です。<br>正解の${correctPrefName}を確認しましょう。`;
                }
            }
        }
    } else {
        // 選択肢モードの場合も同様に処理
        if (isCorrect) {
            const prefName = getPrefectureName(gameState.currentPrefecture);
            resultMessage.textContent = `正解！ ハイライトされているのは${prefName}です！`;
        } else {
            const messageText = resultMessage.innerHTML;
            const selectedName = messageText.match(/あなたが選んだのは(.*?)です/)?.[1];
            
            if (selectedName && gameState.currentPrefecture) {
                const selectedPref = prefectures.find(p => p.name === selectedName || p.hiragana === selectedName);
                const correctPrefName = getPrefectureName(gameState.currentPrefecture);
                
                if (selectedPref) {
                    const selectedPrefName = getPrefectureName(selectedPref);
                    resultMessage.innerHTML = `不正解...<br>正解は${correctPrefName}です。`;
                }
            }
        }
    }
}

// 都道府県クリック時の処理
function handlePrefectureClick(event) {
    if (gameState.answered || mapState.isPanning) return;
    
    const clickedCode = event.target.getAttribute('data-code');
    const clickedName = event.target.getAttribute('data-name');
    
    if (gameState.gameMode === 'map') {
        // マップモード: 問題で指定された都道府県をクリックしたか判定
        checkAnswer(clickedCode, clickedName);
    } else if (gameState.gameMode === 'choice' && gameState.currentPrefecture) {
        // 選択肢モード: ハイライトされた都道府県の名前を選択肢から選ぶ
        // この処理は選択肢ボタンのクリックイベントで行われるため、ここでは何もしない
    }
}

// 選択肢を生成
function generateOptions() {
    optionsContainer.innerHTML = '';
    
    // 正解を含む4つの選択肢を作成
    const correctCode = gameState.currentPrefecture.code;
    const options = [correctCode];
    
    // まず近隣の都道府県から選択肢を追加
    if (typeof neighboringPrefectures !== 'undefined') {
        // 近隣都道府県リストが利用可能な場合
        let neighbors = neighboringPrefectures[correctCode] || [];
        
        // 現在の地方に含まれる近隣都道府県だけをフィルタリング
        let availableNeighbors = neighbors.filter(code => 
            gameState.availablePrefectures.some(p => p.code === code)
        );
        
        // シャッフルして近隣都道府県をランダムに選択
        shuffleArray(availableNeighbors);
        
        // 3つまで近隣都道府県を追加
        for (let i = 0; i < Math.min(3, availableNeighbors.length); i++) {
            if (!options.includes(availableNeighbors[i])) {
                options.push(availableNeighbors[i]);
            }
            
            // 4つの選択肢が揃ったら終了
            if (options.length >= 4) break;
        }
    }
    
    // 選択肢が足りない場合は同じ地方から追加
    if (options.length < 4) {
        // 同じ地方の都道府県をシャッフルしてランダムに追加
        const sameRegionPrefectures = gameState.availablePrefectures
            .filter(p => p.code !== correctCode && !options.includes(p.code));
        
        shuffleArray(sameRegionPrefectures);
        
        for (let i = 0; i < sameRegionPrefectures.length && options.length < 4; i++) {
            options.push(sameRegionPrefectures[i].code);
        }
    }
    
    // それでも選択肢が足りない場合は全国から追加
    while (options.length < 4) {
        // 全都道府県からランダムに追加
        const randomPrefecture = prefectures[Math.floor(Math.random() * prefectures.length)];
        const randomCode = randomPrefecture.code;
        
        if (!options.includes(randomCode)) {
            options.push(randomCode);
        }
        
        // 無限ループ防止
        if (options.length === 4 || prefectures.length <= options.length) {
            break;
        }
    }
    
    // 選択肢をシャッフル
    shuffleArray(options);
    
    // 難易度調整：選択肢が4つに満たない場合にダミー選択肢を追加
    while (options.length < 4) {
        // 別の地方からダミー選択肢を追加
        const correctRegion = getRegionForPrefecture(correctCode);
        
        if (correctRegion) {
            const otherRegions = Object.keys(regionPrefectures).filter(r => r !== correctRegion);
            
            if (otherRegions.length > 0) {
                // ランダムに別の地方を選択
                const randomRegion = otherRegions[Math.floor(Math.random() * otherRegions.length)];
                const prefCodesInRegion = regionPrefectures[randomRegion];
                
                if (prefCodesInRegion && prefCodesInRegion.length > 0) {
                    const randomPrefCode = prefCodesInRegion[Math.floor(Math.random() * prefCodesInRegion.length)];
                    
                    if (!options.includes(randomPrefCode)) {
                        options.push(randomPrefCode);
                    }
                }
            }
        }
        
        // どうしても追加できなければループを抜ける
        if (options.length < 4 && options.length === prefectures.length) {
            break;
        }
    }
    
    // 選択肢ボタンを生成
    options.forEach(code => {
        const prefecture = prefectures.find(p => p.code === code);
        const prefName = getPrefectureName(prefecture);
        
        const optionButton = document.createElement('div');
        optionButton.className = 'option-button';
        optionButton.textContent = prefName;
        optionButton.setAttribute('data-code', code);
        optionButton.setAttribute('data-name', prefecture.name);
        
        // タッチ操作に最適化したイベントリスナー
        if (gameState.isMobileDevice) {
            // モバイルではtouchendを使用
            optionButton.addEventListener('touchend', function(e) {
                if (gameState.answered) return;
                e.preventDefault(); // デフォルトのタッチイベントを防止
                checkAnswer(code, prefecture.name);
            });
        }
        
        // クリックイベントは常に設定（PCユーザー用）
        optionButton.addEventListener('click', function() {
            if (gameState.answered) return;
            checkAnswer(code, prefecture.name);
        });
        
        optionsContainer.appendChild(optionButton);
    });
    
    // モバイルデバイスの場合、選択肢の表示を調整
    if (gameState.isMobileDevice && window.innerWidth <= 600) {
        optionsContainer.style.flexDirection = 'column';
    } else {
        optionsContainer.style.flexDirection = 'row';
    }
}

// 都道府県コードから所属する地方を取得する
function getRegionForPrefecture(prefCode) {
    for (const [region, codes] of Object.entries(regionPrefectures)) {
        if (codes.includes(prefCode)) {
            return region;
        }
    }
    return null;
}

// 配列をシャッフル（Fisher-Yates アルゴリズム）
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// 回答をチェック
// 回答をチェック関数を少し修正
function checkAnswer(code, name) {
    // 以前の処理を継続する前に確実に有効な回答かチェック
    if (!code || !name || gameState.answered) {
        return; // 無効な場合は早期リターン
    }
    gameState.answered = true;
    const correctCode = gameState.currentPrefecture.code;
    const isCorrect = code === correctCode;
    
    // 選択された都道府県の現在のテキストモードでの表示名を取得
    const selectedPrefecture = prefectures.find(p => p.code === code);
    const selectedPrefName = getPrefectureName(selectedPrefecture);
    
    // 正解の都道府県の現在のテキストモードでの表示名を取得
    const correctPrefName = getPrefectureName(gameState.currentPrefecture);
    
    // 正解・不正解の表示
    if (gameState.gameMode === 'map') {
        if (isCorrect) {
            resultMessage.textContent = `正解！ ${selectedPrefName}を正しく選びました！`;
        } else {
            resultMessage.innerHTML = `不正解... あなたが選んだのは${selectedPrefName}です。<br>正解の${correctPrefName}を確認しましょう。`;
        }
    } else {
        if (isCorrect) {
            resultMessage.textContent = `正解！ ハイライトされているのは${selectedPrefName}です！`;
        } else {
            resultMessage.innerHTML = `不正解... <br>正解は${correctPrefName}です。`;
        }
    }
    
    resultMessage.style.color = isCorrect ? '#4caf50' : '#f44336';
    
    // 効果音を再生
    if (isCorrect) {
        correctSound.play();
        gameState.score += 10;
    } else {
        incorrectSound.play();
    }
    
    // スコア更新
    scoreElement.textContent = `スコア: ${gameState.score}`;
    
    // マップモードで正解の都道府県を明確に表示
    if (gameState.gameMode === 'map') {
        // 正解の都道府県を常に緑でハイライト
        const correctElement = document.getElementById(`prefecture-${correctCode}`);
        if (correctElement) {
            const paths = correctElement.querySelectorAll('path');
            paths.forEach(path => {
                path.classList.add('correct');
                
                // 不正解の場合は、正解をよりはっきりわかるように点滅効果を追加
                if (!isCorrect) {
                    // 点滅のアニメーションを追加
                    path.style.animation = 'blink-correct 1s linear infinite';
                }
            });
        }
        
        // 不正解の場合、選択した都道府県を赤で表示
        if (!isCorrect && code !== correctCode) {
            const clickedElement = document.getElementById(`prefecture-${code}`);
            if (clickedElement) {
                const paths = clickedElement.querySelectorAll('path');
                paths.forEach(path => {
                    path.classList.add('incorrect');
                });
            }
        }
    } else if (gameState.gameMode === 'choice') {
        // 選択肢モードでは、ハイライト表示の都道府県が正解
        const prefElement = document.getElementById(`prefecture-${correctCode}`);
        if (prefElement) {
            const paths = prefElement.querySelectorAll('path');
            paths.forEach(path => {
                path.classList.add(isCorrect ? 'correct' : 'incorrect');
            });
        }
    }
    
    // 次のボタンを表示
    nextButton.style.display = 'block';
    
    // 正解表示後、モバイルデバイスの場合は自動的にスクロールして結果を表示
    if (gameState.isMobileDevice) {
        // スムーズにスクロール
        setTimeout(() => {
            resultMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    }
}

// リセットして次の問題へ
function resetAndNextQuestion() {
    // 前回のハイライトをリセット
    const highlightedPaths = document.querySelectorAll('.highlight, .correct, .incorrect');
    highlightedPaths.forEach(path => {
        path.classList.remove('highlight', 'correct', 'incorrect');
        path.style.animation = 'none'; // アニメーションをリセット
    });
    
    // メッセージをリセット
    resultMessage.textContent = '';
    nextButton.style.display = 'none';
    
    // 新しい問題を出題（現在の地方から）
    if (gameState.availablePrefectures.length === 0) {
        console.error("利用可能な都道府県がありません。全国モードに戻します。");
        gameState.currentRegion = 'all';
        updateAvailablePrefectures();
    }
    
    // 前の問題を記録
    gameState.previousPrefecture = gameState.currentPrefecture;
    
    // 新しい問題を選択（前回と同じ問題が出ないようにする）
    let attempts = 0;
    let newIndex;
    let newPrefecture;
    
    // 利用可能な都道府県が2つ以上あれば、前回と異なる問題を出す
    if (gameState.availablePrefectures.length > 1 && gameState.previousPrefecture) {
        do {
            newIndex = Math.floor(Math.random() * gameState.availablePrefectures.length);
            newPrefecture = gameState.availablePrefectures[newIndex];
            attempts++;
            // 最大10回まで試行し、それでも同じなら諦める
        } while (newPrefecture.code === gameState.previousPrefecture.code && attempts < 10);
    } else {
        // 1つしかない場合や初回は単純にランダム選択
        newIndex = Math.floor(Math.random() * gameState.availablePrefectures.length);
        newPrefecture = gameState.availablePrefectures[newIndex];
    }
    
    gameState.currentPrefecture = newPrefecture;
    gameState.answered = false;
    
    console.log("新しい問題:", gameState.currentPrefecture.name);
    
    // 現在のテキストモードに応じた都道府県名を取得
    const prefName = getPrefectureName(gameState.currentPrefecture);
    
    if (gameState.gameMode === 'map') {
        // マップモード: 都道府県名を表示し、マップ上でその都道府県を選ばせる
        questionElement.textContent = `${prefName}はどこでしょう？`;
        
        // 選択肢モードからマップモードに切り替えた場合、ズームを適度にリセット
        resetZoom();
        
        // ボタンの表示を更新
        if (typeof updateCenterButtonForGameMode === 'function') {
            updateCenterButtonForGameMode();
        }
    } else {
        // 選択肢モード: 都道府県をハイライトし、名前を当てさせる
        questionElement.textContent = `ハイライトされているのはどこの都道府県でしょう？`;
        
        // 対象の都道府県をハイライト
        const prefElement = document.getElementById(`prefecture-${gameState.currentPrefecture.code}`);
        if (prefElement) {
            const paths = prefElement.querySelectorAll('path');
            paths.forEach(path => {
                path.classList.add('highlight');
            });
        }
        
        // 選択肢モードでは問題の都道府県を中心に表示
        centerPrefecture(gameState.currentPrefecture.code);
        
        // ボタンの表示を更新
        if (typeof updateCenterButtonForGameMode === 'function') {
            updateCenterButtonForGameMode();
        }
    }
    
    // 選択肢モードの場合は選択肢を生成
    if (gameState.gameMode === 'choice') {
        optionsContainer.style.display = 'flex';
        generateOptions();
    } else {
        optionsContainer.style.display = 'none';
    }
    
    // モバイルデバイスの場合、質問部分を表示するためにスクロール
    if (gameState.isMobileDevice) {
        setTimeout(() => {
            questionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

// ウィンドウサイズが変わったときにレイアウトを調整
window.addEventListener('resize', function() {
    // モバイルフラグを更新
    detectMobileDevice();
    
    // 選択肢の表示方向を調整
    if (gameState.gameMode === 'choice') {
        if (window.innerWidth <= 600) {
            optionsContainer.style.flexDirection = 'column';
        } else {
            optionsContainer.style.flexDirection = 'row';
        }
    }
});

// 初期表示時のチュートリアル表示
function showInitialHelpIfNecessary() {
    // LocalStorageで初回訪問かどうかを確認
    const hasVisitedBefore = localStorage.getItem('hasVisitedPrefectureQuiz');
    
    // 初回訪問時（または記録がない場合）
    if (!hasVisitedBefore) {
        // 「遊び方」を自動的に表示
        instructionsElement.style.display = 'block';
        helpButton.textContent = '遊び方を隠す';
        
        // 訪問記録を保存
        localStorage.setItem('hasVisitedPrefectureQuiz', 'true');
        
        // モバイルデバイスでは最初に遊び方にスクロール
        if (gameState.isMobileDevice) {
            setTimeout(() => {
                instructionsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 500);
        }
    } else {
        // 2回目以降の訪問では非表示
        instructionsElement.style.display = 'none';
    }
}

// 初期化
function initGame() {
    // モバイルデバイスの検出
    detectMobileDevice();
    
    // ゲームモードボタンのセットアップ
    setupModeButtons();
    
    // 効果音の初期化
    initSounds();
    
    // 初回訪問時のヘルプ表示処理
    showInitialHelpIfNecessary();
    
    // 利用可能な都道府県の初期化
    updateAvailablePrefectures();
    
    // SVGマップの読み込み
    loadSVGsFromData();
    
    // 最初の問題を出題
    resetAndNextQuestion();

    // バージョン表示を追加
    addVersionDisplay();

}

// バージョン表示を追加する関数
function addVersionDisplay() {
    const settingsPanel = document.getElementById('settings-panel');
    if (!settingsPanel) return;
    
    // バージョン表示要素
    const versionDiv = document.createElement('div');
    versionDiv.className = 'settings-group';
    versionDiv.style.borderTop = '1px solid #eee';
    versionDiv.style.marginTop = '10px';
    versionDiv.style.paddingTop = '10px';
    versionDiv.innerHTML = `
        <div class="settings-label">バージョン:</div>
        <div>v1.0.6 (2025/04/03)</div>
    `;
    
    // 設定パネルに追加
    settingsPanel.appendChild(versionDiv);
}

// ゲーム開始
window.addEventListener('load', initGame);