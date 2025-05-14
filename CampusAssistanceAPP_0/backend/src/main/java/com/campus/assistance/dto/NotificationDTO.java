package com.campus.assistance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private String id;
    private String title;
    private String content;
    private LocalDateTime createdAt;
    private String status;
    private String type;
} 