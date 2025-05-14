package com.campus.assistance.service.impl;

import com.campus.assistance.entity.Order;
import com.campus.assistance.model.User;
import com.campus.assistance.repository.OrderRepository;
import com.campus.assistance.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class OrderServiceImpl implements OrderService {
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Override
    public Order createOrder(Order order) {
        return orderRepository.save(order);
    }
    
    @Override
    public Optional<Order> getOrderById(Long id) {
        return orderRepository.findById(id);
    }
    
    @Override
    public Optional<Order> getOrderByNumber(String orderNumber) {
        return orderRepository.findByOrderNumber(orderNumber);
    }
    
    @Override
    public List<Order> getOrdersByBuyer(User buyer) {
        return orderRepository.findByBuyerOrderByCreatedAtDesc(buyer);
    }
    
    @Override
    public List<Order> getOrdersBySeller(User seller) {
        return orderRepository.findBySellerOrderByCreatedAtDesc(seller);
    }
    
    @Override
    public List<Order> getOrdersByBuyerAndStatus(User buyer, String status) {
        return orderRepository.findByBuyerAndStatusOrderByCreatedAtDesc(buyer, status);
    }
    
    @Override
    public List<Order> getOrdersBySellerAndStatus(User seller, String status) {
        return orderRepository.findBySellerAndStatusOrderByCreatedAtDesc(seller, status);
    }
    
    @Override
    @Transactional
    public Order updateOrderStatus(Order order, String status) {
        order.setStatus(status);
        order.setUpdatedAt(LocalDateTime.now());
        return orderRepository.save(order);
    }
    
    @Override
    public void deleteOrder(Order order) {
        orderRepository.delete(order);
    }
} 