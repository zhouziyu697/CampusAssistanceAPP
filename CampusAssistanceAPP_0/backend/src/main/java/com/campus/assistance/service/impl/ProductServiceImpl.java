package com.campus.assistance.service.impl;

import com.campus.assistance.dto.ProductDTO;
import com.campus.assistance.entity.Product;
import com.campus.assistance.model.User;
import com.campus.assistance.enums.ProductStatus;
import com.campus.assistance.enums.ProductType;
import com.campus.assistance.exception.ResourceNotFoundException;
import com.campus.assistance.exception.UnauthorizedException;
import com.campus.assistance.repository.ProductRepository;
import com.campus.assistance.repository.UserRepository;
import com.campus.assistance.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ProductDTO createProduct(ProductDTO productDTO, Long userId) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
    
            Product product = Product.builder()
                    .title(productDTO.getTitle())
                    .category(productDTO.getCategory())
                    .price(productDTO.getPrice())
                    .originalPrice(productDTO.getOriginalPrice())
                    .minPrice(productDTO.getMinPrice())
                    .maxPrice(productDTO.getMaxPrice())
                    .conditionLevel(productDTO.getConditionLevel())
                    .description(productDTO.getDescription())
                    .images(productDTO.getImages())
                    .tradeMethods(productDTO.getTradeMethods())
                    .contactInfo(productDTO.getContactInfo())
                    .user(user)
                    .status(productDTO.getStatus() != null ? productDTO.getStatus() : ProductStatus.ACTIVE)
                    .type(productDTO.getType() != null ? productDTO.getType() : ProductType.NORMAL)
                    .urgencyLevel(productDTO.getUrgencyLevel())
                    .expiryTime(productDTO.getExpiryTime())
                    .publishTime(productDTO.getStatus() == ProductStatus.ACTIVE ? LocalDateTime.now() : null)
                    .lastModified(LocalDateTime.now())
                    .viewCount(0)
                    .build();
    
            System.out.println("保存商品前: " + product);
            Product savedProduct = productRepository.save(product);
            System.out.println("保存商品后: " + savedProduct);
            return convertToDTO(savedProduct);
        } catch (Exception e) {
            System.err.println("创建商品时发生错误: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @Override
    public ProductDTO getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("商品不存在"));
        
        return convertToDTO(product);
    }

    @Override
    @Transactional
    public ProductDTO updateProduct(Long id, ProductDTO productDTO, Long userId) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("商品不存在"));
        
        // 检查权限
        if (!product.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("无权修改该商品");
        }
        
        // 更新商品信息
        product.setTitle(productDTO.getTitle());
        product.setCategory(productDTO.getCategory());
        product.setPrice(productDTO.getPrice());
        product.setOriginalPrice(productDTO.getOriginalPrice());
        product.setMinPrice(productDTO.getMinPrice());
        product.setMaxPrice(productDTO.getMaxPrice());
        product.setConditionLevel(productDTO.getConditionLevel());
        product.setDescription(productDTO.getDescription());
        product.setImages(productDTO.getImages());
        product.setTradeMethods(productDTO.getTradeMethods());
        product.setContactInfo(productDTO.getContactInfo());
        product.setUrgencyLevel(productDTO.getUrgencyLevel());
        product.setExpiryTime(productDTO.getExpiryTime());
        
        // 如果状态发生变化
        if (productDTO.getStatus() != null && product.getStatus() != productDTO.getStatus()) {
            product.setStatus(productDTO.getStatus());
            if (productDTO.getStatus() == ProductStatus.ACTIVE && product.getPublishTime() == null) {
                product.setPublishTime(LocalDateTime.now());
            }
        }
        
        product.setLastModified(LocalDateTime.now());
        Product updatedProduct = productRepository.save(product);
        
        return convertToDTO(updatedProduct);
    }

    @Override
    @Transactional
    public ProductDTO updateProductStatus(Long id, ProductStatus status, Long userId) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("商品不存在"));
        
        // 检查权限
        if (!product.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("无权修改该商品");
        }
        
        product.setStatus(status);
        product.setLastModified(LocalDateTime.now());
        
        // 如果状态变为ACTIVE，并且以前没有发布时间，设置发布时间
        if (status == ProductStatus.ACTIVE && product.getPublishTime() == null) {
            product.setPublishTime(LocalDateTime.now());
        }
        
        Product updatedProduct = productRepository.save(product);
        return convertToDTO(updatedProduct);
    }

    @Override
    @Transactional
    public void deleteProduct(Long id, Long userId) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("商品不存在"));
        
        // 检查权限
        if (!product.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("无权删除该商品");
        }
        
        productRepository.delete(product);
    }

    @Override
    public Page<ProductDTO> getAllActiveProducts(Pageable pageable) {
        // 只查type为NORMAL的商品
        Page<Product> products = productRepository.findByTypeAndStatus(com.campus.assistance.enums.ProductType.NORMAL, com.campus.assistance.enums.ProductStatus.ACTIVE, pageable);
        return products.map(this::convertToDTO);
    }

    @Override
    public Page<ProductDTO> getProductsByCategory(String category, Pageable pageable) {
        Page<Product> products = productRepository.findByTypeAndCategoryAndStatus(
            com.campus.assistance.enums.ProductType.NORMAL, category, com.campus.assistance.enums.ProductStatus.ACTIVE, pageable
        );
        return products.map(this::convertToDTO);
    }

    @Override
    public Page<ProductDTO> searchProducts(String keyword, Pageable pageable) {
        Page<Product> products = productRepository.searchByKeyword(keyword, ProductStatus.ACTIVE, pageable);
        return products.map(this::convertToDTO);
    }

    @Override
    public Page<ProductDTO> filterProducts(String category, String condition, Double minPrice, Double maxPrice, Pageable pageable) {
        // 查询参数调试日志
        System.out.println("筛选商品参数: category=" + category + ", condition=" + condition 
                + ", minPrice=" + minPrice + ", maxPrice=" + maxPrice);
        
        // 使用Specification进行查询，与searchProducts方法类似
        try {
            Specification<Product> spec = (root, query, cb) -> {
                List<Predicate> predicates = new ArrayList<>();
                
                // 固定查询普通商品（非求购）
                predicates.add(cb.equal(root.get("type"), ProductType.NORMAL));
                
                // 只查询在售状态商品
                predicates.add(cb.equal(root.get("status"), ProductStatus.ACTIVE));
                
                // 分类过滤 - 修复"全部"分类的问题
                // 只添加分类条件当category不为特殊标记值"ALL_CATEGORIES"
                if (category != null && !category.isEmpty() && !category.equals("全部") && !category.equals("ALL_CATEGORIES")) {
                    System.out.println("添加分类过滤条件: " + category);
                    predicates.add(cb.equal(root.get("category"), category));
                } else {
                    System.out.println("不添加分类过滤条件，查询所有分类");
                }
                
                // 成色过滤
                if (condition != null && !condition.isEmpty() && !condition.equals("全部")) {
                    System.out.println("添加成色过滤条件: " + condition);
                    predicates.add(cb.equal(root.get("conditionLevel"), condition));
                } else {
                    System.out.println("不添加成色过滤条件，查询所有成色");
                }
                
                // 价格范围过滤
                if (minPrice != null) {
                    System.out.println("添加最低价格过滤条件: " + minPrice);
                    predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
                }
                if (maxPrice != null) {
                    System.out.println("添加最高价格过滤条件: " + maxPrice);
                    predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
                }
                
                System.out.println("生成的过滤条件数量: " + predicates.size());
                return cb.and(predicates.toArray(new Predicate[0]));
            };
            
            Page<Product> products = productRepository.findAll(spec, pageable);
            System.out.println("过滤查询结果：");
            System.out.println("- 总数量: " + products.getTotalElements());
            System.out.println("- 总页数: " + products.getTotalPages());
            System.out.println("- 当前页数据量: " + products.getContent().size());
            
            if (products.getContent().size() > 0) {
                System.out.println("查询到的第一个商品信息:");
                Product firstProduct = products.getContent().get(0);
                System.out.println("- ID: " + firstProduct.getId());
                System.out.println("- 标题: " + firstProduct.getTitle());
                System.out.println("- 分类: " + firstProduct.getCategory());
                System.out.println("- 成色: " + firstProduct.getConditionLevel());
            }
            
            return products.map(this::convertToDTO);
        } catch (Exception e) {
            System.err.println("筛选商品出错: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @Override
    public List<ProductDTO> getProductsByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
        
        List<Product> products = productRepository.findByUser(user);
        return products.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Override
    public List<ProductDTO> getProductsByUserAndStatus(Long userId, ProductStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
        
        List<Product> products = productRepository.findByUserAndStatus(user, status);
        return products.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void incrementViewCount(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("商品不存在"));
        
        product.setViewCount(product.getViewCount() + 1);
        productRepository.save(product);
    }
    
    /**
     * 将商品实体转换为DTO
     */
    @Override
    public ProductDTO convertToDTO(Product product) {
        return ProductDTO.builder()
                .id(product.getId())
                .title(product.getTitle())
                .category(product.getCategory())
                .price(product.getPrice())
                .originalPrice(product.getOriginalPrice())
                .minPrice(product.getMinPrice())
                .maxPrice(product.getMaxPrice())
                .conditionLevel(product.getConditionLevel())
                .description(product.getDescription())
                .images(product.getImages())
                .tradeMethods(product.getTradeMethods())
                .contactInfo(product.getContactInfo())
                .status(product.getStatus())
                .userId(product.getUser().getId())
                .userName(product.getUser().getUsername())
                .publishTime(product.getPublishTime())
                .lastModified(product.getLastModified())
                .viewCount(product.getViewCount())
                .type(product.getType())
                .urgencyLevel(product.getUrgencyLevel())
                .expiryTime(product.getExpiryTime())
                .build();
    }
    
    @Override
    public Page<ProductDTO> getWantedProducts(String category, String urgency, Pageable pageable) {
        // 如果有分类筛选和紧急程度筛选
        if (category != null && !category.isEmpty() && urgency != null && !urgency.isEmpty()) {
            return productRepository.findByTypeAndCategoryAndUrgencyLevelAndStatus(
                    ProductType.WANTED, category, urgency, ProductStatus.ACTIVE, pageable)
                    .map(this::convertToDTO);
        }
        // 如果只有分类筛选
        else if (category != null && !category.isEmpty()) {
            return productRepository.findByTypeAndCategoryAndStatus(
                    ProductType.WANTED, category, ProductStatus.ACTIVE, pageable)
                    .map(this::convertToDTO);
        }
        // 如果只有紧急程度筛选
        else if (urgency != null && !urgency.isEmpty()) {
            return productRepository.findByTypeAndUrgencyLevelAndStatus(
                    ProductType.WANTED, urgency, ProductStatus.ACTIVE, pageable)
                    .map(this::convertToDTO);
        }
        // 如果没有筛选条件
        else {
            return productRepository.findByTypeAndStatus(ProductType.WANTED, ProductStatus.ACTIVE, pageable)
                    .map(this::convertToDTO);
        }
    }
    
    @Override
    public Page<ProductDTO> searchWantedProducts(String keyword, Pageable pageable) {
        return productRepository.searchWantedProductsByKeyword(keyword, pageable)
                .map(this::convertToDTO);
    }
    
    @Override
    public List<ProductDTO> getUserWantedProducts(Long userId, String status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
        
        // 如果有状态筛选
        if (status != null && !status.isEmpty()) {
            ProductStatus productStatus = ProductStatus.valueOf(status.toUpperCase());
            return productRepository.findByUserAndTypeAndStatus(user, ProductType.WANTED, productStatus)
                    .stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        }
        // 如果没有状态筛选，返回所有状态的求购商品
        else {
            return productRepository.findByUserAndType(user, ProductType.WANTED)
                    .stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        }
    }

    @Override
    public List<ProductDTO> getProductsBySeller(Long userId) {
        // 直接调用获取用户商品的方法，因为功能相同
        return getProductsByUser(userId);
    }
    
    @Override
    public List<ProductDTO> getAllProducts() {
        // 获取所有商品，不分页
        List<Product> products = productRepository.findAll();
        return products.stream().map(this::convertToDTO).collect(Collectors.toList());
    }
    
    @Override
    public List<ProductDTO> searchProducts(String keyword) {
        // 搜索商品，不分页，只返回活跃状态的普通商品
        Pageable pageable = Pageable.unpaged();
        Page<Product> products = productRepository.searchByKeyword(keyword, ProductStatus.ACTIVE, pageable);
        return products.getContent().stream().map(this::convertToDTO).collect(Collectors.toList());
    }
    
    @Override
    public List<ProductDTO> getProductsByStatus(String status) {
        // 获取指定状态的商品
        ProductStatus productStatus = ProductStatus.valueOf(status.toUpperCase());
        List<Product> products = productRepository.findByStatus(productStatus);
        return products.stream().map(this::convertToDTO).collect(Collectors.toList());
    }
    
    @Override
    public List<ProductDTO> getProductsByCategory(String category) {
        // 获取指定分类的商品，只返回活跃状态的商品
        Pageable pageable = Pageable.unpaged();
        Page<Product> products = productRepository.findByCategoryAndStatus(category, ProductStatus.ACTIVE, pageable);
        return products.getContent().stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Override
    public Page<ProductDTO> searchProducts(String keyword, String category, Double minPrice, Double maxPrice, String condition, Pageable pageable) {
        System.out.println("构建搜索条件：");
        System.out.println("- 关键词: " + keyword);
        System.out.println("- 分类: " + category);
        System.out.println("- 价格区间: " + minPrice + " - " + maxPrice);
        System.out.println("- 成色: " + condition);
        
        try {
            Specification<Product> spec = (root, query, cb) -> {
                List<Predicate> predicates = new ArrayList<>();
                
                // 关键词搜索（标题和描述）
                if (keyword != null && !keyword.trim().isEmpty()) {
                    String pattern = "%" + keyword.trim() + "%";
                    predicates.add(cb.or(
                        cb.like(root.get("title"), pattern),
                        cb.like(root.get("description"), pattern)
                    ));
                }
                
                // 添加商品类型过滤条件，确保只返回普通商品(非求购)
                predicates.add(cb.equal(root.get("type"), ProductType.NORMAL));
                
                // 分类过滤 - 与filterProducts方法保持一致
                if (category != null && !category.isEmpty() && !category.equals("全部") && !category.equals("ALL_CATEGORIES")) {
                    System.out.println("添加分类过滤条件: " + category);
                    predicates.add(cb.equal(root.get("category"), category));
                } else {
                    System.out.println("不添加分类过滤条件，搜索所有分类");
                }
                
                // 价格范围过滤
                if (minPrice != null) {
                    System.out.println("添加最低价格过滤条件: " + minPrice);
                    predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
                }
                if (maxPrice != null) {
                    System.out.println("添加最高价格过滤条件: " + maxPrice);
                    predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
                }
                
                // 商品成色过滤
                if (condition != null && !condition.isEmpty() && !condition.equals("全部")) {
                    System.out.println("添加成色过滤条件: " + condition);
                    predicates.add(cb.equal(root.get("conditionLevel"), condition));
                } else {
                    System.out.println("不添加成色过滤条件，搜索所有成色");
                }
                
                // 只显示在售商品
                predicates.add(cb.equal(root.get("status"), ProductStatus.ACTIVE));
                
                System.out.println("生成的查询条件数量: " + predicates.size());
                return cb.and(predicates.toArray(new Predicate[0]));
            };
            
            Page<Product> products = productRepository.findAll(spec, pageable);
            System.out.println("查询结果：");
            System.out.println("- 总数量: " + products.getTotalElements());
            System.out.println("- 总页数: " + products.getTotalPages());
            System.out.println("- 当前页数据量: " + products.getContent().size());
            
            return products.map(this::convertToDTO);
        } catch (Exception e) {
            System.err.println("搜索出错：" + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
} 