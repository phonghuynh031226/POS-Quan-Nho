package com.quannho.pos.order;

import com.quannho.pos.auth.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.OffsetDateTime;

@Entity @Table(name = "orders") @Getter @Setter
public class Order {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "order_code", nullable = false, unique = true, length = 30) private String orderCode;
    @Column(unique = true, length = 100) private String token;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) private OrderStatus status = OrderStatus.PENDING_PAYMENT;
    @Enumerated(EnumType.STRING) @Column(name = "payment_status", nullable = false, length = 30) private PaymentStatus paymentStatus = PaymentStatus.UNPAID;
    @Enumerated(EnumType.STRING) @Column(name = "payment_method", length = 30) private PaymentMethod paymentMethod;
    @Column(nullable = false) private long subtotal;
    @Column(name = "discount_amount", nullable = false) private long discountAmount;
    @Column(name = "total_amount", nullable = false) private long totalAmount;
    @Column(name = "payment_amount") private Long paymentAmount;
    @Column(name = "cash_received") private Long cashReceived;
    @Column(name = "change_amount") private Long changeAmount;
    @Column(name = "sepay_transaction_id", length = 100) private String sepayTransactionId;
    @Column(name = "transfer_content", length = 100) private String transferContent;
    @Column(name = "customer_note", length = 1000) private String customerNote;
    @Column(name = "cancel_reason", length = 500) private String cancelReason;
    @Column(name = "refund_amount", nullable = false) private long refundAmount;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "created_by", nullable = false) private User createdBy;
    @Column(name = "created_at", nullable = false, updatable = false) private OffsetDateTime createdAt;
    @Column(name = "paid_at") private OffsetDateTime paidAt;
    @Column(name = "cancelled_at") private OffsetDateTime cancelledAt;
    @Column(name = "refunded_at") private OffsetDateTime refundedAt;
    @Column(name = "updated_at", nullable = false) private OffsetDateTime updatedAt;
    @PrePersist void onCreate() { createdAt = updatedAt = OffsetDateTime.now(); }
    @PreUpdate void onUpdate() { updatedAt = OffsetDateTime.now(); }
}
