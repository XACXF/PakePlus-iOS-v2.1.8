// ============================================
// 游戏账号出租管理系统 - 通知管理模块
// ============================================

// 通知管理器
const NotificationManager = {
    // 检查是否支持通知
    isSupported() {
        return 'Notification' in window && 'serviceWorker' in navigator;
    },

    // 检查当前权限状态
    getPermissionStatus() {
        if (!this.isSupported()) {
            return 'unsupported';
        }
        return Notification.permission;
    },

    // 请求通知权限
    async requestPermission() {
        if (!this.isSupported()) {
            console.log('浏览器不支持通知功能');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            console.log('通知权限状态:', permission);
            
            if (permission === 'granted') {
                await this.registerServiceWorker();
                this.showLocalNotification(
                    '通知已开启',
                    '您将收到账号租用到期提醒',
                    'permission-granted'
                );
                return true;
            } else if (permission === 'denied') {
                alert('您已拒绝通知权限。如需开启，请在浏览器设置中允许通知。');
                return false;
            }
            return false;
        } catch (error) {
            console.error('请求通知权限失败:', error);
            return false;
        }
    },

    // 注册 Service Worker
    async registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('service-worker.js');
            console.log('Service Worker 注册成功:', registration);
            return registration;
        } catch (error) {
            console.error('Service Worker 注册失败:', error);
            throw error;
        }
    },

    // 显示本地通知
    async showLocalNotification(title, body, tag = 'default') {
        if (!this.isSupported()) {
            console.log('浏览器不支持通知');
            return;
        }

        if (Notification.permission !== 'granted') {
            console.log('没有通知权限');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(title, {
                body: body,
                icon: 'gy.png',
                badge: 'gy.png',
                tag: tag,
                requireInteraction: false,
                actions: [
                    {
                        action: 'view',
                        title: '查看'
                    },
                    {
                        action: 'close',
                        title: '关闭'
                    }
                ]
            });
        } catch (error) {
            // 如果 Service Worker 不可用，使用普通通知
            new Notification(title, {
                body: body,
                icon: 'gy.png'
            });
        }
    },

    // 检查即将到期的账号并发送通知
    checkExpiringAccounts() {
        if (Notification.permission !== 'granted') {
            return;
        }

        const now = new Date();
        const notificationThreshold = 30 * 60 * 1000; // 30分钟提醒阈值

        accounts.forEach(account => {
            if (account.status === 'rented' && account.rentInfo && account.rentInfo.endTime) {
                const endTime = new Date(account.rentInfo.endTime);
                const timeRemaining = endTime - now;

                // 如果即将到期（30分钟内）且未发送过通知
                if (timeRemaining > 0 && timeRemaining <= notificationThreshold) {
                    const notifiedKey = `notified_${account.id}`;
                    const alreadyNotified = sessionStorage.getItem(notifiedKey);

                    if (!alreadyNotified) {
                        this.showLocalNotification(
                            '⏰ 账号即将到期',
                            `${account.gameName} 账号将在 ${Math.ceil(timeRemaining / 60000)} 分钟后到期，请及时处理！`,
                            `expiring_${account.id}`
                        );
                        sessionStorage.setItem(notifiedKey, 'true');
                    }
                }

                // 如果已经到期
                if (timeRemaining <= 0 && timeRemaining > -60000) { // 到期后1分钟内
                    const expiredKey = `expired_${account.id}`;
                    const alreadyExpiredNotified = sessionStorage.getItem(expiredKey);

                    if (!alreadyExpiredNotified) {
                        this.showLocalNotification(
                            '⚠️ 账号已到期',
                            `${account.gameName} 账号租用已到期，请及时收回！`,
                            `expired_${account.id}`
                        );
                        sessionStorage.setItem(expiredKey, 'true');
                    }
                }
            }
        });
    },

    // 初始化通知系统
    async init() {
        if (!this.isSupported()) {
            console.log('浏览器不支持通知功能');
            return;
        }

        // 如果已经有权限，注册 Service Worker
        if (Notification.permission === 'granted') {
            await this.registerServiceWorker();
        }

        // 每分钟检查一次即将到期的账号
        setInterval(() => {
            this.checkExpiringAccounts();
        }, 60000);

        // 立即检查一次
        this.checkExpiringAccounts();

        console.log('通知系统已初始化');
    }
};

// 显示通知设置弹窗
function showNotificationSettings() {
    const permission = NotificationManager.getPermissionStatus();
    
    let content = '';
    if (permission === 'unsupported') {
        content = '<p class="text-red-500">您的浏览器不支持系统通知功能</p>';
    } else if (permission === 'granted') {
        content = `
            <div class="text-center">
                <div class="text-green-500 text-5xl mb-4">✓</div>
                <p class="text-gray-700 mb-2">通知权限已开启</p>
                <p class="text-sm text-gray-500">您将在账号租用到期前30分钟收到提醒</p>
            </div>
        `;
    } else if (permission === 'denied') {
        content = `
            <div class="text-center">
                <div class="text-red-500 text-5xl mb-4">✗</div>
                <p class="text-gray-700 mb-2">通知权限被拒绝</p>
                <p class="text-sm text-gray-500 mb-4">请在浏览器设置中手动允许通知权限</p>
                <button onclick="location.reload()" class="bg-blue-600 text-white px-4 py-2 rounded-lg">刷新页面</button>
            </div>
        `;
    } else {
        content = `
            <div class="text-center">
                <div class="text-blue-500 text-5xl mb-4">🔔</div>
                <p class="text-gray-700 mb-4">开启通知权限，及时获取账号到期提醒</p>
                <button onclick="enableNotifications()" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition duration-300">
                    开启通知
                </button>
            </div>
        `;
    }

    // 创建弹窗
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.id = 'notificationSettingsModal';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-800">通知设置</h3>
                <button onclick="closeNotificationSettings()" class="text-gray-500 hover:text-gray-700">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            ${content}
        </div>
    `;
    document.body.appendChild(modal);
}

// 关闭通知设置弹窗
function closeNotificationSettings() {
    const modal = document.getElementById('notificationSettingsModal');
    if (modal) {
        modal.remove();
    }
}

// 启用通知
async function enableNotifications() {
    const success = await NotificationManager.requestPermission();
    if (success) {
        closeNotificationSettings();
        showNotificationSettings(); // 重新打开显示成功状态
    }
}

// 页面加载时初始化通知系统
document.addEventListener('DOMContentLoaded', () => {
    NotificationManager.init();
});
