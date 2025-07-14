// File: src/main/java/com/ecommerce/dto/OrderItemDto.java
package com.ecommerce.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OrderItemDto {
    private Long productId;
    private String productName;
    private Integer quantity;
    private Double price;
    private String imageUrl;
}