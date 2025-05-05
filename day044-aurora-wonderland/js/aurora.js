import * as THREE from 'three';

// オーロラシミュレーションクラス - 改良版
export default class AuroraSimulation {
    constructor(engine) {
        this.engine = engine;
        this.name = "オーロラ";
        this.time = 0;
        
        // オーロラ固有のパラメータ
        this.params = {
            intensity: 1.5,
            speed: 0.5,
            colorShift: 0.2,
            height: 0.2,
            latitude: 0.8,
            primaryColor: '#00ff88',
            secondaryColor: '#4422ff',
            tertiaryColor: '#0099ff'
        };
        
        // プリセット定義 (輝度を下げた版)
        this.presets = {
            green: {
                primaryColor: '#00cc66',
                secondaryColor: '#3311cc',
                tertiaryColor: '#0077cc',
                intensity: 1.0,
                speed: 0.5,
                height: 0.2
            },
            purple: {
                primaryColor: '#cc00cc',
                secondaryColor: '#4400cc',
                tertiaryColor: '#7700cc',
                intensity: 1.1,
                speed: 0.6,
                height: 0.2
            },
            red: {
                primaryColor: '#cc4400',
                secondaryColor: '#cc0044',
                tertiaryColor: '#cc0000',
                intensity: 1.2,
                speed: 0.4,
                height: 0.25
            },
            rainbow: {
                primaryColor: '#00cccc',
                secondaryColor: '#cc00cc',
                tertiaryColor: '#cccc00',
                intensity: 1.4,
                speed: 0.6,
                height: 0.3,
                colorShift: 0.4
            }
        };
        
        // オーロラスポット（実際の観測地点）
        this.auroraLocations = [
            { name: 'トロムソ（ノルウェー）', lat: 69.6, lon: 18.9 },
            { name: 'フェアバンクス（アラスカ）', lat: 64.8, lon: -147.7 },
            { name: 'イエローナイフ（カナダ）', lat: 62.4, lon: -114.4 },
            { name: 'レイキャビク（アイスランド）', lat: 64.1, lon: -21.9 },
            { name: 'ロバニエミ（フィンランド）', lat: 66.5, lon: 25.7 },
            { name: 'アビスコ（スウェーデン）', lat: 68.3, lon: 18.8 },
            { name: '南極点', lat: -90, lon: 0 }
        ];
        
        // オーロラスポットマーカー
        this.locationMarkers = [];
        
        // シーンの初期化
        this.init();
    }
    
    init() {
        // 地球の作成
        this.createEarth();
        
        // オーロラシェルの作成
        this.createAuroraShell();
        
        // オーロラスポットマーカーの作成
        this.createLocationMarkers();
        
        // 初期状態ではロケーションマーカーを非表示
        this.toggleLocationMarkers(false);
    }
    
    createEarth() {
        // 地球のジオメトリを作成
        const earthGeometry = new THREE.SphereGeometry(5, 64, 64);
        
        // テクスチャがロードされているかチェック
        let earthMaterial;
        if (this.engine.textures && this.engine.textures.earth) {
            console.log('地球のテクスチャを適用します');
            earthMaterial = new THREE.MeshPhongMaterial({
                map: this.engine.textures.earth,
                shininess: 10
            });
        } else {
            // テクスチャがない場合は確実に動作するフォールバック
            console.warn('地球のテクスチャが見つかりません。代替テクスチャを生成します。');
            
            // ベースマテリアルを作成
            earthMaterial = new THREE.MeshPhongMaterial({
                color: 0x2244aa,
                shininess: 10
            });
            
            // 代替テクスチャを生成
            const canvas = document.createElement('canvas');
            canvas.width = 1024;
            canvas.height = 512;
            const context = canvas.getContext('2d');
            
            // 海を描画
            context.fillStyle = '#0077be';
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            // 大陸をランダムに描画（より目立つ色で）
            context.fillStyle = '#228833';
            for (let i = 0; i < 20; i++) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                const radius = 30 + Math.random() * 80;
                context.beginPath();
                context.arc(x, y, radius, 0, Math.PI * 2);
                context.fill();
            }
            
            // 雪を描画 (極地方)
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, 80);
            context.fillRect(0, canvas.height - 80, canvas.width, 80);
            
