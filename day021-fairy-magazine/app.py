import streamlit as st
import pandas as pd
import random
import os
import io
import re
import math
import numpy as np
import requests
from PIL import Image, ImageFont, ImageDraw, ImageFilter, ImageEnhance, ImageOps
from rembg import remove
import base64
from datetime import datetime
import glob
import time
import pillow_heif

# アプリの開始時にHEIF形式のサポートを登録
pillow_heif.register_heif_opener()

# アプリ設定
st.set_page_config(
    page_title="VICE FAIRY風 画像ジェネレーター",
    page_icon="🧚",
    layout="centered"
)

# 固定レイアウト設定（完全に最適化）
FIXED_LAYOUT = {
    "magazine": {"x": 60, "y": 50, "size": 80, "color": "black"},   # さらに上に配置
    "name": {"x": 60, "y": 130, "size": 90, "color": "black"},      # さらに上に配置
    "number": {"x": 950, "y": 50, "size": 80, "color": "black"},    # 右上、より小さく
    "series": {"x": 60, "y": 230, "size": 40, "color": "gray"},     # 位置調整
    "note": {"x": 60, "y": 280, "size": 30, "color": "black", "max_width": 450},  # 位置調整
    "catch1": {"x": 360, "y": 430, "size": 80, "vertical": True, "color": "black", "line_spacing": 0.85},  # 太く、間隔調整
    "catch2": {"x": 210, "y": 430, "size": 80, "vertical": True, "color": "black", "line_spacing": 0.85},  # 太く、間隔調整
    "catch3": {"x": 50, "y": 430, "size": 80, "vertical": True, "color": "black", "line_spacing": 0.85}    # 太く、間隔調整
}

# セッション状態の初期化
if 'used_captions' not in st.session_state:
    st.session_state.used_captions = []
if 'last_caption' not in st.session_state:
    st.session_state.last_caption = None
if 'processed_image' not in st.session_state:
    st.session_state.processed_image = None
if 'selected_bg_data' not in st.session_state:
    st.session_state.selected_bg_data = None
if 'selected_bg_filename' not in st.session_state:
    st.session_state.selected_bg_filename = None
if 'last_artist_name' not in st.session_state:
    st.session_state.last_artist_name = None
if 'issue_number' not in st.session_state:
    st.session_state.issue_number = random.randint(1, 30)
if 'bg_option' not in st.session_state:
    st.session_state.bg_option = "ランダム背景画像"
if 'quality' not in st.session_state:
    st.session_state.quality = "medium"
if 'change_caption' not in st.session_state:
    st.session_state.change_caption = False
if 'bg_change_requested' not in st.session_state:
    st.session_state.bg_change_requested = False
if 'custom_artist_name' not in st.session_state:
    st.session_state.custom_artist_name = ""
if 'use_custom_name' not in st.session_state:
    st.session_state.use_custom_name = False
if 'custom_magazine_title' not in st.session_state:
    st.session_state.custom_magazine_title = "C O D E  L E A R N"
if 'custom_name' not in st.session_state:
    st.session_state.custom_name = None
# セッション状態の初期化に追加
if 'immediate_caption_change' not in st.session_state:
    st.session_state.immediate_caption_change = False
# キャッチコピー更新用フラグ（新規追加）
if 'need_update_caption' not in st.session_state:
    st.session_state.need_update_caption = False


def get_vertical_text_map():
    """縦書き用の文字変換マップを返す関数（句読点対応版）"""
    return {
        '「': '﹁',  # 始め二重かぎ括弧
        '」': '﹂',  # 終わり二重かぎ括弧
        '（': '︵',  # 始め丸括弧
        '）': '︶',  # 終わり丸括弧
        '『': '﹃',  # 始め二重鉤括弧
        '』': '﹄',  # 終わり二重鉤括弧
        '［': '︹',  # 始め角括弧
        '］': '︺',  # 終わり角括弧
        '〈': '︿',  # 始め山括弧
        '〉': '﹀',  # 終わり山括弧
        '《': '︻',  # 始め二重山括弧
        '》': '︼',  # 終わり二重山括弧
        '【': '︷',  # 始め隅付き括弧
        '】': '︸',  # 終わり隅付き括弧
        '─': '｜',  # 横線を縦線に
        '…': '⋮',   # 三点リーダーを縦に
        '、': '︑',  # 読点
        '。': '︒',  # 句点
        '"': '〞',  # 引用符
        '"': '〟',  # 引用符（閉じる）
        'ー': '｜'
    }

def load_captions(csv_file='captions.csv'):
    """CSVファイルからキャッチコピーを読み込む関数"""
    try:
        # CSVファイルが存在するか確認
        if not os.path.exists(csv_file):
            st.error(f"CSVファイルが見つかりません: {csv_file}")
            return []
        
        # CSVファイルを読み込む（エンコーディングを自動検出）
        try:
            df = pd.read_csv(csv_file, encoding='utf-8', header=None)
        except UnicodeDecodeError:
            try:
                df = pd.read_csv(csv_file, encoding='cp932', header=None)  # Windows日本語
            except UnicodeDecodeError:
                df = pd.read_csv(csv_file, encoding='latin1', header=None)  # フォールバック
        
        # データを取得し、空の値を除外
        if len(df) > 0:
            captions = df.iloc[:, 0].tolist()
            return [cap for cap in captions if str(cap).strip() and not pd.isna(cap)]
        else:
            st.error("CSVファイルに有効なデータがありません")
            return []
    except Exception as e:
        st.error(f"CSVファイルの読み込み中にエラーが発生しました: {e}")
        return []

