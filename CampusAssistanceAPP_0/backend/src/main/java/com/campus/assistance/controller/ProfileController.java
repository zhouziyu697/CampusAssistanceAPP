package com.campus.assistance.controller;

import com.campus.assistance.dto.ProfileResponse;
import com.campus.assistance.model.User;
import com.campus.assistance.service.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    @Autowired
    private ProfileService profileService;

    @GetMapping
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal User user) {
        log.info("收到获取个人资料请求");
        try {
            if (user == null) {
                log.error("获取个人资料失败: 用户未认证或认证信息无效");
                Map<String, String> error = new HashMap<>();
                error.put("error", "用户未认证或认证信息无效");
                return ResponseEntity.status(401).body(error);
            }
            
            log.info("用户已认证: studentId={}, username={}", user.getStudentId(), user.getDisplayName());
            
            ProfileResponse profile = profileService.getProfile(user);
            log.info("成功获取个人资料: {}", profile);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            log.error("获取个人资料失败: ", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> profileData) {
        try {
            ProfileResponse profile = profileService.updateProfile(user, profileData);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            log.error("更新个人资料失败: ", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/messages")
    public ResponseEntity<?> getMessages(@AuthenticationPrincipal User user) {
        try {
            return ResponseEntity.ok(profileService.getMessages(user));
        } catch (Exception e) {
            log.error("获取消息失败: ", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/history")
    public ResponseEntity<?> getBrowseHistory(@AuthenticationPrincipal User user) {
        try {
            return ResponseEntity.ok(profileService.getBrowseHistory(user));
        } catch (Exception e) {
            log.error("获取浏览历史失败: ", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @DeleteMapping("/history")
    public ResponseEntity<?> clearBrowseHistory(@AuthenticationPrincipal User user) {
        try {
            if (user == null) {
                log.error("清空浏览记录失败: 用户未认证");
                Map<String, String> error = new HashMap<>();
                error.put("error", "用户未认证");
                return ResponseEntity.status(401).body(error);
            }
            
            profileService.clearBrowseHistory(user);
            return ResponseEntity.ok(Map.of("message", "浏览历史已清空"));
        } catch (Exception e) {
            log.error("清空浏览历史失败: ", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PostMapping("/history/clear")
    public ResponseEntity<?> clearBrowseHistoryPost(@AuthenticationPrincipal User user) {
        try {
            if (user == null) {
                log.error("清空浏览记录失败: 用户未认证");
                Map<String, String> error = new HashMap<>();
                error.put("error", "用户未认证");
                return ResponseEntity.status(401).body(error);
            }
            
            profileService.clearBrowseHistory(user);
            return ResponseEntity.ok(Map.of("message", "浏览历史已清空"));
        } catch (Exception e) {
            log.error("清空浏览历史失败: ", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PostMapping("/history/{productId}")
    public ResponseEntity<?> addBrowseHistory(
            @AuthenticationPrincipal User user,
            @PathVariable Long productId,
            @RequestParam(required = false) String type) {
        try {
            if (user == null) {
                log.error("添加浏览记录失败: 用户未认证");
                Map<String, String> error = new HashMap<>();
                error.put("error", "用户未认证");
                return ResponseEntity.status(401).body(error);
            }

            // 记录请求参数
            log.info("添加浏览记录: productId={}, type={}", productId, type);

            // 传递type参数给服务层
            profileService.addBrowseHistory(user, productId, type);
            return ResponseEntity.ok(Map.of("message", "添加浏览记录成功"));
        } catch (Exception e) {
            log.error("添加浏览记录失败: ", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/drafts")
    public ResponseEntity<?> getDrafts(@AuthenticationPrincipal User user) {
        try {
            return ResponseEntity.ok(profileService.getDrafts(user));
        } catch (Exception e) {
            log.error("获取草稿箱失败: ", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/favorites")
    public ResponseEntity<?> getFavorites(@AuthenticationPrincipal User user) {
        try {
            return ResponseEntity.ok(profileService.getFavorites(user));
        } catch (Exception e) {
            log.error("获取收藏夹失败: ", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PostMapping("/favorites")
    public ResponseEntity<?> addFavorite(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> request) {
        try {
            if (user == null) {
                log.error("添加收藏失败: 用户未认证");
                Map<String, String> error = new HashMap<>();
                error.put("error", "用户未认证");
                return ResponseEntity.status(401).body(error);
            }

            String itemType = (String) request.get("itemType");
            Long itemId = Long.valueOf(request.get("itemId").toString());

            if (itemType == null || itemId == null) {
                log.error("添加收藏失败: 参数不完整");
                Map<String, String> error = new HashMap<>();
                error.put("error", "参数不完整");
                return ResponseEntity.badRequest().body(error);
            }

            profileService.addFavorite(user, itemType, itemId);
            return ResponseEntity.ok(Map.of("message", "收藏成功"));
        } catch (Exception e) {
            log.error("添加收藏失败: ", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @DeleteMapping("/favorites/{itemType}/{itemId}")
    public ResponseEntity<?> removeFavorite(
            @AuthenticationPrincipal User user,
            @PathVariable String itemType,
            @PathVariable Long itemId) {
        try {
            if (user == null) {
                log.error("取消收藏失败: 用户未认证");
                Map<String, String> error = new HashMap<>();
                error.put("error", "用户未认证");
                return ResponseEntity.status(401).body(error);
            }

            profileService.removeFavorite(user, itemType, itemId);
            return ResponseEntity.ok(Map.of("message", "取消收藏成功"));
        } catch (Exception e) {
            log.error("取消收藏失败: ", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/purchased")
    public ResponseEntity<?> getPurchasedItems(@AuthenticationPrincipal User user) {
        try {
            return ResponseEntity.ok(profileService.getPurchasedItems(user));
        } catch (Exception e) {
            log.error("获取已购买商品失败: ", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/wanted")
    public ResponseEntity<?> getWantedItems(@AuthenticationPrincipal User user) {
        try {
            return ResponseEntity.ok(profileService.getWantedItems(user));
        } catch (Exception e) {
            log.error("获取求购信息失败: ", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/published")
    public ResponseEntity<?> getPublishedItems(@AuthenticationPrincipal User user) {
        try {
            return ResponseEntity.ok(profileService.getPublishedItems(user));
        } catch (Exception e) {
            log.error("获取发布商品失败: ", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/sold")
    public ResponseEntity<?> getSoldItems(@AuthenticationPrincipal User user) {
        try {
            return ResponseEntity.ok(profileService.getSoldItems(user));
        } catch (Exception e) {
            log.error("获取已售商品失败: ", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/test")
    public ResponseEntity<?> testAuthentication(@AuthenticationPrincipal User user) {
        if (user != null) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "认证成功");
            response.put("studentId", user.getStudentId());
            response.put("username", user.getUsername());
            return ResponseEntity.ok(response);
        } else {
            Map<String, String> error = new HashMap<>();
            error.put("error", "用户未认证");
            return ResponseEntity.status(401).body(error);
        }
    }
} 