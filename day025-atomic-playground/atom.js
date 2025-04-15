/**
 * 原子クラス - 原子の振る舞いをモデリングします
 */
class Atom {
    constructor(x, y, element, canvas) {
        this.x = x;
        this.y = y;
        this.element = element; // 元素記号（H, O, C, N など）
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // 元素情報を取得
        const elementData = PeriodicTable.getElement(element);
        if (!elementData) {
            console.error(`元素情報が見つかりません: ${element}`);
            return;
        }
        
        // 原子の基本パラメータ
        this.radius = elementData.radius || 30;
        this.mass = elementData.atomicMass || 1;
        this.valenceElectrons = elementData.valenceElectrons || 0;
        this.maxBonds = elementData.maxBonds || 0;
        this.color = elementData.color || '#FFFFFF';
        this.bonds = []; // 結合情報
        this.bondingEnergy = 0; // 結合エネルギー（安定性）
        
        // 物理的な挙動のパラメータ
        this.vx = (Math.random() - 0.5) * 0.3; // x軸の速度
        this.vy = (Math.random() - 0.5) * 0.3; // y軸の速度
        
        // 視覚的効果のパラメータ
        this.pulseRadius = 0;
        this.pulseAlpha = 0;
        this.pulseSpeed = 1 + Math.random() * 2;
        this.pulseMaxRadius = 80 + Math.random() * 40;
        this.electronShellRadius = this.radius * 1.8;
        this.electronAngles = this.initElectronAngles();
        this.electronSpeed = 0.02 + Math.random() * 0.01;
        this.highlighted = false; // 強調表示フラグ
        
        // 結合に関するパラメータ
        this.isPartOfMolecule = false; // 分子の一部かどうか
        this.moleculeId = null; // 所属する分子のID
        
        // データ管理用
        this.id = Math.random().toString(36).substr(2, 9); // ユニークID
        this.lastUpdate = performance.now();
    }
    
    // 電子の初期角度を設定
    initElectronAngles() {
        const angles = [];
        const electrons = Math.min(this.valenceElectrons, 8); // 最大8電子まで表示
        
        for (let i = 0; i < electrons; i++) {
            // 電子を均等に配置
            angles.push((i / electrons) * Math.PI * 2);
        }
        
        return angles;
    }
    
    // 原子間の結合を作成
    bondWith(atom, bondType = PeriodicTable.bondTypes.SINGLE) {
        // 結合の最大数をチェック
        if (this.bonds.length >= this.maxBonds) {
            console.log(`${this.element}は最大結合数に達しています`);
            return false;
        }
        
        if (atom.bonds.length >= atom.maxBonds) {
            console.log(`${atom.element}は最大結合数に達しています`);
            return false;
        }
        
        // 既に結合しているかチェック
        if (this.isConnectedTo(atom)) {
            console.log('既に結合済みです');
            return false;
        }
        
        // 結合エネルギーを計算
        const bondEnergy = PeriodicTable.calculateBondEnergy(this.element, atom.element, bondType);
        
        // 結合を追加
        this.bonds.push({
            atom: atom,
            type: bondType,
            energy: bondEnergy
        });
        
        atom.bonds.push({
            atom: this,
            type: bondType,
            energy: bondEnergy
        });
        
        // 結合エネルギーを更新
        this.bondingEnergy += bondEnergy;
        atom.bondingEnergy += bondEnergy;
        
        // 結合した原子をハイライト
        this.highlight();
        atom.highlight();
        
        console.log(`${this.element}と${atom.element}が結合しました (${bondType})`);
        return true;
    }
    
    // 指定した原子と結合しているかチェック
    isConnectedTo(atom) {
        return this.bonds.some(bond => bond.atom === atom);
    }
    
    // 結合を破壊する
    breakBondWith(atom) {
        const bondIndex = this.bonds.findIndex(bond => bond.atom === atom);
        if (bondIndex === -1) return false;
        
        const bondEnergy = this.bonds[bondIndex].energy;
        
        // 結合を削除
        this.bonds.splice(bondIndex, 1);
        
        // 相手側の結合も削除
        const otherBondIndex = atom.bonds.findIndex(bond => bond.atom === this);
        if (otherBondIndex !== -1) {
            atom.bonds.splice(otherBondIndex, 1);
        }
        
        // 結合エネルギーを更新
        this.bondingEnergy -= bondEnergy;
        atom.bondingEnergy -= bondEnergy;
        
        return true;
    }
    
