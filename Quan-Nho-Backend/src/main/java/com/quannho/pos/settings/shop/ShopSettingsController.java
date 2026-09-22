package com.quannho.pos.settings.shop;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController @RequestMapping("/api/settings")
public class ShopSettingsController {
    private final JdbcTemplate jdbc;
    public ShopSettingsController(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @GetMapping("/shop") public Map<String, Object> shop() {
        return jdbc.queryForList("SELECT id,shop_name,store_subtitle,phone,shop_address,wifi_name," +
                "wifi_password_encrypted,receipt_message,show_wifi_on_receipt FROM shop_settings ORDER BY id LIMIT 1")
                .stream().findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @PutMapping("/shop") public Map<String, Object> update(@RequestBody Map<String, Object> body) {
        String name = String.valueOf(body.getOrDefault("shop_name", "")).trim();
        if (name.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên quán không được để trống");
        jdbc.update("UPDATE shop_settings SET shop_name=?,store_subtitle=?,phone=?,shop_address=?,wifi_name=?," +
                "wifi_password_encrypted=?,receipt_message=?,show_wifi_on_receipt=?,updated_at=now() " +
                "WHERE id=(SELECT id FROM shop_settings ORDER BY id LIMIT 1)",
                name, body.get("store_subtitle"), body.get("phone"), body.get("shop_address"),
                body.get("wifi_name"), body.get("wifi_password_encrypted"), body.get("receipt_message"),
                body.getOrDefault("show_wifi_on_receipt", true));
        return shop();
    }

    @GetMapping("/sepay") public Map<String, Object> sepay() {
        return jdbc.queryForList("SELECT id,api_key_last4,is_configured FROM sepay_settings ORDER BY id LIMIT 1")
                .stream().findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @PostMapping("/sepay/key") public Map<String, Object> saveSepayKey() {
        throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED,
                "SePay webhook chưa được triển khai; không lưu API key giả");
    }
}
