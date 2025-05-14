// 消息中心 JavaScript
// API 基础 URL
const API_BASE_URL = 'http://localhost:8080';

// 全局变量
let currentUser = null;
let chatsList = []; // 聊天列表
let notificationsList = []; // 通知列表
let currentChatId = null; // 当前选中的聊天ID
let currentTab = 'chats'; // 当前标签页：chats 或 notifications
let unreadCounts = {
    chats: 0,
    notifications: 0
};
let messageHistory = {}; // 存储各个聊天的消息历史 {chatId: [messages]}

// 临时模拟数据（用于展示界面，后续对接后端API后移除）
function initMockData() {
    chatsList = [
        {
            id: 'chat1',
            name: '张三',
            avatar: '👨',
            lastMessage: '你好，请问你有兴趣购买我发布的自行车吗？',
            lastMessageTime: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
            unreadCount: 2,
            online: true
        },
        {
            id: 'chat2',
            name: '李四',
            avatar: '👩',
            lastMessage: '好的，明天见！',
            lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            unreadCount: 0,
            online: false,
            lastSeen: new Date(Date.now() - 1000 * 60 * 30).toISOString()
        },
        {
            id: 'chat3',
            name: '校园互助群',
            avatar: '👥',
            lastMessage: '王五: 有人需要笔记本电脑充电器吗？',
            lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            unreadCount: 5,
            isGroup: true
        },
        {
            id: 'chat4',
            name: '系统消息',
            avatar: '🤖',
            lastMessage: '您的订单已完成',
            lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
            unreadCount: 0,
            isSystem: true
        }
    ];
    
    notificationsList = [
        {
            id: 'notification1',
            title: '订单完成通知',
            content: '您购买的商品"二手自行车"已完成交易，感谢您的使用！',
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            status: 'unread'
        },
        {
            id: 'notification2',
            title: '系统维护通知',
            content: '系统将于今晚22:00-23:00进行例行维护，请提前保存您的操作。',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
            status: 'read'
        },
        {
            id: 'notification3',
            title: '新功能上线',
            content: '校园互助平台新增了快递代取功能，欢迎使用！',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
            status: 'read'
        }
    ];
    
    messageHistory = {
        'chat1': [
            {
                id: 'msg1',
                content: '你好，我看到你在平台上发布了一个二手自行车出售的信息。',
                timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
                sender: { id: 'user2', name: '张三' },
                direction: 'received'
            },
            {
                id: 'msg2',
                content: '是的，请问你有兴趣吗？',
                timestamp: new Date(Date.now() - 1000 * 60 * 59).toISOString(),
                sender: currentUser,
                direction: 'sent',
                status: 'read'
            },
            {
                id: 'msg3',
                content: '有的，自行车是什么牌子的？使用多久了？',
                timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
                sender: { id: 'user2', name: '张三' },
                direction: 'received'
            },
            {
                id: 'msg4',
                content: '捷安特的，用了一年，保养得很好，几乎看不出使用痕迹。',
                timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
                sender: currentUser,
                direction: 'sent',
                status: 'read'
            },
            {
                id: 'msg5',
                content: '价格是多少？能不能再便宜一点？',
                timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
                sender: { id: 'user2', name: '张三' },
                direction: 'received'
            },
            {
                id: 'msg6',
                content: '你好，请问你有兴趣购买我发布的自行车吗？',
                timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
                sender: { id: 'user2', name: '张三' },
                direction: 'received'
            }
        ],
        'chat2': [
            {
                id: 'msg1',
                content: '你好，我想问一下你发布的笔记本电脑还在吗？',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
                sender: { id: 'user3', name: '李四' },
                direction: 'received'
            },
            {
                id: 'msg2',
                content: '在的，你什么时候方便看货？',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
                sender: currentUser,
                direction: 'sent',
                status: 'read'
            },
            {
                id: 'msg3',
                content: '明天下午三点可以吗？',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
                sender: { id: 'user3', name: '李四' },
                direction: 'received'
            },
            {
                id: 'msg4',
                content: '可以，我们在哪里见面？',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.5).toISOString(),
                sender: currentUser,
                direction: 'sent',
                status: 'read'
            },
            {
                id: 'msg5',
                content: '学校图书馆门口可以吗？',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.2).toISOString(),
                sender: { id: 'user3', name: '李四' },
                direction: 'received'
            },
            {
                id: 'msg6',
                content: '好的，明天见！',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
                sender: { id: 'user3', name: '李四' },
                direction: 'received'
            }
        ]
    };
    
    unreadCounts = {
        chats: 7,
        notifications: 1
    };
}