    // 分子IDの設定
    setMoleculeId(id) {
        this.moleculeId = id;
        this.isPartOfMolecule = !!id;
    }
    
    // 近くの原子と自動的に結合
    tryBondWithNearbyAtoms(atoms, maxDistance = 120) {
        // 最大結合数に達している場合は何もしない
        if (this.bonds.length >= this.maxBonds) return [];
        
        const newBonds = [];
        
        atoms.forEach(atom => {
            // 自分自身との結合は避ける
            if (atom === this) return;
            
            // 既に最大結合数に達している原子とは結合しない
            if (atom.bonds.length >= atom.maxBonds) return;
            
            // 既に結合している原子とは結合しない
            if (this.isConnectedTo(atom)) return;
            
            // 距離を計算
            const dx = this.x - atom.x;
            const dy = this.y - atom.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            // 結合に適した距離かチェック
            const idealDistance = PeriodicTable.calculateBondDistance(this.element, atom.element, PeriodicTable.bondTypes.SINGLE);
            
            if (distance < idealDistance * 1.5) {
                // 結合確率を計算
                const bondProbability = PeriodicTable.calculateBondProbability(this.element, atom.element);
                
                // 確率に基づいて結合するかどうか決定
                if (Math.random() < bondProbability) {
                    // 結合タイプを決定
                    const bondType = PeriodicTable.determineBondType(this.element, atom.element);
                    
                    // 結合を作成
                    if (this.bondWith(atom, bondType)) {
                        newBonds.push(atom);
                    }
                }
            }
        });
        
        return newBonds;
    }
    
    // 原子の強調表示
    highlight() {
        this.highlighted = true;
        
        // パルスエフェクトを開始
        this.pulseRadius = this.radius * 1.2;
        this.pulseAlpha = 0.8;
        
        // 一定時間後に強調表示を解除
        setTimeout(() => {
            this.highlighted = false;
        }, 1000);
    }
    
    // 原子の更新
    // atom.js の update メソッドを修正してNaNチェックを追加

    // 原子の更新
    update(deltaTime, temperature = 0) {
        const now = performance.now();
        const dt = (now - this.lastUpdate) / 1000; // 秒単位に変換
        this.lastUpdate = now;
        
        // NaNチェック - 座標がNaNの場合はリセット
        if (isNaN(this.x) || isNaN(this.y)) {
            console.warn(`原子の座標がNaNです (ID: ${this.id}, element: ${this.element}) - リセットします`);
            this.x = Math.random() * (this.canvas ? this.canvas.width : 800);
            this.y = Math.random() * (this.canvas ? this.canvas.height : 600);
            this.vx = 0;
            this.vy = 0;
            return; // 今回のフレームは計算せずに返す
        }
        
        // 速度のNaNチェック
        if (isNaN(this.vx) || isNaN(this.vy)) {
            console.warn(`原子の速度がNaNです (ID: ${this.id}) - リセットします`);
            this.vx = 0;
            this.vy = 0;
        }
        
        // 温度パラメータによる運動エネルギーの制御
        const thermicEnergy = temperature * 0.0001;
        
        // 原子の結合状態に応じた挙動調整
        if (this.bonds.length > 0) {
            // 結合がある場合、ランダムな動きを抑制
            this.vx *= 0.95;
            this.vy *= 0.95;
            
            // 結合した原子との位置関係を調整
            this.adjustBondPositions(dt);
        } else {
            // 結合がない場合、自由に動く
            // 温度に応じてランダムな力を加える
            if (temperature > 0) {
                this.vx += (Math.random() - 0.5) * thermicEnergy;
                this.vy += (Math.random() - 0.5) * thermicEnergy;
            }
        }
        
        // 物理的な移動
        this.x += this.vx * dt * 60;
        this.y += this.vy * dt * 60;
        
        // 移動後の座標チェック
        if (isNaN(this.x) || isNaN(this.y)) {
            console.warn(`移動後の座標がNaNです - リセットします`);
            this.x = Math.random() * (this.canvas ? this.canvas.width : 800);
            this.y = Math.random() * (this.canvas ? this.canvas.height : 600);
            this.vx = 0;
            this.vy = 0;
        }
        
        // 画面外に出ないように境界チェック
        const margin = this.radius;
        if (this.x < margin) { this.x = margin; this.vx *= -0.5; }
        if (this.x > this.canvas.width - margin) { this.x = this.canvas.width - margin; this.vx *= -0.5; }
        if (this.y < margin) { this.y = margin; this.vy *= -0.5; }
        if (this.y > this.canvas.height - margin) { this.y = this.canvas.height - margin; this.vy *= -0.5; }
        
        // パルスエフェクトの更新
        if (this.pulseRadius > 0) {
            this.pulseRadius += this.pulseSpeed * deltaTime / 16;
            this.pulseAlpha = Math.max(0, this.pulseAlpha - 0.02 * deltaTime / 16);
            
            if (this.pulseRadius >= this.pulseMaxRadius || this.pulseAlpha <= 0) {
                this.pulseRadius = 0;
            }
        }
        
        // 電子の位置を更新
        this.updateElectrons(dt);
    }
    
