// グローバル変数
let audioContext;
let audioBuffer;
let audioSource;
let analyser;
let isPlaying = false;
let gameStarted = false;
let isPaused = false;
let notes = [];
let gameLoop;
let startTime;
let currentScore = 0;
let comboCount = 0;
let maxCombo = 0;
let perfectCount = 0;
let goodCount = 0;
let missCount = 0;
let lastBeatTime = 0;
let isMobile = false;
let difficulty = 'easy'; // 'easy', 'normal', 'hard'
let visualizerStyle = 'neon'; // デフォルトスタイル
let gameVolume = 0.3; // デフォルト音量（30%）
let volumeNode; // 音量制御ノード

// 定数
const GAME_FPS = 60;
const NOTE_SPEED = 300; // px/s - 速度を少し遅くして反応しやすく
const NOTE_RADIUS = 30;
const MIN_NOTE_INTERVAL = 300; // ms
const BEAT_THRESHOLD = 0.15; // 音量検出閾値（動的閾値で上書きされるがフォールバック用に残す）
const HIT_THRESHOLD_PERFECT = 120; // ms - 判定をさらに緩く
const HIT_THRESHOLD_GOOD = 250; // ms - 判定をさらに緩く
const PERFECT_SCORE = 100;
const GOOD_SCORE = 50;
const COMBO_BONUS = 5;
const DEBUG_MODE = true; // デバッグ情報をコンソールに表示

// 難易度ごとの設定
const DIFFICULTY_SETTINGS = {
    'easy': {
        noteSpeed: 180,        // さらに遅く
        perfectThreshold: 180, // 判定を緩く
        goodThreshold: 350,    // 判定を緩く
        noteDensity: 0.3       // 基本確率に掛ける係数
    },
    'normal': {
        noteSpeed: 300,
        perfectThreshold: 120,
        goodThreshold: 250,
        noteDensity: 1.0
    },
    'hard': {
        noteSpeed: 400,
        perfectThreshold: 80,
        goodThreshold: 180,
        noteDensity: 1.5       // ハードはより多く
    }
};

// サンプル音楽のファイル名（曲をアプリと同じフォルダに置く場合）
const SAMPLE_SONGS = {
    'sample1': 'song1.mp3', // 1曲目
    'sample2': 'song2.mp3', // 2曲目
    'sample3': 'song3.mp3'  // 3曲目
};

// DOMが読み込まれたらイベントリスナー設定
document.addEventListener('DOMContentLoaded', init);

// デバッグログ
function debugLog(message) {
    if (DEBUG_MODE) {
        console.log(message);
        
        // // デバッグオーバーレイに表示
        // const debugOverlay = document.getElementById('debug-overlay');
        // const debugText = document.getElementById('debug-text');
        
        // if (debugOverlay && debugText) {
        //     debugOverlay.style.display = 'block';
        //     debugText.textContent += message + '\n';
            
        //     // 最大10行まで表示
        //     const lines = debugText.textContent.split('\n');
        //     if (lines.length > 10) {
        //         debugText.textContent = lines.slice(lines.length - 10).join('\n');
        //     }
        // }
    }
}

// モバイル判定
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    isMobile = true;
}

// 初期化
function init() {
    debugLog('初期化開始');
    
    // スタート画面のイベントリスナー
    document.getElementById('music-upload').addEventListener('change', handleFileUpload);
    
    // Web Audio API コンテキストをユーザージェスチャーで初期化する準備
    const initAudioContext = () => {
        if (!audioContext) {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                debugLog('AudioContext 初期化成功');
            } catch (e) {
                console.error('AudioContext 初期化エラー:', e);
                alert('ブラウザがWeb Audio APIをサポートしていないか、初期化に失敗しました。');
            }
        }
        // イベントリスナーを一度だけ実行
        document.removeEventListener('click', initAudioContext);
        document.removeEventListener('touchstart', initAudioContext);
    };
    
    // ユーザージェスチャーでAudioContextを初期化
    document.addEventListener('click', initAudioContext);
    document.addEventListener('touchstart', initAudioContext);
    
    // 難易度選択
    document.getElementById('easy-mode').addEventListener('click', () => setDifficulty('easy'));
    document.getElementById('normal-mode').addEventListener('click', () => setDifficulty('normal'));
    document.getElementById('hard-mode').addEventListener('click', () => setDifficulty('hard'));
    
    // サンプル曲選択
    const presetItems = document.querySelectorAll('.preset-item');
    presetItems.forEach(item => {
        item.addEventListener('click', () => handlePresetSelect(item.dataset.song));
    });
    
    // ゲーム操作イベントリスナー（キーボード）
    window.addEventListener('keydown', handleKeyDown);
    
    // ゲーム操作イベントリスナー（マウス/タッチ）
    document.getElementById('game-container').addEventListener('click', handleNoteHit);
    document.getElementById('game-container').addEventListener('touchstart', handleNoteHit);
    
    // ポーズボタン
    document.getElementById('pause-btn').addEventListener('click', togglePause);
    
    // ポーズ画面操作
    document.getElementById('resume-btn').addEventListener('click', resumeGame);
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    document.getElementById('quit-btn').addEventListener('click', quitGame);
    
    // リザルト画面操作
    document.getElementById('retry-btn').addEventListener('click', restartGame);
    document.getElementById('home-btn').addEventListener('click', goToHome);
    
    // 音量スライダー
    const volumeSlider = document.getElementById('volume-slider');
    volumeSlider.addEventListener('input', function() {
        updateVolume(this.value / 100);
    });
    
    // ゲーム中の音量ボタン
    document.getElementById('volume-btn').addEventListener('click', toggleVolumePanel);

    // ビジュアライザースタイル選択
    const styleOptions = document.querySelectorAll('.style-option');
    styleOptions.forEach(option => {
        option.addEventListener('click', () => setVisualizerStyle(option.dataset.style));
    });

    // リサイズイベント
    window.addEventListener('resize', handleResize);
    
    // 初期サイズ設定
    handleResize();
    
    // CanvasとHitAreaを適切に初期化
    initializeGameArea();
    
    debugLog('初期化完了');
}

