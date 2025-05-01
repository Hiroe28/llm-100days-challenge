// 迷路を解くAIくん - Q学習アルゴリズムによる強化学習
document.addEventListener('DOMContentLoaded', () => {
    // DOM要素
    const mazeElement = document.getElementById('maze');
    const aiCharacter = document.getElementById('ai-character');
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const speedSlider = document.getElementById('speed-slider');
    const episodeCountElement = document.getElementById('episode-count');
    const stepCountElement = document.getElementById('step-count');
    const successCountElement = document.getElementById('success-count');
    const toggleHeatmapBtn = document.getElementById('toggle-heatmap-btn');
    const toggleArrowsBtn = document.getElementById('toggle-arrows-btn');
    const qTableVisualization = document.getElementById('q-table-visualization');
    const mouth = document.querySelector('.mouth');
    const epsilonValueElement = document.getElementById('epsilon-value');

    // Q学習のパラメータ
    const learningRate = 0.1;       // 学習率
    const discountFactor = 0.9;     // 割引率
    let epsilon = 1.0;              // 初期探索率（減衰していく）
    const minEpsilon = 0.05;        // 最小探索率
    const decayRate = 0.995;        // 減衰率
    const maxEpisodes = 1000;       // 最大エピソード数
    const stepsLimit = 150;         // 1エピソードの最大ステップ数

    // 迷路の設定
    const mazeRows = 10;
    const mazeCols = 10;
    // 0: 通路, 1: 壁
    const mazeLayout = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 0, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 0, 1, 1, 0, 1],
        [0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
        [0, 1, 0, 1, 1, 1, 0, 1, 1, 0],
        [0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ];

    // スタートとゴールの位置
    const startPosition = { row: 0, col: 0 };
    const goalPosition = { row: 9, col: 9 };

    // 状態と行動
    let currentPosition = { ...startPosition };
    const actions = [
        { name: 'up', rowDelta: -1, colDelta: 0 },
        { name: 'right', rowDelta: 0, colDelta: 1 },
        { name: 'down', rowDelta: 1, colDelta: 0 },
        { name: 'left', rowDelta: 0, colDelta: -1 }
    ];

    // Q値テーブル
    let qTable = {};

    // 学習状態
    let isLearning = false;
    let episode = 0;
    let step = 0;
    let successCount = 0;
    let bestSteps = Infinity;  // 最良のステップ数を記録
    let learningInterval;
    let visualizationType = 'none'; // 'none', 'heatmap', 'arrows'

    // 学習スピード（ミリ秒、小さいほど速い）
    let learningSpeed = 200;

    // 統計データ
    let episodeStats = {
        steps: [],         // エピソードごとのステップ数
        rewards: [],       // エピソードごとの累積報酬
        successes: []      // エピソードごとの成功回数（0または1）
    };
    let episodeReward = 0; // 現在のエピソードの累積報酬

    // 初期化
    initializeMaze();
    initializeQTable();
    updateQTableVisualization();
    positionAICharacter(currentPosition);
    updateEpsilonDisplay();

    // イベントリスナー
    startBtn.addEventListener('click', toggleLearning);
    resetBtn.addEventListener('click', resetLearning);
    speedSlider.addEventListener('input', updateLearningSpeed);
    toggleHeatmapBtn.addEventListener('click', () => toggleVisualization('heatmap'));
    toggleArrowsBtn.addEventListener('click', () => toggleVisualization('arrows'));

    // 迷路を初期化
    function initializeMaze() {
        mazeElement.innerHTML = '';
        mazeElement.style.gridTemplateRows = `repeat(${mazeRows}, var(--cell-size))`;
        mazeElement.style.gridTemplateColumns = `repeat(${mazeCols}, var(--cell-size))`;

        for (let row = 0; row < mazeRows; row++) {
            for (let col = 0; col < mazeCols; col++) {
                const cell = document.createElement('div');
                cell.className = 'maze-cell';
                cell.id = `cell-${row}-${col}`;
                
                if (row === startPosition.row && col === startPosition.col) {
                    cell.classList.add('start');
                } else if (row === goalPosition.row && col === goalPosition.col) {
                    cell.classList.add('goal');
                } else if (mazeLayout[row][col] === 1) {
                    cell.classList.add('wall');
                } else {
                    cell.classList.add('path');
                }
                
                mazeElement.appendChild(cell);
            }
        }
    }

    // Q値テーブルを初期化
    function initializeQTable() {
        qTable = {};
        for (let row = 0; row < mazeRows; row++) {
            for (let col = 0; col < mazeCols; col++) {
                if (mazeLayout[row][col] === 1) continue; // 壁はスキップ
                
                const state = `${row},${col}`;
                qTable[state] = {};
                
                for (const action of actions) {
                    // 行動後の新しい位置を計算
                    const newRow = row + action.rowDelta;
                    const newCol = col + action.colDelta;
                    
                    // 壁方向かどうかをチェック
                    if (
                        newRow < 0 || newRow >= mazeRows ||
                        newCol < 0 || newCol >= mazeCols ||
                        mazeLayout[newRow][newCol] === 1
                    ) {
                        // 壁方向には大きなマイナス値
                        qTable[state][action.name] = -10;
                    } else {
                        // 通常の方向は0で初期化
                        qTable[state][action.name] = 0;
                    }
                }
            }
        }
    }

    // AIキャラクターの位置を更新
    function positionAICharacter(position) {
        const cell = document.getElementById(`cell-${position.row}-${position.col}`);
        if (cell) {
            const cellRect = cell.getBoundingClientRect();
            const mazeRect = mazeElement.getBoundingClientRect();
            
            // マス目の中央に配置
            const x = cell.offsetLeft + (cell.offsetWidth - aiCharacter.offsetWidth) / 2;
            const y = cell.offsetTop + (cell.offsetHeight - aiCharacter.offsetHeight) / 2;
            
            aiCharacter.style.left = `${x}px`;
            aiCharacter.style.top = `${y}px`;
        }
    }

    // 利用可能な行動を取得
    function getAvailableActions(position) {
        const availableActions = [];
        
        for (const action of actions) {
            const newRow = position.row + action.rowDelta;
            const newCol = position.col + action.colDelta;
            
            // 有効な移動先か確認（迷路の範囲内、壁ではない）
            if (
                newRow >= 0 && newRow < mazeRows &&
                newCol >= 0 && newCol < mazeCols &&
                mazeLayout[newRow][newCol] !== 1
            ) {
                availableActions.push(action);
            }
        }
        
        return availableActions;
    }

    // 行動を選択（ε-greedy法、減衰付き）
    function selectAction(position) {
        const state = `${position.row},${position.col}`;
        const availableActions = getAvailableActions(position);
        
        // ランダムに探索するか、最良の行動を取るか
        if (Math.random() < epsilon) {
            // ランダムに行動を選択（探索）
            const randomIndex = Math.floor(Math.random() * availableActions.length);
            return availableActions[randomIndex];
        } else {
            // 最良の行動を選択（活用）
            let bestAction = availableActions[0];
            let bestValue = qTable[state][bestAction.name];
            
            for (let i = 1; i < availableActions.length; i++) {
                const action = availableActions[i];
                if (qTable[state][action.name] > bestValue) {
                    bestValue = qTable[state][action.name];
                    bestAction = action;
                }
            }
            
            return bestAction;
        }
    }

    // 行動を実行し、新しい状態と報酬を取得
    function takeAction(position, action) {
        const newPosition = {
            row: position.row + action.rowDelta,
            col: position.col + action.colDelta
        };
        
        // マンハッタン距離（ゴールまでの距離）
        const oldDist = Math.abs(goalPosition.row - position.row) + 
                       Math.abs(goalPosition.col - position.col);
        const newDist = Math.abs(goalPosition.row - newPosition.row) + 
                       Math.abs(goalPosition.col - newPosition.col);
        
        // 報酬の設定
        let reward = -1.0;  // 基本の移動コスト（大きめに）
        
        // 距離に基づく報酬
        if (newDist < oldDist) {
            // ゴールに近づいた
            reward += 0.5;
        } else if (newDist > oldDist) {
            // ゴールから遠ざかった
            reward -= 0.5;
        }
        
        // ゴールに到達した場合、大きな報酬
        if (newPosition.row === goalPosition.row && newPosition.col === goalPosition.col) {
            reward = 50;
        }
        
        return { newPosition, reward };
    }

    // Q値を更新
    function updateQValue(state, action, reward, nextState) {
        const currentQValue = qTable[state][action];
        
        // 次の状態での最大Q値を取得
        let maxNextQValue = -Infinity;
        for (const actionName in qTable[nextState]) {
            maxNextQValue = Math.max(maxNextQValue, qTable[nextState][actionName]);
        }
        
        // Q値の更新式: Q(s,a) = Q(s,a) + α * [r + γ * max(Q(s',a')) - Q(s,a)]
        const newQValue = currentQValue + learningRate * (reward + discountFactor * maxNextQValue - currentQValue);
        qTable[state][action] = newQValue;
    }

    // 学習を1ステップ進める
    function learningStep() {
        if (!isLearning) return;
        
        const state = `${currentPosition.row},${currentPosition.col}`;
        const action = selectAction(currentPosition);
        const { newPosition, reward } = takeAction(currentPosition, action);
        const nextState = `${newPosition.row},${newPosition.col}`;
        
        // Q値を更新
        updateQValue(state, action.name, reward, nextState);
        
        // 累積報酬を更新
        episodeReward += reward;
        
        // AIキャラクターを移動
        currentPosition = newPosition;
        positionAICharacter(currentPosition);
        
        // 表情の更新
        updateMood('thinking');
        
        // ステップカウントを更新
        step++;
        stepCountElement.textContent = step;
        
        // Q値の可視化を更新
        updateQTableVisualization();
        if (visualizationType !== 'none') {
            updateCellVisualization();
        }
        
        // ゴールに到達したか確認
        if (currentPosition.row === goalPosition.row && currentPosition.col === goalPosition.col) {
            // 成功！
            successCount++;
            successCountElement.textContent = successCount;
            updateMood('success');
            
            // 統計データを記録
            episodeStats.steps.push(step);
            episodeStats.rewards.push(episodeReward);
            episodeStats.successes.push(1);
            
            // 最良のステップ数を更新
            bestSteps = Math.min(bestSteps, step);
            
            // 新しいエピソードを開始
            setTimeout(() => {
                episode++;
                episodeCountElement.textContent = episode;
                
                // εを減衰
                epsilon = Math.max(minEpsilon, epsilon * decayRate);
                updateEpsilonDisplay();
                
                startNewEpisode();
                
                // 最大エピソード数に達したら終了
                if (episode >= maxEpisodes) {
                    isLearning = false;
                    startBtn.textContent = 'スタート';
                    clearInterval(learningInterval);
                }
            }, learningSpeed * 2);
        } else if (step >= stepsLimit || (bestSteps !== Infinity && step > bestSteps * 2)) {
            // ステップ制限に達したまたは最良記録の2倍を超えたら失敗
            updateMood('failure');
            
            // 失敗時に大きなペナルティを与え、Q値を更新
            const failureReward = -20;
            episodeReward += failureReward;
            updateQValue(state, action.name, failureReward, nextState);
            
            // 統計データを記録
            episodeStats.steps.push(step);
            episodeStats.rewards.push(episodeReward);
            episodeStats.successes.push(0);
            
            // 新しいエピソードを開始
            setTimeout(() => {
                episode++;
                episodeCountElement.textContent = episode;
                
                // εを減衰
                epsilon = Math.max(minEpsilon, epsilon * decayRate);
                updateEpsilonDisplay();
                
                startNewEpisode();
                
                // 最大エピソード数に達したら終了
                if (episode >= maxEpisodes) {
                    isLearning = false;
                    startBtn.textContent = 'スタート';
                    clearInterval(learningInterval);
                }
            }, learningSpeed * 2);
        }
    }

    // εの表示を更新
    function updateEpsilonDisplay() {
        if (epsilonValueElement) {
            epsilonValueElement.textContent = epsilon.toFixed(2);
        }
    }

    // 新しいエピソードを開始
    function startNewEpisode() {
        currentPosition = { ...startPosition };
        positionAICharacter(currentPosition);
        step = 0;
        stepCountElement.textContent = step;
        episodeReward = 0;
        updateMood('thinking');
    }

    // 学習の開始/停止
    function toggleLearning() {
        isLearning = !isLearning;
        
        if (isLearning) {
            startBtn.textContent = '一時停止';
            aiCharacter.classList.add('thinking');
            
            // 定期的に学習ステップを実行
            learningInterval = setInterval(learningStep, learningSpeed);
        } else {
            startBtn.textContent = 'スタート';
            aiCharacter.classList.remove('thinking');
            clearInterval(learningInterval);
        }
    }

    // 学習のリセット
    function resetLearning() {
        isLearning = false;
        startBtn.textContent = 'スタート';
        clearInterval(learningInterval);
        
        episode = 0;
        step = 0;
        successCount = 0;
        bestSteps = Infinity;
        epsilon = 1.0;
        
        episodeCountElement.textContent = episode;
        stepCountElement.textContent = step;
        successCountElement.textContent = successCount;
        updateEpsilonDisplay();
        
        // 統計データをリセット
        episodeStats = {
            steps: [],
            rewards: [],
            successes: []
        };
        episodeReward = 0;
        
        // Q値テーブルを初期化
        initializeQTable();
        updateQTableVisualization();
        
        // AIキャラクターの位置リセット
        currentPosition = { ...startPosition };
        positionAICharacter(currentPosition);
        
        // 表情リセット
        updateMood('thinking');
        
        // 可視化をリセット
        clearCellVisualization();
    }

    // 学習スピードの更新
    function updateLearningSpeed() {
        const speedValue = parseInt(speedSlider.value);
        learningSpeed = 600 - (speedValue * 50); // 1-10のスライダー値を550-50msの範囲にマッピング
        
        if (isLearning) {
            clearInterval(learningInterval);
            learningInterval = setInterval(learningStep, learningSpeed);
        }
    }

    // 可視化タイプの切り替え
    function toggleVisualization(type) {
        clearCellVisualization();
        
        if (visualizationType === type) {
            visualizationType = 'none';
            toggleHeatmapBtn.classList.remove('primary');
            toggleArrowsBtn.classList.remove('primary');
        } else {
            visualizationType = type;
            
            if (type === 'heatmap') {
                toggleHeatmapBtn.classList.add('primary');
                toggleArrowsBtn.classList.remove('primary');
            } else {
                toggleHeatmapBtn.classList.remove('primary');
                toggleArrowsBtn.classList.add('primary');
            }
            
            updateCellVisualization();
        }
    }

    // セルの可視化をクリア
    function clearCellVisualization() {
        // ヒートマップクラスを削除
        for (let i = 0; i < 10; i++) {
            const cells = document.querySelectorAll(`.heatmap-${i}`);
            cells.forEach(cell => cell.classList.remove(`heatmap-${i}`));
        }
        
        // 負の値のヒートマップクラスも削除
        for (let i = 0; i < 10; i++) {
            const cells = document.querySelectorAll(`.heatmap-neg-${i}`);
            cells.forEach(cell => cell.classList.remove(`heatmap-neg-${i}`));
        }
        
        // 矢印を削除
        const arrows = document.querySelectorAll('.arrow');
        arrows.forEach(arrow => arrow.remove());
    }

    // セルの可視化を更新
    function updateCellVisualization() {
        clearCellVisualization();
        
        // 最大・最小Q値を計算（正規化用）
        let maxQValue = -Infinity;
        let minQValue = Infinity;
        let maxAbsValue = 0;
        
        for (let row = 0; row < mazeRows; row++) {
            for (let col = 0; col < mazeCols; col++) {
                if (mazeLayout[row][col] === 1) continue; // 壁はスキップ
                if (row === startPosition.row && col === startPosition.col) continue; // スタートはスキップ
                if (row === goalPosition.row && col === goalPosition.col) continue; // ゴールはスキップ
                
                const state = `${row},${col}`;
                
                // 最大Q値を見つける
                let cellMaxQ = -Infinity;
                for (const actionName in qTable[state]) {
                    cellMaxQ = Math.max(cellMaxQ, qTable[state][actionName]);
                    maxQValue = Math.max(maxQValue, qTable[state][actionName]);
                    minQValue = Math.min(minQValue, qTable[state][actionName]);
                    maxAbsValue = Math.max(maxAbsValue, Math.abs(qTable[state][actionName]));
                }
            }
        }
        
        for (let row = 0; row < mazeRows; row++) {
            for (let col = 0; col < mazeCols; col++) {
                if (mazeLayout[row][col] === 1) continue; // 壁はスキップ
                if (row === startPosition.row && col === startPosition.col) continue; // スタートはスキップ
                if (row === goalPosition.row && col === goalPosition.col) continue; // ゴールはスキップ
                
                const state = `${row},${col}`;
                const cell = document.getElementById(`cell-${row}-${col}`);
                
                if (visualizationType === 'heatmap') {
                    // 最大Q値を見つける
                    let maxCellQValue = -Infinity;
                    for (const actionName in qTable[state]) {
                        maxCellQValue = Math.max(maxCellQValue, qTable[state][actionName]);
                    }
                    
                    // 最大Q値を-1〜1の範囲に正規化し、ヒートマップレベルを決定
                    if (maxCellQValue > 0) {
                        // 正の値： 青→緑→黄→オレンジ→赤
                        const normalizedValue = Math.min(maxCellQValue / Math.max(1, maxQValue), 1);
                        const heatLevel = Math.min(Math.floor(normalizedValue * 9), 9);
                        cell.classList.add(`heatmap-${heatLevel}`);
                    } else {
                        // 負の値： 青→紺→紫
                        const normalizedValue = Math.min(Math.abs(maxCellQValue) / Math.max(1, Math.abs(minQValue)), 1);
                        const heatLevel = Math.min(Math.floor(normalizedValue * 9), 9);
                        cell.classList.add(`heatmap-neg-${heatLevel}`);
                    }
                } else if (visualizationType === 'arrows') {
                    // 最も高いQ値を持つ行動を見つける
                    let bestAction = null;
                    let bestValue = -Infinity;
                    
                    for (const actionName in qTable[state]) {
                        if (qTable[state][actionName] > bestValue) {
                            bestValue = qTable[state][actionName];
                            bestAction = actionName;
                        }
                    }
                    
                    // 最大のQ値を持つ行動を矢印で表示（マイナスでも表示）
                    if (bestAction) {
                        const arrow = document.createElement('div');
                        arrow.className = `arrow arrow-${bestAction}`;
                        
                        // Q値の絶対値に基づいて矢印の不透明度を調整（値が高いほど濃く）
                        const absValue = Math.abs(bestValue);
                        let opacity = Math.min(1, absValue / Math.max(1, maxAbsValue));
                        opacity = Math.max(0.2, opacity); // 最小不透明度
                        arrow.style.opacity = opacity;
                        
                        // Q値の符号に基づいて矢印の色を変更
                        if (bestValue > 0) {
                            arrow.style.borderColor = 'var(--primary-color)';
                        } else {
                            arrow.style.borderColor = 'var(--danger-color)';
                        }
                        
                        cell.appendChild(arrow);
                    }
                }
            }
        }
    }

    // Qテーブルの可視化を更新
    function updateQTableVisualization() {
        qTableVisualization.innerHTML = '';
        
        // 現在の状態のQ値のみを表示
        const state = `${currentPosition.row},${currentPosition.col}`;
        const stateQValues = qTable[state];
        
        // 利用可能な行動を取得
        const availableActions = getAvailableActions(currentPosition);
        const availableActionNames = availableActions.map(action => action.name);
        
        for (const actionName in stateQValues) {
            const qCell = document.createElement('div');
            qCell.className = 'q-cell';
            
            // 行動が利用可能かどうかをチェック
            const isAvailable = availableActionNames.includes(actionName);
            
            if (isAvailable) {
                // 利用可能な行動の場合はQ値を表示
                const qValue = stateQValues[actionName].toFixed(2);
                qCell.innerHTML = `
                    <div class="q-state">位置(${currentPosition.row},${currentPosition.col})</div>
                    <div class="q-action">${getActionLabel(actionName)}</div>
                    <div class="q-value ${qValue > 0 ? 'positive' : 'negative'}">${qValue}</div>
                `;
            } else {
                // 利用不可能な行動（壁など）の場合
                qCell.innerHTML = `
                    <div class="q-state">位置(${currentPosition.row},${currentPosition.col})</div>
                    <div class="q-action">${getActionLabel(actionName)}</div>
                    <div class="q-value unavailable">壁</div>
                `;
            }
            
            qTableVisualization.appendChild(qCell);
        }
    }

    // 行動名を日本語にする
    function getActionLabel(actionName) {
        switch (actionName) {
            case 'up': return '↑ 上';
            case 'right': return '→ 右';
            case 'down': return '↓ 下';
            case 'left': return '← 左';
            default: return actionName;
        }
    }

    // AIキャラクターの表情を更新
    function updateMood(mood) {
        aiCharacter.classList.remove('thinking', 'success', 'failure');
        mouth.classList.remove('happy', 'sad');
        
        if (mood === 'thinking') {
            aiCharacter.classList.add('thinking');
            mouth.classList.add('happy');
        } else if (mood === 'success') {
            aiCharacter.classList.add('success');
            mouth.classList.add('happy');
        } else if (mood === 'failure') {
            aiCharacter.classList.add('failure');
            mouth.classList.add('sad');
        }
    }
});