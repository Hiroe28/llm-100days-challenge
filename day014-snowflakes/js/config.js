/**
 * 雪の結晶ジェネレーター設定ファイル
 * アプリケーションの基本設定を管理します
 */

const APP_CONFIG = {
    // アプリケーションバージョン
    version: '1.2.0',
    
    // デフォルト設定値
    defaults: {
        temperature: -10,
        humidity: 50
    },
    
    // 雪の結晶の設定
    snowflake: {
        // 雪の結晶の数（デスクトップ）
        desktopCount: 20,
        
        // 雪の結晶の数（モバイル）
        mobileCount: 10,
        
        // 背景雪の結晶の数（デスクトップ）
        bgDesktopCount: 15,
        
        // 背景雪の結晶の数（モバイル）
        bgMobileCount: 8
    },
    
    // アニメーション設定
    animation: {
        // デスクトップのFPS
        desktopFPS: 30,
        
        // モバイルのFPS（パフォーマンス向上のため低めに設定）
        mobileFPS: 24
    },
    
    // API設定
    api: {
        // 結晶データJSONのパス
        crystalDataPath: 'snowflakes/crystal_data.json'
    }
};

// バージョン表示を初期化する関数
function initVersionDisplay() {
    // バージョンタグの表示
    document.getElementById('version-display').textContent = `v${APP_CONFIG.version}`;
    
    // フッターにもバージョンを表示
    document.getElementById('footer-version').textContent = `v${APP_CONFIG.version}`;
}

// ページロード時にバージョン表示を初期化
document.addEventListener('DOMContentLoaded', initVersionDisplay);

// デバイスタイプの検出
function isMobileDevice() {
    return window.matchMedia("(max-width: 768px)").matches;
}

// デバイスに適した雪の結晶の数を取得
function getSnowflakeCount() {
    return isMobileDevice() ? APP_CONFIG.snowflake.mobileCount : APP_CONFIG.snowflake.desktopCount;
}

// デバイスに適したFPSを取得
function getTargetFPS() {
    return isMobileDevice() ? APP_CONFIG.animation.mobileFPS : APP_CONFIG.animation.desktopFPS;
}

// デバイスに適した背景雪の結晶の数を取得
function getBgSnowflakeCount() {
    return isMobileDevice() ? APP_CONFIG.snowflake.bgMobileCount : APP_CONFIG.snowflake.bgDesktopCount;
}