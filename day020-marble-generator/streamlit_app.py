import streamlit as st
from marble_generator import create_enhanced_marble, COLOR_PALETTES
import numpy as np
from PIL import Image, ImageEnhance
import io

# 鮮やかな色のパレットを追加
VIBRANT_COLORS = {
    "vibrant_blue": [
        (255, 255, 255),      # 白
        (240, 248, 255),      # アリスブルー
        (135, 206, 250),      # ライトスカイブルー
        (30, 144, 255),       # ドジャーブルー
        (0, 191, 255),        # ディープスカイブルー
        (0, 123, 255),        # 鮮やかな青
        (0, 0, 255),          # 純青
    ],
    "vibrant_teal": [
        (255, 255, 255),      # 白
        (224, 255, 255),      # ライトシアン
        (127, 255, 212),      # アクアマリン
        (64, 224, 208),       # ターコイズ
        (0, 255, 255),        # シアン
        (0, 206, 209),        # ダークターコイズ
        (0, 139, 139),        # ダークシアン
    ],
    "vibrant_pink": [
        (255, 255, 255),      # 白
        (255, 240, 245),      # ラベンダーブラッシュ
        (255, 192, 203),      # ピンク
        (255, 105, 180),      # ホットピンク
        (255, 20, 147),       # ディープピンク
        (219, 112, 147),      # ペールバイオレットレッド
        (199, 21, 133),       # メディアムバイオレットレッド
    ],
    "rainbow": [
        (255, 255, 255),      # 白
        (255, 0, 0),          # 赤
        (255, 165, 0),        # オレンジ
        (255, 255, 0),        # 黄
        (0, 255, 0),          # 緑
        (0, 0, 255),          # 青
        (75, 0, 130),         # インディゴ
        (238, 130, 238),      # バイオレット
    ],
}

# 既存のパレットに追加
all_palettes = {**COLOR_PALETTES, **VIBRANT_COLORS}

# セッション状態の初期化
if 'recent_colors' not in st.session_state:
    st.session_state.recent_colors = []

if 'last_preset' not in st.session_state:
    st.session_state.last_preset = "カスタム設定"

st.title("マーブル模様ジェネレーター")
st.write("あなただけのマーブル模様を作りましょう！色や渦を自由に設定してみましょう。")

# サイドバーに設定項目を配置
st.sidebar.title("設定")

# かんたん設定セクション
st.sidebar.header("かんたん設定")
preset = st.sidebar.selectbox(
    "おまかせプリセット", 
    ["カスタム設定", "ふんわり淡い", "クッキリはっきり", "渦まき強め", "虹色マーブル", "キラキラブルー"]
)

# プリセットに基づいて値を設定
if preset != "カスタム設定":
    st.session_state.last_preset = preset
    
    if preset == "ふんわり淡い":
        palette_name = "blue_white"
        width, height = 400, 300
        iterations = 60
        speed = 0.5
        diffusion_rate = 0.2
        viscosity = 0.5
        vortex_count = 10
        vortex_strength = 0.6
        saturation = 1.2
        contrast = 1.1
        
    elif preset == "クッキリはっきり":
        palette_name = "vibrant_teal"
        width, height = 500, 400
        iterations = 80
        speed = 1.0
        diffusion_rate = 0.08
        viscosity = 0.3
        vortex_count = 25
        vortex_strength = 1.2
        saturation = 1.8
        contrast = 1.4
        
    elif preset == "渦まき強め":
        palette_name = "vibrant_blue"
        width, height = 500, 400
        iterations = 100
        speed = 1.2
        diffusion_rate = 0.1
        viscosity = 0.3
        vortex_count = 35
        vortex_strength = 1.5
        saturation = 1.7
        contrast = 1.3
        
    elif preset == "虹色マーブル":
        palette_name = "rainbow"
        width, height = 500, 400
        iterations = 90
        speed = 0.9
        diffusion_rate = 0.12
        viscosity = 0.4
        vortex_count = 20
        vortex_strength = 1.0
        saturation = 2.0
        contrast = 1.5
        
    elif preset == "キラキラブルー":
        palette_name = "vibrant_blue"
        width, height = 500, 400
        iterations = 70
        speed = 0.7
        diffusion_rate = 0.1
        viscosity = 0.25
        vortex_count = 15
        vortex_strength = 0.8
        saturation = 2.0
        contrast = 1.6
    
    # プリセット選択時はパラメータを非表示またはexpanderに
    show_params = st.sidebar.checkbox("詳細設定を表示", False)
    
