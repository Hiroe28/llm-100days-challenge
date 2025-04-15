/**
 * アトミックプレイグラウンド - メインアプリケーション
 */
document.addEventListener('DOMContentLoaded', () => {
    // キャンバスの設定
    const canvas = document.getElementById('atomCanvas');
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
    const simulationMode = document.getElementById('simulationMode');
    const simulationToggle = document.getElementById('simulationToggle');
    const elementButtons = document.querySelectorAll('.element-btn');
    const selectedElementInfo = document.getElementById('selectedElementInfo');
    const moleculeInfo = document.getElementById('moleculeInfo');
    const infoPanel = document.querySelector('.info-panel');
    const panelToggle = document.querySelector('.panel-toggle');
    const panelContent = document.querySelector('.panel-content');
    const volumeSlider = document.getElementById('volumeSlider');
    
    // アプリケーション状態
    let atoms = [];
    let selectedElement = 'H'; // デフォルトは水素
    let lastClickTime = 0;
    let lastTouchTime = 0;
    let gravity = { x: 0, y: 0 };
    let isPaused = false;
    let temperature = 0; // 熱エネルギー（0-100）
    let displayedMoleculeId = null; // 現在表示中の分子ID
    
    // ドラッグ関連の状態
    let isDragging = false;
    let draggedAtom = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    // サウンドシステムの初期化
    const soundSystem = new MoleculeSoundSystem();
    let audioEnabled = soundSystem.enabled;
    updateAudioButtonState();
    
    // 分子検出システムの初期化
    const moleculeDetector = new MoleculeDetector();
        
    // メッセージスタイルをDOMに追加
    const messageStyle = document.createElement('style');
    messageStyle.textContent = `
        .app-message {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(46, 204, 113, 0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            font-weight: bold;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
            transition: opacity 0.5s ease;
        }
        
        .app-message.error {
            background: rgba(231, 76, 60, 0.9);
        }
        
        .app-message.warning {
            background: rgba(241, 196, 15, 0.9);
        }
        
        .app-message.fade-out {
            opacity: 0;
        }
    `;
    document.head.appendChild(messageStyle);

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

    // オーディオ初期化のためのイベントリスナー
    function setupAudioContextEvents() {
        // 画面への最初のタッチ/クリックで音声を有効化
        const interactionEvents = ['click', 'touchstart', 'touchend', 'mousedown', 'keydown'];
        
        const unlockAudio = function() {
            initAudio();
            
            // 成功したら全てのイベントリスナーを削除
            interactionEvents.forEach(function(event) {
                document.removeEventListener(event, unlockAudio);
            });
            
            console.log('Audio initialized by user interaction');
        };
        
        // 各種イベントにリスナーを追加
        interactionEvents.forEach(function(event) {
            document.addEventListener(event, unlockAudio, { once: false });
        });
        
        // iOS Safariでのオーディオ対策
        document.addEventListener('touchstart', function() {
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
    
    // 分子検出の強制更新関数を追加
    function forceUpdateMolecules() {
        const newMolecules = moleculeDetector.detectMolecules(atoms, true);
        if (newMolecules.length > 0) {
            console.log("分子検出更新:", newMolecules.map(m => m.formula));
            handleNewMolecules(newMolecules);
        }
    }

    // 原子を追加
    function addAtom(x, y, element = selectedElement) {
        // NaNチェック
        if (isNaN(x) || isNaN(y)) {
            console.error(`無効な座標: (${x}, ${y})`);
            return null;
        }
        
        // 画面外の場合は追加しない
        if (x < 0 || x > width || y < 0 || y > height) return null;
        
        try {
            const newAtom = new Atom(x, y, element, canvas);
            
            // 原子生成の成否をチェック
            if (!newAtom || !newAtom.isValidPosition()) {
                console.error(`無効な原子が生成されました: element=${element}, x=${x}, y=${y}`);
                return null;
            }
            
            atoms.push(newAtom);
            
            // 新しい原子の音を再生
            if (audioEnabled) {
                soundSystem.playEventSound('atomCreated', {
                    pitchFactor: x / width,
                    velocityFactor: 0.5 + Math.random() * 0.3
                });
            }
            
            try {
                // 近くの原子との結合を試みる
                const bondedAtoms = newAtom.tryBondWithNearbyAtoms(atoms);
                
                // 結合音を再生
                if (audioEnabled && bondedAtoms.length > 0) {
                    soundSystem.playEventSound('bond', {
                        pitchFactor: 0.3 + Math.random() * 0.4,
                        velocityFactor: 0.6 + Math.random() * 0.3
                    });
                }
            } catch (error) {
                console.error(`原子結合の処理中にエラー: ${error.message}`);
            }
            // 新しい原子が追加された後、分子検出を強制更新
            setTimeout(forceUpdateMolecules, 100);
            
            return newAtom;
        } catch (error) {
            console.error(`原子の生成中にエラー: ${error.message}`);
            return null;
        }
    }
    
    // 原子群をランダムに生成
    function createRandomAtoms(count, elements = ['H', 'O', 'C', 'N', 'Cl']) {
        for (let i = 0; i < count; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const element = elements[Math.floor(Math.random() * elements.length)];
            addAtom(x, y, element);
        }
    }
    
    // マウスクリック処理
    function handleClick(x, y) {
        const now = performance.now();
        
        // if (now - lastClickTime < 300) {
        //     // 複数の原子を追加
        //     for (let i = 0; i < 3; i++) {
        //         const offsetX = x + (Math.random() - 0.5) * 80;
        //         const offsetY = y + (Math.random() - 0.5) * 80;
        //         addAtom(offsetX, offsetY);
        //     }
        // } else {
        // 単一の原子を追加
        addAtom(x, y);
        // }
        
        lastClickTime = now;
    }
    
    // 新しい分子の検出時の処理
    function handleNewMolecules(molecules) {
        molecules.forEach(molecule => {
            if (molecule.isRecognized) {
                // 分子認識音を再生
                if (audioEnabled) {
                    soundSystem.playMoleculeRecognizedSound(molecule);
                }
                
                // 分子情報を表示
                displayMoleculeInfo(molecule);
                
                // 分子内の各原子をハイライト
                molecule.atoms.forEach(atom => {
                    atom.highlight();
                });
                
                // 視覚効果：分子情報パネルをフラッシュ
                const moleculeDisplay = document.querySelector('.molecule-display');
                moleculeDisplay.classList.remove('molecule-flash');
                void moleculeDisplay.offsetWidth; // リフロー強制
                moleculeDisplay.classList.add('molecule-flash');
                
                console.log(`分子を検出: ${molecule.name} (${molecule.formula})`);
            }
        });
    }
    
    // 分子情報の表示
    function displayMoleculeInfo(molecule) {
        if (!molecule) {
            moleculeInfo.innerHTML = '<p>分子を作ってみよう！</p>';
            displayedMoleculeId = null;
            return;
        }
        
        // 分子IDの確認を強化
        console.log("分子表示: ID=" + molecule.id + ", 式=" + molecule.formula);
        
        // 同じ分子が既に表示されている場合はスキップ
        if (displayedMoleculeId === molecule.id) return;
        
        // HTML情報を取得して表示
        moleculeInfo.innerHTML = '';
        moleculeInfo.appendChild(molecule.getInfoHTML());
        displayedMoleculeId = molecule.id;
        
        // 表示確認ログ
        console.log("分子情報を表示しました: " + molecule.formula);
    }
        
    // UIの元素選択ボタンの更新
    function updateElementButtons() {
        elementButtons.forEach(btn => {
            const btnElement = btn.getAttribute('data-element');
            if (btnElement === selectedElement) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // 選択中の元素情報を表示
        const element = PeriodicTable.getElement(selectedElement);
        if (element) {
            selectedElementInfo.innerHTML = `
                <h3>${element.name} (${selectedElement})</h3>
                <p>原子番号: ${element.atomicNumber} | 質量: ${element.atomicMass}</p>
                <p>電子配置: ${element.electronConfiguration}</p>
            `;
        }
    }
    
    // オーディオ状態の更新
    function updateAudioButtonState() {
        audioToggle.textContent = audioEnabled ? '🔊' : '🔇';
    }
    
    // 描画ループ
    function animate() {
        try {
            if (!isPaused) {
                // 背景クリア
                ctx.fillStyle = 'rgba(28, 40, 51, 0.3)';
                ctx.fillRect(0, 0, width, height);
                
                // 原子の更新と描画
                const now = performance.now();
                const deltaTime = now - lastUpdate;
                lastUpdate = now;
                
                // シミュレーションモードの取得
                const currentMode = simulationMode.value;
                let currentTemperature = 0;
                
                if (currentMode === 'heat') {
                    currentTemperature = 50; // 熱運動モード
                }
                
                // 原子の更新
                for (let i = atoms.length - 1; i >= 0; i--) {
                    const atom = atoms[i];
                    
                    // 無効な原子を除去
                    if (!atom || (isNaN(atom.x) || isNaN(atom.y))) {
                        console.warn(`無効な原子を検出: インデックス=${i} - 除去します`);
                        atoms.splice(i, 1);
                        continue;
                    }
                    
                    try {
                        atom.update(deltaTime, currentTemperature);
                    } catch (error) {
                        console.error(`原子の更新中にエラー: ${error.message}`);
                        // エラーが発生した原子を除去
                        atoms.splice(i, 1);
                        continue;
                    }
                    
                    // 重力の適用（重力モード時）
                    if (currentMode === 'gravity') {
                        atom.applyGravity({ x: 0, y: 0.01 }); // 下向きの重力
                    } else if (gravity.x !== 0 || gravity.y !== 0) {
                        // モバイルの傾きによる重力の適用
                        atom.applyGravity(gravity);
                    }
                }
                
                // 衝突判定と反発
                for (let i = 0; i < atoms.length; i++) {
                    for (let j = i + 1; j < atoms.length; j++) {
                        try {
                            atoms[i].checkCollision(atoms[j]);
                        } catch (error) {
                            console.error(`衝突判定中にエラー: ${error.message}`);
                        }
                    }
                }
                
                // 定期的に分子検出を実行
                try {
                    const newMolecules = moleculeDetector.detectMolecules(atoms);
                    if (newMolecules.length > 0) {
                        handleNewMolecules(newMolecules);
                    }
                } catch (error) {
                    console.error(`分子検出中にエラー: ${error.message}`);
                }
                
                // 原子の描画
                for (let i = 0; i < atoms.length; i++) {
                    try {
                        atoms[i].draw();
                    } catch (error) {
                        console.error(`原子の描画中にエラー: ${error.message}`);
                    }
                }
            }
        } catch (error) {
            console.error(`アニメーションループでエラー: ${error.message}`);
        }
        
        requestAnimationFrame(animate);
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
        link.download = 'atomic-playground-' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.png';
        link.href = dataUrl;
        link.click();
    }

    // キャンバスをクリア
    function clearCanvas() {
        atoms = [];
        
        // 分子検出システムをリセット
        if (moleculeDetector) {
            moleculeDetector.molecules.clear();
        }
        
        // 分子情報表示をクリア
        displayMoleculeInfo(null);
        
        // キャンバスをクリア
        if (ctx) {
            ctx.clearRect(0, 0, width, height);
        }
        
        console.log("キャンバスとデータをクリアしました");
    }

    // メッセージ表示関数
    function showMessage(message, type = 'info') {
        // 既存のメッセージがあれば削除
        const existingMessage = document.getElementById('appMessage');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // メッセージ要素を作成
        const messageElement = document.createElement('div');
        messageElement.id = 'appMessage';
        messageElement.className = `app-message ${type}`;
        messageElement.textContent = message;
        
        // ボディに追加
        document.body.appendChild(messageElement);
        
        // 3秒後に自動的に消える
        setTimeout(() => {
            messageElement.classList.add('fade-out');
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.parentNode.removeChild(messageElement);
                }
            }, 500);
        }, 3000);
    }
    
    // イベントリスナーの設定
    
    // キャンバスクリックイベント
    let lastMouseUpTime = 0;
    canvas.addEventListener('click', (e) => {
        // ドラッグ後のクリックイベントを防止
        if (isDragging || Date.now() - lastMouseUpTime < 100) {
            return;
        }
    
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / (rect.right - rect.left) * width;
        const y = (e.clientY - rect.top) / (rect.bottom - rect.top) * height;
        
        // 非パズルモードのみダブルクリック処理を許可
        handleClick(x, y);
    });

    // タッチデバイス用の長押し検出
    let touchStartTime = 0;
    let touchHoldTimer = null;
    let touchedAtom = null;    
    
    // タッチイベント
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault(); // スクロールを防止
        
        // タッチの開始位置と現在位置を比較
        const touch = e.touches[0];
        const touchX = touch.clientX;
        const touchY = touch.clientY;
        
        // タッチ位置が大きく動いたらタイマーをキャンセル
        if (Math.abs(touchX - touch.clientX) > 10 || 
            Math.abs(touchY - touch.clientY) > 10) {
            
            if (touchHoldTimer) {
                clearTimeout(touchHoldTimer);
                touchHoldTimer = null;
            }
        }
        
        // ドラッグ機能の追加（タッチした原子があれば移動）
        if (touchedAtom) {
            const rect = canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) / (rect.right - rect.left) * width;
            const y = (touch.clientY - rect.top) / (rect.bottom - rect.top) * height;
            
            // 原子の位置を更新
            touchedAtom.x = x;
            touchedAtom.y = y;
            
            // 結合した原子も一緒に移動
            if (touchedAtom.bonds.length > 0) {
                const dx = touchedAtom.x - x;
                const dy = touchedAtom.y - y;
                moveConnectedAtoms(touchedAtom, dx, dy, new Set([touchedAtom]));
            }
        }
    });
    
    // 元素選択ボタンのイベント
    elementButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            selectedElement = btn.getAttribute('data-element');
            updateElementButtons();
        });
    });
    
    // クリアボタン
    clearBtn.addEventListener('click', () => {
        clearCanvas();
    });
    
    // 保存ボタン
    saveBtn.addEventListener('click', saveAsImage);
    
    // オーディオトグル
    audioToggle.addEventListener('click', () => {
        audioEnabled = soundSystem.toggleAudio();
        updateAudioButtonState();
    });
    
    // 音量スライダー
    volumeSlider.addEventListener('input', () => {
        const volumeValue = volumeSlider.value;
        
        if (soundSystem) {
            soundSystem.setMasterVolume(volumeValue);
            
            if (volumeValue == 0) {
                audioToggle.textContent = '🔇';
                audioEnabled = false;
            } else if (volumeValue > 0 && !audioEnabled) {
                audioToggle.textContent = '🔊';
                audioEnabled = true;
            }
        }
    });
    
    // シミュレーションモード
    simulationMode.addEventListener('change', () => {
        // モード変更時の処理
        const newMode = simulationMode.value;
        
        // 全原子の速度を若干リセット
        atoms.forEach(atom => {
            if (newMode === 'heat') {
                // 熱運動モードで初期速度を強化
                atom.vx += (Math.random() - 0.5) * 1;
                atom.vy += (Math.random() - 0.5) * 1;
            } else if (newMode === 'normal') {
                // 通常モードで速度を減衰
                atom.vx *= 0.5;
                atom.vy *= 0.5;
            }
        });
    });
    
    // シミュレーションの一時停止/再開
    simulationToggle.addEventListener('click', () => {
        isPaused = !isPaused;
        simulationToggle.textContent = isPaused ? '▶ 再開' : '⏸ 一時停止';
    });
    
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
    
    // スマートフォンの傾き検出（重力効果）
    window.addEventListener('deviceorientation', (e) => {
        if (e.beta && e.gamma) {
            // 傾きを重力に変換（最大値を制限）
            const betaRad = (e.beta * Math.PI) / 180; // 前後の傾き
            const gammaRad = (e.gamma * Math.PI) / 180; // 左右の傾き
            
            gravity.x = Math.sin(gammaRad) * 0.0005;
            gravity.y = Math.sin(betaRad) * 0.0005;
        }
    });

    // マウスダウン/タッチスタートでドラッグ開始
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / (rect.right - rect.left) * width;
        const y = (e.clientY - rect.top) / (rect.bottom - rect.top) * height;
        
        // クリック位置の原子を探す
        const clickedAtom = findAtomAt(x, y);
        
        if (clickedAtom) {
            // 原子をドラッグ開始
            isDragging = true;
            draggedAtom = clickedAtom;
            dragOffsetX = x - clickedAtom.x;
            dragOffsetY = y - clickedAtom.y;
            e.preventDefault(); // クリックイベントの伝播を防止
        } else {
            // 原子が見つからない場合は通常のクリック処理
            handleClick(x, y);
        }
    });

    // マウス移動でドラッグ中の原子を移動
    canvas.addEventListener('mousemove', (e) => {
        if (!isDragging || !draggedAtom) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / (rect.right - rect.left) * width;
        const y = (e.clientY - rect.top) / (rect.bottom - rect.top) * height;
        
        // 原子の位置を更新
        draggedAtom.x = x - dragOffsetX;
        draggedAtom.y = y - dragOffsetY;
        
        // 結合原子も一緒に移動
        if (draggedAtom.bonds.length > 0) {
            const dx = draggedAtom.x - (x - dragOffsetX);
            const dy = draggedAtom.y - (y - dragOffsetY);
            moveConnectedAtoms(draggedAtom, dx, dy, new Set([draggedAtom]));
        }
    });

    // マウスアップでドラッグ終了
    canvas.addEventListener('mouseup', () => {
        if (isDragging && draggedAtom) {
            // ドラッグ終了時に他の原子との結合チェック
            const bondedAtoms = draggedAtom.tryBondWithNearbyAtoms(atoms);
            
            // 結合音を再生
            if (audioEnabled && bondedAtoms.length > 0) {
                soundSystem.playEventSound('bond', {
                    pitchFactor: 0.3 + Math.random() * 0.4,
                    velocityFactor: 0.6 + Math.random() * 0.3
                });
            }
            
            // 分子検出を試行
            moleculeDetector.detectMolecules(atoms, true);
        }
        lastMouseUpTime = Date.now();
        isDragging = false;
        draggedAtom = null;
    });

    // 右クリックメニューのデフォルト動作を防止
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / (rect.right - rect.left) * width;
        const y = (e.clientY - rect.top) / (rect.bottom - rect.top) * height;
        
        // クリック位置の原子を探す
        const clickedAtom = findAtomAt(x, y);
        
        if (clickedAtom) {
            // 原子を削除
            removeAtom(clickedAtom);
        }
    });

    // 原子を削除する関数
    function removeAtom(atom) {
        // 結合を全て解除
        const connectedAtoms = [];
        
        // 結合先の原子を記録
        atom.bonds.forEach(bond => {
            connectedAtoms.push(bond.atom);
        });
        
        // 結合を全て解除
        connectedAtoms.forEach(connectedAtom => {
            atom.breakBondWith(connectedAtom);
        });
        
        // 原子配列から削除
        const index = atoms.indexOf(atom);
        if (index > -1) {
            atoms.splice(index, 1);
        }

        // 分子検出を更新
        setTimeout(forceUpdateMolecules, 100);
    }

    canvas.addEventListener('touchmove', (e) => {
        // タッチ位置が動いたらタイマーをキャンセル
        if (Math.abs(e.touches[0].clientX - e.touches[0].clientX) > 10 ||
            Math.abs(e.touches[0].clientY - e.touches[0].clientY) > 10) {
            
            if (touchHoldTimer) {
                clearTimeout(touchHoldTimer);
                touchHoldTimer = null;
            }
        }
    });

    canvas.addEventListener('touchend', (e) => {
        // タイマーをクリア
        if (touchHoldTimer) {
            clearTimeout(touchHoldTimer);
            touchHoldTimer = null;
        }
        
        const touchDuration = Date.now() - touchStartTime;
        
        // 短いタッチ（通常のタップ）の場合に原子を配置
        if (touchDuration < 500 && !touchedAtom) {
            // タッチの位置を取得（changedTouchesを使用）
            const touch = e.changedTouches[0];
            const rect = canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) / (rect.right - rect.left) * width;
            const y = (touch.clientY - rect.top) / (rect.bottom - rect.top) * height;
            
            // 原子を配置する処理を呼び出し
            handleClick(x, y);
        }
        
        touchedAtom = null;
    });

    // 特定座標に原子があるか探す関数
    function findAtomAt(x, y) {
        // 座標に近い原子を探す
        for (let i = atoms.length - 1; i >= 0; i--) {
            const atom = atoms[i];
            const dx = atom.x - x;
            const dy = atom.y - y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            // 原子の半径より小さければヒット
            if (distance < atom.radius * 1.5) {
                return atom;
            }
        }
        return null;
    }

    // 結合した原子も一緒に移動させる関数（再帰的）
    function moveConnectedAtoms(atom, dx, dy, visited) {
        atom.bonds.forEach(bond => {
            const connectedAtom = bond.atom;
            if (!visited.has(connectedAtom)) {
                visited.add(connectedAtom);
                connectedAtom.x += dx;
                connectedAtom.y += dy;
                moveConnectedAtoms(connectedAtom, dx, dy, visited);
            }
        });
    }

    // ウィンドウリサイズイベント
    window.addEventListener('resize', handleResize);
    
    // 初期化処理
    let lastUpdate = performance.now();
    updateElementButtons();
    
    // 水素と酸素の原子をあらかじめ配置（水分子の形成を促進）
    createRandomAtoms(15, ['H', 'O', 'C', 'N']);
    
    // アニメーションを開始
    animate();
    
    // オーディオコンテキストの開始（ユーザーインタラクション）
    canvas.addEventListener('click', () => {
        if (soundSystem.audioContext.state === 'suspended') {
            soundSystem.audioContext.resume();
        }
    }, { once: true });

    // 定期的な自動回復機能の追加
    setInterval(function() {
        // 無効な原子や状態が見つかった場合は自動的に回復
        let hasInvalid = false;
        
        // 無効な原子がないかチェック
        for (let i = 0; i < atoms.length; i++) {
            const atom = atoms[i];
            if (!atom || !atom.isValidPosition || !atom.isValidPosition()) {
                hasInvalid = true;
                break;
            }
        }
        
        if (hasInvalid) {
            console.log("自動回復: 無効な原子を検出しました");
            emergencyRecovery();
        }
    }, 30000); // 30秒ごとにチェック

    // 緊急回復関数 - 異常な原子を除去し、シミュレーションを正常化
    function emergencyRecovery() {
        console.log("緊急回復処理を開始...");
        
        // 無効な原子を除去
        let removedCount = 0;
        for (let i = atoms.length - 1; i >= 0; i--) {
            const atom = atoms[i];
            if (!atom || !atom.isValidPosition || !atom.isValidPosition()) {
                atoms.splice(i, 1);
                removedCount++;
            }
        }
        
        if (removedCount > 0) {
            console.log(`${removedCount}個の無効な原子を除去しました`);
        }
        
        // 分子検出システムをリセット
        try {
            moleculeDetector.molecules.clear();
            console.log("分子検出システムをリセットしました");
            
            // 再検出を試行
            const newMolecules = moleculeDetector.detectMolecules(atoms, true);
            console.log(`${newMolecules.length}個の新しい分子を検出しました`);
        } catch (error) {
            console.error("分子検出システムのリセット中にエラー:", error);
        }
        
        showMessage("システムを回復しました", "info");
        console.log("緊急回復処理が完了しました");
    }
});

