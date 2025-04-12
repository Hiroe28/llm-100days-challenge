import streamlit as st
import numpy as np
from PIL import Image
import io
import os
import math
import random

# 事前にインポート問題を確認
try:
    import cv2
    cv2_import_successful = True
    cv2_status = "✅ OpenCV: 正常"
except ImportError as e:
    cv2_import_successful = False
    cv2_status = f"❌ OpenCV: インポートエラー ({e})"

# 様々なパスでモデルフォルダを探す
script_dir = os.path.dirname(os.path.abspath(__file__))
base_dir = os.path.dirname(script_dir)  # llm-100days-challenge ディレクトリ

# 可能性のあるモデルフォルダパスのリスト
possible_model_paths = [
    os.path.join(script_dir, 'models'),  # 同じディレクトリ内の models フォルダ
    os.path.join(base_dir, 'day022-pose-estimation', 'models'),  # リポジトリパス指定
    '/mount/src/llm-100days-challenge/day022-pose-estimation/models',  # Streamlit Cloud での絶対パス
]

# モデルフォルダを探す
model_path = None
for path in possible_model_paths:
    if os.path.exists(path):
        model_path = path
        break

# モデルパスの設定
if model_path:
    os.environ["MEDIAPIPE_MODEL_PATH"] = model_path
    model_status = f"✅ ローカルモデルを使用します: {model_path}"
else:
    model_status = "⚠️ ローカルモデルフォルダが見つかりません。オンラインモデルを使用します。"

# MediaPipeをインポート (モデルパス設定後)
try:
    import mediapipe as mp
    mp_import_successful = True
    mp_status = "✅ MediaPipe: 正常"
except ImportError as e:
    mp_import_successful = False
    mp_status = f"❌ MediaPipe: インポートエラー ({e})"

# ページ設定
st.set_page_config(
    page_title="ポーズ推定デモアプリ",
    page_icon="🧍",
    layout="wide"
)

# 様々なパスでモデルフォルダを探す
script_dir = os.path.dirname(os.path.abspath(__file__))
base_dir = os.path.dirname(script_dir)  # llm-100days-challenge ディレクトリ

# 可能性のあるモデルフォルダパスのリスト
possible_model_paths = [
    os.path.join(script_dir, 'models'),  # 同じディレクトリ内の models フォルダ
    os.path.join(base_dir, 'day022-pose-estimation', 'models'),  # リポジトリパス指定
    '/mount/src/llm-100days-challenge/day022-pose-estimation/models',  # Streamlit Cloud での絶対パス
]

# モデルフォルダを探す
model_path = None
for path in possible_model_paths:
    if os.path.exists(path):
        model_path = path
        break

# モデルパスの設定
if model_path:
    os.environ["MEDIAPIPE_MODEL_PATH"] = model_path
    model_status = f"ローカルモデルを使用します: {model_path}"
else:
    model_status = "ローカルモデルフォルダが見つかりません。オンラインモデルを使用します。"

# タイトル
st.title("MediaPipeポーズ推定デモアプリ")
st.write("画像をアップロードして人物のポーズを推定します。")

# サイドバーにMediaPipeの解説を追加
with st.sidebar:
    st.header("MediaPipeについて")
    st.write("""
    **MediaPipe**はGoogleが開発した機械学習ソリューションのフレームワークです。
    
    **ポーズ推定モデル**は、画像内の人物の33の身体キーポイント（関節や顔のランドマーク）を検出します。
    
    主な特徴:
    - リアルタイム処理が可能
    - 複数のプラットフォームでの実行に対応
    - 高精度な姿勢の検出
    - 様々なアプリケーションに応用可能（フィットネス、アニメーション、AR/VRなど）
    """)
    
    st.image("https://developers.google.com/static/mediapipe/images/solutions/pose_landmarks_index.png", 
             caption="MediaPipeの33キーポイント", 
             use_container_width=True)
    
    # 表示オプションセクション
    st.header("表示オプション")
    
    landmark_color = st.color_picker("ランドマークの色", "#FF0000")
    landmark_size = st.slider("ランドマークのサイズ", 1, 15, 8)
    
    connection_color = st.color_picker("骨格線の色", "#00FF00")
    connection_thickness = st.slider("骨格線の太さ", 1, 10, 4)
    
    display_mode = st.radio(
        "表示モード",
        ["標準表示", "カラフルスケルトン", "アバター表示"]
    )

