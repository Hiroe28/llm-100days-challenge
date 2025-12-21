/**
 * app.js - メインアプリケーション
 * クイズアプリの中核ロジックを担当
 */

// ==================== 状態管理 ====================

const AppState = {
    // クイズ画面の状態
    quiz: {
        questions: [],          // 現在の出題リスト
        currentIndex: 0,        // 現在の問題インデックス
        answered: false,        // 回答済みフラグ
        selectedChoice: null,   // 選択した回答
        mode: 'random',         // 出題モード: random, tag, review
        selectedTag: null       // タグ指定モードのタグ
    },
    // 管理画面の状態
    manage: {
        questions: [],          // 問題一覧
        editingId: null,        // 編集中の問題ID
        searchQuery: '',        // 検索クエリ
        filterTag: null         // 絞り込みタグ
    },
    // タグ入力ヘルパー
    tagInput: null
};

// ==================== 初期化 ====================

/**
 * アプリケーション初期化
 */
async function initApp() {
    try {
        // データベース初期化
        await QuizDB.initDB();
        console.log('アプリケーションを初期化しました');

        // イベントリスナーを設定
        setupEventListeners();

        // キーボードショートカットを設定
        setupKeyboardShortcuts();

        // 画像モーダルのクリックイベント
        document.getElementById('image-modal')?.addEventListener('click', () => {
            QuizUI.closeImageModal();
        });

        // 管理画面を初期表示
        await refreshManageScreen();
        QuizUI.showScreen('manage-screen');

        // Service Worker登録
        registerServiceWorker();

    } catch (error) {
        console.error('初期化エラー:', error);
        QuizUI.showToast('アプリの初期化に失敗しました', 'error');
    }
}

/**
 * Service Workerを登録
 */
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('sw.js');
            console.log('Service Worker登録成功:', registration);
        } catch (error) {
            console.error('Service Worker登録失敗:', error);
        }
    }
}

// ==================== イベントリスナー ====================

/**
 * イベントリスナーを設定
 */
function setupEventListeners() {
    // ナビゲーション
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const screen = btn.dataset.screen;
            if (screen) {
                QuizUI.showScreen(screen);
                if (screen === 'quiz-screen') {
                    showQuizStart();
                } else if (screen === 'review-screen') {
                    refreshReviewScreen();
                } else if (screen === 'manage-screen') {
                    refreshManageScreen();
                }
            }
        });
    });

    // クイズ画面
    setupQuizEventListeners();

    // 復習画面
    setupReviewEventListeners();

    // 管理画面
    setupManageEventListeners();

    // インポート/エクスポート
    setupExportImportEventListeners();
}

/**
 * クイズ画面のイベントリスナー
 */
function setupQuizEventListeners() {
    // 出題モード選択
    document.getElementById('quiz-mode')?.addEventListener('change', (e) => {
        AppState.quiz.mode = e.target.value;
        const tagSelectContainer = document.getElementById('quiz-tag-select-container');
        if (tagSelectContainer) {
            tagSelectContainer.style.display = e.target.value === 'tag' ? 'block' : 'none';
        }
    });

    // クイズ開始ボタン
    document.getElementById('start-quiz-btn')?.addEventListener('click', startQuiz);

    // 選択肢ボタン
    document.querySelectorAll('.choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!AppState.quiz.answered) {
                selectChoice(btn.dataset.choice);
            }
        });
    });

    // 次へボタン
    document.getElementById('next-question-btn')?.addEventListener('click', nextQuestion);

    // スキップボタン
    document.getElementById('skip-question-btn')?.addEventListener('click', skipQuestion);

    // クイズ終了ボタン
    document.getElementById('end-quiz-btn')?.addEventListener('click', endQuiz);
}

/**
 * 復習画面のイベントリスナー
 */
function setupReviewEventListeners() {
    // 復習ソート
    document.getElementById('review-sort')?.addEventListener('change', refreshReviewScreen);

    // 復習開始ボタン
    document.getElementById('start-review-btn')?.addEventListener('click', startReview);
}

/**
 * 管理画面のイベントリスナー
 */
