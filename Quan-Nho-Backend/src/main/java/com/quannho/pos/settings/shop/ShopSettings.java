package com.quannho.pos.settings.shop;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.OffsetDateTime;

@Entity @Table(name = "shop_settings") @Getter @Setter
public class ShopSettings {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "shop_name", nullable = false, length = 150) private String shopName;
    @Column(name = "store_subtitle", length = 200) private String storeSubtitle;
    @Column(length = 30) private String phone;
    @Column(name = "shop_address", length = 500) private String shopAddress;
    @Column(name = "wifi_name", length = 100) private String wifiName;
    @Column(name = "wifi_password_encrypted", columnDefinition = "text") private String wifiPasswordEncrypted;
    @Column(name = "receipt_message", length = 500) private String receiptMessage;
    @Column(name = "show_wifi_on_receipt", nullable = false) private boolean showWifiOnReceipt = true;
    @Column(name = "created_at", nullable = false, updatable = false) private OffsetDateTime createdAt;
    @Column(name = "updated_at", nullable = false) private OffsetDateTime updatedAt;
    @PrePersist void onCreate() { createdAt = updatedAt = OffsetDateTime.now(); }
    @PreUpdate void onUpdate() { updatedAt = OffsetDateTime.now(); }
}
