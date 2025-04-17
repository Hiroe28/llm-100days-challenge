// save.js ファイルを新規作成

// ゲームの保存/読み込み機能
class SaveManager {
    constructor() {
        this.saveKey = 'alchemyGame';
        this.initialized = false;
    }
    
    // 初期化
    init() {
        if (this.initialized) return;
        
        // 保存/読み込みボタンをUIに追加
        this.addSaveLoadControls();
        this.initialized = true;
        
        // 自動保存タイマー設定
        this.setupAutoSave();
    }
    
    // UIコントロール追加
    addSaveLoadControls() {
        const gameHeader = document.querySelector('.game-header > div:last-child');
        if (!gameHeader) return;
        
        // 保存ボタン
        const saveButton = document.createElement('button');
        saveButton.id = 'save-button';
        saveButton.className = 'save-button';
        saveButton.textContent = '💾';
        saveButton.title = 'ゲームを保存';
        saveButton.style.cssText = 'background-color: #4CAF50; color: white; margin-left: 10px;';
        
        saveButton.addEventListener('click', () => {
            if (this.saveGame()) {
                showMessage('ゲームを保存しました！', 'success');
                playButtonSound();
            } else {
                showMessage('ゲームの保存に失敗しました。', 'error');
            }
        });
        
        // 読み込みボタン
        const loadButton = document.createElement('button');
        loadButton.id = 'load-button';
        loadButton.className = 'load-button';
        loadButton.textContent = '📂';
        loadButton.title = 'ゲームを読み込む';
        loadButton.style.cssText = 'background-color: #2196F3; color: white; margin-left: 10px;';
        
        loadButton.addEventListener('click', () => {
            this.showLoadConfirmation();
            playButtonSound();
        });
        
        gameHeader.appendChild(saveButton);
        gameHeader.appendChild(loadButton);
    }
    
    // 自動保存設定
    setupAutoSave() {
        // 5分ごとに自動保存
        setInterval(() => {
            if (this.saveGame()) {
                console.log('自動保存完了');
            }
        }, 5 * 60 * 1000);
    }
    
    // 読み込み確認ダイアログ
    showLoadConfirmation() {
        const overlay = document.createElement('div');
        overlay.className = 'load-confirmation-overlay';
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 1000;';
        
        const content = document.createElement('div');
        content.className = 'load-confirmation-content';
        content.style.cssText = 'background-color: white; border-radius: 15px; padding: 20px; width: 80%; max-width: 500px; text-align: center;';
        
        content.innerHTML = `
            <h3>確認</h3>
            <p>保存したゲームを読み込みますか？<br>現在の進行状況は失われます。</p>
            <div style="display: flex; justify-content: center; gap: 20px; margin-top: 20px;">
                <button id="confirm-load" style="background-color: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">はい</button>
                <button id="cancel-load" style="background-color: #f44336; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">いいえ</button>
            </div>
        `;
        
        overlay.appendChild(content);
        document.body.appendChild(overlay);
        
        // イベントリスナー設定
        document.getElementById('confirm-load').addEventListener('click', () => {
            if (this.loadGame()) {
                showMessage('ゲームを読み込みました！', 'success');
            } else {
                showMessage('保存データが見つかりません。', 'error');
            }
            document.body.removeChild(overlay);
        });
        
        document.getElementById('cancel-load').addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
    }
    
    // ゲーム状態を保存
    saveGame() {
        try {
            // 履歴データを取得して保存
            const historyItems = Array.from(document.querySelectorAll('.history-item')).map(item => {
                return {
                    resultId: parseInt(item.dataset.id),
                    ingredients: item.dataset.ingredients.split(',').map(id => parseInt(id)),
                    exp: parseInt(item.dataset.exp || 0)
                };
            });
            const gameState = {
                playerGold,
                inventory,
                currentDay,
                currentTime,
                ingredients: ingredients.map(ing => ({
                    id: ing.id,
                    stock: ing.stock
                })),
                resultItems: resultItems.map(item => ({
                    id: item.id,
                    discovered: item.discovered || false,
                    hintDiscovered: item.hintDiscovered || false,
                    known: item.known || false  // known 状態も保存
                })),
                recipeShopItems: recipeShopItems.map(item => ({
                    id: item.id,
                    purchased: item.purchased || false
                })),
                gatheringPlaces: gatheringPlaces.map(place => ({
                    id: place.id,
                    unlocked: place.unlocked || false
                })),
                gatheringCount,
                alchemyLevel,
                alchemyExp,
                recipeHints,
                shopStock,
                historyItems: historyItems, // 履歴データを追加
                savedAt: new Date().toISOString()
            };
            
            localStorage.setItem(this.saveKey, JSON.stringify(gameState));
            console.log('ゲームデータを保存しました', gameState);
            return true;
        } catch (error) {
            console.error('保存エラー:', error);
            return false;
        }
    }
    
