// 数据存储
let accounts = [];
let notifications = [];
let deletedAccounts = [];
let currentMode = 'account'; // 当前模式

// 获取当前用户名
function getCurrentUser() {
    return sessionStorage.getItem('currentUser') || 'default';
}

// 获取当前用户的账号数据键名
function getUserAccountsKey() {
    return 'accounts_' + getCurrentUser();
}

// 获取当前用户的回收站数据键名
function getDeletedAccountsKey() {
    return 'deleted_accounts_' + getCurrentUser();
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    loadAccounts();
    loadDeletedAccounts();
    renderAccounts();
    renderRecycleBin();
    startCountdown();
    setupEventListeners();
    requestNotificationPermission();
    switchMode('account'); // 默认账号模式
});

// 切换模式
function switchMode(mode) {
    currentMode = mode;
    
    // 更新标签页样式
    document.querySelectorAll('.mode-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.mode === mode) {
            tab.classList.add('active');
        }
    });

    // 更新表单标题
    const titles = {
        'account': '添加新账号',
        'house': '添加租房信息',
        'car': '添加租车信息',
        'course': '添加课时信息'
    };
    document.getElementById('formTitle').textContent = titles[mode] || '添加';

    // 显示/隐藏对应字段
    document.getElementById('accountFields').style.display = mode === 'account' ? 'block' : 'none';
    document.getElementById('houseFields').style.display = mode === 'house' ? 'block' : 'none';
    document.getElementById('carFields').style.display = mode === 'car' ? 'block' : 'none';
    document.getElementById('courseFields').style.display = mode === 'course' ? 'block' : 'none';

    // 更新快捷按钮文字和时长标签
    const quickButtons = document.getElementById('quickButtons');
    const durationSettings = {
        'account': { label: '租期（分钟）', placeholder: '分钟', buttons: ['1小时', '1天', '1周', '1个月', '1年'], autoRentLabel: '立即出租', values: [60, 1440, 10080, 43200, 525600] },
        'house': { label: '租期（天数）', placeholder: '天数', buttons: ['1天', '1周', '1个月', '3个月', '1年'], autoRentLabel: '立即出租', values: [1, 7, 30, 90, 365] },
        'car': { label: '租期（天数）', placeholder: '天数', buttons: ['1天', '3天', '1周', '1个月', '3个月'], autoRentLabel: '立即出租', values: [1, 3, 7, 30, 90] },
        'course': { label: '课时数', placeholder: '课时', buttons: ['1课时', '5课时', '10课时', '20课时', '50课时'], autoRentLabel: '立即开始使用', values: [1, 5, 10, 20, 50] }
    };
    const settings = durationSettings[mode];
    
    document.getElementById('durationLabel').textContent = settings.label;
    document.getElementById('rentDuration').placeholder = settings.placeholder;
    document.getElementById('autoRentLabel').textContent = settings.autoRentLabel;
    
    const btns = quickButtons.querySelectorAll('button');
    btns.forEach((btn, i) => {
        btn.textContent = settings.buttons[i];
        btn.onclick = function() { setRentDuration(settings.values[i]); };
    });

    // 重置筛选
    document.getElementById('modeFilter').value = mode;
    renderAccounts();
}

// 按模式筛选
function filterByMode() {
    const mode = document.getElementById('modeFilter').value;
    if (mode !== 'all') {
        switchMode(mode);
    } else {
        currentMode = 'all';
        document.querySelectorAll('.mode-tab').forEach(tab => tab.classList.remove('active'));
        renderAccounts();
    }
}

// 请求通知权限
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// 发送系统通知
function sendSystemNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📱</text></svg>',
            tag: 'account-notification'
        });
    }
}

// 加载回收站数据
function loadDeletedAccounts() {
    try {
        const data = localStorage.getItem(getDeletedAccountsKey());
        deletedAccounts = data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('加载回收站失败:', e);
        deletedAccounts = [];
    }
}

// 保存回收站数据
function saveDeletedAccounts() {
    try {
        localStorage.setItem(getDeletedAccountsKey(), JSON.stringify(deletedAccounts));
    } catch (e) {
        console.error('保存回收站失败:', e);
    }
}

// 加载账号（按用户分开存储）
function loadAccounts() {
    try {
        const data = localStorage.getItem(getUserAccountsKey());
        accounts = data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('加载账号失败:', e);
        accounts = [];
    }
}