function setupManageEventListeners() {
    // 検索
    document.getElementById('search-input')?.addEventListener('input', (e) => {
        AppState.manage.searchQuery = e.target.value;
        filterQuestionList();
    });

    // タグ絞り込み
    document.getElementById('filter-tag')?.addEventListener('change', (e) => {
        AppState.manage.filterTag = e.target.value || null;
        filterQuestionList();
    });

    // 新規追加ボタン
    document.getElementById('add-question-btn')?.addEventListener('click', () => {
        showQuestionEditor(null);
    });

    // 保存ボタン
    document.getElementById('save-question-btn')?.addEventListener('click', saveQuestion);

    // キャンセルボタン
    document.getElementById('cancel-edit-btn')?.addEventListener('click', () => {
        hideQuestionEditor();
    });

    // 画像アップロード
    document.getElementById('image-upload')?.addEventListener('change', handleImageUpload);

    // タグ入力の初期化
    AppState.tagInput = QuizUI.initTagInput('tag-input', 'tags-container');

    // タブ切り替え
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchEditorTab(tabName);
        });
    });

    // JSON保存ボタン
    document.getElementById('save-json-btn')?.addEventListener('click', saveFromJson);

    // JSONキャンセルボタン
    document.getElementById('cancel-json-btn')?.addEventListener('click', () => {
        hideQuestionEditor();
    });

    // プレビューボタン(フォーム)
    document.getElementById('preview-form-btn')?.addEventListener('click', () => {
        updatePreview('form');
    });

    // プレビューボタン(JSON)
    document.getElementById('preview-json-btn')?.addEventListener('click', () => {
        updatePreview('json');
    });
}

/**
 * エクスポート/インポートのイベントリスナー
 */
function setupExportImportEventListeners() {
    // ZIPエクスポート
    document.getElementById('export-zip-btn')?.addEventListener('click', () => {
        QuizExport.exportToZip();
    });

    // JSONエクスポート
    document.getElementById('export-json-btn')?.addEventListener('click', () => {
        QuizExport.exportQuestionsJson();
    });

    // インポート
    document.getElementById('import-file')?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.name.endsWith('.zip')) {
            await QuizExport.importFromZip(file);
        } else if (file.name.endsWith('.json')) {
            await QuizExport.importFromJson(file);
        } else {
            QuizUI.showToast('対応していないファイル形式です', 'error');
        }

        // ファイル入力をリセット
        e.target.value = '';
    });

    // サンプルデータインポート
    document.getElementById('import-sample-btn')?.addEventListener('click', () => {
        QuizExport.importSampleData();
    });

    // 全データ削除
    document.getElementById('clear-data-btn')?.addEventListener('click', () => {
        QuizExport.clearAllData();
    });
}

/**
 * キーボードショートカット
 */
function setupKeyboardShortcuts() {
    QuizUI.setupKeyboardShortcuts({
        'A': () => selectChoiceByKey('A'),
        'B': () => selectChoiceByKey('B'),
        'C': () => selectChoiceByKey('C'),
        'D': () => selectChoiceByKey('D'),
        'N': () => {
            if (AppState.quiz.answered) {
                nextQuestion();
            }
        },
        'S': () => {
            if (!AppState.quiz.answered) {
                skipQuestion();
            }
        }
    });
}

// ==================== クイズ画面 ====================

/**
 * クイズ開始画面を表示
 */
async function showQuizStart() {
    document.getElementById('quiz-start').style.display = 'block';
    document.getElementById('quiz-content').style.display = 'none';
    document.getElementById('quiz-result').style.display = 'none';

    // タグ選択肢を更新
    const tags = await QuizDB.getAllTags();
    const tagSelect = document.getElementById('quiz-tag-select');
    if (tagSelect) {
        tagSelect.innerHTML = '<option value="">タグを選択</option>';
        tags.forEach(tag => {
            tagSelect.innerHTML += `<option value="${QuizUI.escapeHtml(tag)}">${QuizUI.escapeHtml(tag)}</option>`;
        });
    }
}

/**
 * クイズを開始
 */
