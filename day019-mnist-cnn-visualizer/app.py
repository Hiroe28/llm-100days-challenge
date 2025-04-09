# ② Streamlitアプリ（手書き数字認識と CNN 説明用）

import streamlit as st
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from streamlit_drawable_canvas import st_canvas
import matplotlib.pyplot as plt
import japanize_matplotlib  # 日本語フォントのサポートを追加
import cv2
from PIL import Image
import io
import os



# フォールバックモデル訓練用のモジュールを追加
# train_mnist_model_fallback.pyがない場合は直接定義
if not os.path.exists('train_mnist_model_fallback.py'):
    def train_simple_mnist_model():
        """
        簡易版のMNISTモデルを訓練して返す関数
        Streamlit Cloud環境用のフォールバックとして使用
        """
        st.info("モデルファイルが見つからないため、簡易版モデルを訓練しています。これには数分かかる場合があります...")
        
        # MNISTデータセットのロード
        (train_images, train_labels), (test_images, test_labels) = tf.keras.datasets.mnist.load_data()
        
        # データの前処理（正規化）
        train_images = train_images / 255.0
        test_images = test_images / 255.0
        
        # CNNは入力として3次元のテンソルを期待するので、チャネル次元を追加
        train_images = train_images.reshape(train_images.shape[0], 28, 28, 1)
        test_images = test_images.reshape(test_images.shape[0], 28, 28, 1)
        
        # 訓練データを減らして訓練を高速化（Streamlit Cloudでの初期ロード時間短縮のため）
        train_images = train_images[:10000]
        train_labels = train_labels[:10000]
        
        # 簡易版CNNモデルの構築（元のモデルよりもシンプルなアーキテクチャ）
        model = tf.keras.models.Sequential()
        
        # 畳み込み層とプーリング層
        model.add(tf.keras.layers.Conv2D(16, (3, 3), activation='relu', input_shape=(28, 28, 1)))
        model.add(tf.keras.layers.MaxPooling2D((2, 2)))
        model.add(tf.keras.layers.Conv2D(32, (3, 3), activation='relu'))
        model.add(tf.keras.layers.MaxPooling2D((2, 2)))
        model.add(tf.keras.layers.Flatten())
        model.add(tf.keras.layers.Dense(64, activation='relu'))
        model.add(tf.keras.layers.Dense(10, activation='softmax'))
        
        # モデルのコンパイル
        model.compile(optimizer='adam',
                    loss='sparse_categorical_crossentropy',
                    metrics=['accuracy'])
        
        # モデルの訓練（少ないエポック数で訓練を高速化）
        model.fit(train_images, train_labels, epochs=3, batch_size=64, verbose=1)
        
        # モデルの評価
        test_loss, test_acc = model.evaluate(test_images, test_labels, verbose=0)
        st.success(f"簡易版モデルの訓練が完了しました（精度: {test_acc:.4f}）")
        
        return model

# ページ設定
st.set_page_config(page_title="手書き数字認識アプリ - CNN学習ツール", layout="wide")

# タイトルと紹介
st.title("手書き数字認識アプリ")
st.markdown("""
## このアプリについて
このアプリは、あなたが描いた数字（0〜9）をAIが認識します。
AIの「目」がどのようにあなたの描いた数字を認識しているのかを、
視覚的に理解することができます。
""")

# サイドバーにCNNの説明を追加
with st.sidebar:
    st.header("CNN（畳み込みニューラルネットワーク）とは？")
    st.markdown("""
    CNNは、**画像の中から特徴を自動で見つけて判断するAI**の一種です。
    
    人間が物を見るとき、無意識のうちに「形」「エッジ」「模様」などの特徴を捉えて認識しています。
    CNNもこれと似た方法で画像を理解します。
    
    ### CNNの特徴
    1. **畳み込み層**：画像の中の特徴（線、エッジ、模様など）を検出
    2. **プーリング層**：重要な特徴を残しつつ、データを圧縮
    3. **全結合層**：検出した特徴を組み合わせて最終的な判断を行う
    
    ### 特徴マップとは？
    特徴マップは、CNNが「何を見ているか」を視覚化したものです。
    明るい部分は、AIがその領域に注目していることを示しています。
    
    ### 画像前処理について
    あなたが描いた画像は、AIが理解しやすいように以下の処理が行われています：
    1. **サイズ変更**：28×28ピクセルにリサイズ
    2. **反転**：MNISTデータセットの形式に合わせて色を反転
    3. **正規化**：ピクセル値を0〜1の範囲に変換
    """)