// app.jsファイルの末尾に以下のコードを追加してください

// 分子リスト関連の機能
document.addEventListener('DOMContentLoaded', () => {
    // 既存のDOMContentLoadedリスナーがある場合は、その中に追加するか、末尾に別のリスナーとして追加します
    
    // UI要素
    const moleculeListBtn = document.getElementById('moleculeListBtn');
    const moleculeListModal = document.getElementById('moleculeListModal');
    const closeModalBtn = document.querySelector('.close-modal');
    const moleculeListContainer = document.querySelector('.molecule-list-container');
    const molecularDatabase = document.getElementById('molecular-database');
    
    // 分子データベースが読み込まれているか確認
    if (typeof MoleculeDatabase !== 'undefined') {
        // 詳細パネルの分子リストを生成
        generateMoleculeList(molecularDatabase);
        
        // モーダルの分子リストも生成
        generateMoleculeList(moleculeListContainer);
    }
    
    // 分子リストボタンのイベントリスナー
    if (moleculeListBtn) {
        moleculeListBtn.addEventListener('click', () => {
            moleculeListModal.style.display = 'block';
        });
    }
    
    // モーダルを閉じるボタンのイベントリスナー
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            moleculeListModal.style.display = 'none';
        });
    }
    
    // モーダル外をクリックして閉じる
    window.addEventListener('click', (e) => {
        if (e.target === moleculeListModal) {
            moleculeListModal.style.display = 'none';
        }
    });
    
    // ESCキーでモーダルを閉じる
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && moleculeListModal.style.display === 'block') {
            moleculeListModal.style.display = 'none';
        }
    });
});

