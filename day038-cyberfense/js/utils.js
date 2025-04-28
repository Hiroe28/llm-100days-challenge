// ユーティリティ関数
const Utils = (function() {
    // 自動的にベースパスを判定
    const getBasePath = function() {
        // 現在のURLを取得
        const currentUrl = window.location.href;
        
        // GitHub Pagesで実行されているかチェック
        if (currentUrl.includes('github.io') || currentUrl.includes('llm-100days-challenge')) {
            return '/llm-100days-challenge/day038-cyberfense';
        } else {
            // ローカル環境
            return '';
        }
    };
    
    // 動的に決定されるベースパス
    const BASE_PATH = getBasePath();
    
    // ページパスを取得する関数（HTMLファイル間リンク用）
    const getPagePath = function(relativePath) {
        // 先頭のスラッシュを処理（重複を防ぐ）
        if (relativePath.startsWith('/')) {
            relativePath = relativePath.substring(1);
        }
        
        // ベースパスが空でなければスラッシュを追加
        const basePath = BASE_PATH ? BASE_PATH + '/' : '';
        
        return basePath + relativePath;
    };
    
    // アセットパスを取得する関数（画像・音声ファイル用）
    const getAssetPath = function(relativePath) {
        return getPagePath(relativePath);
    };


    // 角度をラジアンに変換
    function degToRad(degrees) {
        return degrees * Math.PI / 180;
    }
    
    // ラジアンを角度に変換
    function radToDeg(radians) {
        return radians * 180 / Math.PI;
    }
    
    // 二点間の距離を計算
    function distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // 範囲内のランダムな整数を生成
    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    // 範囲内のランダムな浮動小数点数を生成
    function randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    // ランダムな色を生成
    function randomColor(alpha = 1) {
        const r = randomInt(0, 255);
        const g = randomInt(0, 255);
        const b = randomInt(0, 255);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    // サイバーっぽい色を生成
    function randomCyberColor(alpha = 1) {
        const colors = [
            [0, 255, 200],   // シアン
            [255, 50, 50],   // 赤
            [80, 200, 255],  // 水色
            [255, 100, 255], // ピンク
            [255, 220, 0],   // 黄色
            [0, 150, 255],   // 青
            [200, 50, 255]   // 紫
        ];
        
        const color = colors[randomInt(0, colors.length - 1)];
        return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
    }
    
    // 値を特定の範囲に制限
    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
    
    // 二つの値の線形補間
    function lerp(a, b, t) {
        return a + (b - a) * t;
    }
    
    // デバイスがモバイルかどうかを判定
    function isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    // 数値をカンマ区切りの文字列に変換
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    
    // 公開API
    return {
        degToRad,
        radToDeg,
        distance,
        randomInt,
        randomFloat,
        randomColor,
        randomCyberColor,
        clamp,
        lerp,
        isMobile,
        formatNumber,
        getAssetPath,   // 新しく追加した関数
        BASE_PATH       // ベースパスも公開
    };
})();