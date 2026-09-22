package com.quannho.pos.catalog.option;

import com.quannho.pos.catalog.product.Product;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.OffsetDateTime;

@Entity @Table(name = "product_option_groups", uniqueConstraints = @UniqueConstraint(name = "uq_product_option_groups", columnNames = {"product_id", "option_group_id"})) @Getter @Setter
public class ProductOptionGroup {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "product_id", nullable = false) private Product product;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "option_group_id", nullable = false) private OptionGroup optionGroup;
    @Column(name = "is_required", nullable = false) private boolean required;
    @Column(name = "min_select", nullable = false) private int minSelect;
    @Column(name = "max_select", nullable = false) private int maxSelect = 1;
    @Column(name = "display_order", nullable = false) private int displayOrder;
    @Column(name = "created_at", nullable = false, updatable = false) private OffsetDateTime createdAt;
    @PrePersist void onCreate() { createdAt = OffsetDateTime.now(); }
}
