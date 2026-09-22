package com.quannho.pos.order;

import com.quannho.pos.catalog.option.OptionGroup;
import com.quannho.pos.catalog.option.OptionValue;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.OffsetDateTime;

@Entity @Table(name = "order_item_options") @Getter @Setter
public class OrderItemOption {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "order_item_id", nullable = false) private OrderItem orderItem;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "option_group_id") private OptionGroup optionGroup;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "option_value_id") private OptionValue optionValue;
    @Column(name = "group_name", nullable = false, length = 100) private String groupName;
    @Column(name = "option_name", nullable = false, length = 100) private String optionName;
    @Column(name = "extra_price", nullable = false) private long extraPrice;
    @Column(name = "created_at", nullable = false, updatable = false) private OffsetDateTime createdAt;
    @PrePersist void onCreate() { createdAt = OffsetDateTime.now(); }
}
