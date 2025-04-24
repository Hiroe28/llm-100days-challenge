// 月相データ
const moonPhases = [
    {
      name: '新月',
      angle: 0,
      description: '月が太陽と同じ方向にあり、太陽の光が月の裏側に当たっているため、地球からは月は見えません。'
    },
    {
      name: '三日月',
      angle: 45,
      description: '月が太陽より少し東に移動し、右側（西側）が細く光って見えます。日没後の西の空に見えます。'
    },
    {
      name: '上弦の月',
      angle: 90,
      description: '月が太陽から90度東に移動し、右半分（西半分）が光って見えます。日没時に南の空に見えます。'
    },
    {
      name: '十三夜月',
      angle: 135,
      description: '月の大部分が光って見えますが、左側（東側）がまだ完全に光っていません。日没後に東の空から昇ります。'
    },
    {
      name: '満月',
      angle: 180,
      description: '月が太陽の反対側にあるとき、太陽の光が月の表面全体を照らします。日没時に東から昇り、一晩中見えます。'
    },
    {
      name: '十六夜月',
      angle: 225,
      description: '月の大部分が光って見えますが、右側（西側）が欠け始めています。真夜中頃に東から昇ります。'
    },
    {
      name: '下弦の月',
      angle: 270,
      description: '月が太陽から90度西に移動し、左半分（東半分）が光って見えます。真夜中に東から昇り、朝に南の空に見えます。'
    },
    {
      name: '二十六夜月',
      angle: 315,
      description: '月が太陽に近づき、左側（東側）が細く光って見えます。明け方の東の空に見えます。'
    }
  ];
  
  // 月齢を計算する関数
  function calculateMoonAge() {
    // 基準日からの経過日数を計算
    // 2000年1月6日は新月だった
    const baseDate = new Date(2000, 0, 6);
    const today = new Date();
    
    // 日数の差を計算
    const diffTime = Math.abs(today - baseDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // 月の周期は約29.53日
    const moonCycle = 29.53;
    
    // 月齢（0〜29.53の値）
    const moonAge = diffDays % moonCycle;
    
    return moonAge;
  }
  
  // 月齢から角度に変換する関数
  function moonAgeToAngle(moonAge) {
    // 月齢0が新月（0度）、月齢14.765が満月（180度）になるように変換
    // 月の周期は約29.53日なので、1日あたり約12.2度
    return (moonAge / 29.53) * 360;
  }
  
  // 今日の月の位置を設定する関数
  function setTodayMoonPosition() {
    const moonAge = calculateMoonAge();
    const angleForToday = moonAgeToAngle(moonAge);
    
    // 角度を設定
    setMoonPhase(angleForToday);
    
    // 今日の月相情報を表示
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const todayStr = today.toLocaleDateString('ja-JP', options);
    
    // フェーズ名の横に日付を追加
    const phaseName = document.getElementById('phase-name');
    const closestPhase = getClosestPhase(angleForToday);
    phaseName.textContent = `${closestPhase.name}（${todayStr}）`;
    
    // 月齢も表示に追加
    const phaseDescription = document.getElementById('phase-description');
    phaseDescription.textContent = `月齢: ${moonAge.toFixed(1)}日\n${closestPhase.description}`;
  }
  
  // 月相を更新
  function updatePhaseInfo(angle) {
    // 現在の角度に最も近い月相を探す
    const closestPhase = getClosestPhase(angle);
    
    // 月相情報を表示
    document.getElementById('phase-name').textContent = closestPhase.name;
    document.getElementById('phase-description').textContent = closestPhase.description;
    
    // 月相ボタンのアクティブ状態を更新
    document.querySelectorAll('.phase-button').forEach(button => {
      const buttonAngle = parseInt(button.dataset.angle);
      if (buttonAngle === closestPhase.angle) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
  }
  
  // 最も近い月相を取得
  function getClosestPhase(angle) {
    let closestPhase = moonPhases[0];
    let minDifference = Math.abs(angle - closestPhase.angle);
    
    moonPhases.forEach(phase => {
      const diff = Math.min(
        Math.abs(angle - phase.angle),
        Math.abs(angle - (phase.angle + 360)),
        Math.abs((angle + 360) - phase.angle)
      );
      
      if (diff < minDifference) {
        minDifference = diff;
        closestPhase = phase;
      }
    });
    
    return closestPhase;
  }