def parse_caption(caption_text):
    """キャッチコピーをパースして行とアーティスト名に分ける関数"""
    if '：' in caption_text:
        parts = caption_text.split('：')
        text = parts[0]
        artist = parts[1] if len(parts) > 1 else ""
    else:
        text = caption_text
        artist = ""
    
    # テキストをスペースで分割して行に分ける
    lines = text.split('　')
    return lines, artist

def select_random_caption(captions, avoid_caption=None):
    """過去20回使われていないキャッチコピーをランダムに選択する関数"""
    if not captions:
        return ["キャッチコピーがありません"], ""
    
    # 使用可能なキャッチコピーをフィルター（過去に使用したものと直前のものを除外）
    available_captions = [cap for cap in captions if cap not in st.session_state.used_captions]
    
    # 直前のキャッチコピーを避ける（指定があれば）
    if avoid_caption and avoid_caption in available_captions:
        available_captions.remove(avoid_caption)
    
    # 全てのキャッチコピーが使用済みの場合はリセット
    if not available_captions:
        st.info("全てのキャッチコピーを使い切りました。リストをリセットします。")
        available_captions = captions
        if avoid_caption and avoid_caption in available_captions:
            available_captions.remove(avoid_caption)
        st.session_state.used_captions = []
    
    # ランダムに選択して使用済みリストを更新
    selected_caption = random.choice(available_captions)
    st.session_state.last_caption = selected_caption
    st.session_state.used_captions.append(selected_caption)
    
    # 最近使った20個だけを保持
    if len(st.session_state.used_captions) > 20:
        st.session_state.used_captions.pop(0)
    
    lines, artist = parse_caption(selected_caption)
    return lines, artist

def remove_background(image):
    """画像の背景を除去する関数（HEIC対応版）"""
    try:
        # バイト配列から画像を開く
        img = Image.open(io.BytesIO(image))
        
        # HEICなどの場合はRGBAに変換
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # バイト配列に変換して処理
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        
        # 背景除去処理を実行
        return remove(img_byte_arr.getvalue())
    except Exception as e:
        st.error(f"背景除去中にエラーが発生しました: {e}")
        return None

def get_best_font(font_size, is_vertical=False, is_artist=False, is_title=False):
    """使用可能な最適なフォントを取得する関数（修正版）"""
    # 可能性のあるフォントパスのリスト（日本語フォント優先）
    if is_title:
        # タイトル用フォント（極太）
        possible_fonts = [
            "/usr/share/fonts/truetype/noto/NotoSansCJK-Black.ttc",
            "/usr/share/fonts/truetype/noto/NotoSansCJKjp-Black.otf",
            "C:\\Windows\\Fonts\\meiryob.ttc",  # Windows
            "C:\\Windows\\Fonts\\yugothb.ttc",  # Windows
            "/System/Library/Fonts/ヒラギノ角ゴシック W8.ttc",  # macOS
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",  # フォールバック
        ]
    elif is_artist:
        # アーティスト名用フォント（中間）
        possible_fonts = [
            "/usr/share/fonts/truetype/noto/NotoSansCJK-Medium.ttc",
            "/usr/share/fonts/truetype/noto/NotoSansCJKjp-Medium.otf",
            "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc",  # macOS
            "C:\\Windows\\Fonts\\msgothic.ttc",  # Windows
            "C:\\Windows\\Fonts\\YuGothM.ttc",  # Windows
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",  # フォールバック
        ]
    else:
        if is_vertical:
            # 縦書き用フォント（極太）- 修正: より太いフォントを上位に配置
            possible_fonts = [
                "/usr/share/fonts/truetype/noto/NotoSansCJK-Black.ttc",  # 最優先
                "/usr/share/fonts/truetype/noto/NotoSansCJKjp-Black.otf",
                "C:\\Windows\\Fonts\\meiryob.ttc",  # Windows 太字
                "C:\\Windows\\Fonts\\yugothb.ttc",  # Windows 太字
                "/System/Library/Fonts/ヒラギノ角ゴシック W8.ttc",  # macOS 極太
                "/System/Library/Fonts/ヒラギノ明朝 ProN W6.ttc",  # macOS
                "C:\\Windows\\Fonts\\msmincho.ttc",  # Windows
                "C:\\Windows\\Fonts\\YuMincho.ttc",  # Windows
                "/usr/share/fonts/truetype/ipafont-gothic/ipag.ttf",
                "/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc",
                "/usr/share/fonts/opentype/noto/NotoSansCJKjp-Black.otf",
                "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",  # フォールバック
            ]
        else:
            # メインキャッチコピー用フォント（太め）
            possible_fonts = [
                "/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc",
                "/usr/share/fonts/truetype/noto/NotoSansCJKjp-Bold.otf",
                "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
                "/usr/share/fonts/opentype/noto/NotoSansCJKjp-Bold.otf",
                "/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc",  # macOS
                "C:\\Windows\\Fonts\\meiryo.ttc",  # Windows
                "C:\\Windows\\Fonts\\YuGothB.ttc",  # Windows
                "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",  # フォールバック
            ]
    
    # 使用可能なフォントを探す
    for font_path in possible_fonts:
        if os.path.exists(font_path):
            try:
                return ImageFont.truetype(font_path, font_size)
            except Exception:
                continue
    
    # どのフォントも利用できない場合はデフォルトフォント
    return ImageFont.load_default()

