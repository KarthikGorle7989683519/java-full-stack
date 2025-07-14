// File: src/main/java/com/ecommerce/dto/AuthResponse.java
package com.ecommerce.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String token;
    private Long userId;
    private String username;
    private String role;
}