            // テクスチャとして適用
            const texture = new THREE.CanvasTexture(canvas);
            earthMaterial.map = texture;
            earthMaterial.needsUpdate = true;
        }
        
        // 地球メッシュの作成と追加
        this.earth = new THREE.Mesh(earthGeometry, earthMaterial);
        this.engine.scene.add(this.earth);
        
        // デバッグ: 地球が追加されたことを確認
        console.log('地球を3Dシーンに追加しました', this.earth);
        
        // 雲層の作成（半透明）- スポットライトの問題を軽減するため修正
        const cloudsGeometry = new THREE.SphereGeometry(5.05, 64, 64);
        
        // 雲の簡易テクスチャを生成 - より均一な雲パターン
        const cloudCanvas = document.createElement('canvas');
        cloudCanvas.width = 1024;
        cloudCanvas.height = 512;
        const cloudContext = cloudCanvas.getContext('2d');
        
        // 背景を透明に
        cloudContext.fillStyle = 'rgba(255, 255, 255, 0)';
        cloudContext.fillRect(0, 0, cloudCanvas.width, cloudCanvas.height);
        
        // より自然な雲パターンを生成（ランダム性を減らす）
        cloudContext.fillStyle = 'rgba(255, 255, 255, 0.4)'; // 透明度を下げる
        
        // 雲パターンの生成方法を改善
        // 大きめで少ない雲を生成
        for (let i = 0; i < 40; i++) { // 数を80から40に減らす
            const x = Math.random() * cloudCanvas.width;
            const y = Math.random() * cloudCanvas.height;
            const radius = 40 + Math.random() * 40; // より大きく均一なサイズ
            const alpha = 0.1 + Math.random() * 0.3; // 透明度を下げる
            
            cloudContext.beginPath();
            cloudContext.arc(x, y, radius, 0, Math.PI * 2);
            cloudContext.globalAlpha = alpha;
            cloudContext.fill();
        }
        
        // 雲のマテリアル
        const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
        const cloudsMaterial = new THREE.MeshPhongMaterial({
            map: cloudTexture,
            transparent: true,
            opacity: 0.3 // 透明度を下げる
        });
        
        this.clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
        this.engine.scene.add(this.clouds);
    }
    
    createAuroraShell() {
        // オーロラシェルの作成（地球の周りに薄い層）
        const auroraGeometry = new THREE.SphereGeometry(5.3, 128, 128);
        
        // オーロラのシェーダーマテリアル - 改良版
        this.auroraMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                intensity: { value: this.params.intensity },
                speed: { value: this.params.speed },
                colorShift: { value: this.params.colorShift },
                height: { value: this.params.height },
                latitude: { value: this.params.latitude },
                primaryColor: { value: new THREE.Color(this.params.primaryColor) },
                secondaryColor: { value: new THREE.Color(this.params.secondaryColor) },
                tertiaryColor: { value: new THREE.Color(this.params.tertiaryColor) }
            },
            vertexShader: this.getEnhancedAuroraVertexShader(),
            fragmentShader: this.getEnhancedAuroraFragmentShader(),
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        this.auroraShell = new THREE.Mesh(auroraGeometry, this.auroraMaterial);
        this.engine.scene.add(this.auroraShell);
    }
    
    // オーロラの観測地点マーカーを作成
    createLocationMarkers() {
        // マーカーのジオメトリとマテリアル
        const markerGeometry = new THREE.SphereGeometry(0.08, 16, 16);
        const markerMaterial = new THREE.MeshBasicMaterial({
            color: 0xff00ff,
            transparent: true,
            opacity: 0.8
        });
        
        // 各位置にマーカーを追加
        this.auroraLocations.forEach(location => {
            // 緯度経度から3D座標に変換
            const phi = (90 - location.lat) * (Math.PI / 180);
            const theta = (location.lon + 180) * (Math.PI / 180);
            
            const x = -Math.sin(phi) * Math.cos(theta) * 5.1;
            const y = Math.cos(phi) * 5.1;
            const z = Math.sin(phi) * Math.sin(theta) * 5.1;
            
            // マーカーの作成
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.position.set(x, y, z);
            
            // 脈動アニメーション用のデータを追加
            marker.userData = {
                originalScale: 1.0,
                pulsePhase: Math.random() * Math.PI * 2,
                location: location
            };
            
            this.engine.scene.add(marker);
            this.locationMarkers.push(marker);
            
            // マーカー用のラベルは実装しない（テキストの3D表示は複雑なため）
        });
    }
    
    // オーロラ観測地点マーカーの表示/非表示を切り替え
    toggleLocationMarkers(visible) {
        this.locationMarkers.forEach(marker => {
            marker.visible = visible;
        });
    }
    
    // プリセットを適用
    applyPreset(presetName) {
        if (!this.presets[presetName]) return;
        
        const preset = this.presets[presetName];
        
        // パラメータを更新
        this.params.primaryColor = preset.primaryColor;
        this.params.secondaryColor = preset.secondaryColor;
        this.params.tertiaryColor = preset.tertiaryColor;
        this.params.intensity = preset.intensity;
        this.params.speed = preset.speed;
        this.params.height = preset.height;
        
        if (preset.colorShift !== undefined) {
            this.params.colorShift = preset.colorShift;
        }
        
        // シェーダーのuniforms更新
        if (this.auroraMaterial && this.auroraMaterial.uniforms) {
            this.auroraMaterial.uniforms.primaryColor.value.set(this.params.primaryColor);
            this.auroraMaterial.uniforms.secondaryColor.value.set(this.params.secondaryColor);
            this.auroraMaterial.uniforms.tertiaryColor.value.set(this.params.tertiaryColor);
            this.auroraMaterial.uniforms.intensity.value = this.params.intensity;
            this.auroraMaterial.uniforms.speed.value = this.params.speed;
            this.auroraMaterial.uniforms.height.value = this.params.height;
            this.auroraMaterial.uniforms.colorShift.value = this.params.colorShift;
        }
        
        // UIコントロールの更新（メインクラスで処理）
        if (this.engine.updateUIControls) {
            this.engine.updateUIControls();
        }
    }
    
    // キッズモード切り替え時の処理
    applyKidsMode(enabled) {
        if (enabled) {
            // キッズモード時はよりカラフルで明るく
            this.applyPreset('rainbow');
        } else {
            // 通常モードに戻す
            this.applyPreset('green');
        }
    }
    
    // 拡張されたオーロラの頂点シェーダー
    getEnhancedAuroraVertexShader() {
        return `
            uniform float time;
            uniform float height;
            
            varying vec3 vPosition;
            varying vec2 vUv;
            
            // 改良: パーリンノイズ関数
            vec3 mod289(vec3 x) {
                return x - floor(x * (1.0 / 289.0)) * 289.0;
            }
            
            vec4 mod289(vec4 x) {
                return x - floor(x * (1.0 / 289.0)) * 289.0;
            }
            
            vec4 permute(vec4 x) {
                return mod289(((x*34.0)+1.0)*x);
            }
            
            vec4 taylorInvSqrt(vec4 r) {
                return 1.79284291400159 - 0.85373472095314 * r;
            }
            
            float snoise(vec3 v) {
                const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
                
                // First corner
                vec3 i  = floor(v + dot(v, C.yyy));
                vec3 x0 = v - i + dot(i, C.xxx);
                
                // Other corners
                vec3 g = step(x0.yzx, x0.xyz);
                vec3 l = 1.0 - g;
                vec3 i1 = min(g.xyz, l.zxy);
                vec3 i2 = max(g.xyz, l.zxy);
                
                vec3 x1 = x0 - i1 + C.xxx;
                vec3 x2 = x0 - i2 + C.yyy;
                vec3 x3 = x0 - D.yyy;
                
                // Permutations
                i = mod289(i);
                vec4 p = permute(permute(permute(
                          i.z + vec4(0.0, i1.z, i2.z, 1.0))
                        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                
                // Gradients
                float n_ = 0.142857142857;
                vec3 ns = n_ * D.wyz - D.xzx;
                
                vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                
                vec4 x_ = floor(j * ns.z);
                vec4 y_ = floor(j - 7.0 * x_);
                
                vec4 x = x_ *ns.x + ns.yyyy;
                vec4 y = y_ *ns.x + ns.yyyy;
                vec4 h = 1.0 - abs(x) - abs(y);
                
                vec4 b0 = vec4(x.xy, y.xy);
                vec4 b1 = vec4(x.zw, y.zw);
                
                vec4 s0 = floor(b0)*2.0 + 1.0;
                vec4 s1 = floor(b1)*2.0 + 1.0;
                vec4 sh = -step(h, vec4(0.0));
                
                vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
                vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
                
                vec3 p0 = vec3(a0.xy, h.x);
                vec3 p1 = vec3(a0.zw, h.y);
                vec3 p2 = vec3(a1.xy, h.z);
                vec3 p3 = vec3(a1.zw, h.w);
                
                // Normalise gradients
                vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
                p0 *= norm.x;
                p1 *= norm.y;
                p2 *= norm.z;
                p3 *= norm.w;
                
                // Mix final noise value
                vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                m = m * m;
                return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
            }
            
            void main() {
                vPosition = position;
                vUv = uv;
                
                // 極地方でのみ効果が現れるマスク
                float latitude = abs(normalize(position).y);
                float polarMask = smoothstep(0.7, 1.0, latitude);
                
                // 改良: より複雑な波のパターン
                float noiseScale = 0.4;
                float noiseTime = time * 0.2;
                float wave1 = snoise(vec3(position.x * noiseScale, position.z * noiseScale, noiseTime)) * 0.3;
                float wave2 = snoise(vec3(position.z * noiseScale * 2.0, position.x * noiseScale * 2.0, noiseTime + 100.0)) * 0.15;
                float wave = wave1 + wave2;
                
                // オーロラの揺らめきを表現
                vec3 displacement = normalize(position) * wave * polarMask * height;
                
                // カーテン状の垂直方向の動き
                float curtainEffect = sin(position.x * 2.0 + time * 0.5) * cos(position.z * 3.0) * 0.05;
                displacement.y += curtainEffect * polarMask * height * 3.0;
                
                // 最終的な位置
                vec3 newPosition = position + displacement;
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
            }
        `;
    }
    
    // 拡張されたオーロラのフラグメントシェーダー
    getEnhancedAuroraFragmentShader() {
        return `
            uniform float time;
            uniform float intensity;
            uniform float speed;
            uniform float colorShift;
            uniform float latitude;
            uniform vec3 primaryColor;
            uniform vec3 secondaryColor;
            uniform vec3 tertiaryColor;
            
            varying vec3 vPosition;
            varying vec2 vUv;
            
            // 3Dノイズ関数
            float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
            vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
            vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}
            
            float noise(vec3 p){
                vec3 a = floor(p);
                vec3 d = p - a;
                d = d * d * (3.0 - 2.0 * d);
                
                vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
                vec4 k1 = perm(b.xyxy);
                vec4 k2 = perm(k1.xyxy + b.zzww);
                
                vec4 c = k2 + a.zzzz;
                vec4 k3 = perm(c);
                vec4 k4 = perm(c + 1.0);
                
                vec4 o1 = fract(k3 * (1.0 / 41.0));
                vec4 o2 = fract(k4 * (1.0 / 41.0));
                
                vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
                vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);
                
                return o4.y * d.y + o4.x * (1.0 - d.y);
            }
            
            // FBM（フラクショナルブラウン運動）関数
            float fbm(vec3 p) {
                float sum = 0.0;
                float amp = 1.0;
                float freq = 1.0;
                // 5つの異なるスケールのノイズを合成
                for(int i = 0; i < 6; i++) { // より詳細に
                    sum += amp * noise(p * freq);
                    amp *= 0.5;
                    freq *= 2.0;
                }
                return sum;
            }
            
            // カーテン状の形状を作る関数 - 改良版
            float curtainShape(vec3 pos, float t) {
                // 極地方からの距離
                float latPos = abs(normalize(pos).y);
                
                // 極地方の緯度帯（latitude unifromで調整可能）
                float polarBand = smoothstep(latitude - 0.3, latitude, latPos);
                
                // 経度方向の位置（0〜1）
                float longPos = atan(pos.x, pos.z) / (2.0 * 3.14159) + 0.5;
                
                // より複雑な時間変化するノイズ
                float baseNoise = fbm(vec3(longPos * 20.0, latPos * 5.0, t * 0.2));
                float detailNoise = fbm(vec3(longPos * 50.0, latPos * 30.0, t * 0.5 + 100.0)) * 0.3;
                
                // より複雑なカーテン状パターン
                float verticalPattern = 0.6 + 0.4 * sin(longPos * 50.0 + baseNoise * 10.0 + t);
                float horizontalRipple = 0.7 + 0.3 * sin(latPos * 40.0 + t * 0.8);
                
                // 細かい揺らぎを追加
                float flutter = 0.8 + 0.2 * sin(longPos * 120.0 + latPos * 30.0 + t * 3.0);
                
                // 形状を鋭く調整
                float shape = pow(verticalPattern * flutter * horizontalRipple * (baseNoise + detailNoise), 1.2);
                
                // 極地方のマスクを適用
                return shape * polarBand;
            }
            
            // カラーグラデーションを生成する関数 - 改良版
            vec3 auroraColor(float intensity, float variation) {
                // パラメータから色を取得（より滑らかな遷移）
                vec3 color1 = primaryColor;
                vec3 color2 = secondaryColor;
                vec3 color3 = tertiaryColor;
                
                // バリエーションに基づいて色を混合
                vec3 color;
                
                // 色相環に沿って変化するように改良
                float colorCycle = variation * 3.0 + colorShift * time * 0.1;
                
                if (colorCycle < 1.0) {
                    color = mix(color1, color2, fract(colorCycle));
                } else if (colorCycle < 2.0) {
                    color = mix(color2, color3, fract(colorCycle));
                } else {
                    color = mix(color3, color1, fract(colorCycle));
                }
                
                // 光の強度による色調整（高強度では白に近づく）
                float glow = pow(intensity, 1.5) * 0.5;
                color = mix(color, vec3(1.0, 1.0, 1.0), glow);
                
                return color;
            }
            
            void main() {
                // 極地方からの距離
                float lat = abs(normalize(vPosition).y);
                
                // 時間変数
                float t = time * speed;
                
                // 複数層のオーロラを重ねる
                float aurora1 = curtainShape(vPosition, t);
                float aurora2 = curtainShape(vPosition * 1.2, t * 0.7 + 10.0);
                float aurora3 = curtainShape(vPosition * 0.8, t * 1.3 + 20.0);
                
                // 最終的なオーロラパターン（より複雑な合成）
                float finalAurora = max(aurora1, max(aurora2 * 0.7, aurora3 * 0.5));
                
                // 色のバリエーションのためのノイズ
                float colorVar = noise(vPosition * 0.2 + vec3(0, t * 0.1, 0));
                
                // 改良: 層ごとに異なる色を適用
                vec3 color1 = auroraColor(finalAurora, colorVar);
                vec3 color2 = auroraColor(finalAurora, colorVar + 0.2);
                vec3 color3 = auroraColor(finalAurora, colorVar - 0.2);
                
                // より複雑な色の合成
                float blend1 = noise(vPosition * 0.3 + vec3(t * 0.2, 0, 0));
                float blend2 = noise(vPosition * 0.2 - vec3(0, 0, t * 0.15));
                
                vec3 finalColor = mix(
                    mix(color1, color2, blend1),
                    color3,
                    blend2
                );
                
                // 発光強度と透明度
                float baseAlpha = smoothstep(0.0, 0.4, finalAurora) * intensity;
                
                // 縁を少し柔らかく
                float edgeSoftness = smoothstep(0.0, 0.1, aurora1 * aurora2);
                
                // 最終的な透明度（より透明に）
                float alpha = baseAlpha * edgeSoftness * 0.7;
                alpha = min(alpha, 0.7); // 透明度の上限を下げる
                
                gl_FragColor = vec4(finalColor, alpha);
            }
        `;
    }
    
    update() {
        // 時間の更新
        this.time += 0.01;
        
        // オーロラシェーダーの時間更新
        if (this.auroraMaterial && this.auroraMaterial.uniforms) {
            this.auroraMaterial.uniforms.time.value = this.time;
        }
        
        // 地球の自動回転（エンジンの自動回転フラグが有効な場合）
        if (this.engine.autoRotate) {
            if (this.earth) {
                this.earth.rotation.y += 0.002;
            }
            
            // 雲の回転（地球より少し速く）
            if (this.clouds) {
                this.clouds.rotation.y += 0.0025;
            }
        }
        
        // ロケーションマーカーのアニメーション
        this.updateLocationMarkers();
    }
    
    // ロケーションマーカーの脈動アニメーション
    updateLocationMarkers() {
        this.locationMarkers.forEach(marker => {
            if (!marker.visible) return;
            
            // 脈動効果
            const pulseSpeed = 1.5;
            marker.userData.pulsePhase += 0.02 * pulseSpeed;
            const scale = 1.0 + 0.3 * Math.sin(marker.userData.pulsePhase);
            
            marker.scale.set(scale, scale, scale);
        });
    }
    
    cleanup() {
        // 地球を削除
        if (this.earth) {
            this.engine.scene.remove(this.earth);
            this.earth.geometry.dispose();
            this.earth.material.dispose();
        }
        
        // 雲を削除
        if (this.clouds) {
            this.engine.scene.remove(this.clouds);
            this.clouds.geometry.dispose();
            this.clouds.material.dispose();
        }
        
        // オーロラシェルを削除
        if (this.auroraShell) {
            this.engine.scene.remove(this.auroraShell);
            this.auroraShell.geometry.dispose();
            this.auroraShell.material.dispose();
        }
        
        // ロケーションマーカーを削除
        this.locationMarkers.forEach(marker => {
            this.engine.scene.remove(marker);
            marker.geometry.dispose();
            marker.material.dispose();
        });
        this.locationMarkers = [];
    }
}