    // 電子の位置を更新
    updateElectrons(dt) {
        // 結合が存在する場合は電子の動きを調整
        const bondFactor = Math.max(0, 1 - this.bonds.length * 0.2);
        
        // 電子の位置を更新
        for (let i = 0; i < this.electronAngles.length; i++) {
            this.electronAngles[i] += this.electronSpeed * bondFactor * dt * 10;
            
            // 2πを超えたら0に戻す（角度の正規化）
            if (this.electronAngles[i] > Math.PI * 2) {
                this.electronAngles[i] -= Math.PI * 2;
            }
        }
    }
    
    // 結合した原子との位置関係を調整
    // atom.js の adjustBondPositions メソッドを修正してNaNチェックを追加

    // 結合した原子との位置関係を調整
    adjustBondPositions(dt) {
        // 結合のない場合は何もしない
        if (this.bonds.length === 0) return;
        
        // 各結合に対して処理
        this.bonds.forEach(bond => {
            const other = bond.atom;
            
            // 他方の原子の座標チェック
            if (isNaN(other.x) || isNaN(other.y)) {
                console.warn(`結合先の原子座標がNaNです - スキップします`);
                return;
            }
            
            // 現在の距離を計算
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            // 距離が0または非数の場合はスキップ
            if (isNaN(distance) || distance <= 0.1) {
                return;
            }
            
            // 理想的な結合距離を取得
            const idealDistance = PeriodicTable.calculateBondDistance(this.element, other.element, bond.type);
            
            // 距離の差分から力を計算
            const forceFactor = (distance - idealDistance) * 0.03;
            
            // NaNチェック
            if (isNaN(forceFactor)) {
                console.warn(`力の計算でNaNが発生しました - スキップします`);
                return;
            }
            
            // 単位ベクトル（方向）
            const nx = dx / distance;
            const ny = dy / distance;
            
            // NaNチェック
            if (isNaN(nx) || isNaN(ny)) {
                console.warn(`単位ベクトルがNaNです - スキップします`);
                return;
            }
            
            // 力の適用（自分と相手に逆方向の力）
            // 質量に反比例した加速度に変換
            const massRatio1 = other.mass / (this.mass + other.mass);
            const massRatio2 = this.mass / (this.mass + other.mass);
            
            // NaNチェック
            if (isNaN(massRatio1) || isNaN(massRatio2)) {
                console.warn(`質量比がNaNです - スキップします`);
                return;
            }
            
            // 速度の更新
            const dvx1 = -nx * forceFactor * massRatio1 * dt * 10;
            const dvy1 = -ny * forceFactor * massRatio1 * dt * 10;
            const dvx2 = nx * forceFactor * massRatio2 * dt * 10;
            const dvy2 = ny * forceFactor * massRatio2 * dt * 10;
            
            // NaNチェック
            if (isNaN(dvx1) || isNaN(dvy1) || isNaN(dvx2) || isNaN(dvy2)) {
                console.warn(`速度変化量がNaNです - スキップします`);
                return;
            }
            
            // 最終的に速度を更新
            this.vx += dvx1;
            this.vy += dvy1;
            other.vx += dvx2;
            other.vy += dvy2;
            
            // 更新後のNaNチェック
            if (isNaN(this.vx) || isNaN(this.vy) || isNaN(other.vx) || isNaN(other.vy)) {
                console.warn(`速度更新後にNaNが発生しました - リセットします`);
                this.vx = 0;
                this.vy = 0;
                other.vx = 0;
                other.vy = 0;
            }
        });
    }
    
