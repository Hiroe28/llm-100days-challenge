/**
 * NeuronSymphony - メインアプリケーション
 */
document.addEventListener('DOMContentLoaded', () => {
    // キャンバスの設定
    const canvas = document.getElementById('neuronCanvas');
    const ctx = canvas.getContext('2d');
    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    
    // 高解像度ディスプレイ対応
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    
    // UI要素
    const clearBtn = document.getElementById('clearBtn');
    const saveBtn = document.getElementById('saveBtn');
    const audioToggle = document.getElementById('audioToggle');
    const colorTheme = document.getElementById('colorTheme');
    const infoPanel = document.querySelector('.info-panel');
    const panelToggle = document.querySelector('.panel-toggle');
    const panelContent = document.querySelector('.panel-content');
    
    const autoPlayBtn = document.getElementById('autoPlayBtn');
    let autoPlaying = false;

    const recordBtn = document.getElementById('recordBtn');
    let isRecording = false;
    let visualEffect = null;

    

    autoPlayBtn.addEventListener('click', () => {
        if (!autoPlaying) {
            // ニューロンが少なすぎる場合、自動的に追加
            if (neurons.length < 10) {
                const additionalCount = 20;
                createRandomNeurons(additionalCount);
            }
            
            // ニューロン配列を音楽システムに渡す
            soundSystem.setActiveNeurons(neurons);
            soundSystem.startAutoArranger(neurons);
            autoPlayBtn.textContent = '⏹ 停止';
            
            // 定期的に一部のニューロンを光らせる効果を追加（自動演奏視覚効果の強化）
            if (!visualEffect) {
                visualEffect = setInterval(() => {
                    if (neurons.length > 0 && !isPaused) {
                        // ランダムなニューロンを選択
                        const randomNeuron = neurons[Math.floor(Math.random() * neurons.length)];
                        // 一定確率でランダムにニューロンを光らせる（視覚的なアクセント）
                        if (Math.random() < 0.3) {
                            randomNeuron.fire();
                        }
                    }
                }, 800); // 800ミリ秒ごと
            }
        } else {
            soundSystem.stopAutoArranger();
            autoPlayBtn.textContent = '🎼 自動演奏';
            
            // 視覚エフェクトも停止
            if (visualEffect) {
                clearInterval(visualEffect);
                visualEffect = null;
            }
        }
        autoPlaying = !autoPlaying;
    });

    // 録音ボタンのイベントリスナー
    recordBtn.addEventListener('click', () => {
        if (!isRecording) {
            // 録音開始
            if (soundSystem.startRecording()) {
                recordBtn.textContent = '⏹ 録音停止';
                recordBtn.classList.add('recording');
                
                // 録音中は自動演奏を有効にする（まだ有効でない場合）
                if (!autoPlaying) {
                    autoPlayBtn.click(); // 自動演奏ボタンをクリック
                }
            } else {
                alert('録音機能を開始できませんでした。ブラウザがMediaRecorder APIをサポートしていない可能性があります。');
            }
        } else {
            // 録音停止
            soundSystem.stopRecording();
            recordBtn.textContent = '🔴 録音';
            recordBtn.classList.remove('recording');
        }
        isRecording = !isRecording;
    });


    // アプリケーション状態
    let neurons = [];
    let lastClickTime = 0;
    let colorThemeValue = 'neon';
    let gravity = { x: 0, y: 0 };
    let isPaused = false;
    
    // サウンドシステムの初期化
    const soundSystem = new NeuronSoundSystem();
    let audioEnabled = soundSystem.enabled;
    updateAudioButtonState();
    
    // ランダムな位置にニューロンを生成
    function createRandomNeurons(count) {
        for (let i = 0; i < count; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            neurons.push(new Neuron(x, y, canvas, colorThemeValue));
        }
        
        // ニューロンの接続を自動生成
        neurons.forEach(neuron => {
            neuron.autoConnect(neurons);
        });
        
        return neurons;
    }
    
    // ニューロンを追加
    function addNeuron(x, y) {
        const newNeuron = new Neuron(x, y, canvas, colorThemeValue);
        neurons.push(newNeuron);
        newNeuron.autoConnect(neurons);
        
        // 近くのニューロンも接続関係を更新
        neurons.forEach(neuron => {
            if (neuron !== newNeuron) {
                const dx = neuron.x - newNeuron.x;
                const dy = neuron.y - newNeuron.y;
                const distance = Math.sqrt(dx*dx + dy*dy);
                
                if (distance < 150) {
                    // 既存のニューロンから新しいニューロンへの接続を低確率で作成
                    if (Math.random() < 0.3) {
                        neuron.connectTo(newNeuron);
                    }
                }
            }
        });
        
        return newNeuron;
    }
    
    // ニューロン発火
    function fireNeuron(x, y) {
        // クリック位置に近いニューロンを探す
        let closestNeuron = null;
        let minDistance = 50; // 最大検出距離
        
        for (const neuron of neurons) {
            const dx = neuron.x - x;
            const dy = neuron.y - y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            if (distance < minDistance) {
                closestNeuron = neuron;
                minDistance = distance;
            }
        }
        
        // 近くにニューロンがなければ新しく作成
        if (!closestNeuron) {
            closestNeuron = addNeuron(x, y);
        }
        
        // ニューロンを発火させる
        const neuronData = closestNeuron.fire();
        
        // 音を再生
        if (audioEnabled && soundSystem.enabled) {
            soundSystem.playNeuronSound({
                ...neuronData,
                canvasWidth: width,
                canvasHeight: height
            });
        }
        
        return closestNeuron;
    }
    
    // 描画ループ
    function animate() {
        if (!isPaused) {
            // 背景クリア
            ctx.fillStyle = 'rgba(18, 18, 18, 0.1)';
            ctx.fillRect(0, 0, width, height);
            
            // ニューロンの更新と描画
            const now = performance.now();
            const deltaTime = now - lastUpdate;
            lastUpdate = now;
            
            for (const neuron of neurons) {
                neuron.update(deltaTime);
                
                // 重力の適用
                if (gravity.x !== 0 || gravity.y !== 0) {
                    neuron.applyGravity(gravity);
                }
            }
            
            // ニューロン同士の衝突判定
            for (let i = 0; i < neurons.length; i++) {
                for (let j = i + 1; j < neurons.length; j++) {
                    neurons[i].checkCollision(neurons[j]);
                }
            }
            
            // ニューロンの描画（接続線を先に描く）
            for (const neuron of neurons) {
                neuron.draw();
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    // オーディオ状態の更新
    function updateAudioButtonState() {
        audioToggle.textContent = audioEnabled ? '🔊' : '🔇';
    }
    
    // テーマ変更時の処理
    function updateColorTheme() {
        colorThemeValue = colorTheme.value;
        neurons.forEach(neuron => {
            neuron.setColorTheme(colorThemeValue);
        });
    }
    
    // リサイズハンドラ
    function handleResize() {
        width = canvas.clientWidth;
        height = canvas.clientHeight;
        
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
    }
    
    // 画像として保存
    function saveAsImage() {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'neuron-symphony-' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.png';
        link.href = dataUrl;
        link.click();
    }

    // イベントリスナーの設定
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / (rect.right - rect.left) * width;
        const y = (e.clientY - rect.top) / (rect.bottom - rect.top) * height;
        
        const now = performance.now();
        if (now - lastClickTime < 300) {
            // ダブルクリック - 複数のニューロンを追加
            for (let i = 0; i < 5; i++) {
                const offsetX = x + (Math.random() - 0.5) * 100;
                const offsetY = y + (Math.random() - 0.5) * 100;
                addNeuron(offsetX, offsetY);
            }
        } else {
            // シングルクリック - 単一のニューロン発火
            fireNeuron(x, y);
        }
        
        lastClickTime = now;
    });
    
    // タッチイベント（モバイル対応）
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = (touch.clientX - rect.left) / (rect.right - rect.left) * width;
        const y = (touch.clientY - rect.top) / (rect.bottom - rect.top) * height;
        
        fireNeuron(x, y);
    });
    
    // ボタンイベントリスナー
    clearBtn.addEventListener('click', () => {
        neurons = [];
        ctx.clearRect(0, 0, width, height);
    });
    
    saveBtn.addEventListener('click', saveAsImage);
    
    audioToggle.addEventListener('click', () => {
        audioEnabled = soundSystem.toggleAudio();
        updateAudioButtonState();
    });
    
    colorTheme.addEventListener('change', updateColorTheme);
    
    // スマートフォンの傾き検出（重力効果）
    window.addEventListener('deviceorientation', (e) => {
        if (e.beta && e.gamma) {
            // 傾きを重力に変換（最大値を制限）
            const betaRad = (e.beta * Math.PI) / 180;
            const gammaRad = (e.gamma * Math.PI) / 180;
            
            gravity.x = Math.sin(gammaRad) * 0.0005;
            gravity.y = Math.sin(betaRad) * 0.0005;
        }
    });
    
    // ウィンドウリサイズイベント
    window.addEventListener('resize', handleResize);
    
    // パネルトグル
    panelToggle.addEventListener('click', () => {
        if (panelContent.style.display === 'block') {
            panelContent.style.display = 'none';
            panelToggle.textContent = 'ⓘ 詳細を表示';
        } else {
            panelContent.style.display = 'block';
            panelToggle.textContent = 'ⓘ 詳細を隠す';
        }
    });
    
    // 初期化処理
    let lastUpdate = performance.now();
    createRandomNeurons(50);  // 初期ニューロンを配置
    animate();  // アニメーションを開始
    
    // オーディオコンテキストの開始（ユーザーインタラクション）
    canvas.addEventListener('click', () => {
        if (soundSystem.audioContext.state === 'suspended') {
            soundSystem.audioContext.resume();
        }
    }, { once: true });
});