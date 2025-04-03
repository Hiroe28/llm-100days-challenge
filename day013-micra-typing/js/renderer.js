/**
 * 3D描画処理(Three.js)を管理するモジュール
 */
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { GAME_CONFIG } from './config.js';

// Three.js関連の変数
let scene, camera, renderer;
let enemyModels = {}; // 敵モデルを保持するオブジェクト

/**
 * Three.jsの初期化
 */
export function setupRenderer() {
  // シーンの作成
  scene = new THREE.Scene();
  scene.background = null; // 透明な背景（HTMLの背景画像を使用）
  
  // 地面は作成しない - 背景画像だけ使用
  
  // カメラの作成
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 10, 15); // 高い位置から見下ろす形に
  camera.lookAt(0, 0, -20); // 奥を見るように
  
  // 光源の追加
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
  
  // 補助光源（裏側を照らす）
  const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
  backLight.position.set(-5, 5, -10);
  scene.add(backLight);
  
  // レンダラーの作成
  renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true // 透明な背景を許可
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  
  // レンダラーのスタイル設定
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.top = '0';
  renderer.domElement.style.left = '0';
  renderer.domElement.style.zIndex = '1'; // 他のUI要素より下に配置
  
  // DOMに追加
  const gameContainer = document.getElementById('game-container');
  if (gameContainer) {
    gameContainer.appendChild(renderer.domElement);
  }
  
  // モデルをロード
  loadModels();
  
  // リサイズイベントリスナーを設定
  window.addEventListener('resize', onWindowResize);
  
  console.log("Three.jsレンダラーを初期化しました");
}

/**
 * ウィンドウリサイズ時の処理
 */
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * モデルの読み込み
 */
function loadModels() {
  console.log("立方体モデルを作成します");
  
  // 黒い人モデルの作成
  createEndermanModel();
  
  // 緑のモンスターの作成
  createCreeperModel();
}

/**
 * エンダーマンモデル（立方体）の作成
 */
function createEndermanModel() {
  // 体
  const bodyGeometry = new THREE.BoxGeometry(1, 3, 1);
  const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 }); // 光沢のある黒
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  
  // 腕と足
  const limbGeometry = new THREE.BoxGeometry(0.4, 1.5, 0.4);
  const limbMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });
  
  // 左腕
  const leftArm = new THREE.Mesh(limbGeometry, limbMaterial);
  leftArm.position.set(-0.7, 0, 0);
  
  // 右腕
  const rightArm = new THREE.Mesh(limbGeometry, limbMaterial);
  rightArm.position.set(0.7, 0, 0);
  
  // 左脚
  const leftLeg = new THREE.Mesh(limbGeometry, limbMaterial);
  leftLeg.position.set(-0.3, -2.2, 0);
  
  // 右脚
  const rightLeg = new THREE.Mesh(limbGeometry, limbMaterial);
  rightLeg.position.set(0.3, -2.2, 0);
  
  // モデルをグループ化
  const endermanModel = new THREE.Group();
  endermanModel.add(body);
  endermanModel.add(leftArm);
  endermanModel.add(rightArm);
  endermanModel.add(leftLeg);
  endermanModel.add(rightLeg);
  
  // 目（パープルの小さい立方体）
  const eyeGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.1);
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff }); // 明るいパープル
  
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.3, 1, 0.5);
  
  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(0.3, 1, 0.5);
  
  endermanModel.add(leftEye);
  endermanModel.add(rightEye);
  
  // Y軸を中心に回転（正面を向くように）
  endermanModel.rotation.y = Math.PI; // 180度回転
  
  // 位置調整
  endermanModel.position.set(0, -100, 0); // 完全に画面外に配置
  
  // サイズ調整
  endermanModel.scale.set(1.3, 1.3, 1.3);
  
  // 重要: オリジナルモデルは非表示にする
  endermanModel.visible = false;
  
  // シーンに追加
  scene.add(endermanModel);
  console.log('黒い人モデルを作成しました（非表示状態）');
  
  // モデルを保存
  enemyModels.enderman = endermanModel;
}

/**
 * 緑のモンスターモデル（立方体）の作成
 */
