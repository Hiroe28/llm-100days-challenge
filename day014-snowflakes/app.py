import os
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageChops, ImageEnhance
import math
import random
import colorsys

# 出力ディレクトリの設定
OUTPUT_DIR = "snowflakes"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 結晶のタイプと対応する気温・湿度の範囲を定義
CRYSTAL_TYPES = {
    'NEEDLE_THIN': {
        'name': '細針状',
        'temp_range': [-5, -3],
        'humidity_range': [70, 85],
        'description': '気温がやや高く湿度が適度な環境で形成される針のような細長い結晶です。'
    },
    'NEEDLE_THICK': {
        'name': '太針状',
        'temp_range': [-7, -5],
        'humidity_range': [85, 100],
        'description': '湿度が高く気温が適度な環境で形成される、太くて短い針状の結晶です。'
    },
    'COLUMN_SIMPLE': {
        'name': '単柱状',
        'temp_range': [-10, -8],
        'humidity_range': [0, 40],
        'description': '低湿度で適度に低い気温で形成される、シンプルな柱状の結晶です。'
    },
    'COLUMN_CAPPED': {
        'name': '冠柱状',
        'temp_range': [-8, -6],
        'humidity_range': [40, 70],
        'description': '柱の先端に小さな冠のような形が付いた結晶。中程度の湿度で形成されます。'
    },
    'PLATE_SIMPLE': {
        'name': '単板状',
        'temp_range': [-15, -12],
        'humidity_range': [0, 40],
        'description': '低い湿度でかなり低温の環境で形成される、シンプルな六角形の板状結晶です。'
    },
    'PLATE_SECTOR': {
        'name': '扇板状',
        'temp_range': [-12, -9],
        'humidity_range': [40, 70],
        'description': '扇形の模様が特徴的な六角形の板状結晶。中程度の湿度で形成されます。'
    },
    'STELLAR_SIMPLE': {
        'name': '単星状',
        'temp_range': [-15, -12],
        'humidity_range': [70, 85],
        'description': 'シンプルな星型の結晶。高湿度で低温の環境で形成されます。'
    },
    'STELLAR_DENDRITE': {
        'name': '星樹枝状',
        'temp_range': [-12, -9],
        'humidity_range': [85, 100],
        'description': '星型から樹枝状に枝が伸びた美しい結晶。高湿度で形成されます。'
    },
    'DENDRITE_NORMAL': {
        'name': '通常樹枝状',
        'temp_range': [-20, -17],
        'humidity_range': [70, 85],
        'description': 'クリスマスカードなどでよく見る典型的な樹枝状結晶。非常に低温で形成されます。'
    },
    'DENDRITE_COMPLEX': {
        'name': '複雑樹枝状',
        'temp_range': [-17, -15],
        'humidity_range': [85, 100],
        'description': '複雑に枝分かれした美しい樹枝状結晶。とても湿度が高い環境で形成されます。'
    },
    'FERNLIKE_SIMPLE': {
        'name': '単羊歯状',
        'temp_range': [-20, -17],
        'humidity_range': [0, 40],
        'description': '羊歯のような枝を持つ結晶。非常に低温で低湿度の環境で形成されます。'
    },
    'FERNLIKE_COMPLEX': {
        'name': '複雑羊歯状',
        'temp_range': [-17, -15],
        'humidity_range': [40, 70],
        'description': '複雑な羊歯のような美しい枝を持つ結晶。中程度の湿度で形成されます。'
    },
    'TRIANGULAR': {
        'name': '三角板状',
        'temp_range': [-2, -1],
        'humidity_range': [50, 70],
        'description': '珍しい三角形の要素を持つ結晶。比較的高い気温で形成されます。'
    },
    'SPLIT': {
        'name': '分裂六花',
        'temp_range': [-19, -16],
        'humidity_range': [90, 100],
        'description': '枝の先端が分裂したような複雑な形状を持つ非常に繊細な結晶です。'
    },
    'ASYMMETRIC': {
        'name': '非対称結晶',
        'temp_range': [-4, -2],
        'humidity_range': [30, 50],
        'description': '気流の影響などで成長過程が乱れ、均一でない形に成長した結晶です。'
    },
    'TWELVE_BRANCHED': {
        'name': '十二花',
        'temp_range': [-18, -15],
        'humidity_range': [60, 80],
        'description': '二つの六花が重なったような十二本の枝を持つ珍しい結晶です。'
    }
}



