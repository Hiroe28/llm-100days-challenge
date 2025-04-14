/**
 * NeuronSoundSystem - ニューロン発火に基づいた音楽生成システム
 */
class NeuronSoundSystem {
    constructor() {
        // 音量設定
        this.volume = 0.3; // デフォルト音量30%
        
        // Web Audio APIのセットアップ
        this.setupAudio();
        
        // 音色の設定
        this.setupInstruments();
        
        // 音楽パラメータ - より調和のとれたスケールを使用
        this.scale = this.generateScale('pentaMajor', 'C'); // 変更
        this.baseOctave = 3;
        this.lastNoteTime = 0;
        this.minTimeBetweenNotes = 100; // ms
        
        // システム状態
        this.enabled = true;
        this.activeNotes = new Map();
        this.noteHistory = [];
        this.maxHistory = 16;
        
        // 自動アレンジャー
        this.autoArrangerActive = false;
        this.autoArrangerInterval = null;
        this.beatCounter = 0;
        this.beatsPerMeasure = 4;
        this.activeNeurons = [];
    
        // キーとスケールの設定
        this.musicKey = 'C'; // 現在の調
        this.currentScale = 'pentaMajor'; // 現在のスケール
    
        // 録音関連
        this.recorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
    }
    

    // 音階の生成メソッドを改良
    generateScale(type, rootNote) {
        const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const rootIndex = chromaticScale.indexOf(rootNote);
        
        let intervals;
        switch (type) {
            case 'major':
                intervals = [0, 2, 4, 5, 7, 9, 11]; // メジャースケール
                break;
            case 'minor':
                intervals = [0, 2, 3, 5, 7, 8, 10]; // マイナースケール
                break;
            case 'pentatonic':
                intervals = [0, 2, 4, 7, 9]; // ペンタトニックスケール（明るい）
                break;
            case 'pentaMajor': // 完全調和型ペンタトニック（どの音の組み合わせも調和する）
                intervals = [0, 2, 4, 7, 9]; // C, D, E, G, A
                break;
            case 'pentaMinor': // マイナーペンタトニック
                intervals = [0, 3, 5, 7, 10]; // C, Eb, F, G, Bb
                break;
            case 'gameMusic': // ゲーム音楽用スケール（日本的/ファンタジー風）
                intervals = [0, 2, 5, 7, 9]; // C, D, F, G, A
                break;
            default:
                intervals = [0, 2, 4, 7, 9]; // デフォルトはペンタトニック
        }
        
        return intervals.map(interval => {
            const noteIndex = (rootIndex + interval) % 12;
            return chromaticScale[noteIndex];
        });
    }

    
    // 音名を周波数に変換
    noteToFrequency(note) {
        const notePattern = /^([A-G][#b]?)(-?\d+)$/;
        const match = note.match(notePattern);
        
        if (!match) {
            console.error('Invalid note format:', note);
            return 440; // デフォルトは A4
        }
        
        const noteName = match[1];
        const octave = parseInt(match[2]);
        
        const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteIndex = chromaticScale.indexOf(noteName);
        
        if (noteIndex === -1) {
            console.error('Invalid note name:', noteName);
            return 440;
        }
        
        // A4 = 440Hzを基準に計算
        const A4 = 440;
        const A4NoteIndex = chromaticScale.indexOf('A');
        const A4Octave = 4;
        
        // A4からの半音の数
        const semitonesFromA4 = (octave - A4Octave) * 12 + (noteIndex - A4NoteIndex);
        
        // 周波数計算（平均律）: f = 440 * 2^(n/12)
        return A4 * Math.pow(2, semitonesFromA4 / 12);
    }
    
    // オーディオシステムの有効・無効切り替え
    toggleAudio() {
        this.enabled = !this.enabled;
        
        if (!this.enabled) {
            // 全ての音を停止
            this.stopAllSounds();
        } else if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        return this.enabled;
    }
    
    // 現在の状態を取得
    getStatus() {
        return {
            enabled: this.enabled,
            contextState: this.enabled ? this.audioContext.state : 'disabled'
        };
    }
    
    // ニューロン発火時の音楽生成
    playNeuronSound(neuronData) {
        // 音声コンテキストが準備できていなければスキップ
        if (!this.ensureAudioContext() || !this.enabled) {
            console.log('Audio not ready, skipping sound');
            return;
        }
            
        const now = performance.now();
        if (now - this.lastNoteTime < this.minTimeBetweenNotes) return;
        this.lastNoteTime = now;
        
        // ニューロンの位置から音程とインストゥルメントを決定
        const x = neuronData.x;
        const y = neuronData.y;
        const canvasWidth = neuronData.canvasWidth || 1000;
        const canvasHeight = neuronData.canvasHeight || 800;
        
        // x座標を音程マッピング
        const scaleIndex = Math.floor((x / canvasWidth) * this.scale.length);
        const octaveOffset = Math.floor((y / canvasHeight) * 3); // 3オクターブの範囲
        const octave = this.baseOctave + octaveOffset;
        const note = `${this.scale[scaleIndex]}${octave}`;
        
        // ニューロンのエネルギー（強さ）をベロシティに
        const velocity = Math.min(0.9, 0.5 + neuronData.energy * 0.5);
        
        // 接続数に応じて音長を変える
        const connectionFactor = Math.min(1, neuronData.connections / 5);
        const duration = 0.3 + connectionFactor * 1.2;
        
        // 音の再生時刻
        const startTime = this.audioContext.currentTime;
        
        // 縦位置によってインストゥルメントを選択
        if (y < canvasHeight * 0.33) {
            // 上部：シンセリード
            this.instruments.synth.trigger(note, startTime, duration, velocity);
        } else if (y < canvasHeight * 0.66) {
            // 中部：パッド
            this.instruments.pad.trigger(note, startTime, duration * 2, velocity * 0.7);
        } else {
            // 下部：ベース
            const bassNote = `${this.scale[scaleIndex]}${this.baseOctave}`;
            this.instruments.bass.trigger(bassNote, startTime, duration * 0.8, velocity * 0.9);
        }
        
        // 音を履歴に追加
        this.noteHistory.push({
            note,
            time: startTime,
            duration,
            velocity,
            instrument: y < canvasHeight * 0.33 ? 'synth' : (y < canvasHeight * 0.66 ? 'pad' : 'bass')
        });
        
        // 履歴が最大値を超えたら古いものを削除
        if (this.noteHistory.length > this.maxHistory) {
            this.noteHistory.shift();
        }
        
        return {
            note,
            time: startTime,
            duration,
            velocity
        };

        
    }

    // 自動アレンジャーを改良
    startAutoArranger(neurons = []) {
        if (this.autoArrangerActive || !this.enabled) return;
        
        this.autoArrangerActive = true;
        this.beatCounter = 0;
        this.activeNeurons = neurons;
        
        // テンポを設定 - やや遅めに
        const bpm = 75; // さらに落ち着いたテンポに
        const beatTime = 60 / bpm;
        
        // 音楽の初期設定
        this.musicKey = 'C'; // 調をCに固定
        this.currentScale = 'pentaMajor'; // 常に調和するスケールを使用
        this.scale = this.generateScale(this.currentScale, this.musicKey);
        
        // 和音進行とアルペジオパターンを定義
        const chordProgression = [
            [0, 2, 4], // I (トニック)
            [4, 0, 2], // V (ドミナント) - 転回形
            [2, 4, 0], // III (メディアント) - 転回形
            [0, 2, 4]  // I (トニック)
        ];
        
        this.autoArrangerInterval = setInterval(() => {
            if (!this.enabled || this.audioContext.state !== 'running' || !this.activeNeurons.length) return;
            
            const currentBeat = this.beatCounter % 16;
            const startTime = this.audioContext.currentTime;
            
            // 4小節ごとにコード進行を変更
            const chordIndex = Math.floor(currentBeat / 4) % chordProgression.length;
            const currentChord = chordProgression[chordIndex];
            
            // ニューロンとビート位置に基づいて音を演奏
            if (currentBeat % 2 === 0 && this.activeNeurons.length > 0) {
                // ビートに合わせて異なるニューロンを選択
                let neuronIndex = (this.beatCounter % this.activeNeurons.length);
                let selectedNeuron = this.activeNeurons[neuronIndex];
                
                if (selectedNeuron) {
                    // 視覚的フィードバック
                    selectedNeuron.fire();
                    
                    // ニューロンの位置を使って音程を生成
                    const canvasWidth = selectedNeuron.canvas.width;
                    const canvasHeight = selectedNeuron.canvas.height;
                    const x = selectedNeuron.x;
                    const y = selectedNeuron.y;
                    
                    // X位置をスケール上の音にマッピング
                    // スケール上の音にのみ制限（常に調和する）
                    const positionInScale = Math.floor((x / canvasWidth) * this.scale.length);
                    const scaleNote = positionInScale % this.scale.length;
                    
                    // Y位置をオクターブにマッピング（2オクターブの範囲）
                    const octaveOffset = Math.floor((y / canvasHeight) * 2);
                    const octave = this.baseOctave + 1 + octaveOffset;
                    
                    // 現在のコードに基づいてハーモニーを作成（常に調和する）
                    const harmonyIndex = currentChord[Math.floor(Math.random() * currentChord.length)];
                    const harmonyNote = (scaleNote + harmonyIndex) % this.scale.length;
                    
                    // 最終的な音を決定
                    const note = `${this.scale[harmonyNote]}${octave}`;
                    
                    // ニューロンの接続数に応じて音量を調整
                    const connectionFactor = Math.min(1, selectedNeuron.connections.length / 5);
                    const velocity = 0.3 + connectionFactor * 0.2;
                    
                    // 音の長さ (ステップ感を出すため、短めに)
                    const duration = 0.8 + Math.random() * 0.4;
                    
                    // シンセリードで演奏
                    this.instruments.synth.trigger(note, startTime, duration, velocity);
                    
                    // 低確率でアクセント音を追加（さらなる調和のため）
                    if (Math.random() < 0.3) {
                        // アクセント音はスケール内の調和する音に制限
                        const accentOffset = [2, 4, 7][Math.floor(Math.random() * 3)]; // 3度, 5度, オクターブ
                        const accentNote = (harmonyNote + accentOffset) % this.scale.length;
                        const accentString = `${this.scale[accentNote]}${octave}`;
                        
                        setTimeout(() => {
                            this.instruments.synth.trigger(accentString, this.audioContext.currentTime, duration * 0.5, velocity * 0.7);
                        }, 100 + Math.random() * 150);
                    }
                }
            }
            
            // 和音演奏（4拍ごと）
            if (currentBeat % 4 === 0) {
                // 現在の和音の各音を演奏（パッドサウンド）
                currentChord.forEach((chordStep, i) => {
                    const chordNote = `${this.scale[chordStep]}${this.baseOctave + 1}`;
                    setTimeout(() => {
                        this.instruments.pad.trigger(chordNote, this.audioContext.currentTime, 3.0, 0.2);
                    }, i * 100); // アルペジオ風にずらす
                });
                
                // 中心となるニューロンを見つける
                const keyNeurons = this.findKeyNeurons(4);
                
                if (keyNeurons.length > 0) {
                    // 主要なニューロンを視覚的に強調
                    keyNeurons.forEach((neuron, index) => {
                        setTimeout(() => {
                            neuron.fire();
                            
                            // 連鎖発火を追加
                            if (neuron.connections.length > 0 && Math.random() < 0.4) {
                                const targets = neuron.connections
                                    .filter(conn => conn.target && Math.random() < 0.5)
                                    .map(conn => conn.target);
                                    
                                targets.forEach((target, i) => {
                                    setTimeout(() => target.fire(), 100 + i * 80);
                                });
                            }
                        }, index * 200);
                    });
                    
                    // ベース音（低めの音を選ぶ）
                    const rootNote = `${this.scale[currentChord[0]]}${this.baseOctave}`;
                    this.instruments.bass.trigger(rootNote, startTime, 2.0, 0.5);
                }
            }
            
            this.beatCounter++;
        }, beatTime * 1000);
    }


    // 主要なニューロンを見つけるヘルパーメソッド
    findKeyNeurons(count) {
        if (!this.activeNeurons.length) return [];
        
        // 接続数でソート
        const sortedNeurons = [...this.activeNeurons]
            .sort((a, b) => b.connections.length - a.connections.length);
        
        // 上位のニューロンを返す
        return sortedNeurons.slice(0, Math.min(count, sortedNeurons.length));
    }

    // ニューロンの分布を分析するヘルパーメソッド
    analyzeNeuronDistribution(neurons) {
        if (!neurons.length) return { 0: 1 }; // デフォルト値
        
        // キャンバスを5つのエリアに分割
        const areaMap = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
        const canvasWidth = neurons[0].canvas.width;
        
        neurons.forEach(neuron => {
            // x座標から領域を決定
            const areaIndex = Math.floor((neuron.x / canvasWidth) * 5);
            areaMap[areaIndex] = (areaMap[areaIndex] || 0) + 1;
            
            // 接続数の多いニューロンの存在するエリアを強調
            if (neuron.connections.length > 3) {
                areaMap[areaIndex] += 2;
            }
        });
        
        return areaMap;
    }

    // ニューロン配列を設定するメソッドを追加
    setActiveNeurons(neurons) {
        this.activeNeurons = neurons;
    }
        
    // 自動アレンジャーを停止
    stopAutoArranger() {
        if (!this.autoArrangerActive) return;
        
        clearInterval(this.autoArrangerInterval);
        this.autoArrangerActive = false;
    }
    
    // 全ての音を停止
    stopAllSounds() {
        if (this.masterGain) {
            // フェードアウト
            const now = this.audioContext.currentTime;
            this.masterGain.gain.linearRampToValueAtTime(0, now + 0.1);
            
            // 0.1秒後に元の音量に戻す
            setTimeout(() => {
                if (this.masterGain) {
                    this.masterGain.gain.value = 0.5;
                }
            }, 100);
        }
        
        // アクティブな音をクリア
        this.activeNotes.clear();
        
        // 自動アレンジャーを停止
        this.stopAutoArranger();
    }


    // 録音開始メソッド
    startRecording() {
        if (this.isRecording) return;
        
        this.recordedChunks = [];
        this.isRecording = true;
        
        // AudioContextの出力をキャプチャするためのMediaStreamを作成
        const dest = this.audioContext.createMediaStreamDestination();
        this.masterGain.connect(dest);
        
        // MediaRecorderを設定
        this.recorder = new MediaRecorder(dest.stream, { mimeType: 'audio/webm' });
        
        this.recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                this.recordedChunks.push(e.data);
            }
        };
        
        this.recorder.onstop = () => {
            // 録音データを結合してBlobを作成
            const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
            
            // ダウンロード用のURLを作成
            const url = URL.createObjectURL(blob);
            
            // ダウンロードリンクを作成して自動クリック
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'neuron-symphony-' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.webm';
            document.body.appendChild(a);
            a.click();
            
            // クリーンアップ
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 100);
            
            this.isRecording = false;
        };
        
