package com.campus.assistance.security;

import com.campus.assistance.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.Collections;
import java.util.stream.Collectors;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtService jwtService, UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        log.info("JwtAuthenticationFilter initialized with JwtService and UserDetailsService");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String jwt = null;
        String studentId = null;
        
        log.info("开始处理请求: {} {}", request.getMethod(), request.getRequestURI());
        log.info("请求头: {}", Collections.list(request.getHeaderNames()).stream()
            .collect(Collectors.toMap(
                name -> name,
                request::getHeader
            )));
        
        // 1. 尝试从请求参数中获取token
        String tokenParam = request.getParameter("token");
        if (tokenParam != null && !tokenParam.isEmpty()) {
            jwt = tokenParam;
            try {
                studentId = jwtService.extractUsername(jwt);
                log.info("从URL参数成功解析token，用户: {}", studentId);
            } catch (Exception e) {
                log.error("从URL参数解析token失败: {}", e.getMessage());
            }
        }
        
        // 2. 如果URL参数中没有有效token，则尝试从Authorization头获取
        if (studentId == null) {
            final String authHeader = request.getHeader("Authorization");
            log.info("Authorization头: {}", authHeader);
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                jwt = authHeader.substring(7);
                try {
                    studentId = jwtService.extractUsername(jwt);
                    log.info("从Authorization头成功解析token，用户: {}", studentId);
                } catch (Exception e) {
                    log.error("从Authorization头解析token失败: {}", e.getMessage(), e);
                }
            } else {
                log.warn("找不到有效的Authorization头");
            }
        }

        // 如果找到有效的studentId且未认证，则进行认证
        if (studentId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                log.info("尝试加载用户: {}", studentId);
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(studentId);
                log.info("成功加载用户详情: {}, 权限: {}", userDetails.getUsername(), userDetails.getAuthorities());
                
                if (jwtService.isTokenValid(jwt, userDetails)) {
                    log.info("Token有效，设置认证信息");
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                    );
                    authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                    );
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    log.info("认证信息已设置到SecurityContext");
                } else {
                    log.warn("Token无效");
                }
            } catch (Exception e) {
                log.error("认证过程发生错误: {}", e.getMessage(), e);
            }
        } else {
            if (studentId == null) {
                log.warn("未找到有效token");
            } else {
                log.info("用户已认证: {}", studentId);
            }
        }
        
        filterChain.doFilter(request, response);
        log.info("请求处理完成: {} {}", request.getMethod(), request.getRequestURI());
    }
} 