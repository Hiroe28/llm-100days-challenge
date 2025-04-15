/**
 * 元素周期表データ - 基本的な元素情報とプロパティの定義
 */
const PeriodicTable = {
    // 元素情報
    elements: {
        H: {
            name: '水素',
            name_en: 'Hydrogen',
            atomicNumber: 1,
            atomicMass: 1.008,
            electronegativity: 2.20,
            radius: 25, // ピクセルサイズ（相対的なサイズ）
            color: '#FFFFFF',
            electronConfiguration: '1s¹',
            valenceElectrons: 1,
            maxBonds: 1, // 最大結合数
            description: '最も軽い元素で、水や多くの有機化合物の構成要素',
            group: 'nonmetal'
        },
        C: {
            name: '炭素',
            name_en: 'Carbon',
            atomicNumber: 6,
            atomicMass: 12.011,
            electronegativity: 2.55,
            radius: 40,
            color: '#808080',
            electronConfiguration: '1s² 2s² 2p²',
            valenceElectrons: 4,
            maxBonds: 4,
            description: '生命の基本要素。多様な有機化合物を形成する',
            group: 'nonmetal'
        },
        N: {
            name: '窒素',
            name_en: 'Nitrogen',
            atomicNumber: 7,
            atomicMass: 14.007,
            electronegativity: 3.04,
            radius: 35,
            color: '#5555FF',
            electronConfiguration: '1s² 2s² 2p³',
            valenceElectrons: 5,
            maxBonds: 3,
            description: '大気の約78%を占め、タンパク質にも含まれる',
            group: 'nonmetal'
        },
        O: {
            name: '酸素',
            name_en: 'Oxygen',
            atomicNumber: 8,
            atomicMass: 15.999,
            electronegativity: 3.44,
            radius: 30,
            color: '#FF0000',
            electronConfiguration: '1s² 2s² 2p⁴',
            valenceElectrons: 6,
            maxBonds: 2,
            description: '呼吸に必須で、地球の大気の約21%を占める',
            group: 'nonmetal'
        },
        Cl: {
            name: '塩素',
            name_en: 'Chlorine',
            atomicNumber: 17,
            atomicMass: 35.453,
            electronegativity: 3.16,
            radius: 45,
            color: '#00FF00',
            electronConfiguration: '1s² 2s² 2p⁶ 3s² 3p⁵',
            valenceElectrons: 7,
            maxBonds: 1,
            description: '強い酸化剤で、多くの塩や化合物を形成する',
            group: 'halogen'
        }
    },
    
    // 結合タイプ
    bondTypes: {
        SINGLE: 'single',
        DOUBLE: 'double',
        TRIPLE: 'triple',
        IONIC: 'ionic'
    },
    
    // 結合距離の計算（原子半径の合計×係数）
    calculateBondDistance: function(element1, element2, bondType) {
        const e1 = this.elements[element1];
        const e2 = this.elements[element2];
        
        if (!e1 || !e2) return 100; // デフォルト値
        
        let distanceFactor;
        switch(bondType) {
            case this.bondTypes.SINGLE:
                distanceFactor = 0.9; // 単結合
                break;
            case this.bondTypes.DOUBLE:
                distanceFactor = 0.8; // 二重結合は短い
                break;
            case this.bondTypes.TRIPLE:
                distanceFactor = 0.7; // 三重結合はさらに短い
                break;
            case this.bondTypes.IONIC:
                distanceFactor = 1.1; // イオン結合は長い
                break;
            default:
                distanceFactor = 0.9;
        }
        
        return (e1.radius + e2.radius) * distanceFactor;
    },
    
    // 結合エネルギーの計算（仮の値）
    calculateBondEnergy: function(element1, element2, bondType) {
        const e1 = this.elements[element1];
        const e2 = this.elements[element2];
        
        if (!e1 || !e2) return 50; // デフォルト値
        
        // 結合エネルギーを電気陰性度の差から概算
        const electronegativityDiff = Math.abs(e1.electronegativity - e2.electronegativity);
        
        let energyBase;
        switch(bondType) {
            case this.bondTypes.SINGLE:
                energyBase = 70; // 単結合
                break;
            case this.bondTypes.DOUBLE:
                energyBase = 120; // 二重結合
                break;
            case this.bondTypes.TRIPLE:
                energyBase = 180; // 三重結合
                break;
            case this.bondTypes.IONIC:
                energyBase = 100; // イオン結合
                break;
            default:
                energyBase = 70;
        }
        
        // 電気陰性度の差が大きいほど強い結合に（イオン性が高まる）
        return energyBase * (1 + electronegativityDiff * 0.2);
    },
    
    // 結合タイプの判定（電気陰性度の差から）
    determineBondType: function(element1, element2) {
        const e1 = this.elements[element1];
        const e2 = this.elements[element2];
        
        if (!e1 || !e2) return this.bondTypes.SINGLE;
        
        const electronegativityDiff = Math.abs(e1.electronegativity - e2.electronegativity);
        
        if (electronegativityDiff > 1.7) {
            return this.bondTypes.IONIC;
        } else {
            return this.bondTypes.SINGLE; // デフォルトは単結合
        }
    },
    
    // 結合の確率（原子間の親和性を表現）
    calculateBondProbability: function(element1, element2) {
        const e1 = this.elements[element1];
        const e2 = this.elements[element2];
        
        if (!e1 || !e2) return 0.5;
        
        // 特定の組み合わせの親和性を高く設定
        const specialPairs = {
            'H-O': 0.9,
            'O-H': 0.9,
            'C-H': 0.85,
            'H-C': 0.85,
            'C-O': 0.8,
            'O-C': 0.8,
            'C-Cl': 0.75,
            'Cl-C': 0.75,
            'H-Cl': 0.7,
            'Cl-H': 0.7,
            'C-N': 0.8,
            'N-C': 0.8,
            'N-H': 0.8,
            'H-N': 0.8
        };
        
        const pairKey = `${element1}-${element2}`;
        if (specialPairs[pairKey] !== undefined) {
            return specialPairs[pairKey];
        }
        
        // それ以外は電気陰性度の差から計算（極性が適度にあると結合しやすい）
        const electronegativityDiff = Math.abs(e1.electronegativity - e2.electronegativity);
        return 0.5 + Math.min(electronegativityDiff, 0.8) * 0.3;
    },
    
    // 元素情報の取得
    getElement: function(symbol) {
        return this.elements[symbol] || null;
    },
    
    // HTMLでの表示用に分子式をフォーマット（下付き文字）
    formatFormula: function(formula) {
        return formula.replace(/(\d+)/g, '<sub>$1</sub>');
    }
};