// 页面加载初始化
document.addEventListener('DOMContentLoaded', async () => {
    // 检查登录状态
    const token = localStorage.getItem('token');
    if (!token) {
        redirectToLogin('请先登录');
        return;
    }

    try {
        // 尝试获取用户信息
        currentUser = JSON.parse(localStorage.getItem('user'));
        if (!currentUser) {
            // 如果没有用户信息，设置一个默认用户（仅用于演示）
            currentUser = {
                id: 'currentUser',
                username: '当前用户',
                avatar: '👤'
            };
        }
        
        // 初始化事件监听器
        initEventListeners();
        
        // 加载聊天列表
        await loadChatList();
        
        // 更新未读计数
        updateUnreadBadges();

        // 检查是否有需要自动选中的聊天
        const selectedChatId = localStorage.getItem('selectedChatId');
        if (selectedChatId) {
            // 清除存储的聊天ID
            localStorage.removeItem('selectedChatId');
            
            // 确保聊天列表已加载
            if (chatsList.length > 0) {
                // 选中聊天
                await selectChat(selectedChatId);
            } else {
                console.log('聊天列表为空，无法选中聊天');
            }
        }
    } catch (error) {
        console.error('初始化失败:', error);
        showMessage('加载消息中心失败，请重试', 'error');
    }
});

// 辅助函数

// 格式化日期用于分组显示
function formatDateForGrouping(date) {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
        return '今天';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return '昨天';
    } else {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }
}

// 格式化消息时间显示
function formatMessageTime(date) {
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
        // 今天，显示时间
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 2) {
        // 昨天
        return '昨天 ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
        // 一周内，显示星期几
        const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return days[date.getDay()];
    } else {
        // 更早，显示日期
        return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
}