// 難易度設定
function setDifficulty(level) {
    difficulty = level;
    
    // UI更新
    document.querySelectorAll('.difficulty-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    document.getElementById(`${level}-mode`).classList.add('selected');
    
    debugLog(`難易度設定: ${level}`);
}

// ゲームエリア初期化（Canvas、HitAreaのサイズ設定など）
function initializeGameArea() {
    const gameCanvas = document.getElementById('game-canvas');
    const visualizerCanvas = document.getElementById('visualizer');
    const gameContainer = document.getElementById('game-container');
    const hitArea = document.getElementById('hit-area');
    
    if (!gameCanvas || !visualizerCanvas || !gameContainer || !hitArea) {
        console.error('ゲーム要素が見つかりません');
        return;
    }
    
    // Canvasのサイズを設定
    gameCanvas.width = gameContainer.offsetWidth;
    gameCanvas.height = gameContainer.offsetHeight;
    visualizerCanvas.width = visualizerCanvas.offsetWidth;
    visualizerCanvas.height = visualizerCanvas.offsetHeight;
    
    // HitAreaの位置を調整
    const hitAreaY = gameCanvas.height * 0.85;
    const hitAreaHeight = 80; // px
    
    hitArea.style.bottom = `${gameCanvas.height - hitAreaY - hitAreaHeight/2}px`;
    hitArea.style.height = `${hitAreaHeight}px`;
    
    debugLog(`Canvas初期化: ${gameCanvas.width}x${gameCanvas.height}, HitArea位置: ${hitAreaY}px`);
    
    // 初期描画
    const ctx = gameCanvas.getContext('2d');
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    // ヒットラインの位置調整
    const hitLine = document.querySelector('.hit-line');
    if (hitLine) {
        hitLine.style.top = '50%';
    }
}

// ウィンドウリサイズ処理
function handleResize() {
    const gameCanvas = document.getElementById('game-canvas');
    const visualizerCanvas = document.getElementById('visualizer');
    const gameContainer = document.getElementById('game-container');
    const hitArea = document.getElementById('hit-area');
    
    if (!gameCanvas || !visualizerCanvas) {
        console.error('Canvas elements not found!');
        return;
    }
    
    // Canvas要素のサイズを設定
    gameCanvas.width = gameContainer.offsetWidth;
    gameCanvas.height = gameContainer.offsetHeight;
    
    visualizerCanvas.width = visualizerCanvas.offsetWidth;
    visualizerCanvas.height = visualizerCanvas.offsetHeight;
    
    // ヒットエリアの位置を調整
    const hitAreaY = gameCanvas.height * 0.85;
    hitArea.style.bottom = `${gameCanvas.height - hitAreaY}px`;
    
    console.log(`Canvas resized: ${gameCanvas.width}x${gameCanvas.height}`);
    
    // ゲーム中なら再描画
    if (gameStarted) {
        drawGame();
        drawVisualizer();
    }
}

// ファイルアップロード処理
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        debugLog(`ファイル選択: ${file.name} (${Math.round(file.size / 1024)} KB)`);
        
        const audioPlayer = document.getElementById('audio-player');
        const objectURL = URL.createObjectURL(file);
        audioPlayer.src = objectURL;
        
        // ファイルを読み込んでWeb Audio APIで解析準備
        loadAudioFile(objectURL);
    }
}

// プリセット音楽選択処理
function handlePresetSelect(songKey) {
    debugLog(`プリセット選択: ${songKey}`);
    
    if (SAMPLE_SONGS[songKey]) {
        try {
            const audioPlayer = document.getElementById('audio-player');
            audioPlayer.src = SAMPLE_SONGS[songKey];
            
            // プリセット曲を読み込んでWeb Audio APIで解析準備
            loadAudioFile(SAMPLE_SONGS[songKey]);
        } catch (e) {
            console.error('プリセット読み込みエラー:', e);
            alert(`プリセット曲の読み込みに失敗しました: ${e.message}\nファイルが正しく配置されているか確認してください。`);
        }
    }
}

// 音楽ファイル読み込み
async function loadAudioFile(url) {
    try {
        debugLog('音楽ファイル読み込み開始...');
        
        // AudioContextが初期化されていない場合は初期化
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            debugLog('AudioContext初期化（loadAudioFile内）');
        }
        
        // 一時停止されている場合は再開
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
            debugLog('AudioContext一時停止状態から再開');
        }
        
        debugLog('ファイルをfetchで取得中...');
        
        // エラーハンドリングを強化したfetch
        const response = await fetch(url, { mode: 'cors' })
            .catch(e => {
                throw new Error(`ファイル取得エラー: ${e.message}`);
            });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        debugLog('ファイル取得成功、ArrayBufferに変換中...');
        
        const arrayBuffer = await response.arrayBuffer()
            .catch(e => {
                throw new Error(`ArrayBuffer変換エラー: ${e.message}`);
            });
        
        if (arrayBuffer.byteLength === 0) {
            throw new Error('Empty audio file received');
        }
        
        debugLog(`音声データ取得: ${Math.round(arrayBuffer.byteLength / 1024)} KB、デコード中...`);
        
        // AudioBufferにデコード（プロミスをきちんと待つ）
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
            .catch(e => {
                throw new Error(`音声デコードエラー: ${e.message}`);
            });
        
        debugLog(`音声デコード成功: 長さ=${audioBuffer.duration.toFixed(2)}秒、チャネル数=${audioBuffer.numberOfChannels}`);
        
        // 音楽解析準備完了、ゲーム開始
        prepareGame();
    } catch (error) {
        console.error('音楽ファイル読み込みエラー:', error);
        debugLog(`読み込みエラー: ${error.message}`);
        alert('音楽ファイルを読み込めませんでした: ' + error.message + '\n別のファイルを試してください。');
    }
}

