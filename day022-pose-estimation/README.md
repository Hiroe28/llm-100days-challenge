# ポーズ推定デモアプリ

MediaPipeの学習済みモデルを活用し、アップロードされた画像から人物の骨格（ポーズ）を推定して可視化するStreamlitアプリケーションです。

## 機能

- 画像アップロードによる人物のポーズ推定
- カスタマイズ可能な骨格表示（色、サイズ、線の太さ）
- 3種類の表示モード（標準表示、カラフルスケルトン、アバター表示）
- 姿勢判定機能（肩の水平度、腰の水平度、背骨の垂直性、膝の伸展などを評価）
- 詳細なランドマーク情報の表示
- 推定結果画像のダウンロード機能

## 技術スタック

- **Streamlit**: ウェブアプリケーションのフレームワーク
- **MediaPipe**: Googleが開発した機械学習ソリューション
- **OpenCV**: 画像処理ライブラリ
- **NumPy**: 数値計算ライブラリ
- **Pillow**: 画像操作ライブラリ

## インストール方法

必要なライブラリをインストールします：

```bash
pip install streamlit mediapipe opencv-python numpy pillow
```

## 使用方法

1. リポジトリをクローンするか、アプリのコードをダウンロードします
2. ターミナルで以下のコマンドを実行してアプリを起動します：

```bash
streamlit run app.py
```

3. ブラウザで表示されるStreamlitアプリに画像をアップロードして、ポーズ推定結果を確認します

## LLMアプリ100日チャレンジ - Day 022

このプロジェクトは「LLMアプリ100日チャレンジ」の22日目の成果物です。AIと機械学習技術を活用した実用的なアプリケーションの開発に取り組んでいます。

---

## 姿勢判定について

このアプリには姿勢判定機能が組み込まれており、以下の要素を分析します：

- **肩の水平度**: 両肩の高さが揃っているか
- **腰の水平度**: 骨盤が水平に保たれているか
- **背骨の垂直性**: 背筋がどれだけ垂直に保たれているか
- **膝の伸展**: 膝がまっすぐ伸びているか
- **頭の位置**: 頭が前に出ていないか（猫背チェック）

これらの要素を総合的に評価し、姿勢スコアと具体的な改善アドバイスを提供します。