/**
 * NeuronSoundSystem - ニューロン発火に基づいた音楽生成システム
 */
class NeuronSoundSystem {
    constructor() {
        // Web Audio APIのセットアップ
        this.setupAudio();
        
        // 音色の設定
        this.setupInstruments();
        
        // 音楽パラメータ
        this.scale = this.generateScale('pentatonic', 'C');
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

        // 録音関連
        this.recorder = null;
        this.recordedChunks = [];
        this.isRecording = false;

    }
    
    // 音階の生成
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
            case 'minorPentatonic':
                intervals = [0, 3, 5, 7, 10]; // マイナーペンタトニック（暗め）
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
        if (!this.enabled || this.audioContext.state !== 'running') return;
        
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
    
    // 自動アレンジャーを開始
    startAutoArranger(neurons = []) {
        if (this.autoArrangerActive || !this.enabled) return;
        
        this.autoArrangerActive = true;
        this.beatCounter = 0;
        this.activeNeurons = neurons; // ニューロン配列を保存
        
        // テンポを設定
        const bpm = 85;
        const beatTime = 60 / bpm;
        
        // アルペジオパターンを定義
        const arpeggioPatterns = [
            [0, 2, 4, 7], // メジャー系
            [0, 3, 7, 12], // マイナー系
            [0, 4, 7, 11], // メジャー7系
            [0, 4, 7, 9, 12], // ペンタトニック系
        ];
        
        let currentPattern = 0;
        let arpIndex = 0;
        
        this.autoArrangerInterval = setInterval(() => {
            if (!this.enabled || this.audioContext.state !== 'running' || !this.activeNeurons.length) return;
            
            const currentBeat = this.beatCounter % 16;
            const startTime = this.audioContext.currentTime;
            
            // 8小節ごとにパターンを変更
            if (currentBeat === 0 && this.beatCounter % 32 === 0) {
                currentPattern = (currentPattern + 1) % arpeggioPatterns.length;
                // たまにルートノートも変える
                if (Math.random() < 0.3) {
                    const roots = ['C', 'D', 'E', 'G', 'A'];
                    const newRoot = roots[Math.floor(Math.random() * roots.length)];
                    this.scale = this.generateScale('pentatonic', newRoot);
                }
            }
            
            const pattern = arpeggioPatterns[currentPattern];
            
            // 重要: ニューロンを活用した演奏パターン
            // ニューロンの密度が高い領域を音に反映
            const activeNeurons = this.activeNeurons;
            
            // ニューロンを選択して発火させる
            if (currentBeat % 2 === 0) {
                // ビートごとに異なるニューロンを選択
                const neuronIndex = (this.beatCounter % activeNeurons.length);
                const selectedNeuron = activeNeurons[neuronIndex];
                
                if (selectedNeuron) {
                    // ニューロンを発火させて視覚的フィードバック
                    selectedNeuron.fire();
                    
                    // ニューロンの位置に基づいて音程を決定
                    const canvasWidth = selectedNeuron.canvas.width;
                    const canvasHeight = selectedNeuron.canvas.height;
                    const x = selectedNeuron.x;
                    const y = selectedNeuron.y;
                    
                    // x座標を音程マッピング
                    const scaleIndex = Math.floor((x / canvasWidth) * this.scale.length);
                    const octaveOffset = Math.floor((y / canvasHeight) * 3);
                    const octave = this.baseOctave + octaveOffset + 1;
                    const note = `${this.scale[scaleIndex]}${octave}`;
                    
                    // ニューロンの接続数に応じて音量を調整
                    const velocity = 0.3 + Math.min(0.6, selectedNeuron.connections.length * 0.05);
                    
                    // シンセリードでニューロンの音を演奏
                    this.instruments.synth.trigger(note, startTime, 1.2, velocity);
                }
            }
            
            // 接続数の多いニューロンを見つける（「中心的なニューロン」）
            if (currentBeat % 8 === 0 && activeNeurons.length > 0) {
                // 接続数でソート
                const sortedByConnections = [...activeNeurons].sort((a, b) => 
                    b.connections.length - a.connections.length
                );
                
                // 上位3つのニューロンを取得
                const centralNeurons = sortedByConnections.slice(0, 3);
                
                // 中心的なニューロンがあれば、そのニューロンに基づいてベース音を生成
                if (centralNeurons.length > 0) {
                    const centralNeuron = centralNeurons[0];
                    centralNeuron.fire(); // 視覚的にも強調
                    
                    // 中心ニューロンのx位置から音程を決定
                    const canvasWidth = centralNeuron.canvas.width;
                    const x = centralNeuron.x;
                    const scaleIndex = Math.floor((x / canvasWidth) * this.scale.length);
                    
                    const bassNote = `${this.scale[scaleIndex]}${this.baseOctave}`;
                    this.instruments.bass.trigger(bassNote, startTime, 2.0, 0.7);
                    
                    // 中心ニューロンに接続された他のニューロンも発火させる（カスケード効果）
                    if (centralNeuron.connections.length > 0) {
                        setTimeout(() => {
                            centralNeuron.connections.forEach(conn => {
                                if (conn.target && Math.random() < 0.3) {
                                    conn.target.fire();
                                }
                            });
                        }, beatTime * 500); // 遅延効果
                    }
                }
            }
            
            // パッドサウンドを大きなコード変化のタイミングで
            if (currentBeat % 8 === 0) {
                // ニューロンの分布を分析して和音を決定
                const areaMap = this.analyzeNeuronDistribution(activeNeurons);
                
                // 最も密度の高いエリアに基づいて和音を選択
                const densestArea = Object.keys(areaMap).sort((a, b) => areaMap[b] - areaMap[a])[0];
                const areaIdx = parseInt(densestArea);
                
                const chordBase = areaIdx % this.scale.length;
                const chordNote = `${this.scale[chordBase]}${this.baseOctave + 1}`;
                this.instruments.pad.trigger(chordNote, startTime, 4.0, 0.3);
            }
            
            this.beatCounter++;
        }, beatTime * 1000);
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

    
    // Web Audio APIのセットアップ
    setupAudio() {
        try {
            // AudioContextの作成
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // マスターゲイン（音量調整）
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.5;
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
        } catch (e) {
            console.error('Web Audio API is not supported or blocked:', e);
            this.enabled = false;
        }
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
            synth: new SynthInstrument(this.audioContext, this.reverb, this.delay),
            pad: new PadInstrument(this.audioContext, this.reverb),
            bass: new BassInstrument(this.audioContext, this.masterGain)
        };
    }
}

