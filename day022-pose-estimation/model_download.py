# model_download.py
import mediapipe as mp
import os

# モデルを一度ロードしてダウンロードを発生させる
mp_pose = mp.solutions.pose
with mp_pose.Pose(
    static_image_mode=True,
    model_complexity=0,  # 軽量モデルを使用
    enable_segmentation=True,
    min_detection_confidence=0.5
) as pose:
    pass

# モデルファイルのパスを出力
mediapipe_path = os.path.dirname(mp.__file__)
model_path = os.path.join(mediapipe_path, 'modules', 'pose_landmark')
print(f"モデルパス: {model_path}")
print("このディレクトリから.tfliteファイルをコピーしてください")