async function startQuiz() {
    try {
        const mode = document.getElementById('quiz-mode')?.value || 'random';
        const tag = document.getElementById('quiz-tag-select')?.value;

        let questions = [];

        if (mode === 'tag' && tag) {
            questions = await QuizDB.getQuestionsByTag(tag);
        } else if (mode === 'review') {
            questions = await QuizDB.getReviewQuestions();
        } else {
            questions = await QuizDB.getAllQuestions();
        }

        if (questions.length === 0) {
            QuizUI.showToast('出題できる問題がありません', 'warning');
            return;
        }

        // シャッフル
        AppState.quiz.questions = QuizUI.shuffleArray(questions);
        AppState.quiz.currentIndex = 0;
        AppState.quiz.mode = mode;

        document.getElementById('quiz-start').style.display = 'none';
        document.getElementById('quiz-content').style.display = 'block';

        showCurrentQuestion();

    } catch (error) {
        console.error('クイズ開始エラー:', error);
        QuizUI.showToast('クイズの開始に失敗しました', 'error');
    }
}

/**
 * 現在の問題を表示
 */
async function showCurrentQuestion() {
    const question = AppState.quiz.questions[AppState.quiz.currentIndex];
    if (!question) {
        showQuizResult();
        return;
    }

    AppState.quiz.answered = false;
    AppState.quiz.selectedChoice = null;

    // 進捗表示
    document.getElementById('quiz-progress').textContent =
        `${AppState.quiz.currentIndex + 1} / ${AppState.quiz.questions.length}`;

    // タイトル
    document.getElementById('question-title').textContent = question.title || '問題';

    // 問題文
    const bodyEl = document.getElementById('question-body');
    QuizUI.renderContent(question.body_md, bodyEl);

    // 画像
    const imagesContainer = document.getElementById('question-images');
    imagesContainer.innerHTML = '';
    if (question.asset_ids && question.asset_ids.length > 0) {
        for (const assetId of question.asset_ids) {
            const img = await QuizUI.createImageElement(assetId);
            if (img) {
                imagesContainer.appendChild(img);
            }
        }
    }

    // 選択肢
    const choices = ['A', 'B', 'C', 'D'];
    choices.forEach(choice => {
        const btn = document.querySelector(`.choice-btn[data-choice="${choice}"]`);
        if (btn) {
            const choiceText = btn.querySelector('.choice-text');
            if (choiceText) {
                QuizUI.renderContent(question.choices[choice] || '', choiceText);
            }
            btn.className = 'choice-btn';
            btn.disabled = false;
        }
    });

    // 解説を隠す
    document.getElementById('explanation-container').style.display = 'none';

    // ボタン表示切替
    document.getElementById('next-question-btn').style.display = 'none';
    document.getElementById('skip-question-btn').style.display = 'inline-block';
}

/**
 * 選択肢を選択(クリック)
 */
async function selectChoice(choice) {
    if (AppState.quiz.answered) return;

    AppState.quiz.answered = true;
    AppState.quiz.selectedChoice = choice;

    const question = AppState.quiz.questions[AppState.quiz.currentIndex];
    const isCorrect = choice === question.answer;

    // 解答を記録
    await QuizDB.addAttempt(question.id, choice, isCorrect);
    await QuizDB.updateStats(question.id, isCorrect);

    // ボタンの色を変える
    const choices = ['A', 'B', 'C', 'D'];
    choices.forEach(c => {
        const btn = document.querySelector(`.choice-btn[data-choice="${c}"]`);
        if (btn) {
            btn.disabled = true;
            if (c === question.answer) {
                btn.classList.add('correct');
            } else if (c === choice && !isCorrect) {
                btn.classList.add('incorrect');
            }
        }
    });

    // 解説を表示
    const explanationContainer = document.getElementById('explanation-container');
    const explanationBody = document.getElementById('explanation-body');
    const resultText = document.getElementById('result-text');

    resultText.textContent = isCorrect ? '正解!' : '不正解...';
    resultText.className = isCorrect ? 'correct' : 'incorrect';

    QuizUI.renderContent(question.explanation_md || '解説はありません', explanationBody);
    explanationContainer.style.display = 'block';

    // ボタン表示切替
    document.getElementById('next-question-btn').style.display = 'inline-block';
    document.getElementById('skip-question-btn').style.display = 'none';
}

/**
 * キーボードで選択
 */
function selectChoiceByKey(choice) {
    const screen = document.getElementById('quiz-screen');
    if (screen && screen.classList.contains('active') && !AppState.quiz.answered) {
        const content = document.getElementById('quiz-content');
        if (content && content.style.display !== 'none') {
            selectChoice(choice);
        }
    }
}

/**
 * 次の問題へ
 */