// 设置事件监听器
function setupEventListeners() {
    const accountForm = document.getElementById('accountForm');
    const statusFilter = document.getElementById('statusFilter');
    const modeFilter = document.getElementById('modeFilter');

    accountForm.addEventListener('submit', handleAddAccount);
    statusFilter.addEventListener('change', () => renderAccounts());
    if (modeFilter) {
        modeFilter.addEventListener('change', () => renderAccounts());
    }
}

// 快捷租用功能 - 设置租期
function setRentDuration(duration) {
    const rentDurationInput = document.getElementById('rentDuration');
    if (rentDurationInput) {
        rentDurationInput.value = duration;
    }
}

// 添加数据
function handleAddAccount(e) {
    e.preventDefault();

    const mode = currentMode;
    let newItem = {
        id: Date.now(),
        mode: mode,
        status: 'idle',
        rentEndTime: null,
        remainingTime: 0,
        createdAt: new Date().toISOString()
    };

    const rentDuration = parseInt(document.getElementById('rentDuration').value) || 0;
    const autoRent = document.getElementById('autoRent').checked;

    // 根据不同模式获取数据
    if (mode === 'account') {
        const accountName = document.getElementById('accountName').value.trim();
        const phoneNumber = document.getElementById('phoneNumber').value.trim();

        if (!accountName || !phoneNumber) {
            showNotification('请填写完整信息', 'error');
            return;
        }
        if (!/^1[3-9]\d{9}$/.test(phoneNumber)) {
            showNotification('请输入有效的手机号码', 'error');
            return;
        }
        newItem.name = accountName;
        newItem.phone = phoneNumber;
    } else if (mode === 'house') {
        const houseName = document.getElementById('houseName').value.trim();
        const houseIdCard = document.getElementById('houseIdCard').value.trim();
        const housePhone = document.getElementById('housePhone').value.trim();
        const houseAddress = document.getElementById('houseAddress').value.trim();

        if (!houseName || !housePhone || !houseAddress) {
            showNotification('请填写完整信息', 'error');
            return;
        }
        newItem.name = houseName;
        newItem.phone = housePhone;
        newItem.idCard = houseIdCard;
        newItem.address = houseAddress;
        newItem.deposit = document.getElementById('houseDeposit').value || '0';
        newItem.monthlyRent = document.getElementById('houseMonthlyRent').value || '0';
    } else if (mode === 'car') {
        const carModel = document.getElementById('carModel').value.trim();
        const carPlate = document.getElementById('carPlate').value.trim();
        const carPhone = document.getElementById('carPhone').value.trim();

        if (!carModel || !carPlate || !carPhone) {
            showNotification('请填写完整信息', 'error');
            return;
        }
        newItem.name = carModel;
        newItem.phone = carPhone;
        newItem.plate = carPlate;
        newItem.color = document.getElementById('carColor').value.trim();
        newItem.contactName = document.getElementById('carContactName').value.trim();
        newItem.wechat = document.getElementById('carWechat').value.trim();
        newItem.dailyRent = document.getElementById('carDailyRent').value || '0';
    } else if (mode === 'course') {
        const courseName = document.getElementById('courseName').value.trim();
        const courseStudent = document.getElementById('courseStudent').value.trim();
        const coursePhone = document.getElementById('coursePhone').value.trim();

        if (!courseName || !courseStudent || !coursePhone) {
            showNotification('请填写完整信息', 'error');
            return;
        }
        newItem.name = courseName;
        newItem.student = courseStudent;
        newItem.phone = coursePhone;
        newItem.totalHours = document.getElementById('courseTotal').value || '0';
        newItem.teacher = document.getElementById('courseTeacher').value.trim();
        newItem.price = document.getElementById('coursePrice').value || '0';
    }

    // 如果设置了时长且勾选立即使用
    if (autoRent && rentDuration > 0) {
        newItem.status = 'rented';
        newItem.rentEndTime = new Date(Date.now() + rentDuration * 60 * 1000).toISOString();
        newItem.remainingTime = rentDuration * 60;
    }

    accounts.push(newItem);
    saveAccounts();
    renderAccounts();

    // 清空表单
    e.target.reset();
    document.getElementById('rentDuration').value = '0';

    const modeNames = { 'account': '账号', 'house': '租房', 'car': '租车', 'course': '课时' };
    const message = newItem.status === 'rented'
        ? `${modeNames[mode]} ${newItem.name} 添加成功并已出租${rentDuration}分钟`
        : `${modeNames[mode]}添加成功`;
    showNotification(message, 'success');
}

