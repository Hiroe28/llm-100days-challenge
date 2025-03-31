/**
 * 迷路クラス
 * T字路を含む簡単な迷路を管理するクラス
 */
class Maze {
    /**
     * 迷路を初期化する
     * @param {number} width - 迷路の幅
     * @param {number} height - 迷路の高さ
     */
    constructor(width, height) {
      this.width = width;
      this.height = height;
      this.walls = []; // 壁の情報を格納する配列
      this.tJunctions = []; // T字路の位置情報
      this.startPosition = null; // スタート位置
    //   this.goalPosition = null;  // ゴール位置
      
      // 迷路の構造を生成
      this.generateMaze();
    }
    
    /**
     * 迷路の構造を生成する
     */
    generateMaze() {
      // 基本設定
      const margin = 50;          // 余白
      const pathWidth = 100;      // 通路の幅（より広く設定）
      const centerX = this.width / 2; // 中央X座標
      
      // スタート位置を設定（下部中央）
      this.startPosition = createVector(centerX, this.height - margin - 20);
      
      // ゴール位置を設定（左上）
    //   this.goalPosition = createVector(margin + 30, margin + 30);
      
      // 壁をすべてクリア
      this.walls = [];
      
      // ----------------------------------------------------------------
      // 外側の縦の壁
      // ----------------------------------------------------------------
      
      // 左側の縦の壁
      this.walls.push({
        x1: margin,
        y1: margin,
        x2: margin,
        y2: this.height - margin
      });
      
      // 右側の縦の壁
      this.walls.push({
        x1: this.width - margin,
        y1: margin,
        x2: this.width - margin,
        y2: this.height - margin
      });

    // 左側の縦の壁2 - 高さを比率で指定
    this.walls.push({
        x1: margin * 3,
        y1: margin,
        x2: margin * 3,
        y2: this.height / 2 - pathWidth / 2,
    });
    
    // 右側の縦の壁2 - 高さを比率で指定
    this.walls.push({
        x1: this.width - margin * 3,
        y1: margin,
        x2: this.width - margin * 3,
        y2: this.height / 2 - pathWidth / 2,
    });


      
      // ----------------------------------------------------------------
      // 上部の横壁
      // ----------------------------------------------------------------
      this.walls.push({
        x1: margin,
        y1: margin,
        x2: this.width - margin,
        y2: margin
      });
      
      // ----------------------------------------------------------------
      // 下部の横壁（スタート位置を除く）
      // ----------------------------------------------------------------

      this.walls.push({
        x1: margin,
        y1: this.height - margin,
        x2: this.width - margin,
        y2: this.height - margin
      });

      
      // ----------------------------------------------------------------
      // 中央の縦壁（2本） - H型の柱部分
      // ----------------------------------------------------------------
      
      // 左側の縦壁
      this.walls.push({
        x1: centerX - pathWidth / 2,
        y1: this.height - margin,
        x2: centerX - pathWidth / 2,
        y2: this.height / 2 + pathWidth / 2
      });
      
      // 右側の縦壁
      this.walls.push({
        x1: centerX + pathWidth / 2,
        y1: this.height - margin,
        x2: centerX + pathWidth / 2,
        y2: this.height / 2 + pathWidth / 2
      });
      
      // ----------------------------------------------------------------
      // H型の上部の横壁
      // ----------------------------------------------------------------
      this.walls.push({
        x1: margin * 3,
        y1: this.height / 2 - pathWidth / 2,
        x2: this.width - margin * 3,
        y2: this.height / 2 - pathWidth / 2
      });
      
      // H型の上部の横壁（左右で分割して真ん中を開ける）
      this.walls.push({
        x1: margin,
        y1: this.height / 2 - pathWidth / 2 + margin * 2,
        x2: centerX - pathWidth / 2,
        y2: this.height / 2 - pathWidth / 2 + margin * 2
      });
      
      this.walls.push({
        x1: centerX + pathWidth / 2,
        y1: this.height / 2 - pathWidth / 2 + margin * 2,
        x2: this.width - margin,
        y2: this.height / 2 - pathWidth / 2 + margin * 2
      });
      
      // T字路の位置を記録（ダンゴムシの判定用）
      this.tJunctions = [
        {
          x: centerX,
          y: this.height / 2,
          type: 'T_UP' // 上向きのT字路（上方向に壁がある）
        }
      ];
    }
    
