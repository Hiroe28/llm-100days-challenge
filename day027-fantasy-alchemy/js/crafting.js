// 調合関連の機能

// DOM elements
const ingredientList = document.getElementById('ingredient-list');
const craftButton = document.getElementById('craft-button');
const resultContainer = document.getElementById('result-container');
const historyList = document.getElementById('history-list');
const messageEl = document.getElementById('message');
const craftingAnimation = document.getElementById('crafting-animation');

// 素材を選択する関数
function selectIngredient(ingredient) {
    if (ingredient.stock <= 0) {
        showMessage(`${ingredient.name}の在庫がありません！`, 'error');
        return;
    }
    
    // Check if already selected
    const index = selectedIngredients.findIndex(i => i.id === ingredient.id);
    
    if (index > -1) {
        // Deselect
        selectedIngredients.splice(index, 1);
        document.querySelector(`.ingredient[data-id="${ingredient.id}"]`).classList.remove('selected');
        updateSelectedSlots();
    } else if (selectedIngredients.length < maxSelections) {
        // Select
        selectedIngredients.push(ingredient);
        document.querySelector(`.ingredient[data-id="${ingredient.id}"]`).classList.add('selected');
        updateSelectedSlots();
    } else {
        // Show error message
        showMessage('最大3つまでしか選択できません', 'error');
    }
    
    // Enable/disable craft button
    // craftButton.disabled = selectedIngredients.length !== maxSelections;
    updateCraftButton();
}

// 選択スロットを更新する関数
function updateSelectedSlots() {
    // Clear all slots
    for (let i = 1; i <= maxSelections; i++) {
        const slot = document.getElementById(`slot-${i}`);
        slot.innerHTML = '';
    }
    
    // Fill slots with selected ingredients
    selectedIngredients.forEach((ingredient, index) => {
        const slot = document.getElementById(`slot-${index + 1}`);
        slot.innerHTML = `<img src="${ingredient.image}" alt="${ingredient.name}" title="${ingredient.name}">`;
    });
}

