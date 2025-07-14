// File: src/main/java/com/ecommerce/controller/OrderController.java
package com.ecommerce.Controller;

import com.ecommerce.dto.OrderConfirmationDto;
import com.ecommerce.dto.OrderDto;
import com.ecommerce.dto.OrderRequest;
import com.ecommerce.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderConfirmationDto> placeOrder(
            @RequestBody OrderRequest orderRequest,
            @AuthenticationPrincipal UserDetails userDetails) {
        System.out.println("Received order request: " + orderRequest);
        System.out.println("User email: " + userDetails.getUsername());
        return ResponseEntity.ok(orderService.placeOrder(orderRequest, userDetails.getUsername()));
    }

    @GetMapping
    public ResponseEntity<List<OrderDto>> getUserOrders(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(orderService.getUserOrders(userDetails.getUsername()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderDto> getOrderDetails(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderDetails(id));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<OrderDto>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @PutMapping("/admin/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OrderDto> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
    }
}