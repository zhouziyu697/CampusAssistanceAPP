package com.campus.assistance.repository;

import com.campus.assistance.entity.Chat;
import com.campus.assistance.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatRepository extends JpaRepository<Chat, Long> {
    
    @Query("SELECT c FROM Chat c WHERE c.userOne = :user OR c.userTwo = :user ORDER BY c.lastMessageTime DESC")
    List<Chat> findChatsByUser(@Param("user") User user);
    
    @Query("SELECT c FROM Chat c WHERE (c.userOne = :userOne AND c.userTwo = :userTwo) OR (c.userOne = :userTwo AND c.userTwo = :userOne)")
    Chat findChatBetweenUsers(@Param("userOne") User userOne, @Param("userTwo") User userTwo);
    
    @Query("SELECT COUNT(c) FROM Chat c WHERE (c.userOne = :user AND c.userOneUnreadCount > 0) OR (c.userTwo = :user AND c.userTwoUnreadCount > 0)")
    int countUnreadChats(@Param("user") User user);
} 