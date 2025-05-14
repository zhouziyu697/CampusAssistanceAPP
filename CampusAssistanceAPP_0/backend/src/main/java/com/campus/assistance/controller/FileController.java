package com.campus.assistance.controller;

import com.campus.assistance.model.User;
import com.campus.assistance.service.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class FileController {

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;
    
    @Autowired
    private ProfileService profileService;
    
    /**
     * 上传用户头像
     */
    @PostMapping("/profile/avatar")
    public ResponseEntity<?> uploadAvatar(
            @AuthenticationPrincipal User user,
            @RequestParam("file") MultipartFile file) {
        
        log.info("收到头像上传请求: 用户={}, 文件大小={}KB", user.getStudentId(), file.getSize()/1024);
        
        if (user == null) {
            log.error("上传头像失败: 用户未认证");
            return ResponseEntity.status(401).body(Map.of("error", "用户未认证"));
        }
        
        try {
            // 确保上传目录存在
            String avatarDir = uploadDir + "/avatars";
            Path uploadPath = Paths.get(avatarDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                log.info("创建头像上传目录: {}", uploadPath);
            }
            
            // 生成唯一的文件名
            String originalFilename = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String newFilename = UUID.randomUUID().toString() + fileExtension;
            
            // 保存文件
            Path targetLocation = uploadPath.resolve(newFilename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            
            // 更新用户资料
            String avatarUrl = "/uploads/avatars/" + newFilename;
            Map<String, Object> profileData = new HashMap<>();
            profileData.put("avatar", avatarUrl);
            
            // 调用ProfileService更新用户头像URL
            profileService.updateProfile(user, profileData);
            
            log.info("头像上传成功: 用户={}, 新头像路径={}", user.getStudentId(), avatarUrl);
            
            Map<String, String> response = new HashMap<>();
            response.put("avatarUrl", avatarUrl);
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            log.error("头像上传失败: ", e);
            return ResponseEntity.badRequest().body(Map.of("error", "头像上传失败: " + e.getMessage()));
        }
    }
    
    /**
     * 上传商品图片
     */
    @PostMapping("/products/images")
    public ResponseEntity<?> uploadProductImages(
            @AuthenticationPrincipal User user,
            @RequestParam("files") MultipartFile[] files) {
        
        log.info("收到商品图片上传请求: 用户={}, 文件数量={}", user.getStudentId(), files.length);
        
        if (user == null) {
            log.error("上传商品图片失败: 用户未认证");
            return ResponseEntity.status(401).body(Map.of("error", "用户未认证"));
        }
        
        if (files.length > 5) {
            log.error("上传商品图片失败: 超过最大数量限制(5)");
            return ResponseEntity.badRequest().body(Map.of("error", "最多只能上传5张图片"));
        }
        
        try {
            // 确保上传目录存在
            String productImagesDir = uploadDir + "/products";
            Path uploadPath = Paths.get(productImagesDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                log.info("创建商品图片上传目录: {}", uploadPath);
            }
            
            List<String> imageUrls = new ArrayList<>();
            
            for (MultipartFile file : files) {
                if (file.isEmpty()) {
                    continue;
                }
                
                // 检查文件类型
                String contentType = file.getContentType();
                if (contentType == null || !contentType.startsWith("image/")) {
                    log.warn("跳过非图片文件: contentType={}", contentType);
                    continue;
                }
                
                // 生成唯一的文件名
                String originalFilename = file.getOriginalFilename();
                String fileExtension = "";
                if (originalFilename != null && originalFilename.contains(".")) {
                    fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
                }
                String newFilename = UUID.randomUUID().toString() + fileExtension;
                
                // 保存文件
                Path targetLocation = uploadPath.resolve(newFilename);
                Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
                
                // 添加URL到结果列表
                String imageUrl = "/uploads/products/" + newFilename;
                imageUrls.add(imageUrl);
                
                log.info("商品图片保存成功: {}", targetLocation);
            }
            
            log.info("商品图片上传完成: 用户={}, 成功上传数量={}", user.getStudentId(), imageUrls.size());
            
            Map<String, Object> response = new HashMap<>();
            response.put("images", imageUrls);
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            log.error("商品图片上传失败: ", e);
            return ResponseEntity.badRequest().body(Map.of("error", "商品图片上传失败: " + e.getMessage()));
        }
    }
} 