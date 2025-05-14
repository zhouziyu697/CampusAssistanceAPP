package com.campus.assistance.service.impl;

import com.campus.assistance.dto.ProfileResponse;
import com.campus.assistance.entity.Product;
import com.campus.assistance.model.*;
import com.campus.assistance.repository.*;
import com.campus.assistance.exception.ResourceNotFoundException;
import com.campus.assistance.service.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.annotation.Transactional;
import com.campus.assistance.enums.ProductStatus;
import com.campus.assistance.enums.ProductType;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.math.BigDecimal;

@Slf4j
@Service
public class ProfileServiceImpl implements ProfileService {
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private UserProfileRepository userProfileRepository;
    
    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private SystemMessageRepository systemMessageRepository;
    
    @Autowired
    private BrowseHistoryRepository browseHistoryRepository;
    
    @Autowired
    private DraftRepository draftRepository;
    
    @Autowired
    private FavoriteRepository favoriteRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private PurchaseRecordRepository purchaseRecordRepository;
    
    @Autowired
    private WantedItemRepository wantedItemRepository;
    
    @Autowired
    private ExpressOrderRepository expressOrderRepository;

    @Override
    public ProfileResponse getProfile(User user) {
        log.info("获取用户资料: {}", user.getDisplayName());
        
        ProfileResponse response = new ProfileResponse();
        response.setId(user.getId());
        response.setStudentId(user.getStudentId());
        response.setUsername(user.getDisplayName());
        response.setEmail(user.getEmail());
        
        // 获取个人资料
        userProfileRepository.findByUser(user).ifPresent(profile -> {
            response.setAvatar(profile.getAvatar());
            response.setPhone(profile.getPhone());
            response.setAddress(profile.getAddress());
            response.setBio(profile.getBio());
        });
        
        // 获取未读消息数量
        Long unreadCount = systemMessageRepository.countByReceiverAndIsRead(user, false);
        response.setUnreadMessageCount(unreadCount);
        
        return response;
    }

    @Override
    @Transactional
    public ProfileResponse updateProfile(User user, Map<String, Object> profileData) {
        log.info("更新用户资料: {}, 数据: {}", user.getDisplayName(), profileData);
        
        // 获取最新的用户对象，确保数据是最新的
        User freshUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        // 获取或创建用户资料
        UserProfile profile = userProfileRepository.findByUser(freshUser)
                .orElse(new UserProfile());
        
        profile.setUser(freshUser);
        
        // 更新资料
        if (profileData.containsKey("avatar")) {
            profile.setAvatar((String) profileData.get("avatar"));
        }
        
        if (profileData.containsKey("phone")) {
            profile.setPhone((String) profileData.get("phone"));
        }
        
        if (profileData.containsKey("address")) {
            profile.setAddress((String) profileData.get("address"));
        }
        
        if (profileData.containsKey("bio")) {
            profile.setBio((String) profileData.get("bio"));
        }
        
        // 保存资料
        userProfileRepository.save(profile);
        
        // 更新用户基本信息
        boolean userUpdated = false;
        
        if (profileData.containsKey("username")) {
            String newUsername = (String) profileData.get("username");
            if (newUsername != null && !newUsername.trim().isEmpty() && !newUsername.equals(freshUser.getDisplayName())) {
                log.info("更新用户名: {} -> {}", freshUser.getDisplayName(), newUsername);
                freshUser.setUsername(newUsername);
                userUpdated = true;
            }
        }
        
        if (profileData.containsKey("email")) {
            String newEmail = (String) profileData.get("email");
            if (newEmail != null && !newEmail.trim().isEmpty() && !newEmail.equals(freshUser.getEmail())) {
                // 检查邮箱是否已被其他用户使用
                if (userRepository.existsByEmailAndIdNot(newEmail, freshUser.getId())) {
                    log.warn("邮箱已被其他用户使用: {}", newEmail);
                    throw new RuntimeException("该邮箱已被其他用户使用");
                }
                log.info("更新邮箱: {} -> {}", freshUser.getEmail(), newEmail);
                freshUser.setEmail(newEmail);
                userUpdated = true;
            }
        }
        
        // 添加密码更新逻辑
        if (profileData.containsKey("password") && profileData.containsKey("currentPassword")) {
            String currentPassword = (String) profileData.get("currentPassword");
            String newPassword = (String) profileData.get("password");
            
            // 注入PasswordEncoder
            org.springframework.security.crypto.password.PasswordEncoder passwordEncoder = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
            
            // 验证当前密码
            if (!passwordEncoder.matches(currentPassword, freshUser.getPassword())) {
                log.warn("当前密码验证失败");
                throw new RuntimeException("当前密码不正确");
            }
            
            // 更新密码
            log.info("更新用户密码");
            freshUser.setPassword(passwordEncoder.encode(newPassword));
            userUpdated = true;
        }
        
        // 如果有更新用户基本信息，保存用户
        if (userUpdated) {
            log.info("保存用户基本信息到数据库...");
            try {
                // 强制更新，确保更改被持久化
                User savedUser = userRepository.saveAndFlush(freshUser);
                log.info("用户基本信息已更新并保存: id={}, username={}", savedUser.getId(), savedUser.getUsername());
            } catch (Exception e) {
                log.error("保存用户信息到数据库失败: ", e);
                throw new RuntimeException("数据库更新失败: " + e.getMessage());
            }
        }
        
        // 返回更新后的资料
        return getProfile(freshUser);
    }

