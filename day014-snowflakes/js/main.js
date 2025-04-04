/**
 * メインアプリケーションロジック
 * アプリケーションの初期化と実行を管理します
 */

// アプリケーション初期化
async function initApp() {
    try {
        // 背景の雪の結晶を生成
        SnowflakeAnimation.createBackgroundSnowflakes();
        
        // モジュールの初期化
        SnowflakeAnimation.init();
        UIManager.init();
        
        // 結晶データを読み込む
        await CrystalDataManager.loadCrystalData();
        
        // プレビューを更新
        await UIManager.updatePreview();
        
        // 初期の雪の結晶を生成
        UIManager.generateSnowflakes();
        
        console.log(`雪の結晶ジェネレーター v${APP_CONFIG.version} が正常に初期化されました`);
    } catch (error) {
        console.error('アプリケーションの初期化中にエラーが発生しました:', error);
    }
}

// ページ読み込み時にアプリケーションを初期化
document.addEventListener('DOMContentLoaded', initApp);

// 再読み込み時や画面サイズ変更時の処理
window.addEventListener('resize', () => {
    // キャンバスのリサイズ
    SnowflakeAnimation.resizeCanvas();
    
    // モバイルデバイスの場合は雪の結晶の数を調整
    if (isMobileDevice()) {
        SnowflakeAnimation.SNOWFLAKE_COUNT = APP_CONFIG.snowflake.mobileCount;
        SnowflakeAnimation.targetFPS = APP_CONFIG.animation.mobileFPS;
    } else {
        SnowflakeAnimation.SNOWFLAKE_COUNT = APP_CONFIG.snowflake.desktopCount;
        SnowflakeAnimation.targetFPS = APP_CONFIG.animation.desktopFPS;
    }
});

// スマホでのスクロール問題に対応
if (isMobileDevice()) {
    // タッチイベントの伝播を制御
    document.addEventListener('touchmove', (e) => {
        const canvasContainer = document.querySelector('.canvas-container');
        // キャンバスコンテナ内でのタッチ移動は通常通り
        if (canvasContainer && canvasContainer.contains(e.target)) {
            e.stopPropagation();
        }
    }, { passive: true });
    
    // iOS Safariでの「ホーム」スワイプジェスチャーへの対応
    document.body.style.overscrollBehaviorY = 'none';
}

// モーダル表示の調整
document.addEventListener('click', (e) => {
    const modalContent = document.querySelector('.modal-content');
    if (modalContent && !modalContent.contains(e.target) && !e.target.classList.contains('info-button')) {
        const modal = document.querySelector('.crystal-modal');
        if (modal) {
            modal.classList.add('modal-closing');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }
});

// URLクエリパラメータからの初期設定
function loadSettingsFromURL() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const temp = urlParams.get('temp');
        const humidity = urlParams.get('humidity');
        
        if (temp !== null && !isNaN(parseInt(temp))) {
            const tempValue = Math.max(-20, Math.min(0, parseInt(temp)));
            document.getElementById('temperature').value = tempValue;
        }
        
        if (humidity !== null && !isNaN(parseInt(humidity))) {
            const humidityValue = Math.max(0, Math.min(100, parseInt(humidity)));
            document.getElementById('humidity').value = humidityValue;
        }
        
        // 値が変更された場合は表示を更新
        if (temp !== null || humidity !== null) {
            UIManager.updateTempValue();
            UIManager.updateHumidityValue();
        }
    } catch (error) {
        console.error('URLパラメータの処理中にエラーが発生しました:', error);
    }
}

// URL設定の読み込み（初期化後に実行）
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(loadSettingsFromURL, 500);
});