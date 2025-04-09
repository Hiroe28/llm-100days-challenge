# 手書き数字認識とCNN可視化アプリ

このプロジェクトは、手書き数字認識のためのCNNモデルとそのモデルを使用した教育用Streamlitアプリケーションを組み合わせたものです。ユーザーは数字を描き、AIがそれを認識する様子と内部のCNN特徴マップを可視化することで、ディープラーニングの原理を視覚的に学ぶことができます。

## プロジェクト構成

- `train_mnist_cnn.py` - MNISTデータセットでCNNモデルを訓練するスクリプト
- `app.py` - 手書き数字認識と可視化を行うStreamlitアプリケーション
- `mnist_cnn_model.h5` - 訓練済みのモデルファイル（スクリプト実行後に生成）

## 機能

1. **CNNモデル訓練スクリプト**
   - TensorFlow/KerasでMNISTデータセットを使用
   - 精度98%以上の高性能モデルを構築
   - 訓練過程の可視化と保存
   - 詳細なコメントによる学習サポート

2. **手書き数字認識アプリ**
   - 直感的な描画キャンバス
   - リアルタイム数字認識
   - 予測確率の視覚化
   - CNNの中間層（特徴マップ）の可視化
   - 初心者向けのCNN解説

## 使用技術

- TensorFlow/Keras（深層学習フレームワーク）
- Streamlit（Webアプリケーションフレームワーク）
- streamlit-drawable-canvas（描画インターフェース）
- OpenCV（画像処理）
- Matplotlib（データ可視化）
- NumPy（数値計算）

## 使用方法

### モデルの訓練

```bash
# モデルを訓練し、保存
python train_mnist_cnn.py
```

### アプリケーションの実行

```bash
# Streamlitアプリを起動
streamlit run app.py
```

### 必要なライブラリのインストール

```bash
pip install tensorflow streamlit streamlit-drawable-canvas opencv-python matplotlib numpy pillow japanize-matplotlib
```

## アプリケーションの使い方

1. キャンバスに0〜9の数字を描く
2. AIがリアルタイムで数字を認識
3. 認識結果と確信度を確認
4. CNNの「目」（特徴マップ）を観察し、AIがどのように画像を理解しているかを学ぶ

## 教育的価値

このアプリは以下の概念の理解に役立ちます：
- 畳み込みニューラルネットワーク（CNN）の基本原理
- 画像認識における特徴抽出の仕組み
- 機械学習モデルの訓練と評価
- 画像前処理の重要性

初心者からAI学習者まで幅広い層に適した教育ツールです。

## ライセンス

MITライセンス