/**
 * SM-2 間隔反復アルゴリズム
 * SuperMemo 2 アルゴリズムの実装
 */

// ==================== SM-2 アルゴリズム ====================

/**
 * SM-2アルゴリズムで次回復習日を計算
 * @param {Object} card - カード情報
 * @param {number} quality - 回答品質 (0-5)
 *   5: 完璧 (即答)
 *   4: 正解 (少し考えた)
 *   3: 正解 (かなり考えた)
 *   2: 不正解だが思い出せた
 *   1: 不正解
 *   0: 完全に忘れていた
 * @returns {Object} 更新されたカード情報
 */
function calculateSM2(card, quality) {
    // デフォルト値を設定
    let easeFactor = card.easeFactor || 2.5;
    let interval = card.interval || 0;
    let repetitions = card.repetitions || 0;

    // quality < 3 の場合は復習をリセット
    if (quality < 3) {
        repetitions = 0;
        interval = 1; // 1日後に再度復習
    } else {
        // repetitionsを増加
        repetitions += 1;

        // intervalを計算
        if (repetitions === 1) {
            interval = 1; // 1日後
        } else if (repetitions === 2) {
            interval = 6; // 6日後
        } else {
            interval = Math.round(interval * easeFactor);
        }

        // easeFactor を更新
        easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

        // easeFactor の最小値は 1.3
        if (easeFactor < 1.3) {
            easeFactor = 1.3;
        }
    }

    // 次回復習日を計算
    const nextReviewDate = Date.now() + interval * 24 * 60 * 60 * 1000;

    return {
        easeFactor: Math.round(easeFactor * 100) / 100, // 小数点2桁
        interval,
        repetitions,
        nextReviewDate
    };
}

/**
 * 回答品質を判定（4択クイズ用の簡易版）
 * @param {boolean} correct - 正解かどうか
 * @param {number} timeSpent - 回答にかかった時間（秒）
 * @returns {number} quality (0-5)
 */
function determineQuality(correct, timeSpent = null) {
    if (!correct) {
        return 1; // 不正解
    }

    // 正解の場合、回答時間で品質を判定
    if (timeSpent === null) {
        return 4; // デフォルトは「正解（少し考えた）」
    }

    if (timeSpent < 3) {
        return 5; // 3秒未満: 完璧（即答）
    } else if (timeSpent < 10) {
        return 4; // 10秒未満: 正解（少し考えた）
    } else {
        return 3; // 10秒以上: 正解（かなり考えた）
    }
}

/**
 * 復習が必要な問題を取得（SM-2版）
 * @param {Array} allStats - 全統計データ
 * @returns {Array} 復習が必要な問題IDのリスト
 */
function getQuestionsForReview(allStats) {
    const now = Date.now();
    const reviewQuestions = allStats.filter(stat => {
        // nextReviewDateが設定されていない場合は復習不要
        if (!stat.nextReviewDate) return false;
        
        // 復習日が過ぎている問題のみ
        return stat.nextReviewDate <= now;
    });

    // 次回復習日が古い順（最優先）でソート
    reviewQuestions.sort((a, b) => a.nextReviewDate - b.nextReviewDate);

    return reviewQuestions;
}

/**
 * 今日の新規問題を取得（未学習問題）
 * @param {Array} allQuestions - 全問題
 * @param {Array} allStats - 全統計データ
 * @param {number} limit - 1日の新規問題数上限
 * @returns {Array} 新規問題のリスト
 */
function getNewQuestionsForToday(allQuestions, allStats, limit = 20) {
    const studiedIds = new Set(allStats.map(s => s.question_id));
    const newQuestions = allQuestions.filter(q => !studiedIds.has(q.id));
    
    // ランダムに選択
    const shuffled = [...newQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
}

// ==================== 使用例 ====================

/**
 * クイズ回答時の処理例
 */
async function handleQuizAnswer(questionId, isCorrect, timeSpent) {
    // 既存の統計データを取得
    let stats = await QuizDB.getStats(questionId) || {
        question_id: questionId,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReviewDate: null
    };

    // 回答品質を判定
    const quality = determineQuality(isCorrect, timeSpent);

    // SM-2アルゴリズムで次回復習日を計算
    const updated = calculateSM2(stats, quality);

    // 統計データを更新
    stats = {
        ...stats,
        ...updated,
        lastReviewDate: Date.now(),
        totalReviews: (stats.totalReviews || 0) + 1
    };

    // DBに保存
    await QuizDB.updateStats(questionId, stats);

    return stats;
}

/**
 * 今日の学習内容を取得
 */
async function getTodayStudyPlan() {
    const allQuestions = await QuizDB.getAllQuestions();
    const allStats = await QuizDB.getAllStats();

    // 統計データをMapに変換（高速検索用）
    const statsMap = new Map();
    allStats.forEach(stat => {
        statsMap.set(stat.question_id, stat);
    });

    // 復習が必要な問題
    const reviewQuestions = getQuestionsForReview(allStats);

    // 新規問題を取得（statsに記録がない問題）
    const newQuestions = allQuestions.filter(q => !statsMap.has(q.id));
    
    // 新規問題の数を制限（復習が少ない場合のみ追加）
    const newQuestionsLimit = Math.max(0, 50 - reviewQuestions.length);
    const selectedNewQuestions = newQuestions.slice(0, newQuestionsLimit);

    return {
        review: reviewQuestions.map(s => s.question_id),
        new: selectedNewQuestions.map(q => q.id),
        total: reviewQuestions.length + selectedNewQuestions.length
    };
}

/**
 * 習得状況の統計を取得
 */
async function getMasteryStats() {
    const allQuestions = await QuizDB.getAllQuestions();
    const allStats = await QuizDB.getAllStats();
    
    // 統計データをMapに変換
    const statsMap = new Map();
    allStats.forEach(stat => {
        statsMap.set(stat.question_id, stat);
    });
    
    let mastered = 0;  // 習得済み（7日以上）
    let learning = 0;  // 学習中（1-6日）
    let newCount = 0;  // 未学習
    
    allQuestions.forEach(q => {
        const stats = statsMap.get(q.id);
        const level = getMasteryLevel(stats);
        
        if (level === 'mastered') {
            mastered++;
        } else if (level === 'learning') {
            learning++;
        } else {
            newCount++;
        }
    });
    
    return {
        mastered,
        learning,
        new: newCount,
        total: allQuestions.length
    };
}

// ==================== マスタリーレベル判定 ====================

/**
 * 問題のマスタリーレベルを判定
 * @param {Object} stats - 統計データ
 * @returns {string} 'mastered' | 'learning' | 'new'
 */
function getMasteryLevel(stats) {
    if (!stats || stats.interval === undefined) {
        return 'new'; // 未学習
    }
    
    if (stats.interval >= 7) {
        return 'mastered'; // 習得済み（7日以上）
    }
    
    if (stats.interval > 0) {
        return 'learning'; // 学習中（1-6日）
    }
    
    return 'new'; // 未学習
}

// ==================== エクスポート ====================

window.SM2 = {
    calculateSM2,
    determineQuality,
    getQuestionsForReview,
    getNewQuestionsForToday,
    handleQuizAnswer,
    getTodayStudyPlan,
    getMasteryStats,
    getMasteryLevel
};