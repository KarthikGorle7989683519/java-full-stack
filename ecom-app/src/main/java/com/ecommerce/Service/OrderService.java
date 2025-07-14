// File: src/main/java/com/ecommerce/service/OrderService.java
package com.ecommerce.service;

import com.ecommerce.dto.*;
import com.ecommerce.entity.*;
import com.ecommerce.exception.InsufficientStockException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Transactional
    public OrderConfirmationDto placeOrder(OrderRequest orderRequest, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Order order = new Order();
        order.setUser(user);
        order.setOrderDate(LocalDateTime.now());
        order.setStatus(Order.OrderStatus.PENDING);
        order.setPaymentMethod(orderRequest.getPaymentMethod());
        order.setShippingInfo(orderRequest.getShippingInfo());

        double subtotal = 0;
        for (CartItemDto item : orderRequest.getItems()) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

            if (product.getQuantity() < item.getQuantity()) {
                throw new InsufficientStockException("Insufficient stock for product: " + product.getName());
            }

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(item.getQuantity());
            orderItem.setPriceAtOrder(product.getCost());

            subtotal += product.getCost() * item.getQuantity();

            // Update product stock
            product.setQuantity(product.getQuantity() - item.getQuantity());
            productRepository.save(product);

            order.getItems().add(orderItem);
        }

        double shipping = subtotal >= 1000 ? 0 : 50;
        double total = subtotal + shipping;

        order.setSubtotal(subtotal);
        order.setShipping(shipping);
        order.setTotal(total);

        Order savedOrder = orderRepository.save(order);

        return OrderConfirmationDto.builder()
                .orderId(savedOrder.getId())
                .orderDate(savedOrder.getOrderDate())
                .status(savedOrder.getStatus().name())
                .total(total)
                .build();
    }

    public List<OrderDto> getUserOrders(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return orderRepository.findByUser(user).stream()
                .map(this::convertToDto)
                .toList();
    }

    public List<OrderDto> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(this::convertToDto)
                .toList();
    }

    public OrderDto updateOrderStatus(Long orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        order.setStatus(Order.OrderStatus.valueOf(status));
        Order updatedOrder = orderRepository.save(order);
        return convertToDto(updatedOrder);
    }

    public OrderDto getOrderDetails(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        return convertToDto(order);
    }

    private OrderDto convertToDto(Order order) {
        return OrderDto.builder()
                .id(order.getId())
                .userId(order.getUser().getId())
                .orderDate(order.getOrderDate())
                .status(order.getStatus().name())
                .subtotal(order.getSubtotal())
                .shipping(order.getShipping())
                .total(order.getTotal())
                .paymentMethod(order.getPaymentMethod())
                .shippingInfo(order.getShippingInfo())
                .items(order.getItems().stream()
                        .map(this::convertItemToDto)
                        .toList())
                .build();
    }

    private OrderItemDto convertItemToDto(OrderItem item) {
        return OrderItemDto.builder()
                .productId(item.getProduct().getId())
                .productName(item.getProduct().getName())
                .quantity(item.getQuantity())
                .price(item.getPriceAtOrder())
                .imageUrl(item.getProduct().getImageUrl())
                .build();
    }
}