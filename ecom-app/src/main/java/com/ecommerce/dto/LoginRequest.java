// File: src/main/java/com/ecommerce/dto/LoginRequest.java
package com.ecommerce.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginRequest {
    @NotBlank(message = "Login ID is required")
    private String loginId;

    @NotBlank(message = "Password is required")
    private String password;
}