package com.campus.assistance.repository;

import com.campus.assistance.entity.Chat;
import com.campus.assistance.model.Message;
import com.campus.assistance.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    
    // 查询用户之间的私聊消息
    @Query("SELECT m FROM Message m WHERE m.messageType = 'PRIVATE' AND ((m.sender.id = :userOneId AND m.receiver.id = :userTwoId) OR (m.sender.id = :userTwoId AND m.receiver.id = :userOneId)) ORDER BY m.createdAt DESC")
    Page<Message> findMessagesBetweenUsers(@Param("userOneId") Long userOneId, @Param("userTwoId") Long userTwoId, Pageable pageable);
    
    // 计算两个用户之间的消息数量
    @Query("SELECT COUNT(m) FROM Message m WHERE m.messageType = 'PRIVATE' AND ((m.sender.id = :userOneId AND m.receiver.id = :userTwoId) OR (m.sender.id = :userTwoId AND m.receiver.id = :userOneId))")
    long countMessagesBetweenUsers(@Param("userOneId") Long userOneId, @Param("userTwoId") Long userTwoId);
    
    // 查找用户发送或接收的所有消息
    Page<Message> findBySenderOrReceiverOrderByCreatedAtDesc(User sender, User receiver, Pageable pageable);
} 