    // 原子の描画
    draw() {
        const ctx = this.ctx;
        
        // 座標チェック - 無効な値がある場合は描画をスキップ
        if (!this.isValidPosition()) {
            return;
        }
        
        // 結合線の描画
        this.drawBonds();
        
        // 電子軌道の描画
        this.drawElectronShell();
        
        // 原子核の描画
        this.drawNucleus();
        
        // 価電子の描画
        this.drawValenceElectrons();
        
        // パルスエフェクトの描画
        this.drawPulseEffect();
        
        // 元素記号の表示
        this.drawElementSymbol();
    }
    
    // 結合の描画
    drawBonds() {
        const ctx = this.ctx;
        
        // 各結合を描画
        this.bonds.forEach(bond => {
            const other = bond.atom;
            
            // 結合の種類に応じた設定
            let lineWidth, color, dashPattern;
            
            switch(bond.type) {
                case PeriodicTable.bondTypes.SINGLE:
                    lineWidth = 3;
                    color = 'rgba(255, 255, 255, 0.7)';
                    dashPattern = [];
                    break;
                case PeriodicTable.bondTypes.DOUBLE:
                    lineWidth = 5;
                    color = 'rgba(255, 255, 255, 0.75)';
                    dashPattern = [];
                    break;
                case PeriodicTable.bondTypes.TRIPLE:
                    lineWidth = 7;
                    color = 'rgba(255, 255, 255, 0.8)';
                    dashPattern = [];
                    break;
                case PeriodicTable.bondTypes.IONIC:
                    lineWidth = 3;
                    color = 'rgba(255, 255, 255, 0.6)';
                    dashPattern = [5, 3];
                    break;
                default:
                    lineWidth = 3;
                    color = 'rgba(255, 255, 255, 0.7)';
                    dashPattern = [];
            }
            
            // 結合線の描画
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            
            // 破線パターンの設定
            if (dashPattern.length > 0) {
                ctx.setLineDash(dashPattern);
            } else {
                ctx.setLineDash([]);
            }
            
            // 原子の中心から結合相手の原子の中心まで線を引く
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
            
            // 二重結合、三重結合の表現
            if (bond.type === PeriodicTable.bondTypes.DOUBLE || bond.type === PeriodicTable.bondTypes.TRIPLE) {
                // 結合の方向に垂直な方向を計算
                const dx = other.x - this.x;
                const dy = other.y - this.y;
                const distance = Math.sqrt(dx*dx + dy*dy);
                
                // 単位ベクトルに変換
                const ux = dx / distance;
                const uy = dy / distance;
                
                // 垂直方向のベクトル
                const vx = -uy;
                const vy = ux;
                
                const offset = 4; // 線の間隔
                
                // 二重結合の場合は2本の平行線
                if (bond.type === PeriodicTable.bondTypes.DOUBLE) {
                    // 1本目
                    ctx.beginPath();
                    ctx.moveTo(this.x + vx * offset, this.y + vy * offset);
                    ctx.lineTo(other.x + vx * offset, other.y + vy * offset);
                    ctx.stroke();
                    
                    // 2本目
                    ctx.beginPath();
                    ctx.moveTo(this.x - vx * offset, this.y - vy * offset);
                    ctx.lineTo(other.x - vx * offset, other.y - vy * offset);
                    ctx.stroke();
                }
                
                // 三重結合の場合は3本の平行線
                if (bond.type === PeriodicTable.bondTypes.TRIPLE) {
                    // 中央
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(other.x, other.y);
                    ctx.stroke();
                    
                    // 上下の線
                    ctx.beginPath();
                    ctx.moveTo(this.x + vx * offset * 1.5, this.y + vy * offset * 1.5);
                    ctx.lineTo(other.x + vx * offset * 1.5, other.y + vy * offset * 1.5);
                    ctx.stroke();
                    
                    ctx.beginPath();
                    ctx.moveTo(this.x - vx * offset * 1.5, this.y - vy * offset * 1.5);
                    ctx.lineTo(other.x - vx * offset * 1.5, other.y - vy * offset * 1.5);
                    ctx.stroke();
                }
            }
            
            // 破線パターンをリセット
            ctx.setLineDash([]);
        });
    }
    

