// 求购详情页脚本
// 获取URL参数
function getQueryParam(name) {
    const url = window.location.search;
    const params = new URLSearchParams(url);
    return params.get(name);
}

const wantedId = getQueryParam('id');
const API_BASE_URL = 'http://localhost:8080/api';

function renderUrgency(level) {
    let className = 'urgency-tag';
    let text = '普通';
    
    switch(level) {
        case 'very_urgent':
            className += ' urgency-very-urgent';
            text = '非常急需';
            break;
        case 'urgent':
            className += ' urgency-urgent';
            text = '急需';
            break;
        default:
            className += ' urgency-normal';
            text = '普通';
    }
    
    return `<span class="${className}">${text}</span>`;
}

function renderPublisherAvatar(name) {
    if (!name) return '';
    const firstChar = name.charAt(0).toUpperCase();
    return `<span>${firstChar}</span>`;
}

async function loadWantedDetail(wantedId) {
    try {
        const token = localStorage.getItem('token');
        const headers = {
            'Accept': 'application/json'
        };
        
        // 如果有token，添加到请求头
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // 修改API路径为正确的后端接口
        const response = await fetch(`${API_BASE_URL}/products/wanted/${wantedId}`, {
            headers: headers,
            credentials: 'include'  // 包含cookies
        });

        if (!response.ok) {
            if (response.status === 403) {
                showMessage('请先登录', 'warning');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
                return;
            }
            throw new Error('获取求购详情失败');
        }

        wantedDetail = await response.json();
        
        // 更新页面内容
        document.getElementById('wantedTitle').textContent = wantedDetail.title || '无标题';
        
        // 处理价格显示
        let priceText = '期望价格：';
        if (wantedDetail.minPrice && wantedDetail.maxPrice) {
            priceText += `¥${parseFloat(wantedDetail.minPrice).toFixed(2)} - ¥${parseFloat(wantedDetail.maxPrice).toFixed(2)}`;
        } else if (wantedDetail.minPrice) {
            priceText += `¥${parseFloat(wantedDetail.minPrice).toFixed(2)} 起`;
        } else if (wantedDetail.maxPrice) {
            priceText += `最高 ¥${parseFloat(wantedDetail.maxPrice).toFixed(2)}`;
        } else {
            priceText += '不限';
        }
        document.getElementById('wantedPrice').textContent = priceText;
        
        document.getElementById('urgencyLevel').innerHTML = renderUrgency(wantedDetail.urgencyLevel);
        
        // 处理商品分类显示
        const categoryMap = {
            'books': '教材书籍',
            'electronics': '电子产品',
            'daily': '日用百货',
            'clothing': '服装服饰',
            'sports': '体育器材',
            'others': '其他'
        };
        const category = wantedDetail.category ? (categoryMap[wantedDetail.category] || wantedDetail.category) : '未指定';
        document.getElementById('productCategory').textContent = category;
        
        // 处理期望成色显示
        let condition = '未指定';
        switch(wantedDetail.conditionLevel) {
            case 'new': condition = '全新'; break;
            case 'almost_new': condition = '9成新'; break;
            case 'slightly_used': condition = '7成新'; break;
            case 'used': condition = '5成新及以下'; break;
        }
        document.getElementById('conditionLevel').textContent = condition;
        
        document.getElementById('publishTime').textContent = wantedDetail.publishTime ? new Date(wantedDetail.publishTime).toLocaleString() : '';
        document.getElementById('wantedDescription').textContent = wantedDetail.description || '';
        
        // 更新发布者信息
        let user = wantedDetail.publisher || wantedDetail.user || null;
        let userName = user ? (user.username || user.userName || user.name) : (wantedDetail.userName || '');
        let userEmail = user ? (user.email || '') : (wantedDetail.email || '');
        let userPhone = user ? (user.phone || '') : (wantedDetail.phone || '');
        
        document.getElementById('publisherName').textContent = userName || '未知用户';
        document.getElementById('publisherAvatar').innerHTML = renderPublisherAvatar(userName);
        
        let contact = '';
        if (userEmail) contact += `邮箱：${userEmail}`;
        if (userPhone) contact += (contact ? '，' : '') + `电话：${userPhone}`;
        document.getElementById('publisherContact').textContent = contact;
        
        // 更新图片
        const mainImage = document.getElementById('mainImage');
        const thumbnailsContainer = document.getElementById('thumbnailsContainer');
        thumbnailsContainer.innerHTML = '';
        
        let images = Array.isArray(wantedDetail.images) ? wantedDetail.images : [];
        // 处理图片路径
        const processedImages = images.map(img => {
            if (!img) return null;
            if (img.startsWith('/uploads/')) {
                return 'http://localhost:8080' + img;
            }
            return img;
        }).filter(Boolean);
        
        // 添加默认占位图
        const defaultImageUrl = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22120%22%20height%3D%22120%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%20120%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A10pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1%22%3E%3Crect%20width%3D%22120%22%20height%3D%22120%22%20fill%3D%22%23eee%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2240%22%20y%3D%2264.5%22%3E无图片%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
        
        if (processedImages.length > 0) {
            mainImage.src = processedImages[0];
            mainImage.style.display = 'block';
            mainImage.onerror = function() {
                this.src = defaultImageUrl;
            };
            
            // 生成缩略图
            processedImages.forEach((imgSrc, index) => {
                const thumbnail = document.createElement('img');
                thumbnail.src = imgSrc;
                thumbnail.className = 'thumbnail' + (index === 0 ? ' active' : '');
                thumbnail.alt = `${wantedDetail.title || '图片'} - ${index + 1}`;
                thumbnail.dataset.index = index;
                thumbnail.onerror = function() {
                    this.src = defaultImageUrl;
                };
                thumbnail.addEventListener('click', function() {
                    switchMainImage(imgSrc, parseInt(this.dataset.index));
                });
                thumbnailsContainer.appendChild(thumbnail);
            });
            
            // 更新导航按钮状态
            updateNavigationButtons();
        } else {
            mainImage.src = defaultImageUrl;
            mainImage.style.display = 'block';
            document.getElementById('prevImage').disabled = true;
            document.getElementById('nextImage').disabled = true;
            
            const thumbnail = document.createElement('img');
            thumbnail.className = 'thumbnail active';
            thumbnail.src = defaultImageUrl;
            thumbnail.alt = '无图片';
            thumbnailsContainer.appendChild(thumbnail);
        }
        
        // 检查是否已收藏
        console.log('准备检查收藏状态...');
        checkFavoriteStatus();
        
        // 延迟再检查一次，以防首次检查未完成
        setTimeout(() => {
            console.log('再次检查收藏状态...');
            checkFavoriteStatus();
        }, 1000);
        
        return wantedDetail;
    } catch (error) {
        console.error('加载求购详情失败:', error);
        showMessage('加载求购详情失败', 'error');
        throw error;
    }
}

