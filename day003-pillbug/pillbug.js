/**
 * ダンゴムシクラス
 * 交替性転向反応を持つダンゴムシを表現するクラス
 */
class Pillbug {
    /**
     * ダンゴムシを初期化する
     * @param {p5.Vector} startPos - スタート位置
     * @param {Maze} maze - 迷路オブジェクト
     */
    constructor(startPos, maze) {
      this.position = startPos.copy(); // ダンゴムシの現在位置
      this.velocity = createVector(0, -1); // 初期速度（上向き）
      this.speed = 1; // さらに遅い移動速度
      this.size = 15; // さらに小さなサイズ
      this.maze = maze; // 迷路への参照
      
      this.movementHistory = []; // 移動履歴
      this.showPath = false; // 経路表示フラグ
      
      this.isMoving = false; // 移動中フラグ
      this.turnDirection = 'left'; // 次に曲がる方向（left/right）
      
      // 触角のパラメータ
      this.antennaLength = this.size * 0.8;
      this.antennaAngle = PI / 4; // 触角の開き角度
      
      // ボディセグメントの情報
      this.segments = [];
      this.maxSegments = 5; // セグメント数
      
      // T字路検出用のパラメータ
      this.junctionDetectionRadius = 12; // 検出範囲をさらに小さく
      
      // 現在のT字路情報（検出中のもの）
      this.currentJunction = null;
      this.hasProcessedJunction = false; // 現在のT字路を処理済みかのフラグ
      
      // 衝突回避用のカウンター
      this.stuckCounter = 0;
      this.lastPosition = this.position.copy();
      
      // セーフティフラグ（壁のすり抜け防止用）
      this.safetyChecksEnabled = true;
      
      console.log("ダンゴムシ初期化: 位置=", this.position.x, this.position.y, "サイズ=", this.size);
    }
    
    // /**
    //  * 速度を設定する
    //  * @param {number} speed - 新しい速度（1〜10）
    //  */
    // setSpeed(speed) {
    //   // 速度範囲を大幅に下げる（壁すり抜け防止のため）
    //   const safeSpeed = map(speed, 1, 10, 0.2, 0.8);
    //   this.speed = safeSpeed;
      
    //   // 現在の速度ベクトルの大きさを調整
    //   if (this.velocity.mag() > 0) {
    //     this.velocity.setMag(this.speed);
    //   }
      
    //   console.log("速度を設定: ", this.speed);
    // }
    /**
     * 速度を設定する
     * @param {number} speed - 新しい速度（1〜10）
     */
    setSpeed(speed) {
        // 速度範囲を適切に調整（1が最も遅く、10が最も速い）
        const safeSpeed = map(speed, 1, 10, 0.2, 1.8);
        this.speed = safeSpeed;
        
        // 現在の速度ベクトルの大きさを調整
        if (this.velocity.mag() > 0) {
          this.velocity.setMag(this.speed);
        }
        
        console.log("速度を設定: ", this.speed);
      }

    
    /**
     * 経路表示設定を切り替える
     * @param {boolean} showPath - 経路を表示するかどうか
     */
    setShowPath(showPath) {
      this.showPath = showPath;
    }
    
    /**
     * ダンゴムシの移動を開始する
     */
    start() {
      this.isMoving = true;
    }
    
    /**
     * ダンゴムシの移動を停止する
     */
    stop() {
      this.isMoving = false;
    }
    
    /**
     * ダンゴムシをリセットする（スタート位置に戻す）
     */
    reset() {
      this.position = this.maze.startPosition.copy();
    //   this.position.y += 25; // 衝突防止のためにさらに下に調整
      this.velocity = createVector(0, -1); // 上向き
      this.velocity.setMag(this.speed);
      this.movementHistory = [];
      this.turnDirection = 'left'; // リセット時は左から始める
      this.currentJunction = null;
      this.hasProcessedJunction = false;
      this.segments = [];
      this.stuckCounter = 0;
      this.lastPosition = this.position.copy();
      
      // 壁にめり込んでいないか確認
      if (this.maze.checkCollision(this.position, this.size / 2)) {
        // めり込んでいる場合はさらに下に移動
        this.position.y += 10;
        console.log("リセット時に壁のめり込みを検出、位置を調整しました");
      }
      
      console.log("ダンゴムシをリセットしました: 位置=", this.position.x, this.position.y);
    }
    