// アイテムを調合する関数
function craftItem() {
    // 選択された材料からレシピを探し、必要時間を計算
    const selectedIds = selectedIngredients.map(ing => ing.id).sort((a, b) => a - b);
    let craftingTime = 1; // デフォルト値
    let gainedExp = 0;

    
    
    // レシピを検索して時間を決定
    for (let item of resultItems) {
        const recipeIds = [...item.requires].sort((a, b) => a - b);
        if (recipeIds.length === selectedIds.length && 
            recipeIds.every((id, index) => id === selectedIds[index])) {
            craftingTime = Math.max(1, Math.floor(item.difficulty / 2));
            break;
        }
    }
    
    // 時間チェック
    if (!isActivityAvailable(craftingTime)) {
        showTimeWarning('調合', craftingTime);
        return; // 調合せずに終了
    }
    
    // 材料の在庫をチェック
    for (let ingredient of selectedIngredients) {
        if (ingredient.stock <= 0) {
            showMessage(`${ingredient.name}の在庫がありません！`, 'error');
            return;
        }
    }
    
    // 材料の在庫を減らす
    selectedIngredients.forEach(ingredient => {
        // 在庫を更新
        const index = ingredients.findIndex(i => i.id === ingredient.id);
        ingredients[index].stock -= 1;
    });
    
    // 素材リストを更新
    updateIngredientList();
 
    // レシピに一致する結果アイテムを探す
    let result = null;
    for (let item of resultItems) {
        // レシピの材料IDをコピーして並べ替え
        const recipeIds = [...item.requires].sort((a, b) => a - b);
        
        // 長さが同じで、すべての要素が一致するか確認
        if (recipeIds.length === selectedIds.length && 
            recipeIds.every((id, index) => id === selectedIds[index])) {
            result = item;
            
            // 難易度に応じて調合時間を設定
            craftingTime = Math.max(1, Math.floor(item.difficulty / 2));
            break;
        }
    }
    
    // 時間を進める
    advanceTime(craftingTime);

    // 調合開始サウンド再生
    if (typeof playCraftStartSound === 'function') {
        playCraftStartSound();
    }

    // Play animation
    craftingAnimation.classList.add('active');
    
    // 粒子エフェクトを追加
    addMagicParticles();
    
    // Delay to show animation（時間を1.2秒に短縮）
    setTimeout(() => {
        // 閃光エフェクト
        const flash = document.createElement('div');
        flash.className = 'flash';
        document.querySelector('.cauldron').appendChild(flash);
        
        // 0.3秒後にアニメーション終了
        setTimeout(() => {
            // Hide animation
            craftingAnimation.classList.remove('active');
            
            // 一致するレシピがない場合
            if (!result) {
                // レシピがない場合（オリジナルの組み合わせ）
                result = {
                    id: 0,
                    name: "謎の物質",
                    image: "images/results/unknown_substance.png",
                    description: "何かの間違いで生まれた謎の物質。特に役に立ちそうにありません...",
                    value: 10
                };
                
                // 新しい組み合わせにも少し経験値
                gainedExp = 10;
                gainExp(gainedExp);
            } else {
                // 成功率を計算
                const successRate = calculateSuccessRate(result.difficulty);
                
                // 成功判定
                const isSuccess = Math.random() * 100 <= successRate;
                
                if (isSuccess) {

                    // 成功時の処理...
                    playCraftSound(true); // 成功音を再生


                    // レシピを発見済みとしてマーク
                    if (!result.discovered) {
                        result.discovered = true;
                        
                        // 通常のメッセージは一旦抑制（ポップアップに統合）
                        // showMessage(`新しいレシピ「${result.name}」を発見しました！`, 'success');
                        
                        // レシピ発見ポップアップを表示
                        const recipePopup = document.createElement('div');
                        recipePopup.className = 'recipe-discovery-popup';
                        recipePopup.innerHTML = `
                            <div class="recipe-discovery-content">
                                <h3>新しいレシピを発見！</h3>
                                <img src="${result.image}" alt="${result.name}">
                                <p>${result.name}を始めて作成しました！</p>
                                <div id="recipe-share-container"></div>
                                <button class="close-button">閉じる</button>
                            </div>
                        `;
                        
                        document.body.appendChild(recipePopup);
                        
                        // // シェアボタンを追加
                        // addShareButtons(
                        //     document.getElementById('recipe-share-container'), 
                        //     `ファンタジー錬金術工房で「${result.name}」のレシピを発見しました！`
                        // );
                        
                        // 閉じるボタンのイベントリスナー
                        recipePopup.querySelector('.close-button').addEventListener('click', () => {
                            document.body.removeChild(recipePopup);
                            
                            // ポップアップを閉じた後に簡易メッセージを表示
                            showMessage(`新しいレシピ「${result.name}」を発見しました！`, 'success');
                        });
                        
                        // ヒントリストを更新（発見したレシピのヒントを非表示にする）
                        if (typeof updateHintsList === 'function') {
                            updateHintsList();
                        }
                        
                        // 目標達成チェック（賢者の石を作った場合）
                        if (result.isGoal) {
                            gameOver(true);
                        }
                    }
                    
                    // 経験値獲得（難易度に応じて）
                    gainedExp = result.difficulty * 15;
                    gainExp(gainedExp);
                } else {

                    // 失敗時の処理...
                    playCraftSound(false); // 失敗音を再生

                    // 失敗時は「謎の物質」を生成
                    result = {
                        id: 0,
                        name: "謎の物質",
                        image: "images/results/unknown_substance.png",
                        description: "調合に失敗してしまいました。素材が無駄になりましたが、少しだけ経験を得ました。",
                        value: 5
                    };
                    
                    // 失敗時も少し経験値を獲得

                    gainedExp = 5;
                    gainExp(gainedExp);
                    
                    showMessage('調合に失敗しました...', 'error');
                }
            }
            
            // プレイヤーのインベントリに追加
            if (inventory[result.id]) {
                inventory[result.id].quantity += 1;
            } else {
                inventory[result.id] = {
                    ...result,
                    quantity: 1
                };
            }
            
            const sellValue = result.value;
            // playerGold += sellValue;
            updateGoldDisplay();
            
            // // メッセージ表示
            // showMessage(`${result.name}を${sellValue}Gで自動売却しました！`, 'success')
            showCraftingResult(result, gainedExp);
            
            // Add to history
            addToHistory(result, selectedIngredients, gainedExp);
            
            // 調合にかかった時間を表示
            showMessage(`調合に${craftingTime}時間かかりました`, 'info');
            
            // Reset selected ingredients
            selectedIngredients.forEach(ingredient => {
                const el = document.querySelector(`.ingredient[data-id="${ingredient.id}"]`);
                if (el) el.classList.remove('selected');
            });
            selectedIngredients = [];
            updateSelectedSlots();
            craftButton.disabled = true;
            
            // Update goal progress
            updateGoalProgress();
            
            // 調合後に場所のアンロック条件をチェック
            if (typeof checkPlaceUnlocks === 'function') {
                checkPlaceUnlocks();
            }

        }, 300);
    }, 900);
}


