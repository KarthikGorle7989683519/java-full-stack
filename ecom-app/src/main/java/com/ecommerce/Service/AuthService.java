// File: src/main/java/com/ecommerce/service/AuthService.java
package com.ecommerce.Service;

import com.ecommerce.dto.AuthResponse;
import com.ecommerce.dto.LoginRequest;
import com.ecommerce.dto.RegisterRequest;
import com.ecommerce.entity.User;
import com.ecommerce.exception.EcommerceException;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EcommerceException("Email already in use");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new EcommerceException("Username already taken!");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .phoneNum(request.getPhoneNum())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.valueOf(request.getRole()))
                .build();

        userRepository.save(user);

        var jwtToken = jwtService.generateToken(user);
        return AuthResponse.builder()
                .token(jwtToken)
                .userId(user.getId())
                .role(user.getRole().name())
                .username(user.getUsername())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getLoginId(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getLoginId())
                .or(() -> userRepository.findByUsername(request.getLoginId()))
                .orElseThrow(() -> new EcommerceException("User not found"));

        var jwtToken = jwtService.generateToken(user);
        return AuthResponse.builder()
                .token(jwtToken)
                .userId(user.getId())
                .role(user.getRole().name())
                .username(user.getUsername())
                .build();
    }
}