    /**
     * ダンゴムシを更新する（毎フレーム呼び出される）
     */
    update() {
      if (!this.isMoving) return;
      
      // 現在位置を履歴に追加
      if (frameCount % 5 === 0) {
        this.movementHistory.push(this.position.copy());
        if (this.movementHistory.length > 1000) {
          this.movementHistory.shift();
        }
      }
      
      // ボディセグメントの更新
      this.updateSegments();
      
      // 極めて小さな単位で移動（壁をすり抜けないように）
      const tinyStepCount = 10; // 1フレームの移動を10ステップに分ける
      const tinyStepSize = this.speed / tinyStepCount;
      
      // T字路の検出
      const junction = this.maze.isNearTJunction(this.position, this.junctionDetectionRadius);
      
      if (junction && !this.hasProcessedJunction) {
        this.currentJunction = junction;
        
        // 前方の壁チェック
        const futurePos = p5.Vector.add(
          this.position, 
          p5.Vector.mult(this.velocity, this.speed * 2)
        );
        
        if (this.maze.checkCollision(futurePos, this.size / 2.5)) {
          console.log("T字路で壁を検出、方向転換: " + this.turnDirection);
          
          // 交替性転向反応に従って方向転換
          this.turn(this.turnDirection);
          
          // 次回の転向方向を切り替え
          this.turnDirection = this.turnDirection === 'left' ? 'right' : 'left';
          
          // この交差点を処理済みとマーク
          this.hasProcessedJunction = true;
        }
      } else if (!junction && this.hasProcessedJunction) {
        this.hasProcessedJunction = false;
        this.currentJunction = null;
      }
      
      // 現在既に壁に埋まっていないかチェック
      if (this.maze.checkCollision(this.position, this.size / 2.5)) {
        console.log("現在壁に埋まっています！緊急脱出実行");
        
        // 壁から離れる方向を探索
        for (let angle = 0; angle < TWO_PI; angle += PI/4) {
          const testVector = p5.Vector.fromAngle(angle).setMag(10);
          const testPos = p5.Vector.add(this.position, testVector);
          
          if (!this.maze.checkCollision(testPos, this.size / 2.5)) {
            // 安全な方向を見つけた
            this.position = testPos;
            this.velocity = p5.Vector.fromAngle(angle).setMag(this.speed);
            console.log("安全な方向を見つけました: " + angle);
            break;
          }
        }
        
        // どの方向も安全でなければ、より大きく移動を試みる
        if (this.maze.checkCollision(this.position, this.size / 2.5)) {
          // スタート位置近くにリセット
          this.position = this.maze.startPosition.copy();
          this.position.y += 20;
          this.velocity = createVector(0, -1).setMag(this.speed);
          console.log("安全な位置が見つからないため、スタート地点に戻ります");
        }
        
        return; // このフレームはこれ以上処理しない
      }
      
      // 前方の壁チェック
      let canMove = true;
      const maxLookAhead = 5; // 前方チェックの距離
      
      // 複数の感覚を持つような前方チェック（触角のように）
      const sensorAngles = [0, PI/8, -PI/8, PI/4, -PI/4]; // 中央と左右の触角
      
      for (let angle of sensorAngles) {
        const sensorDir = p5.Vector.fromAngle(this.velocity.heading() + angle).setMag(maxLookAhead);
        const sensorPos = p5.Vector.add(this.position, sensorDir);
        
        if (this.maze.checkCollision(sensorPos, this.size / 3)) {
          canMove = false;
          break;
        }
      }
      
      if (!canMove) {
        // 壁を検出：交替性転向反応
        console.log("前方の壁を検出、方向転換を実行: " + this.turnDirection);
        this.turn(this.turnDirection);
        this.turnDirection = this.turnDirection === 'left' ? 'right' : 'left';
      } else {
        // 壁がなければ、細かいステップで慎重に移動
        for (let i = 0; i < tinyStepCount; i++) {
          const nextPos = p5.Vector.add(
            this.position,
            p5.Vector.mult(this.velocity, tinyStepSize)
          );
          
          // 移動先が安全か確認
          if (!this.maze.checkCollision(nextPos, this.size / 2.5)) {
            this.position = nextPos;
          } else {
            // 移動中に衝突を検出
            console.log("細かい移動中に衝突を検出");
            
            // 方向転換
            this.turn(this.turnDirection);
            this.turnDirection = this.turnDirection === 'left' ? 'right' : 'left';
            break;
          }
        }
      }
      
    //   // 移動が停滞していないかチェック
    //   if (frameCount % 30 === 0) {
    //     const movement = dist(this.position.x, this.position.y, this.lastPosition.x, this.lastPosition.y);
        
    //     if (movement < 2 && this.isMoving) {
    //       console.log("移動が停滞しています。方向をランダム化");
    //       const randomAngle = random(TWO_PI);
    //       this.velocity = p5.Vector.fromAngle(randomAngle).setMag(this.speed);
    //     }
        
    //     this.lastPosition = this.position.copy();
    //   }

        // 移動が停滞していないかチェック（より頻繁にチェック）
        if (frameCount % 20 === 0) {
            const movement = dist(this.position.x, this.position.y, this.lastPosition.x, this.lastPosition.y);
            
            if (movement < 2 && this.isMoving) {
            this.stuckCounter++;
            console.log("移動が停滞しています。カウンター:", this.stuckCounter);
            
            if (this.stuckCounter > 2) {
                // 2回以上停滞を検出したら、より積極的に抜け出す対策を取る
                console.log("長時間の停滞を検出。緊急回避処理を実行");
                
                // 複数方向を試して壁から離れる
                const escapeAngles = [0, PI/4, PI/2, 3*PI/4, PI, 5*PI/4, 3*PI/2, 7*PI/4];
                let escaped = false;
                
                for (let angle of escapeAngles) {
                const escapeVector = p5.Vector.fromAngle(angle).setMag(this.size);
                const escapePos = p5.Vector.add(this.position, escapeVector);
                
                if (!this.maze.checkCollision(escapePos, this.size / 2)) {
                    this.position = escapePos;
                    this.velocity = p5.Vector.fromAngle(angle).setMag(this.speed);
                    console.log("停滞から脱出成功！新方向:", angle);
                    escaped = true;
                    break;
                }
                }
                
                // 全方向が壁に塞がれている場合、スタート位置近くにリセット
                if (!escaped) {
                this.position = this.maze.startPosition.copy();
                this.position.y += 20;
                this.velocity = createVector(0, -1).setMag(this.speed);
                console.log("完全に行き詰まりました。スタート地点に戻ります");
                }
                
                this.stuckCounter = 0;
            } else {
                // 軽度の停滞ならランダムな方向転換を試みる
                const randomAngle = random(TWO_PI);
                this.velocity = p5.Vector.fromAngle(randomAngle).setMag(this.speed);
            }
            } else {
            // 正常に動いていればカウンターをリセット
            this.stuckCounter = 0;
            }
            
            this.lastPosition = this.position.copy();
        }


    }



    
    // /**
    //  * ボディセグメントを更新する
    //  */
    // updateSegments() {
    //   // 頭の位置を先頭に追加
    //   if (frameCount % 3 === 0) { // 更新頻度を調整
    //     this.segments.unshift({
    //       pos: this.position.copy(),
    //       vel: this.velocity.copy()
    //     });
        
