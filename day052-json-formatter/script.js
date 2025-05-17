document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const jsonInput = document.getElementById('json-input');
    const jsonOutput = document.getElementById('json-output');
    const formatBtn = document.getElementById('format-btn');
    const clearBtn = document.getElementById('clear-btn');
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');
    const errorContainer = document.getElementById('error-container');
    const validationStatus = document.getElementById('validation-status');
    const indentSize = document.getElementById('indent-size');
    const themeSwitch = document.getElementById('theme-switch');
    const fixContainer = document.getElementById('fix-container');
    const fixMessage = document.getElementById('fix-message');
    const fixSuggestion = document.getElementById('fix-suggestion');
    const applyFixBtn = document.getElementById('apply-fix-btn');

    // 修正候補保持用変数
    let currentSuggestion = '';

    // ローカルストレージからの入力データの復元
    const savedInput = localStorage.getItem('jsonInput');
    if (savedInput) {
        jsonInput.value = savedInput;
    }

    // テーマの初期設定
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeSwitch.checked = true;
    }

    // JSON整形関数
    function formatJSON() {
        const inputText = jsonInput.value.trim();
        
        // 入力が空の場合
        if (!inputText) {
            jsonOutput.textContent = '';
            errorContainer.textContent = '';
            validationStatus.textContent = '';
            hideFixContainer();
            return;
        }
        
        try {
            // JSON解析
            const parsedData = JSON.parse(inputText);
            
            // インデントサイズ取得
            const spaces = parseInt(indentSize.value);
            
            // 整形されたJSONを出力
            const formattedJSON = JSON.stringify(parsedData, null, spaces);
            jsonOutput.textContent = formattedJSON;
            
            // エラーをクリア
            errorContainer.textContent = '';
            hideFixContainer();
            
            // 入力をローカルストレージに保存
            localStorage.setItem('jsonInput', inputText);
            
            // 検証ステータスを更新
            validationStatus.textContent = '✓ 有効なJSON';
            validationStatus.className = 'valid';
            
        } catch (error) {
            // エラーメッセージを表示
            const lineInfo = getErrorLineInfo(inputText, error);
            errorContainer.innerHTML = `エラー: ${error.message}${lineInfo ? ` (${lineInfo})` : ''}`;
            jsonOutput.textContent = '';
            
            // 検証ステータスを更新
            validationStatus.textContent = '✗ 無効なJSON';
            validationStatus.className = 'invalid';
            
            // エラー修正提案
            suggestFix(inputText, error);
        }
    }

    // JSONの検証のみ行う関数
    function validateJSON() {
        const inputText = jsonInput.value.trim();
        
        // 入力が空の場合
        if (!inputText) {
            errorContainer.textContent = '';
            validationStatus.textContent = '';
            hideFixContainer();
            return;
        }
        
        try {
            // JSON解析
            JSON.parse(inputText);
            
            // 検証ステータスを更新
            validationStatus.textContent = '✓ 有効なJSON';
            validationStatus.className = 'valid';
            errorContainer.textContent = '';
            hideFixContainer();
            
        } catch (error) {
            // エラーメッセージを表示
            const lineInfo = getErrorLineInfo(inputText, error);
            errorContainer.innerHTML = `エラー: ${error.message}${lineInfo ? ` (${lineInfo})` : ''}`;
            
            // 検証ステータスを更新
            validationStatus.textContent = '✗ 無効なJSON';
            validationStatus.className = 'invalid';
            
            // エラー修正提案
            suggestFix(inputText, error);
        }
    }

    // エラー位置から行と列を特定する関数
    function getErrorLineInfo(input, error) {
        const errorMessage = error.message;
        const positionMatch = errorMessage.match(/position\s+(\d+)/i);
        if (!positionMatch) return null;
        
        const errorPosition = parseInt(positionMatch[1]);
        const lines = input.split('\n');
        let lineNumber = 0;
        let columnNumber = 0;
        let charCount = 0;
        
        for (let i = 0; i < lines.length; i++) {
            if (charCount + lines[i].length + 1 > errorPosition) {
                lineNumber = i + 1; // 1-based line number
                columnNumber = errorPosition - charCount + 1; // 1-based column number
                break;
            }
            charCount += lines[i].length + 1; // +1 for newline
        }
        
        return `行 ${lineNumber} 列 ${columnNumber}`;
    }

    // エラー修正の提案
    function suggestFix(input, error) {
        const errorMessage = error.message;
        let suggestion = '';
        let fixHint = '';
        
        // エラー位置の特定
        const positionMatch = errorMessage.match(/position\s+(\d+)/i);
        let errorPosition = positionMatch ? parseInt(positionMatch[1]) : -1;
        
        // エラータイプに基づいて修正提案
        if (errorMessage.includes('Unexpected token')) {
            const lines = input.split('\n');
            let lineNumber = 0;
            let columnNumber = 0;
            let charCount = 0;
            
            // エラー行と列の特定
            if (errorPosition >= 0) {
                for (let i = 0; i < lines.length; i++) {
                    if (charCount + lines[i].length + 1 > errorPosition) {
                        lineNumber = i;
                        columnNumber = errorPosition - charCount;
                        break;
                    }
                    charCount += lines[i].length + 1; // +1 for newline
                }
                
                const errorLine = lines[lineNumber];
                const errorChar = errorLine[columnNumber];
                
                if (errorMessage.includes('Expected property name')) {
                    // プロパティ名が不正
                    if (errorChar === ',') {
                        // 余分なカンマ
                        fixHint = '余分なカンマが見つかりました。このカンマを削除してください。';
                        const fixedLine = errorLine.substring(0, columnNumber) + errorLine.substring(columnNumber + 1);
                        lines[lineNumber] = fixedLine;
                        suggestion = lines.join('\n');
                    } else if (errorChar === '}' || errorChar === ']') {
                        // 末尾のカンマ
                        fixHint = '末尾にカンマがあります。このカンマを削除してください。';
                        const prevLine = lines[lineNumber - 1];
                        const commaPos = prevLine.lastIndexOf(',');
                        if (commaPos !== -1) {
                            lines[lineNumber - 1] = prevLine.substring(0, commaPos) + prevLine.substring(commaPos + 1);
                            suggestion = lines.join('\n');
                        }
                    }
                } else if (errorMessage.includes('Unexpected token') && (errorChar === '{' || errorChar === '[')) {
                    // オブジェクトや配列の開始
                    if (columnNumber > 0 && errorLine[columnNumber - 1] !== ':') {
                        fixHint = 'プロパティ名と値の間にはコロン(:)が必要です。';
                        const fixedLine = errorLine.substring(0, columnNumber) + ': ' + errorLine.substring(columnNumber);
                        lines[lineNumber] = fixedLine;
                        suggestion = lines.join('\n');
                    }
                } else if (errorMessage.includes('Unexpected token') && errorChar === ':') {
                    // コロンの前がプロパティ名でない
                    fixHint = 'プロパティ名には引用符(")が必要です。';
                    let beforeColon = errorLine.substring(0, columnNumber).trim();
                    const lastSpace = beforeColon.lastIndexOf(' ');
                    const propertyName = lastSpace !== -1 ? beforeColon.substring(lastSpace + 1) : beforeColon;
                    
                    const fixedLine = errorLine.substring(0, columnNumber - propertyName.length) + 
                                    '"' + propertyName + '"' + 
                                    errorLine.substring(columnNumber);
                    lines[lineNumber] = fixedLine;
                    suggestion = lines.join('\n');
                }
            }
            
            // カンマ抜け検出
            if (!suggestion && errorMessage.includes('Expecting')) {
                const tokens = errorMessage.match(/Expecting\s+'([^']+)'/);
                if (tokens && tokens[1] === ',') {
                    fixHint = 'カンマが抜けています。';
                    const fixedLine = errorLine.substring(0, columnNumber) + ',' + errorLine.substring(columnNumber);
                    lines[lineNumber] = fixedLine;
                    suggestion = lines.join('\n');
                } else if (tokens && tokens[1] === '}') {
                    fixHint = '閉じ括弧が抜けています。';
                    lines.push('}');
                    suggestion = lines.join('\n');
                } else if (tokens && tokens[1] === ']') {
                    fixHint = '閉じ括弧が抜けています。';
                    lines.push(']');
                    suggestion = lines.join('\n');
                }
            }
        } else if (errorMessage.includes('Unexpected end of JSON input')) {
            // JSONの途中終了
            fixHint = 'JSONが途中で終了しています。閉じ括弧が足りないかもしれません。';
            
            // 括弧の数をカウント
            const openBraces = (input.match(/{/g) || []).length;
            const closeBraces = (input.match(/}/g) || []).length;
            const openBrackets = (input.match(/\[/g) || []).length;
            const closeBrackets = (input.match(/\]/g) || []).length;
            
            suggestion = input;
            // 閉じ括弧の追加
            for (let i = 0; i < openBraces - closeBraces; i++) {
                suggestion += '}';
            }
            for (let i = 0; i < openBrackets - closeBrackets; i++) {
                suggestion += ']';
            }
        } else if (errorMessage.includes('JSON.parse')) {
            // 一般的なパースエラー
            const lines = input.split('\n');
            
            // クォーテーション不一致チェック
            let missingQuotes = false;
            for (let i = 0; i < lines.length; i++) {
                const quoteCount = (lines[i].match(/"/g) || []).length;
                if (quoteCount % 2 !== 0) {
                    missingQuotes = true;
                    fixHint = '引用符(")の対応が取れていません。';
                    // 行末に引用符を追加
                    lines[i] = lines[i] + '"';
                    suggestion = lines.join('\n');
                    break;
                }
            }
            
            // 末尾のカンマをチェック
            if (!missingQuotes) {
                const trailingCommaRegex = /,\s*[\}\]]/g;
                if (trailingCommaRegex.test(input)) {
                    fixHint = '末尾のカンマは無効です。';
                    suggestion = input.replace(/,(\s*[\}\]])/g, '$1');
                }
            }
        }
        
        // 修正提案がある場合表示
        if (suggestion) {
            fixMessage.textContent = fixHint || 'エラーの修正案:';
            fixSuggestion.textContent = suggestion;
            applyFixBtn.style.display = 'inline-block';
            fixContainer.classList.add('show');
            currentSuggestion = suggestion;
        } else {
            // 一般的な修正案を提供
            if (errorMessage.includes("Expected ',' or '}'")) {
                fixHint = '行と行の間にはカンマ(,)が必要です。';
                const lines = input.split('\n');
                const posMatch = errorMessage.match(/position\s+(\d+)/i);
                if (posMatch) {
                    const pos = parseInt(posMatch[1]);
                    let lineNo = 0;
                    let charCount = 0;
                    
                    for (let i = 0; i < lines.length; i++) {
                        if (charCount + lines[i].length + 1 > pos) {
                            lineNo = i;
                            break;
                        }
                        charCount += lines[i].length + 1;
                    }
                    
                    if (lineNo > 0) {
                        lines[lineNo-1] = lines[lineNo-1] + ',';
                        suggestion = lines.join('\n');
                        fixMessage.textContent = fixHint;
                        fixSuggestion.textContent = suggestion;
                        applyFixBtn.style.display = 'inline-block';
                        fixContainer.classList.add('show');
                        currentSuggestion = suggestion;
                        return;
                    }
                }
            }
            hideFixContainer();
        }
    }

    // 修正提案の非表示
    function hideFixContainer() {
        fixContainer.classList.remove('show');
        fixMessage.textContent = '';
        fixSuggestion.textContent = '';
        applyFixBtn.style.display = 'none';
        currentSuggestion = '';
    }

    // 修正案の適用
    function applyFix() {
        if (currentSuggestion) {
            jsonInput.value = currentSuggestion;
            // 再検証
            validateJSON();
        }
    }

    // コピー機能
    function copyToClipboard() {
        const output = jsonOutput.textContent;
        if (!output) return;
        
        navigator.clipboard.writeText(output)
            .then(() => {
                showCopyMessage('JSONがクリップボードにコピーされました');
            })
            .catch(err => {
                console.error('クリップボードへのコピーに失敗しました', err);
                showCopyMessage('コピーに失敗しました', false);
            });
    }

    // コピー成功メッセージ表示
    function showCopyMessage(message, success = true) {
        // 既存のメッセージを削除
        const existingMessage = document.querySelector('.copy-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // 新しいメッセージを作成
        const messageElement = document.createElement('div');
        messageElement.className = `copy-message ${success ? 'success' : 'error'}`;
        messageElement.textContent = message;
        
        document.body.appendChild(messageElement);
        
        // アニメーション
        setTimeout(() => {
            messageElement.classList.add('show');
        }, 10);
        
        // メッセージの削除
        setTimeout(() => {
            messageElement.classList.remove('show');
            setTimeout(() => {
                messageElement.remove();
            }, 300);
        }, 2000);
    }

    // ダウンロード機能
    function downloadJSON() {
        const output = jsonOutput.textContent;
        if (!output) return;
        
        const blob = new Blob([output], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'formatted_json.json';
        document.body.appendChild(a);
        a.click();
        
        // クリーンアップ
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    // クリア機能
    function clearInput() {
        jsonInput.value = '';
        jsonOutput.textContent = '';
        errorContainer.textContent = '';
        validationStatus.textContent = '';
        hideFixContainer();
        localStorage.removeItem('jsonInput');
    }

    // テーマ切り替え
    function toggleTheme() {
        if (themeSwitch.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    }

    // イベントリスナー
    formatBtn.addEventListener('click', formatJSON);
    clearBtn.addEventListener('click', clearInput);
    copyBtn.addEventListener('click', copyToClipboard);
    downloadBtn.addEventListener('click', downloadJSON);
    themeSwitch.addEventListener('change', toggleTheme);
    applyFixBtn.addEventListener('click', applyFix);
    indentSize.addEventListener('change', () => {
        if (jsonOutput.textContent) {
            formatJSON();
        }
    });

    // 起動時にフォーマット処理を実行（保存されたデータがある場合）
    if (savedInput) {
        formatJSON();
    }
});