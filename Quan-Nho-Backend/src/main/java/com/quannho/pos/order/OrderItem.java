package com.quannho.pos.order;

import com.quannho.pos.catalog.product.Product;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.OffsetDateTime;

@Entity @Table(name = "order_items") @Getter @Setter
public class OrderItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "order_id", nullable = false) private Order order;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "product_id") private Product product;
    @Column(name = "product_name", nullable = false, length = 200) private String productName;
    @Column(name = "base_price", nullable = false) private long basePrice;
    @Column(name = "option_extra_price", nullable = false) private long optionExtraPrice;
    @Column(name = "unit_price", nullable = false) private long unitPrice;
    @Column(nullable = false) private int quantity;
    @Column(name = "line_total", nullable = false) private long lineTotal;
    @Column(name = "customer_note", length = 500) private String customerNote;
    @Column(name = "created_at", nullable = false, updatable = false) private OffsetDateTime createdAt;
    @PrePersist void onCreate() { createdAt = OffsetDateTime.now(); }
}