    // ゲーム状態を読み込み
    // save.js の loadGame メソッドを修正
    loadGame() {
        try {
            const savedData = localStorage.getItem(this.saveKey);
            if (!savedData) {
                return false;
            }
            
            const gameState = JSON.parse(savedData);
            
            // 各データを復元（定数再代入エラーを避けるため、内容のみを更新）
            playerGold = gameState.playerGold || 500;
            
            // inventory は中身だけ更新
            Object.keys(inventory).forEach(key => delete inventory[key]);
            if (gameState.inventory) {
                Object.keys(gameState.inventory).forEach(key => {
                    inventory[key] = gameState.inventory[key];
                });
            }
            
            currentDay = gameState.currentDay || 1;
            currentTime = gameState.currentTime || 7;
            
            // 素材の在庫を復元
            if (gameState.ingredients && gameState.ingredients.length > 0) {
                // 各素材の在庫だけを更新
                gameState.ingredients.forEach(savedIng => {
                    const ing = ingredients.find(i => i.id === savedIng.id);
                    if (ing) {
                        ing.stock = savedIng.stock;
                    }
                });
            }
            
            // レシピ発見状態を復元
            if (gameState.resultItems && gameState.resultItems.length > 0) {
                gameState.resultItems.forEach(savedItem => {
                    const item = resultItems.find(i => i.id === savedItem.id);
                    if (item) {
                        item.discovered = savedItem.discovered || false;
                        item.hintDiscovered = savedItem.hintDiscovered || false;
                        item.known = savedItem.known || item.known || false;
                    }
                });
            }
            
            // レシピショップ購入状態を復元
            if (gameState.recipeShopItems && gameState.recipeShopItems.length > 0) {
                gameState.recipeShopItems.forEach(savedItem => {
                    const item = recipeShopItems.find(i => i.id === savedItem.id);
                    if (item) {
                        item.purchased = savedItem.purchased || false;
                    }
                });
            }
            
            // 採取場所の解放状態を復元
            if (gameState.gatheringPlaces && gameState.gatheringPlaces.length > 0) {
                gameState.gatheringPlaces.forEach(savedPlace => {
                    const place = gatheringPlaces.find(p => p.id === savedPlace.id);
                    if (place) {
                        place.unlocked = savedPlace.unlocked || false;
                    }
                });
            }
            
            // gatheringCount は中身だけ更新
            Object.keys(gatheringCount).forEach(key => {
                if (gameState.gatheringCount && gameState.gatheringCount[key] !== undefined) {
                    gatheringCount[key] = gameState.gatheringCount[key];
                }
            });
            
            alchemyLevel = gameState.alchemyLevel || 1;
            alchemyExp = gameState.alchemyExp || 0;
            
            // recipeHints は全体の再代入ではなく、中身を更新
            recipeHints.length = 0; // 一旦クリア
            if (gameState.recipeHints && gameState.recipeHints.length > 0) {
                gameState.recipeHints.forEach(hint => recipeHints.push(hint));
            }
            
            // shopStock は全体の再代入ではなく、中身を更新
            if (gameState.shopStock) {
                // materials の更新
                if (gameState.shopStock.materials) {
                    gameState.shopStock.materials.forEach(savedItem => {
                        const item = shopStock.materials.find(i => i.id === savedItem.id);
                        if (item) {
                            item.currentStock = savedItem.currentStock;
                            item.lastRestockDay = savedItem.lastRestockDay;
                        }
                    });
                }
                
                // recipes の更新
                if (gameState.shopStock.recipes) {
                    gameState.shopStock.recipes.forEach(savedItem => {
                        const item = shopStock.recipes.find(i => i.id === savedItem.id);
                        if (item) {
                            item.stock = savedItem.stock;
                        }
                    });
                }
            }


            // 履歴データを復元
            historyList.innerHTML = ''; // 一旦クリア
            if (gameState.historyItems && gameState.historyItems.length > 0) {
                gameState.historyItems.forEach(historyItem => {
                    const resultItem = resultItems.find(item => item.id === historyItem.resultId);
                    if (resultItem) {
                        // 素材オブジェクトを取得
                        const ingObjs = historyItem.ingredients.map(id => 
                            ingredients.find(ing => ing.id === id)
                        ).filter(ing => ing); // undefinedを除外
                        
                        // 履歴に追加
                        if (ingObjs.length > 0) {
                            addToHistory(resultItem, ingObjs, historyItem.exp);
                        }
                    }
                });
            }

            
            // 重要：UI更新を確実に行うため少し遅延させて実行
            setTimeout(() => {

                console.log("ロード後のUI更新を実行");
    
                // 確実に素材リストを更新
                if (typeof updateIngredientList === 'function') {
                    updateIngredientList();
                } else {
                    console.error("updateIngredientList関数が見つかりません");
                }

                // UI更新処理
                updateIngredientList();
                updateTimeDisplay();
                updateGoldDisplay();
                updateHintsList();
                displayAlchemyInfo();
                updateGoalProgress();
                
                // 選択中の素材をリセット
                selectedIngredients.length = 0;
                for (let i = 1; i <= maxSelections; i++) {
                    const slot = document.getElementById(`slot-${i}`);
                    if (slot) slot.innerHTML = '';
                }
                
                // クラフトボタンの状態も更新
                if (typeof updateCraftButton === 'function') {
                    updateCraftButton();
                }
                
                showMessage('ゲームデータを読み込みました！', 'success');
            }, 100);
            
            return true;
        } catch (error) {
            console.error('読み込みエラー:', error);
            return false;
        }
    }
}

// グローバルインスタンス
const saveManager = new SaveManager();