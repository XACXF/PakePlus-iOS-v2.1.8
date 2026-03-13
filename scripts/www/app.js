// ============================================
// 游戏账号出租管理系统 - 核心功能
// ============================================

// 数据存储
let accounts = [];
let currentFilter = 'all';
let currentRentAccountId = null;
let editingAccountId = null; // 正在编辑的账号ID
let currentEditingCardId = null; // 正在更换背景的卡片ID

// 可用的卡片背景图片
const cardBackgrounds = [
    'tp/kapian/k1.png',
    'tp/kapian/k2.png',
    'tp/kapian/k3.png',
    'tp/kapian/k4.png',
    'tp/kapian/k5.png',
    'tp/kapian/k6.png',
    'tp/kapian/k7.png',
    'tp/kapian/k8.png'
];

// 主题背景图片
const themeBackgrounds = [
    'tp/bz/1.png',
    'tp/bz/2.png',
    'tp/bz/3.png'
];

// 当前主题设置（默认设置）
let currentTheme = {
    bgImage: 'tp/bz/1.png',  // 默认使用第一张背景图
    bgColor: '',  // 使用背景图片时不需要颜色
    brightness: 48,  // 背景亮度 48%
    cardBrightness: 86  // 资料卡亮度 86%
};

// 加载主题设置
function loadThemeSettings() {
    const saved = localStorage.getItem('theme_settings');
    if (saved) {
        currentTheme = JSON.parse(saved);
        console.log('加载已保存的主题设置:', currentTheme);
        applyTheme();
    } else {
        console.log('使用默认主题设置:', currentTheme);
    }
}

// 读取并显示当前主题设置（用于调试）
function showCurrentThemeSettings() {
    console.log('========== 当前主题设置 ==========');
    console.log('背景图片:', currentTheme.bgImage || '无');
    console.log('背景颜色:', currentTheme.bgColor);
    console.log('背景亮度:', currentTheme.brightness + '%');
    console.log('资料卡亮度:', currentTheme.cardBrightness + '%');
    console.log('=================================');
    
    // 显示通知
    showNotification(`主题设置: 背景${currentTheme.brightness}%, 卡片${currentTheme.cardBrightness}%`, 'info');
}

// 应用主题
function applyTheme() {
    const body = document.body;
    
    // 颜色映射表
    const colorMap = {
        'bg-gray-900': '#111827',
        'bg-slate-800': '#1e293b',
        'bg-zinc-700': '#3f3f46',
        'bg-gray-400': '#9ca3af',
        'bg-gray-500': '#6b7280',
        'bg-gray-600': '#4b5563',
        'bg-blue-600': '#2563eb',
        'bg-purple-600': '#9333ea',
        'bg-pink-600': '#db2777',
        'bg-red-600': '#dc2626',
        'bg-orange-600': '#ea580c',
        'bg-pink-500': '#ec4899',
        'bg-gradient-to-br from-gray-50 to-gray-100': 'linear-gradient(to bottom right, #f9fafb, #f3f4f6)'
    };

    // 应用背景图片
    if (currentTheme.bgImage) {
        body.style.backgroundImage = `url('${currentTheme.bgImage}')`;
        body.style.backgroundSize = 'cover';
        body.style.backgroundPosition = 'center';
        body.style.backgroundAttachment = 'fixed';
        body.style.backgroundColor = '';
    } else {
        // 无背景图时，使用颜色映射表设置背景色
        const bgColor = colorMap[currentTheme.bgColor] || currentTheme.bgColor;
        console.log('Applying color:', currentTheme.bgColor, '->', bgColor);
        
        // 清除背景图片相关样式
        body.style.backgroundImage = '';
        body.style.backgroundSize = '';
        body.style.backgroundPosition = '';
        body.style.backgroundAttachment = '';
        
        if (bgColor) {
            if (bgColor.includes('linear-gradient')) {
                body.style.setProperty('background', bgColor, 'important');
            } else {
                // 使用 !important 确保颜色生效
                body.style.setProperty('background-color', bgColor, 'important');
            }
        }
    }
    
    // 应用亮度
    applyBrightness();
    applyCardBrightness();
}