    //     // セグメント数を制限
    //     if (this.segments.length > this.maxSegments) {
    //       this.segments.pop();
    //     }
    //   }
    // }
    /**
     * ボディセグメントを更新する
     */
    updateSegments() {
        // セグメントを使わない場合は空の配列を維持
        this.segments = [];
    }

    
    /**
     * 指定された方向に曲がる
     * @param {string} direction - 曲がる方向（'left'または'right'）
     */
    turn(direction) {
      // 現在の進行方向に対して左または右に曲がる
      const currentHeading = this.velocity.heading();
      let newHeading;
      
      if (direction === 'left') {
        newHeading = currentHeading - HALF_PI; // 左に90度
      } else {
        newHeading = currentHeading + HALF_PI; // 右に90度
      }
      
      // 新しい方向ベクトルを設定
      this.velocity = p5.Vector.fromAngle(newHeading);
      this.velocity.setMag(1); // 速度の大きさを1に正規化
    }
    
    /**
     * ダンゴムシを描画する
     */
    display() {
      // 経路の描画（オプション）
      if (this.showPath && this.movementHistory.length > 0) {
        stroke(100, 200, 255, 150);
        strokeWeight(2);
        noFill();
        beginShape();
        for (let pos of this.movementHistory) {
          vertex(pos.x, pos.y);
        }
        endShape();
      }
      
      // ボディセグメントの描画
      this.displaySegments();
      
      push();
      translate(this.position.x, this.position.y);
      rotate(this.velocity.heading() + PI/2); // ダンゴムシの向きを進行方向に合わせる
      
      // ダンゴムシの体
      fill(90, 90, 90); // 元のダークグレー
      ellipse(0, 0, this.size, this.size * 1.2);
      
      // 触角
      stroke(60, 60, 60);
      strokeWeight(1.5);
      
      // 左触角
      line(0, -this.size/2, 
           -this.antennaLength * sin(this.antennaAngle), 
           -this.size/2 - this.antennaLength * cos(this.antennaAngle));
      
      // 右触角
      line(0, -this.size/2, 
           this.antennaLength * sin(this.antennaAngle), 
           -this.size/2 - this.antennaLength * cos(this.antennaAngle));
      
      // 目
      fill(0);
      ellipse(-this.size/4, -this.size/4, 4, 4);
      ellipse(this.size/4, -this.size/4, 4, 4);
      
      pop();
    }
    
    /**
     * ボディセグメントを描画する
     */
    displaySegments() {
    //   // 最後から描画（頭が最前面になるように）
    //   for (let i = this.segments.length - 1; i >= 0; i--) {
    //     const segment = this.segments[i];
    //     const alpha = map(i, 0, this.segments.length - 1, 255, 150); // 透明度を徐々に下げる
    //     const size = map(i, 0, this.segments.length - 1, this.size * 0.9, this.size * 0.6); // サイズも徐々に小さく
        
    //     push();
    //     translate(segment.pos.x, segment.pos.y);
    //     rotate(segment.vel.heading() + PI/2);
        
    //     fill(90, 90, 90, alpha); // 元のグレー
    //     noStroke();
    //     ellipse(0, 0, size, size * 1.2);
        
    //     pop();
    //   }
    }
    
    /**
     * 現在の状態情報を取得する
     * @returns {Object} 状態情報
     */
    getStatus() {
      return {
        isMoving: this.isMoving,
        nextTurn: this.turnDirection,
        position: this.position.copy(),
        velocity: this.velocity.copy()
      };
    }
  }

  