// Service Worker for 더부동산 PWA
const CACHE_NAME = 'the-realty-v2';
const urlsToCache = [
  '/The-realty_hasia/',
  '/The-realty_hasia/index.html',
  '/The-realty_hasia/form.html',
  '/The-realty_hasia/admin-login.html',
  '/The-realty_hasia/styles.css',
  '/The-realty_hasia/form-styles.css',
  '/The-realty_hasia/confirm-modal-styles.css',
  '/The-realty_hasia/slack-button-styles.css',
  '/The-realty_hasia/script.js',
  '/The-realty_hasia/form-script-supabase.js',
  '/The-realty_hasia/supabase-config.js',
  '/The-realty_hasia/copy-protection.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Install event - 캐시 초기화
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('캐시 열기 완료');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - 이전 캐시 정리
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('이전 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - 네트워크 우선, 실패시 캐시
self.addEventListener('fetch', event => {
  // Supabase API 요청은 항상 네트워크 사용
  if (event.request.url.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // 오프라인시 빈 응답 반환
          return new Response(JSON.stringify({ error: '오프라인 상태입니다' }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // 일반 리소스는 네트워크 우선, 실패시 캐시
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 유효한 응답이면 캐시에 저장
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // 네트워크 실패시 캐시에서 가져오기
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            // 캐시에도 없으면 오프라인 페이지 표시
            if (event.request.destination === 'document') {
              return new Response(
                `<!DOCTYPE html>
                <html lang="ko">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>오프라인</title>
                  <style>
                    body {
                      font-family: sans-serif;
                      display: flex;
                      justify-content: center;
                      align-items: center;
                      height: 100vh;
                      margin: 0;
                      background: #f8f9fa;
                    }
                    .offline-message {
                      text-align: center;
                      padding: 40px;
                      background: white;
                      border-radius: 12px;
                      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    }
                    h1 { color: #1a1a1a; margin-bottom: 10px; }
                    p { color: #6b7280; }
                  </style>
                </head>
                <body>
                  <div class="offline-message">
                    <h1>오프라인 상태</h1>
                    <p>인터넷 연결을 확인해주세요</p>
                  </div>
                </body>
                </html>`,
                { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
              );
            }
          });
      })
  );
});

// 백그라운드 동기화
self.addEventListener('sync', event => {
  if (event.tag === 'sync-properties') {
    event.waitUntil(syncProperties());
  }
});

async function syncProperties() {
  // 오프라인에서 저장된 데이터 동기화
  console.log('백그라운드 동기화 시작');
}