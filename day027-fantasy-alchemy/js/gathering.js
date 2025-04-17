// 採取関連の機能

// DOM elements
const gatheringButton = document.getElementById('gathering-button');
const gatheringResult = document.getElementById('gathering-result');

// 採取場所を開く関数
function openGathering() {
    // 最短の採取時間をチェック（最も短い採取場所の時間）
    const shortestGatheringTime = Math.min(...gatheringPlaces.filter(p => p.unlocked).map(p => p.timeRequired));
    
    // 活動可能時間チェック
    if (!isActivityAvailable(shortestGatheringTime)) {
        showMessage(`今日の活動時間はあと${dayEndTime - currentTime}時間です。採取する時間が足りません。先に就寝してください。`, 'warning');
        return; // 採取画面を開かずに終了
    }
    
    // 採取場所UIを表示するための要素を作成
    const gatheringOverlay = document.createElement('div');
    gatheringOverlay.className = 'gathering-overlay';

    const gatheringContent = document.createElement('div');
    gatheringContent.className = 'gathering-content';

    let placesHTML = '';
    gatheringPlaces.forEach(place => {
        let placeClass = 'gathering-place';
        let placeContent = '';
        
        // その場所で入手できるアイテムの名前とアイコンを取得
        let itemsHTML = '';
        if (place.items) {
            place.items.forEach(itemId => {
                const item = ingredients.find(i => i.id === itemId);
                if (item) {
                    itemsHTML += `
                        <div class="place-item-icon" title="${item.name}">
                            <img src="${item.image}" alt="${item.name}">
                        </div>
                    `;
                }
            });
        }
        
        if (place.unlocked) {
            // 活動可能時間チェック
            const gatheringTime = place.timeRequired;
            const canGather = isActivityAvailable(gatheringTime);
            
            // 解放済みの場所
            placeContent = `
                <img src="${place.image}" alt="${place.name}" class="gathering-place-image">
                <div class="gathering-place-name">${place.name}</div>
                <div class="gathering-place-items">${itemsHTML}</div>
                <div class="time-required">所要時間: ${gatheringTime}時間</div>
            `;
            
            if (canGather) {
                placeClass += '" data-id="' + place.id;
            } else {
                placeClass += ' time-unavailable" title="今日はこの場所に行く時間が足りません"';
            }
        } else {
            // 未解放の場所
            placeClass += ' locked';
            placeContent = `
                <div class="locked-overlay">
                    <i class="fas fa-lock"></i>
                </div>
                <div class="gathering-place-name">${place.name}</div>
                <div class="unlock-condition">${getUnlockText(place)}</div>
            `;
        }
        
        placesHTML += `<div class="${placeClass}">${placeContent}</div>`;
    });
    
    gatheringContent.innerHTML = `
        <h2>採取場所</h2>
        <div class="shop-description">素材を採取できる場所を選んでください。採取には時間がかかります。</div>
        <div class="gathering-places">
            ${placesHTML}
        </div>
        <button class="close-button" id="close-gathering">閉じる</button>
    `;
    
    gatheringOverlay.appendChild(gatheringContent);
    document.body.appendChild(gatheringOverlay);
    
    // 閉じるボタンのイベントリスナー
    document.getElementById('close-gathering').addEventListener('click', () => {
        document.body.removeChild(gatheringOverlay);
    });
    
    // 各採取場所のイベントリスナー
    const placeElements = document.querySelectorAll('.gathering-place:not(.locked):not(.time-unavailable)');
    placeElements.forEach(placeEl => {
        placeEl.addEventListener('click', () => {
            const placeId = parseInt(placeEl.dataset.id);
            const place = gatheringPlaces.find(p => p.id === placeId);
            
            // 時間チェック（念のため再確認）
            const gatheringTime = place.timeRequired;
            if (!isActivityAvailable(gatheringTime)) {
                showTimeWarning('採取', gatheringTime);
                return;
            }
            
            // 採取処理を実行
            gatherItems(place);
            
            // 採取場所UIを閉じる
            document.body.removeChild(gatheringOverlay);
        });
    });

    // 時間不足の場所にも警告用のイベントリスナーを追加
    const unavailablePlaces = document.querySelectorAll('.gathering-place.time-unavailable');
    unavailablePlaces.forEach(placeEl => {
        placeEl.addEventListener('click', () => {
            const placeId = parseInt(placeEl.getAttribute('data-id'));
            if (placeId) {
                const place = gatheringPlaces.find(p => p.id === placeId);
                if (place) {
                    showTimeWarning('採取', place.timeRequired);
                }
            }
        });
    });
}

