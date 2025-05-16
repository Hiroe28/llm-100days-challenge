// サービスワーカーのインストール処理
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('unit-converter-v1').then((cache) => {
      return cache.addAll([
        './',
        './index.html',
        './styles.css',
        './app.js',
        './favicon.ico',
        './apple-touch-icon.png',
        'https://cdn.tailwindcss.com',
        'https://cdnjs.cloudflare.com/ajax/libs/mathjs/11.8.0/math.min.js'
      ]);
    })
  );
});

// キャッシュファーストの戦略
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // キャッシュが見つかればそれを返す
      if (response) {
        return response;
      }
      
      // キャッシュになければネットワークリクエストを行う
      return fetch(event.request).then((response) => {
        // 有効なレスポンスでなければそのまま返す
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // レスポンスを複製してキャッシュと返却の両方に使用する
        const responseToCache = response.clone();
        
        caches.open('unit-converter-v1').then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      });
    })
  );
});

// 古いキャッシュの削除
self.addEventListener('activate', (event) => {
  const cacheWhitelist = ['unit-converter-v1'];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});