// ゲーム準備
function prepareGame() {
    
    // 開始画面を非表示、ゲーム画面を表示
    document.getElementById('start-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');
    
    // Canvas初期化を確実に行う
    initializeGameArea();

    // 音楽解析とノーツ生成
    analyzeMusic();
    
    // ノーツが生成されたか確認
    if (notes.length === 0) {
        alert('ノーツを生成できませんでした。別の音楽ファイルを試してください。');
        goToHome();
        return;
    }
    
    // ゲーム開始
    startGame();
}

// 音楽解析とノーツ生成
function analyzeMusic() {
    // 以前のノーツをクリア
    notes = [];
    
    // 解析器作成
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    
    // 曲の総サンプル数を計算
    const sampleRate = audioBuffer.sampleRate;
    const totalSamples = audioBuffer.length;
    const channelData = audioBuffer.getChannelData(0); // モノラルとして最初のチャンネルを使用
    
    // BPM検出を試みる
    const bpmInfo = detectBPM(channelData, sampleRate);
    const detectedBPM = bpmInfo.bpm;
    const confidence = bpmInfo.confidence;
    
    console.log(`BPM検出結果: ${detectedBPM} BPM (信頼度: ${confidence.toFixed(2)})`);
    
    // BPMに基づいてノーツを生成するか、
    // 信頼度が低い場合は従来の音量ベース検出を使用
    if (confidence > 0.5 && detectedBPM > 40 && detectedBPM < 300) {
        console.log(`BPMに基づいてノーツを生成します: ${detectedBPM} BPM`);
        generateNotesByBPM(detectedBPM, audioBuffer.duration);
    } else {
        console.log('通常の音量ベース検出を使用します');
        generateNotesByVolume(channelData, sampleRate);
    }
    
    console.log(`音楽解析完了: ${notes.length}個のビートを検出`);
    
    // デバッグ用にノーツの時間をコンソールに出力
    if (notes.length > 0) {
        console.log(`最初のノーツ: ${notes[0].time.toFixed(2)}秒, 最後のノーツ: ${notes[notes.length-1].time.toFixed(2)}秒`);
    }
}

// BPM検出関数
function detectBPM(channelData, sampleRate) {
    // エネルギー計算用の設定
    const hopSize = Math.floor(sampleRate * 0.01); // 10ms
    const frameSize = Math.floor(sampleRate * 0.04); // 40ms
    const energies = [];
    
    // 各フレームのエネルギーを計算
    for (let i = 0; i < channelData.length - frameSize; i += hopSize) {
        let energy = 0;
        for (let j = 0; j < frameSize; j++) {
            energy += channelData[i + j] * channelData[i + j];
        }
        energies.push(energy / frameSize);
    }
    
    // エネルギーの差分を計算（オンセット検出）
    const diffs = [];
    for (let i = 1; i < energies.length; i++) {
        diffs.push(Math.max(0, energies[i] - energies[i-1]));
    }
    
    // 平均値以上の差分を「オンセット」とみなす
    const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    const onsets = [];
    
    for (let i = 0; i < diffs.length; i++) {
        if (diffs[i] > avgDiff * 1.5) {
            // フレーム位置を秒に変換
            onsets.push(i * hopSize / sampleRate);
        }
    }
    
    // オンセット間の間隔を計算
    const intervals = [];
    for (let i = 1; i < onsets.length; i++) {
        intervals.push(onsets[i] - onsets[i-1]);
    }
    
    // ヒストグラムでBPMを推定
    const histBins = {};
    let maxCount = 0;
    let mostCommonInterval = 0;
    
    intervals.forEach(interval => {
        // 同じビンに集約（10ms精度）
        const binKey = Math.round(interval * 100) / 100;
        
        // 妥当なテンポ範囲内（40-300 BPM）のみ考慮
        const bpm = 60 / binKey;
        if (bpm < 40 || bpm > 300) return;
        
        histBins[binKey] = (histBins[binKey] || 0) + 1;
        
        if (histBins[binKey] > maxCount) {
            maxCount = histBins[binKey];
            mostCommonInterval = binKey;
        }
    });
    
    // BPMを計算
    const bpm = mostCommonInterval ? 60 / mostCommonInterval : 120;
    
    // BPM検出の信頼度（メインのビンがどれだけ支配的か）
    const totalIntervals = intervals.length;
    const confidence = totalIntervals > 0 ? maxCount / totalIntervals : 0;
    
    return { bpm, confidence };
}

