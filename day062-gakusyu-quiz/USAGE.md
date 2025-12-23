# 学習クイズアプリ

四択クイズで学習できるPWA（Progressive Web App）です。問題の登録・編集・削除、復習機能、Markdown・LaTeX数式対応など、学習に必要な機能を備えています。

## 機能

- **四択クイズ** - A〜Dの選択肢から解答  
- **問題管理** - 問題の追加・編集・削除
- **復習機能** - 間違えた問題を優先的に出題
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

1. アプリを開くと「サンプルデータをインポートしますか？」と表示
2. 「はい」を選択するとサンプル問題が読み込まれます
3. 「いいえ」を選択した場合は、管理画面から問題を追加できます

### クイズを解く

1. 下部ナビゲーションの「解く」をタップ
2. 出題モードを選択
   - **ランダム**: 全問題からランダムに出題
   - **タグ指定**: 特定のタグの問題のみ出題
   - **復習優先**: 間違えた問題を優先的に出題
3. 「クイズを開始」をタップ
4. A〜Dの選択肢から解答（キーボード: A/B/C/Dキー）
5. 正誤と解説が表示される
6. 「次へ」で次の問題（キーボード: Nキー）

### 復習する

1. 下部ナビゲーションの「復習」をタップ
2. 復習が必要な問題の一覧が表示
3. 「誤答回数順」「最近間違えた順」で並び替え可能
4. 「復習を開始」でクイズ形式で復習

### 問題を管理する

1. 下部ナビゲーションの「管理」をタップ
2. 問題一覧が表示（検索・タグ絞り込み可能）
3. 「+ 問題を追加」で新規作成
4. 既存問題の「編集」「削除」も可能

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
2. **ZIPエクスポート**: 問題・画像・進捗を全てZIPで保存
3. **JSONエクスポート**: 問題データのみJSON形式で保存
4. **進捗エクスポート**: 統計・解答履歴のみ保存

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
│   └── export-import.js    # エクスポート/インポート
├── sw.js                   # Service Worker
├── manifest.webmanifest    # PWAマニフェスト
├── icons/
│   ├── icon.svg            # アイコン（SVG元データ）
│   ├── icon-192.png        # アイコン（192x192）
│   └── icon-512.png        # アイコン（512x512）
├── sample-data.json        # サンプル問題データ
└── README.md               # このファイル
```

## データモデル

### IndexedDBストア

- **questions**: 問題データ
- **assets**: 画像などのアセット
- **attempts**: 解答履歴
- **stats**: 問題ごとの統計

### 問題データ構造

JSON入力やインポート時は以下の形式で入力します（IDは自動生成されます）：

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

## ライセンス

MIT License

## 使用ライブラリ

- [marked](https://github.com/markedjs/marked) - Markdownパーサー
- [DOMPurify](https://github.com/cure53/DOMPurify) - XSS対策
- [KaTeX](https://katex.org/) - LaTeX数式レンダリング
- [JSZip](https://stuk.github.io/jszip/) - ZIP処理
