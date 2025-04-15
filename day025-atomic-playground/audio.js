/**
 * 分子サウンドシステム - 原子の相互作用に基づいた音響効果を生成
 */
class MoleculeSoundSystem {
    constructor() {
        // 音量設定
        this.volume = 0.3; // デフォルト音量30%
        
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
        
        // 元素ごとの音色マッピング
        this.elementSoundMap = {
            'H': { instrument: 'crystal', octaveOffset: 1, noteDuration: 0.8 },
            'O': { instrument: 'pad', octaveOffset: 0, noteDuration: 1.5 },
            'C': { instrument: 'bass', octaveOffset: -1, noteDuration: 1.2 },
            'N': { instrument: 'synth', octaveOffset: 0, noteDuration: 1.0 },
            'Cl': { instrument: 'noise', octaveOffset: -1, noteDuration: 0.7 }
        };
        
        // イベント音のマッピング
        this.eventSounds = {
            'bond': { instrument: 'pluck', pitchRange: [60, 72], velocityRange: [0.6, 0.9] },
            'bondBreak': { instrument: 'noise', pitchRange: [40, 50], velocityRange: [0.4, 0.7] },
            'atomCreated': { instrument: 'crystal', pitchRange: [72, 84], velocityRange: [0.5, 0.8] },
            'moleculeRecognized': { instrument: 'bell', pitchRange: [60, 72], velocityRange: [0.7, 1.0] },
            'success': { instrument: 'bell', pitchRange: [72, 84], velocityRange: [0.8, 1.0] }
        };
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
                intervals = [0, 2, 4, 7, 9]; // ペンタトニックスケール
                break;
            case 'wholeTone':
                intervals = [0, 2, 4, 6, 8, 10]; // 全音階
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
    
    // 原子のサウンド再生
    playAtomSound(atomData) {
        // 音声コンテキストが準備できていなければスキップ
        if (!this.ensureAudioContext() || !this.enabled) {
            return;
        }
        
        const now = performance.now();
        if (now - this.lastNoteTime < this.minTimeBetweenNotes) return;
        this.lastNoteTime = now;
        
        // 原子の種類に基づいて音色とパラメータを設定
        const element = atomData.element;
        const soundParams = this.elementSoundMap[element] || this.elementSoundMap['H'];
        
        // 原子の位置から音程とパラメータを決定
        const x = atomData.x;
        const y = atomData.y;
        const canvasWidth = atomData.canvasWidth || 1000;
        const canvasHeight = atomData.canvasHeight || 800;
        
        // x座標を音程マッピング
        const scaleIndex = Math.floor((x / canvasWidth) * this.scale.length);
        const octaveOffset = Math.floor((y / canvasHeight) * 3); // 3オクターブの範囲
        const octave = this.baseOctave + octaveOffset + (soundParams.octaveOffset || 0);
        const note = `${this.scale[scaleIndex]}${octave}`;
        
        // 結合数とエネルギーに基づいて音量と音長を調整
        const velocity = Math.min(0.9, 0.3 + atomData.bonds * 0.1);
        const duration = soundParams.noteDuration * (1 + atomData.isPartOfMolecule * 0.5);
        
        // 音の再生時刻
        const startTime = this.audioContext.currentTime;
        
        // 原子の種類に基づいて適切な音色で再生
        switch (soundParams.instrument) {
            case 'crystal':
                this.instruments.crystal.trigger(note, startTime, duration, velocity);
                break;
            case 'pad':
                this.instruments.pad.trigger(note, startTime, duration * 1.5, velocity * 0.8);
                break;
            case 'bass':
                this.instruments.bass.trigger(note, startTime, duration * 0.8, velocity * 0.9);
                break;
            case 'synth':
                this.instruments.synth.trigger(note, startTime, duration, velocity);
                break;
            case 'noise':
                this.instruments.noise.trigger(note, startTime, duration * 0.5, velocity * 0.7);
                break;
            default:
                this.instruments.crystal.trigger(note, startTime, duration, velocity);
        }
        
        return {
            note,
            time: startTime,
            duration,
            velocity
        };
    }
    
    // イベント発生時のサウンド再生
    playEventSound(eventType, params = {}) {
        if (!this.ensureAudioContext() || !this.enabled) {
            return;
        }
        
        const eventConfig = this.eventSounds[eventType];
        if (!eventConfig) return;
        
        // イベントパラメータに基づいて音程と音量を決定
        const startTime = this.audioContext.currentTime;
        const pitchRange = eventConfig.pitchRange;
        const velocityRange = eventConfig.velocityRange;
        
        // パラメータに基づいて値を調整（0-1の範囲）
        const pitchFactor = params.pitchFactor !== undefined ? params.pitchFactor : Math.random();
        const velocityFactor = params.velocityFactor !== undefined ? params.velocityFactor : Math.random();
        
        // MIDIノート番号から周波数への変換
        const midiNote = pitchRange[0] + pitchFactor * (pitchRange[1] - pitchRange[0]);
        const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);
        
        // 音量計算
        const velocity = velocityRange[0] + velocityFactor * (velocityRange[1] - velocityRange[0]);
        
        // 音色と長さの設定
        const instrument = this.instruments[eventConfig.instrument] || this.instruments.crystal;
        const duration = params.duration || 0.5;
        
        // 音を再生
        switch (eventType) {
            case 'bond':
                // 結合音 - 柔らかく明るい音
                this.instruments.pluck.trigger(frequency, startTime, duration, velocity);
                break;
            case 'bondBreak':
                // 結合破壊音 - 短くノイジーな音
                this.instruments.noise.trigger(frequency, startTime, duration * 0.3, velocity);
                break;
            case 'atomCreated':
                // 原子生成音 - 明るくクリアな音
                this.instruments.crystal.trigger(frequency, startTime, duration * 0.5, velocity);
                break;
            case 'moleculeRecognized':
                // 分子認識音 - 印象的な音
                this.instruments.bell.trigger(frequency, startTime, duration * 2, velocity);
                // 和音で強調
                setTimeout(() => {
                    this.instruments.bell.trigger(frequency * 1.5, this.audioContext.currentTime, duration, velocity * 0.7);
                }, 150);
                break;
            default:
                instrument.trigger(frequency, startTime, duration, velocity);
        }
    }
    
