// ユーティリティ関数

/**
 * HTMLエレメントのフェードイン
 * @param {HTMLElement} element - フェードインさせるエレメント
 * @param {number} duration - アニメーション時間（ミリ秒）
 */
function fadeIn(element, duration = 300) {
  if (!element) return; // 要素がない場合は処理しない
  
  element.style.opacity = 0;
  element.style.display = 'block';
  
  let start = null;
  function animate(timestamp) {
    if (!start) start = timestamp;
    const progress = timestamp - start;
    const opacity = Math.min(progress / duration, 1);
    element.style.opacity = opacity;
    
    if (progress < duration) {
      window.requestAnimationFrame(animate);
    }
  }
  
  window.requestAnimationFrame(animate);
}

/**
 * HTMLエレメントのフェードアウト
 * @param {HTMLElement} element - フェードアウトさせるエレメント
 * @param {number} duration - アニメーション時間（ミリ秒）
 * @param {Function} callback - アニメーション完了後のコールバック
 */
function fadeOut(element, duration = 300, callback) {
  if (!element) return; // 要素がない場合は処理しない
  
  let start = null;
  function animate(timestamp) {
    if (!start) start = timestamp;
    const progress = timestamp - start;
    const opacity = Math.max(1 - progress / duration, 0);
    element.style.opacity = opacity;
    
    if (progress < duration) {
      window.requestAnimationFrame(animate);
    } else {
      element.style.display = 'none';
      if (callback) callback();
    }
  }
  
  window.requestAnimationFrame(animate);
}

/**
 * 世界座標から画面座標への変換
 * @param {THREE.Vector3} position - 世界座標
 * @param {THREE.Camera} camera - カメラ
 * @param {number} width - 画面幅
 * @param {number} height - 画面高さ
 * @returns {Object} 画面のX, Y座標と可視性
 */
function worldToScreen(position, camera, width, height) {
  const vector = position.clone();
  vector.project(camera);
  
  const x = (vector.x + 1) / 2 * width;
  const y = -(vector.y - 1) / 2 * height;
  
  return { x, y, visible: vector.z < 1 };
}

/**
 * 角度を0〜2πの範囲に正規化
 * @param {number} angle - 角度（ラジアン）
 * @returns {number} 正規化された角度
 */
function normalizeAngle(angle) {
  return angle - Math.floor(angle / (Math.PI * 2)) * (Math.PI * 2);
}

/**
 * 角度の差分を計算（最短方向）
 * @param {number} a - 角度A（ラジアン）
 * @param {number} b - 角度B（ラジアン）
 * @returns {number} 角度の差分
 */
function angleDifference(a, b) {
  const diff = normalizeAngle(b - a);
  return diff > Math.PI ? diff - Math.PI * 2 : diff;
}

/**
 * テクスチャのロードを非同期で行う
 * @param {string} path - テクスチャのパス
 * @param {THREE.TextureLoader} loader - テクスチャローダー
 * @returns {Promise} テクスチャをロードするPromise
 */
function loadTextureAsync(path, loader) {
  return new Promise((resolve, reject) => {
    loader.load(
      path,
      texture => {
        texture.encoding = THREE.sRGBEncoding;
        resolve(texture);
      },
      undefined,
      error => {
        console.error('テクスチャのロードに失敗:', path, error);
        reject(error);
      }
    );
  });
}

/**
 * テキストをHTMLエレメントに徐々に表示（タイプライター効果）
 * @param {HTMLElement} element - テキストを表示するエレメント
 * @param {string} text - 表示するテキスト
 * @param {number} speed - 1文字の表示速度（ミリ秒）
 */
function typeText(element, text, speed = 30) {
  if (!element || !text) return; // 要素かテキストがない場合は処理しない
  
  // 長すぎるテキストの場合は直接表示する
  if (text.length > 200) {
    element.textContent = text;
    return;
  }
  
  // 通常のタイプライター効果
  let i = 0;
  element.textContent = '';
  
  function typeChar() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(typeChar, speed);
    }
  }
  
  typeChar();
}