// 粒子エフェクトを追加する関数
// 粒子エフェクトを追加する関数（改良版）
function addMagicParticles() {
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'magic-particles';
    
    // 既存のparticlesContainerを削除
    const oldContainer = document.querySelector('.magic-particles');
    if (oldContainer) {
        oldContainer.remove();
    }
    
    const cauldron = document.querySelector('.cauldron');
    cauldron.appendChild(particlesContainer);
    
    // 30個の粒子を作成（数を増やす）
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // ランダムな位置、色、サイズ
            const randomX = Math.random() * 100;
            const randomDelay = Math.random() * 0.7;
            const randomSize = 5 + Math.random() * 10;
            const randomDuration = 0.8 + Math.random() * 1.2;
            
            // カラーパレットを拡大
            const colors = [
                '#f0c5e8', '#b5e6e6', '#f9d7ad', '#a4e1a0', 
                '#ffd700', '#ff69b4', '#87cefa', '#da70d6'
            ];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            
            // ランダムなアニメーション
            const animations = ['floatUp', 'floatSpiral'];
            const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
            
            // スタイル設定
            particle.style.left = `${randomX}%`;
            particle.style.top = '70%';
            particle.style.backgroundColor = randomColor;
            particle.style.width = `${randomSize}px`;
            particle.style.height = `${randomSize}px`;
            particle.style.animationDelay = `${randomDelay}s`;
            particle.style.animationDuration = `${randomDuration}s`;
            particle.style.animationName = randomAnimation;
            particle.style.animationFillMode = 'forwards';
            
            particlesContainer.appendChild(particle);
            
            // アニメーション終了後にパーティクルを削除
            setTimeout(() => {
                if (particle.parentNode === particlesContainer) {
                    particlesContainer.removeChild(particle);
                }
            }, (randomDuration + randomDelay) * 1000);
        }, i * 30); // より速く続けて生成
    }
    
    // 波紋エフェクトも追加
    setTimeout(() => {
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        cauldron.appendChild(ripple);
        
        // 2つ目の波紋
        setTimeout(() => {
            const ripple2 = document.createElement('div');
            ripple2.className = 'ripple';
            ripple2.style.animationDuration = '1.2s';
            cauldron.appendChild(ripple2);
        }, 300);
    }, 200);
}

// 成功率を計算する関数
function calculateSuccessRate(difficulty) {
    // 基本成功率（難易度1なら100%、難易度が上がるほど下がる）
    let baseRate = 120 - (difficulty * 15);
    
    // レベルボーナス（レベルごとに +5%）
    let levelBonus = (alchemyLevel - 1) * 5;
    
    // 最終成功率
    let successRate = Math.min(98, Math.max(20, baseRate + levelBonus));
    
    return successRate;
}


// アイテムを売却する関数
function sellItem(itemId) {
    const item = inventory[itemId];
    if (item && item.quantity > 0) {
        // 在庫を減らす
        item.quantity -= 1;
        
        // ゴールドを増やす
        playerGold += item.value;
        
        // メッセージを表示
        showMessage(`${item.name}を${item.value}Gで売却しました！`, 'success');
        
        // ゴールド表示を更新
        updateGoldDisplay();
        
        // 結果表示を更新
        if (item.quantity <= 0) {
            delete inventory[itemId];
            resultContainer.innerHTML = `<p>アイテムを作成するには、素材を3つ選んで調合ボタンを押してください。</p>`;
        } else {
            const quantityText = item.quantity > 0 ? `(残り${item.quantity}個)` : '';
            document.querySelector('.sell-button').textContent = `売却する ${quantityText}`;
        }
        
        // 目標進捗を更新
        updateGoalProgress();
    }
}