else:
    # カスタム設定の場合は全て表示
    show_params = True
    
    # 前回のプリセットの値を初期値として使用
    if st.session_state.last_preset == "ふんわり淡い":
        palette_name = "blue_white"
        width, height = 400, 300
        iterations = 60
        speed = 0.5
        diffusion_rate = 0.2
        viscosity = 0.5
        vortex_count = 10
        vortex_strength = 0.6
        saturation = 1.2
        contrast = 1.1
    elif st.session_state.last_preset == "クッキリはっきり":
        palette_name = "vibrant_teal"
        width, height = 500, 400
        iterations = 80
        speed = 1.0
        diffusion_rate = 0.08
        viscosity = 0.3
        vortex_count = 25
        vortex_strength = 1.2
        saturation = 1.8
        contrast = 1.4
    elif st.session_state.last_preset == "渦まき強め":
        palette_name = "vibrant_blue"
        width, height = 500, 400
        iterations = 100
        speed = 1.2
        diffusion_rate = 0.1
        viscosity = 0.3
        vortex_count = 35
        vortex_strength = 1.5
        saturation = 1.7
        contrast = 1.3
    elif st.session_state.last_preset == "虹色マーブル":
        palette_name = "rainbow"
        width, height = 500, 400
        iterations = 90
        speed = 0.9
        diffusion_rate = 0.12
        viscosity = 0.4
        vortex_count = 20
        vortex_strength = 1.0
        saturation = 2.0
        contrast = 1.5
    elif st.session_state.last_preset == "キラキラブルー":
        palette_name = "vibrant_blue"
        width, height = 500, 400
        iterations = 70
        speed = 0.7
        diffusion_rate = 0.1
        viscosity = 0.25
        vortex_count = 15
        vortex_strength = 0.8
        saturation = 2.0
        contrast = 1.6
    else:
        # デフォルト値
        palette_name = "blue_green"
        width, height = 400, 300
        iterations = 60
        speed = 0.8
        diffusion_rate = 0.12
        viscosity = 0.35
        vortex_count = 20
        vortex_strength = 1.0
        saturation = 1.5
        contrast = 1.2