// 更新导航按钮状态
function updateNavigationButtons() {
    const mainImage = document.getElementById('mainImage');
    const currentIndex = parseInt(mainImage.dataset.index || 0);
    const thumbnails = document.querySelectorAll('.thumbnail');
    const totalImages = thumbnails.length;

    // 更新上一页/下一页按钮状态
    document.getElementById('prevImage').disabled = currentIndex === 0;
    document.getElementById('nextImage').disabled = currentIndex === totalImages - 1;

    // 更新缩略图激活状态
    thumbnails.forEach((thumb, index) => {
        if (index === currentIndex) {
            thumb.classList.add('active');
        } else {
            thumb.classList.remove('active');
        }
    });
}

// 切换主图片
function switchMainImage(imgSrc, index) {
    const mainImage = document.getElementById('mainImage');
    mainImage.src = imgSrc;
    mainImage.dataset.index = index;
    updateNavigationButtons();
}

// ===== 收藏、历史浏览、联系求购人功能 =====
const favoriteBtn = document.getElementById('favoriteBtn');
const contactBtn = document.getElementById('contactBtn');
let isFavorite = false;

// 收藏按钮点击
if (favoriteBtn) {
    favoriteBtn.addEventListener('click', function() {
        if (!checkAuth()) return;
        
        // 禁用按钮防止重复点击
        this.disabled = true;
        
        toggleFavorite(this);
    });
}

