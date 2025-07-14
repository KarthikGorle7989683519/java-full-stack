// File: src/main/java/com/ecommerce/dto/OrderConfirmationDto.java
package com.ecommerce.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class OrderConfirmationDto {
    private Long orderId;
    private LocalDateTime orderDate;
    private String status;
    private Double total;
}