function nextQuestion() {
    AppState.quiz.currentIndex++;
    if (AppState.quiz.currentIndex >= AppState.quiz.questions.length) {
        showQuizResult();
    } else {
        showCurrentQuestion();
    }
}

/**
 * 問題をスキップ
 */
function skipQuestion() {
    nextQuestion();
}

/**
 * クイズ結果を表示
 */
function showQuizResult() {
    document.getElementById('quiz-content').style.display = 'none';
    document.getElementById('quiz-result').style.display = 'block';

    const total = AppState.quiz.questions.length;
    document.getElementById('result-total').textContent = `全${total}問完了しました`;
}

/**
 * クイズを終了
 */
function endQuiz() {
    showQuizStart();
}

// ==================== 復習画面 ====================

/**
 * 復習画面を更新
 */
async function refreshReviewScreen() {
    try {
        const reviewQuestions = await QuizDB.getReviewQuestions();
        const sortBy = document.getElementById('review-sort')?.value || 'wrong_count';

        // ソート
        if (sortBy === 'recent') {
            reviewQuestions.sort((a, b) =>
                (b.stats?.last_wrong_at || 0) - (a.stats?.last_wrong_at || 0)
            );
        } else {
            reviewQuestions.sort((a, b) =>
                (b.stats?.wrong_count || 0) - (a.stats?.wrong_count || 0)
            );
        }

        const listContainer = document.getElementById('review-list');
        const countEl = document.getElementById('review-count');

        if (countEl) {
            countEl.textContent = `復習が必要な問題: ${reviewQuestions.length}件`;
        }

        if (listContainer) {
            if (reviewQuestions.length === 0) {
                listContainer.innerHTML = '<p class="empty-message">復習が必要な問題はありません</p>';
                document.getElementById('start-review-btn').style.display = 'none';
            } else {
                listContainer.innerHTML = reviewQuestions.map(q => {
                    // 問題文の抜粋(最初の50文字)
                    const bodyPreview = (q.body_md || '').replace(/[#*`$\\[\]]/g, '').slice(0, 50);
                    return `
                    <div class="review-item" data-id="${q.id}">
                        <div class="review-item-content">
                            <div class="review-item-title">${QuizUI.escapeHtml(q.title || '無題')}</div>
                            <div class="review-item-preview">${QuizUI.escapeHtml(bodyPreview)}${bodyPreview.length >= 50 ? '...' : ''}</div>
                            <div class="review-item-stats">
                                誤答: ${q.stats?.wrong_count || 0}回
                            </div>
                        </div>
                        <button class="btn btn-small btn-complete-review" onclick="completeReview('${q.id}')">
                            復習完了
                        </button>
                    </div>
                `}).join('');
                document.getElementById('start-review-btn').style.display = 'inline-block';
            }
        }

        // 復習問題を状態に保存
        AppState.quiz.questions = reviewQuestions;

    } catch (error) {
        console.error('復習画面の更新エラー:', error);
        QuizUI.showToast('復習データの取得に失敗しました', 'error');
    }
}

/**
 * 復習を開始
 */
function startReview() {
    if (AppState.quiz.questions.length === 0) {
        QuizUI.showToast('復習が必要な問題がありません', 'info');
        return;
    }

    AppState.quiz.currentIndex = 0;
    AppState.quiz.mode = 'review';

    QuizUI.showScreen('quiz-screen');
    document.getElementById('quiz-start').style.display = 'none';
    document.getElementById('quiz-content').style.display = 'block';

    showCurrentQuestion();
}

/**
 * 復習を完了(リストから削除)
 */
async function completeReview(questionId) {
    try {
        await QuizDB.resetStats(questionId);
        QuizUI.showToast('復習完了しました', 'success');
        await refreshReviewScreen();
    } catch (error) {
        console.error('復習完了エラー:', error);
        QuizUI.showToast('エラーが発生しました', 'error');
    }
}

// ==================== 管理画面 ====================

/**
 * 管理画面を更新
 */
async function refreshManageScreen() {
    try {
        const questions = await QuizDB.getAllQuestions();
        AppState.manage.questions = questions;

        // タグ選択肢を更新
        const tags = await QuizDB.getAllTags();
        const filterTag = document.getElementById('filter-tag');
        if (filterTag) {
            const currentValue = filterTag.value;
            filterTag.innerHTML = '<option value="">全てのタグ</option>';
            tags.forEach(tag => {
                filterTag.innerHTML += `<option value="${QuizUI.escapeHtml(tag)}">${QuizUI.escapeHtml(tag)}</option>`;
            });
            filterTag.value = currentValue;
        }

        // 問題数を表示
        document.getElementById('question-count').textContent = `全${questions.length}問`;

        // リストを表示
        filterQuestionList();

    } catch (error) {
        console.error('管理画面の更新エラー:', error);
        QuizUI.showToast('問題一覧の取得に失敗しました', 'error');
    }
}

/**
 * 問題リストをフィルタリング
 */
function filterQuestionList() {
    let questions = [...AppState.manage.questions];

    // タグ絞り込み
    if (AppState.manage.filterTag) {
        questions = questions.filter(q =>
            q.tags && q.tags.includes(AppState.manage.filterTag)
        );
    }

    // 検索
    if (AppState.manage.searchQuery) {
        const query = AppState.manage.searchQuery.toLowerCase();
        questions = questions.filter(q =>
            (q.title && q.title.toLowerCase().includes(query)) ||
            (q.body_md && q.body_md.toLowerCase().includes(query))
        );
    }

    // ソート(更新日時の降順)
    questions.sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));

    // 表示
    const listContainer = document.getElementById('question-list');
    if (listContainer) {
        if (questions.length === 0) {
            listContainer.innerHTML = '<p class="empty-message">問題がありません</p>';
        } else {
            listContainer.innerHTML = questions.map(q => `
                <div class="question-item" data-id="${q.id}">
                    <div class="question-item-content">
                        <div class="question-item-title">${QuizUI.escapeHtml(q.title || '無題')}</div>
                        <div class="question-item-tags">
                            ${(q.tags || []).map(tag => `<span class="tag-small">${QuizUI.escapeHtml(tag)}</span>`).join('')}
                        </div>
                    </div>
                    <div class="question-item-actions">
                        <button class="btn btn-small btn-edit" onclick="editQuestion('${q.id}')">編集</button>
                        <button class="btn btn-small btn-danger" onclick="deleteQuestionConfirm('${q.id}')">削除</button>
                    </div>
                </div>
            `).join('');
        }
    }
}