# カスタム描画スタイルの定義
def get_custom_drawing_styles(landmark_color, landmark_size, connection_color, connection_thickness):
    landmark_drawing_spec = mp_drawing.DrawingSpec(
        color=tuple(int(landmark_color.lstrip('#')[i:i+2], 16) for i in (0, 2, 4)),
        thickness=landmark_size,
        circle_radius=landmark_size
    )
    
    connection_drawing_spec = mp_drawing.DrawingSpec(
        color=tuple(int(connection_color.lstrip('#')[i:i+2], 16) for i in (0, 2, 4)),
        thickness=connection_thickness
    )
    
    return landmark_drawing_spec, connection_drawing_spec

# カラフルスケルトン用の色生成
def generate_colorful_specs():
    landmark_specs = {}
    connection_specs = {}
    
    # 体の部位ごとにグループ化された接続
    body_parts = {
        "頭部": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        "右腕": [11, 13, 15, 17, 19, 21],
        "左腕": [12, 14, 16, 18, 20, 22],
        "右脚": [23, 25, 27, 29, 31],
        "左脚": [24, 26, 28, 30, 32],
        "胴体": [11, 12, 23, 24]
    }
    
    # 部位ごとに異なる色を設定
    colors = {
        "頭部": (255, 0, 0),   # 赤
        "右腕": (0, 255, 0),   # 緑
        "左腕": (0, 0, 255),   # 青
        "右脚": (255, 255, 0), # 黄
        "左脚": (0, 255, 255), # シアン
        "胴体": (255, 0, 255)  # マゼンタ
    }
    
    # 各ランドマークに描画仕様を設定
    for part, indices in body_parts.items():
        for idx in indices:
            landmark_specs[idx] = mp_drawing.DrawingSpec(
                color=colors[part],
                thickness=landmark_size,
                circle_radius=landmark_size
            )
    
    # 接続の描画仕様を設定
    for connection in mp_pose.POSE_CONNECTIONS:
        # 接続の両端がどの部位に属するか確認
        for part, indices in body_parts.items():
            if connection[0] in indices and connection[1] in indices:
                connection_specs[connection] = mp_drawing.DrawingSpec(
                    color=colors[part],
                    thickness=connection_thickness
                )
                break
        
        # どの部位にも明確に属さない場合はデフォルト色を使用
        if connection not in connection_specs:
            connection_specs[connection] = mp_drawing.DrawingSpec(
                color=(128, 128, 128),
                thickness=connection_thickness
            )
    
    return landmark_specs, connection_specs

# カスタム描画関数
def draw_custom_landmarks(image, landmarks, connections, landmark_spec, connection_spec):
    if not landmarks:
        return image
    
    h, w = image.shape[0], image.shape[1]
    
    # ランドマークを描画
    for idx, landmark in enumerate(landmarks.landmark):
        x, y = int(landmark.x * w), int(landmark.y * h)
        if 0 <= x < w and 0 <= y < h and landmark.visibility > 0.5:
            cv2.circle(
                image, 
                (x, y), 
                landmark_spec.circle_radius,
                landmark_spec.color, 
                landmark_spec.thickness
            )
    
    # 接続を描画
    for connection in connections:
        start_idx, end_idx = connection
        start = landmarks.landmark[start_idx]
        end = landmarks.landmark[end_idx]
        
        # 可視性チェック
        if start.visibility > 0.5 and end.visibility > 0.5:
            start_point = (int(start.x * w), int(start.y * h))
            end_point = (int(end.x * w), int(end.y * h))
            
            if (0 <= start_point[0] < w and 0 <= start_point[1] < h and
                0 <= end_point[0] < w and 0 <= end_point[1] < h):
                cv2.line(
                    image, 
                    start_point, 
                    end_point, 
                    connection_spec.color, 
                    connection_spec.thickness
                )
    
    return image