        // 録音開始
        this.recorder.start();
        return true;
    }

    // 録音停止メソッド
    stopRecording() {
        if (!this.isRecording || !this.recorder) return false;
        this.recorder.stop();
        return true;
    }

    // audio.jsのNeuronSoundSystemクラスに追加するメソッド

    // setupAudioメソッドを強化
    setupAudio() {
        try {
            // AudioContextの作成 - iOSでの遅延初期化に対応
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            
            // モバイルデバイス向けオプション
            const contextOptions = {
                latencyHint: 'interactive',
                sampleRate: 44100 // 標準サンプルレート
            };
            
            this.audioContext = new AudioContextClass(contextOptions);
            console.log('AudioContext initialized with state:', this.audioContext.state);
            
            // 音量設定（デフォルト値が未定義の場合に備える）
            this.volume = this.volume || 0.3;
            
            // マスターゲイン（音量調整）
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.volume; // 初期音量を設定
            this.masterGain.connect(this.audioContext.destination);
            
            // リバーブエフェクト
            this.reverb = this.audioContext.createConvolver();
            this.createReverb();
            
            // リバーブをマスターゲインに接続
            this.reverb.connect(this.masterGain);
            
            // ディレイエフェクト
            this.delay = this.audioContext.createDelay();
            this.delay.delayTime.value = 0.3;
            
            // ディレイフィードバック
            this.delayFeedback = this.audioContext.createGain();
            this.delayFeedback.gain.value = 0.2;
            
            // ディレイをフィードバックループに接続
            this.delay.connect(this.delayFeedback);
            this.delayFeedback.connect(this.delay);
            this.delay.connect(this.masterGain);
            
            // オーディオ初期化状態をログに記録
            console.log('Audio system setup complete');
        } catch (e) {
            console.error('Web Audio API setup failed:', e);
            this.enabled = false;
        }
    }

    // 音声コンテキストを確実に開始するメソッドを追加
    ensureAudioContext() {
        if (!this.audioContext) {
            console.warn('AudioContext not initialized, creating now');
            this.setupAudio();
            return false;
        }
        
        if (this.audioContext.state === 'suspended') {
            console.log('Resuming suspended AudioContext');
            this.audioContext.resume().then(() => {
                console.log('AudioContext successfully resumed');
            }).catch(err => {
                console.error('Failed to resume AudioContext:', err);
            });
            return false;
        }
        
        return this.audioContext.state === 'running';
    }



    // リバーブエフェクトを作成するメソッド
    createReverb() {
        // 仮のインパルス応答を作成
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * 2; // 2秒のリバーブ
        const impulseResponse = this.audioContext.createBuffer(2, length, sampleRate);
        
        // 左右のチャンネルデータを取得
        const left = impulseResponse.getChannelData(0);
        const right = impulseResponse.getChannelData(1);
        
        // ランダムノイズをフェードアウトさせてリバーブを擬似的に表現
        for (let i = 0; i < length; i++) {
            // 減衰するノイズ
            const decay = Math.pow(1 - i / length, 2);
            const noise = (Math.random() * 2 - 1) * decay * 0.5;
            
            left[i] = noise;
            right[i] = noise;
        }
        
        this.reverb.buffer = impulseResponse;
    }

    // 音色の設定を実装
    setupInstruments() {
        this.instruments = {
            synth: new SynthInstrument(this.audioContext, this.reverb, this.delay, this.masterGain),
            pad: new PadInstrument(this.audioContext, this.reverb, this.masterGain),
            bass: new BassInstrument(this.audioContext, this.masterGain)
        };
    }

    // 音量調整メソッド
    setMasterVolume(value) {
        // 0～100の値を0～1の範囲に変換
        const normalizedVolume = Math.max(0, Math.min(1, value / 100));
        this.volume = normalizedVolume;
        
        if (this.masterGain && this.enabled) {
            // 急激な音量変化を避けるため徐々に変化させる
            const now = this.audioContext.currentTime;
            this.masterGain.gain.linearRampToValueAtTime(normalizedVolume, now + 0.1);
        }
        
        return normalizedVolume;
    }

}

