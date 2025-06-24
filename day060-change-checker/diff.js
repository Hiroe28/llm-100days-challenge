function computeLCS(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    
    const lcs = [];
    let i = m, j = n;
    
    while (i > 0 && j > 0) {
        if (str1[i - 1] === str2[j - 1]) {
            lcs.unshift({ char: str1[i - 1], pos1: i - 1, pos2: j - 1 });
            i--;
            j--;
        } else if (dp[i - 1][j] > dp[i][j - 1]) {
            i--;
        } else {
            j--;
        }
    }
    
    return lcs;
}

function generateCharDiff(str1, str2) {
    const lcs = computeLCS(str1, str2);
    const diff = [];
    
    let i = 0, j = 0, lcsIndex = 0;
    
    while (i < str1.length || j < str2.length) {
        if (lcsIndex < lcs.length && i === lcs[lcsIndex].pos1 && j === lcs[lcsIndex].pos2) {
            diff.push({ type: 'equal', char: str1[i] });
            i++;
            j++;
            lcsIndex++;
        } else if (lcsIndex < lcs.length && i < lcs[lcsIndex].pos1) {
            diff.push({ type: 'deleted', char: str1[i] });
            i++;
        } else if (lcsIndex < lcs.length && j < lcs[lcsIndex].pos2) {
            diff.push({ type: 'added', char: str2[j] });
            j++;
        } else if (i < str1.length) {
            diff.push({ type: 'deleted', char: str1[i] });
            i++;
        } else if (j < str2.length) {
            diff.push({ type: 'added', char: str2[j] });
            j++;
        }
    }
    
    return diff;
}

// 行の類似度を計算する関数
function calculateLineSimilarity(line1, line2) {
    if (line1 === line2) return 1.0;
    if (line1.length === 0 || line2.length === 0) return 0.0;
    
    const lcs = computeLCS(line1, line2);
    const maxLength = Math.max(line1.length, line2.length);
    return lcs.length / maxLength;
}

// 改良された行差分アルゴリズム
function generateLineDiff(text1, text2) {
    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');
    const result = [];
    
    // 動的計画法による最適な行マッピングを作成
    const m = lines1.length;
    const n = lines2.length;
    const SIMILARITY_THRESHOLD = 0.3;
    
    // 各行ペアの類似度を事前計算
    const similarities = Array(m).fill(null).map(() => Array(n).fill(0));
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            similarities[i][j] = calculateLineSimilarity(lines1[i], lines2[j]);
        }
    }
    
    // 最適なマッピングを見つける
    const mapping = [];
    const used1 = new Set();
    const used2 = new Set();
    
    // 完全一致を最初に処理
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            if (similarities[i][j] === 1.0 && !used1.has(i) && !used2.has(j)) {
                mapping.push({ i, j, type: 'equal', similarity: 1.0 });
                used1.add(i);
                used2.add(j);
            }
        }
    }
    
    // 高い類似度の組み合わせを処理
    const candidates = [];
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            if (!used1.has(i) && !used2.has(j) && similarities[i][j] >= SIMILARITY_THRESHOLD) {
                candidates.push({ i, j, similarity: similarities[i][j] });
            }
        }
    }
    
    // 類似度が高い順にソート
    candidates.sort((a, b) => b.similarity - a.similarity);
    
    // 最適な組み合わせを選択
    for (const candidate of candidates) {
        if (!used1.has(candidate.i) && !used2.has(candidate.j)) {
            mapping.push({ 
                i: candidate.i, 
                j: candidate.j, 
                type: 'modified', 
                similarity: candidate.similarity 
            });
            used1.add(candidate.i);
            used2.add(candidate.j);
        }
    }
    
    // マッピングを行番号順にソート
    mapping.sort((a, b) => a.i - b.i);
    
    // 結果を生成
    let i = 0, j = 0;
    
    for (const map of mapping) {
        // マッピング前の削除された行を追加
        while (i < map.i) {
            result.push({
                type: 'deleted',
                leftLine: lines1[i],
                rightLine: '',
                leftNum: i + 1,
                rightNum: null
            });
            i++;
        }
        
        // マッピング前の追加された行を追加
        while (j < map.j) {
            result.push({
                type: 'added',
                leftLine: '',
                rightLine: lines2[j],
                leftNum: null,
                rightNum: j + 1
            });
            j++;
        }
        
        // マッピングされた行を追加
        result.push({
            type: map.type,
            leftLine: lines1[map.i],
            rightLine: lines2[map.j],
            leftNum: map.i + 1,
            rightNum: map.j + 1
        });
        
        i++;
        j++;
    }
    
    // 残りの削除された行
    while (i < m) {
        result.push({
            type: 'deleted',
            leftLine: lines1[i],
            rightLine: '',
            leftNum: i + 1,
            rightNum: null
        });
        i++;
    }
    
    // 残りの追加された行
    while (j < n) {
        result.push({
            type: 'added',
            leftLine: '',
            rightLine: lines2[j],
            leftNum: null,
            rightNum: j + 1
        });
        j++;
    }
    
    return result;
}

