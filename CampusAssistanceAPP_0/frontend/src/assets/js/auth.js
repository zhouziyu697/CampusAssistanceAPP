// 全局变量
const API_BASE_URL = 'http://localhost:8080/api';

// DOM 元素
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// 检查登录状态
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    
    // 移除本地登录标记（如果存在）
    localStorage.removeItem('localLogin');
    
    // 检查当前页面
    const currentPath = window.location.pathname;
    const currentHref = window.location.href;
    
    // 检查当前页面是否为个人中心页面
    if (currentPath.includes('profile.html') || 
        currentHref.includes('profile.html') || 
        currentPath.includes('profile') ||
        document.title.includes('个人中心')) {
        console.log('当前在个人中心页面，不执行重定向');
        return;
    }
    
    // 另外一种检测方法：检查页面元素
    if (document.getElementById('accountForm') || 
        document.querySelector('.profile-container')) {
        console.log('检测到个人中心页面元素，不执行重定向');
        return;
    }
    
    if (token) {
        // 检查当前是否已经在index.html页面
        if (currentPath.includes('/pages/index.html') || 
            currentHref.includes('/pages/index.html') ||
            currentPath.endsWith('index.html')) {
            console.log('已在主页，无需重定向');
            return;
        }
        console.log('检测到已登录状态，跳转到主页');
        window.location.href = '/pages/index.html';
        return;
    }
    
    // 检查是否刚刚修改了密码
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            if (user.passwordChanged) {
                // 清除密码更改标记
                user.passwordChanged = false;
                localStorage.setItem('user', JSON.stringify(user));
                
                // 显示密码已修改的消息
                showMessage('密码已修改，请使用新密码登录', 'info');
                
                // 如果有保存学号，自动填充
                const loginStudentIdInput = document.getElementById('loginStudentId');
                if (loginStudentIdInput && user.studentId) {
                    loginStudentIdInput.value = user.studentId;
                }
            }
        } catch (e) {
            console.error('解析用户数据时出错:', e);
        }
    }
}

// 切换登录/注册表单
function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabs = document.querySelectorAll('.tab-btn');

    if (tab === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        tabs[0].classList.remove('active');
        tabs[1].classList.add('active');
    }
}

// 处理登录
async function handleLogin(event) {
    event.preventDefault();
    
    const studentId = document.getElementById('loginStudentId').value;
    const password = document.getElementById('loginPassword').value;

    console.log('尝试登录:', { studentId });

    // 尝试服务器登录
    try {
        const requestBody = {
            studentId: studentId,
            password: password
        };
        console.log('发送登录请求到:', `${API_BASE_URL}/auth/login`);

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        console.log('登录响应状态:', response.status);
        const responseText = await response.text();
        console.log('登录响应内容:', responseText);

        if (response.ok) {
            // 服务器登录成功
            const data = JSON.parse(responseText);
            console.log('服务器登录成功，保存token和用户信息');
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // 移除本地登录标记
            localStorage.removeItem('localLogin');
            
            showMessage('登录成功！', 'success');
            console.log('准备跳转到主页');
            setTimeout(() => {
                window.location.href = '/pages/index.html';
            }, 1000);
            return;
        } else {
            // 服务器登录失败，显示错误信息
            let errorMessage = '登录失败，请检查学号和密码';
            try {
                const errorData = JSON.parse(responseText);
                errorMessage = errorData.message || errorData.error || errorMessage;
                console.log('登录失败:', errorMessage);
            } catch (e) {
                console.error('解析错误响应失败:', e);
            }
            showMessage(errorMessage, 'error');
        }
    } catch (error) {
        console.error('登录请求失败:', error);
        showMessage('服务器连接失败，请确认后端服务已启动', 'error');
    }
}

// 处理注册
async function handleRegister(event) {
    event.preventDefault();
    
    const studentId = document.getElementById('registerStudentId').value;
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // 表单验证
    if (password !== confirmPassword) {
        showMessage('两次输入的密码不一致', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                studentId,
                username,
                email,
                password
            })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('注册成功！请登录', 'success');
            switchTab('login');
        } else {
            showMessage(data.error || '注册失败，请稍后重试', 'error');
        }
    } catch (error) {
        console.error('注册请求失败:', error);
        showMessage('注册失败，请稍后重试', 'error');
    }
}

// 显示消息
function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 3000);
}

// 页面加载时检查登录状态
document.addEventListener('DOMContentLoaded', () => {
    console.log('页面加载完成，检查登录状态');
    checkAuthStatus();
    
    // 添加表单提交事件监听器
    if (loginForm) {
        console.log('添加登录表单提交事件监听器');
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        console.log('添加注册表单提交事件监听器');
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // 检查URL参数
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('passwordChanged')) {
        showMessage('密码已修改，请使用新密码登录', 'info');
    }
});

async function tryServerSync() {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
        console.log("发送请求到服务器，使用Token:", token.substring(0, 10) + "...");
        const response = await fetch('http://localhost:8080/api/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include',
            mode: 'cors'
        });
        
        console.log("服务器响应状态:", response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log("服务器返回数据:", data);
            return true;
        } else {
            console.error("服务器返回错误:", response.status);
            return false;
        }
    } catch (error) {
        console.error("请求出错:", error);
        return false;
    }
} 