// 分子定義
const MoleculeDatabase = {
    molecules: [
        {
            formula: 'H2O',
            name: '水',
            name_en: 'Water',
            composition: { H: 2, O: 1 },
            description: '生命の源。無色透明の液体で、地球上に豊富に存在',
            geometry: '曲がった構造（約104.5°の角度）'
        },
        {
            formula: 'H2',
            name: '水素',
            name_en: 'Hydrogen Gas',
            composition: { H: 2 },
            description: '最も軽い気体。燃料や化学反応に使用される',
            geometry: '直線構造'
        },
        {
            formula: 'O2',
            name: '酸素',
            name_en: 'Oxygen Gas',
            composition: { O: 2 },
            description: '生物の呼吸に不可欠な気体',
            geometry: '直線構造'
        },
        {
            formula: 'CO2',
            name: '二酸化炭素',
            name_en: 'Carbon Dioxide',
            composition: { C: 1, O: 2 },
            description: '植物の光合成に必要で、温室効果にも関与する気体',
            geometry: '直線構造（O=C=O）'
        },
        {
            formula: 'NH3',
            name: 'アンモニア',
            name_en: 'Ammonia',
            composition: { N: 1, H: 3 },
            description: '刺激臭のある気体。肥料や洗剤の原料',
            geometry: '三角錐構造'
        },
        {
            formula: 'CH4',
            name: 'メタン',
            name_en: 'Methane',
            composition: { C: 1, H: 4 },
            description: '天然ガスの主成分。温室効果ガスの一種',
            geometry: '正四面体構造'
        },
        {
            formula: 'HCl',
            name: '塩化水素',
            name_en: 'Hydrogen Chloride',
            composition: { H: 1, Cl: 1 },
            description: '強い酸性を示す気体。水に溶けると塩酸になる',
            geometry: '直線構造'
        },
        {
            formula: 'H2O2',
            name: '過酸化水素',
            name_en: 'Hydrogen Peroxide',
            composition: { H: 2, O: 2 },
            description: '酸化力の強い物質。漂白剤や消毒薬として使用',
            geometry: '折れ曲がった構造'
        },
        {
            formula: 'C2H4',
            name: 'エチレン',
            name_en: 'Ethylene',
            composition: { C: 2, H: 4 },
            description: 'プラスチックの原料となる。植物ホルモンとしても機能',
            geometry: '平面構造（C=C二重結合）'
        },
        {
            formula: 'C2H6',
            name: 'エタン',
            name_en: 'Ethane',
            composition: { C: 2, H: 6 },
            description: '天然ガスに含まれる。燃料や化学原料として使用',
            geometry: 'C-C単結合を中心とした構造'
        },
        {
            formula: 'CH3OH',
            name: 'メタノール',
            name_en: 'Methanol',
            composition: { C: 1, H: 4, O: 1 },
            description: '最も単純なアルコール。溶剤や燃料として使用',
            geometry: '四面体構造のC原子'
        },
        {
            formula: 'C2H5OH',
            name: 'エタノール',
            name_en: 'Ethanol',
            composition: { C: 2, H: 6, O: 1 },
            description: '飲料アルコールの主成分。消毒や燃料にも使用',
            geometry: 'C-C結合を持つアルコール'
        },
        // --- 以下、新しく追加した分子 ---
        {
            formula: 'CH3Cl',
            name: 'クロロメタン',
            name_en: 'Chloromethane',
            composition: { C: 1, H: 3, Cl: 1 },
            description: '冷媒や有機合成の原料として使用される無色の気体',
            geometry: '四面体構造'
        },
        {
            formula: 'CCl4',
            name: '四塩化炭素',
            name_en: 'Carbon Tetrachloride',
            composition: { C: 1, Cl: 4 },
            description: '有機溶媒として使用されたが、現在は環境影響により使用が制限されている',
            geometry: '正四面体構造'
        },
        {
            formula: 'C2H5Cl',
            name: 'クロロエタン',
            name_en: 'Chloroethane',
            composition: { C: 2, H: 5, Cl: 1 },
            description: '局所麻酔薬や有機合成の中間体として使用される気体',
            geometry: 'C-C単結合を持つ構造'
        },
        {
            formula: 'COCl2',
            name: 'ホスゲン',
            name_en: 'Phosgene',
            composition: { C: 1, O: 1, Cl: 2 },
            description: '化学兵器として使用された歴史がある。現在は有機合成に利用',
            geometry: '平面三角形構造'
        },
        {
            formula: 'Cl2',
            name: '塩素',
            name_en: 'Chlorine Gas',
            composition: { Cl: 2 },
            description: '黄緑色の有毒な気体。水の消毒や漂白剤に使用',
            geometry: '直線構造'
        },
        {
            formula: 'N2',
            name: '窒素',
            name_en: 'Nitrogen Gas',
            composition: { N: 2 },
            description: '大気の約78%を占める無色無臭の気体。化学的に安定',
            geometry: '直線構造（三重結合）'
        },
        {
            formula: 'NO',
            name: '一酸化窒素',
            name_en: 'Nitric Oxide',
            composition: { N: 1, O: 1 },
            description: '体内でシグナル伝達物質として機能する気体',
            geometry: '直線構造'
        },
        {
            formula: 'NO2',
            name: '二酸化窒素',
            name_en: 'Nitrogen Dioxide',
            composition: { N: 1, O: 2 },
            description: '赤褐色の有毒な気体。大気汚染物質のひとつ',
            geometry: '折れ曲がった構造'
        },
        {
            formula: 'HCN',
            name: 'シアン化水素',
            name_en: 'Hydrogen Cyanide',
            composition: { H: 1, C: 1, N: 1 },
            description: '強力な毒性を持つ気体。一部の植物に含まれる',
            geometry: '直線構造'
        },
        {
            formula: 'CO',
            name: '一酸化炭素',
            name_en: 'Carbon Monoxide',
            composition: { C: 1, O: 1 },
            description: '無色無臭の有毒気体。不完全燃焼で生成',
            geometry: '直線構造'
        },
        {
            formula: 'HCOOH',
            name: 'ギ酸',
            name_en: 'Formic Acid',
            composition: { H: 2, C: 1, O: 2 },
            description: '最も単純なカルボン酸。アリの毒にも含まれる',
            geometry: '平面構造'
        },
        {
            formula: 'CH3COOH',
            name: '酢酸',
            name_en: 'Acetic Acid',
            composition: { C: 2, H: 4, O: 2 },
            description: '酸味の主成分で、食酢の主な成分',
            geometry: 'カルボキシル基を持つ構造'
        }
    ],
    
    // 既存のメソッドはそのまま
    findMolecule: function(formula) {
        return this.molecules.find(m => m.formula === formula) || null;
    },
    
    findMoleculeByComposition: function(atomCounts) {
        console.log("分子検索開始:", atomCounts);
        
        // 組成を元素記号と原子数の組み合わせでチェック
        for (const molecule of this.molecules) {
            console.log("候補分子:", molecule.formula, molecule.composition);
            
            let match = true;
            
            // 分子の組成をチェック
            for (const element in molecule.composition) {
                if (atomCounts[element] !== molecule.composition[element]) {
                    match = false;
                    break;
                }
            }
            
            // 追加の元素がないことを確認
            for (const element in atomCounts) {
                if (!molecule.composition[element]) {
                    match = false;
                    break;
                }
            }
            
            if (match) {
                console.log("分子一致:", molecule.formula);
                return molecule;
            }
        }
        
        console.log("一致する分子なし");
        return null;
    },
    
    generateFormula: function(atomCounts) {
        let formula = '';
        
        // 一般的な元素の順序（C, H, O, N, 他のアルファベット順）
        const elementOrder = ['C', 'H', 'O', 'N'];
        
        // まず指定順序の元素を処理
        elementOrder.forEach(element => {
            if (atomCounts[element]) {
                formula += element;
                if (atomCounts[element] > 1) {
                    formula += atomCounts[element];
                }
                delete atomCounts[element]; // 処理済みの元素を削除
            }
        });
        
        // 残りの元素をアルファベット順で処理
        const remainingElements = Object.keys(atomCounts).sort();
        remainingElements.forEach(element => {
            formula += element;
            if (atomCounts[element] > 1) {
                formula += atomCounts[element];
            }
        });
        
        return formula;
    },
    
    normalizeFormula: function(formula) {
        // 空白を削除し大文字に変換
        return (formula || '').toString().trim().toUpperCase();
    },
    
    areSameFormula: function(formula1, formula2) {
        const normalized1 = this.normalizeFormula(formula1);
        const normalized2 = this.normalizeFormula(formula2);
        
        // 直接一致するか確認
        if (normalized1 === normalized2) {
            return true;
        }
        
        // 特殊ケースの直接マッピング
        const specialCases = {
            'C2H5OH': ['C2H6O'],
            'C2H6O': ['C2H5OH'],
            'CH3OH': ['CH4O'],
            'CH4O': ['CH3OH'],
            'H2O': ['HOH'],
            'H2O2': ['HOOH'],
            'NH3': ['H3N'],
            'CH4': ['H4C']
        };
        
        // 特殊ケース対応
        if (specialCases[normalized1] && specialCases[normalized1].includes(normalized2)) return true;
        if (specialCases[normalized2] && specialCases[normalized2].includes(normalized1)) return true;
        
        // 代替表記で一致するか確認
        for (const molecule of this.molecules) {
            // 代替表記があれば確認
            if (molecule.alternativeFormulas) {
                const mainFormula = this.normalizeFormula(molecule.formula);
                
                // 代替表記と一致するかチェック
                if ((mainFormula === normalized1 && molecule.alternativeFormulas.some(alt => 
                     this.normalizeFormula(alt) === normalized2)) ||
                    (mainFormula === normalized2 && molecule.alternativeFormulas.some(alt => 
                     this.normalizeFormula(alt) === normalized1))) {
                    return true;
                }
            }
        }
        
        return false;
    },
    
    addAlternativeFormulas: function() {
        const formulaAlternatives = {
            'C2H5OH': ['C2H6O'],      // エタノール
            'CH3OH': ['CH4O'],        // メタノール
            'C2H4': ['H2CCH2'],       // エチレン
            'C2H6': ['H3CCH3'],       // エタン
            'H2O': ['HOH'],           // 水
            'H2O2': ['HOOH'],         // 過酸化水素
            'NH3': ['H3N'],           // アンモニア
            'CH4': ['H4C'],           // メタン
            'HCN': ['CHN'],           // シアン化水素
            'HCOOH': ['CH2O2']        // ギ酸
        };
        
        this.molecules = this.molecules.map(molecule => {
            // この分子に代替表記があるか確認
            const alternatives = formulaAlternatives[molecule.formula] || [];
            
            if (alternatives.length > 0) {
                return {
                    ...molecule,
                    alternativeFormulas: alternatives
                };
            }
            
            return molecule;
        });
        
        console.log("分子の代替表記を追加しました");
    },
    
    findMoleculeByFormula: function(formula) {
        const normalizedFormula = this.normalizeFormula(formula);
        
        // 主表記で検索
        let molecule = this.molecules.find(m => this.normalizeFormula(m.formula) === normalizedFormula);
        
        // 代替表記で検索
        if (!molecule) {
            molecule = this.molecules.find(m => 
                (m.alternativeFormulas || []).some(alt => 
                    this.normalizeFormula(alt) === normalizedFormula
                )
            );
        }
        
        return molecule || null;
    }
};

// 初期化時に代替表記を追加
MoleculeDatabase.addAlternativeFormulas();

// 反応ルールの定義
const ReactionRules = [
    {
        reactants: ["CH4", "O2"],
        minTemperature: 400, // 燃焼には高温が必要
        products: ["CO2", "H2O"],
        ratio: {CH4: 1, O2: 2, CO2: 1, H2O: 2}, // 化学量論比
        description: "メタンの燃焼反応: CH₄ + 2O₂ → CO₂ + 2H₂O"
    },
    {
        reactants: ["H2", "O2"],
        minTemperature: 300,
        products: ["H2O"],
        ratio: {H2: 2, O2: 1, H2O: 2},
        description: "水素と酸素から水が生成: 2H₂ + O₂ → 2H₂O"
    },
    {
        reactants: ["CO2", "H2O"],
        catalyst: "chlorophyll", // 光合成には葉緑素が必要
        products: ["O2", "C6H12O6"], // 簡略化：実際はグルコースの生成には複数のCO2とH2Oが必要
        ratio: {CO2: 6, H2O: 6, O2: 6, C6H12O6: 1},
        description: "光合成反応: 6CO₂ + 6H₂O → 6O₂ + C₆H₁₂O₆"
    }
];