def create_fractal_snowflake(size, iterations=5, branch_ratio=0.35, angle_degrees=60, random_seed=None):
    """
    フラクタルアルゴリズムを使った雪の結晶を生成
    
    Parameters:
    size: 画像サイズ
    iterations: 再帰の深さ（反復回数）
    branch_ratio: 枝の長さの比率
    angle_degrees: 枝の角度（度数法）
    random_seed: ランダムシードの値
    """
    if random_seed is not None:
        random.seed(random_seed)
        np.random.seed(random_seed)
    
    # 新しい画像を作成（大きめのサイズで作業）
    working_size = size * 2
    img = Image.new('RGBA', (working_size, working_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 中心点
    center = (working_size // 2, working_size // 2)
    
    # 各方向への枝を描画（6方向）
    for i in range(6):
        angle = i * 60  # 60度ずつ回転
        initial_length = working_size * 0.4
        
        # フラクタル枝を描画
        draw_fractal_branch(
            draw, 
            center[0], center[1], 
            angle, 
            initial_length, 
            iterations, 
            branch_ratio, 
            angle_degrees,
            (255, 255, 255, 255),  # 白色
            width=int(working_size * 0.005)  # 線の太さ
        )
    
    # 発光効果の追加
    # 少しぼかす
    img = img.filter(ImageFilter.GaussianBlur(working_size * 0.005))
    
    # 輝きを強調
    glow = img.copy()
    glow = glow.filter(ImageFilter.GaussianBlur(working_size * 0.01))
    
    # 複数回の重ね合わせでグロー効果を強化
    for _ in range(3):
        img = ImageChops.add(img, glow, scale=2.0, offset=0)
    
    # 最終的なサイズにリサイズ
    img = img.resize((size, size), Image.LANCZOS)
    
    return img

def draw_fractal_branch(draw, x, y, angle, length, depth, branch_ratio, angle_degrees, color, width=1):
    """
    再帰的に樹枝状の枝を描画
    """
    if depth <= 0 or length < 2:
        return
    
    # 角度をラジアンに変換
    angle_rad = math.radians(angle)
    
    # 枝の終点を計算
    end_x = x + length * math.cos(angle_rad)
    end_y = y + length * math.sin(angle_rad)
    
    # 枝を描画
    draw.line([(x, y), (end_x, end_y)], fill=color, width=width)
    
    # 複雑さのための変数
    next_width = max(1, int(width * 0.7))  # 枝の太さを少し細く
    branch_length = length * branch_ratio
    
    # 小枝の角度のランダム変動
    angle_variation = 5 if depth <= 2 else 10
    
    # 側枝の数（深さに応じて変える）
    num_branches = 2 if depth <= 2 else 3
    
    # 側枝の位置をずらす比率
    position_ratios = [0.3, 0.6, 0.8][:num_branches]
    
    for pos_ratio in position_ratios:
        # 小枝の位置
        branch_x = x + (end_x - x) * pos_ratio
        branch_y = y + (end_y - y) * pos_ratio
        
        # 左側の小枝
        left_angle = angle - angle_degrees + random.uniform(-angle_variation, angle_variation)
        draw_fractal_branch(
            draw, branch_x, branch_y, left_angle, branch_length, depth - 1, 
            branch_ratio, angle_degrees, color, next_width
        )
        
        # 右側の小枝
        right_angle = angle + angle_degrees + random.uniform(-angle_variation, angle_variation)
        draw_fractal_branch(
            draw, branch_x, branch_y, right_angle, branch_length, depth - 1, 
            branch_ratio, angle_degrees, color, next_width
        )
        
        # 複雑な結晶の場合、さらに小枝を追加
        if depth >= 4 and random.random() < 0.5:
            extra_angle = angle + random.choice([-1, 1]) * (angle_degrees * 0.5) + random.uniform(-angle_variation, angle_variation)
            draw_fractal_branch(
                draw, branch_x, branch_y, extra_angle, branch_length * 0.7, depth - 2, 
                branch_ratio, angle_degrees, color, next_width
            )

def create_dendrite_complex(size, variation):
    """改良版の複雑樹枝状結晶生成関数"""
    # バリエーションに基づいてパラメータを調整
    temp_factor = variation['temp_factor']
    humidity_factor = variation['humidity_factor']
    complexity = variation['complexity']
    
    # パラメータ計算
    iterations = 5  # 複雑な結晶には高い値
    branch_ratio = 0.4 - (complexity * 0.1)  # 複雑さに応じて枝の比率を調整
    angle_degrees = 40 + (temp_factor * 10)  # 温度によって角度変化
    
    # ランダム性を温度と湿度に基づいて決定
    random_seed = int((temp_factor * 1000) + (humidity_factor * 100))
    
    # 結晶を生成
    snowflake = create_fractal_snowflake(
        size,
        iterations=iterations,
        branch_ratio=branch_ratio,
        angle_degrees=angle_degrees,
        random_seed=random_seed
    )
    
    # 必要に応じて色味を調整（青みがかった白に）
    blue_shift = int(variation['blue_shift'])
    if blue_shift > 0:
        # 青みがかった白色のオーバーレイを作成
        overlay = Image.new('RGBA', snowflake.size, (255 - blue_shift, 255 - blue_shift, 255, 100))
        snowflake = Image.alpha_composite(
            snowflake.convert('RGBA'), 
            Image.new('RGBA', snowflake.size, (0, 0, 0, 0))
        )
        snowflake = Image.alpha_composite(snowflake, overlay)
    
    # 詳細を追加
    snowflake = add_more_details(snowflake)
    
    # ここに追加：背景ノイズの除去
    snowflake = clean_background(snowflake)

    return snowflake

def add_more_details(img, detail_level=3):
    """結晶にさらなる細部を追加する関数"""
    # 元の画像のコピーを作成
    enhanced = img.copy()
    
    # エッジを強調
    edges = img.filter(ImageFilter.FIND_EDGES)
    edges = ImageEnhance.Brightness(edges).enhance(1.5)
    
    # 元の画像とエッジを合成
    result = Image.alpha_composite(
        img.convert('RGBA'), 
        edges.convert('RGBA')
    )
    
    # 細部のディテールを追加
    for _ in range(detail_level):
        # 小さな点を追加
        detail_layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(detail_layer)
        
        # 元の画像の白い部分に小さな点を追加
        for x in range(0, img.width, 4):
            for y in range(0, img.height, 4):
                pixel = img.getpixel((x, y))
                if isinstance(pixel, tuple) and len(pixel) >= 3:
                    brightness = sum(pixel[:3]) / 3
                    if brightness > 200 and random.random() < 0.1:
                        size = random.randint(1, 2)
                        draw.rectangle(
                            [(x-size, y-size), (x+size, y+size)],
                            fill=(255, 255, 255, 180)
                        )
        
        # 詳細レイヤーをぼかす
        detail_layer = detail_layer.filter(ImageFilter.GaussianBlur(0.5))
        
        # 元の画像と詳細レイヤーを合成
        result = Image.alpha_composite(result, detail_layer)
    
    return result

# 温度と湿度の組み合わせで結晶タイプを決定する関数
def get_crystal_type(temp, humidity):
    for crystal_type, info in CRYSTAL_TYPES.items():
        t_min, t_max = info['temp_range']
        h_min, h_max = info['humidity_range']
        
        if t_min <= temp <= t_max and h_min <= humidity <= h_max:
            return crystal_type
    
    # 該当する範囲がない場合は最も近いタイプを返す
    closest_type = None
    min_distance = float('inf')
    
    for crystal_type, info in CRYSTAL_TYPES.items():
        t_min, t_max = info['temp_range']
        h_min, h_max = info['humidity_range']
        
        # 中心点を計算
        center_temp = (t_min + t_max) / 2
        center_humidity = (h_min + h_max) / 2
        
        # 距離を計算（温度と湿度のスケールの違いを考慮）
        temp_diff = (temp - center_temp) / 20  # 温度範囲は約20度
        humidity_diff = (humidity - center_humidity) / 100  # 湿度範囲は100%
        distance = math.sqrt(temp_diff**2 + humidity_diff**2)
        
        if distance < min_distance:
            min_distance = distance
            closest_type = crystal_type
    
    return closest_type

def calculate_variation(temp, humidity):
    """温度と湿度に基づいたバリエーション値を計算"""
    return {
        'temp_factor': (temp + 20) / 20,
        'humidity_factor': humidity / 100,
        'complexity': (1 - ((temp + 20) / 20)) * 0.7 + (humidity / 100) * 0.3,
        'branch_length': 0.7 + (1 - ((temp + 20) / 20)) * 0.5,
        'thickness': 0.8 + (humidity / 100) * 0.4,
        'blue_shift': ((temp + 20) / 20) * 50,
        'glow': (1 - ((temp + 20) / 20)) * 0.3 + 0.1
    }


# 雪の結晶基本生成関数
def create_base_image(size, bg_color=(0, 0, 0, 0)):
    """透明な背景の画像を作成"""
    return Image.new('RGBA', (size, size), bg_color)

# 六角形の頂点を計算する関数
def get_hexagon_points(center_x, center_y, radius):
    """中心座標とサイズから六角形の頂点を計算"""
    points = []
    for i in range(6):
        angle = i * math.pi / 3
        x = center_x + radius * math.cos(angle)
        y = center_y + radius * math.sin(angle)
        points.append((x, y))
    return points

# 放射状の点を計算する関数（六方対称性）
def get_radial_points(center_x, center_y, radius, angle_offset=0):
    """六方対称性のある放射状の点を計算"""
    points = []
    for i in range(6):
        angle = i * math.pi / 3 + angle_offset
        x = center_x + radius * math.cos(angle)
        y = center_y + radius * math.sin(angle)
        points.append((x, y))
    return points

def add_glow_effect(img, radius=10, glow_color=(200, 220, 255, 100)):
    """画像にグロー効果を追加する"""
    # 元画像をコピー
    result = img.copy()
    
    # グロー用に画像をぼかす
    glow = img.filter(ImageFilter.GaussianBlur(radius))
    
    # ぼかした画像と元画像を合成
    result = Image.alpha_composite(glow, result)
    
    return result


def clean_background(img, threshold=50):
    """背景のノイズを除去する関数"""
    img_array = np.array(img)
    # RGBAの合計値が閾値以下のピクセルを透明にする
    mask = np.sum(img_array[:,:,:3], axis=2) < threshold
    img_array[mask, 3] = 0  # アルファチャンネルを0に
    return Image.fromarray(img_array)

# ========== 結晶描画関数 ==========


def create_complex_dendrite(size, variation):
    """複雑樹枝状結晶を生成する関数"""
    # バリエーションに基づいてパラメータを調整
    branch_depth = 3 + int(variation['complexity'] * 2)  # 3〜5
    branch_length_ratio = 0.3 + (variation['branch_length'] * 0.2)  # 0.3〜0.5
    thickness = 2 + int(variation['thickness'] * 3)  # 2〜5
    branch_angle = 25 + int(variation['temp_factor'] * 15)  # 25〜40
    
    # 色合いを調整（青みがかった白）
    blue_shift = int(min(40, variation['blue_shift']))
    color = (255, 255 - blue_shift, 255, 255)
    
    # 基本的な結晶を生成
    img = create_simple_dendrite(
        size,
        branch_depth=branch_depth,
        branch_length_ratio=branch_length_ratio,
        thickness=thickness,
        branch_angle=branch_angle,
        color=color
    )
    
    # グロー効果を追加
    glow_radius = 5 + int(variation['glow'] * 10)  # 5〜15
    img = add_glow_effect(img, radius=glow_radius)
    
    return img

def draw_needle_crystal(size, variation, is_thick=False):
    """針状の結晶を描画"""
    img = create_base_image(size)
    draw = ImageDraw.Draw(img)
    
    center_x, center_y = size // 2, size // 2
    
    # バリエーションに基づいて針の太さと長さを調整
    line_width = max(1, size // 30) * (2 if is_thick else 1) * variation['thickness']
    length = size * 0.45 * variation['branch_length']
    
    # 結晶の色（白〜青みがかった白）
    blue_shift = int(variation['blue_shift'])
    crystal_color = (255, 255 - blue_shift, 255)
    
    # 6方向に線を描画
    for i in range(6):
        angle = i * math.pi / 3
        end_x = center_x + length * math.cos(angle)
        end_y = center_y + length * math.sin(angle)
        
        # 線を描画
        draw.line([(center_x, center_y), (end_x, end_y)], fill=crystal_color + (255,), width=int(line_width))
        
        # 太針状の場合は横線も追加
        if is_thick and (i % 2 == 0):
            cross_pos = 0.7  # 中心からの距離（相対値）
            cross_width = size * 0.05
            
            cross_x = center_x + length * cross_pos * math.cos(angle)
            cross_y = center_y + length * cross_pos * math.sin(angle)
            
            perp_angle = angle + math.pi / 2
            cross_start_x = cross_x + cross_width * math.cos(perp_angle)
            cross_start_y = cross_y + cross_width * math.sin(perp_angle)
            cross_end_x = cross_x - cross_width * math.cos(perp_angle)
            cross_end_y = cross_y - cross_width * math.sin(perp_angle)
            
            draw.line([(cross_start_x, cross_start_y), (cross_end_x, cross_end_y)], 
                      fill=crystal_color + (255,), width=int(line_width))
    
    # グローエフェクト（輝き）を追加
    img = add_glow_effect(img, variation['glow'])
    return img

def draw_column_crystal(size, variation, is_capped=False):
    """柱状の結晶を描画"""
    img = create_base_image(size)
    draw = ImageDraw.Draw(img)
    
    center_x, center_y = size // 2, size // 2
    
    # バリエーションに基づいて調整
    line_width = max(2, size // 25) * variation['thickness']
    length = size * 0.4
    
    # 結晶の色（白〜青みがかった白）
    blue_shift = int(variation['blue_shift'])
    crystal_color = (255, 255 - blue_shift, 255)
    
    # 6方向に短い柱を描画
    for i in range(6):
        angle = i * math.pi / 3
        end_x = center_x + length * math.cos(angle)
        end_y = center_y + length * math.sin(angle)
        
        # 線を描画
        draw.line([(center_x, center_y), (end_x, end_y)], fill=crystal_color + (255,), width=int(line_width))
        
        # 柱の先に装飾を追加（タイプに応じて）
        if is_capped:
            # 冠状の装飾
            cap_radius = size * 0.08
            cap_x, cap_y = end_x, end_y
            draw.ellipse([(cap_x - cap_radius, cap_y - cap_radius), 
                         (cap_x + cap_radius, cap_y + cap_radius)], 
                         fill=(230, 230 - blue_shift, 255, 200))
            
            # 内側の円
            inner_radius = cap_radius * 0.7
            draw.ellipse([(cap_x - inner_radius, cap_y - inner_radius), 
                         (cap_x + inner_radius, cap_y + inner_radius)], 
                         fill=(255, 255 - blue_shift, 255, 230))
        else:
            # 通常の横線
            cross_size = size * 0.05 * variation['thickness']
            cross_angle = angle + math.pi / 2
            
            # 交差位置（柱の中間あたり）
            cross_pos_x = center_x + length * 0.6 * math.cos(angle)
            cross_pos_y = center_y + length * 0.6 * math.sin(angle)
            
            cross_start_x = cross_pos_x + cross_size * math.cos(cross_angle)
            cross_start_y = cross_pos_y + cross_size * math.sin(cross_angle)
            cross_end_x = cross_pos_x - cross_size * math.cos(cross_angle)
            cross_end_y = cross_pos_y - cross_size * math.sin(cross_angle)
            
            draw.line([(cross_start_x, cross_start_y), (cross_end_x, cross_end_y)], 
                      fill=crystal_color + (255,), width=int(line_width))
    
    # グローエフェクト（輝き）を追加
    img = add_glow_effect(img, variation['glow'])
    return img

def draw_plate_crystal(size, variation, is_sector=False):
    """板状の結晶を描画"""
    img = create_base_image(size)
    draw = ImageDraw.Draw(img)
    
    center_x, center_y = size // 2, size // 2
    
    # バリエーションに基づいて調整
    hex_size = size * (0.35 if is_sector else 0.4)  # 扇板状は少し小さめのベース
    
    # 結晶の色（白〜青みがかった白）
    blue_shift = int(variation['blue_shift'])
    crystal_color = (255, 255 - blue_shift, 255)
    
    # 六角形の頂点を計算
    points = get_hexagon_points(center_x, center_y, hex_size)
    
    # 六角形を描画
    draw.polygon(points, fill=(255, 255 - blue_shift, 255, 200))
    
    # 中央の小さい六角形
    inner_points = get_hexagon_points(center_x, center_y, hex_size * 0.5)
    draw.polygon(inner_points, fill=(255, 255 - blue_shift // 2, 255, 230))
    
    # 扇板状の場合は模様を追加
    if is_sector:
        line_width = max(1, size // 40)
        line_color = (255, 255, 255, 150)
        
        # 六角形の中心から各頂点への線
        for point in points:
            draw.line([(center_x, center_y), point], fill=line_color, width=int(line_width))
        
        # 中間の装飾線
        for i in range(6):
            angle1 = i * math.pi / 3
            angle2 = ((i + 1) % 6) * math.pi / 3
            mid_angle = (angle1 + angle2) / 2
            
            mid_inner_x = center_x + hex_size * 0.3 * math.cos(mid_angle)
            mid_inner_y = center_y + hex_size * 0.3 * math.sin(mid_angle)
            
            mid_outer_x = center_x + hex_size * 0.8 * math.cos(mid_angle)
            mid_outer_y = center_y + hex_size * 0.8 * math.sin(mid_angle)
            
            draw.line([(mid_inner_x, mid_inner_y), (mid_outer_x, mid_outer_y)], 
                      fill=line_color, width=int(line_width))
    
    # グローエフェクト（輝き）を追加
    img = add_glow_effect(img, variation['glow'] * 1.2)  # 板状結晶は特に輝く
    return img

def draw_stellar_crystal(size, variation, is_complex=False):
    """星状の結晶を描画"""
    img = create_base_image(size)
    draw = ImageDraw.Draw(img)
    
    center_x, center_y = size // 2, size // 2
    
    # バリエーションに基づいて調整
    branch_length = size * 0.45 * variation['branch_length']
    line_width = max(1.5, size // 30) * variation['thickness']
    
    # 結晶の色（白〜青みがかった白）
    blue_shift = int(variation['blue_shift'])
    crystal_color = (255, 255 - blue_shift, 255, 255)
    
    # 6方向に枝を描画
    for i in range(6):
        angle = i * math.pi / 3
        end_x = center_x + branch_length * math.cos(angle)
        end_y = center_y + branch_length * math.sin(angle)
        
        # メインの枝
        draw.line([(center_x, center_y), (end_x, end_y)], fill=crystal_color, width=int(line_width))
        
        # 横の小枝（左右対称）
        branch_count = 3 if is_complex else 2
        
        for j in range(1, branch_count + 1):
            branch_pos = j * (0.2 + (j * 0.05))
            branch_length_ratio = branch_length * branch_pos
            branch_width = size * 0.15 * (1.2 if is_complex else 1)
            
            # 小枝の位置
            branch_x = center_x + branch_length_ratio * math.cos(angle)
            branch_y = center_y + branch_length_ratio * math.sin(angle)
            
            # 左側の小枝
            left_angle = angle - math.pi / 3
            left_end_x = branch_x + branch_width * math.cos(left_angle)
            left_end_y = branch_y + branch_width * math.sin(left_angle)
            
            draw.line([(branch_x, branch_y), (left_end_x, left_end_y)], 
                     fill=crystal_color, width=int(line_width * 0.8))
            
            # 右側の小枝
            right_angle = angle + math.pi / 3
            right_end_x = branch_x + branch_width * math.cos(right_angle)
            right_end_y = branch_y + branch_width * math.sin(right_angle)
            
            draw.line([(branch_x, branch_y), (right_end_x, right_end_y)], 
                     fill=crystal_color, width=int(line_width * 0.8))
            
            # 星樹枝状の場合はさらに枝分かれ
            if is_complex and j < branch_count:
                sub_branch_width = branch_width * 0.5
                
                # 左側の枝についた小枝
                left_sub_x = branch_x + branch_width * 0.5 * math.cos(left_angle)
                left_sub_y = branch_y + branch_width * 0.5 * math.sin(left_angle)
                
                left_sub_angle = left_angle - math.pi / 6
                left_sub_end_x = left_sub_x + sub_branch_width * math.cos(left_sub_angle)
                left_sub_end_y = left_sub_y + sub_branch_width * math.sin(left_sub_angle)
                
                draw.line([(left_sub_x, left_sub_y), (left_sub_end_x, left_sub_end_y)], 
                         fill=crystal_color, width=int(line_width * 0.6))
                
                # 右側の枝についた小枝
                right_sub_x = branch_x + branch_width * 0.5 * math.cos(right_angle)
                right_sub_y = branch_y + branch_width * 0.5 * math.sin(right_angle)
                
                right_sub_angle = right_angle + math.pi / 6
                right_sub_end_x = right_sub_x + sub_branch_width * math.cos(right_sub_angle)
                right_sub_end_y = right_sub_y + sub_branch_width * math.sin(right_sub_angle)
                
                draw.line([(right_sub_x, right_sub_y), (right_sub_end_x, right_sub_end_y)], 
                         fill=crystal_color, width=int(line_width * 0.6))
    
    # グローエフェクト（輝き）を追加
    img = add_glow_effect(img, variation['glow'] * 1.2)
    return img


def create_simple_dendrite(size, branch_depth=4, branch_length_ratio=0.4, 
                          thickness=3, branch_angle=30, color=(255, 255, 255, 255)):
    """
    シンプルな樹枝状結晶を生成する関数
    
    Parameters:
    size: 画像サイズ
    branch_depth: 枝分かれの深さ（再帰の回数）
    branch_length_ratio: 親の枝に対する子の枝の長さの比率
    thickness: 線の太さ
    branch_angle: 枝分かれの角度
    color: 結晶の色
    """
    # 透明な背景の画像を作成
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 中心点
    center = (size // 2, size // 2)
    
    # 線の描画スタイル設定
    line_width = thickness
    
    # 6方向に対称に描画
    for i in range(6):
        angle_rad = math.radians(i * 60)
        start_point = center
        
        # メイン枝の長さと終点
        main_length = size * 0.4
        end_x = center[0] + main_length * math.cos(angle_rad)
        end_y = center[1] + main_length * math.sin(angle_rad)
        end_point = (end_x, end_y)
        
        # メイン枝を描画
        draw.line([start_point, end_point], fill=color, width=line_width)
        
        # 再帰的に枝を追加
        draw_branch(draw, start_point, end_point, branch_depth, branch_length_ratio, 
                   thickness, branch_angle, color)
    
    return img

def draw_branch(draw, start_point, end_point, depth, length_ratio, thickness, angle, color):
    """
    再帰的に枝を描画する関数
    """
    if depth <= 0:
        return
    
    # 線の太さを少し細く
    line_width = max(1, int(thickness * 0.8))
    
    # 始点と終点の差分
    dx = end_point[0] - start_point[0]
    dy = end_point[1] - start_point[1]
    
    # 親の枝の長さと角度
    parent_length = math.sqrt(dx**2 + dy**2)
    parent_angle = math.atan2(dy, dx)
    
    # 子の枝の長さ
    branch_length = parent_length * length_ratio
    
    # 左右の子枝の角度
    left_angle = parent_angle + math.radians(angle)
    right_angle = parent_angle - math.radians(angle)
    
    # 枝の位置（親の途中から分岐）
    for position in [0.33, 0.66]:
        branch_start_x = start_point[0] + dx * position
        branch_start_y = start_point[1] + dy * position
        branch_start = (branch_start_x, branch_start_y)
        
        # 左の枝の終点
        left_end_x = branch_start_x + branch_length * math.cos(left_angle)
        left_end_y = branch_start_y + branch_length * math.sin(left_angle)
        left_end = (left_end_x, left_end_y)
        
        # 右の枝の終点
        right_end_x = branch_start_x + branch_length * math.cos(right_angle)
        right_end_y = branch_start_y + branch_length * math.sin(right_angle)
        right_end = (right_end_x, right_end_y)
        
        # 左右の枝を描画
        draw.line([branch_start, left_end], fill=color, width=line_width)
        draw.line([branch_start, right_end], fill=color, width=line_width)
        
        # 再帰的に子枝を追加
        draw_branch(draw, branch_start, left_end, depth-1, length_ratio, 
                   line_width, angle, color)
        draw_branch(draw, branch_start, right_end, depth-1, length_ratio, 
                   line_width, angle, color)
        

# 樹枝状の結晶を描画する関数の修正版
def draw_dendrite_crystal(size, variation, is_complex=False):
    """樹枝状の結晶を描画 - 改良版"""
    # 大きなキャンバスサイズを使用（特に複雑な結晶用）
    img = create_base_image(size * 2)  # キャンバスサイズを2倍に
    draw = ImageDraw.Draw(img)
    
    center_x, center_y = size, size  # 中心位置（拡大したキャンバスに合わせる）
    
    # バリエーションに基づいて調整
    complexity_factor = variation['complexity'] * (1.5 if is_complex else 1.0)  # 複雑さを強調
    length_factor = variation['branch_length'] * (1.2 if is_complex else 1.0)   # 長さを強調
    thickness_factor = variation['thickness']
    
    # 結晶の色（白〜青みがかった白）
    blue_shift = int(variation['blue_shift'])
    crystal_color = (255, 255 - blue_shift, 255, 255)
    
    # 複雑度に基づいて再帰の深さを決定（深さを増加）
    base_depth = 5 if is_complex else 4  # 深さを増加
    
    # 確実に各枝を描画
    for i in range(6):
        angle = i * math.pi / 3
        branch_length = size * 0.45 * length_factor
        end_x = center_x + branch_length * math.cos(angle)
        end_y = center_y + branch_length * math.sin(angle)
        
        # 太さを調整（特に複雑な結晶はより繊細に）
        branch_width = (size / 8) * thickness_factor * (0.8 if is_complex else 1.0)
        
        # メインの枝を直接描画（確実に描画されるように）
        draw.line([(center_x, center_y), (end_x, end_y)], 
                  fill=crystal_color, width=int(branch_width))
        
        # 樹枝状構造を描画
        try:
            draw_branch(draw, center_x, center_y, end_x, end_y, base_depth, branch_width, 
                       crystal_color, is_complex, complexity_factor)
        except Exception as e:
            print(f"枝の描画中にエラー: {e}")
            # エラーが発生しても続行（少なくともメインの枝は描画される）
    
    # グローエフェクト（輝き）を追加
    glow_intensity = variation['glow'] * (1.8 if is_complex else 1.5)  # 輝きを強調
    img = add_glow_effect(img, glow_intensity, (180, 230, 255))
    
    # リサイズして返す（元のサイズに戻す）
    img = img.resize((size, size), Image.LANCZOS)
    return img

def draw_fernlike_crystal(size, variation, is_complex=False):
    """羊歯状の結晶を描画"""
    img = create_base_image(size)
    draw = ImageDraw.Draw(img)
    
    center_x, center_y = size // 2, size // 2
    
    # バリエーションに基づいて調整
    complexity_factor = variation['complexity']
    thickness_factor = variation['thickness']
    line_width = max(1.2, size // 35) * thickness_factor
    
    # 結晶の色（白〜青みがかった白）
    blue_shift = int(variation['blue_shift'])
    crystal_color = (255, 255 - blue_shift, 255, 255)
    
    # 小枝の数を調整
    branch_count = 7 if is_complex else 5
    
    # 6方向に枝を描画
    for i in range(6):
        angle = i * math.pi / 3
        end_x = center_x + size * 0.45 * math.cos(angle)
        end_y = center_y + size * 0.45 * math.sin(angle)
        
        # メインの枝
        draw.line([(center_x, center_y), (end_x, end_y)], fill=crystal_color, width=int(line_width))
        
        # 複雑な小枝（羊歯のように）
        for j in range(1, branch_count + 1):
            branch_pos = j * (0.15 - (j * 0.005))  # 間隔を調整
            branch_length = size * 0.15 * (1 - j * 0.08) * (1 + complexity_factor * 0.2)
            
            # 小枝の位置
            branch_x = center_x + (end_x - center_x) * branch_pos
            branch_y = center_y + (end_y - center_y) * branch_pos
            
            # 垂直方向の角度計算
            perp_angle = angle + math.pi / 2
            
            # 左側の小枝
            left_end_x = branch_x + branch_length * math.cos(angle + math.pi/2)
            left_end_y = branch_y + branch_length * math.sin(angle + math.pi/2)
            
            draw.line([(branch_x, branch_y), (left_end_x, left_end_y)], 
                     fill=crystal_color, width=int(line_width * 0.8))
            
            # 左小枝のさらなる枝分かれ
            sub_branch_condition = (is_complex and j <= 4) or j <= 3
            
            if sub_branch_condition:
                sub_branch_count = 3 if is_complex else 2
                
                for k in range(1, sub_branch_count + 1):
                    sub_branch_pos = k * (0.3 - k * 0.05)
                    sbx = branch_x + (left_end_x - branch_x) * sub_branch_pos
                    sby = branch_y + (left_end_y - branch_y) * sub_branch_pos
                    
                    # 小枝の方向
                    sub_angle = angle + math.pi/2 + math.pi/6
                    sub_end_x = sbx + branch_length * 0.3 * math.cos(sub_angle)
                    sub_end_y = sby + branch_length * 0.3 * math.sin(sub_angle)
                    
                    draw.line([(sbx, sby), (sub_end_x, sub_end_y)], 
                             fill=crystal_color, width=int(line_width * 0.6))
                    
                    # 特に複雑なパターンの場合は3次枝も追加
                    if is_complex and k == 2 and j <= 2:
                        tertiary_x = sbx + (sub_end_x - sbx) * 0.5
                        tertiary_y = sby + (sub_end_y - sby) * 0.5
                        
                        tertiary_angle = sub_angle + math.pi/6
                        tertiary_end_x = tertiary_x + branch_length * 0.15 * math.cos(tertiary_angle)
                        tertiary_end_y = tertiary_y + branch_length * 0.15 * math.sin(tertiary_angle)
                        
                        draw.line([(tertiary_x, tertiary_y), (tertiary_end_x, tertiary_end_y)], 
                                 fill=crystal_color, width=int(line_width * 0.4))
            
            # 右側の小枝
            right_end_x = branch_x + branch_length * math.cos(angle - math.pi/2)
            right_end_y = branch_y + branch_length * math.sin(angle - math.pi/2)
            
            draw.line([(branch_x, branch_y), (right_end_x, right_end_y)], 
                     fill=crystal_color, width=int(line_width * 0.8))
            
            # 右小枝のさらなる枝分かれ
            if sub_branch_condition:
                sub_branch_count = 3 if is_complex else 2
                
                for k in range(1, sub_branch_count + 1):
                    sub_branch_pos = k * (0.3 - k * 0.05)
                    sbx = branch_x + (right_end_x - branch_x) * sub_branch_pos
                    sby = branch_y + (right_end_y - branch_y) * sub_branch_pos
                    
                    # 小枝の方向
                    sub_angle = angle - math.pi/2 - math.pi/6
                    sub_end_x = sbx + branch_length * 0.3 * math.cos(sub_angle)
                    sub_end_y = sby + branch_length * 0.3 * math.sin(sub_angle)
                    
                    draw.line([(sbx, sby), (sub_end_x, sub_end_y)], 
                             fill=crystal_color, width=int(line_width * 0.6))
                    
                    # 特に複雑なパターンの場合は3次枝も追加
                    if is_complex and k == 2 and j <= 2:
                        tertiary_x = sbx + (sub_end_x - sbx) * 0.5
                        tertiary_y = sby + (sub_end_y - sby) * 0.5
                        
                        tertiary_angle = sub_angle - math.pi/6
                        tertiary_end_x = tertiary_x + branch_length * 0.15 * math.cos(tertiary_angle)
                        tertiary_end_y = tertiary_y + branch_length * 0.15 * math.sin(tertiary_angle)
                        
                        draw.line([(tertiary_x, tertiary_y), (tertiary_end_x, tertiary_end_y)], 
                                 fill=crystal_color, width=int(line_width * 0.4))
    
    # グローエフェクト（輝き）を追加
    img = add_glow_effect(img, variation['glow'] * 1.2)
    return img

def draw_triangular_crystal(size, variation):
    """三角板状の結晶を描画"""
    img = create_base_image(size)
    draw = ImageDraw.Draw(img)
    
    center_x, center_y = size // 2, size // 2
    
    # バリエーションに基づいて調整
    thickness_factor = variation['thickness']
    line_width = max(1, size // 40) * thickness_factor
    
    # 結晶の色（白〜青みがかった白）
    blue_shift = int(variation['blue_shift'])
    crystal_color = (255, 255 - blue_shift, 255)
    
    # 三角形の要素を含む六角形を描画するための頂点を計算
    hexagon_points = []
    triangle_points = []
    
    for i in range(6):
        angle = i * math.pi / 3
        hex_radius = size * 0.4
        x = center_x + hex_radius * math.cos(angle)
        y = center_y + hex_radius * math.sin(angle)
        hexagon_points.append((x, y))
        
        # 三角形の追加部分（偶数インデックスの場合）
        if i % 2 == 0:
            next_angle = ((i + 1) % 6) * math.pi / 3
            mid_angle = (angle + next_angle) / 2
            mid_radius = size * 0.25
            mid_x = center_x + mid_radius * math.cos(mid_angle)
            mid_y = center_y + mid_radius * math.sin(mid_angle)
            triangle_points.append((mid_x, mid_y))
    
    # 三角形の要素を含む複合形状を描画
    complex_shape = []
    for i in range(6):
        complex_shape.append(hexagon_points[i])
        if i % 2 == 0:
            complex_shape.append(triangle_points[i // 2])
    
    # 複合形状を描画
    draw.polygon(complex_shape, fill=(255, 255 - blue_shift, 255, 200))
    draw.polygon(complex_shape, outline=crystal_color + (230,), width=int(line_width))
    
    # 中央の装飾
    center_radius = size * 0.15
    draw.ellipse([(center_x - center_radius, center_y - center_radius), 
                 (center_x + center_radius, center_y + center_radius)], 
                 fill=(230, 230 - blue_shift, 255, 200))
    
    # 放射状の線
    for point in hexagon_points:
        draw.line([(center_x, center_y), point], fill=crystal_color + (200,), width=int(line_width * 0.8))
    
    # グローエフェクト（輝き）を追加
    img = add_glow_effect(img, variation['glow'] * 1.1)
    return img

def draw_split_crystal(size, variation):
    """分裂六花の結晶を描画"""
    img = create_base_image(size)
    draw = ImageDraw.Draw(img)
    
    center_x, center_y = size // 2, size // 2
    
    # バリエーションに基づいて調整
    complexity_factor = variation['complexity']
    length_factor = variation['branch_length']
    thickness_factor = variation['thickness']
    line_width = max(1.2, size // 35) * thickness_factor
    
    # 結晶の色（白〜青みがかった白）
    blue_shift = int(variation['blue_shift'])
    crystal_color = (255, 255 - blue_shift, 255, 255)
    
    # 6方向に枝を描画
    for i in range(6):
        angle = i * math.pi / 3
        
        # メインの枝の終点
        branch_length = size * 0.4 * length_factor
        end_x = center_x + branch_length * math.cos(angle)
        end_y = center_y + branch_length * math.sin(angle)
        
        # メインの枝
        draw.line([(center_x, center_y), (end_x, end_y)], fill=crystal_color, width=int(line_width))
        
        # 分裂パターン（先端が2つに分かれる）
        split_length = size * 0.15 * length_factor
        split_angle = math.pi / 8  # 分裂角度
        
        # 左側の分裂
        left_split_angle = angle - split_angle
        left_split_x = end_x + split_length * math.cos(left_split_angle)
        left_split_y = end_y + split_length * math.sin(left_split_angle)
        
        draw.line([(end_x, end_y), (left_split_x, left_split_y)], 
                 fill=crystal_color, width=int(line_width * 0.8))
        
        # 右側の分裂
        right_split_angle = angle + split_angle
        right_split_x = end_x + split_length * math.cos(right_split_angle)
        right_split_y = end_y + split_length * math.sin(right_split_angle)
        
        draw.line([(end_x, end_y), (right_split_x, right_split_y)], 
                 fill=crystal_color, width=int(line_width * 0.8))
        
        # 複雑さに応じて二次分裂を追加
        if complexity_factor > 0.5:
            # 左側の二次分裂
            sub_split_length = split_length * 0.6
            sub_split_angle = split_angle * 0.7
            
            left_sub_angle = left_split_angle - sub_split_angle
            left_sub_x = left_split_x + sub_split_length * math.cos(left_sub_angle)
            left_sub_y = left_split_y + sub_split_length * math.sin(left_sub_angle)
            
            draw.line([(left_split_x, left_split_y), (left_sub_x, left_sub_y)], 
                     fill=crystal_color, width=int(line_width * 0.6))
            
            # 右側の二次分裂
            right_sub_angle = right_split_angle + sub_split_angle
            right_sub_x = right_split_x + sub_split_length * math.cos(right_sub_angle)
            right_sub_y = right_split_y + sub_split_length * math.sin(right_sub_angle)
            
            draw.line([(right_split_x, right_split_y), (right_sub_x, right_sub_y)], 
                     fill=crystal_color, width=int(line_width * 0.6))
        
        # 中間に小枝を追加
        mid_branch_count = int(2 + complexity_factor * 2)
        for j in range(1, mid_branch_count + 1):
            branch_pos = branch_length * (j / (mid_branch_count + 1))
            branch_size = size * 0.1 * (1 - (j / mid_branch_count) * 0.3)
            
            branch_x = center_x + branch_pos * math.cos(angle)
            branch_y = center_y + branch_pos * math.sin(angle)
            
            # 左側の小枝
            left_branch_angle = angle + math.pi / 2
            left_branch_x = branch_x + branch_size * math.cos(left_branch_angle)
            left_branch_y = branch_y + branch_size * math.sin(left_branch_angle)
            
            draw.line([(branch_x, branch_y), (left_branch_x, left_branch_y)], 
                     fill=crystal_color, width=int(line_width * 0.7))
            
            # 右側の小枝
            right_branch_angle = angle - math.pi / 2
            right_branch_x = branch_x + branch_size * math.cos(right_branch_angle)
            right_branch_y = branch_y + branch_size * math.sin(right_branch_angle)
            
            draw.line([(branch_x, branch_y), (right_branch_x, right_branch_y)], 
                     fill=crystal_color, width=int(line_width * 0.7))
    
    # グローエフェクト（輝き）を追加
    img = add_glow_effect(img, variation['glow'] * 1.3)
    return img

def draw_twelve_branched_crystal(size, variation):
    """十二花の結晶を描画"""
    img = create_base_image(size)
    draw = ImageDraw.Draw(img)
    
    center_x, center_y = size // 2, size // 2
    
    # バリエーションに基づいて調整
    complexity_factor = variation['complexity']
    length_factor = variation['branch_length']
    thickness_factor = variation['thickness']
    
    # 結晶の色（白〜青みがかった白）
    blue_shift = int(variation['blue_shift'])
    crystal_color = (255, 255 - blue_shift, 255, 255)
    
    # 第1セット: 通常の6方向に枝を描画
    main_branch_width = max(1.5, size // 30) * thickness_factor
    
    for i in range(6):
        angle = i * math.pi / 3
        end_x = center_x + size * 0.45 * length_factor * math.cos(angle)
        end_y = center_y + size * 0.45 * length_factor * math.sin(angle)
        
        # メインの枝
        draw.line([(center_x, center_y), (end_x, end_y)], 
                 fill=crystal_color, width=int(main_branch_width))
        
        # 装飾枝
        branch_count = 2 + int(complexity_factor * 2)
        for j in range(1, branch_count + 1):
            branch_pos = size * 0.45 * length_factor * (j / (branch_count + 1))
            branch_length = size * 0.12 * (1 - j * 0.2 / branch_count)
            
            branch_x = center_x + branch_pos * math.cos(angle)
            branch_y = center_y + branch_pos * math.sin(angle)
            
            # 左側の小枝
            left_angle = angle + math.pi / 2
            left_x = branch_x + branch_length * math.cos(left_angle)
            left_y = branch_y + branch_length * math.sin(left_angle)
            
            draw.line([(branch_x, branch_y), (left_x, left_y)], 
                     fill=crystal_color, width=int(main_branch_width * 0.7))
            
            # 右側の小枝
            right_angle = angle - math.pi / 2
            right_x = branch_x + branch_length * math.cos(right_angle)
            right_y = branch_y + branch_length * math.sin(right_angle)
            
            draw.line([(branch_x, branch_y), (right_x, right_y)], 
                     fill=crystal_color, width=int(main_branch_width * 0.7))
    
    # 第2セット: 30度回転した6方向に枝を描画
    secondary_branch_width = main_branch_width * 0.8
    
    for i in range(6):
        angle = i * math.pi / 3 + math.pi / 6  # 30度回転
        end_x = center_x + size * 0.4 * length_factor * math.cos(angle)
        end_y = center_y + size * 0.4 * length_factor * math.sin(angle)
        
        # 短めのメインの枝
        draw.line([(center_x, center_y), (end_x, end_y)], 
                 fill=crystal_color, width=int(secondary_branch_width))
        
        # より少ない装飾枝
        branch_count = 1 + int(complexity_factor)
        for j in range(1, branch_count + 1):
            branch_pos = size * 0.4 * length_factor * (j / (branch_count + 1))
            branch_length = size * 0.1 * (1 - j * 0.2 / branch_count)
            
            branch_x = center_x + branch_pos * math.cos(angle)
            branch_y = center_y + branch_pos * math.sin(angle)
            
            # 左側の小枝
            left_angle = angle + math.pi / 2
            left_x = branch_x + branch_length * math.cos(left_angle)
            left_y = branch_y + branch_length * math.sin(left_angle)
            
            draw.line([(branch_x, branch_y), (left_x, left_y)], 
                     fill=crystal_color, width=int(secondary_branch_width * 0.7))
            
            # 右側の小枝
            right_angle = angle - math.pi / 2
            right_x = branch_x + branch_length * math.cos(right_angle)
            right_y = branch_y + branch_length * math.sin(right_angle)
            
            draw.line([(branch_x, branch_y), (right_x, right_y)], 
                     fill=crystal_color, width=int(secondary_branch_width * 0.7))
    
    # グローエフェクト（輝き）を追加
    img = add_glow_effect(img, variation['glow'] * 1.4)
    return img

def draw_asymmetric_crystal(size, variation):
    """非対称結晶を描画"""
    img = create_base_image(size)
    draw = ImageDraw.Draw(img)
    
    center_x, center_y = size // 2, size // 2
    
    # バリエーションに基づいて調整
    complexity_factor = variation['complexity']
    length_factor_base = variation['branch_length']
    thickness_factor = variation['thickness']
    line_width = max(1.2, size // 35) * thickness_factor
    
    # 結晶の色（白〜青みがかった白）
    blue_shift = int(variation['blue_shift'])
    crystal_color = (255, 255 - blue_shift, 255, 255)
    
    # 6方向に非対称な枝を描画
    random.seed(int(variation['temp_factor'] * 100 + variation['humidity_factor'] * 100))
    
    for i in range(6):
        angle = i * math.pi / 3
        
        # 各方向で異なる長さ係数（非対称性）
        random_factor = 0.7 + math.sin(i * 5) * 0.3
        length_factor = length_factor_base * random_factor
        branch_length = size * 0.45 * length_factor
        
        end_x = center_x + branch_length * math.cos(angle)
        end_y = center_y + branch_length * math.sin(angle)
        
        # メインの枝
        draw.line([(center_x, center_y), (end_x, end_y)], 
                 fill=crystal_color, width=int(line_width * random_factor))
        
        # 各方向で異なる数の小枝（非対称性）
        branch_offset = (i % 3) * 0.1  # 0, 0.1, 0.2 のいずれか
        branch_count = max(1, int((2 + branch_offset) * random_factor))
        
        for j in range(1, branch_count + 1):
            # 非対称な位置に小枝
            pos_ratio = (j / (branch_count + 1)) * (0.9 + math.sin(i * j) * 0.1)
            branch_pos = branch_length * pos_ratio
            
            branch_x = center_x + branch_pos * math.cos(angle)
            branch_y = center_y + branch_pos * math.sin(angle)
            
            # 小枝の長さ（非対称）
            branch_size = size * 0.15 * (1 - pos_ratio * 0.5) * (0.8 + math.cos(i * 3) * 0.2)
            
            # 左側の小枝（長さと角度も非対称）
            left_angle = angle + math.pi / 3 - math.sin(i) * math.pi / 9
            left_x = branch_x + branch_size * math.cos(left_angle)
            left_y = branch_y + branch_size * math.sin(left_angle)
            
            draw.line([(branch_x, branch_y), (left_x, left_y)], 
                     fill=crystal_color, width=int(line_width * 0.8 * random_factor))
            
            # 右側の小枝（左側と異なる長さ・角度）
            right_angle = angle - math.pi / 3 + math.sin(i + 2) * math.pi / 9
            right_length = branch_size * (0.8 + math.cos(i * 7) * 0.2)
            right_x = branch_x + right_length * math.cos(right_angle)
            right_y = branch_y + right_length * math.sin(right_angle)
            
            draw.line([(branch_x, branch_y), (right_x, right_y)], 
                     fill=crystal_color, width=int(line_width * 0.7 * random_factor))
    
    # グローエフェクト（輝き）を追加
    img = add_glow_effect(img, variation['glow'])
    return img

def create_normal_dendrite(size, variation):
    """通常樹枝状結晶を生成する関数"""
    # 通常樹枝状は複雑樹枝状より単純なパラメータ
    branch_depth = 3 + int(variation['complexity'] * 1.5)  # 3〜4
    branch_length_ratio = 0.35 + (variation['branch_length'] * 0.15)  # 0.35〜0.5
    thickness = 3 + int(variation['thickness'] * 2)  # 3〜5
    branch_angle = 30 + int(variation['temp_factor'] * 10)  # 30〜40
    
    # 色合いを調整（青みがかった白）
    blue_shift = int(min(30, variation['blue_shift']))
    color = (255, 255 - blue_shift, 255, 255)
    
    # 基本的な結晶を生成
    img = create_simple_dendrite(
        size,
        branch_depth=branch_depth,
        branch_length_ratio=branch_length_ratio,
        thickness=thickness,
        branch_angle=branch_angle,
        color=color
    )
    
    # グロー効果を追加（通常樹枝状は少し控えめに）
    glow_radius = 4 + int(variation['glow'] * 8)  # 4〜12
    img = add_glow_effect(img, radius=glow_radius)
    
    return img


# 結晶タイプに基づいて描画を振り分ける関数
def generate_crystal_image(crystal_type, size, temp, humidity):
    """結晶タイプに基づいて適切な描画関数を呼び出す"""
    variation = calculate_variation(temp, humidity)
    
    # 結晶画像を格納する変数
    img = None
    
    # 複雑樹枝状結晶の場合は新しいアルゴリズムを使用
    if crystal_type == 'DENDRITE_COMPLEX':
        img = create_complex_dendrite(size, variation)
        # # 追加のディテールを加える
        # img = add_more_details(img, detail_level=3)
    
    # 結晶タイプに基づいて描画関数を呼び出す
    elif crystal_type == 'NEEDLE_THIN':
        img = draw_needle_crystal(size, variation, is_thick=False)
    elif crystal_type == 'NEEDLE_THICK':
        img = draw_needle_crystal(size, variation, is_thick=True)
    elif crystal_type == 'COLUMN_SIMPLE':
        img = draw_column_crystal(size, variation, is_capped=False)
    elif crystal_type == 'COLUMN_CAPPED':
        img = draw_column_crystal(size, variation, is_capped=True)
    elif crystal_type == 'PLATE_SIMPLE':
        img = draw_plate_crystal(size, variation, is_sector=False)
    elif crystal_type == 'PLATE_SECTOR':
        img = draw_plate_crystal(size, variation, is_sector=True)
    elif crystal_type == 'STELLAR_SIMPLE':
        img = draw_stellar_crystal(size, variation, is_complex=False)
    elif crystal_type == 'STELLAR_DENDRITE':
        img = draw_stellar_crystal(size, variation, is_complex=True)
    elif crystal_type == 'DENDRITE_NORMAL':
        img = create_normal_dendrite(size, variation)
    elif crystal_type == 'FERNLIKE_SIMPLE':
        img = draw_fernlike_crystal(size, variation, is_complex=False)
    elif crystal_type == 'FERNLIKE_COMPLEX':
        img = draw_fernlike_crystal(size, variation, is_complex=True)
    elif crystal_type == 'TRIANGULAR':
        img = draw_triangular_crystal(size, variation)
    elif crystal_type == 'SPLIT':
        img = draw_split_crystal(size, variation)
    elif crystal_type == 'ASYMMETRIC':
        img = draw_asymmetric_crystal(size, variation)
    elif crystal_type == 'TWELVE_BRANCHED':
        img = draw_twelve_branched_crystal(size, variation)
    else:
        # デフォルトは樹枝状
        img = draw_dendrite_crystal(size, variation, is_complex=False)
    
    # 背景ノイズを除去する処理を追加
    img = clean_background(img)
    
    return img


# 画像ファイル名を生成する関数
def get_image_filename(temp, humidity):
    """温度と湿度から画像ファイル名を生成"""
    return f"crystal_t{temp}_h{humidity}.png"

# メインの画像生成と保存処理
def generate_all_crystals():
    """全ての温度と湿度の組み合わせで結晶画像を生成して保存"""
    # 温度範囲（-20℃〜0℃、1℃刻み）
    temperatures = range(-20, 1, 1)
    
    # 湿度範囲（0%〜100%、5%刻み）
    humidities = range(0, 101, 5)
    
    # 結晶データを格納する辞書
    crystal_data = {
        'types': {},      # 結晶タイプの情報
        'mappings': {}    # 温度・湿度と結晶タイプの対応
    }
    
    # 各結晶タイプの情報を格納
    for crystal_type, info in CRYSTAL_TYPES.items():
        crystal_data['types'][crystal_type] = {
            'name': info['name'],
            'description': info['description']
        }
    
    # 温度と湿度の組み合わせごとに処理
    total_combinations = len(temperatures) * len(humidities)
    current = 0
    
    for temp in temperatures:
        for humidity in humidities:
            current += 1
            print(f"処理中: {current}/{total_combinations} - 温度: {temp}℃, 湿度: {humidity}%")
            
            # 結晶タイプを決定
            crystal_type = get_crystal_type(temp, humidity)
            
            # 出力ファイル名
            filename = get_image_filename(temp, humidity)
            
            # 結晶情報をマッピングに追加
            key = f"t{temp}_h{humidity}"
            crystal_data['mappings'][key] = {
                'type': crystal_type,
                'file': filename,
                'temp': temp,
                'humidity': humidity
            }
            
            # 結晶画像を生成
            image = generate_crystal_image(crystal_type, 400, temp, humidity)
            
            # 画像を保存
            image.save(os.path.join(OUTPUT_DIR, filename))
    
    # 結晶データをJSONとして保存
    with open(os.path.join(OUTPUT_DIR, 'crystal_data.json'), 'w', encoding='utf-8') as f:
        json.dump(crystal_data, f, ensure_ascii=False, indent=2)
    
    print("全ての結晶画像が生成されました。")
    print(f"結晶データは {os.path.join(OUTPUT_DIR, 'crystal_data.json')} に保存されました。")

# # プログラム実行
if __name__ == "__main__":
    generate_all_crystals()

# def test_both_dendrites():
#     """通常樹枝状と複雑樹枝状のテスト生成"""
#     test_dir = os.path.join(OUTPUT_DIR, 'test')
#     os.makedirs(test_dir, exist_ok=True)
    
#     # テストパターン
#     test_cases = [
#         {'type': 'DENDRITE_NORMAL', 'temp': -18, 'humidity': 75},
#         {'type': 'DENDRITE_NORMAL', 'temp': -19, 'humidity': 80},
#         {'type': 'DENDRITE_COMPLEX', 'temp': -16, 'humidity': 90},
#         {'type': 'DENDRITE_COMPLEX', 'temp': -17, 'humidity': 95}
#     ]
    
#     for case in test_cases:
#         variation = calculate_variation(case['temp'], case['humidity'])
#         img = generate_crystal_image(case['type'], 400, case['temp'], case['humidity'])
        
#         # ファイル名を生成
#         filename = f"{case['type'].lower()}_t{case['temp']}_h{case['humidity']}.png"
#         filepath = os.path.join(test_dir, filename)
        
#         # 保存
#         img.save(filepath)
#         print(f"生成: {filepath}")

# # 実行
# if __name__ == "__main__":
#     test_both_dendrites()

# def test_dendrite():
#     """樹枝状結晶のテスト生成"""
#     # テスト用ディレクトリ
#     test_dir = os.path.join(OUTPUT_DIR, 'test')
#     os.makedirs(test_dir, exist_ok=True)
    
#     # 複数のパターンで結晶を生成
#     temperatures = [-18, -16, -14]
#     humidities = [80, 90, 100]
    
#     for temp in temperatures:
#         for humidity in humidities:
#             variation = calculate_variation(temp, humidity)
#             img = create_complex_dendrite(400, variation)
            
#             # ファイル名を生成
#             filename = f"dendrite_t{temp}_h{humidity}.png"
#             filepath = os.path.join(test_dir, filename)
            
#             # 保存
#             img.save(filepath)
#             print(f"生成: {filepath}")

# # 実行
# if __name__ == "__main__":
#     test_dendrite()


# # テスト用関数 - 複雑樹枝状結晶の生成をテスト
# def test_complex_dendrite():
#     # 出力ディレクトリ
#     test_dir = os.path.join(OUTPUT_DIR, 'test')
#     os.makedirs(test_dir, exist_ok=True)
    
#     # 複雑樹枝状の結晶を生成（サイズ400px）
#     temp = -16  # 温度
#     humidity = 90  # 湿度
    
#     variation = calculate_variation(temp, humidity)
    
#     # 新しいアルゴリズムで結晶を生成
#     img = create_dendrite_complex(400, variation)
    
#     # 詳細を追加
#     img_with_details = add_more_details(img)
    
#     # 保存
#     img.save(os.path.join(test_dir, 'complex_dendrite_base.png'))
#     img_with_details.save(os.path.join(test_dir, 'complex_dendrite_detailed.png'))
    
#     print("複雑樹枝状結晶のテスト画像を生成しました。")
#     print(f"保存先: {test_dir}")



# # 実行
# if __name__ == "__main__":
#     test_complex_dendrite()    