def generate_random_english_text():
    """ランダムな英語の注意書きテキストを生成する関数（短めに）"""
    prefixes = [
        "Fashion coordinator",
        "DESIGNER'S NOTE",
        "100DAY FAIRY PRESENTS",
        "EXCLUSIVE INTERVIEW",
        "LIMITED EDITION",
        "SPECIAL FEATURE"
    ]
    
    # より簡潔な文章に
    texts = [
        "We capture the essence of urban mysticism in this collection.",
        "Creating the perfect balance between elegance and darkness.",
        "Each piece was carefully selected to reflect the model's unique persona.",
        "The contrast between light and shadow represents the duality of modern existence.",
        "This collection explores the boundaries between reality and fantasy.",
        "100day FAIRY style embraces the imperfections of darkness.",
        "A visual narrative that transcends typical fashion imagery.",
        "A unique fusion that defines contemporary avant-garde fashion."
    ]
    
    prefix = random.choice(prefixes)
    text = random.choice(texts)
    
    return prefix, text

def load_template_image():
    """テンプレート画像を読み込む関数"""
    # 同じディレクトリ内のtemplate.pngを読み込む
    try:
        with open("template.png", "rb") as f:
            template_data = f.read()
            return template_data
    except FileNotFoundError:
        # ファイルが見つからない場合はアップロードを促す
        st.warning("template.pngが見つかりません。テンプレート画像をアップロードしてください。")
        uploaded_template = st.file_uploader("テンプレート画像をアップロード", type=["png", "jpg", "jpeg"], help="破れた紙の効果のあるテンプレート")
        
        if uploaded_template is not None:
            # アップロードされたテンプレートを使用
            template_data = uploaded_template.getvalue()
            # 今後使用するためにファイルとして保存
            with open("template.png", "wb") as f:
                f.write(template_data)
            return template_data
        return None

def get_local_backgrounds(backgrounds_dir="backgrounds"):
    """ローカルに保存された背景画像のパスリストを取得する関数"""
    if not os.path.exists(backgrounds_dir):
        os.makedirs(backgrounds_dir)
        return []
    
    # 画像ファイルを検索
    background_files = glob.glob(f"{backgrounds_dir}/*.jpg") + \
                       glob.glob(f"{backgrounds_dir}/*.jpeg") + \
                       glob.glob(f"{backgrounds_dir}/*.png")
    
    return sorted(background_files)  # ソートして返す

def get_random_local_background(backgrounds_dir="backgrounds", avoid_file=None):
    """ローカルに保存された背景画像からランダムに1つ選ぶ関数"""
    background_files = get_local_backgrounds(backgrounds_dir)
    
    if not background_files:
        st.warning(f"背景画像が見つかりません。{backgrounds_dir} フォルダに画像を配置するか、背景画像ダウンローダースクリプトを実行してください。")
        return None, None
    
    # 前回の背景を避ける（指定があれば）
    if avoid_file and avoid_file in background_files:
        background_files.remove(avoid_file)
    
    # ファイルがない場合（全部除外された場合）
    if not background_files:
        st.warning("利用可能な新しい背景画像がありません。")
        return None, None
    
    # ランダムに1つ選択
    selected_file = random.choice(background_files)
    
    try:
        with open(selected_file, "rb") as f:
            bg_data = f.read()
        return bg_data, selected_file
    except Exception as e:
        st.error(f"背景画像の読み込みに失敗しました: {e}")
        return None, None

def analyze_image_content(image_data):
    """画像内のコンテンツ（人物）の占める割合を分析する関数"""
    try:
        img = Image.open(io.BytesIO(image_data))
        
        # 透明度を持つ画像の場合（RGBA）
        if img.mode == 'RGBA':
            # アルファチャンネルをマスクとして取得
            r, g, b, a = img.split()
            
            # 不透明なピクセル数をカウント
            non_transparent_pixels = np.sum(np.array(a) > 0)
            total_pixels = img.width * img.height
            
            # 内容物の割合を計算
            content_ratio = non_transparent_pixels / total_pixels
            
            # バウンディングボックスを計算
            alpha_array = np.array(a)
            non_zero_indices = np.nonzero(alpha_array)
            
            if len(non_zero_indices[0]) > 0:
                min_y, max_y = np.min(non_zero_indices[0]), np.max(non_zero_indices[0])
                min_x, max_x = np.min(non_zero_indices[1]), np.max(non_zero_indices[1])
                
                width = max_x - min_x
                height = max_y - min_y
                
                # 人物の幅と高さの比率
                content_width_ratio = width / img.width
                content_height_ratio = height / img.height
                
                return {
                    'content_ratio': content_ratio,
                    'width_ratio': content_width_ratio,
                    'height_ratio': content_height_ratio,
                    'bounds': (min_x, min_y, max_x, max_y)
                }
            
        # 透明度を持たない画像やバウンディングボックスが計算できない場合
        return {
            'content_ratio': 0.5,  # デフォルト値
            'width_ratio': 0.8,
            'height_ratio': 0.8,
            'bounds': None
        }
    except Exception as e:
        st.warning(f"画像分析中にエラーが発生しました: {e}")
        return {
            'content_ratio': 0.5,  # デフォルト値
            'width_ratio': 0.8,
            'height_ratio': 0.8,
            'bounds': None
        }

