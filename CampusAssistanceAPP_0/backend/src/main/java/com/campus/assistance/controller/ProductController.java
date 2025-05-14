package com.campus.assistance.controller;

import com.campus.assistance.dto.ProductDTO;
import com.campus.assistance.enums.ProductStatus;
import com.campus.assistance.enums.ProductType;
import com.campus.assistance.model.User;
import com.campus.assistance.repository.UserRepository;
import com.campus.assistance.exception.ResourceNotFoundException;
import com.campus.assistance.service.ProductService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ProductController {

    private final ProductService productService;
    private final UserRepository userRepository;
    
    public ProductController(ProductService productService, UserRepository userRepository) {
        this.productService = productService;
        this.userRepository = userRepository;
    }

    /**
     * 创建新商品
     */
    @PostMapping
    public ResponseEntity<ProductDTO> createProduct(@Valid @RequestBody ProductDTO productDTO) {
        try {
            Long userId = getCurrentUserId();
            
            // 设置默认类型为普通商品
            if (productDTO.getType() == null) {
                productDTO.setType(ProductType.NORMAL);
            }
            
            // 设置默认状态为活跃
            if (productDTO.getStatus() == null) {
                productDTO.setStatus(ProductStatus.ACTIVE);
            }
            
            ProductDTO createdProduct = productService.createProduct(productDTO, userId);
            return new ResponseEntity<>(createdProduct, HttpStatus.CREATED);
        } catch (Exception e) {
            e.printStackTrace();
            throw e; // 重新抛出异常，交给全局异常处理器
        }
    }

    /**
     * 获取所有商品（分页）
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "publishTime") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        
        Sort.Direction sortDirection = direction.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
        
        Page<ProductDTO> productPage = productService.getAllActiveProducts(pageable);
        
        Map<String, Object> response = new HashMap<>();
        response.put("products", productPage.getContent());
        response.put("currentPage", productPage.getNumber());
        response.put("totalItems", productPage.getTotalElements());
        response.put("totalPages", productPage.getTotalPages());
        
        return ResponseEntity.ok(response);
    }

    /**
     * 获取指定分类的商品
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<Map<String, Object>> getProductsByCategory(
            @PathVariable String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "publishTime") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        
        Sort.Direction sortDirection = direction.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
        
        Page<ProductDTO> productPage = productService.getProductsByCategory(category, pageable);
        
        Map<String, Object> response = new HashMap<>();
        response.put("products", productPage.getContent());
        response.put("currentPage", productPage.getNumber());
        response.put("totalItems", productPage.getTotalElements());
        response.put("totalPages", productPage.getTotalPages());
        
        return ResponseEntity.ok(response);
    }

    /**
     * 获取指定状态的商品（仅供用户自己查看）
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<ProductDTO>> getProductsByStatus(@PathVariable String status) {
        Long userId = getCurrentUserId();
        ProductStatus productStatus = ProductStatus.valueOf(status.toUpperCase());
        List<ProductDTO> products = productService.getProductsByUserAndStatus(userId, productStatus);
        return ResponseEntity.ok(products);
    }

    /**
     * 获取用户自己的所有商品
     */
    @GetMapping("/user")
    public ResponseEntity<List<ProductDTO>> getUserProducts(
            @RequestParam(required = false) String status) {
        Long userId = getCurrentUserId();
        
        if (status != null && !status.isEmpty()) {
            ProductStatus productStatus = ProductStatus.valueOf(status.toUpperCase());
            return ResponseEntity.ok(productService.getProductsByUserAndStatus(userId, productStatus));
        } else {
            return ResponseEntity.ok(productService.getProductsByUser(userId));
        }
    }

    /**
     * 根据ID获取商品详情
     */
    @GetMapping("/{id}")
    public ResponseEntity<ProductDTO> getProductById(@PathVariable Long id) {
        ProductDTO product = productService.getProductById(id);
        // 增加浏览次数
        productService.incrementViewCount(id);
        return ResponseEntity.ok(product);
    }

    /**
     * 更新商品信息
     */
    @PutMapping("/{id}")
    public ResponseEntity<ProductDTO> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductDTO productDTO) {
        Long userId = getCurrentUserId();
        ProductDTO updatedProduct = productService.updateProduct(id, productDTO, userId);
        return ResponseEntity.ok(updatedProduct);
    }

    /**
     * 更新商品状态
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ProductDTO> updateProductStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> statusMap) {
        Long userId = getCurrentUserId();
        String statusStr = statusMap.get("status");
        
        if (statusStr == null || statusStr.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        ProductStatus status = ProductStatus.valueOf(statusStr.toUpperCase());
        ProductDTO updatedProduct = productService.updateProductStatus(id, status, userId);
        return ResponseEntity.ok(updatedProduct);
    }

    /**
     * 删除商品
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        productService.deleteProduct(id, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 搜索商品
     */
    @GetMapping("/search")
    public ResponseEntity<Page<ProductDTO>> searchProducts(
            @RequestParam String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) String condition,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false, defaultValue = "NORMAL") String productType) {
        
        try {
            System.out.println("接收到搜索请求(处理前): keyword=" + keyword + ", category=" + category 
                    + ", condition=" + condition + ", minPrice=" + minPrice + ", maxPrice=" + maxPrice
                    + ", productType=" + productType);
            
            // 显式处理"全部"分类，使用与筛选功能相同的特殊标记值
            if (category == null || category.isEmpty() || "全部".equals(category)) {
                System.out.println("搜索全部分类，设置category为特殊标记值");
                category = "ALL_CATEGORIES";
            }
            
            System.out.println("处理后的搜索参数: category=" + category + ", condition=" + condition);
            
            Pageable pageable = PageRequest.of(page, size);
            
            // 根据商品类型决定调用哪个搜索方法
            ProductType type = ProductType.valueOf(productType);
            Page<ProductDTO> products;
            
            if (type == ProductType.WANTED) {
                // 搜索求购商品
                products = productService.searchWantedProducts(keyword, pageable);
            } else {
                // 搜索普通出售商品
                products = productService.searchProducts(keyword, category, minPrice, maxPrice, condition, pageable);
            }
            
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * 筛选商品
     */
    @GetMapping("/filter")
    public ResponseEntity<Map<String, Object>> filterProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String condition,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "publishTime") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        
        System.out.println("接收到筛选请求(处理前): category=" + category + ", condition=" + condition 
                + ", minPrice=" + minPrice + ", maxPrice=" + maxPrice);
        
        // 显式处理"全部"分类，将其设为null，表示不添加分类过滤条件
        // 原来的方式是设置为空字符串，但可能依然导致SQL查询条件变为"category IS NULL"
        if (category == null || category.isEmpty() || "全部".equals(category)) {
            System.out.println("检测到全部分类，将category设置为特殊标记值");
            category = "ALL_CATEGORIES"; // 使用特殊标记值
        }
        
        System.out.println("处理后的筛选参数: category=" + category + ", condition=" + condition);
        
        Sort.Direction sortDirection = direction.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
        
        Page<ProductDTO> productPage = productService.filterProducts(category, condition, minPrice, maxPrice, pageable);
        
        Map<String, Object> response = new HashMap<>();
        response.put("products", productPage.getContent());
        response.put("currentPage", productPage.getNumber());
        response.put("totalItems", productPage.getTotalElements());
        response.put("totalPages", productPage.getTotalPages());
        
        return ResponseEntity.ok(response);
    }

    /**
     * 获取当前登录用户ID
     */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("用户未登录");
        }

        String studentId = authentication.getName();
        try {
            // 尝试根据studentId查找用户
            User user = userRepository.findByStudentId(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("找不到学号为 " + studentId + " 的用户"));
            return user.getId();
        } catch (NumberFormatException e) {
            // 如果无法解析为数字ID，则查找用户记录
            throw new RuntimeException("无效的用户ID: " + studentId, e);
        }
    }
} 