# モデルの読み込み
# モデルのロード関数を修正
@st.cache_resource
def load_mnist_model():
    import os
    
    # 現在のスクリプトのディレクトリパスを取得
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # スクリプトが特定のディレクトリ内にある場合（day019-mnist-cnn-visualizer）
    base_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "day019-mnist-cnn-visualizer")
    
    # 可能性のあるモデルファイルパスのリスト
    possible_model_paths = [
        os.path.join(script_dir, 'mnist_cnn_model.h5'),               # 同じディレクトリ
        os.path.join(base_dir, 'mnist_cnn_model.h5'),                 # サブディレクトリ
        os.path.join('/mount/src/llm-100days-challenge/day019-mnist-cnn-visualizer', 'mnist_cnn_model.h5')  # 絶対パス
    ]
    
    # デバッグ用に現在のパス情報を表示
    st.write("現在のスクリプトディレクトリ:", script_dir)
    st.write("推測されるベースディレクトリ:", base_dir)
    
    # 各パスを試行
    for model_path in possible_model_paths:
        st.write(f"モデルファイルの検索: {model_path}")
        if os.path.exists(model_path):
            st.write(f"モデルファイルが見つかりました: {model_path}")
            try:
                # 既存のモデルファイルを読み込む
                model = load_model(model_path)
                # モデルを初期化するためにダミー入力で予測を実行
                dummy_input = np.zeros((1, 28, 28, 1), dtype=np.float32)
                model.predict(dummy_input)
                st.success(f"モデルを正常に読み込みました: {model_path}")
                return model
            except Exception as e:
                st.warning(f"モデルファイルを読み込めませんでした: {str(e)}")
    
    # どのパスでもモデルが見つからない場合はフォールバック
    st.warning("モデルファイルが見つからないため、その場でモデルを訓練します")
    try:
        # フォールバック: 簡易版のモデルをその場で訓練
        model = train_simple_mnist_model()
        return model
    except Exception as train_error:
        st.error(f"モデルの訓練にも失敗しました: {str(train_error)}")
        return None

model = load_mnist_model()

# 特徴マップを取得する関数
def get_feature_maps(model, img):
    # 代替アプローチ：中間層の出力を直接取得する代わりに、各層ごとに個別のモデルを作成
    img_array = np.expand_dims(img, axis=0)  # バッチ次元を追加
    
    # 畳み込み層を特定
    conv_layers = [i for i, layer in enumerate(model.layers) if 'conv' in layer.name.lower()]
    
    # 特徴マップのリスト
    feature_maps = []
    
    # 各畳み込み層に対して処理
    for layer_idx in conv_layers:
        try:
            # 現在の畳み込み層までの部分モデルを作成
            temp_model = tf.keras.Sequential(model.layers[:layer_idx+1])
            # 入力形状を設定
            temp_model.build(input_shape=(None, 28, 28, 1))
            # 特徴マップを取得
            feature_map = temp_model.predict(img_array)
            feature_maps.append(feature_map)
        except Exception as e:
            st.warning(f"レイヤー {layer_idx} からの特徴マップ抽出中にエラー: {e}")
    
    return feature_maps

# 特徴マップを表示する関数
def plot_feature_maps(feature_maps, max_features=8):
    figures = []
    
    for i, feature_map in enumerate(feature_maps):
        # エラー処理: 特徴マップが空の場合はスキップ
        if feature_map is None or feature_map.size == 0:
            continue
            
        # 最初のバッチの特徴マップのみを使用
        feature_map = feature_map[0]
        
        # 表示する特徴マップの数を制限（多すぎると見にくいため）
        n_features = min(max_features, feature_map.shape[-1])
        
        # 特徴マップの表示用の図を作成
        fig, axes = plt.subplots(1, n_features, figsize=(2*n_features, 2))
        fig.suptitle(f"畳み込み層 {i+1} の特徴マップ")
        
        # 1つの特徴マップの場合の処理
        if n_features == 1:
            axes.imshow(feature_map[:, :, 0], cmap='viridis')
            axes.set_title(f"フィルタ 1")
            axes.axis('off')
        else:
            # 複数の特徴マップの場合
            for j in range(n_features):
                axes[j].imshow(feature_map[:, :, j], cmap='viridis')
                axes[j].set_title(f"フィルタ {j+1}")
                axes[j].axis('off')
        
        plt.tight_layout()
        
        # 図をバイトデータに変換
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        plt.close(fig)
        buf.seek(0)
        figures.append(buf)
    
    return figures

