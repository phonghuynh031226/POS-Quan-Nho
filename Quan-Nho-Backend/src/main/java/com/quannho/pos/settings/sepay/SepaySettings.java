package com.quannho.pos.settings.sepay;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.OffsetDateTime;

@Entity @Table(name = "sepay_settings") @Getter @Setter
public class SepaySettings {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "api_key_encrypted", columnDefinition = "text") private String apiKeyEncrypted;
    @Column(name = "api_key_last4", length = 4) private String apiKeyLast4;
    @Column(name = "is_configured", nullable = false) private boolean configured;
    @Column(name = "created_at", nullable = false, updatable = false) private OffsetDateTime createdAt;
    @Column(name = "updated_at", nullable = false) private OffsetDateTime updatedAt;
    @PrePersist void onCreate() { createdAt = updatedAt = OffsetDateTime.now(); }
    @PreUpdate void onUpdate() { updatedAt = OffsetDateTime.now(); }
}