/**
 * インストゥルメントクラス：シンセリード
 */
class SynthInstrument {
    constructor(audioContext, reverbNode, delayNode) {
        this.audioContext = audioContext;
        this.reverbNode = reverbNode;
        this.delayNode = delayNode;
    }
    
    trigger(note, time, duration, velocity) {
        // オシレーター（音源）- より多くのオシレーターを使用
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const osc3 = this.audioContext.createOscillator(); // 追加
        
        // ゲイン（音量）
        const gainNode = this.audioContext.createGain();
        
        // フィルター
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass'; // bandpassに変更して特徴的な音に
        filter.frequency.value = 3000 + velocity * 2000;
        filter.Q.value = 3; // より鋭いフィルタリング
        
        // オシレーターの設定
        osc1.type = 'sine';  // 正弦波（よりクリアな音）
        osc2.type = 'triangle';  // 三角波（柔らかさを加える）
        osc3.type = 'square';  // 矩形波（少しのエッジを追加）
        
        // 周波数設定
        const freq = this.noteToFrequency(note);
        osc1.frequency.value = freq;
        osc2.frequency.value = freq * 2.0;  // 1オクターブ上
        osc3.frequency.value = freq * 1.01;  // わずかにデチューン
        
        // エンベロープ設定 - FFのクリスタル風の短い減衰音に
        const now = time;
        const attackTime = 0.005; // より速いアタック
        const decayTime = 0.15;  // 短い減衰
        const sustainLevel = velocity * 0.3; // 低いサステイン
        const releaseTime = 0.8;  // 長めのリリース
        
        // 音量エンベロープ
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(velocity, now + attackTime);
        gainNode.gain.exponentialRampToValueAtTime(sustainLevel, now + attackTime + decayTime);
        gainNode.gain.linearRampToValueAtTime(0, now + duration);
        
        // フィルターエンベロープ - キラキラ感を出す
        filter.frequency.setValueAtTime(5000, now);
        filter.frequency.exponentialRampToValueAtTime(2000, now + 0.2);
        
        // 接続
        osc1.connect(filter);
        osc2.connect(filter);
        osc3.connect(filter);
        filter.connect(gainNode);
        
        // エフェクト接続（リバーブとディレイ）
        const dryGain = this.audioContext.createGain();
        const wetGain1 = this.audioContext.createGain();
        const wetGain2 = this.audioContext.createGain();
        
        dryGain.gain.value = 0.6;
        wetGain1.gain.value = 0.3;  // リバーブを強く
        wetGain2.gain.value = 0.2;  // ディレイも強めに
        
        gainNode.connect(dryGain);
        gainNode.connect(wetGain1);
        gainNode.connect(wetGain2);
        
        dryGain.connect(this.audioContext.destination);
        wetGain1.connect(this.reverbNode);
        wetGain2.connect(this.delayNode);
        
        // 再生
        osc1.start(now);
        osc2.start(now);
        osc3.start(now);
        osc1.stop(now + duration + releaseTime);
        osc2.stop(now + duration + releaseTime);
        osc3.stop(now + duration + releaseTime);
    }
    
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
 * インストゥルメントクラス：パッド
 */
class PadInstrument {
    constructor(audioContext, reverbNode) {
        this.audioContext = audioContext;
        this.reverbNode = reverbNode;
    }
    
