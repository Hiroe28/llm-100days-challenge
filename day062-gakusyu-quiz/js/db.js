/**
 * db.js - IndexedDB操作モジュール
 * クイズアプリのデータ永続化を担当
 */

const DB_NAME = 'quiz_app_db';
const DB_VERSION = 1;

// データベース接続を保持
let db = null;

/**
 * UUIDを生成
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * データベースを初期化
 */
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('IndexedDBの初期化に失敗しました:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            db = request.result;
            console.log('IndexedDBに接続しました');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // questionsストア
            if (!database.objectStoreNames.contains('questions')) {
                const questionsStore = database.createObjectStore('questions', { keyPath: 'id' });
                questionsStore.createIndex('created_at', 'created_at', { unique: false });
                questionsStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
            }

            // assetsストア（画像など）
            if (!database.objectStoreNames.contains('assets')) {
                const assetsStore = database.createObjectStore('assets', { keyPath: 'id' });
                assetsStore.createIndex('created_at', 'created_at', { unique: false });
            }

            // attemptsストア（解答履歴）
            if (!database.objectStoreNames.contains('attempts')) {
                const attemptsStore = database.createObjectStore('attempts', { keyPath: 'id' });
                attemptsStore.createIndex('question_id', 'question_id', { unique: false });
                attemptsStore.createIndex('timestamp', 'timestamp', { unique: false });
            }

            // statsストア（統計情報）
            if (!database.objectStoreNames.contains('stats')) {
                const statsStore = database.createObjectStore('stats', { keyPath: 'question_id' });
                statsStore.createIndex('wrong_count', 'wrong_count', { unique: false });
                statsStore.createIndex('last_wrong_at', 'last_wrong_at', { unique: false });
            }

            console.log('データベーススキーマを作成しました');
        };
    });
}

/**
 * トランザクションを取得
 */
function getTransaction(storeNames, mode = 'readonly') {
    if (!db) {
        throw new Error('データベースが初期化されていません');
    }
    return db.transaction(storeNames, mode);
}

/**
 * オブジェクトストアを取得
 */
function getStore(storeName, mode = 'readonly') {
    const tx = getTransaction(storeName, mode);
    return tx.objectStore(storeName);
}

// ==================== Questions ====================

/**
 * 問題を追加
 */
async function addQuestion(questionData) {
    return new Promise((resolve, reject) => {
        const store = getStore('questions', 'readwrite');
        const question = {
            id: generateUUID(),
            title: questionData.title || '',
            body_md: questionData.body_md || '',
            choices: questionData.choices || { A: '', B: '', C: '', D: '' },
            answer: questionData.answer || 'A',
            explanation_md: questionData.explanation_md || '',
            tags: questionData.tags || [],
            asset_ids: questionData.asset_ids || [],
            created_at: Date.now(),
            updated_at: Date.now()
        };

        const request = store.add(question);
        request.onsuccess = () => resolve(question);
        request.onerror = () => reject(request.error);
    });
}

/**
 * IDを指定して問題を追加（インポート用）
 * IDが指定されていない場合は自動生成
 */
async function addQuestionWithId(questionData) {
    return new Promise((resolve, reject) => {
        const store = getStore('questions', 'readwrite');
        const question = {
            id: questionData.id || generateUUID(),
            title: questionData.title || '',
            body_md: questionData.body_md || '',
            choices: questionData.choices || { A: '', B: '', C: '', D: '' },
            answer: questionData.answer || 'A',
            explanation_md: questionData.explanation_md || '',
            tags: questionData.tags || [],
            asset_ids: questionData.asset_ids || [],
            created_at: questionData.created_at || Date.now(),
            updated_at: questionData.updated_at || Date.now()
        };

        const request = store.put(question); // put を使うと既存があれば上書き
        request.onsuccess = () => resolve(question);
        request.onerror = () => reject(request.error);
    });
}

/**
 * アセットをIDを指定して追加（インポート用）
 */
