# 学習クイズアプリ

四択クイズで学習できるPWA（Progressive Web App）です。間隔反復学習（SM-2アルゴリズム）により、効率的に記憶を定着させることができます。

## 機能

- **四択クイズ** - A〜Dの選択肢から解答  
- **間隔反復学習** - SM-2アルゴリズムによる効率的な復習スケジュール
- **問題管理** - 問題の追加・編集・削除
- **習得管理** - 完全習得した問題を復習対象から除外
- **Markdown対応** - 問題文・解説にMarkdown記法が使用可能
- **LaTeX数式** - KaTeXによる数式レンダリング
- **画像対応** - 問題に複数の画像を添付可能
- **タグ機能** - 問題をタグで分類・絞り込み
- **オフライン対応** - PWAによりオフラインでも動作
- **データ移行** - ZIP/JSONでのエクスポート・インポート

## 動作環境

- モダンブラウザ（Chrome, Firefox, Safari, Edge）
- IndexedDB対応ブラウザ
- サーバー不要（静的ホスティングのみ）

## ローカルでの起動方法

### 方法1: VSCode Live Server

1. VSCodeで「Live Server」拡張機能をインストール
2. プロジェクトフォルダを開く
3. `index.html` を右クリック → 「Open with Live Server」

### 方法2: Python http.server

```bash
# Python 3の場合
cd /path/to/quiz-app
python -m http.server 8000

# ブラウザで http://localhost:8000 を開く
```

### 方法3: Node.js http-server

```bash
# http-serverをインストール
npm install -g http-server

# サーバー起動
cd /path/to/quiz-app
http-server -p 8000

# ブラウザで http://localhost:8000 を開く
```

## GitHub Pagesでの公開方法

1. GitHubでリポジトリを作成

2. ファイルをプッシュ
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

3. GitHub Pages を有効化
   - リポジトリの Settings → Pages
   - Source: 「Deploy from a branch」を選択
   - Branch: `main` / `/ (root)` を選択
   - Save をクリック

4. 数分後、`https://YOUR_USERNAME.github.io/YOUR_REPO/` でアクセス可能に

## アイコンの準備

PWAに必要なアイコンを生成するには：

### オンラインツールを使う場合

