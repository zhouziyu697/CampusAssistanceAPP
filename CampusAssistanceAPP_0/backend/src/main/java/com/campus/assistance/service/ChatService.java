package com.campus.assistance.service;

import com.campus.assistance.dto.ChatDTO;
import com.campus.assistance.dto.MessageDTO;
import org.springframework.data.domain.Page;

import java.util.List;

public interface ChatService {
    
    List<ChatDTO> getUserChats(Long userId);
    
    int getUnreadChatsCount(Long userId);
    
    ChatDTO getChatById(Long chatId, Long userId);
    
    ChatDTO createOrGetChat(Long userId, Long otherUserId);
    
    Page<MessageDTO> getChatMessages(Long chatId, Long userId, int page, int size);
    
    MessageDTO sendMessage(Long chatId, Long senderId, String content);
    
    void markChatAsRead(Long chatId, Long userId);
    
    void deleteChat(Long chatId, Long userId);
} 