async function addAssetWithId(id, blob, filename, created_at) {
    return new Promise((resolve, reject) => {
        const store = getStore('assets', 'readwrite');
        const asset = {
            id: id || generateUUID(),
            mime: blob.type,
            blob: blob,
            filename: filename || 'image',
            created_at: created_at || Date.now()
        };

        const request = store.put(asset);
        request.onsuccess = () => resolve(asset);
        request.onerror = () => reject(request.error);
    });
}

/**
 * 統計データを直接追加（インポート用）
 */
async function addStatsData(statsData) {
    return new Promise((resolve, reject) => {
        const store = getStore('stats', 'readwrite');
        const request = store.put(statsData);
        request.onsuccess = () => resolve(statsData);
        request.onerror = () => reject(request.error);
    });
}

/**
 * 解答履歴を直接追加（インポート用）
 */
async function addAttemptData(attemptData) {
    return new Promise((resolve, reject) => {
        const store = getStore('attempts', 'readwrite');
        const request = store.put(attemptData);
        request.onsuccess = () => resolve(attemptData);
        request.onerror = () => reject(request.error);
    });
}

/**
 * 問題を更新
 */
async function updateQuestion(id, questionData) {
    return new Promise((resolve, reject) => {
        const store = getStore('questions', 'readwrite');
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
            const existing = getRequest.result;
            if (!existing) {
                reject(new Error('問題が見つかりません'));
                return;
            }

            const updated = {
                ...existing,
                ...questionData,
                id: id, // IDは変更不可
                updated_at: Date.now()
            };

            const putRequest = store.put(updated);
            putRequest.onsuccess = () => resolve(updated);
            putRequest.onerror = () => reject(putRequest.error);
        };

        getRequest.onerror = () => reject(getRequest.error);
    });
}

/**
 * 問題を削除
 */