// 履歴に追加する関数
function addToHistory(result, ingredients, expGained = 0) {
    // 謎の物質は追加しない
    if (result.id === 0) {
        return;
    }
    
    // 既に履歴にある場合は追加しない
    const existingItem = document.querySelector(`.history-item[data-id="${result.id}"]`);
    if (existingItem) {
        return;
    }
    
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.dataset.id = result.id;
    
    // 材料IDを保存（再調合用）
    const ingredientIds = ingredients.map(i => i.id);
    historyItem.dataset.ingredients = ingredientIds.join(',');
    historyItem.dataset.exp = expGained;  // 経験値も保存
    
    const ingredientsText = ingredients.map(i => i.name).join(' + ');
    
    historyItem.innerHTML = `
        <img src="${result.image}" alt="${result.name}" class="history-image">
        <div>
            <strong>${result.name}</strong><br>
            <small>${ingredientsText}</small><br>
            <small>売値: ${result.value} G</small>
            ${expGained > 0 ? `<small class="history-exp">経験値: +${expGained}</small>` : ''}
        </div>
    `;
    
    // クリックイベント（素材の自動選択）
    historyItem.addEventListener('click', () => {
        // 現在選択中の素材をクリア
        selectedIngredients.forEach(ing => {
            const el = document.querySelector(`.ingredient[data-id="${ing.id}"]`);
            if (el) el.classList.remove('selected');
        });
        selectedIngredients = [];
        
        // レシピの素材を自動選択
        const recipeIngredientIds = ingredientIds;
        recipeIngredientIds.forEach(id => {
            const ingredient = ingredients.find(i => i.id === id);
            if (ingredient && ingredient.stock > 0) {
                selectIngredient(ingredient);
            } else if (ingredient) {
                showMessage(`${ingredient.name}の在庫がありません！`, 'error');
            }
        });
    });
    
    historyList.prepend(historyItem);
}
// crafting.js の updateIngredientList 関数を改善
// crafting.js の updateIngredientList 関数を改善
function updateIngredientList() {
    console.log("素材リスト更新 - 現在の素材数:", ingredients.length);
    
    // 素材リストをクリア
    const ingredientList = document.getElementById('ingredient-list');
    if (!ingredientList) {
        console.error("素材リスト要素が見つかりません");
        return;
    }
    
    ingredientList.innerHTML = '';
    
    // 素材リストを再構築
    ingredients.forEach(ingredient => {
        console.log(`素材追加: ${ingredient.name}, 在庫: ${ingredient.stock}`);
        
        const ingredientEl = document.createElement('div');
        ingredientEl.className = 'ingredient';
        if (ingredient.stock <= 0) {
            ingredientEl.classList.add('out-of-stock');
        }
        ingredientEl.dataset.id = ingredient.id;
        ingredientEl.dataset.property = ingredient.property;
        ingredientEl.innerHTML = `
            <img src="${ingredient.image}" alt="${ingredient.name}">
            <div class="ingredient-name">${ingredient.name}</div>
            <div class="ingredient-stock">在庫: ${ingredient.stock}</div>
        `;
        ingredientEl.addEventListener('click', () => {
            if (ingredient.stock > 0) {
                selectIngredient(ingredient);
            } else {
                showMessage(`${ingredient.name}の在庫がありません！`, 'error');
            }
        });
        ingredientList.appendChild(ingredientEl);
    });
    
    // 選択状態の更新
    selectedIngredients.forEach(ing => {
        const el = document.querySelector(`.ingredient[data-id="${ing.id}"]`);
        if (el) el.classList.add('selected');
    });
    
    // クラフトボタンの状態更新
    if (typeof updateCraftButton === 'function') {
        updateCraftButton();
    }
}

// 調合アニメーションの初期化関数も修正
function initCraftingAnimation() {
    const cauldron = document.querySelector('.cauldron');
    // sparkleの数を減らす
    for (let i = 0; i < 10; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.left = `${Math.random() * 150}px`;
        sparkle.style.top = `${Math.random() * 150}px`;
        sparkle.style.animationDelay = `${Math.random() * 1}s`;
        cauldron.appendChild(sparkle);
    }
}

