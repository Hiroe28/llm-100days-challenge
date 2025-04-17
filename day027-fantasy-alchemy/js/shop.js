// ショップ関連の機能

// DOM elements
const shopButton = document.getElementById('shop-button');
const recipeButton = document.getElementById('recipe-button');

// ショップを開く関数
function openShop() {
    // ショップUIを表示するための要素を作成
    const shopOverlay = document.createElement('div');
    shopOverlay.className = 'shop-overlay';
    
    const shopContent = document.createElement('div');
    shopContent.className = 'shop-content';
    
    shopContent.innerHTML = `
        <h2>ショップ</h2>
        <div class="shop-tabs">
            <div class="shop-tab active" id="materials-tab">素材</div>
            <div class="shop-tab" id="recipes-tab">レシピ書</div>
        </div>
        <div id="shop-content-container">
            <div id="materials-content">
                <div class="shop-description">素材を購入して調合に使用できます。</div>
                <div class="shop-items" id="materials-items"></div>
            </div>
            <div id="recipes-content" style="display: none;">
                <div class="shop-description">レシピ書を購入すると、未発見のレシピを確認できます。</div>
                <div class="shop-items" id="recipes-items"></div>
            </div>
        </div>
        <button class="close-button" id="close-shop">閉じる</button>
    `;
    
    shopOverlay.appendChild(shopContent);
    document.body.appendChild(shopOverlay);
    
    // 素材タブのコンテンツを表示
    const materialsItems = document.getElementById('materials-items');
    ingredients.forEach(ingredient => {
        // 対応する在庫データを取得
        const stockData = shopStock.materials.find(s => s.id === ingredient.id);
        const inStock = stockData.currentStock > 0;
        
        const shopItem = document.createElement('div');
        shopItem.className = 'shop-item';
        if (!inStock) {
            shopItem.classList.add('out-of-stock');
        }
        
        shopItem.innerHTML = `
            <img src="${ingredient.image}" alt="${ingredient.name}" class="shop-item-image">
            <div class="shop-item-info">
                <div class="shop-item-name">${ingredient.name}</div>
                <div class="shop-item-price">${ingredient.price} G</div>
                <div class="shop-item-stock">ショップ在庫: ${stockData.currentStock}/${stockData.maxStock}</div>
                <div class="shop-item-stock">あなたの在庫: ${ingredient.stock}</div>
            </div>
            <button class="buy-button" data-id="${ingredient.id}" data-type="material" ${!inStock ? 'disabled' : ''}>購入</button>
        `;
        materialsItems.appendChild(shopItem);
    });
    

    // レシピ書タブのコンテンツを表示部分を修正
    const recipesItems = document.getElementById('recipes-items');
    recipesItems.innerHTML = ''; // 一度クリア

    recipeShopItems.forEach(item => {
        // 購入済みのものは表示しない
        if (item.purchased) return;
        
        // レシピも発見済みのものは表示しない
        const recipe = resultItems.find(r => r.id === item.recipeId);
        if (recipe.discovered) return;
        
        // 在庫データを取得
        const stockData = shopStock.recipes.find(s => s.id === item.id);
        // 在庫がない場合も表示しない
        if (!stockData || stockData.stock <= 0) return;
        
        // ここから表示処理
        const shopItem = document.createElement('div');
        shopItem.className = 'shop-item';
        shopItem.innerHTML = `
            <img src="images/items/recipe_book.png" alt="レシピ書" class="shop-item-image">
            <div class="shop-item-info">
                <div class="shop-item-name">「${recipe.name}」のレシピ書</div>
                <div class="shop-item-price">${item.price} G</div>
            </div>
            <button class="buy-button" data-id="${item.id}" data-type="recipe">購入</button>
        `;
        recipesItems.appendChild(shopItem);
    });
    
    // タブ切り替えのイベントリスナー
    document.getElementById('materials-tab').addEventListener('click', () => {
        document.getElementById('materials-tab').classList.add('active');
        document.getElementById('recipes-tab').classList.remove('active');
        document.getElementById('materials-content').style.display = 'block';
        document.getElementById('recipes-content').style.display = 'none';
    });
    
    document.getElementById('recipes-tab').addEventListener('click', () => {
        document.getElementById('recipes-tab').classList.add('active');
        document.getElementById('materials-tab').classList.remove('active');
        document.getElementById('materials-content').style.display = 'none';
        document.getElementById('recipes-content').style.display = 'block';
    });
    
    // 閉じるボタンのイベントリスナー
    document.getElementById('close-shop').addEventListener('click', () => {
        document.body.removeChild(shopOverlay);
    });
    
    // 素材の購入処理を修正
    const buyButtons = document.querySelectorAll('.buy-button');
    buyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const itemId = parseInt(button.dataset.id);
            const itemType = button.dataset.type;
            
            if (itemType === 'material') {
                // 素材の購入処理
                const ingredient = ingredients.find(i => i.id === itemId);
                
                // 在庫データを取得
                const stockData = shopStock.materials.find(s => s.id === itemId);
                
                // 在庫チェック
                if (stockData.currentStock <= 0) {
                    showMessage('ショップの在庫がありません！', 'error');
                    return;
                }
                
                if (playerGold >= ingredient.price) {
                    // ゴールドを減らす
                    playerGold -= ingredient.price;
                    
                    // プレイヤーの在庫を増やす
                    const index = ingredients.findIndex(i => i.id === itemId);
                    ingredients[index].stock += 1;
                    
                    // ショップの在庫を減らす
                    stockData.currentStock -= 1;
                    
                    // 表示を更新
                    const stockEl = button.parentElement.querySelector('.shop-item-stock');
                    stockEl.textContent = `ショップ在庫: ${stockData.currentStock}/${stockData.maxStock}`;
                    
                    // あなたの在庫表示も更新
                    const playerStockEl = button.parentElement.querySelector('.player-stock');
                    if (playerStockEl) {
                        playerStockEl.textContent = `あなたの在庫: ${ingredients[index].stock}`;
                    }
                    
                    // 在庫切れなら購入ボタンを無効化
                    if (stockData.currentStock <= 0) {
                        button.disabled = true;
                        button.parentElement.classList.add('out-of-stock');
                    }
                    
                    // サウンド再生（実装したら）
                    if (typeof playPurchaseSound === 'function') {
                        playPurchaseSound();
                    }
                    
                    // ゴールド表示を更新
                    updateGoldDisplay();
                    
                    // メッセージを表示
                    showMessage(`${ingredient.name}を購入しました！`, 'success');
                    
                    // メインUI側の在庫表示も更新
                    updateIngredientList();
                } else {
                    showMessage('ゴールドが足りません！', 'error');
                }
            } else if (itemType === 'recipe') {
                // レシピ書の購入処理
                const recipeItem = recipeShopItems.find(i => i.id === itemId);
                
                // 在庫データを取得
                const stockData = shopStock.recipes.find(s => s.id === itemId);
                
                // 在庫チェック
                if (!stockData || stockData.stock <= 0) {
                    showMessage('このレシピ書は売り切れです！', 'error');
                    return;
                }
                
                if (playerGold >= recipeItem.price) {
                    // ゴールドを減らす
                    playerGold -= recipeItem.price;
                    
                    // レシピを購入済みにする
                    const index = recipeShopItems.findIndex(i => i.id === itemId);
                    recipeShopItems[index].purchased = true;
                    
                    // 在庫を減らす
                    stockData.stock = 0;

                    // レシピを知っている状態に設定
                    const recipe = resultItems.find(r => r.id === recipeItem.recipeId);
                    if (recipe) {
                        recipe.known = true;
                    }

                    // ボタンを削除または無効化
                    button.disabled = true;
                    button.parentElement.classList.add('out-of-stock');

                    // レシピの親要素（shop-item）を完全に削除（この行を変更）
                    const shopItemElement = button.closest('.shop-item');
                    if (shopItemElement) {
                        shopItemElement.remove();
                    }

                    
                    // サウンド再生
                    if (typeof playPurchaseSound === 'function') {
                        playPurchaseSound();
                    }
                    
                    // ゴールド表示を更新
                    updateGoldDisplay();
                    
                    // メッセージを表示
                    showMessage(`「${recipe.name}」のレシピ書を購入しました！`, 'success');

                    const remainingItems = document.querySelectorAll('#recipes-items .shop-item');
                    if (remainingItems.length === 0) {
                        document.getElementById('recipes-items').innerHTML = 
                            '<div class="no-items">現在、購入可能なレシピはありません。</div>';
                    }

                } else {
                    showMessage('ゴールドが足りません！', 'error');
                }
            }
        });
    });
}