    @Override
    public List<Map<String, Object>> getMessages(User user) {
        log.info("获取用户消息: {}", user.getUsername());
        
        // 获取用户的消息
        List<Message> messages = systemMessageRepository.findByReceiverOrderByCreatedAtDesc(user);
        
        // 将消息转换为Map
        return messages.stream().map(message -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", message.getId());
            map.put("content", message.getContent());
            map.put("type", message.getMessageType());
            map.put("isRead", message.getIsRead());
            map.put("time", message.getCreatedAt());
            
            // 如果是私信，添加发送者信息
            if (message.getSender() != null) {
                Map<String, Object> sender = new HashMap<>();
                sender.put("id", message.getSender().getId());
                sender.put("username", message.getSender().getUsername());
                map.put("sender", sender);
            }
            
            return map;
        }).collect(Collectors.toList());
    }

    @Override
    public List<Map<String, Object>> getBrowseHistory(User user) {
        try {
            log.info("获取用户浏览历史: studentId={}", user.getStudentId());
        List<BrowseHistory> history = browseHistoryRepository.findByUserOrderByBrowseTimeDesc(user);
        
        return history.stream().map(item -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", item.getId());
            map.put("itemId", item.getItemId());
                map.put("itemType", item.getItemType());
                map.put("title", item.getTitle());
                map.put("price", item.getPrice());
                map.put("image", item.getImage());
                
                // 添加images字段，支持多图片显示
                if (item.getImages() != null && !item.getImages().isEmpty()) {
                    map.put("images", item.getImages());
                    log.info("浏览历史条目[{}]包含{}张图片", item.getId(), item.getImages().size());
                } else if ("wanted".equals(item.getItemType())) {
                    // 对于求购记录，如果没有images字段，尝试查询商品表获取完整图片列表
                    try {
                        Optional<com.campus.assistance.entity.Product> productOpt = 
                            productRepository.findById(item.getItemId());
                        if (productOpt.isPresent() && productOpt.get().getImages() != null 
                            && !productOpt.get().getImages().isEmpty()) {
                            map.put("images", productOpt.get().getImages());
                            log.info("从Product表补充浏览历史条目[{}]的图片列表，共{}张", 
                                    item.getId(), productOpt.get().getImages().size());
                        }
                    } catch (Exception e) {
                        log.error("尝试获取求购商品图片列表出错", e);
                    }
                }
                
                map.put("browseTime", item.getBrowseTime());
                return map;
            }).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("获取浏览历史失败: ", e);
            return Collections.emptyList();
        }
    }

    @Override
    public void addBrowseHistory(User user, Long productId, String type) {
        try {
            log.info("添加浏览历史: studentId={}, productId={}, type={}", user.getStudentId(), productId, type);
            
            // 默认使用占位图
            String defaultImagePlaceholder = "/uploads/placeholder.jpg";
            
            // 根据type参数直接判断是商品还是求购信息
            if ("wanted".equalsIgnoreCase(type)) {
                // 处理求购信息浏览历史
                log.info("处理求购信息浏览历史: 类型=wanted, ID={}", productId);
                
                // 首先尝试从WantedItem表中查找
                Optional<WantedItem> wantedOpt = wantedItemRepository.findById(productId);
                
                if (wantedOpt.isPresent()) {
                    // 如果在WantedItem表中找到对应记录
                    WantedItem wanted = wantedOpt.get();
                    log.info("成功从WantedItem表找到求购信息: title={}", wanted.getTitle());
                    
                    processBrowseHistoryForWantedItem(user, productId, wanted, defaultImagePlaceholder);
                } else {
                    // 如果在WantedItem表中找不到，则尝试从Product表中查找类型为WANTED的商品
                    log.info("未在WantedItem表中找到求购信息，尝试从Product表查找: ID={}", productId);
            Optional<com.campus.assistance.entity.Product> productOpt = productRepository.findById(productId);
                    
            if (productOpt.isPresent()) {
                com.campus.assistance.entity.Product product = productOpt.get();
                        
                        // 检查商品类型是否为WANTED(求购)
                        if (product.getType() != null && "WANTED".equalsIgnoreCase(product.getType().toString())) {
                            log.info("成功在Product表中找到求购信息: title={}", product.getTitle());
                
                            // 查找是否已有该求购信息的浏览记录
                Optional<BrowseHistory> existingRecord = browseHistoryRepository.findByUserAndItemIdAndItemType(
                                user, productId, "wanted");
                
                BrowseHistory browseHistory;
                
                if (existingRecord.isPresent()) {
                    // 如果已存在，更新浏览时间
                    log.info("已存在浏览记录，更新浏览时间");
                    browseHistory = existingRecord.get();
                    browseHistory.setBrowseTime(LocalDateTime.now());
                } else {
                    // 如果不存在，创建新记录
                                log.info("创建新的浏览记录 (Product-Wanted)");
                    browseHistory = new BrowseHistory();
                    browseHistory.setUser(user);
                    browseHistory.setItemId(productId);
                                browseHistory.setItemType("wanted");
                    browseHistory.setType("history");
                    browseHistory.setTitle(product.getTitle());
                    
                                // 设置价格
                    if (product.getPrice() != null) {
                        browseHistory.setPrice(product.getPrice());
                                } else if (product.getMaxPrice() != null) {
                                    browseHistory.setPrice(product.getMaxPrice());
                    }
                    
                                // 使用简单的占位图或第一张图片
                    if (product.getImages() != null && !product.getImages().isEmpty()) {
                        String firstImage = product.getImages().get(0);
                        if (firstImage != null && !firstImage.trim().isEmpty() &&
                                        !firstImage.startsWith("data:image")) {
                            browseHistory.setImage(firstImage);
                        } else {
                                        browseHistory.setImage(defaultImagePlaceholder);
                        }
                    } else {
                                    browseHistory.setImage(defaultImagePlaceholder);
                    }
                    
                    browseHistory.setBrowseTime(LocalDateTime.now());
                }
                
                browseHistoryRepository.save(browseHistory);
                log.info("浏览历史保存成功: id={}", browseHistory.getId());
                return;
                        } else {
                            log.warn("找到的商品不是求购类型: ID={}, 实际类型={}", productId, product.getType());
                            // 尝试作为普通商品处理
                            processBrowseHistoryForProduct(user, productId, product, defaultImagePlaceholder);
                            return;
                        }
                    } else {
                        // 如果在两个表中都找不到对应记录
                        throw new ResourceNotFoundException("求购信息不存在: " + productId);
                    }
                }
            } else {
                // 处理普通商品浏览历史
                Optional<com.campus.assistance.entity.Product> productOpt = productRepository.findById(productId);
                if (productOpt.isPresent()) {
                    com.campus.assistance.entity.Product product = productOpt.get();
                    log.info("成功找到商品: title={}", product.getTitle());
                    
                    processBrowseHistoryForProduct(user, productId, product, defaultImagePlaceholder);
                } else {
                    throw new ResourceNotFoundException("商品不存在: " + productId);
                }
            }
        } catch (ResourceNotFoundException e) {
            log.error("添加浏览历史失败: 商品不存在: {}", productId, e);
            throw e;
        } catch (Exception e) {
            log.error("添加浏览历史失败: {}", e.getMessage(), e);
            throw new RuntimeException("添加浏览历史失败: " + e.getMessage(), e);
        }
    }
    
    /**
     * 处理WantedItem的浏览历史
     */
    private void processBrowseHistoryForWantedItem(User user, Long productId, WantedItem wanted, String defaultImagePlaceholder) {
                // 查找是否已有该求购信息的浏览记录
                Optional<BrowseHistory> existingRecord = browseHistoryRepository.findByUserAndItemIdAndItemType(
                    user, productId, "wanted");
                
                BrowseHistory browseHistory;
                
                if (existingRecord.isPresent()) {
                    // 如果已存在，更新浏览时间
                    log.info("已存在浏览记录，更新浏览时间");
                    browseHistory = existingRecord.get();
                    browseHistory.setBrowseTime(LocalDateTime.now());
                } else {
                    // 如果不存在，创建新记录
            log.info("创建新的浏览记录 (WantedItem)");
                    browseHistory = new BrowseHistory();
                    browseHistory.setUser(user);
                    browseHistory.setItemId(productId);
                    browseHistory.setItemType("wanted");
                    browseHistory.setType("history");
                    browseHistory.setTitle(wanted.getTitle());
                    
                    // 设置价格
                    if (wanted.getMaxBudget() != null) {
                        browseHistory.setPrice(wanted.getMaxBudget());
                    }
                    
            // 尝试查找对应Product表中的商品，获取图片
            Optional<com.campus.assistance.entity.Product> productOpt = productRepository.findById(productId);
            if (productOpt.isPresent()) {
                com.campus.assistance.entity.Product product = productOpt.get();
                if (product.getImages() != null && !product.getImages().isEmpty()) {
                    String firstImage = product.getImages().get(0);
                    if (firstImage != null && !firstImage.trim().isEmpty()) {
                        // 处理图片URL，确保不会太长
                        String processedImage = processImageUrl(firstImage);
                        browseHistory.setImage(processedImage);
                        
                        // 设置完整的图片数组，供前端使用
                        // 浏览历史中保留完整的images列表
                        browseHistory.setImages(product.getImages());
                        log.info("使用Product表中求购信息的第一张图片作为封面: {}, 总共图片数量: {}", 
                                 processedImage, product.getImages().size());
                    } else {
                        browseHistory.setImage(defaultImagePlaceholder);
                        log.info("Product表中求购信息的第一张图片为空，使用默认占位图");
                    }
                } else {
                    browseHistory.setImage(defaultImagePlaceholder);
                    log.info("Product表中求购信息没有图片，使用默认占位图");
                }
            } else {
                browseHistory.setImage(defaultImagePlaceholder);
                log.info("没有找到对应的商品图片，使用默认占位图");
            }
                    
                    browseHistory.setBrowseTime(LocalDateTime.now());
                }
                
                browseHistoryRepository.save(browseHistory);
                log.info("浏览历史保存成功: id={}", browseHistory.getId());
            }
            
    /**
     * 处理普通商品的浏览历史
     */
    private void processBrowseHistoryForProduct(User user, Long productId, com.campus.assistance.entity.Product product, String defaultImagePlaceholder) {
        // 查找是否已有该商品的浏览记录
        String itemType = product.getType() != null ? product.getType().toString().toLowerCase() : "normal";
        Optional<BrowseHistory> existingRecord = browseHistoryRepository.findByUserAndItemIdAndItemType(
            user, productId, itemType);
        
        BrowseHistory browseHistory;
        
        if (existingRecord.isPresent()) {
            // 如果已存在，更新浏览时间
            log.info("已存在浏览记录，更新浏览时间");
            browseHistory = existingRecord.get();
            browseHistory.setBrowseTime(LocalDateTime.now());
        } else {
            // 如果不存在，创建新记录
            log.info("创建新的浏览记录 (Product)");
            browseHistory = new BrowseHistory();
            browseHistory.setUser(user);
            browseHistory.setItemId(productId);
            browseHistory.setItemType(itemType);
            browseHistory.setType("history");
            browseHistory.setTitle(product.getTitle());
            
            // 价格可能为null，需要安全处理
            if (product.getPrice() != null) {
                browseHistory.setPrice(product.getPrice());
            }
            
            // 设置图片 - 仅保存第一张图片的URL，不保存base64数据
            if (product.getImages() != null && !product.getImages().isEmpty()) {
                String firstImage = product.getImages().get(0);
                if (firstImage != null && !firstImage.trim().isEmpty()) {
                    if (firstImage.startsWith("data:image")) {
                        // 如果是base64数据，使用占位图
                        browseHistory.setImage(defaultImagePlaceholder);
                    } else if (firstImage.startsWith("/uploads/") || firstImage.startsWith("http")) {
                        // 如果是URL，处理后存储
                        String processedImage = processImageUrl(firstImage);
                        browseHistory.setImage(processedImage);
                    } else {
                        browseHistory.setImage(defaultImagePlaceholder);
                    }
                } else {
                    browseHistory.setImage(defaultImagePlaceholder);
                }
            } else {
                browseHistory.setImage(defaultImagePlaceholder);
            }
            
            browseHistory.setBrowseTime(LocalDateTime.now());
        }
        
        browseHistoryRepository.save(browseHistory);
        log.info("浏览历史保存成功: id={}", browseHistory.getId());
    }
    
    /**
     * 处理图片URL，确保不会太长
     * @param imageUrl 原始图片URL
     * @return 处理后的图片URL
     */
    private String processImageUrl(String imageUrl) {
        if (imageUrl == null || imageUrl.trim().isEmpty()) {
            return "/uploads/placeholder.jpg";
        }
        
        // 如果是数据URL，或者非常长的URL，使用默认占位图
        if (imageUrl.contains("data:image") || imageUrl.length() > 2000) {
            return "/uploads/placeholder.jpg";
        }
        
        // 确保URL格式统一
        if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
            // 如果是完整URL，检查是否为本地服务器的图片
            if (imageUrl.contains("localhost:8080")) {
                // 提取相对路径
                int index = imageUrl.indexOf("/uploads/");
                if (index >= 0) {
                    return imageUrl.substring(index);
                }
            }
            // 外部URL保持不变，但限制长度
            return imageUrl.length() > 250 ? imageUrl.substring(0, 250) : imageUrl;
        } else if (imageUrl.startsWith("/uploads/")) {
            // 已经是标准格式，保持不变
            return imageUrl;
        } else if (imageUrl.startsWith("/")) {
            // 其他以/开头的路径
            return imageUrl;
        } else {
            // 其他情况，添加/uploads/前缀
            return "/uploads/" + imageUrl;
        }
    }
    
    @Override
    public void addBrowseHistory(User user, Long productId) {
        // 调用带有type参数的方法，保持兼容性
        addBrowseHistory(user, productId, null);
    }

    @Override
    public List<Map<String, Object>> getDrafts(User user) {
        log.info("获取用户草稿: {}", user.getUsername());
        
        // 获取用户的草稿
        List<Draft> drafts = draftRepository.findByUserOrderByUpdatedAtDesc(user);
        
        // 将草稿转换为Map
        return drafts.stream().map(draft -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", draft.getId());
            map.put("type", draft.getDraftType());
            map.put("title", draft.getTitle());
            map.put("content", draft.getContent());
            map.put("updatedAt", draft.getUpdatedAt());
            return map;
        }).collect(Collectors.toList());
    }

    @Override
    public List<Map<String, Object>> getFavorites(User user) {
        log.info("获取用户收藏: {}", user.getUsername());
        
        // 获取用户的收藏
        List<Favorite> favorites = favoriteRepository.findByUserOrderByCreatedAtDesc(user);
        
        // 将收藏转换为Map
        return favorites.stream().map(favorite -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", favorite.getId());
            map.put("type", favorite.getItemType());
            map.put("itemId", favorite.getItemId());
            map.put("createdAt", favorite.getCreatedAt());
            
            // 根据类型获取额外信息
            if ("product".equals(favorite.getItemType())) {
                productRepository.findById(favorite.getItemId()).ifPresent(product -> {
                    map.put("title", product.getTitle());
                    map.put("price", product.getPrice());
                    map.put("status", product.getStatus());
                    map.put("image", product.getImages() != null && !product.getImages().isEmpty() ? product.getImages().get(0) : null);
                });
            } else if ("express".equals(favorite.getItemType())) {
                expressOrderRepository.findById(favorite.getItemId()).ifPresent(order -> {
                    map.put("pickup", order.getPickupLocation());
                    map.put("destination", order.getDestination());
                    map.put("reward", order.getReward());
                    map.put("status", order.getStatus());
                });
            } else if ("wanted".equals(favorite.getItemType())) {
                productRepository.findById(favorite.getItemId()).ifPresent(product -> {
                    map.put("title", product.getTitle());
                    map.put("minPrice", product.getMinPrice());
                    map.put("maxPrice", product.getMaxPrice());
                    // 取第一张图片
                    if (product.getImages() != null && !product.getImages().isEmpty()) {
                        map.put("image", product.getImages().get(0));
                    } else {
                        map.put("image", null);
                    }
                });
            }
            
            return map;
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void addFavorite(User user, String itemType, Long itemId) {
        log.info("添加收藏: 用户={}, 类型={}, ID={}", user.getUsername(), itemType, itemId);
        
        // 检查是否已经收藏
        Optional<Favorite> existingFavorite = favoriteRepository.findByUserAndItemTypeAndItemId(user, itemType, itemId);
        if (existingFavorite.isPresent()) {
            log.info("该商品已在收藏中");
            return;
        }
        
        // 创建新的收藏记录
        Favorite favorite = new Favorite();
        favorite.setUser(user);
        favorite.setItemType(itemType);
        favorite.setItemId(itemId);
        
        // 保存收藏
        favoriteRepository.save(favorite);
        log.info("收藏添加成功");
    }

    @Override
    @Transactional
    public void removeFavorite(User user, String itemType, Long itemId) {
        log.info("取消收藏: 用户={}, 类型={}, ID={}", user.getUsername(), itemType, itemId);
        
        // 查找收藏记录
        Optional<Favorite> favorite = favoriteRepository.findByUserAndItemTypeAndItemId(user, itemType, itemId);
        if (favorite.isPresent()) {
            // 删除收藏
            favoriteRepository.delete(favorite.get());
            log.info("收藏取消成功");
        } else {
            log.info("该商品未在收藏中");
        }
    }

    @Override
    public List<Map<String, Object>> getPurchasedItems(User user) {
        log.info("获取用户已购买商品: {}", user.getUsername());
        
        // 获取用户的购买记录
        List<PurchaseRecord> records = purchaseRecordRepository.findByBuyerOrderByPurchaseTimeDesc(user);
        
        // 将购买记录转换为Map
        return records.stream().map(record -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", record.getId());
            map.put("productId", record.getProduct().getId());
            map.put("title", record.getProduct().getTitle());
            map.put("price", record.getPrice());
            map.put("purchaseTime", record.getPurchaseTime());
            map.put("status", record.getStatus());
            map.put("image", record.getProduct().getImages() != null && !record.getProduct().getImages().isEmpty() ? record.getProduct().getImages().get(0) : null);
            
            // 添加卖家信息
            Map<String, Object> seller = new HashMap<>();
            seller.put("id", record.getSeller().getId());
            seller.put("username", record.getSeller().getUsername());
            map.put("seller", seller);
            
            return map;
        }).collect(Collectors.toList());
    }

    @Override
    public List<Map<String, Object>> getWantedItems(User user) {
        log.info("获取用户求购信息: {}", user.getUsername());
        
        // 获取用户的求购信息
        List<Product> products = productRepository.findByUserAndTypeAndStatus(user, ProductType.WANTED, ProductStatus.ACTIVE);
        
        // 将求购信息转换为Map
        return products.stream().map(product -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", product.getId());
            map.put("title", product.getTitle());
            map.put("description", product.getDescription());
            map.put("minPrice", product.getMinPrice());
            map.put("maxPrice", product.getMaxPrice());
            map.put("urgencyLevel", product.getUrgencyLevel());
            map.put("status", product.getStatus());
            map.put("publishTime", product.getPublishTime());
            map.put("images", product.getImages());
            return map;
        }).collect(Collectors.toList());
    }

    @Override
    public List<Map<String, Object>> getPublishedItems(User user) {
        log.info("获取用户发布商品: {}", user.getUsername());
        // 只查普通商品（不包含求购）
        List<Product> products = productRepository.findByUserAndType(user, ProductType.NORMAL);
        // 根据发布时间排序（使用与entity.Product兼容的方法）
        products.sort((p1, p2) -> {
            if (p1.getPublishTime() == null && p2.getPublishTime() == null) return 0;
            if (p1.getPublishTime() == null) return 1;
            if (p2.getPublishTime() == null) return -1;
            return p2.getPublishTime().compareTo(p1.getPublishTime());
        });
        // 将商品转换为Map
        return products.stream().map(product -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", product.getId());
            map.put("title", product.getTitle());
            map.put("description", product.getDescription());
            map.put("price", product.getPrice());
            map.put("originalPrice", product.getOriginalPrice());
            map.put("conditionLevel", product.getConditionLevel());
            map.put("status", product.getStatus());
            map.put("createdAt", product.getPublishTime());
            map.put("updatedAt", product.getLastModified());
            map.put("image", product.getImages() != null && !product.getImages().isEmpty() ? product.getImages().get(0) : null);
            return map;
        }).collect(Collectors.toList());
    }

    @Override
    public List<Map<String, Object>> getSoldItems(User user) {
        log.info("获取用户已售商品: {}", user.getUsername());
        
        // 获取用户的售出记录
        List<PurchaseRecord> records = purchaseRecordRepository.findBySellerOrderByPurchaseTimeDesc(user);
        
        // 将售出记录转换为Map
        return records.stream().map(record -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", record.getId());
            map.put("productId", record.getProduct().getId());
            map.put("title", record.getProduct().getTitle());
            map.put("price", record.getPrice());
            map.put("purchaseTime", record.getPurchaseTime());
            map.put("status", record.getStatus());
            map.put("image", record.getProduct().getImages() != null && !record.getProduct().getImages().isEmpty() ? record.getProduct().getImages().get(0) : null);
            
            // 添加买家信息
            Map<String, Object> buyer = new HashMap<>();
            buyer.put("id", record.getBuyer().getId());
            buyer.put("username", record.getBuyer().getUsername());
            map.put("buyer", buyer);
            
            return map;
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void clearBrowseHistory(User user) {
        log.info("清空用户浏览历史: {}", user.getUsername());
        try {
            // 删除该用户的所有浏览记录
            browseHistoryRepository.deleteByUser(user);
            log.info("用户浏览历史清空成功");
        } catch (Exception e) {
            log.error("清空浏览历史失败: ", e);
            throw new RuntimeException("清空浏览历史失败: " + e.getMessage(), e);
        }
    }
} 