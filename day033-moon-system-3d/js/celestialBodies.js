// 天体のデータ定義
const CELESTIAL_BODIES = {
  // 太陽のデータ
  SUN: {
    id: 'sun',
    name: 'Sun',
    jpName: '太陽',
    size: CONFIG.SUN_SIZE,
    position: { x: 0, y: 0, z: 0 },
    texturePath: CONFIG.TEXTURE_PATH + 'sun.jpg',
    color: CONFIG.COLORS.SUN,
    emissive: true,
    description: '太陽系の中心にある恒星。自ら光を発する。'
  },
  
  // 地球のデータ
  EARTH: {
    id: 'earth',
    name: 'Earth',
    jpName: '地球',
    size: CONFIG.EARTH_SIZE,
    distance: CONFIG.EARTH_DISTANCE,
    orbitSpeed: CONFIG.EARTH_ORBIT_SPEED,
    rotationSpeed: CONFIG.EARTH_ROTATION_SPEED,
    texturePath: CONFIG.TEXTURE_PATH + 'earth.jpg',
    bumpMapPath: CONFIG.TEXTURE_PATH + 'earth_bump.jpg',
    color: CONFIG.COLORS.EARTH,
    emissive: false,
    description: '太陽系第3惑星。表面の約70%が水で覆われている。'
  },
  
  // 月のデータ
  MOON: {
    id: 'moon',
    name: 'Moon',
    jpName: '月',
    size: CONFIG.MOON_SIZE,
    distance: CONFIG.MOON_DISTANCE,
    orbitSpeed: CONFIG.MOON_ORBIT_SPEED,
    rotationSpeed: CONFIG.MOON_ROTATION_SPEED,
    texturePath: CONFIG.TEXTURE_PATH + 'moon.jpg',
    bumpMapPath: CONFIG.TEXTURE_PATH + 'moon_bump.jpg',
    color: CONFIG.COLORS.MOON,
    emissive: false,
    description: '地球の唯一の自然衛星。地球の周りを約27.3日で公転する。'
  }
};

// 月相の詳細データ
const MOON_PHASE_DATA = [
  {
    id: 'new-moon',
    name: '新月',
    angle: CONFIG.MOON_PHASES.NEW_MOON,
    illumination: 0,
    description: '月が太陽と同じ方向にあり、太陽の光が月の裏側に当たっているため、地球からは月は見えません。',
    detailedExplanation: '新月は太陽と月が地球から見て同じ方向にある状態です。このとき、太陽の光は月の裏側に当たるため、地球からは月を見ることができません。この後、月は東の方向に移動していきます。'
  },
  {
    id: 'waxing-crescent',
    name: '三日月',
    angle: CONFIG.MOON_PHASES.WAXING_CRESCENT,
    illumination: 0.25,
    description: '月が太陽より少し東に移動し、右側（西側）が細く光って見えます。日没後の西の空に見えます。',
    detailedExplanation: '新月から数日経つと、月は太陽より東に移動し、太陽の光が月の右側に当たるようになります。このため、地球からは月の右側が細く光って見えます。この形を三日月と呼びます。'
  },
  {
    id: 'first-quarter',
    name: '上弦の月',
    angle: CONFIG.MOON_PHASES.FIRST_QUARTER,
    illumination: 0.5,
    description: '月が太陽から90度東に移動し、右半分（西半分）が光って見えます。日没時に南の空に見えます。',
    detailedExplanation: '上弦の月は、月が太陽から見て90度東に位置するときに見られます。このとき地球から見ると、月の右半分（西半分）が光って見えます。上弦の月は昼頃に東の空から昇り、日没頃に南の空に見え、夜半に西の空に沈みます。'
  },
  {
    id: 'waxing-gibbous',
    name: '十三夜月',
    angle: CONFIG.MOON_PHASES.WAXING_GIBBOUS,
    illumination: 0.75,
    description: '月の大部分が光って見えますが、左側（東側）がまだ完全に光っていません。日没後に東の空から昇ります。',
    detailedExplanation: '十三夜月（膨らみかけの月）は、上弦の月と満月の間の月相です。月の大部分が光って見え、満月に近づくにつれてさらに丸くなっていきます。夕方に東の空から昇り、一晩中見ることができます。'
  },
  {
    id: 'full-moon',
    name: '満月',
    angle: CONFIG.MOON_PHASES.FULL_MOON,
    illumination: 1.0,
    description: '月が太陽の反対側にあるとき、太陽の光が月の表面全体を照らします。日没時に東から昇り、一晩中見えます。',
    detailedExplanation: '満月は、地球から見て月が太陽の正反対にあるときに起こります。このとき太陽の光が月の表面全体を照らすため、完全な円として見えます。満月は日没頃に東の空から昇り、夜中に南の空を通過し、日の出頃に西の空に沈みます。'
  },
  {
    id: 'waning-gibbous',
    name: '十六夜月',
    angle: CONFIG.MOON_PHASES.WANING_GIBBOUS,
    illumination: 0.75,
    description: '月の大部分が光って見えますが、右側（西側）が欠け始めています。真夜中頃に東から昇ります。',
    detailedExplanation: '十六夜月（欠けかけの月）は、満月から数日経った月相です。月の光る部分は右側（西側）から徐々に欠けていきます。深夜に東の空から昇り、日中も空にあります。満月からおよそ3〜4日後に見られます。'
  },
  {
    id: 'last-quarter',
    name: '下弦の月',
    angle: CONFIG.MOON_PHASES.LAST_QUARTER,
    illumination: 0.5,
    description: '月が太陽から90度西に移動し、左半分（東半分）が光って見えます。真夜中に東から昇り、朝に南の空に見えます。',
    detailedExplanation: '下弦の月は、月が太陽から見て90度西に位置するときに見られます。このとき地球から見ると、月の左半分（東半分）が光って見えます。下弦の月は真夜中頃に東の空から昇り、朝に南の空に見え、昼頃に西の空に沈みます。'
  },
  {
    id: 'waning-crescent',
    name: '二十六夜月',
    angle: CONFIG.MOON_PHASES.WANING_CRESCENT,
    illumination: 0.25,
    description: '月が太陽に近づき、左側（東側）が細く光って見えます。明け方の東の空に見えます。',
    detailedExplanation: '二十六夜月（欠けた三日月）は、下弦の月と新月の間の月相です。月の左側（東側）だけが細く光って見えます。明け方に東の空で見ることができ、徐々に新月に近づいていきます。'
  }
];