// 收藏/取消收藏功能
async function toggleFavorite(button) {
    if (!wantedDetail) return;
    const wantedId = wantedDetail.id;
    const token = localStorage.getItem('token');
    
    if (!token) {
        showMessage('请先登录', 'warning');
        button.disabled = false;
        return;
    }
    
    try {
        let success = false;
        
        if (!isFavorite) {
            // 添加收藏
            success = await addToFavorites(wantedId, 'wanted');
            if (success) {
                isFavorite = true;
                button.classList.add('active');
                button.textContent = '已收藏';
                showMessage('收藏成功', 'success');
            } else {
                showMessage('收藏失败，请稍后再试', 'error');
            }
        } else {
            // 取消收藏
            success = await removeFromFavorites(wantedId, 'wanted');
            if (success) {
                isFavorite = false;
                button.classList.remove('active');
                button.textContent = '收藏';
                showMessage('已取消收藏', 'info');
            } else {
                showMessage('取消收藏失败，请稍后再试', 'error');
            }
        }

        // 重新启用按钮
        button.disabled = false;
    } catch (error) {
        console.error('收藏操作失败:', error);
        showMessage('操作失败，请稍后再试', 'error');
        button.disabled = false;
    }
}

// 添加收藏
async function addToFavorites(wantedId, itemType) {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('用户未登录，无法收藏');
        return false;
    }

    try {
        console.log(`尝试添加${itemType}收藏，ID:`, wantedId);
        
        // 确保wantedId是整数
        const numericId = parseInt(wantedId, 10);
        if (isNaN(numericId)) {
            console.error('无效的求购ID:', wantedId);
            return false;
        }

        // 准备发送的数据
        const requestData = {
            itemType: itemType,
            itemId: numericId
        };
        
        console.log('发送收藏请求数据:', requestData);
        
        const response = await fetch(`${API_BASE_URL}/profile/favorites`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        console.log('添加收藏响应状态:', response.status);
        
        if (response.ok) {
            console.log('收藏请求成功');
            // 更新UI状态
            isFavorite = true;
            if (favoriteBtn) {
                favoriteBtn.classList.add('active');
                favoriteBtn.textContent = '已收藏';
            }
            
            // 获取响应内容（如果有）
            try {
                const responseText = await response.text();
                if (responseText) {
                    console.log('收藏响应内容:', responseText);
                }
            } catch (e) {
                console.log('无法解析收藏响应内容');
            }
            
            // 立即再检查一次收藏状态，确保状态一致
            setTimeout(() => checkFavoriteStatus(), 300);
            
            return true;
        } else {
            console.error('服务器拒绝收藏请求:', response.status);
            // 尝试获取错误信息
            const text = await response.text();
            console.error('错误详情:', text);
            return false;
        }
    } catch (error) {
        console.error('添加收藏失败:', error);
        return false;
    }
}

// 取消收藏
async function removeFromFavorites(wantedId, itemType) {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('用户未登录，无法取消收藏');
        return false;
    }

    try {
        console.log(`尝试取消${itemType}收藏，ID:`, wantedId);
        
        // 确保wantedId是整数
        const numericId = parseInt(wantedId, 10);
        if (isNaN(numericId)) {
            console.error('无效的求购ID:', wantedId);
            return false;
        }
        
        // 构建请求URL
        const requestUrl = `${API_BASE_URL}/profile/favorites/${itemType}/${numericId}`;
        console.log('取消收藏请求URL:', requestUrl);
        
        const response = await fetch(requestUrl, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('取消收藏响应状态:', response.status);
        
        if (response.ok) {
            console.log('取消收藏请求成功');
            // 更新UI状态
            isFavorite = false;
            if (favoriteBtn) {
                favoriteBtn.classList.remove('active');
                favoriteBtn.textContent = '收藏';
            }
            
            // 获取响应内容（如果有）
            try {
                const responseText = await response.text();
                if (responseText) {
                    console.log('取消收藏响应内容:', responseText);
                }
            } catch (e) {
                console.log('无法解析取消收藏响应内容');
            }
            
            // 立即再检查一次收藏状态，确保状态一致
            setTimeout(() => checkFavoriteStatus(), 300);
            
            return true;
        } else {
            console.error('服务器拒绝取消收藏请求:', response.status);
            // 尝试获取错误信息
            const text = await response.text();
            console.error('错误详情:', text);
            return false;
        }
    } catch (error) {
        console.error('取消收藏失败:', error);
        return false;
    }
}

