package com.ecommerce.Controller;

import com.ecommerce.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderConfirmationController {
    private final OrderRepository orderRepository;

    @GetMapping("/{orderId}/confirmation")
    public ResponseEntity<?> getOrderConfirmation(@PathVariable Long orderId) {
        return orderRepository.findById(orderId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}