// 分子リストを生成する関数
function generateMoleculeList(container) {
    if (!container) return;
    
    // 元素ごとに分子をフィルタリングするためのマップを作成
    const elementMolecules = {
        'H': [],
        'O': [],
        'C': [],
        'N': [],
        'Cl': []
    };
    
    // 各分子を含まれる元素に基づいて分類
    MoleculeDatabase.molecules.forEach(molecule => {
        const elements = Object.keys(molecule.composition);
        elements.forEach(element => {
            if (elementMolecules[element]) {
                elementMolecules[element].push(molecule);
            }
        });
    });
    
    // テーブルを作成
    let html = `
        <table class="molecule-table">
            <thead>
                <tr>
                    <th>分子式</th>
                    <th>名前</th>
                    <th>説明</th>
                    <th>含まれる元素</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // 全ての分子をリストに追加
    MoleculeDatabase.molecules.forEach(molecule => {
        const elements = Object.keys(molecule.composition);
        const elementTags = elements.map(element => 
            `<span class="molecule-tag ${element}">${element}</span>`
        ).join('');
        
        html += `
            <tr>
                <td>${PeriodicTable.formatFormula(molecule.formula)}</td>
                <td>${molecule.name}</td>
                <td>${molecule.description}</td>
                <td>${elementTags}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    // 塩素を含む分子のセクションを追加
    html += `
        <h4 style="margin-top: 1rem;">塩素(Cl)を含む分子</h4>
    `;
    
    if (elementMolecules['Cl'] && elementMolecules['Cl'].length > 0) {
        html += `<ul>`;
        elementMolecules['Cl'].forEach(molecule => {
            html += `<li>${molecule.name} (${PeriodicTable.formatFormula(molecule.formula)}) - ${molecule.description}</li>`;
        });
        html += `</ul>`;
    } else {
        html += `<p>塩素を含む分子は現在1つのみ: HCl (塩化水素)</p>`;
    }
    
    // HTMLを設定
    container.innerHTML = html;
}

