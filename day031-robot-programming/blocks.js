/**
 * Blocklyブロックの定義と生成コードを管理するファイル
 * 各ブロックの見た目と動作を定義する
 */

/**
 * スタートブロックの定義
 */
Blockly.Blocks['robot_start'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("🏁 スタート");
    this.setNextStatement(true, null);
    this.setColour(120);
    this.setTooltip("このブロックから実行が始まります");
    this.setDeletable(false);  // 削除できないように
    this.setMovable(true);     // 移動は可能
  }
};

if (typeof Blockly.Blocks['controls_repeat_ext'] === 'undefined') {
  Blockly.Blocks['controls_repeat_ext'] = {
    init: function() {
      this.appendValueInput('TIMES')
          .setCheck('Number')
          .appendField('繰り返す');
      this.appendStatementInput('DO')
          .appendField('実行');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(120);
      this.setTooltip('指定した回数だけブロックを繰り返します');
    }
  };
}


// くりかえしブロックの定義は残すが、修正する
Blockly.JavaScript['controls_repeat_ext'] = function(block) {
  // 繰り返し回数を取得
  var repeats = Blockly.JavaScript.valueToCode(block, 'TIMES',
      Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  
  // 実行するコードを取得
  var branch = Blockly.JavaScript.statementToCode(block, 'DO');
  
  // 単純な変数名を使用（衝突を避けるためランダム数字を付加）
  var loopVar = 'count' + Math.floor(Math.random() * 10000);
  
  // forループを生成
  var code = 'for (var ' + loopVar + ' = 0; ' +
      loopVar + ' < ' + repeats + '; ' +
      loopVar + '++) {\n' +
      branch + '}\n';
  
  return code;
};

/**
 * 「前に進む」ブロックの定義
 */
Blockly.Blocks['robot_move_forward'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("前に進む");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(160);
    this.setTooltip("ロボットを1マス前に進めます");
  }
};

/**
 * 「右にまがる」ブロックの定義
 */
Blockly.Blocks['robot_turn_right'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("右にまがる");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(160);
    this.setTooltip("ロボットを右に90度回転させます");
  }
};

/**
 * 「左にまがる」ブロックの定義
 */
Blockly.Blocks['robot_turn_left'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("左にまがる");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(160);
    this.setTooltip("ロボットを左に90度回転させます");
  }
};

/**
 * 「玉を出す」ブロックの定義
 */
Blockly.Blocks['robot_shoot'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("玉を出す");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(210);
    this.setTooltip("ロボットが前方に玉を発射します");
  }
};

/**
 * 「前に敵がいたら」ブロックの定義（修正版）
 */
Blockly.Blocks['robot_check_enemy'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("前に敵がいる");
    this.setOutput(true, "Boolean");
    this.setColour(65);
    this.setTooltip("ロボットの前に敵がいるかチェックします");
  }
};

/**
 * 「数値」ブロックの定義
 */
Blockly.Blocks['math_number'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldNumber(0), "NUM");
    this.setOutput(true, "Number");
    this.setColour(230);
    this.setTooltip("数字");
  }
};

/**
 * JavaScript生成ルールの定義
 */

/**
 * スタートブロックのJavaScript生成
 */
Blockly.JavaScript['robot_start'] = function(block) {
  var nextBlock = Blockly.JavaScript.statementToCode(block, 'NEXT');
  // スタートブロックは実際のコードは生成しない
  return '';
};

/**
 * 「前に進む」ブロックのJavaScript生成
 */
Blockly.JavaScript['robot_move_forward'] =
  () => 'await moveForward();\n';

/**
 * 「右にまがる」ブロックのJavaScript生成
 */
Blockly.JavaScript['robot_turn_right'] = function(block) {
  return 'await turnRight();\n';
};

/**
 * 「左にまがる」ブロックのJavaScript生成
 */
Blockly.JavaScript['robot_turn_left'] = function(block) {
  return 'await turnLeft();\n';  // await キーワードを追加
};

/**
 * 「玉を出す」ブロックのJavaScript生成
 */
Blockly.JavaScript['robot_shoot'] = function(block) {
  return 'await shoot();\n';
};

/**
 * 「前に敵がいる」ブロックのJavaScript生成（修正版）
 */
Blockly.JavaScript['robot_check_enemy'] = function(block) {
  // ORDER_FUNCTION_CALLはBlocklyの演算子優先順位を示す定数
  return ['checkEnemyAhead()', Blockly.JavaScript.ORDER_FUNCTION_CALL];
};

/**
 * 「数値」ブロックのJavaScript生成
 */
Blockly.JavaScript['math_number'] = function(block) {
  var number = Number(block.getFieldValue('NUM'));
  return [number, Blockly.JavaScript.ORDER_ATOMIC];
};

controls_repeat_ext

/**
 * 「もし〇〇なら」ブロックのJavaScript生成（修正版）
 * 既存の制御ブロックの生成関数を上書き
 */
