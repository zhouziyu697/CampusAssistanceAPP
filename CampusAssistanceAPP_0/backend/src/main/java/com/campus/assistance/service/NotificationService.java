package com.campus.assistance.service;

import com.campus.assistance.dto.NotificationDTO;
import com.campus.assistance.entity.Notification;
import org.springframework.data.domain.Page;

public interface NotificationService {
    
    Page<NotificationDTO> getUserNotifications(Long userId, int page, int size);
    
    int getUnreadNotificationCount(Long userId);
    
    NotificationDTO getNotificationById(Long notificationId, Long userId);
    
    void markAsRead(Long notificationId, Long userId);
    
    void markAllAsRead(Long userId);
    
    NotificationDTO createNotification(Long userId, String title, String content, Notification.NotificationType type);
} 