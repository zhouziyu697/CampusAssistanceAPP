// 在文件顶部添加调试功能
const DEBUG_AUTH = false; // 禁用认证调试

// 定义API基础URL
const API_BASE_URL = 'http://localhost:8080/api';

// 全局变量
let currentUser = null;

// 分页配置
const PAGE_SIZE = 5; // 每页显示的数量

// 分页状态对象
const paginationState = {
    published: { currentPage: 1, totalPages: 1 },
    favorites: { currentPage: 1, totalPages: 1 },
    history: { currentPage: 1, totalPages: 1 },
    drafts: { currentPage: 1, totalPages: 1 },
    purchased: { currentPage: 1, totalPages: 1 },
    wanted: { currentPage: 1, totalPages: 1 },
    orders: { currentPage: 1, totalPages: 1 },
    sold: { currentPage: 1, totalPages: 1 }  // 添加sold分区的分页状态
};

// 更新分页UI
function updatePagination(section, currentPage, totalPages) {
    const pagination = document.getElementById(`${section}-pagination`);
    if (!pagination) return;

    const prevButton = pagination.querySelector('.prev-page');
    const nextButton = pagination.querySelector('.next-page');
    const currentPageSpan = pagination.querySelector('.current-page');

    prevButton.disabled = currentPage <= 1;
    nextButton.disabled = currentPage >= totalPages;
    currentPageSpan.textContent = currentPage;

    // 更新分页状态
    paginationState[section].currentPage = currentPage;
    paginationState[section].totalPages = totalPages;
}

// 加载分页数据
function loadPageData(section, page) {
    const token = localStorage.getItem('token');
    if (!token) return;

    const listContainer = document.querySelector(`.${section}-list`);
    if (listContainer) {
        listContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    }

    // 特殊处理orders部分，因为后端接口暂未实现
    if (section === 'orders') {
        if (listContainer) {
            listContainer.innerHTML = `<div class="notice-state">订单功能即将上线，敬请期待</div>`;
        }
        updatePagination(section, 1, 1);
        return;
    }
    
    const url = `${API_BASE_URL}/profile/${section}?page=${page-1}&size=${PAGE_SIZE}`;

    fetch(url, {
            headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (!data) {
            throw new Error('No data received from server');
        }

        // 根据不同的响应格式处理数据
        const items = Array.isArray(data) ? data : (data.items || []);
        const total = Array.isArray(data) ? items.length : (data.total || 0);
        const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

        if (listContainer) {
            if (items.length === 0) {
                listContainer.innerHTML = `<div class="empty-state">暂无${getSectionName(section)}数据</div>`;
            } else {
                listContainer.innerHTML = items.map(item => renderListItem(item, section)).join('');
            }
        }

        updatePagination(section, page, totalPages);
    })
    .catch(error => {
        if (listContainer) {
            listContainer.innerHTML = `<div class="error-state">加载失败，请刷新重试</div>`;
        }
        updatePagination(section, 1, 1);
    });
}

// 渲染列表项
function renderListItem(item, section) {
    // 防止item为undefined或null
    if (!item) return '';

    switch(section) {
        case 'published':
            return renderPublishedItem(item);
        case 'favorites':
            return renderFavoriteItem(item);
        case 'history':
            return renderHistoryItem(item);
        case 'drafts':
            return renderDraftItem(item);
        case 'purchased':
            return renderPurchasedItem(item);
        case 'wanted':
            return renderWantedItem(item);
        case 'orders':
            return renderOrderItem(item);
        default:
            return '';
    }
}

// 渲染各种类型的列表项
function renderPublishedItem(item) {
    if (!item) return '';
    return `
        <div class="list-item published-item">
            <div class="item-content">
                <h3>${item.title || '无标题'}</h3>
                <p class="item-price">¥${(item.price || 0).toFixed(2)}</p>
                <p class="item-date">发布时间：${formatDate(item.createTime || new Date())}</p>
                <p class="item-status">状态：${getStatusText(item.status)}</p>
            </div>
        </div>
    `;
}

function renderFavoriteItem(item) {
    if (!item) return '';
    return `
        <div class="list-item favorite-item">
            <div class="item-content">
                <h3>${item.title || '无标题'}</h3>
                <p class="item-price">¥${(item.price || 0).toFixed(2)}</p>
                <p class="item-date">收藏时间：${formatDate(item.favoriteTime || new Date())}</p>
            </div>
        </div>
    `;
}

function renderHistoryItem(item) {
    if (!item) return '';
    return `
        <div class="list-item history-item">
            <div class="item-content">
                <h3>${item.title || '无标题'}</h3>
                <p class="item-price">¥${(item.price || 0).toFixed(2)}</p>
                <p class="item-date">浏览时间：${formatDate(item.viewTime || new Date())}</p>
            </div>
        </div>
    `;
}

function renderDraftItem(item) {
    if (!item) return '';
    return `
        <div class="list-item draft-item">
            <div class="item-content">
                <h3>${item.title || '无标题草稿'}</h3>
                <p class="item-date">最后保存：${formatDate(item.updateTime || new Date())}</p>
            </div>
        </div>
    `;
}

function renderPurchasedItem(item) {
    if (!item) return '';
    return `
        <div class="list-item purchased-item">
            <div class="item-content">
                <h3>${item.title || '无标题'}</h3>
                <p class="item-price">¥${(item.price || 0).toFixed(2)}</p>
                <p class="item-date">购买时间：${formatDate(item.purchaseTime || new Date())}</p>
            </div>
        </div>
    `;
}

function renderWantedItem(item) {
    if (!item) return '';
    return `
        <div class="list-item wanted-item">
            <div class="item-content">
                <h3>${item.title || '无标题'}</h3>
                <p class="item-price">期望价格：¥${(item.expectedPrice || 0).toFixed(2)}</p>
                <p class="item-date">发布时间：${formatDate(item.createTime || new Date())}</p>
            </div>
        </div>
    `;
}

// 修改订单相关的处理函数
function renderOrderItem(item) {
    if (!item) return '';
    
    // 添加更多订单状态的处理
    const statusClass = {
        'pending': 'status-pending',
        'paid': 'status-paid',
        'shipped': 'status-shipped',
        'completed': 'status-completed',
        'cancelled': 'status-cancelled'
    }[item.status] || 'status-unknown';

    return `
        <div class="list-item order-item ${statusClass}">
            <div class="item-content">
                <h3>${item.title || '未命名订单'}</h3>
                <p class="item-price">¥${(item.totalAmount || 0).toFixed(2)}</p>
                <p class="item-date">订单时间：${formatDate(item.createTime || new Date())}</p>
                <p class="item-status">状态：${getOrderStatusText(item.status)}</p>
                ${item.status === 'pending' ? `
                    <button class="btn-pay" onclick="handlePayOrder('${item.id}')">立即支付</button>
                ` : ''}
            </div>
        </div>
    `;
}

// 格式化日期
function formatDate(date) {
    if (!date) return '未知时间';
    return new Date(date).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 获取状态文本
function getStatusText(status) {
    const statusMap = {
        'active': '在售',
        'sold': '已售出',
        'withdrawn': '已下架',
        'draft': '草稿'
    };
    return statusMap[status] || '未知状态';
}

// 获取订单状态文本
function getOrderStatusText(status) {
    const statusMap = {
        'pending': '待付款',
        'paid': '已付款',
        'shipped': '已发货',
        'completed': '已完成',
        'cancelled': '已取消'
    };
    return statusMap[status] || '未知状态';
}

// 获取分区名称
function getSectionName(section) {
    const sectionNames = {
        published: '发布',
        favorites: '收藏',
        history: '历史浏览',
        drafts: '草稿',
        purchased: '已购买',
        wanted: '想要',
        orders: '订单'
    };
    return sectionNames[section] || section;
}

// 在文件顶部定义一个标志变量，跟踪分页事件是否已绑定
let isPaginationInitialized = false;

// 初始化分页事件监听 - 使用事件委托
function initPagination() {
    console.log('初始化分页事件...');
    
    // 如果已经初始化过，则跳过
    if (isPaginationInitialized) {
        console.log('分页事件已经初始化，跳过');
        return;
    }
    
    // 记录当前分页状态，以便调试
    console.log('当前分页状态:', JSON.stringify(paginationState));
    
    // 使用事件委托，将事件监听器绑定到整个文档
    document.addEventListener('click', function(e) {
        // 检查点击的是否是分页按钮
        if (e.target && (e.target.classList.contains('prev-page') || e.target.classList.contains('next-page'))) {
            // 阻止默认行为
            e.preventDefault();
            e.stopPropagation();
            
            // 找到所属的分页区域
            const paginationElement = e.target.closest('.pagination');
            if (!paginationElement) {
                console.warn('找不到分页容器，无法确定所属分区');
                return;
            }
            
            const section = paginationElement.id.replace('-pagination', '');
            console.log(`===== 点击${section}分区的${e.target.classList.contains('prev-page') ? '上一页' : '下一页'}按钮 =====`);
            
            // 根据按钮类型确定是上一页还是下一页
            const isNextPage = e.target.classList.contains('next-page');
            const currentPage = paginationState[section].currentPage;
            const totalPages = paginationState[section].totalPages;
            
            console.log(`分区: ${section}, 当前页: ${currentPage}, 总页数: ${totalPages}, 点击: ${isNextPage ? '下一页' : '上一页'}`);
            
            // 检查是否可以翻页
            if (isNextPage && currentPage < totalPages) {
                const newPage = currentPage + 1;
                console.log(`${section}分页 - 下一页: ${newPage}`);
                
                try {
                    handlePageChange(section, newPage);
                    console.log(`翻页成功: ${section} -> 第${newPage}页`);
                } catch(err) {
                    console.error('翻页出错:', err);
                    showMessage('翻页出错，请刷新页面重试', 'error');
                }
            } 
            else if (!isNextPage && currentPage > 1) {
                const newPage = currentPage - 1;
                console.log(`${section}分页 - 上一页: ${newPage}`);
                
                try {
                    handlePageChange(section, newPage);
                    console.log(`翻页成功: ${section} -> 第${newPage}页`);
                } catch(err) {
                    console.error('翻页出错:', err);
                    showMessage('翻页出错，请刷新页面重试', 'error');
                }
            }
            else {
                console.log(`${section}分页 - 无法翻页，当前页: ${currentPage}, 总页数: ${totalPages}`);
            }
        }
    });
    
    // 标记为已初始化
    isPaginationInitialized = true;
    console.log('分页事件初始化完成（事件委托模式）');
}

// 处理页面切换
function handlePageChange(section, newPage) {
    // 针对特殊处理的历史浏览和收藏分区
    if (section === 'history') {
        paginationState.history.currentPage = newPage;
        // 重新应用当前的筛选条件
        const timeFilter = document.getElementById('history-time-filter')?.value || 'all';
        const typeFilter = document.getElementById('history-type-filter')?.value || 'all';
        filterHistoryByTime(timeFilter, historyItems, typeFilter);
    } 
    else if (section === 'favorites') {
        paginationState.favorites.currentPage = newPage;
        // 重新应用当前的筛选条件
        const typeFilter = document.getElementById('favorites-type-filter')?.value || 'all';
        filterFavoritesByType(favoritesItems, typeFilter);
    } 
    else {
        // 其他分区使用loadSection
        loadSection(section, newPage);
    }
}

// 在页面加载完成后初始化分页
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成，初始化分页...');
    
    // 初始化分页
    initPagination();
    
    // 初始化各个分区
    const sections = ['published', 'favorites', 'history', 'drafts', 'purchased', 'wanted', 'sold'];
    const token = localStorage.getItem('token');
    
    if (token) {
        // 使用统一的loadSection函数加载第一页数据
        sections.forEach(section => loadSection(section, 1));
    }
    
    // 绑定切换分区事件
    const sectionLinks = document.querySelectorAll('.sidebar a[data-section]');
    sectionLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const section = this.getAttribute('data-section');
            if (section && sections.includes(section)) {
                // 切换分区时重新加载第一页
                loadSection(section, 1);
            }
        });
    });
});

