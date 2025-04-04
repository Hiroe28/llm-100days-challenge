/**
 * 雪のアニメーション処理
 * 雪の結晶のアニメーション機能を提供します
 */

const SnowflakeAnimation = {
    // キャンバス関連要素
    canvas: null,
    ctx: null,
    canvasContainer: null,
    
    // アニメーション制御
    animationId: null,
    lastFrameTime: 0,
    targetFPS: 30,
    
    // 雪の結晶
    snowflakes: [],
    SNOWFLAKE_COUNT: 20,
    
    // 初期化
    init() {
        this.canvas = document.getElementById('snowfall-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvasContainer = this.canvas.parentElement;
        
        // キャンバスサイズの設定
        this.resizeCanvas();
        
        // デバイスに適した設定を行う
        this.SNOWFLAKE_COUNT = getSnowflakeCount();
        this.targetFPS = getTargetFPS();
        
        // イベントリスナー
        window.addEventListener('resize', () => this.resizeCanvas());
    },
    
    // キャンバスのリサイズ
    resizeCanvas() {
        if (!this.canvas || !this.canvasContainer) return;
        
        // キャンバスをコンテナに合わせる
        this.canvas.width = this.canvasContainer.clientWidth;
        this.canvas.height = this.canvasContainer.clientHeight;
        
        // キャンバスサイズ変更後に再描画
        if (this.snowflakes.length > 0) {
            this.drawSnowflakes();
        }
    },
    
    // 雪の結晶オブジェクトを作成
    createSnowflake(temp, humidity, img) {
        const size = Math.random() * 30 + 20; // 20~50px
        const rotationSpeed = Math.random() * 0.01 - 0.005; // 回転速度（ランダム）
        
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * -this.canvas.height * 0.5, // 画面上部から降り始める
            size: size,
            speed: size * 0.05 + 0.3, // 大きい雪はゆっくり落ちる
            oscillationSpeed: Math.random() * 0.02 + 0.01,
            oscillationDistance: Math.random() * 5 + 2,
            angle: Math.random() * Math.PI * 2, // ランダムな角度から開始
            rotationSpeed: rotationSpeed,
            opacity: Math.random() * 0.3 + 0.7, // 透明度
            temp: temp,
            humidity: humidity,
            img: img,
            glowIntensity: Math.random() * 0.4 + 0.2, // 輝き具合（ランダム）
            glowSize: Math.random() * 0.3 + 0.7 // 発光サイズ（ランダム）
        };
    },
    
    // 雪の結晶を描画
    drawSnowflake(flake) {
        this.ctx.save();
        
        // 中心位置に移動
        this.ctx.translate(flake.x, flake.y);
        
        // 透明度の設定
        this.ctx.globalAlpha = flake.opacity;
        
        // 輝き効果（グロー）を追加
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'lighter';
        const glowSize = flake.size * flake.glowSize * 1.5;
        const glowGradient = this.ctx.createRadialGradient(
            0, 0, 0,
            0, 0, glowSize
        );
        glowGradient.addColorStop(0, `rgba(180, 230, 255, ${flake.glowIntensity * 0.2})`);
        glowGradient.addColorStop(0.6, `rgba(150, 220, 255, ${flake.glowIntensity * 0.05})`);
        glowGradient.addColorStop(1, 'rgba(150, 220, 255, 0)');
        
        this.ctx.fillStyle = glowGradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
        
        // 画像を回転して描画
        this.ctx.rotate(flake.angle);
        this.ctx.drawImage(
            flake.img, 
            -flake.size, -flake.size, 
            flake.size * 2, flake.size * 2
        );
        
        this.ctx.restore();
    },
    
    // 雪のアニメーション
    animate() {
        // FPS制限
        const now = performance.now();
        const frameInterval = 1000 / this.targetFPS;
        
        if (now - this.lastFrameTime < frameInterval) {
            this.animationId = requestAnimationFrame(() => this.animate());
            return;
        }
        
        this.lastFrameTime = now;
        
        // キャンバスをクリア
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 背景のグラデーションを描画
        const bgGradient = this.ctx.createRadialGradient(
            this.canvas.width/2, this.canvas.height/2, 0,
            this.canvas.width/2, this.canvas.height/2, this.canvas.height
        );
        bgGradient.addColorStop(0, 'rgba(20, 60, 120, 1)');
        bgGradient.addColorStop(0.7, 'rgba(10, 40, 90, 1)');
        bgGradient.addColorStop(1, 'rgba(5, 20, 50, 1)');
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 背景の星空効果（小さな点）を描画
        if (Math.random() < 0.05) { // 時々新しい星を追加
            for (let i = 0; i < 3; i++) {
                const starX = Math.random() * this.canvas.width;
                const starY = Math.random() * this.canvas.height * 0.7;
                const starSize = Math.random() * 1.5 + 0.5;
                const starOpacity = Math.random() * 0.5 + 0.3;
                
                this.ctx.save();
                this.ctx.globalCompositeOperation = 'lighter';
                this.ctx.beginPath();
                const starGradient = this.ctx.createRadialGradient(
                    starX, starY, 0,
                    starX, starY, starSize * 2
                );
                starGradient.addColorStop(0, `rgba(255, 255, 255, ${starOpacity})`);
                starGradient.addColorStop(0.5, `rgba(200, 220, 255, ${starOpacity * 0.5})`);
                starGradient.addColorStop(1, 'rgba(200, 220, 255, 0)');
                
                this.ctx.fillStyle = starGradient;
                this.ctx.arc(starX, starY, starSize * 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            }
        }
        
        // 各雪の結晶を更新して描画
        this.snowflakes.forEach((flake) => {
            // 位置の更新
            flake.y += flake.speed;
            flake.x += Math.sin(flake.angle * 2) * flake.oscillationDistance;
            flake.angle += flake.oscillationSpeed;
            
            // 結晶を回転（ランダムな方向と速度）
            flake.angle += flake.rotationSpeed;
            
            // グロー効果のパルス（変動）
            flake.glowIntensity = (flake.glowIntensity * 0.95) + (0.2 * 0.05 * (0.8 + Math.sin(now * 0.001 + flake.x) * 0.2));
            
            // 画面外に出たら上に戻す
            if (flake.y > this.canvas.height + flake.size) {
                // 完全に画面外に出たら新しい雪を生成
                flake.y = -flake.size * 2;
                flake.x = Math.random() * this.canvas.width;
                
                // 不透明度をランダムに少し変える（バリエーション用）
                flake.opacity = Math.random() * 0.3 + 0.7;
            }
            
            // 描画
            this.drawSnowflake(flake);
        });
        
        // アニメーションを継続
        this.animationId = requestAnimationFrame(() => this.animate());
    },
    
    // 新しい雪を生成
    async generateSnowflakes(tempValue, humidityValue) {
        if (!CrystalDataManager.crystalData) return;
        
        document.getElementById('loading-indicator').style.display = 'block';
        
        // 現在のアニメーションを停止
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // キャンバスをクリア
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 結晶画像を読み込む
        const crystalImg = await CrystalDataManager.loadCrystalImage(tempValue, humidityValue);
        
        if (!crystalImg) {
            document.getElementById('loading-indicator').style.display = 'none';
            return;
        }
        
        // HTML要素としての雪を削除
        document.querySelectorAll('.snowflake-img').forEach(el => el.remove());
        
        // 新しい雪の結晶を生成
        this.snowflakes = [];
        for (let i = 0; i < this.SNOWFLAKE_COUNT; i++) {
            this.snowflakes.push(this.createSnowflake(tempValue, humidityValue, crystalImg));
        }
        
        document.getElementById('loading-indicator').style.display = 'none';
        
        // アニメーションを開始
        this.animate();
        
        // イベントを発火（雪の結晶が生成された）
        const event = new CustomEvent('snowflakesGenerated', { 
            detail: { temp: tempValue, humidity: humidityValue }
        });
        document.dispatchEvent(event);
    },
    
    // 背景の雪の結晶を生成
    createBackgroundSnowflakes() {
        const bgSnowflakes = document.getElementById('bg-snowflakes');
        bgSnowflakes.innerHTML = '';
        
        const count = getBgSnowflakeCount();
        
        for (let i = 0; i < count; i++) {
            const size = Math.random() * 100 + 50;
            const flake = document.createElement('div');
            flake.className = 'bg-snowflake';
            flake.style.width = `${size}px`;
            flake.style.height = `${size}px`;
            flake.style.top = `${Math.random() * 100}%`;
            flake.style.left = `${Math.random() * 100}%`;
            flake.style.opacity = `${Math.random() * 0.15 + 0.05}`;
            flake.style.transform = `rotate(${Math.random() * 60}deg)`;
            
            flake.innerHTML = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 0 L50 100 M0 50 L100 50 M15 15 L85 85 M15 85 L85 15" stroke="white" stroke-width="2" />
                <path d="M50 0 L40 20 L60 20 Z M50 100 L40 80 L60 80 Z M0 50 L20 40 L20 60 Z M100 50 L80 40 L80 60 Z" 
                    stroke="white" fill="white" stroke-width="1" />
            </svg>`;
            
            bgSnowflakes.appendChild(flake);
        }
    }
};