/**
 * インストゥルメントクラス：シンセリード - より調和的な音色に改良
 */
class SynthInstrument {
    constructor(audioContext, reverbNode, delayNode, outputNode) {
        this.audioContext = audioContext;
        this.reverbNode = reverbNode;
        this.delayNode = delayNode;
        this.outputNode = outputNode;
    }
    
    trigger(note, time, duration, velocity) {
        // 3つのオシレーターでより滑らかで豊かな音色を実現
        const osc1 = this.audioContext.createOscillator(); // メイン音源
        const osc2 = this.audioContext.createOscillator(); // わずかにデチューン
        const osc3 = this.audioContext.createOscillator(); // オクターブ上
        
        // 個別のゲインノード
        const gain1 = this.audioContext.createGain();
        const gain2 = this.audioContext.createGain();
        const gain3 = this.audioContext.createGain();
        const masterGain = this.audioContext.createGain();
        
        // フィルター - 輝きのある柔らかい音色に
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';  // bandpassからlowpassに変更
        filter.frequency.value = 1800;
        filter.Q.value = 2;
        
        // 2番目のフィルター - より輝きを加える
        const highFilter = this.audioContext.createBiquadFilter();
        highFilter.type = 'highshelf';
        highFilter.frequency.value = 3000;
        highFilter.gain.value = 6; // 高音域をブースト
        
        // オシレーターの設定 - クリスタルのような音色を実現
        osc1.type = 'sine';      // メインはサイン波
        osc2.type = 'triangle';  // 少し倍音のあるトライアングル波
        osc3.type = 'sine';      // オクターブ上の音もサイン波
        
        // 周波数設定
        const freq = this.noteToFrequency(note);
        osc1.frequency.value = freq;
        osc2.frequency.value = freq * 1.003; // わずかにデチューン（唸り効果）
        osc3.frequency.value = freq * 2;     // 1オクターブ上
        
        // ゲイン設定
        gain1.gain.value = 0.6;   // メイン音源
        gain2.gain.value = 0.3;   // デチューン音源（控えめに）
        gain3.gain.value = 0.15;  // オクターブ上（さらに控えめに）
        
        // エンベロープ設定 - より自然な減衰
        const now = time;
        const attackTime = 0.02;   // 少し緩やかな立ち上がり
        const decayTime = 0.15;    // 自然な減衰
        const sustainLevel = Math.max(0.001, velocity * 0.4);
        const releaseTime = 0.3;   // 自然な収束
        
        // マスターゲインのエンベロープ
        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.linearRampToValueAtTime(velocity, now + attackTime);
        masterGain.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime);
        masterGain.gain.linearRampToValueAtTime(0.001, now + duration);
        