def create_magazine_layout(bg_removed_image, caption_lines, artist_name, template_image, 
                         issue_number=None, quality="high", bg_image=None, 
                         custom_title=None, custom_name=None):
    """VICE FAIRY風雑誌レイアウトを作成する関数（カスタムテキスト対応版）"""
    try:
        # バイト配列から画像を開く
        img = Image.open(io.BytesIO(bg_removed_image)).convert("RGBA")
        template = Image.open(io.BytesIO(template_image)).convert("RGBA")
        
        # レイアウト設定 - この行を先に移動！
        layout = FIXED_LAYOUT
        
        # 画像の分析
        analysis = analyze_image_content(bg_removed_image)
        
        # A4サイズの比率を適用 (1:1.414)
        if quality == "high":
            # 高品質 (300 DPI相当、A4)
            width, height = 2480, 3508  # A4サイズ @ 300dpi
        elif quality == "medium":
            # 中品質
            width, height = 1240, 1754  # A4サイズの半分 @ 150dpi
        else:
            # 低品質 (画面表示用)
            width, height = 840, 1188  # 小さめ
        
        # 黒背景のキャンバスを作成（修正：純黒からダークグレーに変更）
        canvas = Image.new('RGB', (width, height), (30, 30, 30))
        
        # 背景画像があれば使用
        if bg_image is not None:
            try:
                bg = Image.open(io.BytesIO(bg_image)).convert("RGB")
                bg = bg.resize((width, height), Image.LANCZOS)
                
                # 背景画像を暗くして効果を適用
                enhancer = ImageEnhance.Brightness(bg)
                bg = enhancer.enhance(0.5)  # より暗くする
                
                # 背景をぼかす
                bg = bg.filter(ImageFilter.GaussianBlur(5))
                
                # 背景を適用
                canvas.paste(bg, (0, 0))
            except Exception as e:
                st.error(f"背景画像の処理に失敗しました: {e}")
        
        # テンプレート画像をリサイズして配置
        template_width, template_height = template.size
        # テンプレートの高さを基準にリサイズ係数を計算
        template_ratio = height / template_height
        new_template_width = int(template_width * template_ratio)
        new_template_height = height
        
        # テンプレートをリサイズ
        resized_template = template.resize((new_template_width, new_template_height), Image.LANCZOS)
        
        # 透明部分のあるテンプレートをRGBAで合成
        template_rgba = resized_template.convert("RGBA")
        canvas_rgba = canvas.convert("RGBA")
        canvas_rgba.paste(template_rgba, (0, 0), template_rgba)
        
        # 人物画像のリサイズと配置
        person_width, person_height = img.size
        
        # 人物エリアのサイズ（テンプレート画像の右側半分）
        person_area_width = width - new_template_width // 2
        person_area_x = width // 2  # 画像の右半分
        
        # コンテンツ（人物）の大きさに基づいてスケール係数を調整
        # 人物が小さい場合は大きく表示
        base_scale_factor = 2.5  # 基本スケール
        
        # コンテンツが少ない（人物が小さい）場合はスケールを大きくする
        if analysis['content_ratio'] < 0.3:
            content_scale = 3.5  # 小さい人物用の拡大率
        elif analysis['content_ratio'] < 0.5:
            content_scale = 3.0  # 中くらいの人物用の拡大率
        else:
            content_scale = base_scale_factor  # 大きい人物はデフォルト
        
        # サイズ計算（コンテンツに基づいて調整）
        scale_factor = content_scale
        new_person_width = int(person_width * scale_factor)
        new_person_height = int(person_height * scale_factor)
        
        # 縦横比を維持しながらリサイズ
        resize_ratio = min(person_area_width / person_width, height / person_height) * scale_factor * 0.8
        new_person_width = int(person_width * resize_ratio)
        new_person_height = int(person_height * resize_ratio)
        
        # 人物画像をリサイズ
        person_img = img.resize((new_person_width, new_person_height), Image.LANCZOS)
        
        # 画像効果の適用
        enhancer = ImageEnhance.Contrast(person_img)
        person_img = enhancer.enhance(1.2)
        
        enhancer = ImageEnhance.Sharpness(person_img)
        person_img = enhancer.enhance(1.3)
        
        # 人物画像の配置位置を修正 - 常に右側に配置するよう強制
        # 画面の右側から人物画像のサイズを引いた位置に配置（右寄せ）
        person_x = width - new_person_width + width // 3  # 右側寄せに修正
        person_y = height // 2 - new_person_height // 2 + height // 7
        
        # 人物画像のアルファチャンネルを保持して合成
        canvas_rgba.paste(person_img, (person_x, person_y), person_img)
        
        # この段階でRGBに変換（テキスト描画用）
        canvas = canvas_rgba.convert("RGB")
        
        # Draw オブジェクトの作成
        draw = ImageDraw.Draw(canvas)
        
        # ロゴ
        magazine_config = layout.get("magazine", {"x": 60, "y": 80, "size": 80, "color": "black"})
        magazine_font = get_best_font(magazine_config["size"], False, False, True)
        magazine_text = custom_title if custom_title else "C O D E  L E A R N" 

        # タイトルの白い縁取り
        outline_size = max(3, int(magazine_config["size"] / 15))
        for dx, dy in [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1),
                    (-2, -2), (-2, 0), (-2, 2), (0, -2), (0, 2), (2, -2), (2, 0), (2, 2)]:
            draw.text(
                (magazine_config["x"] + dx * outline_size/2, magazine_config["y"] + dy * outline_size/2),
                magazine_text,
                fill=(255, 255, 255, 255),  # 白色
                font=magazine_font
            )

        # タイトル本体（黒）
        draw.text(
            (magazine_config["x"], magazine_config["y"]), 
            magazine_text,
            fill=magazine_config.get("color", "black"), 
            font=magazine_font
        )
        
        # 号数
        if issue_number is None:
            issue_number = random.randint(1, 30)
        
        number_config = layout.get("number", {"x": 750, "y": 100, "size": 100, "color": "black"})
        number_font = get_best_font(number_config["size"], False, False, True)
        number_text = f"# {issue_number:02d}"

        # 号数の白い縁取り
        outline_size = max(3, int(number_config["size"] / 15))
        for dx, dy in [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1),
                    (-2, -2), (-2, 0), (-2, 2), (0, -2), (0, 2), (2, -2), (2, 0), (2, 2)]:
            draw.text(
                (number_config["x"] + dx * outline_size/2, number_config["y"] + dy * outline_size/2),
                number_text,
                fill=(255, 255, 255, 255),  # 白色
                font=number_font
            )

        # 号数本体（黒）
        draw.text(
            (number_config["x"], number_config["y"]),
            number_text,
            fill=number_config.get("color", "black"),
            font=number_font
        )
        
        # アーティスト名をサブタイトルとして使用（カスタマイズ対応）
        name_config = layout.get("name", {"x": 60, "y": 160, "size": 90, "color": "black"})
        name_font = get_best_font(name_config["size"], False, False, True)
        name_text = custom_name if custom_name else artist_name
        draw.text(
            (name_config["x"], name_config["y"]),
            name_text,
            fill=name_config.get("color", "black"),
            font=name_font
        )
        
        # シリーズ名と英語の説明文
        series_name, note_text = generate_random_english_text()
        
        series_config = layout.get("series", {"x": 60, "y": 260, "size": 40, "color": "gray"})
        series_font = get_best_font(series_config["size"], False, False, False)
        draw.text(
            (series_config["x"], series_config["y"]),
            series_name,
            fill=series_config.get("color", "gray"),
            font=series_font
        )
        
        # 英語のノート
        note_config = layout.get("note", {"x": 60, "y": 310, "size": 30, "color": "black", "max_width": 450})
        note_font = get_best_font(note_config["size"], False, False, False)
        
        # 長文を折り返して配置
        from textwrap import wrap
        max_width = note_config.get("max_width", 450)
        char_width = int(note_config["size"] * 0.6)  # 文字の平均幅を推定
        wrap_width = max(10, int(max_width / char_width))  # 行あたりの文字数を計算
        
        wrapped_text = wrap(note_text, width=wrap_width)
        for i, line in enumerate(wrapped_text):
            draw.text(
                (note_config["x"], note_config["y"] + i * (note_config["size"] * 1.2)),
                line,
                fill=note_config.get("color", "black"),
                font=note_font
            )
        
        # 縦書き用の文字変換マップを取得
        vertical_map = get_vertical_text_map()
        
        # キャッチコピーの行数に応じてレイアウトを調整
        lines_count = min(3, len(caption_lines))  # 最大3行まで
        positions = []
        
        # 2行の場合は専用レイアウト
        if lines_count == 2:
            # 2行の場合は左右に均等配置
            positions = [
                {"x": 420, "y": 430, "size": 85},  # 右側
                {"x": 160, "y": 430, "size": 85}   # 左側
            ]
        else:
            # 1行または3行の場合は通常のレイアウト
            for i in range(lines_count):
                catch_key = f"catch{i+1}"
                # 右から左へ配置
                pos = layout.get(catch_key, {"x": 480 - i*200, "y": 430, "size": 85, "vertical": True, "color": "black", "line_spacing": 0.85})
                positions.append(pos)
        
        # キャッチコピーを描画
        for i, line in enumerate(caption_lines[:lines_count]):
            pos = positions[i]
            catch_font = get_best_font(pos["size"], True, False)
            x = pos["x"]
            y = pos["y"]
            
            # 行の長さに基づいて調整（長いほど上に開始）
            line_length = len(line)
            if line_length > 15:
                y = y - (line_length - 15) * (pos["size"] * 0.3)
            
            # 縦書き用に文字を置換
            vertical_line = ""
            for char in line:
                vertical_line += vertical_map.get(char, char)  # マップにある文字は置換、ない文字はそのまま
            
            # 縦書きで1文字ずつ描画
            for j, char in enumerate(vertical_line):
                # 文字間隔を調整
                char_y = y + j * (pos["size"] * 1.2)
                
                # 白い縁取り（太めに）
                outline_size = max(3, int(pos["size"] / 15))
                for dx, dy in [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1),
                              (-2, -2), (-2, 0), (-2, 2), (0, -2), (0, 2), (2, -2), (2, 0), (2, 2)]:
                    draw.text(
                        (x + dx * outline_size/2, char_y + dy * outline_size/2),
                        char,
                        fill=(255, 255, 255, 255),  # 白色
                        font=catch_font
                    )
                
                # メイン文字（黒）
                draw.text(
                    (x, char_y),
                    char,
                    fill=(0, 0, 0, 255),  # 黒色
                    font=catch_font
                )
        
        # RGBモードに変換
        final_image = canvas.convert("RGB")
        
        # 完成した画像をバイト配列として返す
        output = io.BytesIO()
        final_image.save(output, format="JPEG", quality=95)
        output.seek(0)
        
        return output.getvalue()
    except Exception as e:
        st.error(f"画像作成中にエラーが発生しました: {e}")
        import traceback
        st.error(traceback.format_exc())
        return None

