// main.js の修正版
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';

// シミュレーションクラスのインポート
import AuroraSimulation from './aurora.js';
import { EnhancedControls } from './controls.js';

// 改良版コアエンジンクラス - オーロラに特化
class AuroraEngine {
    constructor() {
        // グローバルパラメータ
        this.params = {
            bloomStrength: 1.0,      // 発光を抑える
            bloomThreshold: 0.3,     // しきい値を上げる
            bloomRadius: 0.5,        // 広がりを抑える
            exposure: 0.9            // 露出を下げる
        };
        
        // 自動回転フラグ
        this.autoRotate = false;
        
        // 初期化
        this.init();
        this.setupPostProcessing();
        
        // 操作コントローラの追加
        this.enhancedControls = new EnhancedControls(this);
        
        // テクスチャロード -> オーロラシミュレーションロードの順に実行
        this.loadTextures();
        
        // ロード完了時の処理
        this.setupLoadingScreen();
        
        // アニメーションループを開始
        this.animate();
    }
    
    init() {
        // レンダラーの設定
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000011);  // より深い青黒色の背景
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = this.params.exposure;
        document.getElementById('container').appendChild(this.renderer.domElement);
        
        // シーンの作成
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x000011, 0.0005);  // 霧効果を追加
        
        // カメラの設定
        this.camera = new THREE.PerspectiveCamera(
            60, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(0, 2, 13);  // より地球を見下ろす位置に
        
        // カメラコントロールの設定
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1;
        this.controls.rotateSpeed = 0.5;     // より滑らかに
        this.controls.zoomSpeed = 0.8;
        this.controls.panSpeed = 0.8;
        this.controls.minDistance = 10;     // 最小距離を調整
        this.controls.maxDistance = 20;      // 最大距離を少し短く
        this.controls.autoRotate = false;
        this.controls.autoRotateSpeed = 0.3; // ゆっくり回転
        this.controls.enableZoom = true;     // ズームを明示的に有効化
        this.controls.mouseButtons = {
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,       // 中ボタンでもズーム可能に
            RIGHT: THREE.MOUSE.PAN
        };
        
        // 改善: 光源を減らし、強さを調整
        this.setupLighting();
        
        // 宇宙背景の作成
        this.createEnhancedStarfield();
        
        // リサイズイベントリスナー
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
        
        // 現在のアクティブな現象インスタンス
        this.activePhenomenon = null;
        
        // スクロールの挙動を調整するカスタムイベントハンドラを追加
        this.renderer.domElement.addEventListener('wheel', this.handleMouseWheel.bind(this), { passive: false });
    }
    
    setupLighting() {
        // 光源を減らし、強度を調整
        // 環境光 - バランス調整
        const ambientLight = new THREE.AmbientLight(0x333344, 0.6); 
        this.scene.add(ambientLight);
        
        // 主光源（太陽光） - 一つの主要な光源に集約
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8); 
        mainLight.position.set(10, 10, 20); 
        this.scene.add(mainLight);
        
        // 極地方を強調する光 - 一つに減らす
        const polarLight = new THREE.PointLight(0x6699ff, 0.5, 30); 
        polarLight.position.set(0, 12, 0);
        this.scene.add(polarLight);
    }
    
    setupPostProcessing() {
        // レンダーパス
        const renderPass = new RenderPass(this.scene, this.camera);
        
        // ブルームパス（発光効果）
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            this.params.bloomStrength,
            this.params.bloomRadius,
            this.params.bloomThreshold
        );
        
        // アンチエイリアシングパス
        this.fxaaPass = new ShaderPass(FXAAShader);
        this.fxaaPass.material.uniforms['resolution'].value.set(
            1 / (window.innerWidth * this.renderer.getPixelRatio()),
            1 / (window.innerHeight * this.renderer.getPixelRatio())
        );
        
        // エフェクトコンポーザーの設定
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderPass);
        this.composer.addPass(this.bloomPass);
        this.composer.addPass(this.fxaaPass);
    }
    
    loadTextures() {
        // テクスチャローダー
        this.textureLoader = new THREE.TextureLoader();
        this.textures = {};
        
        // テクスチャロード用の進行状況追跡
        this.texturesTotal = 1;  // 地球テクスチャのみをロード
        this.texturesLoaded = 0;
        
        // エラーハンドリングを含むテクスチャ読み込み関数（重要な修正部分）
        const loadTexture = (url, key) => {
            try {
                this.textureLoader.load(
                    url,
                    texture => {
                        this.textures[key] = texture;
                        this.texturesLoaded++;
                        
                        // ロード進行状況の更新
                        this.updateLoadingProgress();
                        
                        console.log(`テクスチャをロードしました: ${key} (${this.texturesLoaded}/${this.texturesTotal})`);
                        
                        // 重要な修正: テクスチャのロード完了後にオーロラをロード
                        if (this.texturesLoaded >= this.texturesTotal) {
                            // テクスチャのロードが完了したらオーロラをロード
                            this.loadAurora();
                        }
                    },
                    undefined,
                    error => {
                        console.warn(`テクスチャのロードに失敗しました: ${key}`, error);
                        this.textures[key] = null;
                        this.texturesLoaded++;
                        
                        // エラーでもプログレスは進める
                        this.updateLoadingProgress();
                        
                        // エラー時にもオーロラをロード
                        if (this.texturesLoaded >= this.texturesTotal) {
                            this.loadAurora();
                        }
                    }
                );
            } catch (e) {
                console.error(`テクスチャのロード処理でエラーが発生しました: ${key}`, e);
                this.textures[key] = null;
                this.texturesLoaded++;
                this.updateLoadingProgress();
                
                // 例外発生時にもオーロラをロード
                if (this.texturesLoaded >= this.texturesTotal) {
                    this.loadAurora();
                }
            }
        };
        
        // ローディング画面のアイコンを地球のテクスチャとして利用
        loadTexture('images/earth.jpg', 'earth');
    }
    
    updateLoadingProgress() {
        const progressPercent = (this.texturesLoaded / this.texturesTotal) * 100;
        const progressBar = document.querySelector('.loading-progress-bar');
        
        if (progressBar) {
            progressBar.style.width = `${progressPercent}%`;
        }
        
        // すべてのテクスチャがロードされたら
        if (this.texturesLoaded >= this.texturesTotal) {
            // 少し遅延して表示（演出のため）
            setTimeout(() => {
                this.hideLoadingScreen();
            }, 500);
        }
    }
    
    setupLoadingScreen() {
        // ロード画面の準備
        const loadingScreen = document.getElementById('loading-screen');
        
        // 既に読み込みが完了している場合（キャッシュなど）
        if (this.texturesLoaded >= this.texturesTotal) {
            // 少し遅延して表示（演出のため）
            setTimeout(() => {
                this.hideLoadingScreen();
            }, 1000);
        }
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            
            // フェードアウト後に非表示
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                
                // BGM自動再生（ユーザー操作後にのみ再生可能なブラウザ対応）
                if (document.getElementById('play-music').checked) {
                    this.enhancedControls.playAmbientSound();
                }
            }, 500);
        }
    }
    
    createEnhancedStarfield() {
        // より美しい星空を作成
        
        // 遠い星々（小さく多数）
        const farStarsGeometry = new THREE.BufferGeometry();
        const farStarsCount = 8000;
        const farStarsPositions = new Float32Array(farStarsCount * 3);
        const farStarsSizes = new Float32Array(farStarsCount);
        const farStarsColors = new Float32Array(farStarsCount * 3);
        
        // 遠い星の設定
        for (let i = 0; i < farStarsCount; i++) {
            // 座標をランダムに分布
            const radius = 100 + Math.random() * 900; // 100〜1000の範囲
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            farStarsPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            farStarsPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            farStarsPositions[i * 3 + 2] = radius * Math.cos(phi);
            
            // サイズをランダムに設定（小さめ）
            farStarsSizes[i] = 0.5 + Math.random() * 1.0;
            
            // 色をランダムに設定（青白系中心）
            const colorChoice = Math.random();
            if (colorChoice < 0.6) {
                // 青白系（多め）
                farStarsColors[i * 3] = 0.8 + Math.random() * 0.2; // R
                farStarsColors[i * 3 + 1] = 0.8 + Math.random() * 0.2; // G
                farStarsColors[i * 3 + 2] = 0.9 + Math.random() * 0.1; // B
            } else if (colorChoice < 0.8) {
                // 黄色系
                farStarsColors[i * 3] = 0.9 + Math.random() * 0.1; // R
                farStarsColors[i * 3 + 1] = 0.8 + Math.random() * 0.2; // G
                farStarsColors[i * 3 + 2] = 0.4 + Math.random() * 0.3; // B
            } else if (colorChoice < 0.9) {
                // 赤系
                farStarsColors[i * 3] = 0.9 + Math.random() * 0.1; // R
                farStarsColors[i * 3 + 1] = 0.4 + Math.random() * 0.3; // G
                farStarsColors[i * 3 + 2] = 0.4 + Math.random() * 0.3; // B
            } else {
                // 青系
                farStarsColors[i * 3] = 0.4 + Math.random() * 0.3; // R
                farStarsColors[i * 3 + 1] = 0.4 + Math.random() * 0.3; // G
                farStarsColors[i * 3 + 2] = 0.9 + Math.random() * 0.1; // B
            }
        }
        
        farStarsGeometry.setAttribute('position', new THREE.BufferAttribute(farStarsPositions, 3));
        farStarsGeometry.setAttribute('size', new THREE.BufferAttribute(farStarsSizes, 1));
        farStarsGeometry.setAttribute('color', new THREE.BufferAttribute(farStarsColors, 3));
        
        // カスタムシェーダーマテリアル（サイズと色を個別に設定）
        const starsMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                uniform float time;
                varying vec3 vColor;
                
                void main() {
                    vColor = color;
                    
                    // 時間によってわずかに明滅
                    float brightness = 0.8 + 0.2 * sin(time * 0.1 + position.x * 0.01 + position.y * 0.01);
                    
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z) * brightness;
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    // 星の形状（中心が明るい円）
                    float r = distance(gl_PointCoord, vec2(0.5, 0.5));
                    float intensity = 1.0 - smoothstep(0.3, 0.5, r);
                    
                    gl_FragColor = vec4(vColor, intensity);
                }
            `,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true
        });
        
        // 星のパーティクルシステム
        this.stars = new THREE.Points(farStarsGeometry, starsMaterial);
        this.scene.add(this.stars);
        
        // 特に明るい星を少数追加
        const brightStarsGeometry = new THREE.BufferGeometry();
        const brightStarsCount = 50;
        const brightStarsPositions = new Float32Array(brightStarsCount * 3);
        
        for (let i = 0; i < brightStarsCount * 3; i += 3) {
            const radius = 50 + Math.random() * 150; // より近く
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            brightStarsPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
            brightStarsPositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
            brightStarsPositions[i + 2] = radius * Math.cos(phi);
        }
        
        brightStarsGeometry.setAttribute('position', new THREE.BufferAttribute(brightStarsPositions, 3));
        
        const brightStarsMaterial = new THREE.PointsMaterial({
            size: 3.0,
            color: 0xffffff,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        
        this.brightStars = new THREE.Points(brightStarsGeometry, brightStarsMaterial);
        this.scene.add(this.brightStars);
    }
    
    loadAurora() {
        // 現在の現象をクリーンアップ
        if (this.activePhenomenon) {
            this.activePhenomenon.cleanup();
        }
        
        // オーロラのインスタンスを作成して初期化
        this.activePhenomenon = new AuroraSimulation(this);
        
        console.log(`オーロラをロードしました`);
        
        // コントロールシステムにUIの更新を伝える
        if (this.enhancedControls) {
            this.enhancedControls.updateUIControls();
        }
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
        
        // FXAAパスの解像度更新
        this.fxaaPass.material.uniforms['resolution'].value.set(
            1 / (window.innerWidth * this.renderer.getPixelRatio()),
            1 / (window.innerHeight * this.renderer.getPixelRatio())
        );
        
        // モバイルデバイスの場合はパフォーマンスを調整
        if (window.innerWidth < 768) {
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        } else {
            this.renderer.setPixelRatio(window.devicePixelRatio);
        }
    }
    
    handleMouseWheel(event) {
        // デフォルトのスクロール動作を防止
        event.preventDefault();
        
        // より細かいスクロール制御
        const delta = event.deltaY * 0.0005;
        
        // カメラの現在の距離を取得
        const distance = this.camera.position.distanceTo(this.controls.target);
        
        // 新しい距離を計算（より小さな変化）
        let newDistance = distance * (1 + delta);
        
        // 距離の制限
        newDistance = Math.max(this.controls.minDistance, Math.min(this.controls.maxDistance, newDistance));
        
        // カメラ位置の方向ベクトルを取得
        const direction = new THREE.Vector3().subVectors(this.camera.position, this.controls.target).normalize();
        
        // 新しい位置を計算
        const newPosition = new THREE.Vector3().copy(this.controls.target).add(direction.multiplyScalar(newDistance));
        
        // カメラ位置を更新
        this.camera.position.copy(newPosition);
        
        // コントロールの更新を強制
        this.controls.update();
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // カメラコントロールの更新
        this.controls.update();
        
        // アクティブな現象のアップデート
        if (this.activePhenomenon) {
            this.activePhenomenon.update();
        }
        
        // 星のアニメーション
        if (this.stars && this.stars.material.uniforms) {
            this.stars.material.uniforms.time.value += 0.01;
        }
        
        // 修正：写真モード中でも最初のレンダリングは行う
        // 写真モード中は新しいレンダリングをスキップするが、初回は行う
        if (this.enhancedControls && this.enhancedControls.isPhotoMode && this.enhancedControls.photoRendered) {
            return;
        }
        
        // シーンをレンダリング
        this.composer.render();
        
        // 写真モードならレンダリング完了フラグを立てる
        if (this.enhancedControls && this.enhancedControls.isPhotoMode) {
            this.enhancedControls.photoRendered = true;
        }
    }
}

// ローディング画面の改良
function setupEnhancedLoadingScreen() {
    const loadingTips = [
        "知ってた？オーロラは主に北極と南極付近で見られる自然現象だよ！",
        "緑色のオーロラが一番よく見られるよ。酸素原子が光っているんだ！",
        "オーロラはラテン語で「夜明け」を意味する「Aurora」から来ているよ",
        "太陽から飛んでくる粒子が地球の磁場と大気にぶつかるとオーロラになるんだ",
        "オーロラを見るのに最適な時期は、真冬の晴れた夜だよ",
        "地球以外の惑星でもオーロラは見られるよ。木星や土星にもあるんだ！"
    ];
    
    // ランダムなヒントを表示
    const tipElement = document.querySelector('.loading-tips');
    if (tipElement) {
        const randomTip = loadingTips[Math.floor(Math.random() * loadingTips.length)];
        tipElement.textContent = randomTip;
    }
    
    // 15秒ごとにヒントを切り替える
    let tipIndex = 1;
    setInterval(() => {
        if (tipElement && document.getElementById('loading-screen').style.display !== 'none') {
            const nextTip = loadingTips[tipIndex % loadingTips.length];
            
            // フェードアウト/フェードイン効果
            tipElement.style.opacity = 0;
            setTimeout(() => {
                tipElement.textContent = nextTip;
                tipElement.style.opacity = 1;
            }, 500);
            
            tipIndex++;
        }
    }, 15000);
}

// DOMが読み込まれたらアプリケーションを開始
window.addEventListener('DOMContentLoaded', () => {

    setupEnhancedLoadingScreen();

    // 起動メッセージ
    console.log('オーロラシミュレーターを起動します...');
    
    // アプリケーションの作成
    const app = new AuroraEngine();
});