package com.campus.assistance.repository;

import com.campus.assistance.entity.Order;
import com.campus.assistance.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    Optional<Order> findByOrderNumber(String orderNumber);
    
    List<Order> findByBuyerOrderByCreatedAtDesc(User buyer);
    
    List<Order> findBySellerOrderByCreatedAtDesc(User seller);
    
    List<Order> findByBuyerAndStatusOrderByCreatedAtDesc(User buyer, String status);
    
    List<Order> findBySellerAndStatusOrderByCreatedAtDesc(User seller, String status);
} 