    // 分子認識音の再生
    playMoleculeRecognizedSound(molecule) {
        if (!this.ensureAudioContext() || !this.enabled) {
            return;
        }
        
        // 分子の大きさに基づいてパラメータを調整
        const atomCount = molecule.atoms.size;
        const pitchFactor = Math.min(1, atomCount / 10); // 原子数が多いほど低い音に
        const velocityFactor = Math.min(1, 0.5 + atomCount * 0.1); // 原子数が多いほど大きな音に
        
        // 分子認識サウンドを再生
        this.playEventSound('moleculeRecognized', {
            pitchFactor: 1 - pitchFactor, // 反転して大きい分子ほど低い音に
            velocityFactor: velocityFactor,
            duration: 1.0 + atomCount * 0.2 // 分子が大きいほど長い音に
        });
        
        // 分子を構成する原子の種類に基づいた和音を追加
        const atomTypes = new Set();
        molecule.atoms.forEach(atom => {
            atomTypes.add(atom.element);
        });
        
        // 和音演奏
        let delay = 200;
        Array.from(atomTypes).forEach((element, index) => {
            const soundParams = this.elementSoundMap[element] || this.elementSoundMap['H'];
            const octave = this.baseOctave + (soundParams.octaveOffset || 0);
            const note = `${this.scale[index % this.scale.length]}${octave}`;
            
            setTimeout(() => {
                const startTime = this.audioContext.currentTime;
                const instrument = this.instruments[soundParams.instrument] || this.instruments.crystal;
                instrument.trigger(note, startTime, 1.5, 0.5);
            }, delay);
            
            delay += 150;
        });
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
                    this.masterGain.gain.value = this.volume;
                }
            }, 100);
        }
        
        // アクティブな音をクリア
        this.activeNotes.clear();
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
    
    // Web Audio APIのセットアップ
    setupAudio() {
        try {
            // AudioContextの作成
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            
            // モバイルデバイス向けオプション
            const contextOptions = {
                latencyHint: 'interactive',
                sampleRate: 44100
            };
            
            this.audioContext = new AudioContextClass(contextOptions);
            console.log('AudioContext initialized with state:', this.audioContext.state);
            
            // マスターゲイン（音量調整）
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.volume;
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
            
            console.log('Audio system setup complete');
        } catch (e) {
            console.error('Web Audio API setup failed:', e);
            this.enabled = false;
        }
    }
    
    // 音声コンテキストを確実に開始するメソッド
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
    
    // リバーブエフェクトを作成
    createReverb() {
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
    
    // 音色の設定
    setupInstruments() {
        this.instruments = {
            // 木琴のような明るい音色
            crystal: new XylophoneInstrument(this.audioContext, this.reverb, this.delay, this.masterGain),
            // 柔らかいパッド音
            pad: new SoftPadInstrument(this.audioContext, this.reverb, this.masterGain),
            // より柔らかいベース音
            bass: new SoftBassInstrument(this.audioContext, this.masterGain),
            // 明るいシンセ音
            synth: new BrightSynthInstrument(this.audioContext, this.reverb, this.delay, this.masterGain),
            // 柔らかいノイズ
            noise: new SoftNoiseInstrument(this.audioContext, this.masterGain),
            // 鈴の音
            bell: new BellInstrument(this.audioContext, this.reverb, this.masterGain),
            // プラック音（より明るく）
            pluck: new BrightPluckInstrument(this.audioContext, this.reverb, this.masterGain)
        };
        
        // イベント音も改善
        this.eventSounds = {
            'bond': { instrument: 'pluck', pitchRange: [60, 72], velocityRange: [0.6, 0.9] },
            'bondBreak': { instrument: 'noise', pitchRange: [50, 60], velocityRange: [0.4, 0.7] },
            'atomCreated': { instrument: 'crystal', pitchRange: [72, 84], velocityRange: [0.5, 0.8] },
            'moleculeRecognized': { instrument: 'bell', pitchRange: [60, 72], velocityRange: [0.7, 1.0] },
            'success': { instrument: 'bell', pitchRange: [72, 84], velocityRange: [0.8, 1.0] },
            'goal-progress': { instrument: 'crystal', pitchRange: [65, 77], velocityRange: [0.6, 0.9] }
        };
    }

}


/**
 * 木琴風の音色クラス - 子供向けの明るい音
 */
class XylophoneInstrument {
    constructor(audioContext, reverbNode, delayNode, outputNode) {
        this.audioContext = audioContext;
        this.reverbNode = reverbNode;
        this.delayNode = delayNode;
        this.outputNode = outputNode;
    }
    
    trigger(note, time, duration, velocity) {
        // 周波数を計算
        const freq = typeof note === 'string' ? this.noteToFrequency(note) : note;
        
        // シンプルな2つのオシレーター
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        
        // ゲインノード
        const gain1 = this.audioContext.createGain();
        const gain2 = this.audioContext.createGain();
        const masterGain = this.audioContext.createGain();
        
        // オシレーター設定（木琴っぽい倍音構成）
        osc1.type = 'sine';  // 基音はサイン波
        osc1.frequency.value = freq;
        
        osc2.type = 'triangle'; // 倍音はトライアングル波
        osc2.frequency.value = freq * 3; // 3倍音強調
        
        // ゲイン設定
        gain1.gain.value = 0.7;
        gain2.gain.value = 0.2; // 倍音は控えめに
        
        // エンベロープ（木琴風の急速な減衰）
        const now = time;
        const attackTime = 0.005; // 非常に短いアタック
        const decayTime = 0.1; // 短い減衰
        
        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.linearRampToValueAtTime(velocity, now + attackTime);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration); // 指数関数的減衰
        
        // 接続
        osc1.connect(gain1);
        osc2.connect(gain2);
        gain1.connect(masterGain);
        gain2.connect(masterGain);
        
        // エフェクト接続（軽いリバーブのみ）
        const dryGain = this.audioContext.createGain();
        const reverbGain = this.audioContext.createGain();
        
        dryGain.gain.value = 0.8;
        reverbGain.gain.value = 0.2; // 軽いリバーブ
        
        masterGain.connect(dryGain);
        masterGain.connect(reverbGain);
        
        dryGain.connect(this.outputNode);
        reverbGain.connect(this.reverbNode);
        
        // 再生開始
        osc1.start(now);
        osc2.start(now);
        