def get_image_download_link(img, filename, text):
    """画像のダウンロードリンクを生成する関数"""
    b64 = base64.b64encode(img).decode()
    return f'<a href="data:image/jpeg;base64,{b64}" download="{filename}" style="display:inline-block;padding:8px 16px;background-color:#4CAF50;color:white;text-align:center;text-decoration:none;font-size:16px;border-radius:4px;">{text}</a>'

def validate_image(file):
    """アップロードされた画像を検証する関数（HEIC対応版）"""
    try:
        image = Image.open(file)
        # サイズチェック
        if file.size > 10 * 1024 * 1024:
            return False, "画像サイズは10MB以下にしてください。"
        return True, None
    except Exception as e:
        return False, f"画像の検証中にエラーが発生しました: {e}"

def save_sample_csv():
    """サンプルのCSVファイルを作成する関数"""
    sample_captions = [
        "蒼き小花が　舞う刹那の　夜空の大花のみぞ知る世界。：蒼華",
        "この夜の静寂が　俺にだけ牙を剥くなら　甘く微笑んでやるさ。：黒耀",
        "さぁ、契りを交わそうか　月と俺とで　夜を孕ませる契約を。：冥蓮",
        "「選ばれし存在」って　こういう顔だろ？　鏡、割れたけどな。：紅影",
        "闇に溶ける　その微笑みで　世界を焼いてみたいんだ。：蛇咲",
        "永劫の罪を　甘き蜜に変えて　飲み干せるのは　お前だけ。：夜詠",
        "月下の花は　血に濡れて微笑む　お前も濡らしてやろうか。：紫炎",
        "鏡の奥で　もう一人の俺が笑う　「殺せ」と囁きながら。：影月",
        "この身朽ち果てようとも　お前への想いだけは　永遠の炎となろう。：墜天",
        "運命って言葉が似合う男を　一度くらいは　抱いてみろよ。：焔牙",
        "あなたと対う　最後に。：赫影",
        "誰かに愛されたくて　ここまで来たわけじゃない　。：臥牙"
    ]
    df = pd.DataFrame(sample_captions)
    df.to_csv("captions.csv", index=False, header=False, encoding="utf-8")
    return "captions.csv"

