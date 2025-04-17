// メインのゲームロジック

// DOM elements
const dayDisplay = document.getElementById('day-display');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

// ゴールド表示を更新する関数
function updateGoldDisplay() {
    document.getElementById('gold-display').textContent = `所持金: ${playerGold} G`;
}

// 日数表示を更新する関数
function updateDayDisplay() {
    dayDisplay.textContent = `${currentDay}日目 / ${maxDays}日`;
    
    // 日数が最大値に達した場合、ゲームオーバー
    if (currentDay > maxDays) {
        gameOver(false);
    }
}

// 目標進捗を更新する関数
function updateGoalProgress() {
    // 賢者の石が作成済みかチェック
    const philosophersStone = resultItems.find(item => item.isGoal);
    const isGoalAchieved = philosophersStone.discovered;
    
    if (isGoalAchieved) {
        progressBar.style.width = '100%';
        progressText.textContent = '100% 完了';
        gameOver(true);
        return;
    }
    
    // 発見したレシピの数に基づいて進捗を計算
    const discoveredCount = resultItems.filter(item => item.discovered).length;
    const totalRecipes = resultItems.length;
    const progress = Math.floor((discoveredCount / (totalRecipes - 1)) * 100); // 賢者の石を除く
    
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${progress}% 完了 (${discoveredCount}/${totalRecipes - 1}レシピ作成)`;
}

// 日数を進める関数
function advanceDay(days) {
    currentDay += days;
    updateDayDisplay();
}


// ゲームの初期化
function initGame() {
    // 初期に知っているレシピを設定
    resultItems[0].known  = true; // 輝きのポーション
    
    // 素材リストを初期化
    updateIngredientList();
    
    // 各機能の初期化
    initCrafting();
    initGathering();
    initShop();
    
    // サウンドシステムの初期化
    if (typeof soundManager !== 'undefined') {
        soundManager.init();
    }
    
    // 保存システムの初期化
    if (typeof saveManager !== 'undefined') {
        saveManager.init();
    }

    // タッチ対応のクリックイベント
    document.addEventListener('touchstart', function() {
        // タッチデバイスであることを検知
        document.body.classList.add('touch-device');
    }, {once: true});
    
    // main.js に追加
    // ダブルタップによるズームを防止
    document.addEventListener('dblclick', function(e) {
        e.preventDefault();
    }, { passive: false });
    
    // 指を大きく広げるピンチズームの防止（オプション）
    document.addEventListener('touchmove', function(e) {
        if (e.touches.length > 1) {
        e.preventDefault();
        }
    }, { passive: false });

    // 目標進捗を初期化
    updateGoalProgress();
    
    // 日数表示を初期化
    updateDayDisplay();
    
    // ゴールド表示を初期化
    updateGoldDisplay();

    // 就寝ボタンを追加
    addSleepButton();

    // ヒントリストを初期化
    updateHintsList();
    
    // グローバル関数として登録
    window.toggleHints = toggleHints;
    window.toggleGuide = toggleGuide;
    
    // ヒントリストと遊び方ガイドを初期状態で非表示に
    document.getElementById('hints-list').style.display = 'none';
    document.getElementById('guide-content').style.display = 'none';

    showIntroStory();
}

// 遊び方ガイドの表示切替（新規追加）
window.toggleGuide = function() {
    const guideContent = document.getElementById('guide-content');
    const guideTitle = document.querySelector('.guide-title');
    
    if (guideContent.style.display === 'none' || !guideContent.style.display) {
        guideContent.style.display = 'block';
        guideTitle.innerHTML = '遊び方ガイド ▲';
    } else {
        guideContent.style.display = 'none';
        guideTitle.innerHTML = '遊び方ガイド ▼';
    }
}


function displayAlchemyInfo() {
    const levelDisplay = document.getElementById('alchemy-level');
    const expDisplay = document.getElementById('alchemy-exp');
    
    levelDisplay.textContent = `錬金術レベル: ${alchemyLevel}`;
    
    // 次のレベルまでの経験値を計算
    const nextLevelExp = expToNextLevel[alchemyLevel];
    const expPercentage = (alchemyExp / nextLevelExp * 100).toFixed(1);
    
    expDisplay.textContent = `経験値: ${alchemyExp}/${nextLevelExp} (${expPercentage}%)`;
    
    // 経験値バーを更新
    const expBar = document.getElementById('exp-bar');
    expBar.style.width = `${expPercentage}%`;
}

// 経験値を獲得する関数
function gainExp(amount) {
    alchemyExp += amount;
    
    let leveledUp = false;
    
    // レベルアップチェック
    while (alchemyLevel < expToNextLevel.length - 1 && alchemyExp >= expToNextLevel[alchemyLevel]) {
        alchemyLevel++;
        leveledUp = true;
        showMessage(`錬金術レベルが${alchemyLevel}に上がりました！`, 'success');
        playLevelUpSound(); // レベルアップ音を再生
    }
    
    // レベルアップした場合は場所のアンロック条件をチェック
    if (leveledUp) {
        checkPlaceUnlocks();
    }
    
    displayAlchemyInfo();
}

// 時間を進める関数を修正
function advanceTime(hours) {
    currentTime += hours;
    
    // 1日の活動時間を超えた場合、就寝処理
    if (currentTime >= dayEndTime) {
        showMessage('活動時間外になりました。就寝します。', 'info');
        goToSleep();
    }
    
    updateTimeDisplay();
}

// 時間表示を更新する関数
function updateTimeDisplay() {
    const timeStr = `${currentTime}:00`;
    dayDisplay.textContent = `${currentDay}日目 ${timeStr} / ${maxDays}日`;
    
    // 日数が最大値に達した場合、ゲームオーバー
    if (currentDay > maxDays) {
        gameOver(false);
    }
}

// main.js に追加
function dayChangeEffect() {
    // 日付変更エフェクト用のオーバーレイを作成
    const dayChangeOverlay = document.createElement('div');
    dayChangeOverlay.className = 'day-change-overlay';
    
    // 内容を設定
    dayChangeOverlay.innerHTML = `
        <div class="day-change-content">
            <div class="day-change-title">${currentDay}日目</div>
            <div class="day-change-text">新しい1日が始まりました</div>
        </div>
    `;
    
    // bodyに追加
    document.body.appendChild(dayChangeOverlay);
    
    // アニメーション
    setTimeout(() => {
        dayChangeOverlay.classList.add('active');
    }, 100);
    
    // 2秒後に消える
    setTimeout(() => {
        dayChangeOverlay.classList.remove('active');
        setTimeout(() => {
            document.body.removeChild(dayChangeOverlay);
        }, 500);
    }, 2000);
}

function isActivityAvailable(requiredHours) {
    // 所要時間を加えたときに活動時間を超えるかチェック
    return (currentTime + requiredHours) < dayEndTime;
}

// 活動不可能メッセージを表示する関数
function showTimeWarning(action, requiredHours) {
    const remainingHours = dayEndTime - currentTime;
    
    // オーバーレイを作成
    const warningOverlay = document.createElement('div');
    warningOverlay.className = 'warning-overlay';
    
    const warningContent = document.createElement('div');
    warningContent.className = 'warning-content';
    
    warningContent.innerHTML = `
        <h3>時間が足りません</h3>
        <p>この${action}には${requiredHours}時間必要ですが、今日はあと${remainingHours}時間しか活動できません。</p>
        <p>先に就寝してください。</p>
        <button class="close-button" id="close-warning">閉じる</button>
    `;
    
    warningOverlay.appendChild(warningContent);
    document.body.appendChild(warningOverlay);
    
    // 閉じるボタンのイベントリスナー
    document.getElementById('close-warning').addEventListener('click', () => {
        document.body.removeChild(warningOverlay);
    });
}


function addSleepButton() {
    // 既にHTMLに追加済みなので、イベントリスナーだけを追加する
    const sleepButton = document.getElementById('sleep-button');
    if (sleepButton) {
        sleepButton.addEventListener('click', goToSleep);
    }
}

// 就寝する関数
// goToSleep 関数を修正
function goToSleep() {
    // 残りの時間を計算
    const remainingHours = dayEndTime - currentTime;
    
    if (remainingHours <= 0) {
        showMessage('すでに活動時間外です。自動的に就寝します。', 'info');
    } else {
        showMessage(`就寝します。`, 'info');
    }
    
    // 日数確認 - 30日を超えそうならゲームオーバー
    if (currentDay >= 30) {
        // 30日目の夜ならゲームオーバー
        gameOver(false);
        return; // 以降の処理を実行しない
    }
    
    // 翌日の活動開始時間にする
    currentDay++;
    currentTime = dayStartTime;

    // 日付変更のサウンドを再生
    if (typeof playDayChangeSound === 'function') {
        playDayChangeSound();
    }

    // ショップの在庫を補充
    restockShop();
    
    // 時間表示を更新
    updateTimeDisplay();
    
    // 日付変更エフェクト
    dayChangeEffect();
}


// ショップの在庫を補充する関数
function restockShop() {
    shopStock.materials.forEach(item => {
        // 最後の補充から指定日数が経過したか確認
        if (currentDay - item.lastRestockDay >= item.restockDays) {
            // 在庫を最大値まで補充
            item.currentStock = item.maxStock;
            // 最後に補充した日を更新
            item.lastRestockDay = currentDay;
        }
    });
}

// ヒントリストを更新する関数
function updateHintsList() {
    const hintsList = document.getElementById('hints-list');
    if (!hintsList) return;
    
    // 未発見のレシピに関するヒントだけをフィルタリング
    const activeHints = recipeHints.filter(hint => {
        // レシピ名に対応するレシピオブジェクトを探す
        const recipe = resultItems.find(r => r.name === hint.recipeName);
        // レシピが存在し、かつまだ発見されていない場合のみ表示
        return recipe && !recipe.discovered;
    });
    
    if (activeHints.length === 0) {
        hintsList.innerHTML = '<p class="no-hints">まだヒントは見つかっていません。採取で見つけることができます。</p>';
        return;
    }
    
    let hintsHTML = '';
    activeHints.forEach(hint => {
        hintsHTML += `
            <div class="hint-item">
                <div class="hint-text">${hint.hintText}</div>
                <div class="hint-date">発見日: ${hint.discovered}</div>
            </div>
        `;
    });
    
    hintsList.innerHTML = hintsHTML;
}

// // レシピヒントを保存する配列
// let recipeHints = [];

// ヒント表示の切り替え
function toggleHints() {
    const hintsList = document.getElementById('hints-list');
    const hintsTitle = document.querySelector('.hints-title');
    
    if (hintsList.style.display === 'none' || !hintsList.style.display) {
        hintsList.style.display = 'block';
        hintsTitle.textContent = '発見したレシピヒント ▲';
    } else {
        hintsList.style.display = 'none';
        hintsTitle.textContent = '発見したレシピヒント ▼';
    }
}

// 遊び方ガイドの表示切替
function toggleGuide() {
    const guideContent = document.getElementById('guide-content');
    const guideTitle = document.querySelector('.guide-title');
    
    if (guideContent.style.display === 'none' || !guideContent.style.display) {
        guideContent.style.display = 'block';
        guideTitle.textContent = '遊び方ガイド ▲';
    } else {
        guideContent.style.display = 'none';
        guideTitle.textContent = '遊び方ガイド ▼';
    }
}

// メッセージ表示関数を改善
function showMessage(text, type) {
    const messageEl = document.getElementById('message');
    if (!messageEl) return; // 要素が見つからない場合は処理をスキップ
    
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    messageEl.style.display = 'inline-block';
    
    // 自動的に消える前に、タイマーをリセット
    clearTimeout(messageEl.timer);
    
    // 3秒後に消える
    messageEl.timer = setTimeout(() => {
        messageEl.style.display = 'none';
    }, 3000);
}

// main.js に追加
// ゲーム開始時のストーリーポップアップを表示
// main.js の showIntroStory 関数を修正
// ゲーム開始時のストーリーポップアップを表示
function showIntroStory() {
    const storyPopup = document.createElement('div');
    storyPopup.className = 'story-popup';
    
    const isMobile = window.innerWidth <= 768;
    
    // モバイル向けに構造を調整
    storyPopup.innerHTML = isMobile ? 
        `<div class="story-content">
            <img src="images/story/intro.png" alt="錬金術工房" class="story-image">
            <div class="story-text">
                <p>あなたは新米の錬金術師。一ヶ月前に亡くなった祖父から古い錬金術工房を相続した。</p>
                <p>祖父の日記によると、「賢者の石」を創るには新月から始まる「30日間の大業」が必要だという。</p>
                <p>15種類の基本レシピを全て習得し、特別な素材を集めれば、伝説の賢者の石を作り出せるはずだ。</p>
                <p>祖父は最後の試みで29日目に倒れ、完成できなかった。今日から始まる新月の周期で、あなたは祖父の夢を叶えることができるだろうか？</p>
            </div>
            <button class="story-button" id="start-game">修行を始める</button>
        </div>` : 
        // PCの場合は元のHTML
        `<div class="story-content">
            <img src="images/story/intro.png" alt="錬金術工房" class="story-image">
            <div class="story-text">
                <p>あなたは新米の錬金術師。一ヶ月前に亡くなった祖父から古い錬金術工房を相続した。</p>
                <p>祖父の日記によると、「賢者の石」を創るには新月から始まる「30日間の大業」が必要だという。</p>
                <p>15種類の基本レシピを全て習得し、特別な素材を集めれば、伝説の賢者の石を作り出せるはずだ。</p>
                <p>祖父は最後の試みで29日目に倒れ、完成できなかった。今日から始まる新月の周期で、あなたは祖父の夢を叶えることができるだろうか？</p>
            </div>
            <button class="story-button" id="start-game">修行を始める</button>
        </div>`;
    
    document.body.appendChild(storyPopup);
    
    // テキストを最初から表示（スクロール位置をリセット）
    setTimeout(() => {
        const storyTextEl = document.querySelector('.story-text');
        if (storyTextEl) {
            storyTextEl.scrollTop = 0;
        }
    }, 100);
    
    // タッチイベントがボタンに影響しないように
    const storyContent = document.querySelector('.story-content');
    if (storyContent) {
        storyContent.addEventListener('touchmove', function(e) {
            e.stopPropagation(); // イベント伝播を止める
        });
    }
    
    const storyTextEl = document.querySelector('.story-text');
    if (storyTextEl) {
        storyTextEl.addEventListener('touchmove', function(e) {
            e.stopPropagation(); // タッチイベントの伝播を止める
            // このコンテナ内のスクロールは許可
        });
    }
    
    // 開始ボタンのイベントリスナー
    document.getElementById('start-game').addEventListener('click', () => {
        document.body.removeChild(storyPopup);
        playButtonSound();
        
        // BGMを開始
        if (typeof soundManager !== 'undefined') {
            soundManager.playBGM('gameplay');
        }
    });
}

// gameOver 関数の修正版（変数の再宣言エラーを修正）
function gameOver(isWin) {
    const gameEndEl = document.getElementById('game-end');
    const isMobile = window.innerWidth <= 768;
    
    if (isWin) {
        // モバイル向けHTML構造
        if (isMobile) {
            gameEndEl.innerHTML = `
                <div class="game-end-content">
                    <img src="images/story/game_clear.png" alt="ゲームクリア" class="game-end-image">
                    <div class="game-end-info">
                        <div class="game-end-title">賢者の石の完成！</div>
                        <div class="game-end-text">
                            <p>祖父の夢を叶え、ついに賢者の石を作り出した！</p>
                            <p>この石はあらゆる物質を金に変え、不老不死の秘薬も作り出せる。</p>
                            <p>偉大な錬金術師としての名声を手に入れた今、新たな冒険が待っている。</p>
                            <p>所要日数: ${currentDay}日</p>
                        </div>
                        <button class="retry-button" onclick="location.reload()">新たな旅に出る</button>
                    </div>
                </div>
            `;
        } else {
            // PC向けは元の構造
            gameEndEl.innerHTML = `
                <div class="game-end-content">
                    <img src="images/story/game_clear.png" alt="ゲームクリア" class="game-end-image">
                    <div class="game-end-info">
                        <div class="game-end-title">賢者の石の完成！</div>
                        <div class="game-end-text">
                            <p>祖父の夢を叶え、ついに賢者の石を作り出した！</p>
                            <p>この石はあらゆる物質を金に変え、不老不死の秘薬も作り出せる。</p>
                            <p>偉大な錬金術師としての名声を手に入れた今、新たな冒険が待っている。</p>
                            <p>所要日数: ${currentDay}日</p>
                        </div>
                        <button class="retry-button" onclick="location.reload()">新たな旅に出る</button>
                    </div>
                </div>
            `;
        }
    } else {
        // ゲームオーバー時も同様
        if (isMobile) {
            gameEndEl.innerHTML = `
                <div class="game-end-content">
                    <img src="images/story/game_over.png" alt="ゲームオーバー" class="game-end-image">
                    <div class="game-end-info">
                        <div class="game-end-title">時は尽きた…</div>
                        <div class="game-end-text">
                            <p>30日間の期限が過ぎてしまった。祖父の夢は叶わなかった。</p>
                            <p>しかし、この間に多くの知識と経験を得た。次はきっと成功するだろう。</p>
                        </div>
                        <button class="retry-button" onclick="location.reload()">もう一度挑戦する</button>
                    </div>
                </div>
            `;
        } else {
            gameEndEl.innerHTML = `
                <div class="game-end-content">
                    <img src="images/story/game_over.png" alt="ゲームオーバー" class="game-end-image">
                    <div class="game-end-info">
                        <div class="game-end-title">時は尽きた…</div>
                        <div class="game-end-text">
                            <p>30日間の期限が過ぎてしまった。祖父の夢は叶わなかった。</p>
                            <p>しかし、この間に多くの知識と経験を得た。次はきっと成功するだろう。</p>
                        </div>
                        <button class="retry-button" onclick="location.reload()">もう一度挑戦する</button>
                    </div>
                </div>
            `;
        }
    }
    
    // シェアボタンを追加
    const messageContainer = gameEndEl.querySelector('.game-end-info');
    addShareButtons(messageContainer, isWin ? 
        `ファンタジー錬金術工房で賢者の石の作成に成功しました！所要日数: ${currentDay}日` : 
        `ファンタジー錬金術工房で30日間の挑戦をしましたが、賢者の石の作成には至りませんでした...`);
    
    gameEndEl.style.display = 'flex';
    

    // テキストを最初から表示
    setTimeout(() => {
        const gameEndInfoEl = gameEndEl.querySelector('.game-end-info');
        if (gameEndInfoEl) {
            gameEndInfoEl.scrollTop = 0;
        }
        
        // タッチイベントの問題を防止
        const gameEndContent = gameEndEl.querySelector('.game-end-content');
        if (gameEndContent) {
            gameEndContent.addEventListener('touchmove', function(e) {
                e.stopPropagation();
            });
        }
        
        // 変数の再宣言を防ぐために別名を使用
        if (gameEndInfoEl) {
            gameEndInfoEl.addEventListener('touchmove', function(e) {
                e.stopPropagation();
                // このコンテナ内のスクロールは許可
            });
        }
    }, 100);
    
    // ゲームエンドBGMを再生
    if (typeof soundManager !== 'undefined') {
        soundManager.playBGM(isWin ? 'gameClear' : 'gameOver');
    }
}

// main.js に追加する関数
function addShareButtons(container, message) {
    const shareContainer = document.createElement('div');
    shareContainer.className = 'share-buttons';
    
    // URLエンコードされたメッセージ
    const encodedMessage = encodeURIComponent(message);
    const encodedUrl = encodeURIComponent(window.location.href);
    
    // Twitterシェアボタン
    const twitterButton = document.createElement('button');
    twitterButton.className = 'share-button twitter-share';
    twitterButton.innerHTML = '𝕏 でシェア';
    twitterButton.addEventListener('click', () => {
        window.open(`https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`, '_blank');
    });
    
    // Facebookシェアボタン
    const facebookButton = document.createElement('button');
    facebookButton.className = 'share-button facebook-share';
    facebookButton.innerHTML = 'Facebook でシェア';
    facebookButton.addEventListener('click', () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
    });
    
    // LINEシェアボタン
    const lineButton = document.createElement('button');
    lineButton.className = 'share-button line-share';
    lineButton.innerHTML = 'LINE で送る';
    lineButton.addEventListener('click', () => {
        window.open(`https://line.me/R/msg/text/?${encodedMessage}%20${encodedUrl}`, '_blank');
    });
    
    shareContainer.appendChild(twitterButton);
    shareContainer.appendChild(facebookButton);
    shareContainer.appendChild(lineButton);
    
    container.appendChild(shareContainer);
}

// ページロード時にゲームを初期化
window.addEventListener('DOMContentLoaded', initGame);