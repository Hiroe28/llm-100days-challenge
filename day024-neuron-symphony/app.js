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

    let lastClickProcessed = false;
    let lastTouchProcessed = false;

    const volumeSlider = document.getElementById('volumeSlider');
    // 初期音量の設定 (デフォルト30%に下げる)
    volumeSlider.value = 30;
    
    
    // 音量スライダーのイベントリスナー
    volumeSlider.addEventListener('input', () => {
        const volumeValue = volumeSlider.value;
        
        if (soundSystem) {
            soundSystem.setMasterVolume(volumeValue);
            
            // 音量が0の場合、ミュートボタンの表示を変更
            if (volumeValue == 0) {
                audioToggle.textContent = '🔇';
                audioEnabled = false;
            } else if (volumeValue > 0 && !audioEnabled) {
                audioToggle.textContent = '🔊';
                audioEnabled = true;
            }
        }
    });

    // 音声トグルボタンのイベントリスナーを修正
    audioToggle.addEventListener('click', () => {
        audioEnabled = !audioEnabled;
        
        if (audioEnabled) {
            // ミュート解除時は現在のスライダー値を適用
            soundSystem.setMasterVolume(volumeSlider.value);
            audioToggle.textContent = '🔊';
        } else {
            // ミュート時は音量を0に（スライダー位置は変更しない）
            soundSystem.setMasterVolume(0);
            audioToggle.textContent = '🔇';
        }
        
        soundSystem.enabled = audioEnabled;
    });


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
    let lastTouchTime = 0; // この行を追加
    let colorThemeValue = 'neon';
    let gravity = { x: 0, y: 0 };
    let isPaused = false;
    
    // サウンドシステムの初期化
    const soundSystem = new NeuronSoundSystem();
    let audioEnabled = soundSystem.enabled;
    updateAudioButtonState();

    // オーディオ初期化の関数
    function initAudio() {
        if (soundSystem.audioContext.state === 'suspended') {
            soundSystem.audioContext.resume().then(() => {
                console.log('AudioContext resumed successfully');
            }).catch(err => {
                console.error('Failed to resume AudioContext:', err);
            });
        }
    }

    // 音声コンテキスト初期化のためのイベントリスナー（複数のインタラクションに対応）
    function setupAudioContextEvents() {
        // 画面への最初のタッチ/クリックで音声を有効化
        const interactionEvents = ['click', 'touchstart', 'touchend', 'mousedown', 'keydown'];
        
        const unlockAudio = function() {
            initAudio();
            
            // 成功したら全てのイベントリスナーを削除
            interactionEvents.forEach(function(event) {
                document.removeEventListener(event, unlockAudio);
            });
            
            // デバッグ用メッセージ
            console.log('Audio initialized by user interaction');
        };
        
        // 各種イベントにリスナーを追加
        interactionEvents.forEach(function(event) {
            document.addEventListener(event, unlockAudio, { once: false });
        });
        
        // iOS Safariでのオーディオ対策（特別対応）
        document.addEventListener('touchstart', function() {
            // iOSで空のバッファを再生すると、以降の音声再生が許可される
            const silentBuffer = soundSystem.audioContext.createBuffer(1, 1, 22050);
            const source = soundSystem.audioContext.createBufferSource();
            source.buffer = silentBuffer;
            source.connect(soundSystem.audioContext.destination);
            source.start(0);
            console.log('iOS silent buffer played');
        }, { once: true });
    }

    // 初期化処理の実行
    setupAudioContextEvents();

    // 音声ボタンのクリックでも確実に初期化
    audioToggle.addEventListener('click', initAudio);

    // 自動演奏ボタンのクリック時にも初期化を試みる
    autoPlayBtn.addEventListener('click', initAudio);

    // モバイルデバイスかどうかを検出する関数
    function isMobileDevice() {
        return (
            typeof window.orientation !== 'undefined' ||
            navigator.userAgent.indexOf('IEMobile') !== -1 ||
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        );
    }

    // モバイルデバイスの場合、特別な初期化メッセージを表示
    if (isMobileDevice()) {
        // 初期化用のメッセージ要素を作成
        const audioInitMsg = document.createElement('div');
        audioInitMsg.className = 'audio-init-message';
        audioInitMsg.innerHTML = `
            <div class="message-content">
                <p>🔊 画面をタップして音を有効にしてください</p>
                <button class="activate-audio-btn">音を有効にする</button>
            </div>
        `;
        
        document.body.appendChild(audioInitMsg);
        
        // メッセージボタンのクリックで音声初期化
        const activateBtn = document.querySelector('.activate-audio-btn');
        activateBtn.addEventListener('click', function() {
            initAudio();
            audioInitMsg.style.opacity = '0';
            setTimeout(() => {
                audioInitMsg.style.display = 'none';
            }, 500);
        });
        
        // 音声が有効になったら非表示に
        document.addEventListener('click', function checkAudioState() {
            if (soundSystem.audioContext.state === 'running') {
                audioInitMsg.style.opacity = '0';
                setTimeout(() => {
                    audioInitMsg.style.display = 'none';
                }, 500);
                document.removeEventListener('click', checkAudioState);
            }
        });
    }

    
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
        
        // ダブルクリック判定の時間を延長（300msから500msに）
        // また、明示的なダブルクリックの場合のみ複数ニューロンを追加
        if (now - lastClickTime < 500 && now - lastClickTime > 50) {
            // ダブルクリック - 複数のニューロンを追加
            // ニューロン数を減らす（5個から3個に）
            for (let i = 0; i < 3; i++) {
                const offsetX = x + (Math.random() - 0.5) * 100;
                const offsetY = y + (Math.random() - 0.5) * 100;
                addNeuron(offsetX, offsetY);
            }
            
            // シングルクリックイベントとしても処理されないようフラグを設定
            lastClickProcessed = true;
            
            console.log("ダブルクリック: 3つのニューロンを追加");
        } else if (!lastClickProcessed) {
            // シングルクリック - 単一のニューロン発火/追加
            fireNeuron(x, y);
            console.log("シングルクリック: 1つのニューロンを追加/発火");
        }
        
        // フラグをリセット
        lastClickProcessed = false;
        lastClickTime = now;
    });

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = (touch.clientX - rect.left) / (rect.right - rect.left) * width;
        const y = (touch.clientY - rect.top) / (rect.bottom - rect.top) * height;
        
        const now = performance.now();
        
        // 短時間での連続タップを検出（ダブルタップに相当）
        if (now - lastTouchTime < 500 && now - lastTouchTime > 50) {
            // 複数のニューロンを追加
            for (let i = 0; i < 3; i++) {
                const offsetX = x + (Math.random() - 0.5) * 100;
                const offsetY = y + (Math.random() - 0.5) * 100;
                addNeuron(offsetX, offsetY);
            }
            lastTouchProcessed = true;
        } else if (!lastTouchProcessed) {
            // 単一ニューロン
            fireNeuron(x, y);
        }
        
        lastTouchProcessed = false;
        lastTouchTime = now;
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