async function deleteQuestion(id) {
    return new Promise(async (resolve, reject) => {
        try {
            // まず関連するアセットを削除
            const question = await getQuestion(id);
            if (question && question.asset_ids) {
                for (const assetId of question.asset_ids) {
                    await deleteAsset(assetId);
                }
            }

            // 問題を削除
            const store = getStore('questions', 'readwrite');
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);

            // 関連する統計も削除
            await deleteStats(id);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 問題を取得
 */
async function getQuestion(id) {
    return new Promise((resolve, reject) => {
        const store = getStore('questions');
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * 全問題を取得
 */
async function getAllQuestions() {
    return new Promise((resolve, reject) => {
        const store = getStore('questions');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

/**
 * タグで問題を検索
 */
async function getQuestionsByTag(tag) {
    return new Promise((resolve, reject) => {
        const store = getStore('questions');
        const index = store.index('tags');
        const request = index.getAll(tag);
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

/**
 * 全タグを取得
 */
async function getAllTags() {
    const questions = await getAllQuestions();
    const tagSet = new Set();
    questions.forEach(q => {
        if (q.tags) {
            q.tags.forEach(tag => tagSet.add(tag));
        }
    });
    return Array.from(tagSet).sort();
}

// ==================== Assets ====================

/**
 * アセット（画像など）を追加
 */
async function addAsset(blob, filename) {
    return new Promise((resolve, reject) => {
        const store = getStore('assets', 'readwrite');
        const asset = {
            id: generateUUID(),
            mime: blob.type,
            blob: blob,
            filename: filename || 'image',
            created_at: Date.now()
        };

        const request = store.add(asset);
        request.onsuccess = () => resolve(asset);
        request.onerror = () => reject(request.error);
    });
}

/**
 * アセットを取得
 */
async function getAsset(id) {
    return new Promise((resolve, reject) => {
        const store = getStore('assets');
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * アセットを削除
 */
async function deleteAsset(id) {
    return new Promise((resolve, reject) => {
        const store = getStore('assets', 'readwrite');
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * 全アセットを取得
 */
async function getAllAssets() {
    return new Promise((resolve, reject) => {
        const store = getStore('assets');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

// ==================== Attempts ====================

/**
 * 解答を記録
 */
async function addAttempt(questionId, selected, correct) {
    return new Promise((resolve, reject) => {
        const store = getStore('attempts', 'readwrite');
        const attempt = {
            id: generateUUID(),
            question_id: questionId,
            selected: selected,
            correct: correct,
            timestamp: Date.now()
        };

        const request = store.add(attempt);
        request.onsuccess = () => resolve(attempt);
        request.onerror = () => reject(request.error);
    });
}

/**
 * 問題の解答履歴を取得
 */
async function getAttemptsByQuestion(questionId) {
    return new Promise((resolve, reject) => {
        const store = getStore('attempts');
        const index = store.index('question_id');
        const request = index.getAll(questionId);
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

/**
 * 全解答履歴を取得
 */
async function getAllAttempts() {
    return new Promise((resolve, reject) => {
        const store = getStore('attempts');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

// ==================== Stats ====================

/**
 * 統計を更新（解答後に呼ぶ）
 */
async function updateStats(questionId, correct) {
    return new Promise((resolve, reject) => {
        const store = getStore('stats', 'readwrite');
        const getRequest = store.get(questionId);

        getRequest.onsuccess = () => {
            let stats = getRequest.result || {
                question_id: questionId,
                wrong_count: 0,
                last_wrong_at: null,
                last_correct_at: null
            };

            if (correct) {
                stats.last_correct_at = Date.now();
            } else {
                stats.wrong_count++;
                stats.last_wrong_at = Date.now();
            }

            const putRequest = store.put(stats);
            putRequest.onsuccess = () => resolve(stats);
            putRequest.onerror = () => reject(putRequest.error);
        };

        getRequest.onerror = () => reject(getRequest.error);
    });
}

/**
 * 統計をリセット（復習完了時など）
 */
async function resetStats(questionId) {
    return new Promise((resolve, reject) => {
        const store = getStore('stats', 'readwrite');
        const stats = {
            question_id: questionId,
            wrong_count: 0,
            last_wrong_at: null,
            last_correct_at: Date.now()
        };

        const request = store.put(stats);
        request.onsuccess = () => resolve(stats);
        request.onerror = () => reject(request.error);
    });
}

/**
 * 問題の統計を取得
 */
async function getStats(questionId) {
    return new Promise((resolve, reject) => {
        const store = getStore('stats');
        const request = store.get(questionId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * 全統計を取得
 */
async function getAllStats() {
    return new Promise((resolve, reject) => {
        const store = getStore('stats');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

/**
 * 統計を削除
 */
async function deleteStats(questionId) {
    return new Promise((resolve, reject) => {
        const store = getStore('stats', 'readwrite');
        const request = store.delete(questionId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * 復習が必要な問題を取得
 * 条件: wrong_count > 0 かつ (last_correct_at が null または last_correct_at < last_wrong_at)
 */
async function getReviewQuestions() {
    const allStats = await getAllStats();
    const reviewStats = allStats.filter(s => {
        if (s.wrong_count <= 0) return false;
        if (!s.last_correct_at) return true;
        if (!s.last_wrong_at) return false;
        return s.last_correct_at < s.last_wrong_at;
    });

    // 間違い回数が多い順にソート
    reviewStats.sort((a, b) => b.wrong_count - a.wrong_count);

    const questions = [];
    for (const stat of reviewStats) {
        const question = await getQuestion(stat.question_id);
        if (question) {
            questions.push({ ...question, stats: stat });
        }
    }

    return questions;
}

// ==================== エクスポート ====================

// グローバルにエクスポート
window.QuizDB = {
    initDB,
    generateUUID,
    // Questions
    addQuestion,
    addQuestionWithId,
    updateQuestion,
    deleteQuestion,
    getQuestion,
    getAllQuestions,
    getQuestionsByTag,
    getAllTags,
    // Assets
    addAsset,
    addAssetWithId,
    getAsset,
    deleteAsset,
    getAllAssets,
    // Attempts
    addAttempt,
    addAttemptData,
    getAttemptsByQuestion,
    getAllAttempts,
    // Stats
    updateStats,
    resetStats,
    getStats,
    getAllStats,
    deleteStats,
    addStatsData,
    getReviewQuestions
};