    trigger(note, time, duration, velocity) {
        // 複数のオシレータでコード風の音色を作る
        const oscCount = 3;
        const oscs = [];
        const gains = [];
        
        // フィルター
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1200;
        filter.Q.value = 1;
        
        // マスターゲイン
        const masterGain = this.audioContext.createGain();
        
        // 基本周波数
        const baseFreq = this.noteToFrequency(note);
        
        // コード構成音の周波数比率
        const ratios = [1, 1.26, 1.5];  // 基音、長3度、5度
        
        // エンベロープ設定
        const now = time;
        const attackTime = 0.3;
        const decayTime = 0.5;
        const sustainLevel = velocity * 0.4;
        const releaseTime = 1.0;
        
        // オシレーターとゲイン生成
        for (let i = 0; i < oscCount; i++) {
            oscs[i] = this.audioContext.createOscillator();
            gains[i] = this.audioContext.createGain();
            
            // オシレーター設定
            oscs[i].type = ['sine', 'triangle', 'sine'][i];
            oscs[i].frequency.value = baseFreq * ratios[i];
            
            // デチューン（自然な揺らぎ）
            if (i > 0) {
                oscs[i].detune.value = (Math.random() - 0.5) * 10;
            }
            
            // エンベロープ（各音ごとに少しずらす）
            const envOffset = i * 0.1;
            gains[i].gain.setValueAtTime(0, now);
            gains[i].gain.linearRampToValueAtTime(velocity * (1 - i * 0.2), now + attackTime + envOffset);
            gains[i].gain.linearRampToValueAtTime(sustainLevel * (1 - i * 0.1), now + attackTime + decayTime + envOffset);
            gains[i].gain.linearRampToValueAtTime(0, now + duration);
            
            // 接続
            oscs[i].connect(gains[i]);
            gains[i].connect(filter);
        }
        
        // フィルターをマスターゲインに接続
        filter.connect(masterGain);
        
        // エフェクト接続
        const dryGain = this.audioContext.createGain();
        const wetGain = this.audioContext.createGain();
        
        dryGain.gain.value = 0.4;
        wetGain.gain.value = 0.6;  // パッドは多めのリバーブ
        
        masterGain.connect(dryGain);
        masterGain.connect(wetGain);
        
        dryGain.connect(this.audioContext.destination);
        wetGain.connect(this.reverbNode);
        
        // マスターゲインのエンベロープ（全体の音量）
        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.linearRampToValueAtTime(velocity * 0.8, now + attackTime * 1.5);
        masterGain.gain.linearRampToValueAtTime(velocity * 0.6, now + attackTime + decayTime);
        masterGain.gain.linearRampToValueAtTime(0, now + duration + releaseTime);
        
        // 再生開始
        for (let i = 0; i < oscCount; i++) {
            oscs[i].start(now);
            oscs[i].stop(now + duration + releaseTime);
        }
    }
    
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
 * インストゥルメントクラス：ベース
 */
class BassInstrument {
    constructor(audioContext, outputNode) {
        this.audioContext = audioContext;
        this.outputNode = outputNode;
    }
    
    trigger(note, time, duration, velocity) {
        // ベース用オシレーター
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        
        // ゲインノード
        const gain = this.audioContext.createGain();
        
        // フィルター
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        filter.Q.value = 5;
        
        // オシレーター設定
        osc1.type = 'sawtooth';
        osc2.type = 'triangle';
        
        // 周波数設定（低めのベース音）
        const freq = this.noteToFrequency(note);
        osc1.frequency.value = freq;
        osc2.frequency.value = freq * 0.5;  // 1オクターブ下
        
        // エンベロープ設定
        const now = time;
        const attackTime = 0.01;
        const decayTime = 0.1;
        const sustainLevel = velocity * 0.7;
        const releaseTime = 0.2;
        
        // フィルターエンベロープ（ベース特有のうねり）
        filter.frequency.setValueAtTime(100, now);
        filter.frequency.linearRampToValueAtTime(800 + velocity * 1200, now + attackTime);
        filter.frequency.exponentialRampToValueAtTime(800, now + attackTime + decayTime);
        
        // 音量エンベロープ
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(velocity, now + attackTime);
        gain.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime);
        gain.gain.linearRampToValueAtTime(0, now + duration);
        
        // 接続
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.outputNode);
        
        // 再生
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + duration + releaseTime);
        osc2.stop(now + duration + releaseTime);
    }
    
    noteToFrequency(note) {
        const notePattern = /^([A-G][#b]?)(-?\d+)$/;
        const match = note.match(notePattern);
        
        if (!match) {
            console.error('Invalid note format:', note);
            return 55; // デフォルトは A1（低め）
        }
        
        const noteName = match[1];
        const octave = parseInt(match[2]);
        
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