function createCreeperModel() {
  // 体
  const bodyGeometry = new THREE.BoxGeometry(1, 2, 1);
  const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x33AA33 }); // 緑色
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  
  // 足
  const legGeometry = new THREE.BoxGeometry(0.4, 0.6, 0.4);
  const legMaterial = new THREE.MeshPhongMaterial({ color: 0x33AA33 });
  
  // 左前足
  const leftFrontLeg = new THREE.Mesh(legGeometry, legMaterial);
  leftFrontLeg.position.set(-0.3, -1.3, 0.3);
  
  // 右前足
  const rightFrontLeg = new THREE.Mesh(legGeometry, legMaterial);
  rightFrontLeg.position.set(0.3, -1.3, 0.3);
  
  // 左後ろ足
  const leftBackLeg = new THREE.Mesh(legGeometry, legMaterial);
  leftBackLeg.position.set(-0.3, -1.3, -0.3);
  
  // 右後ろ足
  const rightBackLeg = new THREE.Mesh(legGeometry, legMaterial);
  rightBackLeg.position.set(0.3, -1.3, -0.3);
  
  // モデルをグループ化
  const creeperModel = new THREE.Group();
  creeperModel.add(body);
  creeperModel.add(leftFrontLeg);
  creeperModel.add(rightFrontLeg);
  creeperModel.add(leftBackLeg);
  creeperModel.add(rightBackLeg);
  
  // 顔（黒い目と口）
  const eyeGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.1);
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 }); // 黒
  
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.3, 0.4, 0.51);
  
  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(0.3, 0.4, 0.51);
  
  const mouthGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.1);
  const mouthMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  
  const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
  mouth.position.set(0, 0, 0.51);
  
  creeperModel.add(leftEye);
  creeperModel.add(rightEye);
  creeperModel.add(mouth);
  
  // Y軸を中心に回転（正面を向くように）
  creeperModel.rotation.y = Math.PI; // 180度回転
  
  // 位置調整
  creeperModel.position.set(0, -100, 0); // 完全に画面外に配置
  
  // サイズ調整
  creeperModel.scale.set(1.3, 1.3, 1.3);
  
  // 重要: オリジナルモデルは非表示にする
  creeperModel.visible = false;
  
  // シーンに追加
  scene.add(creeperModel);
  console.log('緑のモンスターモデルを作成しました（非表示状態）');
  
  // モデルを保存
  enemyModels.creeper = creeperModel;
}

/**
 * オリジナルモデルを非表示
 */
export function hideOriginalModels() {
  for (const key in enemyModels) {
    if (enemyModels[key]) {
      enemyModels[key].visible = false;
      enemyModels[key].position.set(0, -100, 0);
    }
  }
}

/**
 * 敵キャラクターを生成
 * @returns {THREE.Object3D} 生成された敵のメッシュ
 */
export function createEnemyMesh() {
  // ランダムなモデルを選択
  const modelType = Math.random() < 0.5 ? 'enderman' : 'creeper';
  const modelToClone = enemyModels[modelType];
  
  if (!modelToClone) {
    console.error("モデルが見つかりません");
    return null;
  }
  
  // モデルのクローンを作成
  const enemy = modelToClone.clone();
  enemy.visible = true;
  
  // ランダムなX位置（-5から5の範囲）
  const posX = Math.random() * 10 - 5;
  
  // Y位置を調整（地面のグラデーション位置に合わせて調整）
  // より低く配置して足が地面につくように
  const yPosition = modelType === 'enderman' ? 0.7 : 0.3;
  
  // 位置を設定
  enemy.position.set(posX, yPosition, GAME_CONFIG.startZ);
  
  // モデルが横向きの場合、正面を向かせる
  enemy.rotation.y = Math.PI; // 180度回転
  
  // サイズ調整
  enemy.scale.set(1.3, 1.3, 1.3);
  
  // シーンに追加
  scene.add(enemy);
  
  // モデルの種類も返す
  return { mesh: enemy, type: modelType };
}

/**
 * 敵キャラクターを位置に直接配置（アニメーションなし）
 * @param {THREE.Object3D} enemy 敵のメッシュ
 * @param {number} targetX X座標
 * @param {number} targetY Y座標
 * @param {number} targetZ Z座標
 */
function fadeInEnemy(enemy, targetX, targetY, targetZ) {
  // 直接位置を設定
  enemy.position.set(targetX, targetY, targetZ);
}

/**
 * 3D位置から画面位置への変換
 * @param {THREE.Object3D} object 3Dオブジェクト
 * @returns {Object} 画面上の座標 {x, y}
 */
export function getScreenPosition(object) {
  const vector = new THREE.Vector3();
  
  // オブジェクトのワールド位置を取得
  vector.setFromMatrixPosition(object.matrixWorld);
  
  // ワールド座標から正規化デバイス座標に変換
  vector.project(camera);
  
  // 正規化デバイス座標から画面座標に変換
  const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;
  
  return { x, y };
}

/**
 * シーンの更新と描画
 */
export function renderScene() {
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

/**
 * シーンからオブジェクトを削除
 * @param {THREE.Object3D} mesh 削除するメッシュ
 */
export function removeFromScene(mesh) {
  if (!mesh) return;
  
  // メッシュの子要素もすべて削除
  while (mesh.children.length > 0) {
    const child = mesh.children[0];
    mesh.remove(child);
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(material => material.dispose());
      } else {
        child.material.dispose();
      }
    }
  }
  
  // メッシュ自体を削除
  scene.remove(mesh);
  if (mesh.geometry) mesh.geometry.dispose();
  if (mesh.material) {
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(material => material.dispose());
    } else {
      mesh.material.dispose();
    }
  }
}