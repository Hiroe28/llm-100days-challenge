// 月の満ち欠け計算

// 現在の月相角度
let currentPhaseAngle = CONFIG.MOON_PHASES.FULL_MOON;

// 月相の強制設定
function setMoonPhase(phaseId) {
  // 該当するフェーズデータを検索
  const phaseData = MOON_PHASE_DATA.find(phase => phase.id === phaseId);
  
  if (phaseData) {
    // 月相角度を設定
    currentPhaseAngle = phaseData.angle;
    
    // 月の公転角度を更新
    moon.userData.orbitAngle = currentPhaseAngle;
    moon.userData.parent.rotation.y = currentPhaseAngle;
    
    // UIを更新
    updatePhaseUI(phaseData);
    
    // フェーズのボタンのアクティブ状態を更新
    updatePhaseButtons(phaseId);
  }
}

// 現在の月相を計算
function calculateCurrentPhase() {
  // 月の公転角度から月相を計算
  const angle = normalizeAngle(moon.userData.orbitAngle);
  
  // 最も近い月相データを検索
  let closestPhase = MOON_PHASE_DATA[0];
  let minDifference = Math.abs(angleDifference(angle, closestPhase.angle));
  
  MOON_PHASE_DATA.forEach(phase => {
    const difference = Math.abs(angleDifference(angle, phase.angle));
    if (difference < minDifference) {
      minDifference = difference;
      closestPhase = phase;
    }
  });
  
  return closestPhase;
}

// 月の満ち欠けのUIを更新
function updatePhaseUI(phaseData) {
  // 月相名を更新
  document.getElementById('phase-name').textContent = phaseData.name;
  
  // 月相の説明を更新
  document.getElementById('phase-description').textContent = phaseData.description;
  
  // 詳細説明を更新（タイプライター効果で）
  typeText(document.getElementById('detailed-explanation'), phaseData.detailedExplanation, 20);
  
  // 月相イメージを更新
  updatePhaseImage(phaseData.illumination);
}

// 月相イメージの更新
function updatePhaseImage(illumination) {
  const phaseImage = document.getElementById('phase-image');
  
  // 満ち欠けに合わせたCSS背景グラデーションを設定
  if (illumination === 0) {
    // 新月
    phaseImage.style.backgroundImage = 'radial-gradient(circle, #111 50%, #111 50%)';
  } else if (illumination === 1) {
    // 満月
    phaseImage.style.backgroundImage = 'radial-gradient(circle, #eee 50%, #eee 50%)';
  } else if (illumination < 0.5) {
    // 三日月または下弦後の月
    const direction = currentPhaseAngle < Math.PI ? 'right' : 'left';
    const percent = illumination * 200;
    if (direction === 'right') {
      phaseImage.style.backgroundImage = `linear-gradient(to right, #111 ${100-percent}%, #eee ${100-percent}%)`;
    } else {
      phaseImage.style.backgroundImage = `linear-gradient(to left, #111 ${100-percent}%, #eee ${100-percent}%)`;
    }
  } else {
    // 上弦または下弦の月
    const direction = currentPhaseAngle < Math.PI ? 'left' : 'right';
    const percent = (illumination - 0.5) * 200;
    if (direction === 'left') {
      phaseImage.style.backgroundImage = `linear-gradient(to left, #eee ${percent}%, #111 ${percent}%)`;
    } else {
      phaseImage.style.backgroundImage = `linear-gradient(to right, #eee ${percent}%, #111 ${percent}%)`;
    }
  }
}

// 月相ボタンのアクティブ状態を更新
function updatePhaseButtons(activePhaseId) {
  const buttons = document.querySelectorAll('.phase-button');
  
  buttons.forEach(button => {
    if (button.dataset.phase === activePhaseId) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
}

// 自動的に月相UIを更新（アニメーション中）
function autoUpdatePhaseUI() {
  const currentPhase = calculateCurrentPhase();
  updatePhaseUI(currentPhase);
  updatePhaseButtons(currentPhase.id);
}