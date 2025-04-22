// 惑星データ
// 実際の天文学的データに基づく値を使用
const PLANET_DATA = [
  {
    id: 'mercury',
    name: "水星 (Mercury)",
    jpName: "水星",
    textures: {
      map: 'mercury.jpg',
      bumpMap: 'mercury_bump.jpg'
    },
    size: 0.38,  // 地球との比率
    distance: 0.39,  // 天文単位（地球と太陽の距離を1とする）
    year: "88日",
    day: "58.6日",
    diameter: "4,880 km (地球の約0.38倍)",
    mass: "3.3 × 10²³ kg (地球の約0.055倍)",
    gravity: "3.7 m/s² (地球の約0.38倍)",
    type: "岩石惑星",
    color: CONSTANTS.COLORS.MERCURY,
    rotationSpeed: 0.01,
    orbitSpeed: 4.15,  // 相対的な軌道速度
    orbitParams: {
      eccentricity: 0.206,  // 離心率（軌道の楕円度）
      inclination: 7.0,     // 軌道傾斜角（度）
      longitudeOfAscendingNode: 48.3, // 昇交点黄経（度）
      argumentOfPeriapsis: 29.1   // 近日点引数（度）
    },
    facts: "太陽系で最も小さい惑星で、表面には多くのクレーターがあります。昼と夜の温度差が非常に大きいです。",
    description: "水星は太陽に最も近い惑星であり、表面温度は日中に430℃、夜間に-180℃まで変化します。大気はほとんどなく、表面は月に似た多数のクレーターに覆われています。1日（太陽が同じ地点に戻るまでの時間）は約176地球日であり、公転周期は約88地球日です。つまり、水星では1日が2年に相当します。"
  },
  {
    id: 'venus',
    name: "金星 (Venus)",
    jpName: "金星",
    textures: {
      map: 'venus.jpg',
      bumpMap: 'venus_bump.jpg'
    },
    size: 0.95,
    distance: 0.72,
    year: "225日",
    day: "243日（地球の日より長い！）",
    diameter: "12,104 km (地球の約0.95倍)",
    mass: "4.87 × 10²⁴ kg (地球の約0.815倍)",
    gravity: "8.87 m/s² (地球の約0.9倍)",
    type: "岩石惑星",
    color: CONSTANTS.COLORS.VENUS,
    rotationSpeed: 0.005,
    orbitSpeed: 1.62,
    orbitParams: {
      eccentricity: 0.007,
      inclination: 3.4,
      longitudeOfAscendingNode: 76.7,
      argumentOfPeriapsis: 54.9
    },
    facts: "太陽系で最も熱い惑星で、濃い二酸化炭素の大気があります。地球とは逆方向に自転しています。",
    description: "金星は大きさと質量が地球に似ていることから「地球の双子」と呼ばれることがありますが、その環境は全く異なります。厚い二酸化炭素の大気により、表面温度は約462℃と鉛が溶ける温度に達しています。大気圧は地球の92倍で、硫酸の雲に覆われています。他の惑星とは異なり、東から西へと逆方向に自転しています。"
  },
  {
    id: 'earth',
    name: "地球 (Earth)",
    jpName: "地球",
    textures: {
      map: 'earth.jpg',
      bumpMap: 'earth_bump.jpg',
      specularMap: 'earth_specular.jpg',
      cloudsMap: 'earth_clouds.png'
    },
    size: 1,
    distance: 1,
    year: "365.25日",
    day: "24時間",
    diameter: "12,742 km",
    mass: "5.97 × 10²⁴ kg",
    gravity: "9.8 m/s²",
    type: "岩石惑星",
    color: CONSTANTS.COLORS.EARTH,
    rotationSpeed: 0.01,
    orbitSpeed: 1.0,
    orbitParams: {
      eccentricity: 0.017,
      inclination: 0.0,  // 基準面なので0度
      longitudeOfAscendingNode: 174.9,
      argumentOfPeriapsis: 288.1
    },
    moons: [
      {
        id: 'moon',
        name: "月 (Moon)",
        jpName: "月",
        textures: {
          map: 'moon.jpg',
          bumpMap: 'moon_bump.jpg'
        },
        size: 0.273,  // 地球に対する相対サイズ
        distance: 0.00257,  // 地球からの距離（AU）
        orbitSpeed: 0.05,
        color: CONSTANTS.COLORS.MOON
      }
    ],
    facts: "現在知られている中で、生命が存在する唯一の惑星です。表面の約70%が水で覆われています。",
    description: "地球は太陽から3番目の惑星で、液体の水が存在する唯一の天体として知られています。窒素と酸素を主成分とする大気があり、生命を維持しています。地球は45億年前に形成され、約38億年前から生命が存在しています。月との重力的相互作用により潮汐が生じ、生物の進化に影響を与えました。"
  },
  {
    id: 'mars',
    name: "火星 (Mars)",
    jpName: "火星",
    textures: {
      map: 'mars.jpg',
      bumpMap: 'mars_bump.jpg'
    },
    size: 0.53,
    distance: 1.52,
    year: "687日",
    day: "24.6時間",
    diameter: "6,779 km (地球の約0.53倍)",
    mass: "6.42 × 10²³ kg (地球の約0.107倍)",
    gravity: "3.71 m/s² (地球の約0.38倍)",
    type: "岩石惑星",
    color: CONSTANTS.COLORS.MARS,
    rotationSpeed: 0.009,
    orbitSpeed: 0.53,
    orbitParams: {
      eccentricity: 0.093,
      inclination: 1.9,
      longitudeOfAscendingNode: 49.6,
      argumentOfPeriapsis: 286.5
    },
    moons: [
      {
        id: 'phobos',
        name: "フォボス (Phobos)",
        jpName: "フォボス",
        size: 0.0017,  // 火星に対する相対サイズ
        distance: 0.00006,  // 火星からの距離（AU）
        orbitSpeed: 0.3,
        color: 0x888888
      },
      {
        id: 'deimos',
        name: "ダイモス (Deimos)",
        jpName: "ダイモス",
        size: 0.0009,  // 火星に対する相対サイズ
        distance: 0.00015,  // 火星からの距離（AU）
        orbitSpeed: 0.2,
        color: 0x777777
      }
    ],
    facts: "「赤い惑星」と呼ばれ、表面には砂と岩が多くあります。過去に水が流れた痕跡があります。",
    description: "火星は鉄分を含む砂と岩により赤っぽく見える惑星です。薄い大気を持ち、表面には高い山（オリンポス山は太陽系最大の火山）、深い渓谷、砂嵐があります。かつては湖や川があった痕跡が見つかっており、生命が存在した可能性も研究されています。季節変化があり、極冠の氷が拡大・縮小します。"
  },
  {
    id: 'jupiter',
    name: "木星 (Jupiter)",
    jpName: "木星",
    textures: {
      map: 'jupiter.jpg'
    },
    size: 11.2,
    distance: 5.2,
    year: "12年",
    day: "9.9時間",
    diameter: "139,820 km (地球の約11倍)",
    mass: "1.90 × 10²⁷ kg (地球の約318倍)",
    gravity: "24.8 m/s² (地球の約2.5倍)",
    type: "ガス惑星",
    color: CONSTANTS.COLORS.JUPITER,
    rotationSpeed: 0.04,
    orbitSpeed: 0.084,
    orbitParams: {
      eccentricity: 0.048,
      inclination: 1.3,
      longitudeOfAscendingNode: 100.5,
      argumentOfPeriapsis: 273.9
    },
    facts: "太陽系で最大の惑星で、大きな赤い斑点は何百年も続いている巨大な嵐です。",
    description: "木星は太陽系最大の惑星で、質量は他のすべての惑星の総和の2.5倍以上あります。主に水素とヘリウムからなるガス惑星で、固体の表面はありません。大気には複数の縞模様があり、有名な大赤斑は地球より大きい巨大な嵐で、少なくとも300年以上続いています。木星は少なくとも79個の衛星を持ち、そのうち4つの大きな「ガリレオ衛星」は独自の地質活動を持つ天体です。"
  },
  {
    id: 'saturn',
    name: "土星 (Saturn)",
    jpName: "土星",
    textures: {
      map: 'saturn.jpg',
      ringsMap: 'saturn_rings.png'
    },
    size: 9.45,
    distance: 9.54,
    year: "29年",
    day: "10.7時間",
    diameter: "116,460 km (地球の約9.5倍)",
    mass: "5.68 × 10²⁶ kg (地球の約95倍)",
    gravity: "10.4 m/s² (地球の約1.1倍)",
    type: "ガス惑星",
    color: CONSTANTS.COLORS.SATURN,
    rotationSpeed: 0.038,
    orbitSpeed: 0.034,
    orbitParams: {
      eccentricity: 0.054,
      inclination: 2.5,
      longitudeOfAscendingNode: 113.7,
      argumentOfPeriapsis: 339.4
    },
    rings: {
      innerRadius: 1.2,
      outerRadius: 2.5
    },
    facts: "美しい環で知られています。この環は氷と岩の小さな粒子でできています。",
    description: "土星は特徴的な環を持つガス惑星です。環は主に氷の粒子と少量の岩の破片からなり、厚さはわずか10m程度にもかかわらず、直径は約27万kmにも及びます。土星自体は木星と同様に主に水素とヘリウムで構成されています。土星には少なくとも82個の衛星があり、最大のタイタンは独自の厚い大気を持つ唯一の衛星です。"
  },
  {
    id: 'uranus',
    name: "天王星 (Uranus)",
    jpName: "天王星",
    textures: {
      map: 'uranus.jpg'
    },
    size: 4.0,
    distance: 21.0,  // 19.2から21.0に増加
    year: "84年",
    day: "17.2時間",
    diameter: "50,724 km (地球の約4倍)",
    mass: "8.68 × 10²⁵ kg (地球の約14.5倍)",
    gravity: "8.87 m/s² (地球の約0.9倍)",
    type: "氷惑星",
    color: CONSTANTS.COLORS.URANUS,
    rotationSpeed: 0.03,
    orbitSpeed: 0.012,
    orbitParams: {
      eccentricity: 0.047,
      inclination: 0.8,
      longitudeOfAscendingNode: 74.0,
      argumentOfPeriapsis: 96.7
    },
    rings: {
      innerRadius: 1.1,
      outerRadius: 1.3
    },
    facts: "横に寝たように回転している珍しい惑星です。メタンガスが大気中にあり、青緑色に見えます。",
    description: "天王星は軸が約98度傾いており、他の惑星とは異なり「横向き」に回転しているように見えます。この傾きは過去の大きな衝突によって引き起こされたと考えられています。大気中のメタンガスが赤い光を吸収して青緑色に見えます。天王星には少なくとも27個の衛星があり、薄い環系も持っています。表面下には主に岩と氷からなる層があると考えられています。"
  },
  {
    id: 'neptune',
    name: "海王星 (Neptune)",
    jpName: "海王星",
    textures: {
      map: 'neptune.jpg'
    },
    size: 3.88,
    distance: 30.05,
    year: "165年",
    day: "16.1時間",
    diameter: "49,244 km (地球の約3.9倍)",
    mass: "1.02 × 10²⁶ kg (地球の約17倍)",
    gravity: "11.2 m/s² (地球の約1.1倍)",
    type: "氷惑星",
    color: CONSTANTS.COLORS.NEPTUNE,
    rotationSpeed: 0.032,
    orbitSpeed: 0.006,
    orbitParams: {
      eccentricity: 0.009,
      inclination: 1.8,
      longitudeOfAscendingNode: 131.8,
      argumentOfPeriapsis: 276.3
    },
    facts: "太陽系で最も風が強い惑星で、最高で時速2,100キロメートルの風が吹いています。",
    description: "海王星は天王星と似た青い氷惑星ですが、より暗く、より濃い青色をしています。太陽系で最も強い風が吹き、最大風速は秒速580メートル（時速2,100キロメートル）を超えます。「大暗斑」と呼ばれる巨大な嵐が存在しましたが、時間とともに消えたり現れたりします。数学的計算から存在が予測され、1846年に発見された最初の惑星です。少なくとも14個の衛星を持ち、最大のトリトンは逆行軌道を持つ唯一の大きな衛星です。"
  }
];