// 注入基本样式以确保页面正常显示
function injectBasicStyles() {
    console.log('注入基本样式');
    
    // 检查是否已存在样式
    if (document.getElementById('profile-emergency-styles')) {
        return;
    }
    
    const styleEl = document.createElement('style');
    styleEl.id = 'profile-emergency-styles';
    styleEl.textContent = `
        /* 基本页面布局 */
        .profile-container {
            display: flex;
            max-width: 1200px;
            margin: 20px auto;
            min-height: 600px;
            font-family: Arial, sans-serif;
        }
        
        /* 侧边栏样式 - 固定宽度 */
        .profile-sidebar, .sidebar {
            min-width: 250px;
            width: 250px;
            flex-shrink: 0;
            background: #f5f5f5;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        /* 用户信息样式 */
        .user-info {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #ddd;
        }
        
        .avatar {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background-color: #2196F3;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 15px;
            font-size: 36px;
        }
        
        .user-info h2 {
            margin: 10px 0 5px;
            font-size: 18px;
        }
        
        .user-info p {
            margin: 5px 0;
            color: #666;
            font-size: 14px;
        }
        
        /* 导航菜单样式 */
        .profile-nav ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .profile-nav li {
            margin-bottom: 5px;
        }
        
        .profile-nav a {
            display: block;
            padding: 10px;
            color: #333;
            text-decoration: none;
            border-radius: 4px;
            transition: background-color 0.2s;
        }
        
        .profile-nav a:hover,
        .profile-nav a.active {
            background-color: #e0e0e0;
        }
        
        /* 内容区域样式 */
        .profile-content {
            flex: 1;
            padding: 20px;
            background: #fff;
            border-radius: 5px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin-left: 20px;
        }
        
        /* 内容标题 */
        .content-section h2 {
            margin-top: 0;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
            font-size: 20px;
        }
        
        /* 列表项样式 */
        .content-section {
            display: none;
        }
        
        .content-section.active {
            display: block;
        }
        
        /* 消息提示样式 */
        .message {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 4px;
            color: white;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
        
        .message.info {
            background-color: #2196F3;
        }
        
        .message.success {
            background-color: #4CAF50;
        }
        
        .message.warning {
            background-color: #FF9800;
        }
        
        .message.error {
            background-color: #F44336;
        }
        
        /* 按钮样式 */
        button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s;
        }
        
        .btn-primary {
            background-color: #2196F3;
            color: white;
        }
        
        .btn-primary:hover {
            background-color: #1976D2;
        }
        
        .btn-secondary {
            background-color: #f5f5f5;
            color: #333;
            border: 1px solid #ddd;
        }
        
        .btn-secondary:hover {
            background-color: #e0e0e0;
        }
        
        /* 表单样式 */
        .account-form {
            max-width: 500px;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        
        .form-group input {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        
        .form-actions {
            margin-top: 20px;
            display: flex;
            gap: 10px;
        }
        
        /* 空状态提示 */
        .empty-state {
            text-align: center;
            padding: 30px;
            color: #999;
            background: #f9f9f9;
            border-radius: 4px;
            border: 1px dashed #ddd;
            margin: 20px 0;
        }
        
        /* 列表项样式 - 使用CSS中定义的统一样式 */
        .sold-item, .message-item, .history-item, .draft-item {
            padding: 15px;
            border: 1px solid #eee;
            border-radius: 4px;
            margin-bottom: 15px;
            background: #fff;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        
        .sold-item h3, .history-item h3, .draft-item h3 {
            margin-top: 0;
            margin-bottom: 10px;
            font-size: 18px;
        }
        
        .sold-item p, .history-item p, .draft-item p, .message-content {
            margin: 10px 0;
            color: #666;
        }
        
        .sold-actions, .message-actions, .draft-actions {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }
        
        /* 响应式调整 */
        @media (max-width: 768px) {
            .profile-container {
                flex-direction: column;
            }
            
            .profile-sidebar {
                width: 100%;
                margin-bottom: 20px;
            }
            
            .profile-content {
                margin-left: 0;
            }
        }
    `;
    
    document.head.appendChild(styleEl);
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    console.log('个人中心页面加载完成');
    
    // 检查登录状态
    await checkProfileAuthStatus();
    
    // 检查是否是本地登录
    const isLocalLogin = localStorage.getItem('localLogin') === 'true';
    if (isLocalLogin) {
        console.log('检测到本地登录状态');
        showMessage('您当前使用的是本地验证登录，部分功能可能受限', 'warning', 5000);
    }
    
    // 确保页面基本结构存在
    createBasicPageStructure();
    
    // 确保所有必要的内容区域存在
    createContentSections();
    
    // 初始化事件监听器
    initEventListeners();
    
    // 加载用户信息
    await loadUserInfo();
    
    // 添加服务器连接检查
    const serverConnected = await checkServerConnection();
    if (!serverConnected) {
        showMessage('无法连接到服务器，部分功能可能受限', 'warning', 5000);
    }
});

// 创建基本页面结构
function createBasicPageStructure() {
    console.log('检查并创建基本页面结构');
    
    // 检查页面容器是否存在
    let profileContainer = document.querySelector('.profile-container');
    if (!profileContainer) {
        console.log('创建页面主容器');
        profileContainer = document.createElement('div');
        profileContainer.className = 'profile-container';
        
        // 添加到body
        document.body.appendChild(profileContainer);
    }
    
    // 检查侧边栏是否存在
    let sidebar = document.querySelector('.profile-sidebar') || document.querySelector('.sidebar');
    if (!sidebar) {
        console.log('创建侧边栏');
        sidebar = document.createElement('div');
        sidebar.className = 'profile-sidebar sidebar';
        
        // 创建用户信息区域
        const userInfo = document.createElement('div');
        userInfo.className = 'user-info';
        
        // 创建头像区域
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        userInfo.appendChild(avatar);
        
        // 创建用户名显示
        const username = document.createElement('h2');
        username.id = 'username';
        username.textContent = '加载中...';
        userInfo.appendChild(username);
        
        // 创建学号显示
        const studentId = document.createElement('p');
        studentId.id = 'student-id';
        studentId.textContent = '学号：加载中...';
        userInfo.appendChild(studentId);
        
        // 创建邮箱显示
        const email = document.createElement('p');
        email.id = 'email';
        email.textContent = '邮箱：加载中...';
        userInfo.appendChild(email);
        
        sidebar.appendChild(userInfo);
        
        // 创建导航菜单
        const nav = document.createElement('nav');
        nav.className = 'profile-nav';
        
        const navList = document.createElement('ul');
        
        // 定义导航项
        const navItems = [
            { id: 'account', text: '账号管理' },
            { id: 'history', text: '浏览历史' },
            { id: 'drafts', text: '草稿箱' },
            { id: 'favorites', text: '我的收藏' },
            { id: 'purchased', text: '已购买商品' },
            { id: 'wanted', text: '我的求购' },
            { id: 'published', text: '我发布的商品' },
            { id: 'sold', text: '已售出商品' }
        ];
        
        // 创建导航项
        navItems.forEach(item => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#${item.id}`;
            a.setAttribute('data-section', item.id);
            a.textContent = item.text;
            li.appendChild(a);
            navList.appendChild(li);
        });
        
        nav.appendChild(navList);
        sidebar.appendChild(nav);
        
        // 创建退出按钮
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logoutBtn';
        logoutBtn.className = 'btn-secondary';
        logoutBtn.textContent = '退出登录';
        sidebar.appendChild(logoutBtn);
        
        // 添加到主容器
        profileContainer.appendChild(sidebar);
    }
    
    // 检查内容区域是否存在
    let content = document.querySelector('.profile-content');
    if (!content) {
        console.log('创建内容区域');
        content = document.createElement('div');
        content.className = 'profile-content';
        
        // 添加到主容器
        profileContainer.appendChild(content);
    }
    
    // 检查消息显示区域是否存在
    let messageElement = document.getElementById('message');
    if (!messageElement) {
        console.log('创建消息显示区域');
        messageElement = document.createElement('div');
        messageElement.id = 'message';
        messageElement.className = 'message';
        messageElement.style.display = 'none';
        
        // 添加到body，确保它在最上层
        document.body.appendChild(messageElement);
    }
}

// 创建内容区域并添加到页面
function createContentSections() {
    console.log('创建内容区域');
    
    // 检查profile-container是否存在，如果不存在则创建
    let profileContainer = document.querySelector('.profile-container');
    if (!profileContainer) {
        console.log('创建.profile-container元素');
        profileContainer = document.createElement('div');
        profileContainer.className = 'profile-container';
        
        // 寻找主内容区域添加container
        const main = document.querySelector('main');
        if (main) {
            main.appendChild(profileContainer);
        } else {
            document.body.appendChild(profileContainer);
        }
    }
    
    // 检查profile-sidebar是否存在，如果不存在则创建
    let profileSidebar = profileContainer.querySelector('.profile-sidebar');
    if (!profileSidebar) {
        console.log('创建.profile-sidebar元素');
        profileSidebar = document.createElement('div');
        profileSidebar.className = 'profile-sidebar';
        
        // 添加用户信息区
        const userInfo = document.createElement('div');
        userInfo.className = 'user-info';
        userInfo.innerHTML = `
            <div class="avatar">头像</div>
            <h2>加载中...</h2>
            <p>学号: 加载中...</p>
        `;
        
        // 添加导航菜单
        const nav = document.createElement('nav');
        nav.className = 'profile-nav';
        nav.innerHTML = `
            <ul>
                <li><a href="#account" class="active">账号信息</a></li>
                <li><a href="#published">我发布的</a></li>
                <li><a href="#wanted">我的需求</a></li>
                <li><a href="#sold">已卖出</a></li>
                <li><a href="#purchased">已买到</a></li>
                <li><a href="#favorites">我的收藏</a></li>
                <li><a href="#history">浏览历史</a></li>
                <li><a href="#drafts">我的草稿</a></li>
            </ul>
        `;
        
        profileSidebar.appendChild(userInfo);
        profileSidebar.appendChild(nav);
        profileContainer.appendChild(profileSidebar);
    }
    
    // 检查profile-content是否存在，如果不存在则创建
    let profileContent = profileContainer.querySelector('.profile-content');
    if (!profileContent) {
        console.log('创建.profile-content元素');
        profileContent = document.createElement('div');
        profileContent.className = 'profile-content';
        profileContainer.appendChild(profileContent);
    }
    
    // 内容区域添加各个部分
    const sections = [
        { id: 'account', title: '账号信息' },
        { id: 'published', title: '我发布的' },
        { id: 'wanted', title: '我的需求' },
        { id: 'sold', title: '已卖出' },
        { id: 'purchased', title: '已买到' },
        { id: 'favorites', title: '我的收藏' },
        { id: 'history', title: '浏览历史' },
        { id: 'drafts', title: '我的草稿' }
    ];
    
    // 检查是否已创建内容区域
    if (profileContent.querySelector('.content-section')) {
        console.log('内容区域已存在，跳过创建');
        return;
    }
    
    // 创建各个内容部分
    sections.forEach(section => {
        const sectionElement = document.createElement('div');
        sectionElement.className = `content-section ${section.id}-section`;
        sectionElement.id = `${section.id}-section`;
        
        // 只有账号信息部分默认显示
        if (section.id === 'account') {
            sectionElement.classList.add('active');
        }
        
        // 添加标题
        sectionElement.innerHTML = `<h2>${section.title}</h2>`;
        
        // 根据不同部分添加不同内容
        if (section.id === 'account') {
            sectionElement.innerHTML += `
                <div class="account-form">
                    <div class="form-group">
                        <label for="username">用户名</label>
                        <input type="text" id="username" disabled>
                    </div>
                    <div class="form-group">
                        <label for="studentId">学号</label>
                        <input type="text" id="studentId" disabled>
                    </div>
                    <div class="form-group">
                        <label for="email">邮箱</label>
                        <input type="email" id="email">
                    </div>
                    <div class="form-group">
                        <label for="phone">手机号</label>
                        <input type="tel" id="phone">
                    </div>
                    <div class="form-actions">
                        <button class="btn-primary" id="save-profile">保存修改</button>
                    </div>
                </div>
            `;
        } else {
            // 其他部分先添加空状态提示
            sectionElement.innerHTML += `
                <div class="empty-state" id="${section.id}-empty">
                    <p>暂无${section.title}内容</p>
                </div>
                <div id="${section.id}-list" class="${section.id}-list"></div>
                
                <!-- 添加统一的分页控件 -->
                <div class="pagination" id="${section.id}-pagination">
                    <button class="prev-page">上一页</button>
                    <span class="page-info">第 <span class="current-page">1</span> 页</span>
                    <button class="next-page">下一页</button>
                </div>
            `;
        }
        
        profileContent.appendChild(sectionElement);
        
        // 为每个分页控件添加样式
        const style = document.createElement('style');
        style.textContent = `
            .pagination {
                display: flex;
                justify-content: center;
                align-items: center;
                margin-top: 20px;
                padding: 10px 0;
            }
            
            .pagination button {
                background-color: #f0f0f0;
                border: 1px solid #ddd;
                padding: 5px 15px;
                margin: 0 5px;
                cursor: pointer;
                border-radius: 3px;
            }
            
            .pagination button:hover {
                background-color: #e0e0e0;
            }
            
            .pagination button:disabled {
                background-color: #f9f9f9;
                color: #ccc;
                cursor: not-allowed;
            }
            
            .page-info {
                margin: 0 15px;
            }
            
            .current-page {
                font-weight: bold;
            }
        `;
        
        if (!document.getElementById('pagination-styles')) {
            style.id = 'pagination-styles';
            document.head.appendChild(style);
        }
    });
}