// BPMに基づいてノーツを生成
// generateNotesByBPM関数を完全に修正
function generateNotesByBPM(bpm, duration) {
    // 一拍の時間（秒）
    const beatTime = 60 / bpm;
    
    // 難易度に応じてノーツ密度を調整
    const diffSettings = DIFFICULTY_SETTINGS[difficulty];
    const densityFactor = diffSettings.noteDensity;
    
    debugLog(`BPMベースノーツ生成: BPM=${bpm}, 密度係数=${densityFactor}`);
    
    // 曲の開始から少し遅らせる（2秒）
    const startOffset = 2.0;
    
    // 最初の拍の位置を計算（開始オフセットの次の拍）
    const firstBeatTime = startOffset + (beatTime - (startOffset % beatTime));
    
    // 曲の最後まで拍を生成
    for (let time = firstBeatTime; time < duration - 0.1; time += beatTime) {
        // 4拍ごとに1回強拍
        const beatIndex = Math.floor((time - firstBeatTime) / beatTime);
        const isMajorBeat = beatIndex % 4 === 0;
        
        // 難易度ごとの生成確率を大幅に調整
        let spawnChance;
        
        if (difficulty === 'easy') {
            // Easyでは強拍のみを低確率で生成（弱拍はほぼ生成しない）
            spawnChance = isMajorBeat ? 0.4 : 0.05;
        } else if (difficulty === 'normal') {
            // Normalでは強拍を中確率、弱拍を低確率で生成
            spawnChance = isMajorBeat ? 0.7 : 0.2;
        } else {
            // Hardでは強拍を高確率、弱拍を中確率で生成
            spawnChance = isMajorBeat ? 0.9 : 0.4;
        }
        
        // 最終確率計算（密度係数を掛ける）
        const finalChance = spawnChance * densityFactor;
        
        // この確率でノーツを生成
        if (Math.random() < finalChance) {
            const xPos = Math.random() * 0.6 + 0.2; // 画面の20%〜80%の範囲でランダム
            
            notes.push({
                time: time,
                x: xPos,
                status: 'waiting',
                isMajorBeat: isMajorBeat
            });
        }
    }
}

// 音量ベースでノーツを生成（従来の方法の改良版）
function generateNotesByVolume(channelData, sampleRate) {
    // 音量の平均と最大値を計算して動的閾値を設定
    let totalVolume = 0;
    let maxVolume = 0;
    
    // サンプルレートを下げて効率的に走査
    const samplingStep = 100;
    for (let i = 0; i < channelData.length; i += samplingStep) {
        const volume = Math.abs(channelData[i]);
        totalVolume += volume;
        if (volume > maxVolume) {
            maxVolume = volume;
        }
    }
    
    const avgVolume = totalVolume / (channelData.length / samplingStep);
    // 動的閾値を設定（平均の2倍と最大値の30%の大きい方）
    const dynamicThreshold = Math.max(avgVolume * 2, maxVolume * 0.3);
    
    debugLog(`音量解析: 平均=${avgVolume.toFixed(4)}, 最大=${maxVolume.toFixed(4)}, 閾値=${dynamicThreshold.toFixed(4)}`);
    
    // 難易度設定を取得
    const diffSettings = DIFFICULTY_SETTINGS[difficulty];
    const densityFactor = diffSettings.noteDensity;
    
    // ピーク検出用の設定
    const samplesPerFrame = Math.floor(sampleRate / 10); // 0.1秒ごとに検査
    let lastPeakTime = 0;
    
    // 最初は2秒の遅延を設ける
    const startDelay = 2.0;
    
    // 曲全体を解析してピーク（ビート）を検出
    for (let i = 0; i < channelData.length; i += samplesPerFrame) {
        // このフレームの最大音量を計算
        let frameMaxVolume = 0;
        for (let j = 0; j < samplesPerFrame && i + j < channelData.length; j++) {
            const volume = Math.abs(channelData[i + j]);
            if (volume > frameMaxVolume) {
                frameMaxVolume = volume;
            }
        }
        
        // 現在の時間（秒）
        const currentTime = i / sampleRate;
        
        // 開始遅延より前は無視
        if (currentTime < startDelay) continue;
        
        // ピーク検出（閾値以上で、前回のピークから最低間隔以上経過している）
        // 密度係数に応じて閾値を調整
        const adjustedThreshold = dynamicThreshold * (1.0 / (0.5 + densityFactor * 0.5));
        
        if (frameMaxVolume > adjustedThreshold && (currentTime - lastPeakTime) > (MIN_NOTE_INTERVAL / 1000)) {
            // ノーツ生成確率を難易度で調整
            if (Math.random() < densityFactor) {
                // ノーツを追加（時間、位置、状態）
                const xPos = Math.random() * 0.6 + 0.2; // 画面の20%〜80%の範囲でランダム
                notes.push({
                    time: currentTime,
                    x: xPos,
                    status: 'waiting', // 'waiting', 'hit', 'missed'
                    isMajorBeat: false // 音量ベースでは強拍区別なし
                });
            }
            
            // 最後のピーク時間を更新（生成しなくても更新）
            lastPeakTime = currentTime;
        }
    }
    
    // ノーツが少なすぎる場合は動的に閾値を下げて再解析
    if (notes.length < 10) {
        debugLog(`ノーツが少なすぎます(${notes.length}個)。閾値を下げて再解析します。`);
        
        // 前回の結果をクリア
        const oldNotes = [...notes];
        notes = [];
        
        const lowerThreshold = dynamicThreshold * 0.6;
        lastPeakTime = 0;
        
        for (let i = 0; i < channelData.length; i += samplesPerFrame) {
            let frameMaxVolume = 0;
            for (let j = 0; j < samplesPerFrame && i + j < channelData.length; j++) {
                const volume = Math.abs(channelData[i + j]);
                if (volume > frameMaxVolume) {
                    frameMaxVolume = volume;
                }
            }
            
            const currentTime = i / sampleRate;
            
            // 開始遅延より前は無視
            if (currentTime < startDelay) continue;
            
            const adjustedThreshold = lowerThreshold * (1.0 / (0.5 + densityFactor * 0.5));
            
            if (frameMaxVolume > adjustedThreshold && (currentTime - lastPeakTime) > (MIN_NOTE_INTERVAL / 1000)) {
                if (Math.random() < densityFactor) {
                    const xPos = Math.random() * 0.6 + 0.2;
                    notes.push({
                        time: currentTime,
                        x: xPos,
                        status: 'waiting',
                        isMajorBeat: false
                    });
                }
                
                lastPeakTime = currentTime;
            }
        }
        
        // それでも生成できなかった場合は前の結果を使用
        if (notes.length < oldNotes.length) {
            debugLog(`閾値を下げても改善しませんでした。元のノーツを使用します。`);
            notes = oldNotes;
        }
    }
}