# カラフル描画関数
def draw_colorful_landmarks(image, landmarks, connections, landmark_specs, connection_specs):
    if not landmarks:
        return image
    
    h, w = image.shape[0], image.shape[1]
    
    # ランドマークを描画
    for idx, landmark in enumerate(landmarks.landmark):
        x, y = int(landmark.x * w), int(landmark.y * h)
        if 0 <= x < w and 0 <= y < h and landmark.visibility > 0.5:
            spec = landmark_specs.get(idx, mp_drawing.DrawingSpec())
            cv2.circle(
                image, 
                (x, y), 
                spec.circle_radius,
                spec.color, 
                spec.thickness
            )
    
    # 接続を描画
    for connection in connections:
        start_idx, end_idx = connection
        spec = connection_specs.get(connection, mp_drawing.DrawingSpec())
        
        start = landmarks.landmark[start_idx]
        end = landmarks.landmark[end_idx]
        
        # 可視性チェック
        if start.visibility > 0.5 and end.visibility > 0.5:
            start_point = (int(start.x * w), int(start.y * h))
            end_point = (int(end.x * w), int(end.y * h))
            
            if (0 <= start_point[0] < w and 0 <= start_point[1] < h and
                0 <= end_point[0] < w and 0 <= end_point[1] < h):
                cv2.line(
                    image, 
                    start_point, 
                    end_point, 
                    spec.color, 
                    spec.thickness
                )
    
    return image

# アバター描画関数
def draw_avatar(image, landmarks):
    if not landmarks:
        return image
    
    h, w = image.shape[0], image.shape[1]
    
    # 半透明の黒い背景を作成（元の画像を暗くする）
    overlay = image.copy()
    cv2.rectangle(overlay, (0, 0), (w, h), (0, 0, 0), -1)
    alpha = 0.7  # 透明度
    image = cv2.addWeighted(overlay, alpha, image, 1 - alpha, 0)
    
    # シンプルなスティックフィギュアを描画
    for connection in mp_pose.POSE_CONNECTIONS:
        start_idx, end_idx = connection
        start = landmarks.landmark[start_idx]
        end = landmarks.landmark[end_idx]
        
        if start.visibility > 0.5 and end.visibility > 0.5:
            start_point = (int(start.x * w), int(start.y * h))
            end_point = (int(end.x * w), int(end.y * h))
            
            if (0 <= start_point[0] < w and 0 <= start_point[1] < h and
                0 <= end_point[0] < w and 0 <= end_point[1] < h):
                # 体の部位によって色を変える
                color = (0, 255, 255)  # デフォルト：シアン
                
                # 頭と顔
                if start_idx < 11 or end_idx < 11:
                    color = (255, 200, 0)  # 黄色っぽい
                
                # 腕
                elif (11 <= start_idx <= 22 and 11 <= end_idx <= 22):
                    color = (0, 255, 0)  # 緑
                
                # 脚
                elif start_idx >= 23 or end_idx >= 23:
                    color = (255, 0, 255)  # マゼンタ
                
                # 胴体
                elif (start_idx in [11, 12, 23, 24] and end_idx in [11, 12, 23, 24]):
                    color = (255, 255, 255)  # 白
                
                # 太めの線でキャラクター風に
                cv2.line(image, start_point, end_point, color, 8)
    
    # 特定のランドマークに円を描画して関節を表現
    joint_indices = [0, 4, 7, 8, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]
    for idx in joint_indices:
        landmark = landmarks.landmark[idx]
        if landmark.visibility > 0.5:
            x, y = int(landmark.x * w), int(landmark.y * h)
            if 0 <= x < w and 0 <= y < h:
                # 頭は特別に大きく
                if idx == 0:
                    cv2.circle(image, (x, y), 25, (255, 200, 0), -1)
                    # 顔に表情を追加（シンプルな笑顔）
                    eye_offset = 10
                    cv2.circle(image, (x - eye_offset, y - 5), 5, (0, 0, 0), -1)
                    cv2.circle(image, (x + eye_offset, y - 5), 5, (0, 0, 0), -1)
                    cv2.ellipse(image, (x, y + 10), (10, 5), 0, 0, 180, (0, 0, 0), 2)
                else:
                    cv2.circle(image, (x, y), 10, (255, 255, 0), -1)
    
    return image