// 检查登录状态 - 重命名避免与auth.js冲突
async function checkProfileAuthStatus() {
    const token = localStorage.getItem('token');
    const currentPage = window.location.pathname;
    
    // 如果当前已在个人中心页面，则不重定向
    if (currentPage.includes('profile.html')) {
        console.log('已在个人中心页面，不执行重定向');
        return;
    }
    
    if (token) {
        console.log('检测到已登录状态，跳转到主页');
        window.location.href = '../pages/index.html';
    } else {
        // 未登录状态的处理
        // ...
    }
}

// 初始化事件监听器
function initEventListeners() {
    console.log('初始化事件监听器');
    
    // 导航菜单点击事件
    const navLinks = document.querySelectorAll('.sidebar a, .profile-sidebar a');
    if (navLinks.length > 0) {
        navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            switchSection(targetId);
        });
    });
    } else {
        console.warn('找不到导航链接，无法绑定点击事件');
    }
    
    // 清空浏览历史按钮
    const clearHistoryBtn = document.getElementById('clear-history');
    if (clearHistoryBtn) {
        console.log('找到清空历史记录按钮，添加点击事件监听器');
        clearHistoryBtn.addEventListener('click', clearBrowseHistory);
    } else {
        console.warn('找不到清空历史记录按钮，无法绑定点击事件');
    }

    // 添加头像更换按钮事件监听
    const changeAvatarBtn = document.querySelector('.change-avatar');
    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', handleAvatarChange);
    }
    
    // 创建隐藏的文件上传输入
    if (!document.getElementById('avatarUpload')) {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'avatarUpload';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        fileInput.addEventListener('change', handleAvatarFileSelected);
        document.body.appendChild(fileInput);
    }

    // 退出登录按钮
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    } else {
        console.warn('找不到退出登录按钮，无法绑定点击事件');
        
        // 尝试创建退出按钮
        const sidebar = document.querySelector('.sidebar') || document.querySelector('.profile-sidebar');
        if (sidebar) {
            const newLogoutBtn = document.createElement('button');
            newLogoutBtn.id = 'logoutBtn';
            newLogoutBtn.className = 'btn-secondary';
            newLogoutBtn.textContent = '退出登录';
            newLogoutBtn.addEventListener('click', handleLogout);
            sidebar.appendChild(newLogoutBtn);
            console.log('已创建并添加退出按钮');
        }
    }

    // 账号管理表单提交
    const accountForm = document.getElementById('accountForm');
    if (accountForm) {
        console.log('找到账号表单，添加提交事件监听器');
        accountForm.addEventListener('submit', handleAccountUpdate);
    } else {
        console.warn('未找到账号表单，尝试检查账号区域');
        
        // 检查账号区域是否存在
        const accountSection = document.getElementById('account-section');
        if (accountSection) {
            // 如果账号区域存在但没有表单，创建基本的账号表单
            console.log('创建基本账号表单');
            createAccountForm(accountSection);
        }
    }
    
    // 设置初始激活的标签页
    const hash = window.location.hash.substring(1) || 'account';
    switchSection(hash);
}

// 创建账号表单
function createAccountForm(container) {
    if (!container) return;
    
    // 检查是否已存在表单
    if (container.querySelector('#accountForm')) return;
    
    console.log('创建账号管理表单');
    
    const form = document.createElement('form');
    form.id = 'accountForm';
    form.className = 'account-form';
    
    // 表单内容
    form.innerHTML = `
        <div class="form-group">
            <label for="update-username">用户名</label>
            <input type="text" id="update-username" name="username" placeholder="请输入新用户名">
        </div>
        <div class="form-group">
            <label for="update-email">邮箱</label>
            <input type="email" id="update-email" name="email" placeholder="请输入新邮箱">
        </div>
        <div class="form-group">
            <label for="currentPassword">当前密码</label>
            <input type="password" id="currentPassword" name="currentPassword" placeholder="输入当前密码以验证身份">
        </div>
        <div class="form-group">
            <label for="password">新密码</label>
            <input type="password" id="password" name="password" placeholder="留空表示不修改密码">
        </div>
        <div class="form-group">
            <label for="confirmPassword">确认新密码</label>
            <input type="password" id="confirmPassword" name="confirmPassword" placeholder="再次输入新密码">
        </div>
        <div class="form-actions">
            <button type="submit" class="btn-primary">保存修改</button>
            <button type="reset" class="btn-secondary">重置</button>
        </div>
    `;
    
    container.appendChild(form);
    
    // 绑定提交事件
    form.addEventListener('submit', handleAccountUpdate);
}

// 加载用户信息
async function loadUserInfo() {
    const token = localStorage.getItem('token');
    console.log('尝试加载用户信息，token是否存在:', token ? '存在' : '不存在');
    
    // 检查localStorage中是否有用户信息
    const localUser = localStorage.getItem('user');
    if (localUser) {
        try {
            const userData = JSON.parse(localUser);
            console.log('从localStorage获取到用户信息:', userData);
            
            // 直接使用本地存储的用户信息
            updateUserInfo(userData);
            showMessage('已加载用户信息', 'success');
            
            // 尝试从服务器获取最新信息，但不影响现有功能
            tryServerSync();
        } catch (e) {
            console.error('解析本地用户信息失败:', e);
        }
    } else {
        // 如果没有本地用户信息
        showMessage('未找到用户信息，请重新登录', 'error');
        setTimeout(() => {
            window.location.href = '/pages/login.html';
        }, 2000);
    }
}

// 尝试与服务器同步
async function tryServerSync() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('没有找到token，跳过服务器同步');
        return;
    }

    console.log('发送请求到服务器，使用Token:', token.substring(0, 20) + '...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            mode: 'cors',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('从服务器获取到用户信息:', data);
        
        // 更新本地存储和界面
        localStorage.setItem('user', JSON.stringify(data));
        updateUserInfo(data);
        showMessage('已从服务器同步最新信息', 'success');
    } catch (error) {
        console.error('服务器同步失败:', error);
        showMessage('无法从服务器同步信息，将使用本地数据', 'warning');
    }
}

// 添加自动刷新令牌功能
async function autoRefreshToken(studentId) {
    try {
        console.log('尝试获取新令牌...');
        
        // 如果没有保存的密码，提示用户输入
        const password = prompt("请输入密码以重新获取认证令牌：");
        if (!password) {
            console.log('用户取消了密码输入');
            return;
        }
        
        // 尝试登录获取新令牌
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                studentId: studentId,
                password: password
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.token) {
                // 保存新令牌
                localStorage.setItem('token', data.token);
                
                // 可选：保存用户数据（如果API返回）
                if (data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
                
                showMessage('认证已更新，重新加载页面', 'success');
                
                // 刷新页面以使用新令牌
                setTimeout(() => window.location.reload(), 1500);
            } else {
                showMessage('登录成功但未返回令牌', 'error');
            }
        } else {
            showMessage('无法获取新令牌，请手动重新登录', 'error');
        }
    } catch (e) {
        console.error('获取新令牌过程中出错:', e);
        showMessage('获取新令牌过程中出错', 'error');
    }
}

// 从服务器获取用户信息
function fetchUserInfoFromServer(token) {
    let url = `${API_BASE_URL}/profile`;
    console.log('尝试请求用户信息URL:', url);
    console.log('使用token:', token);
    
    // 调用API获取用户信息
    return fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`, // 确保格式正确
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest' // 添加这个以帮助某些框架识别
        },
        mode: 'cors',
        credentials: 'include'
    })
    .then(response => {
        console.log('服务器响应状态:', response.status, response.statusText);
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                // 尝试重新获取token并重试
                return refreshTokenAndRetry(url);
            }
            
            return response.text().then(text => {
                console.log('服务器错误响应:', text);
                throw new Error(`获取用户信息失败: ${response.status} ${text}`);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('用户信息加载成功:', data);
        
        // 将获取的最新数据保存到localStorage
        localStorage.setItem('user', JSON.stringify(data));
        
        // 更新用户信息显示
        updateUserInfo(data);
        showMessage('用户信息已从服务器更新', 'success');
        return data;
    })
    .catch(error => {
        console.error('从服务器加载用户信息失败:', error);
        return null;
    });
}

// 添加刷新token函数
async function refreshTokenAndRetry(url) {
    // 获取用户信息
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        throw new Error('无法获取用户信息');
    }
    
    const user = JSON.parse(userStr);
    const studentId = user.studentId;
    
    console.log('尝试使用学号重新获取token:', studentId);
    
    // 假设用户使用过的密码是正确的
    const passwordFromStorage = prompt('请输入密码以重新认证', '');
    if (!passwordFromStorage) {
        throw new Error('用户取消了认证');
    }
    
    // 尝试重新登录获取新token
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            studentId: studentId,
            password: passwordFromStorage
        })
    });
    
    if (!loginResponse.ok) {
        throw new Error('重新认证失败，请手动登录');
    }
    
    const loginData = await loginResponse.json();
    const newToken = loginData.token;
    
    // 保存新token
    localStorage.setItem('token', newToken);
    console.log('获取到新token:', newToken);
    
    // 使用新token重试原请求
    return fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${newToken}`,
            'Accept': 'application/json'
        }
    }).then(response => {
        if (!response.ok) {
            throw new Error(`使用新token请求仍然失败: ${response.status}`);
        }
        return response.json();
    });
}

// 获取测试用户数据
function getTestUserData() {
    return {
        username: '测试用户',
        studentId: '2023001001',
        email: 'test@example.com',
        avatar: 'assets/img/default-avatar.png'
    };
}

// 更新用户信息显示
function updateUserInfo(data) {
    console.log('正在更新界面上的用户信息:', data);
    
    // 确保data是对象类型
    if (!data || typeof data !== 'object') {
        console.error('无法更新用户信息：数据无效');
        return;
    }
    
    // 学号可能存储在不同字段中
    const studentId = data.studentId || data.student_id || '';
    
    // 更新用户名和基本信息
    const usernameElement = document.getElementById('username');
    if (usernameElement) usernameElement.textContent = data.username || '用户名';
    
    const studentIdElement = document.getElementById('student-id');
    if (studentIdElement) studentIdElement.textContent = `学号：${studentId}`;
    
    const emailElement = document.getElementById('email');
    if (emailElement) emailElement.textContent = `邮箱：${data.email || ''}`;
    
    // 更新表单中的值
    const updateUsernameInput = document.getElementById('update-username');
    if (updateUsernameInput) updateUsernameInput.value = data.username || '';
    
    const updateEmailInput = document.getElementById('update-email');
    if (updateEmailInput) updateEmailInput.value = data.email || '';
    
    // 更新头像 - 支持不同的图像URL格式
    const avatarUrl = data.avatar || data.avatarUrl || '';
    const avatarElement = document.querySelector('.avatar');
    if (avatarElement) {
        if (avatarUrl) {
            avatarElement.style.backgroundImage = `url(${avatarUrl})`;
            avatarElement.innerHTML = '';
        } else {
            // 如果没有头像，显示用户名首字母
            const initial = (data.username || '用户')[0].toUpperCase();
            avatarElement.style.backgroundImage = 'none';
            avatarElement.innerHTML = `<span>${initial}</span>`;
        }
    }
    
    // 在控制台输出确认信息
    console.log(`用户信息已更新。用户名: ${data.username}, 学号: ${studentId}`);
}

// 切换内容区域
function switchSection(sectionId) {
    console.log('切换到区域:', sectionId);
    
    // 更新导航菜单激活状态
    document.querySelectorAll('.sidebar a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
        }
    });

    // 更新内容区域显示
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${sectionId}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
        // 加载对应区域的数据
        loadSectionData(sectionId);
    }
}