// ゲーム開始
function startGame() {
    // ステータスリセット
    gameStarted = true;
    isPlaying = true;
    isPaused = false;
    currentScore = 0;
    comboCount = 0;
    maxCombo = 0;
    perfectCount = 0;
    goodCount = 0;
    missCount = 0;
    
    // スコア表示更新
    updateScoreDisplay();
    
    // 音楽再生
    playMusic();
    
    // ゲームループ開始
    startTime = audioContext.currentTime;
    gameLoop = setInterval(updateGame, 1000 / GAME_FPS);
}



// 音量更新関数
// 修正版 updateVolume 関数
function updateVolume(value) {
    gameVolume = value;
    
    // すべての音量表示を更新
    const volumeDisplays = document.querySelectorAll('.volume-value');
    volumeDisplays.forEach(display => {
        display.textContent = `${Math.round(value * 100)}%`;
    });
    
    // すべての音量スライダーを更新
    const volumeSliders = document.querySelectorAll('.volume-slider');
    volumeSliders.forEach(slider => {
        slider.value = value * 100;
    });
    
    // アクティブな音量ノードがある場合に更新
    if (volumeNode) {
        volumeNode.gain.value = value;
    }
    
    debugLog(`音量設定: ${Math.round(value * 100)}%`);
}

// 音量パネル表示切替
function toggleVolumePanel() {
    const panel = document.querySelector('.volume-panel');
    if (!panel) {
        // パネルがなければ作成
        createVolumePanel();
    } else {
        // 表示/非表示切替
        panel.classList.toggle('active');
    }
}

// 音量パネル作成
function createVolumePanel() {
    const gameScreen = document.getElementById('game-screen');
    
    const panel = document.createElement('div');
    panel.className = 'volume-panel active';
    panel.innerHTML = `
        <div class="volume-control">
            <span class="volume-icon">🔊</span>
            <input type="range" id="game-volume-slider" min="0" max="100" value="${gameVolume * 100}" class="volume-slider">
            <span class="volume-value">${Math.round(gameVolume * 100)}%</span>
        </div>
    `;
    
    gameScreen.appendChild(panel);
    
    // スライダーのイベントリスナー
    const slider = panel.querySelector('#game-volume-slider');
    slider.addEventListener('input', function() {
        updateVolume(this.value / 100);
    });
    
    // 画面外クリックで閉じる
    document.addEventListener('click', function(e) {
        if (panel.classList.contains('active') && 
            !panel.contains(e.target) && 
            e.target.id !== 'volume-btn') {
            panel.classList.remove('active');
        }
    });
}

// 音楽再生
function playMusic() {
    try {
        // 既存のソースがあれば停止
        if (audioSource) {
            try {
                audioSource.stop();
            } catch (e) {
                debugLog(`既存音源停止エラー: ${e.message}`);
            }
        }
        
        // AudioContextが一時停止状態なら再開
        if (audioContext.state === 'suspended') {
            audioContext.resume()
                .then(() => debugLog('AudioContext再開成功'))
                .catch(e => debugLog(`AudioContext再開エラー: ${e.message}`));
        }
        
        audioSource = audioContext.createBufferSource();
        audioSource.buffer = audioBuffer;
        
        // 音量ノードを追加
        volumeNode = audioContext.createGain();
        volumeNode.gain.value = gameVolume;
        
        // 接続を変更: audioSource -> volumeNode -> analyser -> destination
        audioSource.connect(volumeNode);
        volumeNode.connect(analyser);
        analyser.connect(audioContext.destination);
        
        // 再生開始
        audioSource.start(0);
        audioSource.onended = endGame;
        
        debugLog(`音楽再生開始: 長さ=${audioBuffer.duration.toFixed(2)}秒, 音量=${Math.round(gameVolume * 100)}%`);
    } catch (error) {
        console.error('音楽再生エラー:', error);
        debugLog(`音楽再生失敗: ${error.message}`);
        alert('音楽の再生中にエラーが発生しました。ページを再読み込みしてください。');
    }
}

// ゲーム更新
function updateGame() {
    if (isPaused) return;
    
    const currentTime = audioContext.currentTime - startTime;
    const gameCanvas = document.getElementById('game-canvas');
    const gameHeight = gameCanvas.height;
    const hitAreaY = gameHeight * 0.85; // ヒットエリアの位置（画面下部から15%）
    
    // 難易度に応じた設定を取得
    const diffSettings = DIFFICULTY_SETTINGS[difficulty];
    const noteSpeed = diffSettings.noteSpeed;
    
    // ビジュアライザー更新
    drawVisualizer();
    
    // ノーツ更新
    notes.forEach(note => {
        // まだ出現していないノーツはスキップ
        if (note.time > currentTime + (gameHeight / noteSpeed)) {
            return;
        }
        
        // ノーツのY座標を計算（時間差に基づいて）
        const timeDiff = note.time - currentTime;
        const yPos = hitAreaY - (timeDiff * noteSpeed);
        
        // 画面外に出たノーツは「missed」とする
        if (yPos > gameHeight + NOTE_RADIUS && note.status === 'waiting') {
            note.status = 'missed';
            handleMiss();
        }
        
        // ノーツデータを更新
        note.y = yPos;
    });
    
    // ゲーム描画
    drawGame();
}

