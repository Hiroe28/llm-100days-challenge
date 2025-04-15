/**
 * 分子クラス - 原子の結合構造を分子として認識し管理します
 */
class Molecule {
    constructor(atoms = []) {
        this.atoms = new Set(atoms);
        this.id = this.generateMoleculeId();
        this.formula = '';
        this.name = '';
        this.description = '';
        this.isRecognized = false;
        this.lastUpdate = performance.now();
        
        // 分子構造の解析
        this.analyzeStructure();
    }
    
    // ユニークな分子IDの生成
    generateMoleculeId() {
        return `mol_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // 分子に原子を追加
    addAtom(atom) {
        if (!this.atoms.has(atom)) {
            this.atoms.add(atom);
            atom.setMoleculeId(this.id);
            this.analyzeStructure();
            return true;
        }
        return false;
    }
    
    // 分子から原子を削除
    removeAtom(atom) {
        if (this.atoms.has(atom)) {
            this.atoms.delete(atom);
            atom.setMoleculeId(null);
            
            if (this.atoms.size > 0) {
                this.analyzeStructure();
            }
            return true;
        }
        return false;
    }
    
    // 別の分子と結合
    mergeWith(otherMolecule) {
        // 他の分子の原子を全て追加
        otherMolecule.atoms.forEach(atom => {
            this.addAtom(atom);
        });
        
        // 構造を再解析
        this.analyzeStructure();
        return this;
    }
    


    // 分子構造の解析
    analyzeStructure() {


        // 原子数が0の場合は処理終了
        if (this.atoms.size === 0) {
            this.formula = '';
            this.name = '';
            this.description = '';
            this.isRecognized = false;
            return;
        }
        
        // 元素ごとの原子数をカウント
        const atomCounts = {};
        
        this.atoms.forEach(atom => {
            const element = atom.element;
            if (!atomCounts[element]) {
                atomCounts[element] = 0;
            }
            atomCounts[element]++;
        });
        
        // 分子式の生成
        this.formula = MoleculeDatabase.generateFormula(atomCounts);
        
        // デバッグ用ログ追加
        console.log("原子カウント詳細:", Array.from(this.atoms).map(atom => atom.element));
        console.log("集計結果:", atomCounts);


        console.log("分子構成:", atomCounts);
        console.log("生成された分子式:", this.formula);
        
        // 分子式の正規化
        const normalizedFormula = MoleculeDatabase.normalizeFormula(this.formula);
        console.log("正規化された分子式:", normalizedFormula);
        
        // 既知の分子かチェック - 通常の検索と代替表記の検索
        let recognized = false;
        
        // 組成から検索
        const moleculeByComp = MoleculeDatabase.findMoleculeByComposition(atomCounts);
        if (moleculeByComp) {
            this.name = moleculeByComp.name;
            this.description = moleculeByComp.description;
            this.formula = moleculeByComp.formula; // データベースの正確な表記を使用
            this.isRecognized = true;
            recognized = true;
            console.log("分子認識成功(構成から):", moleculeByComp.name);
        }
        
        // 直接的な分子式検索
        if (!recognized) {
            const moleculeByFormula = MoleculeDatabase.findMoleculeByFormula(this.formula);
            if (moleculeByFormula) {
                this.name = moleculeByFormula.name;
                this.description = moleculeByFormula.description;
                this.formula = moleculeByFormula.formula; // データベースの正確な表記を使用
                this.isRecognized = true;
                recognized = true;
                console.log("分子認識成功(分子式から):", moleculeByFormula.name);
            }
        }
        
        // 認識できなかった場合
        if (!recognized) {
            this.name = '未知の分子';
            this.description = '新しい分子構造です';
            this.isRecognized = false;
            console.log("分子認識失敗:", this.formula);
        }
        
        // 分子に属する全ての原子にIDを設定
        this.atoms.forEach(atom => {
            atom.setMoleculeId(this.id);
        });
    }
    
    // 分子情報のHTML形式での取得
    getInfoHTML() {
        const infoHTML = document.createElement('div');
        
        if (this.isRecognized) {
            // 分子名
            const nameElem = document.createElement('div');
            nameElem.className = 'molecule-name';
            nameElem.textContent = this.name;
            infoHTML.appendChild(nameElem);
            
            // 分子式
            const formulaElem = document.createElement('div');
            formulaElem.className = 'molecule-formula';
            formulaElem.innerHTML = PeriodicTable.formatFormula(this.formula);
            infoHTML.appendChild(formulaElem);
            
            // 説明
            const descElem = document.createElement('div');
            descElem.textContent = this.description;
            infoHTML.appendChild(descElem);
        } else {
            // 未知の分子
            const formulaElem = document.createElement('div');
            formulaElem.className = 'molecule-formula';
            formulaElem.innerHTML = `新しい分子: ${PeriodicTable.formatFormula(this.formula)}`;
            infoHTML.appendChild(formulaElem);
            
            // 構成原子
            const atomsElem = document.createElement('div');
            atomsElem.textContent = `構成原子: ${this.atoms.size}個`;
            infoHTML.appendChild(atomsElem);
        }
        
        return infoHTML;
    }
    
    // テキスト情報の取得
    getInfoText() {
        if (this.isRecognized) {
            return `${this.name} (${this.formula}): ${this.description}`;
        } else {
            return `新しい分子: ${this.formula}, 構成原子: ${this.atoms.size}個`;
        }
    }
    
    // 分子の中心座標を計算
    getCenter() {
        let totalX = 0;
        let totalY = 0;
        let count = 0;
        
        this.atoms.forEach(atom => {
            totalX += atom.x;
            totalY += atom.y;
            count++;
        });
        
        if (count === 0) return { x: 0, y: 0 };
        
        return {
            x: totalX / count,
            y: totalY / count
        };
    }
    
    // 分子の結合の健全性チェック（破損した結合がないか）
    checkBondIntegrity() {
        const atomsArray = Array.from(this.atoms);
        const validBonds = new Set();
        
        // 全ての原子の結合をチェック
        atomsArray.forEach(atom => {
            atom.bonds.forEach(bond => {
                // 結合先の原子が同じ分子に属しているか
                if (this.atoms.has(bond.atom)) {
                    validBonds.add(bond);
                } else {
                    // 分子間の結合を発見 - 結合を解除
                    console.log('分子間の不正な結合を検出:', atom.element, '-', bond.atom.element);
                    atom.breakBondWith(bond.atom);
                }
            });
        });
        
        return validBonds.size > 0;
    }
}

/**
 * 分子検出システム - 原子の結合状態から分子を検出・管理します
 */
class MoleculeDetector {
    constructor() {
        this.molecules = new Map(); // 分子ID -> 分子オブジェクト
        this.lastDetectionTime = 0;
        this.detectionInterval = 500; // ms
    }
    

    // MoleculeDetector クラスの detectMolecules メソッドに変更を追加

    detectMolecules(atoms, forceUpdate = false) {
        const now = performance.now();
        
        // 一定間隔でのみ検出処理を実行（パフォーマンス最適化）
        if (!forceUpdate && now - this.lastDetectionTime < this.detectionInterval) {
            return [];
        }
        
        this.lastDetectionTime = now;
        
        // 現在の分子IDをすべて記録（削除用）
        const oldMoleculeIds = new Set(this.molecules.keys());
        
        // 分子の集合を作成（結合でつながった原子グループ）
        const moleculeClusters = this.findMoleculeClusters(atoms);
        const newMolecules = [];
        const updatedMoleculeIds = new Set();
        
        // 各クラスターを処理
        moleculeClusters.forEach(cluster => {
            if (cluster.length === 0) return;
            
            // クラスター内の原子が既存の分子に属しているか確認
            const existingMoleculeIds = new Set();
            cluster.forEach(atom => {
                if (atom.moleculeId) {
                    existingMoleculeIds.add(atom.moleculeId);
                }
            });
            
            let molecule;
            
            if (existingMoleculeIds.size === 0) {
                // 新しい分子を作成
                molecule = new Molecule(cluster);
                this.molecules.set(molecule.id, molecule);
                newMolecules.push(molecule);
            } else if (existingMoleculeIds.size === 1) {
                // 既存の分子が1つだけの場合
                const moleculeId = Array.from(existingMoleculeIds)[0];
                molecule = this.molecules.get(moleculeId);
                
                // 分子が存在しない場合（古い参照など）、新しく作成
                if (!molecule) {
                    molecule = new Molecule(cluster);
                    this.molecules.set(molecule.id, molecule);
                    newMolecules.push(molecule);
                } else {
                    // 既存の分子を更新（原子を追加）
                    let changed = false;
                    cluster.forEach(atom => {
                        if (!molecule.atoms.has(atom)) {
                            molecule.addAtom(atom);
                            changed = true;
                        }
                    });
                    
                    // 分子の構成が変わった場合は再分析
                    if (changed) {
                        molecule.analyzeStructure();
                        if (!newMolecules.includes(molecule)) {
                            newMolecules.push(molecule);
                        }
                    }
                    
                    updatedMoleculeIds.add(molecule.id);
                }
            } else {
                // 複数の分子が結合した場合 - マージ処理
                const moleculeIds = Array.from(existingMoleculeIds);
                molecule = this.molecules.get(moleculeIds[0]);
                
                if (!molecule) {
                    // 主となる分子が見つからない場合、新規作成
                    molecule = new Molecule(cluster);
                    this.molecules.set(molecule.id, molecule);
                    newMolecules.push(molecule);
                } else {
                    // 残りの分子を主分子にマージ
                    for (let i = 1; i < moleculeIds.length; i++) {
                        const otherMolecule = this.molecules.get(moleculeIds[i]);
                        if (otherMolecule) {
                            molecule.mergeWith(otherMolecule);
                            this.molecules.delete(moleculeIds[i]);
                        }
                    }
                    
                    // クラスター内の全原子を確実に追加
                    let changed = false;
                    cluster.forEach(atom => {
                        if (!molecule.atoms.has(atom)) {
                            molecule.addAtom(atom);
                            changed = true;
                        }
                    });
                    
                    // 分子構成が変わった場合は再分析
                    if (changed) {
                        molecule.analyzeStructure();
                        if (!newMolecules.includes(molecule)) {
                            newMolecules.push(molecule);
                        }
                    }
                    
                    updatedMoleculeIds.add(molecule.id);
                }
            }
            
            // 更新・追加された分子IDを記録
            updatedMoleculeIds.add(molecule.id);
            // 古い分子リストから削除（存続する分子）
            oldMoleculeIds.delete(molecule.id);
        });
        
        // 更新されなかった分子のうち、oldMoleculeIds に残っているものは消失した分子
        // これらを削除
        oldMoleculeIds.forEach(id => {
            const molecule = this.molecules.get(id);
            if (molecule) {
                // 分子の原子の分子ID参照をクリア
                molecule.atoms.forEach(atom => {
                    atom.setMoleculeId(null);
                });
                this.molecules.delete(id);
            }
        });
        
        // 残りの分子の結合整合性を確認
        const deleteMoleculeIds = [];
        this.molecules.forEach((molecule, id) => {
            if (!updatedMoleculeIds.has(id)) {
                // 結合整合性チェック
                if (!molecule.checkBondIntegrity() || molecule.atoms.size === 0) {
                    // 破損した分子または空の分子を削除リストに追加
                    deleteMoleculeIds.push(id);
                }
            }
        });
        
        // 破損した分子を削除
        deleteMoleculeIds.forEach(id => {
            const molecule = this.molecules.get(id);
            if (molecule) {
                // 分子の原子の分子ID参照をクリア
                molecule.atoms.forEach(atom => {
                    atom.setMoleculeId(null);
                });
                this.molecules.delete(id);
            }
        });
        
        return newMolecules;
    }
    
    // 結合でつながった原子グループ（クラスター）を検出
    findMoleculeClusters(atoms) {
        const visited = new Set();
        const clusters = [];
        
        atoms.forEach(atom => {
            if (!visited.has(atom)) {
                const cluster = [];
                this.depthFirstSearch(atom, visited, cluster);
                if (cluster.length > 0) {
                    clusters.push(cluster);
                }
            }
        });
        
        return clusters;
    }
    
    // 深さ優先探索で結合原子を探索
    depthFirstSearch(atom, visited, cluster) {
        visited.add(atom);
        cluster.push(atom);
        
        atom.bonds.forEach(bond => {
            if (!visited.has(bond.atom)) {
                this.depthFirstSearch(bond.atom, visited, cluster);
            }
        });
    }
    
    // 特定の原子を含む分子を取得
    getMoleculeByAtom(atom) {
        if (!atom.moleculeId) return null;
        return this.molecules.get(atom.moleculeId) || null;
    }
    
    // 全ての分子情報を取得
    getAllMolecules() {
        return Array.from(this.molecules.values());
    }
    
    // 特定の分子式を持つ分子を検索
    findMoleculesByFormula(formula) {
        const result = [];
        this.molecules.forEach(molecule => {
            if (molecule.formula === formula) {
                result.push(molecule);
            }
        });
        return result;
    }



}

    // periodic_table.js の MoleculeDatabase オブジェクトに以下の関数を追加

    // 正規化された分子式で分子を検索する関数
    MoleculeDatabase.findMoleculeByNormalizedFormula = function(formula) {
        // 入力の正規化
        const normalizedInput = formula.toUpperCase().trim();
        console.log("正規化分子式で検索:", normalizedInput);
        
        // 完全一致で検索
        for (const molecule of this.molecules) {
            const normalizedFormula = molecule.formula.toUpperCase().trim();
            if (normalizedFormula === normalizedInput) {
                console.log(`完全一致: ${normalizedInput} = ${molecule.formula} (${molecule.name})`);
                return molecule;
            }
        }
        
        // 下付き文字を考慮した形式で比較
        const strippedInput = normalizedInput.replace(/\d+/g, '');
        for (const molecule of this.molecules) {
            const strippedFormula = molecule.formula.toUpperCase().trim().replace(/\d+/g, '');
            if (strippedFormula === strippedInput) {
                console.log(`構造一致: ${normalizedInput} ≈ ${molecule.formula} (${molecule.name})`);
                return molecule;
            }
        }
        
        console.log(`一致する分子なし: ${normalizedInput}`);
        return null;
    };