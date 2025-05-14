package com.campus.assistance.service;

import com.campus.assistance.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {
    private static final Logger log = LoggerFactory.getLogger(JwtService.class);
    @Value("${jwt.secret}")
    private String secretKey;
    @Value("${jwt.expiration}")
    private long jwtExpiration;

    public String generateToken(User user) {
        return generateToken(new HashMap<>(), user);
    }

    public String generateToken(Map<String, Object> extraClaims, User user) {
        return Jwts
                .builder()
                .setClaims(extraClaims)
                .setSubject(user.getStudentId())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        try {
            return extractClaim(token, Claims::getSubject);
        } catch (Exception e) {
            log.error("Error extracting username from token: {}", e.getMessage());
            return null;
        }
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        try {
            final Claims claims = extractAllClaims(token);
            return claimsResolver.apply(claims);
        } catch (Exception e) {
            log.error("Error extracting claim from token: {}", e.getMessage());
            return null;
        }
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            final String studentId = extractUsername(token);
            log.info("验证Token有效性，提取的学号: {}, 当前用户: {}", studentId, userDetails.getUsername());
            
            // 如果userDetails是User类型，直接比较studentId
            if (userDetails instanceof com.campus.assistance.model.User) {
                com.campus.assistance.model.User user = (com.campus.assistance.model.User) userDetails;
                boolean studentIdMatch = (studentId != null) && studentId.equals(user.getStudentId());
                boolean notExpired = !isTokenExpired(token);
                
                log.info("学号匹配: {}, Token未过期: {}", studentIdMatch, notExpired);
                
                boolean isValid = studentIdMatch && notExpired;
                log.info("Token验证结果: {}", isValid);
                return isValid;
            } else {
                // 对于非User类型，使用原有的username比较
                boolean usernameMatch = (studentId != null) && studentId.equals(userDetails.getUsername());
                boolean notExpired = !isTokenExpired(token);
                
                log.info("用户名匹配: {}, Token未过期: {}", usernameMatch, notExpired);
                
                boolean isValid = usernameMatch && notExpired;
                log.info("Token验证结果: {}", isValid);
                return isValid;
            }
        } catch (Exception e) {
            log.error("验证Token出错: {}", e.getMessage(), e);
            return false;
        }
    }

    private boolean isTokenExpired(String token) {
        try {
            return extractExpiration(token).before(new Date());
        } catch (Exception e) {
            log.error("Error checking token expiration: {}", e.getMessage());
            return true;
        }
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        return Jwts
                .parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSignInKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes());
    }
} 