// 渲染列表
function renderAccounts() {
    const accountsList = document.getElementById('accountsList');
    const statusFilter = document.getElementById('statusFilter').value;
    const modeFilter = document.getElementById('modeFilter').value;

    let filteredAccounts = accounts;

    // 按模式筛选
    if (modeFilter !== 'all') {
        filteredAccounts = filteredAccounts.filter(account => account.mode === modeFilter);
    }
    // 按状态筛选
    if (statusFilter !== 'all') {
        filteredAccounts = filteredAccounts.filter(account => account.status === statusFilter);
    }

    if (filteredAccounts.length === 0) {
        accountsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <div class="empty-state-text">暂无数据，请添加</div>
            </div>
        `;
        return;
    }

    accountsList.innerHTML = filteredAccounts.map(account => {
        const statusInfo = getStatusInfo(account.status);
        const timeDisplay = formatTime(account.remainingTime);
        const mode = account.mode || 'account';
        
        // 根据模式获取图标和名称
        const modeIcons = { 'account': '📱', 'house': '🏠', 'car': '🚗', 'course': '📚' };
        const modeNames = { 'account': '账号', 'house': '租房', 'car': '租车', 'course': '课时' };
        
        // 获取详细信息
        let details = '';
        let actionText = '出租';
        
        if (mode === 'account') {
            details = account.phone ? `<div class="account-phone">📱 ${escapeHtml(account.phone)} <button class="btn-copy" onclick="copyPhone('${account.phone}')" title="复制">📋</button></div>` : '';
            actionText = '出租';
        } else if (mode === 'house') {
            details = `
                <div class="info-row"><span class="info-label">身份证</span><span class="info-value">${escapeHtml(account.idCard || '-')}</span></div>
                <div class="info-row"><span class="info-label">地址</span><span class="info-value">${escapeHtml(account.address || '-')}</span></div>
                <div class="info-row"><span class="info-label">押金</span><span class="info-value">¥${account.deposit || '0'}</span></div>
                <div class="info-row"><span class="info-label">月租</span><span class="info-value">¥${account.monthlyRent || '0'}</span></div>
            `;
            actionText = '出租';
        } else if (mode === 'car') {
            details = `
                <div class="info-row"><span class="info-label">车牌</span><span class="info-value">${escapeHtml(account.plate || '-')}</span></div>
                <div class="info-row"><span class="info-label">颜色</span><span class="info-value">${escapeHtml(account.color || '-')}</span></div>
                <div class="info-row"><span class="info-label">联系人</span><span class="info-value">${escapeHtml(account.contactName || '-')}</span></div>
                <div class="info-row"><span class="info-label">微信</span><span class="info-value">${escapeHtml(account.wechat || '-')}</span></div>
                <div class="info-row"><span class="info-label">日租金</span><span class="info-value">¥${account.dailyRent || '0'}/天</span></div>
            `;
            actionText = '出租';
        } else if (mode === 'course') {
            const usedHours = account.remainingTime ? Math.floor((parseInt(account.totalHours || 0) * 3600 - account.remainingTime) / 3600) : 0;
            const totalHours = parseInt(account.totalHours || 0);
            details = `
                <div class="info-row"><span class="info-label">学员</span><span class="info-value">${escapeHtml(account.student || '-')}</span></div>
                <div class="info-row"><span class="info-label">老师</span><span class="info-value">${escapeHtml(account.teacher || '-')}</span></div>
                <div class="info-row"><span class="info-label">已用/总课时</span><span class="info-value">${usedHours}/${totalHours}</span></div>
                <div class="info-row"><span class="info-label">价格</span><span class="info-value">¥${account.price || '0'}</span></div>
            `;
            actionText = '使用';
        }

        // 根据模式获取按钮文字
        let returnText = '归还';
        if (mode === 'course') {
            returnText = '完成';
        }

        const phone = account.phone || '';
        return `
            <div class="account-card status-${account.status}" data-id="${account.id}">
                <div class="account-card-header">
                    <div>
                        <div class="account-name">${modeIcons[mode]} ${escapeHtml(account.name)} <span class="mode-badge">${modeNames[mode]}</span></div>
                        ${details}
                    </div>
                    <span class="status-badge">${statusInfo.text}</span>
                </div>
                <div class="account-info">
                    ${account.status !== 'idle' ? `
                        <div class="info-row">
                            <span class="info-label">剩余${mode === 'course' ? '课时' : '时间'}</span>
                            <span class="info-value time-remaining" id="time-${account.id}">${timeDisplay}</span>
                        </div>
                        ${account.rentEndTime ? `
                            <div class="info-row">
                                <span class="info-label">到期时间</span>
                                <span class="info-value">${formatDateTime(account.rentEndTime)}</span>
                            </div>
                        ` : ''}
                    ` : `
                        <div class="info-row">
                            <span class="info-label">状态</span>
                            <span class="info-value">空闲中，可${actionText}</span>
                        </div>
                    `}
                </div>
                <div class="account-actions">
                    ${account.status === 'idle' ? `
                        <button class="btn btn-small btn-rent" onclick="rentAccount(${account.id})">${actionText}</button>
                    ` : ''}
                    ${account.status === 'rented' || account.status === 'expiring' ? `
                        <button class="btn btn-small btn-extend" onclick="extendRent(${account.id})">${mode === 'course' ? '加课' : '续费'}</button>
                        <button class="btn btn-small btn-return" onclick="returnAccount(${account.id})">${returnText}</button>
                    ` : ''}
                    ${account.status === 'expired' ? `
                        <button class="btn btn-small btn-rent" onclick="rentAccount(${account.id})">重新${actionText}</button>
                    ` : ''}
                    <button class="btn btn-small btn-edit" onclick="editAccountName(${account.id})">修改</button>
                    <button class="btn btn-small btn-delete" onclick="deleteAccount(${account.id})">删除</button>
                </div>
            </div>
        `;
    }).join('');
}

// 出租账号 - 显示快捷选择弹窗
function rentAccount(accountId) {
    const account = accounts.find(a => a.id === accountId);
    if (!account) {
        return;
    }

    const mode = account.mode || 'account';

    // 根据模式设置不同的选项
    let title, prompt, options, placeholder;
    if (mode === 'course') {
        title = '开始使用 - ' + escapeHtml(account.name);
        prompt = '请选择课时数：';
        options = [
            { value: 1, text: '1课时' },
            { value: 5, text: '5课时' },
            { value: 10, text: '10课时' },
            { value: 20, text: '20课时' },
            { value: 50, text: '50课时' }
        ];
        placeholder = '自定义课时数';
    } else if (mode === 'house') {
        title = '出租房屋 - ' + escapeHtml(account.name);
        prompt = '请选择租期：';
        options = [
            { value: 1440, text: '1天' },
            { value: 10080, text: '1周' },
            { value: 43200, text: '1个月' },
            { value: 129600, text: '3个月' },
            { value: 525600, text: '1年' }
        ];
        placeholder = '自定义天数（分钟）';
    } else if (mode === 'car') {
        title = '出租车辆 - ' + escapeHtml(account.name);
        prompt = '请选择租期：';
        options = [
            { value: 1440, text: '1天' },
            { value: 4320, text: '3天' },
            { value: 10080, text: '1周' },
            { value: 43200, text: '1个月' },
            { value: 129600, text: '3个月' }
        ];
        placeholder = '自定义天数（分钟）';
    } else {
        title = '出租账号 - ' + escapeHtml(account.name);
        prompt = '请选择租期：';
        options = [
            { value: 60, text: '1小时' },
            { value: 1440, text: '1天' },
            { value: 10080, text: '1周' },
            { value: 43200, text: '1个月' },
            { value: 525600, text: '1年' }
        ];
        placeholder = '自定义分钟数';
    }

    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'rentModal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>${title}</h3>
            <p>${prompt}</p>
            <div class="quick-options">
                ${options.map(opt => `<button onclick="confirmRent(${account.id}, ${opt.value})">${opt.text}</button>`).join('')}
            </div>
            <div class="custom-input">
                <input type="number" id="customRentDuration" placeholder="${placeholder}" min="1">
                <button onclick="confirmCustomRent(${account.id})">确定</button>
            </div>
            <button class="cancel-btn" onclick="closeRentModal()">取消</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// 确认出租
function confirmRent(accountId, duration) {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;

    const mode = account.mode || 'account';

    account.status = 'rented';
    account.rentEndTime = new Date(Date.now() + duration * 60 * 1000).toISOString();
    account.remainingTime = duration * 60;

    saveAccounts();
    renderAccounts();
    closeRentModal();

    const timeText = mode === 'course' ? `${duration}课时` : getDurationText(duration);
    const actionText = mode === 'course' ? '已开始使用' : '已出租';
    const itemName = mode === 'course' ? '课程' : (mode === 'house' ? '房屋' : (mode === 'car' ? '车辆' : '账号'));
    showNotification(`${itemName} ${account.name} ${actionText} ${timeText}`, 'success');
}

// 确认自定义租期
function confirmCustomRent(accountId) {
    const input = document.getElementById('customRentDuration');
    const duration = parseInt(input.value);

    if (!duration || duration <= 0) {
        showNotification('请输入有效的租期', 'error');
        return;
    }

    confirmRent(accountId, duration);
}

// 关闭出租弹窗
function closeRentModal() {
    const modal = document.getElementById('rentModal');
    if (modal) {
        modal.remove();
    }
}

// 获取时长文本
function getDurationText(minutes) {
    if (minutes >= 525600) {
        const years = Math.floor(minutes / 525600);
        return `${years}年`;
    } else if (minutes >= 43200) {
        const months = Math.floor(minutes / 43200);
        return `${months}个月`;
    } else if (minutes >= 10080) {
        const weeks = Math.floor(minutes / 10080);
        return `${weeks}周`;
    } else if (minutes >= 1440) {
        const days = Math.floor(minutes / 1440);
        return `${days}天`;
    } else if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        return `${hours}小时`;
    }
    return `${minutes}分钟`;
}

// 续费/加课 - 显示快捷选择弹窗
function extendRent(accountId) {
    const account = accounts.find(a => a.id === accountId);
    if (!account) {
        return;
    }

    const mode = account.mode || 'account';
    const isCourse = mode === 'course';

    // 根据模式设置不同的选项
    let title, prompt, prompt2, options, placeholder;
    if (isCourse) {
        title = '加课 - ' + escapeHtml(account.name);
        const usedHours = account.remainingTime ? Math.floor((parseInt(account.totalHours || 0) * 3600 - account.remainingTime) / 3600) : 0;
        prompt = `已用课时：${usedHours}，剩余课时：${Math.floor(account.remainingTime / 3600)}`;
        prompt2 = '请选择加课数量：';
        options = [
            { value: 1, text: '1课时' },
            { value: 5, text: '5课时' },
            { value: 10, text: '10课时' },
            { value: 20, text: '20课时' },
            { value: 50, text: '50课时' }
        ];
        placeholder = '自定义课时数';
    } else if (mode === 'house') {
        title = '续租房屋 - ' + escapeHtml(account.name);
        prompt = `当前剩余时间：${formatTime(account.remainingTime)}`;
        prompt2 = '请选择续租时长：';
        options = [
            { value: 1440, text: '1天' },
            { value: 10080, text: '1周' },
            { value: 43200, text: '1个月' },
            { value: 129600, text: '3个月' },
            { value: 525600, text: '1年' }
        ];
        placeholder = '自定义天数（分钟）';
    } else if (mode === 'car') {
        title = '续租车辆 - ' + escapeHtml(account.name);
        prompt = `当前剩余时间：${formatTime(account.remainingTime)}`;
        prompt2 = '请选择续租时长：';
        options = [
            { value: 1440, text: '1天' },
            { value: 4320, text: '3天' },
            { value: 10080, text: '1周' },
            { value: 43200, text: '1个月' },
            { value: 129600, text: '3个月' }
        ];
        placeholder = '自定义天数（分钟）';
    } else {
        title = '续费账号 - ' + escapeHtml(account.name);
        prompt = `当前剩余时间：${formatTime(account.remainingTime)}`;
        prompt2 = '请选择续费时长：';
        options = [
            { value: 60, text: '1小时' },
            { value: 1440, text: '1天' },
            { value: 10080, text: '1周' },
            { value: 43200, text: '1个月' },
            { value: 525600, text: '1年' }
        ];
        placeholder = '自定义分钟数';
    }

    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'extendModal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>${title}</h3>
            <p>${prompt}</p>
            <p>${prompt2}</p>
            <div class="quick-options">
                ${options.map(opt => `<button onclick="confirmExtend(${account.id}, ${opt.value})">${opt.text}</button>`).join('')}
            </div>
            <div class="custom-input">
                <input type="number" id="customExtendDuration" placeholder="${placeholder}" min="1">
                <button onclick="confirmCustomExtend(${account.id})">确定</button>
            </div>
            <button class="cancel-btn" onclick="closeExtendModal()">取消</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// 确认续费
function confirmExtend(accountId, duration) {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;

    const currentTime = account.rentEndTime ? new Date(account.rentEndTime) : new Date();
    account.rentEndTime = new Date(currentTime.getTime() + duration * 60 * 1000).toISOString();
    account.remainingTime += duration * 60;
    account.status = 'rented';

    saveAccounts();
    renderAccounts();
    closeExtendModal();

    const timeText = getDurationText(duration);
    showNotification(`账号 ${account.name} 已续费 ${timeText}，总剩余时间：${formatTime(account.remainingTime)}`, 'success');
}

// 确认自定义续费
function confirmCustomExtend(accountId) {
    const input = document.getElementById('customExtendDuration');
    const duration = parseInt(input.value);

    if (!duration || duration <= 0) {
        showNotification('请输入有效的续费时长', 'error');
        return;
    }

    confirmExtend(accountId, duration);
}

// 关闭续费弹窗
function closeExtendModal() {
    const modal = document.getElementById('extendModal');
    if (modal) {
        modal.remove();
    }
}

// 归还账号 / 完成使用
function returnAccount(accountId) {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;

    const mode = account.mode || 'account';
    const confirmText = mode === 'course' ? '确定要完成使用吗？' : '确定要归还该账号吗？';
    const successText = mode === 'course' ? `课程 ${account.name} 已完成使用` : `账号 ${account.name} 已归还`;

    if (!confirm(confirmText)) return;

    if (account) {
        account.status = 'idle';
        account.rentEndTime = null;
        account.remainingTime = 0;

        saveAccounts();
        renderAccounts();
        showNotification(successText, 'success');
    }
}

// 删除账号（移到回收站）
function deleteAccount(accountId) {
    if (!confirm('确定要删除该账号吗？账号将被移到回收站。')) return;

    // 找到要删除的账号
    const accountToDelete = accounts.find(a => a.id === accountId);
    if (!accountToDelete) return;

    // 添加到回收站（记录删除时间）
    accountToDelete.deletedAt = new Date().toISOString();
    deletedAccounts.push(accountToDelete);
    saveDeletedAccounts();

    // 从正常列表中移除
    accounts = accounts.filter(a => a.id !== accountId);
    saveAccounts();
    renderAccounts();
    renderRecycleBin();
    showNotification('账号已移到回收站', 'success');
}

// 恢复账号
function restoreAccount(accountId) {
    const accountToRestore = deletedAccounts.find(a => a.id === accountId);
    if (!accountToRestore) return;

    // 移除删除时间
    delete accountToRestore.deletedAt;

    // 恢复到正常列表
    accounts.push(accountToRestore);
    deletedAccounts = deletedAccounts.filter(a => a.id !== accountId);

    saveAccounts();
    saveDeletedAccounts();
    renderAccounts();
    renderRecycleBin();
    showNotification(`账号 ${accountToRestore.name} 已恢复`, 'success');
}

// 彻底删除账号
function permanentlyDeleteAccount(accountId) {
    if (!confirm('确定要彻底删除该账号吗？此操作不可恢复！')) return;

    deletedAccounts = deletedAccounts.filter(a => a.id !== accountId);
    saveDeletedAccounts();
    renderRecycleBin();
    showNotification('账号已彻底删除', 'success');
}

// 清空回收站
function emptyRecycleBin() {
    if (!confirm('确定要清空回收站吗？所有账号将被彻底删除！')) return;

    deletedAccounts = [];
    saveDeletedAccounts();
    renderRecycleBin();
    showNotification('回收站已清空', 'success');
}

// 渲染回收站
function renderRecycleBin() {
    const recycleBinList = document.getElementById('recycleBinList');
    if (!recycleBinList) return;

    if (deletedAccounts.length === 0) {
        recycleBinList.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">回收站是空的</p>';
        return;
    }

    recycleBinList.innerHTML = deletedAccounts.map(account => `
        <div class="account-card status-deleted" data-id="${account.id}">
            <div class="account-card-header">
                <div>
                    <div class="account-name">${escapeHtml(account.name)}</div>
                    <div class="account-phone">
                            📱 <span>${escapeHtml(account.phone)}</span>
                            <button class="btn-copy" onclick="copyPhone('${account.phone}')" title="复制手机号">📋</button>
                        </div>
                </div>
                <span class="status-badge status-deleted-badge">已删除</span>
            </div>
            <div class="account-info">
                <div class="info-row">
                    <span class="info-label">删除时间</span>
                    <span class="info-value">${formatDateTime(account.deletedAt)}</span>
                </div>
            </div>
            <div class="account-actions">
                <button class="btn btn-small btn-restore" onclick="restoreAccount(${account.id})">恢复</button>
                <button class="btn btn-small btn-delete" onclick="permanentlyDeleteAccount(${account.id})">彻底删除</button>
            </div>
        </div>
    `).join('');
}

// 开始倒计时
function startCountdown() {
    setInterval(() => {
        let needRender = false;

        accounts.forEach(account => {
            if (account.status === 'rented' || account.status === 'expiring') {
                if (account.rentEndTime) {
                    const endTime = new Date(account.rentEndTime);
                    const now = new Date();
                    const diff = Math.max(0, Math.floor((endTime - now) / 1000));

                    const oldStatus = account.status;

                    account.remainingTime = diff;

                    // 实时更新时间显示
                    const timeElement = document.getElementById(`time-${account.id}`);
                    if (timeElement) {
                        timeElement.textContent = formatTime(account.remainingTime);
                    }

                    if (diff === 0) {
                        account.status = 'expired';
                        showNotification(`账号 ${account.name} 已到期！`, 'warning');
                        sendSystemNotification('账号到期', `账号 ${account.name} 已到期！`);
                        needRender = true;
                    } else if (diff <= 300 && account.status === 'rented') {
                        account.status = 'expiring';
                        if (!notifications.includes(account.id)) {
                            showNotification(`账号 ${account.name} 即将到期，剩余 ${formatTime(diff)}`, 'warning');
                            sendSystemNotification('账号即将到期', `账号 ${account.name} 将在 ${formatTime(diff)} 后到期`);
                            notifications.push(account.id);
                        }
                        needRender = true;
                    }

                    if (oldStatus !== account.status) {
                        needRender = true;
                    }
                }
            }
        });

        if (needRender) {
            renderAccounts();
        }

        notifications = notifications.filter(id => {
            const account = accounts.find(a => a.id === id);
            return account && account.status !== 'expired';
        });
    }, 1000);
}

// 获取状态信息
function getStatusInfo(status) {
    const statusMap = {
        'idle': { text: '空闲', class: 'success' },
        'rented': { text: '出租中', class: 'primary' },
        'expiring': { text: '即将到期', class: 'warning' },
        'expired': { text: '已到期', class: 'error' }
    };
    return statusMap[status] || { text: '未知', class: 'default' };
}

// 格式化时间
function formatTime(seconds) {
    if (seconds <= 0) return '0分钟';

    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const secs = seconds % 60;

    let result = '';
    if (days > 0) result += `${days}天 `;
    if (hours > 0) result += `${hours}小时 `;
    if (minutes > 0) result += `${minutes}分钟 `;
    if (secs > 0 && !days && !hours) result += `${secs}秒`;

    return result.trim() || '0秒';
}

// 格式化日期时间
function formatDateTime(isoString) {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 保存账号到本地存储（按用户分开存储）
function saveAccounts() {
    try {
        localStorage.setItem(getUserAccountsKey(), JSON.stringify(accounts));
    } catch (e) {
        console.error('保存账号失败:', e);
    }
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

// HTML转义防止XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 复制手机号到剪贴板
function copyPhone(phone) {
    navigator.clipboard.writeText(phone).then(() => {
        showNotification('手机号已复制到剪贴板', 'success');
    }).catch(err => {
        // 兼容旧浏览器
        const input = document.createElement('input');
        input.value = phone;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        showNotification('手机号已复制到剪贴板', 'success');
    });
}

// 修改信息（所有字段）
function editAccountName(accountId) {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;

    const mode = account.mode || 'account';
    const modeNames = { 'account': '账号', 'house': '租房', 'car': '租车', 'course': '课时' };
    
    // 根据不同模式生成表单字段
    let fieldsHtml = '';
    
    if (mode === 'account') {
        fieldsHtml = `
            <div class="form-group">
                <label>名称</label>
                <input type="text" id="editName" value="${escapeHtml(account.name || '')}">
            </div>
            <div class="form-group">
                <label>手机号</label>
                <input type="tel" id="editPhone" value="${escapeHtml(account.phone || '')}">
            </div>
        `;
    } else if (mode === 'house') {
        fieldsHtml = `
            <div class="form-group">
                <label>租客姓名</label>
                <input type="text" id="editName" value="${escapeHtml(account.name || '')}">
            </div>
            <div class="form-group">
                <label>身份证号</label>
                <input type="text" id="editIdCard" value="${escapeHtml(account.idCard || '')}">
            </div>
            <div class="form-group">
                <label>联系电话</label>
                <input type="tel" id="editPhone" value="${escapeHtml(account.phone || '')}">
            </div>
            <div class="form-group">
                <label>租房地址</label>
                <input type="text" id="editAddress" value="${escapeHtml(account.address || '')}">
            </div>
            <div class="form-group">
                <label>押金（元）</label>
                <input type="number" id="editDeposit" value="${account.deposit || '0'}">
            </div>
            <div class="form-group">
                <label>月租金（元）</label>
                <input type="number" id="editMonthlyRent" value="${account.monthlyRent || '0'}">
            </div>
        `;
    } else if (mode === 'car') {
        fieldsHtml = `
            <div class="form-group">
                <label>车子型号</label>
                <input type="text" id="editName" value="${escapeHtml(account.name || '')}">
            </div>
            <div class="form-group">
                <label>车牌号</label>
                <input type="text" id="editPlate" value="${escapeHtml(account.plate || '')}">
            </div>
            <div class="form-group">
                <label>车辆颜色</label>
                <input type="text" id="editColor" value="${escapeHtml(account.color || '')}">
            </div>
            <div class="form-group">
                <label>联系人</label>
                <input type="text" id="editContactName" value="${escapeHtml(account.contactName || '')}">
            </div>
            <div class="form-group">
                <label>联系电话</label>
                <input type="tel" id="editPhone" value="${escapeHtml(account.phone || '')}">
            </div>
            <div class="form-group">
                <label>微信号</label>
                <input type="text" id="editWechat" value="${escapeHtml(account.wechat || '')}">
            </div>
            <div class="form-group">
                <label>日租金（元）</label>
                <input type="number" id="editDailyRent" value="${account.dailyRent || '0'}">
            </div>
        `;
    } else if (mode === 'course') {
        fieldsHtml = `
            <div class="form-group">
                <label>课程名称</label>
                <input type="text" id="editName" value="${escapeHtml(account.name || '')}">
            </div>
            <div class="form-group">
                <label>学员姓名</label>
                <input type="text" id="editStudent" value="${escapeHtml(account.student || '')}">
            </div>
            <div class="form-group">
                <label>联系电话</label>
                <input type="tel" id="editPhone" value="${escapeHtml(account.phone || '')}">
            </div>
            <div class="form-group">
                <label>总课时数</label>
                <input type="number" id="editTotalHours" value="${account.totalHours || '0'}">
            </div>
            <div class="form-group">
                <label>授课老师</label>
                <input type="text" id="editTeacher" value="${escapeHtml(account.teacher || '')}">
            </div>
            <div class="form-group">
                <label>课程价格（元）</label>
                <input type="number" id="editPrice" value="${account.price || '0'}">
            </div>
        `;
    }

    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'editModal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>修改${modeNames[mode]}信息</h3>
            <form id="editForm">
                ${fieldsHtml}
                <div class="modal-actions">
                    <button type="button" class="cancel-btn" onclick="closeEditModal()">取消</button>
                    <button type="submit" class="btn btn-primary">保存</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    // 提交表单
    document.getElementById('editForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 更新数据
        if (mode === 'account') {
            account.name = document.getElementById('editName').value.trim();
            account.phone = document.getElementById('editPhone').value.trim();
        } else if (mode === 'house') {
            account.name = document.getElementById('editName').value.trim();
            account.idCard = document.getElementById('editIdCard').value.trim();
            account.phone = document.getElementById('editPhone').value.trim();
            account.address = document.getElementById('editAddress').value.trim();
            account.deposit = document.getElementById('editDeposit').value;
            account.monthlyRent = document.getElementById('editMonthlyRent').value;
        } else if (mode === 'car') {
            account.name = document.getElementById('editName').value.trim();
            account.plate = document.getElementById('editPlate').value.trim();
            account.color = document.getElementById('editColor').value.trim();
            account.contactName = document.getElementById('editContactName').value.trim();
            account.phone = document.getElementById('editPhone').value.trim();
            account.wechat = document.getElementById('editWechat').value.trim();
            account.dailyRent = document.getElementById('editDailyRent').value;
        } else if (mode === 'course') {
            account.name = document.getElementById('editName').value.trim();
            account.student = document.getElementById('editStudent').value.trim();
            account.phone = document.getElementById('editPhone').value.trim();
            account.totalHours = document.getElementById('editTotalHours').value;
            account.teacher = document.getElementById('editTeacher').value.trim();
            account.price = document.getElementById('editPrice').value;
        }

        saveAccounts();
        renderAccounts();
        closeEditModal();
        showNotification(`${modeNames[mode]}信息已修改`, 'success');
    });
}

// 关闭编辑弹窗
function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.remove();
    }
}

// 退出登录
function logout() {
    if (!confirm('确定要退出登录吗？')) return;
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// 显示当前用户
function displayCurrentUser() {
    const display = document.getElementById('currentUserDisplay');
    if (display) {
        const user = getCurrentUser();
        display.textContent = `当前用户: ${user}`;
    }
}

// 检查登录状态
function checkLogin() {
    const currentUser = sessionStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'login.html';
    }
}

// 显示数据存储路径
function displayDataPath() {
    const pathElement = document.getElementById('dataStoragePath');
    if (pathElement) {
        pathElement.textContent = '浏览器 localStorage (应用数据)';
    }
}

// 页面加载时检查登录
checkLogin();
displayCurrentUser();
displayDataPath();