# パレット選択の視覚化
if show_params:
    st.sidebar.header("カラーパレット")
    
    # パレットごとにプレビューを表示
    palette_cols = st.sidebar.columns(2)
    palette_cols[0].markdown("パレット見本")
    palette_cols[1].markdown("パレット名")
    
    for name, colors in all_palettes.items():
        # プレビューを作成
        preview = "<div style='display:flex;'>"
        for color in colors[::max(1, len(colors)//4)]:  # 間引いて表示
            hex_color = f"#{color[0]:02x}{color[1]:02x}{color[2]:02x}"
            preview += f"<div style='background-color:{hex_color};width:15px;height:20px;'></div>"
        preview += "</div>"
        
        # 表示
        cols = st.sidebar.columns([1, 2])
        cols[0].markdown(preview, unsafe_allow_html=True)
        cols[1].write(name.replace("_", " ").title())
    
    # 実際の選択
    palette_name = st.sidebar.selectbox(
        "パレットを選択", 
        list(all_palettes.keys()),
        index=list(all_palettes.keys()).index(palette_name),
        format_func=lambda x: x.replace("_", " ").title()
    )

# 最近使った色の表示と選択
if 'recent_colors' in st.session_state and st.session_state.recent_colors:
    st.sidebar.markdown("### 最近使った色")
    color_cols = st.sidebar.columns(len(st.session_state.recent_colors))
    for i, col in enumerate(color_cols):
        color = st.session_state.recent_colors[i]
        # 色のプレビューを表示
        col.markdown(f"<div style='background-color:{color};width:30px;height:30px;border-radius:5px;'></div>", 
                   unsafe_allow_html=True)
        if col.button(f"選択", key=f"recent_color_{i}"):
            selected_color = color

# カスタムカラー追加
add_custom_color = False
custom_color = None
if show_params:
    add_custom_color = st.sidebar.checkbox("カスタムカラーを追加")
    if add_custom_color:
        custom_color = st.sidebar.color_picker("色を選択", "#00FFAA")
        if st.sidebar.button("この色を記憶"):
            if custom_color not in st.session_state.recent_colors:
                st.session_state.recent_colors.insert(0, custom_color)
                if len(st.session_state.recent_colors) > 3:
                    st.session_state.recent_colors.pop()

# 詳細設定
if show_params:
    # スマホ表示に適した折りたたみメニュー
    with st.sidebar.expander("画像サイズ", expanded=False):
        # +/- ボタンによる調整も追加
        st.write("幅")
        width_cols = st.columns([1, 3, 1])
        if width_cols[0].button("-", key="width_minus"):
            width = max(300, width - 50)
        width = width_cols[1].slider("", 300, 800, width, label_visibility="collapsed")
        if width_cols[2].button("+", key="width_plus"):
            width = min(800, width + 50)
            
        st.write("高さ")
        height_cols = st.columns([1, 3, 1])
        if height_cols[0].button("-", key="height_minus"):
            height = max(200, height - 50)
        height = height_cols[1].slider("", 200, 600, height, label_visibility="collapsed")
        if height_cols[2].button("+", key="height_plus"):
            height = min(600, height + 50)
    
    with st.sidebar.expander("基本設定", expanded=False):
        iterations = st.slider("反復回数", 30, 150, iterations)
        speed = st.slider("速度", 0.1, 2.0, speed)
        diffusion_rate = st.slider("拡散率", 0.01, 0.3, diffusion_rate)
        viscosity = st.slider("粘度", 0.1, 1.0, viscosity)
    
    with st.sidebar.expander("渦の設定", expanded=False):
        st.write("渦の数")
        vortex_count_cols = st.columns([1, 3, 1])
        if vortex_count_cols[0].button("-", key="vortex_count_minus"):
            vortex_count = max(5, vortex_count - 5)
        vortex_count = vortex_count_cols[1].slider("", 5, 40, vortex_count, label_visibility="collapsed")
        if vortex_count_cols[2].button("+", key="vortex_count_plus"):
            vortex_count = min(40, vortex_count + 5)
            
        st.write("渦の強さ")
        vortex_strength_cols = st.columns([1, 3, 1])
        if vortex_strength_cols[0].button("-", key="vortex_strength_minus"):
            vortex_strength = max(0.2, vortex_strength - 0.2)
        vortex_strength = vortex_strength_cols[1].slider("", 0.2, 2.0, vortex_strength, label_visibility="collapsed")
        if vortex_strength_cols[2].button("+", key="vortex_strength_plus"):
            vortex_strength = min(2.0, vortex_strength + 0.2)
    
    with st.sidebar.expander("色彩設定", expanded=False):
        enhance_colors = st.checkbox("色彩を強化する", True)
        if enhance_colors:
            saturation = st.slider("彩度", 1.0, 3.0, saturation)
            contrast = st.slider("コントラスト", 1.0, 2.0, contrast)
        else:
            saturation = 1.0
            contrast = 1.0
    
    with st.sidebar.expander("シード設定", expanded=False):
        use_random_seed = st.checkbox("ランダムシード", True)
        seed = None
        if not use_random_seed:
            seed = st.number_input("シード値", 0, 10000, 42)
else:
    # プリセットモードではデフォルト値を使用
    enhance_colors = True
    use_random_seed = True
    seed = None

# カラーパレットを取得
colors = all_palettes[palette_name].copy()

# カスタムカラーを追加
if add_custom_color and custom_color:
    # #RRGGBB 形式から(R,G,B)タプルに変換
    r = int(custom_color[1:3], 16)
    g = int(custom_color[3:5], 16)
    b = int(custom_color[5:7], 16)
    colors.append((r, g, b))

# 簡易プレビュー（オプション）
preview_on = st.sidebar.checkbox("簡易プレビュー (低解像度)", False)
if preview_on:
    if st.sidebar.button("プレビュー更新"):
        with st.sidebar:
            with st.spinner("プレビュー生成中..."):
                # 軽量版のプレビュー画像を生成
                preview_image = create_enhanced_marble(
                    width=width//4,  # サイズを大幅に縮小
                    height=height//4,
                    iterations=max(30, iterations//2),  # 反復回数も減らす
                    speed=speed,
                    diffusion_rate=diffusion_rate,
                    viscosity=viscosity,
                    seed=seed,
                    colors=colors,
                    vortex_count=vortex_count,
                    vortex_strength=vortex_strength
                )
                
                # 彩度とコントラストを強化
                if enhance_colors:
                    enhancer = ImageEnhance.Color(preview_image)
                    preview_image = enhancer.enhance(saturation)
                    enhancer = ImageEnhance.Contrast(preview_image)
                    preview_image = enhancer.enhance(contrast)
                
                # プレビューを表示
                st.image(preview_image, caption="プレビュー", use_container_width=True)

# メイン部分
st.markdown("## 🎨 あなただけのマーブル模様")

# 現在の設定を表示
st.write(f"**現在の設定**: {preset if preset != 'カスタム設定' else 'カスタム'} | "
         f"パレット: {palette_name.replace('_', ' ').title()} | "
         f"渦の数: {vortex_count}")

# 生成ボタン
generate_col1, generate_col2 = st.columns([3, 1])
if generate_col1.button("✨ マーブル模様を生成する ✨", use_container_width=True):
    with st.spinner("模様を生成中... 少々お待ちください"):
        # マーブル模様を生成
        marble_image = create_enhanced_marble(
            width=width,
            height=height,
            iterations=iterations,
            speed=speed,
            diffusion_rate=diffusion_rate,
            viscosity=viscosity,
            seed=seed,
            colors=colors,
            vortex_count=vortex_count,
            vortex_strength=vortex_strength
        )
        
        # 彩度とコントラストを強化
        if enhance_colors:
            # 彩度を上げる
            enhancer = ImageEnhance.Color(marble_image)
            marble_image = enhancer.enhance(saturation)
            
            # コントラストを上げる
            enhancer = ImageEnhance.Contrast(marble_image)
            marble_image = enhancer.enhance(contrast)
        
        # 画像を表示
        st.image(marble_image, caption="あなたのマーブル模様", use_container_width=True)
        
        # ダウンロードボタン
        buf = io.BytesIO()
        marble_image.save(buf, format="PNG")
        st.download_button(
            label="画像をダウンロード",
            data=buf.getvalue(),
            file_name=f"marble_{palette_name}_{vortex_count}.png",
            mime="image/png"
        )
else:
    # 初回表示時のガイダンス
    st.info("👆 上のボタンをクリックして、マーブル模様を生成してみましょう！")
    st.markdown("""
    **ヒント**:
    - 左側の「かんたん設定」から好みのプリセットを選ぶと簡単です
    - 色や渦の数などを自分好みに調整したい場合は「詳細設定」を開きましょう
    - お子さんと一緒にいろいろな色や設定を試して、素敵な模様を作ってみましょう！
    """)

# 使い方とヒント
with st.expander("✅ 使い方とヒント"):
    st.markdown("""
    ### 使い方
    1. サイドバーで「おまかせプリセット」を選ぶか、好みの設定を選びます
    2. 「マーブル模様を生成する」ボタンをクリックします
    3. 気に入った画像ができたら「ダウンロード」ボタンで保存できます
    
    ### 各設定の意味
    - **渦の数**: 多いほど複雑な模様になります
    - **渦の強さ**: 強いほど渦巻きがはっきりします
    - **粘度**: 高いほどスムーズな模様になります
    - **拡散率**: 低いほど色の境界がはっきりします
    - **彩度**: 色の鮮やかさを調整します
    - **コントラスト**: 明暗の差を調整します
    
    ### こんな時に試してみて
    - **ふんわり淡い雰囲気**が欲しい → 「ふんわり淡い」プリセット
    - **はっきりした模様**が欲しい → 「クッキリはっきり」プリセット
    - **渦巻きをたくさん**入れたい → 「渦まき強め」プリセット
    - **カラフルな虹色**にしたい → 「虹色マーブル」プリセット
    """)

# 5歳のお子さん向けの簡単な説明
with st.expander("👧 お子さんと一緒に"):
    st.markdown("""
    ## マーブルってなあに？
    
    マーブルは、**いろんな色がまざりあってできる、ふしぎな模様**のことだよ。
    
    水に絵の具を落としてかきまぜると、くるくる回ったりまざりあったりして、
    きれいな模様ができるんだ。このアプリでは、コンピュータが
    そんなふしぎな模様をつくってくれるよ！
    
    ### やってみよう！
    1. 左のメニューから「おまかせプリセット」を選んでね
    2. 「マーブル模様を生成する」ボタンをおしてみよう
    3. どんな模様ができるかな？
    
    **いろんな色を試してみよう！**
    """)