// 加载区域数据
function loadSectionData(sectionId) {
    console.log('加载区域数据:', sectionId);
    
    const token = localStorage.getItem('token');
    
    switch (sectionId) {
        case 'account':
            // 账号区域不需要额外加载数据
            break;
        case 'history':
            loadHistory(token);
            break;
        case 'drafts':
            loadDrafts(token);
            break;
        case 'favorites':
            loadFavorites(token);
            break;
        case 'purchased':
            loadPurchased(token);
            break;
        case 'wanted':
            loadWanted(token);
            break;
        case 'published':
            loadPublished(token);
            break;
        case 'sold':
            loadSold(token);
            break;
    }
}

// 加载浏览历史
function loadHistory(token) {
    if (!token) return;
    
    // 重置分页状态
    paginationState.history = {
        currentPage: 1,
        totalPages: 1
    };
        
    // 清空全局数据
    historyItems = [];
    
    // 加载数据 - 使用size=-1参数请求所有数据
    fetch(`${API_BASE_URL}/profile/history?size=-1`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        // 保存完整数据到全局变量
        historyItems = [...data];
        console.log('加载历史记录成功:', historyItems.length, '条数据');
        
        const container = document.querySelector('.history-list');
        if (container) {
            renderHistoryList(container, historyItems);
        }
    })
    .catch(error => {
        console.error('加载历史记录失败:', error);
        const container = document.querySelector('.history-list');
        if (container) {
            container.innerHTML = '<div class="error-state">加载失败，请刷新重试</div>';
        }
    });
}

// 取消收藏
function removeFavorite(itemId, itemType) {
    if (!itemId) {
        showMessage('收藏记录ID不存在', 'error');
        return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
        showMessage('请先登录', 'warning');
        return;
    }
    
    if (confirm('确定要取消收藏吗？')) {
        console.log(`正在取消收藏: 类型=${itemType}, ID=${itemId}`);
        
        // 确保itemType是有效值
        if (!itemType) {
            itemType = 'product'; // 默认为商品类型
        }
        
        // 确保itemId是整数
        itemId = parseInt(itemId, 10);
        if (isNaN(itemId)) {
            showMessage('无效的收藏ID', 'error');
            return;
        }
        
        // 预先隐藏要删除的元素，使用户体验更好
        const itemElement = document.querySelector(`.history-item[data-id="${itemId}"][data-type="${itemType}"]`);
        if (itemElement) {
            // 添加淡出效果
            itemElement.style.opacity = '0.5';
            itemElement.style.transition = 'opacity 0.3s';
        }
        
        // 使用profile/favorites路径
        fetch(`${API_BASE_URL}/profile/favorites/${itemType}/${itemId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (response.ok) {
                showMessage('已取消收藏', 'success');
                // 完全移除元素
                if (itemElement) {
                    itemElement.remove();
                }
                
                // 更新本地存储中的收藏状态
                try {
                    // 从localStorage中获取收藏列表
                    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
                    // 过滤掉被取消的收藏
                    const updatedFavorites = favorites.filter(fav => {
                        return !(fav.itemId == itemId && fav.itemType == itemType);
                    });
                    // 保存更新后的收藏列表
                    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
                    console.log('本地收藏列表已更新');
                } catch (err) {
                    console.error('更新本地收藏列表失败:', err);
                }
                
                // 立即重新加载收藏列表
                loadSection('favorites', paginationState.favorites.currentPage);
                
                return;
            }
            
            // 检查具体错误类型
            return response.text().then(text => {
                try {
                    const data = JSON.parse(text);
                    throw new Error(data.message || data.error || '取消收藏失败');
                } catch (e) {
                    console.error('取消收藏返回:', text);
                throw new Error('取消收藏失败');
                }
            });
        })
        .catch(error => {
            console.error('取消收藏失败:', error);
            showMessage('取消收藏失败，请重试', 'error');
            // 恢复元素显示
            if (itemElement) {
                itemElement.style.opacity = '1';
            }
        });
    }
}

// 查看收藏商品详情
function viewFavorite(itemId, itemType) {
    if (!itemId) {
        showMessage('商品ID不存在', 'error');
        return;
    }
    
    console.log(`查看收藏详情，传入类型: ${itemType}, ID: ${itemId}`);
    
    // 增强类型判断逻辑 - 确保正确识别求购类型
    const isWantedItem = 
        itemType === 'wanted' || 
        // 检查其他可能的标记
        itemType === 'want' || 
        itemType === 'wanted_product';
    
    // 根据类型决定跳转到哪个详情页
    let detailUrl;
    if (isWantedItem) {
        detailUrl = 'wanted-detail.html?id=';
        console.log('识别为求购商品，跳转到求购详情页');
    } else {
        detailUrl = 'product-detail.html?id=';
        console.log('识别为普通商品，跳转到商品详情页');
    }
    
    // 记录跳转信息
    console.log(`即将跳转到: ${detailUrl}${itemId}`);
    
    // 添加isFavorite=true参数，确保详情页显示"已收藏"状态
    window.location.href = `${detailUrl}${itemId}&isFavorite=true`;
}

// 加载已购买商品
function loadPurchased(token) {
    console.log('调用loadPurchased - 转发到loadSection');
    loadSection('purchased', 1);
}

// 加载求购列表
function loadWanted(token) {
    console.log('调用loadWanted - 转发到loadSection');
    loadSection('wanted', 1);
}

// 加载发布列表
function loadPublished(token) {
    console.log('调用loadPublished - 转发到loadSection');
    loadSection('published', 1);
}

// 加载已售商品列表
function loadSold(token) {
    console.log('调用loadSold - 转发到loadSection');
    loadSection('sold', 1);
}

// 处理退出登录
function handleLogout() {
    console.log('退出登录');
    localStorage.removeItem('token');
    // 使用绝对路径跳转到登录页面
    window.location.href = '/pages/login.html';
}

// 编辑已发布商品
function editPublished(productId) {
    console.log('编辑已发布商品:', productId);
    // 获取token
    const token = localStorage.getItem('token');
    
    // 先尝试获取商品详情
    fetch(`${API_BASE_URL}/products/${productId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(product => {
        // 将商品数据存储在localStorage中，以便在编辑页面使用
        localStorage.setItem('editingProduct', JSON.stringify(product));
        // 跳转到商品发布页面，带上商品ID
        window.location.href = 'publish-product.html?id=' + productId;
    })
    .catch(error => {
        console.error('获取商品详情失败:', error);
        showMessage('获取商品详情失败，请重试', 'error');
    });
}

// 删除已发布商品
function deletePublished(productId) {
    console.log('删除已发布商品:', productId);
    if (confirm('确定要删除这个商品吗？此操作不可恢复。')) {
        const token = localStorage.getItem('token');
        fetch(`${API_BASE_URL}/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (response.ok) {
                showMessage('商品已成功删除', 'success');
                // 使用loadSection而不是loadPublished
                const currentPage = paginationState.published.currentPage;
                loadSection('published', currentPage);
            } else {
                throw new Error('删除失败');
            }
        })
        .catch(error => {
            console.error('删除商品失败:', error);
            showMessage('删除商品失败，请重试', 'error');
        });
    }
}

// 添加刷新token功能
async function refreshAuthToken() {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
        console.error('没有找到token，无法刷新');
        return null;
    }
    
    try {
        console.log('尝试刷新token...');
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.token) {
                console.log('token刷新成功，保存新token');
                localStorage.setItem('token', data.token);
                return data.token;
            }
        }
        
        // 如果刷新失败，尝试直接重新登录
        return await autoRelogin();
    } catch (error) {
        console.error('刷新token失败:', error);
        return currentToken; // 返回原token
    }
}

// 自动重新登录
async function autoRelogin() {
    try {
        // 从localStorage获取登录信息
        const savedUser = localStorage.getItem('user');
        if (!savedUser) return null;
        
        const user = JSON.parse(savedUser);
        if (!user.studentId) return null;
        
        console.log('尝试自动重新登录...');
        
        // 模拟自动登录请求
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                studentId: user.studentId,
                // 注意：这里不能发送密码，因为我们不保存密码
                // 这只是一个示例，实际中需要后端支持其他登录方式
                autoLogin: true
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.token) {
                localStorage.setItem('token', data.token);
                return data.token;
            }
        }
        
        return null;
    } catch (error) {
        console.error('自动重新登录失败:', error);
        return null;
    }
}

// 添加模拟数据库更新成功处理函数
function showDbUpdateSuccess() {
    const successNotification = document.querySelector('.db-update-success');
    if (successNotification) {
        successNotification.style.display = 'block';
        
        // 添加关闭按钮事件
        const closeBtn = successNotification.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.onclick = function() {
                successNotification.style.display = 'none';
            };
        }
        
        // 5秒后自动关闭
        setTimeout(function() {
            successNotification.style.display = 'none';
        }, 5000);
    }
}

// 处理密码修改后的重定向
function redirectToLogin(message = '密码已修改，请重新登录') {
    // 显示提示消息
    showMessage(message, 'success');
    
    // 清除所有会话数据
    setTimeout(() => {
        // 清除登录令牌
        localStorage.removeItem('token');
        
        // 保留用户基本信息，但标记为未登录状态
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                user.passwordChanged = true; // 标记密码已修改
                user.lastLogout = new Date().toISOString(); // 记录登出时间
                localStorage.setItem('user', JSON.stringify(user));
            } catch (e) {
                console.error('处理用户数据时出错:', e);
            }
        }
        
        // 使用绝对路径跳转到登录页面，解决相对路径导致的404问题
        window.location.href = '/pages/login.html?passwordChanged=true';
    }, 1500);
}

// 处理账号更新
function handleAccountUpdate(e) {
    e.preventDefault();
    console.log('提交账号更新');
    
    const formData = new FormData(document.getElementById('accountForm'));
    
    // 准备数据，只包含非空值
    const data = {};
    if (formData.get('username')) data.username = formData.get('username');
    if (formData.get('email')) data.email = formData.get('email');
    
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    
    console.log('表单数据:', data);
    
    // 检查是否在修改密码
    let isChangingPassword = false;
    if (newPassword) {
        isChangingPassword = true;
        // 如果要修改密码，则必须提供当前密码
        if (!currentPassword) {
            showMessage('请输入当前密码以验证身份', 'error');
            return;
        }
        
        // 检查密码确认
        if (newPassword !== confirmPassword) {
            showMessage('两次输入的新密码不一致', 'error');
            return;
        }
        
        // 将密码信息添加到数据中
        data.currentPassword = currentPassword;
        data.password = newPassword;
    }
    
    // 检查是否有数据要更新
    if (Object.keys(data).length === 0) {
        showMessage('请填写至少一项要修改的内容', 'warning');
        return;
    }
    
    // 显示等待消息
    showMessage('正在更新个人资料...', 'info');
    
    // 调用更新服务
    updateUserData(data)
        .then(result => {
            console.log('更新结果:', result);
            
            if (result.success) {
                // 如果token过期，显示消息并重定向
                if (result.tokenExpired) {
                    showMessage("登录已过期，请重新登录", "error");
                    setTimeout(() => {
                        localStorage.removeItem('token');
                        window.location.href = '/pages/login.html';
                    }, 2000);
                    return;
                }
                
                // 显示更新成功消息
                showMessage(result.message || '个人资料更新成功！', 'success');
                
                // 如果修改了密码，重定向到登录页面
                if (isChangingPassword) {
                    showMessage('密码已修改，请使用新密码重新登录', 'success');
                    setTimeout(() => {
                        // 清除登录状态
                        localStorage.removeItem('token');
                        // 跳转到登录页面
                        window.location.href = '/pages/login.html?passwordChanged=true';
                    }, 2000);
                    return;
                }
                
                // 刷新用户界面
                if (result.userData) {
                    updateUserInfo(result.userData);
                }
            } else {
                showMessage(result.message || '更新失败，请重试', 'error');
            }
        })
        .catch(error => {
            console.error('更新过程出错:', error);
            showMessage('更新失败:' + (error.message || '未知错误'), 'error');
        });
}

// 统一的用户数据更新服务
async function updateUserData(userData) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showMessage("请先登录", "error");
            return {success: false, message: "未登录"};
        }
        
        // 获取完整的用户数据
        const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
        const userDataFromStorage = JSON.parse(localStorage.getItem('userData') || '{}');
        
        console.log("准备发送数据到服务器:", userData);
        
        const response = await fetch(`${API_BASE_URL}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            mode: 'cors',
            credentials: 'include',
            body: JSON.stringify(userData)
        });
        
        console.log("服务器响应状态:", response.status);
        
        if (response.ok) {
            // 获取响应数据
            const responseData = await response.json();
            
            // 确保保留学号信息
            const updatedUserData = {
                ...userFromStorage, 
                ...responseData,
                studentId: userFromStorage.studentId || responseData.studentId
            };
            
            // 更新本地存储
            localStorage.setItem('user', JSON.stringify(updatedUserData));
            localStorage.setItem('userData', JSON.stringify(updatedUserData));
            
            // 更新UI
            updateUserInfo(updatedUserData);
            
            return {
                success: true,
                message: "个人资料已更新",
                userData: updatedUserData,
                dbUpdated: true
            };
        } else if (response.status === 401) {
            // 令牌过期处理
            return {
                success: false,
                tokenExpired: true,
                message: "登录已过期，请重新登录"
            };
        } else {
            let errorMsg = "更新失败";
            try {
                const errorData = await response.json();
                errorMsg = errorData.error || errorMsg;
            } catch(e) {}
            
            return {
                success: false,
                message: errorMsg
            };
        }
    } catch (error) {
        console.error('无法连接到服务器:', error);
        
        // 离线模式下仍然更新本地数据
        const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
        const userDataFromStorage = JSON.parse(localStorage.getItem('userData') || '{}');
        
        // 确保保留学号信息
        const updatedUserData = {
            ...userFromStorage,
            ...userData,
            studentId: userFromStorage.studentId
        };
        
        localStorage.setItem('user', JSON.stringify(updatedUserData));
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        updateUserInfo(updatedUserData);
        
        return {
            success: true,
            message: "已更新本地数据，但无法连接到服务器",
            userData: updatedUserData,
            dbUpdated: false
        };
    }
}

// 验证当前密码
async function verifyCurrentPassword(currentPassword) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showMessage('您的登录凭证已失效，请重新登录', 'error');
            return false;
        }
        
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            showMessage('无法获取用户信息', 'error');
            return false;
        }
        
        const user = JSON.parse(userStr);
        const studentId = user.studentId;
        
        if (!studentId) {
            showMessage('用户信息不完整', 'error');
            return false;
        }
        
        console.log('尝试验证当前密码');
        
        // 调用验证密码的API
        const response = await fetch(`${API_BASE_URL}/auth/verify-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                studentId: studentId,
                password: currentPassword
            })
        });
        
        console.log('密码验证API响应状态:', response.status);
        
        if (response.status === 401) {
            handleTokenExpired();
            return false;
        }
        
        if (!response.ok) {
            console.log('密码验证API返回错误:', response.status);
            return false;
        }
        
        const result = await response.json();
        console.log('密码验证结果:', result);
        return result.verified === true;
    } catch (error) {
        console.error('验证密码出错:', error);
        showMessage('验证密码过程中出错', 'error');
        return false;
    }
}

// 显示消息
function showMessage(message, type = 'info', duration = 3000) {
    console.log('显示消息:', message, type);
    const messageElement = document.getElementById('message');
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.className = `message ${type}`;
        messageElement.style.display = 'block';
        
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, duration);
    } else {
        console.error('未找到消息元素');
        alert(message);
    }
}

// 在页面加载时检查服务器连接
async function checkServerConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/ping`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        
        return response.ok;
    } catch (e) {
        console.error('服务器连接测试失败:', e);
        return false;
    }
}