        // 停止
        const stopTime = now + duration + 0.1;
        osc1.stop(stopTime);
        osc2.stop(stopTime);
    }
    
    noteToFrequency(note) {
        const notePattern = /^([A-G][#b]?)(-?\d+)$/;
        const match = note.match(notePattern);
        
        if (!match) {
            console.error('Invalid note format:', note);
            return 440;
        }
        
        const noteName = match[1];
        const octave = parseInt(match[2]);
        
        const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteIndex = chromaticScale.indexOf(noteName);
        
        if (noteIndex === -1) {
            console.error('Invalid note name:', noteName);
            return 440;
        }
        
        const A4 = 440;
        const A4NoteIndex = chromaticScale.indexOf('A');
        const A4Octave = 4;
        
        const semitonesFromA4 = (octave - A4Octave) * 12 + (noteIndex - A4NoteIndex);
        
        return A4 * Math.pow(2, semitonesFromA4 / 12);
    }
}

/**
 * 柔らかいパッド音色 - より優しい持続音
 */
class SoftPadInstrument {
    constructor(audioContext, reverbNode, outputNode) {
        this.audioContext = audioContext;
        this.reverbNode = reverbNode;
        this.outputNode = outputNode;
    }
    
    trigger(note, time, duration, velocity) {
        // 周波数を計算
        const freq = typeof note === 'string' ? this.noteToFrequency(note) : note;
        
        // 3つのオシレーターで柔らかい音色を作る
        const oscCount = 3;
        const oscs = [];
        const gains = [];
        
        // マスターゲイン
        const masterGain = this.audioContext.createGain();
        
        // フィルターで柔らかくする
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1200;
        filter.Q.value = 0.5; // 緩やかなカット
        
        // 周波数比率と波形（柔らかい音色用）
        const ratios = [1, 1.01, 2]; // 基音、微デチューン、オクターブ上
        const waveTypes = ['sine', 'sine', 'sine']; // すべてサイン波で柔らかく
        const volumeRatios = [0.7, 0.2, 0.1]; // ミックス比率
        
        // エンベロープ設定（ゆっくり立ち上がり、ゆっくり減衰）
        const now = time;
        const attackTime = 0.2; // より長いアタック
        const decayTime = 0.5;
        const sustainLevel = Math.max(0.001, velocity * 0.3);
        const releaseTime = 0.5; // 柔らかいリリース
        
        // オシレーターとゲイン生成
        for (let i = 0; i < oscCount; i++) {
            oscs[i] = this.audioContext.createOscillator();
            gains[i] = this.audioContext.createGain();
            
            // オシレーター設定
            oscs[i].type = waveTypes[i];
            oscs[i].frequency.value = freq * ratios[i];
            
            // 微妙なピッチ変動
            if (i > 0) {
                oscs[i].detune.value = (Math.random() - 0.5) * 5;
            }
            
            // 個別エンベロープ（スタート時間を少しずらす）
            const envOffset = i * 0.05;
            gains[i].gain.value = 0;
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
                now + duration
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
        
        dryGain.gain.value = 0.6; // 原音を多め
        wetGain.gain.value = 0.4; // リバーブは控えめ
        
        masterGain.connect(dryGain);
        masterGain.connect(wetGain);
        
        dryGain.connect(this.outputNode);
        wetGain.connect(this.reverbNode);
        
        // マスターゲインのエンベロープ
        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.linearRampToValueAtTime(velocity * 0.4, now + attackTime);
        masterGain.gain.linearRampToValueAtTime(velocity * 0.3, now + attackTime + decayTime);
        masterGain.gain.linearRampToValueAtTime(0.001, now + duration);
        
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
            return 440;
        }
        
        const noteName = match[1];
        const octave = parseInt(match[2]);
        
        const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteIndex = chromaticScale.indexOf(noteName);
        
        if (noteIndex === -1) {
            console.error('Invalid note name:', noteName);
            return 440;
        }
        
        const A4 = 440;
        const A4NoteIndex = chromaticScale.indexOf('A');
        const A4Octave = 4;
        
        const semitonesFromA4 = (octave - A4Octave) * 12 + (noteIndex - A4NoteIndex);
        
        return A4 * Math.pow(2, semitonesFromA4 / 12);
    }
}



/**
 * 柔らかいベース音色
 */
class SoftBassInstrument {
    constructor(audioContext, outputNode) {
        this.audioContext = audioContext;
        this.outputNode = outputNode;
    }
    
    trigger(note, time, duration, velocity) {
        // 周波数を計算
        const freq = typeof note === 'string' ? this.noteToFrequency(note) : note;
        
        // 2つのオシレーターで柔らかいベース音を作る
        const mainOsc = this.audioContext.createOscillator();
        const subOsc = this.audioContext.createOscillator();
        
        // ゲインノード
        const mainGain = this.audioContext.createGain();
        const subGain = this.audioContext.createGain();
        const masterGain = this.audioContext.createGain();
        
        // フィルター
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 500; // より低めのカットオフで柔らかく
        filter.Q.value = 0.7; // 緩やかなレゾナンス
        
        // オシレーター設定（柔らかいベース音向け）
        mainOsc.type = 'sine'; // サイン波でより柔らかく
        mainOsc.frequency.value = freq;
        
        subOsc.type = 'sine';
        subOsc.frequency.value = freq * 0.5; // 1オクターブ下
        
        // ゲイン設定
        mainGain.gain.value = 0.7;
        subGain.gain.value = 0.3; // サブオシレーターも適度に
        
        // エンベロープ設定（より柔らかいアタックとリリース）
        const now = time;
        const attackTime = 0.1; // より長いアタック
        const decayTime = 0.2;
        const sustainLevel = velocity * 0.6;
        const releaseTime = 0.3; // 柔らかいリリース
        
        // マスターゲインのエンベロープ
        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.linearRampToValueAtTime(velocity * 0.6, now + attackTime);
        masterGain.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime);
        masterGain.gain.linearRampToValueAtTime(0.001, now + duration);
        
        // フィルターエンベロープ（より柔らかい動き）
        filter.frequency.setValueAtTime(100, now);
        filter.frequency.linearRampToValueAtTime(500 + velocity * 200, now + attackTime);
        filter.frequency.exponentialRampToValueAtTime(400, now + attackTime + decayTime);
        
        // 接続
        mainOsc.connect(mainGain);
        subOsc.connect(subGain);
        
        mainGain.connect(filter);
        subGain.connect(filter);
        
        filter.connect(masterGain);
        masterGain.connect(this.outputNode);
        
        // 再生
        mainOsc.start(now);
        subOsc.start(now);
        
        // 停止
        mainOsc.stop(now + duration + releaseTime);
        subOsc.stop(now + duration + releaseTime);
    }
    
    noteToFrequency(note) {
        const notePattern = /^([A-G][#b]?)(-?\d+)$/;
        const match = note.match(notePattern);
        
        if (!match) {
            console.error('Invalid note format:', note);
            return 55;
        }
        
        const noteName = match[1];
        const octave = parseInt(match[2]);
        
        const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteIndex = chromaticScale.indexOf(noteName);
        
        if (noteIndex === -1) {
            console.error('Invalid note name:', noteName);
            return 55;
        }
        
        const A4 = 440;
        const A4NoteIndex = chromaticScale.indexOf('A');
        const A4Octave = 4;
        
        const semitonesFromA4 = (octave - A4Octave) * 12 + (noteIndex - A4NoteIndex);
        
        return A4 * Math.pow(2, semitonesFromA4 / 12);
    }
}

/**
 * 明るいシンセ音色
 */
class BrightSynthInstrument {
    constructor(audioContext, reverbNode, delayNode, outputNode) {
        this.audioContext = audioContext;
        this.reverbNode = reverbNode;
        this.delayNode = delayNode;
        this.outputNode = outputNode;
    }
    
    trigger(note, time, duration, velocity) {
        // 周波数を計算
        const freq = typeof note === 'string' ? this.noteToFrequency(note) : note;
        
        // 2つのオシレーターで明るい音色を構成
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        
        // ゲインノード
        const gain1 = this.audioContext.createGain();
        const gain2 = this.audioContext.createGain();
        const masterGain = this.audioContext.createGain();
        
        // フィルター（明るい音色用）
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'highpass'; // 高音を強調
        filter.frequency.value = 300;
        filter.Q.value = 1;
        
        // オシレーター設定
        osc1.type = 'triangle'; // より柔らかい波形
        osc1.frequency.value = freq;
        
        osc2.type = 'sine';
        osc2.frequency.value = freq * 2; // オクターブ上
        
        // ゲイン設定
        gain1.gain.value = 0.6;
        gain2.gain.value = 0.2;
        
        // エンベロープ設定
        const now = time;
        const attackTime = 0.05;
        const decayTime = 0.1;
        const sustainLevel = velocity * 0.5;
        const releaseTime = 0.2;
        
        // マスターゲインのエンベロープ
        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.linearRampToValueAtTime(velocity, now + attackTime);
        masterGain.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime);
        masterGain.gain.linearRampToValueAtTime(0.001, now + duration);
        
        // フィルターエンベロープ
        filter.frequency.setValueAtTime(300, now);
        filter.frequency.linearRampToValueAtTime(1000 + velocity * 1000, now + attackTime);
        filter.frequency.exponentialRampToValueAtTime(500, now + attackTime + decayTime);
        
        // 接続
        osc1.connect(gain1);
        osc2.connect(gain2);
        
        gain1.connect(filter);
        gain2.connect(filter);
        
        filter.connect(masterGain);
        
        // エフェクト接続（軽いリバーブとディレイ）
        const dryGain = this.audioContext.createGain();
        const reverbGain = this.audioContext.createGain();
        const delayGain = this.audioContext.createGain();
        
        dryGain.gain.value = 0.7;
        reverbGain.gain.value = 0.2;
        delayGain.gain.value = 0.1;
        
        masterGain.connect(dryGain);
        masterGain.connect(reverbGain);
        masterGain.connect(delayGain);
        
        dryGain.connect(this.outputNode);
        reverbGain.connect(this.reverbNode);
        delayGain.connect(this.delayNode);
        
        // 再生
        osc1.start(now);
        osc2.start(now);
        
        // 停止
        osc1.stop(now + duration + releaseTime);
        osc2.stop(now + duration + releaseTime);
    }
    
    noteToFrequency(note) {
        const notePattern = /^([A-G][#b]?)(-?\d+)$/;
        const match = note.match(notePattern);
        
        if (!match) {
            console.error('Invalid note format:', note);
            return 440;
        }
        
        const noteName = match[1];
        const octave = parseInt(match[2]);
        
        const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteIndex = chromaticScale.indexOf(noteName);
        
        if (noteIndex === -1) {
            console.error('Invalid note name:', noteName);
            return 440;
        }
        
        const A4 = 440;
        const A4NoteIndex = chromaticScale.indexOf('A');
        const A4Octave = 4;
        
        const semitonesFromA4 = (octave - A4Octave) * 12 + (noteIndex - A4NoteIndex);
        
        return A4 * Math.pow(2, semitonesFromA4 / 12);
    }
}

/**
 * 柔らかいノイズ音源
 */
class SoftNoiseInstrument {
    constructor(audioContext, outputNode) {
        this.audioContext = audioContext;
        this.outputNode = outputNode;
    }
    
    trigger(note, time, duration, velocity) {
        // バッファサイズ
        const bufferSize = this.audioContext.sampleRate;
        const noiseBuffer = this.audioContext.createBuffer(2, bufferSize, this.audioContext.sampleRate);
        
        // より柔らかいノイズを生成（ピンクノイズに近い特性）
        for (let channel = 0; channel < noiseBuffer.numberOfChannels; channel++) {
            const data = noiseBuffer.getChannelData(channel);
            let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0;
            
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                
                // ピンクノイズフィルター（より柔らかい音質）
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                
                data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            }
        }
        
        // バッファソースノード
        const noiseSource = this.audioContext.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        noiseSource.loop = true;
        
        // フィルター
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        
        // 周波数を計算（中心周波数として使用）
        const freq = typeof note === 'string' ? this.noteToFrequency(note) : note;
        filter.frequency.value = Math.min(freq, 1000); // 上限を設定
        filter.Q.value = 1.5; // より広めのバンド
        
        // マスターゲイン
        const masterGain = this.audioContext.createGain();
        
        // エンベロープ設定（より柔らかい立ち上がりと減衰）
        const now = time;
        const attackTime = 0.05; // より長いアタック
        const decayTime = 0.1;
        const sustainLevel = velocity * 0.2; // 全体的に音量を下げる
        const releaseTime = 0.2; // 長めのリリース
        
        // マスターゲインのエンベロープ
        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.linearRampToValueAtTime(velocity * 0.3, now + attackTime);
        masterGain.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime);
        masterGain.gain.linearRampToValueAtTime(0.001, now + duration);
        
        // フィルターエンベロープ
        filter.frequency.setValueAtTime(freq * 0.8, now);
        filter.frequency.linearRampToValueAtTime(freq * 1.2, now + attackTime);
        filter.frequency.exponentialRampToValueAtTime(freq, now + attackTime + decayTime);
        
        // 接続
        noiseSource.connect(filter);
        filter.connect(masterGain);
        masterGain.connect(this.outputNode);
        
        // 再生
        noiseSource.start(now);
        noiseSource.stop(now + duration + releaseTime);
    }
    
    noteToFrequency(note) {
        const notePattern = /^([A-G][#b]?)(-?\d+)$/;
        const match = note.match(notePattern);
        
        if (!match) {
            console.error('Invalid note format:', note);
            return 440;
        }
        
        const noteName = match[1];
        const octave = parseInt(match[2]);
        
        const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteIndex = chromaticScale.indexOf(noteName);
        
        if (noteIndex === -1) {
            console.error('Invalid note name:', noteName);
            return 440;
        }
        
        const A4 = 440;
        const A4NoteIndex = chromaticScale.indexOf('A');
        const A4Octave = 4;
        
        const semitonesFromA4 = (octave - A4Octave) * 12 + (noteIndex - A4NoteIndex);
        
        return A4 * Math.pow(2, semitonesFromA4 / 12);
    }
}

/**
 * 明るいプラック音色（ギター/ハープ風）
 */
class BrightPluckInstrument {
    constructor(audioContext, reverbNode, outputNode) {
        this.audioContext = audioContext;
        this.reverbNode = reverbNode;
        this.outputNode = outputNode;
    }
    
    trigger(note, time, duration, velocity) {
        // 周波数を計算
        const freq = typeof note === 'string' ? this.noteToFrequency(note) : note;
        
        // ノイズバッファの生成（カルプルスストロング法の基礎）
        const bufferSize = Math.floor(this.audioContext.sampleRate / freq);
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // 明るい音色のための初期ノイズ（より規則的なパターン）
        for (let i = 0; i < bufferSize; i++) {
            // ランダムノイズよりも規則的なパターンを使用
            data[i] = Math.sin(i / bufferSize * Math.PI * 2 * 3) * 0.5 + (Math.random() * 0.5);
        }
        
        // バッファソースノード
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        
        // フィードバックディレイ（カルプルスストロング法の実装）
        const feedbackDelay = this.audioContext.createDelay();
        feedbackDelay.delayTime.value = 1 / freq;
        
        // フィードバックゲイン
        const feedbackGain = this.audioContext.createGain();
        feedbackGain.gain.value = 0.95; // 高い値ほど余韻が長くなる
        
        // ローパスフィルター（フィードバック内でのハイ成分の減衰）
        const feedbackFilter = this.audioContext.createBiquadFilter();
        feedbackFilter.type = 'lowpass';
        feedbackFilter.frequency.value = 7000; // より高い値で明るい音色に
        
        // マスターゲイン
        const masterGain = this.audioContext.createGain();
        
        // エンベロープ設定
        const now = time;
        const attackTime = 0.005;
        const initialGain = velocity * 0.8; // 音量を全体的に調整
        const decayTime = duration * 0.6;
        
        // ゲインエンベロープ（プラック音源らしい急速な減衰）
        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.linearRampToValueAtTime(initialGain, now + attackTime);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + decayTime);
        
        // フィードバックループの接続
        source.connect(masterGain);
        masterGain.connect(feedbackDelay);
        feedbackDelay.connect(feedbackFilter);
        feedbackFilter.connect(feedbackGain);
        feedbackGain.connect(feedbackDelay);
        
        // 出力接続
        const dryGain = this.audioContext.createGain();
        const reverbGain = this.audioContext.createGain();
        
        dryGain.gain.value = 0.8;
        reverbGain.gain.value = 0.2; // 軽いリバーブ
        
        masterGain.connect(dryGain);
        masterGain.connect(reverbGain);
        
        dryGain.connect(this.outputNode);
        reverbGain.connect(this.reverbNode);
        
        // 再生開始
        source.start(now);
        source.stop(now + decayTime + 0.1);
    }
    
    noteToFrequency(note) {
        const notePattern = /^([A-G][#b]?)(-?\d+)$/;
        const match = note.match(notePattern);
        
        if (!match) {
            console.error('Invalid note format:', note);
            return 440;
        }
        
        const noteName = match[1];
        const octave = parseInt(match[2]);
        
        const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteIndex = chromaticScale.indexOf(noteName);
        
        if (noteIndex === -1) {
            console.error('Invalid note name:', noteName);
            return 440;
        }
        
        const A4 = 440;
        const A4NoteIndex = chromaticScale.indexOf('A');
        const A4Octave = 4;
        
        const semitonesFromA4 = (octave - A4Octave) * 12 + (noteIndex - A4NoteIndex);
        
        return A4 * Math.pow(2, semitonesFromA4 / 12);
    }
}


/**
 * クリスタル音源 - 透明感のある高音域の音色
 */
class CrystalInstrument {
    constructor(audioContext, reverbNode, delayNode, outputNode) {
        this.audioContext = audioContext;
        this.reverbNode = reverbNode;
        this.delayNode = delayNode;
        this.outputNode = outputNode;
    }
    
    trigger(note, time, duration, velocity) {
        // 周波数を計算（文字列の音名または直接周波数）
        const freq = typeof note === 'string' ? this.noteToFrequency(note) : note;
        
        // 3つのオシレーターでより豊かな音色を実現
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const osc3 = this.audioContext.createOscillator();
        
        // 個別のゲインノード
        const gain1 = this.audioContext.createGain();
        const gain2 = this.audioContext.createGain();
        const gain3 = this.audioContext.createGain();
        const masterGain = this.audioContext.createGain();
        
        // フィルター
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1800;
        filter.Q.value = 2;
        
        // 2番目のフィルター
        const highFilter = this.audioContext.createBiquadFilter();
        highFilter.type = 'highshelf';
        highFilter.frequency.value = 3000;
        highFilter.gain.value = 6;
        
        // オシレーターの設定
        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc3.type = 'sine';
        
        // 周波数設定
        osc1.frequency.value = freq;
        osc2.frequency.value = freq * 1.003;
        osc3.frequency.value = freq * 2;
        
        // ゲイン設定
        gain1.gain.value = 0.6;
        gain2.gain.value = 0.3;
        gain3.gain.value = 0.15;
        
        // エンベロープ設定
        const now = time;
        const attackTime = 0.02;
        const decayTime = 0.15;
        const sustainLevel = Math.max(0.001, velocity * 0.4);
        const releaseTime = 0.3;
        
        // マスターゲインのエンベロープ
        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.linearRampToValueAtTime(velocity, now + attackTime);
        masterGain.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime);
        masterGain.gain.linearRampToValueAtTime(0.001, now + duration);
        
        // フィルターエンベロープ
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
        reverbGain.gain.value = 0.35;
        delayGain.gain.value = 0.2;
        
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
    
    noteToFrequency(note) {
        const notePattern = /^([A-G][#b]?)(-?\d+)$/;
        const match = note.match(notePattern);
        
        if (!match) {
            console.error('Invalid note format:', note);
            return 440;
        }
        
        const noteName = match[1];
        const octave = parseInt(match[2]);
        
        const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteIndex = chromaticScale.indexOf(noteName);
        
        if (noteIndex === -1) {
            console.error('Invalid note name:', noteName);
            return 440;
        }
        
        const A4 = 440;
        const A4NoteIndex = chromaticScale.indexOf('A');
        const A4Octave = 4;
        
        const semitonesFromA4 = (octave - A4Octave) * 12 + (noteIndex - A4NoteIndex);
        
        return A4 * Math.pow(2, semitonesFromA4 / 12);
    }
}

/**
 * パッド音源 - 和音的な持続音
 */
class PadInstrument {
    constructor(audioContext, reverbNode, outputNode) {
        this.audioContext = audioContext;
        this.reverbNode = reverbNode;
        this.outputNode = outputNode;
    }
    
    trigger(note, time, duration, velocity) {
        // 周波数を計算
        const freq = typeof note === 'string' ? this.noteToFrequency(note) : note;
        
        // 5つのオシレーターで豊かな音色を実現
        const oscCount = 5;
        const oscs = [];
        const gains = [];
        
        // フィルター
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 900;
        filter.Q.value = 0.8;
        
        // マスターゲイン
        const masterGain = this.audioContext.createGain();
        
        // 周波数比率と波形タイプ
        const ratios = [1, 1.01, 2, 1.5, 1.25];
        const waveTypes = ['sine', 'sine', 'sine', 'triangle', 'sine'];
        const volumeRatios = [0.7, 0.3, 0.15, 0.2, 0.25];
        
        // エンベロープ設定
        const now = time;
        const attackTime = 0.5;
        const decayTime = 0.8;
        const sustainLevel = Math.max(0.001, velocity * 0.3);
        const releaseTime = 1.5;
        
        // オシレーターとゲイン生成
        for (let i = 0; i < oscCount; i++) {
            oscs[i] = this.audioContext.createOscillator();
            gains[i] = this.audioContext.createGain();
            
            // オシレーター設定
            oscs[i].type = waveTypes[i];
            oscs[i].frequency.value = freq * ratios[i];
            
            // わずかなピッチ変動
            if (i > 0) {
                oscs[i].detune.value = (Math.random() - 0.5) * 5;
            }
            
            // 個別のエンベロープ
            const envOffset = i * 0.12;
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
                now + duration - (oscCount - i) * 0.1
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
        
        dryGain.gain.value = 0.3;
        wetGain.gain.value = 0.7;
        
        masterGain.connect(dryGain);
        masterGain.connect(wetGain);
        
        dryGain.connect(this.outputNode);
        wetGain.connect(this.reverbNode);
        
        // マスターゲインのエンベロープ
        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.linearRampToValueAtTime(velocity * 0.5, now + attackTime * 1.2);
        masterGain.gain.linearRampToValueAtTime(velocity * 0.4, now + attackTime + decayTime);
        masterGain.gain.linearRampToValueAtTime(0.001, now + duration + releaseTime);
        
        // 再生開始
        for (let i = 0; i < oscCount; i++) {
            oscs[i].start(now);
            oscs[i].stop(now + duration + releaseTime + 0.1);
        }
    }
    
    noteToFrequency(note) {
        const notePattern = /^([A-G][#b]?)(-?\d+)$/;
        const match = note.match(notePattern);
        
        if (!match) {
            console.error('Invalid note format:', note);
            return 440;
        }
        
        const noteName = match[1];
        const octave = parseInt(match[2]);
        
        const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteIndex = chromaticScale.indexOf(noteName);
        
        if (noteIndex === -1) {
            console.error('Invalid note name:', noteName);
            return 440;
        }
        
        const A4 = 440;
        const A4NoteIndex = chromaticScale.indexOf('A');
        const A4Octave = 4;
        
        const semitonesFromA4 = (octave - A4Octave) * 12 + (noteIndex - A4NoteIndex);
        
        return A4 * Math.pow(2, semitonesFromA4 / 12);
    }
}

/**
 * ベース音源 - 低音域の音色
 */
class BassInstrument {
    constructor(audioContext, outputNode) {
        this.audioContext = audioContext;
        this.outputNode = outputNode;
    }
    
    trigger(note, time, duration, velocity) {
        // 周波数を計算
        const freq = typeof note === 'string' ? this.noteToFrequency(note) : note;
        
        // 3つのオシレーターで豊かな音色を実現
        const mainOsc = this.audioContext.createOscillator();
        const subOsc = this.audioContext.createOscillator();
        const harmOsc = this.audioContext.createOscillator();
        
        // 個別のゲインノード
        const mainGain = this.audioContext.createGain();
        const subGain = this.audioContext.createGain();
        const harmGain = this.audioContext.createGain();
        const masterGain = this.audioContext.createGain();
        
        // フィルター
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 700;
        filter.Q.value = 1;
        
        // オシレーター設定
        mainOsc.type = 'triangle';
        mainOsc.frequency.value = freq;
        
        subOsc.type = 'sine';
        subOsc.frequency.value = freq * 0.5;
        
        harmOsc.type = 'sine';
        harmOsc.frequency.value = freq * 1.5;
        
        // ゲイン設定
        mainGain.gain.value = 0.7;
        subGain.gain.value = 0.5;
        harmGain.gain.value = 0.15;
        
        // エンベロープ設定
        const now = time;
        const attackTime = 0.08;
        const decayTime = 0.3;
        const sustainLevel = velocity * 0.7;
        const releaseTime = 0.4;
        
        // マスターゲインのエンベロープ
        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.linearRampToValueAtTime(velocity, now + attackTime);
        masterGain.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime);
        masterGain.gain.linearRampToValueAtTime(0.001, now + duration);
        
        // フィルターエンベロープ
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
        
        // 再生
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
            return 55;
        }
        
        const noteName = match[1];
        const octave = parseInt(match[2]);
        
        const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteIndex = chromaticScale.indexOf(noteName);
        
        if (noteIndex === -1) {
            console.error('Invalid note name:', noteName);
            return 55;
        }
        
        const A4 = 440;
        const A4NoteIndex = chromaticScale.indexOf('A');
        const A4Octave = 4;
        
        const semitonesFromA4 = (octave - A4Octave) * 12 + (noteIndex - A4NoteIndex);
        
        return A4 * Math.pow(2, semitonesFromA4 / 12);
    }
}

/**
 * シンセリード音源 - 主旋律向けの音色
 */
class SynthInstrument {
    constructor(audioContext, reverbNode, delayNode, outputNode) {
        this.audioContext = audioContext;
        this.reverbNode = reverbNode;
        this.delayNode = delayNode;
        this.outputNode = outputNode;
    }
    
    trigger(note, time, duration, velocity) {
        // 周波数を計算
        const freq = typeof note === 'string' ? this.noteToFrequency(note) : note;
        
        // 2つのオシレーターで音色を構成
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        
        // ゲインノード
        const gain1 = this.audioContext.createGain();
        const gain2 = this.audioContext.createGain();
        const masterGain = this.audioContext.createGain();
        
        // フィルター
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        filter.Q.value = 4;
        
        // オシレーター設定
        osc1.type = 'sawtooth';
        osc1.frequency.value = freq;
        
        osc2.type = 'square';
        osc2.frequency.value = freq;
        osc2.detune.value = -10; // わずかにデチューン
        
        // ゲイン設定
        gain1.gain.value = 0.5;
        gain2.gain.value = 0.3;
        
        // エンベロープ設定
        const now = time;
        const attackTime = 0.05;
        const decayTime = 0.2;
        const sustainLevel = velocity * 0.5;
        const releaseTime = 0.3;
        
        // マスターゲインのエンベロープ
        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.linearRampToValueAtTime(velocity, now + attackTime);
        masterGain.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime);
        masterGain.gain.linearRampToValueAtTime(0.001, now + duration);
        
        // フィルターエンベロープ
        filter.frequency.setValueAtTime(600, now);
        filter.frequency.linearRampToValueAtTime(1500 + velocity * 2000, now + attackTime);
        filter.frequency.exponentialRampToValueAtTime(1200, now + attackTime + decayTime);
        
        // 接続
        osc1.connect(gain1);
        osc2.connect(gain2);
        
        gain1.connect(filter);
        gain2.connect(filter);
        
        filter.connect(masterGain);
        
        // エフェクト接続
        const dryGain = this.audioContext.createGain();
        const reverbGain = this.audioContext.createGain();
        const delayGain = this.audioContext.createGain();
        
        dryGain.gain.value = 0.6;
        reverbGain.gain.value = 0.2;
        delayGain.gain.value = 0.1;
        
        masterGain.connect(dryGain);
        masterGain.connect(reverbGain);
        masterGain.connect(delayGain);
        
        dryGain.connect(this.outputNode);
        reverbGain.connect(this.reverbNode);
        delayGain.connect(this.delayNode);
        
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
            return 440;
        }
        
        const noteName = match[1];
        const octave = parseInt(match[2]);
        
        const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteIndex = chromaticScale.indexOf(noteName);
        
        if (noteIndex === -1) {
            console.error('Invalid note name:', noteName);
            return 440;
        }
        
        const A4 = 440;
        const A4NoteIndex = chromaticScale.indexOf('A');
        const A4Octave = 4;
        
        const semitonesFromA4 = (octave - A4Octave) * 12 + (noteIndex - A4NoteIndex);
        
        return A4 * Math.pow(2, semitonesFromA4 / 12);
    }
}

/**
 * ノイズ音源 - 非周期的な音色
 */
class NoiseInstrument {
    constructor(audioContext, outputNode) {
        this.audioContext = audioContext;
        this.outputNode = outputNode;
    }
    
    trigger(note, time, duration, velocity) {
        // バッファサイズ
        const bufferSize = this.audioContext.sampleRate * 2;
        const noiseBuffer = this.audioContext.createBuffer(2, bufferSize, this.audioContext.sampleRate);
        
        // バッファにノイズを生成
        for (let channel = 0; channel < noiseBuffer.numberOfChannels; channel++) {
            const data = noiseBuffer.getChannelData(channel);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
        }
        
        // バッファソースノード
        const noiseSource = this.audioContext.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        noiseSource.loop = true;
        
        // フィルター
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        
        // 周波数を計算（中心周波数として使用）
        const freq = typeof note === 'string' ? this.noteToFrequency(note) : note;
        filter.frequency.value = freq;
        filter.Q.value = 1;
        
        // マスターゲイン
        const masterGain = this.audioContext.createGain();
        
        // エンベロープ設定
        const now = time;
        const attackTime = 0.02;
        const decayTime = 0.1;
        const sustainLevel = velocity * 0.3;
        const releaseTime = 0.2;
        
        // マスターゲインのエンベロープ
        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.linearRampToValueAtTime(velocity * 0.7, now + attackTime);
        masterGain.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime);
        masterGain.gain.linearRampToValueAtTime(0.001, now + duration);
        
        // フィルターエンベロープ
        filter.frequency.setValueAtTime(freq * 0.8, now);
        filter.frequency.linearRampToValueAtTime(freq * 1.2, now + attackTime);
        filter.frequency.exponentialRampToValueAtTime(freq, now + attackTime + decayTime);
        
        // 接続
        noiseSource.connect(filter);
        filter.connect(masterGain);
        masterGain.connect(this.outputNode);
        
        // 再生
        noiseSource.start(now);
        noiseSource.stop(now + duration + releaseTime);
    }
    
    noteToFrequency(note) {
        const notePattern = /^([A-G][#b]?)(-?\d+)$/;
        const match = note.match(notePattern);
        
        if (!match) {
            console.error('Invalid note format:', note);
            return 440;
        }
        
        const noteName = match[1];
        const octave = parseInt(match[2]);
        
        const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteIndex = chromaticScale.indexOf(noteName);
        
        if (noteIndex === -1) {
            console.error('Invalid note name:', noteName);
            return 440;
        }
        
        const A4 = 440;
        const A4NoteIndex = chromaticScale.indexOf('A');
        const A4Octave = 4;
        
        const semitonesFromA4 = (octave - A4Octave) * 12 + (noteIndex - A4NoteIndex);
        
        return A4 * Math.pow(2, semitonesFromA4 / 12);
    }
}

/**
 * プラック音源 - 弦を弾いたような減衰音
 */
class PluckInstrument {
    constructor(audioContext, reverbNode, outputNode) {
        this.audioContext = audioContext;
        this.reverbNode = reverbNode;
        this.outputNode = outputNode;
    }
    
    trigger(note, time, duration, velocity) {
        // 周波数を計算
        const freq = typeof note === 'string' ? this.noteToFrequency(note) : note;
        
        // ノイズバッファの生成（カルプルスストロング法の基礎）
        const bufferSize = Math.floor(this.audioContext.sampleRate / freq);
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // ノイズデータの生成
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        // バッファソースノード
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        
        // フィードバックディレイ（カルプルスストロング法の実装）
        const feedbackDelay = this.audioContext.createDelay();
        feedbackDelay.delayTime.value = 1 / freq;
        
        // フィードバックゲイン
        const feedbackGain = this.audioContext.createGain();
        feedbackGain.gain.value = 0.95; // 高い値ほど余韻が長くなる
        
        // ローパスフィルター（フィードバック内でのハイ成分の減衰）
        const feedbackFilter = this.audioContext.createBiquadFilter();
        feedbackFilter.type = 'lowpass';
        feedbackFilter.frequency.value = 5000;
        
        // マスターゲイン
        const masterGain = this.audioContext.createGain();
        
        // エンベロープ設定
        const now = time;
        const attackTime = 0.005;
        const initialGain = velocity;
        const decayTime = duration * 0.8;
        
        // ゲインエンベロープ（プラック音源らしい急速な減衰）
        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.linearRampToValueAtTime(initialGain, now + attackTime);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + decayTime);
        
        // フィードバックループの接続
        source.connect(masterGain);
        masterGain.connect(feedbackDelay);
        feedbackDelay.connect(feedbackFilter);
        feedbackFilter.connect(feedbackGain);
        feedbackGain.connect(feedbackDelay);
        
        // 出力接続
        masterGain.connect(this.outputNode);
        
        // リバーブ接続（少量）
        const reverbGain = this.audioContext.createGain();
        reverbGain.gain.value = 0.2;
        masterGain.connect(reverbGain);
        reverbGain.connect(this.reverbNode);
        
        // 再生開始
        source.start(now);
        source.stop(now + decayTime + 0.1);
    }
    
    noteToFrequency(note) {
        const notePattern = /^([A-G][#b]?)(-?\d+)$/;
        const match = note.match(notePattern);
        
        if (!match) {
            console.error('Invalid note format:', note);
            return 440;
        }
        
        const noteName = match[1];
        const octave = parseInt(match[2]);
        
        const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteIndex = chromaticScale.indexOf(noteName);
        
        if (noteIndex === -1) {
            console.error('Invalid note name:', noteName);
            return 440;
        }
        
        const A4 = 440;
        const A4NoteIndex = chromaticScale.indexOf('A');
        const A4Octave = 4;
        
        const semitonesFromA4 = (octave - A4Octave) * 12 + (noteIndex - A4NoteIndex);
        
        return A4 * Math.pow(2, semitonesFromA4 / 12);
    }
}

/**
 * ベル音源 - 金属的で倍音が豊かな音色
 */
class BellInstrument {
    constructor(audioContext, reverbNode, outputNode) {
        this.audioContext = audioContext;
        this.reverbNode = reverbNode;
        this.outputNode = outputNode;
    }
    
    trigger(note, time, duration, velocity) {
        // 周波数を計算
        const freq = typeof note === 'string' ? this.noteToFrequency(note) : note;
        
        // 複数のオシレーターで倍音構造を作成
        const oscCount = 6;
        const oscs = [];
        const gains = [];
        
        // 倍音比率（ベル音源の特性を模倣）
        const ratios = [1, 2.0, 3.0, 4.2, 5.4, 6.8];
        const volumes = [1.0, 0.6, 0.4, 0.25, 0.2, 0.15];
        
        // マスターゲイン
        const masterGain = this.audioContext.createGain();
        
        // 各オシレーターの設定
        for (let i = 0; i < oscCount; i++) {
            oscs[i] = this.audioContext.createOscillator();
            gains[i] = this.audioContext.createGain();
            
            // オシレーター設定
            oscs[i].type = i === 0 ? 'sine' : 'sine'; // 基音はサイン波
            oscs[i].frequency.value = freq * ratios[i];
            
            // 初期ゲイン設定
            gains[i].gain.value = volumes[i] * velocity;
            
            // 減衰時間をずらして非線形な減衰を実現
            const decayTime = duration * (1 - i * 0.1);
            
            // 指数関数的な減衰
            gains[i].gain.setValueAtTime(volumes[i] * velocity, time);
            gains[i].gain.exponentialRampToValueAtTime(0.001, time + decayTime);
            
            // 接続
            oscs[i].connect(gains[i]);
            gains[i].connect(masterGain);
        }
        
        // マスターゲイン設定
        masterGain.gain.value = 0.5;
        
        // 出力とリバーブに接続
        const dryGain = this.audioContext.createGain();
        const reverbGain = this.audioContext.createGain();
        
        dryGain.gain.value = 0.7;
        reverbGain.gain.value = 0.5; // ベルは残響が重要
        
        masterGain.connect(dryGain);
        masterGain.connect(reverbGain);
        
        dryGain.connect(this.outputNode);
        reverbGain.connect(this.reverbNode);
        
        // 再生開始
        for (let i = 0; i < oscCount; i++) {
            oscs[i].start(time);
            oscs[i].stop(time + duration);
        }
    }
    
    noteToFrequency(note) {
        const notePattern = /^([A-G][#b]?)(-?\d+)$/;
        const match = note.match(notePattern);
        
        if (!match) {
            console.error('Invalid note format:', note);
            return 440;
        }
        
        const noteName = match[1];
        const octave = parseInt(match[2]);
        
        const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteIndex = chromaticScale.indexOf(noteName);
        
        if (noteIndex === -1) {
            console.error('Invalid note name:', noteName);
            return 440;
        }
        
        const A4 = 440;
        const A4NoteIndex = chromaticScale.indexOf('A');
        const A4Octave = 4;
        
        const semitonesFromA4 = (octave - A4Octave) * 12 + (noteIndex - A4NoteIndex);
        
        return A4 * Math.pow(2, semitonesFromA4 / 12);
    }
}