// 打开主题设置模态框
function openThemeModal() {
    const modal = document.getElementById('themeModal');
    const optionsContainer = document.getElementById('themeBgOptions');
    
    // 生成背景选项
    let optionsHtml = '';
    themeBackgrounds.forEach((bg, index) => {
        const isSelected = currentTheme.bgImage === bg ? 'border-blue-500 ring-2 ring-blue-300' : 'border-transparent';
        optionsHtml += `
            <div class="cursor-pointer rounded-lg overflow-hidden border-2 ${isSelected} hover:border-blue-400 transition-all" onclick="selectThemeBg('${bg}')">
                <img src="${bg}" alt="背景${index + 1}" class="w-full h-24 object-cover">
            </div>
        `;
    });
    
    // 添加"无背景"选项
    const noBgSelected = currentTheme.bgImage === '' ? 'border-blue-500 ring-2 ring-blue-300' : 'border-transparent';
    optionsHtml += `
        <div class="cursor-pointer rounded-lg overflow-hidden border-2 ${noBgSelected} hover:border-blue-400 transition-all bg-gray-100 flex items-center justify-center h-24" onclick="selectThemeBg('')">
            <span class="text-gray-500 text-sm">无背景</span>
        </div>
    `;
    
    optionsContainer.innerHTML = optionsHtml;
    
    // 设置当前背景亮度值
    document.getElementById('brightnessSlider').value = currentTheme.brightness;
    document.getElementById('brightnessValue').textContent = currentTheme.brightness;
    
    // 设置当前资料卡亮度值
    document.getElementById('cardBrightnessSlider').value = currentTheme.cardBrightness;
    document.getElementById('cardBrightnessValue').textContent = currentTheme.cardBrightness;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

// 关闭主题设置模态框
function closeThemeModal() {
    const modal = document.getElementById('themeModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// 选择主题背景
function selectThemeBg(bgImage) {
    currentTheme.bgImage = bgImage;
    
    // 更新选中状态
    const options = document.querySelectorAll('#themeBgOptions > div');
    options.forEach((opt, index) => {
        if (index === themeBackgrounds.length && bgImage === '') {
            // 无背景选项
            opt.classList.add('border-blue-500', 'ring-2', 'ring-blue-300');
            opt.classList.remove('border-transparent');
        } else if (themeBackgrounds[index] === bgImage) {
            opt.classList.add('border-blue-500', 'ring-2', 'ring-blue-300');
            opt.classList.remove('border-transparent');
        } else {
            opt.classList.remove('border-blue-500', 'ring-2', 'ring-blue-300');
            opt.classList.add('border-transparent');
        }
    });
    
    // 实时预览
    applyTheme();
}

// 更新背景亮度
function updateBrightness(value) {
    currentTheme.brightness = value;
    document.getElementById('brightnessValue').textContent = value;
    applyBrightness();
}

// 更新资料卡亮度
function updateCardBrightness(value) {
    currentTheme.cardBrightness = value;
    document.getElementById('cardBrightnessValue').textContent = value;
    applyCardBrightness();
}

// 应用背景亮度（使用遮罩层）
function applyBrightness() {
    const brightnessLayer = document.getElementById('bgBrightnessLayer');
    if (brightnessLayer) {
        // 亮度值 20-100，转换为遮罩透明度
        // 100% = 完全透明，20% = 较暗
        const opacity = (100 - currentTheme.brightness) / 100 * 0.7;
        brightnessLayer.style.background = `rgba(0,0,0,${opacity})`;
    }
}

// 应用资料卡亮度
function applyCardBrightness() {
    // 为所有资料卡应用亮度
    const cards = document.querySelectorAll('.account-card, .stat-card, #accountListContainer');
    cards.forEach(card => {
        card.style.filter = `brightness(${currentTheme.cardBrightness}%)`;
    });
}

// 设置背景颜色
function setBgColor(colorClass) {
    currentTheme.bgColor = colorClass;
    // 清除背景图片，确保颜色能显示
    currentTheme.bgImage = '';
    applyTheme();
}

// 保存主题设置
function saveThemeSettings() {
    localStorage.setItem('theme_settings', JSON.stringify(currentTheme));
    closeThemeModal();
    showNotification('主题设置已保存！', 'success');
}

// 设置筛选监听器
function setupFilterListeners() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active', 'bg-blue-200'));
            this.classList.add('active', 'bg-blue-200');
            currentFilter = this.dataset.filter;
            renderAccounts();
        });
    });
}

// 获取存储键名（使用默认用户）
function getStorageKey() {
    return 'game_accounts_default';
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    loadAccounts();
    loadRecycleBin();
    updateStatistics();
    renderAccounts();
    setupEventListeners();
    initStatsToggle();
    loadThemeSettings();
    applyBrightness();
    applyCardBrightness();
});

// 初始化统计卡片折叠状态
function initStatsToggle() {
    const isExpanded = localStorage.getItem('stats_collapsed') === 'false';
    if (isExpanded) {
        // 用户之前展开过，保持展开状态
        toggleStats(false);
    }
    // 默认保持收起状态（HTML中已添加hidden类）
}

// 切换统计卡片显示/隐藏
function toggleStats(forceCollapse = null) {
    const container = document.getElementById('statsContainer');
    const icon = document.getElementById('toggleStatsIcon');
    const isCollapsed = forceCollapse !== null ? forceCollapse : container.style.display === 'none';
    
    if (isCollapsed) {
        container.style.display = 'grid';
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>';
        localStorage.setItem('stats_collapsed', 'false');
    } else {
        container.style.display = 'none';
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>';
        localStorage.setItem('stats_collapsed', 'true');
    }
}

// 退出系统
function logout() {
    if (!confirm('确定要返回首页吗？')) return;
    window.location.href = 'login.html';
}

// 加载账号数据
function loadAccounts() {
    try {
        const data = localStorage.getItem(getStorageKey());
        accounts = data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('加载账号失败:', e);
        accounts = [];
    }
}