// app.jsファイルの末尾に以下のコードを追加してください（既存の分子リスト機能を置き換え）

// 分子リスト関連の機能
document.addEventListener('DOMContentLoaded', () => {
    // 既存のDOMContentLoadedリスナーがある場合は、その中に追加するか、末尾に別のリスナーとして追加します
    
    // UI要素
    const moleculeListBtn = document.getElementById('moleculeListBtn');
    const moleculeListModal = document.getElementById('moleculeListModal');
    const closeModalBtn = document.querySelector('.close-modal');
    const moleculeListContainer = document.querySelector('.molecule-list-container');
    const molecularDatabase = document.getElementById('molecular-database');
    
    // 分子データベースが読み込まれているか確認
    if (typeof MoleculeDatabase !== 'undefined') {
        // 詳細パネルの分子リストを生成
        generateMoleculeList(molecularDatabase);
        
        // モーダルの分子リストも生成
        generateMoleculeList(moleculeListContainer, true);
    }
    
    // 分子リストボタンのイベントリスナー
    if (moleculeListBtn) {
        moleculeListBtn.addEventListener('click', () => {
            moleculeListModal.style.display = 'block';
        });
    }
    
    // モーダルを閉じるボタンのイベントリスナー
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            moleculeListModal.style.display = 'none';
        });
    }
    
    // モーダル外をクリックして閉じる
    window.addEventListener('click', (e) => {
        if (e.target === moleculeListModal) {
            moleculeListModal.style.display = 'none';
        }
    });
    
    // ESCキーでモーダルを閉じる
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && moleculeListModal.style.display === 'block') {
            moleculeListModal.style.display = 'none';
        }
    });
});