/**
 * 問題エディタを表示
 */
async function showQuestionEditor(questionId) {
    AppState.manage.editingId = questionId;

    const editorTitle = document.getElementById('editor-title');
    const form = document.getElementById('question-form');
    const jsonInput = document.getElementById('json-input');

    // フォームをリセット
    form.reset();
    document.getElementById('uploaded-images').innerHTML = '';
    AppState.tagInput?.clear();
    if (jsonInput) jsonInput.value = '';
    
    // プレビューを非表示
    document.getElementById('form-preview-area').style.display = 'none';
    document.getElementById('json-preview-area').style.display = 'none';

    if (questionId) {
        // 編集モード
        editorTitle.textContent = '問題を編集';
        const question = await QuizDB.getQuestion(questionId);

        if (question) {
            // フォーム入力タブにデータを設定
            document.getElementById('q-title').value = question.title || '';
            document.getElementById('q-body').value = question.body_md || '';
            document.getElementById('q-choice-a').value = question.choices?.A || '';
            document.getElementById('q-choice-b').value = question.choices?.B || '';
            document.getElementById('q-choice-c').value = question.choices?.C || '';
            document.getElementById('q-choice-d').value = question.choices?.D || '';
            document.getElementById('q-answer').value = question.answer || 'A';
            document.getElementById('q-explanation').value = question.explanation_md || '';

            // タグを設定
            AppState.tagInput?.setTags(question.tags || []);

            // 画像を表示
            if (question.asset_ids && question.asset_ids.length > 0) {
                const container = document.getElementById('uploaded-images');
                for (const assetId of question.asset_ids) {
                    const url = await QuizUI.getAssetUrl(assetId);
                    if (url) {
                        const div = document.createElement('div');
                        div.className = 'uploaded-image-item';
                        div.dataset.assetId = assetId;
                        div.innerHTML = `
                            <img src="${url}" alt="アップロード画像">
                            <button type="button" class="remove-image-btn" onclick="removeUploadedImage('${assetId}')">&times;</button>
                        `;
                        container.appendChild(div);
                    }
                }
            }

            // JSON入力タブにもデータを設定
            if (jsonInput) {
                const jsonData = {
                    title: question.title || '',
                    body_md: question.body_md || '',
                    choices: question.choices || { A: '', B: '', C: '', D: '' },
                    answer: question.answer || 'A',
                    explanation_md: question.explanation_md || '',
                    tags: question.tags || []
                };
                jsonInput.value = JSON.stringify(jsonData, null, 2);
            }
        }
    } else {
        // 新規作成モード
        editorTitle.textContent = '問題を追加';
    }

    document.getElementById('question-editor').style.display = 'block';
    document.getElementById('question-list-container').style.display = 'none';
    
    // JSONボタンのラベルを更新
    const saveJsonBtn = document.getElementById('save-json-btn');
    if (saveJsonBtn) {
        if (questionId) {
            saveJsonBtn.textContent = '更新';
        } else {
            saveJsonBtn.textContent = 'JSONから追加';
        }
    }
}

