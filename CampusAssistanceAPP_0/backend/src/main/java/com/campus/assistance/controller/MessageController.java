package com.campus.assistance.controller;

import com.campus.assistance.dto.ChatDTO;
import com.campus.assistance.dto.MessageDTO;
import com.campus.assistance.dto.NotificationDTO;
import com.campus.assistance.entity.Notification;
import com.campus.assistance.model.User;
import com.campus.assistance.service.ChatService;
import com.campus.assistance.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
public class MessageController {

    private final ChatService chatService;
    private final NotificationService notificationService;

    // 聊天相关接口

    @GetMapping("/chats")
    public ResponseEntity<Map<String, Object>> getUserChats(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<ChatDTO> chats = chatService.getUserChats(user.getId());
        int unreadCount = chatService.getUnreadChatsCount(user.getId());
        
        Map<String, Object> response = new HashMap<>();
        response.put("chats", chats);
        response.put("unreadCount", unreadCount);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/chats/{chatId}")
    public ResponseEntity<ChatDTO> getChatById(@PathVariable Long chatId, @AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        ChatDTO chat = chatService.getChatById(chatId, user.getId());
        return ResponseEntity.ok(chat);
    }

    @PostMapping("/chats/create")
    public ResponseEntity<ChatDTO> createChat(@RequestParam Long otherUserId, @AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        ChatDTO chat = chatService.createOrGetChat(user.getId(), otherUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(chat);
    }

    @GetMapping("/chats/{chatId}/messages")
    public ResponseEntity<Map<String, Object>> getChatMessages(
            @PathVariable Long chatId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @AuthenticationPrincipal User user) {
        
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        Page<MessageDTO> messages = chatService.getChatMessages(chatId, user.getId(), page, size);
        
        Map<String, Object> response = new HashMap<>();
        response.put("messages", messages.getContent());
        response.put("currentPage", messages.getNumber());
        response.put("totalItems", messages.getTotalElements());
        response.put("totalPages", messages.getTotalPages());
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/chats/{chatId}/send")
    public ResponseEntity<MessageDTO> sendMessage(
            @PathVariable Long chatId,
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal User user) {
        
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        String content = payload.get("content");
        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        MessageDTO message = chatService.sendMessage(chatId, user.getId(), content);
        return ResponseEntity.status(HttpStatus.CREATED).body(message);
    }

    @PutMapping("/chats/{chatId}/read")
    public ResponseEntity<Void> markChatAsRead(@PathVariable Long chatId, @AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        chatService.markChatAsRead(chatId, user.getId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/chats/{chatId}")
    public ResponseEntity<Void> deleteChat(@PathVariable Long chatId, @AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        chatService.deleteChat(chatId, user.getId());
        return ResponseEntity.noContent().build();
    }

    // 通知相关接口

    @GetMapping("/notifications")
    public ResponseEntity<Map<String, Object>> getUserNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal User user) {
        
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        Page<NotificationDTO> notifications = notificationService.getUserNotifications(user.getId(), page, size);
        int unreadCount = notificationService.getUnreadNotificationCount(user.getId());
        
        Map<String, Object> response = new HashMap<>();
        response.put("notifications", notifications.getContent());
        response.put("unreadCount", unreadCount);
        response.put("currentPage", notifications.getNumber());
        response.put("totalItems", notifications.getTotalElements());
        response.put("totalPages", notifications.getTotalPages());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/notifications/{notificationId}")
    public ResponseEntity<NotificationDTO> getNotificationById(
            @PathVariable Long notificationId,
            @AuthenticationPrincipal User user) {
        
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        NotificationDTO notification = notificationService.getNotificationById(notificationId, user.getId());
        return ResponseEntity.ok(notification);
    }

    @PutMapping("/notifications/{notificationId}/read")
    public ResponseEntity<Void> markNotificationAsRead(
            @PathVariable Long notificationId,
            @AuthenticationPrincipal User user) {
        
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        notificationService.markAsRead(notificationId, user.getId());
        return ResponseEntity.ok().build();
    }

    // 测试系统通知接口
    @PostMapping("/notifications/test")
    public ResponseEntity<NotificationDTO> createTestNotification(
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal User user) {
        
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        String title = payload.get("title");
        String content = payload.get("content");
        
        if (title == null || title.trim().isEmpty() || content == null || content.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        NotificationDTO notification = notificationService.createNotification(
                user.getId(),
                title,
                content,
                Notification.NotificationType.SYSTEM
        );
        
        return ResponseEntity.status(HttpStatus.CREATED).body(notification);
    }
} 