# 関数の重複を解消 - ユーティリティ関数を1つにまとめる
def update_caption():
    """キャッチコピーを更新するためのフラグをセットする関数"""
    st.session_state.immediate_caption_change = True
    st.session_state.need_update_caption = True

def update_background():
    """背景画像を更新するためのフラグをセットする関数"""
    st.session_state.bg_change_requested = True
    st.session_state.immediate_caption_change = True  # キャプション更新も同時にトリガー

# app.pyの中で、main関数を以下のように置き換えてください
# 他の関数はそのまま使用できます

def main():
    """Streamlitアプリのメイン関数"""
    st.title("🧚VICE FAIRY風 画像ジェネレーター")
    st.write("画像をアップロードして、VICE FAIRY雑誌風キャッチコピーを追加しましょう！")
    
    # CSV読み込み
    captions = load_captions()
    if not captions:
        st.warning("キャッチコピーがロードできませんでした。CSVファイルを確認してください。")
        
        # サンプルのCSVファイルを表示
        st.info("以下の形式でcaptions.csvファイルを作成してください：")
        st.code("""蒼き小花が　舞う刹那の　夜空の大花のみぞ知る世界。：蒼華
この夜の静寂が　俺にだけ牙を剥くなら　甘く微笑んでやるさ。：黒耀
さぁ、契りを交わそうか　月と俺とで　夜を孕ませる契約を。：冥蓮
...
""")
        
        # サンプルファイル作成ボタン
        if st.button("サンプルCSVファイルを作成", key="main_create_sample"):
            filename = save_sample_csv()
            st.success(f"{filename} を作成しました！アプリを再読み込みしてください。")
        
        return
    
    # キャッチコピー数の表示
    # st.info(f"読み込まれたキャッチコピー: {len(captions)}個")
    
    # テンプレート画像をロード
    template_data = load_template_image()
    if template_data is None:
        st.warning("app.pyと同じフォルダにtemplate.pngを配置するか、アップロードしてください。")
        return
    
    # 状態管理のためのカウンター
    if 'update_counter' not in st.session_state:
        st.session_state.update_counter = 0
    
    # 処理済み画像の表示（処理済みの場合）
    if st.session_state.processed_image is not None:

        # カスタム名前入力欄の後に以下を追加
        if st.session_state.use_custom_name:
            # custom_name = st.text_input("カスタム名前", 
            #                         value=st.session_state.custom_artist_name,
            #                         key=f"custom_name_{st.session_state.update_counter}")
            st.session_state.custom_artist_name = custom_name

        # タイトル入力機能も追加
        st.subheader("テキストカスタマイズ")
        col1, col2 = st.columns(2)

        with col1:
            custom_title = st.text_input(
                "雑誌タイトル", 
                value=st.session_state.custom_magazine_title if st.session_state.custom_magazine_title != "C O D E  L E A R N" else "",
                placeholder="C O D E  L E A R N",
                key=f"magazine_title_{st.session_state.update_counter}"
            )
            if custom_title:
                st.session_state.custom_magazine_title = custom_title
            else:
                st.session_state.custom_magazine_title = "C O D E  L E A R N"

        with col2:
            subtitle = st.text_input(
                "サブタイトルや名前", 
                value=st.session_state.custom_name or "",
                placeholder="サブタイトル名や名前が表示されます",
                key=f"subtitle_{st.session_state.update_counter}"
            )
            st.session_state.custom_name = subtitle if subtitle else None

        st.subheader("現在の画像")
        
        # 背景画像変更処理
        if st.session_state.bg_change_requested:
            new_bg_data, new_bg_filename = get_random_local_background("backgrounds", st.session_state.selected_bg_filename)
            if new_bg_data and new_bg_filename:
                st.success(f"新しい背景画像を選択しました: {os.path.basename(new_bg_filename)}")
                st.session_state.selected_bg_data = new_bg_data
                st.session_state.selected_bg_filename = new_bg_filename
            st.session_state.bg_change_requested = False
        
        # キャッチコピーは常に新しく選択 - update_counterが変わるたびに
        st.write(f"更新回数: {st.session_state.update_counter} (デバッグ情報)")
        caption_lines, csv_artist_name = select_random_caption(captions, st.session_state.last_caption)
        
        # カスタム名前の設定
        if st.session_state.use_custom_name and st.session_state.custom_artist_name:
            artist_name = st.session_state.custom_artist_name
        else:
            artist_name = csv_artist_name
        
        # 画像生成
        with st.spinner("画像を更新中..."):
            final_image = create_magazine_layout(
                st.session_state.processed_image,
                caption_lines,
                artist_name,
                template_data,
                st.session_state.issue_number,
                st.session_state.quality,
                st.session_state.selected_bg_data,
                st.session_state.custom_magazine_title,
                st.session_state.custom_name
            )
        
        # 結果表示
        if final_image is not None:
            st.image(final_image, caption="VICE FAIRY風雑誌レイアウト", use_container_width=True)
            
            # ダウンロードリンク
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            filename = f"vicefairy_{timestamp}.jpg"
            st.markdown(get_image_download_link(final_image, filename, "画像をダウンロード"), unsafe_allow_html=True)
        else:
            st.error("画像作成に失敗しました。")
        
        # ボタン配置（操作用）- 重要なのはon_clickの使用とキーの一意性！
        col1, col2, col3 = st.columns([1, 1, 1])
        
        # キャプション更新用コールバック
        def update_caption():
            st.session_state.update_counter += 1
        
        # 背景更新用コールバック
        def update_background():
            st.session_state.bg_change_requested = True
            st.session_state.update_counter += 1
        
        with col1:
            st.button("キャッチコピーを変更", key=f"caption_btn_{st.session_state.update_counter}", on_click=update_caption)
        
        with col2:
            st.button("背景画像を変更", key=f"bg_btn_{st.session_state.update_counter}", on_click=update_background)
        
        # with col3:
        #     st.session_state.use_custom_name = st.checkbox("カスタム名前を使用", value=st.session_state.use_custom_name)
        
        # # カスタム名前入力
        # if st.session_state.use_custom_name:
        #     custom_name = st.text_input("カスタム名前", value=st.session_state.custom_artist_name)
        #     st.session_state.custom_artist_name = custom_name
        
        # 新規作成ボタン
        if st.button("新しい画像を作成", key=f"new_image_{st.session_state.update_counter}"):
            st.session_state.processed_image = None
            st.rerun()
        
        # 処理済み画像があるなら、この部分で終了
        return
    
    # ここからは初期画面（画像アップロード待ち）
    
    # 2カラムレイアウト
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("モデル画像")
        uploaded_file = st.file_uploader("人物画像をアップロードしてください", 
                                type=["jpg", "jpeg", "png", "heic", "heif"], 
                                key="model_image")
    
    with col2:
        # 背景設定
        st.subheader("背景設定")
        bg_option = st.radio(
            "背景設定",
            ["ダークグレー背景", "ランダム背景画像", "画像をアップロード"],
            index=1 if st.session_state.bg_option == "ランダム背景画像" else 0
        )
        st.session_state.bg_option = bg_option
        
        # 背景画像の選択を固定する
        if bg_option == "ランダム背景画像":
            # 初回またはボタンが押された場合のみ新しい背景を選択
            if st.session_state.selected_bg_data is None or st.session_state.bg_change_requested:
                bg_data, bg_filename = get_random_local_background()
                if bg_data and bg_filename:
                    st.session_state.selected_bg_data = bg_data
                    st.session_state.selected_bg_filename = bg_filename
                    st.success(f"選択された背景画像: {os.path.basename(bg_filename)}")
                    st.image(bg_data, caption="ランダム背景画像", width=200)
                    st.session_state.bg_change_requested = False
                else:
                    st.warning("背景画像が見つかりません。ダークグレー背景を使用します。")
                    st.session_state.selected_bg_data = None
                    st.session_state.selected_bg_filename = None
            else:
                # 既に選択された背景画像を表示
                st.success(f"選択された背景画像: {os.path.basename(st.session_state.selected_bg_filename)}")
                st.image(st.session_state.selected_bg_data, caption="ランダム背景画像", width=200)
                
                # 背景変更ボタン
                if st.button("別の背景画像を選択"):
                    st.session_state.bg_change_requested = True
                    st.rerun()
        
        elif bg_option == "画像をアップロード":
            # 背景画像のアップロード
            bg_file = st.file_uploader("背景画像をアップロードしてください", type=["jpg", "jpeg", "png"])
            if bg_file is not None:
                bg_data = bg_file.getvalue()
                st.session_state.selected_bg_data = bg_data
                st.session_state.selected_bg_filename = bg_file.name
                st.image(bg_data, caption="アップロードされた背景画像", width=200)
            else:
                st.session_state.selected_bg_data = None
                st.session_state.selected_bg_filename = None
        else:
            # ダークグレー背景の場合はNoneに設定
            st.session_state.selected_bg_data = None
            st.session_state.selected_bg_filename = None
    
    # オプション設定
    st.subheader("デザイン設定")
    col1, col2 = st.columns(2)

    with col1:
        # 号数の入力（セッションから取得）
        issue_number = st.number_input(
            "号数", 
            min_value=1, 
            max_value=99, 
            value=st.session_state.issue_number, 
            step=1,
            key="issue_num_input"
        )
        # セッションに保存
        st.session_state.issue_number = issue_number

    with col2:
        # 品質設定
        quality_options = {
            "high": "高品質 (PDF用 - 処理に時間がかかります)",
            "medium": "中品質 (SNS投稿用)",
            "low": "低品質 (プレビュー用 - 高速)"
        }
        quality = st.selectbox(
            "出力品質",
            options=list(quality_options.keys()),
            format_func=lambda x: quality_options[x],
            index=list(quality_options.keys()).index(st.session_state.quality)
        )
        st.session_state.quality = quality

    # タイトルと名前のカスタマイズセクションを追加
    st.subheader("テキストカスタマイズ（オプション）")
    custom_title_col, custom_name_col = st.columns(2)

    with custom_title_col:
        custom_magazine_title = st.text_input(
            "雑誌タイトル（空白の場合はデフォルト）", 
            value=st.session_state.custom_magazine_title if st.session_state.custom_magazine_title != "C O D E  L E A R N" else "",
            placeholder="C O D E  L E A R N"
        )
        # 入力がある場合は保存、なければデフォルト値を使用
        if custom_magazine_title:
            st.session_state.custom_magazine_title = custom_magazine_title
        else:
            st.session_state.custom_magazine_title = "C O D E  L E A R N"

    with custom_name_col:
        custom_name = st.text_input(
            "サブタイトルや名前", 
            value=st.session_state.custom_name or "",
            placeholder="名前が表示されます"
        )
        # 入力がある場合は保存
        st.session_state.custom_name = custom_name if custom_name else None
    
    # 画像処理ボタン
    if uploaded_file is not None:
        # 画像の検証
        valid, error_msg = validate_image(uploaded_file)
        if not valid:
            st.error(error_msg)
            return
        
        # 元の画像を表示
        image_data = uploaded_file.getvalue()
        
        # モデル画像のプレビュー
        with st.expander("アップロードされた画像のプレビュー", expanded=False):
            st.image(image_data, caption="アップロードされた画像", use_container_width=True)
        
        # 処理実行
        def process_image_callback():
            # updateカウンターをリセット
            st.session_state.update_counter = 0
        
        if st.button("作成！", type="primary", on_click=process_image_callback):
            with st.spinner("処理中..."):
                # 背景除去
                no_bg_image = remove_background(image_data)
                
                if no_bg_image is not None:
                    st.session_state.processed_image = no_bg_image
                    
                    # キャッチコピー選択
                    caption_lines, artist_name = select_random_caption(captions)
                    st.session_state.last_artist_name = artist_name
                    
                    # 雑誌風レイアウト画像を作成
                    final_image = create_magazine_layout(
                        no_bg_image, 
                        caption_lines, 
                        artist_name, 
                        template_data,
                        st.session_state.issue_number, 
                        st.session_state.quality, 
                        st.session_state.selected_bg_data,
                        st.session_state.custom_magazine_title,
                        st.session_state.custom_name
                    )
                    
                    if final_image is not None:
                        # 結果表示
                        st.subheader("処理結果")
                        st.image(final_image, caption="レイアウト", use_container_width=True)
                        
                        # ダウンロードリンク
                        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
                        filename = f"vicefairy_{timestamp}.jpg"
                        st.markdown(get_image_download_link(final_image, filename, "画像をダウンロード"), unsafe_allow_html=True)
                        
                        # 操作ボタン
                        col1, col2 = st.columns([1, 1])
                        
                        with col1:
                            st.button("キャッチコピーを変更", key="first_caption_change", on_click=lambda: st.session_state.update_counter + 1)
                            st.rerun()  # 重要：一度リロードして状態を更新
                        
                        with col2:
                            st.button("背景画像を変更", key="first_bg_change", on_click=update_background)
                            st.rerun()  # 重要：一度リロードして状態を更新
                    else:
                        st.error("雑誌風レイアウトの作成に失敗しました。")
                else:
                    st.error("背景除去に失敗しました。")
    else:
        st.warning("モデル画像をアップロードしてください。")



if __name__ == "__main__":
    main()