// 历史浏览
function addToBrowseHistory(wantedId) {
    if (!wantedId) {
        console.error('商品ID未定义');
        return;
    }

    console.log('准备添加浏览历史，求购ID为:', wantedId);
    
    // 必须确保wantedDetail已加载
    if (!wantedDetail) {
        console.error('商品详情未加载，无法添加浏览历史');
        return;
    }
    
    // 获取第一张图片作为封面
    let coverImage = '';
    
    // 处理图片逻辑
    if (wantedDetail.images && Array.isArray(wantedDetail.images) && wantedDetail.images.length > 0) {
        // 获取第一张图片
        let firstImage = wantedDetail.images[0];
        if (firstImage && typeof firstImage === 'string' && firstImage.trim() !== '') {
            // 记录原始图片路径
            console.log('原始图片路径:', firstImage);
            
            // 如果图片路径以http://localhost:8080开头，保持不变
            if (firstImage.startsWith('http://localhost:8080')) {
                coverImage = firstImage;
            } 
            // 如果图片路径已经是完整的URL，直接使用
            else if (firstImage.startsWith('http')) {
                coverImage = firstImage;
            } 
            // 如果图片路径以/uploads/开头，添加服务器地址
            else if (firstImage.startsWith('/uploads/')) {
                coverImage = 'http://localhost:8080' + firstImage;
            }
            // 其他情况，确保添加正确的前缀
            else {
                coverImage = 'http://localhost:8080/uploads/' + firstImage.replace(/^\/+/, '');
            }
            
            console.log('处理后图片路径:', coverImage);
        }
    }
    
    // 如果没有找到有效的图片，使用占位图
    const defaultImageUrl = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22120%22%20height%3D%22120%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%20120%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A10pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1%22%3E%3Crect%20width%3D%22120%22%20height%3D%22120%22%20fill%3D%22%23eee%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2240%22%20y%3D%2264.5%22%3E无图片%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
    if (!coverImage) {
        coverImage = defaultImageUrl;
        console.log('使用占位图作为封面');
    }
    
    try {
        // 处理所有图片路径，确保格式正确
        let processedImages = [];
        if (wantedDetail.images && Array.isArray(wantedDetail.images)) {
            processedImages = wantedDetail.images.map(img => {
                if (!img || typeof img !== 'string' || img.trim() === '') return null;
                
                // 标准化图片URL
                if (img.startsWith('http://localhost:8080') || img.startsWith('https://localhost:8080')) {
                    return img;
                } else if (img.startsWith('http')) {
                    return img;
                } else if (img.startsWith('/uploads/')) {
                    return 'http://localhost:8080' + img;
                } else {
                    return 'http://localhost:8080/uploads/' + img.replace(/^\/+/, '');
                }
            }).filter(img => img !== null);
        }
        
        // 本地存储浏览历史
        let history = [];
        try {
            history = JSON.parse(localStorage.getItem('browseHistory') || '[]');
            
            // 如果已存在，先移除
            const index = history.findIndex(item => item.id == wantedId);
            if (index !== -1) {
                history.splice(index, 1);
            }
            
            // 添加到历史记录前端
            history.unshift({
                id: wantedId,
                itemId: wantedId,
                itemType: 'wanted',
                title: wantedDetail.title || '无标题',
                price: wantedDetail.minPrice && wantedDetail.maxPrice 
                    ? `${wantedDetail.minPrice}-${wantedDetail.maxPrice}` 
                    : (wantedDetail.maxPrice || wantedDetail.minPrice || '价格未知'),
                image: coverImage,
                images: processedImages.length > 0 ? processedImages : [defaultImageUrl], // 保存所有图片
                browseTime: new Date().toISOString()
            });
            
            // 只保留最多10条历史记录
            if (history.length > 10) {
                history = history.slice(0, 10);
            }
            
            localStorage.setItem('browseHistory', JSON.stringify(history));
            console.log('浏览历史已保存到本地存储，包含完整图片数组:', processedImages);
        } catch (error) {
            console.error('本地存储浏览历史失败:', error);
            // 继续同步到服务器，不影响用户体验
        }
        
        // 向后端同步浏览记录
        const token = localStorage.getItem('token');
        if (token) {
            console.log('同步浏览历史到服务器...');
            
            fetch(`${API_BASE_URL}/profile/history/${wantedId}?type=wanted`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(response => {
                if (response.ok) {
                    console.log('浏览历史同步成功');
                } else {
                    console.error('同步浏览历史失败:', response.status);
                    return response.text().then(text => {
                        throw new Error(text || '同步历史失败');
                    });
                }
            })
            .catch(error => {
                console.error('同步浏览历史失败:', error);
            });
        }
    } catch (error) {
        console.error('添加浏览历史过程中发生错误:', error);
    }
}

// 联系求购人
if (contactBtn) {
    contactBtn.addEventListener('click', async function() {
        if (!wantedDetail || !wantedDetail.userId) return;
        const token = localStorage.getItem('token');
        if (!token) {
            alert('请先登录');
            window.location.href = 'login.html';
            return;
        }
        // 创建聊天
        const res = await fetch(`http://localhost:8080/messages/chats/create?otherUserId=${wantedDetail.userId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include',
            mode: 'cors'
        });
        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('selectedChatId', data.id);
            window.location.href = 'messages.html';
        } else {
            alert('创建聊天失败');
        }
    });
}

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('请先登录');
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// 获取URL参数
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// 显示消息
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 3000);
}

// 检查收藏状态
async function checkFavoriteStatus() {
    const token = localStorage.getItem('token');
    if (!token || !wantedDetail) return;

    try {
        // 检查URL参数是否包含isFavorite=true (从我的收藏页面过来)
        const urlParams = new URLSearchParams(window.location.search);
        const isFavoriteParam = urlParams.get('isFavorite');
        
        if (isFavoriteParam === 'true') {
            console.log('从收藏页面跳转而来，直接标记为已收藏状态');
            isFavorite = true;
            if (favoriteBtn) {
                favoriteBtn.classList.add('active');
                favoriteBtn.textContent = '已收藏';
            }
            return;
        }
        
        // 获取所有收藏列表
        const response = await fetch(`${API_BASE_URL}/profile/favorites`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const favorites = await response.json();
            console.log('API返回的收藏列表:', favorites);
            
            // 获取当前求购ID
            const currentWantedId = wantedDetail.id.toString();
            console.log('当前求购ID:', currentWantedId);
            
            // 扩展检查逻辑，考虑多种可能的itemType和格式
            const isInFavorites = favorites.some(fav => {
                const favItemId = fav.itemId ? fav.itemId.toString() : '';
                const favWantedId = fav.wantedId ? fav.wantedId.toString() : '';
                const favId = fav.id ? fav.id.toString() : '';
                
                const isWantedType = fav.itemType === 'wanted' || 
                                    fav.type === 'wanted' || 
                                    fav.wantedId !== undefined;
                
                const isMatchingId = favItemId === currentWantedId || 
                                    favWantedId === currentWantedId || 
                                    favId === currentWantedId;
                
                // 扩展的调试信息
                if (isWantedType && isMatchingId) {
                    console.log('找到匹配的收藏项:', fav);
                    return true;
                }
                
                // 特殊处理：检查itemId字段是否为当前求购ID
                if (favItemId === currentWantedId) {
                    console.log('通过itemId找到匹配:', fav);
                    return true;
                }
                
                return false;
            });
            
            // 检查当前求购是否在收藏列表中
            console.log('收藏状态:', isInFavorites ? '已收藏' : '未收藏');
            
            // 更新UI状态
            isFavorite = isInFavorites;
            if (favoriteBtn) {
                if (isFavorite) {
                    favoriteBtn.classList.add('active');
                    favoriteBtn.textContent = '已收藏';
                } else {
                    favoriteBtn.classList.remove('active');
                    favoriteBtn.textContent = '收藏';
                }
            }
        } else {
            console.error('获取收藏状态失败:', response.status);
        }
    } catch (error) {
        console.error('检查收藏状态出错:', error);
    }
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 获取URL参数
    const wantedId = getUrlParameter('id');
    if (!wantedId) {
        showMessage('求购信息ID不存在', 'error');
        return;
    }

    // 设置调试信息
    console.log('页面加载 - 求购详情页 ID:', wantedId);
    console.log('当前页面URL:', window.location.href);

    // 加载求购详情
    loadWantedDetail(wantedId).then(() => {
        // 在加载完求购详情后再记录浏览历史
        if (wantedDetail) {
            addToBrowseHistory(wantedId);
            
            // 手动触发一次收藏状态检查
            setTimeout(() => {
                console.log('手动触发收藏状态检查...');
                checkFavoriteStatus();
            }, 500);
        }
    }).catch(error => {
        console.error('加载求购详情失败:', error);
        showMessage('加载求购详情失败', 'error');
    });
}); 