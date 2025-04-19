/**
 * ステージデータの定義
 * 各ステージの設定、オブジェクト、ヒント、メッセージなどを管理
 */

// ステージ設定
const stageSettings = [
    {
        id: 1,
        name: "思い出のリビング",
        background: "assets/stage1_bg.png",
        maskImage: "assets/stage1_mask.png",
        errorObjects: [
            { id: 'clock', color: 'rgb(255, 0, 0)', image: 'assets/stage1_clock_wrong.png', hint: "時計の針が逆さまに動いています..." },
            { id: 'photo', color: 'rgb(0, 255, 0)', image: 'assets/stage1_photo_wrong.png', hint: "写真立ての家族の顔が消えています..." },
            { id: 'window', color: 'rgb(0, 0, 255)', image: 'assets/stage1_window_wrong.png', hint: "窓の外の空の色が現実とは違います..." }
        ],
        clearMessage: "不思議なリビングの記憶が修復されました",
        clearDescription: "おかしなところを全て見つけました！<br>美月の記憶の一部が正しく修復されました。",
        nextStageMessage: "次は「キャンディの部屋」を探索しましょう。<br>そこには美月の願望と夢が詰まっています。",
        clearImage: "assets/clear_stage1.png",
        correctMessages: {
            'clock': "時計の針が正しい向きになりました！",
            'photo': "写真立てが元に戻りました！",
            'window': "窓の外の空の色が正しくなりました！"
        }
    },
    {
        id: 2,
        name: "キャンディの部屋",
        background: "assets/stage2_bg.png",
        maskImage: "assets/stage2_mask.png",
        errorObjects: [
            { id: 'candy', color: 'rgb(255, 0, 0)', image: 'assets/stage2_candy_wrong.png', hint: "キャンディの色が現実にはあり得ない..." },
            { id: 'teddy', color: 'rgb(0, 255, 0)', image: 'assets/stage2_teddy_wrong.png', hint: "テディベアの目が動いているような..." },
            { id: 'mobile', color: 'rgb(0, 0, 255)', image: 'assets/stage2_mobile_wrong.png', hint: "天井のモビールが重力を無視して動いています..." }
        ],
        clearMessage: "キャンディの部屋の記憶が修復されました",
        clearDescription: "おかしなところを全て見つけました！<br>美月の願望と夢の記憶が正しくなりました。",
        nextStageMessage: "最後は「うそつき図書館」です。<br>そこには美月に取り憑く悪魔の姿が隠されています。",
        clearImage: "assets/clear_stage2.png",
        correctMessages: {
            'candy': "キャンディが元に戻りました！",
            'teddy': "テディベアが正常になりました！",
            'mobile': "天井のモビールが元に戻りました！"
        }
    },
    {
        id: 3,
        name: "うそつき図書館",
        background: "assets/stage3_bg.png",
        maskImage: "assets/stage3_mask.png",
        errorObjects: [
            { id: 'book', color: 'rgb(255, 0, 0)', image: 'assets/stage3_book_wrong.png', hint: "その本のページが逆さまに印刷されています..." },
            { id: 'lamp', color: 'rgb(0, 255, 0)', image: 'assets/stage3_lamp_wrong.png', hint: "ランプの光が上ではなく下に向かっています..." },
            { id: 'shadow', color: 'rgb(0, 0, 255)', image: 'assets/stage3_shadow_wrong.png', hint: "本棚の影が光と反対方向に伸びています..." }
        ],
        clearMessage: "すべての記憶が修復されました",
        clearDescription: "おめでとう！すべての「おかしなところ」を見つけました。<br>美月の記憶が完全に修復されました。",
        nextStageMessage: "彼女はもうすぐ目を覚まし、現実世界に戻ります。<br>あなたのおかげで、美月は新たな一歩を踏み出せるでしょう。",
        clearImage: "assets/clear_stage3.png",
        correctMessages: {
            'book': "本の目が消えました！",
            'lamp': "ランプが普通の光に戻っています！",
            'shadow': "妙な影が消えていきます！"
        }
    }
];