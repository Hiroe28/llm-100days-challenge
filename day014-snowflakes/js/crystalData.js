/**
 * 雪の結晶データ処理
 * 結晶データの読み込み、保存、および関連機能を提供します
 */

// 結晶データ管理オブジェクト
const CrystalDataManager = {
    // 結晶データオブジェクト
    crystalData: null,
    
    // プリロードされた画像
    crystalImages: {},
    
    // 結晶生成履歴
    crystalHistory: [],
    
    // 結晶データを読み込む
    async loadCrystalData() {
        try {
            document.getElementById('loading-indicator').style.display = 'block';
            
            // 結晶データJSONを読み込む
            const response = await fetch(APP_CONFIG.api.crystalDataPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.crystalData = await response.json();
            
            // プリロードする結晶画像（温度と湿度の各組み合わせの代表的なもの）
            const preloadTemps = [-20, -15, -10, -5, 0];
            const preloadHumidities = [0, 25, 50, 75, 100];
            
            const totalToPreload = preloadTemps.length * preloadHumidities.length;
            let loaded = 0;
            
            for (const temp of preloadTemps) {
                for (const humidity of preloadHumidities) {
                    const key = `t${temp}_h${humidity}`;
                    if (this.crystalData.mappings[key]) {
                        const img = new Image();
                        img.onload = () => {
                            loaded++;
                            if (loaded === totalToPreload) {
                                document.getElementById('loading-indicator').style.display = 'none';
                            }
                        };
                        img.src = `snowflakes/${this.crystalData.mappings[key].file}`;
                        this.crystalImages[key] = img;
                    }
                }
            }
            
            return true;
        } catch (error) {
            console.error('結晶データの読み込みに失敗しました:', error);
            document.getElementById('loading-indicator').style.display = 'none';
            return false;
        }
    },
    
    // 必要な結晶画像を読み込む（必要時にのみ）
    async loadCrystalImage(temp, humidity) {
        return new Promise((resolve) => {
            const key = `t${temp}_h${humidity}`;
            
            // 既に読み込み済みならそれを返す
            if (this.crystalImages[key]) {
                resolve(this.crystalImages[key]);
                return;
            }
            
            // 結晶データが見つからない場合
            if (!this.crystalData || !this.crystalData.mappings[key]) {
                console.warn(`結晶データが見つかりません: ${key}`);
                resolve(null);
                return;
            }
            
            // 画像を読み込む
            const img = new Image();
            img.onload = () => {
                this.crystalImages[key] = img;
                resolve(img);
            };
            img.onerror = () => {
                console.error(`画像の読み込みに失敗しました: ${key}`);
                resolve(null);
            };
            img.src = `snowflakes/${this.crystalData.mappings[key].file}`;
        });
    },
    
    // 結晶タイプを取得
    getCrystalType(temp, humidity) {
        if (!this.crystalData) return null;
        
        const key = `t${temp}_h${humidity}`;
        if (this.crystalData.mappings[key]) {
            return this.crystalData.mappings[key].type;
        }
        return null;
    },
    
    // 結晶タイプ情報を取得
    getCrystalTypeInfo(crystalType) {
        if (!this.crystalData || !this.crystalData.types[crystalType]) {
            return null;
        }
        return this.crystalData.types[crystalType];
    },
    
    // 結晶タイプに基づいた画像ファイル名を取得
    getCrystalImageByType(crystalType) {
        // タイプに合わせた代表的な温度と湿度の組み合わせから画像を選択
        const typeTempHumidity = {
            'NEEDLE_THIN': {temp: -4, humidity: 75},
            'NEEDLE_THICK': {temp: -6, humidity: 90},
            'COLUMN_SIMPLE': {temp: -9, humidity: 20},
            'COLUMN_CAPPED': {temp: -7, humidity: 55},
            'PLATE_SIMPLE': {temp: -14, humidity: 20},
            'PLATE_SECTOR': {temp: -10, humidity: 55},
            'STELLAR_SIMPLE': {temp: -14, humidity: 75},
            'STELLAR_DENDRITE': {temp: -10, humidity: 90},
            'DENDRITE_NORMAL': {temp: -18, humidity: 75},
            'DENDRITE_COMPLEX': {temp: -16, humidity: 90},
            'FERNLIKE_SIMPLE': {temp: -18, humidity: 20},
            'FERNLIKE_COMPLEX': {temp: -16, humidity: 55},
            'TRIANGULAR': {temp: -2, humidity: 60},
            'SPLIT': {temp: -17, humidity: 95},
            'ASYMMETRIC': {temp: -3, humidity: 40},
            'TWELVE_BRANCHED': {temp: -16, humidity: 70}
        };
        
        if (!crystalType || !typeTempHumidity[crystalType] || !this.crystalData) {
            return '';
        }
        
        const {temp, humidity} = typeTempHumidity[crystalType];
        const key = `t${temp}_h${humidity}`;
        
        if (this.crystalData.mappings[key]) {
            return this.crystalData.mappings[key].file;
        }
        
        return '';
    },
    
    // 結晶タイプに基づいた科学的な豆知識を返す
    getCrystalFactByType(crystalType) {
        const facts = {
            'NEEDLE_THIN': '細い針状の結晶は、空気中の水分が少なく気温がマイナス3〜5度くらいのときにできやすいよ。飛行機から見ると、この結晶でできた雲は白くきらきら輝いて見えることがあるんだ。',
            'NEEDLE_THICK': '太い針状の結晶はとても面白い形をしているね。実は、最初は六角形の板から成長して、気温が変わると針状に伸びていくんだよ。自然の中の変化の証拠なんだ。',
            'COLUMN_SIMPLE': '柱状の結晶は氷菓子のような形をしているね。この形は水分子が六角形の柱状に積み重なってできるんだ。実は雪の結晶は全て六角形を基本にしているんだよ。',
            'COLUMN_CAPPED': '冠のついた柱状結晶は、空を落ちる間に違う温度の層を通過するとできることがあるよ。上空では平たい結晶で、下降中に柱状に成長することもあるんだ。',
            'PLATE_SIMPLE': 'シンプルな六角形の板状結晶は、冬の窓ガラスによくつくよね。これは水の分子が氷になるときに、特殊な角度（およそ120度）で結合するからなんだ。',
            'PLATE_SECTOR': '扇状の模様がある板状結晶はとても美しいね。これは結晶の端の部分が速く成長するためにできる模様なんだ。結晶の成長速度は場所によって違うんだよ。',
            'STELLAR_SIMPLE': '単純な星形の結晶は、みんなが「雪」をイメージするときの基本形だね。雪の結晶は水蒸気が氷に直接変わる「昇華」という現象でできるんだよ。',
            'STELLAR_DENDRITE': '星樹枝状の結晶は、木の枝のように複雑に分かれるよ。実は、この形は結晶が成長するときの不安定さから生まれるんだ。自然の中のパターン形成の一例なんだよ。',
            'DENDRITE_NORMAL': '通常の樹枝状結晶は、大気中のわずかな変化でも形が変わるよ。そのため、「同じ形の雪の結晶は二つとない」と言われているんだ。',
            'DENDRITE_COMPLEX': '複雑な樹枝状結晶は、結晶学者のウィルソン・ベントレーが初めて写真に撮ったことで有名になったよ。彼は5000以上の雪の結晶を撮影したんだ！',
            'FERNLIKE_SIMPLE': '羊歯（シダ）のような結晶は、水分子がある特定のパターンで集まるときにできるよ。氷の分子の並び方で、こんなに複雑な形ができるなんて不思議だね。',
            'FERNLIKE_COMPLEX': '複雑な羊歯状結晶は、本物の植物の葉っぱにそっくりだね。このような形が自然界のさまざまな場所で見られるのは、数学的な原理が関係しているんだよ。',
            'TRIANGULAR': '三角形の要素を持つ結晶はとても珍しいよ。通常の六角形の成長が何らかの理由で妨げられたときにできることがあるんだ。自然の中の「例外」とも言えるね。',
            'SPLIT': '分裂した六花の結晶は、成長途中で環境が急に変わったときにできることが多いよ。空から降りてくる間に風や温度の変化を受けると、こんな風に複雑な形になるんだ。',
            'ASYMMETRIC': '非対称な結晶は、気流の乱れや水蒸気の偏りによってできるよ。完璧な六角形にならない理由は、成長環境が均一ではないからなんだ。',
            'TWELVE_BRANCHED': '12本の枝を持つ結晶は、2つの結晶が成長過程で合体したものだよ。2つの六角形が重なり合って、とても珍しい形になるんだ。'
        };
        
        return facts[crystalType] || '雪の結晶は水分子が規則正しく並んでできています。気温や湿度によって様々な形になるんですよ。';
    },
    
    // 結晶タイプに基づいた楽しいアクティビティの提案を返す
    getCrystalActivityByType(crystalType) {
        const activities = {
            'NEEDLE_THIN': '折り紙で細長い針のような形を作って、部屋に飾ってみよう！何本か束ねて立体的な雪の結晶を作ることもできるよ。',
            'NEEDLE_THICK': '白い紙に青色の水彩絵の具で針状の結晶を描いてみよう。水の量を変えると、色の濃さが変わって面白いよ。',
            'COLUMN_SIMPLE': 'ストローを短く切って組み合わせると、柱状の結晶の模型が作れるよ。透明なストローを使うとキラキラして素敵だね。',
            'COLUMN_CAPPED': '粘土で柱状の結晶を作り、端に薄い円盤をつけて冠状にしてみよう。乾いたら銀色に塗るとキレイだよ！',
            'PLATE_SIMPLE': '丸い紙を6回折りたたんで、端をハサミで切ると六角形の板状結晶ができるよ。開いたときの模様の変化を楽しもう！',
            'PLATE_SECTOR': '白い紙を六角形に切って、扇形の模様を描いてみよう。たくさん作って窓に貼ると、雪景色のようになるよ。',
            'STELLAR_SIMPLE': '割りばしやつまようじを組み合わせて、星型の結晶の形を作ってみよう。糸をつければ、クリスマスの飾りにもなるよ。',
            'STELLAR_DENDRITE': '白い画用紙を折りたたんで切り抜くと、星形の雪の結晶ができるよ。細かく切るほど樹枝状の複雑な模様になるんだ。',
            'DENDRITE_NORMAL': '木の枝のような形の雪の結晶をクレヨンで描いて、その上から青色の水彩絵の具を塗ってみよう。ろうそくの模様のような効果が出るよ。',
            'DENDRITE_COMPLEX': '塩水を紙に塗って乾かすと、複雑な結晶模様ができるよ。本物の結晶と比べてみると、似ているところが見つかるかな？',
            'FERNLIKE_SIMPLE': '羊歯（シダ）の葉っぱと雪の結晶の形を比べてみよう。自然の中のいろんな場所で見られる似たパターンを探してみるのも面白いよ。',
            'FERNLIKE_COMPLEX': 'コンピュータで「フラクタル」という図形を描くプログラムを試してみよう。雪の結晶と同じように、繰り返しパターンでできた複雑な形が見られるよ。',
            'TRIANGULAR': '三角形の形をいくつか組み合わせて、珍しい形の雪の結晶を作ってみよう。自分だけのオリジナル結晶を考えるのも楽しいね。',
            'SPLIT': '紙を折りたたんで切るとき、端の部分を分岐するように切ってみよう。開くと分裂した枝を持つ特殊な結晶の形になるよ。',
            'ASYMMETRIC': '普通の雪の結晶は左右対称だけど、あえて非対称な結晶を描いてみよう。なぜ自然界にはめったに存在しないか考えてみるのも面白いよ。',
            'TWELVE_BRANCHED': '二つの雪の結晶の切り絵を少しずらして重ねてみよう。12本の枝を持つような複雑な模様ができるよ。光に当てると素敵なシルエットになるんだ。'
        };
        
        return activities[crystalType] || '白い紙を折りたたんでハサミで切ると、素敵な雪の結晶の切り絵ができます。いろんな切り方を試してみてください！';
    },
    
    // 結晶を履歴に追加
    addCrystalToHistory(temp, humidity) {
        // 既に同じ条件がある場合はスキップ
        const exists = this.crystalHistory.some(item => item.temp === temp && item.humidity === humidity);
        if (exists) return;
        
        // 履歴に追加（最大5件）
        this.crystalHistory.unshift({temp, humidity});
        if (this.crystalHistory.length > 5) {
            this.crystalHistory.pop();
        }
        
        // 履歴表示を更新するイベントを発火（UIモジュールで処理）
        const event = new CustomEvent('historyUpdated');
        document.dispatchEvent(event);
    }
};