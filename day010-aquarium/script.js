// グローバル変数
let fishes = [];
let foods = [];
let bubbles = [];
let planktons = [];
let sparkleImages = [];
let initialFishCount = 50;

// p5.js インスタンスモード
const sketch = (p) => {
  
  // 魚のクラス
  class Fish {
    constructor() {
      this.position = p.createVector(p.random(p.width), p.random(p.height));
      this.velocity = p5.Vector.random2D();
      this.velocity.setMag(p.random(1.5, 3.5));
      this.acceleration = p.createVector();
      this.maxForce = 0.2;
      this.maxSpeed = p.random(2, 4.5); // より多様な速度
      
      // 魚のサイズをより多様に
      this.size = p.random(4, 12);
      
      // さらに多様な色を使用
      // 青系、水色、紫系、淡いピンク系など
      const colorOptions = [
        {h: p.random(170, 220), s: p.random(70, 90), b: p.random(80, 100)}, // 青～水色系
        {h: p.random(220, 280), s: p.random(60, 80), b: p.random(80, 100)}, // 紫系
        {h: p.random(320, 350), s: p.random(40, 60), b: p.random(90, 100)}, // 淡いピンク系
        {h: p.random(40, 60), s: p.random(70, 90), b: p.random(90, 100)}    // 淡い金色系
      ];
      
      const selectedColor = colorOptions[Math.floor(p.random(colorOptions.length))];
      this.color = p.color(selectedColor.h, selectedColor.s, selectedColor.b, 0.8);
      this.shimmerColor = p.color(selectedColor.h, selectedColor.s + 10, selectedColor.b + 10, 0.7);
      
      this.perception = 100;
      this.tailAngle = 0;
      this.tailSpeed = p.random(0.15, 0.25); // 尾の動きの速さをランダム化
      
      // キラキラエフェクト
      this.sparkles = [];
      this.sparkleTimer = 0;
      this.nextSparkleTime = p.random(40, 100);
      
      // エサを探す
      this.hungry = p.random() < 0.5; // 50%の確率でお腹が空いている
      this.targetFood = null;
      
      // 魚の体型バリエーション
      this.bodyRatio = p.random(0.8, 1.2);  // 体の縦横比
      this.tailLength = p.random(0.8, 1.3); // 尾の長さ比
      
      // キラキラの色（魚の色に合わせる）
      this.sparkleColor = p.color(selectedColor.h, 
                                  p.random(50, 70), 
                                  p.random(90, 100), 
                                  0.7);
    }

    // エッジ回避（水槽の壁）
    avoidEdges() {
      const margin = 50;
      let desire = null;
      
      if (this.position.x < margin) {
        desire = p.createVector(this.maxSpeed, this.velocity.y);
      } else if (this.position.x > p.width - margin) {
        desire = p.createVector(-this.maxSpeed, this.velocity.y);
      }
      
      if (this.position.y < margin) {
        desire = desire || p.createVector(this.velocity.x, this.maxSpeed);
      } else if (this.position.y > p.height - margin) {
        desire = desire || p.createVector(this.velocity.x, -this.maxSpeed);
      }
      
      if (desire) {
        desire.normalize();
        desire.mult(this.maxSpeed);
        const steer = p5.Vector.sub(desire, this.velocity);
        steer.limit(this.maxForce * 2);
        return steer;
      }
      return p.createVector(0, 0);
    }

    // 分離（他の魚との衝突を避ける）
    separate(fishes) {
      let steer = p.createVector();
      let count = 0;
      
      for (let other of fishes) {
        let d = p5.Vector.dist(this.position, other.position);
        if (d > 0 && d < this.perception / 2) {
          let diff = p5.Vector.sub(this.position, other.position);
          diff.normalize();
          diff.div(d);
          steer.add(diff);
          count++;
        }
      }
      
      if (count > 0) {
        steer.div(count);
        steer.normalize();
        steer.mult(this.maxSpeed);
        steer.sub(this.velocity);
        steer.limit(this.maxForce);
      }
      
      return steer;
    }

    // 整列（近くの魚と同じ方向に泳ぐ）
    align(fishes) {
      let steer = p.createVector();
      let count = 0;
      
      for (let other of fishes) {
        let d = p5.Vector.dist(this.position, other.position);
        if (d > 0 && d < this.perception) {
          steer.add(other.velocity);
          count++;
        }
      }
      
      if (count > 0) {
        steer.div(count);
        steer.normalize();
        steer.mult(this.maxSpeed);
        steer.sub(this.velocity);
        steer.limit(this.maxForce);
      }
      
      return steer;
    }

    // 結合（群れの中心に向かう）
    cohesion(fishes) {
      let target = p.createVector();
      let count = 0;
      
      for (let other of fishes) {
        let d = p5.Vector.dist(this.position, other.position);
        if (d > 0 && d < this.perception) {
          target.add(other.position);
          count++;
        }
      }
      
      if (count > 0) {
        target.div(count);
        let desire = p5.Vector.sub(target, this.position);
        desire.normalize();
        desire.mult(this.maxSpeed);
        let steer = p5.Vector.sub(desire, this.velocity);
        steer.limit(this.maxForce);
        return steer;
      }
      
      return p.createVector();
    }
    
    // エサを探して追いかける
    seekFood(foods) {
      if (!this.hungry || foods.length === 0) {
        return p.createVector();
      }
      
      // エサのターゲットを決める
      if (!this.targetFood || this.targetFood.eaten) {
        let closestFood = null;
        let closestDist = this.perception * 2; // 視界の2倍まで
        
        for (let food of foods) {
          if (!food.eaten) {
            const d = p5.Vector.dist(this.position, food.position);
            if (d < closestDist) {
              closestDist = d;
              closestFood = food;
            }
          }
        }
        
        this.targetFood = closestFood;
      }
      
      // ターゲットが見つかったら追いかける
      if (this.targetFood) {
        const distance = p5.Vector.dist(this.position, this.targetFood.position);
        
        // エサに到達した
        if (distance < this.size) {
          this.targetFood.eaten = true;
          this.hungry = false;
          this.targetFood = null;
          
          // キラキラエフェクト発生
          for (let i = 0; i < 5; i++) {
            this.createSparkle();
          }
          
          return p.createVector();
        }
        
        // エサに向かう
        const desired = p5.Vector.sub(this.targetFood.position, this.position);
        desired.normalize();
        desired.mult(this.maxSpeed);
        
        const steer = p5.Vector.sub(desired, this.velocity);
        steer.limit(this.maxForce * 1.5); // 食べ物に対しては強い力で向かう
        
        return steer;
      }
      
      return p.createVector();
    }

    // 魚の行動を更新
    update() {
      // 尾びれをアニメーション
      this.tailAngle = p.sin(p.frameCount * this.tailSpeed) * 0.3;
      
      // キラキラエフェクトの更新
      this.updateSparkles();
      
      // 新しいキラキラを生成
      this.sparkleTimer++;
      if (this.sparkleTimer > this.nextSparkleTime) {
        this.createSparkle();
        this.sparkleTimer = 0;
        this.nextSparkleTime = p.random(60, 120);
      }
      
      // たまにお腹が空く
      if (!this.hungry && p.random() < 0.001) {
        this.hungry = true;
      }
      
      // 位置と速度の更新
      this.position.add(this.velocity);
      this.velocity.add(this.acceleration);
      this.velocity.limit(this.maxSpeed);
      this.acceleration.mult(0);
    }
    
    // キラキラエフェクトを生成
    createSparkle() {
      const offset = p5.Vector.random2D().mult(this.size * 0.7);
      const sparkleTypes = ['circle', 'star', 'diamond'];
      
      this.sparkles.push({
        position: p.createVector(
          this.position.x + offset.x, 
          this.position.y + offset.y
        ),
        size: p.random(3, 8),
        alpha: p.random(0.6, 1.0),
        type: sparkleTypes[Math.floor(p.random(sparkleTypes.length))]
      });
    }
    
    // キラキラエフェクトを更新
    updateSparkles() {
      for (let i = this.sparkles.length - 1; i >= 0; i--) {
        const sparkle = this.sparkles[i];
        sparkle.alpha -= 0.02;
        
        if (sparkle.alpha <= 0) {
          this.sparkles.splice(i, 1);
        }
      }
    }

    // 力を適用
    applyForce(force) {
      this.acceleration.add(force);
    }

    // お腹が空いているときの表示を改良
    drawHungryIndicator() {
      if (this.hungry && this.targetFood) {
        p.push();
        
        // 魚の上部に固定表示（位置調整）
        p.translate(this.position.x, this.position.y - this.size * 2.2);
        
        // 背景を魚の色に合わせた補色にする
        const hue = (p.hue(this.color) + 180) % 360; // 補色の色相
        p.fill(hue, 90, 100, 0.7);
        p.noStroke();
        
        // 吹き出しの形を変更（より魚に合った形に）
        p.beginShape();
        const bubbleSize = this.size * 1.3;
        for (let i = 0; i < 10; i++) {
          const angle = p.TWO_PI * i / 10;
          const r = bubbleSize * (1 + 0.1 * Math.sin(angle * 3));
          p.vertex(r * Math.cos(angle), r * Math.sin(angle));
        }
        p.endShape(p.CLOSE);
        
        // アイコンを大きくして見やすく
        p.fill(0);
        p.textSize(this.size * 1.1);
        p.textAlign(p.CENTER, p.CENTER);
        p.text("🍽️", 0, 0);
        
        p.pop();
      }
    }

    // 魚を描画（改良版）
    draw() {
      // キラキラエフェクトを描画
      for (const sparkle of this.sparkles) {
        p.push();
        p.translate(sparkle.position.x, sparkle.position.y);
        
        // 魚の色に合わせたキラキラ
        p.fill(p.hue(this.sparkleColor), 
               p.saturation(this.sparkleColor), 
               p.brightness(this.sparkleColor), 
               sparkle.alpha);
               
        // キラキラの形状
        p.noStroke();
        if (sparkle.type === 'circle') {
          p.ellipse(0, 0, sparkle.size, sparkle.size);
        } else if (sparkle.type === 'star') {
          drawStar(p, 0, 0, sparkle.size/2, sparkle.size, 5);
        } else {
          drawDiamond(p, 0, 0, sparkle.size);
        }
        
        p.pop();
      }
      
      p.push();
      p.translate(this.position.x, this.position.y);
      p.rotate(this.velocity.heading() + p.PI/2);
      
      // 体全体をHSBで描画
      p.colorMode(p.HSB, 360, 100, 100, 1);
      
      // 尾びれ（より魅力的な形状に）
      p.push();
      p.rotate(this.tailAngle);
      p.fill(p.hue(this.color), p.saturation(this.color), p.brightness(this.color), 0.8);
      p.noStroke();
      
      p.beginShape();
      p.vertex(-this.size * 0.7, this.size * 0.5);
      p.vertex(0, this.size * 2.5 * this.tailLength);
      p.vertex(this.size * 0.7, this.size * 0.5);
      p.endShape(p.CLOSE);
      p.pop();
      
      // エラ
      p.fill(p.hue(this.color), p.saturation(this.color) * 0.8, p.brightness(this.color) * 0.8, 0.7);
      p.ellipse(-this.size * 0.4, 0, this.size * 0.6, this.size * 0.5);
      
      // 魚の体
      const gradient = p.drawingContext.createLinearGradient(
        -this.size, 0, this.size, 0
      );
      
      // 体のグラデーション
      const baseH = p.hue(this.color);
      const baseS = p.saturation(this.color);
      const baseB = p.brightness(this.color);
      
      gradient.addColorStop(0, p.color(baseH, baseS * 0.9, baseB * 0.9, 0.9));
      gradient.addColorStop(0.5, p.color(baseH, baseS, baseB, 0.9));
      gradient.addColorStop(1, p.color(baseH, baseS * 0.8, baseB * 1.1, 0.9));
      
      p.drawingContext.fillStyle = gradient;
      
      // 体の輪郭（より自然な形に）
      p.beginShape();
      p.vertex(0, -this.size * 1.5 * this.bodyRatio);
      p.bezierVertex(
        this.size, -this.size * this.bodyRatio, 
        this.size, this.size * this.bodyRatio, 
        0, this.size * this.bodyRatio
      );
      p.bezierVertex(
        -this.size, this.size * this.bodyRatio, 
        -this.size, -this.size * this.bodyRatio, 
        0, -this.size * 1.5 * this.bodyRatio
      );
      p.endShape(p.CLOSE);
      
      // 胸びれ
      p.fill(p.hue(this.color), p.saturation(this.color) * 0.9, p.brightness(this.color) * 0.9, 0.7);
      p.push();
      p.translate(-this.size * 0.1, this.size * 0.3);
      p.rotate(p.sin(p.frameCount * 0.1) * 0.2);
      p.triangle(0, 0, this.size * 0.4, this.size * 0.6, -this.size * 0.1, this.size * 0.4);
      p.pop();
      
      // キラリと光る目
      const eyeGradient = p.drawingContext.createRadialGradient(
        this.size * 0.3, -this.size * 0.3, 0,
        this.size * 0.3, -this.size * 0.3, this.size * 0.3
      );
      
      eyeGradient.addColorStop(0, p.color(0, 0, 100, 1.0));
      eyeGradient.addColorStop(0.7, p.color(0, 0, 100, 0.8));
      eyeGradient.addColorStop(1, p.color(0, 0, 100, 0.3));
      
      p.drawingContext.fillStyle = eyeGradient;
      p.ellipse(this.size * 0.3, -this.size * 0.3, this.size * 0.3, this.size * 0.3);
      
      // 瞳
      p.fill(0, 0, 0, 0.9);
      p.ellipse(this.size * 0.3, -this.size * 0.3, this.size * 0.15, this.size * 0.15);
      
      // 目の光沢
      p.fill(0, 0, 100, 0.8);
      p.ellipse(this.size * 0.35, -this.size * 0.35, this.size * 0.07, this.size * 0.07);
      
      // 小さなヒレ（背びれ）
      p.fill(p.hue(this.color), p.saturation(this.color), p.brightness(this.color), 0.6);
      p.beginShape();
      p.vertex(-this.size * 0.1, -this.size * 0.8);
      p.vertex(this.size * 0.1, -this.size * 1.3);
      p.vertex(this.size * 0.3, -this.size * 0.8);
      p.endShape(p.CLOSE);
      
      p.colorMode(p.RGB, 255, 255, 255, 1);
      p.pop();
      
      // 空腹インジケーター（別メソッドに分離）
      this.drawHungryIndicator();
    }

    // 群れの行動を計算
    flock(fishes, foods) {
      let separation = this.separate(fishes);
      let alignment = this.align(fishes);
      let cohesion = this.cohesion(fishes);
      let edgeAvoidance = this.avoidEdges();
      let foodSeeking = this.seekFood(foods);

      // 各行動に重みを付ける
      separation.mult(1.5);
      alignment.mult(1.0);
      cohesion.mult(1.0);
      edgeAvoidance.mult(2.0);
      foodSeeking.mult(3.0); // エサ追いかけを優先

      // 力を適用
      this.applyForce(separation);
      this.applyForce(alignment);
      this.applyForce(cohesion);
      this.applyForce(edgeAvoidance);
      this.applyForce(foodSeeking);
    }
  }
  
  // エサのクラス
  class Food {
    constructor(x, y) {
      this.position = p.createVector(x, y);
      this.velocity = p.createVector(0, 0.5 + p.random(0.5));
      this.size = p.random(8, 12);
      this.eaten = false;
      this.alpha = 255;
      
      const foodTypes = ['🦐', '🦀', '🦑', '🐙', '🐚'];
      this.type = foodTypes[Math.floor(p.random(foodTypes.length))];
      
      this.rotation = p.random(p.TWO_PI);
      this.rotationSpeed = p.random(-0.05, 0.05);
      
      // 光の効果用
      this.glowSize = this.size * 1.2;
      this.glowAlpha = 0.3;
    }
    
    update() {
      if (!this.eaten) {
        this.position.add(this.velocity);
        this.rotation += this.rotationSpeed;
        
        // 光のパルス効果
        this.glowAlpha = 0.2 + Math.sin(p.frameCount * 0.1) * 0.1;
      } else {
        this.alpha -= 15;
      }
    }
    
    draw() {
      p.push();
      p.translate(this.position.x, this.position.y);
      p.rotate(this.rotation);
      
      // 光の効果
      if (!this.eaten) {
        p.fill(40, 100, 100, this.glowAlpha);
        p.noStroke();
        p.ellipse(0, 0, this.glowSize, this.glowSize);
      }
      
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(this.size);
      p.text(this.type, 0, 0);
      
      p.pop();
    }
    
    isOffScreen() {
      return this.position.y > p.height + this.size;
    }
    
    isFinished() {
      return this.eaten && this.alpha <= 0;
    }
  }
  
  // グラデーション背景を描画する関数
  function drawGradientBackground() {
    // グラデーション用の色を2つ用意
    const topColor = p.color(200, 70, 50); // 水面近くの色 (HSB)
    const bottomColor = p.color(220, 90, 20); // 水底の色 (HSB)
    
    // 画面を上から下へと分割して徐々に色を変えていく（効率化のため少しステップを飛ばす）
    for (let y = 0; y < p.height; y += 2) {
      const ratio = y / p.height;
      const currentColor = p.lerpColor(topColor, bottomColor, ratio);
      p.stroke(currentColor);
      p.line(0, y, p.width, y);
    }
    
    // 水面の光の効果を追加
    p.noStroke();
    for (let i = 0; i < 5; i++) {
      const x = p.width * (0.1 + i * 0.2);
      const size = p.width * 0.15 + p.sin(p.frameCount * 0.01 + i) * 20;
      const alpha = 0.07 + p.sin(p.frameCount * 0.02 + i) * 0.02;
      
      p.fill(60, 10, 100, alpha);
      p.ellipse(x, 0, size, size * 0.5);
    }
  }
  
  // 波紋などの水中エフェクト（改良版）
  function drawWaterEffects() {
    // 光の筋（より繊細に）
    p.noFill();
    for (let i = 0; i < 8; i++) {
      const x = p.width * (0.1 + i * 0.1);
      const alpha = 0.05 + p.sin(p.frameCount * 0.01 + i) * 0.03;
      
      p.stroke(200, 20, 100, alpha);
      p.strokeWeight(30 + p.sin(p.frameCount * 0.02 + i * 0.5) * 15);
      
      p.beginShape();
      for (let y = 0; y < p.height; y += 15) {
        const xOffset = p.sin(y * 0.01 + p.frameCount * 0.01) * 40;
        p.vertex(x + xOffset, y);
      }
      p.endShape();
    }
    
    // プランクトン効果（小さな光の粒）
    p.noStroke();
    p.fill(40, 20, 100, 0.3);
    
    // 特定のフレームでのみプランクトンを追加（パフォーマンス対策）
    if (p.frameCount % 10 === 0 && p.random() < 0.7) {
      const plankton = {
        x: p.random(p.width),
        y: p.random(p.height),
        size: p.random(1, 3),
        speed: p.random(0.1, 0.3),
        angle: p.random(p.TWO_PI),
        rotationSpeed: p.random(-0.01, 0.01)
      };
      planktons.push(plankton);
    }
    
    // プランクトン描画と更新
    for (let i = planktons.length - 1; i >= 0; i--) {
      const pl = planktons[i];
      
      // ゆっくりと動く
      pl.angle += pl.rotationSpeed;
      pl.x += Math.cos(pl.angle) * pl.speed;
      pl.y += Math.sin(pl.angle) * pl.speed + pl.speed * 0.2; // 少し上向きに流れる傾向
      
      // 光の効果
      if (p.random() < 0.1) {
        p.fill(40, 20, 100, p.random(0.2, 0.5));
        p.ellipse(pl.x, pl.y, pl.size * 1.5, pl.size * 1.5);
      }
      
      p.fill(40, 20, 100, 0.3);
      p.ellipse(pl.x, pl.y, pl.size, pl.size);
      
      // 画面外に出たプランクトンを削除
      if (pl.x < -10 || pl.x > p.width + 10 || pl.y < -10 || pl.y > p.height + 10) {
        planktons.splice(i, 1);
      }
      
      // プランクトンの最大数を制限
      if (planktons.length > 100) {
        planktons.shift();
      }
    }
    
    // 泡（改良版）
    p.fill(210, 10, 100, 0.5);
    
    if (p.random() < 0.4) {
      const bubble = {
        x: p.random(p.width),
        y: p.height + 10,
        size: p.random(2, 10),
        speed: p.random(0.7, 2.5),
        wobble: p.random(0.3, 1.0),
        wobbleSpeed: p.random(0.03, 0.07)
      };
      bubbles.push(bubble);
    }
    
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      b.y -= b.speed;
      b.x += Math.sin(p.frameCount * b.wobbleSpeed) * b.wobble;
      
      // 泡のキラキラ効果
      p.fill(210, 5, 100, 0.4);
      p.ellipse(b.x, b.y, b.size, b.size);
      
      // 泡の内側の光
      p.fill(210, 5, 100, 0.7);
      p.ellipse(b.x - b.size * 0.2, b.y - b.size * 0.2, b.size * 0.3, b.size * 0.3);
      
      if (b.y < -10) {
        bubbles.splice(i, 1);
      }
    }
  }
  
  // スター形状を描画するヘルパー関数
  function drawStar(p, x, y, radius1, radius2, npoints) {
    let angle = p.TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    p.beginShape();
    for (let a = 0; a < p.TWO_PI; a += angle) {
      let sx = x + p.cos(a) * radius2;
      let sy = y + p.sin(a) * radius2;
      p.vertex(sx, sy);
      sx = x + p.cos(a + halfAngle) * radius1;
      sy = y + p.sin(a + halfAngle) * radius1;
      p.vertex(sx, sy);
    }
    p.endShape(p.CLOSE);
  }

  // ダイヤモンド形状を描画するヘルパー関数
  function drawDiamond(p, x, y, size) {
    p.beginShape();
    p.vertex(x, y - size/2);
    p.vertex(x + size/2, y);
    p.vertex(x, y + size/2);
    p.vertex(x - size/2, y);
    p.endShape(p.CLOSE);
  }
  
  // エサの更新と描画
  function updateAndDrawFood() {
    for (let i = foods.length - 1; i >= 0; i--) {
      const food = foods[i];
      food.update();
      food.draw();
      
      if (food.isOffScreen() || food.isFinished()) {
        foods.splice(i, 1);
      }
    }
  }
  
  // ランダムな位置にエサを追加
  function addFood(count) {
    for (let i = 0; i < count; i++) {
      foods.push(new Food(
        p.random(p.width), 
        -p.random(20)
      ));
    }
  }
  
  // 魚の数の表示を更新
  function updateFishCountDisplay() {
    document.getElementById('fish-count').textContent = `魚の数: ${fishes.length}匹`;
  }
  
  p.setup = function() {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.colorMode(p.HSB, 360, 100, 100, 1);
    
    // 魚を初期生成
    for (let i = 0; i < initialFishCount; i++) {
      fishes.push(new Fish());
    }
    
    // ボタンイベント
    document.getElementById('add-fish-btn').addEventListener('click', function() {
      for (let i = 0; i < 10; i++) {
        fishes.push(new Fish());
      }
      updateFishCountDisplay();
    });
    
    document.getElementById('remove-fish-btn').addEventListener('click', function() {
      for (let i = 0; i < 10; i++) {
        if (fishes.length > 0) {
          fishes.pop();
        }
      }
      updateFishCountDisplay();
    });
    
    document.getElementById('feed-btn').addEventListener('click', function() {
      addFood(20);
    });
    
    // 魚の数の表示
    updateFishCountDisplay();
    
    // キャンバスクリックでエサを追加
    p.canvas.addEventListener('click', function(event) {
      const rect = p.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // クリック位置にエサを追加
      for (let i = 0; i < 5; i++) {
        foods.push(new Food(
          x + p.random(-20, 20), 
          y + p.random(-20, 20)
        ));
      }
    });
  };
  
  p.draw = function() {
    // グラデーション背景
    drawGradientBackground();
    
    // 波紋エフェクト
    drawWaterEffects();
    
    // エサの更新と描画
    updateAndDrawFood();
    
    // 魚の更新と描画
    for (let fish of fishes) {
      fish.flock(fishes, foods);
      fish.update();
      fish.draw();
    }
    
    // FPS表示の更新（30フレームごとに更新、負荷軽減）
    if (p.frameCount % 30 === 0) {
      document.getElementById('fps').textContent = `FPS: ${Math.floor(p.frameRate())}`;
    }
  };
  
  p.windowResized = function() {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
};

// p5.jsをインスタンス化
new p5(sketch);