Blockly.JavaScript['controls_if'] = function(block) {
  // If/elseif/else文を生成
  var n = 0;
  var code = '', branchCode, conditionCode;
  if (Blockly.JavaScript.STATEMENT_PREFIX) {
    // 自動プレフィックス挿入が有効な場合
    code += Blockly.JavaScript.injectId(Blockly.JavaScript.STATEMENT_PREFIX, block);
  }
  
  // ifとelseif部分を処理
  do {
    conditionCode = Blockly.JavaScript.valueToCode(block, 'IF' + n,
        Blockly.JavaScript.ORDER_NONE) || 'false';
    branchCode = Blockly.JavaScript.statementToCode(block, 'DO' + n);
    
    if (Blockly.JavaScript.STATEMENT_SUFFIX) {
      branchCode = Blockly.JavaScript.prefixLines(
          Blockly.JavaScript.injectId(Blockly.JavaScript.STATEMENT_SUFFIX, block),
          Blockly.JavaScript.INDENT) + branchCode;
    }
    
    code += (n > 0 ? ' else ' : '') +
        'if (' + conditionCode + ') {\n' + branchCode + '}';
    n++;
  } while (block.getInput('IF' + n));
  
  // else部分を処理
  if (block.getInput('ELSE')) {
    branchCode = Blockly.JavaScript.statementToCode(block, 'ELSE');
    if (Blockly.JavaScript.STATEMENT_SUFFIX) {
      branchCode = Blockly.JavaScript.prefixLines(
          Blockly.JavaScript.injectId(Blockly.JavaScript.STATEMENT_SUFFIX, block),
          Blockly.JavaScript.INDENT) + branchCode;
    }
    code += ' else {\n' + branchCode + '}';
  }
  
  return code + '\n';
};

/**
 * ツールボックスXMLを生成する関数
 * @param {Array} blockTypes 使用可能なブロックタイプの配列
 * @returns {string} ツールボックスXML
 */
function generateToolboxXml(blockTypes) {
  let xml = '<xml>';
  
  blockTypes.forEach(blockType => {
    // くりかえしブロックの場合、初期値を設定
    if (blockType === 'controls_repeat_ext') {
      xml += `<block type="${blockType}">
              <value name="TIMES">
                <shadow type="math_number">
                  <field name="NUM">10</field>
                </shadow>
              </value>
            </block>`;
    } else {
      xml += `<block type="${blockType}"></block>`;
    }
  });
  
  xml += '</xml>';
  return xml;
}
// スタートブロックを探す前に要素の存在を確認する関数
function ensureBlocklyElements() {
  // blocklyDivの存在確認
  const blocklyDiv = document.getElementById('blocklyDiv');
  if (!blocklyDiv) {
    console.error('blocklyDiv要素が見つかりません');
    return false;
  }
  
  return true;
}

// 修正したfindStartBlock関数
function findStartBlock(workspace) {
  if (!workspace) {
    console.error('ワークスペースが指定されていません');
    return null;
  }
  
  try {
    const blocks = workspace.getTopBlocks();
    if (!blocks || blocks.length === 0) {
      console.log('ワークスペース内にブロックがありません');
      return null;
    }
    
    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i] && blocks[i].type === 'robot_start') {
        return blocks[i];
      }
    }
    
    console.log('スタートブロックが見つかりません');
    return null;
  } catch (e) {
    console.error('ブロック検索エラー:', e);
    return null;
  }
}

// 修正したgenerateCodeFromWorkspace関数
function generateCodeFromWorkspace(workspace) {
  if (!workspace) {
    console.error('ワークスペースが指定されていません');
    return '';
  }
  
  try {
    // Blocklyが初期化されているか確認
    if (!Blockly || !Blockly.JavaScript) {
      console.error('Blocklyまたはそのコンポーネントが初期化されていません');
      return '';
    }
    
    // Javascriptジェネレータを初期化
    Blockly.JavaScript.init(workspace);
    
    // スタートブロックを探す
    const startBlock = findStartBlock(workspace);
    if (!startBlock) {
      console.log('スタートブロックが見つかりません');
      return '';
    }
    
    // コードを生成
    return Blockly.JavaScript.blockToCode(startBlock);
  } catch (e) {
    console.error('コード生成エラー:', e);
    return '';
  }
}
/**
 * スタートブロックを探す関数
 * @param {Blockly.Workspace} workspace Blocklyワークスペース
 * @returns {Blockly.Block|null} スタートブロックまたはnull
 */
function findStartBlock(workspace) {
  const blocks = workspace.getTopBlocks();
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].type === 'robot_start') {
      return blocks[i];
    }
  }
  return null;
}

function hasStartBlock(workspace) {
  return workspace.getTopBlocks().some(block => block.type === 'robot_start');
}

// game.jsのinitBlockly関数内の修正部分
setTimeout(function() {
  if (workspace && !hasStartBlock(workspace)) {
    var startBlock = workspace.newBlock('robot_start');
    startBlock.initSvg();
    startBlock.render();
    startBlock.moveBy(50, 50);
    console.log('スタートブロック追加成功');
  }
}, 300);