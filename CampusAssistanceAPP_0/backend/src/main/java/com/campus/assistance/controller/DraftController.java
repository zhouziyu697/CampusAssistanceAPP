package com.campus.assistance.controller;

import com.campus.assistance.model.Draft;
import com.campus.assistance.model.User;
import com.campus.assistance.repository.DraftRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/drafts")
public class DraftController {
    
    @Autowired
    private DraftRepository draftRepository;
    
    @PostMapping
    public ResponseEntity<?> saveDraft(@AuthenticationPrincipal User user, @RequestBody Draft draftRequest) {
        log.info("收到保存草稿请求: {}", draftRequest);
        
        try {
            if (user == null) {
                log.error("保存草稿失败: 用户未认证或认证信息无效");
                Map<String, String> error = new HashMap<>();
                error.put("error", "用户未认证或认证信息无效");
                return ResponseEntity.status(401).body(error);
            }
            
            // 创建新草稿对象
            Draft draft = new Draft();
            draft.setUser(user);
            draft.setDraftType(draftRequest.getDraftType());
            draft.setTitle(draftRequest.getTitle());
            draft.setContent(draftRequest.getContent());
            
            // 保存草稿
            Draft savedDraft = draftRepository.save(draft);
            log.info("草稿保存成功: {}", savedDraft);
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedDraft.getId());
            response.put("message", "草稿保存成功");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("保存草稿失败: ", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDraft(@AuthenticationPrincipal User user, @PathVariable Long id) {
        log.info("收到删除草稿请求: draftId={}", id);
        
        try {
            if (user == null) {
                log.error("删除草稿失败: 用户未认证或认证信息无效");
                Map<String, String> error = new HashMap<>();
                error.put("error", "用户未认证或认证信息无效");
                return ResponseEntity.status(401).body(error);
            }
            
            // 查找草稿
            Draft draft = draftRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("草稿不存在"));
            
            // 检查草稿是否属于当前用户
            if (!draft.getUser().getId().equals(user.getId())) {
                log.error("删除草稿失败: 无权限删除该草稿");
                Map<String, String> error = new HashMap<>();
                error.put("error", "无权限删除该草稿");
                return ResponseEntity.status(403).body(error);
            }
            
            // 删除草稿
            draftRepository.delete(draft);
            log.info("草稿删除成功: {}", draft);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "草稿删除成功");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("删除草稿失败: ", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getDraft(@AuthenticationPrincipal User user, @PathVariable Long id) {
        log.info("收到获取草稿请求: draftId={}", id);
        
        try {
            if (user == null) {
                log.error("获取草稿失败: 用户未认证或认证信息无效");
                Map<String, String> error = new HashMap<>();
                error.put("error", "用户未认证或认证信息无效");
                return ResponseEntity.status(401).body(error);
            }
            
            // 查找草稿
            Draft draft = draftRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("草稿不存在"));
            
            // 检查草稿是否属于当前用户
            if (!draft.getUser().getId().equals(user.getId())) {
                log.error("获取草稿失败: 无权限查看该草稿");
                Map<String, String> error = new HashMap<>();
                error.put("error", "无权限查看该草稿");
                return ResponseEntity.status(403).body(error);
            }
            
            // 返回草稿
            return ResponseEntity.ok(draft);
            
        } catch (Exception e) {
            log.error("获取草稿失败: ", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
} 