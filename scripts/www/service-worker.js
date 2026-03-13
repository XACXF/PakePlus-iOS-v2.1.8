// ============================================
// 游戏账号出租管理系统 - Service Worker
// 用于后台通知和离线支持
// ============================================

const CACHE_NAME = 'rental-system-v1';

// 安装 Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker 安装中...');
    self.skipWaiting();
});

// 激活 Service Worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker 已激活');
    event.waitUntil(self.clients.claim());
});

// 处理推送通知
self.addEventListener('push', (event) => {
    const data = event.data.json();
    const options = {
        body: data.body,
        icon: 'gy.png',
        badge: 'gy.png',
        tag: data.tag,
        requireInteraction: true,
        actions: [
            {
                action: 'view',
                title: '查看详情'
            },
            {
                action: 'close',
                title: '关闭'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// 处理通知点击
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});