/**
 * 問題エディタを非表示
 */
function hideQuestionEditor() {
    document.getElementById('question-editor').style.display = 'none';
    document.getElementById('question-list-container').style.display = 'block';
    AppState.manage.editingId = null;
    // タブをリセット
    switchEditorTab('form');
    // JSONインput をクリア
    const jsonInput = document.getElementById('json-input');
    if (jsonInput) jsonInput.value = '';
    // プレビューを非表示
    document.getElementById('form-preview-area').style.display = 'none';
    document.getElementById('json-preview-area').style.display = 'none';
}


/**
 * エディタのタブを切り替え
 */
function switchEditorTab(tabName) {
    // タブボタンの状態を更新
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // タブコンテンツの表示を切り替え
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.dataset.tab === tabName);
    });

    // JSONInputモードのボタンテキストを更新
    const saveJsonBtn = document.getElementById('save-json-btn');
    if (saveJsonBtn) {
        if (AppState.manage.editingId) {
            saveJsonBtn.textContent = '更新';
        } else {
            saveJsonBtn.textContent = 'JSONから追加';
        }
    }
}


/**
 * JSONから問題を追加/更新
 */
async function saveFromJson() {
    try {
        const jsonInput = document.getElementById('json-input');
        const jsonText = jsonInput?.value.trim();

        if (!jsonText) {
            QuizUI.showToast('JSONを入力してください', 'error');
            return;
        }

        let data;
        try {
            data = JSON.parse(jsonText);
        } catch (e) {
            QuizUI.showToast('JSONの形式が正しくありません: ' + e.message, 'error');
            return;
        }

        // 編集モードかどうかをチェック
        if (AppState.manage.editingId) {
            // ========== 更新モード(単一の問題のみ) ==========
            
            // 配列が渡された場合はエラー
            if (Array.isArray(data)) {
                QuizUI.showToast('編集モードでは単一の問題のみ更新できます', 'error');
                return;
            }
            
            // バリデーション
            if (!data.body_md && !data.title) {
                QuizUI.showToast('問題文またはタイトルが必要です', 'error');
                return;
            }
            
            // 既存の問題を更新
            await QuizDB.updateQuestion(AppState.manage.editingId, data);
            QuizUI.showToast('問題を更新しました', 'success');
            
        } else {
            // ========== 新規追加モード ==========
            
            // 配列でない場合は配列に変換
            const questions = Array.isArray(data) ? data : [data];

            // バリデーション
            for (const q of questions) {
                if (!q.body_md && !q.title) {
                    QuizUI.showToast('問題文またはタイトルが必要です', 'error');
                    return;
                }
            }

            // 問題を追加
            let addedCount = 0;
            for (const q of questions) {
                try {
                    await QuizDB.addQuestionWithId(q);
                    addedCount++;
                } catch (error) {
                    console.error('問題の追加エラー:', error);
                }
            }

            QuizUI.showToast(`${addedCount}件の問題を追加しました`, 'success');
        }
        
        // エディタを閉じて画面を更新
        hideQuestionEditor();
        await refreshManageScreen();

    } catch (error) {
        console.error('JSON保存エラー:', error);
        QuizUI.showToast('保存に失敗しました: ' + error.message, 'error');
    }
}

/**
 * 画像をアップロード
 */
