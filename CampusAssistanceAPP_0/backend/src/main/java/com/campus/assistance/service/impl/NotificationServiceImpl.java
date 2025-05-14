package com.campus.assistance.service.impl;

import com.campus.assistance.dto.NotificationDTO;
import com.campus.assistance.entity.Notification;
import com.campus.assistance.model.User;
import com.campus.assistance.exception.ResourceNotFoundException;
import com.campus.assistance.repository.NotificationRepository;
import com.campus.assistance.repository.UserRepository;
import com.campus.assistance.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Override
    public Page<NotificationDTO> getUserNotifications(Long userId, int page, int size) {
        User user = getUserById(userId);
        
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user, pageRequest);
        
        return notifications.map(this::convertToDTO);
    }

    @Override
    public int getUnreadNotificationCount(Long userId) {
        User user = getUserById(userId);
        return notificationRepository.countByUserAndStatus(user, Notification.NotificationStatus.UNREAD);
    }

    @Override
    public NotificationDTO getNotificationById(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));
        
        // 验证用户是否有权限查看该通知
        if (!notification.getUser().getId().equals(userId)) {
            throw new SecurityException("You don't have permission to view this notification");
        }
        
        return convertToDTO(notification);
    }

    @Override
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));
        
        // 验证用户是否有权限操作该通知
        if (!notification.getUser().getId().equals(userId)) {
            throw new SecurityException("You don't have permission to modify this notification");
        }
        
        // 如果已经是已读状态，不做任何操作
        if (notification.getStatus() == Notification.NotificationStatus.READ) {
            return;
        }
        
        notification.setStatus(Notification.NotificationStatus.READ);
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        User user = getUserById(userId);
        
        // 获取所有未读通知
        PageRequest pageRequest = PageRequest.of(0, Integer.MAX_VALUE);
        Page<Notification> unreadNotifications = notificationRepository.findByUserOrderByCreatedAtDesc(user, pageRequest);
        
        // 标记为已读
        unreadNotifications.getContent().forEach(notification -> {
            if (notification.getStatus() == Notification.NotificationStatus.UNREAD) {
                notification.setStatus(Notification.NotificationStatus.READ);
                notificationRepository.save(notification);
            }
        });
    }

    @Override
    @Transactional
    public NotificationDTO createNotification(Long userId, String title, String content, Notification.NotificationType type) {
        User user = getUserById(userId);
        
        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .content(content)
                .status(Notification.NotificationStatus.UNREAD)
                .type(type)
                .createdAt(LocalDateTime.now())
                .build();
        
        Notification savedNotification = notificationRepository.save(notification);
        return convertToDTO(savedNotification);
    }
    
    // 辅助方法
    private User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }
    
    private NotificationDTO convertToDTO(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId().toString())
                .title(notification.getTitle())
                .content(notification.getContent())
                .status(notification.getStatus().name().toLowerCase())
                .type(notification.getType().name().toLowerCase())
                .createdAt(notification.getCreatedAt())
                .build();
    }
} 