function createCharDiffElement(line1, line2) {
    const charDiff = generateCharDiff(line1, line2);
    const leftContent = document.createElement('span');
    const rightContent = document.createElement('span');
    
    let leftResult = [];
    let rightResult = [];
    
    charDiff.forEach(item => {
        if (item.type === 'equal') {
            leftResult.push(item.char);
            rightResult.push(item.char);
        } else if (item.type === 'deleted') {
            leftResult.push(`<span class="char-deleted">${escapeHtml(item.char)}</span>`);
        } else if (item.type === 'added') {
            rightResult.push(`<span class="char-added">${escapeHtml(item.char)}</span>`);
        }
    });
    
    leftContent.innerHTML = leftResult.join('');
    rightContent.innerHTML = rightResult.join('');
    
    return { leftContent, rightContent };
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function displayLineDiff(diff) {
    const leftDiv = document.getElementById('leftDiff');
    const rightDiv = document.getElementById('rightDiff');
    leftDiv.innerHTML = '';
    rightDiv.innerHTML = '';
    
    diff.forEach((item, index) => {
        // 左側
        const leftLineDiv = document.createElement('div');
        leftLineDiv.className = 'diff-line';
        leftLineDiv.setAttribute('data-line-index', index);
        
        const leftNumSpan = document.createElement('span');
        leftNumSpan.className = 'line-number';
        leftNumSpan.textContent = item.leftNum || '';
        
        const leftContentSpan = document.createElement('span');
        leftContentSpan.className = 'line-content';
        
        // 右側
        const rightLineDiv = document.createElement('div');
        rightLineDiv.className = 'diff-line';
        rightLineDiv.setAttribute('data-line-index', index);
        
        const rightNumSpan = document.createElement('span');
        rightNumSpan.className = 'line-number';
        rightNumSpan.textContent = item.rightNum || '';
        
        const rightContentSpan = document.createElement('span');
        rightContentSpan.className = 'line-content';
        
        if (item.type === 'modified') {
            // 変更された行は文字単位の差分を表示
            const { leftContent, rightContent } = createCharDiffElement(item.leftLine, item.rightLine);
            leftContentSpan.appendChild(leftContent);
            rightContentSpan.appendChild(rightContent);
        } else if (item.type === 'deleted') {
            leftLineDiv.classList.add(item.type);
            leftContentSpan.textContent = item.leftLine;
            rightLineDiv.classList.add('empty');
            rightContentSpan.textContent = '';
        } else if (item.type === 'added') {
            leftLineDiv.classList.add('empty');
            leftContentSpan.textContent = '';
            rightLineDiv.classList.add(item.type);
            rightContentSpan.textContent = item.rightLine;
        } else if (item.type === 'equal') {
            leftContentSpan.textContent = item.leftLine;
            rightContentSpan.textContent = item.rightLine;
        }
        
        leftLineDiv.appendChild(leftNumSpan);
        leftLineDiv.appendChild(leftContentSpan);
        leftDiv.appendChild(leftLineDiv);
        
        rightLineDiv.appendChild(rightNumSpan);
        rightLineDiv.appendChild(rightContentSpan);
        rightDiv.appendChild(rightLineDiv);
    });
    
    // 行の高さを同期
    setTimeout(() => {
        syncLineHeights();
    }, 0);
}

function syncLineHeights() {
    const leftLines = document.querySelectorAll('#leftDiff .diff-line');
    const rightLines = document.querySelectorAll('#rightDiff .diff-line');
    
    leftLines.forEach((leftLine, index) => {
        const rightLine = rightLines[index];
        if (rightLine) {
            // 高さをリセット
            leftLine.style.minHeight = 'auto';
            rightLine.style.minHeight = 'auto';
            
            // 実際の高さを取得
            const leftHeight = leftLine.offsetHeight;
            const rightHeight = rightLine.offsetHeight;
            const maxHeight = Math.max(leftHeight, rightHeight);
            
            // 高い方に合わせる
            if (maxHeight > leftHeight) {
                leftLine.style.minHeight = maxHeight + 'px';
            }
            if (maxHeight > rightHeight) {
                rightLine.style.minHeight = maxHeight + 'px';
            }
        }
    });
}

// トグルボタンの機能
document.getElementById('toggleInput').addEventListener('click', () => {
    const inputSection = document.getElementById('inputSection');
    const toggleButton = document.getElementById('toggleInput');
    
    if (inputSection.style.display === 'none') {
        inputSection.style.display = 'grid';
        toggleButton.textContent = '▼ 入力エリアを表示/非表示';
    } else {
        inputSection.style.display = 'none';
        toggleButton.textContent = '▶ 入力エリアを表示/非表示';
    }
});

document.getElementById('compareBtn').addEventListener('click', () => {
    const leftText = document.getElementById('leftText').value;
    const rightText = document.getElementById('rightText').value;
    
    if (!leftText && !rightText) {
        document.getElementById('leftDiff').textContent = 'テキストを入力してください';
        document.getElementById('rightDiff').textContent = 'テキストを入力してください';
        return;
    }
    
    const diff = generateLineDiff(leftText, rightText);
    displayLineDiff(diff);
    
    // 同時スクロールの設定
    const leftDiff = document.getElementById('leftDiff');
    const rightDiff = document.getElementById('rightDiff');
    
    // 既存のイベントリスナーを削除
    const newLeftDiff = leftDiff.cloneNode(true);
    const newRightDiff = rightDiff.cloneNode(true);
    leftDiff.parentNode.replaceChild(newLeftDiff, leftDiff);
    rightDiff.parentNode.replaceChild(newRightDiff, rightDiff);
    
    newLeftDiff.addEventListener('scroll', () => {
        newRightDiff.scrollTop = newLeftDiff.scrollTop;
        newRightDiff.scrollLeft = newLeftDiff.scrollLeft;
    });
    
    newRightDiff.addEventListener('scroll', () => {
        newLeftDiff.scrollTop = newRightDiff.scrollTop;
        newLeftDiff.scrollLeft = newRightDiff.scrollLeft;
    });
});