/**
 * UI関連処理
 * インターフェースのイベント処理とUIの更新を行います
 */

const UIManager = {
    // UI要素
    temperatureSlider: null,
    humiditySlider: null,
    tempValueEl: null,
    humidityValueEl: null,
    generateBtn: null,
    crystalTypeLabel: null,
    crystalDescription: null,
    previewImage: null,
    
    // 初期化
    init() {
        // DOM要素の取得
        this.temperatureSlider = document.getElementById('temperature');
        this.humiditySlider = document.getElementById('humidity');
        this.tempValueEl = document.getElementById('temp-value');
        this.humidityValueEl = document.getElementById('humidity-value');
        this.generateBtn = document.getElementById('generate-btn');
        this.crystalTypeLabel = document.getElementById('crystal-type-label');
        this.crystalDescription = document.getElementById('crystal-description');
        this.previewImage = document.getElementById('preview-image');
        
        // イベントリスナーの設定
        this.setupEventListeners();
        
        // 初期値を設定
        this.temperatureSlider.value = APP_CONFIG.defaults.temperature;
        this.humiditySlider.value = APP_CONFIG.defaults.humidity;
        
        // 表示を更新
        this.updateTempValue();
        this.updateHumidityValue();
        
        // 拡張UI機能の初期化
        this.initExtendedUI();
    },
    
    // イベントリスナーの設定
    setupEventListeners() {
        // 温度・湿度スライダーの変更イベント
        this.temperatureSlider.addEventListener('input', () => {
            this.updateTempValue();
            this.updatePreview();
        });
        
        this.humiditySlider.addEventListener('input', () => {
            this.updateHumidityValue();
            this.updatePreview();
        });
        
        // 結晶生成ボタンのクリックイベント
        this.generateBtn.addEventListener('click', () => {
            this.generateSnowflakes();
            this.createSparkleEffect();
        });
        
        // 雪の結晶生成イベントをリッスン
        document.addEventListener('snowflakesGenerated', (e) => {
            // 履歴に追加
            CrystalDataManager.addCrystalToHistory(e.detail.temp, e.detail.humidity);
        });
        
        // 履歴更新イベントをリッスン
        document.addEventListener('historyUpdated', () => {
            this.updateHistoryDisplay();
        });
    },
    
    // 温度表示の更新
    updateTempValue() {
        this.tempValueEl.textContent = `${this.temperatureSlider.value}°C`;
        this.updateCrystalType();
    },
    
    // 湿度表示の更新
    updateHumidityValue() {
        this.humidityValueEl.textContent = `${this.humiditySlider.value}%`;
        this.updateCrystalType();
    },
    
    // 結晶タイプ表示の更新
    updateCrystalType() {
        if (!CrystalDataManager.crystalData) return;
        
        const temp = parseInt(this.temperatureSlider.value);
        const humidity = parseInt(this.humiditySlider.value);
        
        // 最も近いマッピングを探す
        const key = `t${temp}_h${humidity}`;
        if (CrystalDataManager.crystalData.mappings[key]) {
            const type = CrystalDataManager.crystalData.mappings[key].type;
            
            if (CrystalDataManager.crystalData.types[type]) {
                this.crystalTypeLabel.textContent = CrystalDataManager.crystalData.types[type].name;
                this.crystalDescription.textContent = CrystalDataManager.crystalData.types[type].description;
            }
        }
    },
    
    // プレビュー画像の更新
    async updatePreview() {
        // 温度と湿度を取得
        const tempValue = parseInt(this.temperatureSlider.value);
        const humidityValue = parseInt(this.humiditySlider.value);
        
        // プレビュー用の画像を読み込む
        const previewImg = await CrystalDataManager.loadCrystalImage(tempValue, humidityValue);
        
        if (previewImg) {
            this.previewImage.src = previewImg.src;
        }
    },
    
    // 雪の結晶生成
    generateSnowflakes() {
        const tempValue = parseInt(this.temperatureSlider.value);
        const humidityValue = parseInt(this.humiditySlider.value);
        
        // アニメーションモジュールに処理を委譲
        SnowflakeAnimation.generateSnowflakes(tempValue, humidityValue);
    },
    
    // ボタンクリック時のキラキラエフェクト
    createSparkleEffect() {
        const buttonRect = this.generateBtn.getBoundingClientRect();
        const sparkleCount = 20;
        
        // 既存のスパークルをクリア
        document.querySelectorAll('.sparkle').forEach(s => s.remove());
        
        for (let i = 0; i < sparkleCount; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            
            // ボタンの位置からランダムな位置を計算
            const x = buttonRect.left + Math.random() * buttonRect.width;
            const y = buttonRect.top + Math.random() * buttonRect.height;
            
            // スタイルを設定
            sparkle.style.left = `${x}px`;
            sparkle.style.top = `${y}px`;
            sparkle.style.width = `${Math.random() * 4 + 2}px`;
            sparkle.style.height = sparkle.style.width;
            sparkle.style.backgroundColor = `hsl(${Math.random() * 60 + 200}, 100%, 80%)`;
            
            // アニメーション遅延をランダムに設定
            sparkle.style.animationDelay = `${Math.random() * 0.5}s`;
            
            // 体にスパークルを追加
            document.body.appendChild(sparkle);
            
            // アニメーション終了後に要素を削除
            setTimeout(() => {
                sparkle.remove();
            }, 2000);
        }
    },
    
    // 結晶に関する詳細情報を表示するモーダル
    showCrystalInfo(crystalType) {
        // モーダルが既に存在する場合は削除
        const existingModal = document.querySelector('.crystal-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // モーダルコンテナを作成
        const modal = document.createElement('div');
        modal.className = 'crystal-modal';
        
        // 結晶タイプの情報を取得
        const typeInfo = CrystalDataManager.crystalData.types[crystalType];
        
        // モーダルの内容を作成
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-button">&times;</span>
                <h2>${typeInfo.name}について</h2>
                <div class="modal-crystal-container">
                    <img src="snowflakes/${CrystalDataManager.getCrystalImageByType(crystalType)}" alt="${typeInfo.name}" class="modal-crystal-image">
                </div>
                <p class="modal-description">${typeInfo.description}</p>
                <div class="science-fact">
                    <h3>科学豆知識</h3>
                    <p>${CrystalDataManager.getCrystalFactByType(crystalType)}</p>
                </div>
                <div class="fun-activity">
                    <h3>やってみよう！</h3>
                    <p>${CrystalDataManager.getCrystalActivityByType(crystalType)}</p>
                </div>
            </div>
        `;
        
        // モーダルを本体に追加
        document.body.appendChild(modal);
        
        // 閉じるボタンの動作を設定
        const closeButton = modal.querySelector('.close-button');
        closeButton.addEventListener('click', () => {
            modal.classList.add('modal-closing');
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });
        
        // モーダル外クリックで閉じる
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('modal-closing');
                setTimeout(() => {
                    document.body.removeChild(modal);
                }, 300);
            }
        });
        
        // モバイルでのモーダルスクロール制御
        if (isMobileDevice()) {
            modal.addEventListener('touchmove', function(e) {
                e.stopPropagation();
            }, { passive: true });
        }
        
        // モーダルを表示（アニメーション用に少し遅らせる）
        setTimeout(() => {
            modal.classList.add('modal-active');
        }, 10);
    },
    
    // 拡張UI機能の初期化
    initExtendedUI() {
        // 情報ボタンを追加
        this.addInfoButton();
        
        // 季節の結晶セクションを追加
        this.showSeasonalCrystals();
    },
    
    // 結晶情報ボタンを追加
    addInfoButton() {
        // すでにボタンがある場合は追加しない
        if (document.getElementById('info-button')) return;
        
        const infoButton = document.createElement('button');
        infoButton.id = 'info-button';
        infoButton.className = 'info-button';
        infoButton.innerHTML = '結晶について<br>もっと知る';
        
        document.querySelector('.controls').appendChild(infoButton);
        
        infoButton.addEventListener('click', () => {
            // 現在の温度と湿度から結晶タイプを特定
            const temp = parseInt(this.temperatureSlider.value);
            const humidity = parseInt(this.humiditySlider.value);
            const type = CrystalDataManager.getCrystalType(temp, humidity);
            
            if (type) {
                this.showCrystalInfo(type);
            }
        });
    },
    
    // 季節イベントの雪の結晶セクションを表示
    showSeasonalCrystals() {
        // すでにコンテナがある場合は追加しない
        if (document.querySelector('.seasonal-container')) return;
        
        const seasonalContainer = document.createElement('div');
        seasonalContainer.className = 'seasonal-container';
        
        seasonalContainer.innerHTML = `
            <h3>季節の特別な結晶</h3>
            <div class="seasonal-crystals">
                <div class="seasonal-crystal" data-temp="-5" data-humidity="80">
                    <img src="snowflakes/crystal_t-5_h80.png" alt="春の結晶">
                    <span>春の雪</span>
                </div>
                <div class="seasonal-crystal" data-temp="-2" data-humidity="60">
                    <img src="snowflakes/crystal_t-2_h60.png" alt="夏の結晶">
                    <span>夏の山岳雪</span>
                </div>
                <div class="seasonal-crystal" data-temp="-10" data-humidity="85">
                    <img src="snowflakes/crystal_t-10_h85.png" alt="秋の結晶">
                    <span>秋の初雪</span>
                </div>
                <div class="seasonal-crystal" data-temp="-18" data-humidity="90">
                    <img src="snowflakes/crystal_t-18_h90.png" alt="冬の結晶">
                    <span>真冬の雪</span>
                </div>
                <div class="seasonal-crystal" data-temp="-15" data-humidity="70">
                    <img src="snowflakes/crystal_t-15_h70.png" alt="クリスマスの結晶">
                    <span>クリスマス</span>
                </div>
            </div>
        `;
        
        document.querySelector('.container').insertBefore(
            seasonalContainer, 
            document.querySelector('.app-footer')
        );
        
        // 季節の結晶をクリックしたときの処理
        const crystals = seasonalContainer.querySelectorAll('.seasonal-crystal');
        crystals.forEach(crystal => {
            crystal.addEventListener('click', () => {
                const temp = parseInt(crystal.getAttribute('data-temp'));
                const humidity = parseInt(crystal.getAttribute('data-humidity'));
                
                // スライダーの値を更新
                this.temperatureSlider.value = temp;
                this.humiditySlider.value = humidity;
                
                // 表示を更新
                this.updateTempValue();
                this.updateHumidityValue();
                this.updatePreview();
                
                // 雪を生成
                this.generateSnowflakes();
            });
        });
    },
    
    // 履歴表示の更新
    updateHistoryDisplay() {
        // コンテナがなければ作成
        let historyContainer = document.getElementById('history-container');
        
        if (!historyContainer) {
            historyContainer = document.createElement('div');
            historyContainer.id = 'history-container';
            historyContainer.className = 'history-container';
            historyContainer.innerHTML = '<h3>履歴</h3><div class="history-items"></div>';
            
            // フッターの前に挿入
            document.querySelector('.container').insertBefore(
                historyContainer, 
                document.querySelector('.app-footer')
            );
        }
        
        // 履歴アイテムを更新
        const itemsContainer = historyContainer.querySelector('.history-items');
        itemsContainer.innerHTML = '';
        
        CrystalDataManager.crystalHistory.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const key = `t${item.temp}_h${item.humidity}`;
            let imgSrc = '';
            let typeName = '';
            
            if (CrystalDataManager.crystalData && CrystalDataManager.crystalData.mappings[key]) {
                imgSrc = `snowflakes/${CrystalDataManager.crystalData.mappings[key].file}`;
                const type = CrystalDataManager.crystalData.mappings[key].type;
                typeName = CrystalDataManager.crystalData.types[type].name;
            }
            
            historyItem.innerHTML = `
                <img src="${imgSrc}" alt="履歴の結晶">
                <div class="history-info">
                    <span class="history-type">${typeName}</span>
                    <span class="history-params">${item.temp}°C, ${item.humidity}%</span>
                </div>
            `;
            
            historyItem.addEventListener('click', () => {
                // スライダーの値を更新
                this.temperatureSlider.value = item.temp;
                this.humiditySlider.value = item.humidity;
                
                // 表示を更新
                this.updateTempValue();
                this.updateHumidityValue();
                this.updatePreview();
                
                // 雪を生成
                this.generateSnowflakes();
            });
            
            itemsContainer.appendChild(historyItem);
        });
    }
};