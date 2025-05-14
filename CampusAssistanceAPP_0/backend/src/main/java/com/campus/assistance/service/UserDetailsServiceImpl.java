package com.campus.assistance.service;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.campus.assistance.repository.UserRepository;
import com.campus.assistance.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private static final Logger log = LoggerFactory.getLogger(UserDetailsServiceImpl.class);
    private final UserRepository userRepository;

    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String studentId) throws UsernameNotFoundException {
        log.info("通过学号加载用户: {}", studentId);
        
        try {
            User user = userRepository.findByStudentId(studentId)
                .orElseThrow(() -> new UsernameNotFoundException("用户不存在: " + studentId));
            
            log.info("成功加载用户: 学号={}, 用户名={}", user.getStudentId(), user.getDisplayName());
            return user;
        } catch (UsernameNotFoundException e) {
            log.error("用户不存在: {}", studentId);
            throw e;
        } catch (Exception e) {
            log.error("加载用户时发生错误: {}", e.getMessage(), e);
            throw new UsernameNotFoundException("加载用户时发生错误: " + e.getMessage(), e);
        }
    }
} 