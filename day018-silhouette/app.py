import streamlit as st
import numpy as np
import cv2
import mediapipe as mp
from PIL import Image
import io

# タイトルとサブタイトル
st.title("高品質シルエット抽出アプリ")
st.subheader("輪郭強化・スムージング機能付き")

# サイドバーでオプション設定
st.sidebar.header("基本設定")
bg_color = st.sidebar.color_picker("背景色", "#FFFFFF")  # 白色
silhouette_color = st.sidebar.color_picker("シルエット色", "#87CEFA")  # 水色

st.sidebar.header("エッジ処理")
edge_smooth = st.sidebar.slider("輪郭スムージング強度", 0, 30, 10)
edge_detail = st.sidebar.slider("エッジディテール保持", 0, 10, 3)

st.sidebar.header("高度な設定")
refine_iterations = st.sidebar.slider("輪郭洗練回数", 1, 10, 3)
confidence_threshold = st.sidebar.slider("検出信頼度しきい値", 0.1, 0.9, 0.3, 0.05)

# 処理モード選択
processing_mode = st.sidebar.radio(
    "処理モード",
    ["通常", "高品質（処理時間が長くなります）"]
)

# MediaPipeのセルフィーセグメンテーションモデルを初期化
@st.cache_resource
def load_mediapipe_model():
    mp_selfie_segmentation = mp.solutions.selfie_segmentation
    return mp_selfie_segmentation.SelfieSegmentation(model_selection=1)

# 画像のリサイズ（最大次元を制限）
def resize_image(image, max_dimension=1024):
    h, w = image.shape[:2]
    if max(h, w) > max_dimension:
        scale = max_dimension / max(h, w)
        return cv2.resize(image, (int(w * scale), int(h * scale)))
    return image

