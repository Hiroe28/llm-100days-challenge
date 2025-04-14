/**
 * ニューロンクラス - ニューロンの振る舞いをモデリングします
 */
class Neuron {
    constructor(x, y, canvas, colorTheme = 'neon') {
        this.x = x;
        this.y = y;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // ニューロンの基本パラメータ
        this.radius = 4 + Math.random() * 4;
        this.connections = [];
        this.potentialEnergy = 0;
        this.threshold = 0.7 + Math.random() * 0.2; // 発火閾値
        this.firing = false; // 発火状態
        this.refractory = false; // 不応期
        this.refractoryPeriod = 50 + Math.random() * 100; // 不応期の長さ（ms）
        this.refractoryTimer = 0;
        this.lastUpdate = performance.now();
        
        // 視覚的効果のパラメータ
        this.pulseRadius = 0;
        this.pulseAlpha = 0;
        this.pulseSpeed = 1 + Math.random() * 2;
        this.pulseMaxRadius = 80 + Math.random() * 60;
        
        // 色テーマの設定
        this.setColorTheme(colorTheme);
        
        // 物理的な挙動のパラメータ
        this.vx = (Math.random() - 0.5) * 0.3; // x軸の速度
        this.vy = (Math.random() - 0.5) * 0.3; // y軸の速度
        this.mass = this.radius * 0.8; // 質量（サイズに比例）
    }
    
    // 色テーマの設定
    setColorTheme(theme) {
        const themes = {
            neon: {
                base: [
                    { r: 41, g: 121, b: 255 },
                    { r: 111, g: 33, b: 247 },
                    { r: 255, g: 0, b: 128 },
                    { r: 0, g: 213, b: 255 }
                ],
                pulse: [
                    { r: 41, g: 121, b: 255 },
                    { r: 111, g: 33, b: 247 },
                    { r: 255, g: 0, b: 128 },
                    { r: 0, g: 213, b: 255 }
                ],
                connection: 'rgba(255, 255, 255, 0.2)'
            },
            pastel: {
                base: [
                    { r: 255, g: 184, b: 222 },
                    { r: 170, g: 227, b: 245 },
                    { r: 233, g: 236, b: 173 },
                    { r: 179, g: 255, b: 198 }
                ],
                pulse: [
                    { r: 255, g: 130, b: 200 },
                    { r: 120, g: 200, b: 235 },
                    { r: 220, g: 200, b: 120 },
                    { r: 140, g: 235, b: 170 }
                ],
                connection: 'rgba(255, 255, 255, 0.15)'
            },
            ocean: {
                base: [
                    { r: 0, g: 119, b: 190 },
                    { r: 0, g: 180, b: 216 },
                    { r: 72, g: 202, b: 228 },
                    { r: 144, g: 224, b: 239 }
                ],
                pulse: [
                    { r: 0, g: 119, b: 190 },
                    { r: 0, g: 180, b: 216 },
                    { r: 72, g: 202, b: 228 },
                    { r: 144, g: 224, b: 239 }
                ],
                connection: 'rgba(173, 216, 230, 0.2)'
            },
            fire: {
                base: [
                    { r: 255, g: 107, b: 0 },
                    { r: 255, g: 158, b: 0 },
                    { r: 255, g: 59, b: 59 },
                    { r: 255, g: 211, b: 0 }
                ],
                pulse: [
                    { r: 255, g: 107, b: 0 },
                    { r: 255, g: 158, b: 0 },
                    { r: 255, g: 59, b: 59 },
                    { r: 255, g: 211, b: 0 }
                ],
                connection: 'rgba(255, 210, 170, 0.2)'
            }
        };
        
        const selectedTheme = themes[theme] || themes.neon;
        const baseColorIndex = Math.floor(Math.random() * selectedTheme.base.length);
        const pulseColorIndex = Math.floor(Math.random() * selectedTheme.pulse.length);
        
        this.baseColor = selectedTheme.base[baseColorIndex];
        this.pulseColor = selectedTheme.pulse[pulseColorIndex];
        this.connectionColor = selectedTheme.connection;
    }
    
    // ニューロン間の接続を作成
    connectTo(neuron, strength = null) {
        if (!strength) {
            // 0.1から0.3の間のランダムな結合強度
            strength = 0.1 + Math.random() * 0.2;
        }
        this.connections.push({
            target: neuron,
            strength: strength
        });
    }
    
    // 近くのニューロンと自動的に接続
    autoConnect(neurons, maxConnections = 5, maxDistance = 150) {
        const candidates = neurons
            .filter(n => n !== this)
            .map(n => {
                const dx = this.x - n.x;
                const dy = this.y - n.y;
                const distance = Math.sqrt(dx*dx + dy*dy);
                return { neuron: n, distance };
            })
            .filter(c => c.distance < maxDistance)
            .sort((a, b) => a.distance - b.distance);
        
        // 接続数の上限を設定
        const numConnections = Math.min(
            maxConnections, 
            Math.floor(2 + Math.random() * 3), 
            candidates.length
        );
        
        for (let i = 0; i < numConnections; i++) {
            const strength = Math.max(0.1, 1 - (candidates[i].distance / maxDistance) * 0.9);
            this.connectTo(candidates[i].neuron, strength);
        }
    }
    
    // 入力を受け取る
    receiveInput(amount) {
        this.potentialEnergy += amount;
        
        // 閾値を超えたら発火
        if (this.potentialEnergy >= this.threshold && !this.refractory) {
            this.fire();
        }
    }
    
