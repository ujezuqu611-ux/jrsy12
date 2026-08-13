// jrsy PWA Service Worker
const CACHE_NAME = 'jrsy-cache-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// 安装：缓存核心文件
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// 拦截请求：缓存优先策略
self.addEventListener('fetch', (event) => {
    // 只处理 GET 请求
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request)
            .then((cached) => {
                // 有缓存就用缓存，同时后台更新
                const fetchPromise = fetch(event.request)
                    .then((response) => {
                        // 缓存有效响应
                        if (response && response.status === 200 && response.type === 'basic') {
                            const clone = response.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(event.request, clone);
                            });
                        }
                        return response;
                    })
                    .catch(() => cached); // 网络失败用缓存
                return cached || fetchPromise;
            })
    );
});