// アンロック条件のテキストを取得
function getUnlockText(place) {
    const condition = place.unlockCondition;
    let text = '';
    
    switch(condition.type) {
        case 'item':
            const item = resultItems.find(i => i.id === condition.itemId);
            text = `「${item.name}」を${condition.count}個作成する`;
            break;
        case 'level':
            text = `錬金術レベル${condition.level}に到達する`;
            break;
        case 'gathering':
            const gatherPlace = gatheringPlaces.find(p => p.id === condition.placeId);
            text = `「${gatherPlace.name}」で${condition.count}回採取する`;
            break;
    }
    
    return text;
}

// アイテムを採取する関数
function gatherItems(place) {
    const gatheringTime = place.timeRequired;
    
    // 時間チェック
    if (!isActivityAvailable(gatheringTime)) {
        showTimeWarning('採取', gatheringTime);
        return; // 採取せずに終了
    }
    // 採取回数を記録
    gatheringCount[place.id]++;
    

    advanceTime(gatheringTime);
    
    // ランダムに2〜4種類の素材
    // const numItems = Math.floor(Math.random() * 3) + 1;
    const numItems = Math.floor(Math.random() * 3) + 2;

    let gatheredItems = [];
    
    for (let i = 0; i < numItems; i++) {
        // 場所から利用可能なアイテムをランダムに選択
        const availableItems = place.items;
        const randomItemId = availableItems[Math.floor(Math.random() * availableItems.length)];
        
        // 対応する素材を取得
        const ingredient = ingredients.find(item => item.id === randomItemId);
        
        if (ingredient) {
            // 在庫を増やす
            const index = ingredients.findIndex(item => item.id === randomItemId);
            ingredients[index].stock += 1;
            
            // 採取結果に追加
            gatheredItems.push(ingredient);
        }
    }
    
    // レア素材が見つかる確率（錬金術レベルとともに上昇）
    const rareChance = 5 + (alchemyLevel * 3);
    
    // レアレシピが見つかる確率
    // const recipeChance = 2 + Math.floor(alchemyLevel / 2);
    const recipeChance = 10 + Math.floor(alchemyLevel * 3);
    
    // レア素材をチェック
    if (Math.random() * 100 <= rareChance) {
        // 場所に応じたレア素材
        let rareItemId = null;
        
        switch(place.id) {
            case 5: // 竜の巣
                rareItemId = 10; // 竜の鱗
                break;
            case 6: // 精霊の泉
                rareItemId = 11; // 精霊の涙
                break;
            case 7: // 黄金の砂浜
                rareItemId = 12; // 黄金の砂
                break;
        }
        
        if (rareItemId) {
            const rareItem = ingredients.find(i => i.id === rareItemId);
            
            // 在庫を増やす
            const index = ingredients.findIndex(i => i.id === rareItemId);
            ingredients[index].stock += 1;
            
            // 採取結果に追加
            gatheredItems.push(rareItem);
            
            showMessage(`レア素材「${rareItem.name}」を発見しました！`, 'success');
        }
    }

    // レシピヒントをチェック
    if (Math.random() * 100 <= recipeChance) {
        // 利用可能なレシピリストを取得
        // 条件: 1. 発見済みでない 2. ヒント未発見 3. ショップで購入できないレシピ
        const availableRecipes = resultItems.filter(r => 
            !r.discovered && 
            !r.hintDiscovered && 
            !recipeShopItems.some(item => item.recipeId === r.id) // ショップで売られていないレシピのみ
        );
        
        if (availableRecipes.length > 0) {
            // ランダムにレシピを選択（賢者の石は低確率）
            let recipePool = availableRecipes;
            const philosophersStone = availableRecipes.find(r => r.isGoal);
            
            if (philosophersStone) {
                // 賢者の石が選択肢にある場合、10%の確率でのみ選択される
                if (Math.random() < 0.1) {
                    recipePool = [philosophersStone];
                } else {
                    recipePool = availableRecipes.filter(r => !r.isGoal);
                }
            }
            
            // 選択肢がある場合はランダム選択
            if (recipePool.length > 0) {
                const recipe = recipePool[Math.floor(Math.random() * recipePool.length)];
                recipe.hintDiscovered = true;
                
                let recipeHint = '';
                const totalIngredients = recipe.requires.length;
                
                // 表示する素材数を決定（最大2つ、または全部-1）
                const displayCount = Math.min(2, totalIngredients - (totalIngredients > 2 ? 1 : 0));
                
                // ランダムに素材を選択
                const selectedIndices = [];
                while (selectedIndices.length < displayCount) {
                    const idx = Math.floor(Math.random() * totalIngredients);
                    if (!selectedIndices.includes(idx)) {
                        selectedIndices.push(idx);
                    }
                }
                
                // ヒントテキストを作成
                const materialNames = selectedIndices.map(idx => {
                    const matId = recipe.requires[idx];
                    return ingredients.find(i => i.id === matId).name;
                });
                
                if (totalIngredients > displayCount) {
                    // 「あともう X つ」の部分を追加
                    const remaining = totalIngredients - displayCount;
                    recipeHint = `「${recipe.name}」を作るには「${materialNames.join('」と「')}」とあと${remaining}つの素材が必要らしい...`;
                } else {
                    recipeHint = `「${recipe.name}」を作るには「${materialNames.join('」と「')}」が必要らしい...`;
                }
                
                // ヒントを追加
                recipeHints.push({
                    recipeName: recipe.name,
                    hintText: recipeHint,
                    discovered: new Date().toLocaleString()
                });
                
                updateHintsList();
                showMessage(`レシピのヒントを発見: ${recipeHint}`, 'success');
            }
        }
    }
    
    // 素材リストを更新
    updateIngredientList();
    
    // 採取結果を表示
    showGatheringResult(gatheredItems, place);
    playGatherSound(); // 採取音を再生
    
    // 採取後に場所のアンロック条件をチェック
    checkPlaceUnlocks();
    
    // 経験値を獲得
    gainExp(place.timeRequired * 5);
}