// 調合機能の初期化
function initCrafting() {
    // Add event listener to craft button
    craftButton.addEventListener('click', craftItem);
    
    // 調合アニメーションの初期化
    initCraftingAnimation();
}


// 調合ボタンの有効/無効を切り替える関数を追加
function updateCraftButton() {
    // 何も選択されていない場合は無効
    if (selectedIngredients.length === 0) {
        craftButton.disabled = true;
        return;
    }
    
    // 選択された素材IDを取得して並べ替え
    const selectedIds = selectedIngredients.map(ing => ing.id).sort((a, b) => a - b);
    
    // レシピに一致するかチェック
    let canCraft = false;
    for (let item of resultItems) {
        // レシピの材料IDをコピーして並べ替え
        const recipeIds = [...item.requires].sort((a, b) => a - b);
        
        // 長さが同じで、すべての要素が一致するか確認
        if (recipeIds.length === selectedIds.length && 
            recipeIds.every((id, index) => id === selectedIds[index])) {
            canCraft = true;
            break;
        }
    }
    
    // レシピが見つからなくても、最低2つ以上の素材があれば調合可能
    if (!canCraft && selectedIds.length >= 2) {
        canCraft = true;
    }

    if (canCraft) {

        let successRateText = "??%";
        // レシピがある場合、その難易度に応じた時間を表示
        let timeRequired = 1; // デフォルト
        
        // 選択された素材IDでレシピを検索
        for (let item of resultItems) {
            const recipeIds = [...item.requires].sort((a, b) => a - b);
            
            if (recipeIds.length === selectedIds.length && 
                recipeIds.every((id, index) => id === selectedIds[index])) {
                
                // 発見済みならば成功率を表示
                if (item.discovered) {
                    const successRate = calculateSuccessRate(item.difficulty);
                    successRateText = `成功${successRate}%`;
                }
                
                timeRequired = Math.max(1, Math.floor(item.difficulty / 2));
                break;
            }
        }
        
        // 調合ボタンのテキストを更新
        craftButton.textContent = `調合する (${timeRequired}時間 ${successRateText})`;
    } else {
        craftButton.textContent = '調合する';
    }
    

    
    craftButton.disabled = !canCraft;
}

function showCraftingResult(result, gainedExp) {
    // 調合結果オーバーレイを作成
    const resultOverlay = document.createElement('div');
    resultOverlay.className = 'crafting-result-overlay';
    resultOverlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7); display: flex; justify-content: center; align-items: center; z-index: 999;';
    
    const resultContent = document.createElement('div');
    resultContent.className = 'crafting-result-content';
    resultContent.style.cssText = 'background-color: white; border-radius: 15px; padding: 20px; width: 80%; max-width: 500px; text-align: center; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);';
    
    // 自動売却処理
    const sellValue = result.value;
    playerGold += sellValue;
    updateGoldDisplay();
    
    // 結果内容を設定
    resultContent.innerHTML = `
        <h3>調合結果</h3>
        <img src="${result.image}" alt="${result.name}" style="width: 120px; height: 120px; border-radius: 50%; margin-bottom: 15px; border: 3px solid var(--primary-color);">
        <div style="font-size: 1.3rem; font-weight: bold; margin-bottom: 10px;">${result.name}</div>
        <div style="font-style: italic; margin-bottom: 15px;">${result.description}</div>
        <div style="font-weight: bold; color: #c27c0e; margin-bottom: 10px;">価値: ${result.value} G (売却済み)</div>
        <div style="font-weight: bold; color: #8e44ad; margin-bottom: 15px;">獲得経験値: +${gainedExp}</div>
        <button class="close-button" id="close-result">閉じる</button>
    `;
    
    resultOverlay.appendChild(resultContent);
    document.body.appendChild(resultOverlay);
    
    // 閉じるボタンのイベントリスナー
    document.getElementById('close-result').addEventListener('click', () => {
        document.body.removeChild(resultOverlay);
    });
    
    // メッセージ表示
    showMessage(`${result.name}を${sellValue}Gで自動売却しました！`, 'success');
}