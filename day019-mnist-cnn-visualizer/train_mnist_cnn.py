# ① CNNモデルを訓練して保存するスクリプト
# MNIST手書き数字データセットを使用したCNNモデルの学習

import tensorflow as tf
from tensorflow.keras import datasets, layers, models
import matplotlib.pyplot as plt
import japanize_matplotlib
import numpy as np

# MNISTデータセットのロード
print("MNISTデータセットをロード中...")
(train_images, train_labels), (test_images, test_labels) = datasets.mnist.load_data()

# データの前処理
# 画像を0-1の範囲に正規化（元のデータは0-255の範囲）
train_images = train_images / 255.0
test_images = test_images / 255.0

# CNNは入力として3次元のテンソルを期待するので、チャネル次元を追加
train_images = train_images.reshape(train_images.shape[0], 28, 28, 1)
test_images = test_images.reshape(test_images.shape[0], 28, 28, 1)

print(f"訓練データ: {train_images.shape} {train_labels.shape}")
print(f"テストデータ: {test_images.shape} {test_labels.shape}")

# CNNモデルの構築
print("CNNモデルを構築中...")
model = models.Sequential()

# 第1畳み込み層: 特徴抽出の最初のステージ
# 32個のフィルタ（特徴検出器）を使用し、各フィルタは3x3の領域を走査
# CNNとは？: 畳み込み層では、小さなフィルタを画像全体に適用し、エッジや線などの基本的な特徴を検出します
model.add(layers.Conv2D(32, (3, 3), activation='relu', input_shape=(28, 28, 1)))

# 第1プーリング層: 特徴マップのサイズを縮小し、計算効率を向上させる
# 2x2の領域から最大値を取り出して新しい特徴マップを作成
# プーリングとは？: 画像の位置に対する若干の変化に対して頑健性を持たせるために使用されます
model.add(layers.MaxPooling2D((2, 2)))

# 第2畳み込み層: より高レベルな特徴を検出
# 64個のフィルタを使用し、第1層で検出した基本的な特徴から、より複雑なパターンを検出
model.add(layers.Conv2D(64, (3, 3), activation='relu'))

# 第2プーリング層
model.add(layers.MaxPooling2D((2, 2)))

# 特徴マップを1次元に変換
# 畳み込み層とプーリング層で抽出した特徴を、全結合層に渡すために1次元に変換
model.add(layers.Flatten())

# 第1全結合層: 高レベルの推論を行う
# 128ノードの全結合層で、抽出された特徴を組み合わせて高次のパターンを認識
model.add(layers.Dense(128, activation='relu'))

# ドロップアウト層: オーバーフィッティングを防止
# 訓練時にランダムに50%のノードを無効化し、モデルの汎化性能を向上
model.add(layers.Dropout(0.5))

# 出力層: 10クラス（数字0-9）の分類を行う
# ソフトマックス活性化関数を使用して、各クラスに属する確率を出力
model.add(layers.Dense(10, activation='softmax'))

# モデルの概要を表示
model.summary()

# モデルのコンパイル
# 損失関数、オプティマイザ、評価指標を設定
model.compile(optimizer='adam',
              loss='sparse_categorical_crossentropy',
              metrics=['accuracy'])

# モデルの訓練
print("モデルの訓練を開始...")
history = model.fit(train_images, train_labels, epochs=15, 
                    validation_data=(test_images, test_labels),
                    batch_size=64)

# モデルの評価
test_loss, test_acc = model.evaluate(test_images, test_labels, verbose=2)
print(f'\nテストデータでの精度: {test_acc:.4f}')

# 訓練履歴をプロット
plt.figure(figsize=(12, 4))

# 精度のプロット
plt.subplot(1, 2, 1)
plt.plot(history.history['accuracy'], label='訓練精度')
plt.plot(history.history['val_accuracy'], label='検証精度')
plt.xlabel('エポック')
plt.ylabel('精度')
plt.ylim([0.9, 1])
plt.legend(loc='lower right')
plt.title('訓練・検証精度')

# 損失のプロット
plt.subplot(1, 2, 2)
plt.plot(history.history['loss'], label='訓練損失')
plt.plot(history.history['val_loss'], label='検証損失')
plt.xlabel('エポック')
plt.ylabel('損失')
plt.legend(loc='upper right')
plt.title('訓練・検証損失')

plt.savefig('training_history.png')
plt.close()

print("訓練履歴を 'training_history.png' に保存しました")

# モデルの保存
model.save('mnist_cnn_model.h5')
print("モデルを 'mnist_cnn_model.h5' として保存しました")

# CNNの動作原理の説明
print("\nCNNの動作原理:")
print("1. 畳み込み層: 画像内の特徴（エッジ、テクスチャなど）を検出するフィルタを使用")
print("2. プーリング層: 特徴マップのサイズを縮小し、位置の変化に対する頑健性を向上")
print("3. 全結合層: 抽出された特徴を組み合わせて最終的な分類を実行")
print("このモデルは画像から特徴を自動で抽出し、それらを組み合わせて数字を判別しています")