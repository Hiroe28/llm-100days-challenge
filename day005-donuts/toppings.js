// 色パレット定義
const baseColors = [
    { name: 'プレーン', value: '#f9e4b7' },
    { name: 'チョコ', value: '#8B4513' },
    { name: 'ストロベリー', value: '#ff9a9e' },
    { name: 'マッチャ', value: '#a8e6cf' },
    { name: 'ブルーベリー', value: '#6a5acd' }
  ];
  
  const icingColors = [
    { name: 'ホワイト', value: '#ffffff' },
    { name: 'ピンク', value: '#ffb6c1' },
    { name: 'チョコ', value: '#8B4513' },
    { name: 'レモン', value: '#fff59d' },
    { name: 'ミント', value: '#98fb98' },
    { name: 'ブルー', value: '#87cefa' },
    { name: 'パープル', value: '#dda0dd' }
  ];
  
  const sprayColors = [
    { name: 'ホワイト', value: '#ffffff' },
    { name: 'ピンク', value: '#ff69b4' },
    { name: 'レッド', value: '#ff4d4d' },
    { name: 'オレンジ', value: '#ffa500' },
    { name: 'イエロー', value: '#ffff00' },
    { name: 'グリーン', value: '#4caf50' },
    { name: 'ブルー', value: '#2196f3' },
    { name: 'パープル', value: '#9c27b0' },
    { name: 'ブラウン', value: '#795548' },
    { name: 'レインボー', value: 'rainbow' }
  ];
  
  // トッピングの種類
  const toppings = {
    spray: {
      draw: function(x, y, size) {
        sprayPaint(x, y, size, 20);
      }
    },
    sprinkles: {
      draw: function(x, y, size) {
        // サイズに応じた安全マージンを設定（トッピングのサイズが大きいほどマージンも大きく）
        const margin = size * 0.5;
        if (isInsideDonut(x, y, margin)) {
          paintLayer.push();
          paintLayer.translate(x, y);
          paintLayer.rotate(random(TWO_PI));
          paintLayer.noStroke();
          paintLayer.fill(random([
            '#ff69b4', // ピンク
            '#ff4d4d', // 赤
            '#ffa500', // オレンジ
            '#ffff00', // 黄色
            '#4caf50', // 緑
            '#2196f3', // 青
            '#9c27b0', // 紫
            '#ffffff'  // 白
          ]));
          paintLayer.rect(0, 0, size, size / 3);
          paintLayer.pop();
        }
      }
    },
    choco: {
      draw: function(x, y, size) {
        const margin = size * 0.6;
        if (isInsideDonut(x, y, margin)) {
          paintLayer.noStroke();
          paintLayer.fill('#5D4037');
          paintLayer.ellipse(x, y, size, size);
        }
      }
    },
    heart: {
      draw: function(x, y, size) {
        // ハートは形が複雑なのでマージンを大きめに
        const margin = size * 0.8;
        if (isInsideDonut(x, y, margin)) {
          paintLayer.push();
          paintLayer.translate(x, y);
          paintLayer.noStroke();
          paintLayer.fill('#ff4d4d');
          
          // ハートのサイズを小さくする (元のサイズの約40%)
          const scaleFactor = 0.4;
          const s = size / 10 * scaleFactor;
          
          paintLayer.beginShape();
          for (let a = 0; a < TWO_PI; a += 0.1) {
            let r = s * (2 - sin(a) * sqrt(abs(cos(a)))) * 5;
            let nx = r * cos(a);
            let ny = r * sin(a);
            paintLayer.vertex(nx, ny);
          }
          paintLayer.endShape(CLOSE);
          paintLayer.pop();
        }
      }
    },
    star: {
      draw: function(x, y, size) {
        // 星も形が複雑なのでマージンを大きめに
        const margin = size * 0.8;
        if (isInsideDonut(x, y, margin)) {
          paintLayer.push();
          paintLayer.translate(x, y);
          paintLayer.noStroke();
          paintLayer.fill('#FFD700');
          
          // 星のサイズを少し小さくする
          const scaledSize = size * 0.8;
          
          paintLayer.beginShape();
          for (let i = 0; i < 5; i++) {
            let angle = TWO_PI / 10 * (i * 2);
            let sx = cos(angle) * scaledSize / 2;
            let sy = sin(angle) * scaledSize / 2;
            paintLayer.vertex(sx, sy);
            
            angle = TWO_PI / 10 * (i * 2 + 1);
            sx = cos(angle) * scaledSize / 4;
            sy = sin(angle) * scaledSize / 4;
            paintLayer.vertex(sx, sy);
          }
          paintLayer.endShape(CLOSE);
          
          paintLayer.pop();
        }
      }
    }
  };
  
  // スプレーペイントを描画
  function sprayPaint(x, y, size, density) {
    const sprayRadius = size;
    const dots = density || Math.floor(size * 3);
    
    // スプレーが境界にかかる場合でも、内側のドットは描画できるようにマージンを小さく
    const margin = 0; // スプレーは境界ぎりぎりまで描画可能
    
    for (let i = 0; i < dots; i++) {
      const offsetX = random(-1, 1) * sprayRadius;
      const offsetY = random(-1, 1) * sprayRadius;
      const dotX = x + offsetX;
      const dotY = y + offsetY;
      
      // ドーナツの内側かチェック
      if (isInsideDonut(dotX, dotY, margin)) {
        paintLayer.noStroke();
        
        // レインボーモードの場合はランダムな色を使用
        if (sprayColor === 'rainbow') {
          paintLayer.fill(random([
            '#ff69b4', // ピンク
            '#ff4d4d', // 赤
            '#ffa500', // オレンジ
            '#ffff00', // 黄色
            '#4caf50', // 緑
            '#2196f3', // 青
            '#9c27b0'  // 紫
          ]));
        } else {
          paintLayer.fill(sprayColor);
        }
        
        const dotSize = random(1, 4);
        paintLayer.ellipse(dotX, dotY, dotSize, dotSize);
      }
    }
  }
  
  // トッピングのランダム配置
  function addRandomToppings(type, count = 30) {
    // スプレーの場合は異なる処理
    if (type === 'spray') {
      const centerX = width / 2;
      const centerY = height / 2;
      const donutRadius = min(width, height) * 0.35;
      
      // スプレーはドーナツ全体に均等に配置
      for (let i = 0; i < count; i++) {
        let r, angle, x, y;
        
        if (donutShape === 'ring') {
          const innerRadius = donutRadius * 0.4;
          r = random(innerRadius * 1.05, donutRadius * 0.95);
        } else {
          r = random(0.05, 0.95) * donutRadius;
        }
        
        angle = random(TWO_PI);
        x = centerX + cos(angle) * r;
        y = centerY + sin(angle) * r;
        
        sprayPaint(x, y, random(5, 15), random(5, 15));
      }
      return;
    }
    
    // トッピングの場合
    const centerX = width / 2;
    const centerY = height / 2;
    const donutRadius = min(width, height) * 0.35;
    
    let attempts = 0;
    const maxAttempts = count * 5; // 最大試行回数を増やす
    let placedCount = 0;
    
    // トッピングタイプに応じたマージン（サイズに比例）
    const marginFactor = {
      'sprinkles': 0.5,
      'choco': 0.6,
      'heart': 0.8,
      'star': 0.8
    };
    
    // サイズに応じた安全マージン
    const margin = toppingSize * (marginFactor[type] || 0.6);
    
    while (placedCount < count && attempts < maxAttempts) {
      attempts++;
      
      // より効率的にランダムな位置を生成
      let r, angle, x, y;
      
      if (donutShape === 'ring') {
        const innerRadius = donutRadius * 0.4;
        const safeInnerRadius = innerRadius + margin;
        const safeOuterRadius = donutRadius - margin;
        
        // 境界から安全マージン分内側に配置
        if (safeInnerRadius < safeOuterRadius) {
          r = random(safeInnerRadius, safeOuterRadius);
          angle = random(TWO_PI);
          x = centerX + cos(angle) * r;
          y = centerY + sin(angle) * r;
        } else {
          // 安全な領域がない場合はスキップ
          continue;
        }
      } 
      else { // jam
        // 端から安全マージン分内側に配置
        const safeRadius = donutRadius - margin;
        if (safeRadius > 0) {
          r = random(margin, safeRadius);
          angle = random(TWO_PI);
          x = centerX + cos(angle) * r;
          y = centerY + sin(angle) * r;
        } else {
          // 安全な領域がない場合はスキップ
          continue;
        }
      }
      
      // ドーナツの内側の場合のみ配置（安全マージンを考慮）
      if (isInsideDonut(x, y, margin)) {
        toppings[type].draw(x, y, toppingSize);
        placedCount++;
      }
    }
  }
