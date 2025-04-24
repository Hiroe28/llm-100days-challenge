// テクスチャローダーの準備
const textureLoader = new THREE.TextureLoader();

// 天体の作成
function createCelestialBodies(scene, earthPivot, moonPivot) {
  // オブジェクトを保持するために使用
  const objects = {
    sun: null,
    earth: null,
    moon: null,
    earthOrbit: null,
    moonOrbit: null
  };
  
  // テクスチャの読み込み
  const textures = {
    sun: { 
      map: 'sun.jpg',
      bump: 'sun_bump.jpg'
    },
    earth: {
      map: 'earth.jpg',
      bump: 'earth_bump.jpg'
    },
    moon: {
      map: 'moon.jpg',
      bump: 'moon_bump.jpg'
    }
  };
  
  // プレースホルダーテクスチャの作成
  function createPlaceholderTexture(color) {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 2, 2);
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
  
  // 太陽のテクスチャ
  const sunTexture = createPlaceholderTexture('#ffdd00');
  const sunBumpMap = createPlaceholderTexture('#ffffff');
  
  // 地球のテクスチャ
  const earthTexture = createPlaceholderTexture('#0066ff');
  const earthBumpMap = createPlaceholderTexture('#ffffff');
  
  // 月のテクスチャ
  const moonTexture = createPlaceholderTexture('#cccccc');
  const moonBumpMap = createPlaceholderTexture('#ffffff');
  
  // 太陽
  const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({ 
    map: sunTexture,
    emissive: 0xffdd00,
    emissiveIntensity: 0.5,
    emissiveMap: sunTexture
  });
  objects.sun = new THREE.Mesh(sunGeometry, sunMaterial);
  scene.add(objects.sun);
  
  // 実際のテクスチャをロード（エラーハンドリング付き）
  textureLoader.load(
    textures.sun.map,
    function(texture) {
      sunMaterial.map = texture;
      sunMaterial.emissiveMap = texture;
      sunMaterial.needsUpdate = true;
    },
    undefined,
    function(err) {
      console.error('太陽テクスチャの読み込みに失敗しました:', err);
    }
  );
  
  // 地球
  const earthGeometry = new THREE.SphereGeometry(1, 32, 32);
  const earthMaterial = new THREE.MeshPhongMaterial({ 
    map: earthTexture,
    bumpMap: earthBumpMap,
    bumpScale: 0.05,
    emissive: 0x112244,
    emissiveIntensity: 0.1,
    shininess: 15
  });
  objects.earth = new THREE.Mesh(earthGeometry, earthMaterial);
  const earthOrbitRadius = 20;
  objects.earth.position.set(earthOrbitRadius, 0, 0);
  earthPivot.add(objects.earth);
  
  // 地球のテクスチャをロード
  textureLoader.load(
    textures.earth.map,
    function(texture) {
      earthMaterial.map = texture;
      earthMaterial.needsUpdate = true;
    },
    undefined,
    function(err) {
      console.error('地球テクスチャの読み込みに失敗しました:', err);
    }
  );
  
  textureLoader.load(
    textures.earth.bump,
    function(texture) {
      earthMaterial.bumpMap = texture;
      earthMaterial.needsUpdate = true;
    },
    undefined,
    function(err) {
      console.error('地球バンプマップの読み込みに失敗しました:', err);
    }
  );
  
  // 地球の雲
  const cloudsGeometry = new THREE.SphereGeometry(1.02, 32, 32);
  const cloudsMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.3
  });
  const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
  objects.earth.add(clouds);
  
  // 月
  const moonGeometry = new THREE.SphereGeometry(0.27, 32, 32);
  const moonMaterial = new THREE.MeshPhongMaterial({ 
    map: moonTexture,
    bumpMap: moonBumpMap,
    bumpScale: 0.002,
    emissive: 0x222222,
    emissiveIntensity: 0.1,
    shininess: 2
  });
  objects.moon = new THREE.Mesh(moonGeometry, moonMaterial);
  objects.moon.position.set(-5, 0, 0);
  moonPivot.add(objects.moon);
  
  // 月のテクスチャをロード
  textureLoader.load(
    textures.moon.map,
    function(texture) {
      moonMaterial.map = texture;
      moonMaterial.needsUpdate = true;
    },
    undefined,
    function(err) {
      console.error('月テクスチャの読み込みに失敗しました:', err);
    }
  );
  
  textureLoader.load(
    textures.moon.bump,
    function(texture) {
      moonMaterial.bumpMap = texture;
      moonMaterial.needsUpdate = true;
    },
    undefined,
    function(err) {
      console.error('月バンプマップの読み込みに失敗しました:', err);
    }
  );
  
  // 軌道の作成
  createOrbits(scene, moonPivot, objects);
  
  return objects;
}

// 軌道の作成
// 軌道の作成
function createOrbits(scene, moonPivot, objects) {
  // 地球の軌道
  const earthOrbitGeometry = new THREE.RingGeometry(19.9, 20.1, 64);
  const earthOrbitMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x666666,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.3
  });
  objects.earthOrbit = new THREE.Mesh(earthOrbitGeometry, earthOrbitMaterial);
  objects.earthOrbit.rotation.x = Math.PI / 2;
  // 地球の軌道を少し上げる
  objects.earthOrbit.position.y = 0.05;
  scene.add(objects.earthOrbit);
  
  // 月の軌道
  const moonOrbitGeometry = new THREE.RingGeometry(4.9, 5.1, 64);
  const moonOrbitMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x666666, 
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.3
  });
  objects.moonOrbit = new THREE.Mesh(moonOrbitGeometry, moonOrbitMaterial);
  objects.moonOrbit.rotation.x = Math.PI / 2;
  // 月の軌道を少し下げる（またはそのままでも）
  moonPivot.add(objects.moonOrbit);
}

// 星空の背景を作成
function createStarBackground(scene) {
  const starsGeometry = new THREE.BufferGeometry();
  const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.1,
    transparent: true
  });
  
  const starsVertices = [];
  for (let i = 0; i < 5000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    starsVertices.push(x, y, z);
  }
  
  starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
  const starField = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(starField);
}