// 格式化完整日期
function formatDate(date) {
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 获取消息状态文本
function getMessageStatusText(status) {
    switch (status) {
        case 'sending':
            return '发送中...';
        case 'sent':
            return '已发送';
        case 'delivered':
            return '已送达';
        case 'read':
            return '已读';
        case 'failed':
            return '发送失败';
        default:
            return '';
    }
}

// 生成临时ID
function generateTempId() {
    return 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 滚动到消息容器底部
function scrollToBottom() {
    const messagesContainer = document.getElementById('messages-container');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 清空当前聊天记录
function clearCurrentChat() {
    if (!currentChatId) return;
    
    // 在实际应用中，这里应该调用API删除聊天记录
    // 此处为演示，仅清空本地数据
    messageHistory[currentChatId] = [];
    renderMessages([]);
    showMessage('聊天记录已清空', 'success');
}

// 过滤聊天列表
function filterChats(query) {
    if (!query) {
        if (currentTab === 'chats') {
            renderChatList(chatsList);
        } else {
            renderNotificationsList(notificationsList);
        }
        return;
    }
    
    query = query.toLowerCase();
    
    if (currentTab === 'chats') {
        const filteredChats = chatsList.filter(chat => 
            (chat.name && chat.name.toLowerCase().includes(query)) || 
            (chat.lastMessage && chat.lastMessage.toLowerCase().includes(query))
        );
        renderChatList(filteredChats);
    } else {
        const filteredNotifications = notificationsList.filter(notification => 
            (notification.title && notification.title.toLowerCase().includes(query)) || 
            (notification.content && notification.content.toLowerCase().includes(query))
        );
        renderNotificationsList(filteredNotifications);
    }
}

// 标记通知为已读
async function markNotificationAsRead(notificationId) {
    // 在实际应用中，这里应该调用API标记通知为已读
    // 此处为演示，仅更新本地数据
    const notificationIndex = notificationsList.findIndex(notification => notification.id === notificationId);
    if (notificationIndex >= 0 && notificationsList[notificationIndex].status === 'unread') {
        notificationsList[notificationIndex].status = 'read';
        unreadCounts.notifications--;
        updateUnreadBadges();
    }
}

// 全局函数（用于HTML onclick事件）
window.selectChat = selectChat;
window.viewNotification = viewNotification;
window.deleteChat = deleteChat;

// 初始化事件监听器
function initEventListeners() {
    // 标签切换
    const tabs = document.querySelectorAll('.chat-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
    
    // 聊天搜索
    const searchInput = document.getElementById('chat-search-input');
    searchInput.addEventListener('input', () => {
        filterChats(searchInput.value);
    });
    
    // 发送消息
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-btn');
    
    messageInput.addEventListener('input', () => {
        // 启用/禁用发送按钮
        sendButton.disabled = messageInput.value.trim() === '';
        
        // 自动调整文本框高度
        messageInput.style.height = 'auto';
        messageInput.style.height = (messageInput.scrollHeight > 150 ? 150 : messageInput.scrollHeight) + 'px';
    });
    
    messageInput.addEventListener('keydown', (e) => {
        // 按下 Enter 发送消息（不按 Shift）
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!sendButton.disabled) {
                sendMessage();
            }
        }
    });
    
    sendButton.addEventListener('click', sendMessage);
    
    // 清空聊天按钮
    document.getElementById('clear-chat-btn').addEventListener('click', () => {
        if (confirm('确定要清空此聊天记录吗？此操作不可恢复。')) {
            clearCurrentChat();
        }
    });
}

// 切换标签页
function switchTab(tabName) {
    if (currentTab === tabName) return;
    
    currentTab = tabName;
    
    // 更新标签状态
    document.querySelectorAll('.chat-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.chat-tab[data-tab="${tabName}"]`).classList.add('active');
    
    // 加载相应数据
    if (tabName === 'chats') {
        renderChatList(chatsList);
    } else if (tabName === 'notifications') {
        if (notificationsList.length === 0) {
            loadNotificationsList();
        } else {
            renderNotificationsList(notificationsList);
        }
    }
    
    // 清空搜索框
    document.getElementById('chat-search-input').value = '';
}

// 加载聊天列表
async function loadChatList() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    // 显示加载状态
    document.getElementById('chat-list').innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>加载中...</p>
        </div>
    `;
    
    try {
        const response = await fetch(`${API_BASE_URL}/messages/chats`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 更新聊天列表数据
        chatsList = data.chats || [];
        unreadCounts.chats = data.unreadCount || 0;
        
        // 渲染聊天列表
        renderChatList(chatsList);
        
        // 更新未读计数
        updateUnreadBadges();
    } catch (error) {
        console.error('加载聊天列表失败:', error);
        document.getElementById('chat-list').innerHTML = `
            <div class="empty-state">
                <p>加载聊天列表失败，请稍后重试</p>
                <p class="error-message">${error.message}</p>
            </div>
        `;
    }
}

// 加载通知列表
async function loadNotificationsList() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    // 显示加载状态
    document.getElementById('chat-list').innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>加载中...</p>
        </div>
    `;
    
    try {
        const response = await fetch(`${API_BASE_URL}/messages/notifications`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 更新通知列表数据
        notificationsList = data.notifications || [];
        unreadCounts.notifications = data.unreadCount || 0;
        
        // 渲染通知列表
        renderNotificationsList(notificationsList);
        
        // 更新未读计数
        updateUnreadBadges();
    } catch (error) {
        console.error('加载通知列表失败:', error);
        document.getElementById('chat-list').innerHTML = `
            <div class="empty-state">
                <p>加载通知列表失败，请稍后重试</p>
                <p class="error-message">${error.message}</p>
            </div>
        `;
    }
}

// 渲染聊天列表
function renderChatList(chats) {
    const chatListElement = document.getElementById('chat-list');
    
    if (!chats || chats.length === 0) {
        chatListElement.innerHTML = `
            <div class="empty-state">
                <p>暂无聊天记录</p>
                <p>开始寻找朋友聊天吧！</p>
            </div>
        `;
        return;
    }
    
    chatListElement.innerHTML = chats.map(chat => {
        const isUnread = chat.unreadCount > 0;
        const lastMessageTime = chat.lastMessageTime ? formatMessageTime(new Date(chat.lastMessageTime)) : '';
        const lastMessage = chat.lastMessage || '暂无消息';
        const avatar = chat.avatar || (chat.isGroup ? '👥' : '👤');
        
        return `
            <div class="chat-item ${isUnread ? 'unread' : ''} ${chat.id === currentChatId ? 'active' : ''}" 
                 data-id="${chat.id}" 
                 onclick="selectChat('${chat.id}')">
                <div class="chat-avatar ${chat.isSystem ? 'system-avatar' : ''}">
                    ${avatar}
                    ${chat.online ? '<div class="status"></div>' : ''}
                </div>
                <div class="chat-info">
                    <div class="chat-top-line">
                        <div class="chat-name">${chat.name || '未命名对话'}</div>
                        <div class="chat-time">${lastMessageTime}</div>
                    </div>
                    <div class="chat-last-msg">${lastMessage}</div>
                </div>
                ${isUnread ? `<div class="chat-unread-count chat-unread-position">${chat.unreadCount}</div>` : ''}
                <div class="chat-delete-btn" onclick="deleteChat(event, '${chat.id}')" title="删除聊天">×</div>
            </div>
        `;
    }).join('');
}

// 渲染通知列表
function renderNotificationsList(notifications) {
    const chatListElement = document.getElementById('chat-list');
    
    if (!notifications || notifications.length === 0) {
        chatListElement.innerHTML = `
            <div class="empty-state">
                <p>暂无系统通知</p>
            </div>
        `;
        return;
    }
    
    chatListElement.innerHTML = notifications.map(notification => {
        const isUnread = notification.status === 'unread';
        const time = formatMessageTime(new Date(notification.createdAt || Date.now()));
        
        return `
            <div class="chat-item ${isUnread ? 'unread' : ''}" 
                 data-id="${notification.id}" 
                 onclick="viewNotification('${notification.id}')">
                <div class="chat-avatar system-avatar">📢</div>
                <div class="chat-info">
                    <div class="chat-top-line">
                        <div class="chat-name">系统通知</div>
                        <div class="chat-time">${time}</div>
                    </div>
                    <div class="chat-last-msg">${notification.title || '无标题'}</div>
                </div>
                ${isUnread ? `<div class="chat-unread-count">●</div>` : ''}
            </div>
        `;
    }).join('');
}

// 选择聊天
async function selectChat(chatId) {
    // 如果选的是同一个聊天，不做任何操作
    if (chatId === currentChatId) return;
    
    currentChatId = chatId;
    
    // 更新选中状态
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`.chat-item[data-id="${chatId}"]`)?.classList.add('active');
    
    // 显示聊天界面
    document.getElementById('no-chat-selected').style.display = 'none';
    document.getElementById('chat-interface').style.display = 'flex';
    
    // 查找选中的聊天
    const selectedChat = chatsList.find(chat => chat.id === chatId);
    if (!selectedChat) {
        console.error('找不到选中的聊天:', chatId);
        return;
    }
    
    // 更新聊天界面
    updateChatHeader(selectedChat);
    
    // 加载或显示聊天消息
    if (messageHistory[chatId]) {
        renderMessages(messageHistory[chatId]);
    } else {
        await loadChatMessages(chatId);
    }
    
    // 标记为已读
    if (selectedChat.unreadCount > 0) {
        markChatAsRead(chatId);
    }
}

// 更新聊天头部信息
function updateChatHeader(chat) {
    document.getElementById('contact-avatar').innerHTML = chat.avatar || (chat.isGroup ? '👥' : '👤');
    document.getElementById('contact-name').textContent = chat.name || '未命名对话';
    document.getElementById('contact-status').textContent = chat.online ? '在线' : (chat.lastSeen ? `最后在线: ${formatDate(new Date(chat.lastSeen))}` : '');
}

// 加载聊天消息
async function loadChatMessages(chatId) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    // 显示加载状态
    document.getElementById('messages-container').innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>加载聊天记录中...</p>
        </div>
    `;
    
    try {
        const response = await fetch(`${API_BASE_URL}/messages/chats/${chatId}/messages`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 更新消息历史
        messageHistory[chatId] = data.messages || [];
        
        // 渲染消息
        renderMessages(messageHistory[chatId]);
    } catch (error) {
        console.error('加载消息失败:', error);
        document.getElementById('messages-container').innerHTML = `
            <div class="empty-state">
                <p>加载聊天记录失败，请稍后重试</p>
                <p class="error-message">${error.message}</p>
            </div>
        `;
    }
}

// 渲染消息列表
function renderMessages(messages) {
    const messagesContainer = document.getElementById('messages-container');
    
    if (!messages || messages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="empty-state">
                <p>暂无消息记录</p>
                <p>发送一条消息开始聊天吧！</p>
            </div>
        `;
        return;
    }
    
    // 按日期分组消息
    const messagesByDate = groupMessagesByDate(messages);
    
    // 渲染分组消息
    let html = '';
    for (const [date, msgs] of Object.entries(messagesByDate)) {
        html += `
            <div class="message-group">
                <div class="message-date">${date}</div>
                ${msgs.map(msg => renderMessageBubble(msg)).join('')}
            </div>
        `;
    }
    
    messagesContainer.innerHTML = html;
    
    // 滚动到底部
    scrollToBottom();
}

