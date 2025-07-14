// File: src/main/java/com/ecommerce/dto/ProductDto.java
package com.ecommerce.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProductDto {
    private Long id;

    @NotBlank(message = "Product name is required")
    private String name;

    private String description;
    private String imageUrl;

    @NotNull(message = "Cost is required")
    @Min(value = 0, message = "Cost must be positive")
    private Double cost;

    @PositiveOrZero(message = "Rating must be positive or zero")
    private Double rating;

    @NotNull(message = "Quantity is required")
    @Min(value = 0, message = "Quantity must be positive")
    private Integer quantity;
}