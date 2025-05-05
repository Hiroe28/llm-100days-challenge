import * as THREE from 'three';

// 改良版カメラコントロールとUIクラス
export class EnhancedControls {
    constructor(engine) {
        this.engine = engine;
        this.setupCameraPresets();
        this.setupEventListeners();
        this.isKidsMode = false;
        this.ambientSound = document.getElementById('ambient-sound');
        this.cameraSound = document.getElementById('camera-sound');
        
        // 写真モード用変数
        this.isPhotoMode = false;
        this.photoCanvas = null;
    }

    setupCameraPresets() {
        // カメラプリセットを作成
        this.cameraPresets = {
            // 北極ビュー
            northPole: {
                position: new THREE.Vector3(0, 12, 0),
                target: new THREE.Vector3(0, 0, 0)
            },
            // 南極ビュー
            southPole: {
                position: new THREE.Vector3(0, -12, 0),
                target: new THREE.Vector3(0, 0, 0)
            },
            // 全体ビュー（デフォルト）
            overview: {
                position: new THREE.Vector3(0, 2, 13),
                target: new THREE.Vector3(0, 0, 0)
            }
        };
    }

    setupEventListeners() {
        // コントロールパネルの開閉
        const togglePanelBtn = document.getElementById('toggle-panel');
        const panelContent = document.querySelector('.panel-content');
        
        togglePanelBtn.addEventListener('click', () => {
            togglePanelBtn.classList.toggle('collapsed');
            panelContent.classList.toggle('collapsed');
        });
        
        // カメラビューボタン
        document.getElementById('view-north').addEventListener('click', () => this.setCameraPreset('northPole'));
        document.getElementById('view-south').addEventListener('click', () => this.setCameraPreset('southPole'));
        document.getElementById('view-overview').addEventListener('click', () => this.setCameraPreset('overview'));
        
        // 自動回転切り替え
        document.getElementById('auto-rotate').addEventListener('change', (e) => {
            this.engine.autoRotate = e.target.checked;
            this.engine.controls.autoRotate = e.target.checked;
        });
        
        // オーロラ観測地点表示/非表示
        document.getElementById('show-locations').addEventListener('change', (e) => {
            if (this.engine.activePhenomenon) {
                this.engine.activePhenomenon.toggleLocationMarkers(e.target.checked);
            }
        });
        
        // 音声再生切り替え
        document.getElementById('play-music').addEventListener('change', (e) => {
            if (e.target.checked) {
                this.playAmbientSound();
            } else {
                this.stopAmbientSound();
            }
        });
        
        // プリセット選択
        const presetItems = document.querySelectorAll('.preset-item');
        presetItems.forEach(item => {
            item.addEventListener('click', () => {
                // アクティブクラスをすべて削除
                presetItems.forEach(p => p.classList.remove('active'));
                // クリックされた項目をアクティブに
                item.classList.add('active');
                
                // プリセットを適用
                const presetName = item.getAttribute('data-preset');
                if (this.engine.activePhenomenon) {
                    this.engine.activePhenomenon.applyPreset(presetName);
                }
                
                // キャプション表示
                this.showCaption(presetName);
            });
        });
        
        // スライダーコントロール
        document.getElementById('aurora-intensity').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('intensity-value').textContent = value.toFixed(1);
            
            if (this.engine.activePhenomenon && this.engine.activePhenomenon.auroraMaterial) {
                this.engine.activePhenomenon.params.intensity = value;
                this.engine.activePhenomenon.auroraMaterial.uniforms.intensity.value = value;
            }
        });
        
        document.getElementById('aurora-speed').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('speed-value').textContent = value.toFixed(1);
            
            if (this.engine.activePhenomenon && this.engine.activePhenomenon.auroraMaterial) {
                this.engine.activePhenomenon.params.speed = value;
                this.engine.activePhenomenon.auroraMaterial.uniforms.speed.value = value;
            }
        });
        
        document.getElementById('aurora-height').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('height-value').textContent = value.toFixed(1);
            
            if (this.engine.activePhenomenon && this.engine.activePhenomenon.auroraMaterial) {
                this.engine.activePhenomenon.params.height = value;
                this.engine.activePhenomenon.auroraMaterial.uniforms.height.value = value;
            }
        });
        
        // キッズモード切り替え
        document.getElementById('toggle-kids-mode').addEventListener('click', () => {
            this.toggleKidsMode();
        });
        
        // 写真撮影
        document.getElementById('take-photo').addEventListener('click', () => {
            this.takePhoto();
        });
        
        // 写真保存
        document.getElementById('save-photo').addEventListener('click', () => {
            this.savePhoto();
        });
        
        // 写真キャンセル
        document.getElementById('cancel-photo').addEventListener('click', () => {
            this.closePhotoMode();
        });
        
        // フルスクリーン切り替え
        document.getElementById('fullscreen').addEventListener('click', () => {
            this.toggleFullscreen();
        });
        
        // 情報モーダル表示
        document.getElementById('show-info').addEventListener('click', () => {
            document.getElementById('info-modal').classList.remove('hidden');
        });
        
        // モーダルを閉じる
        document.querySelector('.close-modal').addEventListener('click', () => {
            document.getElementById('info-modal').classList.add('hidden');
        });
        
        // スライダー値の初期表示を更新
        document.getElementById('intensity-value').textContent = 
            document.getElementById('aurora-intensity').value;
        
        document.getElementById('speed-value').textContent = 
            document.getElementById('aurora-speed').value;
        
        document.getElementById('height-value').textContent = 
            document.getElementById('aurora-height').value;
        
        // プリセットの初期選択状態
        document.querySelector('.preset-item[data-preset="green"]').classList.add('active');
    }

    // カメラプリセットの設定
    setCameraPreset(presetName) {
        if (!this.cameraPresets[presetName]) return;
        
        const preset = this.cameraPresets[presetName];
        
        // アニメーションで移動するためのカスタム実装
        const startPos = this.engine.camera.position.clone();
        const startTarget = this.engine.controls.target.clone();
        const endPos = preset.position.clone();
        const endTarget = preset.target.clone();
        
        const duration = 1000; // 1秒
        const startTime = performance.now();
        
        const animateCamera = (time) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // イージング関数（滑らかな動き）
            const eased = this.easeInOutCubic(progress);
            
            // カメラ位置の補間
            this.engine.camera.position.lerpVectors(startPos, endPos, eased);
            
            // ターゲット位置の補間
            this.engine.controls.target.lerpVectors(startTarget, endTarget, eased);
            
            // コントロールとカメラの更新
            this.engine.controls.update();
            
            // アニメーションが完了していなければ続行
            if (progress < 1) {
                requestAnimationFrame(animateCamera);
            }
        };
        
        // アニメーション開始
        requestAnimationFrame(animateCamera);
    }
    
    // キッズモード切り替え
    toggleKidsMode() {
        this.isKidsMode = !this.isKidsMode;
        document.body.classList.toggle('kids-mode', this.isKidsMode);
        
        // オーロラの表示も変更
        if (this.engine.activePhenomenon) {
            this.engine.activePhenomenon.applyKidsMode(this.isKidsMode);
        }
        
        // キャプション表示
        if (this.isKidsMode) {
            document.getElementById('aurora-caption').classList.remove('hidden');
            // 自動回転を有効に
            document.getElementById('auto-rotate').checked = true;
            this.engine.autoRotate = true;
            this.engine.controls.autoRotate = true;
        } else {
            document.getElementById('aurora-caption').classList.add('hidden');
        }
    }
    
    // 写真撮影
    takePhoto() {
        // カメラシャッター音
        this.playCameraSound();
        
        // 現在のレンダラーの状態を保存
        const currentAutoRotate = this.engine.autoRotate;
        this.engine.autoRotate = false;
        
        // 一度レンダリングを強制実行（最新の状態を確実に描画）
        this.engine.composer.render();
        
        // キャンバスから画像を生成
        const canvas = this.engine.renderer.domElement;
        this.photoCanvas = document.createElement('canvas');
        this.photoCanvas.width = canvas.width;
        this.photoCanvas.height = canvas.height;
        
        // レンダラーから直接画像を取得（try-catchで囲む）
        try {
            const context = this.photoCanvas.getContext('2d');
            context.drawImage(canvas, 0, 0);
            
            // 写真プレビュー表示
            const photoContainer = document.getElementById('photo-container');
            photoContainer.innerHTML = '';
            
            const photoImg = document.createElement('img');
            photoImg.src = this.photoCanvas.toDataURL('image/png');
            photoImg.style.maxWidth = '100%';
            photoImg.style.height = 'auto';
            photoContainer.appendChild(photoImg);
            
            // オーバーレイを表示
            document.getElementById('photo-overlay').classList.remove('hidden');
            
            console.log('写真を撮影しました：', photoImg.src.substring(0, 50) + '...');
        } catch (e) {
            console.error('写真の撮影に失敗しました:', e);
            alert('写真の撮影に失敗しました。もう一度お試しください。');
        }
        
        this.isPhotoMode = true;
        this.engine.autoRotate = currentAutoRotate;
    }
    
    // 写真保存
    savePhoto() {
        if (!this.photoCanvas) return;
        
        // a要素を使って画像をダウンロード
        const link = document.createElement('a');
        link.download = `aurora-${new Date().toISOString().replace(/:/g, '-')}.png`;
        link.href = this.photoCanvas.toDataURL('image/png');
        link.click();
        
        // 写真モードを閉じる
        this.closePhotoMode();
    }
    
    // 写真モードを閉じる
    closePhotoMode() {
        document.getElementById('photo-overlay').classList.add('hidden');
        this.isPhotoMode = false;
        this.photoCanvas = null;
    }
    
    // フルスクリーン切り替え
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error('フルスクリーンに切り替えできませんでした:', err);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }
    
    // キャプション表示
    showCaption(presetName) {
        const captionEl = document.getElementById('aurora-caption');
        let captionText = '';
        
        switch (presetName) {
            case 'green':
                captionText = 'グリーンオーロラは酸素原子が高い高度で光ることで作られるんだ。一番よく見られるオーロラだよ！';
                break;
            case 'purple':
                captionText = 'パープルとピンクのオーロラは窒素分子が低い高度で光ったときに見られるよ。とってもキレイだね！';
                break;
            case 'red':
                captionText = '赤いオーロラは酸素原子がとっても高い高度で光るときに見られる珍しいオーロラだよ。宝物を見つけたみたいだね！';
                break;
            case 'rainbow':
                captionText = '虹色のオーロラは空の魔法みたい！いろんな種類の粒子が大気の中で光り輝いているんだよ。';
                break;
            default:
                captionText = 'オーロラは太陽から飛んできた粒子が地球の磁場と大気の中で光る現象だよ。';
        }
        
        captionEl.querySelector('p').textContent = captionText;
        
        // キッズモードでなければ非表示に
        if (this.isKidsMode) {
            captionEl.classList.remove('hidden');
        }
    }
    
    // 音楽を再生
    playAmbientSound() {
        if (this.ambientSound) {
            this.ambientSound.volume = 0.3;
            
            // 音声ファイルが読み込めるかチェック
            if (this.ambientSound.readyState >= 2) {
                this.ambientSound.play().catch(e => {
                    console.warn('自動再生できませんでした:', e);
                });
            } else {
                console.log('音声ファイルが利用できないため、サウンドはスキップします');
            }
        }
    }
    
    // 音楽を停止
    stopAmbientSound() {
        if (this.ambientSound && !this.ambientSound.paused) {
            try {
                this.ambientSound.pause();
            } catch (e) {
                console.log('音声の停止に失敗しましたが、問題ありません');
            }
        }
    }
    
    // カメラシャッター音
    playCameraSound() {
        if (this.cameraSound) {
            try {
                this.cameraSound.currentTime = 0;
                this.cameraSound.play().catch(e => {
                    // エラーは無視
                });
            } catch (e) {
                // 音声が利用できなくても問題なし
            }
        }
    }
    
    // UIコントロールの状態を更新（プリセット変更時など）
    updateUIControls() {
        if (!this.engine.activePhenomenon) return;
        
        const params = this.engine.activePhenomenon.params;
        
        // スライダーの値を更新
        document.getElementById('aurora-intensity').value = params.intensity;
        document.getElementById('intensity-value').textContent = params.intensity.toFixed(1);
        
        document.getElementById('aurora-speed').value = params.speed;
        document.getElementById('speed-value').textContent = params.speed.toFixed(1);
        
        document.getElementById('aurora-height').value = params.height;
        document.getElementById('height-value').textContent = params.height.toFixed(1);
    }
    
    // イージング関数
    easeInOutCubic(t) {
        return t < 0.5 
            ? 4 * t * t * t 
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
}