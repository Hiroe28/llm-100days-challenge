// main.js - メインの初期化とアプリケーションの起動

// --- 初期化 ---
function init() {
  try {
    // UI要素の参照を取得
    setupUIElements();
    
    // PolySynthの作成 - 音質向上のため設定を調整
    synth = new Tone.PolySynth(Tone.AMSynth).toDestination();
    
    // 音質向上のためのシンセ設定
    setupImprovedSynth();
    
    // 五線譜クリックイベント
    setupStaffClickEvents();
    
    // ドラッグ機能のイベント設定
    setupDragEvents();
    
    // スタートボタンにイベントリスナーを追加
    startButton.addEventListener('click', startApp);
    
    // レスポンシブ対応の初期化
    setupResponsive();
  } catch (error) {
    console.error('初期化エラー:', error);
    loadingDiv.innerHTML = '<p>エラーが発生しました。ページを再読み込みしてください。</p>';
  }
}

// --- 音質を向上させたシンセ設定 ---
function setupImprovedSynth() {
  // AMSynthを使用
  synth.set({
    harmonicity: 2,
    detune: 0,
    oscillator: {
      type: "sine"  // よりソフトな音色
    },
    envelope: {
      attack: 0.01,     // 素早い立ち上がり（元に近い）
      decay: 0.1,
      sustain: 0.8,     // 持続音を強く
      release: 0.3      // リリースはやや短め
    }
  });
  
  // 音量は元のレベルに戻す（設定なし）
  synth.volume.value = 0; // デフォルト値
  
  // 最大同時発音数を制限
  synth.maxPolyphony = 8;
  
  // オーディオコンテキストの設定
  Tone.context.latencyHint = "balanced";
}

// --- レスポンシブ対応の設定 ---
function setupResponsive() {
  // モバイルデバイスの確認
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // タップハイライトを無効化
    document.addEventListener('click', function(e) {
      if (e.target.classList.contains('staff') || 
          e.target.classList.contains('note') || 
          e.target.classList.contains('button')) {
        e.preventDefault();
      }
    }, { passive: false });
    
    // ボタンテキストをモバイル向けに調整
    window.addEventListener('load', function() {
      if (window.innerWidth <= 480) {
        // スマホ向けに短いテキスト
        if (playButton) playButton.textContent = '▶ 再生';
        if (clearButton) clearButton.textContent = '✖ 消す';
        if (loopButton) loopButton.textContent = '🔄 くり返し';
        if (saveButton) saveButton.textContent = '💾 保存';
        if (loadButton) loadButton.textContent = '📂 開く';
      }
    });
  }
  
  // リサイズ時のプレイヘッド調整
  window.addEventListener('resize', function() {
    if (typeof adjustPlayheadHeight === 'function') {
      adjustPlayheadHeight();
    }
  });
}

// --- アプリ開始 ---
async function startApp() {
  try {
    // AudioContext開始
    await Tone.start();
    console.log('オーディオコンテキスト開始');
    
    // ローディング画面を消す
    loadingDiv.style.display = 'none';
    
    // ボタンにイベント登録
    setupButtonEvents();
    
    // 保存・読み込み機能をセットアップ
    setupSaveLoadFeatures();
    
  } catch (error) {
    console.error('アプリ開始エラー:', error);
    loadingDiv.innerHTML = '<p>オーディオの起動に失敗しました。ページを再読み込みしてください。</p>';
  }
}

// ページ読み込み時
window.onload = init;