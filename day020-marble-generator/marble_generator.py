import numpy as np
import matplotlib.pyplot as plt
from scipy.ndimage import gaussian_filter
from PIL import Image, ImageEnhance, ImageFilter
import os
import json
from tqdm import tqdm

def create_enhanced_marble(width=800, height=600, iterations=100, speed=0.8, 
                         diffusion_rate=0.12, viscosity=0.35, seed=None,
                         colors=None, vortex_count=None, vortex_strength=None):
    """
    改良版マーブル模様生成関数
    様々なパラメータでマーブルテクスチャを生成
    """
    if seed is not None:
        np.random.seed(seed)
    
    # デフォルトの色パレット
    if colors is None:
        colors = [
            (255, 255, 255),      # 白
            (240, 248, 255),      # アリスブルー
            (230, 240, 250),      # とても薄い青
            (220, 235, 245),      # 薄い青みがかった白
            (200, 230, 240),      # 薄い水色
            (176, 220, 230),      # パウダーブルー
            (173, 216, 230),      # ライトブルー
            (135, 206, 235),      # スカイブルー
            (135, 206, 250),      # ライトスカイブルー
            (176, 196, 222),      # ライトスティールブルー
            (100, 149, 237),      # コーンフラワーブルー
            (70, 130, 180),       # スティールブルー
            (123, 167, 165),      # 薄い青緑
            (95, 158, 160),       # カデットブルー
            (115, 168, 170),      # 薄い青緑2
            (170, 200, 190),      # 薄い緑がかった青
        ]
    
    # 速度場の初期化
    velocity_x = np.zeros((height, width))
    velocity_y = np.zeros((height, width))
    
    # 色素フィールドの初期化
    dye_fields = []
    for _ in range(len(colors)):
        dye_field = np.zeros((height, width))
        
        # ランダムな位置に色素の滴を配置
        num_drops = np.random.randint(30, 70)
        for _ in range(num_drops):
            x = np.random.randint(0, width)
            y = np.random.randint(0, height)
            radius = np.random.randint(3, 50)
            strength = np.random.random() * 0.9 + 0.1
            
            # 画像の範囲内に制限
            y_min, y_max = max(0, y-radius), min(height, y+radius+1)
            x_min, x_max = max(0, x-radius), min(width, x+radius+1)
            
            # この領域サイズに合わせたマスクを作成
            mask_height = y_max - y_min
            mask_width = x_max - x_min
            
            # マスクを作成
            y_indices, x_indices = np.ogrid[:mask_height, :mask_width]
            center_y = radius if y - radius >= 0 else y
            center_x = radius if x - radius >= 0 else x
            
            # 領域サイズに合わせたマスクを作成（円形または楕円形）
            if np.random.random() > 0.5:
                # 円形
                mask = ((y_indices - center_y)**2 + (x_indices - center_x)**2) <= radius**2
            else:
                # 楕円形 - より自然な形状
                a = radius * (0.6 + np.random.random() * 0.8)
                b = radius * (0.6 + np.random.random() * 0.8)
                angle = np.random.random() * np.pi
                cosa = np.cos(angle)
                sina = np.sin(angle)
                
                y_rot = (y_indices - center_y) * cosa - (x_indices - center_x) * sina
                x_rot = (y_indices - center_y) * sina + (x_indices - center_x) * cosa
                
                mask = ((y_rot/a)**2 + (x_rot/b)**2) <= 1
            
            # 滴の濃度を中心から外側に向かって徐々に減少させる
            if np.random.random() > 0.3:
                y_dist = np.abs(y_indices - center_y)
                x_dist = np.abs(x_indices - center_x)
                dist = np.sqrt((y_dist**2 + x_dist**2))
                fade = 1 - (dist / radius) ** 2
                fade[~mask] = 0
                dye_field[y_min:y_max, x_min:x_max] += fade * strength
            else:
                dye_field[y_min:y_max, x_min:x_max][mask] = strength
        
        dye_fields.append(dye_field)
    
    # 力場の追加（3層の周波数）
    force_field_x = np.zeros((height, width))
    force_field_y = np.zeros((height, width))
    
    # 大きなスケールの動き
    large_scale_x = gaussian_filter(np.random.random((height, width)) * 2 - 1, sigma=30.0) * speed * 0.5
    large_scale_y = gaussian_filter(np.random.random((height, width)) * 2 - 1, sigma=30.0) * speed * 0.5
    
    # 中程度のスケールの動き
    medium_scale_x = gaussian_filter(np.random.random((height, width)) * 2 - 1, sigma=15.0) * speed * 0.3
    medium_scale_y = gaussian_filter(np.random.random((height, width)) * 2 - 1, sigma=15.0) * speed * 0.3
    
    # 小さなスケールの動き
    small_scale_x = gaussian_filter(np.random.random((height, width)) * 2 - 1, sigma=5.0) * speed * 0.2
    small_scale_y = gaussian_filter(np.random.random((height, width)) * 2 - 1, sigma=5.0) * speed * 0.2
    
    # 力場を合成
    force_field_x = large_scale_x + medium_scale_x + small_scale_x
    force_field_y = large_scale_y + medium_scale_y + small_scale_y
    
    # 渦の数をカスタマイズ可能に
    if vortex_count is None:
        vortex_count = np.random.randint(15, 25)
    
    # 渦の追加
    for _ in range(vortex_count):
        cx = np.random.randint(width//8, width*7//8)
        cy = np.random.randint(height//8, height*7//8)
        
        # より多様な半径の渦
        if np.random.random() > 0.6:
            radius = np.random.randint(100, 200)
            strength = (np.random.random() * 2.0 - 1.0) * speed * 1.5
        elif np.random.random() > 0.5:
            radius = np.random.randint(50, 100)
            strength = (np.random.random() * 2.0 - 1.0) * speed * 2
        else:
            radius = np.random.randint(20, 50)
            strength = (np.random.random() * 2.0 - 1.0) * speed * 3
        
        # 渦の強さをカスタマイズ可能に
        if vortex_strength is not None:
            strength *= vortex_strength
        
        y_indices, x_indices = np.ogrid[:height, :width]
        r = np.sqrt((x_indices - cx)**2 + (y_indices - cy)**2)
        theta = np.arctan2(y_indices - cy, x_indices - cx)
        
        mask = r < radius
        
        # 渦の形状をバリエーション
        if np.random.random() > 0.5:
            decay = (1.0 - r[mask] / radius) ** 2
        else:
            decay = (1.0 - r[mask] / radius) ** 3
        
        # 渦の効果を速度場に追加
        vx = -np.sin(theta[mask]) * decay * strength
        vy = np.cos(theta[mask]) * decay * strength
        
        force_field_x[mask] += vx
        force_field_y[mask] += vy
    
    # メインのシミュレーションループ
    for i in range(iterations):
        # 速度場を更新（徐々に減衰させる）
        decay_factor = 0.95 if i > iterations // 2 else 0.98
        velocity_x = velocity_x * decay_factor + force_field_x
        velocity_y = velocity_y * decay_factor + force_field_y
        
        # 拡散（速度場をスムージング）
        velocity_x = gaussian_filter(velocity_x, sigma=viscosity)
        velocity_y = gaussian_filter(velocity_y, sigma=viscosity)
        
        # 色素の移流と拡散
        for j in range(len(dye_fields)):
            # 移流（速度場に従って色素を移動）
            y_indices, x_indices = np.meshgrid(np.arange(height), np.arange(width), indexing='ij')
            
            # 新しい位置を計算
            new_x = x_indices + velocity_x
            new_y = y_indices + velocity_y
            
            # 境界条件（画像の範囲内に制限）
            new_x = np.clip(new_x, 0, width - 1)
            new_y = np.clip(new_y, 0, height - 1)
            
            # 整数部分と小数部分に分離
            new_x_int = new_x.astype(int)
            new_y_int = new_y.astype(int)
            
            # バイリニア補間用の重み計算
            new_x_frac = new_x - new_x_int
            new_y_frac = new_y - new_y_int
            
            # 補間に使う隣接ピクセルの座標（境界を考慮）
            new_x_int_plus1 = np.minimum(new_x_int + 1, width - 1)
            new_y_int_plus1 = np.minimum(new_y_int + 1, height - 1)
            
            # 新しい色素場の計算（バイリニア補間）
            dye_field_new = np.zeros_like(dye_fields[j])
            
            # 4つの隣接点からの寄与を計算
            dye_field_new += (1 - new_x_frac) * (1 - new_y_frac) * dye_fields[j][new_y_int, new_x_int]
            dye_field_new += new_x_frac * (1 - new_y_frac) * dye_fields[j][new_y_int, new_x_int_plus1]
            dye_field_new += (1 - new_x_frac) * new_y_frac * dye_fields[j][new_y_int_plus1, new_x_int]
            dye_field_new += new_x_frac * new_y_frac * dye_fields[j][new_y_int_plus1, new_x_int_plus1]
            
            # 拡散（色素をスムージング）
            diffusion = diffusion_rate
            # シミュレーション後半で拡散率を変える
            if i > iterations * 0.7:
                diffusion *= 0.8  # 後半は拡散を抑える
            
            dye_field_new = gaussian_filter(dye_field_new, sigma=diffusion)
            
            # 更新
            dye_fields[j] = dye_field_new
    
    # 色素場の合成方法を改善
    image = np.ones((height, width, 3), dtype=np.float32) * 255
    
    # すべての色素場の合計を計算
    total_dye = np.zeros((height, width))
    for dye_field in dye_fields:
        total_dye += dye_field
    
    # 各色素を合成（よりスムーズな混合）
    for i, dye_field in enumerate(dye_fields):
        weight = np.clip(dye_field, 0, 1) 
        color = np.array(colors[i], dtype=np.float32)
        
        for c in range(3):
            image[:, :, c] -= weight * (255 - color[c])
    
    # 値を0-255に収める
    image = np.clip(image, 0, 255).astype(np.uint8)
    
    # PILイメージに変換
    pil_image = Image.fromarray(image)
    
    # マーブル効果を強調
    enhancer = ImageEnhance.Contrast(pil_image)
    pil_image = enhancer.enhance(1.1)
    
    enhancer = ImageEnhance.Brightness(pil_image)
    pil_image = enhancer.enhance(1.05)
    
    # 微細なテクスチャを追加
    texture = np.random.random((height, width)) * 10 - 5
    texture = gaussian_filter(texture, sigma=0.5)
    texture_image = Image.fromarray(np.uint8(np.clip(texture + 128, 0, 255)))
    
    # テクスチャを乗算モードで適用
    texture_image = texture_image.convert('L')
    pil_image = Image.composite(
        pil_image, 
        Image.new('RGB', pil_image.size, (255, 255, 255)),
        ImageEnhance.Contrast(texture_image).enhance(0.1)
    )
    
    # 最終的な微調整
    pil_image = pil_image.filter(ImageFilter.SMOOTH_MORE)
    
    return pil_image

# カラーパレットの定義
COLOR_PALETTES = {
    "blue_white": [
        (255, 255, 255),      # 白
        (245, 250, 255),      # 非常に薄い青
        (235, 245, 255),      # 薄い青
        (225, 240, 255),      # 薄めの青
        (200, 230, 250),      # 水色
        (160, 200, 250),      # 明るい青
        (120, 180, 240),      # やや濃い青
        (70, 130, 230),       # 濃い青
    ],
    "blue_green": [
        (255, 255, 255),      # 白
        (240, 248, 255),      # アリスブルー
        (230, 240, 250),      # とても薄い青
        (220, 235, 245),      # 薄い青みがかった白
        (200, 230, 240),      # 薄い水色
        (176, 220, 230),      # パウダーブルー
        (173, 216, 230),      # ライトブルー
        (123, 167, 165),      # 薄い青緑
        (95, 158, 160),       # カデットブルー
        (115, 168, 170),      # 薄い青緑2
        (170, 200, 190),      # 薄い緑がかった青
    ],
    "purple_blue": [
        (255, 255, 255),      # 白
        (245, 245, 255),      # 非常に薄い紫
        (230, 230, 250),      # ラベンダー
        (220, 208, 255),      # 薄い紫
        (202, 177, 255),      # 薄い青紫
        (169, 143, 255),      # 青紫
        (138, 118, 211),      # 中程度の紫
        (106, 90, 205),      # スレートブルー
        (65, 105, 225),      # ロイヤルブルー
    ],
    "teal_cyan": [
        (255, 255, 255),      # 白
        (240, 255, 255),      # 非常に薄いシアン
        (224, 255, 255),      # 薄いシアン
        (175, 238, 238),      # パウダーブルー
        (127, 255, 212),      # アクアマリン
        (64, 224, 208),       # ターコイズ
        (0, 206, 209),        # ダークターコイズ
        (0, 139, 139),        # ダークシアン
        (0, 128, 128),        # ティール
    ],
    "pink_purple": [
        (255, 255, 255),      # 白
        (255, 240, 245),      # ラベンダーブラッシュ
        (255, 228, 225),      # ミスティローズ
        (255, 192, 203),      # ピンク
        (255, 182, 193),      # ライトピンク
        (255, 105, 180),      # ホットピンク
        (219, 112, 147),      # パレオビオレットレッド
        (186, 85, 211),       # ミディアムオーキッド
        (148, 0, 211),        # ダークバイオレット
    ],
    "green_yellow": [
        (255, 255, 255),      # 白
        (240, 255, 240),      # ハニーデュー
        (224, 255, 224),      # 非常に薄い緑
        (144, 238, 144),      # ライトグリーン
        (152, 251, 152),      # パレグリーン
        (124, 252, 0),        # ローングリーン
        (173, 255, 47),       # グリーンイエロー
        (154, 205, 50),       # イエローグリーン
        (85, 107, 47),        # ダークオリーブグリーン
    ],
    "red_orange": [
        (255, 255, 255),      # 白
        (255, 245, 238),      # シーシェル
        (255, 228, 196),      # ビスク
        (255, 218, 185),      # ピーチパフ
        (255, 160, 122),      # ライトサーモン
        (255, 127, 80),       # コーラル
        (255, 99, 71),        # トマト
        (255, 69, 0),         # オレンジレッド
        (220, 20, 60),        # クリムゾン
    ],
    "earth_tones": [
        (255, 255, 255),      # 白
        (255, 248, 220),      # コーンシルク
        (245, 222, 179),      # ウィート
        (210, 180, 140),      # タン
        (188, 143, 143),      # ロージータウプ
        (160, 120, 90),       # 薄茶色
        (139, 69, 19),        # サドルブラウン
        (101, 67, 33),        # ブラウン
        (85, 107, 47),        # ダークオリーブグリーン
    ],
}

# マーブルパターンの生成設定
MARBLE_VARIANTS = {
    "standard": {
        "iterations": 100,
        "speed": 0.8,
        "diffusion_rate": 0.12,
        "viscosity": 0.35,
        "vortex_count": 20,
        "vortex_strength": 1.0,
    },
    "swirly": {
        "iterations": 120,
        "speed": 1.0,
        "diffusion_rate": 0.1,
        "viscosity": 0.3,
        "vortex_count": 30,
        "vortex_strength": 1.5,
    },
    "smooth": {
        "iterations": 150,
        "speed": 0.6,
        "diffusion_rate": 0.15,
        "viscosity": 0.45,
        "vortex_count": 15,
        "vortex_strength": 0.8,
    },
    "wavy": {
        "iterations": 80,
        "speed": 0.9,
        "diffusion_rate": 0.08,
        "viscosity": 0.25,
        "vortex_count": 25,
        "vortex_strength": 1.2,
    },
    "subtle": {
        "iterations": 100,
        "speed": 0.5,
        "diffusion_rate": 0.2,
        "viscosity": 0.5,
        "vortex_count": 10,
        "vortex_strength": 0.6,
    },
}

def generate_marble_variants(output_dir="marbles", width=800, height=600, thumbnails=True):
    """
    様々なカテゴリとバリエーションのマーブル模様を生成し、
    指定したディレクトリに保存する
    """
    # 出力ディレクトリの作成
    os.makedirs(output_dir, exist_ok=True)
    
    # メタデータを格納する辞書
    metadata = {
        "palettes": {},
        "variants": {},
        "marbles": []
    }
    
    # 各パレットの情報をメタデータに追加
    for palette_name, colors in COLOR_PALETTES.items():
        metadata["palettes"][palette_name] = {
            "name": palette_name.replace("_", " ").title(),
            "description": f"{palette_name.replace('_', ' ').title()} color scheme for marble patterns",
            "primary_color": "#{:02x}{:02x}{:02x}".format(*colors[min(6, len(colors)-1)])
        }
    
    # 各バリエーションの情報をメタデータに追加
    for variant_name, params in MARBLE_VARIANTS.items():
        metadata["variants"][variant_name] = {
            "name": variant_name.replace("_", " ").title(),
            "description": f"{variant_name.replace('_', ' ').title()} style marble pattern",
            "params": params
        }
    
    # 各パレットとバリエーションの組み合わせに対して、異なるシードでいくつかの画像を生成
    marble_count = 0
    
    # 進捗表示用
    total_combinations = len(COLOR_PALETTES) * len(MARBLE_VARIANTS) * 5  # 各組み合わせで5つの画像
    
    with tqdm(total=total_combinations, desc="Generating marbles") as pbar:
        for palette_name, colors in COLOR_PALETTES.items():
            # パレット用のディレクトリを作成
            palette_dir = os.path.join(output_dir, palette_name)
            os.makedirs(palette_dir, exist_ok=True)
            
            for variant_name, params in MARBLE_VARIANTS.items():
                # バリエーション用のディレクトリを作成
                variant_dir = os.path.join(palette_dir, variant_name)
                os.makedirs(variant_dir, exist_ok=True)
                
                # 各組み合わせでいくつかの異なるシードで生成
                for i in range(5):  # 各パレット・バリエーションで5つのパターン
                    seed = hash(f"{palette_name}_{variant_name}_{i}") % 10000
                    
                    # マーブル画像を生成
                    marble = create_enhanced_marble(
                        width=width,
                        height=height,
                        seed=seed,
                        colors=colors,
                        **params
                    )
                    
                    # ファイル名の生成
                    filename = f"marble_{palette_name}_{variant_name}_{i}.png"
                    filepath = os.path.join(variant_dir, filename)
                    
                    # 画像を保存
                    marble.save(filepath)
                    
                    # サムネイルを生成（オプション）
                    if thumbnails:
                        thumb_size = (width // 4, height // 4)
                        thumbnail = marble.copy()
                        thumbnail.thumbnail(thumb_size)
                        thumb_filepath = os.path.join(variant_dir, f"thumb_{filename}")
                        thumbnail.save(thumb_filepath)
                    
                    # メタデータにこの画像の情報を追加
                    marble_info = {
                        "id": marble_count,
                        "filename": filename,
                        "palette": palette_name,
                        "variant": variant_name,
                        "seed": seed,
                        "path": f"{palette_name}/{variant_name}/{filename}",
                        "thumbnail": f"{palette_name}/{variant_name}/thumb_{filename}" if thumbnails else None
                    }
                    metadata["marbles"].append(marble_info)
                    marble_count += 1
                    
                    pbar.update(1)
    
    # メタデータをJSONファイルとして保存
    with open(os.path.join(output_dir, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)
    
    print(f"生成完了! 合計 {marble_count} 個のマーブル模様が {output_dir} に保存されました")
    return metadata

if __name__ == "__main__":
    # 高品質なマーブル模様のバリエーションを生成
    generate_marble_variants(output_dir="marbles", width=800, height=600, thumbnails=True)