# 画像の前処理（画像の品質を向上）
def preprocess_image(image):
    # ノイズ除去
    denoised = cv2.fastNlMeansDenoisingColored(image, None, 5, 5, 7, 21)
    
    # コントラスト調整
    lab = cv2.cvtColor(denoised, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    lab = cv2.merge((l, a, b))
    enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
    
    return enhanced

# エッジ洗練化（輪郭をより滑らかに）
def refine_edges(mask, iterations=3):
    refined_mask = mask.copy()
    
    for _ in range(iterations):
        # 境界を抽出
        contours, _ = cv2.findContours(refined_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # 小さなコンター（ノイズ）を除去
        filtered_contours = [cnt for cnt in contours if cv2.contourArea(cnt) > 100]
        
        # 新しいマスクを作成
        refined_mask = np.zeros_like(refined_mask)
        
        # 大きなコンターのみ描画
        cv2.drawContours(refined_mask, filtered_contours, -1, 255, -1)
        
        # 輪郭を滑らかに
        refined_mask = cv2.GaussianBlur(refined_mask, (5, 5), 0)
        refined_mask = (refined_mask > 127).astype(np.uint8) * 255
    
    return refined_mask

# 高品質なマスク生成（複数のテクニックを組み合わせ）
def generate_high_quality_mask(image, selfie_segmentation, confidence_threshold=0.3):
    # MediaPipeで処理
    results = selfie_segmentation.process(image)
    mask = results.segmentation_mask
    
    # しきい値で二値化
    binary_mask = (mask > confidence_threshold).astype(np.uint8) * 255
    
    # モルフォロジー処理でノイズ除去
    kernel = np.ones((3, 3), np.uint8)
    opened = cv2.morphologyEx(binary_mask, cv2.MORPH_OPEN, kernel)
    
    # 輪郭に基づく修正
    contours, _ = cv2.findContours(opened, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    
    # 最大の輪郭のみを保持（最も大きな人物）
    if contours:
        max_contour = max(contours, key=cv2.contourArea)
        mask_from_contour = np.zeros_like(binary_mask)
        cv2.drawContours(mask_from_contour, [max_contour], 0, 255, -1)
        
        # オリジナルマスクと輪郭ベースマスクを組み合わせる
        combined_mask = cv2.bitwise_and(binary_mask, mask_from_contour)
        return combined_mask
    
    return binary_mask

# 画像の処理関数
def process_image(image, selfie_segmentation, processing_mode, edge_smooth, edge_detail, refine_iterations, confidence_threshold):
    # RGB形式に変換
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    # NumPy配列に変換
    original_img_array = np.array(image)
    
    # 処理用に画像をリサイズ
    max_dimension = 1024
    img_array = resize_image(original_img_array, max_dimension)
    
    # 元のサイズを保存
    original_height, original_width = original_img_array.shape[:2]
    
    # 前処理（高品質モード）
    if processing_mode == "高品質（処理時間が長くなります）":
        img_array = preprocess_image(img_array)
    
    # MediaPipeで処理
    if processing_mode == "高品質（処理時間が長くなります）":
        mask = generate_high_quality_mask(img_array, selfie_segmentation, confidence_threshold)
    else:
        results = selfie_segmentation.process(img_array)
        mask = (results.segmentation_mask > confidence_threshold).astype(np.uint8) * 255
    
    # エッジ洗練化
    mask = refine_edges(mask, refine_iterations)
    
    # マスクのぼかし処理（エッジをスムーズに）
    if edge_smooth > 0:
        mask = cv2.GaussianBlur(mask, (edge_smooth*2+1, edge_smooth*2+1), 0)
    
    # エッジディテールの保持
    if edge_detail > 0:
        # エッジを強調
        kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
        mask = cv2.filter2D(mask, -1, kernel)
        # 再度二値化
        _, mask = cv2.threshold(mask, 127, 255, cv2.THRESH_BINARY)
    
    # マスクを3チャンネルに拡張して正規化
    mask_3channel = cv2.cvtColor(mask, cv2.COLOR_GRAY2RGB) / 255.0
    
    # 背景色とシルエット色の設定
    bg_color_rgb = tuple(int(bg_color.lstrip('#')[i:i+2], 16) for i in (0, 2, 4))
    silhouette_color_rgb = tuple(int(silhouette_color.lstrip('#')[i:i+2], 16) for i in (0, 2, 4))
    
    # リサイズした画像と同じサイズの背景とシルエット作成
    bg = np.ones_like(img_array) * np.array(bg_color_rgb)
    fg = np.ones_like(img_array) * np.array(silhouette_color_rgb)
    
    # アルファブレンド
    result = fg * mask_3channel + bg * (1 - mask_3channel)
    result = result.astype(np.uint8)
    
    # 最終的な高品質化処理
    if processing_mode == "高品質（処理時間が長くなります）":
        # アンチエイリアシング（エッジの滑らかさをさらに向上）
        result = cv2.resize(result, (result.shape[1]*2, result.shape[0]*2))
        result = cv2.GaussianBlur(result, (3, 3), 0)
        result = cv2.resize(result, (result.shape[1]//2, result.shape[0]//2))
    
    # 元のサイズにリサイズ
    result = cv2.resize(result, (original_width, original_height))
    mask_display = cv2.resize(mask, (original_width, original_height))
    
    return result, mask_display

# 画像アップロード部分
uploaded_file = st.file_uploader("画像をアップロードしてください", type=["jpg", "jpeg", "png"])

if uploaded_file is not None:
    # 画像を読み込む
    image = Image.open(uploaded_file)
    
    # 元の画像を表示
    col1, col2 = st.columns(2)
    with col1:
        st.image(image, caption="元の画像", use_column_width=True)
    
    # MediaPipeモデルを読み込む
    selfie_segmentation = load_mediapipe_model()
    
    # 処理を実行
    with st.spinner(f"{processing_mode}モードでシルエットを抽出中..."):
        result, mask = process_image(
            image, 
            selfie_segmentation,
            processing_mode,
            edge_smooth,
            edge_detail,
            refine_iterations,
            confidence_threshold
        )
    
    # 結果を表示
    with col2:
        st.image(result, caption="シルエット", use_column_width=True)
    
    # マスク表示オプション
    if st.checkbox("セグメンテーションマスクを表示"):
        st.image(mask, caption="マスク", use_column_width=True)
    
    # ダウンロードボタン
    result_img = Image.fromarray(result)
    buf = io.BytesIO()
    result_img.save(buf, format="PNG")
    byte_im = buf.getvalue()
    
    st.download_button(
        label="シルエット画像をダウンロード",
        data=byte_im,
        file_name="silhouette.png",
        mime="image/png"
    )

# アプリの使い方
with st.expander("アプリの使い方と機能説明"):
    st.markdown("""
    ### 基本的な使い方
    1. 左側のサイドバーで背景色とシルエット色を選択
    2. エッジ処理の設定を調整
    3. 画像をアップロード
    4. 自動的にシルエットが抽出されます
    5. 「シルエット画像をダウンロード」ボタンで結果を保存

    ### 詳細設定の説明
    - **輪郭スムージング強度**: 大きい値にするとエッジがより滑らかになりますが、細部が失われる場合があります
    - **エッジディテール保持**: 大きい値にすると髪の毛などの細部が保持されますが、エッジが荒くなる場合があります
    - **輪郭洗練回数**: 輪郭を繰り返し処理する回数。多いほど滑らかになりますが、処理時間が長くなります
    - **検出信頼度しきい値**: 低い値にすると人物の範囲が広がり、高い値にすると範囲が狭くなります

    ### 処理モード
    - **通常**: 標準的な処理で高速に結果を得られます
    - **高品質**: より滑らかなエッジと精度の高いシルエットが得られますが、処理時間が長くなります
    """)

# フッター
st.markdown("---")
st.caption("このアプリはMediaPipeとStreamlitで作成されています")