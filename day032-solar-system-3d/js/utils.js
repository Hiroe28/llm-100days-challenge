// ユーティリティ関数

/**
 * 楕円軌道上の位置を計算する
 * @param {number} a - 楕円の長半径
 * @param {number} e - 離心率
 * @param {number} theta - 角度（ラジアン）
 * @returns {Object} x, z座標
 */
function calculateEllipticalPosition(a, e, theta) {
  // 楕円の短半径を計算
  const b = a * Math.sqrt(1 - e * e);
  
  // 楕円軌道上の位置を計算
  const x = a * Math.cos(theta);
  const z = b * Math.sin(theta);
  
  return { x, z };
}

/**
 * ケプラーの第三法則に基づいた公転速度を計算する
 * @param {number} a - 半長軸（AU）
 * @param {number} baseSpeed - 基準速度
 * @returns {number} 公転速度
 */
function calculateOrbitalSpeed(a, baseSpeed) {
  // 公転速度は軌道半径の3/2乗に反比例
  return baseSpeed / Math.sqrt(Math.pow(a, 3));
}

/**
 * 度数法からラジアンに変換
 * @param {number} degrees - 度数
 * @returns {number} ラジアン
 */
function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

/**
 * 軌道上の特定の位置を計算する（軌道要素を考慮）
 * @param {Object} orbitParams - 軌道パラメータ
 * @param {number} a - 長半径
 * @param {number} theta - 角度（ラジアン）
 * @returns {Object} x, y, z座標
 */
function calculateOrbitPosition(orbitParams, a, theta) {
  // 楕円軌道上の位置を計算
  const { x, z } = calculateEllipticalPosition(a, orbitParams.eccentricity, theta);
  
  // 軌道傾斜を考慮した位置計算
  const inclination = degToRad(orbitParams.inclination);
  const node = degToRad(orbitParams.longitudeOfAscendingNode);
  const periapsis = degToRad(orbitParams.argumentOfPeriapsis);
  
  // 座標変換（傾斜と回転を適用）
  // 以下は簡略化された計算です。完全なケプラー要素変換はさらに複雑です。
  const xRotated = x * Math.cos(node) - z * Math.sin(node) * Math.cos(inclination);
  const yRotated = z * Math.sin(inclination);
  const zRotated = x * Math.sin(node) + z * Math.cos(node) * Math.cos(inclination);
  
  return { x: xRotated, y: yRotated, z: zRotated };
}

/**
 * HTMLエレメントのスタイルでフェードイン
 * @param {HTMLElement} element - フェードインさせるエレメント
 * @param {number} duration - アニメーション時間（ミリ秒）
 */
function fadeIn(element, duration = 300) {
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
 * HTMLエレメントのスタイルでフェードアウト
 * @param {HTMLElement} element - フェードアウトさせるエレメント
 * @param {number} duration - アニメーション時間（ミリ秒）
 * @param {Function} callback - アニメーション完了後のコールバック
 */
function fadeOut(element, duration = 300, callback) {
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
 * スケーリングファクターを適用した惑星サイズを取得
 * @param {number} baseSize - 基本サイズ（地球=1）
 * @param {boolean} isRealistic - 現実的なスケールかどうか
 * @param {number} scaleFactor - スケール係数
 * @returns {number} スケールされたサイズ
 */
function getScaledPlanetSize(baseSize, isRealistic, scaleFactor) {
  if (isRealistic) {
    // 現実的なスケールの場合は正確な比率を維持
    return baseSize * CONSTANTS.SIZE_SCALE * scaleFactor;
  } else {
    // 教育的なモードでは小さすぎる惑星も見えるようにする
    return Math.max(baseSize * CONSTANTS.SIZE_SCALE * scaleFactor, CONSTANTS.AESTHETIC_MIN_PLANET_SIZE);
  }
}

/**
 * スケーリングファクターを適用した距離を取得
 * @param {number} baseDistance - 基本距離（AU単位）
 * @param {boolean} isRealistic - 現実的なスケールかどうか
 * @param {number} scaleFactor - スケール係数
 * @returns {number} スケールされた距離
 */
function getScaledDistance(baseDistance, isRealistic, scaleFactor) {
  if (isRealistic) {
    // 現実的なスケールの場合は正確な比率を維持
    return baseDistance * CONSTANTS.DISTANCE_SCALE * scaleFactor;
  } else {
    // 教育的なモードでは惑星間の距離を調整
    const logScale = Math.log(baseDistance + 1) * CONSTANTS.DISTANCE_SCALE * scaleFactor;
    return Math.max(logScale, CONSTANTS.AESTHETIC_MIN_DISTANCE);
  }
}

/**
 * 世界座標から画面座標への変換
 * @param {THREE.Vector3} position - 世界座標
 * @param {THREE.Camera} camera - カメラ
 * @param {number} width - 画面幅
 * @param {number} height - 画面高さ
 * @returns {Object} 画面のX, Y座標
 */
function worldToScreen(position, camera, width, height) {
  const vector = position.clone();
  vector.project(camera);
  
  const x = (vector.x + 1) / 2 * width;
  const y = -(vector.y - 1) / 2 * height;
  
  return { x, y, visible: vector.z < 1 };
}