    // 座標の妥当性チェック
    isValidPosition() {
        // x, y座標が有効な数値かチェック
        if (isNaN(this.x) || isNaN(this.y) || isNaN(this.radius)) {
            console.error(`Invalid atom coordinates or radius: x=${this.x}, y=${this.y}, radius=${this.radius}`);
            return false;
        }
        
        // キャンバス内に存在するか
        if (!this.canvas) {
            return false;
        }
        
        // 極端に大きな値や小さな値でないか
        if (Math.abs(this.x) > 10000 || Math.abs(this.y) > 10000 || 
            this.radius <= 0 || this.radius > 1000) {
            console.error(`Extreme atom coordinates or radius: x=${this.x}, y=${this.y}, radius=${this.radius}`);
            return false;
        }
        
        return true;
    }

    // 電子軌道の描画
    drawElectronShell() {
        if (!this.isValidPosition()) return;
        
        const ctx = this.ctx;
        
        // 電子軌道の描画
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.highlighted ? 0.4 : 0.2})`;
        ctx.lineWidth = 1;
        ctx.arc(this.x, this.y, this.electronShellRadius, 0, Math.PI * 2);
        ctx.stroke();
    }
        
    // 原子核の描画
    drawNucleus() {
        const ctx = this.ctx;
        
        // エラーチェックを追加
        if (!isFinite(this.x) || !isFinite(this.y) || !isFinite(this.radius)) {
            console.error(`Invalid atom coordinates or radius: x=${this.x}, y=${this.y}, radius=${this.radius}`);
            return; // 無効な値の場合は描画をスキップ
        }
        
        // 原子核の描画（グラデーションでより立体的に）
        try {
            const glow = ctx.createRadialGradient(
                this.x, this.y, 0, 
                this.x, this.y, this.radius * 1.5
            );
            
            // 色の解析（16進数から RGB に変換）
            let r, g, b;
            
            if (this.color.startsWith('#')) {
                const hex = this.color.slice(1);
                r = parseInt(hex.substring(0, 2), 16);
                g = parseInt(hex.substring(2, 4), 16);
                b = parseInt(hex.substring(4, 6), 16);
            } else {
                // デフォルト値
                r = 255;
                g = 255;
                b = 255;
            }
            
            // 原子が分子の一部である場合は少し明るく表示
            const brightnessFactor = this.isPartOfMolecule ? 1.2 : 1.0;
            r = Math.min(255, Math.round(r * brightnessFactor));
            g = Math.min(255, Math.round(g * brightnessFactor));
            b = Math.min(255, Math.round(b * brightnessFactor));
            
            // ハイライト時はさらに明るく
            const highlightFactor = this.highlighted ? 1.5 : 1.0;
            
            glow.addColorStop(0, `rgba(${r * highlightFactor}, ${g * highlightFactor}, ${b * highlightFactor}, 0.8)`);
            glow.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, 0.3)`);
            glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            
            ctx.beginPath();
            ctx.fillStyle = glow;
            ctx.arc(this.x, this.y, this.radius * 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // 中心の核（より明るい色）
            ctx.beginPath();
            ctx.fillStyle = this.color;
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // ハイライト効果（光の反射を表現）
            ctx.beginPath();
            ctx.fillStyle = `rgba(255, 255, 255, ${this.highlighted ? 0.7 : 0.4})`;
            ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.3, 0, Math.PI * 2);
            ctx.fill();
        } catch (error) {
            console.error('Error drawing nucleus:', error);
        }
    }
    
    // 価電子の描画
    drawValenceElectrons() {
        if (!this.isValidPosition()) return;
        
        const ctx = this.ctx;
        
        // 結合数に応じて表示する電子数を調整
        const freeElectrons = Math.max(0, this.valenceElectrons - this.bonds.length);
        
        // 価電子を描画
        for (let i = 0; i < this.electronAngles.length && i < freeElectrons; i++) {
            const angle = this.electronAngles[i];
            
            // 角度の妥当性チェック
            if (isNaN(angle)) continue;
            
            const x = this.x + Math.cos(angle) * this.electronShellRadius;
            const y = this.y + Math.sin(angle) * this.electronShellRadius;
            
            // 座標の妥当性チェック
            if (isNaN(x) || isNaN(y)) continue;
            
            try {
                // 電子の効果を描画（小さな光の玉）
                ctx.beginPath();
                const electronGlow = ctx.createRadialGradient(
                    x, y, 0,
                    x, y, 5
                );
                
                electronGlow.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
                electronGlow.addColorStop(1, 'rgba(100, 200, 255, 0)');
                
                ctx.fillStyle = electronGlow;
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.fill();
                
                // 電子の中心部（より明るい）
                ctx.beginPath();
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
            } catch (error) {
                console.error('Error drawing electron:', error);
            }
        }
    }
    
    // パルスエフェクトの描画
    drawPulseEffect() {
        if (this.pulseRadius <= 0) return;
        
        const ctx = this.ctx;
        
        // パルスの色を元素の色に基づいて決定
        let r, g, b;
        
        if (this.color.startsWith('#')) {
            const hex = this.color.slice(1);
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        } else {
            r = 255;
            g = 255;
            b = 255;
        }
        
        // パルスの透明度
        const alpha = this.pulseAlpha;
        
        // パルスリングの描画
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.arc(this.x, this.y, this.pulseRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // 内側のリング（装飾的な効果）
        if (this.pulseRadius > this.radius * 2) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.7})`;
            ctx.lineWidth = 1;
            ctx.arc(this.x, this.y, this.pulseRadius * 0.7, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    // 元素記号の表示
    drawElementSymbol() {
        const ctx = this.ctx;
        
        // 元素記号の表示
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 元素の色の輝度に応じてテキスト色を変更（読みやすさのため）
        const luminance = this.calculateLuminance(this.color);
        ctx.fillStyle = luminance > 0.5 ? '#000000' : '#FFFFFF';
        
        ctx.fillText(this.element, this.x, this.y);
    }
    
    // 色の輝度計算（0〜1の範囲、0.5より大きいと明るい色）
    calculateLuminance(color) {
        let r, g, b;
        
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            r = parseInt(hex.substring(0, 2), 16) / 255;
            g = parseInt(hex.substring(2, 4), 16) / 255;
            b = parseInt(hex.substring(4, 6), 16) / 255;
        } else {
            return 0.5; // デフォルト値
        }
        
        // 相対輝度の計算（W3C標準）
        r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
        g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
        b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
        
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
    
    // 重力の影響を受ける
    applyGravity(gravity) {
        this.vx += gravity.x;
        this.vy += gravity.y;
    }
    
    // 力を加える
    applyForce(fx, fy) {
        // 質量に反比例した加速度
        this.vx += fx / this.mass;
        this.vy += fy / this.mass;
    }
    
    // 他の原子と衝突判定/反発
    checkCollision(other) {
        // 既に結合している場合は衝突処理をスキップ
        if (this.isConnectedTo(other)) return;
        
        // 座標のバリデーション
        if (!this.isValidPosition() || !other.isValidPosition()) {
            return;
        }
        
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        
        // NaNチェック
        if (isNaN(dx) || isNaN(dy)) {
            return;
        }
        
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        // 距離のバリデーション
        if (isNaN(distance) || distance <= 0) {
            return;
        }
        
        const minDistance = this.radius + other.radius;
        
        if (distance < minDistance * 0.9) {
            // 反発方向の計算
            const nx = dx / distance;
            const ny = dy / distance;
            
            // NaNチェック
            if (isNaN(nx) || isNaN(ny)) {
                return;
            }

            // 結合判定を試みる
            const bondProbability = PeriodicTable.calculateBondProbability(this.element, other.element);
            
            // 結合条件の確認 - 分子の整合性を保つ処理を追加
            let canBond = true;
            
            // 基本的な最大結合数チェック
            if (this.bonds.length >= this.maxBonds || other.bonds.length >= other.maxBonds) {
                canBond = false;
                
                // ここに特殊なケース処理（H2+O→H2O など）
            } else {
                // 正しい分子構造を保つための追加チェック
                // 例えば、すでにH2OができているのにHが付くのを防ぐ
                const thisIsMolecule = this.isPartOfMolecule && this.moleculeId;
                const otherIsMolecule = other.isPartOfMolecule && other.moleculeId;
                
                if (thisIsMolecule || otherIsMolecule) {
                    // 分子の結合状態を確認
                    const moleculeDetector = window.moleculeDetector;
                    if (moleculeDetector) {
                        const thisMolecule = thisIsMolecule ? 
                            moleculeDetector.getMoleculeByAtom(this) : null;
                        const otherMolecule = otherIsMolecule ? 
                            moleculeDetector.getMoleculeByAtom(other) : null;
                        
                        if (thisMolecule && thisMolecule.isRecognized) {
                            // 安定した既知の分子には新たな結合を許可しない
                            console.log(`${thisMolecule.name}は安定した分子なので、新たな結合は許可されません`);
                            canBond = false;
                        }
                        if (otherMolecule && otherMolecule.isRecognized) {
                            // 安定した既知の分子には新たな結合を許可しない
                            console.log(`${otherMolecule.name}は安定した分子なので、新たな結合は許可されません`);
                            canBond = false;
                        }
                    }
                }
            }
            
            // 結合処理
            if (canBond && Math.random() < bondProbability) {
                // 結合タイプの決定
                const bondType = PeriodicTable.determineBondType(this.element, other.element);
                
                // 結合を作成
                this.bondWith(other, bondType);
                return; // 結合処理完了
            }
            
            try {
                // 結合しない場合は物理的に反発
                const positionChange = (minDistance - distance) * 0.5;
                
                // NaNチェック
                if (!isNaN(positionChange) && positionChange > 0) {
                    this.x += nx * positionChange;
                    this.y += ny * positionChange;
                    other.x -= nx * positionChange;
                    other.y -= ny * positionChange;
                }
                
                // 速度の反射（運動量保存）
                const totalMass = this.mass + other.mass;
                if (totalMass <= 0) return;
                
                const p1 = 2 * other.mass / totalMass;
                const p2 = 2 * this.mass / totalMass;
                
                const dotProduct = nx * (this.vx - other.vx) + ny * (this.vy - other.vy);
                
                // NaNチェック
                if (isNaN(dotProduct)) return;
                
                // 速度の更新
                const dvx1 = p1 * dotProduct * nx;
                const dvy1 = p1 * dotProduct * ny;
                const dvx2 = p2 * dotProduct * nx;
                const dvy2 = p2 * dotProduct * ny;
                
                // NaNチェック
                if (!isNaN(dvx1) && !isNaN(dvy1) && !isNaN(dvx2) && !isNaN(dvy2)) {
                    this.vx -= dvx1;
                    this.vy -= dvy1;
                    other.vx += dvx2;
                    other.vy += dvy2;
                }
                
                // 速度の減衰（エネルギー損失）
                this.vx *= 0.9;
                this.vy *= 0.9;
                other.vx *= 0.9;
                other.vy *= 0.9;
            } catch (error) {
                console.error('Error in collision handling:', error);
            }
        }
    }
    
    // 原子の各種情報を取得
    getInfo() {
        return {
            element: this.element,
            mass: this.mass,
            bonds: this.bonds.length,
            maxBonds: this.maxBonds,
            valenceElectrons: this.valenceElectrons,
            isPartOfMolecule: this.isPartOfMolecule,
            moleculeId: this.moleculeId
        };
    }
}