// 採取場所のアンロックをチェックする関数
function checkPlaceUnlocks() {
    gatheringPlaces.forEach(place => {
        if (!place.unlocked && place.unlockCondition) {
            const condition = place.unlockCondition;
            let unlocked = false;
            
            switch(condition.type) {
                case 'item':
                    // アイテム作成条件
                    const item = resultItems.find(i => i.id === condition.itemId);
                    if (item && item.discovered && 
                        inventory[item.id] && inventory[item.id].quantity >= condition.count) {
                        unlocked = true;
                    }
                    break;
                case 'level':
                    // レベル条件
                    if (alchemyLevel >= condition.level) {
                        unlocked = true;
                    }
                    break;
                case 'gathering':
                    // 採取回数条件
                    if (gatheringCount[condition.placeId] >= condition.count) {
                        unlocked = true;
                    }
                    break;
            }
            
            if (unlocked) {
                place.unlocked = true;

                // アンロック音を再生
                if (typeof playUnlockSound === 'function') {
                    playUnlockSound();
                }

                showMessage(`新しい採取場所「${place.name}」が解放されました！`, 'success');
            }
        }
    });
}

// 採取結果を表示する関数
function showGatheringResult(items, place) {
    const gatheringItemsEl = document.getElementById('gathering-items');
    gatheringItemsEl.innerHTML = '';
    
    items.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'gathering-item';
        itemEl.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div>${item.name}</div>
        `;
        gatheringItemsEl.appendChild(itemEl);
    });
    
    // 結果を表示
    gatheringResult.classList.add('active');
}

// 採取機能の初期化
function initGathering() {
    // Add event listener to gathering button
    gatheringButton.addEventListener('click', openGathering);
    
    // 結果画面の閉じるボタンのイベントリスナー
    document.getElementById('close-gathering-result').addEventListener('click', () => {
        gatheringResult.classList.remove('active');
    });
}