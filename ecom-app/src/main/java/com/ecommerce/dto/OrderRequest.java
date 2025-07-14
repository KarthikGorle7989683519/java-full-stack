// File: src/main/java/com/ecommerce/dto/OrderRequest.java
package com.ecommerce.dto;

import com.ecommerce.entity.ShippingInfo;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class OrderRequest {
    @NotEmpty(message = "Cart items cannot be empty")
    private List<CartItemDto> items;

    @NotBlank(message = "Payment method is required")
    private String paymentMethod;

    @NotNull(message = "Shipping info is required")
    @Valid
    private ShippingInfo shippingInfo;
}