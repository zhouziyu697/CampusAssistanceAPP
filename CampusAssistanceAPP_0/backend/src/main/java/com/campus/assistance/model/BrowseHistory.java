package com.campus.assistance.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;

@Data
@Entity
@Table(name = "browse_history")
public class BrowseHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "item_id", nullable = false)
    private Long itemId;
    
    @Column(name = "item_type", nullable = false)
    private String itemType;
    
    @Column(name = "type", nullable = false)
    private String type = "history";
    
    @Column(name = "title")
    private String title;
    
    @Column(name = "price")
    private BigDecimal price;
    
    @Column(name = "image")
    private String image;
    
    @Transient
    private List<String> images;
    
    @Column(name = "browse_time", nullable = false)
    private LocalDateTime browseTime;
    
    @PrePersist
    protected void onCreate() {
        browseTime = LocalDateTime.now();
        if (type == null) {
            type = "history";
        }
    }
} 