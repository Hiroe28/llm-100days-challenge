/**
 * 楽譜の描画と管理に関するモジュール
 */

// VexFlowの一般的な設定
let vfInstance = null;

/**
 * 楽譜を描画する関数
 * @param {string} noteId - 描画する音符のID (例: 'C4')
 * @param {string} containerId - 楽譜を描画するコンテナのID
 */
function drawSheet(noteId, containerId = 'sheet-music-container') {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container element with ID "${containerId}" not found.`);
    return;
  }
  
  // コンテナをクリア
  container.innerHTML = '';
  
  try {
    // VexFlowを使用して楽譜を描画
    const { Factory } = Vex.Flow;
    
    // レンダラーとファクトリーの設定 - 幅を広げる
    const containerWidth = container.clientWidth || 300;
    vfInstance = new Factory({
      renderer: {
        elementId: containerId,
        width: containerWidth,
        height: container.clientHeight || 150
      }
    });
    
    const score = vfInstance.EasyScore();
    const system = vfInstance.System({
      // スタッフの横幅を指定してスペースを確保
      width: containerWidth - 50,
      spaceBetweenStaves: 10
    });
    
    // 音符の処理（例：'C4'の'C'）
    const noteLetter = noteId.charAt(0);
    const octave = noteId.charAt(1);
    
    // 音符の特別なフォーマット設定
    const noteConfig = {
      align_center: true,
      // 音符間の間隔を広げるための設定
      space: 100
    };
    
    // VexFlowは小節全体を必要とするので、音符とレストで埋める
    // 四分音符と4拍の休符を追加 - 間隔を広げる
    const noteString = `${noteLetter}${octave}/q, B4/r, B4/r, B4/r`;
    
    // 楽譜に音符を追加
    system
      .addStave({
        voices: [
          score.voice(score.notes(noteString, noteConfig)),
        ],
      })
      .addClef('treble')
      .addTimeSignature('4/4');
    
    // 描画実行
    vfInstance.draw();
    
    // 楽譜表示の配置を調整
    const svgElement = container.querySelector('svg');
    if (svgElement) {
      // SVG要素を中央に配置
      svgElement.style.display = 'block';
      svgElement.style.margin = '0 auto';
      
      // 追加の視覚的調整（必要に応じて）
      svgElement.style.overflow = 'visible';
      
      // スケールを少し調整して大きく表示
      svgElement.style.transform = 'scale(1.1)';
      svgElement.style.transformOrigin = 'center center';
      
      // レストを非表示にする試み（オプション）
      const rests = svgElement.querySelectorAll('.vf-rest');
      rests.forEach(rest => {
        rest.style.opacity = '0.1'; // 完全に非表示ではなく薄く
      });
    }
    
  } catch (error) {
    console.error('Error drawing sheet music:', error);
    container.innerHTML = '<div style="color: #666; padding: 20px;">楽譜の表示に失敗しました</div>';
  }
}

/**
 * メロディーを楽譜に描画する関数
 * @param {Array<string>} noteIds - 音符IDの配列（例: ['C4', 'E4', 'G4']）
 * @param {string} containerId - 楽譜を描画するコンテナのID
 */
function drawMelody(noteIds, containerId = 'sheet-music-container') {
  // メロディー関連コードは同様に修正...
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container element with ID "${containerId}" not found.`);
    return;
  }
  
  // コンテナをクリア
  container.innerHTML = '';
  
  try {
    // VexFlowを使用して楽譜を描画
    const { Factory } = Vex.Flow;
    
    // レンダラーとファクトリーの設定 - 幅を広げる
    const containerWidth = container.clientWidth || 300;
    vfInstance = new Factory({
      renderer: {
        elementId: containerId,
        width: containerWidth,
        height: container.clientHeight || 150
      }
    });
    
    const score = vfInstance.EasyScore();
    const system = vfInstance.System({
      width: containerWidth - 50,
      spaceBetweenStaves: 10
    });
    
    // すべて四分音符に統一
    const duration = 'q';
    
    // 音符の特別なフォーマット設定
    const noteConfig = {
      align_center: true,
      space: 100
    };
    
    // 音符文字列を作成
    let noteString = '';
    
    // 小節を埋めるために必要な音符/休符を生成
    if (noteIds.length > 0) {
      // 与えられた音符を使用
      noteString = noteIds.map(id => {
        const note = id.charAt(0);
        const octave = id.charAt(1);
        return `${note}${octave}/${duration}`;
      }).join(', ');
      
      // 残りの拍を休符で埋める
      const restCount = 4 - noteIds.length;
      for (let i = 0; i < restCount; i++) {
        noteString += ', B4/r';
      }
    } else {
      // 音符がない場合は全て休符
      noteString = 'B4/r, B4/r, B4/r, B4/r';
    }
    
    // 楽譜に音符を追加
    system
      .addStave({
        voices: [
          score.voice(score.notes(noteString, noteConfig)),
        ],
      })
      .addClef('treble')
      .addTimeSignature('4/4');
    
    // 描画実行
    vfInstance.draw();
    
    // 楽譜表示の配置を調整
    const svgElement = container.querySelector('svg');
    if (svgElement) {
      // SVG要素を中央に配置
      svgElement.style.display = 'block';
      svgElement.style.margin = '0 auto';
      
      // スケールを少し調整して大きく表示
      svgElement.style.transform = 'scale(1.1)';
      svgElement.style.transformOrigin = 'center center';
      
      // レストを非表示にする試み
      const rests = svgElement.querySelectorAll('.vf-rest');
      rests.forEach(rest => {
        rest.style.opacity = '0.1';
      });
    }
    
  } catch (error) {
    console.error('Error drawing melody:', error);
    container.innerHTML = '<div style="color: #666; padding: 20px;">メロディーの表示に失敗しました</div>';
  }
}

/**
 * 楽譜のインスタンスをクリアする関数
 */
function clearSheet() {
  if (vfInstance) {
    vfInstance = null;
  }
}