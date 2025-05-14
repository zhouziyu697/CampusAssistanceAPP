package com.campus.assistance.service;

import com.campus.assistance.entity.Order;
import com.campus.assistance.model.User;

import java.util.List;
import java.util.Optional;

public interface OrderService {
    
    Order createOrder(Order order);
    
    Optional<Order> getOrderById(Long id);
    
    Optional<Order> getOrderByNumber(String orderNumber);
    
    List<Order> getOrdersByBuyer(User buyer);
    
    List<Order> getOrdersBySeller(User seller);
    
    List<Order> getOrdersByBuyerAndStatus(User buyer, String status);
    
    List<Order> getOrdersBySellerAndStatus(User seller, String status);
    
    Order updateOrderStatus(Order order, String status);
    
    void deleteOrder(Order order);
} 