package com.campus.assistance.repository;

import com.campus.assistance.model.Message;
import com.campus.assistance.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SystemMessageRepository extends JpaRepository<Message, Long> {
    
    /**
     * 查找用户接收的所有消息，按创建时间降序排序
     */
    List<Message> findByReceiverOrderByCreatedAtDesc(User receiver);
    
    /**
     * 统计用户未读消息数量
     */
    Long countByReceiverAndIsRead(User receiver, Boolean isRead);
} 