    /**
     * 迷路を描画する
     */
    display() {
      // 床/背景の描画
      fill(240, 240, 240);  // 薄いグレー
      noStroke();
      rect(0, 0, this.width, this.height);
      
      // 壁の描画（より太く）
      stroke(0);  // 黒色
      strokeWeight(8);  // 壁を太く
      
      for (let wall of this.walls) {
        line(wall.x1, wall.y1, wall.x2, wall.y2);
      }
      
      // スタート位置の表示
      fill(0, 200, 0);  // 緑
      noStroke();
      ellipse(this.startPosition.x, this.startPosition.y, 15, 15);
      textSize(16);
      textAlign(CENTER, CENTER);
      fill(0);
      text("S", this.startPosition.x, this.startPosition.y + 30);
      
    //   // ゴール位置の表示
    //   fill(200, 0, 0);  // 赤
    //   noStroke();
    //   ellipse(this.goalPosition.x, this.goalPosition.y, 15, 15);
    //   textSize(16);
    //   textAlign(CENTER, CENTER);
    //   fill(0);
    //   text("G", this.goalPosition.x - 20, this.goalPosition.y);
      
      // デバッグ用にT字路の位置を表示（必要に応じてコメント解除）
      if (false) {
        for (let junction of this.tJunctions) {
          fill(255, 0, 0, 100);
          ellipse(junction.x, junction.y, 20, 20);
          fill(0);
          text(junction.type, junction.x, junction.y - 20);
        }
      }
    }
    
    /**
     * 指定された点が壁に衝突しているかチェックする
     * @param {p5.Vector} position - チェックする位置
     * @param {number} radius - 衝突判定の半径
     * @returns {boolean} 衝突していればtrue
     */
    checkCollision(position, radius) {
      // 安全マージンを加える（壁の見た目よりも少し広い範囲で判定）
      const safetyMargin = 2;
      const effectiveRadius = radius + safetyMargin;
      
      for (let wall of this.walls) {
        // 点と線分の最短距離を計算
        const distance = this.distToSegment(
          position.x, position.y,
          wall.x1, wall.y1,
          wall.x2, wall.y2
        );
        
        // 距離が半径（＋マージン）より小さければ衝突
        if (distance < effectiveRadius) {
          return true;
        }
      }
      
      // 画面の外に出ようとしている場合も衝突と判定
      const boundaryMargin = 10;
      if (position.x < boundaryMargin || 
          position.x > this.width - boundaryMargin || 
          position.y < boundaryMargin || 
          position.y > this.height - boundaryMargin) {
        return true;
      }
      
      return false;
    }
    
    /**
     * 点(x,y)と線分(x1,y1)-(x2,y2)の最短距離を計算
     * @returns {number} 最短距離
     */
    distToSegment(x, y, x1, y1, x2, y2) {
      const A = x - x1;
      const B = y - y1;
      const C = x2 - x1;
      const D = y2 - y1;
      
      const dot = A * C + B * D;
      const len_sq = C * C + D * D;
      let param = -1;
      
      if (len_sq !== 0) {
        param = dot / len_sq;
      }
      
      let xx, yy;
      
      if (param < 0) {
        xx = x1;
        yy = y1;
      } else if (param > 1) {
        xx = x2;
        yy = y2;
      } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
      }
      
      const dx = x - xx;
      const dy = y - yy;
      
      return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * 指定された位置が特定のT字路の近くにあるかチェック
     * @param {p5.Vector} position - チェックする位置
     * @param {number} threshold - 判定する距離のしきい値
     * @returns {Object|null} T字路情報またはnull
     */
    isNearTJunction(position, threshold) {
      for (let junction of this.tJunctions) {
        const distance = dist(position.x, position.y, junction.x, junction.y);
        if (distance < threshold) {
          // デバッグ用ログ
          console.log(`T字路検出: ${junction.type}, 距離: ${distance.toFixed(2)}`);
          return junction;
        }
      }
      return null;
    }
  }