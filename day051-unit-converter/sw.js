// サービスワーカーのインストール処理
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('unit-converter-v2').then((cache) => {
      return cache.addAll([
        './',
        './index.html'
        // 必要に応じて他のローカルリソースを追加
      ])
      .then(() => {
        console.log('基本リソースのキャッシュが完了しました');
        // CDNリソースは個別に（エラーが発生しても全体に影響しないように）キャッシュ
        return Promise.allSettled([
          cache.add('https://cdn.tailwindcss.com')
            .catch(err => console.log('Tailwind CSSのキャッシュに失敗:', err)),
          cache.add('https://cdnjs.cloudflare.com/ajax/libs/mathjs/11.8.0/math.min.js')
            .catch(err => console.log('Math.jsのキャッシュに失敗:', err))
        ]);
      })
      .catch(error => {
        console.error('キャッシュの初期化に失敗しました:', error);
      });
    })
  );
  
  // 待たずに進むようにself.skipWaitingを呼び出す
  self.skipWaiting();
});

// キャッシュファーストの戦略（ネットワークフォールバック）
self.addEventListener('fetch', (event) => {
  // CDNから取得する場合はネットワークファースト、それ以外はキャッシュファースト
  const url = new URL(event.request.url);
  const isCDN = url.origin.includes('cdn') || url.origin.includes('cdnjs');
  
  if (isCDN) {
    // CDNリソースはネットワークファースト + キャッシュフォールバック
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // 成功したらキャッシュして返す
          const responseClone = response.clone();
          caches.open('unit-converter-v2').then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // ネットワーク失敗時はキャッシュから取得
          return caches.match(event.request);
        })
    );
  } else {
    // 通常のリソースはキャッシュファースト
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          // キャッシュがあればそれを返す
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // なければネットワークから取得
          return fetch(event.request)
            .then(response => {
              // 有効なレスポンスでなければそのまま返す
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // 有効なレスポンスはキャッシュに保存
              const responseToCache = response.clone();
              caches.open('unit-converter-v2').then(cache => {
                cache.put(event.request, responseToCache);
              });
              
              return response;
            })
            .catch(error => {
              console.error('フェッチに失敗:', error);
              // APIリクエストなど、失敗してもエラーにしない
              return new Response('ネットワークエラー', { status: 408, headers: { 'Content-Type': 'text/plain' } });
            });
        })
    );
  }
});

// 古いキャッシュの削除
self.addEventListener('activate', (event) => {
  const cacheWhitelist = ['unit-converter-v2']; // バージョンを更新
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('古いキャッシュを削除:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // 新しいサービスワーカーをすぐにアクティブにする
      return self.clients.claim();
    })
  );
});