        // フィルターエンベロープ - クリスタルの輝きを表現
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.linearRampToValueAtTime(2500 + velocity * 2000, now + attackTime);
        filter.frequency.exponentialRampToValueAtTime(1800, now + attackTime + decayTime);
        
        // 接続
        osc1.connect(gain1);
        osc2.connect(gain2);
        osc3.connect(gain3);
        
        gain1.connect(filter);
        gain2.connect(filter);
        gain3.connect(filter);
        
        filter.connect(highFilter);
        highFilter.connect(masterGain);
        
        // エフェクト接続
        const dryGain = this.audioContext.createGain();
        const reverbGain = this.audioContext.createGain();
        const delayGain = this.audioContext.createGain();
        
        dryGain.gain.value = 0.5;
        reverbGain.gain.value = 0.35;  // 空間的広がり（リバーブ）
        delayGain.gain.value = 0.2;    // エコー効果（ディレイ）
        
        masterGain.connect(dryGain);
        masterGain.connect(reverbGain);
        masterGain.connect(delayGain);
        
        dryGain.connect(this.outputNode);
        reverbGain.connect(this.reverbNode);
        delayGain.connect(this.delayNode);
        
        // 再生
        osc1.start(now);
        osc2.start(now);
        osc3.start(now);
        
        osc1.stop(now + duration + releaseTime);
        osc2.stop(now + duration + releaseTime);
        osc3.stop(now + duration + releaseTime);
    }
    
    // 既存のnoteToFrequencyメソッド
    noteToFrequency(note) {
        const notePattern = /^([A-G][#b]?)(-?\d+)$/;
        const match = note.match(notePattern);
        
        if (!match) {
            console.error('Invalid note format:', note);
            return 440; // デフォルトは A4
        }
        
        const noteName = match[1];
        const octave = parseInt(match[2]);
        
        const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteIndex = chromaticScale.indexOf(noteName);
        
        if (noteIndex === -1) {
            console.error('Invalid note name:', noteName);
            return 440;
        }
        
        // A4 = 440Hzを基準に計算
        const A4 = 440;
        const A4NoteIndex = chromaticScale.indexOf('A');
        const A4Octave = 4;
        
        // A4からの半音の数
        const semitonesFromA4 = (octave - A4Octave) * 12 + (noteIndex - A4NoteIndex);
        
        // 周波数計算（平均律）: f = 440 * 2^(n/12)
        return A4 * Math.pow(2, semitonesFromA4 / 12);
    }
}
    

/**
 * インストゥルメントクラス：パッド - より調和的で柔らかい音色
 */
class PadInstrument {
    constructor(audioContext, reverbNode, outputNode) {
        this.audioContext = audioContext;
        this.reverbNode = reverbNode;
        this.outputNode = outputNode;
    }
    
    trigger(note, time, duration, velocity) {
        // パッド音源のオシレーター構成（5つに増加）
        const oscCount = 5;
        const oscs = [];
        const gains = [];
        
        // フィルター
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 900;
        filter.Q.value = 0.8; // よりスムースなカット
        
        // マスターゲイン
        const masterGain = this.audioContext.createGain();
        
        // 基本周波数
        const baseFreq = this.noteToFrequency(note);
        
        // コード構成音の周波数比率 - 豊かなハーモニーに
        // 1, 1.01 (微小デチューン), 2 (オクターブ), 1.5 (5度), 1.25 (長3度)
        const ratios = [1, 1.01, 2, 1.5, 1.25];
        
        // オシレーター波形タイプ - 各オシレーターに異なる波形
        const waveTypes = ['sine', 'sine', 'sine', 'triangle', 'sine'];
        
        // 相対音量 - 各オシレーターの混合バランス
        const volumeRatios = [0.7, 0.3, 0.15, 0.2, 0.25];
        
        // エンベロープ設定 - より滑らかで長い
        const now = time;
        const attackTime = 0.5;     // ゆっくりと立ち上がる
        const decayTime = 0.8;      // ゆっくりと減衰
        const sustainLevel = Math.max(0.001, velocity * 0.3);
        const releaseTime = 1.5;    // 長めのリリース
        
        // オシレーターとゲイン生成
        for (let i = 0; i < oscCount; i++) {
            oscs[i] = this.audioContext.createOscillator();
            gains[i] = this.audioContext.createGain();
            
            // オシレーター設定
            oscs[i].type = waveTypes[i];
            oscs[i].frequency.value = baseFreq * ratios[i];
            
            // わずかなピッチ変動（自然な揺らぎ）
            if (i > 0) {
                oscs[i].detune.value = (Math.random() - 0.5) * 5;
            }
            
            // 個別のエンベロープ（各音の立ち上がりを少しずらす）
            const envOffset = i * 0.12; // わずかなずれ
            gains[i].gain.setValueAtTime(0, now);
            gains[i].gain.linearRampToValueAtTime(
                velocity * volumeRatios[i], 
                now + attackTime + envOffset
            );
            gains[i].gain.linearRampToValueAtTime(
                sustainLevel * volumeRatios[i], 
                now + attackTime + decayTime + envOffset
            );
            gains[i].gain.linearRampToValueAtTime(
                0.001, 
                now + duration - (oscCount - i) * 0.1 // 終わりもわずかにずらす
            );
            
            // 接続
            oscs[i].connect(gains[i]);
            gains[i].connect(filter);
        }
        
        // フィルターをマスターゲインに接続
        filter.connect(masterGain);
        
        // エフェクト接続
        const dryGain = this.audioContext.createGain();
        const wetGain = this.audioContext.createGain();
        
        dryGain.gain.value = 0.3;    // 原音は控えめに
        wetGain.gain.value = 0.7;    // リバーブを多めに
        
        masterGain.connect(dryGain);
        masterGain.connect(wetGain);
        
        dryGain.connect(this.outputNode);
        wetGain.connect(this.reverbNode);
        
        // マスターゲインのエンベロープ（全体の音量）
        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.linearRampToValueAtTime(velocity * 0.5, now + attackTime * 1.2);
        masterGain.gain.linearRampToValueAtTime(velocity * 0.4, now + attackTime + decayTime);
        masterGain.gain.linearRampToValueAtTime(0.001, now + duration + releaseTime);
        
        // 再生開始
        for (let i = 0; i < oscCount; i++) {
            oscs[i].start(now);
            oscs[i].stop(now + duration + releaseTime + 0.1); // 余裕を持たせる
        }
    }
    
    // 既存のnoteToFrequencyメソッド
    noteToFrequency(note) {
        const notePattern = /^([A-G][#b]?)(-?\d+)$/;
        const match = note.match(notePattern);
        
        if (!match) {
            console.error('Invalid note format:', note);
            return 440; // デフォルトは A4
        }
        
        const noteName = match[1];
        const octave = parseInt(match[2]);
        
        const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteIndex = chromaticScale.indexOf(noteName);
        
        if (noteIndex === -1) {
            console.error('Invalid note name:', noteName);
            return 440;
        }
        
        // A4 = 440Hzを基準に計算
        const A4 = 440;
        const A4NoteIndex = chromaticScale.indexOf('A');
        const A4Octave = 4;
        
        // A4からの半音の数
        const semitonesFromA4 = (octave - A4Octave) * 12 + (noteIndex - A4NoteIndex);
        
        // 周波数計算（平均律）: f = 440 * 2^(n/12)
        return A4 * Math.pow(2, semitonesFromA4 / 12);
    }
}

/**
 * インストゥルメントクラス：ベース - 豊かで柔らかい音色に改良
 */
class BassInstrument {
    constructor(audioContext, outputNode) {
        this.audioContext = audioContext;
        this.outputNode = outputNode;
    }
    
    trigger(note, time, duration, velocity) {
        // オシレーターを増やして豊かな音色に
        const mainOsc = this.audioContext.createOscillator();
        const subOsc = this.audioContext.createOscillator();
        const harmOsc = this.audioContext.createOscillator();
        
        // 複数のゲインノードで制御
        const mainGain = this.audioContext.createGain();
        const subGain = this.audioContext.createGain();
        const harmGain = this.audioContext.createGain();
        const masterGain = this.audioContext.createGain();
        
        // フィルター - よりあたたかい音にするためlowpassを使用
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 700;  // カットオフ周波数を上げる
        filter.Q.value = 1;  // 緩やかなフィルター
        
        // 周波数の計算
        const freq = this.noteToFrequency(note);
        
        // 各オシレーターの波形と周波数を設定
        mainOsc.type = 'triangle';  // メインの音源はトライアングル波（柔らかい）
        mainOsc.frequency.value = freq;
        
        subOsc.type = 'sine';  // サブオシレーターは正弦波（基音を強調）
        subOsc.frequency.value = freq * 0.5;  // 1オクターブ下
        
        harmOsc.type = 'sine';  // ハーモニクス用オシレーター
        harmOsc.frequency.value = freq * 1.5;  // 5度上
        
        // ゲイン設定（レベル調整）
        mainGain.gain.value = 0.7;
        subGain.gain.value = 0.5;  // サブオシレーターも程よく混ぜる
        harmGain.gain.value = 0.15;  // ハーモニクスは控えめに
        
        // エンベロープ設定 - 立ち上がりを緩やかに、持続を長く
        const now = time;
        const attackTime = 0.08;  // 立ち上がりを緩やかに
        const decayTime = 0.3;    // 減衰もゆっくり
        const sustainLevel = velocity * 0.7;
        const releaseTime = 0.4;  // リリースを長めに
        
        // 滑らかなエンベロープ
        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.linearRampToValueAtTime(velocity, now + attackTime);
        masterGain.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime);
        masterGain.gain.linearRampToValueAtTime(0.001, now + duration);
        
        // フィルターエンベロープ - 滑らかな変化
        filter.frequency.setValueAtTime(100, now);
        filter.frequency.linearRampToValueAtTime(700 + velocity * 400, now + attackTime);
        filter.frequency.exponentialRampToValueAtTime(500, now + attackTime + decayTime);
        
        // 接続
        mainOsc.connect(mainGain);
        subOsc.connect(subGain);
        harmOsc.connect(harmGain);
        
        mainGain.connect(filter);
        subGain.connect(filter);
        harmGain.connect(filter);
        
        filter.connect(masterGain);
        masterGain.connect(this.outputNode);
        
        // 再生 - 十分な持続時間
        mainOsc.start(now);
        subOsc.start(now);
        harmOsc.start(now);
        
        mainOsc.stop(now + duration + releaseTime);
        subOsc.stop(now + duration + releaseTime);
        harmOsc.stop(now + duration + releaseTime);
    }
    
    noteToFrequency(note) {
        const notePattern = /^([A-G][#b]?)(-?\d+)$/;
        const match = note.match(notePattern);
        
        if (!match) {
            console.error('Invalid note format:', note);
            return 55; // A1（低め）に戻す
        }
        
        const noteName = match[1];
        const octave = parseInt(match[2]);
        
        // オクターブをそのままに（修正前のように）
        const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteIndex = chromaticScale.indexOf(noteName);
        
        if (noteIndex === -1) {
            console.error('Invalid note name:', noteName);
            return 55;
        }
        
        // A4 = 440Hzを基準に計算
        const A4 = 440;
        const A4NoteIndex = chromaticScale.indexOf('A');
        const A4Octave = 4;
        
        // A4からの半音の数
        const semitonesFromA4 = (octave - A4Octave) * 12 + (noteIndex - A4NoteIndex);
        
        // 周波数計算（平均律）: f = 440 * 2^(n/12)
        return A4 * Math.pow(2, semitonesFromA4 / 12);
    }
}