// サウンド管理モジュール
const Sound = (function() {
    // サウンドコンテキスト
    let audioContext = null;
    
    // BGMと効果音のバッファ
    const bgmBuffers = {};
    const sfxBuffers = {};
    
    // 現在再生中のBGM
    let currentBgm = null;
    let currentBgmSource = null;
    
    // 音量設定
    let masterVolume = 0.6; // 1.0から0.6に下げる
    let bgmVolume = 0.3;    // 0.5から0.3に下げる
    let sfxVolume = 0.5;    // 0.8から0.5に下げる
    let isMuted = false;
    // サウンド準備完了のPromiseを追加
    let soundsLoadedPromise = null;

    // BGMリスト
    const bgmList = [
        { id: 'title_theme', path: Utils.getAssetPath('assets/sounds/bgm/title_theme.mp3') },
        { id: 'game_normal', path: Utils.getAssetPath('assets/sounds/bgm/game_normal.mp3') },
        { id: 'game_intense', path: Utils.getAssetPath('assets/sounds/bgm/game_intense.mp3') },
        { id: 'boss_battle', path: Utils.getAssetPath('assets/sounds/bgm/boss_battle.mp3') },
        { id: 'level_complete', path: Utils.getAssetPath('assets/sounds/bgm/level_complete.mp3') }
    ];
    
    // 効果音リスト
    const sfxList = [
        { id: 'weapon_normal', path: Utils.getAssetPath('assets/sounds/sfx/weapon_normal.mp3') },
        { id: 'weapon_sniper', path: Utils.getAssetPath('assets/sounds/sfx/weapon_sniper.mp3') },
        { id: 'weapon_radar_charge', path: Utils.getAssetPath('assets/sounds/sfx/weapon_radar_charge.mp3') },
        { id: 'weapon_radar_fire', path: Utils.getAssetPath('assets/sounds/sfx/weapon_radar_fire.mp3') },
        { id: 'lock_on', path: Utils.getAssetPath('assets/sounds/sfx/lock_on.mp3') },
        { id: 'reload', path: Utils.getAssetPath('assets/sounds/sfx/reload.mp3') },
        { id: 'weapon_switch', path: Utils.getAssetPath('assets/sounds/sfx/weapon_switch.mp3') },
        { id: 'enemy_spawn', path: Utils.getAssetPath('assets/sounds/sfx/enemy_spawn.mp3') },
        { id: 'enemy_hit', path: Utils.getAssetPath('assets/sounds/sfx/enemy_hit.mp3') },
        { id: 'enemy_destroy', path: Utils.getAssetPath('assets/sounds/sfx/enemy_destroy.mp3') },
        { id: 'enemy_boss_spawn', path: Utils.getAssetPath('assets/sounds/sfx/enemy_boss_spawn.mp3') },
        { id: 'enemy_boss_destroy', path: Utils.getAssetPath('assets/sounds/sfx/enemy_boss_destroy.mp3') },
        { id: 'button_click', path: Utils.getAssetPath('assets/sounds/sfx/button_click.mp3') },
        { id: 'level_up', path: Utils.getAssetPath('assets/sounds/sfx/level_up.mp3') },
        { id: 'game_over', path: Utils.getAssetPath('assets/sounds/sfx/game_over.mp3') },
        { id: 'warning', path: Utils.getAssetPath('assets/sounds/sfx/warning.mp3') },
        { id: 'powerup', path: Utils.getAssetPath('assets/sounds/sfx/powerup.mp3') },
        { id: 'shield_hit', path: Utils.getAssetPath('assets/sounds/sfx/shield_hit.mp3') }
    ];

    
    // 初期化
    // sound.js の修正
    // sound.js の init 関数の改善
    function init() {
        try {
            console.log('Initializing sound system');
            
            // AudioContextの作成
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContext = new AudioContext();
            
            console.log('AudioContext created, initial state:', audioContext.state);
            
            // マスターボリュームノード
            masterVolumeNode = audioContext.createGain();
            masterVolumeNode.gain.value = masterVolume;
            masterVolumeNode.connect(audioContext.destination);
            
            // サウンドの読み込みをPromise化
            soundsLoadedPromise = loadAllSoundsAsync();
            
            // サウンドのロード完了をログ
            soundsLoadedPromise.then(() => {
                console.log('All sounds loaded successfully. BGM buffers:', Object.keys(bgmBuffers));
            }).catch(err => {
                console.error('Error loading sounds:', err);
            });
            
            // ユーザーインタラクション待機の改善
            waitForUserInteraction();
        } catch (e) {
            console.error('Web Audio API error:', e);
        }
    }

    // 非同期サウンドロード
    function loadAllSoundsAsync() {
        const promises = [];
        
        // BGMの読み込み
        bgmList.forEach(item => {
            promises.push(new Promise(resolve => {
                loadSound(item.path, buffer => {
                    bgmBuffers[item.id] = buffer;
                    resolve();
                });
            }));
        });
        
        // 効果音の読み込み
        sfxList.forEach(item => {
            promises.push(new Promise(resolve => {
                loadSound(item.path, buffer => {
                    sfxBuffers[item.id] = buffer;
                    resolve();
                });
            }));
        });
        
        return Promise.all(promises);
    }

    function waitForUserInteraction() {
        const interactionEvents = ['mousedown', 'keydown', 'touchstart'];
        
        const unlockAudio = () => {
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume().then(() => {
                    console.log('AudioContext resumed successfully');
                    // 初回インタラクション後にBGM再生を試みる
                    if (currentBgm === null && Game.isPaused && !Game.isPaused()) {
                        playBgm('game_normal');
                    }
                });
            }
            
            interactionEvents.forEach(event => {
                document.removeEventListener(event, unlockAudio);
            });
        };
        
        interactionEvents.forEach(event => {
            document.addEventListener(event, unlockAudio);
        });
    }
    
    // すべてのサウンドを読み込む
    function loadAllSounds() {
        // BGMの読み込み
        bgmList.forEach(item => {
            loadSound(item.path, buffer => {
                bgmBuffers[item.id] = buffer;
            });
        });
        
        // 効果音の読み込み
        sfxList.forEach(item => {
            loadSound(item.path, buffer => {
                sfxBuffers[item.id] = buffer;
            });
        });
    }
    
    // サウンドの読み込み
    function loadSound(url, callback) {
        fetch(url)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                callback(audioBuffer);
            })
            .catch(error => {
                console.error('Error loading sound', url, error);
            });
    }
    
    // BGM再生関数を非同期に修正
    // sound.js の playBgm 関数の改善
    async function playBgm(id, loop = true) {
        if (isMuted) return;
        if (currentBgm === id) return;
        
        try {
            // ユーザーインタラクション確認のためのログ追加
            console.log('Playing BGM:', id, 'AudioContext state:', audioContext.state);
            
            // AudioContextが停止していたら再開
            if (audioContext.state === 'suspended') {
                console.log('Resuming AudioContext');
                await audioContext.resume();
            }
            
            // サウンドの読み込み確認
            if (!bgmBuffers[id]) {
                console.error(`BGM "${id}" is not loaded. Available BGMs:`, Object.keys(bgmBuffers));
                // ファイルパスを確認するためのログ
                console.log('BGM path:', Utils.getAssetPath(`assets/sounds/bgm/${id}.mp3`));
                return;
            }
            
            // 以下、既存のBGM再生コード
            stopBgm();
            
            const source = audioContext.createBufferSource();
            source.buffer = bgmBuffers[id];
            source.loop = loop;
            
            const gainNode = audioContext.createGain();
            gainNode.gain.value = bgmVolume;
            
            source.connect(gainNode);
            gainNode.connect(masterVolumeNode);
            
            source.start(0);
            console.log('BGM started successfully:', id);
            
            currentBgm = id;
            currentBgmSource = source;
        } catch (e) {
            console.error('Error playing BGM:', e);
        }
    }


    // サウンド準備完了状態を確認するメソッドを追加
    function isReady() {
        return soundsLoadedPromise;
    }

        
    // BGM停止
    function stopBgm() {
        if (currentBgmSource) {
            currentBgmSource.stop();
            currentBgmSource = null;
            currentBgm = null;
        }
    }
    
    // BGM一時停止
    function pauseBgm() {
        if (audioContext.state === 'running') {
            audioContext.suspend();
        }
    }
    
    // BGM再開
    function resumeBgm() {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }
    
    // 効果音再生
    function playSfx(id) {
        if (isMuted) return;
        
        // 効果音が読み込まれていない場合はスキップ
        if (!sfxBuffers[id]) {
            console.warn(`SFX "${id}" is not loaded yet`);
            return;
        }
        
        // 効果音の再生
        const source = audioContext.createBufferSource();
        source.buffer = sfxBuffers[id];
        
        // ボリューム設定
        const gainNode = audioContext.createGain();
        gainNode.gain.value = sfxVolume;
        
        // 接続
        source.connect(gainNode);
        gainNode.connect(masterVolumeNode);
        
        // 再生開始
        source.start(0);
    }
    
    // マスターボリューム設定
    function setMasterVolume(volume) {
        masterVolume = Math.max(0, Math.min(1, volume));
        masterVolumeNode.gain.value = masterVolume;
    }
    
    // BGMボリューム設定
    function setBgmVolume(volume) {
        bgmVolume = Math.max(0, Math.min(1, volume));
    }
    
    // 効果音ボリューム設定
    function setSfxVolume(volume) {
        sfxVolume = Math.max(0, Math.min(1, volume));
    }
    
    // ミュート切り替え
    function toggleMute() {
        isMuted = !isMuted;
        
        if (isMuted) {
            if (audioContext.state === 'running') {
                audioContext.suspend();
            }
        } else {
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
        }
        
        return isMuted;
    }
    
    // 公開APIにisReadyを追加
    return {
        init,
        playBgm,
        stopBgm,
        pauseBgm,
        resumeBgm,
        playSfx,
        setMasterVolume,
        setBgmVolume,
        setSfxVolume,
        toggleMute,
        isMuted: () => isMuted,
        isReady    // 追加
    };
})();