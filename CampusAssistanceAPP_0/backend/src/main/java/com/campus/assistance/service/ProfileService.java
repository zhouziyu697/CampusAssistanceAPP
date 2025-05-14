package com.campus.assistance.service;

import com.campus.assistance.dto.ProfileResponse;
import com.campus.assistance.model.User;

import java.util.List;
import java.util.Map;

public interface ProfileService {
    ProfileResponse getProfile(User user);
    ProfileResponse updateProfile(User user, Map<String, Object> profileData);
    List<Map<String, Object>> getMessages(User user);
    List<Map<String, Object>> getBrowseHistory(User user);
    void addBrowseHistory(User user, Long productId);
    void addBrowseHistory(User user, Long productId, String type);
    List<Map<String, Object>> getDrafts(User user);
    List<Map<String, Object>> getFavorites(User user);
    void addFavorite(User user, String itemType, Long itemId);
    void removeFavorite(User user, String itemType, Long itemId);
    List<Map<String, Object>> getPurchasedItems(User user);
    List<Map<String, Object>> getWantedItems(User user);
    List<Map<String, Object>> getPublishedItems(User user);
    List<Map<String, Object>> getSoldItems(User user);
    /**
     * 清空用户浏览历史
     * @param user 当前用户
     */
    void clearBrowseHistory(User user);
} 