// 保存账号数据
function saveAccounts() {
    try {
        localStorage.setItem(getStorageKey(), JSON.stringify(accounts));
    } catch (e) {
        console.error('保存账号失败:', e);
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 添加账号按钮
    document.getElementById('addAccountBtn').addEventListener('click', openModal);
    
    // 关闭模态框
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    
    // 表单提交
    document.getElementById('accountForm').addEventListener('submit', handleAddAccount);
    
    // 游戏选择变化
    document.getElementById('gameName').addEventListener('change', handleGameChange);
    
    // 筛选按钮
    setupFilterListeners();
    
    // 搜索
    document.getElementById('searchInput').addEventListener('input', renderAccounts);
    
    // 排序
    document.getElementById('sortSelect').addEventListener('change', renderAccounts);
    
    // 出租时长变化时更新预估费用
    document.getElementById('rentDuration').addEventListener('input', updateEstimatedCost);
    document.getElementById('rentUnit').addEventListener('change', updateEstimatedCost);
    
}



// 打开模态框
function openModal() {
    document.getElementById('addAccountModal').classList.remove('hidden');
    document.getElementById('addAccountModal').classList.add('flex');
}

// 关闭模态框
function closeModal() {
    document.getElementById('addAccountModal').classList.add('hidden');
    document.getElementById('addAccountModal').classList.remove('flex');
    document.getElementById('accountForm').reset();
    document.getElementById('skyFields').classList.add('hidden');
    editingAccountId = null; // 清除编辑状态
}

// 处理游戏选择变化
function handleGameChange(e) {
    const gameName = e.target.value;
    const skyFields = document.getElementById('skyFields');
    
    if (gameName === '光·遇') {
        skyFields.classList.remove('hidden');
    } else {
        skyFields.classList.add('hidden');
    }
}

// 添加账号
function handleAddAccount(e) {
    e.preventDefault();
    
    const gameName = document.getElementById('gameName').value;
    const server = document.getElementById('server').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const redCandles = parseInt(document.getElementById('redCandles').value) || 0;
    const whiteCandles = parseInt(document.getElementById('whiteCandles').value) || 0;
    const heartsCount = parseInt(document.getElementById('heartsCount').value) || 0;
    const dailyPrice = parseFloat(document.getElementById('dailyPrice').value) || 0;
    const priceUnit = document.getElementById('priceUnit').value;
    const deposit = parseFloat(document.getElementById('deposit').value) || 0;
    const remarks = document.getElementById('remarks').value.trim();
    
    // 如果是编辑模式，保留原账号的ID和状态
    let newAccount;
    if (editingAccountId) {
        const oldAccount = accounts.find(a => a.id === editingAccountId);
        newAccount = {
            id: editingAccountId,
            gameName,
            server,
            phone,
            redCandles,
            whiteCandles,
            heartsCount,
            dailyPrice,
            priceUnit,
            deposit,
            remarks,
            status: oldAccount ? oldAccount.status : 'available',
            createdAt: oldAccount ? oldAccount.createdAt : new Date().toISOString(),
            rentInfo: oldAccount ? oldAccount.rentInfo : null
        };
        // 替换原账号
        accounts = accounts.map(a => a.id === editingAccountId ? newAccount : a);
        editingAccountId = null; // 清除编辑状态
    } else {
        // 新增账号
        newAccount = {
            id: Date.now(),
            gameName,
            server,
            phone,
            redCandles,
            whiteCandles,
            heartsCount,
            dailyPrice,
            priceUnit,
            deposit,
            remarks,
            status: 'available',
            createdAt: new Date().toISOString(),
            rentInfo: null
        };
        accounts.push(newAccount);
    }
    
    // 光遇特殊字段
    if (gameName === '光·遇') {
        newAccount.graduationProgress = document.getElementById('graduationProgress').value.trim();
        newAccount.replicaItems = document.getElementById('replicaItems').value.trim();
    }
    
    saveAccounts();
    updateStatistics();
    renderAccounts();
    closeModal();
    showNotification(editingAccountId ? '账号修改成功！' : '账号添加成功！', 'success');
}

// 更新统计信息
function updateStatistics() {
    const total = accounts.length;
    const available = accounts.filter(a => a.status === 'available').length;
    const rented = accounts.filter(a => a.status === 'rented').length;
    const maintenance = accounts.filter(a => a.status === 'maintenance').length;
    
    const totalEl = document.getElementById('totalAccounts');
    const availableEl = document.getElementById('availableAccounts');
    const rentedEl = document.getElementById('rentedAccounts');
    const maintenanceEl = document.getElementById('maintenanceAccounts');
    
    if (totalEl) totalEl.textContent = total;
    if (availableEl) availableEl.textContent = available;
    if (rentedEl) rentedEl.textContent = rented;
    if (maintenanceEl) maintenanceEl.textContent = maintenance;
}

// 渲染账号列表
function renderAccounts() {
    const tbody = document.getElementById('accountsTableBody');
    const mobileList = document.getElementById('mobileAccountsList');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const sortValue = document.getElementById('sortSelect').value;
    
    // 筛选
    let filtered = accounts.filter(account => {
        // 游戏筛选
        if (currentFilter !== 'all' && account.gameName !== currentFilter) {
            return false;
        }
        
        // 搜索筛选
        if (searchTerm) {
            const searchStr = `${account.gameName} ${account.server} ${account.phone} ${account.remarks}`.toLowerCase();
            if (!searchStr.includes(searchTerm)) {
                return false;
            }
        }
        
        return true;
    });
    
    // 排序
    switch (sortValue) {
        case 'price-asc':
            filtered.sort((a, b) => a.dailyPrice - b.dailyPrice);
            break;
        case 'price-desc':
            filtered.sort((a, b) => b.dailyPrice - a.dailyPrice);
            break;
        case 'phone':
            filtered.sort((a, b) => (a.phone || '').localeCompare(b.phone || ''));
            break;
    }
    
    // 渲染
    if (filtered.length === 0) {
        const emptyHtml = `
            <div class="text-center text-gray-500 py-8">
                <svg class="w-16 h-16 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
                <p>暂无账号数据</p>
            </div>
        `;
        if (mobileList) mobileList.innerHTML = emptyHtml;
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                    <svg class="w-16 h-16 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
                    <p>暂无账号数据</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // 分别渲染手机端和桌面端
    let mobileHtml = '';
    let desktopHtml = '';
    
    filtered.forEach(account => {
        const statusClass = account.status === 'available' ? 'bg-green-500' : 
                           account.status === 'rented' ? 'bg-yellow-500' : 'bg-red-500';
        const statusText = account.status === 'available' ? '可租' : 
                          account.status === 'rented' ? '已出租' : '维护中';
        
        // 特殊属性显示 - 使用图标显示蜡烛和爱心
        const redCandleIcon = `<svg class="candle-icon candle-red" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C10.5 2 9.5 3 9.5 4.5C9.5 5.5 10 6.5 11 7V8H8C6.9 8 6 8.9 6 10V20C6 21.1 6.9 22 8 22H16C17.1 22 18 21.1 18 20V10C18 8.9 17.1 8 16 8H13V7C14 6.5 14.5 5.5 14.5 4.5C14.5 3 13.5 2 12 2M12 4C12.5 4 13 4.5 13 5C13 5.5 12.5 6 12 6C11.5 6 11 5.5 11 5C11 4.5 11.5 4 12 4Z"/></svg>`;
        const whiteCandleIcon = `<svg class="candle-icon candle-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C10.5 2 9.5 3 9.5 4.5C9.5 5.5 10 6.5 11 7V8H8C6.9 8 6 8.9 6 10V20C6 21.1 6.9 22 8 22H16C17.1 22 18 21.1 18 20V10C18 8.9 17.1 8 16 8H13V7C14 6.5 14.5 5.5 14.5 4.5C14.5 3 13.5 2 12 2M12 4C12.5 4 13 4.5 13 5C13 5.5 12.5 6 12 6C11.5 6 11 5.5 11 5C11 4.5 11.5 4 12 4Z"/></svg>`;
        const heartIcon = `<svg class="heart-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
        
        let specialAttrs = '';
        let candleHeartIcons = `${redCandleIcon}${account.redCandles || 0} ${whiteCandleIcon}${account.whiteCandles || 0} ${heartIcon}${account.heartsCount || 0}`;
        
        if (account.gameName === '光·遇') {
            specialAttrs = `${account.graduationProgress || '无'} | ${candleHeartIcons}`;
        } else {
            specialAttrs = candleHeartIcons;
        }
        
        // 计算剩余时间
        let remainingTime = '';
        if (account.status === 'rented' && account.rentInfo && account.rentInfo.endTime) {
            remainingTime = getRemainingTime(account.rentInfo.endTime);
        }
        
        // 代肝爱心任务标识 - 底部显示
        const heartServiceBadge = account.rentInfo && account.rentInfo.needHeartService 
            ? `<span class="bg-pink-500 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center shadow-lg whitespace-nowrap">
                <svg class="w-2.5 h-2.5 mr-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                代肝中
               </span>` 
            : '';
        
        const gameIcon = account.gameName === '光·遇' 
            ? `<img src="gy.png" alt="光遇" class="h-12 w-12 rounded-full object-cover">`
            : `<div class="h-12 w-12 rounded-full ${getGameColorClass(account.gameName)} flex items-center justify-center text-white font-bold text-lg">${account.gameName.charAt(0)}</div>`;
        
        // 手机端卡片布局 - 正方形卡片，带背景图
        const bgImage = account.cardBg || cardBackgrounds[account.id % cardBackgrounds.length];
        
        const mobileCard = `
            <div class="md:hidden relative rounded-lg shadow-lg mb-4 overflow-hidden" style="aspect-ratio: 1/1;">
                <!-- 背景图 -->
                <div class="absolute inset-0 bg-cover bg-center" style="background-image: url('${bgImage}'); filter: blur(2px) brightness(0.7); transform: scale(1.1);"></div>
                
                <!-- 内容层 -->
                <div class="relative z-10 h-full p-4 flex flex-col text-white">
                    <!-- 头部：图标和游戏名（图标可点击更换背景） -->
                    <div class="flex items-start mb-2">
                        <img src="gy.png" alt="光遇" class="h-10 w-10 rounded-full object-cover border-2 border-white/50 cursor-pointer hover:scale-110 transition-transform" onclick="openCardBgModal(${account.id})" title="点击更换卡片背景">
                        <div class="ml-2 flex-1">
                            <div class="flex items-center justify-between">
                                ${account.gameName === '光·遇' 
                                    ? `<img src="tp/logo6.png" alt="光遇" class="h-6 object-contain">` 
                                    : `<div class="font-bold text-lg">${account.gameName}</div>`}
                                <span class="px-2 py-0.5 text-xs font-semibold rounded-full ${statusClass}">${statusText}</span>
                            </div>
                            <div class="text-xs text-white/80">${account.server || '未设置区服'}</div>
                        </div>
                    </div>
                    
                    <!-- 中间：账号信息 -->
                    <div class="flex-1 flex flex-col justify-center space-y-1 text-sm relative">
                        <div class="flex justify-between items-center">
                            <span class="text-white/70">绑定手机:</span>
                            <div class="flex items-center">
                                <span class="font-medium mr-2">${account.phone || '未设置'}</span>
                                ${account.phone ? `<button onclick="copyPhone('${account.phone}')" class="text-blue-300 hover:text-blue-100" title="复制手机号">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                                </button>` : ''}
                            </div>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-white/70">蜡烛/爱心:</span>
                            <span class="font-medium flex items-center">${candleHeartIcons}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-white/70">价格:</span>
                            <span class="font-bold text-yellow-300">¥${account.dailyPrice}/${getPriceUnitText(account.priceUnit)}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-white/70">押金:</span>
                            <span class="font-medium">¥${account.deposit}</span>
                        </div>
                        <!-- 代肝中徽章 - 显示在账号信息区域右下角 -->
                        ${heartServiceBadge ? `<div class="absolute bottom-0 right-0">${heartServiceBadge}</div>` : ''}
                    </div>
                    
                    <!-- 底部：操作按钮 -->
                    <div class="flex justify-between items-center pt-2 mt-2 border-t border-white/20">
                        <div class="flex space-x-1.5">
                            ${account.status === 'available' ? `
                                <button onclick="openRentModal(${account.id})" class="bg-green-500/80 hover:bg-green-500 text-white text-[10px] px-2 py-1 rounded-full flex items-center shadow-lg transition-all">
                                    <svg class="w-2.5 h-2.5 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                                    出租
                                </button>
                            ` : account.status === 'rented' ? `
                                <button onclick="returnAccount(${account.id})" class="bg-blue-500/80 hover:bg-blue-500 text-white text-[10px] px-2 py-1 rounded-full flex items-center shadow-lg transition-all">
                                    <svg class="w-2.5 h-2.5 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
                                    归还
                                </button>
                            ` : ''}
                            <button onclick="editAccount(${account.id})" class="bg-yellow-500/80 hover:bg-yellow-500 text-white text-[10px] px-2 py-1 rounded-full flex items-center shadow-lg transition-all">
                                <svg class="w-2.5 h-2.5 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                编辑
                            </button>
                            <button onclick="deleteAccount(${account.id})" class="bg-red-500/80 hover:bg-red-500 text-white text-[10px] px-2 py-1 rounded-full flex items-center shadow-lg transition-all">
                                <svg class="w-2.5 h-2.5 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                删除
                            </button>
                        </div>
                        ${remainingTime ? `<span class="text-[10px] text-yellow-300 font-medium whitespace-nowrap">${remainingTime}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
        
        // 桌面端表格布局
        const desktopRow = `
            <tr class="hover:bg-gray-50 transition duration-200 hidden md:table-row">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        ${gameIcon}
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${account.gameName}</div>
                            <div class="text-sm text-gray-500">${account.server || '未设置区服'}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900 flex items-center">
                        绑定手机: ${account.phone || '未设置'}
                        ${account.phone ? `<button onclick="copyPhone('${account.phone}')" class="ml-2 text-blue-600 hover:text-blue-800" title="复制手机号">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                        </button>` : ''}
                    </div>
                    <div class="text-sm text-gray-500">${specialAttrs}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${statusClass}">
                        ${statusText}
                    </span>
                    ${account.rentInfo && account.rentInfo.needHeartService ? `
                        <div class="text-xs text-pink-600 mt-1 flex items-center">
                            <svg class="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                            代肝中
                        </div>
                    ` : ''}
                    ${account.status === 'rented' && account.rentInfo ? `
                        <div class="text-xs text-gray-500 mt-1">
                            ${remainingTime ? `<span class="text-yellow-600 font-medium">${remainingTime}</span>` : `到期: ${formatDate(account.rentInfo.endTime)}`}
                        </div>
                    ` : ''}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div class="text-sm font-medium text-gray-900">¥${account.dailyPrice}/${getPriceUnitText(account.priceUnit)}</div>
                    <div class="text-sm text-gray-500">押金: ¥${account.deposit}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    ${account.status === 'available' ? `
                        <button onclick="openRentModal(${account.id})" class="text-green-600 hover:text-green-900 mr-3 inline-flex items-center">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                            出租
                        </button>
                    ` : account.status === 'rented' ? `
                        <button onclick="returnAccount(${account.id})" class="text-blue-600 hover:text-blue-900 mr-3 inline-flex items-center">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
                            归还
                        </button>
                    ` : ''}
                    <button onclick="editAccount(${account.id})" class="text-indigo-600 hover:text-indigo-900 mr-3 inline-flex items-center">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        编辑
                    </button>
                    <button onclick="deleteAccount(${account.id})" class="text-red-600 hover:text-red-900 inline-flex items-center">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        删除
                    </button>
                </td>
            </tr>
        `;
        
        mobileHtml += mobileCard;
        desktopHtml += desktopRow;
    });
    
    if (mobileList) mobileList.innerHTML = mobileHtml;
    tbody.innerHTML = desktopHtml;
    
    // 渲染完成后应用资料卡亮度
    applyCardBrightness();
}

// 获取租金单位显示文本
function getPriceUnitText(unit) {
    const unitMap = {
        'hour': '时',
        'day': '天',
        'week': '周',
        'month': '月',
        'year': '年'
    };
    return unitMap[unit] || '时';
}

// 获取游戏颜色类
function getGameColorClass(gameName) {
    // 将游戏名称映射到颜色
    const colorMap = {
        '光·遇': 'bg-purple-500',
        '英雄联盟': 'bg-pink-500',
        '王者荣耀': 'bg-blue-500',
        '原神': 'bg-green-500'
    };
    return colorMap[gameName] || 'bg-gray-500';
}

// 打开出租模态框
function openRentModal(accountId) {
    currentRentAccountId = accountId;
    const account = accounts.find(a => a.id === accountId);
    
    if (!account) return;
    
    // 如果是光遇账号，显示爱心服务选项
    const skyRentFields = document.getElementById('skyRentFields');
    if (account.gameName === '光·遇') {
        skyRentFields.classList.remove('hidden');
    } else {
        skyRentFields.classList.add('hidden');
    }
    
    document.getElementById('rentModal').classList.remove('hidden');
    document.getElementById('rentModal').classList.add('flex');
    updateEstimatedCost();
}

// 关闭出租模态框
function closeRentModal() {
    document.getElementById('rentModal').classList.add('hidden');
    document.getElementById('rentModal').classList.remove('flex');
    currentRentAccountId = null;
    document.getElementById('renterName').value = '';
    document.getElementById('renterContact').value = '';
    document.getElementById('rentDuration').value = '';
    document.getElementById('needHeartService').checked = false;
}

// 更新预估费用
function updateEstimatedCost() {
    if (!currentRentAccountId) return;
    
    const account = accounts.find(a => a.id === currentRentAccountId);
    if (!account) return;
    
    const duration = parseFloat(document.getElementById('rentDuration').value) || 0;
    const unit = document.getElementById('rentUnit').value;
    
    let days = duration;
    if (unit === 'hour') {
        days = duration / 24;
    } else if (unit === 'week') {
        days = duration * 7;
    }
    
    const cost = Math.ceil(days * account.dailyPrice);
    document.getElementById('estimatedCost').textContent = `¥${cost}`;
}

// 确认出租
function confirmRent() {
    if (!currentRentAccountId) return;
    
    const renterName = document.getElementById('renterName').value.trim();
    const renterContact = document.getElementById('renterContact').value.trim();
    const duration = parseFloat(document.getElementById('rentDuration').value);
    const unit = document.getElementById('rentUnit').value;
    const needHeartService = document.getElementById('needHeartService').checked;
    
    // 只验证租赁时长，昵称和联系方式为可选
    if (!duration || duration <= 0) {
        showNotification('请填写租赁时长', 'error');
        return;
    }
    
    const account = accounts.find(a => a.id === currentRentAccountId);
    if (!account) return;
    
    // 计算结束时间
    let endTime = new Date();
    if (unit === 'hour') {
        endTime.setHours(endTime.getHours() + duration);
    } else if (unit === 'day') {
        endTime.setDate(endTime.getDate() + duration);
    } else if (unit === 'week') {
        endTime.setDate(endTime.getDate() + (duration * 7));
    }
    
    // 计算费用
    let days = duration;
    if (unit === 'hour') {
        days = duration / 24;
    } else if (unit === 'week') {
        days = duration * 7;
    }
    const totalCost = Math.ceil(days * account.dailyPrice);
    
    account.status = 'rented';
    account.rentInfo = {
        renterName,
        renterContact,
        startTime: new Date().toISOString(),
        endTime: endTime.toISOString(),
        duration,
        unit,
        totalCost,
        needHeartService,
        heartServiceStatus: needHeartService ? 'pending' : null
    };
    
    saveAccounts();
    updateStatistics();
    renderAccounts();
    closeRentModal();
    showNotification('账号出租成功！', 'success');
}

// 归还账号
function returnAccount(accountId) {
    if (!confirm('确定要归还该账号吗？')) return;
    
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;
    
    account.status = 'available';
    account.rentInfo = null;
    
    saveAccounts();
    updateStatistics();
    renderAccounts();
    showNotification('账号已归还！', 'success');
}

// 编辑账号
function editAccount(accountId) {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;
    
    // 标记正在编辑的账号
    editingAccountId = accountId;
    
    // 填充表单
    document.getElementById('gameName').value = account.gameName;
    document.getElementById('server').value = account.server;
    document.getElementById('phone').value = account.phone || '';
    document.getElementById('redCandles').value = account.redCandles || '';
    document.getElementById('whiteCandles').value = account.whiteCandles || '';
    document.getElementById('heartsCount').value = account.heartsCount || '';
    document.getElementById('dailyPrice').value = account.dailyPrice;
    document.getElementById('priceUnit').value = account.priceUnit || 'hour';
    document.getElementById('deposit').value = account.deposit;
    document.getElementById('remarks').value = account.remarks;
    
    // 光遇特殊字段
    if (account.gameName === '光·遇') {
        document.getElementById('skyFields').classList.remove('hidden');
        document.getElementById('graduationProgress').value = account.graduationProgress || '';
        document.getElementById('replicaItems').value = account.replicaItems || '';
    }
    
    openModal();
    showNotification('请修改账号信息后保存', 'info');
}



// 打开更换卡片背景模态框
function openCardBgModal(accountId) {
    currentEditingCardId = accountId;
    const modal = document.getElementById('cardBgModal');
    const optionsContainer = document.getElementById('cardBgOptions');
    
    // 生成背景选项
    let optionsHtml = '';
    cardBackgrounds.forEach((bg, index) => {
        optionsHtml += `
            <div class="cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all bg-gray-200" onclick="selectCardBg('${bg}')" style="min-height: 80px;">
                <img src="${bg}" alt="背景${index + 1}" class="w-full h-full object-cover" style="aspect-ratio: 1/1;">
            </div>
        `;
    });
    
    optionsContainer.innerHTML = optionsHtml;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

// 关闭更换卡片背景模态框
function closeCardBgModal() {
    const modal = document.getElementById('cardBgModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    currentEditingCardId = null;
}

// 选择卡片背景
function selectCardBg(bgImage) {
    if (!currentEditingCardId) return;

    const account = accounts.find(a => a.id === currentEditingCardId);
    if (account) {
        account.cardBg = bgImage;
        saveAccounts();
        renderAccounts();
        showNotification('卡片背景已更换！', 'success');
    }

    closeCardBgModal();
}

// 处理自定义背景图片选择
function handleCustomBgSelect(input) {
    if (!input.files || input.files.length === 0) return;
    if (!currentEditingCardId) return;

    const file = input.files[0];

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
        showNotification('请选择图片文件', 'error');
        return;
    }

    // 验证文件大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
        showNotification('图片大小不能超过 5MB', 'error');
        return;
    }

    // 读取文件为 Base64
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Image = e.target.result;

        const account = accounts.find(a => a.id === currentEditingCardId);
        if (account) {
            account.cardBg = base64Image;
            saveAccounts();
            renderAccounts();
            showNotification('自定义背景已应用！', 'success');
        }

        closeCardBgModal();

        // 清空输入框，允许再次选择同一文件
        input.value = '';
    };
    reader.onerror = function() {
        showNotification('图片读取失败，请重试', 'error');
    };
    reader.readAsDataURL(file);
}

// 格式化日期
function formatDate(isoString) {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 计算剩余时间
function getRemainingTime(endTime) {
    if (!endTime) return '';
    const end = new Date(endTime);
    const now = new Date();
    const diff = end - now;
    
    if (diff <= 0) return '已到期';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
        return `剩${days}天${hours}小时`;
    } else if (hours > 0) {
        return `剩${hours}小时${minutes}分`;
    } else {
        return `剩${minutes}分钟`;
    }
}

// 复制手机号到剪贴板
function copyPhone(phone) {
    if (navigator.clipboard && window.isSecureContext) {
        // 使用现代 Clipboard API
        navigator.clipboard.writeText(phone).then(() => {
            showNotification('手机号已复制: ' + phone, 'success');
        }).catch(() => {
            fallbackCopyTextToClipboard(phone);
        });
    } else {
        fallbackCopyTextToClipboard(phone);
    }
}

// 备用复制方法
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showNotification('手机号已复制: ' + text, 'success');
    } catch (err) {
        showNotification('复制失败，请手动复制', 'error');
    }
    
    document.body.removeChild(textArea);
}

// ============================================
// 数据备份功能
// ============================================

// 导出所有数据
function exportAllData() {
    const exportData = {
        version: '1.0',
        exportTime: new Date().toISOString(),
        accounts: accounts,
        themeSettings: currentTheme
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `游戏账号备份_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('数据导出成功！', 'success');
}

// 导入数据
function importAllData() {
    document.getElementById('importDataFile').click();
}

// 处理导入的文件
function handleImportData(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importData = JSON.parse(e.target.result);
            
            // 验证数据格式
            if (!importData.accounts || !Array.isArray(importData.accounts)) {
                showNotification('导入失败：数据格式不正确', 'error');
                return;
            }
            
            // 确认导入
            if (!confirm(`确定要导入数据吗？这将覆盖当前 ${accounts.length} 个账号。导入文件包含 ${importData.accounts.length} 个账号。`)) {
                input.value = '';
                return;
            }
            
            // 导入账号数据
            accounts = importData.accounts;
            saveAccounts();
            
            // 导入主题设置（如果存在）
            if (importData.themeSettings) {
                currentTheme = importData.themeSettings;
                localStorage.setItem('theme_settings', JSON.stringify(currentTheme));
                applyTheme();
                applyBrightness();
                applyCardBrightness();
            }
            
            // 刷新页面显示
            updateStatistics();
            renderAccounts();
            
            showNotification(`数据导入成功！共导入 ${importData.accounts.length} 个账号`, 'success');
        } catch (err) {
            console.error('导入错误:', err);
            showNotification('导入失败：文件格式错误', 'error');
        }
        input.value = '';
    };
    reader.onerror = function() {
        showNotification('导入失败：文件读取错误', 'error');
        input.value = '';
    };
    reader.readAsText(file);
}

// 回收站数据
let recycleBin = [];

// 加载回收站数据
function loadRecycleBin() {
    try {
        const data = localStorage.getItem('recycle_bin');
        recycleBin = data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('加载回收站失败:', e);
        recycleBin = [];
    }
}

// 保存回收站数据
function saveRecycleBin() {
    try {
        localStorage.setItem('recycle_bin', JSON.stringify(recycleBin));
    } catch (e) {
        console.error('保存回收站失败:', e);
    }
}

// 打开回收站模态框
function openRecycleBinModal() {
    loadRecycleBin();
    renderRecycleBin();
    const modal = document.getElementById('recycleBinModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

// 关闭回收站模态框
function closeRecycleBinModal() {
    const modal = document.getElementById('recycleBinModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// 渲染回收站列表
function renderRecycleBin() {
    const listContainer = document.getElementById('recycleBinList');
    const emptyContainer = document.getElementById('recycleBinEmpty');
    const countBadge = document.getElementById('recycleBinCount');
    const clearBtn = document.getElementById('clearRecycleBinBtn');
    
    if (!listContainer || !emptyContainer || !countBadge) {
        return;
    }
    
    // 更新数量
    countBadge.textContent = recycleBin.length;
    
    if (recycleBin.length === 0) {
        listContainer.innerHTML = '';
        listContainer.classList.add('hidden');
        emptyContainer.classList.remove('hidden');
        clearBtn.classList.add('hidden');
        return;
    }
    
    listContainer.classList.remove('hidden');
    emptyContainer.classList.add('hidden');
    clearBtn.classList.remove('hidden');
    
    // 渲染回收站卡片
    listContainer.innerHTML = recycleBin.map(account => {
        const deletedTime = new Date(account.deletedAt).toLocaleString('zh-CN');
        return `
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <img src="gy.png" alt="光遇" class="w-10 h-10 rounded-full object-cover">
                        <div>
                            <div class="font-semibold text-gray-800">${account.gameName || '未知游戏'}</div>
                            <div class="text-sm text-gray-600">${account.server || '未设置区服'}</div>
                            <div class="text-xs text-gray-500 mt-1">删除时间: ${deletedTime}</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="restoreAccount(${account.id})" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg flex items-center transition duration-300 text-sm">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                            </svg>
                            恢复
                        </button>
                        <button onclick="permanentlyDeleteAccount(${account.id})" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg flex items-center transition duration-300 text-sm">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                            删除
                        </button>
                    </div>
                </div>
                <div class="mt-3 text-sm text-gray-600 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>手机: ${account.phone || '未设置'}</div>
                    <div>红蜡烛: ${account.redCandles || 0}</div>
                    <div>白蜡烛: ${account.whiteCandles || 0}</div>
                    <div>爱心: ${account.heartsCount || 0}</div>
                </div>
            </div>
        `;
    }).join('');
}

// 恢复账号
function restoreAccount(accountId) {
    const accountIndex = recycleBin.findIndex(a => a.id === accountId);
    if (accountIndex === -1) return;
    
    const account = recycleBin[accountIndex];
    delete account.deletedAt; // 删除删除时间标记
    
    // 恢复到账号列表
    accounts.push(account);
    saveAccounts();
    
    // 从回收站移除
    recycleBin.splice(accountIndex, 1);
    saveRecycleBin();
    
    // 刷新显示
    renderRecycleBin();
    updateStatistics();
    renderAccounts();
    
    showNotification('账号已恢复！', 'success');
}

// 永久删除账号
function permanentlyDeleteAccount(accountId) {
    if (!confirm('确定要永久删除该账号吗？此操作不可恢复！')) {
        return;
    }
    
    const accountIndex = recycleBin.findIndex(a => a.id === accountId);
    if (accountIndex === -1) return;
    
    recycleBin.splice(accountIndex, 1);
    saveRecycleBin();
    renderRecycleBin();
    
    showNotification('账号已永久删除！', 'success');
}

// 清空回收站
function clearRecycleBin() {
    if (!confirm('确定要清空回收站吗？所有账号将被永久删除！')) {
        return;
    }
    
    if (!confirm('再次确认：您确定要清空回收站吗？')) {
        return;
    }
    
    recycleBin = [];
    saveRecycleBin();
    renderRecycleBin();
    
    showNotification('回收站已清空！', 'success');
}

// 修改删除账号功能，改为移到回收站
function deleteAccount(accountId) {
    const accountIndex = accounts.findIndex(a => a.id === accountId);
    if (accountIndex === -1) return;
    
    if (!confirm('确定要删除该账号吗？账号将被移到回收站。')) {
        return;
    }
    
    const account = accounts[accountIndex];
    account.deletedAt = new Date().toISOString();
    
    // 移到回收站
    recycleBin.push(account);
    saveRecycleBin();
    
    // 从账号列表移除
    accounts.splice(accountIndex, 1);
    saveAccounts();
    
    // 刷新显示
    updateStatistics();
    renderAccounts();
    
    showNotification('账号已移到回收站！', 'success');
}

// 显示通知
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