// 在login.js中实现
function checkTokenValidity(token) {
    // 解析JWT (不需要密钥)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) return false;
    
    try {
        const payload = JSON.parse(atob(tokenParts[1]));
        const expiry = payload.exp * 1000; // 转换为毫秒
        return Date.now() < expiry;
    } catch (e) {
        return false;
    }
}

// 在页面加载时检查
const token = localStorage.getItem('token');
if (token && !checkTokenValidity(token)) {
    // 清除无效token
    localStorage.removeItem('token');
    alert('您的登录已过期，请重新登录');
}

// 添加处理令牌过期的函数
function handleTokenExpired() {
    showMessage('您的登录已过期，3秒后将跳转到登录页面', 'warning', 3000);
    setTimeout(() => {
        localStorage.removeItem('token');
        window.location.href = '/pages/login.html';
    }, 3000);
}

// 处理头像更换按钮点击
function handleAvatarChange() {
    document.getElementById('avatarUpload').click();
}

// 处理头像文件选择
async function handleAvatarFileSelected(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 检查文件类型
    if (!file.type.match('image.*')) {
        showMessage('请上传图片文件', 'warning');
        return;
    }
    
    // 检查文件大小 (最大2MB)
    if (file.size > 2 * 1024 * 1024) {
        showMessage('头像图片不能超过2MB', 'warning');
        return;
    }
    
    // 显示预览
    const reader = new FileReader();
    reader.onload = function(e) {
        const avatarElement = document.querySelector('.avatar');
        if (avatarElement) {
            avatarElement.style.backgroundImage = `url(${e.target.result})`;
            avatarElement.innerHTML = '';
        }
    };
    reader.readAsDataURL(file);
    
    // 上传到服务器
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showMessage('登录已失效，请重新登录', 'error');
            return;
        }
        
        // 创建FormData对象
        const formData = new FormData();
        formData.append('file', file);
        
        // 发送请求
        const response = await fetch('http://localhost:8080/api/profile/avatar', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('上传头像失败');
        }
        
        const result = await response.json();
        
        // 更新本地存储的用户信息
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        userInfo.avatar = result.avatarUrl;
        localStorage.setItem('user', JSON.stringify(userInfo));
        
        showMessage('头像更新成功', 'success');
    } catch (error) {
        console.error('上传头像错误:', error);
        showMessage('上传头像失败: ' + error.message, 'error');
        
        // 恢复原头像
        loadUserInfo();
    }
}

// 编辑草稿
function editDraft(draftId) {
    console.log('编辑草稿:', draftId);
    // 获取token
    const token = localStorage.getItem('token');
    
    if (!token) {
        showMessage('请先登录', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }
    
    // 先获取草稿详情
    fetch(`${API_BASE_URL}/drafts/${draftId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('获取草稿详情失败');
        }
        return response.json();
    })
    .then(draft => {
        // 根据草稿类型决定跳转到哪个编辑页面
        if (draft.draftType === 'product') {
            // 将草稿ID添加到草稿内容中
            try {
                const draftContent = JSON.parse(draft.content);
                draftContent.draftId = draftId; // 确保草稿ID被保存
                draft.content = JSON.stringify(draftContent);
            } catch (e) {
                console.error('修改草稿内容失败:', e);
            }
            
            // 存储草稿内容到localStorage，以便编辑页面使用
            localStorage.setItem('productDraft', draft.content);
            // 跳转到商品发布页面，添加编辑标识参数
            window.location.href = `publish-product.html?editDraft=${draftId}`;
        } else if (draft.draftType === 'express') {
            // 存储草稿内容到localStorage，以便编辑页面使用
            localStorage.setItem('expressDraft', draft.content);
            // 跳转到快递发布页面
            window.location.href = 'publish-express.html';
        } else if (draft.draftType === 'wanted') {
            // 将草稿ID添加到草稿内容中
            try {
                const draftContent = JSON.parse(draft.content);
                draftContent.draftId = draftId; // 确保草稿ID被保存
                draft.content = JSON.stringify(draftContent);
            } catch (e) {
                console.error('修改草稿内容失败:', e);
            }
            
            // 存储草稿内容到localStorage，以便编辑页面使用
            localStorage.setItem('wantedProductDraft', draft.content);
            // 跳转到求购发布页面，添加编辑标识参数
            window.location.href = `wanted-product.html?editDraft=${draftId}`;
        } else {
            throw new Error('未知草稿类型');
        }
    })
    .catch(error => {
        console.error('获取草稿详情失败:', error);
        showMessage('获取草稿详情失败，请重试', 'error');
    });
}

// 删除草稿
function deleteDraft(draftId) {
    console.log('删除草稿:', draftId);
    if (confirm('确定要删除这个草稿吗？此操作不可恢复。')) {
        const token = localStorage.getItem('token');
        fetch(`${API_BASE_URL}/drafts/${draftId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (response.ok) {
                showMessage('草稿已成功删除', 'success');
                // 刷新列表
                loadDrafts(token);
            } else {
                throw new Error('删除失败');
            }
        })
        .catch(error => {
            console.error('删除草稿失败:', error);
            showMessage('删除草稿失败，请重试', 'error');
        });
    }
}

// 添加订单状态的样式
const style = document.createElement('style');
style.textContent = `
    .order-item {
        border-left: 4px solid #ddd;
        margin-bottom: 10px;
    }
    .status-pending { border-left-color: #faad14; }
    .status-paid { border-left-color: #1890ff; }
    .status-shipped { border-left-color: #52c41a; }
    .status-completed { border-left-color: #52c41a; }
    .status-cancelled { border-left-color: #ff4d4f; }
    
    .btn-pay {
        background-color: #1890ff;
        color: white;
        border: none;
        padding: 5px 15px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 10px;
    }
    
    .btn-pay:hover {
        background-color: #40a9ff;
    }
`;
document.head.appendChild(style);

