/**
 * 履歴管理機能
 */

// 履歴管理クラス
class HistoryManager {
    constructor(maxHistory = CONFIG.MAX_HISTORY) {
      this.history = []; // 過去の状態を保存する配列
      this.currentIndex = -1; // 現在の状態のインデックス
      this.maxHistory = maxHistory; // 最大履歴数
      this.isRecording = true; // 履歴の記録フラグ
    }
    
    /**
     * 状態を記録する
     * @param {Array} shapes - 現在の図形配列のクローン
     * @param {string} actionName - アクション名
     */
    recordState(shapes, actionName = '') {
      if (!this.isRecording) return;
      
      // 現在の状態以降の履歴を削除
      if (this.currentIndex < this.history.length - 1) {
        this.history = this.history.slice(0, this.currentIndex + 1);
      }
      
      // 新しい状態を深いコピーで保存
      const newState = {
        shapes: JSON.parse(JSON.stringify(shapes)),
        actionName: actionName,
        timestamp: new Date().getTime()
      };
      
      this.history.push(newState);
      this.currentIndex = this.history.length - 1;
      
      // 履歴が最大数を超えたら古いものを削除
      if (this.history.length > this.maxHistory) {
        this.history.shift();
        this.currentIndex--;
      }
      
      // ボタンの状態を更新
      this.updateButtons();
    }
    
    /**
     * 元に戻す
     * @returns {Array|null} 一つ前の状態の図形配列、または無ければnull
     */
    undo() {
      if (!this.canUndo()) return null;
      
      this.currentIndex--;
      const state = this.history[this.currentIndex];
      
      // ボタンの状態を更新
      this.updateButtons();
      
      return state.shapes;
    }
    
    /**
     * やり直す
     * @returns {Array|null} 一つ後の状態の図形配列、または無ければnull
     */
    redo() {
      if (!this.canRedo()) return null;
      
      this.currentIndex++;
      const state = this.history[this.currentIndex];
      
      // ボタンの状態を更新
      this.updateButtons();
      
      return state.shapes;
    }
    
    /**
     * 元に戻せるか確認
     * @returns {boolean} 元に戻せるならtrue
     */
    canUndo() {
      return this.currentIndex > 0;
    }
    
    /**
     * やり直せるか確認
     * @returns {boolean} やり直せるならtrue
     */
    canRedo() {
      return this.currentIndex < this.history.length - 1;
    }
    
    /**
     * 履歴を全てクリア
     */
    clear() {
      this.history = [];
      this.currentIndex = -1;
      this.updateButtons();
    }
    
    /**
     * 履歴の記録を一時的に無効化（連続操作時など）
     */
    pauseRecording() {
      this.isRecording = false;
    }
    
    /**
     * 履歴の記録を再開
     */
    resumeRecording() {
      this.isRecording = true;
    }
    
    /**
     * ボタンの状態を更新
     */
    updateButtons() {
      const undoBtn = document.getElementById('undoBtn');
      const redoBtn = document.getElementById('redoBtn');
      
      if (undoBtn) {
        undoBtn.disabled = !this.canUndo();
      }
      
      if (redoBtn) {
        redoBtn.disabled = !this.canRedo();
      }
    }
  }
  
  // 履歴マネージャーのインスタンスを作成
  const historyManager = new HistoryManager();
  
  /**
   * 履歴に状態を記録する
   * @param {string} actionName - アクション名
   */
  function recordHistory(actionName = '') {
    historyManager.recordState(shapes, actionName);
  }
  
  /**
   * 元に戻す
   */
  function handleUndo() {
    const previousShapes = historyManager.undo();
    if (previousShapes) {
      // 現在の選択を解除
      clearSelection();
      
      // 図形を一時的に記録なしで置き換え
      historyManager.pauseRecording();
      shapes = previousShapes;
      redrawShapes();
      historyManager.resumeRecording();
      
      // 通知
      showNotification('もとにもどしました');
    }
  }
  
  /**
   * やり直す
   */
  function handleRedo() {
    const nextShapes = historyManager.redo();
    if (nextShapes) {
      // 現在の選択を解除
      clearSelection();
      
      // 図形を一時的に記録なしで置き換え
      historyManager.pauseRecording();
      shapes = nextShapes;
      redrawShapes();
      historyManager.resumeRecording();
      
      // 通知
      showNotification('やりなおしました');
    }
  }