# メイン領域の構成
col1, col2 = st.columns([1, 1])

with col1:
    st.subheader("ここに数字（0〜9）を描いてください")
    
    # キャンバスのサイズと背景色を設定
    canvas_result = st_canvas(
        fill_color="black",  # 描画色
        stroke_width=20,     # 描画の太さ
        stroke_color="white",  # 線の色
        background_color="black",  # 背景色
        width=280,
        height=280,
        drawing_mode="freedraw",
        key="canvas",
    )

# 描画があれば処理を続行
if canvas_result.image_data is not None and model is not None:
    try:
        # 描画した画像をグレースケールに変換し、MNIST形式に前処理
        img = canvas_result.image_data.astype(np.uint8)
        img_gray = cv2.cvtColor(img, cv2.COLOR_RGBA2GRAY)
        img_resized = cv2.resize(img_gray, (28, 28), interpolation=cv2.INTER_AREA)
        
        # 画像の前処理（正規化）
        img_normalized = img_resized / 255.0
        
        with col2:
            st.subheader("処理された画像")
            
            # 処理後の画像を表示
            fig, ax = plt.subplots()
            ax.imshow(img_normalized, cmap='gray')
            ax.set_title("MNISTフォーマット (28x28)")
            ax.axis('off')
            st.pyplot(fig)
            
            # 予測実行
            img_input = img_normalized.reshape(1, 28, 28, 1)
            predictions = model.predict(img_input)[0]
            predicted_digit = np.argmax(predictions)
            confidence = predictions[predicted_digit] * 100
            
            # 予測結果を表示
            st.subheader(f"予測結果: {predicted_digit}")
            st.write(f"確信度: {confidence:.2f}%")
            
            # 全クラスの予測確率をグラフで表示
            st.subheader("各数字の予測確率")
            fig, ax = plt.subplots(figsize=(10, 3))
            bars = ax.bar(range(10), predictions * 100)
            ax.set_xticks(range(10))
            ax.set_ylabel('確率 (%)')
            ax.set_xlabel('数字')
            ax.set_title('予測確率分布')
            
            # 予測されたクラスのバーを強調表示
            bars[predicted_digit].set_color('red')
            st.pyplot(fig)
        
        # 特徴マップの表示
        st.subheader("CNNの「目」- 特徴マップの可視化")
        st.markdown("これらの画像は、AIがあなたの描いた数字のどの部分に注目しているかを示しています。")
        
        try:
            # 特徴マップの取得と表示
            feature_maps = get_feature_maps(model, img_normalized)
            feature_map_images = plot_feature_maps(feature_maps)
            
            # 特徴マップが取得できた場合のみ表示
            if feature_map_images:
                for i, img_buf in enumerate(feature_map_images):
                    try:
                        st.image(img_buf, caption=f"畳み込み層 {i+1} の特徴マップ", use_container_width=True)
                    except TypeError:
                        # 古いバージョンのStreamlitでは use_column_widthを使用
                        st.image(img_buf, caption=f"畳み込み層 {i+1} の特徴マップ", use_column_width=True)
            else:
                st.warning("特徴マップを表示できません。モデルの構造を確認してください。")
        except Exception as e:
            st.error(f"特徴マップの生成中にエラーが発生しました: {str(e)}")
            # フォールバック：特徴マップが表示できない場合の説明
            st.markdown("""
            ### CNNの動作原理
            - 畳み込み層では基本的な線やエッジを検出します
            - より深い層では複雑なパターンやテクスチャを検出します
            
            これらの特徴を組み合わせることで、AIは数字を認識しています。
            """)
    except Exception as e:
        st.error(f"画像処理または予測中にエラーが発生しました: {str(e)}")
        st.info("もう一度描画してみてください。")


# その他の説明
st.markdown("""
## このアプリで学べること
1. AIが画像をどのように「見て」いるのか
2. CNNの基本的な仕組み
3. 画像認識における特徴抽出の重要性

いろいろな数字や形を描いて、AIの反応を観察してみましょう！
""")