// 统一加载各个类型的数据（带分页）
function loadSection(section, page = 1) {
    console.log(`加载${section}数据，页码:`, page);
    const token = localStorage.getItem('token');
    if (!token) return;
    
    // 找到对应的列表容器
    let listContainer = document.querySelector(`.${section}-list`);
    if (!listContainer) {
        console.log(`创建.${section}-list元素`);
        const sectionElement = document.getElementById(`${section}-section`);
        
        if (!sectionElement) {
            console.error(`找不到${section}-section元素，无法添加列表`);
            return;
        }
        
        listContainer = document.createElement('div');
        listContainer.className = `${section}-list`;
        sectionElement.appendChild(listContainer);
    }
    
    // 显示加载状态
    listContainer.innerHTML = '<div class="loading">加载中...</div>';
    
    // API路径 - 确保严格限制每页大小为PAGE_SIZE
    const url = `${API_BASE_URL}/profile/${section}?page=${page-1}&size=${PAGE_SIZE}`;
    
    fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`加载失败: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // 处理响应数据
        let items = Array.isArray(data) ? data : (data.content || []);
        const totalItems = Array.isArray(data) ? items.length : (data.totalElements || items.length);
        const totalPages = Math.max(Math.ceil(totalItems / PAGE_SIZE), 1);
        
        // 确保每页只显示PAGE_SIZE个项目
        if (Array.isArray(data) && items.length > PAGE_SIZE) {
            // 如果后端没有分页，我们在前端做分页处理
            const startIndex = (page - 1) * PAGE_SIZE;
            items = items.slice(startIndex, startIndex + PAGE_SIZE);
        }
        
        console.log(`${section}数据加载成功:`, items.length, '条数据，总页数:', totalPages);
        
        // 根据不同类型渲染列表
        if (items.length === 0) {
            listContainer.innerHTML = `<div class="empty-state">暂无${getSectionName(section)}数据</div>`;
        } else {
            // 根据section类型渲染不同的HTML
            switch(section) {
                case 'favorites':
                    renderFavoritesList(listContainer, items);
                    break;
                case 'published':
                    renderPublishedList(listContainer, items);
                    break;
                case 'purchased':
                    renderPurchasedList(listContainer, items);
                    break;
                case 'history':
                    renderHistoryList(listContainer, items);
                    break;
                case 'drafts':
                    renderDraftsList(listContainer, items);
                    break;
                case 'wanted':
                    renderWantedList(listContainer, items);
                    break;
                case 'sold':
                    renderSoldList(listContainer, items);
                    break;
                default:
                    listContainer.innerHTML = `<div class="empty-state">未知分区类型: ${section}</div>`;
            }
        }
        
        // 更新分页UI
        updatePagination(section, page, totalPages);
        
        // 重新初始化分页事件
        setTimeout(initPagination, 100);
    })
    .catch(error => {
        console.error(`加载${section}失败:`, error);
        listContainer.innerHTML = `<div class="error-state">加载失败，请刷新重试</div>`;
        // 重置分页
        updatePagination(section, 1, 1);
    });
}

// 渲染收藏列表
function renderFavoritesList(container, items) {
    const serverAddress = 'http://localhost:8080';
    const defaultImageUrl = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22120%22%20height%3D%22120%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%20120%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A10pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1%22%3E%3Crect%20width%3D%22120%22%20height%3D%22120%22%20fill%3D%22%23eee%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2240%22%20y%3D%2264.5%22%3E无图片%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
    
    // 类型筛选，插入到标题下方锚点
    const filterHtml = `
        <div class="history-filter" style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
            <span>类型筛选：</span>
            <select id="favorites-type-filter">
                <option value="all">全部</option>
                <option value="product">商品</option>
                <option value="wanted">求购</option>
            </select>
        </div>
    `;
    
    // 保存到全局变量以便翻页和筛选使用
    favoritesItems = [...items];
    console.log(`保存${items.length}条收藏数据到全局变量`);
    
    // 渲染列表和分页信息
    container.innerHTML = `
        <div id="favorites-filter-anchor"></div>
        <div id="favorites-items-container"></div>
        <div class="pagination-info" style="text-align: center; margin: 10px 0;">
            <span id="favorites-page-info">第 <b>1</b> 页，共 <b>${Math.ceil(items.length / PAGE_SIZE)}</b> 页，总计 <b>${items.length}</b> 条收藏</span>
        </div>
    `;
    
    // 插入筛选到锚点
    const anchor = document.getElementById('favorites-filter-anchor');
    if (anchor) anchor.innerHTML = filterHtml;
    
    const typeSelect = document.getElementById('favorites-type-filter');
    
    function triggerFilter(resetPage = true) {
        const typeFilter = typeSelect?.value || 'all';
        if (resetPage) paginationState.favorites.currentPage = 1;
        filterFavoritesByType(favoritesItems, typeFilter);
    }
    
    if (typeSelect) {
        typeSelect.addEventListener('change', function() { triggerFilter(true); });
    }
    
    // 确保我们有足够的数据来进行分页
    const totalPages = Math.max(Math.ceil(items.length / PAGE_SIZE), 1);
    
    // 记录总页数用于调试
    console.log(`收藏总页数：${totalPages}，总条目：${items.length}，每页条目：${PAGE_SIZE}`);
    
    // 首次触发筛选渲染 - 使用全部数据
    triggerFilter(false);
    
    // 确保分页状态更新
    updatePagination('favorites', paginationState.favorites.currentPage, totalPages);
    
    // 更新页码信息显示
    const pageInfo = document.getElementById('favorites-page-info');
    if (pageInfo) {
        pageInfo.innerHTML = `第 <b>${paginationState.favorites.currentPage}</b> 页，共 <b>${totalPages}</b> 页，总计 <b>${favoritesItems.length}</b> 条收藏`;
    }
    
    // 更新页面标题，显示总条数
    const favoritesSection = document.querySelector('.favorites-section h2');
    if (favoritesSection) {
        const originalTitle = favoritesSection.textContent.split('(')[0].trim();
        favoritesSection.textContent = `${originalTitle} (${favoritesItems.length}条)`;
    }
    
    return favoritesItems;
}

// 渲染收藏列表项之前先清理数据
function filterFavoritesByType(allItems, typeFilter = 'all') {
    const container = document.getElementById('favorites-items-container');
    if (!container) return;
    const serverAddress = 'http://localhost:8080';
    const defaultImageUrl = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22120%22%20height%3D%22120%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%20120%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A10pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1%22%3E%3Crect%20width%3D%22120%22%20height%3D%22120%22%20fill%3D%22%23eee%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2240%22%20y%3D%2264.5%22%3E无图片%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
    
    console.log('收藏原始数据:', allItems.length);
    
    // 确保处理前数据完整
    if (!Array.isArray(allItems) || allItems.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无收藏数据</div>';
        return [];
    }
    
    // 增强对收藏项类型的识别 - 特别是求购类型
    const processedItems = allItems.map(item => {
        // 深拷贝避免修改原始对象
        const processedItem = { ...item };
        
        // 检测和修正itemType字段
        if (processedItem.itemType === undefined || processedItem.itemType === null) {
            // 通过多种方式尝试确定是否为求购项目
            if (processedItem.minPrice !== undefined || processedItem.maxPrice !== undefined) {
                console.log('通过价格范围识别为求购项目:', processedItem.title);
                processedItem.itemType = 'wanted';
            } else if (processedItem.title && processedItem.title.includes('求购')) {
                console.log('通过标题识别为求购项目:', processedItem.title);
                processedItem.itemType = 'wanted';
    } else {
                // 默认为商品
                processedItem.itemType = 'product';
            }
        }
        
        // 确保标题字段存在
        if (!processedItem.title && processedItem.itemType === 'wanted') {
            processedItem.title = '求购商品';
        } else if (!processedItem.title) {
            processedItem.title = '收藏商品';
        }
        
        return processedItem;
    });
    
    // 根据类型筛选
    let filteredItems = processedItems;
    if (typeFilter !== 'all') {
        filteredItems = processedItems.filter(item => {
            const isWanted = item.itemType === 'wanted' || 
                          (item.minPrice !== undefined || item.maxPrice !== undefined) ||
                          (item.title && item.title.includes('求购'));
            
            return typeFilter === 'wanted' ? isWanted : !isWanted;
        });
    }
    
    console.log(`筛选后的收藏数据: ${filteredItems.length}条`);
    
    // 分页逻辑
    const pageSize = PAGE_SIZE; // 使用全局PAGE_SIZE常量
    const currentPage = paginationState.favorites.currentPage || 1;
    const totalPages = Math.max(Math.ceil(filteredItems.length / pageSize), 1);
    
    // 如果当前页码超出范围，重置为第一页
    if (currentPage > totalPages) {
        paginationState.favorites.currentPage = 1;
    }
    
    const page = paginationState.favorites.currentPage;
    const start = (page - 1) * pageSize;
    const end = Math.min(start + pageSize, filteredItems.length); // 确保不越界
    const pageItems = filteredItems.slice(start, end);
    
    console.log(`收藏显示第${page}页，每页${pageSize}条，显示${pageItems.length}条，总共${filteredItems.length}条`);
    
    // 渲染页面
    if (pageItems.length === 0) {
        container.innerHTML = '<div class="empty-state">当前筛选条件下暂无收藏</div>';
    } else {
        container.innerHTML = pageItems.map(item => {
            // 获取图片
            let imgSrc = item.image || defaultImageUrl;
            
            // 针对求购项目特殊处理图片
            if (item.itemType === 'wanted') {
                if (item.images) {
                    if (Array.isArray(item.images) && item.images.length > 0) {
                        imgSrc = item.images[0] || imgSrc;
                    } else if (typeof item.images === 'string') {
                        try {
                            const parsedImages = JSON.parse(item.images);
                            if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                                imgSrc = parsedImages[0] || imgSrc;
                            }
                        } catch (e) {}
                    }
                }
            }
            
            // 处理图片路径
            if (imgSrc !== defaultImageUrl) {
                if (imgSrc.startsWith('data:')) {
                    // 保持不变
                } else if (imgSrc.startsWith('http')) {
                    // 修复端口问题
                    if (imgSrc.includes('localhost:8000')) {
                        imgSrc = imgSrc.replace('localhost:8000', 'localhost:8080');
                    }
                } else if (imgSrc.startsWith('/')) {
            imgSrc = serverAddress + imgSrc;
                } else {
                    imgSrc = serverAddress + '/' + imgSrc.replace(/^\/+/, '');
                }
            }
            
            // 处理价格显示
            let priceText = '';
            if (item.itemType === 'wanted') {
                if (item.minPrice && item.maxPrice) {
                    priceText = `¥${parseFloat(item.minPrice).toFixed(2)} - ¥${parseFloat(item.maxPrice).toFixed(2)}`;
                } else if (item.minPrice) {
                    priceText = `¥${parseFloat(item.minPrice).toFixed(2)} 起`;
                } else if (item.maxPrice) {
                    priceText = `最高 ¥${parseFloat(item.maxPrice).toFixed(2)}`;
                } else {
                    priceText = '价格待议';
                }
            } else if (item.price) {
                priceText = `¥${parseFloat(item.price).toFixed(2)}`;
            } else {
                priceText = '价格未知';
            }
            
            // 格式化收藏时间
            const createdTime = new Date(item.createdAt || item.favoriteTime || new Date()).toLocaleString();
            
            // 返回收藏项HTML
        return `
            <div class="favorite-item ${item.itemType === 'wanted' ? 'wanted' : ''}" data-id="${item.itemId}" data-type="${item.itemType}">
                <div class="favorite-item-content" onclick="viewFavorite('${item.itemId}', '${item.itemType}')">
                    <div class="favorite-item-image">
                        <img src="${imgSrc}" alt="${item.title || '收藏项'}" onerror="this.onerror=null; this.src='${defaultImageUrl}';">
                </div>
                    <div class="favorite-item-details">
                        <h3>${item.itemType === 'wanted' ? '求购: ' : ''}${item.title || '无标题'}</h3>
                        <p class="favorite-price">${priceText}</p>
                        <p class="favorite-time">收藏于: ${createdTime}</p>
                </div>
            </div>
                <div class="favorite-actions">
                    <button class="btn-secondary" onclick="event.stopPropagation(); removeFavorite('${item.itemId}', '${item.itemType}')">取消收藏</button>
            </div>
        </div>
        `;
    }).join('');
    }
    
    // 更新分页状态
    updatePagination('favorites', page, totalPages);
    
    // 更新页码信息显示
    const pageInfo = document.getElementById('favorites-page-info');
    if (pageInfo) {
        pageInfo.innerHTML = `第 <b>${page}</b> 页，共 <b>${totalPages}</b> 页，总计 <b>${filteredItems.length}</b> 条收藏`;
    }
    
    // 手动检查分页按钮状态
    const pagination = document.getElementById('favorites-pagination');
    if (pagination) {
        const prevButton = pagination.querySelector('.prev-page');
        const nextButton = pagination.querySelector('.next-page');
        if (prevButton) prevButton.disabled = page <= 1;
        if (nextButton) nextButton.disabled = page >= totalPages;
        console.log(`收藏分页按钮状态(更新后): 上一页=${prevButton?.disabled ? '禁用' : '启用'}，下一页=${nextButton?.disabled ? '禁用' : '启用'}`);
    }
    
    return filteredItems;
}

// 渲染发布列表
function renderPublishedList(container, items) {
    const serverAddress = 'http://localhost:8080';
    const defaultImageUrl = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22120%22%20height%3D%22120%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%20120%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A10pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1%22%3E%3Crect%20width%3D%22120%22%20height%3D%22120%22%20fill%3D%22%23eee%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2240%22%20y%3D%2264.5%22%3E无图片%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
    
    container.innerHTML = items.map(item => {
        // 处理图片路径
        let imgSrc = '';
        if (item.images && Array.isArray(item.images) && item.images.length > 0) {
            imgSrc = item.images[0];
        } else if (item.image) {
            imgSrc = item.image;
        } else {
            imgSrc = defaultImageUrl;
        }
        
        if (imgSrc && imgSrc.startsWith('/')) {
            imgSrc = serverAddress + imgSrc;
        }
        
        return `
        <div class="published-item">
            <div class="published-item-content">
                <div class="published-item-image">
                    <img src="${imgSrc}" alt="${item.title}" 
                         onerror="this.onerror=null; this.src='${defaultImageUrl}';">
                </div>
                <div class="published-item-details">
                    <h3>${item.title || '无标题'}</h3>
                    <p class="published-price">¥${parseFloat(item.price || 0).toFixed(2)}</p>
                    <p class="published-description">${item.description || ''}</p>
                    <p class="published-date">发布时间：${new Date(item.createdAt || new Date()).toLocaleDateString()}</p>
                </div>
            </div>
            <div class="published-actions">
                <button class="btn-primary" onclick="editPublished(${item.id})">编辑</button>
                <button class="btn-secondary" onclick="deletePublished(${item.id})">删除</button>
            </div>
        </div>
        `;
    }).join('');
}

// 渲染历史记录列表
function renderHistoryList(container, items) {
    const serverAddress = 'http://localhost:8080';
    const defaultImageUrl = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22120%22%20height%3D%22120%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%20120%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A10pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1%22%3E%3Crect%20width%3D%22120%22%20height%3D%22120%22%20fill%3D%22%23eee%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2240%22%20y%3D%2264.5%22%3E无图片%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
    const filterHtml = `
        <div class="history-filter" style="display: flex; align-items: center; gap: 10px;">
            <span>时间筛选：</span>
            <select id="history-time-filter">
                <option value="all">全部</option>
                <option value="today">今天</option>
                <option value="yesterday">昨天</option>
                <option value="week">近一周</option>
                <option value="month">近一个月</option>
            </select>
            <span>类型筛选：</span>
            <select id="history-type-filter">
                <option value="all">全部</option>
                <option value="product">商品</option>
                <option value="wanted">求购</option>
            </select>
        </div>
    `;
    // 按浏览时间降序排序
    let sortedItems = [...items];
    sortedItems.sort((a, b) => {
        const timeA = new Date(a.browseTime || a.time || new Date());
        const timeB = new Date(b.browseTime || b.time || new Date());
        return timeB - timeA;
    });
    
    // 保存到全局变量以便翻页和筛选使用
    historyItems = sortedItems;
    console.log(`保存${sortedItems.length}条历史浏览数据到全局变量`);
    
    container.innerHTML = filterHtml + `<div id="history-items-container"></div>`;
    
    // 绑定筛选器事件
    const filterSelect = document.getElementById('history-time-filter');
    const typeSelect = document.getElementById('history-type-filter');
    
    function triggerFilter(resetPage = true) {
        const timeFilter = filterSelect.value;
        const typeFilter = typeSelect.value;
        if (resetPage) paginationState.history.currentPage = 1;
        filterHistoryByTime(timeFilter, historyItems, typeFilter);
    }
    
    if (filterSelect) {
        filterSelect.addEventListener('change', function() { triggerFilter(true); });
    }
    if (typeSelect) {
        typeSelect.addEventListener('change', function() { triggerFilter(true); });
    }
    
    // 首次渲染 - 使用全部数据
    triggerFilter(false);
    
    // 更新页面标题，显示总条数
    const historySection = document.querySelector('.history-section h2');
    if (historySection) {
        const originalTitle = historySection.textContent.split('(')[0].trim();
        historySection.textContent = `${originalTitle} (${historyItems.length}条)`;
    }
}

// 渲染草稿列表
function renderDraftsList(container, items) {
    const serverAddress = 'http://localhost:8080';
    const defaultImageUrl = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22120%22%20height%3D%22120%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%20120%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A10pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1%22%3E%3Crect%20width%3D%22120%22%20height%3D%22120%22%20fill%3D%22%23eee%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2240%22%20y%3D%2264.5%22%3E无图片%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
    
    container.innerHTML = items.map(item => {
        // 处理图片路径
        let imgSrc = defaultImageUrl;
        let title = item.title || '无标题草稿';
        let description = '';
        
        // 判断是否为求购草稿(重要!)
        const isWanted = item.draftType === 'wanted' || 
                        (item.title && item.title.includes('求购')) || 
                        (item.content && typeof item.content === 'string' && 
                            ((item.content.includes('"minPrice"') || item.content.includes('"maxPrice"'))));
        
        // 尝试解析内容JSON
        try {
            if (item.content && typeof item.content === 'string') {
                // 判断是否为JSON格式
                if (item.content.trim().startsWith('{') || item.content.trim().startsWith('[')) {
                    const draftData = JSON.parse(item.content);
                    
                    // 从JSON中获取图片 - 优先使用服务器URL图片
                    if (draftData.images && Array.isArray(draftData.images) && draftData.images.length > 0) {
                        // 使用与"我想要的"和"我的收藏"相同的图片处理逻辑
                        const serverImage = draftData.images.find(img => 
                            typeof img === 'string' && (img.startsWith('/uploads/') || img.startsWith('http'))
                        );
                        
                        if (serverImage) {
                            imgSrc = serverImage;
                            console.log('草稿箱-找到服务器图片:', imgSrc);
                            
                            // 处理图片URL，特别是修复端口号
                            if (imgSrc.startsWith('http://localhost:8000/')) {
                                imgSrc = imgSrc.replace('http://localhost:8000/', 'http://localhost:8080/');
                                console.log('草稿箱-修复端口号后的图片URL:', imgSrc);
                            }
                        } else if (draftData.images[0]) {
                        imgSrc = draftData.images[0];
                            console.log('草稿箱-使用第一个图片:', imgSrc);
                            
                            // 确保不是无效的URL
                            if (imgSrc === 'placeholder.jpg' || imgSrc === '/placeholder.jpg') {
                                imgSrc = defaultImageUrl;
                            }
                        }
                    } else if (draftData.image) {
                        imgSrc = draftData.image;
                        
                        // 处理端口号问题
                        if (imgSrc.includes('localhost:8000')) {
                            imgSrc = imgSrc.replace('localhost:8000', 'localhost:8080');
                        }
                        
                        // 修复placeholder.jpg
                        if (imgSrc === 'placeholder.jpg' || imgSrc === '/placeholder.jpg') {
                            imgSrc = defaultImageUrl;
                        }
                    }
                    
                    // 获取标题和描述
                    if (draftData.title) title = draftData.title;
                    if (draftData.description) description = draftData.description;
                } else {
                    // 纯文本内容
                    description = item.content.length > 100 ? item.content.substring(0, 100) + '...' : item.content;
                }
            }
        } catch (error) {
            console.error('解析草稿内容失败:', error);
            // 如果解析失败，使用原始内容
            description = item.content ? (item.content.length > 100 ? item.content.substring(0, 100) + '...' : item.content) : '';
        }
        
        // 图片路径处理 - 确保URL格式正确
        if (imgSrc !== defaultImageUrl) {
            // 如果是base64图片数据，直接使用
            if (imgSrc.startsWith('data:')) {
                // 保持不变
            }
            // 已经是完整URL的情况 - 修复端口号问题
            else if (imgSrc.startsWith('http')) {
                // 检查并修复端口号问题
                if (imgSrc.includes('localhost:8000')) {
                    imgSrc = imgSrc.replace('localhost:8000', 'localhost:8080');
                    console.log('草稿箱-修复端口号问题:', imgSrc);
                }
            }
            // 相对路径处理，以/开头的添加服务器前缀
            else if (imgSrc.startsWith('/')) {
                imgSrc = serverAddress + imgSrc;
            }
            // 如果是http://localhost:8000/开头，替换为正确的服务器地址
            else if (imgSrc.startsWith('http://localhost:8000/')) {
                imgSrc = imgSrc.replace('http://localhost:8000/', serverAddress + '/');
            }
            // 其他情况，添加服务器前缀
            else if (!imgSrc.startsWith('data:') && !imgSrc.startsWith('http')) {
                // 如果不是数据URL也不是HTTP URL，则添加服务器前缀
                imgSrc = serverAddress + '/' + imgSrc.replace(/^\/+/, '');
            }
        }
        
        // 输出调试信息
        console.log(`草稿[${item.id}]: 标题=${title}, 图片=${imgSrc}, 是否为求购=${isWanted}`);
        
        return `
        <div class="draft-item">
            <div class="draft-item-content">
                <div class="draft-item-image">
                    <img src="${imgSrc}" alt="${title}" 
                         onerror="this.onerror=null; this.src='${defaultImageUrl}';">
                </div>
                <div class="draft-item-details">
                    <h3>${isWanted ? '求购: ' : ''}${title}</h3>
                    <p class="draft-description">${description}</p>
                    <p class="draft-date">最后编辑: ${new Date(item.updatedAt || new Date()).toLocaleString()}</p>
                </div>
            </div>
            <div class="draft-actions">
                <button class="btn-primary" onclick="editDraft(${item.id})">编辑</button>
                <button class="btn-secondary" onclick="deleteDraft(${item.id})">删除</button>
            </div>
        </div>
        `;
    }).join('');
}

// 渲染已购买商品列表
function renderPurchasedList(container, items) {
    const serverAddress = 'http://localhost:8080';
    const defaultImageUrl = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22120%22%20height%3D%22120%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%20120%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A10pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1%22%3E%3Crect%20width%3D%22120%22%20height%3D%22120%22%20fill%3D%22%23eee%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2240%22%20y%3D%2264.5%22%3E无图片%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
    
    container.innerHTML = items.map(item => {
        let imgSrc = item.image || defaultImageUrl;
        if (imgSrc && imgSrc.startsWith('/')) {
            imgSrc = serverAddress + imgSrc;
        }
        
        return `
        <div class="purchased-item">
            <div class="purchased-item-content">
                <div class="purchased-item-image">
                    <img src="${imgSrc}" alt="${item.title || '已购商品'}" 
                         onerror="this.onerror=null; this.src='${defaultImageUrl}';">
                </div>
                <div class="purchased-item-details">
                    <h3>${item.title || '无标题'}</h3>
                    <p class="purchased-price">¥${parseFloat(item.price || 0).toFixed(2)}</p>
                    <p class="purchased-date">购买时间: ${new Date(item.purchaseTime || new Date()).toLocaleString()}</p>
                </div>
            </div>
            <div class="purchased-actions">
                <button class="btn-primary" onclick="viewPurchased(${item.id})">查看详情</button>
            </div>
        </div>
        `;
    }).join('');
}

// 渲染求购列表
function renderWantedList(container, items) {
    const serverAddress = 'http://localhost:8080';
    const defaultImageUrl = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22120%22%20height%3D%22120%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%20120%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A10pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1%22%3E%3Crect%20width%3D%22120%22%20height%3D%22120%22%20fill%3D%22%23eee%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2240%22%20y%3D%2264.5%22%3E无图片%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
    container.innerHTML = items.map(item => {
        let imgSrc = item.images && item.images.length > 0 ? item.images[0] : defaultImageUrl;
        if (imgSrc && imgSrc.startsWith('/')) imgSrc = serverAddress + imgSrc;
        const minPrice = parseFloat(item.minPrice || 0).toFixed(2);
        const maxPrice = parseFloat(item.maxPrice || 0).toFixed(2);
        const priceRange = `¥${minPrice} - ¥${maxPrice}`;
        let urgencyText = '普通';
        switch(item.urgencyLevel) {
            case 'very_urgent': urgencyText = '非常急需'; break;
            case 'urgent': urgencyText = '急需'; break;
        }
        let condition = item.conditionLevel || '';
        return `
        <div class="wanted-item">
            <div class="wanted-item-content">
                <div class="wanted-item-image">
                    <img src="${imgSrc}" alt="${item.title || '求购商品'}" onerror="this.onerror=null; this.src='${defaultImageUrl}';">
                </div>
                <div class="wanted-item-details">
                    <div style="font-size: 14px; color: #888;">${urgencyText}</div>
                    <h3>求购: ${item.title || '无标题'}</h3>
                    <div class="wanted-description">${condition}</div>
                    <div class="published-price">${priceRange}</div>
                    <p class="published-date">发布于 ${new Date(item.publishTime).toLocaleString()}</p>
                </div>
            </div>
            <div class="wanted-actions">
                <button class="btn-primary" onclick="editWanted(${item.id})">编辑</button>
                <button class="btn-secondary" onclick="deleteWanted(${item.id})">删除</button>
            </div>
        </div>
        `;
    }).join('');
}

// 渲染已售出商品列表
function renderSoldList(container, items) {
    const serverAddress = 'http://localhost:8080';
    const defaultImageUrl = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22120%22%20height%3D%22120%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%20120%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A10pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1%22%3E%3Crect%20width%3D%22120%22%20height%3D%22120%22%20fill%3D%22%23eee%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2240%22%20y%3D%2264.5%22%3E无图片%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
    
    container.innerHTML = items.map(item => {
        let imgSrc = item.image || defaultImageUrl;
        if (imgSrc && imgSrc.startsWith('/')) {
            imgSrc = serverAddress + imgSrc;
        }
        
        return `
        <div class="sold-item">
            <div class="sold-item-content">
                <div class="sold-item-image">
                    <img src="${imgSrc}" alt="${item.title || '已售商品'}" 
                         onerror="this.onerror=null; this.src='${defaultImageUrl}';">
                </div>
                <div class="sold-item-details">
                    <h3>${item.title || '无标题'}</h3>
                    <p class="sold-price">¥${parseFloat(item.price || 0).toFixed(2)}</p>
                    <p class="sold-date">售出时间: ${new Date(item.soldTime || new Date()).toLocaleString()}</p>
                </div>
            </div>
            <div class="sold-actions">
                <button class="btn-primary" onclick="viewSoldDetails(${item.id})">查看详情</button>
            </div>
        </div>
        `;
    }).join('');
}

// 添加查看历史记录详情函数
function viewHistoryItem(itemId, itemType) {
    if (!itemId) {
        showMessage('商品ID不存在', 'error');
        return;
    }
    
    console.log(`查看历史记录详情，传入类型: ${itemType}, ID: ${itemId}`);
    
    // 检查商品是否被收藏，如果是则添加isFavorite=true参数
    let isItemFavorited = false;
    try {
        // 从localStorage获取收藏列表
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        isItemFavorited = favorites.some(fav => {
            return fav.itemId.toString() === itemId.toString() && fav.itemType === itemType;
        });
        console.log('历史记录商品收藏状态:', isItemFavorited ? '已收藏' : '未收藏');
    } catch (e) {
        console.error('检查收藏状态失败:', e);
    }
    
    // 构建URL
    let url;
    if (itemType === 'wanted') {
        url = `wanted-detail.html?id=${itemId}`;
    } else {
        url = `product-detail.html?id=${itemId}`;
    }
    
    // 如果是收藏的商品，添加isFavorite=true参数
    if (isItemFavorited) {
        url += '&isFavorite=true';
    }
    
    window.location.href = url;
}

// 清空浏览历史
function clearBrowseHistory() {
    const token = localStorage.getItem('token');
    if (!token) {
        showMessage('用户未登录，无法清空浏览历史', 'error');
        return;
    }

    if (confirm('确定要清空全部浏览历史记录吗？此操作不可恢复。')) {
        fetch(`${API_BASE_URL}/profile/history/clear`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // 尝试解析JSON，如果不是JSON则返回空对象
            return response.text().then(text => {
                try {
                    return text ? JSON.parse(text) : {};
                } catch (e) {
                    // 如果解析失败，返回空对象
                    return {};
                }
            });
        })
        .then(data => {
            showMessage('浏览历史已清空', 'success');
            
            // 清空浏览历史列表
            const historyList = document.getElementById('history-list');
            if (historyList) {
                historyList.innerHTML = '<div class="empty-state">暂无浏览历史数据</div>';
            }
            
            // 重新加载历史记录部分
            loadHistory(token);
        })
        .catch(error => {
            console.error('清空浏览历史失败:', error);
            showMessage('清空浏览历史失败，请稍后重试', 'error');
        });
    }
}

// 编辑求购信息
function editWanted(id) {
    window.location.href = `wanted-product.html?id=${id}`;
}

// 删除求购信息
function deleteWanted(id) {
    if (!confirm('确定要删除该求购信息吗？此操作不可恢复。')) return;
    const token = localStorage.getItem('token');
    fetch(`http://localhost:8080/api/products/wanted/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(res => {
        if (res.ok) {
            showMessage('求购信息已删除', 'success');
            loadSection('wanted', 1);
        } else {
            throw new Error('删除失败');
        }
    })
    .catch(err => {
        showMessage('删除失败，请重试', 'error');
        console.error(err);
    });
}