// ゲーム描画
function drawGame() {
    const gameCanvas = document.getElementById('game-canvas');
    const ctx = gameCanvas.getContext('2d');
    const width = gameCanvas.width;
    const height = gameCanvas.height;
    
    // キャンバスをクリア
    ctx.clearRect(0, 0, width, height);
    
    // ヒットエリアのY座標
    const hitAreaY = height * 0.85;
    
    // ノーツ描画
    notes.forEach(note => {
        if (note.status === 'waiting' && note.y !== undefined) {
            // ノーツのサイズ（強拍は少し大きく）
            const noteSize = note.isMajorBeat ? NOTE_RADIUS * 1.2 : NOTE_RADIUS;
            
            // ノーツの色（強拍は特別な色に）
            const noteColor = note.isMajorBeat ? '#00ffff' : '#ff00ff';
            const noteEdgeColor = note.isMajorBeat ? '#ffffff' : '#ffffff';
            
            // グラデーション作成
            const gradient = ctx.createRadialGradient(
                note.x * width, note.y, noteSize * 0.3,
                note.x * width, note.y, noteSize
            );
            gradient.addColorStop(0, noteColor);
            gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
            
            // ノーツ描画
            ctx.beginPath();
            ctx.arc(note.x * width, note.y, noteSize, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // 縁取り
            ctx.beginPath();
            ctx.arc(note.x * width, note.y, noteSize, 0, Math.PI * 2);
            ctx.strokeStyle = noteEdgeColor;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // 強拍なら特別なエフェクト
            if (note.isMajorBeat) {
                ctx.beginPath();
                ctx.arc(note.x * width, note.y, noteSize * 1.5, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    });
}

// ビジュアライザースタイル設定関数
function setVisualizerStyle(style) {
    visualizerStyle = style;
    
    // UI更新
    document.querySelectorAll('.style-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    document.getElementById(`style-${style}`).classList.add('selected');
    
    // ゲーム画面クラス更新
    const gameScreen = document.getElementById('game-screen');
    gameScreen.classList.remove('visualizer-neon', 'visualizer-ocean', 'visualizer-rainbow');
    gameScreen.classList.add(`visualizer-${style}`);
    
    debugLog(`ビジュアライザースタイル設定: ${style}`);
}

// drawVisualizer関数の修正
// ビジュアライザー描画
function drawVisualizer() {
    if (!analyser) return;
    
    const canvas = document.getElementById('visualizer');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // キャンバスをクリア
    ctx.clearRect(0, 0, width, height);
    
    // 周波数データを取得
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    
    // バーの幅を計算
    const barWidth = width / bufferLength * 3;
    let barHeight;
    let x = 0;
    
    // スタイルに応じた色設定
    const getStyleColor = (i) => {
        const normalized = i / bufferLength;
    
        switch (visualizerStyle) {
            case 'neon': {
                // ネオン系カラーのカラーパレット
                const neonColors = [180, 220, 280, 320, 120]; // シアン, ブルー, パープル, ピンク, グリーン
                const steps = neonColors.length;
                const totalSpan = 1 / steps;
                const position = normalized % 1;
                const index = Math.floor(position / totalSpan);
                const nextIndex = (index + 1) % steps;
                const localT = (position - index * totalSpan) / totalSpan;
    
                // 線形補間
                const hue = neonColors[index] + (neonColors[nextIndex] - neonColors[index]) * localT;
                return `hsla(${(hue + 360) % 360}, 100%, 60%, 0.6)`;
            }
            case 'ocean': {
                const blueHue = 200 + normalized * 40;
                return `hsla(${blueHue}, 100%, ${40 + normalized * 30}%, 0.3)`;
            }
            case 'rainbow': {
                const rainbowHue = (i / bufferLength) * 360;
                return `hsla(${rainbowHue}, 100%, 50%, 0.8)`;
            }
            default:
                return `hsla(${normalized * 360}, 100%, 50%, 0.3)`;
        }
    };
    
    
    
    // 各周波数ごとに描画
    for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 255 * height * 0.7;
        
        // スタイルに応じた色を取得
        ctx.fillStyle = getStyleColor(i);
        
        // 左右対称に描画
        const centerX = width / 2;
        
        // 左側のバー
        ctx.fillRect(centerX - x - barWidth, height - barHeight, barWidth, barHeight);
        
        // 右側のバー
        ctx.fillRect(centerX + x, height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
        
        // 画面端まで描画したら終了
        if (x > centerX) break;
    }
    
    // 音量データも取得してビートに応じて背景を変化
    const timeData = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(timeData);
    
    // 現在の音量レベルを計算
    let sumSquares = 0;
    for (let i = 0; i < timeData.length; i++) {
        const value = (timeData[i] - 128) / 128;
        sumSquares += value * value;
    }
    const rms = Math.sqrt(sumSquares / timeData.length);
    
    // ビート検出（RMSが閾値を超えた場合）
    const currentTime = audioContext.currentTime;
    if (rms > BEAT_THRESHOLD && (currentTime - lastBeatTime) > 0.1) {
        // ビートに合わせて背景色を変化
        document.body.style.backgroundColor = `rgba(${Math.floor(Math.random() * 20)}, ${Math.floor(Math.random() * 20)}, ${40 + Math.floor(Math.random() * 20)}, 1)`;
        lastBeatTime = currentTime;
    }
}

// キー入力処理
function handleKeyDown(event) {
    // スペースキーでノーツヒット
    if (event.code === 'Space' && gameStarted && !isPaused) {
        handleNoteHit();
        event.preventDefault(); // スクロール防止
    }
    
    // ESCキーでポーズ
    if (event.code === 'Escape' && gameStarted) {
        togglePause();
        event.preventDefault();
    }
}

// ノーツヒット処理
function handleNoteHit(event) {
    if (!gameStarted || isPaused) return;
    if (event) event.preventDefault();
    
    const currentTime = audioContext.currentTime - startTime;
    const gameCanvas = document.getElementById('game-canvas');
    const hitAreaY = gameCanvas.height * 0.85; // ヒットエリアの位置
    
    // 難易度設定を取得
    const diffSettings = DIFFICULTY_SETTINGS[difficulty];
    const perfectThreshold = diffSettings.perfectThreshold / 1000; // ms → 秒
    const goodThreshold = diffSettings.goodThreshold / 1000; // ms → 秒
    
    debugLog(`ヒット操作: 時間=${currentTime.toFixed(2)}秒`);
    
    // ヒット可能な最も近いノーツを探す
    let closestNote = null;
    let minTimeDiff = Infinity;
    
    notes.forEach(note => {
        if (note.status === 'waiting' && note.y !== undefined) {
            const timeDiff = Math.abs(note.time - currentTime);
            
            // 最小時間差のノーツを記録
            if (timeDiff < minTimeDiff) {
                minTimeDiff = timeDiff;
                closestNote = note;
            }
        }
    });
    
    // ヒット判定
    if (closestNote && minTimeDiff < goodThreshold) {
        // パーフェクト判定
        if (minTimeDiff < perfectThreshold) {
            closestNote.status = 'perfect';
            comboCount++;
            if (comboCount > maxCombo) maxCombo = comboCount;
            currentScore += PERFECT_SCORE + (comboCount * COMBO_BONUS);
            perfectCount++;
            
            // エフェクト表示
            showHitEffect('PERFECT!', '#00ff00', closestNote.x);
            debugLog(`パーフェクト! 時間差=${(minTimeDiff * 1000).toFixed(0)}ms`);
        } 
        // グッド判定
        else {
            closestNote.status = 'good';
            comboCount++;
            if (comboCount > maxCombo) maxCombo = comboCount;
            currentScore += GOOD_SCORE + (comboCount * COMBO_BONUS);
            goodCount++;
            
            // エフェクト表示
            showHitEffect('GOOD!', '#ffcc00', closestNote.x);
            debugLog(`グッド! 時間差=${(minTimeDiff * 1000).toFixed(0)}ms`);
        }
        
        // スコア表示更新
        updateScoreDisplay();
        
        // ヒットエリア強調表示
        const hitArea = document.getElementById('hit-area');
        hitArea.classList.add('pulse');
        setTimeout(() => {
            hitArea.classList.remove('pulse');
        }, 200);
    } else {
        // 近くにノーツがない、またはタイミングが合わない
        comboCount = 0;
        showHitEffect('MISS!', '#ff0000', 0.5);
        updateScoreDisplay();
        debugLog('ミス! 付近にノーツなし');
    }
}

// ミス処理
function handleMiss() {
    comboCount = 0;
    missCount++;
    updateScoreDisplay();
}

// ヒットエフェクト表示
function showHitEffect(text, color, xPos) {
    const gameContainer = document.getElementById('game-container');
    const hitAreaY = gameContainer.offsetHeight * 0.85;
    
    // エフェクト要素作成
    const effect = document.createElement('div');
    effect.textContent = text;
    effect.style.left = `${xPos * 100}%`;
    effect.style.top = `${hitAreaY}px`;
    effect.style.color = color;
    
    // クラス設定
    if (text === 'PERFECT!') {
        effect.className = 'hit-perfect';
    } else if (text === 'GOOD!') {
        effect.className = 'hit-good';
    } else {
        effect.className = 'hit-miss';
    }
    
    // DOMに追加
    gameContainer.appendChild(effect);
    
    // 一定時間後に削除
    setTimeout(() => {
        gameContainer.removeChild(effect);
    }, 1000);
}

// スコア表示更新
function updateScoreDisplay() {
    document.getElementById('current-score').textContent = currentScore;
    document.getElementById('combo-count').textContent = comboCount;
}

// ポーズ切り替え
function togglePause() {
    if (!gameStarted) return;
    
    isPaused = !isPaused;
    
    if (isPaused) {
        // ★stop()ではなくAudioContextを一時停止
        audioContext.suspend();
        document.getElementById('pause-screen').classList.add('active');
    } else {
        // ゲームを再開
        resumeGame();
    }
}

// ゲーム再開
function resumeGame() {
    if (!isPaused) return;
    
    // ポーズ画面を非表示
    document.getElementById('pause-screen').classList.remove('active');
    
    // AudioContextを再開するだけ
    audioContext.resume();
    
    // ポーズ状態解除
    isPaused = false;
}

// 特定位置から音楽再生
function playMusicFromPosition(position) {
    if (audioSource) {
        try {
            audioSource.stop();
        } catch (e) {
            console.log('Warning: Could not stop previous audio source', e);
        }
    }
    
    // AudioContextが停止している場合は再開
    if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            console.log('AudioContext resumed from suspended state');
        }).catch(err => {
            console.error('Failed to resume AudioContext:', err);
        });
    }
    
    try {
        audioSource = audioContext.createBufferSource();
        audioSource.buffer = audioBuffer;
        
        // 音量ノードを追加
        volumeNode = audioContext.createGain();
        volumeNode.gain.value = gameVolume;
        
        // 接続を変更
        audioSource.connect(volumeNode);
        volumeNode.connect(analyser);
        analyser.connect(audioContext.destination);
        
        // 特定位置から再生
        audioSource.start(0, position);
        audioSource.onended = endGame;
        
        // 開始時間を調整
        startTime = audioContext.currentTime - position;
        
        if (DEBUG_MODE) {
            console.log(`音楽再生開始: 位置=${position}秒, 残り時間=${audioBuffer.duration - position}秒`);
        }
    } catch (error) {
        console.error('音楽再生エラー:', error);
        alert('音楽の再生中にエラーが発生しました。ページを再読み込みしてください。');
    }
}

// ゲームリスタート
function restartGame() {
    // 現在のゲームを終了
    if (gameLoop) {
        clearInterval(gameLoop);
    }
    if (audioSource) {
        audioSource.onended = null; // コールバック解除
        audioSource.stop();
        audioSource = null;
    }
    
    // ★重要な修正：ノーツを再生成
    notes = [];
    analyzeMusic(); // 同じ曲でも再解析してノーツを新規作成
    
    // 画面切り替え
    document.getElementById('pause-screen').classList.remove('active');
    document.getElementById('result-screen').classList.remove('active');
    
    // ゲーム開始
    startGame();
}

// ゲーム終了
function endGame() {
    if (!gameStarted) return;
    
    debugLog('ゲーム終了');
    
    // 現在のゲームを終了
    if (gameLoop) {
        clearInterval(gameLoop);
        gameLoop = null;
    }
    
    // 音源停止 - onendedを必ず解除してから
    if (audioSource) {
        try {
            audioSource.onended = null; // ★コールバック解除を追加
            audioSource.stop();
            audioSource = null;
        } catch (e) {
            debugLog(`音源停止エラー: ${e.message}`);
        }
    }
    
    // ゲーム状態リセット
    gameStarted = false;
    isPlaying = false;
    
    // 残りのノーツをチェック（全て「missed」に）
    notes.forEach(note => {
        if (note.status === 'waiting') {
            note.status = 'missed';
            missCount++;
        }
    });
    
    // 結果表示
    showResults();
}

// ゲーム終了/ホームに戻る
function quitGame() {
    debugLog('ゲーム終了しホームに戻ります');
    
    // 現在のゲームを終了
    if (gameLoop) {
        clearInterval(gameLoop);
        gameLoop = null;
    }
    
    // 音源停止 - onendedを必ず解除してから
    if (audioSource) {
        try {
            audioSource.onended = null; // ★コールバック解除を追加
            audioSource.stop();
            audioSource = null;
        } catch (e) {
            debugLog(`音源停止エラー: ${e.message}`);
        }
    }
    
    // 画面切り替え
    document.getElementById('pause-screen').classList.remove('active');
    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('start-screen').classList.add('active');
    
    // ゲーム状態リセット
    gameStarted = false;
    isPlaying = false;
    
    // デバッグオーバーレイをクリア
    if (DEBUG_MODE) {
        const debugText = document.getElementById('debug-text');
        if (debugText) {
            debugText.textContent = '';
        }
    }
}

// ホームに戻る
function goToHome() {
    debugLog('ホームに戻ります');
    
    // 音源停止 - onendedを必ず解除してから
    if (audioSource) {
        try {
            audioSource.onended = null; // ★コールバック解除を追加
            audioSource.stop();
            audioSource = null;
        } catch (e) {
            debugLog(`音源停止エラー: ${e.message}`);
        }
    }
    
    document.getElementById('result-screen').classList.remove('active');
    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('start-screen').classList.add('active');
    
    // ゲーム状態リセット
    gameStarted = false;
    isPlaying = false;
    
    // デバッグオーバーレイをクリア
    if (DEBUG_MODE) {
        const debugText = document.getElementById('debug-text');
        if (debugText) {
            debugText.textContent = '';
        }
    }
}

// 結果表示
function showResults() {
    // リザルト画面要素を取得
    const resultScreen = document.getElementById('result-screen');
    const finalScore = document.getElementById('final-score');
    const maxComboElement = document.getElementById('max-combo');
    const perfectCountElement = document.getElementById('perfect-count');
    const goodCountElement = document.getElementById('good-count');
    const missCountElement = document.getElementById('miss-count');
    const gradeElement = document.getElementById('result-grade');
    
    // 値を設定
    finalScore.textContent = currentScore;
    maxComboElement.textContent = maxCombo;
    perfectCountElement.textContent = perfectCount;
    goodCountElement.textContent = goodCount;
    missCountElement.textContent = missCount;
    
    // グレード計算
    const totalNotes = perfectCount + goodCount + missCount;
    const accuracy = totalNotes > 0 ? (perfectCount + goodCount * 0.5) / totalNotes : 0;
    
    let grade;
    if (accuracy >= 0.95) grade = 'S';
    else if (accuracy >= 0.9) grade = 'A';
    else if (accuracy >= 0.8) grade = 'B';
    else if (accuracy >= 0.7) grade = 'C';
    else if (accuracy >= 0.6) grade = 'D';
    else grade = 'F';
    
    gradeElement.textContent = grade;
    
    // リザルト画面表示
    resultScreen.classList.add('active');
}