    // ニューロンの発火
    fire() {
        this.firing = true;
        this.pulseRadius = this.radius;
        this.pulseAlpha = 0.8;
        
        // 不応期に入る
        this.refractory = true;
        this.refractoryTimer = this.refractoryPeriod;
        
        // 接続されたニューロンに信号を送る
        for (const connection of this.connections) {
            setTimeout(() => {
                if (connection.target) {
                    connection.target.receiveInput(connection.strength);
                }
            }, 100 + Math.random() * 100); // 伝達遅延
        }
        
        return {
            x: this.x,
            y: this.y,
            connections: this.connections.length,
            energy: this.potentialEnergy
        };
    }
    
    // 状態の更新
    update(deltaTime) {
        const now = performance.now();
        const dt = (now - this.lastUpdate) / 1000; // 秒単位に変換
        this.lastUpdate = now;
        
        // 不応期のタイマー更新
        if (this.refractory) {
            this.refractoryTimer -= deltaTime;
            if (this.refractoryTimer <= 0) {
                this.refractory = false;
                this.potentialEnergy = 0; // 膜電位をリセット
            }
        }
        
        // 自然なエネルギー減衰
        if (!this.firing && !this.refractory) {
            this.potentialEnergy = Math.max(0, this.potentialEnergy - 0.01 * deltaTime / 16);
        }
        
        // 発火中のパルス効果更新
        if (this.pulseRadius > 0) {
            this.pulseRadius += this.pulseSpeed * deltaTime / 16;
            this.pulseAlpha = Math.max(0, this.pulseAlpha - 0.02 * deltaTime / 16);
            
            if (this.pulseRadius >= this.pulseMaxRadius || this.pulseAlpha <= 0) {
                this.pulseRadius = 0;
                this.firing = false;
            }
        }
        
        // 物理的な移動
        this.x += this.vx * dt * 5;
        this.y += this.vy * dt * 5;
        
        // 画面外に出ないように境界チェック
        const margin = this.radius;
        if (this.x < margin) { this.x = margin; this.vx *= -0.5; }
        if (this.x > this.canvas.width - margin) { this.x = this.canvas.width - margin; this.vx *= -0.5; }
        if (this.y < margin) { this.y = margin; this.vy *= -0.5; }
        if (this.y > this.canvas.height - margin) { this.y = this.canvas.height - margin; this.vy *= -0.5; }
    }
    
    // ニューロンの描画
    draw() {
        const ctx = this.ctx;
        
        // 接続線の描画
        for (const connection of this.connections) {
            const target = connection.target;
            const strength = connection.strength;
            
            ctx.beginPath();
            ctx.strokeStyle = this.connectionColor;
            ctx.lineWidth = strength * 2;
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(target.x, target.y);
            ctx.stroke();
        }
        
        // ニューロン本体の描画
        const energy = Math.min(1, this.potentialEnergy / this.threshold);
        const displayRadius = this.radius * (1 + energy * 0.5);
        
        ctx.beginPath();
        const glow = ctx.createRadialGradient(
            this.x, this.y, 0, 
            this.x, this.y, displayRadius * 3
        );
        
        const c = this.baseColor;
        glow.addColorStop(0, `rgba(${c.r}, ${c.g}, ${c.b}, ${0.6 + energy * 0.4})`);
        glow.addColorStop(0.6, `rgba(${c.r}, ${c.g}, ${c.b}, ${0.2 * energy})`);
        glow.addColorStop(1, `rgba(${c.r}, ${c.g}, ${c.b}, 0)`);
        
        ctx.fillStyle = glow;
        ctx.arc(this.x, this.y, displayRadius * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 中心部分（より明るい）
        ctx.beginPath();
        ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${0.8 + energy * 0.2})`;
        ctx.arc(this.x, this.y, displayRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + energy * 0.5})`;
        ctx.arc(this.x, this.y, displayRadius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        // 発火時のパルス効果
        if (this.pulseRadius > 0) {
            const p = this.pulseColor;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${this.pulseAlpha})`;
            ctx.lineWidth = 2;
            ctx.arc(this.x, this.y, this.pulseRadius, 0, Math.PI * 2);
            ctx.stroke();
            
            // 中間リング
            if (this.pulseRadius > this.radius * 2) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${this.pulseAlpha * 0.7})`;
                ctx.lineWidth = 1;
                ctx.arc(this.x, this.y, this.pulseRadius * 0.7, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            // 内側リング
            if (this.pulseRadius > this.radius * 4) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${this.pulseAlpha * 0.5})`;
                ctx.lineWidth = 1;
                ctx.arc(this.x, this.y, this.pulseRadius * 0.4, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }
    
    // 重力の影響を受ける
    applyGravity(gravity) {
        this.vx += gravity.x;
        this.vy += gravity.y;
    }
    
    // 他のニューロンと衝突判定/反発
    checkCollision(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        const minDistance = this.radius + other.radius;
        
        if (distance < minDistance) {
            // 反発方向の計算
            const nx = dx / distance;
            const ny = dy / distance;
            
            // 押し戻し量の計算
            const pushFactor = (minDistance - distance) * 0.5;
            
            // 位置の押し戻し
            this.x += nx * pushFactor;
            this.y += ny * pushFactor;
            other.x -= nx * pushFactor;
            other.y -= ny * pushFactor;
            
            // 速度の反射（運動量保存）
            const totalMass = this.mass + other.mass;
            const p1 = 2 * other.mass / totalMass;
            const p2 = 2 * this.mass / totalMass;
            
            // 衝突後の速度計算
            const dotProduct = nx * (this.vx - other.vx) + ny * (this.vy - other.vy);
            
            this.vx -= p1 * dotProduct * nx;
            this.vy -= p1 * dotProduct * ny;
            other.vx += p2 * dotProduct * nx;
            other.vy += p2 * dotProduct * ny;
            
            // 速度の減衰（エネルギー損失）
            this.vx *= 0.9;
            this.vy *= 0.9;
            other.vx *= 0.9;
            other.vy *= 0.9;
        }
    }
}