// 定义全局变量保存历史浏览和收藏数据，以便筛选和分页
let historyItems = [];
let favoritesItems = [];
let draftsItems = [];

// 根据时间筛选历史记录
function filterHistoryByTime(filter, allItems, typeFilter = 'all') {
    const container = document.getElementById('history-items-container');
    if (!container) return;
    
    // 确保处理前数据完整
    if (!Array.isArray(allItems) || allItems.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无浏览历史数据</div>';
        return [];
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    // 根据时间筛选
    let filteredItems = [];
    switch(filter) {
        case 'today':
            filteredItems = allItems.filter(item => {
                const browseTime = new Date(item.browseTime || item.time || new Date());
                return browseTime >= today;
            });
            break;
        case 'yesterday':
            filteredItems = allItems.filter(item => {
                const browseTime = new Date(item.browseTime || item.time || new Date());
                return browseTime >= yesterday && browseTime < today;
            });
            break;
        case 'week':
            filteredItems = allItems.filter(item => {
                const browseTime = new Date(item.browseTime || item.time || new Date());
                return browseTime >= lastWeek;
            });
            break;
        case 'month':
            filteredItems = allItems.filter(item => {
                const browseTime = new Date(item.browseTime || item.time || new Date());
                return browseTime >= lastMonth;
            });
            break;
        default:
            filteredItems = [...allItems];
    }
    
    // 根据类型进行二次筛选
    if (typeFilter !== 'all') {
        filteredItems = filteredItems.filter(item => {
            // 增强对类型的识别 - 特别是求购类型
            const isWanted = 
                item.itemType === 'wanted' || 
                (item.minPrice !== undefined || item.maxPrice !== undefined) ||
                (item.title && item.title.includes('求购'));
            
            return typeFilter === 'wanted' ? isWanted : !isWanted;
        });
    }
    
    console.log(`筛选后的历史数据: ${filteredItems.length}条`);
    
    // 分页逻辑
    const pageSize = PAGE_SIZE; // 使用全局PAGE_SIZE常量
    const currentPage = paginationState.history.currentPage || 1;
    const totalPages = Math.max(Math.ceil(filteredItems.length / pageSize), 1);
    
    // 如果当前页码超出范围，重置为第一页
    if (currentPage > totalPages) {
        paginationState.history.currentPage = 1;
    }
    
    const page = paginationState.history.currentPage;
    const start = (page - 1) * pageSize;
    const end = Math.min(start + pageSize, filteredItems.length); // 确保不越界
    const pageItems = filteredItems.slice(start, end);
    
    console.log(`历史浏览显示第${page}页，每页${pageSize}条，显示${pageItems.length}条，总共${filteredItems.length}条`);
    
    // 渲染页面
    const serverAddress = 'http://localhost:8080';
    const defaultImageUrl = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22120%22%20height%3D%22120%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%20120%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A10pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1%22%3E%3Crect%20width%3D%22120%22%20height%3D%22120%22%20fill%3D%22%23eee%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2240%22%20y%3D%2264.5%22%3E无图片%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
    
    if (pageItems.length === 0) {
        container.innerHTML = '<div class="empty-state">当前筛选条件下暂无浏览历史</div>';
    } else {
        container.innerHTML = pageItems.map(item => {
            // 获取图片
            let imgSrc = item.image || defaultImageUrl;
            
            // 针对求购项目特殊处理图片
            if (item.itemType === 'wanted') {
                if (item.images) {
                    if (Array.isArray(item.images) && item.images.length > 0) {
                        imgSrc = item.images[0] || imgSrc;
                    } else if (typeof item.images === 'string') {
                        try {
                            const parsedImages = JSON.parse(item.images);
                            if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                                imgSrc = parsedImages[0] || imgSrc;
                            }
                        } catch (e) {}
                    }
                }
            }
            
            // 处理图片路径
            if (imgSrc !== defaultImageUrl) {
                if (imgSrc.startsWith('data:')) {
                    // 保持不变
                } else if (imgSrc.startsWith('http')) {
                    // 修复端口问题
                    if (imgSrc.includes('localhost:8000')) {
                        imgSrc = imgSrc.replace('localhost:8000', 'localhost:8080');
                    }
                } else if (imgSrc.startsWith('/')) {
                    imgSrc = serverAddress + imgSrc;
                } else {
                    imgSrc = serverAddress + '/' + imgSrc.replace(/^\/+/, '');
                }
            }
            
            // 处理价格显示
            let priceText = '';
            if (item.itemType === 'wanted') {
                if (item.minPrice && item.maxPrice) {
                    priceText = `¥${parseFloat(item.minPrice).toFixed(2)} - ¥${parseFloat(item.maxPrice).toFixed(2)}`;
                } else if (item.minPrice) {
                    priceText = `¥${parseFloat(item.minPrice).toFixed(2)} 起`;
                } else if (item.maxPrice) {
                    priceText = `最高 ¥${parseFloat(item.maxPrice).toFixed(2)}`;
                } else if (item.price) {
                    priceText = `¥${parseFloat(item.price).toFixed(2)}`;
                } else {
                    priceText = '价格待议';
                }
            } else if (item.price) {
                priceText = `¥${parseFloat(item.price).toFixed(2)}`;
            } else {
                priceText = '价格未知';
            }
            
            // 格式化浏览时间
            const browseTime = new Date(item.browseTime || item.time || new Date()).toLocaleString();
            
            // 返回历史项HTML
            return `
            <div class="history-item ${item.itemType === 'wanted' ? 'wanted' : ''}" data-id="${item.itemId}" data-type="${item.itemType}">
                <div class="history-item-content" onclick="viewHistoryItem('${item.itemId}', '${item.itemType}')">
                    <div class="history-item-image">
                        <img src="${imgSrc}" alt="${item.title || '浏览项'}" onerror="this.onerror=null; this.src='${defaultImageUrl}';">
                    </div>
                    <div class="history-item-details">
                        <h3>${item.itemType === 'wanted' ? '求购: ' : ''}${item.title || '无标题'}</h3>
                        <p class="history-price">${priceText}</p>
                        <p class="history-time">浏览于: ${browseTime}</p>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    }
    
    // 更新分页状态
    updatePagination('history', page, totalPages);
    
    // 添加页码信息显示
    const historyInfo = document.createElement('div');
    historyInfo.className = 'pagination-info';
    historyInfo.style.textAlign = 'center';
    historyInfo.style.margin = '10px 0';
    historyInfo.innerHTML = `第 <b>${page}</b> 页，共 <b>${totalPages}</b> 页，总计 <b>${filteredItems.length}</b> 条历史`;
    
    // 如果已有页码信息，则替换，否则添加
    const existingInfo = container.nextElementSibling;
    if (existingInfo && existingInfo.className === 'pagination-info') {
        existingInfo.innerHTML = historyInfo.innerHTML;
    } else {
        container.parentNode.insertBefore(historyInfo, container.nextSibling);
    }
    
    // 手动检查分页按钮状态
    const pagination = document.getElementById('history-pagination');
    if (pagination) {
        const prevButton = pagination.querySelector('.prev-page');
        const nextButton = pagination.querySelector('.next-page');
        if (prevButton) prevButton.disabled = page <= 1;
        if (nextButton) nextButton.disabled = page >= totalPages;
        console.log(`历史分页按钮状态(更新后): 上一页=${prevButton?.disabled ? '禁用' : '启用'}，下一页=${nextButton?.disabled ? '禁用' : '启用'}`);
    }
    
    return filteredItems;
}

// 添加一个全局调试函数
window.testPageChange = function(section, direction) {
    console.log(`测试手动翻页，分区：${section}，方向：${direction}`);
    
    const current = paginationState[section]?.currentPage || 1;
    const total = paginationState[section]?.totalPages || 1;
    
    let newPage = current;
    if (direction === 'next' && current < total) {
        newPage = current + 1;
    } else if (direction === 'prev' && current > 1) {
        newPage = current - 1;
    }
    
    console.log(`当前页：${current}，总页数：${total}，新页码：${newPage}`);
    
    try {
        handlePageChange(section, newPage);
        console.log(`手动翻页成功：${section} -> 第${newPage}页`);
        return true;
    } catch(err) {
        console.error('手动翻页出错:', err);
        showMessage('手动翻页出错，请查看控制台', 'error');
        return false;
    }
}

// 加载收藏列表
function loadFavorites(token) {
    if (!token) return;
    
    // 重置分页状态
    paginationState.favorites = {
        currentPage: 1,
        totalPages: 1
    };
    
    // 清空全局数据
    favoritesItems = [];
    
    // 加载数据 - 使用size=-1参数请求所有数据
    fetch(`${API_BASE_URL}/profile/favorites?size=-1`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        // 确保数据无重复并保存到全局变量
        const uniqueIds = new Set();
        favoritesItems = data.filter(item => {
            const key = `${item.itemType || 'product'}-${item.itemId}`;
            if (uniqueIds.has(key)) return false;
            uniqueIds.add(key);
            return true;
        });
        
        console.log('加载收藏成功:', favoritesItems.length, '条数据');
        const container = document.querySelector('.favorites-list');
        if (container) {
            renderFavoritesList(container, favoritesItems);
        }
    })
    .catch(error => {
        console.error('加载收藏失败:', error);
        const container = document.querySelector('.favorites-list');
        if (container) {
            container.innerHTML = '<div class="error-state">加载失败，请刷新重试</div>';
        }
    });
}

// 加载草稿箱列表
function loadDrafts(token) {
    if (!token) return;
    
    // 重置分页状态
    paginationState.drafts = {
        currentPage: 1,
        totalPages: 1
    };
    
    // 清空全局数据
    draftsItems = [];
    
    // 加载数据
    fetch(`${API_BASE_URL}/profile/drafts`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('加载草稿成功:', data.length, '条数据');
        const container = document.querySelector('.drafts-list');
        if (container) {
            renderDraftsList(container, data);
        }
    })
    .catch(error => {
        console.error('加载草稿失败:', error);
        const container = document.querySelector('.drafts-list');
        if (container) {
            container.innerHTML = '<div class="error-state">加载失败，请刷新重试</div>';
        }
    });
}
