package com.campus.assistance.repository;

import com.campus.assistance.model.BrowseHistory;
import com.campus.assistance.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface BrowseHistoryRepository extends JpaRepository<BrowseHistory, Long> {
    List<BrowseHistory> findByUserOrderByBrowseTimeDesc(User user);
    Optional<BrowseHistory> findByUserAndItemIdAndItemType(User user, Long itemId, String itemType);
    
    @Modifying
    @Transactional
    void deleteByUser(User user);
} 