async function handleImageUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const container = document.getElementById('uploaded-images');

    for (const file of files) {
        if (!file.type.startsWith('image/')) {
            QuizUI.showToast('画像ファイルのみアップロードできます', 'error');
            continue;
        }

        // サイズチェック(10MB上限)
        if (file.size > 10 * 1024 * 1024) {
            QuizUI.showToast('画像サイズは10MB以下にしてください', 'error');
            continue;
        }

        try {
            const asset = await QuizDB.addAsset(file, file.name);
            const url = await QuizUI.getAssetUrl(asset.id);

            const div = document.createElement('div');
            div.className = 'uploaded-image-item';
            div.dataset.assetId = asset.id;
            div.innerHTML = `
                <img src="${url}" alt="アップロード画像">
                <button type="button" class="remove-image-btn" onclick="removeUploadedImage('${asset.id}')">&times;</button>
            `;
            container.appendChild(div);

        } catch (error) {
            console.error('画像アップロードエラー:', error);
            QuizUI.showToast('画像のアップロードに失敗しました', 'error');
        }
    }

    // 入力をリセット
    event.target.value = '';
}

/**
 * アップロード画像を削除
 */
async function removeUploadedImage(assetId) {
    const item = document.querySelector(`.uploaded-image-item[data-asset-id="${assetId}"]`);
    if (item) {
        item.remove();
    }
    // 注: 実際のアセットは問題保存時に整理する
}

/**
 * 問題を保存
 */
async function saveQuestion() {
    try {
        const title = document.getElementById('q-title').value.trim();
        const body_md = document.getElementById('q-body').value.trim();
        const choiceA = document.getElementById('q-choice-a').value.trim();
        const choiceB = document.getElementById('q-choice-b').value.trim();
        const choiceC = document.getElementById('q-choice-c').value.trim();
        const choiceD = document.getElementById('q-choice-d').value.trim();
        const answer = document.getElementById('q-answer').value;
        const explanation_md = document.getElementById('q-explanation').value.trim();
        const tags = AppState.tagInput?.getTags() || [];

        // バリデーション
        if (!body_md) {
            QuizUI.showToast('問題文を入力してください', 'error');
            return;
        }

        // アップロードされた画像のIDを取得
        const asset_ids = [];
        document.querySelectorAll('.uploaded-image-item').forEach(item => {
            asset_ids.push(item.dataset.assetId);
        });

        const questionData = {
            title,
            body_md,
            choices: { A: choiceA, B: choiceB, C: choiceC, D: choiceD },
            answer,
            explanation_md,
            tags,
            asset_ids
        };

        if (AppState.manage.editingId) {
            // 更新
            await QuizDB.updateQuestion(AppState.manage.editingId, questionData);
            QuizUI.showToast('問題を更新しました', 'success');
        } else {
            // 新規追加
            await QuizDB.addQuestion(questionData);
            QuizUI.showToast('問題を追加しました', 'success');
        }

        hideQuestionEditor();
        await refreshManageScreen();

    } catch (error) {
        console.error('保存エラー:', error);
        QuizUI.showToast('保存に失敗しました', 'error');
    }
}

/**
 * 問題を編集
 */
function editQuestion(id) {
    showQuestionEditor(id);
}

/**
 * 問題削除の確認
 */
async function deleteQuestionConfirm(id) {
    const confirmed = await QuizUI.showConfirm('この問題を削除しますか?');
    if (confirmed) {
        try {
            await QuizDB.deleteQuestion(id);
            QuizUI.showToast('問題を削除しました', 'success');
            await refreshManageScreen();
        } catch (error) {
            console.error('削除エラー:', error);
            QuizUI.showToast('削除に失敗しました', 'error');
        }
    }
}

/**
 * プレビューを更新
 * @param {string} mode - 'form' または 'json'
 */
async function updatePreview(mode) {
    try {
        let questionData = null;
        let previewPrefix = '';

        if (mode === 'form') {
            questionData = getQuestionDataFromForm();
            previewPrefix = 'form-preview';
            const previewArea = document.getElementById('form-preview-area');
            if (previewArea) {
                previewArea.style.display = 'block';
            }
        } else if (mode === 'json') {
            questionData = getQuestionDataFromJson();
            previewPrefix = 'json-preview';
            const previewArea = document.getElementById('json-preview-area');
            if (previewArea) {
                previewArea.style.display = 'block';
            }
        }

        if (!questionData) {
            QuizUI.showToast('プレビューデータを取得できませんでした', 'warning');
            return;
        }

        // プレビューをレンダリング
        await renderPreview(questionData, previewPrefix);

    } catch (error) {
        console.error('プレビュー更新エラー:', error);
        QuizUI.showToast('プレビューの更新に失敗しました: ' + error.message, 'error');
    }
}

