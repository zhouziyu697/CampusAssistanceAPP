package com.campus.assistance.controller;

import com.campus.assistance.dto.AuthResponse;
import com.campus.assistance.dto.LoginRequest;
import com.campus.assistance.dto.RegisterRequest;
import com.campus.assistance.service.AuthService;
import com.campus.assistance.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;
import java.util.HashMap;
import java.util.Map;
import java.util.Date;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:8000")
public class AuthController {
    @Autowired
    private AuthService authService;

    @Autowired
    private JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("注册失败: ", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            log.info("尝试登录: {}", request.getStudentId());
            AuthResponse response = authService.login(request);
            log.info("登录成功: {}", request.getStudentId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("登录失败: ", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * 简单的ping测试端点
     */
    @GetMapping("/ping")
    public ResponseEntity<Map<String, String>> ping() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "服务器正常运行");
        response.put("timestamp", new Date().toString());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/test-cors")
    @CrossOrigin(origins = "*")
    public ResponseEntity<?> testCors() {
        return ResponseEntity.ok(Map.of("message", "CORS测试成功"));
    }

    @GetMapping("/verify-token")
    @CrossOrigin(origins = "*")
    public ResponseEntity<?> verifyToken(@RequestParam(required=false) String token) {
        if (token == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Token不存在"));
        }
        try {
            String username = jwtService.extractUsername(token);
            return ResponseEntity.ok(Map.of(
                "valid", true,
                "username", username
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "valid", false,
                "error", e.getMessage()
            ));
        }
    }
} 