# ポーズ検出関数
def detect_pose(image_bytes, display_mode):
    # PILイメージをOpenCVイメージに変換
    img = Image.open(io.BytesIO(image_bytes))
    img_array = np.array(img)
    
    # RGB変換（MediaPipeはRGBを想定）
    img_rgb = cv2.cvtColor(img_array, cv2.COLOR_BGR2RGB)
    
    # 検出実行
    with mp_pose.Pose(
        static_image_mode=True,
        # model_complexity=2,
        model_complexity=0,  # 2から0に変更（軽量モデルを使用）
        enable_segmentation=True,
        min_detection_confidence=0.5
    ) as pose:
        results = pose.process(img_rgb)
    
    # 描画スタイルを設定
    landmark_spec, connection_spec = get_custom_drawing_styles(
        landmark_color, landmark_size, connection_color, connection_thickness
    )
    
    colorful_landmark_specs, colorful_connection_specs = generate_colorful_specs()
    
    # 結果を描画
    annotated_image = img_array.copy()
    if results.pose_landmarks:
        if display_mode == "標準表示":
            # カスタム描画
            annotated_image = draw_custom_landmarks(
                annotated_image, 
                results.pose_landmarks, 
                mp_pose.POSE_CONNECTIONS,
                landmark_spec,
                connection_spec
            )
        elif display_mode == "カラフルスケルトン":
            # カラフル描画
            annotated_image = draw_colorful_landmarks(
                annotated_image, 
                results.pose_landmarks, 
                mp_pose.POSE_CONNECTIONS,
                colorful_landmark_specs,
                colorful_connection_specs
            )
        elif display_mode == "アバター表示":
            # アバター描画
            annotated_image = draw_avatar(
                annotated_image,
                results.pose_landmarks
            )
    
    return annotated_image, results.pose_landmarks

    # シンプルな姿勢判定機能
with st.sidebar:
    st.header("姿勢判定")
    enable_posture_check = st.checkbox("姿勢判定を有効にする", value=True)

# 画像アップロード部分
uploaded_file = st.file_uploader("画像をアップロードしてください", type=["jpg", "jpeg", "png"])

