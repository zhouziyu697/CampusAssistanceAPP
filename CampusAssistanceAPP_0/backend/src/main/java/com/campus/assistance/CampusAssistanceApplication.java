package com.campus.assistance;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.io.File;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@SpringBootApplication
public class CampusAssistanceApplication {

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    public static void main(String[] args) {
        SpringApplication.run(CampusAssistanceApplication.class, args);
    }
    
    /**
     * 应用启动时创建必要的目录
     */
    @Bean
    CommandLineRunner init() {
        return args -> {
            // 创建上传根目录
            File uploadRootDir = new File(uploadDir);
            if (!uploadRootDir.exists()) {
                uploadRootDir.mkdirs();
                log.info("创建上传根目录: {}", uploadRootDir.getAbsolutePath());
            }
            
            // 创建头像上传目录
            File avatarDir = new File(uploadDir + "/avatars");
            if (!avatarDir.exists()) {
                avatarDir.mkdirs();
                log.info("创建头像上传目录: {}", avatarDir.getAbsolutePath());
            }
            
            // 创建商品图片上传目录
            File productDir = new File(uploadDir + "/products");
            if (!productDir.exists()) {
                productDir.mkdirs();
                log.info("创建商品图片上传目录: {}", productDir.getAbsolutePath());
            }
            
            log.info("文件上传目录已初始化");
        };
    }
} 