// 分子リストを生成する関数
function generateMoleculeList(container, includeFilter = false) {
    if (!container) return;
    
    // 元素ごとに分子をフィルタリングするためのマップを作成
    const elementMolecules = {
        'H': [],
        'O': [],
        'C': [],
        'N': [],
        'Cl': []
    };
    
    // 各分子を含まれる元素に基づいて分類
    MoleculeDatabase.molecules.forEach(molecule => {
        const elements = Object.keys(molecule.composition);
        elements.forEach(element => {
            if (elementMolecules[element]) {
                // 重複を避ける
                if (!elementMolecules[element].some(m => m.formula === molecule.formula)) {
                    elementMolecules[element].push(molecule);
                }
            }
        });
    });
    
    let html = '';
    
    // フィルタリングオプションを追加（モーダルのみ）
    if (includeFilter) {
        html += `
            <div class="molecule-filter">
                <label for="elementFilter">元素でフィルタ: </label>
                <select id="elementFilter" onchange="filterMoleculesByElement(this.value)">
                    <option value="all">すべて</option>
                    <option value="H">水素 (H)</option>
                    <option value="O">酸素 (O)</option>
                    <option value="C">炭素 (C)</option>
                    <option value="N">窒素 (N)</option>
                    <option value="Cl">塩素 (Cl)</option>
                </select>
            </div>
        `;
    }
    
    // テーブルを作成
    html += `
        <table class="molecule-table" id="moleculeTable">
            <thead>
                <tr>
                    <th>分子式</th>
                    <th>名前</th>
                    <th>説明</th>
                    <th>含まれる元素</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // 全ての分子をリストに追加
    MoleculeDatabase.molecules.forEach(molecule => {
        const elements = Object.keys(molecule.composition);
        const elementTags = elements.map(element => 
            `<span class="molecule-tag ${element}" data-element="${element}">${element}</span>`
        ).join('');
        
        // 元素のリストをdata属性として保存
        const elementsList = elements.join(' ');
        
        html += `
            <tr data-elements="${elementsList}">
                <td>${PeriodicTable.formatFormula(molecule.formula)}</td>
                <td>${molecule.name}</td>
                <td>${molecule.description}</td>
                <td>${elementTags}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    // // 塩素を含む分子のセクションを追加
    // if (!includeFilter) {
    //     html += `
    //         <h4 style="margin-top: 1.5rem;">塩素(Cl)を含む分子</h4>
    //     `;
        
    //     if (elementMolecules['Cl'] && elementMolecules['Cl'].length > 0) {
    //         html += `<ul class="element-molecule-list">`;
    //         elementMolecules['Cl'].forEach(molecule => {
    //             html += `<li>${molecule.name} (${PeriodicTable.formatFormula(molecule.formula)}) - ${molecule.description}</li>`;
    //         });
    //         html += `</ul>`;
    //     } else {
    //         html += `<p>塩素を含む分子が見つかりません</p>`;
    //     }
    // }
    
    // HTMLを設定
    container.innerHTML = html;
}

// 元素によるフィルタリング関数（グローバルスコープに定義）
window.filterMoleculesByElement = function(element) {
    const table = document.getElementById('moleculeTable');
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
        if (element === 'all') {
            row.style.display = '';
        } else {
            const elements = row.getAttribute('data-elements').split(' ');
            if (elements.includes(element)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });
}