// 按日期分组消息
function groupMessagesByDate(messages) {
    const groups = {};
    
    messages.forEach(message => {
        const date = formatDateForGrouping(new Date(message.timestamp || message.createdAt || Date.now()));
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(message);
    });
    
    return groups;
}

// 渲染单个消息
function renderMessageBubble(message) {
    const isSent = message.sender?.id === currentUser?.id || message.direction === 'sent';
    const bubbleClass = isSent ? 'sent' : 'received';
    const time = formatMessageTime(new Date(message.timestamp || message.createdAt || Date.now()));
    
    const status = message.status ? `<div class="message-status">${getMessageStatusText(message.status)}</div>` : '';
    
    return `
        <div class="message-bubble ${bubbleClass}">
            ${message.content || ''}
            <div class="message-time">${time}</div>
            ${isSent ? status : ''}
        </div>
    `;
}

// 发送消息
async function sendMessage() {
    if (!currentChatId) return;
    
    const messageInput = document.getElementById('message-input');
    const content = messageInput.value.trim();
    
    if (!content) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    // 创建新消息对象
    const newMessage = {
        id: generateTempId(),
        content: content,
        timestamp: new Date().toISOString(),
        sender: currentUser,
        status: 'sending',
        direction: 'sent'
    };
    
    // 清空输入框
    messageInput.value = '';
    messageInput.style.height = 'auto';
    messageInput.focus();
    document.getElementById('send-btn').disabled = true;
    
    // 先添加消息到界面
    if (!messageHistory[currentChatId]) {
        messageHistory[currentChatId] = [];
    }
    messageHistory[currentChatId].push(newMessage);
    renderMessages(messageHistory[currentChatId]);
    
    try {
        const response = await fetch(`${API_BASE_URL}/messages/chats/${currentChatId}/send`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: content })
        });
        
        if (!response.ok) {
            throw new Error(`发送消息失败: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 更新消息状态为已发送
        const messageIndex = messageHistory[currentChatId].findIndex(msg => msg.id === newMessage.id);
        if (messageIndex >= 0) {
            messageHistory[currentChatId][messageIndex] = {
                ...messageHistory[currentChatId][messageIndex],
                id: data.id || messageHistory[currentChatId][messageIndex].id,
                status: 'sent',
                timestamp: data.timestamp || messageHistory[currentChatId][messageIndex].timestamp
            };
            renderMessages(messageHistory[currentChatId]);
        }
        
        // 更新聊天列表中的最后一条消息
        updateChatLastMessage(currentChatId, content);
    } catch (error) {
        console.error('发送消息失败:', error);
        
        // 更新消息状态为发送失败
        const messageIndex = messageHistory[currentChatId].findIndex(msg => msg.id === newMessage.id);
        if (messageIndex >= 0) {
            messageHistory[currentChatId][messageIndex].status = 'failed';
            renderMessages(messageHistory[currentChatId]);
        }
        
        showMessage('发送消息失败，请重试', 'error');
    }
}

// 更新聊天列表中的最后一条消息
function updateChatLastMessage(chatId, content) {
    const chatIndex = chatsList.findIndex(chat => chat.id === chatId);
    if (chatIndex >= 0) {
        chatsList[chatIndex].lastMessage = content;
        chatsList[chatIndex].lastMessageTime = new Date().toISOString();
        
        // 将此聊天移到列表顶部
        const chat = chatsList.splice(chatIndex, 1)[0];
        chatsList.unshift(chat);
        
        renderChatList(chatsList);
    }
}

// 查看通知详情
async function viewNotification(notificationId) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/messages/notifications/${notificationId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`获取通知详情失败: ${response.status}`);
        }
        
        const notificationData = await response.json();
        
        // 显示通知详情
        document.getElementById('no-chat-selected').style.display = 'none';
        document.getElementById('chat-interface').style.display = 'flex';
        
        // 更新通知界面
        document.getElementById('contact-avatar').innerHTML = '📢';
        document.getElementById('contact-avatar').className = 'contact-avatar system-avatar';
        document.getElementById('contact-name').textContent = '系统通知';
        document.getElementById('contact-status').textContent = new Date(notificationData.createdAt || Date.now()).toLocaleString();
        
        // 渲染通知内容
        document.getElementById('messages-container').innerHTML = `
            <div class="message-group">
                <div class="message-date">${formatDateForGrouping(new Date(notificationData.createdAt || Date.now()))}</div>
                <div class="message-bubble received">
                    <div style="font-weight: bold; margin-bottom: 5px;">${notificationData.title || '无标题'}</div>
                    ${notificationData.content || '无内容'}
                    <div class="message-time">${formatMessageTime(new Date(notificationData.createdAt || Date.now()))}</div>
                </div>
            </div>
        `;
        
        // 标记为已读
        if (notificationData.status === 'unread') {
            markNotificationAsRead(notificationId);
        }
    } catch (error) {
        console.error('获取通知详情失败:', error);
        showMessage('获取通知详情失败，请重试', 'error');
    }
}

// 标记聊天为已读
async function markChatAsRead(chatId) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/messages/chats/${chatId}/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`标记已读失败: ${response.status}`);
        }
        
        // 更新本地聊天状态
        const chatIndex = chatsList.findIndex(chat => chat.id === chatId);
        if (chatIndex >= 0) {
            const previousUnreadCount = chatsList[chatIndex].unreadCount || 0;
            chatsList[chatIndex].unreadCount = 0;
            unreadCounts.chats = Math.max(0, unreadCounts.chats - previousUnreadCount);
            
            renderChatList(chatsList);
            updateUnreadBadges();
        }
    } catch (error) {
        console.error('标记已读失败:', error);
    }
}

// 更新未读消息数量徽章
function updateUnreadBadges() {
    document.getElementById('notifications-badge').textContent = unreadCounts.notifications || 0;
    document.getElementById('chats-badge').textContent = unreadCounts.chats || 0;
    
    // 如果没有未读消息，隐藏徽章
    document.getElementById('notifications-badge').style.display = unreadCounts.notifications > 0 ? 'inline-block' : 'none';
    document.getElementById('chats-badge').style.display = unreadCounts.chats > 0 ? 'inline-block' : 'none';
}

// 显示消息通知
function showMessage(message, type = 'info', duration = 3000) {
    const messageElement = document.getElementById('message-notification');
    messageElement.textContent = message;
    messageElement.className = `message ${type}`;
    messageElement.style.display = 'block';
    
    // 自动关闭
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, duration);
}

// 重定向到登录页
function redirectToLogin(message = '请先登录') {
    localStorage.setItem('loginRedirectMessage', message);
    window.location.href = '../pages/login.html';
}

// 删除聊天
async function deleteChat(event, chatId) {
    // 阻止事件冒泡，避免触发选择聊天
    event.stopPropagation();
    
    if (!confirm('确定要删除这个聊天吗？')) {
        return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        // 显示删除中状态
        showMessage('正在删除聊天...', 'info');
        
        // 调用后端API删除聊天
        const response = await fetch(`${API_BASE_URL}/messages/chats/${chatId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`删除聊天失败: ${response.status}`);
        }
        
        // 更新本地状态
        const chatIndex = chatsList.findIndex(chat => chat.id === chatId);
        if (chatIndex >= 0) {
            // 更新未读计数
            if (chatsList[chatIndex].unreadCount > 0) {
                unreadCounts.chats = Math.max(0, unreadCounts.chats - chatsList[chatIndex].unreadCount);
            }
            
            // 从列表中移除
            chatsList.splice(chatIndex, 1);
            
            // 清除消息历史
            delete messageHistory[chatId];
            
            // 如果删除的是当前选中的聊天，则清空右侧区域
            if (chatId === currentChatId) {
                currentChatId = null;
                document.getElementById('chat-interface').style.display = 'none';
                document.getElementById('no-chat-selected').style.display = 'flex';
            }
            
            // 重新渲染列表
            renderChatList(chatsList);
            updateUnreadBadges();
            
            showMessage('聊天已删除', 'success');
        }
    } catch (error) {
        console.error('删除聊天失败:', error);
        showMessage('删除聊天失败，请重试', 'error');
    }
} 