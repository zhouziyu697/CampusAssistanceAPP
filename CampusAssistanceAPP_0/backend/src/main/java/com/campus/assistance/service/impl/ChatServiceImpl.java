package com.campus.assistance.service.impl;

import com.campus.assistance.dto.ChatDTO;
import com.campus.assistance.dto.MessageDTO;
import com.campus.assistance.entity.Chat;
import com.campus.assistance.model.Message;
import com.campus.assistance.model.User;
import com.campus.assistance.exception.ResourceNotFoundException;
import com.campus.assistance.repository.ChatRepository;
import com.campus.assistance.repository.MessageRepository;
import com.campus.assistance.repository.UserRepository;
import com.campus.assistance.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    @Override
    public List<ChatDTO> getUserChats(Long userId) {
        User user = getUserById(userId);
        List<Chat> chats = chatRepository.findChatsByUser(user);
        
        return chats.stream()
                .map(chat -> convertToDTO(chat, userId))
                .collect(Collectors.toList());
    }

    @Override
    public int getUnreadChatsCount(Long userId) {
        User user = getUserById(userId);
        return chatRepository.countUnreadChats(user);
    }

    @Override
    public ChatDTO getChatById(Long chatId, Long userId) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found with id: " + chatId));

        // 验证用户是否有权限访问该聊天
        if (!chat.getUserOne().getId().equals(userId) && !chat.getUserTwo().getId().equals(userId)) {
            throw new SecurityException("You don't have permission to access this chat");
        }

        return convertToDTO(chat, userId);
    }

    @Override
    @Transactional
    public ChatDTO createOrGetChat(Long userId, Long otherUserId) {
        if (userId.equals(otherUserId)) {
            throw new IllegalArgumentException("Cannot create chat with yourself");
        }

        User currentUser = getUserById(userId);
        User otherUser = getUserById(otherUserId);

        Chat existingChat = chatRepository.findChatBetweenUsers(currentUser, otherUser);
        if (existingChat != null) {
            return convertToDTO(existingChat, userId);
        }

        // 创建新聊天
        Chat newChat = Chat.builder()
                .userOne(currentUser)
                .userTwo(otherUser)
                .userOneUnreadCount(0)
                .userTwoUnreadCount(0)
                .isGroup(false)
                .lastMessageTime(LocalDateTime.now())
                .build();

        Chat savedChat = chatRepository.save(newChat);
        return convertToDTO(savedChat, userId);
    }

    @Override
    public Page<MessageDTO> getChatMessages(Long chatId, Long userId, int page, int size) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found with id: " + chatId));

        // 验证用户是否有权限访问该聊天
        if (!chat.getUserOne().getId().equals(userId) && !chat.getUserTwo().getId().equals(userId)) {
            throw new SecurityException("You don't have permission to access this chat");
        }

        Long otherUserId = chat.getUserOne().getId().equals(userId) ? chat.getUserTwo().getId() : chat.getUserOne().getId();
        
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Message> messages = messageRepository.findMessagesBetweenUsers(userId, otherUserId, pageRequest);

        return messages.map(message -> convertToMessageDTO(message, userId));
    }

    @Override
    @Transactional
    public MessageDTO sendMessage(Long chatId, Long senderId, String content) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found with id: " + chatId));
        User sender = getUserById(senderId);

        // 验证用户是否有权限访问该聊天
        if (!chat.getUserOne().getId().equals(senderId) && !chat.getUserTwo().getId().equals(senderId)) {
            throw new SecurityException("You don't have permission to send message to this chat");
        }

        // 创建新消息
        Message message = new Message();
        message.setContent(content);
        message.setSender(sender);
        
        // 设置接收者（另一个聊天对象）
        User receiver = chat.getUserOne().getId().equals(senderId) ? chat.getUserTwo() : chat.getUserOne();
        message.setReceiver(receiver);
        
        // 设置消息类型为私聊消息
        message.setMessageType("PRIVATE");
        
        Message savedMessage = messageRepository.save(message);

        // 更新聊天的最后一条消息
        chat.setLastMessage(content);
        chat.setLastMessageTime(savedMessage.getCreatedAt());

        // 更新未读消息计数
        if (chat.getUserOne().getId().equals(senderId)) {
            chat.setUserTwoUnreadCount((chat.getUserTwoUnreadCount() != null ? chat.getUserTwoUnreadCount() : 0) + 1);
        } else {
            chat.setUserOneUnreadCount((chat.getUserOneUnreadCount() != null ? chat.getUserOneUnreadCount() : 0) + 1);
        }

        chatRepository.save(chat);

        return convertToMessageDTO(savedMessage, senderId);
    }

    @Override
    @Transactional
    public void markChatAsRead(Long chatId, Long userId) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found with id: " + chatId));

        // 验证用户是否有权限访问该聊天
        if (!chat.getUserOne().getId().equals(userId) && !chat.getUserTwo().getId().equals(userId)) {
            throw new SecurityException("You don't have permission to access this chat");
        }

        // 更新未读消息计数
        if (chat.getUserOne().getId().equals(userId)) {
            chat.setUserOneUnreadCount(0);
        } else {
            chat.setUserTwoUnreadCount(0);
        }

        chatRepository.save(chat);
    }

    @Override
    @Transactional
    public void deleteChat(Long chatId, Long userId) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found with id: " + chatId));

        // 验证用户是否有权限访问该聊天
        if (!chat.getUserOne().getId().equals(userId) && !chat.getUserTwo().getId().equals(userId)) {
            throw new SecurityException("You don't have permission to delete this chat");
        }

        Long otherUserId = chat.getUserOne().getId().equals(userId) ? chat.getUserTwo().getId() : chat.getUserOne().getId();
        
        // 获取两用户之间的所有消息
        PageRequest pageRequest = PageRequest.of(0, Integer.MAX_VALUE, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Message> messages = messageRepository.findMessagesBetweenUsers(userId, otherUserId, pageRequest);
        
        // 删除消息
        messageRepository.deleteAll(messages.getContent());

        // 删除聊天
        chatRepository.delete(chat);
    }

    // 辅助方法
    private User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }

    private ChatDTO convertToDTO(Chat chat, Long currentUserId) {
        User otherUser;
        Integer unreadCount;

        if (chat.getUserOne().getId().equals(currentUserId)) {
            otherUser = chat.getUserTwo();
            unreadCount = chat.getUserOneUnreadCount();
        } else {
            otherUser = chat.getUserOne();
            unreadCount = chat.getUserTwoUnreadCount();
        }

        return ChatDTO.builder()
                .id(chat.getId().toString())
                .name(chat.getIsGroup() != null && chat.getIsGroup() ? chat.getGroupName() : otherUser.getUsername())
                .avatar(null) // User类没有avatar字段，可能需要从其他地方获取
                .lastMessage(chat.getLastMessage())
                .lastMessageTime(chat.getLastMessageTime())
                .unreadCount(unreadCount)
                .online(false) // 在线状态需要通过其他方式获取
                .lastSeen(null) // 最后在线时间需要通过其他方式获取
                .isGroup(chat.getIsGroup())
                .isSystem(false)
                .build();
    }

    private MessageDTO convertToMessageDTO(Message message, Long currentUserId) {
        String direction = message.getSender() != null && message.getSender().getId().equals(currentUserId) ? "sent" : "received";
        
        return MessageDTO.builder()
                .id(message.getId().toString())
                .content(message.getContent())
                .timestamp(message.getCreatedAt())
                .sender(message.getSender() != null ? MessageDTO.UserDTO.builder()
                        .id(message.getSender().getId().toString())
                        .name(message.getSender().getUsername())
                        .avatar(null) // User类没有avatar字段，可能需要从其他地方获取
                        .build() : null)
                .direction(direction)
                .status(message.getIsRead() ? "read" : "delivered")
                .build();
    }
} 