// レシピブックを開く関数
function openRecipeBook() {
    // レシピブックUIを表示するための要素を作成
    const recipeOverlay = document.createElement('div');
    recipeOverlay.className = 'recipe-overlay';
    
    const recipeContent = document.createElement('div');
    recipeContent.className = 'recipe-content';
    
    // 購入したレシピと発見したレシピを表示
    let recipeListHTML = '';
    
    resultItems.forEach(recipe => {
        // レシピが発見されているか、レシピ書が購入されているかチェック
        const isDiscovered = recipe.discovered;
        const isKnown = recipe.known;
        
        if (isDiscovered || isKnown) {
            // レシピの材料名を取得
            const recipeIngredients = recipe.requires.map(id => {
                const ing = ingredients.find(i => i.id === id);
                return ing ? ing.name : '不明';
            }).join(' + ');
            
            // レシピが知られているが、まだ作成していない場合は特別なスタイル
            const recipeClass = isDiscovered ? 'recipe-item' : 'recipe-item recipe-known-not-made';
            
            recipeListHTML += `
                <div class="${recipeClass}">
                    <img src="${recipe.image}" alt="${recipe.name}">
                    <div class="recipe-name">${recipe.name}</div>
                    <div class="recipe-ingredients">
                        <strong>材料:</strong> ${recipeIngredients}
                    </div>
                    <div class="recipe-value">価値: ${recipe.value} G</div>
                    ${isDiscovered ? '<div class="recipe-status">作成済み</div>' : '<div class="recipe-status not-made">未作成</div>'}
                </div>
            `;
        } else {
            // 未発見のレシピは？？？で表示
            recipeListHTML += `
                <div class="recipe-item recipe-mystery">
                    <img src="images/results/unknown.png" alt="不明なレシピ">
                    <div class="recipe-name">？？？</div>
                    <div class="recipe-ingredients">
                        <strong>材料:</strong> 不明
                    </div>
                    <div class="recipe-value">価値: ???</div>
                </div>
            `;
        }
    });
    
    recipeContent.innerHTML = `
        <h2>レシピブック</h2>
        <div class="shop-description">発見したレシピや購入したレシピ書が記録されます。新しいレシピを見つけるには様々な材料を組み合わせてみましょう！</div>
        <div class="recipe-list">
            ${recipeListHTML}
        </div>
        <button class="close-button" id="close-recipe">閉じる</button>
    `;
    
    recipeOverlay.appendChild(recipeContent);
    document.body.appendChild(recipeOverlay);
    
    // 閉じるボタンのイベントリスナー
    document.getElementById('close-recipe').addEventListener('click', () => {
        document.body.removeChild(recipeOverlay);
    });
}

// ショップ機能の初期化
function initShop() {
    // Add event listener to shop button
    shopButton.addEventListener('click', openShop);
    
    // Add event listener to recipe button
    recipeButton.addEventListener('click', openRecipeBook);
}