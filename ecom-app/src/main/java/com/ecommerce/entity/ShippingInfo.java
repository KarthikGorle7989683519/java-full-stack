// File: src/main/java/com/ecommerce/entity/ShippingInfo.java
package com.ecommerce.entity;

import jakarta.persistence.Embeddable;
import lombok.*;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShippingInfo {
    private String name;
    private String phoneNum;
    private String address;
    private String city;
    private String state;
    private String zipCode;
    private String country;
}