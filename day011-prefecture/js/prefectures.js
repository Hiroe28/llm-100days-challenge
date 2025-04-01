// 都道府県データ
const prefectures = [
    { code: "01", name: "北海道", hiragana: "ほっかいどう" },
    { code: "02", name: "青森県", hiragana: "あおもりけん" },
    { code: "03", name: "岩手県", hiragana: "いわてけん" },
    { code: "04", name: "宮城県", hiragana: "みやぎけん" },
    { code: "05", name: "秋田県", hiragana: "あきたけん" },
    { code: "06", name: "山形県", hiragana: "やまがたけん" },
    { code: "07", name: "福島県", hiragana: "ふくしまけん" },
    { code: "08", name: "茨城県", hiragana: "いばらきけん" },
    { code: "09", name: "栃木県", hiragana: "とちぎけん" },
    { code: "10", name: "群馬県", hiragana: "ぐんまけん" },
    { code: "11", name: "埼玉県", hiragana: "さいたまけん" },
    { code: "12", name: "千葉県", hiragana: "ちばけん" },
    { code: "13", name: "東京都", hiragana: "とうきょうと" },
    { code: "14", name: "神奈川県", hiragana: "かながわけん" },
    { code: "15", name: "新潟県", hiragana: "にいがたけん" },
    { code: "16", name: "富山県", hiragana: "とやまけん" },
    { code: "17", name: "石川県", hiragana: "いしかわけん" },
    { code: "18", name: "福井県", hiragana: "ふくいけん" },
    { code: "19", name: "山梨県", hiragana: "やまなしけん" },
    { code: "20", name: "長野県", hiragana: "ながのけん" },
    { code: "21", name: "岐阜県", hiragana: "ぎふけん" },
    { code: "22", name: "静岡県", hiragana: "しずおかけん" },
    { code: "23", name: "愛知県", hiragana: "あいちけん" },
    { code: "24", name: "三重県", hiragana: "みえけん" },
    { code: "25", name: "滋賀県", hiragana: "しがけん" },
    { code: "26", name: "京都府", hiragana: "きょうとふ" },
    { code: "27", name: "大阪府", hiragana: "おおさかふ" },
    { code: "28", name: "兵庫県", hiragana: "ひょうごけん" },
    { code: "29", name: "奈良県", hiragana: "ならけん" },
    { code: "30", name: "和歌山県", hiragana: "わかやまけん" },
    { code: "31", name: "鳥取県", hiragana: "とっとりけん" },
    { code: "32", name: "島根県", hiragana: "しまねけん" },
    { code: "33", name: "岡山県", hiragana: "おかやまけん" },
    { code: "34", name: "広島県", hiragana: "ひろしまけん" },
    { code: "35", name: "山口県", hiragana: "やまぐちけん" },
    { code: "36", name: "徳島県", hiragana: "とくしまけん" },
    { code: "37", name: "香川県", hiragana: "かがわけん" },
    { code: "38", name: "愛媛県", hiragana: "えひめけん" },
    { code: "39", name: "高知県", hiragana: "こうちけん" },
    { code: "40", name: "福岡県", hiragana: "ふくおかけん" },
    { code: "41", name: "佐賀県", hiragana: "さがけん" },
    { code: "42", name: "長崎県", hiragana: "ながさきけん" },
    { code: "43", name: "熊本県", hiragana: "くまもとけん" },
    { code: "44", name: "大分県", hiragana: "おおいたけん" },
    { code: "45", name: "宮崎県", hiragana: "みやざきけん" },
    { code: "46", name: "鹿児島県", hiragana: "かごしまけん" },
    { code: "47", name: "沖縄県", hiragana: "おきなわけん" }
];

// 地方ごとの都道府県コード
const regionPrefectures = {
    'all': prefectures.map(p => p.code), // 全国
    'hokkaido-tohoku': ['01', '02', '03', '04', '05', '06', '07'], // 北海道・東北
    'kanto': ['08', '09', '10', '11', '12', '13', '14'], // 関東
    'chubu': ['15', '16', '17', '18', '19', '20', '21', '22', '23'], // 中部
    'kinki': ['24', '25', '26', '27', '28', '29', '30'], // 近畿
    'chugoku': ['31', '32', '33', '34', '35'], // 中国
    'shikoku': ['36', '37', '38', '39'], // 四国
    'kyushu': ['40', '41', '42', '43', '44', '45', '46', '47'] // 九州・沖縄
};