if uploaded_file is not None:
    # 画像を読み込み
    file_bytes = uploaded_file.getvalue()
    
    # 処理を実行
    result_image, landmarks = detect_pose(file_bytes, display_mode)
    
    # 結果を表示
    col1, col2 = st.columns(2)
    
    with col1:
        st.header("元の画像")
        st.image(uploaded_file, use_container_width=True)
    
    with col2:
        st.header("ポーズ推定結果")
        st.image(result_image, use_container_width=True)
    
    # 姿勢判定機能
    if landmarks and enable_posture_check:
        st.header("姿勢判定結果")
        
        # 必要なランドマークを取得
        nose = landmarks.landmark[0]
        left_shoulder = landmarks.landmark[11]
        right_shoulder = landmarks.landmark[12]
        left_hip = landmarks.landmark[23]
        right_hip = landmarks.landmark[24]
        left_knee = landmarks.landmark[25]
        right_knee = landmarks.landmark[26]
        left_ankle = landmarks.landmark[27]
        right_ankle = landmarks.landmark[28]
        left_ear = landmarks.landmark[7]
        right_ear = landmarks.landmark[8]
        
        # 1. 肩の水平度チェック
        shoulder_diff = abs(left_shoulder.y - right_shoulder.y)
        shoulder_score = int(100 - (shoulder_diff * 500))  # 500は感度係数
        shoulder_score = max(0, min(100, shoulder_score))
        
        # 2. 腰の水平度チェック
        hip_diff = abs(left_hip.y - right_hip.y)
        hip_score = int(100 - (hip_diff * 500))
        hip_score = max(0, min(100, hip_score))
        
        # 3. 頭の位置（前傾姿勢チェック）
        # 頭が肩より前に出ているかどうか
        ear_shoulder_x_diff = ((left_ear.x + right_ear.x) / 2) - ((left_shoulder.x + right_shoulder.x) / 2)
        head_forward = ear_shoulder_x_diff > 0.05
        
        # 4. 背骨の垂直性
        shoulder_mid_x = (left_shoulder.x + right_shoulder.x) / 2
        shoulder_mid_y = (left_shoulder.y + right_shoulder.y) / 2
        hip_mid_x = (left_hip.x + right_hip.x) / 2
        hip_mid_y = (left_hip.y + right_hip.y) / 2
        
        # 垂直からの角度を計算（90度が完全垂直）
        spine_angle = abs(math.atan2(hip_mid_x - shoulder_mid_x, shoulder_mid_y - hip_mid_y) * 180 / math.pi)
        spine_verticality = abs(90 - spine_angle)
        spine_score = int(100 - (spine_verticality * 2.5))  # 2.5は感度係数
        spine_score = max(0, min(100, spine_score))
        
        # 5. 膝の伸展（膝が曲がっていないか）
        left_leg_angle = math.atan2(left_knee.y - left_hip.y, left_knee.x - left_hip.x) - \
                        math.atan2(left_ankle.y - left_knee.y, left_ankle.x - left_knee.x)
        left_leg_angle = abs(left_leg_angle * 180 / math.pi)
        
        right_leg_angle = math.atan2(right_knee.y - right_hip.y, right_knee.x - right_hip.x) - \
                          math.atan2(right_ankle.y - right_knee.y, right_ankle.x - right_knee.x)
        right_leg_angle = abs(right_leg_angle * 180 / math.pi)
        
        leg_straightness = (180 - max(left_leg_angle, right_leg_angle)) / 180
        leg_score = int(leg_straightness * 100)
        leg_score = max(0, min(100, leg_score))
        
        # 総合スコア計算
        total_score = int((shoulder_score + hip_score + spine_score + leg_score) / 4)
        
        # 姿勢判定
        posture_status = ""
        if total_score >= 90:
            posture_status = "優れた姿勢 👍"
            posture_color = "green"
        elif total_score >= 75:
            posture_status = "良好な姿勢 👌"
            posture_color = "lightgreen"
        elif total_score >= 60:
            posture_status = "やや改善が必要 ⚠️"
            posture_color = "orange"
        else:
            posture_status = "改善が必要 ⚠️"
            posture_color = "red"
        
        # 結果表示
        st.markdown(f"### 総合評価: <span style='color:{posture_color};'>{posture_status}</span>", unsafe_allow_html=True)
        
        # スコア表示
        col1, col2, col3, col4 = st.columns(4)
        col1.metric("肩の水平度", f"{shoulder_score}/100")
        col2.metric("腰の水平度", f"{hip_score}/100")
        col3.metric("背骨の垂直性", f"{spine_score}/100")
        col4.metric("膝の伸展", f"{leg_score}/100")
        
        st.metric("総合スコア", f"{total_score}/100")
        
        # 具体的なアドバイス
        st.subheader("姿勢のアドバイス")
        
        advice = []
        if shoulder_score < 85:
            advice.append("📌 **肩の水平**: 両肩の高さを揃えるよう意識しましょう。")
        
        if hip_score < 85:
            advice.append("📌 **腰の水平**: 腰が傾いています。両足に均等に体重をかけましょう。")
        
        if spine_score < 85:
            advice.append("📌 **背骨の垂直性**: 背筋をまっすぐ伸ばしましょう。")
        
        if leg_score < 85:
            advice.append("📌 **膝の伸展**: 膝がやや曲がっています。まっすぐ立つよう意識しましょう。")
        
        if head_forward:
            advice.append("📌 **頭の位置**: 頭が前に出ています。耳と肩が一直線になるようにしましょう。")
        
        if not advice:
            st.success("素晴らしい姿勢です！このまま維持しましょう。")
        else:
            for adv in advice:
                st.markdown(adv)
        
        # 姿勢の詳細データ
        with st.expander("姿勢の詳細データ"):
            st.write(f"肩の傾き: {shoulder_diff:.4f}")
            st.write(f"腰の傾き: {hip_diff:.4f}")
            st.write(f"背骨の角度: {spine_angle:.1f}°")
            st.write(f"頭の前傾: {'あり' if head_forward else 'なし'}")
            st.write(f"左脚の角度: {left_leg_angle:.1f}°")
            st.write(f"右脚の角度: {right_leg_angle:.1f}°")
    
    # ランドマーク情報を表示（オプション）
    if landmarks:
        with st.expander("検出されたランドマーク情報"):
            for i, landmark in enumerate(landmarks.landmark):
                st.write(f"ランドマーク {i}: x={landmark.x:.4f}, y={landmark.y:.4f}, z={landmark.z:.4f}, 可視性={landmark.visibility:.4f}")
    
    # 画像ダウンロードボタン
    result_pil = Image.fromarray(result_image)
    buf = io.BytesIO()
    result_pil.save(buf, format="PNG")
    byte_im = buf.getvalue()
    
    st.download_button(
        label="結果画像をダウンロード",
        data=byte_im,
        file_name="pose_estimation_result.png",
        mime="image/png",
    )
else:
    # サンプル画像を表示
    st.info("👆 画像をアップロードして人物のポーズを推定してみましょう！")

# フッター
st.markdown("---")
st.markdown("**ポーズ推定デモアプリ** - MediaPipeとStreamlitで構築")