1. `icons/icon.svg` を開く
2. [SVG to PNG Converter](https://svgtopng.com/) などでPNGに変換
3. 192x192 と 512x512 のサイズで保存
4. `icons/icon-192.png`, `icons/icon-512.png` として配置

### コマンドラインを使う場合（ImageMagick）

```bash
# ImageMagickがインストールされている場合
convert icons/icon.svg -resize 192x192 icons/icon-192.png
convert icons/icon.svg -resize 512x512 icons/icon-512.png
```

## 使い方

### 初回起動

1. アプリを開くと空の状態から開始
2. 「サンプルデータ」ボタンでサンプル問題を読み込むか
3. 管理画面から自分で問題を追加できます

### クイズを解く

1. 下部ナビゲーションの「解く」をタップ
2. 出題モードを選択
   - **📅 今日の学習**: 復習時期が来た問題と新規問題を自動で出題（おすすめ）
   - **未解答問題**: まだ解いたことがない問題のみ
   - **ランダム**: 全問題からランダムに出題
   - **タグ指定**: 特定のタグの問題のみ出題
3. 「クイズを開始」をタップ
4. A〜Dの選択肢から解答（キーボード: A/B/C/Dキー）
5. 正誤と解説が表示される
6. 必要に応じて「✓ 習得済みにする」ボタンで完全習得扱いに
7. 「次へ」で次の問題（キーボード: Nキー）

### 問題を管理する

1. 下部ナビゲーションの「管理」をタップ
2. 問題一覧が表示（検索・タグ絞り込み可能）
3. 「+ 問題を追加」で新規作成
4. 既存問題の操作：
   - **✓ 習得済み**: 完全習得済みにする（復習対象から外れる）
   - **🔄 再学習**: 習得済み問題を再び学習対象に戻す
   - **編集**: 問題を編集
   - **削除**: 問題を削除

### 問題の書き方

#### Markdown

```markdown
**太字** と *斜体* が使えます

- 箇条書き
- リスト

`コード` や

```python
code block
```

も使えます
```

#### LaTeX数式

```
インライン数式: $E = mc^2$

ブロック数式:
$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$
```

### データのエクスポート・インポート

#### エクスポート

1. 管理画面下部の「データ管理」セクション
2. **完全バックアップ (ZIP)**: 問題・画像・学習履歴を全てZIPで保存
3. **問題のみエクスポート (JSON)**: 問題データのみJSON形式で保存

#### インポート

1. 「インポート」ボタンでファイルを選択
2. ZIP形式またはJSON形式に対応
3. 既存データはマージされます（同一IDは上書き）

## ファイル構成

```
quiz-app/
├── index.html              # メインHTML
├── css/
│   └── styles.css          # スタイルシート
├── js/
│   ├── db.js               # IndexedDB操作
│   ├── ui.js               # UI操作・レンダリング
│   ├── app.js              # メインアプリケーション
│   ├── sm2.js              # SM-2アルゴリズム実装
│   └── export-import.js    # エクスポート/インポート
├── sw.js                   # Service Worker
├── manifest.webmanifest    # PWAマニフェスト
├── icons/
│   ├── icon.svg            # アイコン（SVG元データ）
│   ├── icon-192.png        # アイコン（192x192）
│   └── icon-512.png        # アイコン（512x512）
├── sample-data.json        # サンプル問題データ
├── README.md               # 使い方ガイド
└── USAGE.md                # このファイル
```

## データモデル

### IndexedDBストア

- **questions**: 問題データ
- **assets**: 画像などのアセット
- **attempts**: 解答履歴
- **stats**: 問題ごとの統計（SM-2学習データを含む）

### 問題データ構造

JSON入力やインポート時は以下の形式で入力します：

```json
{
  "title": "問題タイトル",
  "body_md": "問題文（Markdown）",
  "choices": {
    "A": "選択肢A",
    "B": "選択肢B",
    "C": "選択肢C",
    "D": "選択肢D"
  },
  "answer": "A",
  "explanation_md": "解説（Markdown）",
  "tags": ["タグ1", "タグ2"]
}
```

システム管理フィールド（自動生成・管理）：
- `id`: 問題の一意なID（UUID）
- `asset_ids`: 添付画像のIDリスト
- `created_at`: 作成日時（タイムスタンプ）
- `updated_at`: 更新日時（タイムスタンプ）

### 統計データ構造

各問題の学習状況は`stats`ストアに保存されます：

```javascript
{
  question_id: "問題ID",
  
  // SM-2アルゴリズム用フィールド
  easeFactor: 2.5,        // 難易度係数（デフォルト2.5）
  interval: 0,            // 次回復習までの日数
  repetitions: 0,         // 連続正解回数
  nextReviewDate: null,   // 次回復習日（タイムスタンプ）
  lastReviewDate: null,   // 最終復習日
  totalReviews: 0,        // 総復習回数
  
  // 旧互換フィールド
  wrong_count: 0,         // 間違えた回数
  last_wrong_at: null,    // 最後に間違えた日時
  last_correct_at: null   // 最後に正解した日時
}
```

## SM-2アルゴリズムについて

### 復習間隔の決定ルール

1. **初回正解**: 1日後に復習
2. **2回目正解**: 6日後に復習
3. **3回目以降**: `前回の間隔 × 難易度係数` で計算
4. **不正解**: 間隔がリセットされ、1日後に復習

### 難易度係数（easeFactor）

- 初期値: 2.5
- 正解すると上昇、不正解すると下降
- 最小値: 1.3
- この係数により、簡単な問題は間隔が早く伸び、難しい問題はゆっくり伸びます

### 習得レベル

| レベル | 条件 | 意味 |
|--------|------|------|
| 完全習得 | interval ≥ 90日 | 復習対象から外れる |
| 習得済み | 7日 ≤ interval < 90日 | だいぶ覚えている |
| 学習中 | 1日 ≤ interval < 7日 | まだ覚え始め |
| 未学習 | statsなし | 一度も解いていない |

## キーボードショートカット

| キー | 動作 |
|------|------|
| A/B/C/D | 対応する選択肢を選択 |
| N | 次の問題へ |
| S | スキップ |

## トラブルシューティング

### Service Workerが更新されない

ブラウザのDevTools → Application → Service Workers → 「Update on reload」にチェック

### データが消えた

- IndexedDBはブラウザのデータ消去で削除されます
- 定期的にZIPエクスポートでバックアップを取ることを推奨

### オフラインで動作しない

1. オンラインで一度アプリを開く（Service Workerがインストールされる）
2. DevTools → Application → Service Workers で「Activated」を確認
3. 以降はオフラインでも動作

### 「今日の学習」に問題が表示されない

- まだ復習時期が来ていない可能性があります
- 「ランダム」や「未解答問題」モードで学習を進めてください
- 新規問題がない場合は、問題を追加してください

### 完全習得した問題が多すぎて学習する問題がない

- 「🔄 再学習」ボタンで問題を学習対象に戻せます
- 新しい問題を追加することをおすすめします

## カスタマイズ

### 1日の新規問題数上限を変更

`js/sm2.js` の `getTodayStudyPlan` 関数内：

```javascript
const newQuestionsLimit = Math.max(0, 50 - reviewQuestions.length);
```

この `50` を任意の数値に変更してください。

### 完全習得の基準を変更

`js/sm2.js` の `getMasteryLevel` 関数内：

```javascript
if (stats.interval >= 90) {
    return 'completed'; // 完全習得（90日以上）
}
```

この `90` を任意の日数に変更してください。

## ライセンス

MIT License

## 使用ライブラリ

- [marked](https://github.com/markedjs/marked) - Markdownパーサー
- [DOMPurify](https://github.com/cure53/DOMPurify) - XSS対策
- [KaTeX](https://katex.org/) - LaTeX数式レンダリング
- [JSZip](https://stuk.github.io/jszip/) - ZIP処理