/**
 * フォーム入力から問題データを取得
 */
function getQuestionDataFromForm() {
    return {
        title: document.getElementById('q-title')?.value || '',
        body_md: document.getElementById('q-body')?.value || '',
        choices: {
            A: document.getElementById('q-choice-a')?.value || '',
            B: document.getElementById('q-choice-b')?.value || '',
            C: document.getElementById('q-choice-c')?.value || '',
            D: document.getElementById('q-choice-d')?.value || ''
        },
        answer: document.getElementById('q-answer')?.value || 'A',
        explanation_md: document.getElementById('q-explanation')?.value || '',
        tags: AppState.tagInput?.getTags() || [],
        asset_ids: Array.from(document.querySelectorAll('.uploaded-image-item')).map(item => item.dataset.assetId)
    };
}

/**
 * JSON入力から問題データを取得
 */
function getQuestionDataFromJson() {
    const jsonInput = document.getElementById('json-input');
    const jsonText = jsonInput?.value.trim();

    if (!jsonText) {
        return null;
    }

    try {
        const data = JSON.parse(jsonText);
        
        // 配列の場合は最初の要素を使用
        if (Array.isArray(data)) {
            if (data.length === 0) return null;
            return data[0];
        }
        
        return data;
    } catch (error) {
        console.error('JSON解析エラー:', error);
        return null;
    }
}

/**
 * プレビューをレンダリング
 * @param {Object} questionData - 問題データ
 * @param {string} prefix - IDのプレフィックス ('form-preview' または 'json-preview')
 */
async function renderPreview(questionData, prefix) {
    // タイトル
    const titleEl = document.getElementById(`${prefix}-title`);
    if (titleEl) {
        titleEl.textContent = questionData.title || '問題タイトル';
    }

    // 問題文
    const bodyEl = document.getElementById(`${prefix}-body`);
    if (bodyEl) {
        QuizUI.renderContent(questionData.body_md || '', bodyEl);
    }

    // 画像
    const imagesContainer = document.getElementById(`${prefix}-images`);
    if (imagesContainer) {
        imagesContainer.innerHTML = '';
        if (questionData.asset_ids && questionData.asset_ids.length > 0) {
            for (const assetId of questionData.asset_ids) {
                const img = await QuizUI.createImageElement(assetId, 'preview-image');
                if (img) {
                    imagesContainer.appendChild(img);
                }
            }
        }
    }

    // 選択肢
    const choices = ['A', 'B', 'C', 'D'];
    choices.forEach(choice => {
        const choiceEl = document.getElementById(`${prefix}-choice-${choice.toLowerCase()}`);
        if (choiceEl) {
            QuizUI.renderContent(questionData.choices?.[choice] || '', choiceEl);
        }
    });

    // 正解
    const answerEl = document.getElementById(`${prefix}-answer`);
    if (answerEl) {
        answerEl.textContent = questionData.answer || 'A';
    }

    // 解説
    const explanationEl = document.getElementById(`${prefix}-explanation`);
    if (explanationEl) {
        QuizUI.renderContent(questionData.explanation_md || '解説はありません', explanationEl);
    }

    // タグ
    const tagsEl = document.getElementById(`${prefix}-tags-list`);
    if (tagsEl) {
        if (questionData.tags && questionData.tags.length > 0) {
            tagsEl.innerHTML = questionData.tags.map(tag => 
                `<span class="tag-small">${QuizUI.escapeHtml(tag)}</span>`
            ).join(' ');
        } else {
            tagsEl.textContent = 'なし';
        }
    }
}

// ==================== グローバル関数をエクスポート ====================

window.refreshManageScreen = refreshManageScreen;
window.editQuestion = editQuestion;
window.deleteQuestionConfirm = deleteQuestionConfirm;
window.removeUploadedImage = removeUploadedImage;
window.completeReview = completeReview;

// ==================== 初期化実行 ====================

document.addEventListener('DOMContentLoaded', initApp);