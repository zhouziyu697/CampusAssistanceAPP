package com.campus.assistance.repository;

import com.campus.assistance.entity.Notification;
import com.campus.assistance.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    Page<Notification> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
    
    int countByUserAndStatus(User user, Notification.NotificationStatus status);
} 