package com.campus.assistance.service;

import com.campus.assistance.dto.ProductDTO;
import com.campus.assistance.entity.Product;
import com.campus.assistance.enums.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ProductService {
    // 基础CRUD操作
    ProductDTO createProduct(ProductDTO productDTO, Long userId);
    ProductDTO getProductById(Long id);
    ProductDTO updateProduct(Long id, ProductDTO productDTO, Long userId);
    ProductDTO updateProductStatus(Long id, ProductStatus status, Long userId);
    void deleteProduct(Long id, Long userId);
    
    // 查询操作
    Page<ProductDTO> getAllActiveProducts(Pageable pageable);
    Page<ProductDTO> getProductsByCategory(String category, Pageable pageable);
    Page<ProductDTO> searchProducts(String keyword, Pageable pageable);
    Page<ProductDTO> searchProducts(String keyword, String category, Double minPrice, Double maxPrice, String condition, Pageable pageable);
    Page<ProductDTO> filterProducts(String category, String condition, Double minPrice, Double maxPrice, Pageable pageable);
    List<ProductDTO> getProductsByUser(Long userId);
    List<ProductDTO> getProductsByUserAndStatus(Long userId, ProductStatus status);
    
    // 其他操作
    void incrementViewCount(Long id);
    ProductDTO convertToDTO(Product product);
    
    // 求购商品相关操作
    Page<ProductDTO> getWantedProducts(String category, String urgency, Pageable pageable);
    Page<ProductDTO> searchWantedProducts(String keyword, Pageable pageable);
    List<ProductDTO> getUserWantedProducts(Long userId, String status);
    
    // 附加查询操作
    List<ProductDTO> getProductsBySeller(Long userId);
    List<ProductDTO> getAllProducts();
    List<ProductDTO> searchProducts(String keyword);
    List<ProductDTO> getProductsByStatus(String status);
    List<ProductDTO> getProductsByCategory(String category);
}
